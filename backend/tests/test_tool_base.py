"""
Tool 框架底座测试（BaseTool.run() 护栏，2026-08-20 派发）

职责：
- 超时强制：timeout 非 None 时 run() 对 execute 施加 asyncio.wait_for
- 错误归一：ToolError / 普通异常 → ToolResult(success=False)，不抛出
- 执行日志：成功/失败/耗时（caplog 验证）
- _validate_request 钩子：在 try 内调用，校验失败归一不中断
- 向后兼容：execute 直接调用不受影响（不经过 run 护栏）
"""

import asyncio
import logging
import time

import pytest

from tools.base import BaseTool, ToolError, ToolResult


# ---------------------------------------------------------------------------
# 测试用工具桩
# ---------------------------------------------------------------------------

class OkTool(BaseTool):
    name = "ok_tool"

    async def execute(self, **kwargs) -> ToolResult:
        return ToolResult(success=True, content="ok")


class SlowTool(BaseTool):
    name = "slow_tool"

    async def execute(self, **kwargs) -> ToolResult:
        await asyncio.sleep(5)
        return ToolResult(success=True, content="too slow")


class RaiseToolError(BaseTool):
    name = "raise_tool_error"

    async def execute(self, **kwargs) -> ToolResult:
        raise ToolError("tool internal failure")


class RaiseGenericError(BaseTool):
    name = "raise_generic"

    async def execute(self, **kwargs) -> ToolResult:
        raise RuntimeError("boom")


class ValidateTool(BaseTool):
    """覆写 _validate_request：参数 bad=true 时抛 ToolError。"""
    name = "validate_tool"

    def _validate_request(self, **kwargs) -> None:
        if kwargs.get("bad"):
            raise ToolError("validation rejected")

    async def execute(self, **kwargs) -> ToolResult:
        return ToolResult(success=True, content="passed")


# ---------------------------------------------------------------------------
# 超时强制
# ---------------------------------------------------------------------------

class TestRunTimeout:
    def test_timeout_enforced(self):
        """timeout=0.1 → 慢工具被 wait_for 截断，返回失败 ToolResult。"""
        tool = SlowTool()
        tool.timeout = 0.1

        t0 = time.monotonic()
        result = asyncio.run(tool.run())
        elapsed = time.monotonic() - t0

        assert result.success is False
        assert "timed out" in result.error
        assert elapsed < 3.0, "应在超时点被截断，而不是等满 5s"

    def test_no_timeout_no_interference(self):
        """timeout=None → 直接执行，不受 wait_for 影响。"""
        tool = OkTool()
        tool.timeout = None
        result = asyncio.run(tool.run())
        assert result.success is True


# ---------------------------------------------------------------------------
# 错误归一
# ---------------------------------------------------------------------------

class TestErrorNormalization:
    def test_tool_error_normalized(self):
        """execute 抛 ToolError → run() 归一为失败 ToolResult，不抛出。"""
        tool = RaiseToolError()
        result = asyncio.run(tool.run())
        assert result.success is False
        assert result.error == "tool internal failure"

    def test_generic_error_normalized(self):
        """execute 抛普通异常 → 归一为失败 ToolResult（含类型名）。"""
        tool = RaiseGenericError()
        result = asyncio.run(tool.run())
        assert result.success is False
        assert "RuntimeError" in result.error

    def test_validation_hook_in_try(self):
        """
        _validate_request 校验失败 → 归一为失败 ToolResult 而非抛到调用方。
        （Trae 自测发现并修复的行为，这里显式钉住）
        """
        tool = ValidateTool()
        result = asyncio.run(tool.run(bad=True))
        assert result.success is False
        assert result.error == "validation rejected"

    def test_validation_pass_through(self):
        tool = ValidateTool()
        result = asyncio.run(tool.run(bad=False))
        assert result.success is True
        assert result.content == "passed"


# ---------------------------------------------------------------------------
# 执行日志
# ---------------------------------------------------------------------------

class TestRunLogging:
    def test_success_logged(self, caplog):
        """成功执行 → info 日志含工具名与耗时。"""
        tool = OkTool()
        with caplog.at_level(logging.INFO):
            asyncio.run(tool.run())
        assert any(
            "Tool ok_tool executed" in rec.message for rec in caplog.records
        )

    def test_failure_logged(self, caplog):
        """失败执行 → warning 日志。"""
        tool = RaiseToolError()
        with caplog.at_level(logging.WARNING):
            asyncio.run(tool.run())
        assert any(
            "Tool raise_tool_error failed" in rec.message for rec in caplog.records
        )


# ---------------------------------------------------------------------------
# 向后兼容：execute 直接调用
# ---------------------------------------------------------------------------

class TestExecuteBackwardCompat:
    def test_execute_direct_still_works(self):
        """旧调用方直接 execute()（不经 run）→ 行为不变。"""
        tool = OkTool()
        result = asyncio.run(tool.execute())
        assert result.success is True

    def test_schema_present(self):
        """元数据：name / description / parameters / schema 生成。"""
        tool = OkTool()
        schema = tool.to_openai_schema()
        assert schema["type"] == "function"
        assert schema["function"]["name"] == "ok_tool"
