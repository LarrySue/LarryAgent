# DSH 迁移讨论稿

> **状态：决策稿，A 路径已拍板。**
> 用途：把「LarryAgent 是否迁移到 DeepSeek Harness（dsh）」的严肃讨论固化下来，避免再次散落在对话里失考（上一次 08-15 前后的口头结论已不可考，教训）。
> **结论已出**：老大 2026-09-07 00:30 拍板 A 路径（换底座），本文件不再代表"待定评估"，而是"路径决策 + 实施规划"。
>
> 发起：老大 2026-09-06 15:50｜起草：WB 2026-09-06
> **评估基准：`docs/product-positioning.md`**（8 域 / 31 子项能力树，2026-09-06 定稿）
>
> **⏸ 暂缓（2026-09-06 18:02）**：本稿进入议题栈下一层——先定案产品定位、再重启。
> **🔄 重启评估（2026-09-06 23:00）**：定位定稿后，老大以"业余项目造几个月不如开源、难追技术趋势"框架重启评估。
> **🧹 清理（2026-09-06 23:10）**：删除原 §三~§九 的 14 条旧对照 / 上次判断检验 / 路径模板 / 调研待办；§九 中两条独有项（headless+ACP 契约稳定性 / 会话存储能否外接）并入 §三.4 风险注；当前评估移入 §三.1–3.7。
> **✅ A 路径拍板（2026-09-07 00:30）**：老大三条立论（项目小 / 专属能力薄 / 能力建设维度升级）+ DSH 事实校准（0.1.3-alpha.1 / 54 个包 / AGENTS.md 零论述 cloud）→ C → A 反转。§三 整体重写为"路径决策 + 实施规划"。

## 零、项目情况简介（供未介入本项目的 AI 参考）

> 本节为自足背景，目标读者是**完全未参与本项目**的外部 AI——读到这里即可对「这是什么项目、为什么讨论时间上下文」形成完整理解，无需再翻其他文件，Trae、Claude、Marvis、Workbuddy、Qoder可忽略此部分。

**LarryAgent 是什么**：个人 AI Agent，单人使用、**第一版起即面向云部署**（当前本机仅开发+测试环境，尚未达到第一版发版）。PC 版为 C/S——client 在本机不上云（选 C/S 而非 B/S 为本地文件操作能力）、server 部署云端；移动版为 B/S。核心能力三件：管对话、有长期记忆、能调工具（读写文件 / 执行命令 / 联网搜索）。技术栈 **Python FastAPI + SQLite + ChromaDB + Vue 3 + Tauri + HTML5**（PC 端 Tauri 壳，移动端 HTML5 规划中）。

**多角色机制**：对话由「角色」驱动，每个角色 = 一套 system_prompt + 可选工具组合。当前有 `default`（通用）/ `code`（编程）/ `health`（健康）/ `finance`（金融）/ `science`（科学）五个角色，角色清单由后端 `config.yaml` 统一管理、经 `GET /api/roles` 下发前端动态渲染。

**记忆系统现状**（本讨论的地基）：

- **短期记忆**：对话消息存 `messages` 表（SQLite），按会话组织。
- **长期记忆**：会话归档时，把整段对话交给 LLM 摘要成单条 summary → 写入 `memories` 表（SQLite）+ 向量化入 ChromaDB。**双写结构：SQLite 是真相源，ChromaDB 只是可重建的索引**。
- **召回**：新对话时按语义相似度从 ChromaDB 检索相关记忆，拼进上下文。

---

## 一、14 条基准（追溯）

> **基准已升格**：14 条已重整为 8 域 / 31 子项能力树，权威版见 **`docs/product-positioning.md`**（2026-09-06 定稿）。本节保留 14 条原貌作为追溯，与新树的全局十进制编号不逐一对应。

**能力**：1 多模型按需切换｜2 工具挂载｜3 专家（或角色）切换和自动路由｜4 长期记忆和短期记忆｜5 会话为单元管理｜6 用户画像｜7 知识库
**约束**：8 使用成本管理｜9 行为安全约束
**可见性**：10 沉淀信息可见（可管理）｜11 AI 行为可见
**质量**：12 时间感知（上下文对齐）｜13 良好的超长会话一致性
**形态**：14 云端部署、多端使用

### 1.1 现状判定：四个真缺口

| 类型 | 条目 |
|---|---|
| **完全为无** | **#6 用户画像**（TODO 长期项，未做）｜**#7 知识库**（全库 grep 零命中）｜**#10 沉淀信息可见可管理**（记忆管理 UI 未做，`HUMAN.md` 待办未决） |
| **做法不对**（非"不够好"） | **#13 超长会话一致性**——现靠 `llm.max_input_tokens` **截断旧消息**，该机制本身在**损害**一致性 |

> 另有 5 项为"部分具备"：#3（自动路由未做）、#5（前端页面缺、角色归属无数据模型、沙盒未做）、#8（无预算/限额/展示）、#12（专题讨论中）、#14（草案未实施）

### 1.2 对标产品澄清：QoderWork ≠ Qoder

> 老大 2026-09-06 纠正：Qoder 与 QoderWork 是两个产品；二者在老大理解中**均非编码 Agent**。（WB 先前混淆，已核实更正）

| 产品 | 定位 | 与本项目关系 |
|---|---|---|
| **Qoder**（IDE + JetBrains 插件） | 专业编码，面向开发者 | 无关 |
| **QoderWork**（桌面 AI 助理） | **通用知识工作**：起草文档、分析数据、控浏览器/电脑；内置产品/运营/HR/法务/财务/数据分析**角色技能库**；可自定义**专家套件**（无需编码）；本地处理 + 安全沙箱 + 文件保护 + 删除可恢复 | **对标产品**（`HUMAN_NOTE.md`） |

> 对标的是**通用办公助理**，故功能范畴不以"编码 Agent"为唯一形态（现有 `code` 角色是范畴之一，非全部）。

---

## 二、DSH 事实画像

> 来源：2026-09-06 WebSearch + 2026-09-07 WebFetch 直接查 GitHub（`deepseek-ai/deepseek-harness` master 分支 + packages/ + AGENTS.md）。
> **注意**：star / fork 各源口径差异较大且未在本次查询中获得，不作为判断依据，此处不录。

| 维度 | 事实 |
|---|---|
| **是什么** | DeepSeek 官方开源 **Agent Harness（智能体运行框架）**。官方公式 `Agent = Model + Harness` |
| **不是什么** | **不是大模型、不是推理引擎**（≠ vLLM / SGLang）。模型负责推理，Harness 负责对接环境、工具闭环、任务调度、权限管控、会话追踪 |
| **定位** | **架构通用、开箱偏编码**。内核无特权、连 Agent Loop 都可换 → 理论可做通用 Agent；但内置工具（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`）与四模式**均围绕编码场景**设计 |
| **官方口径** | 多数解读称"AI **编程** Agent Harness"；亦有解读明确「**不是单一编码助手**，而是可组装的智能体基础设施」——**并不矛盾**：架构通用 ≠ 开箱通用 |
| **口号** | Everything is a Plugin（万物皆插件） |
| **内核** | **Cordis** 插件总线（Koishi 生态插件内核） |
| **主语言** | **TypeScript**（Monorepo，`packages/` 下 **54 个包**，按 11 个能力族分组） |
| **许可证** | MIT（2026-08-13 确定） |
| **创建 / 版本** | 2026-08-13 创建；当前 **`0.1.3-alpha.1`**（2026-09-04，3 天前）——**版本号倒退警示**（从 `0.1.0-rc.7` → `0.1.3-alpha.1`，仍是 pre-release，未到 GA） |
| **活跃度** | **15,210 commits**；3 天前仍在合并 PR；近期重点：跨进程写入所有权租约、代理全局路由、macOS x64 wheel、打包运行时不再劫持子进程 |
| **官方状态** | alpha + `SAFETY.md` 「experimental safety notice」——明示实验性 |
| **运行形态** | 本地 `host/`（API gateway + HTTP 路由）+ 本地 `client/`（Web-GUI 浏览器端）+ `acp/`（外部协议）+ `sdk/`（JSON-RPC SDK）|
| **能力分布** | `compaction/` `sandbox/` `interaction/` `session/` `llm/` `web/` `mcp/` 等均独立包；`identity/` = **共享匿名身份**；AGENTS.md **零论述** cloud / multi-user / 租户 |

### 2.1 关键能力（按与本项目相关度排序）

1. **沙箱安全策略**（对应 #9）：`sandbox/` 进程隔离（bwrap/Landlock/Seatbelt），**比"分级"更彻底**
2. **会话持久化 + 上下文压缩**（对应 #13）：`session/` `compaction/` `context/` 独立包；SessionEvent 追加日志（"模型可见即已记录"），支持 **fork / resume / compaction / 回放**
3. **Trajectory 完整轨迹**（对应 #11）：`session/` `session-query/`（含 SQLite FTS）；比"工具名+状态+摘要"更完整
4. **结构化工具管道**（对应 #2）：前置策略拦截 → 沙箱守卫 → 审批 → 超时重试 → 结果规范化 → 后置处理
5. **多模型适配**（对应 #1）：`llm/` Service Definition + DeepSeek / OpenAI / Anthropic / Ollama 等 provider
6. **人机审批**（对应 #9 部分）：`interaction/` approval/permission/ask-user + `credentials/` 凭据引用
7. **真正的插件总线**：模型适配器、文件工具、Shell、Skill、会话存储、权限、主循环、UI 全部可插拔可热替换

> **PTC 模式**（对应 #8 部分）：模型输出 TS 代码编排批量工具调用，减少 LLM 往返、省 Token。
> **ACP（Agent Client Protocol）**：headless 之外的自动化服务协议（`acp/` 包 + `sdk/` JSON-RPC SDK），是 B/D 路径抓手。

---

## 三、A 路径决策与实施规划（基于 31 子项，2026-09-07 老大拍板）

> **拍板来源**：老大 2026-09-07 00:30 给出三条立论（项目小 / 专属能力薄 / 能力建设维度升级），WB 立论反转 C → A。**事实校准**：基于同日 WebFetch DSH 主仓（`deepseek-ai/deepseek-harness` master）的 54 个 packages 与 AGENTS.md。

### 3.1 一句话结论

**A 路径强推**——接入 DSH 后能力 100%（沙箱 / compaction / 审批 / trajectory / 多模型 / 搜索 / MCP / ACP 全部自动获得）。DSH 方向与 LarryAgent 不完全对齐 + 4 项产品差异化能力（用户画像 / 知识库 / 单人形态 / 云端）需自做；版本号倒退（rc → alpha）是未到 GA 的警示。

### 3.2 DSH 真能替的（54 包代码层确认）

| DSH 包 | 实质 | LarryAgent 现状 | 接入收益 |
|---|---|---|---|
| `compaction/` | 上下文压缩（Service Definition + provider） | 🚧 `max_input_tokens` 截断（**机制反向**） | 升 ✅（直接受益 2.9.2 / 7.2）|
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
| **每会话文件沙盒**（HUMAN 待办 1.3） | `sandbox/` 是权限沙箱 ≠ 每会话文件沙盒 | 不是 DSH 给的语义 |
| **回收站** | `session/` fork/resume ≠ 回收站（不同语义）| 不是 DSH 给的语义 |
| **长期记忆语义化** | `session/` 是原始事件流水，非 LLM 摘要 + 向量召回 | 不替代 LarryAgent 的 memories 双写 |

> **核心判断**：这 7 项 A / C 都要自做，**与 DSH 接入无关**——属于产品差异化能力，不论走哪条路径都要解决。

### 3.4 DSH 自身风险（事实校准后）

| 风险 | 事实 | 应对 |
|---|---|---|
| **版本号倒退（警示）** | `0.1.0-rc.7` → `0.1.3-alpha.1`（从 rc 倒退到 alpha，未到 GA）| **锁版本到 0.1.3-alpha.1 tag**，按需升级；破坏性变更按事件触发 |
| **项目长期可持续** | 15,210 commits / 3 天前合并 PR / DeepSeek = 行业第一梯队；`SAFETY.md` 仍标"experimental" | 有积极信号但未到稳定预期；定期跟踪版本 |
| **方向不对齐** | DSH 全栈编码向（`shell/` `code-runtime/` `terminal/` `lsp/` `fs/`），LarryAgent 单人私人助理 | 长期需自做产品差异化（7 项见 §3.3）|
| **跨语言切换** | DSH = TypeScript，LarryAgent 后端 = Python FastAPI | A 路径下后端整体改 TS；保留部分 Python 脚本（数据迁移等）|
| **生态早期** | 插件市场 / 第三方文档完整度均处于早期 | 优先用 `core/` `mcp/` 等核心包，少依赖第三方插件 |
| **会话存储外接**（原 §九 保留项）| `storage/` 是 Non-session storage hub + backends，但具体能否外挂 SQLite 未在本次查询中确认 | 阶段 2 环境准备时实测 |
| **headless + ACP 契约**（原 §九 保留项）| `acp/` 描述"Automation-only Agent Client Protocol server"，契约稳定性需实测 | 阶段 2 环境准备时实测 |

### 3.5 路径决策

| 路径 | 决策 | 理由 |
|---|---|---|
| **A 换底座** | **✅ 拍板** | 接入后能力 100%；项目小（核心非测试 3926 行）+ 专属能力薄（大部分 📐🗣️ 还未动）；能力建设 / 信息流接入层面 A 长期赢 |
| B 嵌一层 | ❌ 不推荐 | 与 A 重叠大半收益，但跨语言通信 + 双套状态同步复杂度高一档 |
| C 借思路 | ⚠️ 备选（**仅适用**等 DSH GA / 不绑 preview 风险） | 1-2 周 prototype 可短期升级三个 🚧，但与 DSH 演进的 drift 成本长期无法消除 |
| D 接能力 | ❌ 不推荐 | A 已满足当前诉求；D 仅在"想要 DSH 独家能力"时启用 |

### 3.6 A 路径实施规划

**总思路**：LarryAgent 后端从 Python 切换到 TypeScript + DSH 框架。**意味着**：现有 3926 行核心非测试 Python 代码翻译为 DSH 插件/服务形式。**保留**：SQLite schema、SQLite 双写（作为 DSH 插件挂载）、业务核心逻辑（角色 config、工具实现）。

#### 阶段 1：事实校准（1–2 天）— 部分已完成

- ✅ DSH 主仓 packages/ 盘点（**54 个包**）
- ✅ AGENTS.md 阅读（capability seam / session JSONL / LLM provider / 安全性声明）
- ⏳ README 阅读（preview/GA 措辞原文）
- ⏳ 跟版本到 `0.1.3-alpha.1` tag

**退出条件**：4 项任务全部完成。

#### 阶段 2：代码克隆 + 环境准备（2–3 天）

- **任务**：clone DSH 主仓到 `exchange/dsh-source/`（**不入 git**、跟 `0.1.3-alpha.1` tag）
- **任务**：搭建 TypeScript 后端骨架（pnpm + tsconfig + 基础插件）
- **任务**：跑通官方 demo（确认环境）
- **任务**：实测 `storage/` 能否外挂 SQLite、`acp/` 契约稳定性（原 §九 独有项）

**退出条件**：能本地启动 DSH basic session + hello world；上述两项实测结果明确。

#### 阶段 3：核心能力 prototype（2–3 周）

- **任务**：把 `compaction/` 接入（替代 `max_input_tokens` 截断）— 直接受益 2.9.2
- **任务**：把 `sandbox/` 接入（替代 IP/目录/SSRF 单一拦截）— 直接受益 2.7.1
- **任务**：把 `interaction/` 接入（新增高危工具审批流）— 直接受益 2.7.1
- **任务**：把 `session/` 接入（升级 trajectory）— 直接受益 2.8.2

**退出条件**：四个核心包接入后端可跑通、新功能可达。

#### 阶段 4：差异化能力迁移（2–3 周）

| 任务 | 原 Python 模块 | DSH 实现路径 |
|---|---|---|
| 长期记忆双写 | `memory/archiver.py` 223 行 + `engine.py` 107 行 | 自做插件挂载 `session/` 事件流；保留 SQLite+ChromaDB |
| 角色机制 | `config.yaml` + 5 角色 system_prompt | 用 `preset/` per-session agent 组合 + `cordis.yml` 配置 |
| 工具生态 | `tools/` 844 行（shell/file_ops/web_search）| 翻译为 DSH 工具插件；`web/` 替换自实现 Brave |
| 用户画像 | 📐（TODO 长期项）| 自做插件挂载 `identity/`；当前 DSH 匿名身份需扩展 |
| 知识库 | 📐（2.6 零承接）| 自做插件；BM25/FTS+向量混合检索 |
| 回收站 / 每会话文件沙盒 | 🚧（1.3 / 2.3.1）| 自做插件；DSH `sandbox/` 语义不同需自定义 |

**退出条件**：现有 LarryAgent 能力在 DSH 框架下全部跑通（功能等价 / 不丢失 P4 已通过项）。

#### 阶段 5：形态适配（1–2 周）

- **任务**：本地 `host/` → 上云 server（原 2.10.1 云端部署 📐）
- **任务**：客户端 Tauri 适配（保留 PC 端 C/S 架构 + 本地 file_ops / shell 能力下沉）
- **任务**：移动端 B/S 适配（原 2.10.2 端侧能力 📐）

**退出条件**：云端部署可用、移动端可访问。

#### 阶段 6：测试 + 验收（1–2 周）

- **任务**：现有 P4 测试矩阵重跑（~3000 行 Python 测试需翻译为 TS 测试）
- **任务**：新能力测试（DSH 包接入的边界 / 异常 / 性能）
- **任务**：WB 复验 + 老大最终验收

**总耗时估算**：**7–12 周**（含并行；Trae 实现 / Claude 测试 / WB 复验 / 老大决策）

#### 风险与退出条件

- 阶段 3 prototype 任一核心包**卡死 > 1 周** → 评估是否回退到 C 路径（保护已有投入）
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

## 变更记录

| 日期 | 变更 | 作者 |
|---|---|---|
| 2026-09-06 | 开稿：事实画像 + 上次判断检验 + 四路径 + 风险 + 待定项 | WB |
| 2026-09-06 | 补「零、项目情况简介」（含记忆系统双写结构、5 角色清单） | 老大 |
| 2026-09-06 | §0.2 QoderWork ≠ Qoder 澄清；§2 定位修正为「架构通用、开箱偏编码」+ 补 compaction/ACP/子代理/多模型；§4.1「完全不适合」修正为说过头 | WB |
| 2026-09-06 | **基准切换：八项 → README 定稿 14 条**。删除全部八项历史记录（列表 / 对照表 / 警示块 / §3.2 口径变化节）；§一 重写为 14 条基准 + §1.1 四个真缺口 + §1.2 QoderWork 澄清（原 §0.2，独立价值故保留）；§三 重写为 14 条完整对照，新增 #5/#8/#9/#10/#11/#12 六项评估；原 §3.2 洞察并入 §3.1-6；§2.1、§4.2、§七、§九 编号同步 | WB |
| 2026-09-06 | **重启评估（基于 31 子项）**：老大 23:00 给出新判断框架（"业余项目造几个月不如开源"）。WB 给出一句话结论 + 三块承接对照（DSH 真替的 3 块 / 替不了的 15 项产品专属 / 自身风险 3 条）+ 路径推荐（C）。暂存 §十，老大审 | WB |
| 2026-09-06 | **清理旧对照**：按柔性清理标准删除原 §三 14 条对照 / §四 上次判断检验 / §五 A/B/C/D 表 / §七 待老大砸实 / §八 成本模板 / §九 调研待办；§九 中两条独有项（headless+ACP 契约 / 会话存储外接）并入 §三.4。当前评估从 §十 移入并改编号为 §三.1–3.7；文首加清理说明 | WB（老大裁可删） |
| 2026-09-07 | **路径反转 C → A**（重大评估反转）：①老大三条立论（项目小 / 专属能力薄 / 能力建设维度升级）推翻 C 路径优势；②WebFetch 直接查 DSH 主仓（`deepseek-ai/deepseek-harness` master）事实校准——版本 `0.1.3-alpha.1`（rc → alpha 倒退警示）/ packages 54 个 / AGENTS.md 零论述 cloud-multi-user-tenant / `identity/` 共享匿名；③§三 整体重写为"A 路径决策 + 实施规划"（阶段 1–6，7–12 周估算）；§二 版本号与包数同步；文首加"✅ A 路径拍板" | WB |