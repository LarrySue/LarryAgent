"""
记忆管理 API 路由

职责：
- POST /api/memory/archive：手动触发会话归档
- GET /api/memory/search：查询长期记忆
- DELETE /api/memory/{id}：删除指定记忆

与其他模块的关系：
- 依赖 memory/archiver.py 执行归档
- 依赖 db/database.py 读取和删除 memories 表
- 依赖 rag/vector_store.py 删除向量
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/memory", tags=["memory"])


class ArchiveRequest(BaseModel):
    """归档请求体"""
    conversation_id: int
    model: str = "deepseek-chat"


class ArchiveResponse(BaseModel):
    """归档响应体：先返回摘要让用户确认"""
    conversation_id: int
    summary: str
    status: str  # "pending_confirm"


class ConfirmRequest(BaseModel):
    """确认归档请求体"""
    conversation_id: int
    summary: str


@router.post("/archive", response_model=ArchiveResponse)
async def trigger_archive(req: ArchiveRequest):
    """
    手动触发会话归档。

    流程：
    1. 加载会话消息
    2. 调用 LLM 生成摘要
    3. 返回摘要供用户确认（不直接存储）
    """
    # TODO: 调用 memory/archiver.py 的 generate_summary
    raise HTTPException(status_code=501, detail="Archive not yet implemented")


@router.post("/archive/confirm")
async def confirm_archive(req: ConfirmRequest):
    """用户确认归档摘要后，写入长期记忆。"""
    # TODO: 调用 memory/archiver.py 的 confirm_and_store
    raise HTTPException(status_code=501, detail="Archive confirm not yet implemented")


@router.get("/search")
async def search_memories(query: str, limit: int = 10):
    """
    搜索长期记忆。

    Args:
        query: 搜索关键词
        limit: 返回条数上限

    Returns:
        匹配的记忆列表
    """
    # TODO: 对 query 向量化 → ChromaDB 检索 → 返回匹配的记忆
    raise HTTPException(status_code=501, detail="Memory search not yet implemented")


@router.delete("/{memory_id}")
async def delete_memory(memory_id: int):
    """
    删除指定记忆（同时从 SQLite 和 ChromaDB 中删除）。
    """
    # TODO: 1) 从 SQLite 标记删除或物理删除
    #       2) 从 ChromaDB 删除对应向量
    raise HTTPException(status_code=501, detail="Memory delete not yet implemented")
