# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---

---

## 2026-09-17 · 职责外宏观评估：项目路子与 DSH 用法（老大交办 · 外部审阅者视角）

**方法**：① 项目一手文档（定位稿 / 决策稿 / TODO 实况量）② **上游源码与文档原文**（只读 `ref/dsh-bare` @ `dsh-v0.1.5-rc.2`，未 checkout）③ 外部行业趋势（**取证仍在跑，第三问待补**）。
**先声明两条局限**：⑴ repowiki/知识卡片**不能当宏观依据** —— 它是从代码生成的、内容是"Python/Vue 应用"旧形态（架构卡里 DSH 只出现 1 次），且含过时的 012「现状」断言与"降级到 0.1.2-rc.1"方案；本评估未采用它。⑵ 我不深入实现细节，产品价值的判断依赖老大对自身使用的体感。

### 一句话结论

**方向的选择是对的；用法大体合上游哲学（2 处需收敛）；真正的风险不在方向，而在「节奏与隐性成本」—— 项目注意力已 7:1 压在基础设施与过程上，而产品侧近一周零演进。**

### 一、整体路子：判断成立，但三件事被低估

**成立的部分（有据）**

| 判断 | 依据 |
|---|---|
| 不自造底座是对的 | 上游把 compaction / sandbox / 审批 / persistence / MCP 都做成可挂载 seam，且明言 "There is **no privileged core** to patch: you extend dsh by mounting a plugin beside the others" |
| 「只借鉴不直装」（§3.0）是对的 | 上游自述其官方包 "an idea, an official showcase, and a source of inspiration, but **not a mandate**"，且 "we **cannot accept external pull requests** at the moment" ⇒ 生态依赖确实不可控 |
| 保留 Vue/Tauri **不是**逆势 | 上游成文支持自建前端：cookbook"I​​t may serve a UI or an automation client"；未见"必须用官方客户端"任何表述 |
| 把信念层与证据层切开、给可证伪失效条件 | 上游原文级风险已逐条登记（含"AGI 是重心 ⇒ harness 是副产品"这条对己不利的矛盾） |
| 迁移是并行轨道不是断桥 | 老栈未被破坏（近一周 backend +1/−1 行、client 0 行） |

**被低估的部分（本评估的量化）**

1. **注意力分配失衡（外部审阅者第一眼会看到的）**：近一周 `docs/` 71 + `exchange/` 105 + `.workbuddy/` 141 = **317 条提交** vs 代码 **18 条**（`harness` 17 / `backend` 1 / `client` 0）。文档体的重心：DSH 专题 **349,646 字符**、环境三份 141,122、产品定位 58,259 ⇒ **基础设施/过程文档 : 产品文档 ≈ 6.8 : 1**。单篇最大 `dsh-migration.md` 169,584 字符（产品稿 2.9 倍）。
2. **"替上游打工"是长期税，不是一次性成本**：`DSH-3.7` 那 16 条提交（占 DSH-3 提交的 ~19%）是在补 **DSH 自己的 Windows 沙箱方言缺口**，而 015 未自修 ⇒ 修复件**必须随客户端发布** ⇒ 该项目承接了一项上游的持续维护责任。
3. **双轨已名存实亡**：DSH-6 前"双轨可回退"是核心兜底，但 `backend` 近一周 +1/−1 行、`client` 0 行 ⇒ **回退目标已停止演进**，兜底只剩形式。
4. **规模感**：`harness/` 已 **6,149 行**（> `client` 的 3,805 行）而**产品能力 0**；剩余 DSH-3.3–3.6 = 4 个 TS 插件 + 各自完整判据装置；**真正的大头在 DSH-4**（19 项语义层迁移）。现在的 3.x 只是 prototype。

### 二、对 DSH 的用法是否符合其设计哲学：大致合，**2 处需收敛**

**合的部分**：把产品语义写成 Cordis 插件 = 上游期望的接入方式；上游原则"Extension plugins depend on Service Definitions, **never concrete providers**"正是 3.4（自做 compaction provider）的做法；三级递进（本地插件 → `--patch` overlay → npm bundle + profile）与项目落地方向一致。

**⚠️ 需收敛 ①：产品启动形态贴到了上游明禁**
上游 `docs/architecture.md`〈Application launch〉原文：
> "Every supported Node application starts at the `dsh` CLI with a named profile… custom plugin composition remains **a profile plus ordered patch files, not another executable or inline application tree**."
> "…`verify-application-entrypoints` keeps every package bin, executable source, and root demo in an explicit class and **rejects a Node application path that bypasses `dsh`**."

而项目 client 侧走的是**自造驱动脚本** `harness/scripts/dsh-prompt.mjs`（其自述 "the Tauri client runs exactly this script under the hood"）。
⭐ **上游已给出桌面端的标准蓝本**（同节〈Desktop application〉）：自己的 Electron 应用**占一个保留 profile**（`$DSH_HOME/profiles/desktop`）＋ **绑定一个精确 dsh 版本** ＋ **自带第一方离线 seed** ＋ **启动时用自带 pnpm 把该版本装进可写 profile**。⇒ **LarryAgent 的 Tauri 客户端有现成范式可对齐，不必自创**；上游 bundle/profile 分工是硬性的："A bundle is what you author and distribute; a profile is what a user boots with. **Nothing is both.**"
（我可能误读之处：该规则语境是上游仓库自身的准入门禁；但它是**公开架构规则**且配套强制校验，作为"期望形态"的指示是明确的。）

**⚠️ 需收敛 ②：数据层不可回退 —— 升级 SOP 的回退动作不成立**
上游 `AGENTS.md:7` 原文：session 格式迁移 "may add a version-named successor but never move, overwrite, or delete committed generations; **predecessors imply neither fallback nor downgrade support**"。
`docs/session-format-status.md` 更重：**"An alpha, beta, or release-candidate product publication establishes released Session-format obligations. GitHub's prerelease flag does not make persisted user data disposable."**
⇒ 项目升级 SOP 里的"超时未收敛即**回退上一 tag**"**只对代码成立，对数据不成立**（升级后写入的会话/存储，旧 tag 读不了）。
**现场标本**：本机 `.dsh-home/sessions/` 仍留着 **8 个 012 期会话**（文件名 `session.jsonl.zstd`，**无版本段**），而 015 写出的是 `session.**v3**.jsonl.zstd` ⇒ **格式代已变，那 8 个旧会话在 015 下能否读取，项目未验**（全仓文档未见任何一处分析"已持久化会话数据"的跨代可读性）。
**另一条上游定性（项目已登记"自做"，但未登记力度）**：多租户 —— 上游原文 "Deployments that need a hard multi-tenant boundary need a **container-class backend**"、"a future **multi-principal Host** must revisit…"，现存的是 "**single-user local Host trust model**"。⇒ 2.10.1 的云端多端不是"补一层租户过滤"，而是**上游明确划在框架之外、需换后端类别**的事。

### 三、是否符合行业趋势（**待补**）

外部取证仍在跑（agent harness 品类现状 / 插件内核 vs 框架 API / MCP 与 ACP 采用度 / 押注预览期底座的先例 / TS 与 Python 在 agent 基础设施的势力分布 / 反向意见）。**回来后我补这一节，并据此校准以上判断。** 本轮不预判，避免闭门造车。

### 四、我建议你拍的三件事（取舍点，不是结论）

| # | 取舍 | 我的倾向 |
|---|---|---|
| 1 | **要不要给迁移加一个"产品可见产出"闸门**：例如 3.6（记忆最小闭环）完成后，强制做一个端到端可用的垂直切片，而非继续按 3.3→3.6 顺序铺 | **倾向加**。迁移的价值只有产品语义层跑起来才可验证；"值不值得继续"的最好证据是有一个能用的东西 |
| 2 | **要不要把"上游缺口承接"显性化成一张独立清单并估持续成本**（Windows 方言件 / 跨代解析 / 启动形态对齐…） | **倾向要**。现在散在各处，看不出总量；这是继"注意力"之后第二大的隐性成本 |
| 3 | **要不要把"数据不可回退"升为升级 SOP 的硬前置**（升级前快照 + 明确回退边界；顺手把 8 个旧会话做一次可读性实测，全是测试数据、代价低，正好当演练） | **倾向要**。它决定"跟随 rc"的代价上限 |

**我未改动任何文件**（评估性输出）。以上均为可复现取证：量化命令、上游原文路径与行号见正文，第三问待外部取证补入。

---

## 2026-09-17 · 社区现状调研（第一节：本地硬数据；web 取证两路在跑）

> 老大指令"再深度研究一下社区目前的情况"。本节**不用网搜**，全部来自本机已有材料（项目已抓的社区列表 + 已克隆的社区参考件 + 裸仓库 git 数据）—— 数字可独立复算。
> ⚠️ 时效：`awesome` 列表为 **2026-09-07 抓取**；复算日期 2026-09-20。

### 1. 插件生态：**量是真的，质是两极的**

来源：`ref/awesome-dsh-plugin.md`（909,721 B / 3,386 行）。我独立复算：

- 条目 **3,196 条** ／ 不同 owner **2,067 个** ⇒ **人均 1.5 条**（长尾极大）
- 分类分布（前 10）：**UI Enhancements 526** ｜ Tools & Capabilities 425 ｜ Development & Runtime 254 ｜ Sessions & Messages 201 ｜ Workflow & Automation 190 ｜ Usage & Billing 178 ｜ **Memory 149** ｜ Skills 135 ｜ Models & Providers 130 ｜ Notifications & Integrations 126
- ✅ **项目引用的两个数字都对得上**：总数「3,199」≈ 我算的 3,196；「UI·主题 640+」= UI Enhancements 526 + Themes & Appearance 114 = **640**（精确吻合）

**但中位数以下的成色很差，形态很具体**：

- **批量生产者**：单 owner ≥5 条的有 **15+ 家**，头部 37 / 36 / 36 / 30 / 26 / 21 / 19 / 19 / 19 / 17 条
- **最极端一例**：`WSL & Windows Interop` 分类 **34 条里 30 条出自同一账号**（`173787247`）—— 把 WSL 互操作拆成 30 个微插件（`wsl-clock` 查时钟偏移、`wsl-dns` 对比解析、`wsl-encoding` 查编码…），每个都是"报告/提示/转换"级
- 另有 `863683348`×19、`988hj7tczd-oss`×26、`WODE25500`×19 等**数字/随机账号**，产出描述高度同构（连续 5 条 "xxx toolkit for DSH agents"）
- 列表条目**不带 star / 最后提交日期**（"Last commit" 0 次命中；"verified" 仅 22 次）

⇒ **§3.0「生态繁荣但质量参差 / 个人作者为主、弃坑风险高 / 只借鉴不直装」被独立证实**，且形态可描述为：**长尾批量生产 + 微能力拆分撑数量**。

### 2. 但"顶部是真的"（避免我片面）

项目手挑的 4 件（`ref/community/`，均为 depth=1 浅克隆 ⇒ **不能用提交数判活跃度**）里：

| 件 | 代码量 | 测试 | 版本信号 |
|---|---|---|---|
| `PerryLink__dsh-reach` | **7,038 行** | **12 个测试文件** | **v0.1.8**、Apache-2.0 |
| `Asher-2000__dsh-memory-connect` | **3,734 行** | 0 | **npm 已发布 v0.6.1**（跨会话记忆，含 bge-small-zh 本地 embedding） |
| `kun2-5code__dsh-plugin-template` | 1,722 行 | 0 | v0.1.0 |
| `EvilIrving__dsh-repro` | 598 行 | 1 | v0.1.0 |

⇒ 生态结论应是「**顶部可读、长尾是水**」，不是整体玩具。项目"手挑再读"的做法与之匹配。

### 3. 对项目最对症的两条：社区**没有**现成的替代品

- **Windows 沙箱方言修复**：WSL & Windows 分类里全是"诊断/提示"类，最接近的 `lucifergzsz414/dsh-windows-native` 也只是**往 system prompt 里塞 Windows 注意事项**，**不是沙箱行为修复** ⇒ **项目自做 `plugin-sandbox-dialect` 的判断成立**，社区确无同类。
- **私人助手的长期记忆语义**：Memory 分类 149 条，但多是**编码向的"项目记忆"**（`scd13150/dsh-cognition` 明写 "Project memory for **coding agents**"；`Co-Engram` 是团队记忆）⇒ 用户画像 / 保鲜 / 矛盾检测这一层**确实无现成件**，自做是对的。

### 4. 上游自身的节奏与"自认欠账"（裸仓库硬数据）

**发布节奏**（`ref/dsh-bare` 17 个 tag，按提交日算相邻间隔）：

| 区间 | 间隔 | 提交数 |
|---|---|---|
| `0.1.1-rc.2 → 0.1.2-alpha.1` | +7 天 | **1,079** |
| `0.1.2-alpha.1 → alpha.2` | +2 天 | 234 |
| `0.1.3-alpha.2 → 0.1.5-alpha.1` | **+1 天** | **563** |
| `0.1.5-alpha.1 → alpha.2` | +1 天 | 262 |
| `0.1.5-rc.1 → rc.2` | **+0 天** | 4 |
| **`0.1.5-rc.2 → 0.1.6-alpha.1`** | **+5 天** | **800** |

- **版本号不规则**：**跳过 `0.1.4`**；`0.1.2` 只有 `rc.1` 无 `rc.2` ⇒ 印证项目"rc/alpha 同为 prerelease、形式无差别，须按版本号语义筛选"的判断
- **对项目的两条直接含义**：① **想跟住每个 rc 在物理上不可能**（天级、数百提交/版）—— 项目已定"不与上游 alpha 节奏绑死、按自己阶段节拍复核"，**这个自保是对的**；② **锁定 `0.1.5-rc.2` 之后，上游又走了 800 个提交** ⇒ "锁定版 vs 上游"的距离增长极快，这是"跟随 rc"策略的**持续成本基线**

**上游把"自认未完成"制度化了**（项目已有盘点，我引之以对照）：`docs/dsh/dsh-015-upstream-inventory.md` 记 —— **266 个包 README 里 1,048 条 `## Known Limitations and Deferred Work`**（由上游 `packages/AGENTS.md` **强制必写**），另有 67 条代码 TODO、20 篇未实现提案。
⇒ 双重解读，两面都要说：**纪律性极好**（下游能读到精确的缺口清单 —— 项目已在这么用，称之为"上游为我们准备好的对手侧缺口清单"）／**缺口总量很大**（rc 阶段就有 1,048 条 durable consumer gaps）。

### 5. 待补（第二节）

web 取证两路仍在跑：**① DSH 自身社区指标**（star/fork/contributor、release 与 PR/Issue 处理、Discord 规模、npm/PyPI 下载量、下游产品级用例）**② 行业趋势**（harness 品类、插件内核 vs 框架 API、MCP/ACP 采用度、押注预览期底座的先例、TS/Python 分布、反向意见）。回来后补，并据此校准先前评估的第三问。

---

## 2026-09-17 · 社区调研（第二节：行业趋势与外部校准 · web 取证已回）

> 检索时间 2026-09；来源 20 条附末。标注：【源】=有来源支撑 ／【判】=综合判断。**本节按"确认了什么 / 需要重新掂量什么 / 我要修正自己什么"来组织。**

### A. 三条与我判断同向的确认

**A1. "harness 已是独立工程品类" —— 方向有品类支撑**【源】
Winder.AI（2026-08-20）把 agent 栈分四层（harness = 单 agent 执行循环 / 工具 / 沙箱 / 记忆 / hooks；framework = 多 agent 编排；platform ≈ runtime），金句 **"Frameworks compose agents; harnesses run them"**，并横向比较 9 个 harness（**含 DeepSeek Harness**）。arXiv 2607.28802（2026-07-30）把 harness 与 model 列为**独立故障归因层**。⇒ 项目"押注 harness 层而非自造 agent loop"**站在已被命名的品类上**。

**A2. 插件内核对"生态退化"的批评 —— 被我本地数据实证**【源】+【本地】
HN 讨论警告插件生态会退化成 "**nightmare of incompatible, deprecated plugins**"；braindrip 指"配置 / 记忆 / 拓扑仍锁死在 harness 内"。
⇒ 这两条我**在本地独立复算里都看到了实证**：3,196 条 / 2,067 owner、单 owner ≥5 条者 15+ 家、同一账号 30 个微插件、数字随机账号批量产出同构 toolkit（见第一节）。**两条独立证据交叉印证** ⇒ 项目 §3.0「只借鉴不直装」不是保守，是有据。

**A3. 个人 agent 的主流形态选择，项目三条全中**【源】
Vellum（2026-09-07）分三类（本地推理壳 / 私有 RAG 工作区 / 持久身份助手），**几乎全是本地 + 云混合**；界面分原生桌面 vs 服务端。OpenClaw（本地优先）2026 走红。记忆层对比：Mem0 = 云依赖 + 按量计费（"**If Mem0's API is down, my agent has amnesia**"）、Letta = "**structurally excessive**"、自建 = 数据主权但少高级查询。
⇒ 项目**"本地优先 + 云混合 / 自带前端 / 记忆自建"三条均与主流同向**，且"记忆自建"有外部给的支撑（两家现成方案各有明确缺陷）。

### B. 三条需要重新掂量的（本节的实质）

**B1. 押注预览期底座：外部有一份点名 dsh 的负面评估**【源】
- developersdigest（2026-08-13，读 dsh 后）："**Nothing here is stable enough to build a product on this quarter**"（并点出：RC 版本号、开发中改 license、单次 squash 提交抹掉历史、**eval 缺失**）
- justin3go（2026-08-15，深度评测）建议"**等半年**"
- 警示案例：**OpenAI Assistants API（beta）已于 2026-08-26 关停并强制迁移**
⇒ 项目的失效条件与兜底清单是完整的，**但"现在就全量迁移"与外部"等半年"的建议正相反**。这不是说项目错，而是：**这个反向证据此前不在项目的风险登记里**（项目登记的是"性能回退 / pre-stable API / 集中度"等事实项，没有登记"外部直接评价其不足以支撑产品"这一层）。

**B2. A-framework「含语言」无公开先例，且与行业通用对策**方向相反**【源】
- 行业通用对策 = **Anti-Corruption Layer**（Azure 架构中心）：把上游变更**挡在核心外**
- 反方建议明确："**Start from your team's strongest language**"（Blaxel）、"**尽早隔离 AI middleware 以便迁移**"（KunalGanglani）；分层混用（Python 守模型/推理、TS 拿应用层）是主流共识
- ⚠️ agent 明确标注：**"为贴近上游内核而整体更换语言"的公开先例与成败评价 = 未找到**
⇒ 项目选的是**贴紧内核换演进红利**，行业通用对策选的是**隔离内核换稳定**。两条逻辑各自成立，但**方向相反** —— 这是本次校准里最值得老大显式知道的一条。我在第一轮评估里说"跨语言重写是否必要值得重新确认"，现在有了外部依据：**它没有先例，且与主流对策反向**。

**B3. "模型会吃掉脚手架"这条反方论据，直接冲击"贴紧内核"**【源】
DeepMind 的 Logan Kilpatrick（2026-06 播客）：外部 harness 约 **"12 个月寿命"**、"**the model eats that scaffolding**"，建议别做通用 wrapper、只做深垂直。HN 高赞："Large opinionated software is unlikely to survive and more likely to give you a **migration fatigue**"。braindrip：选 harness 应按"**基础栈承诺**"对待（更换代价高）。
⇒ 若 harness 层本身可能被模型能力吸收，则**把 3.7–4.4k 行核心重写进 harness 形态**的风险，显著高于"保持语言中立 + 隔离层"。

### C. 一条我要**修正自己先前说法**的（以及一条抬高）

**C1. ACP —— 我先前说的不准，修正**
我第一轮按上游口径写"ACP 是 automation-only、做人面向 UI 不佳"。外部证据显示：**ACP 已是"编辑器 × agent"的事实标准**（Zed 的 ACP，已被 Zed / JetBrains / VS Code / Neovim / Obsidian × Claude Code / Cursor / Copilot / Codex CLI / Gemini CLI 采纳；OpenHands 2026-06-18 靠它实现"任意 agent 换后端"）。
⇒ **修正为**：协议本身是**行业标准、不会消失**；但 **DSH 的 ACP 实现刻意不含 DSH 特有呈现**（上游原文 "Avoid it when a human needs DSH-specific presentation cards, plans, titles, todos…"）⇒ 作为 LarryAgent 的**人面向 UI 通道仍不理想**，作为**脱钩 / 自动化通道则有外部生态背书**。**这实际上抬高了**项目"保留 sdk / acp 接入面作脱钩通道"的价值（我先前低估了）。

**C2. 抬高一条**：**"自建私有通信协议普遍不可取"未找到权威表述**（agent 如实标注），主流只是"优先 build against MCP" ⇒ 项目的"通信面自做服务中转"**不算逆势**。

### D. 反对方共识 vs 项目选择：**高度吻合**（本次最强的正面结论）

外部反对方（Kilpatrick / Winder.AI / HN）的共识**不是"别用 harness"，而是**："**别把命押在通用底座上，保留退路与自持核心资产（记忆 / 数据 / 协议）**"。
⇒ 项目**恰好已经是这么做的**：记忆 / 画像 / 路由 / 时间感知自持（19 项自做）+ MIT 可 fork 兜底 + 保留脱钩通道 + 只借鉴不直装。
**这是本次外部校准里最强的正面结论 —— 项目的架构选择与外部反向意见给出的"正确做法"高度吻合。**

### E. 来源（本轮实际检索；获取日 2026-09-20）

1. A Comparison of AI Agent Harnesses in 2026 — Winder.AI（08-20）｜2. The 2026 Harness Landscape — braindrip｜3. Model or Harness? arXiv 2607.28802（07-30）｜4. Cordis Explained — agentatlas（08-17）｜5. DeepSeek Harness 深度解析 — mazhen.tech（08-16）｜6. dsh developer preview — Hacker News（08-13）｜7. Claude Agent SDK vs LangGraph — developersdigest（06-11）｜8. AI Agent Framework Guide — Mastra（06-22）｜9. Donating MCP to the Agentic AI Foundation — Anthropic（2025-12-09）｜10. MCP 2026-07-28 RC — modelcontextprotocol.io（07-28）｜11. Zed ACP；OpenHands 接入 ACP（06-18）；The Quiet Standardisation of Agent Protocols（05-03）｜12. We Read DeepSeek Harness — developersdigest（08-13）｜13. DeepSeek Harness 深度评测 — justin3go（08-15）｜14. OpenAI Assistants 迁移指南；Anti-Corruption Layer — Azure 架构中心｜15. Python vs TypeScript for AI — KunalGanglani（07-11）；TypeScript AI agents shift — Ability.ai（07-18）｜16. TypeScript vs Python for AI Agents — Blaxel（04-09）｜17. 8 Best Open-Source Personal AI Assistants 2026 — Vellum（09-07）｜18. OpenClaw 本地安全复盘 — dev.to（02-08）｜19. Hipocampus vs Mem0 vs Letta — BSWEN（03-21）｜20. Why the Model Eats the Harness — Kilpatrick 播客摘要（06）

### F. 三问的最终回答（把第一节与本节合起来）

| 问 | 答 |
|---|---|
| **整体路子对不对** | **对**：harness 是已被命名的品类；不自造底座、只借鉴不直装、保留自建前端、记忆自建 —— 四条都有外部支撑；且与反对方的"正确做法"高度吻合。**但"现在就全量迁移"与外部"等半年"正相反，且外部有一份点名 dsh 的"不足以支撑产品"评价。** |
| **用法是否符合 DSH 设计哲学** | **大体合**（插件挂载 = 上游期望形态；Seam 原则；保留自建前端获上游成文支持）。**2 处需收敛**：① 产品启动形态应收敛到 profile + 上游桌面端蓝本；② 数据层不可回退（升 SOP 的回退只对代码成立）。 |
| **是否符合技术趋势** | **方向同向、路径有例外**：品类 / 协议 / 形态三条同向；**"整体换语言 + 贴紧内核"这一条无先例、且与行业通用对策（ACL 隔离）反向**，同时承受"模型吃掉脚手架"这条反方论据。 |

**第三节（DSH 自身社区指标：star / contributor / npm 下载 / 下游用例）web 取证仍在跑，回来补。**

---

## 2026-09-17 · 社区调研（第三节：DSH 自身社区实证 · web 取证已回，观察日 2026-09-20）

### A. 热度与承诺的**严重背离**（本节头号事实）

| 维度 | 实测 |
|---|---|
| 热度 | **230,073 star / 27,555 fork / 990 watcher**；仓库创建 **2026-08-13** ⇒ **5 周 23 万 star**；npm `@deepseek-ai/dsh` **周下载 344,017 / 月 1,610,960** |
| 承诺 | **18 个 release 全为预发布，0 个 stable**；约每 1–3 天一发；`latest` 仍是 rc |

⇒ **"高热度、低承诺"**。对以 dsh 做个人助手而言：插件层不等于可依赖的供应链，**真正的稳定性风险来自上游 rc 级接口漂移**。

### B. 🔴 结构性发现：**Issues 与 PR 对公众整个关闭**（项目风险登记里没有这条）

- **`has_issues = false`（Issues 整个关闭）**；**`/pulls` 接口返回 404 ⇒ PR 功能整个关闭** —— 不是"政策上不收"，而是**结构上收不了**
- 但 merge commit 显示内部 PR 号已到 **~#4471** ⇒ **内部走另一个私有 org `deepseek-harness`（创建 2026-05-26，0 个公开仓库）**，**公开仓是镜像出口**
- 另有私有 org `dsh-external`（创建 2026-06-19，0 公开仓库，61 followers，疑似外部插件 hub）
- Discussions ≈1,000 帖；**未找到维护者系统性响应的证据**；CONTRIBUTING 自述 "we are a **very small team**"
- 36 名具名贡献者**全为内部账号**，top1 占 34% commits；commit 历史可回溯至 **2026-06-08**（比公开仓早 2 个月）⇒ **大厂认真投入的长期底座，但执行方式是"私有开发 + 公开镜像"，不是社区驱动**

**⇒ 对项目的含义（我认为这是本次调研最重要的一条）**：**我们几乎不可能把修复回流上游**。
- 项目已实测并修好的 **Windows 沙箱方言缺口**（`plugin-sandbox-dialect`）—— 上游既未自修，我们也**没有 PR 通道**去修
- ⇒ 第一轮评估里我说的"替上游打工是长期税"，**性质要加重**：不是"我们先补、上游迟早会收"，而是"**补了也进不去上游，只能永久自持**"
- ⇒ 与 §3.4 已登记的"MVP 失效条件"呼应，但**失效条件里没有"反馈通道关闭"这一条**，建议补

### C. 下游：**没有任何经核实的、面向最终客户交付的 dsh 产品**

- 下游几乎全是"**客户端 / 聚合站**"：`anywhere-labs/dsh-desktop`（**27,746★**，MIT，357 open issues，中文为主）、`dataelement/dsh-desktop`（7,688★）、`zhu1090093659/dsh-web`（**7,804★**，自建 Web 前端/插件聚合）、VSCode 集成
- **最关键的反证**：HN "Ask HN: Anyone using dsh as part of a **customer-facing** agent?"（2026-09-19，3 分，**0 评论**）—— **无人应答**
- 非编码苗头仅教程级（"搬上云跑个人运营工作台"）
⇒ **生态目前以"编码 agent 增强 + 客户端重做"为主**。LarryAgent 想做的（非编码、面向个人、自建前端、全量 TS 化）**属于无人区**：既是机会，也意味着**无人替我们验证过**。

### D. 插件生态口径对齐（**重要：这是时点差，不是矛盾**）

| 口径 | 条目数 | owner 数 | UI+主题 | 分类数 |
|---|---|---|---|---|
| **项目所引**（09-07 快照，我本地复算吻合） | 3,196 | 2,067 | 526+114=**640** | ~23 |
| **web 实测**（09-20） | **3,994** | **2,544** | 679+141=**820** | 23 |

⇒ **两组数字都对，差的是 13 天**（列表 13 天涨 **25%**）。项目引的「3,199 / 640+」**不是错**，是 09-07 口径；web 侧"找不到 640+/25 分类出处、疑似旧快照"的判断也**不必成立**。
⇒ **顺带一条纪律印证**：生态规模数字**半衰期只有两周** —— 项目"引用上游须带版本号/日期"的规矩，对生态数字同样适用。
⇒ **一处需要克制**：UI+主题 = **20.5%**，是**单一最大分类但不过半** —— 说"大量玩具"可以，说"占大头"偏重。

### E. 破坏性变更的抱怨**已成体系**（外部实证）

- Discussion **#4487 `dsh-compat-guard`**：社区被迫自建**兼容工具**（升级闸门 + 兼容矩阵 + lockfile / 回滚）
- **#5120**："有没有人搞过升级 dsh 插件代码以支持新版本的 skill？"
- **#6390**："0.1.2-rc.1 → 0.1.5-rc.2 官方改动与第三方插件影响"
- deepseek.club/topic/4365："**0.1.5-rc.1 接口变更引发记忆插件故障**"（09-10）；阿里云社区"更新后插件不兼容？回滚与降级"
- 中文评测（量子位）负面项：**8/17 涨价冲击缓存成本**、**"普通用户短期价值有限，须等社区生态成熟"**；吐槽集中在**插件不兼容与版本回滚**

⇒ **"跟随 rc 的持续成本"不是我推测的，是全社区正在承受的**；社区甚至自建了兼容工具。项目的"不与 alpha 节奏绑死 + 三层回归 + 回退"SOP **方向正确**，但应知道：**同类问题已有现成社区工具（`dsh-compat-guard`）可参考**。

### F. 三问最终定稿

| 问 | 答（经三节取证校准后） |
|---|---|
| **一、整体路子对不对** | **对。** harness 是已被命名的品类（Winder.AI 分层 + arXiv）；不自造底座 / 只借鉴不直装 / 自带前端 / 记忆自建 —— 四条均有外部支撑，其中前两条还被"插件生态退化"的独立证据交叉印证。**且与反对方的"正确做法"（自持记忆·数据·协议）高度吻合。**<br>⚠️ 但要显式知道三件事：**① 外部有一份点名 dsh 的"本季度不足以在其上做产品"评价**（与项目"现在就全量迁移"正相反）；**② 上游 Issues/PR 对公众全关 ⇒ 我们的修复永久进不了上游**；**③ 非编码 + 面向个人的 dsh 产品，目前无任何经核实的先例。** |
| **二、用法是否符合 DSH 设计哲学** | **大体合**：插件挂载 = 上游期望形态；Seam 原则（依赖 Definition 不依赖 Provider）；保留自建前端**有上游成文支持 + 社区先例**（dsh-web 7.8k★、dsh-desktop 27.7k★）。<br>⚠️ **2 处需收敛**：① **产品启动形态**应收敛到 `dsh --profile X`（上游明禁 "another executable or inline application tree"），并对齐上游**桌面端蓝本**（保留 profile + 绑定精确 dsh 版本 + 离线 seed）；② **数据层不可回退** ⇒ 升级 SOP 的"回退上一 tag"只对代码成立（现场标本：8 个 012 期会话未验跨代可读）。 |
| **三、是否符合技术趋势** | **方向同向、路径有例外。** 同向：harness 品类 / 插件内核 / MCP 工具面 / 自带前端 / 本地+云混合 / 记忆自建 —— 六条。**例外**：**"整体换语言 + 贴紧内核"这一条无公开先例，且与行业通用对策（Anti-Corruption Layer 隔离）方向相反**，同时承受"模型吃掉脚手架 / harness 12 个月寿命"的反方论据。<br>⇒ 这不等于错，但**它是全项目风险最高、外部验证最少的一个选择**。 |

**取证完备性**：三节均基于可复算的本地数据或带日期的公开来源；未决/未找到项已在各节如实标注（Discord 成员数、面向客户交付的 dsh 产品）。
