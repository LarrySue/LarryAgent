"""
聊天 API 路由

职责：
- POST /api/chat：接收用户消息，完成记忆检索 → LLM 调用 → 返回响应的完整流程
- 支持流式（SSE）和非流式两种响应模式
- 自动保存对话到数据库

与其他模块的关系：
- 依赖 memory/engine.py 检索短期和长期记忆
- 依赖 models/llm.py 调用 LLM
- 依赖 tools/registry.py 获取工具列表
- 依赖 db/database.py 保存消息
"""

import logging

from fastapi import APIRouter, HTTPException
from openai import APIError
from pydantic import BaseModel, Field

from db import conversations as conv_db
from memory.engine import build_memory_context, get_short_term_memory
from models.llm import chat_completion

logger = logging.getLogger(__name__)

# 默认系统提示，让 LLM 知道自己的角色
DEFAULT_SYSTEM_PROMPT = "你是 LarryAgent，一个个人 AI 助手。简洁、直接地回答问题。"

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    """聊天请求体"""
    conversation_id: int | None = None  # None 表示新建会话
    message: str = Field(..., min_length=1)
    model: str = "deepseek-chat"
    stream: bool = False
    temperature: float = 0.7


class ChatResponse(BaseModel):
    """非流式聊天响应体"""
    conversation_id: int
    reply: str
    model: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    聊天接口 - 非流式。

    处理流程：
    1. 如果无 conversation_id，创建新会话
    2. 保存用户消息到数据库
    3. 检索短期记忆（最近消息）
    4. 调用 LLM
    5. 保存助手回复到数据库
    6. 返回响应
    """
    logger.info(
        "Chat request conv=%s model=%s msg_len=%d",
        req.conversation_id,
        req.model,
        len(req.message),
    )

    # 1. 解析/创建会话
    if req.conversation_id is None:
        conversation_id = await conv_db.create_conversation()
    else:
        existing = await conv_db.get_conversation(req.conversation_id)
        if existing is None:
            logger.warning("Conversation not found: id=%s", req.conversation_id)
            raise HTTPException(status_code=404, detail="Conversation not found")
        conversation_id = req.conversation_id

    # 2. 保存用户消息
    await conv_db.insert_message(conversation_id, "user", req.message)

    # 3. 短期记忆（含刚写入的用户消息）
    short_term = await get_short_term_memory(conversation_id)
    messages = build_memory_context(short_term, long_term=[], system_prompt=DEFAULT_SYSTEM_PROMPT)

    # 4. 调用 LLM
    try:
        reply = await chat_completion(
            model=req.model,
            messages=messages,
            temperature=req.temperature,
        )
    except ValueError as e:
        logger.warning("Chat config error: %s", e)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except APIError as e:
        logger.error("LLM API error: %s", e)
        raise HTTPException(status_code=502, detail=f"LLM API error: {e}") from e
    except Exception as e:
        logger.exception("Unexpected error during chat")
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}") from e

    # 5. 保存助手回复
    await conv_db.insert_message(conversation_id, "assistant", reply)
    await conv_db.touch_conversation(conversation_id)

    logger.info(
        "Chat completed conv=%s reply_len=%d",
        conversation_id,
        len(reply),
    )
    return ChatResponse(
        conversation_id=conversation_id,
        reply=reply,
        model=req.model,
    )


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    聊天接口 - 流式（Server-Sent Events）。

    与 /api/chat 流程相同，但使用 SSE 逐步返回生成内容。
    """
    raise HTTPException(status_code=501, detail="Stream chat not yet implemented")
