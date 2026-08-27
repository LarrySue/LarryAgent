"""
长期记忆 CRUD 模块

职责：
- 创建/查询/更新/删除 memories 表记录
- 支持软删除（is_active=0）和硬删除
- 供 memory/archiver.py 和 api/memory.py 调用

与其他模块的关系：
- 被 memory/archiver.py 调用，归档时写入新记忆
- 被 memory/engine.py 调用，检索前过滤活跃记忆
- 与 rag/vector_store.py 配合，实现双写双删
"""

import logging

from db.database import get_db

logger = logging.getLogger(__name__)


async def create_memory(
    content: str,
    source_conversation_id: int | None = None,
) -> int:
    """
    创建一条新的长期记忆。

    Args:
        content: 记忆内容（通常是 LLM 生成的摘要）
        source_conversation_id: 来源会话 ID，可为空

    Returns:
        memory_id
    """
    db = await get_db()
    cursor = await db.execute(
        "INSERT INTO memories (content, source_conversation_id) VALUES (?, ?)",
        (content, source_conversation_id),
    )
    await db.commit()
    memory_id = cursor.lastrowid
    logger.info(
        "Created memory id=%s conv=%s len=%d",
        memory_id,
        source_conversation_id,
        len(content),
    )
    return memory_id


async def get_memory(memory_id: int) -> dict | None:
    """按 ID 查询单条记忆，不存在返回 None。"""
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, content, source_conversation_id, created_at, updated_at, is_active "
        "FROM memories WHERE id = ?",
        (memory_id,),
    )
    row = await cursor.fetchone()
    if row is None:
        return None
    return dict(row)


async def get_active_memory_by_conversation_id(conversation_id: int) -> dict | None:
    """
    按来源会话查询活跃记忆（is_active=1），返回单条或 None。

    语义：同会话只保留一条"最新生效"记忆；confirm 前调用以做重复提取幂等。
    """
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, content, source_conversation_id, created_at, updated_at, is_active "
        "FROM memories WHERE source_conversation_id = ? AND is_active = 1 "
        "ORDER BY created_at DESC LIMIT 1",
        (conversation_id,),
    )
    row = await cursor.fetchone()
    if row is None:
        return None
    return dict(row)


async def list_memories(active_only: bool = True) -> list[dict]:
    """
    列出所有记忆。

    Args:
        active_only: 为 True 时只返回活跃记忆（is_active=1）

    Returns:
        记忆列表，按创建时间降序
    """
    db = await get_db()
    if active_only:
        cursor = await db.execute(
            "SELECT id, content, source_conversation_id, created_at, updated_at, is_active "
            "FROM memories WHERE is_active = 1 ORDER BY created_at DESC",
        )
    else:
        cursor = await db.execute(
            "SELECT id, content, source_conversation_id, created_at, updated_at, is_active "
            "FROM memories ORDER BY created_at DESC",
        )
    rows = await cursor.fetchall()
    result = [dict(row) for row in rows]
    logger.debug("Listed %d memories (active_only=%s)", len(result), active_only)
    return result


async def update_memory(memory_id: int, content: str) -> None:
    """
    更新记忆内容（用户修改摘要后保存）。

    Args:
        memory_id: 记忆 ID
        content: 新内容
    """
    db = await get_db()
    await db.execute(
        "UPDATE memories SET content = ?, updated_at = datetime('now') WHERE id = ?",
        (content, memory_id),
    )
    await db.commit()
    logger.info("Updated memory id=%s len=%d", memory_id, len(content))


async def deactivate_memory(memory_id: int) -> None:
    """
    软删除记忆：标记 is_active=0，不再参与检索。

    Args:
        memory_id: 记忆 ID
    """
    db = await get_db()
    await db.execute(
        "UPDATE memories SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
        (memory_id,),
    )
    await db.commit()
    logger.info("Deactivated memory id=%s", memory_id)


async def delete_memory(memory_id: int) -> None:
    """
    硬删除记忆（从 SQLite 中彻底移除）。
    注意：调用此函数时需同时删除 ChromaDB 中的向量。

    Args:
        memory_id: 记忆 ID
    """
    db = await get_db()
    await db.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
    await db.commit()
    logger.info("Hard-deleted memory id=%s", memory_id)
