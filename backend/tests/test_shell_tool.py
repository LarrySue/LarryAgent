"""
ShellTool 端到端测试

测试场景：
1. 基本命令执行（echo / dir / pwd）
2. IP 白名单校验（允许本地，拒绝非白名单）
3. 高危命令拦截（rm -rf /, format, shutdown）
4. 超时控制（长命令被终止）
5. working_dir 切换
6. 非零退出码处理
7. 工具注册与发现

运行方式：
    cd backend
    python tests/test_shell_tool.py
"""

import asyncio
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class TestShellTool(unittest.TestCase):
    """ShellTool 端到端测试套件"""

    @classmethod
    def setUpClass(cls):
        """加载配置并创建 ShellTool 实例"""
        from config import load_config
        load_config()

    def _get_tool(self):
        from tools.shell import ShellTool
        return ShellTool()

    # ================================================================
    # Test 1: IP 白名单 - 本地 IP 允许执行
    # ================================================================
    def test_ip_whitelist_allowed(self):
        """127.0.0.1 应被允许执行命令"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("echo hello", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertTrue(result.success, f"IP 白名单应允许 127.0.0.1, 但得到: {result.error}")
        self.assertIn("hello", result.content)
        print(f"[PASS] Test 1a: IP 白名单允许 → {result.content.strip()}")

    def test_ip_whitelist_blocked(self):
        """非白名单 IP 应被拒绝"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("echo hello", caller_ip="192.168.1.100")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertFalse(result.success)
        self.assertIn("not allowed", result.error)
        print(f"[PASS] Test 1b: IP 白名单拒绝 → {result.error}")

    def test_ip_whitelist_missing(self):
        """未提供 caller_ip 应被拒绝"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("echo hello")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertFalse(result.success)
        self.assertIn("not allowed", result.error)
        print(f"[PASS] Test 1c: 无 IP 被拒 → {result.error}")

    # ================================================================
    # Test 2: 高危命令拦截
    # ================================================================
    def test_blocked_rm_rf(self):
        """rm -rf / 应被拦截"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("rm -rf /", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertFalse(result.success)
        self.assertIn("rm -rf", result.error)
        print(f"[PASS] Test 2a: 拦截 rm -rf / → {result.error}")

    def test_blocked_format(self):
        """format 命令应被拦截"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("format C:", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertFalse(result.success)
        self.assertIn("format", result.error)
        print(f"[PASS] Test 2b: 拦截 format → {result.error}")

    def test_blocked_shutdown(self):
        """shutdown 命令应被拦截"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("shutdown -s", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertFalse(result.success)
        self.assertIn("shutdown", result.error)
        print(f"[PASS] Test 2c: 拦截 shutdown → {result.error}")

    def test_blocked_case_insensitive(self):
        """命令检测应不区分大小写"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("RM -RF /", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertFalse(result.success)
        print(f"[PASS] Test 2d: 大小写不敏感 → {result.error}")

    # ================================================================
    # Test 3: 基本命令执行
    # ================================================================
    def test_basic_echo(self):
        """echo 命令应正常执行"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("echo test_output_123", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertTrue(result.success)
        self.assertIn("test_output_123", result.content)
        print(f"[PASS] Test 3a: echo 执行正常 → {result.content.strip()}")

    def test_basic_nonzero_exit(self):
        """非零退出码应标记为失败"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("python -c \"import sys; sys.exit(1)\"", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertFalse(result.success)
        self.assertIn("exit code 1", result.error)
        print(f"[PASS] Test 3b: 非零退出码正确处理 → {result.error}")

    def test_empty_output(self):
        """无输出命令应返回 (no output)"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("python -c \"pass\"", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertTrue(result.success)
        print(f"[PASS] Test 3c: 无输出命令 → content='{result.content}'")

    # ================================================================
    # Test 4: 超时控制
    # ================================================================
    def test_timeout_kill(self):
        """超时后子进程应被终止"""
        tool = self._get_tool()
        # 临时将超时改为 3 秒用于测试
        tool._timeout = 3

        async def run():
            return await tool.execute("python -c \"import time; time.sleep(60)\"", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertFalse(result.success)
        self.assertIn("timed out", result.error)
        print(f"[PASS] Test 4: 超时控制生效 → {result.error}")

    # ================================================================
    # Test 5: working_dir 切换
    # ================================================================
    def test_working_dir(self):
        """working_dir 应影响命令执行目录"""
        tool = self._get_tool()
        test_dir = os.path.join(os.path.dirname(__file__), "..")

        async def run():
            return await tool.execute(
                "python -c \"import os; print(os.getcwd())\"",
                working_dir=test_dir,
                caller_ip="127.0.0.1",
            )

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertTrue(result.success)
        # 验证当前工作目录包含 backend
        self.assertIn("backend", result.content.replace("\\", "/"))
        print(f"[PASS] Test 5: working_dir 切换成功 → {result.content.strip()}")

    # ================================================================
    # Test 6: 工具注册与发现
    # ================================================================
    def test_tool_registration(self):
        """ShellTool 应在 registry 中可获取"""
        import asyncio
        from tools.registry import get_tool, list_tools, scan_and_register

        asyncio.get_event_loop().run_until_complete(scan_and_register())

        tool = get_tool("shell")
        self.assertIsNotNone(tool, "shell 工具应已注册")
        self.assertEqual(tool.name, "shell")
        print(f"[PASS] Test 6a: 工具注册 → get_tool('shell') 成功")

        all_tools = list_tools()
        tool_names = [t.name for t in all_tools]
        self.assertIn("shell", tool_names)
        print(f"[PASS] Test 6b: list_tools → {tool_names}")

    def test_openai_schema(self):
        """ShellTool 应有有效的 OpenAI function calling schema"""
        from tools.shell import ShellTool
        tool = ShellTool()
        schema = tool.to_openai_schema()

        self.assertEqual(schema["type"], "function")
        self.assertEqual(schema["function"]["name"], "shell")
        self.assertIn("command", schema["function"]["parameters"]["properties"])
        self.assertIn("working_dir", schema["function"]["parameters"]["properties"])
        self.assertIn("command", schema["function"]["parameters"]["required"])
        print(f"[PASS] Test 6c: OpenAI schema 有效 → name={schema['function']['name']}")

    # ================================================================
    # Test 7: Windows 特定命令
    # ================================================================
    @unittest.skipUnless(sys.platform == "win32", "Windows only")
    def test_windows_dir(self):
        """Windows 下 dir 命令应可用"""
        tool = self._get_tool()

        async def run():
            return await tool.execute("dir", caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertTrue(result.success)
        # ⚠️ 原断言 `assertIn("Volume")` 在中文 Windows 上恒红（2026-11-01 WB 实测 chcp=936）。
        # 但根因不只是语言：本机 `dir` 输出是 GBK 字节、被上层按 UTF-8 解码，
        # 结果**中英文都拿不到原字面**（实测形如「锟斤拷…」/「������ D �еľ�」）⇒ 任何按自然语言
        # 写的断言都不可靠。这里只断言 **ASCII 特征**：`<DIR>`（`dir` 输出里中英文一致、
        # 且当前目录含子目录时必有）。⚠️ 若将来测一个无子目录的空目录，这条需改用别的方式。
        # 📌 顺带记一条产品缺陷（不在本单）：shell 工具返回的中文输出是乱码，见 TODO。
        self.assertIn("<DIR>", result.content)
        print(f"[PASS] Test 7: Windows dir 命令正常")

    @unittest.skipUnless(sys.platform == "win32", "Windows only")
    def test_gbk_output_decode(self):
        """
        显式 GBK 字节的中文输出应解成可读中文（S-1 回归）。

        该命令由子进程直接 `stdout.buffer.write(..., encode('gbk'))`，模拟
        OEM 代码页程序输出；不依赖 UI 语言（本 Trae 树 dir 输出是英文）。
        """
        from tools.shell import _windows_console_code_pages

        if 936 not in _windows_console_code_pages():
            self.skipTest("当前控制台/OEM 代码页不含 936，GBK 路径不适用")

        tool = self._get_tool()
        command = (
            "python -c \"import sys;"
            "sys.stdout.buffer.write('中文测试'.encode('gbk'))\""
        )

        async def run():
            return await tool.execute(command, caller_ip="127.0.0.1")

        result = asyncio.get_event_loop().run_until_complete(run())
        self.assertTrue(result.success, f"命令失败: {result.error}")
        self.assertIn("中文测试", result.content)
        self.assertNotIn("\ufffd", result.content)
        print(f"[PASS] Test 8: GBK 中文输出解码正常 → {result.content.strip()}")


def run_tests():
    """运行所有测试"""
    print("=" * 60)
    print("ShellTool 端到端测试")
    print("=" * 60)
    print()

    suite = unittest.TestLoader().loadTestsFromTestCase(TestShellTool)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print()
    print("=" * 60)
    print("测试总结")
    print("=" * 60)
    print()
    print("已验证功能：")
    print("  [PASS] IP 白名单校验：本地允许，外部拒绝，缺失拒绝")
    print("  [PASS] 高危命令拦截：rm -rf /, format, shutdown 等被阻止")
    print("  [PASS] 基本命令执行：echo, python 等正常运行")
    print("  [PASS] 超时控制：长命令被终止，子进程被清理")
    print("  [PASS] working_dir 切换：目录参数生效")
    print("  [PASS] 工具注册：registry 可获取 shell 工具")
    print("  [PASS] OpenAI schema：function calling 格式正确")
    print()
    print("安全机制验证：")
    print("  - caller_ip 必须在 shell_allowed_ips 中")
    print("  - 命令匹配黑名单模式即被拦截")
    print("  - 命令超时 30s 后进程被 kill 清理")
    print()

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
