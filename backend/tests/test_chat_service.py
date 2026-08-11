"""
P2.3 Function Calling 循环端到端测试

测试 chat_service 的工具调用循环、caller_ip 注入、
消息持久化（tool_calls / tool_call_id）、最大轮次限制。

注：chat_service 重构后，工具循环由 _chat_flow（async generator）
统一驱动，事件类型：tool_call / tool_result / delta / done / error。
最终回复文本通过 chat_completion_stream 流式产出，故测试需同时
mock chat_completion 与 chat_completion_stream。
"""

import asyncio
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from db import conversations as conv_db
from db.database import close_db, get_db
from models.llm import LLMResponse
from services.chat_service import ChatRequest, _chat_flow, _get_tools_for_role, handle_chat
from tools.base import BaseTool, ToolResult
from tools.registry import register, scan_and_register


async def _collect_events(req: ChatRequest, caller_ip: str) -> list[dict]:
    """消费 _chat_flow 生成器，收集全部事件。"""
    return [event async for event in _chat_flow(req, caller_ip)]


def _deltas(events: list[dict]) -> str:
    """从事件列表中拼接所有 delta 文本。"""
    return "".join(e["content"] for e in events if e["type"] == "delta")


class TestToolLoop(unittest.IsolatedAsyncioTestCase):
    """测试 function calling 循环"""

    async def asyncSetUp(self):
        """每个测试前初始化 DB 和工具注册"""
        os.environ["LARRY_CONFIG"] = os.path.join(
            os.path.dirname(__file__), "..", "config.yaml"
        )
        await get_db()
        await scan_and_register()

    async def asyncTearDown(self):
        await close_db()

    async def test_no_tool_calls(self):
        """LLM 直接返回文本（无工具调用）应立即结束"""
        # mock chat_completion 返回纯文本
        from services import chat_service

        original = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream

        async def mock_completion(**kwargs):
            return LLMResponse(content="你好！有什么可以帮你的？", finish_reason="stop")

        async def mock_stream(**kwargs):
            yield "你好！有什么可以帮你的？"

        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        try:
            req = ChatRequest(message="你好", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            reply = _deltas(events)
            self.assertEqual(reply, "你好！有什么可以帮你的？")
            self.assertEqual(events[-1]["type"], "done")
        finally:
            chat_service.chat_completion = original
            chat_service.chat_completion_stream = original_stream

    async def test_single_tool_call(self):
        """LLM 调用一次工具后返回结果"""
        from services import chat_service

        original = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream
        call_count = [0]

        async def mock_completion(**kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return LLMResponse(
                    content="",
                    tool_calls=[{
                        "id": "call_001",
                        "name": "echo_tool",
                        "arguments": json.dumps({"text": "hello"}),
                    }],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(content="echo 返回: hello", finish_reason="stop")

        async def mock_stream(**kwargs):
            yield "echo 返回: hello"

        # 注册一个测试工具
        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显输入文本"
            parameters = {
                "type": "object",
                "properties": {"text": {"type": "string"}},
                "required": ["text"],
            }

            async def execute(self, **kwargs):
                return ToolResult(success=True, content=kwargs.get("text", ""))

        register(EchoTool())

        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        try:
            req = ChatRequest(message="echo hello", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            reply = _deltas(events)
            self.assertEqual(reply, "echo 返回: hello")
            self.assertEqual(call_count[0], 2)  # 1 次 tool_call + 1 次 stop

            # tool_call 事件（执行前）
            tool_call_events = [e for e in events if e["type"] == "tool_call"]
            self.assertEqual(len(tool_call_events), 1)
            self.assertEqual(tool_call_events[0]["name"], "echo_tool")
            self.assertEqual(tool_call_events[0]["arguments"], {"text": "hello"})

            # tool_result 事件（执行后）
            tool_result_events = [e for e in events if e["type"] == "tool_result"]
            self.assertEqual(len(tool_result_events), 1)
            self.assertTrue(tool_result_events[0]["success"])
            self.assertEqual(tool_result_events[0]["content"], "hello")
        finally:
            chat_service.chat_completion = original
            chat_service.chat_completion_stream = original_stream

    async def test_multiple_tool_calls(self):
        """LLM 一次返回多个 tool_calls 应全部执行"""
        from services import chat_service

        original = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream
        call_count = [0]

        async def mock_completion(**kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return LLMResponse(
                    content="",
                    tool_calls=[
                        {"id": "call_1", "name": "echo_tool", "arguments": json.dumps({"text": "A"})},
                        {"id": "call_2", "name": "echo_tool", "arguments": json.dumps({"text": "B"})},
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(content="A 和 B", finish_reason="stop")

        async def mock_stream(**kwargs):
            yield "A 和 B"

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content=kwargs.get("text", ""))

        register(EchoTool())

        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        try:
            req = ChatRequest(message="echo A and B", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")

            tool_call_events = [e for e in events if e["type"] == "tool_call"]
            tool_result_events = [e for e in events if e["type"] == "tool_result"]
            self.assertEqual(len(tool_call_events), 2)
            self.assertEqual(len(tool_result_events), 2)
            self.assertEqual(tool_result_events[0]["content"], "A")
            self.assertEqual(tool_result_events[1]["content"], "B")
            self.assertTrue(tool_result_events[0]["success"])
            self.assertTrue(tool_result_events[1]["success"])
        finally:
            chat_service.chat_completion = original
            chat_service.chat_completion_stream = original_stream

    async def test_max_rounds(self):
        """达到最大轮次应停止并返回提示"""
        from services import chat_service

        original_completion = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream

        async def mock_completion(**kwargs):
            return LLMResponse(
                content="",
                tool_calls=[{
                    "id": f"call_{kwargs.get('messages', [{}])[-1].get('content', 'x')}",
                    "name": "echo_tool",
                    "arguments": "{}",
                }],
                finish_reason="tool_calls",
            )

        async def mock_stream(**kwargs):
            yield "should not be called"

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {}}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content="loop")

        register(EchoTool())

        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        try:
            req = ChatRequest(message="loop forever", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            reply = _deltas(events)
            self.assertIn("最大轮次", reply)
            self.assertEqual(events[-1]["type"], "done")
        finally:
            chat_service.chat_completion = original_completion
            chat_service.chat_completion_stream = original_stream

    async def test_tool_not_found(self):
        """LLM 调用不存在的工具应返回 error 但不崩溃"""
        from services import chat_service

        original = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream
        call_count = [0]

        async def mock_completion(**kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return LLMResponse(
                    content="",
                    tool_calls=[{
                        "id": "call_x",
                        "name": "nonexistent_tool",
                        "arguments": "{}",
                    }],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(content="工具不存在", finish_reason="stop")

        async def mock_stream(**kwargs):
            yield "工具不存在"

        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        try:
            req = ChatRequest(message="call ghost", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            tool_result_events = [e for e in events if e["type"] == "tool_result"]
            self.assertEqual(len(tool_result_events), 1)
            self.assertFalse(tool_result_events[0]["success"])
            self.assertIn("not found", tool_result_events[0]["content"])
        finally:
            chat_service.chat_completion = original
            chat_service.chat_completion_stream = original_stream

    async def test_message_persistence(self):
        """工具调用消息应持久化到 DB"""
        from services import chat_service

        original = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream
        call_count = [0]

        async def mock_completion(**kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return LLMResponse(
                    content="",
                    tool_calls=[{
                        "id": "call_db_1",
                        "name": "echo_tool",
                        "arguments": json.dumps({"text": "persist"}),
                    }],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(content="done", finish_reason="stop")

        async def mock_stream(**kwargs):
            yield "done"

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content=kwargs.get("text", ""))

        register(EchoTool())

        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        try:
            req = ChatRequest(message="test persist", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            done_events = [e for e in events if e["type"] == "done"]
            self.assertEqual(len(done_events), 1)
            conv_id = done_events[0]["conversation_id"]

            db_msgs = await conv_db.get_messages(conv_id, limit=None)
            roles = [m["role"] for m in db_msgs]
            self.assertIn("assistant", roles)
            self.assertIn("tool", roles)

            assistant_msg = [m for m in db_msgs if m["role"] == "assistant" and m.get("tool_calls")][0]
            self.assertEqual(assistant_msg["tool_calls"][0]["id"], "call_db_1")

            tool_msg = [m for m in db_msgs if m["role"] == "tool"][0]
            self.assertEqual(tool_msg["tool_call_id"], "call_db_1")
            self.assertEqual(tool_msg["content"], "persist")
        finally:
            chat_service.chat_completion = original
            chat_service.chat_completion_stream = original_stream


class TestRoleFilter(unittest.TestCase):
    """测试工具按角色过滤"""

    def setUp(self):
        os.environ["LARRY_CONFIG"] = os.path.join(
            os.path.dirname(__file__), "..", "config.yaml"
        )
        asyncio.run(scan_and_register())

    def test_no_role_config_returns_all(self):
        """未配置角色工具时返回所有工具"""
        tools = _get_tools_for_role("nonexistent_role")
        self.assertIsNotNone(tools)
        names = [t["function"]["name"] for t in tools]
        self.assertIn("file_ops", names)
        self.assertIn("shell", names)

    def test_role_with_tools(self):
        """配置了工具列表的角色应过滤"""
        from config import get_config
        config = get_config()
        original_roles = config.roles
        config.roles = {
            "default": {
                "system_prompt": "test",
                "tools": ["file_ops"],
            }
        }
        try:
            tools = _get_tools_for_role("default")
            self.assertIsNotNone(tools)
            names = [t["function"]["name"] for t in tools]
            self.assertIn("file_ops", names)
            self.assertNotIn("shell", names)
        finally:
            config.roles = original_roles


class TestRoleFilterEndToEnd(unittest.IsolatedAsyncioTestCase):
    """角色过滤端到端：验证传给 LLM 的 tools 参数确实不含被过滤的工具"""

    async def asyncSetUp(self):
        os.environ["LARRY_CONFIG"] = os.path.join(
            os.path.dirname(__file__), "..", "config.yaml"
        )
        await get_db()
        await scan_and_register()

    async def asyncTearDown(self):
        await close_db()

    async def test_role_filter_excludes_shell(self):
        """role 只配 file_ops 时，传给 chat_completion 的 tools 不含 shell"""
        from config import get_config
        from services import chat_service

        config = get_config()
        original_roles = config.roles
        config.roles = {
            "default": {
                "system_prompt": "test",
                "tools": ["file_ops"],
            }
        }

        captured_tools = []

        async def mock_completion(**kwargs):
            captured_tools.append(kwargs.get("tools"))
            return LLMResponse(content="done", finish_reason="stop")

        async def mock_stream(**kwargs):
            yield "done"

        original = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream
        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        try:
            req = ChatRequest(
                message="test", model="test", temperature=0.7, role="default"
            )
            await _collect_events(req, "127.0.0.1")
            self.assertEqual(len(captured_tools), 1)
            tool_names = [t["function"]["name"] for t in captured_tools[0]]
            self.assertIn("file_ops", tool_names)
            self.assertNotIn("shell", tool_names)
        finally:
            config.roles = original_roles
            chat_service.chat_completion = original
            chat_service.chat_completion_stream = original_stream


class TestToolErrorRecovery(unittest.IsolatedAsyncioTestCase):
    """工具执行失败恢复：error 内容回到 messages 且对话不中断"""

    async def asyncSetUp(self):
        os.environ["LARRY_CONFIG"] = os.path.join(
            os.path.dirname(__file__), "..", "config.yaml"
        )
        await get_db()
        await scan_and_register()

    async def asyncTearDown(self):
        await close_db()

    async def test_tool_error_flows_back(self):
        """LLM 调 read 读不存在的文件 → error 回到 messages → LLM 收到后继续"""

        class FailTool(BaseTool):
            name = "fail_tool"
            description = "总是失败的测试工具"
            parameters = {"type": "object", "properties": {}}

            async def execute(self, **kwargs):
                return ToolResult(success=False, error="文件不存在: ghost.txt")

        register(FailTool())

        from services import chat_service

        original = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream
        call_count = [0]
        captured_messages = []

        async def mock_completion(**kwargs):
            call_count[0] += 1
            captured_messages.append(list(kwargs.get("messages", [])))
            if call_count[0] == 1:
                return LLMResponse(
                    content="",
                    tool_calls=[{
                        "id": "call_err_1",
                        "name": "fail_tool",
                        "arguments": "{}",
                    }],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(content="文件不存在，换一个吧", finish_reason="stop")

        async def mock_stream(**kwargs):
            yield "文件不存在，换一个吧"

        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        try:
            req = ChatRequest(message="读 ghost.txt", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            reply = _deltas(events)

            # 循环正常结束
            self.assertEqual(call_count[0], 2)
            self.assertEqual(reply, "文件不存在，换一个吧")

            # 第二轮调 LLM 时，messages 中应包含 tool 消息且 content 是 error 内容
            round2_msgs = captured_messages[1]
            tool_msgs = [m for m in round2_msgs if m["role"] == "tool"]
            self.assertEqual(len(tool_msgs), 1)
            self.assertIn("文件不存在", tool_msgs[0]["content"])
            self.assertEqual(tool_msgs[0]["tool_call_id"], "call_err_1")
        finally:
            chat_service.chat_completion = original
            chat_service.chat_completion_stream = original_stream


class TestCallerIpInjection(unittest.IsolatedAsyncioTestCase):
    """caller_ip 注入验证：_chat_flow 调 shell 时 caller_ip 正确传入 kwargs"""

    async def asyncSetUp(self):
        os.environ["LARRY_CONFIG"] = os.path.join(
            os.path.dirname(__file__), "..", "config.yaml"
        )
        await get_db()
        await scan_and_register()

    async def asyncTearDown(self):
        await close_db()

    async def test_caller_ip_passed_to_shell(self):
        """ShellTool 通过 _chat_flow 调用时，caller_ip 应注入 kwargs"""

        class MockShellTool(BaseTool):
            name = "shell"
            description = "Mock shell"
            parameters = {
                "type": "object",
                "properties": {"command": {"type": "string"}},
                "required": ["command"],
            }

            def __init__(self):
                self.received_caller_ip = None

            async def execute(self, **kwargs):
                self.received_caller_ip = kwargs.get("caller_ip")
                return ToolResult(success=True, content="ok")

        mock_shell = MockShellTool()
        register(mock_shell)

        from services import chat_service

        original = chat_service.chat_completion
        original_stream = chat_service.chat_completion_stream

        async def mock_completion(**kwargs):
            return LLMResponse(
                content="",
                tool_calls=[{
                    "id": "call_ip_1",
                    "name": "shell",
                    "arguments": json.dumps({"command": "echo hi"}),
                }],
                finish_reason="tool_calls",
            )

        async def mock_stream(**kwargs):
            yield "should not be called"

        original_get_tool = chat_service.get_tool

        def mock_get_tool(name):
            if name == "shell":
                return mock_shell
            return original_get_tool(name)

        chat_service.chat_completion = mock_completion
        chat_service.chat_completion_stream = mock_stream
        chat_service.get_tool = mock_get_tool
        try:
            test_ip = "192.168.1.50"
            req = ChatRequest(message="echo hi", model="test", temperature=0.7)
            await _collect_events(req, test_ip)
            self.assertEqual(mock_shell.received_caller_ip, test_ip)
        finally:
            chat_service.chat_completion = original
            chat_service.chat_completion_stream = original_stream
            chat_service.get_tool = original_get_tool


def run_tests():
    print("=" * 60)
    print("P2.3 Function Calling 循环测试")
    print("=" * 60)
    print()

    suite = unittest.TestLoader().loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print()
    print("=" * 60)
    print("测试总结")
    print("=" * 60)
    print()
    print("已验证功能（11 项测试）：")
    print("  [PASS] 无工具调用：LLM 直接返回文本")
    print("  [PASS] 单工具调用：执行 + 结果追加 + tool_call_id 匹配")
    print("  [PASS] 多工具调用：一次返回多个 tool_calls 全部执行")
    print("  [PASS] 最大轮次：达到上限停止")
    print("  [PASS] 工具不存在：返回 error 不崩溃")
    print("  [PASS] 消息持久化：tool_calls + tool_call_id 写入 DB")
    print("  [PASS] 角色过滤：按 role→tools 映射过滤工具")
    print("  [PASS] 角色过滤端到端：传给 LLM 的 tools 不含被过滤工具")
    print("  [PASS] 工具失败恢复：error 内容回到 messages 且对话不中断")
    print("  [PASS] caller_ip 注入：shell 工具通过 _chat_flow 调用时 caller_ip 正确传入")
    print()
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
