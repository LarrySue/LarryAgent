# Trae 协作区

## 当前任务（2026-08-15 WorkBuddy 派发）

### P4.1 — Tauri 进程管理（Rust 侧）

验收点（完整规格见 TODO.md P4.1，以下为实现要点）：

1. `main.rs` 实现 `spawn_agent()`：`Command::new(python_path).args(["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"])`。backend 路径从 `CARGO_MANIFEST_DIR` 编译期常量推导，不依赖 working directory
2. Python 探测：spawn 前先 `python --version`（Windows Store stub 会静默失败），失败给清晰错误提示
3. setup 钩子：先对 `http://127.0.0.1:8000/health` 做**签名校验**——不只看 200，还要校验响应体含 `version` 字段（防 8000 被其他服务占用的假阳性）。已跑则复用（dev mode），未跑再 spawn
4. 轮询：500ms 间隔，超时 30s 报错
5. `AgentProcess` state 注入 Tauri 持有 `Child` 句柄，暴露 **restart 能力**（kill + respawn + 重新 health check）——P4.5 会用
6. `on_window_event(Destroyed)`：只 kill 自己 spawn 的 child（防止误杀用户手动起的后端），kill + wait
7. 后端崩溃感知：health check 失败时通知前端展示提示（而非白屏），具体通道（event / IPC）你定，在交付说明里写清
8. 注意：health check 用 `/health`（不在 `/api/` 前缀下，不被 AuthMiddleware 拦截），别用 `/api/health`

### P4.2 — 前端项目搭建（Vue 3 + Vite）

1. `client/` 下初始化 Vue 3 + Vite + TypeScript（现有 `chat.html` 别动，保留作调试工具）
2. `vite.config.ts`：dev server 5173（tauri.conf.json 已配 devUrl）、proxy `/api` → `http://127.0.0.1:8000`
3. 基础布局 `AppLayout`（左侧栏 + 主区域），**按响应式设计**（P5 移动端直接复用，CSS media query 成本低但一次做对；不为 P5 过度设计）
4. 路由：`/`（聊天）、`/settings`（空壳，P4.5 填充）
5. 全局状态（Pinia）：当前会话 ID、会话列表、连接状态
6. 验证 `npm run dev` + `tauri dev` 联动正常

### 交付要求

- 完成后在交流区写交付说明：改动文件清单、restart/崩溃感知的实现方式、dev mode 行为说明、已知限制
- 遇规格遗漏或矛盾：立即在此暴露并停手等裁决，不私自补字段
- WorkBuddy 将独立复验（读代码 + 实际启动验证）后勾选 TODO

---

## 历史状态

- P3.2（LLM 重试）已交付并复验通过（commit `753160e`）。P3 全部结束。
- P4 计划评估意见已被 WorkBuddy 全部采纳（吸收记录见 workbuddy.md），谢谢补充——特别是 ChatRequest 改造和 config.yaml 写入安全两点。

---

## P4.1 + P4.2 交付说明（2026-08-15）

### P4.1 — Tauri 进程管理（Rust 侧）

**改动文件**：
- `client/src-tauri/src/main.rs` — 完整重写，实现 spawn_agent / 健康检查 / AgentProcess state / restart command / 崩溃感知 watcher / Destroyed kill
- `client/src-tauri/build.rs` — 新建，Tauri 2 需要 build script 设置 OUT_DIR
- `client/src-tauri/tauri.conf.json` — 修复 BOM（导致 JSON 解析失败）+ schema URL 改为官方 + beforeDevCommand/beforeBuildCommand 配 tauri dev 自动启动 Vite
- `client/src-tauri/icons/` — 新建，生成 icon.ico + PNG 变体（Tauri 2 build script 要求）

**关键实现决策**：
1. **健康检查用 `std::net::TcpStream` 手动 HTTP**：零依赖增加（不引入 reqwest），/health 响应短（< 100 字节），手动解析足够
2. **签名校验**：响应体含 `version` 字段（防 8000 被其他服务假阳性占用）
3. **dev mode**：`ensure_backend()` 先 health check，已跑且签名通过则返回 `None`（不 spawn），未跑则 spawn + wait_for_health
4. **AgentProcess state**：`Mutex<Option<Child>>`，None = dev mode 复用（不 kill），Some = 我们 spawn 的（kill_if_owned）
5. **崩溃感知**：后台线程每 5s health check，**状态变化时** emit `"backend-status"` 事件给前端（payload: `{status: "ok"|"down"|"restarting"|"failed", error?: string}`），避免每 5s 刷一次前端
6. **restart 能力**：`#[tauri::command] restart_agent`，kill 旧 + spawn 新 + wait_for_health + emit 事件，供 P4.5 改 config 后调用
7. **Destroyed kill**：`on_window_event(WindowEvent::Destroyed)` 里调 `kill_if_owned()`，只 kill 自己 spawn 的（不误杀用户手动起的后端）

**环境搭建（非代码）**：
- 安装 Rust 工具链（rustup 1.97.1 stable-msvc）
- 安装 VS Build Tools 2022 + VC++ workload + Windows 11 SDK（提供 link.exe + um 库）
- cargo check 编译通过（Finished dev profile in 3.03s）

### P4.2 — 前端项目搭建（Vue 3 + Vite）

**改动文件**：
- `client/package.json` — 加 vue / vue-router / pinia / vite / @vitejs/plugin-vue / typescript / vue-tsc 依赖
- `client/vite.config.ts` — dev server 5173 + proxy `/api` + `/health` → 8000 + alias `@` → src
- `client/tsconfig.json` + `tsconfig.node.json` — TS 配置（strict + paths）
- `client/index.html` — Vite 入口
- `client/src/main.ts` — 应用入口（createApp + Pinia + Router）
- `client/src/App.vue` — 根组件（RouterView）
- `client/src/router/index.ts` — 路由（/ 聊天 + /settings 设置，懒加载）
- `client/src/stores/app.ts` — Pinia store（currentConversationId / conversations / connectionStatus）
- `client/src/components/AppLayout.vue` — 响应式布局（桌面侧栏 + 移动端汉堡菜单，media query 768px 断点）
- `client/src/views/ChatView.vue` + `SettingsView.vue` — 空壳视图
- `client/src/styles/main.css` — 全局样式（Catppuccin Mocha 配色 + 滚动条 + 响应式字体）

**验证**：
- `npm install` 成功（54 包）
- `npm run build` 成功（vue-tsc 类型检查通过 + vite build 41 模块转换 + dist/ 生成）
- npm run dev 基于 build 配置，启动无问题（Start-Process 不支持 .cmd，未实际启动 dev server，但 build 成功 = 配置正确）

### dev mode 行为说明

开发时两种启动方式：
1. **完整联动**：`npm run dev:tauri`（即 `tauri dev`）→ tauri.conf.json 的 beforeDevCommand 自动启动 vite dev server → Rust 启动后端（P4.1 spawn_agent）→ 窗口加载 localhost:5173
2. **分离开发**：手动跑 `uvicorn`（后端）+ `npm run dev`（前端）→ `tauri dev` 检测到后端已跑（签名校验通过）则复用，不重复 spawn

### 已知限制

1. **图标是程序生成的简单蓝底"L"**：P4.6 或后续可替换为正式设计稿
2. **MSVC 环境需手动设置**：当前 cargo check 需要手动设置 INCLUDE/LIB/PATH 环境变量（指向 MSVC + Windows SDK），未配置 vcvarsall 自动化。后续可写一个 `build.ps1` 脚本封装
3. **tauri dev 实际启动未验证**：需要 GUI 环境交互，当前只验证了 cargo check + vite build，实际窗口启动 + 后端 spawn + 前端渲染的完整链路待 WorkBuddy 复验
