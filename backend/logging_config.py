"""
日志配置模块

职责：
- 应用启动时统一配置 logging.basicConfig
- 供 main.py 和各模块通过 logging.getLogger(__name__) 使用
"""

import logging
import sys


def setup_logging(level: str = "DEBUG") -> None:
    """配置全局日志格式与级别。"""
    log_level = getattr(logging, level.upper(), logging.DEBUG)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
        force=True,
    )
    # 降低第三方库噪音
    for name in ("aiosqlite", "httpx", "httpcore", "openai"):
        logging.getLogger(name).setLevel(logging.WARNING)
