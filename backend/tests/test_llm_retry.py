"""
P3.2 LLM 重试机制测试

职责：
- 验证可重试异常（超时/连接/429/5xx）触发指数退避重试
- 验证不可重试异常（4xx/AuthenticationError）直接抛出
- 验证重试耗尽后 reraise 原始异常
- 验证 max_retries=0 时不重试
- 验证流式调用 create 阶段的重试覆盖

与其他模块的关系：
- 依赖 models/llm.py 的 _call_with_retry / chat_completion / chat_completion_stream_events
- mock models.llm._get_client，不发起真实网络请求
- 测试用 asyncio.run()（pytest-asyncio 未安装），重试间隔通过
  config.llm.retry_backoff_base=0.0 压为零，避免测试变慢
"""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import httpx
import openai
import pytest

from config import get_config


# ---------------------------------------------------------------------------
# 异常构造辅助（按 openai SDK 签名）
# ---------------------------------------------------------------------------

def _httpx_request():
    return httpx.Request("POST", "https://api.test.com")


def _rate_limit_error():
    return openai.RateLimitError(
        message="test", response=httpx.Response(429, request=_httpx_request()), body=None
    )


def _internal_server_error():
    return openai.InternalServerError(
        message="test", response=httpx.Response(500, request=_httpx_request()), body=None
    )


def _auth_error():
    return openai.AuthenticationError(
        message="test", response=httpx.Response(401, request=_httpx_request()), body=None
    )


def _connection_error():
    return openai.APIConnectionError(request=_httpx_request())


def _timeout_error():
    return openai.APITimeoutError(request=_httpx_request())


# ---------------------------------------------------------------------------
# Fake 响应构造
# ---------------------------------------------------------------------------

def _make_nonstream_response(content="hello", finish="stop", usage=(10, 5, 15)):
    """构造非流式 chat completion 响应（SimpleNamespace 链）。"""
    msg = SimpleNamespace()
    msg.content = content
    msg.tool_calls = None
    choice = SimpleNamespace()
    choice.message = msg
    choice.finish_reason = finish
    resp = SimpleNamespace()
    resp.choices = [choice]
    u = SimpleNamespace()
    u.prompt_tokens, u.completion_tokens, u.total_tokens = usage
    resp.usage = u
    return resp


def _make_chunk(content=None, finish=None, usage=None):
    """构造流式 chunk（delta 文本 / finish_reason / usage 可组合）。"""
    chunk = SimpleNamespace()
    chunk.choices = []
    if content is not None or finish is not None:
        delta = SimpleNamespace()
        delta.content = content
        delta.tool_calls = None
        choice = SimpleNamespace()
        choice.delta = delta
        choice.finish_reason = finish
        chunk.choices = [choice]
    if usage is not None:
        u = SimpleNamespace()
        u.prompt_tokens, u.completion_tokens, u.total_tokens = usage
        chunk.usage = u
    return chunk


async def _fake_stream():
    """两段 delta + 一个带 finish/usage 的收尾 chunk。"""
    yield _make_chunk(content="hel")
    yield _make_chunk(content="lo")
    yield _make_chunk(finish="stop", usage=(1, 1, 2))


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def fake_client():
    """mock 的 AsyncOpenAI 客户端（_get_client 返回它）。"""
    client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(create=AsyncMock())
        )
    )
    return client


@pytest.fixture
def patch_get_client(monkeypatch, fake_client):
    """把 models.llm._get_client 替换为返回 fake_client。"""
    import models.llm as llm_module
    monkeypatch.setattr(llm_module, "_get_client", lambda model: fake_client)
    return fake_client


@pytest.fixture
def fast_retry():
    """
    重试间隔压零 + 自动恢复：
    - retry_backoff_base=0.0 → wait_exponential 每次等待 0s（before_sleep 日志仍触发）
    - max_retries 由各用例自行设置，本 fixture 只负责恢复
    """
    cfg = get_config()
    original_base = cfg.llm.retry_backoff_base
    original_max = cfg.llm.max_retries
    cfg.llm.retry_backoff_base = 0.0
    yield cfg.llm
    cfg.llm.retry_backoff_base = original_base
    cfg.llm.max_retries = original_max


# ---------------------------------------------------------------------------
# 强制用例 1：可重试异常触发重试
# ---------------------------------------------------------------------------

def test_retryable_exception_retries(patch_get_client, fast_retry):
    """RateLimitError 前 2 次失败，第 3 次成功 → create 调用 3 次，正常返回。"""
    from models.llm import chat_completion

    fast_retry.max_retries = 3
    create = patch_get_client.chat.completions.create
    create.side_effect = [
        _rate_limit_error(),
        _rate_limit_error(),
        _make_nonstream_response(content="recovered"),
    ]

    async def run():
        return await chat_completion(
            model="deepseek-chat",
            messages=[{"role": "user", "content": "hi"}],
        )

    result = asyncio.run(run())

    assert create.call_count == 3
    assert result.content == "recovered"
    assert result.finish_reason == "stop"
    assert result.usage["total_tokens"] == 15


# ---------------------------------------------------------------------------
# 强制用例 2：不可重试异常不触发重试
# ---------------------------------------------------------------------------

def test_non_retryable_exception_no_retry(patch_get_client, fast_retry):
    """AuthenticationError 直接抛出 → create 只调用 1 次。"""
    from models.llm import chat_completion

    fast_retry.max_retries = 3
    create = patch_get_client.chat.completions.create
    create.side_effect = _auth_error()

    async def run():
        return await chat_completion(
            model="deepseek-chat",
            messages=[{"role": "user", "content": "hi"}],
        )

    with pytest.raises(openai.AuthenticationError):
        asyncio.run(run())

    assert create.call_count == 1


# ---------------------------------------------------------------------------
# 强制用例 3：重试耗尽后抛原始异常
# ---------------------------------------------------------------------------

def test_retry_exhausted_raises_original(patch_get_client, fast_retry):
    """始终 500 → max_retries=2 时 create 调用 3 次（首次+2 重试），抛原始异常。"""
    from models.llm import chat_completion

    fast_retry.max_retries = 2
    create = patch_get_client.chat.completions.create
    create.side_effect = _internal_server_error()

    async def run():
        return await chat_completion(
            model="deepseek-chat",
            messages=[{"role": "user", "content": "hi"}],
        )

    with pytest.raises(openai.InternalServerError):
        asyncio.run(run())

    assert create.call_count == 3


# ---------------------------------------------------------------------------
# 强制用例 4：max_retries=0 不重试
# ---------------------------------------------------------------------------

def test_max_retries_zero_no_retry(patch_get_client, fast_retry):
    """max_retries=0 时跳过 tenacity → create 只调用 1 次，异常直接抛出。"""
    from models.llm import chat_completion

    fast_retry.max_retries = 0
    create = patch_get_client.chat.completions.create
    create.side_effect = _connection_error()

    async def run():
        return await chat_completion(
            model="deepseek-chat",
            messages=[{"role": "user", "content": "hi"}],
        )

    with pytest.raises(openai.APIConnectionError):
        asyncio.run(run())

    assert create.call_count == 1


# ---------------------------------------------------------------------------
# 强制用例 5：流式调用重试覆盖 create 阶段
# ---------------------------------------------------------------------------

def test_stream_create_retry(patch_get_client, fast_retry):
    """create 第 1 次超时、第 2 次返回 mock stream → create 调用 2 次，正常出 delta + finish。"""
    from models.llm import chat_completion_stream_events

    fast_retry.max_retries = 3
    create = patch_get_client.chat.completions.create
    create.side_effect = [_timeout_error(), _fake_stream()]

    async def run():
        deltas = []
        finish_event = None
        async for evt in chat_completion_stream_events(
            model="deepseek-chat",
            messages=[{"role": "user", "content": "hi"}],
        ):
            if evt["type"] == "delta":
                deltas.append(evt["content"])
            elif evt["type"] == "finish":
                finish_event = evt
        return deltas, finish_event

    deltas, finish_event = asyncio.run(run())

    assert create.call_count == 2
    assert "".join(deltas) == "hello"
    assert finish_event is not None
    assert finish_event["finish_reason"] == "stop"
    assert finish_event["usage"] == {
        "prompt_tokens": 1,
        "completion_tokens": 1,
        "total_tokens": 2,
    }
