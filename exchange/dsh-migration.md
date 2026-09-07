# DSH 迁移讨论稿

> **状态：决策稿，A 路径已拍板。**
> 用途：讨论LarryAgent 是否迁移到 DeepSeek Harness（dsh）
> **结论已出**：A 路径（换底座）；本文件代表"路径决策 + 实施规划"，不再代表"待定评估"。
>
> 评估基准：`../docs/product-positioning.md`（8 域 / 31 子项能力树）
>
> **✅ A 路径拍板**：老大给出三条立论（项目小 / 专属能力薄 / 能力建设维度升级）+ DSH 主仓事实校准 → C → A 反转。
>
> **两段式**：结论区 WB 维护（§1/§2/§3，不写"采纳了谁的意见"）；讨论区各方表态（§5 附：决策追溯记录，提议 / 处理 / 备注 三列）。

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

---

## 2 DSH 事实画像

> **来源图例**（本稿铁律，凡引 DSH 事实必标）：🟢 **本地代码验证**（`ref/dsh-bare/` 锁定版，可靠）｜🟡 **官方源 / API**（GitHub API、docs 站、release notes，次之）｜🔴 **推断未验证**（**不得作为结论依据**，只能列入待验证）
>
> 本表 🟢 项均以本地副本锁定版 `dsh-v0.1.2-rc.1` 实测为准（查阅方式见 §2.2）。
> 
> **`../ref/dsh-bare/`**（**不入 git**，`.gitignore` 已排除）是DSH 源码的本地副本，锁定 release tag `dsh-v0.1.2-rc.1`。**查阅方式见 §2.2**，含四条必读踩坑：勿用工作区 `ls` 判断包是否存在 / 勿把官方 config-catalog 当包清单 / 嵌套子包不在顶层目录 / Windows 下勿做整体 checkout（会卡死，实测 5.5 小时未完成）

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
| **社区规模** | star **213,914** / fork **25,168** / watch 925（GitHub API 直读，非网页抓取）| 🟡 |
| **官方状态** | `SAFETY.md` 原文：「experimental developer-preview software. It has **not undergone a security audit** and **must not be treated as secure or production-ready**」；沙箱/审批/权限「do not guarantee isolation」 | 🟢 |
| **沙箱** | 四子包：`sandbox/` + `sandbox-local/`（Linux bwrap→Landlock / macOS Seatbelt / **Windows restricted token**）+ `sandbox-policy/` + **`sandbox-windows-acl/`**（Windows 写入限制：受限子进程仅可写工作区与私有 temp）。三档策略 `read-only` / `workspace-write` / `danger-full-access`；被策略拒绝的调用可经**用户批准的一次性升权**重试。**同世界隔离**：共享宿主内核与文件系统，非容器 / microVM 级 | 🟢 |
| **运行形态** | 5 个 profile（web / headless / sdk / sdk-minimal / acp）+ 本地 `host/`（API gateway）+ 本地 `client/`（Web-GUI）| 🟡 |
| **能力分布** | `compaction/` `sandbox/` `interaction/` `session/` `session-query/` `llm/` `mcp/` `acp/` `sdk/` `preset/` `storage/` `e2b/` `subagent/` `workflow/` `web/` `terminal/` `shell/` `fs/` `lsp/` `test-support/` **本地逐一确认存在** | 🟢 |
| **`python/` 位置（前判有误，已修正）** | 前判"`python/` 不存在"是**按 `packages/` 顶层判断得出的错判**——它实际在**仓库根**（`python/`），是**官方 Python SDK**（`sdk/` + `sdk-runtime/`），见下行 | 🟢 |
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
- **与"未来真集成"是两回事**：A 路径拍板后 DSH 最终会成为项目依赖，但届时走**正式依赖方案**（npm 依赖 / submodule / fork，见 §3.7 待拍板），**与本参考副本无关**——本副本只回答"DSH 是什么、有什么"，不参与"我们怎么用"
- **锁定版本**：`dsh-v0.1.2-rc.1`。老大裁定「演进红利不在一时」，**锁 release 线、不跟 master**
- **为何锁 tag**：master 为开发线（现 `dsh-v0.1.3-alpha.1`）波动大；锁 tag 使"本地快照"与"决策依据"绑定同一对象，避免基于漂移事实决策
- **为何用裸仓库（无工作区）**：Windows 下 9,080 文件的 checkout 会**卡死**（实测 5.5 小时未完成、残留 2451 项、进程僵住）；裸仓库**零工作区文件写入**，实测 **clone 44 秒**完成，而 `ls-tree / show / grep` 直读能力完全等价

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

**清理提示**：若曾建过工作区副本（如旧的 `ref/dsh/`），删除时会被本机批量删除保护拦截，**需老大手工在资源管理器删除**（老大已删）

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

**边界（防止本原则被误用推翻 A 路径）**：本原则针对**插件 / 第三方扩展**；DSH **底座本体是框架依赖、不是插件**，A 路径依然成立。底座的同等兜底是 **MIT + TS 可 fork 自维护**（见 §3.4 上游集中度行）——即"依赖一个**可接手**的底座，而不是**不可控**的插件"，两者风险性质不同。

**对本节结论的影响**：§3.3 三项降级口径由「选型 + 适配」改为 **「借鉴自实现」**；§3.4 风险表应对列同步；§3.5 A 的"插件生态红利"重述为**设计红利**（省试错与设计，**不省实现与维护**）；§3.7「插件选型调研」改为**借鉴调研**。

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

> **表注（本地代码复核——推翻第 1 轮"虚焊"结论）**：第 1 轮以「官方 config-catalog 未命中」判定 `identity/` `subagent/` `workflow/` `web/` `python/` 为"虚焊"，**该判定错误**：config-catalog 只列**有配置项**的包，**不能当包清单用**。本地 `git ls-tree` 逐一确认：`identity/` `subagent/` `workflow/` `web/` `storage/` **均真实存在**，仅 `python/` 不存在。逐条修正：
>
> ① `identity/` 存在但**非用户画像**（共享匿名 correlation id，见 §2）→ §3.3 结论不变，依据升级为本地实证；
> ② `subagent/` `workflow/` **存在** → 子代理 / 工作流能力**可复用**，不再标"experimental 待核"，但成熟度仍需阶段 2 实测；
> ③ `web/` 存在（搜索 / 抓取）→ 原「替换 Brave」一行**恢复为待实测**（阶段 2 验 provider 质量后再定，不预设替换）；
> ④ `storage/` 存在（Non-session storage hub）→ 外接 SQLite 仍待阶段 2 实测；
> ⑤ `sandbox-windows-acl/` **存在**（嵌套于 `packages/sandbox/` 下）→ Windows 有一等后端，见 §3.4 修正；
> ⑥ `webhook/` **维持待核**（config-catalog 无条目 vs 主仓 README 命中，两源冲突）——本地未查证。

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

> **核心判断（2026-09-07 插件生态调研后修正，2026-09-07 晚按 §3.0 硬约束再修口径）**：原判「7 项都要自做」**部分降级**——
>
> - **降为「借鉴自实现」3 项**：长期记忆语义化（社区方案比现有实现更完整，且技术栈同构）、知识库、云端**多端接入**（云侧部署与租户隔离仍自做）。**降级含义**：省的是**设计试错**（schema 怎么定、检索怎么融、时间上下文怎么表达、历史记忆按不可信注入），**不省实现与维护**——代码进我们仓库、走我们的测试，或 fork 后按我们语义改造（§3.0）；
> - **仍需自做 4 项**：用户画像 / 单人形态 / 每会话文件沙盒 / 回收站
> - **用户画像确认真空**（双重印证）：DSH `identity/` 无个人维度 + 社区 Identity & Communication 分类**仅 12 个插件（25 分类中最少）**→ 这是 LarryAgent 真正的差异化所在，无人替我们做

### 3.4 DSH 自身风险（事实校准后）

| 风险 | 事实 | 应对 |
|---|---|---|
| **已知性能回退 + pre-stable API** | 最新 release 官宣性能回退（下一版本修复）；AGENTS.md「Public APIs are pre-stable; update every consumer」——破坏性变更常态化 | 升级 SOP 见下；**性能回退修复为升级首触发条件** |
| ~~**Windows 非一等平台**~~ → **已推翻** | 本地确认 `packages/sandbox/sandbox-windows-acl/` **存在**；README 明示 Windows 后端 = **restricted token**，另有 2026-08-08 决策记录（选 raw ACL restricted token 而非 mxc / AppContainer）；`sandbox-local/` 三平台后端并列（Linux bwrap→Landlock / macOS Seatbelt / **Windows restricted token**）| 风险**下调**：Windows 有一等写入限制后端（三档策略 + 用户批准的一次性提权）。仍待阶段 2 在本机**实测** restricted token 实际生效性；未实测前不升 ✅ |
| **沙箱为同世界隔离**（新增）| `sandbox/` README 原文：「Confinement is **same-world only**: it shares the host kernel and filesystem」——非容器 / microVM 级 | 接受该上限：防误操作 / 防越权写入，**不防恶意代码**；与 `SAFETY.md`「do not guarantee isolation」一致 |
| **上游集中度** | DSH 是 DeepSeek 单一厂商对 harness 形态的主张，与同类（Claude Code / Codex CLI / Cursor）哲学各异；换底座 = 运行时框架层不可换（与模型层"多服务商可换"哲学方向相反）| **保留 sdk / acp profile 接入面作为脱钩通道**——DSH 走偏时核心逻辑可退到独立进程，DSH 只剩协议层；MIT + TS 保证最坏可 fork 自维护 |
| **项目长期可持续** | 高频 commits / 仍在合并 PR / DeepSeek = 行业第一梯队；`SAFETY.md` 明示**尚未接受安全审计，沙箱不能保证隔离** | 有积极信号但未到稳定预期；定期跟踪 |
| **方向不对齐** | DSH 全栈编码向（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`），LarryAgent 单人私人助理 | 长期需自做产品差异化（7 项见 §3.3）|
| **跨语言切换** | DSH = TypeScript，LarryAgent 后端 = Python FastAPI | A 路径下后端整体改 TS；保留部分 Python 脚本（数据迁移等）。**⚠️ 若走 Python SDK 路径（§3.5 新发现）则本风险归零**——后端保持 Python，经 stdio JSON-RPC 驱动打包运行时 |
| **生态繁荣但质量参差**（**前判"生态早期"已推翻**，见 §2 插件生态行）| 3,199 插件 / 25 分类，但 UI·主题类占 640+（大量玩具）；个人作者为主，弃坑风险高 | **可借鉴模板 + 选择性直装**；选型看：最近更新时间 / 是否声明适配版本 / 作者维护活跃度。**不把关键能力押在单人作者插件上** |
| **插件版本漂移** | DSH preview 期 API 频繁变动，插件作者跟不上（已有插件标注 "verified against DSH 0.1.0-rc.6"，而锁定版为 `0.1.2-rc.1`）| 因 §3.0 **不直装**，本风险对**产品运行时不成立**（我们不依赖插件跟上 DSH）；仅影响**参考时效**——借鉴时标注其验证版本，fork 代码须按锁定版 `0.1.2-rc.1` 重验 API。DSH 升级时**不产生插件兼容性回归项** |
| **第三方插件安全** | SAFETY.md 明示：沙箱、审批与权限控制**不能保证隔离**（未接受安全审计）| 第三方插件视为**不可信代码**：先读源码再装；涉及凭据 / 文件 / 网络的插件尤其谨慎 |
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
> 若成立，则 §3.4「跨语言切换」风险**归零**——**后端不必改为 TypeScript**（现有 8,830 行 Python 保留），且**不经 git 源码**（`pip install` 即可，无 Windows checkout 问题）。这相当于把 A 的收益与 C 的低成本同时拿到。
>
> **尚未实测**：能力边界（长期记忆 / 角色 / 工具挂载如何通过 SDK 暴露）、Windows 下实际可用性、性能开销。**列为阶段 2 必测项**（§3.7）。未实测前 A 拍板不变。

### 3.6 A 路径实施规划

**总思路**：LarryAgent 后端从 Python 切换到 TypeScript + DSH 框架。**意味着**：现有后端核心非测试代码（~3.7–4.4k 行，统计口径见 §3.7 备注）翻译为 DSH 插件/服务形式。**保留**：SQLite schema、SQLite 双写（作为 DSH 插件挂载）、业务核心逻辑（角色 config、工具实现）。

**双轨并行（迁移期可用性保障）**：旧 Python 后端在阶段 6 验收通过前**保持可用、可回退**，阶段 6「功能等价」通过后才切换——迁移期间老大作为用户不失去 LarryAgent（产品树口径「已做 = 用户可达」）。

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
| 2.3.5 主动触达 🗣️ | 自做为主 | DSH `webhook/`（待核）可作外部触发抓手 |
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
- [ ] **升级 SOP 节拍**：跟 release tag（保守，锁定期演进红利归零）vs 跟 master HEAD（激进，拿红利背 alpha 波动）——二选一写死
- [x] **克隆 DSH 代码方案**：**已定并已完成**——`ref/dsh-bare/`（项目根独立目录，`.gitignore` 排除，不入 git），锁定 release tag `dsh-v0.1.2-rc.1`
- [ ] **阶段 3 prototype 派发**：Trae / Claude 分工与节奏
- [ ] **阶段 4 差异化能力优先级**：哪些先做、哪些等（承接总表已给出"用户感知优先"初排，可否决）

**待校准（阶段 2 五项实测，见 §3.6）**：
- [ ] **【新增·最高优先】Python SDK 实测**：`pip install deepseek-harness-sdk deepseek-harness-runtime-bin` → Windows x64 下启动 `dsh --profile sdk` 子进程 → 验证 JSON-RPC 连通、能力暴露边界（长期记忆 / 角色 / 工具挂载如何经 SDK 访问）、**是否真的无需系统 Node.js**、进程开销。**此项结果直接决定 A 是否被取代**
- [ ] `storage/` 外接 SQLite 可行性
- [ ] `acp/` 契约稳定性
- [ ] Windows 端 `ctx.sandbox` provider **本机实测**——后端已确认存在（restricted token + `sandbox-windows-acl/`），待验**实际生效性**与提权流程
- [ ] Vue/Tauri → sdk profile 连通
- [ ] TS bge-small-zh embedding 与 Python 侧向量漂移比对

**待核（包归属定位，不阻塞拍板）**：
- [ ] **【新增·改为借鉴调研】插件生态借鉴清单**（对应 §3.3 降级的 3 项，**按 §3.0 只借鉴、不直装**）：Memory 分类 149 个中筛 3–5 个候选（重点 `dsh-memory-connect` / `dsh-auto-memory` / `dsh-project-memory` / ReMe），产出**可借鉴点清单**（schema 设计 / 检索融合 / 时间上下文建模 / 信任模型 / 已知陷阱），**不是"选哪个装"**；知识库与多端接入同理。评估维度改为 **设计可参考性 + 代码可读性 + 与本项目语义贴合度 + fork 改造量**；**删除**"作者维护活跃度 / 最近更新"维度（我们不再依赖其维护，仅作参考时效性标注）
- [ ] **【新增】借鉴 / fork 代码纳入规范**（§3.0 配套，待老大定）：进库位置（独立 `vendor/` 目录 or 按能力模块落地）、upstream 出处与 license 标注格式（保留原声明）、改造后须过本项目测试与命名规范、与自研代码的边界标识
- [ ] **【新增】§3.0 是否升格为项目级原则**：目前落在本文档；是否写入 `docs/ai-governance.md` 作为跨阶段通用约束，待老大定
- [x] DSH 身份语义归属——**已核**（本地）：`identity/` 存在，语义为共享匿名 correlation id，**非用户画像**
- [ ] DSH 搜索/抓取能力归属（原"`web/` 替换 Brave"证据不足，web_search 暂保留自实现）
- [ ] `webhook/` 包核实（config-catalog 无条目 vs 主仓搜索命中，两源冲突）

**待执行（启动信号是本节）**：
- [x] clone DSH → **`ref/dsh-bare/`**（不入 git）——**已完成**，锁定 `dsh-v0.1.2-rc.1`（裸仓库按 tag 直读，无工作区）
- [ ] 跑通官方 demo（确认环境）

**体量口径备注**：后端核心非测试代码行数存在三个统计口径（Trae 3653 行/36 文件、Claude 4442 行、WB 3926 行——差异在根文件与目录统计口径），量级一致（个人级小项目），精确口径由阶段 1 收口。

---

## 4 变更记录

> 此表内部分章节引用和编号可能过时，部分讨论过程中使用的章节可能已删除，此表不再修改

| 日期 | 变更 | 作者 |
|---|---|---|
| 2026-09-06 | 开稿：事实画像 + 上次判断检验 + 四路径 + 风险 + 待定项 | WB |
| 2026-09-06 | 补项目情况简介（含记忆系统双写结构、5 角色清单） | 老大 |
| 2026-09-06 | QoderWork ≠ Qoder 澄清；§2 定位修正为「架构通用、开箱偏编码」+ 补 compaction/ACP/子代理/多模型 | WB |
| 2026-09-06 | **基准切换：八项 → README 定稿 14 条**。§一 重写为 14 条基准 + §1.1 四个真缺口 + §1.2 QoderWork 澄清；§三 重写为 14 条完整对照 | WB |
| 2026-09-06 | **重启评估（基于 31 子项）**：老大给出"业余项目造几个月不如开源"框架。WB §十 给出一句话结论 + 三块承接对照 + 路径推荐（C）。暂存待审 | WB |
| 2026-09-06 | **清理旧对照**：删除原 §三 14 条对照 / §四 上次判断检验 / §五 A/B/C/D 表 / §七 待老大砸实 / §八 成本模板 / §九 调研待办；§九 中两条独有项并入 §三.4。当前评估从 §十 移入并改编号为 §三.1–3.7 | WB |
| 2026-09-07 | **路径反转 C → A**（重大评估反转）：①老大三条立论推翻 C 路径优势；②WebFetch 直接查 DSH 主仓事实校准——版本 `0.1.3-alpha.1` / packages 54 个 / AGENTS.md 零论述 cloud / `identity/` 共享匿名；③§三 整体重写为"A 路径决策 + 实施规划"（阶段 1–6）；§二 版本号与包数同步；文首加"✅ A 路径拍板" | WB |
| 2026-09-07 | **删除项目简介 + 去时间节点**：按老大裁定删 §零（项目必须由能读代码的 AI 评估，其他 AI 是"凑热闹"级意见）；删各阶段耗时估算与总耗时估算；删"> 1 周"卡死判定；保留 commits 数作为活跃度信号 | 老大 |
| 2026-09-07 | **两段式重构**：按 `../docs/product-positioning.md` 同款两段式重组——结论区（§1/§2/§3，WB 维护）+ 变更记录（§4）+ 决策追溯记录（§5，提议 / 处理 / 备注 三列表格）| WB |
| 2026-09-07 | **第 1 轮综合（四方意见落实）**：Trae 7 点 / Claude 7 点 / Qoder 6 点 / Marvis 6 点 → §2 包数口径修正（54 → 37 家族/72 包，config-catalog 实测）+ 版本叙事纠错（删"rc→alpha 倒退"，改性能回退官宣）+ §3.1 口径改写（"能力 100%"→"底座 8 子项开箱 / 语义 23 项自做"）+ 哲学桥接句 + §3.2 虚焊包处理（identity/subagent/workflow/web/python 删或待核）+ §3.4 风险表重构（性能回退/Windows 二等/上游集中度/升级 SOP）+ §3.6 双轨并行/前端路线/测试四层重建/阶段 2 五项实测/31 子项承接总表 + 两处旧号修正（1.3→2.3.3）。整理记录见 §5.3 | WB |
| 2026-09-07 | **DSH 代码本地化 + 来源标注体系（老大拍板）**：clone 至 `ref/dsh-bare/`（`.gitignore` 排除、不入 git），锁定 release tag `dsh-v0.1.2-rc.1`（分支 `pin/0.1.2-rc.1`）；§2 表加**来源列**（🟢 本地代码 / 🟡 官方源 / 🔴 推断未验证，🔴 **不得作结论依据**）；新增 §2.2 查阅指南（含三条踩坑：勿用工作区 `ls` 判包存在 / 勿拿 config-catalog 当包清单 / 嵌套子包不在顶层）。**本地实证推翻第 1 轮"虚焊"结论**：`identity/` `subagent/` `workflow/` `web/` `storage/` **均存在**（仅 `python/` 无）；`sandbox-windows-acl/` 存在 → **"Windows 非一等平台"风险推翻**（一等 restricted token 后端），新增"同世界隔离"为真实限制；包数口径统一为本地实测 **50 个顶层包目录**（"54"/"37 家族 72 嵌套"两口径作废）；补 star 213,914 / fork 25,168（API 直读）；SAFETY.md 原文补入 | WB |
| 2026-09-07 | **本地副本改用裸仓库**：原 `ref/dsh/`（带工作区）checkout **卡死 5.5 小时未完成**（9,080 文件 + Windows 实时防护逐文件扫描，残留 2451 项、git 进程僵死），废弃；改用 `ref/dsh-bare/` **裸仓库**（`git clone --bare`，**零工作区文件写入，44 秒完成**），`ls-tree / show / grep / tag` 直读能力完全等价。§2.2 重写为裸仓库查阅指南（命令加 `-C ref/dsh-bare`）+ 新增「按需局部检出」（只写单包，避免重现卡死）+ 第 4 条坑「Windows 下勿做整体 checkout」。旧目录 `ref/dsh/` 删除被本机批量删除保护拦截，**需老大手工删**（已删） | WB |
| 2026-09-07 | **重大发现：官方提供 npm + PyPI 双分发（动摇 A 的核心成本项）**：①npm **`@deepseek-ai/dsh`** 真实发布（latest `0.1.2-rc.1`，与锁定版一致；此前查 `deepseek-harness` 得 0.0.1 占位包是 dsh-tui 的占位、**scope 名查错**导致误判"无 npm 发布"）；②仓库**根** `python/`（不在 `packages/` 下——前判"`python/` 不存在"是按 `packages/` 顶层判断的**错判**，已修正）是官方 Python SDK：`deepseek-harness-sdk`（纯 Python，any 平台）+ **`deepseek-harness-runtime-bin`**（`0.1.2rc1`，**把 dsh CLI 与整个 Node 依赖树打包为原生可执行文件，SDK 使用无需系统 Node.js**；Linux x64/arm64 · macOS arm64 · **Windows x64** 均有 wheel，无 Windows arm64）。**影响**：Python 后端经 stdio JSON-RPC 驱动打包的 `dsh --profile sdk` 子进程即可获 DSH 能力 → **后端不必改 TypeScript**（8,830 行 Python 保留）、**不经 git 源码**（`pip install` 即可，无 Windows checkout 问题）、§3.4「跨语言切换」风险归零。§3.5 加提示框标注"可能优于已拍板的 A，**未实测前 A 不变**"；§3.4 跨语言行加注；§3.7 新增「Python SDK 实测」为**最高优先**待办；顺修 §2.2 清理提示中被批量替换误改的目录名 | WB |
| 2026-09-07 | **插件生态调研（老大提出"社区插件可省很多工作"——证实且超出预期）**：社区精选列表 `awesome-dsh-plugin/awesome-dsh-plugin`（**14.7k star**，README 909 KB）共 **3,199 个插件 / 25 分类**；官方安装 `dsh plugin add`（插件声明 `dsh.bundle` manifest）+ 插件市场 `dsh-market`（一键安装/升级）。强相关分类：Tools 425 / Sessions 201 / Workflow 190 / **Memory 149** / Skills 135 / Models 130 / Security 108 / **Remote & Mobile 89** / **Identity 仅 12（25 分类中最少）**。**修正 §3.3**：长期记忆 / 知识库 / 云端**多端接入** 三项**从"自做"降为"选型+适配"**——`dsh-memory-connect` = SQLite FTS5 + **bge-small-zh-v1.5 本地 embedding** + RRF 融合 + 时间上下文图（valid_from/valid_until/supersedes）+ 信任模型（召回历史按不可信参考注入），**与 LarryAgent 现有技术栈与既有设计几乎同构且更完整**；仍需自做 4 项（用户画像 / 单人形态 / 每会话文件沙盒 / 回收站），**用户画像双重印证为真空**（DSH 无个人维度 + 社区 Identity 分类最少）。§3.4「生态早期」风险**推翻**，改写为三条（质量参差 / 插件版本漂移 / 第三方插件安全）。§2 加插件生态行；§3.5 A 收益加"插件生态红利"；§3.7 加「插件选型调研」待办 | WB |
| 2026-09-07 | **老大拍板硬约束 §3.0「第三方引入原则」——只借鉴、不直装**：老大立论「现象级爆发的插件必然伴随大量跟风项目无人持续维护」，故**社区 / 第三方插件一律不直接纳入为运行时依赖**；**即使企业级维护的插件也不直装**，倾向 fork 后自改造或参考其代码自己实现。允许三种用法：读源码借鉴设计 ✅ / fork 后自改并纳入（代码进本仓库、维护责任归我们）✅ / 隔离环境临时装跑 prototype ✅；**禁止** `dsh plugin add` 后作为产品依赖 ❌。**边界澄清（防误伤 A 路径）**：本原则针对**插件 / 第三方扩展**；DSH **底座本体是框架依赖不是插件**，兜底是 MIT + TS 可 fork 自维护——「依赖可接手的底座」与「依赖不可控的插件」风险性质不同。**连带修正**：§3.3 三项降级口径「选型+适配」→ **「借鉴自实现」**（省设计试错，不省实现与维护）；§3.4 三行改写（质量参差→只借鉴不直装 / 版本漂移→对运行时不成立仅影响参考时效 / 第三方安全→大幅下降）；§3.5 A 的"插件生态红利"重述为**设计红利**；§3.7「插件选型调研」改**借鉴调研**（删"作者维护活跃度"维度）+ 新增「fork 代码纳入规范」「§3.0 是否升格项目级原则」两条待办；§2 插件生态行加用法约束注记。追溯见 §5.4 | 老大 / WB |

---

## 5 决策追溯记录

### 5.1 整理记录（第 1 轮 · C → A 反转触发）

> **第 1 轮性质**：老大预告"准备上压力、一条一条拆你的立论底座"，随后给出三条立论：①项目非常小、推翻重做其实也花不了几天（拆"跨语言是大头"）；②目前本项目几乎没有什么专属能力、绝大部分都在计划中、已有的都没经过深度优化仅跑通层面（拆"专属能力是大头"）；③DSH 是核心/底座且在不断进化、用上 DSH 会避免闭门造车、省掉优化功夫、版本迭代代表业界方向（升维度：从代码工作量 → 能力建设 + 信息流接入）。

| 提议 | 处理 | 备注 |
|---|---|---|
| 项目小是事实 | 采纳 | 后端核心非测试 ~3926 行 / 55 文件，确实个人级项目体量 |
| 跨语言切换是"零成本" | 部分采纳 | "跑起来"短期可成；"跑得好"还需投入；总周期不算 1-3 个月量级 |
| 专属能力是大头 | 拆掉 | 大部分 ✅ 薄薄一层（角色 = config + system_prompt；多模型 = 配置切换；工具 = BaseTool + registry）；📐🗣️ 还没动；估算下调 |
| 能力建设 / 信息流接入维度 | 采纳 | C 路径 drift 成本未算 + DSH 演进代表业界方向是真信号 + 省掉优化功夫是真收益 |
| **立论累积效应** | C → A 反转 | 三个维度都赢 A，单维度"C 优于 A"不再成立 |
| **事实校准**（WebFetch DSH 主仓）| 关键反转触发 | 版本 `0.1.3-alpha.1` / packages **54 个** / AGENTS.md 零论述 cloud-multi-user-tenant / `identity/` = 共享匿名身份 |
| **新结论** | A 强推 / B 不推 / C 备选（仅适用等 DSH GA）/ D 不推 | 接入后能力 100%，C "借思路"做不到这一层 |

### 5.2 整理记录（第 2 轮 · 两段式重构）

> **第 2 轮性质**：老大要求按 `../docs/product-positioning.md` 同款两段式重写本稿；同时裁掉项目简介（必须由能读项目代码的 AI 评估）与时间节点描述（项目时间没那么重要）。

| 提议 | 处理 | 备注 |
|---|---|---|
| 按两段式（结论区 + 讨论区）重写 | 采纳 | §1/§2/§3 结论区（WB 维护）+ §4 变更记录 + §5 附：决策追溯记录 |
| 删除项目简介（§零）| 采纳 | 老大裁定：本稿工程决策必须由 Trae / Claude 评估，其他 AI 限于通用判断、属"凑热闹"级意见；记忆系统双写结构 / 5 角色清单等内容不再属本稿范围 |
| 去掉时间节点相关描述 | 采纳 | 删除：DSH 创建日期 / "3 天前合并 PR" / "近期重点" / 来源时间戳 / 各阶段耗时估算 / 总耗时估算 / "> 1 周"卡死判定；commits 数作为活跃度信号保留 |
| 14 条旧基准是否保留 | 保留 | 作为追溯材料（已升格为 8 域 / 31 子项能力树）|

> **讨论区现状**：本稿两段式按 product-positioning.md 标准建；讨论区目前只有 WB 整理的两张记录（§5.1 / §5.2）。**其他AI 可针对 §1–§3 结论区表态「同意 / 有异议」**，有异议在各自区块下补充。

### 5.3 整理记录（第 1 轮综合，结论已并入结论区）

> **本轮性质**：四方（Trae 实现 / Claude 测试 / Qoder 编外复核 / Marvis 产品）对两段式重构后的结论区表态，**四方一致同意 A 路径**，分歧仅在口径与执行细节。WB 逐条核实后落实（关键争议均以本地文件或官方源复验，不采信单方声明）。

| 提议 | 处理 | 备注 |
|---|---|---|
| **Trae 七点：能力树编号引用是旧的，应改 7.2/5.1/6.2…** | **不采纳（方向反了）** | Claude 零点 / Qoder 二点 / Marvis 一点三方独立核实 + WB 本地验证：dsh 稿引用的 2.9.2/2.7.1/2.8.2/2.5.3/2.10.x 与产品树定稿版一致；Trae 建议的恰是重构前旧号 |
| **Marvis 抓的两处旧号残留（HUMAN 待办 1.3 / 1.3 与 2.3.1）** | 采纳，已改 | 沙盒 → 2.3.3（§3.3 表 + §3.6 阶段 4 表）；Claude/Qoder 核主引用时漏掉，Marvis 补获 |
| **Trae 一点："能力 100%"是口径错误** | 采纳，已改 | §3.1 改为"底座能力开箱 / 产品语义层自做"；Qoder 从事实层（虚焊包）、Marvis 从子项级（8 开箱 / 23 自做）双重加固 |
| **Qoder 一点：§2/§3.2 包清单虚焊** | **采纳并复核证实** | WB 用官方 config-catalog 再复核：identity/subagent/workflow/web/python 均无实锤（identity 系我上一轮 WebFetch 幻觉）；storage/llm-retry/webhook 主仓命中；§3.2 已删 `web/` 行、subagent/workflow 改 experimental 归属 |
| **"54 个包"口径不严谨（Qoder）** | 采纳，已改 | 实测 **37 顶层家族 / 72 嵌套包**（Qoder 数 33 也偏少，WB 以 config-catalog 为准）；来源口径写入 §2 |
| **Claude 四点：`sandbox-windows-acl` 包存在** | **未证实** | Qoder 复核 + WB config-catalog 复核均未命中；Trae 二点"Windows 无强隔离 provider"更接近事实，但保留"阶段 2 实测"口径 |
| **Marvis 五点：0.1.3-alpha.1 官宣性能回退** | **采纳并复核证实** | releases 页原文确认："本版本存在一项已知的性能回退…我们将在下一个版本中修复"；升级首触发条件已改为性能回退修复 |
| **WB 自查：原"版本号倒退（rc→alpha）警示"叙事** | **自我纠错，已删** | 我上一轮把 release 快照与 master 开发版号两条线混拼；release 序列实为 0.1.2-alpha.3 → 0.1.2-rc.1 正常收敛。§2 版本行重写为双线口径 |
| **Trae 四点 + Qoder 三点：锁版本与立论③矛盾，需升级 SOP** | 采纳，已改 | §3.4 新增升级 SOP：跟 release tag、升级必跑 replay+P4、首触发=性能回退修复、锁定期成本承认；**节拍二选一提请老大拍板**（§3.7）|
| **Trae 二点：sandbox 收益在 Windows 端侧不成立** | 采纳 | §3.4 风险表"Windows 非一等平台"行 + 阶段 2 实测项③；不过则端侧沿用现有护栏不升 ✅ |
| **Trae 三点：embedding 不可平移，须全量重嵌** | 采纳 | 阶段 4 显式任务：重嵌 + 同文本向量漂移比对 + 召回等价抽样（Marvis 四点补验收标准）+ 语义字段不降级；历史会话不进 DSH session 格式 |
| **Trae 五点：前端路线提前到阶段 2 定死** | 采纳 | §3.6 前端路线块：保留 Vue/Tauri 走 sdk/acp profile；阶段 2 退出条件④ |
| **Trae 六点：webhook 是 1.5 主动触达抓手** | 留待核 | config-catalog 无条目 vs 主仓命中 README，两源冲突（§3.7 待核）|
| **Trae 七点：阶段 2 退出条件扩 5 项** | 采纳 | 五项实测：storage 外接 / acp 契约 / Windows sandbox / sdk 连通 / embedding 漂移比对 |
| **Claude 一点：测试资产被低估（4388 行，1:1）** | 采纳 | §3.6 总思路标注"测试资产是独立工作包"；隔离基建前移到阶段 2 |
| **Claude 二点：mock 层应被 snapshot replay 取代而非翻译** | 采纳（本轮测试侧最重要）| 阶段 6 改"按 DSH 四层重建"：mock-LLM 不翻译走 record→replay；`--real-api` 语义 DSH 原生有 |
| **Claude 三点：验收扩为五层** | 采纳 | 五层验收已入阶段 6 |
| **Qoder 风险 1：上游集中度** | 采纳 | §3.4 新增风险行；应对 = 保留 sdk/acp 接入面为脱钩通道 |
| **Qoder 风险 2 + Marvis 六点：哲学一致性桥接** | 采纳 | §3.1 加"底座重 ≠ 产品重"段（融合两方表述）|
| **Qoder 五点：底座红利是开发者的，排序应用户感知优先** | 采纳 | 阶段 4 排序原则：画像/知识库前挪（记忆后第二三位）|
| **Marvis 二点：31 子项 × 承接方对照表** | 采纳 | 已入 §3.6 承接总表（阶段 4 验收基准）；逐行核对产品树编号后收录 |
| **Marvis 三点：迁移期能力空窗** | 采纳 | §3.6 双轨并行块 + 阶段 3 退出条件改"核心链路达 P4 等价" |
| **Marvis 四点：记忆是活迁移非数据搬运** | 采纳 | 并入阶段 4 记忆迁移任务行（重嵌 + 抽样 + 字段不降级 + 优先级记忆>会话）|
| **Qoder 编外身份** | 不排斥 | 老大本轮实际指定 Qoder 参与，§5.2"暂不留口"一行已被实践推翻；各方意见均按内容质量处置，不按身份 |

### 5.4 老大拍板记录（2026-09-07 · 第三方引入原则 → §3.0）

> **本轮性质**：老大在插件生态调研结论之后追加约束——**先肯定生态价值，再否认"直装"这条使用方式**。这是对 §3.3 降级结论的**方向性收口**：降级仍然成立（有参考实现可抄），但落点从"拿别人的代码用"改为"拿别人的设计用"。

| 提议 | 处理 | 备注 |
|---|---|---|
| **只可借鉴，不可直接纳入**（跟风项目无人维护，风险高）| 采纳，升为 §3.0 硬约束 | 置于 §3 开头并声明"优先于本节其余结论"；三种允许用法 + 一条禁止项列表化 |
| **即使企业级维护的插件也不直装，倾向 fork 后自改造 / 参考代码自实现** | 采纳 | fork 后纳入 = 代码进本仓库 + 维护责任归我们，须过本项目 review / 测试 / 命名规范 |
| **WB 补充：本原则不得被误用推翻 A 路径** | 采纳，写入 §3.0 边界段 | 区分「框架依赖（DSH 底座，MIT 可 fork 兜底）」vs「插件 / 第三方扩展（不纳入）」；两者风险性质不同 |
| **连带：§3.3 三项降级口径** | 改为「借鉴自实现」 | 长期记忆 / 知识库 / 多端接入；省的是设计试错，不省实现与维护 |
| **连带：插件版本漂移风险** | 重新定性 | 不直装 → 对**产品运行时不成立**，仅影响参考时效（借鉴须标注其验证版本，fork 代码按锁定版 `0.1.2-rc.1` 重验 API）；DSH 升级不再产生插件兼容回归项 |
| **待老大定**：借鉴 / fork 代码的进库位置与 license 标注格式；§3.0 是否升格到 `docs/ai-governance.md` | 列入 §3.7 | 目录归属与跨阶段属性属归属判断，不自作主张 |

---

# 讨论区

## 老大

- 目前没必要过于详细讨论具体某个插件的价值，我们要面对的是几千个，甚至一段时间之后是几万个插件，我们取其精华去其糟粕，我们有足够的素材，我们不可一叶障目

## Trae

**第 2 轮表态（2026-09-07，实现方视角）**

**总评：文档质量跃升，我第 1 轮七点全部被处理且口径我认可。** 来源标注体系（🟢/🟡/🔴）+ 裸仓库查阅方式是关键基建——杜绝了第 1 轮基于网页推断的"虚焊"错判。本轮聚焦三个实现侧新增判断。

### 一、Python SDK 路径：实现方的首选表态——这可能改变 A 的落地形态

§3.5 新发现的 `pip install deepseek-harness-sdk` + `deepseek-harness-runtime-bin` 是**我作为执行人最关心的条目**。如果成立，它意味着：

- **后端 3653 行 Python 保留不动**，跨语言切换风险（§3.4）归零——我上轮提的第 4 点矛盾自动消失
- **不经 git 源码**（`pip install` 即可），Windows checkout 卡死问题不存在
- DSH 能力经 stdio JSON-RPC out-of-process 驱动——我们的 `memory/archiver.py`、`db/crud.py`、`services/chat_service.py` 全部保留，只是在 `chat_service` 的调用点替换为 JSON-RPC 调 DSH 的 `--profile sdk` 子进程
- **双轨并行（§3.6）天然成立**——旧 Python 后端全程不动，DSH 作为子进程挂上去，切换 = 改调用点，回退 = 改回来

**但有一个实现侧的硬约束必须在阶段 2 实测**：`--profile sdk` 暴露的是 DSH **底座能力**（compaction / sandbox / session / mcp / interaction），我们的**产品语义层**（记忆双写、角色 preset、知识库、回收站）能否通过 SDK 的 plugin mount 机制注入到子进程里？从 architecture.md 看，plugin 装载在 DSH 运行时内，Python SDK 只是客户端——**如果 plugin 只能从 DSH 侧（cordis.yml / `dsh plugin add`）挂载，而我们的业务逻辑在 Python 侧，就会产生"语义层在 Python、底座在 DSH、两者经 JSON-RPC 桥接"的分裂架构**。

这是 Python SDK 路径的**成败前提**，比"能否启动子进程"更重要。建议 §3.7 待办中「Python SDK 实测」**明确加一条**：验证 plugin mount 路径——我们的自做插件（记忆/角色/工具）是挂在 DSH 子进程内（TS 写插件），还是挂在 Python 侧经 JSON-RPC 暴露给 DSH？前者 = 仍要写 TS 插件（跨语言风险只是从"全改"降到"部分写"），后者 = 需要确认 SDK 是否支持 remote plugin mount。**这条不过，Python SDK 路径省的不是跨语言成本而是换了个形态的跨语言成本。**

### 二、Windows sandbox：我上轮判错了，本地实证推翻，认

我第 1 轮判断"Windows 无强隔离 provider"——**错了**。本地 `git ls-tree` 确认 `packages/sandbox/sandbox-windows-acl/` 存在，README 明示 restricted token + ACL 写入限制 + 三档策略 + 一次性提权。我上轮的判断基于 AGENTS.md 包布局描述中 `native/` = Landlock（Linux 专用）这一事实，但没有访问到嵌套子包 `sandbox-windows-acl/`——正是 §2.2 四条踩坑的第 3 条"嵌套子包不在顶层"。**这恰恰证明了裸仓库 + 来源标注体系的必要性。**

同世界隔离（shared kernel/filesystem）作为真实上限，我认可——与我们 5.1 的护栏立场一致（防误操作 / 防越权写入，不防恶意代码）。阶段 2 实测项③的口径从"验证后端是否存在"改为"验证 restricted token 实际生效性"，正确。

### 三、§3.0 只借鉴不直装：执行面补充

老大 §3.0 拍板，作为实现方完全同意。补充一个执行细节：**`dsh-memory-connect` 的借鉴价值需要校准**——§3.3 描述它"SQLite FTS5 + bge-small-zh-v1.5 本地 embedding + RRF 融合 + 时间上下文图 valid_from/valid_until/supersedes + 信任模型"，与我们的技术栈（SQLite + ChromaDB + bge-small-zh-v1.5 + 时间上下文专题讨论稿中的 occurred_at_start/end）**确实几乎同构且更完整**。但按 §3.0，我们借鉴的是**设计**（schema 怎么定、RRF 怎么融、信任模型怎么表达），不是代码——**fork 其代码后必须按我们的 SQLite schema（`memories` 表的 `is_active` / `last_hit_at` / `source_role` 字段）改造**，否则记忆双写的语义层会降级。
【老大注：目前没必要过于详细讨论具体某个插件的价值，我们要面对的是几千个，甚至一段时间之后是几万个插件，我们取其精华去其糟粕，我们有足够的素材，我们不可一叶障目】

建议 §3.7「借鉴调研」待办加一条产出要求：**借鉴清单的最终形态是"设计差异表"**——列出 `dsh-memory-connect` 等候选与我们现有实现的逐项对比（schema 字段 / 检索策略 / 时间建模 / 信任模型 / 已知陷阱），而不是"选哪个 fork"。这样阶段 4 实现时直接对照差异表做增量改造，不用回头再读社区插件源码。

### 四、承接总表核对：31 子项逐行过了一遍

§3.6 承接总表作为阶段 4 验收基准，我逐行核对了产品树编号与承接方：

- **2.4.1 短期记忆 = DSH session + compaction 承接**——认可，但注意：compaction 替代的是 `token_counter.py::truncate_messages`，**我们的 `build_memory_context` 注入逻辑不在 compaction 管辖内**，需要自做注入层挂到 DSH 的 `agent/pre-step` 事件上（architecture.md 明确 `agent/pre-step` 可 rewrite claimed messages）。承接表可加一句注记。
- **2.9.1 时间感知 = 自做**——正确，时间上下文专题的"便宜层 1（注入绝对时间）"恰是挂在 `build_memory_context` 上，与上一条同链路。
- **2.4.3 记忆可管理 = 自做，"硬删语义产品层已裁定"**——确认：我上轮提的"API 层未暴露 `deactivate_memory`"问题在迁移后**有机会一并修**（新 API 层从零写，直接暴露软删 + 硬删两档）。
- **2.5.2 工具挂载 = DSH 工具管道替换，shell/file_ops 翻 TS 插件**——注意：如果走 Python SDK 路径（§3.5 新发现），工具插件是否必须用 TS 写？如果 DSH 的 `ctx.tools` 只接受 TS 插件，那 shell/file_ops 的翻译不可避免——**这与"跨语言风险归零"的口径有张力**。这条与第一条的 plugin mount 路径问题是同一个根，建议合并为一条实测项。

### 五、积极面

文档已经非常扎实，我上轮的 4 个问题（口径错误 / Windows sandbox / embedding 平移 / 锁版本矛盾）全部被处理，且处理方式比我预期的更彻底——尤其"升级 SOP 取代锁版本"和"测试资产独立工作包 + snapshot replay 取代 mock"两条，从实现侧看是降本的实际改进，不是文字游戏。

**结论：同意当前结论区，无结构性异议。** 唯一的执行侧硬约束是第一条：Python SDK 路径的 plugin mount 机制实测——这决定 A 落地后我们是"全 TS"还是"Python + TS 混合"，影响阶段 3-4 的全部派发。建议此条列为阶段 2 实测的**第 0 项**（优先于现有 5 项），因为它的结果可能让现有 5 项中的第 5 项（TS embedding 漂移比对）变得不必要——如果走 Python SDK，embedding 可以留在 Python 侧不用迁。

## Claude

**第 2 轮表态（2026-09-07，测试方视角）**

**总评：文档质量跃升，我第 1 轮七点全部被处理且口径我认可。** 本轮聚焦 Python SDK 新发现（§3.5）对**测试策略的颠覆性影响**——这是我作为测试方必须抢先指出的：若 Python SDK 路径成立，我第 1 轮"测试资产需翻译/重建"的核心判断**前提消失**，阶段 6 策略要从"重建"回摆为"保留 + 增补"。

### 一、Python SDK 路径下，测试资产从"重建"变"保留 + 增补"（我第 1 轮判断的前提更新）

我第 1 轮的核心判断是"4388 行 pytest 测试 + conftest 基建不可平移，须按 Vitest + DSH 生态重建"。**该判断隐含前提是"后端整体改 TS"**。若 Python SDK 路径成立（§3.5）：

| 资产 | 全 TS 路径 | Python SDK 路径 |
|---|---|---|
| pytest 测试 4388 行（19 文件）| 翻译/重建 | **原样保留**（业务逻辑仍在 Python，mock 测试仍有效）|
| conftest 隔离基建（临时库 / fail-fast / 占位符）| 重做 | **原样保留**（含踩坑沉淀：conftest 翻车教训 / 卡顿之谜 / 污染修复）|
| mock 覆盖不到清单 | 被 snapshot replay 取代 | **保留**（Python 业务层 mock 仍为主；snapshot replay 只覆盖 DSH 子进程内部）|
| 前端 Vitest 58 项 | 平移保留 | 平移保留（不变）|
| **新增测试面** | — | **JSON-RPC 边界契约测试**（Python 侧 ↔ dsh 子进程：协议 / 错误语义 / 超时 / 子进程崩溃恢复）|

**含义**：若走 Python SDK，阶段 6 从"按 DSH 四层重建验收"进一步简化为**"原测试矩阵保留当回归基线 + 增补边界契约测试层"**——工作量从"重建 4.4k 行"降到"增补 1 层"。测试隔离事故史（两次事故复盘）沉淀的 conftest 直接继承，不重蹈覆辙。这是 Python SDK 路径除跨语言成本外的**第二笔隐性收益**，建议写入 §3.5 提示框。

### 二、测试策略定稿依赖阶段 2 第 0 项（呼应 Trae，补测试侧视角）

Trae 提出 plugin mount 路径为阶段 2 实测第 0 项（优先于现有 5 项）。从测试方补一句：**第 0 项的结果直接决定阶段 6 测试策略的形态**——

- plugin 挂 DSH 子进程内（TS 写插件）→ 我们的 TS 插件部分须走 DSH 测试生态（snapshot replay 有价值），Python 业务层测试保留 → **混合测试栈**（pytest 主 + Vitest/replay 辅）
- plugin 经 JSON-RPC 挂 Python 侧 → 全 pytest 单栈 + 边界契约测试 → **无 TS 测试负担**

两种结果测试策略差异显著，**阶段 6 测试策略不应在 §3.6 定死**，应标"待第 0 项结果后定稿"。同样受影响的是我的 snapshot replay 判断——它在"TS 插件存在"时才成立，全 Python 路径下价值有限（llm-replay 是 DSH TS 生态的包）。

### 三、承接总表测试相关行的验收前置（补 3 条注记）

逐行核对承接总表，3 条与测试/验证强相关的行需要补验收口径：

1. **2.7.1 行为安全 = DSH sandbox 升级（待阶段 2 实测后升 ✅）**：测试方补——restricted token 生效性验证属 **OS 级集成验收**，不在 mock 覆盖不到清单（进程级/OS 级资源），无法单测；建议明确为"阶段 2 手工/脚本实测项"，不追求自动化。DSH SAFETY.md「do not guarantee isolation」意味着我们的降级护栏测试（异常路径不中断）在迁移后仍须保留——sandbox 是新增层不是替代层。
2. **2.9.2 compaction 承接**：除"跑通"外建议加**信息保留验收**——compaction 后关键标识符（路径/错误串/决策）不丢的抽样断言（对应我们产品树 2.9.2 注的 37% vs 98% 量化），否则"机制反向获解"只有方向没有验收。
3. **2.4.4 记忆保鲜（supersede + 状态标签）**：产品树 2.4.4 计划含检索参数调优——迁移后这些是**新写逻辑**（不是翻译），测试应覆盖 supersede 后旧版本不再被召回（current/historical 状态断言），趁 memories 当前近空（重灌成本近零）把 schema 一次定对。

### 四、数据迁移验证（阶段 6 验收第④层）的时机窗口

产品树/本稿多处提到"ChromaDB 只能重灌一次、机会只有一次"（2.4.5 四作用域 + §3.6 记忆迁移）。实测当前 `backend/data/chroma` 的 `larry_memories` count = 0（用户尚未归档记忆）——**迁移验证的"全量重嵌"实际是空集重嵌**，真正的验证价值在 schema 与代码而非数据量。趁现在定 schema（四作用域 + 保鲜字段 + occurred_at 时间字段一次设计），比等记忆积攒后再迁成本低两个量级。这是本稿 31 子项承接总表外的一条**时序建议**：记忆 schema 定稿应先于阶段 3/4 派发。

### 五、plugin 借鉴调研的测试侧产出要求（呼应 Trae 设计差异表）

Trae 建议借鉴清单最终形态是"设计差异表"。测试方补一列要求：**差异表加"对方如何验证该设计"列**（社区插件若有测试说明其设计可验证、schema 可抄；无测试的设计借鉴时须自补验证方案）——避免把"看着合理但从未被测过"的设计抄进来。另：按 §3.0 fork 改造须过本项目测试，借鉴调研的产出应包含"改造后需要哪些新测试"清单（supersede 行为 / RRF 融合质量 / 信任模型注入），随设计差异表一并交付。

### 六、风险确认（测试方）

§3.4 风险表重构后（同世界隔离为真实上限 / Windows restricted token 已证实 / 升级 SOP 取代锁版本）我均认可。"同世界隔离不防恶意代码"与我们的护栏立场一致——**迁移后降级与异常路径测试不得因 DSH 底座接管而削减**（LarryException 统一出口自做项，见承接总表 2.9.3，其测试保留）。

**结论：同意当前结论区，无结构性异议。** 测试方立场小结：Python SDK 路径若成立，测试资产是"保留 + 增补边界层"而非重建——这是继跨语言成本归零后的第二笔隐性收益，应计入路径比较；阶段 6 测试策略标注"待第 0 项结果定稿"；记忆 schema 定稿建议前移至阶段 3 派发前。

## Qoder

## Marvis
