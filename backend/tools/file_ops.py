"""
文件操作工具

职责：
- 提供文件读写能力给 Agent 调用
- 限定操作范围在指定工作目录内，防止越权访问
- 支持读文件、写文件、列目录三种操作

安全约束：
- 所有路径操作限制在配置的工作目录内
- 不允许通过 ../ 跳出工作目录
- 写操作不覆盖已有文件（自动重命名）

与其他模块的关系：
- 被 tools/registry.py 注册
- 被 api/chat.py 通过 function calling 机制调用
"""

import os
from pathlib import Path

from tools.base import BaseTool, ToolResult


class FileOpsTool(BaseTool):
    name = "file_ops"
    description = (
        "文件读写操作工具。支持三种操作："
        "read（读取文件内容）、write（写入新文件）、"
        "list（列出目录内容）。"
    )
    parameters = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["read", "write", "list"],
                "description": "操作类型",
            },
            "path": {
                "type": "string",
                "description": "文件或目录路径（相对于工作目录）",
            },
            "content": {
                "type": "string",
                "description": "写入内容（action=write 时必填）",
            },
        },
        "required": ["action", "path"],
    }

    # TODO: 从配置文件读取工作目录范围
    _workspace_root = Path.home() / "scratch_workspace"

    async def execute(self, **kwargs) -> ToolResult:
        action = kwargs.get("action")
        path = kwargs.get("path", "")
        content = kwargs.get("content", "")

        # TODO: 实现路径安全检查
        #   - 解析绝对路径
        #   - 确保路径在 _workspace_root 内
        #   - 拒绝 ../ 跳出尝试

        if action == "read":
            return await self._read(path)
        elif action == "write":
            return await self._write(path, content)
        elif action == "list":
            return await self._list(path)
        else:
            return ToolResult(success=False, error=f"Unknown action: {action}")

    async def _read(self, path: str) -> ToolResult:
        """读取文件内容。"""
        # TODO: 实现文件读取
        raise NotImplementedError("File read not yet implemented")

    async def _write(self, path: str, content: str) -> ToolResult:
        """写入文件，不覆盖已有文件。"""
        # TODO: 实现文件写入
        raise NotImplementedError("File write not yet implemented")

    async def _list(self, path: str) -> ToolResult:
        """列出目录内容。"""
        # TODO: 实现目录列表
        raise NotImplementedError("Directory listing not yet implemented")
