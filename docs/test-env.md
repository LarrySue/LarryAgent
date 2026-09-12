# 测试环境（WSL）— 事实、边界与已知坑

> **定位**：本项目 **Linux 测试 / 实验环境**的**单一真相源** —— 环境资产、实测数据、硬要求、已知坑、与生产环境的边界。与 `production-env.md`（生产 / CVM）、`dsh/dsh-local-env.md`（本机 Windows 开发环境）三者对仗。
> **为何独立成文（且提到 docs/ 顶层）**：环境是**跨阶段的长期基础设施**，不属于"DSH 迁移"这个阶段专题。原先这类事实寄居在 `exchange/log-other.md` 的派发稿里，派发稿一清就随之丢失（2026-09-10 实际发生过一次）⇒ 环境事实必须放在**唯一能跨 AI、跨清理周期的位置**。
> **来源**：① 2026-09-09 环境搭建的派发与验收记录（原 `exchange/log-other.md`，派发稿已清理，**事实于 2026-09-12 迁移至此**）；② 2026-09-12 Claude《WSL 能力边界探测》报告（WB 复验合格）。
> **标记约定**：🟢 实测 ／ 🔴 估算 ／ ⬛ 未测。

---

## 1. 角色与定位

| 环境 | 角色 | 文档 |
|---|---|---|
| 本机 Windows | **开发环境** | `dsh/dsh-local-env.md` |
| **WSL（Ubuntu-24.04）** | **测试 / 实验环境** | 本文档 |
| CVM（轻量 Lighthouse） | **判定环境 + 未来生产机** | `production-env.md` |

- **它是什么**：可随时 `wsl --unregister` 重来的 **Linux 实验场** —— 破坏性试验（改配置 / 重装 / 各种失败尝试）、**跨机装配验证**（"从零 bootstrap 能不能成"这类判定天然需要一台干净的、可抛弃的机器）。
- **它不是什么**：**不是生产环境，也不是生产替身**。判定标的是内核 ABI 的测试**必须留在 CVM**（见 §5）。
- **原始定位（2026-09-09）**：为 DSH-2.5 ①（`storage/` 外接 SQLite）取 Linux 侧数据而建，"仅为验证，不是生产环境"。
- **定位升格（2026-09-12）**：老大定 **WSL 长期担任核心测试环境**（不再是一次性验证机）。

---

## 2. 实测版本基线（🟢 2026-09-09 搭建 / 2026-09-12 复核，两次一致）

| 项 | 值 |
|---|---|
| WSL | **2.7.13.0**（手动 msi 装，GitHub releases `2.7.13`） |
| 发行版 | **Ubuntu-24.04**（`24.04.4 LTS`，USTC 镜像 `wsl --install --from-file`） |
| 内核 | **6.18.33.2-microsoft-standard-WSL2**（`wsl --version` 报 `6.18.33.2-2`） |
| 文件系统 | `df -T .` → `/dev/sdd  ext4`（**未踩 `/mnt/c`**） |
| 磁盘 | ext4 约 1 TB（VHDX 动态扩展，初始 1.3 GB） |
| 默认用户 | `sularry`（uid 1000，sudo 组） |
| 工具链 | node **v22.23.2**（nvm `~/.nvm`）／npm 10.9.8／**pnpm 11.7.0**／git 2.43.0／Python 3.12.3／gcc・make・sqlite3 3.45.1 |
| apt 源 | **USTC** 镜像 |
| Windows 宿主 | Windows 11 build **26200**（10.0.26200.9445） |

> ⭐ **pnpm 11.7.0 与 `harness/package.json` 的 `packageManager` 精确匹配** —— 这是它比 CVM（无 pnpm，需现装）更适合"跑仓库工程"的一条实测理由。

> ⚠️ **内核与发行版解耦**：WSL2 内核由微软统一提供（`wsl --update`），**换发行版不改变内核**。本环境要验的文件锁 / WAL / user namespace / Landlock **全部由内核决定** ⇒ **内核版本才是真变量**，别在发行版选择上耗时间。

---

## 3. 验收判据（🟢 2026-09-09 判定 **合格**）

| 判据 | 实测 | 判定 |
|---|---|---|
| **是 WSL2 不是 WSL1** | `wsl -l -v` → `Ubuntu-24.04  Running  2` | ✅ |
| **在 ext4 上不是 9p/drvfs** | `df -T .` → `/dev/sdd  ext4` | ✅ |
| **8a 反向**：`busy_timeout=0` + 并发写 → **应出现** `database is locked` | 目测过半报 locked | ✅ **锁确实在拦** |
| **8b 正向**：`busy_timeout=10s` + 并发写 → 应无阻塞且**总计数 = 200** | 全部成功，`COUNT = 200` | ✅ **无写丢失** |
| **WSL 内起服务 → Windows 侧可访问** | `http://127.0.0.1:8123/` → **HTTP 200 / 5 ms** | ✅ |

> ⚠️ **判据方向（勿再写反）**：`busy_timeout=0` 下**出现** `database is locked` **不是失败**，恰恰证明 **WAL 写锁在生效** —— 这正是本环境存在的理由。**必须正反两组都对**（反向组看到锁拦人、正向组看到等待后全部成功），才说明取到的是真实 Linux 锁语义。

---

## 4. 硬要求（不满足则数据无效，宁可不测）

1. **必须是 WSL 2** —— WSL1 没有真实 Linux 内核，文件锁语义与生产 Linux 不同。
2. **验证必须在 ext4 上** —— 工作副本放 WSL 内部（`~/` 等），**绝不放 `/mnt/c`、`/mnt/d`**（drvfs/9P，POSIX 锁与 WAL 语义不一致）。
3. **WSL 必须装在 C 盘** —— 保持 `%LOCALAPPDATA%` 默认位置，**不要 `--export`/`--import` 迁到 D 盘**（若 D 盘为 VHD → 形成 VHD 套 VHD，**fsync 延迟被显著放大**，而 SQLite 锁竞争窗口直接受 fsync 影响 ⇒ 数据作废）。
4. **版本必须记录**（WSL / 内核 / 发行版 / node / pnpm / SQLite 两处 / Python）—— **判据须注明取自哪棵树**。

---

## 5. ⭐ 与生产环境的边界（本文件最重要的一条）

| | WSL | 生产 / CVM |
|---|---|---|
| **landlock ABI** | **7**（🟢 2026-09-12 实跑 syscall 正证：设 `no_new_privs` 后 `restrict_self` 成功、随后读 `/etc/hostname` 被 EACCES） | **4**（🟢 实测，`probe=partial`） |
| 可用权限位集合 | 多（`LL_FS_REFER` ≥2、`LL_FS_TRUNCATE` ≥3 有；另含 ABI v5 的**设备 ioctl**） | 少（缺 ABI v5 设备 ioctl；`REFER`/`TRUNCATE` 有） |

> ⚠️ **判定不可互搬**：ABI 不同 ⇒ **可用权限位集合不同** ⇒ **WSL 上测出的"某操作被放行 / 被拒"不得搬到生产定论，反之亦然。**
> ⇒ **判定标的是内核 ABI 的 landlock 测试必须留在 CVM**；WSL 适合承载 **代码逻辑 / 工具链 / 接入层 / 破坏性试验**。

> 附（landlock 精确语义，防误信）：DSH 自带 `node-addon-landlock-run`，**只管文件系统**，源码**完全没有 `LANDLOCK_ACCESS_NET`**（实测沙箱内照样联网）⇒ **"上了 sandbox 就不怕数据外泄"是错的**，防外联必须另做（网络策略 / 无外网路由）。这是设计选择，不是 bug。

---

## 6. 已知坑（会静默出错的那几个）

### 6.1 `/mnt/*` 三重限制（本环境最致命）🟢 实测

`/mnt/d` 上：① **大小写不敏感**（`CaseProbe.txt` 用小写文件名可读）；② **约 6 倍慢**（同法 188 MB/s，ext4 为 1.1 GB/s；小文件差距更大）；③ **收不到 Windows 侧写入的 inotify 事件**（ext4 对照组正常收到）。外加 POSIX 锁语义不一致（见 §4 第 2 条）。
⇒ **任何判据相关的工作副本必须放 ext4**，否则得到一堆"看着像被测对象 bug"的假故障。

### 6.2 PATH 注入：裸跑 `node`/`npm`/`pnpm` 命中的是 **Windows 版** 🟢 实测

Windows PATH 被注入 WSL（30 条 `/mnt/*`）。报错形式极具误导性（`pnpm: exec: node: not found`、corepack `cannot execute`）。
⇒ 必须显式 `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:/usr/bin:/bin"` 或用绝对路径。**非登录 / 非交互 shell 都不加载 nvm。**

### 6.3 其余（简表）

| 坑 | 后果 / 对策 |
|---|---|
| **休眠后时钟漂移** | mtime 类断言失真 ⇒ 验 mtime 前先 `date` 对表；必要时 `wsl --shutdown` |
| **SQLite 有两处版本** | CLI 3.45.1 ≠ Node 内嵌 3.51.x ⇒ **下结论以内嵌版为准**，CLI 只作辅助观察 |
| **`pkill -f "<pattern>"` 会自杀** | pattern 匹配到自身命令行（实测 exit 15）⇒ 用括号技巧 `pkill -f "[h]ttp.server"` 规避 |
| **WSL 内绑 `0.0.0.0` = 暴露在局域网** | 实测网络形态是**宿主网卡镜像**（非 NAT）⇒ 起服务默认绑回环 |
| **VHDX 只增不减** | WSL 内删文件，宿主 C 盘空间不释放 ⇒ 需 `wsl --shutdown` 后 compact，或 `export` + `import` |
| **`sudo` 在 WSL 内要密码** | 要 root 只能从 Windows 侧 `wsl -u root`（免密） |
| **Windows 防火墙 Public profile** | 局域网设备访问 WSL 服务超时（Windows 侧监听者是 `dllhost.exe`，服务进程的入站规则管不到它）；**loopback 不受影响** ⇒ 需显式入站规则 |
| **CRLF 污染** | 仓库统一 LF ⇒ WSL 侧 `git config core.autocrlf input`（**已配**，`git status` 干净无噪声） |
| **空间** | 本次必需约 **3–3.5 GB**；`harness/node_modules` + dsh CLI + 运行时数据 **不能从 Windows 侧拷贝复用**（跨 OS，原生模块不通用），须在 WSL 内 `pnpm install` 重装；建议预留 8–10 GB |

---

## 7. 网络与访问

- **WSL → 外网**：正常（registry.npmjs.org / pypi.org / api.github.com 全 200）。
- **Windows → WSL**：`localhost` 转发可用（实测绑 `0.0.0.0:18777` 后 Windows 侧 200，跨边界集成测试可行）。
- ⚠️ **内部访问一律用 `127.0.0.1`，不用 `localhost`** —— 实测 `localhost` 走 IPv6 优先解析后回落，**慢约 40 倍**（207 ms vs 5 ms）。
- WSL 内**无 proxy 环境变量**；Windows 侧 git 的 `socks5://127.0.0.1:7890` **不继承**进 WSL。
- 局域网访问（手机等）受 §6.3 防火墙那条限制；是否真需要，取决于后续是否做移动版真机联调。

---

## 8. 入口（事实）

| 项 | 值 |
|---|---|
| 发行版名 | `Ubuntu-24.04` |
| 进入 | `wsl.exe -d Ubuntu-24.04 -- <cmd>`；退出码透传；stdin 可喂脚本；**无 TTY** |
| 默认用户 / root | `sularry`（uid 1000，sudo 组）；`-u root` **免密**直达 root |
| 工作目录 | `--cd /path` 可指定；**未指定时继承 Windows 当前目录**（从仓库目录调用 → 落在 `/mnt/d/Code/LarryAgent`） |
| 文件互通 | Windows 侧 `\\wsl.localhost\Ubuntu-24.04\…` 可读（WB 的只读复验通道）；WSL 侧 `/mnt/c`、`/mnt/d` 可读写 |
| 长任务 | `setsid nohup … < /dev/null &` 起的后台进程在 `wsl.exe` 退出后**存活**，可复入轮询 |
| 可重来 | `wsl --unregister Ubuntu-24.04`（秒级清空重建，这是它作"实验场"的核心优势） |

> **执行人分配（2026-09-12 定）**：**Claude 执行**（已实测能完整操作 WSL；Claude Code 官方推荐姿势是**直接运行在 WSL 内部**）；**WB 复验**（走 `\\wsl.localhost\` 只读通道读产出）。`wsl.exe` 在 WorkBuddy 的**程序黑名单**内 ⇒ WB 不执行、只复验。

### 附：从 Windows 宿主（Git Bash）调 `wsl.exe` 的适配坑 —— **入口特定，非环境事实**

> 若执行人是**在 WSL 内部**运行（Claude 的姿势），以下三条**都不存在**；只有"从 Windows 宿主调 `wsl.exe`"这条路才需要。

1. `MSYS_NO_PATHCONV=1` —— MSYS 会改写参数里的 POSIX 路径（`… -- ls /home` 实际执行 `ls D:/App/Git/home`）。
2. 脚本首行 `exec 2>&1` —— `wsl.exe` 的 stdout/stderr 混流会**损坏输出**（互相吞字、顺序错乱）。
3. **显式 `cd` 到自建目录** —— "cwd 继承 + 路径改写"的组合拳曾让探测文件建进**仓库根**（未跟踪，已清）。

> 建议这三条 + PATH 净化**固化成脚本**（可执行、自强制、不依赖任何 AI 的"记忆"），而非散文指南。

---

## 9. 残留资产（复跑前先看这里）

| 位置 | 内容 | 处置 |
|---|---|---|
| WSL `~/wsl-check.sh` + `~/wsl-check.txt` | 环境自检一键脚本 / 输出（2026-09-09 WB 生成） | **保留**；复跑自检直接执行脚本并把输出落 `~/wsl-check.txt` |
| WSL `~/sqlite-check` | 09-09 并发探针遗留 | 非 WB 造 |
| WSL `~/claude-probe/` | 2026-09-12 Claude 探测产物（链接 / 稀疏文件 / 16 MB 镜像 / venv / 日志，约 50 MB） | **可整目录删**，未清 |
| Windows `D:\Temp\Sys\claude-wsl-probe\` | Claude 侧 `landlock_probe.py` 等 | 同上 |
| ⚠️ 过程瑕疵（留痕） | `inotify-ext4.log` 长到 31 MB —— inotifywatch 监视了**含自身输出的目录** → **自激循环** | 结论不推翻（自激反向强化了对照），**复跑须避开自监视** |

---

## 10. 未闭合 / 待办

| 项 | 状态 | 说明 |
|---|---|---|
| **`flock` 在 `/mnt` vs ext4 的行为** | ⬛ **未实测** | ⚠️ 这条比 inotify 更贴要害（DSH 有 **session 锁** + `node:sqlite`）。"`/mnt` 下 flock 失效"目前**只有文献支撑、无本机实测** |
| **WSL 具体承载哪类测试** | ⬛ 待定 | 候选：DSH sandbox / landlock 行为 / harness 冒烟 / LarryAgent 单测。**须套 §5 边界**（ABI 判定不在此） |
| PID 1 独占 seccomp USER_NOTIF | ⬛ 未测 | systemd 作 PID1 且 running；当前进程已带 1 个 seccomp 过滤器，常规操作未被挡。DSH 走 landlock 则无碍，走 seccomp 退路可能 EBUSY |
| 执行范式固化脚本 | ⬛ 待定 | 落盘位置待指定（内容见 §8 附录三条坑） |
