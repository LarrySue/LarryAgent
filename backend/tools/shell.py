"""
Shell 命令执行工具

职责：
- 允许 Agent 执行 Shell 命令
- IP 白名单限制：仅允许来自配置中 shell_allowed_ips 的请求执行
- 超时控制：命令执行超过 shell_timeout（默认 30 秒）自动终止；**杀进程范围分平台**——
  Windows 走 taskkill /T /F 杀整棵进程树；POSIX 仅 proc.kill() 杀 /bin/sh 包装进程
  （create_subprocess_shell 未设 start_new_session ⇒ 孙进程可能存活），**不承诺 POSIX 侧清理子进程**

安全约束（单人使用；⚠️ 以下是**弱防护**，请勿当安全边界读）：
- 仅允许本地回环地址调用（127.0.0.1 / ::1）
  ⚠️ Agent 自身经 HTTP 打本机 ⇒ caller_ip 恒在白名单内：这道闸约束的是**外部调用者**，不约束 Agent
- 命令执行有超时限制
- 部分高危命令按**子串包含**匹配拦截（_blocked_patterns 为硬编码类常量，**不可 config 调**）：
  ⛔ 可绕过（如 `rm -fr /`、`rd /s /q C:\`、`poweroff`、`systemctl reboot` 均不命中），
  且会误杀含 `--format` / `-Format` 的正常命令（如 `docker ps --format`、`rm -rf /tmp/…` 亦被拦）；
  加固去向见 `HUMAN_NOTE.md`「本地能力下沉」条（老大 2026-09-03 裁：随下沉一并做，**勿单开加固**）。
  ⚠️ 本壳实测为 cmd.exe（Windows）／/bin/sh（POSIX），**非 PowerShell／bash**——见 description 处待裁事项

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
    # ⚠️ **待裁事项（2026-10-13 核证；本串是发给 LLM 的提示文本，未得裁定前请勿顺手改）**：
    # ① 实测本壳为 cmd.exe（Windows）／ /bin/sh（POSIX），**并非**串中所称 PowerShell／bash
    #    （Windows 侧读数 COMSPEC=C:\WINDOWS\system32\cmd.exe、OS=Windows_NT；黑名单里
    #    `del /f /s C:\` 用 cmd 语法，也反证实现从未走 PowerShell）；
    # ② 串里的"30 秒"实为 config 值 tools.shell_timeout（默认 30），改配置该串不随之变化。
    # 处置二选一由老大定：改**声明**（表述）／改**实现**去真支持 PowerShell（代码行为）。
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
