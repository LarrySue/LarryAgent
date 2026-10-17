# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| DSH-3.6 · S4 双写闭环 ＋ 注入面 | Trae | 本机 Windows | 🟡 已回报（中段卡点：J0 ✅ ／ 前置A ✅ ／ 前置B ⛔ 待裁） | 2026-10-17 |
| DSH-3.6.1 · S4 召回闭环（LLM 端到端） | Trae | 本机 Windows | ⏸ **卡点**：待 3.6 回报且 WB 复验通过后才跑（需 key） | 2026-10-17 |

- ⚠️ **不要把本区当承接目标**（活日志会被随时清理 ⇒ 引用必成断链）；**回溯一律 `git log -p -- exchange/log-trae.md`**。
- ⚠️ **通用纪律**：
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

## 📤 DSH-3.6 · S4 双写闭环 ＋ 注入面（WB 派发 · 2026-10-17 · Trae · 本机 Windows · **0 token**）

### 0 · 目标

自做 **TS 插件**挂 `session/` 事件流，把会话记忆双写进**我们自己的库**（SQLite = 真相源 ／ ChromaDB = 派生向量索引），并验召回注入面接通。⛔ 与 3.6.1 的分界：本块到「注入面有内容」为止，「模型真的看到并用到」归 3.6.1。**判据权威全文 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.6 · S4 记忆最小闭环 —— 判据定稿 v3〉（`:1249`，2026-10-17 落笔 ＋ WB 复验 PASS）** —— 四问形态（作用层 ／ 计量口径 ／ 结果态可分 ／ 断言视图），⛔ 以全文为准，下表只是索引。

### 1 · 判据索引（J0–J5）

| # | 判据 | 一句话口径 | 缺此即未闭合 |
|---|---|---|---|
| **J0** | 无 key 态自证 ＋ 事件清单预检（**开工第一件**） | 显式不注入 ／ 清除 `DEEPSEEK_API_KEY` ＋ 确认 cwd 无 `.env` ＋ 记三元组；断言无 `assistant/message` 且 `turn/end` 非 completed；**落事件类型清单**（`user/message` ／ `turn/end` 必须在列）；顺带 dump `request/header` 与 `request/context` 两帧原文定帧名 | 清单缺项 ⇒ **停手回报**，⛔ 不自行换事件类型凑 |
| J1 | 事件确实被消费 | 库里含 nonce 的行 ＋ **`sourceEventSeq` 与 `user/message` seq 交叉核对**；开跑前断言库空；负向 = 只建会话不发 prompt ／ 发不含 nonce 的 prompt，两臂均不得出现带 nonce 行 | 注册 ≠ 消费（哑坑①：订阅在构造函数里 ⇒ 服务不实例化 = 连订阅都不生效） |
| J2 | 落我们自己的库（反向哨兵） | 外接临时路径 `larry-memory-<run>.db` 查到同一 nonce；哨兵臂 = path 指回**临时 home 内** DSH 默认后端 ⇒ 必须变红 **且 nonce 出现在哨兵位置**（阳性证据，否则红因不唯一） | 无阳性证据 = 伪哨兵 |
| J3 | ChromaDB 双写落库 | 基线 → 增量 ≥1 且按 nonce 定位；**Chroma id ≡ SQLite 行 id**；临时端口；**取回向量验指纹：维度 512**（bge-small-zh；⛔ 防 server 默认 embedding 免费满足） | 四条缺一即未闭合 |
| J4 | 降级行为（停 chroma server） | 活臂：①不阻塞 ②真相源在 ③**不得出现降级行**（反向日志哨兵）；停臂：①不阻塞（加数量级时间界）②真相源在 ③降级行在（写死通道 ＋ 唯一匹配串 ＋ 只出自失败路径） | 双锚缺一不可分红 |
| J5 | 召回注入面 | J0 定死的帧原文里注入块**含 nonce**（逐字）；负向 = 空库 ⇒ 注入块不含 nonce；B 输入不得含 nonce ／ 不复用 A 会话；**明写不区分 query 命中 ／ 兜底命中** | ⛔ 不断言「注册成功」；⛔ 不自己构造 context 调 `text()` |

### 2 · 判据前置（不通过 ⇒ 走指定路，⛔ 不自行造等价物）

| # | 项 | 不通过则 |
|---|---|---|
| A | **插件全部外部 import 已登记**：`@deepseek-ai/*` ＋ **`chromadb`** ＋ **`@huggingface/transformers`** —— 后两者实测**不在** `harness/package.json`（deps 仅 4 个 `@deepseek-ai/*` ＋ zod）且 `@huggingface` 不在 `node_modules` ⇒ 照 3.3-b 事实 (a) 必然 `ERR_MODULE_NOT_FOUND` | 先补依赖再开工（⛔ 禁 npm/yarn，**锁定 pnpm 11.7.0**） |
| B | `npx chroma run --path <tmp>` 本机可用（server 真含在 npm 包内） | 降级 = Docker `chromadb/chroma`；再不行 ⇒ 停手回报 |
| C | **模型三步**：补 `@huggingface/transformers` → bge-small-zh-v1.5 就位（本地缓存 or hf-mirror ≈95 MB）→ `harness/scripts/embed-probe/` 跑通；写明**缓存位置与离线可跑性** | 停手回报（J3 指纹判据缺器材 ⇒ WB 重裁） |
| D | **J0 = 开工第一件**（0 token ／ 0 成本），失败 ⇒ 停手回报 | — |

### 3 · 交付物

- **插件源码**：`harness/packages/plugin-s4-memory/`（TS，按 `harness/packages/` 既有惯例 ＋ tsconfig）
- **装置**：`harness/scripts/run-36-memory.mjs`（381 形态：`mkdtemp` ＋ `cpSync(profiles/sdk)` ＋ **删副本 `.modules.yaml`** ＋ `--patch` 挂插件；先例 `run-33b-remote-approval.mjs:204-221` ／ `run-381-driver.mjs:100`）
- **证据**：`D:\Code\_trae-evidence\36\`（含 README：复现命令 ＋ 每臂判据映射 ＋ 运行标识）；每验收脚本头部带**姿势自证**一行（哪个 home ／ profile ／ 通道）
- **双写一致性模型定义**（随交付物，一段即可）：SQLite 真相源 ／ ChromaDB 派生可重建 ／ 不可达时不阻塞 ＋ 日志记降级 ／ 允许短暂不一致以真相源收敛 ／ 补偿「定义不验」（已裁）

### 4 · 参考件四要素（⛔ 照此执行，勿另行转述）

- **路径**：`ref/community/Asher-2000__dsh-memory-connect/`（v0.6.1 · MIT · 单文件 `lib/index.js` 2236 行）
- **怎么参考**（六处形状）：① 订阅 `ctx.on('session/event')`＋`session/created`/`disposed`/`flush`（`:1119-1133`，**在构造函数里**）② `inject: ['sessions','systemPrompt']`（`:2202`）③ `new Service(...)` 后 `ctx.provide(name, service)`（`:2205-2206`，**实例非类**）④ `systemPrompt.context` 注册（`:2217-2229`，order 500 ／ 同步 text()）⑤ `turn/end` 消费＋轮末摘要（`:2006`＋`:343`＋`:360-368`）⑥ `recallSync`（`:1301-1325`＋兜底 `:1327-1333`）；另读 CHANGELOG v0.4.0 节（`:55-65`，两个哑坑修复记录）
- **参考程度**：借设计 ／ 抄形状；⛔ 不 fork 不直装；我方插件自做 TS
- **哪部分不可参考**：无 ChromaDB 形态（其向量在自家 SQLite）／ schema 按产品 2.4 域自做 ／ consolidation·scheduler·Soul 非本步靶子 ／ API 形状须在 0.1.5-rc.2 实物复核

### 5 · 场地器材

- 本机 Windows；**381 同款临时 home**（`mkdtemp` ＋ 只 `cpSync(profiles/sdk)`）⇒ 天然无 `.credentials.yaml`；J0 仍须显式自证（临时 home 消不掉启动环境层 ／ cwd `.env` 层）
- **key 纪律：本块不需要 key** ⇒ ⛔ 不得注入 `DEEPSEEK_API_KEY`；⛔ 不读 `.dsh-home/.credentials.yaml` 的值
- node 版本**连通道一起记**（Bash 通道 system `v24.14.1` ／ managed `v22.22.2`；以你通道实测为准，对不上先报差异再动手）
- **假绿坑清单**：`--dump-config` 只证装配不证激活（J5 ⛔③）｜注册 API 不抛错 ≠ 生效（参考件 `:2230` try/catch）｜`--patch` 未命中仍 exit 0｜「count+1」无基线
- **收尾**：显式清理临时 home（3.3-b 教训：每轮 ≈330MB，累计留了 10.2GB）

### 6 · 回报格式

结论先行 → J0–J5 逐条证据（原文落盘、⛔ 不改写 ／ 意译、注明通道）→ 未闭合项单列 → 自曝（判据要订正 ／ 跑歪了直接写；「成因未知」可接受）。写完把顶部状态区本行改「已回报」。

### 7 · 禁区

⛔ 不动 `.dsh-home/`（真 home）与 `backend/` 任何活数据 ｜⛔ 不改 `docs/` `archive/` `HUMAN*.md` ｜⛔ 凭据值不进任何输出 ｜⛔ 不直装参考件 ｜⛔ 不提远程（push/fetch 归老大）｜⛔ git 提交路径限定（只提自己文件，先 `git diff --cached --stat`）

### 8 · 回报一（2026-10-17 · 中段卡点 · 全程 PowerShell 通道 · node v24.14.1 system）

**结论先行**：J0 **7/7 PASS**（装置首跑一次过，事件清单无缺项）；前置 A **PASS**；前置 B **⛔ 卡点停手**——两条指定路实测全断，第三路（Python `chroma.exe`）已实测可行但按纪律不自行启用，**待裁**。J1–J5 未跑。装置已建未提交（老大令：log 单独提交，其余暂不提交）。

**J0 逐条证据**（证据目录 `D:\Code\_trae-evidence\36\run-j0\`；装置 `harness/scripts/run-36-memory.mjs` J0 段）：

- **三元组**：① `DEEPSEEK_API_KEY` ABSENT（检索式 `Test-Path Env:DEEPSEEK_API_KEY` → False；child env 代码化再 delete；临时 home 只 `cpSync(profiles/sdk)` 天然无 `.credentials.yaml`）② cwd `.env` 三处（根/harness/backend）`Test-Path` → 全 False ③ node `v24.14.1`（`Get-Command node` → `D:\App\node\node.exe`，**PowerShell 通道**——与 381 记录的 Bash 通道同版本异通道，已按派发稿记差异）
- **事件清单**（`J0-event-types.json`，13 events / 11 种）：`agent/inbox/spliced ×2`、`turn/start`、`step/start`、`system/message`、`user/message ×2`、`request/header`、`request/context`、`session/title`、`assistant/attempt`、`step/end`、`turn/end`——**`user/message` ✅ ＋ `turn/end` ✅ 在列，无缺项**（不断触发停手条件）
- **无 key 态铁锚**：`turn/end` 实测 `reason.kind='error'` ＋ `error.code='MISSING_CREDENTIAL'`（比「非 completed」更强的自证锚）；全程无 `assistant/message`（失败尝试只有 `assistant/attempt`）
- **J1 基准**：真 prompt 的 `user/message` seq=8（seq=9 是 synthetic runtime context，`source` 字段可区分）；`J0-user-message-seqs.json` 已落盘
- **注入面帧实测定名 `system/message`**（seq=7，content 为 block 数组＝渲染后系统提示词原文，首块实测 `"You are an AI agent powered by DeepSeek Harness..."`）——**与派发稿 J5 预期不同**，详见自曝①

**前置 A 证据**：`chromadb ^3.5.0` ＋ `@huggingface/transformers ^4.3.1` 已入 `harness/package.json` deps（pnpm 11.7.0 实跑）。**pnpm 11 新坑**：`package.json` 的 `pnpm` 字段已废（pnpm 明示改读全局/`pnpm-workspace.yaml`），`onnxruntime-node` build 放行落点 = `pnpm-workspace.yaml` 的 `allowBuilds: onnxruntime-node: true`；放行后 postinstall 实跑 Done，`@huggingface/transformers` 4.3.1 与 `chromadb` 双双 import 实测 PASS。

**前置 B 卡点（两条指定路实测全断，证据见 `_trae-evidence\36\`）**：

1. `npx chroma run` ❌ —— chromadb@3.5.0 CLI **只支持 Windows ARM64**，实测原文：`Error: Unsupported Windows architecture: x64. Only ARM64 is supported.`（`dist/cli.mjs`，`npx chroma --version` 通道）。派发稿前提「server 真含在 npm 包内」在 Win x64 不成立——bin 在（`bin: {"chroma": "dist/cli.mjs"}`）但二进制缺 Win x64 架构。
2. Docker ❌ —— 本机无 Docker：`docker --version` → `CommandNotFoundException`。
3. **候选第三路（已实测可行，未启用）**：全局 Python 3.11.9 的 chromadb 1.5.9 自带 `chroma.exe`（Rust server `chroma 1.4.4`，backend 同栈既有器材，非新装）。探针（`probe-chroma-compat.mjs`）实测：TS client 3.5.0 ↔ Python server **协议兼容**——heartbeat 返回 ✅、collection 建删 ✅、**512 维向量显式写入后取回维度 512 ✅**；探针中的 `DefaultEmbeddingFunction` 警告正中 J3「⛔ 防 server 默认 embedding 免费满足」坑，已验「显式传 embedding 写读」绕开成立；探针与临时目录已清理（server 进程停，`Get-Process` 验空）。
4. **请裁**：J3/J4 的 chroma server 走第三路（Python `chroma.exe`）是否放行？判定链不受影响（chroma HTTP API 跨实现统一，判定对象是插件双写行为，非 server 实现语言）。
5. **同时请示**：前置 C（bge 模型三步）与 server 路裁定无依赖，可否先行推进？J1/J2/J5（SQLite 线 ＋ 注入面）同样不依赖 chroma server。

**未闭合项**：J1–J5 全部未跑（等 B 裁定 ＋ 插件未写——插件源码与装置 J1–J5 段尚未动工）；前置 C 未跑。

**自曝**：

- **① 判据要订正（J5 断言对象）**：派发稿 J5 写「J0 定死的帧原文里注入块含 nonce」并预期 dump `request/header`/`request/context` 两帧定帧名。实测：`request/context` 是**路由元数据帧**（实测字段＝`provider`/`model`/`contextWindow`/`systemPromptUpdate`），不承载系统提示词内容；真正承载 `systemPrompt.context` 注入内容的是 **`system/message` 帧**（类型定义＝「The rendered system prompt on the model-visible surface」，surface node 0）。**建议 J5 断言订正为：`system/message` 帧原文含 nonce（逐字）**，J0 已 dump 该帧（`J0-events.jsonl` seq=7）。
- **② 前提失效报备**：前置 B 预期「server 真含在 npm 包内」经实测在 Win x64 平台不成立（见卡点 1），非跑歪、非工具层故障（client import 已单独验通）。
- ③ 无其他跑歪；本轮零 key 接触、零真 home 改动、临时 home 已清理（`S36_KEEP_HOME` 缺省 0，`rmSync` 实跑）。

---

## 📤 DSH-3.6.1 · S4 召回闭环（LLM 端到端）（WB 派发 · 2026-10-17 · Trae · ⏸ **卡点稿**）

> ⛔ **本稿现在不要跑** —— 前置 = **3.6 已回报且 WB 复验通过**（库就位、J0 帧名已定）。跑前在顶部状态区把本行改「🔵 待跑」并回报 WB 确认。

### 0 · 目标

验「**新会话能召回**」的 LLM 端到端：A 会话写入 → 全新会话 B 召回 → 模型回答含 nonce。判据权威全文 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.6 · S4 记忆最小闭环 —— 判据定稿 v3〉（`:1249`）v3 §J6。

### 1 · 判据（J6）

| 项 | 口径 |
|---|---|
| 正向 | A 会话写「项目代号 = `PING-<nonce>`」（nonce 随机 ≥8 hex）→ 全新 B 会话问「我的项目代号是什么」→ 回答**逐字含**（连续子串）nonce；允许**一次留痕重试**（报次数） |
| 前置 | 跑 B 前库里已有含 nonce 的行（J1 复述），否则停手报「属 J1/J2 未过」 |
| 负向 | B 指向**空 memory 库**（不复用 A 库文件）、同问 ⇒ 回答不含 nonce **且**该轮有 `assistant/message` 且 `turn/end.reason.kind==='completed'`（存在性断言，⛔ 防调用失败真空成立） |
| 断言视图 | J0 定死的帧原文 ＋ assistant/message **双取证**；⛔ 只凭模型输出不算 |
| 预算 | 总量 ≤10 次对话（DeepSeek 计价几毛钱量级）；超出停手报 |

### 2 · 判据前置

- 3.6 已过（WB 复验确认）＋ J0 帧名已定
- **key**：env 层注入（优先级最高、精确可控）—— 老大 2026-10-17 已配 `.dsh-home/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY`（结构校验 PASS）；本机老配置 `backend/config.yaml:16`（`models.deepseek.api_key`）亦有。⛔ **值不进稿 ／ 日志 ／ 证据 ／ 提交**；注入方式 = env 变量，⛔ 不改 `.credentials.yaml` 本体
- 装置 = 3.6 同款（临时 home ＋ env 注入 key 的**正向臂** ／ 无 key 的**负向臂**）

### 3 · 交付物 ／ 4 · 参考件 ／ 5 · 场地

同 3.6（本块无新源码——除非 3.6 复验要求改；证据落 `D:\Code\_trae-evidence\361\`）

### 6 · 回报格式 ／ 7 · 禁区

同 3.6（另加：⛔ 不得声称「key 落位证成」—— 3.0 已闭环事；⛔ 不得声称「补偿恢复成立」—— 定义不验已裁）

---

## 已清理段落（按交流区规矩）

- **2026-10-16 清理（Trae · 老大令「log 自查自清」）**：删〈未结项〉整段 —— 即「丙组②③回报的自曝①（Python 去默认值位序坑）」：该段虽挂"未结项"标题，实则 **2026-10-15 已闭环归位**（落点 = Trae 私有记忆 `project_memory.md` Lessons Learned，老大同日拍板；"同类攒够可升格 `.trae/skills/`"授权亦已在私有 profile 留档）⇒ 闭环且已升格、无第二真相风险，按活日志规矩直接删。顺带把状态区行内已闭环的过程细节（丙组②③交付号）压掉。回溯：`git log -p -- exchange/log-trae.md`。

---
