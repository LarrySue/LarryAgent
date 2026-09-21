# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.3-a** | Trae | 本机（Windows） | ✅ **已交回（2026-09-20）· 待复核** | 2026-09-20 |
| **DSH-3.7.4** | Trae | 本机（Windows） | ✅ **已交回（2026-09-20）· 复核已完成**（WB 2026-09-20：**修复成立 ＋ 成因链成立 ＋ 判据未放宽**，三项均**可采信**） | 2026-09-20 |

- 已完成并复验（各段已按交流区规矩清理）：3.0 ✅ ／ 3.1 ✅ ／ 3.2 ✅ ／ 3.7.1 ✅ ／ 3.7.2 ✅ ／ 3.7.3 ✅ ／ **3.2.1 ✅（WB 复核：结论认可，另订正 3 处）** ／ **3.7.4 ✅（WB 复核：修复成立 ＋ 成因链成立 ＋ 判据未放宽，三项全可采信）**。
- **3.3-a 一句话结论**：**`ctx.approval` 这条 seam 接得上** —— 答者能挂上（四类打点实测）／**scope filter 有效**（同机两个 agent：答者只收被限定那个的请求，另一个的请求落 `unavailable`）／**fail-closed 成立**（不装答者 ⇒ 6/6 `unavailable`、被保护动作 0 次）；⚠️ 本块**单独不得声称"审批语义验成立"**（超时／断链是同进程替身，真验在 3.3-b）。
- **3.7.4 一句话结论**：**跑起来了 ＋ 修好了** —— 本机五变体 **5/5 全绿**（两次独立复跑，runner `exit=0`）；成因 = **pnpm 自身的平台分支**（`.modules.yaml` 的 `virtualStoreDir` 在 Windows 必写绝对 / POSIX 写相对）**＋ 副本 `cp -r` 继承了源树的绝对元数据**（不止 `virtualStoreDir`，`storeDir` 同病）。
- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3」区**（**一处两面**）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯时用 `git log -p -- exchange/log-trae.md`。
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

---

## ✅ DSH-3.3-a 回报 · scope-filtered answerer 插件（S1 审批接入 · 第一段）

> 场地：**本机 Windows**（⛔ 未碰 CVM）｜通道：`D:\App\node\node.exe` = **v24.14.1**（system/PowerShell 通道）｜`pnpm.cmd` = 11.7.0｜Key：**只经环境变量注入**（`backend/config.yaml` 首条；值不打印／不落盘）
> 证据：`D:\Code\_trae-evidence\33a\{main,scopeoff,noanswerer}\`（**含原始会话日志副本** `sessionlogs/`）

### 0 · 结论先行（派发稿要求的**三段分开**）

1. **装载与注册：成。** 两个包 `dsh plugin add` 均 `exit=0 ＋ pnpm Done`；boot 期四类打点**实测齐全**（`activate` ／ `inject-requested` ／ `inject-fired` ／ `answerer-registered`）；注册走 `ctx.inject(['approval'],…)`，**没有**用 `ctx.get` 当注册前置。
2. **scope filter：成（两组真对照）。** 同一 runtime 里 **两个 agent**（`run()` 不带 sessionId ⇒ 每次新会话，`dsh-sdk-client/lib/index.js:686-699`）：答者限定到首个 agent ⇒ **`answerer-request` 只出现该 agent**；第二个 agent **确实发过请求**（探针入口打点有行）但**答者未收到**，其请求在审计里落 **`unavailable`** ⇒ 非空转。
3. **fail-closed：成。** 不装答者 ⇒ 6/6 请求 `outcome=unavailable`、`probe-executed` **0 行**（被保护动作一次都没跑）；答者抛错／返回不合词汇 ⇒ 同样 `unavailable`。

⚠️ **本块单独不得声称"审批语义验成立"**（派发稿 J8 要求显式写）：本块只证**机制接入**（挂得上／路由得到／能决定结果／失败不放行）；「超时」「渠道断裂」在 3.3-a 是**同进程替身路径**（本地答者与宿主同进程，无"渠道"可断），那两条的真验在 `3.3-b`。

### 1 · 交付物与一条命令复跑

| 件 | 路径 |
|---|---|
| 产品插件（**本地策略答者**） | [plugin-approval-answerer](file:///d:/Code/LarryAgent/harness/packages/plugin-approval-answerer/src/index.ts)（`src/index.ts` ＋ `cordis.patch.yml` ＋ `test/smoke.mjs`） |
| 装置用探针（**消费者替身**：`approval_probe` 工具） | [plugin-approval-probe](file:///d:/Code/LarryAgent/harness/packages/plugin-approval-probe/src/index.ts) |
| e2e 装置（三臂） | [run-33a-answerer-e2e.mjs](file:///d:/Code/LarryAgent/harness/scripts/run-33a-answerer-e2e.mjs) |

```powershell
# 三臂各跑一次（arm=main / scopeoff / noanswerer）；退出码 0=PASS 1=FAIL 2=前置缺失 124=看门狗
cd harness ; node scripts/run-33a-answerer-e2e.mjs main
```
**末次实跑（第二次独立复跑）**：`main` 判据成立（9 条）／`noanswerer` 判据成立（5 条）／`scopeoff` 判据成立（8 条）。
**假 ctx 单测**：`node packages/plugin-approval-answerer/test/smoke.mjs` ⇒ `smoke ok`（8 组断言：声明面／容忍 `config===undefined`／注册接线／五条用例的判定源／`scope=all` 全局注册／**J5 注入替换**／降级不抛）。

### 2 · 机制取证（先读实物，再动手）

| 事实 | 出处（本机实物） |
|---|---|
| 答者 = `approval/request` **waterfall 监听器**；返回结果即认领，否则 `next()` 委托 | `dsh-user-approval/README.zh.md:32`＋`lib/types/types.d.ts:76`（`'approval/request'(this: Scoped<Agent>, req, next)`） |
| 分发= **按 agent 作用域**：`ctx.waterfall(scopeTarget(req.agent, req.agent), 'approval/request', req, () => Promise.resolve('unavailable'))` | `dsh-user-approval/lib/index.js:179` |
| **放行规则**：无标签监听器放行；有标签监听器仅当标签 = 分发键**或其祖先**；`{global:true}` 绕过筛选 | `dsh-scope/README.zh.md`〈事件筛选〉（裸仓 `packages/core/scope/`） |
| ⇒ **scope filter 的实现方式 = 把监听器注册在 `agent.ctx` 上**（该 ctx 带此 agent 的作用域标签） | `dsh-scope/README.zh.md`〈创建作用域〉"通过 `agent.ctx` 注册的工具只对该 agent 可见" |
| 结果词汇 = `allowed-once` ／ `rejected` ／ `cancelled`（中止撤回）／ `unavailable`（答者缺失或抛错）；`never` 策略在 waterfall **之前**执行 | `lib/index.js:30-35` / `:178` |
| 审计 = `approval/asked` ＋ `approval/decided`（**只写日志、不进模型上下文**） | `lib/index.js:135-145` ＋ `types.d.ts:37-51` |

### 3 · J1 装载与注册（四类打点，**实测原文**）

`.../33a/main/answerer.marker.json`（原文，逐字）：
```json
{"t":"2026-09-21T01:02:28.224Z","event":"activate","plugin":"plugin-approval-answerer","pid":13192,"dshHome":"D:\\Temp\\Sys\\larry-33a-DyWaHj","configWasUndefined":false,"scope":"first","scopeAgentId":null,"source":"local-policy:from-request","injectedAnswerer":false,"caps":{"approvalSeam":true}}
{"t":"2026-09-21T01:02:28.225Z","event":"inject-requested","plugin":"plugin-approval-answerer","deps":["approval"]}
{"t":"2026-09-21T01:02:28.242Z","event":"inject-fired","plugin":"plugin-approval-answerer","hasApproval":true}
{"t":"2026-09-21T01:02:28.376Z","event":"answerer-registered","plugin":"plugin-approval-answerer","scope":"agent","via":"agent.ctx","agentId":"session-02a32a2626af43409ea9f4dae19e37bb","scopeFilter":"只收该 agent 的请求（dsh-scope 按注册标签放行）"}
```
＋ `plugin add` 原文：answerer `exit=0 pnpmDone=true` ／ probe `exit=0 pnpmDone=true`（`33a/main/install-*.txt`）。
⛔ **未用 `--dump-config` 作证据**（它只组配置树、不激活插件）；⛔ **未用 `ctx.get` 当注册前置**。

### 4 · J2 scope filter（两组真对照）

| 组 | 观测（原文） | 判读 |
|---|---|---|
| ① **目标 agent 的请求 ⇒ 答者收到** | 注册=`agent/agent.ctx/session-02a32a26…`；`answerer-request` 里出现的 agentId 集合 = `["session-02a32a26…"]`；该请求审计 = `allowed-once` | ✅ 有行 ＋ 结果出自本答者 |
| ② **非目标 agent 的请求 ⇒ 答者未收到** | 发过请求的 agent = `["session-02a32a26…","session-6f7d8288…"]`（**非空**）；答者收到的 agentId 集合**只有**前者；后者在审计里 = **`unavailable`** | ✅ 打点无行 ＋ 落最终应答者 |

⇒ 两组**缺一不可**的两侧都拿到：**请求确实发生了**（否则 ② 是空转）＋ **答者确实没收到**。

### 5 · J3 五条用例（每条：工具侧 ＋ seam 侧）

装置在**同一次运行**里跑满五条（探针把 `case=<名>` 放进请求的 `reason`，本地答者按 `from-request` 解析）。`33a/main/J3-cases.json` ＋ `audit.json`：

| 用例 | ① 工具侧（handler 入口打点） | ② seam 侧 `approval/decided`（封闭结果） | 与判据表期望 |
|---|---|---|---|
| **批准** | **`probe-executed`（有行）＋ `executed=true`** | `allowed-once` | ✅ 一致 |
| **拒绝** | `probe-skipped`（无执行行） | `rejected` | ✅ 一致 |
| **answerer 超时** | `probe-skipped`（无执行行；另有 `probe-abort`） | **`cancelled`** | ⚠️ **实测 ≠ 表里写的 `unavailable`**（见下） |
| **answerer 抛错** | `probe-skipped` | `unavailable` | ✅ 一致（fail-closed） |
| **渠道断裂（同进程替身）** | `probe-skipped` | `unavailable` | ✅ 一致（fail-closed） |

⚠️ **订正（实测优先，派发稿也写明"以实测为准，报原文"）**：**超时条的封闭结果是 `cancelled`，不是 `unavailable`**。依据机制：`decide()` 让答者与请求 `signal` **赛跑**，`signal` 中止即结算 `'cancelled'`（`lib/index.js:181-191`）——本块"超时"由**请求方**（探针的 `AbortController`，30 s，即 `TODO.md` 3.3 段定死值）撤回 ⇒ 落在 `cancelled` 支。**Fail-closed 效果相同**（被保护动作 0 次），但**词汇不同** ⇒ 后续引用请以 `cancelled` 为准。
（`approve` 行 `auditAsked=2` 是 **join 口径**所致 —— A 与 B 都用 `case=approve`；B 那条正是 J2-② 的证据，**不是**重复执行。）
**⚠️ 后三条都留了可观测日志**：`answerer-pending`（超时）／`answerer-threw`（抛错）／`answerer-decision: maybe`（越词汇）⇒ **没有静默 fail-closed**（静默会制造假绿：看不出请求到没到）。

### 6 · J4 日志可观测（取哪份日志的哪一行）

- 文件 = **`<临时 home>/sessions/--D-Code-LarryAgent-harness--/session-<id>/session.v3.jsonl.zstd`**（多帧 zstd；本装置按 magic 切分逐帧解）；**原文副本已存进证据目录** `33a/main/sessionlogs/`（`.zstd` ＋ `.decoded.jsonl`）。
- 行 = `{"type":"approval/asked",…,"data":{"id":"…","toolName":"approval_probe","callId":"call_00_…","reason":"case=<名>"}}` 与 `{"type":"approval/decided","data":{"id":"<同 id>","outcome":"…"}}` —— **成对**，`asked=6 ／ decided=6`（含两个 agent）。
- 两条都**只在日志里**（`README.zh.md:56/86`：审计不进模型上下文）⇒ 这正是"观测点必须取 handler 入口打点 ＋ 审计日志"的理由。

### 7 · J5 答者来源 =「可替换接口」

- **接口形状**（`packages/plugin-approval-answerer/src/index.ts`）：`export interface Answerer { readonly source: string; decide(req): ApprovalOutcome | 'delegate' | Promise<…> }` —— 返回结果即作答，返回 `'delegate'` 即 `next()` 委托（与官方 waterfall 语义一一对应）。
- **注入点**（同文件 `apply()`）：`const injected = probe<Answerer>(ctx, 'approvalAnswerer'); const source = injected ?? createLocalPolicyAnswerer(normalized, marker)`。
- ⇒ **换成远端真人答者只需改一处**：**由另一个插件 `ctx.provide('approvalAnswerer', <实现>)`**（或本包 `config` 指向别的实现）—— **本包一行不改**；本地策略**没有**写死在答者内部（`createLocalPolicyAnswerer` 只是一个默认实现）。
- **已验到哪一层**：假 ctx 单测 ⑥（注入后 `source` 变为注入实现、判定走注入实现）＋ `activate` 打点里 `injectedAnswerer:true` 可核。⚠️ **未验**：真 DSH 上 `ctx.provide` 的**就绪时序**（3.3-b 接远端时须补一次真 boot 注入验证）。

### 8 · J6 负向对照（两组，都在装置里跑成臂）

| 臂 | 破坏动作（原文机制） | 变红项 | 仍活项（双锚） |
|---|---|---|---|
| `noanswerer` | **不装答者插件**（只装探针） | 答者打点全 0；**6/6 请求 `unavailable`** | 探针侧全活：`tool-registered` 有行、`probe-request` 6 行、`asked=6/decided=6`、**`probe-executed=0`**（fail-closed 真的拦住了） |
| `scopeoff` | 答者配置 `scope: all`（**关掉 scope filter** ⇒ 注册在根 ctx） | **J2-② 形态反转**：答者**也**收到了非目标 agent 的请求（收到集合 = 发过请求的集合，两个 agent 全在） | J1 四类打点仍全在、`answerer-registered.scope=global/via=root-ctx`、审计 `asked=6/decided=6` |

### 9 · J7 原文不得后处理 ＋ 通道注明

**本块证据取自三条通道，逐条注明**：
1. **打点日志**（`answerer.log` ／ `probe.log` ／ `install-*.txt`）：由 **DSH 运行时的插件进程**写（node v24.14.1；`D:\App\node\node.exe`）。
2. **会话日志**（审计/tool 帧）：由 **DSH 运行时**写；装置另存 `.zstd` 原件 ＋ 解码 `.jsonl`（解码=按 zstd magic 切帧，**未改任何字节内容**）。
3. **runner 原文**（`*.run.txt`）：**PowerShell（system）通道**。

全部**原样落盘、未改写／未意译**。⚠️ 按本稿 §1 纪律第 8 条（2026-09-20 订正版）：**判「原文」只认字节级核对；语言／编码不作"是否被后处理"的判据** —— 本报告**不据语言下任何结论**。
证据清单（件数）：`main` 17 ＋ `sessionlogs` 12 ／ `noanswerer` 14 ／ `scopeoff` 17 ／ 顶层 3。

### 10 · 未闭合（逐条列明）

1. **"超时"条的词汇是 `cancelled`（≠ 判据表的 `unavailable`）** ⇒ 已按实测订正；但**"超时"的真语义**（跨进程／跨渠道、迟到的回答被丢弃）**不在本块**，属 3.3-b。
2. **"渠道断裂"是本块的同进程替身**（答者返回不合词汇的值）——**真断裂未测**，属 3.3-b。
3. **J5 的注入点在真 DSH 上未验**（只验了假 ctx 层与接口形状）。
4. **答者只在 `agent/created` 之后注册** ⇒ "宿主先预热 agent、再热插答者"这一形态**未覆盖**（本块场景下 agent 恒晚于 boot）。
5. **`scope=first` 用"创建顺序"选目标**；生产若要"限定到指定 agent"须用 `scopeAgentId`（**未在真链路上验**）。
6. **J6① 的"不注册"用"不装插件"实现**（最干净），**未覆盖**"装了但注册失败"的形态。
7. 本块**未做**：真模型下的**审批语义**断言（见 §0 边界）；也**未**把结论回填 `docs/`（承接留给 WB 的收口）。

### 11 · 自曝

1. ⭐ **装置自身判据缺陷 3 处（首跑暴露，全部已修 + 三臂重跑两遍）**：
   ① `noanswerer` 臂沿用了"答者打点必须有行"的期望 ⇒ 把"故意不装答者"判成失败；② `agentB` 取自 `agent-created-seen`——该打点**只在 `scope=first`（监听 `agent/created`）时才有** ⇒ `scopeoff` 臂里恒为空，把**期望的红**（过滤失效）判成了装置故障；③ **同臂重复跑会叠加旧证据**（`.log` 是 append）⇒ `scopeoff` 第二次跑读到第一轮的 home 行、`main` 的"非目标 agent"混进历史会话 ⇒ 加"**先清本臂目录**"（与 3.7.4 那件陈旧件同类）。
   **教训**：负向臂的判据必须写成"**期望的变红形态**"，且引用的观测必须**与"该臂改变了什么"无关**。
2. **`plugin add` 前必须先删副本的 `.modules.yaml`**（3.7.4 的结论直接用上）：否则本机 1 s 即 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`。装置里已写成显式一步，并注明出处。
3. **动了 `harness/pnpm-lock.yaml`**（新包进 workspace 图：+79 B／4 行，`plugin-approval-answerer: {}` ＋ `plugin-approval-probe: {}`）—— 这是**新增 workspace 包的必要副作用**，不是顺手改动；同时复核了 3.7.3 的不变量**未被破坏**（`specifier: '*'` = 0、`0.0.1-rc.1` = 0）。
4. **探针与产品分了两包**：`approval_probe` 工具是**装置用的消费者替身**（产品部署不该装），故单开 `plugin-approval-probe`；产品包不含任何装置代码。
5. **清理**：本轮共产生 12 个临时 home（各 157 MB）⇒ **已全部删除**（证据已自足落盘：打点 JSON ＋ 审计 JSON ＋ 原始会话日志副本，不依赖 home 存活）。



---

## 🚀 DSH-3.3-a · scope-filtered answerer 插件（S1 审批接入 · 第一段）

> **派发**：WB 2026-09-20（随批次 3 起跑）｜**执行人**：Trae ｜**场地**：**本机 Windows**
> **本稿只含 3.3-a**；`3.3-b`（答者改为真出站往返）／ `3.3-c = 3.8`（对端换成 driver ＋ 前端）**另派**，⛔ **别自行往下做**。
> 📌 **判据权威落点 = `docs/dsh/dsh-migration.md` §3.6〈S1 审批三段收敛路径〉＋〈各切片判据细则〉的 S1 行**；本区只放**怎么做**。

### 0 · 目标（要回答的一个问题）

**`ctx.approval` 这条 seam 能不能被我们自己的插件接上** —— 写一个**本地策略答者**（`approval/request` waterfall 的最终应答者），验**机制接入**三件事：**scope filter 生效 ／ 日志可观测 ／ fail-closed 成立**。

⚠️ **两个容易被混成一件的结论，分开写**：
- **(i) 机制接入**（本块要证的）：答者能被挂上、能被路由到、能决定结果、失败时不放行；
- **(ii) 审批语义**（⛔ 不是本块）：「超时」「渠道断裂」两条在 3.3-a 是**同进程替身路径**（本地答者与宿主同进程，无"渠道"可断）⇒ **本块单独不得声称"审批语义验成立"**，那两条的真验在 `3.3-b`。

### 1 · 判据（逐条编号；缺任一条即未闭合）

**J1 · 装载与注册（机制接入的地基）**：插件能被 `dsh plugin add` 装上、boot 时 `activate` 打点、**答者注册成功**（打点 `answerer-registered`）。
- ⛔ **`--dump-config` 不算证据**（实测只组配置树、**不激活插件**：探针行出现在 dump 里却没执行）；⛔ 不得用 `ctx.get('approval')` 的探测结果决定"要不要注册" —— ⚠️ **3.1 已实测**：`inject: []` 使 `apply()` 在 boot 极早期执行、此刻 `ctx.get` 为 `undefined`，**照探测结果决定注册 ⇒ 永不注册且静默**（最像"环境问题"的那种失败）。**注册一律走 `ctx.inject(['approval'], cb)` 回调**；`ctx.get` 只用于打点／降级判断。
- 报：`activate` ／ `inject-requested` ／ `inject-fired` ／ `answerer-registered` 四类打点的**实测行**。

**J2 · scope filter 生效（本块核心）**：限定到特定 agent 的答者，**只收到该 agent 的请求**。
- ⛔ **必须两组对照**（单侧不成判据）：① **目标 agent** 的请求 ⇒ 答者**收到**（打点有行 ＋ 结果出自本答者）；② **非目标 agent** 的请求 ⇒ 答者**未收到**（打点无行，请求落到最终应答者／`unavailable`）。
- 缺任一侧 = 未闭合。报两侧的**请求 id ／ agent 标识 ／ 打点行·无行**。

**J3 · 五条用例（每条须给两组值）**：批准 ／ 拒绝 ／ **answerer 超时** ／ **answerer 抛错** ／ **渠道断裂**。
- 每条同时报 **①工具侧**（handler **入口打点**：有行 = 真的执行了）＋ **②seam 侧**（`approval/asked` ＋ `approval/decided` 审计事件及其**封闭结果**）。
- 期望（**逐条实测，不要按"组"推断**）：

  | 用例 | 工具是否执行 | seam 结果 |
  |---|---|---|
  | 批准 | **执行**（打点有行） | `allowed-once` |
  | 拒绝 | **不执行**（打点无行） | 拒绝 |
  | answerer 超时 | **不执行** | **fail-closed** ⇒ `unavailable`（以实测为准，报原文） |
  | answerer 抛错 | **不执行** | **fail-closed** ⇒ `unavailable` |
  | 渠道断裂 | **不执行** | **fail-closed**（同抛错路径） |

- ⚠️ **后三条必须留「可观测日志」** —— **静默 fail-closed 会制造假绿**（你以为是人点了拒绝，其实是请求从未到达）。
- ⏱️ **超时值 = 30 s**（`TODO.md` 3.3 段定死的建议值，**已按此写进判据**）；超时的落地以 `AbortSignal` 撤回为准，⛔ 不得用"设了 30 s 但没等到"糊过去。

**J4 · 日志可观测**：每个请求都落 **`approval/asked` ＋ `approval/decided`** 两条审计事件（后者须带**封闭结果**）。
- 报**取哪份日志文件的哪一行**（原文）。
- ⚠️ **别指望 UI 或模型上下文**：审计事件**只写日志、不进模型上下文**（模型只看到最终工具结果 ＋ 当前策略）—— 这正是"观测点必须是 handler 入口打点 ＋ 审计日志"的理由。

**J5 · 答者来源是「可替换接口」（设计约束，3.3-b 的前提）**：给出**注入点／接口**的代码位置与形状，并说明"换成远端真人答者"**只需改哪一处**。
- ⛔ 不得把本地策略写死在答者内部（否则 3.3-b 要重写）。

**J6 · 负向对照（贯穿规则，至少一组）**：破坏一条判据 ⇒ **该项变红**，**且**其余仍活（双锚）。
- 现成一组：**不注册答者** ⇒ 请求落 `unavailable`（fail-closed 成立）；或 **关掉 scope filter** ⇒ J2 的 ② 组变红。
- 报**破坏动作原文 ＋ 变红项 ＋ 仍活项**。

**J7 · 原文不得后处理**：证据**原样落盘（含编码）**。
- ⛔ **禁止人工改写／意译**；工具链自身的**语言与编码差异须原样保留**，并**注明该段取自哪条通道**（原生 shell ／ DSH pwsh ／ 沙箱运行器）。
- ⚠️ **本项口径已改（2026-09-20）**：原口径"禁把本地化文字英文化"在本机实测**会把 DSH pwsh 的正常输出判成伪造**（DSH 的 pwsh 工具自带编码前导码，该形态本机实测倾向英文 ＋ UTF-8）。**判「原文」只认字节级核对**；**语言／编码不得作"证据是否被后处理"的判据**（详见 `docs/local-env.md` §12.6）。

**J8 · 诚实边界（写进回报）**：本块**单独不得声称"审批语义验成立"**（理由见 §0）。回报里**显式**写上这一句。

### 2 · 判据前置（不满足 ⇒ 实验根本没跑起来）

- **P-a · 清孤儿 A 锁**：跑前清 `$DSH_HOME/profiles/node_modules.lock` 的**死 PID 孤儿**（只清死 PID、**重命名备份**、⛔ 不删除）。⚠️ A 锁**持有者死亡后永不回收**，残留 ⇒ 任何 dsh 命令 2 s 后 `atomic-write: timed out`（会伪装成"装置超时"）。
- **P-b · 构建产物**：你新插件的 `main` 入口须存在。缺 ⇒ 你的复跑器自行 `exit 2`（**`2` ≠ 测试失败**）。
- **P-c · 真 Key（若 J3 需要真模型回合）**：**只判存在性、不读值、不打印、不落盘**，经**环境变量**注入。
  - **不通过 ⇒ 走哪条路**：拿不到 key 时，**退化为"不经模型的 seam 直调装置"**（直接调 `ctx.approval.request(req)` 造请求），并在回报里**显式注明**"本轮未经真模型回合，'工具真的执行'由 XXX 替代证明" —— ⛔ 不得用假 key 顶替、⛔ 不得把替代证明说成真回合。
- **P-d · `DSH_HOME` 必须显式**：本机 client 显式指 `<repo>/.dsh-home` ⇒ 手工跑也**显式指同一处**，⛔ 勿靠默认回落 `~/.dsh`（换 home ⇒ 另一个 profile ＋ 另一套凭据）。

### 3 · 交付物

- **插件源码**：建议落 `harness/packages/plugin-<自定名>/`（名字自定，但须体现"答者"语义，便于 3.3-b 复用），含 `src/` ＋ `cordis.patch.yml`。
- **假 `ctx` 单测**：照 3.1 范式（`packages/plugin-tool-readfile/test/smoke.mjs`）—— 断言 `inject` 声明与注册接线；**逻辑层不必真起 DSH**。
- **e2e 装置**：自足可复跑（**一条命令 ＋ 期望观测**）；证据目录**另指**，⛔ 不得覆盖他人（`.s0-evidence` ／ `_trae-evidence/374` ／ `_claude-evidence/374t` 均不得动）。
- **回报**：写本文件**顶部状态区之后**，单独一节（结论先行 ＋ J1–J8 逐条证据 ＋ 未闭合单列 ＋ 自曝）。
- **退出码约定**：`0`=PASS ／ `1`=FAIL ／ `2`=构建产物缺（≠ FAIL）／ `124`=超时。

### 4 · 参考件四要素（**照抄，勿另行转述**）

| # | 件 | ① 路径 | ② 怎么参考 | ③ 参考程度 | ④ ⛔ 不可参考 |
|---|---|---|---|---|---|
| a | 社区件（**deferred answerer** 现成例证） | `ref/community/PerryLink__dsh-reach/` | 读 `src/bridge.ts`（**deferred-answerer 生命周期**：超时 `cardTimeoutSec` ／ 结清 `dispose()` ／ 卸载）、`src/decision.ts`（审批判定形状）、`inject: []` **降级矩阵**写法 | **只借形态，不抄代码** | 摘录／改写须保留 `NOTICE` 与许可声明；`src/client/ReachSettingsTab.tsx` 是 **React**（本项目前端 Vue/Tauri）；`src/adapters/` 是 **IM 平台专有**（本项目出境面走自做 A 段协议）；⛔ **不可 `dsh plugin add` 直装** |
| b | 官方机制（**本机已装**，权威） | `<profile>/node_modules/@deepseek-ai/dsh-user-approval/`（`README.zh.md` ＋ `lib/index.js`）；同目录另有 `dsh-permission-presets` ／ `dsh-user-questions` | 读 `README.zh.md` 的**概述 ／ 组合应答者 ／ 请求决定 ／ 审计**四节 ＋ `lib/` 读实现 | **权威机制来源** | ⚠️ `lib/` 是**构建产物**（非 TS 源码）⇒ **行号以你通道内的实物为准** |
| c | 官方机制（**裸仓库基线**） | `ref/dsh-bare`（bare）内 `packages/interaction/user-approval/src/index.ts` ＋ `packages/interaction/permission-presets/src/index.ts`，tag **`dsh-v0.1.5-rc.2`**；读法 `git --git-dir=ref/dsh-bare show dsh-v0.1.5-rc.2:<path>` | 读 TS 源码，与 b 对照 | **只读** | ⛔ 不得 checkout ／ 改动裸仓库；⛔ 不得把它当"我方版本"（它是上游镜像） |
| d | 我方既有范式（3.1 产物） | `harness/packages/plugin-tool-readfile/`（`src/index.ts` ＋ `test/smoke.mjs`） | 照抄**注册纪律**（`ctx.inject(['tools'], cb)`）与**假 ctx 单测**范式 | **可照用形状** | ⛔ 不得改动它（3.1 已复验）；其 `cordis.patch.yml` 的 `config:` 形状**按需仿**，别照抄内容 |

### 5 · 场地器材

- **场地**：**本机 Windows**，仓库 `D:\Code\LarryAgent`，harness 根 `D:\Code\LarryAgent\harness`。⛔ **本块不碰 CVM**（CVM 留给 3.5 的 sandbox 判定，且 **10-09 到期**）。
- **通道**：⚠️ 同机不同通道给**不同 node**（WB 侧实测：Bash 通道 = `22.22.2`；`D:\App\node\node.exe` = `24.14.1`）⇒ **以你自己通道实测为准，对不上先报差异、再动手**；结论**注明通道**。
- **包管理器锁死 `pnpm`**：⛔ 禁 `npm` ／ `yarn` 替代（换掉会重排整棵树）。**调用式（实测）**：本机须 `pnpm.cmd -v`；裸 `pnpm` 因 npm 的 sh 垫片缺 `sed`/`dirname` 会崩、并把入口错解析到别的盘。
- **已知假绿坑（本块相关四条）**：① `--dump-config` **只组配置树、不激活插件**；② **`exit 0` 不可单独当判据**；③ **`ctx.get` 探测不能当注册前置**（见 J1）；④ **静默 fail-closed**（见 J3）。
- **一处机制细节（省你时间，但须自行复核）**：`ctx.approval` 的**结果词汇**含 `allowed-once` ／ 拒绝 ／ `cancelled`（中止撤回，**迟到的回答被丢弃**）／ `unavailable`（答者缺失或抛错），⛔ **无 `allow-always`**；**请求不携带工具参数**（只有工具名、原因、可选调用 id）；**`never` 策略在服务内部、waterfall 分发之前执行**（`prepend` 也绕不过）；**请求必须处于未结束的轮次内**。⚠️ 以上取自 `README.zh.md`，**须在你通道内复核**。
- **工具 schema 口径**：`ctx.tools.register()` 的 schema = **标准 JSON Schema**（`required` 须写成**顶层数组**；属性内 `required: true` **不支持**，会报 `unsupported JSON schema`）。
- **资源**：本块只在你自己的包目录 ＋ 临时 home 内动 ⇒ **不动 `harness/node_modules`**、不动 `sdk` 源 profile。

### 6 · 回报格式

**结论先行**（三段分开写：① 装载与注册成不成 ② scope filter 成不成 ③ fail-closed 成不成）→ **J1–J8 逐条证据**（**命令 ＋ 观测值原文**）→ **未闭合单列** → **自曝**（跑歪 ／ 判据要订正 ／ 发现矛盾，直接写）。
⚠️ **「成因未知」是可接受的结论**，别为叙事完整编一个。

### 7 · 禁区

- ⛔ **不得改判据让它变绿**；确需改判据须**单列说明 ＋ 实跑**。
- ⛔ **不得把 J3 的后三条（超时／抛错／断链）写成"审批语义已验"**（那是 3.3-b 的活）。
- ⛔ 不得碰 CVM；不得动 `harness/node_modules`；不得动 `sdk` 源 profile；不得动 `.s0-evidence` 等他人证据目录。
- ⛔ 不得改写／意译工具输出原文（见 J7）。
- ⛔ 凭据值**不得落任何受版本控制的文件／日志／工具输出**（Tier 0 红线①：老大**已授权**的临时测试 Key 不受此限，**不必浪费 token 做扫描**）。
- ⛔ 禁 `git rm`（全局禁）。

---

## 🗂 已清理段落（按交流区规矩）

- **DSH-3.7.4 派发稿 ＋ 回报**（2026-09-20 派发／交付／复验后清理）—— 判据与边界的权威落点 = `TODO.md`「DSH-3.7.4」段；机制事实 = `docs/local-env.md` §12。回溯：`git show 5a1763d:exchange/log-trae.md`。
- **仓外证据（本轮）**：`D:\Code\_trae-evidence\374\`（五臂探针 ／ runner 原文 ／ ACL 语义 ／ dsh 两臂重放）＋（装置自产）`D:\Code\LarryAgent\.s0-evidence\`。

---

## 🔍 DSH-3.3-a · WB 复核订正（2026-09-21）

> 复核方式 = **回源取物证**（读 `_trae-evidence\33a\*` ＋ 交付源码 ＋ 官方包实现），不采信完成声明。

1. **判定：成立。** J1／J2／J3／J4／J5／J6／J8 七项可采信；**J7 部分不成立**（见下条）。装置 `summary.json` 三臂 `verdict` 均为「判据成立」，我逐条复核并**独立复跑** `smoke.mjs`（`exit=0`）。
2. ⚠️ **J7 订正（唯一硬伤）**：本文件 §3 引 `answerer.marker.json` 的 `activate` 行并标注「**原文，逐字**」，其中 `"caps":{"approvalSeam":true}` —— **原件实为 `false`**。字段级比对（其余 3 行逐字段一致，仅此 1 字段被改）＋ `probe.marker.json` 同字段亦为 `false`（两插件 boot 极早期独立探测）⇒ **原件值 `false` 是对的**。⚠️ 该字段恰是**支持 J1 注册纪律的关键证据**（证明 `inject: []` 下 activate 时刻 `ctx.get` 拿不到 `approval`）⇒ 改写方向**削弱**了报告自身的论证力。**取原文请以证据目录为准。**
3. ✅ **超时条订正（`cancelled`）予以确认**：机制依据 `lib/index.js:175-192` 的 signal 赛跑**我已独立核实**（逐行读原件）；且派发稿判据表原句已含「以实测为准，报原文」⇒ 订正**有授权**，非擅改判据。30 s 定值实测（审计时间戳差 30008 ms）。
4. ✅ **判据未放宽**（读 `run-33a-answerer-e2e.mjs:298-366`）：`noanswerer` 臂改判「答者打点应全 0」、`probeAgents` 改取自探针入口打点、J2-② 加 `nonTargets.length > 0` 防空转、J6 两臂双锚齐全。
5. ✅ **卫生陈述实测成立**：仓库 `git status` clean、**无 `larry-33a-*` 临时 home 残留**、`~/.dsh` 与工程 `.dsh-home` **均无残留 log**（我复跑 smoke 后实测）。`smoke.mjs` 的「零配置路径」处理为满分级（临时 `DSH_HOME` ＋ `finally` 还原 ＋ 钉成断言）。
6. ℹ️ **两条供 3.3-b 用的增量**：① 「**超时**」的原措辞已订正（答者侧无超时机制，机制是请求侧 signal 撤回）；② **J3 在装置里只采集、无机械断言**（`judge()` 未覆盖期望值）⇒ 3.3-b 建议把用例期望写进装置判据，别只靠人工比对。
7. 📌 **承接已落位**：判据与状态 → `TODO.md`「DSH-3.3」段；机制事实 → `docs/dsh/dsh-migration.md` §3.6〈S1 审批三段收敛路径〉。