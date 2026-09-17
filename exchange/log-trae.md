# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.2.1** · 锁子项：Windows 侧 named semaphore 的内核释放实测 | **Trae** | 本机 Windows | ✅ **已交回（2026-09-17）· 待复核** | 2026-09-17 |

- 已完成并复验（本段已清）：3.0 ✅ ／ 3.1 ✅ ／ 3.2 ✅ ／ 3.7.1 ✅ ／ 3.7.2 ✅ ／ **3.7.3 ✅（WB 逐条回源复核 J1–J11 全成立，一句话 = (a) 已清干净、两侧 lock 逐字节一致）**。
- **3.2.1 一句话结论**：**自述属实** ——「Windows 走 named kernel semaphore、持有期零文件系统足迹、持有者进程死亡即由内核释放、不设 TTL 抢占」在本机 **16/16 判据全部成立**（正负双锚齐备）；⚠️ 边界 = 只覆盖**同登录会话内跨进程**、**跨交互登录会话未实测**、**不外推 CVM/Linux**、**与 3.2 的 resume 结论无关**。
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

---

## ✅ DSH-3.2.1 回报 · Windows 侧 named semaphore 的内核释放实测

> 场地：**本机 Windows 单场地**（⛔ 未碰 CVM）｜结论全文与证据落盘见下；**证据目录** `D:\Code\_trae-evidence\321\`

### 0 · 结论先行

**自述属实。** 015 `dsh-session-persistence-jsonl` 关于 Windows 的那段自述 ——「**named kernel semaphore**、**零文件系统足迹**、**持有者进程死亡即由内核释放**、**故意不做 TTL 抢占**」——**在本机 16/16 判据全部成立**，且**正负双锚齐备**（J1 首写者活着 ⇒ 第二个被拒 `SessionAlreadyOwnedError`；J2 `taskkill /F` 后第二个**真拿到**，并由**独立内核探针**佐证"确实持有"而非"没人要"）。

⚠️ **边界（不得越过）**：只覆盖**同一登录会话内、跨进程**；**跨交互登录会话未实测**（本机只有一个交互会话）；**不外推 CVM/Linux**（那条走 `flock(2)`）；**与 3.2 的 resume 结论无关**（那是**真缺口**，本项不碰）。逐条见下文 J5 与「未闭合项」。

### 1 · 装置与一条命令复跑

| 件 | 路径 |
|---|---|
| 父进程（编排 ＋ 双锚 ＋ 取证 ＋ 判读） | [run-321-semaphore-release.mjs](file:///d:/Code/LarryAgent/harness/scripts/run-321-semaphore-release.mjs) |
| 子进程（直接驱动写租约 ＋ 独立内核探针） | [321-lease-child.mjs](file:///d:/Code/LarryAgent/harness/scripts/321-lease-child.mjs) |

复跑（本机 system 通道，`D:\App\node\node.exe`）：

```powershell
node harness/scripts/run-321-semaphore-release.mjs
# 退出码：0 = 全部判据成立 ／ 1 = 有判据不成立 ／ 2 = 装置自身故障 ／ 124 = 看门狗超时（沿用 run-s0-resume.mjs 约定）
```

**末次实跑结果（原文照抄）**：

```
preflight: node=v24.14.1 taskkill=C:\Windows\System32\taskkill.exe
PASS  J6-基线锚起跑全对  harness/pnpm-lock.yaml=OK ｜ harness/package.json=OK ｜ plugin-sandbox-dialect/package.json=OK ｜ .dsh-home/profiles/sdk/cordis.patch.yml=OK ｜ 落点 plugin-sandbox-dialect/index.js=OK
PASS  J6-A锁无孤儿(起跑)  工程=false 用户=false
PASS  J7-子进程自证(pid一致)  spawn=29136 自报=29136 node=v24.14.1
PASS  J4-B锁无文件足迹  lockPath=…\work-root\--d-Code-LarryAgent-harness--\s321-lease-0001\session.lock 存在=false 日志=143B
PASS  J1-正锚(第二个被拒)  ok=false name=SessionAlreadyOwnedError code=- msg=session "s321-lease-0001" is already owned by an active write handle
PASS  J4-内核对象确实被占用  Local wait=258 (WAIT_TIMEOUT(held by someone)) ｜ Global wait=0 (ACQUIRED(free))
PASS  J4-持锁期会话目录无锁文件(遍历范围)  sessionDir 全量列举 = [session.v3.jsonl.zstd]
PASS  J7-被杀进程确实在跑  tasklist: "node.exe","29136","Console","2","55,508 K"
PASS  J7-taskkill 生效(进程已消失)  taskkill exit=0 out="SUCCESS: The process with PID 29136 has been terminated." ｜ tasklist after="INFO: No tasks are running which match the specified criteria."
PASS  J2-负锚(首写者死后第二个能拿到)  ok=true pid=46704 sessionDir=…\s321-lease-0001 lockFileExists=false
PASS  J2-第二个写者真持有(独立探针仍等不到)  Local wait=258 (WAIT_TIMEOUT(held by someone))
PASS  J2-释放可重复(第二次杀后内核亦释放)  Local wait=0 (ACQUIRED(free))
PASS  J5-Local 与 Global 非同一对象  持有时 Local=258(WAIT_TIMEOUT(held by someone)) / Global=0(ACQUIRED(free))
PASS  J8-不污染基线  A锁={"repoExists":false,"userExists":false} 工作区已清=true
PASS  J8-5个基线锚收尾仍全对  （同上 5 个 OK）
PASS  J8-harness 侧除本项新增装置外无改动  git status --short 全文 = [M docs/dsh/dsh-migration.md ; ?? harness/scripts/321-lease-child.mjs ; ?? harness/scripts/run-321-semaphore-release.mjs]

结论：全部判据成立（16/16）
```

**⚠️ 装置姿态（★ 一处必须说明的设计选择）**：装置**不经 SDK 通道**，而是**直接驱动持久化后端**（`storage.create()+flush()` ／ `storage.open(id,'write')`）。

- 理由：SDK/CLI 通道第二个进程撞的是**「会话已存在」**（`-32603 already exists`，3.2 已定性）—— **到不了租约层**，取不到本项要的 `SessionAlreadyOwnedError`。
- 场地映射：装置给后端一个**临时 `root`**（`<证据目录>/work-root`），它等价于 `$DSH_HOME/sessions`；**两个写者同一 root ＋ 同一 session id** ⇒ 满足派发稿 §2 前置 1（名字由路径派生，home/session 必须同）。

### 2 · J1–J9 逐条（命令原文 ＋ 原始输出 ＋ 判读）

#### J1 · 【正锚】首写者活着 ⇒ 第二个写者被拒 ✅

写者 A（新进程，`create` ＋ `flush` 物化 ⇒ 取到租约）常驻；写者 B（**另一个新进程**）执行 `open(id,'write')`。

```
> node harness/scripts/321-lease-child.mjs open-try <root> s321-lease-0001 D:\Code\_trae-evidence\321\J1-open-try-second-writer.json
```
原始输出（`J1-open-try-second-writer.json` 摘）：
```json
{ "pid": 32724, "node": "v24.14.1", "id": "s321-lease-0001", "ok": false, "durationMs": 11,
  "error": { "name": "SessionAlreadyOwnedError",
    "message": "session \"s321-lease-0001\" is already owned by an active write handle",
    "sessionId": "s321-lease-0001", "isSessionAlreadyOwned": true,
    "stackTop": [
      "SessionAlreadyOwnedError: …",
      "    at SessionWriteLease.acquire (…/dsh-session-persistence-jsonl/lib/index.js:677:40)",
      "    at async JsonlSessionPersistence.open (…/dsh-session-persistence-jsonl/lib/index.js:2376:12)",
      "    at async …/harness/scripts/321-lease-child.mjs" ] } }
```
判读：拒绝**原样**是 `SessionAlreadyOwnedError`（`name` ／ `message` ／ `sessionId` 均原样报出；`code` 无 —— 该错误不带 `code`），**栈帧直接指向内核锁那条分支**（`:677` = win32 `EBUSY` → `SessionAlreadyOwnedError` 的映射点，调用面 `:2376`）。⇒ **正锚成立**。

#### J2 · 【负锚】`taskkill /F` 首写者 ⇒ 第二个写者能拿到 ✅

```
> taskkill /F /PID 29136
SUCCESS: The process with PID 29136 has been terminated.            (exit=0)

> tasklist /FI "PID eq 29136" /FO CSV /NH
INFO: No tasks are running which match the specified criteria.

> node harness/scripts/321-lease-child.mjs hold-open <root> s321-lease-0001 D:\Code\_trae-evidence\321\J2-holder-C-ready.json
```
原始输出（`J2-holder-C-ready.json` 摘）：`{ "ready": true, "pid": 46704, "sessionDir": "…\\s321-lease-0001", "lockFileExists": false }`（进程 C **未抛错**，`stderr` 0 字节 ⇒ 真取到写权并常驻）。
**佐证（防"能拿到"是假绿）**：C 常驻期间独立探针 `Local\` 零超时等待 = `258 WAIT_TIMEOUT` ⇒ **C 确实持有内核对象**；再 `taskkill /F` C 后探针 = `0 ACQUIRED(free)` ⇒ **释放可重复，不是一次性偶发**。
判读：**负锚成立**，且**不依赖"open 返回成功"这一条弱证据**。

#### J3 · 凡"锁"必标 A / B ✅

| 观测 | 归属 |
|---|---|
| 本项靶子（session 写租约、`SessionAlreadyOwnedError`、`Local\dsh-session-lock-…`） | **B 锁** |
| `$DSH_HOME/profiles/node_modules.lock`（`dsh-atomic-write`，**持有者死亡后永不回收**；残留 ⇒ 任何 dsh 命令 2 s 后 `atomic-write: timed out waiting for the writer lock`） | **A 锁** —— 起跑与收尾**两处**均实测**不存在**（工程 `.dsh-home/profiles/` ＋ 用户 `~/.dsh/profiles/`，`J6J7-preflight.json` ／ `J8-no-baseline-pollution.json`） |
| 装置是否碰过 A 锁 | **全程未碰**（装置只写临时 `root`，从不进 `profiles/`） |

#### J4 · 机制取证（读实物，不只凭自述）✅

实现实物（⚠️ `.pnpm` 目录名是**截断名**，不能按包名 glob；本机这一支 = `…@deepseek-ai+dsh-session-pe_eb36fbaa…`）：

| 行号 | 原文片段 |
|---|---|
| `:474-481` | `createSemaphoreW: kernel32.func("__stdcall","CreateSemaphoreW","intptr",["void*","int","int","str16"])` ／ `waitForSingleObject: … ["intptr","uint"]` ／ `releaseSemaphore: … ["intptr","int","void*"]` ／ `closeHandle: … ["intptr"]` |
| `:555-564` | ``const name = `Local\\dsh-session-lock-${createHash("sha256").update(resolve(path).toLowerCase()).digest("hex")}`;``<br>``const handle = api.createSemaphoreW(null, 1, 1, name);`` … ``const wait = api.waitForSingleObject(handle, 0);`` ``if (wait === WAIT_OBJECT_0) return handle;`` ``api.closeHandle(handle);`` ``if (wait === WAIT_TIMEOUT) throw win32Error("WaitForSingleObject", ERROR_SHARING_VIOLATION, path, name);`` |
| `:571-576` | `const released = api.releaseSemaphore(handle, 1, null); const closed = api.closeHandle(handle);`（`ReleaseSemaphore` ＋ 关句柄） |
| `:497` ／ `:563` ／ `:677` | `ERROR_SHARING_VIOLATION → "EBUSY"` ⇒ `if (error?.code === "EBUSY") throw new SessionAlreadyOwnedError(id);` |
| `:612-630`（自述段） | 「…Windows holds a **named kernel semaphore derived from that path — never a file lock or handle**, so readers, searches, and directory removal proceed freely while the lock is held. … the kernel releases the lock when the holder's descriptor or **last object handle closes, including on any process death**, so a crashed holder never blocks a successor. A live but wedged holder keeps the lock until its process exits: **there is deliberately no expiry**…」 |
| `:313` | `claimWrite(id) { if (this.writers.has(id)) throw new SessionAlreadyOwnedError(id); … }` —— **实例内**检查，与内核锁无关（派发稿前置 0 说的就是它） |
| `:723-727` | `release()` → win32 分支 `await releaseLockHandleWin32(this.held.handle)` |
| README `:158`（英）／`README.zh.md:158`（中） | 中译原文：「**每会话一个活动写入方**……内核锁（`session.lock` 上的非阻塞 `flock(2)`；**Windows 上为由该路径派生的命名内核信号量，零文件系统足迹**）……崩溃持有者的锁随其进程消亡，会话立即可再写入……（POSIX 上删除锁文件即放弃该排他；释放本身从不删除它）。……**Windows 信号量名按登录会话隔离**。」 |

**三个机制问题**：

1. **名字怎么来？** —— `Local\dsh-session-lock-<sha256( resolve(<会话目录>/session.lock).toLowerCase() )>`（`:557`）。**实测复核**：装置按同式独立算名（`J4-raw-probe-during-A.json.names.local`），在 A 持有期对该名零超时等待返回 **258**，在无人持有期返回 **0** ⇒ 派生式正确、且**对象真在内核命名空间**。两个写者算出的名字**逐字符相同**（`summary.json.samples` 中 A/C 两侧 `names.local` 相等）。
2. **代码路径上有几处"释放"？** —— 静态可见 **1 处显式释放**（`:571-575` `ReleaseSemaphore` ＋ `CloseHandle`，唯一调用点 `SessionWriteLease.release()` `:718-728`；写句柄 `close()` 走它，`open` 失败回滚也走它 `:2396`）；**第 2 条是内核侧的"进程终止时句柄全关"**，无对应源码行 —— 后者正是本项实测对象（J2，两次独立复现）。
3. **第二个进程如何判定"已被占用"？** —— `CreateSemaphoreW(null,1,1,name)`（同名已存在时**返回有效句柄、不报错**，这正是派发稿 §5 假绿坑 3）→ `WaitForSingleObject(handle, 0)` **零超时** → 非 `WAIT_OBJECT_0` 且为 `WAIT_TIMEOUT(258)` ⇒ 造 `ERROR_SHARING_VIOLATION(32)` 的 error，`errnoCode` 映射成 `code="EBUSY"`（`:497`）⇒ `:677` 转 `SessionAlreadyOwnedError`。**实测复核**：独立探针对同一时刻的零超时等待 = **258**，与 `:563` 的判据逐位对齐。

#### J5 · 作用域边界 ⚠️（一半实测、一半如实标注未做）

- **同一登录会话内、跨进程：实测成立**（J1/J2 全部证据）。
- **`Local\` 与 `Global\` 是否同一对象：实测** —— 持有期 `Local` 等待 258（被占）而 `Global` 等待 0（空闲），**两个名字空间不是同一对象**（`J5-scope.json`）。
- **跨交互登录会话：未实测**。`qwinsta` 实测只有 **两个会话**：`services`（ID 0 / Disc）与 `console`（ID 2 / Active，用户 `SuLarry`）——**没有第二个交互登录会话，且无凭据无法制造**（`J5-qwinsta.txt`）。⇒ 按 README `:158` 自述「**Windows 信号量名按登录会话隔离**」＋ 代码用 `Local\` 前缀，该前缀按 Win32 语义是**会话本地**命名空间，**跨登录会话不互斥**属**机制推断、非实测**。⛔ 因此本项**不得**声称"多用户 Windows 下也安全"。

#### J6 · 前置（A 锁 / 基线锚）✅

- A 锁**起跑与收尾均无孤儿**（见 J3 表）。
- 派发稿 §2 前置 2「先记改动前基线」：`git status --short` 起跑 = **clean**；§5 的 **5 个基线锚全部对上**（起跑 ＋ 收尾各一次，见 §1 复跑输出）。

#### J7 · 通道自证 ✅

- **通道**：`node v24.14.1`，可执行文件 `D:\App\node\node.exe`（即**本会话 system/PowerShell 通道**；⚠️ 本机 Bash 通道是 22.22.2 ⇒ **结论不可跨通道外推**）。父/子进程同二进制，子进程自报 `node` 与父一致。
- **kill 用的是 `taskkill /F /PID <pid>`**（`C:\Windows\System32\taskkill.exe`），**不是 `SIGKILL`**。实测原文：`SUCCESS: The process with PID 29136 has been terminated.`（exit=0）。
- **进程生命周期复核**：杀前 `tasklist` 显示 `"node.exe","29136","Console","2","55,508 K"`；杀后 `"INFO: No tasks are running which match the specified criteria."` ⇒ **不靠 taskkill 退出码单独下判**（假绿坑 5）。
- **只杀持有句柄的那个进程**：被杀的 29136 是**写者 A 本身**（装置直接 spawn node，无 shell 中间层；`spawn pid == 子进程自报 pid`，已断言）；A 无子进程。
- 装置自身不 open 那个内核名去"钉住"它：**探针每次用完立刻 `CloseHandle`**，且探针只在 A/C 持有期跑（见 J5 的 258/0 对照可反证探针不留残影）。

#### J8 · 不污染基线 ＋ 收尾清理 ✅

- 临时工作区 `<证据目录>/work-root`（**仓外**）跑完全部用例后 `rmSync` 删除，实测 `existedAfterCleanup=false`；**未用 `rm -rf`**。
- `$DSH_HOME`（工程 `.dsh-home` 与用户 `~/.dsh`）**全程未碰**：A 锁前后均不存在、`profiles/` 下三个禁区文件与落点锚**逐字节未变**。
- **`git status --short` 收尾原文**：
  ```
  M docs/dsh/dsh-migration.md
  ?? harness/scripts/321-lease-child.mjs
  ?? harness/scripts/run-321-semaphore-release.mjs
  ```
  ⇒ **`harness/**` 侧零改动**（只有本项新增的 2 个装置，未改任何受控文件 ⇒ 无需 `git diff --stat`）；`M docs/…` 是本项**有意**的结论回填（见 §4 自曝 ③）。

#### J9 · 若 J2 也红 —— 两种成因的区分 ✅（本项**无需触发**）

J2 成立 ⇒ 无需区分。装置仍把区分器落盘（`J9-discriminator.json`）以便将来红了能直接读：**J1 成立而 J2 不成立 ⇒ 锁生效但内核未随进程死亡释放（自述的释放语义不属实）**；**J1 也不成立 ⇒ 锁压根没生效，此时 J2 的"能拿到"不可作释放证据**。

### 3 · 未闭合项（本项**不做**或**做不了**，逐条列明）

1. **跨交互登录会话的互斥性：未实测**（理由与依据见 J5）。要实测需第二个交互会话（另一用户 / RDP）的凭据。
2. **并发正确性 / TTL / 抢占：本项不测**（判据原文即不含；自述明说"deliberately no expiry" ⇒ 本项只证"死亡即释放"，**未证**"活着但卡死会导致写入方长时间阻塞"的时长边界）。
3. **`flock(2)`（POSIX）侧：未做** —— 那条实现与内核对象都不同，**不得**用本项结论覆盖（3.2 在 CVM/Linux 侧跑过的是**会话 ID 复用**，**不是**锁的释放语义）。
4. **"谁在生产里 open 过这个名字"未查**（本项无人为占用，故无此场景）。
5. **`harness/scripts/s0-kill-child.mjs` 未被复用**（见 §4 自曝 ①②）。

### 4 · 自曝（跑歪 / 判据订正 / 稿件矛盾 / 有意偏离）

1. **偏离派发稿 §2 前置 4「器材优先复用，不另造」**：**未**复用 `s0-kill-child.mjs` / `run-s0-resume.mjs` 作驱动面。原因见 §1 —— SDK 通道第二个进程撞的是**存在性**（`already exists`）而非**所有权**，**够不到租约层**。**只抄了它们的形状**（子进程怎么起 / 退出码 0-1-2＋124 / 证据落盘结构），未 fork 其逻辑。
2. **`lib/index.js` 行号锚与派发稿有两处小差**（本机这一支实测）：自述段实际在 `:612-630`（派发稿写 `:615-619`）、`SessionAlreadyOwnedError` 抛出点在 `:677`（派发稿写 `:663-710`，实际 `:665-711` 是 `SessionWriteLease.acquire`、`:672-684` 是 win32 分支）。**判据不受影响**，但后续引用请以本回报行号为准。
3. **有意多做了 1 件（请复核时一并看）**：把结论回填入 [dsh-migration.md](file:///d:/Code/LarryAgent/docs/dsh/dsh-migration.md) 借鉴点表**第 12 条**。理由 = 本文件（`exchange/log-trae.md`）是**活日志**、闭环即删 ⇒ 不落别处结论会丢；且 3.1 / 3.2 均按此惯例回填。**若复核认为超范围，删该行即可，装置与证据不受影响。**
4. **装置自身两处首跑 bug（已修，记录备查）**：① `.pnpm` 目录名**截断**（实测 `@deepseek-ai+dsh-session-pe_<hash>`）⇒ 按包名前缀 glob 找不到，改为**逐目录读 `package.json` 的 `name` 比对**；② `spawnHolder` 的落盘函数把**已经是绝对路径**的入参又拼了一次证据目录 ⇒ `ENOENT …32\d:\Code\…`，改为直接 `writeFileSync`。
5. **判据口径订正 1 处（我自己加的判据，非派发稿判据）**：「除本项新增装置外无改动」**收窄为 `harness/**`**。理由：`docs/**` 的结论回填（自曝 ③）是**有意**动作，放在该判据里只会制造假红；`docs` 侧的实况改由「原样排出 `git status --short` 全文」把关。

### 5 · 说"没有 / 不存在"的检索式与遍历范围（否则不可验）

| 断言 | 检索式 / 口径 | 遍历范围 |
|---|---|---|
| **持锁期 `<会话目录>/session.lock` 不存在** | 装置内 `existsSync(join(sessionDir,'session.lock'))` ／ `readdirSync(sessionDir).sort()` | 会话目录 `…\work-root\--d-Code-LarryAgent-harness--\s321-lease-0001\` **全量列举**，实测 = `[session.v3.jsonl.zstd]`（**写者 A 持有期**与**独立探针期**两次分别取，见 `J1-holder-A-ready.json` / `J4-raw-probe-during-A.json.sessionDirEntries`） |
| **A 锁无孤儿** | `Test-Path` 两处 ＋ 装置 `existsSync` | `.dsh-home/profiles/node_modules.lock`（工程）与 `%USERPROFILE%\.dsh\profiles\node_modules.lock`（用户），**起跑 ＋ 收尾各一次** |
| **本机只有一个交互登录会话** | `qwinsta`（原文落盘 `J5-qwinsta.txt`） | 全量输出 = `services`(0/Disc) ＋ `console`(2/Active) |
| **`harness/**` 无改动** | `git status --short`（原文见 J8） | 仓库根 `D:\Code\LarryAgent` 全仓 |

### 6 · 通道信息（回报格式 §6.4）

**node** = `v24.14.1` ／ **通道** = 本会话 system（PowerShell）通道，可执行文件 `D:\App\node\node.exe` ／ **kill** = `taskkill /F /PID`（**非** `SIGKILL`）／ **pnpm** = 本项**未使用**（未动依赖树）。

