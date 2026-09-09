# DSH-2.3 Vue/Tauri ↔ DSH 连通 hello world（Trae 交付 · 2026-09-09）

> **基线版本**：`dsh-v0.1.2-rc.1`（装包/源码/tag 全链路一致）
> **任务来源**：`exchange/log-trae.md`【在飞 · 2026-09-09 派发】DSH-2.3
> **性质**：连通验证 + 通信面能力边界观察（选型输入，不为选型背书）
> **存放**：exchange/ 讨论稿区（未动 docs/ archive/ .workbuddy/，未写业务逻辑）

---

## 1. 结论（一行）

**能。** 现有 Vue/Tauri 客户端已能经 DSH 的 `sdk` profile（stdio JSON-RPC）发一条消息并收到真实模型回包；GUI 侧与无 GUI 复跑路径**走同一通道**（同一 `node` 驱动脚本，同一 profile）。

---

## 2. 连通方式

| 项 | 值 |
|---|---|
| profile | `sdk` = `dsh-base` + `dsh-sdk-app`（`.dsh-home/profiles/sdk`，bundles 2 项） |
| 传输 | **stdio JSON-RPC**（sdk-app 的 `sdk-jsonrpc-server`；stdout 归协议独占） |
| 驱动 | 官方 TS SDK `@deepseek-ai/dsh-sdk-client@0.1.2-rc.1`（`DeepSeekHarness` → `run()`），spawn 同版本 `@deepseek-ai/dsh` runtime 子进程 |
| 客户端进程管理 | **新写**（未复用 P4 的 uvicorn 管理）：Tauri 新增 `dsh_prompt` IPC command → `Command::new("node")` 跑 `harness/scripts/dsh-prompt.mjs` → 捕获 stdout/stderr 回传。一次性调用、无长驻句柄；DSH_HOME 由 Rust 注入项目 `.dsh-home`，模型凭据继承启动环境（`DEEPSEEK_API_KEY`，未落任何文件） |
| GUI 入口 | 主窗口顶栏右侧新增 **DSH** 按钮（`DshProbe.vue`，modal：输入→发送→显示回复/stderr/exit code）；仅 Tauri 环境可用（纯浏览器 vite 下置灰） |

**通道一致性**：GUI invoke `dsh_prompt` 与交付块 4 的复跑命令 = 同一个 `node scripts/dsh-prompt.mjs`。WB 复验 GUI 无需（也无法）复用我的 GUI 点击，直接跑 CLI 命令即可得到同源结论。

---

## 3. 原始输出

### 3.1 无 GUI 复跑路径（CLI，同一通道）——核心证据

```
> $env:DSH_HOME = "D:\Code\LarryAgent\.dsh-home"; $env:DEEPSEEK_API_KEY = "<key>"
> cd harness
> node scripts/dsh-prompt.mjs "Reply with exactly: hello from dsh sdk"
hello from dsh sdk
[dsh-prompt] session=session-793c14d80d224e3dab9548dd60f96592 events=40 notifications=42
> exit code = 0
```

stdout `hello from dsh sdk` 为 deepseek-official 真实回复；stderr 行（PowerShell 会红字包装原生 stderr，内容本身干净）记录 session/事件计数。

### 3.2 通信面能力边界探针（块 5 数据源）

```
> node scripts/dsh-probe-capability.mjs "Reply with exactly: probe ok"
{
  "finalResponse": "probe ok",
  "sessionId": "session-64832acf3ed840a2bebda206e3a25fe3",
  "eventCount": 19,
  "eventTypeDistribution": {
    "agent/inbox/spliced": 2, "turn/start": 1, "step/start": 1,
    "user/message": 2, "session/title": 1, "request/header": 1,
    "request/context": 1, "assistant/chunk": 7, "assistant/message": 1,
    "step/end": 1, "turn/end": 1
  },
  "notificationCount": 21,
  "notificationMethodDistribution": { "session.event": 19, "session.status": 2 }
}
```

### 3.3 Tauri dev 启动（GUI 侧运行证据）

```
> npm run dev:tauri        # 设 DEEPSEEK_API_KEY + DSH_HOME 后
VITE v5.4.21  ready in 566 ms        # vite (5173)
LarryAgent client starting...        # Tauri main setup 执行
[vite] new dependencies optimized: @tauri-apps/api/core   # DshProbe invoke 依赖热载
> GET http://127.0.0.1:8000/health → 200 {"status":"ok","version":"0.1.0"}   # 既有 Python 后端 healthy（app 正常）
```

app 全程无 panic；`dsh_prompt` 与既有 `restart_agent` 一并注册成功。

> 修复前置 bug：tauri-plugin-shell v2.3.5 下 `tauri.conf.json` 的 `plugins.shell.scope`（旧 ACL 字段）导致 dev 启动 panic（`unknown field scope, expected open`）。scope 机制已被该版本移除，且 main.rs 实际用 `std::process::Command` spawn（未用 shell 插件 API），故删除该段恢复运行——**这是让现有 app 重新能跑的修复，非新增破坏**。

---

## 4. 可复跑步骤（干净状态）+ 踩坑清单

### 4.1 前置（一次性）

1. Node ≥ 24；`npm i -g pnpm@11.7.0`、`npm i -g @deepseek-ai/dsh@0.1.2-rc.1`（`dsh --version` → `0.1.2-rc.1`）
2. `.dsh-home/profiles/sdk` 已建（dsh-base + dsh-sdk-app 230 包，`allowBuilds` 全 `false`）
3. `harness/`：`pnpm install`（已含 `@deepseek-ai/dsh-sdk-client` + `@deepseek-ai/dsh`）

### 4.2 无 GUI 复跑（WB 独立复验用）

```
$env:DSH_HOME  = "D:\Code\LarryAgent\.dsh-home"
$env:DEEPSEEK_API_KEY = "<key>"          # 凭据只走环境变量
node harness/scripts/dsh-prompt.mjs "Reply with exactly: hello from dsh sdk"
# → stdout: hello from dsh sdk   exit 0
node harness/scripts/dsh-probe-capability.mjs "Reply with exactly: probe ok"
# → 完整事件流 JSON（块 5 数据）
```

### 4.3 GUI 复验（人工点验）

```
$env:DEEPSEEK_API_KEY = "<key>"; cd client; npm run dev:tauri
# 主窗口右上角「DSH」按钮 → 输入消息 → 发送 → modal 显示回复（同 4.2 通道）
```

### 4.4 踩坑清单

1. **tauri dev 首次会全量 debug build（~1.5min）**，且 `plugins.shell.scope` 在 tauri-plugin-shell v2.3.5 是未知字段（schema 只剩 `open`）→ dev 直接 panic。删 scope 段即恢复。
2. **Python 后端冷启动慢**（chromadb 首启 ~2min），`dsh_prompt` 与后端无耦合，DSH 通道不受影响；但点按钮前确认后端 healthy 可避免 ConnectionToast 干扰观感。
3. **PowerShell 把原生 stderr 包成红字/RemoteException**：看字符串内容，别被格式误导。
4. **sdk runtime stdout 归 JSON-RPC 独占**：驱动脚本自身的进度只能走 stderr，别往 stdout 混打（会破坏协议）。
5. **凭据只经环境变量**：Rust `dsh_prompt` 显式注入 DSH_HOME、凭据继承进程 env——起 tauri 前记得 set `DEEPSEEK_API_KEY`，否则 runtime initialize 会报缺 credential（与 DSH-2.1 headless 同行为）。
6. pnpm 11 `allowBuilds` 机制（koffi/node-pty 等 native build 脚本）会让 `dsh plugin … add` 以 exit 1 结束——在 profile 与 harness 的 `pnpm-workspace.yaml` 里把待审批项设 `false`（sdk stdio 通道不需要这些 native）。

---

## 5. ⭐ 通信面能力边界观察（sdk profile + TS SDK，选型输入）

### 能做（本通道已实测）

- **真实完整会话**：initialize → session/prompt → 模型回复 → shutdown，一条龙（exit 0）
- **事件流粒度足够**（块 3.2）：`turn/start|end`、`step/start|end`、`assistant/chunk`（流式增量，7 条/次）、`assistant/message`、`user/message`、`request/header`（LLM 请求头）、`request/context`（注入上下文）、`session/title`（自动标题）、`agent/inbox/spliced`（收件箱回执）——**记忆双写、流式 UI、会话标题所需的信号粒度都在**，不是"窄面"能概括的
- **会话持久化**：每次 prompt 落到 `.dsh-home/sessions/`（session.jsonl），sessionId 可复现
- **服务端智能体能力**：base 全套（tools/session/agent 等）经 sdk profile 可达——client 拿到的已是"agent 完整回合结果 + 事件"而非裸 LLM 流

### 明显做不了 / 受限（本通道）

- **stdout 归 JSON-RPC**：不能直接承载 UI/日志流；多路复用要靠上层封装（如未来自做 HTTP 桥，将 stdio 面转为 client 可连的传输）
- **JSON-RPC 方法面窄**：wire 面实际就是 `initialize` / `session/prompt`（+ `session`/`shutdown` 生命周期）——**client 若要对话之外的操面（会话树浏览、子代理管理、设置/配置读写等）不在此协议内**，需借 base 内插件扩展或换 web profile
- **runtime 子进程生命周期归 SDK**：每次 `run()` 由调用方起停；改 profile 插件代码需重启 runtime（**模块级 HMR 动态观察仍未落地**，需 web/tui 类长驻载体——与 DSH-2.1 结论一致，非本通道能力）
- **无 HTTP / 无浏览器面**：GUI 直连需走进程（Tauri Rust spawn）；浏览器环境不能直接用 TS SDK（无子进程能力）
- **模型路由固定**：sdk profile 下 agent 由 `llm-deepseek` 路由（deepseek-official / v4-flash 等）；要接 LarryAgent 的多模型/角色路由需在 base 层扩展（属后续业务，本任务未做）

**一句话**：sdk profile + TS SDK 是"客户端驱动完整 agent 会话"的合格通道（流式+事件+持久全有），窄在 wire 方法面与无自带传输/UI——若最终 client 需要 HTTP 或对话外的扩展操面，是上 web profile 或自做 HTTP 桥的加分项，非本通道硬伤。

---

## 6. 顺带：hmr（不阻塞）

sdk runtime 由 TS SDK 管理生命周期，无外部改码热载窗口；结论不变：模块级 HMR 开关已验证可开（DSH-2.1），动态观察待 web/tui 长驻载体（DSH-2.3 未建 web profile，不为此扩范围）。

## 7. 改动文件清单（本次交付）

| 文件 | 改动 |
|---|---|
| `client/src-tauri/src/main.rs` | +`dsh_prompt` IPC command（spawn node 驱动脚本） |
| `client/src-tauri/tauri.conf.json` | 删废弃 `plugins.shell.scope`（修 dev 启动 panic） |
| `client/src/components/DshProbe.vue` | 新增：顶栏 DSH 按钮 + modal（invoke 显示回复） |
| `client/src/components/AppLayout.vue` | 顶栏挂载 `DshProbe` |
| `harness/package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` | +`@deepseek-ai/dsh-sdk-client` + `@deepseek-ai/dsh`（同版本 0.1.2-rc.1）；allowBuilds |
| `harness/scripts/dsh-prompt.mjs` | 新增：SDK 通道 prompt 驱动（GUI 与复跑共用） |
| `harness/scripts/dsh-probe-capability.mjs` | 新增：能力边界探针 |

`client/src-tauri/Cargo.toml` 曾被工具去掉 BOM（内容零变化），已 checkout 还原，不在改动集。

## 8. 隔离自检

- 开工 baseline：工作树仅 WB 在动的 `TODO.md` / `exchange/log-claude.md`（未触碰）。
- 结束 diff：上表 7 项即全部改动；`.dsh-home/`（含 sdk profile 会话产物）被 `.gitignore` 排除未入 git；`ref/dsh-bare` 全程只读；未新增全局写入（npm 全局仅沿用 DSH-2.1 装的 pnpm/dsh）。
- 测试 key 仅经环境变量注入，未落任何文件（含脚本注释内无 key）。
- tauri dev 验证后已停进程并清理 uvicorn/rust/node 残留（8000 端口已释放）。
