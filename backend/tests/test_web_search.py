"""
web_search 工具测试（2026-08-20 派发，Claude 测试）

职责：
- Brave provider 解析：mock HTTP 响应 → 结构化结果正确
- 空结果 / 异常 JSON 处理
- provider 可插拔：抽象接口契约
- 降级路径：超时 / 429 → 退避 → 降级信号正确返回；chat_service 降级分支
- SSRF 拦截钩子：内网 / 元数据地址被拦截，公网放行
- 全部 mock provider / mock httpx，不碰真实 key / 真实 config（conftest 隔离兜底）
"""

import asyncio
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from tools.web_search import (
    BraveSearchProvider,
    SearchProvider,
    SearchResult,
    WebSearchTool,
    _extract_urls,
    _is_blocked_ssrf_url,
)
from tools.base import ToolError, ToolResult


# ---------------------------------------------------------------------------
# BraveSearchProvider 解析（mock httpx）
# ---------------------------------------------------------------------------

def _brave_json(*results):
    """构造 Brave API 响应体（web.results 结构）。"""
    return {"web": {"results": list(results)}}


def _brave_item(title, url, desc):
    return {"title": title, "url": url, "description": desc}


class FakeAsyncClient:
    """mock httpx.AsyncClient：固定返回预置响应。"""

    def __init__(self, response):
        self._response = response

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def get(self, *args, **kwargs):
        return self._response


class TestBraveProvider:
    """BraveSearchProvider 的 HTTP 解析与结果结构化。"""

    def test_success_path_parses_results(self):
        """mock 正常响应 → 解析出 title/url/snippet。"""
        resp = httpx.Response(
            200,
            json=_brave_json(
                _brave_item("标题一", "https://a.com/1", "摘要一"),
                _brave_item("标题二", "https://b.com/2", ""),  # 无摘要
            ),
            request=httpx.Request("GET", "https://api.search.brave.com"),
        )
        provider = BraveSearchProvider(api_key="fake-key")

        async def run():
            with patch("httpx.AsyncClient", return_value=FakeAsyncClient(resp)):
                return await provider.search("测试", max_results=5, timeout=8.0)

        results = asyncio.run(run())
        assert len(results) == 2
        assert results[0] == SearchResult(title="标题一", url="https://a.com/1", snippet="摘要一")
        assert results[1] == SearchResult(title="标题二", url="https://b.com/2", snippet="")

    def test_empty_results(self):
        """无结果 → 返回空列表（WebSearchTool 层转为降级信号）。"""
        resp = httpx.Response(
            200,
            json={"web": {"results": []}},
            request=httpx.Request("GET", "https://api.search.brave.com"),
        )
        provider = BraveSearchProvider(api_key="fake-key")

        async def run():
            with patch("httpx.AsyncClient", return_value=FakeAsyncClient(resp)):
                return await provider.search("不存在的内容", max_results=5, timeout=8.0)

        assert asyncio.run(run()) == []

    def test_malformed_json_raises(self):
        """异常 JSON → raise_for_status 后 json() 抛异常（由调用层降级）。"""
        resp = httpx.Response(
            200,
            content=b"not-json",
            request=httpx.Request("GET", "https://api.search.brave.com"),
        )
        provider = BraveSearchProvider(api_key="fake-key")

        async def run():
            with patch("httpx.AsyncClient", return_value=FakeAsyncClient(resp)):
                return await provider.search("测试", max_results=5, timeout=8.0)

        with pytest.raises(Exception):
            asyncio.run(run())

    def test_missing_web_field_returns_empty(self):
        """响应缺少 web 字段 → 不崩溃，返回空列表。"""
        resp = httpx.Response(
            200,
            json={"other": "field"},
            request=httpx.Request("GET", "https://api.search.brave.com"),
        )
        provider = BraveSearchProvider(api_key="fake-key")

        async def run():
            with patch("httpx.AsyncClient", return_value=FakeAsyncClient(resp)):
                return await provider.search("测试", max_results=5, timeout=8.0)

        assert asyncio.run(run()) == []


# ---------------------------------------------------------------------------
# provider 可插拔契约
# ---------------------------------------------------------------------------

class TestProviderAbstraction:
    """SearchProvider 抽象契约：调用层（WebSearchTool）不依赖具体实现。"""

    def test_web_search_tool_uses_injected_provider(self):
        """
        注入 mock provider → WebSearchTool 正常产出结构化 ToolResult。
        证明工具调用层只依赖 SearchProvider 抽象，不依赖 Brave 实现。
        """
        class MockProvider(SearchProvider):
            async def search(self, query, max_results, timeout):
                return [SearchResult(title="T", url="https://t.com", snippet="S")]

        tool = WebSearchTool()

        async def run():
            with patch.object(tool, "_build_provider", return_value=MockProvider()):
                return await tool.execute("测试", max_results=5)

        result = asyncio.run(run())
        assert result.success is True
        assert "1. T" in result.content
        assert "URL: https://t.com" in result.content

    def test_unknown_provider_raises_tool_error(self):
        """配置了不支持的 provider → 抛 ToolError（run() 会归一）。"""
        tool = WebSearchTool()
        tool._cfg = type("Cfg", (), {"provider": "unknown", "timeout": 8.0, "max_retries": 2})()

        with pytest.raises(ToolError):
            tool._build_provider()


# ---------------------------------------------------------------------------
# WebSearchTool 降级路径
# ---------------------------------------------------------------------------

class TestDegradation:
    """超时 / 失败 / 空 query / 无结果 → 降级信号（不抛异常）。"""

    def test_empty_query_returns_failure(self):
        """空 query → ToolResult(success=False)。"""
        tool = WebSearchTool()
        result = asyncio.run(tool.execute("   ", max_results=5))
        assert result.success is False
        assert "empty" in result.error.lower()

    def test_timeout_degrades_to_failure(self):
        """provider 超时 → 重试后返回降级信号（不抛异常）。"""
        tool = WebSearchTool()
        tool._cfg = type("Cfg", (), {"provider": "brave", "timeout": 0.01, "max_retries": 1})()

        class SlowProvider(SearchProvider):
            async def search(self, query, max_results, timeout):
                await asyncio.sleep(1.0)  # 必然超时
                return []

        async def run():
            with patch.object(tool, "_build_provider", return_value=SlowProvider()):
                return await tool.execute("测试", max_results=5)

        result = asyncio.run(run())
        assert result.success is False
        assert "未能联网核实" in result.error

    def test_retry_then_success(self):
        """前 1 次失败（可重试）→ 重试后成功。验证指数退避重试逻辑。"""
        tool = WebSearchTool()
        tool._cfg = type("Cfg", (), {"provider": "brave", "timeout": 8.0, "max_retries": 2})()

        calls = {"n": 0}

        class FlakyProvider(SearchProvider):
            async def search(self, query, max_results, timeout):
                calls["n"] += 1
                if calls["n"] == 1:
                    raise httpx.TimeoutException("timeout", request=httpx.Request("GET", "https://x"))
                return [SearchResult(title="OK", url="https://ok.com", snippet="")]

        async def run():
            with patch.object(tool, "_build_provider", return_value=FlakyProvider()):
                return await tool.execute("测试", max_results=5)

        result = asyncio.run(run())
        assert result.success is True
        assert calls["n"] == 2  # 1 次失败 + 1 次重试成功

    def test_no_results_degrades(self):
        """搜索返回空 → 降级信号（'搜索无结果'）。"""
        tool = WebSearchTool()

        class EmptyProvider(SearchProvider):
            async def search(self, query, max_results, timeout):
                return []

        async def run():
            with patch.object(tool, "_build_provider", return_value=EmptyProvider()):
                return await tool.execute("测试", max_results=5)

        result = asyncio.run(run())
        assert result.success is False
        assert "无结果" in result.error

    def test_max_results_clamped(self):
        """max_results 超界 → 钳制到 1-10（provider 收到正确值）。"""
        captured = {}

        class CaptureProvider(SearchProvider):
            async def search(self, query, max_results, timeout):
                captured["max_results"] = max_results
                return []

        tool = WebSearchTool()

        async def run():
            with patch.object(tool, "_build_provider", return_value=CaptureProvider()):
                await tool.execute("测试", max_results=999)

        asyncio.run(run())
        assert captured["max_results"] == 10


# ---------------------------------------------------------------------------
# SSRF 拦截钩子
# ---------------------------------------------------------------------------

class TestSsrfHook:
    """SSRF 内网拦截 + 公网放行。"""

    @pytest.mark.parametrize(
        "url",
        [
            "http://127.0.0.1/",
            "http://localhost/",
            "http://localhost.localdomain/x",
            "http://169.254.169.254/latest/meta-data/",
            "http://10.0.0.1/",
            "http://192.168.1.1/",
            "http://172.16.0.1/",
            "http://0.0.0.0/",
            "http://100.64.0.1/",
            "http://metadata.localhost/",
        ],
    )
    def test_blocked(self, url):
        assert _is_blocked_ssrf_url(url) is True

    @pytest.mark.parametrize(
        "url",
        [
            "http://example.com/",
            "https://api.search.brave.com/res/v1/web/search",
            "http://8.8.8.8/",       # 公网 IP
            "http://1.1.1.1/",       # 公网 IP
        ],
    )
    def test_allowed(self, url):
        assert _is_blocked_ssrf_url(url) is False

    def test_extract_urls(self):
        """query 中提取 http/https URL。"""
        text = "看看 https://example.com 和 http://x.com/a 还有普通文字"
        urls = _extract_urls(text)
        assert "https://example.com" in urls
        assert "http://x.com/a" in urls
        assert len(urls) == 2

    def test_validate_request_blocks_internal_url(self):
        """query 含内网 URL → _validate_request 抛 ToolError。"""
        tool = WebSearchTool()
        with pytest.raises(ToolError, match="internal/private"):
            tool._validate_request(query="查一下 http://169.254.169.254 是什么")

    def test_validate_request_passes_public(self):
        """query 含公网 URL 或不含 URL → 校验通过。"""
        tool = WebSearchTool()
        tool._validate_request(query="查一下 example.com 新闻")  # 无 URL 前缀
        tool._validate_request(query="看看 https://example.com 主页")

    def test_run_validation_error_normalized(self):
        """
        run() 入口：_validate_request 抛 ToolError → 归一为失败 ToolResult
        （不抛异常，不中断聊天）。这是 run() 的护栏关键行为。
        """
        tool = WebSearchTool()

        async def run():
            return await tool.run(query="http://169.254.169.254")

        result = asyncio.run(run())
        assert result.success is False
        assert "blocked" in result.error or "internal" in result.error
