"""
CoT 存档（A 侧）测试（J6-1 … J6-8）

职责：
- 两处入口（非流式 / 流式）都产出 raw 存档，落盘路径与文件名规则可判
- 每个响应对象的 model_dump() 原样落盘（未知键保留、无清洗、无重排）
- 请求侧 model / 参数 / messages 原文可还原
- 三态标注三臂：有/无 reasoning 状态不同；部分丢失不得落成「上游未返回」；其余字段完整
- 存档路径配置驱动、可换根；测试存档目录与真实目录隔离（Tier 0 红线 4）
- 写盘失败不阻塞 LLM 返回，但必须留错误日志

与其他模块的关系：
- 被测：models/cot_archive.py ＋ models/llm.py 两处挂钩
- 隔离：conftest 把 LARRY_CONFIG 指向临时 yaml，cot_archive.path 落临时目录；
  本文件只读写那份临时目录，⛔ 不触真实库/真实存档
"""

import asyncio
import json
import logging
import re
import shutil
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
import yaml

from config import get_config
import models.cot_archive as cot_archive
import models.llm as llm_module


# ---------------------------------------------------------------------------
# 存档目录工具
# ---------------------------------------------------------------------------

def _archive_root() -> Path:
    return Path(get_config().cot_archive.path)


def _read_records(meta_path: Path) -> list[dict]:
    response_path = meta_path.with_name(
        meta_path.name[: -len(".meta.json")] + ".response.jsonl"
    )
    assert response_path.exists(), f"响应原文缺失：{response_path}"
    return [
        json.loads(line)
        for line in response_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def _all_archives() -> list[tuple[dict, list[dict], Path]]:
    root = _archive_root()
    metas = sorted(root.rglob("*.meta.json"), key=lambda p: p.name)
    return [
        (json.loads(p.read_text(encoding="utf-8")), _read_records(p), p)
        for p in metas
    ]


@pytest.fixture(autouse=True)
def clean_archive():
    """每个用例从空存档目录开始（目录本身是 conftest 指定的临时目录）。"""
    root = _archive_root()
    if root.exists():
        shutil.rmtree(root)
    yield


# ---------------------------------------------------------------------------
# 假响应对象：源对象可读 reasoning，model_dump 可控（用于模拟「我方未采」）
# ---------------------------------------------------------------------------

class FakeChunk:
    """流式 chunk 替身。dump_omit_reasoning=True 时模拟落盘丢 reasoning 键。"""

    def __init__(self, *, content=None, reasoning=None, finish=None, usage=None,
                 dump_omit_reasoning=False, extra=None):
        self._dump_omit_reasoning = dump_omit_reasoning
        self._extra = extra or {}
        delta = SimpleNamespace(content=content, reasoning_content=reasoning, tool_calls=None)
        if content is None and reasoning is None and finish is None:
            self.choices = []
        else:
            self.choices = [SimpleNamespace(
                index=0,
                delta=delta,
                finish_reason=finish,
                logprobs=None,
            )]
        self.usage = usage

    def model_dump(self) -> dict:
        choices = []
        for choice in self.choices:
            delta = {
                "content": choice.delta.content,
                "role": "assistant",
                "tool_calls": None,
            }
            if not self._dump_omit_reasoning and choice.delta.reasoning_content is not None:
                delta["reasoning_content"] = choice.delta.reasoning_content
            choices.append({
                "index": choice.index,
                "delta": delta,
                "logprobs": None,
                "finish_reason": choice.finish_reason,
            })
        dump = {
            "id": "chatcmpl-test",
            "object": "chat.completion.chunk",
            "created": 1700000000,
            "model": "deepseek-reasoner",
            "system_fingerprint": "fp-test",
            "choices": choices,
        }
        if self.usage is not None:
            dump["usage"] = {
                "prompt_tokens": self.usage.prompt_tokens,
                "completion_tokens": self.usage.completion_tokens,
                "total_tokens": self.usage.total_tokens,
            }
        dump.update(self._extra)
        return dump


class FakeResponse:
    """非流式响应替身。dump_omit_reasoning=True 时模拟落盘丢 reasoning 键。"""

    def __init__(self, *, content="答案", reasoning=None, dump_omit_reasoning=False, extra=None):
        message = SimpleNamespace(
            role="assistant",
            content=content,
            reasoning_content=reasoning,
            tool_calls=None,
        )
        self.choices = [SimpleNamespace(
            index=0, message=message, finish_reason="stop", logprobs=None,
        )]
        self.usage = SimpleNamespace(prompt_tokens=10, completion_tokens=5, total_tokens=15)
        self._dump_omit_reasoning = dump_omit_reasoning
        self._extra = extra or {}

    def model_dump(self) -> dict:
        message = {
            "role": "assistant",
            "content": self.choices[0].message.content,
            "tool_calls": None,
        }
        if not self._dump_omit_reasoning and self.choices[0].message.reasoning_content is not None:
            message["reasoning_content"] = self.choices[0].message.reasoning_content
        dump = {
            "id": "chatcmpl-test-nonstream",
            "object": "chat.completion",
            "created": 1700000000,
            "model": "deepseek-reasoner",
            "choices": [{
                "index": 0,
                "message": message,
                "logprobs": None,
                "finish_reason": "stop",
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            },
        }
        dump.update(self._extra)
        return dump


async def _stream_from(chunks):
    for chunk in chunks:
        yield chunk


@pytest.fixture
def fake_client(monkeypatch):
    """mock _get_client，不发真实网络请求。"""
    create = AsyncMock()
    client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=create))
    )
    monkeypatch.setattr(llm_module, "_get_client", lambda model: client)
    return client


def _consume_stream(messages=None) -> list[dict]:
    async def run():
        events = []
        async for evt in llm_module.chat_completion_stream_events(
            model="deepseek-reasoner",
            messages=messages or [{"role": "user", "content": "你好"}],
        ):
            events.append(evt)
        return events
    return asyncio.run(run())


def _call_non_stream(messages=None) -> object:
    async def run():
        return await llm_module.chat_completion(
            model="deepseek-reasoner",
            messages=messages or [{"role": "user", "content": "你好"}],
        )
    return asyncio.run(run())


# ---------------------------------------------------------------------------
# J6-1 / J6-2 / J6-3：两处入口 ＋ 原样落盘 ＋ 请求侧原文
# ---------------------------------------------------------------------------

def test_stream_entry_archives_every_chunk_verbatim(fake_client):
    """流式入口：全部 chunk 逐行原样落盘（含未知键），meta 可还原请求侧。"""
    messages = [{"role": "user", "content": "讲个短句"}]
    usage = SimpleNamespace(prompt_tokens=7, completion_tokens=3, total_tokens=10)
    chunks = [
        FakeChunk(content=None, reasoning="想"),
        FakeChunk(content="好", reasoning="一下"),
        FakeChunk(finish="stop", usage=usage),
    ]
    fake_client.chat.completions.create.return_value = _stream_from(chunks)

    events = _consume_stream(messages=messages)

    metas = _all_archives()
    assert len(metas) == 1
    meta, records, meta_path = metas[0]

    # J6-1：两处入口之一落盘 + 文件名规则
    response_path = meta_path.with_name(
        meta_path.name[: -len(".meta.json")] + ".response.jsonl"
    )
    # 目录＝日期；meta/response 同 stem、后缀固定
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", meta_path.parent.name)
    assert meta_path.name.endswith(".meta.json")
    assert response_path.exists()
    assert len(records) == len(chunks)

    # J6-2：逐 chunk 原样（比较 model_dump 全文，未知键也保留）
    expected = [c.model_dump() for c in chunks]
    assert records == expected
    assert records[0]["choices"][0]["delta"]["reasoning_content"] == "想"
    assert records[2]["usage"]["total_tokens"] == 10

    # J6-3：请求侧原文可还原
    assert meta["mode"] == "stream"
    assert meta["model"] == "deepseek-reasoner"
    assert meta["messages"] == messages
    assert meta["params"]["temperature"] == 0.7
    assert meta["params"]["max_tokens"] == 4096
    assert meta["params"]["stream"] is True
    assert meta["response"]["chunk_count"] == len(chunks)

    # J6-8：事件契约逐字不变（reasoning-only chunk 不产出 delta，与既有取法一致）
    assert [e["type"] for e in events] == ["delta", "finish"]
    assert all(set(e.keys()) == {"type", "content"} for e in events[:-1])
    assert set(events[-1].keys()) == {"type", "finish_reason", "tool_calls", "usage"}


def test_non_stream_entry_archives_response(fake_client):
    """非流式入口：整体响应落一行，状态与计数正确。"""
    response = FakeResponse(reasoning="推理原文", content="答案")
    fake_client.chat.completions.create.return_value = response

    _call_non_stream()

    metas = _all_archives()
    assert len(metas) == 1
    meta, records, _ = metas[0]
    assert meta["mode"] == "non_stream"
    assert len(records) == 1
    assert records[0] == response.model_dump()
    assert meta["reasoning"]["status"] == cot_archive.STATUS_STORED
    assert meta["reasoning"]["received_chars"] == len("推理原文")
    assert meta["reasoning"]["captured_chars"] == len("推理原文")


def test_unknown_provider_key_survives(fake_client):
    """未知字段（provider 扩展键）不得被挑掉。"""
    extra = {"provider_unknown_key": {"a": [1, 2], "b": "保留"}}
    chunk = FakeChunk(content="好", reasoning="想", extra=extra)
    fake_client.chat.completions.create.return_value = _stream_from([chunk])

    _consume_stream()

    _, records, _ = _all_archives()[0]
    assert records[0]["provider_unknown_key"] == extra["provider_unknown_key"]


# ---------------------------------------------------------------------------
# J6-4：三态判定（三臂）
# ---------------------------------------------------------------------------

def test_three_state_arms(fake_client):
    """三臂：有/无 reasoning 状态不同；部分丢失不得落成「上游未返回」；其余字段完整。"""
    create = fake_client.chat.completions.create
    messages = [{"role": "user", "content": "三态"}]

    # 臂①-a：有 reasoning，完整落盘 → 已存
    create.return_value = _stream_from([
        FakeChunk(reasoning="推理原文", content="答"),
        FakeChunk(finish="stop"),
    ])
    _consume_stream(messages=messages)

    # 臂①-b：无 reasoning → 上游未返回
    create.return_value = _stream_from([
        FakeChunk(content="答"),
        FakeChunk(finish="stop"),
    ])
    _consume_stream(messages=messages)

    # 臂②：只采到部分（源对象有 reasoning，落盘丢了后一段）→ 上游返回但我方未采
    create.return_value = _stream_from([
        FakeChunk(reasoning="前半", content="答"),
        FakeChunk(reasoning="后半", dump_omit_reasoning=True),
        FakeChunk(finish="stop"),
    ])
    _consume_stream(messages=messages)

    metas = _all_archives()
    assert len(metas) == 3
    statuses = [meta["reasoning"]["status"] for meta, _, _ in metas]

    # 臂①：两份记录状态不同
    assert statuses[0] == cot_archive.STATUS_STORED
    assert statuses[1] == cot_archive.STATUS_UPSTREAM_ABSENT
    assert statuses[0] != statuses[1]

    # 臂②：部分丢失必须落「上游返回但我方未采」，不得落成「上游未返回」
    assert statuses[2] == cot_archive.STATUS_UPSTREAM_RETURNED_NOT_CAPTURED
    assert statuses[2] != cot_archive.STATUS_UPSTREAM_ABSENT
    partial_meta = metas[2][0]
    assert partial_meta["reasoning"]["captured_chars"] < partial_meta["reasoning"]["received_chars"]
    assert "完整性判据未过" in partial_meta["reasoning"]["status_reason"]

    # 臂③：其余字段仍完整（环境起来 ≠ 判定生效 的可区分性）
    for meta, records, _ in metas:
        assert meta["model"] == "deepseek-reasoner"
        assert meta["messages"] == messages
        assert meta["response"]["chunk_count"] == len(records)
        assert all("choices" in record for record in records)
    assert metas[2][1][0]["choices"][0]["delta"]["content"] == "答"
    assert metas[2][1][0]["choices"][0]["delta"]["reasoning_content"] == "前半"


# ---------------------------------------------------------------------------
# J6-5：配置驱动路径 ＋ 换根
# ---------------------------------------------------------------------------

def test_archive_root_can_be_switched(fake_client, tmp_path, monkeypatch):
    """换根跑一次仍生效：改配置路径后，存档落新根、不落旧根。"""
    cfg = get_config()
    old_root = Path(cfg.cot_archive.path)
    new_root = (tmp_path / "alt_cot_archive").resolve()
    monkeypatch.setattr(cfg.cot_archive, "path", str(new_root))

    fake_client.chat.completions.create.return_value = _stream_from([
        FakeChunk(content="好"),
        FakeChunk(finish="stop"),
    ])
    _consume_stream()

    assert list(new_root.rglob("*.meta.json")), f"新根未生效：{new_root}"
    assert not list(old_root.rglob("*.meta.json")), f"旧根不应再落盘：{old_root}"


def test_config_resolves_absolute_paths(tmp_path, monkeypatch):
    """配置解析：未写 path → 与 database 同根；写相对 path → 按配置目录解析为绝对路径。"""
    import config as config_module

    original = config_module._config
    monkeypatch.setattr(config_module, "_config", original)

    def _load(cot_path: str) -> config_module.Config:
        yaml_path = tmp_path / "config.yaml"
        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.safe_dump({
                "database": {"path": str(tmp_path / "data" / "larry.db")},
                "cot_archive": {"path": cot_path},
            }, f, allow_unicode=True)
        return config_module.load_config(str(yaml_path))

    cfg_default = _load("")
    assert Path(cfg_default.cot_archive.path).is_absolute()
    assert Path(cfg_default.cot_archive.path) == (tmp_path / "data" / "cot_archive").resolve()

    cfg_explicit = _load("archive/cot")
    assert Path(cfg_explicit.cot_archive.path) == (tmp_path / "archive" / "cot").resolve()


# ---------------------------------------------------------------------------
# J6-6：测试场地隔离（负向臂由 conftest 的故障注入跑，另行取证）
# ---------------------------------------------------------------------------

def test_archive_path_is_not_real():
    """本测试进程的 DB / 存档路径都不指向真实位置（conftest 断言的行为面复核）。"""
    backend = Path(__file__).resolve().parent.parent
    real_db = (backend / "data" / "larry.db").resolve()
    real_archive = (backend / "data" / "cot_archive").resolve()

    assert Path(get_config().database.path).resolve() != real_db
    assert Path(get_config().cot_archive.path).resolve() != real_archive


# ---------------------------------------------------------------------------
# 附加：开关与写失败不阻塞
# ---------------------------------------------------------------------------

def test_archive_disabled_writes_nothing(fake_client, monkeypatch):
    cfg = get_config()
    monkeypatch.setattr(cfg.cot_archive, "enabled", False)

    fake_client.chat.completions.create.return_value = _stream_from([
        FakeChunk(content="好"),
        FakeChunk(finish="stop"),
    ])
    _consume_stream()

    root = _archive_root()
    assert not root.exists() or not list(root.rglob("*.meta.json"))


def test_write_failure_does_not_block_llm(fake_client, monkeypatch, caplog):
    """写盘失败：LLM 事件照常出，错误必须留日志。"""
    def _boom(self, finish=None):
        raise OSError("simulated disk failure")

    monkeypatch.setattr(cot_archive.CallArchive, "_write_sync", _boom)
    fake_client.chat.completions.create.return_value = _stream_from([
        FakeChunk(content="好"),
        FakeChunk(finish="stop", usage=SimpleNamespace(
            prompt_tokens=1, completion_tokens=1, total_tokens=2,
        )),
    ])

    with caplog.at_level(logging.ERROR, logger="models.cot_archive"):
        events = _consume_stream()

    assert events[-1]["type"] == "finish"
    assert any("CoT archive write failed" in rec.getMessage() for rec in caplog.records)

