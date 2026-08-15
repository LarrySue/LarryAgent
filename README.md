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

# LarryAgent

个人 AI Agent，技术栈：**Python FastAPI + SQLite + ChromaDB + Tauri + HTML5**。

## 项目结构

```
LarryAgent/
├── backend/               # Python 后端（FastAPI + SQLite + ChromaDB）
│   ├── main.py            # 入口文件
│   ├── config.py          # 配置解析
│   ├── config.yaml        # 配置文件（不入库）
│   ├── config.example.yaml# 配置模板
│   ├── requirements.txt   # Python 依赖
│   ├── logging_config.py  # 日志配置
│   ├── api/               # API 路由（chat / memory / tools）
│   ├── services/          # 业务逻辑层（chat_service 等）
│   ├── models/            # LLM 路由 + Embedding + Token 统计
│   ├── db/                # 数据库层（schema / migrations / CRUD）
│   ├── rag/               # 向量检索（vector_store / chunker）
│   ├── memory/            # 记忆引擎（engine / archiver）
│   ├── middleware/        # 中间件（API Key 鉴权）
│   ├── tools/             # 工具系统（base / registry / shell / file_ops）
│   └── tests/             # 测试套件
├── client/                # PC 客户端（Tauri 壳 + HTML）
│   ├── chat.html          # 聊天界面
│   └── src-tauri/         # Tauri 配置 + Rust 入口
├── mobile/                # 手机端（HTML5 Web App）
├── exchange/              # 多 AI 协作交流区
├── HUMAN.md               # 人类治理文件（最高优先级，AI 只读）
├── .claude/CLAUDE.md      # Claude 约束配置
├── .trae/TRAE.md          # Trae CN 约束配置
├── Makefile               # 快捷命令
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

## License

MIT
