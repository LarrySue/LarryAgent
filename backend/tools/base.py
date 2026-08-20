"""
工具基类模块

职责：
- 定义所有工具必须实现的接口
- 提供工具元数据（名称、描述、参数 schema）
- execute 方法为抽象方法，子类必须实现
- BaseTool.run() 护栏模板方法：所有工具继承即获
    超时强制 + 错误归一(ToolError) + 执行日志 + 请求校验钩子

护栏分级（guard_level）：
- "none"    纯本地计算，无外部资源访问
- "local"   访问本地资源（文件系统 / 进程等）
- "network" 访问外部网络资源（需叠加 _validate_request 做 SSRF 校验）

与其他模块的关系：
- 被 tools/registry.py 用于统一管理工具实例
- 被 api/tools.py 和 api/chat.py 通过 run() 调用具体工具
"""

import asyncio
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


class ToolError(Exception):
    """
    工具执行错误（内部异常）。

    所有工具执行中抛出的异常都会被 BaseTool.run() 捕获并归一为
    ToolResult(success=False, error=...)，不会向上抛出导致聊天中断。
    """


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
    - execute: 执行逻辑（子类实现）
    - guard_level: 护栏级别（"none" / "local" / "network"，默认 "none"）
    - timeout: 单次执行硬超时秒数（None = 不强制，默认 None）
    """

    name: str = ""
    description: str = ""
    parameters: dict = field(default_factory=dict)

    # —— 护栏配置（P4.5 底座同步夯实）——
    guard_level: str = "none"       # "none" / "local" / "network"
    timeout: float | None = None    # 单次执行硬超时（秒），None 不强制

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """执行工具逻辑。子类必须实现。"""

    # ------------------------------------------------------------------
    # 护栏模板方法：外部统一通过 run() 调用，而不是直接 execute()
    # ------------------------------------------------------------------
    async def run(self, **kwargs) -> ToolResult:
        """
        带护栏的执行入口（模板方法）。

        统一提供：
        1. _validate_request() 请求校验钩子（SSRF / caller 校验覆写点）
        2. 超时强制（self.timeout 非 None 时 asyncio.wait_for）
        3. 错误归一：任何异常 → ToolResult(success=False, error=...)，不抛出
        4. 执行日志（成功/失败/耗时）

        子类不覆写本方法；如需额外护栏，覆写 _validate_request 或 execute。
        """
        async def _guarded():
            return await self.execute(**kwargs)

        t0 = time.monotonic()
        try:
            # 请求校验放 try 内：校验失败(ToolError)也归一为失败 ToolResult，不中断聊天
            self._validate_request(**kwargs)
            if self.timeout is not None:
                result = await asyncio.wait_for(_guarded(), timeout=self.timeout)
            else:
                result = await _guarded()

            logger.info(
                "Tool %s executed (%.0fms)",
                self.name, (time.monotonic() - t0) * 1000,
            )
            return result
        except asyncio.TimeoutError:
            logger.warning("Tool %s timed out (>%ss)", self.name, self.timeout)
            return ToolResult(
                success=False,
                error=f"Tool '{self.name}' timed out after {self.timeout}s",
            )
        except ToolError as e:
            logger.warning("Tool %s failed: %s", self.name, e)
            return ToolResult(success=False, error=str(e))
        except Exception as e:
            logger.error("Tool %s unhandled error: %s", self.name, e, exc_info=True)
            return ToolResult(success=False, error=f"{type(e).__name__}: {e}")

    def _validate_request(self, **kwargs) -> None:
        """
        请求校验钩子（默认空实现）。

        访问外部/本地资源的工具覆写此方法做 SSRF / caller 校验，
        校验不通过应抛出 ToolError（run() 会归一为失败 ToolResult）。
        """

    # ------------------------------------------------------------------
    # 工具元数据辅助
    # ------------------------------------------------------------------
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
