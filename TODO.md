# LarryAgent TODO

## 当前待办

### 记忆系统调优

- [ ] 检索参数调优（`memory/engine.py::get_long_term_memory`）：长期 — 根据实际使用中召回质量持续调整 score_threshold / top_k / 分级阈值
- [ ] 向量检索上下文扩展 → **已归入 P3 记忆系统调优**
- [ ] 记忆保鲜机制 → **已归入 P3 记忆系统调优**
- [ ] 向量同步补偿：长期 — ChromaDB 异常恢复后自动校验 SQLite ↔ ChromaDB 一致性并补写缺失向量
- [ ] Embedding 模型迁移脚本：长期 / 待触发 — 更换模型时重建 collection + 全量重索引
- [ ] `llm.py::_resolve_provider_key` → **已归入 P3.0 前置修补**

### 多场景 AI 架构

> 以下为长期架构愿景，当前 P0-P3 仅支持手动切换角色，自动意图识别和跨域关联留待后续迭代。

- [ ] 意图识别机制：长期 — 对话开头快速分类用户意图，自动切换角色
- [ ] 跨域关联能力：长期 — 记忆检索不限单一领域，允许 AI 发现跨场景因果链
- [ ] 用户画像沉淀：长期 — 从记忆中提炼结构化用户画像，注入 system prompt
- [ ] 场景间信息同步策略：长期 — 定义全局共享 vs 领域私有的记忆边界

### 工程债务（需要重新考虑）

- [ ] **存量测试债务是否修复**：`test_chromadb_degradation.py`（mock 了已不存在的 archiver.get_db）、`test_integration_llm.py`（缺 pytest-asyncio）、`test_shell_tool.py::test_windows_dir`（中文 Windows 编码断言）。选项 A：修复恢复"全套绿"基线；选项 B：维持"相关测试 + 已知项甄别"现状。当前规则以 B 运转（见 CLAUDE.md/TRAE.md 测试环境段）。此事不是很急，找个合适的机会讨论一下

### 对于AI的约束条件/提示词/注意力/配置文件等的一致性调整

- Marvis情况特殊，不纳入自查和调整
- Claude和Trae已经完成约束一致性改写，除非后续观察到其他问题，否则视为完成。
- WorkBuddy经过初步的一致性调整，已经取得了可见的效果，一些可能不完善的点依然记录在下边（但标记为完成），后续会继续观察并调整。

> WorkBuddy 自查发现的张力点（2026-08-14 初版，2026-08-15 复审更新）

- [x] ~~**CoT 过度纠结根因 = 四条并行准则冲突**~~ → 已解决。「表达与决策协议」已写入 MEMORY.md 并经用户确认；用户观察"基本没有了纠结"，观察锚点已建立（见 2026-08-15 日志）。

- [x] ~~**安全底线强制语气 vs 正向改写取舍未锁定**~~ → 已解决。MEMORY.md 改写时已执行"安全底线保留强制语气"原则（不输出 key、锚点保护未转正向）；用户确认"先保持"。

---

## 开发路线图

按依赖顺序分 6 个阶段，每个阶段形成可运行的闭环。

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

- [ ] ShellTool 黑名单已知可绕过（字符串包含匹配，`rm -rf  /`、`rm --recursive --force /`、`find / -delete` 等变体均可穿透）。当前安全依赖 IP 白名单（仅 `127.0.0.1`/`::1`）兜底，单人本机使用场景下攻击面极小。不做主动修复，后续若放开 IP 白名单（如 P5 局域网部署），须先将黑名单升级为正则/词法解析或换用沙箱方案。

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
- [ ] 注：后续可加 token 累计上限（单次对话 tool call 总 token 阈值），防止单轮读大文件等场景暴增。当前仅轮次限制。本条目优先级很低，不做主动处理，后续若出现与此条目相关的问题，再考虑是否需要完善，完善前先进行充分讨论，任何情况下不静默自动处理。

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

#### 记忆系统调优（P3 中后期）

- [ ] `engine.py` 向量检索上下文扩展：archive 中同一 memory_id 的相邻 chunk 在命中时一并拉出合并，避免 LLM 看到被截断的片段
- [ ] `search()` score_threshold 分级：不同来源检索用不同阈值
- [ ] 记忆保鲜机制：`last_hit_at` / `priority`，被频繁检索的记忆提升保留权重

### P4 - PC 客户端可用

> 双击图标直接用
>
> **技术路线裁决（2026-08-15）**：Tauri（骨架已备 `client/`、真 exe 双击即用、体积小），否决 pywebview（无独立 exe，依赖本机 Python 环境）与 Electron（过重）。
> **P4 详细计划三方评审完成**（Trae/Claude/Marvis 意见已吸收，见 exchange/workbuddy.md），Q1–Q8 定案：Q1 裸 python+spawn 前探测（Windows Store stub 坑）/ Q2 首条消息截取前 20 字符 / Q3 角色切换 UI 做 / Q4 归档入口不做 / Q5 用 `CARGO_MANIFEST_DIR` 编译期推导绝对路径（不依赖 working directory）/ Q6 chat.html 保留作调试工具 / Q7 响应式设计 P4 一次做对，mobile/ 暂不动 / Q8 系统托盘不做。

**P4.1 - Tauri 进程管理（Rust 侧）**（2026-08-15 派发：Trae 实现 / WorkBuddy 复验通过）

- [x] `main.rs` 实现 `spawn_agent()`：`Command::new(python_path).args(["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"])`，backend 路径从 `CARGO_MANIFEST_DIR` 编译期常量推导，不依赖 working directory
- [x] Python 探测：spawn 前先 `python --version` 检测（Windows Store stub 会静默失败），失败再试 `py -3`，给清晰错误提示
- [x] `setup` 钩子：先对 `http://127.0.0.1:8000/health` 做签名校验（响应体含 `version` 字段，防 8000 被其他服务占用时假阳性）——已跑则复用（dev mode，同时解决端口冲突），未跑再 spawn
- [x] 轮询 health check：500ms 间隔，超时 30s 报错
- [x] `AgentProcess` state 注入 Tauri，持有 `Child` 句柄；暴露 **restart 能力**（kill + respawn + 重新 health check，P4.5 依赖）
- [x] `on_window_event(Destroyed)`：只 kill 自己 spawn 的 child（防误杀），kill + wait
- [x] 后端崩溃感知：后台线程每 5s health check，状态变化时 emit `"backend-status"` 事件给前端（payload: `{status, error?}`），前端提示而非白屏
- [x] 注意：用 `/health` 而非 `/api/health`（前者不被 AuthMiddleware 拦截，无需 API key）

**P4.2 - 前端项目搭建（Vue 3 + Vite）**（2026-08-15 派发：Trae 实现 / WorkBuddy 复验通过）

- [x] `client/` 下初始化 Vue 3 + Vite + TypeScript
- [x] `vite.config.ts`：dev server 端口 5173、proxy `/api` + `/health` → `http://127.0.0.1:8000`、strictPort（端口被占用报错而非换端口）
- [x] 基础布局 `AppLayout`（左侧栏 + 主区域），响应式（768px 断点，移动端汉堡菜单）
- [x] 路由：`/`（聊天）、`/settings`（P4.5 填充），懒加载
- [x] 全局状态：当前会话 ID、会话列表、连接状态（Pinia）
- [x] `package.json` 更新：vue、vue-router、vite、typescript、pinia、vue-tsc
- [x] 验证 `npm run build` 通过（vue-tsc 类型检查 + vite build 41 模块）。⚠️ tauri dev 实际窗口启动链路待真机验证（需 GUI 环境）

**P4.35 - 界面基调定义**（2026-08-15 派发：Marvis 出初稿 / UI Designer 精化 / 老大审定 — ✅ 完工）

- [x] 产出一页设计约定：布局结构（左会话栏 + 右消息流）、配色基调（暗色为主，灰阶 + 交互锚点色 #378ADD）、字体（中文系统字体优先 + Inter fallback）、组件风格（5 个核心组件规格 + 边界状态 + WCAG AA 合规）
- [x] 定案多角色差异化呈现方案：default=亮中性灰 #9CA3AF / health=低饱和翠绿 #34D399 / finance=低饱和琥珀 #FBBF24；色点+问候语+AI 气泡色带+工具卡片 header 色，不做三套换肤
- [x] Logo 定案：C2 写意版（毛笔三笔 + 禅圆缺口 + 朱红点），老大拍板"外圈缺口是灵魂"
- [x] 完整 design token 体系（配色 / 排版 / 间距 / 圆角 / 过渡动画 5 类 token）+ 组件详细规格（MessageBubble / ToolCallCard / ChatInput / SidebarItem / TopBar）+ 响应式断点体系 + 边界状态设计 + Accessibility
- [ ] Trae 的 P4.4 组件按此基调实现

**P4.3 - 会话管理 API（后端补全）**（Trae 实现 / Claude 测试 / WorkBuddy 复验 ✅）

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

**P4.4 - 聊天界面（Vue 组件）**（待 P4.3 + P4.35 后派发：Trae 实现 / Claude 审查）

- [ ] `ConversationSidebar.vue`：会话列表 + 新建 + 删除 + 选中高亮
- [ ] `MessageList.vue`：消息气泡（user/agent/error）+ 自动滚动；过滤 role="tool" 消息
- [ ] `ToolCallCard.vue`：工具调用卡片（spinner→✅/❌ + 参数 + 结果摘要），从 chat.html 移植
- [ ] `ChatInput.vue`：Enter 发送 / Shift+Enter 换行 + 禁用状态
- [ ] `ModelSelector.vue`：从 `GET /api/models` 拉取列表
- [ ] `RoleSelector.vue`：角色切换下拉（health/finance/default），传 role 给 `/api/chat`
- [ ] `StatusBar.vue`：连接状态 + 当前会话 ID + token 统计
- [ ] SSE composable `useChatStream`：移植 chat.html 的 `consumeSSEStream` + `parseSSE`
- [ ] 会话切换：侧栏点击 → 加载历史 → 切换 conversation_id
- [ ] 错误处理：网络错误 / 后端 500 / SSE error 事件统一展示（解析 JSON 错误响应）
- [ ] 前端请求带 `Authorization: Bearer <key>`（P3.4 兼容，key 留空时不带——别把鉴权坑留给 P5）

**P4.5 - 首次启动引导 + 配置入口**（待 P4.4 后派发：Trae 实现）

- [ ] 检测 `backend/config.yaml` 是否有 `models.<provider>.api_key`（⚠️ 不是 `llm.api_key`，真实 schema 按 provider 段；检测与写入逻辑须与 P4.1 用同一路径基准）
- [ ] 无 key：引导页输入 API key → Tauri IPC → Rust 写入 config.yaml（**写入前先备份 `config.yaml.bak`，失败回滚**）→ 调用 P4.1 restart 重启后端（uvicorn 不热重载 yaml）
- [ ] 有 key：直接进主界面
- [ ] `/settings` 页放"打开配置文件"按钮（`tauri-plugin-shell`），改完提示需重启

**P4.6 - P3.5 遗留增强：异常出口统一**（Trae 实现 / Claude 更新测试 / WorkBuddy 复验 ✅）

- [x] `main.py` 新增 `@app.exception_handler(Exception)` 兜底 handler：server 端记完整 traceback，客户端返回 `{error: "INTERNAL_ERROR", detail: "Internal server error"}`（不泄漏内部信息）
- [x] 测试：非 LarryException 未预期异常 → JSON 格式（非 Starlette 纯文本 500）
- [x] Claude 同步更新 `test_exceptions.py::TestUnexpectedException` 断言（body 从纯文本变 JSON，Claude 自己的文件自己改）

### P5 - 移动端 + 部署

> 手机浏览器可访问

- [ ] 响应式 UI 或独立 `mobile/index.html`
- [ ] Nginx 部署脚本示例（静态文件 + API 反代）
- [ ] PWA manifest + Service Worker（可选）
- [ ] 部署文档 + 安全加固

P5 局域网访问时必须启用（硬性前置：改 `host: 0.0.0.0` 前须先 set `server.api_key`），当前本机使用可空。

**上云前架构债清算（P5 前置，记账不追债，2026-08-12 确认）**

- [ ] 记忆隔离：长期记忆检索按 `source_role` 加权（软隔离），多场景角色记忆分离
- [ ] 边界侵蚀：工具消息与对话消息分离（`tool_calls` / `tool_call_id` 不再写入 `messages` 表）
- [ ] shell IP 白名单重构：`127.0.0.1` / `::1` 白名单与公网访问不兼容，上云前改为 API Key 鉴权为主

> AI 交流讨论区已迁移至 `exchange/` 目录（各 AI 独立文件，各自区域只有自己能修改，特殊：workbuddy有权在claude和trae的文件中通过新增内容的方式派发任务）。人类治理区迁移至`HUMAN.md`文件 