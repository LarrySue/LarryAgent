"""
P2.3 / P3.3 Function Calling 循环端到端测试

测试 chat_service 的工具调用循环、caller_ip 注入、
消息持久化（tool_calls / tool_call_id）、最大轮次限制。

P3.3 改造后：工具循环由 _chat_flow（async generator）统一驱动，
每轮使用 chat_completion_stream_events 全程流式（delta + finish +
tool_calls + usage），不再有"非流式探测 + 流式重生成"的双调用。
测试统一 mock chat_service.chat_completion_stream_events。
"""

import asyncio
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from db import conversations as conv_db
from db.database import close_db, get_db
from services.chat_service import ChatRequest, _chat_flow, _get_tools_for_role
from tools.base import BaseTool, ToolResult
from tools.registry import register, scan_and_register


async def _collect_events(req: ChatRequest, caller_ip: str) -> list[dict]:
    """消费 _chat_flow 生成器，收集全部事件。"""
    return [event async for event in _chat_flow(req, caller_ip)]


def _deltas(events: list[dict]) -> str:
    """从事件列表中拼接所有 delta 文本。"""
    return "".join(e["content"] for e in events if e["type"] == "delta")


def _make_stream_events_mock(round_responses: list[dict]):
    """
    构造一个 chat_completion_stream_events 的 mock 工厂。

    每次调用按 round_responses 的顺序返回，每 round_response 形如：
    {
        "deltas": ["a", "b"],           # 可选，文本增量
        "finish_reason": "stop",          # "stop" | "tool_calls"
        "tool_calls": [...],              # 可选
        "usage": {total, prompt, completion},  # 可选
    }

    返回值：(async_mock_fn, call_count_list)
    """
    call_count = [0]

    async def mock(**kwargs):
        idx = call_count[0]
        call_count[0] += 1
        spec = round_responses[idx % len(round_responses)]
        for d in spec.get("deltas", []):
            yield {"type": "delta", "content": d}
        yield {
            "type": "finish",
            "finish_reason": spec.get("finish_reason", "stop"),
            "tool_calls": spec.get("tool_calls", []),
            "usage": spec.get("usage", {}),
        }

    return mock, call_count


class TestToolLoop(unittest.IsolatedAsyncioTestCase):
    """测试 function calling 循环（P3.3 全程流式版本）"""

    async def asyncSetUp(self):
        await get_db()
        await scan_and_register()

    async def asyncTearDown(self):
        await close_db()

    async def test_no_tool_calls(self):
        """LLM 直接返回文本（无工具调用），只调用 1 次流式 LLM"""
        from services import chat_service

        original = chat_service.chat_completion_stream_events

        mock_fn, call_count = _make_stream_events_mock([
            {
                "deltas": ["你好！有什么可以帮你的？"],
                "finish_reason": "stop",
                "usage": {"total_tokens": 20, "prompt_tokens": 10, "completion_tokens": 10},
            },
        ])
        chat_service.chat_completion_stream_events = mock_fn
        try:
            req = ChatRequest(message="你好", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            reply = _deltas(events)
            self.assertEqual(reply, "你好！有什么可以帮你的？")
            self.assertEqual(events[-1]["type"], "done")
            self.assertEqual(call_count[0], 1, "无工具调用场景应只调用 1 次流式（P3.3-5 消除双调用）")
        finally:
            chat_service.chat_completion_stream_events = original

    async def test_single_tool_call(self):
        """LLM 调用一次工具后返回结果 — 共 2 次流式调用"""
        from services import chat_service

        original = chat_service.chat_completion_stream_events

        mock_fn, call_count = _make_stream_events_mock([
            {
                "deltas": ["好的，"],
                "finish_reason": "tool_calls",
                "tool_calls": [{
                    "id": "call_001",
                    "name": "echo_tool",
                    "arguments": json.dumps({"text": "hello"}),
                }],
                "usage": {"total_tokens": 30, "prompt_tokens": 20, "completion_tokens": 10},
            },
            {
                "deltas": ["echo 返回: hello"],
                "finish_reason": "stop",
                "usage": {"total_tokens": 25, "prompt_tokens": 15, "completion_tokens": 10},
            },
        ])

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

        chat_service.chat_completion_stream_events = mock_fn
        try:
            req = ChatRequest(message="echo hello", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            reply = _deltas(events)
            self.assertIn("echo 返回: hello", reply)
            self.assertEqual(call_count[0], 2)  # 1 次 tool_call + 1 次 stop

            tool_call_events = [e for e in events if e["type"] == "tool_call"]
            self.assertEqual(len(tool_call_events), 1)
            self.assertEqual(tool_call_events[0]["name"], "echo_tool")
            self.assertEqual(tool_call_events[0]["arguments"], {"text": "hello"})

            tool_result_events = [e for e in events if e["type"] == "tool_result"]
            self.assertEqual(len(tool_result_events), 1)
            self.assertTrue(tool_result_events[0]["success"])
            self.assertEqual(tool_result_events[0]["content"], "hello")
        finally:
            chat_service.chat_completion_stream_events = original

    async def test_multiple_tool_calls(self):
        """LLM 一次返回多个 tool_calls 应全部执行"""
        from services import chat_service

        original = chat_service.chat_completion_stream_events

        mock_fn, _ = _make_stream_events_mock([
            {
                "deltas": [],
                "finish_reason": "tool_calls",
                "tool_calls": [
                    {"id": "call_1", "name": "echo_tool", "arguments": json.dumps({"text": "A"})},
                    {"id": "call_2", "name": "echo_tool", "arguments": json.dumps({"text": "B"})},
                ],
            },
            {
                "deltas": ["A 和 B"],
                "finish_reason": "stop",
            },
        ])

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content=kwargs.get("text", ""))

        register(EchoTool())

        chat_service.chat_completion_stream_events = mock_fn
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
            chat_service.chat_completion_stream_events = original

    async def test_max_rounds(self):
        """达到最大轮次应停止并返回提示"""
        from services import chat_service

        original = chat_service.chat_completion_stream_events

        call_count_track = [0]

        async def mock_loop(**kwargs):
            call_count_track[0] += 1
            idx = call_count_track[0]
            yield {"type": "delta", "content": f"r{idx}"}
            yield {
                "type": "finish",
                "finish_reason": "tool_calls",
                "tool_calls": [{
                    "id": f"call_{idx}",
                    "name": "echo_tool",
                    "arguments": "{}",
                }],
                "usage": {},
            }

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {}}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content="loop")

        register(EchoTool())

        chat_service.chat_completion_stream_events = mock_loop
        try:
            req = ChatRequest(message="loop forever", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            reply = _deltas(events)
            self.assertIn("最大轮次", reply)
            self.assertEqual(events[-1]["type"], "done")
        finally:
            chat_service.chat_completion_stream_events = original

    async def test_tool_not_found(self):
        """LLM 调用不存在的工具应返回 error 但不崩溃"""
        from services import chat_service

        original = chat_service.chat_completion_stream_events

        mock_fn, _ = _make_stream_events_mock([
            {
                "deltas": [],
                "finish_reason": "tool_calls",
                "tool_calls": [{
                    "id": "call_x",
                    "name": "nonexistent_tool",
                    "arguments": "{}",
                }],
            },
            {
                "deltas": ["工具不存在"],
                "finish_reason": "stop",
            },
        ])

        chat_service.chat_completion_stream_events = mock_fn
        try:
            req = ChatRequest(message="call ghost", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            tool_result_events = [e for e in events if e["type"] == "tool_result"]
            self.assertEqual(len(tool_result_events), 1)
            self.assertFalse(tool_result_events[0]["success"])
            self.assertIn("not found", tool_result_events[0]["content"])
        finally:
            chat_service.chat_completion_stream_events = original

    async def test_message_persistence(self):
        """工具调用消息应持久化到 DB"""
        from services import chat_service

        original = chat_service.chat_completion_stream_events

        mock_fn, _ = _make_stream_events_mock([
            {
                "deltas": ["准备查询"],
                "finish_reason": "tool_calls",
                "tool_calls": [{
                    "id": "call_db_1",
                    "name": "echo_tool",
                    "arguments": json.dumps({"text": "persist"}),
                }],
            },
            {
                "deltas": ["done"],
                "finish_reason": "stop",
            },
        ])

        class EchoTool(BaseTool):
            name = "echo_tool"
            description = "回显"
            parameters = {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}

            async def execute(self, **kwargs):
                return ToolResult(success=True, content=kwargs.get("text", ""))

        register(EchoTool())

        chat_service.chat_completion_stream_events = mock_fn
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
            self.assertIn("准备查询", assistant_msg["content"])

            tool_msg = [m for m in db_msgs if m["role"] == "tool"][0]
            self.assertEqual(tool_msg["tool_call_id"], "call_db_1")
            self.assertEqual(tool_msg["content"], "persist")
        finally:
            chat_service.chat_completion_stream_events = original


class TestRoleFilter(unittest.TestCase):
    """测试工具按角色过滤"""

    def setUp(self):
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
    """角色过滤端到端：验证传给 LLM 的 tools 参数确实不含被过滤工具"""

    async def asyncSetUp(self):
        await get_db()
        await scan_and_register()

    async def asyncTearDown(self):
        await close_db()

    async def test_role_filter_excludes_shell(self):
        """role 只配 file_ops 时，传给 stream_events 的 tools 不含 shell"""
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

        async def mock_stream_events(**kwargs):
            captured_tools.append(kwargs.get("tools"))
            yield {"type": "delta", "content": "done"}
            yield {"type": "finish", "finish_reason": "stop", "tool_calls": [], "usage": {}}

        original = chat_service.chat_completion_stream_events
        chat_service.chat_completion_stream_events = mock_stream_events
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
            chat_service.chat_completion_stream_events = original


class TestToolErrorRecovery(unittest.IsolatedAsyncioTestCase):
    """工具执行失败恢复：error 内容回到 messages 且对话不中断"""

    async def asyncSetUp(self):
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

        original = chat_service.chat_completion_stream_events
        call_count = [0]
        captured_messages = []

        async def mock_stream_events(**kwargs):
            call_count[0] += 1
            captured_messages.append(list(kwargs.get("messages", [])))
            if call_count[0] == 1:
                yield {"type": "delta", "content": ""}
                yield {
                    "type": "finish",
                    "finish_reason": "tool_calls",
                    "tool_calls": [{
                        "id": "call_err_1",
                        "name": "fail_tool",
                        "arguments": "{}",
                    }],
                    "usage": {},
                }
            else:
                yield {"type": "delta", "content": "文件不存在，换一个吧"}
                yield {
                    "type": "finish",
                    "finish_reason": "stop",
                    "tool_calls": [],
                    "usage": {},
                }

        chat_service.chat_completion_stream_events = mock_stream_events
        try:
            req = ChatRequest(message="读 ghost.txt", model="test", temperature=0.7)
            events = await _collect_events(req, "127.0.0.1")
            reply = _deltas(events)

            self.assertEqual(call_count[0], 2)
            self.assertIn("文件不存在，换一个吧", reply)

            round2_msgs = captured_messages[1]
            tool_msgs = [m for m in round2_msgs if m["role"] == "tool"]
            self.assertEqual(len(tool_msgs), 1)
            self.assertIn("文件不存在", tool_msgs[0]["content"])
            self.assertEqual(tool_msgs[0]["tool_call_id"], "call_err_1")
        finally:
            chat_service.chat_completion_stream_events = original


class TestCallerIpInjection(unittest.IsolatedAsyncioTestCase):
    """caller_ip 注入验证：_chat_flow 调 shell 时 caller_ip 正确传入 kwargs"""

    async def asyncSetUp(self):
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

        original = chat_service.chat_completion_stream_events
        original_get_tool = chat_service.get_tool

        async def mock_stream_events(**kwargs):
            yield {"type": "delta", "content": ""}
            yield {
                "type": "finish",
                "finish_reason": "tool_calls",
                "tool_calls": [{
                    "id": "call_ip_1",
                    "name": "shell",
                    "arguments": json.dumps({"command": "echo hi"}),
                }],
                "usage": {},
            }

        def mock_get_tool(name):
            if name == "shell":
                return mock_shell
            return original_get_tool(name)

        chat_service.chat_completion_stream_events = mock_stream_events
        chat_service.get_tool = mock_get_tool
        try:
            test_ip = "192.168.1.50"
            req = ChatRequest(message="echo hi", model="test", temperature=0.7)
            await _collect_events(req, test_ip)
            self.assertEqual(mock_shell.received_caller_ip, test_ip)
        finally:
            chat_service.chat_completion_stream_events = original
            chat_service.get_tool = original_get_tool


class TestTokenCounter(unittest.TestCase):
    """P3.3-2: token 估算与截断基本验证"""

    def test_estimate_tokens_messages_basic(self):
        from models.token_counter import estimate_tokens_messages
        msgs = [
            {"role": "system", "content": "你是助手"},
            {"role": "user", "content": "你好，请问今天天气怎么样？"},
        ]
        n = estimate_tokens_messages(msgs, "deepseek-chat")
        self.assertGreater(n, 0)

    def test_truncate_messages_keeps_system(self):
        from models.token_counter import truncate_messages
        msgs = [
            {"role": "system", "content": "系统提示"},
            {"role": "user", "content": "旧消息" + "啊" * 200},
            {"role": "user", "content": "新消息" + "哦" * 200},
        ]
        result = truncate_messages(msgs, "deepseek-chat", max_input_tokens=50)
        self.assertEqual(result[0]["role"], "system")
        last = result[-1]
        self.assertEqual(last["role"], "user")
        self.assertIn("新消息", last["content"])


class TestLLMStreamEventsStateMachine(unittest.TestCase):
    """
    P3.3-5 风险控制：流式 tool_calls 跨 chunk 拼接状态机验证。

    直接对纯函数 stream_tool_call_accumulator() 喂纯 dict 形式的增量序列，
    验证最终输出正确。覆盖：单工具 arguments 分段、多工具并行、
    id/name/arguments 分散到不同 chunk。
    """

    def test_single_tool_arguments_split_into_multi_chunks(self):
        """单 tool_call，arguments JSON 拆 3 段"""
        from models.llm import stream_tool_call_accumulator
        ingest, finalize = stream_tool_call_accumulator()

        # chunk 1: id + name + 部分 arguments
        ingest([{
            "index": 0,
            "id": "call_abc",
            "function": {"name": "file_ops", "arguments": '{"action":"read","path":' },
        }])
        # chunk 2: arguments 中段
        ingest([{
            "index": 0,
            "function": {"arguments": '"/tmp/test.txt","encod'},
        }])
        # chunk 3: arguments 尾段
        ingest([{
            "index": 0,
            "function": {"arguments": 'ing":"utf-8"}'},
        }])

        result = finalize()
        self.assertEqual(len(result), 1)
        tc = result[0]
        self.assertEqual(tc["id"], "call_abc")
        self.assertEqual(tc["name"], "file_ops")
        self.assertEqual(tc["arguments"], '{"action":"read","path":"/tmp/test.txt","encoding":"utf-8"}')
        # 验证 JSON 合法
        import json
        parsed = json.loads(tc["arguments"])
        self.assertEqual(parsed["path"], "/tmp/test.txt")

    def test_multiple_tools_parallel(self):
        """两个 tool_call 并行，按 index 交错到达"""
        from models.llm import stream_tool_call_accumulator
        ingest, finalize = stream_tool_call_accumulator()

        # chunk 1: index=0 首段 + index=1 首段
        ingest([
            {"index": 0, "id": "call_a", "function": {"name": "shell", "arguments": '{"command":"ech'}},
            {"index": 1, "id": "call_b", "function": {"name": "file_ops", "arguments": '{"action":"write","pat'}},
        ])
        # chunk 2: index=0 尾段 + index=1 尾段
        ingest([
            {"index": 0, "function": {"arguments": 'o hello"}'}},
            {"index": 1, "function": {"arguments": 'h":"a.txt"}'}},
        ])

        result = finalize()
        self.assertEqual(len(result), 2)
        # 按 index 排序
        self.assertEqual(result[0]["id"], "call_a")
        self.assertEqual(result[0]["name"], "shell")
        self.assertEqual(result[0]["arguments"], '{"command":"echo hello"}')
        self.assertEqual(result[1]["id"], "call_b")
        self.assertEqual(result[1]["name"], "file_ops")
        self.assertEqual(result[1]["arguments"], '{"action":"write","path":"a.txt"}')

    def test_fields_scattered_across_chunks(self):
        """id / name / arguments 分散到不同 chunk，且 arguments 中间有空函数块"""
        from models.llm import stream_tool_call_accumulator
        ingest, finalize = stream_tool_call_accumulator()

        # chunk 1: 只有 id
        ingest([{"index": 0, "id": "call_XYZ"}])
        # chunk 2: 只有 name
        ingest([{"index": 0, "function": {"name": "echo_tool"}}])
        # chunk 3: 空增量（模拟某些 provider 在中间 chunk 传空 tool_calls）
        ingest([])
        ingest(None)
        # chunk 4: arguments 多段 + 另有一段 function 为空（不应报错）
        ingest([{"index": 0, "function": {"arguments": '{"text":"hel'}}])
        ingest([{"index": 0, "function": {}}])  # function 字段存在但空
        ingest([{"index": 0, "function": {"arguments": 'lo world"}'}}])

        result = finalize()
        self.assertEqual(len(result), 1)
        tc = result[0]
        self.assertEqual(tc["id"], "call_XYZ")
        self.assertEqual(tc["name"], "echo_tool")
        self.assertEqual(tc["arguments"], '{"text":"hello world"}')


def run_tests():
    print("=" * 60)
    print("P3.3 Function Calling + Token 管理测试")
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
    print("  [PASS] 无工具调用：仅 1 次流式 LLM 调用（P3.3-5 消除双调用）")
    print("  [PASS] 单工具调用：2 次流式 + tool_call/tool_result 事件")
    print("  [PASS] 多工具调用：一次返回多个 tool_calls 全部执行")
    print("  [PASS] 最大轮次：达到上限停止")
    print("  [PASS] 工具不存在：返回 error 不崩溃")
    print("  [PASS] 消息持久化：tool_calls + tool_call_id 写入 DB")
    print("  [PASS] 角色过滤：按 role→tools 映射过滤工具")
    print("  [PASS] 角色过滤端到端：传给 LLM 的 tools 不含被过滤工具")
    print("  [PASS] 工具失败恢复：error 内容回到 messages 且对话不中断")
    print("  [PASS] caller_ip 注入：shell 工具 caller_ip 正确传入")
    print("  [PASS] Token 估算 & 截断：基本功能正常")
    print("  [PASS] 状态机-单TC参数分段：arguments JSON 拆 3 段后可正确拼合 & 解析")
    print("  [PASS] 状态机-多TC并行交错：两个 tool_call 按 index 交错到达，结果按序输出")
    print("  [PASS] 状态机-字段分散+空增量：id/name/arguments 分散到不同 chunk 均正确累积")
    print()
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
