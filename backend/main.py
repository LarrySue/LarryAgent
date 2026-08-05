"""
LarryAgent 后端入口

职责：
- 创建 FastAPI 应用实例
- 配置 CORS 中间件
- 挂载所有 API 路由
- 管理应用生命周期（启动时初始化数据库、Qdrant 集合、加载工具；
  关闭时清理连接）

启动方式：
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    或使用根目录 Makefile: make run
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import load_config, get_config
from logging_config import setup_logging

logger = logging.getLogger(__name__)


# === 应用生命周期 ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动和关闭时的生命周期管理。"""
    # === 启动阶段 ===
    config = load_config()
    setup_logging(config.logging.level)
    logger.info("LarryAgent starting up")

    # 初始化数据库（get_db 内部会创建目录并执行迁移）
    from db.database import get_db
    await get_db()

    # Qdrant（可选，MVP 阶段可关闭）
    if config.qdrant.enabled:
        try:
            from rag.vector_store import ensure_collection
            await ensure_collection()
            logger.info("Qdrant collection ready")
        except Exception as e:
            logger.warning("Qdrant unavailable, skipping: %s", e)
    else:
        logger.info("Qdrant disabled (qdrant.enabled=false)")

    # 扫描并注册工具
    from tools.registry import scan_and_register
    await scan_and_register()
    logger.info("Tools registered")

    yield  # 应用运行中

    # === 关闭阶段 ===
    from db.database import close_db
    await close_db()
    logger.info("LarryAgent shut down")


# === FastAPI 应用实例 ===

app = FastAPI(
    title="LarryAgent",
    description="个人 AI Agent — 后端服务",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS：允许所有来源（单人使用 + 本地网络）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === 挂载路由 ===

from api.chat import router as chat_router
from api.memory import router as memory_router
from api.tools import router as tools_router

app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(tools_router)


# === 健康检查 ===

@app.get("/health")
async def health_check():
    """健康检查接口，用于确认服务是否正常运行。"""
    return {"status": "ok", "version": "0.1.0"}
