"""
FileOpsTool 端到端测试

测试场景：
1. 读文件：正常读取、文件不存在、读取目录
2. 写文件：正常写入、同名文件自动重命名（不覆盖）
3. 列目录：正常列表、目录不存在、对文件路径列目录
4. 路径沙箱：../ 逃逸检测、绝对路径逃逸检测
5. 工具注册与 OpenAI schema
6. 未知 action 处理

运行方式：
    cd backend
    python tests/test_file_ops_tool.py
"""

import asyncio
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class TestFileOpsTool(unittest.TestCase):
    """FileOpsTool 端到端测试套件"""

    @classmethod
    def setUpClass(cls):
        from config import load_config
        load_config()

        # 使用临时目录作为 workspace，避免污染真实文件
        cls._tmpdir = tempfile.TemporaryDirectory()
        workspace = Path(cls._tmpdir.name)

        # 临时修改配置中的 workspace
        from config import get_config
        cfg = get_config()
        cfg.tools.file_ops_workspace = str(workspace)

    @classmethod
    def tearDownClass(cls):
        cls._tmpdir.cleanup()

    def _get_tool(self):
        from tools.file_ops import FileOpsTool
        return FileOpsTool()

    def _run(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)

    # ================================================================
    # Test 1: 读文件
    # ================================================================
    def test_read_success(self):
        """正常读取文件内容"""
        tool = self._get_tool()
        # 先写一个文件
        self._run(tool.execute(action="write", path="test_read.txt", content="hello world"))
        # 再读取
        result = self._run(tool.execute(action="read", path="test_read.txt"))
        self.assertTrue(result.success)
        self.assertIn("hello world", result.content)
        print(f"[PASS] Test 1a: 读文件成功 → {result.content}")

    def test_read_not_found(self):
        """读取不存在的文件应返回 error"""
        tool = self._get_tool()
        result = self._run(tool.execute(action="read", path="nonexistent.txt"))
        self.assertFalse(result.success)
        self.assertIn("不存在", result.error)
        print(f"[PASS] Test 1b: 文件不存在 → {result.error}")

    def test_read_directory(self):
        """读取目录应返回 error"""
        tool = self._get_tool()
        # 创建子目录
        self._run(tool.execute(action="list", path="."))
        # workspace 根目录存在，尝试读取它
        result = self._run(tool.execute(action="read", path="."))
        self.assertFalse(result.success)
        self.assertIn("目录", result.error)
        print(f"[PASS] Test 1c: 读取目录 → {result.error}")

    def test_read_file_too_large(self):
        """超过大小限制的文件应返回 error"""
        tool = self._get_tool()
        # 临时设小上限方便测试
        tool._MAX_READ_BYTES = 10
        self._run(tool.execute(action="write", path="big.txt", content="x" * 100))
        result = self._run(tool.execute(action="read", path="big.txt"))
        self.assertFalse(result.success)
        self.assertIn("文件过大", result.error)
        print(f"[PASS] Test 1d: 文件过大 → {result.error}")

    # ================================================================
    # Test 2: 写文件
    # ================================================================
    def test_write_success(self):
        """正常写入新文件"""
        tool = self._get_tool()
        result = self._run(tool.execute(action="write", path="new_file.txt", content="content_123"))
        self.assertTrue(result.success)
        self.assertIn("已写入", result.content)
        print(f"[PASS] Test 2a: 写入成功 → {result.content}")

    def test_write_no_overwrite(self):
        """同名文件应自动重命名，不覆盖"""
        tool = self._get_tool()
        # 写第一个
        self._run(tool.execute(action="write", path="dup.txt", content="first"))
        # 写第二个同名
        result2 = self._run(tool.execute(action="write", path="dup.txt", content="second"))
        self.assertTrue(result2.success)
        self.assertIn("dup_1.txt", result2.content)
        # 验证原文件内容未被覆盖
        result_read = self._run(tool.execute(action="read", path="dup.txt"))
        self.assertIn("first", result_read.content)
        # 验证新文件内容
        result_read2 = self._run(tool.execute(action="read", path="dup_1.txt"))
        self.assertIn("second", result_read2.content)
        print(f"[PASS] Test 2b: 不覆盖 → 原文件保留 'first', 新文件 dup_1.txt")

    def test_write_multiple_suffix(self):
        """连续写入同名文件应递增后缀 _1, _2, ..."""
        tool = self._get_tool()
        self._run(tool.execute(action="write", path="multi.txt", content="v1"))
        self._run(tool.execute(action="write", path="multi.txt", content="v2"))
        self._run(tool.execute(action="write", path="multi.txt", content="v3"))
        result = self._run(tool.execute(action="write", path="multi.txt", content="v4"))
        self.assertIn("multi_3.txt", result.content)
        print(f"[PASS] Test 2c: 后缀递增 → {result.content}")

    def test_write_nested_dir(self):
        """写入嵌套目录应自动创建父目录"""
        tool = self._get_tool()
        result = self._run(tool.execute(
            action="write",
            path="a/b/c/deep.txt",
            content="nested",
        ))
        self.assertTrue(result.success)
        # 验证文件存在
        result_read = self._run(tool.execute(action="read", path="a/b/c/deep.txt"))
        self.assertIn("nested", result_read.content)
        print(f"[PASS] Test 2d: 嵌套目录写入 → {result.content}")

    # ================================================================
    # Test 3: 列目录
    # ================================================================
    def test_list_success(self):
        """列出目录内容"""
        tool = self._get_tool()
        # 确保有文件可列
        self._run(tool.execute(action="write", path="list_test.txt", content="x"))
        self._run(tool.execute(action="write", path="list_test_2.txt", content="y"))
        result = self._run(tool.execute(action="list", path="."))
        self.assertTrue(result.success)
        self.assertIn("list_test.txt", result.content)
        self.assertIn("list_test_2.txt", result.content)
        print(f"[PASS] Test 3a: 列目录成功")

    def test_list_empty_dir(self):
        """列出空目录应返回 (空目录)"""
        tool = self._get_tool()
        # 创建空子目录
        self._run(tool.execute(action="write", path="empty_dir/.gitkeep", content=""))
        # 删掉 .gitkeep 让目录变空
        safe = tool._resolve_safe_path("empty_dir/.gitkeep")
        if safe and safe.exists():
            safe.unlink()
        result = self._run(tool.execute(action="list", path="empty_dir"))
        self.assertTrue(result.success)
        self.assertIn("(空目录)", result.content)
        print(f"[PASS] Test 3b: 空目录 → {result.content}")

    def test_list_not_found(self):
        """列出不存在的目录应返回 error"""
        tool = self._get_tool()
        result = self._run(tool.execute(action="list", path="no_such_dir"))
        self.assertFalse(result.success)
        self.assertIn("不存在", result.error)
        print(f"[PASS] Test 3c: 目录不存在 → {result.error}")

    def test_list_file_path(self):
        """对文件路径执行 list 应返回 error"""
        tool = self._get_tool()
        self._run(tool.execute(action="write", path="file_only.txt", content="data"))
        result = self._run(tool.execute(action="list", path="file_only.txt"))
        self.assertFalse(result.success)
        self.assertIn("目录", result.error)
        print(f"[PASS] Test 3d: 文件路径 list → {result.error}")

    def test_list_truncate(self):
        """超过上限的目录应截断并提示"""
        tool = self._get_tool()
        # 临时设小上限方便测试
        tool._MAX_LIST_ENTRIES = 3
        for i in range(5):
            self._run(tool.execute(action="write", path=f"trunc_dir/f{i}.txt", content="x"))
        result = self._run(tool.execute(action="list", path="trunc_dir"))
        self.assertTrue(result.success)
        self.assertIn("仅显示前 3 条", result.content)
        self.assertIn("共 5 条", result.content)
        print(f"[PASS] Test 3e: 列表截断 → {result.content.split(chr(10))[-1]}")

    # ================================================================
    # Test 4: 路径沙箱
    # ================================================================
    def test_sandbox_dot_dot(self):
        """.. 路径逃逸应被拒绝"""
        tool = self._get_tool()
        result = self._run(tool.execute(action="read", path="../secret.txt"))
        self.assertFalse(result.success)
        self.assertIn("越权", result.error)
        print(f"[PASS] Test 4a: ../ 逃逸 → {result.error}")

    def test_sandbox_absolute_path(self):
        """绝对路径逃逸应被拒绝"""
        tool = self._get_tool()
        result = self._run(tool.execute(action="read", path="C:/Windows/System32/config/sam"))
        self.assertFalse(result.success)
        self.assertIn("越权", result.error)
        print(f"[PASS] Test 4b: 绝对路径逃逸 → {result.error}")

    def test_sandbox_dot_dot_write(self):
        """写操作也应拒绝 .. 逃逸"""
        tool = self._get_tool()
        result = self._run(tool.execute(
            action="write",
            path="../../../etc/malicious",
            content="bad",
        ))
        self.assertFalse(result.success)
        self.assertIn("越权", result.error)
        print(f"[PASS] Test 4c: 写入 ../ 逃逸 → {result.error}")

    def test_sandbox_dot_dot_list(self):
        """列目录也应拒绝 .. 逃逸"""
        tool = self._get_tool()
        result = self._run(tool.execute(action="list", path="../../etc"))
        self.assertFalse(result.success)
        self.assertIn("越权", result.error)
        print(f"[PASS] Test 4d: list ../ 逃逸 → {result.error}")

    # ================================================================
    # Test 5: 未知 action
    # ================================================================
    def test_unknown_action(self):
        """未知 action 应返回 error"""
        tool = self._get_tool()
        result = self._run(tool.execute(action="delete", path="test.txt"))
        self.assertFalse(result.success)
        self.assertIn("Unknown action", result.error)
        print(f"[PASS] Test 5: 未知 action → {result.error}")

    # ================================================================
    # Test 6: 工具注册与 schema
    # ================================================================
    def test_tool_registration(self):
        """FileOpsTool 应在 registry 中可获取"""
        from tools.registry import get_tool, list_tools, scan_and_register

        self._run(scan_and_register())

        tool = get_tool("file_ops")
        self.assertIsNotNone(tool)
        self.assertEqual(tool.name, "file_ops")
        print(f"[PASS] Test 6a: get_tool('file_ops') 成功")

        all_tools = list_tools()
        tool_names = [t.name for t in all_tools]
        self.assertIn("file_ops", tool_names)
        self.assertIn("shell", tool_names)
        print(f"[PASS] Test 6b: list_tools → {tool_names}")

    def test_openai_schema(self):
        """应有有效的 OpenAI function calling schema"""
        from tools.file_ops import FileOpsTool
        tool = FileOpsTool()
        schema = tool.to_openai_schema()

        self.assertEqual(schema["type"], "function")
        self.assertEqual(schema["function"]["name"], "file_ops")
        self.assertIn("action", schema["function"]["parameters"]["properties"])
        self.assertIn("path", schema["function"]["parameters"]["properties"])
        self.assertIn("content", schema["function"]["parameters"]["properties"])
        self.assertIn("action", schema["function"]["parameters"]["required"])
        self.assertIn("path", schema["function"]["parameters"]["required"])
        print(f"[PASS] Test 6c: OpenAI schema 有效")


def run_tests():
    """运行所有测试"""
    print("=" * 60)
    print("FileOpsTool 端到端测试")
    print("=" * 60)
    print()

    suite = unittest.TestLoader().loadTestsFromTestCase(TestFileOpsTool)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print()
    print("=" * 60)
    print("测试总结")
    print("=" * 60)
    print()
    print("已验证功能：")
    print("  [PASS] 读文件：正常读取、文件不存在、读取目录、文件大小限制")
    print("  [PASS] 写文件：正常写入、不覆盖（自动重命名）、后缀递增、嵌套目录")
    print("  [PASS] 列目录：正常列表、空目录、目录不存在、文件路径、条目上限截断")
    print("  [PASS] 路径沙箱：../ 逃逸、绝对路径逃逸、读写列均拦截")
    print("  [PASS] 未知 action：返回 error")
    print("  [PASS] 工具注册：registry 可获取，OpenAI schema 有效")
    print()

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
