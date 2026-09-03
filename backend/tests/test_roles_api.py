"""
角色清单 API 测试（2026-09-03 派发，Claude 测试）

职责：
- GET /api/roles 正常清单：顺序 = config 书写序、default 首位、字段齐全
- label/color 缺省兜底：label→key、color→#9CA3AF
- 缺 default 键：不 500，返回非空
- 空 roles：不 500，返回 []
- 鉴权透传：空 api_key 不被 AuthMiddleware 拦截
- 全程 monkeypatch config.roles，不碰真实 config.yaml / key（conftest 隔离兜底）
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    """真实 main.app TestClient（conftest 临时库 + 空 api_key 鉴权透传）。"""
    import db.database as db_module

    db_module._db = None
    from main import app

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    db_module._db = None


@pytest.fixture
def patch_roles(monkeypatch):
    """把 get_config().roles 替换为指定 dict。"""

    def _patch(roles: dict):
        from config import get_config
        monkeypatch.setattr(get_config(), "roles", roles)

    return _patch


# ---------------------------------------------------------------------------
# 正常清单
# ---------------------------------------------------------------------------

class TestRolesList:
    def test_full_list_order_and_fields(self, client, patch_roles):
        """4 角色 → 顺序 = 书写序，default 首位，字段 key/label/color 齐全。"""
        patch_roles({
            "default": {"label": "通用", "color": "#9CA3AF", "system_prompt": "x"},
            "code": {"label": "编程", "color": "#60A5FA", "system_prompt": "y"},
            "health": {"label": "健康", "color": "#34D399"},
            "finance": {"label": "金融", "color": "#FBBF24"},
        })
        res = client.get("/api/roles")
        assert res.status_code == 200
        body = res.json()
        assert [r["key"] for r in body] == ["default", "code", "health", "finance"]
        assert body[0] == {"key": "default", "label": "通用", "color": "#9CA3AF"}
        assert body[1] == {"key": "code", "label": "编程", "color": "#60A5FA"}


# ---------------------------------------------------------------------------
# 缺省兜底
# ---------------------------------------------------------------------------

class TestRolesFallback:
    def test_missing_label_color_fallback(self, client, patch_roles):
        """角色只有 system_prompt → label 回退 key、color 回退 #9CA3AF。"""
        patch_roles({
            "default": {"system_prompt": "x"},
            "code": {"label": "编程"},  # 有 label 无 color
        })
        res = client.get("/api/roles")
        assert res.status_code == 200
        body = {r["key"]: r for r in res.json()}
        assert body["default"]["label"] == "default"  # label 回退 key
        assert body["default"]["color"] == "#9CA3AF"  # color 回退默认灰
        assert body["code"]["label"] == "编程"
        assert body["code"]["color"] == "#9CA3AF"  # 缺 color 回退

    def test_missing_default_key(self, client, patch_roles):
        """config.roles 不含 default → 不 500，返回非空清单。"""
        patch_roles({
            "code": {"label": "编程", "color": "#60A5FA"},
            "health": {"label": "健康", "color": "#34D399"},
        })
        res = client.get("/api/roles")
        assert res.status_code == 200
        body = res.json()
        assert len(body) == 2
        assert body[0]["key"] == "code"  # 无 default 时按书写序，不硬插

    def test_empty_roles(self, client, patch_roles):
        """config.roles = {} → 不 500，返回 []（与前端契约：空走 FALLBACK）。"""
        patch_roles({})
        res = client.get("/api/roles")
        assert res.status_code == 200
        assert res.json() == []


# ---------------------------------------------------------------------------
# 鉴权透传
# ---------------------------------------------------------------------------

class TestRolesAuth:
    def test_empty_api_key_passthrough(self, client, patch_roles):
        """server.api_key 为空（conftest 默认）→ /api/roles 不被 AuthMiddleware 拦截。"""
        patch_roles({"default": {"label": "通用"}})
        res = client.get("/api/roles")
        assert res.status_code == 200, f"空 api_key 应透传，实际 {res.status_code}"
