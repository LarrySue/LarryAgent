# LarryAgent TODO

## 当前待办

### 记忆系统调优

- [ ] 检索参数调优（`memory/engine.py::get_long_term_memory`）：score_threshold 当前基线 0.3（从 0.5 下调，因短查询 vs 结构化摘要相似度仅约 0.36），top_k=5；后续根据实际使用中的召回质量进一步调整，必要时可按 source_role 分级设阈值
- [ ] 记忆保鲜机制：memories 表预留 last_hit_at / priority 字段，需实现降权与淘汰策略
- [ ] 向量同步补偿：ChromaDB 恢复后，自动检测 SQLite 中有但 ChromaDB 中缺失的记忆，补写向量数据（`memories` 表可加 `vector_synced` 标记）
- [ ] 更换 Embedding 模型时需配套迁移脚本（重建 ChromaDB collection + 全量重索引）

### 多场景 AI 架构

- [ ] 工具动态注入：按角色过滤可用工具组，避免 prompt 膨胀和选择困难 — P2（依赖 function calling）
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

> Agent 能调用文件和 Shell

- [ ] 完成 FileOpsTool：路径沙箱校验 + 读/写/列目录
- [ ] 完成 ShellTool：实际执行命令 + IP 白名单注入
- [ ] `/api/chat` 加入 function calling 循环（LLM → tool → LLM）
- [ ] 实现 `/api/tools` 列表和手动执行接口

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
