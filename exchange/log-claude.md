# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

# DSH-3.7.3-T · 独立测试报告（Claude｜2026-09-17）

> 被验对象 = **DSH-3.7.3**（Trae 19:52 交付：旧代依赖清理 ＋ CVM 副本补齐 ＋ 3.2 判据缺陷修复）。本件**不重测 J1–J11**，只补两个结构性盲区：**依赖树改动的影响面** 与 **③ 改的判据其目标行为从未被观测到**。
> **通道**：本机 Windows 11 ／ **bash(MSYS)** ／ `node v24.14.1 @ /d/App/node/node` ／ `pnpm.cmd 11.7.0` ／ **未走 CVM**（仅 T3(c) 读了一次 CVM lock 的 sha256，**标注为引用**）。
> **证据**：`D:\Code\_claude-evidence\373t\`（脚本 ＋ 原始输出 ＋ 证据 JSON，⛔ 均不进仓库）。
> ⚠️ **诚实边界**：本件是补充验证，⛔ 不替代 WB 的复验结论；⛔ 不据此声称"3.7.3 通过/失败"；⛔ 本机结论不与 CVM 互推。

## 结论先行

| 项 | 一句话 |
|---|---|
| **T1** | ⚠️ **未全绿**：`(a)(b)(c)(d)` 全过；**`(e)` 增跑件 `run-s0-e2e.mjs` 5 变体 3 红 2 绿** —— 根因已钉死为 `dsh plugin add` 前置失效，**与 3.7.3 清树无因果**（状态时点早 19.5 小时） |
| **T2** | ❌ **本机没有任何姿态能观测到 `p2LandedOnSameLog === true`** —— 两条具体原因，均带数据（详见 §T2-3） |
| **T3** | ✅ **四项全对**：`*`/`0.0.1-rc.1` = **0/0**｜物理树 2574 条命中 **0**｜三包各只 `0.1.5-rc.2`｜两侧 lock **sha256 逐字节一致**｜4 探针包终态符合 |
| **T4** | ⚠️ **三问均答**，且发现修复仍有缺陷：语义改动前后不一致｜`null`/`false` 可区分但 `false` **混两义**｜`hasP1`/`hasP2` **会被骗**，假阳**前提经实测确认 ＋ 规则层反例成立** |

---

## T1 · 独立全套回归（确认依赖树变动没打断在飞装置）

### T1(a) `run-372-dialect-e2e.mjs` —— ✅ 过

```
cd /d/Code/LarryAgent/harness
S372_EVIDENCE_DIR=D:/Code/_claude-evidence/373t/t1a node scripts/run-372-dialect-e2e.mjs
```
原始输出（关键行）：
```
[372] Key 来源=D:\Code\LarryAgent\backend\config.yaml（长度 35，值不打印）
[372]   patch=217B  prompt exit=0  ctx out=1525B
[372]   marker=false  普通失败词=["operation not permitted","EPERM"]  越界文件泄漏=false
[372]   dump: sandbox 行在=true disabled=false dialect 行在=false
[372]   patch=769B  prompt exit=0  ctx out=1509B
[372]   marker=true  普通失败词=[]  越界文件泄漏=false
[372]   dump: sandbox 行在=true disabled=true dialect 行在=true
[372] 已把 …cordis.patch.yml 复位为 patched 态
[372] ===== 判据全过（双锚成立）=====
```
判读：**双锚成立** —— 摘掉修复件（`[]`，217 B）时 marker **不出现**、但**普通失败原文（`operation not permitted`/`EPERM`）出现** ⇒ 命令**真跑了、真被拒**，"没跑"没有伪装成"没被识别"；挂上修复件（769 B）时 marker 出现。两态**越界文件均未创建**（正对照成立）。复位后 patch = **769 B / `74400d260d5d4e6c`** ✅（收尾复验，见 §收尾）。

### T1(b) `pnpm.cmd build` —— ✅ 过

```
cd /d/Code/LarryAgent/harness && pnpm.cmd build          # rc = 0
packages/plugin-probe                Done
packages/plugin-sandbox-probe        Done
packages/plugin-sandbox-dialect      Done
```
判读：3 包 `Done`、`rc=0`。`lib/` 被 `harness/.gitignore:2` 忽略 ⇒ **受版本控制的文件零变化**（收尾 `git status` 为证）。

### T1(c) 四个 `test:isolated*` —— ✅ 逐件按其**自身**期望落位

⚠️ **派发单注「哨兵组本就应红」方向对、口径糙**：三个哨兵里**两个落红是绿、一个落绿才是绿** —— 我逐件读了源码定期望，**不拿 exit code 组一个口径去判**：

| 脚本 | 测试文件 | 实测 exit | **该件期望** | 依据（源码自述） | 判读 |
|---|---|---|---|---|---|
| `test:isolated` | `guard.test.ts` | **0** | 0 | 隔离生效应全绿 | ✅ |
| `test:isolated:sentinel` | `sentinel-failfast.test.ts` | **1** | **1** | "本测试必须 FAIL"（`expect(true).toBe(true)`，靠护栏拦截） | ✅ 哨兵绿 |
| `test:isolated:sentinel-key` | `sentinel-key-residue.test.ts` | **0** | **0** | "此文件本身测试全绿，验收看 teardown 的 stderr 告警" | ✅ 哨兵绿 |
| `test:isolated:sentinel-unset` | `sentinel-unset.test.ts` | **1** | **1** | "本测试必须 FAIL" | ✅ 哨兵绿 |

原始输出（逐件）：
```
# :sentinel-key  —— 文件全绿，但 teardown stderr 出现：
[test-isolation] ⚠️ KEY RESIDUE: 临时目录残留疑似 key 明文（1 处）——可能 --real-api 模式泄漏，须人工检查: D:\Temp\Sys\larry-test-O5sObv
# :sentinel / :sentinel-unset
FAIL  tests/sentinel-failfast.test.ts > fail-fast 哨兵（预期 FAIL——证明护栏存在） > 污染 DSH_HOME 指向真实库时应被隔离守卫拦截
FAIL  tests/sentinel-unset.test.ts > R2 反向哨兵（预期 FAIL——证明 unset 被拦） > 删除 DSH_HOME 后应被隔离守卫拦截
```
判读：告警命中的是**装置自己故意植入的假 key**（`<临时 home>/simulated-leak/creds.txt`），**不是真泄漏** —— 但它证明了残留扫描器**真的会喊**。⇒ **exit 0 与 exit 1 都不能单独当验收**，必须逐件读它自己的期望；本组四件**全部符合自身期望**。

### T1(d) `dsh-prompt.mjs` —— ✅ 过

```
cd /d/Code/LarryAgent/harness
DSH_HOME="$(pwd -W)/.dsh-home" node scripts/dsh-prompt.mjs "…return exactly: CLAUDE-373T-OK"
→ rc = 0
  stdout: CLAUDE-373T-OK
  stderr: [dsh-prompt] session=session-a403f6ea86314681826ae6773f3b2eb7 events=13 notifications=15
```
判读：`pwd -W` 确实**不可省**（`pwd` 会给出 `/d/Code/…`，Windows node 解析成 `D:\d\Code\…` ⇒ 自建空 home ⇒ 无 key 假绿）。本跑 stdout 拿到口令、stderr 自报 session id ⇒ **非空 home 假绿**。该会话日志另被我用作 §T4-3 的实测样本（见下）。

### T1(e) 装置清单自证 ★（本项含**我主动增跑**，超出派发清单）

**遍历范围**：`harness/scripts/**`（含 4 子目录，递归）＝ **32 个文件**；`harness/tests/**`（非递归，该目录无子目录）＝ **14 个文件**。检索式：`node` 递归 `readdirSync` 全量列举（非 glob 抽样），脚本见证据目录。

#### scripts/（32 件）

| 文件 | 状态 |
|---|---|
| `run-372-dialect-e2e.mjs` | ✅ **实跑**（T1(a)） |
| `run-s0-resume.mjs` | ✅ **实跑 4 变体**（T2） |
| `run-real-api.mjs` | ✅ **实跑 3 次**（T2 经 run-s0-resume 调用；另 R1/R3、`real-api.test.ts` 自跑） |
| `dsh-prompt.mjs` | ✅ **实跑**（T1(d)；且是 T1(a) 的被调通道） |
| `run-s0-e2e.mjs` | ✅ **实跑 5 变体**（⬆️ **我增跑的**，不在派发 (a)–(d) 清单内 —— 理由：它是 S0 链的兄弟装置、与 T2 同代同依赖树，正是"依赖树改动影响面"的最广覆盖件） |
| `s0-kill-child.mjs` | ✅ **间接跑**（被 `s0-e2e.test.ts:163` 的 `kill-client` 变体调用，该变体 exit 0） |
| `s0-run-with-file-key.mjs` | ❌ **未跑** —— 它是 `run-s0-e2e.mjs` 的**兄弟跑法**（同一 `tests/s0-e2e.test.ts`，只换凭据注入方式）。该测试已因前置失效落红（见下），换注入方式不改变结论。⚠️ 此为**机制推断，未实测** |
| `run-321-semaphore-release.mjs` ／ `321-lease-child.mjs` | ❌ **未跑** —— 属 **3.2.1 交付件**（Trae 自测 16/16），验 Windows named semaphore 内核释放语义，与本块依赖树无交集；**本件不覆盖** |
| `dsh-probe-capability.mjs` | ❌ **未跑** —— DSH-2.3 期 SDK 通道能力边界探针，**不在本件判据链**；**本件不覆盖** |
| `015-preset-probe/`（2 件：`run-probe.mjs` ／ `custom-preset.patch.yml`） | ❌ **未跑** —— DSH-0.1.5 preset 探针，作用于 `~/.dsh-015` 那套现场，**与本块现场（`harness/` ＋ `.dsh-home`）不同**；**本件不覆盖** |
| `cvm-probes/`（11 件：`cvm-acp-*` ／ `cvm-landlock-verify` ／ `cvm-setup-*` ／ `cvm-sqlite-probe.{cjs,py}` ／ `cvm-step0` ／ `cvm-task1-*`） | ❌ **未跑** —— 全部 CVM/Linux 专用（landlock ABI、ACP、sqlite 并发），落在禁区「不碰 CVM」内；**本件不覆盖** |
| `embed-probe/`（3 件：`compare.mjs` ／ `ts-embed.mjs` ／ `python-embed.py`） | ❌ **未跑** —— DSH-2.5 embedding 漂移对照，需 Python ＋ transformers.js 双侧栈；**本件不覆盖** |
| `sandbox-probe/`（6 件：`sandbox-denial-probe.mjs` ／ `cordis-confine-check.mjs` ／ `denial-dialect-forensics.mjs` ／ `mount-artifact-replay.mjs` ／ `sandbox-dialect.mount.patch.yml` ／ `sandbox-dialect.verify.patch.yml`） | ❌ **未跑** —— DSH-2.5 二轮取证/验收探针，其成果**正是 T1(a) 复跑的那个修复件**；再跑属重测 2.5 判据、非本件覆盖面。其中 `sandbox-dialect.mount.patch.yml` 经**读码**确认是 T1(a) 的 patch **内容源** |

#### tests/（14 件）

| 文件 | 状态 |
|---|---|
| `s0-resume.test.ts` | ✅ **实跑 4 变体**（T2） |
| `s0-e2e.test.ts` | ✅ **实跑 5 变体**（T1(e) 增跑；3 红 2 绿，根因见下） |
| `guard.test.ts` ／ `sentinel-failfast.test.ts` ／ `sentinel-key-residue.test.ts` ／ `sentinel-unset.test.ts` | ✅ **实跑**（T1(c)） |
| `sentinel-realapi-r1.test.ts` | ✅ **实跑**（⬆️我增跑）exit **1**、`verdict=FAIL`＋`error.code=AUTH`＋`status=401`、耗时 2s ⇒ 错误 key **既没跳过也没假通过** |
| `sentinel-realapi-key-residue.test.ts` | ✅ **实跑**（⬆️我增跑）exit **0** ＋ teardown stderr `⚠️ KEY RESIDUE …（1 处）` ⇒ 告警型哨兵**响了**；且秒级完成 ⇒ **junction 不穿透**回归通过 |
| `real-api.test.ts` | ✅ **实跑**（⬆️我增跑，`test:real-api` 无参默认目标）exit **0**，`14 passed \| 1 skipped (15)` |
| `real-api.ts` ／ `s0-session-log.ts` ／ `scan-keys.ts` ／ `isolated-setup.ts` ／ `global-setup.ts` | ⚙️ **库/装配件（非独立测试件）** —— `s0-session-log.ts`、`scan-keys.ts` 被上述跑件调用；`real-api.ts` 是断言层；两个 setup 每次 vitest 运行必加载 |

⭐ **T1(e) 增跑件的结果（这是本件 T1 唯一落红处，必须写全）**

```
cd /d/Code/LarryAgent/harness
DSH_REAL_API_PROFILE_HOME=D:/Code/LarryAgent/.dsh-home/profiles \
S0_EVIDENCE_DIR=D:/Code/_claude-evidence/373t/s0e2e DEEPSEEK_API_KEY=… \
node scripts/run-s0-e2e.mjs
[s0]   base             exit=1 FAIL （期望 PASS） 38s
[s0]   no-bundle        exit=0 PASS 37s
[s0]   wrong-key        exit=1 FAIL 34s
[s0]   no-session-dir   exit=1 FAIL 40s
[s0]   kill-client      exit=0 PASS 28s
```
三处失败**全是同一断言族**——「插件必须激活」：
```
base           : AssertionError: ② 插件必须在 boot 期真的 activate: expected false to be true
wrong-key      : AssertionError: 负向 2：插件本身仍应激活（③ 才是被破坏的那条）: expected false to be true
no-session-dir : AssertionError: 负向 3：插件激活层必须仍是绿的（否则"红"可能只是链路没起来）: expected false to be true
```
每个变体的证据 `notes[0]` 都是同一句（装置只存末 2 行，真错误被 `slice(-2)` 截掉）：
```
plugin add: exit=1 signal=- pnpmDone=false ::  | dsh: pnpm failed in profile directory <临时home>\profiles\sdk
```
**根因取证**（我按 `s0-e2e.test.ts::installPlugin` **逐字同参**重跑该步、保留完整输出，临时 home 隔离、源 profile 不动）：
```
[ERR_PNPM_UNEXPECTED_VIRTUAL_STORE] Unexpected virtual store location
The dependencies at "<临时home>\profiles\sdk\node_modules" are currently symlinked from the virtual
store directory at "D:\Code\LarryAgent\.dsh-home\profiles\sdk\node_modules\.pnpm"。
pnpm now wants to use the virtual store at "<临时home>\profiles\sdk\node_modules\.pnpm" …
If you want to use the new virtual store location, reinstall your dependencies with "pnpm install".
```
源 profile 的 pnpm 状态（读 `.modules.yaml`）：
```
"nodeLinker": "hoisted",
"storeDir": "D:\\.pnpm-store\\v11",
"virtualStoreDir": "D:\\Code\\LarryAgent\\.dsh-home\\profiles\\sdk\\node_modules\\.pnpm",   ← 绝对路径
```
**判读（三条结论，逐条有据）**：
1. **机制**：`cp -r` 出来的 profile 副本**自带** `.modules.yaml`，里面记着**源 profile 的绝对** `virtualStoreDir`；pnpm 在副本里算出的是副本路径 ⇒ **不一致 ⇒ 直接拒**。node linker 是 `hoisted`（顶层 0 链接/junction、80 真实目录，实测）⇒ **不是符号链接问题，是状态文件里的绝对路径问题**。
2. **与 3.7.3 清树无因果**：pnpm 是在**真正解析依赖之前**因状态不一致退出的 —— 清树改的是"包在不在"，此处根本没走到那一步。
3. **时点也不支持因果**：profile 的 `.modules.yaml`／`.pnpm`／`pnpm-lock.yaml`／`package.json` mtime **全部 = 2026-09-17 00:11**，比 3.7.3 交付（**19:52**）早约 **19.5 小时**，比 3.2.1（12:21）也早。
⚠️ **装置自身判据是对的**：`负向 2/3` 那两条锚（"插件激活层必须仍是绿的，否则「红」可能只是链路没起来"）**正是它挡住假绿的地方** —— 它拒绝把"链路没起来"记成"负向对照成功"。

---

## T2 · 【核心】`true` 分支的独立触发尝试

### T2-1 我跑了的（全 4 变体，一条命令原文）

```
cd /d/Code/LarryAgent/harness
DSH_REAL_API_PROFILE_HOME=D:/Code/LarryAgent/.dsh-home/profiles \
S0_EVIDENCE_DIR=D:/Code/_claude-evidence/373t/t2 DEEPSEEK_API_KEY=… \
node scripts/run-s0-resume.mjs same-proc      # 另跑 key / forward / reverse
```
四变体**全部 `退出码=0`（vitest 层面）**。⚠️ **场地声明**：我显式用**工程 `.dsh-home/profiles`**（= `realApiProfileSource()` 自身默认，且刚被 T1(a)/(d) 证明可用）；`run-s0-resume.mjs` 自述默认的 `~/.dsh/profiles` 本机**未验**（列入未闭合项）。**结论只写在本机这条通道上。**

### T2-2 逐变体原始观测（读 `*.resume.json`，非报告转述）

| 变体 | P1 | P2 | 日志条数 | 逐条 `hasP1`/`hasP2` | `resumeTarget` |
|---|---|---|---|---|---|
| `same-proc` | ok=true sid=`s0-resume-fixed-0001` | **ok=true** sid=同值 | **1** | `P1=true P2=true`（13600 B，`turn/end`） | **键不存在** |
| `key` | ok=true sid=`session-c62ce09a…` | **ok=false** `JsonRpcResponseError` | 1 | `P1=true P2=false`（12239 B） | `{p1LogPath:…, p2LandedOnSameLog:false, p2LogPath:null}` |
| `reverse` | ok=true sid=`s0-resume-fixed-0001` | **ok=false** `JsonRpcResponseError` | 1 | `P1=true P2=false`（12225 B） | **键不存在** |
| `forward` | ok=true sid=`session-fac13c37…` | ok=true sid=`session-d4a5ff86…`（新 id） | **2** | `[0] P1=false P2=true`；`[1] P1=true P2=false` | **键不存在** |

P2 失败的完整形态（`key` 与 `reverse` **同码同文案**，仅 id 不同）：
```
errorName=JsonRpcResponseError  errorCode=-32603  eventsCount=0  sessionId=null  turnEndKind=null
errorMessage="session \"<第一轮 id>\" already exists"     耗时 1556ms / 1359ms（P1 完成用 2300/2205ms）
```
⚠️ 该码/文案与派发单引的 **CVM 记载同形**，但按诚实边界**只报为本机观测、不与 CVM 互推**。

### T2-3 我逐值演算过的自洽核对（不采信任何"自洽"声明）

**`key` 变体**（唯一产出该字段者）——我手算一遍：
`find(l=>l.hasP1)` → 唯一那条日志（`P1=true`）✓ 与 `p1LogPath` **同值**；`landedOnP1Log = true && (hasP2===false) = **false**` ✓ 与 `p2LandedOnSameLog=false` 相同；`find(hasP2&&!hasP1)` → **无** ⇒ `otherP2Log=null` ⇒ `p2LogPath = false ? … : null = **null**` ✓。**三项逐值吻合，自洽成立。**
**`forward` 变体** ——若把 `key` 的算法套上去：`p1Log`=[1]（P1-only）⇒ `landed=false`；`otherP2Log`=[0] ⇒ `p2LogPath`=[0] ⇒ 语义正确（P2 确实落在**另一条**日志上）。⇒ 订正后的规则在"落别处"这一格**是对的**。

### T2-4 ⇒ **结论：本机没有任何姿态能观测到 `true`**（两条具体原因，用数据说）

**原因一 · 装置结构性缺陷：唯一能造出 `true` 底层条件的变体，恰恰不产出该字段。**
`resumeTarget` **只在 `VARIANT === 'key'` 分支赋值**（`s0-resume.test.ts:307-322`）。`same-proc` 实测已把底层条件造出来了 —— 单条日志 `hasP1=true` **且** `hasP2=true`，且**两轮 `finalResponseMatchesTag` 均为 true**（独立信号，排除 tag 假象）⇒ 若该字段被赋值，按 §T2-3 同一算法**必为 `true`**。但实测其证据 JSON 里 **`resumeTarget` 键不存在**（我打印过：`❌ 未产出`）。
⇒ 派发单的首选实验**造得出条件、报不出字段**；我给出的 `true` 是**手工代入演算**，⛔ 不是装置判读。**"观测到"未成立。**

**原因二 · 唯一产出该字段的变体 `key`，P2 在本机被拒。**
`eventsCount=0`、`sessionId=null`、`turnEndKind=null`、`-32603 already exists`、1556 ms ⇒ **P2 从未落盘** ⇒ `p2LogPath=null`、`p2LandedOnSameLog=false`（实测值，非推断）。
`reverse` **独立复现同一现象**（1359 ms，同码同文案）⇒ 跨进程复用 id 的**两种来源（框架自产 / 自选固定）在本机都被拒**。

---

## T3 · 判据的独立复算（不看 Trae 的证据文件）

**T3(a)** `grep -c "specifier: '\*'" harness/pnpm-lock.yaml` → **`0`**｜`grep -c "0\.0\.1-rc\.1"` → **`0`**｜反向佐证 `grep -c "0\.1\.5-rc\.2"` → **`2177`** ✅

**T3(b)** 遍历 `.pnpm/*/node_modules/{@scope/}*/package.json` **读 `name`/`version`**（我自己的脚本 `t3b-scan-pnpm.mjs`，⛔ **未用目录名 glob**）：
```
实体条目总数: 2574（0 个不可读/非法 JSON）
含 version === "0.0.1-rc.1" 的条目数: 0
@deepseek-ai/dsh-sandbox-local      : 版本集合 = 0.1.5-rc.2 ｜ 物理 entry 数 = 3
@deepseek-ai/dsh-storage-domain     : 版本集合 = 0.1.5-rc.2 ｜ 物理 entry 数 = 5
@deepseek-ai/dsh-sandbox-windows-acl: 版本集合 = 0.1.5-rc.2 ｜ 物理 entry 数 = 2
```
✅ 命中 0，三包版本集合各只 `0.1.5-rc.2`。
⚠️ **自曝**：我起初用 `find` 只数到 585/577 并据此判派发单"2574"不可复现 —— **是我口径错**（`.pnpm/<dir>/node_modules/<pkg>` 在 `find` 默认下不进入）；按读 `package.json` 的正确口径得 **2574**，**派发单没写错**。

**T3(c)** 本机 `harness/pnpm-lock.yaml` sha256 = `a03ede8de3f00ee3e35edd6751da6429f6dd7913e0451cd33420a2d4a096ffed`（541493 B）＝ 与 CVM 同值（**引用** WB 记录；CVM 侧我只读核未改动）⇒ **两侧逐字节一致** ✅

**T3(d)** `plugin-probe`／`plugin-sandbox-probe` = `{"@deepseek-ai/cordis":"^4.0.2"}` ＋ `{"optional":true}`；`plugin-sandbox-mount-probe`／`plugin-storage-probe` = **两段均不存在** ✅

---

## T4 · 判据修复的边界独立评估（读码 + 判断，未改代码）

**T4-1 · `p2LogPath` 语义：改动前后不一致。** 改后（`:313-321`）`true` ⇒ 指 `p1Log.path`（**与 `p1LogPath` 同值**）；`false` ⇒ 指 `otherP2Log?.path ?? null`。**下游须知**：`p2LogPath === p1LogPath` 在 `true` 分支下是**预期**、不是异常。

**T4-2 · `null` 与 `false` 能否被区分：机器下游不存在。** `run-s0-resume.mjs`（通读）只收 exit code、落 JSON、打 PASS/FAIL，**完全不读 `resumeTarget`** ⇒ 该字段**只写不读**，唯一读者是人。人工判读表：

| `p2LandedOnSameLog` | `p2LogPath` | 含义 |
|---|---|---|
| `null` | `otherP2Log?.path ?? null` | 无任何日志含 P1 |
| `true` | ＝ `p1LogPath` | P2 落在 P1 那条 ✅ |
| `false` | 路径 | P2 落在**另一条** |
| `false` | `null` | **P2 未落盘** |

⇒ **可区分**，但 `false` **混了两义**，只能靠 `p2LogPath` 是否 `null` 分开，且**证据里没有独立字段**表达"P2 无落盘"、也无此组合的文字说明 ⇒ **残余缺口**（建议加 `p2LogFound: boolean`，或把该分支写成 `'(none)'` 以别于 `null`）。

**T4-3 · `hasP1`/`hasP2` 怎么来的 + 会不会被骗：⚠️ 会，且比"同名字符串"更强。**
取法 = `logsEvidence():219` 的 **`text.includes('OK-P1'/'OK-P2')`**，`text` 是整篇解码后的会话日志 ⇒ **纯子串匹配，不分事件类型、不分轮次、不分角色**。

**实测确认 tag 的权威来源在请求侧**（用 `dsh-prompt.mjs` 的真实落盘日志，按 `s0-session-log.ts` 同款多帧解码口径逐帧统计；**不打印帧正文**）：
```
日志 12263 B → 解码 35139 字符 / 17 行 JSONL；含 tag 的行 = 4
  2  agent/inbox/spliced   ← 含 tag 1 行
  2  user/message          ← 含 tag 1 行     ★ 请求侧
  1  session/title         ← 含 tag 1 行     ★ 派生标题
  1  assistant/message     ← 含 tag 1 行     ★ 回复侧
```
⇒ **只要会话被问过 `OK-P1`，`hasP1` 就是 `true`，与"该回合是否成功"无关**（tag 出现在 `user/message` 与自动生成的 `session/title` 里）。字段名/注释暗示的是"这条日志是 P1 的落点"，实现只是"这段文本含该串" —— **名实不符**。

**规则层反例（构造，非实测）**：输入顺序 `[B(P1+P2, 更新), A(P1 only, 真·P1 日志)]`
```
find(hasP1) → B                      ← 误指向
p2LandedOnSameLog → true             ← ⚠️ 期望 false
p2LogPath → B                        ← 指向也错
```
成立条件 = "P2 落到的新日志**携带了继承上下文**（resume 载入 P1 历史 / 模型复述 / `request/context` 带入）"。`key` 变体的断言（`:354-355`）只查 `p1Log` defined、**不校验它真是 P1 的落点** ⇒ **拦不住**。
⚠️ **本机 4 个变体都未产出该形态**（`forward` 的新日志 `P1=false`），所以这是**可达但未观测**：机制前提**实测确认**、规则层反例**构造成立**、**真实现场未采集到**。

---

## 未闭合项（单列）

1. **`s0-e2e` base 在本机是否曾绿过 —— 未闭合。** 我的数据只支持"本次落红不是 3.7.3 造成的"（机制 ＋ 时点），**不支持**"此前曾绿"。旁证：`harness/.s0-evidence/` 目录**不存在**（检索式：`ls harness/.s0-evidence/` ＋ 全仓 `find . -name "*.evidence.json" -path "*s0*"`，范围＝仓库根递归）⇒ 本 checkout 未见用**默认证据目录**完整跑过它。3.1 及其复验的"全绿"记录**自述在 CVM**，按边界⛔不互推。
2. **`no-session-dir` 的破坏动作（`chmod 500`）在 Windows 是否真能令 ④ 变红 —— 未判定**：本次被 `负向 3` 的插件激活断言**先拦下**（其 `④_sessionContainsNonce` 实测仍为 `true`，但拿不到"破坏是否生效"的独立判定）。
3. **T2 的 `~/.dsh/profiles` 通道未验**：我用了工程 `.dsh-home/profiles`（装置自身默认 ＋ T1 已证可用）。
4. **T4-3 假阳的真实现场未采集到**（见上，可达未观测）。
5. **`resumeTarget` 是否真有人工消费者 —— 未知**（"只写不读"已证；是否有外部脚本读它，遍历范围仅 `harness/**`，**仓库外未查**）。

## 自曝

1. **我跑歪过一次**：第一次调 `run-real-api.mjs` 时 shell cwd 已被前一步重置到仓库根，命令解析成 `<repo>/scripts/run-real-api.mjs` ⇒ `Cannot find module`、exit 1。**那是我的调用错误、不是装置信号**；已显式 `cd harness` 重跑（R1 exit 1／R3 exit 0 均为重跑后结果）。原始错误输出留在 `t1e-sentinel-r1.out.txt` 被我覆盖，**此处如实声明**。
2. **我增跑了派发清单之外的 3 类件**（`run-s0-e2e.mjs` 5 变体、`sentinel-realapi-r1`、`sentinel-realapi-key-residue`、`real-api.test.ts`）—— 理由：它们与 T1(a)/(d)/T2 走**同一层**（S0 链 ＋ real-API 断言层），是"依赖树改动影响面"的真实覆盖面。**这同时意味着我的覆盖面与派发清单不同，须以此处列出的为准。**
3. **我改过现场**（非 git 跟踪）：T1(a) 重写工程 `cordis.patch.yml`（**装置自复位，终态 769 B/`74400d260d5d4e6c` ✅**）；T1(a)/(d) 在 `.dsh-home/sessions/` 新增会话落盘。**受版本控制的文件零变化。**
4. **发现判据缺陷 2 处**（T2-4 原因一：`resumeTarget` 只在 `key` 分支产出；T4-3：`hasP1`/`hasP2` 名实不符 ＋ 假阳路径未被断言覆盖）。
5. **发现稿件矛盾 1 处**（T1(c)：派发单注"哨兵组本就应红"与 `sentinel-key-residue` 的实际期望**相反** —— 该件**落绿才是绿**）。

## "没有/不存在"类断言的检索式与遍历范围

| 断言 | 检索式 | 遍历范围 |
|---|---|---|
| `harness/.s0-evidence/` 不存在 | `ls -la harness/.s0-evidence/`；`find . -name "*.evidence.json" -path "*s0*"` | 仓库根递归（含 `harness/`、`.dsh-home/`） |
| `same-proc` 证据无 `resumeTarget` 键 | 读 `t2/same-proc.resume.json` 的 `j.resumeTarget === undefined` | 该单个 JSON |
| `scripts/` 32 件、`tests/` 14 件 | `readdirSync` 递归列举（`scripts`）／非递归（`tests`） | `harness/scripts/**`、`harness/tests/**` |
| 工程 sdk profile 顶层 0 链接/junction | `fs.lstatSync` 逐条（junction 会被 Node 认作 symlink，`find -type l` 会漏） | `<sdk>/node_modules` 顶层（80 真实目录）＋ `@deepseek-ai/`（105 真实目录） |
| 本机 PATH 内唯一 node | `which node` → `/d/App/node/node`；`ls AppData/Local/node`（只有 `corepack`，无 `node.exe`） | 当前 bash 通道 PATH |

## 通道信息

- **本机 Windows** ／ **bash(MSYS)** ／ `node v24.14.1 @ /d/App/node/node` ／ `pnpm.cmd 11.7.0`
- ⚠️ **与派发单记载不符**：派发单记「Bash 通道 = `22.22.2`（managed）／ system = `24.14.1`」，实测**两条通道同版本 = v24.14.1**，"通道不同"在本机当前不成立。若某处结论依赖「22.22.2 那条通道」，需重核。
- **未走 CVM**。仅 T3(c) 读了一次 CVM lock 的 sha256（**引用**，未改动 CVM 任何文件）。

## 收尾核（独立测试动作自身也会改现场）

```
$ git status --short
(空 —— clean)
```
§5 六锚**终态复验 6/6 ✅**（含 T1(a) 复位后的 `cordis.patch.yml` 769 B／`74400d260d5d4e6c`）：
```
✅ harness/pnpm-lock.yaml                                    541493/541493  a03ede8de3f00ee3
✅ harness/package.json                                       1283/1283     e4d338caa2a0431b
✅ harness/packages/plugin-sandbox-dialect/package.json        551/551      9d6f4794a8aec191
✅ .dsh-home/profiles/sdk/cordis.patch.yml                     769/769       74400d260d5d4e6c
✅ …/plugin-sandbox-dialect/index.js                           4087/4087     022b0ff5efd11648
✅ harness/tests/s0-resume.test.ts                            16328/16328    dab57a0ed2c3f64e
```

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.3-T** · 工程卫生块的独立测试件（T1–T4） | **Claude** | 本机（CVM 只读核可选） | ✅ **已交回（2026-09-17）** —— 报告见本文件上方；判定权在 WB | 2026-09-17 |

- 任务清单与进度以 `TODO.md`「DSH-3」区为准；本区只放**怎么做**。
