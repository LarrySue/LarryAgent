"""
Token 估算与消息截断模块（P3.3-2）。

职责：
- 基于 tiktoken 估算 messages 的输入 token 数
- 超过 llm.max_input_tokens 阈值时按策略截断旧消息
- tiktoken 不可用时回退到字符数保守估算（中文 ×1.5，英文 ×0.3）

注意：
tiktoken 对 DeepSeek 等非 OpenAI tokenizer 精度不高，仅用于"是否触发截断"的粗估。
精确 token 用量以 LLM API 返回的 response.usage 为准（见 llm.py _log_token_usage）。

截断策略（TODO 规定）：
保留 system prompt + 最后 N 条消息，从中间删除旧消息，不从头部截。
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)

# —— tiktoken 可选依赖 ——
try:
    import tiktoken
    _TIKTOKEN_OK = True
except Exception:
    _TIKTOKEN_OK = False
    logger.warning(
        "tiktoken 未安装，token 估算回退到字符数保守策略。"
        "建议 pip install tiktoken 以提升截断精度。"
    )


# 模型名 → tiktoken encoding 名的映射（尽量贴近）
# DeepSeek 等非 OpenAI 模型用 cl100k_base 作为近似
_MODEL_ENCODING_MAP: dict[str, str] = {
    "deepseek-chat": "cl100k_base",
    "deepseek-reasoner": "cl100k_base",
    "qwen-turbo": "cl100k_base",
    "qwen-plus": "cl100k_base",
    "qwen-max": "cl100k_base",
    "gpt-4o": "o200k_base",
    "gpt-4o-mini": "o200k_base",
}

_ENCODING_CACHE: dict[str, Any] = {}


def _get_encoding(model: str):
    """获取 encoding 实例，带缓存。"""
    if not _TIKTOKEN_OK:
        return None
    enc_name = _MODEL_ENCODING_MAP.get(model, "cl100k_base")
    if enc_name in _ENCODING_CACHE:
        return _ENCODING_CACHE[enc_name]
    try:
        enc = tiktoken.get_encoding(enc_name)
    except Exception:
        enc = tiktoken.get_encoding("cl100k_base")
    _ENCODING_CACHE[enc_name] = enc
    return enc


def _estimate_tokens_text(text: str, model: str) -> int:
    """估算单段文本的 token 数。"""
    enc = _get_encoding(model)
    if enc is not None:
        try:
            return len(enc.encode(text))
        except Exception:
            pass
    # 回退：字符数 × 系数（中文/亚洲字符更密集，英文更稀疏）
    chinese_chars = sum(1 for c in text if "\u4e00" <= c <= "\u9fff")
    other_chars = max(len(text) - chinese_chars, 0)
    return int(chinese_chars * 1.5 + other_chars * 0.3) + 4


def estimate_tokens_message(msg: dict, model: str) -> int:
    """估算单条消息的 token 数（含 role、name、tool_calls 等字段开销）。

    参考 OpenAI cookbook 的 messages 估算公式：
    每条消息基础开销 = 4（格式 token） + role + content + (tool_calls)
    """
    total = 4  # 基础开销：<|start|>role\n<|content|>...<|end|>
    total += _estimate_tokens_text(msg.get("role", ""), model)
    total += _estimate_tokens_text(msg.get("content") or "", model)
    if msg.get("name"):
        total += _estimate_tokens_text(msg["name"], model) + 1
    if msg.get("tool_call_id"):
        total += _estimate_tokens_text(msg["tool_call_id"], model) + 2
    # tool_calls 估算（assistant 消息中）
    tcs = msg.get("tool_calls") or []
    for tc in tcs:
        total += 3  # 每条 tool_call 基础开销
        if isinstance(tc, dict):
            total += _estimate_tokens_text(tc.get("id", ""), model)
            func = tc.get("function", {}) if isinstance(tc.get("function"), dict) else {}
            total += _estimate_tokens_text(func.get("name", ""), model)
            total += _estimate_tokens_text(func.get("arguments", ""), model)
    return total


def estimate_tokens_messages(messages: list[dict], model: str) -> int:
    """估算整段 messages 列表的总输入 token 数。

    用于 P3.3-2 请求前截断判断。
    """
    if not messages:
        return 0
    # 每条消息 + 总格式开销（priming）
    total = 3  # 整体 priming 开销
    for m in messages:
        total += estimate_tokens_message(m, model)
    return total


def truncate_messages(
    messages: list[dict],
    model: str,
    max_input_tokens: int,
) -> list[dict]:
    """按策略截断 messages 使其在 max_input_tokens 以内。

    策略（TODO 明确规定）：
      - 保留 system prompt（role == "system"）
      - 保留最后若干条消息（尾部）
      - 从中间删除旧消息，不从头部截（防止丢失 system prompt）
      - 删除后在中间插入一条占位"（历史消息因超 token 限额已省略）"

    Args:
        messages: 原始消息列表（时间正序）
        model: 模型名，用于选择 encoding
        max_input_tokens: 阈值，来自 config.llm.max_input_tokens

    Returns:
        截断后的 messages 列表（若无需截断则返回原列表的浅拷贝）
    """
    if max_input_tokens <= 0:
        return list(messages)

    current = estimate_tokens_messages(messages, model)
    if current <= max_input_tokens:
        return list(messages)

    logger.warning(
        "Messages exceed max_input_tokens: estimated=%d limit=%d, will truncate from middle",
        current, max_input_tokens,
    )

    # 分离 system 和非 system 消息
    system_msgs = [m for m in messages if m.get("role") == "system"]
    non_system = [m for m in messages if m.get("role") != "system"]

    # 非 system 为空，返回 system
    if not non_system:
        return list(system_msgs)

    # 从尾部尝试保留，从中间删除
    # 算法：保留 system_msgs + non_system 的最后 N 条
    #   N 从 len(non_system)-1 递减，直到总 tokens < 阈值
    # 同时在 system 和保留段之间插入一条"截断占位"消息（如果删了东西）

    truncation_hint = {
        "role": "system",
        "content": "（历史消息因超 token 限额已省略）",
    }

    total_system = estimate_tokens_messages(system_msgs, model)
    hint_tokens = estimate_tokens_message(truncation_hint, model)

    # 尝试保留尾部 k 条
    kept_count = 0
    tail_messages: list[dict] = []
    for k in range(len(non_system), 0, -1):
        tail = non_system[-k:]
        tail_tokens = estimate_tokens_messages(tail, model)
        need_hint = k < len(non_system)
        budget = total_system + tail_tokens + (hint_tokens if need_hint else 0)
        if budget <= max_input_tokens:
            kept_count = k
            tail_messages = tail
            break
    else:
        # 即使只保留最后 1 条也超限，保留最后 1 条兜底（丢弃 system 中的非必要段的可能不在此处考虑，
        # 最坏情况还是让 provider 返回错误而不是彻底无上下文）
        tail_messages = [non_system[-1]]
        kept_count = 1

    removed_count = len(non_system) - kept_count

    # 拼接
    result: list[dict] = list(system_msgs)
    if removed_count > 0:
        result.append(truncation_hint)
    result.extend(tail_messages)

    final_est = estimate_tokens_messages(result, model)
    logger.info(
        "Truncation result: removed=%d non-system messages, kept=%d, estimated_after=%d",
        removed_count, kept_count, final_est,
    )
    return result
