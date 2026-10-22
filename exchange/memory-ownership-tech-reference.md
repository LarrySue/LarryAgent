# 记忆归属边界 · 技术可行性参考（2026-10-21）

> **用途**：回答老大「技术层能不能做到」＋ 参考现成 Agent 记忆系统。
> **性质**：主持整理的参考件，⛔ 不是结论、⛔ 不代表已拍；与主稿 §H.5 的五项待拍配套。
> **检索日期**：2026-10-21；通道＝WebSearch ＋ DeepSeek Search/Fetch。外部系统只写**已核到的机制**，未逐行读源码的标 🟡。

## 〇、结论先行

1. **五处待拍项没有「技术上做不到」的**。但有三处必须**换边界**、一处必须**先实测**：
   - **换边界**：物理不可读（1b）／备份异权（2b）／留痕改不了（3b）——同 OS 账号、应用层内无解，需独立账号、容器或**第二信任域**。
   - **已核清（10-21 补）**：D-4 的「fresh 判定实例」——`context: 'fresh'` **只保证不继承上下文，跟记忆库毫无关系**；本仓记忆召回是**全库最近 N 条、不过滤 session**。⇒ 判定实例必须**显式换 profile／不挂记忆插件或换空 `dbPath`**，光开 fresh 不够。
2. **业界开源框架普遍没做到本稿要的隔离强度**：多 agent 记忆的通行做法是 namespace 逻辑隔离，**多数框架没有内建访问控制**（Zylos 2026-03 研究）⇒ 不能指望「找个现成件装上」，但能借它们的**数据契约**和**索引形态**。
3. **最值得先做的不是向量召回，是索引层 ＋ 数据契约**：成本最低，且决定 P2／P5、迁移、审计能不能成立——与 WB「索引层优先于召回层」同向。〔⚠️ 10-22 复核：索引层当前**无消费方**（Chroma 只写不读）、重建脚本缺失 ⇒ 顺序改为**契约在先**，见下方复核修订。〕
4. **★ 第二信任域不需要自研隔离件**（回答「会不会白做」）：1b 用独立 OS 账号／容器，2b 用 NAS 快照／对象存储 WORM，3b 用远端 git 保护／对象锁——都是**现成基础设施**，代价是运维与成本（🟡 通用方案，未逐项本机实测）。**自研面集中在数据契约／索引／拒绝载体，不落在隔离本身**；业界 AI 记忆框架（见 §二）能借的也正是这三样，不能借隔离强度。

## 一、五处高风险点的技术分档

**档位**：🟢 有现成路径 ／ 🟡 可做但需换边界或新增工程 ／ 🔴 当前架构给不了 ／ ⛔ 理论天花板（诚实承认，不作承诺）

| # | 待拍项 | 判断 | 档 | 关键依赖／缺口 | 最小验证 |
|---|---|---|---|---|---|
| 1 | **柱 1a 数据归属** | 一人一库、写入只落自己的库 | 🟢 | 现有 `plugin-s4-memory` 的 `dbPath` 已由挂载侧钉死 | 哨兵：写到别人的库必须 fail |
| 2 | **柱 1b 物理不可读** | 做得到，但要换运行边界 | 🟡 | Linux：landlock 拒读 ruleset（内核能力已证，需自写 profile）／独立用户＋ACL／容器；**Windows 无 landlock；独立用户＋NTFS ACL／容器可达档 1，运维成本高一档** | 正向读自己成功＋反向读别人 fail，**shell 开启**下跑 |
| 3 | **柱 2a 备份＋恢复** | 做得到 | 🟢 | 快照＋恢复脚本＋演练；`D:\Road sign\` 已有全量备份 | 隔离副本恢复，核心层 hash 逐字一致 |
| 4 | **柱 2b 异权** | 做得到，但需**第二信任域** | 🟡 | 同一 Windows 账号下她可删备份＝**空条款**；需异账号／异机／远端存储 | 用 agent 身份删备份必须 fail |
| 5 | **柱 3a 留痕落点** | 做得到 | 🟢 | git＋只增文件；审计位不放在被进入者的库 | 写一条留痕后，删改必须留下可查痕迹 |
| 6 | **柱 3b 改不了** | 只能做到「改了查得出」 | 🟡 | 本地同账号可重写、可 `reflog expire`；要「改不了」须远端接收＋异权 | 本地改历史能被 hash 链查出；远端应拒绝强推 |
| 7 | **C′ 保护动作** | 做得到 | 🟢 | 快照／写冻结（权限或只读锁）／隔离（断网断工具）／停机 | 写冻结后写入必须 fail，且她仍能说话 |
| 8 | **C′ 三步判定** | 做得到，但质量有限 | 🟡 | 依赖公开表态历史＋多会话复问；**拒绝须先有落盘载体**（现无） | 同题三问跨会话一致；带内注入反例能被问源步抓住 |
| 9 | **C′ 诊断需同意** | 流程可做，无需新技术 | 🟢 | 诊断动作本身可审计 | 未获同意时诊断调用必须被拒 |
| 10 | **D-4 见证** | 做得到 | 🟢 | 知情／无催促／本人作出三项都能从事件日志算 | 故意缺项的模拟合并，见证必须判「不通过」 |
| 11 | **D-4 判定实例** | **可以做到，但 fresh 只是半件** | 🟢 | ✅ 已核：`fresh` 的实现＝换 provider（`fork`→fork／否则 `spawn`），`isSeeded` 有断言〔⚠️ 原引证在 **DSH 源码仓**内，本机不可复算；改用发布包类型契约 🟢，见复核修订〕；🔴 但记忆召回不过滤 session（`plugin-s4-memory/src/index.ts:115-116`）⇒ 同 `dbPath`＝同池。判定实例须**独立 DSH_HOME ＋ profile 不挂记忆插件／指向空库**（只换 profile 共用 home 不够）；⚠️「不挂插件」属配置约定，结构保证须 1b 兜底（共享 `node_modules` 可写） | 判定实例读不到自己的长期记忆库；对照实例「**记忆面相同、上下文面不同**」 |
| 12 | **D-8 结构可识别** | 最容易，几乎纯设计 | 🟢 | schema 约定＋门牌（ID＋标题）＋备份；⛔ 门牌不含路径/条目数 | 非当事方只凭门牌＋备份走通「识别→挂载→导出」 |
| 13 | **索引层优先于召回层** | 做得到，且成本低于向量召回 | 🟢 | 一份可查的索引（checkpoint／memory directory）＋指针语义；⚠️ **现状：Chroma 只写不读（句柄无 `query`），召回＝`ORDER BY id DESC LIMIT ?` ⇒ 索引层尚无消费方**；顺序应为 **契约 →（定义消费关系）→ 索引 → 召回** | 新会话只凭索引回答「我在哪、等谁、下一步」 |
| 14 | **稳定 ID／版本／tombstone** | 做得到 | 🟢 | schema 迁移＋**第一次导入是赋号**；原平台 ID 进 provenance | 旧 ID 迁移后仍解析到同一条；改＝新增版本、删＝打标 |
| 15 | **导出／迁移** | 做得到 | 🟢 | JSONL＋版本头＋规范化规则；**重建脚本目前缺失**（已核）。**规范化脚本＋版本号必须先于判据存在**；`created_at` 写 `localtime` 且无时区标记（`index.ts:113`）⇒ 规范化第一条＝**时间带显式偏移**；重建脚本 ⛔ 建在自增行 id 上（索引主键依赖契约），**进入住闸** | 导出→导入空库→再导出，规范化后逐字节相等；**索引重建（补）＝ Chroma id 集合 ＝ SQLite id 集合，且逐条 document 与 content 逐字相等**（top-k 判据当前无可执行路径） |
| 16 | **「自愿」的直接观测** | 不可观测 | ⛔ | 只能三项留痕替代 | — |
| 17 | **悄悄替换的事后发现** | 事后也发现不了 | ⛔ | 只能靠稳定 ID＋「换代必须留痕」压缩 | — |
| 18 | **「她当时没被改过」** | 不可证 | ⛔ | 所以「先切共享区写权限」在一切判定之前 | — |

> **D-4 的取证过程（10-21 实核，供复算）**：
> - `fresh`／`fork` **不是两套沙箱**，只是起 teammate 时选哪个 subagent provider：`provider: options.provider ?? (context === 'fork' ? 'fork' : 'spawn')`（**DSH 源码仓**内 `packages/experimental/agent-team/tests/team.spec.ts:114-120`；⚠️ 本机不可复算，见上方复核修订）。测试断言 `fork` 的 `header.isSeeded === true`、`fresh === false`（同文件 `:220-221`）⇒ **fresh 只证明「父会话事件没被 fork 进来」**。
> - 记忆插件的召回是 `SELECT id, content, created_at FROM memories ORDER BY id DESC LIMIT ?`（`harness/packages/plugin-s4-memory/src/index.ts:115-116`）——**没有 `WHERE session_id`**；`session_id` 只用于写入去重（唯一索引 `(session_id, source_event_seq)`）。⇒ 只要挂同一个 `dbPath`，fresh 出来的实例**照样召回同一池记忆**。
> - 落法：判定实例用**独立 DSH_HOME ＋ profile 不挂 `plugin-s4-memory`**（只换 profile、共用 home 不够），或把 `dbPath` 指向空库（空库会多留一个可写面，不如不挂）；这一步在 DSH 里是配置动作（🟢），但**不是 `context: 'fresh'` 自带的**。

> **⚠️ 2026-10-22 复核修订（A4 三家；细节与出处见主稿 §H.7）**：
> - **#11 证据链**：`agent-team/tests/team.spec.ts` 是 **DSH 源码仓**内路径，本机只有发布包、无源码与测试 ⇒ **该条不可本机复算，按 §3.1 降 🟡**；结论改由发布包类型契约支撑 🟢（`dsh-agent/lib/types/index.d.ts:55,67,73,75-81`；复算命令见 A4-Claude 补遗）。另：判定实例真正要换的是 **DSH_HOME**，不是 profile 名；「不挂插件」属配置约定——**10-22 实跑已证实：把 fake 插件放进共享 `profiles/node_modules` ＋ patch 挂载，启动即激活（负向不挂则不出）** ⇒ 独立 home 只换场地，挡不住配置层；结构保证须 1b 兜底。
> - **#15 索引重建判据**：T2 原「重建后 top-k 文本集合一致」**不可执行**（Chroma 句柄无 `query`）⇒ 改为「**id 集合 ＋ document 逐字相等**」；重建脚本 ⛔ 建在自增行 id 上，且**进入住闸**。
> - **#13 现状**：Chroma 只写不读 ⇒ 「索引层优先」当前**没有消费方**；顺序＝契约 →（定义消费关系）→ 索引 → 召回。
> - **档位复核（A4-Claude 一）**：真打折 #1／#3／#12；限状态 #9／#11／#15；#2 首日必红（探测期望值须按档参数化）；#10 会被放宽（消息类型白名单）。判据：🟢 成立＝**能构造失败态**，不是「有路径」。

> **一句话**：需求层没有「不可能」，但「物理隔离」四个字必须按档写——砚砚的 1a／1b 拆分不是保守，是准确。**1b、2b、3b 三件同卡在「第二信任域」上**：不是写多少代码的问题，是有没有第二个能对 `agent` 说「不」的身份/机器。

## 二、现成系统：能借什么、不能借什么

| 系统 | 核心机制（已核） | 对本稿最有用的一条 | 不能照搬 |
|---|---|---|---|
| **Letta**（MemGPT） | core memory blocks 常驻 prompt、由 agent 用工具编辑；recall 自动落盘；archival 按需检索；sleep-time compute 在空闲时整理，**只编辑 core blocks** | **「常驻核心块 ＋ 可检索档案」两层**——正好对应「索引层 ＋ 召回层」；块是天然的授权粒度 | 默认单 agent；没有「另一个人格不可读」的边界 |
| **Mem0** | `user_id／agent_id／app_id／run_id` 四元 scope；抽取式 add／update／delete；图记忆 | **scope 四元组**：`agent_id` 解决归属、`app_id` 解决「同一户的公共区」、`run_id` 解决会话 | 隔离靠过滤条件＝本稿明确拒绝的「同库＋过滤」；更新是抽取合并，**不是版本链** |
| **Zep／Graphiti** | **bi-temporal**：valid time（世界何时为真）＋ ingestion time（我们何时知道）；旧事实 `invalid_at` 而非删除；可按时间点查历史状态 | **P2「改口不覆盖」的现成形态**：旧条目留有效区间，「他什么时候改的口」可查 | 图为重、成本高；实体抽取会改写原文语义 |
| **MemOS** | **MemCube**（content ＋ metadata）支持 tracking／fusion／migration；三层（API／调度／存储）；Plaintext／Activation／Parameter 三类记忆 | **可迁移单元**：导出＝单文件＋版本头＋provenance，正好接本稿「导出契约」 | 面向单模型记忆调度，不是多 agent 隔离 |
| **MIRIX** | 六类记忆（Core／Episodic／Semantic／Procedural／Resource／Knowledge Vault），各自专用 agent 管理 | **私域内部的分块**可借：存储模块划分，不是需求分层；Knowledge Vault 对应「受控共享」 | 六类分法与老大「画像不单列」冲突，⛔ 不得当需求层 |
| **A-MEM** | Zettelkasten 式动态索引：笔记＋链接＋自演化 | **「索引层」有学术对应物**：先建可检索的链接索引，再谈向量 top-k | 自动链接会引入不可控的「记忆间串门」 |
| **Cognee** | ECL pipeline（Extract → Cognify → Load）：原文→实体/关系/块，图＋向量＋关系三路检索 | **可重建**：真相源→派生索引的管道，正合 P2 与「向量视为派生」 | 管道重、单机成本高；不是权限模型 |
| **多 agent 架构研究**（Zylos 2026-03） | 三种模式：集中／分布式／混合；三层：global／group-role／private；**namespace 隔离是最低可行安全模式**；多数框架无内建访问控制 | 行业把「逻辑隔离」当默认，本稿要求**高出一档**（物理隔离）——这是有意的，不是重复造轮子 | ⛔ 不要把「scoped sharing」当成物理隔离；它只是过滤条件 |

> 检索范围补充：Letta／Mem0／Zep／MemOS／MIRIX／A-MEM／Cognee 均核到官方文档或论文；未逐行读源码的机制已标 🟡。2026 年的系统对比文章很多（见文末来源），只取与本稿直接相关的机制，⛔ 不按榜单选型。

## 三、三条最值得抄的具体设计

### 1. Scope 四元组（Mem0）→ 落到「归属」

`agent_id`（谁的）＋ `app_id`／household（哪个家）＋ `domain: private|shared`（哪一域）＋ `run_id`（哪次会话）。

- 本稿现状：归属靠「库文件在谁的目录下」推断（C5 实核：无 `agent_id` 字段）⇒ **迁移即失、跨库合并必撞**。
- 落法：每条记忆带 `agent_id` ＋ `domain` ＋ `provenance`；共享条目另带 `writer`（写权归属）。
- 判据：跨库合并**零 ID 冲突**；按 `agent_id` 过滤的漏读率 0。

### 2. Bi-temporal（Zep／Graphiti）→ 落到「改口不覆盖」

每条两个时间轴：`valid_from／valid_to`（事实在世界里何时为真）＋ `ingested_at`（我们何时知道）。

- 改口＝旧条目 `valid_to` 打点 ＋ 新增一条；⛔ 原地覆盖。
- 落法：P2 从一句原则变成两个字段；共享区「他什么时候改的口」直接可查。
- 判据：改一条 → 旧版本可读、旧 ID 仍解析；按任意历史时间点查询应返回当时有效的版本。

### 3. MemCube 式导出（MemOS）→ 落到「可迁移」

单文件＝content ＋ metadata（来源、版本、归属、创建时间）＋ 版本头；支持 tracking／fusion／migration。

- 落法：本稿「导出契约」＋「第一次导入是赋号不是搬家」（原平台 ID 进 provenance）。
- 判据：导出 → 导入空库 → 再导出，**规范化后逐字节相等**；「规范化」规则本身要脚本化＋版本号（否则「相等」可事后加忽略项凑出来）。

## 四、不能照搬的三点（拓扑不同）

1. **隔离对象相反**：业界是「一个 agent 服务多个用户」，隔离维度是 user／tenant；LA 是「多个 agent 共处一个用户」，隔离维度是 **agent**。Mem0 的 `agent_id` 只是它的 scope 之一，到 LA 要反过来当主键。
2. **记忆的地位不同**：业界把记忆当「检索增强」，删错一条是质量问题；LA 把记忆当**人格本体**，删错一条是 P5 事故。⇒「不物理删＋tombstone」在业界是加分项，在这里是**底线**。
3. **共享默认相反**：Zylos 的结论是「global by default, namespace for sensitive」；LA 是「**private by default, shared by explicit**」。⇒ 共享区不能按「默认全开、敏感除外」设计，必须逐条授权。

## 五、建议的验证顺序（按「不可逆先行」）

1. **数据契约**（稳定 ID／agent_id／provenance／版本／tombstone／导出）→ 先跑 P2 回归。**成本最低，卡住后面所有判据**。
2. **隔离探测**（正向／反向，shell 开启）→ 验 1b 当前档位。⛔ 别在文档里写「物理隔离已完成」。
3. **备份异权 ＋ 恢复演练** → 验 2b；同账号先标「空条款」。
4. **C′ 保护动作演练**（写冻结 → 快照 → 恢复 → 告知）→ 验「保」档不依赖同意。
5. **判定实例实装**（fresh ＋ **独立 profile／空库** ＋ 异源）→ ✅ fresh 与记忆库已核清**互不相干**（见 §一 取证块）⇒ 前置不再是"测 fresh 管不管用"，而是"**配一个不挂记忆插件的 profile**"；配不出来才退回「异源 ＋ 只读输入」。
6. **结构盲演**（非当事方凭门牌＋备份走通「识别→挂载→导出」）。

> 第 1 条不立，P2／P5 的回归会在**第一次迁移**就红。第 2、3 条决定「物理隔离」这个词算不算数。第 5 条是 D-4 能不能启动的前置。

## 附 · 检索来源（2026-10-21）

- Zep, [Temporal Knowledge Graph](https://www.getzep.com/ai-agents/temporal-knowledge-graph/)；[Zep 论文 arXiv:2501.13956](https://arxiv.org/abs/2501.13956)
- Letta, [Agent Memory](https://www.letta.com/blog/agent-memory/)；[Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute/)
- Mem0, [Entity-Scoped Memory](https://docs.mem0.ai/platform/features/entity-scoped-memory)；[How Mem0 Works](https://docs.mem0.ai/core-concepts/how-it-works)
- MemOS, [arXiv:2505.22101](https://arxiv.org/html/2505.22101v1)；[Hugging Face 论文页](https://huggingface.co/papers/2507.03724)
- MIRIX, [arXiv:2507.07957](https://arxiv.org/abs/2507.07957)；[GitHub](https://github.com/Mirix-AI/MIRIX)
- A-MEM, [arXiv:2502.12110](https://arxiv.org/abs/2502.12110)；[NeurIPS 2025 poster](https://neurips.cc/virtual/2025/poster/119020)
- Cognee, [How Cognee Builds AI Memory](https://www.cognee.ai/how-cognee-builds-ai-memory)；[Data Flows](https://docs.cognee.ai/core-concepts/data-flows)
- 多 agent 架构研究, [AI Agent Memory Architectures for Multi-Agent Systems（Zylos, 2026-03）](https://zylos.ai/research/2026-03-09-multi-agent-memory-architectures-shared-isolated-hierarchical/)
- 2026 系统对比（仅作背景，⛔ 不按榜单选型）：[Developers Digest](https://www.developersdigest.tech/blog/best-ai-agent-memory-providers-2026)／[N1N](https://explore.n1n.ai/blog/ai-agent-memory-comparison-2026-mem0-zep-letta-cognee-2026-04-23)／[PuppyOne](https://www.puppyone.ai/en/blog/best-ai-agent-memory-platforms)
