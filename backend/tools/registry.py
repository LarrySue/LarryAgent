"""
工具注册中心模块

职责：
- 启动时注册所有工具（配置驱动启用）
- 维护 name → tool 实例的映射表
- 提供注册、查询、列出所有工具的接口

配置驱动启用（2026-08-20 底座同步夯实）：
- config.yaml 的 tools.enabled_tools 列出启用的工具名（如 ["file_ops", "shell", "web_search"]）
- enabled_tools 未配置/为空时 → 全部启用（向后兼容）
- 新增工具只需：写工具类 + 在 config.yaml 的 enabled_tools 加名字，不改核心代码

与其他模块的关系：
- 被 main.py 在应用启动时调用 scan_and_register()
- 被 api/chat.py 获取工具列表注入 LLM
- 被 api/tools.py 列出和手动执行工具
"""

import logging

from config import get_config
from tools.base import BaseTool

logger = logging.getLogger(__name__)

# 全局工具注册表：name → BaseTool 实例
_registry: dict[str, BaseTool] = {}


def register(tool: BaseTool):
    """注册一个工具实例。"""
    _registry[tool.name] = tool


def get_tool(name: str) -> BaseTool | None:
    """按名称获取工具。"""
    return _registry.get(name)


def list_tools() -> list[BaseTool]:
    """列出所有已注册的工具。"""
    return list(_registry.values())


def get_openai_tools() -> list[dict]:
    """获取所有工具的 OpenAI function calling schema。"""
    return [tool.to_openai_schema() for tool in _registry.values()]


def _available_tool_classes() -> dict[str, type[BaseTool]]:
    """工具名 → 工具类的映射表（新增工具在此登记）。"""
    from tools.file_ops import FileOpsTool
    from tools.shell import ShellTool
    from tools.web_search import WebSearchTool

    return {
        FileOpsTool.name: FileOpsTool,
        ShellTool.name: ShellTool,
        WebSearchTool.name: WebSearchTool,
    }


async def scan_and_register():
    """
    注册所有启用的工具（配置驱动）。

    策略：
    - config.tools.enabled_tools 非空 → 只注册列出的工具
    - 空列表 → 全部注册（向后兼容，未配置时不减少现有能力）
    """
    all_classes = _available_tool_classes()
    enabled = list(get_config().tools.enabled_tools)

    if enabled:
        for name in enabled:
            cls = all_classes.get(name)
            if cls is None:
                logger.warning("tools.enabled_tools: unknown tool '%s', skipped", name)
                continue
            try:
                register(cls())
            except Exception as e:
                logger.error("Failed to register tool '%s': %s", name, e)
    else:
        for name, cls in all_classes.items():
            try:
                register(cls())
            except Exception as e:
                logger.error("Failed to register tool '%s': %s", name, e)

    logger.info("Registered %d tools: %s", len(_registry), ", ".join(sorted(_registry)))
