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

### 1. 硬要求（**不满足则取到的数据无效，宁可不测**）

1. **必须是 WSL 2，不能是 WSL 1** —— WSL1 没有真实 Linux 内核，文件锁语义与生产 Linux 不同，测了等于没测。
2. **验证必须跑在 Linux 原生文件系统（ext4）上，**绝对不要**放在 `/mnt/c/` 或 `/mnt/d/` 下**。
   - 原因：`/mnt/c` 是 drvfs（9P 协议）挂载，**POSIX 文件锁 / WAL 行为与 ext4 不一致**。在它上面测 SQLite 并发，结论**不可信**——这会让 DSH-2.5 ① 的判定整个作废。
   - 做法：代码与数据放 `~/`（如 `~/larry/`）或 `/opt/` 等 ext4 路径。**从 Windows 资源管理器访问请用 `\\wsl$\<发行版名>\` 而不是直接编辑 `/mnt/c` 下的副本。**
3. **发行版与生产目标对齐**（若已定）：DSH-5 上云若已定发行版/大版本，**就按那个装**；未定则取 **Ubuntu 24.04 LTS**（内核更新、Landlock 支持更好）。
4. **版本必须记录下来**（见 §3 自检，要贴回）：WSL 版本、内核版本、发行版、Node、pnpm、SQLite（**两处**，见 §4 坑 3）、Python。

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
uname -r
cat /etc/os-release | head -3

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

### 5. 配好之后交给谁

- 把 §3 的输出贴回**本文件**（或发给 WB），WB 据此判定环境是否合格。
- 环境合格后，**DSH-2.5 ① 的实测**由 WB 另派（Trae 或 Claude，届时定），执行方会在**这个环境里**跑，不在 Windows 上跑。
- 若 WSL2 不足以复现目标行为（自检第 5 项过不了，或目标内核特性缺失），**再上 CVM**——决策稿已留此退路，不硬撑。

---