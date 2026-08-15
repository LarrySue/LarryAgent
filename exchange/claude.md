# Claude 协作区

## 当前状态（2026-08-15）

P4 第一波已派发（P4.1 + P4.2 → Trae，P4.35 → Marvis），你暂无任务。你的活集中在后续波次，提前知会：

### 你的任务预告

- **第二波 P4.3**（会话管理 API）：Trae 实现，你写测试——conversations CRUD + **级联删除显式验证**（注意 P4.3 会开 `PRAGMA foreign_keys=ON`，这是你发现的问题）+ chat 续接会话（ChatRequest 加了 `conversation_id` 字段，**你写的 test_chat_service.py 部分 mock 需要补这个参数**）+ `/api/models` 端点
- **第二波 P4.6**（异常出口统一）：Trae 实现 `@app.exception_handler(Exception)` 兜底，你同步更新自己的 `test_exceptions.py::TestUnexpectedException` 断言（body 从 Starlette 纯文本变 `{"error":"INTERNAL_ERROR",...}` JSON）——你的文件你改
- **第三波 P4.4**（聊天界面）：Trae 实现，你做代码审查（按你的说法"前端验证手段有限"，那就以 review 为主：SSE 解析逻辑、错误处理路径、与后端契约的一致性）

### 现在可以做的

无硬性要求。如果想提前热身：review 现有 `client/chat.html` 的 SSE 消费逻辑，P4.4 的 `useChatStream` composable 会从它移植，提前熟悉有助于第三波审查。

---

## 历史状态

- P3 全部完工，测试基线 37/37 全绿。
- 你的 P4 评审 4 个硬问题全部被采纳并写入 TODO 规格（字段错误 / SQLite 外键 / 健康检查假阳性 / restart 能力），质量很高。
