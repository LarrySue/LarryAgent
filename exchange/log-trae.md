# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.3-b** | Trae | 本机（Windows） | 🚀 **已派发 · 待起跑** | 2026-09-21 |

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


## 🚀 DSH-3.3-b · 真出站往返（S1 审批接入 · 第二段）

> **状态：已派发（2026-09-21 WB）· 待起跑** ｜ 执行人 **Trae** ｜ 场地 **本机（Windows）**
> 判据与边界的权威落点 = `TODO.md`「DSH-3.3」段 ＋ `docs/dsh/dsh-migration.md` §3.6（本区只放「怎么做」）
> ⚠️ 本块**只做 b 段**。`3.3-c(=3.8)` 另派，**别自行往下做**。

### §0 目标

把 3.3-a 的「**本地策略答者**」换成**真跨进程往返**：答者位于 dsh 进程内，把 `approval/request` **发出去**给另一个进程（**薄客户端 ＋ stub 对端**），拿到答案再作答。

验 §3.6 表里「② 的真风险」四条 —— **跨进程等待 ／ 超时收尾 ／ 对端消失 ／ 取消传播**。

- ⛔ **不依赖 3.8**（A 段协议）；本块**只到 stub 对端**为止，**不做真人/前端**（那是 3.3-c）。
- ⛔ 3.3-a 单独**不得**声称「审批语义验成立」（超时/断链是同进程替身）—— **那两条的真验就是本块**。

### §1 判据（逐条可验）

#### J1 · 第一件：通路可行性（**未做不得往下走**）

先实测「**dsh 进程内的插件，能否把一条 JSON-RPC 请求发到对端进程**」，给出**至少一条走通的路径** ＋ 选择依据。

WB 已实测的三条事实（**可直接引用，不必重查**；要复核就自己再读一遍源码）：

| 事实 | 出处 |
|---|---|
| `JsonRpcLineTransport` 是**公开导出**，含 `onRequest` ／ `request(method, params, signal?)` ／ `notify` ／ `flush` ／ `start` ／ `close`；**未装 handler 回 `-32601`**、**handler 抛错回 `-32603`**、**无 handler 的通知被丢弃** | `@deepseek-ai/dsh-sdk-protocol` `lib/index.js:252`（导出）、`:68`（onRequest）、`:199`（-32601）；`lib/types/transport.d.ts:42-102`（全文接口） |
| `dsh-sdk-jsonrpc-server` 的 `apply()` 里 `new JsonRpcLineTransport(input, output)` 是**闭包内造**、**全文无任何 `ctx.provide`** ⇒ **transport 经 `ctx` 拿不到** —— 这就是 §3.6 那条「待查」的答案 | `dsh-sdk-jsonrpc-server/lib/index.js:257-293`（apply 全文；`:268` 造 transport） |
| 官方**装配机制**：`dsh-sdk-app` 在命令行解析成功后 `ctx.provide('sdkAppStartup', { accepted: true })`；`sdk-jsonrpc-server` 行声明 **`inject: [sdkAppStartup, loader]`** ⇒ 「等启动服务」的落点是**插件行的 inject** | `dsh-sdk-app/lib/index.js:16,40`；`dsh-sdk-app/cordis.patch.yml` 的 `insert` 段 |

**两条候选路径**（实测后**择一**，报告里给选择依据）：

- **路 A（WB 判定首选，代价最小）**：在 profile 补丁层把官方那行 **`disabled: true`**，再 **`insert`** 一个自己的 relay 行：

  ```yaml
  - id: sdk-jsonrpc-server
    disabled: true
  - insert:
      - id: <你的 relay 行 id>
        name: '<你的 relay 包名>'
        inject: [sdkAppStartup, loader]
  ```

  relay 内部**照抄官方那 30 行 apply**（`HarnessSdkJsonRpcServer` 是**公开导出的类**，`:296` ⇒ 可直接 `new` 复用），**只多一行 `ctx.provide('<服务名>', transport)`** 把 transport 暴露给答者插件。
  - ⚠️ **不得用 `- id: X` ＋ `name:` 覆盖同名行** —— **3.7.2 已实测不生效**（`profiles/sdk/cordis.patch.yml` 顶部注释有记载：loader 的 id 定位**只做 config 覆盖，不改该行的插件来源**）。
  - ⚠️ 官方 server 的 `Config` **只认 `maxTokensAsSuccess`** ⇒ **不能靠 config 给 transport 开后门**。
- **路 B**：不抢 stdio，**另开一条边**（如插件内 `ctx.get('subprocess')` 起子进程 ／ 额外 fd ／ unix socket）。

⛔ **不许把「改了装配树」当既成事实不报** —— 路 A **偏离官方 profile 组合**（禁用了官方 server 行），须在报告里明写代价与维护影响。

#### J2 · 跨进程等待（端到端往返**真发生**）

- 请求**真的离开了 dsh 进程**、到了对端进程；**对端的答案回传后决策生效**（被保护动作**真的发生 / 真的被拦**）。
- **取证必须两侧各自留痕**：dsh 侧插件打点 **＋** 对端进程自己的日志。⛔ **单一侧自述不算**。
- 负向：对端**收到但不回**（挂起）⇒ 观察 dsh 侧状态（**不得静默放行**）。

#### J3 · 超时收尾（⚠️ **两路必须分清**，本块最易错处）

| 路 | 机制 | 落哪个词汇 |
|---|---|---|
| **(a) 请求侧 signal** | `req.signal` 中止 ⇒ `decide()` 里赛跑，abort 先到 | **`cancelled`**（`dsh-user-approval/lib/index.js:181-191`） |
| **(b) 答者侧自建超时** | **官方答者侧不存在超时计时器** ⇒ 想要超时**必须自己在答者里实现**（参照 `PerryLink__dsh-reach/src/bridge.ts:387-395` 的 `setTimeout(cardTimeoutSec*1000)`） | **`unavailable` 或 `rejected`** —— ⛔ **不是 `cancelled`** |

- ⛔ **不许去找「答者超时 API」** —— 它不存在；`TODO.md:159` 已订正此措辞。
- 两路**各给一组实测**，并明确写「哪条路落在哪个词汇」。

#### J4 · 对端消失

- 场景：**建连之后**把对端进程/传输终止（如 kill stub 对端）。
- 期望：dsh 侧 **pending 请求被 reject**（`JsonRpcLineTransport.close()` 语义 = detach ＋ reject pending、**不销毁流**；导出面有 `TransportClosedError`），**且 fail-closed**（被保护动作**不得发生**）。
- **须留可观测日志** —— ⛔ **静默 fail-closed ＝ 假绿源**，看不出请求到没到。

#### J5 · 取消传播（本块含金量最高）

- 场景：dsh 侧请求被撤回（`req.signal` abort）⇒ **出站请求必须也 abort**。
- 依据（原文）：`request(method, params, signal?)` —— 「aborting removes the pending entry (**no state is retained for a response that may never come**)」（`transport.d.ts:80-82`）。
- 期望：**pending 条目被移除、无泄漏**；对端**迟到的回答被丢弃**、**不得改变结果**。
- 取证：pending 数的可观测 ＋ **迟到回答被丢弃**的实证。

#### J6 · 负向对照（不做则「真的通了」与「判据没生效」不可区分）

- **不装远端答者** ⇒ 请求落 `unavailable`、被保护动作 **0 次**（复现 3.3-a 的 fail-closed 锚）。
- **对端回 `-32601`**（未装 handler 的天然形态）⇒ 观察 dsh 侧形态 —— 这是**天然可观测的 fail-closed 信号**。

### §2 判据前置（未满足**不许开跑**）

- [ ] **依赖缺口（WB 实测）**：`@deepseek-ai/dsh-sdk-protocol` **不在** `harness/package.json` ⇒ `import` 报 **`ERR_MODULE_NOT_FOUND`**。先补依赖（`pnpm add @deepseek-ai/dsh-sdk-protocol@0.1.5-rc.2`）。⚠️ 会动 `pnpm-lock.yaml`（3.3-a 已动过一次）⇒ **须在报告里说明**。
- [ ] **不能借道 client**：`dsh-sdk-client` **不重导出** `JsonRpcLineTransport`（WB 实测导出面 keys = `DeepSeekHarness / HarnessClient / HarnessSession / JsonRpcResponseError / RequestTimeoutError / SdkProtocolError / TransportClosedError`）。
- [ ] **`onRequest` 是替换语义**（原文「**replacing any prior handler**」）⇒ 若你的设计与官方 server **抢装 handler**，**后装者会静默顶掉先装者** ⇒ 必须显式处置（或干脆不抢，见 J1 路 A）。
- [ ] **被保护动作的消费者替身**：复用 3.3-a 的 `packages/plugin-approval-probe`（`approval_probe` 工具）。
- [ ] **Key**：只进子进程 env、**只判存在性**、⛔ 不落任何文件、⛔ 不打印、⛔ 不进回报。
- [ ] **等待必须设上限**：本块全是「等待」类判据 ⇒ 每个等待**显式计时**（建议 30 s 级，与 3.3-a 一致）。

### §3 交付物

- (a) **B 段中继插件**（新包，命名自定，如 `plugin-sdk-relay`）—— 造 transport ＋ 复用 `HarnessSdkJsonRpcServer` ＋ **`provide` transport**。
- (b) **远端答者插件**（新包，如 `plugin-approval-remote-answerer`）—— `ctx.provide('approvalAnswerer', remoteImpl)`。
  ⭐ **3.3-a 已留替换口**（`packages/plugin-approval-answerer/src/index.ts:190-192`）：

  ```ts
  // ⭐ J5 的替换点：别的插件只要 ctx.provide('approvalAnswerer', impl)，答者本体不动
  const injected = probe<Answerer>(ctx, 'approvalAnswerer')
  const source = injected ?? createLocalPolicyAnswerer(normalized, marker)
  ```

  ⇒ **⛔ 不要改 3.3-a 的包**（改了就等于把它一次性化，违反 §3.6「答者来源须是可替换接口」的设计约束）。
- (c) **薄客户端 ＋ stub 对端**（装置）—— **自己 `spawn`** ＋ `JsonRpcLineTransport(child.stdout, child.stdin)` ＋ `onRequest` 作答。
  ⛔ **不得用 `HarnessClient` / `DeepSeekHarness`** —— 它们内部**只挂 `onNotification`、无 `onRequest`**（`dsh-sdk-client/lib/index.js:405-411`）。
- (d) **一键复跑 runner**（`harness/scripts/run-33b-*.mjs`）—— 可扩 3.3-a 的 runner，但 **证据目录必须另指**（⛔ 不得覆盖 `_trae-evidence/33a`）。
- (e) **证据件**：逐条对应 J1–J6。
- (f) **回报**：写本文件末尾（顶部状态区同步）。

### §4 参考件（四要素）

| 件 | 路径（本机） | 用途 | 边界 |
|---|---|---|---|
| 官方传输层 | `<harness>/node_modules/.pnpm/` 内 `dsh-sdk-protocol`（⚠️ 不在顶层，见 §2） | `JsonRpcLineTransport` 的**接口与语义**（帧分类 ／ `-32601` ／ `-32603` ／ signal 放弃） | 只读参考；**先补依赖**才能 import |
| 官方装配样板 | `.dsh-home/profiles/node_modules/@deepseek-ai/dsh-sdk-jsonrpc-server/lib/index.js:257-293` | **照抄对象**：造 transport ＋ `new HarnessSdkJsonRpcServer` ＋ `onRequest` 三方法 ＋ `ctx.effect` 启动 | 只读参考 |
| 官方启动服务 | `.dsh-home/profiles/node_modules/@deepseek-ai/dsh-sdk-app/lib/index.js` ＋ 同目录 `cordis.patch.yml` | `ctx.provide('sdkAppStartup')` ／ 插件行 `inject` 的**现成范式** | 只读参考 |
| 社区照（超时/结清） | `ref/community/PerryLink__dsh-reach/src/bridge.ts:387-395`（`cardTimeoutSec`）、`src/index.ts:339-348`（注册 ＋ `bridge.dispose()`） | **超时**与**卸载结清**的现实例证 | 只读参考（Apache-2.0，**只借鉴不纳入**） |
| 3.3-a 产物 | `harness/packages/plugin-approval-answerer` ／ `plugin-approval-probe` ／ `harness/scripts/run-33a-answerer-e2e.mjs` | 复用 runner 骨架与探针 | ⛔ **答者包本体不改** |

### §5 场地器材

- **场地**：本机（Windows）。执行器 = `harness/node_modules/@deepseek-ai/dsh/lib/bin.js`（`--profile sdk`）。
- **home ＋ profile**：**临时 home** 里 `cp -r` 出来的 sdk profile **真副本**（源 profile 不动）—— 沿用 3.3-a runner 的做法。
- **插件装载**：`dsh plugin --profile sdk add <包目录>`（3.3-a runner `:129` 已有现成调用）。
- **配置等价性**：官方 profile 行 `sdk-jsonrpc-server` 的 config 是
  `maxTokensAsSuccess: !!js "process.env.DSH_MAX_TOKENS_AS_SUCCESS === undefined ? true : JSON.parse(...)"` ⇒ **默认 `true`**；你若替换该行，**须保持这个行为**，否则会引入与 3.3-a 不可比的变量。
- **runner 退出码**：沿用 `0 通过 ／ 1 判据失败 ／ 2 前置缺失 ／ 124 看门狗`。

### §6 回报格式

1. **J1 通路**：选了哪条路 ＋ **为什么** ＋ 实测证据（patch 层改动的 `git diff` ＋ 启动日志）。
2. **J2–J6**：逐条给「判据 ／ 期望 ／ **实测** ／ 物证路径 ／ **原文**（不改写、不意译）」。
3. **负向对照**：J6 两条各自的结果。
4. **自曝**：跑歪、覆盖、口径错、（若有）改动 `pnpm-lock.yaml` ／ profile 树 —— **一并写清**。
5. **诚实边界**：写清「哪些**没**验」（例如：stub 对端**不是真人**；method 名是**本块临时约定**，3.8 定稿后可能改名）。
6. **通道**：注明每个结论取自哪条通道（工具树 ／ shell ／ node 版本）。

### §7 禁区

- ⛔ 不碰 `3.3-c(=3.8)`（对端换 driver ＋ 前端）—— 那是另一块。
- ⛔ **不改 `packages/plugin-approval-answerer`**（3.3-a 的产物）。
- ⛔ **不覆盖** `_trae-evidence/33a` 与本块之外任何证据目录。
- ⛔ 不把 Key 落盘 ／ 打印 ／ 写进回报（只判存在性）。
- ⛔ **手工改写、意译、润色任何工具输出的「原文」** —— 语言 ／ 编码差异**原样保留并注明通道**；**语言 ／ 编码不得作「证据是否被后处理」的判据**。
- ⛔ 下失败判定前**先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
- ⛔ 收尾必核 `git status`（取证动作自身也会改现场）。

---
