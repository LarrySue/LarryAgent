"""
Shell 命令执行工具

职责：
- 允许 Agent 执行 Shell 命令
- IP 白名单限制：仅允许来自配置中 shell_allowed_ips 的请求执行
- 超时控制：命令执行超过 30 秒自动终止

安全约束（单人使用，但仍然保留基础防护）：
- 仅允许本地回环地址调用（127.0.0.1 / ::1）
- 命令执行有超时限制
- 禁止执行部分高危命令（rm -rf / 等）

与其他模块的关系：
- 被 tools/registry.py 注册
- 被 api/chat.py 通过 function calling 机制调用
- 依赖 config.py 获取 IP 白名单
"""

import asyncio

from tools.base import BaseTool, ToolResult


class ShellTool(BaseTool):
    name = "shell"
    description = (
        "执行 Shell 命令。支持 Windows (PowerShell) 和 Linux (Bash)。"
        "命令执行超时时间为 30 秒。"
    )
    parameters = {
        "type": "object",
        "properties": {
            "command": {
                "type": "string",
                "description": "要执行的 Shell 命令",
            },
            "working_dir": {
                "type": "string",
                "description": "工作目录（可选）",
            },
        },
        "required": ["command"],
    }

    # 高危命令黑名单
    _blocked_patterns = [
        "rm -rf /",
        "del /f /s C:\\",
        "format",
        "shutdown",
    ]

    async def execute(
        self,
        command: str,
        working_dir: str | None = None,
        **kwargs,
    ) -> ToolResult:
        """
        执行 Shell 命令。

        Args:
            command: Shell 命令字符串
            working_dir: 可选的工作目录
            request_ip: 请求来源 IP（由 API 层注入）

        Returns:
            ToolResult，包含 stdout/stderr
        """
        # TODO: 实现完整的命令执行逻辑
        #   1. IP 白名单校验（从 kwargs 或上下文获取 request_ip）
        #   2. 高危命令检测
        #   3. 使用 asyncio.create_subprocess_shell 执行
        #   4. 30 秒超时控制
        #   5. 捕获 stdout 和 stderr
        #   6. 返回结果

        for pattern in self._blocked_patterns:
            if pattern.lower() in command.lower():
                return ToolResult(
                    success=False,
                    error=f"Blocked command pattern: {pattern}",
                )

        try:
            proc = await asyncio.wait_for(
                asyncio.create_subprocess_shell(
                    command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=working_dir,
                ),
                timeout=30,
            )
            # TODO: 实际执行 -- 当前骨架不执行真实命令
            raise NotImplementedError("Shell execution not yet implemented")
        except asyncio.TimeoutError:
            return ToolResult(success=False, error="Command timed out (30s)")
