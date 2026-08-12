"""
P3.4 API Key 鉴权中间件测试

职责：
- 验证 AuthMiddleware 在空 key / 无 header / 正确 Bearer / 错误 Bearer 四种场景的行为
- 使用 FastAPI TestClient + monkeypatch 修改 config.server.api_key，不调真实 DeepSeek API

与其他模块的关系：
- 依赖 middleware/auth.py（被测试目标）
- 依赖 main.py 的 FastAPI app 实例
- 不依赖 LLM / DB / ChromaDB（下游用 mock 短路）
"""

import pytest
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from config import get_config, load_config


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client_no_key():
    """TestClient：api_key 为空，完全透传。"""
    cfg = get_config()
    original = cfg.server.api_key
    cfg.server.api_key = ""
    from main import app
    yield TestClient(app)
    cfg.server.api_key = original


@pytest.fixture
def client_with_key():
    """TestClient：api_key = 'sekret'，启用鉴权。"""
    cfg = get_config()
    original = cfg.server.api_key
    cfg.server.api_key = "sekret"
    from main import app
    yield TestClient(app)
    cfg.server.api_key = original


# —— 401 响应体（严格格式，来自中间件常量） ——
_AUTH_ERROR_BODY = {"error": "AUTH_ERROR", "detail": "Invalid or missing API key"}


# ---------------------------------------------------------------------------
# Test case 1: 空 api_key 透传
# ---------------------------------------------------------------------------

class TestEmptyApiKeyPassthrough:
    """server.api_key 为空时，所有 /api/* 请求完全透传，不返回 401。"""

    def test_chat_endpoint_passthrough(self, client_no_key):
        """
        空 key：请求 /api/chat 不被中间件拦截（下游出错不是 401 就说明透传了）。
        用错误的 Content-Type + 空 body 触发 FastAPI 的 422（validation error），
        只要状态码不是 401，就是透传成功。
        """
        res = client_no_key.post("/api/chat")
        assert res.status_code != 401, f"空 key 时不应返回 401，实际 {res.status_code}"

    def test_non_api_path_not_touched(self, client_no_key):
        """/health 是非 /api/ 路径，空 key 时应正常返回 200。"""
        res = client_no_key.get("/health")
        assert res.status_code == 200


# ---------------------------------------------------------------------------
# Test case 2: 有 key 但无 Authorization header → 401
# ---------------------------------------------------------------------------

class TestMissingHeader:
    """server.api_key 非空，但请求不带 Authorization header → 401。"""

    def test_no_auth_header(self, client_with_key):
        res = client_with_key.post("/api/chat")
        assert res.status_code == 401
        assert res.json() == _AUTH_ERROR_BODY

    def test_non_api_path_not_affected(self, client_with_key):
        """设 key 后 /health（非 /api/）仍应正常访问。"""
        res = client_with_key.get("/health")
        assert res.status_code == 200


# ---------------------------------------------------------------------------
# Test case 3: 正确的 Bearer token → 200
# ---------------------------------------------------------------------------

class TestCorrectBearer:
    """正确的 Authorization: Bearer <key> → 放行。"""

    def test_correct_bearer(self, client_with_key):
        """
        正确 Bearer → 中间件放行。下游 /api/chat 会因缺少 body 而报 422，
        但不会是 401 或 403。
        """
        res = client_with_key.post(
            "/api/chat",
            headers={"Authorization": "Bearer sekret"},
        )
        assert res.status_code != 401, f"正确 Bearer 不应返回 401，实际 {res.status_code}"


# ---------------------------------------------------------------------------
# Test case 4: 错误的 Bearer token → 401
# ---------------------------------------------------------------------------

class TestWrongBearer:
    """Authorization: Bearer <wrong_key> → 401。"""

    def test_wrong_bearer(self, client_with_key):
        res = client_with_key.post(
            "/api/chat",
            headers={"Authorization": "Bearer wrong"},
        )
        assert res.status_code == 401
        assert res.json() == _AUTH_ERROR_BODY

    def test_malformed_auth_header(self, client_with_key):
        """Authorization header 格式为 'Token xxx' 而非 'Bearer xxx' → 401。"""
        res = client_with_key.post(
            "/api/chat",
            headers={"Authorization": "Token sekret"},
        )
        assert res.status_code == 401
        assert res.json() == _AUTH_ERROR_BODY


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
