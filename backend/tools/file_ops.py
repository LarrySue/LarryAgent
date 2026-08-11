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
- 读取文件限制 100KB，防止大文件撑爆 LLM 上下文
- 列目录限制 1000 条，超出截断

与其他模块的关系：
- 被 tools/registry.py 注册
- 被 api/chat.py 通过 function calling 机制调用
"""

import logging
from pathlib import Path

from config import get_config
from tools.base import BaseTool, ToolResult

logger = logging.getLogger(__name__)


class FileOpsTool(BaseTool):
    name = "file_ops"
    description = (
        "文件读写操作工具。支持三种操作："
        "read（读取文件内容，限制 100KB）、write（写入新文件）、"
        "list（列出目录内容，限制 1000 条）。"
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

    _MAX_READ_BYTES = 100 * 1024  # 100KB
    _MAX_LIST_ENTRIES = 1000

    def __init__(self):
        workspace = get_config().tools.file_ops_workspace
        self._workspace_root = Path(workspace).expanduser().resolve()
        self._workspace_root.mkdir(parents=True, exist_ok=True)
        logger.info("FileOpsTool workspace: %s", self._workspace_root)

    def _resolve_safe_path(self, path: str) -> Path | None:
        """
        将用户输入的路径解析为 workspace 内的安全绝对路径。

        返回 None 表示路径不安全（逃逸出 workspace）。
        """
        target = (self._workspace_root / path).resolve()
        try:
            target.relative_to(self._workspace_root)
        except ValueError:
            return None
        return target

    async def execute(self, **kwargs) -> ToolResult:
        action = kwargs.get("action")
        path = kwargs.get("path", "")
        content = kwargs.get("content", "")

        if action == "read":
            return await self._read(path)
        elif action == "write":
            return await self._write(path, content)
        elif action == "list":
            return await self._list(path)
        else:
            return ToolResult(success=False, error=f"Unknown action: {action}")

    async def _read(self, path: str) -> ToolResult:
        """读取文件内容，限制 100KB。"""
        safe_path = self._resolve_safe_path(path)
        if safe_path is None:
            return ToolResult(success=False, error=f"路径越权: {path}")

        if not safe_path.exists():
            return ToolResult(success=False, error=f"文件不存在: {path}")
        if safe_path.is_dir():
            return ToolResult(success=False, error=f"路径是目录而非文件: {path}")

        file_size = safe_path.stat().st_size
        if file_size > self._MAX_READ_BYTES:
            return ToolResult(
                success=False,
                error=f"文件过大: {file_size} bytes (上限 {self._MAX_READ_BYTES} bytes)",
            )

        try:
            content = safe_path.read_text(encoding="utf-8")
            return ToolResult(success=True, content=content)
        except Exception as e:
            return ToolResult(success=False, error=f"读取失败: {e}")

    async def _write(self, path: str, content: str) -> ToolResult:
        """写入文件，不覆盖已有文件。"""
        safe_path = self._resolve_safe_path(path)
        if safe_path is None:
            return ToolResult(success=False, error=f"路径越权: {path}")

        safe_path.parent.mkdir(parents=True, exist_ok=True)

        # 文件已存在则追加后缀 _1 / _2 ...
        if safe_path.exists():
            stem = safe_path.stem
            suffix = safe_path.suffix
            counter = 1
            while True:
                new_name = f"{stem}_{counter}{suffix}"
                new_path = safe_path.parent / new_name
                if not new_path.exists():
                    safe_path = new_path
                    break
                counter += 1

        try:
            safe_path.write_text(content, encoding="utf-8")
            rel = safe_path.relative_to(self._workspace_root)
            return ToolResult(success=True, content=f"已写入: {rel}")
        except Exception as e:
            return ToolResult(success=False, error=f"写入失败: {e}")

    async def _list(self, path: str) -> ToolResult:
        """列出目录内容。"""
        # path 为空时列出 workspace 根目录
        safe_path = self._resolve_safe_path(path or ".")
        if safe_path is None:
            return ToolResult(success=False, error=f"路径越权: {path}")

        if not safe_path.exists():
            return ToolResult(success=False, error=f"目录不存在: {path}")
        if safe_path.is_file():
            return ToolResult(success=False, error=f"路径是文件而非目录: {path}")

        try:
            entries = sorted(safe_path.iterdir(), key=lambda p: (not p.is_dir(), p.name))
            total = len(entries)
            truncated = total > self._MAX_LIST_ENTRIES
            if truncated:
                entries = entries[: self._MAX_LIST_ENTRIES]
            lines = []
            for entry in entries:
                prefix = "[D] " if entry.is_dir() else "[F] "
                lines.append(f"{prefix}{entry.name}")
            result = "\n".join(lines) if lines else "(空目录)"
            if truncated:
                result += f"\n(共 {total} 条，仅显示前 {self._MAX_LIST_ENTRIES} 条)"
            return ToolResult(success=True, content=result)
        except Exception as e:
            return ToolResult(success=False, error=f"列目录失败: {e}")
