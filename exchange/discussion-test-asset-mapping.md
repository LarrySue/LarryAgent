# 测试资产 ↔ 31 子项映射底账

> 状态：**讨论稿 · 只做账面，⛔ 不裁处置**。
> 派发：WB 2026-11-03 21:32（M-1～M-6）｜执行：顾衡（Claude）｜本轮只读盘点，未跑 `pytest`／`vitest`。
> 正本：`docs/product-positioning.md` §2（31 子项编号）｜`docs/dsh/dsh-migration.md` §3.6 DSH-6 段（四层口径）｜`TODO.md` DSH-6 段（重建口径）。

## 0 复算与口径

### 0.1 底数复算

| 项 | 派发数 | 我的复算 | 差 | 说明 |
|---|---:|---:|---:|---|
| `backend/tests/*.py` 文件 | 21 | **21** | 0 | — |
| backend 测试函数 | 165 | **165** | 0 | `grep "def test_"` 不锚行首；已逐文件枚举 |
| `harness/tests/*` 文件（递归） | 14 | **14** | 0 | 含 helper；其中 5 个文件 0 用例 |
| harness 用例 | 23 | **24** | **+1** | 23 条 `it(` ＋ 1 条 `it.runIf(`（见 0.2） |
| 插件侧 smoke | 2 | **2** | 0 | 每文件 1 条 |
| **主表行数** | **≥190** | **191** | **+1** | 165＋24＋2 |

两个 `test_embedding*.py` 是**手动脚本**（文件头自述「非 pytest 用例」），0 条用例 ⇒ 不进主表；它们是阈值标定器材，⛔ 不是废脚本。

### 0.2 底数差 1：`it.runIf` 检索式漏计

`harness/tests/real-api.test.ts:186` 的用例注册形式是 `it.runIf(!ENABLED)(...)`，字符串里没有 `it(` 子串 ⇒ 按派发给的 `it(` 检索式不命中。

- 按 `it(` 口径：165＋23＋2 ＝ **190** 行（派发底数）。
- 全量注册用例口径：165＋24＋2 ＝ **191** 行（本表取这个）。
- 两条口径都满足 M-1 的「≥190」；本表多出的 1 行是为了**不漏记一条已注册用例**，不是重复计数。

### 0.3 31 子项编号（正本 `product-positioning.md` §2）

| 编号 | 名称 | 主表行数 |
|---|---|---:|
| 2.3.1 | 会话生命周期管理 | 24 |
| 2.3.2 | 对话体验 | 2 |
| 2.3.3 | 会话级作用域（沙盒） | 0 |
| 2.3.4 | 多模态输入 | 0 |
| 2.3.5 | 主动触达 | 0 |
| 2.4.1 | 短期记忆 | 1 |
| 2.4.2 | 长期记忆闭环 | 11 |
| 2.4.3 | 记忆可管理 | 0 |
| 2.4.4 | 记忆保鲜与代谢 | 0 |
| 2.4.5 | 用户画像 | 0 |
| 2.4.6 | 知识库 | 0 |
| 2.5.1 | 多模型按需切换 | 2 |
| 2.5.2 | 工具挂载 | 57 |
| 2.5.3 | 扩展性与零代码接入 | 0 |
| 2.6.1 | 角色切换 | 8 |
| 2.6.2 | 自动路由（意图识别） | 0 |
| 2.7.1 | 行为安全硬护栏 | 19 |
| 2.7.2 | 边界透明与用户决策权 | 1 |
| 2.7.3 | 凭据与密钥边界 | 17 |
| 2.7.4 | 成本约束 | 1 |
| 2.7.5 | 数据主权与出境边界 | 0 |
| 2.7.6 | 数据可恢复与可迁移 | 0 |
| 2.8.1 | 沉淀信息可见与可管理 | 0 |
| 2.8.2 | AI 行为可见 | 6 |
| 2.8.3 | 资源消耗（成本）可见 | 0 |
| 2.9.1 | 时间感知 | 0 |
| 2.9.2 | 超长会话一致性 | 0 |
| 2.9.3 | 降级与韧性 | 22 |
| 2.10.1 | 云端部署、多端使用 | 0 |
| 2.10.2 | 端侧能力保留 | 0 |
| 2.10.3 | 单人单实例 | 0 |

### 0.4 列定义

- **子项归属**：每条只给一个 `2.x.x` **或**「无对应（纯实现细节）」，二选一；不写「可能／疑似」。交叉用例取**主导产品语义**，争议处见 §4 自曝。
- **覆盖类型**（四选一）：
  - **逻辑**：本进程内跑被测代码，外部依赖 mock／临时库；验证业务逻辑与错误分支。
  - **契约**：用固定样例锁接口／数据形态（OpenAI function schema、provider 响应解析、工具 schema），不判业务语义。
  - **隔离**：验证测试场地隔离与 fail-fast（临时 DSH_HOME／临时 DB／key 残留扫描／存档路径不落真实目录）。
  - **冒烟**：真起外部进程或真实 API，只验「接得上、跑得通」的最小链路。
- **迁移处置**：全表统一「**待裁（方向已定：按 DSH 四层重建）**」，⛔ 无逐条建议。

> ⚠️ **口径差异（M-5 前置）**：派发写「定义见 `dsh-migration.md` §3.6 四层对照表」；实核该节 DSH-6 段只有 5 行〈我们的测试层 → 迁移方向〉表（mock LLM 单测／`--real-api` 集成冒烟／降级异常护栏单测／conftest 隔离／前端 Vitest），**没有「逻辑／契约／隔离／冒烟」四类的逐条定义**。上列四类是我按该表语义落的；若口径有出入，请 WB／老大裁，⛔ 不要拿本表的分类当正本。

## 1 主表（191 行）

| # | 文件:行 | 用例 | 子项 | 覆盖类型 | 迁移处置 | 备注 |
|---:|---|---|---|---|---|---|
| 1 | `backend/tests/test_archive.py:84` | `test_archive_extract_and_confirm` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 2 | `backend/tests/test_archive.py:112` | `test_archive_session_only_no_memory` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 3 | `backend/tests/test_archive.py:131` | `test_unarchive` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 4 | `backend/tests/test_archive.py:150` | `test_soft_delete_restore` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 5 | `backend/tests/test_archive.py:172` | `test_purge_removes_completely` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 6 | `backend/tests/test_archive.py:189` | `test_default_excludes_trash` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 7 | `backend/tests/test_archive.py:195` | `test_archived_filter` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 8 | `backend/tests/test_archive.py:208` | `test_trash_query_param` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 9 | `backend/tests/test_archive.py:221` | `test_archived_conversation_can_regenerate` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 10 | `backend/tests/test_archive.py:232` | `test_trash_conversation_rejected` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 跨 2.3.1（回收站状态）×2.4.2（归档入口） |
| 11 | `backend/tests/test_archive.py:252` | `test_rearchive_overwrites_not_duplicates` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 12 | `backend/tests/test_archiver_switch.py:55` | `test_archive_skips_vector_store` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 13 | `backend/tests/test_archiver_switch.py:79` | `test_archive_writes_vectors_when_enabled` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 14 | `backend/tests/test_auth_middleware.py:59` | `test_chat_endpoint_passthrough` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 15 | `backend/tests/test_auth_middleware.py:68` | `test_non_api_path_not_touched` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 16 | `backend/tests/test_auth_middleware.py:81` | `test_no_auth_header` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 17 | `backend/tests/test_auth_middleware.py:86` | `test_non_api_path_not_affected` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 18 | `backend/tests/test_auth_middleware.py:99` | `test_correct_bearer` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 19 | `backend/tests/test_auth_middleware.py:118` | `test_wrong_bearer` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 20 | `backend/tests/test_auth_middleware.py:126` | `test_malformed_auth_header` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 21 | `backend/tests/test_chat_service.py:80` | `test_no_tool_calls` | 2.3.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | SSE 流式主路径；未覆盖停止生成 |
| 22 | `backend/tests/test_chat_service.py:104` | `test_single_tool_call` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 23 | `backend/tests/test_chat_service.py:162` | `test_multiple_tool_calls` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 24 | `backend/tests/test_chat_service.py:208` | `test_max_rounds` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 25 | `backend/tests/test_chat_service.py:251` | `test_tool_not_found` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 26 | `backend/tests/test_chat_service.py:284` | `test_message_persistence` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 27 | `backend/tests/test_chat_service.py:346` | `test_no_role_config_returns_all` | 2.6.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 28 | `backend/tests/test_chat_service.py:354` | `test_role_with_tools` | 2.6.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 29 | `backend/tests/test_chat_service.py:385` | `test_role_filter_excludes_shell` | 2.6.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 30 | `backend/tests/test_chat_service.py:432` | `test_tool_error_flows_back` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 31 | `backend/tests/test_chat_service.py:503` | `test_caller_ip_passed_to_shell` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 32 | `backend/tests/test_chat_service.py:563` | `test_estimate_tokens_messages_basic` | 2.7.4 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 仅断言 n>0，覆盖弱 |
| 33 | `backend/tests/test_chat_service.py:572` | `test_truncate_messages_keeps_system` | 2.4.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 2.9.2 现行截断机制同源 |
| 34 | `backend/tests/test_chat_service.py:595` | `test_single_tool_arguments_split_into_multi_chunks` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 35 | `backend/tests/test_chat_service.py:628` | `test_multiple_tools_parallel` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 36 | `backend/tests/test_chat_service.py:654` | `test_fields_scattered_across_chunks` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 37 | `backend/tests/test_chromadb_degradation.py:39` | `test_long_term_memory_chromadb_failure` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 38 | `backend/tests/test_chromadb_degradation.py:62` | `test_long_term_memory_embedding_failure` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 39 | `backend/tests/test_chromadb_degradation.py:79` | `test_confirm_and_store_chromadb_failure` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 40 | `backend/tests/test_chromadb_degradation.py:133` | `test_build_memory_context_no_long_term` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 41 | `backend/tests/test_chromadb_degradation.py:152` | `test_vector_store_client_creation_failure` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 断言收 success/error 两分支，恒真不判别 |
| 42 | `backend/tests/test_chromadb_degradation.py:179` | `test_delete_by_memory_id_chromadb_failure` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 直接调 mock、未走 API；断言恒真 |
| 43 | `backend/tests/test_chromadb_degradation.py:206` | `test_search_empty_collection` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 44 | `backend/tests/test_conversations.py:105` | `test_create_empty_title` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 45 | `backend/tests/test_conversations.py:113` | `test_create_with_title` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 46 | `backend/tests/test_conversations.py:122` | `test_list_order_updated_desc` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 47 | `backend/tests/test_conversations.py:140` | `test_list_limit` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 48 | `backend/tests/test_conversations.py:156` | `test_patch_rename` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 49 | `backend/tests/test_conversations.py:165` | `test_patch_empty_title` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 50 | `backend/tests/test_conversations.py:172` | `test_patch_not_found_404` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 51 | `backend/tests/test_conversations.py:179` | `test_delete_ok` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 52 | `backend/tests/test_conversations.py:187` | `test_delete_not_found_404` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 53 | `backend/tests/test_conversations.py:228` | `test_messages_not_found_404` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 54 | `backend/tests/test_conversations.py:233` | `test_messages_empty_new_conv` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 55 | `backend/tests/test_conversations.py:266` | `test_soft_delete_keeps_messages` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 56 | `backend/tests/test_conversations.py:301` | `test_purge_cascades_messages` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 57 | `backend/tests/test_conversations.py:327` | `test_nonexistent_conv_non_stream_404` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 58 | `backend/tests/test_conversations.py:333` | `test_nonexistent_conv_stream_404` | 2.3.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 流式路径 404（JSON 而非空 200） |
| 59 | `backend/tests/test_conversations.py:346` | `test_continuation_keeps_conversation` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 60 | `backend/tests/test_conversations.py:373` | `test_new_conversation_title_from_first_message` | 2.3.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 61 | `backend/tests/test_conversations.py:392` | `test_models_returns_list` | 2.5.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | GET /api/models |
| 62 | `backend/tests/test_cot_archive.py:217` | `test_stream_entry_archives_every_chunk_verbatim` | 2.8.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 63 | `backend/tests/test_cot_archive.py:265` | `test_non_stream_entry_archives_response` | 2.8.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 64 | `backend/tests/test_cot_archive.py:283` | `test_unknown_provider_key_survives` | 2.8.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 65 | `backend/tests/test_cot_archive.py:299` | `test_three_state_arms` | 2.8.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 66 | `backend/tests/test_cot_archive.py:356` | `test_archive_root_can_be_switched` | 无对应（纯实现细节） | 隔离 | 待裁（方向已定：按 DSH 四层重建） | Tier 0 存档路径隔离 |
| 67 | `backend/tests/test_cot_archive.py:373` | `test_config_resolves_absolute_paths` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 68 | `backend/tests/test_cot_archive.py:401` | `test_archive_path_is_not_real` | 无对应（纯实现细节） | 隔离 | 待裁（方向已定：按 DSH 四层重建） | Tier 0 存档路径隔离 |
| 69 | `backend/tests/test_cot_archive.py:415` | `test_archive_disabled_writes_nothing` | 2.8.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 70 | `backend/tests/test_cot_archive.py:429` | `test_write_failure_does_not_block_llm` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 71 | `backend/tests/test_exceptions.py:81` | `test_config_error_500` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 72 | `backend/tests/test_exceptions.py:86` | `test_llm_error_502` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 73 | `backend/tests/test_exceptions.py:91` | `test_tool_error_500` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 74 | `backend/tests/test_exceptions.py:96` | `test_auth_error_401` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 75 | `backend/tests/test_exceptions.py:113` | `test_middleware_raise_no_header` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 76 | `backend/tests/test_exceptions.py:122` | `test_middleware_raise_wrong_key` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 77 | `backend/tests/test_exceptions.py:142` | `test_correct_bearer_200` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 78 | `backend/tests/test_exceptions.py:150` | `test_empty_key_passthrough` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 79 | `backend/tests/test_exceptions.py:168` | `test_unexpected_500_json_format` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 80 | `backend/tests/test_exceptions.py:177` | `test_unexpected_no_internal_leak` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 81 | `backend/tests/test_exceptions.py:185` | `test_unexpected_logs_traceback_server_side` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 82 | `backend/tests/test_file_ops_tool.py:58` | `test_read_success` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 83 | `backend/tests/test_file_ops_tool.py:69` | `test_read_not_found` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 84 | `backend/tests/test_file_ops_tool.py:77` | `test_read_directory` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 85 | `backend/tests/test_file_ops_tool.py:88` | `test_read_file_too_large` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 86 | `backend/tests/test_file_ops_tool.py:102` | `test_write_success` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 87 | `backend/tests/test_file_ops_tool.py:110` | `test_write_no_overwrite` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 2.7.1 明列『文件不覆盖』 |
| 88 | `backend/tests/test_file_ops_tool.py:127` | `test_write_multiple_suffix` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 89 | `backend/tests/test_file_ops_tool.py:137` | `test_write_nested_dir` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 90 | `backend/tests/test_file_ops_tool.py:154` | `test_list_success` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 91 | `backend/tests/test_file_ops_tool.py:166` | `test_list_empty_dir` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 92 | `backend/tests/test_file_ops_tool.py:180` | `test_list_not_found` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 93 | `backend/tests/test_file_ops_tool.py:188` | `test_list_file_path` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 94 | `backend/tests/test_file_ops_tool.py:197` | `test_list_truncate` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 95 | `backend/tests/test_file_ops_tool.py:213` | `test_sandbox_dot_dot` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 96 | `backend/tests/test_file_ops_tool.py:221` | `test_sandbox_absolute_path` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 97 | `backend/tests/test_file_ops_tool.py:229` | `test_sandbox_dot_dot_write` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 98 | `backend/tests/test_file_ops_tool.py:241` | `test_sandbox_dot_dot_list` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 99 | `backend/tests/test_file_ops_tool.py:252` | `test_unknown_action` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 100 | `backend/tests/test_file_ops_tool.py:263` | `test_tool_registration` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 101 | `backend/tests/test_file_ops_tool.py:280` | `test_openai_schema` | 2.5.2 | 契约 | 待裁（方向已定：按 DSH 四层重建） | OpenAI function schema 形态 |
| 102 | `backend/tests/test_integration_llm.py:61` | `test_single_tool_call` | 2.5.2 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 真实 API |
| 103 | `backend/tests/test_integration_llm.py:75` | `test_multi_tool_serial` | 2.5.2 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 真实 API |
| 104 | `backend/tests/test_integration_llm.py:96` | `test_api_tools_endpoint` | 2.5.2 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 真实 API 的 /api/tools 端点 |
| 105 | `backend/tests/test_llm_retry.py:152` | `test_retryable_exception_retries` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 106 | `backend/tests/test_llm_retry.py:182` | `test_non_retryable_exception_no_retry` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 107 | `backend/tests/test_llm_retry.py:206` | `test_retry_exhausted_raises_original` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 108 | `backend/tests/test_llm_retry.py:230` | `test_max_retries_zero_no_retry` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 109 | `backend/tests/test_llm_retry.py:254` | `test_stream_create_retry` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 110 | `backend/tests/test_memory_engine.py:25` | `test_returns_empty_and_skips_embedding` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 111 | `backend/tests/test_memory_engine.py:58` | `test_returns_memories_from_search` | 2.4.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 112 | `backend/tests/test_memory_engine.py:84` | `test_search_failure_degrades_to_empty` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 113 | `backend/tests/test_migrations.py:84` | `test_negative_query_only_migration_failure_is_fail_loud` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | schema 迁移基建 |
| 114 | `backend/tests/test_migrations.py:106` | `test_positive_old_shape_migrates_up_all_columns` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | schema 迁移基建 |
| 115 | `backend/tests/test_roles_api.py:46` | `test_full_list_order_and_fields` | 2.6.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 116 | `backend/tests/test_roles_api.py:67` | `test_missing_label_color_fallback` | 2.6.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 117 | `backend/tests/test_roles_api.py:81` | `test_missing_default_key` | 2.6.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 118 | `backend/tests/test_roles_api.py:93` | `test_empty_roles` | 2.6.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 119 | `backend/tests/test_roles_api.py:106` | `test_empty_api_key_passthrough` | 2.6.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 空 api_key 透传（鉴权旁路） |
| 120 | `backend/tests/test_shell_tool.py:42` | `test_ip_whitelist_allowed` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 121 | `backend/tests/test_shell_tool.py:54` | `test_ip_whitelist_blocked` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 122 | `backend/tests/test_shell_tool.py:66` | `test_ip_whitelist_missing` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 123 | `backend/tests/test_shell_tool.py:81` | `test_blocked_rm_rf` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 124 | `backend/tests/test_shell_tool.py:93` | `test_blocked_format` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 125 | `backend/tests/test_shell_tool.py:105` | `test_blocked_shutdown` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 126 | `backend/tests/test_shell_tool.py:117` | `test_blocked_case_insensitive` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 127 | `backend/tests/test_shell_tool.py:131` | `test_basic_echo` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 128 | `backend/tests/test_shell_tool.py:143` | `test_basic_nonzero_exit` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 129 | `backend/tests/test_shell_tool.py:155` | `test_empty_output` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 130 | `backend/tests/test_shell_tool.py:169` | `test_timeout_kill` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 131 | `backend/tests/test_shell_tool.py:186` | `test_working_dir` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 132 | `backend/tests/test_shell_tool.py:207` | `test_tool_registration` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 133 | `backend/tests/test_shell_tool.py:224` | `test_openai_schema` | 2.5.2 | 契约 | 待裁（方向已定：按 DSH 四层重建） | OpenAI function schema 形态 |
| 134 | `backend/tests/test_shell_tool.py:241` | `test_windows_dir` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 135 | `backend/tests/test_shell_tool.py:260` | `test_gbk_output_decode` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 136 | `backend/tests/test_tool_base.py:71` | `test_timeout_enforced` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 137 | `backend/tests/test_tool_base.py:84` | `test_no_timeout_no_interference` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 138 | `backend/tests/test_tool_base.py:97` | `test_tool_error_normalized` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 139 | `backend/tests/test_tool_base.py:104` | `test_generic_error_normalized` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 140 | `backend/tests/test_tool_base.py:111` | `test_validation_hook_in_try` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 141 | `backend/tests/test_tool_base.py:121` | `test_validation_pass_through` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 142 | `backend/tests/test_tool_base.py:133` | `test_success_logged` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 143 | `backend/tests/test_tool_base.py:142` | `test_failure_logged` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 144 | `backend/tests/test_tool_base.py:157` | `test_execute_direct_still_works` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 145 | `backend/tests/test_tool_base.py:163` | `test_schema_present` | 2.5.2 | 契约 | 待裁（方向已定：按 DSH 四层重建） | 工具 schema 形态 |
| 146 | `backend/tests/test_tool_registry.py:40` | `test_enabled_list_filters` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 147 | `backend/tests/test_tool_registry.py:51` | `test_empty_list_registers_all` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 148 | `backend/tests/test_tool_registry.py:60` | `test_unknown_tool_skipped_with_warning` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 149 | `backend/tests/test_web_search.py:62` | `test_success_path_parses_results` | 2.5.2 | 契约 | 待裁（方向已定：按 DSH 四层重建） | Brave 响应样例解析 |
| 150 | `backend/tests/test_web_search.py:83` | `test_empty_results` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 151 | `backend/tests/test_web_search.py:98` | `test_malformed_json_raises` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 152 | `backend/tests/test_web_search.py:114` | `test_missing_web_field_returns_empty` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 153 | `backend/tests/test_web_search.py:137` | `test_web_search_tool_uses_injected_provider` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 154 | `backend/tests/test_web_search.py:157` | `test_unknown_provider_raises_tool_error` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 155 | `backend/tests/test_web_search.py:173` | `test_empty_query_returns_failure` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 156 | `backend/tests/test_web_search.py:180` | `test_timeout_degrades_to_failure` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 157 | `backend/tests/test_web_search.py:198` | `test_retry_then_success` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 158 | `backend/tests/test_web_search.py:220` | `test_no_results_degrades` | 2.9.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 159 | `backend/tests/test_web_search.py:236` | `test_max_results_clamped` | 2.5.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 160 | `backend/tests/test_web_search.py:277` | `test_blocked` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | SSRF 拦截 |
| 161 | `backend/tests/test_web_search.py:289` | `test_allowed` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | SSRF 放行 |
| 162 | `backend/tests/test_web_search.py:292` | `test_extract_urls` | 2.8.2 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 163 | `backend/tests/test_web_search.py:300` | `test_validate_request_blocks_internal_url` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 164 | `backend/tests/test_web_search.py:306` | `test_validate_request_passes_public` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 165 | `backend/tests/test_web_search.py:312` | `test_run_validation_error_normalized` | 2.7.1 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 166 | `harness/tests/guard.test.ts:6` | `DSH_HOME 指向临时目录` | 无对应（纯实现细节） | 隔离 | 待裁（方向已定：按 DSH 四层重建） | — |
| 167 | `harness/tests/real-api.test.ts:65` | `开关：只认 DSH_REAL_API=1/true` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 168 | `harness/tests/real-api.test.ts:75` | `Key 只从 env 读；空白视为未提供` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 169 | `harness/tests/real-api.test.ts:82` | `R1 备用 Key 缺省内置占位串` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 170 | `harness/tests/real-api.test.ts:89` | `判据：有效 Key 形态 → OK` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 171 | `harness/tests/real-api.test.ts:97` | `判据：无 Key → FAIL` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 172 | `harness/tests/real-api.test.ts:105` | `判据：错误 Key → FAIL` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 173 | `harness/tests/real-api.test.ts:112` | `判据：已关闭 Key → FAIL` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 174 | `harness/tests/real-api.test.ts:118` | `判据：exit 0 陷阱 → FAIL` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 175 | `harness/tests/real-api.test.ts:133` | `判据：非 completed 收尾 → FAIL` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 176 | `harness/tests/real-api.test.ts:146` | `R1 断言层：错误 Key 必须被拒` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 177 | `harness/tests/real-api.test.ts:150` | `结构防伪：开关关闭时禁发真实调用` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 178 | `harness/tests/real-api.test.ts:161` | `残留自查：sk- 明文必须抛` | 2.7.3 | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | — |
| 179 | `harness/tests/real-api.test.ts:186` | `R2：开关关闭 → SKIPPED ≠ pass` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | it.runIf；it( 检索式不命中 |
| 180 | `harness/tests/real-api.test.ts:196` | `有效 Key：真实调用判过` | 2.5.1 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 真实调用；开关关闭时 skip |
| 181 | `harness/tests/real-api.test.ts:221` | `R1 反向哨兵：错误 Key 真实调用判红` | 2.7.3 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 真实调用；错误 Key=契约哨兵 |
| 182 | `harness/tests/s0-e2e.test.ts:324` | `四项判据 / 负向对照` | 2.5.2 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 真实 LLM + 真实 dsh 子进程 |
| 183 | `harness/tests/s0-resume.test.ts:281` | `四项判据 / 定性` | 2.3.1 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 真实 LLM + 跨进程 resume |
| 184 | `harness/tests/sentinel-failfast.test.ts:13` | `污染 DSH_HOME 指向真实库应被拦` | 无对应（纯实现细节） | 隔离 | 待裁（方向已定：按 DSH 四层重建） | — |
| 185 | `harness/tests/sentinel-key-residue.test.ts:15` | `含 sk- 明文文件，teardown 必须告警` | 2.7.3 | 隔离 | 待裁（方向已定：按 DSH 四层重建） | 告警型哨兵 |
| 186 | `harness/tests/sentinel-realapi-key-residue.test.ts:29` | `真实调用临时目录 key 残留必须命中` | 2.7.3 | 隔离 | 待裁（方向已定：按 DSH 四层重建） | 告警型哨兵 |
| 187 | `harness/tests/sentinel-realapi-r1.test.ts:24` | `必须带 DSH_REAL_API=1 运行` | 无对应（纯实现细节） | 逻辑 | 待裁（方向已定：按 DSH 四层重建） | 未开开关时故意抛错 |
| 188 | `harness/tests/sentinel-realapi-r1.test.ts:30` | `错误 Key 真实调用必须被断言层拒绝` | 2.7.3 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 真实调用；预期 FAIL 即哨兵成功 |
| 189 | `harness/tests/sentinel-unset.test.ts:14` | `删除 DSH_HOME 后应被拦` | 无对应（纯实现细节） | 隔离 | 待裁（方向已定：按 DSH 四层重建） | — |
| 190 | `harness/packages/plugin-approval-answerer/test/smoke.mjs:1` | `插件冒烟：声明/接线/策略/降级` | 2.7.2 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 假 ctx 单测范式；批准/拒绝/超时/委托/降级 |
| 191 | `harness/packages/plugin-tool-readfile/test/smoke.mjs:1` | `插件冒烟：注册/读文件/截断/越界` | 2.5.2 | 冒烟 | 待裁（方向已定：按 DSH 四层重建） | 假 ctx 单测范式；rootDir 越界拒绝 |

> 备注列只记**事实性 caveat**（恒真断言、跨子项、口径差），不含处置建议。两条恒真断言（#41／#42）**不应被当成真实覆盖**。

## 2 反向视角：没有测试兜着的子项

> 口径写死：**只统计 `backend/tests` ＋ `harness/tests` ＋ 2 个 smoke 这三处**；⛔ 产品文档里写「测过」不算有测试。

### 2.1 完全没有用例（14 个子项）

| 子项 | 名称 | 说明 |
|---|---|---|
| 2.3.3 | 会话级作用域（沙盒） | 现有 sandbox 用例是文件工具的工作目录限制（归 2.7.1），不是会话级沙盒 |
| 2.3.4 | 多模态输入 | 无实现、无用例 |
| 2.3.5 | 主动触达 | 无实现、无用例 |
| 2.4.4 | 记忆保鲜与代谢 | 无实现；`last_hit_at` 等字段无测试 |
| 2.4.5 | 用户画像 | 无实现、无用例 |
| 2.4.6 | 知识库 | 无实现、无用例 |
| 2.5.3 | 扩展性与零代码接入 | 无用例主归；角色/工具配置面由 2.6.1／2.5.2 用例间接涉及，但「加一个不碰前端」未验 |
| 2.6.2 | 自动路由（意图识别） | 无实现、无用例 |
| 2.7.5 | 数据主权与出境边界 | 无用例；auth middleware 归 2.7.3，未验证出境/隐私 |
| 2.8.3 | 资源消耗（成本）可见 | 无实现；token 统计只落日志、未入库 |
| 2.9.1 | 时间感知 | 无用例 |
| 2.10.1 | 云端部署、多端使用 | 无用例 |
| 2.10.2 | 端侧能力保留 | 无用例；shell／file_ops 用例是本机工具，不是端侧执行器 |
| 2.10.3 | 单人单实例 | 形态事实，无测试 |

### 2.2 仅有间接断言、无用例主归（4 个子项）

| 子项 | 名称 | 间接来源 | 缺口 |
|---|---|---|---|
| 2.4.3 | 记忆可管理 | `test_archive.py` 里 `GET /api/memory` 列表被顺带断言（#1／#2／#11） | 删除、入库后编辑、停用均无测试 |
| 2.7.6 | 数据可恢复与可迁移 | 仅会话级软删→恢复（#4）与 purge（#5），不是整库备份 | 备份／导出／迁移无测试；`test_migrations.py` 只验 schema 迁移 |
| 2.8.1 | 沉淀信息可见与可管理 | 同 2.4.3（产品表述同源） | 无 UI／记忆浏览器测试 |
| 2.9.2 | 超长会话一致性 | 截断机制在 2.4.1 用例（#33） | 无 compaction／长会话一致性测试 |

### 2.3 有主归但覆盖薄（参考，不计入「无测试」）

- **2.3.2 对话体验**：只有流式主路径＋流式 404；**停止生成未测**。
- **2.5.1 多模型按需切换**：只有 `/api/models` 与一次真实调用；多 provider 切换未测。
- **2.7.2 边界透明与用户决策权**：只有 approval-answerer 插件 smoke；工具开关／config 边界未测。
- **2.7.4 成本约束**：只有 token 估算 `n>0`，无预算／限额／告警。
- **2.8.2 AI 行为可见**：CoT 存档＋URL 提取；ToolCallCard／降级提示未测。
- **2.9.3 降级与韧性**：面广但全是 mock 故障注入；无真实网络故障／真实 Chroma 宕机。

## 3 建议（非本表结论，与主表物理隔开）

> M-2 允许单列建议节；以下**不是**逐条迁移处置，只是盘点过程中看到的测试缺口／口径问题。

1. **先修两条恒真断言**（#41 `test_vector_store_client_creation_failure`、#42 `test_delete_by_memory_id_chromadb_failure`）：它们接受两个相反分支或直接调 mock，迁成 Vitest 会把「假覆盖」一起搬过去。
2. **2.4.3 是用户可达却零主归**：补 `GET /api/memory` 列表＋`DELETE /api/memory/{id}` 的 API 测试，比补未实现子项更划算。
3. **2.3.2 补停止生成**：现有用例只验流式 happy path 与流式 404，停止生成是产品已做档位，却没有测试。
4. **2.9.2／2.7.6／2.8.3 属「产品承诺已写、测试零覆盖」**：重建时要么补测，要么先降档，⛔ 不要留着文档承诺当已验。
5. **统一 harness 计数口径**：`it(` 会漏 `it.runIf(`；复算建议用 `\bit(\.\w+)?\(`，并把 helper 文件排除规则写死。
6. **2.7.5 至少补一条静态断言**（搜索查询发往外部 provider 的可见性），否则「出境事实」只有文档没有测试。

## 4 自曝（判不准／口径差）

- **四层定义口径差**：见 §0.4 的 ⚠️。我没有在 `dsh-migration.md` §3.6 找到「逻辑／契约／隔离／冒烟」的逐条定义，四类是按 DSH-6 段 5 行表的语义落的。
- **交叉用例的归属是判断，不是事实**：
  - `test_archive.py:232` `test_trash_conversation_rejected`：2.4.2（归档入口）×2.3.1（回收站状态），我取 2.4.2。
  - `test_auth_middleware.py` 7 条：2.7.3（凭据边界）×2.7.5（上云硬前置①提到 P3.4），我取 2.7.3。
  - `test_cot_archive.py` 5 条：2.8.2（可核对）×2.7.6（可恢复），我取 2.8.2。
  - `test_migrations.py` 2 条：无对应 ×2.7.6（可迁移），我取「无对应」——它是 schema 迁移基建，不是整库迁移。
  - `test_roles_api.py` 5 条：2.6.1（角色切换）×2.5.3（零代码加角色），我取 2.6.1。
- **「无对应」20 行**主要是测试基建（隔离守卫、real-api 判据自检、schema 迁移）。若按「测试资产都要挂产品面」的口径，其中一部分可改挂 2.7.3／2.5.2；我没有硬挂。
- **覆盖类型是判断，不是跑出来的**：本轮只读代码／用例名／关键用例抽读，未执行测试；🟢 的是计数（grep），🟡 的是映射（读码判断）。
- **两个 embedding 手动脚本**不计入 191 行；如果口径要求「所有测试资产」而非「所有用例」，它们应另立 2 行「无对应」资产行——本表按 M-1 的「用例」口径不列。

## 5 诚实边界（M-6）

- 本表只证「现有测试各自覆盖什么」，⛔ **不证覆盖完整**，⛔ 不得用于声称「31 子项都有测试兜着」。
- 实际分布：**13 个子项有用例主归**（2.3.1／2.3.2／2.4.1／2.4.2／2.5.1／2.5.2／2.6.1／2.7.1／2.7.2／2.7.3／2.7.4／2.8.2／2.9.3）；**4 个只有间接断言**（2.4.3／2.7.6／2.8.1／2.9.2）；**14 个完全没有测试**（§2.1）。
- 本表是**账面**，⛔ 不是验收依据；处置一律待裁。
