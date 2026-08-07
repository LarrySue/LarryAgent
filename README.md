---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 44c052101e5e236a5489b447016cb8fe_e06cb46f90db11f1bcfc525400e6dd8f
    ReservedCode1: x+PpQkJYUPhRuNBhtKYcT/JoQtDbH+WDpP3heoM3Fk1J0OX/OMTVFwPSTzMwtM5ZvoQaMvzaVWt3v0599pUjCn6/3RwJ/+3PR1BeE0GY84PLvHp1e+sHVwaffimbelgHmWwpLU6UEFebzw2kd6LgtJ5+g5t3+GGv3/dApKyN6Q3a+ySrxFRqdD7ujdA=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 44c052101e5e236a5489b447016cb8fe_e06cb46f90db11f1bcfc525400e6dd8f
    ReservedCode2: x+PpQkJYUPhRuNBhtKYcT/JoQtDbH+WDpP3heoM3Fk1J0OX/OMTVFwPSTzMwtM5ZvoQaMvzaVWt3v0599pUjCn6/3RwJ/+3PR1BeE0GY84PLvHp1e+sHVwaffimbelgHmWwpLU6UEFebzw2kd6LgtJ5+g5t3+GGv3/dApKyN6Q3a+ySrxFRqdD7ujdA=
---

﻿---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 44c052101e5e236a5489b447016cb8fe_51c91de390db11f1bcfc525400e6dd8f
    ReservedCode1: X7/FGzx9TfkkyK14QM5qPcKGezMpnBD8uLb+IxEpdb2o0gvcnz4VNkk44ASth8Of03ebb86jXT3iGu3+1cTA8oJfr0MLF+gPnCpPq7a9QL9N/ePgBVIZjjtd9hIVhsDlN70x27xxDxyYYmb3l12GKPl+qYRIOwJNaQQa59QNGe78eEzsTOtXkEWMDOE=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 44c052101e5e236a5489b447016cb8fe_51c91de390db11f1bcfc525400e6dd8f
    ReservedCode2: X7/FGzx9TfkkyK14QM5qPcKGezMpnBD8uLb+IxEpdb2o0gvcnz4VNkk44ASth8Of03ebb86jXT3iGu3+1cTA8oJfr0MLF+gPnCpPq7a9QL9N/ePgBVIZjjtd9hIVhsDlN70x27xxDxyYYmb3l12GKPl+qYRIOwJNaQQa59QNGe78eEzsTOtXkEWMDOE=
---

# LarryAgent

个人 AI Agent，技术栈：**Python FastAPI + SQLite + ChromaDB + Tauri + HTML5**。

## 项目结构

```
LarryAgent/
├── backend/           # Python 后端（FastAPI + SQLite + ChromaDB）
│   ├── main.py        # 入口文件
│   ├── config.yaml    # 配置文件
│   ├── models/        # LLM 路由 + Embedding
│   ├── db/            # 数据库层
│   ├── rag/           # 向量检索
│   ├── memory/        # 记忆引擎
│   ├── tools/         # 工具系统
│   └── api/           # API 路由
├── client/            # PC 客户端（Tauri 壳）
├── mobile/            # 手机端（HTML5 Web App）
├── Makefile           # 快捷命令
└── .gitignore
```

## 架构概览

```
┌──────────────┐     ┌──────────────┐
│  PC 客户端    │     │   手机端      │
│  (Tauri 壳)   │     │  (HTML5)     │
└──────┬───────┘     └──────┬───────┘
       │ fetch              │ fetch (HTTPS)
       ▼                    ▼
┌──────────────────────────────────────┐
│         FastAPI 后端                  │
│  ├── /api/chat     聊天接口           │
│  ├── /api/memory   记忆管理           │
│  └── /api/tools    工具管理           │
│                                      │
│  ┌─────────┐  ┌──────────┐           │
│  │ SQLite   │  │ ChromaDB  │           │
│  │(对话/记忆)│  │(向量检索) │           │
│  └─────────┘  └──────────┘           │
└──────────────────────────────────────┘
```

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 20+（PC 客户端开发）

### 安装

```bash
# 1. 安装后端依赖
make install

# 2. 编辑配置文件
#    修改 backend/config.yaml，填入 API Key，开启 vector_store.enabled: true

# 3. 启动后端
make run
```

### 开发

```bash
make dev    # 启动后端开发模式（热重载）
```

## 设计原则

- **单人使用**：不考虑多用户、并发、权限
- **简单直接**：不过度抽象，代码直白可读
- **多 AI 协作**：每个模块职责清晰，便于不同 AI 独立开发

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

### P1 - 记忆系统可用

> 能检索上下文，多轮对话有记忆，跨会话归档

**P1.1 - Embedding 模块**

- [x] 重写 `models/embedding.py`，抽象基类 `EmbeddingProvider` + 工厂函数 `get_embedding_provider()`
- [x] 实现 `LocalEmbedding`：基于 `sentence-transformers` 加载 `BAAI/bge-small-zh-v1.5`（512 维，~95MB）
- [x] 实现 `OpenAIEmbedding`：兼容 OpenAI embedding API（备用方案）
- [x] `config.yaml` / `config.py` 中 embedding 段补 `local_model_name`、`base_url`、`hf_endpoint` 字段
- [x] 安装依赖 `sentence-transformers`，验证模型可加载、可生成向量、余弦相似度正确（2026-08-07）

**P1.2 - ChromaDB 向量库 CRUD**

- [x] 从 Qdrant 切换到 ChromaDB 内嵌方案：无需独立进程，零外部依赖
- [x] `vector_store.py` 全量重写：`asyncio.to_thread` 包装同步 ChromaDB 调用
- [x] `config.py` / `config.yaml`：`QdrantConfig` → `VectorStoreConfig`（path + collection_name）
- [x] 实现 `insert(points)`：`coll.upsert(ids, embeddings, metadatas)` 批量插入
- [x] 实现 `search(query_vector, limit, score_threshold)`：`coll.query()` + 余弦距离→相似度转换 + 阈值过滤
- [x] 实现 `delete(point_ids)`：`coll.delete(ids)`
- [x] `ensure_collection`：`get_or_create_collection(schema-free)`，ChromaDB 无需预先指定维度
- [x] 验证 `chunker.py` 分块结果与向量库 insert 数据格式对接

**P1.3 - DB 层补全**

- [x] `db/conversations.py` 补 `get_messages(conversation_id, limit)` 方法：最近 N 条消息，时间正序
- [x] `memory/engine.py` 的 `get_short_term_memory` 改为调用 `conversations.get_messages()`，消除直接 SQL
- [x] 新建 `db/memories.py`：`create_memory` / `get_memory` / `list_memories` / `update_memory` / `deactivate_memory` / `delete_memory`

**P1.4 - 长期记忆检索**

- [x] 实现 `memory/engine.py` 的 `get_long_term_memory(query)`：query → embed → ChromaDB search → 返回文本列表
- [x] ChromaDB 不可用时降级返回空列表（try/except），不影响 P0 聊天功能
- [x] `score_threshold` 初始设为 0.5（后续根据效果调参）
- [x] `api/chat.py` 接入：`long_term=await get_long_term_memory(req.message)` 注入 system prompt
- [x] `main.py` lifespan 已调整：embedding provider 初始化 → `ensure_collection(dim)`

**P1.5 - 归档流程**

- [ ] 新建 `memory/archiver.py`：对话全文 → LLM 摘要 → 分块 → 向量化 → 双写存储
- [ ] 新建 `api/memory.py` 路由：
  - `POST /api/memory/archive`：提交归档请求，返回 LLM 生成的摘要草稿
  - `PUT /api/memory/archive/{conv_id}`：用户确认/修改摘要后提交，执行双写
  - `GET /api/memory`：列出所有记忆
  - `DELETE /api/memory/{id}`：删除记忆（ChromaDB + SQLite 双删）
- [ ] 设计摘要生成 prompt（保留需求/偏好/决策/事实信息，丢弃闲聊）
- [ ] 记忆软标记：归档时在 ChromaDB metadata 中记录 `source_role`（产生记忆时的角色），检索时不硬过滤，仅用于排序加权

**P1.6 - 端到端测试**

- [ ] `config.yaml` 开启 `vector_store.enabled: true`
- [ ] 测试长期记忆检索：多轮对话后归档 → 新会话中验证记忆召回
- [ ] 测试归档流程完整闭环
- [ ] 测试 ChromaDB 不可用时的降级行为

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

## 架构演进：多场景 AI 设计

> 让 AI 支持多场景切换（代码、健康、财务等），按需加载工具组

- [x] 角色配置：`config.yaml` 支持 `roles` 多 system prompt 模板（default / code / health / finance）
- [x] 手动角色切换：`/api/chat` 接收 `role` 字段，按角色加载 system prompt（已验证）
- [x] 工具分组：`tools` 表新增 `group_name` 字段（core / 领域工具），支持按需加载
- [ ] 自动意图识别：对话开头快速分类用户意图，自动切换角色（P2 阶段）
- [ ] 工具动态注入：按角色过滤可用工具组，避免 prompt 膨胀
- [ ] 记忆软标记：ChromaDB metadata 记录 `source_role`，检索时排序加权（P1.5）
- [ ] 跨域关联：允许 AI 发现跨场景因果链
- [ ] 用户画像沉淀：从记忆中提炼结构化用户画像

## License

MIT
