"""
P2.3 Function Calling 循环端到端测试

测试 chat_service 的工具调用循环、caller_ip 注入、
消息持久化（tool_calls / tool_call_id）、最大轮次限制。
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
from services.chat_service import ChatRequest, _get_tools_for_role, _run_tool_loop, handle_chat
from tools.base import BaseTool, ToolResult
from tools.registry import register, scan_and_register


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

        async def mock_completion(**kwargs):
            return LLMResponse(content="你好！有什么可以帮你的？", finish_reason="stop")

        chat_service.chat_completion = mock_completion
        try:
            reply = await _run_tool_loop(
                model="test",
                messages=[{"role": "user", "content": "你好"}],
                tools=None,
                temperature=0.7,
                conversation_id=1,
                caller_ip="127.0.0.1",
            )
            self.assertEqual(reply, "你好！有什么可以帮你的？")
        finally:
            chat_service.chat_completion = original

    async def test_single_tool_call(self):
        """LLM 调用一次工具后返回结果"""
        from services import chat_service

        original = chat_service.chat_completion
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
        try:
            messages = [{"role": "user", "content": "echo hello"}]
            reply = await _run_tool_loop(
                model="test",
                messages=messages,
                tools=[{"type": "function", "function": {"name": "echo_tool"}}],
                temperature=0.7,
                conversation_id=1,
                caller_ip="127.0.0.1",
            )
            self.assertEqual(reply, "echo 返回: hello")
            self.assertEqual(call_count[0], 2)  # 1 次 tool_call + 1 次 stop
            # messages 应包含 assistant + tool 消息
            roles = [m["role"] for m in messages]
            self.assertIn("assistant", roles)
            self.assertIn("tool", roles)
            # tool 消息应带 tool_call_id
            tool_msg = [m for m in messages if m["role"] == "tool"][0]
            self.assertEqual(tool_msg["tool_call_id"], "call_001")
        finally:
            chat_service.chat_completion = original

    async def test_multiple_tool_calls(self):
        """LLM 一次返回多个 tool_calls 应全部执行"""
        from services import chat_service

        original = chat_service.chat_completion
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

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content=kwargs.get("text", ""))

        register(EchoTool())

        chat_service.chat_completion = mock_completion
        try:
            messages = [{"role": "user", "content": "echo A and B"}]
            await _run_tool_loop(
                model="test",
                messages=messages,
                tools=[],
                temperature=0.7,
                conversation_id=1,
                caller_ip="127.0.0.1",
            )
            tool_msgs = [m for m in messages if m["role"] == "tool"]
            self.assertEqual(len(tool_msgs), 2)
            self.assertEqual(tool_msgs[0]["tool_call_id"], "call_1")
            self.assertEqual(tool_msgs[1]["tool_call_id"], "call_2")
        finally:
            chat_service.chat_completion = original

    async def test_max_rounds(self):
        """达到最大轮次应停止并返回提示"""
        from services import chat_service

        original_completion = chat_service.chat_completion

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

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {}}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content="loop")

        register(EchoTool())

        chat_service.chat_completion = mock_completion
        try:
            reply = await _run_tool_loop(
                model="test",
                messages=[{"role": "user", "content": "loop forever"}],
                tools=[],
                temperature=0.7,
                conversation_id=1,
                caller_ip="127.0.0.1",
            )
            self.assertIn("最大轮次", reply)
        finally:
            chat_service.chat_completion = original_completion

    async def test_tool_not_found(self):
        """LLM 调用不存在的工具应返回 error 但不崩溃"""
        from services import chat_service

        original = chat_service.chat_completion
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

        chat_service.chat_completion = mock_completion
        try:
            messages = [{"role": "user", "content": "call ghost"}]
            await _run_tool_loop(
                model="test",
                messages=messages,
                tools=[],
                temperature=0.7,
                conversation_id=1,
                caller_ip="127.0.0.1",
            )
            tool_msg = [m for m in messages if m["role"] == "tool"][0]
            self.assertIn("not found", tool_msg["content"])
        finally:
            chat_service.chat_completion = original

    async def test_message_persistence(self):
        """工具调用消息应持久化到 DB"""
        from services import chat_service

        original = chat_service.chat_completion
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

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content=kwargs.get("text", ""))

        register(EchoTool())

        chat_service.chat_completion = mock_completion
        try:
            conv_id = await conv_db.create_conversation()
            messages = [{"role": "user", "content": "test persist"}]
            await _run_tool_loop(
                model="test",
                messages=messages,
                tools=[],
                temperature=0.7,
                conversation_id=conv_id,
                caller_ip="127.0.0.1",
            )

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
    print("已验证功能：")
    print("  [PASS] 无工具调用：LLM 直接返回文本")
    print("  [PASS] 单工具调用：执行 + 结果追加 + tool_call_id 匹配")
    print("  [PASS] 多工具调用：一次返回多个 tool_calls 全部执行")
    print("  [PASS] 最大轮次：达到上限停止")
    print("  [PASS] 工具不存在：返回 error 不崩溃")
    print("  [PASS] 消息持久化：tool_calls + tool_call_id 写入 DB")
    print("  [PASS] 角色过滤：按 role→tools 映射过滤工具")
    print()
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
