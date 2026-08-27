# WorkBuddy 协作区

---


## 硬性原则（跨阶段有效，不随具体阶段过期）

- **数据安全底线**：任何会话/数据相关测试**必须**用临时 DB（`LARRY_CONFIG` 指向临时 yaml + 独立 db path）或 mock 数据层，**禁止对真实 `larry.db` 做 DELETE 清理**。前车之鉴：Trae 的自测文件 `test_conversations_api.py` 通过真实 API 端点清真实库，已被删除。
- **职责划分**：Trae = 实现，Claude = 测试，两者不重叠写测试文件。出现重叠时 Claude 接手重写规范版（沿用好的覆盖点，修质量问题）。

---

## UI Designer 待办（Logo 资产，待用户处理）

- 导出 .ico 格式（Tauri 窗口图标需要）
- 导出多尺寸 PNG（16/32/48/64/128/256）
- AI 生成水印需去除后才能作为正式资产

---

## 归档系统 WB 复验结论（2026-08-27）

- **复验方式**：读码（后端 schema/migrations/conversations/memories/archiver + api/conversations + api/memory + 前端 api.ts/AppLayout.vue/ChatView.vue）+ 跑测试（后端 29 项全绿：`test_archive.py` 11 + `test_conversations.py` 18）
- **实现对照派发稿（`exchange/log-trae.md`）**：全部命中
  - schema `deleted_at` 列 + 启动 ALTER 迁移 ✅
  - `db/conversations.py`：`get_conversation` 返 `deleted_at`、`list_conversations` 过滤 archived/trash、软删/恢复/purge 级联 ✅
  - `api/conversations.py`：archive/unarchive/trash/restore/purge + `DELETE` 软删 全端点 ✅
  - `db/memories.py`：`get_active_memory_by_conversation_id` 查重函数 ✅
  - `archiver.py`：`generate_summary` 硬卡已放宽（仅 `deleted_at` 卡）、`confirm_and_store` 幂等查重（命中覆盖+删旧向量重写，未命中新建）✅ —— Marvis 评审的重复提取隐患已闭环
  - 前端：`api.ts` 全套客户端函数；`AppLayout.vue` 菜单「归档」→确认弹窗(取消/删除/归档)→摘要编辑面板(取消/仅归档/确认存入)；`ChatView.vue` 列表过滤 `is_archived=0` 一致 ✅；已归档/回收站 Vue 页面按约延后（函数标"页面延后"）
- **测试对照派发稿（`exchange/log-claude.md`）**：双路径/取消归档/回收站/列表过滤/`generate_summary` 放宽/幂等 全覆盖；隔离正确（conftest 临时库 + monkeypatch LLM/ChromaDB，零真实 key）
- **P3.5 语义已修复**（2026-08-27 用户拍板"直接改"）：回收站/无消息/不存在会话拒绝提取改透传 4xx（`ValidationError(400)`/`ResourceNotFoundError(404)`），不再归 `LLMError→502`；测试断言收紧至 `==400`。commit `50ed895`
- **结论**：归档系统实现与派发规格一致，测试绿，闭环。P3.5 语义细化已落实，无遗留。

---

## P3.5 语义修复落实（2026-08-27 用户拍板"直接改"）

- `archiver.generate_summary`：三处校验由 `ValueError` 改为具体异常——`conv is None` → `ResourceNotFoundError(404)`；`deleted_at` 非空 / 无消息 → `ValidationError(400)`（import `exceptions.ResourceNotFoundError, ValidationError`）
- `api/memory.py trigger_archive`：`except (ValidationError, ResourceNotFoundError): raise` 透传 4xx；仅真实 LLM 失败走 `except Exception` → `LLMError(502)`
- 测试 `test_trash_conversation_rejected`：断言由 `>=400` 收紧为 `==400`
- 复跑后端 29 项全绿（`test_archive.py` 11 + `test_conversations.py` 18）。本地提交。


