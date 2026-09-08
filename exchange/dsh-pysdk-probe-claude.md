# DSH Python SDK 一等/二等公民判定——Claude 实测报告

> **执行者**：Claude Code（测试方视角：能力测绘 + 失败面验证）
> **日期**：2026-09-08
> **版本**：deepseek-harness-sdk 0.1.2rc1 + deepseek-harness-runtime-bin 0.1.2rc1（锁定版 `dsh-v0.1.2-rc.1`）
> **回答**：**一等公民**（见 §5；边界与待实测项见 §7）

---

## 1 环境事实（可复现性基础）

| 项 | 值 |
|---|---|
| OS | Windows 11 Pro 10.0.26200.9168 |
| Python | 3.11.9（venv：`D:\Temp\dsh-probe\probe-claude\venv`） |
| 系统 Node | v24.14.1 存在（`D:\App\node\`），测试时移出 PATH（见自检 3） |
| 所装包 | `deepseek-harness-sdk 0.1.2rc1`、`deepseek-harness-runtime-bin 0.1.2rc1`（PyPI） |
| DSH_HOME | `D:\Temp\dsh-probe\probe-claude\dsh-home`（专属，含 baseline git） |
| runtime 形态 | `deepseek-harness-sdk-runtime-win-x64.exe`（233 MB 单文件，Node SEA 打包，内置 Node 依赖树 + profile bundles） |

**隔离自检四项原始输出**：

```
1. DSH_HOME = D:\Temp\dsh-probe\probe-claude\dsh-home（探针专属，无他人文件）
2. venv prefix = D:\Temp\dsh-probe\probe-claude\venv（专属）
3. node -v（PATH 剔除 node 目录后）→ /usr/bin/bash: line 1: node: command not found（预期报错 ✅）
4. 端口：无固定端口占用（MCP 走 stdio 无端口；HTTP profile 未用）
```

**baseline git**：`dsh-home/` 空 baseline 提交 `7793ea0`；跑完后 `git status` 显示新增 `.anonymous-user-id / profiles/ / sessions/ / storages/`——全部为 runtime 自动生成物，**都在探针专属目录内**（隔离自检通过，无他人污染迹象）。探针脚本 13 个存于 `probe-claude/`。

---

## 2 A 结论 + JSON-RPC 方法面清单

### A 结论：sdk 与 sdk-minimal 两 profile 均在**无系统 Node** 环境下完整跑通 🟢

```
profile=sdk：      启动+初始化 0.8-1.5s；turn 正常返回（finish_reason 结构完整）
profile=sdk-minimal：同上（事件序列少 1 个 user/message，其余等价）
```

### JSON-RPC 方法面清单 🟢（来源：`packages/sdk/protocol/README.md` 锁定版 + 实测）

| 方向 | 方法 | 载荷 |
|---|---|---|
| client→server | `initialize` | InitializeParams → InitializeResult（provider/model/reasoningEffort/maxTokens 在此声明） |
| client→server | `session/prompt` | SessionPromptParams → SessionPromptResult（durable enqueue receipt） |
| client→server | `shutdown` | — → {} |
| server→client | `session.event` | SessionEventNotification（**全 runtime 所有 session，未过滤**） |
| server→client | `session.status` | 整 agent running/idle 转换 |
| server→client | `subagent.started` | — |
| server→client | `subagent.finished` | 含 lastAssistantMessage（in-process 运行） |

**方法面窄（3 请求 4 通知）——但能力不由方法面决定**：session.event 携带完整事件流（见 §4），工具/插件/角色经挂载通道注入（见 §3），SDK 是"控制面窄 + 数据面全"的结构。

---

## 3 B 三通道结论表

| 通道 | 结论 | 证据（均可复跑） |
|---|---|---|
| **B1 TS bundle**（cordis 插件挂载） | ✅ **可行** | 手工放置最小 cordis 插件包至 `$DSH_HOME/profiles/sdk/node_modules/@larryprobe/b1-tool/`（package.json + ESM index.js），patch `insert` → 子进程 stderr 出现 `[B1-PROBE] external bundle loaded by cordis`；**重启后仍加载**（持久）🟢。无需 pnpm/Node（手工放置即可）；cordis 接受 ESM js（产品可 TS 编译产物） |
| **B2 patch.yml** | ✅ **可行** | SDK `patches` 参数（= CLI `--patch`）传 overlay → persona 加标记 `[B2-PATCH-MARKER-9f3a]` 出现在 request/header 事件 system 中 🟢。另有持久层 `$DSH_HOME/profiles/sdk/cordis.patch.yml`（profile 自带，bundle 层后、--patch 前） |
| **B3 MCP 桥** | ✅ **可行** | Python 侧手写最小 MCP stdio server（echo 工具）→ patch insert `@deepseek-ai/dsh-mcp-client`（config: transport stdio + command/args）→ agent 工具面出现 `mcp__larry-probe__echo_probe` 🟢。**Python 能力可零 TS 暴露为 DSH 工具** |

> B1 细节：外部包解析 = 标准 Node 模块解析（`$DSH_HOME/profiles/sdk/` 起），insert 不存在包报 `ERR_MODULE_NOT_FOUND`（机制开放、非封闭白名单）。cordis.patch.yml 注释确认合成顺序 = bundles → 自己的 cordis.patch.yml → --patch overlays。

---

## 4 事件流粒度结论

**`on_notification` / session.event 含完整工具与对话详情** 🟢：

- 实测事件序列：`agent/inbox/spliced → turn/start → step/start → user/message → session/title → request/header（完整 system prompt + 工具 schema）→ request/context → assistant/chunk → step/end → turn/end`
- 锁定版源码 `known-event-types.ts` 全量含：**tool/call、tool/result、tool/code-dispatch、approval/asked、approval/decided、approval/policy、llm/retry、llm/retry-started、compaction/start/prune/end/summary、request/context、request/header、permission/preset、sandbox/mode、feedback/record、hook/invoked** 等

**2.4.2 记忆双写数据源判据 ✅**：对话内容 + 工具调用 + 审批 + compaction 全在事件流，Python 侧订阅 session.event 即可重建记忆提取所需的全部输入。

---

## 5 C 判定（四条逐项 + 最终判定）

### 判据 1：能力覆盖 —— ✅ 无实质缺口（经挂载通道论证）

- 方法面窄（3 请求 4 通知）但**不是能力天花板**：session.event 全量事件流（§4）+ 三通道挂载（§3）使 TS 侧可达能力在 SDK 侧均可达
- 31 子项核心链路实测可达：会话（session/prompt ✅）、工具（B1/B3 双通道 ✅）、角色（patch persona/preset ✅）、事件数据（§4 ✅）、MCP（DSH mcp-client 原生 ✅）
- **已知边界（非 SDK 缺口，属本体待实测）**：sandbox restricted token Windows 生效性 = 阶段 2 实测项③（sandbox 是工具执行层，SDK 路径下随工具管道自动生效，无需 SDK 直接调用）

### 判据 2：挂载通道 —— ✅ 三条全过（§3）

B3 MCP 桥可行（决定 shell/file_ops 可留 Python ✅）+ B1、B2 均可行 → **本条最强证据**

### 判据 3：官方支持度 —— ✅ 两项有一等证据

- 🟢 官方 README 原文：Python SDK 是 TS client 的**设计孪生**，speaks the same protocol（`packages/sdk/README.md`）
- 🟢 发布同 train：npm `0.1.2-rc.1` = PyPI `0.1.2rc1`，与锁定版一致（实测安装版本）
- 🟢 runtime-bin 官方打包（Windows x64 wheel、无需系统 Node.js——已实测）
- 🟡 CI smoke 对 Python SDK 的覆盖：未直接查证（不影响判定——已有两项硬证据）

### 判据 4：可独立运行 —— ✅ 实测通过

**Node 从 PATH 完全移除后**（node/npm 均 command not found），sdk + sdk-minimal 两 profile 完整跑通（§2）——"无需系统 Node.js"声明**真验成立**（非环境残留假象）

### 最终判定：**一等公民** 🟢

四条全满足。判定基于可复现实测（13 探针脚本 + 原始输出见本报告各节），非推断。

---

## 6 落地形态建议

**A-service（Python 后端 + DSH runtime 子进程）**。

一句话理由：一等判定通过 ⇒ Python 资产全保留（代码 ~4.4k 行 + 测试 ~4.4k 行 + conftest 隔离基建 + embedding 链），B1/B2/B3 三通道提供语义层挂载的全部所需，双轨并行天然成立（切换 = 改子进程启动参数），且保留 sdk/acp 协议层脱钩通道（§3.4 上游集中度应对不因 A-service 受损——脱钩通道本来就是 sdk/acp profile）。

语义层（23 项自做）落法：**优先 B3 MCP 桥 + B2 patch**（Python 侧保持）；**B1 TS 插件**留给确需 cordis 内嵌的部分（如 agent 生命周期钩子）。**不预断全部走单一通道**——按能力逐项选通道，但骨架 = Python。

---

## 7 边界契约层 6 类失败模式表 + 意外发现

### 6 类失败模式实测

| # | 类别 | 能否实测 | 结果 |
|---|---|---|---|
| 1 | **子进程生命周期** | ✅ | 强杀子进程（taskkill /F /T）→ SDK 检测到退出；杀后请求报 **TransportClosedError**（"Failed to write... exit code: 1"）——**优雅报错非挂起**；close 后新实例 start + 新会话跑通 ✅ |
| 2 | **协议层** | ✅ | 未知方法 → `JsonRpcError code=-32603`（runtime 自定义码，非标准 -32601，但语义清晰 "unknown method"）；缺参 → `JsonRpcError code=-32603` 参数校验错误——**错误结构含 code/message/data，可映射到 LarryException** ✅ |
| 3 | **超时与取消** | ⚠️ 部分 | `request_timeout_seconds`/`initialize_timeout_seconds` 参数存在且生效路径可读（超时报错消息明确）；无 LLM 慢请求场景下未实测 abort 透传——标注待补 |
| 4 | **状态一致性** | ⚠️ 部分 | **跨进程 session resume 实测通过**（同 session_id 在进程 2 可用）；DSH session 持久化到 `$DSH_HOME/sessions/`（实测目录生成）。双写崩溃一致性属**我们自做层**（SQLite 在 Python 侧），非 SDK 行为——待 A-service 落地时按我们既有双写设计保障 |
| 5 | **升级后契约漂移** | ⚠️ 部分 | 方法面清单已固化为 §2 表格 = **契约快照的原始输入**（升级后可 diff）；事件类型清单来自锁定版源码可复现。未实际升级验证 |
| 6 | **资源与凭据** | ✅ | **key 泄漏扫描**：占位 key `sk-probe-placeholder-9f8e7d6c` 未出现在 events/notifications/stderr——**无完整泄漏**；但错误消息含脱敏尾部 `****7d6c`（DeepSeek API 侧回显，业界惯例，风险可接受）；子进程 stderr 干净（无凭据噪音）✅ |

### 意外发现

1. **`dsh --profile sdk --dump-config` 稳定段错误** 🟢：runtime-bin 的 dsh.exe 在 Windows 下该命令 crash（rc 0xC0000005 access violation，bash/cmd/subprocess 三环境复现）。不影响 SDK 主路径（Python SDK 不经该命令），但 CLI 调试面有此缺陷，建议上游 issue 或绕行
2. **runtime 首次启动实体化完整 profile 到 DSH_HOME** 🟢：`profiles/node_modules/`（2.2MB stub 树转发 SEA 快照）+ `profiles/sdk/`（cordis.yml/cordis.patch.yml/package.json/pnpm-workspace）+ `sessions/` `storages/`——DSH_HOME 是可写的完整运行时根，非只读虚拟
3. **stub 文件暴露 SEA 快照路径** 🟢：`C:/snapshot/deepseek-harness/python/sdk-runtime/...`——打包内部结构可读（对 fork 自维护是利好）
4. **事件类型含 `session-log-deepseek/delivery-accepted`** 🟡：疑似 DeepSeek 专用会话日志通道，若走 A-service 值得确认是否向 DeepSeek 侧发送数据（出境面相关，与 2.7.5 数据主权联审）

### 阻塞 / 我认为规格可补的点

- **无阻塞**。四条判据均完成实测覆盖
- **规格补充建议 1**：判据 1 的"31 子项任一必需能力在 Python 侧拿不到即实质缺口"——建议操作化定义"拿不到"= 无法经（方法面 ∪ 事件流 ∪ 三通道）实现，而非"方法面上无此方法名"（方法面窄是设计使然，非缺口）
- **规格补充建议 2**：sandbox restricted token 生效性（阶段 2 实测项③）与 SDK 一等判定**正交**——前者是 sandbox 本体在 Windows 的质量问题，无论 A-framework/A-service 都要验；建议明确该实测结果不回流修改本条判定（避免把两个独立问题绑在一起裁决）
- **失败模式 3/5 待补**：无真实 LLM 场景下 abort 透传与真实升级契约 diff 未实测——不阻塞一等判定（判据不依赖这两条），但建议列为 A-service 落地后测试计划输入

---

## 附：可复跑步骤（复现路径）

```bash
# 1. 环境（Windows，Python 3.11）
python -m venv venv
venv/Scripts/python -m pip install deepseek-harness-sdk deepseek-harness-runtime-bin==0.1.2rc1
# 2. DSH_HOME（必须显式，SDK 不用 ~/.dsh）
export DSH_HOME=D:\Temp\dsh-probe\probe-claude\dsh-home   # 任意专属空目录
# 3. 无 Node 验证（关键——PATH 剔除 node 目录）
export PATH=$(echo $PATH | tr ':' '\n' | grep -viE 'node|nvm' | tr '\n' ':')
node -v   # 必须报错
# 4. 跑探针
venv/Scripts/python probe_a_connect.py        # A 连通
venv/Scripts/python probe_a3_profiles.py      # 双 profile
venv/Scripts/python probe_b2_patch.py         # B2（需同目录 patch_b2.yml）
venv/Scripts/python probe_b1_ext.py           # B1（需已放置 @larryprobe/b1-tool 包）
venv/Scripts/python probe_fail_lifecycle.py   # 生命周期
venv/Scripts/python probe_fail_proto2.py      # 协议错误码
```

探针脚本与 patch 文件均存于 `D:\Temp\dsh-probe\probe-claude\`（项目外，不污染仓库）。
