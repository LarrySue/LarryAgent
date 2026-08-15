# Claude 协作区

## 当前任务（2026-08-15 晚 WorkBuddy 派发：P4 第二波）

### ⚠️ 冲突暴露：P4.3 测试职责重叠（@WorkBuddy @Trae，待裁定）

派发规格给我的任务是"新建 `tests/test_conversations.py`"。但工作区中 Trae 已创建 `backend/tests/test_conversations_api.py`（364 行，未提交），覆盖内容与我的派发任务高度重叠：conversations CRUD / 级联删除 / chat 404 / /api/models / 新异常子类。

按"谁创建谁维护"规则和职责分工（Trae 实现 / Claude 测试），这个测试文件应归我编写维护。**Trae 写测试文件是越界还是自测脚本待交付说明澄清**——未收到交付说明前我停手 P4.3 测试部分，等裁定。

两个可选方向（倾向 A）：
- **A**：Trae 提交时把 `test_conversations_api.py` 移出（或明确移交给我改名 `test_conversations.py`），我接手后修复下述问题再作为 P4.3 测试交付
- **B**：Trae 的文件作为自测保留，我按原派发另写 `test_conversations.py`（重复覆盖，不推荐）

### ⚠️ 数据安全风险：Trae 的测试文件会删除真实数据（必须修）

`test_conversations_api.py::clean_conv_db` fixture 直接对**真实 `data/larry.db`**（无 mock、无临时库）执行"删除全部会话"的前后清理。全套测试跑一次，用户真实聊天历史全没。项目原则"安全边界明确"要求此问题必须处理：测试必须使用临时 DB（如 `LARRY_CONFIG` 指向 temp yaml + 临时 db path）或 mock 数据层，禁止对真实库做 DELETE 清理。

### Trae 实现评审（P4.3 + P4.6，未提交状态，结论先行）

**实现本体质量好，未发现规格违背：**
- `PRAGMA foreign_keys=ON` 连接级挂载 + WHY 注释正确
- `api/chat.py` 在返回 StreamingResponse **之前**预校验会话存在性（避免"response already started"吞 404）——关键坑，处理正确
- 标题生成（首条消息 20 字符）、404 走 LarryException 体系、`/api/models` 均符合规格
- 我的基线 25/25 全绿（16 chat_service + 9 exceptions），**无需修改 test_chat_service.py 的 mock**（ChatRequest 的 conversation_id 字段 P0 就存在，派发里"需要补参数"的前提不成立）

**Trae 测试文件中的质量问题（若方案 A 由我接手，我修）：**
1. `TestChatConversationNotFound` 断言过弱：404 是确定性的（预校验在任何 LLM 调用之前），但测试写成"404 则断言，否则 401/500/502 也算过"——实现坏了也全绿
2. `test_cascade_delete_messages` 结尾 `asyncio.run(close_db())` 在测试进程关闭全局 DB 单例，跨事件循环关闭 aiosqlite 连接有风险，且影响后续用例
3. 该用例用裸 SQL 插入的测试会话，断言失败时无清理
4. `test_list_order_updated_desc` 用 `time.sleep(1.1)` 两次，测试慢（次要）

### 我的待办（等 Trae 提交后执行）

- P4.6 更新 `test_exceptions.py::TestUnexpectedException`：body 从纯文本改为断言 `{"error": "INTERNAL_ERROR", "detail": "Internal server error"}` + detail 不含 traceback 内容（旧断言碰巧兼容新行为，但需显式化）——我的文件，无冲突，可先行
- P4.3 测试：按上述裁定结果执行
