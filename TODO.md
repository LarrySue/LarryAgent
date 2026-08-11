# LarryAgent TODO

## 当前待办

### 记忆系统调优

- [ ] 检索参数调优（`memory/engine.py::get_long_term_memory`）：score_threshold 当前基线 0.3（从 0.5 下调，因短查询 vs 结构化摘要相似度仅约 0.36），top_k=5；后续根据实际使用中的召回质量进一步调整，必要时可按 source_role 分级设阈值
- [ ] 记忆保鲜机制：memories 表预留 last_hit_at / priority 字段，需实现降权与淘汰策略
- [ ] 向量同步补偿：ChromaDB 恢复后，自动检测 SQLite 中有但 ChromaDB 中缺失的记忆，补写向量数据（`memories` 表可加 `vector_synced` 标记）
- [ ] 更换 Embedding 模型时需配套迁移脚本（重建 ChromaDB collection + 全量重索引）

### 多场景 AI 架构

- [ ] 意图识别机制：对话开头快速分类用户意图（关键词匹配或轻量 LLM 调用），自动切换角色 — P2
- [ ] 跨域关联能力：记忆检索不限制单一领域，允许 AI 发现跨场景因果链（如工作压力 → 睡眠差 → 健康下降）— P3
- [ ] 用户画像沉淀：从记忆中提炼结构化用户画像，注入所有场景 system prompt — P3
- [ ] 场景间信息同步策略：明确哪些记忆全局共享、哪些领域私有 — P3

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

配置化：`_workspace_root` 从 `config.yaml` 的 `tools.file_ops_workspace` 读取，默认 `~/larry_workspace`。9 项端到端测试通过（2026-08-10）。

**P2.2 - ShellTool 实现**

- [ ] `asyncio.create_subprocess_shell` 执行，`communicate()` 读 stdout/stderr
- [ ] 30s `asyncio.wait_for` 超时；`except asyncio.TimeoutError` 中显式 `proc.kill()` + `await proc.wait()`，防止僵尸进程（`wait_for` 只取消协程不杀子进程）
- [ ] `working_dir` 参数生效
- [ ] 高危命令黑名单检测（已有 `_blocked_patterns`）
- [ ] IP 白名单：从 `config.yaml` 的 `tools.shell.allowed_ips` 读取，默认 `["127.0.0.1", "::1"]`。校验逻辑下沉到 `ShellTool.execute()` 内部，从 `kwargs` 接收 `caller_ip` 比对。function calling 循环和 `/api/tools/execute` 调用时各自从 `request.client.host` 取 IP 传入，防止 LLM 诱导绕过路由直接调 `tool.execute()` 的路径

**P2.3 - Function Calling 循环（/api/chat）**

> P2 核心。改造 `/api/chat` 的 LLM 调用段。

- [ ] 把 `get_openai_tools()` 返回的 schema 注入 LLM 请求的 `tools` 参数
- [ ] LLM 返回后检测 `finish_reason == "tool_calls"`
- [ ] 解析 `tool_calls` → 从 registry 取工具 → `await tool.execute(**args)`，记录每个 tool_call 的 `id`
- [ ] 把 tool result 作为 `role: "tool"` 消息追加到 messages，**必须带 `tool_call_id`**（来自原 tool_call 的 `id` 字段），否则 OpenAI API 返回 400
- [ ] 循环直到 LLM 返回 `finish_reason == "stop"`（纯文本）
- [ ] 最大轮次限制（默认 10），防止死循环
- [ ] 工具按角色过滤（工具动态注入）：在 function calling 循环里按 role 过滤 `get_openai_tools()` 返回结果，避免无关工具的 schema 膨胀 prompt。role→tools 映射写入 `config.yaml`
- [ ] 每轮 tool call 记录日志
- [ ] 注：后续可加 token 累计上限（单次对话 tool call 总 token 阈值），防止单轮读大文件等场景暴增。当前仅轮次限制
- [ ] 前置依赖：`llm.py::chat_completion` 目前返回 `str`，需要改为接受 `tools` 参数并返回 `(content, tool_calls)` 或更丰富的结构，否则 function calling 循环无从判断 LLM 是否要调工具
- [ ] 前置依赖：`messages` 表虽有 `tool_calls` 列，但 `insert_message` 不写入、`get_messages` 不返回；需补 `tool_call_id` 列（tool 消息匹配用），并更新 CRUD。否则会话恢复时丢失工具调用上下文
- [ ] 重构 chat.py：当前路由函数包含完整的业务流程（会话创建→存消息→检索记忆→调 LLM→存回复），加入 function calling 循环后会更膨胀。抽 service 层（如 `services/chat_service.py`），API 层只做参数校验和调用

**P2.4 - /api/tools 接口实现**

- [ ] `GET /api/tools`：调用 `list_tools()`，返回 `[{name, description, parameters, enabled}, ...]`
- [ ] `POST /api/tools/execute`：从 registry 取工具 → `tool.execute(**req.params)`

**P2.5 - config.yaml 扩展**

- [ ] 新增 `tools` 配置段：
  ```yaml
  tools:
    file_ops:
      workspace: "~/larry_workspace"
    shell:
      allowed_ips: ["127.0.0.1", "::1"]
      timeout: 30
    function_calling:
      max_iterations: 10
  ```

**P2.6 - 端到端测试**

- [ ] 单工具调用：让 LLM 读一个已知文件，验证返回内容
- [ ] 多工具串行：先 `list` 目录再 `read` 其中某个文件
- [ ] Shell 工具：执行 `echo hello`，验证 stdout
- [ ] 沙箱拒绝：尝试 `../` 路径，验证返回 error
- [ ] 黑名单拒绝：尝试 `rm -rf /`，验证被拦截
- [ ] 循环上限：构造一个永远要调工具的场景，验证在第 N 轮截断
- [ ] API 层：`GET /api/tools` 返回列表；`POST /api/tools/execute` 手动调工具

### P3 - 流式 + 体验优化

> 打字机效果、Token 统计、错误处理

- [ ] `/api/chat/stream` SSE 流式实现
- [ ] LLM 调用加重试（tenacity 或自写重试逻辑）
- [ ] 加 token 用量统计
- [ ] 默认 host 改 `127.0.0.1`，增加可选 API Key 校验
- [ ] 自定义业务异常类

### P4 - PC 客户端可用

> 双击图标直接用

- [ ] 选前端框架（推荐 Vue 3 + Vite，轻量）
- [ ] 聊天界面：会话列表 + 消息区 + 输入框
- [ ] Tauri Rust 端：拉起 uvicorn → health check → 显示窗口
- [ ] 窗口关闭时 kill Agent 进程

### P5 - 移动端 + 部署

> 手机浏览器可访问

- [ ] 响应式 UI 或独立 `mobile/index.html`
- [ ] Nginx 部署脚本示例（静态文件 + API 反代）
- [ ] PWA manifest + Service Worker（可选）
- [ ] 部署文档 + 安全加固
