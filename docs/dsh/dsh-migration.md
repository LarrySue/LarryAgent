# DSH 迁移讨论稿

> **状态：决策稿（第 3 轮四方审阅收口，四方一致「同意定稿」；老大 2026-09-08 终审通过）。**
> 用途：讨论LarryAgent 是否迁移到 DeepSeek Harness（dsh）
> **结论已出**：A 路径（换底座）；本文件代表"路径决策 + 实施规划"，不再代表"待定评估"。
>
> **老大终审结论（2026-09-08）**：§1.5 基准无问题 / §3.0 维持裁定 / §3.7 计划基本合理（后续按实际推进微调）；**§3.5 已终裁**：第 0 项三方实测（Trae 一等 / Claude 一等 / Qoder 二等）→ WB 判 **二等**，**老大 2026-09-08 确认** → 定 **A-framework（全面贴近核心层，含语言）**，路径分岔关闭。除此之外本稿**已定稿**，不再因讨论而改动。
>
> 评估基准：`../docs/product-positioning.md`（8 域 / 31 子项能力树）
>
> **✅ A 路径拍板**：老大给出三条立论（项目小 / 专属能力薄 / 能力建设维度升级）+ DSH 主仓事实校准 → C → A 反转。
>
> **写作口径**：**只写结论与方向**——不写「采纳了谁的意见」、不展开「为什么不做什么」；历史过程不保留在本稿（见 git 历史与 `.workbuddy/memory/`）。

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
| **兜底**（MIT + TS 可 fork + 锁定版 `0.1.2-rc.1` + 边界已核 + DSH-6 前双轨可回退）| **选错的代价**——最坏可接手自维护 | 许可变更 / 代码不可读 |

> **⚠️ 必须暴露的矛盾（老大自己已点破，WB 认为这是本条最需要被记住的部分）**：**AGI 是重心 ⇒ harness 是副产品**。这既是我们能免费拿到高质量底座的原因，也意味着**它可能随时因主线需要被调整、降速甚至停更**。这不是反对 A 的理由，而是「**兜底必须与信任并列、不能因信任而放松**」的理由——MIT 许可与 TS 可读性，是我们对该风险的**唯一**实质对冲（有兜底 = 副产品被砍也能接手；无兜底 = 信任一失效即归零）。

**失效条件（可证伪边界，命中任一即重估 A 路径）**：① DSH 连续两个 release 周期无实质投入（commits / release 频率断崖，与 §2 只记录不解读的基线比）；② 许可变更（MIT → 受限）；③ 官方明示 harness 停止维护或转闭源；④ §3.7「升级 SOP」事件触发条件长期无法收敛（preview 状态无限期）；⑤ **方向收窄**（不停更、不改许可、指标健康，但通用 harness 向 feature 占比持续趋零、编码专属 feature 占比 > 80%）——比停更隐蔽，须按 release changelog 量化观测。

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
| **锁定版本** | **`dsh-v0.1.2-rc.1`**（0.1.2 线首个 RC，老大裁定锁 release 线）。master 开发线 `dsh-v0.1.3-alpha.2`（2026-09-07，仅 git tag、未进包管理器；较锁定版领先 644 commit）。**tag 名带 `dsh-` 前缀**；11 个 release **全部 prerelease**，无 GA 时间表 | 🟢 |
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
| `test-support/llm-replay` | snapshot replay 测试（真实会话录制 → 无 key 重放）| ❌ 无 | 测试范式升级（见 §3.6 DSH-6）|
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
| ~~**Windows 非一等平台**~~ → **已推翻** | 本地确认 `packages/sandbox/sandbox-windows-acl/` **存在**；README 明示 Windows 后端 = **restricted token**，另有 2026-08-08 决策记录（选 raw ACL restricted token 而非 mxc / AppContainer）；`sandbox-local/` 三平台后端并列（Linux bwrap→Landlock / macOS Seatbelt / **Windows restricted token**）| 风险**下调**：Windows 有一等写入限制后端（三档策略 + 用户批准的一次性提权）。仍待DSH-2 在本机**实测** restricted token 实际生效性；未实测前不升 ✅ |
| **沙箱为同世界隔离**（新增）| `sandbox/` README 原文：「Confinement is **same-world only**: it shares the host kernel and filesystem」——非容器 / microVM 级 | 接受该上限：防误操作 / 防越权写入，**不防恶意代码**；与 `SAFETY.md`「do not guarantee isolation」一致。**迁移后产品树 2.7.1 档位不变**（承接 sandbox ≠ 安全档位自动升级，隔离强度受同世界上限约束）|
| **上游集中度** | DSH 是 DeepSeek 单一厂商对 harness 形态的主张，与同类（Claude Code / Codex CLI / Cursor）哲学各异；换底座 = 运行时框架层不可换（与模型层"多服务商可换"哲学方向相反）| **保留 sdk / acp profile 接入面作为脱钩通道**——DSH 走偏时核心逻辑可退到独立进程，DSH 只剩协议层；MIT + TS 保证最坏可 fork 自维护 |
| **项目长期可持续** | 高频 commits / 仍在合并 PR / DeepSeek = 行业第一梯队；`SAFETY.md` 明示**尚未接受安全审计，沙箱不能保证隔离** | 有积极信号但未到稳定预期；定期跟踪 |
| **方向不对齐** | DSH 全栈编码向（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`），LarryAgent 单人私人助理 | 长期需自做产品差异化（7 项见 §3.3）|
| **跨语言切换** | DSH = TypeScript，LarryAgent 后端 = Python FastAPI | A 路径下后端整体改 TS；保留部分 Python 脚本（数据迁移等）。（第 0 项已终裁走 A-framework，Python SDK 路径不再启用，该假设作废。）**【老大裁定】跨语言成本是本项目的「最小成本」，决策时完全可忽略——不得再以"跨语言成本高"为由否决任何路径** |
| **生态繁荣但质量参差**（**前判"生态早期"已推翻**，见 §2 插件生态行）| 3,199 插件 / 25 分类，但 UI·主题类占 640+（大量玩具）；个人作者为主，弃坑风险高 | **只借鉴、不直装（§3.0）**——生态价值定位为**参考实现库**：读源码抄设计、必要时 fork 自改；**不把任何关键能力押在外部作者的维护意愿上**。临时验证只在隔离环境装，不进产品依赖。补充（老大）：3,199 这个数字本身也可能含代理行为与跟风件，**不可作为"有人维护"的证据** |
| **插件版本漂移** | DSH preview 期 API 频繁变动，插件作者跟不上（已有插件标注 "verified against DSH 0.1.0-rc.6"，而锁定版为 `0.1.2-rc.1`）| 因 §3.0 **不直装**，本风险对**产品运行时不成立**（我们不依赖插件跟上 DSH）；仅影响**参考时效**——借鉴时标注其验证版本，fork 代码须按锁定版 `0.1.2-rc.1` 重验 API。DSH 升级时**不产生插件兼容性回归项** |
| **第三方插件安全** | SAFETY.md 明示：沙箱、审批与权限控制**不能保证隔离**（未接受安全审计）| 第三方插件视为**不可信代码**。**§3.0 后本风险大幅下降**：不直装 = **未经审读的**第三方代码不进运行时（fork 路径下经改造的源码必先审读，措辞前后自洽）；凭据 / 文件 / 网络相关部分按最小权限重写。**缺口（Qoder 二点，采纳）**：不直装 = 失去上游自动补丁通道 → 须补 **upstream 追踪与 CVE 响应流程**（见 §3.7）|
| **会话存储外接**（原 §九 保留项）| `storage/` 是 Non-session storage hub + backends，但具体能否外挂 SQLite 未确认 | DSH-2 环境准备时实测 |
| **headless + ACP 契约**（原 §九 保留项）| `acp/` 描述"Automation-only Agent Client Protocol server"，契约稳定性需实测 | DSH-2 环境准备时实测 |
| **产品承诺渗透性漂移（层间泄漏）**（Marvis，采纳）| 承接 ≠ 承诺不变，底座机制会悄悄改写产品语义：① **2.4.3 硬删 vs session append-only 留痕**（记忆删了但事件日志仍在，与 2.8.2 行为可见冲突）；② **2.9.2 保真度档位**取决于 compaction 默认策略（不满足则自做策略插件）；③ **三处泄底**：术语（harness 词不得出现在用户可见处）/ 交互（审批须默认聚合、低打扰）/ 能力（接了 8 个子项却没兑成体验）| **换底座对用户观感中性偏加分**——DSH 是原材料，净影响由语义层决定；**"套壳"在用户侧不是风险，真风险是没把白给子项兑成体验**。① 挂 2.4.3 验收注记：删 → 回放 → 断言无残留，不可避免则产品层定夺（轨迹脱敏 vs 级联删）；② 泄底三项由语义层收敛，不进必关清单 |

**升级 SOP**（取代原"锁版本不升不降"——该表述与立论③"随 DSH 演进"自相矛盾，第 1 轮 Trae/Qoder/Marvis 三方一致指出）：

- **节拍**：跟随 **rc 及以上** 的 release tag（不跟 master HEAD）；**`alpha` 只作监控信号、不跟随**。
  - **为何须写明（消歧义，非新增规则）**：DSH 的 rc 与 alpha **同为 `dsh-v*` 前缀的 prerelease tag，形式无差别**（84 行：11 个 release 全部 prerelease），故"跟随 release tag"字面口径**会把 alpha 包含进去**——须按**版本号语义**筛选，而非"有 tag 即跟"。
  - **双护栏**：① alpha **未进包管理器**（`0.1.3-alpha.1/.2` 仅发 git tag，npm / PyPI latest 仍为 `0.1.2-rc.1`）；② 但我们的锁定源是 **git tag**（§2.2 `ref/dsh-bare`），故①对 `ls-remote --tags` 的查法不成立 → **一律以包管理器已发布版本为准，git tag 仅用于读源码**。
  - **【老大已拍板】**——"目前先跟随 release tag，具体怎么做到时候再讨论，现在过于细节地讨论纯属空中楼阁"
  - **持续动作**：跟踪上游 tag（当前 release 线 `0.1.2-rc.1`）——按上条节拍筛选，rc 及以上才考虑，alpha 只记录不跟随。**原属 DSH-1 事实校准阶段的未完成项，随该阶段归档后并入此处**（持续性动作不随阶段归档）
  - **复核节拍（老大 2026-09-08 定）**：**不与上游 alpha 节奏绑死，按我们自己的阶段节拍走**——每个 DSH 阶段**完成后**，用当时最新的 rc 版本做一轮复核（评估锁定版是否已过期、有无影响本阶段结论的变更；纯测绘成本低，但结论必须标注基线版本）。DSH-2 的复核点在其任务 0 判定 + 5 项实测收口之后
- **首触发条件**：下一版本确认修复性能回退 + 破坏性变更窗口消化（**不是**"有新能力才升"）
- **回归分三层**（Claude 采纳——原"每次必跑 P4 全矩阵"在 2.3 天一 tag 下不可执行）：① **每次升级** = RPC 契约快照 diff + `llm-replay` 快照回归（无 key、秒级、廉价哨兵）；② **事件触发**（性能回退修复版 / 破坏性变更 / 影响 31 子项承诺的变更）= P4 全矩阵 + 真实验收；③ **季度评审** = GA 进展 / 生态 / 是否切 HEAD
- **回退**：任一红**先尝试适配（timebox 一个 release 周期、双轨保护下），超时未收敛即回退上一 tag**——回退仍是默认动作；适配必须有期限，否则"适配"演变为"漂移"
- **锁定期成本承认**：锁定期内 alpha bug 由本项目背，不指望上游修

### 3.5 路径决策

| 路径 | 决策 | 理由 |
|---|---|---|
| **A 换底座** | **✅ 拍板** | 底座能力开箱（8 子项直接承接）+ 免自造底座 + 演进红利；项目小 + 专属能力薄；能力建设 / 信息流接入层面 A 长期赢；**另加生态红利——但按 §3.0 定性为「设计红利」**：3,199 插件是可查阅的**参考实现库**（省试错与设计：schema / 检索策略 / 时间上下文建模 / 信任模型可直接借鉴），**不是可直装的能力货架**（不省实现、不省维护）|
| B 嵌一层 | ❌ 不推荐 | 与 A 重叠大半收益，但跨语言通信 + 双套状态同步复杂度高一档 |
| C 借思路 | ⚠️ 备选（**仅适用**等 DSH GA / 不绑 preview 风险）| prototype 可短期升级三个 🚧，但与 DSH 演进的 drift 成本长期无法消除 |
| D 接能力 | ❌ 不推荐 | A 已满足当前诉求；D 仅在"想要 DSH 独家能力"时启用 |

> **⚠️ 第 0 项（Py SDK 成色）—— 已终裁 2026-09-08**

> **【第 0 项实测结论 · 2026-09-08 · 已终裁】**：Trae 判**一等**、Claude 判**一等**、**Qoder 判二等**。**WB 判定二等（采纳 Qoder）；老大 2026-09-08 确认** → **定 A-framework（全面贴近核心层，含语言）**，本分岔关闭。三份实测报告（`dsh-pysdk-probe-trae.md` / `-claude.md` / `-qoder.md`）**永久保留作可复现证据**，引用口径以本节为准（Trae / Claude 两份的「一等」为原始交付，已被本节覆盖）。
>
> - **决定性事实（🟢 WB 本地锁定版核实，未采信转述）**：SDK JSON-RPC 请求面只有 `initialize` / `session/prompt` / `shutdown` 三个方法（`packages/sdk/protocol/src/types.ts:115-119`，`server.ts:248-253` 只分派这三个，grep approve/answer/respond **零命中**）；原生 `interaction/user-questions`、`user-approval` 有同进程 waterfall answerer；官方设计文档 `2026-07-06-approval-seam.md` 明写「Zero listeners fall through to **unavailable**」→ **2.7.2 的回答侧在 SDK 协议面不可得**。
> - **分歧根源是 WB 派发稿缺陷（认）**：判据 1「能力覆盖无实质缺口」含**两个不同尺度**——Trae / Claude 按「method 面差集为空」执行（比 SDK client vs TS SDK client，两者同为 design twin 故无差）；Qoder 按「31 子项用户可达」执行。**同一判据两个尺度，必然分叉**；Qoder 的尺度才是本意（老大裁的是"是不是一等公民"，判据应是产品能力可达性）。
> - **缺口可补，但需写 TS**：B1 通道已由 Claude / Qoder 实测可行（手工放置 cordis 插件，或隔离 pnpm 安装）→ 2.7.2 可经 **TS answerer 插件**或 **permission-preset 白名单**恢复。**不是不可达，是"不能开箱"**。
> - **为何仍判二等**：①"必须写 TS 才能完成"即 Python 侧不能独立完成全链路，正是"弱于原生 TS 路径"；②**2.7 边界域是核心产品承诺**——把边界决策放进 DSH 内的 TS 插件、Python 只做消息管道，与"保留 Python 主控"的价值主张冲突；③ §3.5 已有「23 项语义层须 TS / Cordis 插件挂载」口径，再加 answerer，"省下的成本"被进一步稀释。
> - **后果（已生效）**：走 **A-framework** —— 现有 Python 后端核心非测试代码（~3.7–4.4k 行）翻译为 DSH 插件 / 服务形式，**DSH-6 验收前双轨可回退**。本稿本就按此口径编写，无需换口径。
> - **成立理由（勿简化为"因为是二等"）**：① 2.7 边界域是核心产品承诺，**边界决策逻辑落在 DSH 内的 TS 插件侧** —— Python 只做消息管道则"主控"名存实亡；② 立论③「随 DSH 演进」在 A-service 下只能拿到 SDK 暴露面，而二等判定已证明该面 < 原生面。**"舍得抛弃现有成果"是前提，不是理由** —— 不可把老大的取舍意愿当作论据使用。
> - **③ 方向性风险（老大 2026-09-08；🟢 证据已由本地核实补齐）**：Python SDK 的运行时**本身就是 TS 的编译产物**——`deepseek-harness-runtime-bin` 是把 `dsh` 与整个 Node 依赖树打包成原生可执行文件的平台 wheel（win_amd64 约 69MB）。即：**能力面由 TS 侧定义，PY 侧永远是跟随者**；「补齐」只改变当下差距，**不改变这个方向**。故本条理由**不可被「新版补齐了」推翻**——与「二等」这个事实判定性质不同。
>   - **硬约束（🟢 PyPI 实测）**：该包最新 `0.1.2rc1` 仅发布 **4 个平台 wheel、无 sdist**（`win_amd64` / `manylinux_2_28_x86_64` / `manylinux_2_28_aarch64` / `macosx_14_0_arm64`），官方自述「no Windows arm64 wheel is published」。→ **平台覆盖由上游单方决定，且无源码分发可供用户自补**；平台一旦缺位或延后打包，PY 侧直接不可用。A-framework 走 npm + Node，此约束不适用。
>   - **概率自评（老大原话）**：PY 版本被抛弃「实际上我觉得不太可能」→ **③ 是保险性论据（低概率 × 高影响），不是主梁**；主梁仍是 ① ②。不得把③单独用作「所以 TS 一定对」的推论。
> - **⚠️ 对称风险（勿忽略，避免把③用成单向话术）**：A-framework 消掉了「PY 被抛弃」的风险，但**放大了「DSH 本体出问题」的敞口**（§3.4 上游集中度：高；且 4 天 644 commit 的 alpha 速度意味着核心层变动最剧烈，而我们恰贴核心层）。这是**真实取舍**，不是「PY 有风险所以 TS 就稳」。
>
> **已作废的路径（留档一条，防止后人重提）**：曾设想经 PyPI 的 `deepseek-harness-sdk` + `deepseek-harness-runtime-bin`（把 `dsh` 与整个 Node 依赖树打包成原生可执行文件、运行期无需系统 Node.js、有 Windows x64 wheel）驱动 `dsh --profile sdk` 子进程，从而保留 Python 后端。**第 0 项判二等后此路径不再启用，不得以"省事 / 省成本"重新提出。**
>
> **从该设想中留下的有效结论**：`--profile sdk` 是完整 JSON-RPC server、Python SDK 只是客户端；**插件（Cordis 服务）装载在 DSH 运行时内** → 自做语义层须以 TS / Cordis 插件形态挂载。范围上 Qoder 估**真正必须 TS 的约 5–8 项**（注入层 + 需深度介入 agent 组合的部分），窄于 23 项全量——**此估算未经实测，由DSH-2「任务 0」一并核实**。另：MCP 桥 / 事件流消费 / profile-patches 三条非 TS 通道（🟢 依据）保留作**降级备选**，不作主线。
>
> **A 已拍板（A-framework）**。DSH-2 五项实测见 §3.6 退出条件——它们是「**是否继续走 A**」的最后闸门（任一不过则重估、C 路径回退进入议程），不再是「选哪条路」。
>
> **路径内部分岔：A-framework vs A-service（Qoder 一点，采纳）—— 已选定 A-framework，下表留作决策记录，不再重开**：
>
> | 维度 | A-framework（全量 TS 化）| A-service（Python SDK）|
> |---|---|---|
> | DSH 角色 | **框架**：LarryAgent = 一个 preset / plugin 组合 | **服务**：LarryAgent = Python 应用，DSH = 外部子进程 |
> | 立论③「随 DSH 演进」| **完全兑现**（含架构演进）| **部分兑现**（只拿 SDK 暴露的能力）|
> | 上游集中度（§3.4）| 高（运行时框架层不可换）| 中（协议层可换；**能力面语义仍绑定 DSH**——"换实现"的前提是存在暴露同等能力面的替代 harness，🟡 当前不存在）|
> | 双轨并行 / 回退成本 | 中 | **低**（切换 = 改子进程启动参数）|
> | 测试资产 | 重建 | **保留 + 增补边界契约层**（Claude 一点）|
>
> **【老大裁定 · 决定性】**：若实测确认 **Python SDK 相当于"某种意义上的二等公民"**（能力、能力演进或一等支持度明显弱于原生 TS 路径），则**强烈偏向全面迁移到更贴近 DSH 核心层的技术栈——包括语言，且不限于语言**。即：本分岔不由"省多少成本"决定，而由**"是不是一等公民"**决定；**二等公民路径即便省成本也不取**。故DSH-2 第 0 项实测（§3.7）除"能否跑通"外，**必须判定一等 / 二等公民身份**。

### 3.6 A 路径实施规划

> **口径注**：本节按 **A-framework** 口径编写（第 0 项已终裁，路径分岔关闭）。

**总思路**：LarryAgent 后端从 Python 切换到 TypeScript + DSH 框架。**意味着**：现有后端核心非测试代码（~3.7–4.4k 行，统计口径见 §3.7 备注）翻译为 DSH 插件/服务形式。**保留**：SQLite schema、SQLite 双写（作为 DSH 插件挂载）、业务核心逻辑（角色 config、工具实现）。

**双轨并行（迁移期可用性保障）**：旧 Python 后端在DSH-6 验收通过前**保持可用、可回退**，DSH-6「功能等价」通过后才切换——迁移期间老大作为用户不失去 LarryAgent（产品树口径「已做 = 用户可达」）。

**时序纪律（Claude 四点 / Qoder 三点，采纳；老大裁定修正）**：当前是「代码体量小 + 数据体量小」的**双重窗口**（`backend/data/chroma/larry_memories` count = 0）。Qoder 主张把「记忆 schema 定稿」设为DSH-3/4 派发**硬门禁**，理由是窗口关闭是非线性的（活数据不能停机 + 兼容层 + 双索引）。**老大裁定**：**schema 是否为 0 不影响迁移决策**（当前远未正式使用，全部为测试数据，需要时直接启用新的即可，不存在数据迁移的技术难度或成本）。故本稿口径为：**记忆 schema 应尽早定稿（成本最低），但定稿是「优化项」不是「阻塞项」，不构成迁移门禁**。**【老大二次裁定】由于不存在真实数据，记忆 schema 不作为DSH-4 门禁；若判定存在技术面分歧或风险，用测试数据验证即可**（Marvis 曾引 arXiv:2603.01209 主张设硬门禁，核验为「论文真实但场景错配」——研究对象是自微调模型的 interpreter 变量持久化，与本项目不符。）

**迁移必关清单（Marvis 四点，采纳——承接总表的负向补充）**：承接总表只回答"DSH 承接什么"，本清单回答"DSH 给了什么我们必须关掉"，随DSH-4 一并验收：

| 项 | 风险 | **本地实证（🟢 锁定版核实）** | 处置 |
|---|---|---|---|
| **Self-modification**（`extensions/` 的 `cordis_*` 工具，agent 自我修改插件图）| 与 2.7.2「边界交用户决策」、2.7.5「知情」相反——单人助理不允许 AI 改自己的运行时 | `packages/extensions/` 存在（含 `cordis-client-runner/`）；README.zh 明写：**定义只存于进程内存，DSH 重启即清空，不写仓库文件、不改任何配置** → **持久化风险不存在，风险等级由「高」降为「中」**（进程内运行时自我变更）| **默认禁用**，最多留 audit 钩子 |
| **`cordis.yml` / preset 的 `!!js` 配置即代码执行** | 配置从"数据"变"代码面"，动摇 2.7.3「key 只走配置不入库」的凭据威胁模型 | 锁定版 `.agents/notes/` 开发笔记明写 "**booting evaluates `!!js` expressions**"（启动时真的求值 JS 表达式，`dsh-app-boot` 曾重复实现该 YAML type）→ **风险成立，非推测** | 迁移后评估**禁用或限用**，凭据表述按新模型重写 |
| **Agent 外链面**（`subagent/` 的 Claude Code / Codex / ACP provider）| 单人助理默认允许"AI 再调外部 agent"，扩展 2.7.5 出境面 + 引入外部系统副作用，与「边界交用户决策」冲突 | 🟡（包存在，默认启用态待核）| **默认禁用**，用户显式开启才可用 |
| **Autonomy 自动执行面**（`goal/` `schedule/` `workflow/`）| "AI 自行安排动作"违背「用户先开口」的范式 | 🟡（同上）| **自动执行默认禁用**；其设计可作 2.3.5 借鉴（已落承接总表 2.3.5 行）|
| **telemetry / feedback 上报面**（`identity/` 匿名 id 相关）| 个人助理的对话 / 行为数据不应默认上报，与 2.7.5 数据主权最小化冲突 | 🟡（同上）| 迁移后**确认关闭或显式开关** |
| **`dsh-session-log-deepseek`（会话日志上报）** | 启用后每个携带存活 session id 的请求都会发送**完整、未脱敏**的 `SessionEvent` 对象到所配 baseURL（官方原文 performing no projection or redaction），与 2.7.5 数据主权冲突 | 🟢 锁定版核实：**explicit opt-in（默认关闭）** | **迁移后确认关闭；任何情况下不启用** |

**第 0 项实测硬发现（三方并行 2026-09-08，永久留档）**：以下为三家实测产出的**事实结论**（可复跑步骤与原始输出见 `docs/dsh/dsh-pysdk-probe*.md`），属判定依据，**不随待办迁出而删除**：

| 发现 | 实证 | 处置 / 影响 |
|---|---|---|
| **Windows 官方 CLI 崩溃 —— ⚠️ 口径已修正**（Claude + Qoder 独立发现 🟢；Trae 2026-09-09 反证 🟢）| 第 0 项：`dsh.exe --version` / `--dump-config` 在 Windows "稳定 segfault（0xC0000005）"。**DSH-2 反证**：npm 全局安装的 `dsh@0.1.2-rc.1` 在 Windows **实测全部可用**——`plugin --profile add` / `--dump-config` / `--help` / 完整会话（demo-ptc）均 exit 0 | **不可用"Windows CLI 崩"作铁律**。崩溃与**入口/安装方式**相关：npm 全局 `dsh` 可用；**源码入口（`bin.ts` + tsx）在 PowerShell 下偶发卡住**（Trae 实测改用 npm 全局后全通）。**默认走 npm 全局 `dsh`，不用源码 tsx 入口**；若复现崩溃须记录具体入口与安装方式再定性 |
| **长 turn 无超时保护**（Claude 真实 key 实测 + Qoder 源码确认 🟢）| `request_timeout_seconds` 只覆盖单次 JSON-RPC 往返，turn 等待 `subscription.next()` 无 timeout → 子进程挂起时 SDK **无限等待** | **应用层必须自建 watchdog**（A-framework 下同样需要）|
| **B1 安装期仍需 Node / pnpm**（Qoder 🟢）| 不带 pnpm 安装失败，隔离装 pnpm 10.17.1 后成功 | "无需系统 Node"**只在运行期成立**，安装 / 升级链路不是纯 Python |
| **MCP 只证 Tools**（Qoder 🟢）| Resources / Prompts / 任意 Cordis 内部 service 或 hook **未证**可经 MCP 等价桥接 | 不得外推为"所有能力均可经 MCP 桥接" |
| **Python 侧事件多为 `JsonObject`**（Qoder 🟡）| 无 TS 判别联合类型与同级运行时校验 | 升级时更易**静默接受字段漂移**（走 A-framework 后影响降低，保留作背景）|
| **⚠️ 跨进程 resume 的 id collision 定性未收敛** | Claude 判"可能是 SDK 缺口或姿势问题"（源码 `packages/core/session` 称 cold session 应 resumed on first touch，但 Python SDK `start_session(session_id)` 触发 collision）；Qoder / Trae 判"探针用固定 ID 所致，改 UUID 后成功" | 影响 2.4.1 / 2.8.2 的 fork / resume 承接叙事 → **列为 DSH-3 首验项**（待办见 TODO「DSH-3」）|

> **产品承诺面**（区别于上述安全 / 运行时面）：**记忆删除在 session / trajectory 层的级联语义**——见 §3.4「产品承诺渗透性漂移」行，挂 2.4.3 验收注记。

**前端路线（DSH-2 定死）**：**保留 Vue/Tauri 客户端**、**不采用 DSH Web-GUI**——Tauri 壳是 2.10.2 端侧执行器的宿主，换 web client 等于废掉 client/ 全部工作并丢掉端侧能力载体。**通信面（sdk / acp / 自做网关）暂取 sdk / acp，待 DSH-2.3 实测后定型**。

> ⚠️ **未收敛项（DSH-2.3 提出，待实测后定型）**：通信面暂取 sdk / acp，但 **sdk 面的 JSON-RPC 请求面只有 `initialize` / `session/prompt` / `shutdown`——这正是不判二等的同一个窄面**（§3.5）。若 client 长期经 sdk 通信，则客户端一侧被永久限制在该窄面内，与 A-framework「贴近核心层」的初衷存在张力。
> **当前处置**：DSH-2.3 派发稿**刻意未锁死通信面**，只要求验通 + 报告该面"能做 / 明显做不了什么"。可选方向含「在 DSH 进程内自做 HTTP 网关，通信面自定」。**2.3 交付前不作定论；TODO 侧与该判断保持同步、不先行按 sdk 面设计。**

**测试资产是独立工作包，不是DSH-6 附赠项**：现有 pytest 测试 ~4.4k 行，与核心代码 1:1。**第 0 项判 A-framework → 处置方式定稿：按 DSH 四层测试体系重建**（原"保留 + 增补边界契约层"是分岔表 A-service 行的口径，已随分岔作废）。无论哪条路径，测试基建（临时库隔离 / 真实库 fail-fast / `--real-api` 占位符机制）须在**DSH-2** 设计到位——不提前设计，DSH-3 起每步验证都裸奔。

#### DSH-1：事实校准 ✅（已归档 2026-09-08）

> **本阶段已完成，全文冷存于 `archive/roadmap-history.md`**（治理约定：完成一个归档一个）。内容：packages 盘点 / AGENTS.md / releases 阅读 / 第 0 项 Py SDK 一等二等判定（判定与证据见 §3.5）。
> 其中**持续性的「跟踪上游 tag」动作不随阶段归档**，已并入 §3.4 升级 SOP 节拍。

#### DSH-2：代码形态 + 环境准备

> **任务清单与进度见 `TODO.md`「DSH-2」**——本稿不存放待办，本节只放**验收基准与判定依据**。

- **参考源（已完成）**：DSH 主仓 clone 到 **`ref/dsh-bare/`**（项目根独立目录，`.gitignore` 排除、**不入 git**），锁定 `dsh-v0.1.2-rc.1`（裸仓库按 tag 直读，无工作区）。查阅方式见 §2.2
- **代码存在形态：A 案已判定成立（DSH-2.0 · 2026-09-08）** —— LarryAgent = **独立仓库 + 构建 Cordis bundle 挂载**，**不 fork**。8 项必需能力**全部可经公开挂载面**（Cordis bundle / preset / patches / 配置 / MCP 桥）获得，**无一项需修改 DSH 上游代码**
  - **架构根因**：DSH 核心能力层是 **Service Definition / Provider / Consumer** 三分架构（capability seam 设计）——`ctx.approval` / `ctx.compaction` / `ctx.sandbox` / `ctx.fs` / `ctx.tools` 均为**契约**，默认实现只是**一个 Provider**。我们的全部必需能力 = 提供自己的 Provider / answerer / listener，消费者与模型侧不动
  - **证据**：逐项表见 `docs/dsh/dsh-form-probe-claude.md`。🟢 **WB 本地复核（`git show` 锁定了 `dsh-v0.1.2-rc.1`）：机制 8/8 属实**；行号 2 处偏差（#2 实际 154 行、#3 实际 22 行）——**报告的行号不可全信，机制结论可信**
  - **不选 B 案的理由**：8 项无一项触及 agent loop / session 内核 / 事件存储；fork 的代价（每次上游发版 merge 一个 alpha 框架的破坏性变更）换不来任何必需收益。升级 SOP 在 A 案下 = 更新依赖版本 + replay 回归
  - **已知边界（不阻塞 A 案）**：① ~~`patchReload: startup` → 部署期配置变更需重启~~ **⚠️ 已由 DSH-2 实测修正**：第 0 项判的 `startup` 出自 **sdk-app** bundle；我们实际采用的 `larry` profile（`dsh-base` + `dsh-headless`）manifest 为 **`patchReload: live`** 🟢（WB 本地 `cat .dsh-home/profiles/larry/package.json` 核实）。**配置热重载可能可行，不必按"改配置必重启"规划**；② **同会话运行中热切角色（含工具集）未找到公开 API**——当前以「产品树无此承诺」非否决，**属条件性风险：若将来产品树加此承诺，A 案可能不够**，列 DSH-3 首验

**退出条件（5 项实测，任一不过则 DSH-3 收益表重估、C 路径回退进入议程）**：
1. `storage/` 外接 SQLite 可行性
2. `acp/` 契约稳定性
3. **Windows 端 `ctx.sandbox` provider 可用性**（2.10.2 端侧执行器前提）
4. Vue/Tauri → sdk profile 连通
5. **TS 跑通 bge-small-zh 本地 embedding，与 Python 侧同文本向量漂移比对**（重嵌策略依据）

**本阶段已定案的环境规格（后续阶段沿用，勿各自另起一套）** 🟢 DSH-2.1/2.2：

| 项 | 取值 | 依据 |
|---|---|---|
| 工程目录 | `harness/`（仓库内，pnpm workspace） | DSH-2.1 定案 |
| 包名前缀 | `@larryagent/` | 同上 |
| profile 名 | `larry`（= `dsh-base` + `dsh-headless`） | 同上。⚠️ **manifest 因 bundle 而异**——`patchReload` / 可用命令等结论**不可跨 profile 外推**（第 0 项的 `startup` 即出自 sdk-app） |
| `DSH_HOME` | `.dsh-home/`（仓库内，已 gitignore——含凭据与会话产物） | 同上 |
| DSH 入口 | **npm 全局 `dsh@0.1.2-rc.1`**；不用源码 `bin.ts` + tsx | DSH-2.2 反证：源码入口在 PowerShell 下偶发卡住 |
| DSH 源码副本 | `D:\Code\dsh-src`（仓库外，可重建）——**仅在需追进 DSH 内部行为时**使用 | 同上，非日常必需（A 案的价值正是默认不需要它） |
| sdk profile | `.dsh-home/profiles/sdk`（= `dsh-base` + `dsh-sdk-app`，stdio JSON-RPC） | DSH-2.3 连通验证用；注意与 `larry` 是两个 profile，结论不可互推 |
| **端到端动态验证** | **WB 侧可独立完成**：Git Bash 工具 + 环境变量注入测试 key | 🟢 2026-09-09 复测：握手 / 事件流 / **真实 LLM 回包**全部跑通，见下方「WB 复验边界（修订）」 |
| **WB 的 PowerShell 工具** | **不可用**：未启用 ConPTY，原生 exe（`node.exe`）无输出、等同于不执行 | 🟢 WB 实测：`node -v` 返回空、纯 cmdlet（`Set-Content`）正常 |

> **零成本复验法（🟢 WB 独立跑出，可复用）**：`dsh --profile larry --help` **即触发 cordis apply，不需要 LLM key**。凡要验"插件到底加载没加载"，先用这条，不必跑完整会话。
>
> ⚠️ **WB 复验边界（2026-09-09 立，同日修订）**：
>
> **① 工具层（已定位）**：WB 的 **PowerShell 工具未启用 ConPTY** → 原生 exe（`node.exe`）**不执行、无输出**（`node -v` 返回空），而纯 cmdlet 正常。此前「PowerShell 侧 initialize 恒超时、无输出」是**工具假象，不是 DSH 失败**。→ **WB 一律用 Git Bash 工具跑命令；不要用 PowerShell 工具跑任何 node/npm/pnpm。**
>
> **② 能力层（已实测放宽）**：Git Bash 侧**已可独立复现** SDK 通道 —— `initialize` + `session.prompt` + 事件流 + 通知流全部跑通（🟢 连续 5 次：仓库根 ×2 / 全新目录 ×1 / 死锁 ×1 / 活锁 ×1，单次约 2.4s）。故「WB 完全不能端到端」**作废**。
>
> **③ 真实 LLM 回包：WB 已独立复现（2026-09-09 二次修订）**：注入测试 key 后 `finalResponse` 正常返回（🟢 `"probe ok"`，19 事件含 `assistant/chunk`×7 + `assistant/message`×1，21 通知）。
>
> ⚠️ **订正**：此前本条写「执行环境无 API key」是**错误表述**——**不是没有 key，是 WB 未注入**。老大每阶段都开专用测试 key 并已授权明文取用（`docs/ai-governance.md` §1 已加豁免条款）。**把"自己的选择"写成"环境限制"属归错对象**，与把工具故障归给被测对象是同一类错误。**凡声明"做不到"，须先分清是环境限制还是自己没做。**
>
> **注入姿势（可复用）**：`DEEPSEEK_API_KEY=<测试key> node harness/scripts/dsh-probe-capability.mjs "<msg>"`，**只走环境变量、不落任何文件**（与既有报告口径一致）。
>
> **④ 已排除的假说（均有对照实验，勿再重提）**：node 版本（内置 22 与系统 24 解析结果一致）／tsx 源码回退（built bin 存在，未触发）／首次运行安装耗时（全新目录 2.4s 完成）／profile 安装锁（**死 PID 锁与活 PID 锁均不阻塞**）。
>
> ⚠️ **残留锁：现象存在，但与超时无因果关系（2026-09-09 证伪）**：WB 执行环境下 dsh 异常退出后会在 `.dsh-home/profiles/node_modules.lock` 留下**持有者已死的锁**（该现象 WB 环境 100% 复现、Trae 三阶段零复现）。曾据此断言「后续调用全部超时」，**该断言已被对照实验推翻**：
> - 写入**死 PID**（`999999`）的锁 → probe 正常返回（2.4s），**不阻塞**；
> - 写入**真实存活进程 PID** 的锁 → probe 同样正常返回（2.4s），**不阻塞**；
> - 正常退出时锁会**自动清理**（实测退出后无残留）。
>
> → 结论：锁是**异常终止的痕迹**，不是后续超时的原因。此前「initialize 恒超时」的真实原因见上方『WB 复验边界①』（**PowerShell 工具无 ConPTY**）。**残留锁仍不得当作 DSH 缺陷**，但也不得再当作超时原因引用。

#### DSH-3：核心能力 prototype

> **任务清单与进度见 `TODO.md`「DSH-3」**；本节只放**验收基准**。接入对象：`compaction/`（→2.9.2）／`sandbox/`（→2.7.1 Linux 侧）／`interaction/`（→2.7.1 高危审批）／`session/`（→2.8.2）。

**退出条件**：**核心链路（会话 + 记忆 + 工具）在 DSH 下达到 P4 等价**（不是"四个包跑通"——无交付通道的跑通不算）。

**最小可验证切片 S0–S4（Trae，采纳）**：S0 = 一条消息的完整生命周期（客户端 → sdk/acp JSON-RPC → session create → agent loop 挂 **1 个**自做工具 `read_file` → 真实 LLM 调用 → 回客户端 → session 落盘 → session-query 回读），一条链同时验证交付通道 / plugin mount / llm provider / session 持久化四个前置；其后逐层叠加、单独验收：

| 步 | 叠加 | 验收 | 勾对子项 |
|---|---|---|---|
| S0 | 基础链路 | 消息往返 + 事件落盘 + 回读 | 2.4.1 / 2.8.2 |
| S1 | + interaction 审批（`read_file` 配 workspace-write，弹 Tauri 对话框）| 批准 / 拒绝两路都通 | 2.7.1 / 2.7.2 |
| S2 | + compaction（灌 200+ 轮长对话）| 摘要注入且近文保留 | 2.9.2 |
| S3 | + sandbox 三档（read-only / workspace-write / danger）| 拒绝与提权流程生效 | 2.7.1 |
| S4 | + 记忆最小闭环（会话结束事件 → 双写 → 新会话召回）| 召回内容出现在下一会话 | 2.4.2 |

S4 实现位置（第 0 项终裁后确定）：**TS 插件挂 session 事件流**（A-framework）。退出判据一律是"产品树子项可勾对"，不是"包能跑"。

#### DSH-4：差异化能力迁移

> **任务清单与进度见 `TODO.md`「DSH-4」**；本节只放**排序原则、实现路径判定与验收基准**。

**排序原则（用户感知层优先）**：用户强感知的差异化项（记忆 / 画像 / 知识库）排在开发者红利项（trajectory / compaction 精细策略）之前——避免"接 DSH 送的能力很爽"挤占真正让 LarryAgent 是 LarryAgent 的部分。

| 能力（实现路径判定，非任务清单）| 原 Python 模块 | DSH 实现路径 |
|---|---|---|
| 长期记忆双写 + 人审 | `memory/archiver.py` 223 行 + `engine.py` 107 行 | 自做插件挂载 `session/` 事件流；保留 SQLite+ChromaDB 双写 |
| **记忆迁移（活资产，非数据搬运）** | 全量 memories + 向量 | **全量重嵌**（PyTorch/FP32 与 ONNX/q8 向量不保证逐维一致，不可假设跨运行时可比）+ 同文本向量漂移比对 + 召回等价性抽样验收（迁移前后同组 query 的 top-k 一致性达阈值）+ 语义字段不降级（`is_active` / `last_hit_at` / `source_role` 一个不能丢，ChromaDB 只能重灌、机会只有一次）|
| 用户画像 | 📐（TODO 长期项）| 自做插件；DSH 身份语义待核（见 §3.3）|
| 知识库 | 📐（2.4.6 三层递进）| 自做插件；BM25/FTS+向量混合检索 |
| 角色机制 | `config.yaml` + 5 角色 system_prompt | 用 `preset/`（agent-presets + persona）+ `cordis.yml` 配置 |
| 工具生态 | `tools/` 844 行（shell/file_ops/web_search）| 翻译为 DSH 工具插件；**web_search 暂保留自实现 Brave**（DSH 搜索/抓取包归属待核，且须保留首版范围边界——不配正文抓取，SSRF/清洗成本是刻意规避的）|
| 回收站 / 每会话文件沙盒 | 🚧（2.3.1 / 2.3.3）| 自做插件；DSH `sandbox/` 语义不同需自定义 |

**附带裁定**：历史会话（messages 表）与 DSH session（JSONL 事件流）**不同构，不进 DSH session 格式**——只读留存或一次性转换脚本；**旧会话只是历史，记忆才是活资产**，转换优先级记忆 > 会话。

**退出条件**：**31 子项档位不降、用户可达**（逐行勾对下方承接总表）。**【老大裁定 · 实现方式放宽】**：DSH-4「没太多可迁移的，现有实现过于简陋，直接抛弃也不是不行」——**不要求逐行翻译**，按 §3.0「借鉴社区设计重写 + 产品树勾对」即可；原"功能等价 / 不丢 P4 已通过项"口径不再适用（与 §3.0 只借鉴不直装形成闭环：旧代码可抛弃、新代码按蓝图重写、验收看产品树）。

#### DSH-5：形态适配

> **任务清单与进度见 `TODO.md`「DSH-5」**；本节只放**验收基准**。适配对象：本地 `host/` → 上云 server（原 2.10.1）／客户端 Tauri（保留 PC 端 C/S + 本地 file_ops / shell 能力下沉）／移动端 B/S（原 2.10.2）。

**退出条件**：云端部署可用、移动端可访问。

#### DSH-6：测试 + 验收（按 DSH 四层测试体系重建，非"翻译"）

> **任务清单与进度见 `TODO.md`「DSH-6」**（含 WB 复验 + 老大最终验收）；本节只放**测试策略与验收层次**。

测试策略从"平移"改为"重建升级"：DSH 测试哲学是 **Real implementation over mock**（mock 只留非确定性边界），`test-support/llm-replay` 的 snapshot replay（录真实会话 → 无 key 重放）**取代而非翻译**我们的 mock-LLM 层。

| 我们的测试层 | 迁移方向 |
|---|---|
| mock LLM 单测 | **不翻译** → snapshot record → replay（比手写 mock 更真且免费回归）|
| `--real-api` 集成冒烟 | 平移升级（DSH `test:e2e` 原生同语义：真实 key 自跳过）|
| 降级/异常/护栏单测（纯逻辑）| 翻译（Vitest，约五成可平移）|
| conftest 隔离 / fail-fast 断言 | DSH-2 重做（不可省）|
| 前端 Vitest | 平移保留 |

**验收五层**：① 纯逻辑层翻译全绿；② 关键路径 snapshot replay 覆盖（chat 主链路 / 工具调用 / 归档提取）；③ 真实 API e2e 冒烟；④ 数据迁移验证（双写 + 全量重嵌后召回抽样比对）；⑤ Windows 端侧执行器验收（若走 2.10.2，与DSH-2 实测项③同源）。

- **任务**：WB 复验 + 老大最终验收（勾对承接总表）

#### 31 子项承接总表（DSH-4 验收基准）

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
| 2.4.3 记忆可管理 | 自做 | 硬删语义产品层已裁定；**验收注记**：删 → 回放 → 断言 session / trajectory 无残留（与 append-only 事件流的冲突，见 §3.4「产品承诺渗透性漂移」）|
| 2.4.4 记忆保鲜 | 自做 | supersede + 状态标签（产品树结论）|
| 2.4.5 用户画像 | 自做 | DSH 无画像概念 |
| 2.4.6 知识库 | 自做 | 三层递进（产品树结论）|
| 2.5.1 多模型切换 | **DSH `llm/` 替换** | 开箱即得 |
| 2.5.2 工具挂载 | **DSH 工具管道替换** | shell/file_ops 翻 TS 插件 |
| 2.5.3 扩展性/MCP | **DSH `mcp/` 新增** | 开箱即得 |
| 2.6.1 角色切换 | DSH `preset/` 迁移底座 | cordis.yml 承接 config 角色。🟢 **复核补强**：官方 `preset/persona` 包本体即 `export const inject = ['systemPrompt']`（`packages/preset/persona/src/index.ts:27`），带 `complete`（完全替换 system prompt）／`includeRuntimeContext` 选项 → **角色机制 = 官方 persona preset，公开面可达** |
| 2.6.2 自动路由 | 自做/待定 | 产品树仍 📐 |
| 2.7.1 行为安全 | DSH sandbox 升级 | 三平台后端**均存在**（Windows = restricted token）；待DSH-2 本机实测后升 ✅（上限：同世界隔离）|
| 2.7.2 边界透明 | **自做（A-framework 下为常规待办，非缺口）** | 🟢 锁定版核实：SDK 请求面无 answer 方法，官方设计文档明写「Zero listeners fall through to **unavailable**」——**此即判二等的核心依据**。**A-framework 下由我们的 TS answerer 插件实现**——**挂载通道本身已由 DSH-2.1 我方自验 🟢**（`plugin-probe` 经 B1 被 cordis 实际加载），退路为 permission-preset 白名单。DSH-4 验收项 |
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
| 2.10.2 端侧能力 | 自做下沉 | Windows 沙箱后端**已确认存在**（restricted token + `sandbox-windows-acl/`）。🟢 **复核补强**：`sandbox-local` README 明示 **fail-closed**——无可用 runner 时 provider 报 `SANDBOX_UNAVAILABLE`，**命令绝不静默裸跑**（对 2.7.1 行为安全同效）。待 DSH-2 实测（同世界隔离为已知上限，非阻塞项）|
| 2.10.3 单人单实例 | 形态事实 | DSH 无关 |

#### 风险与退出条件

- DSH-2 五项实测任一不过 → DSH-3 收益表重估，C 路径回退进入议程
- DSH-3 核心链路未达 P4 等价 → 回退旧后端（双轨保障，旧后端全程可用）
- DSH-4 任一项差异化能力卡死 → **单独延后，不阻塞主线**（DSH 框架先落地，差异化能力分批做）
- DSH 发布破坏性变更 → 按升级 SOP（§3.4）：跟 rc 及以上 tag（alpha 不跟随），升级必跑 replay + P4，任一红回退
- 方向不对齐长期化 → §3.3 的 7 项差异化能力同步排进 P 队列

### 3.7 待办 → TODO（本稿不存放待办）

> **本稿只放判定依据与行事规则；待办一律在 `TODO.md`「DSH 迁移」区**——DSH-2 ~ DSH-6 的任务、待校准实测项、待核包归属、待派发清单。
> - **完成一个阶段归档一个**：DSH-1 事实校准已完成，全文冷存于 `archive/roadmap-history.md`。
> - 第 0 项的判定与证据见 §3.5；三方实测的硬发现见 §3.4「第 0 项实测硬发现」表（不随待办迁出）。
> - **体量口径备注**：后端核心非测试代码存在三个统计口径（Trae 3653 行 / 36 文件、Claude 4442 行、WB 3926 行——差异在根文件与目录统计口径），量级一致（个人级小项目）。

---

> **历史决策过程不再保留于本稿**（C→A 反转、两段式重构、四方意见逐条处理、§2.3 撤回等）：有价值的结论已全部凝结进结论区，过程与教训见 git 历史与 `.workbuddy/memory/`（「证据纪律」§十一）。
