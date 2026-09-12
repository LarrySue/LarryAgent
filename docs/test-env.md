# 测试环境（WSL）— 事实、边界与已知坑

> **定位**：本项目 **Linux 测试 / 实验环境**的**单一真相源** —— 环境资产、实测数据、硬要求、已知坑、与生产环境的边界。与 `production-env.md`（生产 / CVM）、`local-env.md`（本机 Windows：开发 + C 侧测试 + PC 侧生产使用）三者对仗。
> **为何独立成文（且提到 docs/ 顶层）**：环境是**跨阶段的长期基础设施**，不属于"DSH 迁移"这个阶段专题。原先这类事实寄居在 `exchange/log-other.md` 的派发稿里，派发稿一清就随之丢失（2026-09-10 实际发生过一次）⇒ 环境事实必须放在**唯一能跨 AI、跨清理周期的位置**。
> **来源**：① 2026-09-09 环境搭建的派发与验收记录（原 `exchange/log-other.md`，派发稿已清理，**事实于 2026-09-12 迁移至此**）；② 2026-09-12 Claude《WSL 能力边界探测》（🟢 WB 复验合格）；③ 2026-09-12 Trae《WSL 能力边界实测》（🟢 WB 交叉核对后吸收）。
> ⚠️ **②③ 来自两条不同的执行通道**（宿主 shell 形态不同）—— **同一事实两通道一致才采信单值；两通道不同的，本文档并列留痕、不擅自合并**（见 §8.3）。
> **标记约定**：🟢 实测 ／ 🔴 估算 ／ ⬛ 未测。

---

## 1. 角色与定位

| 环境 | 角色 | 文档 |
|---|---|---|
| 本机 Windows | **开发环境 + C 侧（client）测试环境 + PC 侧生产使用环境** | `local-env.md` |
| **WSL（Ubuntu-24.04）** | **测试 / 实验环境** | 本文档 |
| CVM（轻量 Lighthouse） | **判定环境 + 未来生产机** | `production-env.md` |

- **它是什么**：可随时 `wsl --unregister` 重来的 **Linux 实验场** —— 破坏性试验（改配置 / 重装 / 各种失败尝试）、**跨机装配验证**（"从零 bootstrap 能不能成"这类判定天然需要一台干净的、可抛弃的机器）。
- **它不是什么**：**不是生产环境，也不是生产替身**。判定标的是内核 ABI 的测试**必须留在 CVM**（见 §5）。
- **原始定位（2026-09-09）**：为 DSH-2.5 ①（`storage/` 外接 SQLite）取 Linux 侧数据而建，"仅为验证，不是生产环境"。
- **定位升格（2026-09-12）**：老大定 **WSL 长期担任核心测试环境**（不再是一次性验证机）。
- **执行通道（2026-09-12 起，详见 §8）**：**Claude 为主执行人；Trae 为次执行人**（已实测能完整操作，按需直用）；**WB 只复验不执行**（`wsl.exe` 在 WorkBuddy 程序黑名单内）。⚠️ **通道间结论不可互推**。

---

## 2. 实测版本基线（🟢 2026-09-09 搭建 / 2026-09-12 复核，两次一致）

| 项 | 值 |
|---|---|
| WSL | **2.7.13.0**（手动 msi 装，GitHub releases `2.7.13`） |
| 发行版 | **Ubuntu-24.04**（`24.04.4 LTS`，USTC 镜像 `wsl --install --from-file`） |
| 内核 | **6.18.33.2-microsoft-standard-WSL2**（`wsl --version` 报 `6.18.33.2-2`） |
| 文件系统 | `df -T .` → `/dev/sdd  ext4`（**未踩 `/mnt/c`**） |
| 挂载类型 | `/` = **ext4**；`/mnt/d` = **9p(v9fs)**，权限 `rwxrwxrwx`（⚠️ 见 §6.1） |
| 磁盘 | ext4 约 1 TB（VHDX 动态扩展，初始 1.3 GB） |
| 默认用户 | `sularry`（uid 1000，sudo 组） |
| 工具链 | node **v22.23.2**（nvm `~/.nvm`）／npm 10.9.8／**pnpm 11.7.0**／git 2.43.0／Python 3.12.3／gcc 13.3.0・make 4.3・sqlite3 **3.45.1** |
| 工具链缺项 | **docker / podman / `bwrap` / strace / uv 均无**；系统级无 pip（venv 内 pip 24.0 可用）⇒ 要测 DSH 的 bwrap rung 须先 `apt install bubblewrap` |
| apt 源 | **USTC** 镜像 |
| Windows 宿主 | Windows 11 build **26200**（10.0.26200.9445） |
| 宿主镜像规格 | `nproc=24`／Mem ≈ 15.5 GB／`/` ≈ 1007 GB（可用 ≈ 954 GB）—— WSL 直接镜像宿主资源，**不是沙箱限额**，别当"环境给足了"读 |

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

> 🟢 **2026-09-12 补齐（Trae 通道独立复现）**：文件系统那条（ext4 vs 9p，见 §6.1）与 §5 的内核事实，**两条通道结论一致、判据方向一致**。⇒ 这两类事实可以按单值引用；**其余只在单一通道测过的项，引用时须注明取自哪条通道**（§8.3）。

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

> 🟢 **两条通道独立复现**（2026-09-12）：Claude 走 syscall 正证、Trae 走 `landlock_create_ruleset` 返回值 → **同为 ABI 7**，故 WSL 侧的 7 可按单值采信。

> ⚠️ **判定不可互搬**：ABI 不同 ⇒ **可用权限位集合不同** ⇒ **WSL 上测出的"某操作被放行 / 被拒"不得搬到生产定论，反之亦然。**
> ⇒ **判定标的是内核 ABI 的 landlock 测试必须留在 CVM**；WSL 适合承载 **代码逻辑 / 工具链 / 接入层 / 破坏性试验**。

### 5.1 沙箱相关的内核能力（🟢 两条通道一致，供 Linux 侧测试直接用）

| 能力 | 状态 | 备注 |
|---|---|---|
| **landlock ABI 7 且强制生效** | ✅ 可用 | 正证见上表。⚠️ 细节：`restrict_self` 前**必须先设 `no_new_privs`**，否则 `EPERM` —— 探测脚本初版正踩这个，**会误判成"landlock 不可用"** |
| **非特权 user namespace** | ✅ 可用 | `unshare -U --map-user=0 id` → `uid=0(root)`；该内核**无** `apparmor_restrict_unprivileged_userns` 限制 |
| **user ns + net ns** | ✅ 可用 | `unshare -Urn` 成功；ns 内起 loopback HTTP 服务可访问（200）⇒ **可做网络隔离的封闭测试** |
| **`bwrap`（bubblewrap）** | ⬛ **未装** | 要测 DSH 的 bwrap rung 须先 `apt install bubblewrap` |
| cgroup v2 | ✅ 控制器齐全 | cpuset / cpu / io / memory / hugetlb / pids / rdma |
| systemd | ✅ 作 PID 1 且 running | 附带 ⬛：PID 1 独占 seccomp USER_NOTIF 未测（见 §10） |
| seccomp | ⚠️ 当前进程已带 1 个过滤器 | `Seccomp:2`，常规操作未被挡；走 landlock 则无碍 |
| **loop 挂载** | ✅ 全通 | 自建 8 MB ext4 镜像 → `mkfs.ext4` → `mount -o loop` → 读写 → `umount`；root 可写 `/etc` |
| 权限墙 | ✅ 正常 | root 建的 600 文件普通用户读写被拒（目录属主仍可删该文件，Unix 语义如此） |

> 附（landlock 精确语义，防误信）：DSH 自带 `node-addon-landlock-run`，**只管文件系统**，源码**完全没有 `LANDLOCK_ACCESS_NET`**（实测沙箱内照样联网）⇒ **"上了 sandbox 就不怕数据外泄"是错的**，防外联必须另做（网络策略 / 无外网路由）。这是设计选择，不是 bug。

---

## 6. 已知坑（会静默出错的那几个）

### 6.1 `/mnt/*` 三重限制（本环境最致命）🟢 实测 · 两条通道各测一遍

| 项 | ext4（`~/…`） | `/mnt/d`（**9p / v9fs**，权限 `rwxrwxrwx`） |
|---|---|---|
| 大小写 | **敏感** | **不敏感**（`CaseProbe.txt` 用小写文件名可读） |
| 顺序写 | **1.1 GB/s**（Claude）／64 MB `dd` **49 ms**（Trae） | **188 MB/s**（Claude）／64 MB `dd` **466 ms**（Trae）⇒ **≈6–10× 慢** |
| 小文件（200 个创建） | **31 ms**（Trae） | **883 ms**（Trae）⇒ **≈28×** |
| inotify | **event_ok** | **no_event_within_2s**（`add_watch` 成功但事件不到） |
| symlink / hardlink | OK / OK | — / OK |

外加 **POSIX 锁语义不一致**（见 §4 第 2 条）⇒ **任何判据相关的工作副本必须放 ext4**，否则得到一堆"看着像被测对象 bug"的假故障。

> ⚠️ **引用数字的纪律**：两通道测出的倍数不同（**测法不同**：文件大小 / 块大小 / 工具），但**方向与量级一致** ⇒ 结论只取"**慢一个数量级，小文件更甚**"，**别把某一组数字当精确值引**。

### 6.2 PATH 注入：裸跑 `node`/`npm`/`pnpm` 不可信 🟢 实测 · ⚠️ 两通道现象不一致

Windows PATH 被注入 WSL（约 30 条 `/mnt/*`）。**两通道观察到的现象不同**：

| 通道 | 裸跑 `node` 的结果 |
|---|---|
| Claude | 命中 **Windows 版**（interop），且报错形式极具误导性（`pnpm: exec: node: not found`、corepack `cannot execute`） |
| Trae | 直接 **`command not found`** —— 注入的 PATH 只带来 `npm`/`pnpm` shim，**没有 node** |

⬛ **未收敛**：两者为何不同**未定位**（PATH 顺序 / shell 形态 / 工具如何 spawn 均有嫌疑）⇒ **不擅自给结论**（见 §10）。但两者导出的**行动纪律完全相同**：
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
| **`wsl --terminate` 会清掉全部后台进程** | 长任务的存活边界 = **别 terminate**；`setsid nohup … &` 起的进程只在**不 terminate** 时跨 `wsl.exe` 退出存活（复入 pid 不变） |
| **无 TTY** | `tty0` / `tty1` 均为 no ⇒ **交互式程序不可用**（`sudo` 要密码也有此原因）；脚本一律非交互写法 |
| **Windows 防火墙 Public profile** | 局域网设备访问 WSL 服务超时（Windows 侧监听者是 `dllhost.exe`，服务进程的入站规则管不到它）；**loopback 不受影响** ⇒ 需显式入站规则 |
| **CRLF 污染** | 仓库统一 LF ⇒ WSL 侧 `git config core.autocrlf input`（**已配**，`git status` 干净无噪声） |
| **空间** | 本次必需约 **3–3.5 GB**；`harness/node_modules` + dsh CLI + 运行时数据 **不能从 Windows 侧拷贝复用**（跨 OS，原生模块不通用），须在 WSL 内 `pnpm install` 重装；建议预留 8–10 GB |

---

## 7. 网络与访问

- **WSL → 外网**：正常（registry.npmjs.org / pypi.org / api.github.com 全 200）。
  - ⚠️ **但快慢两极**：npmmirror **200 / 0.22 s**；**GitHub 200 却要 70.9 s**（🟢 Trae）⇒ 装包一律走 npmmirror，别指望 GitHub。
- **Windows → WSL**：`localhost` 转发可用（实测绑 `0.0.0.0:18777` 后 Windows 侧 200，跨边界集成测试可行）。🟢 **两条通道各复现一次**：Claude 走 `http://localhost:18777/`、Trae 走 `curl.exe --noproxy "*" http://localhost:18799/` → 均 200。
  - ⚠️ 宿主侧 `curl` **须加 `--noproxy "*"`** —— 否则可能被代理环境变量拦掉本地回环（与 WB 环境纪律同源）。
- ⚠️ **内部访问一律用 `127.0.0.1`，不用 `localhost`** —— 实测 `localhost` 走 IPv6 优先解析后回落，**慢约 40 倍**（207 ms vs 5 ms）。
- ⚠️ **网络形态 = 宿主网卡镜像，不是 NAT** —— WSL 内网卡直接拿到宿主 LAN 网段地址、网关即宿主网关（🟢 两通道一致）。⚠️ **WSL 启动告警里那句 "networkingMode Nat + localhost 代理未镜像" 与实际表现不符**（🔴 该提示本身失真），别信那句提示；实测后果见 §6.3「绑 `0.0.0.0` = 暴露在局域网」。
- WSL 内**无 proxy 环境变量**；Windows 侧 git 的 `socks5://127.0.0.1:7890` **不继承**进 WSL。
- 局域网访问（手机等）受 §6.3 防火墙那条限制；是否真需要，取决于后续是否做移动版真机联调。

---

## 8. 入口与执行通道

### 8.1 入口事实（🟢 实测；**单通道独有项已注明通道**）

| 项 | 值 |
|---|---|
| 发行版名 | `Ubuntu-24.04`（`VERSION 2`） |
| 进入 | `wsl.exe -d Ubuntu-24.04 -- <cmd>`；`-e <bin>` 可直 exec；退出码透传（`exit 42` → 42，命令不存在 → 1）；stdin 可喂脚本；**无 TTY** |
| 默认用户 / root | `sularry`（uid 1000，含 `sudo` 组）；`-u root` **免密**直达 root；默认用户 `sudo -n` **要密码** |
| 工作目录 | `--cd /path` 可指定；**未指定时继承 Windows 当前目录**（从仓库目录调用 → 落在 `/mnt/d/Code/LarryAgent`） |
| 文件互通 | Windows 侧 `\\wsl.localhost\Ubuntu-24.04\…` 可读（WB 的只读复验通道）；WSL 侧 `/mnt/c`、`/mnt/d` 可读写；**双向**（Windows 侧写入 WSL 内文件也被看到） |
| 长任务 | `setsid nohup … < /dev/null &` 起的后台进程在 `wsl.exe` 退出后**存活**，可复入轮询；⚠️ **`wsl --terminate` 后全清** |
| 并发（Trae） | 🟢 3 路并发各 `sleep 3` → **总 3.9 s**（真并行，非串行 9 s） |
| 单次耗时（Trae） | 首调（冷）**4.55 s**；热调 **0.13–0.14 s**（3 次稳定）；`--terminate` 后重进 3.46 s |
| 可重来 | `wsl --unregister Ubuntu-24.04`（秒级清空重建，这是它作"实验场"的核心优势） |

### 8.2 执行人分配（2026-09-12 定）

| 通道 | 执行人 | 形态 | 定位 |
|---|---|---|---|
| **宿主 shell → `wsl.exe`** | **Claude（主）**、**Trae（次）** | 各自工具内的 shell 调 `wsl.exe`（**两者宿主 shell 形态不同**，见 §8.3） | **测试执行** —— 已实测均能完整操作 WSL |
| `\\wsl.localhost\…` 只读 | **WB** | 文件系统只读通道 | **只复验、不执行** —— `wsl.exe` 在 WorkBuddy 的**程序黑名单**内 |

- 老大 2026-09-12 定：**Claude 负责测试**；**Trae 在需要时也可直接操作 WSL**（已实测具备完整能力，非"或许能"）。
- ⚠️ **通道间结论不可互相外推**（Trae 报告原话：「本报告**只描述 Trae 通道**……两个方向的结论**不可互相外推**」）—— 宿主 shell 语义不同，会各自制造**独有的坑**（§8.3）。⇒ 本文档凡**单通道**取得的结论，一律注明通道；**两通道分歧的并列留痕、不合并**（如 §6.2）。

### 8.3 各通道的适配坑与稳定范式 —— ⚠️ **按通道看，别混用**

#### 8.3.1 Claude 通道（宿主 bash / MSYS 形态）

1. `MSYS_NO_PATHCONV=1` —— MSYS 会改写参数里的 POSIX 路径（`… -- ls /home` 实际执行 `ls D:/App/Git/home`）。
2. 脚本首行 `exec 2>&1` —— `wsl.exe` 的 stdout/stderr 混流会**损坏输出**（互相吞字、顺序错乱）。
3. **显式 `cd` 到自建目录** —— "cwd 继承 + 路径改写"的组合拳曾让探测文件建进**仓库根**（未跟踪，已清）。

范式：`MSYS_NO_PATHCONV=1 wsl.exe -d Ubuntu-24.04 -- bash -s <<'EOF' … EOF`

#### 8.3.2 Trae 通道（宿主 PowerShell 工具 + **base64 载体**）

⚠️ **本通道独有的最大坑：内联命令里的 `$(...)` / `$VAR` 会在 Windows 侧被提前展开一次**（静默产生错值）⇒ **含变量 / 命令替换的脚本必须走 base64 载体**。

| 组 | 命令（均内联） | 结果 |
|---|---|---|
| A | `date +%s; sleep 5; date +%s` | 差 5 s ✔ 顺序正常 |
| B | `echo $(date +%s); sleep 5; echo $(date +%s)` | **两次同值**（同一次求值 → 被提前展开） |
| C | `X=AAA; echo "X=$X"` | 输出 `X=`（`$X` 在 Windows 侧被展开成空） |
| D | **base64 载体**内同样的 `$(date +%s)` ×2 + `sleep 5` | 差 5 s ✔ 正常 |

其它三坑：

- **stdin 管道会注入 CRLF**：`"echo …; whoami" | wsl.exe … bash -s` → `bash: $'whoami\r': command not found`（exit 127）。
- `wsl.exe` **自身的中文文案在本通道下乱码**（`wsl -l --running`、「操作成功完成」等），但 **`--` 之后的 Linux 输出完全正常**（中文 / 全角 / `①②③` 均正确往返）。
- ⚠️ `Measure-Command { … }` 会**吞掉块内输出**（本通道因此丢过一次结果）—— 别用它包装要取输出的命令。

范式（**四件套**）：

```powershell
$s = @' …bash 脚本… '@            # 脚本首行写 exec 2>&1
$s = $s -replace "`r",""           # 去 CR
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($s))
wsl.exe -d Ubuntu-24.04 --cd <显式目录> -- bash -c "echo $b64 | base64 -d > /tmp/x.sh; bash /tmp/x.sh"
```

#### 8.3.3 两通道共同的坑（与通道无关）

1. **`--cd` 显式定 cwd** —— 别依赖 cwd 继承：**两个通道都因此把文件写进过仓库根**（均已清）。
2. **`exec 2>&1`** —— 输出混流会损坏结果。
3. **大结果落文件，再用 `\\wsl.localhost\…` 读回** —— 别指望 stdout 承接长输出。

> 建议把 §8.3 三条 + PATH 净化**固化成脚本**（可执行、自强制、不依赖任何 AI 的"记忆"），而非散文指南。落盘位置待定（见 §10）。

### 8.4 ⚠️ 安全边界：WSL 是沙箱之外的一条写入路径

🟢 **实证**（Trae，2026-09-12）：WSL 内 `echo probe > /mnt/c/Users/SuLarry/.dsh/trae-wsl-probe.txt` **成功**；**同一路径在 Windows 侧写入被拒**。

- **含义**：**WSL 是宿主侧沙箱之外的一条写入路径**（9p 默认 `rwxrwxrwx`、uid 映射到 `sularry`；写入由 **WSL 侧内核 / 9p 服务**代劳，**不经工具的进程树**）⇒ 凡"从宿主调 `wsl.exe`"的通道（Claude / Trae 都是此形）都具备该能力。
- **边界仍在**：系统 ACL 照样生效（`C:\Windows\System32\…` 写入仍 `Permission denied`）。
- 🔴 **归因待钉（2026-09-12 WB 复看）**：原报告把 Windows 侧对照组写成「**被 Trae 工具沙箱拒绝**」，但其唯一依据是 `dsh --dump-config` 报的 `EPERM` —— 那次拒绝出自 **DSH 自身沙箱**（`local-env.md` §4「错误码类别层」：DSH 的 windows-acl runner 拒绝写入后，node 报 `EPERM: operation not permitted`，而 DSH 未识别该文案）。
  ⇒ 该证据支持的是「**DSH 沙箱可被此路径绕过**」，**不等于**「AI 工具自身沙箱可被绕过」（后者本会话**无对照实验**）。**两者严重性与归属不同，勿混用、勿据此给工具沙箱定性。**
  ⇒ 补证只需一次对照：**不经 `dsh`**，直接用工具自身能力在 Windows 侧写 `~/.dsh/…`，看是否被拦。
- **敏感面（具体化，勿抽象化）**：`~/.dsh`（全局 DSH home）内含 **`.credentials.yaml` 与 `profiles/`** ⇒ 这条路径的**写**能力落在**凭据载体**上（对应 Tier0 红线①）。这也是"要不要收口"的实际标的。
- **定性**：Trae 按「**当能力事实上报、不当逃逸手段用**」上报，是否收口由老大定。⇒ **裁定前一律按"不是逃逸手段"处理，不得据此绕过任何沙箱 / 审批策略。**

#### 8.4.1 收口候选（⬛ **未拍板、未实测**，仅供裁决）

| 方案 | 动作 | 效果 / 代价 |
|---|---|---|
| **甲（最彻底）** | `/etc/wsl.conf` → `[automount] enabled = false` | WSL **看不见 Windows 盘** ⇒ 写路径直接消失。代价：WSL 内需自带仓库副本（`~/work/LarryAgent`，与 §10 已倾向一致）；需要时手动 `mount -t drvfs C: /mnt/c -o ro` 按需**只读**挂载 |
| **乙（一行，保读）** | `/etc/wsl.conf` → `[automount] options = "ro"` | 只读挂载 ⇒ **杀写、留读**（`cp` 仓库进 WSL 仍是读操作，可用）。⬛ 该选项是否被当前 WSL 接受**未实测** |
| **丙（不做）** | 保持现状 | 理由：单用户单机、需 AI **主动**执行 `wsl.exe`、系统 ACL 仍拦系统路径；与 HUMAN 原则 4「明确安全边界，而非控制安全边界」一致 |
| **✗ 在 WSL 内加 Docker** | — | **位置错**：逃逸发生在「宿主进程 spawn `wsl.exe`」这条边界上，写入由 WSL 侧代劳 ⇒ 在 WSL 里再套一层是**在被突破通道的内侧加围栏**，AI 照样能用 `-v /mnt/c:…` 把 Windows 盘挂回容器，且容器仍须挂 `/mnt` 才读得到仓库。**它解决的是"容器内工作负载的隔离"，不是"AI 通道"** ⇒ 对本口子无效；另会给 landlock 判定引入额外 seccomp / mount ns 干扰层 |

> ⚠️ `/etc/wsl.conf` 是**全 WSL 共享**、改动**须 `wsl --shutdown` 才生效** ⇒ 影响所有 AI，**须先拍板再执行**（当前状态：Trae 明确**未动**该文件）。
> ✅ `\\wsl.localhost\` 是**反方向**（Windows → WSL 读），**不受 automount 影响** ⇒ WB 的只读复验通道不会因此断。

---

## 9. 残留资产（复跑前先看这里）

| 位置 | 内容 | 处置 |
|---|---|---|
| WSL `~/wsl-check.sh` + `~/wsl-check.txt` | 环境自检一键脚本 / 输出（2026-09-09 WB 生成） | **保留**；复跑自检直接执行脚本并把输出落 `~/wsl-check.txt` |
| WSL `~/sqlite-check` | 09-09 并发探针遗留 | 非 WB 造 |
| WSL `~/claude-probe/` | 2026-09-12 Claude 探测产物（链接 / 稀疏文件 / 16 MB 镜像 / venv / 日志，约 50 MB） | **可整目录删**，未清 |
| Windows `D:\Temp\Sys\claude-wsl-probe\` | Claude 侧 `landlock_probe.py` 等 | 同上 |
| WSL `~/trae-probe/` | 2026-09-12 Trae 探测产物（`README-trae-probe.txt` 说明牌 + `zh.txt`、`中文文件名.txt` 两个 UTF-8 样本） | **保留**；说明牌已写明"非 Trae 资产勿依赖此目录" |
| Trae 已清项 | `/mnt/d/Code/_wsl-probe/`、仓库根 `img.bin`、`/root/img.bin`、`/mnt/trae-loop/`、探测进程（`http.server` / `sleep 600`）、apt 装的 `tree`（已 purge） | 均经自查确认不存在；`/etc/wsl.conf` 与既有他人文件**未动** |
| ⚠️ 过程瑕疵（留痕） | `inotify-ext4.log` 长到 31 MB —— inotifywatch 监视了**含自身输出的目录** → **自激循环** | 结论不推翻（自激反向强化了对照），**复跑须避开自监视** |

---

## 10. 未闭合 / 待办

| 项 | 状态 | 说明 |
|---|---|---|
| **`flock` 在 `/mnt` vs ext4 的行为** | ⬛ **未实测** | ⚠️ 这条比 inotify 更贴要害（DSH 有 **session 锁** + `node:sqlite`）。"`/mnt` 下 flock 失效"目前**只有文献支撑、无本机实测** |
| **WSL 具体承载哪类测试** | ⬛ 待定 | 候选：DSH sandbox / landlock 行为 / harness 冒烟 / LarryAgent 单测。**须套 §5 边界**（ABI 判定不在此）。工作区位置倾向 `~/work/LarryAgent`（ext4 内、由 git 同步） |
| **裸跑 `node` 的两通道现象分歧** | ⬛ **未收敛** | §6.2：Claude 侧命中 Windows 版、Trae 侧 `command not found`。**成因未定位**（不给猜测）；因两通道的行动纪律一致，**不阻塞** |
| PID 1 独占 seccomp USER_NOTIF | ⬛ 未测 | systemd 作 PID1 且 running；当前进程已带 1 个 seccomp 过滤器，常规操作未被挡。DSH 走 landlock 则无碍，走 seccomp 退路可能 EBUSY |
| 执行范式固化脚本 | ⬛ 待定 | 落盘位置待指定（内容见 §8.3：两通道范式 + 三条共同坑） |
| 单通道未测项（Trae 侧声明） | ⬛ 未测 | `wsl --shutdown`（只做了 `--terminate`，避免影响他人）、WSLg / 图形、IPv6 出站、GPU / CUDA |
| **越宿主沙箱的写路径是否收口** | ⬛ **待拍板** | §8.4.1：候选甲（关 automount）/ 乙（automount 只读）/ 丙（不做）；✗ Docker 已排除（位置错）。⚠️ 拍板前须先补一次**归因对照**（工具自身沙箱 vs DSH 沙箱，见 §8.4 归因待钉） |
