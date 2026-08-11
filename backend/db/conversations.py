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
