# DSH 调试体验台（DSH-3.9.1）

> ⏸ **临时台定位**：服务 DSH-3.9 退出信号①（调试体验 go/no-go），不按产品形态设计。
> 验收后归宿 = 3.8 延后清单的器材。禁框架／禁构建链／禁状态管理库。

浏览器里摸 DSH 的完整交互：**多轮对话**（同一 session）、**实时事件流面板**
（`user/message` ／ `assistant/message` ／ `system/message` ／ `turn/end` 按 seq 滚出）、
**记忆召回块肉眼可见**、**审批卡可点**（批准 → 动作发生 ／ 拒绝 → 被拦）。

## 一条命令起台

```powershell
node harness/scripts/dsh-console/bridge.mjs
```

启动后终端会自报监听地址（默认 `http://127.0.0.1:8791/`），浏览器打开即可。

可选参数：

| 参数 | 缺省 | 说明 |
|---|---|---|
| `--port <n>` | `8791` | HTTP ＋ WS 同端口，只绑 `127.0.0.1` |
| `--cwd <dir>` | `D:\Temp\DSH-Dev-Temp` | dsh 会话工作区（沙箱 `workspaceRoot`；安全区，⛔ 默认不暴露仓库根） |
| `--home <dir>` | `<repo>/.dsh-home` | 源 home（只读；跑完不在里面留运行时文件） |
| `--evidence <dir>` | `D:/Code/_trae-evidence/391/run-<ts>` | 帧／通知／审批／收尾报告落盘目录 |
| `--keep-home` | 关 | 保留临时 home 供复核（默认收尾删除） |
| `--session <id>` | 自动生成 | 复用固定 sessionId（一般不传） |

## 它怎么搭起来的（B 主案）

- **每次起台复制** `.dsh-home/profiles/sdk` → 临时 home（`mkdtemp` ＋ `cpSync` ＋ 删副本
  `.modules.yaml`，381 范式）；源 `.dsh-home` 只读。
- 临时 home 内 **junction** 三个审批插件（`plugin-sdk-relay` ／
  `plugin-approval-remote-answerer` ／ `plugin-approval-answerer`），并在副本
  `dsh.profile.bundles` 末尾按 **relay → remote → answerer** 顺序追加
  （remote 必须早于 answerer：后者在 `apply` 时 probe 替换口）。
- **记忆插件**随 profile 复制；其 `dbPath` 固定为 `.dsh-home/larry-memory.db`
  ⇒ 记忆跨台持续（临时 home 删除不影响）。
- **召回只走 context 面**（synthetic `user/message` 帧，动态区）；`injectSection` 默认关闭
  ⇒ 召回这种 volatile 内容不进 system prompt 前缀（缓存命中友好）。召回块**不含时间戳**，
  时间只存 SQLite（DSH-3.9.1-b A-①／A-②／D）。
- **usage 计量**：每轮 `assistant/message.data.usage` 已在页面显示
  （`in`＝未命中输入 ／ `cache`＝命中 ／ `out`＝输出，顶部有累计），并落盘 `<evidence>/usage.jsonl`。
- **凭据只复制**：`.credentials.yaml` 复制到临时 home，由 dsh 自己读取；
  bridge ⛔ 不读值、⛔ 不注入 env、⛔ 不打印。
- 审批链路 = 3.3-b 已验证形态的复用：dsh 侧 `approval/request` 出站 → bridge →
  页面按钮 → `driver.answer(frameId, result)` 写回；⛔ bridge 不代答。

## WS 协议（本台临时约定；3.8 定稿后可能改名）

server → page：

| type | 载荷 | 说明 |
|---|---|---|
| `hello` | `sessionId` / `childPid` / `cwd` / `evidence` / `bundles` / `node` | 建连自报 |
| `event` | `sessionId` / `event` | dsh `session.event` 原文（事件流面板来源） |
| `notification` | `method` / `params` | 其它通知（如 `session.status`） |
| `approval` | `frameId` / `requestId` / `toolName` / `callId` / `agentId` / `reason` | 审批卡数据 |
| `approval-result` | `frameId` / `result` / `accepted` | 回传是否被 driver 接受 |
| `prompt-accepted` | `messageId` / `text` | 消息已被 dsh 受理（非答案） |
| `error` | `message` | 起台／会话错误 |
| `stopping` | `reason` | 收尾开始 |

page → server：

| type | 载荷 | 说明 |
|---|---|---|
| `prompt` | `text` | 发一条用户消息（同一 sessionId 连续多轮） |
| `approval-answer` | `frameId` / `result` | `result` ∈ `allowed-once` ／ `rejected` |
| `stop` | — | 发协议 `shutdown`，等 dsh 自退并关闭本台 |

## 验收对照（J1–J6）

| # | 判据 | 在本台怎么验 |
|---|---|---|
| J1 | 一条命令起台 | 上面的命令；终端自报 URL；`startup.json` 里有 `listen` ／ `launch` ／ `bundles` |
| J2 | 多轮 ≥3 轮上下文保持 | 同一 session 连问；第 3 轮问「我们第一句说了什么」，答含首轮内容；对话录见 `ws-frames.jsonl` ／事件帧 |
| J3 | 事件流实时可见 | 右侧面板按 `#seq` 滚出；`user/message` ／ `assistant/message` ／ `system/message` ／ `turn/end` 四类都在 |
| J4 | 记忆注入肉眼可见 | 先陈述事实 → 后续轮左侧出现「召回注入（system/message #N）」气泡；展开事件可看帧原文（含 `## LarryAgent 记忆召回`） |
| J5 | 审批闭环可点 | 让 AI 写**工作区外**路径（如 `D:\Temp\DSH-Outside\hello.txt`；⛔ 不要用仓库根反向制造提权演示）⇒ 页面弹审批卡；批准 → 文件出现，拒绝 → 工具报被拒且文件不存在 |
| J6 | 收尾无孤儿 | 页面「停止 bridge」或 Ctrl+C ⇒ 终端 `STOP-REPORT`（`childExit.code=0`）⇒ `tasklist` 无 dsh 进程 |

## 已知边界（诚实清单）

- 审批 RPC 方法名 `approval/request` 是 **3.3-b 临时约定**；3.8 定稿若改名，本台随之改。
- 临时 home 每次起台重建：dsh 会话日志随临时 home 删除；**只有记忆库**（`.dsh-home/larry-memory.db`）跨台保留。
- 本台只绑 `127.0.0.1`，不对外提供任何服务。
- 审批 `answerTimeoutMs=0`（不设答者侧超时）：页面不点，该回合会一直等；想放弃就停 bridge。
- 依赖 `ws`（已登记 `harness/package.json`，`pnpm-lock.yaml` 锁定）。
- 记忆插件不配 `chromaUrl`：本台只验注入面（召回 = SQLite 最近 N 条）；向量双写仍由 3.6 装置覆盖。
- **时间戳为本地时刻**：落盘／显示层统一用 `localIso()`（ISO 带本机偏移，如 `+08:00`）；
  dsh 协议帧内的 epoch 值保持原样（中性事实，不改）。
- **dsh-driver 时间戳改动要连构建产物**：源在 `harness/packages/dsh-driver/src/index.ts`
  （`localIso()` 是唯一序列化点）；改后运行
  `pnpm --filter @larryagent/dsh-driver run build` 重新生成 `lib/`。
  ⚠️ `harness/packages/*/lib/` 被 `harness/.gitignore` 忽略、**不入库** ⇒ 换机/新 clone 后必须先构建。
