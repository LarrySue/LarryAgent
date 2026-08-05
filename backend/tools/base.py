"""
工具基类模块

职责：
- 定义所有工具必须实现的接口
- 提供工具元数据（名称、描述、参数 schema）
- execute 方法为抽象方法，子类必须实现

与其他模块的关系：
- 被 tools/registry.py 用于统一管理工具实例
- 被 api/tools.py 和 api/chat.py 用于调用具体工具
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ToolResult:
    """工具执行结果"""
    success: bool
    content: str = ""
    error: str = ""


class BaseTool(ABC):
    """
    工具基类。

    每个工具子类需要提供：
    - name: 工具唯一名称（用于注册和调用）
    - description: 工具用途描述（会注入到 LLM 的 system prompt）
    - parameters: JSON Schema 格式的参数定义
    - execute: 执行逻辑
    """

    name: str = ""
    description: str = ""
    parameters: dict = field(default_factory=dict)

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """执行工具逻辑。子类必须实现。"""
        ...

    def to_openai_schema(self) -> dict:
        """转换为 OpenAI function calling 兼容的 schema。"""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }
