# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 派发 · DSH-3.0.4 · 环境同代化修复 + 重跑 D / E（2026-09-16 出稿）

> **执行人**：Trae ｜ **场地**：CVM（可否本机预演见任务 1）｜ **复验**：WB（回报落本文件）
> **基线**：`0.1.5-rc.2` ｜ **取代**：DSH-3.0.3 派发稿（任务 1 已完成、任务 2 / 3 顺延至本稿）
> **背景**：DSH-3.0.3 撞墙 —— 根因 = **跨代**（profile `0.1.5-rc.2` ↔ hoisted 根 / CLI / 装置侧均 `0.1.2-rc.1`）
> **老大 2026-09-16 拍**：修复路**都做**（原「P1 / P2 二选一」解除）—— 本稿展开为「诊断 → 验证 → 修复 → 验收」四步，其中 **P2 兼作验证步**
> **规格原文** → `../TODO.md` DSH-3.0 段 `:64-78`；**判据 / 假绿源** → `../docs/dsh/dsh-migration.md` §3.6「DSH-3」

### ⭐ 本稿形态：四步严格串行（不得跳步）

**为什么必须分步** —— 两条理由，都是 DSH-3.0.3 教的：

1. **判据缺前置**：环境不可用时 D / E 只能产出「三态同崩」。本稿把**环境可用性提升为硬前置判据**（DSH-3.0.3 回报 §7 第 2 条的建议，老大已采纳）
2. **归因**：多层一次改完再测，一旦仍崩就分不清是哪层没修好 ⇒ 只能重来一轮

⭐ **每步必须留观测，不得攒到最后一起测。**

### 任务 0 · 全层代际诊断（**只测不改**，产出唯一决策依据）

逐层测，填表交回：

| 层 | 位置 | 测法 | 为什么关心 |
|---|---|---|---|
| ① CLI 本体 | npm 全局 `@deepseek-ai/dsh`（**经 Junction 接入**） | `dsh --version`；`npm ls -g @deepseek-ai/dsh`；`ls -l` 看 Junction 指向 | DSH-3.0.3 崩栈显示它在关键路径上 |
| ② hoisted 根 | `~/.dsh/profiles/node_modules` | 包数 ＋ `@deepseek-ai/*` **版本分布**（不是只看总数） | 3 条 entry 回落到它 |
| ③ profile 侧 | `~/.dsh/profiles/sdk/node_modules` | deps ＋ 包数 ＋ 版本分布 | 3 个可选 peer 缺在这层 |
| ④ 装置侧 | `harness/node_modules` | `dsh-sdk-protocol` / `dsh-app-boot` / 其余 `@deepseek-ai/*` 版本 | DSH-3.0.3 崩栈首行指向它 |
| ⑤ 对照器材 | `~/larry-dsh-home`（profiles ＋ node_modules） | 同 ② ③ | 它是 DSH-3.0.3 的决定性反证 |

**判据**：表格每格有权版本号；读不出就写「读不出 ＋ 卡在哪」。
⛔ **本步一个字都不许改。**

### 任务 1 · 最小风险验证（**不动 `~/.dsh`**）

**目的**：先回答一个根本问题 ——「**同代 015 环境到底能不能 boot**」。

**做法**：另建干净的 `DSH_HOME`（如 `/home/ubuntu/.dsh-015`），**全量装 015** —— 含 CLI 侧（若 ① 走 Junction，需一并处理，方式按任务 0 结果定）⇒ 跑 boot 探针。

⭐ **可选：本机预演** —— 若本机 `~/.dsh` 同样跨代（`../TODO.md:65` 记为本机实测崩）⇒ **先在本机做**，成本更低、不动 CVM。⚠️ 但**平台差异是真实变量**（Windows ↔ Linux）⇒ 本机结果**不得直接外推** CVM，结论须注明取自哪条通道。

**boot 探针**（本步的观测装置）：`--profile sdk` ＋ stdin 保持 12 s，记四项：
`exit code` ｜ `stderr 行数` ｜ **栈帧里出现的版本号** ｜ **3 条 entry 是否还在**（`session-persistence-jsonl` / `session-query-sqlite` / `web-fetch-http`）

**判据**：`exit 0` 且 stderr 中**不再出现 `0.1.2-rc.1`**。
⛔ **若本步也崩 ⇒ 停下回报** —— 说明修复方向错，**别去动 `~/.dsh`**（凭据在里面，弄坏则 DSH-3.0.3 彻底卡死）。

### 任务 2 · 修 `~/.dsh`（**逐层一改一测**）

按任务 0 的表 ＋ 任务 1 的验证结果，把各层升到同代 015：

| 层 | 动作 | 备注 |
|---|---|---|
| ① CLI | 升全局到 `0.1.5-rc.2` | 注意 Junction 语义 |
| ② hoisted 根 | 升 / 重建到 015 | 方式按任务 0 结果定 |
| ③ profile 侧 | **P1**：补 3 个 015 可选 peer（`dsh-session-persistence` / `dsh-session-query` / `dsh-http-proxy`；现配 `autoInstallPeers: false`） | 若 ② 已升 015 ⇒ 回落自然匹配，本项**可省** |
| ④ 装置侧 | `harness/` 依赖升至 015 | ⚠️ 先核 `harness/package.json` 是否钉死 012 |

⭐ **每改一层，立刻跑一次 boot 探针**并记上条四项观测。**不得攒到最后一起测。**
⛔ 某层改完出现**新症状** ⇒ 停手回报，不要连改。

**⛔ 边界**：

- **`larry` profile 本次不动**（composition 与本地不同，属 3.5 / 3.7 派发时单独定）
- **不采纳软链**（两个 home 缠在一起 = 正是要消灭的重叠环境）
- **不得改动** `~/.dsh/.credentials.yaml`（负向态一律用隔离 home 造）

### 任务 3 · 验收 ＋ 重跑 D / E（**前置判据通过后才做**）

**进门判据（新增，硬）**：boot 探针 `exit 0` 且能建 session。**未过 ⇒ 停，不得进 D / E。**

过则按 DSH-3.0.3 原定规格重跑：三态互异 ＋ 每态记 `(DSH_HOME, profile, 凭据来源层)` 三元组；E 组夹具指 `~/.dsh/profiles`。

**⭐ 本次升级导致的两处必改**：

1. **D 组「无 key 态」不得再用 `~/larry-dsh-home`** —— CLI 升 015 后它会跨代，失去「同代对照」的意义。改用**隔离 home ＋ `profiles → ~/.dsh/profiles`**（即 DSH-3.0.3 那轮的 D2b 形态）
2. **E 组夹具** 同前指 `~/.dsh/profiles`

### ⚠️ 连带影响（先知道，别事后惊讶）

| # | 影响 | 处置 |
|---|---|---|
| 1 | `~/larry-dsh-home`（012 profile）在 CLI 升 015 后跨代 ⇒ **DSH-3.0.3 回报 §3 的「决定性反证」不再可复现** | 证据已固定（DSH-3.0.3 回报）；今后无 key 对照改用隔离 home |
| 2 | `~/.dsh/profiles/larry`（012 装）同样跨代 | 本次不动；3.5 / 3.7 派发时重装 |
| 3 | `~/larry-dsh-home` 的 sdk deps 是**四项**（多 `dsh-storage-sqlite` ＋ `@larryagent/plugin-storage-probe`）⇒「base ＋ sdk-app = 完整 composition」**未经 CVM 验证**（`../TODO.md:67`） | 修复后回核，顺手判它 |
| 4 | `dsh plugin add` 在 pnpm 报 `Done` 后 **node 不退出**（DSH-3.0.3 回报 §7 第 3 条，CVM / 本机同） | 执行范式：后台 ＋ 轮询日志，不要指望退出码 |

### ⛔ 假绿源清单（判「profile 可用性」一律不得使用）

| 命令 | 为什么假绿 |
|---|---|
| `dsh --profile <p> --help` | **不校验 profile 依赖**（三 home 全绿，1 s 内 exit 0） |
| `dsh --profile <p> --dump-config` | 只组配置树、**不激活** |

### 回报

- 落**本文件**
- 含：**诊断表 / 每步的 boot 探针四项观测 / 命令原文 / 反例 / 三元组**
- ⚠️ **产出不得是唯一副本**：CVM **2026-10-09 到期**（剩 23 天），回传 `D:\Code\_trae-cvm-evidence\` 或入库

### 不在本任务内（老大定「一个一个发，不要并行发」）

- **3.2 / 3.7** → 待本任务闭合后再发
- 3.1 → 批次 2 ｜ 3.3–3.6 → 批次 3 ｜ 3.8 ＋ 3.9 → 批次 4

---

# 回报 DSH-3.0.4（阶段 Ⅰ）· 任务 0 全层代际诊断 ＋ 任务 1 最小风险验证（Trae，2026-09-16）

> **结论先行**：**任务 0 ✅**（两通道，逐格有版本号，**一个字未改**）｜**任务 1 ✅ 两通道均通过** —— **同代 015 环境能 boot、且能真建 session**（Windows / Linux 同结论）。
> ⚠️ 同时交一条**方法论发现**：派发稿原定的 boot 探针（四项观测）**不能区分"健康"与"profile 缺失"** —— 我把 home 换成一个**根本不存在的目录**，观测**逐值相同**。已给出**加固装置**（`initialize` ＋ `session/prompt`）与反例，见 §2。

## 1. 任务 0 · 全层代际诊断表（只测不改）

| 层 | CVM（`/home/ubuntu`） | 本机（Windows） |
|---|---|---|
| **① CLI 本体** | `~/.dsh/profiles/node_modules/@deepseek-ai/dsh` = **symlink → `/home/ubuntu/harness/node_modules/.pnpm/@deepseek-ai+dsh@0.1.2-rc.1_…/`**；`--version` = **`0.1.2-rc.1`**；`command -v dsh` = 无；`npm ls -g` = 无 | 同路径 = **Junction → `C:\Users\SuLarry\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh`**；`--version` = **`0.1.2-rc.1`**；`npm ls -g` = **有** `@deepseek-ai/dsh@0.1.2-rc.1` |
| **② hoisted 根**（fallback 层） | 223 包 = **208 × `0.1.2-rc.1`** ＋ 3 × `0.0.1-rc.1`（`dsh-sandbox-local`/`dsh-sandbox-windows-acl`/`dsh-storage-domain`）＋ cordis 栈（`cordis` 4.0.2 / `plugin-group` 1.0.2 / `hmr` 1.0.17 / `include` 1.0.7 / `loader` 1.0.3 / `timer` 1.1.4）＋ `cosmokit` 1.8.3 / `schemastery` 3.18.2 / `node-addon-landlock-run` 0.0.1 | 223 包 = **214 × `0.1.2-rc.1`** ＋ 同一套 cordis 栈 ＋ `cosmokit`/`schemastery`/`0.1.1`（**同代**：两机都是 012） |
| **③ profile 侧** | deps = `dsh-base` ＋ `dsh-sdk-app` = **`0.1.5-rc.2`**；106 包 = **99 × `0.1.5-rc.2`** ＋ `node-addon-system`(-linux-x64) `0.1.2` ＋ 4 工具栈 | deps = 同两条 @015 ＋ **`@larryagent/plugin-015-preset-probe`（002 的探针，仍 link 挂着）**；105 包 = **100 × `0.1.5-rc.2`** ＋ `node-addon-system` `0.1.2` ＋ 4 工具栈 |
| **④ 装置侧 `harness/`** | 顶层仅 **2 包**：`dsh` / `dsh-sdk-client` = **`0.1.2-rc.1`**；`dsh-app-boot` / `dsh-sdk-protocol` 只在 `.pnpm` 下（同为 **012**）；`package.json:26-27` **钉死 012** | 同：顶层 2 包均 **012**；`harness/package.json` **钉死 012** |
| **⑤ 对照器材** | `~/larry-dsh-home`：profiles = `acp,node_modules,sdk`；hoisted **223 / 208 × 012**；sdk **101** 包（deps **4 项**：base ＋ sdk-app ＋ `dsh-storage-sqlite` ＋ `plugin-storage-probe`，全 **012**） | `.dsh-home`：profiles = `larry,node_modules,sdk`；hoisted **223 / 213 × 012**；sdk **99** 包（deps **2 项**，全 **012**） |

**读表得到的三条结构性事实（直接决定任务 2 要动几处）**：

1. **CVM 上「① CLI」与「④ 装置侧」是同一处** —— CLI 是 symlink 进 **harness 的 pnpm store** ⇒ 升 CLI ＝ 升 `harness/package.json` 的 `@deepseek-ai/dsh`。**本机不是**：① 走 Junction 到 **npm 全局**、④ 是 harness 里另一份 ⇒ 本机要动**两处**。
2. **② 是 dsh 自己维护的 fallback 层**（`healProfilesModuleFallback` / `<profiles>/node_modules.lock`），它的 012 来自 **`larry` / `web` / `acp`** 这三个 012 profile。
3. ⇒ ⚠️ **在「`larry` 不动」的约束下，② 与「升到 015」互斥**：只要 larry 还是 012，fallback 层就还会是 012。⇒ 任务 2 里真正能落地的次序是 **①(+④) → ③（P1 让 sdk profile 自带 015 副本）**；**② 只能"部分升"或不动**，需你裁（我不会擅自重建它）。
4. 附：连带影响表第 3 条（「base ＋ sdk-app ＝ 完整 composition」未经 CVM 验证）—— 本轮 CVM **/本机** 的两份 012 对照器材 deps 分别是 **4 项**（多 `dsh-storage-sqlite` ＋ probe）与 **2 项**，即**两种 composition 都真实存在过**；本任务 1 用的是 2 项版（与 dsh-base 的 bundles 声明一致），**能 boot**（§2）。

## 2. 任务 1 · 最小风险验证（两通道，**均未动 `~/.dsh`**）

**做法**：隔离新装一份 **015 CLI** ＋ 全新建一个 home，在里面装 `base` ＋ `sdk-app` @015，然后跑探针。

| 项 | CVM | 本机 |
|---|---|---|
| 015 CLI 落点 | `/home/ubuntu/.dsh-015-cli`（`npm i @deepseek-ai/dsh@0.1.5-rc.2`，exit 0） | `D:\Code\_trae-015\cli015`（520 包 / 32 s，exit 0） |
| CLI 自证 | `--version` = **`0.1.5-rc.2`** | **`0.1.5-rc.2`** |
| 新 home | `/home/ubuntu/.dsh-015` | `D:\Code\_trae-015\home015` |
| 装 profile | 第一次 **`ERR_PNPM_IGNORED_BUILDS`**（五项）→ 按既有手法改 `allowBuilds` 全 false → base **exit 0**、sdk-app **exit 0**（均 `Done in …`） | 同（第二次起 exit 0） |
| 装后核 | deps 两条 @015；profile **106 包 / 100 × 015**；**hoisted 层 ABSENT**（新 home 里根本没有 fallback 层） | deps 两条 @015；profile **105 包 / 100 × 015**；**hoisted `dirs=0`** |
| **boot 探针**（原定四项） | exit **0**｜stderr **0 行**｜栈帧版本号 **无**｜3 条 entry **不在** ⇒ 原文判据 **PASS** | 同（exit 0 / 0 行 / 无版本号 / entry 不在） |
| **判据（原文＝exit 0 且无 `0.1.2-rc.1`）** | ✅ PASS | ✅ PASS |

### ⚠️ 但原定四项观测**不敏感** —— 反例在下面（这是本轮最重要的一条）

我把 home 换成一个**根本不存在的目录**（`/home/ubuntu/.dsh-015-nonexistent` / `D:\Code\_trae-015\home-nonexistent`）重跑，观测**逐值相同**：

| 例 | home | exit | 存活 | stdout/stderr | 3 条 entry |
|---|---|---|---|---|---|
| 真 015 home | 已装 | 0 | 12072 ms | 0 / 0 B | 不在 |
| **不存在的 home** | 未装 | **0** | **12101 ms** | **0 / 0 B** | 不在 |

**机制（查实）**：dsh 会**自动把 home 建成空壳 profile**（`dependencies: {}`，bundles 仍声明 base ＋ sdk-app），而 **CLI 会从自己安装树里解析这两个包** ⇒ 空壳照样"boot 成功"。
⇒ 两条推论：**(a)** 派发稿原定四项观测**不能区分"健康"与"profile 缺失"**；**(b)** ⭐ **「profile 装齐」并不是 boot 的必要条件** —— 只有 profile 声明了**与 fallback 层不同代**的版本时才会出问题（这正是 3.0.3 崩的成因）。

### 加固装置（本轮新做，两通道都跑通）

依据 015 CLI 源码 `dsh-sdk-jsonrpc-server/lib/index.js`：方法面只有 `initialize` / `session/prompt` / `shutdown`，且 **`initialize` 会 `await ctx.get("loader").await()`**（＝插件树是否装载成功）；`session/prompt` 会**惰性真建 session**。

| 观测 | CVM（015 home） | 本机（015 home） |
|---|---|---|
| `initialize` | ✅ `{serverInfo:{name:"deepseek-harness-sdk-runtime",version:"0.0.1"}}` | ✅ 同 |
| `session/prompt` | ✅ **`{messageId:"99989c05-…"}`** | ✅ **`{messageId:"c40026a3-…"}`** |
| 通知流 | **18 条**（`session.event` / `session.status`） | **18 条**（同） |
| stderr / 版本号 / treeFailed | 0 行 / 无 / false | 0 行 / 无 / false |

⇒ **任务 1 判定：同代 015（015 CLI ＋ 015 profile ＋ 空 fallback 层）能 boot、能建 session —— 两通道同结论。**
⚠️ **证据边界（不许过度读）**：`session/prompt` 那一步**没有注入 key** ⇒ 只证明"**会话被建起来、turn 被发起**"，**不证明模型回合跑完**（那是任务 3 的 D/E 判据）。⚠️ 本机结果取自 Windows 通道，按派发稿要求**注明通道**、不互相外推。

## 3. 命令原文（可复跑）

```bash
# 015 CLI（隔离）
npm i --prefix <cli015> --registry https://registry.npmmirror.com @deepseek-ai/dsh@0.1.5-rc.2
# profile（新 home；第一次会因 allowBuilds 以 exit 1 结束，改完重跑）
DSH_HOME=<home015> CI=1 node <cli015>/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-base@0.1.5-rc.2
DSH_HOME=<home015> CI=1 node … plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.5-rc.2
# 装置（本轮新增，仓库外 D:\Code\_trae-cvm-evidence\004\）
node boot-probe.mjs  <dsh bin> <DSH_HOME> [holdMs]     # 原定四项观测 ＋ 存活时长
node rpc-probe.mjs   <dsh bin> <DSH_HOME> [--prompt]   # initialize ＋ session/prompt（加固）
```

## 4. 本轮踩到 / 记下的通道与姿势坑（都已在装置里规避）

1. ⚠️ **pnpm store 落在盘根会被本机 Trae 沙箱拦** —— `[ERR_SQLITE_ERROR] unable to open database file`，因为 store 默认 `D:\.pnpm-store`；**显式 `npm_config_store_dir` 挪进允许区即通**（本轮本机预演第一次就是死在这）。
2. ⚠️ **`dsh plugin add` 在 pnpm 报 `Done` 后 node 不退出**（CVM / 本机同）⇒ 装置里加"**Done 后静默 N 秒即收尾**"，并把 `killedAfterDone` 写进日志，**不假装正常退出**。
3. ⚠️ **boot 探针必须保 stdin 打开**（sdk app ＝ stdin 关闭即退出的 stdio 服务）；用 `stdio:'ignore'` 会得到"exit 0 ＋ 双流全空"的**假绿**（本轮栽过一次）。
4. ⚠️ Node 24 在 Windows 上 **不能直接 spawn `.cmd`**（`spawn EINVAL`）⇒ 跑 npm 要 `shell: true`。
5. ⚠️ 远端命令**内层双引号 / 反斜杠都会被本机通道吃掉**（`grep -E "A|B"` → 拆成管道；`sed s/\r//g` → 删字面 r）⇒ 一律**走 scp 上去的脚本**（本轮 5 个装置脚本零引号问题）。

## 5. 下一步（任务 2 的次序，按 §1 的结论提请你/WB 确认）

**拟执行次序**：**①(＋④ 同处) 升 015 → boot 探针 → 若仍崩 ⇒ ③ P1 补 peer → boot 探针**；**② 不擅自动**（与「larry 不动」互斥，见 §1 第 3 条）。
⚠️ 注意：①(＋④) 要改 **`harness/package.json`（现钉死 `0.1.2-rc.1`，26-27 行）＋ lockfile**（**受版本控制**）；这是任务 2 原文要求的动作，但它同时会改掉 D/E 装置侧的代际（任务 3 本来也需要 015 SDK），我会在改前**备份原文件并逐层留观测**。

---

# 回报 DSH-3.0.4（阶段 Ⅱ）· 任务 2 同代化修复 ＋ 任务 3 重跑 D / E（Trae，2026-09-16）

> **结论先行**：**任务 2 ✅（①＋③ 两层，② 未动并给出理由）｜任务 3 ✅ D / E 两组判据全部成立** —— **`~/.dsh` 现已能 boot、能建 session、能跑完真模型回合**；**D 组核心命题（凭据文件层真被读取且真用于调用）首次证成**。

## 1. 任务 2 · 逐层一改一测（CVM；改前已备份 `package.json`/`pnpm-lock.yaml` → `.bak-304`）

| 步骤 | 动作 | boot 探针（对 `~/.dsh`） | 判读 |
|---|---|---|---|
| **改前基线** | —（012 CLI ＋ 012 装置；profile 已是 015） | exit **1**｜1870 ms｜stderr **125 行 / 21856 B**｜版本命中 **`0.1.2-rc.1`**｜失败 entry **3 条**｜treeFailed **true** | 与 3.0.3 完全一致（复现） |
| **第 1 层 ①＋④** | ⭐ CVM 上二者**同处**：`pnpm add @deepseek-ai/dsh@0.1.5-rc.2 @deepseek-ai/dsh-sdk-client@0.1.5-rc.2`（cwd=`harness/`）→ **exit 0**；`harness` 顶层两份 **`0.1.2-rc.1` → `0.1.5-rc.2`**，`package.json` 钉版同步改写 | exit **1**｜1330 ms｜stderr 96 行 / 17103 B｜版本命中 **`0.1.5-rc.2`**（栈帧已换成 `dsh-app-boot@0.1.5-rc.2`）｜失败 entry **3 → 2 条**（`web-fetch-http` 修好）｜treeFailed **true** | ⭐ **① 部分有效**：修掉 1/3；剩 `session-persistence-jsonl` / `session-query-sqlite` ⇒ **① 单独不足** |
| **第 3 层 ③（P1）** | `plugin --profile sdk add @deepseek-ai/dsh-session-persistence@0.1.5-rc.2 @deepseek-ai/dsh-session-query@0.1.5-rc.2 @deepseek-ai/dsh-http-proxy@0.1.5-rc.2` → **exit 0**；profile `dependencies` **2 → 5 项** | **exit 0**｜**12060 ms**｜stderr **0 行**｜版本命中 **无**｜失败 entry **0 条**｜treeFailed **false** ⇒ **原文判据 PASS ＋ 加固判据 PASS** | ✅ **修好了** |
| **② hoisted 根** | **未动**（见下） | — | 见 §1.2 |

**① 改后立刻做的加固验证（同层一测）**：`rpc-probe` → **`initialize` ✅ ＋ `session/prompt` ✅ `{messageId}` ＋ 14 条 session 事件、零 stderr**。

### 1.1 三条需回写的判定

1. ⭐ **「base ＋ sdk-app ＝ 完整 composition」实测不成立**（连带影响表第 3 条的答案）：**缺 3 个"可选 peer"** —— 它们在锁文件里是 `peerDependenciesMeta.optional: true`，而 profile 配了 `autoInstallPeers: false` ⇒ pnpm 把它们列进 `transitivePeerDependencies`（**32 条**）**并不安装**，于是运行时回落到 fallback 层。**015 的完整 composition ＝ base ＋ sdk-app ＋ 这 3 个 peer**（若 fallback 层同代则可省）。dsh 对 `web-fetch-http` 那类还给了明确 warning：*"declares no dsh.bundle — installed as a plain dependency, not a profile layer"*。
2. **② 不动的理由（请你/WB 裁）**：② 是 dsh 维护的 **fallback 层**，其 012 来自 `larry`/`web`/`acp`；在**「larry 不动」**约束下升不了 015。而**①＋③ 已经让 sdk profile 自洽**（不依赖回落）⇒ ② 本层**非必要**，且动它有破坏其它 profile 的风险（3.5 / 3.7 再说）。
3. ⚠️ `~/.dsh/profiles/node_modules/@deepseek-ai/dsh` 那个 **symlink 仍指向 012 的 store 路径**（升 ④ 后未自动重链）；但它不是任何 bundle entry，实测**不影响**本轮全部结论。留痕备查。

## 2. 任务 3 · D 组三态（判据：三态互不相同 ＋ 每态记三元组）

**装置（两套并用）**：`dsh-prompt.mjs`（原定装置）＋ 新写的 SDK 判据装置 `d-codes.mjs`（走 `evaluateRun` 同款拆解，**能给出 `error.code`** —— 否则 D2 与 D3 在"退出码/stdout"上同形，会被误判成不互异）。
**⭐ 两套装置全程 `delete env.DEEPSEEK_API_KEY`** ⇒ 运行时**只能去读 `$DSH_HOME/.credentials.yaml`**。

| 态 | 三元组 (DSH_HOME, profile, 凭据层) | dsh-prompt：exit / stdout | **SDK 判据装置**：assistant/message ｜ finalResp.len ｜ turn/end.kind ｜ **error.code**（status） | ms |
|---|---|---|---|---|
| **D1 真 key** | `~/.dsh`, sdk, **真文件**（223 B / 600 / 键名在 / 值长 35） | **0** / **`PROBE-OK-304`** | **1 ｜ 12 ｜ `completed` ｜ —** | 5981 |
| **D2 无 key** | `/tmp/…-iso-nokey`（`profiles → ~/.dsh/profiles`）, sdk, **无** | 0 / 空 | 0 ｜ 0 ｜ `error` ｜ **`MISSING_CREDENTIAL`** | 1388 |
| **D3 错 key** | 同隔离 home, sdk, **伪造**（208 B / 600 / 值 = 明示无效占位） | 0 / 空 | 0 ｜ 0 ｜ `error` ｜ **`AUTH`（401）** | 1805 |

⇒ ✅ **三态互不相同，且 D2 与 D3 以 `error.code` 可区分**（`MISSING_CREDENTIAL` vs `AUTH/401`）。
⇒ ⭐⭐ **D1 ＝ 本步最重要产出**：**全程不注入 env key**，仅凭 `~/.dsh/.credentials.yaml` 即拿到 `completed` ＋ 非空回复 ⇒ **凭据文件层确实被读取、且真用于模型调用**（这正是 001 的 D 组、003 想证而两次没证成的事）。
⚠️ 派发稿要求的「无 key 态不得再用 `~/larry-dsh-home`」**已照改**（改用隔离 home ＋ `profiles → ~/.dsh/profiles`）；隔离 home 用完即删（含伪造凭据文件）。

## 3. 任务 3 · E 组三态（夹具 `DSH_REAL_API_PROFILE_HOME=/home/ubuntu/.dsh/profiles`）

| 态 | 注入 | exit | 关键输出 |
|---|---|---|---|
| E1 | **不注入** | **1** | 「有效 Key」用例**显式失败**（`开关 DSH_REAL_API=1 但环境变量 DEEPSEEK_API_KEY 未提供`）；`Test Files 1 failed` / `Tests 2 failed \| 12 passed \| 1 skipped (15)` |
| E2 | `sk-invalid-probe-003`（明示无效） | **1** | `有效 Key: verdict=FAIL … turn/end.kind=error error.code=AUTH status=401`；同上计数 |
| E3 | **真 key**（进程内传、落盘前脱敏） | **0** | **`有效 Key: verdict=OK assistant/message=1 finalResponse.len=11 turn/end.kind=completed`**；**`Test Files 1 passed`** / **`Tests 14 passed \| 1 skipped (15)`**；**R1 反向哨兵 ✓ 通过** |

⇒ ✅ **三态互不相同**（E1 未发起调用 / E2 `AUTH·401` / E3 `OK·completed`），且与 001 的 012 基线**同形**（`14 passed \| 1 skipped`、R1 ✓）⇒ **E 组判据成立**。
⚠️ 本组**只代表「环境变量层」**（vitest 的 `isolated-setup.ts` 会把 `DSH_HOME` 覆盖为临时目录）——**不得**用于宣称"凭据文件生效"（那是 D1 的结论）。

## 4. 命令原文（可复跑）

```bash
# 任务 2 · 第 1 层（①＋④，CVM 同处）
cd /home/ubuntu/harness && /home/ubuntu/node/bin/pnpm add \
  --config.registry=https://registry.npmmirror.com \
  @deepseek-ai/dsh@0.1.5-rc.2 @deepseek-ai/dsh-sdk-client@0.1.5-rc.2
# 一改一测
node /home/ubuntu/trae-evidence/004/boot-probe.mjs /home/ubuntu/harness/node_modules/@deepseek-ai/dsh/lib/bin.js /home/ubuntu/.dsh 12000
# 任务 2 · 第 3 层（③ P1）
DSH_HOME=/home/ubuntu/.dsh CI=1 node /home/ubuntu/harness/node_modules/@deepseek-ai/dsh/lib/bin.js \
  plugin --profile sdk add @deepseek-ai/dsh-session-persistence@0.1.5-rc.2 \
  @deepseek-ai/dsh-session-query@0.1.5-rc.2 @deepseek-ai/dsh-http-proxy@0.1.5-rc.2
# 任务 3
node /home/ubuntu/trae-evidence/004/d-probe2.mjs          # D 组（dsh-prompt 装置）
node /home/ubuntu/trae-evidence/004/d-codes.mjs           # D 组（含 error.code 的判据装置）
node /home/ubuntu/trae-evidence/003/e-probe.mjs           # E 组（run-real-api，夹具指 ~/.dsh/profiles）
```

## 5. 交付物 · 红线自检

- **CVM**：`/home/ubuntu/trae-evidence/{003,004}/` ＋ `304.tgz`（30 633 B）；003 含 D/E 原始输出、004 含本轮全部装置与观测
- **本机（已回传，非唯一副本）**：`D:\Code\_trae-cvm-evidence\304\`（**73 件**）；装置源码另存 `D:\Code\_trae-cvm-evidence\004\`（`boot-probe` / `rpc-probe` / `t1-local` / `t1-cvm` / `t2-cvm-layer1` / `t2-cvm-layer3` / `d-probe2` / `d-codes`）
- ⛔ **Tier0 自检**：对全部回传件扫 `sk-[A-Za-z0-9_-]{8,}` ⇒ 命中**仅**在我自己 driver 的源码（伪造标签 ＋ 脱敏正则），**任何日志/输出里都没有 key 值** ✅
- **CVM 侧改动清单（可回退）**：① `harness/package.json` ＋ `pnpm-lock.yaml`（**已备份 `.bak-304`**）＋ `harness/node_modules`；② `~/.dsh/profiles/sdk/package.json`（deps 2 → 5，**无备份，需回退可 `plugin remove` 那 3 项**）；③ `~/.dsh/profiles/sdk/pnpm-workspace.yaml`（allowBuilds 五项 false，003 那轮已做，原件在 `003/pnpm-workspace.yaml.orig`）
- ⚠️ **未动**：`~/.dsh/.credentials.yaml`、`larry`/`web`/`acp` 三个 profile、② fallback 层、`.dsh-home`（本机）

## 6. 未闭合项 / 待裁

1. **② 层**（fallback 层升 015）**未做** —— 与「larry 不动」互斥；**①＋③ 已够**，建议记为 3.5 / 3.7 一并处理。
2. **`~/.dsh` 里的 CLI symlink 仍指 012 store 路径**（不影响本轮结论）—— 建议在 3.5/3.7 或下次 `plugin add` 时自然重链，或由 WB 定一个"重建 fallback 层"的正式动作。
3. ⚠️ **本机 `~/.dsh` 未修**（本轮 任务 2 场地 = CVM）：本机仍是 ①Junction→npm 全局 012 ＋ ④harness 012 ＋ ③profile 015（**且还挂着 002 的探针 link**）⇒ **本机会复现同类跨代**。要不要按同法修本机，请裁。
4. ⚠️ **`Packages: -60`** 仍未查明（003 已记）。
5. ℹ️ 一条口径提醒：`dsh --profile sdk` 在 **profile 不存在时也会 exit 0 ＋ 双流全空**（dsh 会自动建空壳 profile，CLI 从自己安装树解析 bundles）⇒ 「exit 0」**永远不能单独当判据**（阶段 Ⅰ §2 已给反例）。

---


# 回报 DSH-3.0.3 · 装 profile + 重跑 D / E（Trae，2026-09-16）

> **结论先行**：**任务 0 部分通过｜任务 1 ✅ 完成（profile 装齐，判据两条均满足）｜任务 2 / 3 ⛔ 因一条「规格 ↔ 实测」矛盾阻断、三态不可判**。
> **一句话根因**：**profile 与 hoisted 根跨代** —— `~/.dsh/profiles/sdk` = `0.1.5-rc.2`，而同 home 的 `~/.dsh/profiles/node_modules` = **208 包 @ `0.1.2-rc.1`** ⇒ runtime **启动期即 `plugin tree failed to load`、exit 1** ⇒ 任何真会话 / 真 turn 都起不来（D、E 的真 key 态因此一步都跑不了）。
> **按 §边界停手**：我**没有**改 composition、**没有**升 CLI/SDK、**没有**动 hoisted 根与 `larry` / `web` / `acp`；老大 2026-09-16 拍「先不补」。

## 1. 任务 0 · 前置核对

| 检查 | 实测 |
|---|---|
| 0.1 registry 有无 `0.1.5-rc.2` | ✅ 有（`@deepseek-ai/dsh` 与 `dsh-base` 同；另有 `0.1.6-alpha.1`）；registry = `registry.npmmirror.com` |
| 0.2 装**前**核代际 | profile = **空壳**（`dependencies: {}`、0 包）｜hoisted 根 = **223 包 / 其中 208 个 `0.1.2-rc.1`**｜CLI = `0.1.2-rc.1`（无 `dsh` on PATH ⇒ 用 `<harness>/node_modules/@deepseek-ai/dsh/lib/bin.js`） |
| 0.2 装**后**回核 | **跨代依旧**：sdk 侧 99 包 @015 ＋ 5 个工具栈；**`dsh-session-persistence`/`dsh-session-query`/`dsh-http-proxy`/`dsh-app-boot`/`dsh-scope` 在 sdk 侧全部缺失** ⇒ 回落 hoisted 的 012（详见 §3） |
| 凭据现场 | `~/.dsh/.credentials.yaml` = **223 B / mode 600 / 含 1 行 `DEEPSEEK_API_KEY`**（值未读、未打印） |
| 负向器材 | `~/larry-dsh-home/profiles` = `acp / node_modules / sdk`（**012**、101 包、**同样缺** §3 那 5 个包） |
| 孤儿锁 | 无 |

## 2. 任务 1 · 装齐 `~/.dsh/profiles/sdk` ✅

**命令原文**（全程带 `DSH_HOME=$HOME/.dsh`；`CI=1`）：
```
node node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-base@0.1.5-rc.2
node node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.5-rc.2
```

| 轮次 | 现象 | 处置 |
|---|---|---|
| ① | **`ERR_PNPM_IGNORED_BUILDS`**（`dsh-subprocess-local` / `@google/genai` / `koffi` / `node-pty` / `protobufjs`）→ **exit 1** | 与 DSH-3.0.3 预告一致 ⇒ 按既有手法把 `profiles/sdk/pnpm-workspace.yaml` 的 `allowBuilds` 五项全改 `false`（**原件已备份** → `/home/ubuntu/trae-evidence/003/pnpm-workspace.yaml.orig`，sha256 `92e7ef26…`） |
| ② | base `Done in 3.1s`、**无 ERR**；但 **pnpm 报 Done 后 `node` 进程不退出**（挂 **1:51**）⇒ 我 kill 收尾（**exit 143**） | 与我在本机遇到的是同一现象（§7-3） |
| ③ | base **exit 0**（`Done in 2.5s`）、sdk-app **exit 0**（`Done in 2.7s`） | 判据两条均满足 |

⚠️ 途中有一次**我自己的操作事故**（留痕）：改 `pnpm-workspace.yaml` 时用 `sed -i s/\r//g` 去 CRLF，**反斜杠被本机→ssh 的传参吃掉** ⇒ 退化成"删掉所有 `r`"，`nodeLinke`/`subpocess` 之类被改花。已用 scp 上去的 node 脚本（`strip-cr.mjs`）重写并核对：`crlf=0 bytes=197`，sha256 `f25f534d…`。

**任务 1 判据**：
- `dependencies` ≠ `{}` ✅ → `{ "@deepseek-ai/dsh-base": "0.1.5-rc.2", "@deepseek-ai/dsh-sdk-app": "0.1.5-rc.2" }`
- `sdk/node_modules/@deepseek-ai` > 0 ✅ → **106**

⚠️ **一处观测异常（未闭合）**：每次 install 都打印 **`Packages: -60`**，但 profile 包数只增不减（0 → 106）、hoisted 根恒为 223 ⇒ 这 60 的归属**没查明**。记此以防后人把它读成"删了 60 个包"。

## 3. ⛔ 阻断取证链（本回报的核心）

| # | 环节 | 原始证据 |
|---|---|---|
| 1 | **runtime 单独 boot**（`--profile sdk`，stdin 保持 12 s） | `Error: dsh: plugin tree failed to load: failed to apply loader entry include (cordis:include): loader entries failed to apply` → **exit 1**；stderr **21856 B / 125 行**（`rt-real.rt-stderr.txt`） |
| 2 | **三条失败 entry** | ① `session-persistence-jsonl` ← `'@deepseek-ai/dsh-session-persistence' does not provide an export named 'SessionAlreadyExistsError'`；② `session-query-sqlite` ← `… no export named 'SESSION_QUERY_DEFAULT_PREPARED_SESSION_CACHE_SIZE'`；③ `web-fetch-http` ← `Cannot find package '@deepseek-ai/dsh-http-proxy'` |
| 3 | 这些包**在 sdk 侧根本没装** | `ls sdk/node_modules/.pnpm \| grep -c session-persistence` = **0**；`@deepseek-ai/` 下无该目录 |
| 4 | 为什么没装 | 锁文件里它们是**可选 peer**：`peerDependenciesMeta: {'@deepseek-ai/dsh-session-persistence': {optional: true}}`，且 profile 配了 `autoInstallPeers: false` ⇒ pnpm 把它们列进 **`transitivePeerDependencies`（32 条：25 个 `@deepseek-ai/dsh-*` ＋ ws/zod/…）并不安装** |
| 5 | 于是解析到哪 | 按 Node 解析规则退到**上一级** `~/.dsh/profiles/node_modules` ⇒ **`0.1.2-rc.1`**（导出对不上）；`dsh-http-proxy` 更是**全盘缺失** |
| 6 | ⭐ **决定性反证** | 09-14 那份**能跑**的 `~/larry-dsh-home`：我逐一核过，**同样缺**这 5 个包（全部 `=MISSING`），但它的 hoisted 根**也是 012**、与 profile **同代** ⇒ 回落拿到的是**匹配版本**，所以不报错 |

⇒ **根因 = 「profile 与 hoisted 根跨代」，不是「漏装包」**。这也与 DSH-3.0.3 §任务 0.2 提到的上游动向（016-alpha 新增 `profile-resolution/resolver.ts`、PR `fix/profile-module-resolution`）指向同一处。

## 4. 任务 2 · D 组三态 —— ⛔ 不可判

装置 = `harness/scripts/dsh-prompt.mjs` **裸跑**；**四态**（env 里 `DEEPSEEK_API_KEY` 一律删除）：

| 态 | 三元组 (DSH_HOME, profile, 凭据层) | profile 代际 | exit | stdout | 耗时 | 判读 |
|---|---|---|---|---|---|---|
| **D1 真 key** | `~/.dsh`, sdk, **真文件** 223B/600 | **015** | **1** | 空 | 1280 ms | 启动期崩 |
| **D2 无 key** | `~/larry-dsh-home`, sdk, 无 | **012** | **0** | 空（stderr `session=… events=12 notifications=14`） | 2497 ms | **能起 —— 但是"无 key 假绿"形态** |
| **D2b 无 key**（补的对照） | `/tmp/…-iso-nokey`(profiles→`~/.dsh/profiles`), sdk, 无 | 015 | **1** | 空 | 1512 ms | 启动期崩 |
| **D3 错 key** | 同上 iso, sdk, **伪造** 209B/600 | 015 | **1** | 空 | 1312 ms | 启动期崩 |

- **三态不互异**（D1 ≡ D2b ≡ D3：同崩、同 exit 1、同 1.3–1.5 s、同客户端栈 `JsonRpcResponseError: cannot create effect on inactive context` **-32603**）⇒ 判据**不成立**
- ⚠️ **唯一 exit 0 的那一态，恰好是"profile 与 hoisted 同代（012）"的那一态** ⇒ 它既是根因的**反证**，也正是 DSH-3.0.3 要我别重蹈的**无 key 假绿**：D2 与其它态的差异来自**代际**，**不是凭据**
- 红线守：真文件全程只读（只取 `present / bytes / mode / 键名 / 值长=35`）；负向两态一律**隔离 home** 造；隔离 home 用完即删（`/tmp/trae-003-iso-*` 已清）

## 5. 任务 3 · E 组三态 —— ⛔ 不可判（同形）

装置：`run-real-api.mjs`；夹具：**`DSH_REAL_API_PROFILE_HOME=/home/ubuntu/.dsh/profiles`（已按 DSH-3.0.3 改指 015）**

| 态 | 注入 | exit | 结果行 | R1 哨兵 |
|---|---|---|---|---|
| E1 | **不注入** | 1 | `Test Files 1 failed (1)`｜`Tests 2 failed \| 12 passed \| 1 skipped (15)` | **× 判红**（拿不到 `error.code`） |
| E2 | `sk-invalid-probe-003`（明示无效） | 1 | 同上 | 同上 |
| E3 | **真 key**（进程内传、落盘前脱敏） | 1 | 同上 | 同上 |

- **三态完全同形**（同 15 项、同 2 failed、同 ~1.24 s）⇒ 判据**不成立**
- ⚠️ 与 DSH-3.0.1 的 012 基线**不同形**（那次是 `Tests 1 failed \| 13 passed \| 1 skipped` 且 **R1 ✓ 通过**）⇒ 这轮多出来的那条 failed **就是 R1 自己**：它"判红"了但**没有 `error.code`** ⇒ 说明本轮不是 `AUTH/401` 那种**预期**失败，而是**启动期崩**（同 §3 根因）
- 机制自检 7 项**全 ✓**（它们不 boot profile）——**"绿了也不代表环境可用"的现成实例**
- ⚠️ 本组**只代表环境变量层**，且**因阻断而无效**，不得用于任何结论

## 6. 交付物 · 原始输出 · 红线自检

- **CVM**：`/home/ubuntu/trae-evidence/003/`（**30 件**）＋ `003.tgz`（14360 B）
- **本机（已回传，非唯一副本）**：`D:\Code\_trae-cvm-evidence\003-cvm\003\`（30 件）；装置源码另存 `D:\Code\_trae-cvm-evidence\003\`：`d-probe.mjs` / `e-probe.mjs` / `runtime-boot.mjs` / `strip-cr.mjs` / `pnpm-workspace.yaml`
- ⛔ **Tier0 自检**：对全部回传件扫 `sk-[A-Za-z0-9_-]{4,}` ⇒ 命中**仅**在我自己 driver 的源码里（伪造标签 + 脱敏正则），**任何日志/输出文件里都没有 key 值** ✅

## 7. 未闭合项 / 与规格矛盾

1. 🔴 **DSH-3.0.3 §任务 1「随传递装齐 ⇒ 无需手工补」与实测矛盾** —— 这是本次停手的直接原因（我**未**自行补）。
2. 🔴 **DSH-3.0.3 §任务 2/3 的判据「三态互不相同」在跨代环境下不成立** ⇒ 建议把**环境可用性**提升为判据的**前置**（＝我在 DSH-3.0.2 回报 §6-1 提的那条：**profile 必须与 CLI / hoisted 层同代**）。否则 D / E 永远只能产出"三态同崩"这种不可判结果。
3. ⚠️ **`dsh plugin add` 在 pnpm 报 `Done` 后 `node` 不退出**（CVM 实测挂 1:51，本机同）⇒ 建议写进执行范式：**后台 + 轮询日志 + 人工收尾**，不要指望退出码。
4. ⚠️ `Packages: -60` 的含义**未查明**（包数只增不减）。
5. ⚠️ **本机通道新坑（自留，防后人再踩）**：Windows→ssh 传参**不只吃双引号，也吃反斜杠** ⇒（a）远程命令**别用内层双引号**（要 `|` 模式就用 `grep -e … -e …`，别写 `grep -E "A|B"`）；（b）**别写 `sed s/\r//g` 这类含反斜杠的表达式**（会退化成"删字面 r"）。复杂动作一律**走 scp 上去的脚本**——本轮 4 个 driver（`d-probe` / `e-probe` / `runtime-boot` / `strip-cr`）零引号问题，这是本机通道下最稳的范式。
6. ⚫ **未做**（老大 2026-09-16 拍「先不补」）：把环境修成同代的三条候选路 —— **P1** 往 `~/.dsh/profiles/sdk` 显式补 3 个 015 可选 peer（最小、守 DSH-3.0.3 落点，但改 composition）；**P2** 另建全 015 home（不动 `~/.dsh`、不改 composition，但偏离 DSH-3.0.3 落点）；**P3** 升 CLI＋SDK 到 015（治另一层，单独做**不解决**这 3 条 entry）。**均未执行**。


# Trae 意见 · DSH-0.1.5 四稿（2026-09-15）

> 📮 **WB 状态批注（2026-09-15）**：7 条**已于 09-15 逐条回复**；**§三「基线 012 vs 015 冲突」已由老大 09-15 拍定解除**（挪 `0.1.5-rc.2`）；§五「可立刻动手」四项**仍未派发**。⇒ 本段保留，待其联动清单落地。
> 读的是：`docs/dsh/dsh-015-notes-scan.md`、`docs/dsh/dsh-015-upstream-inventory.md`、`docs/dsh/dsh-agents-md.md`、`exchange/dsh-015-capability-mapping.md`。
> **立场：四稿主体结论我认同**（尤其"自述 > 推断"的分层，以及 §A4 那次自我订正）。
> 下面只写三类东西：**① 我认为需要收窄的表述；② 我手上有实测、能直接补的；③ 一条立刻产生成本的联动。**
> **视角交代**：我是上一轮 DSH-2.5（①②③⑤）+ 2.3 + CVM/WSL 通道的实操方 ⇒ 手上的硬数据是 **012（`dsh-v0.1.2-rc.1`）**，另加本轮刚验通的 CVM 通道。**凡涉 015 的，我一律标"未验"。**

## 一、两处建议收窄（我的主要异议）

### 1.1 scan §A1 的推论只能"窄用"，不可外推成"定位问题已解决"

**§A1 本身我认同**：哲学载体确实在 rc 阶段落盘（AGENTS.md 一行 + 015 新增的 `session-format-status.md` + 一篇 implemented 笔记），"等 stable 才看得到哲学"这个前提**被推翻了**。

但它**只能证明"哲学（稳定性承诺）可读"**，不能证明**"产品定位的完整体现已到齐"**。**内证就在你自己的表 B1**：8 个域里 **4 项连子系统页都没有**（记忆 / 画像 / 自动路由 / 时间感知）、`identity` 仍是 anonymous、出厂形态是 loopback。

⇒ 建议 §A1 末句加一句限定：**「哲学已在 rc 落盘（不必等 stable）；产品定位（能力面广度）仍在建设中 —— 这是两件事，前者不必等，后者确实还没到齐。」** 否则"不用等 stable"极易被读成"定位也不用等了"。

### 1.2 「仍须自做 = 4」有被误读成"只剩 4 件事"的风险

统计**方向可信**，但 **"有设计参照" ≠ "我方工作量小"**。举一个我摸过的例子：

- **2.4.2 长期记忆闭环**判 🟡 可降级（理由：`storage` 的 `defineDomain` + `KvTable` 可挂）—— 你在同格也注明了 **`storage` 只有 KV，无向量、无 FTS**。⇒ 向量召回 + 语义层（人审 / 矛盾检测 / 保鲜）**全自做**，我估这一项**剩余工作量占比不低于 80%**。"可降级"在这里的含义是**省掉"从零设计存储"**，不是"省掉这一项"。

⇒ 建议 §2 总表**加一列「我方剩余工作量占比（粗估，待复核）」**。理由：三分类是**定性档位**，"4"是**计数**，而老大要拿它做"哪些做哪些不做"的取舍 —— **两者之间缺一个量**。

### 1.3 补一条我实测到的"可承接"陷阱（与 1.2 同源）

**"上游有正式契约 + 默认实现" ≠ "我方环境已就位"。** 今天我就在 CVM 上踩到：

| 层 | 实况 |
|---|---|
| 契约在 | `~/.dsh/profiles/sdk/package.json` 结构正常、bundles 声明正常 |
| 包在 | `~/.dsh/profiles/node_modules` 里 **223 个 `@deepseek-ai` 包** |
| **环境未就位** | 该 profile 的 `dependencies = {}`、`sdk/node_modules/@deepseek-ai` = **0 个** ⇒ 真实运行**启动期就崩**（`-32603 cannot create effect on inactive context`） |
| ⚠️ 而假绿源 | `dsh --profile sdk --help` 在**三个 home 下全部 exit 0** |

⇒ 建议"可承接"判据加一层**验收前置**：**① 契约在 ② 默认实现在 ③ 我方环境已就位**（三层分别过）。否则 12 只是纸面数字。

## 二、我手上有实测、能直接补的（按可执行度排序）

### 2.1 ⭐⭐ 3.2：**系统里有两把"锁"，语义相反，判据必须分开**

你在 A2 里把 3.2 的靶子定成 015 新增的 **session 写租约**（`lease.ts`：POSIX `flock(2)` / Windows named semaphore、**进程死亡即由内核释放**、**故意不做 TTL 抢占**）。这与**我实测过的另一把锁**完全不是一回事：

| | **A. `dsh-atomic-write` 的 profile 锁** | **B. 015 的 session 写租约** |
|---|---|---|
| 位置 | `$DSH_HOME/profiles/node_modules.lock` | `packages/session/session-persistence-jsonl/lease.ts` |
| 谁持有 | 装/修复 profile 模块时的写者 | session 写-open 的进程 |
| 持有者死亡后 | ⚠️ **永不自动回收** —— 源码注释原文：*"The contender never removes an existing lock because file age cannot prove that its owner stopped; **orphan recovery is an operator action**"*（我实测撞过 3+ 次，`node_modules.lock.bak.<ts>` 现在还有 4 个备份） | 内核在 fd/handle 关闭时释放（**含进程死亡**） |
| 失败表现 | 任何 dsh 命令启动即失败，报 `atomic-write: timed out waiting for the writer lock`（默认只等 **2 s**）——**极易误判成"profile 启动慢"或"网络问题"** | 第二个写者收 `SessionAlreadyOwnedError` |

⇒ 建议 **3.2 的判据里显式写死"区分两把锁"**：(a) 报告里凡是"锁残留"必须标是哪一把；(b) 实验前置要**先清 A 的孤儿锁**（否则实验根本没开始跑，你会得到"看起来像租约没生效"的假阴性）；(c) 追加一条我认为**必须实测**的子项：**Windows 侧 `taskkill /F` 杀进程后，named semaphore 是否真被内核释放** —— 这是"自述（README/源码注释）vs 实测"的分界点，且**我这边有现成条件**（本机 Windows + WSL 两侧各跑一次即可）。

### 2.2 ⭐⭐ 3.5 / 2.7.1：**我在 012 上的方言修复件，在 015 上必须重判（先判"上游是否已自修"）**

这是我认为**四稿里被漏掉的一条实质风险**：我在 012 上交付了 `harness/packages/plugin-sandbox-dialect/`（子类化 `LocalSandboxProvider`、覆写 `confine(argv, policy)`、按 `enforcement === 'partial'` 追加三条 denial 签名），修的是 **Windows 沙箱"拦得住但信号传不出去"**（node `EPERM: operation not permitted` 不命中签名表）。

而你的 inventory **表 A1 ⑤** 写着：**`sandbox-windows-acl` 有 9 条 README 欠账**；notes-scan **B2** 又记 015 把 `sandbox-local` 的 import 从需编译的 `fs-ext` 迁到了 `@deepseek-ai/node-addon-system` —— **即该包在 015 上确实动过。**

⇒ **我的插件在新版上是否仍必要、`confine()` 的返回结构与 `enforcement` 取值是否还成立，全部未验。** 建议列入 3.5 的**首项**：

1. **先判 015 是否已自修**（读 `DENIAL_SIGNATURES` 是否含 `operation not permitted`）；
2. 若已自修 ⇒ **我的插件应当退役**（否则我们长期维护一个上游已修的东西——这正是"Prefer maintained dependencies over hand-rolling"那条约定要拦的形态）；
3. 若未自修 ⇒ 重跑 `cordis-confine-check.mjs` 式的全链路复验（**不重跑不能沿用 012 结论**，同 A2 的"结论不可跨版本引用"）。

### 2.3 ⭐ 两条**未验**项恰好是两条改判的落地前提 —— 建议列为最优先实测

| 未验项（你 §8 已列） | 它卡住什么 | 我方条件 |
|---|---|---|
| `permission-presets` 自定义 preset 表在真实 profile 里能否生效 | **2.7.2 从"自做"→"可承接"的落地前提**（§3.1 整条改判靠它） | ✅ CVM 通道本轮已验通，可跑 |
| `workspace` 的运行时行为（membership 过滤 / attach 流程） | **2.3.3 改判（§3.2）** | ✅ 同上 |

⇒ 我的意见：**这两条不验，改判就只是"读文档改判"**。建议 §9 的裁定里加一句"改判以这两条实测通过为条件"（**条件通过**，而不是无条件接受）。理由与 §5.1 同类：**你已经在 §8 自己标了软/未验，若直接进 docs 就会被下游当成硬结论引用。**

### 2.4 ⭐ §5.1（脱敏 fail-open）：我同意这是最重的一条，并给一个可执行的构造法

你给的处置建议 ①②③ 我全同意（尤其 ③：**3.0 的凭据验真只验"读取与使用"，不把"不泄漏"计入 DSH 承接面**）—— 这与我 D 组的设计一致（我只读**键名/长度/类型**，从不打印值）。

补一条可执行的：**构造用例应由我方独立做，而不是等上游改**——
1. 在隔离 profile 里放一个**只经过 union / intersection / transform 才可达**的 secret 字段；
2. 走一次会触发 wire 渲染的路径（settings 读写 / Remote 请求）；
3. 断言**输出里不出现该值**。
⇒ 结果无论 fail-open 与否都有价值：fail-open 则坐实风险并据此写"我方可自保"；若已修则**这条风险降级**。（我可以在本机做，不占 CVM。）

### 2.5 A6（ACP `-32601`）：**上游自述已经答了**，实测可降为"确认性"

你在 A6 严守"读 diff ≠ 实测"，纪律对。但**同一条结论在 inventory 表 A1 ③ 里已有上游自述**：`acp` README 原文列了 *"session deletion, fork, `session/load`, modes, commands, plans, terminals, client filesystem operations, and elicitation **remain outside**"*。

⇒ **两条独立证据（015 自述 + 012 我方实测 -32601）已同向** ⇒ 记法可从"待实测"改为"**015 自述仍缺（我方 012 实测一致）；实测降为确认性**"。我方有现成器材（`cvm-acp-probe.mjs` 已随本轮同步到 CVM）。

### 2.6 2.10.1（传输安全）：一条可直接复用的验收法 + 一份网络基线

- **验收法（我方实测过，可复用）**：绑 `127.0.0.1` 起服务 → **本机侧可达、局域网侧不可达**（我在 WSL 上实测：Windows 侧 200 / 局域网 000）。这与 §5.2「出厂 cookie 未标 `Secure`、传输是 loopback HTTP」正好配成一对：**上公网前必须有一条"从非本机探测必须失败"的验收**，而不是只写"我们加了 TLS"。
- **网络基线（本轮 CVM 实测，供 `web_fetch` 承接评估用）**：`registry.npmmirror.com` **784 KB/s**（2.27 MB / 2.90 s）、`github.com` **121 KB/s** ⇒ **同机不同目标差 6.5 倍**。⇒ §4.1 若决定承接 `web_fetch`，**"反爬 / 可达性"这一项必须先钉住目标与网络口径**，否则实测数字不可比。

### 2.7 方法论印证：你 §A4 那条订正，我这边有一个**同族实例**

你的教训是「**某类证据存在 ≠ 它覆盖了目标**」。我在 DSH-2.5 ③ 上栽的是它的兄弟形态：**观测点选错（放在了有前导包装的那一层之前）⇒ 得到假阴性**（裸 spawn 少了 `ENCODING_PREAMBLE`，我因此报过"中文方言串未复现"，后来证明是探针姿势问题）。

⇒ 建议把两条并为一条写进方法库：**「证据存在 ≠ 覆盖目标」＋「观测点必须在真实链路上」**。并可顺手把它固化成一条动作（对我方后续所有验收稿生效）：**每个验收脚本头部写一行"本脚本模拟的是哪条真实链路"**（我已在 DSH-3 计划稿附 B §六 提过）。

## 三、一条立刻产生成本的联动（建议优先裁）

**基线 012 → 015 与我在做的 DSH-3.0，是冲突的。**

实情：我**今天**刚在 CVM 上按 `0.1.2-rc.1` 完成同步 + 装环境 + 跑 E 组三态（`pnpm install` 后 lock 里全是 `0.1.2-rc.1`、`dsh --version` = `0.1.2-rc.1`），D 组卡在 profile 未装（见上文回报 DSH-3.0.1 §4）。

- 若 **3.0 继续按 012 收口** ⇒ 我今天的证据**继续有效**，D 组装齐 profile 即可闭合；
- 若 **立刻转 015** ⇒ 按你自己的 A2 纪律（"结论不可跨版本引用"），**我这批 E 组结论必须降级为"通道/环境自证"**，D/E 要重做；且 015 的破坏性清单（Session V2→V3 / 移除 `ctx.agent` / persona 前后缀拆分 / `conversation` slot → `main`）会**同时改掉 3.1 与 3.7 的靶子**。

⇒ **请裁**：3.0 是"**按 012 收口后整体转 015**"，还是"**现在即转、3.0 重做**"？这不是我能自决的（它影响基线声明与整批证据的效力），但它**今天就要用**。

## 四、对落点与 §9 六问的简答

**落点**：判定依据 + **可复跑取法**留 `docs/`（你已经把取法写成可复跑脚本，这条很好）；**过程稿留 `exchange/`**。另补一条硬要求：**凡引用上游文本必带 tag** —— 我在 012 上摸过的东西（`DENIAL_SIGNATURES` 是模块级 const、`LocalSandboxProvider.confine()` 的返回形状）**在 015 是否还成立未验**，无 tag 的引用等于没有引用（AGENTS.md §7 已定此规矩，我附议并给出实例）。

| §9 | 我的意见 |
|---|---|
| 1 三档口径是否加「须关闭」 | **同意加**。我再补一档「**须实测后定**」——把 §8 的未验项单列，**不允许先归三类**（否则 1.3 那类假绿会被吸收进"可承接"） |
| 2 2.7.2 改判 | **条件同意**（§2.3：「自定义 preset 表生效」实测通过才算数） |
| 3 2.3.3 / 2.10.2 改判 | **同意**（2.10.2 那条"下沉 = 给框架写一个端侧 provider"我特别认同——与我实测到的 seam 形态一致） |
| 4 §4.1 `web_fetch` 重新评估 | **同意重新评估，但成本只降一半**：SSRF / 封顶已给 ✔；**反爬与正文抽取仍无**（`WebFetchBody` 只有 `html`/`text`）⇒ 正文抽取仍自做，而那正是原判"不做"的主要理由之一 |
| 5 §6 八条改动 | **先改 2.7.2 / 2.3.3 两条**（等 §2.3 实测落地后再批量），其余标"待测" |
| 6 落点路径 | **认同**（三稿 + 本稿合并进 `docs/`，`exchange/` 留过程痕） |

## 五、我能立刻动手的（供派发参考）

| 项 | 位置 | 前置 |
|---|---|---|
| 3.2 两把锁的区分实验（含 Windows `taskkill /F` 后租约释放） | 本机 + WSL | 无 |
| 015 的 `sandbox-local.confine()` 契约对照 + 方言自修判定 | 本机（读 `ref/dsh-bare` @ 015） | 无 |
| `permission-presets` 自定义表 / `workspace` membership 运行时实测 | CVM（通道已验） | 无 |
| `settings/redact` fail-open 构造用例 | 本机隔离 profile | 无 |
| D 组收尾（装齐 `~/.dsh` 的 sdk profile） | CVM | ⚠️ **需先裁 §4（回报 DSH-3.0.1）与 §三（基线）** |

**不改任何 docs / TODO 的本稿**——以上全部是意见，等你裁。
