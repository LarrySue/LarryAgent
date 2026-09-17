# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.2** · 首验：跨进程 resume 的 id collision 定性 | Trae | **CVM** | 🔴 在飞 | 2026-09-17 |
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
