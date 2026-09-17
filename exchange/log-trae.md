# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.2** · 首验：跨进程 resume 的 id collision 定性 | Trae | **CVM** | ✅ **已回报（2026-09-17）** · 结论 = 真缺口（非姿势问题） | 2026-09-17 |
| **DSH-3.7.1** · 前置就位与定性（方言修复件） | Trae | **本机 Windows** | 🔴 在飞 | 2026-09-17 |

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
