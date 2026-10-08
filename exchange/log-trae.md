# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.5 判定轮** | Trae | **CVM（landlock ABI 4）** | ✅ **回报已交（2026-10-08）** —— J1–J7 **全判 PASS**（三档边界互异 ＋ 提权双层可观测 ＋ fail-closed 构造成功非降级 ＋ J7 负向红）；1 观察项如实登记（`SANDBOX_UNAVAILABLE` code 字面值不落 session 日志，判定不依赖）；证据已回传 `D:\Code\_trae-evidence\35\`（CVM 10-09 到期，非唯一副本 ✓） | 2026-10-08 |
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

## 📤 DSH-3.5 判定轮回报（J1–J7 全判 · 2026-10-08）

### 结论（先行）

**J1–J7 全部 PASS，无降级判定**。真 DSH（`0.1.5-rc.2`）在 CVM（landlock **ABI 4**，bwrap 缺席 ⇒ rung=landlock，enforcement=**partial**）上：三档拒绝边界**互不相同**；提权流程**双层可观测**（tool result 文本 ＋ session `approval/asked→decided` 结构化帧）；**fail-closed 构造成功**（非「未构造成功」降级路径）；J7 负向对照**变红**且归因明确。1 个观察项如实登记（§ 未闭合项 ①，不影响判定）。

**通道四元组**：宿主 shell = Ubuntu CVM 前台 ssh（`ubuntu@49.232.129.252`，kernel `6.8.0-124-generic`）／ node `v22.22.2` ／ dsh `0.1.5-rc.2` ／ Landlock ABI `4`。收尾自证：`apparmor_restrict_unprivileged_userns=1`（禁区未动）。

### 装置（构造方式，按派发稿 §1·J6 要求写明）

`run-35-sandbox.mjs`（CVM `~/harness/scripts/`；回传副本 = `D:\Code\_trae-evidence\35\harness\scripts\`）。头部姿势自证 = **临时 home ＋ SDK 通道 ＋ 真 DSH 会话**：每臂 `mkdtemp /tmp/larry35-home-` → `cpSync ~/.dsh/profiles/sdk → home/profiles/sdk` ＋ **同机 cp** `~/.dsh/.credentials.yaml → home/.credentials.yaml`（key 不打印、不进证据）→ spawn `dsh-prompt.mjs --profile sdk`，`DSH_HOME=临时home`、`cwd=~/larry35-sbox/ws`（⇒ `workspaceRoot=process.cwd()`）→ 跑完即删 home。**唯一变量 = `DSH_PERMISSION_MODE`**。7 臂：read-only ／ workspace-write ／ danger-full-access（J1–J4）＋ esc-read-only ／ esc-workspace-write（J5）＋ fail-closed（J6，`breakLauncher`）＋ bogus-mode（J7）。越界目标放 `~/larry35-sbox/outside`（⛔ 不放 /tmp——它在 workspace-write 的 landlock 白名单里）。

### J1–J7 逐条证据（观测原文照抄）

**J1 ruleset 建立成功 — PASS**。read-only 臂越界写被拒时，tool result（原文）：

```
[stderr]
landlock-run: partial enforcement (older Landlock ABI)
bash: line 1: /home/ubuntu/larry35-sbox/outside/denied-read-only.txt: Permission denied
[sandbox: file access denied under read-only mode]
[exit code: 1]
```

⇒ rung 套上（partial enforcement 行）且为 **denial**（非 fail-closed 臂的 `SANDBOX_UNAVAILABLE` error 形态——两形态可分，见 J6）。session 帧另有 `{"type":"sandbox/mode","seq":1,"data":{"mode":"read-only"}}` 落盘。

**J2 read-only 档拒绝 — PASS**。区内 ＋ 越界**双写全拒**：区内 `bash: line 1: /home/ubuntu/larry35-sbox/ws/inside.txt: Permission denied` ＋ marker `[sandbox: file access denied under read-only mode]`（逐字命中 seam `sandboxDenialMarker`）；fs 探针双 ABSENT。⚠️ 形态注记：判据文本写错误串 `EPERM`，实测用户态读数是 bash stderr `Permission denied`（EPERM 的 strerror 渲染；landlock 方言 `DENIAL_SIGNATURES=["permission denied"]` 匹配）——裸内核 EPERM 串不经 bash 不可见，拒绝事实 ＋ marker 逐字成立（详见未闭合项 ③）。

**J3 workspace-write 双锚 — PASS**。同一臂两命令：区内写 tool result 原文 = `J14-workspace-write`（写成功回读）；越界写原文 = `bash: line 1: /home/ubuntu/larry35-sbox/outside/denied-workspace-write.txt: Permission denied` ＋ `[sandbox: file access denied under workspace-write mode]`。fs：`inside.txt PRESENT` ／ `denied-workspace-write.txt ABSENT` ⇒ **非全拒、非全放**。

**J4 danger-full-access 放行 — PASS（三档互异）**。**同一越界写命令**成功：tool result 原文 = `J14-danger-full-access`（写 ＋ 回读成功），fs `denied-danger-full-access.txt PRESENT` ⇒ 与 J2（拒）／J3（越界拒）互不相同。旁路自证：该臂 stderr **无** `partial enforcement` 行（与 `dsh-bash-sandbox` `if (mode === "danger-full-access") return super.run(spec)` 一致）。**结构化加证**（session 帧）：三档 `approval/policy` = `ask` ／ `ask` ／ **`never`**，`sandbox/mode` 帧逐臂落盘 ⇒ 三档在会话层亦互异。

**J5 提权路径可观测 — 两半分别报，均成立**。
- **第一半（升权提示）**：denial tool result 内 hint **逐字**＝`[sandbox: escalation available — retry this exact command once with sandbox_permissions (the narrowest wider mode that suffices) + justification; the approval prompt asks the user]`，read-only ／ workspace-write 两档 denial 均携带。
- **第二半（按提示重试的结果与答者语义一致）**：模型带 `sandbox_permissions`＋`justification` 重试同一命令。目标档与 `WIDER_MODES` 阶梯一致（read-only→`workspace-write`=最窄放宽 ✓；workspace-write→`danger-full-access`=唯一放宽 ✓）。SDK 会话**无答者** ⇒ tool result 原文 = `Error: sandbox escalation to "workspace-write" requires approval, but no approval channel is available`（esc-read-only 臂；esc-workspace-write 臂同构、目标档 danger-full-access），目标文件 fs **ABSENT**（动作 0 次）= fail-closed 之一种。**结构化层**（session 帧原文）：

```
{"type":"approval/asked","seq":20,"data":{"toolName":"bash","reason":"escalate sandbox to workspace-write: 需要写入工作区外的测试文件来完成沙箱判定。"}}
{"type":"approval/decided","seq":21,"data":{"outcome":"unavailable"}}
```

⇒ asked（reason=模型 justification 原文）→ decided(`unavailable`)，与 seam `approveEscalation` 的 `unavailable` 分支精确对应。两档均测；bonus：fail-closed 臂模型**自发** escalation 亦完整复现 asked→decided(unavailable) 管线。

**J6 fail-closed — PASS（构造成功，写明构造方式）**。构造 = **mv 临时 home 内 profile 层 launcher**：`<临时home>/profiles/sdk/node_modules/@deepseek-ai/node-addon-system-linux-x64/bin/landlock-run → *.larry35-hidden`。⛔ 为何不是落点树 `.pnpm`：首跑 mv 落点树**无效**（命令照跑，attempt1 留痕已归档）——`landlock-run` 是**同 inode 硬链接 ×6**，工程 home profile 层 `~/.dsh/profiles/sdk/...` 与落点树是两个名字同一文件；装置 `cpSync` 后临时 home 内有 profile 层副本 ⇒ **runtime 模块解析命中 profile 层**，mv 落点树名字不影响解析。修正后 mv 临时 home 内 profile 层 ⇒ 唯一解析路径断 ⇒ chain unusable。零外溢自证：落点树 launcher sha256 前后一致（`a752bc72…`），不碰工程 home，临时 home 跑完即删。观测（tool result 原文）：

```
Error: sandbox mode "workspace-write" is requested but no sandbox backend is usable on this host; refusing to run the command unconfined. Install bubblewrap or run a Landlock-enforcing kernel (Linux), ensure sandbox-exec is usable (macOS), or ensure the ACL restricted-token runner can start (Windows) — otherwise switch the consumer to danger-full-access.
```

＝`dsh-sandbox-local/README.md:57` 的 `SANDBOX_UNAVAILABLE` 错误文本**逐字**；fs `inside-fc.txt ABSENT`（**不 exec** ✓）；**非 fail-open** ✓。addon 直跑对照：`landlock-run --rw /nonexistent …` ⇒ **exit 125** ＋ `landlock-run: cannot open rule path: /nonexistent` ＋ 子命令未跑（=`main.c:23-28` 行为）。

**J7 负向对照 — PASS（变红且归因明确）**。`DSH_PERMISSION_MODE=bogus-mode-35` ⇒ SDK 通道 exit=1、无 session、stderr JSON-RPC `-32603`（下游表现）。归因（裸 runtime 前置观测，stderr 原文）：`Error: dsh: plugin tree failed to load: … failed to apply loader entry sandbox-policy (@deepseek-ai/dsh-sandbox-policy): invalid config: - $.mode expected "read-only" | "workspace-write" | "danger-full-access" but got "bogus-mode-35" (at mode)` ⇒ 字面归因到 mode 校验（ValidationError）。对照：7 正常臂全 exit=0，逐值相异 ⇒ 判据链对坏输入敏感，非恒绿。

### 未闭合项（单列）

① **`SANDBOX_UNAVAILABLE` 结构化 code 字面值不落 session 日志**：fail-closed 臂全 29 帧 grep `/SANDBOX/i` 无 tool/result 命中——帧 JSON 只有 `isError:true` ＋ message 文本，**无 code 字段**。seam 源码注释称「HarnessError carries the code through tool/result」，但 session-log 序列化层未持久化。**判定不受影响**（message 逐字 ＋ 不 exec ＋ addon exit 125 对照已足）；但「按 code 区分 `SANDBOX_UNAVAILABLE` 与其他 isError」在**会话日志通道不可用**。runtime API 通道是否带 code 未测（本块无该装置，不臆测）。
② **fs 跨臂残留（装置缺陷）**：`~/larry35-sbox` 未臂间清场 ⇒ danger 臂写的 `inside.txt` 残留到 esc 臂读数（esc 臂 summary `insideTxt=PRESENT` 是残留假象）。判据只看各臂**专属**文件（`denied-<mode>.txt`／`esc-<mode>.txt`／`inside-fc.txt`）未受影响。改进点：下次臂间清场或每臂独立 WS。
③ **J2「EPERM」读数形态差异**：判据文本的错误串 `EPERM` 在用户态不可见（bash 以 strerror 渲染为 `Permission denied`）；landlock 方言 `DENIAL_SIGNATURES` 匹配的是后者。拒绝事实 ＋ marker 逐字成立；建议判据文本后续把「EPERM」口径改为「denial 方言命中」（⛔ 本块不改判据，仅登记）。

### 自曝

1. **J6 首跑构造失效**：mv 落点树 `.pnpm` 的 `landlock-run` ⇒ 命令照跑（inside-fc PRESENT ＋ partial enforcement 输出）。根因 = 硬链接 ×6 ＋ runtime 解析命中 profile 层（§3.6 曾登记符号链接解析坑，本块踩了同族坑的 profile 层变体）。attempt1 留痕（`fail-closed.*.attempt1-mv-storetree.txt`）已归档，未当作 PASS 证据。
2. **J7 归因观测假绿**：`dsh --profile sdk --help` 对 bogus／valid mode **逐值相同**（exit 0 ＋ 同 Usage）⇒ --help 不能当 mode 校验观测点；改裸 runtime stderr 才拿到 ValidationError 归因。
3. **ABI 首测姿势错误**：flags=0 ⇒ `EFAULT(14)`（错误姿势的 errno，非 ABI 读数）不采；改 flags=`LANDLOCK_CREATE_RULESET_VERSION`(1) ⇒ ABI=4，与 WB 登记一致。
4. **PowerShell 5.1 限制**：不支持 heredoc／`<` 重定向／嵌套引号 ⇒ 全程「本地写脚本 → scp → 远程 bash ＋ `exec 2>&1`」。
5. **凭据纪律**：key 仅经装置内 `cpSync` 进临时 home（不打印、不进证据）；打包前 `sk-` 内容模式自扫 clean（首扫宽模式误命中装置源码里 `.credentials.yaml` **文件名字符串**，判为路径引用后收窄）；tar.gz sha256 两侧一致（`b2e5d818…4b409`）。
6. **CVM 2026-10-09 到期 ⇒ 产出非唯一副本**：证据全套已回传 `D:\Code\_trae-evidence\35\`（tar.gz ＋ 解压树 ＋ 装置／探针／提取脚本 11 件 `local-scripts/`）。

---

## 🗂 已清理段落（按交流区规矩）

- **2026-09-30 清理**：删除 `DSH-3.4` 的**派发稿 ＋ 三份回报**（`📤 DSH-3.4 · S2 compaction 接入` 全套 8 节 ／ `进度回报（进行中）` 全套 ／ `回报（J1–J8 全判）` 全套含 §6 采数 ／ §10 自曝 ／ §11 未闭合项）—— **已闭环并收口（老大 2026-09-30 裁「3.4 已完成并收口」）** ⇒ **权威落点**：判据 ／ 边界 ／ 遗留 = `TODO.md`「DSH-3.4」段（⚠️ **该段已于 2026-10-01 归档** ⇒ 现指 `docs/dsh/dsh-migration.md` §3.6 ＋ `archive/roadmap-history.md`「DSH-3.4」段）；机制与口径 = `docs/dsh/dsh-migration.md` §3.6〈判据口径四条〉／〈测试量级阶梯与预算〉；产品观察项 = 同稿 §3.6 ⑦。**§11 五条未闭合项的处置**：① orphaned lock 未观测 ② L4／L5 不覆盖 ③ J2 原文口径不可执行 ④ `(ii)` 另一路径未观测 ⑤ J5 保留量 +6.4% 未正面验证吸附 —— **均属"派发稿边界声明"**，作用为**限定结论适用边界**；该边界已随结论写进 `dsh-migration.md` §3.6 ⑦「基线结论状态 = 参考」（⛔ 不得跨版本外推）⇒ **无孤儿结论**。装置缺陷（`run-34t-probe.mjs` 每臂不回收 home）**已于清理前转登 `TODO.md`「DSH-3.4」段**。回溯：`git log -p -- exchange/log-trae.md`。

---
