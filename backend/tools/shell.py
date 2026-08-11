"""
Shell 命令执行工具

职责：
- 允许 Agent 执行 Shell 命令
- IP 白名单限制：仅允许来自配置中 shell_allowed_ips 的请求执行
- 超时控制：命令执行超过 30 秒自动终止并清理子进程

安全约束（单人使用，但仍然保留基础防护）：
- 仅允许本地回环地址调用（127.0.0.1 / ::1）
- 命令执行有超时限制
- 禁止执行部分高危命令（rm -rf / 等）

与其他模块的关系：
- 被 tools/registry.py 注册
- 被 api/chat.py 通过 function calling 机制调用
- 依赖 config.py 获取 IP 白名单和超时配置
"""

import asyncio
import logging
import sys

from config import get_config
from tools.base import BaseTool, ToolResult

logger = logging.getLogger(__name__)


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

    _blocked_patterns = [
        "rm -rf /",
        "del /f /s C:\\",
        "format",
        "shutdown",
    ]

    def __init__(self):
        config = get_config()
        self._allowed_ips = config.tools.shell_allowed_ips
        self._timeout = getattr(config.tools, "shell_timeout", 30)

    def _check_ip(self, caller_ip: str | None) -> bool:
        """检查请求来源 IP 是否在白名单内。"""
        if not caller_ip:
            logger.warning("ShellTool: no caller_ip provided, denied")
            return False
        return caller_ip in self._allowed_ips

    def _check_blocked(self, command: str) -> str | None:
        """检查命令是否包含高危模式，返回被阻止的模式名或 None。"""
        lower = command.lower()
        for pattern in self._blocked_patterns:
            if pattern.lower() in lower:
                return pattern
        return None

    async def _kill_process(self, proc: asyncio.subprocess.Process):
        """杀进程：Windows 用 taskkill /T 杀进程树，其他平台用 proc.kill()。"""
        if proc.returncode is not None:
            return
        if sys.platform == "win32":
            try:
                proc_killer = await asyncio.create_subprocess_exec(
                    "taskkill", "/T", "/F", "/PID", str(proc.pid),
                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.DEVNULL,
                )
                await proc_killer.wait()
            except Exception:
                proc.kill()
        else:
            proc.kill()
        await proc.wait()

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
            caller_ip: 请求来源 IP（由 API 层注入，用于白名单校验）

        Returns:
            ToolResult，包含 stdout/stderr
        """
        # 1. IP 白名单校验
        caller_ip = kwargs.get("caller_ip")
        if not self._check_ip(caller_ip):
            logger.warning("Shell blocked: IP %s not in allowlist", caller_ip)
            return ToolResult(
                success=False,
                error=f"IP {caller_ip} not allowed to execute shell commands",
            )

        # 2. 高危命令检测
        blocked = self._check_blocked(command)
        if blocked:
            logger.warning("Shell blocked: pattern '%s' in command", blocked)
            return ToolResult(
                success=False,
                error=f"Blocked command pattern: {blocked}",
            )

        # 3. 执行命令
        logger.info("Shell exec: %s (cwd=%s, timeout=%ds)", command, working_dir, self._timeout)
        proc = None
        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=working_dir,
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=self._timeout,
            )
            stdout_text = stdout.decode("utf-8", errors="replace")
            stderr_text = stderr.decode("utf-8", errors="replace")

            if proc.returncode == 0:
                return ToolResult(
                    success=True,
                    content=stdout_text or "(no output)",
                )
            else:
                msg = f"exit code {proc.returncode}"
                if stderr_text:
                    msg += f": {stderr_text}"
                return ToolResult(
                    success=False,
                    error=msg,
                    content=stdout_text,
                )

        except asyncio.TimeoutError:
            # 超时：杀进程树防止僵尸/孙进程残留
            if proc:
                await self._kill_process(proc)
            logger.warning("Shell timed out: %s", command)
            return ToolResult(
                success=False,
                error=f"Command timed out ({self._timeout}s)",
            )
        except Exception as e:
            logger.error("Shell error: %s", e)
            return ToolResult(
                success=False,
                error=f"Execution failed: {e}",
            )
