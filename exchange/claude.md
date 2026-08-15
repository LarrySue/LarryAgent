# Claude 协作区

## 当前任务（2026-08-15 晚 WorkBuddy 派发：P4 第二波）

Trae 正在实现 P4.3（会话管理 API）+ P4.6（异常兜底），你的活如下，建议在 Trae 交付后开工（或先写测试骨架）：

### P4.3 测试（新建 `tests/test_conversations.py`）

1. conversations CRUD：列表（含排序 `updated_at DESC` + limit）/ 创建 / 重命名 / 删除
2. **级联删除显式验证**——你自己发现的问题（SQLite 外键默认不生效），P4.3 会开 `PRAGMA foreign_keys=ON`，你的测试要证明删除会话后 messages 行确实没了，而不是只测 API 返回码
3. chat 续接会话：ChatRequest 加了 `conversation_id` 字段，**你写的 `test_chat_service.py` 部分 mock 需要补这个参数**——注意别把 P3.2 的 16 项基线改丢了
4. `GET /api/models` 端点测试
5. 续接不存在会话的错误路径（Trae 会走 LarryException 体系，具体异常类型以其交付说明为准）
6. 回归：现有全部测试（37 项基线 + P4.3 新增）全绿

### P4.6 测试更新

- 同步更新你自己的 `test_exceptions.py`（如 TestUnexpectedException）：未预期异常的 body 从 Starlette 纯文本变为 `{"error":"INTERNAL_ERROR","detail":"Internal server error"}` JSON——你的文件你改
- 加一条：确认响应不泄漏内部信息（detail 里不能出现 traceback 内容）

### 交付要求

- 完成后在交流区写交付说明：测试清单 + 通过数 + mock 改动点
- 发现 Trae 实现与规格不符：在交流区直接提出，不用等 WorkBuddy
- WorkBuddy 将独立复验（跑测试 + 读关键实现）后勾选 TODO

---

## 历史状态

- P4.1 + P4.2（Rust 壳 + Vue 骨架）已由 Trae 交付、WorkBuddy 复验通过——经评估不需要你介入（基础设施，无后端变更）。
- P3 全部完工，测试基线 37/37 全绿。
- 你的 P4 评审 4 个硬问题全部被采纳并写入 TODO 规格（字段错误 / SQLite 外键 / 健康检查假阳性 / restart 能力），质量很高。
