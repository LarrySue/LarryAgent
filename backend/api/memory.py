"""
记忆管理 API 路由

职责：
- POST /api/memory/archive：手动触发会话归档（生成摘要）
- POST /api/memory/archive/confirm：用户确认摘要后双写存储
- GET /api/memory：列出所有记忆
- DELETE /api/memory/{id}：删除指定记忆（SQLite + ChromaDB 双删）

与其他模块的关系：
- 依赖 memory/archiver.py 执行归档
- 依赖 db/memories.py 操作 SQLite
- 依赖 rag/vector_store.py 删除向量
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import get_config
from db.memories import list_memories, delete_memory as db_delete_memory
from memory.archiver import generate_summary, confirm_and_store
from rag.vector_store import delete_by_memory_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/memory", tags=["memory"])


class ArchiveRequest(BaseModel):
    """归档请求体"""
    conversation_id: int
    model: str = "deepseek-chat"


class ArchiveResponse(BaseModel):
    """归档响应体：返回摘要供用户确认"""
    conversation_id: int
    summary: str
    status: str = "pending_confirm"


class ConfirmRequest(BaseModel):
    """确认归档请求体"""
    conversation_id: int
    summary: str
    source_role: str = "default"


class MemoryResponse(BaseModel):
    """记忆列表中的单条记录"""
    id: int
    content: str
    source_conversation_id: int | None = None
    created_at: str
    updated_at: str
    is_active: int


@router.post("/archive", response_model=ArchiveResponse)
async def trigger_archive(req: ArchiveRequest):
    """
    手动触发会话归档。

    流程：
    1. 加载会话消息
    2. 调用 LLM 生成摘要
    3. 返回摘要供用户确认（不直接存储）
    """
    try:
        summary = await generate_summary(
            conversation_id=req.conversation_id,
            model=req.model,
        )
        return ArchiveResponse(
            conversation_id=req.conversation_id,
            summary=summary,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Archive generation failed")
        raise HTTPException(status_code=500, detail=f"Archive generation failed: {e}")


@router.post("/archive/confirm")
async def confirm_archive(req: ConfirmRequest):
    """
    用户确认归档摘要后，双写入 SQLite + ChromaDB。

    Args:
        req: 包含 conversation_id、summary、source_role
    """
    try:
        memory_id = await confirm_and_store(
            conversation_id=req.conversation_id,
            summary=req.summary,
            source_role=req.source_role,
        )
        return {
            "memory_id": memory_id,
            "conversation_id": req.conversation_id,
            "status": "archived",
        }
    except Exception as e:
        logger.exception("Archive confirm failed")
        raise HTTPException(status_code=500, detail=f"Archive confirm failed: {e}")


@router.get("", response_model=list[MemoryResponse])
async def get_memories(active_only: bool = True):
    """
    列出所有长期记忆。

    Args:
        active_only: 为 True 时只返回活跃记忆
    """
    memories = await list_memories(active_only=active_only)
    return memories


@router.delete("/{memory_id}")
async def delete_memory(memory_id: int):
    """
    删除指定记忆（同时从 SQLite 和 ChromaDB 中删除）。

    Args:
        memory_id: 记忆 ID
    """
    config = get_config()

    # 1. 从 ChromaDB 删除向量（如果启用）
    if config.vector_store.enabled:
        try:
            await delete_by_memory_id(memory_id)
        except Exception as e:
            logger.warning("Failed to delete ChromaDB vectors for memory_id=%d: %s", memory_id, e)

    # 2. 从 SQLite 删除
    try:
        await db_delete_memory(memory_id)
    except Exception as e:
        logger.exception("Failed to delete memory from SQLite")
        raise HTTPException(status_code=500, detail=f"Failed to delete memory: {e}")

    logger.info("Memory deleted: id=%d", memory_id)
    return {"status": "deleted", "memory_id": memory_id}
