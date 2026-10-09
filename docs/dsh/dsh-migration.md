# DSH 迁移方案

> **状态：决策稿（从讨论稿发展而来，经过3轮讨论四方审阅收口，四方一致「同意定稿」，老大 2026-09-08 终审通过）。**
> 用途：说明 LarryAgent 如何迁移到 DeepSeek Harness（dsh）
>
> **老大终审结论（2026-09-08）**：§1.5 基准无问题 / §3.0 维持裁定 / §3.7 计划基本合理（后续按实际推进微调）；**§3.5 已终裁**：第 0 项三方实测（Trae 一等 / Claude 一等 / QoderWork 二等）→ WB 判 **二等**，**老大 2026-09-08 确认** → 定 **A-framework（全面贴近核心层，含语言）**，路径分岔关闭。除此之外本稿**已定稿**，不再因讨论而改动。
>
> 评估基准：`../docs/product-positioning.md`（8 域 / 31 子项能力树）
>
> **路径拍板**：老大给出三条立论（项目小 / 专属能力薄 / 能力建设维度升级）+ DSH 主仓事实校准 → C → A 反转。
>
> **写作口径**：**只写结论与方向**——不写「采纳了谁的意见」、不展开「为什么不做什么」；历史过程不保留在本稿（见 git 历史与 `.workbuddy/memory/`）。

---

## 1 迁移基础

> 适用范围：本稿仅说明"将 LarryAgent 后端切换到 DSH 框架"的工程方案；不含产品定位层（见 `../docs/product-positioning.md`）与协作机制层。

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

### 1.4 对标产品

> 目标产品以`../docs/product-positioning.md`为准

### 1.5 押注主体依据（老大明示 · 信念层）

> **老大原话要点（2026-09-07）**：**最根本的是对深度求索（DeepSeek）公司本身的信任，可以说是一种押注**——"这确实比较唯心，但是也是有依据的"：自最初版本 DeepSeek 发布以来一直做得不错，且深受国家重视，有理由相信会有更好的发展；**其战略重心是 AGI，而非多模态与 harness，但对本项目这种规模而言足够了**。

**定性（WB 标注，防证据等级虚高）**：本条是**信念层判断，不是证据**。它不可证伪、不参与任何事实断言的成立与否，只回答一个问题——**为什么是这家公司的底座，而不是别家**。按本稿 §2 铁律与项目证据原则（`docs/ai-governance.md` §3「身份不为证据加权」），**去掉本条，本文档所述路径依然成立**——路径由以下五条独立支撑，无一条依赖本条或社区热度：① 老大三条立论（项目小 / 专属能力薄 / 底座进化论）；② **本地代码实证**（§2 各能力包与 8 子项承接，均经锁定版核实）；③ **官方双分发**（npm `@deepseek-ai/dsh` + PyPI SDK/runtime-bin，含 Windows x64 wheel）；④ **MIT 兜底**（最坏可 fork 自维护）；⑤ **边界已核**（AGENTS.md / SAFETY.md 的风险与能力上限均已本地查证）。

**信任与兜底的分工（不可互替）**：

| | 回答什么 | 失效场景 |
|---|---|---|
| **信任**（本条，信念层）| **选谁**——在能力相近的候选底座中，押其持续发展与资源投入能力 | 公司战略调整 / 投入撤出 / 方向转移 |
| **兜底**（MIT + TS 可 fork + 锁定版 `0.1.5-rc.2` + 边界已核 + DSH-6 前双轨可回退）| **选错的代价**——最坏可接手自维护 | 许可变更 / 代码不可读 |

> **必须暴露的矛盾**：**AGI 是重心 ⇒ harness 是副产品**。这既是我们能免费拿到高质量底座的原因，也意味着**它可能随时因主线需要被调整、降速甚至停更**。这不是反对 A 的理由，而是「**兜底必须与信任并列、不能因信任而放松**」的理由——MIT 许可与 TS 可读性，是我们对该风险的**唯一**实质对冲（有兜底 = 副产品被砍也能接手；无兜底 = 信任一失效即归零）。

**失效条件（可证伪边界，命中任一即重估本文所述路径）**：① DSH 连续两个 release 周期无实质投入（commits / release 频率断崖，与 §2 只记录不解读的基线比）；② 许可变更（MIT → 受限）；③ 官方明示 harness 停止维护或转闭源；④ §3.7「升级 SOP」事件触发条件长期无法收敛（preview 状态无限期）；⑤ **方向收窄**（不停更、不改许可、指标健康，但通用 harness 向 feature 占比持续趋零、编码专属 feature 占比 > 80%）——比停更隐蔽，须按 release changelog 量化观测。

---

## 2 DSH 事实画像

> **来源图例**（本稿铁律，凡引 DSH 事实必标）：🟢 **本地代码验证**（`ref/dsh-bare/` 锁定版，可靠）｜🟡 **官方源 / API**（GitHub API、docs 站、release notes，次之）｜🔴 **推断未验证**（**不得作为结论依据**，只能列入待验证）
>
> 本表 🟢 项均以本地副本锁定版 **`dsh-v0.1.5-rc.2`** 实测为准（裸仓库 `ref/dsh-bare/`，不入 git；查阅方式与四条踩坑见 §2.2）。
> ⚠️ **本表多数 🟢 项原在 `dsh-v0.1.2-rc.1` 上核实** —— 2026-09-15 基线挪到 `0.1.5-rc.2` 后已逐条复核，结论与差异见 **§2.3〈基线迁移复核〉**。

| 维度 | 事实 | 来源 |
|---|---|---|
| **是什么** | DeepSeek 官方开源 **Agent Harness（智能体运行框架）**。官方公式 `Agent = Model + Harness` | 🟢 |
| **不是什么** | **不是大模型、不是推理引擎**（≠ vLLM / SGLang）。模型负责推理，Harness 负责对接环境、工具闭环、任务调度、权限管控、会话追踪 | 🟢 |
| **定位** | **架构通用、开箱偏编码**。内核无特权、连 Agent Loop 都可换 → 理论可做通用 Agent；但内置工具（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`——本地确认**五者均存在**）与四模式**均围绕编码场景**设计 | 🟢 |
| **官方口径** | 多数解读称"AI **编程** Agent Harness"；亦有解读明确「**不是单一编码助手**，而是可组装的智能体基础设施」——**并不矛盾**：架构通用 ≠ 开箱通用 | 🟡 |
| **口号 / 内核** | Everything is a Plugin（万物皆插件）；内核 = **Cordis** 插件总线（Koishi 生态插件内核）| 🟡 |
| **主语言 / 规模** | **TypeScript**（Monorepo）。**本地实测：锁定版 `packages/` 顶层 50 个包目录**，另含嵌套子包（如 `sandbox/sandbox-windows-acl/`）；仓库 156 MB / **文件数 8,854**（`git ls-tree -r` 可复现口径，012 基线；015 为 10,178 —— 见 §2.3）| 🟢 |
| **许可证** | **MIT**（Copyright 2026 DeepSeek，本地 LICENSE 确认）| 🟢 |
| **锁定版本** | **`dsh-v0.1.5-rc.2`**（**2026-09-15 老大拍：产品哲学形态已定，不必等 stable**；原锁 `0.1.2-rc.1`，迁移复核见 §2.3）。上游最新（**2026-09-15 实测 npm registry**）：**`latest` = `0.1.5-rc.1`（该 tag 自 09-10 起未再推进） / `next` = `0.1.5-rc.2` / `alpha` = `0.1.6-alpha.1`**（版本线 `0.1.2-rc.1 → 0.1.3-alpha.2 → 无 0.1.4 → 0.1.5-{alpha.1,alpha.2,rc.1,rc.2} → 0.1.6-alpha.1`，共 21 个）（原记「master 开发线 `0.1.3-alpha.2`，644 commit 领先」已过期）。**tag 名带 `dsh-` 前缀**；全部 release 为 prerelease，无 GA 时间表 | 🟢 锁定版 / 🟡 上游最新 |
| **社区规模（2026-09-07 更新）** | star **215K** / fork **25.3K** / watch **923** / releases **11 tags** / commits **15,210**（老大读数；WB 于 09-07 15:53 用 GitHub API 交叉验证 star 214,526 / fork 25,270，与老大读数一致，24 小时 +612 star）。**天龄 25 天**（仓库创建 2026-08-13）。**只记录，不解读** | 🟡 |
| **官方状态** | `SAFETY.md` 原文：「experimental developer-preview software. It has **not undergone a security audit** and **must not be treated as secure or production-ready**」；沙箱/审批/权限「do not guarantee isolation」 | 🟢 |
| **沙箱** | 四子包：`sandbox/` + `sandbox-local/`（Linux bwrap→Landlock / macOS Seatbelt / **Windows restricted token**）+ `sandbox-policy/` + **`sandbox-windows-acl/`**（Windows 写入限制：受限子进程仅可写工作区与私有 temp）。三档策略 `read-only` / `workspace-write` / `danger-full-access`；被策略拒绝的调用可经**用户批准的一次性升权**重试。**同世界隔离**：共享宿主内核与文件系统，非容器 / microVM 级 | 🟢 |
| **运行形态** | 5 个 profile（web / headless / sdk / sdk-minimal / acp）+ 本地 `host/`（API gateway）+ 本地 `client/`（Web-GUI）| 🟡 |
| **能力分布** | `compaction/` `sandbox/` `interaction/` `session/` `session-query/` `llm/` `mcp/` `acp/` `sdk/` `preset/` `storage/` `e2b/` `subagent/` `workflow/` `web/` `terminal/` `shell/` `fs/` `lsp/` `test-support/` **本地逐一确认存在** | 🟢 |
| **官方分发（关键）** | ①npm **`@deepseek-ai/dsh`** 真实发布，latest = **`0.1.5-rc.1`**（2026-09-15 实测：该 tag 自 09-10 起**未再推进**，而 `next` 已 `0.1.5-rc.2`、`alpha` 已 `0.1.6-alpha.1` ⇒ **勿以 latest 判断上游进度**），MIT，bin=`dsh`，70 依赖，官方用法 `npx @deepseek-ai/dsh web`；②PyPI **`deepseek-harness-sdk`**（纯 Python，any 平台）+ **`deepseek-harness-runtime-bin`**（**`0.1.5rc1`**，2026-09-15 实测：**5 平台 wheel** —— Linux x64/arm64 · macOS arm64 **/ x86_64** · Windows x64；**仍无 sdist**），**后者把 `dsh` CLI 与整个 Node 依赖树打包为原生可执行文件，SDK 使用无需系统 Node.js**（`requires no system Node.js`） | 🟢 |
| **插件生态（关键，前判"生态早期"已推翻）** | 社区精选列表 `awesome-dsh-plugin/awesome-dsh-plugin`（**14.7k star**）共 **3,199 个插件**，25 个分类；官方安装命令 `dsh plugin add`（插件声明 `dsh.bundle` manifest）+ 插件市场 **`dsh-market`**（一键安装/升级）。**与本项目强相关分类**：Tools & Capabilities **425** / Memory **149** / Sessions & Messages **201** / Workflow & Automation **190** / Skills **135** / Models & Providers **130** / Security & Permissions **108** / Remote & Mobile **89**（飞书 bot / LAN access / auth tunnel）/ WSL & Windows Interop **34**。**Identity & Communication 仅 12**（印证 §3.3「用户画像 DSH 不给」—社区也未补上）。**插件装载在 DSH 运行时内，与后端是否用 Python SDK 无关**（两类方案不冲突）。**⚠️ 用法约束见 §3.0：生态对我们是「参考实现库」，不是「能力货架」——只借鉴 / fork，不直接纳入** | 🟡 |
| **`identity/` 语义** | 存在，但**不是用户画像**：「one anonymous id per harness home… **without identifying the user**」，用于 telemetry / feedback / DeepSeek 请求关联，无配置项 → §3.3「用户画像 DSH 不给」结论**成立** | 🟢 |
| **云端形态** | AGENTS.md 对 cloud / multi-user / tenant / single-user / personal **零命中**（本地 grep 确认）—— ⚠️ **零命中 ≠ 无远程能力**：上游已有**单机远程访问**的完整实现（见 §3.3「云端部署」行），差别只在多用户 / 租户语义 | 🟢 |

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

### 2.2 本地参考代码区（`ref/`，AI 查阅指南）

> **两个子区**：`ref/dsh-bare/` = **官方底座源码**（只读锁定副本）；`ref/community/` = **社区参考件**（按需浅克隆）。整个 `ref/` 已在 `.gitignore` 排除、**不入版本、不进构建**。
> **它服务的是一条已定纪律**（§3.0「只参考不直装」）：把"值得借鉴的件"从*网上某个仓库*变成*本机可读的目录*。**每步对应的具体参考件、以及"开工前先调研参考件"的规矩（含版本脱节哨兵），见 §3.6〈参考实现登记表〉。**

#### 2.2.1 官方底座源码（`ref/dsh-bare/`）

- **路径**：`ref/dsh-bare/`（**裸仓库**，项目根；`.gitignore` 已排除，**不入版本**）
- **性质**：**只读参考副本**——供 AI 核查 DSH 事实用，**不是 LarryAgent 的项目依赖**。项目代码对它**零引用**，构建与运行时都不读它
- **锁定版本**：`dsh-v0.1.5-rc.2`（2026-09-15 由 `0.1.2-rc.1` 挪至此处；**两版 tag 并存于裸仓库，可直接对照**）。老大裁定「演进红利不在一时」，**锁 release 线、不跟 master**

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


#### 2.2.2 社区参考件（`ref/community/`）—— 约定

- **命名**：`ref/community/<owner>__<repo>/`（斜杠换成 `__`，一眼看出出处）
- **拉取**：`git clone --depth 1`（**浅克隆**——只要当前版本，不需要历史）
- **性质**：同上，**只读参考、不纳入依赖、不进构建**（§3.0）。真要用其代码 ⇒ 走 **fork → 本仓库 → 本项目 review / 测试**，**不复用这里的目录**
- **登记**：每个件要记 `LICENSE` 类型与对应切片（见 §3.6〈参考实现登记表〉）；版本以浅克隆当日为准

**已落位（2026-09-14 三件 ／ 2026-09-17 补一件；合计约 1.0 MB）**

| 目录 | 对应切片 | 为什么值得看 |
|---|---|---|
| `kun2-5code__dsh-plugin-template/` | 3.1 / 3.7 | 插件脚手架（MIT）：`src/index.ts` + `service` / `hook` / `commands` + `client/` UI 半边 + **`dev/cordis.yml` 开发 overlay** + **`test/smoke.mjs`（假 ctx 单测范式）** |
| `PerryLink__dsh-reach/` | 3.3 / 3.8 | 决策卡（approval / user-question）**推送到 IM 并从聊天回答**（Apache-2.0）：`src/bridge.ts` 的 **deferred-answerer waterfall** + `decision.ts` + 7 条 IM 适配器 + 降级矩阵 + `client/` 半边（`dsh.client.inject` 声明） |
| `Asher-2000__dsh-memory-connect/` | 3.6 | 跨会话记忆（MIT）：SQLite FTS5 + 本地 embedding（`scripts/embed_server.py`）+ `systemPrompt.context` 逐轮召回 + 上下文预算测试 |
| `EvilIrving__dsh-repro/` | 3.2 | 复现件（MIT，2026-09-17 落位；浅克隆 HEAD `e51736ba`）：`docs/implementation-spec.md` 记**会话持久化 seam 的精确签名**（`create` / `append` / `load` / `inspect` / `readFrom` / `list` / `locate` / `supportsRawArtifacts`）＋ `ctx.sessions.create(id, { seed })` 重放 ＋「firehose ≠ 持久化」的分工；`src/scrub.ts` 是一套**值级脱敏规则集**（前缀 token ／ 高熵串 ／ env 键三类，fail-closed） |

- **本地社区名录**：`ref/awesome-dsh-plugin.md` = `awesome-dsh-plugin` 英文版快照，**3,386 行 / 27 个分类含分类行号**；按分类定位候选，**不必重新联网**

**⚠️ 落位件的「可参考 / 不可参考」**（⭐ **派发任务时须逐件照抄进派发稿** —— 老大 2026-09-14 定；四要素定义见 §3.6〈参考实现登记表〉规矩）

| 件 | 许可 | ⛔ 不可参考 | ✅ 可参考 |
|---|---|---|---|
| `kun2-5code__dsh-plugin-template` | MIT | **`src/client/` 14 个文件全是 React**（`import React from 'react'`）—— 本项目前端是 Vue/Tauri，**UI 代码不可照搬**；**`dev/cordis.yml` overlay 只加载 host 半边**，不能拿它判 client 半边可用（§3.6 事实 4） | host 半边 `dsh.bundle.patch` / `dsh.client` 的**包级声明形状**、`service` / `hook` / `commands` 三半边划分；`test/smoke.mjs` 的**假 ctx 单测范式** |
| `PerryLink__dsh-reach` | Apache-2.0 | 摘录 / 改写**须保留 `NOTICE` 与许可声明**（另有 `THIRD_PARTY_NOTICES.md`）；`src/client/ReachSettingsTab.tsx` 是 **React**（同上不可照搬）；`src/adapters/` 是 **IM 平台专有**（Lark / 钉钉 / 飞书 / QQ …）—— 本项目出境面走**自做 A 段协议**，不是 IM；**不可 `dsh plugin add` 直装**（§3.0） | `src/bridge.ts` 的 **deferred-answerer 生命周期**（超时 `cardTimeoutSec` / 结清 `dispose()` / 卸载）；`src/decision.ts` 的审批判定形状；`inject: []` **降级矩阵**写法 |
| `Asher-2000__dsh-memory-connect` | MIT | `scripts/embed_server.py` 走**独立 Python 进程**做 embedding —— 3.6 的路线是 **TS 插件内直接 embedding**（DSH-2.5 ⑤ 已验漂移 `2.2e-7`）⇒ **该脚本不可采用**；其 CHANGELOG 那两个"静默不生效"的**旧写法是反面教材**，不可照抄 | `systemPrompt.context` **逐轮召回**的接线形状；上下文预算测试的构造法 |
| `EvilIrving__dsh-repro` | MIT | ① **签名与行号锚在 harness `master`（`47f9438`）**，我方基线是 **`0.1.5-rc.2`** ⇒ 用前须**在 015 实物上复核**（`packages/core/session` 的 `create` 签名、`sessionPersistence` 的抽象方法集），**勿把 master 行号当 015 事实**；② 它是**插件**（`/repro` slash 命令），**不是测试装置** —— 3.2 要的是"复现与定性"，**别把它的插件骨架搬进 `harness/`**；③ `lib/` 与 `pnpm-lock.yaml` 是构建产物 / 锁文件，**勿读勿评**；④ 不可 `dsh plugin add` 直装（§3.0） | `docs/implementation-spec.md` §3.1 挂点表 ／ §3.2 精确签名 ／ §3.4 关键约束（**firehose ≠ 持久化**、`seed` 的 replay 校验要求"从 seq 0 连续"、slash 命令与进程级 CLI 是**两条 seam**）；`src/scrub.ts` 的**值级脱敏规则集形态**可抄形状 |

> ⚠️ **拉取时的一个坑（2026-09-14 实测）**：本机 git 全局配了 `http(s).proxy = socks5://127.0.0.1:7890`，而该代理**当时不在运行** ⇒ `git clone` 直接报 `Failed to connect to github.com port 443 via 127.0.0.1`。**github.com 本身 TCP 可达**（实测握手通）。绕法：
>
> ```bash
> git -c http.proxy= -c https.proxy= clone --depth 1 <url> <dst>   # 并清掉 env 里的 http_proxy / https_proxy
> ```
>
> ⇒ **这类失败看起来像"被墙"，实为本机代理配置** —— 判"网络不通"前先 `git config --get http.proxy`。


### 2.3 基线迁移复核（2026-09-15：`0.1.2-rc.1` → `0.1.5-rc.2`）

> **背景**：老大 2026-09-15 拍定「**产品哲学上的形态已经确定，不必等 stable**」⇒ 基线由 `dsh-v0.1.2-rc.1` 挪至 **`dsh-v0.1.5-rc.2`**。本稿 §2 与 §3.6 的 🟢 项**多数原在 012 上核实**，故本节逐条复核「换基线后是否仍成立」。
>
> **方法**：在 `ref/dsh-bare/` 裸仓库上对**两个 tag** 直接 `git show` / `ls-tree` / `rev-parse`（blob hash）对照 —— 不依赖任何转述，两版 tag 并存可直接复跑。

| 项 | 012 → 015 对照结果 |
|---|---|
| `packages/` 顶层包数 | **50 = 50**（无增删） |
| 全仓文件数（`git ls-tree -r`） | 8,854 → **10,178**（+15%）；`packages/` 内 4,473 → 5,046 |
| **8 项必需能力**（§3.6 DSH-2 证据表） | **机制签名 8/8 存续**；其中 `interaction/user-approval/src/index.ts` **两版 blob 逐字节相同**（`8e1a8d05d468de3b`，302 行） |
| `sdk/protocol/src/types.ts` | **逐字节相同**，`initialize` 均在 **:116** |
| `sandbox/` 四子包 · `storage/` 四件套 · 内置五工具 | **完全对应** |
| `preset/persona/src/index.ts` | `inject = ['systemPrompt']` 均在 **:27** |
| `compaction` 契约 | `README.md:29-30` + `command-compact/src/index.ts:66` **行号未变** |
| `fs/fs-sandbox/src/index.ts` | `INSTEAD OF` 换实现语义在（**:49**，两版同） |
| **行号漂移（2 处，已就地更新）** | `known-event-types.ts` :66/:69 → **:71/:74**（PTC 改名 `code-dispatch`→`ptc-dispatch` 新增 2 行）；`api-catalog.ts` :3033 → **:3185**（内容逐字相同） |
| **内容被上游改写（语义未变）** | `sandbox-local/README.md:12` 首段重写（仍讲平台 confinement + 共享宿主内核）；`:71/:107/:128` 的 Windows restricted-token 表述**行号两版一致** |
| `AGENTS.md` | 155 → 156 行；章节名由 `Pre-release stance: foundation over blast radius` → **`Pre-stable APIs and released Session data`**；`cloud` / `multi-user` / `tenant` / `single-user` / `personal` **两版均零命中**（§2 :93 结论存续）|
| `identity/` 语义 | 「one anonymous id per harness home … **without identifying the user**」**两版同句**（§2 :92 结论存续）|
| `goal` / `schedule` / `jobs` / `webhook` / `e2b` / `feedback` / `storage` / `extensions` / `identity` | **9 个顶层包两版均在**（§3.6 总表 2.3.5 行的依据存续）|
| `llm-deepseek` 的 `DEFAULT_MODELS` | **已跟进改名**：012 = `deepseek-v4-flash`/`deepseek-v4-pro`，015 = **`deepseek-flash`**（同文件 :92）|

> **⚠️ 两类"不可迁移"者（已如实标注，未改写）**：
> 1. **上游引文** —— 凡引 012 notes / release notes 原文者（§3.4 ④ 的「移除 SQLite Session 后端」、⑤ 的「notes 只有'改善…'」、② 的「汇总自 v0.1.2-rc.1 以来主要变更」）：**引文改了就是篡改**，一律保留原样。
> 2. **运行时实测** —— 需真机 / 外部环境跑出的数据（CVM 内存与并发、Windows 方言、Vue↔Tauri 连通、反代可行性）：**通道在 012，结论须在 015 复跑**；本节只做口径迁移，**未把这些标成已验**。

**015 迁移未闭合项**（本稿口径已到 015，但下列结论**通道仍在 012**，未经复跑不得视为已验）

| # | 项 | 为什么不能迁移 | 归属 |
|---|---|---|---|
| 1 | CVM 侧实测（内存 / 并发探针 / 2 h 采样） | 数据取自 012 环境 | DSH-3.0.3 |
| 2 | Windows 沙箱方言（本地化 / 错误码类别 / 编码） | 同上 | DSH-3.0.3 |
| 3 | Vue/Tauri → sdk profile 连通（`PROBE-OK-2026`） | 同上 | DSH-3 |
| 4 | 反代可行性（重估触发线 T2） | 本机实测于 012 期 | DSH-5 |
| 5 | `dsh.exe` Windows 崩溃定性（入口 / 安装方式相关） | npm 全局 012 上的反证 | DSH-3 |
| 6 | ⚠️ **CLI 与 profile 必须同代** | ✅ **全项闭合（2026-09-17）**：① **主体**（2026-09-16）：CVM `~/.dsh/profiles/sdk` 已装齐 015、CLI `0.1.5-rc.2` ⇒ 三方同代（WB 上机独立复核）。② **脚本钉版**（2026-09-17）：`harness/scripts/cvm-probes/` 3 个脚本原钉 `@0.1.2-rc.1`，**全目录逐字节实测 6 处**（⚠️ **原记「7 处」有误**：`cvm-setup-profile2.sh` ×3 ／ `cvm-acp-setup.sh` ×2 ／ `cvm-task1-setup.sh` ×1，另 8 个文件无钉版）⇒ **老大 2026-09-17 裁「参数化」并已执行** —— 抽为 `DSH_VERSION="${DSH_VERSION:-0.1.5-rc.2}"`（默认 015；可 `DSH_VERSION=0.1.2-rc.1 ./x.sh` 切旧代际复现）；`set -n` 语法检查 RC=0、双向展开验证（默认→6 处全 `0.1.5-rc.2`；显式→6 处全 `0.1.2-rc.1`）均过；**并已 scp 回同步 CVM（两侧 sha256 逐字节一致，同步前 CVM 侧与仓库 HEAD 同源、无现场改动被覆盖）** | ✅ **DSH-3.0 强制前置 · 已达成** |

**本稿内待处置（非实测项）**：① :82 的「9,080 文件」出处不明，已统一为可复现的 `git ls-tree -r` 口径（8,854）；② ~~§3.6 总表统计「白给 8 / 自做 23」未随 2.7.2 改判重算~~ ✅ **已于 2026-09-15 按 015 口径重划落地**（🟢 12 / 🟡 15 / 🔴 4，见 §3.6 总表）。

**验证纪律**：任何写进本稿**结论区**的 DSH 事实必须标 🟢 / 🟡 / 🔴；**🔴 不得作为决策依据**，只能列入待验证

---

## 3 路径决策与实施规划

> **拍板来源**：老大三条立论（项目小 / 专属能力薄 / 能力建设维度升级），WB 立论反转 C → A。**事实校准**：基于本地副本 `ref/dsh-bare/` 锁定的 `dsh-v0.1.5-rc.2` 代码与 AGENTS.md（原为 `0.1.2-rc.1`，2026-09-15 挪基线并逐条复核，见 §2.3）。

### 3.0 第三方引入原则（老大拍板硬约束，优先于本节其余结论）

> ⭐ **已升格为项目级原则（老大 2026-09-30 裁定）** —— 简短版落 `README.md` §设计原则；**本节 ＋ §3.0.1 ＋ §3.0.2 是它的实施细则**（不搬家，README 侧只存指针）。
> ⚠️ **为何不落 `docs/ai-governance.md`**（TODO 原写该落点）：那份文件自称「**协作机制层**，与产品能力层正交，归因限于同层」，而本原则讲的是「**第三方代码怎么进我们的仓库**」（产品工程实践）⇒ 写入会作废其分层基准。**升格只升"效力等级"，不升"所在层"**。

**一句话**：社区 / 第三方插件**一律不直接纳入为运行时依赖**，只作参考源——可读、可 fork、可抄，**不可"装上就用"**。

| 用途 | 是否允许 | 说明 |
|---|---|---|
| 读源码借鉴设计（schema / 检索策略 / 信任模型 / 交互流程）| ✅ 鼓励 | 生态真正的价值是"别人已替我们试错过" |
| fork 后自行改造并纳入 | ✅ 允许 | 代码进本仓库 → 走本项目的 review / 测试 / 命名与产品语义，**维护责任归我们** |
| 临时装进隔离环境跑 prototype 验证思路 | ✅ 允许（临时）| 只用于验证，不进产品依赖；产出以"结论 + 可借鉴点"沉淀回本文档 |
| **直接 `dsh plugin add` 装上并作为产品依赖** | ❌ **禁止** | 无论 star 数、无论是否"企业级维护" |

**立论（老大 2026-09-07）**：现象级爆发的插件生态必然伴随大量跟风项目无人持续维护——今天 14.7k star 的精选列表，两年后相当比例是弃坑件。把关键能力押在外部作者不可控的维护意愿上，风险高于所省下的实现成本。**即使企业级维护的插件也不直接纳入**：fork 后自己改造，或参考其代码自己实现。

**边界**：本原则针对**插件 / 第三方扩展**；DSH **底座本体是框架依赖、不是插件**，本文所述路径依然成立。底座的同等兜底是 **MIT + TS 可 fork 自维护**（见 §3.4 上游集中度行）——即"依赖一个**可接手**的底座，而不是**不可控**的插件"，两者风险性质不同。

#### 3.0.1 借鉴调研的取样原则（2026-09-30 补，落实 `TODO` 待核段第 3 条）

> **问题**：社区名录 **3,199 个插件**（25 分类）—— 逐个读既不现实也无意义。**目标不是"评出哪个插件最好"，而是"提炼可复用的设计模式"**（与 §3.0「不作运行时依赖」同向：既然不装，就没有"选哪个"的问题）。

**取样四步**

| 步 | 动作 | 产出 |
|---|---|---|
| ① **按切片收窄** | 从 25 分类里只取与本步切片相关的类（对应关系见 §3.6 末「社区名录索引」表） | 候选池（通常在数十量级） |
| ② **按信号分档** | 按「**是否解决我们的同一个具体问题**」分三档：**同题同解**（直接可比）／**同题异解**（最有价值，含反面教材）／**邻题**（只借形状） | 分档名单 |
| ③ **取 Top 深读** | **每档取 1–3 件**深读源码（**不只看 README** —— README 会隐藏未兑现的声明，实例见 §3.6 事实 13 的 v0.3.0「注册了但从未实例化」） | **设计差异表** |
| ④ **提炼并留证** | 产出可复用模式，逐条落 §3.6 事实表（附**证据等级**与**不可参考边界**） | §3.6 表新增行 |

**设计差异表（③ 的固定表头，逐件填一行）**

| 列 | 填什么 |
|---|---|
| 件名 / 版本 | 带版本号（**版本是证据的一部分**，见下方哨兵） |
| 它解决的同题 | 与我方哪个切片、哪个子项对应 |
| **它的设计** | 抽象到可抄的形状（表结构 / 检索策略 / 状态机 / 信任模型），**不抄代码** |
| **它如何验证该设计** | ⭐ **本列是核心** —— 它有没有测试、测什么层次、判据怎么写的；**没测的地方就是它的风险点**，也提示我方该补什么 |
| 我方差异 | 产品语义不同处（形态 / 场景 / 约束） |
| **改造后需补哪些测试** | 照抄它设计后，我方须补的测试清单（含它没覆盖的边界） |
| 证据等级 | 🟢 我方复跑过 ／ 🟡 只读源码 ／ 🔴 仅凭自述 |

**版本脱节哨兵（⭐ 老大 2026-09-14 注，`§3.6` 表头已声明；本条把它变成可执行动作）**

> 老大原话精神：**「社区变化日新月异，但我们也可能逐渐脱节；若发现 DSH 版本已严重落后到无法利用社区红利，须暴露」**。

- **每件落位后、深读前，先跑一次兼容实测**：取该件 `peerDependencies` ／ `engines` ／ 其 README 声明的 DSH 版本，与我方锁定版（现为 `dsh-v0.1.5-rc.2`）做 **semver 实测**（**不靠推理**）。
- ⚠️ **判"装不上"前先核是否只是 semver 比较选项问题**：**带 prerelease 的版本只在同一 `[major,minor,patch]` 三元组内参与区间比较** ⇒ `^0.1.0-rc.7` 对 `0.1.5-rc.2` 判 **false**，但加上 `includePrerelease:true` 即为 **true**，且 `0.1.5-rc.2 > 0.1.0-rc.7` 本就成立（**2026-09-30 实测，完整正反对照见 §3.6 事实 14**）。
- **暴露口径**：哨兵命中的结论**照实写**（含"方向与预期相反"这类情形 —— 我们这次遇到的是**社区件锚在更早小版本、装不进我们的新版**，不是我们落后），**不往"我们落后"上硬套**。

**🚫 反模式（不得这么做）**

1. **按 star 数取样** —— star 与设计质量无关（§3.0 立论已否）。
2. **只读 README 就下"可借鉴"结论** —— 必须在源码里找到该机制的实现（**声明 ≠ 实现**；本项目自身纪律「实现正确 ≠ 声明过度」同理）。
3. **给单个插件下价值判断**（"这个好 / 这个不行"）—— 调研产出的是**模式**，不是**排名**。
4. **把"抄了设计"当作"已具备该能力"** —— 仍须走 §3.0.2 的纳入流程。

#### 3.0.2 借鉴 / fork 代码的纳入规范（2026-09-30 补，落实 `TODO` 待核段第 4 条）

> **前提**：§3.0 已定「可 fork 后自行改造并纳入，**维护责任归我们**」。本条把"怎么纳"钉成可核对的动作。

| 维度 | 规则 |
|---|---|
| **进库位置** | ① **整体 fork 的第三方件** → 独立 **`vendor/<owner>__<repo>/`**（与 `ref/community/` 同名式，一眼看出出处）；② **只抄某段设计自行实现的** → **按能力模块落地**（如 `harness/packages/` 下对应包），**不进 `vendor/`**。⚠️ **判据**：`vendor/` 只放"**整体搬来、后续仍需与上游比对**"的件；一旦改造到与上游无对应关系，**移出 `vendor/` 转正为自研模块** |
| **出处与 license 标注** | 每个 `vendor/` 件须带 **`UPSTREAM.md`**：`owner/repo` ＋ **commit / tag**（**不留分支名** —— 会漂）＋ `LICENSE` 类型 ＋ 取用日期 ＋ **取了哪些文件**（逐文件列）。⚠️ `LICENSE` **须保持原样保留在件内**（MIT / Apache-2.0 均要求随分发保留版权声明）；若原件无 license ⇒ **不得纳入**（默认保留全部权利） |
| **改造后的义务** | ① 过**本项目**的 lint / 测试 / 命名规范（**不因"外来代码"降标**）；② 与自研代码**同等**的 review 要求；③ 若测试依赖上游行为，**测试须写明它锚的上游版本**（上游一变即失效，须能定位） |
| **与自研代码的边界标识** | ① 文件头注明来源（`// vendored from <repo>@<commit>` 一行）＋ **改造点标注**（`// [mod] 原因`）—— 便于下次同步上游时**三方比对**（base / upstream / ours）；② **不改上游原文件名与目录结构**（改造越大越该保留原形，以便比对）；③ ⛔ **不得与自研代码交叉混写在同一文件** —— 边界一旦糊掉，"这段是谁的、谁负责"就答不上来 |
| **同步与退役** | ① 上游更新**不自动跟**（§3.0 已定不直装 ⇒ 无自动补丁通道），按需手动同步并**重跑该项目测试**；② 上游弃坑且我方仍在用 ⇒ **视为自研代码**（升级为全责），按 §3.0.1 哨兵评估是否改自实现 |

**⚠️ 与「上游追踪与 CVE 响应」的关系**：该流程（`TODO` 待核段第 5 条）**尚未建立**，本表只覆盖"纳入那一刻"的规则；**纳入之后的 CVE 响应仍是空白**（明确登记，不假装已覆盖）。

### 3.1 一句话结论

**路径强推**——**底座能力开箱获得**（compaction / sandbox / 审批 / trajectory / 多模型 / MCP / ACP；31 子项对照 **🟢 可承接 12 / 🟡 可降级 15 / 🔴 仍须自做 4**，见 §3.6 承接总表），**产品语义层全部自做**（🟡 15 + 🔴 4 = **19 项均由我方写实现**，区别只在「有底座可挂 / 有参考可抄」；🔴 4 项是连设计参照都没有的产品语义核心：记忆可管理 / 用户画像 / 自动路由 / 时间感知；其中长期记忆语义化 / 知识库 / 多端接入 = **借鉴社区设计后自实现**，不直装，见 §3.0 / §3.3）。本文所述路径省的是"造底座"，不是"写代码总量"。

**哲学一致性**（底座重 ≠ 产品重）：底座选择走重型（借用 DSH 演进红利 + 底座能力开箱），产品语义层保持轻量派（记忆 / 知识 / 形态三条主线延续产品树结论：不上 KG、不上重护栏、分级触发）；DSH 的 Web GUI / trajectory 全暴露 / 五 profile 等开发者向复杂度，在用户侧收敛回 LarryAgent 的克制界面（保留 Vue/Tauri，见 §3.6 前端路线）。

### 3.2 DSH 真能替的（底座层，包名经本地代码复核——见 §2.2）

| DSH 包 | 实质 | LarryAgent 现状 | 接入收益 |
|---|---|---|---|
| `compaction/`（compaction-basic + tool-result-pruner）| 上下文压缩（Service Definition + provider）| 🚧 `max_input_tokens` 截断（**机制反向**）| 升 ✅（直接受益 2.9.2）|
| `sandbox/`（sandbox-local + sandbox-policy）| 进程隔离（bwrap / Landlock / Seatbelt / **Windows restricted token**）| 🚧 IP/目录/SSRF（**无分级无审批**）| 升 ✅（直接受益 2.7.1；**三平台后端并列**，⚠️ Windows restricted token **实际生效性待实测**，见 §3.4）|
| `interaction/`（permission-presets）+ `credentials/` | approval/permission/ask-user + 凭据授权流 | ❌ 无 | 新增 ✅ |
| `session/` + `session-query/`（SQLite FTS）| 持久化 + 查询 | 🚧 ToolCallCard（仅工具名+结果）| 升 ✅（直接受益 2.8.2）|
| `llm/`（llm-deepseek 等 provider + llm-retry）| provider 适配器 | ✅ 配置切换（薄薄一层）| 升 ✅ |
| `mcp/`（mcp-client）| MCP 协议 | ❌ 无（TODO 🗣️）| 新增 ✅（直接受益 2.5.3）|
| `acp/` + `sdk/`（JSON-RPC server）| Agent Client Protocol + SDK | ❌ 无 | 新增 ✅（B/D 路径抓手 + 脱钩通道）|
| `jobs/` | 后台任务 | ❌ 无 | 新增 ✅ |
| `preset/`（agent-presets + persona）| per-session agent 组合（cordis.yml）| 部分（config 下发）| 角色机制迁移底座 |
| `feedback/` | 人类反馈捕获 | ❌ 无 | 新增 ✅ |
| `storage/`（storage-domain + storage-json）| Non-session 存储 hub + backends | ❌ 无 | 记忆双写的挂载候选（✅ **DSH-2.5 ① 已实测**：`path` 可指任意绝对路径，见 §3.4）|
| `test-support/llm-replay` | snapshot replay 测试（真实会话录制 → 无 key 重放）| ❌ 无 | 测试范式升级（见 §3.6 DSH-6）|
| `e2b/` | 云沙箱（POC）| ❌ 无 | 远期候选 |

> **口径注（2026-09-15）**：本表是**底座层清单，证据等级 = 本地代码复核（见 §2.2）**，成表于 `0.1.2-rc.1` 期。**015 新增件不逐条补入**——我方对新增件只有规格文字级证据（🟡），混入会降低本表口径。**015 全量能力面与档位的唯一权威 = §3.6 承接总表**；本表用途不变（回答"底座层白给什么"）。

### 3.3 DSH 一概替不了的（产品差异化，A/C 都要自做）

| 能力 | DSH 现状（事实层） | 实质 |
|---|---|---|
| **用户画像** | `identity/` **存在**（本地确认），但语义为「one anonymous id per harness home… **without identifying the user**」——仅用于 telemetry / feedback / provider 请求关联，**无个人维度** | DSH 无用户画像概念，自做（**结论不变**，依据升级为本地实证）|
| **知识库** | DSH 内核无 BM25/FTS+向量混合检索；但**社区有现成实现**（Memory 分类 149 个：ReMe 自进化知识库 / dsh-tiddlywiki / eli-mode 知识库驱动预设）| **从"自做"降为"借鉴自实现"**（社区方案作**参考实现**：抄 schema / 检索组织思路，**不直装**；需验场景匹配：多为编码/项目知识库，非个人生活知识库）|
| **单人形态** | AGENTS.md **零论述** personal / private assistant | DSH 没有"私人助理"概念 |
| **云端部署** | **有单机远程访问的完整实现**：`workspace-files-service` 原文 *"from a browser that may not be on the Host machine"* + `/api/file` 认证路由 + 持续重连；**缺的是多用户 / 租户语义与传输安全**（出厂形态仍是本机 loopback）| **"单机远程访问"从自做降为配置与加固**（承接总表 2.10.1）；**多用户 / 租户隔离仍需自做**。另有 **Remote & Mobile 分类 89 个插件**提供多端接入（飞书 bot / LAN access / auth tunnel / winrm）可作选型 |
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
| **跨语言切换** | DSH = TypeScript，LarryAgent 后端 = Python FastAPI | 本文所述路径下后端整体改 TS；保留部分 Python 脚本（数据迁移等）。（第 0 项已终裁走 A-framework，Python SDK 路径不再启用，该假设作废。）**【老大裁定】跨语言成本是本项目的「最小成本」，决策时完全可忽略——不得再以"跨语言成本高"为由否决任何路径** |
| **生态繁荣但质量参差**（**前判"生态早期"已推翻**，见 §2 插件生态行）| 3,199 插件 / 25 分类，但 UI·主题类占 640+（大量玩具）；个人作者为主，弃坑风险高 | **只借鉴、不直装（§3.0）**——生态价值定位为**参考实现库**：读源码抄设计、必要时 fork 自改；**不把任何关键能力押在外部作者的维护意愿上**。临时验证只在隔离环境装，不进产品依赖。补充（老大）：3,199 这个数字本身也可能含代理行为与跟风件，**不可作为"有人维护"的证据** |
| **插件版本漂移** | DSH preview 期 API 频繁变动，插件作者跟不上（已有插件标注 "verified against DSH 0.1.0-rc.6"，而锁定版已到 `0.1.5-rc.2`）| 因 §3.0 **不直装**，本风险对**产品运行时不成立**（我们不依赖插件跟上 DSH）；仅影响**参考时效**——借鉴时标注其验证版本，fork 代码须按锁定版 `0.1.5-rc.2` 重验 API。DSH 升级时**不产生插件兼容性回归项** |
| **第三方插件安全** | SAFETY.md 明示：沙箱、审批与权限控制**不能保证隔离**（未接受安全审计）| 第三方插件视为**不可信代码**。**§3.0 后本风险大幅下降**：不直装 = **未经审读的**第三方代码不进运行时（fork 路径下经改造的源码必先审读，措辞前后自洽）；凭据 / 文件 / 网络相关部分按最小权限重写。**缺口（QoderWork 二点，采纳）**：不直装 = 失去上游自动补丁通道 → 须补 **upstream 追踪与 CVE 响应流程**（见 §3.7）|
| **会话存储外接**（原 §九 保留项）| `storage/` 是 Non-session storage hub + backends | ✅ **DSH-2.5 ① 已实测（2026-09-10）**：官方 `dsh-storage-sqlite` backend 仅需配置，`path` 可指任意绝对路径（脱离 `.dsh-home`）→ 外接 SQLite **可行**（结论见下方 DSH-2 退出条件）|
| **headless + ACP 契约**（原 §九 保留项）| `acp/` 描述"Automation-only Agent Client Protocol server" | ✅ **DSH-2.5 ② 已实测（2026-09-10）**：`initialize` / `session.new` / `session.list` / `session.close` 均 OK；`fork` / `load` / `delete` = **`-32601` 方法缺失**（对照 `session/resume` = `-32602` 证明非鉴权遮挡）→ 契约面稳定，但**无 fork / replay，不适合前端**（§3.6）|
| **产品承诺渗透性漂移（层间泄漏）**（Marvis，采纳）| 承接 ≠ 承诺不变，底座机制会悄悄改写产品语义：① **2.4.3 硬删 vs session append-only 留痕**（**仅在「记忆事件写进 session log」这一种设计下成立**，与 2.8.2 行为可见冲突）；② **2.9.2 保真度档位**取决于 compaction 默认策略（不满足则自做策略插件）；③ **三处泄底**：术语（harness 词不得出现在用户可见处）/ 交互（审批须默认聚合、低打扰）/ 能力（接了 8 个子项却没兑成体验）| **换底座对用户观感中性偏加分**——DSH 是原材料，净影响由语义层决定；**"套壳"在用户侧不是风险，真风险是没把白给子项兑成体验**。① **前提已收窄**：记忆本体存自库（`storage` domain / 外接 SQLite，DSH-2.5 ① 已实测）⇒ 硬删**无 append-only 冲突**，须在 DSH-4 写死「记忆本体不入 session log」（承接总表 2.4.3）。仍挂 2.4.3 验收注记：删 → 回放 → 断言 session / trajectory 无残留；② 泄底三项由语义层收敛，不进必关清单 |

**升级 SOP**（取代原"锁版本不升不降"——该表述与立论③"随 DSH 演进"自相矛盾，第 1 轮 Trae/QoderWork/Marvis 三方一致指出）：

- **节拍**：跟随 **rc 及以上** 的 release tag（不跟 master HEAD）；**`alpha` 只作监控信号、不跟随**。
  - **为何须写明（消歧义，非新增规则）**：DSH 的 rc 与 alpha **同为 `dsh-v*` 前缀的 prerelease tag，形式无差别**（84 行：11 个 release 全部 prerelease），故"跟随 release tag"字面口径**会把 alpha 包含进去**——须按**版本号语义**筛选，而非"有 tag 即跟"。
  - **双护栏**：① 按**版本号语义**筛选（`-alpha.` 段一律只监控不跟；`-rc.` 起才考虑）——**原记「alpha 未进包管理器 / npm、PyPI latest 仍为 `0.1.2-rc.1`」已由基线收口复核证伪**（原「DSH-2.6 复核」，2026-09-15 并入 §3.4〈基线收口复核〉；2026-09-10 起 latest = `0.1.5-rc.1`），故不能靠"npm 有没有"来区分 rc / alpha，只能按版本号段判；② 我们的锁定源是 **git tag**（§2.2 `ref/dsh-bare`），故①对 `ls-remote --tags` 的查法不成立 → **一律以包管理器已发布版本为准，git tag 仅用于读源码**。详见下方「DSH-2.6 收口复核」。
  - **【老大已拍板】**——"目前先跟随 release tag，具体怎么做到时候再讨论，现在过于细节地讨论纯属空中楼阁"
  - **持续动作**：跟踪上游 tag（当前 release 线 `0.1.5-rc.2`）——按上条节拍筛选，rc 及以上才考虑，alpha 只记录不跟随。**原属 DSH-1 事实校准阶段的未完成项，随该阶段归档后并入此处**（持续性动作不随阶段归档）
  - **复核节拍（老大 2026-09-08 定）**：**不与上游 alpha 节奏绑死，按我们自己的阶段节拍走**——每个 DSH 阶段**完成后**，用当时最新的 rc 版本做一轮复核（评估锁定版是否已过期、有无影响本阶段结论的变更；纯测绘成本低，但结论必须标注基线版本）。DSH-2 的复核点在其任务 0 判定 + 5 项实测收口之后
- **首触发条件**：下一版本确认修复性能回退 + 破坏性变更窗口消化（**不是**"有新能力才升"）
- **回归分三层**（Claude 采纳——原"每次必跑 P4 全矩阵"在 2.3 天一 tag 下不可执行）：① **每次升级** = RPC 契约快照 diff + `llm-replay` 快照回归（无 key、秒级、廉价哨兵）；② **事件触发**（性能回退修复版 / 破坏性变更 / 影响 31 子项承诺的变更）= P4 全矩阵 + 真实验收；③ **季度评审** = GA 进展 / 生态 / 是否切 HEAD
- **回退**：任一红**先尝试适配（timebox 一个 release 周期、双轨保护下），超时未收敛即回退上一 tag**——回退仍是默认动作；适配必须有期限，否则"适配"演变为"漂移"
- **锁定期成本承认**：锁定期内 alpha bug 由本项目背，不指望上游修

#### 基线收口复核（2026-09-15 · 基线已挪至 `0.1.5-rc.2`）

> **复核动作**：① 锁定版是否过期 + 有无影响本阶段结论的变更；② 重跑 DSH-2.0 形态测绘（同版本内完成）。**判定：基线由 `0.1.2-rc.1` 挪至 `0.1.5-rc.2`**（老大 2026-09-15 拍：产品哲学上的形态已经确定，不必等 stable）。

**① 版本时间线（🟡 npm registry / release notes）**

原锁 `0.1.2-rc.1`（**2026-09-03**）→ 现锁 **`0.1.5-rc.2`**（09-10 14:57）。7 天出 **2 个 rc**，且 **0.1.3 / 0.1.4 无 rc**（`0.1.3-alpha.2` 后直接跳进 `0.1.5` 线）。通道现状（**2026-09-15 实测**）：`latest` = `0.1.5-rc.1`（**未推进**）、`next` = `0.1.5-rc.2`、`alpha` = **`0.1.6-alpha.1`**（09-15 10:42 发布，距 015-rc.2 仅 **4 天 / 800 commits**）。

**② 影响本阶段结论的变更（有，且集中在"实现范式"）**

0.1.5-rc.1 自述「汇总自 v0.1.2-rc.1 以来主要变更」，破坏性项：

- **Session 数据格式 V2→V3**（仅升不降）——🟢 新版才新增迁移文档（旧版只有 guard 测试）
- **Session 生命周期**：`SessionHandle` 持有 + **session 锁**（同一 session 至多一进程）
- **插件 Agent API：移除 `ctx.agent`**；Inbox API 类型化
- **自定义 persona 配置拆分前缀 / 后缀**（旧配置要适配）← 直压 §3.6 承接表「角色机制」行
- Web 面板 API：`conversation` slot → `main`；默认工具调整（SDK 默认 read/write/edit）

外加 `FS_NOT_OBSERVED` 诊断统一、Windows 子进程清理改善、默认模型切 `deepseek-flash`。

**③ 重跑形态测绘（🟢 纯源码级，两版对照）**

`packages/` 顶层**目录 50 = 50**（无增删）；全仓文件 **8,854 → 10,178（+15%）**；**DSH-2.0 的 8 项证据文件全部存在，机制签名 1:1 存续**（`inject=['tools']` / `inject(['systemPrompt'])` / `INSTEAD OF` 换实现 / `ctx.compaction` 契约 / `ctx.sandbox` 服务，新旧计数一致）→ **A 案在 0.1.5-rc.2 上仍成立**。

**④ 逐条压到 5 项退出条件上（可行性判定未被推翻）**

| 退出条件 | 判定 |
|---|---|
| ① storage 外接 SQLite | 🟢 `packages/storage/` 四件套两版**完全一致**，`storageDomain` 契约在。⚠️ 0.1.2-rc.1 notes 那条「移除 SQLite **Session** 后端」指的是**会话日志后端**，非我们用的 storage domain —— **勿误读** |
| ② `acp/` 契约 | 🟢 方法集合 ident 不变 |
| ③ Windows `ctx.sandbox` provider | 🟢 服务契约在；⚠️ **我们的方言修复件在 0.1.5 上未复验** |
| ④ Vue→sdk profile 连通 | 🟢 **SDK 协议面完全没动**（`sdk/protocol/src/types.ts:116` 的 `initialize` 连行号都一样，`packages/sdk/` 38 = 38）→ **B 段基础稳定** |
| ⑤ TS embedding | 无上游依赖，不受影响 |

**⑤ 升级闸门（§3.4 首触发条件）—— 本节已废止（基线已挪）**

> 原「首触发条件」以「性能回退修复 + 破坏性窗口消化」为门槛，2026-09-11 曾据此判「不升」。**2026-09-15 老大改判**：产品哲学形态已定，**不再等 stable**，直接以 `0.1.5-rc.2` 为基线。该闸门**作为升级 SOP 的触发条件保留**（§3.4），但**不再用于挡基线选择**。
- 历史核查留痕（**引文，保留原文**）：`0.1.2-rc.1` 的 notes 只有"改善…"，`0.1.2→0.1.5` 五版全无"性能回退修复"字样 ⇒ 该条**出处仍未找到**。

**【老大裁定 · 2026-09-15 覆盖 09-11 判定】基线挪至 `0.1.5-rc.2`。** 理由（老大原话口径）：**产品哲学上的形态已经确定**，不必再等 stable；015 的变更集中在实现范式，对 DSH-2 机制面结论无威胁（复核见 §2.3）。
**代价记账**：① **破坏性清单已落档**（本节 ②）；② **DSH-3 起写码按 `0.1.5-rc.2` API 走**；③ ⚠️ **CLI 与 profile 必须同代** —— ✅ **已全项闭合**：CVM 侧已完成（2026-09-16：`~/.dsh/profiles/sdk` 与 CLI 均 `0.1.5-rc.2`）；脚本钉版亦已处置（2026-09-17：参数化为 `DSH_VERSION` 并回同步 CVM，见 §2.3 未闭合项 #6）；④ 升级当**独立动作**做（不在阶段内顺手升）。

**⑥ 顺带订正**：`sdk` profile 的 manifest 实为 **`patchReload: startup`**，只有 `larry` 是 `live` —— 而 **B 段恰好走 sdk**，决策稿此前只记了 larry 的 `live`（见 §3.6 环境规格表 sdk 行）。

### 3.5 路径决策

| 路径 | 决策 | 理由 |
|---|---|---|
| **A 换底座** | **✅ 拍板** | 底座能力开箱（31 子项对照 **🟢 12 / 🟡 15 / 🔴 4**，见 §3.6 承接总表）+ 免自造底座 + 演进红利；项目小 + 专属能力薄；能力建设 / 信息流接入层面 A 长期赢；**另加生态红利——但按 §3.0 定性为「设计红利」**：3,199 插件是可查阅的**参考实现库**（省试错与设计：schema / 检索策略 / 时间上下文建模 / 信任模型可直接借鉴），**不是可直装的能力货架**（不省实现、不省维护）|
| B 嵌一层 | ❌ 不推荐 | 与 A 重叠大半收益，但跨语言通信 + 双套状态同步复杂度高一档 |
| C 借思路 | ⚠️ 备选（**仅适用**等 DSH GA / 不绑 preview 风险）| prototype 可短期升级三个 🚧，但与 DSH 演进的 drift 成本长期无法消除 |
| D 接能力 | ❌ 不推荐 | A 已满足当前诉求；D 仅在"想要 DSH 独家能力"时启用 |

> **⚠️ 第 0 项（Py SDK 成色）—— 已终裁 2026-09-08**

> **【第 0 项实测结论 · 2026-09-08 · 已终裁】**：Trae 判**一等**、Claude 判**一等**、**QoderWork 判二等**。**WB 判定二等（采纳 QoderWork）；老大 2026-09-08 确认** → **定 A-framework（全面贴近核心层，含语言）**，本分岔关闭。三份实测报告（`dsh-pysdk-probe-trae.md` / `-claude.md` / `-qoder.md`）**永久保留作可复现证据**，引用口径以本节为准（Trae / Claude 两份的「一等」为原始交付，已被本节覆盖）。
>
> - **决定性事实（🟢 WB 本地锁定版核实，未采信转述）**：SDK JSON-RPC 请求面只有 `initialize` / `session/prompt` / `shutdown` 三个方法（`packages/sdk/protocol/src/types.ts:115-119`，`server.ts:248-253` 只分派这三个，grep approve/answer/respond **零命中**）；原生 `interaction/user-questions`、`user-approval` 有同进程 waterfall answerer；官方设计文档 `2026-07-06-approval-seam.md` 明写「Zero listeners fall through to **unavailable**」→ **2.7.2 的回答侧在 SDK 协议面不可得**。
> - **分歧根源是 WB 派发稿缺陷（认）**：判据 1「能力覆盖无实质缺口」含**两个不同尺度**——Trae / Claude 按「method 面差集为空」执行（比 SDK client vs TS SDK client，两者同为 design twin 故无差）；QoderWork 按「31 子项用户可达」执行。**同一判据两个尺度，必然分叉**；QoderWork 的尺度才是本意（老大裁的是"是不是一等公民"，判据应是产品能力可达性）。
> - **缺口可补，但需写 TS**：B1 通道已由 Claude / QoderWork 实测可行（手工放置 cordis 插件，或隔离 pnpm 安装）→ 2.7.2 可经 **TS answerer 插件**或 **permission-preset 白名单**恢复。**不是不可达，是"不能开箱"**。
> - **为何仍判二等**：①"必须写 TS 才能完成"即 Python 侧不能独立完成全链路，正是"弱于原生 TS 路径"；②**2.7 边界域是核心产品承诺**——把边界决策放进 DSH 内的 TS 插件、Python 只做消息管道，与"保留 Python 主控"的价值主张冲突；③ §3.5 已有「23 项语义层须 TS / Cordis 插件挂载」口径，再加 answerer，"省下的成本"被进一步稀释。
> - **后果（已生效）**：走 **A-framework** —— 现有 Python 后端核心非测试代码（~3.7–4.4k 行）翻译为 DSH 插件 / 服务形式，**DSH-6 验收前双轨可回退**。本稿本就按此口径编写，无需换口径。
> - **成立理由（勿简化为"因为是二等"）**：① 2.7 边界域是核心产品承诺，**边界决策逻辑落在 DSH 内的 TS 插件侧** —— Python 只做消息管道则"主控"名存实亡；② 立论③「随 DSH 演进」在 A-service 下只能拿到 SDK 暴露面，而二等判定已证明该面 < 原生面。**"舍得抛弃现有成果"是前提，不是理由** —— 不可把老大的取舍意愿当作论据使用。
> - **③ 方向性风险（老大 2026-09-08；🟢 证据已由本地核实补齐）**：Python SDK 的运行时**本身就是 TS 的编译产物**——`deepseek-harness-runtime-bin` 是把 `dsh` 与整个 Node 依赖树打包成原生可执行文件的平台 wheel（win_amd64 约 69MB）。即：**能力面由 TS 侧定义，PY 侧永远是跟随者**；「补齐」只改变当下差距，**不改变这个方向**。故本条理由**不可被「新版补齐了」推翻**——与「二等」这个事实判定性质不同。
>   - **硬约束（🟢 PyPI 实测 2026-09-15）**：该包最新 **`0.1.5rc1`**，**5 个平台 wheel、仍无 sdist**（`win_amd64` / `manylinux_2_28_x86_64` / `manylinux_2_28_aarch64` / `macosx_14_0_arm64` / **`macosx_14_0_x86_64`**），官方自述「no Windows arm64 wheel is published」。→ **平台覆盖由上游单方决定，且无源码分发可供用户自补**；平台一旦缺位或延后打包，PY 侧直接不可用。A-framework 走 npm + Node，此约束不适用。
>   - **概率自评（老大原话）**：PY 版本被抛弃「实际上我觉得不太可能」→ **③ 是保险性论据（低概率 × 高影响），不是主梁**；主梁仍是 ① ②。不得把③单独用作「所以 TS 一定对」的推论。
> - **⚠️ 对称风险（勿忽略，避免把③用成单向话术）**：A-framework 消掉了「PY 被抛弃」的风险，但**放大了「DSH 本体出问题」的敞口**（§3.4 上游集中度：高；且 4 天 644 commit 的 alpha 速度意味着核心层变动最剧烈，而我们恰贴核心层）。这是**真实取舍**，不是「PY 有风险所以 TS 就稳」。
>
> **已作废的路径（留档一条，防止后人重提）**：曾设想经 PyPI 的 `deepseek-harness-sdk` + `deepseek-harness-runtime-bin`（把 `dsh` 与整个 Node 依赖树打包成原生可执行文件、运行期无需系统 Node.js、有 Windows x64 wheel）驱动 `dsh --profile sdk` 子进程，从而保留 Python 后端。**第 0 项判二等后此路径不再启用，不得以"省事 / 省成本"重新提出。**
>
> **从该设想中留下的有效结论**：`--profile sdk` 是完整 JSON-RPC server、Python SDK 只是客户端；**插件（Cordis 服务）装载在 DSH 运行时内** → 自做语义层须以 TS / Cordis 插件形态挂载。范围上 QoderWork 估**真正必须 TS 的约 5–8 项**（注入层 + 需深度介入 agent 组合的部分），窄于 23 项全量——**此估算未经实测，由DSH-2「任务 0」一并核实**。另：MCP 桥 / 事件流消费 / profile-patches 三条非 TS 通道（🟢 依据）保留作**降级备选**，不作主线。
>
> **A 已拍板（A-framework）**。DSH-2 五项实测见 §3.6 退出条件——它们是「**是否继续走 A**」的最后闸门（任一不过则重估、C 路径回退进入议程），不再是「选哪条路」。
>
> **路径内部分岔：A-framework vs A-service（QoderWork 一点，采纳）—— 已选定 A-framework，下表留作决策记录，不再重开**：
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

### 3.6 路径实施规划

> **口径注**：本节按 **A-framework** 口径编写（第 0 项已终裁，路径分岔关闭）。

**总思路**：LarryAgent 后端从 Python 切换到 TypeScript + DSH 框架。**意味着**：现有后端核心非测试代码（~3.7–4.4k 行，统计口径见 §3.7 备注）翻译为 DSH 插件/服务形式。**保留**：SQLite schema、SQLite 双写（作为 DSH 插件挂载）、业务核心逻辑（角色 config、工具实现）。

**双轨并行（迁移期可用性保障）**：旧 Python 后端在DSH-6 验收通过前**保持可用、可回退**，DSH-6「功能等价」通过后才切换——迁移期间老大作为用户不失去 LarryAgent（产品树口径「已做 = 用户可达」）。

**时序纪律（Claude 四点 / QoderWork 三点，采纳；老大裁定修正）**：当前是「代码体量小 + 数据体量小」的**双重窗口**（`backend/data/chroma/larry_memories` count = 0）。QoderWork 主张把「记忆 schema 定稿」设为DSH-3/4 派发**硬门禁**，理由是窗口关闭是非线性的（活数据不能停机 + 兼容层 + 双索引）。**老大裁定**：**schema 是否为 0 不影响迁移决策**（当前远未正式使用，全部为测试数据，需要时直接启用新的即可，不存在数据迁移的技术难度或成本）。故本稿口径为：**记忆 schema 应尽早定稿（成本最低），但定稿是「优化项」不是「阻塞项」，不构成迁移门禁**。**【老大二次裁定】由于不存在真实数据，记忆 schema 不作为DSH-4 门禁；若判定存在技术面分歧或风险，用测试数据验证即可**（Marvis 曾引 arXiv:2603.01209 主张设硬门禁，核验为「论文真实但场景错配」——研究对象是自微调模型的 interpreter 变量持久化，与本项目不符。）

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
| **Windows 官方 CLI 崩溃 —— ⚠️ 口径已修正**（Claude + QoderWork 独立发现 🟢；Trae 2026-09-09 反证 🟢）| 第 0 项：`dsh.exe --version` / `--dump-config` 在 Windows "稳定 segfault（0xC0000005）"。**DSH-2 反证**：npm 全局安装的 `dsh@0.1.2-rc.1` 在 Windows **实测全部可用**（⚠️ 该实测的**通道是 012**，015 上须复跑，见 §2.3 未闭合项 #5）——`plugin --profile add` / `--dump-config` / `--help` / 完整会话（demo-ptc）均 exit 0 | **不可用"Windows CLI 崩"作铁律**。崩溃与**入口/安装方式**相关：npm 全局 `dsh` 可用；**源码入口（`bin.ts` + tsx）在 PowerShell 下偶发卡住**（Trae 实测改用 npm 全局后全通）。**默认走 npm 全局 `dsh`，不用源码 tsx 入口**；若复现崩溃须记录具体入口与安装方式再定性 |
| **长 turn 无超时保护**（Claude 真实 key 实测 + QoderWork 源码确认 🟢）| `request_timeout_seconds` 只覆盖单次 JSON-RPC 往返，turn 等待 `subscription.next()` 无 timeout → 子进程挂起时 SDK **无限等待** | **应用层必须自建 watchdog**（A-framework 下同样需要）|
| **B1 安装期仍需 Node / pnpm**（QoderWork 🟢）| 不带 pnpm 安装失败，隔离装 pnpm 10.17.1 后成功 | "无需系统 Node"**只在运行期成立**，安装 / 升级链路不是纯 Python |
| **MCP 只证 Tools**（QoderWork 🟢）| Resources / Prompts / 任意 Cordis 内部 service 或 hook **未证**可经 MCP 等价桥接 | 不得外推为"所有能力均可经 MCP 桥接" |
| **Python 侧事件多为 `JsonObject`**（QoderWork 🟡）| 无 TS 判别联合类型与同级运行时校验 | 升级时更易**静默接受字段漂移**（走 A-framework 后影响降低，保留作背景）|
| **⚠️ 跨进程 resume 的 id collision 定性未收敛** | Claude 判"可能是 SDK 缺口或姿势问题"（源码 `packages/core/session` 称 cold session 应 resumed on first touch，但 Python SDK `start_session(session_id)` 触发 collision）；QoderWork / Trae 判"探针用固定 ID 所致，改 UUID 后成功" | 影响 2.4.1 / 2.8.2 的 fork / resume 承接叙事 → **列为 DSH-3 首验项**（待办见 TODO「DSH-3」）|

> **产品承诺面**（区别于上述安全 / 运行时面）：**记忆删除在 session / trajectory 层的级联语义**——见 §3.4「产品承诺渗透性漂移」行，挂 2.4.3 验收注记。

**前端路线（DSH-2 定死）**：**保留 Vue/Tauri 客户端**、**不采用 DSH Web-GUI**——Tauri 壳是 2.10.2 端侧执行器的宿主，换 web client 等于废掉 client/ 全部工作并丢掉端侧能力载体。**通信面（sdk / acp / 自做网关）暂取 sdk / acp**（DSH-2.3 已实测，sdk 面边界见下方「sdk 面实测能力边界」）。

> ⚠️ **未收敛项（DSH-2.3 提出）**：通信面暂取 sdk / acp，但 **sdk 面的 JSON-RPC 请求面只有 `initialize` / `session/prompt` / `shutdown`——这正是不判二等的同一个窄面**（§3.5）。若 client 长期经 sdk 通信，则客户端一侧被永久限制在该窄面内，与 A-framework「贴近核心层」的初衷存在张力。
> **已实测（2026-09-09）**：sdk 面的完整能力边界见下方「sdk 面实测能力边界」小节——**窄面确认属实**（wire 方法面 + 无自带传输/UI）；本项**已由定型结论（自做服务中转）绕开**，sdk 只承担 B 段（服务 ↔ DSH 同机）。
> **已定型（2026-09-09）**：见下方「定型结论」——**经自做云端服务中转**。

#### 通信面选型分析（🟢 2026-09-09 源码级实测；**前提①已于同日由老大拍板定案**，见文末「定型结论」）

> **先厘清一回事**：「通信面」其实是**两层**，混在一起讨论会得出错误结论——
> **L1 前端（Vue/Tauri / 移动版浏览器）↔ DSH host**：是否跨网络，取决于 DSH host 跑在哪；
> **L2 C 侧本地副作用工具（file_ops / shell）的反向驱动**：Host 令 Client 执行并回传结果。
> **L2 三个官方面都没有现成语义，必须自做**（可架在任一面的流通道上），与选型**正交**。

| 选项 | 传输 | 跨网络 | 能力面（源码/文档实证） | 官方定位 |
|---|---|---|---|---|
| **sdk**（`dsh-sdk-client`） | **stdio 本地子进程** | ❌ 同机 | 下行仅 `initialize`/`session.prompt`/`shutdown`；上行 19 类事件 | 编程驱动**一次**会话 |
| **acp**（`dsh-acp`） | **stdio JSON-RPC** | ❌ 同机 | ACP v1 标准面：create/resume/list/MCP/选模型/prompt/cancel；**不支持 delete / fork / transcript replay**；**"never private DSH presentation data or methods"** | **自动化**——子代理、测试运行器、脚本控制器；明确**不适合 UI** |
| **Typert/Gateway**（`dsh-api-gateway` + `*-controller`） | **HTTP `/api` + WebSocket `/api/remote.mux`** | ✅ | **宽面**：会话全生命周期、历史分页、事件流（`RemoteJournalStream`）、快照流（`RemoteSnapshotStream`）、**fork / cancel / rename / prompt**、skills 发现、模型目录、文件引用、subagent；含**重连追赶 + gap 修复 + 2s 心跳** | **官方 Client↔Host 通道**（Host `ctx.typertGateway` / Client `ctx.remote`） |
| 自做 HTTP 桥 | 自定 | ✅ | 自定，流/重连/取消/分页全部自实现 | 兜底 |

**判定**：

1. **sdk 与 acp 都不是"跨网络前端面"的候选**——两者都是 **stdio 本地子进程**。若 DSH host 上云（§2.10.1 既定），前端与它跨网络，**这两个面天然出局**。2.3 的"Tauri 经 sdk 连通"成立，但那是**同机开发形态**，不可外推到目标架构。
2. **acp 额外出局一条**：它明写"不暴露 DSH 私有展示数据与方法""避免用于需要 DSH 特定 UI 的场景"，且无 fork/replay → 连"宽面"都不算。**它的正确用途是子代理/测试集成，不是前端。**
3. **唯一同时满足「跨网络 + 宽面」的官方方案是 Typert/Gateway**，且它补的正是 sdk 窄面的缺口（会话树、历史分页、fork、取消、取消感知、重连）。**与 A-framework 同向**：我们的业务是 DSH 进程内插件，Gateway 是它对外暴露的标准出口。
5. 🔴 **修正昨日两条判断（2026-09-09 二次测绘，源码级）**：昨日判「前端须自实现 Typert 客户端」「鉴权须自做」——**两条均被推翻**：
   - 官方 **`dsh-web-app`**（2026-09-15 实测：`next` 通道 = `0.1.5-rc.2`、`alpha` = `0.1.6-alpha.1`；其 npm `latest` tag 仍停 `0.0.1-rc.1`）= *"The dsh **browser-surface bundle**: the web patch layer over dsh-base plus the runtime glue plugin (frontend dist serving…)"*，`dsh --profile web` **开箱启动**、自动开浏览器。
   - 其依赖含 **30+ `dsh-client-ui-*`**：chat / conversation / sidebar / settings / plan / schedule / **approval** / **permission-presets** / model-selection / goal / commands / session / brand-official …→ **官方已有完整 Web UI 组件层**，不是"只给协议"。
   - **鉴权已内置**：启动 URL 带 process token → 浏览器换签名 cookie → 重定向干净 root。**实测 `curl http://127.0.0.1:8123/` → `HTTP 401`**（未带 token 被拦），与 README 一致。
   - `dsh-api-gateway` 在 **base 默认启用**（`dsh-base/cordis.patch.yml:45` `- id: typert-gateway`），非可选附加 → DSH 侧装配成本为 **0**。
6. 🟡 **新增硬约束（对上云有直接影响）**：web surface **不支持绑定全部网卡**——README 原话 *"binding all network interfaces is intentionally not supported"*，只能经 `--host` / `--trusted-host` 白名单放开。**上云部署形态须按此约束设计**（反向代理或显式白名单）。

> ⭐ **DSH-3 的 S0 通道已定（老大 2026-09-14 拍）：`sdk`。** 它走的就是 **B 段**（服务 ↔ DSH 同机，09-09 定型 SDK/stdio），**不是新开一条面**；依据 = 前置件 1（`harness/tests/real-api.ts`）**已用 `dsh-sdk-client` + `profile: 'sdk'`**（绿/红两侧经 WB 独立复验）⇒ **零新增器材**；S0 四项判据在〈sdk 面实测能力边界〉**逐条覆盖**。
> **ACP 的用途（一笔记录）**：ACP = **对外"标准 agent server"入口**（第三方 IDE / CI 直驱）+ **子代理 / 测试集成**的协议面；本项目**不在 DSH-3 用它**。⚠️ **它不是 sdk 的升级替代** —— sdk 面虽无具名 `resume`，**续会话语义在 `SessionPromptParams.sessionId` 上**（`packages/sdk/protocol/src/types.ts:36-38`；方法面 `:115-119` 仅 `initialize` / `session/prompt` / `shutdown`），acp 的 `session/resume` 是**同能力的不同承载**，**不构成换面理由**。

**风险（修订）**：① preview 期 API 漂移（锁定 `0.1.5-rc.2`，2026-09-15 前为 `0.1.2-rc.1`）；② **鉴权已内置**（token→签名 cookie），但**多用户 / 租户隔离仍须自做**（§3.3：远程访问已有完整实现，缺的是多用户 / 租户语义与传输安全）；③ 浏览器侧 WS 可行（README 明写 browser 在 WS 协议层答 Pong）→ 对移动版 B/S 有利，未实测；④ **L2 反向工具执行仍须自做**（事件流下发指令 + unary 回传结果），此缺口三个官方面都没有。

> ✅ **可复用性已确认（2026-09-09，推翻一小时前"未知"的判词）**：`dsh-client-connection`、`dsh-client-ui-*` **全部随 npm 分发**（实测 **41 个 `dsh-client-*` 包**，含 chat / theme / brand-official / connection；2026-09-15 复核：`dsh-client-ui-chat` 已到 `0.1.6-alpha.1`，**「包随 npm 分发、可 `pnpm add`」的事实不变**，仅版本号推进）。以 `dsh-client-ui-chat` 为例，其形态为**双面包**：
> - `lib/index.js` = **node half**；`lib/client.js` = **browser half**（exports 里对应 `"."` 与 `"./client"`）；
> - exports 另含 **`"./src/*"`** → **源码随包分发**，可直接读源码作参考实现。
>
> → **可直接 `pnpm add` 依赖官方前端组件，不必从零自做。** 此前"未出现在 `.pnpm` → 可复用性未知"是**检索方法错误**（pnpm 目录为哈希截断名，用完整包名匹配必然落空），不是事实。

#### UI 自由度边界（🟢 2026-09-09 源码级定界）

> **老大问的极限问题：能不能全部重写、自由替换？边界在哪？——能，且边界可精确划定。**

**机制基础（三条源码事实）**：
1. **浏览器端插件是运行时加载的**：`dsh-client-modules` 的 node half **扫描 cordis 插件树** → 组合 `window.__DSH_BOOT__` → 对外服务 **`/plugins/<id>/client.js`**。→ **我们自己的插件只要带 browser half，就会被自动装配进前端 shell。**
2. **UI 是插件 roster 组合出来的，不是单体**：web-app 的 `cordis.patch.yml` 里 30+ 个 `client-ui-*` 各占一行（theme / layout / renderer / session / sidebar / settings / chat / approval / plan / goal / brand…）→ **改 roster = 改 UI**。
3. **品牌是显式插槽**：装配文件原话 *"Official occupants for the generic sidebar and conversation **brand slots**"* —— 官方包只是 slot 的**占用者（occupant）**，第三方可占位。

**三层自由度**：

| 层级 | 做法 | 成本 | 证据 |
|---|---|---|---|
| **L1 换皮** | 换 `ui-theme` + 占位 brand slot | 最低 | `ui-theme` 独立插件；brand 为通用插槽 |
| **L2 换/增删部件** | roster 里替换单个 `client-ui-*`（如自写 chat 替换官方 chat） | 中 | 每部件独立插件行；`dsh-client-ui-chat` 可依赖可参照 |
| **L3 换整个前端** | 自做前端**直连 `/api`** | 最高但可行 | connection 的 node half **把 gateway 挂在 webserver 的 `/api` 下**；browser half 是 **fetch / SSE** 客户端 |

**边界（硬限制，须记住）**：
1. **前端 shell kernel（dist）不作为用户配置开放**——装配文件原话 *"an assembly fact of dsh-web-app, never user config"*。dist 缺失时启动即停（*no source-serving fallback*）。**能否整体替换 dist 仍待验**（测试文件提到 "fallback seat"，可能是替换位）。
2. **鉴权必须过**：token → 签名 cookie（实测未带 token 的 `curl` 返回 **401**）。
3. **传输是 HTTP unary + SSE**（不是 WebSocket）→ 自做客户端成本低于预期，但须遵循该协议。
4. **L2 反向工具执行仍须自做**（三个官方面均无此语义）。

> **对 A-framework 的意义**：这套机制与我们的路线**天然契合**——业务插件写在 DSH 进程内（node half），同时可带 browser half 自动注入官方前端 shell；既不必自做整套 UI，也不必被官方 UI 绑死。**「自做前端 vs 复用官方」不再是二选一，而是可以渐进：先用官方 shell + 自写部件，必要时再整体换壳。**

**WB 倾向（已被定型结论取代，保留作推演痕迹）**：Typert/Gateway 为主；"前端怎么来"从"必然自做"降级为"取决于官方资产可复用性"。

> ✅ **定型后修正（见「定型结论」）**：上述倾向谈的是**直连前提下的 L1 整段**。改为中转子，Gateway 的适用位置**从 A 段收窄到 B 段**（服务 ↔ DSH 同机），且**待验** `larry` profile 下能否起 HTTP。

**实测动作的优先级已随定型下调**：原「web surface 开箱实测」中，**①②③（dist 来源与可替换性 / token 获取 / 页面能力面）价值下降**——中转后我们不承载官方 shell；**④（`--trusted-host` 能否放开非 loopback / 反代可行性）已实测（2026-09-11）：反代可行 → 重估触发线 T2 判「命中」，见 `../production-env.md` §7.1**。

#### 定型结论：自做服务中转（🟢 老大 2026-09-09 拍板）

> ⚠️ **本决策为「先按此推进」，非终局**。老大原话：两个方案各有利弊、很难判定。故下方附**重估触发线**，命中即回头，不硬走。

**链路被切成三段**（此前 L1 是单一问题，定型后须分段讨论，混谈必错）：

| 段 | 路径 | 协议归属 | 跨网络 |
|---|---|---|---|
| **A** | 前端（PC 的 Vue/Tauri、移动版浏览器）↔ **自做云端服务** | **我们自定，与 DSH 无关** | ✅ 是（DSH 选型维度在此**失效**） |
| **B** | 自做云端服务 ↔ **DSH host** | 仍属 DSH 通信面选型 | ❌ **同机**（均在云端） |
| **C** | DSH host ⇢ **C 侧本地工具**（file_ops / shell）反向驱动 | **自做**（三官方面均无此语义） | — |

**四条连锁影响（定型后须记住，勿再按旧图思考）**：

1. **A 段退出 DSH 选型范围**——它是我们自己的前后端协议，DSH 的 sdk/acp/Gateway 在这里**都不参与**。此前"哪个面做前端"的全部讨论对 A 段无效。
2. **B 段是同机 → 此前"sdk/acp 跨网络出局"的排除理由对 B 段不成立**。⚠️ **这不等于要用 sdk**：Gateway 在同机同样可用（localhost HTTP + SSE）。**「中转」不导致能力降级——B 段的 sdk / Gateway 选型仍然开放。**
   - **sdk 路线**：**单进程多会话**（🟢 2026-09-10 实测修正，见下），无会话树/历史分页/fork，且 **`resume id collision` 未收敛**（§3.4 硬发现）是隐患。
     > 🔴 **更正一条曾长期存在的误述**：旧文称 sdk「多会话 = 多子进程」——**不成立**。`dsh-sdk-client` 官方契约原载 `DeepSeekHarness` owns **one** runtime subprocess **across many sessions**；CVM 实测 20 个 session 句柄 **RSS 增量 0.00 MB**、进程数恒为 1。详见 `docs/production-env.md` §2.4。
   - **Gateway 路线**：~~单进程多会话~~（⚠️ **此项不再构成相对 sdk 的优势**——sdk 同样是单进程多会话）+ **官方会话树 / fork / cancel / 历史分页 / 重连追赶 + gap 修复 + 2s 心跳**——**这些仍是 Gateway 独有的**，恰是中转方案下我们本要自做的部分（见代价①）。
   - 🔴 **「B 段取 Gateway」的原倾向已于 2026-09-10 被实测推翻** —— Gateway **无法脱离 `dsh-web-app` 独立起 HTTP**。详见下方【B 段 Gateway 路线实测判定】。**当前有效结论：B 段只能走 SDK（stdio）。**
3. **【会话状态策略】（老大 2026-09-10 洞察 → WB 拍板，属 A 段设计约束）**

   > **问题来源**：老大指出「侧栏长期存在十几二十个会话（懒得归档），这些算不算并发？」→ **不算**。这暴露了一个此前混淆的概念，并直接改变了 2G/4G 之争的性质。

   **核心区分（勿再混为一谈）**：

   | 层 | 内容 | 内存成本 | 谁是决定方 |
   |---|---|---|---|
   | **① 会话元数据**（列表/标题/时间） | 侧栏那十几二十条 | **≈ 0**（几十 KB） | — |
   | **② 会话历史内容** | 磁盘上的 `session.jsonl.zstd` | **0**（不驻留） | — |
   | **③ runtime 会话状态** | 单进程内跑过 prompt 的会话 | **≈ 2.24 MB/个**（🟢 实测） | **我们（策略）** |

   **→ 「侧栏 N 个会话」几乎不占内存；真正计费的只有 ③，而它的边际成本低到无需为省内存牺牲体验。**

   **WB 拍板（一期策略）**：

   1. **不设激进的 LRU 淘汰** —— 实测外推 20 个会话仅 ≈182 MB（占 2C2G 约 9%），**为省这点内存牺牲"顺着历史顺手查"的体验不划算**。
   2. **三态模型**（A 段协议须能表达）：`cold`（仅元数据）/ `warm`（历史已加载，用于 UI 渲染，未发 LLM）/ `hot`（runtime 内活跃）。
   3. **真正的约束不是内存，是 token 成本** —— `contextWindow = 1,000,000` 很宽，但每次恢复会话的 context 重建**要付真金白银**。故策略优化目标应是**减少无谓的 context 重建**，而非减少常驻。
   4. **多终端叠加**：PC + 手机同时看同一会话属 A 段协议职责（我们的服务），与 DSH 无关。

   **对 A 段协议的硬要求**：协议须能区分「打开看看」与「真的发一条」——前者不得触发 LLM 调用。

   ⚠️ **未闭合**：接近 100 万 token 上限时的 compaction 行为未测（18 轮远未触顶，且实测 compaction 事件计数为 0，**不可据此断言无此机制**）。若将来出现超长会话须重测。

4. **C 段在中转架构下变得更自然**：指令下发与结果回传发生在**我们的服务 ↔ C 侧**（PC 客户端本就要与云端保持长连/轮询），**完全不经过 DSH**。→ L2 从"DSH 通信面的缺口"降级为"我们自己协议内的事"，**这是中转方案相对直连的一个实质优势**。
5. **官方 WebUI / UI 自由度三层（L1 换皮 / L2 换部件 / L3 换壳）的定位改变**：
   - **L1 / L2 依赖 `dsh-web-app` roster** → 中转后**基本用不上**（我们不经官方 shell 承载前端）。
   - **L3 由"最高成本备选"变为主路径**。
   - **但可复用性仍然有效**：41 个 `dsh-client-*` 包可 `pnpm add` 直接依赖（exports 含 `./src/*`，源码随包分发）→ **"自做前端"的成本是"用官方组件拼"，不是"从零写"**。
   - 官方 web surface 仍保留一个用途：**云端 DSH 的本地管理 / 调试面**（运维视角）。

### ⭐ B 段 Gateway 路线实测判定（🟢 2026-09-10，CVM 实跑，推翻前述倾向）

**结论：Gateway 无法作为独立的 HTTP 服务端存在，B 段不具备启用 Gateway 的条件。→ 退到 SDK（stdio）。**

证据链（每条均为实跑，非推断）：

| # | 事实 | 等级 |
|---|---|---|
| 1 | **`larry` profile 不是预置的** —— `dsh --profile larry` 报 `profile does not exist`，须自行 `plugin add` 组装 | 🟢 |〔2026-09-17：该 profile **已退役**（本机工程＋全局两处）；**该事实本身仍成立、且适用于任何自建 profile** —— 换名后判据不变〕
| 2 | **`plugin add` 依赖 `pnpm`** —— 缺它则命令直接失败（CVM 初始无 pnpm） | 🟢 |
| 3 | **默认 `add` 会拉到错误版本** —— `@deepseek-ai/dsh-api-gateway` 的 `latest` 指向 **`0.0.1-rc.1`**（2026-09-15 复核：**该 tag 至今未推进**，而主包已到 `0.1.5-rc.2`、该包自身也已有 `0.1.6-alpha.1`）⇒ **「latest tag 不推」是上游多包通病**（`dsh-web-app` / `dsh-sdk-client` 的 latest 同样停在 `0.0.1-rc.1`），非本包个案，其依赖树引用 **`@deepseek-ai/dsh-type-meta`——该包在 npmmirror 与官方 registry 均 404、不存在** → install 直接失败。**必须显式锁版本 `=0.1.2-rc.1`**（与主包同版本） | 🟢 |
| 4 | **`plugin add` 只写入 `dependencies`，从不写入 `dsh.profile.bundles`** —— 装了不等于加载。实测 layer 数：web profile **145** / 自组 larry **85**（仅 `dsh-base`） | 🟢 |
| 5 | **手工补进 `bundles` 会报错**：`profile bundle "@deepseek-ai/dsh-host-webserver" declares no dsh.bundle in its package.json` | 🟢 |
| 6 | **55 个声明了 `dsh` 字段的包里，能起 HTTP 的 bundle 只有 `@deepseek-ai/dsh-web-app` 一个**（即官方 browser UI 那个包）。`dsh-api-gateway` / `dsh-host-webserver` 均**未声明 bundle**，只是它的内部件 | 🟢 |
| 7 | 而在已能正常起 HTTP 的 **web profile** 下，gateway 的唯一 RPC 路径 `/api/remote.mux` **带 cookie 仍 404**（见 `../production-env.md` §7） | 🟢 |

**判定**：想让 B 段走 HTTP，唯一入口是加载 `dsh-web-app`（连带官方 UI 及其鉴权体系）；而即便如此，gateway 的 RPC 端点仍拿不到。**Gateway 路线在当前版本不成立。**

**连带成立的三条推论**：

1. **B 段 = SDK（stdio）** → 与 `../production-env.md` §7.1 合并得：**自做服务与 DSH 必须同机，不可拆分到两台**。
2. ** Gateway 白送的能力（会话树 / fork / cancel / 历史分页 / 重连追赶 / gap 修复 / 2s 心跳）拿不到** → 这些须在 A 段自做。**注意：它们本就在本「代价①」清单里**，故此项是**工作量确认**，不是新增黑天鹅。
3. **重估触发线 T2 的前提需重读**：T2 原设为「官方 web surface 经反向代理对外可行」，但既然 Gateway 不可独立起 HTTP，T2 的可行路径**只剩反向代理 `dsh-web-app` 整体**（即把官方 UI 一起代理出去），而非只代理 gateway。

**尚未排除（勿外推）**：Gateway 可能需 typert 实例注册后才挂载路由；或后续版本补上 `dsh.bundle` 声明。**本次只能判定「当前版本不成立」，不能判定「官方永远不会做」。**

### ⭐ sdk 面实测能力边界（🟢 2026-09-09 DSH-2.3；B 段 = SDK stdio 的依据）

> 依据：Trae 实测报告（原 `dsh-23-vue-tauri-connect-trae.md`，2026-09-11 吸收；环境侧复跑见 `../local-env.md` §9）。B 段已定为 **SDK（stdio）** → **本表即 B 段的能力清单**，也是 §「未收敛项」所提"sdk 窄面"的实测答案。

**能做（sdk profile + TS SDK，已实测）**：

- **真实完整会话**：`initialize → session/prompt → 模型回复 → shutdown`，一条龙（exit 0）
- **事件流粒度足够**：`turn/start|end`、`step/start|end`、`assistant/chunk`（流式增量）、`assistant/message`、`user/message`、`request/header`（LLM 请求头）、`request/context`（注入上下文）、`session/title`（自动标题）、`agent/inbox/spliced`（收件箱回执）→ **记忆双写、流式 UI、会话标题所需信号粒度都在**，不是"窄面"能概括
- **会话持久化**：每次 prompt 落 `.dsh-home/sessions/`（`session.jsonl`），sessionId 可复现
- **服务端智能体能力**：base 全套（tools/session/agent 等）经 sdk profile 可达 → client 拿到的是「agent 完整回合结果 + 事件」而非裸 LLM 流

**做不了 / 受限（本通道）**：

- **stdout 归 JSON-RPC**：不能直接承载 UI/日志流；多路复用须靠上层封装（未来自做 HTTP 桥，把 stdio 面转为 client 可连的传输）
- **wire 方法面窄**：实际只有 `initialize` / `session/prompt`（+ `session`/`shutdown` 生命周期）——**对话之外的操面（会话树浏览、子代理管理、设置/配置读写等）不在此协议内**，须借 base 内插件扩展或换 web profile
- **runtime 子进程生命周期归 SDK**：每次 `run()` 由调用方起停；改 profile 插件代码须重启 runtime（**模块级 HMR 动态观察仍未落地**，需 web/tui 类长驻载体——与 DSH-2.1 结论一致，非本通道能力）
- **无 HTTP / 无浏览器面**：GUI 直连须走进程（Tauri Rust spawn）；浏览器环境不能直接用 TS SDK（无子进程能力）
- **模型路由固定**：sdk profile 下 agent 由 `llm-deepseek` 路由（`deepseek-official` / `deepseek-flash` 等）；要接 LarryAgent 的多模型/角色路由须在 base 层扩展（属后续业务，本任务未做）

**一句话**：sdk profile + TS SDK 是"客户端驱动完整 agent 会话"的**合格通道**（流式 + 事件 + 持久全有），窄在 **wire 方法面**与**无自带传输/UI** → 这正是 B 段须自做 A 段协议、并接受"自做服务与 DSH 同机"的原因，非本通道硬伤。

> ⚠️ **模型 id 改名注记（2026-09-10 老大指示）**：项目脚本模型 id 已统一 `deepseek-v4-flash` → `deepseek-flash`（真实调用冒烟通过；反向对照：换成不存在的 id 即 `INVALID_REQUEST`/400 → 证明服务端确实校验，非假绿）。
> **官方 catalog 已在 015 跟进**：`dsh-v0.1.2-rc.1` 的静态 catalog（`DEFAULT_MODELS`，`llm-deepseek/src/index.ts:92`）只声明 v4 系列（`deepseek-v4-flash` / `deepseek-v4-pro`）；**`0.1.5-rc.2` 已改为 `deepseek-flash`**（同文件同位置，2026-09-15 实测）⇒ 该注记的**改名事项已由上游闭环**。源码确认**未编目 id 不被拦**（catalog 查询是 advisory：价格 / contextWindow / 图片策略），会直传给 API。→ **改名后必须真实调用冒烟一次才算数，「改完没报错」≠「改名可用」。**

---

**代价（诚实列出，勿只看优势）**：① **流式转发、会话管理、鉴权、多端同步、重连追赶与断线补帧——全部自实现**；这些恰是官方 Gateway 白送的能力（重连追赶 / gap 修复 / 2s 心跳），走中转等于**用 A 段的自由度换 B 段之外的自研量**。② A、B 两段两次序列化 + 转发，延迟叠加。③ 会话/事件状态在我们的服务里需维护一份映射。

**重估触发线（命中任一即回头评估直连）**：
- **T1**：DSH-3 的 S0 切片实测显示自研流式/重连/会话管理复杂度显著超出预期；
- **T2**：官方 web surface 经反向代理对外服务被验证**可行且省事** —— 🟢 **已实测判「命中」（2026-09-11 WB）**：反代可行（"唯一已知障碍 `--trusted-host`"实为可绕过的 Host 校验）；因 Gateway 不可独立起 HTTP，只剩「反代整个 `dsh-web-app`」一条路 → **仅触发回头评估，定型不变**。证据与边界见 `../production-env.md` §7.1；
- **T3**：多端（PC + 移动）实时同步需求变强，自研同步成本逼近复用官方通道的成本。

> **已拍的两个前提（归档）**：① 部署形态 = **经自做云端服务中转**（本结论）；② **C 段反向工具执行由我们自做**，接受其不属于任何官方面。

**测试资产是独立工作包，不是DSH-6 附赠项**：现有 pytest 测试 ~4.4k 行，与核心代码 1:1。**第 0 项判 A-framework → 处置方式定稿：按 DSH 四层测试体系重建**（原"保留 + 增补边界契约层"是分岔表 A-service 行的口径，已随分岔作废）。无论哪条路径，测试基建（临时库隔离 / 真实库 fail-fast / `--real-api` 占位符机制）须在**DSH-2** 设计到位——不提前设计，DSH-3 起每步验证都裸奔。

#### DSH-1：事实校准 ✅（已归档 2026-09-08）

> **本阶段已完成，全文冷存于 `archive/roadmap-history.md`**（治理约定：完成一个归档一个）。内容：packages 盘点 / AGENTS.md / releases 阅读 / 第 0 项 Py SDK 一等二等判定（判定与证据见 §3.5）。
> 其中**持续性的「跟踪上游 tag」动作不随阶段归档**，已并入 §3.4 升级 SOP 节拍。

#### DSH-2：代码形态 + 环境准备

> **任务清单与进度见 `TODO.md`「DSH-2」**——本稿不存放待办，本节只放**验收基准与判定依据**。

- **参考源（已完成）**：DSH 主仓 clone 到 **`ref/dsh-bare/`**（项目根独立目录，`.gitignore` 排除、**不入 git**），**基线已由 `dsh-v0.1.2-rc.1` 挪至 `dsh-v0.1.5-rc.2`**（2026-09-15；裸仓库按 tag 直读，无工作区；**两版 tag 并存，可直接对照**）。查阅方式见 §2.2
- **代码存在形态：A 案已判定成立（DSH-2.0 · 2026-09-08）** —— LarryAgent = **独立仓库 + 构建 Cordis bundle 挂载**，**不 fork**。8 项必需能力**全部可经公开挂载面**（Cordis bundle / preset / patches / 配置 / MCP 桥）获得，**无一项需修改 DSH 上游代码**
  - **架构根因**：DSH 核心能力层是 **Service Definition / Provider / Consumer** 三分架构（capability seam 设计）——`ctx.approval` / `ctx.compaction` / `ctx.sandbox` / `ctx.fs` / `ctx.tools` 均为**契约**，默认实现只是**一个 Provider**。我们的全部必需能力 = 提供自己的 Provider / answerer / listener，消费者与模型侧不动
  - **证据（逐项表，🟢 纯源码级判定，2026-09-08）**：

    | # | 能力 | 可达通道 | 证据（`文件:行号`，锁定版） |
    |---|---|---|---|
    | 1 | **记忆双写**（会话事件 → 外部 SQLite + ChromaDB） | ① session.event 订阅（数据源）② 自做 cordis 插件做外部写入（SQLite/ChromaDB 是普通 Node/Python 依赖，插件内可用）③ MCP 桥（若走 Python 侧） | 事件流：`packages/core/session/src/known-event-types.ts:71,74`（tool/call、tool/result —— **012 为 :66/:69**，015 因 PTC 改名（`code-dispatch`→`ptc-dispatch`）新增 2 行而整体 +5）实测见 `dsh-pysdk-probe-claude.md` §4；B1 挂载实测 §3 |
    | 2 | **角色机制**（5 角色 persona + 工具集） | ① 静态：patch persona（B2 实测）② **动态：systemPrompt context 注入**（approval service 先例——scope.systemPrompt.context({ text: (ctx) => ... }) 按 agent 状态动态返回） | persona patch：`packages/bundle/sdk-app/cordis.patch.yml`（system-prompt 行）；动态注入先例：`packages/interaction/user-approval/src/index.ts:113-128`（ctx.inject(['systemPrompt']...context)） |
    | 3 | **工具**（shell / file_ops / web_search） | cordis 插件注册 ctx.tools（tool-fs 标准模式） | `packages/fs/tool-fs/src/index.ts:52`（`export const inject = ['tools', ...]`）+ `apply(ctx)` 注册工具；B1 实测可挂载 |
    | 4 | **2.7.2 审批回答侧**（前端批准/拒绝回传） | **scope-filtered answerer 瀑布**：自做 TS answerer 插件监听 approval 请求 → 返回 outcome（claim）或 next() 委托。**这是公开的 cordis 服务调用面，不是 agent loop 内部** | `packages/interaction/user-approval/src/index.ts:44-54`（fail-closed + composed answerers 注释）；`packages/extensions/tool-cordis/src/api-catalog.ts:3185-3190`（**012 为 :3033**；引用内容**逐字相同**，仅行号漂移 +152）（"Ask composed answerers... Return an outcome to claim the request or call `next()` to delegate. Scope-filtered dispatch"）——answerer 注册 = cordis listener 模式 |
    | 5 | **记忆保鲜 / 用户画像 / 知识库**（自做插件） | 纯自做逻辑 + ctx 服务/事件消费（不触 agent loop 内部） | B1 挂载实测（`dsh-pysdk-probe-claude.md` §3）；订阅模式同 #1 |
    | 6 | **compaction 策略定制** | **Service Definition / Provider 拆分**：`ctx.compaction` 是契约，`compaction-basic` 只是默认 Provider——自做 Provider 插件注册 `ctx.compaction` 即换策略，消费者（command-compact 等）不动 | `packages/compaction/README.md:29-30`（"The shared condensation contract... `ctx.compaction`" / "registers `ctx.compaction`"）；`packages/compaction/command-compact/src/index.ts:66`（消费者 `ctx.compaction.compactNow(...)`——只依赖契约） |
    | 7 | **session 事件流消费** | session.event 订阅（cordis 或协议面） | 实测（`dsh-pysdk-probe-claude.md` §4）+ `known-event-types.ts` 全量 |
    | 8 | **端侧执行器 Windows 沙箱** | `ctx.sandbox` Service Definition + **服务实现替换是公开面**（fs-sandbox 先例："Registers as `ctx.fs`... loading it INSTEAD OF dsh-fs-local... is the whole swap——model-facing tools are untouched"）；Windows 后端 = sandbox-local restricted token + sandbox-windows-acl | `packages/fs/fs-sandbox/src/index.ts:44-46`（实现替换模式）；`packages/sandbox/sandbox-local/README.md:71,107`（"win32: the ACL restricted token…" / "Windows ACL restricted-token rung" —— ⚠️ **原引 `:12` 系行号有误，两版该行均无此句**；015 的 `:12` 首段已被上游改写，但语义未变，`:71/:107/:128` 行号两版一致）；`packages/sandbox/README.md:29-31`（ctx.sandbox/ctx.sandboxPolicy 服务） |

    **8/8 全部 🟢**——每项的证据都是"公开挂载面可达"的机制性证据（服务实现替换 / provider 注册 / listener 瀑布 / context 注入 / 工具注册），无一项触及"必须改 DSH 核心循环"。
    🟢 **WB 本地复核（`git show`）：机制 8/8 属实** —— `0.1.2-rc.1` 首核（行号 2 处偏差：#2 实际 154 行、#3 实际 22 行）；**2026-09-15 在 `0.1.5-rc.2` 上复跑**：8 项机制签名**全部存续**，其中 `interaction/user-approval/src/index.ts` **两版 blob 逐字节相同**（`8e1a8d05d468`），行号漂移仅 2 处（已就地更新）。**报告的行号不可全信，机制结论可信**
  - **反向举证（主动找推翻自己结论的证据，未找到否决项）**：① **运行中热重载 patch 级配置** ❌ 确认不可行（`patchReload: startup` 出自 sdk-app README"Configuration changes require restart"）——**但非 A 案否决**：patch 是启动期组合，运行期可变性由 systemPrompt context 动态注入（#2）+ ctx 服务动态实现（#4/#6/#8）覆盖；需重启的是部署期配置（角色清单、工具启用表），非对话期行为，单用户可接受。② **同会话运行中热切角色（含工具集）** ⚠️ 未找到公开 API（工具集在插件 apply 时经 ctx.tools 注册）——**非否决**：产品树当前无此承诺；会话级角色（新建会话选角色）可经 preset 达成，**记入 DSH-3 首验输入**。③ **运行中替换已注册的 ctx 服务实现** ⚠️ 未查证 cordis 是否支持——**非否决**：服务实现替换是"启动时加载哪个插件"的决策（fs-sandbox 的 swap 语义），部署期选择足够
  - **不选 B 案的理由**：8 项无一项触及 agent loop / session 内核 / 事件存储；fork 的代价（每次上游发版 merge 一个 alpha 框架的破坏性变更）换不来任何必需收益。升级 SOP 在 A 案下 = 更新依赖版本 + replay 回归
  - **已知边界（不阻塞 A 案）**：① ~~`patchReload: startup` → 部署期配置变更需重启~~ **⚠️ 已由 DSH-2 实测修正**：第 0 项判的 `startup` 出自 **sdk-app** bundle；我们实际采用的 profile（**2026-09-17 前为 `larry`，该面已退役 ⇒ 现按 `sdk`**）（`dsh-base` + `dsh-headless`）manifest 为 **`patchReload: live`** 🟢（WB 本地 `cat .dsh-home/profiles/larry/package.json` 核实）。**配置热重载可能可行，不必按"改配置必重启"规划**（⚠️ **仅 `larry`；`sdk` profile 为 `startup` 须重启**，见环境规格表 sdk 行）；② **同会话运行中热切角色（含工具集）未找到公开 API**——当前以「产品树无此承诺」非否决，**属条件性风险：若将来产品树加此承诺，A 案可能不够**，列 DSH-3 首验

**退出条件（5 项实测 · ✅ 全部通过 · 2026-09-10 收口；任一不过则 DSH-3 收益表重估、C 路径回退进入议程）**：
1. `storage/` 外接 SQLite 可行性 —— ✅ **可行**：官方 backend 仅需配置，`path` 可指任意绝对路径；外部库当日落盘、我们的 `mem-1` 行可读出；反向哨兵证数据走 SQLite 而非默认 json（判据见 `../production-env.md` §5）
2. `acp/` 契约稳定性 —— ✅ **通过**：`initialize` / `session.new` / `session.list` / `session.close` 均 OK；`fork` / `load` / `delete` = **`-32601`**（方法缺失，非鉴权）
3. **Windows 端 `ctx.sandbox` provider 可用性**（2.10.2 端侧执行器前提）—— ✅ **可用**：三档哨兵成立 + fail-closed；`enforcement = partial`（两条边界属实）；⚠️ **方言缺口三层**（本地化 / 错误码类别 / 编码）须修，详见 `../local-env.md` §4
4. Vue/Tauri → sdk profile 连通 —— ✅ 真实回包 `PROBE-OK-2026`；判据矩阵见 `../local-env.md` §6
5. **TS 跑通 bge-small-zh 本地 embedding，与 Python 侧同文本向量漂移比对**（重嵌策略依据）—— ✅ **无需全量重嵌**（漂移 `2.2e-7`，cosine ≥ 0.9999999999）；硬前提见下方 DSH-4 承载表

**本阶段已定案的环境规格（后续阶段沿用，勿各自另起一套）** 🟢 DSH-2.1/2.2：

| 项 | 取值 | 依据 |
|---|---|---|
| 工程目录 | `harness/`（仓库内，pnpm workspace） | DSH-2.1 定案 |
| 包名前缀 | `@larryagent/` | 同上 |
| profile 名 | `larry`（= `dsh-base` + `dsh-headless`）〔2026-09-17：**该面已退役并真删**；**现役主 profile = `sdk`**，见下行〕 | 同上。⚠️ **manifest 因 bundle 而异**——`patchReload` / 可用命令等结论**不可跨 profile 外推**（第 0 项的 `startup` 即出自 sdk-app） |
| `DSH_HOME` | `.dsh-home/`（仓库内，已 gitignore——含凭据与会话产物） | 同上 |
| DSH 入口 | **npm 全局 `dsh@0.1.5-rc.2`**（⚠️ **须与 profile 同代** —— 混代未验；✅ **同代化已全项闭合**：CVM 侧 2026-09-16 完成、`cvm-probes/` 脚本钉版 2026-09-17 参数化并回同步，见 §2.3 未闭合项 #6）；不用源码 `bin.ts` + tsx | DSH-2.2 反证（通道 012）：源码入口在 PowerShell 下偶发卡住；同代要求见 §2.3 未闭合项 #6 |
| DSH 源码副本 | ~~`D:\Code\dsh-src`~~ **已删（2026-09-30 老大裁定）** ⇒ **查源码走 `ref/dsh-bare` 裸仓只读**（`git show` / `ls-tree` / `grep <tag>`，不需要工作区）；确需实体文件才「按需局部检出」到 `ref/dsh-wt/` | 同上，非日常必需（A 案的价值正是默认不需要它）。⛔ **不要在 Windows 上整体 checkout**（实测卡死 5.5 h）——删掉该工作树正为消除这一风险面；⚠️ **该条与 §2.3「四条已踩过的坑」第 4 条互为呼应，勿走回头路** |
| sdk profile | `.dsh-home/profiles/sdk`（= `dsh-base` + `dsh-sdk-app`，stdio JSON-RPC）；⚠️ manifest **`patchReload: startup`**（与 `larry` 的 `live` **不同**） | DSH-2.3 连通验证用；**B 段走 sdk → 其配置热重载结论不等于 larry**；与 `larry`（**已于 2026-09-17 退役**）是两个 profile，结论不可互推（`patchReload` 差异 2026-09-11 订正，见 §3.4〈基线收口复核〉） |
| **端到端动态验证** | **WB 侧可独立完成**：Git Bash 工具 + 环境变量注入测试 key | 🟢 2026-09-09 复测：握手 / 事件流 / **真实 LLM 回包**全部跑通，见下方「WB 复验边界（修订）」 |
| **WB 的 PowerShell 工具** | **不可用**：未启用 ConPTY，原生 exe（`node.exe`）无输出、等同于不执行 | 🟢 WB 实测：`node -v` 返回空、纯 cmdlet（`Set-Content`）正常 |

> **零成本复验法（🟢 WB 独立跑出，可复用）**：`dsh --profile <p> --help` **即触发 cordis apply，不需要 LLM key**。凡要验"插件到底加载没加载"，先用这条，不必跑完整会话。
> 〔2026-09-17 修订：原写 `--profile larry`，该面已退役 ⇒ **profile 名换成当时在用的那个**；另经实测 `--dump-config` 同样零成本（不需 key、约 0.5s），且**任意 profile 都成立**（`sdk` 面实测 `rc=0`）⇒ 该手法**不绑定 larry**。〕
>
> ⚠️ **WB 复验边界（2026-09-09 立，同日修订）**：
>
> **① 工具层（已定位）**：WB 的 **PowerShell 工具未启用 ConPTY** → 原生 exe（`node.exe`）**不执行、无输出**（`node -v` 返回空），而纯 cmdlet 正常。此前「PowerShell 侧 initialize 恒超时、无输出」是**工具假象，不是 DSH 失败**。→ **WB 一律用 Git Bash 工具跑命令；不要用 PowerShell 工具跑任何 node/npm/pnpm。**
>
> **② 能力层（已实测放宽）**：Git Bash 侧**已可独立复现** SDK 通道 —— `initialize` + `session.prompt` + 事件流 + 通知流全部跑通（🟢 连续 5 次：仓库根 ×2 / 全新目录 ×1 / 死锁 ×1 / 活锁 ×1，单次约 2.4s）。故「WB 完全不能端到端」**作废**。
>
> **③ 真实 LLM 回包：WB 已独立复现（2026-09-09 二次修订）**：注入测试 key 后 `finalResponse` 正常返回（🟢 `"probe ok"`，19 事件含 `assistant/chunk`×7 + `assistant/message`×1，21 通知）。
>
> **注入姿势（可复用）**：`DEEPSEEK_API_KEY=<测试key> node harness/scripts/dsh-probe-capability.mjs "<msg>"`，**只走环境变量、不落任何文件**（与既有报告口径一致）。
>
> **④ 已排除的假说（均有对照实验，勿再重提）**：node 版本（内置 22 与系统 24 解析结果一致）／tsx 源码回退（built bin 存在，未触发）／首次运行安装耗时（全新目录 2.4s 完成）。
>
> ⚠️ **残留锁：路径敏感，不得跨路径外推（2026-09-09 二次修正）**
>
> **此前断言「锁与超时无因果关系」是过度声明**——该断言只在 **SDK 握手路径**上成立，被我外推到了全部路径。实测结论应精确表述为：
>
> | 路径 | 是否争用 `node_modules.lock` | 实测结果 |
> |---|---|---|
> | **SDK 握手**（`initialize` / `session.prompt`） | ❌ 不争用 | 死 PID 锁、活 PID 锁均**不阻塞**（各 2.4s 正常返回） |
> | **profile 安装/修复**（`healProfilesModuleFallback`） | ✅ **争用** | 锁残留即失败：`atomic-write: timed out waiting for the writer lock` |
>
> - **复现记录**：`dsh --profile web`（首次，需装依赖）被 `timeout` 强杀 → 锁残留 → 后续启动同点超时失败，移除锁后恢复。锁位于**全局 home** `C:\Users\SuLarry\.dsh\profiles\node_modules.lock`（**不是**仓库根的 `.dsh-home/`）。
> - **写入规则**：`healProfilesModuleFallback` 走 `dsh-atomic-write` 的 `withFileLock`，该实现**不检测持有者存活**（死 PID 锁同样阻塞）。
>
> → **行事规则**：① 见到 `atomic-write: timed out waiting for the writer lock` → 移走该锁后重试（**同设备 rename，勿跨盘**——C:→D: 会 `EXDEV`）；② **不要用 `timeout` 强杀正在装依赖的 dsh**，它会留下锁；③ 锁仍是**异常终止的痕迹**，不是 DSH 缺陷，但也**不得再引用「锁已证伪」的旧说法**。

#### DSH-3：核心能力 prototype

> **任务清单与进度见 `TODO.md`「DSH-3」**；本节只放**验收基准**。接入对象：`compaction/`（→2.9.2）／`sandbox/`（→2.7.1 Linux 侧）／`interaction/`（→2.7.1 高危审批）／`session/`（→2.8.2）。

**退出条件**：**核心链路（会话 + 记忆 + 工具）在 DSH 下达到 P4 等价**（不是"四个包跑通"——无交付通道的跑通不算）。

**最小可验证切片 S0–S4（Trae，采纳）**：S0 = 一条消息的完整生命周期（客户端 → **`sdk`** JSON-RPC → session create → agent loop 挂 **1 个**自做工具 `read_file` → 真实 LLM 调用 → 回客户端 → session 落盘 → session-query 回读），一条链同时验证交付通道 / plugin mount / llm provider / session 持久化四个前置；其后逐层叠加、单独验收：

| 步 | 叠加 | 验收 | 勾对子项 |
|---|---|---|---|
| S0 | 基础链路 | 消息往返 + 事件落盘 + 回读 | 2.4.1 / 2.8.2 |
| S1 | + interaction 审批（`read_file` 配 workspace-write，弹 Tauri 对话框）| 批准 / 拒绝两路都通 | 2.7.1 / 2.7.2 |
| S2 | + compaction（灌 200+ 轮长对话）| 摘要注入且近文保留 | 2.9.2 |
| S3 | + sandbox 三档（read-only / workspace-write / danger）| 拒绝与提权流程生效 | 2.7.1 |
| S4 | + 记忆最小闭环（会话结束事件 → 双写 → 新会话召回）| 召回内容出现在下一会话 | 2.4.2 |

S4 实现位置（第 0 项终裁后确定）：**TS 插件挂 session 事件流**（A-framework）。退出判据一律是"产品树子项可勾对"，不是"包能跑"。

> ⚠️ **上表为骨架，判据以〈各切片判据细则〉为准** —— 其中"S0 消息往返成功"、"S2 灌 200+ 轮"两处表述已在 2026-09-14 修订（见下），**勿照骨架字面实现**。
>
> 判据修订来源：**四份评审意见**（出自 3 个 AI：Claude 测试视角 / Trae 实现视角 / QoderWork 反向举证视角）+ WB 筛选与实测复核。**只吸收经复核立得住的**。（原稿 `exchange/dsh-3-plan.md` 的实质内容已全数承接入本稿与 `TODO.md`，该稿随之处置；评审原文可 `git show 3362f57:exchange/dsh-3-plan.md` 追溯。）

---

##### DSH-3.0 验收基准：三态对照（⭐ 本阶段最容易整体翻车处）

> **为什么必须三态**：S0 的验收口径（消息往返 / 事件落盘 / 回读）**每一项都能在无 key 的假绿灯下通过**（DSH-2.5 ④ 实证：无 key 时 `exit 0` + session 建立 + 12 条事件）。**"无 key"正是已证会假绿的那一态，却不进对照** ⇒ "真 Key 绿灯"可能只是同一片假绿里的一条。

| 态 | 构造 | 期望观察 |
|---|---|---|
| **无 key** | 移除 / 不注入凭据 | **必须与真 key 态表现不同** —— 这是判据有效性的检验本身 |
| **错 key** | 换成无效值 | `error.code = AUTH` / HTTP 401（红灯也是真的） |
| **真 key** | `refs.DEEPSEEK_API_KEY` 就位 | `assistant/message` 存在 **且** `turn/end.reason.kind === 'completed'` |

- 三态**同一脚本**跑；判据 = **三态表现互不相同**
- ⚠️ 每态须显式记 **(DSH_HOME, profile, 凭据来源层)** 三元组 —— 否则"无 key 态"与"真 key 态"可能测的是同一件事
- ⚠️ **已定位的陷阱**：`harness/scripts/cvm-probes/*.sh` 全部钉 `DSH_HOME=$HOME/larry-dsh-home`，而 CVM 凭据只在 `~/.dsh/` ⇒ **照抄这些脚本 = 无 key 假绿，且判据看起来全绿**

##### 采数口径（3.0 顺手采数 与 3.9 回传核对表共用）

| 采什么 | 怎么采 | 为什么 |
|---|---|---|
| 联合内存 | **cgroup v2 为准**：`/sys/fs/cgroup/user.slice/user-1000.slice/{memory.current, memory.peak, memory.events, memory.pressure}` | ⚠️ `ps -eo rss` 求和**虚高 53%**（共享页重复计）；⚠️ root 与 session scope **没有**这几个文件，`stat -fc` 判 cgroup2fs 会**假阳性** |
| 是否吃紧过 | `memory.peak` + `memory.events`（`oom` / `oom_kill`）+ `memory.pressure`（PSI） | **免轮询**即可回答；`memory.events` 是 OOM 的**权威计数**（比 dmesg / journal 可靠） |
| 小时级曲线 | 定时采样 + `date -Is` 时间戳 + **断点 / 重启留痕** | ⚠️ 采数窗口内**冻结其他活动**：OOM 会把曲线**断掉**，事后被误读成"内存稳定" |
| 带宽 | 记 **工具 + 目标 + 时段** | 4M 共享 / 独享影响结论 |

##### 各切片判据细则（只列对骨架表的**修订与加强**）

| 切片 | 修订 |
|---|---|
| S0 ① | "消息往返成功" → **回包内容须含 `PING-<nonce>`**（只验"往返成功"会被空壳会话骗过） |
| S0 ② | plugin mount **以 boot 时 `activate` 打点为准**。⚠️ **`--dump-config` 是假绿源** —— 实测只组配置树、不激活插件（探针行**出现在 dump 里但没执行**） |
| S0 ④ | "落盘 + 回读" → **回读结果里能查到同一 nonce**（不是"文件存在 / 条数够"） |
| S1 | 用例扩到 5 条：批准 / 拒绝 / **超时** / **抛错** / **渠道断裂** —— 后三条须 fail-closed **且留可观测日志**（⚠️ 静默 fail-closed 会制造假绿）；观测点 = **工具 handler 入口打点**，UI 与 DSH 日志只作旁证 |
| S2 | **弃"灌 200+ 轮"**（`contextWindow` 实测 1M，"200+"来源不明）→ 改用**注入大段填充文本、1 轮逼出**；判据加"摘要含可验证 nonce 片段 + 近文原文保留"；开跑前给 **token / 费用上限**。⇒ ⭐ **判据口径四条 = 本稿 §3.6〈DSH-3.4 · S2 判据口径四条〉**；⭐ **测试量级阶梯与预算 = 本稿 §3.6〈DSH-3.4 · S2 compaction：测试量级阶梯与预算〉** |
| S3 | 加两条：① **`bwrap` 存在性前置**（Linux 链 = `['bwrap','landlock']` 两个 rung）② **DSH 的 ruleset 建立成功** + **失败形态判定**（fail-open / fail-closed 决定生产安全） |
| S4 | 加 **双写一致性模型** —— ⚠️ SQLite + ChromaDB **双写不是事务** ⇒ 须定义 ChromaDB 不可达时的降级行为与召回路径 |

##### ⭐ S1 审批三段收敛路径（老大 2026-09-14 拍定：分阶段往 ② 走）

**原缺口**：S1 判据写"前端弹 Tauri 对话框"（PC 侧），但 **A 段协议是 DSH-3.8 的产出**，而 B 段 SDK 只有 `initialize / session/prompt / shutdown` 三个 method ⇒ **无法中继 approval request 到 PC 端**（无可用 answerer 时 fail-closed，已由 probe-qoder 反向举证坐实）。⇒ 验收条件依赖一个尚不存在的协议层。

**拍定路线**：**不择一，分三段往 ②（自补反向请求）收敛** —— 前两段都在 DSH-3 内、**都不依赖 3.8**。

| 段 | 做什么 | 验什么 | 依赖 |
|---|---|---|---|
| **3.3-a** | 本地策略答者（`ctx.approval` waterfall 的最终应答者）| **机制接入**：scope filter 生效 / 日志可观测 / fail-closed | 无 |
| **3.3-b** | 答者 → **真出站往返**（薄客户端 ↔ 本地 stub 对端）| **② 的真风险**：跨进程等待 / 超时收尾 / 对端消失 / 取消传播 | 无 |
| **3.3-c = 3.8** | 对端 → driver + 前端 | 人审批闭环 | A 段协议 |

> ⚠️ **2026-09-30 正名留痕**：上表第三行 `3.3-c` **已按实质归属正名为 `DSH-3.8 · 端到端审批闭环`（终验收）** —— 它本就是 **3.8 的下游验收**、非 3.3 的尾巴（依据 = `TODO.md`「3.8」段自述「本段交承载与接线；`3.3-c` 验真人闭环，两者在 **M2** 汇合」＋「依赖只剩 `3.3-c` 这一段」）⇒ `TODO.md` 侧的条目已移出「DSH-3.3」段（该段已归档）、留在「**待派发**」段。⛔ **上表保持原样不改**：它是「三段收敛路径」这一原始框架的记述（`3.3-c = 3.8` 在此是**定义式**，不是过期指针）。

- ⚠️ **3.3-a 的诚实边界**：5 条用例中**「超时」「渠道断裂」是同进程替身路径**（本地答者即同进程调用，无"渠道"可断）⇒ 3.3-a 单独**不得**声称"审批语义验成立"，那两条的真验在 3.3-b。
- ⭐ **设计约束（3.3-a 写码时即须满足）**：答者来源须是**可替换接口**（本地策略 ↔ 远端真人），否则 3.3-b 要重写。
- ✅ **3.3-a 实测回填（WB 2026-09-21 复验，以物证为证）**：机制接入三项**均成立**，另三条机制事实可直接给 3.3-b 用 ——
  - ① **scope filter 的实现方式 = 把答者注册在 `agent.ctx` 上**（`dsh-scope` 按注册标签放行）；官方分发点 `lib/index.js:179` 的 `scopeTarget(req.agent, req.agent)`。实测两组对照：非目标 agent **确实发过请求**（探针入口有行）而答者**未收到**，其审计落 `unavailable`。
  - ② **结果词汇封闭且无 `allow-always`**：`allowed-once` ／ `rejected` ／ `cancelled` ／ `unavailable`（`lib/index.js:30-35`）。⚠️ **「超时」落 `cancelled`** —— `decide()` 把应答与 `req.signal` **赛跑**（`lib/index.js:181-191`），abort 先到即 `cancelled`；**答者侧不存在超时计时器**。
  - ③ **fail-closed 成立**：不装答者 ⇒ 6/6 请求 `unavailable`、被保护动作 **0 次**（双锚：探针侧 `probe-request` 仍 6 行、`tool-registered` 仍活）。
  - ⚠️ **本轮未验（留给 3.3-b）**：真 DSH 上 `ctx.provide` 的**就绪时序** ／ 跨进程真往返与取消传播。
- ✅ **3.3-b 实测回填（WB 2026-09-21 复验，以物证为证；现场独立复跑复现）**：路 A **真跑通**，「② 的真风险」四条**全部有实测支撑** ——
  - **做法**：按路 A 落地 = 自研 relay（`plugin-sdk-relay`）**禁掉官方 server 行**并 `ctx.provide('sdkTransport', transport)`；远端答者（`plugin-approval-remote-answerer`）接 3.3-a 的替换口 `approvalAnswerer`；薄客户端 ＋ stub 对端作装置。**7 臂 66/66**；WB 现场独立复跑 `main` 臂 **12/12** 复现（audit 序列完全一致、三份日志归一化后逐条一致）。
  - ① **跨进程往返真发生**：dsh 侧 `remote-send` ↔ 对端 `peer-request`（**独立 pid**）；答案回传后决策生效（approve ⇒ 动作发生 ／ reject ⇒ 被拦）。
  - ② **超时两路分清**（本块最易错处）：**请求侧** `req.signal` 中止 ⇒ `cancelled`（实测中止点 = 探针 `timeoutMs`，差 8.009 s）；**答者侧自建计时器**（官方无此物，须自做）⇒ **`unavailable`**（实测 3 002 ms 正合 3 000，且该臂请求侧 30 s 表**未到点**）。
  - ③ **对端消失**：**终止传输**形态 ⇒ 输入端结束**那一刻仍有 1 条未结清**（中继同步观测点，注册早于 transport 自身的 `onInputEnd`），该条被 **reject**（`JSON-RPC input closed`）⇒ `unavailable` 且 fail-closed（动作 0 次）。⚠️ **进程级 kill** 形态拿不到插件层 reject 打点（dsh 进程寿命被 `exitOnStdinEnd` 一并带走）⇒ **两形态分别报、不合并**。
  - ④ **取消传播**：撤回后 pending **连续采样恒 0**（无泄漏）；对端**迟到回答**在该帧之后的采样里仍未留任何状态、结果不变 ⇒ 合 `transport.d.ts` 的「no state is retained for a response that may never come」。
  - ⑤ **负向对照两条**：不装任何答者 ⇒ `unavailable` ＋ 动作 0 次；对端未装 handler ⇒ **原始帧 `-32601`** ＋ dsh 侧归一化为 `unavailable`。
- ⭐ **3.3-b 查出的三条机制事实（可直接引用）**：
  - **(a) `dsh plugin --profile X add <目录>` 装的是符号链接** ⇒ 插件的 `import` 在 **harness 工作区**解析，**不在 profile 树里**。⇒ 插件若要 import `@deepseek-ai/*`，**必须把该包登记进 `harness/package.json`**（本块已记账：`package.json` `+2 行`、`pnpm-lock.yaml` `+667 B`）。3.3-a 的包"零外部 import"正好绕过，故此前未暴露。⚠️ 若将来改为**实体复制**装载，此前提须重验。
  - **(b) 跨插件提供 seam 必须 `provide` 在 root ctx**：cordis 的 `ctx.provide(name, v)` 记下的是**调用方自己的 fiber**，而取值走 `ctx.get(name)` 的 **`strict`** 语义（owner fiber 非 ACTIVE ⇒ 直接返回 `undefined`）；插件在 `apply` 期间的 fiber **还不是 ACTIVE**。⇒ 先于提供方 `apply` 的插件（如 3.3-a）要读到该 seam，提供方必须挂 **root ctx**（`ctx.root ?? ctx`）。实测对照：`_attempt1` 的 `injectedAnswerer=false`（`source=local-policy:from-request`）→ 改挂 root 后 `main` 的 `injectedAnswerer=true`（`source=remote:approval/request`）。
  - **(c) `insert` 的新条目一律落条目列表末尾**（与上文「④ 插入位置不可控」一致）⇒ 需要控制层序时**只能重排 `dsh.profile.bundles`**；且中继行必须排在 `@deepseek-ai/dsh-sdk-app` **之后**（否则 disable 不动官方那一行）。
- ⚠️ **本块成本（供后续同类任务估量）**：每次运行在系统 TEMP 下复制一份 sdk profile **真副本**（**≈330 MB ／ 4.35 万文件**）；本块累计留下 **≈10.2 GB** 临时 home ⇒ 同类装置**收尾应显式清理临时 home**（或改共享基准 ＋ 增量覆盖）。
- ⚠️ **未验（留 3.3-c = 3.8）**：真人 ／ 前端闭环；`approval/request` 是**本块临时约定**的 method 名（3.8 定稿后可能改名）；**POSIX 分支**与「实体复制装载」下的解析均未验。
- 📂 **证据**：交付方 `D:\Code\_trae-evidence\33b\`（284 件 ／ 7 臂）；WB 独立复跑 `main` 臂 → `D:\Code\_wb-evidence\33b\wb-rerun-main\`（40 件，含 README 与「与交付件逐字段比对」的结论；结论本可重跑重建，留档只为便于他人核对）。

**证据（2026-09-14 读包源码，非二手结论）**—— ② 的真实形状是三层，**不需要 fork 任何包**：

1. **传输层已就绪且公开导出**（`@deepseek-ai/dsh-sdk-protocol`，`lib/index.js` 尾 `export { JsonRpcLineTransport, JsonRpcResponseError }`）：
   - 帧分类：`id`+`method` = 请求 / `id` = 响应 / `method` = 通知
   - **`onRequest(handler)`** —— 公开的**入站请求处理器**安装口
   - `request(method, params, signal)` —— 带 **`AbortSignal` 放弃语义**（原话"aborting removes the pending entry (no state is retained for a response that may never come)"）⇒ **超时 / 取消的原始件已在**
   - **未装 handler 时的行为**：`handleIncomingRequest` 回 **`-32601 method not found`**（**不静默丢弃**）⇒ 天然可观测的 fail-closed 信号，可直接作 3.3-b 的负向对照
2. **客户端封装层挡住了**（`dsh-sdk-client`，我们目前在用的那层）：`HarnessClient.start()` 内部 `new JsonRpcLineTransport(...)` 后**只挂 `onNotification`、无 `onRequest`**（`lib/index.js:405-411`）；包 `exports` 只有 `"."`，`launch.ts` 的 `resolveDshLaunch` / `installedDshBin` **不在导出面** ⇒ 3.3-b 须**绕开这层封装**（自己起子进程 + 自构启动参数）——代价明确、可控。
3. **服务端业务层未接线**（`dsh-sdk-jsonrpc-server`）：`HarnessSdkJsonRpcServer` 构造签名 `(ctx, transport: JsonRpcTransportPeer, options?)` —— **transport 是注入的**，而该接口就有 `request()` ⇒ **发请求的能力在手，只是没有调用点**（`handleRequest` 只认 initialize / prompt / shutdown）。
   - ⚠️ **待查（3.3-b 第一件）**：从"我们自己的 B 段插件"到 transport peer 的通路**目前未见服务暴露**（插件入口 `apply(ctx, config)` 只消费 config，`inject` 未声明服务）⇒ 须确认能否经 `ctx` 取到；取不到则要么另开一条边，要么给上游提需求。
   - ✅ **WB 实测回填（2026-09-21，读包源码 ＋ import 实跑，非二手）**：该「待查」**已收敛** ——
     - **结论：transport 经 `ctx` 拿不到**。`dsh-sdk-jsonrpc-server` 的 `apply()`（`lib/index.js:257-293`）在**闭包内** `new JsonRpcLineTransport(input, output)`（`:268`），**全文无任何 `ctx.provide`**；其 `Config` 只认 `maxTokensAsSuccess`（`Schema.object(...)`）⇒ **也不能靠 config 开后门**。
     - **但官方给了现成范式**：`dsh-sdk-app` 在命令行解析成功后 `ctx.provide('sdkAppStartup', { accepted: true })`（`dsh-sdk-app/lib/index.js:16,40`），而 server 的插件行声明 **`inject: [sdkAppStartup, loader]`**（`dsh-sdk-app/cordis.patch.yml` 的 `insert` 段）⇒ **「等启动服务」的落点 = 插件行的 `inject`**，可直接复用（也为 3.3-a 遗留的「`ctx.provide` 就绪时序」给了答案）。
     - ⭐ **首选收敛路径（路 A，代价最小）**：profile 补丁层把官方 server 那行 `disabled: true`，再 `insert` 自己的 relay 行（`inject: [sdkAppStartup, loader]`）；relay 内**照抄**官方那 30 行 apply（`HarnessSdkJsonRpcServer` 是**公开导出类**，`:296`），**只多一行 `ctx.provide(<服务名>, transport)`**。备选 **路 B** = 另开一条边（额外 fd ／ unix socket ／ `ctx.get('subprocess')`）。
     - ⚠️ **两条硬约束（实测）**：① **不得用 `- id: X` ＋ `name:` 覆盖同名行** —— **3.7.2 已实测不生效**（`profiles/sdk/cordis.patch.yml` 顶部注释：loader 的 id 定位**只做 config 覆盖，不改插件来源**）；② **`onRequest` 是替换语义**（`transport.d.ts:65` 原文 "replacing any prior handler"）⇒ 与官方 server **抢装会静默顶掉先装者**。
     - ⚠️ **场地缺口（实测）**：`@deepseek-ai/dsh-sdk-protocol` **不在 `harness/package.json`**，`import` 报 **`ERR_MODULE_NOT_FOUND`**（pnpm 严格模式，该包只在 `.pnpm` 深层）；且 `dsh-sdk-client` **不重导出** `JsonRpcLineTransport` ⇒ 须**先补依赖**才能用传输层。
     - ⚠️ **代价（诚实列出）**：路 A **偏离官方 profile 组合**（禁用官方 server 行）⇒ 上游升级需跟。
     - ⭐ **老大 2026-09-21 拍定：采用路 A**（原话大意「就算后面有啥问题、或者后面官方的代码有什么值得重新适配的变化，那就再改」）⇒ **"上游升级需跟"的代价已被接受**，不在本块设卡。
     - ✅ **WB 端到端实测（2026-09-21，`--dump-config` 五组对照；改动未落场地）**：**路 A 的机制已成立**，验靶手段本身也可复用 ——
       - **验靶手段** = `dsh --profile sdk --dump-config`（组合配置树后退出、**不激活插件**）：输出按 `# == <来源>` 分组；**被 patch 命中的条目，来源注释追记 `, patched by <层文件>`**；**未命中的 patch 打一行警告** `dsh: [<层文件>] patch: entry "<id>" not found`，**仍 exit 0**（⇒ 不能只凭退出码判成败）。
       - **无副作用试验通道** = `dsh --patch <临时层.yml> --dump-config`（`--patch` 可重复、叠加在 profile 层之后）⇒ **不改场地文件即可验证 patch 写法**；本轮五组实验全走此通道。
       - **① 禁行成立**：`- id: sdk-jsonrpc-server` ＋ `disabled: true` **确实禁掉了这条由上游 `insert` 进来的行**（其来源注释变为 `@deepseek-ai/dsh-sdk-app, patched by <临时层>`）⇒ **补齐 3.7.2 未覆盖的情形**（3.7.2 禁的是 bundle 层直接声明的行，不是 insert 进来的行）。
       - **② 字段级浅合并**：只写 `disabled` 时，目标条目的 `name` ／ `inject` ／ `config` **全部原样保留** ⇒ **不必重述 config**。（README〈已知限制〉那句"用户 patch 会替换匹配到的整个配置"仅指**你写了 `config` 键**时整体替换、不深合并 —— 两者不矛盾，但极易被误读成"disable 时必须抄一遍原 config"。）
       - **③ 同层共存**：同一 patch 文件内 `- id: …`（`disabled: true`）与 `- insert: [...]` **共存成立**，insert 行的 `inject: [sdkAppStartup, loader]` 原样保留。
       - **④ 插入位置不可控**：`insert` 的新条目**一律落在整个条目列表末尾**（在所有层之后）⇒ 不能靠它控制插入点。
       - **⑤ 可叠加**：insert 出来的条目 **id 会被注册**，可被更后的 `--patch` 层用 id 定位并 patch（结果注释形如 `# == <层1>, patched by <层2>`，无 not found 警告）⇒ **多段叠加可行**。
       - ⚠️ **场地事实**：`--dump-config` **每次都会写** `$DSH_HOME/profiles/<name>/cordis.yml`（恒为模板 `[]` ＋ 首行注释 "Edit cordis.patch.yml, not this file"，223 B、幂等）⇒ 跑 dump 会 touch 它，**别用 mtime 判污染**；`~/.dsh`（真实 home）实测**零改动**。
       - 📂 **物证落档**：五组 dump 快照 ＋ 实验用 overlay 层 → `D:\Code\_wb-evidence\33b\`（含 README，附复现命令；结论本可重跑重建，留档只为便于他人核对）。

**成本与复用（诚实列出）**：
- 3.3-b 的**主要成本** = 自己起子进程、自构启动参数（不能复用 `HarnessClient`）
- ⭐ **产物不是一次性的**：薄客户端 + `onRequest` / `AbortSignal` 用法 = **3.8 driver 的骨架**
- 📚 **第三方已实现同类（社区实证，🟡 待我方复跑）**：`ref/community/PerryLink__dsh-reach/` 把 `approval/request` + `user-questions/request` 做成 **deferred answerer**（答案**稍后**从 IM 回来才兑现）⇒ **② 有现实例证**；其 `cardTimeoutSec`（0 = 永不过期）与 `bridge.dispose()`（结清待决）分别是**超时**与**卸载**的现成参照。逐条对照见 §3.6〈参考实现登记表〉第 1–3 条
- 📌 **未来替代观察点（不改本次结论）**：`dsh-api-gateway`（typert）本是官方 Client↔Host 双向通道、自带重连 / 心跳 / 取消，且 `dsh-base` 默认启用；但 **2026-09-10 实测其传输面不可达**（`/api/remote.mux` 带 cookie 仍 404、无法独立起 HTTP）。typert 的"进程内载体"**不解决跨进程问题** ⇒ 不影响本次路线。若上游修好传输面，② 有更省事的替代，届时重估。

> ⚠️ **由此浮现一条产品定位层面的问题**：审批流跨越 A/B 段边界 ⇒ "PC 侧弹框审批"这一产品能力，取决于 A 段协议何时落地。**是否写入 `docs/product-positioning.md` 待与老大讨论**（本稿不擅自改产品定位）。**现状补充**：拍定「分阶段往 ②」后，该能力已有一条具体收敛路径（3.3-c / 3.8）⇒ 建议**等 3.8 设计稿出来时再谈定位**，那时能对着具体协议形状谈，比现在空谈准。

##### 负向对照矩阵（不做则"真的通了"与"判据没生效"不可区分）

| 破坏动作 | 期望变红的判据 |
|---|---|
| profile 里注释掉自做 bundle | S0 ②（plugin mount） |
| 换成错 Key | S0 ③ + 3.0 红灯组 |
| 摘掉 / 只读 session 落盘目录 | S0 ④ |
| answerer 抛错 ／ 请求侧超时撤回 | S1 拒绝路径（须 fail-closed） |
| SQLite 路径指回 DSH 默认后端 | S4 ②（反向哨兵） |
| kill SDK 客户端进程 | S0 ④（已写入部分的一致性） |
| 停 ChromaDB 进程 | S4 双写**降级行为**是否定义 |

⭐ **判据抽象（2026-09-16 CVM 实测）**：「环境可用性」类判据，真正在测的是 **plugin tree 能否装载**（`initialize` 会 `await loader.await()`）。
- 跨代 / 缺 peer ⇒ 装载失败 ⇒ **红**；同代完整 ⇒ **绿**。**与 CLI 代际本身无关** —— 反例实测：`015 CLI ＋ 012 profile 且依赖自洽` = **绿** ⇒「跨代必红」不成立；准确说法是**约束落在 profile ↔ 其依赖图（含回退层所反映的落点树解析结果）的同代性上**（CLI 更新无害；回退层为何会给旧代际，成因见下条 ⭐）。⚠️ 该规则目前仍是**候选**：绿样本带 `plugin-storage-probe` link ＋ `dsh-storage-sqlite@012`，**非干净样本**，需干净重测才能升为结论。
- **「profile 完全不存在」在 wire 层不可达**：boot 会把不存在的 home **自建成空壳 profile**（`dependencies: {}`，含 `cordis.yml` / `cordis.patch.yml` / `pnpm-workspace.yaml` / `.dsh-module-fallback`）＋ 同一套回退层 ⇒ 与「装了但不完整」的 profile **解析行为等价**。实测：`~/.dsh-015`（同代但缺 3 peer）与「**根本不存在的 home**」的 stderr **归一化后逐字节完全相同**（唯一差异是路径名长度 ⇒ 15247 vs 15499 B，差 6 字符 × 42 次）⇒ **这两类坏不可分**，别指望"空壳"能当独立对照组。
- **可用的诊断面** = stderr 的 `failed to import loader entry <entry> (<pkg>): … does not provide an export named <sym>`（能读出**代际不匹配**，是本阶段最有信息量的一条错误）＋ **`readlink` 探针**；**缺口**：该错误**不给实际解析到的版本 / 路径** ⇒ 验收脚本应把两者一并收。
- ⚠️ 也因此，**`~/.dsh-015` 不是"健康同代"样本**（它只有 `dsh-base` ＋ `dsh-sdk-app` 两项，缺 3 个 peer；与 `~/.dsh` 的差别仅 3 个包）—— 它在**旧四项 boot 探针**下 PASS、在 SDK 握手处必红（红因 = 缺的 peer 落到回退层后被给到**旧代际**，成因见下条 ⭐ 四组对照）。

##### 执行范式与边界（防重复踩）

- **远程长任务范式**：`setsid nohup <cmd> >log 2>&1 </dev/null &` + **完成标记 + `echo $? > rc`**；复入时**先看 rc 再看日志**。
  ⚠️ `production-env.md` §6.3「ssh 后台任务拿不到沙箱放行」**约束的是本地发起侧**（沙箱 / 审批），**不是远程进程生命周期** —— 两通道实测远程进程存活（裸 `&` 5/5、`setsid nohup` 6/6）。
- **姿势自证**：每个验收脚本头部加一行 —— 本脚本模拟的是哪条真实链路（哪个执行器 / 哪层前导 / 哪个 home+profile）。DSH-2.5 ③ 教训：**判据姿势不对会同时造出假绿与假红**。
- ⚠️ **"前后对照"实验须在单租户窗口内做**：CVM 上曾观测到第三方活跃会话（`who` 见 `pts/0`），且 `~/.dsh/profiles` 的 mtime 与自己的动作**同秒**变动；但**对照实验打回**（取 mtime → 跑 `--help` → 再取 mtime，前后完全一致）⇒ 只能记"**观测到、未归因**"。⇒ 凡"取状态 → 跑命令 → 再取状态"类归因，**必须先确认窗口内无第三方活动**，否则证据自动降级。（这条比"2G 内存"更硬地支持 3.0 采数窗口**冻结其他活动**。）
- **各执行人各自做一次通道核查**、各自出《我方执行说明》（三种工具形态的坑不同，**谁也不能替谁许愿**）。
- ⚠️ **ABI 边界**：CVM = **4** / WSL = **7** ⇒ **landlock 判定不可互搬**（实测：ABI 5+ 的掩码喂 ABI 4 内核 ⇒ `create_ruleset` 直接 `EINVAL`）。

##### ⭐ DSH-3.4 · S2 判据口径四条（WB 2026-09-29 拟；**权威落点**，执行面 = 已归档快照 `archive/roadmap-history.md`「DSH-3.4」段（2026-10-01 由 `TODO.md` 迁出））

> **为什么先定这个**：S2 判据的骨架只有一句 —— 「摘要注入 **且** 近文原文保留 ＋ 摘要含可验证 nonce 片段」。但**四处口径若不写死，同一结果会得出不同判定**，且判据会被"看起来满足"的路径**自动通过**（等于空转）。本节把调研汇总 `dsh-34-ref-research.md` §11.9-1 的缩写版展开成**可复算条款**。⚠️ 除标注外，依据均来自 `dsh-v0.1.5-rc.2` 源码实读（🟢）。

**① 「近文」定义 = 留 surface**（判"在哪一层保留"）
- 原文"还在"有**三层**可能：**log 层**（append-only 事件流里原文永在）／ **surface 层**（模型输入视图里逐字可见）／ **可回取**（第三方 store ＋ retrieve）。
- ✅ **写死：保留 ＝ 在 `session.deriveMessages()` 的输出中、被压区间之后的尾部消息逐字存在。**
- ⛔ **log 里有不算** —— 官方压缩**从不删 log**（原文留 append-only、替换件以 `sourceEventSeqs` 引用）⇒ 该层**恒真**，作判据等于没验。
- ⛔ **「能回取」不算** —— 那是 **tool-output 压缩**生态位（另一条路线），**不解决** conversation compaction 的近文保留。
- ⇒ 否则后果：判据被"可回取"路线**自动满足**，我们以为验了、实则空转。

**② 尺 = `retainRatio`**（判"保留多少"的计量口径）
- 官方**三套语义并存**：`retainRatio`（token 比例，默认 **0.16**）／ `retainTokens`（绝对值，**与 ratio 互斥**）／ 社区件 `preserveRecent`（**节点数**，如默认 2）。
- ✅ **写死：以 `retainRatio` 为准** ⇒ **期望保留量 = 下界 `floor(contextWindow × retainRatio)` ＋ surface 节点粒度向上吸附**（`config.ts:145-147` 定 `retainTokens = floor(contextWindow × retainRatio)`；`region.ts:132-139` 从尾部倒序累计到 ≥ `retainTokens` 即停 ⇒ **实测值 ≥ 该下界**，多出部分由节点粒度与 `toolPairingBalancedBefore` 吸附解释）。⚠️ **2026-09-29 复验订正**：原写「`floor(被压区间 token × 0.16)`」有**两处错** —— ① **分子错**（源码用 `contextWindow`，不是"被压区间 token"数）；② **非等式**（是下界 ＋ 吸附，不是"＝"）。**实测参照**：`contextWindow = 20000` ⇒ 下界 3200，实测保留节点 `meter.nodeTokens` = **3412**（+6.6%，节点吸附）。
- ⚠️ **手动路径不适用（✅ 已裁 A，老大 2026-09-29）**：产品**不做**手动 `/compact` 入口 ⇒ 本条款**只在自动路径上成立**。留痕：官方 `compactNow` 硬编码 `retainTokens = 0`（`compaction-basic/src/index.ts:380-384`）⇒ 只留最后 1 条、**不满足**本条款；若日后改判 B／C，此条须按新口径重定（见 ⑤）。
- **软阈值（防虚假精确）**：保留量**不设精确区间**，只做**数量级报警** —— 实测若 `< 1%` 或 `> 50%` 于期望值，须**报出并解释**（可能实际走了 `retainTokens` 或 `preserveRecent` 而非 ratio）。⚠️ 此阈值口径系 WB 拟，老大可收紧。

**③ 三结局须可分**（判"怎么区分三种结果"）
- 三态：**(i) 没触发** ／ **(ii) 触发了但摘要被截**（`MAX_TOKENS` 抛错）／ **(iii) 完好**。
- ⚠️ **要害：(i) 与 (ii) 在 surface 上完全同形**（都表现为"没有替换发生"）⇒ **只看 surface 分不出**。
- ✅ **写死：三态只从事件侧分** —— `compaction/start`（log-only，取锁）／ `compaction/summary`（log-only，带 `rawOutput` ＋ `usage`）／ `compaction/end`（log-only，放锁）。
- ⚠️ **有 `start` 无 `end` ＝ 失败态**（orphaned lock）⇒ **必须 fail-loud 报出，不得静默当"没触发"**。
- 依据：`summarizer.ts:191-207` 的 `finishError()` 对 `max-tokens` 是**抛 `MAX_TOKENS`**（fail-closed，不缩不丢），**不是**静默截断。

**④ 断言位置 = `session.deriveMessages()`**（判"在哪儿看"）
- ✅ **写死：在 `session.deriveMessages()` 上断言**（＝模型实际输入视图）。
- ⛔ **不在 `session.events` ／ kernel 投影 ／ surface 内部结构上断言** —— 在事件流上断言**证明不了发给模型的内容**。
- 依据：一份第三方 `byte-stability.test.ts` 的**头注自曝其早期版本正犯此错**（在事件侧断言）。

**⑤ 关联的产品决策（✅ **已裁 A** · 老大 2026-09-29）**
- 原问题：手动 `/compact` 要不要也保留近文尾部？
- ✅ **裁定 = A「不做手动入口」**（老大原话大意：「就用你说的 A 路径，也就是自动压缩的路径，这一块我觉得没什么问题」）⇒ 压缩**只走自动路径**，本决策**消解**；判据注明「**手动路径不适用近文保留条款**」（已落 ② 与 `TODO.md` 判据行）。
- ⚠️ **A ≠ 什么都不做**：官方默认组合**自带**该入口（见下方前置事实 3）⇒ **必须显式禁用**，否则「不做」会自动变成「做了」。
- ⚠️ **三个前置事实（2026-09-29 补充实读 · 🟢 `dsh-v0.1.5-rc.2`）** —— 缺了它们会把选项的代价判错：
  1. **差异硬编码、配置面改不动**：自动路径走 `selectCompactableRange(agent.session, measurement, spec.retainTokens)`（`compaction-basic/src/index.ts:317`）；手动路径在 `compactNow` 里**直接传字面量 `0`**（同文件 `:380-384`），**全程不读 `policy` / `spec`** ⇒ 配置面的 `retainRatio` / `retainTokens` **只作用于自动路径**。
  2. **`0` ≠ "留 0 条"**：`region.ts:116-154` 第三参数语义 = 从尾部**倒序累计 token**，累计 ≥ 参数即停 ⇒ 传 `0` ⇒ 保留区 = **最后 1 个节点**，再经 `toolPairingBalancedBefore` **向前吸附到 tool-call / result 配对安全边界**（可能多留若干条）。
  3. **官方默认组合自带 `/compact`**：`command-compact` 在 `packages/bundle/base/cordis.patch.yml:325` **启用**（注释原文："Human `/compact`: one useful reduction **below the automatic threshold**"）；`bundle/web-app/cordis.patch.yml:430` 置 `disabled: true`，但 cordis / ptc / standard **三个 preset 均提供** ⇒ **两条默认链路都会给用户这个入口**（不显式禁用即出现）。
- **三选项与落选理由（留痕）**：**A 不做手动入口**（不装 ／ 禁用 `command-compact`）⇒ 决策消解、判据注明「手动路径不适用」——✅ **本次采纳**；**B 做、接受官方语义**（手压后近文近乎清零、只剩摘要 ＋ 最后 1 条）⇒ 不采纳；**C 做且自做 Provider**（子类覆写 `compactNow`，把 `0` 换成按配置算出的保留量）⇒ 原记「⭐ 即『换 Provider』第一个实际靶子」，**随 A 一并取消**（不做入口则无此需求）。
- ✅ **A 的落地动作与验收（2026-09-29 新增）**：
  - **落地**：在我方 bundle patch 里对 `command-compact` 显式置 `disabled`（base bundle 默认启用；cordis ／ ptc ／ standard 三 preset 均提供）—— 落地前须先确认我方 profile 实际走哪条 preset 链路。
    - ✅ **落地状态（WB 2026-09-29 核 · 2026-09-30 落地并验）**：受控源**已入库** ✅ = `harness/scripts/compaction/disable-compact-entry.mount.patch.yml`（含 `disabled: true` 与用法／判据说明）；**生产落盘位置 `.dsh-home/profiles/sdk/cordis.patch.yml` 已追加该行** ✅（2026-09-30，老大授权执行；改前备份 `cordis.patch.yml.bak-wb-20260930-100255`；⚠️ `.dsh-home/` 未受 git 跟踪，落盘不进库）。
      - ⭐ **落地已独立验收（WB 2026-09-30）**：⚠️ **既有 `j2` 不足以覆盖此项** —— 它的 absent ／ reverse 两臂都是**装置自己 append** 禁用行（`disableCompact: true/false`）⇒ 验的是"append 生效"，**⛔ 不回答"禁用行落到 profile 本体后是否生效"**。故另起专项装置 `harness/scripts/verify-a-landing-profile.mjs`：主臂 `disableCompact: false`（**⛔ 不 append，只依赖源 profile 的落地行**）＋ **反向对照臂**（从临时副本里摘掉该行）。
      - **实测（命令表取 `ctx.commands.list()`，`source=live`，⛔ 非 `--dump-config`）**：主臂 `names=["feedback","goal","permission","plan"]`、`hasCompact=false`；对照臂 `names=["compact","feedback","goal","permission","plan"]`、`hasCompact=true` ⇒ **唯一变量 = 那 2 行 ⇒ 读写能区分、非恒假** ⇒ **PASS**（证据 `.s34a-evidence/`）。
      - ⚠️ **一条通道限制（记）**：本机**无 key**（env 无、`.dsh-home/.credentials.yaml` 无）⇒ 会话在 turn 层报 `MISSING_CREDENTIAL`；但**命令表读数在 `agent/status:idle` 已产出、与模型调用无关** ⇒ 不影响本判据，本项属 **L0-A（0 token）**，无需 key。
  - **验收（运行时判据）**：真实会话里发 `/compact` ⇒ 断言**无 `compaction/start` 事件**、无 compact 反馈（见 ③ 新增 **L0‑A** 档）。⛔ **不得只靠 `--dump-config` 作证**（L0 已定：只组配置树、不激活插件 ＝ 假绿源）。
- ⚠️ **连带影响（诚实列出）**：**阶梯 L1 档（手动路径）失去构造手段** —— 它原本是最便宜的「完整括号」夹具（~1 万 input、人工可控、随时可触发）；A 下该入口不存在 ⇒ 其 6 项观测点（括号 ／ checkpoint marker ／ nonce ／ log 留原文 ／ `usage` 成本 ／ `busy` 反向对照）**须搬至 L2 自动压力档**，其中 `busy` 反向对照系**手动专有 ⇒ 消失**。代价 ＝ 首次验证 **~1 万 → ~5 万 input**（5000 万预算内可忽略）＋ **失去「人工可控、不依赖阈值」的调试夹具**（此为真实损失，非金钱损失）。
- ⚠️ **留痕**：② 的「手动路径不适用」随 A 生效；若日后改判 B ／ C，② 与本节须按新口径重定（C 下 L1 档恢复使用）。

##### ⭐ DSH-3.4 · S2 判据口径增补两条（独立测试件 `DSH-3.4-T` 出 · 2026-09-29 复核采纳 ／ 2026-10-01 自 `TODO.md` 归位）

> **承**上节〈DSH-3.4 · S2 判据口径四条〉。两条均为**判据可用性硬约束** —— ⛔ 缺了会拿到**假绿**或**无法归因**。
> ⚠️ **编号说明**：本节 `⑤`／`⑥` **承〈判据口径四条〉的 `①-④` 序列**（即「口径」由四条增为六条）；上节内另有一栏 `⑤ 关联的产品决策`，那是**该节自带的第 5 个栏位**（产品决策、非判据口径），**与本节 `⑤` 无关** ⇒ 引用时请写明**节名**。
> **归位留痕**：本条原只活在 `TODO.md`「DSH-3.4」段（2026-09-30 由交流区清理承接登记）⇒ 按「判定依据一律留 `docs`，`TODO.md` 不重复结论」（`TODO.md` 分区约定）于 2026-10-01 迁入本区。

**⑤ 手动 ／ 自动路径可分**（原为 J2 遗留缺口，测试件已补）
- ✅ **写死：以 `compaction/start.data.sourceCommandId` 区分** —— **手动 = 非空串**（实测 `cmd-b6ca467f-1`）／ **自动 = `null`**（`l2` ／ `t6` 臂实测）。
- ⇒ **用途**：把「人工触发」与「阈值触发」分开。⚠️ **手动专有的 `busy` 反向对照**（非 idle 调 `/compact` ⇒ `ManualCompactionError.code='busy'`）**随 A 裁定消失**（不做手动入口 ⇒ 该路径不存在）。
- ⛔ **不可单用**：该字段**只在手动压成功时有值** ⇒ 须与自动臂的 `null` **并列读**，否则「没有值」与「不是手动」同形。
- 通道：`DSH-3.4-T`（Claude ／ 本机 Windows ／ 2026-09-29）。

**⑥ 断言「产品会拒绝伪造 checkpoint」前，先确认 `invariants` 执行者是否挂载**
- ⚠️ **实测**：伪造 checkpoint（`user/message` ＋ `surfaceOp=replace`，只差 `source`）在**未挂载臂**下 **`threw=false`（零拒绝）**；挂载官方伴生件（`@deepseek-ai/dsh-invariants` ＋ `@deepseek-ai/dsh-compaction/invariant`）后才抛 `InvariantError`。
- ⚠️ **本 profile 实测 = `ctx.get('invariants')` 为 `null`**（两件**可解析但未挂载**）⇒ **产品侧零防护**。
- ⇒ ⛔ **不得声称"产品会拒绝伪造 checkpoint"**（在未挂载的前提下）。
- **同源**：谓词 `isCompactCheckpointSource` 对「只有标记」与「标记＋假 id」**都收** ⇒ **半判据必要不充分**；完整判据须要求**与打开中的 `compaction/start` 逐字同 id**。
- 通道：同上（`DSH-3.4-T`）。

##### ⭐ DSH-3.4 · S2 compaction：测试量级阶梯与预算（WB 2026-09-23 拟；**定额已定 = 总 token 硬上限 5000 万**，老大 2026-09-23）

> **为什么先算这个**：S2 要逼出压缩，而压缩阈值直接绑在**模型容量**上（默认 1M ⇒ 阈值 80 万）⇒「1 轮逼出」花多少钱完全由容量决定。本节把**每一段钱能测出什么**排成阶梯，并给出**三个官方杠杆**（可把成本降一到两个数量级）。⚠️ 除标注外全为 🟢（读 `dsh-v0.1.5-rc.2` 源码所得）。

**① 阈值从哪来（三行源码即全部真相）**
- `thresholdTokens = floor(contextWindow × thresholdRatio)`（`compaction-basic/src/config.ts:144`）；`retainTokens = floor(contextWindow × retainRatio)`（`:145-147`）；默认 `thresholdRatio` **0.8** ／ `retainRatio` **0.16**（`:20,23`）；`maxTokens` **8192**（摘要输出上限，`:91`）；`compactionRetries` **1**（`:92`）；`retainRatio` 必须 **<** `thresholdRatio`（load 期硬约束，`:185-190`）。
- `contextWindow` **不是常量**：由 adapter 按**确切路由**提供 —— DeepSeek adapter `DEFAULT_CONTEXT_WINDOW = 1_000_000`（`llm-deepseek/src/adapter.ts:147`）；**每个 catalog model 可单独给 `contextWindow`**，adapter 级还有 **`defaultContextWindow`**（`llm-deepseek/src/index.ts:193`，未列出的 pass-through id 也继承它）。
- ⇒ **默认配置下阈值 = 80 万估算 token**（`TODO.md` 原记「实测 1M」与源码一致 ✅）。
- ⚠️ **官方文档自身脱节**：`.agents/notes/implemented/architecture/2026-07-20-routed-model-context-and-compaction-policy.md:19` 写「两个内建模型各公布 **256,000**」——与本 tag 常量（**1M**）不符 ⇒ **以代码为准**（该 note 定稿于 07-20，常量后改）。

**② 三个杠杆（省钱的实质在这里）**
1. ⭐ **改小 `contextWindow`** ⇒ 阈值线性下降。`defaultContextWindow: 20000` ⇒ 阈值 **16,000**（比 80 万低 **50×**）。这是**官方配置面，不是 hack**。⚠️ 代价：属**容量被改写的夹具** ⇒ 判定只能写「机制成立（容量 20k 下）」，**不得外推成「1M 下亦然」**（除非另跑 L4）。
2. ⭐ **填充一律用 ASCII，不用中文** —— 官方明说固定 `4 字符 = 1 token` 启发式**严重低估 CJK 与 JSON schema**（`packages/llm/token-meter/README.md:64,148`；实现在 `estimate.ts:13,53`，按 **UTF-16 code unit** 长度计）。⇒ 达到**同一「测量压力」**所需的**真实** token：中文远高于 ASCII（**方向已由官方钉死；倍率须用一次真调用的 `usage` 实测校准**，勿凭记忆填数）。⇒ **中文填充会把成本成倍抬上去。**
3. **`maxTokens`（摘要输出上限）可调**，默认 8192，可按 target 覆盖于 `modelPolicies` ⇒ 小档调小（如 2048）压住输出成本。⚠️ 但 **thinking 的 hidden reasoning 会吃 `maxTokens` 造成摘要截断**（官方 Dev Note ＋ 社区 `zhubaohi/dsh-qwen38-compaction-fix` 双证）⇒ 若开 thinking，**别调太小**。

**③ 阶梯（每档：怎么造 ／ 量级 ／ 能测出 ／ 测不出）**

| 档 | 怎么造 | 量级 | 能测出 | 测不出 |
|---|---|---|---|---|
| **L0** 零调用 | 故意配非法（`retainRatio ≥ thresholdRatio`）或塞未知 key | **0 token** | **配置真被这个引擎读进去**（load 期必抛错：`config.ts:185-190`／`:280`）；插件装配层注册 | 任何运行时行为（⚠️ `--dump-config` 是假绿源：只组配置树、不激活插件） |
| **L0‑A** 手动入口不存在性（⭐ **A 专属**，2026-09-29 裁 A 后新增） | 真实会话里发 `/compact` | **0 token** | **该入口确实不在**：无 `compaction/start` 事件 ／ 无 compact 反馈 ⇒ ⭐ **A 落地的验收判据** | 任何压缩行为（本档只证「入口不在」）。⛔ **不得只靠 `--dump-config` 作证**（同 L0：假绿源） |
| **L1** 手动 `/compact`（⛔ **A 下不适用** · 2026-09-29 留痕） | 会话有 **≥3 个 surface 节点**（含 system head）后发 `/compact` | ~**1 万** input ＋ ≤8192 output（**1 次摘要调用**） | ① 完整括号 `compaction/start` → `compaction/summary` → `user/message(surfaceOp:replace)` → `compaction/end`（`region.ts:455-484`）② ⭐ **摘要注入的机读判据** = checkpoint marker（`source.kind='plugin' ∧ plugin='compact'`，`checkpoint.ts:19,49`；`isCompactCheckpointSource()` 可直接调用）③ summary 文本里 nonce 是否存活 ④ 原文仍在 append-only log（替换件带 `sourceEventSeqs`）⑤ **`compaction/summary` 事件自带 `usage`** ⇒ 现成的成本判据 ⑥ **反向对照（免费）**：非 idle 调 `/compact` ⇒ `ManualCompactionError.code='busy'` | ❌ **`retainRatio` 的 16% 尾部保留**（手动路径**硬编码 `retainTokens = 0`**，`index.ts:380-384` ⇒ 只保留**最后 1 个节点** ＋ 配对回退）❌ 自动触发 ❌ overflow 恢复 |
| **L2** 小窗口自动压力 | `llm-deepseek.defaultContextWindow: 20000`（或该 model `contextWindow: 20000`）＋ **必须 2 个 turn** | 阈值 16k ⇒ ≈**3 × 16k ≈ 5 万**（主请求 ×2 ＋ 摘要输入 ×1） | ① `agent/pre-step` **自动**触发（无需人工命令）② ⭐ **阈值边界上下双跑**：15,999 不压 ／ 16,000 压 ⇒ 「真按 `floor(容量 × 0.8)` 算」的硬证据 ③ ⭐ **「近文原文保留」的正面判据**：尾部 ≈ `floor(20000 × 0.16) = 3200` token 原文留在 surface（`selectCompactableRange`，`region.ts:116-154`）④ **tool-pairing 边界吸附**：造一个跨越边界的未应答 `assistant/tool-call`，看边界是否回退 | ❌ 真 1M 容量 ❌ overflow 恢复 |
| **L3** 中窗口 ／ 多段（可选） | `defaultContextWindow: 100000`；或在小窗口下**连压两次** | ~**20–40 万** | ① **多代压缩**：已有 `<compacted-summary>` 时的**合并语义**（`summarizer.ts:65`：视为 PRIOR checkpoint ⇒ 保留仍真事实、丢弃过期、合并为新单块）② `compactionRetries` 的收敛循环与**压不动的抛错路径**（压完仍超阈值 ⇒ 抛 `compaction still above threshold after N attempts`，`index.ts:329-332`）③ 长历史下估算偏差累积 | 同 L2 |
| **L4** 真锚（默认 1M） | 默认配置灌 80 万 | **≥ 160 万** input | 「容量不改变机制」的**正面物证** | — |
| **L5** 真溢出恢复 | 真发出**超过模型真实窗口**的请求 | 每次 **≥ 100 万** input 且被拒 | `agent/request-error` ＋ `maxOverflowRetries`（`index.ts:180-224`） | — |

**④ 为什么建议 L4 ／ L5 不做**
- **L4**：机制里**唯一的容量依赖**就是 `floor(contextWindow × thresholdRatio)` 这一处纯算术（`config.ts:144`）＋ 每步重解析模型信息（`index.ts:294`）——均已读源码 🟢 ⇒ **推理上不必花 160 万 token 去证**。要物证再单跑。
- **L5**：**改小 `contextWindow` 造不出 overflow** —— `CONTEXT_WINDOW_EXCEEDED` 由 adapter 从**提供方真实错误**归一化（`adapter.ts:346` `isContextWindowExceededError`），**没有本地预检** ⇒ 只能真灌到超真窗口。且 **S2 判据（摘要注入 ＋ 近文保留 ＋ nonce）不含 overflow** ⇒ 属**另一档**，建议单列（与 3.5／3.9 并列），不在 3.4 主线上烧钱。

**⑤ 不必实测就能算出的成本方向（三条，写进判据用）**
- ⭐ **压力档至少 2 个 turn**：`routedTarget()` 读 `session.requestHeader()`，**首轮 pre-step 无 header ⇒ 直接返回 `null` 不压**（`index.ts:53-61, 265`）⇒ 第一个 turn 只负责「把填充灌进去并建立 header」，第二个 turn 才压 ⇒ **预算 ≈ 3 × 阈值**。
- **摘要调用的输入 = 被压那段的前缀**（system ＋ tools ＋ 区域消息，`region.ts:528-547`）⇒ **成本 ∝ 被压区间**，与总历史同阶；**不是**「只有输出 8k 那么便宜」。
- **工具 schema 本身也算压力**（`estimate.ts:estimateToolsTokens`：`ceil(JSON.stringify(tools).length / 4)`）⇒ 实际所需填充 = 阈值 −（系统提示 ＋ 工具 schema ＋ 既有历史）。⇒ 本机工具多时，这部分是**免费的填充**。

**⑥ 判据必须增补的一条（本轮读源码新发现的缺口）**
- **「近文原文保留」必须注明走哪条路径**：**压力路径**按 `retainRatio` 保留**尾部 16%**；**手动 `/compact`** 硬编码 `retainTokens = 0`（`index.ts:380-384`）⇒ **只保留最后 1 个 surface 节点**。⇒ 若只用 `/compact` 验收，会拿到「只留最后一条」的结果却**误判为判据成立**。
- ⚠️ **原记「3.4『换 Provider』第一个实际靶子」已随 A 裁定取消（2026-09-29）**：不做手动入口 ⇒「手动也保留近文尾部」这一需求不存在 ⇒ 该靶子**不再成立**。当前**唯一现实的候选靶子**是 ⑦ 的「**中文会话摘要被官方提示词写成英文**」（要不要换摘要提示词 —— **仍待老大定**，不属本决策）。

**⑦ 一条产品观察（不是我们定，交老大）**
- ✅ **⑦ 已裁（老大 2026-09-30）：不自做 Provider，用官方自带英文摘要** ⇒ 本观察**从「待定」转入「已接受 ＋ 长期观察」**。**裁定**：① 中文会话摘要为英文 —— **接受**；② 保真度与相关运行效果 —— **长期持续观察**（观察项登记见下，⛔ **观察本身不产生新 TODO 条目**，老大已计入自有文件）。
  - 📌 **观察项（长期 · 不设截止 · 不入 TODO）**：① **近文保真度**（关键词 ／ 路径 ／ 错误串 ／ 标识符在压缩后是否仍可行动）；② **中文会话的摘要质量**（官方英文提示词下的产物是否可用，是否需要人工中文补注）；③ **触发频度与成本**（`compaction/summary` 自带 `usage`，可与预算阶梯对照）。⚠️ **判据仍受 §3.6〈判据口径四条〉约束**（近文 = 留 surface ／ 断言位置 = `deriveMessages()`）。
  - 📌 **基线结论状态 = 参考（老大 2026-09-30）**：本节全部结论（阈值 ／ 保留量 ／ 三态 ／ 落地件 ／ 成本量级）**锚在 `dsh-v0.1.5-rc.2` 且当前不跟版**（老大 2026-09-29：「**不跟**，继续观察」） ⇒ **留作参考基线**；⛔ **一旦换基线（跟 rc ／ 上 0.2.x）即须重跑复核，不得跨版本外推**（与 §3.4 升级 SOP 的「每阶段收口复核」节拍一致）。
- 官方摘要提示词要求 **「Write concise English engineering prose」** ＋「Preserve exact file paths, commands, error strings, **identifiers**, numeric values, function signatures…」（`summarizer.ts:61`）⇒ ① **中文会话的摘要会被写成英文**（我们是中文优先产品 ⇒ 要不要换提示词属产品决策）；② **nonce 判据有官方提示词背书**（"identifiers" 被明确要求保留）⇒ 判据设计成立，但**仍非保证**（LLM 行为，非确定性）。

**⑧ 预算（**已定额：总 token 硬上限 5000 万**，老大 2026-09-23）**
- **口径**：**范围内随便搞、非要求用完** —— 上限是**安全网**，不是花销目标。
- **预计实耗**（按 ③ 阶梯量纲）：**主线 = L0 ＋ L1 ＋ L2** ⇒ **5～10 万 input ／ 1～3 万 output**；追加 **L3** ⇒ 再多 **20～40 万**。⇒ 相对 5000 万上限**余量约两个数量级**。
- ⚠️ 仍须**按档结算**，并以 `compaction/summary` 事件自带的 `usage` 作成本判据（见 ③-L1 ⑤）。
- **L4 ／ L5 另立**（④ 已述不做理由）。若日后要跑，**L4（≥160 万）／ L5（每次 ≥100 万）均在 5000 万内**，不必另请额度。

##### DSH-3.5 · S3 sandbox：CVM 前置核查实测回填（WB 2026-09-23 dry-run）

> **姿势**：按切片细则「先 dry-run 再判定」执行第一轮 —— **不出判定、只钉场地**；**零写入、零装包、零 LLM 调用（⇒ 未使用任何 Key）**。通道：WB `ssh` 前台 → CVM（`ubuntu@49.232.129.252`）；两轮只读探针 ＋ 一次 landlock 正证。

**① `bwrap`：已证不存在；且"装上"这条路实际是堵的**（后半为本轮新增，原预案未覆盖）
- `dpkg` 未装（apt 有候选 `0.9.0-1ubuntu0.3`，**dry-run 未装** —— 装它会改变场地）。⇒ 按源码 `linux: ["bwrap","landlock"]` 的链式仲裁，**永远只走 landlock rung**，与 `TODO.md` 3.5 预案一致。
- ⚠️ **`apparmor_restrict_unprivileged_userns=1`**（Ubuntu 24.04 默认）⇒ 实测 `unshare --mount` ／ `--pid` ／ `--user --map-root-user` **全 FAIL**（`Operation not permitted`），仅不带映射的 `--user` 可用。**bwrap 依赖 mount ns ＋ userns 映射** ⇒ **即使装上 bwrap 也起不来**。⇒ 该前置从「装不装」升级为**要不要放开主机级 AppArmor**（`sysctl kernel.apparmor_restrict_unprivileged_userns=0`，需 root）—— 取舍见 ④。

**② landlock rung：可用 ＋ 内核真实强制（正证，非"建了规则集就算"）**
- `--probe` 语义（读 `node-addon-system/src/main.c` 定死）：`MAX_ABI 5L`（`:94`）／ `*partial = abi < MAX_ABI`（`:237`）／ 掩码按协商 ABI 裁剪（`:184-189`）。⇒ **CVM ABI=4 ⇒ `partial=true`**，probe 打印 `landlock: partially enforced (older ABI)` 且 **exit 0**（是"降级接受"，不是 fail）。
- **WB 独立正证**（`python3` ctypes，与 DSH 互为独立通道）：ABI **4** → `PR_SET_NO_NEW_PRIVS` OK → `create_ruleset` OK → `restrict_self` OK → **读 `/etc/hostname`、`/etc/os-release` 均 `EACCES`** ⇒ 内核确实强制。
- ⚠️ **姿势自证（2026-09-23 修正）：该正证用的是「拒读」掩码，≠「DSH 的 landlock profile 会拒读」。**
  DSH 的 landlock grants 实为 `landlockGrantArgs({ readOnly: ['/'], readWrite: ['/dev/null'] (+ '/tmp' + workspaceRoot，仅 workspace-write) })`（`packages/sandbox/sandbox-local/src/profiles.ts:32-38`）⇒ **整棵 `/` 是允许读的**，白名单只约束**写**。
  ⇒ 该正证只证「**内核确实强制**」，**不得读成「DSH 沙箱会挡住读敏感文件」**；本机**非独占**（他方 AI 产物在库）时，沙箱内**照样可读**。
- ⚠️ **一处既有表述须精确化**：〈ABI 边界〉原写「ABI 5+ 掩码喂 ABI 4 内核 ⇒ `create_ruleset` 直接 `EINVAL`」—— 该实测**成立**，但主语是**人工喂高位掩码**；**DSH 自身不会**触发（掩码按协商 ABI 裁剪，ABI 4 下只声明 `ABI1_MASK|REFER|TRUNCATE`）。⇒ **不得读成"DSH 在 ABI 4 上会失败"**（同 `MEMORY.md`〈实现正确、声明过度〉型）。
- **ABI 4 与 5 的实际差距 = `LL_FS_IOCTL_DEV` 一位**（`main.c:85`：ABI 4 只加 TCP 位）⇒ 对"文件读写沙箱"几乎无影响。

**③ fail 形态：fail-closed（源码 ＋ 文档双重钉死；dry-run 未依赖上机即成立）**
- `main.c:23-28` 原文：ruleset 建不了 / 内核不强制 ⇒ **`exit 125` 且不 exec 被包装命令**；老 ABI 的 best-effort 限制**被接受**但必 `fprintf(stderr, "landlock-run: partial enforcement (older Landlock ABI)")` 上报。
- `dsh-sandbox-local/README.md:57`：unusable runner ⇒ **`confine()` 抛 `SANDBOX_UNAVAILABLE`**。
- ⇒ **CVM 不会因 bwrap 缺失而 fail-open**：要么走 landlock（partial 但强制），要么整体 unavailable 并抛错。

**④ ✅ dry-run 暴露的实质降档 —— 老大 2026-09-23 裁定：接受（选项 ①）**

- 裁定：**接受降档**。**不动主机 AppArmor**（`kernel.apparmor_restrict_unprivileged_userns` 保持 `1`）⇒ CVM 上沙箱永远走 landlock rung。
- ⚠️ **两处归因修正（WB 2026-09-23 读源码所得；修正本段原表述）** —— 原表述把降档代价记为「防数据外泄不够」，**该归因错、且高估了选项 ② 的收益**：
  1. **bwrap profile 同样不管网络**：`bwrapProfileArgs()` 原文 = `['--ro-bind','/','/','--dev','/dev','--unshare-pid','--proc','/proc','--die-with-parent']`（`packages/sandbox/sandbox-local/src/profiles.ts:17`）—— **无 `--unshare-net`**。⇒「网络隔离」**两条 rung 都没有**，不是 bwrap 的收益。
  2. **bwrap 与 landlock 的读/写权限等价**：bwrap = `--ro-bind / /`（全只读可读）；landlock = `readOnly: ['/']` ＋ 写白名单（同文件 `:32-38`）⇒ **读权限两者都全开，写权限两者都只白名单**。
- ⇒ **降档的真实净损失只有三条**：① **私有 PID ns**（沙箱内看不见宿主进程；`/proc` 亦来自私有 ns）② `--die-with-parent`（防孤儿进程）③ workspace-write 档的**临时 `/tmp`**（bwrap 给 `--tmpfs /tmp`，landlock 给真实 `/tmp` 白名单）。**三条都与「防误操作 ／ 防越权写 ／ 防外泄」无关。**
- ⇒ **选项 ②（放开主机 AppArmor）代价/收益不匹配**：代价是**主机级**（放开后影响全机所有进程，不只 DSH），买到的是 PID 隔离 ＋ 孤儿进程回收 ⇒ **不采纳**。
- ✅ **一致性核对（不新造缺口）**：`production-env.md:165-166` 早已记「landlock 无 `LANDLOCK_ACCESS_NET`，实测沙箱内照样联网 ⇒『上了 sandbox 就不怕数据外泄』是错的，**防外联必须另做**（网络策略 / 无外网路由）」⇒ 该承接点**原样有效**。
- ⚠️ **仍未实测（诚实边界）**：landlock 读白名单为 `['/']` 时，`/proc/<pid>/…` 一类路径的**可见性取决于进程权限而非沙箱**；CVM **非独占**（他方 AI 产物在库）⇒ 该暴露面**未实测量化**，不在本裁定范围。

**⑤ 顺手采得的其余场地事实（与 3.9 采数口径共用）**
- **cgroup v2 齐备**：`memory.current` ／ `.peak` ／ `.events` ／ `.pressure` 均 readable；当前 `oom 0 ／ oom_kill 0`。
- 路径映射：`~/larry-dsh-home`（**无凭据**）／ `~/.dsh`（**有凭据**，键 `version` ／ `records` ／ `refs`）／ `~/larry-data/larry.db` = **57,344 B，mtime 2026-09-16 18:47**（3.9 待回传的唯一副本）。
- ⚠️ **裸跑 `node` / `dsh` 不可信**（非登录 shell 的 PATH 不含）⇒ 绝对路径 `~/node/bin/node`（v22.22.2）／ `~/harness/node_modules/.bin/dsh`。与 `test-env.md §6.2` 同族，**CVM 侧亦成立**。
- `~/harness` 树**无 `.git`**（非受管副本，手工同步）。
- 场地**非独占**：`~/claude-tp-evidence` ／ `~/qoder-evidence` ／ `~/claude-305` ／ `~/.dsh-015` 等**他方 AI 产物在库**；`~/harness/scripts/sandbox-probe/` 存 6 件**前人探针** —— ⚠️ 其中 `sandbox-denial-probe.mjs` 头注释自述「**本机 Windows**」、用 `USERPROFILE` ／ `C:\Windows\…` ⇒ **是 Windows 探针被搬到 Linux 机的**，勿当 CVM 器材直接跑。
- ⚠️ **CVM 产出不得是唯一副本**（机器**已续费 · 2026-10-08 · 一年 200 元 ⇒ 到期 2027-10-09 21:08:53**；原时限 2026-10-09）⇒ 由 3.9 的回传核对表兜住（含 `~/larry-data/larry.db`，该机独有的证据原件）。
- ⚠️ **启动 / 装载类观测的「假绿三连」**（2026-09-16 实测，逐条都有反例 —— 判「环境可用 / profile 可用」前必读）：
  - ① **`dsh --profile <p>` 在 profile 不存在时同样 `exit 0` ＋ 双流全空** —— dsh 会自动把 home 建成**空壳 profile**（`dependencies: {}`），CLI 再从**自身安装树**解析 bundles ⇒ **`exit 0` 永远不能单独当判据**（与 `--help` / `--dump-config` 同类，只是这次骗过的是 boot 探针本身）。
  - ② **boot / 启动探针必须保 stdin 打开** —— sdk app 是 stdio 服务，`stdio:'ignore'`（或 stdin 关闭）会得到「`exit 0` ＋ 双流全空」的假绿（实测栽过一次）。
  - ③ **必须配负向对照**：拿一个**必然坏的输入**（如**不存在**的 `DSH_HOME`）重跑，观测若**逐值不变** ⇒ 该判据对这类坏**不敏感**。实例：原定四项观测（`exit code` / stderr 行数 / 栈帧版本号 / 3 条 entry）在空壳 home 下与原判**逐值相同**。⇒ **凡「启动 / 加载类」观测，都要问一句"拿必然坏的输入去跑，观测会不会变？"**（这是 §负向对照矩阵 在装置层的前置形态）。
- ⚠️ **安装 / 启动类命令的退出码也不可信** —— `dsh plugin add` 在 pnpm 报 `Done` 后 **node 不退出**（CVM 实测挂 1:51，本机同）⇒ 范式：**后台 ＋ 轮询日志 ＋ 人工收尾**，不指望退出码（与 `setsid nohup … rc` 同族，但这里是"根本不退"而非"退得慢"）。
- ⚠️ **通道差异（本机 Windows 侧，2026-09-16 实测 —— 属通道坑，非 dsh 事实，结论不得跨通道外推）**：① **pnpm store 落在盘根会被沙箱拦**（`[ERR_SQLITE_ERROR] unable to open database file`，因默认 `D:\.pnpm-store`）⇒ 显式 `npm_config_store_dir` 挪进允许区即通；② **Node 24 在 Windows 不能直接 spawn `.cmd`**（`spawn EINVAL`）⇒ 跑 npm 须 `shell: true`。
- ⭐ **回退层解析到旧代际 —— 真因是「落点树 lockfile 被冻结」，不是「heal 注射代际污染」**（2026-09-16 二次上机，四组对照；**订正**本文件同日早先的表述）：
  - **原表述（作废）**：曾记为「`heal` 把 CLI 落点树的**代际**回填进任意 home ⇒ 隔离 home 被注射代际污染」。实测**不成立**：heal 只是**忠实反映落点树的解析结果**，问题在该树自身的 lockfile。
  - **机制（此部分保留，已由源码复核）**：回退层 `<home>/profiles/node_modules` 的链接由 **CLI 安装落点树**解析而来（源码 `dsh-app-boot/lib/index.js`：`installAnchor` / `resolveModuleFallbackEntries` / `moduleFallbackEntryCurrent`），**不是**来自 `larry` / `web` / `acp` 三个 profile（旧表述作废）。
  - **四组对照**（观测 `@deepseek-ai/dsh-session-persistence` 的解析版本；registry 上 `0.1.5-rc.2` **确实存在**）：

    | 装置 | 观测 | 含义 |
    |---|---|---|
    | 全新 015 项目（`pnpm add`，空目录） | **`0.1.5-rc.2`** | 干净图**无此现象** |
    | `~/harness` 现状 lockfile | `0.1.2-rc.1` | 冻结在旧代际 |
    | `~/harness` 保留 lockfile 跑 `install --lockfile-only` | `0.1.2-rc.1` | **不自愈** |
    | `~/harness` **只**删 lockfile 重跑（`node_modules` 尚在） | `0.1.2-rc.1` | ⚠️ **仍冻结**（≠ 早先结论） |
    | `~/harness` 删 lockfile **＋** 删 `node_modules` 重装 | **`0.1.5-rc.2`** | ✅ **真修法**（2026-09-16 落地） |
    | 副本目录（**无** `node_modules`）删 lockfile 重跑 | `0.1.5-rc.2` | 与上两条**不矛盾** —— 差异只在有无物理树 |

  - **成因（两层）**：① 该包的依赖类型在 015 里由 `dependencies` 变为 `peerDependencies`（配 `autoInstallPeers: true`），而 pnpm 的**增量升级（`pnpm add <pkg>@新代`）只重算被改动子树**，不会因「依赖类型变了」回头重算 ⇒ lockfile 冻结旧代际，**后续 `install` 亦不自愈**（对照表第 3 行）；② ⭐ **`node_modules` 本身是解析输入**：pnpm 会**复用磁盘上已有的物理版本**作解析偏好（日志实证：`[WARN] Could not find preferred package …`）⇒ **只删 lockfile 不足以重算**，必须连 `node_modules` 一起删（对照表第 4 行 vs 第 5 行）。
    - ⚠️ **同族教训（路径不可外推）**：早先「删 lockfile 一行动作即修」的结论取自**无 `node_modules` 的副本目录**，把它搬到真树就失效 —— 与 `.workbuddy/memory/MEMORY.md` 里「修正性实验的结论必须限定路径」是同一条。
  - **正确判据（替换原「看回退层的实际代际」）**：判某 home 可用，须核**回退层反映的解析结果**与 profile 的 peer 要求**是否相容**。「拿到旧代际」是**落点树 lockfile 冻结**的信号，**不是**「heal 注入」的信号 —— `~/.dsh-015` 红 = 其 peer 要求 `^0.1.5-rc.2` 与落点树给的 `0.1.2-rc.1` 不相容。
  - ⭐ **行事规则：跨代升级 DSH 后必须重算 lockfile** —— `pnpm add` / `pnpm update` 的增量升级会冻结旧代际且**不可自愈**；正确姿势 = **删 `pnpm-lock.yaml` ＋ `node_modules` 后全新 install**，升级后另跑一次版本核对（「`pnpm install` 跑过」**不等于**「图已重算」）。
  - ⭐ **修法（2026-09-16 已落地并验收）**：`mv pnpm-lock.yaml <备份>` → `rm -rf node_modules` → `pnpm install`（CVM 实测 14.8s）。**验收四项**：① lockfile 解析 = 目标代际（本次 `persistence` / `query` / `fs` 三处 012 → 015）；② `.pnpm` 里旧代际物理目录数 = **0**（本次 215 → 0，物理目录总数 793 → 550）；③ `node_modules/.bin/dsh` 重建、`dsh --version` = `0.1.5-rc.2`；④ **端到端探针跑通**（见本段末条实测）。
  - ⚠️ **代价：落点树重装 ⇒ 各 home 的回退层链接大面积悬空**（pnpm 的 peer-hash 目录名随图变化：`@deepseek-ai+dsh@0.1.5-rc.2_cfa263…` → `_0351730…`）。实测：`~/.dsh-015` 悬空 **74**、`~/.dsh` 悬空 **98**。**修法 = 对该 home 跑一次 boot 触发 heal**（`DSH_HOME=<home> dsh --profile <p> --help` 即可 —— 触发门槛比想象低）；heal 后 `~/.dsh-015` 悬空 **0**、`~/.dsh` 余 **24**，残项**全是 web 前端包**（`react` / `lexical` / `@tanstack/*` —— 落点树**本就不含**它们，**修前即悬空**，非本次操作引入）。
  - 📌 **当前环境事实（2026-09-16 定格，老大裁定「作为当前事实记录」）：`~/.dsh` 回退层余 24 条悬空 ⇒ 判定「不阻塞、不根治」**：
    - **构成**：全为 **web 前端依赖**（`react` / `react-dom` / `lexical` / `@tanstack/*` / `prop-types` 等），落点树 `~/harness`（015）**本就不提供**这些包 ⇒ 链接目标不存在。
    - **非本次操作引入**：修前样本里 `prop-types` / `react-dom` 即在悬空名单 ⇒ 与本轮落点树重装无关。
    - **不阻塞（实测）**：`web` profile 可正常起服务 —— `dsh --profile web --no-open --port 18999` ⇒ **端口监听成立 ＋ HTTP 可探**。
    - **不根治的理由**：根治须把 web 前端依赖也装进落点树；而落点树是 **CLI 落点**（只承载 dsh 与其服务端依赖），web 前端属另一条分发路径 ⇒ 为一个「本就悬空、且不阻塞」的状态去改动落点树构成，**成本与收益不成比例**。
    - ⚠️ 将来若 web profile 真报缺模块（`MODULE_NOT_FOUND` 命中 `react` / `lexical` 一类）⇒ **先回查本条**，不要当新问题从零排查。
  - ⚠️ **旧树可能连 lockfile 都已不可用**：`~/harness/pnpm-lock.yaml.bak-304`（012 态）**不能**喂给 `pnpm install --frozen-lockfile` —— 报 `The importer resolution is broken at dependency "@deepseek-ai/dsh-sandbox-local": version "0.0.1-rc.1" doesn't satisfy range "*"`（该版本由 workspace 的 peer 声明 `*` 引入）。⇒ **「回到旧态」这条路本身不通，只能向前修**；若要留退路，须在升级前备份**整棵 `node_modules`**，只备份 lockfile 不够。
  - ✅ **修复后实测（2026-09-16）**：主 home `~/.dsh` 的 D1 条件（**不注入 env key**，仅凭 `~/.dsh/.credentials.yaml`）端到端跑通 —— 连跑 **5/5** ＋ 三场景（web 实例共存 / 刚 kill / 完全干净）**3/3** ⇒ **8/8 绿**，`stdout=probe ok`。修前基线可回溯：`~/.dsh/sessions/--home-ubuntu-claude-305--/c305-d1/`（**18:44**，早于本次操作）记录 `turn/end reason=completed` ⇒ 修前亦绿，**本操作未引入功能性回归**。
  - **原候选修法处置**：③「令 heal 只回填与 profile 同代的路径」**动机不成立 ⇒ 撤销**（heal 行为正确）；①（profile 显式声明全部 peer）**保留**，理由改为「不依赖回退层兜底、让缺件成为清晰早失败」，与代际无关；②（重建 `~/harness`）**降为一次性清理动作**，见 `TODO.md`。
  - ⚠️ **同源误读要一并销（含一次订正）**：`~/harness/.pnpm` 里确有 **192 项无引用旧代际目录**（lockfile 已不含、无任何 readlink 指向）。原记「磁盘残留、**无害、可 prune**」——**订正：它们不是惰性的**，pnpm 会把磁盘上已有的物理版本当**解析偏好**复用（本条上半段「只删 lockfile 仍得 012」正是它们的效力）⇒ 正确表述为「**是解析偏好的输入**」，须与 `node_modules` 的重装一并清掉，而非「顺手 prune 的无害垃圾」。与「回退层拿到旧代际」仍是两回事；真正的对照组是 **lockfile 解析结果**，「顶层 `package.json` 升了新代」**不能**当作「全套都该是新代」的依据。
- ⚠️ **`-32603 cannot create effect on inactive context` 曾间歇出现，成因未知**（2026-09-16 留痕；**勿据此下结论**）：本次修复过程中该错在 `~/.dsh` / `~/.dsh-015` 上共出现 3 次，错误栈落在 `dsh-sdk-protocol@0.1.5-rc.2`（**不是** 012 的 boot 器）。已做的排除：

  | 假说 | 对照装置 | 结果 |
  |---|---|---|
  | 012↔015 代际变化所致 | 把 `persistence` / `query` / `fs` 钉回 `0.1.2-rc.1` 再跑 | 仍红 ⇒ **不是代际** |
  | 残留 dsh 进程干扰 | 起 web 实例共存 / 刚 `kill` / 完全干净，三场景 | **三场景全绿** ⇒ **不是进程干扰** |
  | 修复后树不稳定 | 连跑 5 次 ＋ 上述 3 场景（合 8 次） | **8/8 绿** ⇒ **树稳定** |

  ⇒ **同一棵全 015 树既出过红也出过绿，且绿可稳定复现**。按证据纪律**停在「成因未知」**，不编成因叙事；再遇时先固定「该次运行的完整 stderr ＋ 跑前进程 / 锁状态」，而非直接怀疑版本。
- ⚠️ **boot 类动作不是「只读」**：对任意 home 跑一次 boot，上述 heal 都会**改写该 home 的 `profiles/node_modules`**（实测：空壳 home 由 0 → 240 条链接；`~/.dsh-015` 该目录 mtime = 跑的那一秒，与结果落盘同秒）⇒ 派发「只读观测」类任务时，**要么显式声明会被写、要么改用隔离副本**；**「跑前 / 跑后 `readlink`」应作为标准观测项**。（触发门槛实测很低：**`dsh --profile <p> --help` 即足以触发 heal** —— 本次两个 home 的回退层就是靠它重建的。）

##### DSH-3.5 · S3 sandbox 器材：`landlock_probe.py` 登记（WB 2026-10-08）

> **本节定位**：登记 3.5 判定轮所用**独立通道器材**的规格 ＋ 验收态（判据/既定前提 ⇒ 落定案区）。⚠️ 本件**只证「器材可用」**，⛔ **不等于「3.5 判据成立」** —— 后者已在**真 DSH** 上跑完并复验成立（见紧随其后的〈DSH-3.5 · S3 sandbox：判定轮复验〉）；完成态快照 = `archive/roadmap-history.md`「DSH-3.5」段。

**① 落点与身份**
- **路径**：`harness/scripts/cvm-probes/landlock_probe.py`（**受 git 跟踪**；与 `cvm-landlock-verify.mjs` 同目录）。
- **sha256**：`226603df9b76f109ac6d9aab6dd618a4d393985b0d9c3848b577433c657fbbf5`（25467 B）。
- **provenance（诚实边界）**：v1（原 `D:\Temp\Sys\claude-wsl-probe\landlock_probe.py`）**已确认丢失**（五处核查全空：Windows Temp ／ WSL `~/claude-probe` ／ 回收站 ／ git 全历史 ／ CVM 侧；**正文从未入库**）⇒ 本件为**重写**、非恢复；**v1 历史读数不用于逐字比对**。⛔ **不再落 `D:\Temp\…`**（该目录被 `test-env.md:280` 标「可整目录删」，正是 v1 丢失的原因）。

**② 规格**
- **零 DSH 依赖**（纯 `python3` ＋ `ctypes`）—— 唯一存在理由：与 DSH 自家 landlock addon（`@deepseek-ai/node-addon-landlock-run`）互为**独立通道**（§3.6② 的 dry-run 正证即用此件）。
- **ABI 自适应**：查表**声明**掩码位 ⇒ 内核**逐位验收** ⇒ 用**交集**（裁剪时**响亮**打印 `FS_MASK_CLAMPED`）。
- **`--fs-mask` 负向开关**：可喂**人工指定**掩码，用于复现「人工喂高位掩码给低 ABI 内核 ⇒ `EINVAL`」对照。
- **`VERDICT=` 机读行** ＋ 退出码一一对应（`PASS`→0 ／ `FAIL`→1 ／ `MASK_REJECTED`→3 ／ `ERROR`→4，约定在工件头部表）。

**③ 验收态（WB 复验 · 2026-10-08 · P1–P8 全绿）**
- sha256 与交付声明**逐字一致**（`226603df…`）；**WB 亲跑 CVM** 正证 `VERDICT=PASS`/0、负向对照 `--fs-mask 0x40000000` ⇒ `MASK_REJECTED`/3，**归一化后与交付读数逐行相同**；独立参数 `--fs-mask 0x8000` 复现「ABI 4 拒 bit15」。
- **两场地实跑（交付侧）**：CVM（ABI 4 · 目标场地）`PASS`/0 ／ WSL（ABI 7 · 回归）`PASS`/0。
- ⚠️ **WSL 未由 WB 复跑**（本机 `wsl.exe` 黑名单硬拦）⇒ 按派发稿「如实报未跑」；**自适应由 CVM 单场地 P5 读数**（`FS_MASK_DECLARED` ＋ 逐位 `FS_BIT_ACCEPT[bit…]`）验证。

**④ 通道 ／ 场地 ／ 部署副本**
- **CVM**：`python3` = 3.12.3（WB 实测）；内核 `6.8.0-124-generic`；**ABI = 4**；部署副本 `~/ll-probe/landlock_probe.py`（sha 与库内件**一致**）——⚠️ **该副本非判定依据**（判定以**库内件 ＋ 回报证据**为准），可随时清。
- **WSL**：`Ubuntu-24.04`，ABI = **7**（回归用）。
- ⚠️ **ABI 边界**：CVM = 4 ／ WSL = 7 ⇒ **判定只能写在 CVM、不得互搬**（见〈ABI 边界〉）。

**⑤ 用途与边界（⛔ 防误读）**
- **用途**：3.5 判定轮的**独立通道器材** —— 与「真 DSH 复核三档 ＋ fail-closed」（Trae）互为**交叉验证**。
- ⚠️ **假绿坑（必读）**：探针**自设掩码**（只授权 scratch ⇒ 其余读/写全拒）**≠** DSH 的 profile 掩码（`readOnly:['/']` ＋ 写白名单 ⇒ **读权限全开**）⇒ 正证**只证「内核确实强制」**，⛔ **不得读成「DSH 会挡住读敏感文件」**（CVM 非独占、他方产物在库）。
- ⚠️ **`--fs-mask` 语义边界**：显式掩码**不裁剪**（喂什么测什么）⇒ 用窄掩码跑出的 `PASS` **不是**「拒读正证」。

##### DSH-3.5 · S3 sandbox：判定轮复验（WB 2026-10-08）

> **本节定位**：登记 3.5 **判定轮**（真 DSH on CVM）的**复验结论 ＋ 缺陷留痕**（判据 ／ 既定前提 ⇒ 落定案区）。与〈器材登记〉**互为交叉验证的反面** —— 器材件只证「内核确实强制」，本节证「**DSH 判据在真 DSH 上成立**」。执行面（派发稿 ／ 回报正文）原在 `exchange/log-trae.md`「DSH-3.5 判定轮」，**2026-10-08 按活日志规矩已清** ⇒ **以本节为准**（回溯：`git log -p -- exchange/log-trae.md`）。

**① 判定：成立** —— J1–J7 全判 PASS **站得住**，无降级判定，无结论需推翻。⚠️ 下列④为**表述 ／ 证据完整性**缺陷，**均不动结论**。

**② 复验方式（不采信回报正文，一律回源取证）**
- **物证**：`D:\Code\_trae-evidence\35\` —— 解压树 37 件 ＋ `local-scripts` 11 件 ＋ `tar.gz` **sha256 = `b2e5d818…4b409`**（与报告自报**逐位一致**）。
- **Tier0 凭据扫描**：WB **自写脚本独立扫**（默认脱敏、不回显值）⇒ `sk-` ／ `Bearer` ／ `key|password|secret|token=` 模式**全树 0 命中**（不采信执行方自扫声明）。
- **逐条回源**：J1–J4 读三臂 toolresult 原文 ＋ `dump-mode-frames.output.txt`；J5 读 toolresult hint ＋ session `approval/*` 帧；J6 读 `summary-j6fix.json` ＋ 各件原文；J7 读 `bogus-mode.stderr.txt` —— **引文逐字属实**。
- **上机只读核 4 条**（趁 CVM 10-09 到期前，前台 ssh 只读）：见下③。

**③ 4 条「包内无输出支撑」的自证，WB 上机复现（原本只回脚本、未回输出）**
- ⭐ **「硬链接 ×6」属实**：`stat` 两路径（工程 home profile 层 ／ 落点树 `.pnpm`）**同 inode `814244`、`nlink=6`** ⇒ J6 构造方式（mv 临时 home 内 profile 层而非落点树）的**根因成立**。
- **`NO_BWRAP`** ✓（与 2026-09-23 dry-run 一致）。
- **`kernel.apparmor_restrict_unprivileged_userns = 1`** ✓（禁区未动）。
- ⭐ **J7 归因逐字复现**：裸 runtime 跑 `bogus-mode-35` ⇒ `ValidationError: … $.mode expected "read-only"|"workspace-write"|"danger-full-access" but got "bogus-mode-35"`，**栈帧指向 `dsh-app-boot` → `dsh-sandbox-policy` 的 zod 校验** ⇒「归因明确」成立。

**④ 增量缺陷 5 条（均不改结论；前 3 条为执行方应订正项）**
1. ⚠️ **J6 引文出处记错包**：报告写「＝ `dsh-sandbox-local/README.md:57` 逐字」，实测该整句**由 `@deepseek-ai/dsh-sandbox/lib/index.js:185` 生成**、README 在 **`dsh-sandbox/README.md:135`**；`dsh-sandbox-local/README.md:57` **只有错误码名** `SANDBOX_UNAVAILABLE`。⇒ **文本真实、出处不精确**。
2. ⚠️ **未闭合项① 的表述与它自己引用的证据打架**：报告称「全 29 帧 grep `/SANDBOX/i` **无 tool/result 命中**」，而其引用的 `grep-sandbox-code.output.txt` 里**有 2 处** tool/result 命中（seq15 ／ seq22，因文本含 "sandbox"）。**正确说法** = 「无 tool/result **携带 `code` 字段**」（该结论 WB **独立复核为真**）。
3. ⚠️ **5 个前置 ／ 诊断脚本只回脚本、未回输出**（`preflight` ／ `probe-env`×2 ／ `diag-j6`×2）⇒ 依赖它们的条目在包内**无直接支撑**。⚠️ **CVM 10-09 到期后他人无法补** ⇒ 本轮已由 WB 上机补核（见③），但**流程上应回传输出件**。
4. `run-35-sandbox.mjs:104` 的 `packageDirStillResolvable: true` 是**硬编码字面量**、非测量 ⇒ **无判据价值**（不影响结论，标出防被当读数引用）。
5. 证据包内 `summary.json` ／ `summary-fullrun.json` 为 **J6 attempt1 版**（`insideFcTxt=PRESENT(FAILCLOSED)`，即**构造失败态**），与交付用 fix 版（`summary-j6fix.json`）**并存** ⇒ 后读者易误判（执行方未踩，但建议在包内加 README 标明哪份是交付版）。

**⑤ 结论边界（⛔ 防外推）**
- 判定**只能写在 CVM**（landlock **ABI 4** ／ rung = landlock ／ enforcement = **partial** ／ bwrap 缺席）⇒ **不得搬到 WSL（ABI 7）或其他宿主**（见〈ABI 边界〉）。
- 本判定是「**机制成立**」；**「产品可接受」不在本块靶子内**（与 3.4 同一口径）。
- J6 的 fail-closed 形态为**装置构造**（mv 掉 launcher）所致，⛔ **不得读成「CVM 上天然会 fail-closed」**。

**⑥ 已知限制与口径（承自回报 · 2026-10-08 归位；⛔ 均不影响①判定）**
- **`SANDBOX_UNAVAILABLE` 的结构化 `code` 不落 session 日志**：fail-closed 臂全 29 帧只有 `isError:true` ＋ message 文本，**无 `code` 字段**（seam 源码注释称 HarnessError 会带 code，但 session-log 序列化层未持久化）⇒ ⛔ **「按 code 区分 `SANDBOX_UNAVAILABLE` 与其他 isError」在会话日志通道不可用**；替代 = message 逐字 ＋ 不 exec ＋ addon `exit 125` 对照。（runtime API 通道是否带 code **未测**，⛔ 不臆断。）
- **J2 的拒绝读数形态 = `Permission denied`（非裸 `EPERM`）**：判据文本写 `EPERM`，用户态实得 bash stderr `Permission denied`（`EPERM` 的 strerror 渲染；landlock 方言 `DENIAL_SIGNATURES=["permission denied"]` 匹配的正是后者）⇒ **后续同类判据口径一律写「denial 方言命中」**，⛔ 别再写裸 `EPERM`（它在用户态不可见）。
- **装置缺陷（一次性 · 无下游）**：`run-35-sandbox.mjs` **臂间未清场** `~/larry35-sbox` ⇒ danger 臂写的 `inside.txt` **残留**到 esc 臂（`insideTxt=PRESENT` 是残留假象）。判据只看各臂**专属**文件（`denied-<mode>.txt` ／ `esc-<mode>.txt` ／ `inside-fc.txt`）故未受影响。该装置随 CVM 到期废弃；**如复用须臂间清场或每臂独立 WS**。

#### DSH-4：差异化能力迁移

> **任务清单与进度见 `TODO.md`「DSH-4」**；本节只放**排序原则、实现路径判定与验收基准**。

**排序原则（用户感知层优先）**：用户强感知的差异化项（记忆 / 画像 / 知识库）排在开发者红利项（trajectory / compaction 精细策略）之前——避免"接 DSH 送的能力很爽"挤占真正让 LarryAgent 是 LarryAgent 的部分。

| 能力（实现路径判定，非任务清单）| 原 Python 模块 | DSH 实现路径 |
|---|---|---|
| 长期记忆双写 + 人审 | `memory/archiver.py` 223 行 + `engine.py` 107 行 | 自做插件挂载 `session/` 事件流；保留 SQLite+ChromaDB 双写 |
| **记忆迁移（活资产，非数据搬运）** | 全量 memories + 向量 | ✅ **无需全量重嵌**（DSH-2.5 ⑤ 实测：TS `bge-small-zh` 与 Python 侧向量漂移 `2.2e-7`、cosine ≥ 0.9999999999、top-1/3/5 全对）。⚠️ **硬前提：预处理须严格对齐**——`do_lower_case` / 统一 lowercase、CLS pooling、L2 normalize、max_length 512；**任一项不对齐会产生 0.77 级假漂移**，据此误判"必须重嵌"会白做。其余仍须：召回等价性抽样验收（迁移前后同组 query 的 top-k 一致性达阈值）+ 语义字段不降级（`is_active` / `last_hit_at` / `source_role` 一个不能丢，ChromaDB 只能重灌、机会只有一次）|
| 用户画像 | 📐（TODO 长期项）| 自做插件；DSH 身份语义待核（见 §3.3）|
| 知识库 | 📐（2.4.6 三层递进）| 自做插件；BM25/FTS+向量混合检索 |
| 角色机制 | `config.yaml` + 5 角色 system_prompt | 用 `preset/`（agent-presets + persona）+ `cordis.yml` 配置 |
| 工具生态 | `tools/` 844 行（shell/file_ops/web_search）| 翻译为 DSH 工具插件；**web_search 暂保留自实现 Brave**（DSH 搜索/抓取包归属待核，且须保留首版范围边界——不配正文抓取，SSRF/清洗成本是刻意规避的）|
| 回收站 / 每会话文件沙盒 | 🚧（2.3.1 / 2.3.3）| 自做插件；**`workspace` 只给「会话↔目录」数据模型**（原文 root「不是读边界」）⇒ 隔离语义仍自定义；回收站 append-only 语义下无对应 |

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

**验收五层**：① 纯逻辑层翻译全绿；② 关键路径 snapshot replay 覆盖（chat 主链路 / 工具调用 / 归档提取）；③ 真实 API e2e 冒烟；④ 数据迁移验证（双写 + 迁移前后召回抽样比对，**无需重嵌** —— 见上方 DSH-4 承载表）；⑤ Windows 端侧执行器验收（若走 2.10.2，与 DSH-2 实测项③同源）。

- **任务**：WB 复验 + 老大最终验收（勾对承接总表）

#### 31 子项承接总表（DSH-4 验收基准）

> 依 `../docs/product-positioning.md` 定稿版逐项对照；**基线 `dsh-v0.1.5-rc.2`**（2026-09-15 迁移，复核见 §2.3）。
> **口径（2026-09-15 按 015 重划）**：🟢 **可承接** 12 / 🟡 **可降级** 15 / 🔴 **仍须自做** 4。判据与逐条依据见 `dsh-015-capability-mapping.md`（31 子项 × 上游 53 篇子系统规格）。
> ⚠️ **档位 ≠ 完成度**：「可承接」仍要配置 / 适配 / 验收；「可降级」只是**自做范围可收窄**，收窄多少由产品层定。
> ⚠️ 标 **⚪ 待实测** 的单元格表示该处依据含未验项——见本节末〈待实测清单〉。**档位本身不依赖未验项**（依据均为上游契约 / 源码事实）。
> ⭐ = 相较 2026-09-08 旧表有**实质变化**的条目。

| 子项 | 档位 | DSH 侧（承接内容与边界） | 我方剩余动作 |
|---|---|---|---|
| 2.3.1 会话生命周期（回收站）| 🟡 可降级 | `session-title`（durable latest-wins 标题）+ `workspace`（会话有序账户）+ `session-query`（列表 / 过滤 / 分页）+ `persistence`（durability seam，5 个 handle 方法）；**协议面另有 ACP `session/list`（keyset 分页 / 规范 cwd 过滤 / 排除活跃与后代）· `resume` · `close`** | **回收站（软删 + 恢复）、fork / lineage 与批量归档自做**——append-only 事件流语义下无对应；**上游明确不实现** ACP `load` / `delete` / `fork`（自述理由：transcript / destructive-storage / lineage 属另一类用例），**DSH-2.5 ② 已实测确认**（`-32601`，见 §2 风险表）。⚠️ **fork 并非上游完全没有**——`dsh-api-gateway` 的 HTTP 面有（§3.5 协议面对照表）。⚪ 待实测：`workspace` 运行时行为 |
| 2.3.2 对话体验（SSE / 停止）| 🟡 可降级 | 我方**保留 Vue/Tauri** ⇒ DSH 的 React 客户端（`ui-conversation` / `slots` / `client-resources`）**不直接承接**；`continuous-client-recovery`（Host 恢复后 3 s 警告 / 15 s 中止的**持续重连**）、`pinned-scroll-delivery-before-layout` 可作设计参照 | 流式 / 中断恢复 / 常驻 banner 自实现（**设计可借鉴**） |
| ⭐ 2.3.3 会话级作用域（沙盒）| 🟡 可降级 | **`workspace`**——会话↔目录归属：稳定 id + 规范路径 + 有序 session 账户；**membership = id 在账户内 且 session header 的 cwd 等于 workspace path**（一个 session 结构上至多属一个 workspace）+ `scope`（per-agent 可见性）+ `sandbox` / `permission-presets` | **隔离语义自做**——`workspace` 只做分组，原文 root「只是相对路径基准、**不是读边界**」。⚪ 待实测：`workspace` 运行时行为（membership 过滤 / `attachSession` 流程） |
| 2.3.4 多模态输入 🗣️ | 🟡 可降级 | **`attachment`**（内容寻址 / 图片与文件分存储 / 共用有序附件列表）+ `client/file-upload`（015 新增：**非图片不限类型、不限大小、byte-for-byte 存**） | **上限 + GC + 2.4.6 升级通道自做**——上游原文「Attachments are **never deleted**」且无类型 / 大小限制 |
| 2.3.5 主动触达 🗣️ | 🟡 可降级 | **`schedule`**（`after`/`at`/`every`，最小 5 min；严格时区纪律；**catch-up 只补最近一次、不枚举不重放**；**等 Agent idle，绝不打断当轮**；at-least-once）+ **`webhook`**（认证外部投递 → 按需建 root Session）+ `jobs` | ⭐ **触达通道自做**——`ScheduleDeliveryMode = 'session-local'`，上游原文「**no external notification channel or cold-session scheduler exists**」 |
| 2.4.1 短期记忆 | 🟢 可承接 | `session`（append-only log 为唯一真相源，**LLM message history 是 derived、从不单独存**）+ `compaction` 取代截断 | 配置阈值 / 验收 |
| 2.4.2 长期记忆双写 + 人审 | 🟡 可降级 | **`storage`** domain form（`defineDomain(spec)`：zod schema + version + `compatibleVersions` + `invalidRecords: backup-and-skip`；`KvTable` 的 `get`/`entries`/`put`/`delete`/`update`；写后 `domain/changed` 事件）。**DSH-2.5① 已实测可外接任意绝对路径** ✅ | ⚠️ `storage` **只有 KV**（唯一 shipped facet），**无向量、无 FTS** ⇒ 元数据可承接，**向量召回 + 语义层（人审 / 矛盾检测 / 保鲜）自做** |
| 2.4.3 记忆可管理 | 🔴 仍须自做 | 产品语义已裁定（硬删、不建回收站），DSH 无对应 | 全部。⚠️ 前提：**记忆本体不入 session log**（见 §3.4 澄清）⇒ 硬删**无 append-only 冲突**；验收注记：删 → 回放 → 断言 session / trajectory 无残留 |
| 2.4.4 记忆保鲜与代谢 | 🟡 可降级（**仅设计**）| DSH 无记忆语义；但 `session-query` 的 `surface: current / shadowed / log-only` fold 语义 + proposed `Recallable compaction`（index checkpoints / state checkpoint / in-session history recall）可作设计参照 | 全部实现（**设计可借鉴**） |
| 2.4.5 用户画像 | 🔴 仍须自做 | `identity/` 自我描述 = **anonymous**（「one anonymous id per harness home … **without identifying the user**」；两版仅 README 改动，`diff --stat` 已确认）| 全部 |
| 2.4.6 知识库 | 🟡 可降级 | `storage`（KV 底座可挂）+ `session-query`（FTS 索引生命周期 / cursor 分页 / filter 代数**可作设计参照**）+ proposed `Domain KV storage capability seam and the workspace entity` | 混合检索 / 元数据 schema / 引用体系全自做；**底座可复用** |
| 2.5.1 多模型切换 | 🟢 可承接 | `llm` seam + providers（`llm-deepseek` / `llm-pi-ai` 等）+ `llm-retry` | 配置。⚠️ `llm` 组 **52 条**欠账（含 `llm-pi-ai` 17 条）⇒ 承接但在演化 |
| 2.5.2 工具挂载 | 🟢 可承接 | `tools` 管道 + `shell` / `fs` / `subprocess` seam（`shell` 翻 TS 插件）。**`web` seam 含 search 与 fetch 两操作**，`web-fetch-http` 已内建 SSRF 全套（DNS pinning / 拒 NAT64 非公网 / 逐跳复查 / 全部封顶） | 工具插件本身。⭐ 范围可重估（`web_fetch` 已挂起，见 §4.1） |
| 2.5.3 扩展性 / MCP | 🟢 可承接 | `mcp-client` + `extensions`（agent 定义并运行版本化 Cordis 包）+ `self-modification/` | 配置。⚠️ MCP **只消费 tools**——`acp` 原文「MCP resources and prompts have no DSH consumer」 |
| 2.6.1 角色切换 | 🟢 可承接 | `preset/`（agent-presets + persona）；`preset/persona` 本体 `inject = ['systemPrompt']`（`:27`，两版同）+ `complete`（完全替换 system prompt）/ `includeRuntimeContext` ⇒ **角色机制 = 官方 preset，公开面可达** | cordis.yml 承接 config 角色。⚠️ 015 **persona 前后缀拆分**（破坏性）⇒ 旧配置要适配 |
| 2.6.2 自动路由 | 🔴 仍须自做 | **无路由子系统**（53 篇全列表无对应页）；`scope` 只提供 per-agent 可见性载体 | 全部（含「意图 → 角色 + 上下文源 + 工具集」的联合路由） |
| 2.7.1 行为安全硬护栏 | 🟢 可承接 | `sandbox`（bwrap / Landlock / Seatbelt / Windows restricted token）+ `sandbox-local` **fail-closed**（无 runner 报 `SANDBOX_UNAVAILABLE`，**命令绝不静默裸跑**）+ `permission-presets`（三档：`workspace-write`+`ask` ↔ `danger-full-access`+`never`）| 策略内容。⚠️ 上限：**同世界隔离**，不防恶意代码 |
| ⭐⭐ 2.7.2 边界透明与用户决策权 | 🟢 可承接（**改判**）| `approval`（**closed + fail-closed** 结果集 `allowed-once`/`rejected`/`cancelled`/`unavailable`；「缺失 / 非属主 / 抛错 / 不合规的答者一律成为 `unavailable`，**而不是打开闸门**」；`approval/asked`·`approval/decided` **log-only 审计对**）+ `permission-presets`（preset 表可配置，客户端渲染成选择器）+ `user-questions`（瀑布 listener **可中继到已连接的客户端**）——A-framework 下**均为公开契约** | **只剩策略内容**：哪些操作要问 / 默认低打扰 / 审批聚合；**可先用官方两档 preset 零代码起步**。⚠️ **覆盖边界（勿外推）**：preset 表**只覆盖 `sandbox` + `approval` 两个 knob**；原文「工具开关」**不在其中**，须另走 `ctx.tools.restrict()`。⚪ 待实测：工具开关**真 agent 轮** deny 后模型侧行为（端到端，归 DSH-4） |
| 2.7.3 凭据与密钥边界 | 🟢 可承接 | `credentials`：**reference 化**（只存环境变量名）+ 四层 source（`env`/`file`/`project-env`/`user-env`）+ **每次操作重解析**（热更新，轮换 key 下一请求即生效）+ `describe()` 视图**没有能承载值的槽位** + 空值即 absent；对「被进程环境遮蔽」的引用报 `writable: false` | 配置。⚠️⚠️ **上游脱敏是 fail-open**（`settings/*/redact.ts` 的 TODO 自认：经 union / intersection / transform 可达的秘密**原样返回且无记录**）⇒ **不得作为我方红线保障**，见 §5.1。⚪ 待实测：该 fail-open 是否可构造复现 |
| 2.7.4 成本约束 | 🟡 可降级 | **`token-meter`**：detached replay 快照（`logRevision` / `baseline` / `surfaceDeltaTokens` / `totalTokens` / **逐节点定价 `TokenSurfaceNode`**），按 route 声明定价；上游原文「**Trigger, retention, and range selection all read this price**」 | ⚠️ **无预算 / 限额 / 累计**（是「当前请求压力」快照，不是账户消费）⇒ 计量承接，**累计入库 + 预算 / 告警自做**（与 2.8.3 同底座）。⚪ 待实测：长会话稳定性与成本 |
| 2.7.5 数据主权与出境边界 | 🟡 可降级 | `util/http-proxy`（**015 新增**：在任何 entry mount **之前**装 global dispatcher，覆盖 9 个调用点及未来全部）+ `session-telemetry`（`session-telemetry/record` redaction；**只有显式反馈事件才授权上传**） | 出境**事实本身不变**；处置口径仍归用户（我方裁定不变）。⚠️ `api/gateway` 转发事件**不脱敏、重连不重放** |
| 2.7.6 数据可恢复与可迁移 | 🟡 可降级 | `SessionPersistence.export(id)` → **raw artifact**（parsed header + 逻辑文件名 + 解码后逐字文本）；apiproxy **ZIP 下载**，且区分 `501`（后端不支持）/ `404`（会话不存在）| **单会话导出已给**；**整体备份 / 导出 / 迁移仍自做** |
| 2.8.1 沉淀信息可见与可管理 | 🟡 可降级 | `session-projection`（把 log 派生状态**整体当前值**送到 client carrier）+ `client-resources`（`dsh-resource://` 地址 → provider → 帧流）+ `sidebar-right`（每会话 docking 面）| **展示机制可承接**；**记忆来源（我们的库）与其 schema 自做** |
| 2.8.2 AI 行为可见 | 🟢 可承接 | **`session-query`**：跨会话全文检索（`searchSessions`/`searchEvents`，cursor 分页）+ **事件关系追溯**（`replacedBy` / `replacementChain` / `sourceEventSeqs` / `derivedEventSeqs`）+ **会话家谱**（`SessionLineageTrace`）+ bounded event reads + `session-projection` + `feedback`（log-only）| 渲染层。✅ 维持且**增强**——关系追溯是我们原先没有的 |
| 2.8.3 资源消耗可见 | 🟡 可降级 | 同 2.7.4（`token-meter`）| **用户侧展示 + 入库自做**（改造路径依赖不变：需先建表 + 回填）|
| 2.9.1 时间感知 | 🔴 仍须自做 | **无时间感知子系统**。可借的只有 `schedule` 的**时区纪律**（必须显式给 offset 或 `time_zone`；**绝不读浏览器 / 会话 / 进程 / 模型上下文**；DST gap 拒绝、overlap 取较早瞬间）+ 笔记 `environment-prompt-suffix`（环境事实后置以保 provider prefix cache）| 全部实现（上述两条应作为**设计约束**抄进 2.9.1 稿）|
| 2.9.2 超长会话一致性 | 🟢 可承接 | `compaction` seam（`ctx.compaction` + `compaction-basic`）+ ⭐⭐ **`compaction-tool-result-pruner`**——**官方默认路径**：`compaction-basic` 在「range selection **之前**」调它 ⇒ 产品树说的「①**工具结果遮蔽 = 最划算的第一步**」**正好就是官方默认顺序**；另 `toolPairingBalancedBefore/After` 实现「工具调用与结果同存同弃」| 阈值 / 保留尾部策略（`compaction-basic` 拥有，可配）。⚠️ **保真度档位**（生成式摘要 37% vs 逐字 ~98%）若不达标 ⇒ 自做策略插件 |
| 2.9.3 降级与韧性 | 🟢 可承接 | `guard/`（loop-hygiene + tool-timeout）+ `llm-retry` + `subprocess-native-containment`（逃逸子孙进程 containment：Linux 临时 user-systemd scope / Windows kill-on-close Job；不支持则降级并给一次警告）| `LarryException` 统一出口自做 |
| 2.10.1 云端部署多端使用 | 🟡 可降级 | 出厂形态 = **本机 loopback 浏览器客户端**；**但远程形态已有完整实现**：`workspace-files-service`（原文 *"from a browser that **may not be on the Host machine**"*）+ `/api/file` 认证路由 + **持续重连** + Electron 壳走 `dsh-app://`；`web-server`（`ctx.webServer`：named-route registry / gzip / index.html transform）+ `api-gateway` + `client-connection` + `api-remotes` | 云侧部署 + **多用户 / 租户语义**（`identity` 仍是 anonymous）自做。⚠️ 出厂**无登出 + cookie 未标 `Secure`** ⇒ 上公网须自补（见 §5.2）|
| ⭐ 2.10.2 端侧能力保留 | 🟡 可降级 | ⭐ **capability seam 模型**（Service Definition + Provider）**天然支持「同一能力、不同位置、不同 provider」** ⇒ 「下沉」= **给 DSH 写一个端侧 Provider**，不是对抗框架。先例：`sandbox-local` 三平台后端并列 / `subagent` 多家 provider / `shell` 的 local+sandbox 双 provider / `e2b/`（反向位置的同类）| 端侧执行器本体 + shell 鉴权重构（IP 白名单 → API Key）。**架构路径已由上游证明可行** |
| 2.10.3 单人单实例 | 🟢 可承接 | `identity` = anonymous（**无用户维度**）⇒ 与「单人」同向 | 形态事实，无需动作 |

**档位分布**：🟢 12（2.4.1 / 2.5.1 / 2.5.2 / 2.5.3 / 2.6.1 / 2.7.1 / 2.7.2 / 2.7.3 / 2.8.2 / 2.9.2 / 2.9.3 / 2.10.3）｜🟡 15（2.3.1 / 2.3.2 / 2.3.3 / 2.3.4 / 2.3.5 / 2.4.2 / 2.4.4 / 2.4.6 / 2.7.4 / 2.7.5 / 2.7.6 / 2.8.1 / 2.8.3 / 2.10.1 / 2.10.2）｜🔴 4（2.4.3 / 2.4.5 / 2.6.2 / 2.9.1）。

**「迁移必关清单」**：⭐ **已有条目，见本稿 §3.6〈迁移必关清单（Marvis 四点，采纳）〉表（6 行）** —— Self-modification ／ `!!js` 配置即代码 ／ Agent 外链面 ／ Autonomy 自动执行面 ／ telemetry 上报面 ／ `session-log-deepseek`，**随 DSH-4 一并验收**。
> ⚠️ **本条曾误写为「当前无条目」**（2026-09-30 订正）：原措辞把「**这张清单**」与「**`web_fetch` 这一项**」混为一谈 —— `web_fetch` 默认放行确已随 §4.1 挂起（老大 2026-09-15），但**该单项的挂起 ≠ 整张清单无条目**。⇒ **老大 2026-09-30 裁定：按现状关闭「是否单列」议题**（清单已在 §3.6，**不再单列、不再另建**）。
> 📌 **口径**：本清单是**承接总表的负向补充**（总表答"承接什么"、本清单答"必须关掉什么"），两表**同属决策稿的产物**、**不混进本承接表** —— 即原「建议单列」的口径**已按现状满足**。

#### 待实测清单（档位不依赖，但影响**承接收益兑现**与**风险条力度**）

> **结论：本次重划无档位阻塞。** 12 / 15 / 4 的依据全部是「上游契约 / 源码事实」（见 §2.3 复核 + `dsh-015-capability-mapping.md` §2）。下列**5 项**未验项只影响两件事：某行的**承接收益能否真兑现**、某条**风险条的力度**。**未测之前不得据此升格或改档**。

| # | 待实测项 | 影响的总表行 | 为什么值得测 | 归属 |
|---|---|---|---|---|
| ① | `workspace` **运行时行为**（membership 过滤、`attachSession` 流程）| 2.3.3 | 该行「可降级」**收益的大小**取决于它：兑现 ⇒ 我方只写隔离语义；不兑现 ⇒ 分组底座也要自建 | DSH-3 |
| ② | `ctx.tools.restrict()` **真 agent 轮** deny 后模型侧行为 | 2.7.2 | 2.7.2 覆盖面的**另一半**（preset 只覆盖两个 knob）；上游无文档，只有实证 | DSH-4 验收 |
| ③ | `token-meter` **长会话**稳定性与成本 | 2.7.4 / 2.8.3 | 承接的**可靠性**；与 `llm` 组 52 条欠账相关 | DSH-4 验收 |
| ④ | `settings/*/redact.ts` 是否**真** fail-open（构造用例复现）| 2.7.3 / §5.1 | 决定**风险条力度**：源码标记为真，但「当前确实 fail-open」我方未复现 | DSH-3 |
| ⑤ | `web-fetch-http` 的 SSRF 行为 + CVM 可达性 | 2.5.2（**已挂起**）| 若将来采纳 `web_fetch` 则**必测**（承接该能力的前置） | 随 §4.1 挂起 |

> **另一类：环境复跑**（数据取自 012 通道、须在 015 复跑：CVM 内存与并发 / Windows 沙箱方言 / Vue↔Tauri 连通 / 反代 T2 / `dsh.exe` 崩溃定性 / **CLI 与 profile 同代**）——**已在 §2.3「015 迁移未闭合项」登记**，不在此重复；它们与本表档位无对应关系。

#### 风险与退出条件

- DSH-2 五项实测任一不过 → DSH-3 收益表重估，C 路径回退进入议程
- DSH-3 核心链路未达 P4 等价 → 回退旧后端（双轨保障，旧后端全程可用）
- DSH-4 任一项差异化能力卡死 → **单独延后，不阻塞主线**（DSH 框架先落地，差异化能力分批做）
- DSH 发布破坏性变更 → 按升级 SOP（§3.4）：跟 rc 及以上 tag（alpha 不跟随），升级必跑 replay + P4，任一红回退
- 方向不对齐长期化 → §3.3 的 7 项差异化能力同步排进 P 队列

#### 参考实现登记表（每步 → 具体可借鉴件）

> 【老大注：每一步计划开始前最好研究一下是否有更好的新的可参考对象，因为社区变化日新月异，但是也要注意，我们锚定的DSH版本可能和社区主流会逐渐脱节，评估的时候如果发现DSH版本已经严重落后到无法利用社区红利，需暴露给老大】
> **口径**：本表是 §3.0「只参考不直装」的**操作面** —— 把"某步可以参考什么"从口头共识变成**可核对的清单**。
> **规矩（老大 2026-09-14 定）**：**每步开工前先在表内定位参考件**（官方读 `ref/dsh-bare/` 或 npm；社区读 `ref/community/`，未落位者按需拉取），用完**回填一行「借鉴点」**；**找不到就写"无"** —— 空着比编一个强。
> **派发四要素（老大 2026-09-14 定）**：**派发任务时逐件写明** ① **路径**（写到可复制的程度）② **怎么参考**（读哪几个文件 / 读源码还是读 README / 要不要先跑）③ **参考程度**（只借鉴设计 ／ 可抄形状 ／ 可 fork 改造）④ **哪部分不可参考**（许可限制 / 与锁定版 `0.1.5-rc.2` 不符 / 与产品形态冲突）。**落位三件的四要素清单已备好** → §2.2.2「可参考 / 不可参考」表；新落位件按同格式补行。
> **三类来源**：① **官方包**（`@deepseek-ai/*`，实测 **277 个 `dsh*` 包**在 npm 分发）② **社区件**（名录 `ref/awesome-dsh-plugin.md` + 目录站 `deepseek-harness-plugin.com`）③ **上游主仓**（`ref/dsh-bare/`，锁 `dsh-v0.1.5-rc.2`）。
> **证据等级**：包名 / 件名 / 落位状态 🟢（2026-09-14 实查 npm org 与本地名录）；「借鉴点」凡**未经我方复跑**者一律 🟡。

| 切片 | 要解决什么 | 官方参考（`@deepseek-ai/`） | 社区参考 | 本地落位 |
|---|---|---|---|---|
| **3.0** 三态对照 / 采数 / 凭据 | 判据有效性 + 环境口径 | 五个 profile 模板 `dsh-web-app` / `dsh-headless` / `dsh-sdk-app` / `dsh-sdk-minimal` / `dsh-acp-app`；`dsh-home-paths`（`DSH_HOME` 解析） | `omdsh-dev/dsh-security-audit`（配置 / 插件来源 / 网络暴露的**只读审计清单**，可作采数项参照） | — |
| **3.1** S0 基础链路（首个产品插件） | 工具插件的**最小注册面** + e2e | `dsh-sdk-protocol` / `dsh-sdk-client` / `dsh-sdk-jsonrpc-server` / `dsh-sdk-app`（sdk 面四件）；`packages/fs/tool-fs`（工具注册范式）；`dsh-sdk-minimal`（最小组合） | ⭐ `kun2-5code/dsh-plugin-template`；`omdsh-dev/plugin-template`（官方 turtle-ui 派生）；`iiwish/dsh-testkit`（Docker 隔离的真宿主生命周期测试）、`PerryLink/dsh-test-drive`（一次性 profile 冒烟） | ✅ 模板已落位 · ✅ **借鉴点已回填**（见下表 5 / 8 / **9 / 10**，2026-09-17 复跑所得） |
| **3.2** resume id collision | 复现与定性 | `packages/core/session`；`dsh-session-persistence-sqlite` / `-jsonl`、`dsh-session-query-sqlite` | `EvilIrving/dsh-repro`（导出**最小可复放的问题包**，含会话日志 / 失败命令）——复现件的形态参考 | ✅ **已落位（2026-09-17）**，四要素见 §2.2.2 · ✅ **借鉴点已回填**（见下表 **11**，2026-09-17 复跑所得） |
| **3.3** S1 审批（三段） | 答者接口 + 出境往返 + fail-closed | `dsh-user-approval`（机制）/ `dsh-permission-presets`（预设答者）/ `dsh-client-ui-approval` / `dsh-client-ui-permission-presets` / `dsh-headless`；出境面 `dsh-api-remotes` / `dsh-client-connection` | ⭐⭐ **最富的一类（50+ 件）**：**答者链** `PerryLink/dsh-auto-review`、`Letter2025/dsh-approval-llm`、`simon300000/dsh-auto`、`ilharp/dsh-tool-approval`、`SeverusZh/dsh-yolo-mode`（fail-closed 兜底）；**出境到人** `PerryLink/dsh-reach`、`moyu-good/dsh-lark-bridge`、`452926826/dsh-feishu-bot`；**规则引擎** `940842546/dsh-permissions`、`PerryLink/dsh-permission-rules` | ✅ `dsh-reach` 已落位 |
| **3.4** S2 compaction | 换 Provider + 保原文 | `dsh-compaction`（契约）/ `dsh-compaction-basic`（默认 Provider）/ `dsh-compaction-tool-result-pruner` | `aerince/dsh-active-context-pruning`（**经官方 compaction API** 做模型自定剪枝）、`giter00/dsh-headroom`（压 tool 输出、保原文） | ✅ **调研已收口（2026-09-28）** ⇒ **汇总**（候选池 ／ 分档统计 ／ 通道对照 ／ 分歧点 ／ 版本观察 ／ 深读清单 Top 12）见 `docs/dsh/dsh-34-ref-research.md` **§11**；✅ **验收已通过（2026-09-29）**（Trae 主体 J1–J8 ＋ Claude 独立测试件 T1–T6，WB 回源复验）⇒ 判据口径四条 ／ 量级阶梯与预算 ／ A 裁定与落地状态见 §3.6；✅ **已收口（2026-09-30）**（产品裁定：不自做 Provider ／ 用官方英文摘要 ／ 保真度转长期观察 ／ 基线结论留作参考）|
| **3.5** S3 sandbox 三档 | seam 可替换 + 中间档 | `dsh-sandbox` / `-policy` / `-local` / `-windows-acl`、`dsh-fs-sandbox`、`dsh-bash-sandbox`、`dsh-pwsh-sandbox` | ⭐ `omdsh-dev/sandbox-micro` / `sandbox-mxc` / `sandbox-nono`（**三个第三方 backend ⇒ 证明 `ctx.sandbox` 是可替换 seam**）；中间档预设 `Alnita-M/dsh-Almost_Full_Access`、`a903067276-rgb/dsh-perm-guard`、`Jiao-XXX/dsh-auto-approve` | — |
| **3.6** S4 记忆最小闭环 | 双写 + 召回 + 降级 | `packages/core/session`（事件类型）；`dsh-session-persistence-sqlite`、`dsh-session-query-sqlite`、`dsh-session-projection` | ⭐ `Asher-2000/dsh-memory-connect`（SQLite FTS5 + 本地 embedding + `systemPrompt.context` 逐轮召回）；`aqsk-BLG/dsh-memory`（分层文件记忆 + 混合检索）、`chenzheshushi-commits/dsh-evolve`（零 token 确定性召回）、`agentscope-ai/ReMe` | ✅ 已落位 |
| **3.7** Windows 方言修复件 | 方言件写法 + 开发 overlay | `dsh-sandbox-windows-acl`、`dsh-sandbox-local`、`dsh-pwsh-sandbox` | ⭐ **`WSL & Windows Interop` 整类 37 件**（社区专门做过）：`173787247/dsh-wsl-env`（WSL / 路径映射 / CRLF / git 注意事项注入 systemPrompt）、`lucifergzsz414/dsh-windows-native`（native-Windows PowerShell / 编码 / 文件系统 gotchas）、`173787247/dsh-wsl-path` / `-mnt` | ✅ 模板的 `dev/cordis.yml` 可参照 |
| **3.8** A 段协议（通信面） | 跨网络宽面 + 审批中继 | ⭐ `dsh-api-remotes`（**"任何不依赖 React 的 `ctx.remote` 约定均可复用其 Client face"**）、`dsh-client-connection`（gateway 挂 `/api`；browser 半 = fetch/SSE）、`dsh-api-gateway` + `dsh-typert-*`（4 件）、`dsh-host-webserver` / `-frontend-static` / `-apiproxy`、`dsh-cordis-host-runner`、`dsh-api-session-controller`、`dsh-sdk-protocol`（transport / `onRequest`） | ⭐ `litestartup-com/dsh-api-gateway`（**REST + SSE 暴露运行中会话给第三方客户端 + API-key 鉴权** —— 与自做 driver 同题）、`Jiachi5533/dsh-remote-gateway`（source-filtered HTTP/SSE/WS 网关）、`BotonJ/dsh-remote-link`、`liguobao/deepseek-harness-remote`、`yabolee-kkk/dsh-streaming-mcp-bridge` | ✅ `dsh-reach` 的 `client/` 半边（`dsh.client.inject`）可参照 |
| **3.9** 阶段收口 | 上游漂移 + 回传 | — | `MicroMilo/upstream-radar`（盯 release + 在一次性 runner 复测已发布产物，输出机器可读兼容矩阵）——升级 SOP / 漂移复核的方法参考 | — |

**社区名录索引（在 `ref/awesome-dsh-plugin.md` 内按分类名检索；"行"为该快照位置）**

| 分类 | 行 | 与哪几步相关 |
|---|---|---|
| `Sessions & Messages` | 1061 | 3.1 / 3.2 |
| `Memory` | 1265 | 3.6 |
| `Tools & Capabilities` | 1417 | 3.1 |
| `WSL & Windows Interop` | 1845 | 3.7 |
| `Notifications & Integrations` | 2576 | 3.3（出境到人） |
| `Development & Runtime` | 2705 | 3.1 / 3.2（脚手架 / testkit / template） |
| `Security & Permissions` | 2962 | 3.3 / 3.5 |
| `Remote & Mobile` | 3073 | 3.8 |

**⭐ 从已落位三件读到的可借鉴事实（含 4 条真坑，2026-09-14 读码所得 🟡；9 / 10 为 2026-09-17 3.1 复跑新增 🟢）**

| # | 事实 | 为什么对我们有用 |
|---|---|---|
| 1 | ⭐ `dsh-reach` 监听 **`approval/request`** 与 **`user-questions/request`** 两个 waterfall，并做成 **"deferred answerer"** —— **答案是稍后（人从 IM 回）才兑现的** | ⇒ **3.3-b 的关键疑点有第三方实证**：审批"出境 → 人答 → 回填"**可在 DSH 插件模型内完成**，不必改 SDK、不必等官方补 `server→client` 请求。我方仍须自己复跑（🟡） |
| 2 | 同件 `src/bridge.ts` / `decision.ts` 出现 **`onRequest`**；配置含 **`cardTimeoutSec`（0 = 永不过期）**；`bridge.dispose()` **结清待决请求** | ⇒ **超时 / 取消 / 卸载**三处语义都有现成参照 —— 对应 3.3-b 的判据，以及 3.3-a 那条"超时 / 断链是同进程替身路径"的诚实边界 |
| 3 | 同件声明 **`inject: []`（零硬依赖）**，每项能力用 `ctx.get(...)` 探测、缺失即降级，并附一张**降级矩阵**（能力 / 依赖服务 / 缺失时行为 / 卸载行为） | ⇒ 可直接抄的设计纪律：**我方插件也应在任意组合下可加载、可完全卸载**（对 `larry` / `sdk` 两个 profile 的差异、以及 3.7 的 overlay 场景都实用）。⚠️ **边界见事实 9** —— 该纪律只管"加载"，不能管"注册时序" |
| 4 | 模板 `dev/cordis.yml` 明写：**开发 overlay 只加载 host 半边**（模块解析到源码文件，**发现不了 `dsh.client` 包级声明**）；要测浏览器半边**必须把包装进 profile** | ⇒ **3.7 / 3.8 的开发回路坑**：用 overlay 跑出"看起来通了"，其实 client 半边从没加载 |
| 5 | 模板 `test/smoke.mjs` 用手写的**最小假 `ctx`**（只实现该插件用到的成员）做单测，断言 `inject` 数组、工具注册、settings 命名空间实时接线 | ⇒ **3.1 / 3.3 的廉价单测范式**：逻辑层不必真起 DSH，把"必须真跑"的部分压到 e2e（`dsh-testkit` / `dsh-test-drive` 同思路）。✅ 3.1 已照此落地（`packages/plugin-tool-readfile/test/smoke.mjs`） |
| 6 | 模板 `cordis.patch.yml` 原话：**"后层按 id 覆盖前层，覆盖整行 config 而非深合并"** | ⇒ 与 3.7「落盘是追加不是覆盖」+ 跨 profile 的 `patchReload` 差异互证：**patch 是行级覆盖语义，不能假设深合并** |
| 7 | `dsh-memory-connect` CHANGELOG 记的两个"**静默不生效**"根因：① **Cordis 惰性构造服务** —— 把类交给 `ctx.provide()` 时构造器从不执行（v0.3.0 注册了服务却从未实例化）② **召回结果写进了一个没人读的字段** | ⇒ **与 3.6 判据"事件确实被消费（不是只注册了监听）"同源** —— 第三方替我们踩过；也说明"注册成功"离"生效"还有两步 |
| 8 | 同件 README：patch 里**没有 `config:` 块时 Cordis 传 `undefined` config**，裸 `dsh plugin add` 会崩 ⇒ `apply()` 必须填默认值（该件 v0.4.0 才修） | ⇒ **我方每个插件都要容忍 `undefined` config**（3.1 / 3.3 / 3.4 / 3.5 / 3.6 全适用），否则"装上即崩"却看起来像环境问题。✅ 3.1 已按此实现并单测覆盖 |
| 9 | 🟢 ⭐ **"零硬依赖 + `ctx.get` 探测降级"不能当"注册前置"**：`inject: []` ⇒ `apply()` 在 **boot 极早期**执行，此刻 `ctx.get('tools')` 为 `undefined`；**照事实 3 直接拿探测结果决定"要不要注册"，工具将永不注册**。3.1 首跑实测正是此形态：`②_toolRegistered=false`，打点只剩 `activate`（连 `register-failed` 都没有 ⇒ 静默不注册，最像"环境问题"的那种失败）。**正解 = 注册一律走 `ctx.inject(['tools'], cb)` 回调；`ctx.get` 只用于打点 / 降级判断** | ⇒ **订正事实 3 的适用边界**：零硬依赖是**加载策略**，不是**注册时序**。3.3 / 3.5 / 3.6 凡"得先有 tools（或别的服务）才能注册"的插件全适用；**且这类失败必须留打点**（`inject-requested` / `inject-fired` / `tool-registered` / `register-failed`），否则证据链断在"什么都没发生"上 |
| 10 | 🟢 ⭐ **`ctx.tools.register()` 的 schema 口径 = 标准 JSON Schema，不是 `defineTool` 的输入 spec**：`dsh-tools/lib/index.js:2773` 的硬校验只要求 `output.{schema,render}`；**属性内 `required: true` 不支持**，须写成**顶层 `required: [...]` 数组**（`assertSupportedJsonSchema` 只收标准子集）。报错原文：`unsupported JSON schema: schema.properties.path.required is not supported on type "string"` | ⇒ 两个结论：① **手搓工具不必 `defineTool` 包装**（⇒ 可做到**零外部 import** —— 插件以 link 挂载时模块从仓库目录解析，**天然取不到 profile 的 `@deepseek-ai/*`**）；② 这类"结构性失败"要配**单测结构防线**（如断言 schema 串里不出现 `"required":true`），否则只在真跑时才炸 |
| 11 | 🟢 ⭐ **`dsh-repro` 的借鉴点（借形态、不借代码）**：① **复现件的构成** = 「版本号 ＋ 原始命令 ＋ **原始错误文本** ＋ 落盘证据」装成**一份可搬运的文件**（它叫 bundle；3.2 照此写成 `<variant>.resume.json`）；② **`src/scrub.ts` 的值级脱敏规则集**（前缀 token ／ 高熵串 ／ env 键命中三类，**fail-closed**）——与本项目 key 卫生纪律同向；③ ⚠️ 它的 `docs/implementation-spec.md` 锚 harness **master `47f9438`**，**行号在 015 实物上不可照抄**：我方只在 015 实物上复核了它最关键的那条契约（`dsh-session-persistence` 的 `create` 撞已存在身份 ⇒ `SessionAlreadyExistsError`，见 `lib/types/index.d.ts:106`），**方向一致但未逐条复核**；④ ⛔ **不可搬它的插件骨架**（它是 cordis 插件 `/repro`，我方要的是 vitest 装置） | ⇒ 3.2 / 3.9 的**复现件与回归包**可直接照这套形态；也再次印证「**spec 锚 master ≠ 015 事实**」这条纪律（与 3.0 的教训同源） |
| 12 | 🟢 ⭐ **session 写租约（B 锁）在 Windows 上的释放语义 = 自述属实（2026-09-17 本机实测）**：载体是 `Local\dsh-session-lock-<sha256(lower(resolve(<会话目录>/session.lock)))>` 的**命名内核信号量**，`CreateSemaphoreW(null,1,1,name)` ＋ `WaitForSingleObject(handle,0)` **零超时**判占用（`WAIT_TIMEOUT` → `EBUSY` → `SessionAlreadyOwnedError`）；**Windows 侧不落任何锁文件**（持有时 `<会话目录>/session.lock` **不存在** —— 实测方式 = 装置内 `existsSync` ＋ 会话目录列举）；`taskkill /F` 持有者后第二个写者立即可取（两次独立复现）；**名字空间**：WB 用 **`OpenSemaphoreW`（只打开、不创建）** 独立实测 —— 真 holder 持有期 `Open(Local\<hash>)` 得句柄且 `wait=258`、**同一时刻** `Open(Global\<hash>)` 得 **0** ⇒ **`Local\` 下有此对象、`Global\` 下无**（⚠️ 用 `CreateSemaphoreW` 探 `Global\` 会**自建对象**而恒得 `wait=0`，**不可作证据**）。⚠️ **边界**：该名以 `Local\` 前缀派生 ⇒ **按登录会话隔离**（README `:158` 自述亦已声明），**跨交互登录会话是否互斥未实测**（本机只有 `console` 一个交互会话）；⛔ 不得外推到 CVM/Linux（那条走 `node-addon-system` 的 `flock(2)`） | ⇒ 「**锁不会成为生产阻塞**」这条判断在 **Windows 同登录会话内跨进程**范围得到实测支撑；也把 **A 锁**（`$DSH_HOME/profiles/node_modules.lock`，**持有者死亡后永不回收**，残留 ⇒ 任何 dsh 命令 2 s 后 `atomic-write: timed out`）与 **B 锁**的**相反语义**钉成对照 —— 排查"启动就失败"时先看 A 锁，不必怀疑 B 锁 |

| 13 | 🟡 ⭐ **`dsh-memory-connect` 的借鉴点（2026-09-30 WB 读 `lib/index.js` 2,236 行所得；借设计、不借代码）** —— 该件是本项目**最富的一张记忆设计参考**，五个可抄的形状：① **schema**：`memories` 表 16 列（`type` CHECK 六值 ／ `status` CHECK 五值 ／ `content_hash` 去重 ／ `parent_memory_id` ／ `valid_from`·`valid_until`·`supersedes` 三时态列 ／ `STRICT` 表）＋ 独立 `memory_fts`（**FTS5 `unicode61`**，`memory_id`/`type`/`session_id`/`created_at` 全 `UNINDEXED` 只做回表）＋ `memory_embeddings`（**float32 BLOB 裸存**）＋ `memory_session_relevance`（会话↔记忆关联）＋ `extraction_state`（**按 `last_extracted_seq` 断点续抽**）② **时态图谱 = 追加而非覆盖**：`reviseMemory()` 把旧行 `status='superseded'` ＋ `valid_until=now`，插新行 `supersedes=oldId`，**并删旧 embedding**（保证召回只见当前真相）；③ **RRF 融合**：`k=60` 常量，FTS 与向量各按 `1/(k+rank)` 计分，FTS 侧再乘 `relevance_score` 衰减权重、语义侧乘 `embeddingWeight`（默认 0.7），**同一 id 累加**，取 top-K；语义相似度下限 `0.35`；④ **优先级三元组**：`relevance×0.5 + recency×0.3 + frequency×0.2`，其中 recency `= max(0, 1-days/90)`（**90 天线性衰减**）、frequency `= min(1, log(access+1)/log(10))`（**对数压缩**）；⑤ **token 预算分级压缩**：`maxContextTokens` 默认 4000，逼近时逐级降级（L1 截断内容 → L2 只留 `[type] N% relevant` → 全不满足则整条丢弃） | ⇒ **3.6 记忆最小闭环**可直接照抄这五处形状；⚠️ **不可参考处**：它是**编码/项目知识库取向**（`type` 里有 `skill`、抽取靠规则＋LLM 双路），**非个人生活知识库**；且其 `recallSync` 同步路径**不做语义召回**（HTTP embedder 无法同步 await）—— 我方若要求"每轮注入含语义召回"，**这里没有现成答案** |
| 14 | 🔴 ⭐⭐ **版本脱节哨兵触发（2026-09-30 WB 实测，老大注 §3.6 要求"发现严重落后须暴露"的直接命中）** —— **暴露方向与预期相反**：不是"我们落后于社区"，而是**社区件锚在更早的小版本、装不进我们的新版**。`dsh-memory-connect@0.6.1` 的 `peerDependencies` 全写 **`^0.1.0-rc.7`**（`dsh-session` / `-session-query` / `-invariants` / `-scope` 四件 ＋ `cordis ^4.0.1`），而我方锁定 **`dsh-v0.1.5-rc.2`** ⇒ `semver.satisfies('0.1.5-rc.2','^0.1.0-rc.7')` **= false**（`semver@7.8.5` 实测）。**根因 = semver 的 prerelease 三元组规则，不是版本真的不兼容**：`0.1.5-rc.2 > 0.1.0-rc.7` 为 **true**，但**带 prerelease 的版本只在同一 `[major,minor,patch]` 三元组内参与区间比较** ⇒ `0.1.5-rc.2` 因三元组不同被排除。**正反对照（同一次实测）**：`0.1.0-rc.9` 对同区间 = **true**（同三元组）、`0.1.0` 正式版 = **true**（无 prerelease 不受限）、三例加上 `includePrerelease:true` 后**全部 = true** ⇒ **纯比较选项差异**。⚠️ 与 `archive:692` 已登记的「`*` 不匹配 prerelease」**同源**（同一 semver 语义），但**覆盖面更大 —— 不止 `*`，所有 peer 区间皆受影响** | ⇒ **三条行动面**：① **凡落位社区件，先跑这条 semver 实测再谈借鉴**（`peer` 区间 × 我方锁定版），**否则"抄了设计却装不上"**；② **我方自己发插件时 peer 区间须避坑**（写 `>=0.1.0-rc.7` 无效、写 `*` 也无效 —— 须让**端点三元组与目标版本一致**，或由宿主开启 `includePrerelease`）；③ **这条不改变事实 13 的借鉴价值**（读设计的成本与装不装得上无关），但**改变了"能否直接跑它"的结论** ⇒ 两项**并列留痕，勿互相覆盖** |

> ⚠️ **本表只登记"可借鉴点"，不构成采纳决定**。凡打算抄进产品的设计，仍走 §3.0：**fork → 本仓库 → review / 测试**。

### 3.7 待办 → TODO（本稿不存放待办）

> **本稿只放判定依据与行事规则；待办一律在 `TODO.md`「DSH 迁移」区**——DSH-2 ~ DSH-6 的任务、待校准实测项、待核包归属、待派发清单。
> - **完成一个阶段归档一个**：DSH-1 事实校准已完成，全文冷存于 `archive/roadmap-history.md`。
> - 第 0 项的判定与证据见 §3.5；三方实测的硬发现见 §3.4「第 0 项实测硬发现」表（不随待办迁出）。
> - **体量口径备注**：后端核心非测试代码存在三个统计口径（Trae 3653 行 / 36 文件、Claude 4442 行、WB 3926 行——差异在根文件与目录统计口径），量级一致（个人级小项目）。

---

> **历史决策过程不再保留于本稿**（C→A 反转、两段式重构、四方意见逐条处理、§2.3 撤回等）：有价值的结论已全部凝结进结论区，过程与教训见 git 历史、`.workbuddy/memory/` 日志与 skill `verify-ai-delivery`（复验与证据纪律）。
