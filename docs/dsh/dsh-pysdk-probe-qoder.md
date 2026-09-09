# DSH Python SDK 实测：一等 / 二等公民判定（Qoder）

> 🔒 **实证存档 · 永久保留**（老大定，此文档价值高，不参与柔性清理，任何人不得删）
> ✅ **本报告结论即最终裁定口径**：WB 判 **二等**、老大确认 → 走 **A-framework**，与 `dsh-migration.md` §3.5 一致。

日期：2026-09-08  
锁定版本：`dsh-v0.1.2-rc.1` / commit `a66e4702047846cdaa10c66c9d3df3951f5ea70d`

> **最终判定：二等**
>
> 决定性理由：🟡 锁定版 SDK 的 JSON-RPC 请求面只有 `initialize`、`session/prompt`、`shutdown`。它可以启动会话、投递消息和退出，却没有回答待处理 `approval` / `ask-user` 的协议方法；`session/prompt` 只是向 inbox 投递普通消息，不能结清 Cordis interaction waterfall。原生 TS/Cordis 路径具有同进程 `userQuestions.ask()`、`ApprovalService.request()/decide()` 与 answerer waterfall。故 31 子项中的 **2.7.2 边界透明（approval/ask-user）在 Python SDK 路径上拿不到，能力覆盖硬阈值不满足**。
>
> 这不是说 Python SDK 不可用。它的基础运行、B1/B2/B3、事件流、官方发布和无 Node 运行均表现良好；但题目比较对象是“Python SDK 路径 vs 原生 TS 路径”，不是“Python SDK client vs TS SDK client”。后两者协议同面，前两者仍有实质能力差。

## 1. 环境事实与隔离自检

证据等级：🟢 本机实测；🟡 锁定版官方源码、文档或工作流；🔴 推断。

| 项目 | 事实 |
|---|---|
| 实测日期 | 🟢 2026-09-08 |
| OS | 🟢 Microsoft Windows 11 Pro 10.0.26200 build 26200，AMD64 |
| Python | 🟢 3.11.9，MSC v.1938 64 bit |
| venv | 🟢 `C:\Users\SuLarry\.qoderwork\workspace\msg77v9db96tjzz2\probe-qoder\venv` |
| DSH_HOME | 🟢 `C:\Users\SuLarry\.qoderwork\workspace\msg77v9db96tjzz2\probe-qoder\dsh-home` |
| Python 包 | 🟢 `deepseek-harness-sdk==0.1.2rc1`；`deepseek-harness-runtime-bin==0.1.2rc1` |
| DSH 源码 | 🟡 tag `dsh-v0.1.2-rc.1`，commit `a66e4702047846cdaa10c66c9d3df3951f5ea70d` |
| DSH_HOME baseline | 🟢 commit `515418718841acca635344df5f9cd8765f97dd47` |
| 模型凭据 | 🟢 仅使用占位 key `dsh_probe_invalid_placeholder`；模型端为本机临时 HTTP mock，未读取或使用真实 API key |
| MCP 传输 | 🟢 Python MCP fixture 走 stdio，不占固定 TCP 端口；独立端口自检 `43179` bind 成功。最终 mock 模型端口由 OS 临时分配，复跑为 `56337` / `56344` |

隔离自检原始输出：

```text
DSH_HOME=C:\Users\SuLarry\.qoderwork\workspace\msg77v9db96tjzz2\probe-qoder\dsh-home
venv prefix=C:\Users\SuLarry\.qoderwork\workspace\msg77v9db96tjzz2\probe-qoder\venv
MCP_PORT=43179 available
```

```json
{
  "command": "node -v",
  "removedPathEntries": [
    "C:\\Program Files\\nodejs",
    "D:\\App\\node"
  ],
  "nodeOnPath": null,
  "exitCode": 127,
  "stdout": "",
  "stderr": "FileNotFoundError: [WinError 2] system cannot find the file specified"
}
```

🟢 此处不是只给子进程传过滤后的 `env`：探针先修改父 Python 进程的 `os.environ["PATH"]`，再执行 `node -v`。这是因为 Windows 创建进程时，可执行文件查找不能仅靠传入子进程的环境块来证明隔离。

跑完后的 DSH_HOME 原始状态：

```text
DSH_HOME baseline commit:
515418718841acca635344df5f9cd8765f97dd47

Final git status --porcelain=v1:
?? .anonymous-user-id
?? profiles/
?? sessions-b1/
?? sessions-profile-minimal/
?? sessions-profile-sdk/
?? sessions/
?? storages/

Final git diff --no-ext-diff:
(empty; all runtime products are untracked relative to the baseline)
```

🟢 所有变化都位于 Qoder 自己的 `probe-qoder/dsh-home`，目录名分别对应 profile 初始化、B1、B2/B3、session persistence 和 storage 初始化；未发现无法解释的外来文件。🟢 LarryAgent 仓库本身未写入 venv、DSH_HOME 或探针运行产物。

## 2. A 结论与 JSON-RPC 方法面

### A 结论

🟢 `sdk` 与 `sdk-minimal` 均在 `nodeOnPath=null`、本地 mock 模型、无真实 key 的条件下完成一个完整回合。

```json
{
  "mockModelPort": 56337,
  "modelRequestCount": 2,
  "profiles": [
    {
      "profile": "sdk",
      "sessionId": "qoder-sdk-full-turn-0d5f42d6",
      "finalResponse": "PROFILE_TURN_OK",
      "finishReason": "completed",
      "eventCount": 17
    },
    {
      "profile": "sdk-minimal",
      "sessionId": "qoder-sdk-minimal-full-turn-77c621e3",
      "finalResponse": "PROFILE_TURN_OK",
      "finishReason": "completed",
      "eventCount": 16
    }
  ]
}
```

### JSON-RPC 原始方法面

🟡 `packages/sdk/protocol/src/types.ts:115-118`：

```ts
export interface HarnessSdkRequestMap {
  'initialize': { params: InitializeParams; result: InitializeResult }
  'session/prompt': { params: SessionPromptParams; result: SessionPromptResult }
  'shutdown': { params: undefined; result: Record<string, never> }
}
```

| 方向 | 方法 | 主要字段 |
|---|---|---|
| client → server | `initialize` | `cwd`、`provider`、`model`、`reasoningEffort?`、`maxTokens?`；返回 `serverInfo` |
| client → server | `session/prompt` | `sessionId`、`contentBlocks`；返回 `messageId` |
| client → server | `shutdown` | 无参数；返回空对象 |
| server → client | `session.event` | `sessionId`、`event` |
| server → client | `session.status` | `idle | running` |
| server → client | `subagent.started` | parent / child session id |
| server → client | `subagent.finished` | provider、agentId、parent / child、status、stopReason、lastAssistantMessage? |

🟡 Python 能发出全部 3 个请求并消费全部 4 种通知；相对 **TS SDK client** 没有协议方法裁剪。🟡 Python 高层还提供 `DeepSeekHarness.run()`、`Session.run()`、`RunResult.events/notifications`；低层提供通用 `request/notify/next_notification/next_request/respond/respond_error`。

但这不能推出相对 **原生 TS/Cordis framework** 无缺口：

- 🟡 `packages/sdk/server/src/server.ts:247-255` 只分派上述三个 client 请求；runtime 不向客户端发起可由 Python `respond()` 回答的 interaction 反向请求。
- 🟡 `session/prompt` 是 inbox 消息投递，不是 interaction response，因此不能回答一个正在等待的审批或用户问题。
- 🟡 原生 `packages/interaction/user-questions/src/index.ts:86` 的 `UserQuestionService.ask()` 等待 `user-questions/request` waterfall；`packages/interaction/user-approval/src/index.ts:223/258` 在同进程执行 `request/decide` 和 `approval/request` waterfall。
- 🟢 B1 实测系统提示也明确显示：`Approval policy: ask ... without an available answerer, the request fails closed.` SDK profile 没有可交互 answerer 时会 fail closed。

因此，🟡 **2.7.2 是确定的能力差，不是类型体验差异**。这已经足以让硬阈值第 1 条失败。

### 31 子项核对

🟡 31 项中，自做或留在 Python/Vue/Tauri 侧的产品能力不会因为 SDK 协议变窄而自动消失；B1 又能把必须运行在 DSH 内部的 TS/Cordis 插件挂入 sdk profile。🟢 本次实测还证明 2.5.2 工具挂载、2.5.3 MCP 与 2.4.2 所需的基础工具事件可以取得。

但 🟡 `dsh-migration.md` 已将 2.7.2 写成“DSH interaction 承接，approval/ask-user 开箱”。该承接在原生 framework 中成立，在 SDK JSON-RPC 边界上不成立。要在 A-service 中恢复用户可达语义，必须另写 TS answerer/桥接协议，或在 Python/Tauri 侧重做一套不同的批准机制；这已不是“Python SDK 直接拿到”。

另外两项不能被正例扩大解释：🟡 SDK 无 wire-level mid-turn cancel；请求 timeout 只停止 client waiter，不会取消服务端 turn。🟢 单次 `tool/call` / `tool/result` 成功也不能代替失败、重试、子代理、崩溃恢复、顺序与幂等测试。因此 2.3.2 停止语义和 2.4.2 生产级双写可靠性仍需另做，但本报告不依靠这些未完成项作最终判定。

## 3. B 三通道结论表

| 通道 | 判定 | 证据 | 边界 |
|---|---|---|---|
| B1 TS bundle | **可行** | 🟢 本地 bundle `dsh-qoder-b1-plugin` 被写入 sdk profile；无系统 Node 运行时，mock 模型实际收到 `QODER_B1_PLUGIN_LOADED`，最终 `B1_PLUGIN_OK` | 🟢 初次安装没有 pnpm 时失败；在探针目录隔离安装 `pnpm 10.17.1` 后成功。即运行期可无 Node，安装/更新期仍需 Node + pnpm。插件本体仍是 TS/Cordis，不是 Python 原生扩展 |
| B2 invocation patch | **可行** | 🟢 `DeepSeekHarness(patches=(mcp.patch.yml,))` 成功按调用级插入 `@deepseek-ai/dsh-mcp-client`，没有持久改写全局默认 DSH_HOME | 🟢 B2 与 B3 在同一正例中联动验证；B2 证明配置叠加生效，不等于所有 patch 组合都安全 |
| B3 MCP 桥 | **可行（Tools）** | 🟢 Python stdio MCP server 完成 `initialize → notifications/initialized → tools/list → tools/call`；DSH 调用 `mcp__qoder__add(19,23)` 得到 `42`，最终 `MCP_BRIDGE_OK` | 🟢 只实测 MCP Tools；未证明 Resources、Prompts 或任意 Cordis 内部 service/hook 能经 MCP 等价桥接 |

B1 最终复跑摘要：

```json
{
  "nodeOnPath": null,
  "profile": "sdk",
  "sessionId": "qoder-b1-probe-f8b711d7",
  "marker": "QODER_B1_PLUGIN_LOADED",
  "markerSeen": true,
  "finalResponse": "B1_PLUGIN_OK",
  "finishReason": "completed"
}
```

B1 安装阶段原始摘要：

```json
{
  "withoutPnpm": {
    "exitCode": 1,
    "stderr": "pnpm is not recognized; dsh: pnpm failed in profile directory"
  },
  "withIsolatedPnpm": {
    "pnpmVersion": "10.17.1",
    "exitCode": 0,
    "dependency": "dsh-qoder-b1-plugin file:<b1-plugin>"
  }
}
```

结论：🟢 原挂载阈值“B3 可行，且 B1/B2 至少一条可行”满足；事实上三条最小正例均跑通。但它不能抵消 A 的 interaction 协议缺口。

## 4. 事件流粒度结论

> **结论：`on_notification` 含工具调用名称、call id、参数、结果正文、错误标记和顺序关联字段；足以作为 2.4.2 双写的基础数据源，但尚不足以宣称生产级双写可靠。**

🟢 原始工具调用：

```json
{
  "type": "tool/call",
  "seq": 18,
  "data": {
    "turn": 1,
    "step": 1,
    "callId": "qoder-mcp-add",
    "name": "mcp__qoder__add",
    "arguments": "{\"a\":19,\"b\":23}"
  }
}
```

🟢 原始工具结果：

```json
{
  "type": "tool/result",
  "data": {
    "turn": 1,
    "step": 1,
    "message": {
      "source": {"kind": "tool", "callId": "qoder-mcp-add"},
      "content": [{
        "type": "tool-result",
        "toolCallId": "qoder-mcp-add",
        "content": [{"type": "text", "text": "42"}],
        "isError": false
      }]
    }
  },
  "sourceEventSeqs": [18],
  "surfaceOp": "append"
}
```

🟢 `RunResult.events` 与 `on_notification` 均能取得该事件；通知方法序列由 `session.event` / `session.status` 组成。🟡 Python 将 event、content block、payload 多数建模为 `JsonObject`，没有 TS 判别联合类型与同等级运行时校验，升级时更容易静默接受字段漂移。

## 5. C 判定

| 硬阈值 | 结果 | 理由 |
|---|---|---|
| 1. 能力覆盖 | **不满足** | 🟡 SDK client 与 TS SDK client 同面，但相对原生 TS/Cordis 缺少 interaction response。31 子项 2.7.2 无法通过 SDK JSON-RPC 用户可达 |
| 2. 挂载通道 | **满足** | 🟢 B3 可行；B1、B2 均可行 |
| 3. 官方支持度 | **满足（2/3）** | 🟡 官方 Python SDK 指南存在；🟢/🟡 PyPI 包 `0.1.2rc1` 与根 release `0.1.2-rc.1` 同 train。🟡 仓库有四平台 runtime wheel、clean venv、keyless smoke、MCP 等工作流定义，但本次 GitHub Actions REST 查询未取得公开成功 run，故不把“CI 实绩”计入，只按文档 + 同 train 两项通过 |
| 4. 无系统 Node 独立运行 | **满足（限运行期）** | 🟢 PATH 中移除两处 Node 后 `node -v` 为 127；sdk、sdk-minimal、B1 runtime、B3 MCP 均完整回合成功。🟢 B1 初装仍需 Node/pnpm，不能扩大成“全生命周期不需要 Node” |

依据题定规则“任一条不满足即二等”，最终三选一结论是：

# **二等**

这不是“无法判定”：2.7.2 的差异有锁定版协议和原生 interaction service 的确定源码证据。也不是“一等但体验差”：它改变了审批/问询能否通过既有 SDK 契约完成，是能力缺口。

## 6. 落地形态建议

> **A-framework。** 一句话理由：老大已裁定“二等即全面 TS 化”，而决定性缺口恰在安全边界的人机 interaction，不值得为保留 Python 主控再自造一层未被官方 SDK 定义的 TS↔Python answerer 协议。

Python 仍可保留在独立算法或数据服务中，例如 embedding、批处理和迁移工具；但 DSH 会话主控、interaction、插件生命周期与取消/恢复边界应贴近原生 TS/Cordis。

## 7. 反向举证、阈值审查、意外发现

### 7.1 “其实是二等”的证据

1. **决定性能力缺口。** 🟡 JSON-RPC 无 interaction answer 方法；原生 Cordis 有 scoped answerer waterfall。Python 低层虽然有通用 `next_request/respond*`，但 runtime server 不发对应反向请求，因此这些方法不能补上 2.7.2。

2. **没有原生 Python 插件 API。** 🟡 Python 包没有 Cordis `Context`、service 注入、生命周期 hook 或 `define_tool()` 同级接口。需要内部 hook 时仍要写 TS bundle；B1 证明“能挂 TS”，不证明“Python 与 TS 扩展同权”。

3. **MCP 只覆盖所测 Tools。** 🟢 B3 正例不能替代 Resources、Prompts、session service、interaction waterfall 或任意内部 hook。把“能挂一个加法工具”推广为“所有 Python 能力均可桥接”属于过度外推。

4. **取消与超时语义弱。** 🟡 无 wire-level mid-turn cancel；client timeout 不等于 server turn 取消。高层 `run()` 以 inbox receipt 到下一次 idle 划活动区间，不是严格 prompt-response 因果绑定。

5. **类型与校验弱于 TS。** 🟡 Python 的事件、内容块和 payload 多为 `JsonObject`；TS 有判别联合类型和更细校验。Python 根包还未导出部分底层错误、订阅类型和精确协议 union。

6. **Windows 管理入口实测故障。** 🟢 `venv\Scripts\dsh.exe --version` 在本机稳定触发 segmentation fault（Bash 退出码 139 / signal 11；Windows 原生观测为 access violation）。同 wheel 内 native runtime 可直接运行，所以 SDK 回合未受影响，但官方文档依赖的 `dsh plugin` 管理入口在目标平台不可靠。

7. **B1 安装期仍依赖 Node/pnpm。** 🟢 不带 pnpm 的安装失败；隔离补装 pnpm 10.17.1 后成功。生产运行可预打包后无 Node，但开发、安装和升级链路不是纯 Python。

8. **官方支持信号并非全强。** 🟡 官方文档、同 train、四平台工作流定义都是真实正信号；反面是 Python 示例数量明显少于 TS、当前只锁定一个候选发布点，尚不能用 2–3 个后续 release 证明长期同步；本次也未取得公开 CI 成功 run 记录。

### 7.2 四条阈值审查

**第 1 条既过松又定义冲突。** “JSON-RPC 方法差集为空”只比较两个 SDK client，会漏掉原生 framework service；“31 子项必需能力用户可达”却是在比较完整路径。二者不是同一个尺度。本次若只看 3 请求 / 4 通知，会误判一等；加入 2.7.2 用户场景后才暴露真实差异。应以用户场景闭环为主，方法清单只作定位工具。

**第 2 条过松。** “三条通道各有一个最小正例”不能证明生产挂载面等价。B1 只是能挂自定义 system prompt，B3 只是一个 MCP Tool，事件流也只有单次成功案例。正确门槛应是：每个必需自定义能力都有明确归属、受支持的挂载方式、失败语义与回归测试，而不是数通道。

**B3 作为硬门槛对终态过严、对当下又过弱。** 终态 file_ops/shell 下沉 Tauri 客户端后，不经过 DSH，B3 不是必要条件；当下 A-service 中它能复用 Python 工具，确有迁移价值。但“B3 能跑”也无法证明 interaction、内部 service/hook 可桥。建议按“能力路由矩阵”验收：每项能力走客户端、本地 Python 服务、MCP、B1 TS bundle 还是原生 DSH，并逐项闭环，不给 B3 固定特权。

**第 3 条过松。** 文档 + 同 train 可以在 CI 从未成功或目标平台入口崩溃时仍得分。目标平台成功 smoke 应是必选项；同 train 还应区分“版本号相同”和“协议兼容/升级窗口有承诺”。

**第 4 条需拆分，当前写法过于含混。** 运行期无 Node 是 LarryAgent 交付的重要门槛，合理；但若把安装/更新也算入“完整跑通”，B1 会失败。应分为“最终产物运行时无系统 Node”和“开发/打包链路允许隔离 Node toolchain”两条。

### 7.3 应补的第五条

建议新增 **“运行语义与可运维性等价”**：目标平台上，交互回答、取消、超时、崩溃恢复、事件顺序/幂等、错误码、诊断日志、版本协商和升级回归必须有与原生路径等价或已接受的闭环。它比“社区 issue 响应速度”更硬，也能同时覆盖本次暴露的 interaction、session collision、timeout 和 Windows launcher 问题。

### 7.4 替代判定口径

建议改为五道门，任一已证实不满足即“二等”，证据确实不足才“无法判定”：

| 门 | 验收对象 |
|---|---|
| P：产品承诺闭环 | 31 子项逐一列出用户操作 → 调用路径 → 成功/失败反馈 → 持久化结果；不是只列 API 名 |
| E：扩展边界同权 | 每个必需自定义能力有受支持实现点；不得依赖未定义的私有桥或“理论上可写一个 TS 插件” |
| O：运行语义 | interaction、cancel、timeout、恢复、事件顺序/幂等和诊断达到已接受的等价档位 |
| D：部署独立性 | 目标 Windows 运行产物无系统 Node；构建/安装依赖单列并可在 CI 固化 |
| S：官方支持 | 官方文档、目标平台成功 CI、同 train/兼容策略三项中，目标平台 CI 必选，另两项至少一项 |

按此口径，🟡 P、E、O 至少因 interaction response 失败，仍判 **二等**；结论不依赖阈值怎么微调。

### 7.5 意外发现与阻塞

- 🟢 首次复跑时三个探针因固定 `session_id` 与已落盘会话碰撞，报 `already has a persisted log on disk that does not match this live session`。这是探针的可复现性缺陷，不是 DSH 随机失败。脚本改为 UUID 后立即复跑，sdk、sdk-minimal、B1、B3 全部成功。
- 🟢 B1 初跑还遇到同一 session root 下既有 `.jsonl` 与默认 `zstd` 配置冲突；改用独立 `sessions-b1` root 后成功。这说明 session persistence 配置漂移需要明确迁移/隔离规则。
- 🟢 `dsh.exe` launcher 崩溃，但 wheel 内 native runtime 正常；因此“SDK 可运行”和“官方管理 CLI 可用”必须分开报告。
- 🟢 本次没有真实 API、网络模型或真实凭据阻塞；所有核心正例均为离线 mock，可重复执行。

## 复跑步骤与证据文件

在 Windows CMD 中：

```bat
set PROBE=C:\Users\SuLarry\.qoderwork\workspace\msg77v9db96tjzz2\probe-qoder
set PY=%PROBE%\venv\Scripts\python.exe
set DSH_HOME=%PROBE%\dsh-home

"%PY%" "%PROBE%\scripts\probe_node_absence.py"
"%PY%" "%PROBE%\scripts\probe_initialize.py"
"%PY%" "%PROBE%\scripts\probe_profiles_full_turn.py"
"%PY%" "%PROBE%\scripts\probe_mcp_events.py"
"%PY%" "%PROBE%\scripts\probe_b1_plugin.py"

git -C "%DSH_HOME%" rev-parse HEAD
git -C "%DSH_HOME%" status --porcelain=v1
git -C "%DSH_HOME%" diff --no-ext-diff
```

🟢 三个完整回合脚本已改为每次生成 UUID session id，可以在保留既有 session 文件的条件下重复执行。🟢 所有模型请求均指向脚本创建的 `127.0.0.1` 临时 HTTP server；`api_key` 只是无效占位值。

B1 从空 profile 重装时需要构建期 Node/pnpm；本次使用的是探针目录内隔离安装的 pnpm，不改系统全局安装。持久安装完成后，`probe_b1_plugin.py` 会先从 PATH 移除系统 Node 再验证运行期。

原始证据位于 Qoder 专属探针目录 `probe-qoder/raw/`：

```text
environment-facts.txt
method-surface.txt
profiles-full-turn.json
mcp-events.json
mcp-protocol.log
b1-bundle.json
b1-model-request.json
b2-b3-summary.txt
final-rerun-summary.json
reverse-evidence.txt
dsh-home-final-git-status.txt
independent-verdict.txt
```

其中 `independent-verdict.txt` 保留了防锚定过程：先在未读其他报告前固定“一等”假设和最可能反证，再由定向源码核查确认首个反证（interaction response），将最终判定修正为“二等”，没有用多数意见替代证据。
