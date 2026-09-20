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
