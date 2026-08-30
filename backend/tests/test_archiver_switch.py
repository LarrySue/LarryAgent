"""
归档写入路径开关行为测试（2026-08-30，WB 补修：confirm_and_store 不判开关的缺口）

职责：
- vector_store.enabled=false → confirm_and_store 仍写 SQLite + 标记归档，
  但**不触碰** embedding（不加载模型）与 ChromaDB（不删旧向量/不写入）——spy 断言
- vector_store.enabled=true → 正常走 embed_batch → insert 双写

说明：
- conftest 临时 config 默认 enabled=false（默认路径即测关闭分支）
- archiver.py 的依赖为模块级 import，故 monkeypatch 目标为 memory.archiver 命名空间
"""

import asyncio

import pytest

import memory.archiver as archiver_mod


def _install_fakes(monkeypatch, called, sqlite):
    """统一替换 archiver 的外部依赖（db / embedding / vector_store）。"""

    async def _fake_get_active(cid):
        return None

    async def _fake_create(content, source_conversation_id):
        sqlite["created"] = True
        return 42

    async def _fake_mark(cid):
        sqlite["archived"] = True

    async def _fake_embed(chunks):
        called["embed"] = True
        return [[0.1] * 512 for _ in chunks]

    async def _fake_insert(points):
        called["insert"] = True

    async def _fake_delete(mid):
        called["delete"] = True

    monkeypatch.setattr(archiver_mod, "get_active_memory_by_conversation_id", _fake_get_active)
    monkeypatch.setattr(archiver_mod, "create_memory", _fake_create)
    monkeypatch.setattr(archiver_mod, "mark_archived", _fake_mark)
    monkeypatch.setattr(archiver_mod, "embed_batch", _fake_embed)
    monkeypatch.setattr(archiver_mod, "insert", _fake_insert)
    monkeypatch.setattr(archiver_mod, "delete_by_memory_id", _fake_delete)


class TestArchiverDisabledSwitch:
    """enabled=false：SQLite 照写、会话照归档，向量三件套零触碰。"""

    def test_archive_skips_vector_store(self, monkeypatch):
        import memory.archiver as am
        from config import get_config

        # 确保开关关闭（conftest 临时 config 默认 enabled=false）
        assert get_config().vector_store.enabled is False

        called = {"embed": False, "insert": False, "delete": False}
        sqlite = {"created": False, "archived": False}
        _install_fakes(monkeypatch, called, sqlite)

        result = asyncio.run(am.confirm_and_store(1, "测试摘要：用户偏好简洁回复"))

        assert result == 42
        assert sqlite["created"] is True, "enabled=false 时 SQLite 记忆记录应照常写入"
        assert sqlite["archived"] is True, "enabled=false 时会话应照常标记已归档"
        assert called["embed"] is False, "enabled=false 时不应调用 embed_batch"
        assert called["insert"] is False, "enabled=false 时不应调用 vector_store.insert"
        assert called["delete"] is False, "enabled=false 时不应调用 delete_by_memory_id"


class TestArchiverEnabledSwitch:
    """enabled=true：正常走 embed_batch → insert 双写。"""

    def test_archive_writes_vectors_when_enabled(self, monkeypatch):
        import memory.archiver as am
        from config import get_config

        original = get_config().vector_store.enabled
        get_config().vector_store.enabled = True
        try:
            called = {"embed": False, "insert": False, "delete": False}
            sqlite = {"created": False, "archived": False}
            _install_fakes(monkeypatch, called, sqlite)

            result = asyncio.run(am.confirm_and_store(1, "测试摘要：用户偏好简洁回复"))

            assert result == 42
            assert sqlite["created"] and sqlite["archived"]
            assert called["embed"] is True, "enabled=true 时应调用 embed_batch"
            assert called["insert"] is True, "enabled=true 时应调用 vector_store.insert"
        finally:
            get_config().vector_store.enabled = original
