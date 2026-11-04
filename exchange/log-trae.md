# Trae 协作区

> **属主 = 沈知砚(Trae)**,本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **B 案 · 让 `config.models.*.model` 真生效** | **Trae** | `backend/config.py` ＋ `models/llm.py` ＋ `token_counter.py` ＋ 测试 | 🔵 **在飞**：2026-11-04 15:35 派发，判据 M-1～M-9。核心＝配一个唯一解析点，且**行为不变**（仍 `deepseek-chat`） | 2026-11-04 |
| **DS `reasoning_content` 回传规则实测** | **Trae** | 新建独立探针目录（勿塞 `embed-probe/`） | 🔵 **在飞**：2026-11-04 15:35 派发，判据 D-1～D-7。核心＝旧模型名下"带 tools 不回传"是否报错、报的是不是 4028 | 2026-11-04 |
| **③.2a 生成路径可执行性实测**（选型探针） | **Trae** | `harness/scripts/embed-probe/`（新建） | 🔵 **在飞**：2026-11-04 15:30 派发，判据 P-1～P-6（见下方同名片发节）。核心＝`currentInitiator()` 在 `session/` 钩子里有没有值 | 2026-11-04 |

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

## 📮 派发 · ③.2a 生成路径可执行性实测（WB · 2026-11-04 15:30）—— 选型探针，P-1～P-6

> **来路**：`TODO.md` ③.2a「摘要生成路径选定」判据要求「给出 (a)(b) 的**可执行性实测**（跑通，或明证不可行 ＋ 具体阻塞点），⛔ 只报『看过文档』」。WB 已把**装配层**查清（见 §0），本单只验**运行时层**。
> **一句话**：验「插件在 `session/` 事件钩子里，能不能拿到父 Agent 并起一个 subagent 取回纯文本」。**⛔ 本单不产出实现、不改 `plugin-s4-memory`** —— 只出可执行性结论。

### 0 · WB 已实测的前提（🟢 装配层，你不必重查，但动手前可复核）

- `dsh-base` **直接依赖** 5 个 subagent 包（`dsh-subagent`／`-fork-in-process`／`-spawn-in-process`／`tool-subagent`／`tool-subagent-control`）。
- **`dsh --profile sdk --dump-config` 实读**（零副作用，`harness/` 下）：下列插件**已装配、未被禁用** ——
  `subagent`（`@deepseek-ai/dsh-subagent`）／`subagent-spawn-in-process`／`subagent-fork-in-process`／`tool-subagent-control`／`tool-subagent-list-agents`。
- 契约（读 `.d.ts`）：`SubagentStartRequest = { prompt: ContentBlock[], parent: Agent, signal: AbortSignal, label?, agentOptions? }`；取回纯文本 = `finalAssistantOutput(events)`（选最后一条非空 assistant message）／`subagent/end.lastAssistantMessage`。
- ⚠️ **装配层 ≠ 运行时层**（本项目铁律）：上面只证明「树里有」，**不证明「插件运行时能调到」**。这正是本单要验的。

### 1 · 判据

- **P-1 · `ctx.subagents` 在插件 ctx 上存在**：插件 `apply(ctx)` 之后，`ctx.get('subagents')`（或等价 seam）**非 undefined**，且能列出可用 provider 名。取证据：provider 列表原文。
- **P-2 · `currentInitiator()` 在 `session/` 事件钩子里有值**（⭐ **本单核心**）：注册一个 `session/` 事件监听，在回调里调 `ctx.agents.currentInitiator()`。
  - **期望 A**（若 (a) 可行）：返回一个 `Agent` 对象（有 id/channel 之类可打印标识）。
  - **期望 B**（若拿不到）：返回 `undefined` 或 `requireInitiator()` 抛错 —— **这也是有效结论**，直接决定 ③.2a 选 (b)。
  - 取证据：**两个分支都要报**（不能只报碰巧成立的那个），并说明是在哪个事件名／哪个时机取的。
- **P-3 · 有 initiator 时能起 subagent**：用 P-2 拿到的 Agent 作 `parent`，`ctx.subagents.start({ prompt, parent, signal })` 能起、能跑完。
  - ⚠️ **成本控制**：prompt 用**极小内容**（如「只回复一个词：OK」），⛔ 不要跑真摘要 ⇒ 本单 token 消耗应接近零级。
- **P-4 · 能取回纯文本**：跑完后能拿到子 agent 的最终文本（`finalAssistantOutput` 或 `subagent/end` 事件里的 `lastAssistantMessage`），并打印原文。
- **P-5 · 无 initiator 的负证**：在**没有** initiator 边界的时机（如插件 `apply()` 顶层、或 `setTimeout` 里）调同样 API ⇒ **明确返回 undefined／抛错**，⛔ 不是崩溃、也不是"看起来能用"。
  - ⚠️ **这条是防"假可用"的**：若两个时机表现一样（都有值或都崩），说明 P-2 的结论不可信，须先证 P-2。
- **P-6 · 不碰产品代码**：`git status` 只应有探针新增／改动；⛔ `plugin-s4-memory`／`backend` 零改动。取证据：`git status --short` 原文。

### 2 · 判据前置

- **前置 1**：**别用 `dsh-tool-subagent` 当"替身"** —— 它是**模型面**的委派工具（模型发起的 tool call），与你这条「插件主动起子 agent」**不是同一条路**。可以**参考它怎么取 parent**（读它的源码找 `parent` 来源），但 ⛔ 不能拿它的存在当 P-3 的证据。
- **前置 2**：探针路径放 `harness/scripts/embed-probe/` 下新建（与既有探针同目录），**复用 `probe-guard.mjs`** —— 若你的探针会碰 `~/.dsh`（不该碰），守卫会当场红。
- **前置 3**：跑前先 `dsh --profile sdk --dump-config | grep -i subagent` 自证装配仍在（⛔ 不采信我上面那段）。

### 3 · 交付物

1. 探针脚本（可复跑）
2. **结论一段话**：③.2a 该选 (a) 还是 (b)，**附 P-2 的实际读数**
3. 用例外的边界：你观察到的任何"能起但取不回文本""能取回但不是纯文本"之类

### 4 · 参考件四要素

- **① 路径**：`harness/node_modules/.pnpm/@deepseek-ai+dsh-subagent@*/node_modules/@deepseek-ai/dsh-subagent/lib/types/`（`types.d.ts` 请求契约 ／ `assistant-output.d.ts` 取回规则 ／ `child-agent.d.ts`）；`@deepseek-ai/dsh-agent/lib/types/index.d.ts:199+`（`AgentRegistry`：`currentInitiator`／`requireInitiator`）；`harness/node_modules/.pnpm/@deepseek-ai+dsh-tool-subagent@*/…`（**现成调用范式**）
- **② 怎么参考**：先读 `dsh-tool-subagent` 的实现找 `parent` 从哪来，再读 `AgentRegistry` 的两个方法注释
- **③ 参考程度**：可照抄形状（同仓同代）
- **④ 不可参考**：⛔ 别用 `@deepseek-ai/dsh-subagent` 的包级 `import` —— 它在 `.pnpm` 深层、不在本工程 `package.json` 里，**直接 import 会 `ERR_MODULE_NOT_FOUND`**（本项目实测过的坑）。走 `ctx` 拿。

### 5 · 场地器材

- 本机 bash ＋ Node；`harness/` 下跑。
- ⚠️ **探针会加载部署件** `.dsh-home/profiles/sdk/node_modules/…` —— 那是真的，⛔ 不改。
- ⚠️ **P-3/P-4 会调模型** ⇒ prompt 写死成极小内容，⛔ 别让它生成任何长文本。

### 6 · 回报格式

结论先行（**③.2a 选 (a) 还是 (b) ＋ 一句话理由**）＋ P-1～P-6 各自读数（命令 ＋ 观测原文）＋ 未闭合单列 ＋ **自曝**。
⚠️ 「拿不到 initiator，所以只能走 (b)」**是完全可接受的结论**，⛔ 别为了让它跑通去绕道（绕道 = 选出一个产品上不存在的路径）。

### 7 · 禁区

- ⛔ 不改 `plugin-s4-memory` / `backend` / 部署件
- ⛔ 不写产品实现（本单只出结论）
- ⛔ 不为「让探针跑通」而改 DSH 源码或 patch 部署件
- ⛔ 不采信 WB 的装配层读数当自己的证据（前置 3 要求自证）

---

## 📮 派发 · B 案：让 `config.models.*.model` 真的生效（WB · 2026-11-04 15:35）—— 单件 M-1～M-9

> **来路**：老大 2026-11-04 15:25「按照 B 走」。WB 15:26 侦察确认病灶，15:30 已把实例配置解耦（见 §0）。
> **一句话**：`config.yaml` 里写的 `model` 字段**当前完全不生效**（`ModelConfig` 都没这个字段）⇒ 让它生效，并把旧模型名的硬编码收敛到**一处**。

### 0 · WB 已完成的现场准备（⛔ 你不要动 `config.yaml`）

- 实例配置 `backend/config.yaml:17` 的 `model` 值，WB 15:26 已从 `deepseek-flash` **改回 `deepseek-chat`**（＝当前实际生效值），并加了注释。
  ⇒ **这是本单的安全护栏**：B 案落地后**行为不变**（仍用旧名）。切 `deepseek-flash` 是**另一件事**，等 D 单（`reasoning_content` 回传）结论再定，⛔ **本单不许切**。
- ⚠️ `backend/config.yaml` 在 `.gitignore:17`，**不进 git、含真实凭据** ⇒ ⛔ 不许读它的值、⛔ 不许打印、⛔ 不许复制到任何地方。

### 1 · 病灶（WB 已实测，🟢）

| 事实 | 证据 |
|---|---|
| `ModelConfig` **无 `model` 字段** | `backend/config.py:20-22` 只有 `api_key`／`base_url`；WB 15:30 实跑 `hasattr(cfg.models['deepseek'],'model')` ⇒ **False** |
| 真正决定模型名的是**三处硬编码默认值** `deepseek-chat` | `services/chat_service.py:49`／`api/memory.py:35`／`memory/archiver.py:67` |
| 映射表**没有** `deepseek-flash`，且解析是**硬抛无 fallback** | `models/llm.py:57-66` `_MODEL_PROVIDER_MAP`；`:68-76` `_resolve_provider_key` `raise ValueError` |
| `token_counter` 也无新名 | `models/token_counter.py:36-44` |

### 2 · 判据

- **M-1 · `ModelConfig` 有 `model` 字段且能读到**：YAML 里写了就能读出来。取证据：`bool(...)` ＋ `len(...)`（⚠️ **⛔ 不打印值本身**，只打长度与布尔）。
- **M-2 · 有**唯一**解析点，优先级明确**：形如 `effective_model(provider_key)` —— **配置非空 ⇒ 用配置值；配置为空／缺 ⇒ 落兜底常量**。取证据：该函数路径 ＋ **两条单测**（配置有值／配置为空各一条）。
- **M-3 · 兜底默认值全文只有一处定义**：现有三处 `model: str = "deepseek-chat"` 要么改引用该常量、要么改为空串由 M-2 解析。取证据：`grep -c` 该常量定义 = **1**，附检索式。
- **M-4 · 映射表含新名，旧名保留并标注**：`_resolve_provider_key("deepseek-flash")` ⇒ `"deepseek"`（**不抛错**）；`deepseek-chat`／`deepseek-reasoner` **保留但加注释**（⚠️ 文档已不列这两个名为允许值，注释须写明「已下线，仅兼容」）。取证据：三个名字各调一次的返回值。
- **M-5 · `token_counter` 含新名**：`deepseek-flash` 有 encoding 映射。取证据：调一次的返回值。
- **M-6 · 行为不变（本单最重要的安全判据）**：落地后，一次真实调用**实际发出去的模型名仍是 `deepseek-chat`**。取证据：打印**实际使用的 model 名**（⛔ 不是 key）＋ `finish_reason`。
- **M-7 · `config.example.yaml` 与实例键集同构**：`models.*` 段的**键集**一致（⚠️ **比键不比值**）。取证据：两侧键路径集合 ＋ 差集。
- **M-8 · 回归**：`backend/tests` 全绿，**除已知坏测 `test_shell_tool::test_windows_dir`**（绑死英文 `Volume`、本机 chcp=936；与本单无关，⛔ **不许去改它**）。取证据：`pytest -q` 的 passed／failed 计数原文。
- **M-9 · 测试里的旧名要处置**：`test_conversations.py:397`（断言 `"deepseek-chat" in body["models"]`）等硬编码处 —— **要么改成读配置，要么明确保留并注明原因**。⛔ 不许为了过测试放宽断言。

### 3 · 判据前置

- **前置 1**：先读 `models/llm.py:57-100`（映射表 ＋ `_get_client`）与 `config.py:20-22`，看清**改哪一层**再动手 —— ⛔ 别在 `_get_client` 里打补丁绕过 M-2。
- **前置 2**：确认没有别的地方也在读 `models.*.model`（WB 只查到"零消费"，你要独立复核一次，附检索式）。
- **前置 3**：`chat_service.py` 的默认值是**函数参数**，改它会影响 `estimate_tokens`／`truncate_messages` 等调用方 —— ⛔ 别只改签名不看调用点。

### 4 · 参考件四要素

- **① 路径**：`backend/config.py`（`ModelConfig`）／`backend/models/llm.py:57-100`／`backend/models/token_counter.py:36-44`／`backend/config.example.yaml` 的 `models:` 段
- **② 怎么参考**：按 `_MODEL_PROVIDER_MAP` 上方注释说的"新增模型时在此处添加一行即可"的既定姿势扩展
- **③ 参考程度**：可照抄既有形状（同一文件的既定风格）
- **④ 不可参考**：⛔ `config.yaml`（实例，含凭据）—— 只可参考 `config.example.yaml`

### 5 · 场地器材

- 本机；真实 API **只需一次**（M-6），prompt 极小。
- ⚠️ **凭据纪律（本单高压线）**：读 `config.yaml` 只经 `get_config()`，**⛔ 不打印它的任何值**；调试输出只打布尔／长度／模型名。🔴 今天 WB 在这上面栽过一次（`sed` 打印整段 + 正则遮罩失效）⇒ 你要打印配置片段时，**先确认那行不含凭据**。

### 6 · 回报格式

结论先行（M-1～M-9 各自成立／未闭合）＋ 每条读数 ＋ **M-6 的实际模型名** ＋ 未闭合单列 ＋ **自曝**。
⚠️ 「M-9 我判该保留旧断言，理由是…」**是可接受的结论**，⛔ 别为过测试放宽。

### 7 · 禁区

- ⛔ **不动 `backend/config.yaml`**（含凭据、且已被 WB 解耦；你改了会破坏 M-6 的前提）
- ⛔ **不切 `deepseek-flash`**（等 D 单）
- ⛔ 不改 `test_windows_dir`
- ⛔ 不动 DSH 侧（`harness/`）与 `plugin-s4-memory`
- ⛔ 不打印／不落盘任何凭据

---

## 📮 派发 · DS `reasoning_content` 回传规则实测（WB · 2026-11-04 15:35）—— 单件 D-1～D-7

> **来路**：老大 2026-11-04 15:22 给官方文档链接、15:23 认「按此改口径」。WB 查 `api-docs.deepseek.com/zh-cn/guides/thinking_mode` 得到**强制规则**（原文见下），原「三选一待裁」作废。本单只验**规则在两代模型上的实际表现**。
> **排期**：可与 P-1～P-6（③.2a）同批做，⛔ 两单无依赖；若分先后，本单在前（它可能改变回传侧的排期）。

### 0 · 文档说了什么（🟢 已查，原文）

> 「**携带了 `tools` 参数的请求，在后续所有请求中，必须完整回传 `reasoning_content` 给 API** —— 即使该轮模型未实际进行工具调用。若您的代码中未正确回传 `reasoning_content`，**API 会返回 400 报错**。」
> 「**未携带 `tools`** ⇒ 无需回传；**即使传入 API，也会被忽略**，不会拼接进上下文。」

**另**：文档已是 V4 架构 —— `model` 允许值仅 `deepseek-flash` / `deepseek-v4-pro`；思考模式由 `thinking:{type: enabled|disabled}` ＋ `reasoning_effort` 控制。⚠️ 本项目代码与 10-31 取证用的是**旧名** `deepseek-reasoner` / `deepseek-chat`。

### 1 · 判据（逐条给原始证据）

- **D-1 · 旧模型名是否还可用**：以 `deepseek-reasoner` 发一次最小请求（无 tools）⇒ 报**成功／失败 ＋ 完整错误对象**。⚠️ 若返回 400/404 说"model not found" ⇒ **这本身是重要结论**（说明模型名已废）。
- **D-2 · 带 tools ＋ 不回传 ⇒ 报什么**（⭐ **本单核心**）：构造两轮 —— 第 1 轮带 `tools`、模型发起 tool_call；第 2 轮**把 assistant 消息里的 `reasoning_content` 剥掉**再发。
  - 期望：**报错**（文档说 400）。
  - 取证据：**完整错误对象**（HTTP 状态 ＋ `error.code` ＋ `error.message` 原文），⛔ 不要只写"报错了"。
  - 🔴 **额外要交叉的一条**：报出来的码**是不是 4028**。⛔ 若是，也**不要**在回报里写"确认 4028 根因" —— 只写「观测到码＝X，与 4028 相同／不同」这一句事实。
- **D-3 · 带 tools ＋ 回传原值 ⇒ 通过**：同 D-2，但 assistant 消息**带 `reasoning_content`** ⇒ 应正常完成。取证据：`finish_reason` ＋ 是否拿到最终 `content`。
- **D-4 · 不带 tools ＋ 传 reasoning ⇒ 被忽略**：无 tools 的两轮请求，第 2 轮故意带上上一轮 `reasoning_content`。文档说不报错、被忽略 ⇒ 取证据：**不报错** ＋（若可观测）结果与不带时一致。⚠️ 「被忽略」不可直接观测 ⇒ **报"无法区分忽略与采纳"是合格结论**，⛔ 别硬证。
- **D-5 · 新模型上同样的规则**：用 `deepseek-flash` ＋ `thinking:{type:"enabled"}` ＋ `reasoning_effort` 重跑 D-2／D-3。⚠️ 若新模型下表现**与旧模型不同**，**两代结论并列留痕、⛔ 不合并**。
- **D-6 · 错误码归一**：把 D-1～D-5 观测到的所有错误码列成一张表（场景 → 状态码 → error.code → 原文首句）。
- **D-7 · 不碰产品代码**：`git status --short` 只应有探针新增；⛔ `backend/`／`plugin-s4-memory` 零改动。

### 2 · 判据前置

- **前置 1 · 成本**：每次请求 prompt 写死为极小内容（如「回复一个词」），单次 tool_call 用 mock 结果 ⇒ 全单 token 消耗应接近零级。⚠️ 本单**不需要真实业务数据**。
- **前置 2 · 凭据**：从 `backend/config.yaml` 读（**只读、⛔ 不回显、⛔ 不落任何文件**）。若要新建场配置文件，⛔ 不许把 key 写进去。
- **前置 3 · 先证通道**：D-1 不通过（模型名已废）⇒ **停手报我**，⛔ 别自行改成新模型硬跑（那样 D-2～D-4 的"旧模型"结论就没了，而旧模型是**产品当前在用的**）。

### 3 · 交付物

1. 探针脚本（可复跑，路径你定；建议独立目录，⛔ 别塞进 `embed-probe/`）
2. **一张场景×结果表**（D-6 那张）
3. 一段结论：**产品当前配置（旧模型名）下，"不回传 reasoning"会不会出错**

### 4 · 参考件四要素

- **① 路径**：官方文档 `https://api-docs.deepseek.com/zh-cn/guides/thinking_mode`（含工具调用样例代码，**照它的 `messages.append(response.choices[0].message)` 形态**）／`https://api-docs.deepseek.com/zh-cn/api/create-chat-completion`
- **② 怎么参考**：先看 thinking_mode 的「工具调用」样例，理解"回传"在代码里长什么样
- **③ 参考程度**：可照抄调用形态
- **④ 不可参考**：⛔ 文档样例用 `deepseek-flash`，**与产品现状不同代** —— 别直接拿它的 model 名替掉 D-1～D-4 的旧名

### 5 · 场地器材

- 本机；网络出站（真实 API）。
- ⚠️ **同一环境内只用一个 DSH home**（本项目铁律），本单不涉 DSH。
- ⚠️ **别用 `langchain` / 高层封装** —— 用裸 HTTP 或官方 SDK 直调，否则错误码会被包装掉。

### 6 · 回报格式

结论先行（**旧模型下"不回传"是否出错** ＋ 一句根因）＋ D-1～D-7 逐条读数 ＋ **D-6 的表** ＋ 未闭合单列 ＋ **自曝**。
⚠️ 「4028 与 400 不是同一个码」「无法区分忽略与采纳」**都是可接受的结论**，⛔ 别为叙事完整编一个。

### 7 · 禁区

- ⛔ 不改 `backend/`（含 `llm.py`）／`plugin-s4-memory`／部署件
- ⛔ 不回显、不落盘任何 key
- ⛔ 不把"4028 ＝ 本因"写进任何文档或结论（只报观测到的码）
- ⛔ 不改产品 `config.yaml`

---

## ✅ 交付 · DS `reasoning_content` 回传规则实测（Trae · 2026-11-04）—— D-1～D-7

**结论先行：文档所述「带 tools 的后续请求不回传 `reasoning_content` ⇒ 400」在本机实测 **未触发** —— `deepseek-reasoner`／`deepseek-flash`／`deepseek-v4-pro` 三模型全部 **HTTP 200 正常完成**。产品当前配置（`deepseek-chat`、非思考模型）下，**不存在因"不回传"导致的报错风险**（它本身不产出 reasoning_content）。**

- **D-1 成立（旧名仍可用）**：`deepseek-reasoner` 最小请求 ⇒ `http=200`、`finish_reason=stop`、`content="OK"`、`reasoning_content` 有值（70 字符）。另查 `/models` 只列 `['deepseek-flash','deepseek-v4-pro']`（旧名不在列表但调用仍成功）。
- **D-2 成立（核心，带 tools ＋ 剥离 reasoning）**：首轮 `200 / tool_calls`（reasoning 77 字符，已记但第 2 轮**未回传**）⇒ 第 2 轮 `http=200`、`finish_reason=stop`、`content="已完成：调用 ping，参数 x=\"1\"，返回 {\"ok\":true}"`。**未报 400。**
- **D-3 成立（带 tools ＋ 回传原值）**：同构造、回传 729 字符 reasoning ⇒ 第 2 轮 `200 / stop`，正常拿到终稿。两组**结果无差异**。
- **D-4 成立（无 tools ＋ 传 reasoning）**：两轮均 `200`；第 2 轮正常答复「好」。⚠️ 文档称"被忽略"——**无法区分忽略与采纳**（不可直接观测），按派发口径报为合格结论。
- **D-5 成立（新模型同样规则）**：`deepseek-flash` ＋ `thinking:{type:enabled}` ＋ `reasoning_effort:medium` 重跑 D-2／D-3 ⇒ 首轮 `200 / tool_calls`（reasoning 74／92 字符），第 2 轮剥离版与回传版**均 `200 / stop` 正常完成**。两代结论一致、无差异。
  - **补测（超出原 flash 口径，单列不合并）**：`deepseek-v4-pro` 同构造 ⇒ 两臂首轮均 `200 / tool_calls`；第 2 轮**均 `http=200`、`finish_reason=length`（`max_tokens=512` 被思考占满，未产出终稿）** ⇒ 无 400，但该臂不足以比较终稿质量；未再加预算（成本控制）。
- **D-6 成立（错误码归一表）**：D-1～D-5 **错误表为空**（无任何错误响应）。另单列一条**不属于本规则**的观测：首轮试验用 `tool_choice` 强制指定时，四臂均返回 `400 / error.code=invalid_request_error / "Thinking mode does not support this tool_choice"`（request_id 见 `20261104T155800.json`）⇒ 改用 auto 才取得 `tool_call`。
- **D-7 成立（不碰产品代码）**：`git status --short` 仅 `?? scripts/ds-probe/`。
  - 🔴 **对 4028 的纪律**：本单观测到的码是 `400/invalid_request_error`，**与 4028 不同**；未写"确认 4028 根因"。

**证据**：`_trae-evidence/ds-reasoning/20261104T160120.json`（最终一轮，含各场景原始请求消息与响应）；首轮工具选择试验 `20261104T155800.json`。
**未闭合**：文档所述 400 **触发条件**未确定（本机未复现）——只报观测，不推断原因。
**自曝**：① `tool_choice` 强制在 thinking 模式下直接 400，第一次构造四臂全废，改用 auto ＋ 强提示才拿到 tool_call（这是通道/构造问题，已修正后重跑）。② `deepseek-v4-pro` 两臂 `length` 截断，未达终稿——**本轮不据此对 v4-pro 下"完全通过"结论**。③ 断言"被忽略"不可观测，只报了不报错。
**凭据**：仅经 `get_config()` 读取，脚本与输出**无 key**；唯一打印的配置信息是 provider 域名（`api.deepseek.com`），非凭据。

---

## 📥 过程观察 · DS 通道复测 ＋ `reasoning_content` 回传缺口（Trae · 2026-10-28）

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

- **2026-11-04 12:30（WB）**：删〈📮 派发 · 三处补洞（场地隔离③／B-8／src 守卫）〉87 ＋〈✅ 交付 · 同名〉45 ＋〈📌 WB 复验 · 同名〉79 ＝ **211 行**（273 → 62）。三块均在 2026-11-01 复验成立（A／B／C 三组全 PASS）。
  - **承接**：B-8「落点可换」→ `TODO.md` B-8 行（✅ 已修复 `26886ab`）；③ 场地隔离相对路径 → 同段（✅ `bec0502`）；C-4 七类完备性／C-7 缺失标记 → `TODO.md` 该段；**A-2 污染 → 根因已修**（H／N 两单）。
  - ⚠️ **两条活项先转出，才敢删**（老大 2026-11-04 12:26 口径「**承接了就不用留，悬着的就先留**」）：① **`.dsh-home/` 整目录被忽略 ⇒ 线上生效配置与 tracked 片段是两份**（WB 12:25 复核仍成立）② **8 位哈希碰撞 2^-32** —— 均已落 `TODO.md`〈待核（不阻塞拍板）〉段。
  - **保留（悬着，未裁）**：〈📥 过程观察 · DS 通道复测 ＋ `reasoning_content` 回传缺口〉—— 三选一**裁决本身没做**（`TODO.md:92-97` 只是承接了题面）；〈📥 术语稿审读〉含他处零承接的观察。
  - 回溯 `git log -p -- exchange/log-trae.md`。

- **2026-11-04 12:25（WB）**：删〈📮 派发 · 探针不再碰真实 home（H-1～H-8）〉68 ＋〈✅ 交付 · 同名〉27 ＋〈📮 派发 · 守卫 `root` 改必填（N-1～N-4）〉26 ＋〈✅ 交付 · 同名〉18 ＝ **139 行**（406 → 267）；状态区两行压成一行。两单均 WB 复验**成立**。
  - ⭐ **承接＝代码自文档（这是本笔的关键判断）**：机制与理由已写在 `harness/scripts/embed-probe/probe-guard.mjs` 文件头（由来、用法、**`root` 必填不传即抛错**、"新探针须自带此守卫"）＋ `p3holes-a-probe.mjs:191-236`（假 home 的设/还原）；证据在 `D:/Code/_trae-evidence/patch-3holes/20261104-fakehome{,-n2}/`。⇒ **本段可清，因为结论不在 log 里也能读全**。
  - **WB 独立复验读数（自己跑的，⛔ 非采信自报）**：探针 **6/6 PASS、exit 0**；**四次独立取 `~/.dsh` 指纹**（首单跑前／跑后／负证后 ＋ N 单跑前／跑后）全一致 —— 两个盯防文件 **absent**、顶层 4 项（`.anonymous-user-id`／`profiles`／`sessions`／`storages`）不变；负证 `--negtest` **对照绿 diffs=0 ＋ 两红（2／3 条差异）、exit 1**，全程 `%TEMP%`；`createHomeGuard()` 无参 ⇒ **抛错**（错误原文已核）；13 个探针只有 `p3holes` 与守卫本体引 `homedir()`（后者只读）。
  - ⚠️ **一条不阻塞的观察**：`root` 必填的错误信息里给了示例 `join(homedir(), ".dsh")`，而 `homedir` 已从 import 移除（死引用清理）⇒ **照抄这段示例会 `ReferenceError`**。不影响判据成立，⛔ 未据此返工；下次动这个文件时顺手改（改成不带代码的措辞，或补回 import）。
  - ⚠️ **建议（待老大定）**：「新探针须自带守卫」目前**只活在代码注释里** —— 写新探针的人不一定会读这个文件。若要它成为约束，需 Qoder 落 `docs/`（WB 无该区写权）。
  - 回溯 `git log -p -- exchange/log-trae.md`。

- **2026-11-04 10:30（WB）**：删〈📮 派发 · ③.1〉83 ＋〈✅ 交付 · ③.1〉33 ＋〈📮 派发 · ②.2.3 降阈值〉52 ＋〈📌 复验 · 降阈值〉20 ＋〈📮 派发 · ②.2.3 近似去重〉122 ＋〈📮 派发 · 删 ValueError 残留〉89 ＋〈📥 过程观察 · 场地隔离三条〉14 ＝ **413 行**（710 → 297）。全部为「已派发—已交付—已复验成立」闭环段。
  - **承接**：③.1 判据读数（`kind!` 无默认值／索引含 `WHERE kind='transcript'`／`write.ts` 不挂自动触发）→ `TODO.md` ③.1 行；**B 案表重建两条前置** → 同段**新增**子条（原只活在这段派发稿里，清前抢搬：SQLite 3.51.2 不能给有数据的表加无 DEFAULT 的 NOT NULL 列 ⇒ 必须表重建；`INSERT OR IGNORE` 吞唯一冲突 ⇒ 负证须用裸 `INSERT`）；②.2.3 去重／降阈值 → `TODO.md` ②.2.3 段含阈值分布读数；ValueError 残留 → 已办结 `f9fc0bc`；**场地隔离三条过程观察 → `docs/local-env.md` §8.8**（2026-11-02 升格，故 11-01 那次"原样留在本区"的保留理由已消解）。
  - **保留（未结项）**：三处补洞三块 —— 内含 **A-2 污染**（`C:\Users\SuLarry\.dsh\larry-memory.db` ＋ `sessions/archive-manifest.jsonl`：⚠️ **2026-11-04 10:42 老大已亲手删除，磁盘上已不存在**，WB 10:44 外部核实 `.dsh` 下仅剩 `.anonymous-user-id`／`profiles`／`storages`；**根因已修复**（H-1～H-8 假 home ＋ 全程守卫、N-1～N-4 `root` 必填两单，均已复验成立，见上方 12:25 登记））；DS 通道 `reasoning_content` **三选一未裁**；术语回帖含他处零承接的观察。〔⚠️ **本句所述"保留三处补洞三块"已于 2026-11-04 12:30 失效** —— 三块已按「承接了就不用留」清退，两条活项转 `TODO.md`〈待核〉，见上方最新一条。〕
  - 回溯 `git log -p -- exchange/log-trae.md`。
