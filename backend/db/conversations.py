"""
会话与消息 CRUD 模块

职责：
- 创建/查询 conversation
- 插入 message（含 tool_calls / tool_call_id）、更新会话时间戳
- 供 services/chat_service.py 调用，本阶段不暴露独立 API
"""

import json
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
        "SELECT id, title, created_at, updated_at, is_archived, deleted_at "
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
    tool_calls: list[dict] | None = None,
    tool_call_id: str | None = None,
) -> int:
    """
    插入一条消息，返回 message_id。

    Args:
        conversation_id: 会话 ID
        role: 消息角色 (user/assistant/system/tool)
        content: 消息文本内容
        tool_calls: assistant 消息的工具调用列表 [{id, name, arguments}]，序列化为 JSON 存储
        tool_call_id: tool 消息对应的 tool_call ID，用于匹配 assistant 的 tool_calls
    """
    db = await get_db()
    tool_calls_json = json.dumps(tool_calls, ensure_ascii=False) if tool_calls else None
    cursor = await db.execute(
        "INSERT INTO messages (conversation_id, role, content, tool_calls, tool_call_id) "
        "VALUES (?, ?, ?, ?, ?)",
        (conversation_id, role, content, tool_calls_json, tool_call_id),
    )
    await db.commit()
    msg_id = cursor.lastrowid
    logger.info(
        "Inserted message id=%s conv=%s role=%s len=%d tool_calls=%s",
        msg_id,
        conversation_id,
        role,
        len(content),
        len(tool_calls) if tool_calls else 0,
    )
    return msg_id


async def get_messages(
    conversation_id: int,
    limit: int | None = 20,
) -> list[dict]:
    """
    获取会话的消息，按时间正序返回。

    Args:
        conversation_id: 会话 ID
        limit: 最多取多少条，None 表示加载全部

    Returns:
        消息列表，每条包含 role, content, tool_calls(反序列化后), tool_call_id
    """
    db = await get_db()
    if limit is None:
        cursor = await db.execute(
            "SELECT role, content, tool_calls, tool_call_id FROM messages "
            "WHERE conversation_id = ? ORDER BY id ASC",
            (conversation_id,),
        )
    else:
        cursor = await db.execute(
            "SELECT role, content, tool_calls, tool_call_id FROM messages "
            "WHERE conversation_id = ? ORDER BY id DESC LIMIT ?",
            (conversation_id, limit),
        )
    rows = await cursor.fetchall()
    if limit is not None:
        rows = list(reversed(rows))

    result = []
    for row in rows:
        msg = {"role": row["role"], "content": row["content"]}
        # tool_calls: DB 存 [{id, name, arguments}]，转为 OpenAI 格式 [{id, type, function: {name, arguments}}]
        if row["tool_calls"]:
            raw_calls = json.loads(row["tool_calls"])
            msg["tool_calls"] = [
                {
                    "id": tc["id"],
                    "type": "function",
                    "function": {"name": tc["name"], "arguments": tc["arguments"]},
                }
                for tc in raw_calls
            ]
        # tool_call_id: tool 消息的匹配 ID
        if row["tool_call_id"]:
            msg["tool_call_id"] = row["tool_call_id"]
        result.append(msg)
    return result


async def mark_archived(conversation_id: int) -> None:
    """标记会话为已归档。"""
    db = await get_db()
    await db.execute(
        "UPDATE conversations SET is_archived = 1, updated_at = datetime('now') WHERE id = ?",
        (conversation_id,),
    )
    await db.commit()
    logger.info("Marked conversation id=%s as archived", conversation_id)


async def list_conversations(
    limit: int = 50,
    archived: bool | None = None,
    include_trash: bool = False,
) -> list[dict]:
    """
    列出会话，按 updated_at DESC, id DESC 排序。

    二级排序 id DESC 的原因：SQLite datetime('now') 只有秒级精度，
    同一秒内创建/修改的多个会话 updated_at 完全相同，此时按 id DESC
    保证"后创建的（id 更大）排在前面"，符合前端预期的时间线顺序。

    Args:
        limit: 最多返回多少条（默认 50）
        archived: None=不过滤；True=仅归档；False=仅活跃（is_archived=0）
        include_trash: True=仅回收站（deleted_at 非空）；False=排除回收站

    Returns:
        [{id, title, updated_at, is_archived, deleted_at}]
    """
    conditions: list[str] = []
    if include_trash:
        conditions.append("deleted_at IS NOT NULL")
    else:
        conditions.append("deleted_at IS NULL")
    if archived is not None:
        conditions.append("is_archived = 1" if archived else "is_archived = 0")

    where = "WHERE " + " AND ".join(conditions) if conditions else ""
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, title, updated_at, is_archived, deleted_at FROM conversations "
        f"{where} ORDER BY updated_at DESC, id DESC LIMIT ?",
        (limit,),
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


async def rename_conversation(conversation_id: int, title: str) -> None:
    """重命名会话。title 空字符串合法（前端显示"新会话"占位）。"""
    db = await get_db()
    await db.execute(
        "UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE id = ?",
        (title, conversation_id),
    )
    await db.commit()
    logger.info("Renamed conversation id=%s to %r", conversation_id, title)


async def delete_conversation(conversation_id: int) -> None:
    """
    软删除会话：置 deleted_at=datetime('now')，会话进入回收站。

    消息与记忆**保留**（软删不触发外键级联）；恢复后完整可见。
    硬删除（purge）才真正级联清理 messages。
    """
    db = await get_db()
    cursor = await db.execute(
        "UPDATE conversations SET deleted_at = datetime('now') WHERE id = ?",
        (conversation_id,),
    )
    await db.commit()
    rows_affected = cursor.rowcount
    logger.info(
        "Soft-deleted conversation id=%s (rows affected=%d, entered trash)",
        conversation_id, rows_affected,
    )


async def unarchive_conversation(conversation_id: int) -> None:
    """取消归档：is_archived 置 0。"""
    db = await get_db()
    await db.execute(
        "UPDATE conversations SET is_archived = 0 WHERE id = ?",
        (conversation_id,),
    )
    await db.commit()
    logger.info("Unarchived conversation id=%s", conversation_id)


async def list_trash(limit: int = 100) -> list[dict]:
    """列出回收站中的会话（deleted_at 非空），按删除时间倒序。"""
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, title, updated_at, is_archived, deleted_at FROM conversations "
        "WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC, id DESC LIMIT ?",
        (limit,),
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


async def restore_conversation(conversation_id: int) -> None:
    """从回收站恢复：deleted_at 置 NULL。"""
    db = await get_db()
    await db.execute(
        "UPDATE conversations SET deleted_at = NULL WHERE id = ?",
        (conversation_id,),
    )
    await db.commit()
    logger.info("Restored conversation id=%s from trash", conversation_id)


async def purge_conversation(conversation_id: int) -> None:
    """
    硬删除会话（彻底移除）。

    messages 外键 ON DELETE CASCADE → 自动级联删除；
    memories 外键 ON DELETE SET NULL → source_conversation_id 自动置空。
    """
    db = await get_db()
    cursor = await db.execute(
        "DELETE FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    await db.commit()
    rows_affected = cursor.rowcount
    logger.info(
        "Purged conversation id=%s (rows affected=%d, cascaded messages/memories via FK)",
        conversation_id, rows_affected,
    )


async def get_conversation_messages(conversation_id: int) -> list[dict]:
    """
    获取会话完整历史消息（按时间正序）。
    API 返回完整数据含 role="tool"，前端按需过滤展示。

    Returns:
        消息列表：每条 {id, role, content, tool_calls?(反序列化), tool_call_id?, created_at}
    """
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, role, content, tool_calls, tool_call_id, created_at FROM messages "
        "WHERE conversation_id = ? ORDER BY id ASC",
        (conversation_id,),
    )
    rows = await cursor.fetchall()
    result = []
    for row in rows:
        msg = {
            "id": row["id"],
            "role": row["role"],
            "content": row["content"],
            "created_at": row["created_at"],
        }
        if row["tool_calls"]:
            raw_calls = json.loads(row["tool_calls"])
            msg["tool_calls"] = [
                {
                    "id": tc["id"],
                    "type": "function",
                    "function": {"name": tc["name"], "arguments": tc["arguments"]},
                }
                for tc in raw_calls
            ]
        if row["tool_call_id"]:
            msg["tool_call_id"] = row["tool_call_id"]
        result.append(msg)
    return result
