# DSH 0.1.5 能力树映射（31 子项 × 可承接 / 可降级 / 仍须自做）

> 产出：WB ｜ 2026-09-15 ｜ 性质：🔴 **讨论稿**（未定稿）
> 用途：老大 2026-09-15 指令第 2、3 条 ——「docs 与 TODO 按 015 重新调整」「能力树需重新讨论」的**输入**。
> 输入（三份，均在 `../docs/dsh/`）：
> - `dsh-015-notes-scan.md` — 110 篇全新笔记扫描（上游「**打算做什么**」）
> - `dsh-015-upstream-inventory.md` — 两张只读表（上游「**做完了什么 / 自己承认还差什么**」）
> - `dsh-agents-md.md` — AGENTS.md 参考件 + 机制判读
> 方法：以 **`docs/subsystems/` 的 53 篇正式规格**（上游对自身能力的权威描述）为主料，对照 31 子项逐条判定。**基线 = `dsh-v0.1.5-rc.2`。**
> ⚠️ 本稿只回答「**DSH 侧给了什么 / 我方自做范围怎么变**」，**不替代能力树自身的重议**（那要回到产品定位层，见 §6）。
> 本稿**未改动任何 docs / TODO**——判定依据落定后才动（一体两面，见 §7）。

---

## 0. 一句话

**上游的 53 篇子系统规格显示：DSH 把「底座」铺得比我们原判宽得多——31 子项里「连设计参照都没有」的只剩 4 项，且这 4 项恰好全是产品语义核心（记忆管理 / 用户画像 / 意图路由 / 时间感知）。** 同时有 **3 处判定必须改**（2.7.2 因架构前提失效、2.3.3 与 2.10.2 因上游给了我们以为没有的底座），另有 **3 处新增风险**须写进 docs（最重的一条撞我们的凭据红线）。

**统计（对比 `dsh-migration.md` §3.6 现行承接总表「开箱白给 8 / 自做或待定 23」）：**

| 分类 | 数量 | 对比现行总表 |
|---|---:|---|
| 🟢 **可承接**（契约与默认实现均在，我方只做配置 / 启用 / 适配）| **12** | 8 → 12 |
| 🟡 **可降级**（我方仍写实现，但不必从零设计：有底座可挂 或 有参考可抄）| **15** | — |
| 🔴 **仍须自做**（连设计参照都没有）| **4** | 23 → **4** |
| 合计 | 31 | 31 |

⚠️ **口径警告（防误读）**：「可承接」≠零成本（仍要配置 + 适配 + 验收）；「可降级」≠自做减少**已经发生**（只是**范围可以收窄**，收窄多少要老大定）。本稿不含任何「所以不用做了」的结论。

---

## 1. 三分类口径（先定死，防歧义）

| 分类 | 判据 | 我方还要做什么 |
|---|---|---|
| 🟢 **可承接** | 上游有**正式契约 + 默认实现**，且与我们的产品语义**不冲突** | 配置 / 启用 / 适配破坏性变更 / 验收。**不写底座代码** |
| 🟡 **可降级** | 上游有**底座**（可挂载的 seam）或**同题参考设计**，但产品语义是我们的 | 写语义层实现；设计可借鉴上游 / 社区，**不必从零试错** |
| 🔴 **仍须自做** | 上游与社区**均无对应语义**，也无同题设计 | 从设计到实现全自做 |
| ⚪ **须实测后定**（2026-09-15 新增） | 契约 / 实现存在但**未验**，或结论依赖运行时行为 | 跑一次实测 ⇒ 转 🟢 / 🟡 / 🔴 |
| ⛔ **须关闭**（2026-09-15 新增） | 承接后**必须显式关掉**的上游默认行为 | 写进「迁移必关清单」；**不属承接判定、不混入本表** |
| ⬜ **无对手侧** | 上游既无子系统页也无对应包 | 与 🔴 同义，但强调"**连参考都没有**" |

> **⛔ 三条准入**（防垃圾桶化，Claude 提）：① 上游明确不做且我们也不需要；② 承接它违反红线；③ 承接成本 > 自做成本，且收益 < 一条已列风险。**不满足任一条不得入此档。**
> **⛔ 为何单列**：一条能力同时是「可承接」和「须关闭」是常态（如 `web_fetch` 默认放行）——混进三分类会串味，故建议**单独一张清单**挂 `dsh-migration.md` §3.6。
> **⚪ 的准出条件**：跑过一次实测并留下可核证据（命令 + 输出）。**未跑之前不得升格为 🟢。**

**为什么不叫「白给」**：DSH 的「给」有两种形态——① **能力**（`ctx.X` 服务 + provider，接了就有）；② **形态**（数据模型 / 事件 / 契约，但产品面要自己组装）。二者成本差一个量级，故本稿把它们都记作「可承接」，但逐条注明是哪种（§2 的「形态」列）。

---

## 2. 映射总表（31 子项）

> **判定列**：🟢 可承接 ／ 🟡 可降级 ／ 🔴 仍须自做。**「DSH 侧」列全部取自 53 篇子系统规格原文**（路径：`ref/dsh-bare` @ `dsh-v0.1.5-rc.2`，`docs/subsystems/<名>.md`）。
> ⭐ = 与现行承接总表相比有**实质变化**的条目。

### 域一 交互与会话

| 子项 | 判定 | DSH 侧（子系统 / 契约） | 自做部分（收窄后） |
|---|---|---|---|
| 2.3.1 会话生命周期 | 🟡 可降级 | `session-title`（durable latest-wins 标题）+ `workspace`（会话有序账户）+ `session-query`（跨语料列表 / 过滤 / 分页）+ `persistence`（durability seam，5 个 handle 方法） | **回收站（软删 + 恢复）无对应**——append-only 事件流的语义下要自做；批量归档同上 |
| 2.3.2 对话体验 | 🟡 可降级 | 我方**保留 Vue/Tauri** ⇒ DSH 的 React 客户端（`ui-conversation` / `slots` / `client-resources` / 38 篇 UI 笔记）**不直接承接**；但 `continuous-client-recovery`（Host 恢复后 3s 警告 / 15s 中止的**持续重连**）、`pinned-scroll-delivery-before-layout` 等设计可借鉴 | 流式 / 中断恢复 / 常驻 banner 的实现（设计可抄） |
| ⭐ 2.3.3 会话级作用域（沙盒）| 🟡 可降级 | **`workspace`**（会话↔目录归属：稳定 id + 规范路径 + 有序 session 账户；**membership = id 在账户内 且 session header 的 cwd 等于 workspace path**）+ `scope`（per-agent 可见性 / 生命周期归属）+ `sandbox`/`permission-presets`（执行策略） | **隔离语义**——`workspace` 只做分组，**不提供文件访问隔离**（`workspace-files` 原文明说 root「只是相对路径基准、**不是读边界**」）⇒ 隔离策略自做 |
| 2.3.4 多模态输入 | 🟡 可降级 | **`attachment`**（内容寻址、图片与文件分存储、共用有序附件列表）+ `client/file-upload`（015 新增：**非图片不限类型 / 不限大小、byte-for-byte 存**） | **上限 + GC + 2.4.6 升级通道**——上游原文「Attachments are **never deleted**」，且无类型 / 大小限制 |
| 2.3.5 主动触达 | 🟡 可降级 | **`schedule`**（`after`/`at`/`every`，最小 5 分钟；严格时区纪律；**catch-up 只补最近一次、不枚举不重放**；**不打断当前回合**，等 Agent idle；at-least-once 而非 exactly-once）+ **`webhook`**（认证外部投递 → 按需创建 root Session）+ `jobs`（长任务运行时） | ⭐ **触达通道**——`ScheduleDeliveryMode = 'session-local'`，上游明确「**no external notification channel or cold-session scheduler exists**」⇒ 推到用户设备那一段全自做 |

### 域二 记忆与知识

| 子项 | 判定 | DSH 侧 | 自做部分 |
|---|---|---|---|
| 2.4.1 短期记忆 | 🟢 可承接 | `session`（append-only log 为唯一真相源，**LLM message history 是 derived、从不单独存**）+ `compaction` 取代截断 | 配置阈值 / 验收 |
| 2.4.2 长期记忆闭环 | 🟡 可降级 | **`storage`** domain form：`defineDomain(spec)`（zod schema + version + `layout: single/per-record` + `compatibleVersions` + `invalidRecords: backup-and-skip`）、`KvTable`（`get`/`entries`/`put`/`delete`/`update`）、写后 `domain/changed` 事件。**DSH-2.5① 已实测 storage-sqlite 可外接任意绝对路径** ✅ | ⚠️ **`storage` 只有 KV**（唯一 shipped facet），**无向量、无 FTS** ⇒ 元数据可承接，**向量召回 + 语义层（人审 / 矛盾检测 / 保鲜）自做** |
| 2.4.3 记忆可管理 | 🔴 仍须自做 | 产品语义已裁定（硬删、不建回收站），DSH 无对应 | 全部。⚠️ **但见 §3.4 前提澄清** |
| 2.4.4 记忆保鲜与代谢 | 🟡 可降级（**仅设计**）| DSH 无记忆语义；但 `session-query` 的 `surface: current / shadowed / log-only` fold 语义 + proposed `Recallable compaction`（index checkpoints / state checkpoint / in-session history recall）可作设计参照 | 全部实现（设计可借鉴） |
| 2.4.5 用户画像 | 🔴 仍须自做 | `identity/` 自我描述 = **anonymous**，「one anonymous id per harness home… **without identifying the user**」（两版仅 README 改动，`diff --stat` 已确认）| 全部 |
| 2.4.6 知识库 | 🟡 可降级 | `storage`（KV 底座可挂）+ `session-query`（FTS 索引生命周期 / cursor 分页 / filter 代数**可作设计参照**）+ proposed `Domain KV storage capability seam and the workspace entity`（329 行，其设计源）| 混合检索 / 元数据 schema / 引用体系全自做；**底座可复用** |

### 域三 能力扩展

| 子项 | 判定 | DSH 侧 | 自做部分 |
|---|---|---|---|
| 2.5.1 多模型切换 | 🟢 可承接 | `llm` seam + providers（llm-deepseek / llm-pi-ai 等）+ `llm-retry` | 配置。⚠️ `llm` 组 **52 条**欠账（含 `llm-pi-ai` 17 条）⇒ 承接但在演化 |
| ⭐ 2.5.2 工具挂载 | 🟢 可承接 | `tools` 管道 + `shell`/`fs`/`subprocess` seam。⭐⭐ **`web` seam 含 search 与 fetch 两个操作**，且 `web-fetch-http` 已内建：**只允许 HTTP(S)、拒绝携带凭据、每个 hostname 只解析一次、拒绝任何含非公网 IPv4/IPv6 的解析结果集（含 NAT64 活动前缀）、把连接钉在已校验地址上、逐跳同源重定向复查、对重定向数 / 字节 / 字符 / 时间全部封顶** | 工具插件本身。⭐ **范围可重估**：见 §4.1 |
| 2.5.3 扩展性 / MCP | 🟢 可承接 | `mcp-client` + `extensions`（agent 定义并运行版本化 Cordis 包，可在写码前查询已批准元数据）+ `self-modification/` | 配置。⚠️ MCP **只消费 tools**——`acp` 原文「MCP resources and prompts have no DSH consumer」 |

### 域四 角色与路由

| 子项 | 判定 | DSH 侧 | 自做部分 |
|---|---|---|---|
| 2.6.1 角色切换 | 🟢 可承接 | `preset/`（agent-presets + persona）；`preset/persona` 本体 `inject = ['systemPrompt']`，带 `complete`（完全替换 system prompt）/ `includeRuntimeContext` 选项 ⇒ **角色机制 = 官方 preset，公开面可达** | cordis.yml 承接 config 角色。⚠️ 0.1.5 **persona 前后缀拆分**（破坏性）⇒ 旧配置要适配 |
| 2.6.2 自动路由 | 🔴 仍须自做 | **无路由子系统**（53 篇全列表无对应页）；`scope` 只提供 per-agent 可见性载体 | 全部（含"意图 → 角色 + 上下文源 + 工具集"的联合路由）|

### 域五 边界与约束

| 子项 | 判定 | DSH 侧 | 自做部分 |
|---|---|---|---|
| 2.7.1 行为安全硬护栏 | 🟢 可承接 | `sandbox`（bwrap/Landlock/Seatbelt/Windows restricted token；`sandbox-local` **fail-closed**——无 runner 报 `SANDBOX_UNAVAILABLE`，**命令绝不静默裸跑**）+ `permission-presets`（三档：`workspace-write`+`ask` ↔ `danger-full-access`+`never`）| 策略内容。⚠️ 上限：**同世界隔离**，不防恶意代码 |
| ⭐⭐ 2.7.2 边界透明与用户决策权 | 🟢 **可承接**（**改判**）| `approval`（**closed + fail-closed** 结果集 `allowed-once`/`rejected`/`cancelled`/`unavailable`；「缺失 / 非属主 / 抛错 / 不合规的答者一律成为 `unavailable`，**而不是打开闸门**」；`approval/asked`·`approval/decided` **log-only 审计对**）+ `permission-presets`（**preset 表可配置**，客户端渲染成选择器）+ `user-questions`（瀑布 listener **可中继到已连接的客户端**）| **只剩策略内容**：哪些操作要问 / 默认低打扰 / 审批聚合。**可先用官方两档 preset 零代码起步** |
| 2.7.3 凭据与密钥边界 | 🟢 可承接 | `credentials`：**reference 化**（settings / cordis.yml 只存环境变量名）；四层 source（`env`/`file`/`project-env`/`user-env`）；**每次操作重解析**（热更新，轮换 key 下一请求即生效）；`describe()` 的视图**没有能承载值的槽位** ⇒「读半边可整体跨 Remote wire」；**空值即 absent**；对"被进程环境遮蔽"的引用报 `writable: false`（写会假装成功但解析仍返回遮蔽值，故 seam 直接拒绝）| 配置。⚠️⚠️ **红字风险见 §5.1** |
| 2.7.4 成本约束 | 🟡 可降级 | **`token-meter`**：detached replay 快照（`logRevision` / `baseline` / `surfaceDeltaTokens` / `totalTokens` / `surfaceTokens` / **逐节点定价 `TokenSurfaceNode`**），按 route 声明定价（图像按视觉 token 计价）；原文明写「**Trigger, retention, and range selection all read this price**」 | ⚠️ **无预算 / 限额 / 累计**（是"当前请求压力"快照，不是账户消费）⇒ 计量承接，**累计入库 + 预算 / 告警自做**（与 2.8.3 同底座）|
| 2.7.5 数据主权与出境边界 | 🟡 可降级 | `util/http-proxy`（**015 新增**：在任何 entry mount **之前**装 global dispatcher，覆盖 9 个调用点及未来全部）+ `session-telemetry`（`session-telemetry/record` redaction；**只有显式反馈事件才授权上传**，base 对所有用户与 provider 挂 OTel `FEEDBACK_ONLY`）| 出境的**事实本身不变**；处置口径仍归用户（我方裁定不变）。⚠️ `api/gateway` 转发事件**不脱敏、重连不重放** |
| 2.7.6 数据可恢复与可迁移 | 🟡 可降级 | `SessionPersistence.export(id)` → **raw artifact**（parsed header + 逻辑文件名 + 解码后逐字文本）；apiproxy **ZIP 下载**，且区分 `501`（后端不支持）/ `404`（会话不存在）| **单会话导出已给**；**整体备份 / 导出 / 迁移仍自做** |

### 域六 可见性与掌控

| 子项 | 判定 | DSH 侧 | 自做部分 |
|---|---|---|---|
| 2.8.1 沉淀信息可见与可管理 | 🟡 可降级 | `session-projection`（把 log 派生状态**整体当前值**送到 client carrier）+ `client-resources`（`dsh-resource://` 地址 → provider → 帧流）+ `sidebar-right`（每会话 docking 面）| **展示机制可承接**；**记忆来源**（我们的库）与其 schema 自做 |
| 2.8.2 AI 行为可见 | 🟢 可承接 | **`session-query`**：跨会话全文检索（`searchSessions`/`searchEvents`，cursor 分页）+ **事件关系追溯**（`replacedBy` / `replacementChain` / `replacedEventSeqs` / `sourceEventSeqs` / `derivedEventSeqs`）+ **会话家谱**（`SessionLineageTrace`：ancestors / descendants / complete 判别）+ bounded event reads + `session-projection` + `feedback`（log-only）| 渲染层。✅ 维持且**增强**——关系追溯是我们原先没有的 |
| 2.8.3 资源消耗可见 | 🟡 可降级 | 同 2.7.4（`token-meter`）| **用户侧展示 + 入库自做**（改造路径依赖不变：需先建表 + 回填）|

### 域七 质量与可靠性

| 子项 | 判定 | DSH 侧 | 自做部分 |
|---|---|---|---|
| 2.9.1 时间感知 | 🔴 仍须自做 | **无时间感知子系统**。可借的只有 `schedule` 的**时区纪律**（必须显式给 offset 或 `time_zone`；**绝不读浏览器 / 会话 / 进程 / 模型上下文**；DST gap 拒绝、overlap 取较早瞬间）+ 笔记 `environment-prompt-suffix`（环境事实后置以保 provider prefix cache）| 全部实现（但上面两条应作为**设计约束**抄进 2.9.1 稿）|
| ⭐ 2.9.2 超长会话一致性 | 🟢 可承接 | `compaction` seam（`ctx.compaction` + `compaction-basic` provider）+ ⭐⭐ **`compaction-tool-result-pruner`**——**官方默认路径**：`compaction-basic` 在「range selection **之前**」调它（原文：`invokes optional ctx.toolResultPruner before range selection`），且可"在不做摘要的情况下推进 surface" ⇒ 产品树 §2.9.2 说的「**①工具结果遮蔽 = 最划算的第一步**」**正好就是官方默认顺序**。另 `toolPairingBalancedBefore/After` 实现「工具调用与结果同存同弃」| 阈值 / 保留尾部策略（`compaction-basic` 拥有，可配）；⚠️ **保真度档位**（产品树量化：生成式摘要 37% vs 逐字 ~98%）若不达标 ⇒ 自做策略插件 |
| 2.9.3 降级与韧性 | 🟢 可承接 | `guard/`（loop-hygiene + tool-timeout）+ `llm-retry` + `subprocess-native-containment`（逃逸子孙进程 containment：Linux 临时 user-systemd scope / Windows kill-on-close Job；不支持则降级并给一次警告）| `LarryException` 统一出口自做 |

### 域八 形态与部署

| 子项 | 判定 | DSH 侧 | 自做部分 |
|---|---|---|---|
| 2.10.1 云端部署多端使用 | 🟡 可降级 | 出厂形态 = **本机 loopback 浏览器客户端**（cookie 未标 `Secure`、无登出、`store` 只落浏览器 localStorage）。**但远程形态已有完整实现**：`workspace-files-service`（原文 *"from a browser that **may not be on the Host machine**"*）+ `/api/file` 认证路由 + **持续重连** + Electron 壳走 `dsh-app://`（不开监听端口）；`web-server`（`ctx.webServer`：named-route registry / gzip / index.html transform / fallback handler）+ `api-gateway` + `client-connection` + `api-remotes` | 云侧部署 + **多用户 / 租户语义**（`identity` 仍是 anonymous）。⚠️ 出厂**无登出 + cookie 不 Secure** ⇒ 上公网须自补（见 §5.2）|
| ⭐ 2.10.2 端侧能力保留 | 🟡 可降级 | ⭐ **capability seam 模型**（Service Definition + Service Provider）**天然支持"同一能力、不同位置、不同 provider"** ⇒ 「下沉」不必对抗框架，而是**给它写一个端侧 Provider**。已有先例：`sandbox-local` 三平台后端并列、`subagent` 多家 provider 共存、`shell` 的 local/sandbox 双 provider、`e2b/`（云沙箱 POC，反向位置的同类）| 端侧执行器本体 + shell 鉴权重构（IP 白名单 → API Key）。**架构路径已由上游证明可行** |
| 2.10.3 单人单实例 | 🟢 可承接 | `identity` = anonymous（**无用户维度**）⇒ 与「单人」同向 | 形态事实，无需动作 |

---

## 3. 改判点（3 处 + 1 处澄清）

### 3.1 ⭐⭐ 2.7.2 边界透明：从「自做」→「**可承接**」（架构级）

**现行总表理由**（`dsh-migration.md` §3.6）：「🟢 锁定版核实：SDK 请求面无 answer 方法，官方设计文档明写『Zero listeners fall through to **unavailable**』——**此即判二等的核心依据**。」

**为什么这条现在不成立**：该依据的**主体是 SDK 请求面**，而 SDK 请求面只在 **A-service**（Python 主控、DSH 当外部子进程）下才是我方唯一入口。**已拍板的是 A-framework**（全面贴近核心层、写 Cordis 插件）⇒ 我们直接在 DSH 进程内，`ctx.approval` / `ctx.permissionPresets` / `ctx.userQuestions` **全部是公开契约**。

要点（全部取自 `docs/subsystems/approval.md` / `permission-presets.md` / `user-questions.md` 原文）：

1. **fail-closed 是官方默认语义**：「A missing, non-owning, throwing, or non-conforming answerer becomes `unavailable` rather than opening the gate」——这**正是**我们 3.3 验收要的「answerer 抛错 / 超时 → 必须 fail-closed」。
2. **审计对已内置**：`approval/asked` + `approval/decided` 成对，log-only（不入模型转写）⇒ 我们「可观测日志」要求有现成位置。
3. **`permission-presets` 就是「边界 config 化」的官方形态**：preset 表可自定义（`presets?: Record<string, PresetSpec>`），客户端渲染为一个 Permissions 选择器，`set()` 写 log-only 的 `permission/preset` 事件 + 两个 knob ⇒ 与 2.7.2「白名单 / 黑名单 / 工具开关**全部 config 可调、边界交用户决策**」同构。
4. **答者可中继到远端**：`user-questions` 原文「Agent-scoped waterfall listeners compose the available UI surfaces, **including listeners relayed to a connected client**」⇒ 我们 3.3-b / 3.8 要做的「出境 → 人答 → 回填」**官方机制面已支持**（这也与社区件 `dsh-reach` 的 deferred answerer 实证一致）。

**改判后的口径**：2.7.2 从「**自做（因机制面不可达）**」变为「**可承接机制 + 自做策略内容**」。⇒ 分类归 🟢（主要成本从"造一套审批机制"变成"写我们的策略"），**且可先用官方两档 preset 零代码起步**。
⚠️ **不等于 2.7.2 已验收**——策略内容（哪些要问 / 低打扰 / 聚合）仍是我们的产品承诺，DSH-4 验收项不变。

### 3.2 ⭐ 2.3.3 会话级作用域（沙盒）：从「自做插件」→「**可降级**」

**现行总表理由**：「DSH sandbox ≠ 会话文件沙盒」。

**这条仍然正确**（`sandbox` 是**进程 / 文件 effect policy**，不是「每会话一个目录」的产品语义），但**漏了上游真正对位的那个子系统**：

`workspace`（`docs/subsystems/workspace.md`）＝「**a stable id over a canonical path, a display title, and the ordered account of sessions that belong to it**」，且：
- **membership 判定 = id 在该账户内 且 session header 的规范 cwd 等于 workspace path** ⇒ **一个 session 结构上至多属于一个 workspace**
- `attachSession` / `detachSession` / `insertSessionBefore` / `setTitle` / `status()`
- **`session-controller` 已实现该流程**：新建会话时 cwd 取自**选定 workspace 的 path**，创建后 cwd 落进 **immutable `SessionHeader`**，再 `attachSession` 复校验
- 存储走 `storage` domain form；**对模型不可见**（无工具、无 prompt 文本、无 session 事件）

⇒ **老大 2.3.3 的产品意向（「会话可指定工作空间，类似每个会话有一个沙盒」）的数据模型，上游已经有了。** 我方要自做的是**隔离语义**（`workspace` 只做分组，明说 root「不是读边界」；真隔离在 `sandbox` + `workspace-files` 的读权限继承），而不是从零设计「会话 ↔ 目录」的模型与生命周期。

### 3.3 ⭐ 2.10.2 端侧能力保留：认知改判 ——「下沉」不是对抗框架

**现行总表**：「自做下沉」，读起来像"框架不给，我们自己往外搬"。

**实测事实**：DSH 的**每一项本地副作用能力都是 capability seam**（`shell` = Service Definition + bash-local/bash-sandbox providers；`fs` = dsh-fs + fs-local；`subprocess` = subprocess-local；`sandbox` 三平台后端并列；`subagent` 多家 provider 共存）。seam 的语义就是「**定义与实现分离、同一能力可换 provider**」。

⇒ 我方「云端 backend 不注册 shell/file_ops、由本地执行器承接」**正是给它写一个端侧 provider**，与 `e2b/`（把执行搬到云沙箱）是同一机制的反向用法。**这条不是"框架外的补丁"，而是"框架内的标准用法"**——迁移风险因此下调。

### 3.4 澄清（非改判）：2.4.3 硬删 vs append-only 的冲突前提

`dsh-migration.md` §3.4「产品承诺渗透性漂移①」记：「2.4.3 硬删 vs session append-only 留痕（记忆删了但事件日志仍在）」。

**澄清**：该冲突**只成立于"记忆事件留在 session log 里"这一种设计**。而「记忆最小闭环」的做法（DSH-4 已定：挂 `session/` 事件流消费 + 保 SQLite+ChromaDB 双写）是把**记忆本体存在我们自己的库**——`storage` domain form（`defineDomain` + `KvTable`，含 `delete`）或**外接 SQLite**（DSH-2.5① 已实测可指任意绝对路径 ✅）。
⇒ **记忆存自己库 ⇒ 硬删没有 append-only 冲突**；只有「把记忆做成 session 事件」才会冲突。**建议 DSH-4 明确写死"记忆本体不入 session log"**，该风险条目随之收窄。

---

## 4. 新增能力位（我们原以为没有、实际有的）

### 4.1 ⭐ `web_fetch`：我方「不做正文抓取」的成本前提被上游吃掉（一半）—— 🟡 **已挂起（老大 2026-09-15）**

> ⚠️ **本节结论不采纳**。老大判断：`web_fetch` 属**具体 tool**，不在产品定位层判定；DSH 的 tool 挂载面迟早给出成熟形态 ⇒ **迁移后按 DSH 实际挂载方式重估**。
> 连带：§5.3 的必关清单条**不新增**；`product-positioning.md` 2.5.2 **不改**。详见 `capability-tree-revision.md` §4。

**产品树 2.5.2 原文**：「范围边界（首版）：`web_search` 只取搜索结果的标题 / 摘要 / URL，**不做 `web_fetch` 正文抓取**（代价高：**SSRF** / 反爬 / 内容清洗 / 阻塞风险，复杂度高一个量级）」。

**实测**（`docs/subsystems/web.md` 原文）：`web-fetch-http` 已内建——
> 「accepts only HTTP(S), **rejects credentials**, resolves each hostname once, **rejects any answer set containing a non-public IPv4 or IPv6 destination** or an active-prefix NAT64 translation to non-public IPv4, **pins the request connection to the validated addresses**, repeats those checks for **every same-origin redirect hop**, **caps redirects, bytes, characters, and time**, and decodes the body」

| 成本项 | 上游是否已吃 |
|---|---|
| SSRF（含 DNS rebinding / NAT64 / 重定向绕过）| ✅ **吃得很细**（DNS pinning + 逐跳复查）|
| 阻塞 / 无限流（重定向、字节、字符、时间）| ✅ **全部封顶** |
| 反爬 | ⚠️ 未提及（UA / 代理走 `util/http-proxy`，可配）|
| 内容清洗 / 正文抽取 | ⚠️ **无**——`WebFetchBody` 只有 `html` / `text` 两臂（分类，不是抽取）|
| 引用形态 | ✅ `WebSearchResult` 带 `content` + `sources[]`（url/title/snippet/publishedAt）⇒ 正合 2.8.2 来源标注 |

⇒ **建议把 2.5.2 的「范围边界」从"不做 fetch"改为"评估承接上游 fetch"**（成本项已从 4 项降到 2 项）。⚠️ **但必须同时加一条限制**（见 §5.3）。

### 4.2 ⭐ `compaction-tool-result-pruner`：产品树设想的"最划算第一步"就是官方默认

产品树 §2.9.2 从行业数据推出「**①工具结果遮蔽是最划算的第一步**（成本 −52%、任务完成率不变），优先于上 LLM 摘要」。上游 `compaction-basic` 的默认顺序**正是**：pressure 或 overflow 成立 → **先调 `ctx.toolResultPruner`** → 重测 → **可"在不做摘要的情况下推进 surface"**。
⇒ 我方 §2.9.2 的分级路径第①步**不必自造**，且第②步（摘要）也有 provider。**这是本次扫描里对 2.9.2 最直接的好消息。**

### 4.3 ⭐ `schedule` 的 catch-up 语义：正面回答产品树 2.3.5 的「missed-run 是否必答」

产品树 2.3.5 留了一个钩子：「**触发引擎位置与 2.10.2 联审**（决定 missed-run 是否必答）：引擎放云端常驻则问题很薄；放端侧则**必须有显式策略**（补跑全部 / 只补最近一次 / 跳过）」。

上游已给出一个**成文答案**（`docs/subsystems/schedule.md`）：
> 「When a Session was cold or busy across several targets, one Every record contributes **only its latest due occurrence**… **without enumerating, persisting, or replaying missed intervals**.」
> 「Batching bounds model turns; the five-minute minimum bounds each record's timer frequency.」

⇒ **「只补最近一次 + 不重放 + 批量合并成一轮」**——可直接作为 2.3.5 的设计参照（省一轮试错）。另两条可抄：**「等 Agent 完全 idle 才动作，绝不 `steer()`、绝不打断当轮」**（低打扰的实现口径）、**at-least-once 而非 exactly-once**（崩溃窗口可能重复提醒，如实声明）。

---

## 5. 新增风险（承接的代价，须写进 docs）

### 5.1 🔴🔴 凭据脱敏是 **fail-open**（撞 Tier0 红线 1）

**证据**：`packages/settings/*/src/redact.ts` 源码标记（`dsh-015-upstream-inventory.md` 表 A ④）：
> `TODO(settings-wire-redaction): **Fail closed instead** — a secret reachable only through a union, intersection, or transform is returned **verbatim** here, with **nothing recording that it was missed**.`

**含义**：上游自己的 wire redaction **在联合 / 交叉 / 变换类型下会把秘密原样返回，且无任何记录**。上游把它标为 TODO（待改为 fail-closed），**当前是 fail-open**。

**为什么对我们最重**：我们的 Tier0 红线 1 是「**API Key 不外泄**」。「key 不进日志 / 不回声」**不能依赖 DSH 的 wire redaction**——它在上游自己承认的失败形态下是静默放行的。

**处置建议**：① 在 `docs/local-env.md` 或 3.0 凭据验真条目下写明「**上游脱敏不可作为红线保障**」；② 我方 key 卫生靠**自己的路径**保证（config 不入库、日志出口过滤、展示走占位符——现行做法不变）；③ 3.0「凭据层验真」的验收**只验"读取与使用"，不得把"不泄漏"计入 DSH 承接面**。

### 5.2 🟡 出厂传输安全为零：cookie 未标 `Secure` + 无登出

**证据**（`client/connection` 原文，见 `dsh-015-upstream-inventory.md` 表 A ①）：
> 「The browser cookie is **not marked `Secure`** — loopback HTTP is **the shipped transport**」
> 「**There is no logout operation** — clearing the browser cookie ends one browser session; deleting the owner credential record and restarting `dsh` revokes every session.」

**对我们的意义**：⭐ 这是对 2.7.5「上云硬前置 ② HTTPS（Nginx TLS 终止）」的**实证支持**——不是"我们谨慎所以加 TLS"，而是**"上游出厂形态假定 loopback，一旦暴露到明文网络即泄漏 bearer cookie"**（上游自己这么写的）。另须补**登出 / 撤销链路**（上游无此操作）。

### 5.3 🟡 `web_fetch` 不受 sandbox / approval 管辖、无 per-call 确认 —— 🟡 **随 §4.1 挂起**

> ⚠️ 本条**不进「迁移必关清单」**（因为未采纳承接 `web_fetch`）。若将来按 DSH 挂载形态重估并承接，**此条必须同时恢复**——它是承接该能力的前置条件，不是可选项。

**证据**（`docs/subsystems/web.md` 原文）：
> 「The shipped Cordis, Code, and Standard presets expose `web_fetch` **in every sandbox and approval mode without per-call confirmation**. File sandbox presets **do not govern Web network access**. A deployment that needs confirmation must add a `tools/pre-execute` policy or disable fetch.」

**含义**：若 §4.1 采纳「承接 fetch」，**它是默认放行的**——这与我方 2.7.2「边界交用户决策」不一致。
**处置**：若启用，须挂 `tools/pre-execute` 策略（或按需禁用），**并写入「迁移必关清单」**（该清单只回答"DSH 给了什么我们必须关掉"，此为新增一条）。
另附上游自己的诚实边界：「These checks prevent SSRF access to non-public destinations but **do not stop a model from sending data to a public URL**」⇒ 与 2.7.5 出境口径合读（搜索词 / 抓取目标同样出境）。

---

## 6. 对能力树的影响（**建议，待老大裁定**）

> 老大第 3 条要求「能力树需要重新讨论」。以下是**由本次映射直接导出的**改动候选，**不含**产品定位层的重议。
>
> ⭐ **2026-09-15：本节 8 条已展开为「现状原文 → 建议改后」的可审形态** ⇒ **`capability-tree-revision.md`**（老大已给方向：7 条认 / 1 条暂缓）。本表保留为索引。

| # | 建议 | 性质 |
|---|---|---|
| 1 | 给每条子项加一列 **〈对手侧状态 + 依赖版本〉**，把本次三份稿固化为「每次基线更新重扫」的常设动作 | 形态（老大已在扫描稿 §C.4 提过，此处再确认）|
| 2 | **2.7.2** 条目改写：删掉「DSH 无审批机制」的隐含前提（现行文本未直说，但结论建立在"SDK 面不可达"上）；补「机制面由 DSH 承接、策略内容自做」 | 🟡 依据变更 |
| 3 | **2.3.3** 条目改写：把「轻量判据」段落从"行业两模式都不适用，故选目录级隔离"升级为"**上游 `workspace` 已是该数据模型**，我方只做隔离语义" | 🟡 依据变更 |
| 4 | ~~**2.5.2** 的「范围边界（首版）：不做 `web_fetch`」改为「**评估承接**」~~ ⇒ 🟡 **暂缓**（老大 2026-09-15：具体 tool 不在产品定位层判定） | 🟡 范围 |
| 5 | **2.3.5** 的「missed-run 策略」由"待定"改为「**参照上游 schedule：只补最近一次 + 不重放 + 批量合并**」（仍待老大首肯） | 🟡 设计参照 |
| 6 | **2.9.2** 的分级路径第①步注明「**上游默认顺序即如此**」（`toolResultPruner` 先于 range selection） | ⚪ 补注 |
| 7 | **2.4.3 / 2.7.6** 补一句「**记忆本体不入 session log**」的架构前提，使「硬删无冲突」成立 | 🟡 前提澄清 |
| 8 | **2.10.1** 的依据换口径（见下） | 🟡 依据变更 |

**2.10.1 的依据替换（单独说明）**：现行写法建立在「DSH 无远程能力」上。实测是「**有单机远程访问的完整实现**（浏览器可不在 Host 机器 + `/api/file` 认证路由 + 持续重连 + Electron 壳），**缺的是多用户 / 租户语义与传输安全**」。⇒ **结论方向不变（云侧部署与租户隔离仍自做），但依据必须换**，否则下次复核时会因"上游明明有远程"而误判结论失效。

---

## 7. 对 docs / TODO 的联动清单（**待裁定后执行，本稿未动**）

> 遵项目规范「一体两面、须同步」：决策稿定「做什么」，TODO 定「怎么做」。

| 目标 | 动作 | 依据 |
|---|---|---|
| `docs/dsh/dsh-migration.md` §3.6「31 子项承接总表」 | **按本稿 §2 重写**（8/23 → 12/15/4），并补「形态 vs 能力」标注 | §2 |
| 同上 §3.2 / §3.3 | §3.3 表的「用户画像 / 云端 / 知识库」三行依据需与本稿对齐（知识库一行已由"借鉴自实现"覆盖；云端一行依据换口径）| §3、§6 |
| 同上 §3.4 | ①「产品承诺渗透性漂移①」按 §3.4 澄清收窄；② 新增 §5.1 凭据 fail-open 风险条 | §3.4、§5.1 |
| 同上 §3.4 升级 SOP / 基线声明 | 基线 **`0.1.2-rc.1` → `0.1.5-rc.2`**（老大 2026-09-15 已拍）；`docs/dsh/README.md:20` 已改，§3.4「DSH-2.6 收口复核」需补一条「015 基线采纳」 | 老大指令 |
| `docs/dsh/dsh-migration.md` §3.6「迁移必关清单」 | **新增一条**：`web_fetch` 默认放行、不受 sandbox/approval 管辖（§5.3）| §5.3 |
| `docs/product-positioning.md` | 按 §6 的 8 条改（可分批）| §6 |
| `TODO.md` DSH-3 段 | 「基线：写码按锁定版 `0.1.2-rc.1` API（不升基线）」**已失效** ⇒ 改 `0.1.5-rc.2`，并挂 0.1.5 破坏性清单（Session V2→V3 / 移除 `ctx.agent` / persona 前后缀拆分 / `conversation` slot → `main`）| 老大指令 |
| `TODO.md` DSH-4 段 | 承接表引用改指向新口径；「回收站 / 每会话文件沙盒（DSH `sandbox/` 语义不同，须自定义）」按 §3.2 修订（`workspace` 已给数据模型）| §3.2 |
| `docs/dsh/` 三份稿 | 🟡 **暂缓合并**（老大 2026-09-15：「合并不是目的，先做其他的」）| 老大指令 |

---

## 8. 证据边界（诚实清单）

**🟢 已用代码 / 契约复核（硬）**
- 53 篇子系统规格的存在性 + 正文（`git show <tag>:docs/subsystems/<n>.md`，基线 `dsh-v0.1.5-rc.2`）
- 本稿引用的全部类型定义 / 契约文字：`token-meter`、`storage`（`DomainSpec` / `KvTable` / `StorageBackend`）、`credentials`（`CredentialRef` / `ResolverCredential` / `CredentialInfo`）、`permission-presets`（`PresetSpec` / `Config`）、`approval`（`ApprovalOutcome` / `ApprovalPolicy`）、`user-questions`（`AskUserQuestionIntent`）、`compaction`（`CompactionResult` / `CompactionTrigger` / `PrunedEntry`）、`web`（`WebFetchResult` / `WebFetchBody` / SSRF 段）、`schedule`（`ScheduleRecord` / `ScheduleDeliveryMode` / catch-up 段）、`workspace`（`Workspace` 接口全部成员）、`session-query`（`SessionResultFilter` / `SessionEventTrace` / `SessionLineageTrace`）
- 前序已复核项：`lease.ts` 源码、`docs/session-format-status.md` 存在性、`packages/identity` 两版仅 README 改动、`client/file-upload` 与 `util/http-proxy` 的 015 存在性

**🟡 取自上游原文但未独立复跑（软）**
- 表 A 的全部 README 欠账条目（1048 条中的引用部分）
- `settings/redact.ts` 的 TODO 文本（**源码标记为真，但"当前确实 fail-open"未经我方构造用例复现**）
- `web-fetch-http` 的 SSRF 行为（**读的是规格文字，未实跑**；若 §4.1 要采纳，**必须补一轮实测**）
- `client/connection` 的 cookie / 登出条目

**⬛ 未验**
1. `workspace` 的**运行时行为**（membership 过滤、attach 流程）——只读了类型与规格，未跑
2. `permission-presets` 自定义 preset 表在真实 profile 里能否生效（**这是 2.7.2 改判的落地前提**）
3. `token-meter` 在长会话下的稳定性与成本（52 条 llm 组欠账相关）
4. 0.1.5 的 ACP 是否真的仍缺 `fork`/`load`/`delete`（读 diff 未见新增 ≠ 实测，见扫描稿 §A6）
5. `web_fetch` 在 CVM 上的实际可达性（可能受网络环境影响）

---

## 9. 裁定记录（老大 2026-09-15）

> 原「待老大裁定」6 项**已全部有结论**，此节转为记录。

| # | 事项 | 裁定 | 落地 |
|---|---|---|---|
| 1 | 三分类口径加档 | ✅ **可丰富** | 已扩为 **5+1 档**（§1：新增 ⚪ 须实测后定 / ⛔ 须关闭 / ⬜ 无对手侧）；⛔ 建议**单列清单** |
| 2 | 2.7.2 架构级改判 | ✅ 认，**但须先实测** | 改后文本 → `capability-tree-revision.md` §2；前提实测 = `permission-presets` 生效 + `approval` fail-closed |
| 3 | 2.3.3 / 2.10.2 改判 | ✅ **均认** | → `capability-tree-revision.md` §3 / §8 |
| 4 | §4.1 `web_fetch` 重估 | 🟡 **暂缓** | 弱化为观察点；§5.3 必关条**不新增**；2.5.2 **不改**。理由：**具体 tool 不在产品定位层判定** |
| 5 | §6 八条能力树改动 | ✅ 已单写供审 | → **`capability-tree-revision.md`**（改 `product-positioning.md` 的执行**待老大批该稿后**定） |
| 6 | 落点 / 合并 | 🟡 **「合并不是目的，先做其他的」** | 暂不合并；本稿继续留 `exchange/`；三份稿的**过期状态区**待机订正 |

**仍未决（本稿范围外，老大已收到）**：MEMORY.md 两条候选增补（「同一靶子不得两路派发」「代码复核属文献证据」）—— 需人类操作，老大表示会考虑。
