# Trae 协作区

## 【在飞 · 2026-09-09 派发】DSH-2.3 Vue/Tauri → DSH 连通 hello world

> **前置已完成**：DSH-2.1 / 2.2 短路点**双"能"通过**（WB 已独立复验：自跑 `--dump-config` 见 `larry-probe` 插行、`--help` 输出 `[B1-PROBE] external bundle loaded by cordis (tag=v1)`）。基线 `dsh-v0.1.2-rc.1`。
> **已有资产**：`harness/`（工程 + `@larryagent/plugin-probe`）、`.dsh-home/profiles/larry`（`dsh-base` + `dsh-headless` + 我们的插件，230 包已装）。环境复现步骤见 `docs/dsh/dsh-b1-plugin-probe-trae.md` §5。

### 唯一要回答的问题（二值）

**现有 Vue/Tauri 客户端，能否经 DSH 的 profile 发一条消息并收到回包？** → 能 / 不能

不能 → 立即停下上报（同 DSH-2 口径，不自行找 workaround）。

### ⚠️ 本轮刻意不锁死的一件事（先读，避免做偏）

**通信面选型（sdk / acp / 自做 HTTP 层）尚未定案，本轮只验证"通道可通"，不为选型背书。**

原因：sdk profile 的 JSON-RPC 请求面只有 `initialize` / `session/prompt` / `shutdown`（这正是第 0 项判"Py SDK 二等公民"的同一个窄面）。**若最终 client 长期走 sdk 面通信，我们就仍被限制在这个窄面里**——与 A-framework「贴近核心层」的初衷存在张力。另一种可能是：在 DSH 进程内自做（或复用 `host/` 的）HTTP server，通信面由我们自己定义。

- **本轮做法**：选一条最快能通的路（优先 sdk profile 或在其上加我们的插件），**先把 hello world 跑通**
- **不要**：为了让通信面变宽而引入重设计；不要在本轮做 HTTP 层
- **但必须**：在交付里写清你选的是哪条、以及**你观察到的该面能力边界**（能做什么、明显做不了什么）——这条观察是选型的关键输入

### 环境规格（沿用 DSH-2.1，已验证可用）

| 项 | 值 |
|---|---|
| 版本基线 | `dsh-v0.1.2-rc.1`（装指定版，不要 latest） |
| DSH_HOME | `D:\Code\LarryAgent\.dsh-home`（隔离，**不要动全局**） |
| 入口 | **npm 全局 `dsh`**（实测可用）；**不要用源码 `bin.ts` + tsx 入口**（PowerShell 下偶发卡住） |
| 源码查阅 | `ref/dsh-bare` **只读** |

### 交付（5 块，缺一不可）

1. **结论一行**（能 / 不能）
2. **连通方式**：选了哪个 profile、走什么传输（stdio / HTTP）、Tauri 侧怎么起 DSH 进程（复用现有 P4 进程管理机制还是新写）
3. **原始输出**：发消息与收回包的原文（含 stderr）
4. **可复跑步骤** + 踩坑清单。⚠️ **必须含一条不依赖 Tauri GUI 的复跑路径**（如 node/TS 脚本或 CLI 侧经同一通道发消息收回包）——**WB 需独立复验，无此路径则只能采信你的输出**（对比 DSH-2.1/2.2：那轮我用 `--help` 零成本复验成功，本轮涉及 GUI + 真实调用，复验难度更高）
5. **⭐ 该通信面的能力边界观察**（能做 / 明显做不了什么）——选型输入，见上方警示

### 硬红线

- **凭据一律走环境变量**，不写进任何文件
- **不改 `docs/` `archive/` `.workbuddy/`**（老大定的约束）
- **`client/` 是现有可运行代码**——改动最小化，**不得破坏现有 Tauri/Vue 的正常构建与运行**；改前先确认现有进程管理机制在哪、能否复用
- **`ref/dsh-bare` 只读**
- 隔离自检沿用：`git status` baseline + 结束后 diff，检出预期外的全局写入

### 不做的事（做了算越界）

- **不写业务逻辑**（记忆 / 角色 / 工具 / answerer 一律别写）
- **不做 DSH-2.4 测试基建、不做 2.5 那 5 项实测**
- **不重做通信面选型**（只观察、给输入）
- 不重议是否迁移 / 是否 TS 化（已终裁）

### 顺带（不阻塞）

`patchReload: live` 已确认（配置热载默认开）；模块级 HMR 开关也已验证可开，但**动态观察需要长驻 profile（web/tui 类）**。若本轮建了长驻 profile，顺手看一眼改插件代码后能否不重启生效——试不出来就算，不卡。


【老大注：sk-6f42002aa5b84499bdbf931de7fa048a，DSH2.3的测试Key，依然按需取用】

---

## 【Trae 交付回写 · 2026-09-09】DSH-2.3 Vue/Tauri ↔ DSH 连通

**状态：✅ 已交付**（与代码一并提交，基线 `dsh-v0.1.2-rc.1`）。

**结论（一行）**：**能。** Vue/Tauri 经 DSH `sdk` profile（stdio JSON-RPC）发消息并收到真实模型回包；GUI 与复跑路径同通道。

**连通方式**：profile = `sdk`（base + sdk-app）；传输 = stdio JSON-RPC（官方 TS SDK `@deepseek-ai/dsh-sdk-client` 驱动同版本 dsh runtime）；Tauri 侧**新写** `dsh_prompt` IPC（spawn `node harness/scripts/dsh-prompt.mjs`，一次性调用，非 P4 uvicorn 管理）；GUI 入口 = 主窗口顶栏「DSH」按钮（`DshProbe.vue`）。

**交付物**：报告 `exchange/dsh-23-vue-tauri-connect.md`（5 块齐全：结论/连通方式/原始输出/可复跑+踩坑/⭐能力边界观察）；代码见报告 §7（client 4 文件 + harness scripts 2 个 + deps）。GUI 按钮为人工点验项；WB 零 GUI 独立复验走 §4.2 两条 CLI 命令（同通道）。

**⭐ 能力边界观察要点（选型输入）**：sdk 面能做 = 完整会话 + **事件流粒度足够**（19 events/次含 turn·step·assistant/chunk·request/context·session/title·agent/inbox，记忆双写/流式 UI 信号齐备）+ 会话持久（session.jsonl）+ base 全套 agent 能力可达。受限 = stdout 归协议、wire 方法面窄（initialize/session.prompt 为主）、runtime 生命周期归 SDK（模块 HMR 动态观察仍待 web/tui 长驻载体）、无 HTTP/浏览器面。

**附带修复**：`tauri.conf.json` 删废弃 `plugins.shell.scope`（tauri-plugin-shell v2.3.5 schema 已移除该字段，导致 dev 启动 panic）——恢复现有 app 可运行，非新增破坏。`Cargo.toml` 仅被工具去 BOM、已还原不在改动集。

**隔离自检**：改动仅报告 §7 清单；`.dsh-home/` 排除未入 git；`ref/dsh-bare` 只读；key 仅环境变量未落盘；tauri dev 验证后已清理进程。