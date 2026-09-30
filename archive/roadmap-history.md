# LarryAgent 路线图历史归档

> 本文件为**冷存储归档**，由 `TODO.md` 于 2026-08-17 治理时迁出，当时包括P0–P3 已完成阶段全文，后续完成的工作也会持续移入本文件
> 本文件的P0-P4指项目的初版设计指标，后续均为优化迭代
> 活跃 TODO 见根目录 `TODO.md`；检索用 Grep（按阶段标题，见本文档第一部分`### 目录`）。
> 排查 BUG / 做改动前先扫本文件。

---

### 目录

1. 最小聊天闭环：`### P0`
2. 记忆系统可用：`### P1`
3. 工具调用闭环：`### P2`
4. 流式+体验优化：`### P3`
5. PC客户端可用：`### P4`
6. 功能增强：`### 功能增强`，包括归档系统、UI/UX优化、测试层完善等多项内容
7. DSH-事实校准：`### DSH-1`
8. DSH-代码形态+环境准备：`### DSH-2`
9. DSH-核心能力 prototype（已完成切片）：`### DSH-3`

### P0 - 最小聊天闭环 ✅

> 能发消息、收回复、存历史

- [x] 修复启动时序：DB 目录创建移到 `get_db()` 之前
- [x] Qdrant 加 `enabled` 开关 + try/except 容错，P0 不依赖
- [x] VectorStore 改为 ChromaDB 内嵌方案，无需独立进程
- [x] 新增 `db/conversations.py`：会话与消息 CRUD
- [x] 实现 `/api/chat` 非流式（短期记忆 + LLM 调用，跳过长期记忆和工具）
- [x] 修复 LLM 客户端缓存 key：按 provider 而非 model name
- [x] 新增 `logging_config.py`：统一日志格式 + 第三方库降噪
- [x] config.yaml 补 `vector_store.enabled` / `logging` 段，统一 larry 命名
- [x] chat.py 加默认 system prompt
- [x] 申请 API Key 填入 `config.yaml`，端到端测试通过（2026-08-07）

### P1 - 记忆系统可用 ✅

> 能检索上下文，多轮对话有记忆，跨会话归档

**P1.1 - Embedding 模块** ✅

- [x] 重写 `models/embedding.py`，抽象基类 `EmbeddingProvider` + 工厂函数 `get_embedding_provider()`
- [x] 实现 `LocalEmbedding`：基于 `sentence-transformers` 加载 `BAAI/bge-small-zh-v1.5`（512 维，~95MB）
- [x] 实现 `OpenAIEmbedding`：兼容 OpenAI embedding API（备用方案）
- [x] `config.yaml` / `config.py` 中 embedding 段补 `local_model_name`、`base_url`、`hf_endpoint` 字段
- [x] 安装依赖 `sentence-transformers`，验证模型可加载、可生成向量、余弦相似度正确（2026-08-07）
- [x] 测试文件归档：`tests/test_embedding.py`（基础验证）、`tests/test_embedding_enhanced_version.py`（增强版：多维度语义、多语言、长文本、边界测试）

**P1.2 - ChromaDB 向量库 CRUD** ✅

- [x] 从 Qdrant 切换到 ChromaDB 内嵌方案：无需独立进程，零外部依赖
- [x] `vector_store.py` 全量重写：`asyncio.to_thread` 包装同步 ChromaDB 调用
- [x] `config.py` / `config.yaml`：`QdrantConfig` → `VectorStoreConfig`（path + collection_name）
- [x] 实现 `insert(points)`：`coll.upsert(ids, embeddings, metadatas)` 批量插入
- [x] 实现 `search(query_vector, limit, score_threshold)`：`coll.query()` + 余弦距离→相似度转换 + 阈值过滤
- [x] 实现 `delete(point_ids)`：`coll.delete(ids)`
- [x] `ensure_collection`：`get_or_create_collection(schema-free)`，ChromaDB 无需预先指定维度
- [x] 验证 `chunker.py` 分块结果与向量库 insert 数据格式对接

**P1.3 - DB 层补全** ✅

- [x] `db/conversations.py` 补 `get_messages(conversation_id, limit)` 方法：最近 N 条消息，时间正序
- [x] `memory/engine.py` 的 `get_short_term_memory` 改为调用 `conversations.get_messages()`，消除直接 SQL
- [x] 新建 `db/memories.py`：`create_memory` / `get_memory` / `list_memories` / `update_memory` / `deactivate_memory` / `delete_memory`

**P1.4 - 长期记忆检索** ✅

- [x] 实现 `memory/engine.py` 的 `get_long_term_memory(query)`：query → embed → ChromaDB search → 返回文本列表
- [x] ChromaDB 不可用时降级返回空列表（try/except），不影响 P0 聊天功能
- [x] `api/chat.py` 接入：`long_term=await get_long_term_memory(req.message)` 注入 system prompt
- [x] `main.py` lifespan 已调整：embedding provider 初始化 → `ensure_collection(dim)`

**P1.5 - 归档流程** ✅

- [x] 新建 `memory/archiver.py`：对话全文 → LLM 摘要 → 分块 → 向量化 → 双写存储
- [x] 新建 `api/memory.py` 路由：POST archive / POST archive/confirm / GET list / DELETE
- [x] 设计摘要生成 prompt（保留需求/偏好/决策/事实信息，丢弃闲聊）
- [x] 记忆软标记：ChromaDB metadata 记录 `source_role`，检索时排序加权，不硬过滤
- [x] 端到端验证：归档 → 新会话记忆召回 → 双删（2026-08-07）

**P1.6 - 端到端测试 + 降级保护** ✅

- [x] `config.yaml` 开启 `vector_store.enabled: true`
- [x] 测试长期记忆检索：多轮对话后归档 → 新会话中验证记忆召回
- [x] 测试归档流程完整闭环
- [x] ChromaDB 降级测试（`tests/test_chromadb_degradation.py`，7 项全通过，2026-08-10）
- [x] 修复 `confirm_and_store` 降级保护：ChromaDB 写入失败时 SQLite 记录保留、会话正常归档

### P2 - 工具调用闭环

> Agent 能调用文件和 Shell。tools/ 骨架已存在（base.py / registry.py 完整，file_ops.py / shell.py / api/tools.py 仅 501 占位），各子阶段填充血肉。

**P2.1 - FileOpsTool 实现** ✅

路径沙箱用 pathlib：resolve 绝对路径 → 确认在 workspace 子树内 → 拒绝 `../` 逃逸。三动作：

- [x] `_read(path)`：`Path.read_text(encoding="utf-8")`，文件不存在返回 error
- [x] `_write(path, content)`：先检查路径在 workspace 内，同路径已存在则自动追加后缀 `_1` / `_2`（不覆盖），`Path.write_text`
- [x] `_list(path)`：目录存在返回文件和子目录名列表，不存在返回 error
- [x] `_read` 文件大小限制 100KB（`_MAX_READ_BYTES`），防止 LLM 读大文件撑爆上下文
- [x] `_list` 条目上限 1000（`_MAX_LIST_ENTRIES`），超出截断并提示总数

配置化：`_workspace_root` 从 `config.yaml` 的 `tools.file_ops_workspace` 读取，默认 `~/larry_workspace`。
端到端测试 20 项全通过（`tests/test_file_ops_tool.py`，2026-08-11）：读/写/列表三动作、路径沙箱（`../` 逃逸、绝对路径逃逸）、不覆盖写入、嵌套目录、文件大小限制、条目截断、工具注册与 schema。

**P2.2 - ShellTool 实现** ✅

- [x] `asyncio.create_subprocess_shell` 执行，`communicate()` 读 stdout/stderr
- [x] 30s `asyncio.wait_for` 超时（仅包裹 `communicate()`，不包裹进程创建）；超时后 `_kill_process()` 清理
- [x] `working_dir` 参数生效
- [x] 高危命令黑名单检测（`_blocked_patterns`：`rm -rf /`, `del /f /s C:\`, `format`, `shutdown`）
- [x] IP 白名单：从 `config.yaml` 的 `tools.shell_allowed_ips` 读取，默认 `["127.0.0.1", "::1"]`。校验逻辑下沉到 `ShellTool.execute()` 内部，从 `kwargs` 接收 `caller_ip` 比对
- [x] `config.py` `ToolsConfig` 新增 `shell_timeout` 字段（默认 30），配置驱动超时
- [x] 工具注册：`scan_and_register()` 自动发现 ShellTool，`get_openai_schema()` 生成 function calling schema
- [x] Windows 超时杀进程树：`taskkill /T /F /PID` 杀孙进程，非 Windows 用 `proc.kill()`
- [x] 端到端测试 15 项全通过（`tests/test_shell_tool.py`，2026-08-11）

注意：config 采用扁平结构 `tools.shell_allowed_ips` + `tools.shell_timeout`，而非嵌套 `tools.shell.xxx`，简化读取逻辑。

**P2.3 - Function Calling 循环（/api/chat）** ✅

> P2 核心。改造 `/api/chat` 的 LLM 调用段。

**前置依赖（已完成）：**
- [x] `llm.py::chat_completion` 改为接受 `tools` 参数，返回 `LLMResponse(content, tool_calls, finish_reason)` 结构
- [x] `messages` 表新增 `tool_call_id` 列（增量迁移），`insert_message` / `get_messages` 支持 tool_calls 序列化存储 + OpenAI 格式转换
- [x] 重构 chat.py：业务逻辑下沉到 `services/chat_service.py`，API 层只做参数校验 + caller_ip 提取 + 错误转换

**功能实现：**
- [x] `get_openai_tools()` 返回的 schema 注入 LLM 请求的 `tools` 参数
- [x] LLM 返回后检测 `finish_reason == "tool_calls"`，解析 `tool_calls`
- [x] 从 registry 取工具 → `await tool.execute(**args)`，ShellTool 自动注入 `caller_ip`（从 `request.client.host` 获取）
- [x] tool result 作为 `role: "tool"` 消息追加到 messages，带 `tool_call_id`（来自原 tool_call 的 `id`）
- [x] 循环直到 `finish_reason == "stop"`（纯文本）
- [x] 最大轮次限制（`MAX_TOOL_ROUNDS = 10`），防止死循环
- [x] 工具按角色过滤：`_get_tools_for_role(role)` 按 config.yaml 中 role 的 `tools` 列表过滤，未配置则返回全部
- [x] 每轮 tool call 记录日志（工具名、结果摘要 200 字符）
- [x] 持久化设计：每轮的 assistant 消息（含 tool_calls）和 tool 结果消息（含 tool_call_id）实时写入 DB，会话恢复时 `get_messages` 反序列化并转为 OpenAI 格式，不丢失工具调用上下文。
- [x] 端到端测试 8 项全通过（`tests/test_chat_service.py`，2026-08-11）：无工具调用、单工具调用、多工具调用、最大轮次限制、工具不存在处理、消息持久化（tool_calls + tool_call_id）、角色过滤。

**P2.4 - /api/tools 接口实现** ✅

- [x] `GET /api/tools`：调用 `list_tools()`，返回 `[{name, description, parameters, enabled}, ...]`
- [x] `POST /api/tools/execute`：从 registry 取工具 → `tool.execute(**params)`，ShellTool 自动注入 caller_ip

**P2.5 - config.yaml 扩展** ✅

- [x] 新增 `tools` 配置段（扁平结构，含 `file_ops_workspace`、`shell_allowed_ips`、`shell_timeout`、`function_calling_max_iterations`），`chat_service.py` 从 config 读取最大轮次
  ```yaml
  tools:
    file_ops_workspace: "~/larry_workspace"
    shell_allowed_ips: ["127.0.0.1", "::1"]
    shell_timeout: 30
    function_calling_max_iterations: 10  # P2.3 实现时补充
  ```

**P2.6 - 端到端测试**

- [x] 单工具调用：让 LLM 读一个已知文件，验证返回内容（`test_integration_llm.py::test_single_tool_call`，真实 DeepSeek API）
- [x] 多工具串行：先 `list` 目录再 `read` 其中某个文件（`test_integration_llm.py::test_multi_tool_serial`，真实 DeepSeek API）
- [x] Shell 工具：执行 `echo hello`，验证 stdout（`test_shell_tool.py` 已覆盖）
- [x] 沙箱拒绝：尝试 `../` 路径，验证返回 error（`test_file_ops_tool.py` 已覆盖）
- [x] 黑名单拒绝：尝试 `rm -rf /`，验证被拦截（`test_shell_tool.py` 已覆盖）
- [x] 循环上限：构造一个永远要调工具的场景，验证在第 N 轮截断（`test_chat_service.py::test_max_rounds`）
- [x] API 层：`GET /api/tools` 返回列表；`POST /api/tools/execute` 手动调工具（`test_integration_llm.py::test_api_tools_endpoint`）
- [x] 角色过滤端到端：role 只配 `tools: ["file_ops"]`，验证传给 LLM 的 `tools` 参数不含 shell schema（`test_chat_service.py::TestRoleFilterEndToEnd`）
- [x] 工具失败恢复：LLM 调 `file_ops.read` 读不存在的文件 → tool 返回 error → error 内容正确回到 messages 的 `role: "tool"` 且对话不中断（`test_chat_service.py::TestToolErrorRecovery`）
- [x] caller_ip 注入：通过 `_run_tool_loop` 调 ShellTool，验证 `caller_ip` 实际传入 kwargs（安全关键路径）（`test_chat_service.py::TestCallerIpInjection`）

### P3 - 流式 + 体验优化

> 打字机效果、Token 统计、错误处理、记忆调优
>
> 执行顺序（2026-08-12 确认）：P3.3 → P3.4 → P3.5 → P3.2

**P3.0 - 前置修补（流式实现前必须完成）** ✅

- [x] `llm.py:_resolve_provider_key` 前缀解析改显式 dict 映射（如 `{"deepseek-chat": "deepseek", "qwen-max": "qwen"}`），防止接第二个 provider 时解析断裂
- [x] `LLMResponse` 补 `usage` 字段（prompt_tokens / completion_tokens / total_tokens），`chat_completion` 解析 `response.usage` 写入返回
- [x] `config.py` 新增 `LLMConfig` dataclass（`max_retries` / `retry_backoff_base` / `max_input_tokens` / `debug_log`），`config.yaml` 和 `config.example.yaml` 同步新增 `llm` 配置段。P3.2/P3.3 的配置项统一挂在此段下

**P3.1 - SSE 流式聊天** ✅

> 通信协议保持现有 `/api/chat`，通过 Header 区分：`Accept: text/event-stream` 走流式，否则走非流式。

- [x] `llm.py` `chat_completion_stream` 补 `stream_options={"include_usage": True}`，流结束时记录 final chunk 的 usage；支持 `tools` 参数
- [x] `chat_service.py`：`_run_tool_loop` 重构为 `_chat_flow` async generator。FC 循环非流式检测 tool_calls，最终文本用 `chat_completion_stream` 真实流式输出。`handle_chat` 消费 generator 收集 delta，`handle_chat_stream` 包装为 SSE 字符串
- [x] 工具调用事件：`event: tool_call`（执行前推送，含工具名/轮次/参数）、`event: tool_result`（执行后推送，含成功/失败/结果摘要）、`event: delta`（文本流）、`event: done`、`event: error`
- [x] `chat.py`：端点复用 `/api/chat`，根据 `Accept: text/event-stream` 分支 → `StreamingResponse`
- [x] 移除 `/api/chat/stream` 501 占位端点
- [x] `client/chat.html`：SSE 流解析 + delta 文本实时追加 + 工具调用卡片（spinner→✅/❌ + 结果展示）
- [x] 测试验证：11 项 mock 测试全通过 + 3 项真实 DeepSeek API 集成测试全通过

**P3.2 - LLM 重试** ✅（2026-08-15，Trae 实现 / Claude 测试 / WorkBuddy 复验通过）

- [x] `requirements.txt` 新增 `tenacity>=8.2.0`
- [x] `models/llm.py` 新增重试包装函数（`AsyncRetrying` + `retry_if_exception_type`），参数从 config 读取
- [x] 可重试异常：`APITimeoutError` / `APIConnectionError` / `RateLimitError` / `InternalServerError`
- [x] 不可重试：4xx `APIStatusError` / `AuthenticationError` / 其他
- [x] `chat_completion`（非流式）：`create` 调用套重试包装
- [x] `chat_completion_stream_events`（流式）：`create` 调用套重试包装；流迭代中失败不重试（已部分消费）
- [x] 每次重试有日志（含 attempt 次数 + 异常类型 + 等待时间）
- [x] `max_retries=0` 时不重试（直接抛）
- [x] 测试 `tests/test_llm_retry.py`（Claude）：5 项强制——可重试异常触发重试 / 不可重试不触发 / 重试耗尽抛原始异常 / max_retries=0 不重试 / 流式 create 阶段重试
- [x] 回归：`test_chat_service.py` 16 项 + `test_auth_middleware.py` 7 项 + `test_exceptions.py` 9 项全通过

**P3.3 - Token 用量统计** ✅（2026-08-12，含 token 翻倍优化）

- [x] token 翻倍优化（方案 A）：新增 `chat_completion_stream_events` 全程流式支持 tools——每轮 FC 循环单次流式调用同时拿到 delta + finish_reason + tool_calls + usage。有 tool_calls 时进入工具循环，无工具时 delta 已实时推送。消除"非流式探测 + 流式重生成"的 token 翻倍问题（无工具调用场景 LLM 调用次数从 2 → 1）
- [x] 风险控制（交付标准）：补 `TestLLMStreamEventsStateMachine` 单测覆盖"tool_calls 参数跨 chunk 拆分"场景（多 tool_call × arguments 分段 × id/name 分 chunk 出现），验证跨 chunk 拼接状态机正确
- [x] 每次 LLM 调用后记日志：`batch_llm_call token_usage model=... total=... prompt=... completion=...`（`llm.py::_log_token_usage`，流式 + 非流式统一输出）
- [x] `llm.max_input_tokens`（config 已存在）：新增 `models/token_counter.py`，tiktoken 估算 + 未安装时回退字符数保守估算。请求前超出阈值时按策略截断并 WARNING 日志
- [x] `chat_service.py` 单次请求累计 token（`_accumulate_usage` 按 FC 循环每轮叠加），超过 `llm.max_input_tokens` 阈值告警日志（只 warn 一次避免刷屏）
- [x] `llm.debug_log` 开关（config 已存在）：`llm.py::_debug_log_request` / `_debug_log_response` 控制 raw 请求/响应正文 DEBUG 日志输出，默认关闭

> ⚠️ **tiktoken 精度问题：** DeepSeek 的 tokenizer 与 OpenAI 不同（尤其是中文），tiktoken 估算值会偏。估算仅用于**截断触发**（超了就截），不做精确计费——精确用量以 API 返回的 `response.usage` 为准。tiktoken 未安装时自动回退字符数保守估算并 WARNING 提示。
>
> **截断策略：** 保留 system prompt + 最后 N 条消息，从中间删除旧消息，不从头部截（防止丢失 system prompt 上下文），中间插入"（历史消息因超 token 限额已省略）"占位提示。

测试：16 项全通过（11 项 chat_service 端到端 + 2 项 TokenCounter + 3 项 LLMStreamEvents 状态机，其中 test_no_tool_calls 新增强断言 call_count==1 直接验证了消除双调用）。

P3 只做记录告警，DB 表和 API 留给 P4。

**P3.4 - API Key 校验** ✅（2026-08-15，Trae 实现 / Claude 测试 / WorkBuddy 复验通过）

- [x] 新增 `backend/middleware/auth.py`：`AuthMiddleware(BaseHTTPMiddleware)`，仅拦截 `path.startswith("/api/")`，非 `/api/` 天然透传；空 `server.api_key` 完全透传；非空时校验 `Authorization: Bearer <key>`，失败返回 401
- [x] `config.py` `ServerConfig` 补 `api_key: str = ""` 字段（解析逻辑已兼容，无需改）
- [x] `config.yaml` `server` 段新增 `api_key: ""`（保持空，当前不启用）
- [x] `config.example.yaml` `server` 段新增 `api_key: ""` + "P5 放开局域网前必须设置"注释
- [x] `main.py` 在 `include_router` 前 `app.add_middleware(AuthMiddleware)`
- [x] 401 响应体严格为 `{"error": "AUTH_ERROR", "detail": "Invalid or missing API key"}`
- [x] 测试 `tests/test_auth_middleware.py`（FastAPI TestClient）：空 key 透传 / 无 header→401 / 正确 Bearer→200 / 错误 Bearer→401 — 7 项全通过；回归 `test_chat_service.py` 16 项全通过，无回归

**P3.5 - 自定义异常类** ✅（2026-08-15，Trae 实现 / Claude 测试 / WorkBuddy 复验通过）

- [x] 新增 `backend/exceptions.py`：`LarryException` 基类（`error_type` + `status_code` + `detail`）→ `ConfigError`(500) / `LLMError`(502) / `ToolError`(500) / `AuthError`(401)
- [x] 改造 `middleware/auth.py`：内联 `JSONResponse(401)` → `raise AuthError("Invalid or missing API key")`；dispatch 外层加 LarryException→JSONResponse 兜底（绕过 Starlette BaseHTTPMiddleware 不进 FastAPI handler 的限制）
- [x] 改造 `api/chat.py`：三段 try/except（ValueError/APIError/Exception）→ 转为 `raise LLMError(...)` from e
- [x] 全局异常 handler 注册到 `main.py`：`@app.exception_handler(LarryException)` → `JSONResponse(status_code=exc.status_code, content={"error": exc.error_type, "detail": exc.detail})`
- [x] 扫描 `api/memory.py`：ValueError→LLMError、通用 Exception→LarryException；`api/tools.py` 无通用异常需改
  - [x] 测试 `tests/test_exceptions.py`（Claude）：9 项全通过——4 异常类型映射 + 2 中间件 raise→401 + 2 正常放行 + 1 非预期异常→500
  - [x] 回归：`test_auth_middleware.py` 7 项 + `test_chat_service.py` 16 项全通过，无回归

---

### P4 - PC 客户端可用 ✅

> 双击图标直接用
>
> **技术路线裁决（2026-08-15）**：Tauri（骨架已备 `client/`、真 exe 双击即用、体积小），否决 pywebview（无独立 exe，依赖本机 Python 环境）与 Electron（过重）。
> **P4 详细计划三方评审完成**（Trae/Claude/Marvis 意见已吸收），Q1–Q8 定案：Q1 裸 python+spawn 前探测（Windows Store stub 坑）/ Q2 首条消息截取前 20 字符 / Q3 角色切换 UI 做 / Q4 归档入口不做 / Q5 用 `CARGO_MANIFEST_DIR` 编译期推导绝对路径（不依赖 working directory）/ Q6 chat.html 保留作调试工具 / Q7 响应式设计 P4 一次做对，mobile/ 暂不动 / Q8 系统托盘不做。

**P4.1 - Tauri 进程管理（Rust 侧）** ✅（2026-08-15 派发：Trae 实现 / WorkBuddy 复验通过）

- [x] `main.rs` 实现 `spawn_agent()`：`Command::new(python_path).args(["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"])`，backend 路径从 `CARGO_MANIFEST_DIR` 编译期常量推导，不依赖 working directory
- [x] Python 探测：spawn 前先 `python --version` 检测（Windows Store stub 会静默失败），失败再试 `py -3`，给清晰错误提示
- [x] `setup` 钩子：先对 `http://127.0.0.1:8000/health` 做签名校验（响应体含 `version` 字段，防 8000 被其他服务占用时假阳性）——已跑则复用（dev mode，同时解决端口冲突），未跑再 spawn
- [x] 轮询 health check：500ms 间隔，超时 30s 报错
- [x] `AgentProcess` state 注入 Tauri，持有 `Child` 句柄；暴露 **restart 能力**（kill + respawn + 重新 health check，供配置变更 / 崩溃恢复重启）
- [x] `on_window_event(Destroyed)`：只 kill 自己 spawn 的 child（防误杀），kill + wait
- [x] 后端崩溃感知：后台线程每 5s health check，状态变化时 emit `"backend-status"` 事件给前端（payload: `{status, error?}`），前端提示而非白屏
- [x] 注意：用 `/health` 而非 `/api/health`（前者不被 AuthMiddleware 拦截，无需 API key）

**P4.2 - 前端项目搭建（Vue 3 + Vite）** ✅（2026-08-15 派发：Trae 实现 / WorkBuddy 复验通过）

- [x] `client/` 下初始化 Vue 3 + Vite + TypeScript
- [x] `vite.config.ts`：dev server 端口 5173、proxy `/api` + `/health` → `http://127.0.0.1:8000`、strictPort（端口被占用报错而非换端口）
- [x] 基础布局 `AppLayout`（左侧栏 + 主区域），响应式（768px 断点，移动端汉堡菜单）
- [x] 路由：`/`（聊天），懒加载
- [x] 全局状态：当前会话 ID、会话列表、连接状态（Pinia）
- [x] `package.json` 更新：vue、vue-router、vite、typescript、pinia、vue-tsc
- [x] 验证 `npm run build` 通过（vue-tsc 类型检查 + vite build 41 模块）。⚠️ tauri dev 实际窗口启动链路待真机验证（需 GUI 环境）

**P4.35 - 界面基调定义** ✅（2026-08-15 派发：Marvis 出初稿 / UI Designer 精化 / 老大审定）

- [x] 产出一页设计约定：布局结构（左会话栏 + 右消息流）、配色基调（暗色为主，灰阶 + 交互锚点色 #378ADD）、字体（中文系统字体优先 + Inter fallback）、组件风格（5 个核心组件规格 + 边界状态 + WCAG AA 合规）
- [x] 定案多角色差异化呈现方案：default=亮中性灰 #9CA3AF / health=低饱和翠绿 #34D399 / finance=低饱和琥珀 #FBBF24；色点+问候语+AI 气泡色带+工具卡片 header 色，不做三套换肤
- [x] Logo 定案：C2 写意版（毛笔三笔 + 禅圆缺口 + 朱红点），老大拍板"外圈缺口是灵魂"
- [x] 完整 design token 体系（配色 / 排版 / 间距 / 圆角 / 过渡动画 5 类 token）+ 组件详细规格（MessageBubble / ToolCallCard / ChatInput / SidebarItem / TopBar）+ 响应式断点体系 + 边界状态设计 + Accessibility

**P4.3 - 会话管理 API（后端补全）** ✅（Trae 实现 / Claude 测试 / WorkBuddy 复验 ✅）

- [x] `db/database.py` 开启 `PRAGMA foreign_keys=ON`（SQLite 默认不强制外键，`ON DELETE CASCADE` 当前不生效）
- [x] `db/conversations.py` 新增 `list_conversations(limit=50)` → `[{id, title, updated_at, is_archived}]`，按 `updated_at DESC`
- [x] `db/conversations.py` 新增 `delete_conversation(conversation_id)` → 级联删除（pragma 生效后由 `ON DELETE CASCADE` 触发，测试显式验证）
- [x] `db/conversations.py` 新增 `rename_conversation(conversation_id, title)`
- [x] **ChatRequest 模型加 `conversation_id: int | None` 字段**；`_chat_flow` 开头逻辑改造：传入 id 时跳过创建直接续接，None 时自动创建（现行为）。⚠️ 对 `test_chat_service.py` 的 mock 结构有连带影响，派发规格需明确
- [x] 标题生成落地：`chat_service` 新建会话时用首条用户消息截取前 20 字符作 title；`POST /api/conversations` 手动新建时 title 空串，前端显示"新会话"占位
- [x] 新建 `api/conversations.py`：`GET /api/conversations`（列表）/ `POST`（创建）/ `GET /{id}/messages`（历史）/ `PATCH /{id}`（重命名）/ `DELETE /{id}`（删除）
- [x] 新增 `GET /api/models`：返回 `llm._MODEL_PROVIDER_MAP` 的 keys，避免前端硬编码模型列表与后端不同步
- [x] `main.py` 注册 conversations router
- [x] tool 消息处理：`GET /{id}/messages` 返回完整数据（含 role="tool"），**前端过滤**不展示，保持 API 完整
- [x] 测试（Claude）：conversations CRUD + 级联删除验证 + chat 续接会话 + models 端点（17/17 全过，临时 DB 隔离）

**P4.4 - 聊天界面（Vue 组件）** ✅（已交付 + WorkBuddy 复验通过，2026-08-19）

- [x] 严格遵循 P4.35 界面基调（design token / 配色 / 组件规格 / 多角色差异）实现下列组件
- [x] `ConversationSidebar.vue`：会话列表 + 新建 + 删除 + 选中高亮
- [x] `MessageList.vue`：消息气泡（user/agent/error）+ 自动滚动；过滤 role="tool" 消息
- [x] `ToolCallCard.vue`：工具调用卡片（spinner→✅/❌ + 参数 + 结果摘要），从 chat.html 移植
- [x] `ChatInput.vue`：Enter 发送 / Shift+Enter 换行 + 禁用状态
- [x] `ModelSelector.vue`：从 `GET /api/models` 拉取列表
- [x] `RoleSelector.vue`：角色切换下拉（health/finance/default），传 role 给 `/api/chat`
- [x] `StatusBar.vue`：连接状态 + 当前会话 ID + token 统计
- [x] SSE composable `useChatStream`：移植 chat.html 的 `consumeSSEStream` + `parseSSE`
- [x] 会话切换：侧栏点击 → 加载历史 → 切换 conversation_id
- [x] 错误处理：网络错误 / 后端 500 / SSE error 事件统一展示（解析 JSON 错误响应）
- [x] 前端请求带 `Authorization: Bearer <key>`（P3.4 兼容）：实际未实现 header 构造，留待上云前补
- [x] 前端逻辑层测试基建（Claude，Vitest 31/31 全绿，零 Tauri 依赖）：`client/tests/` 下 `api` / `useChatStream` / `toolCallCard` / `chatInput` 四个测试文件，覆盖错误体解析 + SSE 解析 + 组件状态机
- 已知项：错误响应 `error` 类型名当前被 `detail` 覆盖（如 `NOT_FOUND` 不直接显示），是否展示类型名待产品裁定（非缺陷，属信息展示选择）
- [ ] **前端集成层测试（遗留待补）**：会话切换加载 / 角色切换传参的集成测试（mock RouterView + store 联动）。已于 2026-08-20 移出归 TODO「工程债务」待补，不阻塞 P4 完结（功能闭环已达成）

**P4.6 - P3.5 遗留增强：异常出口统一** ✅（Trae 实现 / Claude 更新测试 / WorkBuddy 复验 ✅）

- [x] `main.py` 新增 `@app.exception_handler(Exception)` 兜底 handler：server 端记完整 traceback，客户端返回 `{error: "INTERNAL_ERROR", detail: "Internal server error"}`（不泄漏内部信息）
- [x] 测试：非 LarryException 未预期异常 → JSON 格式（非 Starlette 纯文本 500）
- [x] Claude 同步更新 `test_exceptions.py::TestUnexpectedException` 断言（body 从纯文本变 JSON，Claude 自己的文件自己改）

---

### 功能增强（P4 之后）

**归档系统：会话归档 + 记忆归档 两层合一** ✅（2026-08-27，WB 设计 / Trae 实现 / Claude 测试 / WB 复验）

> 原 P4 定案"归档入口不做"，本次补齐：把"会话软隐藏（is_archived）"与"记忆提取入库"合成显式「归档」动作，落地"越来越懂你"主线——用户显式归档时逐条把关记忆价值。

- [x] 会话 `⋮` 菜单加「归档」→ 确认弹窗(取消/归档/删除) → 归档触发记忆提取 → 可编辑摘要面板(确认存入/仅归档/取消)；确认存入=写记忆+标记归档，仅归档=只标记归档(记忆可弃)
- [x] 后端：schema `deleted_at` 列 + 启动 ALTER 迁移；会话侧 archive/unarchive/trash(软删)/restore/purge + `DELETE` 语义改软删；`list_conversations` 过滤 archived/trash
- [x] 记忆可再提取：放宽 `archiver.generate_summary` 对 `is_archived` 硬卡（仅 `deleted_at` 非空拒提），支持仅归档会话后再提取
- [x] 重复提取幂等（Marvis 评审纳入）：`confirm_and_store` 按 `source_conversation_id` 查重 → 命中覆盖更新(删旧向量重写)、未命中新建，防 unarchive→再归档复制重复记忆
- [x] P3.5 语义修复：回收站/无消息/不存在会话拒绝提取透传 4xx（`ValidationError(400)`/`ResourceNotFoundError(404)`），不再包 `LLMError→502`
- [x] 前端：api.ts 全套客户端函数；AppLayout.vue 菜单+弹窗+面板；ChatView.vue 列表过滤 `is_archived=0`；已归档/回收站 Vue 页面按约延后
- 测试：Claude `tests/test_archive.py`(11) + `test_conversations.py` 改写，后端 29 项全绿（隔离临时库 + mock LLM/ChromaDB，零真实 key）；WB 读码复验通过
- 提交：`43213e3`(实现) / `2db9130`(测试) / `ffa3683`(WB复验闭环) / `50ed895`(P3.5语义修复)

**UI/UX优化**

> 长期项目，已完成的优化项目酌情归档于此

- [x] **BUG（Claude 测出 · WB 读代码复验 2026-08-24 · ✅ 已修复闭环）会话重命名输入框自动聚焦失效**：根因 `AppLayout.vue` `ref="renameInput"` 落 v-for 作用域被 Vue3 收为数组 → `startRename` 的 `.focus()` 在数组上抛 `TypeError`，点重命名后不自动聚焦/全选。修复：v-for 内改函数 ref `:ref="(el) => (renameInput = el)"`（Trae commit `e2fbb74`）；Claude 移除测试兜底、45/45 全绿；WB 读代码复验通过（ref 已为单值绑定）。

**vector_store.enabled 开关贯通（召回 + 归档写入双路径）** ✅（2026-08-30，WB 发现+复验 / Trae 修召回 / Claude 测试 / WB 补修写入+终验）

> 来源：WB 用专用测试 key 实测 `--real-api` 时发现（稳定复现 2/2）：开关关闭后代码不看开关照跑 embedding + 建 ChromaDB 客户端，降级设计形同虚设；且 chroma 句柄不释放，正常退出也残留含 key 临时目录（原"仅强杀才残留"说法同轮证伪）。

- [x] **召回路径**（Trae `b382b22`）：`memory/engine.py::get_long_term_memory` 入口加 `if not get_config().vector_store.enabled: return []`，与 `api/memory.py:136` 写法一致；engine 层拦截覆盖全部调用方（召回路径仅 chat_service.py:142 一处）
- [x] **行为测试**（Claude `45a0625`，3 项）：enabled=false → spy 断言零触碰 embed/search；enabled=true → 正常召回返回记忆；检索异常 → 降级 [] 不中断
- [x] **归档写入路径**（WB 补修，复验时同语义调用方扫描发现）：`memory/archiver.py::confirm_and_store` 同样不判开关——enabled=false 时手动归档仍跑 `embed_batch` + 建 ChromaDB 客户端。修复：开关关闭时跳过向量三件套（删旧向量/向量化/写入），SQLite 记忆记录 + 会话归档标记照常（与 api/memory.py 删记忆守卫语义对齐）；配套 `tests/test_archiver_switch.py`（2 项 spy 断言）
- [x] **WB 复验**：代码逐行核对 + 全套亲跑 `2 failed / 155 passed / 3 skipped`（基线 +5 新增，2 failed 均为已知存量债务）+ `--real-api` 终验 `3 passed`、key 零泄漏、config.yaml 字节级还原、`larry_test_*` 残留 0（修复前 2/2 残留，此为验收标准第 4 条铁证）
- 提交：`b382b22`（召回修复）/ `45a0625`（行为测试）/ `c19cbe1`（交付说明）/ 收尾本轮提交（写入路径修复 + 归档）

**前端角色清单改为后端下发** ✅（2026-09-03，WB 派发 / Trae 实现 / Claude 测试 / WB 复验）

> 背景：前端硬编码角色清单（RoleSelector + app.ts 各一份 `type Role` 联合类型 + tokens.css `--role-*` 三变量），与后端 config.yaml roles 段双份靠人工同步；已脱节实锤——本地 config 有 code 角色、前端选不到。

- [x] **后端**（Trae `8946d97`）：新建 `api/roles.py` `GET /api/roles` → `[{key,label,color}]`（顺序=config 书写序，label/color 缺省兜底 label→key / color→#9CA3AF）；`main.py` include_router；`config.example.yaml` 补全 4 角色 + label/color
- [x] **前端动态化**（8 文件）：`type Role` 联合类型 → `string`；`listRoles()` + `fetchRoles()`（失败兜底 FALLBACK_ROLES）；RoleSelector 从 store 读动态列表；三处颜色引用（AppLayout/MessageList/ToolCallCard）`var(--role-*)` → `currentRoleInfo.color` hex 直用；tokens.css 删 `--role-*` 三变量；ChatView onMounted 拉取
- [x] **测试**（Claude `0e10537`）：后端 `test_roles_api.py` 5 项（清单顺序/缺省兜底/缺 default/空 roles/鉴权透传）+ 前端 `roles.test.ts` 13 项（listRoles/store 兜底/RoleSelector 动态渲染）
- [x] **WB 复验**：代码逐行核对（4 验收标准全坐实）+ 后端全套 `2f/160p/3s`（基线 155+5 新增，2 failed 均已知存量：chromadb mock / windows_dir 编码）+ 前端 `58/58` 全绿 + `vue-tsc --noEmit` 通过（Claude 仅 grep，WB 实跑类型检查）
- **遗留（不阻塞验收）**：本地 `config.yaml` roles 段实为 5 角色（default/code/health/finance/science，science 为老大新增）且均无 label/color → 前端显示英文 key + 灰色兜底；补 label/color 由老大决定
- 提交：`8946d97`（实现）/ `0e10537`（测试）/ `fe8372d`（交付说明）

**测试层完善（测试环境修复 + 集成测试层恢复）** ✅（2026-08-30 启动，2026-09-03 闭环；老大拍板合并派发 Claude，WB 复验）

> 老大 2026-08-30 拍板：测试环境修复（pytest-asyncio 不兼容）+ 集成测试层恢复合并派发 Claude。原派发规格原载交流区 `log-claude.md`（**该日志内容此后已轮换，不可再查**）。

- [x] **合并任务**（Claude `0e8d52a`）：① 修复 pytest 9.1.1 ↔ pytest-asyncio 1.4.0 不兼容（插件未加载）② 恢复 `test_integration_llm.py` 3 用例并改 assert/raise 去假绿 ③ `--real-api` marker + conftest 开关（默认跳过防误烧 key）④ 分层原则 + mock 覆盖清单写入 `.claude/CLAUDE.md`
- [x] **33 个失败事件循环污染评估**（`0e8d52a`）：实为跨文件事件循环污染——FastAPI TestClient 退出销毁当前线程事件循环，后续 sync 测试 `asyncio.get_event_loop()` 抛 RuntimeError，与 pytest-asyncio 无关；conftest `_ensure_event_loop` autouse fixture 重建循环修复，42 failed → 2 failed
- [x] **`--real-api` 注入路径实测**：老大授权专用测试 key，WB 亲跑 2 轮——对照组占位符 / 实验组真实 key，注入生效；3 用例 ~34s 通过，进程不再挂起（原 17.5min aiosqlite BUG 已修复）；config.yaml 跑后原样还原
- [x] **atexit 清理告警改 stderr 直写**（Claude `aa17ebe`）：`_cleanup_session_tmpdir` 3 处 `logger.*` → `print(file=sys.stderr)`（atexit 阶段 logging 句柄已关，原抛 ValueError 夹 traceback 噪音）；保留原告警文案（含 --real-api key 明文警示）
- [x] **conftest 键名判定改模式匹配**（Claude `aa17ebe`）：抽 `_is_secret_key(k)`，`_redact_keys`/`_inject_keys` 两处共用，覆盖未来新增 provider key；未用子串匹配（`llm.max_input_tokens` 安全）
- **WB 裁决（2026-08-30）**：冒烟频率 = 发版前 + 大改动后；Brave 真实搜索暂不纳入冒烟；`--real-api` 跑挂不阻塞交付（真实 API 不稳定属外部因素，该层定位"契约哨兵"）
- **最终基线（2026-09-03 WB 实测）**：`2 failed / 160 passed / 3 skipped`。2 failed = `test_chromadb_degradation`（mock 已不存在的 `archiver.get_db`）+ `test_windows_dir`（中文 Windows 编码断言），均为独立存量，已转「工程债务」待处理
- 提交：`0e8d52a`（合并任务 + 污染修复）/ `aa17ebe`（两处小修）/ `c3db75a`（交付说明）
**网络搜索能力（web_search + Tool 框架底座）** ✅（2026-08-20 逻辑层收口 / 2026-09-04 真机验收闭环，Trae 实现 / Claude 测试 / WB 复验 + 终验）

> 耗时约半月（2026-08-20 → 09-04），其中半月挂起非技术原因：Brave 绑卡需信用卡，老大为此申办万事达卡（制卡 → 邮寄 → 银行激活）。此类外部行政依赖与上云的域名备案同性质，均非代码可解——引以为记录，防后续误读为拖延。

- [x] **web_search Tool（Brave provider，可插拔）**：对话内 AI 自主发起搜索，实时性问题自动搜并整合，回答标注来源 URL；首版数据源用 Brave（$5/月信用 ≈1,000 次、需绑信用卡——额度口径 2026-09-04 老大实测校正，原记「2000 次/月免费层」有误，8-29 写稿时 QoderWork 亦先写错、老大当场纠正）；provider 封装可插拔，原「后续替换 SearXNG」方案已作废（2026-09-04），后续换 provider 待 `exchange/web-search-design.md` 讨论定案
- [x] **Tool 框架底座**：BaseTool 护栏基类（超时强制 + 错误归一 ToolError + 执行日志）；SSRF/caller 校验钩子；配置驱动启用；第三方挂载契约留接口
- [x] **安全边界**：目标 URL 内网拦截（SSRF）+ 硬性超时，不阻塞 SSE 流
- [x] **降级策略**：失败/限流 → 指数退避 → 降级为正常回答 + 「未能联网核实」提示，不报错不中断（**2026-09-04 真机实测通过**，见下条）
- [x] **前端展示**：复用 P4.4 ToolCallCard 展示搜索过程与来源
- [x] **真机端到端验收（2026-09-04，成功路径 + 降级路径双双实测通过）**：Brave key 已配置（WB 只读核验非占位 + enabled_tools 含 web_search）→ 老大前端实测能搜到（此前汇率/比特币查询正常）；**降级路径**老大关梯子复刻单边挂（LLM 国内通道照常、Brave 走梯子断供）→ 搜索连续超时 → AI 降级为正常回答（如实告知搜不到 + 建议替代渠道），对话全程不崩。附带验证：断网全场挂场景为伪命题（LLM 也没了无从降级），单边挂才是降级路径的真实触发面
- [x] **搜索服务归属标注（about 弹窗末行已添加"Web Search Powered by Brave"，2026-09-04 老大直接落地）**：Brave 现款「$5/月信用」在**条款上**以公开归属为条件（官方要求标注于 project's website / about pages）。先前拟「待 provider 选型定案再填、不写死 Brave 名」，最终老大决定直接写死——本地应用一行字，换 provider 也就改一个词
- **未随本段闭环（转出）**：本地计数器软上限**经核实不写**（Brave 后台自带 Usage limits / Spending Limit，平台侧硬限优于代码软限，逃熊不重复造）
- 提交：实现与测试见 2026-08-20 交付（Trae），逻辑层复验 WB 通过；口径校正与闭环 `795d1ed` / `9969e59` / `2a786d1` / `baaf41c`

---

### DSH-1 - 事实校准 ✅（2026-09-08）

> **DSH 迁移线（A-framework）第 1 阶段**。编号说明：**DSH 线用独立 `DSH-N` 序列，与 P0–P5 主线无关**，与决策稿 `docs/dsh/dsh-migration.md` §3.6 的阶段号一一对应。
> 背景 / 判定依据 / 后续阶段（DSH-2 ~ DSH-6）见 `docs/dsh/dsh-migration.md`；在飞待办见 `TODO.md`「DSH 迁移」区。

- [x] **DSH 主仓 packages/ 盘点**——本地实测锁定版顶层 **50 个包目录**（另有嵌套子包）。早期"54 个包"/"37 家族 / 72 嵌套包"口径均作废（前者为网页推断，后者为 config-catalog 配置项口径）
- [x] **AGENTS.md 阅读**（capability seam / session JSONL / LLM provider / 安全性声明）
- [x] **releases 阅读**（版本线 / 性能回退官宣 / 无 GA 时间表）
- [x] **第 0 项：Py SDK 一等 / 二等判定** ✅ 2026-09-08 终裁——三方并行实测（Trae / Claude 判一等、QoderWork 判二等）→ **判二等，老大确认 → 定 A-framework**。三份实测报告（`dsh-pysdk-probe*.md`）永久保留于 `docs/dsh/`；判定与证据见决策稿 §3.5

---

### DSH-2 - 代码形态 + 环境准备 ✅（2026-09-08 → 2026-09-11 整体归档）

> **DSH 迁移线（A-framework）第 2 阶段**，阶段号与决策稿 `docs/dsh/dsh-migration.md` §3.6 一一对应。
> **本段性质 = 冷历史快照**：只记结论 / 状态 / 转出项。**活跃权威仍留在 `docs/dsh/`**（不被本段覆盖）：环境规格表 / 8 项证据表 / 5 项退出条件 / 通信面定型（含 T1/T2/T3 触发线）见 `dsh-migration.md` §3.4 / §3.6；本机环境基线见 `docs/local-env.md` §4 / §6 / §8 / §9 / §10；上云结论见 `docs/production-env.md`。
> **原始独立报告均已"吸收再删"**（`dsh-form-probe-claude.md` / `dsh-b1-plugin-probe-trae.md` / `dsh-23-vue-tauri-connect-trae.md` / `dsh-24-vitest-isolation-claude.md`）——内容等价落位 `docs/dsh/`，交流区不留报告文件。

**子任务结论速览**

| 子任务 | 状态 | 结论 / 落位 |
|---|---|---|
| **2.0** 代码存在形态判定 | ✅ | **A 案成立**：独立仓库 + 构建 Cordis bundle 挂载，**不 fork**；8 项必需能力全可经公开挂载面获得，无一项需改上游 → 决策稿 §3.6（WB 复核机制 8/8 属实）。附带：`larry` profile 的 `patchReload` 实测为 **`live`** |
| **2.1** 配套 TS 工程 | ✅ | `harness/`（pnpm workspace）+ 包名前缀 `@larryagent/`；首个自做 Cordis 插件经 **B1 通道**挂载成功 → `docs/local-env.md` §8 |
| **2.2** 跑通官方 demo | ✅ | Windows 下 **npm 全局 `dsh@0.1.2-rc.1` 全部可用**（plugin add / `--dump-config` / `--help` / 完整会话 exit 0）；仅源码 `bin.ts` + tsx 入口会卡 → **默认走 npm 全局 `dsh`**。⚠️ 完整会话为交付方（Trae）证据，WB 未独立复跑 |
| **2.3** Vue/Tauri → DSH 连通 | ✅ | 经 sdk profile（stdio JSON-RPC + 官方 TS SDK）发消息并收真实回包。**能力边界结论**：上行事件面宽（19 类）/ 下行方法面窄（`initialize` · `session.prompt` · `shutdown`）→ 通信面定型输入 → 决策稿「sdk 面实测能力边界」 |
| **2.4** 测试隔离基建（Vitest） | ✅ | 详见下节（本段唯一保留全量详情者） |
| **2.5** 退出条件实测（5 项） | ✅ | **5/5 全通过**（2026-09-10），见下 |
| **2.6** 阶段收口复核 | ✅ | 上游最新已到 `0.1.5-rc.2`；**老大拍定不升基线** → 决策稿 §3.4 |

**DSH-2.5 五项退出条件（✅ 全通过 · 主验证环境 = CVM）**

1. `storage/` 外接 SQLite —— ✅ **可行**（`path` 可指任意绝对路径；反向哨兵证数据走 SQLite 非默认 json）→ `docs/production-env.md` §2 / §5。副产品：联合 RSS 峰值 **192MB**
2. `acp/` 契约稳定性 —— ✅ **通过**（`initialize` / `session.new` / `list` / `close` OK；`fork` / `load` / `delete` = `-32601`，对照 `resume` = `-32602` 证为方法缺失）
3. Windows 端 `ctx.sandbox` provider —— ✅ **可用**（三档哨兵 + fail-closed；`enforcement=partial`）。⚠️ 方言缺口三层须修 → 修复件 + 挂载范式落 `docs/local-env.md` §4 / §4.1 / §4.3
4. Vue/Tauri → sdk profile 连通 —— ✅ 真实回包 `PROBE-OK-2026`；四组对照判据矩阵 → `docs/local-env.md` §6
5. TS 跑通 `bge-small-zh` 本地 embedding，与 Python 侧漂移比对 —— ✅ **无需全量重嵌**（漂移 `2.2e-7`，cosine ≥ 0.9999999999）。硬前提：预处理须严格对齐（否则产生 0.77 级假漂移）

**DSH-2.6 收口复核（2026-09-11）**

- 锁定 `0.1.2-rc.1`（09-03）vs 上游最新 `0.1.5-rc.2`（09-10）——**7 天 2 个 rc**。
- **重跑形态测绘**：`packages/` 顶层目录 50 = 50；全仓 8,854 → 10,178 文件（+15%）；**8 项证据文件全在、机制签名 1:1 存续** → **A 案在 0.1.5-rc.2 上仍成立**。
- 0.1.5 破坏性清单（Session 格式 V2→V3 / 移除 `ctx.agent` / persona 前后缀拆分 / Web slot `conversation`→`main` 等）→ 决策稿 §3.4。
- **升级闸门未满足**（"性能回退修复"出处未找到 + 破坏性窗口未消化）→ **老大 2026-09-11 拍定：不升基线**（升级门槛太低会导致频繁升级适配）；DSH-3 写码按 `0.1.2-rc.1` API 走，升级当独立动作。

**转出项（未随本次归档闭环，仍须执行）**

- ① **沙箱方言修复件生产挂载落盘**（承 2.5③）→ DSH-3（见 `TODO.md` DSH-3 同名条；范式见 `docs/local-env.md` §4.3）
- ② **②「跨进程 resume 成功」定性**（原为 Trae 单方声明）→ DSH-3「首验 id collision 定性」
- ③ **parentId**：**已裁——按线性记**（2026-09-11，不采纳会话树结构）
- ④ 其余隐性欠账：Vue→Tauri IPC 自动化覆盖 = 老大定「后续推进中慢慢补」；⑤ 适用边界（量化 dtype / >512 token 截断 / 其他模型）= 归 DSH-4

**关键判据（可复用）**：判据必须取自真实运行时；「机制存在」≠「实现真的走这条路」（须正反两组 + 反向对照）；`patchReload` 不可跨 profile 外推（`larry` = live / `sdk` = startup）。

#### DSH-2.4 - 测试隔离基建（Vitest）✅（2026-09-09，Claude 实现 / WB 复验）

> **DSH 迁移线第 2 阶段（DSH-2）子任务 4**。原文为 Claude 交付报告 `exchange/dsh-24-vitest-isolation-claude.md`，2026-09-10 归档吸收至本区（交流区不留独立报告文件）。
> **本节为本任务唯一事实源**（TODO 侧已精简为一行状态指针）。保留：WB 复验结论 / 关键判据 / 原始输出（§2）/ 七原则对照表（§3）/ 可复跑步骤（§4）/ 踩坑清单 / 产物清单。
>
> **WB 复验结论（2026-09-09 独立实跑，未采信声明）**：① `pnpm test:isolated:sentinel` → **fail**，且失败原因正是白名单 throw；② `pnpm test:isolated` → **绿**；③ **R1 反向哨兵**：人为写 key 明文 → teardown **确实告警**（输出 `KEY RESIDUE` + `creds.txt` 路径）；④ **R2 反向哨兵**：`delete DSH_HOME` → **fail**（解析为 cwd 不在 tmpdir 下）；⑤ 真实库零触碰（`.dsh-home` mtime 停在 10:31、`larry.db` 停在 08-30）。
>
> **关键判据（可复用）**：首版是「**结论对、机制不存在**」——结论（真实库无残留）成立，但自检挂在 `process.on('exit')`，该钩子在 Vitest worker 下**不触发**（即便触发也是先删后扫）。→ **护栏类验收必须加反向哨兵：人为制造违规、看是否报警**；只查"结果达标"会放过从未运行的护栏。

- **返工背景**：原交付 `8796b0c` 经 WB 复验 → 硬验收 ①② 通过、③ 结论成立但**机制从未执行**（key 扫描挂在 worker 下不触发的 exit 钩子）。返工修复 R1/R2/R3 并补 2 组反向哨兵，提交 `fb30d77`
- **验收口径**：五条全部达成 —— ① fail-fast 真的会拦 ② 正常用例绿 ③ R1 反向哨兵（人为写 key 明文 → teardown 告警）④ R2 反向哨兵（`DSH_HOME` unset 被白名单拦）⑤ 真实库零触碰

**§2 三条硬验收原始输出**

```
# 硬验收 1 — fail-fast 真的会拦
 FAIL  tests/sentinel-failfast.test.ts > ... > 污染 DSH_HOME 指向真实库时应被隔离守卫拦截
Error: [test-isolation] FAIL: DSH_HOME 解析为 D:\Code\LarryAgent\.dsh-home，不在临时根 D:\Temp\Sys 下。
测试必须运行在临时 DSH_HOME 内——请勿覆盖 DSH_HOME 为真实路径或删除该环境变量。
（正常路径 tests/guard.test.ts 同文件全绿——护栏存在且不误伤）

# 硬验收 2 — 真实数据未被触碰
跑前 mtime: backend/data/larry.db 1788027498
跑后 mtime: backend/data/larry.db 1788027498   ← 未变
.dsh-home/sessions/ 子目录数：3（Trae DSH-2.x 产物，本次零新增）

# 硬验收 3（R1 反向哨兵）— 人为写 sk-abcdefghijklmnopqrstuvwxyz123456 到临时目录
[test-isolation] ⚠️ KEY RESIDUE: 临时目录残留疑似 key 明文（1 处）——可能 --real-api 模式泄漏，须人工检查: ...larry-test-VpPXZI
[test-isolation]   at ...larry-test-VpPXZI\simulated-leak\creds.txt
[test-isolation] global teardown 清理: ...larry-test-VpPXZI
（告警先于清理行 = 先扫后删顺序生效；干净路径 0 告警；真实 .dsh-home grep sk-{16,} 零命中）
```

**§3 七原则 Vitest 等价对照表**（参照物 `backend/tests/conftest.py`，平移原则不平移代码）

| # | Python 原则 | Vitest 等价实现 | 状态 |
|---|---|---|---|
| 1 | 会话级临时配置（真配置为基底只换持久化路径） | `isolated-setup.ts`：mkdtemp 临时 `DSH_HOME`（sessions/storages 全落临时）；**平移说明**：A-framework 下配置源是 profile 而非单一 yaml，本阶段隔离对象 = `DSH_HOME`（数据落点），配置基底平移推迟到 DSH-4 有真实 config 时 | ✅ 等价 |
| 2 | 环境变量时序（conftest 先于收集） | **setupFiles 先于测试文件静态 import**——已实测（时序探针：setupFiles 设的 env 在 import 时可见） | ✅ 实测确认 |
| 3 | key 一律占位符 | 基建不注入任何 key（DSH key 走环境变量，测试Key不受限制）；**key 残留自检在主进程 teardown 内、rmSync 之前**（R1 修复：原挂在 worker exit 钩子从未触发；先扫后删顺序写死，命中高警） | ✅ R1 |
| 4 | 密钥判定模式匹配（`endswith("_api_key")` 禁子串） | 平移说明：本阶段基建无密钥字段替换需求（不生成配置）；**该原则在 DSH-4 生成临时 config 时生效**——已记录为后续实现的硬约束（勿用 `"token" in k` 子串） | 📌 推迟生效（本阶段无配置生成） |
| 5 | 断言"行为"非"动作" | `assertIsolated()`：**正向白名单**——resolve(DSH_HOME) 必须位于临时根（tmpdir）之下（R2 修复：原"≠真实库"精确比对有 unset 盲区——resolve('')=cwd 被放行，而 unset 时 dsh 向上查找写仓库根 .dsh-home；白名单一次覆盖：指向真实库 / 位于真实库内 / unset 落 cwd） | ✅ R2 |
| 6 | `--real-api` 开关 | 平移说明：本阶段无真实 API 用例（无 LLM 测试）；开关语义在 DSH-6 接 e2e 时实现（默认跳过 + 显式开注入 key + 残留高警） | 📌 推迟（无真实 API 用例故无开关需求） |
| 7 | 清理失败告警不静默 | **globalSetup 返回 teardown 函数**（主进程，唯一可靠位）：先扫 key 残留（命中高警）后删全部 `larry-test-*`，删除失败打 stderr。（原 setupFiles 的 `process.on('exit')` 在 worker 下不触发——实测失效已移除） | ✅ |

**关键时序发现（原则 2 的实测答案）**：setupFiles 先于测试文件静态 import 执行（Vitest 保证）——等价 conftest 先于 pytest 收集。**但 `process.on('exit')` 清理钩子在 Vitest worker 下不触发**（线程/子进程模式差异），必须用 globalSetup 返回值做 teardown——这是 Python conftest 的 atexit 平移时**不成立**的一条，已用 globalSetup 兜底。

**§4 可复跑步骤**

```bash
cd harness
pnpm add -D vitest               # 已装
npx vitest run tests/guard.test.ts              # 正常路径：绿
npx vitest run tests/sentinel-failfast.test.ts  # 哨兵：红（护栏在）
npx vitest run tests/sentinel-unset.test.ts     # R2 反向哨兵：红（unset 被拦）
npx vitest run tests/sentinel-key-residue.test.ts # R1 反向哨兵：绿 + teardown 告警 KEY RESIDUE
# package.json 已加 test:isolated / test:isolated:sentinel
```

**§4 踩坑清单**

1. **Vitest 5 无 `globalTeardown` 配置项**——用 globalSetup 返回值 teardown 模式
2. **`process.on('exit')` 在 worker 下不触发**——清理钩子须放主进程（globalSetup teardown）
3. **`import.meta.dirname`** 可用（Node 20.11+），但哨兵文件里 `resolve` 等须显式 import（首版哨兵因漏 import 报 ReferenceError 而非守卫拦截——教训：哨兵自身也要先能跑）
4. vitest 临时目录前缀用 `larry-test-`（与 Python `larry_test_` 区分避免误清）

**§5 未解决的技术不确定性（当时陈述；现态：DSH-2.4 已收口，本节为本任务唯一事实源）**

1. **`.dsh-home` 向上查找机制已确认**（仓库根 .dsh-home/ 有 `--D-Code-LarryAgent-harness--` sessions 子目录 = Trae 从 harness 跑时写入的实证）——**但 DSH 内部如何定位（cwd 向上找 vs 其他）未读源码确认**；隔离基建以"强制 DSH_HOME"覆盖该机制，不依赖其内部行为，故不阻塞
   - 🟢 **数据落点结构（WB 2026-09-09 实测）**：未设 `DSH_HOME` 时默认落**仓库根 `.dsh-home/`**（已 gitignore），下有 `sessions/` `storages/` `profiles/` `.anonymous-user-id`；**`sessions/` 按 cwd 分子目录**。另有真实业务库 `backend/data/larry.db`（迁移时保留）
2. **setupFiles 的 env 是否覆盖所有 worker 并发场景**：多 worker 并行时每个 worker 独立跑 setupFiles（各自 mkdtemp 各自 DSH_HOME）——单 worker 已验证；多 worker 的目录隔离逻辑相同，但未用多 worker 实测（当前测试量小默认单 worker）
3. **哨兵测试的"污染窗口"**：哨兵在模块顶层污染 env → beforeEach 拦截。若未来业务代码在 **import 时** 就启动 DSH（比 beforeEach 更早），守卫需前移到模块加载级——当前守卫粒度（beforeEach）覆盖"测试执行前"，对"import 副作用"的保护需 DSH-6 引入真实业务模块时复核

**产物清单**（均在 `harness/` 内）

```
harness/vitest.config.ts                     # setupFiles + globalSetup 注册
harness/tests/isolated-setup.ts              # 隔离基建（临时 DSH_HOME + 守卫 + key 自检）
harness/tests/global-setup.ts                # teardown 兜底（R1: 先扫 key 后删目录，主进程）
harness/tests/guard.test.ts                  # 哨兵 1：隔离生效（绿）
harness/tests/sentinel-failfast.test.ts      # 哨兵 2：fail-fast（红=护栏在）
harness/tests/sentinel-unset.test.ts         # R2 反向哨兵：delete env 必须红
harness/tests/sentinel-key-residue.test.ts   # R1 反向哨兵：写 sk- 文件 teardown 告警
harness/package.json                         # 加 test:isolated 脚本
```

---

### DSH-3 - 核心能力 prototype ✅（2026-09-14 → 2026-09-22 · 已完成切片归档）

> **DSH 迁移线（A-framework）第 3 阶段**，阶段号与决策稿 `docs/dsh/dsh-migration.md` §3.6 一一对应。
> **本段性质 = 冷历史快照**：只记结论 ／ 复验 ／ 未闭合项处置 ／ 证据路径。**在飞切片（3.3–3.6 ／ 3.8 ／ 3.9 ／ 贯穿规则）不在本段** ⇒ 见 `TODO.md`「DSH 迁移」区。
> ⚠️ **坐标系说明**：本段正文里 `` `:N` `` 形式的引用 = **归档前 `TODO.md` 的行号**（快照的原坐标系，非本文件行号）。要定位请用 `git show <归档提交>^:TODO.md`；指向**代码 ／ 装置文件**的引用形如 `main.rs:274-291`，不受影响。
> **来源**：2026-09-22「TODO 初步精简」时由 `TODO.md` 逐字迁出（**迁出时正文零改动**）。

#### DSH-3.0 · 开工前置（CVM 环境 + 凭据 + real-api + 采数）✅ **全段已收口（2026-09-16）** ｜ DSH-3.0.5 已回报 · WB 复验通过（A 独立复现成功 ｜ B 已答：空壳与不完整 profile 不可分）｜ ✅ 原「1 条架构发现」已定性（09-16 二次上机 · 四组对照）：**非 DSH 缺陷 ⇒ 不立项**，真因 = `~/harness` 的 lockfile 被冻结在旧代际（跨代增量升级残留）⇒ 改记**行事规则「跨代升级须重算 lockfile」** ｜ ✅ **`~/harness` 已于 2026-09-16 修好并验收（WB 上机）**：012 物理目录 **215 → 0**、lockfile 全 015（`persistence` / `query` / `fs` 三处）；两个 home 的回退层经 heal 重建（`~/.dsh-015` 悬空 **74 → 0**、`~/.dsh` 余 24 且**修前既有**、全为 web 前端包）；`~/.dsh` 端到端 **8/8 绿**（D1 条件：不注入 env key）⇒ **修复未引入回归**。⚠️ 过程留痕 1 条：`-32603 cannot create effect on inactive context` **曾间歇出现、成因未知**（已排除「代际变化」「残留进程」两个假说），详见 `docs/dsh/dsh-migration.md` §3.6 ｜ ✅ **CVM 残留清理完成（2026-09-16）**：旧探针 3 件（landlock 正反对照 / node:sqlite 并发 / python 对照）**已回传入仓** `harness/scripts/cvm-probes/`（加 `cvm-` 前缀）、CVM 侧原件与 `~/dshprobe` 已删；家目录旧脚本 6 件（硬钉 `larry-dsh-home` 的改前版）＋ sqlite 测试库 5 件＋ 旧同步包 `larry-harness*` 已清；`~/.dsh` 余 **24 条悬空已定为当前事实（不阻塞、不根治）**，见 `docs/dsh/dsh-migration.md` §3.6

> **派发块 · 号 = 一份派发稿（2026-09-16 订正）**：**DSH-3.0.1（09-14 → Trae）已停止推进** —— A / B / C / F 四组照用（与 DSH 版本无关）；**D / E 归 DSH-3.0.3**（按 015 重做）；J1 装 profile 授权**作废**（命令钉死 `0.1.2-rc.1`）。**DSH-3.0.2（2.7.2 A-framework 契约实测）** 为插入项，已回报并经 WB 判「过」；其环境污点根因已并入本段 `:64-65` 前置。**DSH-3.0.3（装 profile + 重跑 D / E）已回报（09-16）⇒ 环境阻断**；老大裁定修复路两条都做 ⇒ **DSH-3.0.4（环境同代化修复 + 重跑 D / E）09-16 已发 Trae，当日回报「阶段 Ⅰ」**（任务 0 全层代际诊断 ✅ ／ 任务 1 隔离 015 环境 boot 验证 ✅，**未动 `~/.dsh`**）⇒ **阶段 Ⅱ 同日回报**：任务 2 ✅（**①＋④** CLI / 装置升 015 ＋ **③** 补 3 个可选 peer；**② fallback 层未动、待裁**）、任务 3 ✅ **D / E 两组三态判据全部成立** ⇒ **WB 已复验（主结论通过 · D1 证成 · 1 条订正）**（见 `:257`）。

- [x] ✅ **凭据落位**（2026-09-14）：CVM `~/.dsh/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY`（600 / 223 B，`records:` 段完好）
- [x] ⚠️ **环境核对**（2026-09-14，**同日订正**）：`dsh@0.1.2-rc.1` 双证（CLI + `package.json`）；node v22.22.2
  - ⛔ **原记"`~/.dsh/profiles/` 四个全在"是错的** —— 那是**数目录、没验依赖**。实测：`~/.dsh/profiles/sdk` 的 `dependencies` = **`{}`**、`node_modules/@deepseek-ai` = **0** ⇒ **空壳**；`larry` 有 7 包；**装齐的 profile 全在 `~/larry-dsh-home`**（sdk 101 / acp 100）
  - ⭐ **本机同一形态**（`.dsh-home/profiles/sdk` 99 包 / `~/.dsh/profiles/*` 空壳）⇒ **"凭据落一个 home、profile 落另一个 home"是系统性问题**，非 CVM 独有
  - ⇒ 纪律「CVM 以 `~/.dsh` 为准」**结论不变**（其理由本就含"裸跑默认"一条，与依赖无关），但**前提需补真**（见下）。
- [x] ✅ **同步本机 `harness/` → CVM**（Trae 2026-09-14）：**26 → 61 文件 / 566,393 → 753,485 B**，目标 `/home/ubuntu/harness/`；`SYNC-ANCHOR.txt` 已落（源 commit `57304ac` / `HEAD:harness` = `6c268877`；tar 145.6 KB / 55 条目、`scp` 1.11 s；`pnpm install` exit 0 / 18 s）
  - ✅ **卡 3.5 的那三个沙箱探针包已到位**（`plugin-sandbox-probe` / `plugin-sandbox-mount-probe` / `plugin-sandbox-dialect`）
  - ⚠️ CVM **原本无 pnpm / 无 corepack** ⇒ 已 `npm i -g pnpm@11.7.0`（3 s）
- [x] ✅ **装齐 CVM `~/.dsh/profiles/sdk`**（**归 DSH-3.0.3 → 续 DSH-3.0.4**；DSH-3.0.1 的 J1 授权**已作废** —— 那两条命令钉死 `0.1.2-rc.1`）：两条 `dsh plugin --profile sdk add`（`dsh-base` + `dsh-sdk-app` @ **`0.1.5-rc.2`**，**全程带 `DSH_HOME=$HOME/.dsh`**）
  - ✅ **已达成（DSH-3.0.4 执行 · WB 2026-09-16 上机独立复核）**：deps **恰 5 项** —— `dsh-base` ／ `dsh-sdk-app` ＋ 3 个可选 peer（`dsh-session-persistence` ／ `dsh-session-query` ／ `dsh-http-proxy`），**全 `0.1.5-rc.2`**；`node_modules/@deepseek-ai` **109 包**；CLI 亦 `0.1.5-rc.2` ⇒ **CLI ／ profile ／ 落点树三方同代**（`：65` 前置达成）。⚠️ 扫代际时勿把 `node-addon-system@0.1.2` 误判为残留（**非 `dsh-*` 体系**、与代际无关）
  - ⭐ **DSH-3.0.3 前置（2026-09-15 精确化，来自 DSH-3.0.2 的本机实测污点）**：先 `npm view @deepseek-ai/dsh versions` 确认有 `0.1.5-rc.2`，且 **CLI / hoisted 层与 profile 同代** —— 本机 `~/.dsh` 现为**跨版本混合体**（sdk 侧 105 包 @015 ｜ hoisted 根 214 包 @`0.1.2-rc.1` ｜ CLI 是 npm 全局 `0.1.2-rc.1` 经 Junction 进来）⇒ **三条 loader entry 装载失败 + `exit 1`**（`session-persistence-jsonl` / `session-query-sqlite` / `web-fetch-http`）。**015 上没有这个修**（上游 `0.1.6-alpha.1` 新增 `boot/app-boot/src/profile-resolution/` 正面修，PR `fix/profile-module-resolution`）⇒ **DSH-3.0.3 若按 015 原样重跑会重演**。规避：CLI 与 profile 同代装 015，**或**换干净 `DSH_HOME` 全量装 015。**⭐ 2026-09-16 实测：本条预言命中** —— Trae 按 015 原样重跑（CLI 仍 012）⇒ 三条 entry 重演、runtime 启动即崩。⚠️ 两条规避路当时**未同步进 DSH-3.0.3 派发稿**（派发稿只写「装前核代际、装后回核」，未写「不同代走哪条路」）⇒ 执行人只能现场推导（他独立推出了等价的 P2/P3）。**派发稿完整性教训：规格里的「前置不通过 ⇒ 走哪条路」必须一起承接。**
  - **这就是完整 composition**：本机 `.dsh-home/profiles/sdk` 的 deps 恰为这两项，`storage` / `session` 类包随传递装齐（`dsh-session-persistence-jsonl` / `dsh-session-query-sqlite` / `dsh-storage-json`）⇒ **无需**手工补 `storage-sqlite`
    - ⚠️ **2026-09-16 存疑（CVM 实测反例）**：`~/larry-dsh-home/profiles/sdk` 的 deps 是**四项** —— 上述两项 ＋ **`dsh-storage-sqlite`** ＋ **`@larryagent/plugin-storage-probe`(link)** ⇒「两项 = 完整」**未经 CVM 验证**，待核（可能与 `session-query-sqlite` entry 的装载相关）
      - ✅ **已核（2026-09-16 DSH-3.0.4 任务 2 / 3）：原判「两项 = 完整」实测不成立** —— 缺 **3 个「可选 peer」**（`dsh-session-persistence` / `dsh-session-query` / `dsh-http-proxy`）。它们在锁文件里是 `peerDependenciesMeta.optional: true`，而 profile 配 `autoInstallPeers: false` ⇒ pnpm 把 32 条列进 `transitivePeerDependencies` **并不安装** ⇒ 运行时回落 fallback 层（**这正是 DSH-3.0.3 崩的机制**）。⇒ **015 的完整 composition ＝ base ＋ sdk-app ＋ 这 3 个 peer**（⚠️ 若 fallback 层与 profile **同代**则可省）。旁证：dsh 对 `web-fetch-http` 那类另给 warning —— *"declares no dsh.bundle — installed as a plain dependency, not a profile layer"*
  - ⛔ **2026-09-16 实测（DSH-3.0.3 回报 + WB 复核）**：**装了但不足以 boot** —— deps 已非空（106 包），但 **`dsh-session-persistence` / `dsh-session-query` / `dsh-http-proxy` 三个可选 peer 未装**（profile 配 `autoInstallPeers: false`）⇒ Node 解析回落 hoisted 根（012）⇒ 导出名不符 / 包缺失 ⇒ `plugin tree failed to load`、`exit 1`。**根因 ＝ 跨代，不是漏装**（反证：`~/larry-dsh-home` 同样缺这 5 包、但**同代** ⇒ 不崩）。另缺 `dsh-app-boot` / `dsh-scope`，**未致败**（**缺 ≠ 致败**）
    - ⭐ **WB 补充：跨代是「三方」，CLI 侧也在关键路径上** —— D 组崩栈首行 = `harness/…/dsh-sdk-protocol@0.1.2-rc.1`、rt-real boot 栈首行 = `harness/…/dsh-app-boot@0.1.2-rc.1` ⇒ **boot 器与装置侧协议库都是 012** ⇒ 评估修复路时须把 CLI 层纳入（P1 / P2 只动 profile 侧）
  - ⛔ ~~**`larry` 本次不动**：CVM `~/.dsh/profiles/larry` 现 composition（api-gateway + host-webserver）与本地（base + headless）**不同**，属 3.5/3.7 派发时单独定的事~~ ⇒ **〔2026-09-17 复核推翻：该面已退役并于同日真删（原备份名 `larry.RETIRED-20260917-1818`）；原判「有主」系照抄本行旧登记、未上机核 —— ⚠️ 本行曾是误判源头，勿再据它判断。详见 `docs/production-env.md` §12 附一之补〕**
  - ⛔ **软链方案不采纳**（两个 home 缠在一起 = 正是要消灭的重叠环境）
  - ⭐ **`~/larry-dsh-home` 降级为「负向对照器材」**：有完整 profile、**无凭据** ⇒ D 组"无 key 态"的理想对照（只变凭据一个变量）。**它不是运行 home**，拿它跑出"绿"即无 key 假绿（D2 已实证）
- [x] ✅ **凭据层验真（2026-09-14 查实后新增，本步最重要）** —— 证明 `~/.dsh/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY` **确实被读取且真用于调用**：用 `harness/scripts/dsh-prompt.mjs` **裸跑**（它**不覆盖 `DSH_HOME`** ⇒ 落 `~/.dsh`），三态 = 真 key（**不注入** env）/ 无 key（`DSH_HOME=~/larry-dsh-home`：有 profile、无凭据）/ 错 key（隔离 home + 伪造值 + 600）；判据 = **三态互不相同** + 每态记 `(DSH_HOME, profile, 凭据来源层)` 三元组
  - ⚠️ **为什么必须新开这条路径**：`run-real-api.mjs` → vitest → `vitest.config.ts` 的 `setupFiles: ['tests/isolated-setup.ts']` **强制把 `DSH_HOME` 覆盖为临时目录**（该文件 `:31-33`）⇒ **real-api 读不到凭据文件**，其 key 只能来自 env（`tests/real-api.ts:28`）。⇒ `production-env.md` §12.5 原写"真生效待 3.0 real-api 复跑"**是错的，已订正**（该文档 §12.5 第三条订正）
  - ⚠️ **不得改动** `~/.dsh/.credentials.yaml`（负向两态一律用隔离 home 造）；回报只写键名 / 是否存在 / 长度
  - 🔴 **DSH-3.0.1 首次尝试 ⛔ 未闭合**（2026-09-14）：D1 ≡ D3（同为 `-32603 cannot create effect on inactive context`，**崩在启动期、不是鉴权**）、D2 exit 0 + stdout 全空（**无 key 假绿**）⇒ **三态不互异，判据不成立**。根因 = `~/.dsh/profiles/sdk` **空壳**（**与凭据无关**）⇒ **装齐后重跑，归 DSH-3.0.3**（DSH-3.0.1 的 J1 钉版授权已作废；规格与判据照用，只换版本）
  - ✅ **已达成（DSH-3.0.4 阶段 Ⅱ · 3.0.5 独立复现 · WB 复验）**：三态**互不相同** —— **D1** 真 key（`~/.dsh`，凭据文件 223 B / 600，值 35 字符非占位）→ `turn/end.kind=completed` ＋ 回复 12 B；**D2** 无 key（隔离 home）→ `errorCode=MISSING_CREDENTIAL`；**D3** 错 key（伪造 600）→ `errorCode=AUTH` ＋ `status=401`。⇒ **D1 首次证成「凭据文件层真被读取且真用于调用」**（两套装置全程 `delete env.DEEPSEEK_API_KEY` ⇒ 唯一变量 = 凭据文件）。每态三元组 `(DSH_HOME, profile, 凭据来源层)` 已记 —— 原始件 `D:\Code\_trae-cvm-evidence\304\004\d-codes.json` ／ 独立复现 `D:\Code\_claude-cvm-evidence\305\`
  - ⛔ **判据已被证不敏感的一件**（裁定 J2 采纳为口径）：`dsh --profile <p> --help` **不校验 profile 依赖**（三 home 全绿，1 s 内 exit 0）⇒ **不得**用于"profile 可用性"判定（与 `--dump-config` 同类假绿源 —— 后者只组配置树、不激活）
- [x] ✅ **real-api 在 CVM 侧复跑**（**归 DSH-3.0.3 → 续 DSH-3.0.4**：DSH-3.0.1 那轮是按 `0.1.2-rc.1` 跑的，结论**跨版本失效**，只留下"通道 / 环境自证"这一层效力）—— ⭐ **三态对照：无 key / 错 key / 真 key，同一脚本跑**，判据 = **三态表现互不相同**（⚠️ 无 key 态正是已证会假绿的那一态）
  - ✅ **Trae 2026-09-14 跑通三态**（互不相同 ✔）：**E1 不注入** → guard **显式失败**（"开关 `DSH_REAL_API=1` 但环境变量未提供"；有效 Key 用例 **5 ms 即抛 = 未发起调用**）/ **E2 错 key** → 走了 API、**AUTH·401** / **E3 真 key** → **OK**（`verdict=OK … turn/end.kind=completed`；`Tests 14 passed | 1 skipped`）。三态各 ~2 s（网络好，**未触发看门狗、无 124**）
  - ⚠️ **夹具声明**：`real-api.ts` 默认 profile 源是 `<repo>/.dsh-home/profiles`（**本机约定**），CVM 上不存在 ⇒ Trae 用 `DSH_REAL_API_PROFILE_HOME` 指到**唯一装好的** `~/larry-dsh-home/profiles`。**这是夹具来源、不是 home 决定** ⇒ 装齐后**重跑并把夹具改指 `~/.dsh/profiles`**
  - ✅ **已达成（DSH-3.0.4 阶段 Ⅱ）**：三态 = `e1` 无 key（exit 1，guard 显式失败）／ `e2` 错 key（exit 1，`AUTH·401`）／ `e3` 真 key（**exit 0** ＋ `Tests 14 passed | 1 skipped`）—— **三态互不相同**。**夹具已按 `：81` 改指 `~/.dsh/profiles`**（`e-summary.json` 的 `facts.profileHome` = `/home/ubuntu/.dsh/profiles`；`profileHomeSdkDeps` 5 项全 015）⇒ `：81` 的「装齐后改指」要求同时达成。原始件 `D:\Code\_trae-cvm-evidence\304\003\e-summary.json`。｜ **遗留**（老大 2026-09-16 裁**并入下一单**）：3.0.5 侧「丙样本干净重测」「E 组未走 vitest 夹具」（见 `：263`）
  - ⚠️ **本组只代表「环境变量层」**，**不得**用于宣称"CVM 凭据文件生效"
- [x] ✅ **顺手采数**（白捡的规格账；**老大 2026-09-14 拍：纳入 3.0 验收**，口径见 `docs/dsh/dsh-migration.md` §3.6〈采数口径〉）：cgroup v2 为主口径 + 免轮询三件（`memory.peak` / `memory.events` / `memory.pressure`）+ 带宽（记工具/目标/时段）
  - ✅ **已闭合（Trae 2026-09-15）**：`mem-sample-full.csv` = **240 点齐**，`2026-09-14T17:06:18 → 19:05:50+08:00`（30 s × 240 ≈ 2 h），**`oom_kill` 全程 0**；已回传本机 `D:\Code\_trae-cvm-evidence\`（仓库外）。采样器 = CVM `/home/ubuntu/trae-evidence/sampler.sh`
  - ⭐ **口径发现：`memory.peak` 是 cgroup 生命周期峰值、不是窗口峰值** —— WB 复核 CSV：峰值在 **17:07:18 由 30.8 MB 跳到 255.5 MB**（= E 组测试运行窗），此后**每行都停在 255.5 MB 再不回落**。⇒ ① 255 MB **有出处**（E 组 vitest/node），**非"原因未知"**；② **引用 `peak` 必须同时给 cgroup 起点 / boot 时间**，否则"这轮没吃紧"是假结论
  - ⚠️ **与 Claude 昨日读数（`peak≈1234 MB`）对不上**（本机 uptime 4d20h、`peak` 单调不减 ⇒ 今日 17:06 的 30.8 MB 不可能小于昨日值）⇒ 两种解释：① 两次读的**不是同一个 cgroup**；② user slice 在两次读之间被重建过（全登出即销毁）⇒ **并列留痕不合并**，待 Trae 写明取值路径
  - ⚠️ **采数窗口内冻结 CVM 其他活动**（2G 机器；OOM 会把曲线**断掉**、事后被误读成"内存稳定"）
  - ⚠️ 采样窗**受第三方会话干扰**（Trae 记 `pts/0` 14:01 起；**WB 17:26 实测该会话已不在**、机器空载 load 0.00）⇒ 曲线须标"受干扰"
  - 📊 带宽实测（17:06）：`registry.npmmirror.com` **784 KB/s**（2.27 MB / 2.90 s）/ `github.com` **121 KB/s**；工具 = 远端 curl 经 ssh
- [x] ✅ **执行说明就位**（Trae 2026-09-14 出）：`node` / `dsh` **都不在 PATH**（`export PATH=$HOME/node/bin:$PATH`）+ **四条范式实测通过**（PATH 前置 / 后台长任务 `setsid nohup` + 完成标记 + `rc` / 前台长任务 / 非阻塞轮询 30 s 精确）
  - ⚠️ **Trae 通道独有坑（他自记）**：内联引号 / `$VAR` / 反引号会被本地吃掉（本轮又踩 6 次）⇒ **命令一律走 base64 载体；本地文件操作用字面路径、不用变量**

- [x] 🔴 **前置件 1 — `--real-api` 等价物（真实调用断言机制）已就位**（Claude 提交 `0e2a7e9`；**WB 2026-09-10 独立复验通过**）—— ⭐ **为什么必须补**：文档 §3.6 原话「…须在 DSH-2 设计到位——**不提前设计，DSH-3 起每步验证都裸奔**」；**DSH-2.5 ④ 已实证：无 key 时 `exit 0` + session 建立 + 12 条事件，与成功完全一致** ⇒ S0 的验收口径（消息往返 / 事件落盘 / 回读）**每一项都能在假绿灯下通过**
  - 🟢 **WB 独立复验（真 Key 实跑，不采信声明）**：有效 Key → `verdict=OK assistant/message=1 turn/end.kind=completed` **3 s**（**绿灯是真的**）；错误 Key → `FAIL / error.code=AUTH / 401`（**红灯也是真的**）⇒ 两侧均复现，判据有效
  - ⚠️ **判据订正（2026-09-10）**：成功判据是 **`turn/end.reason.kind === 'completed'`**，**不是**「`turn/end.reason` 不存在」—— 后者是 WB 字段路径取错（`turn/end.data.reason`）写下的错误表述，**照字面实现会假红**。`docs/local-env.md` §6 已订正
  - ✅ **退回件已收口（2026-09-10 晚，WB 复验）**：原报「进程不退出**必现**」**撤回** —— 实测为**偶发**（Claude 独占 6 次 + WB 干净 1 次全部正常；WB 另 3 次复现，**均在其自己环境被污染的条件下**）。⚠️ **WB 原归因（"teardown 没跑"）是错的**，日志显示 teardown 跑了
  - 🟢 **根因已收窄**：复现日志证明**挂点在「teardown 跑完之后、vitest 主进程真正退出之前」**，且 **EXIT-NET 安全网（teardown 布防）全程未触发** ⇒ **实测印证了 Claude 的"两层互补"判断**：该层救不了，**只有入口脚本墙钟看门狗能兜住**
  - ✅ **防护已就位（Claude 交付，WB 判通过）**：① 启动期清扫过期残留（>2h）；② teardown 退出安全网（方案 A：真实退出码 + 诊断，**不因残留判红**——假红比没护栏更糟）；③ **入口脚本墙钟看门狗 20 分钟**（超时杀进程树 + exit 124，与测试失败的 1 区分）。CI 不会再挂死
  - 🔒 **收口裁定（老大 2026-09-10 拍板）：不验，按偶发收口。** 接受「偶发、根因未定位」，靠入口脚本 20 分钟墙钟看门狗兜住（**CI 不会再挂死**）。三个候选方向（本机 dsh 并发争 profile ／ Bash 管道 stdio 非 TTY ／ 进程组语义）**均不验** ⇒ **将来若在生产真撞到**（后端跑着 dsh 时并发跑测试 = 同一场景）→ **按当时现场重启这条线**，不预先投入
- [x] ✅ **S0 环境已拍（老大 2026-09-11）：CVM 单跑，本机对照省** —— 原三选一（① CVM（Linux，与生产形态一致，顺带回答"云上跑 DSH + 自做工具"这个上云核心未知）／② 本机 Windows／③ 双跑互为对照）**收窄为 ① 单跑**。理由：S0–S4 的判定标的全在 Linux 侧（`sandbox/` 判定环境 = Linux、生产形态 = Linux），S0 目的是"能力接入"而非跨 OS 兼容；**Windows 侧的差异数据不丢** —— 由「生产挂载落盘（Windows 方言修复件）」在同机复跑时天然覆盖，不另开对照跑
  - 🔴 **时间窗**：CVM 有效期至 **2026-10-09**（2026-09-09 起算）→ 到期前须把产出搬回本地/入库，**机器上任何产出不得是唯一副本**（`docs/production-env.md` §1 行事规则）
  - ✅ **开工第一卡点已解（2026-09-14）**：三环境三把专用 Key（`larry-dev` / `larry-wsl` / `larry-cvm`），**按环境分不按轨分**（同环境内 backend 与 DSH 填同一把）；CVM 那把已落位（见上「凭据落位」）

#### DSH-3.1 · S0 基础链路

- [x] ⭐ **`harness/packages/plugin-tool-readfile/`**（**首个"产品"插件**，此前 5 个 `packages/*` 全是探针）+ 可复跑 e2e 脚本 —— ✅ **已交付**（Trae 2026-09-17，提交 `713c103`）：插件本体（零外部 import ／ 注册走 `ctx.inject` 回调 ／ 标准 JSON Schema）＋ `tests/s0-e2e.test.ts`（四项判据 ＋ 四条负向对照，`S0_VARIANT` 开关）＋ `tests/s0-session-log.ts`（多帧 zstd 回读）＋ `scripts/run-s0-e2e.mjs` 一键复跑
- [x] 四项硬判据**同时**成立：① 消息往返 + **nonce 内容断言** ② plugin **确实被激活**（⭐ 以 boot 时 `activate` 打点为准；⚠️ **`--dump-config` 是假绿源**——只组配置树、不激活） ③ 真实回包非空 + `turn/end.reason.kind === 'completed'` ④ session 落盘 + **回读可查到同一 nonce** —— ✅ **WB 独立复跑（2026-09-17，CVM，非采信其日志）**：`base` 全绿（新 home `/tmp/larry-s0-olL5t5`、`1 passed`、exit 0；`①_toolNameInLog=["read_file"]`｜`② activate·inject-fired·tool-registered` 齐｜`turn/end.reason.kind=completed`｜`④_sessionContainsNonce=true`）；**四条负向对照**核其回传证据自洽（负向 1 里模型改用官方 `read` 仍读到 nonce ⇒ 反证环境存活）
- [x] ✅ **S0 通道已定（老大 2026-09-14）：走 `sdk`** —— 它走的就是 **B 段**（09-09 已定型 SDK/stdio），**非新开面**；前置件 1（`harness/tests/real-api.ts`）已用 `dsh-sdk-client` + `profile: 'sdk'` 且绿/红两侧经 WB 独立复验 ⇒ **零新增器材**；S0 四项判据在〈sdk 面实测能力边界〉逐条覆盖。理由与 ACP 用途的定位见 `docs/dsh/dsh-migration.md` §3.6〈通信面选型分析〉落定块
- [x] 📚 **参考件**（登记表 3.1 行）：`ref/community/kun2-5code__dsh-plugin-template` —— 插件脚手架（`dsh.bundle.patch` + `dsh.client` 清单形状、`service` / `hook` / `commands` 三个半边、**假 ctx 单测范式** `test/smoke.mjs`）；e2e 台可参照 ✅ 借鉴点已回填（事实表 5 / 8 / **9 / 10**，2026-09-17）｜ `iiwish/dsh-testkit`（Docker 隔离真宿主生命周期测试）/ `PerryLink/dsh-test-drive`（一次性 profile 冒烟）
- [x] 🧹 **清退代码内的 log 指针**（**3.1 顺带项**，WB 2026-09-17 发现；原则见 `exchange/README.md` 协作规则末条）：三处**均已失活**（`log-claude.md` 内容此后整体轮换）——① `harness/tests/global-setup.ts:75-77` 引「防挂死安全网」节 ⇒ **就地自足化**（把「方案 A：真实退出码 ＋ 诊断，不因残留判红——假红比没护栏更糟」的语义 ＋ 裁决日期写进注释本体；内容源 = `TODO:40`，原出处已消失）；② `harness/tests/global-setup.ts:127` 运行期输出串内嵌「见 exchange/log-claude.md 裁决记录」⇒ **删该括注**，其余不动；③ `backend/tests/test_integration_llm.py:48`「排查记录见 exchange/log-claude.md」⇒ **改指** `archive/report-2026-08-30.md`（该事故复盘的永久落点，内容在）。

- ✅ **3.1 复验发现 3 条 —— 均已处置（WB 2026-09-17，老大授权 WB 直接改）**：
  1. **构建链**（原判"复跑说明缺一步 `pnpm build`" —— **实情更重，已订正**）：`harness/package.json` 的 `build` 此前只 filter `plugin-probe` ⇒ **新插件与 `plugin-sandbox-probe` 都不在构建链内**（不是"说明漏写"，是脚本没跟上）。**已修**：`build` 改为 `pnpm --filter "./packages/*" --if-present run build`（本机实测：选中 7 项目、3 个有 build 的包全 Done、rc=0）；`run-s0-e2e.mjs` 补**构建前置检查** —— 缺被测包 `main` 指向的产物即报错退出 **2**（与"测试失败 1"／"看门狗 124"区分）。⚠️ 刻意**只检查、不自动 build**：自动构建会在被测环境造副作用，且与 `package.json` 的 build 入口形成两套逻辑 —— 不是遗漏。
  2. **负向对照 3 / 4 补"破坏动作生效"锚 —— 已补 ＋ CVM 实跑验证**：负向 3 加 `②_activated === true` ＋ `logPresent === false`；负向 4 加 `logPresent === true` ＋ `bytes > 0` ＋ `killedBy !== 'child-exited-first'`（为此把 `killClientRun` 改为返回结构化，另把 `④_killedBy` / `④_bytesAtKill` 落进证据）。**实跑**：两变体均 exit=0（`no-session-dir` 7s、`kill-client` 9s），实证 `killedBy=first-session-log-byte`、`bytesAtKill=636` → 终值 995 B（与 Trae 那次独立跑**同值**，变体行为稳定）。
     - 📌 顺带订正一条**过度声明**：负向 3 的真实破坏面**大于其名** —— 实测下 **③ 也红**（`turnEndKind=error` / `errorCode=UNKNOWN` / `finalResponse` 空）⇒ 只读 sessions 目录令 **session 创建即失败**，模型根本没被调到。已在该变体注释里写明"**别断言 ③ 必须绿**"（那是当下实现的副作用，非判据要求）。
  3. **`smoke.mjs` 用例 ② 写真实 home —— 已修**：改为临时把 `DSH_HOME` 指到临时目录（`finally` 还原），并把"缺省打点跟随 `DSH_HOME`"钉成断言。**本机实测**：`smoke ok`，且真实 `~/.dsh/plugin-tool-readfile.activate.log` 前后**完全未变**（3784 B / mtime 07:55:09）。

#### DSH-3.2 · 首验：跨进程 resume 的 id collision 定性

> ✅ **已收口（Trae 2026-09-17 交付 ／ WB 2026-09-17 复验）**｜场地 = **CVM 单环境**；**Windows 侧的锁子项已拆出** → **3.2.1（未派）**。
> **结论 = 真缺口（不是姿势问题）**：对**框架自产、已真 `completed` 并落盘**的会话，第二个进程复用同 ID **一样被拒**（`JsonRpcResponseError` / `code=-32603` / `session "<id>" already exists`）⇒ 缺口在 **runtime 的 session 物化路径**（`session/prompt` 对"日志已在盘上"的 id 走 **create**，而 jsonl 后端自己注明**该走 open**），**不在 SDK 的 API 面**（两套 SDK 的"指定 id"入口**都在**）。
> ⭐ **产品影响**：**跨进程 resume 在 015 上不可用** ⇒ `2.4.1` / `2.8.2` 的 fork / resume 叙事**必须改口径**（走「同进程内复用」—— 已证可用 —— 或「用 `sessionPersistence.load/inspect` 自建重放」）。
> **交付物** = 可复跑复现脚本（与 3.1 同族：一行复跑 ＋ 明确退出码）＋ 定性结论；退出码沿用 3.1 约定（`0` 通过 ／ `1` 测试失败 ／ `2` 前置缺失 ／ `124` 看门狗超时）。
> **本项要回答的一件事**：「固定 ID 撞车 ⇒ 换个 ID 就好」（**姿势问题**）与「同 ID 复用被系统性拒绝」（**真缺口**）**是两回事，且可能同时存在** —— 定论前不得只报其中一支。

- [x] ✅ **四变体装置已交付并跑通**（WB 复跑：CVM 4/4 exit 0；证据 `D:\Code\_trae-cvm-evidence\s0-resume*`）｜反向组（固定 ID 复现 `id collision`）+ 正向组（新 UUID）+ **关键组**（真实 completed 会话、跨进程复用同 ID）
- [x] ✅ **已答：两套 SDK 的「指定 session id」入口都在、都不叫 resume**（TS `dsh-sdk-client` `lib/types/api.d.ts:55/62/78-83`；Python `api.py:120-131`）⇒ 下述检索式/遍历范围要求已满足（详见 3.2 回报 §2）｜原项：grep SDK client 源码确认**是否存在显式 resume 入口** —— 若不存在，"SDK 不支持 resume"与"固定 ID 会 collision"是**两个独立的 bug**，可能同时存在。⚠️ **在 015 实物上核**（参考件锚在 harness master，签名可能漂）；⚠️ 说"没有"须附**检索式 ＋ 遍历范围**，否则不可验
- [x] ✅ **已照办**（骨架照 `run-s0-e2e.mjs` 抄；临时 home 建法 ＋ `listSessionLogs`/`readSessionLog` 复用）｜原要求：复用 3.1 产出的 nonce 会话，不另造（否则两处会话构造法会漂）—— 落实为：**复用 3.1 的会话构造法**（`harness/tests/s0-e2e.test.ts` ＋ `s0-session-log.ts` 的多帧 zstd 回读 ＋ 临时 home 建法）；⚠️ **不要求**复用 3.1 那次的**会话实体**（其 temp home 已随 3.1 收口清理，实体不在了）
- [x] ✅ **已答：A 锁全程无孤儿 ／ B 锁全程未现**（每轮 `close()` 走到真退出 ⇒ 租约由内核释放）⇒ **②/④ 的红灯与锁无关**｜原要求：判据须先区分"两把锁"（Trae 2026-09-15 提出，原意见稿已清；未裁则按此执行）——本任务靶子是 **015 的 session 写租约**（`session-persistence-jsonl/lease.ts`：POSIX `flock(2)` / Windows named semaphore，**进程死亡即由内核释放**、**故意不做 TTL 抢占**）；而系统里还有**另一把语义相反的锁** —— `$DSH_HOME/profiles/node_modules.lock`（`dsh-atomic-write`，profile 装/修复时持有），**持有者死亡后永不自动回收**（源码原文：*"the contender never removes an existing lock because file age cannot prove that its owner stopped; **orphan recovery is an operator action**"*）
  - ① 报告里凡"锁残留"**必须标是哪一把**（两把表现不同：A 锁 = 任何 dsh 命令启动即失败 `atomic-write: timed out waiting for the writer lock`，默认只等 2 s，**极易误判成"启动慢/网络问题"**；B 锁 = 第二个写者收 `SessionAlreadyOwnedError`）
  - ② 实验**前置须先清 A 锁的孤儿**，否则实验根本没跑起来，会得到"租约没生效"的**假阴性**
  - ③ **Windows 侧 named semaphore 的释放实测** → **已拆出为 3.2.1**（同判据体系、但换场地，故独立编号；**本段不跑**）
  - 📖 机制与实测：`docs/dsh/dsh-migration.md` §3.6（锁争用矩阵）、`docs/local-env.md`（本机锁原文与实测）
- 执行人：**Trae**（他此前判"改 UUID 后成功"，让他自己验自己的判据）
- ✅ 前置：我方 CVM 通道核查（见 3.0）—— **已通**（3.1 起即用）
- ✅ **参考件已落位（2026-09-17，WB 拉取）**：`ref/community/EvilIrving__dsh-repro`（MIT，浅克隆 HEAD `e51736ba`）—— **四要素（① 路径 ② 怎么参考 ③ 参考程度 ④ 不可参考）见 `docs/dsh/dsh-migration.md` §2.2.2 表，派发稿照抄**
- [x] 📚 **官方参考件**（登记表 3.2 行）：`dsh-session-persistence-sqlite` / `-jsonl` / `dsh-session-query-sqlite`（社区件见上条，**已落位**）

- ⚠️ **WB 复验 · 判据缺陷 1（登记待修）**：`s0-resume.test.ts` 的 `resumeTarget.p2LandedOnSameLog` **恒为 `null`｜`false`、永不可能是 `true`**（实现写死 `p2Log === null ? null : false`）⇒ **将来 resume 真修好时该字段会静默给 `null`（假阴性）**。修法 = 补一条 `hasP1 && hasP2` 的日志判定；⚠️ **改判据须实跑**。📮 **已并入 DSH-3.7.3 派发（2026-09-17 Trae）** —— 实跑场地写 **CVM**（3.2 的装置与结论都是 CVM 单环境 ⇒ 换场地即跨通道外推）；⚠️ 诚实边界：015 现状下该字段**仍不可观察到 `true`**，本项只证「实现不再排除 true ＋ 实跑取值与原始分布自洽」
- ⚠️ **Trae 报的 4 条未闭合（并入后续，不单开任务）**：① 抛错点二选一（`dsh-session` 的 `prepare` vs `dsh-session-persistence` 的 `SessionAlreadyExistsError`，**文案完全相同**）→ 并入 3.3/3.6 插桩位顺手取；② `-32603` 映射点未定位 → 记入「包归属待核」；③ **012 那版文案（`(id collision)` 尾巴）不可在 015 复核**（SEA 快照）⇒ 结论只按 015 记；④ **Python 侧未真跑**（只做源码侧）⇒ 两通道是否一致未验

#### DSH-3.2.1 · 锁子项：Windows 侧 named semaphore 的内核释放实测 ✅ **已回报并复验（Trae 2026-09-17 交付 ／ WB 2026-09-17 逐条回源复核：结论认可，另订正 3 处）**

> **为什么单列**：与 3.2 同属"锁"判据体系，但**换场地**（本机 Windows，非 CVM）⇒ 独立编号、独立跑。**等 3.2 的锁归属结论出来再起跑**（若 3.2 实测显示租约机制与其自述不符，本项的问法要跟着改）。

- [x] ✅ **`taskkill /F` 杀进程后，named semaphore 是否真被内核释放 —— 结论：自述属实（WB 独立复跑 16/16 ＋ 独立方法复核）** —— 这是"**自述 vs 实测**"的分界点：015 的 `session-persistence-jsonl/lease.ts` 自述"进程死亡即由内核释放、故意不做 TTL 抢占"，Windows 侧走 named semaphore，**该自述在 Windows 上从未被实测**
- [x] ✅ 判据须**双锚**（**两锚均成立**）：既验"首写者死后第二个写者能拿到"（= 真释放了），**也**验"首写者活着时第二个写者被拒"（`SessionAlreadyOwnedError`，= 租约**真的在起作用**而非根本没生效）—— 缺后锚则"释放"与"锁压根没生效"不可区分
- ⚠️ 场地：本机 Windows（**WSL 在 DSH-3 期间不参与**，见贯穿规则）；依据 `docs/dsh/dsh-migration.md` §3.6「锁争用矩阵」＋ `docs/local-env.md` 的本机锁原文与实测
- 执行人：**Trae**

> ✅ **WB 复核（2026-09-17 · 逐条回源）＝ 结论认可：自述属实**（范围 = 本机同登录会话内跨进程）。
> - 取证要点（**全部 WB 独立取**）：① **WB 隔离复跑装置**（`DS321_EVIDENCE_DIR` 指临时目录、未覆盖交付证据）⇒ **16/16 全过、`exit 0`**；② **行号锚逐行核对全部正确**（`:474-481` ／ `:497` ／ `:555-564` ／ `:571-576` ／ `:612-630` 自述段 ／ `:313` ／ `:665-711` ／ `:677` ／ `:723-727` ／ README `:158` 中英），含执行方自曝的两处订正（**他订得对**）；③ 5 个基线锚起跑/收尾全对、`harness/**` 零改动、临时工作区已清。
> - ⭐ **WB 加做一条独立方法复核（原装置没有）**：改用 **`OpenSemaphoreW`（只打开、不创建）**，在**真 holder 跨进程持有期**测 —— `Open(Local)` 句柄非 0 且 `wait = 258`（摸到真锁对象）／同一时刻 `Open(Global)` = **0**（Global 下无该对象）；`taskkill` 后 `Open(Local)` = **0** ⇒ **内核随进程死亡销毁对象**，**独立佐证 J2 负锚**。两条 node 通道（`22.22.2` ／ `24.14.1`）结果逐项一致。
> - 🔻 **订正 1（他的自加判据取证无效；非派发判据）**：`321-lease-child.mjs:192` 的 `raw` 探针用 `CreateSemaphoreW(null,1,1,name)` ＝ **创建或打开** ⇒ 名字不存在时**新建**（`initialCount=1`）⇒ 他对 `Global\` 观测到的 `wait=0` 是**自建对象的必然结果**，**不能**证"另一名字空间存在对象"。WB 直击实验：同进程同名字两次 `Create(Global)` ⇒ 第一次 `wait=0`、第二次 `wait=258` ⇒ 该 0 完全由"本进程是否建过"决定；用**正确测法**（`OpenSemaphoreW` ＋ 正对照 `Open(Local)`≠0）得**更强的形式**：**Global 下压根没有对象**（而非"另一个空闲对象"）。⇒ 方向对、**取证方法须订正**；`docs/dsh/dsh-migration.md` 第 12 条**未受影响**（该条只写"按登录会话隔离（README 自述）＋ 跨会话未实测"，表述是准的）。
> - 🔻 **订正 2（证据原文层；成因未定 ⇒ 不下"造假"结论）**：本机实测 `taskkill` 成功输出**恒为 GBK 中文**（原始字节 `b3c9b9a6…` ＝ `成功: 已终止 PID 为 …`；`tasklist` 无匹配 ＝ `信息: 没有运行的任务匹配指定标准。`；`GetACP=936` ／ `GetConsoleOutputCP=936` ／ `UI=0x804`），而装置的 `spawnSync(…,{encoding:'utf8'})` 读它**必得乱码**（WB 复跑亲测）。但交付证据 `J2-taskkill-A/C.txt` ／ `J7-tasklist-after-kill.txt`（及聚合它们的 `J2-kill-A.json` ／ `summary.json`）里是**英文** ⇒ **与该装置在本机的必然产物不符**；另 `J7J6-preflight.txt` 带 **UTF-8 BOM**（装置 `save()` 不写 BOM ⇒ 手工产物）。⇒ **这批件的"原文"不可采信**（**结论不受影响** —— WB 已自跑 ＋ 独立方法复核）；成因**未定**（文本被润色 ／ 换了环境 ／ 其他，**不排他**）。
> - 🔻 **订正 3（小）**：回报引的 J1 第二写者 `pid=32724`，落盘证据为 `45524`（疑两次 `open-try` 覆盖）⇒ 不影响结论。
> - ⚠️ **未闭合（转出项，不阻断本项收口）**：① **跨交互登录会话的互斥性未实测**（本机只有 `console` 一个交互会话；`Local\` 前缀按 Win32 语义是会话本地 ⇒ **机制推断、非实测**，⛔ 不得声称"多用户 Windows 下也安全"）；② **B 锁的 TTL ／ 抢占 ／ 并发正确性不测**（自述明说 deliberately no expiry ⇒ 本项只证"死亡即释放"）；③ **POSIX `flock(2)` 侧未做**（不得用本项结论覆盖）；④ **证据原文层缺口待执行方说明**（订正 2）。

#### DSH-3.7 · 生产挂载落盘（Windows 方言修复件）

> **本段分三块（2026-09-17 拆）**：**3.7.1 前置就位与定性**（✅ 已回报＋复验）→ **3.7.2 落盘 ＋ 自检 ＋ 真 e2e**（✅ 已回报＋复验，J1–J7 全成立）→ **3.7.3 工程卫生合并块**（✅ **已回报＋复验（Trae 2026-09-17 交付 ／ WB 2026-09-17 逐条回源复核：J1–J11 全成立）**，由 3.7.2 未闭合项转出 ＋ 3.2 判据缺陷合并）→ **3.7.3-T 独立测试件**（✅ **已回报＋复验**，判定均成立，另暴露 `dsh plugin add` 存量问题）。
> **为什么拆**：原规格把"前提已就绪"当前提，而 2026-09-17 WB 实测**三项前提实为缺项**（见 3.7.1）；且 `EPERM` 归因本身**结果开放**（可能反推落盘人结论）⇒ **先定性、再落盘**，避免"落点对了却没生效"。范式 / 自检口径 / 已证未证边界见 `docs/local-env.md` §4.3（**原 DSH-2.5 ③ 收口欠账 1**）。

##### DSH-3.7.1 · 前置就位与定性 ✅ **已回报（Trae 2026-09-17）· WB 复验：① ③ 成立、② 的判据被推翻**

> 本块**不写 patch、不跑 e2e**（那是 3.7.2）；只把前提清干净 ＋ 把 `EPERM` 归因定性。

- [x] ✅ **① 已答：归因不成立**（他自己的通道 ＋ 正对照 `C:\Windows`；4/4 可写、09-14 那条命令两处都不复现；**没有为不存在的现象编主体** —— 正确姿势）｜原项：`EPERM` 归因定性（必须用他自己的通道复跑） —— 判据**要钉主体**：同一条拒绝，出自 **AI 工具沙箱** 还是 **DSH 自身沙箱**，归属与严重性**完全不同**（09-12 已有一次同类"主体错位"）。须给**触发命令原文 ＋ 完整错误对象（`code` / `errno` / 栈帧里的模块路径）**，并**指出抛出者是谁**。
  - ⚠️ **两处各测一次**：`~/.dsh/profiles/…`（09-14 那条记录的现场）与**工程 `.dsh-home/profiles/larry/…`**（**当时的落点**；⚠️ 该面已于 2026-09-17 退役）⇒ 判"哪个能写、不能的那个是谁拦的"
  - ⚠️ 结论**只写在实测过的那条通道上、不得跨通道外推**（WB 通道能写 ≠ Trae 能写，反之亦然）
  - ⚠️ 写探针只允许"**建一个探针文件后立即删除**"；**不得改动现存任何文件**（全局 home 的 profile 勿动）
- [x] ⚠️ **② 实体安装属实、但「判据成立」被 WB 复验推翻**（详见下方 WB 复验）｜原项：方言插件实体安装（工程 home） —— 现状（WB 2026-09-17 实测）：**挂载点不存在** —— `.dsh-home/profiles/node_modules/@larryagent/` **无该目录**（`~/.dsh` 侧那份是**全局 home**、不是本项落点）
  - 目标：`工程 .dsh-home/profiles/node_modules/@larryagent/plugin-sandbox-dialect/`（范式原文 `docs/local-env.md` §4.3「插件怎么进 profile」）
  - **源 = 仓库 `harness/packages/plugin-sandbox-dialect/`**（`index.js` ＋ `package.json`）；⚠️ **必须实体复制、不得 link**（link 下 bare import 从源目录解析 ⇒ **取不到** `@deepseek-ai/dsh-sandbox-local`）
  - ⚠️ **不得从全局 home 那份拷**：`~/.dsh/profiles/node_modules/@larryagent/plugin-sandbox-dialect/` 那份**功能码与源逐行一致、但注释头是旧版**（2962 B vs 源 4087 B）⇒ 以仓库源为准
  - ❌ **判据本身不成立（WB 2026-09-17 复验推翻）**：`import()` **落点那份插件 失败** —— `SyntaxError: The requested module '@deepseek-ai/dsh-llm' does not provide an export named 'assertNever'`，**与 Trae 归给"link 对照"的红灯是同一条**。⇒ **真正分界不是"实体 vs link"，而是"依赖绑到哪一代"**。WB 四组实测：**A 全局 home 落点 = OK ／ B 工程落点（实体）= FAIL ／ C 直接 import `sandbox-local@0.1.5-rc.2` = OK ／ D 直接 import `sandbox-local@0.0.1-rc.1` = FAIL**（A 绿 ⇒ 判据在健康对象上会绿，排除探针自身故障）
  - ⭐ **根因（WB 追溯）**：`harness/packages/plugin-sandbox-dialect/package.json` 的 `peerDependencies: {"@deepseek-ai/dsh-sandbox-local": "*"}` ⇒ pnpm 解析到 npm latest 那支 **`0.0.1-rc.1`**（DSH 0.0.1 时代的包），而同一棵树里 `dsh-llm` 是 **`0.1.5-rc.2`** ⇒ **跨代混装 ⇒ 加载即崩**。**引入点 = `a974258`（本机升 015 时 lockfile 重算），非本轮任何改动**
  - ⛔ **这是 3.7.2 的硬前置**：修法 = 把该 peer 从 `*` 改为显式 `0.1.5-rc.2`（或 `^0.1.5-rc.2`）＋ 重算 lock ／ 重装落点 ＋ **实跑验证**（改依赖树必须实跑，不得只凭推理）。⚠️ lockfile 属**双面同步范围**（本机 ↔ CVM）⇒ 改动须同步
  - ✅ **junction 归属订正（WB 实测）**：工程 `.dsh-home/profiles/node_modules/@deepseek-ai/` 的 **241 条 junction 全部指向 `harness/node_modules/.pnpm/…`（本工程）**，**无一条指向全局 npm** ⇒ Trae §3.1① 的「依赖实际解析到全局 npm 的 dsh 自带依赖」是**取错了观测对象**（那是**全局 home** 的机制 —— 全局 home 的 junction 才指 `%APPDATA%\npm\…`）。⚠️ 但他**另一条是对的**：他所读那份包与工程指向那份**同版本同字节**（`dsh-session` / `-persistence` / `-jsonl` / `dsh-llm` 四处 sha256 全同）⇒ **他的 §6 源码行号结论不受影响**
- [x] ✅ **③ 已答：实际凭据层 = 启动环境变量**（两态互异：无 key ⇒ `MISSING_CREDENTIAL`；env 注入 ⇒ `completed`）；**该层就是 client 会走的那层**（`main.rs:274-291` 只设 `DSH_HOME`、不设 key ⇒ 由 Tauri 启动环境带入）。⚠️ **遗留**：B 态 key 取自 `backend/config.yaml`、**不是 client 的真实取值路径**（"谁往 Tauri 启动环境放 key"未找到代码路径）⇒ Trae 已如实标为待核｜原项：凭据路径打通（在工程 `.dsh-home` 上跑通一次真 prompt） —— 现状：`.dsh-home` **无 `.credentials.yaml`**；而 `client/src-tauri/src/main.rs:275-276` 注释写"凭据**继承本进程 env**（由启动环境注入）"、`docs/production-env.md` §12.5 表把该文件标"**可选**"、本段的「配套三件①」却写"**须建**" ⇒ ⚠️ **三处口径不一致，以实测为准**（这不是笔误，是三种说法并存，须落下一条实测结论）
  - **交付** = 在工程 `.dsh-home` 上跑通一次真 prompt，并**写明实际走的是哪一层**（启动环境 ／ 存储文件 ／ 项目 `.env` ／ 主目录 `.env`）＋ **该层是否就是 client 路径会走的那层**
    - ⚠️ **落点 profile = `larry`，但 `harness/scripts/dsh-prompt.mjs:25` 硬钉 `profile: 'sdk'`** ⇒ **别把「`sdk` 通了」当成「`larry` 通了」**；本块只要求验掉"凭据层通不通"，**但回报须写明跑的是哪个 profile**（3.7.2 需要能指 `larry` 的入口）。⚠️ **2026-09-17 修订**：`larry` 面**已退役** ⇒ 落点改 `sdk`（见 3.7.2 硬前置 2）
  - 🔴 key 值**不得**落任何受版本控制的文件 / 日志 / 工具输出；手工复验命令模板与 `pwd -W` 那个坑见本节「落点已定」条
- [x] ⭐ **④ 附带硬发现（WB 复核属实）：落点 `larry` 根本不是 SDK 面** —— `larry` = `dsh-base` ＋ `dsh-headless`（CLI 面，要位置参数当 task）；`sdk` = `dsh-base` ＋ `dsh-sdk-app`（stdio JSON-RPC）⇒ **"落盘在 larry"与"client 实际跑的 sdk"不是同一条通道**，⇒ **3.7.2 起跑前须在三条里选一条**：① 给 `larry` 加 `dsh-sdk-app`（改该 profile 依赖）② 把落点改到 `sdk` ③ e2e 改用 CLI 直跑 `dsh --profile larry "…"`（**非 SDK 通道，须单独声明**）
  - ⛔ **已裁（老大 2026-09-17）＝ ②**：落点改 `sdk`，且**把 `larry` 面一并退役**（工程 `.dsh-home/profiles/larry` ＋ 全局空壳 `~/.dsh/profiles/larry` 均已重命名备份；⚠️ **CVM 那份上轮判「不动」，2026-09-17 复核后改为一并退役** —— 原判「有主」系抄旧登记未核实，实测 = 012 代跨代残留 ＋ 零引用 ＋ 停 11 天，详见 `docs/production-env.md` §12 附一之补）。**理由**：该面不接生产通道（`dsh-prompt.mjs:25` 硬钉 `sdk`）；且其"零成本冒烟"价值**不是独有** —— 实测 `dsh --profile sdk --dump-config` 同样 `rc=0` / 不需 key / 0.5s。⚠️ **另订正一条**：`larry` 面里挂的是 **`plugin-probe`，不是方言件** ⇒ 它**当不了方言件的正对照**（方言件单独落在已被证坏的共享层，四组对照见 ②）
- [x] ✅ **该冲突已随 `larry` 面退役一并消失（2026-09-17）**；`@larryagent/plugin-probe` **包本身保留**（`harness/packages/plugin-probe/`，仍是最小自研 bundle 样板，除 `harness/package.json` 的 `build:probe` 脚本外无引用）｜原记：`larry` 里**已有一个 `link:` 挂载的 `@larryagent/plugin-probe`**（boot 打 `[B1-PROBE] external bundle loaded by cordis`）⇒ 落点 profile **已有"link 挂载"先例**，与 ② 要求的"必须实体复制"并存
- ⛔ **本块禁区**：不写 `cordis.patch.yml`；不碰 `.dsh-home/profiles/{larry,sdk}/package.json` 与 lockfile（刚由 Qoder 升 015）；**不把插件装进全局 `~/.dsh`**（那份已存在、勿动）
- 执行人：**Trae**

##### DSH-3.7.2 · 落盘 ＋ 自检 ＋ 真 e2e ✅ **已回报并复验（Trae 2026-09-17 交付 / WB 2026-09-17 逐条回源复核：J1–J7 全成立）**

- [x] ✅ **硬前置 1（WB 2026-09-17 新增；⭐ 同日二次实测后由「阻断性」降为「防御性」）**：钉方言件的依赖代际 —— `peerDependencies: "*"` 会让 pnpm 解析到 `dsh-sandbox-local@0.0.1-rc.1`（npm latest 那支，见 3.7.1 ②）。⚠️ **原记「修好前挂 patch 必崩」已被实测超越**：只要落点改到 **`sdk` 自身层**（= 硬前置 3），插件 `import` **不崩** —— `createRequire.resolve` 从 `sdk/node_modules/` 起点实测命中 **`0.1.5-rc.2`**（该层本就是干净 015）。⇒ 本项**不再阻断 3.7.2 起跑**，但仍须做，理由换成 **防污染**：`dsh plugin --profile sdk add` 走 pnpm，peer `*` 会把旧代**写进那棵本来正确的 `sdk/node_modules`**。修法不变（钉 `0.1.5-rc.2` 或 `^0.1.5-rc.2` ＋ 重算 lock ＋ **实跑验证**，改依赖树不得只凭推理）
  - ⭐ **旧代的「根」与它的两个载体（2026-09-17 WB 三层实测补全）**：根 = `harness/node_modules/.pnpm/@deepseek-ai+dsh-sandbox-lo_fc402b20…/`（截断名目录，`0.0.1-rc.1`）；载体 ①＝工程**共享层** `profiles/node_modules/@deepseek-ai/`（实测 **241 条 junction 全指 `harness/.pnpm`** ⇒ 镜像了那棵坏树）；载体 ②＝**插件包自带的 `node_modules/`**（`harness/packages/plugin-sandbox-dialect/node_modules/@deepseek-ai/dsh-sandbox-local` 是指向**同一支 `.pnpm`** 的 junction）⇒ **断根只能靠钉 peer ＋ 重算 lock；两处载体则必须绕开（见硬前置 3 与下条）**
- [x] ✅ **硬前置 2（已裁：老大 2026-09-17 ＝ ②）**：落点 = **`sdk` 面**（headless 的 `larry` 面已退役，见 3.7.1 ④）⇒ e2e 走 **client 同源通道**
  - ⛔ **订正（WB 2026-09-17 实测）：e2e 装置「可直接沿用 s0-e2e.test.ts」不成立** —— 该文件经 `tests/isolated-setup.ts` **强制把 `DSH_HOME` 覆盖成临时目录**（`s0-e2e.test.ts:9` 自述「**不穿透源 profile**」，`:97` 实证 `DSH_HOME: home`）⇒ **它验不了工程 `.dsh-home` 的落盘生效**。⇒ 本项真 e2e 改用 **`harness/scripts/dsh-prompt.mjs`**（client 同源 SDK 通道，脚本头原文"the Tauri client runs exactly this script under the hood"）；`s0-e2e.test.ts` 的**骨架与断言写法**（evidence 结构／退出码／判据函数）仍可借鉴，但**不能当本项装置用**
- [x] ✅ **硬前置 3（WB 2026-09-17 新增）：落点必须落"该 profile 自身那层"** —— 即 `sdk/node_modules/@larryagent/plugin-sandbox-dialect/`，**不可**落 `profiles/node_modules/…`（后者实测把 `dsh-sandbox-local` 解析到旧代 `0.0.1-rc.1` ⇒ 插件 `import` 即崩）；⭐ **且复制必须「不带插件自带的 `node_modules/`」**（实测：仓库源目录因自带 nm，从**它自己**起点解析 `dsh-sandbox-local` 同样得旧代 `0.0.1-rc.1`、`dsh-llm` 直接 `MODULE_NOT_FOUND`）。3.7.1 落在那层的产物**已退役并于同日真删**（原备份名留档：`profiles/node_modules/@larryagent/plugin-sandbox-dialect.RETIRED-20260917-1808`，仅供追溯、**磁盘上已不存在**）
  - ⭐ **跨机双向验过（2026-09-17 CVM 实测）**：该现象**非本机独有** —— CVM 共享层 `profiles/node_modules` 同样含 `dsh-sandbox-local@0.0.1-rc.1`（**09-16 装 `sdk` 时由 pnpm 生成**，排除"本机人为复刻"这一解释），且从 `sdk/` 起点解析得 `0.1.5-rc.2` ✓ ⇒ 旧代来自**依赖解析本身**（peer `*` → npm latest）。本条落点判断**正反两面均有实测**：反例＝落共享层取旧代、正例＝落 `sdk` 自身层取 015
- [x] ✅ 把 `harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` 的两段写进**工程** `.dsh-home/profiles/sdk/cordis.patch.yml`（⚠️ 该文件现为 **217 B 模板空态 `[]`**（4 行注释 ＋ `[]`）⇒ **须把 `[]` 那行删掉换成条目**，不能在 `[]` 之后续写 —— 会报 `end of the stream or a document separator is expected`，见「已定前提」末条）
- [x] ✅ ⭐ **一次真 end-to-end（本项核心 · `docs/local-env.md` §4.3 标注的唯一未证项）**：在**工程 `.dsh-home`** 上跑**真模型**，触发一条**确实会被 Windows 沙箱拒**的命令 ⇒ 看到 `[sandbox: file access denied]`
  - **通道写死** = `harness/scripts/dsh-prompt.mjs`（client 同源 SDK 通道）＋ **显式注入 `DSH_HOME="$(pwd -W)/.dsh-home"`**（⚠️ `pwd -W` 不可省：Git Bash 的 env 值不做路径转换 ⇒ `/d/Code/…` 被 resolve 成 `D:\d\Code\…` ⇒ 新建空 home ⇒ **无 key 假绿**）
  - ⚠️ **前置须先自证"该命令确实被拒"**（正对照）：被拒命令的形态见 `harness/scripts/sandbox-probe/cordis-confine-check.mjs` —— 策略 `{ mode: 'workspace-write', workspaceRoot: WS }` ＋ 往 `workspaceRoot` **之外**写文件 ⇒ 被拒。缺此正对照则可能造出"没有拒绝发生"的假绿
  - ⚠️ **判据双锚**：既验"挂上 ⇒ 拒绝被识别"，**也**验"摘掉 ⇒ 不被识别"（= 负向对照 ①）
- [x] ✅ **生效自检**：`dsh --profile sdk --dump-config`（须**显式设 `DSH_HOME=工程 .dsh-home`**）⇒ 官方 sandbox 行**保留 ＋ `disabled: true`**、末尾多出 `sandbox-dialect` 行。⚠️ **别拿"行消失"当判据**（会误判成未生效）
- [x] ✅ **负向对照**（贯穿规则）：破坏它、看它变红 —— 候选：① **摘掉修复件**（不挂 patch）② **落错层**（放共享层 `profiles/node_modules/` ⇒ 插件 `import` 崩，文案 `does not provide an export named 'assertNever'`）③ 插件改用 **link** 装（bare import 从源目录解析 ⇒ 取不到 `sandbox-local`）⇒ 均断言"拒命令**未被识别为沙箱拒绝**"。⚠️ **负向变体须双锚**（同时断言"其余仍活"，如 dump-config 里官方 sandbox 行仍在）—— 否则"环境没起来"与"破坏生效"不可区分（假通过）
- [x] ✅ ⚠️ **不得沿用 012 结论**：`docs/local-env.md` §4.3.1 只证了"方言表未变"，`confine()` 的**运行时行为**在 015 上仍属未验 —— **已重跑全链路复验（本块真 e2e），015 上运行时行为成立**
- [x] ✅ **lockfile 双面同步（本机 ↔ CVM）**：硬前置 1 若动 `harness/package.json` ／ `pnpm-lock.yaml`，须同步到 CVM（CVM `~/harness` 是**无 `.git` 的 tar 副本**；实测其 lock 现含 `0.0.1-rc.1` **×17**、dialect peer 同为 `"*"`）⇒ 同步后在 CVM 上验"装得上 ＋ 解析得 015" —— **已做**（Trae 交付 ＋ WB 上机复核）：实际改动件 = `packages/plugin-sandbox-dialect/package.json` ＋ `pnpm-lock.yaml` ＋ `mount.patch.yml`（**`harness/package.json` 未改**，派发稿此处措辞不准）；CVM 上插件依赖解析 = `0.1.5-rc.2` ＋ `import` ok ✅，旧代计数 16 ✅。⚠️ 但「**3 文件 md5 一致**」现况只 **2/3** —— `pnpm-lock.yaml` 本机 `f1e41ed5…`(547517 B) ≠ CVM `312b268f…`(547477 B)，差 **40 B** = CVM 少 `packages/plugin-015-preset-probe: {}` 两行（**CVM `harness/packages/` 只有 6 个包、本机 7 个**）⇒ 两面 workspace 布局本就不同 ⇒「lock 双面字节一致」**在该状态下不可能稳定成立**；下次同步以本机为准覆盖即可（**非缺陷，但须登记**）
- 执行人：**Trae**

> ✅ **WB 复核（2026-09-17 · 逐条回源）＝ J1–J7 全成立；一句话：生效。** 取证要点：① 落点实物只 2 文件、sha256 与源逐件 `SAME`、**无自带 `node_modules`**、reparse 判定 = 实体；② patch 769 B、无裸 `[]`；③ **WB 自跑 `--dump-config`，输出 11451 B 与交付证据逐字节一致**（且带落点来源注释 `# == D:\Code\LarryAgent\.dsh-home\profiles\sdk\cordis.patch.yml`）；④ **WB 隔离复跑装置**（`S372_EVIDENCE_DIR` 指临时目录、不动交付证据）⇒ `exit 0` ／ 判据全过 ／ patch 跑完复位回原 sha256；⑤ ⭐ **J5 的 marker 已核到「工具返回原文」层**（DSH 会话日志 `tool/result` 帧：`unpatched` 758 B 无 marker ／ `patched` 998 B 含 `[sandbox: file access denied under workspace-write mode]` ＋ 升权提示，**差 240 B = 恰好那两行**；两态**目标文件均未创建**）⇒ 判据**不停留在模型复述**。⚠️ **2026-09-17 WB 自纠（原文有误）**：原记「**差 240 B = 恰好那两行**」**不可当规律** —— 那是一次 run 的巧合；WB 于 3.7.3 复跑时实测 `tool/result` 帧 **unpatched 1212 B ／ patched 1458 B（差 246 B）**，而装置的存盘 `prompt.stdout.txt` 两态为 **1156 ／ 1152 B（patched 反而更小）** —— 因该字段是**模型复述**、长度随 run 变 ⇒ **判据必须取内容匹配，不得取尺寸差**。
> - ⚠️ **读会话日志两条硬注意（WB 实测）**：① 该文件是**多 zstd frame 串联**，`zstdDecompressSync` 只解第一帧（得 179 B 假象）⇒ 须**按 magic 切分逐帧解**；② **归属只能靠 run 自报的 stderr `[dsh-prompt] session=…`，不能按 mtime 两两分组** —— 同 cwd 的会话是**多次运行叠加**（当时共 8 个 / 4 次运行），按 mtime 分组会得出「unpatched 也出现 marker」的**错误结论**。
> - 🔻 **推翻执行方两处自述**：① CVM `--frozen-lockfile` 被拒的**归因错**（他记为「同步 lock 后既有 `node_modules` 仍旧代」）—— install 日志原文主体 = `packages/plugin-sandbox-mount-probe/package.json`，真因 = **`*` 不匹配 prerelease**（`semver@7.8.5` 实测 `satisfies('0.0.1-rc.1','*') === false`）⇒ **与 dialect 的同步无关**，是**未派包**的既有坑。② 故「同步后必须 `--no-frozen-lockfile`」属**过度声明**：WB 上机复跑 frozen ⇒ **`exit 0` ／ `Already up to date`**；⚠️ 但 WB 走的是「已 up-to-date 短路」路径（430 ms、**无 `Verifying lockfile` 输出**），与他「需要安装」路径**不同路径 ⇒ 观察不可互推**，两条**并列留痕**，本条**未定论、不写 SOP**。
> - ⚠️ **未闭合（转出项，不阻断本块收口）**：
>   0. 📌 **Qoder「项目代码层 DSH 旧代残留」复核（老大交办 ／ 2026-09-17）—— 报告原文已随交流区清理出手（`exchange/log-qoder.md` 于 `3fd0a09` 删）** ⇒ **权威追溯 = `git show 4b1ec04`**。其结论 —— **「有，且是活的」**（三层：lock 声明 ／ `.pnpm` hoisted 别名层 ／ 工程共享层 241 条 junction），**与本块 ① 的初态、以及 `:242`／`:221` 的登记完全一致**（WB 已于同日交叉印证，见 `cee4439`）。
>      - ⚠️ **其报告内另有 3 项当时未逐一承接的发现（WB 2026-09-18 核，登记备查，均未起跑）**：① **`.qoder/repowiki/zh/content/**` 生成知识库含过时断言**（如"CLI 现状 `0.1.2-rc.1`"、还留着"方案二：降级到 012"）—— **它会进 AI 会话上下文** ⇒ 修法是**重新生成、不是手改**；② ✅ **已消解（2026-09-30）**：原记「`D:\Code\dsh-src` 仍挂 tag `dsh-v0.1.2-rc.1`（仓库外，`ref/dsh-bare` 的 worktree）——「追 DSH 源码」的参照物还停在 012，按它判 015 行为会读错代」⇒ **该 worktree 已整体删除**（老大裁定；P.S. 删除过程中 WB 又误走整体 checkout 踩回 `dsh-migration.md:138` 的卡死坑，教训见 `.workbuddy/memory/2026-09-30.md`），`git worktree prune` 已清注册 ⇒ **本项随设施消失自动消解**。⇒ 查 DSH 源码的**唯一通道**现为 `ref/dsh-bare` 裸仓只读（`git show` / `ls-tree` / `grep <tag>`，**不需要工作区**）＝**从根上消除了「参照物停在旧代」的可能**；③ `harness/tests/real-api.ts:69` ／ `packages/plugin-sandbox-probe/src/index.ts:80` 的**注释版本标签**停在 012（**015 下断言是否仍成立未验**）。⇒ ①③ 两项**仍保有**、**是否立项待老大裁**。
>      - 📌 **追溯通道说明（WB 2026-09-18）**：Qoder 报告（`4b1ec04`）是**旧代残留复核**专题，**本不涉及**「那对运行归属」—— 后者是老大 **2026-09-18 另行向 Trae / Claude / Qoder 三方询问**后得到的**澄清**（他们也是当日才查的），**属两条独立线索**。⛔ 勿混为一条，也⛔ 勿据此认为报告"漏记"。
>   1-a. ⭐ **【WB 2026-09-18 新证据 · 372-ws 运行全景】20 次运行盘点 —— 推翻两条既有登记，归属结论改为「待对口径」**
>      - **取证**：`D:\Code\LarryAgent\.dsh-home\sessions\--D-Code-larry-sbox-372-ws--\` 下 **20 个** `session-*` 目录（WB 独立解多帧 zstd，逐帧读 `tool/result` 原文）。**旧登记只数到 8 个 / 4 次运行 ⇒ 漏了一半以上。**
>      - **形态分布**：**A = pwsh 类型约束失败 6 次** ／ **B = 干净 `EPERM: operation not permitted` 14 次** ／ **C = 方言件 marker 0 次**。
>      - **时间窗（UTC → 北京 +8）**：`10:48–10:49`(4×B) ｜ **`11:01:26`/`11:01:41`(A,A)** / `11:01:59`/`11:02:06`(B,B) ｜ `11:48`(2×B) ｜ **`11:55:52`/`11:56:01`(A,A)** / `11:56:17`/`11:56:22`(B,B) ｜ `12:26`(2×B) ｜ **`13:02:44`/`13:02:54`(A,A)** ｜ `13:18:58`/`13:19:03`(B,B)。
>        - ⇒ **A 严格成对出现（3 对：19:01 ／ 19:55 ／ 21:02 北京时间）**，且**每对紧接 2 个 B**；末次运行 **21:19** ≈ 与 `TODO` 本段「3.7.2 复验（WB 19:09）」及 3.7.3 复验（20:06）**同窗**。
>      - 🔻 **订正一：`A` 形态不是「某次孤立运行的意外」** —— 旧登记写「同机**另有一次**运行走了 pwsh 受限路径」，实测是**6 次、且严格成对**。⇒ **「偶发」的说法不成立**（至少是**可重复**的双发模式）；该形态本身**仍需独立立项定性**（与装置脆弱性是否同源**未证**）。
>      - 🔻 **订正二（更要紧）：3.7.2 交付证据里 `EPERM` 原文零命中** —— 装置走的就是这条 prompt，本应产出 `EPERM: operation not permitted` 原文（14 次里全是这个），但**交付的 `372-*.prompt.stdout.txt` ／ `tool/result` 帧里都读不到** ⇒ **与 3.2.1 那次「英文系统提示」是同一病灶**（证据原文层被后处理）。⚠️ **成因未定、不下「造假」结论**，但**该批件「原文」同样不可采信**。
>      - 🔻 **订正三：20 次运行无一例出现方言件 marker** ⇒ 「挂上修复件 ⇒ 模型侧看到 `[sandbox: file access denied…]`」这条**只在交付自述与装置存盘里**，**原始 `tool/result` 帧层面 WB 尚未独立复现**。
>      - ⚠️ **归属**：`prompt` 确系装置内建（已核 `:144`），**但「谁在跑」仍未定** —— 20 次中**无一**可由 `run-372-dialect-e2e.mjs` 的**单次运行**解释（该脚本一次跑完即退出；而这里同 prompt **反复成对 20 次**、跨 2.5 h）⇒ **更像手工反复试 或 带重试的循环探针**。**待老大与 Trae/Claude/Qoder 对口径。**
>   1. **装置脆弱性（fail-safe 方向）**：同机**另有一次运行**走了 **pwsh 受限失败路径**（⚠️ **该「一次」口径已被订正** —— 见上「订正一」：实测 **6 次、严格成对**）（工具返回 = `CannotCreateTypeConstrainedLanguage` ＋ `无法运行 node.exe：拒绝访问`，**GBK 乱码** ⇒ 既无 marker、也匹配不到普通失败词）⇒ 该路径下 `unpatched` 态会被判 **FAIL** ⇒「命令一定走到 `EPERM`」这一前提**不成立**。⚠️ **归属仍未定（WB 2026-09-18 重新上机取证 ⇒ 撤回上轮「已认领」结论）**：该对运行（2026-09-17 11:01:26 ／ 11:01:41 UTC）的 prompt **确系 3.7.2 装置内建**（`run-372-dialect-e2e.mjs:144` 一字不差），但 **20 次运行的全景**（见下条）使「谁在跑」比原先更复杂 —— **归属待老大与各方对口径**。
>   2. 📮 **已转 DSH-3.7.3 派发（2026-09-17）**｜原记：**同类旧代隐患仍在（→ 建议单派；⭐ Qoder 同日独立复核亦命中同一批，其口径 = 「2 处活动解析」，与本条「16 处字符串出现」不同口径、不可混用）**：lock 仍有 **16 处** `0.0.1-rc.1`（**口径** = 字符串出现次数；⚠️ Qoder 记的是「**2 处活动解析**」，属**另一口径**，两者不可混用）（`plugin-probe` ／ `plugin-sandbox-mount-probe` ／ `plugin-sandbox-probe` ／ `plugin-storage-probe`，peer 同为 `*`；本机 lock 共 **6 处** `specifier: '*'`）⇒ 这些 `*` 不清，则**共享层 241 条 junction 仍指旧代那支**（实测 `.pnpm/node_modules/@deepseek-ai/dsh-sandbox-local` = `0.0.1-rc.1`；⚠️ 该包在 `.pnpm` 下实有**两支**：`…_fc402b20…`（旧代，仍被这些 `*` 包引用）／`…_afd5a527…`（015，dialect 钉 peer 后新解出）⇒ **钉 peer 只挪 dialect 那一支、不迁走旧支**），且「需要安装」路径下 `frozen` 必报 `OUTDATED_LOCKFILE`（**主体是它们，不是 dialect**）。　⚠️ **2026-09-17 订正（WB 自纠）**：4 个包**都**有 `*` 声明属实，但**只有 2 条致旧代**（`mount-probe` 的 `dsh-sandbox-local` ＋ `storage-probe` 的 `dsh-storage-domain`）；另 **3 条 `cordis`**（`plugin-probe`／`plugin-sandbox-probe`／`plugin-storage-probe`）＋ **1 条 `zod`**（`plugin-storage-probe`）**解析本就正确**（`4.0.2` ／ `4.6.5`）；且 `mount-probe`／`storage-probe` 的声明在代码里**零使用**（`plugin-probe`／`plugin-sandbox-probe` 的 `cordis` 是 `import type`、**编译期要用**）⇒ 终态 = **删 4 条零使用声明 ＋ 收紧 2 处 cordis 为 `^4.0.2`**（照字面"改 6 处"会去动本来就对的、制造无谓 lock churn）。
>   3. **装置判据面建议收紧**：`markerPresent` 现取自 `dsh-prompt.mjs` 的 `finalResponse`（= **模型复述**，二手表述）⇒ 建议改取 `tool/result` 帧（`run-372-dialect-e2e.mjs` 的 `runPrompt()`）。⭐ **多帧 zstd 回读不必自造** —— 仓库已有现成器材 **`harness/tests/s0-session-log.ts`**（3.1 交付物，标题即"多帧 zstd 回读"）；WB 本轮先自写了按 magic 切分的脚本，之后才发现已有 ⇒ **先查器材再动手**。
>   3-b. ⚠️ **2026-09-17 复测口径补充**：判「marker 出现」只可**取内容匹配**（见 3.7.2 段自纠）；且**「工具返回原文」与「装置存盘 stdout」是两个面** —— 前者 = DSH 会话日志的 `tool/result` 帧（**DSH 工具层写入**，最硬），后者 = `372-*.prompt.stdout.txt`（= `dsh-prompt.mjs` 的 `finalResponse`，**模型复述**；本例逐字含 stderr 原文，但保真度依赖模型）。⇒ 引用时须**注明取自哪个面**。
>   4. 📮 **已并入 DSH-3.7.3（2026-09-17）**：**CVM 副本滞后**：`~/harness/packages/` 少 `plugin-015-preset-probe`（本机 7 ／ CVM 6）；`mount.patch.yml` 旧注释待下次同步覆盖。
>   5. **真客户端（Tauri）重启验证未做**（执行方未闭合项 5）：本机无可跑的 Tauri 链路，e2e 走的是 client **同源脚本**（`dsh-prompt.mjs`）⇒「落盘后**真客户端**起来是否生效」仍属未验。
>   6. 📮 **DSH-3.2.1 已派发（WB 2026-09-17，随 3.7.3 收口）** —— 场地已空出（3.7.3 已交回）；3.2 的锁归属结论已出（「A 锁全程无孤儿／B 锁全程未现」）⇒ **问法无需改**，按原判据跑。派发稿原载交流区 `exchange/log-trae.md`（**已随交流区清理，不可再查**）。
>
##### DSH-3.7.3 · 工程卫生合并块（旧代依赖清理 ＋ CVM 副本补齐 ＋ 3.2 判据缺陷修复）✅ **已回报并复验（Trae 2026-09-17 交付 ／ WB 2026-09-17 逐条回源复核：J1–J11 全成立）**

> **派发稿**：原载交流区 `exchange/log-trae.md`（**已随交流区清理，不可再查**）；**判据与边界的权威落点 = 本文件**。
> **为什么合并成一块**：三件**同一场地（本机 ＋ CVM 双侧）＋ 争用同一棵 `harness/node_modules`** ⇒ 天然串行，分三次派是浪费。**老大 2026-09-17 裁**：「完全没用的就删掉，不能删掉的就改，不严谨的地方收紧，合并派出去」。
> **本块要回答的一件事**：harness 工作区那批旧代依赖（`0.0.1-rc.1`）**清干净了没有**，且**没顺手打断任何在飞成果**。

- [x] ✅ **① 旧代依赖清理 —— 已完成（终态 `specifier: '*'` = 0 ／ `0.0.1-rc.1` = 0，两侧同）**（3.7.2 未闭合项 2 转出）：⛔ **口径已订正（WB 2026-09-17 自纠）** —— 原记「6 处 `specifier: '*'`」是**字符串计数**，但**只有 2 条真的致旧代**：
  - **删（4 条零使用声明）**：`plugin-sandbox-mount-probe` 的 `dsh-sandbox-local: *`（1 条）＋ `plugin-storage-probe` 的 `cordis`／`dsh-storage-domain`／`zod: *`（3 条）—— 已**逐文件核过 import 为零**（`mount-probe` 只用 `node:` 内建 ＋ `inject` 拿服务；`storage-probe` 头注释自述 *"Deliberately dependency-free"*）⇒ 这些声明的**唯一作用就是把旧代包拽进树**（`autoInstallPeers: true` 下连 `optional: true` 的 peer 也被自动装成真依赖；lock 里落在 `dependencies:` 段）。
  - **改（2 处，不能删）**：`plugin-probe` ／ `plugin-sandbox-probe` 的 `cordis: *` → **`^4.0.2`** —— 这两个是 **TS 包**（`build: tsc`），`src/index.ts` 有 `import type { Context } from '@deepseek-ai/cordis'` ⇒ **编译期需要该包**，删声明会让 `pnpm build` 失败。`^4.0.2` = **生态惯例**（`.pnpm` 内 **238 个** 015 代包**一律**如此；⛔ 不照抄 `plugin-sandbox-dialect` 的精确版写法 —— 那是 3.7.2 的刻意收紧、语义不同）。
  - **终态**：`specifier: '*'` **0 处** ／ `0.0.1-rc.1` **0 处**（本机基线 **6 ／ 16**）＋ 物理树里 `dsh-sandbox-local`／`dsh-storage-domain`／`dsh-sandbox-windows-acl` **各剩 1 支 `0.1.5-rc.2`**（基线各 2 支）。
  - ⚠️ **判据须双锚**：同时断言 `dsh-sandbox-local@0.1.5-rc.2` **仍在树里** ＋ `cordis` 全树**仍只 4.0.2 一支** —— 否则「旧代清除」与「整棵树被装空」不可区分（假通过）。
  - ⚠️ **传递面不许闷掉**：`dsh-sandbox-windows-acl@0.0.1-rc.1` 是**被旧代 `sandbox-local` 拖进来的**（而它正是**方言表**的宿主）⇒ 若旧代 `sandbox-local` 已消失而它**仍在**，须**报出并追出还有谁在引它**。
- [x] ✅ **② CVM 副本补齐 —— 已完成（11 件两侧逐件哈希一致；CVM `packages/` = 7 个）**（3.7.2 未闭合项 4 ＋ 3.1 前置遗留）：`~/harness/packages/` 补 `plugin-015-preset-probe`（CVM 6 → 7）＋ `scripts/015-preset-probe/` 2 文件 ＋ `sandbox-dialect.mount.patch.yml` **注释订正版**；`SYNC-ANCHOR.txt` 更新。**目标**：两侧 `pnpm-lock.yaml` **sha256 相同**（原 **40 B** 差异 = CVM 少 `packages/plugin-015-preset-probe: {}` 两行 ⇒ 随补齐消失；若仍不一致须给逐行 diff ＋ 原因，⛔ 不得只报"已同步"）。
- [x] ✅ **③ 3.2 判据缺陷修复 —— 已完成（代码 ＋ CVM 实跑自洽；⚠️ 仍观察不到 `true`）**（本文件 `:128`）：`harness/tests/s0-resume.test.ts:312` 的 `p2LandedOnSameLog` 改为**可取 `true`**（现写死 `p2Log === null ? null : false`，而 `:309` 的 `p2Log` 只找"含 P2 但不含 P1"的**另一条**日志 ⇒ 按构造永不 `true`）⇒ 补 `hasP1 && hasP2` 分支。**实跑道 = CVM**（3.2 的装置与结论都是 **CVM 单环境**，换场地即**跨通道外推**）。
- ⚠️ **本块最强回归判据**（负向对照）：清理后**本机实跑** `harness/scripts/run-372-dialect-e2e.mjs` 须仍 **`exit 0`** ＋ patch 复位回 **`74400d260d5d4e6c…`**（769 B）＝「清理没打断 3.7.2 的成果」；输出目录须用 `S372_EVIDENCE_DIR` 指临时目录，⛔ 不覆盖 3.7.2 交付证据。
- ⚠️ **本机 pnpm 通道（实测坑）**：本机**必须用 `pnpm.cmd`** —— 裸 `pnpm` 在本机 Bash 通道下**必崩**（npm 的 sh 垫片缺 `sed`/`dirname`/`uname`，且入口会错解析到 `D:\node_modules\pnpm\bin\pnpm.mjs`）⇒ 报 `Cannot find module 'D:\node_modules\pnpm\bin\pnpm.mjs'` **是通道问题、不是工程问题**。自证式：`pnpm.cmd -v` = **11.7.0**（与 `packageManager` 一致）。⛔ 不得改用 `npm` / `yarn`。
- ⚠️ **诚实边界**：本块**不得声称**「DSH 旧代问题已彻底解决」—— **生产参照 profile `~/larry-dsh-home/profiles/sdk` 仍整体是 `0.1.2-rc.1`（012 代）**、**共享层 241 条 junction 未动**，两者**均在范围外**（**清引用者 ≠ 迁走被引用者**）；亦**不得声称**「resume 已可用」（015 现状下 `p2LandedOnSameLog` 仍不可观察到 `true`，③ 只证"实现不再排除 true ＋ 实跑取值与原始分布自洽"）。
- ⛔ **禁区**：不碰 `.dsh-home/profiles/node_modules/`（共享层）／不碰工程落点 dialect 3 文件（`index.js` `022b0ff5efd11648` ／ `package.json` `9d6f4794a8aec191`）／不碰 CVM 的 **012 代** profile 内容／不改 `harness/packages/plugin-sandbox-dialect/package.json`（`9d6f4794a8aec191`）／不加 `pnpm.overrides`／**`rm -rf` 一律禁用**（清树须用 pnpm 机制或先备份再整树重装）。
- 执行人：**Trae**

> ✅ **WB 复核（2026-09-17 · 逐条回源）＝ J1–J11 全成立；一句话：(a) 已清干净、两侧 lock 逐字节一致。**
> - 取证要点（**全部为 WB 独立取，不采信回报**）：① **J1** 4 包的声明终态与 `git diff` 逐行吻合（删 2 段、改 2 处，无越界）；② **J2** 本机 lock `specifier: '*'` = **0** ／ `0.0.1-rc.1` = **0**（541493 B）；③ **J3** 遍历读 `package.json` 的 `name`/`version`（本机 **2574** 个）⇒ `stale = 0`；三包**物理 entry 3 ／ 5 ／ 2**（peer 变体），**版本集合各只 `0.1.5-rc.2`**；⭐ **WB 加测「树 vs lock 全量对齐」**（树里读出的 name 与 lock `packages:` key 比对）：**树有 lock 无 = 0**（无任何多余包）／**lock 有树无 = 91 且全为异平台 optional**（`sharp` ／ `node-addon-system-*` 的 darwin/linux/wasm 支）⇒ **比「stale = 0」更强的结论**；④ **J4** `cordis` 全树唯一 `4.0.2`（**237** entry）、`dsh-sandbox-local@0.1.5-rc.2` 仍在、dialect 自身层解析到 **015**；⑤ **J5** **WB 隔离自跑** `run-372-dialect-e2e.mjs` ⇒ `exit 0` ／ 双锚成立 ／ patch 复位回 `74400d260d5d4e6c`；并**追到工具返回原文层**（会话日志 `tool/result` 帧，按 magic 逐帧解多帧 zstd）：**unpatched 无 marker ／ patched 恰多两行** `[sandbox: file access denied under workspace-write mode]` ＋ 升权提示；⑥ **J6** **WB 自跑** `pnpm.cmd build` ⇒ `rc = 0`、3 包 `Done`；⑦ **J8** 两侧 lock **完整 sha256 相同**（`a03ede8d…`）；⑧ **J9** **11 件两侧逐件哈希一致**（WB 自取）＋ CVM `packages/` = **7** 个 ＋ `scripts/015-preset-probe/` 2 文件在位；⑨ **J10** 5 个锚（`harness/package.json` ／ dialect `package.json` ／ 落点 2 件 ／ `sdk/cordis.patch.yml`）**全未动**；⑩ **J11** `windows-acl` 只剩 `0.1.5-rc.2`，唯一依赖者 = 015 代 `sandbox-local` ⇒ **无需追引用者**。
> - 🔻 **推倒／订正 WB 自己的旧记述（3 处）**：① **`node` 版本** —— 派稿写「node 22.22.2」而 Trae 实测 **v24.14.1**；WB 核实**两者皆真**：**Bash 通道 = managed `22.22.2` ／ system `D:\App\node` = `24.14.1`** ⇒ **同机两通道给出不同版本**，派稿**未注明通道（是 WB 的缺陷，不是他的错）**；对本次判据无影响（遍历与构建均非 node 版本敏感）。② **「差 240 B」不可当规律**（见 3.7.2 段自纠）。③ **`pnpm 状态缓存`的机理**（见「已定前提」判据 ② 精细化）：实测那两个文件**不含旧代条目** ⇒ 「缓存陈旧」解释**被证伪**。
> - ⚠️ **未闭合（转出项，不阻断本块收口）**：
>   1. **pnpm「不回收旧 `.pnpm` 目录」的成因仍未定** —— 执行方诚实留白（「未找到官方依据」），WB 只**缩小**了范围（排除「状态文件缓存旧记录」）；**现象与处置均成立、机制未证**。
>   2. **`--force` 是否必需未定**（执行方自曝：清状态文件后的 install 与随后 `--force` 之间未复扫）⇒ **不可回源**（树已干净、原态无法复现）⇒ **并列留痕、不写 SOP**。
>   3. **J3 的「改前各 2 支」无法独立验证** —— 改前树是**易失物理状态**，现只剩执行方证据（WB 只核到改后 3 ／ 5 ／ 2）。
>   4. **`SYNC-ANCHOR` 的清单不完整**：CVM 上 `tests/s0-resume.test.ts`（mtime **19:48 属本轮**、两侧哈希一致 `dab57a0ed2c3f64e`）**不在其记录的 11 件里** ⇒ 实物到位，但**该清单不可当「同步范围」的完整依据**。
>   5. ✅ **备份件已清（老大 2026-09-17 裁「删除」／ WB 同日执行并双向核验）** —— 本机 2 件走**回收站**（`$I` 元数据反查：原始路径与字节数吻合 `.modules.yaml.bak-373-20260917194716` 98692 B ／ `.pnpm-workspace-state-v1.json.bak-373-20260917194716` 2233 B；原处 `exists=False`）；CVM 2 件（后缀 `20260917195029`）**显式文件名直删**（`rm rc=0` 、after 无残留）。两侧 live 文件均完好未动。
>   6. 📮 **已单开立项（老大 2026-09-17 裁）⇒ 见「待派发 · DSH-3.7.5」**；其中 **`(b)` 已于 2026-09-18 裁「删」**（未起跑） ｜原记：`(b)` **012 代生产参照 profile**（**在 CVM**：`/home/ubuntu/larry-dsh-home/profiles/sdk`，实测三件全 `0.1.2-rc.1`）／ `(c)` **工程共享层 241 条 junction**（**在本机**）—— 均在范围外（见本段诚实边界）。
>      - ⚠️ **WB 2026-09-17 复核订正（`(c)` 已实质归位）**：241 条 junction 现**逐条有效、悬空 0**；`dsh-sandbox-local` ／ `windows-acl` ／ `storage-domain` 三件均**经 `.pnpm/node_modules/` 汇总层**解析到**唯一存活**的 `0.1.5-rc.2` 支（`.pnpm` 内旧支 `@deepseek-ai+dsh-sandbox-lo_fc402b20…` **已随本块 ① 消失**）⇒ **"镜像旧代"的实质已自动解除**，该条从「待处置」降为「**登记订正 ＋ 一条派生耦合风险**」（共享层是 `harness/node_modules/.pnpm` 的**派生视图**，非独立副本）。详见 DSH-3.7.5。
>   7. ⚠️ **3.7.2 遗留两项状态更新（2026-09-18）**：**装置脆弱性**（`pwsh` 受限路径 ⇒ fail-safe 假红）**仍在**（未修，转 3.7.4 一并判定）；**运行归属 —— 上轮「已认领」已撤回**（该线索出自老大当日三方询问的澄清、不在 Qoder 报告内；20 次运行全景见上第 1-a 条）⇒ **归属待对口径**。📌 **两项均暂停：老大 2026-09-18「俩事儿都不做了，今天休息」—— 3.7.4 未派 ／ 3.7.5 未起跑 ／ 20 次运行归属与 EPERM 原文缺口均先挂起。** ⏳ **其中「3.7.4 未派」已于 2026-09-20 过期**（当日派发 ＋ 交付 ＋ 复验 ＋ 闭环，见 `##### DSH-3.7.4`）；3.7.5 仍未起跑。
> - 📮 **独立测试件已派 Claude（WB 2026-09-17）⇒ ✅ 已交回并复验（见下「DSH-3.7.3-T」段）**：本块**动了共享依赖树**（影响面超出本块判据）、且 **J7 的目标行为（`p2LandedOnSameLog = true`）从未被观测到** ⇒ 两条都落在「**改的人自证**」的盲区。派发稿原载交流区（**已清理，不可再查**）；三项分工留档 —— **T1** 独立全套回归 ／ **T2** `true` 分支独立触发尝试 ／ **T3** 关键判据独立复算。
>

##### DSH-3.7.3-T · 3.7.3 的独立测试件 ✅ **已回报并复验（Claude 2026-09-17 交付 ／ WB 2026-09-17 逐条回源复核：T1–T4 四项判定均成立，另补 1 条更强的 ＋ 记我方派稿缺陷 1 处）**

> **为什么派**：3.7.3 **动了共享依赖树**（影响面超出本块判据）、且 **J7 的目标行为（`p2LandedOnSameLog = true`）从未被观测到** ⇒ 两条都落在「**改的人自证**」的盲区（WB ＋ Trae 一共只跑了两条回归）。⚠️ **本件是补充验证，不替代 WB 的复验结论**；⛔ 不据此声称"3.7.3 通过/失败"。
> **场地**：本机（CVM 只读核）｜**通道**：Claude 的 bash 会话 ／ `node v24.14.1 @ D:\App\node` ／ `pnpm.cmd 11.7.0`｜**证据**：`D:\Code\_claude-evidence\373t\`（42 件，不进仓库）。

- [x] ✅ **T1 独立全套回归 ⇒ 未全绿，但根因与 3.7.3 无因果（WB 独立核实）**
  - `(a)` `run-372-dialect-e2e.mjs` ✅（**WB 本轮独立复跑亦 `exit 0` ／ 双锚成立 ／ patch 复位回 `74400d260d5d4e6c`**）；`(b)` `pnpm.cmd build` ✅；`(d)` `dsh-prompt.mjs` ✅（`pwd -W` 的必要性被其复证）。
  - `(c)` 四个 `test:isolated*` ✅ —— ⚠️ **须逐件按其自身期望落位**：`guard`=0 ／ `sentinel`=1 ／ **`sentinel-key`=0** ／ `sentinel-unset`=1。
    - 🔻 **WB 派发稿缺陷（本项暴露）**：我在派稿里写「**哨兵组本就应红**」＋「`tests/sentinel-*.test.ts` **本就是"应当失败"的哨兵**」—— **错**。`sentinel-key-residue.test.ts` 的期望是**落绿**（"此文件全绿、验收看 teardown 的 `⚠️ KEY RESIDUE` 告警"）⇒ **按"组"给口径会把该件判反**。**纪律：应红 ／ 应绿必须逐件读源码定期望，不得按"组"给口径。**
  - `(e)` 增跑件 `run-s0-e2e.mjs`（执行方主动扩面，超出派发清单）⇒ **5 变体 3 红 2 绿**（`base` ／ `wrong-key` ／ `no-session-dir` 红，`no-bundle` ／ `kill-client` 绿）。
    - **根因（WB 独立核实机制 ＋ 时点）＝ `dsh plugin add` 前置失效**：`cp -r` 出的 profile 副本**自带源 profile 的绝对** `virtualStoreDir`（实测 `.modules.yaml`：`"virtualStoreDir": "D:\Code\LarryAgent\.dsh-home\profiles\sdk\node_modules\.pnpm"`、`"nodeLinker": "hoisted"`）⇒ pnpm 算出的副本路径 ≠ 记录值 ⇒ `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`，**在解析依赖之前退出** ⇒ 与"包里有没有旧代"**无关**；**时点**：profile 依赖 mtime = `2026-09-17 00:10~00:11`，早于 3.7.3 交付（`19:52`）约 **19.7 h**。
    - ⇒ **⭐ 新暴露的存量问题（本项最大增量）** ⇒ ✅ **已单独立项 = DSH-3.7.4（老大 2026-09-17 裁）**。⚠️ **WB 同日把影响面收紧（原记过宽）**：全仓 `installPlugin` **只 `s0-e2e.test.ts` 一处定义**（`:92`；`:246` **无条件调用**）—— `s0-resume.test.ts:269` 同样 `cpSync` 但**不跑 pnpm** ⇒ **不受影响**；`cvm-probes/*.sh` 的 `plugin add` 打**非副本** home ⇒ 亦不受影响。⇒ 准确说法 = 「**本机 `s0-e2e` 跑不起来**」，**不是**「凡依赖 `installPlugin` 的装置都跑不起来」。⭐ **真变量已钉（WB 双侧实测）**：不在机器、不在 pnpm 版本（两侧 `packageManager` 同为 `pnpm@11.7.0`），而在 `.modules.yaml` 的 **`virtualStoreDir` 记录形态** —— **本机写绝对路径**（`harness` 与工程 sdk profile **皆然**）／**CVM 写相对 `.pnpm`**（`harness` 与两个 profile **皆然**）⇒ 相对值随副本走仍自洽（**CVM 绿**）／绝对值仍指源处 ⇒ 失配（**本机红**）。**形态差异的成因未定** ⇒ 立项第一件事是定性，⛔ 不得先改代码再补成因。
    - ⚠️ 装置自身的"负向 2 ／ 3"锚（"插件激活层必须仍是绿的，否则「红」可能只是链路没起来"）**正是挡住假绿的地方** ⇒ **装置判据是对的**；`base.evidence.json` 的 `criteria` 印证：失败**只在插件激活层**（`②_activated=false`），主链路全绿（`③_turnEndKind=completed` ／ `④_sessionContainsNonce=true`）。
- [x] ✅ **T2 `true` 分支独立触发 ⇒ 本机不可观测（判定成立；WB 另补一条更强的）**
  - 原因一：`resumeTarget` **只在 `VARIANT === 'key'` 分支赋值**（WB 核代码 `harness/tests/s0-resume.test.ts:307`）⇒ `same-proc` 已造出底层条件（单条日志 `hasP1=true` **且** `hasP2=true`，13600 B）却**不产出该字段**；
  - 原因二：唯一产出的 `key` 变体里 P2 被拒（`-32603 already exists`、`eventsCount=0`、`sessionId=null`）⇒ `p2LandedOnSameLog = false`（**实测值，非推断**）；`reverse` 独立复现同一现象（同码同文案）。
  - ⭐ **WB 补强**：4 变体实测中 `same-proc` ／ `forward` ／ `reverse` 的 `resumeTarget` **键都不存在**，且 **`forward`（P2 落在另一条日志）恰是该字段的"语义正样本"**却不产出 ⇒ **该字段的产出面与语义面几乎不重叠**（唯一产出的 `key` 恰是 P2 失败姿态）⇒ 比"`true` 观测不到"**更严重**。
- [x] ✅ **T3 四项独立复算 ⇒ 全对**（`specifier:'*'` = 0 ／ `0.0.1-rc.1` = 0；物理树 2574 条目命中 0；三包版本集合各只 `0.1.5-rc.2`；两侧 lock sha256 逐字节一致；4 探针包终态符合）。⚠️ 执行方自曝"先用 `find` 只数到 585/577 并据此判派发单不可复现 ⇒ **是他口径错**" ⇒ 诚信体现，且**派稿没写错**（正确口径即 2574）。
- [x] ✅ **T4 判据边界评估 ⇒ 三条全部成立（WB 逐条核码 ／ 核证）**：
  - ① `p2LogPath` 语义改动前后不一致（`true` ⇒ 指 `p1Log.path`，与 `p1LogPath` 同值）；
  - ② `null` ／ `false` 可区分，但 **`false` 混两义**（"落在另一条" vs "P2 未落盘"），只能靠 `p2LogPath` 是否 `null` 分开，**证据里无独立字段**（建议加 `p2LogFound` 或把该分支写成 `(none)`）；
  - ③ **`hasP1` ／ `hasP2` 会被骗** —— 取法 = `logsEvidence():219` 的 **`text.includes(TAG_P1/P2)`**（**纯子串匹配，不分事件类型 ／ 轮次 ／ 角色**）；WB 核其帧统计：tag 落在 `user/message`（**请求侧**）／ `session/title`（派生标题）／ `assistant/message` ／ `agent/inbox/spliced` ⇒ **只要被问过该 tag，`hasX` 即为 `true`，与回合结果无关**（**名实不符**）。假阳反例 = **构造成立、真实现场未采集到**（`forward` 的新日志 `P1=false`）。
- 🔻 **通道冲突（不是谁错，是通道不同）**：执行方报"两条通道同版本 `24.14.1`"，与本派稿记的"Bash 通道 `22.22.2`"相反 —— **两者皆真、分属不同通道**：**WB 的 Bash 工具通道** PATH 先命中 managed `22.22.2-3`（裸 `node -v` = `22.22.2`）；**Claude 的 bash 会话** `which node` → `D:\App\node\node.exe`（`24.14.1`）。⇒ 派稿写"Bash 通道"**不够精确**（对别人而言那是另一条）⇒ 与 `:263` 同一缺陷的**第二次现形**。
- ⚠️ **未闭合（转出项）**：① **`s0-e2e` base 在本机是否曾绿过 —— 未证**（只能证"本次落红不是 3.7.3 造成的"）；② `no-session-dir` 的 `chmod 500` 在 Windows 是否真能令 ④ 变红**未判定**（被"负向 3"先拦）；③ T2 的 `~/.dsh/profiles` 通道**未验**（用的是工程 `.dsh-home/profiles`）；④ **T4-3 假阳的真实现场未采集到**；⑤ `resumeTarget` 是否有**仓库外**消费者未知。

##### DSH-3.7 · 已定前提（三块共有，勿重复推导）

- [x] ✅ **首项判定已完成（WB 2026-09-16，本机上机）⇒ 结论 = ③「未修」**：015 **未自修** Windows 沙箱方言缺口 ⇒ **修复件不退役、且无需改码**；**须重跑全链路复验，不得沿用 012 结论**
  - **判据（读 015 `DENIAL_SIGNATURES` 是否已含 `operation not permitted`）**：015 的 `windows-acl` 方言仍是 `['access is denied','access to the path','permission denied']` —— **不含** `operation not permitted`、**也不含** zh-CN 两条
  - ⭐ **读法陷阱（判归属才能定）**：`operation not permitted` 在 015 包里**确实出现 1 处**，但它属 **`seatbelt`（macOS）名下** —— 不判归属就会得出"已修"的反向结论
  - **证据链六条**：① `dsh-sandbox-local/lib/index.js` 012→015 **全量 diff 仅 1 行**（包重命名 `node-addon-landlock-run` → `node-addon-system/landlock-run`），其余 538 行**逐字节一致**（含 `DENIAL_SIGNATURES` / `Config` 三字段 / `STATIC_ENFORCEMENT` / `PLATFORM_CHAINS` / 默认导出）⇒ **015 所谓"动过该包"只是包重命名，与方言无关**；② runner 端 `dsh-sandbox-windows-acl` 的 012/015 **代码文件 sha256 全部相同**（仅 README 文案重写 ＋ 版本号变）⇒ 上游**也未从"改输出文本"侧修**；③ 全树扫 **12105 个 js/ts**：`DENIAL_SIGNATURES` **唯一一处**、zh-CN 文本 **0 命中** ⇒ **无其他扩展点**；④ **三独立安装点 sha 一致**（本机 `~/.dsh/profiles/sdk` ＋ CVM 两处）= `100c7d169f44da32` ⇒ **非被改副本**；⑤ 修复件依赖的接口**全部仍成立**（`super.confine()` 可调、`ConfinedArgv.denialSignatures` 字段名未变、`STATIC_ENFORCEMENT['windows-acl']='partial'` gate 仍成立、默认导出仍是 provider 类）；⑥ `PLATFORM_CHAINS.win32=['windows-acl']` 单候选不变
  - ⚠️ ~~**附带的真矛盾（待老大定，不在本项范围）**~~ ✅ **该矛盾已解除（2026-09-17）**：原记"**3.7 的落点 home = 工程 `.dsh-home`，实测整体仍是 `0.1.2-rc.1`**"（`larry` / `sdk` 各 94/99 包 = 012；回退层 213/223 = 012；建于 09-09~09-10）⇒ 当时 3.7 的 end-to-end 宿主（client ＋ 工程 home）跑在 012 上。**工程 `.dsh-home/profiles/{larry,sdk}` 已由 Qoder 升 015**（与修前基线 diff 各仅 2 行版本号、composition 未动、两个 lockfile 的 `0.1.2-rc.1` 均 0 次；详见 `docs/local-env.md` §4.3.1 末段）⇒ **宿主与判定基准（主 `~/.dsh/profiles/sdk`，015）已同代**。⚠️ 但「**修复件仍不退役**」的结论**不变**（015 未自修）
  - 📚 详见 `docs/local-env.md` §4.3「015 复核（2026-09-16）」
- [x] ✅ **落盘人已定（老大 2026-09-14）**：先由 **Trae 复跑一次**把 `EPERM` 归因定性清楚，**他通道实测可写则由他落盘**（分配明细见「待派发」段）
- [x] ✅ **落点已定（老大 2026-09-14）**：写**工程 `.dsh-home/profiles/larry/cordis.patch.yml`**（追加）；**不落 `~/.dsh/`**；**`web` profile 不补建**
  - ⛔ **⚠️ 本条已被 2026-09-17 修订**：profile 由 `larry` **改 `sdk`**（同工程 home、同样"追加不是覆盖"）。原判据（真实宿主 = client 启动的 DSH ＋ client 显式指工程 home）**不变且仍有效** —— 变的只是"client 实际用哪个 profile"这一具体值
  - 判据：3.7 的 end-to-end **真实宿主是 client 启动的 DSH**，而 client **显式指工程 home**（`main.rs:291`）⇒ 落全局只能验"手工跑生效"，属**替身路径**；且"手工跑回落全局／client 读工程"正是 09-14 刚定要消灭的重叠环境
  - ⭐ **配套三件（缺一即"落点对了却没生效"）**：① `.dsh-home/.credentials.yaml` **须建**并填 `larry-dev`（`refs.DEEPSEEK_API_KEY`）—— ⚠️ **此处"须建"与另外两处口径冲突**（`client/src-tauri/src/main.rs:275-276` 称凭据**继承本进程 env**；`docs/production-env.md` §12.5 表标"**可选**"）⇒ **改判为待实测项 → 见 3.7.1 ③**（若 client 路径确走 env 注入，则"不带该文件也无 key"不成立）；② 手工复验**须显式注入 `DSH_HOME`**（模板见下）；③ 凡启动 DSH 处**一律显式注入、不靠默认回退**
  - 🔧 **手工复验命令模板**：`cd /d/Code/LarryAgent && DSH_HOME="$(pwd -W)/.dsh-home" node harness/scripts/dsh-prompt.mjs "…"`
    - ⚠️ **`pwd -W` 不是可选的**：Git Bash 的 **env 值不做路径转换**（转换只发生在 argv）⇒ `/d/Code/…` 原样给 Windows node，被 resolve 成 **`D:\d\Code\…`**（当前盘根多一层 `d\`）⇒ DSH **自己新建一个空 home** ⇒ **无 key 假绿、判据全绿**（**与 `cvm-probes` 钉错 home 同形态**）。三写法实测对照 → `docs/production-env.md` §12.7 附二
    - ⛔ **跑 harness 测试时禁止注入真实 home**：`tests/isolated-setup.ts` 强制覆盖为临时目录 + 正向白名单守卫；注入真实路径会触发 `sentinel-failfast` 判 FAIL
  - 🔍 **落盘人待定的实况（2026-09-14 WB 实测）**：Trae 报其通道写 `~/.dsh/profiles/*/cordis*.yml` 被拒 `EPERM` —— ⚠️ **该归因待复核**（09-12 曾出现同类"主体错位"：把 **DSH 自身沙箱**的 EPERM 记成 AI 工具沙箱）；**WB 通道实测可写**（`~/.dsh/profiles/sdk/` 试写成功）。⚠️ **三通道结论不可互推**，Trae 那条须他自己复跑定性
  - ⚠️ 落盘**是追加不是覆盖**：~~`.dsh-home/profiles/larry/cordis.patch.yml` 现有 477 B，**已含一条 `- id: hmr / disabled: false`**~~ ⇒ **2026-09-17 修订**：该面已退役，**落点文件换成 `sdk/cordis.patch.yml`（现为模板空态 `[]`，无 hmr 条目）** ⇒ **"追加"的要害改为"先删 `[]` 再写条目"**
    - ⭐ **追加的正确写法 = 把模板里的 `[]` 那行删掉、换成条目**；**不能**在 `[]` 之后再续 `- id: …`（🟢 2026-09-14 用真实解析器实测：`~/.dsh/profiles/node_modules/js-yaml@4.3.2` 下前者报 `end of the stream or a document separator is expected (2:1)`、后者 OK）。模板文件内容 = 4 行注释 + `[]`（217 B）；工程 `larry` 那份的 hmr 条目就是**已删 `[]`** 的实样
  - 📚 **参考件**：模板的 `dev/cordis.yml` 记了一条开发回路坑 —— **overlay 只加载 host 半边**，`dsh.client` 包级声明发现不了（要测 client 半边必须把包装进 profile）；另：`patch` 是**行级覆盖**非深合并（与本项“追加不是覆盖”互证）；病毒式参照 `WSL & Windows Interop` 整类（37 件，登记表 3.7 行）

##### DSH-3.7.4 · 本机 `s0-e2e` 装置缺陷（`cp -r` profile ⇒ pnpm 虚拟 store 失配） ✅ **已回报并复验（Trae 2026-09-20 交付 ／ WB 同日逐条回源复核：修复成立 ＋ 成因链成立 ＋ 判据未放宽，三项全可采信）**
- 🔎 **复验判定全文**原载交流区 `exchange/log-workbuddy.md`《DSH-3.7.4 ／ DSH-3.7.4-T · WB 复验判定》（**该段已随交流区清理，不可再查**；回溯 `git show 5a1763d:exchange/log-workbuddy.md`）。**本段以下的判据与边界仍是权威落点**。
- 📮 **派发稿**原载交流区 `exchange/log-trae.md`（**已随交流区清理**；回溯 `git show 5a1763d:exchange/log-trae.md`）。派发前 WB 已复核场地**零漂移**：两处 `.modules.yaml` 仍为**绝对** `virtualStoreDir` ／ `harness/.s0-evidence/` 仍**不存在** ／ 行号锚（`:20`/`:92`/`:238`/`:246`/`:327-377`）全对。
- 🗂 **证据登记（仓外）**：Trae `D:\Code\_trae-evidence\374\` ／ Claude `D:\Code\_claude-evidence\374t\` ／ 装置自产 `D:\Code\LarryAgent\.s0-evidence\`（14 件）。
- 🗂 **证据登记（仓外 · T·P）**：Claude `D:\Code\_claude-evidence\374t-p\`（**11 件**，含 CVM 侧原件回传）／ **WB 第三方复跑** `D:\Code\_wb-evidence\374t-p\`（README ＋ 两通道 `t1-results.json` ＋ icacls 原文）。
- ✅ **同业独立测试件 `DSH-3.7.4-T` 已交付并复验（Claude，2026-09-20）⇒ 见本段之后**（两段式 `T-1` ／ `T-2` **均已跑完**）。
- **要回答的一件事**：本机 `harness/tests/s0-e2e.test.ts` **为什么跑不起来**，以及**为什么同一装置在 CVM 是绿的**。
- **现象（可复现 ／ WB 2026-09-17）**：`installPlugin()`（`:92`；`:246` **无条件调用**）在 `cpSync`（`:238`）出的临时 home 副本 profile 上跑 `dsh plugin --profile sdk add …` ⇒ pnpm 报 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`，**在解析依赖之前退出** ⇒ `base` ／ `wrong-key` ／ `no-session-dir` 三变体落红（装置自身负向锚正常，失败**只在插件激活层**）。
- ⭐ **真变量已钉住（WB 双侧实测 ＝ 本轮新证据）**：差异**不在机器、不在 pnpm 版本**（两侧 `packageManager` 同为 `pnpm@11.7.0`），而在 **`.modules.yaml` 里 `virtualStoreDir` 的「记录形态」**：
  | 侧 | 文件 | `nodeLinker` | `virtualStoreDir` |
  |---|---|---|---|
  | 本机 | `harness/node_modules/.modules.yaml` | `isolated` | **绝对** `D:\Code\LarryAgent\harness\node_modules\.pnpm` |
  | 本机 | `.dsh-home/profiles/sdk/node_modules/.modules.yaml` | `hoisted` | **绝对** `D:\Code\LarryAgent\.dsh-home\profiles\sdk\node_modules\.pnpm` |
  | CVM | `~/harness/node_modules/.modules.yaml` | `isolated` | **相对** `.pnpm` |
  | CVM | `~/.dsh/profiles/sdk` ／ `~/larry-dsh-home/profiles/sdk` 的 `.modules.yaml` | `hoisted` | **相对** `.pnpm` |
  ⇒ **相对值跟着副本走、仍自洽（CVM 绿）；绝对值仍指源处 ⇒ 失配（本机红）**。
- ✅ **已定性（2026-09-20，Trae 与 WB 各自独立取证）**：**pnpm 的平台分支** —— `writeModulesManifest` 内（`dist/pnpm.mjs:155114-155116`）`if (!isWindows()) { virtualStoreDir = path.relative(...) }` ⇒ **Windows 写绝对 ／ POSIX 写相对**；读侧 `:155060-155064` 相对值按 `join(modulesDir, …)` 还原（⇒ 跟着副本走、自洽）；两个 throw 在 `:187869`（`UnexpectedStoreError`）／`:187876`（`UnexpectedVirtualStoreDirError`）。**读侧独立验证**：本机三处 `.modules.yaml` 的 `virtualStoreDir` **全为绝对**。⚠️ 另一层是 **pnpm store 按卷回落**（家目录 store 与 `pkgRoot` 跨卷时落 `<盘根>\.pnpm-store\<ver>`）⇒ **换源即在 `.modules.yaml` 上暴出第二个字段差异**（Trae §1.3「自我推翻」的机制）。**机制全文 → `docs/local-env.md` §12.1 ／ §12.2**。
- **影响面（已收紧，勿沿用旧口径）**：全仓 `installPlugin` **只此一处定义**；`s0-resume.test.ts:269` 同样 `cpSync` 但**不跑 pnpm** ⇒ 不受影响；`harness/scripts/cvm-probes/*.sh` 的 `plugin add` 打**非副本** home ⇒ 不受影响。⇒ 准确说法 = 「**本机 `s0-e2e` 跑不起来**」。
- **修法候选（须实测择一，勿凭推理）**：① 复制后**清 `virtualStoreDir`**（或整删 `.modules.yaml` ＋ `.pnpm-workspace-state-v1.json`）让 pnpm 重建；② 改用 `pnpm install` 替代 `dsh plugin add` 建 profile；③ 让 pnpm 写**相对**值（与本机其它树对齐）。
- **判据双锚**：修后 `base` 须**绿**，**同时** `no-bundle` ／ `kill-client` 等变体**仍按其自身期望落位**（**逐件读源码定期望**，⛔ 不得按"组"给口径 —— 见 `dispatch-ai-task` 铁律 17）。⚠️ `harness/.s0-evidence/` **派发前不存在、现已随多轮复跑落盘**；默认证据目录 = `resolve(repoDir,'.s0-evidence')`（`run-s0-e2e.mjs:36`）⇒ ✅ **已答（2026-09-20）**：「本机是否曾完整跑过」= **是** —— Trae 两轮（`run4`／`run5`，真独立运行）＋ Claude 两轮（T-2 独立复跑）＋ WB 三方字段比对，**五变体判据字段三方一致、`verdictText` 逐字符相同**（唯一差异 = 非断言项 `④_bytesAtKill` 与临时目录名）；WB 另**独立复现了 `asis`（修复前）臂的失败签名**（`ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`）。
- **执行人**：**Trae**（装置代码侧）
- **未闭合（转出）· 本块承接清单 —— ✅ 两条均已判定（2026-09-20）**（⚠️ 原仅记第 ① 项，第 ② 项只在 3.7.2 段写了"转 3.7.4"而本块未回填 ＝**双向同步缺口**，2026-09-20 补登）：
  - ① `no-session-dir` 在 Windows 上 `chmod 500` 是否真能令 ④ 变红 ⇒ ✅ **判定：不成立** —— `chmodSync(dir,0o500)` 在 Windows 落成 `0o444`（只翻"只读"属性、**对目录无效**），`writeFileSync`／`mkdirSync` **照常成功**（WB 独立复跑 T-1 臂 1 ＋ 正对照）。⇒ 装置已按平台分支改走 `icacls <dir> /deny <me>:(AD,WD)`（成立、可撤销、幂等）。⚠️ ⛔ **`fs.accessSync(W_OK)` 在 `0o444` 下照样通过 ⇒ 不可当判据**。**POSIX 侧未验**（见处置表 #5）。
  - ② **装置脆弱性（fail-safe 方向）**＝`pwsh` 受限路径下 `unpatched` 态被误判 FAIL（工具返回 `CannotCreateTypeConstrainedLanguage` ＋ `无法运行 node.exe：拒绝访问`，**GBK 乱码** ⇒ 既无 marker、也匹配不到普通失败词）—— 实测**并非偶发**（2026-09-17 全景：**6 次、严格成对**，WB 09-18 取证），由 3.7.2 段「未闭合 7」转入本块判定。⇒ ✅ **判定：不成立** —— WB 逐帧解出 DSH 会话日志的 `tool/result` **原始帧**：`read-only` 臂里 **`Error: EPERM …` 与 marker 一个没少**，约束只打掉 prelude 一行 ⇒ **不存在"假红"**；Trae 的 J6 自我订正**成立**。⚠️ 但「连 `node.exe` 也起不来」那一层**成因仍未定** ⇒ 已**延后**（转出，见本文件「延后（低优先 · 待触发）」段 #3）。
- **未闭合项处置（老大 2026-09-20 裁决 · 逐条）** —— 共 9 条 = Trae §9 五条（#2–#6）＋ WB 补记三条（#1、#7、#8）＋ **Claude 本轮新暴露一条（#9）**。**#1／#7 关闭，#3／#8 延后（已转出），#2／#4／#6／#9 已办，#5 已回报并复核**（跟踪点 = `exchange/log-claude.md` 的 `DSH-3.7.4-T·P`）⇒ ✅ **9 条全部落地、本块无悬空项 —— #1–#9 于 2026-09-20 闭环，#5 于 2026-09-21 回报并复核**。

  | # | 项 | 处置 |
  |---|---|---|
  | 1 | 英文触发的机制未定 | ⛔ **关闭收口** ⇒ 降为规则「语言／编码不得作伪造判据」（`docs/local-env.md` §12.6，含**就地作废**该文 §10.2 末条那条伪判据） |
  | 2 | pnpm 默认 store `D:\.pnpm-store\v11` 的来源 | ✅ **已查清** ⇒ **按卷回落**（hardlink 不能跨卷），**非配置项**（`store-dir` = `undefined`、DSH 包内 0 命中）→ `docs/local-env.md` §12.2 |
  | 3 | J6「连 `node.exe` 也起不来」那层成因 | ⏸ **延后** ⇒ 见「延后（低优先 · 待触发）」段（执行人 **Trae**） |
  | 4 | `runner` 默认源与测试默认源不一致 | ✅ **已统一到一个源** ⇒ `run-s0-e2e.mjs` 默认改 `<repo>/.dsh-home/profiles`（与 `tests/real-api.ts:251` **同源**）＋ 日志标明「来源：env／默认」＋ **源不存在即 `exit 2`**（⛔ 不回落 `~/.dsh`）。⚠️ **由 WB 改**（装置口径修正，+1908 B，**判据零改动**），三条路径**已自证** |
  | 5 | `no-session-dir` 的 **POSIX 分支**未复验 | ✅ **已回报并复核（2026-09-21）** —— 三问**全成立**：① `chmod 0o500` 在 Linux **非 root** 下真拦（`EACCES`／`errno -13`；ext4 与 tmpfs **两通道逐字段一致**，另含 `0o700` 正对照）；② 身份 `uid=1000` **非 root**（**另加 root 对照**把因果坐实：`mode@0o500` 三通道同为 `0o500`、唯一差异是 root 绕 DAC 后写成功）；③ 装置层 `no-session-dir` **真红**（两轮复现，判据字段逐字段一致）。**WB 复核＝独立取物证（非读其结论）**：CVM 现场核**装置三件 sha 逐位一致**、交付件**本机／CVM 双侧 sha 一致**、残留全清、**Windows 侧回归由 WB 现场独立复跑**（三方逐字段比对：70 个业务字段**仅 3 处差异，全为预期**：2 处 base64 内含临时目录名 ＋ 1 处即其自曝的措辞改动）。⚠️ **三处订正（均属表述／计数，非内容不实）**：① 证据件数 **13 → 11**（CVM 与本机双侧皆 11，**未漏回传**，纯计数错）；② 交付件在 **CVM 侧的文件名是 `s0-e2e-destructive-actions-posix.mjs`**（报告写 `.mjs`；CVM 的 `.mjs` 仍是 WB 落位旧版 `9b5e1668…`）—— 附带**正面**结论：**未覆盖落位参考件**（守住了"参考件只读"）；③ 交办项**落点应为 `docs/production-env.md`**（非 `test-env.md`，后者是 WSL 专题），且其「RemoveIPC」**归因未被复现**（WB 实测 `RemoveIPC=no` ＋ 探针跨会话存活 ⇒ 见 `docs/production-env.md` §6 第 9 条，两通道分歧并列留痕）。**验收基准限制（沿用）**：结论**取自 `917f45d` 版树** ⇒ ⛔ 不得当"当前版本"外推；WB 补证：本机新版 `:311` 的 POSIX 分支与该行**行为等价**（仍未在新版树上实跑）。**派发稿／回报 = `exchange/log-claude.md`**（本块已闭环，可按交流区规矩清理）。
  | 6 | `docs/` 承接未回填 | ✅ **已落** ⇒ `docs/local-env.md`：新增 **§12**（12.1–12.8；**12.7 = `TEMP`／`Sys` 语义**，2026-09-20 追加）＋ 就地订正 §8.7 第 4 条（"未实施" → 已实施）＋ 就地作废 §10.2 末条 |
  | 7 | `④_bytesAtKill` 正常区间未定 | ⛔ **关闭（降级）** ⇒ 它**本就不是断言项**（装置只取 `exit=0`）；3 采样 308／649／652 差到 2× ⇒ 降为"仅参考"。真判据化应换**离散判据**（kill 后进程必须消失），不标定字节区间 |
  | 8 | J6 未由 Claude 独立重放 | ⏸ **延后** ⇒ 见「延后（低优先 · 待触发）」段（执行人 **Claude**） |
  | 9 | **Claude 本轮新暴露**（不在 Trae §9 五条内，WB 补登）：`s0-e2e.test.ts` 读 `icacls` 时硬编码 `{ encoding: 'utf8' }` ⇒ **中文 Windows 下该行原文必然乱码入盘** | ✅ **已办（ⓑ，`b82ba4f`）** —— 按 ⓑ 只加注释（写明「中文 Windows 必乱码、⛔ 禁据此行判 ACL」）。原判不变：⛔ **不承载判据**（判据是 `exit=0` ＋ 其后断言，两侧全绿）；但会**干扰日后按该行读"ACL 是否真设上"的人**。归属 **Trae**（装置代码）；ⓐ（ACP 936 解码）**未采纳**，取 ⓑ。⚠️ 与 #5 同一处代码（`no-session-dir` 变体）⇒ **已落地**（`b82ba4f`）|

##### DSH-3.7.4-T · 独立测试件（`s0-e2e` 装置修复的第三方验证） ✅ **已回报并复验（Claude 2026-09-20 交付 ／ WB 同日复核：`T-1` 独立复跑逐条一致 ＋ `T-2` 三方字段比对一致）**
- 📮 **派发稿**原载交流区 `exchange/log-claude.md`（**已随交流区清理**；回溯 `git show 5a1763d:exchange/log-claude.md`）。**判据与边界的权威落点 = 本文件**。
- **为什么要它**：3.7.4 是"修装置"，**修的人自证是盲区**（同 3.7.3-T 的定位：Trae 实现 ／ Claude 独立测试）。且装置里两条**破坏动作**的生效性**从未被判过** —— 它们**没真生效**会造**假红**（看着像"判据抓到了问题"，其实**被测对象根本没被动到**）。
- ✅ **`T-1`（已完成；起跑时不依赖修复、也不经过坏装置）**：
  - `T-1-a` · **`chmodSync(dir, 0o500)` 在 Windows 上是否真能让写失败**（装置 `s0-e2e.test.ts:249-254`，注释写"只读 ⇒ 落盘必失败"）—— 最小装置测语义 ＋ **正对照**（同目录 `0o700` 时写成功）；⛔ 禁用 `accessSync(W_OK)` 当判据（它只查属性位）。
  - `T-1-b` · **负 PID 杀进程组在 Windows 上的行为**（装置 `:200-208`）—— 是**可行**（真带上孙进程 dsh CLI）还是**抛错回落**（只杀直接子进程 ⇒ 孙进程继续写完 ⇒ `kill-client` 变体**假绿**）。核法 = 杀后探孙进程是否还活着。
  - 📎 **与 Trae 的 `J5` 分工**：`J5` 在**装置层**（跑变体看 `logPresent`）／ `T-1-a` 在**机制层**（最小装置测语义）⇒ **互补、非重复**。
- ✅ **`T-2`（已完成）**：五变体独立复跑（`base` ／ `no-bundle` ／ `wrong-key` ／ `no-session-dir` ／ `kill-client`），**逐件**核期望 ＋ 与 Trae 报告**逐条比对**（**不一致即报，不替它解释、不自行折中**）；**证据目录必须另指**（⛔ 不得覆盖 Trae 的证据）。
  - ⚠️ **五条退出码期望全是 `0`**（负向对照由测试**内部断言"该判据变红"**）—— 该口径 WB 已在 3.7.3-T 派稿里错过一次，本稿**已逐件写清**。
- **通道要求（本块尤其重要）**：`T-1-a` ／ `T-1-b` **至少两条通道各跑一次**，结论**分列在各通道上**；两条**不一致就并列留痕、不合并**，⛔ 不跨通道外推。
- **诚实边界** ⇒ ✅ **已满足（2026-09-20）**：`T-2` **已跑**（五变体独立复跑，两轮 5/5）⇒ 本块**可以**下「3.7.4 修复成立」的结论（WB 判定：**可采信**）。
- **执行人**：**Claude**（纯测试定位）；场地 = 本机。

##### DSH-3.7.5 · 旧代残留载体处置（`(b)` CVM 012 代参照 profile ／ `(c)` 工程共享层 241 条 junction） 📌 **立项（老大 2026-09-17 裁「两项单开」）· `(b)` 已裁「删」并已执行（含 `acp` 扩围 ／ `explicit` 分支退役）⇒ 已闭环 · `(c)` 待裁（仍在 `TODO.md`「待派发」段）**
> ⚠️ **本段是 `(b)` 的完成态快照**（判据 ／ 派发实况 ／ WB 复验 ／ 派发前重测前提）；**`(c)` 的待裁条与共享层结构性事实仍留在 `TODO.md`「待派发」段**（活条目），本段不复述 `(c)` 的处置状态。来源 = `DSH-3.7.3` 未闭合项 6。
> 📮 **派发稿 ＋ 回报 = `exchange/log-qoder.md`**（**已按交流区规矩清理，2026-09-22**；回溯 `git log -p -- exchange/log-qoder.md`）。**判据与边界的权威落点 = 本文件**。
- **要回答的一件事**：3.7.3 只清了**引用者**（依赖声明 ＋ lock），**被引用者（旧代本体）是否还有活着的载体**、要不要处置。
- ⭐ **`(c)` 已实质归位（WB 2026-09-17 实测，订正原登记）**：工程共享层 `.dsh-home/profiles/node_modules` 下 `@deepseek-ai/` **241 条 junction 逐条有效、悬空 0**（`st_reparse_tag = 0xa0000003`）；关键三件 `dsh-sandbox-local` ／ `dsh-sandbox-windows-acl` ／ `dsh-storage-domain` **均不直指某一支**，而是指向 `.pnpm/node_modules/@deepseek-ai/*` **汇总层**，该汇总层现只解析到**唯一存活**的 `0.1.5-rc.2`（实测分片 `@deepseek-ai+dsh-sandbox-lo_afd5a527…` 的 `package.json` = `0.1.5-rc.2`；旧支 `@deepseek-ai+dsh-sandbox-lo_fc402b20…` **已随 3.7.3 ① 消失**）⇒ **"镜像旧代"的实质已自动解除**。
  - ⚠️ **但暴露一条结构性事实（值得登记）**：该共享层**不是独立副本，是 `harness/node_modules/.pnpm` 的派生视图**（241 条 junction 目标全为 `harness/…` 的**绝对** junction）⇒ **harness 树一旦重装 ／ 换路径，这 241 条就有悬空风险**。⇒ 处置选项应从「清 241 条」改为「**要不要让它与 harness 树解耦**」，属架构选择、非清理动作。
- ✅ **`(b)` 已裁（老大 2026-09-18）＝ ③ 删** ｜原记待裁三选项：① **升 015**（对齐 3.0.4 的处置）；② **保留作负向对照器材**（`docs/production-env.md` 已将其降级为"有完整 profile、无凭据"的对照件）；③ **删**。
  - **处置对象**：**CVM** `/home/ubuntu/larry-dsh-home/profiles/sdk`（实测**仍整体 012 代**：`dsh-base` ／ `dsh-sdk-app` ／ `dsh-storage-sqlite` 三件全 `0.1.2-rc.1`）。
  - ⚠️ **边界（照 3.7.3 同类处置的既有先例）**：只删**该 profile 目录**；**`~/larry-dsh-home` 本身不动**（它的其余内容 —— `sessions` ／ `storages` ／ 其它 profile —— **不在本裁范围内**）。⛔ **删前须先核「该 profile 是否仍被引用」**（`docs/production-env.md` 已记 `~/larry-dsh-home` 降级为**负向对照器材、不是运行 home**；但 `harness/scripts/cvm-probes/*.sh` 历史上钉过该 home ⇒ **须实测确认无脚本仍把它当运行 home**，照抄旧登记会踩 3.0.3 那个坑）。
  - ⚠️ **附带的跨代隐患随删除一并消失**：其 deps 里 `@larryagent/plugin-storage-probe` 是 `link:/home/ubuntu/harness/packages/plugin-storage-probe`，而 CVM `~/harness` 已升 015 ⇒ **012 profile 挂着 015 侧的 link**（3.0.3 混代形态的同类）—— 删后该隐患**自动解除**，**无需再单独判**。
  - 📌 **已执行（2026-09-22）**（原记：老大 2026-09-18「先不派，今天休息」⇒ 派发稿未写）；按 3.7.3 同类先例走（**先重命名备份 → 核验 → 真删**，⛔ 禁用 `rm -rf`）⇒ ✅ **实际手法 = 同分区 `mv`**（→ `sdk.bak.20260922-0948`，`rc=0`；备份内三件仍 `0.1.2-rc.1`、备份体积与删前对同路径读数**逐字节相同**）。
- 📮 **派发实况（2026-09-22）**：**`(b)` 已派发并已回报**（**CVM ／ Qoder**）—— `(b)` 自述闭合（`sdk` 真删：同分区 `mv` 到 `sdk.bak.20260922-0948`，`rc=0`、全程无 `rm -rf`）；⚠️ **§2-P2 两条待裁同日由老大裁 (A) 并已执行**（① `profiles/acp` 一并删 → `acp.bak.20260922-1007`；② `explicit` 分支退役改脚本 → `ba3e42e`，双侧 sha256 一致 ／ 纯 LF）。
- **场地**：CVM（`(b)`）＋ 本机只读复核（`(c)`）｜ **执行人**：环境整理类，历史归口 **Qoder**（**老大 2026-09-22 定**；与 Trae 不撞工位）
- ✅ ⭐ **WB 复验判定（2026-09-22 · ssh(Bash) 通道 CVM 现场独立取证）＝ 判定成立 · 回报可采信**
  - **独立取物证（非读其结论）**：① `sdk` ／ `acp` 原路径 `test -e` **均为假** —— `profiles/` 现为 `acp.bak.20260922-1007` ／ `node_modules` ／ `sdk.bak.20260922-0948`；② 备份内版本**实读** = sdk 三件（`dsh-base` ／ `dsh-sdk-app` ／ `dsh-storage-sqlite`）＋ acp 两件（`dsh-base` ／ `dsh-acp-app`）**全 `0.1.2-rc.1`**；③ 备份体积 `du -sb --count-links` = **161469045** ／ **167075668**（与自述**逐字节相同** ⇒ 纯重命名、无拷贝损耗的形态与之相容）；④ `~/larry-dsh-home` 顶层四项均在，`sessions` ／ `storages` ／ `.anonymous-user-id` 的 `size` ＋ `mtime_epoch` **与自述逐项相同**；⑤ `find ~/.dsh -newermt 09:40(+08:00)` = **0** —— ⚠️ **锚比原稿的 09:48 更早 ⇒ 结论更强**（活 home 在**整个动作窗内**未被触碰）；⑥ 四根链接 **3582 ／ 悬空 26**；⑦ 共享层 **486 ／ 97 ／ 命中 012 分片 71**（WB 以 `readlink` 逐条匹配**独立复算**，与自述一致）；⑧ 证据包 **22 件**；⑨ `~/larry-data/larry.db` **57344 B ／ mtime `09-16 18:47` 未动**。
  - ⭐ **WB 加做一条比原判据更硬的判据**：遍历四根链接**逐条 `readlink`** ⇒ **无任何链接指向 `larry-dsh-home`** ⇒ **删除这两个 profile 在结构上不可能新增悬空**（该结论**不依赖"删前计数"**，绕开了对执行方单方读数的依赖）。现存 26 条悬空**全部落在 `~/harness/node_modules/.pnpm/node_modules/`**（React ／ Lexical ／ `node-addon-landlock-run` 等）⇒ 与本块动作无关。
  - **裁决② 双侧独立核**：本机 ／ CVM `cvm-step0.sh` **sha256 同为 `f2e15f35…`**（逐字节一致，本机侧取自 `ba3e42e`）、**CR 字节双侧 0**（纯 LF）；**WB 实跑 `explicit` ⇒ `EXIT=3`** ＋ stderr 三行退役说明 ＋ **`/tmp/step0.*` 均不存在** ⇒ **拒绝发生在任何探针动作之前**；脚本内注释已写明「⛔ 不得删掉本分支 —— 会 fallthrough 到 `unset DSH_HOME`、**静默在真实库 `~/.dsh` 上跑探针**」。
  - **诚实边界（本复验结论的适用面）**：① **J6「全程无 `rm -rf`」的手法取自执行方自述** —— 现场证据（原路径消失 ＋ 备份存在 ＋ `du` 逐字节相同 ＋ 备份目录 mtime = 动作时刻）与之**相容**，但**不可独立证否**；② **J7 到期日读不到** ⇒ 按登记 `2026-10-09`（WB 通道同样读不到）；③ **"删前"读数取自其证据包（非独立）** —— 但已由上面那条更硬的结论**绕开**。
  - **对其自曝的核**：§3-2 自曝「首轮用 `find -L` 计数等价于重复计悬空数（97）、正确应为 71」**成立**（WB 独立得 71）；§3-3「P2② 无害试跑**不可做**」的理由链（跨代组合可能触发 profile 层 heal 而**写盘到待备份的那棵**、污染 J2 物证）**成立**，且裁决② 落地后已用退役脚本实跑补上确定性结论；§3-1 ／ §3-5 ／ 新增自曝（`$"\r"` 是 gettext 引用**不是 CR**）三条，WB 均**无异议**（CR 侧已独立复核为 0）。
  - ⚠️ **一句话**：`(b)` 本块**可判闭环**；但 ⛔ **不得据此声称「CVM 上 012 代残留已清干净」** —— 共享层 486 ／ 97 ／ 71 **仍在**（原判据 J5② 的诚实边界，复验同样守）。
- ⭐ **派发前重测前提（WB 2026-09-22 · ssh(Bash) 通道实测）⇒ 3 条新事实 ／ 缺口**：
  1. ✅ **旧登记成立**的：处置对象仍存在 ／ 三件仍全 `0.1.2-rc.1` ／ CVM `~/harness` 已升 `0.1.5-rc.2`（`.pnpm` 内 012 分片**已不存在**）／ 跨代 `link:` 仍在。
  2. ⚠️ **新缺口 ①（范围）**：同 home 的 **`profiles/acp` 也是 012 代**（`dsh-base` ／ `dsh-acp-app` = `0.1.2-rc.1`，**159 MB**）—— 原登记未列为处置对象 ⇒ **`(b)` 是否扩围 = 待老大裁**（WB 倾向一并删）⇒ ✅ **同日已裁 (A)：一并删，当日执行完毕**（→ `acp.bak.20260922-1007`，`rc=0`）。
  3. ⚠️ **新缺口 ②（"无脚本仍引用"不成立）**：`harness/scripts/cvm-probes/` **6 处**命中该 home —— 5 处注释 ＋ **1 处活赋值**（`cvm-step0.sh:13` 的 `explicit` 分支，自述定位 =「仅作负向对照器材」）；**且该分支实测已失效**（该 home 的 CLI 入口 `@deepseek-ai/dsh` 链接**已悬空**）⇒ 「负向对照器材」这一定位在删除**之前**就已不成立。**脚本要不要跟着改 = 待老大裁**。⇒ ✅ **同日已裁 (A)：删 profile ＋ 改脚本** —— 落地为「**显式拒绝 ＋ `exit 3`**」（⚠️ **不是移除分支**：移除后会 fallthrough 到 `unset DSH_HOME`、**静默在真实库 `~/.dsh` 上跑探针**），本机 ／ CVM 双侧 sha256 一致 ／ 纯 LF（`ba3e42e`）。
  4. ⚠️ **新缺口 ③（同族载体）**：该 home 的 `profiles/node_modules` 共享层 **486 条链接 ／ 97 条悬空**（其中 **71 条**指向已消失的 `@deepseek-ai+dsh@0.1.2-rc.1` 分片）—— 原登记只核了**本机**的 241 条（悬空 0），**CVM 侧从未核过**。
  5. 📌 **体积（统一口径 `du -sb --count-links`）**：`~/larry-dsh-home` 总 **313 MB**（`sdk` **153** ／ `acp` **159** ／ 共享层 **40 KB**）；该机余量 `39 GB ／ 50 GB` ⇒ **删除价值不在省空间**，在消除旧代载体的误用风险。
