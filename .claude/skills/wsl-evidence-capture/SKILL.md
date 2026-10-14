---
name: wsl-evidence-capture
description: 宿主 MSYS/bash 通道经 wsl.exe 取证 —— 固定范式、退出码/UTF-16/CR 三坑、长任务与长输出、残留清理；环境事实与判定边界以 docs/test-env.md 为准
---

# WSL 取证（宿主 bash / MSYS 通道）

## 触发条件

- 要在 WSL（Linux 侧）跑命令 / 测试 / 取证，且走本通道（宿主 bash 调 `wsl.exe`）
- 要跨通道取退出码、读回长输出、跑长任务、清残留

## 怎么做

- **范式**：`MSYS_NO_PATHCONV=1 wsl.exe -d Ubuntu-24.04 -- bash -s <<'EOF' … EOF`
  - 脚本**首行** `exec 2>&1`（stdout/stderr 混流会损坏输出）
  - 脚本内**显式 `cd`** 到自建目录（cwd 继承 + 路径改写曾把产物落进仓库根）
  - 工作副本一律放 ext4（`~/…`），⛔ 不放 `/mnt/*`（9P 下 POSIX 锁与 inotify 语义失效 ⇒ 结论作废）
- **退出码**：取 `wsl.exe` 自身的返回码（外层 `$?`）—— 内层 `echo $?` 实测不可信（曾把真值 1 / 3 都报成 0）；换新口径先用对照实验钉死（如内层 `exit 7` 应得外层 7）
- **长输出**：落文件，再用 `\\wsl.localhost\Ubuntu-24.04\home\<user>\…` 从 Windows 侧读回
- **长任务**：`setsid nohup <cmd> > <log> 2>&1 &` 后复入轮询；⛔ 别 `wsl --terminate`（清掉全部后台长任务）；可抛弃重建用 `wsl --unregister`
- **收尾**：清掉本轮自建 `/tmp` 残留并复核计数 = 0；核 `git status` 确认无产物落进仓库

## 已知坑

1. **UTF-16 警告污染**：`wsl.exe` 每次混入 UTF-16 编码的 localhost 代理警告 ⇒ `grep` 报 `Binary file … matches`、`tr -d '\r'` 清不掉。口径：先 `tr -d '\000'`（或 python 侧 `replace(b'\x00', b'')`），否则取证文件看起来「空」。
2. **CR 静默剥离**：跨行文本比对走 shell 管道时行尾 CR 会被静默吃掉 ⇒ 比对失真；跨行比对用文件直读 / 二进制安全方式（py 读 bytes）。
3. **MSYS 路径改写**：不设 `MSYS_NO_PATHCONV=1` 时，`… -- ls /home` 会被改写成 `ls D:/App/Git/home`。
4. **判读 / 安全边界以文档为准**：环境事实、landlock ABI 判定边界、沙箱写入边界一律先读 `docs/test-env.md` 对应节（§5 / §8.4），别凭记忆。
