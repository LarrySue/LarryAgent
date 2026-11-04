# Trae 协作区

> **属主 = 沈知砚(Trae)**,本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **③.2b 人审闸**（写入前必须过人） | **Trae** | `plugin-s4-memory/src/` ＋ 新探针目录 | 🔵 **在飞**：2026-11-04 20:30 派发，判据 W-1～W-8（见下方同名片发节）。⚠️ 三条硬前提已代验：审批只回四态**不带内容**／**必须有 open turn**／`write.ts` 目前是孤岛 | 2026-11-04 |

> 📌 **Trae 侧两条活账（2026-10-18 留痕）**：① **TRAE.md 注入力度**——L38「git 提交以 Trae 身份签名」全仓历史未生效（author 均为 SuLarry），Trae 自相关提交起以 `-c user.name='Trae'` 单次参数签名（历史不动）；**老大接手操心中**。② **key 来源规则空缺**——派发稿预设两个工程内 key 来源，未覆盖「老大直接给测试 key」场景；规则空缺处先查工程层 Tier 0，已沉淀 Trae 私有 memory。

- ⚠️ **不要把本区当承接目标**（活日志会被随时清理 ⇒ 引用必成断链）；**回溯一律 `git log -p -- exchange/log-trae.md`**。
- ⚠️ **通用纪律**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— ⛔ **本条后半句已作废（2026-09-20 WB 复验实测推翻）**：原文写「本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，**出现英文即非本机原始产物**）」—— **「出现英文即非本机产物」不成立**：本机实测 `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统／用户 UI 语言实测是 zh-CN）。⇒ **保留前半**（⛔ 不得人工改写 ／ 意译），**撤掉后半的推论**。**替代纪律**：判「原文」只认**字节级**核对（按 ACP 936 解 GBK，或直接比原始字节），并**注明该段取自哪条通道**；**语言 ／ 编码不得作"证据是否被后处理过"的判据**。详见 `docs/local-env.md` §12.6。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

---

> ✅ **WB 2026-11-04 12:25 · 探针两单已闭环并清退**：〈探针不再碰真实 home（H-1～H-8）〉＋〈守卫 `root` 改必填（N-1～N-4）〉均**复验成立**（老大原话「这种问题就是要在根本上改」）。四段派发／交付已清，结论在 `probe-guard.mjs` 文件头与 `p3holes-a-probe.mjs:191-236`，读数见〈🗂 已清理段落〉12:25 条。

## 📮 派发 · ③.2b 人审闸（写入前必须过人）（WB · 2026-11-04 20:30）—— 单件 W-1～W-8

> **来路**：`TODO.md` DSH-4〈③.2b · 人审闸〉（**前置＝③.2a 选定 ✅ 已定 (a) subagent**）。老大 2026-11-04 20:23「派吧」。
> **一句话目标**：让「**确认后才入库**」成为一条**机器可验的边界** —— 未批准 ⇒ 一个字节都不进 `memories`；批准 ⇒ 只进**被批准的那一版**。
> ⛔ **本单不产出摘要生成实现**（那是 ③.2a 的实现块）。本单用**测试构造的假摘要**验闸，与生成端解耦。

### 0 · 三个我实测出来的硬前提（⛔ 别按直觉写，会撞墙）

WB 2026-11-04 20:26-20:30 读**类型定义**（不是注释）得出，逐条给坐标：

**P1 ⚠️ 审批通道回传不了内容 —— 这是本单最要紧的一条**
`@deepseek-ai/dsh-user-approval` 的 `ApprovalService.request(req)` 返回 **`Promise<ApprovalOutcome>`**，而 `ApprovalOutcome = 'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'`（四态，`'allowed-once'` 是**唯一授权**）。
`ApprovalRequest` 的字段只有 `agent / toolName / callId / reason / signal`。
⇒ **TODO 里「确认（**可编辑**）后才入库」这个措辞预设了"审批能把编辑后的内容带回来"，而接口不支持。**
⇒ **必须拆成两个通道**：审批闸只**表决**（过／不过）；「编辑后的内容」走**独立的暂存通道**（见 W-3）。

**P2 ⚠️ 没有 open turn 时，ask 直接被拒**
同一段类型文档原文：*"The request requires **an open turn** because the audit pair must be enclosed by the durable log's commit/replay boundary; **an idle ask rejects** before appending anything."*
⇒ 闸只能挂在**turn 内**的事件上；在 turn 外（例如结尾异步收尾、定时任务）调 `request` 会直接拿不到 `allowed-once`。这不是 bug，是设计。

**P3 `write.ts` 目前是孤岛**
`grep -rn "writeMemorySummary\|insertMemoryRow" plugin-s4-memory/src/*.ts` ⇒ **只有 `write.ts` 内部的定义与互调，`index.ts` 零引用**（`index.ts` 的 import 里没有 `./write`）。
⇒ 本单要做的正是**把它接进真实写入路径**，并把闸包在中间。

### 1 · 判据（逐条给证据；⛔ 缺任一条即未闭合）

- **W-1 · 拒绝 ⇒ 不入库（带正证）**
  构造一条假摘要，答者回 **reject** ⇒ `SELECT COUNT(*) FROM memories` **前后相同**。
  ⚠️ **只报"没变化"不算**（表本来就空也是没变化）⇒ 必须同时给**正证**：同一条假摘要在 approve 下**确实写得进去**（W-2）。两臂成对才算。

- **W-2 · 批准 ⇒ 入库且内容一致**
  同一条假摘要，答者回 **approve** ⇒ 行数 **+1**，且落库内容与待审内容**逐字相同**（不是"长度相同"、不是"看起来像"）。

- **W-3 · ★编辑后确认 ⇒ 入库的是「编辑后的版本」，⛔ 不是原文**
  这是 P1 要求你**自己选形状**的那条（暂存文件／staging 表／其他皆可，**形状由你定，只要可验**）。
  测试构造：待审内容 **A** → 审批期间把暂存改成 **B** → 批准 ⇒ 库里**必须是 B**，且 **A 在库里 `SELECT` 零命中**。
  - 取证据：`SELECT content FROM memories WHERE ...` 的**实际值** ＋ 对 A 的检索式与命中数 0。
  - ⚠️ 若你判断"当前接口下编辑通道不可实现"，**直接报"不可实现 + 卡在哪一行类型"** —— 这是**合格结论**，⛔ 别硬造一个等价方案。

- **W-4 · fail-closed 三态逐态验（⛔ 不许合成一次）**
  `rejected` / `cancelled`（`signal` 中止）/ `unavailable`（答者缺失、答者抛错、或返回非词表值 —— 类型文档明写会归一为 `unavailable`）⇒ **每一种都不得入库**，逐态各跑一次、各给读数。
  > 文档原文：*"a missing or throwing answerer yields `'unavailable'` (fail closed), and a rogue non-vocabulary return value is normalized to `'unavailable'`"*

- **W-5 · ⛔ 不存在「默认全入」旁路**
  给**检索式 ＋ 命中数**：`writeMemorySummary` / `insertMemoryRow` 的调用点在 `src/` 下必须是**闸之后的那一处**；任何绕过审批直接写的路径必须为 **0**。
  ⚠️ 零命中要附检索式（含你遍历的目录范围），⛔ 别只写"没有了"。

- **W-6 · open turn 约束的实测（P2）**
  在**无 open turn** 的时机调 `request` ⇒ 期望**拿不到 `allowed-once`**（被拒或抛）。
  ⚠️ 若这个时机在你手上构造不出来，**报"未验 ＋ 为什么"**即可，⛔ 别为凑判据造假场景。

- **W-7 · 负证：闸必须能红（⚠️ 双锚）**
  故意**短路闸**（不调 `approval`，直接写）⇒ 期望 W-1／W-4 那组**必须变红**；**同时断言"其余仍活"**（正常 approve 路径照样能写）。
  ⛔ 只拆一半就宣布"判据没判别力"—— 2026-11-04 有过实例（两层还原只拆了一层，白跑一轮）。**跑完必须恢复**，并给 `git status` 干净的证据。

- **W-8 · 回归不退化**
  现有 `backend/tests`（基线 **179 passed / 3 skipped**）与 `harness/tests` 一律不退化。⚠️ `test_windows_dir` 是**已知坏测**（绑死英文路径）⇒ ⛔ 不许借机改它，排除它跑。

### 2 · 判据前置（不满足 ⇒ 实验根本没跑起来）

1. **必须在 open turn 内触发**（P2）—— 否则 W-1～W-4 会拿到 `unavailable` 而误判成"闸坏了"。
2. **答者要装且可控**：用 `harness/packages/plugin-approval-answerer`，配置 `policy` 直接选 `approve`／`reject`／`timeout`／`throw`／`malformed`；需要按用例切换时用 `policy: 'from-request'` ＋ `reason` 里带 `case=<名>`（**这是装置约定，⛔ 别写进产品代码**）。
3. **假摘要自己构造**（本单不依赖生成端）：直接喂 `MemoryWriteInput` 形状的对象。
4. 场地隔离：临时 `DSH_HOME` ＋ 临时 db，**⛔ 不碰** `.dsh-home/` 与 `~/.dsh`（后者已有 `probe-guard.mjs` 盯着，但本单不该走那条路）。

### 3 · 交付物

- 代码：`harness/packages/plugin-s4-memory/src/` 下（写入接线 ＋ 闸；暂存形状自定）
- 测试/探针：`harness/scripts/` 下新建目录，**可复跑**
- 读数落盘：跑出的表内容、计数、逐态 outcome **原样**落文件（⛔ 不手工润色／意译）
- 退出码：全判据 PASS ⇒ `0`

### 4 · 参考件四要素

**① 路径**：`harness/packages/plugin-approval-probe/src/index.ts`（226 行，本机现货）

**② 怎么参考**：读它的 **服务注入姿势**（`ctx.inject(['approval','tools'], cb)`）和 **`request()` 的调用式**（`{ agent, toolName, callId, reason, signal }`）。**读码，不必跑它**。

**③ 参考程度**：**可抄形状** —— 注入方式、`reason` 的组织方式、以及"把结果打点到文件便于复验"的做法。

**④ ⛔ 哪部分不可参考**：
- 它是「**给审批接人提供可复现消费者**」的**装置**，**不是记忆写入路径的模板** —— 别把"注册一只工具去调审批"当成本单的实现形状（本单是**写入前的内部闸**，不是模型可调的工具）。
- `reason` 里的 **`case=<名>` 是装置约定**（供本地答者按用例作答），⛔ **不要带进产品代码**。
- 别动它本身（见禁区）。

### 5 · 场地器材

- **通道**：本机 Windows ＋ Bash 通道（node 版本以你通道实测为准，⛔ 别照抄我的）。
- **路径**：`harness/packages/plugin-s4-memory/`（写入侧）｜`harness/packages/plugin-approval-probe/`（参考）｜`harness/packages/plugin-approval-answerer/`（答者）。
- **已知假绿坑（本单特有，⚠️ 必读）**：
  1. **把 `request()` 返回 `allowed-once` 当成"写成功"** —— 它只说明"准了"，不说明"写了"。**判写入一律读库，⛔ 不读返回值。**
  2. **D 单的前例**：文档说会 400，实测全 200 ⇒ 本单凡"文档说会怎样"，一律**以你实测为准，两通道并列留痕**。
  3. `cancelled` 与 `unavailable` **外观都是"没写进去"** —— 必须靠 outcome 字段区分，⛔ 靠"没入库"反推。

### 6 · 回报格式

1. **结论先行**：闸机制是否成立（成立／不成立／部分成立）。
2. **逐条证据**：W-1～W-8 各给**命令 ＋ 观测**，⛔ 自述型（"跑通了"）不算。
3. **未闭合项单列**（如 W-6 构造不出时机、W-3 判不可实现）。
4. **自曝**：跑歪了、判据要订正、发现矛盾，直接写。**「成因未知」是可接受的结论**，⛔ 别为叙事完整编一个。

### 7 · 禁区

- ⛔ **不改** `probe-guard.mjs`／`p3holes-a-probe.mjs`／任何既有探针（本单无关）。
- ⛔ **不改** `plugin-approval-probe`／`plugin-approval-answerer` 的既有语义（它们是复验过的装置；要新行为就新写）。
- ⛔ **不动** `.dsh-home/`、`~/.dsh`、`backend/config.yaml`。
- ⛔ **不把 `case=` 约定、测试专用开关写进产品代码**。
- ⛔ **不打印任何凭据值**（2026-11-04 WB 刚在这上面栽过一次：整段 `sed` ＋ 事后正则遮罩失效）。
- ⛔ **不放宽既有判据来让它变绿** —— 若某条做不到，报"做不到 ＋ 原因"，比假绿有价值。

### 8 · 诚实边界（哪些话现在不能说）

- 本单**不证明**"摘要质量合格" —— 用的是假摘要。
- 本单**不证明**"真人前端能审" —— 走的是本地策略答者。真人点击那条属 `DSH-3.8 · 端到端审批闭环`。
- 本单**不证明**"生成端已接" —— 生成属 ③.2a 的实现块。

### 9 · 📥 WB 补充（2026-11-04 20:50）· 造 open turn 的路径（⚠️ 这条能省你半天）

> 你说「W 单是硬活儿」—— 我核了一遍，**硬不在闸，在"造一个 open turn"**。下面是我实测出来的结论，供你少走一段。

**① 现成装置里有三个候选，两个帮不上本单：**
- `harness/scripts/dsh-prompt.mjs` ✅ **能用** —— 走官方 TS SDK 起真 dsh runtime（`--profile sdk`，stdio JSON-RPC）、跑一条 prompt、拿最终回复。**跑一条 = 一个真 open turn**，环境变量 `DSH_HOME` ＋ `DEEPSEEK_API_KEY`。成本约几分钱。
- `harness/scripts/015-preset-probe/run-probe.mjs` ⚠️ **只能验"插件加载了"** —— 它保 stdin 打开让进程活到超时、收 stderr；**但跑不出 turn**（没有 prompt 进来）。可用来先验"你的插件在真 profile 里起得来"。
- `harness/scripts/381-stub-dsh.mjs` ⛔ **本单用不上** —— 它是**假 dsh 对端**（扮演服务器、主动发 `approval/request` 给客户端），服务对象是 **DSH-3.8.1 的 driver**。本单要调的是 **dsh 内部真的 `ApprovalService`**，桩替不了它。

**② 我的建议：⛔ 别自造 stub turn，用真链路验通一次。**
理由：P2 那条约束的原文是 *"the audit pair must be enclosed by the durable log's **commit/replay boundary**"* —— 自造的 turn 大概率不满足这个边界，结果会拿到 `unavailable`，**而 `unavailable` 与"闸坏了"外观一模一样**（这正是 W-4 第三条要你按 outcome 区分的原因）。用假 turn 省下的那点钱，会在"分不清是环境问题还是实现问题"上加倍还回去。
⇒ **先 `dsh-prompt.mjs` 跑通一条**，确认链路成立，再谈别的。

**③ 如果整单确实太重，可以这样减（你选，我不替你定）：**
- **拆**：W-3（编辑通道）是**唯一需要"设计一个新形状"**的部分（暂存文件／staging 表），其余 W-1／W-2／W-4／W-5 都是**纯验闸**。⇒ 你可以只交 W-1/2/4/5/7/8，把 W-3 报到"建议单立 ③.2b-2"，**这是合格交付**，⛔ 不算未完成。
- **降**：⛔ 不建议为了绕开"造 turn"而把闸测成纯单元测试（mock 掉 `approval`）—— 那验的是"我的代码调了 mock"，不是"真审批会拦写入"，**属于典型假绿**。
- ⇒ 两条路你选，**在回报里写明选了哪条**即可。


---

## 📥 过程观察 · DS 通道复测 ＋ `reasoning_content` 回传缺口

（Trae · 2026-10-28）

> **事实层已结案（WB 2026-10-31 实测补证）**：`deepseek-reasoner` 流式 `delta` **确实返回** `reasoning_content`（53 chunk 中 48 个带、143 字符，而 `content` 仅 3 字符）；`deepseek-chat` 对照**不返回** ⇒ 是模型特性、不是我方取法错。`llm.py:498` 只取 `delta.content`，**实测丢弃 97.9% 的输出**。读数已落 `TODO.md` P0②〈取证挂账〉。
> 原通道复测明细（2026-10-28 本机 5 类工具 10 次调用全正常、零 4028）已清退 —— 它证明的只是「Trae 客户端本轮工具调用正常」，⛔ 不含「10-26 那批 4028 根因已消除」。
>
> ⏳ **仍未裁（唯一保留项）**：工具循环回传 `reasoning_content` 需先定三选一 —— **回传空串 ／ 回传原值 ／ 不落库只回传**，并确认与 `db/conversations.py` 落库结构的关系。
> ⚠️ 归属边界不变：(a) 本仓 `chat_service.py` 与 (b) 老大 10-26 遇到的 Trae 客户端调 DS 崩溃**不能串成一条因果**，形态相似 ≠ 同源。



## 📥 术语稿审读 · 讨论区回帖（Trae · 2026-11-03 午后 · 老大「砚砚看看」）

- **交付**：两份候选稿各加〈讨论区 · 沈知砚〉区块（只新增、未改上文）：`exchange/discussion-terminology-candidates.md`（L2↔L3）＋`exchange/discussion-terminology-cross-layer.md`（L1↔L2）。引用行抽样实核全对得上（明细见两稿区块首行）。
- **三条实质异议**：① S-3 改名 `source_role_id` **不建议**——该字段已是既有 API 字段（`backend/api/memory.py:49`；值域是角色 key 字符串，roles 无表、从 `config.yaml` 读：`backend/api/roles.py:33`），且 `TODO.md:373` 今日已补指向句，稿中「判据没写这句」已过时。② **③.3 三字段无现成落点**：`is_active` 仅 backend `memories`（`schema.py:44`）；`last_hit_at` 代码零命中（排除 `archive/` 后仅 `TODO.md:79/372`＋`HUMAN_NOTE.md:102`）；`source_role` 仅存在 Chroma metadata（`archiver.py:200`）⇒ 叠加 ②.1「本期不引 Chroma」后无处落。③ S-1 裁决顺序：建议先由 ③.1 定表结构再定术语，依据是 backend 那张 `memories` 是待退役旧表、插件侧才是幸存者。
- **过程观察（事实陈述，他处零承接故留）**：同一提交 `a4b9c1c` 内，讨论稿标**未定案**，而 `TODO.md:373` 已写下「建议直接改名 `source_role_id`；若改名，须同步 DSH-6 勾对口径」——讨论中的建议以**默认可执行**的形态进了 TODO，后读的人容易把建议读成裁定。

---

## 已清理段落（按交流区规矩）

- **2026-11-04 20:25（WB）**：删三单六段 ——〈📮 派发 · ③.2a〉66 ＋〈✅ 交付 · ③.2a〉22 ＋〈📮 派发 · B 案〉65 ＋〈✅ 交付 · B 案〉23 ＋〈📮 派发 · DS 回传实测〉64 ＋〈✅ 交付 · 同名〉21 ＝ **261 行**（331 → 70）。三单均已 WB 复验成立。
  - **承接（逐单核过，均为实物）**：**P** ⇒ `TODO.md` ③.2a 已定 (a) ＋ 时序硬约束 ＋ 三条实现硬坑（`REQUEST_EXTENSION`／别在 `turn/start` 直起／`close` 等 `done` 帧）；**M** ⇒ 代码本体（`effective_model` ＋ `FALLBACK_MODEL`）＋ `backend/tests/test_llm_effective_model.py`（`pytest` 179 绿，可复跑）；**D** ⇒ `TODO.md`〈两通道并列〉块 ＋ 原始读数 `_trae-evidence/ds-reasoning/*.json`（9 组场景）。
  - ⚠️ **同批修掉两处我自己的收尾遗漏**：① 状态区三行仍写「已交付（待 WB 复验）」而实际早已成立 ⇒ 已改；② 我自己 `log-workbuddy` 状态区还挂着「在飞 2 件」（H／S）⇒ 已改为无在飞。**复验完不改状态 = 下一个人以为活还在飞**，与「删了段指针还指着它」同族。
  - 回溯 `git log -p -- exchange/log-trae.md`。
