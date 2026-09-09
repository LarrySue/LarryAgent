# Other 交流区（编外 AI）

> 本文件供未纳入项目固定分工的编外 AI 使用，由老大按需点将介入。各条目标注 AI 名称与日期，供 WB 整理采纳。
> 编外 AI 不受 `.claude/` / `.trae/` / WORKBUDDY 等角色约束文件管辖，规矩以老大当场指令为准。

---

## 【2026-09-09 派发】WSL2 Linux 验证环境配置（执行人：老大 / 或点将编外 AI）

> **执行方式说明**：老大判断「装 WSL 在 Windows 图形界面点一点比 AI 敲命令快」，故本任务以**要求 + 自检清单**形式给出，谁执行都行（老大自装 / 编外 AI 代装均可）。**WB 不做安装，只负责定要求与验结果。**

> ## ✅ 状态：环境已配置完成（2026-09-09 17:33 老大执行）· WB 复验判定：**合格**
>
> **执行报告见文末 §7**（老大手敲完成，未使用一键脚本——脚本是 WB 事后才生成的）。
> **判定结论**：五项硬要求**全部满足**，行为验收**正反两组都对**（详见 §7 后 WB 复验段）。
> **遗留两个待验项**：① 启动时的网络模式回退告警；② 正向组缺一个 COUNT 数字。→ 见 §7 后「WB 复验与遗留项」。

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

# 5) 【行为验收，不是版本验收】SQLite WAL 并发锁是否真的生效 —— 见下方「一键脚本」
```

#### 一键脚本（推荐，WB 已写入 WSL：`~/wsl-check.sh`）

在 WSL 内执行一条即可，输出同时打到屏幕和文件（WB 直接读文件，不用你粘）：

```bash
bash ~/wsl-check.sh 2>&1 | tee ~/wsl-check.txt
```

**判定标准**：

| 项 | 判据 |
|---|---|
| 第 2 项 | `df -T .` 的 Type **必须是 ext4 / overlay**（9p / drvfs = 不合格） |
| 第 8a 项【反向】 | `busy_timeout=0` + 并发 100 写 → 期望**出现** `database is locked` |
| 第 8b 项【正向】 | `busy_timeout=5s` + 并发 100 写 → 期望**无**报错，且总计数 = 200 |

> ⚠️ **判据修正（WB 2026-09-09 自查发现，勿沿用旧版）**：旧版写的是「无 `database is locked` 报错且计数=200」——**这条是错的**。
> WAL 下并发写，`busy_timeout=0` 时**必然**返回 `SQLITE_BUSY`：这恰恰**证明锁在生效**。若此时反而"零报错"，只说明**压根没竞争上**（并发没起来，或锁没工作）。
> → 因此改为**正反两组**：反向组要看到锁拦人，正向组要看到等待后全部成功。**只有两组都对，才说明这个环境真实反映了 Linux 的锁语义。**

**上表三项任一不过 → 环境不合格**，测出来的数据 DSH-2.5 不能用。

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
2. ⚠️ **必须装在 C 盘（硬要求，不是建议）——绝不要把 WSL 放到 D 盘**：
   - Store / `wsl --install` 装的发行版，`ext4.vhdx` 默认落在 `%LOCALAPPDATA%\Packages\<发行版>\LocalState\`（C 盘）。**保持默认即可，不要 `--export` / `--import` 迁到 D 盘。**
   - **理由（老大提出「D 盘是 VHD」后补）**：若 D 盘确为 VHD，则把 WSL 放上去会形成 **VHD 套 VHD**（NVMe → NTFS → VHD(D:NTFS) → `ext4.vhdx` → ext4）。动态扩展 VHD 的写入需分配块、易碎片，**fsync 延迟被显著放大**。
   - **为什么这条对本项目致命**：DSH-2.5 ① 测的就是 **SQLite WAL + 文件锁的并发行为，它直接受 fsync 延迟影响**。嵌套虚拟层会改变锁竞争的时间窗口 → 测出来的是**存储栈的产物，不是 Linux 的行为**，判定整个作废。**宁可不测，也不能在这种栈上取数。**
   - **即使 D 盘不是 VHD 也一样别迁**：本机 C / D 同属一块物理 NVMe（见下实测），性能无差别，迁移纯属无收益的复杂度。

**澄清一个容易混淆的点**（与 §1.2 的 `/mnt/c` 禁区**不是一回事**）：

- WSL 访问**自己的 ext4**（`~/` 等）走 **virtio-blk / SCSI 直通**到 `ext4.vhdx` 文件 —— **不是 9P**，性能是「NVMe + WSL 一层 VHD」的正常损耗。
- WSL 访问 **`/mnt/c`、`/mnt/d`** 才走 **9P / drvfs** —— 慢，且 POSIX 锁与 WAL 语义不对（§1.2 禁区）。
- → **「`ext4.vhdx` 文件存放在 C 盘」完全没问题；「在 WSL 里读 `/mnt/c` 做验证」才是禁止的。**

**本机存储实测（WB 2026-09-09，`Get-Disk` / `Get-Partition` / CIM `MSFT_Disk`）**：

- 物理磁盘**只有一块**：Disk 0 = `HFS001TEM9X174N`，**NVMe SSD 1 TB**（`Get-PhysicalDisk` MediaType = SSD）。
- **C = Disk 0 分区 3（366 GB，可用 139 GB）／D = Disk 0 分区 5（657 GB，可用 192 GB）**，`Type` 均为 **Basic**。
- 三个查询路径**均未列出任何 VHD 挂载的虚拟磁盘**（若 D 为挂载 VHD，应出现 Disk 1 且 FriendlyName = `Microsoft Virtual Disk`）。
- ⚠️ **与老大「D 盘是 VHD」的描述不符**——**此处存疑，未下结论**。老大可在「磁盘管理」里复核：VHD 挂载盘会显示**蓝色/紫色**图标与 `Microsoft Virtual Disk` 名称。
- **但该疑点不影响决策**：无论 D 是否为 VHD，**结论都是装 C 盘**（是 VHD → 嵌套层污染数据；不是 VHD → 同盘同性能，迁移无收益）。

### 6. 配好之后交给谁

- 把 §3 的输出贴回**本文件**（或发给 WB），WB 据此判定环境是否合格。
- 环境合格后，**DSH-2.5 ① 的实测**由 WB 另派（Trae 或 Claude，届时定），执行方会在**这个环境里**跑，不在 Windows 上跑。
- 若 WSL2 不足以复现目标行为（自检第 5 项过不了，或目标内核特性缺失），**再上 CVM**——决策稿已留此退路，不硬撑。

---

## §7 老大的 WSL 环境配置执行报告（2026-09-09 17:33 · 老大手敲原文）

安装方式：
WSL手动下载（地址：https://github.com/microsoft/WSL/releases/download/2.7.13/wsl.2.7.13.0.x64.msi）
镜像手动下载（地址：https://mirrors.ustc.edu.cn/ubuntu-releases/noble/ubuntu-24.04.4-wsl-amd64.wsl）
手动运行WSL安装包，手动在控制面板启用“适用于 Linux 的 Windows 子系统”，并重启
执行镜像安装命令：wsl --install --from-file D:\Download\ubuntu-24.04.4-wsl-amd64.wsl
安装成功并创建用户成功

WSL和系统检查如下：

命令：cat /proc/version
运行效果：Linux version 6.18.33.2-microsoft-standard-WSL2 (root@f1bbfb02316b) (gcc (GCC) 13.2.0, GNU ld (GNU Binutils) 2.41) #1 SMP PREEMPT_DYNAMIC Thu Jun 18 21:54:43 UTC 2026

命令：uname -r
运行效果：6.18.33.2-microsoft-standard-WSL2

命令：cat /etc/os-release | head -3
运行效果：PRETTY_NAME="Ubuntu 24.04.4 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"

命令：wsl -l -v
运行效果：  NAME            STATE           VERSION
* Ubuntu-24.04    Running         2

命令：wsl --version
运行效果：WSL 版本: 2.7.13.0
内核版本: 6.18.33.2-2
WSLg 版本: 1.0.73.2
MSRDC 版本: 1.2.7214
Direct3D 版本: 1.611.1-81528511
DXCore 版本: 10.0.26100.1-240331-1435.ge-release
Windows: 10.0.26200.9445

命令：cd ~ && df -T . | tail -2
运行效果：Filesystem     Type  1K-blocks    Used  Available Use% Mounted on
/dev/sdd       ext4 1055762868 1368104 1000691292   1% /

然后切换中科大镜像地址成功
grep -rn "mirrors.ustc.edu.cn" /etc/apt/sources.list.d/ /etc/apt/sources.list 2>/dev/null
/etc/apt/sources.list.d/ubuntu.sources:33:URIs: https://mirrors.ustc.edu.cn/ubuntu/
/etc/apt/sources.list.d/ubuntu.sources:41:URIs: https://mirrors.ustc.edu.cn/ubuntu/

命令：sudo apt update
运行效果：更新成功

命令：sudo apt install -y curl git sqlite3 build-essential ca-certificates
运行效果：安装成功

命令：curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
运行效果：失败，开了梯子成功

命令：nvm --version
运行效果：0.40.7

命令： export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
nvm install 22
运行效果：v22.23.2

命令：npm config set registry https://registry.npmmirror.com
npm i -g pnpm@11.7.0
运行效果：added 1 package in 1s
1 package is looking for funding
  run `npm fund` for details

命令：git config --global core.autocrlf input
运行效果：无显示（推测为成功，没理由失败）

命令：配置git身份
运行效果：无显示（推测为成功，没理由失败）

命令：node -v ; pnpm -v ; git --version ; python3 --version
运行效果：v22.23.2
11.7.0
git version 2.43.0
Python 3.12.3

命令：sqlite3 --version
node -e "console.log(process.versions.sqlite)" 2>/dev/null || echo "node 未内建 sqlite，以 better-sqlite3 编译版本为准"
运行效果：3.45.1 2024-01-30 16:01:20 e876e51a0ed5c5b3126f52e532044363a014bc594cfefa87ffb5b82257ccalt1 (64-bit)
3.51.3

命令：cd ~ && mkdir -p sqlite-check && cd sqlite-check
sqlite3 t.db "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS t(id INTEGER PRIMARY KEY, v TEXT);"
for i in $(seq 1 200); do sqlite3 t.db "INSERT INTO t(v) VALUES('row-$i');" & done; wait
sqlite3 t.db "SELECT COUNT(*) FROM t;"
运行效果：没眼看，目测超过一半显示“Error: stepping, database is locked (5)”，

再试

命令：sqlite3 t.db "PRAGMA journal_mode;"
ls -la
运行效果：wal
total 16
drwxr-xr-x 2 sularry sularry 4096 Sep  9 17:59 .
drwxr-x--- 6 sularry sularry 4096 Sep  9 17:56 ..
-rw-r--r-- 1 sularry sularry 8192 Sep  9 17:56 t.db

命令：cd ~/sqlite-check
rm -f t.db t.db-wal t.db-shm
sqlite3 t.db "PRAGMA journal_mode=WAL;"
sqlite3 t.db "CREATE TABLE IF NOT EXISTS t(id INTEGER PRIMARY KEY, v TEXT);"
for i in $(seq 1 200); do sqlite3 t.db "PRAGMA busy_timeout=10000; INSERT INTO t(v) VALUES('row-$i');" & done; wait
sqlite3 t.db "SELECT COUNT(*) FROM t;"
运行效果：全部成功无阻塞


**有一件事情可能需要注意一下，每次启动这个乌班图系统的时候，都会有提示“wsl: 无法配置网络 (networkingMode Nat)，回退到 networkingMode VirtioProxy。”**

---

### WB 复验与遗留项（2026-09-09 18:1x）

**① 判据逐条对照 → 合格**

| 判据 | 老大实测 | 判定 |
|---|---|---|
| WSL 2 | `wsl -l -v` → `Ubuntu-24.04  Running  2`；WSL 版本 2.7.13.0 | ✅ |
| ext4 | `df -T .` → `/dev/sdd  ext4` | ✅（**没踩 `/mnt/c` 坑**） |
| 8a 反向（`timeout=0` 应**出现** locked） | 「目测超过一半显示 `Error: stepping, database is locked (5)`」 | ✅ **锁确实在拦** |
| 8b 正向（`timeout=10s` 应无阻） | 「全部成功无阻塞」 + **老大确认 COUNT = 200**（2026-09-09 18:1x） | ✅（计数正确 = 无写丢失） |

**② 老大那句「没眼看」其实是本次最有价值的证据**

`timeout=0` 下报 `database is locked` **不是失败**，恰恰证明 **WAL 写锁在生效**——**这正是这个环境存在的理由**（Windows 侧 / drvfs 上未必有同样的串行化行为）。

顺带说明：WB 在写一键脚本时**自查发现旧判据写反了**（原写「不得出现 locked」），已改为正反两组。**而老大在实践上已经自己走完了这两组**——他第一次跑出报错没慌，自己加 `PRAGMA busy_timeout=10000` 重跑成功，等于独立复现了正确判据。

**③ 遗留项 1 ——已闭合**

老大确认 8b 正向组 `COUNT = 200`（**🟡 口头确认，未见命令输出**）。计数正确 = **并发写无丢失**，这比"无报错"更关键（写丢失是静默的，报错反而显性）。四项判据至此全部合格。

> 若后续想补 🟢 级证据，一条命令即可：`sqlite3 ~/sqlite-check/t.db "SELECT COUNT(*) FROM t;"`，把输出贴回本节。

**④ 遗留项 2 ——核心目标已验证通过（告警可忽略）**

老大在 WSL 内起了 `python3 -m http.server 8123 --bind 0.0.0.0`，WB 从 Windows 侧实测（2026-09-09 18:1x）：

| 目标地址 | 结果 |
|---|---|
| `http://127.0.0.1:8123/` | ✅ **HTTP 200**，5 ms，`Server: SimpleHTTP/0.6 Python/3.12.3`，body 是 WSL home 目录列表（含 `.bash_history`） |
| `http://localhost:8123/` | ✅ HTTP 200，207 ms（**IPv6 优先解析回落，比 127.0.0.1 慢 40 倍**） |

**结论**：**DSH-2.5 所需的「WSL 内起服务 → Windows 侧访问」成立，`networkingMode Nat` 回退告警不影响 localhost 转发，可忽略。**

**行事规则**：后续测 WSL 内服务一律用 **`127.0.0.1` 而非 `localhost`**（避开 IPv6 回落）。

**⑤ 局域网侧（非阻塞，已停止探测）**

主机 WiFi 为 `WLAN: 172.16.30.87/23`，但从 Windows 侧访问 `172.16.30.87:8123` 超时。WB 排查到两条线索：① 8123 的 Windows 侧监听者是 **`dllhost.exe`**（WSL 端口代理宿主，**不是 python.exe**，故 python 的防火墙入站规则管不到它）；② `WLAN` 网络类别为 **Public**，该 profile 默认阻止入站。

**⑥ 换网后复测 → 结论已定（不是网络问题，是防火墙）**

老大换到新网络后复测，`WLAN` 新地址 **172.24.97.16/24**：

| 目标 | 结果 |
|---|---|
| `127.0.0.1:8123` | ✅ HTTP 200（5 ms） |
| `172.24.97.16:8123`（主机 IP，手机要走的路径） | ❌ 超时（6 s，HTTP 000） |

→ **两个完全不同的网段（企业网 `172.16.30.87/23` 与新网 `172.24.97.16/24`）表现一致：loopback 通、主机 IP 不通。**

**结论（可下定论了）**：与所处网络**无关**。根因是 **Windows 防火墙**——`WLAN` 网络类别为 **Public**（Windows 对新接入 WiFi 的默认归类，换任何新网都一样），Public profile 默认阻止入站；而 8123 的 Windows 侧监听者是 **`dllhost.exe`**（WSL 端口代理宿主），**服务进程（python.exe）的入站允许规则管不到它**。

**若要让局域网设备（手机）访问，需加一条入站规则**（管理员 PowerShell，WB 未执行，由老大决定）：

```powershell
# 给一段端口范围，后续 DSH-3 验 Gateway 也可直接用
New-NetFirewallRule -DisplayName "WSL Ports 8000-9000" -Direction Inbound `
  -Protocol TCP -LocalPort 8000-9000 -Action Allow -Profile Any
```

加完后手机访问：**`http://172.24.97.16:8123/`**

> 注：是否真需要手机访问，取决于 DSH-3 是否要做移动版真机联调。**WSL 环境本身已验收合格**，此项为后续可选能力，不阻塞当前进度。

**⑤ 附带记录（不阻塞，供后续参照）**

- 内核 **6.18.33.2**（远新于预期的 5.15）→ **Landlock 支持基本无悬念**（自 5.13 起），对 DSH-2.5 ③ Linux 侧 sandbox（bwrap→Landlock）是利好。
- **SQLite 两版本差了 6 个小版本**：CLI `3.45.1` vs Node 内嵌 `3.51.3` —— 正好印证 §4 坑 3：「下结论以内嵌版为准」。
- Python 实为 **3.12.3**（派发稿建议 3.11）。现无影响；**若 2.5 ⑤ 要与 `backend` 的 Python 3.11 基准做向量比对，版本差异须纳入考量**（不同 Python 的浮点/随机数行为可能引入噪声）。
- 磁盘：ext4 显示约 1 TB、已用 1.3 GB → 空间充裕，与 §5 预估一致。
