# DSH 迁移方案

> **状态：决策稿（从讨论稿发展而来，经过3轮讨论四方审阅收口，四方一致「同意定稿」，老大 2026-09-08 终审通过）。**
> 用途：说明 LarryAgent 如何迁移到 DeepSeek Harness（dsh）
>
> **老大终审结论（2026-09-08）**：§1.5 基准无问题 / §3.0 维持裁定 / §3.7 计划基本合理（后续按实际推进微调）；**§3.5 已终裁**：第 0 项三方实测（Trae 一等 / Claude 一等 / Qoder 二等）→ WB 判 **二等**，**老大 2026-09-08 确认** → 定 **A-framework（全面贴近核心层，含语言）**，路径分岔关闭。除此之外本稿**已定稿**，不再因讨论而改动。
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

**定性（WB 标注，防证据等级虚高）**：本条是**信念层判断，不是证据**。它不可证伪、不参与任何事实断言的成立与否，只回答一个问题——**为什么是这家公司的底座，而不是别家**。按本稿 §2 铁律与项目「证据纪律」（身份不为证据加权），**去掉本条，本文档所述路径依然成立**——路径由以下五条独立支撑，无一条依赖本条或社区热度：① 老大三条立论（项目小 / 专属能力薄 / 底座进化论）；② **本地代码实证**（§2 各能力包与 8 子项承接，均经锁定版核实）；③ **官方双分发**（npm `@deepseek-ai/dsh` + PyPI SDK/runtime-bin，含 Windows x64 wheel）；④ **MIT 兜底**（最坏可 fork 自维护）；⑤ **边界已核**（AGENTS.md / SAFETY.md 的风险与能力上限均已本地查证）。

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

**已落位（2026-09-14，3 件 / 约 0.9 MB）**

| 目录 | 对应切片 | 为什么值得看 |
|---|---|---|
| `kun2-5code__dsh-plugin-template/` | 3.1 / 3.7 | 插件脚手架（MIT）：`src/index.ts` + `service` / `hook` / `commands` + `client/` UI 半边 + **`dev/cordis.yml` 开发 overlay** + **`test/smoke.mjs`（假 ctx 单测范式）** |
| `PerryLink__dsh-reach/` | 3.3 / 3.8 | 决策卡（approval / user-question）**推送到 IM 并从聊天回答**（Apache-2.0）：`src/bridge.ts` 的 **deferred-answerer waterfall** + `decision.ts` + 7 条 IM 适配器 + 降级矩阵 + `client/` 半边（`dsh.client.inject` 声明） |
| `Asher-2000__dsh-memory-connect/` | 3.6 | 跨会话记忆（MIT）：SQLite FTS5 + 本地 embedding（`scripts/embed_server.py`）+ `systemPrompt.context` 逐轮召回 + 上下文预算测试 |

- **本地社区名录**：`ref/awesome-dsh-plugin.md` = `awesome-dsh-plugin` 英文版快照，**3,386 行 / 27 个分类含分类行号**；按分类定位候选，**不必重新联网**

**⚠️ 落位三件的「可参考 / 不可参考」**（⭐ **派发任务时须逐件照抄进派发稿** —— 老大 2026-09-14 定；四要素定义见 §3.6〈参考实现登记表〉规矩）

| 件 | 许可 | ⛔ 不可参考 | ✅ 可参考 |
|---|---|---|---|
| `kun2-5code__dsh-plugin-template` | MIT | **`src/client/` 14 个文件全是 React**（`import React from 'react'`）—— 本项目前端是 Vue/Tauri，**UI 代码不可照搬**；**`dev/cordis.yml` overlay 只加载 host 半边**，不能拿它判 client 半边可用（§3.6 事实 4） | host 半边 `dsh.bundle.patch` / `dsh.client` 的**包级声明形状**、`service` / `hook` / `commands` 三半边划分；`test/smoke.mjs` 的**假 ctx 单测范式** |
| `PerryLink__dsh-reach` | Apache-2.0 | 摘录 / 改写**须保留 `NOTICE` 与许可声明**（另有 `THIRD_PARTY_NOTICES.md`）；`src/client/ReachSettingsTab.tsx` 是 **React**（同上不可照搬）；`src/adapters/` 是 **IM 平台专有**（Lark / 钉钉 / 飞书 / QQ …）—— 本项目出境面走**自做 A 段协议**，不是 IM；**不可 `dsh plugin add` 直装**（§3.0） | `src/bridge.ts` 的 **deferred-answerer 生命周期**（超时 `cardTimeoutSec` / 结清 `dispose()` / 卸载）；`src/decision.ts` 的审批判定形状；`inject: []` **降级矩阵**写法 |
| `Asher-2000__dsh-memory-connect` | MIT | `scripts/embed_server.py` 走**独立 Python 进程**做 embedding —— 3.6 的路线是 **TS 插件内直接 embedding**（DSH-2.5 ⑤ 已验漂移 `2.2e-7`）⇒ **该脚本不可采用**；其 CHANGELOG 那两个"静默不生效"的**旧写法是反面教材**，不可照抄 | `systemPrompt.context` **逐轮召回**的接线形状；上下文预算测试的构造法 |

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
| 1 | CVM 侧实测（内存 / 并发探针 / 2 h 采样） | 数据取自 012 环境 | DSH-3（003） |
| 2 | Windows 沙箱方言（本地化 / 错误码类别 / 编码） | 同上 | DSH-3（003） |
| 3 | Vue/Tauri → sdk profile 连通（`PROBE-OK-2026`） | 同上 | DSH-3 |
| 4 | 反代可行性（重估触发线 T2） | 本机实测于 012 期 | DSH-5 |
| 5 | `dsh.exe` Windows 崩溃定性（入口 / 安装方式相关） | npm 全局 012 上的反证 | DSH-3 |
| 6 | ⚠️ **CLI 与 profile 必须同代** | CVM 的 `~/.dsh` profile 与 `harness/scripts/cvm-probes/*.sh` **仍指 `0.1.2-rc.1`** ⇒ **混代未验**，未升级前不得用于 015 判据 | **DSH-3.0 强制前置** |

**本稿内待处置（非实测项）**：① :82 的「9,080 文件」出处不明，已统一为可复现的 `git ls-tree -r` 口径（8,854）；② ~~§3.6 总表统计「白给 8 / 自做 23」未随 2.7.2 改判重算~~ ✅ **已于 2026-09-15 按 015 口径重划落地**（🟢 12 / 🟡 15 / 🔴 4，见 §3.6 总表）。

**验证纪律**：任何写进本稿**结论区**的 DSH 事实必须标 🟢 / 🟡 / 🔴；**🔴 不得作为决策依据**，只能列入待验证

---

## 3 路径决策与实施规划

> **拍板来源**：老大三条立论（项目小 / 专属能力薄 / 能力建设维度升级），WB 立论反转 C → A。**事实校准**：基于本地副本 `ref/dsh-bare/` 锁定的 `dsh-v0.1.5-rc.2` 代码与 AGENTS.md（原为 `0.1.2-rc.1`，2026-09-15 挪基线并逐条复核，见 §2.3）。

### 3.0 第三方引入原则（老大拍板硬约束，优先于本节其余结论）

**一句话**：社区 / 第三方插件**一律不直接纳入为运行时依赖**，只作参考源——可读、可 fork、可抄，**不可"装上就用"**。

| 用途 | 是否允许 | 说明 |
|---|---|---|
| 读源码借鉴设计（schema / 检索策略 / 信任模型 / 交互流程）| ✅ 鼓励 | 生态真正的价值是"别人已替我们试错过" |
| fork 后自行改造并纳入 | ✅ 允许 | 代码进本仓库 → 走本项目的 review / 测试 / 命名与产品语义，**维护责任归我们** |
| 临时装进隔离环境跑 prototype 验证思路 | ✅ 允许（临时）| 只用于验证，不进产品依赖；产出以"结论 + 可借鉴点"沉淀回本文档 |
| **直接 `dsh plugin add` 装上并作为产品依赖** | ❌ **禁止** | 无论 star 数、无论是否"企业级维护" |

**立论（老大 2026-09-07）**：现象级爆发的插件生态必然伴随大量跟风项目无人持续维护——今天 14.7k star 的精选列表，两年后相当比例是弃坑件。把关键能力押在外部作者不可控的维护意愿上，风险高于所省下的实现成本。**即使企业级维护的插件也不直接纳入**：fork 后自己改造，或参考其代码自己实现。

**边界**：本原则针对**插件 / 第三方扩展**；DSH **底座本体是框架依赖、不是插件**，本文所述路径依然成立。底座的同等兜底是 **MIT + TS 可 fork 自维护**（见 §3.4 上游集中度行）——即"依赖一个**可接手**的底座，而不是**不可控**的插件"，两者风险性质不同。


### 3.1 一句话结论

**路径强推**——**底座能力开箱获得**（compaction / sandbox / 审批 / trajectory / 多模型 / MCP / ACP；31 子项对照 **🟢 可承接 12 / 🟡 可降级 15 / 🔴 仍须自做 4**，见 §3.6 承接总表），**产品语义层全部自做**（🟡 15 + 🔴 4 = **19 项均由我方写实现**，区别只在「有底座可挂 / 有参考可抄」；🔴 4 项是连设计参照都没有的产品语义核心：记忆可管理 / 用户画像 / 自动路由 / 时间感知；其中长期记忆语义化 / 知识库 / 多端接入 = **借鉴社区设计后自实现**，不直装，见 §3.0 / §3.3）。本文所述路径省的是"造底座"，不是"写代码总量"。

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
| **跨语言切换** | DSH = TypeScript，LarryAgent 后端 = Python FastAPI | 本文所述路径下后端整体改 TS；保留部分 Python 脚本（数据迁移等）。（第 0 项已终裁走 A-framework，Python SDK 路径不再启用，该假设作废。）**【老大裁定】跨语言成本是本项目的「最小成本」，决策时完全可忽略——不得再以"跨语言成本高"为由否决任何路径** |
| **生态繁荣但质量参差**（**前判"生态早期"已推翻**，见 §2 插件生态行）| 3,199 插件 / 25 分类，但 UI·主题类占 640+（大量玩具）；个人作者为主，弃坑风险高 | **只借鉴、不直装（§3.0）**——生态价值定位为**参考实现库**：读源码抄设计、必要时 fork 自改；**不把任何关键能力押在外部作者的维护意愿上**。临时验证只在隔离环境装，不进产品依赖。补充（老大）：3,199 这个数字本身也可能含代理行为与跟风件，**不可作为"有人维护"的证据** |
| **插件版本漂移** | DSH preview 期 API 频繁变动，插件作者跟不上（已有插件标注 "verified against DSH 0.1.0-rc.6"，而锁定版已到 `0.1.5-rc.2`）| 因 §3.0 **不直装**，本风险对**产品运行时不成立**（我们不依赖插件跟上 DSH）；仅影响**参考时效**——借鉴时标注其验证版本，fork 代码须按锁定版 `0.1.5-rc.2` 重验 API。DSH 升级时**不产生插件兼容性回归项** |
| **第三方插件安全** | SAFETY.md 明示：沙箱、审批与权限控制**不能保证隔离**（未接受安全审计）| 第三方插件视为**不可信代码**。**§3.0 后本风险大幅下降**：不直装 = **未经审读的**第三方代码不进运行时（fork 路径下经改造的源码必先审读，措辞前后自洽）；凭据 / 文件 / 网络相关部分按最小权限重写。**缺口（Qoder 二点，采纳）**：不直装 = 失去上游自动补丁通道 → 须补 **upstream 追踪与 CVE 响应流程**（见 §3.7）|
| **会话存储外接**（原 §九 保留项）| `storage/` 是 Non-session storage hub + backends | ✅ **DSH-2.5 ① 已实测（2026-09-10）**：官方 `dsh-storage-sqlite` backend 仅需配置，`path` 可指任意绝对路径（脱离 `.dsh-home`）→ 外接 SQLite **可行**（结论见下方 DSH-2 退出条件）|
| **headless + ACP 契约**（原 §九 保留项）| `acp/` 描述"Automation-only Agent Client Protocol server" | ✅ **DSH-2.5 ② 已实测（2026-09-10）**：`initialize` / `session.new` / `session.list` / `session.close` 均 OK；`fork` / `load` / `delete` = **`-32601` 方法缺失**（对照 `session/resume` = `-32602` 证明非鉴权遮挡）→ 契约面稳定，但**无 fork / replay，不适合前端**（§3.6）|
| **产品承诺渗透性漂移（层间泄漏）**（Marvis，采纳）| 承接 ≠ 承诺不变，底座机制会悄悄改写产品语义：① **2.4.3 硬删 vs session append-only 留痕**（记忆删了但事件日志仍在，与 2.8.2 行为可见冲突）；② **2.9.2 保真度档位**取决于 compaction 默认策略（不满足则自做策略插件）；③ **三处泄底**：术语（harness 词不得出现在用户可见处）/ 交互（审批须默认聚合、低打扰）/ 能力（接了 8 个子项却没兑成体验）| **换底座对用户观感中性偏加分**——DSH 是原材料，净影响由语义层决定；**"套壳"在用户侧不是风险，真风险是没把白给子项兑成体验**。① 挂 2.4.3 验收注记：删 → 回放 → 断言无残留，不可避免则产品层定夺（轨迹脱敏 vs 级联删）；② 泄底三项由语义层收敛，不进必关清单 |

**升级 SOP**（取代原"锁版本不升不降"——该表述与立论③"随 DSH 演进"自相矛盾，第 1 轮 Trae/Qoder/Marvis 三方一致指出）：

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
**代价记账**：① **破坏性清单已落档**（本节 ②）；② **DSH-3 起写码按 `0.1.5-rc.2` API 走**；③ ⚠️ **CLI 与 profile 必须同代** —— CVM 上已装的 `~/.dsh` profile 与 `harness/scripts/cvm-probes/*.sh` 仍指 `0.1.2-rc.1`，**须一并升到 015**（混代未验，见 §2.3 未闭合项 #6）；④ 升级当**独立动作**做（不在阶段内顺手升）。

**⑥ 顺带订正**：`sdk` profile 的 manifest 实为 **`patchReload: startup`**，只有 `larry` 是 `live` —— 而 **B 段恰好走 sdk**，决策稿此前只记了 larry 的 `live`（见 §3.6 环境规格表 sdk 行）。

### 3.5 路径决策

| 路径 | 决策 | 理由 |
|---|---|---|
| **A 换底座** | **✅ 拍板** | 底座能力开箱（31 子项对照 **🟢 12 / 🟡 15 / 🔴 4**，见 §3.6 承接总表）+ 免自造底座 + 演进红利；项目小 + 专属能力薄；能力建设 / 信息流接入层面 A 长期赢；**另加生态红利——但按 §3.0 定性为「设计红利」**：3,199 插件是可查阅的**参考实现库**（省试错与设计：schema / 检索策略 / 时间上下文建模 / 信任模型可直接借鉴），**不是可直装的能力货架**（不省实现、不省维护）|
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
>   - **硬约束（🟢 PyPI 实测 2026-09-15）**：该包最新 **`0.1.5rc1`**，**5 个平台 wheel、仍无 sdist**（`win_amd64` / `manylinux_2_28_x86_64` / `manylinux_2_28_aarch64` / `macosx_14_0_arm64` / **`macosx_14_0_x86_64`**），官方自述「no Windows arm64 wheel is published」。→ **平台覆盖由上游单方决定，且无源码分发可供用户自补**；平台一旦缺位或延后打包，PY 侧直接不可用。A-framework 走 npm + Node，此约束不适用。
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

### 3.6 路径实施规划

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
| **Windows 官方 CLI 崩溃 —— ⚠️ 口径已修正**（Claude + Qoder 独立发现 🟢；Trae 2026-09-09 反证 🟢）| 第 0 项：`dsh.exe --version` / `--dump-config` 在 Windows "稳定 segfault（0xC0000005）"。**DSH-2 反证**：npm 全局安装的 `dsh@0.1.2-rc.1` 在 Windows **实测全部可用**（⚠️ 该实测的**通道是 012**，015 上须复跑，见 §2.3 未闭合项 #5）——`plugin --profile add` / `--dump-config` / `--help` / 完整会话（demo-ptc）均 exit 0 | **不可用"Windows CLI 崩"作铁律**。崩溃与**入口/安装方式**相关：npm 全局 `dsh` 可用；**源码入口（`bin.ts` + tsx）在 PowerShell 下偶发卡住**（Trae 实测改用 npm 全局后全通）。**默认走 npm 全局 `dsh`，不用源码 tsx 入口**；若复现崩溃须记录具体入口与安装方式再定性 |
| **长 turn 无超时保护**（Claude 真实 key 实测 + Qoder 源码确认 🟢）| `request_timeout_seconds` 只覆盖单次 JSON-RPC 往返，turn 等待 `subscription.next()` 无 timeout → 子进程挂起时 SDK **无限等待** | **应用层必须自建 watchdog**（A-framework 下同样需要）|
| **B1 安装期仍需 Node / pnpm**（Qoder 🟢）| 不带 pnpm 安装失败，隔离装 pnpm 10.17.1 后成功 | "无需系统 Node"**只在运行期成立**，安装 / 升级链路不是纯 Python |
| **MCP 只证 Tools**（Qoder 🟢）| Resources / Prompts / 任意 Cordis 内部 service 或 hook **未证**可经 MCP 等价桥接 | 不得外推为"所有能力均可经 MCP 桥接" |
| **Python 侧事件多为 `JsonObject`**（Qoder 🟡）| 无 TS 判别联合类型与同级运行时校验 | 升级时更易**静默接受字段漂移**（走 A-framework 后影响降低，保留作背景）|
| **⚠️ 跨进程 resume 的 id collision 定性未收敛** | Claude 判"可能是 SDK 缺口或姿势问题"（源码 `packages/core/session` 称 cold session 应 resumed on first touch，但 Python SDK `start_session(session_id)` 触发 collision）；Qoder / Trae 判"探针用固定 ID 所致，改 UUID 后成功" | 影响 2.4.1 / 2.8.2 的 fork / resume 承接叙事 → **列为 DSH-3 首验项**（待办见 TODO「DSH-3」）|

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

**风险（修订）**：① preview 期 API 漂移（锁定 `0.1.5-rc.2`，2026-09-15 前为 `0.1.2-rc.1`）；② **鉴权已内置**（token→签名 cookie），但**多用户 / 租户隔离仍须自做**（§3.3：DSH 内核对 cloud / multi-user / tenant 零论述）；③ 浏览器侧 WS 可行（README 明写 browser 在 WS 协议层答 Pong）→ 对移动版 B/S 有利，未实测；④ **L2 反向工具执行仍须自做**（事件流下发指令 + unary 回传结果），此缺口三个官方面都没有。

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
| 1 | **`larry` profile 不是预置的** —— `dsh --profile larry` 报 `profile does not exist`，须自行 `plugin add` 组装 | 🟢 |
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
  - **已知边界（不阻塞 A 案）**：① ~~`patchReload: startup` → 部署期配置变更需重启~~ **⚠️ 已由 DSH-2 实测修正**：第 0 项判的 `startup` 出自 **sdk-app** bundle；我们实际采用的 `larry` profile（`dsh-base` + `dsh-headless`）manifest 为 **`patchReload: live`** 🟢（WB 本地 `cat .dsh-home/profiles/larry/package.json` 核实）。**配置热重载可能可行，不必按"改配置必重启"规划**（⚠️ **仅 `larry`；`sdk` profile 为 `startup` 须重启**，见环境规格表 sdk 行）；② **同会话运行中热切角色（含工具集）未找到公开 API**——当前以「产品树无此承诺」非否决，**属条件性风险：若将来产品树加此承诺，A 案可能不够**，列 DSH-3 首验

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
| profile 名 | `larry`（= `dsh-base` + `dsh-headless`） | 同上。⚠️ **manifest 因 bundle 而异**——`patchReload` / 可用命令等结论**不可跨 profile 外推**（第 0 项的 `startup` 即出自 sdk-app） |
| `DSH_HOME` | `.dsh-home/`（仓库内，已 gitignore——含凭据与会话产物） | 同上 |
| DSH 入口 | **npm 全局 `dsh@0.1.5-rc.2`**（⚠️ **须与 profile 同代** —— CVM 上已装的 `~/.dsh` profile 与 `cvm-probes/*.sh` 仍指 `0.1.2-rc.1`，须一并升；**混代未验**）；不用源码 `bin.ts` + tsx | DSH-2.2 反证（通道 012）：源码入口在 PowerShell 下偶发卡住；同代要求见 §2.3 未闭合项 #6 |
| DSH 源码副本 | `D:\Code\dsh-src`（仓库外，可重建）——**仅在需追进 DSH 内部行为时**使用 | 同上，非日常必需（A 案的价值正是默认不需要它） |
| sdk profile | `.dsh-home/profiles/sdk`（= `dsh-base` + `dsh-sdk-app`，stdio JSON-RPC）；⚠️ manifest **`patchReload: startup`**（与 `larry` 的 `live` **不同**） | DSH-2.3 连通验证用；**B 段走 sdk → 其配置热重载结论不等于 larry**；与 `larry` 是两个 profile，结论不可互推（`patchReload` 差异 2026-09-11 订正，见 §3.4〈基线收口复核〉） |
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
> 判据修订来源：**四份评审意见**（出自 3 个 AI：Claude 测试视角 / Trae 实现视角 / Qoder 反向举证视角）+ WB 筛选与实测复核。**只吸收经复核立得住的**。（原稿 `exchange/dsh-3-plan.md` 的实质内容已全数承接入本稿与 `TODO.md`，该稿随之处置；评审原文可 `git show 3362f57:exchange/dsh-3-plan.md` 追溯。）

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
| S2 | **弃"灌 200+ 轮"**（`contextWindow` 实测 1M，"200+"来源不明）→ 改用**注入大段填充文本、1 轮逼出**；判据加"摘要含可验证 nonce 片段 + 近文原文保留"；开跑前给 **token / 费用上限** |
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

- ⚠️ **3.3-a 的诚实边界**：5 条用例中**「超时」「渠道断裂」是同进程替身路径**（本地答者即同进程调用，无"渠道"可断）⇒ 3.3-a 单独**不得**声称"审批语义验成立"，那两条的真验在 3.3-b。
- ⭐ **设计约束（3.3-a 写码时即须满足）**：答者来源须是**可替换接口**（本地策略 ↔ 远端真人），否则 3.3-b 要重写。

**证据（2026-09-14 读包源码，非二手结论）**—— ② 的真实形状是三层，**不需要 fork 任何包**：

1. **传输层已就绪且公开导出**（`@deepseek-ai/dsh-sdk-protocol`，`lib/index.js` 尾 `export { JsonRpcLineTransport, JsonRpcResponseError }`）：
   - 帧分类：`id`+`method` = 请求 / `id` = 响应 / `method` = 通知
   - **`onRequest(handler)`** —— 公开的**入站请求处理器**安装口
   - `request(method, params, signal)` —— 带 **`AbortSignal` 放弃语义**（原话"aborting removes the pending entry (no state is retained for a response that may never come)"）⇒ **超时 / 取消的原始件已在**
   - **未装 handler 时的行为**：`handleIncomingRequest` 回 **`-32601 method not found`**（**不静默丢弃**）⇒ 天然可观测的 fail-closed 信号，可直接作 3.3-b 的负向对照
2. **客户端封装层挡住了**（`dsh-sdk-client`，我们目前在用的那层）：`HarnessClient.start()` 内部 `new JsonRpcLineTransport(...)` 后**只挂 `onNotification`、无 `onRequest`**（`lib/index.js:405-411`）；包 `exports` 只有 `"."`，`launch.ts` 的 `resolveDshLaunch` / `installedDshBin` **不在导出面** ⇒ 3.3-b 须**绕开这层封装**（自己起子进程 + 自构启动参数）——代价明确、可控。
3. **服务端业务层未接线**（`dsh-sdk-jsonrpc-server`）：`HarnessSdkJsonRpcServer` 构造签名 `(ctx, transport: JsonRpcTransportPeer, options?)` —— **transport 是注入的**，而该接口就有 `request()` ⇒ **发请求的能力在手，只是没有调用点**（`handleRequest` 只认 initialize / prompt / shutdown）。
   - ⚠️ **待查（3.3-b 第一件）**：从"我们自己的 B 段插件"到 transport peer 的通路**目前未见服务暴露**（插件入口 `apply(ctx, config)` 只消费 config，`inject` 未声明服务）⇒ 须确认能否经 `ctx` 取到；取不到则要么另开一条边，要么给上游提需求。

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
| answerer 抛错或超时 | S1 拒绝路径（须 fail-closed） |
| SQLite 路径指回 DSH 默认后端 | S4 ②（反向哨兵） |
| kill SDK 客户端进程 | S0 ④（已写入部分的一致性） |
| 停 ChromaDB 进程 | S4 双写**降级行为**是否定义 |

##### 执行范式与边界（防重复踩）

- **远程长任务范式**：`setsid nohup <cmd> >log 2>&1 </dev/null &` + **完成标记 + `echo $? > rc`**；复入时**先看 rc 再看日志**。
  ⚠️ `production-env.md` §6.3「ssh 后台任务拿不到沙箱放行」**约束的是本地发起侧**（沙箱 / 审批），**不是远程进程生命周期** —— 两通道实测远程进程存活（裸 `&` 5/5、`setsid nohup` 6/6）。
- **姿势自证**：每个验收脚本头部加一行 —— 本脚本模拟的是哪条真实链路（哪个执行器 / 哪层前导 / 哪个 home+profile）。DSH-2.5 ③ 教训：**判据姿势不对会同时造出假绿与假红**。
- ⚠️ **"前后对照"实验须在单租户窗口内做**：CVM 上曾观测到第三方活跃会话（`who` 见 `pts/0`），且 `~/.dsh/profiles` 的 mtime 与自己的动作**同秒**变动；但**对照实验打回**（取 mtime → 跑 `--help` → 再取 mtime，前后完全一致）⇒ 只能记"**观测到、未归因**"。⇒ 凡"取状态 → 跑命令 → 再取状态"类归因，**必须先确认窗口内无第三方活动**，否则证据自动降级。（这条比"2G 内存"更硬地支持 3.0 采数窗口**冻结其他活动**。）
- **各执行人各自做一次通道核查**、各自出《我方执行说明》（三种工具形态的坑不同，**谁也不能替谁许愿**）。
- ⚠️ **ABI 边界**：CVM = **4** / WSL = **7** ⇒ **landlock 判定不可互搬**（实测：ABI 5+ 的掩码喂 ABI 4 内核 ⇒ `create_ruleset` 直接 `EINVAL`）。
- ⚠️ **CVM 产出不得是唯一副本**（机器 2026-10-09 到期）⇒ 由 3.9 的回传核对表兜住（含 `~/larry-data/larry.db`，该机独有的证据原件）。

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
> **口径（2026-09-15 按 015 重划）**：🟢 **可承接** 12 / 🟡 **可降级** 15 / 🔴 **仍须自做** 4。判据与逐条依据见 `../exchange/dsh-015-capability-mapping.md`（31 子项 × 上游 53 篇子系统规格）。
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

**「迁移必关清单」**：当前**无条目**。上游唯一已识别的「须显式关掉」项是 `web_fetch` 默认放行（不受 sandbox / approval 管辖、无 per-call 确认），但该项**已随 §4.1 挂起**（老大 2026-09-15：具体 tool 不在产品定位层判定）⇒ 清单待重启该议题时建立。

#### 待实测清单（档位不依赖，但影响**承接收益兑现**与**风险条力度**）

> **结论：本次重划无档位阻塞。** 12 / 15 / 4 的依据全部是「上游契约 / 源码事实」（见 §2.3 复核 + `../exchange/dsh-015-capability-mapping.md` §2）。下列**5 项**未验项只影响两件事：某行的**承接收益能否真兑现**、某条**风险条的力度**。**未测之前不得据此升格或改档**。

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
| **3.1** S0 基础链路（首个产品插件） | 工具插件的**最小注册面** + e2e | `dsh-sdk-protocol` / `dsh-sdk-client` / `dsh-sdk-jsonrpc-server` / `dsh-sdk-app`（sdk 面四件）；`packages/fs/tool-fs`（工具注册范式）；`dsh-sdk-minimal`（最小组合） | ⭐ `kun2-5code/dsh-plugin-template`；`omdsh-dev/plugin-template`（官方 turtle-ui 派生）；`iiwish/dsh-testkit`（Docker 隔离的真宿主生命周期测试）、`PerryLink/dsh-test-drive`（一次性 profile 冒烟） | ✅ 模板已落位 |
| **3.2** resume id collision | 复现与定性 | `packages/core/session`；`dsh-session-persistence-sqlite` / `-jsonl`、`dsh-session-query-sqlite` | `EvilIrving/dsh-repro`（导出**最小可复放的问题包**，含会话日志 / 失败命令）——复现件的形态参考 | — |
| **3.3** S1 审批（三段） | 答者接口 + 出境往返 + fail-closed | `dsh-user-approval`（机制）/ `dsh-permission-presets`（预设答者）/ `dsh-client-ui-approval` / `dsh-client-ui-permission-presets` / `dsh-headless`；出境面 `dsh-api-remotes` / `dsh-client-connection` | ⭐⭐ **最富的一类（50+ 件）**：**答者链** `PerryLink/dsh-auto-review`、`Letter2025/dsh-approval-llm`、`simon300000/dsh-auto`、`ilharp/dsh-tool-approval`、`SeverusZh/dsh-yolo-mode`（fail-closed 兜底）；**出境到人** `PerryLink/dsh-reach`、`moyu-good/dsh-lark-bridge`、`452926826/dsh-feishu-bot`；**规则引擎** `940842546/dsh-permissions`、`PerryLink/dsh-permission-rules` | ✅ `dsh-reach` 已落位 |
| **3.4** S2 compaction | 换 Provider + 保原文 | `dsh-compaction`（契约）/ `dsh-compaction-basic`（默认 Provider）/ `dsh-compaction-tool-result-pruner` | `aerince/dsh-active-context-pruning`（**经官方 compaction API** 做模型自定剪枝）、`giter00/dsh-headroom`（压 tool 输出、保原文） | — |
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

**⭐ 从已落位三件读到的可借鉴事实（含 4 条真坑，2026-09-14 读码所得 🟡）**

| # | 事实 | 为什么对我们有用 |
|---|---|---|
| 1 | ⭐ `dsh-reach` 监听 **`approval/request`** 与 **`user-questions/request`** 两个 waterfall，并做成 **"deferred answerer"** —— **答案是稍后（人从 IM 回）才兑现的** | ⇒ **3.3-b 的关键疑点有第三方实证**：审批"出境 → 人答 → 回填"**可在 DSH 插件模型内完成**，不必改 SDK、不必等官方补 `server→client` 请求。我方仍须自己复跑（🟡） |
| 2 | 同件 `src/bridge.ts` / `decision.ts` 出现 **`onRequest`**；配置含 **`cardTimeoutSec`（0 = 永不过期）**；`bridge.dispose()` **结清待决请求** | ⇒ **超时 / 取消 / 卸载**三处语义都有现成参照 —— 对应 3.3-b 的判据，以及 3.3-a 那条"超时 / 断链是同进程替身路径"的诚实边界 |
| 3 | 同件声明 **`inject: []`（零硬依赖）**，每项能力用 `ctx.get(...)` 探测、缺失即降级，并附一张**降级矩阵**（能力 / 依赖服务 / 缺失时行为 / 卸载行为） | ⇒ 可直接抄的设计纪律：**我方插件也应在任意组合下可加载、可完全卸载**（对 `larry` / `sdk` 两个 profile 的差异、以及 3.7 的 overlay 场景都实用） |
| 4 | 模板 `dev/cordis.yml` 明写：**开发 overlay 只加载 host 半边**（模块解析到源码文件，**发现不了 `dsh.client` 包级声明**）；要测浏览器半边**必须把包装进 profile** | ⇒ **3.7 / 3.8 的开发回路坑**：用 overlay 跑出"看起来通了"，其实 client 半边从没加载 |
| 5 | 模板 `test/smoke.mjs` 用手写的**最小假 `ctx`**（只实现该插件用到的成员）做单测，断言 `inject` 数组、工具注册、settings 命名空间实时接线 | ⇒ **3.1 / 3.3 的廉价单测范式**：逻辑层不必真起 DSH，把"必须真跑"的部分压到 e2e（`dsh-testkit` / `dsh-test-drive` 同思路） |
| 6 | 模板 `cordis.patch.yml` 原话：**"后层按 id 覆盖前层，覆盖整行 config 而非深合并"** | ⇒ 与 3.7「落盘是追加不是覆盖」+ 跨 profile 的 `patchReload` 差异互证：**patch 是行级覆盖语义，不能假设深合并** |
| 7 | `dsh-memory-connect` CHANGELOG 记的两个"**静默不生效**"根因：① **Cordis 惰性构造服务** —— 把类交给 `ctx.provide()` 时构造器从不执行（v0.3.0 注册了服务却从未实例化）② **召回结果写进了一个没人读的字段** | ⇒ **与 3.6 判据"事件确实被消费（不是只注册了监听）"同源** —— 第三方替我们踩过；也说明"注册成功"离"生效"还有两步 |
| 8 | 同件 README：patch 里**没有 `config:` 块时 Cordis 传 `undefined` config**，裸 `dsh plugin add` 会崩 ⇒ `apply()` 必须填默认值（该件 v0.4.0 才修） | ⇒ **我方每个插件都要容忍 `undefined` config**（3.1 / 3.3 / 3.4 / 3.5 / 3.6 全适用），否则"装上即崩"却看起来像环境问题 |

> ⚠️ **本表只登记"可借鉴点"，不构成采纳决定**。凡打算抄进产品的设计，仍走 §3.0：**fork → 本仓库 → review / 测试**。

### 3.7 待办 → TODO（本稿不存放待办）

> **本稿只放判定依据与行事规则；待办一律在 `TODO.md`「DSH 迁移」区**——DSH-2 ~ DSH-6 的任务、待校准实测项、待核包归属、待派发清单。
> - **完成一个阶段归档一个**：DSH-1 事实校准已完成，全文冷存于 `archive/roadmap-history.md`。
> - 第 0 项的判定与证据见 §3.5；三方实测的硬发现见 §3.4「第 0 项实测硬发现」表（不随待办迁出）。
> - **体量口径备注**：后端核心非测试代码存在三个统计口径（Trae 3653 行 / 36 文件、Claude 4442 行、WB 3926 行——差异在根文件与目录统计口径），量级一致（个人级小项目）。

---

> **历史决策过程不再保留于本稿**（C→A 反转、两段式重构、四方意见逐条处理、§2.3 撤回等）：有价值的结论已全部凝结进结论区，过程与教训见 git 历史与 `.workbuddy/memory/`（「证据纪律」§十一）。
