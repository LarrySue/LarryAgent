"""
聊天业务服务层

职责：
- 会话创建/恢复
- 记忆检索 → 构建 messages
- P3.3-2: 请求前 messages token 估算 + 超阈值截断
- Function calling 循环（全程流式 chat_completion_stream_events，P3.3-5 消除双调用）
- P3.3-3: 单次请求累计 token（每轮叠加）+ 超阈值告警
- 消息持久化（含 tool_calls / tool_call_id）
- 流式 / 非流式统一入口（_chat_flow async generator）

与其他模块的关系：
- 被 api/chat.py 调用，是聊天业务的唯一入口
- 依赖 models/llm.py 调用 LLM
- 依赖 models/token_counter.py 估算 token / 截断 messages
- 依赖 tools/registry.py 获取和执行工具
- 依赖 memory/engine.py 检索记忆
- 依赖 db/conversations.py 持久化消息
"""

import json
import logging
from typing import AsyncGenerator

from pydantic import BaseModel, Field

from config import get_config
from db import conversations as conv_db
from memory.engine import build_memory_context, get_long_term_memory, get_short_term_memory
from models.llm import chat_completion, chat_completion_stream, chat_completion_stream_events
from models.token_counter import estimate_tokens_messages, truncate_messages
from tools.registry import get_openai_tools, get_tool, list_tools

logger = logging.getLogger(__name__)


def _get_max_rounds() -> int:
    """从配置获取最大工具调用轮次。"""
    return get_config().tools.function_calling_max_iterations


class ChatRequest(BaseModel):
    """聊天请求体"""
    conversation_id: int | None = None  # None 表示新建会话
    message: str = Field(..., min_length=1)
    role: str = "default"
    model: str = "deepseek-chat"
    stream: bool = False
    temperature: float = 0.7


class ChatResponse(BaseModel):
    """非流式聊天响应体"""
    conversation_id: int
    reply: str
    model: str


async def handle_chat(req: ChatRequest, caller_ip: str) -> ChatResponse:
    """
    非流式聊天：消费 _chat_flow generator，收集 delta 文本。
    """
    reply_parts: list[str] = []
    conversation_id: int | None = None

    async for event in _chat_flow(req, caller_ip):
        etype = event["type"]
        if etype == "delta":
            reply_parts.append(event["content"])
        elif etype == "done":
            conversation_id = event["conversation_id"]
        elif etype == "error":
            raise ValueError(event["message"])

    reply = "".join(reply_parts)
    return ChatResponse(conversation_id=conversation_id, reply=reply, model=req.model)


async def handle_chat_stream(req: ChatRequest, caller_ip: str) -> AsyncGenerator[str, None]:
    """
    流式聊天：将 _chat_flow 事件格式化为 SSE 字符串 yield。
    """
    async for event in _chat_flow(req, caller_ip):
        yield _format_sse(event)


def _accumulate_usage(total: dict, part: dict) -> dict:
    """将单次 LLM 调用的 usage 累加到总累计。"""
    if not part:
        return total
    for key in ("prompt_tokens", "completion_tokens", "total_tokens"):
        if key in part:
            total[key] = total.get(key, 0) + int(part[key])
    return total


async def _chat_flow(req: ChatRequest, caller_ip: str) -> AsyncGenerator[dict, None]:
    """
    统一聊天流程（async generator）。

    P3.3 关键变化：
    - 请求前估算 messages tokens，超阈值按策略截断（中间删除旧消息，保留 system）
    - FC 循环每轮都走 chat_completion_stream_events（全程流式），单次调用同时获得
      打字机 delta + finish_reason + tool_calls + usage，消除最终回复"非流式探测 +
      流式重生成"的双调用问题。
    - 单次请求累计 tokens（prompt / completion 分维度），超阈值告警日志

    事件类型：
    - tool_call: 工具即将执行
    - tool_result: 工具执行完成
    - delta: 文本片段（最终回复 + 工具调用前的过渡文字）
    - done: 流结束
    - error: 错误
    """
    cfg = get_config()

    logger.info(
        "Chat request conv=%s model=%s msg_len=%d caller_ip=%s",
        req.conversation_id, req.model, len(req.message), caller_ip,
    )

    # 1. 解析/创建会话
    if req.conversation_id is None:
        conversation_id = await conv_db.create_conversation()
    else:
        existing = await conv_db.get_conversation(req.conversation_id)
        if existing is None:
            yield {"type": "error", "message": f"Conversation not found: {req.conversation_id}"}
            return
        conversation_id = req.conversation_id

    # 2. 保存用户消息
    await conv_db.insert_message(conversation_id, "user", req.message)

    # 3. 记忆检索
    short_term = await get_short_term_memory(conversation_id)
    long_term = await get_long_term_memory(req.message)
    system_prompt = cfg.get_system_prompt(req.role)
    messages = build_memory_context(short_term, long_term=long_term, system_prompt=system_prompt)

    # —— P3.3-2: 请求前估算 & 截断 messages ——
    max_input = cfg.llm.max_input_tokens
    est_tokens_before = estimate_tokens_messages(messages, req.model)
    logger.info(
        "Messages estimated tokens: %d (limit=%d)",
        est_tokens_before, max_input,
    )
    if max_input > 0 and est_tokens_before > max_input:
        messages = truncate_messages(messages, req.model, max_input)
        est_tokens_after = estimate_tokens_messages(messages, req.model)
        logger.warning(
            "Messages truncated before LLM call: %d -> %d tokens (limit=%d)",
            est_tokens_before, est_tokens_after, max_input,
        )

    # 4. 获取角色可用工具
    tools = _get_tools_for_role(req.role)

    # —— P3.3-3: 单次请求累计 token ——
    accumulated_usage: dict = {}
    warned_over_budget = False

    # 5. Function calling 循环（全程流式）
    max_rounds = _get_max_rounds()
    for round_num in range(1, max_rounds + 1):
        round_deltas: list[str] = []
        round_tool_calls: list[dict] = []
        finish_reason = "stop"
        round_usage: dict = {}

        # 每轮都走全程流式 — 单次调用同时拿到 delta + tool_calls + finish + usage
        async for evt in chat_completion_stream_events(
            model=req.model,
            messages=messages,
            temperature=req.temperature,
            tools=tools,
        ):
            if evt["type"] == "delta":
                # 实时透传到上层（打字机效果）
                round_deltas.append(evt["content"])
                yield {"type": "delta", "content": evt["content"]}
            elif evt["type"] == "finish":
                finish_reason = evt["finish_reason"]
                round_tool_calls = evt.get("tool_calls") or []
                round_usage = evt.get("usage") or {}

        # 累计 usage（P3.3-3）
        _accumulate_usage(accumulated_usage, round_usage)

        # 超阈值告警（只 warn 一次，避免多轮重复刷屏）
        if (not warned_over_budget
                and max_input > 0
                and accumulated_usage.get("total_tokens", 0) > max_input):
            warned_over_budget = True
            logger.warning(
                "Accumulated tokens exceed llm.max_input_tokens: "
                "total=%d prompt=%d completion=%d limit=%d. Continuing but cost is high.",
                accumulated_usage.get("total_tokens", 0),
                accumulated_usage.get("prompt_tokens", 0),
                accumulated_usage.get("completion_tokens", 0),
                max_input,
            )

        round_text = "".join(round_deltas)

        # —— 判断本轮是否是最终回复 / 工具调用 / 截断
        has_tool_calls = bool(round_tool_calls)

        if not has_tool_calls:
            # 最终回复（stop / length 且无 tool_calls）
            # 因为是全程流式，文字已经 yield 过了，不需要再调 LLM
            logger.info(
                "Tool loop completed at round %d (finish=%s, accumulated_total=%d)",
                round_num, finish_reason,
                accumulated_usage.get("total_tokens", 0),
            )

            if finish_reason == "length":
                # completion 被截断，附加提示
                hint = "\n\n（回复被 max_tokens 截断，如需更多内容请继续提问）"
                round_text += hint
                yield {"type": "delta", "content": hint}

            # 保存最终回复
            await conv_db.insert_message(conversation_id, "assistant", round_text)
            await conv_db.touch_conversation(conversation_id)
            logger.info(
                "Chat completed conv=%s reply_len=%d tokens_total=%d prompt=%d completion=%d",
                conversation_id, len(round_text),
                accumulated_usage.get("total_tokens", 0),
                accumulated_usage.get("prompt_tokens", 0),
                accumulated_usage.get("completion_tokens", 0),
            )
            yield {"type": "done", "conversation_id": conversation_id}
            return

        # —— 有工具调用 ——
        logger.info(
            "Round %d: %d tool calls [%s] (text_before=%d chars)",
            round_num, len(round_tool_calls),
            ", ".join(tc["name"] for tc in round_tool_calls),
            len(round_text),
        )

        # 追加 assistant 消息（含过渡文本 + tool_calls）
        assistant_msg = {
            "role": "assistant",
            "content": round_text,
            "tool_calls": [
                {
                    "id": tc["id"],
                    "type": "function",
                    "function": {"name": tc["name"], "arguments": tc["arguments"]},
                }
                for tc in round_tool_calls
            ],
        }
        messages.append(assistant_msg)
        await conv_db.insert_message(
            conversation_id, "assistant", round_text,
            tool_calls=round_tool_calls,
        )

        # 逐个执行 tool_call
        for tc in round_tool_calls:
            tool_name = tc["name"]
            try:
                args = json.loads(tc["arguments"])
            except json.JSONDecodeError:
                args = {}

            # 推送 tool_call 事件（执行前）
            yield {"type": "tool_call", "name": tool_name, "round": round_num, "arguments": args}

            # ShellTool 需注入 caller_ip
            if tool_name == "shell":
                args["caller_ip"] = caller_ip

            tool = get_tool(tool_name)
            if tool is None:
                tool_result = f"Error: tool '{tool_name}' not found"
                tool_success = False
            else:
                result = await tool.execute(**args)
                tool_result = result.content if result.success else f"Error: {result.error}"
                tool_success = result.success

            logger.info("  Tool %s → %s", tool_name, tool_result[:200] if tool_result else "(empty)")

            # 推送 tool_result 事件（执行后）
            yield {
                "type": "tool_result",
                "name": tool_name,
                "round": round_num,
                "success": tool_success,
                "content": tool_result[:500],  # 截断防止过大
            }

            # 追加 tool 消息到 messages
            messages.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": tool_result,
            })
            await conv_db.insert_message(
                conversation_id, "tool", tool_result,
                tool_call_id=tc["id"],
            )

    # 达到最大轮次
    logger.warning(
        "Tool loop reached max rounds (%d). accumulated_total=%d",
        max_rounds, accumulated_usage.get("total_tokens", 0),
    )
    fallback = "（达到工具调用最大轮次限制，已停止）"
    yield {"type": "delta", "content": fallback}
    await conv_db.insert_message(conversation_id, "assistant", fallback)
    await conv_db.touch_conversation(conversation_id)
    yield {"type": "done", "conversation_id": conversation_id}


def _format_sse(event: dict) -> str:
    """将事件 dict 格式化为 SSE 字符串。"""
    etype = event.get("type", "message")
    data = json.dumps(event, ensure_ascii=False)
    return f"event: {etype}\ndata: {data}\n\n"


def _get_tools_for_role(role: str) -> list[dict] | None:
    """
    按角色过滤可用工具，返回 OpenAI schema 列表。
    """
    config = get_config()
    role_config = config.roles.get(role, config.roles.get("default", {}))
    role_tools = role_config.get("tools")

    if role_tools is None:
        return get_openai_tools()

    all_tools = {t.name: t for t in list_tools()}
    schemas = []
    for name in role_tools:
        tool = all_tools.get(name)
        if tool:
            schemas.append(tool.to_openai_schema())
    return schemas if schemas else None
