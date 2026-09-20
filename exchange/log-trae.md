# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4** | Trae | 本机（Windows） | 🚀 **已派发 · 等回报** | 2026-09-20 |

- 已完成并复验（各段已按交流区规矩清理）：3.0 ✅ ／ 3.1 ✅ ／ 3.2 ✅ ／ 3.7.1 ✅ ／ 3.7.2 ✅ ／ 3.7.3 ✅ ／ **3.2.1 ✅（WB 复核：结论认可，另订正 3 处）**。
- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3」区**（**一处两面**）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯时用 `git log -p -- exchange/log-trae.md`。
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.2.1 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— 本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，出现英文即非本机原始产物）。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

---

## 🚀 DSH-3.7.4 · 本机 `s0-e2e` 装置缺陷修复（`cp -r` profile ⇒ pnpm 虚拟 store 失配）

### 0 · 目标（要回答的一个问题）

本机 `harness/tests/s0-e2e.test.ts` **为什么跑不起来**、**为什么同一装置在 CVM 是绿的**，并把它修到「**本机五个变体全部按其自身期望落位**」。

⚠️ **两个容易被混成一件的结论，请分开写**：
- **(i) 现象层**：本机五变体落红、CVM 绿 —— 已由 WB 双侧实测确认；
- **(ii) 机制层**：为什么会这样 —— **成因未定，这是本块第一件事**。

### 1 · 判据（逐条编号；缺任一条即未闭合）

**J1 · 定性在前**：给出「**为什么本机 pnpm 把 `virtualStoreDir` 写成绝对、CVM 写成相对**」的**成因证据**，须含**对照实验**（至少两组、控制变量）；⛔ 不得只给候选列表、不得以"可能是 X"结题。
⚠️ **此项必须在动代码之前完成** —— ⛔ 不得先改代码再补成因。

**J2 · 修复生效**：本机 `harness/` 下跑一键复跑器，**五个变体全部 `exit=0`**，且 `S0_EVIDENCE_DIR` 里五份 `*.evidence.json` 的 `criteria` **逐件**与下表一致。

| 变体 | 退出码期望 | 该变体的判据期望（**权威源 = `s0-e2e.test.ts:327-377`，逐件读**） |
|---|---|---|
| `base` | **0** | ②_activated=`true` ／ ②_injectFired=`true` ／ ②_toolRegistered=`true` ／ ①_toolNameIsOurs=`true` ／ 回包含 nonce ／ ③ ok=`true` ／ ④_sessionContainsNonce=`true`（**全绿**） |
| `no-bundle` | **0** | ②_activated=`false` ／ ①_toolNameIsOurs=`false` |
| `wrong-key` | **0** | ③ ok=`false` ／ `errorCode` 非空 ／ ②_activated=`true` |
| `no-session-dir` | **0** | `logPresent`=`false` ／ ④_sessionContainsNonce=`false` ／ ②_activated=`true` |
| `kill-client` | **0** | ④_killedBy ≠ `child-exited-first` ／ `logPresent`=`true` ／ `bytes`>0 ／ ④_sessionContainsNonce=`false` |

⚠️ **负向变体的退出码期望也是 `0`** —— 它们由测试**内部断言"该判据变红"**，装置自身不红。
⛔ **别按"负向就该红"理解** —— 我方在 3.7.3-T 派稿里正是在这里写错过口径（"哨兵组本就应红"），别重蹈。

**J3 · 双锚**：每条负向变体须**同时**报出两组值 —— **变红项** ＋ **"链路是活的"锚**（装置已内建：`no-session-dir` 的 `②_activated`、`kill-client` 的 `logPresent`/`bytes`）。缺锚值 = 该变体的结论不可立。

**J4 · 源 profile 未被改写**：`.dsh-home/profiles/sdk` 全程不得被写入（比 `package.json` 的 deps ／ `plugin-tool-readfile` 出现次数 ／ `node_modules` mtime）。缺 = 未闭合。

**J5 · 转出项 ①**：`no-session-dir` 变体的 `chmodSync(dir, 0o500)`（`s0-e2e.test.ts:252`）**在 Windows 上是否真能令 ④ 变红**（3.7.3-T 被"负向 3"先拦、未判）。给出判定 ＋ 证据（`logPresent` 实测值 ＋ **至少一次复跑**）。
📎 **与 Claude 的 `3.7.4-T` 分工**：本项在**装置层**（跑变体看结果）；`T-1-a` 在**机制层**（最小装置测 `chmod` 语义）。两层合起来才硬，不是重复。

**J6 · 转出项 ②**：**`pwsh` 受限路径 ⇒ fail-safe 假红**（3.7.2 段「未闭合 7」／ 3.7.3-T 全景取证转入本块）。给出判定 ＋ **可复现的触发式**（命令 ＋ 观测）＋ 该路径下 `unpatched` 态是否被判 FAIL。

**J7 · 原文不得后处理**：所有工具输出的"原文"**原样落盘（含编码）**；⛔ 禁手工整理 ／ 意译 ／ 把本地化文字英文化。报出 `S0_EVIDENCE_DIR` 路径与文件清单。

**J8 · 前提会失效**：动手前**逐条重新实测**下列前提并报实测值 —— 与本稿所给不符则**先报差异、再动手**：

| 前提 | WB 2026-09-20 实测值 |
|---|---|
| `harness/node_modules/.modules.yaml` | `nodeLinker=isolated` ／ `virtualStoreDir`=**绝对** |
| `.dsh-home/profiles/sdk/node_modules/.modules.yaml` | `nodeLinker=hoisted` ／ `virtualStoreDir`=**绝对** |
| `harness/.s0-evidence/` | **不存在** |
| `s0-e2e.test.ts` 行号锚 | `:20 cpSync` import ／ `:92 installPlugin` ／ `:238 cpSync` ／ `:246 installPlugin()` ／ `:327-377` 五变体断言 |

### 2 · 判据前置（不满足 ⇒ 实验根本没跑起来）

- **P-a · 清孤儿锁**：跑前清 profile 孤儿锁（`tests/real-api.ts:215-242` 的 `releaseOrphanProfileLock` 已内建；只清**死 PID**、**重命名备份**、不删除）。不清会伪装成 `initialize timed out` ／ `JSON-RPC input closed`。
- **P-b · 构建产物**：被测插件 `packages/plugin-tool-readfile` 的 `main` 入口须存在。缺 ⇒ 复跑器自身报错并 `exit 2`（**`2` ≠ 测试失败**）；此时先 `cd harness && pnpm --filter "./packages/*" run build` 再跑。
- **P-c · 真 Key**：`base` ／ `kill-client` 必须真 key（**只判存在性、不读值、不打印、不落盘**，由老大提供、只经环境变量注入）；`wrong-key` 用 `DSH_REAL_API_BAD_KEY` 占位串即可。
  **不通过 ⇒ 走哪条路**：**拿不到 key 时**，**不跑** `base` ／ `kill-client`，只跑其余三条，并在回报里**显式注明"未跑 base（无 key）"** —— ⛔ 不得用假 key 顶替 `base`。

### 3 · 交付物

- **证据落盘**：`S0_EVIDENCE_DIR`（默认 `D:\Code\LarryAgent\.s0-evidence`，**本机当前不存在**、跑起来自动建）下每变体各一份 `*.evidence.json` ＋ `*.marker.log` ＋ `*.session.txt`。
- **代码改动**：位置由 J1 的成因定（可能在 `s0-e2e.test.ts` 的复制步骤 ／ 复跑器 ／ profile 生成方式）。
- **回报**：写本文件**顶部状态区之后**（活日志规矩：已闭环段会被清理，**别把承接目标指向本文件**）。
- **退出码约定**：每变体 `0`=PASS ／ `1`=FAIL ／ `2`=构建产物缺（≠ FAIL）／ `124`=超时（默认每变体 12 min，`S0_VARIANT_TIMEOUT_MS`）。

### 4 · 参考件四要素

| # | 件 | ① 路径 | ② 怎么参考 | ③ 参考程度 | ④ **不可参考** |
|---|---|---|---|---|---|
| a | 一键复跑器 | `harness/scripts/run-s0-e2e.mjs` | 读环境变量与退出码约定；按它的用法跑 | **可照用调用式** | 其汇总行的"期望 PASS"注释**不是判据来源**；判据在测试断言里 |
| b | 变体期望的**权威**来源 | `harness/tests/s0-e2e.test.ts:327-377` | **逐件读**每个 `if (VARIANT === …)` 分支 | **以此为准** | ⛔ 别按"组"给口径 |
| c | 断言机制 ／ 假绿坑 | `harness/tests/real-api.ts`（文件头 1–7 条 ＋ `:215-242`） | 读"判据 ／ `exit 0` 不可当判据 ／ 孤儿锁 ／ 超时≠失败" | 照用 | — |
| d | CVM 绿侧（**对照**） | CVM `~/harness` ＋ `~/.dsh/profiles/sdk` | **只读对照**：读它两处 `.modules.yaml` 的 `virtualStoreDir` 形态 | 只作对照 | ⛔ **本块场地 = 本机**，别改 CVM（CVM 属 3.7.5） |
| e | 判据抽象 ／ 假绿源 | `docs/dsh/dsh-migration.md` §3.6 | 读「判据抽象」与假绿源一节 | 背景 | — |

### 5 · 场地器材

- **场地**：**本机 Windows**，仓库 `D:\Code\LarryAgent`，harness 根 `D:\Code\LarryAgent\harness`。⛔ 本块**不碰 CVM**。
- **通道须注明**（⚠️ 同机不同通道会给不同版本）：WB 复核用的是 **Bash 工具通道**、读到 node `22.22.2`；另有一条 `D:\App\node\node.exe` = `24.14.1`。⇒ **以你自己通道实测为准；对不上先报差异、再动手**。
- **包管理器锁死 `pnpm`**：⛔ 禁 `npm` ／ `yarn` 替代（换掉会重排整棵树 ⇒ 本块判据全作废）。
- **pnpm 调用式（实测）**：本机须用 `pnpm.cmd -v`；裸 `pnpm` 因 npm 的 sh 垫片缺 `sed`/`dirname` 会崩，并把入口错解析到别的盘。
- **已知假绿坑**：① `exit 0` 不可单独当判据（真实调用在无 Key／错 Key／已关闭 Key 三种失败下**也** `exit 0`）；② **空壳 home 与「装了但缺 peer 的 home」在 SDK 握手处同形** ⇒ 不可区分的是"profile 层不完整"这**一整类**；③ **本块核心坑**：`cpSync` 出来的副本 **自带源 profile 的绝对 `virtualStoreDir`** ⇒ pnpm 在解析依赖**之前**就退出。
- **资源**：本块只在**临时 home**（`mkdtempSync`）里跑 `dsh plugin add` ⇒ **不动 `harness/node_modules`**（与 3.7.5 不争同一资源）。

### 6 · 回报格式

**结论先行**（跑没跑起来 ／ 修没修好 ／ 成因是什么）→ **J1–J8 逐条证据**（**命令 ＋ 观测值**）→ **未闭合单列** → **自曝**（跑歪 ／ 判据要订正 ／ 发现矛盾，直接写）。
⚠️ **「成因未知」是可接受的结论**（别为叙事完整编一个）；但**不能拿它当 J1 的答案** —— J1 要的是**对照实验证据**。

### 7 · 禁区

- ⛔ **不得先改代码再补成因**（J1 在前）。
- ⛔ 禁 `npm` ／ `yarn`。
- ⛔ 不得改写 ／ 意译工具输出原文（含编码）——本地化文字被英文化 = 证据链失去可采信性。
- ⛔ Key 值**不得**落任何受版本控制的文件 ／ 日志 ／ 工具输出。
- ⛔ 不得动 `harness/node_modules`；不得动 CVM。
- ⛔ 不得为了让测试变绿而改判据；确需改判据须**单列说明 ＋ 实跑**。
- ⛔ 禁 `git rm`（全局禁）。
