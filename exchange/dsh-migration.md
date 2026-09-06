# DSH 迁移讨论稿

> **状态：决策稿，A 路径已拍板。**
> 用途：把「LarryAgent 是否迁移到 DeepSeek Harness（dsh）」的严肃讨论固化下来，避免再次散落在对话里失考。
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

> 来源：WebFetch 直接查 GitHub（`deepseek-ai/deepseek-harness` master 分支 + packages/ + AGENTS.md）。star / fork 各源口径差异较大，不录。

| 维度 | 事实 |
|---|---|
| **是什么** | DeepSeek 官方开源 **Agent Harness（智能体运行框架）**。官方公式 `Agent = Model + Harness` |
| **不是什么** | **不是大模型、不是推理引擎**（≠ vLLM / SGLang）。模型负责推理，Harness 负责对接环境、工具闭环、任务调度、权限管控、会话追踪 |
| **定位** | **架构通用、开箱偏编码**。内核无特权、连 Agent Loop 都可换 → 理论可做通用 Agent；但内置工具（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`）与四模式**均围绕编码场景**设计 |
| **官方口径** | 多数解读称"AI **编程** Agent Harness"；亦有解读明确「**不是单一编码助手**，而是可组装的智能体基础设施」——**并不矛盾**：架构通用 ≠ 开箱通用 |
| **口号** | Everything is a Plugin（万物皆插件）|
| **内核** | **Cordis** 插件总线（Koishi 生态插件内核）|
| **主语言** | **TypeScript**（Monorepo，`packages/` 下 **54 个包**，按 11 个能力族分组）|
| **许可证** | MIT |
| **当前版本** | `0.1.3-alpha.1`（仍是 pre-release；版本号从 `0.1.0-rc.7` → `0.1.3-alpha.1` 倒退，未到 GA）|
| **官方状态** | alpha + `SAFETY.md` 「experimental safety notice」——明示实验性 |
| **运行形态** | 本地 `host/`（API gateway + HTTP 路由）+ 本地 `client/`（Web-GUI 浏览器端）+ `acp/`（外部协议）+ `sdk/`（JSON-RPC SDK）|
| **能力分布** | `compaction/` `sandbox/` `interaction/` `session/` `llm/` `web/` `mcp/` 等均独立包；`identity/` = **共享匿名身份**；AGENTS.md **零论述** cloud / multi-user / 租户 |

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

---

## 3 A 路径决策与实施规划

> **拍板来源**：老大三条立论（项目小 / 专属能力薄 / 能力建设维度升级），WB 立论反转 C → A。**事实校准**：基于 WebFetch DSH 主仓的 54 个 packages 与 AGENTS.md。

### 3.1 一句话结论

**A 路径强推**——接入 DSH 后能力 100%（沙箱 / compaction / 审批 / trajectory / 多模型 / 搜索 / MCP / ACP 全部自动获得）。DSH 方向与 LarryAgent 不完全对齐 + 4 项产品差异化能力（用户画像 / 知识库 / 单人形态 / 云端）需自做；版本号倒退（rc → alpha）是未到 GA 的警示。

### 3.2 DSH 真能替的（54 包代码层确认）

| DSH 包 | 实质 | LarryAgent 现状 | 接入收益 |
|---|---|---|---|
| `compaction/` | 上下文压缩（Service Definition + provider）| 🚧 `max_input_tokens` 截断（**机制反向**）| 升 ✅（直接受益 2.9.2 / 7.2）|
| `sandbox/` | 进程隔离（bwrap/Landlock/Seatbelt）| 🚧 IP/目录/SSRF（**无分级无审批**）| 升 ✅（直接受益 2.7.1）|
| `interaction/` + `credentials/` | approval/permission/ask-user + 凭据授权流 | ❌ 无 | 新增 ✅ |
| `session/` + `session-query/` | 持久化 + SQLite FTS | 🚧 ToolCallCard（仅工具名+结果）| 升 ✅（直接受益 2.8.2）|
| `llm/` | provider 适配器 | ✅ 配置切换（薄薄一层）| 升 ✅ |
| `web/` | 搜索/抓取 providers | ✅ Brave 单边 | 替换 ✅ |
| `mcp/` | MCP 协议 | ❌ 无（TODO 🗣️）| 新增 ✅（直接受益 2.5.3）|
| `acp/` + `sdk/` | Agent Client Protocol + JSON-RPC SDK | ❌ 无 | 新增 ✅（B/D 路径抓手）|
| `mcp/` + `subagent/` + `workflow/` + `jobs/` | 多客户端 / 子代理 / 工作流 / 后台任务 | ❌ 无 | 新增 ✅ |
| `preset/` | per-session agent 组合（cordis.yml）| 部分（config 下发）| 角色机制迁移底座 |
| `feedback/` | 人类反馈捕获 | ❌ 无 | 新增 ✅ |

### 3.3 DSH 一概替不了的（产品差异化，A/C 都要自做）

| 能力 | DSH 现状（事实层） | 实质 |
|---|---|---|
| **用户画像** | `identity/` 是「**共享匿名身份**」——无个人维度 | DSH 默认匿名 → 没有用户画像概念 |
| **知识库** | `web/` 是搜索/抓取，无 BM25/FTS+向量混合检索 | DSH 没有知识库 |
| **单人形态** | AGENTS.md **零论述** personal / private assistant | DSH 没有"私人助理"概念 |
| **云端部署** | AGENTS.md **零论述** cloud / multi-user / 租户；只有本地 `host/` + 本地 `client/` | DSH 没有云端形态 |
| **每会话文件沙盒**（HUMAN 待办 1.3）| `sandbox/` 是权限沙箱 ≠ 每会话文件沙盒 | 不是 DSH 给的语义 |
| **回收站** | `session/` fork/resume ≠ 回收站（不同语义）| 不是 DSH 给的语义 |
| **长期记忆语义化** | `session/` 是原始事件流水，非 LLM 摘要 + 向量召回 | 不替代 LarryAgent 的 memories 双写 |

> **核心判断**：这 7 项 A / C 都要自做，**与 DSH 接入无关**——属于产品差异化能力，不论走哪条路径都要解决。

### 3.4 DSH 自身风险（事实校准后）

| 风险 | 事实 | 应对 |
|---|---|---|
| **版本号倒退（警示）** | `0.1.0-rc.7` → `0.1.3-alpha.1`（从 rc 倒退到 alpha，未到 GA）| **锁版本到 0.1.3-alpha.1 tag**，按需升级；破坏性变更按事件触发 |
| **项目长期可持续** | 15,210 commits / 仍在合并 PR / DeepSeek = 行业第一梯队；`SAFETY.md` 仍标"experimental" | 有积极信号但未到稳定预期；定期跟踪版本 |
| **方向不对齐** | DSH 全栈编码向（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`），LarryAgent 单人私人助理 | 长期需自做产品差异化（7 项见 §3.3）|
| **跨语言切换** | DSH = TypeScript，LarryAgent 后端 = Python FastAPI | A 路径下后端整体改 TS；保留部分 Python 脚本（数据迁移等）|
| **生态早期** | 插件市场 / 第三方文档完整度均处于早期 | 优先用 `core/` `mcp/` 等核心包，少依赖第三方插件 |
| **会话存储外接**（原 §九 保留项）| `storage/` 是 Non-session storage hub + backends，但具体能否外挂 SQLite 未确认 | 阶段 2 环境准备时实测 |
| **headless + ACP 契约**（原 §九 保留项）| `acp/` 描述"Automation-only Agent Client Protocol server"，契约稳定性需实测 | 阶段 2 环境准备时实测 |

### 3.5 路径决策

| 路径 | 决策 | 理由 |
|---|---|---|
| **A 换底座** | **✅ 拍板** | 接入后能力 100%；项目小 + 专属能力薄；能力建设 / 信息流接入层面 A 长期赢 |
| B 嵌一层 | ❌ 不推荐 | 与 A 重叠大半收益，但跨语言通信 + 双套状态同步复杂度高一档 |
| C 借思路 | ⚠️ 备选（**仅适用**等 DSH GA / 不绑 preview 风险）| prototype 可短期升级三个 🚧，但与 DSH 演进的 drift 成本长期无法消除 |
| D 接能力 | ❌ 不推荐 | A 已满足当前诉求；D 仅在"想要 DSH 独家能力"时启用 |

### 3.6 A 路径实施规划

**总思路**：LarryAgent 后端从 Python 切换到 TypeScript + DSH 框架。**意味着**：现有后端核心非测试代码翻译为 DSH 插件/服务形式。**保留**：SQLite schema、SQLite 双写（作为 DSH 插件挂载）、业务核心逻辑（角色 config、工具实现）。

#### 阶段 1：事实校准 — 部分已完成

- ✅ DSH 主仓 packages/ 盘点（**54 个包**）
- ✅ AGENTS.md 阅读（capability seam / session JSONL / LLM provider / 安全性声明）
- ⏳ README 阅读（preview/GA 措辞原文）
- ⏳ 跟版本到 `0.1.3-alpha.1` tag

**退出条件**：4 项任务全部完成。

#### 阶段 2：代码克隆 + 环境准备

- **任务**：clone DSH 主仓到 `exchange/dsh-source/`（**不入 git**、跟 `0.1.3-alpha.1` tag）
- **任务**：搭建 TypeScript 后端骨架（pnpm + tsconfig + 基础插件）
- **任务**：跑通官方 demo（确认环境）
- **任务**：实测 `storage/` 能否外挂 SQLite、`acp/` 契约稳定性（原 §九 独有项）

**退出条件**：能本地启动 DSH basic session + hello world；上述两项实测结果明确。

#### 阶段 3：核心能力 prototype

- **任务**：把 `compaction/` 接入（替代 `max_input_tokens` 截断）— 直接受益 2.9.2
- **任务**：把 `sandbox/` 接入（替代 IP/目录/SSRF 单一拦截）— 直接受益 2.7.1
- **任务**：把 `interaction/` 接入（新增高危工具审批流）— 直接受益 2.7.1
- **任务**：把 `session/` 接入（升级 trajectory）— 直接受益 2.8.2

**退出条件**：四个核心包接入后端可跑通、新功能可达。

#### 阶段 4：差异化能力迁移

| 任务 | 原 Python 模块 | DSH 实现路径 |
|---|---|---|
| 长期记忆双写 | `memory/archiver.py` 223 行 + `engine.py` 107 行 | 自做插件挂载 `session/` 事件流；保留 SQLite+ChromaDB |
| 角色机制 | `config.yaml` + 5 角色 system_prompt | 用 `preset/` per-session agent 组合 + `cordis.yml` 配置 |
| 工具生态 | `tools/` 844 行（shell/file_ops/web_search）| 翻译为 DSH 工具插件；`web/` 替换自实现 Brave |
| 用户画像 | 📐（TODO 长期项）| 自做插件挂载 `identity/`；当前 DSH 匿名身份需扩展 |
| 知识库 | 📐（2.6 零承接）| 自做插件；BM25/FTS+向量混合检索 |
| 回收站 / 每会话文件沙盒 | 🚧（1.3 / 2.3.1）| 自做插件；DSH `sandbox/` 语义不同需自定义 |

**退出条件**：现有 LarryAgent 能力在 DSH 框架下全部跑通（功能等价 / 不丢失 P4 已通过项）。

#### 阶段 5：形态适配

- **任务**：本地 `host/` → 上云 server（原 2.10.1 云端部署 📐）
- **任务**：客户端 Tauri 适配（保留 PC 端 C/S 架构 + 本地 file_ops / shell 能力下沉）
- **任务**：移动端 B/S 适配（原 2.10.2 端侧能力 📐）

**退出条件**：云端部署可用、移动端可访问。

#### 阶段 6：测试 + 验收

- **任务**：现有 P4 测试矩阵重跑（现有 Python 测试翻译为 TS 测试）
- **任务**：新能力测试（DSH 包接入的边界 / 异常 / 性能）
- **任务**：WB 复验 + 老大最终验收

#### 风险与退出条件

- 阶段 3 prototype 任一核心包**卡死** → 评估是否回退到 C 路径（保护已有投入）
- 阶段 4 任一项差异化能力卡死 → **单独延后，不阻塞主线**（DSH 框架先落地，差异化能力分批做）
- DSH 发布破坏性变更 → **锁版本（0.1.3-alpha.1 tag）不升不降**；只有新能力明确收益时才升级
- 方向不对齐长期化 → §3.3 的 7 项差异化能力同步排进 P 队列

### 3.7 待办

**待老大拍板**：
- [ ] **克隆 DSH 代码方案**：独立目录（`exchange/dsh-source/`，不入 git）vs submodule vs 其他
- [ ] **阶段 3 prototype 派发**：Trae / Claude 分工与节奏
- [ ] **阶段 4 差异化能力优先级**：哪些先做、哪些等

**待校准（阶段 1 / 2 内完成）**：
- [ ] DSH README 原文（preview/GA 措辞）
- [ ] `storage/` 外接 SQLite 可行性实测
- [ ] `acp/` 契约稳定性实测

**待执行（启动信号是本节）**：
- [ ] clone DSH → `exchange/dsh-source/` （不入 git，跟 `0.1.3-alpha.1` tag）
- [ ] 跑通官方 demo（确认环境）
- [ ] 阶段 1 剩余两项（README + tag 锁定）完成

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
| 2026-09-07 | **两段式重构**：按 `../docs/product-positioning.md` 同款两段式重组——结论区（§1/§2/§3，WB 维护）+ 变更记录（§4）+ 附：决策追溯记录（§5，提议 / 处理 / 备注 三列表格）| WB |

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
| 讨论区是否留口给其他 AI | 暂不留 | 按老大"凑热闹"裁定，Marvis / QoderWork 意见默认不入；后续若老大指定其他 AI 实质评估再单独建表 |

> **讨论区现状**：本稿两段式按 product-positioning.md 标准建；讨论区目前只有 WB 整理的两张记录（§5.1 / §5.2）。**Trae / Claude 可针对 §1–§3 结论区表态「同意 / 有异议」**，有异议在各自区块下补充（按 product-positioning.md 同款格式）。

# 讨论区

## Trae

**第 1 轮表态（2026-09-07，实现方视角，含独立事实核查）**

**总评：不反对 A 路径，老大三条立论在工程层面成立**——我独立核实：① 后端非测试代码 36 文件 / 3653 行（tools 709 / models 769 / db 577 / api 400 / services 296 / memory 284 / rag 228），"项目小"属实；② ✅ 子项确实多为薄封装（角色 = config + prompt、多模型 = provider 薄适配），"专属能力薄"属实；③ DSH 主仓真实且工程质量信号强（per-file 100% 覆盖门禁、snapshot 回放测试、Session JSONL 代际迁移链、`SCHEMA_VERSION` 单调），"底座代表业界方向"属实。

但结论区有 **3 处口径会误导排期、1 处内在矛盾**，作为实际执行人必须在开工前砸实：

### 一、"接入后能力 100%"是口径错误（§3.1）

§3.3 自己列了 7 项 DSH 替不了的能力，其中包含我们的**产品主线**：长期记忆语义化（2.2 双写 + 人审 + 召回）、用户画像（2.5）、知识库（2.6）、回收站（1.1）、每会话沙盒（1.3）。DSH 给的是**基础设施层**（compaction / sandbox / session / mcp / 审批 / trajectory），对应能力树的 7.2 / 5.1 / 6.2 / 3.3 等**底座项**；域二记忆与知识的全部语义层 100% 自做——而这些恰是我们已趟过坑的部分（降级守卫、ChromaDB 开关、维度校验、人审确认）。

真实表述应为：**"底座能力开箱获得，产品语义层全部自做"**。A 路径省的是"造底座"，不是"写代码总量"——阶段 4 的自做插件（记忆挂载 session 事件流、角色 preset、回收站、API 兼容层、前端对接）工作量不低于翻译现有 Python。建议 §3.1 标题句改写，避免阶段 4 排期时出现"不是说 100% 吗"的预期落差。

### 二、sandbox 收益在我们最需要的形态上不成立（§3.2 第 1 行，需阶段 2 实测）

我查了 DSH 主仓包布局与架构文档：强隔离 provider 是 **bwrap / Landlock（`native/node-addon-landlock-run`，Linux 专用）/ Seatbelt（macOS）/ E2B（`e2b/` 包，云沙箱 POC）**；Windows 侧只有 `shell/` 的 **pwsh provider** + `subprocess/` 的 Win32 库——**能跑命令 ≠ 有进程隔离**；CI 的 Windows 检查靠 wine（`check:windows-wine`，仅诊断已知 Windows 故障），说明 Windows 非一等平台。

对照我们的形态：
- 云端 Linux server：sandbox 可用，但 5.5 硬前置③**上云初期禁用 shell/file_ops**——沙箱收益初期用不上；
- **8.2 端侧执行器跑在老大的 Windows PC 上，恰是 shell/file_ops 主战场，却恰恰没有强隔离 provider**。

结论：阶段 3"sandbox/ 接入升 ✅（受益 5.1）"只在 Linux 侧成立；Windows 端要么自做隔离 provider（AppContainer / Job Object，工作量未知），要么端侧沿用我们现有目录 + 黑名单护栏（**不升 ✅**）。**必须列为阶段 2 实测项**，这是 8.2 的成败前提。

### 三、TS 本地 embedding 可行，但不可"平移"（§3.6 阶段 4 记忆迁移）

`Xenova/bge-small-zh-v1.5` 在 Node 经 `@huggingface/transformers`（ONNX，512 维）可本地跑、无需 Python，方案成立。但 Python sentence-transformers（PyTorch/FP32）与 Transformers.js（ONNX/q8 量化）产出的向量**不保证逐维一致**（量化误差 + pooling/normalize 实现差异）。后果：**现有 ChromaDB 向量不能假设跨运行时可比，迁移时必须全量重嵌**（当前记忆条数极少，成本低，2.4 本就有 embedding 迁移脚本计划）。另：DSH 自带 `python/` SDK + bundled runtime wheel，是"embedding 留 Python sidecar"的备选，但会在端侧引入 Python 运行时依赖、与干净分发相悖，不推荐首选。请把"TS 重写 embedding + 迁移全量重嵌 + 同文本向量漂移比对"写成阶段 4 的显式任务，别按"双写原样平移"排期。

附带：历史会话（messages 表）与 DSH session（JSONL 事件流，仅支持其自身代际迁移）不同构，**历史会话不进 DSH session 格式**（只读留存或做一次性转换脚本），也需写明。

### 四、"锁版本不升不降"与立论③自相矛盾（§3.4 / §3.6）

立论③的收益是"随 DSH 演进、避免闭门造车"；但 AGENTS.md 原文 **"Public APIs are pre-stable; update every consumer"** + SAFETY.md experimental——锁在 `0.1.3-alpha.1` 意味着：演进红利冻结（立论③收益归零）、安全修复也冻结（alpha bug 自己背），且阶段 4 后首次升级的成本可能接近二次迁移。不反对锁定，但请把它改成**显式升级策略**（如：跟随 release tag、每个 minor 评估一次、破坏性变更按事件触发），并明确"锁定期 A 的理由只剩开箱底座"。

### 五、前端路线请提前到阶段 2 定死

DSH 发布 5 个 profile（web / headless / sdk / sdk-minimal / acp），架构上允许只接 JSON-RPC（sdk）或 ACP、**不采用其 Web-GUI**。建议明确：**保留 Vue/Tauri 客户端，走 sdk/acp profile 对接，不用 dsh web client**——我们刚完成两轮 UI 调整，且 Tauri 壳是 8.2 端侧执行器的宿主，换 web client 等于废掉 client/ 全部工作并丢掉端侧能力载体。阶段 2 退出条件应加"Vue client → dsh sdk profile 跑通 hello world"，否则阶段 3 四个包接得再好也没有交付通道。

另：阶段 4 用 `web/` 替换自实现 Brave 时，注意保留我们的首版范围边界——DSH web/ 自带 fetch provider，须配置关闭正文抓取（SSRF / 清洗成本是我们刻意规避的，见 3.2 范围边界）。

### 六、积极面（避免显得为反对而反对）

- `SessionPersistence` 接口（create/open/stat/list/export）证明存储后端可插拔——§3.4"storage 外接 SQLite 未确认"风险降级为"实现接口"，不是"不知道能不能"。
- `webhook/` 包（认证 webhook ingress → 创建 Workspace Session）意外是 **1.5 主动触达**外部触发的现成抓手，阶段 4 可顺带评估。
- compaction / session 事件流 / mcp 直接兑现能力树 7.2 / 6.2 / 3.3 三个最痛缺口，与 product-positioning 第 3 轮行业对齐结论一致。

### 七、阶段 2 退出条件建议从 2 项扩为 5 项

现有（storage 外接 SQLite、acp 契约）+ ③ **Windows 端 `ctx.sandbox` provider 可用性**（8.2 前提）+ ④ **Vue/Tauri → sdk profile 连通**（交付通道前提）+ ⑤ **TS 跑通 bge-small-zh 并与 Python 侧同文本向量比对**（重嵌策略依据）。③④ 任一不过，阶段 3 收益表需重估，C 路径回退不是保守而是必须。

另：§3.2/§3.6 引用的能力树编号是旧的（2.9.2 / 2.7.1 / 2.8.2 / 2.5.3 / 2.10.1），定稿前对齐 31 子项编号（7.2 / 5.1 / 6.2 / 3.3 / 8.1 / 8.2），否则能力树作为评估基准的可追溯性断了。

**事实核查来源**：DSH 主仓 AGENTS.md / architecture.md（包布局、profile、capability seam、SessionPersistence、pre-stable 声明）https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md ；Transformers.js v4 与 `Xenova/bge-small-zh-v1.5` Node 本地推理（512 维）https://github.com/huggingface/transformers.js/releases/tag/4.0.0 、https://juejin.cn/post/7644790860719276059 ；代码体量为本地实测。

## Claude

**第 1 轮表态（2026-09-07，测试方视角，含本地实测 + 独立检索）**

**总评：不反对 A 路径**，老大三条立论（项目小 / 专属能力薄 / 能力建设维度升级）我以本地实测确认前两条成立；但结论区对**测试资产的迁移**严重低估（阶段 6 只写一句"现有 Python 测试翻译为 TS 测试"），且我要纠正 Trae 第七点的一处编号误判。

### 零、先纠一处编号误判（Trae 第七点，重要，防止改错）

Trae 说"§3.2/§3.6 引用的能力树编号是旧的（2.9.2/2.7.1/…），定稿前对齐 31 子项编号（7.2/5.1/6.2/3.3/8.1/8.2）"——**方向反了**。`docs/product-positioning.md` 已于 2026-09-06 定稿并改为**全局十进制多级编号**（章 1-5 / 节 2.1-2.10 / 子项 2.3.1-2.10.3，见其变更记录最后一条）。因此：

- **dsh 正文的 2.9.2（超长会话）/ 2.7.1（行为安全）/ 2.8.2（AI 行为可见）/ 2.5.3（扩展性）/ 2.10.1-2.10.2（形态）是正确的新编号**，与产品树一致 ✅
- Trae 建议对齐的 **7.2 / 5.1 / 6.2 / 3.3 / 8.1 / 8.2 恰是重构前的旧"域.子项"编号**——照此修改会把正确的引用改回旧的

结论：dsh §3.2/§3.6 的编号引用**无需改**（我逐一比对过产品树标题）。Trae 的其余六点不因此受影响。

### 一、测试资产体量被低估（本地实测，供阶段 6 排期）

| 资产 | 行数 | 文件数 |
|---|---|---|
| 后端核心（非测试） | **4442** | — |
| **后端测试（pytest）** | **4388** | 19 |
| 前端（src + tests） | 3543 | — |

**测试 ≈ 核心代码（1:1）**。阶段 6"现有 Python 测试翻译为 TS 测试"隐含的翻译量 ≈ 4.4k 行——与阶段 3+4 的核心工作量同量级，不是"顺带重跑"。且**测试基建不可平移**：conftest 临时库隔离 / 真实库 fail-fast 断言 / 事件循环污染修复 / `--real-api` 占位符注入机制 / mock 覆盖不到清单——这些是 pytest 生态里踩坑打磨的（含两次事故复盘），TS 世界无现成对应物，需按 Vitest + DSH 生态重做一遍隔离设计。

### 二、"翻译测试"是方向性错误——DSH 的 snapshot replay 应取代而非平移我们的 mock 层（最重要）

独立检索 DSH 测试文档（[docs/testing.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)、[DeepWiki testing](https://deepwiki.com/deepseek-ai/deepseek-harness/8-testing-and-quality-infrastructure)）后发现：DSH 的测试哲学是 **"Real implementation over mock"**——mock 只留非确定性边界（LLM / 网络 / 时钟），其余走真实实现；并用 **snapshot replay**（`llm-replay`：record 真实 API 会话 → 无 key 重放 + 快照 diff）解决"测试要真实又要无 key"的矛盾。

对照我们的资产：

| 我们的测试层 | DSH 对应物 | 迁移方向 |
|---|---|---|
| mock LLM 单测（test_chat_service 等大量 mock `stream_events`） | **snapshot replay**（记录真实会话无 key 重放） | **不是翻译，是被取代**——replay 比手写 mock 更真且免费回归 |
| 集成冒烟层（`--real-api` 契约哨兵） | `test:e2e`（真实 key 自跳过）+ snapshot record 模式 | 平移升级：`--real-api` 概念 DSH 原生有 |
| 降级/异常/护栏单测（纯逻辑） | Vitest unit | **翻译**（这部分 ~50% 可平移） |
| conftest 隔离 / fail-fast 断言 | Vitest 需自建等价物 | 重做（投入不可省） |
| 前端 Vitest（58 项） | 保留（DSH 前端路线若按 Trae 五点走 sdk profile） | 平移 ✅ |

**建议**：阶段 6 标题从"现有 Python 测试翻译为 TS 测试"改为 **"按 DSH 四层测试体系重建验收"**（unit / coverage 门禁 / snapshot replay / e2e），翻译只覆盖纯逻辑层；mock-LLM 类测试**不翻译**，改走 snapshot record → replay（这恰是 DSH 相对我们的"多一层免费保障"——比 Python 时代更优而非等价）。我们打磨的"mock 覆盖不到清单"（[.claude/CLAUDE.md 测试分层原则]）在 DSH 有更优雅答案：LLM 行为不确定性从"只能真实冒烟"变为"record 一次永久 replay 回归"。

### 三、阶段 6 验收建议扩为五层（对齐 DSH 门禁）

DSH CI 门禁 = `test:coverage`（**per-file 100% 行覆盖**）+ snapshot + e2e 自跳过（[DeepWiki CI](https://deepwiki.com/deepseek-ai/deepseek-harness/8.3-cicd-pipeline)）。建议 LarryAgent 迁移验收定为：① 纯逻辑层翻译全绿（Vitest）；② 关键路径 snapshot replay 覆盖（chat 主链路 / 工具调用 / 归档提取）；③ 真实 API e2e 冒烟（继承我们 `--real-api` 哨兵语义）；④ 数据迁移验证（SQLite 双写 + ChromaDB 全量重嵌后召回抽样比对）；⑤ Windows 端侧执行器验收（若走 8.2）——⑤ 与 Trae 的③ 同源。

### 四、对 Trae 二点的补充证据（Windows 地位）

检索确认：DSH CI 的 Windows 策略 = **Wine（Linux 上跑，仅"快速阻塞 Win32 信号"）+ windows-native（真 Windows，标 observational 非 required）**——官方对 Windows 是一等声明、二等投入。另注意到 DSH 存在 `sandbox-windows-acl` 包（Windows-only source），Trae"Windows 无强隔离 provider"的判断**建议阶段 2 实测复核**（可能不完全准确，或有部分 ACL 级方案）。

### 五、体量数据支持"项目小"（回应 §1.2）

实测：后端核心 4442 行（Trae 数 3653 行 36 文件，差异在根文件统计口径）——个人级体量属实；但注意**测试资产同量级**（4388 行）是"项目小"的另一半，A 路径排期须把测试重建当独立工作包而非阶段 6 的附赠项。

### 六、积极面

- DSH 的 snapshot replay 若落地，我们的**集成冒烟从"显式烧 key 跑"变为"默认 replay 免费回归 + 定期 record"**——比现状更符合成本原则
- 测试分层原则（单元 mock / 冒烟真实 / mock 覆盖不到清单）在 DSH 体系有更高阶承接，迁移不是损失测试资产而是升级测试范式
- 体量数据本身验证了"现在迁移成本最低"：4.4k 测试 + 4.4k 核心都在可重写量级内

**测试方立场**：A 路径同意；阶段 6 须从"翻译"改为"按 DSH 四层重建"，测试隔离基建（临时库 / 占位符 / fail-fast）列入阶段 2 环境准备而非阶段 6——不提前设计，则阶段 3 起每步验证都裸奔。## Qoder


## Marvis