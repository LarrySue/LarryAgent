# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **`DSH-3.7.4·J6` 独立重放** | Claude | **本机 Windows**（同 J6 原地） | 🔵 **已派发 · 进行中** —— 复核 J6 结论「read-only 臂里 `EPERM` 与 marker 都在 ⇒ **无假红**」在**独立重放**下**跨环境可复现**（判据 R1–R5 见下）；⚠️ **不追** R3「`node.exe` 也起不来」那层成因（已延后、工位归 Trae） | 2026-10-08 |
| **DSH-3.5 器材重建**（`landlock_probe.py`） | Claude | **CVM（ABI 4）＋ WSL（ABI 7）** | ✅ **已复验通过（WB 2026-10-08）· 本块闭环** —— 器材入 git；**WB 亲跑 CVM** 正证 `PASS`/0 ＋ 负向 `MASK_REJECTED`/3、归一化后与交付读数逐行相同 ⇒ 器材可用成立（P1–P8 全绿）；⚠️ WSL 未由 WB 复跑（本机 `wsl.exe` 黑名单硬拦，派发稿已预设「如实报未跑」） | 2026-10-08 |

---

## 🔧 DSH-3.5 器材重建：`landlock_probe.py`（2026-10-08 派发）

**背景**：`DSH-3.5` 的 landlock **独立通道器材** `D:\Temp\Sys\claude-wsl-probe\landlock_probe.py` **已确认丢失** —— WB 2026-10-08 五处核查**全部为空**：① Windows `D:\Temp\Sys\claude-wsl-probe\`（目录在、内容空）② WSL `~/claude-probe/` ③ Windows 回收站（`$I` 索引无命中）④ git 全历史（`git log --all --name-only` 无此文件）⑤ CVM 侧（`find ~ -iname '*landlock*'` 仅命中 pnpm 元数据）。⚠️ **正文从未入过库**，历史里只剩一行**描述**（旧版 `log-claude.md:55`：「已升级为 ABI 自适应；新增 `--fs-mask` 负向开关 + `VERDICT=` 机读行；WSL ABI 7 回归通过」）⇒ **只能重建，捞不回来**。

⚠️ **本块只造器材，不做 3.5 的判定**（判定轮工位归 Trae）。

### 0 · 目标

造一件**不依赖 DSH 任何包**、可在 Linux 上跑的 landlock 探针，落到**受版本控制的落点**。

⚠️ **两个结论必须拆开**（本块只覆盖 ①）：
- ① **器材可用**（**本块靶子**）：脚本能跑、能探测 ABI、能出正证、`VERDICT=` 可机读。
- ② **3.5 判据成立**（⛔ **不在本块**）：三档拒绝／提权 ＋ fail-closed 在 CVM 上生效 —— 那要跑**真 DSH**。
⇒ 本块**不得**声称「3.5 sandbox 已验」。

### 1 · 判据（逐条可复跑；每条写「取什么证据」）

| # | 判据 | 取什么证据 |
|---|---|---|
| P1 | **ABI 探测**：调 `LANDLOCK_CREATE_RULESET_VERSION` | 输出里**打印探测到的 ABI 数值** |
| P2 | **正证**：设规则（拒读掩码）→ `restrict_self` 后读被掩码路径 | 观测到 **`EACCES`** |
| P3 | **`--fs-mask` 开关**：能喂**指定** FS 掩码 | 用一条**人工喂高位掩码**的对照复现 `EINVAL`（见 §5） |
| P4 | **`VERDICT=` 机读行** | 输出含一行形如 `VERDICT=…` 的行 |
| P5 | **ABI 自适应「可读性」**：**打印「据此 ABI 声明的掩码位」** | 使「自适应」在**单场地**即可由读数验证（不必只靠跑两个 ABI 佐证） |
| P6 | **落点** = `harness/scripts/cvm-probes/landlock_probe.py` | 该文件入 git（与 `cvm-landlock-verify.mjs` 同目录） |
| P7 | **头部 provenance** | 头注释写明：v1 已丢失（正文从未入库）／本件为**重建**／v1 的历史读数**不用于逐字比对** |
| P8 | **至少一处场地实跑** | 见 §5 场地表；跑不了的那栏如实报「未跑」 |

### 2 · 判据前置（不满足则实验根本没跑起来）

- **场地可达**：CVM `ssh -i ~/.ssh/id_ed25519_cvm ubuntu@49.232.129.252` —— **前台**跑（后台拿不到沙箱放行）。⚠️ 长脚本走 `ssh host 'bash -s' <<'EOF' … EOF`、**首行 `exec 2>&1`** 归一混流，⛔ 别在 `ssh '…'` 里套多层引号。
- **CVM 侧 python 已由 WB 实测就绪（2026-10-08）**：`/usr/bin/python3` = **Python 3.12.3** ／ `import ctypes` **通过** ／ 内核 `6.8.0-124-generic`。⚠️ CVM 裸跑 `node`／`dsh` 不可信（PATH 不含），本块只用 `python3`、不受影响。
- ⛔ **本机 Windows 跑不了** landlock（内核无此 LSM）⇒ 只在 WSL／CVM 跑。
- ⛔ **别把 v1 的读数当对照基线** —— v1 正文不可得，无法比对。

### 3 · 交付物

- **脚本**：`harness/scripts/cvm-probes/landlock_probe.py`（**入 git**）。
- **原始输出**：各场地跑的**输出原样落盘**（⛔ **禁手工整理／意译**），并附**通道四元组**（宿主 shell ／ python 版本 ／ 场地 ／ 探测到的 ABI）。
- **退出码约定**：正证通过 ⇒ 0；探针自身失败 ⇒ 非 0（⛔ 别让 `VERDICT=` 与退出码表达同一件事却不一致）。

### 4 · 参考件四要素（照抄，勿另行转述）

① **路径**：
- `harness/scripts/cvm-probes/cvm-landlock-verify.mjs`（同仓 · **DSH addon 通道** · 5 臂）
- `harness/scripts/cvm-probes/cvm-sqlite-probe.py`（同仓 · python 探针的落点／风格参照）
- **规格** = `TODO.md` 3.5 器材行：`ABI 自适应 + --fs-mask 负向开关 + VERDICT= 机读行`
- **历史读数** = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 前置核查实测回填〉②（WB dry-run 的独立正证）

② **怎么参考**：读码；**抄臂结构** —— `A 写授权目录→应成功` ／ `B 写未授权→应被拒` ／ `C 读未授权→应被拒` ／ `D 读已授权→应成功` ／ `E 网络外联→不受限`（前 4 臂是「拒／许」对照，**D 臂的存在是为证明「不是全都拒」**）。

③ **参考程度**：可抄**形状**（臂的组织与期望值）；可 fork 思路。

④ **不可参考**：⛔ `.mjs` 走 **DSH 自家 addon**（`@deepseek-ai/node-addon-landlock-run`）—— **本件存在的唯一理由就是「不依赖 DSH」**（独立通道）；照搬它 = 毁掉独立通道。⚠️ 其签名／行号锚在特定版本，须在本方实物上复核。
⚠️ **v1 正文不可得** ⇒ 本件是**重写**、不是**恢复**；⛔ 不得声称「与原 v1 一致」。

### 5 · 场地器材

| 场地 | 通道 | ABI | 用途 |
|---|---|---|---|
| **CVM** `ubuntu@49.232.129.252` | `ssh -i ~/.ssh/id_ed25519_cvm`（**前台**） | **4** | **目标场地**（3.5 判定只写这里） |
| **WSL** `Ubuntu-24.04` | 你自己的通道（见下） | **7** | 回归（跑 ABI 自适应路径） |

- ⚠️ **WSL 若进不去（本机 `wsl.exe` 有拦截），如实报「未跑 WSL」** —— 靠 **P5**（打印声明的掩码位）在 **CVM 单场地**验证自适应；⛔ 别为「凑齐两场地」造等价方案。
- ⚠️ **假绿坑（必读，并写进你回报的诚实边界段）**：探针**自设掩码**（拒读）**≠** DSH 的 profile 掩码 —— DSH 的 landlock grants = `readOnly:['/']` ＋ 写白名单（`sandbox-local/src/profiles.ts:32-38`）⇒ **读权限全开、白名单只约束写**。⇒ 探针正证**只证「内核确实强制」**，⛔ **不得读成「DSH 会挡住读敏感文件」**（CVM 非独占、他方 AI 产物在库）。
- ⚠️ **ABI 边界**：**人工喂高位掩码**给低 ABI 内核 ⇒ `create_ruleset` 直接 `EINVAL`（**此条成立**，可当 P3 的对照）—— 但 ⛔ 别据此推断「DSH 在 ABI 4 上会失败」（**DSH 自身按协商 ABI 裁剪掩码**，`main.c:184-189`）。

### 6 · 回报格式

**结论先行** → 逐条 P1–P8 的证据（**命令 ＋ 观测原文**）→ **未闭合项单列** → **自曝**。
⛔「成因未知」是可接受结论，别为叙事完整编一个。⚠️ 按本区**通用纪律 6 条**（通道须注明 ／ 「没有」须附检索式 ／ 自曝优于好看 ／ 未观测不得写成已证 ／ 应红应绿逐件读源码 ／ 收尾必核 `git status`）。

### 7 · 禁区

- ⛔ **不依赖 DSH 的任何 addon／包／模块**（独立通道是本件唯一的存在理由）。
- ⛔ **不做 3.5 判定、不改任何判据**（判定轮工位归 Trae）。
- ⛔ **不落凭据**（本件用不到任何 key）。
- ⛔ **不改 `docs/`**（定案区，WB 处置）；**不改 `TODO.md`**（WB 处置）。
- ⛔ **别把产物放回 `D:\Temp\…`** —— 那个目录被 `docs/test-env.md:280` 标注「**可整目录删，未清**」，**v1 就是这样没的**；重做还放那儿 = 再丢一次。**只落 `harness/scripts/cvm-probes/`**。
- ⛔ 若发现还需别的器材，**报告出来、不扩大范围**。

---

## 📤 DSH-3.5 器材重建：交付回报（2026-10-08 · Claude）

**结论先行**：器材已**重建**并入 git（P6 ✓）：`harness/scripts/cvm-probes/landlock_probe.py`（纯 `python3` ＋ `ctypes`，**零 DSH 依赖**，sha256 `226603df9b76f109ac6d9aab6dd618a4d393985b0d9c3848b577433c657fbbf5`）。**两场地实跑**：**CVM（ABI 4 · 目标场地）`VERDICT=PASS` / exit 0**；**WSL（ABI 7 · 回归）`VERDICT=PASS` / exit 0** ⇒ **本块靶子「器材可用」成立**。⛔ **未做 3.5 判定**（工位归 Trae）；本回报里任何 `PASS` 都只指**器材自证**。

⚠️ 过程中**抓到并修掉一个真缺陷**：初稿把 `IOCTL_DEV` 记为 ABI 4 ⇒ 器材在 CVM 上「自适应」声明出 `0xffff` ⇒ 内核 `EINVAL` ⇒ **目标场地直接 FAIL**。已订正为 **ABI 5**，并把默认路径改成「查表**声明** → 内核**逐位验收** → 用**交集**」（裁剪时**响亮**打印）。原始现场全留：`D:\Code\_claude-evidence\35probe\`（含 `cvm/pre-fix-mask-table-bug/` 三轮 FAIL 现场 + 二分原文 + 内核 UAPI 头原文）。

### P1–P8 逐条证据（命令 ＋ 观测原文）

| # | 命令（两场地同，仅前缀不同：`ssh …'cd ~/ll-probe && …'` ／ `wsl.exe -d Ubuntu-24.04 -- bash -c 'cd ~/ll-probe && …'`） | 观测原文（摘） | 落点 |
|---|---|---|---|
| **P1** | `python3 landlock_probe.py` | CVM：`ABI_PROBE_CALL=landlock_create_ruleset(NULL, 0, LANDLOCK_CREATE_RULESET_VERSION) rc=4 errno=0(0)` ＋ `ABI=4`；WSL：`rc=7` ＋ `ABI=7` | `cvm/r1-default.raw.txt:3-4`、`wsl/r1-default.raw.txt:3-4` |
| **P2** | 同上 | CVM：`PRE_READ[/etc/hostname]=ok`（沙箱前本可读）→ `SANDBOX_BUILD=ok` → `ARM=C … path=/etc/hostname … errno=13(EACCES) MATCH=yes`（`/etc/os-release` 同）＋ `ARM=D … read_granted … rc=0 MATCH=yes`（**不是全拒**）；WSL 同形 | `cvm/r1:31,39,43-45`、`wsl/r1` 同 |
| **P3** | ①`… --fs-mask 0x40000000` ②`… --fs-mask 0xffff` | ①两场地：`NEGCONTROL_MASK=0x40000000 rc=-1 errno=22(EINVAL)` → `VERDICT=MASK_REJECTED`／**exit 3**；②**同参数相反**：CVM `0xffff`→`MASK_REJECTED`(exit 3)、WSL `0xffff`→`PASS`(exit 0) | `cvm/r3`、`cvm/r4`、`wsl/r2`、`wsl/r3` |
| **P4** | 全部轮次 | 每轮末两行：`VERDICT=…` ＋ `VERDICT_REASON=…`；退出码与之一一对应（PASS→0 ／ FAIL→1 ／ MASK_REJECTED→3 ／ ERROR→4，约定写在工件头部表里） | 各 `.raw.txt` 末两行 |
| **P5** | 同上 | `FS_MASK_DECLARED=0x7fff (按 ABI=4 自适应)` ／ WSL `0xffff (按 ABI=7 自适应)` ＋ `FS_MASK_BITS=…`（逐位名）＋ **`FS_BIT_ACCEPT[bit= 0…15 …]=yes/no`** 16 行 ＋ `FS_MASK_KERNEL_ACCEPTED=0x…` ＋ `FS_MASK_CLAMPED=false` | `cvm/r1:5-28`、`wsl/r1:5-28` |
| **P6** | `git ls-files harness/scripts/cvm-probes/landlock_probe.py` | 入 git（与 `cvm-landlock-verify.mjs` 同目录）；⛔ 未落 `D:\Temp\…` | 本仓 |
| **P7** | 读工件头注释 | provenance 段写明：v1 **已丢失**（五处核查全空 ／ 正文从未入过库）／本件为**重写**非恢复／**v1 历史读数不用于逐字比对** | 工件 `:1-20` |
| **P8** | 两场地各 1 次默认跑（共 7 轮） | CVM `CHILD_ARMS_MATCH=5/5` ＋ `CLEANUP_REMOVED=true` ＋ `VERDICT=PASS`；WSL 同 ⇒ **两场地都真跑到了**（无一栏「未跑」） | 见上表 |

**通道四元组**（`P8` 要求）：宿主 shell = **MSYS bash（Windows 11 宿主）**；python = **3.12.3**（两场地一致）；探测到的 ABI = **CVM 4 ／ WSL 7**；场地内核 = `6.8.0-124-generic` ／ `6.18.33.2-microsoft-standard-WSL2`。

### 未闭合项（单列 · 都**未观测**，⛔ 别读成已证）

1. **E 臂（网络）只是观测**，不参与 PASS/FAIL：两场地 `connect_ex=0` 且 `PRE_RESTRICT_connect_ex=0`（同值）⇒ 只说明「本次联网成功且沙箱**未改变**它」；`handled_access_net` **本件不探**（网络位是另一个字段，不在 FS 掩码里）。
2. **ABI ≥ 6 是否另有新增 FS 位**：本件未观测（表声明到 bit15，逐位只探 bit0..15）⇒ 不声明、不臆测。
3. **ABI 5／6 的新增能力（网络位 ／ scope）本件不覆盖** —— 按派发稿「不扩大范围」未做；若 3.5 判定需要，**另报**。
4. **WSL 的 `LSM_LIST=unreadable([Errno 2] …/sys/kernel/security/lsm)`**（该内核未挂 securityfs ⇒ 读不到）；CVM 正常读到 `lockdown,capability,landlock,yama,apparmor`。⇒ **WSL 那条「landlock 在 LSM 链里」本件未从该文件证实**（ABI=7 的 syscall 应答本身是另一条独立证据）。
5. **CVM 上留了一份部署副本** `~/ll-probe/landlock_probe.py`（sha256 与库内件一致）供判定轮直接跑；⛔ **不是判定依据**（判定以库内件 ＋ 本回执证据为准），要清随时可删。

### 自曝

1. **初稿掩码表错（构造性错误，已修）**：`IOCTL_DEV` 记成 ABI 4 ⇒ CVM 上 `0xffff` 被 `EINVAL`。**定位链**（没停在「成因未知」）：二分到单 bit ⇒ `0x7fff` 收／`0x8000` 拒；三处证据一致 —— ① `cvm/bisect-mask-bits.raw.txt`；② `cvm/uapi-header-landlock.raw.txt`（该内核 UAPI 头 `#define` **只到 `1ULL<<14`**，注「网络位 **since ABI 4**」）；③ 仓内 `docs/dsh/dsh-migration.md:1053`。**修法不只是改数字**：新增「逐位内核验收」＋ 响亮裁剪（`FS_MASK_CLAMPED=true DROPPED_BITS=…`）。
   - **可领走的教训**：「**版本号 → 能力位**」是**声明**，只有内核**逐位回答**才是读数；凡「按版本号推能力」的工件都该允许内核反驳。这类错**靠人眼审不出来**（我初稿自己写、自己都没看出来）。
2. **`--fs-mask` 的语义边界**：显式掩码**不裁剪**（喂什么测什么）⇒ `cvm/r2`（`--fs-mask 0x2`）的 `PASS` **不是**「拒读正证」—— 该轮 C 臂被标 `ok(unhandled)` 且 `MATCH=skip`（原文可见）。⛔ 别把 R2 读成「掩码够用」。
3. **假绿坑（照 §5 写进诚实边界）**：本件正证用的是**探针自设掩码**（只授权 scratch ⇒ 其余读/写全拒）**≠** DSH 的 profile 掩码（`readOnly:['/']` ＋ 写白名单 ⇒ **读权限全开**）⇒ 本件正证**只证「内核确实强制」**，⛔ **不得读成「DSH 会挡住读敏感文件」**（CVM 非独占、他方产物在库）。
4. **scratch 回收依赖「父进程未受限」**：landlock 的 `REMOVE_*` 按**父目录**判 ⇒ 受限子进程删不掉 scratch 目录本身。本件用 `fork` ＋ 父进程回收 ⇒ 两场地跑完 `ls -d /tmp/llprobe-* \| wc -l` = **0**。**该坑已写进工件头注释**（防后来者改成「子进程自回收」后留垃圾）。
5. **第一轮 FAIL 的原文已保留**（`cvm/pre-fix-mask-table-bug/`），⛔ 不是噪声、别删：它是「表错 → 目标场地红」的现场，也是本件逐位验收机制**存在理由**的实证。
6. 本块**未使用任何临时 Key、未落任何凭据**（不需要）✓。

**通用纪律 6 条自查**：通道已注明 ✓（CVM 前台 ssh ／ WSL `wsl.exe`）；「没有」附检索式 ✓（残留：`ls -d /tmp/llprobe-* | wc -l` ⇒ 0，两场地；git：`git ls-files` 见 P6）；自曝优于好看 ✓（上 6 条）；未观测不写成已证 ✓（未闭合项 1–5）；应红应绿读源码/读数 ✓（FAIL 未靠猜，二分到单 bit）；收尾核 `git status` ✓（提交见本轮 commit）。

---

## 🔁 `DSH-3.7.4·J6` 独立重放（2026-10-08 派发）

**背景**：`DSH-3.7.4·J6` 的结论是「**read-only 臂里 `EPERM` 与 marker 都在 ⇒ 无假红**」。⚠️ 该结论此前的复核**只做了「原始帧解码」**（WB 解 `tool/result` 原始帧），**未重跑 DSH 会话** ⇒ **重复性维度仍是空白**。本块做**独立重放**：在**本机 Windows**（同 J6 原地）**从零重跑**该会话，判其**跨环境可复现**。

⚠️ **本块边界（⛔ 先钉）**：**只做重放本身** —— ⛔ **不追**「连 `node.exe` 也起不来」那层成因（R3 那半层，**已延后、工位归 Trae**，见 `TODO.md`「延后（低优先 · 待触发）」段）。

### 0 · 目标

用 **J6 装置的范式**在**本机 Windows** 上重跑两臂（唯一变量 = `DSH_PERMISSION_MODE`），复核：
**read-only 臂下 `tool/result` 里 `EPERM` 与 `[sandbox: … under read-only mode]` marker 是否**同时**出现** —— 若在，则**该臂不是假红**（即：失败**伴随**沙箱 marker，而非「被别的机制顶掉、看起来像沙箱拦的」）。

### 1 · 判据（逐条可复跑）

| # | 判据 | 取什么证据 |
|---|---|---|
| **R1** | **两臂都真跑出会话** | 每臂自报 `[dsh-prompt] session=session-…` ＋ `events>0`（⛔ 归属**只认自报 session id**，不按 mtime 分组） |
| **R2** | **A 臂（`workspace-write`）拒绝成立** | 该臂 `tool/result` 含 `EPERM` **且**含 marker `[sandbox: file access denied under workspace-write mode]` |
| **R3** | ⭐ **B 臂（`read-only`）无假红** | 该臂 `tool/result` **同时**含 `EPERM` **且**含 marker `[sandbox: file access denied under read-only mode]` ⇒ **marker 在** ⇒ 不是「被别的机制顶掉」 |
| **R4** | **越界文件两臂均未创建** | `<SBOX>/outside/denied.txt` 两臂跑完**仍不存在**（`EPERM` 是**真拦**、不是写完了才报错） |
| **R5** | **参考项（非判据）** | B 臂是否**复现** `CannotCreateTypeConstrainedLanguage`（J6 观测到 ×2）—— ⚠️ **这是现象、不是判据**；**复现与否都不改「无假红」结论**（`EPERM` ＋ marker 已在） |

### 2 · 判据前置（动手前**实测**、⛔ 勿照抄）

- **场地**：**本机 Windows**（同 J6 原地）。
- **J6 原件（只读参考、⛔ 勿覆盖）**：`D:\Code\_trae-evidence\374\j6\`（装置 ＋ 解码器 ＋ 原始证据全在）。
- **工程 home 只读依赖**：**`.dsh-home/profiles/sdk/`**（**仓根**，非 `harness/.dsh-home`！装置 `cpSync` 它到**临时 home**；⚠️ 其中 `node_modules/@larryagent/plugin-sandbox-dialect` 须在 —— WB 2026-10-08 实测在）。
- **prompt 驱动**：`harness/scripts/dsh-prompt.mjs`（**只认 `DSH_HOME`**；⚠️ **无模式开关** —— 模式由 `DSH_PERMISSION_MODE` 经 profile 自身读取，`dsh-base/cordis.patch.yml:211`）。
- **多帧 zstd**：会话文件 `session.v3.jsonl.zstd` 是**多 frame 串联** ⇒ 用 J6 的 `dump-toolresult.mjs`（按 magic `28 B5 2F FD` 切分逐帧解），**或**仓内现成 `harness/tests/s0-session-log.ts`（`node` 自带 `zstdDecompressSync`，WB 实测可用）。
- **⚠️ Key（本机无 `.dsh-home/.credentials.yaml`）**：真会话需要 key ⇒ 从 `backend/config.yaml` 的 `models.deepseek.api_key`（`:16`，WB 实测**非空**）读入 **`DEEPSEEK_API_KEY` env 一次性注入**（装置只透传 env）；⛔ **不打印、不落盘、不写进回报**。⚠️ **若本机无可用 key**（env 空 ／ 该值为空 ／ 已失效 ⇒ 会话报 `AUTH` ／ `MISSING_CREDENTIAL`），**如实报「无可用 key、无法跑真会话」**，⛔ **别伪造绿灯** —— 本块**顺延等 key**。
- **⚠️ 装置 `OUT` 常量指向原件目录** —— 重放**必须先把 `OUT` 改到新目录**，⛔ **不得覆盖 `_trae-evidence/374/j6/dsh/`**。

### 3 · 交付物

- **重放装置**：复制 `run-j6-dsh.mjs` 并把 `OUT` 改指新目录（`D:\Code\_claude-evidence\374j6-replay\`），两臂与 prompt **保留原样**。
- **原始输出**：两臂 `stdout`／`stderr` ＋ 解码后的 `tool/result` **原文**（⛔ 禁手工整理／意译），附**通道四元组**（宿主 shell ／ node 版本 ／ 场地 ／ 越界目标路径）。
- **比对表**：重放读数 **vs** J6 原文（`...\374\j6\dsh\J6-toolresult.raw.txt`）**逐词命中**比对（同 `dump-toolresult.mjs` 的 7 个词）。

### 4 · 参考件四要素（照抄，勿另行转述）

① **路径**：
- `D:\Code\_trae-evidence\374\j6\run-j6-dsh.mjs`（**装置本体** · 两臂 `['workspace-write','read-only']` · 唯一变量 `DSH_PERMISSION_MODE` · 临时 home = `cpSync` 复制 `.dsh-home/profiles/sdk` · **不跑 pnpm ／ 不碰工程 home ／ 不切 patch**；工作区 `<SBOX_ROOT>/ws`，越界目标 `<SBOX_ROOT>/outside/denied.txt`）
- `D:\Code\_trae-evidence\374\j6\dump-toolresult.mjs`（**多帧 zstd 解码器**）；仓内替代 = `harness/tests/s0-session-log.ts`
- `D:\Code\_trae-evidence\374\j6\dsh\J6-toolresult.raw.txt`（**J6 两臂原文** —— 预期基线：A 臂 `EPERM` ＋ workspace-write marker；B 臂 `CannotCreateTypeConstrainedLanguage`×2 ＋ **`EPERM` 照旧** ＋ read-only marker）
- **判据权威落点** = `archive/roadmap-history.md` 的 `##### DSH-3.7.4` ／ `##### DSH-3.7.4-T`

② **怎么参考**：读码；**抄两臂结构与 prompt**（`PROMPT` 原样照抄）；复现后**逐字段与 J6 原文比对**。

③ **参考程度**：可 fork 思路 ／ 可照抄 prompt 与臂结构。

④ **不可参考**：⛔ 装置结论**取自 `917f45d` 版树**（基线 `917f45d` ／ `d808b60`）⇒ **不得当"当前版本"外推**（本次重放**如实记当前树**，与基线**并列留痕、不合并**）；⛔ 别把本块扩成 R3 成因追查。

### 5 · 场地器材

| 场地 | 通道 | 用途 |
|---|---|---|
| **本机 Windows** | Bash ／ node（装置内用 `process.execPath`） | **重放场地**（J6 原地） |
| CVM ／ WSL | —— | ⛔ **不参与**（本块是 Windows 方言件重放） |

### 6 · 回报格式

**结论先行** → 逐条 **R1–R5** 证据（**命令 ＋ 观测原文**）→ **与 J6 原文的比对表** → **未闭合项单列** → **自曝**。
⛔「成因未知」是可接受结论，别为叙事完整编一个。⚠️ 按本区**通用纪律 6 条**（通道须注明 ／ 「没有」须附检索式 ／ 自曝优于好看 ／ 未观测不得写成已证 ／ 应红应绿逐件读源码 ／ 收尾必核 `git status`）。

### 7 · 禁区

- ⛔ **不改工程 home `.dsh-home`**（用**临时 home**）。
- ⛔ **不切 patch**、⛔ **不跑 pnpm**、⛔ **不动 `_trae-evidence/374/j6/` 原件**（只读参考；`OUT` 必须改指新目录）。
- ⛔ **key 零落盘、零打印**（回报里不得出现 key 或其片段）。
- ⛔ **不追 R3「`node.exe` 也起不来」那层成因**（已延后、工位归 Trae）。
- ⛔ **不改 `docs/`**（定案区，WB 处置）；**不改 `TODO.md`**（WB 处置）；**不改判据**（判据落点 = 归档区 `##### DSH-3.7.4` ＋ 本稿 §1）。
- ⛔ **不做 3.5 判定**（工位归 Trae）；⛔ 若发现还需别的器材，**报告出来、不扩大范围**。

---
