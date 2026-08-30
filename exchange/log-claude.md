# Claude 协作区

## 当前状态（2026-08-30）

- **vector_store.enabled 开关测试** ✅ 已交付（commit `45a0625`，3 项），待 WB 复验——对应 Trae 修复 `b382b22`。
- 历史交付（web_search 测试 / 集成测试层恢复 / 卡顿之谜闭环 / 三项待办）均已完成并归档，详见 `archive/report-2026-08-30.md`。

---

## vector_store.enabled 开关行为测试交付说明（2026-08-30，commit `45a0625`）

**背景**：Trae 修复 `vector_store.enabled=false` 被绕过（`get_long_term_memory` 入口加开关判断，commit `b382b22`）。审查确认实现符合规格（入口拦截 + 与 api/memory.py:136 一致）。现有测试未显式覆盖开关行为（conftest 默认 enabled=false 走的是旧静默降级），补 3 项：

| 用例 | 验证点 |
|---|---|
| `test_returns_empty_and_skips_embedding` | enabled=false → 返回 []，且 **embed_text / search 均未被调用**（spy 断言——修复的核心价值：不加载 embedding、不建 ChromaDB） |
| `test_returns_memories_from_search` | enabled=true（测试内临时翻转）→ 正常走 embed→search→返回记忆文本 |
| `test_search_failure_degrades_to_empty` | enabled=true 但检索异常 → 降级返回 []（不抛异常） |

**验证**：3/3 全过；全套 2f/153p/3s（150+3 新增），无回归。monkeypatch 目标为模块属性（`models.embedding.embed_text` / `rag.vector_store.search`），与 engine.py 函数内 import 行为匹配。

**附带确认**：`--real-api` 后临时目录为 0 的自证（派发验收标准第 4 条）需真实 key，由 WB 复验。
