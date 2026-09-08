# DSH Python SDK 实测报告（Trae · 第 0 项）

> **任务**：判定 Python SDK 路径相对原生 TS 路径是否为一等公民。
> **结论先行**：**一等公民**。四条判据全部通过。
> **探针根目录**：`D:\Code\probe-trae\`（项目外，隔离）
> **DSH 锁定版**：`dsh-v0.1.2-rc.1`（PyPI `0.1.2rc1`）

---

## 1. 环境事实

| 项 | 值 |
|---|---|
| OS | Windows 11 (NT 10.0.26200.0) |
| Python | 3.11.9 (venv at `D:\Code\probe-trae\venv`) |
| 系统 Node | v24.14.1 at `D:\App\node` —— **探针运行时从 PATH 移除** |
| deepseek-harness-sdk | 0.1.2rc1 |
| deepseek-harness-runtime-bin | 0.1.2rc1 (win_amd64, 69MB) |
| pydantic | 2.13.5 |
| 实测日期 | 2026-09-08 |
| DSH_HOME | `D:\Code\probe-trae\dsh-home` |

**隔离自检四项原始输出**：

```
1. DSH_HOME = D:\Code\probe-trae\dsh-home
2. venv prefix = D:\Code\probe-trae\venv
3. node -v → "The term 'node' is not recognized" (报错，符合预期)
4. MCP 传输 = stdio，无 TCP 端口
```

**baseline**：`dsh-home/` 内 `git init && git add -A && git commit -m baseline`，跑完后 `git status` **clean**——所有变更局限在 `D:\Code\probe-trae\` 内，无外部污染。

**无系统 Node 验证**：探针脚本构建 `clean_path`（排除所有含 `node` 的 PATH 条目），通过 `env={"PATH": clean_path}` 传给 SDK 子进程。`sdk` profile 在无 Node PATH 下完整跑通（initialize → session/prompt → 响应 → shutdown），dsh stderr 无错误。✅

---

## 2. A 结论 + JSON-RPC 方法面清单

**连通性**：✅ `sdk` profile 跑通，`final_response='MOCK_RESPONSE_OK'`，`finish_reason=completed`。使用 keyless mock SSE server（`base_url` 覆盖 + dummy api_key），无真实 API key。

**JSON-RPC 方法面**（Python SDK client 实际调用的全部方法，源码 + 实测双重确认）：

| 方法 | 用途 |
|---|---|
| `initialize` | 握手：校验 provider/model/effort，返回 `serverInfo` |
| `session/prompt` | 提交用户消息，返回 `messageId`；结果经 notification 流回传 |
| `shutdown` | 优雅关闭运行时 |

> TS 侧 `packages/sdk/client/src/client.ts` 使用**完全相同**的三个方法（`initialize` / `session/prompt` / `shutdown`）——两者是 design twin，协议面一致。🟢

**通知方法**（服务端→客户端）：
- `session.event` — 携带 `sessionId` + `event`（完整会话事件）
- `session.status` — 会话状态变更（`running` / `idle`）

**事件类型**（实测捕获，按出现顺序）：
`agent/inbox/spliced` → `turn/start` → `step/start` → `user/message` → `session/title` → `request/header` → `request/context` → `assistant/chunk`(×N) → `assistant/message` → `step/end` → `turn/end`

**能力覆盖判定**：事件流包含完整消息内容（role/content/source）、LLM 请求头（system prompt + model config）、assistant 流式 chunk、token usage。所有 31 子项所需的会话数据均可从事件流获取。**无实质缺口**。✅

---

## 3. B 三通道结论表

| 通道 | 结论 | 证据 |
|---|---|---|
| **B1 TS bundle** (`dsh plugin add file:`) | ⚠️ 未测 | 需 `pnpm`（即系统 Node）执行 `dsh plugin`，与"无系统 Node"验证互斥。不影响判据（B2 可行即满足"B1/B2 至少一条"） |
| **B2 patch.yml 调用级叠加** | ✅ **可行** | 传入 `patches=("probe_patch.yml",)` 修改 `system-prompt` persona；`request/header` 事件的 system prompt 中检出 `PROBE_PERSONA_MARKER_XYZ` |
| **B3 MCP stdio 桥** | ✅ **可行** | patch 插入 `@deepseek-ai/dsh-mcp-client`（transport: stdio, command=venv python, args=mcp_echo_server.py）；mock LLM 返回 `tool_call` 到 `mcp__probe-echo__echo`；`tool/result` 事件返回 `echo: hello`，`isError: false` |

**判据 2 结论**：B3 可行 + B2 可行 → ✅ 通过。

---

## 4. 事件流粒度结论

**核心问题**：`on_notification` / `result.events` 是否含足够细节支撑记忆双写（2.4.2）？

**结论**：✅ **足够**。实测捕获：

| 事件 | 关键字段 | 对记忆双写的价值 |
|---|---|---|
| `user/message` | `content`(完整文本)、`role`、`source.kind`、`id` | 用户消息原文 |
| `assistant/message` | `content`、`source`(model/provider)、`usage`(input/output/total tokens)、`id` | 助手回复原文 + token 统计 |
| `request/header` | `header.config`(provider/model/maxTokens)、`header.system`(完整 system prompt) | 可审计 LLM 调用上下文 |
| `tool/call` | `callId`、`name`、`arguments` | 工具调用名与参数 |
| `tool/result` | `message.content[0].content[0].text`、`isError` | 工具执行结果 |
| `turn/start` / `turn/end` | `turn`、`reason.kind`(completed/error)、`time` | 轮次边界与时间戳 |
| `session/title` | `title` | 会话标题 |

**工具调用循环验证**（B3 实测）：mock 被调用 2 次——首次 roles=`[system,user,user]`（返回 tool_call），第二次 roles=`[system,user,user,assistant,tool]`（含 tool 结果，返回文本）。完整 LLM→tool→LLM 循环走通。

---

## 5. C 判定

### 四条逐项结论

| # | 判据 | 结论 | 依据 |
|---|---|---|---|
| 1 | **能力覆盖**：JSON-RPC 方法面相对 TS 无实质缺口 | ✅ 过 | Python 与 TS SDK 是 design twin，使用**完全相同**的 3 个 JSON-RPC 方法 + 同一 runtime；事件流提供完整会话数据（消息/工具/usage/system prompt），31 子项所需能力无缺口 |
| 2 | **挂载通道**：B3 MCP 可行 且 B1/B2 至少一条可行 | ✅ 过 | B2 patches 可行 + B3 MCP 可行（echo 工具返回 "echo: hello"） |
| 3 | **官方支持度**：文档/CI smoke/发布同 train 至少两项一等 | ✅ 过 | 4 项 🟢：① TS client README 自称 "design twin … shares the same runtime peer and protocol"；② installed-wheel CI smoke 覆盖 external plugins + MCP + native tools + direct JSON-RPC；③ PyPI `0.1.2rc1` 与 npm `0.1.2-rc.1` 同 train；④ Python SDK 位于主仓根 `python/`，含 examples + tests（21 文件） |
| 4 | **可独立运行**：无系统 Node 下完整跑通 | ✅ 过 | 探针从 PATH 移除 Node 后，`sdk` profile 完整跑通（initialize→prompt→响应→shutdown），dsh stderr 无错误 |

### 最终判定

# 一等公民

四条全部通过。Python SDK 路径在能力覆盖、挂载通道、官方支持度、独立运行四个维度均达到一等公民标准。

---

## 6. 落地形态建议

**A-service（Python 后端 + DSH 子进程）**。

一句话理由：Python SDK 是一等公民——shell/file_ops 经 MCP 桥留在 Python（B3 实测可行），记忆双写经事件流消费实现（事件粒度足够），角色经 profile/patches 配置，后端 3653 行 Python 保留不动，跨语言成本从"全量 TS 化"降为"仅注入层可能需 TS"。

**需注意的收窄点**：
- 注入层（agent/pre-step rewrite 类，如时间上下文的 `build_memory_context` 注入）目前 Python SDK 无直接 API，可能需：① 经 patch 在 DSH 侧配置 system prompt 注入绝对时间；或 ② Python 侧在 `session/prompt` 前预处理消息。**不构成阻塞**，仅注入层实现路径需在阶段 3 细化。
- MCP 工具名被命名空间化为 `mcp__<serverName>__<rawName>`——前端展示时需 strip 前缀。

---

## 7. 意外发现 / 阻塞 / 判据异议

1. **win-x64 model-visible 快照不存在**（🔴 修正我上轮错误）：WB 指出后我在锁定版 `dsh-v0.1.2-rc.1` 核实，`python/sdk/` 下无 `minimal/win-x64/model-visible.json`（development.md 提到但实际文件不在锁定版）。官方支持度仍有 4 项 🟢，不影响判定，但我上轮"win-x64 快照"的说法作废。

2. **MCP 工具命名空间化**：`@deepseek-ai/dsh-mcp-client` 把工具注册为 `mcp__<serverName>__<rawName>`（如 `mcp__probe-echo__echo`）。mock 首次返回 `echo` 时 DSH 报 "unknown tool"，改用命名空间名后成功。**这是设计行为不是 bug**，但前端展示与角色 prompt 需注意。

3. **session 持久化确认**：首次探针因复用 session ID 触发 `"session already has a persisted log on disk that does not match this live session (id collision)"` 错误——证实 session 日志持久化在 `$DSH_HOME/sessions/`（JSONL/zstd）。对记忆双写的含义：DSH 已有原始事件流水持久化，我们的双写是**语义层**（SQLite + ChromaDB），两者互补不冲突。

4. **B1 未测但不影响判定**：`dsh plugin add file:` 需 `pnpm`（系统 Node），与"无系统 Node"验证互斥。判据只要求 B1/B2 至少一条可行，B2 已可行。若后续需持久化插件（非调用级 patch），B1 仍需在有 Node 环境下补测。

5. **`request/header` 事件含完整 system prompt**：可用于审计"注入了什么"，是 6.1 记忆浏览器与 2.4 保鲜调参的免费数据源。

6. **判据无异议**：WB 细化的四条判据阈值合理，无需调整。
