---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 44c052101e5e236a5489b447016cb8fe_e1b1ad4c90db11f1a102525400826444
    ReservedCode1: NB5Er+0e8cLb/5cp4gLve4VYukFHEzdCcl+ZxY/vpqb+KNnn6sSmBP3AmjMdBQRnRRGC5yWB1VhJO2P4FODrGWzZuWLJcQT3EBP0ldwn9OdMFdrYIeaoiqgMIcBaeGxtW8l9h7eHsdIXmicZ4bIBtBOXfi7y++zFYidZ7nqlAw9YRP+KqFC2bX84iho=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 44c052101e5e236a5489b447016cb8fe_e1b1ad4c90db11f1a102525400826444
    ReservedCode2: NB5Er+0e8cLb/5cp4gLve4VYukFHEzdCcl+ZxY/vpqb+KNnn6sSmBP3AmjMdBQRnRRGC5yWB1VhJO2P4FODrGWzZuWLJcQT3EBP0ldwn9OdMFdrYIeaoiqgMIcBaeGxtW8l9h7eHsdIXmicZ4bIBtBOXfi7y++zFYidZ7nqlAw9YRP+KqFC2bX84iho=
---

﻿---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 44c052101e5e236a5489b447016cb8fe_533b3f5090db11f1bafa525400287e28
    ReservedCode1: cFoN9PGN0/ffBEZOC/vEEGNX+gM/0QtX1KadlfsTjDvpbsysq1H1JBWRUOu0+i/6uacRSVCH9SOEoPFriltDWODz15LVfWrivbd+rQtubp2+QHUt77rj1Nm/DjpRELmlUnSsByarn4kcLwVlrYgakVnyI45Q40eS70i8tZ2AgdiLp1USN1UR2xaIDto=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 44c052101e5e236a5489b447016cb8fe_533b3f5090db11f1bafa525400287e28
    ReservedCode2: cFoN9PGN0/ffBEZOC/vEEGNX+gM/0QtX1KadlfsTjDvpbsysq1H1JBWRUOu0+i/6uacRSVCH9SOEoPFriltDWODz15LVfWrivbd+rQtubp2+QHUt77rj1Nm/DjpRELmlUnSsByarn4kcLwVlrYgakVnyI45Q40eS70i8tZ2AgdiLp1USN1UR2xaIDto=
---

# LarryAgent PC 客户端

## 架构说明

PC 客户端采用 **Tauri 壳 + 本地 Agent 进程** 的架构：

```
┌──────────────────────────────────────────┐
│              Tauri 窗口 (WebView)          │
│  ┌────────────────────────────────────┐  │
│  │       前端 UI (HTML/CSS/JS)        │  │
│  │   通过 fetch 调用 localhost:8000   │  │
│  └────────────────────────────────────┘  │
│                    │                      │
│  ┌─────────────────▼──────────────────┐  │
│  │        Tauri Rust 后端             │  │
│  │  - 启动时自动拉起 Python Agent     │  │
│  │  - 系统托盘图标                    │  │
│  │  - 窗口管理                        │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘

        localhost:8000 (FastAPI)
┌──────────────────────────────────────────┐
│          Python Agent 进程                │
│  backend/main.py (FastAPI)               │
│  - LLM 路由                              │
│  - 记忆管理                              │
│  - 工具执行                              │
│  - SQLite + Qdrant                       │
└──────────────────────────────────────────┘
```

## 开发计划

- [ ] Tauri 项目初始化
- [ ] 前端 UI 框架选型（React/Vue/Svelte）
- [ ] 聊天界面组件
- [ ] 与后端 API 对接
- [ ] 系统托盘 + 自动启动 Agent

## 注意事项

- Agent 进程由 Tauri 的 Rust 端通过 `Command::new("uvicorn")` 自动拉起
- 关闭客户端时自动终止 Agent 子进程
- 前端通过 `http://localhost:8000` 访问后端 API
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
