"""
聊天业务服务层

职责：
- 会话创建/恢复
- 记忆检索 → 构建 messages
- Function calling 循环（LLM ↔ 工具，含 caller_ip 注入）
- 消息持久化（含 tool_calls / tool_call_id）
- 最大轮次限制（默认 10）

与其他模块的关系：
- 被 api/chat.py 调用，是聊天业务的唯一入口
- 依赖 models/llm.py 调用 LLM
- 依赖 tools/registry.py 获取和执行工具
- 依赖 memory/engine.py 检索记忆
- 依赖 db/conversations.py 持久化消息
"""

import json
import logging

from pydantic import BaseModel, Field

from config import get_config
from db import conversations as conv_db
from memory.engine import build_memory_context, get_long_term_memory, get_short_term_memory
from models.llm import chat_completion
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
    完整聊天流程：
    1. 创建/恢复会话
    2. 保存用户消息
    3. 检索记忆 → 构建 messages
    4. Function calling 循环
    5. 保存最终回复
    6. 返回响应
    """
    logger.info(
        "Chat request conv=%s model=%s msg_len=%d caller_ip=%s",
        req.conversation_id,
        req.model,
        len(req.message),
        caller_ip,
    )

    # 1. 解析/创建会话
    if req.conversation_id is None:
        conversation_id = await conv_db.create_conversation()
    else:
        existing = await conv_db.get_conversation(req.conversation_id)
        if existing is None:
            raise ValueError(f"Conversation not found: {req.conversation_id}")
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
    reply = await _run_tool_loop(
        model=req.model,
        messages=messages,
        tools=tools,
        temperature=req.temperature,
        conversation_id=conversation_id,
        caller_ip=caller_ip,
    )

    # 6. 保存最终回复
    await conv_db.insert_message(conversation_id, "assistant", reply)
    await conv_db.touch_conversation(conversation_id)

    logger.info("Chat completed conv=%s reply_len=%d", conversation_id, len(reply))
    return ChatResponse(conversation_id=conversation_id, reply=reply, model=req.model)


async def _run_tool_loop(
    model: str,
    messages: list[dict],
    tools: list[dict] | None,
    temperature: float,
    conversation_id: int,
    caller_ip: str,
) -> str:
    """
    Function calling 循环：LLM 调工具 → 追加结果 → 再调 LLM，直到返回纯文本。

    每轮的 assistant 消息（含 tool_calls）和 tool 结果消息都会持久化到 DB，
    确保会话恢复时不丢失工具调用上下文。
    """
    max_rounds = _get_max_rounds()
    for round_num in range(1, max_rounds + 1):
        response = await chat_completion(
            model=model,
            messages=messages,
            temperature=temperature,
            tools=tools,
        )

        if not response.has_tool_calls:
            # LLM 返回纯文本，循环结束
            logger.info("Tool loop completed at round %d (stop)", round_num)
            return response.content

        logger.info(
            "Round %d: %d tool calls [%s]",
            round_num,
            len(response.tool_calls),
            ", ".join(tc["name"] for tc in response.tool_calls),
        )

        # 1. 追加 assistant 消息（含 tool_calls）到 messages
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

        # 持久化 assistant 消息
        await conv_db.insert_message(
            conversation_id,
            "assistant",
            response.content,
            tool_calls=response.tool_calls,
        )

        # 2. 逐个执行 tool_call
        for tc in response.tool_calls:
            tool_name = tc["name"]
            try:
                args = json.loads(tc["arguments"])
            except json.JSONDecodeError:
                args = {}

            # ShellTool 需注入 caller_ip
            if tool_name == "shell":
                args["caller_ip"] = caller_ip

            tool = get_tool(tool_name)
            if tool is None:
                tool_result = f"Error: tool '{tool_name}' not found"
            else:
                result = await tool.execute(**args)
                tool_result = result.content if result.success else f"Error: {result.error}"

            logger.info(
                "  Tool %s → %s",
                tool_name,
                tool_result[:200] if tool_result else "(empty)",
            )

            # 追加 tool 消息到 messages（必须带 tool_call_id）
            messages.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": tool_result,
            })

            # 持久化 tool 消息
            await conv_db.insert_message(
                conversation_id,
                "tool",
                tool_result,
                tool_call_id=tc["id"],
            )

    # 达到最大轮次
    logger.warning("Tool loop reached max rounds (%d)", max_rounds)
    return "（达到工具调用最大轮次限制，已停止）"


def _get_tools_for_role(role: str) -> list[dict] | None:
    """
    按角色过滤可用工具，返回 OpenAI schema 列表。

    config.yaml 中 role 下可选配置 tools 列表：
      roles:
        default:
          system_prompt: "..."
          tools: ["file_ops", "shell"]

    未配置 tools 则返回所有工具（None 表示不启用 function calling 的空列表也转为 None）。
    """
    config = get_config()
    role_config = config.roles.get(role, config.roles.get("default", {}))
    role_tools = role_config.get("tools")

    if role_tools is None:
        return get_openai_tools()

    # 按角色配置过滤
    all_tools = {t.name: t for t in list_tools()}
    schemas = []
    for name in role_tools:
        tool = all_tools.get(name)
        if tool:
            schemas.append(tool.to_openai_schema())
    return schemas if schemas else None
