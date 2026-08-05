"""
工具注册中心模块

职责：
- 启动时扫描 tools/ 目录，自动发现所有 BaseTool 子类
- 维护 name → tool 实例的映射表
- 提供注册、查询、列出所有工具的接口

与其他模块的关系：
- 被 main.py 在应用启动时调用 scan_and_register()
- 被 api/chat.py 获取工具列表注入 LLM
- 被 api/tools.py 列出和手动执行工具
"""

from tools.base import BaseTool

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


async def scan_and_register():
    """
    扫描 tools/ 目录，自动发现并注册所有工具。

    发现策略：
    - 遍历 tools/ 下所有 .py 文件（排除 __init__.py 和 base.py）
    - 动态导入模块
    - 查找模块中的 BaseTool 子类并实例化注册
    """
    # TODO: 实现自动扫描逻辑
    #   方案 A：手动列出所有工具模块路径（简单直接，推荐个人项目使用）
    #   方案 B：用 importlib + inspect 动态扫描（灵活但复杂）
    #   当前采用方案 A：显式导入

    from tools.file_ops import FileOpsTool
    from tools.shell import ShellTool

    register(FileOpsTool())
    register(ShellTool())
