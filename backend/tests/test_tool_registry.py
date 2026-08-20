"""
工具注册中心配置驱动启用测试（2026-08-20 派发）

职责：
- enabled_tools 列出时只注册列出的工具（过滤生效）
- enabled_tools 空列表 → 全部注册（向后兼容）
- 未知工具名 → 跳过 + warning，不崩溃
- 隔离：操作全局 _registry 前后恢复原状，避免影响其他测试文件

注意：WebSearchTool 构造读 config.search，conftest 临时 yaml 以真实 config
为基底（含 search 段），故构造可正常完成；不触碰真实 key（构造不读 key 值）。
"""

import logging

import pytest

import tools.registry as registry
from tools.registry import _registry


@pytest.fixture(autouse=True)
def restore_registry():
    """保存/恢复全局注册表，防止测试污染其他文件。"""
    original = dict(_registry)
    _registry.clear()
    yield
    _registry.clear()
    _registry.update(original)


def _patch_enabled(monkeypatch, enabled_list):
    """把 config.tools.enabled_tools 替换为指定列表。"""
    from config import get_config
    cfg = get_config()
    monkeypatch.setattr(cfg.tools, "enabled_tools", enabled_list)


class TestScanAndRegister:
    def test_enabled_list_filters(self, monkeypatch):
        """enabled_tools=["file_ops"] → 只注册 file_ops。"""
        _patch_enabled(monkeypatch, ["file_ops"])
        import asyncio
        asyncio.run(registry.scan_and_register())

        names = set(_registry.keys())
        assert names == {"file_ops"}
        assert "shell" not in names
        assert "web_search" not in names

    def test_empty_list_registers_all(self, monkeypatch):
        """enabled_tools 为空 → 全部注册（向后兼容）。"""
        _patch_enabled(monkeypatch, [])
        import asyncio
        asyncio.run(registry.scan_and_register())

        names = set(_registry.keys())
        assert {"file_ops", "shell", "web_search"} <= names

    def test_unknown_tool_skipped_with_warning(self, monkeypatch, caplog):
        """enabled_tools 含未知名 → 跳过 + warning，不崩溃。"""
        _patch_enabled(monkeypatch, ["file_ops", "no_such_tool"])
        import asyncio
        with caplog.at_level(logging.WARNING):
            asyncio.run(registry.scan_and_register())

        names = set(_registry.keys())
        assert names == {"file_ops"}
        assert any("unknown tool 'no_such_tool'" in rec.message for rec in caplog.records)
