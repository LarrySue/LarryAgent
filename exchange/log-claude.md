# Claude 协作区

> **属主 = 顾衡**（Claude Code；2026-10-19 老大让我自己起的名。叫顾衡、小顾都行）。**岗位**：代码测试 AI —— 评审实现、编制并运行测试、取证。
> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| 记忆归属讨论（A3 → A4 复核轮） | 顾衡 | `archive/memory-ownership/memory-ownership-voices.md` | ✅ **已收口（2026-10-24）**：A3／A4 原文随定稿归档，结论进 `docs/la-space/`。本行仅留指针，⛔ 无待办 | 2026-10-20 |
| 现成实现补调研（数据契约／索引／导出层） | 顾衡 | 本 log〈回报〉节（**本段暂留，见下**） | ✅ **已交付并合入定稿**（`docs/la-space/tech-reference.md` §6.2）；⚠️ **本段按「零承接」挂起未清** —— 7 家的 **版本／commit／许可 ＋ 逐框架 `文件:行` ＋ 克隆命令**在 `docs/` **零命中**（2026-10-28 WB 复核：7 个 commit 哈希、`letta-code`、`ArchivedTextualMemory` 逐项 0；⚠️ `clone --depth` 字面有 4 处命中但均属 `docs/dsh/` 的 DSH 调研语境，**不含本段这 7 家仓库清单**）⇒ 删则不可复算。**其余已承接内容已于 2026-10-28 压为指针**（见〈结论先行〉〈三个特别问题〉两节） | 2026-10-22 |
| — | — | — | ✅ **本区无其他在飞块** —— DSH-3.6 判据反向举证评审已闭环（18 漏洞全部落入判据 v3；原文回溯 `git log -p -- exchange/log-claude.md` ／ 提交 `1b5d07c`） | — |

> ⚠️ **不要把本区当承接目标**（活日志会被随时清理 ⇒ 引用必成断链）；**回溯一律 `git log -p -- exchange/log-claude.md`**。
> 📝 **过程留痕（2026-10-16 晚 · 与 WB 并发撞车 · 双向已互核，零丢失）**：F1 销账提交与 WB 侧提交撞车 —— ① **我 → WB**：首版 `7abca33` 误带 WB 已 `git add` 未提交的 `.workbuddy/memory/2026-10-16.md`（共享工作树＋暂存区）⇒ 我 `git reset --soft` 拆出、路径限定重提；② **WB → 我**：reset 后暂存区里**我的 log 改动反被 WB 的提交 `effa8a1` 一并带入**（`git log -- exchange/log-claude.md` 可见该笔 32 行改动＝本文件 F1 销账）⇒ 我这笔 `fcb326f` 只剩本行留痕。**结果：双方内容均完整入库、零丢失** —— WB 已在其提交信息留痕「本段被 Claude 7abca33 代提入库、内容已核完整」并复验我的 F1 落点（§3.6:1154 三核过）。仅**归属错位**，⛔ 不追改（旧提交不回改；reflog 链 `7abca33 → a1f5b04 → effa8a1 → fcb326f` 可溯）。教训：**共享工作树下提交前先核暂存区，一律路径限定提交**。

---

## 🔍 自检 · 挂账（2026-10-13 自检 → 2026-10-16 全部销账后）

> 原 F1–F7 与〈未闭合项〉1（F1）均已于 2026-10-16 销账／清理（承接逐条见文件末〈🗂 已清理段落〉）⇒ 本段现只剩**挂账 2 条、无待裁项**。

1. **F3-1 的成因未定**（内层 `echo $?` 为何取到 0）—— 只换口径、未深挖；若日后仍走 `wsl.exe` 取证，**一律用外层返回码**（已入记忆）。
2. **未做**：CVM 上 `--fs-mask 0xffff`（ABI 4 拒 / ABI 7 收）那条交叉对照未重跑（10-08 已双场地各证一次）—— 与自检靶子无关，未扩范围。

---

## 📮 回报 · 现成实现补调研（数据契约／索引／导出层 · Claude · 2026-10-22）

**对应派发**：`exchange/memory-ownership-tech-reference.md` §六 块二。**性质**：只报增量；⛔ 未部署、未装依赖；证据＝浅克隆源码阅读（🟢 源码里确实这么写）＋机制推断（🟡），**未运行任何框架**。

> ⚠️ **本段为「零承接」挂起段，⛔ 暂不清**（2026-10-28 WB 复核）：`docs/` 已承接**结论**（§6.2 九行表 ＋ 末注），但**可复算性本体**零承接 —— 7 个 commit 哈希、`letta-code`、`ArchivedTextualMemory` 逐项 0 命中。（已承接的〈结论先行〉〈三个特别问题〉两节已压为指针。）
> **承接建议（Qoder 照此补两处，补完本段可整段删）**：① `tech-reference.md` §6.2「抽验记录」（2026-10-28 实况 `:157`）后加一张 **7 行版本表**（框架 ｜ 版本 ｜ commit ｜ 日期 ｜ 许可），数据照本文件〈逐框架取证表〉首列抄；② §6.2 表末补 4 行**「失败态」**（取〈判据〉表的最后一列：MemOS 原地覆盖／MIRIX 软删漏过滤／Cognee 自增 id 断链／Mem0 只有 session_id）。⚠️ 定位用**节锚**「§6.2 抽验记录」，⛔ 不按行号（编辑后必漂）。

### 结论先行（已承接，此处只留指针）

**原五条结论已逐条落 `docs/la-space/tech-reference.md` §6.2**（2026-10-28 WB 逐条回源核过：能直接嵌 **0 个** → §6.2 末注；导出规范化＋版本号＋重建脚本 **0 套** → §6.2「导出＋重建」行；设计参照四家 → §6.2 前五行；索引层 → §6.2「索引层」行）。**本节以下只留 `docs/` 尚未承接的部分**（版本／commit／许可、逐框架 `文件:行`、克隆命令）—— 那是一旦删除便不可复算的内容。原文见 `git log -p -- exchange/log-claude.md`（清理前 = `cb745c5`）。

### 逐框架取证表

| 框架（版本 · commit · 日期） | 稳定 ID | 版本 | tombstone | 导出／规范化 | 索引重建 | 许可 | 结论 |
|---|---|---|---|---|---|---|---|
| **Letta**（letta-code `035bb8c` · 2026-10-18；旧仓 V1 已迁） | agent 目录＋块文件路径 | **git commit**（memory 仓） | 无（靠 git 历史） | Markdown＋frontmatter（`description` 必填）；pre-commit 校验 | 无（git 即真相源） | Apache-2.0 | **借设计**：`memfs-v2` 目录树＋frontmatter 校验＋git hook，不嵌代码 |
| **Mem0**（2.2.1 · `2c81af3` · 2026-10-20） | `memory_id`（uuid）＋`user/agent/app/run` scope | `history` 表（`old_memory/new_memory/event`，旁路审计） | **仅 history 记 `is_deleted`；本体物理删**（`vector_store.delete`） | ⛔ 无导出 API | ⛔ 无 | Apache-2.0 | **部分借**：scope 四元组选；history 表不选（不留底） |
| **Graphiti**（0.31.2 · `8e320f8` · 2026-10-21） | uuid | **bi-temporal**：`valid_at`／`invalid_at`／`created_at`（边失效） | **物理删**（`remove_episode` → `delete_by_uuids`＋`episode.delete`） | ⛔ 无 | ⛔ 无 | Apache-2.0 | **只借字段语义**（时间轴），实现不选 |
| **MemOS**（2.0.33 · `a7367d0` · 2026-09-22） | uuid＋`memory_type` | **`version` 递增＋`history: ArchivedTextualMemory[]`＋`archived_memory_id`**；`status: activated/resolving/archived/deleted` | **状态机含 `deleted`**（软删） | `dump/load`：空目录＋`model_schema` 校验；⛔ 无格式版本头、无规范化脚本 | ⛔ 无（`export_graph` 是导出，不是重建） | Apache-2.0 | **借设计**（首选参照）：版本链＋状态机＋provenance 字段 |
| **MIRIX**（0.1.0 · `8cb06a6` · 2026-08-20） | `id`（uuid）＋**`agent_id`** | `last_modify`（时间戳＋操作） | **`delete()`＝软删（`is_deleted=True`）／`hard_delete()`＝物理删，分离干净** | ⛔ 无导出 | ⛔ 无 | Apache-2.0 | **借设计**：软／硬删分离＋agent_id 归属 |
| **A-MEM**（0.0.1 · `ceffb86` · 2025-12-12） | `memory_id` | ⛔ 无 | **物理删**（`collection.delete`＋`del memories[...]`） | ⛔ 无 | ⛔ 无 | MIT | **不选**（研究原型：全局 dict＋Chroma） |
| **Cognee**（1.6.5 · `37f788b` · 2026-10-16） | **`id` UUID 稳定**（注释明写「id 不含内容信息，内容变了 id 不变」）＋`legacy_id` 旧 id 链 | ⛔ 无版本链 | **物理删**（`delete(Data)`＋引用计数后删文件） | ⛔ 无（有 Alembic 迁移） | ⛔ 无（ECL 可重跑＝重抽取） | Apache-2.0 | **借设计**：稳定 id 语义＋`legacy_id` 链 |

### 三个特别问题的直接回答（已承接）

三问的答案均已并入 `docs/la-space/tech-reference.md` §6.2 对应行（① 直接嵌 0／借设计 4 家 → 末注 ＋ 表体；② 无现成导出规范化与重建脚本 → 「导出＋重建」行；③ 无现成索引层、最小落法纯 SQL → 「索引层」行）⇒ 此处不复述。

### 判据（选它／不选它＋最小验证＋失败态）

| # | 候选 | 结论 | 最小验证 | 失败态（必须能构造） |
|---|---|---|---|---|
| 1 | MemOS 版本链 | 选 | `memories` 加 `version`＋`status`＋`archived_from`；update＝旧行置 `archived`、新行 `version+1` | 不迁移时 update 原地覆盖，旧值不可查（**本仓现状即此**） |
| 2 | MIRIX 软／硬删分离 | 选 | `is_deleted` 默认 0；删除只置 1；召回 SQL 加 `WHERE is_deleted=0`；维护脚本提供 hard_delete | 软删后召回未过滤 ⇒ 已删记忆仍被注入（泄露） |
| 3 | Cognee 稳定 id | 选 | 迁移后 uuid 主键、原自增 id 进 `legacy_id`；Chroma id 改用 uuid | 外部引用按自增行 id（**本仓现状**）⇒ 重建／迁移后断链 |
| 4 | Mem0 scope 四元组 | 选 | 每条带 `agent_id`＋`domain`＋`provenance`；共享条带 `writer` | 只有 `session_id`（本仓现状）⇒ 跨库合并必撞、归属靠目录推断 |
| 5 | Mem0 `history` 表 | 不选 | 查 `history` 能还原一次改口（old/new/event） | 删后 `vector_store.delete` 已无该 id ⇒ 证明它不留底 |
| 6 | Graphiti bi-temporal | 只借字段 | `valid_at/invalid_at` 打点后按时间点查 | `remove_episode` 物理删 ⇒ 负不起「改口不覆盖」 |
| 7 | Letta memfs 布局 | 借设计 | 照 `memfs-v2` 生成 `MEMORY.md` 树＋frontmatter；DSH 插件读成索引 | 缺 `description` 的 pre-commit 应拒（可抄成负向测试） |
| 8 | A-MEM | 不选 | — | 删除即物理消失，无版本／导出（不适合人格本体） |

### DSH 适配代价

- **自研契约（推荐路径）**：`memories` 表加列（`id` uuid／`agent_id`／`domain`／`status`／`version`／`archived_from`／`provenance`／`created_at` 带偏移）＋迁移脚本＋导出（JSONL＋版本头）＋导入（赋号）＋索引重建脚本＋测试。**不引入任何依赖**，与 `node:sqlite` 同栈。
- **借 MemOS 字段**：零运行时成本（字段对齐）。
- **嵌 Python 框架（Mem0／MIRIX／Graphiti／Cognee／MemOS／A-MEM）**：不可行（运行时栈不同，且各自绑图库／向量库）。
- **嵌 letta-code**：不可行（需剥离其 agent／client／backend，工作量＞自研）。

### 证据与复算

- 克隆（浅克隆，临时目录 `D:/Code/_tmp/mem-research-20261022`，**未装依赖**）：`git clone --depth 1 --single-branch https://github.com/{letta-ai/letta-code, mem0ai/mem0, getzep/graphiti, MemTensor/MemOS, Mirix-AI/MIRIX, agiresearch/A-mem, topoteretes/cognee}.git`
- 关键文件:行（均为各仓克隆后路径）：
  - MemOS 版本链：`src/memos/memories/textual/item.py:60-140`（`ArchivedTextualMemory`／`TextualMemoryMetadata.version/history/status`）；dump：`src/memos/memories/textual/tree.py:460-500`；schema 校验：`src/memos/mem_cube/general.py:60-67`。
  - MIRIX 软／硬删：`mirix/orm/sqlalchemy_base.py:428-444`；`is_deleted` mixin：`mirix/orm/base.py:19-21`；`agent_id`：`mirix/orm/episodic_memory.py:32-50`。
  - Cognee id 语义：`cognee/modules/data/models/Data.py:28-42`（注释＋`legacy_id`）；删除：`infrastructure/databases/relational/sqlalchemy/SqlAlchemyAdapter.py:401-459`。
  - Mem0 history：`mem0/memory/storage.py:98-140`；物理删：`mem0/memory/main.py:2114-2135`。
  - Graphiti 时间字段：`graphiti_core/nodes.py:98,322`；物理删：`graphiti_core/graphiti.py:2174-2225`。
  - Letta memfs：`letta-code/src/agent/memory-filesystem.ts:1-60,312+`；git hook：`src/agent/memory-git-hooks.ts:1-70`；格式版本：`src/agent/memory-format.ts`。
  - A-MEM 物理删：`agentic_memory/memory_system.py:398-411`。
- 版本／commit／日期见上表；许可：除 A-MEM（MIT）外均 Apache-2.0。

### 边界（⛔ 不可外推）

- 🟢 仅指「源码里确实这么写」；**运行时行为未验**（任务禁止部署）——MemOS dump/load 实跑、MIRIX 软删在查询层的实际过滤，均未跑。
- 7 家之外未扩面；「同类件」只到概念层（LangGraph checkpoint ⛔ 未验），不作推荐。
- 本回报不改已拍五项；未发现需要推翻 tech-reference #15 判据的证据（反而佐证「id 集合＋document 逐字相等」是唯一可执行判据）。

## 🗂 已清理段落（按交流区规矩 · 只留最新一条）

- **2026-10-28 两轮（WB）**：**第一轮**删派发件 2 段 —— 补调研派发（回报已在本区）＋ 剪枝复检派发／回报（断链去向：`move-in-plan.md` §2「入住闸另含两项」、`requirements.md` §7）。**第二轮**（按「零承接 ≠ 可删」判据复审）删〈结论先行〉5 条 ＋〈三个特别问题〉5 行 —— 逐条对到 `tech-reference.md` §6.2 后压为指针；**保留**〈逐框架取证表〉〈判据表〉〈DSH 适配代价〉〈证据与复算〉〈边界〉（7 个 commit 哈希／`letta-code`／`ArchivedTextualMemory` 在 `docs/` 逐项 0 命中，7 家克隆命令亦未承接 ⇒ 唯一副本）＋ 自检挂账 2 条 ＋ 10-16 撞车留痕。回溯 `git log -p -- exchange/log-claude.md`（清理前 = `cb745c5`）。
