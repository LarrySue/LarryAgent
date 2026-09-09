# DSH-2 任务 0：LarryAgent 代码存在形态判定——Claude 报告

> **执行者**：Claude Code（测试方视角）
> **日期**：2026-09-08
>
> 🔒 **永久保留 · 不参与柔性清理**。**结论与最终裁定一致（A 案成立，已采纳）**。
> ⚠️ **WB 本地复核（2026-09-08）**：机制 **8/8 属实**，可采信；**行号 2 处偏差**——② systemPrompt 注入实际在 `user-approval/src/index.ts:154`（非 113-128）、③ 工具注册实际在 `tool-fs/src/index.ts:22`（非 52）。**引用本报告行号前须自行核**。
> **基线版本**：`dsh-v0.1.2-rc.1`（锁定版，本地裸仓库 `ref/dsh-bare/` 只读查证）
> **方法**：纯源码级判定（不运行 DSH——规格排除 5 项环境实测）；佐证引用 Claude 第 0 项实测报告（`dsh-pysdk-probe-claude.md`，B1/B2/B3 通道实测）

---

## ① 结论一行

**A 案成立** —— LarryAgent 必需的 8 项 DSH 能力全部可经公开挂载面（Cordis bundle / preset / cordis.yml / patches / 配置 / MCP 桥）获得，**无一项需修改 DSH 上游代码**。

---

## ② 隔离自检（报告开头必含）

| 项 | 值 |
|---|---|
| Node / pnpm | v24.14.1（本机；本任务纯源码审查，未运行 DSH，无 Node 依赖动作） |
| 工作目录 | `D:\Code\probe-claude-dsh2\`（项目外，含 baseline git init） |
| DSH_HOME | 未使用（本任务无运行） |
| 项目目录改动 | **零**（除交付报告外未改 `D:\Code\LarryAgent\` 下任何文件） |
| ref/dsh-bare | 只读查询（`git -C ref/dsh-bare show/ls-tree/grep`），未修改 |
| baseline diff | 工作目录仅含本报告草稿；无预期外全局写入 |

---

## ③ 逐项表：能力 | 可达通道 | 证据 | 等级

| # | 能力 | 可达通道 | 证据（`文件:行号`，锁定版） | 等级 |
|---|---|---|---|---|
| 1 | **记忆双写**（会话事件 → 外部 SQLite + ChromaDB） | ① session.event 订阅（数据源）② 自做 cordis 插件做外部写入（SQLite/ChromaDB 是普通 Node/Python 依赖，插件内可用）③ MCP 桥（若走 Python 侧） | 事件流：`packages/core/session/src/known-event-types.ts:66-69`（tool/call、tool/result）实测见 `dsh-pysdk-probe-claude.md` §4；B1 挂载实测 §3 | 🟢 |
| 2 | **角色机制**（5 角色 persona + 工具集） | ① 静态：patch persona（B2 实测）② **动态：systemPrompt context 注入**（approval service 先例——scope.systemPrompt.context({ text: (ctx) => ... }) 按 agent 状态动态返回）| persona patch：`packages/bundle/sdk-app/cordis.patch.yml`（system-prompt 行）；动态注入先例：`packages/interaction/user-approval/src/index.ts:113-128`（ctx.inject(['systemPrompt']...context）） | 🟢 |
| 3 | **工具**（shell / file_ops / web_search） | cordis 插件注册 ctx.tools（tool-fs 标准模式） | `packages/fs/tool-fs/src/index.ts:52`（`export const inject = ['tools', ...]`）+ `apply(ctx)` 注册工具；B1 实测可挂载 | 🟢 |
| 4 | **2.7.2 审批回答侧**（前端批准/拒绝回传） | **scope-filtered answerer 瀑布**：自做 TS answerer 插件监听 approval 请求 → 返回 outcome（claim）或 next() 委托。**这是公开的 cordis 服务调用面，不是 agent loop 内部** | `packages/interaction/user-approval/src/index.ts:44-54`（fail-closed + composed answerers 注释）；`packages/extensions/tool-cordis/src/api-catalog.ts:3033-3038`（"Ask composed answerers... Return an outcome to claim the request or call `next()` to delegate. Scope-filtered dispatch"）——answerer 注册 = cordis listener 模式 | 🟢 |
| 5 | **记忆保鲜 / 用户画像 / 知识库**（自做插件） | 纯自做逻辑 + ctx 服务/事件消费（不触 agent loop 内部） | B1 挂载实测（`dsh-pysdk-probe-claude.md` §3）；订阅模式同 #1 | 🟢 |
| 6 | **compaction 策略定制** | **Service Definition / Provider 拆分**：`ctx.compaction` 是契约，`compaction-basic` 只是默认 Provider——自做 Provider 插件注册 `ctx.compaction` 即换策略，消费者（command-compact 等）不动 | `packages/compaction/README.md:29-30`（"The shared condensation contract... `ctx.compaction`" / "registers `ctx.compaction`"）；`packages/compaction/command-compact/src/index.ts:66`（消费者 `ctx.compaction.compactNow(...)`——只依赖契约） | 🟢 |
| 7 | **session 事件流消费** | session.event 订阅（cordis 或协议面） | 实测（`dsh-pysdk-probe-claude.md` §4）+ `known-event-types.ts` 全量 | 🟢 |
| 8 | **端侧执行器 Windows 沙箱** | `ctx.sandbox` Service Definition + **服务实现替换是公开面**（fs-sandbox 先例："Registers as `ctx.fs`... loading it INSTEAD OF dsh-fs-local... is the whole swap——model-facing tools are untouched"）；Windows 后端 = sandbox-local restricted token + sandbox-windows-acl | `packages/fs/fs-sandbox/src/index.ts:44-46`（实现替换模式）；`packages/sandbox/sandbox-local/README.md:12`（"Windows uses the ACL restricted-token runner"）；`packages/sandbox/README.md:29-31`（ctx.sandbox/ctx.sandboxPolicy 服务） | 🟢 |

**8/8 全部 🟢**——每项的证据都是"公开挂载面可达"的机制性证据（服务实现替换 / provider 注册 / listener 瀑布 / context 注入 / 工具注册），无一项触及"必须改 DSH 核心循环"。

---

## ④ 反向举证（规格⑤：主动找推翻自己结论的证据）

**找过的方向**：

1. **运行中热重载 patch 级配置** —— ❌ 确认不可行：sdk-app README「Configuration changes require restart」（`patchReload: startup`，`packages/bundle/sdk-app/README.md`）。**但这不是 A 案否决**：patch 是**启动期组合**；运行期可变性由 systemPrompt context 动态注入（#2）+ ctx 服务动态实现（#4/#6/#8）覆盖——需要"重启才生效"的是**部署期配置**（角色清单、工具启用表），非**对话期行为**。部署期重启 = 单用户可接受（改 config 重启，与 Python 时代一致）。
2. **同会话运行中切换 agent 组合（换角色含工具集）** —— ⚠️ 未找到公开的"同 agent 实例热换 preset/工具集"API；DSH 的工具集在插件 apply 时经 ctx.tools 注册（运行期增删工具 API 未在本次查证范围内）。**定性：非 A 案否决**——① 产品树 4.1 当前档位无"同会话热切角色"承诺（角色归属设计老大暂缓）；② 会话级角色（新建会话时选角色）可经 preset/会话构造达成。**记入 DSH-3 首验输入**（与 TODO 中"跨进程 resume id collision 首验"并列）。
3. **运行中替换已注册的 ctx 服务实现** —— ⚠️ 未查证 cordis 是否支持运行中换 Service 实现（如运行时从 sandbox-local 换到我们的实现）。**非否决**：服务实现替换是"启动时加载哪个插件"的决策（fs-sandbox 文档的 swap 语义），部署期选择足够。

**结论：反向举证未找到 A 案否决项。** 两个边界（热重载配置、同会话热切角色粒度）如实记录，作为 DSH-3 首验输入而非本任务阻塞。

---

## ⑤ 结论与理由

**A 案成立**（独立仓库 + 构建 Cordis bundle 挂载）。

架构上的根本原因：DSH 的核心能力层全部走 **Service Definition / Service Provider / Consumer** 三分架构（capability seam 设计）——`ctx.approval`、`ctx.compaction`、`ctx.sandbox`、`ctx.fs`、`ctx.tools` 都是**契约**，默认实现只是**一个 Provider**。我们的全部必需能力 = 提供我们自己的 Provider/answerer/listener（B1 bundle 通道，第 0 项已实测可挂载），**消费者与模型侧完全不动**。这使 LarryAgent 成为"DSH 之上的一个 preset/plugin 组合"在架构上无阻碍。

**不选 B 案（fork）的理由**（架构层面）：8 项无一项触及 agent loop / session 内核 / 事件存储的硬编码路径——fork 的代价（每次上游发版 merge alpha 破坏性变更）换不来任何必需收益。升级 SOP（跟 release tag）在 A 案下 = 更新依赖版本 + replay 回归，干净。

**已知边界（DSH-3 首验输入，不阻塞 A 案）**：
1. 跨进程 resume id collision 定性（Claude 第 0 项实测发现，与 Qoder/Trae "固定 ID"说未收敛）→ 影响 2.4.1/2.8.2 fork/resume 承接叙事
2. 同会话运行中热切角色（含工具集）粒度——产品树无此承诺，但 S 切片验证时应确认"会话级角色"的可达姿势
3. patchReload: startup 意味着部署期配置变更需重启（单用户可接受，与 Python 时代改 config 重启一致）
