"""
API Key 鉴权中间件

职责：
- 仅拦截 path 以 "/api/" 开头的请求
- 空 server.api_key 时完全透传（本机使用，不校验）
- 非空时校验 Authorization: Bearer <key>
- 校验失败返回 401，body 严格为 {error, detail}
"""

import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from config import get_config
from exceptions import AuthError, LarryException

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Bearer Token 鉴权中间件。空 key 即禁用（完全透传）。

    鉴权失败统一 raise AuthError，业务语义仍使用统一异常体系，方便后续扩展。
    注意：Starlette BaseHTTPMiddleware 内抛出的异常**无法被** FastAPI 路由层的
    `@app.exception_handler(LarryException)` 捕获（中间件栈在 handler 机制之外），
    因此 dispatch 外层额外包裹一层 LarryException → JSONResponse 兜底转换，
    保持响应体 {error: TYPE, detail: msg} 与全局出口格式一致。
    """

    async def dispatch(self, request: Request, call_next):
        try:
            return await self._do_dispatch(request, call_next)
        except LarryException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"error": exc.error_type, "detail": exc.detail},
            )

    async def _do_dispatch(self, request: Request, call_next):
        # 仅拦截 /api/ 路径
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        config = get_config()

        # 空 key → 完全透传（本机不校验）
        if not config.server.api_key:
            return await call_next(request)

        # 校验 Authorization header
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            logger.warning("AUTH_FAIL: missing or malformed Authorization header, path=%s", request.url.path)
            raise AuthError("Invalid or missing API key")

        provided_key = auth_header[len("Bearer "):].strip()
        if provided_key != config.server.api_key:
            logger.warning("AUTH_FAIL: API key mismatch, path=%s", request.url.path)
            raise AuthError("Invalid or missing API key")

        return await call_next(request)
