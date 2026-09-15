# DSH 0.1.5 上游盘点：欠账表 + 能力面表

> 产出：WB ｜ 2026-09-15 ｜ 落点：`docs/dsh/`（与 `dsh-015-notes-scan.md` 同源同性质）
> 性质：🔴 **只读盘点（第 1 步产出）**。**未动任何 docs 判定 / TODO**——两张表是第 2 步「映射到能力树」的输入。
> 上游版本：`dsh-v0.1.5-rc.2` ｜ 对照版本：`dsh-v0.1.2-rc.1`
> 区别于 `dsh-015-notes-scan.md`：那份扫的是**笔记**（上游"打算做什么"），这份扫的是**代码与包文档**（上游"做完了什么 / 自己承认还差什么"）。
> ⚠️ 本表全部条目取自上游原文，**英文为原文，中文为 WB 判读**（判读部分仍是推断，进 docs 前须复核）。

---

## 0. 一句话

**上游的"未完成"有正式的书面形态，而且量级远超预期**：266 个包 README 里有 **1048 条** `## Known Limitations and Deferred Work`，代码里只有 **67 条** `TODO/FIXME/XXX`，另有 **20 篇** 未实现的正式提案（`proposed/`）。**三个数量级 1048 : 67 : 20 说明——想知道"对手还差什么"，看 README 而不是看代码注释。**

---

# 表 A：〈上游自认未完成〉

## A0. 三层来源与量级（015 实测）

| 层 | 来源 | 量级 | 性质 | 粒度 |
|---|---|---:|---|---|
| **A1** | `packages/**/README.md` 的 `## Known Limitations and Deferred Work` | **1048 条 / 266 包** | ⭐ **规范强制必写**（`packages/AGENTS.md`） | 能力级 |
| **A2** | 源码注释 `FIXME` / `TODO` / `XXX` | **67 条** | 自愿标记，紧急度有明文定义 | 代码行级 |
| **A3** | `.agents/notes/proposed/*.md` | **20 篇** | 正式提案，未实现 | 设计级 |

**判定依据（为什么 A1 是主表）**——`packages/AGENTS.md` 原文：

> Package READMEs put **durable consumer gaps** and non-obvious maintainer constraints under `## Known Limitations and Deferred Work`; ordinary cleanup stays in its TODO or Agent Note.

⇒ 上游把"**长期存在的消费方缺口**"明确指派到 README，日常清理才进 TODO/笔记。**A1 就是上游为我们准备好的"对手侧缺口清单"。**

覆盖率复核：267 个包级 `README.md` 中 **266 个含该节**（唯一例外在 `scripts/verify-package-readme-limitations.ts` 的 allowlist 里）。

---

## A1. README 欠账表：按包组分布（1048 条）

| 排名 | 包组 | 条数 | 判读 |
|---:|---|---:|---|
| 1 | **`packages/client`** | **140**（52 包） | ⭐ **客户端 UI 是最大欠账区**，散在 52 个小包里 |
| 2 | `packages/session` | 62 | 会话/持久化仍在快速演化 |
| 3 | `packages/subagent` | 62 | 子代理族（含 codex / claude-code / acp / dsh-sdk 四个后端） |
| 4 | `packages/experimental` | 54 | 原型区（pre-stable） |
| 5 | `packages/llm` | 52 | LLM 适配层 |
| 6 | `packages/shell` | 40 | bash / pwsh 双实现 |
| 7 | `packages/fs` | 36 | 文件系统 |
| 8 | `packages/util` | 32 | 工具 |
| 9 | `packages/core` | 29 | 循环内核 |
| 10 | `packages/context` | 28 | 请求上下文（含 agent-instructions） |
| 11 | `packages/api` | 26 | Remote / gateway（云端形态相关） |
| 12 | `packages/compaction` | 24 | 压缩 |
| 13 | `packages/bundle` | 23 | profile 打包层 |
| 14 | `packages/sandbox` | 22 | 沙箱 |
| 15 | `packages/host` | 21 | Host 侧 |
| 16 | `packages/web` | 21 | 网络访问能力 |
| 17 | `packages/hooks` | 20 | Claude Code / Codex hook 桥 |
| 18 | `packages/workflow` | 20 | workflow 引擎 |

条目 ≥6 的单包（说明该能力块不成熟）：`llm-pi-ai` 17 ／ `experimental/code-runtime-python` 16 ／ `subagent` 12 ／ `subagent-codex` 11 ／ `subagent-claude-code` 11 ／ `mcp-client` 11 ／ `sandbox-windows-acl` 9 ／ `hooks-claude-code` 9 ／ `command-feedback` 9 ／ `subprocess-local` 8 ／ `schedule` 8 ／ `agent-presets` 8 ／ `fs-local` 8 ／ `experimental/webworker-runtime` 8 ／ `api/workspace-files` 8 ／ `compaction-basic` 8 ／ `session-persistence-jsonl` 7 ／ `util/http-proxy` 6 等。

### A1-a. ⭐ 与我们能力树直接相关的条目（原文摘录）

**① 远程 / 云端形态 —— 对我们 §2.10.1「云端部署、多端使用」最关键**

| 来源 | 原文（节录） | 判读 |
|---|---|---|
| `client/connection` | "The browser cookie is **not marked `Secure`** — loopback HTTP is the shipped transport, so exposing the same authority over plaintext networking can expose the bearer cookie in transit." | ⭐ **出厂传输是 loopback HTTP**；要上公网必须自己加 TLS |
| `client/connection` | "**There is no logout operation** — clearing the browser cookie ends one browser session; deleting the owner credential record and restarting `dsh` revokes every session." | 无登出；撤销 = 删凭据 + 重启 |
| `client/connection` | "Buffered `/api` routes retain each request body in memory — `maxRequestBodyBytes` (**default 300 MiB**, sized for the default 200 MiB aggregate image limit after base64 expansion…)" | 内存型请求体，默认 300 MiB |
| `client/store` | "**Persistence is browser-local** — persisted stores use JSON in `localStorage`… the package provides **no cross-device synchronization**." | ⭐ **无跨设备同步** |
| `api/session-controller` | "The raw browser upload is **one streaming HTTP request without resumable offsets**; a retry sends the file again from byte zero." | ⭐ **上传不可续传** |
| `api/workspace-files` | "**Instrumented operations only** — a file changed by a subprocess, a shell command, or the user's editor **produces no frame**." | 文件变更只跟结构化 API |
| `api/workspace-files` | "**Unbounded generation queue** — … a stalled consumer **grows Host memory for the life of the stream**." | 背压未做 |
| `api/gateway` | "Forwarded events reach `$on` **without business-payload projection or redaction**. Ordinary notifications are **not replayed after reconnect**…" | ⭐ 转发事件**不脱敏**、重连**不重放** |

**② 附件 / 多模态 —— 对我们 §2.3.4**

| 来源 | 原文（节录） | 判读 |
|---|---|---|
| `attachment` | "**Attachments are never deleted** — stored images and files are **retained indefinitely**; nothing removes them automatically." | 无 GC |
| `attachment` | "**Raster image limits apply to images only** — PNG/JPEG/WebP/GIF are accepted as images under deployment limits; **every other file is stored verbatim with no type or size limit**" | ⭐ 非图片文件**无类型/大小限制** |
| `client/file-upload` | "**Uploads are not resumable** — a failed or cancelled retry starts from the first byte." / "**Stream progress has no total**" | 上传能力原始 |
| `acp` | "**Raster prompt images only** — PNG, JPEG, WebP, and GIF require a durable attachment store and an exact image-capable route." | ACP 只支持光栅图 |

**③ 协议 / 桥接 —— 对我们 §3.3（双向中继 / ACP 判定）**

| 来源 | 原文（节录） | 判读 |
|---|---|---|
| `acp` | "**No transcript replay or interactive extensions** — session deletion, fork, `session/load`, modes, commands, plans, terminals, client filesystem operations, and elicitation **remain outside**" | ⭐ **ACP 面明确不含**这些；与我们 3.3 的实测方向一致 |
| `acp` | "**One primary workspace** — additional directories remain unsupported." | 单工作区 |
| `acp` | "**MCP tools only** — MCP resources and prompts have no DSH consumer." | MCP 只消费 tools |
| `sdk`, `mcp-client` | （各自 4 / 11 条） | sdk 与 MCP 客户端仍不成熟 |

**④ 安全 / 凭据 —— 对我们 §2.7.3 / 3.0 凭据层**

| 来源 | 原文（节录） | 判读 |
|---|---|---|
| `settings/redact.ts`（源码 A2） | `TODO(settings-wire-redaction): Fail closed instead — a secret reachable only through a union, intersection, or transform is returned verbatim here, with nothing recording that it was missed.` | ⭐ **脱敏是 fail-open**：联合/交叉/变换类型下的秘密**原样返回且无记录** |
| `settings` | `TODO(settings-registration-quiescence)` / `TODO(settings-replacement-resync)` | 注册静默与替换重同步未收口 |
| `credentials` | （A1 有独立节，条目含 env/.env provider） | 凭据接缝仍在演化 |
| `bundle/base` | "**Windows temp grants are private per-session**" | Win 临时授权按会话隔离 |

**⑤ 进程 / 终端 / 沙箱**

| 来源 | 原文（节录） | 判读 |
|---|---|---|
| `sandbox-windows-acl` | 9 条 | ⭐ **Windows ACL 沙箱欠账最多**（与我们 local-env 的方言缺口同源） |
| `shell/bash-local`（A2） | `XXX(stateful-shell): evaluate persistent cwd or PTY sessions when workflows require shell state.` | 无状态 shell 是有意为之；PTY 另走 `packages/terminal` |
| `subprocess-local` | 8 条 | 进程树/清理 |
| `terminal-bash` | `TODO(pty-initialize-race-home)` / `TODO(pty-send-state-consolidation)` / `TODO(pty-delayed-signal-prompt)` | PTY 三处竞态未收口 |

**⑥ 定时 / 任务 —— 对我们 §2.3.5 主动触达**

| 来源 | 原文（节录） | 判读 |
|---|---|---|
| `schedule` | 8 条 | 有 `schedule` 子系统（Session-local reminder），但欠账多 |
| `jobs` | 有独立子系统页 | 后台任务运行时 |
| `webhook` | 有独立子系统页："fire-and-forget Workspace Session creation" | ⭐ **外部事件可创建会话**（对我们"主动触达"是现成能力位） |

**⑦ 上下文 / 记忆 —— 对我们 §2.4**

| 来源 | 原文（节录） | 判读 |
|---|---|---|
| `context/agent-instructions` | `TODO(total-instruction-read-bound): enforce an aggregate source budget across a complete baseline or reconciliation batch; the render budget is applied only after every accepted file has been read under this per-file cap.` | ⭐ 指令文件**只有单文件上限，无聚合上限**（读取阶段无总量控制） |
| `context/agent-instructions` | `TODO(frozen-project-root): retain the baseline root for the loop instance; recomputing it after marker edits reinterprets the existing relative scope keys.` | ⭐ **项目根在会话期间不冻结**（改了 `.git` 标记会重解释相对作用域键） |
| `context/*` | 28 条 | 请求上下文族 |

**⑧ 客户端 UI（52 包 / 140 条）—— 最大欠账区**

`ui-primitives` 7 ／ `ui-sidebar-right` 6 ／ `ui-sidebar-documentpreview` 6 ／ `ui-settings-models` 5 ／ `ui-workspace` `ui-settings-plugins` `ui-schedule` `ui-layout` `ui-dockkit` `ui-deliverables` `file-upload` `sdk/client` 各 4 条 …
⇒ **判读**：DSH 的客户端是**浏览器 + loopback** 形态的完整实现（Remote 通信、Slots 组合、资源模型、HMR 都齐），但**每个 UI 包都还挂着"未收口"的说明**。**它是一套"能跑但没定稿"的前端**——这对我们意味着：**承接它的 UI 层风险高于承接它的内核层**。

---

## A2. 源码标记表（67 条：TODO 60 / FIXME 2 / XXX 5）

### 紧急度语义（上游明文，`docs/development.md`）

| 标记 | 定义（原文） | 含义 |
|---|---|---|
| **`FIXME`** | "an issue that should **block a new release**. A release should **not ship with an open `FIXME`** unless reviewers explicitly agree…" | ⭐ **发布阻断级** |
| **`TODO`** | "an issue that should be fixed soon, once we have the resources." | 尽快修 |
| **`XXX`** | "an issue that we may fix someday; lowest priority, **no commitment**." | 也许修，无承诺 |

### ⭐ 全部 FIXME 只有 2 条，真欠账仅 1 条

| 位置 | 内容 | 判读 |
|---|---|---|
| `packages/guard/timeout-policy/src/index.ts:6` | `FIXME: settle the intended @deepseek-ai/dsh-timeout-guard rename before the …` | **改名未收口**（纯命名债，与我们无关） |
| `scripts/translation-prompt.spec.ts:23` | 测试夹具里的样例字符串 | **非真欠账** |

⇒ **上游认为自己没有"发布阻断级"欠账。** 这是它对自身完成度的一个正式表态。

### 全部 XXX（5 条，真欠账 4 条）

| 位置 | 内容 | 判读 |
|---|---|---|
| `shell/bash-local/src/index.ts:176` | `XXX(stateful-shell): evaluate persistent cwd or PTY sessions when workflows require shell state.` | 无状态 shell 有意为之 |
| `test-support/llm-replay/src/index.ts:844` | `XXX(concurrent-subagents): concurrent children need an explicit first-call ordinal.` | 并发子代理的记账 |
| `llm/llm-pi-ai/src/stream.ts:34` | `XXX(pi-ai upstream): pi-ai flattens the caught error to error.message` | 依赖上游 |
| `lsp/lsp-stdio/src/host.ts:97` | `XXX(lsp-source-replacement): Revisit stable-handle identity only if a real query observes…` | 待复现 |
| `scripts/verify-agent-note-format.ts:19` | 夹具字符串 | 非真欠账 |

### ⭐ 012 → 015 差集：净变化 = 0

| 方向 | 条数 | 明细 |
|---|---:|---|
| **015 已还掉** | **1** | `context/agent-instructions/src/files.ts` 的 `TODO(root-marker-unavailable)` —— 012 里标记探测失败静默 `return false`（会向上误找祖先项目），015 改为**抛错**（仅 `ENOENT`/`ENOTDIR`/`FS_NOT_FOUND` 算不存在） |
| **015 新增** | **1** | `client/ui-sidebar-files/src/client/FilesBody.tsx:72` —— 等 artifact/slot 界面就绪后收口 |

⇒ **跨 1490 commits / +208k 行，代码欠账池恰好一进一出、总数不动（67 → 67）。**

⚠️ **方法坑（已踩过一次，记录备查）**：初次用 `(路径, 行号)` 做键，得出"32 条消失 / 32 条新增"的**假差集**——实际几乎全是**同一行号漂移**。**判增删必须用内容做键，不能用行号。**

---

## A3. 未实现的正式提案（`proposed/`，20 篇）

| 提案 | 篇幅 | 与我们相关度 |
|---|---:|---|
| Required cancellation through tool-reachable capability seams | 65 行 | 中 |
| **Domain KV storage capability seam and the workspace entity** | 329 行 | ⭐ 存储接缝 |
| Session projections and command lifecycle logging | 192 行 | 中 |
| Storage root placement and derived-medium recovery | 59 行 | 中 |
| Record last activity in the session index | 64 行 | 低 |
| Semantic phases for composer-chain election | 46 行 | 低 |
| **Quarantine unreadable historical attachments** | 38 行 | ⭐ 附件（对应 A1 ②「附件从不删除」） |
| **Pre-tool input rewrite — a consistent design** | 53 行 | ⭐ 工具入参改写（安全相关） |
| **Recallable compaction — index checkpoints, a state checkpoint, and in-session history recall** | 110 行 | ⭐ 压缩可回溯 |
| **Interactive side sessions and merge-back** | 41 行 | ⭐ 会话分叉/合并 |
| **Task Surface for structured session interaction** | 289 行 | ⭐ 结构化交互面 |
| API extractor reports | 32 行 | 低 |
| Supply chain checks and vendor drift verification | 35 行 | 低 |
| Discover package inventories instead of maintaining static lists | 32 行 | 低 |
| Periodic human-review maintenance for dsh-code-review | 85 行 | 低 |
| Remove the packed-session fixture branch migrator | 38 行 | 低 |
| Audience-first documentation quality criteria | 139 行 | 低 |
| Port tool-owned render into current DSH APIs | 35 行 | 低 |
| Deterministic tests, the replay invariant fixture, and race stress | 35 行 | 低 |
| Mutation testing as the coverage counterweight | 36 行 | 低 |

⇒ **20 篇提案里 7 篇与我们关注面相关**（存储接缝、附件隔离、入参改写、可回溯压缩、会话分叉、结构化交互面、供应链核查）。**这是"上游已设计但尚未实现"的清单**——它们是**噪音也是机会**：噪音在于"今天没有"，机会在于"契约意图已经写下来了"。

---

## A4. ⚠️ 方法论订正（WB 自我纠错）

**上一轮（2026-09-15 早）我提出**：「扫一遍源码的 `TODO(...)` 标记，就能拿到一张『上游自己说要还的账』表，**这比猜"DSH 没有 X"可靠一个量级**。」

**实测后必须收窄**：

| 原表述 | 问题 | 订正 |
|---|---|---|
| "TODO 标记 = 上游自认的欠账清单" | **过度声明**。它只是**代码里长期挂着的**那一小类 | TODO 标记 = 欠账的**代码注释子集**（67 条） |
| "比猜可靠一个量级" | 方向对（自述 > 推断），但**漏了主表** | **主表是 README 的 1048 条**，量级差 15 倍；只扫 TODO 会得出"上游很干净、几乎没欠账"的**错误结论** |

**教训（写进方法库）**：**"某类证据存在"不等于"它覆盖了目标"**。提出一个扫描方法时，必须先问**「它覆盖的占全量的多少」**——否则会把一个**子集**当**全集**用，而这种错误的表现形式恰恰是"结论看起来很扎实"。

---

# 表 B：〈对手侧能力面〉

## B1. 子系统清单（`docs/subsystems/`，53 篇正式规格）

每篇一个子系统的权威描述（"what it is, the data structures it moves"）。**这是 DSH 能力面的官方目录**：

`core`／`llm-streaming`／`token-meter`／`scope`／`typert`／`goal`／`schedule`／`todo`／`commands`／`session`／`persistence`／`settings`／`credentials`／`feedback`／`session-title`／`session-query`／`session-reference`／`system-prompt`／`tools`／`user-questions`／`approval`／`attachment`／`shell`／`subprocess`／`terminal`／`sandbox`／`code-runtime`／`extensions`／`filesystem`／`lsp`／`skills`／`compaction`／`subagent`／`agent-team`／`web`／`spill`／`workflow`／`jobs`／`permission-presets`／`plan`／`invariants`／`web-server`／`webhook`／`storage`／`workspace`／`web-client`／`client-modules`／`slots`／`client-resources`／`sidebar-right`／`conversation`／`session-projection`／`session-telemetry`

**我们能力树 8 域 ↔ 子系统对照（初判，第 2 步细做）**

| 我们域 | DSH 侧已子系统化的部分 | DSH 侧**无**子系统页的部分 |
|---|---|---|
| 域一 交互与会话 | session / conversation / commands / todo / plan / goal | 会话生命周期管理（有 `session` 页，但"新建/删除/fork 的产品面"缺） |
| 域二 记忆与知识 | compaction / session-query / session-reference / spill / token-meter | ⭐ **记忆/画像/知识库：无任何子系统页**（只有 `agent-instructions` 这种"指令"面） |
| 域三 能力扩展 | extensions / skills / tools / typert | — |
| 域四 角色与路由 | subagent / agent-team / preset / permission-presets | ⭐ **自动路由（意图识别）：无** |
| 域五 边界与约束 | sandbox / approval / permission-presets / credentials | 成本约束（`token-meter` 只做计量） |
| 域六 可见性与掌控 | session-projection / session-telemetry / feedback | — |
| 域七 质量与可靠性 | invariants / compaction | ⭐ **时间感知：无**（有 `time context plugin` 但那是一次性的） |
| 域八 形态与部署 | web-server / web-client / client-* / slots / sidebar-right | ⭐ **云端多用户：无**（`identity/` 自称 "anonymous identity"） |

⇒ **这张对照表就是第 2 步的骨架。** 初步看：**DSH 在"内核 + 能力接缝"上很厚，在"产品化面"（记忆产品化、自动路由、时间感知、多用户）上薄。**

## B2. 包组地图（AGENTS.md `Repository layout`）+ 欠账数 = 成熟度反向指标

| 包组 | 职责（原文摘要） | 欠账 |
|---|---|---:|
| `core/` | product API spine: session, system-prompt, tools, agent, agent-loop | 29 |
| `api/` | Remote BFF assembly and Typert RPC gateway | 26 |
| `typert/` | type graph generator, loader, and runtime registry | 13 |
| `llm/` | LLM capability + DeepSeek providers | 52 |
| `e2b/` | E2B POC: sandbox + FS/subprocess adapters | 17 |
| `shell/` | bash capability + local/pwsh providers | 40 |
| `subprocess/` | subprocess capability + process-tree provider + Win32 lib | 17 |
| `terminal/` | persistent sessions | 12 |
| `fs/` | filesystem capability + policy | 36 |
| `lsp/` | language-server capability | — |
| `skill/` | skill provider registry + local impl + catalog/loader tool | 17 |
| `web/` | web capability: search/fetch providers + tool Consumer | 21 |
| `compaction/` | compaction capability + basic provider | 24 |
| `context/` | request-context plugins | 28 |
| `subagent/` | subagent capability + providers + delegation Consumers | 62 |
| `bundle/` | installable `dsh --profile` patch-layer bundles | 23 |
| `workflow/` | workflow capability + worker-thread provider | 20 |
| `webhook/` | webhook ingress | — |
| `todo/` `plan/` `preset/` | todo_write / plan mode / per-session composition | — |
| `guard/` | loop-hygiene + tool-timeout plugins | — |
| `self-modification/` | the agent inspects/mounts its own plugins | — |
| `hooks/` | Claude Code/Codex hook bridges + wire-protocol library | 20 |
| `session/` | durable session data: persistence, projection, titles, telemetry | 62 |
| `identity/` | anonymous identity | — |
| `settings/` | user-settings capability + file provider | — |
| `credentials/` | credential/authorization capabilities + env/.env provider | — |
| `acp/` | automation-only Agent Client Protocol server | — |
| `interaction/` | approval/interaction capabilities, permission, commands, ask-user | 15 |
| `boot/` | shared profile/application boot glue | — |
| `sdk/` | JSON-RPC protocol + TypeScript client/server | — |
| `experimental/` | pre-stable prototypes; private by default with explicit public exceptions | 54 |
| `host/` `client/` | Host 侧 / Client 侧（52 包） | 21 / **140** |

## B3. ⭐ 形态结论（本轮最有价值的一条）

**DSH 的出厂形态 = 本机 loopback 的浏览器客户端 + 本机 Host。**

证据链（全部来自上游自述）：

1. `client/connection`：出厂传输是 **loopback HTTP**，cookie 未标 `Secure`
2. `client/store`：持久化只在**浏览器 localStorage**，**无跨设备同步**
3. `client/connection`：**无登出**，撤销靠删凭据 + 重启
4. `client-resources` / `sidebar-right` / `slots` / `web-client`：客户端架构完整但**每个包都挂"未收口"**
5. `identity/` 自我描述是 **anonymous identity**（匿名身份）
6. `api/workspace-files` 原文提到 *"a browser that **may not be on the Host machine**"* ⇒ **能分离，但分离后没有多租户/多用户语义**

⇒ 对我们 §2.10.1「云端部署、多端使用」：**方向不变（DSH 内核不含云端多用户），但依据要换**——从"没有远程能力"改为"**有单机远程访问的完整实现，缺的是多用户/多租户语义与传输安全**"。

---

## 取法（可复跑，基线更新时重跑）

```sh
# A1：README 欠账节
git -C ref/dsh-bare grep -l '## Known Limitations and Deferred Work' <tag> -- 'packages/*/*/README.md'

# A2：源码标记（排除夹具/笔记/vendor/website）
git -C ref/dsh-bare grep -n -E '\b(FIXME|TODO|XXX)\b' <tag> \
  -- '*.ts' '*.tsx' '*.js' '*.cjs' '*.mjs' '*.mts' '*.cts' \
  ':!snapshots/*' ':!.agents/*' ':!vendor/*' ':!website/*'

# A3：未实现提案
git -C ref/dsh-bare ls-tree -r --name-only <tag> -- .agents/notes/proposed/

# B1：子系统目录
git -C ref/dsh-bare show <tag>:docs/subsystems/README.md

# 版本对照（判增删用内容做键，不用行号）
git -C ref/dsh-bare diff <old-tag> <new-tag> -- <path>
```

---

## 待老大裁的点

1. **本文件落点**：现放 `docs/dsh/`（与扫描稿同级）。若认为属过程稿应回 `exchange/`，说一声我挪。
2. **是否进入第 2 步**：拿两张表 × 能力树 31 个子项逐条映射，产出「可承接 / 可降级 / 仍须自做」三类 → 落讨论稿 → 再改 docs + TODO。
3. **A1 的 1048 条全量**：本轮按域摘录了与能力树相关的部分（全量 17.9 万字符未入库）。若需要全量落盘（约 180 KB）说一声。
