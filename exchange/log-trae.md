# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.5 判定轮** | Trae | **CVM（landlock ABI 4）** | 🔵 **已派发 · 进行中** —— 真 DSH 复核 sandbox **三档**（read-only ／ workspace-write ／ danger-full-access）拒绝与提权 ＋ **fail-closed**（判据 J1–J7 见下）；器材（独立通道）已就绪 = `harness/scripts/cvm-probes/landlock_probe.py` | 2026-10-08 |
| **DSH-3.4** | Trae | **本机（Windows）** | ✅ **已收官（老大 2026-09-30 裁 3.4 收口）** —— J1–J8 全判 **PASS**（J1 3／3 ／ J2 2／2 ／ J3 阈值双跑 15999 不压·16000 压 ／ J4 三条证据齐 ／ J5 近文原文保留 ／ J6 三态可分 ／ J7 fail-closed ／ J8 成本）；判定 = **（甲）机制成立**；**（乙）产品可接受 ⛔ 不判**（只采数）。**WB 复验成立（含独立测试件 `DSH-3.4-T` 交叉验证）** | 2026-09-29 |

- **判据、边界与遗留的权威落点 = `docs/dsh/dsh-migration.md` §3.6 ＋ 完成态快照 `archive/roadmap-history.md`「DSH-3.4」段**（原写「`TODO.md`「DSH-3.4」段 ＋ §3.6」**一处两面**；其中 `TODO.md` 侧已于 2026-10-01 归档）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯时用 `git log -p -- exchange/log-trae.md`。
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.2.1 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— ⛔ **本条后半句已作废（2026-09-20 WB 复验实测推翻）**：原文写「本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，**出现英文即非本机原始产物**）」—— **「出现英文即非本机产物」不成立**：本机实测 `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统／用户 UI 语言实测是 zh-CN）。⇒ **保留前半**（⛔ 不得人工改写 ／ 意译），**撤掉后半的推论**。**替代纪律**：判「原文」只认**字节级**核对（按 ACP 936 解 GBK，或直接比原始字节），并**注明该段取自哪条通道**；**语言 ／ 编码不得作"证据是否被后处理"的判据**。详见 `docs/local-env.md` §12.6。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

## 🔧 DSH-3.5 判定轮：真 DSH 复核 sandbox 三档 ＋ fail-closed（2026-10-08 派发）

**背景**：`DSH-3.5` 的**器材**已就绪 —— `landlock_probe.py` 重建后经 **WB 复验 P1–P8 全绿**（规格 ＋ 验收态登记 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 · S3 sandbox 器材：`landlock_probe.py` 登记〉）。本块是**判定轮** —— 在 **CVM（landlock ABI 4）** 上跑**真 DSH**，把 3.5 的判据**落到读数上**。

⚠️ **两条结论必须拆开**（器材正证**不**替代本块）：
- ① **器材可用**（**已完成**，非本块靶子）—— 探针**自设掩码**只证「内核强制」，⛔ 与 DSH 的 profile 语义**不是一回事**（DSH 读权限**全开**）。
- ② **3.5 判据成立**（**本块靶子**）—— 三档拒绝／提权 ＋ fail-closed 在**真 DSH** 上生效。

### 0 · 目标

在 CVM 上用**真 DSH**（`0.1.5-rc.2` ／ ABI 4 ／ landlock rung）复核四件事：
1. **sandbox ruleset 在 CVM 上建立成功**（非 `SANDBOX_UNAVAILABLE`）；
2. **三档**（`read-only` ／ `workspace-write` ／ `danger-full-access`）**各自的拒绝边界互不相同**；
3. **提权流程**的**可观测表现**；
4. **fail 形态 = fail-closed**（runner 不可用 ⇒ 命令**绝不静默裸跑**）。

### 1 · 判据（逐条可复跑；每条写「取什么证据」）

| # | 判据 | 取什么证据 |
|---|---|---|
| **J1** | **ruleset 建立成功** | 真 DSH 会话里发一次**越界写** ⇒ **被拒**（⇒ 沙箱**确实生效**，非 unavailable） |
| **J2** | **`read-only` 档拒绝** | 该档下越界写被拒：错误串（`EPERM`）＋ marker `[sandbox: … under read-only mode]` |
| **J3** | **`workspace-write` 档边界（双锚）** | **工作区内写成功** ＋ **越界写被拒** ⇒ 证「**不是全拒、也不是全放**」 |
| **J4** | **`danger-full-access` 档放行** | 同一越界写**成功** ⇒ 与 J2／J3 **互不相同**（三档非恒同） |
| **J5** | **提权路径可观测** | 被拒输出里出现升权提示（`sandbox: escalation available — …`）；**按提示重试**的结果须与**答者语义**一致（无答者 ⇒ `unavailable` ＋ 动作 **0** 次 = fail-closed 之一种）——⛔ **两半分别报、不合并** |
| **J6** | **fail-closed 复核** | 构造「runner 不可用」⇒ 观测 `SANDBOX_UNAVAILABLE`（`dsh-sandbox-local/README.md:57`）／`exit 125` 且**不 exec**（`node-addon-system/src/main.c:23-28`）；⛔ **不得 fail-open**（命令静默裸跑）。⚠️ **构造方式自定并写进回报**；若 CVM 上**无法**构造（landlock 天然可用），**如实报「未构造成功」**，该条以**源码锚作降级证据**，⛔ **不得写成「已上机复核」** |
| **J7** | **负向对照（≥1 条）** | 破坏一条判据（如把 `DSH_PERMISSION_MODE` 设成无效值 ／ 把 workspaceRoot 指错）⇒ **看它变红**。不做则「真通了」与「判据没生效」**不可区分** |

⚠️ **判据不预设结论**：下面三条源码锚只给**期望**，**读数才是结论** —— `main.c:23-28`（fail-closed）／ `README.md:57`（`SANDBOX_UNAVAILABLE`）／ `dsh-base/cordis.patch.yml:204-240`（三档 preset 映射）。

### 2 · 判据前置（不满足则实验根本没跑起来）

- **场地**：CVM `ssh -i ~/.ssh/id_ed25519_cvm ubuntu@49.232.129.252` —— **前台**跑（⛔ 后台拿不到沙箱放行）。⚠️ 长脚本走 `ssh host 'bash -s' <<'EOF' … EOF`、**首行 `exec 2>&1`** 归一混流，⛔ 别在 `ssh '…'` 里套多层引号。
- ⚠️ **WB 2026-10-08 实测前提（动手前**重新核**、⛔ 勿照抄旧登记）**：
  - **工程 home = `~/.dsh`**（凭据 `~/.dsh/.credentials.yaml` 在此，223 B）；**`~/.dsh-home` 不存在**；`~/larry-dsh-home` 是**已退役**对照件（其 `profiles/sdk` 已改名 `sdk.bak.20260922-0948`）——⛔ **别拿它当运行 home**（无 key 假绿）。
  - **`~/.dsh/profiles/sdk/cordis.patch.yml` = 空 `[]`**（stock）⇒ **官方 sandbox 默认启用、无 override**。⚠️ **与本机 Windows 相反**（本机 `.dsh-home` 里 `sandbox` 被 `disabled: true`、改挂 `sandbox-dialect`）⇒ **本块跑的是官方 sandbox，姿势不得照抄本机**。
  - ⭐ **可复用（CVM 侧已有）✓**：`~/harness/scripts/dsh-prompt.mjs`（prompt 驱动，1303 B）；`~/harness/tests/s0-session-log.ts`（**多帧 zstd 回读器** —— 会话 `.zstd` 是**多 zstd frame 串联**，`zstdDecompressSync` **只解第一帧** ⇒ 须按 magic `28 B5 2F FD` 切分逐帧解；⚠️ 归属只认 run 自报的 `[dsh-prompt] session=…`，⛔ 不按 mtime 分组）；`~/harness/tests/scan-keys.ts`（密文扫描）。
  - ⚠️ **CVM 侧缺 ✗**：`~/harness/scripts/cvm-probes/cvm-landlock-verify.mjs` **不在 CVM**（CVM `cvm-probes/` 只有 8 件 `.sh`/`.mjs`）；`run-372-dialect-e2e.mjs` 亦不在（Windows 专用）。⇒ 需要就**先同步**。
  - **`~/harness` 无 `.git`**（手工同步副本）⇒ 本块改动**不入库**，回传由你负责。
  - **裸跑 `node`／`dsh` 不可信**（非登录 shell PATH 不含 `~/node/bin`）⇒ 用 **`export PATH=$HOME/node/bin:$PATH`** 或绝对路径。实测：不带 PATH 时 `~/harness/node_modules/.bin/dsh --version` 报 `exec: node: not found`；带 PATH 时 = **`0.1.5-rc.2`**。
  - **`bwrap` 不存在**（`command -v bwrap` 空）⇒ **永远只走 landlock rung**；`~/harness/node_modules/.pnpm/@deepseek-ai+dsh-sandbox-local@0.1.5-rc.2_…` 在落点树 ✓。⚠️ **⛔ 不装 bwrap**（装了也起不来：`apparmor_restrict_unprivileged_userns=1`）。
  - **ABI = 4**（`ctypes` syscall 444 实测）。
- **Key**：CVM `~/.dsh/.credentials.yaml` 已就位（真会话由它取凭据）⇒ ⛔ **不要把 key 落盘／打印／写进回报**；若从 env 注入，走 `DEEPSEEK_API_KEY`、**不打印**。
- **模式开关**：`DSH_PERMISSION_MODE`（`dsh-base/cordis.patch.yml:211`）＝ `read-only` ／ `workspace-write` ／ **`danger-full-access`**（⚠️ 第三档**字面值是 `danger-full-access`**，不是 `danger`）。
- ⛔ **别把本机 Windows 的 J6 结论当 CVM 前提**（方言 ／ rung ／ ABI 均不同）。

### 3 · 交付物

- **装置**：可复跑脚本（放 `~/harness/scripts/`，本块范围内）；**头部一行「姿势自证」**（模拟哪条真实链路：哪个 home ＋ profile ＋ 通道 ＋ ABI）。
- **原始输出**：各档 ／ 各臂输出**原样落盘**（⛔ 禁手工整理／意译），附**通道四元组**（宿主 shell ／ node 版本 ／ 场地 ／ ABI）。
- **证据归档**：`D:\Code\_trae-evidence\35\`（沿用 `374` 的命名习惯）。

### 4 · 参考件四要素（照抄，勿另行转述）

① **路径**：
- `harness/scripts/cvm-probes/cvm-landlock-verify.mjs`（同仓 · **DSH addon 通道** · 5 臂 —— ⚠️ **不在 CVM**，须先同步）
- `harness/scripts/cvm-probes/landlock_probe.py`（同仓 · **独立通道**器材；规格 ＋ 验收态 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 · S3 sandbox 器材登记〉）
- `harness/scripts/dsh-prompt.mjs`（同仓 · client 同源 SDK 通道；**只认 `DSH_HOME`**，⚠️ **无模式开关**）
- `D:\Code\_trae-evidence\374\j6\run-j6-dsh.mjs` ＋ `dump-toolresult.mjs`（**J6 装置 ＋ 多帧解码器**，可作本块装置范式）
- **判据权威落点** = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 · S3 sandbox：CVM 前置核查实测回填〉＋ 本稿 §1

② **怎么参考**：读码；**抄臂结构**（一档一臂、唯一变量 = `DSH_PERMISSION_MODE`；每臂用**临时 home**、`cpSync` 复制 `profiles/sdk`、**不跑 pnpm、不碰工程 home、不切 patch**）。

③ **参考程度**：可抄**形状**（臂组织 ／ 期望值 ／ 临时 home 隔离）；可 fork 思路。

④ **不可参考**：
- ⛔ `~/harness/scripts/sandbox-probe/sandbox-denial-probe.mjs` —— 该件头注释自述「**本机 Windows**」、用 `USERPROFILE`／`C:\Windows\…`（**Windows 探针被搬到 Linux 机**），**勿当 CVM 器材直接跑**。
- ⛔ `.mjs` 走 **DSH 自家 addon** 的写法**不构成独立通道**；「独立通道」这条由 `landlock_probe.py` 承担，别把两者混为一谈。

### 5 · 场地器材

| 场地 | 通道 | ABI | 用途 |
|---|---|---|---|
| **CVM** `ubuntu@49.232.129.252` | `ssh -i ~/.ssh/id_ed25519_cvm`（**前台**） | **4** | **判定场地**（3.5 判定只写这里） |
| 本机 Windows | —— | — | ⛔ **不参与**（方言 ／ rung ／ ABI 均不同） |

- ⚠️ **ABI 边界**：CVM = **4** ／ WSL = **7** ⇒ **判定只能写在 CVM、不得互搬**；且 ⛔ 不得把「**人工喂高位掩码** ⇒ `EINVAL`」读成「DSH 在 ABI 4 上会失败」（DSH 按协商 ABI 裁剪掩码，`main.c:184-189`）。
- ⚠️ **CVM 非独占**（他方 AI 产物在库）／**机器 2026-10-09 到期** ⇒ 产出**不得是唯一副本**（回传见 3.9 核对表）。

### 6 · 回报格式

**结论先行** → 逐条 **J1–J7** 证据（**命令 ＋ 观测原文**）→ **未闭合项单列** → **自曝**。
⛔「成因未知」是可接受结论，别为叙事完整编一个。⚠️ 按本区**通用纪律 9 条**（前提会失效须重测 ／ 改树必实跑 ／ 判失败前先验通道 ／ 「没有」附检索式 ／ 判据改动须实跑 ／ 收尾核 `git status` ／ 自加判据先自证 ／ 原文不得意译 ／ 以运行自报标识为准）。

### 7 · 禁区

- ⛔ **不动主机 AppArmor**（`kernel.apparmor_restrict_unprivileged_userns` 保持 `1` —— 老大 2026-09-23 已裁「接受降档」）；⛔ **不装 `bwrap`**。
- ⛔ **不碰工程 home `~/.dsh`**（用**临时 home** 作装置；⚠️ 观测类动作也会触发 heal **改写回退层**）。
- ⛔ **不落凭据**（key 零落盘、零打印）。
- ⛔ **不改 `docs/`**（定案区，WB 处置）；**不改 `TODO.md`**（WB 处置）；**不改判据**（判据落点 = §3.6 ＋ 本稿 §1）。
- ⛔ **不为「凑三档」造等价方案** —— 某档若在 CVM 上跑不出预期（如 `danger-full-access` 语义不明），**如实报**、不臆测。
- ⛔ 若发现还需别的器材，**报告出来、不扩大范围**。

---

## 🗂 已清理段落（按交流区规矩）

- **2026-09-30 清理**：删除 `DSH-3.4` 的**派发稿 ＋ 三份回报**（`📤 DSH-3.4 · S2 compaction 接入` 全套 8 节 ／ `进度回报（进行中）` 全套 ／ `回报（J1–J8 全判）` 全套含 §6 采数 ／ §10 自曝 ／ §11 未闭合项）—— **已闭环并收口（老大 2026-09-30 裁「3.4 已完成并收口」）** ⇒ **权威落点**：判据 ／ 边界 ／ 遗留 = `TODO.md`「DSH-3.4」段（⚠️ **该段已于 2026-10-01 归档** ⇒ 现指 `docs/dsh/dsh-migration.md` §3.6 ＋ `archive/roadmap-history.md`「DSH-3.4」段）；机制与口径 = `docs/dsh/dsh-migration.md` §3.6〈判据口径四条〉／〈测试量级阶梯与预算〉；产品观察项 = 同稿 §3.6 ⑦。**§11 五条未闭合项的处置**：① orphaned lock 未观测 ② L4／L5 不覆盖 ③ J2 原文口径不可执行 ④ `(ii)` 另一路径未观测 ⑤ J5 保留量 +6.4% 未正面验证吸附 —— **均属"派发稿边界声明"**，作用为**限定结论适用边界**；该边界已随结论写进 `dsh-migration.md` §3.6 ⑦「基线结论状态 = 参考」（⛔ 不得跨版本外推）⇒ **无孤儿结论**。装置缺陷（`run-34t-probe.mjs` 每臂不回收 home）**已于清理前转登 `TODO.md`「DSH-3.4」段**。回溯：`git log -p -- exchange/log-trae.md`。

---
