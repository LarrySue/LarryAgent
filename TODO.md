# LarryAgent TODO
> **TODO 治理约定**（2026-08-17 定稿）
> - 本文件为**活跃 TODO**：只含当前待办 + 在飞阶段（P4）+ 后续阶段骨架 + 部分远期计划 + 工程债务。已完成历史阶段见 `archive/roadmap-history.md`。
> - **一致性不变量**：✅ 阶段内不得含 [ ]；含 [ ] 即误归档，须移出至 backlog 或对应未来阶段。
> - 加载方式：软性机制——AI 任务相关时主动 Read 本文件，不自动注入。
> - 检索归档：需要时 Grep `archive/roadmap-history.md`；排查 BUG / 做改动前先扫归档（精细索引 P5 后启用，见 WORKBUDDY.md）。
> AI 交流讨论区已迁移至 `exchange/` 目录（该目录规则参照 `exchange/README.md` ）。
> 人类治理区迁移至`HUMAN.md`和`HUMAN_NOTE.md`两个文件，前者偏约束和提示，后者偏零散记录。

## 当前待办

### UI/UX优化

- [ ] 绝对长期项目，人类至高训导权 + 个人项目 的完全体现，人类想做啥就做啥，我就是要五彩斑斓的黑！

### 记忆系统调优

- [ ] 检索参数调优（`memory/engine.py::get_long_term_memory`）：长期 — 根据实际使用中召回质量持续调整 score_threshold / top_k / 分级阈值
- [ ] 向量检索上下文扩展：archive 中同一 memory_id 的相邻 chunk 在命中时一并拉出合并，避免 LLM 看到被截断的片段
- [ ] `search()` score_threshold 分级：不同来源检索用不同阈值
- [ ] 记忆保鲜机制：`last_hit_at` / `priority`，被频繁检索的记忆提升保留权重
- [ ] 向量同步补偿：长期 — ChromaDB 异常恢复后自动校验 SQLite ↔ ChromaDB 一致性并补写缺失向量
- [ ] Embedding 模型迁移脚本：长期 / 待触发 — 更换模型时重建 collection + 全量重索引

### 多场景 AI 架构

> 以下为长期架构愿景，当前 P0-P3 仅支持手动切换角色，自动意图识别和跨域关联留待后续迭代。

- [ ] 意图识别机制：长期 — 对话开头快速分类用户意图，自动切换角色
- [ ] 跨域关联能力：长期 — 记忆检索不限单一领域，允许 AI 发现跨场景因果链
- [ ] 用户画像沉淀：长期 — 从记忆中提炼结构化用户画像，注入 system prompt
- [ ] 场景间信息同步策略：长期 — 定义全局共享 vs 领域私有的记忆边界

### 工程债务（需要重新考虑）

- [ ] **存量测试债务是否修复**：`test_chromadb_degradation.py`（mock 了已不存在的 archiver.get_db）、`test_integration_llm.py`（缺 pytest-asyncio）、`test_shell_tool.py::test_windows_dir`（中文 Windows 编码断言）。选项 A：修复恢复"全套绿"基线；选项 B：维持"相关测试 + 已知项甄别"现状。当前规则以 B 运转（见 CLAUDE.md/TRAE.md 测试环境段）。此事不是很急，找个合适的机会讨论一下

### 其他长期增强（待触发）

- [ ] chat_service token 累计上限（单次对话 tool call 总 token 阈值）：防止单轮读大文件等场景暴增，当前仅轮次限制。优先级很低，不做主动处理；若后续出现相关问题再讨论完善，不静默自动处理。

---

## 开发路线图

按依赖顺序分 6 个阶段，每个阶段形成可运行的闭环。
### 历史索引（已完成阶段，冷存于 `archive/roadmap-history.md`）

- **P0 - 最小聊天闭环** ✅（2026-08-07）→ 端到端聊天闭环：DB/会话 CRUD + `/api/chat` 非流式 + 启动时序修复 + ChromaDB 内嵌方案。详见 `archive/roadmap-history.md`。
- **P1 - 记忆系统可用** ✅（2026-08-07）→ Embedding(bge-small) / ChromaDB 向量库 CRUD / DB 层补全 / 长期记忆检索 / 归档流程 / 端到端测试降级。详见 `archive/roadmap-history.md`。
- **P2 - 工具调用闭环** ✅（2026-08-11）→ FileOps 沙箱 / ShellTool(超时+IP白名单+黑名单) / Function Calling 循环 / `/api/tools` / config 扩展 / 端到端测试。详见 `archive/roadmap-history.md`。
- **P3 - 流式 + 体验优化** ✅（2026-08-12~15）→ SSE 流式 / LLM 重试(tenacity) / Token 统计+截断 / API Key 校验 / 自定义异常类。详见 `archive/roadmap-history.md`。

---

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
- [x] `AgentProcess` state 注入 Tauri，持有 `Child` 句柄；暴露 **restart 能力**（kill + respawn + 重新 health check，供配置变更 / 崩溃恢复重启）
- [x] `on_window_event(Destroyed)`：只 kill 自己 spawn 的 child（防误杀），kill + wait
- [x] 后端崩溃感知：后台线程每 5s health check，状态变化时 emit `"backend-status"` 事件给前端（payload: `{status, error?}`），前端提示而非白屏
- [x] 注意：用 `/health` 而非 `/api/health`（前者不被 AuthMiddleware 拦截，无需 API key）

**P4.2 - 前端项目搭建（Vue 3 + Vite）**（2026-08-15 派发：Trae 实现 / WorkBuddy 复验通过）

- [x] `client/` 下初始化 Vue 3 + Vite + TypeScript
- [x] `vite.config.ts`：dev server 端口 5173、proxy `/api` + `/health` → `http://127.0.0.1:8000`、strictPort（端口被占用报错而非换端口）
- [x] 基础布局 `AppLayout`（左侧栏 + 主区域），响应式（768px 断点，移动端汉堡菜单）
- [x] 路由：`/`（聊天），懒加载
- [x] 全局状态：当前会话 ID、会话列表、连接状态（Pinia）
- [x] `package.json` 更新：vue、vue-router、vite、typescript、pinia、vue-tsc
- [x] 验证 `npm run build` 通过（vue-tsc 类型检查 + vite build 41 模块）。⚠️ tauri dev 实际窗口启动链路待真机验证（需 GUI 环境）

**P4.35 - 界面基调定义**（2026-08-15 派发：Marvis 出初稿 / UI Designer 精化 / 老大审定 — ✅ 完工）

- [x] 产出一页设计约定：布局结构（左会话栏 + 右消息流）、配色基调（暗色为主，灰阶 + 交互锚点色 #378ADD）、字体（中文系统字体优先 + Inter fallback）、组件风格（5 个核心组件规格 + 边界状态 + WCAG AA 合规）
- [x] 定案多角色差异化呈现方案：default=亮中性灰 #9CA3AF / health=低饱和翠绿 #34D399 / finance=低饱和琥珀 #FBBF24；色点+问候语+AI 气泡色带+工具卡片 header 色，不做三套换肤
- [x] Logo 定案：C2 写意版（毛笔三笔 + 禅圆缺口 + 朱红点），老大拍板"外圈缺口是灵魂"
- [x] 完整 design token 体系（配色 / 排版 / 间距 / 圆角 / 过渡动画 5 类 token）+ 组件详细规格（MessageBubble / ToolCallCard / ChatInput / SidebarItem / TopBar）+ 响应式断点体系 + 边界状态设计 + Accessibility

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

**P4.4 - 聊天界面（Vue 组件）**（✅ 已交付 + WorkBuddy 复验通过，2026-08-19）

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
- [x] 前端请求带 `Authorization: Bearer <key>`（P3.4 兼容）：实际未实现 header 构造，留 P5（key 留空无需求）
- [x] 前端逻辑层测试基建（Claude，Vitest 31/31 全绿，零 Tauri 依赖）：`client/tests/` 下 `api` / `useChatStream` / `toolCallCard` / `chatInput` 四个测试文件，覆盖错误体解析 + SSE 解析 + 组件状态机
- 已知项：错误响应 `error` 类型名当前被 `detail` 覆盖（如 `NOT_FOUND` 不直接显示），是否展示类型名待产品裁定（非缺陷，属信息展示选择）
- [ ] 前端集成层测试（会话切换加载 / 角色切换传参）：逻辑层已由 Claude 覆盖（P4.4 测试），集成层需 mock RouterView + store 联动；引入新逻辑层时一并补，或 WB 明确要求再做

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
- [ ] ShellTool 黑名单加固：当前为字符串包含匹配（`rm -rf  /`、`rm --recursive --force /`、`find / -delete` 等变体可穿透）。本机单人使用攻击面极小，暂不修；但放开 IP 白名单（如 P5 局域网/上云）前须先升级为正则/词法解析或换沙箱方案（与上方白名单重构同批处理）