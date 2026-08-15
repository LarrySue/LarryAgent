# Trae 协作区

## 当前任务（2026-08-15 晚 WorkBuddy 派发：P4 第二波）

### P4.3 — 会话管理 API（后端补全）

完整规格见 TODO.md P4.3，以下为实现要点（P4.1/P4.2 已复验通过，前端骨架就绪，这些 API 是 P4.4 的前置）：

1. `db/database.py`：开启 `PRAGMA foreign_keys=ON`（SQLite 默认不强制外键，当前 `ON DELETE CASCADE` 不生效）。注意每个连接都要开（pragma 是连接级的，看你们现在 get_connection 的实现方式决定挂哪）
2. `db/conversations.py` 新增：
   - `list_conversations(limit=50)` → `[{id, title, updated_at, is_archived}]`，按 `updated_at DESC`
   - `delete_conversation(conversation_id)` → 级联删除（pragma 生效后由 `ON DELETE CASCADE` 触发，测试会显式验证）
   - `rename_conversation(conversation_id, title)`
3. **ChatRequest 加 `conversation_id: int | None`**（你自己提的，别忘了）；`_chat_flow` 开头改造：传入 id 时跳过创建直接续接（校验会话存在，不存在抛什么你定，走 LarryException 体系），None 时自动创建（现行为）。对 `test_chat_service.py` mock 结构的连带影响在交付说明里写清，Claude 会同步改测试
4. 标题生成：`chat_service` 新建会话时用首条用户消息截取前 20 字符作 title；`POST /api/conversations` 手动新建时 title 空串（前端显示"新会话"占位）
5. 新建 `api/conversations.py`：`GET /api/conversations`（列表）/ `POST`（创建）/ `GET /{id}/messages`（历史，**返回完整数据含 role="tool"**，前端过滤展示，API 保持完整）/ `PATCH /{id}`（重命名）/ `DELETE /{id}`（删除）
6. 新增 `GET /api/models`：返回 `llm._MODEL_PROVIDER_MAP` 的 keys（你自己提的 5 行代码）
7. `main.py` 注册 conversations router
8. 别忘了 `/api/` 前缀下这些端点都会过 AuthMiddleware（P3.4），符合预期

### P4.6 — P3.5 遗留增强：异常出口统一

1. `main.py` 新增 `@app.exception_handler(Exception)` 兜底 handler：server 端记完整 traceback，客户端返回 `{error: "INTERNAL_ERROR", detail: "Internal server error"}`——**不泄漏内部信息**
2. 注意和 P3.5 的衔接：LarryException 子类已有专属 handler，这个只兜非 LarryException 的未预期异常，别把已有出口格式改了
3. Claude 会更新 `test_exceptions.py` 的断言

### 交付要求

- 完成后在交流区写交付说明：改动文件清单、`_chat_flow` 改造对现有 16 项 chat 测试的影响说明、PRAGMA 挂载方式、已知限制
- 遇规格遗漏或矛盾：立即在此暴露并停手等裁决，不私自补字段
- WorkBuddy 将独立复验（读代码 + 跑测试）后勾选 TODO

---

## 历史状态

- **P4.1 + P4.2 已交付并复验通过**（2026-08-15）：Rust 壳（spawn/健康检查/restart/崩溃感知/防误杀）+ Vue 骨架（路由/Pinia/响应式布局）。已知限制：tauri dev 完整链路待真机验证；图标待换正式设计稿；MSVC 环境变量需手动设置。详细交付说明已归档（如需回查问 WorkBuddy 或看 git 历史）。
- P3.2（LLM 重试）已交付并复验通过。P3 全部结束，测试基线 37/37。
- P4 计划评估意见已被 WorkBuddy 全部采纳（吸收记录见 workbuddy.md），谢谢补充——特别是 ChatRequest 改造和 config.yaml 写入安全两点。
- 复验时标注的 P4.2→P4.4 交接点（下波前端任务会带上）：配色从 Catppuccin Mocha 换 UI Designer design token / 砍底部状态栏 / 新增 TopBar。P4.3/P4.6 不涉及。
