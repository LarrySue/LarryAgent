"""
CoT 存档（A 侧）：raw 全量落盘 ＋ 三态显式标注

职责：
- 每次 LLM 调用生成一份记录：请求侧原文（model / 调用参数 / messages）＋
  响应侧全部对象的 model_dump() 原样落盘（⛔ 不挑字段、⛔ 不重排、⛔ 不丢未知键）
- 按「源对象 reasoning 原文 vs 落盘原文 reasoning 原文」的完整性判定三态
- 写盘失败只记日志、不向调用方抛出——存档不允许阻塞 LLM 返回

三态语义（正本 docs/la-space/requirements.md §7③，2026-10-31 J5 定稿）：
| 语义 | 代码标识符 |
|---|---|
| 上游未返回：provider 未提供推理原文（raw 里确实没有 reasoning 键） | STATUS_UPSTREAM_ABSENT = "upstream_absent" |
| 上游返回但我方未采：已返回原文，但我方未完整采存（含部分丢失） | STATUS_UPSTREAM_RETURNED_NOT_CAPTURED = "upstream_returned_not_captured" |
| 已存：已返回原文完整、无损存入 | STATUS_STORED = "stored" |

⚠️ 判据是「完整性」，⛔ 不是「进没进结构化表」——raw-only 方案下 raw 全量落盘即算「已存」。
⚠️ 源对象上读不到 reasoning 且快照本身失败时，不以空白推定「上游未返回」，按
   「上游返回但我方未采」记并在 status_reason 里注明无法核实的原因。

落盘布局（路径来自 config.cot_archive.path，已由 config.py 解析为绝对路径）：
<root>/<YYYY-MM-DD>/<call_stem>.meta.json
<root>/<YYYY-MM-DD>/<call_stem>.response.jsonl
- .response.jsonl：每行一个响应对象的 model_dump()（非流式只有一行），顺序＝到达顺序
- .meta.json：请求侧原文 ＋ 状态标注 ＋ 字符计数 ＋ 快照/回读错误清单

与其他模块的关系：
- 被 models/llm.py 的两处入口调用（chat_completion / chat_completion_stream_events）
- 读 config.cot_archive（enabled / path），不写数据库、不碰 messages 表
"""

import asyncio
import copy
import json
import logging
import os
import uuid
from datetime import datetime
from pathlib import Path

from config import get_config

logger = logging.getLogger(__name__)

# 三态标识（语义映射见模块 docstring；⛔ 不得与已作废的旧英文名混用）
STATUS_UPSTREAM_ABSENT = "upstream_absent"
STATUS_UPSTREAM_RETURNED_NOT_CAPTURED = "upstream_returned_not_captured"
STATUS_STORED = "stored"

_RECORD_VERSION = 1
_REASONING_KEY = "reasoning_content"


# ====================================================================
# 源对象读取（只读，不清洗、不拼接、不改原文）
# ====================================================================

def _field(obj: object, name: str):
    """读取对象字段：兼容 SDK 模型属性 / dict / Pydantic model_extra。"""
    if isinstance(obj, dict):
        return obj.get(name)
    value = getattr(obj, name, None)
    if value is not None:
        return value
    extra = getattr(obj, "model_extra", None)
    if isinstance(extra, dict):
        return extra.get(name)
    return None


def _reasoning_chars_from_source(source: object) -> int:
    """
    从响应源对象读取 provider 返回的推理原文字符数。

    - 非流式：choices[].message.reasoning_content
    - 流式：choices[].delta.reasoning_content
    ⛔ 只计长度，不做任何清洗/规范化——原文即证据。
    """
    if isinstance(source, dict):
        choices = source.get("choices") or []
    else:
        choices = getattr(source, "choices", None) or []

    total = 0
    for choice in choices:
        for holder_name in ("delta", "message"):
            if isinstance(choice, dict):
                holder = choice.get(holder_name)
            else:
                holder = getattr(choice, holder_name, None)
            if holder is None:
                continue
            text = _field(holder, _REASONING_KEY)
            if isinstance(text, str):
                total += len(text)
    return total


def _to_plain(value: object, _depth: int = 0):
    """
    非 SDK 对象（测试替身等）的兜底序列化：递归展开，不丢公开字段。

    SDK 对象一律走 model_dump()，本函数只负责没有 model_dump 的对象；
    私有属性不下钻，避免把请求上下文等内部对象带进存档。
    """
    if _depth > 10:
        return str(value)
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, dict):
        return {str(k): _to_plain(v, _depth + 1) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_to_plain(item, _depth + 1) for item in value]

    dump = getattr(value, "model_dump", None)
    if callable(dump):
        try:
            return dump()
        except Exception:
            pass

    data = getattr(value, "__dict__", None)
    if isinstance(data, dict):
        return {
            k: _to_plain(v, _depth + 1)
            for k, v in data.items()
            if not k.startswith("_")
        }
    return str(value)


def _model_dump(source: object) -> dict:
    """优先 model_dump()（SDK 原样），否则兜底展开。"""
    dump = getattr(source, "model_dump", None)
    if callable(dump):
        return dump()
    return _to_plain(source)


def _count_reasoning_chars(node: object, _depth: int = 0) -> int:
    """统计落盘 JSON 中 reasoning_content 的字符数（用于完整性核对）。"""
    if _depth > 12:
        return 0
    if isinstance(node, dict):
        total = 0
        for key, value in node.items():
            if key == _REASONING_KEY and isinstance(value, str):
                total += len(value)
            else:
                total += _count_reasoning_chars(value, _depth + 1)
        return total
    if isinstance(node, list):
        return sum(_count_reasoning_chars(item, _depth + 1) for item in node)
    return 0


# ====================================================================
# 三态判定
# ====================================================================

def _decide_status(
    received_chars: int,
    captured_chars: int,
    *,
    snapshot_failed: bool,
) -> tuple[str, str]:
    """
    按完整性判定三态，返回 (status, status_reason)。

    完整性口径：源对象上读到的 reasoning 字符数 vs 落盘原文回读的字符数。
    - captured < received ⇒ 未完整采存 ⇒ 「上游返回但我方未采」
    - received == 0 且快照失败 ⇒ 无法核实，不得推定「上游未返回」（按未采记）
    - 其余且 captured > 0 ⇒ 「已存」；captured == 0 ⇒ 「上游未返回」
    """
    if received_chars > 0 and captured_chars < received_chars:
        return (
            STATUS_UPSTREAM_RETURNED_NOT_CAPTURED,
            f"源对象含推理原文 {received_chars} 字符，落盘原文仅 {captured_chars} 字符"
            f"（完整性判据未过）",
        )
    if received_chars == 0 and snapshot_failed:
        return (
            STATUS_UPSTREAM_RETURNED_NOT_CAPTURED,
            "响应对象快照失败，无法核实上游是否返回推理原文（不按空白推定未返回）",
        )
    if captured_chars > 0:
        return (
            STATUS_STORED,
            f"落盘原文含推理 {captured_chars} 字符（源对象读数 {received_chars} 字符），完整无损",
        )
    return (
        STATUS_UPSTREAM_ABSENT,
        "已存响应原文中无 reasoning 键（源对象亦未读到推理原文）",
    )


# ====================================================================
# 存档会话
# ====================================================================

def is_enabled() -> bool:
    """存档开关（配置读取失败时按关闭处理，不阻塞调用方）。"""
    try:
        return bool(get_config().cot_archive.enabled)
    except Exception:
        logger.warning("CoT archive config unavailable; skip archiving", exc_info=True)
        return False


class CallArchive:
    """一次 LLM 调用的存档会话：observe() 收快照，finalize() 一次性落盘。"""

    def __init__(
        self,
        *,
        mode: str,
        model: str,
        messages: list[dict],
        params: dict,
    ):
        self._mode = mode
        self._model = model
        # 请求侧在发起时定稿：深拷贝防止调用方后续往 messages 里追加工具消息
        self._messages = copy.deepcopy(messages)
        self._params = copy.deepcopy(params)
        self._created_at = datetime.now().astimezone()
        self._records: list[dict] = []
        self._dump_errors: list[dict] = []
        self._source_reasoning_chars = 0

    def observe(self, source: object) -> None:
        """快照一个响应对象（流式 chunk / 非流式整体响应），自身绝不抛出。"""
        try:
            self._source_reasoning_chars += _reasoning_chars_from_source(source)
        except Exception as exc:
            self._dump_errors.append({"stage": "source_reasoning", "error": repr(exc)})
            logger.warning("CoT archive: failed to read reasoning from source: %s", exc)

        try:
            record = _model_dump(source)
            # 提前验证可序列化：落盘时再炸就来不及标注了
            json.dumps(record, ensure_ascii=False, default=str)
            self._records.append(record)
        except Exception as exc:
            self._dump_errors.append({"stage": "dump", "error": repr(exc)})
            logger.warning("CoT archive: failed to snapshot response object: %s", exc)

    async def finalize(self, finish: dict | None = None) -> str | None:
        """落盘并返回 meta 绝对路径；任何失败只记日志、返回 None。"""
        try:
            return await asyncio.to_thread(self._write_sync, finish)
        except Exception:
            logger.exception(
                "CoT archive write failed mode=%s model=%s chunks=%d",
                self._mode, self._model, len(self._records),
            )
            return None

    def _write_sync(self, finish: dict | None) -> str:
        root = Path(get_config().cot_archive.path)
        day_dir = root / self._created_at.strftime("%Y-%m-%d")
        day_dir.mkdir(parents=True, exist_ok=True)

        stem = (
            self._created_at.strftime("%Y%m%dT%H%M%S%f")
            + "_" + uuid.uuid4().hex[:8]
            + "_" + self._mode
        )
        response_path = day_dir / f"{stem}.response.jsonl"
        meta_path = day_dir / f"{stem}.meta.json"

        # 1. 响应侧原样落盘（一行一个 model_dump，⛔ 不合并/不重排/不挑字段）
        lines = [json.dumps(rec, ensure_ascii=False, default=str) for rec in self._records]
        _atomic_write(response_path, "\n".join(lines) + ("\n" if lines else ""))

        # 2. 回读落盘原文再统计 reasoning —— 判的是「落盘」完整性，不是内存里的
        captured_chars = 0
        readback_errors: list[dict] = []
        response_bytes = 0
        if response_path.exists():
            response_bytes = response_path.stat().st_size
            with open(response_path, "r", encoding="utf-8") as f:
                for lineno, line in enumerate(f, start=1):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        captured_chars += _count_reasoning_chars(json.loads(line))
                    except Exception as exc:
                        readback_errors.append(
                            {"line": lineno, "error": repr(exc)}
                        )
        else:
            readback_errors.append({"stage": "readback", "error": "response file missing"})

        status, status_reason = _decide_status(
            self._source_reasoning_chars,
            captured_chars,
            snapshot_failed=bool(self._dump_errors) or bool(readback_errors),
        )

        meta = {
            "record_version": _RECORD_VERSION,
            "call_id": stem,
            "created_at": self._created_at.isoformat(),
            "timezone": self._created_at.tzname(),
            "mode": self._mode,
            "model": self._model,
            "params": self._params,
            "messages": self._messages,
            "response": {
                "file": response_path.name,
                "format": "jsonl：每行一个响应对象的 model_dump()，顺序＝到达顺序",
                "chunk_count": len(self._records),
                "bytes": response_bytes,
            },
            "reasoning": {
                "status": status,
                "status_reason": status_reason,
                "received_chars": self._source_reasoning_chars,
                "captured_chars": captured_chars,
            },
            "capture_errors": {
                "dump": self._dump_errors,
                "readback": readback_errors,
            },
            "finish": finish,
        }
        _atomic_write(
            meta_path,
            json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        )

        logger.info(
            "CoT archive stored call_id=%s status=%s chunks=%d received=%d captured=%d path=%s",
            stem, status, len(self._records),
            self._source_reasoning_chars, captured_chars, meta_path,
        )
        return str(meta_path)


def _atomic_write(path: Path, text: str) -> None:
    """先写 .tmp 再 os.replace，避免半截文件被当成完整存档。"""
    tmp = path.with_name(path.name + ".tmp")
    try:
        with open(tmp, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
        os.replace(tmp, path)
    except Exception:
        try:
            tmp.unlink(missing_ok=True)
        except Exception:
            pass
        raise


# ====================================================================
# 两处入口的对外封装
# ====================================================================

def start_call(
    *,
    mode: str,
    model: str,
    messages: list[dict],
    params: dict,
) -> CallArchive | None:
    """按配置开关创建存档会话；关闭或初始化失败时返回 None（不阻塞调用）。"""
    if not is_enabled():
        return None
    try:
        return CallArchive(mode=mode, model=model, messages=messages, params=params)
    except Exception:
        logger.exception("CoT archive init failed model=%s mode=%s", model, mode)
        return None


async def archive_non_stream_call(
    *,
    model: str,
    messages: list[dict],
    params: dict,
    response: object,
) -> str | None:
    """非流式入口：一次调用一份记录（响应整体占一行）。"""
    call = start_call(mode="non_stream", model=model, messages=messages, params=params)
    if call is None:
        return None
    call.observe(response)
    return await call.finalize()
