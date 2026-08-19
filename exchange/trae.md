# Trae 协作区

## 当前状态（2026-08-19 更新）

- **P4.4 聊天界面** ✅ 已交付（Trae，2026-08-19）+ WorkBuddy 复验通过（看代码 + 看报告双轨）；详见历史状态。
- **P4.5 首次启动引导 + 配置入口** 🔄 2026-08-19 WorkBuddy 派发（Trae 实现），规格见下方。

---

## P4.5 派发规格（2026-08-19 WorkBuddy 派发）

**目标**：首次启动引导 + 配置入口，闭环"双击即用"体验。
**实现**：Trae ｜ **依赖**：P4.1(进程管理+restart)✅ / P4.4(聊天界面)✅ —— 满足，可派发。

### 一、需求清单（源自 TODO.md P4.5）
1. 检测 `backend/config.yaml` 是否有 `models.<provider>.api_key`（⚠️ 不是 `llm.api_key`，按 provider 段真实 schema；检测/写入路径须与 P4.1 用同一路径基准）
2. 无 key：引导页输入 API key → Tauri IPC → Rust 写入 config.yaml（**写入前先备份 `config.yaml.bak`，失败回滚**）→ 调用 P4.1 restart 重启后端（uvicorn 不热重载 yaml）
3. 有 key：直接进主界面
4. `/settings` 页放"打开配置文件"按钮（`tauri-plugin-shell`），改完提示需重启

### 二、关键约束（避免重蹈覆辙 + 呼应 Marvis 解耦建议）
- **安全底线（Tier 0）**：写入 config.yaml 前必须备份 + 失败回滚；key 仅在 Rust 侧经 IPC 接收，不落入前端日志/对话；绝不读写其他文件。
- **复用 P4.1 路径基准**：config.yaml 绝对路径推导与 P4.1 spawn 用同一 CARGO_MANIFEST_DIR 机制，禁止前端硬编码路径。
- **只写实现、不写测试文件**（职责边界：测试归 Claude）。
- **Tauri 调用集中封装**：本次会直接调 Tauri（`__TAURI__` / plugin-shell）写 config，建议在 `client/src/` 封一层 `tauri.ts` adapter 收敛 IPC/插件调用——呼应 Marvis 对 P4.4 提的"薄解耦"建议（P4.4 因纯 HTTP 无需，P4.5 正需要）。

### 三、验收 / 协作
- 交付后 WB 复验（读代码 + 看报告）；真机引导流程（首次启动 / key 写入 / 重启）需老大 GUI 环境收尾。
- Claude 后续补规范测试（参考 conftest 隔离约定，不碰真实 config.yaml）。

### 四、派发日期
2026-08-19，WorkBuddy 派发。

---

## 历史状态

- **P4.4 已交付**（2026-08-19）：聊天界面 Vue 组件
- P4.2→P4.4 交接点全部完成：配色换 design token / 砍底部状态栏 / 新增 TopBar
