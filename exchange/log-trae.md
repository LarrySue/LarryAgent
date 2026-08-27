# Trae 协作区

## 当前状态（2026-08-27 更新）

- **归档系统** ✅ 已实现并闭环（Trae `43213e3` + Claude 测试 `2db9130` + WB 复验 `ffa3683` + P3.5 语义修复 `50ed895`）：后端软删+回收站+归档/取消归档/恢复/purge 全套 + archiver 幂等 + 前端三点菜单「归档」+ 确认弹窗 + 摘要编辑面板；详情见下方「归档系统派发规格」。
- **web_search 工具 + Tool 框架底座** ✅ 已交付（Trae，2026-08-20），交付说明见下方；等 Claude 补规范测试 + WorkBuddy 复验。

---

## web_search + Tool 框架底座 交付说明（2026-08-20，实现本体）

### 改动文件清单（6 文件：1 新增 + 5 修改）

| 文件 | 改动 |
|---|---|
| `tools/web_search.py`（新） | WebSearchTool（注册名 `web_search`）+ SearchProvider 抽象 + BraveSearchProvider + SSRF 拦截钩子 + 指数退避重试 + 降级信号 |
| `tools/base.py` | 护栏基类：`ToolError` + `guard_level` + `timeout` + `run()` 模板方法（超时强制 + 错误归一 + 执行日志 + `_validate_request` 钩子）；`execute` 接口不变（向后兼容） |
| `tools/registry.py` | 配置驱动启用：读 `config.tools.enabled_tools` 过滤注册；空列表 = 全部启用（向后兼容）；新增工具只需在 `_available_tool_classes()` 登记 + config 加名字 |
| `config.py` | 新增 `SearchConfig`（provider/brave_api_key/timeout/max_retries/max_results）+ `ToolsConfig.enabled_tools` |
| `config.yaml` | 加 `search:` 段 + `tools.enabled_tools` 列表（含 web_search） |
| `services/chat_service.py` + `api/tools.py` | 工具调用点 `execute()` → `run()`（护栏统一入口） |

### 功能点对应

| 规格要求 | 实现 |
|---|---|
| provider 可插拔 | `SearchProvider` ABC + `BraveSearchProvider`（GET Brave API，`X-Subscription-Token`）；换 SearXNG 只写新类 |
| 超时 + 降级 | 每轮尝试 `asyncio.wait_for(timeout=8s)`；tenacity 指数退避（最多 2 次重试）；仍失败 → `ToolResult(success=False, error="未能联网核实：...")`，chat_service 传给 LLM 降级为正常回答，不报错不中断 |
| SSRF 拦截 | `_validate_request` 钩子（在 `run()` try 内，失败归一不冒泡）；`_is_blocked_ssrf_url` 拦 169.254/10.x/192.168/127.x/localhost/0.x/100.64；域名留 DNS 解析给将来 web_fetch |
| 配置驱动启用 | `enabled_tools` 列出启用工具；空列表兜底全开 |
| 前端展示 | 复用 P4.4 ToolCallCard（SSE tool_call/tool_result 事件驱动），零新组件 |
| key 安全 | 仅 backend config 读取；测试用 mock provider，不碰真实 key |

### 护栏基类设计决策（重要）

- **不破坏现有工具**：`execute` 保持抽象接口，FileOpsTool/ShellTool **零改动**（run() 自动给它们加错误归一 + 执行日志；ShellTool 的 30s 超时仍在 execute 内部，run() 的 timeout=None 不嵌套强制）。
- **`_validate_request` 在 try 内调用**：校验失败（ToolError）归一为失败 ToolResult，不中断聊天（自测发现并修复）。

### 自测验证（内联 mock，非测试文件）

- SSRF 拦截：169.254.169.254 / 10.x / 192.168.x / 127.x / localhost 全部拦截；公网域名/IP 放行 ✅
- 成功路径：mock provider 返回结果 → ToolResult(success=True, content 含标题+URL+摘要) ✅
- 降级路径：provider 抛异常 → 重试后 `未能联网核实：网络搜索超时（>8.0s，重试2次）` ✅
- SSRF query 拦截：query 含内网 URL → 归一为失败结果 ✅
- 空 query → 失败结果 ✅
- 工具注册：`['file_ops', 'shell', 'web_search']` ✅

### 回归验证

- 核心测试（chat_service/exceptions/auth_middleware/conversations/llm_retry）：**58 passed** ✅
- shell + file_ops 单文件跑：**34 passed, 1 failed**（`test_windows_dir` 为 TODO 已记录存量债务：中文 Windows 编码断言）
- ⚠️ 混跑 7 个测试文件会触发旧测试代码 `asyncio.get_event_loop()` 与 Python 3.11 的既有互操作污染（非本次改动引入，单独跑各文件均正常）

### 待 Claude / WorkBuddy

- Claude 补规范测试（mock provider，不碰真实 key / 真实 config）
- WorkBuddy 复验（读代码 + 看报告）；真机搜索流程（首次搜索 / 来源标注 / 降级）需老大 GUI 环境收尾

---

## 归档系统派发规格（2026-08-27，WB 设计定案 · 已闭环）

### 设计意图
把"会话软隐藏（`is_archived`）"与"记忆提取入库"合成一个「归档」动作，落地 LarryAgent "越来越懂你"主线：用户**显式归档时逐条把关**记忆值不值得存。原 P4 定案"归档入口不做"，本次补齐。已存在可复用底座：`api/memory.py` 的 `/archive`+`/archive/confirm`、`archiver.generate_summary`/`confirm_and_store`、`db/conversations.mark_archived`、`is_archived` 列。

### 用户交互流（前端，本期建）
1. 会话 `⋮` 菜单（AppLayout.vue:135 区域）新增「归档」，与「重命名」并列
2. 点「归档」→ 确认弹窗，三选项：
   - **取消** → 无事发生
   - **删除** → 软删除进回收站（见后端 DELETE 语义变更）
   - **归档** → 调 `POST /api/memory/archive` 提摘要 → 弹出**可编辑摘要面板**：
     - **确认存入** → `POST /api/memory/archive/confirm`（写 SQLite+ChromaDB+`mark_archived=1`）
     - **仅归档** → `POST /api/conversations/{id}/archive`（只 `mark_archived=1`，不写记忆）
     - **取消** → 关闭
3. 归档/删除后重新拉活跃列表（过滤 `is_archived=0` 且 `deleted_at IS NULL`）→ 会话从活跃列表消失
4. **已归档视图 / 回收站视图：本期不建页面**（UI 高度复用，与已归档列表一并做），但后端功能代码全实现、api.ts 客户端函数全加

### 后端改动

**`db/schema.py`**（`CREATE_CONVERSATIONS`，:13-21）：加 `deleted_at TEXT`（默认 NULL）。旧库迁移：`database.py` 启动期 `PRAGMA table_info(conversations)` 检测缺列则 `ALTER TABLE conversations ADD COLUMN deleted_at TEXT`。

**`db/conversations.py`**：
- `list_conversations`：加 `archived: bool|None=None` 与 `include_trash: bool=False`；archived 过滤 `is_archived`；默认排除 `deleted_at IS NOT NULL`（活跃列表不含回收站）；`include_trash=True` 仅列回收站
- 新增 `unarchive_conversation(id)`：`SET is_archived=0`
- `delete_conversation` 改语义为**软删除**：`SET deleted_at=datetime('now')`（不再硬 DELETE；消息级联保留，恢复可见；记忆 `ON DELETE SET NULL` 逻辑暂不适用——软删不触发外键）
- 新增 `list_trash()`：`WHERE deleted_at IS NOT NULL`
- 新增 `restore_conversation(id)`：`SET deleted_at=NULL`
- 新增 `purge_conversation(id)`：硬 DELETE（级联 messages；记忆 `ON DELETE SET NULL`）
- `mark_archived` 保留

**`api/conversations.py`**：
- `GET /conversations`：加 `?archived=` `?trash=` 查询参数透传 `list_conversations`
- `POST /conversations/{id}/archive`：`mark_archived=1`（仅归档）
- `POST /conversations/{id}/unarchive`：unarchive
- `DELETE /conversations/{id}`：改为软删除（调 `delete_conversation` 新语义）
- `GET /conversations/trash`：`list_trash`
- `POST /conversations/{id}/restore`：restore
- `POST /conversations/{id}/purge`（或 `DELETE /conversations/{id}/purge`）：purge 硬删
- 现有 `PATCH /conversations/{id}`（rename）、`GET /conversations/{id}/messages` 不变

**`memory/archiver.py`**：
- `generate_summary`（:76-77）：放宽 `if conv["is_archived"]` 硬卡——改为**允许已归档会话重提取**（支持"仅归档后再提取"）；但 `deleted_at` 非空仍 `raise`（回收站会话不可提取）。`get_conversation` 需一并返回 `deleted_at`
- `confirm_and_store`（:118 起）：加**按会话查重幂等**——confirm 前 `get_active_memory_by_conversation_id(conv_id)` 查活跃记忆；命中则 `update_memory` 覆盖内容（复用 `:93`）+ 删旧 ChromaDB 点（按 `memory_id`）后重写向量；未命中走原 `create_memory` 新建。语义：同会话只留一条"最新生效"记忆，避免 unarchive→再归档→再确认复制重复（Marvis 评审 2026-08-27，记忆库首发前定死；成本几行）

**`db/memories.py`**：
- 新增 `get_active_memory_by_conversation_id(conv_id)`：`SELECT id, content, source_conversation_id, created_at, updated_at, is_active FROM memories WHERE source_conversation_id=? AND is_active=1`，返回单条或 None（复用 `list_memories` 同款列）

**`api/memory.py`**：不变（`/archive`+`/archive/confirm` 已通；confirm 内 `mark_archived` 对仅归档幂等）

### 前端改动（api.ts 全加客户端函数，即使页面延后）
- `archiveConversationExtract(id)` → POST /memory/archive
- `confirmArchive(req)` → POST /memory/archive/confirm
- `archiveSessionOnly(id)` → POST /conversations/{id}/archive
- `unarchiveConversation(id)` → POST /conversations/{id}/unarchive
- `deleteConversation(id)` → 现 DELETE（软删）
- `listTrash()` / `restoreConversation(id)` / `purgeConversation(id)` → 备用（页面延后）
- `AppLayout.vue`：菜单加「归档」+ 确认弹窗 + 摘要编辑面板（本期建）；活跃列表过滤 `is_archived=0`（store 侧或拉取侧）
- 已归档视图 / 回收站视图 Vue 页面：**延后**

### 范围边界（Marvis 产品评审 2026-08-27，老大拍板不纳入）
- 删除/归档的"用户不可逆感"防护、purge 二次确认：页面延后且数据未真删，单人自用可兜底，不做。
- FastAPI 布尔参数 `"false"→True` 坑：本期页面延后、活跃列表默认过滤用不到，下期已归档视图注意，不预埋。
- 测试断言语义：软删必然测 `deleted_at`，实现时自然覆盖，不单列。
- 远期轻提：会话量上来后归档/删除应支持批量；本期单会话起步合理，不入本期。

### 约束
- 不破坏现有重命名/删除逻辑；删除改软删后，原硬删路径只剩 purge（页面延后）
- 记忆提取用 `deepseek-chat` 文本模型（项目 `config.yaml` key 够用，**不依赖外部 Key**）
- Tier0：key 不落日志；测试用 mock，不碰真实 key/config
- 测试：复用 conftest 隔离；新增 archive 双路径 / unarchive / trash 软删+恢复+purge / `generate_summary` 已归档可重提+回收站拒提 单测（Claude 补）

### 验收（已闭环）
- Trae 实现（`43213e3`）→ Claude 补测试（`2db9130`，**测试派发见 `exchange/log-claude.md`**）→ WB 复验（`ffa3683` 读代码 + 跑测试绿）+ P3.5 语义修复（`50ed895`）

### Trae 实现记录（2026-08-27，已提交）
- **db/schema.py**：`CREATE_CONVERSATIONS` 加 `deleted_at TEXT DEFAULT NULL`；**db/migrations.py** 增量迁移列表加对应列（老库启动自动 ALTER，非破坏性）
- **db/conversations.py**：`get_conversation` 返回 `deleted_at`；`list_conversations` 加 `archived`/`include_trash` 过滤（默认排除回收站）；`delete_conversation` 改**软删**（置 deleted_at）；新增 `unarchive_conversation` / `list_trash` / `restore_conversation` / `purge_conversation`
- **db/memories.py**：新增 `get_active_memory_by_conversation_id`（幂等查重用）
- **memory/archiver.py**：`generate_summary` 放宽 `is_archived` 硬卡（改为 `deleted_at` 非空才 raise）；`confirm_and_store` 加**按会话查重幂等**（同会话已有活跃记忆 → update_memory + 删旧 ChromaDB 向量后重写）
- **api/conversations.py**：`GET /conversations` 加 `?archived=`/`?trash=`；新增 `GET /trash`、`POST /{id}/archive|unarchive|restore|purge`；`DELETE /{id}` 改软删
- **client/src/api.ts**：`listConversations` 支持 opts；新增 `archiveConversationExtract` / `confirmArchive` / `archiveSessionOnly` / `unarchiveConversation` / `listTrash` / `restoreConversation` / `purgeConversation`
- **client/src/components/AppLayout.vue**：三点菜单加「归档」；确认弹窗（取消/删除/归档）+ 摘要编辑面板（确认存入/仅归档/取消）；归档/删除后若为当前会话则回欢迎页并刷新活跃列表（`archived:false`）
- **client/src/views/ChatView.vue**：活跃列表拉取改 `listConversations({ archived: false })`
- **验证**：前端单测 45/45 绿；后端 core 34 通过 + conversations 16/17（1 失败 = `test_cascade_delete_messages` 断言**旧硬删语义**，软删变更后预期需 Claude 改写，log 确认软删路径执行正确）；后端 import 检查通过
- **注意**：`deleted_at` 迁移在下一次后端启动时自动执行（ADD COLUMN，非破坏性）；已归档/回收站 Vue 页面按规格延后，api.ts 函数已备

