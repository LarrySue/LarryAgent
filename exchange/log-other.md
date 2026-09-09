# Other 交流区（编外 AI）

> 本文件供未纳入项目固定分工的编外 AI 使用，由老大按需点将介入。各条目标注 AI 名称与日期，供 WB 整理采纳。
> 编外 AI 不受 `.claude/` / `.trae/` / WORKBUDDY 等角色约束文件管辖，规矩以老大当场指令为准。

---

## 【2026-09-09 派发】WSL2 Linux 验证环境配置（执行人：老大 / 或点将编外 AI）

> **执行方式说明**：老大判断「装 WSL 在 Windows 图形界面点一点比 AI 敲命令快」，故本任务以**要求 + 自检清单**形式给出，谁执行都行（老大自装 / 编外 AI 代装均可）。**WB 不做安装，只负责定要求与验结果。**

### 0. 这个环境是干什么的（先明确边界，否则容易配错方向）

- **用途：仅为验证，不是生产环境。** 生产上云属 **DSH-5**，与本环境无关。
- **直接服务 DSH-2.5 退出条件 ①**：`storage/` 外接 SQLite 可行性——**SQLite 的文件锁 / WAL / 并发行为在 Linux 与 Windows 上有差异，必须在 Linux 上取数**，Windows 侧数据不能替代。
- **顺带可服务**（本次不强制，配好即赚到）：
  - DSH-2.5 ⑤：TS 跑 bge-small-zh 本地 embedding，与 **Python 侧基准**做向量漂移比对（Python 基准放 Linux 更干净，避免 Windows 的 PyTorch/CUDA 干扰）。
  - DSH-3 的 `sandbox/` **Linux 侧**（bwrap → Landlock）：WSL2 内核通常 5.15+，支持 Landlock 与 unprivileged user namespace，**理论上可验**——但本任务不要求验证，只要求环境别把它堵死。
- **不服务**：Windows 端 `ctx.sandbox`（DSH-2.5 ③）必须在真 Windows 上测，与 WSL 无关。

> **起点状态（WB 2026-09-09 15:4x 实测）**：本机 **WSL 尚未安装**（`wsl -l -v` / `wsl --status` 均返回"未安装适用于 Linux 的 Windows 子系统"）。→ 从零开始，执行 `wsl --install -d Ubuntu-24.04` 或 Store 装 Ubuntu 24.04 LTS 即可（会自动启用所需 Windows 功能，安装后需重启一次）。

### 1. 硬要求（**不满足则取到的数据无效，宁可不测**）

1. **必须是 WSL 2，不能是 WSL 1** —— WSL1 没有真实 Linux 内核，文件锁语义与生产 Linux 不同，测了等于没测。
2. **验证必须跑在 Linux 原生文件系统（ext4）上，**绝对不要**放在 `/mnt/c/` 或 `/mnt/d/` 下**。
   - 原因：`/mnt/c` 是 drvfs（9P 协议）挂载，**POSIX 文件锁 / WAL 行为与 ext4 不一致**。在它上面测 SQLite 并发，结论**不可信**——这会让 DSH-2.5 ① 的判定整个作废。
   - 做法：代码与数据放 `~/`（如 `~/larry/`）或 `/opt/` 等 ext4 路径。**从 Windows 资源管理器访问请用 `\\wsl$\<发行版名>\` 而不是直接编辑 `/mnt/c` 下的副本。**
3. **WSL2 内核必须更新到最新**（**常被漏掉，且比发行版选择重要得多**）：
   - ⚠️ **WSL2 的内核不来自发行版**——它由微软统一提供（`wsl --update` 安装，所有发行版共用同一个内核镜像）。**换 Ubuntu 22.04 / Debian / 24.04 都不会改变内核版本。**
   - 而本环境要验的**文件锁 / WAL / user namespace / Landlock 全部由内核决定** → **内核版本才是真变量**。
   - 做法（Windows 侧，装完发行版后执行）：`wsl --update`，然后 `wsl --shutdown` 重启生效。自检项 `uname -r` 见 §3。
4. **发行版：不纠结**（**对本次验证目标不敏感**）：DSH-5 上云若已定发行版/大版本就按那个装；**未定则取 Ubuntu 24.04 LTS**（glibc 2.39、支持周期长、Store 里有官方镜像）。
   - 理由澄清：发行版影响的只是 **glibc 与用户态工具版本**（bwrap / sqlite3 CLI / 编译器），**不是内核行为**。对「SQLite 锁与 WAL」这个验证目标，22.04 与 24.04 的**结论差异可以忽略**——**别在这个选择上耗时间**。
5. **版本必须记录下来**（见 §3 自检，要贴回）：WSL 版本、内核版本、发行版、Node、pnpm、SQLite（**两处**，见 §4 坑 3）、Python。
6. **确认是 v2 不是 v1**（Store 或 `wsl --install` 装完一般是 v2，但值得确认）：Windows 侧 `wsl -l -v`，**VERSION 列必须是 `2`**。若是 1 → `wsl --set-version <发行版名> 2` 转换后再继续。

### 2. 建议配置（非硬要求，按需要取舍）

| 项 | 建议 | 说明 |
|---|---|---|
| Node | **22.x LTS**（与本机内置 22.22.2 一致，便于跨环境对照）；若 CVM 目标版本已定则按目标 | DSH 无 `engines` 约束，两个大版本都能跑 |
| pnpm | 与仓库 `packageManager` 一致（`pnpm@11.7.0`） | 见 `harness/package.json` |
| git | 装（拉仓库/对比用） | 建议配好换行符策略，避免 CRLF 污染（仓库文件为 LF） |
| sqlite3 CLI | 装 | **仅用于辅助观察**，不能用来下版本结论（见 §4 坑 3） |
| Python | 3.11（与现有 `backend` 一致） | 仅为 2.5 ⑤ 的 embedding 基准；本次不做可跳过 |
| build-essential / python3 | 装 | 若 pnpm 需要编译原生模块（ONNX runtime、better-sqlite3 可能源码构建） |
| systemd | 24.04 默认开；22.04 需手动开 | 本验证**不强依赖** systemd；但若后续要验"服务常驻/重启"，需开启 |

**`.wslconfig`（可选，写在 Windows 侧 `%UserProfile%\.wslconfig`）**——默认值通常够用；若并发测试受资源限制再调：

```
[wsl2]
memory=8GB
processors=4
swap=2GB
localhostForwarding=true
```

> `localhostForwarding=true` 是默认值，保留它——**若后续要在 WSL 内起 HTTP 服务（如验证 Gateway）并从 Windows 侧访问，需要它**。

### 3. 验收自检（**必做**，把输出整段贴回本文件，WB 据此判定）

在 WSL 内依次执行，贴原始输出：

```bash
# 1) 确认是 WSL2 + 内核/发行版
cat /proc/version
uname -r                  # ← 内核版本：来自 wsl --update，与装的哪个发行版无关
cat /etc/os-release | head -3

# 另在 Windows 侧（PowerShell/CMD，非 WSL 内）执行一次并贴回：
#   wsl -l -v              # VERSION 列须为 2
#   wsl --version          # WSL 版本 + 内核版本

# 2) 【最关键】确认当前目录在 ext4 上，不是 9p/drvfs
cd ~ && df -T . | tail -2
# 期望：Type 列为 ext4（或 overlay）。若为 9p / drvfs → 不合格，必须换目录

# 3) 工具链版本
node -v ; pnpm -v ; git --version ; python3 --version

# 4) SQLite 两个版本都要记（见 §4 坑 3）
sqlite3 --version                                  # CLI 版本（仅供观察）
node -e "console.log(process.versions.sqlite)" 2>/dev/null || echo "node 未内建 sqlite，以 better-sqlite3 编译版本为准"

# 5) 【行为验收，不是版本验收】SQLite WAL 并发锁是否真的生效
#    目的：证明「这个环境能真实反映 Linux 的 WAL/锁行为」——这才是本环境存在的理由
cd ~ && mkdir -p sqlite-check && cd sqlite-check
sqlite3 t.db "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS t(id INTEGER PRIMARY KEY, v TEXT);"
# 开两个终端并发写，或用一条命令模拟并发写 200 次：
for i in $(seq 1 200); do sqlite3 t.db "INSERT INTO t(v) VALUES('row-$i');" & done; wait
sqlite3 t.db "SELECT COUNT(*) FROM t;"
# 期望：无 "database is locked" 报错，且计数 = 200（并发写被正确串行化）
```

**判定标准**：第 2 项必须是 ext4；第 5 项必须无锁报错且计数正确。**这两条任一不过，环境不合格**，测出来的数据 DSH-2.5 不能用。

### 4. 已知坑（前人经验，别踩）

1. **`/mnt/c` 陷阱**（最致命）：见 §1.2。在它上面测 SQLite 并发，结论无效。
2. **休眠/挂起后时钟漂移**：WSL2 从休眠恢复后系统时钟可能不同步，会导致 **mtime 类验证失真**（DSH-2.5 / 测试隔离都用到 mtime 断言）。若发现时间不对：`sudo hwclock -s` 或重启 WSL（`wsl --shutdown`）。**验 mtime 前先 `date` 对一下表。**
3. **SQLite 版本有两处，别搞混**：`sqlite3 --version` 是 **CLI** 版本；Node 侧实际用的是 **better-sqlite3 / node:sqlite 内嵌的编译版本**，两者通常不同。**下结论以内嵌版本为准**，CLI 只用于辅助观察。
4. **CRLF 污染**：Windows 侧编辑 Linux 里的仓库文件容易引入 CRLF。仓库统一 LF，建议 `git config core.autocrlf input`（Linux 侧）或直接只在 WSL 内编辑。
5. **WSL2 内存占用**：默认可用到宿主 50% 内存，跑完不用了可 `wsl --shutdown` 释放（不删任何东西）。

### 5. 空间预估（**实测基准，非拍脑袋**）

> 基准来源（Windows 侧 2026-09-09 实测）：`harness/node_modules` **313 MB**／dsh CLI 全局包 **274 MB**／`.dsh-home` 运行时数据 **226 MB**。

| 项 | 预估 | 备注 |
|---|---|---|
| Ubuntu 24.04 根文件系统（VHDX 初始） | **1.2–1.5 GB** | 动态扩展 VHDX，起步即可用 |
| apt 包（sqlite3 / git / curl + **build-essential**） | **0.4–0.6 GB** | build-essential 是大头；若确认无需编译原生模块可省，但建议装（pnpm 可能源码构建） |
| Node 22 LTS（含 npm）+ pnpm | **~0.25 GB** | |
| **我们的 S 侧**：`harness/node_modules` + dsh CLI + 运行时数据 | **0.8–1.0 GB** | ⚠️ **不能从 Windows 侧拷贝复用**（跨 OS，原生模块不通用），须在 WSL 内 `pnpm install` 重装 |
| 测试临时数据 | ~0.1 GB | |
| **小计（本次必需，不装 Python）** | **≈ 3–3.5 GB** | |
| 若加 Python 3.11 + PyTorch CPU + bge-small-zh 模型 | **再 +2.5–3.5 GB** | **仅 2.5 ⑤ embedding 漂移比对才需要，本次可跳过** |

**建议预留 8–10 GB**（含下面两个坑的余量）。本机 C 盘实测可用 **130 GB**，D 盘 179 GB —— 空间不是问题。

**两个空间相关的坑**：

1. **WSL2 的 VHDX 只增不减**：在 WSL 内删除文件，**宿主 C 盘空间不会释放**（VHDX 不会自动收缩）。若日后要回收，需 `wsl --shutdown` 后用 `diskpart` compact VHDX，或 `wsl --export` 再 `--import`。
2. **默认装在 C 盘**：Store / `wsl --install` 装的发行版，其 `ext4.vhdx` 落在 `%LOCALAPPDATA%\Packages\<发行版>\LocalState\`。想放 D 盘需手动 `--export` / `--import` 迁移——**本次不建议折腾**，130 GB 够用。

### 6. 配好之后交给谁

- 把 §3 的输出贴回**本文件**（或发给 WB），WB 据此判定环境是否合格。
- 环境合格后，**DSH-2.5 ① 的实测**由 WB 另派（Trae 或 Claude，届时定），执行方会在**这个环境里**跑，不在 Windows 上跑。
- 若 WSL2 不足以复现目标行为（自检第 5 项过不了，或目标内核特性缺失），**再上 CVM**——决策稿已留此退路，不硬撑。

---