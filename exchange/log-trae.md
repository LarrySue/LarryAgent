# Trae 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

--- 干净、无事

## Trae 的 CVM 执行说明（2026-09-14 · 全部实测）

> 老大指派："你现在就自己核查 CVM 这块，主机信息在 docs 里。" 本说明 = **我这条通道（Windows PowerShell + Windows OpenSSH）的 CVM 能力核查**，供 DSH-3.0 / 3.2 派发时使用。
> ⚠️ **三通道结论不可互推**（我与 Claude / WB 的工具形态不同，坑也不同 —— 见 §三）。主机信息取自 `docs/production-env.md` §1。

### 一、通道

| 项 | 值 |
|---|---|
| 入口 | `ssh -i ~/.ssh/id_ed25519_cvm -o BatchMode=yes ubuntu@49.232.129.252` |
| 我方 ssh | **OpenSSH_for_Windows_9.5p2**（LibreSSL 3.8.2） |
| 私钥 | ✅ 可读 —— **我的沙箱没有拦 `~/.ssh`**（与 WB 的"`~/.ssh` 读被拒"不同） |
| 首连耗时 | **0.94 s**（后续命令同量级） |
| 远端 | `VM-0-16-ubuntu` / `uid=1000(ubuntu)`，在 `sudo` 组 / 内核 `6.8.0-124-generic` / 时区 +08:00 |
| TTY | **无**（`tty0=NO`）⇒ 交互式程序不可用 |
| 退出码 | ✅ 透传（`exit 7` → 7） |

### 二、已验证能力（逐条实测）

| # | 能力 | 结果 |
|---|---|---|
| 1 | 非交互执行 | ✅ |
| 2 | **PATH 前置后工具可用** | ✅ `export PATH=$HOME/node/bin:$PATH` → `node v22.22.2`；`~/harness/node_modules/.bin/dsh --version` → **`0.1.2-rc.1`**（与锁定基线一致） |
| 3 | 裸跑 `node`/`dsh` | ❌ 双双 `NOT_FOUND`（PATH 坑复现，与文档一致） |
| 4 | **后台范式** `setsid nohup` + 完成标记 + `rc` 落文件 | ✅ 启动 `14:45:44` → `done=14:46:04`（**精确 20 s**）、`rc=0`；**跨 ssh 退出存活**（复入 pid 不变） |
| 5 | **前台长任务** | ✅ ssh 内 `sleep 25` → 本地墙钟 **25.7 s**、exit 0 |
| 6 | **我的工具「非阻塞 + 轮询」跑 ssh 长任务** | ✅ `NB_START 14:47:33` → `NB_DONE 14:48:03`（**精确 30 s**）—— ⚠️ **WB 那边此路被拦，我这边可用** |
| 7 | 传输：**base64 双向** | ✅ 本地 md5 `d0546bfb…` = 远端落盘 = 回读，59 字节；含中文 / `①②③`，**UTF-8 完整** |
| 8 | 传输：**scp** | ✅ exit 0，远端 md5 与本地一致；**不需要 `MSYS_NO_PATHCONV`**（那是 Claude 的 Bash/MSYS 坑，我这条没有） |
| 9 | 采数点 | ✅ `cgroup2fs`；slice 层四项可读（见 §四） |

### 三、⚠️ 我这条通道**独有**的坑：内联引号 / `$VAR` / 反引号会被本地吃掉

实测同一轮内复现 **5 次**，每次表现形式不同、极易误判成"远端环境有问题"：

| 我写的 | 远端实际收到 | 报错 |
|---|---|---|
| `bash -c "sleep 20; …"` | `sleep`（参数没了） | `sleep: missing operand` |
| `tr "\n" " "` | `tr "n" " "`（反斜杠没了） | `tr: missing operand after 'n'` |
| `echo "(done 未出现…)"` | `echo (done …)`（引号没了） | bash 语法错 |
| `pgrep -f "sleep 20"` | 引号被剥 | `pgrep: only one pattern can be provided` |
| `cut -d" "` | 引号被剥 | `cut: the delimiter must be a single character` |

⇒ **铁律：凡含引号 / `$` / 反引号 / 嵌套的逻辑，一律走 base64 载体**（与我在 WSL 上定的范式同一条）：

```powershell
$s = @' …bash 脚本… '@            # 脚本首行 exec 2>&1
$s = $s -replace "`r",""          # 去 CR
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($s))
ssh -i $K -o BatchMode=yes $H "echo $b64 | base64 -d > /tmp/x.sh; bash /tmp/x.sh"
```
（简单单行命令可用 `ssh '<cmd>'` 直写；**复杂的一律 base64**。）

### 四、CVM 现状（**只读观测，我没有改动机器任何状态**）

- **采数点（免轮询即可回答"是否吃紧过"）**：
  - `memory.current = 483676160`（≈461 MB）
  - `memory.peak = 1294446592`（≈1234 MB，**开机至今高水位**）
  - `memory.events = low 0 high 0 max 0 oom 0 oom_kill 0 oom_group_kill 0`（⭐ **OOM 权威计数**）
  - `memory.pressure = some … total=614 / full … total=594`（微秒；开机至今基本无停顿）
- **第三方进程 / 会话（都不是我的，我没动）**：
  - `who` → `ubuntu pts/0 2026-09-14 14:01 (42.89.102.244)` —— ⚠️ **源 IP 在我这边是回显的**，与 Claude 记的"源 IP 不回显"不一致 ⇒ **并列记录，不判谁对**（可能只是调用姿势差异）
  - `ps` → **PID 21399 `node`，ELAPSED=405574 s（≈4.7 天），RSS=176632 KB（≈172.5 MB）** —— 与 Claude 记的 172 MB 一致（**近 5 天零漂移**，是一条免费的长驻实测）
  - ⇒ **该机非单租户**：凡"前后对照"类实验须在单租户窗口内做，否则证据自动降级（同附 A-2 第 8 条）

### 五、我方范式（可直接抄）

1. **一律 base64 载体**（§三）
2. **PATH 写死**：`export PATH=$HOME/node/bin:$PATH`
3. 长任务：`setsid nohup <cmd> >log 2>&1 </dev/null &` + **完成标记 + `echo $? > rc`**；复入时**先看标记/rc，再看日志**
4. 我方工具侧：**非阻塞 + `CheckCommandStatus` 轮询**（已验证 30 s 级；更长的未测）
5. 传输：小文件走 base64（与命令同一条路）；大文件走 scp（内容已 md5 校验）

### 六、边界（我没做 / 不做的）

- ⬛ **未跑 `dsh` boot**（`--help` / `--dump-config` 一个都没跑）：避免干扰机上那条 4.7 天长驻进程与第三方会话；3.0 需要时再跑
- ⬛ **未核 CVM 的 `bwrap` 存在性**（即我附 B 里给 3.5 提的那条前置）—— 留给 3.5
- ⬛ 未测**长于 30 s** 的非阻塞任务、未测**多路并发 ssh**
- ❌ **未改机器任何配置**；未停/未重启任何进程；未读任何凭据文件
- ✅ **清理**：远端 `/tmp/trae-*` 已复查 `NO_LEFTOVER`；本地 `%TEMP%\trae-*` 已删

### 七、对 DSH-3 的直接影响

1. **附 B §四（"通道核查应各执行人各做一次"）我这边已完成** ⇒ **3.2 的"前置 1"（我方 CVM 通道核查通过）满足**。
2. **3.0 可派给我**：PATH / 后台 / 传输 / 采数四项范式均已就绪。
3. ⚠️ **降格提醒（未测）**：本轮**未跑 `dsh` 本体**，所以我方"能否驱动 DSH 跑通"**仍未由本会话证明** —— 那属于 3.0 的活（且 DSH-2.5 时我在 CVM 上跑过，但按纪律**上一会话的结果不算数**）。
4. ⚠️ **采数口径必须先定死**：Claude 实测 `ps -eo rss` 求和比 cgroup **虚高 53%**；我本轮只取了 cgroup 一侧，**未复跑 ps 求和**，故不重复其结论、只引用其口径建议（**cgroup 为主口径**）。



