# 术语候选表 · 「同名不同义」实据扫描（WB · 2026-11-03 · **未定案讨论稿**）

> **本稿性质**：候选表，⛔ 不是术语表定稿。产物落交流区；正式落位（`docs/`）归 Qoder，须老大裁定。
> **为什么做**：DSH-4 · P1「搬家」拆块时撞到 `memories` 两义。老大判断该先把术语理清再动 ③.1。
> **扫描边界（只读）**：`backend/**/*.py` 的建表语句与路由 ／ `harness/packages/**/*.ts` 的建表语句 ／ `docs/**/*.md` 与 `TODO.md` 的术语命中。⛔ 未改任何代码与 `docs/`。
> **收条标准**：只收**同形不同义**（同一个词/同一个表名，两处指的不是一回事），且**能指到行**。纯同义词、纯笔误不收。

---

## 一、S 级 —— 会让执行方做错（建议先定这四个）

### S-1 · `memories`：两侧同名，装的东西不是一回事

| 侧 | 实据 | 装的是什么 |
|---|---|---|
| backend | `backend/db/schema.py:38-47`（表定义）＋ `:7`（自述「长期记忆（归档后的摘要）」） | **提炼后的摘要**，字段 `source_conversation_id` ／ `is_active` |
| 插件 | `harness/packages/plugin-s4-memory/src/index.ts:281-291`（表定义）＋ `:300`（插入语句） | **每条用户消息原文**，字段 `session_id` ／ `source_event_seq` ／ `embedding` |

**第三层冲突（比"两义"更要紧）**：`docs/product-positioning.md:553` 术语约定写「**长期记忆** = 对话自动沉淀（已实现）」。按这条产品定义，插件那份**不叫长期记忆**——它是原始流水，没有提炼、没有人审。

**危害**：TODO `③.1` 判据写「记忆走**新路径**入库」。执行方拿到这句，往现有 `memories` 表插摘要行，会撞 `idx_memories_session_seq`（`UNIQUE(session_id, source_event_seq)`，`index.ts:289-290`）——摘要不是"某一条事件"，它没有 `seq`。

**待裁的方向（两选一，我不预设）**：
- (a) 拆表：原始流水改名（如 `transcript` ／ `message_log`），`memories` 专指摘要
- (b) 同表加一维（如 `kind`），`memories` 保留为筐名

⚠️ (b) 的代价：`UNIQUE(session_id, source_event_seq)` 对摘要行的处理要另定（哨兵值 or 部分索引）。

---

### S-2 · `archive`：同一个词，三件事

| # | 实据 | 指向的事 |
|---|---|---|
| ① | `backend/api/conversations.py:110`（`POST /{id}/archive`）＋ 同文件 `:112` 注释「仅归档：mark_archived=1，**不写记忆**」 | **软标记**：会话收进归档列表 |
| ② | `backend/api/memory.py:62`（`POST /memory/archive`） | **LLM 提炼摘要** |
| ③ | 插件 `index.ts:173`（`sessions/archive-manifest.jsonl`）＋ `docs/la-space/requirements.md:146`（全量存档六类） | **会话流水全量落盘**（红线级条款） |

**值得注意**：① 和 ② 的区别，代码作者**已经需要写注释来解释**（`conversations.py:112`）。这是"词不够用"的典型信号，不是作者啰嗦。

**危害**：`③` 写侧、`④.1` 迁移、`⑪` 全量存档 三处都在说"归档/存档"，指的不是同一件事。派发稿里写"归档"必歧义。

**建议**：三义各给专名。② 是"提炼"不是"归档"；③ 已有正名"全量存档"，别再用裸 `archive`；① 保 `is_archived` 字段名即可，但中文别写"归档"、写"收进归档列表"。

---

### S-3 · `role`：三义，且第三条已经写进判据

| # | 实据 | 指向 |
|---|---|---|
| ① | `backend/db/schema.py:28`（`role TEXT CHECK(role IN ('user','assistant','system','tool'))`） | **消息发送方** |
| ② | `backend/api/roles.py` ＋ `product-positioning.md:551`（术语约定：角色 ≈ 专家，代码统一 `role`/`roles`） | **人格角色**（产品语义） |
| ③ | `TODO.md` `③.3` 判据要加的字段 **`source_role`** | 指 ②，不指 ①——**但判据里没写这句** |

**危害**：`③.3` 执行方看到 `source_role`，最自然的理解是"来自 messages 的 role 列"（即 ①），而设计意图是 ②。**这条一旦做错，字段有值但语义全错，且不会报错。**

**建议**：`③.3` 判据里把 `source_role` 改写成 `source_role_id`，或加一句「指人格角色（`roles`），⛔ 非 `messages.role`」。**这条不需要术语表，改判据就够。**

---

### S-4 · `session` ／ `conversation`：同一实体，两套名两套主键

| 侧 | 实据 | 标识 |
|---|---|---|
| DSH ／ 插件 | 插件 `index.ts:283`（`session_id TEXT`）＋ 实测样本 `session-391-*` | 字符串 id |
| backend | `schema.py:15`（`id INTEGER PRIMARY KEY AUTOINCREMENT`，表名 `conversations`） | 整数自增 |

**危害**：`④.1` 迁移的硬骨头就在这里——不是搬数据，是**两套主键的映射**。判据里写"一次会话"，两侧各理解各的。另：`docs` 全局中文"会话" 314 处／"对话" 37 处，已经在混用。

**建议**：术语表钉一句：「**一段对话，产品层称「会话」（session）；backend 旧称 conversation（迁移期并存，⛔ 新代码不再新增 `conversation` 一词）**」。

---

## 二、A 级 —— 内部不一致，会让人误判（可不阻塞 ③.1）

### A-1 · 「停用」有三套写法

| 对象 | 字段 | 实据 |
|---|---|---|
| 记忆 | `is_active`（软删除标记） | `schema.py:44` ＋ `db/memories.py:131`「软删除记忆：标记 is_active=0」 |
| 会话 | `is_archived` ＋ `deleted_at`（**两个**字段） | `schema.py:19-20` |
| 插件侧记忆 | **没有这个概念** | `index.ts:281-291` 无对应列 |

**影响**：`③.3` 要给 `is_active` 赋值——插件表里根本没有这条列，得先加。而"停用"在三种对象上三种表达，读代码的人要分别记。

### A-2 · `messages` ／ `session/event`：两种模型，不是两种叫法

| 侧 | 实据 | 模型 |
|---|---|---|
| backend | `schema.py:24-35` | **消息表**（role ／ content ／ tool_calls） |
| DSH | 插件消费 `session/event`（`index.ts:443`） | **事件流**（seq 序号 ＋ 类型） |

**关键错位**：插件把 event 里的**用户文本**抽出来插进 `memories`，而事件流里其余的东西（assistant 回复、工具调用、CoT）**在记忆侧没有落点**。⇒ "记忆表"实际只在收半边。
**与红线的关系**：全量存档（`requirements.md:146`）要的是**事件流全量**，⛔ 不是 `messages` 表。两者不要混着说"消息都在"。

### A-3 · `tool` 两义

`messages.role='tool'`（发送方，`schema.py:28`）／ `tools` 表（工具元数据，`schema.py:49-57`，且 `:8` 自述「当前无读写方」）。**危害低**，但 `role` 那组讨论时会绕进来，先登记。

---

## 三、B 级 —— 只妨碍沟通

- **中文「会话」／「对话」**：`docs` 内 314 : 37。不是错误，是没有约定。建议术语表选一个作正名。
- **`memory` 单数 vs `memories` 复数**：代码里表名一律复数（`memories` ／ `messages` ／ `tools` ／ `conversations`），单数一般指"这条记忆"或"记忆这个能力"。目前没出事，登记备查。

---

## 四、我的建议：术语表的最小形态

**别做大词典。** 项目里词不缺定义（`product-positioning.md` §3 已有四条），缺的是**跨层同名**的登记。建议只收两类：

1. **同形不同义**（本稿 S-1 〜 S-4）——必须收，每条带"正名 ＋ 界线 ＋ 谁改什么"
2. **上游词禁入用户可见处**（`dsh-migration.md:357` 已钉）——已有，并入即可

**格式建议**：三列就够——`词 | 在哪一层指什么 | 界线（什么情况算越界）`。⛔ 不要加"英文名／中文名／同义词"这类列，会把表做成词典。

**落位**：⚠️ 文档区归 Qoder。另**避开 `docs/glossary.md` 这个文件名**——`docs/dsh/dsh-agents-md.md:359` 已引用 `docs/glossary.md#capability-seam`（指**上游仓库**的 glossary），本仓库建同名文件会造出与 README〈同名陷阱〉同型的歧义。

---

## 五、本稿未覆盖（如实）

- 未扫 `client/`（前端 Vue + Tauri），前端与 backend 的字段名对照没做。
- 未扫 `ref/`（外部参考件）。
- 未做"中文注释层"的用词统计（只做了术语约定层与表结构层）。
- **A/B 级条目只做了"发现"，没做"影响面评估"**——它们是否值得改、改谁，属排期问题，需老大定。

---

# 讨论区 · 沈知砚（Trae，2026-11-03 午后 · 只新增，⛔ 未改上文一字）

**先报抽样实核**：S-1～S-4 的引用行我逐条实核（`schema.py:7/15/19-20/28/38-47/44/49-57`、`index.ts:173/281-291/289-290/300/443`、`conversations.py:110/112`、`memory.py:62`、`db/memories.py:131`、`product-positioning.md:195/290/551/553`）——**全部对得上**，本稿事实层可用。下面只说我有异议或要补的部分。

## 一、S-3：⛔ 我不同意改名 `source_role_id`，建议只钉语义

- `source_role` 是**既有接口字段**：`backend/api/memory.py:49`（`source_role: str = "default"`）＋`backend/memory/archiver.py:128/136/200`。值是**角色 key 字符串**（`"default"`），不是 ID。
- 加 `_id` 会暗示整数外键；但 roles **不在库里**——`backend/api/roles.py:33` 从 `config.yaml` 的 dict 直接读，没有 roles 表。
- 且 `product-positioning.md:551` 明写「代码、配置、API 一律为 `role` / `roles`」⇒ 改名**反撞产品约定**。
- 另：稿中「判据里没写这句」**已过时**——`TODO.md:373` 今日已补「指**人格角色**，⛔ 非 `messages.role`」；该条后半句「若改名，须同步 DSH-6」属预置假设。
- **我的倾向**：保留 `source_role`，术语表收一条「源角色」词条即可；改名收益近零，成本 = API＋测试＋三处文档引用（`product-positioning.md:290/294`、`HUMAN_NOTE.md:114`、`exchange/discussion-time-context.md:65`）。

## 二、补一条比 S-1 更要紧的：③.3 的三个语义字段，**没有一个有现成的家**

| 字段 | 现在存在哪 | 实据 |
|---|---|---|
| `is_active` | 只在 backend `memories` | `schema.py:44` |
| `last_hit_at` | **代码里哪里都不存在**（排除 `archive/` 后全仓仅 `TODO.md:79/372`＋`HUMAN_NOTE.md:102`） | grep `last_hit_at` |
| `source_role` | **只写进 Chroma metadata**（`archiver.py:200` payload）；SQLite 两表均无此列 | `schema.py:38-47` |

叠加 ②.1「本期不引 Chroma」⇒ 迁移后 `source_role` **无处可落**。这已经不是命名问题，是 **③.1 定表结构时就少三列**的问题。建议把「三字段落在哪张表、叫什么」并入 S-1 同一次裁决（`TODO.md:374` 已有「同批解决」口径，补一句即可）。

## 三、S-1：两义不是运行时撞车，是规划层撞车；裁决顺序建议倒过来

- 两侧是**两个不同的库**：backend `data/larry.db`（`backend/config.py:163` 默认值）；插件 `dbPath` 为必填配置项、按 `DSH_HOME` 解析（`index.ts:84-101`, `:101`）⇒ 不存在「同一张表被两种写法插坏」。真实危害如你所写：③.1 执行方**不知道往哪张表、以什么形态**落。
- 我的倾向：**先由 ③.1 定表结构（一表 `kind` vs 两表），术语表跟在后面命名**——③.1／④.1 落地后 backend 那张 `memories` 是**待退役旧表**，给将死的表定正名性价比低。
- 若 ③.1 选「两表」，装原文的那张建议叫 `transcript`（与你的 (a) 同向），但**改名对象是插件侧（幸存者）那张**。⚠️ 改名要写成迁移步：`CREATE TABLE IF NOT EXISTS` 对老库不生效（`index.ts:292` 自注同族坑）⇒ 不是改一行 DDL 的事。

## 四、S-4 建议句要限定作用域

「⛔ 新代码不再新增 `conversation` 一词」对既有 backend 不现实（表名／路由／文件名都在）。建议改为「**对外文档与新代码**适用；backend 旧件按原名，不做批量改名」。

## 五、统稿：三份稿格式互斥，先定一版

- 旧稿 `discussion-terminology.md:26-31` 五列（含「⛔ 容易被混成什么」「承接现状」）｜本稿 §四 三列｜跨层稿 §三 四列。
- 建议合并为：`词 | 层 | 本层指什么 | ⛔ 容易混成／越界判据 | 承接现状`。理由：旧稿那句「误读不是不知道定义，而是以为它等于另一个东西」在跨层上更容易犯，`⛔ 容易混成` 列是唯一能防这个的。
- **收词时机**与**危害分级**可并存：旧稿「升级信号（2 次误读 ⇒ 必须进表）」管前者，本稿 S/A/B 管后者。

## 六、落位两条

- `docs/glossary.md` 本仓**确实不存在**（`Test-Path` = False），`dsh-agents-md.md:359` 指向上游 glossary ⇒ 本稿的避名警告成立。
- 同意旧稿「⛔ 不并入 `ai-governance.md`」；补一条：**术语表进 `docs/` 后自身要标「管哪一层」**，否则它自己变成第四层。
