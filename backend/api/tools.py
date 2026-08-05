"""
工具管理 API 路由

职责：
- GET /api/tools：列出所有已注册工具及其 schema
- POST /api/tools/execute：手动执行指定工具（调试用）

与其他模块的关系：
- 依赖 tools/registry.py 获取工具列表和执行工具
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/tools", tags=["tools"])


class ToolExecuteRequest(BaseModel):
    """工具执行请求体"""
    name: str
    params: dict = {}


@router.get("")
async def list_tools():
    """
    列出所有已注册工具。

    Returns:
        工具列表，包含名称、描述、参数 schema、是否启用
    """
    # TODO: 从 tools/registry.py 获取工具列表
    #   返回 list_tools() 的序列化结果
    raise HTTPException(status_code=501, detail="Tools list not yet implemented")


@router.post("/execute")
async def execute_tool(req: ToolExecuteRequest):
    """
    手动执行指定工具（调试用）。

    安全限制：
    - Shell 工具仍需通过 IP 白名单检查
    - 从请求上下文获取客户端 IP
    """
    # TODO: 从 registry 获取工具 → 调用 tool.execute(**req.params)
    raise HTTPException(status_code=501, detail="Tool execute not yet implemented")
