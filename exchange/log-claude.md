# Claude 协作区

## 当前状态（2026-08-27）

- **归档系统测试** ✅ 已交付并闭环（commit `2db9130`，11 项 + 级联改写；WB 复验 `ffa3683` + P3.5 语义修复 `50ed895`），交付说明见下方。
- **三点菜单 + 行内重命名回归测试** ✅ 已交付。
- **三轮 UI 调整回归测试** ✅ 已交付。
- **web_search 测试** ✅ 已交付（commit `a58e3ae`，42 项全绿）。
- P4.4 前端测试基建 ✅（31/31，commit `a2d6d8f`）
- conftest 后端测试隔离 ✅（commit `5cd2104`）

---

## 归档系统测试交付说明（2026-08-27，commit `2db9130`）

### 交付物

| 文件 | 覆盖 |
|---|---|
| `tests/test_archive.py`（11 项，新） | 归档双路径（提取+确认写记忆 / 仅归档不写记忆）/ unarchive / 软删+恢复 / purge 硬删 / 列表过滤（默认排除回收站、?archived= 双向、?trash=）/ generate_summary 放宽（已归档可重提取、回收站仍拒绝）/ 重复提取幂等（unarchive→再归档→再 confirm → 同一 memory_id，仅一条活跃记忆） |
| `tests/test_conversations.py`（改写） | 原 test_cascade_delete_messages 拆分为：test_soft_delete_keeps_messages（DELETE 软删语义：deleted_at 置位 + messages 保留 + 回收站可见 + 历史可读）+ test_purge_cascades_messages（purge 硬删级联实证） |

### 关键验证点

- **零真实 LLM 调用**：`POST /api/chat` 的 stream_events 一并 mock（首版漏了，日志出现真实 token 消耗后已修）
- **零真实 key / config / ChromaDB**：archiver 层 chat_completion/embed_batch/insert 全 mock；conftest 临时库隔离
- **全套回归**：113 通过（101 基线 + archive 11 + conversations 拆分 1）/ 42 失败分布与 web_search 基线完全一致（chromadb 6 + integration 3 + shell 14 + file_ops 19），**无新增回归**
- **真实库零写入**：归档测试日志确认走 `D:\Temp\Sys\larry_test_xxx\session.db` 临时库

### ⚠️ 暴露一个语义问题（@WorkBuddy @Trae，P3.5 遗留，非本次引入）

`api/memory.py` 的 trigger_archive 把 `ValueError`（含"回收站拒绝提取"等**业务语义**）统一归并为 `LLMError` → **502**。语义上"回收站会话不可提取"应为 **4xx**（400/404 类），502 是网关语义。这正是我在 P3.5 提过的"conversation not found 变 502"同一问题的另一处落点。

- 测试当前断言"非 2xx 拒绝 + detail 含 trash"（记录现状，不收紧），待 WB 裁定语义后收紧
- 建议：generate_summary 的业务拒绝（会话不存在 / 回收站）与 LLM 请求失败分流——业务拒绝走 4xx 专用异常，LLM 失败才走 LLMError(502)

交 WorkBuddy 复验。

---

## 三点菜单 + 行内重命名回归测试交付说明（2026-08-24）

**背景**：Trae 在老大的直接安排下新增"侧栏会话三点菜单 + 行内重命名"（commit `6a20204`）。审查判断：菜单开合、重命名确认链（Enter/Esc/blur/空输入）是功能逻辑，值得测；BrandText 纯静态渲染、第 4/5 轮纯视觉改动不测。

**交付物**：`client/tests/appLayout.test.ts` 追加 7 项（原 7 项 → 14 项），前端 45/45 全绿 + build 通过。

其余测试覆盖：菜单开合（含 document 点击关闭）/ 重命名 Enter 确认调 API + 重拉列表 / Esc 取消不调 API / 空输入视为取消 / blur 失焦确认 / 编辑态输入框预填原标题。

---

## 三轮 UI 调整回归测试交付说明（2026-08-21）

**背景**：老大直接对接 Trae 完成三轮 UI 调整（欢迎页清理 / 新建会话按钮 / 侧栏标题栏精简，均改 `client/src/components/AppLayout.vue`）。审查后判断：CSS 视觉类改动不值得测（jsdom 测不了视觉），但**新增的功能逻辑 `startNewChat()`（点"＋"→ `selectConversation(null)` → ChatView watch 清空消息显示欢迎页）必须测**。同时删除 RouterLink 导航的副作用（AppLayout 不再依赖 vue-router）一并钉住。

**交付物**：`client/tests/appLayout.test.ts`（7 项）

| 覆盖 | 验证点 |
|---|---|
| 新建按钮逻辑 | 点"＋" → store.currentConversationId 清空为 null（含已有会话列表时） |
| 会话列表 | 空状态"暂无会话" / 有数据渲染 / 空标题"新会话"占位 |
| 会话交互 | 点击列表项 → selectConversation + active 高亮 |
| TopBar | 选中会话标题显示 / 未选中显示应用名 |

**验证**：`npm run test:unit` 38/38 全绿（31 存量 + 7 新增）；`npm run build` 通过。

---

## web_search + Tool 底座测试交付说明（2026-08-20，commit `a58e3ae`）

### 交付物（3 个测试文件，42 项）

| 文件 | 覆盖 |
|---|---|
| `tests/test_web_search.py`（28 项） | Brave provider 解析（mock httpx：成功 / 空结果 / 坏 JSON / 缺 web 字段）；provider 可插拔契约（注入 mock provider 正常产出 / 未知 provider 抛 ToolError）；降级路径（空 query / 超时 / 429 重试后成功 / 无结果 / max_results 钳制）；SSRF 钩子（10 类内网地址拦截 + 4 类公网放行 + query 内嵌 URL 拦截 + run() 归一验证） |
| `tests/test_tool_base.py`（10 项） | run() 护栏：超时强制（wait_for 截断，实测 <3s 而非等满 5s）/ ToolError 归一 / 普通异常归一 / _validate_request try 内（校验失败不中断）/ 执行日志（caplog）/ execute 向后兼容 / schema 生成 |
| `tests/test_tool_registry.py`（3 项） | enabled_tools 过滤 / 空列表全启用 / 未知工具跳过 + warning；全局注册表前后恢复隔离 |

### 关键验证点

- **零真实 key / 零真实 config**：全部 mock provider / mock httpx；conftest 隔离兜底（autouse 断言真实库 fail-fast）
- **全套回归**：101 通过（59 存量基线 + 42 新增）/ 42 失败全部为已知存量债务（chromadb_degradation 6 + integration 3 + shell get_event_loop 14 + file_ops get_event_loop 19），**无新增回归**
- **真实库零写入**：全套跑后会话数 41 未变（41 = 07:03 测试残留 13 + 用户 17:21 试服务 1 条真实会话，非本次写入）

### 一个实现观察（@Trae @WorkBuddy，不越界改）

`WebSearchTool` 构造时 `get_config().search`——若 config 缺 `search` 段（老配置没同步），`get_config().search` 是 `SearchConfig` dataclass 默认实例（dataclass 已给默认值），不会崩。已由测试覆盖（registry 空列表全启用路径会构造 WebSearchTool）。

交 WorkBuddy 复验。

---

## 归档系统测试派发（2026-08-27，WB 派发 → 已交付闭环 commit `2db9130`）

**背景**：Trae 实现归档系统（派发见 `exchange/log-trae.md`，已闭环）。Claude 补后端单测，覆盖会话侧 archive/trash 全套 + 记忆提取放宽硬卡。WB 读码 + 跑测试复验已通过（`ffa3683` + `50ed895`）。

**被测点（新增单测，建议入 `tests/test_conversations.py` 或新建 `tests/test_archive.py`）**

| 模块 | 用例 |
|---|---|
| 归档双路径 | A. 提取+确认：`POST /memory/archive`（mock LLM 出摘要）→ `POST /memory/archive/confirm` → 断言 `is_archived=1` 且 `memories` 表有写入 + ChromaDB 隔离写入；B. 仅归档：`POST /conversations/{id}/archive` → `is_archived=1` 且 `memories` 表**无**新增 |
| 取消归档 | `POST /conversations/{id}/unarchive` → `is_archived=0` |
| 回收站软删 | `DELETE /conversations/{id}` → `deleted_at` 非空、`messages` 级联保留（恢复可见） |
| 恢复 | `POST /conversations/{id}/restore` → `deleted_at` 重置 NULL |
| 硬删 purge | `POST /conversations/{id}/purge` → 硬 DELETE、`messages` 级联清空 |
| 列表过滤 | 默认 `list_conversations` 排除 `deleted_at` 非空（活跃列表不含回收站）；`?archived=` 透传过滤 `is_archived`；`?trash=`/`include_trash=True` 仅列回收站 |
| `generate_summary` 放宽（关键行为变更） | 已归档会话（`is_archived=1`）可再次提取 → 成功出摘要（验证 `memory/archiver.py:76` 硬卡已放宽）；回收站会话（`deleted_at` 非空）仍 `raise` 拒绝 |
| 重复提取幂等（Marvis 评审纳入） | 同会话 unarchive→再归档→再 confirm → `memories` 表仍仅一条 `is_active=1` 记忆（按 `source_conversation_id` 查重覆盖，非复制）；向量随内容更新（隔离集可行时断言） |

**测试方法**
- 复用 `tests/conftest.py` 隔离（autouse 真实库 fail-fast）；用临时/隔离库与隔离 ChromaDB，禁读写真实库。
- `generate_summary` 的 LLM 调用必须 monkeypatch 返回假摘要——**零真实 key / 零真实 config**，不碰 `config.yaml`。
- `confirm_and_store` 的 ChromaDB 写入走隔离集合或被 mock，不污染真实 collection。
- 端点测试走 FastAPI TestClient（沿用 web_search 同款隔离手法）。

**约束（Tier0）**
- 测试隔离：禁读写真实库；真实库零写入（全套跑后会话数不变，参照 web_search 交付基线的 fail-fast 断言）。
- key 不落日志/输出；测试用 mock，不碰真实 key/config。
- 不越界改实现（发现问题按 web_search 先例 `@Trae @WorkBuddy` 标注，不改代码）。

**验收**
- 新增用例全绿；全套回归对比 web_search 基线（101 通过 + 已知存量债务：chromadb_degradation 6 / integration 3 / shell get_event_loop 14 / file_ops get_event_loop 19），**无新增回归**。
- 交付说明回写本文件（仿 web_search 段：覆盖表 + 关键验证点 + 零真实 key/config 证据 + 真实库零写入证据）。
- 交 WorkBuddy 复验（读代码 + 跑测试绿）。
