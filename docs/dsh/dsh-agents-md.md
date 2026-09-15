# DSH 上游 AGENTS.md（参考件 + 判读）

> 产出：WB ｜ 2026-09-15
> 性质：**参考件**（本区永久保留）。⚠️ **上游原件随基线版本漂移 —— 引用必须带版本号。**
> 上游版本：`dsh-v0.1.5-rc.2` ｜ 规模：155 行 / 1950 词 / 16.6 KB
> 取法：`git -C ref/dsh-bare show <tag>:AGENTS.md`
> 关联：`dsh-015-notes-scan.md` §A1（该次扫描的命中记录）、`dsh-migration.md` §3.4（pre-stable 破坏性表述需拆分）

---

## 0. 为什么单独留一份

三条理由，缺一条都不值得单开文档：

1. **它是产品哲学的正式载体**。0.1.5 那次「从发布前随便破坏 → 已发布数据不可破坏」的转向，落点就在这份文件的一行标题 + 三行正文。要看上游的产品哲学，这里是第一手，不用等 stable。
2. **它同时是产品机制，不只是文档**。DSH 运行时会读工作目录里的 `AGENTS.md` 注入模型上下文（`packages/context/agent-instructions`）——即「项目级指令」在 DSH 里是**已实现能力**。
3. **它卡在 doc budget 上限、被高频维护**。`scripts/doc-budgets.manifest.json` 里 `"AGENTS.md": 1950`，而实测就是 1950 词 —— **零余量**。git log 里密集出现 `Keep root instructions within budget` / `Condense ... to fit the AGENTS.md word ceiling`。⇒ 它**随时可能被压缩改写**，无版本号的引用等于没有引用。

---

## 1. 一句话定位

`AGENTS.md` 开篇第一句就是它的自我定义：

> DeepSeek Harness is an all-plugin Cordis agent harness. Read [docs/architecture.md](docs/architecture.md) before changing `packages/`; follow [docs/AGENTS.md](docs/AGENTS.md) for documentation.

**它不是 README**（那是对外介绍），**也不是 CONTRIBUTING**（那是贡献流程）。它通篇是**约束句**——「改 `packages/` 前必须先读什么」「什么必须走 `ctx.effect()`」「什么情况下必须拒绝启动」。**它是给 AI agent 看的"工作宪法"。**

`CLAUDE.md` 是它的**符号链接**（根目录、`packages/`、`vendor/`、`.agents/notes/implemented/` 各一份）。原文的 `## Editing these instructions` 节写得很直白：

> `CLAUDE.md` symlinks `AGENTS.md` at root and `packages/`; **edit the real file**.

⇒ 不同厂商 harness 读的是同一份文件，不存在「Claude 版」和「通用版」的分叉。

---

## 2. 两副面孔

同一个文件，两条完全不同的读取路径。我们之前只盘了左边那条。

| | 身份一 · 工程契约 | 身份二 · 产品机制 |
|---|---|---|
| 读的人 | 人 / AI 直接阅读 | DSH 运行时自动加载 |
| 载体 | **18 份**实体 `AGENTS.md`（根 + 17 个子目录位置）+ 4 个 `CLAUDE.md` 符号链接 | `packages/context/agent-instructions` |
| 作用 | 约束「怎么改这个仓库」 | 约束「agent 在用户工作区里怎么干活」 |
| 是否上云/进日志 | 否 | **是**（进会话日志，可重放可压缩） |

分层文件清单（015 实测，`ls-tree`；下 16 个位置共 18 份实体文件）：

```
根                        AGENTS.md  (+ CLAUDE.md 符号链接)
.agents/notes/            AGENTS.md  (另在 archived/ 与 implemented/ 各一份)
.github/                  AGENTS.md
apps/cli/tests/profiles/  AGENTS.md
benchmarks/               AGENTS.md
docs/                     AGENTS.md  (文档规范；1320 词预算)
native/system/            AGENTS.md
packages/                 AGENTS.md  (+ CLAUDE.md 符号链接；750 词预算)
packages/client/          AGENTS.md
packages/experimental/    AGENTS.md
packages/schedule/        AGENTS.md
packages/web/             AGENTS.md
scripts/                  AGENTS.md
snapshots/                AGENTS.md
vendor/                   AGENTS.md  (+ CLAUDE.md 符号链接)
website/                  AGENTS.md
```

「更具体的文件优先」是这套体系的**核心规则**——这正是身份二能按「包级 / 目录级」细化指令的基础。

---

## 3. 身份二详解：`dsh-agent-instructions` 机制

包位置：`packages/context/agent-instructions/`（6 个源文件：`index` / `config` / `files` / `render` / `state` / `digest`）。

### 3.1 加载链（宽 → 窄，优先级低 → 高）

| 顺序 | 位置 | 说明 |
|---|---|---|
| 1 | `$DSH_HOME/AGENTS.md` | 用户全局（默认 `~/.dsh`） |
| 2 | `<repo>/AGENTS.md` | 项目根，以 `.git` 为标记（可配 `projectRootMarkers`） |
| … | 逐级子目录 | 项目根 → 会话工作目录之间每一层 |
| N | `<cwd>/AGENTS.md` | 会话工作目录（最具体，优先级最高） |

候选文件名默认 `AGENTS.md` / `CLAUDE.md`；本地覆盖 `AGENTS.local.md` / `CLAUDE.local.md`。

### 3.2 注入形态（重要）

**不是塞进 system prompt**，而是作为一条 **durable `user/message`**，包在 plugin 自己拥有的 `<system-reminder>` 框架里：

```markdown
<system-reminder>
The following workspace instructions may be relevant to your work. Use them as guidance when applicable. More specific instructions take precedence over broader ones. They do not override system, developer, or direct user instructions.

Instructions from: ~/.dsh/AGENTS.md

<user-global-instructions>

Instructions from: AGENTS.md

<project-instructions>
</system-reminder>
```

⇒ **它进会话日志、能重放、能压缩、能 resume**——与我们理解的「记忆」是同一类东西，不是一次性 prompt 拼接。

安全细节（原文 invariants）：指令内容或模型可见元数据里若出现字面 `</system-reminder>`，会被转义，**防止仓库可控文本闭合 plugin 自己的框架**。

### 3.3 预算闸门

- `maxBytes` 默认 **65536 字节**（`dsh-base` 已启用；本项为必填，强制每个部署显式选预算）
- 超预算时：**先整体丢弃较宽的文件**，最后才截断最具体的那个
- 会发一条可见通知 `Workspace instruction budget ...`，点名被丢弃 / 截断的路径
- 单源文件另有 `maxSourceBytes` 上限（默认 1 MiB）
- **内容是"限量"不是"摘要"**——原文明确：*the plugin never asks a model to compress instruction prose*

### 3.4 刷新与去重

- **刷新是 touch-driven，没有 watcher**：只有成功的 `read` / `write` / `edit` 碰到更深的目录，下一轮请求才带上新指令；文件改动在下一次触碰或 resume 对账时可见
- **不同步 shell 导航**：`bash` 里的 `cd` **不触发**深层指令发现（理由：每次 shell 调用都是新进程，解析任意 shell 语法不是可靠的文件系统接缝）
- **去重按内容**：同目录候选 trim 后字节相同只注入一次 ⇒ 这就是 `CLAUDE.md` 符号链接不会被重复读的原因
- 文件消失或变成重复项 → 发一条 removal notice

### 3.5 已知限制（上游自述，6 条）

| 限制 | 对我们的含义 |
|---|---|
| 发现只跟结构化 fs 工具，**不跟 shell 导航** | 靠 shell 切目录的工作流拿不到深层指令 |
| **无 watcher**，touch-driven | 外部改文件不会即时生效 |
| 候选语义**故意极小**：不认小写名、不认 `.claude/rules/`、不认 `@path` import | 想要扩展得改配置候选人，不是"它应该支持" |
| 去重**按内容**：真副本漂移了会**整份**一起加载 | 分叉的 CLAUDE.md 会双倍占用预算 |
| **符号链接跨信任边界**：最终组件是 symlink 时会被跟随 | ⚠️ 克隆来的仓库可把仓库外文件变成"工作区指令"；官方缓解 = `ctx.fs` 策略门禁或 OS 沙箱 |
| 内容**只限量不摘要** | 超预算就是丢，不会智能压缩 |

> 第 5 条对我们的「会话级作用域（沙盒）」是现成的功能位。

### 3.6 ⭐ 该包在 012 → 015 之间的实际改动

| 文件 | 改动量 | 内容 |
|---|---|---|
| `src/files.ts` | 21 行 | 兑现 012 源码里的 `TODO(root-marker-unavailable)` |
| `tests/agent-instructions.spec.ts` | 422 行 | 测试同步 |
| `README.md` / `.zh.md` / `i18n.yaml` / `package.json` | 小 | 文档与依赖 |

**改动实质**：012 里标记探测失败时**静默 `return false`**（会向上找到祖先项目）；015 改为**抛错**（仅 `ENOENT` / `ENOTDIR` / `FS_NOT_FOUND` 才算"不存在"）。

⇒ **这是「上游自己写在源码里的 TODO 被真的还掉」的实证**，也是〈上游欠账表〉的支点之一（见 `dsh-015-upstream-inventory.md` 表 A2）。⚠️ 但**它只是欠账的一小部分**——主表是 README 的 `## Known Limitations and Deferred Work`（1048 条），详见该文 A4 的方法论订正。

---

## 4. 文档八节

| 节 | 内容 | 性质 |
|---|---|---|
| 一句话定位 | all-plugin Cordis agent harness | 自我定义 |
| **Pre-stable APIs and released Session data** | 哲学转向的落点 | 🔴 契约 |
| Repository layout | ~40 个包组的完整地图 | 能力面 |
| Commands | 20 条命令 + 本地检查纪律 + sandbox 失败重试规则 | 工作流 |
| Secrets / .env | 凭据纪律（含 `!!js` 允许、`!js` 禁止） | 边界 |
| **Conventions** | ~40 条工程规则 | 宪法主体 |
| Defensive patterns | 指向 `docs/defensive-patterns.md` | 引用 |
| Type safety and documentation | `strict: true` + JSDoc 门禁 + 措辞标准 | 引用 |
| Editing these instructions | 自身维护规则（预算、condense 优先） | 元规则 |
| Vendoring policy | `vendor/` 是 pinned 源码副本 | 政策 |

**Conventions 里几条值得单独记**（对我们有借鉴价值的）：

- **Registrations are effects**：一切贡献走 `ctx.effect()` / `ctx.on()`，`register()` 返回 disposer
- **Model-visible ⟺ logged**：任何能到达模型请求的东西必须能从会话日志重建；新增模型可见输入必须配套 session event —— **这是 DSH 的"最高指导原则"**，0.1.5 之前的提交信息里直接称其为 `the governing principle`
- **Plugins, not loop changes**：新行为走已文档化的扩展点；改 `agent-loop` 必须同步改 `docs/architecture.md`
- **A capability seam comprises Service Definition / Service Provider / Consumer** —— 完整能力接缝必须是三角色，**从不只有一个角色**。⚠️ 这一条对第 3 条「能力树重议」有直接方法论价值
- **Prefer maintained dependencies over hand-rolling**（当它确实能删掉自有代码与测试时）
- **No hardcoded tunables in plugins**：随部署变化的取值必须是可校验的 `Config` 字段
- **Misconfiguration fails loud**：自包含时加载即失败，否则在最早期可解析点失败，**绝不静默跳过缺失引用**
- **Non-trivial changes MUST include an Agent Note in the same PR** —— 这就是那 110 篇笔记的制度来源
- **Archived notes are frozen**: never edit or treat them as current authority
- **`TODO` 标记体系**：`FIXME` / `TODO` / `XXX` **按紧急度区分**（语义见 `docs/development.md`）

---

## 5. 版本对照：012 → 015 的 diff（36 行，三类）

### 5.1 🔴 哲学章节（分水岭）

| | 0.1.2-rc.1 | 0.1.5-rc.2 |
|---|---|---|
| 标题 | `Pre-release stance: foundation over blast radius` | `Pre-stable APIs and released Session data` |
| 正文 | **Remove at the first tagged release.** Until then, prefer correct foundations to compatibility shims: rename or repackage freely and update every reference. Backends **reject old on-disk formats**. SQLite uses monotonic `SCHEMA_VERSION`; `dsh-session` keeps `SESSION_FORMAT_VERSION` at `0` **with no compatibility promise**. | Public APIs are pre-stable; update every consumer. [Session version/status](docs/session-format-status.md) defines the authorities. [Adjacent migration](.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md) may add a version-named successor but **never move, overwrite, or delete committed generations**; predecessors imply **neither fallback nor downgrade support**. SQLite uses monotonic `SCHEMA_VERSION`. |

⇒ **关键**：文件里从此**直接引用**那篇迁移笔记 —— 笔记已升格为官方治理文件的一部分。

### 5.2 🟡 `experimental/` 口径

```
-  experimental/ private prototypes excluded from official releases
+  experimental/ pre-stable prototypes; private by default with explicit public exceptions
```

### 5.3 ⚪ 布局三小改（机械）

- `native/` 改名：`@deepseek-ai/node-addon-landlock-run` → `@deepseek-ai/node-addon-system`
- 新增 `benchmarks/  performance gates`
- `python/` / `scripts/` 描述微调

---

## 6. 与 LarryAgent 的关系

### 6.1 对基线决策（已采纳：挪 `0.1.5-rc.2`）

哲学转向的载体 = **AGENTS.md 一行 + `docs/session-format-status.md`（015 新增）+ 一篇 implemented 笔记**，三件全部在 **rc 阶段**落盘。

配套治理文档里有一句直接判了我们之前的纠结：

> An alpha, beta, or release-candidate product publication **establishes released Session-format obligations**. GitHub's prerelease flag **does not make persisted user data disposable**. A missing release record is not evidence of non-publication.

且 release record 写着 `latestReleasedVersion: 3` / `evidenceTag: dsh-v0.1.5-alpha.1`，其门禁规则是 **never lower it on the development trunk** ⇒ **格式义务是单向棘轮，只会往上加**。

### 6.2 对能力树重议

- DSH 的 `Repository layout`（~40 包组）+ `docs/subsystems/`（**53 篇**子系统正式规格）= **现成的对手侧能力面**（清单见 `dsh-015-upstream-inventory.md` 表 B）
- `capability seam = (Service Definition, Service Provider, Consumer) 三角色` 这条约定，**可直接作为我们能力树条目粒度的对照标尺**：我们的每条"自做"是否也构成一个完整接缝？

### 6.3 对「哪些做哪些不做」

- ⭐ **欠账有正式书面形态**：`README` 的 `## Known Limitations and Deferred Work`（**1048 条 / 266 包**，上游规范强制必写）+ 源码 `FIXME/TODO/XXX`（67 条）+ `.agents/notes/proposed/`（20 篇）——**三层，清单见 `dsh-015-upstream-inventory.md` 表 A**
- 「项目级指令」这一块**已由上游实现**，我们不必自造；要做的只是决定"接不接 / 接到什么程度"

---

## 7. 引用须知

1. **必须带版本号**：`0.1.5-rc.2 的 AGENTS.md §Conventions`。原因是 §0 第 3 条（doc budget 零余量 + 高频维护）。
2. **本文件是参考件快照**，不随上游自动更新。基线更新时须重跑：
   ```
   git -C ref/dsh-bare show <new-tag>:AGENTS.md
   git -C ref/dsh-bare diff <old-tag> <new-tag> -- AGENTS.md
   ```
3. **原文全文见附录**，与上游逐字节一致（取法见文首）。

---

## 附录：上游原文全文（`dsh-v0.1.5-rc.2`，155 行）

````markdown
# AGENTS.md

DeepSeek Harness is an all-plugin Cordis agent harness. Read [docs/architecture.md](docs/architecture.md) before changing `packages/`; follow [docs/AGENTS.md](docs/AGENTS.md) for documentation.

## Pre-stable APIs and released Session data

Public APIs are pre-stable; update every consumer. [Session version/status](docs/session-format-status.md) defines the authorities. [Adjacent migration](.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md) may add a version-named successor but never move, overwrite, or delete committed generations; predecessors imply neither fallback nor downgrade support. SQLite uses monotonic `SCHEMA_VERSION`.

**Application launch.** Only `dsh` profiles launch supported Node apps; package bins, demos, and public SDK argv escapes are forbidden ([rule](docs/architecture.md#application-launch)).

## Repository layout

```
vendor/      Vendored Cordis source — manifest + sync procedure in vendor/README.md
packages/    @deepseek-ai/dsh-<pkg> workspaces at packages/<group>/<pkg>/
  core/        product API spine: session, system-prompt, tools, agent, agent-loop
  api/         Remote BFF assembly and Typert RPC gateway
  typert/      type graph generator, loader, and runtime registry
  llm/         LLM capability: Service Definition/Consumer + DeepSeek providers
  e2b/         E2B POC: sandbox + FS/subprocess adapters
  shell/        bash capability: Service Definition + local/pwsh providers + shell Consumers
  subprocess/  subprocess capability + local process-tree provider + shared Win32 library
  terminal/         persistent sessions
  fs/          filesystem capability + policy
  lsp/         language-server capability
  skill/       skill provider registry + local impl + catalog/loader tool
  web/         web capability: Service Definition + search/fetch providers + tool Consumer
  compaction/     compaction capability + basic provider
  context/     request-context plugins
  subagent/    subagent capability: Service Definition + providers + delegation Consumers
  bundle/      installable dsh --profile patch-layer bundles
  workflow/    workflow capability + worker-thread provider + tool Consumer
  webhook/     webhook ingress
  todo/        todo_write tool
  plan/        plan mode as logged state
  preset/      per-session agent composition from preset cordis.yml files
  guard/       loop-hygiene + tool-timeout plugins
  self-modification/  the agent inspects/mounts its own plugins
  hooks/       Claude Code/Codex hook bridges + wire-protocol library
  session/     durable session data: persistence, projection, titles, telemetry
  identity/    anonymous identity
  settings/    user-settings capability + file provider
  credentials/ credential/authorization capabilities + env/.env provider
  acp/         automation-only Agent Client Protocol server
  interaction/ approval/interaction capabilities, permission, commands, ask-user
  boot/        shared profile/application boot glue
  sdk/         JSON-RPC protocol + TypeScript client/server
  experimental/ pre-stable prototypes; private by default with explicit public exceptions
  support/     dev/test infrastructure
  util/        zero-dependency utilities
python/      Python SDK/runtime (see python/README.md)
native/      @deepseek-ai/node-addon-system source of record (see native/README.md)
benchmarks/  performance gates
.agents/     Agent workflows and Agent Notes (`notes/`)
docs/        architecture, generated catalogs, postmortems, cookbook (see docs/AGENTS.md)
scripts/     gates and generators
website/     VitePress projection of selected bilingual docs/ sources
```

Package groups: [packages/README.md](packages/README.md).

## Commands

```sh
pnpm install            # pnpm workspaces, node ^22.19 || >=24
pnpm run clean           # remove build outputs and safe residue from deleted packages
pnpm run test           # unit tests
pnpm run test:coverage  # CI coverage gate: per-file 100% on packages/*/*/src
pnpm run test:e2e       # real-API tests; self-skip without DEEPSEEK_API_KEY
pnpm run test:expected  # owner-local process expectations
pnpm run test:snapshot  # keyless recorded-session replay through shipped profiles; filter: -t <name>
pnpm run test:snapshot:record  # re-record expected outputs (needs key)
pnpm run typecheck
pnpm run lint
pnpm run duplication    # cross-file TypeScript clone detection
pnpm run build          # tsc emits lib/types, tsdown bundles runtime
pnpm run hygiene        # publint + workspace/package/dependency checks + NodeNext consumer check
pnpm run check:windows-wine  # ONLY when diagnosing a known Windows failure (needs wine); CI owns this signal
pnpm run doc-sync       # all documentation gates; leaf list in scripts/run-gates.ts
pnpm run test:docs      # quick documentation checks (no build; doc-quick aggregate)
pnpm run website:build  # VitePress build (doubles as dead-link check)
pnpm dsh --profile headless "task"  # run one task from source (needs DEEPSEEK_API_KEY)
pnpm run demo:ptc -- "task"  # headless PTC mode run (needs key)
```

### Host sandbox failures

If a required `gh`, `pnpm`, build, test, or generator command fails because the sandbox blocks credentials, network, IPC, watching, or nested `sandbox-exec`, retry unchanged with the narrowest host escalation. Require sandbox evidence; never bypass test failures or the product sandbox.

### Run relevant checks locally

Run checks before pushes via [dsh-pre-push-checks](.agents/skills/dsh-pre-push-checks/SKILL.md); report only commands run. After `gh stack sync`, validate immediately; do not merge before checks pass.

- Match evidence to the surface: focused behavior tests, model/user-output snapshots, `doc-sync` for docs, built smokes for published paths, and real-API e2e for providers.
- Never default to the full suite or repeat a passing check for commit or push. CI owns exhaustive coverage and the platform matrix; rehearse all locally only by explicit request, for CI diagnosis, or for an irreducibly repository-wide change.
- `test:coverage`, not `test`, is the CI coverage gate ([why](docs/testing.md)).

## Secrets / .env

Real-API tests and demos read `DEEPSEEK_API_KEY`, optional `DEEPSEEK_BASE_URL`, and root `.env`. cordis.yml allows `!!js` (never `!js`) under plugin `config` and entry `disabled`; other metadata stays literal, so conditional composition also uses overlays ([primer](docs/cordis-primer.md#loader-configuration)). Never commit credentials. CI e2e skips without a key; [testing.md](docs/testing.md) owns key policy.

## Conventions

- Every npm package is `@deepseek-ai/dsh-<name>`; vendored packages are rescoped ([mapping](docs/rescope.md)) and `private: true`. `@deepseek-ai/cordis` is a peerDependency (+ dev) of every harness package.
- ESM everywhere (`"type": "module"`). Use package names across packages and `.ts` in local relative imports. Config subprocesses run built `lib/` under plain Node; source regressions use their declared launcher ([testing policy](docs/testing.md#test-subprocess-launch-modes)). The `dsh` CLI source launch runs through tsx's ESM-only hook (`node --import tsx/esm`); modules it reaches must stay ESM (no CJS-only exports) — Node's native TypeScript modes are unavailable across the engines range ([source-launch contract](.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md)). Raw/Web `cordis.yml` bare plugins must appear in their resolver manifest's `dependencies`; `verify-cordis-config` enforces it.
- **Registrations are effects**: every contribution goes through `ctx.effect()` / `ctx.on()`; a registry's `register()` returns the disposer.
- **Runtime invariants assert owned relationships.** Publish `./invariant` only when independent observations can diverge. Otherwise omit its source and wiring and record why in its README; empty installers and checks of service presence, plugin metadata, effects, or fixed examples are invalid ([package invariant rules](packages/AGENTS.md)).
- **Typed events use declaration merging** and merge-extensible maps. Event JSDoc needs `@mode` and payload `@param`; scoped keys absent from payloads need `@dshScopeScan unsupported`. Public service methods document parameters and non-void returns. `SessionEventMap` members are required-on-read by default — builds that do not know a type refuse the log unless the event carries the envelope's `ignorable: true`; only structural format changes bump `SESSION_FORMAT_VERSION` ([mechanism](.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md)).
- **Switch on discriminant tags.** Closed unions end in `assertNever`; merge-extensible unions fall through a documented default.
- **Waterfall listeners MUST call `next()`** to delegate; returning without it short-circuits the chain ([semantics](docs/cordis-primer.md#cordis-waterfall-semantics)).
- **Model-visible ⟺ logged**: anything that reaches a model request must be reconstructable from the session log; a new model-visible input requires a session event.
- **Plugins, not loop changes**: new behavior goes on documented extension points; changing `agent-loop` requires updating docs/architecture.md.
- **A capability seam comprises Service Definition / Service Provider / Consumer roles.** It is complete, never one role; split only when roles evolve independently ([glossary](docs/glossary.md#capability-seam)).
- **Prefer maintained dependencies over hand-rolling** when they genuinely delete owned code and tests ([policy](.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md)).
- **Explicit > implicit at package boundaries**: defaulting is an explicit `resolve(request): Spec` step in the owning implementation, never a hidden `?? default` inside `run()` (the `dsh-shell` request/spec split is the template).
- **No hardcoded tunables in plugins**: deployment-varying choices are validated `Config` fields changeable from cordis.yml; a `DEFAULT_*` constant or test hook is not configurability. Protocol constants, external specs, and security invariants stay fixed.
- **Misconfiguration fails loud** at load when self-contained, otherwise at the earliest resolvable point; never silently skip a missing referent.
- **Opaque cross-boundary ids are branded** (`Branded<B>` from `dsh-brand`), never bare `string`.
- **Trust TypeScript at typed same-process boundaries.** Do not add runtime validation, fallback behavior, or hostile-input tests solely for values the static interface requires; validate at parser/config, queued, model/tool JSON, durable/file, worker, process, and wire boundaries.
- **Source plane vs artifact plane, never mixed.** Static gates and tests resolve workspace imports through tsconfig `paths` to `src` and pass on a clean tree; gates consuming built `lib/` declare that dependency ([layout](docs/development.md#typescript-project-layout)).
- **Keep compiler faces explicit.** A package with both Host and Client programs exposes face-specific leaf configs and a solution-only root; repo-wide programs seed a face config, never the root solution ([layout](docs/development.md#typescript-project-layout)).
- **An empty `catch` names what it swallows** and why nothing else can reach it; keep the `try` to one statement.
- **Keep comments local.** Do not restate code, explain distant behavior unless locally required, or expand unrelated comments ([rationale](.agents/notes/implemented/process/2026-08-09-concrete-prose-names-actors-and-recorded-facts.md)).
- **Prefer symmetry for parallel values**; unexplained asymmetry usually signals a missed extraction.
- **Tests describe behavior, not correctness.** Change obsolete behavior with its tests; explain why in the PR.
- **Non-trivial changes MUST include an Agent Note in the same PR;** only mechanical/local edits are exempt ([scope](.agents/notes/README.md#when-to-write-one)). Archived notes are frozen: never edit or treat them as current authority ([archive policy](.agents/notes/README.md#archiving-and-deletion)).
- **Client UI copy is locale-owned.** Route product text through typed dictionaries and `t` or localized primitive props; `verify-client-ui-i18n` rejects hardcoded copy ([decision](.agents/notes/implemented/architecture/2026-08-23-locale-owned-client-ui-copy.md)).
- **Testing policy** — [docs/testing.md](docs/testing.md). Every non-trivial model- or product-user-visible change updates a keyless recorded-session snapshot; [snapshot ownership](snapshots/AGENTS.md) reserves the top-level tree for session-driven cases and keeps other expected output owner-local. Fixtures replay on macOS/Linux; fix fixtures, not normalizers.
- **Design each tool's UI presentation up front.** Host presenters stay pure; Web cards derive from raw events and persisted result metadata ([cookbook](docs/cookbook/adding-a-tool.md)).
- **Plan unit, e2e, and snapshot coverage** for capability seams, lifecycle paths, and transcript output; include missing snapshot-harness support in the same change.
- **Both SDKs project the loop.** Agent-loop, session-lifecycle, and `SessionEventMap` changes update the TypeScript and Python SDK expected outputs in the same PR; `pnpm run test` covers neither ([surfaces](docs/testing.md#when-a-snapshot-test-is-required)).
- **Choose PR history deliberately.** Split independent changes and fix the introducing PR before propagation. Standalone/stack branches may merge-forward or rebase. Rewrites use `--force-with-lease`, abort on remote movement, never raw `--force`; preserve an in-progress merge-forward checkpoint before taking a newer base ([rationale](.agents/notes/implemented/process/2026-08-02-native-github-stacks-and-optional-rebases.md)).
- **Labels:** one PR `kind/*`, all material `area/*`, and native Issue Type ([taxonomy](.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md)).
- TODO markers: `FIXME`/`TODO`/`XXX` by urgency ([semantics](docs/development.md)).
- Files end with exactly one trailing newline; `git diff --cached --check` (pre-commit) gates it.

## Defensive patterns

Read [docs/defensive-patterns.md](docs/defensive-patterns.md) before lifecycle, concurrency, subprocess, or teardown work.

## Type safety and documentation

Everything compiles under `strict: true` with `noImplicitAny`; every remaining `any` explains why narrowing is infeasible. Every module and export has concise JSDoc for its non-obvious contract; function-like exports include `@param`/`@returns`, as enforced by `verify-export-jsdoc`. Heritage-declared members, plugin-protocol slots, and constructors keep their docs at the declaring Service Definition, protocol, or class.

Comments and docs state complete contracts and context, not reasoning transcripts. Use direct, concrete terms. Do not use metaphors. Before writing `contract`, `boundary`, or `shape`, ask whether a more exact term names the subject: write `response fields`, `JSON validation`, or `ESM exports` instead of `response shape`, `validation boundary`, or `module shape`. Keep `contract` for preconditions, postconditions, invariants, compatibility promises, and other obligations that callers, callees, implementers, providers, producers, or consumers rely on. Keep a literal process, wire, security, transaction, or lifecycle boundary. Do not narrate control flow or tests, preserve review history, or restate code. Keep behavior, failure, timing, ownership, and safe-use facts; link the rationale. Use [dsh-prose-standard](.agents/skills/dsh-prose-standard/SKILL.md) for decisions. Wire mechanically checkable invariants into an executed top-level gate and prove each changed acceptance path rejects an invalid case. Use narrow, justified exceptions instead of disabling a rule globally.

Docs accompany every code change: update affected README and JSDoc contracts together. Routine bilingual work follows [docs/AGENTS.md](docs/AGENTS.md); only explicit user invocation may run `dsh-translate-docs`. Current-state prose, one physical line per paragraph, one home per fact, and word budgets live there.

## Editing these instructions

`CLAUDE.md` symlinks `AGENTS.md` at root and `packages/`; edit the real file. Keep each rule self-contained while linking high-level docs. Condense when clarity survives; raise a `verify-doc-budgets` ceiling when the required content genuinely needs more space.

## Vendoring policy

`vendor/` packages are pinned source copies (manifest with upstream SHAs in [vendor/README.md](vendor/README.md)). Update via the sync procedure there; re-apply or retire the logged local modifications; rerun `pnpm run test && pnpm run build`.
````
