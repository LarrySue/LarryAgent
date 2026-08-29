"""
P2.6 集成测试：真实 LLM + 工具调用端到端验证（2026-08-30 恢复改造）

前置条件：
  1. config.yaml 中 deepseek api_key 已配置（未配置 → skip）
  2. ~/larry_workspace/p26_integration_test.txt 已创建（内容含 "42"）

运行方式（2026-08-30 分层定案）：
  - 默认跳过（@pytest.mark.integration，conftest 按 --real-api 开关过滤）
  - 显式运行：python -m pytest tests/test_integration_llm.py --real-api -v
  - 该层定位为"契约哨兵"：真实 API 不稳定属外部因素，跑挂不阻塞交付

去假绿说明（2026-08-30）：原脚本式 try/except + return True/False 导致
pytest 无法判失败（假绿）。已改为 assert 直抛 + pytest.skip（key 缺失时）。
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_config
from services.chat_service import handle_chat, ChatRequest
from tools.registry import scan_and_register

TEST_FILENAME = "p26_integration_test.txt"


def _require_deepseek_key():
    """key 未配置 → skip（无 key 环境集成测试不红）。"""
    config = get_config()
    ds_model = config.models.get("deepseek")
    ds_key = ds_model.api_key if ds_model else ""
    if not ds_key or ds_key == "your-api-key-here":
        pytest.skip("DeepSeek API key 未配置，跳过集成测试")


@pytest.fixture(scope="module", autouse=True)
def _integration_setup():
    """集成测试模块级准备：注册工具（DB 由 conftest 临时库隔离）。"""
    import asyncio

    asyncio.run(scan_and_register())


@pytest.mark.integration
@pytest.mark.asyncio
async def test_single_tool_call():
    """测试 1：单工具调用 — LLM 读取已知文件（真实 DeepSeek）。"""
    _require_deepseek_key()
    req = ChatRequest(
        message=f"请使用 file_ops 工具读取文件 {TEST_FILENAME} 的内容，然后告诉我文件里写了什么。",
        model="deepseek-chat",
        role="default",
    )
    resp = await handle_chat(req, caller_ip="127.0.0.1")
    assert "42" in resp.reply, f"期望 reply 包含 '42'，实际: {resp.reply}"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_multi_tool_serial():
    """测试 2：多工具串行 — 先 list 目录再 read 文件（真实 DeepSeek）。"""
    _require_deepseek_key()
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
    assert "42" in resp.reply, f"期望 reply 包含 '42'（文件内容），实际: {resp.reply}"
    assert TEST_FILENAME in resp.reply or "test" in resp.reply.lower(), (
        f"期望 reply 包含文件名，实际: {resp.reply}"
    )


@pytest.mark.integration
@pytest.mark.asyncio
async def test_api_tools_endpoint():
    """测试 3：API 层 — GET /api/tools + POST /api/tools/execute。"""
    from httpx import AsyncClient, ASGITransport
    from main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/tools
        resp = await client.get("/api/tools")
        assert resp.status_code == 200, f"GET /api/tools 状态码: {resp.status_code}"
        data = resp.json()
        tool_names = [t["name"] for t in data]
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
        assert result["success"] is True, f"期望 success=True，实际: {result}"
        assert "42" in result.get("content", ""), f"期望 content 包含 '42'，实际: {result}"
