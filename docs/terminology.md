# 术语表（跨层用词约定）

> **定位**：跨层对照表，⛔ **不是第四层**——它只登记「同一个词在两处指的不是一回事」，不制定任何一层的内部规范。
> **维护**：Qoder。撞到的人自己加一行，主持人只做格式审核；**2～3 轮无人消费则撤**。
> **生效方式**：新增文本按本表正名；**存量不回改**（除各条「承接现状」写明要改的落点）。行号是**登记当时**的定位，复核按「文件 ＋ 关键词」重找，⛔ 不把行号当永久地址。
> **首次定稿**：2026-11-03。定稿前的过程记录（含全部讨论意见）＝ git `28dc474`。

---

## 〇、口径

**目标**：⛔ 不是编词典。误读几乎都不是「不知道定义」，而是**以为它等于另一个东西**——本表只钉后者。

**三层**（按「谁执行它」切，⛔ 不按技术含量切）：

| 层 | 一句话 | 正本 |
|---|---|---|
| **L1 协作层** | 我们怎么造——谁干什么、怎么派、怎么复验、什么不许碰 | `ai-governance.md` |
| **L2 产品能力层** | LA 该造什么——用户看得见、能用的能力 | `product-positioning.md` |
| **L3 实现层** | 代码里怎么落——表、字段、插件、接口 | `harness/` `backend/` |

**收词三条**：

1. **同形不同义**——同一个词／同一个表名，两处指的不是一回事；
2. **能指到行**——每条带 `文件:行号` 实据，拿不出行号的不进表；
3. **两层（或两处）都出现**——只在一层出现的属层内术语，不进跨层表。

**排序**：**已发生事故 ＞ 推演危害**（一个词出没出过事，比危险度估分更硬）。「承接现状」列末标 `已发生`／`推演`。

**升级信号**：同一术语造成 **2 次以上实际误读 ⇒ 必须进表**（「档 1」已用掉 1 次额度）。

**成功判据**：下次提该词不需要再解释。

---

## 一、词条矩阵

> 列＝`词 | 层 | 本层指什么 | ⛔ 容易混成／越界判据 | 承接现状（谁 · 实据；已发生/推演）`
> **路径缩写**：`schema.py`＝`backend/db/schema.py`；`index.ts`＝`harness/packages/plugin-s4-memory/src/index.ts`；`conversations.py`＝`backend/api/conversations.py`；`memory.py`＝`backend/api/memory.py`；`roles.py`＝`backend/api/roles.py`；`archiver.py`＝`backend/memory/archiver.py`；`test_chromadb_degradation.py`＝`backend/tests/test_chromadb_degradation.py`；`requirements.md`＝`la-space/requirements.md`；`product-positioning.md`／`ai-governance.md`＝同目录本区正本。

### 1.1 跨层同词（L1 ↔ L2）

| 词 | 层 | 本层指什么 | ⛔ 容易混成／越界判据 | 承接现状（谁 · 实据；已发生/推演） |
|---|---|---|---|---|
| **注入** | L1↔L2 | **L1＝约束注入**：往 AI 上下文注入规矩（`ai-governance.md:27`／`:56`／`:137` 注入截断）；**L2＝上下文注入**：往模型 prompt 注原料（`product-positioning.md:195`／`:290`／`:457`） | ⛔ 把「约束失效」和「召回不生效」当同一类故障；「注入了什么」分不清是规矩还是原料。L2 内部亦有两义：system prompt 段（`injectSection`）vs user-role snapshot（`injectContext`，`plugin-s4-memory/src/index.ts:157-159`） | Qoder · `ai-governance.md`（L1 正名）／产品文档（L2）。**已发生**（AGENTS.md 案，见 §二） |
| **红线** | L1↔L2 | **L1＝协作红线**：给 AI 的 4 条铁律（`ai-governance.md:38`）；**L2＝产品红线**：给产品的 5 条底线（`requirements.md:140-146`） | ⛔ 裸说「踩红线」须先猜哪份；后果不同——L1 是 AI 职业事故，L2 是产品事故（全量存档那条**不可逆**） | Qoder · `ai-governance.md`（L1）／`requirements.md`（L2）；**推演** |
| **角色 → 岗位** | L1↔L2 | **L1＝岗位**：我们几个 AI 的岗位（`ai-governance.md:28`／`:53`）；**L2＝角色**：用户可选人格（`product-positioning.md:361`／`:551`，代码 `role`/`roles`） | ⛔ 「换角色试试」分不清换谁；Trae 既是 L1 执行方又是 L2 被测对象。⚠️ 改口留映射句「岗位（旧称角色）」——「岗位」全仓零使用，不留映射旧文档读不懂 | Qoder · `ai-governance.md`（L1 正名＋映射句）／产品侧不动（代码/配置/API 一律 `role`/`roles`）；**推演** |
| **记忆** | L1↔L2 | **L1＝人格记忆**：各 AI 连续性载体（MEMORY／日记／黑板，`ai-governance.md:56`／`:122-126`）；**L2＝长期记忆**：产品功能域（`product-positioning.md` 2.4，术语约定 `:553`） | ⛔ 「记忆丢了」在 L1 是**连续性断了**（对老大有真实情感重量），L2 是**产品数据事故**——处置方式、紧急度、谁来救全不同。本表最容易被随口混用的一条 | Qoder · `ai-governance.md`（L1 正名）／产品文档（L2）；**推演** |
| **审批／批准／答者** | L1↔L2 | **L1＝人对 AI 的授权**（老大拍板、派发稿「待老大裁」、WB 批 Trae）；**L2＝用户对工具调用的批准**（`approval/request`，`product-positioning.md:381`，DSH-3.3 系列） | ⛔ 产品层验 **fail-closed**（没人应答＝不许执行），协作层验**谁有权批**——说「审批通过」两边验的东西不同，且都会以为对方在说自己的那个 | Qoder · `ai-governance.md`（L1）／DSH-3.3 判据（L2）；**推演** |
| **工作空间／工作区／cwd** | L1↔L2 | **L1＝共用开发目录**（`D:\Code\LarryAgent`，多 AI 共用一处）；**L2＝用户授权工作区**（`product-positioning.md:182`／`:195` 会话级沙盒） | ⛔ **同一句话在两层是相反的要求**：L1 要全员在此，L2 明确要求 cwd 不得缺省落在仓库根／源码目录 | 说法层约定（⛔ 改代码）；**推演** |
| **测试／复验** | L1↔L2 | **L1＝复验**：核别人交付的账（`ai-governance.md` §3＋`verify-ai-delivery`）；**L2＝产品测试**：代码自动化测试（`product-positioning.md:480`，`backend/tests`） | ⛔ 「测试通过」置信度差一个量级——pytest 绿 ≠ 交付成立。⚠️ L1 内部还有三级：**pytest 绿 ＜ 真实 API 冒烟绿 ＜ 复验成立** | Qoder · `ai-governance.md`（L1 写清三级）／产品文档（L2）；**推演** |
| **存档／归档** | L1↔L2 | **L1＝项目文档冷存**（`archive/`、`log-*` 清退、git 历史）；**L2＝全量存档**：会话原始流无损落盘六类（`requirements.md:146` 红线第 5 条） | ⛔ 叠加 L2 内部四义（见 §1.2 S-2）⇒ **`archive` 一个词在本项目最少五义**；说「归档了」在 L1 是进冷存区、在 L2 是红线级承诺 | Qoder · `archive/`（L1）／`requirements.md`（L2 用正名「全量存档」）；**推演** |
| **审计** | L1↔L2 | **L1＝审计岗**（外部审计职能，现由 ZCode 承接，`ai-governance.md:56` 沿革段）；**L2＝审计留痕**（append-only、⛔ 不可删，`requirements.md:37`；`TODO.md:364` 零实现） | ⛔ 「审计缺失／没审计」双义：L1 语境像说没人复验（实际天天在审），L2 语境才是产品功能缺口。⚠️ `TODO:364`「审计留痕零实现」本身是一句**已写成的双关** | Qoder · L1 保留「审计」；L2 正名「**审计留痕**」且限产品文档内，⛔ 不裸说「审计」指产品；**推演**（双关已存在） |
| **知识库** | L1↔L2 | **L1＝项目知识库／kb 引擎**（`.zcode/skills/kb-search`，**已实装在跑**，引擎在仓外）；**L2＝知识库**：用户主动导入外部资料（`product-positioning.md:304` 2.4.6，**无方案无排期**） | ⚠️ **双真句**：「知识库已实现」和「知识库无实现」**两句都真、分别在两层**——把 L2 的裁定句引到 L1 语境，会误判 kb 引擎这个在役工具的状态 | Qoder · L1 叫「kb 引擎／项目知识库」；L2 保留「知识库」为产品功能正名；**推演** |

### 1.2 产品层 ↔ 实现层（L2 ↔ L3）

| 词 | 层 | 本层指什么 | ⛔ 容易混成／越界判据 | 承接现状（谁 · 实据；已发生/推演） |
|---|---|---|---|---|
| **memories** | L2↔L3 | **L2＝长期记忆**：对话自动沉淀（`product-positioning.md:553`）；**L3 两张同名表**：backend＝**提炼后的摘要**（`schema.py:38-47`，`:7` 自述）；插件＝**用户消息原文**（`plugin-s4-memory/src/index.ts:281-291`，`:300` 插入） | ⛔ ③.1 执行方拿「记忆走新路径入库」往现有 `memories` 插摘要行：**第一跳撞 `source_event_seq INTEGER NOT NULL`**（`index.ts:284`）→ 响亮报错；只有塞哨兵值才**第二跳撞** `UNIQUE(session_id, source_event_seq)`（`:289-290`）。真实危害不是写坏，是**不知道往哪张表、以什么形态落** | **随 ③.1 裁决输出同批定**：表名与结构（拆表→插件侧幸存者改名 `transcript`；或同表加 `kind`）、三字段落点、`UNIQUE` 迁移步一起出。⚠️ 插件那张装原文的表 ⛔ 不叫「记忆／长期记忆」；`CREATE TABLE IF NOT EXISTS` 对老库不生效（`index.ts:292` 自注同族坑）；**推演** |
| **archive／归档** | L2↔L3 | **四义**：① 会话软标记（`backend/api/conversations.py:110`，`:112` 注释「不写记忆」）；② LLM 提炼摘要（`backend/api/memory.py:62`＋`backend/memory/archiver.py` 自述）；③ 会话流水全量落盘（`index.ts:173` `archive-manifest.jsonl`；`requirements.md:146`）；④ 项目文档冷存（同 §1.1 存档） | ⛔ ③ 写侧、④.1 迁移、⑪ 全量存档三处都写「归档／存档」，指的不是同一件事。⚠️ **代码实体名自己撞**：`/archive` 路由（①）／`archiver.py`（② 提炼器）／`archive-manifest.jsonl`（③ 全量落盘）共享一个词根 | ② 正名「**提炼**」；③ 用正名「**全量存档**」；① 中文写「收进归档列表」；`archiver.py` 中文自述 ⛔ 再写「归档」（它是 ④.1 迁移的幸存者，改名按迁移步走）；**推演** |
| **role／source_role** | L2↔L3 | **三义**：① 消息发送方 `messages.role`（`schema.py:28`，`user`/`assistant`/`system`/`tool`）；② 人格角色（`product-positioning.md:551`；`backend/api/roles.py:33` 从 `config.yaml` 读，**无 roles 表**）；③ 源角色 `source_role`（`backend/api/memory.py:49`，值＝角色 key 字符串，指 ②） | ⛔ 把 `source_role` 按 ① 理解 ⇒ **字段有值、语义全错、且不报错**。⚠️ 改名 `source_role_id` 反撞产品约定（`product-positioning.md:551` 代码一律 `role`/`roles`），加 `_id` 还暗示整数外键 | **已定：不改名，只钉语义**。成本三层：API 契约（`memory.py:49`）＋测试（`test_chromadb_degradation.py:116` 直接传 `source_role="default"`）＋文档（`product-positioning.md:290`／`HUMAN_NOTE.md:114`，另 `exchange/discussion-time-context.md:65` **未定案**）。术语表收「源角色」词条。⚠️ `TODO.md:373`「建议直接改名 `source_role_id`」半句与结论相反，撤句归 WB／老大（TODO 正文不在 Qoder 可写区）；语义句「指人格角色，⛔ 非 `messages.role`」已在 `TODO:373`；**推演** |
| **session／conversation／会话／对话** | L2↔L3 | 同一实体两套名两套主键：插件 `session_id TEXT`（`index.ts:283`）／backend `conversations.id INTEGER AUTOINCREMENT`（`schema.py:15`）；中文全局「会话」314 处／「对话」37 处 | ⛔ ④.1 迁移的硬骨头不是搬数据，是**两套主键的映射**；判据写「一次会话」，两侧各理解各的 | 钉：**一段对话，产品层称「会话」（session）**；backend 旧称 `conversation`（迁移期并存）；**对外文档与新代码** ⛔ 新增 `conversation` 一词；**backend 旧件按原名，不做批量改名**；**推演** |

### 1.3 层内不一致（A 级，可不阻塞 ③.1）

| 词 | 层 | 本层指什么 | ⛔ 容易混成／越界判据 | 承接现状（谁 · 实据；已发生/推演） |
|---|---|---|---|---|
| **停用** | L3 层内 | 记忆 `is_active`（`schema.py:44`，软删除）／会话 `is_archived`＋`deleted_at`（`schema.py:19-20`，**两个**字段）／插件侧**无此概念**（`index.ts:281-291` 无对应列） | ⛔ ③.3 要给 `is_active` 赋值——插件表里根本没这条列，得先加；三种对象三种表达 | 并入 S-1 **同批裁决**（`TODO.md:374` 已有「同批解决」口径），⛔ 不各做各的；**推演** |
| **messages／session-event** | L3 层内 | backend＝**消息表**（`schema.py:24-35`，`role`/`content`/`tool_calls`）／DSH＝**事件流**（`index.ts:443`，`seq` ＋ 类型） | ⛔ 插件只把 event 里的**用户文本**抽进 `memories`，assistant 回复、工具调用、CoT 在记忆侧**没有落点**；全量存档要的是**事件流全量**，⛔ 不是 `messages` 表——别混着说「消息都在」 | 归 ③.1／⑪ 承接（写侧与存档侧各自对齐）；**推演** |
| **tool** | L3 层内 | `messages.role='tool'`（`schema.py:28`，发送方）／`tools` 表（`schema.py:49-57`，自述「当前无读写方」） | 危害低；`role` 那组讨论时会绕进来，先登记 | 登记；**推演** |

### 1.4 登记备查（B 级）

| 词 | 层 | 本层指什么 | ⛔ 容易混成／越界判据 | 承接现状（谁 · 实据；已发生/推演） |
|---|---|---|---|---|
| **memory／memories** | L3 层内 | 表名一律复数（`memories`／`messages`／`tools`／`conversations`）；单数一般指「这条记忆」或「记忆这个能力」 | 目前没出事，登记备查 | —；**推演** |
| **用户** ⚠️登记不収条 | L1↔L2 | L1＝老大／苏本人；L2＝LA 的使用者 | 单用户期重合，LA 走向真实使用必分裂——「用户确认」是谁确认？不在「同形不同义」内 | 只登记，⛔ 不进表；**推演** |

### 1.5 旧词承接（已按现行文复核行号）

| 词 | 层 | 本层指什么 | ⛔ 容易混成／越界判据 | 承接现状（谁 · 实据；已发生/推演） |
|---|---|---|---|---|
| **档 1** | L2 内部（la-space） | `tech-reference` 侧＝「1b 自身档 1」；`requirements` 侧＝**D-7 生产隔离档 1（独立用户／容器）** | ⛔ 混读会得出「ACL 就够了、不必上容器」的错结论 | 交叉注**已双边落**：`la-space/tech-reference.md:137`（「此「档 1」⛔ 非 D-7 档 1」）＋`la-space/requirements.md:193`／`:225`（按关键词重找，⛔ 按旧行号）；**已发生** |
| **第二信任域** | L2（la-space） | 能对 agent 说「不」的另一个身份／机器 | ⛔ 不是「备份异权」本身——它是 1b／2b／3b 的**共同硬前置** | 定义句 `la-space/tech-reference.md:59`；同卡约束 `la-space/move-in-plan.md:59`；持有者待裁 `la-space/requirements.md:233`；**推演** |
| **私密档** | L1 | 过程／情境本身，只存不迁 | ⛔ 不是「公共但别引用」——它**根本不进公共区** | 本表即承接位（此前 `docs/` 零承接）；**推演** |

### 1.6 人格（收界线、不收词条）

| 词 | 层 | 本条只给界线 | ⛔ 越界判据 | 承接现状 |
|---|---|---|---|---|
| **人格** | L1↔L2 | **L2＝产品侧可选角色的人格模型**；**L1＝各家 SOUL 指向的自我描述** | ⛔ L1 各家 SOUL／MEMORY 不作为 L2 人格模型的**语料、样本、参照、评测样本或 prompt 示例**（与「CoT 不乱给别人看」同一条法）；SOUL 不是产品资产 | 已定（2026-11-03）；三方独立表态同向 |

---

## 二、已发生事故：`AGENTS.md` 注入（本表最硬的实证）

**2026-10-15 现场，已处置**：

| 事实 | 实据 |
|---|---|
| 仓根 `AGENTS.md` 是 **L1 协作层的角色自述**（「我是审计员／我可写的只有三处／我不写码」） | `ai-governance.md:56` |
| DSH 加载链包含 `<repo>/AGENTS.md` ⇒ 它被作为一条 durable `user/message` 包进 `<system-reminder>`，注入给**产品运行时里的 agent** | `ai-governance.md:56`；`dsh/dsh-agents-md.md` §3.1／§3.2 |
| 结果：**L1 的「我是谁」，进了 L2 运行时的「你是谁」** | 同上 |

**修复与剩余**：

1. **结构性修复已做**：约束装载从「平台默认加载链」换成了家里的钩子（`.zcode/config.json` SessionStart → `inject-constraints.mjs`），装载通道已不在上游手里（`ai-governance.md:56` 沿革段）。
2. **规则升格到位**：「L1 约束文件 ⛔ 进产品运行时加载链」已写进 `ai-governance.md` 的判据位（不是只留在个人记忆层）。
3. ⇒ 本条从「叙事」改为「拦截」：仓根通用约定名文件只留中立索引，⛔ 不放角色自述／约束。

---

## 三、挂接项（不进表，进派发判据）

**① ③.1 裁决输出三件套**：

- **命名段**：表名与结构（拆表／同表加 `kind`）同批出；插件侧（幸存者）叫什么一并定；
- **字段落点表**：`is_active`／`last_hit_at`／`source_role` 各落哪张表、叫什么、类型、约束；
- **约束迁移步**：`UNIQUE(session_id, source_event_seq)` 若改部分索引须 `DROP INDEX` 再建；`CREATE TABLE IF NOT EXISTS` 对老库不生效。

⚠️ **`last_hit_at` 是产品承诺，⛔ 不是可丢的实现细节**：`product-positioning.md:281` 把它列为产品侧**保鲜机制**（`last_hit_at`／`priority`）。没有落点表，③.3 判据「字段有值且语义不降级」写不出断言。

**② ③.3 判据**：

- `source_role` 语义句已在 `TODO.md:373`（「指人格角色，⛔ 非 `messages.role`」）；
- ⚠️ 同处「建议直接改名 `source_role_id`；若改名，须同步 DSH-6」半句**与结论相反**，须撤（归 WB／老大，TODO 正文不在 Qoder 可写区）；
- `is_active` 的落地前提（`TODO.md:374`）与 S-1 同批解决的口径已成立。

**③ ④.1 迁移**：

- 主键映射（`session_id TEXT` ↔ `conversations.id INTEGER`）——见 §1.2；
- 语义字段在迁移中的保留（`TODO.md:377` 已限定范围：不重演 P8 已做的 54 行回填）。

---

## 四、未覆盖（如实）

- 未扫 `client/`（前端 Vue＋Tauri），前端与 backend 的字段名对照没做。
- 未扫 `ref/`（外部参考件）。
- 未做「中文注释层」用词统计。
- 未做频次统计（哪个词混用得最多）——只做「存在性 ＋ 危害」。
- L1 执行面（派发／回报原文）未做统计：`log-*` 活日志不留底、规矩上不引用 ⇒ 仅取各家自报习惯。
- 各家约束文件原文未纳入（私有区）⇒ 各家自己的用词习惯未统计。