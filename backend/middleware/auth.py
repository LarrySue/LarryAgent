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

logger = logging.getLogger(__name__)

_AUTH_ERROR_BODY = {"error": "AUTH_ERROR", "detail": "Invalid or missing API key"}


class AuthMiddleware(BaseHTTPMiddleware):
    """Bearer Token 鉴权中间件。空 key 即禁用（完全透传）。"""

    async def dispatch(self, request: Request, call_next):
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
            return JSONResponse(status_code=401, content=_AUTH_ERROR_BODY)

        provided_key = auth_header[len("Bearer "):].strip()
        if provided_key != config.server.api_key:
            logger.warning("AUTH_FAIL: API key mismatch, path=%s", request.url.path)
            return JSONResponse(status_code=401, content=_AUTH_ERROR_BODY)

        return await call_next(request)
