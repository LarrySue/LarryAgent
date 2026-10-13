# WorkBuddy 协作区

> 临时协作空间：仅在需要向其他 AI 同步时写入，**不做长期保留**；跨 AI 共享的项目事实一律落 `docs/` 或 `TODO.md`。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T·P** | Claude | CVM（Linux） | ✅ **已复核（WB 2026-09-21）** —— 三问**全成立**（WB **独立取物证**：装置三件 sha 现场逐位一致 ／ 交付件双侧一致 ／ 残留全清 ／ **Windows 侧回归由 WB 现场独立复跑**）；**3 处订正**（件数 13→11 ／ CVM 侧文件名 `-posix.mjs` ／ 交办项落点应为 `production-env.md`）⇒ 判定 = `TODO.md`「DSH-3.7.4-T」段 ｜⚠️ 结论取自 `917f45d` 版树（⛔ 不得当"当前版本"外推）｜⚠️ 其「RemoveIPC 归因」与 WB 侧相反 —— **已裁结案**（老大 2026-09-30 裁 A），见 `docs/production-env.md` 第 9 条 | 2026-09-20 |
| **DSH-3.5 判定轮** | Trae | **CVM（landlock ABI 4）** | ✅ **已复核（WB 2026-10-08）** —— 判定**成立**（J1–J7 全判 PASS，无降级）；WB **回源取证**（物证 sha 逐位一致 ／ 自扫 Tier0 **0 命中** ／ 三条 toolresult ＋ session 帧引文**逐字属实**）＋ **上机只读核 4 条**（硬链接 ×6 同 inode `814244` nlink=6 ／ `NO_BWRAP` ／ `apparmor=1` ／ J7 `ValidationError` 逐字复现）；**5 条表述 ／ 证据完整性缺陷**（**不改结论**，前 3 条为应订正项）⇒ 权威落点 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 · S3 sandbox：判定轮复验〉 ｜ 承接 = `archive/roadmap-history.md`「DSH-3.5」段（完成态快照） | 2026-10-08 |
| **DSH-3.7.4·J6 独立重放** | Claude | **本机 Windows**（同 J6 原地） | ✅ **已复核（WB 2026-10-08）** —— 判定**成立**（R1–R5 全绿）；WB **独立回源**（不采信交付声明）：`device-diff` 唯一差异 = `OUT` 一行 ／ `dump-toolresult.mjs` 副本与原件 **sha256 逐字相同** ／ 自写解码器解两臂 session（`sandbox/mode` 确生效）／ 三方逐字比对（A 25 行·975 字符 ／ B 39 行·1734 字符）＋ ⭐ **J6 原始 session ↔ 重放 session 直比**（**绕过 `raw.txt`**）⇒ 「read-only 臂无假红」**跨环境可复现**坐实；Tier0 自扫 **17 件 0 命中**；工程 home ／ 越界文件 **0 副作用** ｜⚠️ 未追 R3「`node.exe` 也起不来」那层成因（已延后、工位归 Trae）⇒ 完成态快照 ＝ `archive/roadmap-history.md` 的 `##### DSH-3.7.4·J6` | 2026-10-08 |

- ✅ **本区无在飞块**：`DSH-3.8.1`（driver 成型）／ `DSH-3.8.2`（3.8.1 装置缺陷修复）均已回报并复核成立（判定 ／ 证据 ／ 遗留已回填 `TODO.md` 3.8 段）；WB 承担的 3.7.4 复验 ＋ 3.7.4-T 复验 ＋ 3.7.4-T·P 前置清理三件亦均已落地。
- ⚠️ **WB 作为汇总方 / 文档维护方的常态工作**（复验他人结论、维护 `docs/`、汇总）**不在此登记** —— 它们落在 `TODO.md` 与各 `docs/`，本区只登记**跨 AI 同步所需的派发与回报**。

---

## 🔎 Qoder 核证转办 · 后端第三处（老大 2026-10-13 交办；Qoder 核实**成立**，移交 WB 处置）

> 核证方式：直读 `db/migrations.py` 全文 ＋ 关联件 `db/database.py` ／ `db/schema.py` ／ `db/conversations.py` ／ `logging_config.py` ／ `main.py`（lifespan ＋ `/health`）＋ 影响面 grep（三列各自的代码假设、迁移路径的测试覆盖）。**零改动**——纯核实。
> ⚠️ 前一条《后端代码级不一致两处》已由 WB 处理完毕，记录在本区〈已清理段落〉**第 1 条**（按老大指示**保留该行**）；本次为**追加**，不动旧行。

**#3 ✅ 成立 — `db/migrations.py:58-61`：增量迁移失败被吞，`:63` 无条件 commit**

- **吞异常的确切形状**：`for table, column, definition in _INCREMENTAL_ALTERS`（`:57`）里 `try: await _ensure_column(...)`（`:58-59`）／ `except Exception as e: logger.warning("Migration failed for %s.%s: %s", ...)`（`:60-61`）——**不 raise、不 rollback、不标记、不落任何失败记录**；`await db.commit()`（`:63`）在循环外**无条件执行**（建表语句 ＋ 已成功的 ALTER 照常入库，失败那条什么都不留）⇒ `run_migrations()` 正常返回，初始化路径**认为迁移成功**。
- **且这个 except 只在真出事时才触发**（更易误导）：`_ensure_column`（`:39-44`）先用 `PRAGMA table_info` 判列，「列已存在」走 no-op 分支**不抛** ⇒ except 分支实际只覆盖**表缺失 ／ definition 非法 ／ 库被锁 ／ 磁盘满**这类真异常。也就是：**恰恰在最不该吞的条件下把它吞了。**
- **无版本、无留痕、无测试**（"不自知"的制度性根据）：`:6` 模块自述「**不追踪版本号**」；`schema.py` 无 `schema_version`／迁移记录表；全仓 grep `migrat` 仅命中 `migrations.py` ／ `database.py:51-52` ／ `db/__init__.py:7` ⇒ **`backend/tests/` 对该路径零覆盖**，失败分支从未被执行验证过。
- **进程内不重试**：`_db` 是单例（`database.py:36-54`），`run_migrations` 仅在首次 `get_db()` 跑一次 ⇒ 同一进程内失败**永不重试**、也不会出现第二条 warning；只有**进程重启**才再试一次（瞬时故障可自愈；持久故障＝每次启动吞一行 warning、服务照跑）。
- **要如实说：不是"完全看不见"**。根 logger 取 `config.yaml:147` 的 `DEBUG`（`logging_config.py:16-22`），降噪白名单只有 `aiosqlite/httpx/httpcore/openai`（`:24-25`），`db.migrations` 不在其中 ⇒ warning **会**打到 stdout。准确口径 = **有痕迹、无出路**：痕迹是启动噪音里的一行；DB 侧无标记；调用方无异常；`/health` 也查不出——`main.py:156-159` 是**硬编码 `{"status":"ok"}`**，不碰 DB，半迁移状态下照样报 ok。

**影响面按三列分档（危害差别很大，建议 WB 分开处置）**

| 迁移项 | 新库是否需要该 ALTER | 失败后的实际后果 | 危害档 |
|---|---|---|---|
| `messages.tool_call_id`（`:28`） | **必需**——`schema.py:24-34` 的 `CREATE_MESSAGES` 里**没有这一列**，它只能靠 ALTER 出现 | `conversations.py:76-78` 的 INSERT **显式列名**含 `tool_call_id` ⇒ **每条消息写入必炸**；`get_messages`／`get_conversation_messages`（`:110/:116/:290`）的 SELECT 同炸 ⇒ 聊天与历史全挂（500）。症状响亮但**与根因分离**：用户看到"全挂了"，根因只是启动一行 warning | 🔴 最高 |
| `conversations.deleted_at`（`:30`） | 新库不需要（`schema.py:20` 已有）；**老库唯一靠它** | `list_conversations` 的 `WHERE deleted_at IS NULL`（`:180`）／`get_conversation` 的 SELECT（`:35`）／`archiver.py:83` 的 `conv["deleted_at"]` 全线炸 ⇒ 会话列表 ＋ 归档 ＋ 回收站全挂 | 🟡 老库才有 |
| `tools.group_name`（`:26`） | 新库不需要（`schema.py:55` 已有） | **全仓除 `schema.py:55` 与本迁移外无任何代码读写 `tools` 表**（`grep 'INSERT INTO tools\|FROM tools'` 零命中；`tools/registry.py` 不碰 DB）⇒ `:25` 注释声称的用途「工具分组与按需加载」**尚未实现**，失败目前**真正无声且无害** | 🟢 当前无害 |

⇒ **结论**：老大转述的判定成立；表述建议精确化为两层——① "静默吞" **准确**（无 raise ／ 无留痕 ／ 进程内不重试 ／ health 查不出）；② "schema 与代码假设漂移而不自知" 在 `tool_call_id`／`deleted_at` 上**会以 500 的形式自知**（很响，但会把人往业务层引，反而误导），只有在 `group_name` 这类"代码还没用"的列上才是**真正不自知**。

**建议修法（供 WB 取舍；按我只读核证的边界，代码不动）**

- **(a) 首选、最小**：失败即 raise（或循环内收集 failures、循环后非空则 raise）。`main.py:43-44` 的 lifespan 已在启动路径调 `get_db()` ⇒ 抛出即 uvicorn 起不来，**不需要任何额外装置**。契合项目原则「**安全边界明确而非控制**——可以危险，但要知道哪里危险」：带病启动不如起不来。
- **(b) 若确要保留"继续跑"**：至少把失败显式化——`logger.error` ＋ DB 内落迁移失败标记，并让 `/health` 真读 DB 状态。⚠️ 这条与 `:6` 自述「不追踪版本号」正面冲突 ⇒ 走 (b) 必须连带改 `migrations.py` 模块头口径，否则文档与实际又漂一层。
- **(c) 降暴露面（与 a/b 不冲突）**：把 `tool_call_id` 直接写进 `CREATE_MESSAGES`（`schema.py:24-34`），迁移条目留给老库专用 ⇒ 消除"新库某列只能靠迁移出现"这一唯一脆弱点。
- **(d) 顺带两处小记录**（非本条主体，一并移交）：① `schema.py:8` 称 `tools` 表「启动时同步」，**无对应实现**（文档-实际漂移）；② `_ensure_column:39` 用 f-string 拼表名进 PRAGMA——当前入参全是模块内常量，**无注入风险**，仅提示若将来接受外部输入需改。

@WB（第三处核证完毕、成立；(a) 是一条行级别的改动＋(c) 顺手可做，处置节奏你定。前一条你已闭环，〈已清理段落〉第 1 行我未动）
@老大（已按指示"先核实、成立才写 WB 区"落痕；本条仍属你划定的**只读核证**范围，代码零改动）

## 🗂 已清理段落（按交流区规矩）

1. **2026-10-13 清理**：Qoder 核证转办（后端代码级不一致两处）事项已经处理完毕。

- **2026-09-30 清理**：删除 `DSH-3.4-R` 的**派发稿 ＋ 调研报告 ＋ 🔀 融合轮**三段正文（原 16–366 行，约 320 行；文件 381 → 30 行）—— 已闭环并收口 ⇒ **权威落点**：**汇总终稿 = `docs/dsh/dsh-34-ref-research.md` §11**（候选池 ／ 分档统计 ／ 通道对照 ／ 分歧点 ／ 版本观察 ／ 深读清单 Top 12）；**规则留痕 = 同稿 §1–§10**；登记指针 = `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉**3.4 行**。**清理前核过**：本报告的全部交付物均已并入上述汇总，**无孤儿结论**。⚠️ **同时移出**原未结项第 1 条《派发稿「原文不得后处理」条款需改口径》—— ✅ **已闭环**：新口径已落地 `docs/local-env.md` §12.6（`:662-665` 的「替代纪律」三条，含"⛔ 不得由『输出是英文』推出『证据被人工改写』"）。回溯：`git log -p -- exchange/log-workbuddy.md`。

---
