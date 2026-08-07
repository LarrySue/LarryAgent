"""
简易迁移模块

职责：
- 启动时自动执行 schema.py 中定义的所有建表语句
- 使用 IF NOT EXISTS 保证幂等性，不追踪版本号
- 个人项目无需复杂的迁移框架，直接顺序执行即可

与其他模块的关系：
- 被 db/database.py 在 get_db() 首次初始化时调用
"""

import logging

import aiosqlite

from db.schema import ALL_TABLES

logger = logging.getLogger(__name__)


# 增量迁移：对已存在的表追加字段
# key: 目标表名，value: (列名, 列定义)
_INCREMENTAL_ALTERS = [
    # tools 表：添加 group_name 字段（用于工具分组与按需加载）
    ("tools", "group_name", "TEXT NOT NULL DEFAULT 'core'"),
]


async def _ensure_column(db: aiosqlite.Connection, table: str, column: str, definition: str):
    """
    确保表中存在指定列。
    SQLite 不支持 ADD COLUMN IF NOT EXISTS，通过 PRAGMA table_info 判断后再执行。
    """
    cursor = await db.execute(f"PRAGMA table_info({table})")
    existing_columns = {row[1] for row in await cursor.fetchall()}
    if column not in existing_columns:
        alter_sql = f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
        logger.info("Adding column %s to table %s", column, table)
        await db.execute(alter_sql)


async def run_migrations(db: aiosqlite.Connection):
    """
    执行所有建表语句 + 增量 ALTER。
    每条 SQL 都包含 IF NOT EXISTS，重复执行安全。
    """
    # 1. 建表
    for sql in ALL_TABLES:
        await db.execute(sql)

    # 2. 增量迁移（新字段）
    for table, column, definition in _INCREMENTAL_ALTERS:
        try:
            await _ensure_column(db, table, column, definition)
        except Exception as e:
            logger.warning("Migration failed for %s.%s: %s", table, column, e)

    await db.commit()
