"""
P2.6 集成测试：真实 LLM + 工具调用端到端验证

前置条件：
  1. config.yaml 中 deepseek api_key 已配置
  2. ~/larry_workspace/p26_integration_test.txt 已创建（内容含 "42"）

运行：python tests/test_integration_llm.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_config
from services.chat_service import handle_chat, ChatRequest
from tools.registry import scan_and_register
from db.database import get_db, close_db

TEST_FILENAME = "p26_integration_test.txt"


async def test_single_tool_call():
    """测试 1：单工具调用 — LLM 读取已知文件"""
    print("\n[Test 1] 单工具调用：LLM 读取已知文件")
    print("-" * 50)

    try:
        req = ChatRequest(
            message=f"请使用 file_ops 工具读取文件 {TEST_FILENAME} 的内容，然后告诉我文件里写了什么。",
            model="deepseek-chat",
            role="default",
        )
        resp = await handle_chat(req, caller_ip="127.0.0.1")
        print(f"  Reply: {resp.reply[:200]}")

        assert "42" in resp.reply, f"期望 reply 包含 '42'，实际: {resp.reply}"
        print("  [PASS] LLM 成功读取文件并返回内容")
        return True
    except Exception as e:
        print(f"  [FAIL] {e}")
        return False


async def test_multi_tool_serial():
    """测试 2：多工具串行 — 先 list 目录再 read 文件"""
    print("\n[Test 2] 多工具串行：先 list 目录再 read 文件")
    print("-" * 50)

    try:
        req = ChatRequest(
            message=(
                "请先用 file_ops 工具列出当前目录下有哪些文件，"
                f"然后读取 {TEST_FILENAME} 的内容。"
                "请告诉我目录下有哪些文件，以及目标文件的内容。"
            ),
            model="deepseek-chat",
            role="default",
        )
        resp = await handle_chat(req, caller_ip="127.0.0.1")
        print(f"  Reply: {resp.reply[:300]}")

        assert "42" in resp.reply, f"期望 reply 包含 '42'（文件内容），实际: {resp.reply}"
        assert TEST_FILENAME in resp.reply or "test" in resp.reply.lower(), (
            f"期望 reply 包含文件名，实际: {resp.reply}"
        )
        print("  [PASS] LLM 成功完成 list → read 串行调用")
        return True
    except Exception as e:
        print(f"  [FAIL] {e}")
        return False


async def test_api_tools_endpoint():
    """测试 3：API 层 — GET /api/tools + POST /api/tools/execute"""
    print("\n[Test 3] API 层：GET /api/tools + POST /api/tools/execute")
    print("-" * 50)

    try:
        from httpx import AsyncClient, ASGITransport
        from main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # GET /api/tools
            resp = await client.get("/api/tools")
            assert resp.status_code == 200, f"GET /api/tools 状态码: {resp.status_code}"
            data = resp.json()
            tool_names = [t["name"] for t in data]
            print(f"  工具列表: {tool_names}")
            assert "file_ops" in tool_names, f"期望包含 file_ops，实际: {tool_names}"
            assert "shell" in tool_names, f"期望包含 shell，实际: {tool_names}"

            # POST /api/tools/execute — 执行 file_ops.read
            resp = await client.post(
                "/api/tools/execute",
                json={
                    "name": "file_ops",
                    "params": {"action": "read", "path": TEST_FILENAME},
                },
            )
            assert resp.status_code == 200, f"POST /api/tools/execute 状态码: {resp.status_code}"
            result = resp.json()
            print(f"  file_ops.read 结果: {result}")
            assert result["success"] is True, f"期望 success=True，实际: {result}"
            assert "42" in result.get("content", ""), f"期望 content 包含 '42'，实际: {result}"

            print("  [PASS] API 层 GET + POST 均正常")
            return True
    except Exception as e:
        print(f"  [FAIL] {e}")
        return False


async def run_tests():
    print("=" * 60)
    print("P2.6 集成测试：真实 LLM + 工具调用")
    print("=" * 60)

    os.environ.setdefault("LARRY_CONFIG", os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config.yaml"
    ))
    await get_db()
    await scan_and_register()

    # 前置检查
    config = get_config()
    ds_model = config.models.get("deepseek")
    ds_key = ds_model.api_key if ds_model else ""
    if not ds_key or ds_key == "your-api-key-here":
        print("\n[SKIP] DeepSeek API key 未配置，跳过集成测试")
        return False

    results = []
    results.append(await test_single_tool_call())
    results.append(await test_multi_tool_serial())
    results.append(await test_api_tools_endpoint())

    await close_db()

    print("\n" + "=" * 60)
    print("测试汇总")
    print("=" * 60)
    passed = sum(1 for r in results if r)
    total = len(results)
    names = ["单工具调用（真实 LLM）", "多工具串行（真实 LLM）", "API 层 GET + POST"]
    for name, ok in zip(names, results):
        status = "[PASS]" if ok else "[FAIL]"
        print(f"  {status} {name}")
    print(f"\n  {passed}/{total} 通过")
    return all(results)


if __name__ == "__main__":
    success = asyncio.run(run_tests())
    sys.exit(0 if success else 1)
