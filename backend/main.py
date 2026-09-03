"""
LarryAgent 后端入口

职责：
- 创建 FastAPI 应用实例
- 挂载所有 API 路由
- 同源托管测试页面（/chat.html）
- 管理应用生命周期（启动时初始化数据库、ChromaDB、加载工具；
  关闭时清理连接）

启动方式：
    uvicorn main:app --port 8000 --reload
    或使用根目录 Makefile: make run
    测试页：http://127.0.0.1:8000/chat.html
"""

import logging
import traceback
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse

from config import load_config, get_config
from exceptions import LarryException
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

    # 向量库（ChromaDB，可选，P1.4 阶段开启）
    if config.vector_store.enabled:
        try:
            from models.embedding import get_embedding_provider
            from rag.vector_store import ensure_collection
            provider = get_embedding_provider()
            vector_size = provider.dim()
            logger.info(
                "Embedding provider ready: %s (dim=%d)",
                type(provider).__name__,
                vector_size,
            )
            await ensure_collection(vector_size)
            logger.info("Vector store collection ready")
        except Exception as e:
            logger.warning("Vector store unavailable, skipping: %s", e)
    else:
        logger.info("Vector store disabled (vector_store.enabled=false)")

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

# 注：不再配置 CORS 中间件。服务仅监听本机回环地址，前端与 API 同源部署
# （测试页通过下方 /chat.html 路由托管），无需跨域支持。


# === 全局异常 handler ===
# 统一出口：所有 LarryException 子类都格式化为
# {error: TYPE, detail: msg} + 对应 status_code，与 P3.4 AuthMiddleware 格式一致。

@app.exception_handler(LarryException)
async def larry_exception_handler(request: Request, exc: LarryException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_type, "detail": exc.detail},
    )


# P4.6：兜底 handler — 捕获所有非 LarryException 的未预期异常
# - server 端：记完整 traceback（便于排查）
# - 客户端：只返回通用 "INTERNAL_ERROR"，不泄漏堆栈 / 路径 / 依赖版本等内部信息
# 注意：放在 LarryException handler 之后，不干扰已有 P3.5 异常子类的专属格式化出口
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s: %s\n%s",
        request.method,
        request.url.path,
        str(exc),
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "detail": "Internal server error"},
    )


# === 挂载中间件 ===
# 注意：FastAPI 中间件栈是倒序执行，add_middleware 顺序 = 外层→内层
# 鉴权必须放在路由处理之前（写在 include_router 上方即可）

from middleware.auth import AuthMiddleware
app.add_middleware(AuthMiddleware)


# === 挂载路由 ===

from api.chat import router as chat_router
from api.conversations import router as conversations_router
from api.memory import router as memory_router
from api.roles import router as roles_router
from api.tools import router as tools_router
from models.llm import _MODEL_PROVIDER_MAP

app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(memory_router)
app.include_router(roles_router)
app.include_router(tools_router)


# === 模型列表 ===

@app.get("/api/models")
async def list_models():
    """返回 LLM 支持的模型名称列表（_MODEL_PROVIDER_MAP keys）。"""
    return {"models": list(_MODEL_PROVIDER_MAP.keys())}


# === 健康检查 ===

@app.get("/health")
async def health_check():
    """健康检查接口，用于确认服务是否正常运行。"""
    return {"status": "ok", "version": "0.1.0"}


# === 测试页面托管 ===

_CHAT_HTML = Path(__file__).parent.parent / "client" / "chat.html"


@app.get("/chat.html", include_in_schema=False)
async def chat_page():
    """同源托管测试对话页面，访问 http://127.0.0.1:8000/chat.html"""
    if not _CHAT_HTML.exists():
        return {"detail": "chat.html not found"}
    return FileResponse(_CHAT_HTML, media_type="text/html")
