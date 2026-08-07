"""
会话与消息 CRUD 模块

职责：
- 创建/查询 conversation
- 插入 message、更新会话时间戳
- 供 api/chat.py 内部隐式调用，本阶段不暴露独立 API
"""

import logging

from db.database import get_db

logger = logging.getLogger(__name__)


async def create_conversation(title: str = "") -> int:
    """创建新会话，返回 conversation_id。"""
    db = await get_db()
    cursor = await db.execute(
        "INSERT INTO conversations (title) VALUES (?)",
        (title,),
    )
    await db.commit()
    conv_id = cursor.lastrowid
    logger.info("Created conversation id=%s title=%r", conv_id, title)
    return conv_id


async def get_conversation(conversation_id: int) -> dict | None:
    """按 ID 查询会话，不存在返回 None。"""
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, title, created_at, updated_at, is_archived "
        "FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    row = await cursor.fetchone()
    if row is None:
        return None
    return dict(row)


async def touch_conversation(conversation_id: int) -> None:
    """更新会话 updated_at 为当前时间。"""
    db = await get_db()
    await db.execute(
        "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
        (conversation_id,),
    )
    await db.commit()
    logger.debug("Touched conversation id=%s", conversation_id)


async def insert_message(
    conversation_id: int,
    role: str,
    content: str,
) -> int:
    """插入一条消息，返回 message_id。"""
    db = await get_db()
    cursor = await db.execute(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
        (conversation_id, role, content),
    )
    await db.commit()
    msg_id = cursor.lastrowid
    logger.info(
        "Inserted message id=%s conv=%s role=%s len=%d",
        msg_id,
        conversation_id,
        role,
        len(content),
    )
    return msg_id


async def get_messages(
    conversation_id: int,
    limit: int = 20,
) -> list[dict]:
    """
    获取会话的最近 N 条消息，按时间正序返回。

    Args:
        conversation_id: 会话 ID
        limit: 最多取多少条

    Returns:
        消息列表，每条包含 role 和 content
    """
    db = await get_db()
    cursor = await db.execute(
        "SELECT role, content FROM messages "
        "WHERE conversation_id = ? ORDER BY id DESC LIMIT ?",
        (conversation_id, limit),
    )
    rows = await cursor.fetchall()
    # 反转回时间正序
    rows = list(reversed(rows))
    return [{"role": row["role"], "content": row["content"]} for row in rows]
