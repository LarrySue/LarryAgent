# DSH 迁移讨论稿

> **状态：决策稿，A 路径已拍板。**
> 用途：讨论LarryAgent 是否迁移到 DeepSeek Harness（dsh）
> **结论已出**：A 路径（换底座）；本文件代表"路径决策 + 实施规划"，不再代表"待定评估"。
>
> 评估基准：`../docs/product-positioning.md`（8 域 / 31 子项能力树）
>
> **✅ A 路径拍板**：老大给出三条立论（项目小 / 专属能力薄 / 能力建设维度升级）+ DSH 主仓事实校准 → C → A 反转。
>
> **两段式**：结论区 WB 维护（§1/§2/§3，**只写结论与方向**——不写「采纳了谁的意见」、不展开「为什么不做什么」）；讨论区各方直接表态。**历史过程不保留在本稿**（见 git 历史与 `.workbuddy/memory/`）。

---

## 1 评估基础

> 适用范围：本稿仅评估"是否将 LarryAgent 后端切换到 DSH 框架"的工程决策；不含产品定位层（见 `../docs/product-positioning.md`）与协作机制层。

### 1.1 能力树基准

`../docs/product-positioning.md`（8 域 / 31 子项）—— 31 子项的 ✅/🚧/📐/🗣️ 状态作为"现状画像"，与 DSH 能力做逐项承接对照。

### 1.2 核心代码体量与深度（待能读代码的 AI 评估）

- 后端核心非测试代码量
- 已 ✅ 子项的实际深度（"是否真的已优化"而非"跑通"）
- 📐🗣️ 子项的实际代码量

### 1.3 14 条旧基准（追溯）

> 14 条已重整为 8 域 / 31 子项能力树（见 §1.1），本节保留 14 条原貌作为追溯。

**能力**：1 多模型按需切换｜2 工具挂载｜3 专家（或角色）切换和自动路由｜4 长期记忆和短期记忆｜5 会话为单元管理｜6 用户画像｜7 知识库
**约束**：8 使用成本管理｜9 行为安全约束
**可见性**：10 沉淀信息可见（可管理）｜11 AI 行为可见
**质量**：12 时间感知（上下文对齐）｜13 良好的超长会话一致性
**形态**：14 云端部署、多端使用

### 1.4 对标产品：QoderWork ≠ Qoder

> 老大注：本条目不要成为核心依据或者因为这条就自缚手脚，这只是本项目的缘起，随着持续深入地做，随着本人的认识提高，随着外部技术水平的迭代，目标会有进化，目标产品还是以`../docs/product-positioning.md`为准

| 产品 | 定位 | 与本项目关系 |
|---|---|---|
| **Qoder**（IDE + JetBrains 插件）| 专业编码，面向开发者 | 无关 |
| **QoderWork**（桌面 AI 助理）| **通用知识工作**；内置产品/运营/HR/法务/财务/数据分析**角色技能库**；可自定义**专家套件**；本地处理 + 安全沙箱 + 文件保护 + 删除可恢复 | **对标产品**（`HUMAN_NOTE.md`）|

### 1.5 押注主体依据（老大明示 · 信念层）

> **老大原话要点（2026-09-07）**：**最根本的是对深度求索（DeepSeek）公司本身的信任，可以说是一种押注**——"这确实比较唯心，但是也是有依据的"：自最初版本 DeepSeek 发布以来一直做得不错，且深受国家重视，有理由相信会有更好的发展；**其战略重心是 AGI，而非多模态与 harness，但对本项目这种规模而言足够了**。

**定性（WB 标注，防证据等级虚高）**：本条是**信念层判断，不是证据**。它不可证伪、不参与任何事实断言的成立与否，只回答一个问题——**为什么是这家公司的底座，而不是别家**。按本稿 §2 铁律与项目「证据纪律」（身份不为证据加权），**去掉本条，A 路径依然成立**——A 由以下五条独立支撑，无一条依赖本条或社区热度：① 老大三条立论（项目小 / 专属能力薄 / 底座进化论）；② **本地代码实证**（§2 各能力包与 8 子项承接，均经锁定版核实）；③ **官方双分发**（npm `@deepseek-ai/dsh` + PyPI SDK/runtime-bin，含 Windows x64 wheel）；④ **MIT 兜底**（最坏可 fork 自维护）；⑤ **边界已核**（AGENTS.md / SAFETY.md 的风险与能力上限均已本地查证）。

**信任与兜底的分工（不可互替）**：

| | 回答什么 | 失效场景 |
|---|---|---|
| **信任**（本条，信念层）| **选谁**——在能力相近的候选底座中，押其持续发展与资源投入能力 | 公司战略调整 / 投入撤出 / 方向转移 |
| **兜底**（MIT + TS 可 fork + 锁定版 `0.1.2-rc.1` + 边界已核 + 阶段 6 前双轨可回退）| **选错的代价**——最坏可接手自维护 | 许可变更 / 代码不可读 |

> **⚠️ 必须暴露的矛盾（老大自己已点破，WB 认为这是本条最需要被记住的部分）**：**AGI 是重心 ⇒ harness 是副产品**。这既是我们能免费拿到高质量底座的原因，也意味着**它可能随时因主线需要被调整、降速甚至停更**。这不是反对 A 的理由，而是「**兜底必须与信任并列、不能因信任而放松**」的理由——MIT 许可与 TS 可读性，是我们对该风险的**唯一**实质对冲（有兜底 = 副产品被砍也能接手；无兜底 = 信任一失效即归零）。

**失效条件（可证伪边界，命中任一即重估 A 路径）**：① DSH 连续两个 release 周期无实质投入（commits / release 频率断崖，与 §2 只记录不解读的基线比）；② 许可变更（MIT → 受限）；③ 官方明示 harness 停止维护或转闭源；④ §3.7「升级 SOP」事件触发条件长期无法收敛（preview 状态无限期）。

---

## 2 DSH 事实画像

> **来源图例**（本稿铁律，凡引 DSH 事实必标）：🟢 **本地代码验证**（`ref/dsh-bare/` 锁定版，可靠）｜🟡 **官方源 / API**（GitHub API、docs 站、release notes，次之）｜🔴 **推断未验证**（**不得作为结论依据**，只能列入待验证）
>
> 本表 🟢 项均以本地副本锁定版 `dsh-v0.1.2-rc.1` 实测为准（裸仓库 `ref/dsh-bare/`，不入 git；查阅方式与四条踩坑见 §2.2）。

| 维度 | 事实 | 来源 |
|---|---|---|
| **是什么** | DeepSeek 官方开源 **Agent Harness（智能体运行框架）**。官方公式 `Agent = Model + Harness` | 🟢 |
| **不是什么** | **不是大模型、不是推理引擎**（≠ vLLM / SGLang）。模型负责推理，Harness 负责对接环境、工具闭环、任务调度、权限管控、会话追踪 | 🟢 |
| **定位** | **架构通用、开箱偏编码**。内核无特权、连 Agent Loop 都可换 → 理论可做通用 Agent；但内置工具（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`——本地确认**五者均存在**）与四模式**均围绕编码场景**设计 | 🟢 |
| **官方口径** | 多数解读称"AI **编程** Agent Harness"；亦有解读明确「**不是单一编码助手**，而是可组装的智能体基础设施」——**并不矛盾**：架构通用 ≠ 开箱通用 | 🟡 |
| **口号 / 内核** | Everything is a Plugin（万物皆插件）；内核 = **Cordis** 插件总线（Koishi 生态插件内核）| 🟡 |
| **主语言 / 规模** | **TypeScript**（Monorepo）。**本地实测：锁定版 `packages/` 顶层 50 个包目录**，另含嵌套子包（如 `sandbox/sandbox-windows-acl/`）；仓库 156 MB / 9,080 文件 | 🟢 |
| **许可证** | **MIT**（Copyright 2026 DeepSeek，本地 LICENSE 确认）| 🟢 |
| **锁定版本** | **`dsh-v0.1.2-rc.1`**（0.1.2 线首个 RC，老大裁定锁 release 线）。master 开发线 `dsh-v0.1.3-alpha.1`。**tag 名带 `dsh-` 前缀**；11 个 release **全部 prerelease**，无 GA 时间表 | 🟢 |
| **社区规模（2026-09-07 更新）** | star **215K** / fork **25.3K** / watch **923** / releases **11 tags** / commits **15,210**（老大读数；WB 于 09-07 15:53 用 GitHub API 交叉验证 star 214,526 / fork 25,270，与老大读数一致，24 小时 +612 star）。**天龄 25 天**（仓库创建 2026-08-13）。**只记录，不解读** | 🟡 |
| **官方状态** | `SAFETY.md` 原文：「experimental developer-preview software. It has **not undergone a security audit** and **must not be treated as secure or production-ready**」；沙箱/审批/权限「do not guarantee isolation」 | 🟢 |
| **沙箱** | 四子包：`sandbox/` + `sandbox-local/`（Linux bwrap→Landlock / macOS Seatbelt / **Windows restricted token**）+ `sandbox-policy/` + **`sandbox-windows-acl/`**（Windows 写入限制：受限子进程仅可写工作区与私有 temp）。三档策略 `read-only` / `workspace-write` / `danger-full-access`；被策略拒绝的调用可经**用户批准的一次性升权**重试。**同世界隔离**：共享宿主内核与文件系统，非容器 / microVM 级 | 🟢 |
| **运行形态** | 5 个 profile（web / headless / sdk / sdk-minimal / acp）+ 本地 `host/`（API gateway）+ 本地 `client/`（Web-GUI）| 🟡 |
| **能力分布** | `compaction/` `sandbox/` `interaction/` `session/` `session-query/` `llm/` `mcp/` `acp/` `sdk/` `preset/` `storage/` `e2b/` `subagent/` `workflow/` `web/` `terminal/` `shell/` `fs/` `lsp/` `test-support/` **本地逐一确认存在** | 🟢 |
| **官方分发（关键）** | ①npm **`@deepseek-ai/dsh`** 真实发布，latest = `0.1.2-rc.1`（与锁定版一致），MIT，bin=`dsh`，70 依赖，官方用法 `npx @deepseek-ai/dsh web`；②PyPI **`deepseek-harness-sdk`**（纯 Python，any 平台）+ **`deepseek-harness-runtime-bin`**（`0.1.2rc1`，**Linux x64/arm64 · macOS arm64 · Windows x64** 均有 wheel），**后者把 `dsh` CLI 与整个 Node 依赖树打包为原生可执行文件，SDK 使用无需系统 Node.js**（`requires no system Node.js`） | 🟢 |
| **插件生态（关键，前判"生态早期"已推翻）** | 社区精选列表 `awesome-dsh-plugin/awesome-dsh-plugin`（**14.7k star**）共 **3,199 个插件**，25 个分类；官方安装命令 `dsh plugin add`（插件声明 `dsh.bundle` manifest）+ 插件市场 **`dsh-market`**（一键安装/升级）。**与本项目强相关分类**：Tools & Capabilities **425** / Memory **149** / Sessions & Messages **201** / Workflow & Automation **190** / Skills **135** / Models & Providers **130** / Security & Permissions **108** / Remote & Mobile **89**（飞书 bot / LAN access / auth tunnel）/ WSL & Windows Interop **34**。**Identity & Communication 仅 12**（印证 §3.3「用户画像 DSH 不给」—社区也未补上）。**插件装载在 DSH 运行时内，与后端是否用 Python SDK 无关**（两类方案不冲突）。**⚠️ 用法约束见 §3.0：生态对我们是「参考实现库」，不是「能力货架」——只借鉴 / fork，不直接纳入** | 🟡 |
| **`identity/` 语义** | 存在，但**不是用户画像**：「one anonymous id per harness home… **without identifying the user**」，用于 telemetry / feedback / DeepSeek 请求关联，无配置项 → §3.3「用户画像 DSH 不给」结论**成立** | 🟢 |
| **云端形态** | AGENTS.md 对 cloud / multi-user / tenant / single-user / personal **零命中**（本地 grep 确认）| 🟢 |

### 2.1 关键能力（按与本项目相关度排序）

1. **沙箱安全策略**（对应 #9）：`sandbox/` 进程隔离（bwrap/Landlock/Seatbelt），**比"分级"更彻底**
2. **会话持久化 + 上下文压缩**（对应 #13）：`session/` `compaction/` `context/` 独立包；SessionEvent 追加日志，支持 **fork / resume / compaction / 回放**
3. **Trajectory 完整轨迹**（对应 #11）：`session/` `session-query/`（含 SQLite FTS）；比"工具名+状态+摘要"更完整
4. **结构化工具管道**（对应 #2）：前置策略拦截 → 沙箱守卫 → 审批 → 超时重试 → 结果规范化 → 后置处理
5. **多模型适配**（对应 #1）：`llm/` Service Definition + DeepSeek / OpenAI / Anthropic / Ollama 等 provider
6. **人机审批**（对应 #9 部分）：`interaction/` approval/permission/ask-user + `credentials/` 凭据引用
7. **真正的插件总线**：模型适配器、文件工具、Shell、Skill、会话存储、权限、主循环、UI 全部可插拔可热替换

> **PTC 模式**（对应 #8 部分）：模型输出 TS 代码编排批量工具调用，减少 LLM 往返、省 Token。
> **ACP（Agent Client Protocol）**：headless 之外的自动化服务协议（`acp/` 包 + `sdk/` JSON-RPC SDK），是 B/D 路径抓手。

### 2.2 本地代码副本（AI 查阅指南）

- **路径**：`ref/dsh-bare/`（**裸仓库**，项目根；`.gitignore` 已排除，**不入版本**）
- **性质**：**只读参考副本**——供 AI 核查 DSH 事实用，**不是 LarryAgent 的项目依赖**。项目代码对它**零引用**，构建与运行时都不读它
- **锁定版本**：`dsh-v0.1.2-rc.1`。老大裁定「演进红利不在一时」，**锁 release 线、不跟 master**

**查阅命令（读 git 对象，秒出；`-C` 指定裸仓库路径）**

```bash
git -C ref/dsh-bare tag                                      # 列全部 tag
git -C ref/dsh-bare ls-tree -d --name-only <tag> packages/   # 列顶层包
git -C ref/dsh-bare ls-tree -d --name-only <tag> packages/<包>/  # 列嵌套子包
git -C ref/dsh-bare show <tag>:<路径>                        # 读文件内容
git -C ref/dsh-bare grep -i "<词>" <tag> -- <路径>           # 跨版本全文搜索
git -C ref/dsh-bare log -1 --format="%ci" <tag>              # 该版本提交时间
```

**需要实体文件时（按需局部检出，只写少量文件）**

```bash
git -C ref/dsh-bare --work-tree=ref/dsh-wt checkout <tag> -- packages/compaction
```

只在 `ref/dsh-wt/` 下写出该包，**不要整体 checkout**（会重现卡死）。

**四条已踩过的坑（务必遵守）**

1. **不要用工作区 `ls` 判断包是否存在**——checkout 未完成时会产生「部分真相」（本次据此误判 `storage/` 不存在）。裸仓库无工作区，此坑自动消失
2. **不要把官方 config-catalog 当包清单**——它只列**有配置项**的包，未列出 ≠ 不存在（本次据此误判 `identity/` `subagent/` `workflow/` `web/` 为"虚焊"）
3. **嵌套子包不在顶层**——`sandbox-windows-acl/` 位于 `packages/sandbox/` 下，按顶层 ls 会漏判
4. **不要在 Windows 上做整体 checkout**——9,080 文件 + 实时防护逐文件扫描 = 卡死（实测 5.5 小时未完成）。要实体文件就走上面的「按需局部检出」

**刷新方式**：`git -C ref/dsh-bare fetch --tags`（裸仓库无分支切换，直接按新 tag 查即可）


**验证纪律**：任何写进本稿**结论区**的 DSH 事实必须标 🟢 / 🟡 / 🔴；**🔴 不得作为决策依据**，只能列入待验证

---

## 3 A 路径决策与实施规划

> **拍板来源**：老大三条立论（项目小 / 专属能力薄 / 能力建设维度升级），WB 立论反转 C → A。**事实校准**：基于本地副本 `ref/dsh-bare/` 锁定的 `dsh-v0.1.2-rc.1` 代码与 AGENTS.md。

### 3.0 第三方引入原则（老大拍板硬约束，优先于本节其余结论）

**一句话**：社区 / 第三方插件**一律不直接纳入为运行时依赖**，只作参考源——可读、可 fork、可抄，**不可"装上就用"**。

| 用途 | 是否允许 | 说明 |
|---|---|---|
| 读源码借鉴设计（schema / 检索策略 / 信任模型 / 交互流程）| ✅ 鼓励 | 生态真正的价值是"别人已替我们试错过" |
| fork 后自行改造并纳入 | ✅ 允许 | 代码进本仓库 → 走本项目的 review / 测试 / 命名与产品语义，**维护责任归我们** |
| 临时装进隔离环境跑 prototype 验证思路 | ✅ 允许（临时）| 只用于验证，不进产品依赖；产出以"结论 + 可借鉴点"沉淀回本文档 |
| **直接 `dsh plugin add` 装上并作为产品依赖** | ❌ **禁止** | 无论 star 数、无论是否"企业级维护" |

**立论（老大 2026-09-07）**：现象级爆发的插件生态必然伴随大量跟风项目无人持续维护——今天 14.7k star 的精选列表，两年后相当比例是弃坑件。把关键能力押在外部作者不可控的维护意愿上，风险高于所省下的实现成本。**即使企业级维护的插件也不直接纳入**：fork 后自己改造，或参考其代码自己实现。

**边界**：本原则针对**插件 / 第三方扩展**；DSH **底座本体是框架依赖、不是插件**，A 路径依然成立。底座的同等兜底是 **MIT + TS 可 fork 自维护**（见 §3.4 上游集中度行）——即"依赖一个**可接手**的底座，而不是**不可控**的插件"，两者风险性质不同。


### 3.1 一句话结论

**A 路径强推**——**底座能力开箱获得**（compaction / sandbox / 审批 / trajectory / 多模型 / MCP / ACP，按 31 子项对照共 **8 子项直接承接**，见 §3.6 承接总表），**产品语义层全部自做**（**23 项**，含长期记忆语义化 / 用户画像 / 知识库 / 单人形态 / 云端 / 回收站；其中长期记忆语义化 / 知识库 / 多端接入 = **借鉴社区设计后自实现**，不直装，见 §3.0 / §3.3）。A 路径省的是"造底座"，不是"写代码总量"。

**哲学一致性**（底座重 ≠ 产品重）：底座选择走重型（借用 DSH 演进红利 + 底座能力开箱），产品语义层保持轻量派（记忆 / 知识 / 形态三条主线延续产品树结论：不上 KG、不上重护栏、分级触发）；DSH 的 Web GUI / trajectory 全暴露 / 五 profile 等开发者向复杂度，在用户侧收敛回 LarryAgent 的克制界面（保留 Vue/Tauri，见 §3.6 前端路线）。

### 3.2 DSH 真能替的（底座层，包名经本地代码复核——见 §2.2）

| DSH 包 | 实质 | LarryAgent 现状 | 接入收益 |
|---|---|---|---|
| `compaction/`（compaction-basic + tool-result-pruner）| 上下文压缩（Service Definition + provider）| 🚧 `max_input_tokens` 截断（**机制反向**）| 升 ✅（直接受益 2.9.2）|
| `sandbox/`（sandbox-local + sandbox-policy）| 进程隔离（bwrap/Landlock/Seatbelt）| 🚧 IP/目录/SSRF（**无分级无审批**）| 升 ✅（直接受益 2.7.1，**仅 Linux/macOS 侧成立**，见 §3.4）|
| `interaction/`（permission-presets）+ `credentials/` | approval/permission/ask-user + 凭据授权流 | ❌ 无 | 新增 ✅ |
| `session/` + `session-query/`（SQLite FTS）| 持久化 + 查询 | 🚧 ToolCallCard（仅工具名+结果）| 升 ✅（直接受益 2.8.2）|
| `llm/`（llm-deepseek 等 provider + llm-retry）| provider 适配器 | ✅ 配置切换（薄薄一层）| 升 ✅ |
| `mcp/`（mcp-client）| MCP 协议 | ❌ 无（TODO 🗣️）| 新增 ✅（直接受益 2.5.3）|
| `acp/` + `sdk/`（JSON-RPC server）| Agent Client Protocol + SDK | ❌ 无 | 新增 ✅（B/D 路径抓手 + 脱钩通道）|
| `jobs/` | 后台任务 | ❌ 无 | 新增 ✅ |
| `preset/`（agent-presets + persona）| per-session agent 组合（cordis.yml）| 部分（config 下发）| 角色机制迁移底座 |
| `feedback/` | 人类反馈捕获 | ❌ 无 | 新增 ✅ |
| `storage/`（storage-domain + storage-json）| Non-session 存储 hub + backends | ❌ 无 | 记忆双写的挂载候选（外接 SQLite 待实测）|
| `test-support/llm-replay` | snapshot replay 测试（真实会话录制 → 无 key 重放）| ❌ 无 | 测试范式升级（见 §3.6 阶段 6）|
| `e2b/` | 云沙箱（POC）| ❌ 无 | 远期候选 |


### 3.3 DSH 一概替不了的（产品差异化，A/C 都要自做）

| 能力 | DSH 现状（事实层） | 实质 |
|---|---|---|
| **用户画像** | `identity/` **存在**（本地确认），但语义为「one anonymous id per harness home… **without identifying the user**」——仅用于 telemetry / feedback / provider 请求关联，**无个人维度** | DSH 无用户画像概念，自做（**结论不变**，依据升级为本地实证）|
| **知识库** | DSH 内核无 BM25/FTS+向量混合检索；但**社区有现成实现**（Memory 分类 149 个：ReMe 自进化知识库 / dsh-tiddlywiki / eli-mode 知识库驱动预设）| **从"自做"降为"借鉴自实现"**（社区方案作**参考实现**：抄 schema / 检索组织思路，**不直装**；需验场景匹配：多为编码/项目知识库，非个人生活知识库）|
| **单人形态** | AGENTS.md **零论述** personal / private assistant | DSH 没有"私人助理"概念 |
| **云端部署** | AGENTS.md **零论述** cloud / multi-user / 租户；只有本地 `host/` + 本地 `client/` | DSH 内核无云端形态，但 **Remote & Mobile 分类 89 个插件**提供多端接入（飞书 bot / LAN access / auth tunnel / winrm）→ **"多端接入"可从自做降为选型**；云侧部署与租户隔离仍需自做 |
| **每会话文件沙盒**（2.3.3）| `sandbox/` 是权限沙箱 ≠ 每会话文件沙盒 | 不是 DSH 给的语义 |
| **回收站** | `session/` fork/resume ≠ 回收站（不同语义）| 不是 DSH 给的语义 |
| **长期记忆语义化** | DSH 内核 `session/` 是原始事件流水；但**社区插件高度成熟**（`dsh-memory-connect` = SQLite FTS5 + **bge-small-zh-v1.5 本地 embedding** + RRF 融合 + 时间上下文图 valid_from/valid_until/supersedes + 信任模型「召回历史按不可信参考注入」——**与 LarryAgent 现有技术栈与既有设计几乎同构**；另有 `dsh-auto-memory` 双轨检索、`dsh-project-memory` 可追溯引用、`Co-Engram` 原生 Cordis 38 工具）| **从"自做"降为"借鉴自实现"**（社区方案比现有实现更完整：**照其设计重写 / fork 后改造，不直装**——按 §3.0 硬约束）|

> **口径**：长期记忆语义化 / 知识库 / 云端多端接入 = **借鉴社区设计后自实现**（省设计试错，不省实现与维护）；用户画像 / 单人形态 / 每会话文件沙盒 / 回收站 = **完全自做**（DSH 与社区均无对应语义）。

### 3.4 DSH 自身风险（事实校准后）

| 风险 | 事实 | 应对 |
|---|---|---|
| **已知性能回退 + pre-stable API** | 最新 release 官宣性能回退（下一版本修复）；AGENTS.md「Public APIs are pre-stable; update every consumer」——破坏性变更常态化 | 升级 SOP 见下；**性能回退修复为升级首触发条件** |
| ~~**Windows 非一等平台**~~ → **已推翻** | 本地确认 `packages/sandbox/sandbox-windows-acl/` **存在**；README 明示 Windows 后端 = **restricted token**，另有 2026-08-08 决策记录（选 raw ACL restricted token 而非 mxc / AppContainer）；`sandbox-local/` 三平台后端并列（Linux bwrap→Landlock / macOS Seatbelt / **Windows restricted token**）| 风险**下调**：Windows 有一等写入限制后端（三档策略 + 用户批准的一次性提权）。仍待阶段 2 在本机**实测** restricted token 实际生效性；未实测前不升 ✅ |
| **沙箱为同世界隔离**（新增）| `sandbox/` README 原文：「Confinement is **same-world only**: it shares the host kernel and filesystem」——非容器 / microVM 级 | 接受该上限：防误操作 / 防越权写入，**不防恶意代码**；与 `SAFETY.md`「do not guarantee isolation」一致 |
| **上游集中度** | DSH 是 DeepSeek 单一厂商对 harness 形态的主张，与同类（Claude Code / Codex CLI / Cursor）哲学各异；换底座 = 运行时框架层不可换（与模型层"多服务商可换"哲学方向相反）| **保留 sdk / acp profile 接入面作为脱钩通道**——DSH 走偏时核心逻辑可退到独立进程，DSH 只剩协议层；MIT + TS 保证最坏可 fork 自维护 |
| **项目长期可持续** | 高频 commits / 仍在合并 PR / DeepSeek = 行业第一梯队；`SAFETY.md` 明示**尚未接受安全审计，沙箱不能保证隔离** | 有积极信号但未到稳定预期；定期跟踪 |
| **方向不对齐** | DSH 全栈编码向（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`），LarryAgent 单人私人助理 | 长期需自做产品差异化（7 项见 §3.3）|
| **跨语言切换** | DSH = TypeScript，LarryAgent 后端 = Python FastAPI | A 路径下后端整体改 TS；保留部分 Python 脚本（数据迁移等）。⚠️ 若走 Python SDK 路径（§3.5）则**后端骨架零改**——Python 保留，经 stdio JSON-RPC 驱动打包运行时。**【老大裁定】跨语言成本是本项目的「最小成本」，决策时完全可忽略——不得再以"跨语言成本高"为由否决任何路径** |
| **生态繁荣但质量参差**（**前判"生态早期"已推翻**，见 §2 插件生态行）| 3,199 插件 / 25 分类，但 UI·主题类占 640+（大量玩具）；个人作者为主，弃坑风险高 | **只借鉴、不直装（§3.0）**——生态价值定位为**参考实现库**：读源码抄设计、必要时 fork 自改；**不把任何关键能力押在外部作者的维护意愿上**。临时验证只在隔离环境装，不进产品依赖。补充（老大）：3,199 这个数字本身也可能含代理行为与跟风件，**不可作为"有人维护"的证据** |
| **插件版本漂移** | DSH preview 期 API 频繁变动，插件作者跟不上（已有插件标注 "verified against DSH 0.1.0-rc.6"，而锁定版为 `0.1.2-rc.1`）| 因 §3.0 **不直装**，本风险对**产品运行时不成立**（我们不依赖插件跟上 DSH）；仅影响**参考时效**——借鉴时标注其验证版本，fork 代码须按锁定版 `0.1.2-rc.1` 重验 API。DSH 升级时**不产生插件兼容性回归项** |
| **第三方插件安全** | SAFETY.md 明示：沙箱、审批与权限控制**不能保证隔离**（未接受安全审计）| 第三方插件视为**不可信代码**。**§3.0 后本风险大幅下降**：不直装 = 第三方代码不进运行时；借鉴 / fork 路径下源码必经审读，凭据 / 文件 / 网络相关部分按最小权限重写。**缺口（Qoder 二点，采纳）**：不直装 = 失去上游自动补丁通道 → 须补 **upstream 追踪与 CVE 响应流程**（见 §3.7）|
| **会话存储外接**（原 §九 保留项）| `storage/` 是 Non-session storage hub + backends，但具体能否外挂 SQLite 未确认 | 阶段 2 环境准备时实测 |
| **headless + ACP 契约**（原 §九 保留项）| `acp/` 描述"Automation-only Agent Client Protocol server"，契约稳定性需实测 | 阶段 2 环境准备时实测 |

**升级 SOP**（取代原"锁版本不升不降"——该表述与立论③"随 DSH 演进"自相矛盾，第 1 轮 Trae/Qoder/Marvis 三方一致指出）：

- **节拍**：跟随 release tag（不跟 master HEAD），**待老大拍板**（激进选项见 §3.7）
- **首触发条件**：下一版本确认修复性能回退 + 破坏性变更窗口消化（**不是**"有新能力才升"）
- **每次升级必跑**：`test-support/llm-replay` 快照回归 + P4 测试矩阵，任一红即回退上一 tag
- **锁定期成本承认**：锁定期内 alpha bug 由本项目背，不指望上游修

### 3.5 路径决策

| 路径 | 决策 | 理由 |
|---|---|---|
| **A 换底座** | **✅ 拍板** | 底座能力开箱（8 子项直接承接）+ 免自造底座 + 演进红利；项目小 + 专属能力薄；能力建设 / 信息流接入层面 A 长期赢；**另加生态红利——但按 §3.0 定性为「设计红利」**：3,199 插件是可查阅的**参考实现库**（省试错与设计：schema / 检索策略 / 时间上下文建模 / 信任模型可直接借鉴），**不是可直装的能力货架**（不省实现、不省维护）|
| B 嵌一层 | ❌ 不推荐 | 与 A 重叠大半收益，但跨语言通信 + 双套状态同步复杂度高一档 |
| C 借思路 | ⚠️ 备选（**仅适用**等 DSH GA / 不绑 preview 风险）| prototype 可短期升级三个 🚧，但与 DSH 演进的 drift 成本长期无法消除 |
| D 接能力 | ❌ 不推荐 | A 已满足当前诉求；D 仅在"想要 DSH 独家能力"时启用 |

> **⚠️ 新发现（2026-09-07，动摇 A 的一个核心成本项，待老大拍板）**
>
> 官方同时提供 **`@deepseek-ai/dsh`（npm）** 与 **`deepseek-harness-sdk` + `deepseek-harness-runtime-bin`（PyPI）**，后者**把 `dsh` 与整个 Node 依赖树打包成原生可执行文件、无需系统 Node.js**，且**有 Windows x64 wheel**。Python 后端经 stdio JSON-RPC 驱动打包的 `dsh --profile sdk` 子进程即可获得 DSH 能力（out-of-process）。
>
> 若成立，则 §3.4「跨语言切换」风险对**后端骨架**而言归零——现有 8,830 行 Python 保留，且**不经 git 源码**（`pip install` 即可，无 Windows checkout 问题）。⚠️ **口径收紧（Marvis 四点，采纳）**：归零的是**后端骨架**，**不是产品语义层**——第三方源码级分析（🟡，master 线，锁定版须本地复核）指出插件（Cordis 服务）装载在 DSH 运行时内，`--profile sdk` 是完整 JSON-RPC server、Python SDK 只是客户端，**23 项自做的语义层大概率仍须以 TS / Cordis 插件形态挂载**。故本提示框不再写"跨语言成本归零"，改为「**骨架零改、语义层是否 TS 化待第 0 项实测**」。
>
> **尚未实测**：能力边界（长期记忆 / 角色 / 工具挂载如何通过 SDK 暴露）、Windows 下实际可用性、性能开销。**列为阶段 2 必测项**（§3.7）。未实测前 A 拍板不变。
>
> **路径内部分岔：A-framework vs A-service（Qoder 一点，采纳）**：
>
> | 维度 | A-framework（全量 TS 化）| A-service（Python SDK）|
> |---|---|---|
> | DSH 角色 | **框架**：LarryAgent = 一个 preset / plugin 组合 | **服务**：LarryAgent = Python 应用，DSH = 外部子进程 |
> | 立论③「随 DSH 演进」| **完全兑现**（含架构演进）| **部分兑现**（只拿 SDK 暴露的能力）|
> | 上游集中度（§3.4）| 高（运行时框架层不可换）| 中（JSON-RPC 标准协议，最坏可换实现）|
> | 双轨并行 / 回退成本 | 中 | **低**（切换 = 改子进程启动参数）|
> | 测试资产 | 重建 | **保留 + 增补边界契约层**（Claude 一点）|
>
> **【老大裁定 · 决定性】**：若实测确认 **Python SDK 相当于"某种意义上的二等公民"**（能力、能力演进或一等支持度明显弱于原生 TS 路径），则**强烈偏向全面迁移到更贴近 DSH 核心层的技术栈——包括语言，且不限于语言**。即：本分岔不由"省多少成本"决定，而由**"是不是一等公民"**决定；**二等公民路径即便省成本也不取**。故阶段 2 第 0 项实测（§3.7）除"能否跑通"外，**必须判定一等 / 二等公民身份**。

### 3.6 A 路径实施规划

**总思路**：LarryAgent 后端从 Python 切换到 TypeScript + DSH 框架。**意味着**：现有后端核心非测试代码（~3.7–4.4k 行，统计口径见 §3.7 备注）翻译为 DSH 插件/服务形式。**保留**：SQLite schema、SQLite 双写（作为 DSH 插件挂载）、业务核心逻辑（角色 config、工具实现）。

**双轨并行（迁移期可用性保障）**：旧 Python 后端在阶段 6 验收通过前**保持可用、可回退**，阶段 6「功能等价」通过后才切换——迁移期间老大作为用户不失去 LarryAgent（产品树口径「已做 = 用户可达」）。

**时序纪律（Claude 四点 / Qoder 三点，采纳；老大裁定修正）**：当前是「代码体量小 + 数据体量小」的**双重窗口**（`backend/data/chroma/larry_memories` count = 0）。Qoder 主张把「记忆 schema 定稿」设为阶段 3/4 派发**硬门禁**，理由是窗口关闭是非线性的（活数据不能停机 + 兼容层 + 双索引）。**老大裁定**：**schema 是否为 0 不影响迁移决策**（当前远未正式使用，全部为测试数据，需要时直接启用新的即可，不存在数据迁移的技术难度或成本）。故本稿口径为：**记忆 schema 应尽早定稿（成本最低），但定稿是「优化项」不是「阻塞项」，不构成迁移门禁**。**【老大二次裁定】由于不存在真实数据，记忆 schema 不作为阶段 4 门禁；若判定存在技术面分歧或风险，用测试数据验证即可**（Marvis 曾引 arXiv:2603.01209 主张设硬门禁，核验为「论文真实但场景错配」——研究对象是自微调模型的 interpreter 变量持久化，与本项目不符。）

**迁移必关清单（Marvis 四点，采纳——承接总表的负向补充）**：承接总表只回答"DSH 承接什么"，本清单回答"DSH 给了什么我们必须关掉"，随阶段 4 一并验收：

| 项 | 风险 | **本地实证（🟢 锁定版核实）** | 处置 |
|---|---|---|---|
| **Self-modification**（`extensions/` 的 `cordis_*` 工具，agent 自我修改插件图）| 与 2.7.2「边界交用户决策」、2.7.5「知情」相反——单人助理不允许 AI 改自己的运行时 | `packages/extensions/` 存在（含 `cordis-client-runner/`）；README.zh 明写：**定义只存于进程内存，DSH 重启即清空，不写仓库文件、不改任何配置** → **持久化风险不存在，风险等级由「高」降为「中」**（进程内运行时自我变更）| **默认禁用**，最多留 audit 钩子 |
| **`cordis.yml` / preset 的 `!!js` 配置即代码执行** | 配置从"数据"变"代码面"，动摇 2.7.3「key 只走配置不入库」的凭据威胁模型 | 锁定版 `.agents/notes/` 开发笔记明写 "**booting evaluates `!!js` expressions**"（启动时真的求值 JS 表达式，`dsh-app-boot` 曾重复实现该 YAML type）→ **风险成立，非推测** | 迁移后评估**禁用或限用**，凭据表述按新模型重写 |

**前端路线（阶段 2 定死）**：**保留 Vue/Tauri 客户端，走 sdk / acp profile 对接，不采用 DSH Web-GUI**——Tauri 壳是 2.10.2 端侧执行器的宿主，换 web client 等于废掉 client/ 全部工作并丢掉端侧能力载体。

**测试资产是独立工作包，不是阶段 6 附赠项**：现有 pytest 测试 ~4.4k 行，与核心代码 1:1；测试基建（conftest 临时库隔离 / 真实库 fail-fast / `--real-api` 占位符机制）不可平移，需在阶段 2 按 Vitest + DSH 生态重做隔离设计——不提前设计，阶段 3 起每步验证都裸奔。

#### 阶段 1：事实校准 — 部分已完成

- ✅ DSH 主仓 packages/ 盘点——**本地实测锁定版顶层 50 个包目录**（另有嵌套子包）。早期"54 个包"/"37 家族 / 72 嵌套包"口径均**作废**（前者为网页推断，后者为 config-catalog 配置项口径）
- ✅ AGENTS.md 阅读（capability seam / session JSONL / LLM provider / 安全性声明）
- ✅ releases 阅读（版本线 / 性能回退官宣 / 无 GA 时间表）
- ⏳ 锁定跟踪 tag（当前 release 线 `0.1.2-rc.1`）

**退出条件**：任务全部完成。

#### 阶段 2：代码克隆 + 环境准备

- ✅ **任务**：clone DSH 主仓到 **`ref/dsh-bare/`**（项目根独立目录，`.gitignore` 排除、**不入 git**）——**已完成**，锁定 `dsh-v0.1.2-rc.1`（裸仓库按 tag 直读，无工作区）。查阅方式见 §2.2
- **任务**：搭建 TypeScript 后端骨架（pnpm + tsconfig + 基础插件）
- **任务**：跑通官方 demo（确认环境）
- **任务**：**Vue/Tauri → dsh sdk profile 连通 hello world**（交付通道前提）
- **任务**：测试隔离基建设计（Vitest 临时库隔离 / 真实库 fail-fast / 占位符注入的等价物）

**退出条件（5 项实测，任一不过则阶段 3 收益表重估、C 路径回退进入议程）**：
1. `storage/` 外接 SQLite 可行性
2. `acp/` 契约稳定性
3. **Windows 端 `ctx.sandbox` provider 可用性**（2.10.2 端侧执行器前提）
4. Vue/Tauri → sdk profile 连通
5. **TS 跑通 bge-small-zh 本地 embedding，与 Python 侧同文本向量漂移比对**（重嵌策略依据）

#### 阶段 3：核心能力 prototype

- **任务**：把 `compaction/` 接入（替代 `max_input_tokens` 截断）— 直接受益 2.9.2
- **任务**：把 `sandbox/` 接入（替代 IP/目录/SSRF 单一拦截）— 直接受益 2.7.1（Linux 侧）
- **任务**：把 `interaction/` 接入（新增高危工具审批流）— 直接受益 2.7.1
- **任务**：把 `session/` 接入（升级 trajectory）— 直接受益 2.8.2

**退出条件**：**核心链路（会话 + 记忆 + 工具）在 DSH 下达到 P4 等价**（不是"四个包跑通"——无交付通道的跑通不算）。

#### 阶段 4：差异化能力迁移

**排序原则（用户感知层优先）**：用户强感知的差异化项（记忆 / 画像 / 知识库）排在开发者红利项（trajectory / compaction 精细策略）之前——避免"接 DSH 送的能力很爽"挤占真正让 LarryAgent 是 LarryAgent 的部分。

| 任务 | 原 Python 模块 | DSH 实现路径 |
|---|---|---|
| 长期记忆双写 + 人审 | `memory/archiver.py` 223 行 + `engine.py` 107 行 | 自做插件挂载 `session/` 事件流；保留 SQLite+ChromaDB 双写 |
| **记忆迁移（活资产，非数据搬运）** | 全量 memories + 向量 | **全量重嵌**（PyTorch/FP32 与 ONNX/q8 向量不保证逐维一致，不可假设跨运行时可比）+ 同文本向量漂移比对 + 召回等价性抽样验收（迁移前后同组 query 的 top-k 一致性达阈值）+ 语义字段不降级（`is_active` / `last_hit_at` / `source_role` 一个不能丢，ChromaDB 只能重灌、机会只有一次）|
| 用户画像 | 📐（TODO 长期项）| 自做插件；DSH 身份语义待核（见 §3.3）|
| 知识库 | 📐（2.4.6 三层递进）| 自做插件；BM25/FTS+向量混合检索 |
| 角色机制 | `config.yaml` + 5 角色 system_prompt | 用 `preset/`（agent-presets + persona）+ `cordis.yml` 配置 |
| 工具生态 | `tools/` 844 行（shell/file_ops/web_search）| 翻译为 DSH 工具插件；**web_search 暂保留自实现 Brave**（DSH 搜索/抓取包归属待核，且须保留首版范围边界——不配正文抓取，SSRF/清洗成本是刻意规避的）|
| 回收站 / 每会话文件沙盒 | 🚧（2.3.1 / 2.3.3）| 自做插件；DSH `sandbox/` 语义不同需自定义 |

**附带裁定**：历史会话（messages 表）与 DSH session（JSONL 事件流）**不同构，不进 DSH session 格式**——只读留存或一次性转换脚本；**旧会话只是历史，记忆才是活资产**，转换优先级记忆 > 会话。

**退出条件**：现有 LarryAgent 能力在 DSH 框架下全部跑通（功能等价 / 不丢失 P4 已通过项；勾对基准见下方承接总表）。

#### 阶段 5：形态适配

- **任务**：本地 `host/` → 上云 server（原 2.10.1 云端部署 📐）
- **任务**：客户端 Tauri 适配（保留 PC 端 C/S 架构 + 本地 file_ops / shell 能力下沉）
- **任务**：移动端 B/S 适配（原 2.10.2 端侧能力 📐）

**退出条件**：云端部署可用、移动端可访问。

#### 阶段 6：测试 + 验收（按 DSH 四层测试体系重建，非"翻译"）

测试策略从"平移"改为"重建升级"：DSH 测试哲学是 **Real implementation over mock**（mock 只留非确定性边界），`test-support/llm-replay` 的 snapshot replay（录真实会话 → 无 key 重放）**取代而非翻译**我们的 mock-LLM 层。

| 我们的测试层 | 迁移方向 |
|---|---|
| mock LLM 单测 | **不翻译** → snapshot record → replay（比手写 mock 更真且免费回归）|
| `--real-api` 集成冒烟 | 平移升级（DSH `test:e2e` 原生同语义：真实 key 自跳过）|
| 降级/异常/护栏单测（纯逻辑）| 翻译（Vitest，约五成可平移）|
| conftest 隔离 / fail-fast 断言 | 阶段 2 重做（不可省）|
| 前端 Vitest | 平移保留 |

**验收五层**：① 纯逻辑层翻译全绿；② 关键路径 snapshot replay 覆盖（chat 主链路 / 工具调用 / 归档提取）；③ 真实 API e2e 冒烟；④ 数据迁移验证（双写 + 全量重嵌后召回抽样比对）；⑤ Windows 端侧执行器验收（若走 2.10.2，与阶段 2 实测项③同源）。

- **任务**：WB 复验 + 老大最终验收（勾对承接总表）

#### 31 子项承接总表（阶段 4 验收基准）

> 依 `../docs/product-positioning.md` 定稿版逐项对照。**开箱白给 8 项（DSH 直接承接）/ 其余 23 项自做或待定**——§3.1 口径的落点。

| 子项 | 迁移后承接方 | 说明 |
|---|---|---|
| 2.3.1 会话生命周期（回收站）| 自做插件 | DSH fork/resume ≠ 回收站 |
| 2.3.2 对话体验（SSE/停止）| 前端口径自定 | 保留 Vue/Tauri 侧 |
| 2.3.3 会话级作用域（沙盒）| 自做插件 | DSH sandbox ≠ 会话文件沙盒 |
| 2.3.4 多模态 🗣️ | 迁移后仍待定 | 产品层未定案 |
| 2.3.5 主动触达 🗣️ | 自做为主 | DSH `webhook/`（待核）可作外部触发抓手；**新增可借鉴触发骨架**：`packages/goal` + `packages/schedule` + `packages/jobs` 三原语**锁定版实测存在**（🟢 `git ls-tree dsh-v0.1.2-rc.1 packages/`），可作主动触达与 2.4.4 记忆保鲜定期调度的设计参考（§3.0：只借鉴不直装）|
| 2.4.1 短期记忆 | **DSH session + compaction 承接** | 截断机制被 compaction 取代 |
| 2.4.2 长期记忆双写+人审 | 自做插件 | 挂 session 事件流，保双写 |
| 2.4.3 记忆可管理 | 自做 | 硬删语义产品层已裁定 |
| 2.4.4 记忆保鲜 | 自做 | supersede + 状态标签（产品树结论）|
| 2.4.5 用户画像 | 自做 | DSH 无画像概念 |
| 2.4.6 知识库 | 自做 | 三层递进（产品树结论）|
| 2.5.1 多模型切换 | **DSH `llm/` 替换** | 开箱即得 |
| 2.5.2 工具挂载 | **DSH 工具管道替换** | shell/file_ops 翻 TS 插件 |
| 2.5.3 扩展性/MCP | **DSH `mcp/` 新增** | 开箱即得 |
| 2.6.1 角色切换 | DSH `preset/` 迁移底座 | cordis.yml 承接 config 角色 |
| 2.6.2 自动路由 | 自做/待定 | 产品树仍 📐 |
| 2.7.1 行为安全 | DSH sandbox 升级 | 三平台后端**均存在**（Windows = restricted token）；待阶段 2 本机实测后升 ✅（上限：同世界隔离）|
| 2.7.2 边界透明 | **DSH interaction 承接** | approval/ask-user 开箱 |
| 2.7.3 凭据密钥 | **DSH credentials 承接** | 开箱即得 |
| 2.7.4 成本约束 | 自做 | DSH 无预算/限额概念 |
| 2.7.5 数据主权出境 | 自评估 | DSH 不改变出境事实 |
| 2.7.6 数据可恢复迁移 | 自做 | 备份/导出 |
| 2.8.1 沉淀信息可见 | 自做 | 记忆浏览器远期 |
| 2.8.2 AI 行为可见 | **DSH trajectory 升级** | session-query SQLite FTS 开箱 |
| 2.8.3 资源消耗可见 | 自做 | 与 2.7.4 同底座 |
| 2.9.1 时间感知 | 自做 | 时间专题讨论稿 |
| 2.9.2 超长会话一致性 | **DSH compaction 承接** | 机制反向问题获解 |
| 2.9.3 降级韧性 | 部分 DSH + 自做 | llm-retry/guard 可承接；LarryException 统一出口自做 |
| 2.10.1 云端部署 | DSH host 上云 + 自做适配 | — |
| 2.10.2 端侧能力 | 自做下沉 | Windows 沙箱后端**已确认存在**；待阶段 2 实测（同世界隔离为已知上限，非阻塞项）|
| 2.10.3 单人单实例 | 形态事实 | DSH 无关 |

#### 风险与退出条件

- 阶段 2 五项实测任一不过 → 阶段 3 收益表重估，C 路径回退进入议程
- 阶段 3 核心链路未达 P4 等价 → 回退旧后端（双轨保障，旧后端全程可用）
- 阶段 4 任一项差异化能力卡死 → **单独延后，不阻塞主线**（DSH 框架先落地，差异化能力分批做）
- DSH 发布破坏性变更 → 按升级 SOP（§3.4）：跟 release tag，升级必跑 replay + P4，任一红回退
- 方向不对齐长期化 → §3.3 的 7 项差异化能力同步排进 P 队列

### 3.7 待办

**待老大拍板**：
- [ ] **⚠️ 新发现：Python SDK 路径是否取代 A**（见 §3.5 提示框）——若 `pip install deepseek-harness-sdk` + runtime-bin 可用，则**后端无需改 TS**、跨语言成本归零。**需先实测再定**
- [ ] **升级 SOP 节拍**：跟 release tag（保守）vs 跟 master HEAD（激进）——二选一写死。**【四方一致推荐，待老大拍板】release tag + 事件触发**（Qoder 四点 / Marvis 五点 / Claude 支持 / Trae 未反对）：理由 ① 最新 release 已官宣性能回退、master 波动有实锤；② 老大已定调"演进红利不在一时"；③ §3.0 对外部不可控波动的低容忍度，与跟 HEAD 哲学不一致。**例外**（Qoder）：若第 0 项确认走 A-framework 且 DSH 有明确 GA 时间表，可在 GA 前约 6 个月切 HEAD；若走 A-service 则**永久 release tag 节拍**（SDK 接口层比架构层稳定）。**产品向补充门禁**（Marvis）：凡影响 31 子项产品承诺（用户可达档位）的 DSH 变更，同样触发升级评估
- [ ] **阶段 3 prototype 派发**：Trae / Claude 分工与节奏
- [ ] **阶段 4 差异化能力优先级**：哪些先做、哪些等（承接总表已给出"用户感知优先"初排，可否决）

**待校准（阶段 2 实测，见 §3.6）**：

- [ ] **【第 0 项 · 最高优先 · 优先于下列全部】plugin mount 路径 + 一等/二等公民判定**（**老大裁定其为分岔判据**）：
  - ① 我们的自做插件（记忆双写 / 角色 preset / 工具）是**挂在 DSH 子进程内（须写 TS 插件）**，还是**经 JSON-RPC 挂在 Python 侧**（SDK 是否支持 remote plugin mount）？
  - ② **一等 / 二等公民判定**：Python SDK 路径在「能力覆盖 / 能力演进跟随 / 官方支持度 / 文档与示例完整度」四项上，是否明显弱于原生 TS 路径？
  - **判据后果**：① 决定 A 落地形态（A-framework vs A-service）、阶段 6 测试策略、embedding 是否需迁 TS；② 若为二等公民 → **按老大裁定直接走全面 TS 化**，不再考虑省成本
  - ✅ **验收标准（Marvis 一点，补）**：**31 子项产品承诺档位不降、用户可达**（2.4.2 双写 / 2.4.4 保鲜 / 2.4.5 画像 / 2.6.1 角色 / 2.7.x 边界 / 2.8.2 可见 / 2.9.2 保真 / 2.10.2 端侧 等）——**比"技术链路跑通"更贴近产品树「已做 = 用户可达」口径**，路径之争（全量 TS 化 vs 部分 TS 化）不改变本条
  - 命令起点：`pip install deepseek-harness-sdk deepseek-harness-runtime-bin` → Windows x64 下启动 `dsh --profile sdk` 子进程 → 验 JSON-RPC 连通、能力暴露边界、**是否真无需系统 Node.js**、进程开销
- [ ] `storage/` 外接 SQLite 可行性
- [ ] `acp/` 契约稳定性
- [ ] Windows 端 `ctx.sandbox` provider **本机实测**——后端已确认存在（restricted token + `sandbox-windows-acl/`），待验**实际生效性**与提权流程
- [ ] Vue/Tauri → sdk profile 连通
- [ ] TS bge-small-zh embedding 与 Python 侧向量漂移比对

**待核（包归属定位，不阻塞拍板）**：
- [ ] **插件生态借鉴清单**（对应 §3.3 降级的 3 项，**按 §3.0 只借鉴、不直装**）：Memory 分类 149 个中筛 3–5 个候选（重点 `dsh-memory-connect` / `dsh-auto-memory` / `dsh-project-memory` / ReMe），产出**可借鉴点清单**（schema 设计 / 检索融合 / 时间上下文建模 / 信任模型 / 已知陷阱），**不是"选哪个装"**；知识库与多端接入同理。评估维度改为 **设计可参考性 + 代码可读性 + 与本项目语义贴合度 + fork 改造量**；**删除**"作者维护活跃度 / 最近更新"维度（我们不再依赖其维护，仅作参考时效性标注）
- [ ] **借鉴 / fork 代码纳入规范**（§3.0 配套，待老大定）：进库位置（独立 `vendor/` 目录 or 按能力模块落地）、upstream 出处与 license 标注格式（保留原声明）、改造后须过本项目测试与命名规范、与自研代码的边界标识
- [ ] **upstream 追踪与 CVE 响应流程**（§3.0 的隐性代价：不直装 = 失去上游自动补丁通道）：上游 CVE 如何得知（GitHub security advisory / OSV.dev / release notes 订阅？）→ 如何评估是否 backport → **上游弃坑但 CVE 未修时如何自补**（这正是老大立论"跟风项目无人维护"的兑现场景）
- [ ] **借鉴调研的取样原则**：不逐个深评单个插件（面对的是几千甚至上万插件），产出**「设计差异表」**（Trae 三点）+「**对方如何验证该设计**」列（Claude 五点：有测试说明设计可验证可抄，无测试则借鉴时须自补验证方案）+「改造后需补哪些测试」清单；**目标是提炼可复用的设计模式，不是给某个插件下价值判断**
- [ ] **§3.0 是否升格为项目级原则**（写入 `docs/ai-governance.md`，待老大定）：第三方引入原则是否作为跨阶段通用约束。
- [ ] **来源标注体系（🟢/🟡/🔴）升格**：任何 AI 对外部项目做事实断言须标证据等级，🔴 不入结论区、不作否定性判定的唯一依据。**此条有实证基础**（本地实证曾推翻虚焊误判），不是猜测推导，故保留候选
- [ ] DSH 搜索/抓取能力归属（原"`web/` 替换 Brave"证据不足，web_search 暂保留自实现）
- [ ] `webhook/` 包核实（config-catalog 无条目 vs 主仓搜索命中，两源冲突）

**待执行（启动信号是本节）**：
- [ ] 跑通官方 demo（确认环境）

**体量口径备注**：后端核心非测试代码行数存在三个统计口径（Trae 3653 行/36 文件、Claude 4442 行、WB 3926 行——差异在根文件与目录统计口径），量级一致（个人级小项目），精确口径由阶段 1 收口。

---

> **历史决策过程不再保留于本稿**（C→A 反转、两段式重构、四方意见逐条处理、§2.3 撤回等）：有价值的结论已全部凝结进结论区，过程与教训见 git 历史与 `.workbuddy/memory/`（「证据纪律」§十一）。

# 讨论区

## 第 3 轮派发（WB，2026-09-07）

**文档状态**：结论区含 **§1.5 押注主体依据**、**§3.0 第三方引入原则**、**§3.5 A-framework vs A-service 分岔 + 老大「二等公民」裁定**、**§3.6 时序纪律 + 迁移必关清单**、**§3.7 阶段 2 第 0 项**。本稿已按「只留结论、砍过程」精简（变更记录与决策追溯两章已删，过程见 git 历史与 `.workbuddy/memory/`）。四方请**只读结论区 §1/§2/§3 + 本派发块**。

**共同题（四方都答）**

1. **挑错**：结论区有无**事实错误或自相矛盾**？重点看本轮新增/改写处：§3.4 三行（质量参差 / 版本漂移 / 第三方安全）、§3.5 分岔表与"二等公民"裁定、§3.6 时序纪律与必关清单、§3.7 第 0 项。
2. **本题最想要**：**"押注 DSH"的真正理由是什么？** 请各自给出**不依赖社区热度数字**的论据（代码 / 协议 / 许可证 / 官方分发 / 能力实证），或指出"如果去掉热度因素，这个决策还站得住吗、缺什么"。

**Trae（实现方）**

1. **阶段 2 第 0 项的可执行验证方案**：plugin mount 路径（挂 DSH 子进程内 vs 经 JSON-RPC 挂 Python 侧）+ **一等 / 二等公民判定**（能力覆盖 / 演进跟随 / 官方支持度 / 文档示例完整度）。请给出具体命令与要读的本地源码路径（`ref/dsh-bare/` 可读：`python/` SDK、`packages/sdk/`、`packages/extensions/`）。本地副本用法见 §2.2。
2. 若判定走 A-framework（全面贴近核心层，含语言）：**阶段 3 prototype 的最小可验证切片**是什么？

**Claude（测试方）**

1. 第 0 项两种结果下的测试策略（混合栈 vs 全 pytest + 边界契约层）——请给出**边界契约层须覆盖的失败模式清单**（协议错误 / 超时 / 子进程崩溃 / 状态不一致 / 升级后契约漂移）。
2. 升级 SOP「每次升级必跑 `llm-replay` + P4 矩阵」在**无 GA、2.3 天一个 tag** 的节奏下是否可执行？要不要改为「事件触发 + 季度评审」？

**Marvis（产品方）**

1. **用户视角**：底层换成 DSH，对用户体验是加分、中性、还是负分（"套壳"观感风险）？
2. 「迁移必关清单」除 self-modification 与 `!!js` 外，还有哪些 DSH 默认能力按产品哲学**必须关掉或改写**？
3. 去掉热度数字后，「押注 DSH」还剩哪些**站得住的理由**？从产品承诺兑现角度，你最担心的又是什么？

**Qoder（编外复核）**

1. **复核本稿的"决策依据"是否干净**：结论区里有没有**证据等级被说话人身份抬高**的条目（即：因为是老大说的 / 因为是权威源说的，就进了结论区的未验证内容）？请做一次独立排查。
2. §3.5 老大裁定「SDK 若二等公民 → 全面贴近核心层（含语言）」在**执行层的真实代价**评估——23 项语义层全量贴近核心层，工作量与风险有没有被低估？

> **纪律**：本轮表态请直接写在本讨论区各自小节下（标"第 3 轮表态"），并同步写一句到各自 `exchange/log-*.md`。**事实性断言请标 🟢/🟡/🔴**，🔴 不得作为否定性判定的唯一依据。

## 老大

- 由于不存在真实数据，记忆schema不作为阶段4门禁，若判定存在技术面分歧或风险，使用测试数据验证即可

## Trae


## Claude


## Claude

**第 3 轮表态（2026-09-07，测试方）**

### 共同题 1 · 挑错

结论区整体扎实（§1.5 信念层定性、§3.4 三行、§3.5 分岔表、§3.6 时序纪律、§3.7 第 0 项均无事实错误）。发现 **1 处口径未统一（轻微自相矛盾）**：

- **§3.6「测试资产是独立工作包」段写"测试基建（conftest 临时库隔离 / fail-fast / 占位符机制）**不可平移**，需在阶段 2 按 Vitest + DSH 生态**重做**隔离设计"——这是**全 TS 路径（A-framework）的口径**；
- 但 §3.5 分岔表 A-service 行写"测试资产：**保留** + 增补边界契约层"——这是 **Python SDK 路径的口径**。

两句都写成定论，实际都**依赖第 0 项结果**。建议统一为："测试资产处置（重建 vs 保留+增补）待第 0 项判定后定稿"——与 §3.7 判据后果"决定阶段 6 测试策略"对齐，避免阶段 6 派发时执行人读到两个互相矛盾的"已定口径"。

### Claude 题 1 · 边界契约层失败模式清单（A-service 路径）

若第 0 项判定 A-service，Python 侧 ↔ dsh 子进程的 JSON-RPC 边界是新引入的**唯一全新故障面**。契约层测试须覆盖（按严重度排序）：

| # | 类别 | 失败模式 | 契约层测试 |
|---|---|---|---|
| 1 | **子进程生命周期** | 启动失败 / 启动超时 / 运行中崩溃（SIGKILL、退出码非零）/ 僵尸进程残留 | 启动-崩溃-自动重启循环测试；重启后会话状态是否可恢复（resume 语义）；崩溃时 in-flight 请求的失败形态（挂起 vs 报错）|
| 2 | **协议层** | JSON-RPC 版本不匹配 / 方法不存在 / 参数类型错误 / 响应缺字段 | 契约快照：record 真实请求-响应对，升级后 diff（与 llm-replay 同思路，用于 RPC 层）；错误码 → LarryAgent 统一异常出口（LarryException）的映射测试 |
| 3 | **超时与取消** | 长调用（LLM 流式）超时语义 / abort 是否透传到子进程 / 半途取消后的子进程状态 | 超时上限单测 + 取消后子进程无泄漏（进程数断言）|
| 4 | **状态一致性（最危险）** | 双写场景（SQLite 在 Python 侧、session 事件流在 DSH 侧）崩溃时**哪边先写** / 重试幂等（不重复写入）/ 会话 ID 双向映射错位 | 注入崩溃点（kill 子进程于写操作中段）→ 重启后两边状态收敛断言；重放同一请求两次 → 无双写 |
| 5 | **升级后契约漂移** | DSH 升级后 RPC schema / 能力面变化（与 §3.4 pre-stable API 常态化一致）| RPC 契约快照 diff 作为升级回归的必跑项（无 key、秒级）|
| 6 | **资源与安全** | 子进程句柄/内存泄漏（长会话累积）/ key 经 RPC 层泄漏到日志 / 传输内容注入 | 凭据边界测试（key 只走 Python 侧 config，断言不出现在 RPC 日志）；长跑进程数/句柄数稳定断言 |

**这些失败模式全部属于 mock 覆盖不到清单**（进程级资源，我 CLAUDE.md 测试分层原则已列）——契约层是集成冒烟的新增面，不是单测能替代的。

### Claude 题 2 · 升级 SOP 可执行性

**结论：§3.7 已倾向的「release tag + 事件触发」方向正确，"每次升级必跑 llm-replay + P4 全矩阵"在 2.3 天一 tag 节奏下不可执行，需拆分**：

| 升级动作 | 每次升级（2.3 天）| 事件触发 / 季度评审 |
|---|---|---|
| RPC 契约快照 diff + llm-replay 快照回归 | ✅ **可跑**（无 key、秒级、廉价）| — |
| P4 全矩阵（含 --real-api 有 key 项）| ❌ **不现实**（每次升级跑一遍 = 每 2.3 天烧一次 key + 全量时间）| ✅ 仅在：性能回退修复版 / 破坏性变更窗口 / 季度评审 |
| 纯逻辑单测子集 | ✅ 可跑（随 CI）| — |

建议 SOP 落为三层：**每次升级 = RPC diff + replay 快照**（廉价哨兵）；**事件触发 = P4 全矩阵 + 真实验收**（性能回退修复 / 破坏性变更 / 影响 31 子项承诺的变更，Marvis 门禁）；**季度 = 完整评审**（GA 进展 / 生态 / 是否切 HEAD）。"任一红即回退上一 tag"保留，但触发面从"每次"收窄到"每次跑的那两层"。

### 共同题 2 · "押注 DSH"的真正理由（不依赖热度数字）

去掉 star/插件数后，决策仍由五条**可验证**支撑（与 §1.5 定性一致，补测试方视角的顺序）：

1. **需求是产品树推导的，不是热度驱动的**：8 子项承接（compaction/sandbox/interaction/session/llm/mcp/preset/feedback）全部对应产品树 📐🗣️ 缺口（2.9.2/2.7.1/2.8.2/2.5.3/2.6.1）——先有缺口，后有底座，顺序不可逆。
2. **下行有底的不对称结构**（最站得住的理由）：锁版 `0.1.2-rc.1` 已把 8 子项收益**取走固化**；MIT + TS 可读保证最坏可 fork——**DSH 停更则我们保有已取走的部分不亏，演进则白拿红利**。这是"买现成底座"而非"买未来承诺"的结构。
3. **本地实证的边界可知性**：SAFETY.md/AGENTS.md 上限（同世界隔离/无安全审计/零 cloud 论述）已本地查证——**知道短板在哪**比"看起来完整"更接近可信决策。
4. **官方双分发降低接入门槛**：npm + PyPI runtime-bin（含 Windows x64 wheel、无需系统 Node）使"试"的成本极低——A 的失败成本主要在阶段 2-3 实测期，而实测本身就是低成本试错。
5. **缺口诚实存在**（不粉饰）：23 项语义层自做是真实工作量；押注的真正赌注是"**语义层与底座的分工假设**"——若 DSH 演进方向偏向编码向而挤压通用 harness 空间（AGI 是重心 ⇒ harness 是副产品的暴露矛盾），我们锁版取走的部分仍在，但"演进红利"会缩水。这正是 §1.5 失效条件④的价值：把它写成可证伪边界，押注就变成了"有退出条件的实验"而非"信仰"。

## Qoder


## Marvis
