# LarryAgent

个人 AI Agent，技术栈：**Python FastAPI + SQLite + ChromaDB + Vue 3 + Tauri + HTML5**。后端正**迁移到 DeepSeek Harness（dsh）作为 agent 底座**（见下方〈DSH 迁移〉段）。

单人使用的个人助手：管对话、有长期记忆、能调工具（读写文件 / 执行命令 / 联网搜索）。

> **产品功能边界**：8 域 / 31 子项能力树（含每条落地方式与现状状态）见 **`docs/product-positioning.md`**（权威版本，8 域 / 31 子项，全局十进制编号）。概括：**记忆与长期关系 > 单次问答质量**，靠「记得你 + 分场景有人格 + 工具过程可见」与通用聊天产品划界。

> **部署定位**：**第一版起即面向云部署**，当前本机仅作开发 + 测试环境。
> - **PC 版（C/S）**：client 在本机不上云（保留本地文件 / 命令行能力），server 部署云端
> - **移动版（B/S，规划中）**：浏览器直接访问云端
> - 云 / 端边界、配置与隔离方案**待 DSH 迁移完成后重新制定**（现为未定案草案，不作依据）

> **当前状态**：主线阶段 **P0–P4 已完成**（历史，详见 `archive/roadmap-history.md`）；**现行在飞阶段与工程债务以 `TODO.md` 为准**（唯一事实源）。当前工作主线为 **DSH 迁移**（见下方〈DSH 迁移〉段）。

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
│   ├── api/                 # API 路由（chat / conversations / memory / roles / tools）
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
├── docs/                    # 定案区：活跃权威文档（见 docs/README.md）
├── archive/                 # 冷存区：历史路线图 + 事故复盘报告（见 archive/README.md）
├── exchange/                # 活区：多 AI 交流日志 + 讨论稿 / 草案（见 exchange/README.md）
├── harness/                 # DSH 迁移工程区（pnpm workspace：packages / scripts / tests）
├── ref/                     # 上游 / 社区参考件（dsh-bare 裸仓库、community、awesome 清单；规则见 docs/dsh/README.md）
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
│  /api/roles           角色清单                     │
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

> ⚠️ 上图为**当前形态**；后端底座正在按下方〈DSH 迁移〉被替换（前端形态不变）。

## DSH 迁移（进行中）

后端从**自建 FastAPI 底座**换到 **DeepSeek Harness（dsh）** 作 agent 底座：底座能力（compaction / sandbox / 审批 / trajectory / 多模型 / MCP / ACP）开箱获得，省的是「造底座」而非「写代码总量」——**产品语义层全部自做**（能力树 31 子项对照：🟢 可承接 12 ／ 🟡 可降级 15 ／ 🔴 仍须自做 4；长期记忆 / 知识库 / 多端接入等走「借鉴社区设计后自实现，不直装」）。**前端形态不变**（保留 Vue / Tauri）。

| 项 | 内容 |
|---|---|
| 路径 | **A-framework（全量 TS 化）**——现有 Python 后端核心（约 3.7–4.4k 行）译为 DSH 插件 / 服务形态；**DSH-6 验收前双轨可回退** |
| 上游基线 | `dsh-v0.1.5-rc.2`（2026-09-15 拍定，原 `0.1.2-rc.1`）；只读源码在 `ref/dsh-bare/` |
| 阶段 | DSH-1 事实校准 ✅ → DSH-2 代码形态 + 环境 ✅ → **DSH-3 核心能力 prototype**（开工前置已收口、主体待启动）→ DSH-4 差异化能力迁移 → DSH-5 形态适配 → DSH-6 测试 + 验收 |
| 工程落位 | `harness/`（pnpm workspace：Cordis 插件 / 探针 / 测试）；参考件在 `ref/` |
| 权威文档 | 决策稿 `docs/dsh/dsh-migration.md`（已定稿）；逐条承接依据 `docs/dsh/dsh-015-capability-mapping.md`；**进度一律以 `TODO.md` 为准** |

## 快速开始

### 环境要求

- **Python 3.11+**（后端，本机实测 3.11.9）
- **Node.js 20+**（PC 客户端开发 / 构建）
- **pnpm 11.7.0**（`harness/` DSH 工程区；版本由 `harness/package.json` 的 `packageManager` 钉定）
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
| `roles.<key>` | **场景人格**：`label` / `color` / `system_prompt`，可选 `tools` 限定该角色可用工具；新增角色只改此处、重启生效，前端经 `/api/roles` 动态渲染 |
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

文档分三区（落位标准见各区 README）：**定案区 `docs/`**（活跃权威）、**活区 `exchange/`**（日志 + 讨论稿）、**冷存区 `archive/`**（已锁定）。

| 文件 | 用途 |
|---|---|
| `HUMAN.md` / `HUMAN_NOTE.md` | 人类治理区（AI 只读）：前者为约束，后者为零散记录 |
| `TODO.md` | **活跃待办，唯一事实源**——未决事项一律以此为准 |
| `docs/README.md` / `archive/README.md` / `exchange/README.md` | 三区各自规则（落位标准 / 维护归属 / 区域纪律） |
| `.claude/CLAUDE.md` / `.trae/TRAE.md` / `.qoder/rules/QODER.md` / `.workbuddy/memory/MEMORY.md` | 各 AI 角色约束文件 |

**定案区 `docs/`**（活跃权威 / 单一真相源）—— ⚠️ **完整索引见 `docs/README.md`「文件索引」，本表只列最常引用者**（避免两处各列一半而漂移）：

| 文件 | 用途 |
|---|---|
| `docs/ai-governance.md` | 多 AI 协作治理：Tier 约束模型、角色分工、协作规则 |
| `docs/ui-reference.md` | UI 设计规格（组件 / 交互 / 视觉 token），单一权威参考 |
| `docs/product-positioning.md` | 产品功能边界能力树（8 域 / 31 子项，含每条的落地方式与现状） |
| `docs/production-env.md` / `docs/test-env.md` / `docs/local-env.md` | **环境三份对仗**：server 侧生产（CVM）/ 测试（WSL）/ 本机 Windows（开发 + C 侧测试 + C 侧生产使用） |
| `docs/dsh/` | DSH 迁移决策区：`dsh-migration.md`（决策稿）+ 证据报告，细则见 `docs/dsh/README.md` |

**活区 `exchange/`**（各 AI 交流用临时文件 + 未定稿讨论稿）—— ⚠️ **本区是 AI 间的临时会话空间，`log-*` 不承诺长期保留内容**：正式文档**不在本区寄居结论**，**索引与区域纪律见 `exchange/README.md`**。

**冷存区 `archive/`**（已锁定，只复盘不追加）：

| 文件 | 用途 |
|---|---|
| `archive/roadmap-history.md` | 冷存：P0–P4 已完成阶段 + 后续迭代详情 |
| `archive/report-*.md` | 冷存：事故复盘报告（**已锁定，不追加讨论**） |

## 多 AI 协作

本项目由人类主导、多个 AI 分工协作开发：**Trae CN**（全栈实现）、**Claude Code**（测试）、**Qoder**（文档一致性维护）、**WorkBuddy**（架构协调与复验），另有独立的 UI 设计角色。**Marvis**（产品宏观）已于 2026-09-29 退出项目。

分工定义、约束加载机制与协作规则见 `docs/ai-governance.md`。

## 设计原则

- **单人使用**：不考虑多用户、并发、权限
- **简单直接**：不过度抽象，代码直白可读
- **多 AI 协作**：每个模块职责清晰，便于不同 AI 聚焦各自负责的方向
- **真实凭据不入版本库**：`config.yaml` 含真实 key 且不入库；测试默认占位符，涉 key 路径需显式开启

## License

MIT

---

<sub>本文件最后核对：2026-09-17，Qoder</sub>
