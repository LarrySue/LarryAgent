# DSH 0.1.2-rc.1 → 0.1.5-rc.2 全新笔记扫描（110 篇）

> 产出：WB ｜ 2026-09-15
> 性质：**讨论稿**（未定稿）。输入＝基线决策（挪不挪 0.1.5-rc.2），也被 `product-positioning.md` 的「对手侧状态」列长期复用。
> 方法：`ref/dsh-bare` 本地裸仓库两 tag 对照；110 篇＝`basename` 级差集除以 3（每篇 `.md` / `.zh.md` / `.i18n.yaml`）。**结论只用代码与源码复核过的证据，笔记自述单独标注。**

---

## A. 结论区（结论先行）

### A0. 一句话

**110 篇不是「一堆新功能」，是上游在 3 周内同时做完了三件事：① 把 Session 数据从「pre-release 随便改」升格为「已发布不可破坏」的正式契约；② 补上了我们 3.2 正在踩的那类跨进程写冲突的底座；③ 把「浏览器与 Host 可分离」的远程形态从零建起来。** 前两件直接改我们的判据，第三件对我们的产品定位有压力但未推翻。

### A1. 🔴 最高级命中：AGENTS.md 的产品哲学在 0.1.5 正式转向（不是笔记，是笔记链挖出的治理事实）

`AGENTS.md` 两版只差 **1 行标题 + 3 行内容**，但性质是分水岭：

| | 0.1.2-rc.1 | 0.1.5-rc.2 |
|---|---|---|
| 标题 | `Pre-release stance: **foundation over blast radius**` | `**Pre-stable APIs and released Session data**` |
| 数据 | 「Remove at the first tagged release」；「Backends **reject old on-disk formats**」；`SESSION_FORMAT_VERSION` 保持 `0`，**no compatibility promise** | 「**never move, overwrite, or delete committed generations**」；predecessors imply neither fallback nor downgrade support |
| 引证 | 无 | **直接引用** `.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md` |

并且 015 新增了一份官方治理文档 **`docs/session-format-status.md`**（012 上不存在，已用 `ls-tree` 确认）。

⇒ **对老大的核心论点：「第一个 stable 才是完整体现产品哲学与定位的东西」——实测反了。**
这一次的哲学变身（从"发布前可以随便破坏"到"已发布数据有正式义务"）**发生在 rc 阶段，不在 stable**。它的载体是 AGENTS.md 一行 + 一份治理文档 + 一篇设计笔记，三件都已落盘。**产品哲学不需要等 stable 才能读到；它已经在 AGENTS.md 里写着。**

⇒ 对我们：`dsh-migration.md` §3.4 的「pre-stable API → **破坏性变更常态化**」表述需**拆分**——**API 面仍 pre-stable（成立），但 Session 数据面已获正式不可破坏承诺（012 上没有）**。两条混在一句话里会误判。

### A2. 🔴 3.2 的靶子：0.1.5 已实现「跨进程 Session 写租约」

代码复验（非笔记自述）：

| 项 | 0.1.2-rc.1 | 0.1.5-rc.2 |
|---|---|---|
| `packages/session/session-persistence-jsonl/src/lease.ts` | — | **存在** |
| `.../src/win32.ts` | — | **存在** |
| `native/system/docs/flock-contract.md` | — | **存在** |

`lease.ts` 源码逐条核过（我读过）：POSIX `flock(2)` 非阻塞 ／ Windows named kernel semaphore（`CreateSemaphoreW`）／争用→`SessionAlreadyOwnedError`／**内核在持有者 fd/handle 关闭时释放，含进程死亡**／**故意不做 TTL 抢占**（理由写在注释里：被抢占者的后续 append 会撕裂日志）／POSIX 下锁命名 inode 故需校验 inode 未换／release **从不删锁文件**（保住稳定 inode）／browser worker 把 flock stub 成立即成功（单进程）。

⇒ **我们 09-11 判的「0.1.5 没修掉 3.2 要查的行为」已过时，必须改口径。** 准确分层：

- **进程内 agent 注册 collision**（`core/agent` 的 `enter()`）——`enter()` 仍未出现在 diff 中，**未变** ⇒ 012 的结论在这一层仍有效
- **跨进程同 id session 写-open**——**015 新增内核锁**。012 上两个进程可交错写（tear 压缩帧、seq 断裂）；015 上第二个写入者**直接被拒**（`SessionAlreadyOwnedError`）

⇒ **若挪 015，3.2 的实验设计要重做**：012 上「交错写坏日志」这个现象在 015 上**不会复现**，替换成「第二个进程收到明确错误」。**同一实验不可能两个版本都跑出同一结论——结论不可跨版本引用**（与「修正性实验的结论必须限定路径」同源）。

### A3. 🔴 profile / 组合面：**结论未变，但依据要换**

两条 simplification 笔记看着吓人，实测**不冲击我们**：

- `2026-09-03-minimal-profiles-persistent-shell-only`：minimal 组合**只留一个** persistent shell（Linux/macOS `bash` / Windows `pwsh`），**移除** `str_replace_editor` + filesystem tool + `fs-local` service
- `2026-09-05-base-default-file-editor`：base 改用 `read`/`write`/`edit`，**不插** `str-replace-editor`

但 10.1 已实测「`dsh-base` 84 deps / `dsh-sdk-app` 4 deps 两版逐项一致」⇒ **受影响的是 `minimal` 组合，不是我们用的 base/sdk**。结论：**不冲击**，记录一句「上游在持续收紧 minimal 预设，方向与我们的精简 profile 一致」。

### A4. 🟡 「云端部署 = DSH 内核无」——**方向未变，但上游已开始建远程形态**

先前断言依据是「AGENTS.md 零论述 cloud/multi-user；只有本地 `host/` + 本地 `client/`」。110 篇里出现一批**浏览器与 Host 分离**的正式设计：

| 笔记 | 机制 |
|---|---|
| `2026-09-05-workspace-files-service` | 原文明说 *"from a browser that **may not be on the Host machine**"*；Host 侧 `ctx.workspaceFiles` + Remote namespace + Client `file` provider |
| `2026-09-05-client-resource-model` | `dsh-resource://` 地址 + provider 流模型（客户端按需拉取） |
| `2026-09-08-file-display-through-filesystem` | **`/api/file` 认证路由**，走 `ctx.fs` 读字节（含 HEAD 与 maxBytes 上限） |
| `2026-09-05-continuous-client-recovery` | Host 恢复后 Client **持续重连**（3s 警告 / 15s 中止，非有限次重试） |
| `2026-08-25-electron-desktop-packaging-and-updates` | 官方 Electron 壳：内置 Node + pinned pnpm，起 Desktop Host 子进程，走 `dsh-app://`，**不开监听端口** |

⇒ 压力点：**「Web client 不在 Host 机器上」这个前提，015 起被官方正面承认并配了文件服务 + 认证 + 重连**。这与我们的 C/S 分离方向**同构**。

⚠️ 但**不是云 / 不是多租户**：`packages/identity/anonymous-user-id` 两版**只有 README + package.json 版本号改动**（已用 `diff --stat` 确认）⇒「one anonymous id per harness home…**without identifying the user**」的语义未变，**仍无用户维度**。

⇒ **`§3.3 云端部署` 结论方向不变**（真实原因从"没做"改成"做了单机远程访问，但没做多用户/租户"）；`§3.3 用户画像` 结论**依据升级为本地代码实证，不变**。

### A5. 🟡 2.3.4 多模态输入：**对手侧已给**（但不推翻我们的「未做」）

`packages/client/file-upload`（015 存在 / 012 **不存在**，已 `ls-tree` 确认）+ 笔记 `2026-08-26-generic-file-upload`：

- 文件与图片**分存储**、共用一条有序消息附件列表
- 非图片文件**不限类型、不限大小**，byte-for-byte 存
- 规范对象：`DSH_HOME/attachments/v1/file-objects/<digest-prefix>/<digest>`
- 模型可见路径：`DSH_HOME/attachments/v1/files/<digest-prefix>/<digest>/<name>`

⇒ docs 2.3.4 写的是「**LarryAgent 当前无实现**」，不是「DSH 没有」⇒ **不推翻**。但：
**「对手侧状态」列必须填「015 已给（可作为底座直接承接）」**，且迁移后 2.3.4 有从「自做」降为「承接」的实质空间——这正是「能力树里有多少是白给的没兑成体验」那个老问题。

### A6. 🟡 ACP 契约面：`-32601` 结论**待重核**（不推理，只标证据）

015 的 `packages/acp/acp/src/` 有真实改动（读 diff）：

- `persistence.ensureMaterialized(session)` → **`ctx.sessions.flush(session)`**（handle 化）
- `persistence.list(signal)` → **`persistence.stat(sessionId, {signal})?.header`**（单查不再走 list）
- `setup: async (agentCtx) => { const agent = agentCtx.agent ... }` → **`setup: async (agentCtx, agent)`**

⇒ **读 diff 未见新增 `fork` / `load` / `delete` 方法**，但 `dsh-migration.md:260/618` 的 `-32601` 是在 **012 上实测**的。
**按证据纪律：读 diff ≠ 实测，标「待实测」**，不写成「015 依然缺」。

顺带：`explicit-agent-runtime-identity` 笔记解释的 `AgentSetup(agentCtx, agent)` 变更（10.2 已记）**在 ACP 里已落地**——这条链闭合了。

### A7. 🟡 数据导出（2.7.6）：对手侧已有 raw 导出 + ZIP

- `2026-08-27-persistence-export-and-pre-release-trims`（archived）：`SessionPersistence.export(id, signal?)` 返回 raw artifact（parsed header + 逻辑文件名 + 解码后逐字文本）；apiproxy **ZIP 下载**，且区分 `501`（后端不支持）与 `404`（会话不存在）。
- ⚠️ 注意此笔记**已归档** ⇒ 它描述的 `supportsRawArtifacts`/`readRaw` 已被 handle API 取代；`export()` 是被**保留**下来的那一个。

⇒ docs 2.7.6「未做：整体备份/导出/迁移」⇒ **对手侧有「单会话 raw 导出 + ZIP」**，非「整体备份」。填「对手侧状态」列时须写准，别写成"DSH 有备份"。

### A8. 🟡 Windows 方言面：015 新增多处，其中一条正中我们踩过的坑

| 笔记 | 内容 | 对我们的意义 |
|---|---|---|
| `2026-09-05-patch-plugin-file-urls` | **Node ESM 把 Windows 盘符当 URL scheme**；文件名含 `#`/`%` 被当 URL 语法 ⇒ 必须转 file URL | ⭐ **与我们「Bash heredoc 里盘符路径被静默改写」是同一族坑** |
| `2026-09-06-windows-python-console-spawn-wait` | Windows CRT exec ≠ POSIX 进程替换 ⇒ 改 spawn-and-wait，避 `0xc0000005` | 与我们的「PowerShell 无 ConPTY」同族（Windows 原生进程语义坑） |
| `2026-09-03-hidden-windows-subprocess-windows` | 非终端 spawn + taskkill 全加 `windowsHide: true` | 3.7 |
| `2026-08-31-win32-picker-path-string-read` | `koffi.decode` 读 NUL 结尾 UTF-16 | 3.7 |
| `2026-09-07-win32-picker-foreground-alt-key` | 合成 Alt 按键抢前台 | 3.7 |

⇒ 归入 3.7 观察面，**不改变结论**，但说明「Windows 不是二等公民」有新证据。

### A9. ⚪ 结构性观察（对整个 110 篇）

1. **档位分布：implemented 96 / archived 13 / proposed 1**（012 的 proposed 是 78）⇒ **proposed 队列被清空** + **13 篇「新写即归档」**（生命周期全在 08-20~09-08 窗口内）⇒ 两条都是**阶段收尾**的信号，也是老大所说「**有些东西是还没来得及做**」的直接实证：**上游确实在窗口期里写完又自己推翻（如 TTL 抢占方案）。**
2. **process/testing 类占 25 篇**（CI 缓存/runner 预算/性能门禁/测试预算）⇒ 上游在**工程化基建**上投入巨大 ⇒ 对 `§3.4 项目长期可持续` 是**正面证据**。
3. **社区→官方有先例**：`2026-08-25-promote-open-anywhere-plugin` —— 社区插件 `@dsh-plugins/open-anywhere` 被吸收为一等公民 `open-in-app`。⇒ 「只借鉴不直装」策略下，**这条路是通的**（社区原型确会被官方兑现）。
4. **上游也在做「证据驱动」**：`2026-09-06-evidence-driven-performance-skill` 明确写「historical PR descriptions retain abandoned implementations，**copying their apparent solution can restore a rejected design**」⇒ 与我们的证据纪律/复验方法论**同构**，可作方法论的同行印证。

---

## B. 110 篇全表（按主题分组）

> 标注：**🔴 改判据** ／ **🟡 需补注·重核** ／ **⚪ 归档留痕**。路径前缀均为 `.agents/notes/`。

### B1 会话持久化 · 格式迁移 · 性能（🟡 3.1④ 直接相关，11 篇）

| 笔记 | 判读 |
|---|---|
| ⭐ `implemented/architecture/2026-08-27-handle-based-session-persistence` | seam 改为 **5 个 handle 方法**：`create(header)`／`open(id,'read'\|'write')`／`stat(id)`／`list()`／`flush()`。`stat`/`list` 只给快照不读日志。**3.1④ 的 API 形态基础** |
| ⭐ `implemented/architecture/2026-08-31-released-session-format-migrations` | v0 已随 alpha 发布 ⇒ **不能把已存在 JSONL 当可丢弃的 pre-release 状态**；改 stateful Stage API（116MB 真会话曾撑爆 16GB Node 进程）。**被 AGENTS.md 直接引用** |
| 🟡 `implemented/architecture/2026-09-01-v2-embedded-assistant-streams` | v2 取消顶层 `assistant/chunk`，改为每次 attempt 一个 settlement，内嵌 `stream: AssistantStreamRecord[]` |
| 🟡 `implemented/architecture/2026-09-06-v3-canonical-session-envelopes` | V3 统一 envelope：surface 事件必须带 `surfaceOp`；log-only 事件只许 `type/seq/time/data` + 可选 `ignorable` |
| 🟡 `implemented/architecture/2026-09-06-embedded-stream-record-readers` | 消费方直接读 compact record，不再 `expandAssistantStream()` 全展开 |
| 🟡 `implemented/architecture/2026-09-05-read-only-session-migration-preparation` | 读-open 只等 preparation，写-open 才等 publication（省掉约 2.2s 无用等待） |
| 🟡 `implemented/architecture/2026-08-31-alpha-historical-unknown-event-refusal` | 迁移必须**拒绝**每个未知历史事件（含标 `ignorable: true` 的）——基数保持型迁移的严格义务 |
| 🟡 `implemented/testing/2026-09-04-session-open-performance-gate` | 127MB 会话首开 35ms → **5s**；加必跑 benchmark 门禁 |
| 🟡 `implemented/testing/2026-09-06-backend-continuation-performance` | 工具密集续跑的性能基线（含 shipped-profile 变体） |
| ⚪ `archived/architecture/2026-08-31-live-assistant-stream-frames` | 实时流帧与 session log 分离 |
| ⚪ `archived/process/2026-09-03-workspace-version-coherence-gate` | 版本一致性静态门禁 |

### B2 跨进程写冲突 · 沙箱 · 子进程（🔴 3.2 / 3.5 直接相关，4 篇）

| 笔记 | 判读 |
|---|---|
| ⭐🔴 `implemented/feature/2026-08-31-cross-process-session-write-lease` | **见 A2。3.2 靶子，015 新增** |
| 🟡 `implemented/architecture/2026-08-28-subprocess-native-containment` | 逃逸子孙进程containment：Linux 进临时 user-systemd scope / Windows 进 unnamed kill-on-close Job；不支持的主机降级并给一次警告 |
| 🟡 `implemented/architecture/2026-09-07-prebuilt-system-primitives` | `@deepseek-ai/node-addon-system` 替代需编译的 `fs-ext`（Node-API v8 预编译、glibc/musl 分档）⇒ 解释 10.1 的 `sandbox-local` import 迁移 |
| ⚪ `archived/bug-fix/2026-09-03-hidden-windows-subprocess-windows` | `windowsHide: true` |

### B3 代理 · 网络（🔴 正中我们踩的坑，1 篇）

| 笔记 | 判读 |
|---|---|
| ⭐🔴 `implemented/architecture/2026-08-27-outbound-proxy-policy` | Node `fetch` **忽略** `HTTP_PROXY`/`HTTPS_PROXY`；015 新增 `packages/util/http-proxy`，在 `runProfile` 里**任何 entry mount 之前**装为 global dispatcher，覆盖 9 个调用点 + 未来全部。**正是我们 09-15 踩的 socks5 代理坑** ⇒ 015 上被官方正式解决 |

### B4 文件能力 · 资源模型 · 预览（🟡 2.3.3 / 2.3.4 / 2.4.6，12 篇）

| 笔记 | 判读 |
|---|---|
| ⭐🟡 `implemented/feature/2026-08-26-generic-file-upload` | **见 A5。2.3.4 对手侧已给** |
| ⭐🟡 `implemented/architecture/2026-09-05-workspace-files-service` | Host `ctx.workspaceFiles` + Remote + Client file provider；**"browser may not be on the Host machine"** |
| 🟡 `implemented/architecture/2026-09-05-client-resource-model` | `dsh-resource://<type>/…` 地址 → provider → 帧流；`ctx.resources` + `useResource` |
| 🟡 `implemented/architecture/2026-09-07-workspace-files-dual-face-package` | workspace-files 收成**一个双面 API 包**（Host + `./client`） |
| 🟡 `implemented/architecture/2026-09-09-workspace-file-read-authority` | 文件读**继承 Session fs 后端的读权限**，workspace root 只是相对路径基准、**不是读边界**（可读 workspace 外文件）；`list`/`changes` 仍 workspace 限定 |
| 🟡 `implemented/architecture/2026-09-08-document-preview-operations` | 文档预览：资源观察（`source`/`pin`/`open`）与内容读分离 |
| 🟡 `implemented/feature/2026-09-07-session-prose-local-media-display` | 会话正文里的本地图片路径走同源 file 路由渲染 |
| 🟡 `implemented/feature/2026-09-08-file-display-through-filesystem` | **`/api/file` 认证路由**，走 `ctx.fs` 读字节；**废除目录/MIME 白名单**，改由认证 + provider 读策略管辖；含 maxBytes 上限 |
| 🟡 `implemented/feature/2026-09-08-present-workspace-source-files` | `present` 工具声明 workspace 源文件（**只记路径不复制**），deliverables 插件用宿主默认程序打开 |
| 🟡 `implemented/feature/2026-09-09-present-filesystem-access` | `present` 走 `ctx.fs` 可读权限，**无 workspace 包含检查**、无 `/tmp` 特例 |
| ⚪ `archived/feature/2026-09-08-web-explicit-file-delivery` | 显式文件快照交付（被上面两条取代） |
| ⚪ `implemented/feature/2026-09-05-sidebar-text-preview-and-file-tree` | 右侧栏文档预览 + 文件树两个 tab 类型 |

### B5 数据导出 / 反馈 / 隐私（🟡 2.7.6 + 隐私面，6 篇）

| 笔记 | 判读 |
|---|---|
| ⭐🟡 `archived/simplification/2026-08-27-persistence-export-and-pre-release-trims` | **见 A7**：`export()` raw + apiproxy ZIP（501/404 区分） |
| 🟡 `implemented/architecture/2026-09-05-canonical-feedback-log` | 反馈权威收进 **session log**（`feedback/record`、`feedback/message-put`、`feedback/message-delete`），**log-only**、不改模型输入 |
| 🟡 `implemented/architecture/2026-09-05-nonofficial-feedback-otel` | **只有显式反馈事件**才授权上传；base 对**所有用户与 provider** 挂 OTel `FEEDBACK_ONLY`；继承来的反馈不算子会话的同意 ⇒ **隐私面正式设计，值得抄口径** |
| ⚪ `implemented/feature/2026-09-08-feedback-dialog-and-categories` | 反馈对话框 + 分类（`FeedbackCategory`） |
| ⚪ `implemented/feature/2026-09-10-symmetric-message-feedback-submission` | 赞/踩对称都走对话框确认 |
| ⚪ `implemented/feature/2026-09-07-model-switch-notice` | 模型切换对模型可见的通知（`[model changed: ...]`） |

### B6 提示词 · 上下文预算（🟡 2.9.2 / 成本，7 篇）

| 笔记 | 判读 |
|---|---|
| 🟡 `implemented/architecture/2026-09-02-system-prompt-as-surface-node` | **system prompt 成为 surface node 0**（`system/message` 事件），与普通消息同构 |
| 🟡 `implemented/feature/2026-09-02-in-history-system-prompt-replacement` | 提示词变化时**追加新的 system 节点**而非替换，以保住 provider prefix cache（`SystemPromptUpdate = 'in-history'`） |
| 🟡 `implemented/bug-fix/2026-09-06-environment-prompt-suffix` | **环境事实（本机 URL / checkout 路径 / cwd）后置**到可复用指令之后，避免 prompt 前段发散、毁掉缓存 |
| 🟡 `implemented/bug-fix/2026-09-03-resume-headers-do-not-repeat-system-prompts` | 同内容的 resume header 不再重复显示 system prompt |
| 🟡 `implemented/bug-fix/2026-09-05-session-reference-model-budget` | 跨会话引用预算从固定 64KiB 改为**模型相对**：`max(65536, floor(contextWindow × 4 × fraction))` |
| 🟡 `implemented/bug-fix/2026-09-05-session-reference-spill-reuse` | 截断的引用复用 spill 存储，给出准确缺失说明 |
| ⚪ `implemented/simplification/2026-09-06-agent-request-freeze-provenance` | 循环内证明过的 `Message` 才复用 deepFreeze |

### B7 模型 / LLM 适配（⚪ 参考，5 篇）

`implemented/bug-fix/2026-09-05-pi-ai-upgrade-compatibility`（pi-ai 0.85.1 字段分档）／`implemented/bug-fix/2026-09-07-pi-ai-settings-catalog-recovery`（catalog 变化后可修复的 settings）／`archived/architecture/2026-09-02-protocol-specific-model-listing-discovery`（按协议读模型清单：OpenAI `/models`、Anthropic `/v1/models?limit=1000` 不跟 `has_more`）／`archived/architecture/2026-09-01-streamed-tool-call-identity`（空 delta 不得抹掉 tool-call 身份）／`proposed/process/2026-08-27-port-tool-owned-render`（**唯一一篇 proposed**；把社区 `dsh-tool-owned-render` 原型移植到现行 API）

### B8 Subagent / Team / Goal（⚪ 机制参考，5 篇）

`implemented/architecture/2026-09-01-parent-owned-subagent-catalog`（父会话的 `subagent/catalog` 事件是子会话发现的**权威**）／`implemented/feature/2026-08-27-continuable-subagent-human-inbox-control`（可续子 agent 暴露普通 human inbox 控制，queue/steer 复用同一通道）／`archived/simplification/2026-08-30-team-send-message-steer`（Team 统一成一个 `send_message` + Steer）／`implemented/bug-fix/2026-09-03-user-owned-goal-pause-activation`、`archived/bug-fix/2026-09-01-host-goal-pause-aborts-turn`（人工暂停 goal 必须真的打断在跑的那轮）

### B9 Agent 运行时身份（🟡 闭合 10.2 的链，1 篇）

| 笔记 | 判读 |
|---|---|
| 🟡 `implemented/architecture/2026-08-31-explicit-agent-runtime-identity` | `AgentSetup` 收 `(agentCtx, agent)`；创建/恢复选项带 `parentAgent`；scoped 事件在 payload 里带 Agent；`agent.ctx` 只管注册与生命周期、**不再暴露反向 Agent 属性**。⇒ **解释了 10.2 观察到的 `AgentSetup` 签名变化，ACP 里已落地（A6）** |

### B10 客户端 UI · 右侧栏 · 插件面（⚪ 若做客户端插件则参考，38 篇）

**右侧栏 docking 体系（10）**：`2026-09-04-right-sidebar-docking-infrastructure`（拆窗/标签/浮层 + 可撤销操作序列，`ui-dockkit` 引擎，取代 Detail 面板）／`2026-09-05-sidebar-tab-types-and-navigation`（`ctx.sidebarRightTabs` 静态注册 + keyed slot + `useTabInfo()`）／`2026-09-05-sidebar-text-preview-and-file-tree`／`2026-09-07-sidebar-responsive-tab-info`／`2026-09-08-sidebar-default-pages`（**0 个 entry→guide，1 个→该页，多个→guide**）／`2026-09-08-sidebar-last-tab-close-rules`（guide 独占时不可关，其余独标签跟整列一起关）／`2026-09-09-sidebar-and-preview-interaction-polish`／`2026-09-10-guide-start-page-and-stat-pill-refinements`／`2026-09-08-global-main-panels`（根级 keyed `main` slot + `sidebar.panellist`，**默认不加任何导航控件**）

**UI 细节 / 交互（16）**：`2026-09-04-web-clickable-link-styles`（统一链接语汇 + `--dsw-alias-link`）／`2026-09-07-composer-session-stats-pills`（`StatsLine`→`StatsPills`，两个图标胶囊 + 弹窗）／`2026-09-05-busy-send-button-follows-enter-setting`／`2026-09-05-nested-terminal-cards`（`parentCallId` 不再一律拒绝）／`2026-09-09-composer-placeholder-whitespace`／`2026-09-07-pinned-scroll-delivery-before-layout`／`2026-09-08-stable-room-reading-under-hidden-split-controls`／`2026-09-05-continuous-client-recovery`（**Host 恢复后持续重连**）／`2026-09-04-session-open-performance-gate` 之外的 `2026-09-06-frontend-performance-budgets`／`2026-09-05-shared-client-control-primitives`（第二个包要用到的控件必须放 `ui-primitives`）／`2026-09-08-shared-file-type-icons`（`classifyFileType` 封闭联合）

**其余 UI（12）**：`2026-08-25-electron-desktop-packaging-and-updates`（**见 A4**）／`2026-09-03-fully-qualified-workspace-paths`（workspace 路径必须完全限定；拒绝 `C:work`、`\\work` 这类拼法）／`2026-08-31-win32-picker-path-string-read`／`2026-09-07-win32-picker-foreground-alt-key`／`2026-09-05-patch-plugin-file-urls`／`2026-09-07-typert-package-local-forwarding-imports`／`2026-09-05-package-manifest-types`／`2026-09-03-root-marker-metadata-failures`（只有 `ENOENT`/`ENOTDIR` 才继续往上找，权限/IO 错误必须原样抛）／`2026-09-03-normalized-unread-fs-tool-diagnostic`（`FS_NOT_OBSERVED` 统一措辞）／`2026-09-07-file-content-scan`／`2026-08-25-promote-open-anywhere-plugin`（**社区→官方先例**）／`2026-08-20-tool-card-image-results`（`read_image` 加 `output.presentationMeta` 只存 path）

### B11 工程流程 · CI · 测试（⚪ 上游成熟度信号，20 篇）

`process/`：`2026-08-28-ci-node-compile-cache-data-disk`／`2026-09-02-project-local-issue-planning-fields`／`2026-09-03-semantic-issue-templates-and-policy`／`2026-09-06-master-only-platform-ci`／`2026-09-06-node-compatibility-selfhosted`／`2026-09-06-preview-hosted-runner-sizing`／`2026-09-06-python-runtime-windows-hosted`／`2026-09-06-release-rehearsal-selfhosted`／`2026-09-08-browser-third-party-build-inputs`／`2026-09-08-playwright-video-gif`／`2026-09-09-cancel-superseded-ci`／⭐`2026-09-06-evidence-driven-performance-skill`（**见 A9.4**）／`2026-09-09-blocked-weighted-approvals-remain-pending`（被阻塞的加权审批保持 pending）
`testing/`：`2026-09-06-pr-ci-runner-temporary-storage`／`2026-09-06-python-runtime-install-retry`／`2026-09-06-standard-hosted-benchmark-runner`／`2026-09-07-publint-test-subprocess-lifetime`／`2026-09-07-pwsh-ci-observable-completion`（**PowerShell 静默≠命令结束**）／`2026-09-07-subagent-teardown-test-budgets`／`2026-09-08-ci-completion-observations`／`2026-09-08-ci-readiness-and-completion`／`2026-09-09-user-patch-hmr-test-delivery`
`archived/process`：`2026-08-28-test-temp-dir-self-cleanup`
`simplification`：`2026-09-05-base-default-file-editor`（**见 A3**）／`2026-09-03-minimal-profiles-persistent-shell-only`（**见 A3**）

---

## C. 待老大裁定项

1. **A1 的推论**：既然「哲学变身」已在 015 发生，那么「等第一个 stable 才对齐产品哲学」这个理由**失去支点**——是否据此收敛「要不要等」的纠结？
2. **A2 的后果**：3.2 的实验设计要不要**按 015 重写**（012 版结论在 015 上不复现）。这直接决定「挪」之后 3.2 的工作量。
3. **A5 的后果**：2.3.4 在迁移后是否从「自做」降为「承接」？若降，`product-positioning.md` 的能力树要动。
4. **常设机制**：是否照 A4/A5 的口径，给 `product-positioning.md` 每条「因 DSH 没有故自做」补一列 **〈对手侧状态 + 依赖版本〉**，并把本稿的扫描方法固定为「每次基线更新重扫」的动作？

---

## D. 证据与边界（诚实清单）

**已用代码/源码复核**（硬）：AGENTS.md 两版全文差异；`docs/session-format-status.md` 两版存在性；`packages/identity`、`packages/acp` 的 `diff --stat`；`lease.ts` / `win32.ts` / `native/system` / `packages/client/file-upload` / `packages/util/http-proxy` 两版存在性；`lease.ts` 源码逐条；ACP `src/` diff 内容。

**只有笔记自述、未独立复核**（软）：110 篇中除上述外的机制描述（如 OTel 授权范围、`/api/file` 的具体上限、Stage API 的性能数字）。**引用进 docs 前须按需复验。**

**未验**：① 015 的 ACP 是否真的仍缺 `fork`/`load`/`delete`（读 diff 未见新增 ≠ 实测）；② 015 的 `sandbox-local` 在 Windows 上的方言行为；③ 2.3.4 承接路径的可行性（我们尚未读 `file-upload` 的 Host 侧实现）；④ `docs/` 根级其它文件（除 AGENTS.md / SAFETY.md）的差异未查。
