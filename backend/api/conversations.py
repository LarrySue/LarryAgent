"""
会话管理 API 路由

职责：
- GET  /api/conversations          会话列表（updated_at DESC）
- POST /api/conversations          手动新建（title 空 = 前端显示"新会话"占位）
- GET  /api/conversations/{id}/messages  完整历史消息（含 role=tool，前端过滤）
- PATCH /api/conversations/{id}    重命名
- DELETE /api/conversations/{id}   删除（PRAGMA foreign_keys=ON 级联删 messages）

与其他模块的关系：
- 依赖 db/conversations.py 持久化
- 前缀 /api → 自动经过 AuthMiddleware（P3.4）
- 资源不存在时抛 ResourceNotFoundError（404）
"""

import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

from db import conversations as conv_db
from exceptions import ResourceNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


# === Request schemas ===

class ConversationCreateRequest(BaseModel):
    title: str = Field(default="", description="标题；空字符串合法（前端显示'新会话'占位）")


class ConversationPatchRequest(BaseModel):
    title: str = Field(..., description="新标题（空字符串合法）")


# === Route handlers ===

@router.get("")
async def list_conversations(limit: int = 50):
    """
    获取会话列表，按 updated_at DESC 排序。

    Query params:
        limit: 最多返回条数（默认 50）
    """
    return await conv_db.list_conversations(limit=limit)


@router.post("")
async def create_conversation(req: ConversationCreateRequest):
    """
    手动新建会话（不发送消息）。

    title 空串 = 前端显示"新会话"占位，等首条消息到达时
    chat_service._chat_flow 不覆盖已有的 title（保持空串）。
    """
    conv_id = await conv_db.create_conversation(req.title)
    return {"id": conv_id, "title": req.title}


@router.get("/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: int):
    """
    获取会话完整历史消息（按时间正序）。

    返回完整数据含 role="tool"，前端按需过滤展示。
    message.tool_calls 已反序列化为 OpenAI 格式 [{id, type, function: {name, arguments}}]。
    """
    existing = await conv_db.get_conversation(conversation_id)
    if existing is None:
        raise ResourceNotFoundError(f"Conversation not found: {conversation_id}")
    return await conv_db.get_conversation_messages(conversation_id)


@router.patch("/{conversation_id}")
async def patch_conversation(conversation_id: int, req: ConversationPatchRequest):
    """重命名会话。"""
    existing = await conv_db.get_conversation(conversation_id)
    if existing is None:
        raise ResourceNotFoundError(f"Conversation not found: {conversation_id}")
    await conv_db.rename_conversation(conversation_id, req.title)
    return {"id": conversation_id, "title": req.title}


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int):
    """
    删除会话。

    messages 外键 ON DELETE CASCADE → 自动级联删除；
    memories 外键 ON DELETE SET NULL → source_conversation_id 自动置空。
    """
    existing = await conv_db.get_conversation(conversation_id)
    if existing is None:
        raise ResourceNotFoundError(f"Conversation not found: {conversation_id}")
    await conv_db.delete_conversation(conversation_id)
    return {"ok": True}
