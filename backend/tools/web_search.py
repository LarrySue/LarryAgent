"""
web_search 网络搜索工具

职责：
- 对话内 AI 自主发起网络搜索，返回结构化结果（标题 + URL + snippet）
- provider 可插拔：SearchProvider 抽象 + BraveSearchProvider 实现，
  将来加 SearXNGProvider 只换实现，调用层/前端不变
- 超时 + 指数退避重试 + 降级：失败不中断聊天，由 LLM 降级为正常回答
- SSRF 内网拦截钩子（_validate_request）：当前 search 只调 Brave 固定
  域名风险低，但校验钩子留给将来 web_fetch 复用

安全约束：
- key 仅在 backend 侧读取（config.yaml，已被 .gitignore 保护）
- 目标 URL 内网拦截（防 SSRF：169.254.169.254 / 10.x / 192.168.x / localhost）
- 单次调用硬超时（默认 8s）

与其他模块的关系：
- 被 tools/registry.py 注册（配置驱动启用）
- 被 chat_service 通过 BaseTool.run() 调用
- 前端复用 P4.4 ToolCallCard 展示（零新组件）
"""

import asyncio
import ipaddress
import logging
import urllib.parse
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

import httpx
from tenacity import (
    AsyncRetrying,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from config import get_config
from tools.base import BaseTool, ToolError, ToolResult

logger = logging.getLogger(__name__)

# Brave 搜索 API 固定端点（provider 可插拔，此常量属于 Brave 实现）
_BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"

# 内网/保留地址段（SSRF 拦截钩子专用，ipaddress 覆盖 169.254.169.254 等）
_PRIVATE_NETWORKS = (
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
)


@dataclass
class SearchResult:
    """单条搜索结果"""
    title: str
    url: str
    snippet: str


class SearchProvider(ABC):
    """搜索提供商抽象接口。实现新提供商只需继承并实现 search()。"""

    @abstractmethod
    async def search(self, query: str, max_results: int, timeout: float) -> list[SearchResult]:
        """执行搜索，返回结构化结果。失败时抛出异常由调用方重试/降级。"""


class BraveSearchProvider(SearchProvider):
    """Brave 搜索实现（免费层 2000 次/月）。"""

    def __init__(self, api_key: str):
        self._api_key = api_key

    async def search(self, query: str, max_results: int, timeout: float) -> list[SearchResult]:
        params = {"q": query, "count": max_results}
        headers = {
            "X-Subscription-Token": self._api_key,
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(
                _BRAVE_SEARCH_URL,
                params=params,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()

        results: list[SearchResult] = []
        for item in data.get("web", {}).get("results", []):
            title = item.get("title") or ""
            url = item.get("url") or ""
            snippet = item.get("description") or ""
            results.append(SearchResult(title=title, url=url, snippet=snippet))
        return results


def _is_retryable(exc: BaseException) -> bool:
    """判断搜索异常是否值得重试（429 限流 / 网络/超时类错误）。"""
    if isinstance(exc, asyncio.TimeoutError):
        return True
    if isinstance(exc, httpx.TimeoutException):
        return True
    if isinstance(exc, httpx.NetworkError):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in (429, 500, 502, 503, 504)
    return False


class WebSearchTool(BaseTool):
    name = "web_search"
    description = (
        "网络搜索。对实时性要求高的问题（最新新闻、实时数据、当前事件等），"
        "调用本工具获取网络结果（标题+URL+摘要），回答时标注来源 URL。"
    )
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "搜索关键词（尽量简短具体）",
            },
            "max_results": {
                "type": "integer",
                "description": "返回结果条数（默认 5，最大 10）",
                "minimum": 1,
                "maximum": 10,
            },
        },
        "required": ["query"],
    }

    guard_level = "network"
    timeout: float | None = None  # 单次调用超时由 config.search.timeout 控制（run() 内 wait_for 每轮）

    def __init__(self):
        self._cfg = get_config().search

    def _build_provider(self) -> SearchProvider:
        """按配置构建 provider。当前仅支持 brave。"""
        if self._cfg.provider == "brave":
            return BraveSearchProvider(self._cfg.brave_api_key)
        raise ToolError(f"Unsupported search provider: {self._cfg.provider}")

    # ------------------------------------------------------------------
    # 护栏钩子：SSRF 内网拦截（当前 search 目标固定为 Brave 域名，
    # 此处校验 query 中可能出现的 URL 片段，为将来 web_fetch 复用铺路）
    # ------------------------------------------------------------------
    def _validate_request(self, **kwargs) -> None:
        query = kwargs.get("query") or ""
        urls = _extract_urls(query)
        for url in urls:
            if _is_blocked_ssrf_url(url):
                raise ToolError(
                    f"Search blocked: internal/private network URL not allowed: {url}"
                )

    async def execute(self, query: str, max_results: int = 5, **kwargs) -> ToolResult:
        """
        执行网络搜索（含指数退避重试，最多 max_retries 次重试）。

        成功 → ToolResult(success=True, content=结构化结果文本)
        重试仍失败 → ToolResult(success=False, error=降级提示)，
                    chat_service 将其传给 LLM → 降级为正常回答并提示"未能联网核实"
        """
        max_results = max(1, min(int(max_results), 10))
        if not query.strip():
            return ToolResult(success=False, error="Search query is empty")

        provider = self._build_provider()
        timeout = float(self._cfg.timeout or 8.0)
        total_attempts = int(self._cfg.max_retries) + 1  # 1 次初始 + N 次重试

        try:
            async for attempt in AsyncRetrying(
                stop=stop_after_attempt(total_attempts),
                wait=wait_exponential(multiplier=1.0, min=1.0, max=4.0),
                retry=retry_if_exception(_is_retryable),
                reraise=True,
            ):
                with attempt:
                    # 每轮尝试都有独立硬超时，防止单次调用卡死整个聊天
                    results = await asyncio.wait_for(
                        provider.search(query, max_results, timeout),
                        timeout=timeout,
                    )
        except asyncio.TimeoutError:
            return ToolResult(
                success=False,
                error=(
                    f"未能联网核实：网络搜索超时（>{timeout}s，重试{total_attempts - 1}次）"
                ),
            )
        except Exception as e:
            logger.warning("web_search failed after %d attempts: %s", total_attempts, e)
            return ToolResult(
                success=False,
                error=f"未能联网核实：网络搜索失败（{type(e).__name__}: {e}）",
            )

        if not results:
            return ToolResult(success=False, error="未能联网核实：搜索无结果")

        lines = [f"搜索结果（共 {len(results)} 条）："]
        for i, r in enumerate(results, 1):
            lines.append(f"{i}. {r.title}")
            lines.append(f"   URL: {r.url}")
            if r.snippet:
                lines.append(f"   摘要: {r.snippet}")
        return ToolResult(success=True, content="\n".join(lines))


# ------------------------------------------------------------------
# SSRF 工具函数（独立纯函数，便于测试）
# ------------------------------------------------------------------

def _extract_urls(text: str) -> list[str]:
    """从文本中提取 http/https URL（粗糙提取，够钩子校验用）。"""
    urls: list[str] = []
    for token in text.split():
        if token.startswith(("http://", "https://")):
            urls.append(token)
    return urls


def _is_blocked_ssrf_url(url: str) -> bool:
    """
    判断 URL 是否指向内网/保留地址（SSRF 拦截）。

    拦截：127.x / 10.x / 172.16-31.x / 192.168.x / 169.254.x / 0.x / 100.64.x
    域名形式（localhost、*.internal 等）仅拦 localhost；其余域名 DNS 解析
    检查留给 web_fetch 阶段（当前 search 只调 Brave 固定端点，风险低）。
    """
    hostname = urllib.parse.urlparse(url).hostname
    if not hostname:
        return True

    lowered = hostname.lower()
    if lowered in ("localhost", "localhost.localdomain"):
        return True
    if lowered.endswith(".localhost"):
        return True

    try:
        ip = ipaddress.ip_address(hostname)
    except ValueError:
        return False  # 域名：当前阶段不解析（留给 web_fetch）

    return any(ip in net for net in _PRIVATE_NETWORKS)
