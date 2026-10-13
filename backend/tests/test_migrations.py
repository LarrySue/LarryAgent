"""
迁移 fail-loud 测试（WB 派发 2026-10-13：迁移失败静默吞修复）

- 负向 A（query_only 场地）：老形态库（四表＋两索引预建、缺三个增量列）＋
  PRAGMA query_only=ON ⇒ run_migrations 必须抛 RuntimeError 且含全部失败的
  表.列 明细（吞成 warning 照常 commit 返回 = FAIL）
- 正向锚（同批必绿）：同一老形态库不加 query_only ⇒ run_migrations 正常返回，
  PRAGMA table_info 三列全部就位（messages.tool_call_id ／
  conversations.deleted_at ／ tools.group_name）
- 双锚理由：只断言负向时，「环境没起来」与「破坏生效」不可区分（假通过）。

数据隔离：直连 tmp_path 下自建临时库文件，不碰 session_db_path / 真实库
（conftest autouse 断言兜底）。

async 形态：sync 测试函数 + asyncio.run 包裹（先例：test_conversations.py）。
"""

import asyncio
import pathlib

import aiosqlite
import pytest

from db.migrations import run_migrations

# 老形态 schema：现役四表减去三个增量列（tool_call_id / deleted_at / group_name）。
# ⚠️ 两索引也必须预建——否则 query_only 场地下 CREATE INDEX 会在增量 try 块外
#    真写库，把失败点从「增量迁移」挪到「建表阶段」，负向场地失真。
_OLD_SHAPE_SCHEMA = [
    """
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_archived INTEGER NOT NULL DEFAULT 0
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
        content TEXT NOT NULL DEFAULT '',
        tool_calls TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        source_conversation_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (source_conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        parameters_schema TEXT NOT NULL DEFAULT '{}',
        is_enabled INTEGER NOT NULL DEFAULT 1
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);",
    "CREATE INDEX IF NOT EXISTS idx_memories_is_active ON memories(is_active);",
]


async def _make_old_shape_db(db_path: pathlib.Path) -> None:
    """预建老形态库（四表老形态＋两索引，含数据隔离说明见模块 docstring）。"""
    db = await aiosqlite.connect(db_path)
    for sql in _OLD_SHAPE_SCHEMA:
        await db.execute(sql)
    await db.commit()
    await db.close()


def test_negative_query_only_migration_failure_is_fail_loud(tmp_path):
    """负向 A：增量迁移失败必须 raise，不得吞成 warning 后照常 commit 返回。"""

    async def _run():
        db_path = tmp_path / "old_shape_negative.db"
        await _make_old_shape_db(db_path)
        db = await aiosqlite.connect(db_path)
        await db.execute("PRAGMA query_only=ON")
        try:
            with pytest.raises(RuntimeError) as exc_info:
                await run_migrations(db)
            return str(exc_info.value)
        finally:
            await db.close()

    msg = asyncio.run(_run())
    # 异常信息须含全部失败的 表.列（收集后统一 raise，非首败即抛）
    assert "tools.group_name" in msg
    assert "messages.tool_call_id" in msg
    assert "conversations.deleted_at" in msg


def test_positive_old_shape_migrates_up_all_columns(tmp_path):
    """正向锚（同批必绿）：不加 query_only ⇒ 正常返回不抛，三增量列全部就位。"""

    async def _run():
        db_path = tmp_path / "old_shape_positive.db"
        await _make_old_shape_db(db_path)
        db = await aiosqlite.connect(db_path)
        try:
            await run_migrations(db)  # 不抛即过
            cols = {}
            for table in ("messages", "conversations", "tools"):
                # 入参为测试内字面量常量，无注入面（同 _ensure_column 知悉项）
                cursor = await db.execute(f"PRAGMA table_info({table})")
                cols[table] = [row[1] for row in await cursor.fetchall()]
            return cols
        finally:
            await db.close()

    cols = asyncio.run(_run())
    assert "tool_call_id" in cols["messages"]
    assert "deleted_at" in cols["conversations"]
    assert "group_name" in cols["tools"]
