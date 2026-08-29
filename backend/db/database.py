"""
SQLite 连接管理模块

职责：
- 提供异步 SQLite 连接（aiosqlite）
- 单连接模式，不设连接池（单人使用，无并发需求）
- 启动时自动执行迁移

与其他模块的关系：
- 被 api/ 层和 memory/ 层通过 get_db() 获取连接
- 依赖 config.py 获取数据库文件路径

⚠️ 生命周期警示（2026-08-30，源：archive/report-2026-08-30.md）：
- `_db` 连接绑定创建时的 asyncio loop。**一次性脚本 / CLI 入口若调 get_db()，
  退出路径必须显式 close_db()**——未关闭的连接在进程退出时 GC 清理会挂起
  （实测 60s~17.5min），且属于 aiosqlite + asyncio 通用行为，与框架无关。
- uvicorn 常驻 loop 下由 lifespan shutdown 的 close_db() 负责，安全。
- 有意不做 atexit 兜底：在已关闭的 loop 上关闭连接反而可能引入新问题，
  显式管理优于兜底。
"""

import logging
import os

import aiosqlite

from config import get_config

logger = logging.getLogger(__name__)

_db: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    """获取数据库连接单例，若未初始化则自动创建。"""
    global _db
    if _db is None:
        config = get_config()
        db_path = config.database.path
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
            logger.debug("Ensured database directory exists: %s", db_dir)
        _db = await aiosqlite.connect(db_path)
        _db.row_factory = aiosqlite.Row
        # 注意：SQLite 的 PRAGMA 是**连接级**的，每个连接必须单独设置。
        # - journal_mode=WAL：并发读，多连接安全
        # - foreign_keys=ON：启用 ON DELETE CASCADE / SET NULL 语义（默认 SQLite 不强制外键）
        await _db.execute("PRAGMA journal_mode=WAL")
        await _db.execute("PRAGMA foreign_keys=ON")
        from db.migrations import run_migrations
        await run_migrations(_db)
        logger.info("Database initialized: %s (foreign_keys=ON)", db_path)
    return _db


async def close_db():
    """关闭数据库连接，在应用关闭时调用。"""
    global _db
    if _db is not None:
        await _db.close()
        _db = None
        logger.info("Database connection closed")
