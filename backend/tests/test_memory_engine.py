"""
记忆引擎开关行为测试（2026-08-30，对应 Trae 修复 b382b22）

职责：
- vector_store.enabled=false → get_long_term_memory 返回 []，且**不触碰**
  embedding（不加载模型）与 ChromaDB（不建客户端、不检索）——用 spy 断言
- vector_store.enabled=true → 正常走 embed → search → 返回记忆文本
- 检索异常 → 降级返回 []（不中断聊天）

说明：
- conftest 临时 config 默认 enabled=false（默认路径即测关闭分支）
- enabled=true 分支在测试内临时翻转 config + monkeypatch embed/search（不碰真实 ChromaDB）
"""

import asyncio

import pytest

from memory.engine import get_long_term_memory


class TestDisabledSwitch:
    """enabled=false：跳过召回，不触碰 embedding/ChromaDB。"""

    def test_returns_empty_and_skips_embedding(self, monkeypatch):
        """返回 []，且 embed_text / vector_store.search 均未被调用。"""
        import models.embedding as embedding_mod
        import rag.vector_store as vs_mod
        from config import get_config

        # 确保开关关闭（conftest 临时 config 默认 enabled=false）
        assert get_config().vector_store.enabled is False

        # spy：若代码走到 embed/search（enabled=false 不应发生）则置位
        called = {"embed": False, "search": False}

        async def _fake_embed(text):
            called["embed"] = True
            return [0.1] * 512

        async def _fake_search(*args, **kwargs):
            called["search"] = True
            return []

        # engine.py 函数内 `from models.embedding import embed_text` 取模块当前属性
        monkeypatch.setattr(embedding_mod, "embed_text", _fake_embed)
        monkeypatch.setattr(vs_mod, "search", _fake_search)

        result = asyncio.run(get_long_term_memory("测试查询"))
        assert result == []
        assert called["embed"] is False, "enabled=false 时不应调用 embed_text"
        assert called["search"] is False, "enabled=false 时不应调用 search"


class TestEnabledSwitch:
    """enabled=true：正常走 embed → search → 返回记忆文本。"""

    def test_returns_memories_from_search(self, monkeypatch):
        import models.embedding as embedding_mod
        import rag.vector_store as vs_mod
        from config import get_config

        # 临时翻转开关（测后恢复）
        original = get_config().vector_store.enabled
        get_config().vector_store.enabled = True
        try:
            async def _fake_embed(text):
                return [0.1] * 512

            async def _fake_search(*args, **kwargs):
                return [
                    {"payload": {"text": "记忆一"}, "score": 0.8},
                    {"payload": {"text": "记忆二"}, "score": 0.7},
                ]

            monkeypatch.setattr(embedding_mod, "embed_text", _fake_embed)
            monkeypatch.setattr(vs_mod, "search", _fake_search)

            result = asyncio.run(get_long_term_memory("测试查询"))
            assert result == ["记忆一", "记忆二"]
        finally:
            get_config().vector_store.enabled = original

    def test_search_failure_degrades_to_empty(self, monkeypatch):
        """enabled=true 但检索异常 → 降级返回 []（不抛异常）。"""
        import models.embedding as embedding_mod
        import rag.vector_store as vs_mod
        from config import get_config

        original = get_config().vector_store.enabled
        get_config().vector_store.enabled = True
        try:
            async def _fake_embed(text):
                return [0.1] * 512

            async def _fake_search(*args, **kwargs):
                raise RuntimeError("ChromaDB down")

            monkeypatch.setattr(embedding_mod, "embed_text", _fake_embed)
            monkeypatch.setattr(vs_mod, "search", _fake_search)

            result = asyncio.run(get_long_term_memory("测试查询"))
            assert result == []
        finally:
            get_config().vector_store.enabled = original
