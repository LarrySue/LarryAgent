"""
聊天业务服务层

职责：
- 会话创建/恢复
- 记忆检索 → 构建 messages
- Function calling 循环（LLM ↔ 工具，含 caller_ip 注入）
- 消息持久化（含 tool_calls / tool_call_id）
- 流式 / 非流式统一入口（_chat_flow async generator）

与其他模块的关系：
- 被 api/chat.py 调用，是聊天业务的唯一入口
- 依赖 models/llm.py 调用 LLM
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
from models.llm import chat_completion, chat_completion_stream
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


async def _chat_flow(req: ChatRequest, caller_ip: str) -> AsyncGenerator[dict, None]:
    """
    统一聊天流程（async generator）。

    事件类型：
    - tool_call: 工具即将执行
    - tool_result: 工具执行完成
    - delta: 文本片段（最终回复）
    - done: 流结束
    - error: 错误
    """
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
    system_prompt = get_config().get_system_prompt(req.role)
    messages = build_memory_context(short_term, long_term=long_term, system_prompt=system_prompt)

    # 4. 获取角色可用工具
    tools = _get_tools_for_role(req.role)

    # 5. Function calling 循环
    max_rounds = _get_max_rounds()
    for round_num in range(1, max_rounds + 1):
        response = await chat_completion(
            model=req.model,
            messages=messages,
            temperature=req.temperature,
            tools=tools,
        )

        if not response.has_tool_calls:
            # 最终回复 — 真实流式输出
            logger.info("Tool loop completed at round %d (stop)", round_num)
            full_reply = ""
            async for chunk in chat_completion_stream(
                model=req.model,
                messages=messages,
                temperature=req.temperature,
            ):
                full_reply += chunk
                yield {"type": "delta", "content": chunk}

            # 保存最终回复
            await conv_db.insert_message(conversation_id, "assistant", full_reply)
            await conv_db.touch_conversation(conversation_id)
            logger.info("Chat completed conv=%s reply_len=%d", conversation_id, len(full_reply))
            yield {"type": "done", "conversation_id": conversation_id}
            return

        logger.info(
            "Round %d: %d tool calls [%s]",
            round_num, len(response.tool_calls),
            ", ".join(tc["name"] for tc in response.tool_calls),
        )

        # 追加 assistant 消息（含 tool_calls）
        assistant_msg = {
            "role": "assistant",
            "content": response.content,
            "tool_calls": [
                {
                    "id": tc["id"],
                    "type": "function",
                    "function": {"name": tc["name"], "arguments": tc["arguments"]},
                }
                for tc in response.tool_calls
            ],
        }
        messages.append(assistant_msg)
        await conv_db.insert_message(
            conversation_id, "assistant", response.content,
            tool_calls=response.tool_calls,
        )

        # 逐个执行 tool_call
        for tc in response.tool_calls:
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
    logger.warning("Tool loop reached max rounds (%d)", max_rounds)
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
