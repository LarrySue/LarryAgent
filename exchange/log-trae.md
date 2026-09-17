# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.2** · 首验：跨进程 resume 的 id collision 定性 | Trae | **CVM** | ✅ **已回报（2026-09-17）** · 结论 = 真缺口（非姿势问题） | 2026-09-17 |
| **DSH-3.7.1** · 前置就位与定性（方言修复件） | Trae | **本机 Windows** | ✅ **已回报（2026-09-17）** · ①归因不成立／②实体装成／③凭据层=env；**暴露 3.7.2 岔口待裁** | 2026-09-17 |

- 两块**互不依赖**（= 原批次 1 的分组），**先做哪块都行**；**建议 3.2 先**（CVM **10-09 到期**，且它是 2.4.1 / 2.8.2 承接叙事的前置）。
- ⚠️ **DSH-3.7.2（落盘 ＋ 自检 ＋ 真 e2e）本区未派** —— 等 3.7.1 回报后起跑，**别自行往下做**。
- ⚠️ **DSH-3.2.1（Windows 侧 named semaphore 释放实测）本区未派** —— 同上。
- 任务清单与进度以 `TODO.md`「DSH-3」区为准（一处两面）；本区只放**怎么做**。

---

## 📮 DSH-3.2 派发稿 · 首验：跨进程 resume 的 id collision 定性

**场地** = CVM ｜ **执行人** = Trae ｜ **前置** = 无（3.0 已收口、3.1 已交付）

### 0 · 目标

把「跨进程 resume 的 `id collision`」**定性**：是 **SDK 缺口**（根本没有 resume 入口）、**姿势问题**（探针用固定 ID 所致）、**还是两者同时存在**（两个独立的 bug）。

> ⚠️ **两件事不可混报**：「固定 ID 撞车 ⇒ 换个 ID 就好」与「同 ID 复用被系统性拒绝」是**两回事**。定论前不得只报其中一支。

### 1 · 四项判据（逐条给证据，缺一条即未闭合）

**① 对照组 0 — 源码侧：SDK 有没有显式 resume 入口**

- 对象 = **已安装产物**（`$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-sdk-client/`），**不是** GitHub master
- 结论二选一（**有** / **没有**）：说"有"给 **文件:行 ＋ 签名**；说"没有"**必须附检索式与遍历范围**（否则不可验）
- ⚠️ **两套 SDK 分开判、结论不得互推**：TS（`dsh-sdk-client`）与 Python 是**两条通道**。原观察出在 **Python SDK 的 `start_session(session_id)`**，而我方**产品路径是 TS**（S0 已定走 `sdk` 面）⇒ 两条都写、**每条标明出自哪套**
- 参考件 `docs/implementation-spec.md` §3.2 的签名（`sessionPersistence.create/append/load/inspect/readFrom/locate`、`ctx.sessions.create(id, { seed })`）**锚在 harness master `47f9438`** ⇒ **只作检索线索，须在 015 实物上复核**

**② 反向组 — 固定 ID 复现 collision**

- 固定 session id 跑两次、**跨进程**（两个 dsh runtime 进程，同一 home）⇒ 复现 `id collision` 或等价错误
- **记原文**：错误码 ＋ 文案 ＋ **出自哪一层**（SDK 客户端 / runtime / persistence）

**③ 正向组 — 每次新 UUID**

- 两次都成功（`turn/end.reason.kind === 'completed'`）
- 这一组的价值是**给 ② 当对照**（同时反证环境 ＋ 凭据都活着）

**④ 关键组 — 真实 completed 会话、跨进程复用同 ID**

- 先跑一次真会话拿到 `completed` 并落盘，**再用同一 ID 起第二个进程**
- ⭐ **这是唯一能区分「姿势问题」与「真缺口」的对照**：若固定 ID 只在"从未存在过"时撞车、而对**已存在的真会话**能 resume ⇒ **姿势问题**；若对后者也拒 ⇒ **真缺口**

### 2 · 判据前置：先分清"两把锁"（**必做，否则会得到假阴性**）

- **A 锁** = `$DSH_HOME/profiles/node_modules.lock`（`dsh-atomic-write`，profile 装/修复时持有，**持有者死亡后永不回收**）
  症状 = 任何 dsh 命令启动即 `atomic-write: timed out waiting for the writer lock`，**默认只等 2 s** ⇒ **极易误判成"启动慢 / 网络问题"**
- **B 锁** = 015 的 session 写租约（`session-persistence-jsonl/lease.ts`：POSIX `flock(2)`，**进程死亡即内核释放**、**故意不做 TTL 抢占**）
  症状 = 第二个写者收 `SessionAlreadyOwnedError`
- ⚠️ 报告里凡"锁残留"**必须标是哪一把**（两把语义相反、表现不同）
- ⚠️ **开跑前先确认 A 锁无孤儿**；有则**停手报错**，按"重命名备份"处置（**禁 `rm -f`**——活跃锁被误删会制造真实并发故障）
- 📖 机制与实测：`docs/dsh/dsh-migration.md` §3.6〈锁争用矩阵〉＋ `docs/local-env.md` 的本机锁原文与实测

### 3 · 交付物

- `harness/tests/s0-resume.test.ts` ＋ `harness/scripts/run-s0-resume.mjs` —— ⚠️ **照 3.1 那对的骨架抄，不另造**：变体开关、退出码 `0` 通过 / `1` 测试失败 / `2` 前置缺失 / `124` 看门狗超时、证据目录 `S0_EVIDENCE_DIR`、**构建前置检查（只检查、不自动 build）**
- ⚠️ **复用 3.1 的会话构造法**（`tests/s0-e2e.test.ts` ／ `tests/s0-session-log.ts` 的多帧 zstd 回读 ／ 临时 home 建法）
  ⚠️ **不要求**复用 3.1 那次的**会话实体** —— 其 temp home 已随 3.1 收口清理（实体不在了）
- 证据（命令 ／ 退出码 ／ 关键输出片段）落证据目录，随回报逐条列出

### 4 · 参考件（四要素 —— 照抄 `docs/dsh/dsh-migration.md` §2.2.2）

`ref/community/EvilIrving__dsh-repro/`（**已落位 2026-09-17**，MIT，浅克隆 HEAD `e51736ba`）

- ① **路径**：本地就是上面这个目录；上游 `https://github.com/EvilIrving/dsh-repro`
- ② **怎么参考**：读 `docs/implementation-spec.md`（§3.1 挂点表 / §3.2 精确签名 / §3.4 关键约束）＋ `src/scrub.ts`。**不要跑它**（它是插件、要装进 profile 才有用）
- ③ **参考程度**：**只借鉴形态**（复现件的构成：会话日志采集 ／ 失败命令 ／ git diff ／ 版本号）；`src/scrub.ts` 的**脱敏规则集**可抄形状
- ④ **不可参考**：
  - 签名与行号锚在 harness **master `47f9438`**，我方基线是 **`0.1.5-rc.2`** ⇒ **用前须在 015 实物上复核**，勿把 master 行号当 015 事实
  - 它是**插件**（`/repro` slash 命令），**不是测试装置** ⇒ **别把它的插件骨架搬进 `harness/`**
  - `lib/` 与 `pnpm-lock.yaml` 是构建产物 / 锁文件，**勿读勿评**
  - 不可 `dsh plugin add` 直装（§3.0「只借鉴不直装」）
- ✅ **用完回填一行「借鉴点」** → 登记表 3.2 行（或直接告诉我，我来写）

### 5 · 场地器材（CVM）

- 通道：走你自己的 ssh 通道；`export PATH=$HOME/node/bin:$PATH`；dsh CLI = `~/harness/node_modules/.bin/dsh`（`0.1.5-rc.2`）
- ⚠️ 改了 `harness/` 后**先构建**：`cd harness && pnpm --filter "./packages/*" run build`（根 `build` 已覆盖 `./packages/*`；`run-s0-e2e.mjs` **只检查不自动 build**，缺产物退 `2`）
- ⚠️ **CVM 无完整仓库** ⇒ 走 vitest 系 e2e 时须显式指 profile 源：`DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles`
- home：**用临时 home**（同 3.1 的 `/tmp/larry-s0-*` 建法）；⚠️ **不得改写 `~/.dsh/profiles/sdk`**（那是源 profile）
- key：CVM `~/.dsh/.credentials.yaml` 已有且**已被证成"文件层真被读"**（3.0 D1）。复跑方便可走 `harness/scripts/s0-run-with-file-key.mjs`（**文件 → 环境变量的一次性桥**，只打印长度、不打印值）
- 🔴 **key 值不得落任何文件 / 日志 / 工具输出**

### 6 · 回报格式

1. **结论先行**：定性 = SDK 缺口 ／ 姿势问题 ／ 两者皆有（**一句话**）
2. **①–④ 逐条证据**：命令 ＋ 退出码 ＋ 关键输出片段（**别只写"我跑通了"**）
3. **锁归属**：凡涉及"锁"，标 A / B
4. **未闭合项**单列 ＋ 你的下一步判断
5. **自曝**：跑歪了 / 判据要订正 / 发现矛盾 —— **直接写**，别包装成"通过"

### 7 · 禁区

- ⛔ 不改 `~/.dsh/profiles/sdk`（源 profile）、不改 `harness/package.json` / `pnpm-lock.yaml`
- ⛔ **不用 `timeout` 强杀正在装依赖的 dsh**（会留 A 锁）
- ⛔ 清锁一律"**重命名备份**"，**禁 `rm -f`**
- ⛔ 不落 key；不把 key 打进工具输出
- ⚠️ **别把 `exit 0` 单独当判据** —— 已证假绿源（空壳 home 探针 / `--dump-config` 同族）

---

# ✅ DSH-3.2 回报 · 跨进程 resume 的 id collision 定性（Trae 2026-09-17）

## 1 · 结论先行（一句话）

**真缺口 —— 且不是姿势问题**：对**框架自产、已真 `completed` 并落盘**的会话（④），第二个进程复用同 ID **一样被拒**；缺口在 **runtime 的 session 物化路径**（`session/prompt` 对"日志已在盘上"的 id 走 **create**，而 jsonl 后端自己注明**该走 open**），**不在 SDK 的 API 面** —— 两套 SDK 的"同 ID 入口"**都在**（见 ①）。
⇒ 三条口径里选：**不是「姿势问题」**（换 UUID 只是绕开）、**不是「Python 独有」**、**是「两者皆有」里的第二支被排除后剩下的那支 —— runtime/SDK 集成缺口**。

## 2 · ① 对照组 0 — 源码侧：有没有显式 resume 入口

**结论：两套 SDK 都有「指定 session id」的入口；两套都**没有**名为 `resume` 的 API（grep 均 0 命中）。**
⚠️ 故原文那句「**TS client 亦无显式 resume API（grep 无命中）**」（`docs/dsh/dsh-pysdk-probe-claude.md:157`）**半对半错**：说"没有 resume 字样"为真，说"没有入口 / 没有 API"为**假**。

**TS 半边** —— ⚠️ **派发稿给的路径与实际不符**：`$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-sdk-client/` **在 CVM 上不存在**（该 profile 的 `@deepseek-ai/` 里只有 `dsh-sdk-app` / `-jsonrpc-server` / `-minimal` / `-protocol` 四件 `dsh-sdk-*`）。**TS 客户端是 harness 的工作区依赖** ⇒ 实物 = `harness/node_modules/@deepseek-ai/dsh-sdk-client/`（`0.1.5-rc.2`，与基线同代）。

| 入口 | 位置 | 签名 / 文档原文 |
|---|---|---|
| 高层 | `lib/types/api.d.ts:55`（doc `:52`） | `session(sessionId?: string): HarnessSession` — *"explicit id to reuse; omitted mints a fresh one"* |
| 高层 | `lib/types/api.d.ts:62`＋`:78-83` | `run(input, options?: RunOptions)`；`interface RunOptions { sessionId?: string }` — *"Session id to run on; omitted mints a fresh session per call"* |
| 低层 | `lib/types/client.d.ts:98`（doc `:94`） | `prompt(sessionId: string, contentBlocks): Promise<string>` — *"target session; **an unknown id creates it**"* |

检索式与结果：`grep -rn resume harness/node_modules/@deepseek-ai/dsh-sdk-client/lib/` ⇒ **0 命中**（⇒ 不是"没写文档/漏看"，而是**这个能力不叫 resume**）

**Python 半边**（本轮**新装实物** `deepseek-harness-sdk==0.1.5rc1` 到 `D:\Temp\pysdk-inspect`，源码侧读）

| 入口 | 位置 | 原文 |
|---|---|---|
| 高层 | `deepseek_harness/api.py:120-122` | `def start_session(self, session_id: str | None = None) -> "Session":` → `Session(self, session_id or f"session-{uuid.uuid4().hex}")` |
| 高层 | `deepseek_harness/api.py:124-131` | `def run(self, input, *, session_id=None, on_notification=None)` → `self.start_session(session_id).run(...)` |
| 低层 | `deepseek_harness/client.py:174-180` | `payload = {"sessionId": session_id, "contentBlocks": content_blocks}` |

检索式：`grep -riE 'resume|reuse|existing session|collision' deepseek_harness/` ⇒ **0 命中**（连"复用 / 已存在"的语义说明都没有）
⚠️ 版本注：原观察出自 **0.1.2rc1**；本轮取的是 PyPI 现版 **0.1.5rc1**（与 TS `0.1.5-rc.2` 同代）。**Python 侧本轮只做源码侧，未做真调用复跑**（真跑全部走 TS 通道）。

**运行时侧的 resume 语义（间接证据）**：`dsh-session-persistence-jsonl/README.md:141`（*"A resumed agent pays for retained history…"*）、`:145`（*"A resumed loop can reuse provider cache only when its reconstructed history…match"*）⇒ **框架侧确有 resume 语义**。原文"cold session is resumed on first touch"与本轮 ④ 的报错**不矛盾**：**载入**真发生了，**拒绝**发生在"再建/再触"那一步。

## 3 · ② 反向组 — 固定 ID 跨进程复现

命令（退出码 **0**）：`S0_TARGET_RUNNER=run-s0-resume.mjs node scripts/s0-run-with-file-key.mjs reverse`

| 轮 | 请求 id | 结果 |
|---|---|---|
| p1 | `s0-resume-fixed-0001`（**自选固定串**） | ✅ `ok=true kind=completed`，13 事件，2.79 s；落盘 `…/sessions/<cwd-key>/s0-resume-fixed-0001/session.v3.jsonl.zstd`（11658 B） |
| p2（**新进程**，同 home 同 id） | 同上 | ❌ `JsonRpcResponseError` **code=-32603** ／ `session "s0-resume-fixed-0001" already exists`（1.36 s） |

**层归属**：这是 **runtime 回给客户端的 JSON-RPC error response**（`session/prompt` 的应答），**不是 SDK 客户端本地抛的**；抛出点在 runtime 内部的 session 物化路径（具体见 §6）。
**文案已换代**：015 的原文**不含** 09-08 那版的 `(id collision)` 尾巴（012: `already has a persisted log on disk that does not match this live session (id collision)` → 015: `session "<id>" already exists`）⇒ **拒的行为不变，文案变了**。⚠️ 012 那句原文**在 015 实物上 grep 不到**（`does not match this live` / `already has a persisted log` 均 0 命中）⇒ 它出自 **012 的 SEA 快照 / runtime-bin**，**不可在 015 源码上复核**（未闭合项 3）。

## 4 · ③ 正向组 — 每次新 UUID

命令同上，`forward`（退出码 **0**）
p1 `session-84c0018f5eb24875bcfb719192accb28` → `completed`（2.73 s）／p2 `session-6e22d045617c4a0a8a2b3ef6c9f8291b` → `completed`（4.16 s）
**两条 id 不同**、落成**两条**日志（11815 B / 12004 B，各含各自口令）⇒ 环境 ＋ 凭据 ＋ 落盘**都活着** ⇒ **②/④ 的红灯不是"环境坏了"**（这正是本组的价值）。

## 5 · ④ 关键组 — 真 `completed` 会话跨进程复用同 ID ⭐

命令同上，`key`（退出码 **0**）

| 轮 | 请求 id | 结果 |
|---|---|---|
| p1 | **不传 id**（由框架 mint） | ✅ `session-a676f45cbcc14d78988234e7fb12fbda` → `ok=true kind=completed`，13 事件，3.84 s；落盘 12105 B（含第一轮口令） |
| p2（**新进程**） | `session-a676f45cbcc14d78988234e7fb12fbda` | ❌ `code=-32603` ／ `session "session-a676f45cbcc14d78988234e7fb12fbda" already exists`（1.34 s） |

⇒ ⭐ **对"已存在的真会话"同样拒** ⇒ 按派发稿 §0 的口径 = **真缺口**，**不是"探针用固定 ID 所致"**。

**附加判别器（我加的，见自曝 2）：`same-proc`** —— **同一进程内**同 id 连发两次 ⇒ **两次都 `completed`**，且**写进同一条日志**（12640 B，`hasP1=true && hasP2=true`）⇒ **同进程内是真 resume（续写同一日志）**，缺口**只出现在"换进程"这一态**。
⇒ 这把"哪一层"收窄了：不是"id 不能被复用"，而是"**新进程里拿一个已有日志的 id 去 prompt**"这条路径不通。

## 6 · 抛错点（015 实物的源码侧，两个候选）

两个候选的**文案完全相同** ⇒ **仅凭报错文本无法区分**（如实标为未闭合项 1）：

1. `@deepseek-ai/dsh-session` `lib/index.js:1380` —— `SessionStore.prepare(id, options)`：`if (this.store.has(sessionId)) throw new Error('session "' + sessionId + '" already exists')`；同处 doc（`:1366-1372`）写明 *"@returns the constructed session, **NOT yet in the store**"* ／ *"@throws if a session with `id` already exists"* ⇒ **这是"建新会话"的入口，不是 resume 入口**。
2. `@deepseek-ai/dsh-session-persistence` `lib/index.js:33-41` —— `SessionAlreadyExistsError`：*"**`create`** targeted a Session identity that **already exists in this backend**"*（契约见同包 `lib/types/index.d.ts:106`）。

**旁证（指向缺口本质）**：`dsh-session-persistence-jsonl/lib/index.js:3002` 对**同一情形**用的是**另一句文案** —— `refusing to materialize "<id>": a log already exists on disk (**open it instead**)` ⇒ **后端自己明确提示"该走 open、不该 create"**。与我方观测一致：**resume 的原语（open / load / inspect）在，缺的是把 `session/prompt` 的"日志已在盘上"这一态路由过去**。

## 7 · 锁归属（A / B，必标）

- **A 锁**（`<profiles>/node_modules.lock`）：跑前 `releaseOrphanProfileLock` 查**全局 `~/.dsh/profiles`** 与**临时 home** ⇒ 均 `action=none`；事前 `find ~/.dsh -maxdepth 3 -name '*.lock*'` **为空**。⇒ **全程无 A 锁参与、也未被创建**。
- **B 锁**（jsonl 写租约，POSIX `flock`）：**全程未出现** `SessionAlreadyOwnedError`。原因：每次都 `harness.close()`（EOF→SIGTERM→SIGKILL 阶梯**等到真退出**）后才起下一个进程 ⇒ 租约由内核释放。⇒ **②/④ 的红灯与 B 锁无关**（这条必须写明，否则易被误读成"锁没释放"）。

## 8 · 交付物 / 复跑

| # | 路径 | 说明 |
|---|---|---|
| 1 | `harness/tests/s0-resume.test.ts` | 4 变体装置（`forward` / `reverse` / `key` / `same-proc`），姿态自证在头部；`describe.skipIf(!realApiEnabled())` ⇒ 默认 `npm test` 不受影响 |
| 2 | `harness/scripts/run-s0-resume.mjs` | 一键复跑；退出码 `0` 通过 ／ `1` 测试失败 ／ `2` 前置缺失（**新增「构建前置检查」，只查不 build**）／ `124` 看门狗 |
| 3 | `harness/scripts/s0-run-with-file-key.mjs` | 加 `S0_TARGET_RUNNER`（**默认值不变，向后兼容**） |

复跑（一条，含全部环境变量）：

```bash
cd ~/harness && export PATH=$HOME/node/bin:$PATH DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles \
  S0_EVIDENCE_DIR=$HOME/trae-evidence/s0-resume S0_TARGET_RUNNER=run-s0-resume.mjs \
  && node scripts/s0-run-with-file-key.mjs
```

证据（CVM 产出，**已回传本机** → `D:\Code\_trae-cvm-evidence\s0-resume\`）：`{forward,reverse,key,same-proc}.resume.json` ＋ 原始日志 `s0-resume.log`。三元组见各 JSON 的 `triple` 字段（每变体独立临时 home ＋ `sdk` 真副本 ＋ 环境变量凭据层）。

## 9 · 未闭合项 ＋ 下一步判断

| # | 未闭合 | 我的判断 |
|---|---|---|
| 1 | **抛错点二选一未区分**（文案同） | 要区分得挂 `session` 服务插桩或读 error `data` 字段。**建议并入 DSH-3.3 / 3.6 的插桩位顺手取**，不单开任务 |
| 2 | `-32603` 的**映射点未定位**（015 的 `dsh-sdk-*` 三包 grep 无命中） | 记入「包归属待核」，与 3.0 的同类项合并 |
| 3 | **012 那版文案不可在 015 复核**（SEA 快照） | 结论按 015 记；012 侧只保留"同一现象"的定性 |
| 4 | **Python 侧未真跑**（只做源码侧） | 两通道行为是否一致未验；**建议不单开任务**，等 A-service 选型随真实链路一并验 |
| 5 | ⭐ **产品影响**：`resume`（跨进程续会话）在 015 上**不可用** | **`2.4.1 / 2.8.2` 的 fork / resume 叙事必须改口径**：走「**同进程内复用**」（已证可用）或「**用 `sessionPersistence.load/inspect` 自建重放**」（官方 seam，本轮已证日志可读）。**这是给 3.6 与后续的硬输入** |

## 10 · 自曝

1. **派发稿两处与实际不符**：① §5 的 TS 客户端路径（`$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-sdk-client/`）**在 CVM 上不存在**，我改查实物 `harness/node_modules/…`；② 派发稿说 `run-s0-e2e.mjs` 有"构建前置检查（缺产物退 2）"，**它其实没有** —— 我**只在新 runner 里补了**，**没去动 3.1 已交付的那只**（避免改已复核件）。**要不要回填 3.1 那只，请你裁。**
2. **我加了第 5 个变体 `same-proc`**（不在派发稿 ①②③④ 内）。理由：没有它，"跨进程被拒"与"id 根本不能复用"分不开。若判超范围，删掉即可（主结论不依赖它，但会少一条解释）。
3. **② 与 ④ 的差别只在 id 来源**（自选固定 vs 框架自产），两者结果**完全一致**。若你要的 ② 是别的口径（如"同 home 内第三次"/"不同 cwd 复用"），说一声，改跑很便宜（**6–9 s / 变体**）。
4. **首跑前我预期可能红在别处**（B 锁 / 加密 / 权限），实际是干净的业务级拒绝 —— 如实记，**这不是我设计出来的**。

---

## 📮 DSH-3.7.1 派发稿 · 前置就位与定性（方言修复件）

**场地** = 本机 Windows ｜ **执行人** = Trae ｜ **前置** = 无

### 0 · 目标与边界

把 3.7 的**执行前提**清干净，并在**你自己的通道**上把 09-14 那条 `EPERM` 归因定性。

> ⚠️ **本块不写 patch、不跑 e2e** —— 那是 **3.7.2**，等本块回报后再起跑。
> 依据：`docs/local-env.md` §4.3（范式 / 自检口径 / 已证未证边界）。

### 1 · 三项交付

**① `EPERM` 归因定性（必须用你自己的通道复跑）**

- 你 09-14 报「通道写 `~/.dsh/profiles/*/cordis*.yml` 被拒 `EPERM`」—— ⚠️ **该归因待复核**（09-12 有同类"主体错位"：把 **DSH 自身沙箱**的 EPERM 记成 **AI 工具沙箱**）
- ⭐ **判据要钉主体**：同一条拒绝，出自**AI 工具沙箱**还是**DSH 自身**，**归属与严重性完全不同**。须给：
  - **触发命令原文**
  - **完整错误对象**：`code` / `errno` / 栈帧里的**模块路径**
  - **指出抛出者是谁**
- ⚠️ **两处各测一次**：`~/.dsh/profiles/…`（09-14 那条记录的现场）与**工程 `.dsh-home/profiles/larry/…`**（**现在的落点**）⇒ 判"哪个能写、不能的那个是谁拦的"
- ⚠️ **结论只写在实测过的那条通道上、不得跨通道外推**（WB 通道能写 ≠ 你能写，反之亦然）
- ⚠️ 写探针**只允许"建一个探针文件后立即删除"**（如 `.write-probe-<ts>.tmp`）；**不得改动现存任何文件**

**② 方言修复件实体安装（工程 home）**

- 现状（WB 2026-09-17 实测）：**挂载点不存在** —— `.dsh-home/profiles/node_modules/@larryagent/` **无该目录**（插件没装）
  ⇒ 只写 patch 而不装插件，patch 里那行 `name: '@larryagent/plugin-sandbox-dialect'` **解析不到**
- 目标位置：`工程 .dsh-home/profiles/node_modules/@larryagent/plugin-sandbox-dialect/`
- **源 = 仓库 `harness/packages/plugin-sandbox-dialect/`**（`index.js` ＋ `package.json`）
- ⚠️ **必须实体复制、不得 link** —— link 下插件的 bare import 从**源目录**解析 ⇒ **取不到** `@deepseek-ai/dsh-sandbox-local`
- ⚠️ **不得从全局 home 那份拷**：`~/.dsh/profiles/node_modules/@larryagent/plugin-sandbox-dialect/index.js`（2962 B）与仓库源（4087 B）**去掉注释后逐行一致**，差异**只在注释头** ⇒ **以仓库源为准**
- 判据 = 装完后**从该位置**能解析 `@larryagent/plugin-sandbox-dialect`，**且**其内部 `@deepseek-ai/dsh-sandbox-local` 也解析成功（**这正是"实体复制 vs link"的分界点**）⇒ **须附实测输出**

**③ 凭据路径打通（在工程 `.dsh-home` 上跑通一次真 prompt）**

- 现状：`.dsh-home` **无 `.credentials.yaml`** —— 而三处口径**不一致**：
  - `client/src-tauri/src/main.rs:275-276` 注释：凭据**继承本进程 env**（由启动环境注入 `DEEPSEEK_API_KEY`）
  - `docs/production-env.md` §12.5 表：该文件标"**可选**"
  - `TODO.md` DSH-3.7 段「配套三件①」：写"**须建**"
  ⇒ ⚠️ **以实测为准**（这不是笔误，是三种说法并存，要落一条实测结论）
- **交付**：在工程 `.dsh-home` 上跑通一次真 prompt，并**写明实际走的是哪一层**（启动环境 ／ 存储文件 ／ 项目 `.env` ／ 主目录 `.env`）＋ **该层是否就是 client 路径会走的那层**
- ⚠️ **别把 `sdk` 通了当成 `larry` 通了**：`harness/scripts/dsh-prompt.mjs:25` **硬钉 `profile: 'sdk'`** ⇒ 直接用它跑通的是 `.dsh-home/profiles/sdk`，**不是 3.7 的落点 `larry`**。落盘在 `larry`，所以 3.7.2 的 e2e **需要能指 `larry` 的入口**（参数化或另写一个）—— 本块先把"凭据层通不通"验掉即可，**但回报里要写明你跑的是哪个 profile**
- 🔴 key 值**不得**落任何受版本控制的文件 / 日志 / 工具输出
- 📌 手工复验命令模板（含 `pwd -W` 那个静默坑）见 `TODO.md` DSH-3.7 段「落点已定」条；⚠️ **`pwd -W` 不是可选的**：Git Bash 的 **env 值不做路径转换**，`/d/Code/…` 原样给 Windows node 会被 resolve 成 `D:\d\Code\…` ⇒ DSH **自建一个空 home** ⇒ **无 key 假绿、判据全绿**
- ⛔ **跑 harness 测试时禁止注入真实 home**：`tests/isolated-setup.ts` 强制覆盖为临时目录 ＋ 正向白名单守卫，注入真实路径会判 FAIL

### 2 · 禁区

- ⛔ **不写 `cordis.patch.yml`**（`.dsh-home/profiles/larry/cordis.patch.yml` 现有 477 B、已含一条 `- id: hmr / disabled: false`，**本块不动**）
- ⛔ 不碰 `.dsh-home/profiles/{larry,sdk}/package.json` 与 lockfile（**刚由 Qoder 升 015**，勿动）
- ⛔ **不把插件装进全局 `~/.dsh`**（那份已存在、勿动）；全局 home **仅允许**"建探针文件后立即删除"，**不得改动现存文件**
- ⛔ 不改 `harness/package.json` / `pnpm-lock.yaml`

### 3 · 回报格式

1. 三条各"**结论 ＋ 原始证据**"（命令 / 输出 / 退出码）
2. `EPERM` 那条**必须写主体**（**谁的沙箱**），并分别给两处的结论
3. **自曝**：拿不准 / 证据不足 / 发现新矛盾 —— 直接写（"成因未知"是可接受的结论，**别为叙事完整编一个**）

---

# ✅ DSH-3.7.1 回报 · 前置就位与定性（Trae 2026-09-17）

## 1 · 结论先行

1. **① `EPERM` 归因：我 09-14 那条归因不成立** —— 两处 × 两条通道的写探针**全部成功**，09-14 引用的那条命令**两处都不复现**。⇒ **本任务通道上"写不进去"这一现象不存在，故没有主体可钉**（我没有为它补一个新主体）。另附**正对照**（拒绝长什么样），证明探针的成功不是"被静默吞掉"。
2. **② 实体复制已完成、判据成立**（双层解析 + **真 `import` 成功**）；但抓到 **2 处与文档不符**（依赖实际解析到**全局 npm 的 dsh 自带依赖**；link 对照的红灯**不是**文档记的那条文案）。
3. **③ 凭据层 = 启动环境变量**（两态互异：无 key → `MISSING_CREDENTIAL`；env 注入 → `completed`），且**该层就是 client 会走的那层**。但**client 走 `sdk` profile，而落点是 `larry`** —— 且 `larry` **根本不是 SDK 面**（起不来）⇒ **3.7.2 有个必须先裁的结构性岔口**（见 §4.3）。

## 2 · ① `EPERM` 归因定性（**主体必写**）

### 2.1 两处 × 两条通道的写探针（每处各一次；**建后立即删除**，未动任何现存文件）

| 处 | 通道（潜在主体） | 探针 | 结果 |
|---|---|---|---|
| `~/.dsh/profiles/sdk/`（**09-14 的现场**） | **我的写文件工具**（AI 工具通道） | `.write-probe-tool.tmp` | ✅ **成功**（随即删除） |
| `.dsh-home/profiles/larry/`（**现落点**） | 同上 | `.write-probe-tool.tmp` | ✅ **成功**（随即删除） |
| `~/.dsh/profiles/sdk/` | **node `fs`**（我的 shell 通道） | `.write-probe-node-<ts>.tmp` | ✅ `wAccess=W_OK ok` → 写入 ok → 回读 ok → `cleanup=deleted` |
| `.dsh-home/profiles/larry/` | 同上 | 同上 | ✅ 同上 |

⇒ **两处、两条通道，4/4 可写，无一条 `EPERM`。**
（探针脚本 `D:\Temp\dsh-probe\371-erperm-probe.mjs`；`node v24.14.1`）

**顺手排掉一条解释**：`cordis*.yml` 的**文件属性全为 `Archive`（无只读位）** —— `~/.dsh/profiles/{larry,sdk,web}/cordis*.yml` 6 个 ＋ `.dsh-home/profiles/{larry,sdk}/cordis*.yml` 4 个，均无 `ReadOnly`。

### 2.2 09-14 那条"证据"命令：**两处都不复现**

触发命令原文（我当时引用的那条）：

```
dsh --profile sdk --dump-config
```

| 处（**均在 home 的副本上跑，真件未动**） | 退出码 | stderr | stdout |
|---|---|---|---|
| 工程 home 副本 `D:\Temp\dsh-probe\371-home` | **0** | **0 字节** | 11533 B |
| 全局 home 副本 `D:\Temp\dsh-probe\371-global` | **0** | **0 字节** | 11652 B |

⇒ **两处都干净成功**：没有 `EPERM`、没有任何失败。

### 2.3 正对照：**拒绝长什么样**（用来证明 2.1 的成功是真成功）

| 主体（谁在拒） | 触发 | 完整错误对象（**原文**） |
|---|---|---|
| **我的写文件工具**（AI 工具通道） | 写 `C:\Windows\.write-probe-tool.tmp` | `无法写入文件"c:\Windows\.write-probe-tool.tmp"（NoPermissions (FileSystemError): Error: EPERM: operation not permitted, open 'c:\Windows\.write-probe-tool.tmp'）` |
| **node**（shell 通道） | 写 `C:\Windows\.write-probe-node-<ts>.tmp` | `name=Error` / `code=EPERM` / `errno=-4048` / `syscall=open` / `path=C:\Windows\…tmp`；`message=EPERM: operation not permitted, open '…'`；栈头 `at writeFileSync (node:fs:2413:20)` → `371-erperm-probe.mjs:31` |

⇒ **两种主体、两种形状**（工具通道 = 外层裹 `NoPermissions (FileSystemError)`；node 通道 = `EPERM + errno=-4048 + syscall=open`）—— **这就是"钉主体"的可操作判据**。而 2.1 的 4 次探针**两种形状都没出现** ⇒ 是真成功，不是被吞。

### 2.4 主体结论（逐处）

- **全局 `~/.dsh/profiles/sdk/`（09-14 现场）**：**无拒绝 ⇒ 无主体可钉**。09-14"写 `~/.dsh/profiles/*/cordis*.yml` 被拒"**不成立**（与 WB 2026-09-14 的独立实测一致）。
- **工程 `.dsh-home/profiles/larry/`（现落点）**：**无拒绝 ⇒ 无主体可钉**。
- **我 09-14 的归因错在哪（两重错）**：① **证据引用错位** —— 拿 `dsh --profile sdk --dump-config` 的失败当"写 cordis.yml 被拒"的证据，而那条命令是 **DSH 启动**、根本不写 `cordis.yml`（WB 09-14 已指出）；② **该失败现在也不复现**。⇒ 双重不成立。
- ⚠️ **我没有为它补一个新主体**（既不说成"工具沙箱"，也不反过来说成"DSH 沙箱"）：**现象不存在时，任何主体都是编的**。
- 唯一**有据可查**的 `EPERM` 出处仍是 `docs/local-env.md` §4「② 错误码类别层」：**DSH 自身沙箱**（windows-acl runner 拒写 → node 报 `EPERM: operation not permitted` → DSH 未识别该文案）。但那是"**沙箱拦命令**"的场景，与我 09-14 声称的"**拦我写 profile 目录**"**不是同一件事** ⇒ 归 **3.7.2 的真 e2e** 去验，不计入本条。

### 2.5 顺手排掉一个"最容易再次误记成权限问题"的坑

拷全局 home 那次 `robocopy` 报 **RC=9、25 个目录 FAILED** —— 表面极像"权限被拒"。**真相**：源里有 **509 个 junction（reparse point）**，`robocopy` 默认要展开/重建它们而失败；加 `/XJ` 后 **19183 文件 / 157.16 MB 全部拷成、0 FAILED**。
⇒ **「目录拷不动」≠「权限被拒」**，它不属于 `EPERM` 家族。

## 3 · ② 方言修复件**实体安装**

- **源** = `harness/packages/plugin-sandbox-dialect/{index.js,package.json}`（**仓库源**，未从全局 home 拷）
- **落点** = `.dsh-home/profiles/node_modules/@larryagent/plugin-sandbox-dialect/`

| 检查 | 实测 |
|---|---|
| 实体 还是 link | **实体目录**（`LinkType` 空）；`@larryagent/` 下只有这一个条目 |
| 与源一致 | `index.js` **4087 B** / `package.json` **542 B**；SHA256 前 16 位与仓库源 **SAME** |
| 解析插件自身 | `@larryagent/plugin-sandbox-dialect` → `…\profiles\node_modules\@larryagent\plugin-sandbox-dialect\index.js` ✅ |
| 解析内部依赖 | `@deepseek-ai/dsh-sandbox-local` → `C:\Users\SuLarry\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-sandbox-local\lib\index.js` ✅ |
| **真 `import()`**（最终判据） | `ok`；导出 `["WINDOWS_ACL_EXTRA_DENIALS","default"]`；`extras = ["operation not permitted","拒绝访问","访问被拒绝"]`；`default` 是 class ✅ |

（验证脚本 `D:\Temp\dsh-probe\371-verify-2.mjs`）

### 3.1 ⭐ 两处与文档不符（**要订正**）

1. **依赖实际不是"profile 自己装了一份"**：`profiles/node_modules/@deepseek-ai/*` 的条目是 **Junction**，指向 **全局 npm 安装的 dsh 自带依赖**（`C:\Users\SuLarry\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\…`）。⇒ ② 成立，但**成立的机制**是"Dsh 把 profile 树 junction 到自己的依赖"，**不是**"profile 内独立安装"。
2. **link 对照的红灯不是文档记的那条**：`docs/local-env.md` §4.3 与挂载件注释都写「link 下**取不到** `@deepseek-ai/dsh-sandbox-local`」。实测（junction → 仓库源，Node 解析）：

   | specifier | 从**仓库源目录**解析 | 结果 |
   |---|---|---|
   | `@deepseek-ai/dsh-sandbox-local` | **取到了**（`harness/node_modules/.pnpm/@deepseek-ai+dsh-sandbox-lo_…/`） | OK |
   | `@deepseek-ai/dsh-llm` | **MODULE_NOT_FOUND** | FAIL |
   | 真 `import()` 插件 | **失败**，文案 = `SyntaxError: The requested module '@deepseek-ai/dsh-llm' does not provide an export named 'assertNever'` | FAIL |

   ⇒ **结论方向不变**（link 确实不可用），但**载体是"依赖树不配套"**（连到了另一份变体的 `dsh-llm`），**不是"找不到 sandbox-local"**。⚠️ 照旧文案去排查会走偏。

## 4 · ③ 凭据路径打通 ＋ **实际走的是哪一层**

**两态对照**（均在**工程 `.dsh-home`** 上真跑；脚本 `D:\Temp\dsh-probe\371-cred-probe.mjs`）：

| 态 | profile | 注入 | 结果 |
|---|---|---|---|
| **A** | `sdk` | **不注入任何 key**（我的 env 里没有、工程 home 也无 `.credentials.yaml`） | `turn/end.kind=error` / **`code=MISSING_CREDENTIAL`** / `finalResponse` 空 / 13 事件 / **2.29 s** |
| **B** | `sdk` | 从 **`backend/config.yaml`** 取 key（长度 35）经**环境变量**注入 | **`completed`** / `finalResponse="CRED-OK"` / 13 事件 / **2.75 s** ✅ |

⇒ **实际凭据层 = 「启动环境变量层」**：没有 env key 就 `MISSING_CREDENTIAL`；给了就走通。（`.credentials.yaml` 全程未参与。）

### 4.1 该层**就是** client 路径会走的那层

`client/src-tauri/src/main.rs:274-291`：
- 注释自述：*"模型凭据**继承本进程 env**（由启动环境注入 `DEEPSEEK_API_KEY`）"*
- 代码实测：`Command::new("node").arg(dsh-prompt.mjs).env("DSH_HOME", .dsh-home)` —— **只设 `DSH_HOME`**、**不设 `DEEPSEEK_API_KEY`**（Rust `Command` 默认继承父 env）⇒ **Key 必须由 Tauri 进程自身的启动环境带进来**。

⇒ 与我 B 态**同层（env）**一致。⚠️ 但**"谁把 key 放进 Tauri 的启动环境"这一环不在本块范围**（我没找到 Tauri 侧读 `config.yaml` 的代码路径）—— 记为待核（见自曝 4）。

### 4.2 三处口径的**实测裁决**

| 出处 | 说法 | 本机实测 |
|---|---|---|
| `main.rs:274-277` | 凭据继承本进程 env | ✅ **成立**（B 态） |
| `docs/production-env.md` §12.5 表 | `.credentials.yaml`「**可选**」 | ✅ **成立**（工程 home 无该文件，B 态照样 `completed`） |
| `TODO.md` DSH-3.7「配套三件①」 | 该文件「**须建**」 | ⚠️ **在本机 TS SDK 通道下非必要**。**除非**目标改成"Tauri 启动时没 env 也能通"，那才需要建文件或让 client 显式注入 —— 那是**产品选择**，不是实测结论 |

### 4.3 ⭐ 硬发现三：**落点 `larry` 根本不是 SDK 面**

先按派发稿的提醒单独试 `larry`（没把 sdk 的绿灯当成 larry 的）：

```
DSH_HOME=.dsh-home  profile='larry'  真 SDK 通道
→ TransportClosedError: dsh profile "larry": JSON-RPC input closed
  exit code: 1
  stderr tail:
  [B1-PROBE] external bundle loaded by cordis (tag=v1)
  error: a task is required, for example: dsh --profile headless "run the tests"     （3.48 s）
```

剖面（两个 profile 的 `package.json`，**只读**）：

| profile | bundles | 面 |
|---|---|---|
| `sdk` | `dsh-base` ＋ **`dsh-sdk-app`** | **SDK 面**（stdio JSON-RPC） |
| `larry` | `dsh-base` ＋ **`dsh-headless`** ＋ `@larryagent/plugin-probe`（**`link:`**） | **headless CLI 面**（要位置参数当 task） |

⇒ **「落盘在 larry」与「client 实际跑的 sdk」不是同一条通道**。**3.7.2 必须先在下面三条里选一条（请老大/WB 裁）**：

1. 给 `larry` 加 `@deepseek-ai/dsh-sdk-app`（**改该 profile 依赖** —— 本块禁区内，我没动）
2. 把落点改到 `sdk`
3. 3.7.2 的 e2e 改用 **CLI 直跑** `dsh --profile larry "…"` —— 但那**不是 SDK 通道**，按"三通道结论不可互推"的纪律须单独声明

⚠️ 另注工程 home 两处现状（**只读观察，未动**）：
- `larry` profile 里**已有一个 `link:` 挂载的 `@larryagent/plugin-probe`**，boot 时打出 `[B1-PROBE] external bundle loaded by cordis (tag=v1)` ⇒ **落点 profile 现有"link 挂载"先例**，与 ② 要求的"必须实体复制"相冲突（3.7.2 落盘前建议一并处置）。
- `larry/cordis.patch.yml` 当前 = **477 B**，内容即那条 `- id: hmr / disabled: false`（与文档一致，未动）。

## 5 · 禁区文件哈希取证（**未动**）

10 个文件（`{larry,sdk} × {package.json, pnpm-lock.yaml, cordis.patch.yml, cordis.yml, pnpm-workspace.yaml}`）：

- **boot 前后**：与"从真件拷出、再在副本上**独立 boot 一次**"的那份**逐文件哈希相同（SAME×10）** ⇒ **重复 boot 不改写这 10 个文件**（`profiles/node_modules` 会被 materialize，manifest/lockfile 不动）
- **②③ 前后**：T0（boot 后）vs T1（②③ 后）**SAME×10** ⇒ ②③ 未动它们

## 6 · 本轮我改动了工程 home 的哪些东西（如实清单）

| 路径 | 动作 | 性质 |
|---|---|---|
| `.dsh-home/profiles/node_modules/`（240 个 `@deepseek-ai` junction ＋ 其余） | **新建** | **DSH boot 自动 materialize** 的产物（与 3.0.4「boot 不是只读」一致） |
| `.dsh-home/profiles/larry/node_modules/`、`larry/.dsh-module-fallback` | **新建** | 同上，boot 产物 |
| `.dsh-home/profiles/node_modules/@larryagent/plugin-sandbox-dialect/{index.js,package.json}` | **新建** | **② 的交付本体** |
| `.dsh-home/sessions/**` | 新增 2 条会话（`session-f2d9b78c…` / `session-d758970d…`） | ③ 真调用落盘 |
| 禁区 10 文件 ＋ `larry/cordis.patch.yml` | **未动**（§5 哈希取证） | — |

## 7 · 自曝

1. **① 我只拿到"不复现"，没拿到"当年为什么"** —— 我**没有**去编一个主体。要追"当年的真因"，需要当时的现场（当时的 dsh 版本 ＋ 当时的 profile 状态），**两者现在都变了**（本机已同代化）⇒ 建议按「**归因不成立、现象不复现**」结案。
2. **我加了一个不在派发稿里的对照**（`C:\Windows` 正对照）：没有它，"探针成功"与"探针被静默吞掉"不可区分。若判超范围可删，但删了就没有"拒绝形状"的锚点。
3. **② 的 link 对照是 Node 层实验，不是 dsh 挂载实验** —— 我没真造一个 link-mount 的 dsh 启动（那要动 profile manifest，属禁区）。故"link 不可用"的**载体**结论只到 Node 解析层。
4. **③ 的 B 态 key 是我从 `backend/config.yaml` 取的**，**不是 client 的真实取值路径**（那条路径我没找到）。所以"层级一致"是**由 `main.rs` 的代码＋注释推的**，不是我端到端跑出来的 ⇒ **"谁往 Tauri 的启动环境里放 key"请确认**。
5. **`larry` 起不来这条我没预料到**（派发稿只说"别把 sdk 通了当 larry 通了"）。它把 3.7.2 变成一个**必须先裁的岔口**，不是我能自己选的（§4.3 三选一）。
6. 本块**全程本机**，未连 CVM；未做任何 git 远程操作。
---

# ⚖️ WB 复验批注（2026-09-17，对本文件两份回报）

## 3.2 —— 结论成立（真缺口），装置与证据经独立复核

- 4 份 `.resume.json` ＋ 原始 `s0-resume.log` **已回传本机**（`D:\Code\_trae-cvm-evidence\`）；WB **独立 Tier0 扫描：clean**；三个核心声明逐条对得上（`already exists` ×2、`-32603` ×2、`collision` **0 命中** = 文案确已换代）。
- ⚠️ **判据缺陷 1（登记待修，不在本轮改）**：`resumeTarget.p2LandedOnSameLog` 恒为 `null`｜`false`、**永不可能为 `true`**（实现写死 `p2Log === null ? null : false`）⇒ 将来 resume 真修好时该字段会**静默给 `null`**（假阴性）。修法 = 补一条 `hasP1 && hasP2` 的日志判定；改判据须实跑。
- ✅ **保留 `same-proc` 变体**：它是"同进程可复用 vs 跨进程被拒"的**唯一判别器**，非超范围；**不加它则两条口径不可分**。

## 3.7.1 —— ① ③ 成立；**② 的核心判据被推翻**

- ✅ **① EPERM**：你"不给不存在的现象编主体"是**正确姿势** —— 与 WB 09-14 独立实测一致；正对照（`C:\Windows`）也做对了。
- ❌ **"实体复制 ⇒ 可加载"不成立（WB 四组实测）**：**A 全局 home 落点 = OK ／ B 工程落点（实体，4087 B、SHA 与源 SAME、真目录）= FAIL ／ C 直接 import `sandbox-local@0.1.5-rc.2` = OK ／ D 直接 import `sandbox-local@0.0.1-rc.1` = FAIL**。B 的失败文案 **与你归给「link 对照」的那条完全相同**（`'@deepseek-ai/dsh-llm' does not provide an export named 'assertNever'`）。⚠️ **A 绿 ⇒ 判据在健康对象上会绿，不是你探针的故障**。
  - ⇒ **真正分界不是"实体 vs link"，而是"依赖绑到哪一代"**：`harness/packages/plugin-sandbox-dialect/package.json` 的 `peerDependencies: {"@deepseek-ai/dsh-sandbox-local": "*"}` ⇒ pnpm 解析到 npm latest 那支 **`0.0.1-rc.1`**（而你 `371-verify-2.mjs` 拿到的是**全局 npm** 的 `0.1.5-rc.2`）。**引入点 = `a974258`（本机升 015 时 lockfile 重算），非本轮任何改动**。已定为 **3.7.2 硬前置 1**。
- ⚠️ **你的订正① 是对象错位（别按它改文档）**：工程 `.dsh-home/profiles/node_modules/@deepseek-ai/` 的 **241 条 junction 全部指向 `harness/node_modules/.pnpm/…`（本工程）**，**无一条指向全局 npm** ⇒ "解析到全局 npm 的 dsh 自带依赖"描述的是**全局 home** 的机制（全局 home 的 junction 才指 `%APPDATA%\npm\…`）。
- ⚠️ **你的订正② 方向对、载体不完整**：link 对照的红灯确实**不是**"找不到 sandbox-local"；但**实体那份也一样红** ⇒ 不能据此说"实体可用"。
- ✅ **你读的包是对的**：你所读那份与工程指向那份 **`dsh-session` ／ `-persistence` ／ `-jsonl` ／ `dsh-llm` 四处 sha256 全同（0.1.5-rc.2）** ⇒ **§6 的源码行号结论（`:1380` / `:33-38` / `:3002`）不受影响，保留**。

## 两处驳回

1. **你的自曝② 不成立**：「`run-s0-e2e.mjs` 没有构建前置检查」—— 本机该文件 `:40-61` **有**（WB 09-17 所加，提交 `cdc0fde`）。你核的应是 **CVM 上那份滞后同步的副本**（CVM 无完整仓库）。⇒ **「要不要回填 3.1 那只」这个待裁项随之作废**（**无需回填，勿动 3.1 已复核件**）。
2. **声明与交付不一致**：commit message 称"订正 `docs/dsh/dsh-pysdk-probe-claude.md:157` 的表述"，**但 `0f81c04` 未改该文件**（只动 `dsh-migration.md` ＋ 本文件）⇒ **WB 本轮已代你补正**。下次**说改了就要真改**，或写明"建议改、由 WB 承接"。

## WB 承认（出稿方义务）

派发稿 §5 把 TS 客户端实物路径写成 `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-sdk-client/`，**CVM 上不存在**（实物在 `harness/node_modules/@deepseek-ai/dsh-sdk-client`）—— 你顶住了"照稿执行"的惯性并报出，**已回填**。

## 待老大裁（不由你决定，勿自行往下做）

1. **3.7.2 的岔口三选一**（`larry` 是 headless CLI 面、**非 SDK 面**）；
2. **硬前置 1 的依赖代际修法**（把 `peerDependencies` 从 `*` 钉成 `0.1.5-rc.2` ＋ 重算 lock ／ 重装落点 ＋ 实跑验证）是否派发。

**3.2.1 ／ 3.7.2 仍未派，别自行起跑。**
