"""
P3.5 统一异常体系测试

职责：
- 验证 4 种 LarryException 子类 → HTTP status + 统一 body 的映射正确
- 验证 AuthMiddleware raise AuthError 后 HTTP 响应与 P3.4 完全一致（dispatch 兜底转换）
- 验证非 LarryException 的未预期异常返回 500 且不暴露堆栈
- 回归保障：test_auth_middleware.py（7 项）/ test_chat_service.py（16 项）另行全跑

与其他模块的关系：
- 依赖 main.py 的全局异常 handler 与真实 app 实例
- 依赖 middleware/auth.py（AuthMiddleware 的 raise + 兜底路径）
- 测试路由为临时注册（/api/_exc_test/ 前缀），不与业务路由冲突
"""

import pytest
from fastapi.testclient import TestClient

from config import get_config
from exceptions import AuthError, ConfigError, LLMError, ToolError


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    """
    真实 main.app 的 TestClient，注册临时测试路由验证异常映射。

    raise_server_exceptions=False：未捕获异常返回 500 响应而非在测试进程重新抛出，
    用于验证"非 LarryException → 500 不暴露堆栈"。
    """
    from main import app

    @app.get("/api/_exc_test/config")
    async def _raise_config():
        raise ConfigError("config broken")

    @app.get("/api/_exc_test/llm")
    async def _raise_llm():
        raise LLMError("llm down")

    @app.get("/api/_exc_test/tool")
    async def _raise_tool():
        raise ToolError("tool failed")

    @app.get("/api/_exc_test/auth")
    async def _raise_auth():
        raise AuthError("bad key")

    @app.get("/api/_exc_test/ok")
    async def _ok():
        return {"status": "ok"}

    @app.get("/api/_exc_test/unexpected")
    async def _raise_unexpected():
        raise ValueError("boom")

    yield TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def with_api_key():
    """临时设置 server.api_key 并自动恢复（AuthMiddleware 测试用）。"""
    cfg = get_config()
    original = cfg.server.api_key
    cfg.server.api_key = "sekret"
    yield
    cfg.server.api_key = original


# ---------------------------------------------------------------------------
# 强制用例 1：每种异常类型 → 正确 HTTP status + body
# ---------------------------------------------------------------------------

class TestExceptionMapping:
    """LarryException 子类经全局 handler 映射为统一格式响应。"""

    def test_config_error_500(self, client):
        res = client.get("/api/_exc_test/config")
        assert res.status_code == 500
        assert res.json() == {"error": "CONFIG_ERROR", "detail": "config broken"}

    def test_llm_error_502(self, client):
        res = client.get("/api/_exc_test/llm")
        assert res.status_code == 502
        assert res.json() == {"error": "LLM_ERROR", "detail": "llm down"}

    def test_tool_error_500(self, client):
        res = client.get("/api/_exc_test/tool")
        assert res.status_code == 500
        assert res.json() == {"error": "TOOL_ERROR", "detail": "tool failed"}

    def test_auth_error_401(self, client):
        res = client.get("/api/_exc_test/auth")
        assert res.status_code == 401
        assert res.json() == {"error": "AUTH_ERROR", "detail": "bad key"}


# ---------------------------------------------------------------------------
# 强制用例 2：AuthMiddleware raise AuthError → 401（衔接验证点）
# ---------------------------------------------------------------------------

class TestMiddlewareRaise:
    """
    验证 BaseHTTPMiddleware 内 raise AuthError 的兜底转换路径：
    dispatch 外层 try/except LarryException → JSONResponse，
    响应体与全局 handler 格式完全一致。
    """

    def test_middleware_raise_no_header(self, client, with_api_key):
        """设 key 后无 Authorization header → 401 + 统一 body。"""
        res = client.get("/api/_exc_test/ok")
        assert res.status_code == 401
        assert res.json() == {
            "error": "AUTH_ERROR",
            "detail": "Invalid or missing API key",
        }

    def test_middleware_raise_wrong_key(self, client, with_api_key):
        """设 key 后 Bearer 值错误 → 401 + 统一 body。"""
        res = client.get(
            "/api/_exc_test/ok",
            headers={"Authorization": "Bearer wrong"},
        )
        assert res.status_code == 401
        assert res.json() == {
            "error": "AUTH_ERROR",
            "detail": "Invalid or missing API key",
        }


# ---------------------------------------------------------------------------
# 强制用例 3：正确 Bearer → 200（正常请求不受 raise 改造影响）
# ---------------------------------------------------------------------------

class TestMiddlewarePass:
    """正确 Bearer 放行，200 响应不受改造影响。"""

    def test_correct_bearer_200(self, client, with_api_key):
        res = client.get(
            "/api/_exc_test/ok",
            headers={"Authorization": "Bearer sekret"},
        )
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}

    def test_empty_key_passthrough(self, client):
        """空 api_key 时完全透传（与 P3.4 行为一致）。"""
        res = client.get("/api/_exc_test/ok")
        assert res.status_code == 200


# ---------------------------------------------------------------------------
# 强制用例 4：非 LarryException → 500，不暴露堆栈
# ---------------------------------------------------------------------------

class TestUnexpectedException:
    """未预期异常返回 500，body 不含堆栈信息。"""

    def test_unexpected_500_no_traceback(self, client):
        res = client.get("/api/_exc_test/unexpected")
        assert res.status_code == 500
        body = res.text.lower()
        assert "traceback" not in body
        assert "valueerror" not in body
