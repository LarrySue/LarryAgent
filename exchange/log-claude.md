# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

# DSH-3.7.3-T · 进行中回报（Claude｜2026-09-17）

> ⏳ **本件未完成**：`T1(a–d)` 与 `T2` **待 `DSH-3.2.1` 交回后开工**（前置 0，同场地同依赖树，并发会互相污染）。
> ✅ 已完成**零冲突项**（纯只读，不跑 DSH 会话、不写仓库）：前置 1 锚值核对、`T1(e)` 装置清单、**`T3` 全项**、**`T4` 全部三问**。证据落 `D:\Code\_claude-evidence\373t\`。

**通道**：本机 Windows ／ **bash(MSYS)** ／ `node v24.14.1 @ /d/App/node/node` ／ `pnpm.cmd 11.7.0` ／ **未走 CVM**（仅 T3(c) 读了一次 CVM lock 的 sha256）。

## 结论先行（已完成项）

| 项 | 一句话 |
|---|---|
| 前置 1 · 锚值 | ✅ **§5 六项全对**（尺寸 ＋ sha256 全等）⇒ 场地未被前序改动 |
| T1(e) · 清单 | ✅ 已清点：`scripts/` 顶层 **8 个 `.mjs`** ＋ 4 子目录（22 文件）｜`tests/` **14 个** — 待 3.2.1 交回后逐个说明跑/不跑 |
| T3 · 复算 | ✅ **四项全对**：`specifier:'*'` = **0**｜`0.0.1-rc.1` = **0**｜三包版本集合各只 `0.1.5-rc.2`｜两侧 lock **sha256 逐字节一致**｜4 探针包终态**完全符合** |
| T4 · 判据边界 | ⚠️ **发现 1 处未闭合假阳路径**（见下 §T4-3）＋ 1 处残余缺口（§T4-2）——修复方向对，但**未被覆盖** |

## T3 · 判据复算（命令原文 ＋ 原始输出）

**T3(a)** `grep -c "specifier: '\*'" harness/pnpm-lock.yaml` → **`0`** ｜ `grep -c "0\.0\.1-rc\.1"` → **`0`** ｜ 反向佐证 `grep -c "0\.1\.5-rc\.2"` → **`2177`**

**T3(b)** 遍历 `.pnpm/*/node_modules/{@scope/}*/package.json` **读 `name`/`version`**（脚本 `t3b-scan-pnpm.mjs`，⛔ 未用目录名 glob）：
```
实体条目总数: 2574（0 个不可读）
含 version === "0.0.1-rc.1" 的条目数: 0
@deepseek-ai/dsh-sandbox-local      : 版本集合 = 0.1.5-rc.2 ｜ 物理 entry 数 = 3
@deepseek-ai/dsh-storage-domain     : 版本集合 = 0.1.5-rc.2 ｜ 物理 entry 数 = 5
@deepseek-ai/dsh-sandbox-windows-acl: 版本集合 = 0.1.5-rc.2 ｜ 物理 entry 数 = 2
```
**T3(c)** 本机 `sha256 = a03ede8de3f00ee3e35edd6751da6429f6dd7913e0451cd33420a2d4a096ffed`（541493 B）＝ CVM 同值 ⇒ **两侧逐字节一致** ✅（CVM 侧另核：`package.json` 1283 B/`e4d338caa2a0431b`、`dialect` 551 B/`9d6f4794a8aec191`，`packages/` = **7** 包，**无 `.git`** 与记载一致）

**T3(d)** `plugin-probe` / `plugin-sandbox-probe` = `{"@deepseek-ai/cordis":"^4.0.2"}` ＋ `{"optional":true}`；`plugin-sandbox-mount-probe` / `plugin-storage-probe` = **两段均不存在** ✅

## T4 · 判据修复的边界评估（读码，未改代码）

**T4-1 · `p2LogPath` 语义**：**改动前后不一致**。
- 改前（据 `s0-resume.test.ts:308-312` 注释所记旧片段 **推断** ⚠️ 该片段只含 `p2Log` 定义与 `p2LandedOnSameLog` 赋值，**改前 `p2LogPath` 的写法无独立来源**）：`p2Log = find(l => l.hasP2 && l.hasP1 === false)` ⇒ 恒指「**P1 之外**那条含 P2 的日志」，按构造**永不**指向 P1 所在日志。
- 改后（`:313-321`）：`landedOnP1Log === true` ⇒ 指 **`p1Log.path`（与 `p1LogPath` 同值）**；`false` ⇒ 指 `otherP2Log?.path ?? null`。
⇒ 语义由「P2 独占的那条」改为「**P2 实际落在哪条**」（更正确），但**下游须知**：`p2LogPath === p1LogPath` 在 `true` 分支下是**预期**、不是异常。

**T4-2 · `null` 与 `false` 能否区分**：**机器下游不存在** —— `run-s0-resume.mjs`（106 行通读）只收集 exit code、落 `*.resume.json`、打 PASS/FAIL，**完全不读 `resumeTarget`** ⇒ 该字段**只写不读**，唯一读者是人。人的判读表：

| `p2LandedOnSameLog` | `p2LogPath` | 含义 |
|---|---|---|
| `null` | `otherP2Log?.path ?? null` | 无任何日志含 P1（`:354` 断言会 FAIL，但证据已在 `:324` 落盘） |
| `true` | ＝ `p1LogPath` | P2 落在 P1 那条 ✅ |
| `false` | 路径 | P2 落在**另一条**日志 |
| `false` | `null` | **P2 未落盘**（第二轮失败/没写日志） |

⇒ **可区分**，但 `false` **混合了两种语义**，须靠 `p2LogPath` 是否为 `null` 才能分开，而**证据里没有独立字段**表达「P2 无落盘」、也无文字说明此组合 ⇒ **残余缺口**（建议：加 `p2LogFound: boolean`，或把该分支的 `p2LogPath` 写成 `'(none)'` 以别于 `null`）。

**T4-3 · `hasP1`/`hasP2` 取法 ＋ 是否会被骗**：`logsEvidence():219` = **`text.includes('OK-P1'/'OK-P2')`**，`text` 是整篇解码后的会话日志（每行一个 JSON 事件）⇒ **纯子串匹配，不分事件类型、不分轮次、不分角色**。

⚠️ **会被骗到——且存在一条未被修复覆盖的假阳路径**：
1. `sessionLogs` 顺序由 `listSessionLogs()` 定为 **mtime 新→旧**（`s0-session-log.ts:27`）；
2. `p1Log = sessionLogs.find(l => l.hasP1)` ⇒ 取**最新**那条含 P1 的日志；
3. 若 P2 实际落在**另一条**日志，而那条日志因 **resume 载入 P1 历史**（或模型复述、或 `request/context` 帧带入）而含 `OK-P1` ⇒ 该日志 `hasP1 = true` ⇒ **`p1Log` 误指向 P2 的日志**；
4. 该日志必然 `hasP2 = true` ⇒ **`p2LandedOnSameLog` 报 `true` —— 假阳**（真相应是"另开了一条日志"）。
5. `key` 变体的断言（`:354-355`）只查 `p1Log` defined，**不校验它真是 P1 的落点** ⇒ **拦不住**。

根因是**名实不符**：字段名/注释暗示 `hasP1` = "这条日志是 P1 的落点"，实现却只是"这段文本含该串"。
⚠️ **以上为读码推断，须实测确认** ⇒ 已列入 T2 的验证动作：逐条读 `sessionLogs` 的 `path`/`bytes`/`lastEventType`/`hasP1`/`hasP2`，**用日志条数与路径交叉验证**布尔值，不只信 `true`/`false`。

## 开工前核出的两处**记载与实际不符**（先报差异）

1. **node 通道**：派发单记「Bash 通道 = `22.22.2`（managed）／ system = `24.14.1`」，实测 **Bash 通道只有一个 node = v24.14.1**（`which node` → `/d/App/node/node`，PATH 无第二份；`AppData/Local/node` 下只有 `corepack`，**无 node.exe**）⇒ **两条通道同版本，"通道不同"的提示在本机当前**不成立**。⚠️ 若某处结论依赖「22.22.2 那条通道」，需重核。
2. **「本机 2574 个 `package.json`」—— 我先判错、现自纠**：`find` 口径得 585/577（`.pnpm/<dir>/node_modules/<pkg>` 是**符号链接**，`find` 默认不进入），正确口径（读 `package.json`）得 **2574** ⇒ **派发单没写错，是我口径错**。

## 待办（前置满足后立即执行）

- `T1(a)` e2e ＋ `(b)` build ＋ `(c)` 四个 `test:isolated*`（⚠️ 哨兵组本就应红）＋ `(d)` `dsh-prompt.mjs`（⚠️ `pwd -W` 必须）
- `T2` `S0_RESUME_VARIANT=same-proc` 触发 `true` 分支 ＋ **逐条 `sessionLogs` 交叉验证**（含上面 §T4-3 的假阳验证）
- 收尾核 `git status --short` ＋ T1(e) 逐件说明

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.3-T** · 工程卫生块的独立测试件（T1–T4） | **Claude** | 本机（CVM 只读核可选） | 🚀 **已派发（2026-09-17）** ｜ ⏳ **等 DSH-3.2.1 交回后开工** | 2026-09-17 |

- ⚠️ **执行时机**：老大已定「**Trae 先做、你后做**」。**等 `DSH-3.2.1`（Trae，本机）交回再开工** —— 两者都要在本机跑 DSH 会话、争同一棵 `harness/node_modules` 与同一个 `.dsh-home`，并发会互相污染。
- 任务清单与进度以 `TODO.md`「DSH-3」区为准；本区只放**怎么做**。

---

## 🚀 DSH-3.7.3-T · 工程卫生块的独立测试件

> **派发日**：2026-09-17 ｜ **执行人**：Claude ｜ **场地**：本机（CVM 仅只读核，可选）
> **被验对象**：DSH-3.7.3（Trae 2026-09-17 交付）—— 旧代依赖清理 ＋ CVM 副本补齐 ＋ 3.2 判据缺陷修复。WB 已逐条回源复核 **J1–J11 全成立**。

### 0 · 为什么派你，且为什么**不是**重测那些判据

**本件不重测 J1–J11**。要补的是两个**结构性盲区** —— 它们都落在「**改的人自证**」的禁区：

1. **本块动的是共享依赖树**（`harness/node_modules`，本机 2574 个 `package.json`）⇒ **影响面超出本块判据**。Trae 与 WB 一共只跑了 **两条** 回归（方言件 e2e ＋ `pnpm build`）。**其余在飞装置是否仍绿，无独立验证。**
2. **③ 改了判据代码，但目标行为从未被观测到** —— `resumeTarget.p2LandedOnSameLog` 的真语义是"P2 落在 P1 那条日志上"，而**没有任何一次运行观测到 `true`**（015 现状下跨进程复用同 ID 被拒）。当前只证了「实现**不再排除** `true` ＋ 实跑取值与原始分布自洽」。这是**「实现正确、声明过度」的高危区**。

⇒ 你的角色 = **独立测试方**：独立复跑、独立取数、独立判定。**不采信 Trae 的证据文件**，也**不必重复 WB 已做的逐条复核**。

### 1 · 测试项

#### T1 · 独立全套回归：确认依赖树变动**没打断任何在飞装置** ★ 覆盖面最广

跑本机 `harness/` 下**现有**的可跑件，逐条给出**你独立取到的** exit code 与关键观测：

| # | 对象 | 跑法 | 期望 |
|---|---|---|---|
| a | `harness/scripts/run-372-dialect-e2e.mjs` | `S372_EVIDENCE_DIR=<你的临时目录> node harness/scripts/run-372-dialect-e2e.mjs` | `exit 0` ＋ 双锚成立 ＋ 跑完 patch 复位回 **769 B ／ `74400d260d5d4e6c`** |
| b | `pnpm.cmd build`（在 `harness/`） | — | `rc = 0` ＋ 3 包 `Done` |
| c | `pnpm.cmd test:isolated` ／ `test:isolated:sentinel` ／ `:sentinel-key` ／ `:sentinel-unset` | 见 `harness/package.json` 的 `scripts` | 逐条 exit code。⚠️ **哨兵组本就应红**（它们验的是"注入真实 home 必须 FAIL"这类负向），⛔ **别把预期红判成回归** |
| d | `harness/scripts/dsh-prompt.mjs` | `DSH_HOME="$(pwd -W)/.dsh-home" node harness/scripts/dsh-prompt.mjs …` | `rc = 0`。⚠️ **`pwd -W` 不是可选的**（Git Bash 的 env 值不做路径转换 ⇒ `/d/Code/…` 会被 Windows node 解析成 `D:\d\Code\…` ⇒ DSH 自建空 home ⇒ **无 key 假绿**）；详见 `docs/production-env.md` §12.7 附二 |
| e | **装置清单自证**（⚠️ 必做） | 列出 `harness/scripts/` 与 `harness/tests/` **全部**可跑件，逐个说明「跑了 / 为什么没跑」 | 说"没有"须附**遍历范围** |

⭐ **T1 的关键要求**：**"没打断"必须由你自己跑出来**。⛔ 不许只跑 (a)(b) 两条就收口 —— 那正是已被跑过的两条；**(c)–(e) 才是新增覆盖面**。

#### T2 · 【核心】`true` 分支的独立触发尝试 ★ 本件最有价值的一项

**已知事实**（供你判断，不必重核）：修复后的判据是

```ts
const p1Log = evidence.sessionLogs.find((l) => l.hasP1) ?? null
const landedOnP1Log = p1Log !== null && p1Log.hasP2 === true
evidence.resumeTarget = {
  p1LogPath: p1Log?.path ?? '(none)',
  p2LandedOnSameLog: p1Log === null ? null : landedOnP1Log,
  p2LogPath: landedOnP1Log ? (p1Log?.path ?? null) : (otherP2Log?.path ?? null),
}
```

**要回答的一件事**：**存在某种姿态，能让 `p2LandedOnSameLog` 观测到 `true` 吗？**

- **首选实验**：`S0_RESUME_VARIANT=same-proc`（同进程内同 ID 连发两次）。理由：`key` 变体**跨进程**被拒（`-32603 session "…" already exists`），而 **same-proc 的第二轮能跑通** ⇒ 两轮的 P1/P2 应落在**同一条** session 日志上 ⇒ `p1Log.hasP2` 应为 `true`。
- **第二候选**：`forward` 变体（两次新 UUID）—— 预期落**两条不同**日志 ⇒ `false`，可当**反向对照**。
- **判法**：读 `evidence.sessionLogs` 的**逐条 `hasP1`/`hasP2`** ＋ `resumeTarget` 实际取值，**两者须自洽** —— ⚠️ **自洽要你自己演算一遍**，不采信报告里的"自洽"声明。
- ⚠️ **两种结局都有价值**：
  - ⭐ **观测到 `true`** ⇒ **推翻**当前记的边界「015 现状下该字段仍不可观察到 `true`」= **重要发现**，须给完整证据链。
  - **仍未观测到** ⇒ 须给出**可验证的具体原因**（是第二轮没跑通？还是 P1/P2 落在不同日志？还是 `hasP2` 的取法有问题？**是哪一个，用数据说**）。⛔ **不许写"试过了不行"**。
- ⚠️ **场地**：`key` ／ `same-proc` 的既往结论只在 **CVM** 上得过 ⇒ 若在**本机**跑，**结论只能写在本机这条通道上**，⛔ **不得与 CVM 结论互推**；若走 CVM，须**原样声明**并注意 CVM 的 `~/harness` 是 **tar 副本（无 `.git`）**。

#### T3 · 关键判据的独立复算（**不看 Trae 的证据文件**）

只做**机器可判**的复算，逐条给**你自己的命令 ＋ 原始输出**：

| # | 复算什么 | 口径要求 |
|---|---|---|
| a | 本机 `harness/pnpm-lock.yaml`：`specifier: '*'` 与 `0.0.1-rc.1` 的出现次数 | 应为 **0 ／ 0** |
| b | 本机物理树：遍历 `.pnpm/*/node_modules/{@scope/}*/package.json` **读 `name`/`version`**（⛔ **不得用目录名 glob**：pnpm 长包名目录是**截断名**，用包名匹配**必然 0 命中**），报含 `0.0.1-rc.1` 的条目数，以及三包（`dsh-sandbox-local` ／ `dsh-storage-domain` ／ `dsh-sandbox-windows-acl`）的**版本集合**与**物理 entry 数** | 命中 **0**；三包版本集合各只 `0.1.5-rc.2` |
| c | 两侧 `harness/pnpm-lock.yaml` 的 **sha256** 是否相同 | 应相同（541493 B） |
| d | 4 个探针包 `package.json` 的 `peerDependencies` ／ `peerDependenciesMeta` 终态 | `mount-probe` ／ `storage-probe` **两段均不存在**；`probe` ／ `sandbox-probe` = `^4.0.2` ＋ **保留** `optional` |

#### T4 · 判据修复的**边界**独立评估（读码 + 给判断，**不改代码**）

读 `harness/tests/s0-resume.test.ts`（`VARIANT === 'key'` 那段）与 `harness/tests/s0-session-log.ts`，回答：

1. `p2LogPath` 的语义现在是什么？改动前后**是否一致**（改动后它指向谁）？
2. 新判据在 `p1Log === null` 时给 `null` —— 这个 `null` 与"观测到 `false`"在下游**能否被区分**？
3. `logsEvidence()` 的 `hasP1`/`hasP2` **怎么来的**（读的是哪个字段）？⇒ 该判据**会不会被"非 P2 内容里出现的同名字符串"骗到**（例如模型复述里带了 tag）？

⚠️ 本项**不要求改代码**，只给判断与依据。**若你发现修复本身还有缺陷，直接写进回报** —— 这正是独立测试方的价值。

### 2 · 前置

- **前置 0 · 等 3.2.1 交回**（见 §0 时机说明）。
- **前置 1 · 核场地是否被前序改动**：开工先跑 `git status --short`（应 **clean**）＋ 核 §5 锚值；⚠️ **对不上先报差异、再动手**。
- **前置 2 · 构建产物就位**：`harness/packages/*` 里有 `src/index.ts` 的包必须有 `lib/index.js`（`scripts/run-s0-resume.mjs` 会检、缺则退 `2`）。缺 ⇒ 先 `pnpm.cmd build`。
- **前置 3 · 凭据**：T1(d) ／ T2 需要真 key，按**既有装置原样引用**（环境变量注入；`scripts/run-s0-resume.mjs` 只判存在性、不读值）。⛔ **值不得落稿 ／ 不得落任何受版本控制的文件 ／ 日志 ／ 工具输出**。
- **前置 4 · 临时 home**：⛔ **禁止注入真实 home** —— `harness/tests/isolated-setup.ts` 会强制覆盖为临时目录 ＋ 正向白名单守卫，注入真实路径会触发 `sentinel-failfast` 判 FAIL。

### 3 · 交付物

- 一份**测试报告**（写在本文件）：T1–T4 逐条 **命令原文 ＋ 原始输出 ＋ 独立判读**。
- 证据落盘：本机 `D:\Code\_claude-evidence\373t\`（新建）。⛔ **不采信、不转发 Trae 的证据文件**作自己的判据；若引用，须**明确标注为"引用"**。
- **结论先行**：每项一句话（通过 ／ 未通过 ／ 未能定论）。

### 4 · 参考件四要素

① **路径（可复制）**

| 路径 | 作用 |
|---|---|
| `D:\Code\LarryAgent\harness\scripts\run-372-dialect-e2e.mjs` | T1(a) 回归装置（**只跑、不改**） |
| `D:\Code\LarryAgent\harness\scripts\run-s0-resume.mjs` | T2 装置（变体 = `forward` ／ `reverse` ／ `key` ／ `same-proc`） |
| `D:\Code\LarryAgent\harness\tests\s0-resume.test.ts` | T2 的装置 ＋ T4 的**评审对象**（修复后版本；两侧哈希一致 `dab57a0ed2c3f64e`） |
| `D:\Code\LarryAgent\harness\tests\s0-session-log.ts` | **多帧 zstd 回读**的现成器材（要读会话日志**先用它**，⛔ 不要自造） |
| `D:\Code\LarryAgent\harness\package.json` | T1 的 `scripts` 清单（`test:isolated*` ／ `test:real-api*` 等） |
| `D:\Code\LarryAgent\docs\local-env.md` | 本机环境与锁的实测口径 |
| `D:\Code\LarryAgent\docs\production-env.md` §12.7 附二 | `pwd -W` 那个坑的三写法实测对照 |

② **怎么参考**：`s0-session-log.ts` **读码 ＋ 复用**（多帧 zstd 那个坑已在里面处理好了）；其余**只跑不改**。

③ **参考程度**：**可抄调用式**（环境变量怎么给、退出码怎么定、证据怎么落）；⛔ **不要改装置源码**。

④ **哪部分不可参考（★ 必须逐条看）**
- ⛔ **`s0-resume.test.ts` 在两边**：T2 里它是**你要触发的装置**，T4 里它是**你要评审的对象** —— 分开写，别混。
- ⛔ **`run-372-dialect-e2e.mjs` 会改工程 `.dsh-home/profiles/sdk/cordis.patch.yml`**（跑完自己复位）⇒ **跑它期间别并发跑别的 DSH 装置**；⚠️ 用 `S372_EVIDENCE_DIR` 把输出指到**你的**临时目录，⛔ 别覆盖别人的证据。
- ⛔ `tests/sentinel-*.test.ts` **本就是"应当失败"的哨兵**（见 T1(c) 注解）。
- ⚠️ §5 锚值**取自 2026-09-17 本机实物**；对不上 ⇒ **先报差异再动手**（快照会过期）。

### 5 · 场地与器材

**本机**
- 仓库根：`D:\Code\LarryAgent`；工作区：`harness/`（pnpm workspace，`packages/*` 共 **7** 个包）
- ⚠️ **node 两条通道版本不同**：Bash 通道 = **`22.22.2`**（managed）／ system `D:\App\node` = **`24.14.1`** ⇒ **回报必须注明你走的是哪条**（**通道不同则结论不可互推**）。
- pnpm **`11.7.0`**；⚠️ **本机须用 `pnpm.cmd`**（裸 `pnpm` 在本机 Bash 通道下必崩：npm 的 sh 垫片缺 `sed`/`dirname`/`uname`，且入口会错解析到 `D:\node_modules\pnpm\bin\pnpm.mjs` ⇒ 报 `Cannot find module` **是通道问题、不是工程问题**）。
- 基线锚（开工前核对，**对不上先报**）：

| 对象 | 尺寸 | sha256 前 16 |
|---|---|---|
| `harness/pnpm-lock.yaml` | 541493 B | `a03ede8de3f00ee3` |
| `harness/package.json` | 1283 B | `e4d338caa2a0431b` |
| `harness/packages/plugin-sandbox-dialect/package.json` | 551 B | `9d6f4794a8aec191` |
| `.dsh-home/profiles/sdk/cordis.patch.yml` | 769 B | `74400d260d5d4e6c` |
| `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-sandbox-dialect/index.js` | 4087 B | `022b0ff5efd11648` |
| `harness/tests/s0-resume.test.ts` | 16328 B | `dab57a0ed2c3f64e` |

**已知假绿坑**
1. **`install` 输出不能当验收**（报 `Done` ／ `exit 0` 仍可能是空壳树）⇒ 必须**遍历读 `package.json`** 逐条验。
2. **遍历 `.pnpm` 不能用目录名 glob**（**截断名**，实测形如 `@deepseek-ai+dsh-sandbox-lo_fc402b20…`，`local` 被砍掉）⇒ 用包名匹配目录名**必然 0 命中**。
3. **「装置存盘的 stdout」≠「工具返回原文」**：`*.prompt.stdout.txt` 是 `dsh-prompt.mjs` 的 `finalResponse`（**模型复述**）；**工具返回原文**在 DSH 会话日志的 `tool/result` 帧里 ⇒ 引用时**注明取自哪个面**。
4. **会话日志是多帧 zstd 串联**：`zstdDecompressSync` **只解第一帧**（得半截、**不报错**）⇒ 用 `harness/tests/s0-session-log.ts`，⛔ 别自造。
5. **产物归属只认运行自报的标识**（`dsh-prompt.mjs` 的 stderr `[dsh-prompt] session=…`）—— 同 cwd 的会话是**多次运行叠加**，按 mtime 两两分组会得出**符号相反**的结论。
6. **`pnpm run <script>` 会先自动跑一次不带参数的 `install`**（副作用）。

### 6 · 回报格式

**结论先行**（T1–T4 各一句），然后：

1. **逐条**：命令原文 ＋ **原始输出** ＋ 判读。⛔ 不许只写"通过"。
2. **T2 的两种结局都要写全**；未观测到 `true` 时**必须给出可验证的具体原因**（用数据说）。
3. **通道信息**：node 版本 ＋ 哪条通道 ＋ 是否走了 CVM。
4. **未闭合项单列**。
5. **自曝**：跑歪了 ／ 发现判据缺陷 ／ 发现稿件矛盾，**直接写**。**「成因未知」是可接受的结论 —— 别为叙事完整编一个。**
6. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
7. **收尾核 `git status --short`** 并报出结果（独立测试动作自身也会改现场）。

### 7 · 禁区

- ⛔ **不改** `harness/**` 下任何**受版本控制**的文件（本件是**独立测试**）—— 若取证需写脚本，落在 `D:\Code\_claude-evidence\373t\`，**不进仓库**。
- ⛔ **不碰 CVM `~/larry-dsh-home/profiles/sdk`**（012 代生产参照，另议）；⛔ **不碰 CVM 的 lock ／ 树**（只读核即可）。
- ⛔ **不碰**工程落点 `.dsh-home/profiles/sdk/` 的 `cordis.patch.yml` 与落点两文件（T1(a) 由装置自身复位）。
- ⛔ **不碰共享层** `.dsh-home/profiles/node_modules/`（241 条 junction）。
- ⛔ **不重装依赖树**（不做 `pnpm install`）—— 本件只**验**树、不**改**树。若你判断必须重装才能验，**先回报、等指示**。
- ⛔ **`rm -rf` 一律禁用**；清理用 `fs.rmSync(...,{recursive:true})` 且**只指向你自己的临时路径**。
- ⛔ **凭据零落盘**（同上）。
- ⛔ **WSL 不参与**。

### 8 · 诚实边界

- 本件是**补充验证**，**不替代** WB 的复验结论；⛔ **不得**据本件声称"3.7.3 被判通过 ／ 失败"（判定权在 WB）。
- ⛔ **不得**把 T2 的结果外推成"resume 可用"或"resume 不可用"—— 本件只回答「**该字段的 `true` 分支能否被观测到**」。
- ⛔ **不得**把本机（Windows）结论与 CVM（Linux）结论互推。
- ⛔ **不得**声称"全套回归已覆盖" —— 覆盖面 = 你在 T1(e) 里**列出并跑过**的那些；**未列出的即未覆盖**。
