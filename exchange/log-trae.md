# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.2.1** · 锁子项：Windows 侧 named semaphore 的内核释放实测 | **Trae** | 本机 Windows | 🚀 **已派发（2026-09-17）** | 2026-09-17 |

- 已完成并复验（本段已清）：3.0 ✅ ／ 3.1 ✅ ／ 3.2 ✅ ／ 3.7.1 ✅ ／ 3.7.2 ✅ ／ **3.7.3 ✅（WB 逐条回源复核 J1–J11 全成立，一句话 = (a) 已清干净、两侧 lock 逐字节一致）**。
- 任务清单与进度以 `TODO.md`「DSH-3」区为准（**一处两面**）；本区只放**怎么做**。
- ⚠️ **通用纪律（沿用 3.7.2 / 3.7.3 教训）**：① **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**；② **改依赖树/删树必须实跑，不得只凭推理**；③ **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）；④ **说"没有 / 不存在"必须附检索式与遍历范围**；⑤ **判据改动须实跑**；⑥ **收尾必核 `git status`**（复核/取证动作自身也会改现场）。

---

## 🚀 DSH-3.2.1 · 锁子项：Windows 侧 named semaphore 的内核释放实测

> **派发日**：2026-09-17 ｜ **执行人**：Trae ｜ **场地**：本机 Windows（**WSL 不参与**，见 DSH-3 贯穿规则）
> **来源**：DSH-3.2 拆出的 Windows 侧子项（本文件同段历史记录见 `TODO.md`「DSH-3.2.1」段）。
> **起跑前置已确认**：3.2 的锁归属结论已出（「A 锁全程无孤儿 ／ B 锁全程未现（每轮 `close()` 走到真退出 ⇒ 租约由内核释放）」）⇒ **本项问法无需改**，按原判据跑。3.7.3 已交回，本机 `harness/node_modules` 场地已空出。

### 0 · 目标

**要回答的一件事**：015 的 `session-persistence-jsonl` 自述的「**Windows 侧走 named kernel semaphore、进程死亡即由内核释放、故意不做 TTL 抢占**」——**在本机 Windows 上是否属实**。

为什么值得单列：这条自述是「**锁不会成为生产阻塞**」的**唯一依据**；而 3.2 只在 **CVM/Linux** 侧实测过（那条走 `flock(2)`，由 `node-addon-system` 提供）—— **Windows 走的是另一条完全不同的实现**（`CreateSemaphoreW` / `ReleaseSemaphore` 的 kernel32 绑定），**从未被实测**。

⚠️ **本项不是"再验一次 3.2"**：3.2 的结论（跨进程 resume = **真缺口**）**与本项无关、不得混报**。

### 1 · 判据

> 逐条编号；每条写明**取什么证据**。⛔ 禁止"测过了""符合预期"这类自述型判据 —— 每条都要能写出**命令 ＋ 期望观测**。

#### J1 · 【正锚】首写者**活着**时，第二个写者**被拒** ★ 缺此则 J2 无意义

- 起**两个独立进程**，**同一个** `DSH_HOME` ＋ **同一个** session ID；**第一个进程保持存活**（未 `close()`、未退出），第二个进程发起写入。
- 期望：第二个进程收到 **`SessionAlreadyOwnedError`**（或等价拒绝：`code` / `errorName` 须原样报出）。
- **为什么这是正锚**：只有 J2（"首写者死后第二个能拿到"）**无法区分**「内核真的释放了」与「这把锁**压根没生效**」—— 后者也会"拿到"。**两锚同时成立**才叫"释放语义属实"。

#### J2 · 【负锚】首写者被 `taskkill /F` 后，第二个写者**能拿到**

- 用 **`taskkill /F /PID <pid>`**（实测存在：`C:\WINDOWS\system32\taskkill.EXE`）杀掉首写者；⚠️ **只杀持有写句柄的那个进程**。
- 期望：第二个写者**成功取得写权**（沿用同族判据的形态：真 `completed` 或明确的"取得写权"观测）。
- **取什么证据**：两条命令原文 ＋ 两个进程的**完整错误对象 / 状态**（`code` / `errno` / 栈帧模块路径）。

#### J3 · 报告里凡"锁"必须**标明是哪一把**

系统里有**两把语义相反**的锁，**表现完全不同**：

| 锁 | 载体 | 释放语义 | 残留时的表现 |
|---|---|---|---|
| **A 锁** | `$DSH_HOME/profiles/node_modules.lock`（`dsh-atomic-write`） | **持有者死亡后永不自动回收**（源码原文：*orphan recovery is an operator action*） | **任何 dsh 命令启动即失败**：`atomic-write: timed out waiting for the writer lock`（默认**只等 2 s**）⇒ **极易误判成"启动慢/网络问题"** |
| **B 锁** | 本项靶子 = 015 的 **session 写租约**（`session-persistence-jsonl`：POSIX `flock(2)` / Windows **named semaphore**） | 自述 = **进程死亡即由内核释放**、**故意不做 TTL 抢占** | 第二个写者收 `SessionAlreadyOwnedError` |

**取什么证据**：每条与锁有关的观测，**逐条注明 A / B**。⛔ 不许只写"锁残留"。

#### J4 · 机制取证：读实现，**不得只凭自述**

自述不是证据。须**读实物**并回报**行号 ＋ 原文片段**：

- 实现（⚠️ **`.pnpm` 目录名是截断名，别用包名 glob 找**）：
  `harness/node_modules/.pnpm/@deepseek-ai+dsh-session-pe_eb36fbaa5cad797270ab51529b7e5a46/node_modules/@deepseek-ai/dsh-session-persistence-jsonl/lib/index.js`
  - `:474-481` — kernel32 绑定（`CreateSemaphoreW` / `ReleaseSemaphore`）
  - `:545-578` — `acquireLockHandleWin32` / `releaseLockHandleWin32`
  - `:615-619` — 自述段（"…Windows holds a named kernel semaphore derived from …"）
  - `:313` / `:663-710` — 实例内检查 与 `SessionAlreadyOwnedError` 的抛出点
- 文档：同包 `README.md:158`（英）／ `README.zh.md:158`（中）—— **中译原文**："每会话一个活动写入方……内核锁（`session.lock` 上的非阻塞 `flock(2)`；Windows 上为由该路径派生的**命名内核信号量，零文件系统足迹**）……"
- ⚠️ **这是编译产物（构建后 JS），不是 TS 源码** ⇒ 只能作"**实现形态**"取证，**不得**据此推断"设计意图"；**自述与实现不符时，以实测为准**。

**要回答的机制问题**（答不出就写"未查到"，⛔ 别编）：
1. 那个命名信号量的**名字**怎么来？（"derived from the path" 具体是什么派生？）
2. 代码路径上有几处"释放"？（显式 `ReleaseSemaphore` ＋ 进程终止时句柄关闭？）
3. **第二个进程如何判定"已被占用"**？（`CreateSemaphoreW` 若同名已存在会返回有效句柄而非失败 ⇒ 判据在哪里？读出实际那一行。）

#### J5 · 作用域边界：**同 logon session ／ 跨 session**（尽力做；做不到要说明）

Windows 命名内核对象有命名空间（`Local\` / `Global\`）之别。**能测则测**并写明；**做不到**要说明**为什么**（需要第二个登录会话 / 服务等），⛔ **不得沉默略过**。

#### J6 · 前置：实验前先清 A 锁孤儿

实验前须断言**无 A 锁孤儿**（否则实验**根本没跑起来**，会得到"租约没生效"的**假阴性**）。
若发现孤儿：读锁内 PID → `process.kill(pid, 0)` → **仅 `ESRCH`（进程不存在）才重命名**为 `*.lock.bak.<ts>`；⚠️ **活跃或内容不可解析 ⇒ 停手报错**；⛔ **禁 `rm -f`**（会制造真并发故障）。

#### J7 · 场地与通道自证

- 回报**实际用的 node 版本 ＋ 调用通道**。⚠️ **实测：同机两条通道给出不同版本** —— Bash 通道 = **`22.22.2`**（managed）／ system `D:\App\node` = **`24.14.1`**。⇒ **通道不同则结论不可互推，必须写明走的是哪条**。
- `taskkill` 存在性自证（`where taskkill`）。
- 报告"杀进程成功"须给**进程生命周期证据**（杀前 PID 存在 / 杀后 `tasklist` 查不到该 PID），⛔ 不接受只看 `taskkill` 的退出码。

#### J8 · 不污染基线、不留残留

- `harness/pnpm-lock.yaml` ／ `harness/package.json` ／ 4 个探针包 `package.json` **不得改动**（本项**不需要**动依赖树；改了就是越界）。
- 工程落点 `.dsh-home/profiles/sdk/` 的 `cordis.patch.yml`（**769 B / sha256 前 16 `74400d260d5d4e6c`**）与 `node_modules/@larryagent/plugin-sandbox-dialect/` 两文件（`index.js` `022b0ff5efd11648` ／ `package.json` `9d6f4794a8aec191`）**不得改动**。
- 收尾清理：临时 home ／ 测试进程 ／ 任何新建锁文件 —— 并给出**清理证据**（路径 ＋ 前后状态）。⛔ 禁 `rm -rf`（临时目录可用 `fs.rmSync(...,{recursive:true})` 于**你自己的临时 home**；⛔ 不得指向工程目录或 `~/.dsh`）。

#### J9 · 若 J2 也红 —— 必须区分两种成因

若"首写者已死但第二个写者仍被拒"，须**再取一步证据**把它分成两种：① 内核**没**释放（句柄被谁持有？谁 open 过这个名字？）② **锁机制没生效**（J1 的红灯形态会不同）。
⛔ **不许把两者混成"锁有问题"一句收口**。

### 2 · 判据前置

- **前置 0 · 别用"同进程两次写"冒充两个写者** —— `lib/index.js:313` 有一条**实例内**检查（`this.writers.has(id)`），命中它**与内核锁无关** ⇒ 必须**真起两个进程**。
- **前置 1 · 两个写者必须指向同一个家 ＋ 同一个 session** —— 信号量名字由**路径派生** ⇒ home/session 不同 = 拿到的是**另一把锁**，会得到"居然能拿到"的**假绿色**。
- **前置 2 · 先记改动前基线**（本项预计**零改动**）：`git status --short` 应为 clean；上面 J8 的锚值先记一遍。
- **前置 3 · 凭据**：本项**不需要**任何凭据。若复用 `s0-kill-child.mjs` 跑真 prompt，凭据按既有装置**原样引用**（环境变量），⛔ **值不得落稿、不得落任何受版本控制的文件 / 日志 / 工具输出**。
- **前置 4 · 器材优先复用，不另造**（见 §4）：⭐ 仓库已有 **`harness/scripts/s0-kill-child.mjs`** —— 就是"会真写会话、可被中途杀掉"的子进程（用法：`node scripts/s0-kill-child.mjs <home> <nonceFilePath> <model>`）；骨架与退出码约定照 **`harness/scripts/run-s0-resume.mjs`**（`0` 通过 ／ `1` 测试失败 ／ `2` 前置缺失 ／ `124` 看门狗超时）。

### 3 · 交付物

- **装置**（新增或改造，落在 `harness/scripts/` 或 `harness/tests/` 下，命名带 `321` 便于检索）：一条命令复跑 ＋ 明确退出码 ＋ 证据落盘。
- **证据落盘**：本机 `D:\Code\_trae-evidence\321\`（新建；逐件命名 `J<n>-<名称>.txt` / `.json`）。
- **结论件**：J1–J9 逐条 ＋ 机制取证行号原文 ＋ 未闭合项。
- ⚠️ 若改动 `harness/**` 下**受版本控制**的文件，须给 `git diff --stat` 与关键 diff 片段。

### 4 · 参考件四要素

① **路径（可复制）**

| 路径 | 作用 |
|---|---|
| `D:\Code\LarryAgent\harness\scripts\s0-kill-child.mjs` | ⭐ **现成的"会真写会话、可被中途杀"的子进程**（`node scripts/s0-kill-child.mjs <home> <nonceFilePath> <model>`）。本项 J1/J2 的两个"写者"可由它承担 |
| `D:\Code\LarryAgent\harness\scripts\run-s0-resume.mjs` | **骨架与约定样板**（构建前置检查 ／ 退出码 0-1-2-124 ／ 每变体超时 ／ 证据落盘）。**照抄骨架，勿另起一套** |
| `D:\Code\LarryAgent\harness\tests\s0-session-log.ts` | **多帧 zstd 回读**的现成器材（3.1 交付物）—— 要读会话日志**先用它**，⛔ 不要自造 |
| `D:\Code\LarryAgent\harness\node_modules\.pnpm\@deepseek-ai+dsh-session-pe_eb36fbaa5cad797270ab51529b7e5a46\node_modules\@deepseek-ai\dsh-session-persistence-jsonl\lib\index.js` | J4 的**机制取证对象**（`:474-481` / `:545-578` / `:615-619`） |
| `D:\Code\LarryAgent\docs\local-env.md` | 本机锁原文与实测（A 锁那条） |
| `D:\Code\LarryAgent\docs\dsh\dsh-migration.md` §3.6 | 锁争用矩阵 ＋ 判据抽象 |

② **怎么参考**：`s0-kill-child.mjs` / `run-s0-resume.mjs` **只读结构**（子进程怎么起、home 怎么给、退出码怎么定、证据怎么落），**不改它们**；`lib/index.js` **读码即可，不需要跑**。

③ **参考程度**：**可抄形状**（骨架 / 命名 / 退出码 / 证据结构）。⛔ 不要 fork 一份改改就用 —— 本项要的"两个写者 ＋ 杀掉其一"与它们的"两个变体顺序跑"**姿态不同**。

④ **哪部分不可参考（★ 必须逐条看）**
- ⛔ **`s0-kill-child.mjs` 的 kill 是用 `SIGKILL`**（由父进程发出）：在 Windows 上 node 的 `SIGKILL` 走 `TerminateProcess`，**与 `taskkill /F` 效果等价** —— 但判据原文要求 **`taskkill /F`** ⇒ **用 `taskkill /F`**，并在回报里**注明实际用了哪条**。
- ⛔ `s0-resume.test.ts` 的四变体装置**解决的是"跨进程 resume 能否复用同 ID"**，与本项靶子（**锁的释放语义**）不同 ⇒ **别拿它的结论当本项结论**。
- ⛔ `lib/index.js` 是**编译产物**：行号只对**本机这一支**（`.pnpm` 截断名目录 `…session-pe_eb36fbaa…`）有效；换一支要重核。
- ⚠️ 上述 sha256 / 行号锚**取自 2026-09-17 本机实物**；若你上手时核对不上，**先报出差异再动手**（多方可实时改文件，快照会过期）。

### 5 · 场地与器材

**本机**
- 仓库根：`D:\Code\LarryAgent`；工作区：`harness/`
- node **两条通道版本不同**（见 J7）⇒ **回报必须注明通道**；pnpm **`11.7.0`**，本机调用式 = **`pnpm.cmd`**（⛔ 裸 `pnpm` 在本机 Bash 通道下必崩：npm 的 sh 垫片缺 `sed`/`dirname`/`uname`，且入口会错解析到 `D:\node_modules\pnpm\bin\pnpm.mjs` ⇒ 报 `Cannot find module` **是通道问题、不是工程问题**）。**本项预计不需要动依赖树**。
- `taskkill` = `C:\WINDOWS\system32\taskkill.EXE`（已实测）；`tasklist` 同目录。
- 基线锚（改动前实测，供核对起点）：

| 对象 | 尺寸 | sha256 前 16 |
|---|---|---|
| `harness/pnpm-lock.yaml` | 541493 B | `a03ede8de3f00ee3` |
| `harness/package.json` | 1283 B | `e4d338caa2a0431b` |
| `harness/packages/plugin-sandbox-dialect/package.json` | 551 B | `9d6f4794a8aec191` |
| `.dsh-home/profiles/sdk/cordis.patch.yml` | 769 B | `74400d260d5d4e6c` |
| 落点 `…/plugin-sandbox-dialect/index.js` | 4087 B | `022b0ff5efd11648` |

**已知假绿坑（逐条都会让你得出反向结论）**
1. **同进程两次写 ≠ 两个写者** ⇒ 命中实例内检查，**与内核锁无关**（见前置 0）。
2. **home/session 不一致 ⇒ 拿到的是另一把锁**，会"居然能拿到"（见前置 1）。
3. **`CreateSemaphoreW` 同名已存在时返回的是有效句柄、不报错** ⇒ "创建成功"**不等于**"取得写权"；判据在别处（J4 第 3 问要读出来）。
4. **父进程若自己 open 过那个名字**，句柄未关 ⇒ 内核对象**不销毁** ⇒ 看起来"没释放"。杀的必须是**持有句柄的那个进程**。
5. **`taskkill` 的退出码 ≠ 进程已死**（见 J7，须用 `tasklist` 复核）。
6. **A 锁残留 ⇒ 任何 dsh 命令启动即失败**，报错形如启动阻塞 ⇒ **极易误判成"启动慢 / 网络问题"**（见 J3）。
7. **`pnpm run <script>` 会先自动跑一次不带参数的 `install`**（副作用）。
8. **install 输出不能当验收**（报 `Done` / `exit 0` 仍可能是空壳树）—— 本项若涉及树，须逐条验。

### 6 · 回报格式

**结论先行**（一句话：**自述属实 / 不属实 / 未能定论**），然后：

1. **J1–J9 逐条**：命令原文 ＋ **原始输出** ＋ 判读。⛔ 不许只写"通过"。
2. **J1 / J2 两锚必须并列给出**（⛔ 不许只报一支）。
3. **机制取证**（J4）：行号 ＋ 原文片段 ＋ **三个机制问题的答案**（答不出写"未查到"）。
4. **实际通道信息**：node 版本 ＋ 哪条通道 ＋ kill 用的是 `taskkill /F` 还是 `SIGKILL`。
5. **未闭合项单列**（含你判断为"本项不该做"的）。
6. **自曝**：跑歪了 / 判据要订正 / 发现稿件矛盾，**直接写**。**「成因未知」是可接受的结论 —— 别为叙事完整编一个。**
7. **说"没有 / 不存在"必须附检索式与遍历范围**（否则不可验，等于没回答）。
8. **收尾核 `git status --short`** 并报出结果。

### 7 · 禁区

- ⛔ **不碰 CVM**（本项 = 本机 Windows 单场地；⚠️ "本机 ≠ CVM" ⇒ 结论**不得跨通道外推**）。
- ⛔ **不动依赖树**：不改 4 个探针包 / `harness/package.json` / `pnpm-lock.yaml`（本项不需要）。
- ⛔ **不碰**工程落点 `.dsh-home/profiles/sdk/` 的 `cordis.patch.yml` 与 `@larryagent/plugin-sandbox-dialect/` 两文件（J8 有锚）。
- ⛔ **不碰共享层** `.dsh-home/profiles/node_modules/`（241 条 junction，范围外）。
- ⛔ **不碰 `~/.dsh`**（全局 home；本项一律用**临时 home**）。
- ⛔ **`rm -rf` 一律禁用**（要清理用重命名备份；你自己的临时目录用 `fs.rmSync`）。
- ⛔ **凭据零落盘**：不打印、不写入、不落任何受版本控制的文件 / 日志 / 工具输出 —— 涉及 `backend/config.yaml`、任何 `.credentials.yaml`、CVM `~/.npmrc`。
- ⛔ **WSL 不参与**（DSH-3 贯穿规则）。

### 8 · 诚实边界（写明，避免后续误引）

- 本项**只**回答「**Windows 侧 named semaphore 的释放语义**（自述 vs 实测）」。
- ⛔ **不得**据此声称「resume 可用」或「跨进程 resume 已修」—— 3.2 的结论是**真缺口**，与本项无关、**不得混报**。
- ⛔ **不得**声称「锁机制无缺陷」—— 本项不测并发正确性、不测 TTL / 抢占 / 跨 logon session（J5 若未做，须写明）。
- ⛔ **不得**把结论外推到 CVM / Linux（那条走 `flock(2)`，**实现与内核对象都不同**）。
- ⛔ **不得**把"第二个写者能拿到"单独当"释放成立"的证据（J1 正锚缺位时该观测无意义）。
