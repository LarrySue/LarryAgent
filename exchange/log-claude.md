# Claude 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 2026-09-12 WSL 能力边界探测（老大派发：WSL 将长期担任核心测试环境）

**结论先行**：WSL（Ubuntu-24.04 / WSL2 / 内核 6.18.33.2-2 / WSL 2.7.13.0）我这边**能完整操作**——非交互进入、直达 root、双向读写、apt 装包、造文件系统与 loop 挂载、建 userns/netns 隔离、起服务并被 Windows 侧访问、长任务后台跑后轮询。环境本身已具备测试底座（**Linux node v22.23.2 + pnpm 11.7.0，与 harness 的 `packageManager: pnpm@11.7.0` 精确匹配**；另有 Python 3.12 / git 2.43 / gcc）。
主要风险不在"能不能"，而在**几个会静默出错的坑**（§1 坑1-3、§3 坑4）。

### 1. 入口与执行（范式）
| 项 | 实测 |
|---|---|
| 进入 | `wsl.exe -d Ubuntu-24.04 -- <cmd>`；默认用户 sularry(uid1000, sudo 组)；`-u root` **免密**直达 root；退出码透传；stdin 可喂脚本；**无 TTY**（tty0/tty1 均 no） |
| 工作目录 | `--cd /path` 可指定；**未指定时继承 Windows 当前目录**（从仓库目录调用 → 落在 `/mnt/d/Code/LarryAgent`） |
| 稳定范式 | `MSYS_NO_PATHCONV=1 wsl.exe -d Ubuntu-24.04 -- bash -s <<'EOF' … EOF`，脚本体首行 `exec 2>&1` |
| 坑1 | MSYS 会改写参数里的 POSIX 路径：`… -- ls /home` 实际执行 `ls D:/App/Git/home` → 必须 `MSYS_NO_PATHCONV=1` |
| 坑2 | wsl.exe 的 stdout/stderr 混流会**损坏输出**（trace 与正常行互相吞字、顺序错乱）→ 脚本首行 `exec 2>&1` 归一 |
| 坑3 | cwd 继承 + 路径改写的组合拳曾让我把探测文件建进**仓库根**（f1.txt/hard1/link1/sparse.bin，均未跟踪），**已 rm 删除、仓库复查干净**。教训：WSL 侧动手前先显式 cd 到自建目录 |

### 2. 文件系统
- 双向互通：Windows 侧 `\\wsl.localhost\Ubuntu-24.04\…` 可读；WSL 侧 `/mnt/c|d` 可读写（drvfs/9p，uid=1000，mode=777）。
- ext4（`/`，空闲 954G）：符号链接/硬链接/稀疏文件/权限位全正常；写 64MB+fsync ≈ 1.1 GB/s。
- **/mnt/d 三个硬限制**：① **大小写不敏感**（`CaseProbe.txt` 用小写文件名可读）；② **约 6 倍慢**（同法 188 MB/s，小文件差距更大）；③ **收不到 Windows 侧写入的 inotify 事件**（ext4 对照组正常收到）。
- git 视图：仓库已配 `core.filemode=false` + `core.autocrlf=input`，WSL 内 `git status` 干净无噪声——这项防御已到位。
- 临时目录：WSL 内 `tempfile.gettempdir()` = `/tmp`（ext4）。**CLAUDE.md 运维约定里的 `D:\Temp\Sys\larry_test_*` 是 Windows 侧口径，WSL 侧是 /tmp**，将来两边排查别找错地方。

### 3. 工具链
- 已有：Python 3.12.3、**Linux node v22.23.2 / npm 10.9.8 / pnpm 11.7.0 / corepack**（nvm 装于 `~/.nvm`，npm registry 指向 npmmirror）、git 2.43.0、gcc、make、sqlite3、curl。
- 我本次补装（apt，root，微小可逆）：python3-venv / python3-pip / jq / inotify-tools。
- 缺：docker / podman / bwrap / strace / uv；系统级无 pip（venv 内 pip 24.0 可用）。
- **坑4（最容易踩）**：Windows PATH 被注入 WSL（30 条 `/mnt/*`），裸跑 `node|npm|pnpm` 命中的是 **Windows 版**（interop），报错形式还很误导（如 `pnpm: exec: node: not found`、corepack `cannot execute`）。必须显式 `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:/usr/bin:/bin"` 或用绝对路径；非登录/非交互 shell **都不加载 nvm**。

### 4. 沙箱与内核（未来 DSH / sandbox 测试的关键）
- **Landlock ABI 7 且强制生效已正证**：设 `PR_SET_NO_NEW_PRIVS` 后 `restrict_self` 返回成功，随后读 `/etc/hostname` 被 EACCES 拒绝。（细节：restrict_self 前必须先 no_new_privs，否则 EPERM——探测脚本初版正是踩了这个）
- userns + netns 可用（`unshare -Urn` 成功，ns 内 uid=0）；ns 内起 loopback HTTP 服务可访问（200）→ **可做网络隔离的封闭测试**。
- cgroup v2 控制器齐全（cpuset/cpu/io/memory/hugetlb/pids/rdma）；systemd 作 PID1 且 running；当前进程已带 1 个 seccomp 过滤器（Seccomp:2），常规操作未被挡。
- root 能力：写 `/etc`、`mkfs.ext4` + loop 挂载（可造真文件系统）、chown 等均通。
- 权限墙正常：root 建的 600 文件普通用户读写被拒（但目录属主仍可删该文件，Unix 语义如此）。
- `sudo` 在 WSL 内**要密码**；要 root 只能从 Windows 侧 `wsl -u root` 进（这是我这条通道的特有能力）。

### 5. 网络
- 出网正常（registry.npmjs.org / pypi.org / api.github.com 全 200）；DNS = 宿主 LAN 网关。
- **实测网络形态是宿主网卡镜像，而非 NAT**：WSL 内网卡即宿主 LAN 网段地址（192.168.1.x/24，具体地址略）。WSL 启动告警里那句 "networkingMode Nat + localhost 代理未镜像" 与实际表现**不符**，请老大/WB 留意。WSL 内无 proxy 环境变量；Windows 侧 git 用 `socks5://127.0.0.1:7890`，未继承进 WSL。
- **Windows → WSL 的 localhost 转发可用**：WSL 内绑 `0.0.0.0:18777` 起服务，Windows 侧 `http://localhost:18777/` 拿到 200 → 跨边界集成测试可行。
- 安全边界提示：因共享宿主网卡，WSL 内绑 `0.0.0.0` 的服务等于暴露在局域网。

### 6. 进程与长任务
- `setsid nohup … < /dev/null &` 起的后台进程在 wsl.exe 退出后**存活**（复入 pid 不变），可配合我的后台运行能力跑长测试再轮询。
- 清理注意：`pkill -f "<pattern>"` 会匹配到自己所在的 `bash -c` 命令行而**自杀**（本次实测 exit 15），用 `pkill -f "[h]ttp\.server"` 括号技巧规避。

### 7. 我本次的落盘与残留（可随时全清）
- WSL 内：`~/claude-probe/`（附 `README-claude-probe.txt` 说明牌；含探测用链接/稀疏文件/16MB 镜像/venv/日志）
- Windows 内：`D:\Temp\Sys\claude-wsl-probe\`（`landlock_probe.py` + 几个探测文件）
- WSL 家目录既有的 `sqlite-check`、`wsl-check.sh`（Sep 9 创建，非我）**未动**；仓库零残留。

### 8. 建议（供老大裁定，我不擅自行动）
1. 未来 WSL 侧正式测试工作区建议放 **ext4 内**（如 `~/work/LarryAgent`，由 git 同步），不要直接在 `/mnt/d` 上跑——inotify 缺失 + 大小写不敏感 + 6x 慢，三条都会让测试结果不可信或难诊断。
2. 是否需要我把上述范式固化成脚本（PATH 净化 + `exec 2>&1` + `MSYS_NO_PATHCONV` + cd 白名单）？落盘位置请指定（我默认只写 exchange/ 与项目代码）。
3. 待派发：WSL 侧具体承载哪类测试（DSH sandbox / landlock 行为 / harness 冒烟 / LarryAgent 单测）。

---

## 2026-09-12 跨 AI 轻量交流通道提案（老大诉求：少经老大传话）

**诉求**：老大反复人工传话（"claude 你看一眼某文件更新了"）成本高，希望 AI 之间能直接做轻量交流。

**现状盘点**：`exchange/` 已是"文件即总线"，缺的**不是介质，是叫醒**：
- 我方（Claude Code）：仓库 `.claude/` 目前**无 hooks**；我的自主唤醒上限 = ① 老大发消息 ② 会话存活时的定时任务。此外我叫不醒自己，也推不动别人。
- 他方：WB 有独立 app 与脚本能力（其记忆自述对 WSL 有只读复验通道）；Trae/Marvis/Qoder 属 IDE/宿主驱动，能否自动轮询由各自宿主决定——**我改不了别人的文件，也装不了别人的钩子**。

**提案（轻重两级）**
- **A 级（零安装，建议先做）**
  1. 新增 `exchange/board.md` 公共留言板：**只追加**、条目格式 `[时间][AI名] 内容`、不删改他人条目（沿用 README 现有归属原则与 WB 整理权）。
  2. 我侧加 hook：`UserPromptSubmit`（+`SessionStart`）自动把"上次已读之后的新条目"注入上下文 → **老大不必再传话，我自然看见**；已读位点用 `.claude/` 下游标文件记录。
  3. 需要时开**低频** session cron（如 15 分钟）主动看板回帖——代价：会话须开着 + 每 tick 耗 token；按项目成本敏感原则**按需开、不长开**。
  4. 其他 AI 加"开工先看 board"规则（需老大/WB 裁定，我无权改他人文件）。
- **B 级（后续，按需）**：WSL 里起常驻信箱 / 协作服务（真推送语义：未读数、@提及、在线状态）。Agorai（MCP+CLI 多 AI 协作层）与 SynapticLathe（多 worker 调度，内置 claude/codex profile）属这一类；**它们提供"房间"，不提供"叫醒"**。等 A 级证明确有推送/编排需求再上，且先在我的 WSL 隔离目录试跑，不直接接项目仓库。

**待裁定（我不擅自决定）**
1. 留言板落点与命名：`exchange/board.md` 可否？（我倾向就它）
2. 我侧 hook 落盘位置：项目级 `.claude/settings.json`（**超出我"只写 exchange/ + 项目代码"的默认边界，需特批**）还是用户级 `~/.claude/settings.json`？
3. 是否要做 A 级原型（board 骨架 + hook + README 协作规则补一条）。
