"""
简易迁移模块

职责：
- 启动时自动执行 schema.py 中定义的所有建表语句
- 使用 IF NOT EXISTS 保证幂等性，不追踪版本号
- 个人项目无需复杂的迁移框架，直接顺序执行即可

与其他模块的关系：
- 被 db/database.py 在 get_db() 首次初始化时调用
"""

import aiosqlite

from db.schema import ALL_TABLES


async def run_migrations(db: aiosqlite.Connection):
    """
    执行所有建表语句。
    每条 SQL 都包含 IF NOT EXISTS，重复执行安全。
    """
    # TODO: 后续如需加字段，在此追加 ALTER TABLE 语句
    for sql in ALL_TABLES:
        await db.execute(sql)
    await db.commit()
