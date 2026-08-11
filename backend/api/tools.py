"""
工具管理 API 路由

职责：
- GET /api/tools：列出所有已注册工具及其 schema
- POST /api/tools/execute：手动执行指定工具（调试用）

与其他模块的关系：
- 依赖 tools/registry.py 获取工具列表和执行工具
"""

import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from tools.registry import get_tool, list_tools

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tools", tags=["tools"])


class ToolExecuteRequest(BaseModel):
    """工具执行请求体"""
    name: str
    params: dict = {}


@router.get("")
async def get_tools():
    """
    列出所有已注册工具。

    Returns:
        工具列表，包含名称、描述、参数 schema、是否启用
    """
    tools = list_tools()
    return [
        {
            "name": t.name,
            "description": t.description,
            "parameters": t.parameters,
            "enabled": True,
        }
        for t in tools
    ]


@router.post("/execute")
async def execute_tool(req: ToolExecuteRequest, request: Request):
    """
    手动执行指定工具（调试用）。

    安全限制：
    - ShellTool 自动注入 caller_ip（从 request.client.host 获取）
    """
    tool = get_tool(req.name)
    if tool is None:
        raise HTTPException(status_code=404, detail=f"Tool '{req.name}' not found")

    params = dict(req.params)
    if req.name == "shell":
        params["caller_ip"] = request.client.host if request.client else "unknown"

    logger.info("Manual tool execute: %s params=%s", req.name, list(params.keys()))
    result = await tool.execute(**params)

    return {
        "success": result.success,
        "content": result.content,
        "error": result.error,
    }
