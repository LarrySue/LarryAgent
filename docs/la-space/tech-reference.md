# 记忆归属与隔离 · 技术可行性参考

> **用途**：立项附件——回答「技术层能不能做到」，以及现成 Agent 记忆系统能借什么。
> **性质**：**技术依据**，⛔ 不是需求结论、⛔ 不代表已拍；需求口径一律以 `docs/la-space/requirements.md` 为准。
> **证据分级**：🟢 实跑 ／ 🟡 只读源码、官方文档或间接证据 ／ ⛔ 未验或理论天花板。⚠️ 本件有两套档位：§一表格的**可行性档**（🟢 有现成路径）与引用处的**证据档**分开读；证据 🟢 仅指本机实跑。
> **日期**：初版 2026-10-21；复核 2026-10-22；基础设施候选出处复核 2026-10-24。

---

## 〇、结论先行

1. **五处高风险点没有「技术上做不到」的**。但有三处必须**换边界**、一处必须**先实测**：
   - **换边界**：物理不可读（1b）／备份异权（2b）／留痕改不了（3b）——同 OS 账号、应用层内无解，需独立账号、容器或**第二信任域**。
   - **已核清**：D-4 的「fresh 判定实例」——`context: 'fresh'` **只保证不继承上下文，跟记忆库毫无关系**；本仓记忆召回是**全库最近 N 条、不过滤 session**。⇒ 判定实例必须**独立 DSH_HOME ＋ 不挂记忆插件的 profile**（或把 `dbPath` 指向空库），只换 profile 不够；光开 fresh 也不够。
2. **业界开源框架普遍没做到 LA 要的隔离强度**：多 agent 记忆的通行做法是 namespace 逻辑隔离，**多数框架没有内建访问控制**（Zylos 2026-03 研究）⇒ 不能指望「找个现成件装上」，但能借它们的**数据契约**和**索引形态**。
3. **最值得先做的不是向量召回，是数据契约 ＋ 索引层**：成本最低，且决定 P2／P5、迁移、审计能不能成立。⚠️ **顺序修正**：索引层当前**无消费方**（Chroma 双写未启用：没在写＋想启也启不了＋读路径也没有）、重建脚本缺失 ⇒ **契约在先**，再定义消费关系。
4. **第二信任域不需要自研隔离件**：1b 用独立 OS 账号／容器，2b 用 NAS 快照／对象存储 WORM，3b 用远端 git 保护／对象锁——都是**现成基础设施**，代价是运维与成本（🟡 通用方案，未逐项本机实测）。**自研面集中在数据契约／索引／拒绝载体，不落在隔离本身**。

---

## 一、高风险点的技术分档

**档位**：🟢 有现成路径 ／ 🟡 可做但需换边界或新增工程 ／ 🔴 当前架构给不了 ／ ⛔ 理论天花板（诚实承认，不作承诺）

| # | 风险点 | 判断 | 档 | 关键依赖／缺口 | 最小验证 |
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
| 11 | **D-4 判定实例** | **可以做到，但 fresh 只是半件** | 🟢 | ✅ 已核：`fresh` 的实现＝换 provider（`fork`→fork／否则 `spawn`），`isSeeded` 有断言〔⚠️ 原引证在 **DSH 源码仓**内，本机不可复算；改用发布包类型契约 🟡（只读类型声明，未实跑）〕；🔴 但记忆召回不过滤 session（`plugin-s4-memory/src/index.ts:115-116`）⇒ 同 `dbPath`＝同池。判定实例须**独立 DSH_HOME ＋ profile 不挂记忆插件／指向空库**（只换 profile 共用 home 不够）；⚠️「不挂插件」属配置约定，结构保证须 1b 兜底（共享 `node_modules` 可写） | 判定实例读不到自己的长期记忆库；对照实例「**记忆面相同、上下文面不同**」 |
| 12 | **D-8 结构可识别** | 最容易，几乎纯设计 | 🟢 | schema 约定＋门牌（ID＋标题）＋备份；⛔ 门牌不含路径／条目数 | 非当事方只凭门牌＋备份走通「识别→挂载→导出」 |
| 13 | **索引层优先于召回层** | 做得到，且成本低于向量召回 | 🟢 | 一份可查的索引（checkpoint／memory directory）＋指针语义；⚠️ **现状：Chroma 双写未启用（没在写＋想启也启不了＋读路径也没有）；召回＝`ORDER BY id DESC LIMIT ?` ⇒ 索引层尚无消费方**；顺序应为 **契约 →（定义消费关系）→ 索引 → 召回** | 新会话只凭索引回答「我在哪、等谁、下一步」 |
| 14 | **稳定 ID／版本／tombstone** | 做得到 | 🟢 | schema 迁移＋**第一次导入是赋号**；原平台 ID 进 provenance | 旧 ID 迁移后仍解析到同一条；改＝新增版本、删＝打标 |
| 15 | **导出／迁移** | 做得到 | 🟢 | JSONL＋版本头＋规范化规则；**重建脚本目前缺失**（已核）。**规范化脚本＋版本号必须先于判据存在**；`created_at` 写 `localtime` 且无时区标记（`index.ts:113`）⇒ 规范化第一条＝**时间带显式偏移**；重建脚本 ⛔ 建在自增行 id 上（索引主键依赖契约），**进入住闸** | 导出→导入空库→再导出，规范化后逐字节相等；**索引重建（补）＝ Chroma id 集合 ＝ SQLite id 集合，且逐条 document 与 content 逐字相等**（top-k 判据当前无可执行路径） |
| 16 | **「自愿」的直接观测** | 不可观测 | ⛔ | 只能三项留痕替代 | — |
| 17 | **悄悄替换的事后发现** | 事后也发现不了 | ⛔ | 只能靠稳定 ID＋「换代必须留痕」压缩 | — |
| 18 | **「她当时没被改过」** | 不可证 | ⛔ | 所以「先切共享区写权限」在一切判定之前 | — |

**D-4 取证（供复算）**：

- `fresh`／`fork` **不是两套沙箱**，只是起 teammate 时选哪个 subagent provider：`provider: options.provider ?? (context === 'fork' ? 'fork' : 'spawn')`（**DSH 源码仓**内 `packages/experimental/agent-team/tests/team.spec.ts:114-120`；⚠️ 本机不可复算）。测试断言 `fork` 的 `header.isSeeded === true`、`fresh === false`（同文件 `:220-221`）⇒ **fresh 只证明「父会话事件没被 fork 进来」**。
- 记忆插件召回：`SELECT id, content, created_at FROM memories ORDER BY id DESC LIMIT ?`（`harness/packages/plugin-s4-memory/src/index.ts:115-116`）——**没有 `WHERE session_id`**；`session_id` 只用于写入去重（唯一索引 `(session_id, source_event_seq)`）。⇒ 只要挂同一个 `dbPath`，fresh 出来的实例**照样召回同一池记忆**。
- 落法：判定实例用**独立 DSH_HOME ＋ profile 不挂 `plugin-s4-memory`**（只换 profile、共用 home 不够），或把 `dbPath` 指向空库（空库会多留一个可写面，不如不挂）；这一步在 DSH 里是配置动作（可行性 🟢），但**不是 `context: 'fresh'` 自带的**。

**2026-10-22 复核修订**：

- **#11 证据链**：`agent-team/tests/team.spec.ts` 是 **DSH 源码仓**内路径，本机只有发布包、无源码与测试 ⇒ 该条**不可本机复算**、按 🟡 看待；结论改由发布包类型契约支撑 🟡（只读类型声明，未实跑；`dsh-agent/lib/types/index.d.ts:55,67,73,75-81`）。另：判定实例真正要换的是 **DSH_HOME**，不是 profile 名；「不挂插件」属配置约定——**10-22 实跑已证实：把 fake 插件放进共享 `profiles/node_modules` ＋ patch 挂载，启动即激活（负向不挂则不出）** ⇒ 独立 home 只换场地，挡不住配置层；结构保证须 1b 兜底。
- **#15 索引重建判据**：原「重建后 top-k 文本集合一致」**不可执行**（Chroma 句柄无 `query`）⇒ 改为「**id 集合 ＋ document 逐字相等**」；重建脚本 ⛔ 建在自增行 id 上，且**进入住闸**。
- **#13 现状**：Chroma 只写不读 ⇒ 「索引层优先」当前**没有消费方**；顺序＝契约 →（定义消费关系）→ 索引 → 召回。
- **档位复核**：真打折 #1／#3／#12；限状态 #9／#11／#15；#2 首日必红（探测期望值须按档参数化）；#10 会被放宽（消息类型白名单）。判据：🟢 成立＝**能构造失败态**，不是「有路径」。

> **一句话**：需求层没有「不可能」，但「物理隔离」四个字必须按档写——1a／1b 拆分不是保守，是准确。**1b、2b、3b 三件同卡在「第二信任域」上**：不是写多少代码的问题，是有没有第二个能对 agent 说「不」的身份／机器。

---

## 二、现成系统：能借什么、不能借什么

| 系统 | 核心机制（已核） | 对 LA 最有用的一条 | 不能照搬 |
|---|---|---|---|
| **Letta**（MemGPT） | core memory blocks 常驻 prompt、由 agent 用工具编辑；recall 自动落盘；archival 按需检索；sleep-time compute 在空闲时整理，**只编辑 core blocks** | **「常驻核心块 ＋ 可检索档案」两层**——正好对应「索引层 ＋ 召回层」；块是天然的授权粒度 | 默认单 agent；没有「另一个人格不可读」的边界 |
| **Mem0** | `user_id／agent_id／app_id／run_id` 四元 scope；抽取式 add／update／delete；图记忆 | **scope 四元组**：`agent_id` 解决归属、`app_id` 解决「同一户的公共区」、`run_id` 解决会话 | 隔离靠过滤条件＝LA 明确拒绝的「同库＋过滤」；更新是抽取合并，**不是版本链** |
| **Zep／Graphiti** | **bi-temporal**：valid time（世界何时为真）＋ ingestion time（我们何时知道）；旧事实 `invalid_at` 而非删除；可按时间点查历史状态 | **P2「改口不覆盖」的现成形态**：旧条目留有效区间，「他什么时候改的口」可查 | 图为重、成本高；实体抽取会改写原文语义 |
| **MemOS** | **MemCube**（content ＋ metadata）支持 tracking／fusion／migration；三层（API／调度／存储）；Plaintext／Activation／Parameter 三类记忆 | **可迁移单元**：导出＝单文件＋版本头＋provenance，正好接 LA「导出契约」 | 面向单模型记忆调度，不是多 agent 隔离 |
| **MIRIX** | 六类记忆（Core／Episodic／Semantic／Procedural／Resource／Knowledge Vault），各自专用 agent 管理 | **私域内部的分块**可借：存储模块划分，不是需求分层；Knowledge Vault 对应「受控共享」 | 六类分法与「画像不单列」冲突，⛔ 不得当需求层 |
| **A-MEM** | Zettelkasten 式动态索引：笔记＋链接＋自演化 | **「索引层」有学术对应物**：先建可检索的链接索引，再谈向量 top-k | 自动链接会引入不可控的「记忆间串门」 |
| **Cognee** | ECL pipeline（Extract → Cognify → Load）：原文→实体/关系/块，图＋向量＋关系三路检索 | **可重建**：真相源→派生索引的管道，正合 P2 与「向量视为派生」 | 管道重、单机成本高；不是权限模型 |
| **多 agent 架构研究**（Zylos 2026-03） | 三种模式：集中／分布式／混合；三层：global／group-role／private；**namespace 隔离是最低可行安全模式**；多数框架无内建访问控制 | 行业把「逻辑隔离」当默认，LA 要求**高出一档**（物理隔离）——这是有意的，不是重复造轮子 | ⛔ 不要把「scoped sharing」当成物理隔离；它只是过滤条件 |

> 检索范围：Letta／Mem0／Zep／MemOS／MIRIX／A-MEM／Cognee 均核到官方文档或论文；未逐行读源码的机制已标 🟡。⛔ 不按榜单选型。

---

## 三、三条最值得借的具体设计

### 1. Scope 四元组（Mem0）→ 落到「归属」

`agent_id`（谁的）＋ `app_id`／household（哪个家）＋ `domain: private|shared`（哪一域）＋ `run_id`（哪次会话）。

- 现状：归属靠「库文件在谁的目录下」推断（实核：无 `agent_id` 字段）⇒ **迁移即失、跨库合并必撞**。
- 落法：每条记忆带 `agent_id` ＋ `domain` ＋ `provenance`；共享条目另带 `writer`（写权归属）。
- 判据：跨库合并**零 ID 冲突**；按 `agent_id` 过滤的漏读率 0。

### 2. Bi-temporal（Zep／Graphiti）→ 落到「改口不覆盖」

每条两个时间轴：`valid_from／valid_to`（事实在世界里何时为真）＋ `ingested_at`（我们何时知道）。

- 改口＝旧条目 `valid_to` 打点 ＋ 新增一条；⛔ 原地覆盖。
- 落法：P2 从一句原则变成两个字段；共享区「他什么时候改的口」直接可查。
- 判据：改一条 → 旧版本可读、旧 ID 仍解析；按任意历史时间点查询应返回当时有效的版本。

### 3. MemCube 式导出（MemOS）→ 落到「可迁移」

单文件＝content ＋ metadata（来源、版本、归属、创建时间）＋ 版本头；支持 tracking／fusion／migration。

- 落法：LA「导出契约」＋「第一次导入是赋号不是搬家」（原平台 ID 进 provenance）。
- 判据：导出 → 导入空库 → 再导出，**规范化后逐字节相等**；「规范化」规则本身要脚本化＋版本号（否则「相等」可事后加忽略项凑出来）。

---

## 四、不能照搬的三点（拓扑不同）

1. **隔离对象相反**：业界是「一个 agent 服务多个用户」，隔离维度是 user／tenant；LA 是「多个 agent 共处一个用户」，隔离维度是 **agent**。Mem0 的 `agent_id` 只是它的 scope 之一，到 LA 要反过来当主键。
2. **记忆的地位不同**：业界把记忆当「检索增强」，删错一条是质量问题；LA 把记忆当**人格本体**，删错一条是 P5 事故。⇒「不物理删＋tombstone」在业界是加分项，在这里是**底线**。
3. **共享默认相反**：Zylos 的结论是「global by default, namespace for sensitive」；LA 是「**private by default, shared by explicit**」。⇒ 共享区不能按「默认全开、敏感除外」设计，必须逐条授权。

---

## 五、建议的验证顺序（按「不可逆先行」）

1. **数据契约**（稳定 ID／agent_id／provenance／版本／tombstone／导出）→ 先跑 P2 回归。**成本最低，卡住后面所有判据**。
2. **隔离探测**（正向／反向，shell 开启）→ 验 1b 当前档位。⛔ 别在文档里写「物理隔离已完成」。
3. **备份异权 ＋ 恢复演练** → 验 2b；同账号先标「空条款」。
4. **C′ 保护动作演练**（写冻结 → 快照 → 恢复 → 告知）→ 验「保」档不依赖同意。
5. **判定实例实装**（fresh ＋ **独立 DSH_HOME ＋ 不挂记忆插件的 profile／空库** ＋ 异源）→ 前置不是「测 fresh 管不管用」，而是「**配一个独立 DSH_HOME、不挂记忆插件的判定环境**」；配不出来才退回「异源 ＋ 只读输入」。
6. **结构盲演**（非当事方凭门牌＋备份走通「识别→挂载→导出」）。

> 第 1 条不立，P2／P5 的回归会在**第一次迁移**就红。第 2、3 条决定「物理隔离」这个词算不算数。第 5 条是 D-4 能不能启动的前置。

---

## 六、现成实现补调研（2026-10-22）

> **目的**：回答「有没有成熟件能直接用／少自研」，⛔ 不是再做一轮框架综述。§二／§三 的 7 个框架扫描为底，**只收增量**；不按榜单选型。
> **边界**：不改变已定五项；发现新取向原样报裁；⛔ 不安装／不改真实仓库／不动 key。

### 6.1 隔离三硬点：零自研（配置＋现成基础设施）

| 硬点 | 首选 | 备选 | 不选 | 成本／前提 | 最小验证 | 证据 |
|---|---|---|---|---|---|---|
| **1b 物理不可读** | **Windows 独立账号＋NTFS ACL**（本机即可 **1b 自身档 1**；⚠️ 此「档 1」⛔ **非 D-7 档 1**）；生产优先**容器** | Landlock CLI（须由外层启动链套上，**自愿式**：进程自己戴镣铐不算） | WSL2 双层 | OS 内置；运维＝每 agent 一账号＋启动链（runas／计划任务） | 双账号互测、**shell 开启**：自己读自己 OK；agent 账号读别人库 → denied | 🟡 官方文档／通用知识；**零实测** |
| **2b 备份异权** | **对象存储 WORM（compliance 模式）** | NAS 只读快照／异地物理容灾（家里已有雏形） | 网盘回收站／版本历史 | 五仓 <1GB ⇒ 月成本 <$0.01；**root 凭证离线＋MFA** | 建桶＋compliance 30 天；agent 凭证删 → fail；**root 删 → 同样 fail**；恢复 hash 一致 | 🟡 AWS 原文抽验（只读官方文档，未实跑）：compliance 下含 root 任何用户不可删，提前删唯一方法是注销账号 |
| **3b 留痕改不了** | **远端 git 保护**（GitHub Pro 或 Gitea 自建）＋**审计流进 WORM 桶**（与 2b 共用） | 自建 bare repo＋pre-receive hook（待验） | immudb（许可有变数） | ⚠️ **GitHub Free 私有仓无 branch protection**（官方页只写公开仓免费；私有仓需付费计划，具体档位以定价页为准）；admin 钥匙在 agent 外 | agent（无 admin）amend＋force push → remote 拒；审计条改写 → 拒 | 🟡 官方文档＋社区双证；方向已核 |
| **共同前提** | **第二信任域 root 在 agent 之外**（老大或审计位持有，凭证不入任何 agent 可读区）；1b 提权钥匙与 3b admin **分持** | | | **不成立则以上全部退化为空条款**（与「同账号备份＝空条款」同构） | 凭证不在 agent 可读区 | 已核 |

#### 候选失败态与验证边界（2026-10-22 调研，2026-10-28 承接）

只补候选边界，不改变上表选型结论。以下均为机制分析／待验设计，**未实跑攻击或恢复验证**；来源索引见 §七。原候选编号仅用于对照，不另开待批事项。

| 原编号／候选 | 失败态或不选理由 | 验证补充／约束 |
|---|---|---|
| 1b-A 独立账号＋ACL | ① agent 持管理员／UAC 提权可改 ACL；② 共享 `node_modules`／Temp 等公共写面漏 | 启动链必须落普通用户，harness 不给提权工具；ACL 须连 home 全套收口。双账号、shell 开启下自己读成功／跨账号读拒绝；自身 profile 封删的限制另见 §6.3 |
| 1b-B 每 agent 一容器 | `--privileged`／错 volume 暴露隔离外资源；镜像内 apt 漂移 | home／`node_modules` 各自独立、镜像 pin 版本；容器读挂载外路径应失败。原候选另含进程边界、资源上限；Windows 要 WSL2 后端，运维成本高于原生 ACL |
| 1b-C Landlock CLI | 启动链若在 agent 可控范围即可选择不戴「镣铐」；内核 <5.13 不可用 | 无需 root、无需 daemon；外层启动方套 ruleset，反向读应 EACCES；Windows 无此路径。原候选族为 rstrict／sandboxec／sandlock，第三件仅保留候选名，无独立来源，不据此推荐 |
| 1b-D WSL2 独立发行版＋独立账号 | 双层复杂度无对应增量 | vhdx 物理分离＋ACL，原评估运维翻倍；不选 |
| 2b-A 对象存储 WORM | root 凭证泄露（compliance 救不了账号被接管）；欠费／账号被关可导致数据不可用或事实删除 | 原最小验证还要求建桶开启版本，agent 凭证只读＋写新、无 delete；该凭证删除失败只证权限拒绝，须结合主表 root 同样删不了的验证，不能单独证明 compliance。root 离线保管＋MFA，不进任何 agent 可读区；不能把保留期内的对象保护外推为账号生命周期保证。小额年付仅为原建议，不是防护证明 |
| 2b-B NAS 只读快照 | NAS 管理凭证若在 agent 可读位置即破功；快照保留期 < 威胁窗口 | btrfs／zfs 异机快照；工作机不挂载／只读挂载，agent 不能管理 NAS；恢复 hash 一致。原建议与 2b-A 构成「物理异权 × 制度异权」互补对，保留建议、不改变主表备选定位；已有异地容灾雏形不等于本次已验收 |
| 2b-C 网盘回收站／版本历史 | 保留期满真删除、账号持有者可清空回收站；异权强度不足 | 只作便利恢复层，不作为不可删的制度保证 |
| 3b-A 远端 git 保护分支 | admin 可关保护；平台账号接管 | admin 在 agent 外；拒强推／删分支的同时，常规 push 应成功。原调研另列 GitLab CE 自建（免费内置保护分支），本轮未独立核实，不改变主表选型；Gitee 免费档覆盖面未核，不补作推荐 |
| 3b-B bare repo＋pre-receive hook | 机器 SSH 直入改 ref，可绕过接收钩子 | signed push 为设计选项（见下），不是失败态；需要常开远端，仍为待验备选 |
| 3b-C 审计流进 WORM 桶 | **上桶前的本地窗口仍可改** | 推送节奏（实时／每小时）是残余风险面；本地留痕仍需 3b-A／B 兜底。原设想为 JSONL 逐条 append，入桶后改第 k 条应拒、回读 hash 一致，与 2b-A 共用基础设施 |
| 3b-D immudb | 许可有变数未核；引入新组件违背当前轻量取向 | Merkle 证明式库不因此自动满足异权；当前不借 |

**3b-B 口径订正**：`signed push` 签的是推送请求（push certificate），**不等于签名 commit**；本机 `git push -h` 可见 `--signed` 的说明为 `GPG sign the push`。签名钥匙在 agent 外的设想，须由外部推送环节签名，并由服务端检查、拒绝未签名／不受信的推送；原调研将其写成「拒未签名提交」不准确。原提「签名＋定期 `git fsck` 巡检兜」也不能当 SSH 直改 ref 已被防住：`fsck` 不提供 ref 历史不可改保证。这里保留风险与待验设计，不升级为已实现保障。

**2b-A 保留策略细节**：原调研对 OSS BucketWorm 记录为 1 天～70 年、锁定前 24h 反悔窗、锁定后策略本身不可删；当时指南标注 2026-10-08 更新，现仅 API 参考页复得（§七）。这些是未重新独立核实的历史转录，不能跨云套用；AWS compliance 与 governance 的差别仍按各自文档核对，governance 可被 bypass 权限绕过。

### 6.2 契约／索引／导出：直接嵌 0 个、自研面不变

| 借什么 | 来源 | 落法（DSH） | 不借／注意 |
|---|---|---|---|
| **版本链＋状态机** | MemOS | `memories` 加 `version`／`status`／`archived_from`；update＝旧行 archived、新行 version+1；**补借**：`update_type`（conflict／duplicate／extract／unrelated／feedback）＋`timespec`（按版本选时间点） | 不迁移则 update 原地覆盖（**本仓现状**） |
| **删除留痕（history）** | Mem0 | 删除前 `add_history(old_memory=prev_value, event="DELETE", is_deleted=1, actor_id/role)` ⇒ **删除前全文永久可查** | 不是「不留底」，恰是可借的**删除留痕参照**；仍不嵌代码（Python 栈） |
| **软删／硬删分离** | MIRIX | `is_deleted` 默认 0；删除只置 1；召回 SQL 加 `WHERE is_deleted=0`；维护脚本才 hard_delete | 软删后召回不过滤 ⇒ 已删记忆仍被注入（泄露） |
| **稳定 id＋legacy_id** | Cognee | uuid 主键；原自增 id 进 `legacy_id`；**Chroma id 改用 uuid** | 外部引用按自增行 id（**本仓现状**）⇒ 迁移／重建断链 |
| **scope 四元组** | Mem0 | 每条带 `agent_id`＋`domain`＋`provenance`；共享条另带 `writer` | 只有 `session_id`（本仓现状）⇒ 跨库合并必撞 |
| **时间轴** | Graphiti | `valid_at`／`invalid_at` 打点，按时间点查 | 本体物理删，负不起「改口不覆盖」 |
| **目录树＋frontmatter** | Letta `memfs-v2` | 生成 `MEMORY.md` 树＋`description` 校验；DSH 读成索引 | 只借布局与 hook，不嵌代码（其 client／agent 耦合重） |
| **导出＋重建** | **无现成** | 自研：JSONL＋版本头＋规范化脚本＋导入赋号＋**索引重建脚本**（判据＝id 集合＋document 逐字相等） | 7 家均无「导出规范化＋版本号＋重建脚本」；MemOS 最接近但无版本头、无规范化 |
| **索引层** | 无外部件 | `memories` 加索引列／视图＋目录渲染（纯 SQL，无新依赖） | 7 家没有「从真相源逐条重建向量索引」的现成脚本 |

> **能直接嵌 0 个**：7 家里 6 家 Python（与本仓 TS／`node:sqlite` 栈不同）；唯一 TS 的 Letta 与自身 client／backend／agent 强耦合，剥离成本高于自研。⇒ **契约层自研，只借设计**。
> **抽验记录**（均只读原文／源码，未实跑 ⇒ 证据 🟡）：AWS Object Lock compliance 原文（含 root 不可删）；MemOS `textual/item.py:61-128` 的 `version`／`status`／`history`／`archived_memory_id`；MIRIX `sqlalchemy_base.py:428-450` 软删／硬删；Cognee `Data.py:33,52-57` uuid＋`legacy_id`；Mem0 删除留痕（`_delete_memory` → `add_history`）。另：GitHub Free 私有仓保护 🟡（官方页未直陈，社区帖实证方向）。

#### 抽验记录 · 版本与源码复查入口

**范围与证据**：2026-10-22 七家浅克隆调研的取证附件；2026-10-28 本机只读核对七仓 commit、版本声明、LICENSE 与下列文件定位。版本是该 commit 内声明值，**未核发布状态**；日期统一为 Git commit 的 `%cI`（原时区），**不是版本发布时间**。未运行任何框架；MemOS dump/load、MIRIX 查询层过滤等运行时行为仍未验。七家以外未扩面，LangGraph checkpoint 未验，不作推荐。

| 框架 | 源仓库 | 声明版本 | commit | 提交日期（原时区） | 许可 |
|---|---|---|---|---|---|
| Letta Code（不是 Letta 服务端版本） | https://github.com/letta-ai/letta-code | 0.34.20 | `035bb8c` | 2026-10-21T22:24:18-07:00 | Apache-2.0；品牌资产除外（LICENSE:192-198） |
| Mem0 | https://github.com/mem0ai/mem0 | 2.2.1 | `2c81af3` | 2026-10-20T21:16:17-04:00 | Apache-2.0 |
| Graphiti | https://github.com/getzep/graphiti | 0.31.2 | `8e320f8` | 2026-10-21T02:47:23Z | Apache-2.0 |
| MemOS | https://github.com/MemTensor/MemOS | 2.0.33 | `a7367d0` | 2026-09-22T09:51:03+08:00 | Apache-2.0 |
| MIRIX | https://github.com/Mirix-AI/MIRIX | 0.1.0 | `8cb06a6` | 2026-08-20T21:59:50+08:00 | Apache-2.0 |
| A-MEM | https://github.com/agiresearch/A-mem | 0.0.1 | `ceffb86` | 2025-12-12T16:15:29-05:00 | MIT |
| Cognee | https://github.com/topoteretes/cognee | 1.6.5 | `37f788b` | 2026-10-16T22:07:34+02:00 | Apache-2.0 |

**复查坐标**（路径均相对各仓根；下列行号绑定上表 commit，不随本文件编辑漂移）：

- **Letta Code**：`package.json:3` 版本；`src/agent/memory-filesystem.ts:29-64,312-454` 目录与树渲染；`src/agent/memory-git-hooks.ts:85-161` 校验与拒绝；`src/agent/memory-format.ts:4-20` 格式识别；`src/memory-frontmatter.ts:27-39,63-110` 字段检查。
- **Mem0**：`mem0/memory/storage.py:102-126` 的 `old_memory/new_memory/event/is_deleted` history；`mem0/memory/main.py:2114-2142` 完整删除函数。**本体物理删不等于 history 不留底**，采用上方已订正的「删除留痕」行，不恢复原调研的错误否定。
- **Graphiti**：`graphiti_core/nodes.py:98,322` 节点时间；`graphiti_core/edges.py:49-54,263-284` 边的 `valid_at/invalid_at/created_at`；`graphiti_core/graphiti.py:2174-2225` 的 `remove_episode`／物理删。
- **MemOS**：`src/memos/memories/textual/item.py:49-128` 的 `ArchivedTextualMemory`、`TextualMemoryMetadata.version/history/status`；`src/memos/memories/textual/tree.py:439-458,460-476` load／dump；`src/memos/mem_cube/general.py:62-67,104-107` schema 检查与空目录前提。原调研另记 `export_graph` 是导出、不是索引重建。
- **MIRIX**：`mirix/orm/sqlalchemy_base.py:428-450` 软／硬删；`mirix/orm/base.py:27` 的 `is_deleted`；`mirix/orm/episodic_memory.py:32-50` 的 `agent_id`。
- **A-MEM**：`agentic_memory/memory_system.py:398-413` 删除；`agentic_memory/retrievers.py:85-91` 的 `collection.delete`。原调研为全局 dict＋Chroma 研究原型，无版本／导出，不选。
- **Cognee**：`cognee/modules/data/models/Data.py:12-15,33,52-57` 的稳定 UUID 注释及 `legacy_id`；`cognee/infrastructure/databases/relational/sqlalchemy/SqlAlchemyAdapter.py:401-448,450-493` 关系删除、引用计数与删文件。原调研记录 Alembic 迁移不等于导出；ECL 重跑是重抽取，不等于逐条重建。

**原逐框架表的补充字段**：Letta 以 agent 目录＋块路径定位、memory 仓 `git commit` 留版本，未另设 tombstone，删除依 git 历史；Mem0 为 uuid＋四元 scope，history 是旁路审计、不是本体版本链；Graphiti 用 uuid；MemOS 用 uuid＋`memory_type`，状态枚举为 `activated/resolving/archived/deleted`；MIRIX 为 uuid＋`agent_id`，`last_modify` 是时间戳／操作记录，不等于版本链；A-MEM 用 `memory_id`，删除同时清 collection 与内存 dict；Cognee 无版本链。以上为源码调研记录，不能外推为运行验收。

**复算载体**：本机克隆父目录 `D:/Code/_tmp/mem-research-20261022`，子目录依次为 `letta-code`／`mem0`／`graphiti`／`MemOS`／`MIRIX`／`A-mem`／`cognee`（2026-10-28 实见）。读取示例：`git -C "D:/Code/_tmp/mem-research-20261022/letta-code" show 035bb8c:package.json`。原 `clone --depth 1` 只取当时分支顶端，不锁版本；复查须同时用源仓库＋commit＋文件三件定位，不能拿今天的默认分支替代。克隆目录可退役，以上仓库和版本坐标自持，不以临时路径存活为前提。

**两处订正，不改借用结论**：① Letta 原记日期 `2026-10-18` 不符该 commit；已补声明版本 0.34.20，日期按上表，不猜原日期来历。② memfs-v2 普通文件要求 `name`＋`description`，但 `MEMORY.md` **禁止 frontmatter**；「缺 description 应拒」的负向验证须选普通记忆文件，不能套到 `MEMORY.md`。只借布局／校验设计，不嵌其 client／agent 代码。四条 LA 失败态已在主表〈不借／注意〉列，不重复造第二份。

### 6.3 适配判断（DSH 现有装配）

**结论**：候选表里**没有一条需要改 DSH boot 代码**；`--profile`＋bundle＋patch 够用。要动的是「谁起进程、home 放哪、凭证谁拿」三件装配。

**五条做不成**：

1. **Landlock CLI**：Windows 无；Linux 须**外层启动链**套住 `dsh`，属运维包装（⛔ 未验）。
2. **「不挂记忆插件」当隔离**：做不成（已实测可绕过）。
3. **只靠 1b-A ACL 达「agent 改不动自己的 profile」**：做不成——`(WD,AD)` 封写可行（启动 rc=0、改 patch／插件 DENIED）；一加 `(D)` 封删，DSH 读 `package.json`／`cordis.patch.yml` 即 EPERM ⇒ **读得到与删不掉二选一**。此条只能容器＋只读挂载（⛔ 未验）。
4. **WORM／远端保护做成 DSH 插件**：做不成——凭证必进 agent 可读配置；推送与保护须落宿主机侧外部进程。
5. **远端 git 保护覆盖记忆库**：做不成——`dbPath` 在 `.dsh-home/`（gitignore），不在 git 里。

**两处现状修正**：

- **1b-A 的适用范围**：只保证「跨 agent 不可读」；❌ 不能顺带当 D-7 档 1 保障。生产侧还需「**一 agent 一 DSH_HOME**」——否则 `sessions/`／`storages/` 共享，B 仍读得到 A 的会话流水（记忆原料）。
- **双写现状**：生产 patch 只配 `dbPath`、**未配 `chromaUrl`** ⇒ 双写未启用；从生产插件目录 import `@huggingface/transformers`／`chromadb` 均 **ERR_MODULE_NOT_FOUND**（依赖在 `harness/node_modules`，插件实体复制到 profile 后够不着）⇒ 配了也起不来。⇒ 统一口径：**没在写＋想启也启不了＋读路径也没有**。

**契约层代价**：加列（`agent_id`／`domain`／`provenance`／`version`／`status`／`is_deleted`）低风险，但**没有写入方**；换 uuid 主键高成本（召回 `ORDER BY id DESC` 兼作时间序，须引入显式排序键；Chroma id 绑行号 ⇒ 存量向量全孤儿；`legacy_id` 须同事务填完）；`created_at` 历史行补不出真实偏移，导出规范化要留「偏移未知」态。⇒ **「契约先于索引」在代码上成立**。

**能用且零 boot 改动**：契约层列改动；`MEMORY.md` 目录树（Letta 布局，纯插件；⚠️ 走 context 面／按需工具，⛔ 走 `systemPrompt.section`，以免打爆前缀缓存）。

**待机器空再跑**：① 容器内 DSH 首启（验证「一 agent 一容器」装配成本）；② 双账号互测（shell 开启下正反向）。

### 6.4 待批／待拍

1. **1b 双账号互测**：本机建两个测试账号跑正反向（动 OS 账号，先报老大）。
2. **2b 免费层桶最小验证**：需云账号／桶；可后做。
3. **3b 选型**：GitHub Pro（$4/月）还是自建 Gitea（要常开机器）——成本取向，老大定。
4. **第二信任域 root 持有者**，以及 **1b 提权钥匙与 3b admin 分持**（随持有者一并拍）。

---

## 七、基础设施候选来源（2026-10-24 复核）

> 本表 🟢 仅指**页面实达**（实跑网络检查）；页面内容的结论按证据档另读，属 🟡（只读官方文档，未实跑）。

| 源 | URL | 状态 |
|---|---|---|
| GitHub docs · About protected branches | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches | 🟢 页在；⚠️ 当前版未直陈「Free 私有仓无保护」⇒ 该结论降 🟡，由下行社区帖承接 |
| GitHub community #209198 | https://github.com/orgs/community/discussions/209198 | 🟢 Free 私有仓保护分支限制的实证主题 |
| AWS S3 Object Lock | https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html | 🟢 compliance 模式 root 不可删、唯一删除法＝注销账号 |
| Backblaze Object Lock | https://www.backblaze.com/docs/cloud-storage-object-lock | 🟢 compliance 保留设置任何用户不可移除（只可延长） |
| 阿里云 BucketWorm | https://help.aliyun.com/en/oss/developer-reference/get-bucket-worm | 🟢 API 参考页实达；⚠️ 原《Bucket 级别保留策略》用户指南页未复得（404／超时）——**待补** |
| dev.to · Landlock 实测文 | https://dev.to/lyraalishaikh/linux-landlock-lsm-practical-application-sandboxing-without-root-or-complex-profiles-2do4 | 🟢 日期 2026-07-25 吻合 |
| rstrict | https://github.com/creslinux/rstrict | 🟢 MIT、Landlock LSM、内核 5.13+（TCP 规则 5.19+）；原调研标注日期 `2025-05`，日期含义及真实性未独立复核，不当作已核发布时间 |
| sandboxec | https://pkg.go.dev/go.dw1.io/sandboxec@v0.1.0 | 🟢 v0.1.0、2026-02 吻合 |
| Duplicati 存储目标对比 | https://duplicati.com/articles/choosing-a-backup-storage-target-s3-azure-backblaze-b2-sftp-or-your-own-nas | 🟢 日期 2026-09-29 吻合 |

> 原检索式未随档留存，⛔ 不伪造；以上为 2026-10-24 复验记录。待补一项补齐前，相关决策依据按 🟡 看。

---

## 附 · 检索来源（2026-10-21 框架扫描）

- Zep, [Temporal Knowledge Graph](https://www.getzep.com/ai-agents/temporal-knowledge-graph/)；[Zep 论文 arXiv:2501.13956](https://arxiv.org/abs/2501.13956)
- Letta, [Agent Memory](https://www.letta.com/blog/agent-memory/)；[Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute/)
- Mem0, [Entity-Scoped Memory](https://docs.mem0.ai/platform/features/entity-scoped-memory)；[How Mem0 Works](https://docs.mem0.ai/core-concepts/how-it-works)
- MemOS, [arXiv:2505.22101](https://arxiv.org/html/2505.22101v1)；[Hugging Face 论文页](https://huggingface.co/papers/2507.03724)
- MIRIX, [arXiv:2507.07957](https://arxiv.org/abs/2507.07957)；[GitHub](https://github.com/Mirix-AI/MIRIX)
- A-MEM, [arXiv:2502.12110](https://arxiv.org/abs/2502.12110)；[NeurIPS 2025 poster](https://neurips.cc/virtual/2025/poster/119020)
- Cognee, [How Cognee Builds AI Memory](https://www.cognee.ai/blog/how-cognee-builds-ai-memory)；[Data Flows](https://docs.cognee.ai/core-concepts/data-flows)
- 多 agent 架构研究, [AI Agent Memory Architectures for Multi-Agent Systems（Zylos, 2026-03）](https://zylos.ai/research/2026-03-09-multi-agent-memory-architectures-shared-isolated-hierarchical/)
- 2026 系统对比（仅作背景，⛔ 不按榜单选型）：[Developers Digest](https://www.developersdigest.tech/blog/best-ai-agent-memory-providers-2026)／[N1N](https://explore.n1n.ai/blog/ai-agent-memory-comparison-2026-mem0-zep-letta-cognee-2026-04-23)／[PuppyOne](https://www.puppyone.ai/en/blog/best-ai-agent-memory-platforms)
