"""
LLM 多模型路由模块

职责：
- 接收 chat 请求，根据 model_name 选择对应的 API 提供商
- 统一封装 OpenAI 兼容的 chat completions 调用
- 支持流式和非流式两种响应模式
- 支持 function calling（tools 参数 + 结构化返回）
- P3.3 全程流式：`chat_completion_stream_events` 返回结构化事件
  (delta + finish + tool_calls + usage)，单次调用解决 FC 循环探测与打字机效果

与其他模块的关系：
- 被 services/chat_service.py 调用，作为模型调用的统一入口
- 依赖 config.py 获取各模型的 api_key 和 base_url
"""

import json
import logging
import time
from dataclasses import dataclass, field
from functools import partial
from typing import AsyncGenerator, Callable

from openai import AsyncOpenAI
import openai
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from config import get_config

logger = logging.getLogger(__name__)

# 按 provider 缓存客户端（api_key/base_url 按 provider 配置）
_clients: dict[str, AsyncOpenAI] = {}


@dataclass
class LLMResponse:
    """LLM 非流式调用结果，支持 function calling。"""
    content: str = ""
    tool_calls: list[dict] = field(default_factory=list)  # [{id, name, arguments(JSON string)}]
    finish_reason: str = "stop"  # "stop" | "tool_calls" | "length"
    usage: dict = field(default_factory=dict)  # {prompt_tokens, completion_tokens, total_tokens}

    @property
    def has_tool_calls(self) -> bool:
        return bool(self.tool_calls)


# 模型名 → provider 配置键的显式映射
# 新增模型时在此处添加一行即可，无需修改解析逻辑
_MODEL_PROVIDER_MAP: dict[str, str] = {
    "deepseek-chat": "deepseek",
    "deepseek-reasoner": "deepseek",
    "qwen-turbo": "qwen",
    "qwen-plus": "qwen",
    "qwen-max": "qwen",
    "gpt-4o": "gpt",
    "gpt-4o-mini": "gpt",
}


def _resolve_provider_key(model_name: str) -> str:
    """从模型名解析 provider 配置键，使用显式映射。"""
    if model_name in _MODEL_PROVIDER_MAP:
        return _MODEL_PROVIDER_MAP[model_name]
    raise ValueError(
        f"Unknown model: {model_name}. "
        f"Add it to _MODEL_PROVIDER_MAP in models/llm.py or check config.yaml."
    )


def _get_client(model_name: str) -> AsyncOpenAI:
    """根据模型名获取或创建对应的 AsyncOpenAI 客户端。"""
    provider_key = _resolve_provider_key(model_name)
    if provider_key in _clients:
        return _clients[provider_key]

    config = get_config()
    model_cfg = config.models.get(provider_key)
    if model_cfg is None:
        raise ValueError(f"Unknown model provider: {provider_key} (model={model_name})")
    if not model_cfg.api_key:
        raise ValueError(f"API key not configured for provider: {provider_key}")

    logger.debug(
        "Creating LLM client provider=%s base_url=%s",
        provider_key,
        model_cfg.base_url,
    )
    client = AsyncOpenAI(
        api_key=model_cfg.api_key,
        base_url=model_cfg.base_url,
    )
    _clients[provider_key] = client
    return client


def _log_token_usage(model: str, usage: dict) -> None:
    """统一格式输出 token 用量日志（P3.3-1）。"""
    if not usage:
        return
    total = usage.get("total_tokens", "N/A")
    prompt = usage.get("prompt_tokens", "N/A")
    completion = usage.get("completion_tokens", "N/A")
    logger.info(
        "batch_llm_call token_usage model=%s total=%s prompt=%s completion=%s",
        model, total, prompt, completion,
    )


def _debug_log_request(model: str, messages: list[dict], kwargs_extras: dict) -> None:
    """debug_log 开启时输出 raw 请求正文（P3.3-4）。"""
    cfg = get_config()
    if not cfg.llm.debug_log:
        return
    try:
        payload = {
            "model": model,
            "messages": messages,
            **kwargs_extras,
        }
        logger.debug("LLM raw request:\n%s", json.dumps(payload, ensure_ascii=False, indent=2))
    except Exception:
        logger.debug("LLM raw request serialization failed")


def _debug_log_response(obj: object) -> None:
    """debug_log 开启时输出 raw 响应对象（P3.3-4）。"""
    cfg = get_config()
    if not cfg.llm.debug_log:
        return
    try:
        # openai 响应对象通常支持 model_dump
        if hasattr(obj, "model_dump"):
            data = obj.model_dump()
        else:
            data = str(obj)
        logger.debug("LLM raw response:\n%s", json.dumps(data, ensure_ascii=False, indent=2, default=str))
    except Exception:
        logger.debug("LLM raw response serialization failed")


# ====================================================================
# 重试机制（P3.2 指数退避）
# ====================================================================

# 可重试的异常类型（网络/超时/429/5xx）
# 4xx 参数错误、AuthenticationError 不在此列表，不重试
_RETRYABLE_EXCEPTIONS = (
    openai.APITimeoutError,
    openai.APIConnectionError,
    openai.RateLimitError,
    openai.InternalServerError,
)


def _log_retry(state, total_attempts: int) -> None:
    """tenacity before_sleep 回调：每次重试前记录日志。

    格式：batch_llm_call retry attempt=2/4 error=RateLimitError wait=2.0s

    Args:
        state: tenacity RetryCallState
        total_attempts: 总尝试次数（max_retries + 1），通过 partial 绑定
    """
    # state.next_action.sleep 是下次等待秒数
    wait_sec = state.next_action.sleep if state.next_action else 0
    # 失败异常类型名（去掉 module 前缀）
    exc = state.outcome.exception() if state.outcome else None
    exc_name = type(exc).__name__ if exc else "Unknown"
    logger.warning(
        "batch_llm_call retry attempt=%d/%d error=%s wait=%.2fs",
        state.attempt_number,
        total_attempts,
        exc_name,
        wait_sec,
    )


async def _call_with_retry(func: Callable, *args, **kwargs):
    """带指数退避重试的异步调用包装。

    - 从 config.llm.max_retries + retry_backoff_base 读取参数
    - 可重试异常：_RETRYABLE_EXCEPTIONS（超时/连接/429/5xx）
    - max_retries=0 时不重试，直接调用
    - 重试耗尽后 reraise 原始异常

    Args:
        func: 异步可调用
        *args, **kwargs: 透传给 func 的参数

    Returns:
        func 的返回值
    """
    cfg = get_config()
    max_retries = cfg.llm.max_retries
    backoff_base = cfg.llm.retry_backoff_base

    # max_retries=0：完全跳过 tenacity，直接调用
    if max_retries <= 0:
        return await func(*args, **kwargs)

    # tenacity 总尝试次数 = max_retries + 1（首次 + max_retries 次重试）
    total_attempts = max_retries + 1

    async for attempt in AsyncRetrying(
        stop=stop_after_attempt(total_attempts),
        wait=wait_exponential(multiplier=backoff_base, min=backoff_base, max=backoff_base * (2 ** max_retries)),
        retry=retry_if_exception_type(_RETRYABLE_EXCEPTIONS),
        before_sleep=partial(_log_retry, total_attempts=total_attempts),
        reraise=True,
    ):
        with attempt:
            return await func(*args, **kwargs)


# ====================================================================
# 流式 tool_calls 跨 chunk 拼接（纯函数，便于状态机单测）
# ====================================================================

def stream_tool_call_accumulator() -> tuple[callable, callable]:
    """
    构造一个 OpenAI 流式协议中 tool_calls 的增量累积器（纯函数，不依赖 SDK 类型）。

    用法：
        ingest, finalize = stream_tool_call_accumulator()
        for raw_chunk in stream_chunks:
            ingest(raw_chunk.delta.tool_calls)  # 每块增量喂入
        tool_calls: list[dict] = finalize()  # 得到 [{id, name, arguments}, ...]

    支持场景：
    - 单 tool_call 跨 chunk：id → name → arguments（多段）
    - 多 tool_calls 并行：按 index 分别累积
    - 某字段空值：不拼接（避免 None/空字符串被意外追加）
    - arguments 为 JSON 被拆 N 段，按到达顺序拼合
    """
    tc_accum: dict[int, dict] = {}

    def ingest(tool_calls_deltas: list | None) -> None:
        if not tool_calls_deltas:
            return
        for tc_delta in tool_calls_deltas:
            # 兼容 SDK 对象或纯 dict
            idx = None
            if hasattr(tc_delta, "index"):
                idx = tc_delta.index
            elif isinstance(tc_delta, dict):
                idx = tc_delta.get("index")
            if idx is None:
                idx = 0

            if idx not in tc_accum:
                tc_accum[idx] = {
                    "id": "",
                    "name": "",
                    "arguments_buf": [],
                }
            entry = tc_accum[idx]

            # id
            tc_id = None
            if hasattr(tc_delta, "id"):
                tc_id = tc_delta.id
            elif isinstance(tc_delta, dict):
                tc_id = tc_delta.get("id")
            if tc_id:
                # id 通常只在第一块出现，后续出现按最后一次更新覆盖
                entry["id"] = tc_id

            # function
            func = None
            if hasattr(tc_delta, "function"):
                func = tc_delta.function
            elif isinstance(tc_delta, dict):
                func = tc_delta.get("function")
            if func is None:
                continue

            func_name = None
            if hasattr(func, "name"):
                func_name = func.name
            elif isinstance(func, dict):
                func_name = func.get("name")
            if func_name:
                entry["name"] = func_name

            func_args = None
            if hasattr(func, "arguments"):
                func_args = func.arguments
            elif isinstance(func, dict):
                func_args = func.get("arguments")
            if func_args:
                entry["arguments_buf"].append(func_args)

    def finalize() -> list[dict]:
        result = []
        for idx in sorted(tc_accum.keys()):
            e = tc_accum[idx]
            result.append({
                "id": e["id"],
                "name": e["name"],
                "arguments": "".join(e["arguments_buf"]),
            })
        return result

    return ingest, finalize


# ====================================================================
# 非流式主入口
# ====================================================================

async def chat_completion(
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 4096,
    tools: list[dict] | None = None,
) -> LLMResponse:
    """
    非流式聊天补全，支持 function calling。

    Args:
        model: 模型名称，如 "deepseek-chat"、"gpt-4o"
        messages: 标准 OpenAI 消息列表
        temperature: 温度参数
        max_tokens: 最大输出 token 数
        tools: OpenAI function calling schema 列表，None 表示不启用工具

    Returns:
        LLMResponse，包含 content、tool_calls、finish_reason、usage
    """
    client = _get_client(model)
    logger.info(
        "LLM request model=%s messages=%d tools=%s temperature=%s",
        model,
        len(messages),
        len(tools) if tools else 0,
        temperature,
    )
    start = time.perf_counter()
    try:
        kwargs = dict(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if tools:
            kwargs["tools"] = tools

        _debug_log_request(model, messages, {k: v for k, v in kwargs.items() if k != "messages"})

        response = await _call_with_retry(client.chat.completions.create, **kwargs)
        choice = response.choices[0]
        msg = choice.message
        content = msg.content or ""

        tool_calls = []
        if msg.tool_calls:
            for tc in msg.tool_calls:
                tool_calls.append({
                    "id": tc.id,
                    "name": tc.function.name,
                    "arguments": tc.function.arguments,
                })

        usage = {}
        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

        _debug_log_response(response)
        _log_token_usage(model, usage)

        elapsed = time.perf_counter() - start
        logger.info(
            "LLM response model=%s finish=%s chars=%d tool_calls=%d tokens=%s elapsed=%.2fs",
            model,
            choice.finish_reason,
            len(content),
            len(tool_calls),
            usage.get("total_tokens", "N/A"),
            elapsed,
        )
        return LLMResponse(
            content=content,
            tool_calls=tool_calls,
            finish_reason=choice.finish_reason or "stop",
            usage=usage,
        )
    except Exception:
        logger.exception("LLM request failed model=%s", model)
        raise


# ====================================================================
# 全程流式主入口（P3.3-5 新增）
# ====================================================================

async def chat_completion_stream_events(
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 4096,
    tools: list[dict] | None = None,
) -> AsyncGenerator[dict, None]:
    """
    全程流式聊天补全，返回结构化事件，支持 function calling 状态解析。

    单次调用即可同时获得：
    - 打字机效果文本增量
    - finish_reason（stop / tool_calls / length）
    - tool_calls（跨 chunk 增量拼接完整 JSON）
    - usage（final chunk，若 provider 返回）

    事件类型：
    - {"type": "delta", "content": str}：文本增量
    - {"type": "finish", "finish_reason": str, "tool_calls": list[dict], "usage": dict}：流结束元数据

    调用模式：
        tool_calls_accum = {}  # {index: {id, name, arguments_buf}}
        full_text = ""
        final_meta = None
        async for evt in chat_completion_stream_events(...):
            if evt["type"] == "delta":
                full_text += evt["content"]
                yield evt  # 直接上推打字机
            elif evt["type"] == "finish":
                final_meta = evt

    Args:
        model: 模型名称
        messages: 标准 OpenAI 消息列表
        temperature: 温度参数
        max_tokens: 最大输出 token 数
        tools: 工具 schema 列表（可选，传入时 LLM 可能返回 tool_calls）

    Yields:
        按顺序输出 delta 事件，最后输出一个 finish 事件
    """
    client = _get_client(model)
    kwargs = dict(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
        stream_options={"include_usage": True},
    )
    if tools:
        kwargs["tools"] = tools

    logger.info(
        "LLM stream request model=%s messages=%d tools=%s temperature=%s",
        model,
        len(messages),
        len(tools) if tools else 0,
        temperature,
    )
    start = time.perf_counter()
    _debug_log_request(model, messages, {k: v for k, v in kwargs.items()
                                         if k not in ("messages", "stream", "stream_options")})

    # 重试只包裹 create 调用；create 成功后流迭代中的异常不重试
    # 理由：create 失败通常是连接/超时/429，值得重试；
    #       流迭代中失败通常是中途网络断开，重试整个流代价高且用户已看到部分输出
    stream = await _call_with_retry(client.chat.completions.create, **kwargs)

    usage_data: dict = {}
    finish_reason: str | None = None
    ingest_tc, finalize_tc = stream_tool_call_accumulator()

    async for chunk in stream:
        # —— usage（final chunk 可能含 usage）
        if hasattr(chunk, "usage") and chunk.usage:
            usage_data = {
                "prompt_tokens": chunk.usage.prompt_tokens,
                "completion_tokens": chunk.usage.completion_tokens,
                "total_tokens": chunk.usage.total_tokens,
            }
            _debug_log_response(chunk)

        if not chunk.choices:
            continue

        delta = chunk.choices[0].delta

        # —— 文本增量
        if delta.content:
            yield {"type": "delta", "content": delta.content}

        # —— finish_reason
        fr = chunk.choices[0].finish_reason
        if fr:
            finish_reason = fr

        # —— tool_calls 跨 chunk 增量拼接（用纯函数累积器，便于独立单测）
        if hasattr(delta, "tool_calls") and delta.tool_calls:
            ingest_tc(delta.tool_calls)

    # —— 汇总 tool_calls
    final_tool_calls: list[dict] = finalize_tc()

    _log_token_usage(model, usage_data)

    elapsed = time.perf_counter() - start
    logger.info(
        "LLM stream finish model=%s finish=%s chars=stream tool_calls=%d tokens=%s elapsed=%.2fs",
        model,
        finish_reason or "unknown",
        len(final_tool_calls),
        usage_data.get("total_tokens", "N/A"),
        elapsed,
    )

    yield {
        "type": "finish",
        "finish_reason": finish_reason or "stop",
        "tool_calls": final_tool_calls,
        "usage": usage_data,
    }


# ====================================================================
# 兼容旧接口：文本片段流式
# ====================================================================

async def chat_completion_stream(
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 4096,
    tools: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """
    文本增量流式聊天补全（兼容旧接口）。
    内部基于 chat_completion_stream_events，仅透传 delta 文本。

    Args:
        model: 模型名称
        messages: 标准 OpenAI 消息列表
        temperature: 温度参数
        max_tokens: 最大输出 token 数
        tools: 工具 schema 列表（可选）

    Yields:
        每次返回一个增量文本片段
    """
    async for evt in chat_completion_stream_events(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        tools=tools,
    ):
        if evt["type"] == "delta":
            yield evt["content"]
        # finish 事件静默丢弃（usage 已在内部记日志）
