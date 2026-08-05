"""
SQLite 连接管理模块

职责：
- 提供异步 SQLite 连接（aiosqlite）
- 单连接模式，不设连接池（单人使用，无并发需求）
- 启动时自动执行迁移

与其他模块的关系：
- 被 api/ 层和 memory/ 层通过 get_db() 获取连接
- 依赖 config.py 获取数据库文件路径
"""

import aiosqlite

from config import get_config

_db: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    """获取数据库连接单例，若未初始化则自动创建。"""
    global _db
    if _db is None:
        config = get_config()
        db_path = config.database.path
        # TODO: 确保 db_path 的父目录存在
        _db = await aiosqlite.connect(db_path)
        _db.row_factory = aiosqlite.Row
        # 启用 WAL 模式提升并发读取性能
        await _db.execute("PRAGMA journal_mode=WAL")
        # 启动时执行迁移
        from db.migrations import run_migrations
        await run_migrations(_db)
    return _db


async def close_db():
    """关闭数据库连接，在应用关闭时调用。"""
    global _db
    if _db is not None:
        await _db.close()
        _db = None
