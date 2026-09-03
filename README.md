# LarryAgent

个人 AI Agent，技术栈：**Python FastAPI + SQLite + ChromaDB + Vue 3 + Tauri + HTML5**。

单人使用、本机运行的个人助手：管对话、有长期记忆、能调工具（读写文件 / 执行命令 / 联网搜索）。

> **当前状态（2026-08-30 核对）**：主线阶段 **P0–P4 已完成**，项目进入「能力增强 / 长期迭代」。
> 进行中的待办与工程债务见 **`TODO.md`**（唯一事实源）；已完成阶段冷存于 `archive/roadmap-history.md`。

---

## 项目结构

```
LarryAgent/
├── backend/                 # Python 后端（FastAPI + SQLite + ChromaDB）
│   ├── main.py              # 入口：lifespan + 路由注册 + 全局异常统一出口
│   ├── config.py            # 配置解析
│   ├── config.yaml          # 配置文件（含真实 key，不入库）
│   ├── config.example.yaml  # 配置模板
│   ├── requirements.txt     # Python 依赖
│   ├── logging_config.py    # 日志配置
│   ├── exceptions.py        # 异常体系（LarryException → 统一 JSON 出口）
│   ├── api/                 # API 路由（chat / conversations / memory / tools）
│   ├── services/            # 业务逻辑层（chat_service 等）
│   ├── models/              # LLM 路由 + Embedding + Token 统计
│   ├── db/                  # 数据库层（schema / migrations / CRUD）
│   ├── rag/                 # 向量检索（vector_store / chunker）
│   ├── memory/              # 记忆引擎（engine / archiver）
│   ├── middleware/          # 中间件（API Key 鉴权）
│   ├── tools/               # 工具系统（base / registry / shell / file_ops / web_search）
│   ├── data/                # 运行时数据（larry.db + chroma，不入库）
│   └── tests/               # 测试套件（单元逻辑层 + 集成冒烟层）
├── client/                  # PC 客户端（Vue 3 + Vite + TypeScript，Tauri 壳）
│   ├── src/                 # 前端源码（components / views / stores / composables）
│   ├── src-tauri/           # Tauri 配置 + Rust 入口
│   ├── tests/               # 前端测试（Vitest）
│   └── chat.html            # 单文件调试页，由后端同源托管于 /chat.html
├── mobile/                  # 手机端（HTML5 Web App，规划中）
├── docs/                    # 活跃权威文档（见下方「文档导航」）
├── archive/                 # 冷存档：历史路线图 + 事故复盘报告
├── exchange/                # 多 AI 协作交流区（只承载活日志，不做存档）
├── HUMAN.md                 # 人类治理文件（最高优先级，AI 只读）
├── HUMAN_NOTE.md            # 人类零散记录
├── TODO.md                  # 活跃待办（唯一事实源）
├── Makefile                 # 后端快捷命令
└── .gitignore
```

## 架构概览

```
┌─────────────────┐      ┌──────────────────┐
│   PC 客户端      │      │      手机端       │
│  Vue 3 + Tauri  │      │  HTML5（规划中）  │
└────────┬────────┘      └────────┬─────────┘
         │ fetch                  │ fetch (HTTPS)
         ▼                        ▼
┌───────────────────────────────────────────────────┐
│                   FastAPI 后端                     │
│  /api/chat            聊天（SSE 流式 + 工具调用）   │
│  /api/conversations   会话（归档 / 回收站）         │
│  /api/memory          长期记忆                     │
│  /api/tools           工具管理                     │
│                                                   │
│  services → models（LLM 路由）→ tools              │
│                                 ├ shell            │
│                                 ├ file_ops         │
│                                 └ web_search       │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ SQLite  │  │ ChromaDB │  │ 本地 Embedding   │ │
│  │对话/记忆 │  │ 向量检索  │  │ bge-small-zh    │ │
│  └─────────┘  └──────────┘  └──────────────────┘ │
└───────────────────────────────────────────────────┘
```

## 快速开始

### 环境要求

- **Python 3.11+**（后端，本机实测 3.11.9）
- **Node.js 20+**（PC 客户端开发 / 构建）
- **Rust 工具链**（仅在需要打包 Tauri 桌面端时）

### 后端

```bash
make install     # 安装 Python 依赖（cd backend && pip install -r requirements.txt）

# 复制配置模板后填入 key（Windows 下用 copy 代替 cp）
cp backend/config.example.yaml backend/config.yaml

make dev         # 开发模式（热重载）  → http://127.0.0.1:8000
make run         # 生产模式
make clean       # 清理 __pycache__ / *.pyc
```

### PC 客户端

```bash
cd client
npm install
npm run dev          # Vite 开发服务器
npm run dev:tauri    # Tauri 桌面窗口（需 Rust 工具链）
npm run build        # 类型检查 + 构建
npm run build:tauri  # 打包桌面端
npm run test:unit    # Vitest 单元测试
```

### 手机端

规划中，见 `mobile/README.md`。

## 配置

全部配置从 `backend/config.yaml` 读取，模板见 `backend/config.example.yaml`（内含逐项注释）。

| 配置项 | 说明 |
|---|---|
| `models.<name>.api_key` | LLM 提供商 key。`<name>` 可任意新增，`config.py` 自动解析，无需改代码 |
| `server.api_key` | **放开局域网 / 上云前必须设置**，否则等于无鉴权暴露 shell 工具 |
| `vector_store.enabled` | 长期记忆开关；关闭时不做向量检索 |
| `embedding.provider` | `local`（本地 bge-small-zh）或 `openai`（云端） |
| `tools.shell_allowed_ips` | Shell 工具 IP 白名单，单人使用建议只留 `127.0.0.1` |
| `tools.file_ops_workspace` | 文件工具的工作目录，读写被限制在此目录内 |
| `llm.max_input_tokens` | 单次请求最大输入 token，超出截断旧消息 |

> ⚠️ `backend/config.yaml` **含真实 API key，已被 `.gitignore` 保护，切勿入库**。
> 测试环境默认写占位符，仅显式 `--real-api` 时才注入真实 key。

## 测试

```bash
# 后端：单元逻辑层（默认，全 mock，不烧 key）
cd backend && PYTHONPATH=. python -m pytest tests/ -q

# 后端：集成冒烟层（真实 API，会烧额度，默认 skip）
cd backend && PYTHONPATH=. python -m pytest tests/ --real-api

# 前端
cd client && npm run test:unit
```

**分层约定**：

- **单元逻辑层**（默认跑）：全 mock，快、确定、隔离——验证"代码逻辑对"。
- **集成冒烟层**（`--real-api`）：验证"接得上、跑得通"——API 契约 / 鉴权 / 网络 / 模型行为。定位是**契约哨兵**，跑挂不阻塞交付（真实 API 不稳定属外部因素）。
- 已知存量失败项、事件循环与临时目录的运维注意事项见 **`.claude/CLAUDE.md`** 测试环境段（不在此罗列，避免快照失真）。

## 文档导航

| 文件 | 用途 |
|---|---|
| `HUMAN.md` / `HUMAN_NOTE.md` | 人类治理区：前者为约束（AI 只读），后者为零散记录 |
| `TODO.md` | **活跃待办，唯一事实源**——未决事项一律以此为准 |
| `docs/ai-governance.md` | 多 AI 协作治理：Tier 约束模型、角色分工、协作规则 |
| `docs/ui-reference.md` | UI 设计规格（组件 / 交互 / 视觉 token） |
| `exchange/deployment-architecture.md` | 云部署架构方案（云/端边界、配置、隔离、打包、落地顺序；草案待定稿后回 `docs/`） |
| `docs/web-search-design.md` | 网络搜索能力设计 |
| `archive/roadmap-history.md` | 冷存：P0–P4 已完成阶段详情 |
| `archive/report-*.md` | 冷存：事故复盘报告（**已锁定，不追加讨论**） |
| `exchange/README.md` | 协作交流区规则（只承载活日志，不做存档留底） |
| `.claude/CLAUDE.md` / `.trae/TRAE.md` | 各 AI 角色约束，会话开始加载 |

## 多 AI 协作

本项目由人类主导、多个 AI 分工协作开发：**Trae CN**（全栈实现）、**Claude Code**（测试）、**Marvis**（产品宏观）、**WorkBuddy**（架构协调与复验），另有独立的 UI 设计角色。

分工定义、约束加载机制与协作规则见 `docs/ai-governance.md`；各 AI 的活日志在 `exchange/`。

## 设计原则

- **单人使用**：不考虑多用户、并发、权限
- **简单直接**：不过度抽象，代码直白可读
- **多 AI 协作**：每个模块职责清晰，便于不同 AI 独立开发
- **真实凭据不入版本库**：`config.yaml` 含真实 key 且不入库；测试默认占位符，涉 key 路径需显式开启

## License

MIT

---

<sub>本文件最后核对：2026-08-30（WorkBuddy，对照目录 / Makefile / package.json 实况更新）</sub>
