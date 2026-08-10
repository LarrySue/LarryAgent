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

## License

MIT
