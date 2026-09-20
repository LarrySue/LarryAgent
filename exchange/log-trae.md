# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4** | Trae | 本机（Windows） | ✅ **已交回（2026-09-20）· 待复核** | 2026-09-20 |

- 已完成并复验（各段已按交流区规矩清理）：3.0 ✅ ／ 3.1 ✅ ／ 3.2 ✅ ／ 3.7.1 ✅ ／ 3.7.2 ✅ ／ 3.7.3 ✅ ／ **3.2.1 ✅（WB 复核：结论认可，另订正 3 处）**。
- **3.7.4 一句话结论**：**跑起来了 ＋ 修好了** —— 本机五变体 **5/5 全绿**（两次独立复跑，runner `exit=0`）；成因 = **pnpm 自身的平台分支**（`.modules.yaml` 的 `virtualStoreDir` 在 Windows 必写绝对 / POSIX 写相对）**＋ 副本 `cp -r` 继承了源树的绝对元数据**（不止 `virtualStoreDir`，`storeDir` 同病）。
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

## ✅ DSH-3.7.4 回报 · 本机 `s0-e2e` 装置缺陷修复

> 场地：**本机 Windows**（⛔ 未碰 CVM）｜通道：`D:\App\node\node.exe` = **v24.14.1**；`pnpm.cmd` = **11.7.0**｜证据：`D:\Code\_trae-evidence\374\`（探针与 runner 原文）＋ `S0_EVIDENCE_DIR`（见 J7）

### 0 · 结论先行

**跑起来了**（修复后 5/5 全绿，**两次独立复跑** runner `exit=0`）｜**修好了**（三处装置缺陷，全在 `tests/s0-e2e.test.ts`）｜**成因已定性**（不是"可能是 pnpm 行为"，是**pnpm 源码的平台分支** ＋ 副本继承源的绝对元数据）。

⚠️ **两个层面分开写**（派发稿 §0 的要求）：
- **(i) 现象层**：修复前本机五变体全红（我复现：`base` 42 s 红）／CVM 绿 —— 成立。
- **(ii) 机制层**：**成因已定**（J1，见下），不是候选列表。

### 1 · J1 定性在前（对照实验；⛔ 未动代码前完成）

#### 1.1 机制：pnpm 自己那一行平台分支（实物源码，非推断）

本机 npm 全局装的 pnpm 11.7.0，实物 = `C:\Users\SuLarry\AppData\Roaming\npm\node_modules\pnpm\dist\pnpm.mjs`：

```js
// :155097  async function writeModulesManifest(modulesDir, modules) {
// :155114      if (!(0, import_is_windows7.default)()) {
// :155115        saveModules.virtualStoreDir = path65.relative(modulesDir, saveModules.virtualStoreDir)
// :155116      }
```
⇒ **`.modules.yaml` 的 `virtualStoreDir` 在 Windows 上原样写内存里的绝对路径、在 POSIX 上做 `path.relative(modulesDir, …)`**（**相对基 = `modulesDir`**，即 `<proj>/node_modules`）。
读侧对得上：`readModulesManifest` `:155060-155064` 把相对值 `join(modulesDir, …)` 还原成绝对；`checkCompatibility` `:187862-187882` 再把它与**当下算出的位置**比对，不一致就抛
`UnexpectedVirtualStoreDirError`（`ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`）／ `UnexpectedStoreError`（`ERR_PNPM_UNEXPECTED_STORE`）—— **两者都在解析依赖之前**（实测 1 s 即退出）。

#### 1.2 对照实验（★ 唯一变量 = 副本 `node_modules/.modules.yaml`，其余全同）

装置：`_trae-evidence\374\j1\probe-374-j1-copy.mjs`（复刻 `:238 cpSync` ＋ `:246 installPlugin()`，**不跑 LLM、不需要 Key**）。

| 臂 | 副本里的值 | 结果 | 用时 | pnpm 原文（首行） |
|---|---|---|---|---|
| **A `asis`** | 源 profile 的**绝对**路径 | **红** | 1 s | `[ERR_PNPM_UNEXPECTED_VIRTUAL_STORE] Unexpected virtual store location` |
| **B `self`** | 副本**自身**绝对路径 | 绿 | 2 s | — |
| **C `rel=.pnpm`** | POSIX 侧会写的相对形态 `.pnpm` | 绿 | 2 s | —（跑后写回 = 副本自身绝对，印证 Windows 分支） |
| **C′ `rel=node_modules/.pnpm`** | 错形态的相对值 | **红** | 1 s | 同上，且报错里出现 `…\node_modules\node_modules\.pnpm` ⇒ **反证"相对基是 modulesDir"** |
| **D `drop`** | （删掉 .modules.yaml） | 绿 | 10–11 s | —（pnpm 重建清单） |

**再加两组"排除法"臂**（证明与 linker／有无依赖无关）：`e1b`（hoisted，无依赖）与 `e1c`（isolated，真装一个本地依赖）—— **`.modules.yaml.virtualStoreDir` 实测均为绝对**。

#### 1.3 ★ 换源对照暴露**第二个字段**（本项最重要的一次自我推翻）

`run-s0-e2e.mjs` 的默认源是 **`~/.dsh/profiles`**（不是 `.dsh-home`）。用全局 profile 作源时，**只修 `virtualStoreDir` 仍红**，但换的是另一条：

```
[ERR_PNPM_UNEXPECTED_STORE] Unexpected store location
The dependencies at "<副本>/node_modules" are currently linked from the store at "C:\Users\SuLarry\AppData\Local\pnpm\store\v11".
pnpm now wants to use the store at "D:\.pnpm-store\v11" …
```
⇒ **同一个"副本继承源树绝对元数据"的类里，`storeDir` 同病**。这也是我把修法从"改写一个字段"改成"删整个文件"的直接原因。

⚠️ 本机 pnpm 的默认 store = `D:\.pnpm-store\v11`（`pnpm store path` 实测，harness 与 TEMP 两个 cwd 一致）；**该默认值的来源未查清** —— 已检索 5 处候选 rc 文件**全部不存在**：`D:\.npmrc` ／ `C:\ProgramData\npm\etc\npmrc` ／ `~/.pnpmrc` ／ `%LOCALAPPDATA%\pnpm\config\rc` ／ `%APPDATA%\pnpm\config\rc`；环境变量里只有 `NPM_CONFIG_YES`。（按纪律：**未查清就写未查清**，不补成因。）

### 2 · J2 修复生效（三处，全在 `harness/tests/s0-e2e.test.ts`）

| # | 改动 | 为什么 |
|---|---|---|
| 1 | 新增 `repairCopiedPnpmMetadata()`，`:238 cpSync` 之后**删掉副本的 `node_modules/.modules.yaml`** | 一个文件里**不止一个**绝对路径字段（1.3）；删是唯一对"所有继承字段"都成立的做法，且让 pnpm 按当下环境重算 |
| 2 | `afterAll(...)` 补超时 **`900_000`** | 默认 hookTimeout = 10 s，而 home 是含 `node_modules` 的完整副本（300 包）⇒ `rmSync` 超时 ⇒ `Hook timed out in 10000ms`，**测试本身已过却把套件判红**（`wrong-key`／`kill-client` 实测命中） |
| 3 | `no-session-dir` 的破坏动作：**Windows 走 ACL 拒绝**（`icacls <dir> /deny <me>:(AD,WD)`），POSIX 保持 `chmod 500` | 见 J5：`chmod` 在 Windows 上无效。**只加平台分支，不动已绿的 POSIX 行为** |

**两次独立复跑（原文落盘 `374\j2\run-s0-e2e.run4.txt` ／ `run5.txt`）**：

```
[s0]   base             exit=0 PASS （期望 PASS）           71s
[s0]   no-bundle        exit=0 PASS （期望 PASS：负向对照由测试内部断言"该判据变红"） 57s
[s0]   wrong-key        exit=0 PASS （期望 PASS：…）         63s
[s0]   no-session-dir   exit=0 PASS （期望 PASS：…）         77s
[s0]   kill-client      exit=0 PASS （期望 PASS：…）         70s
[wrapper] runner exit=0
```

### 3 · J3 双锚（逐变体：变红项 ＋ "链路是活的"锚）

| 变体 | 变红项（实测值） | 活链路锚（实测值） |
|---|---|---|
| `base` | （无 —— 全绿） | `②_activated/injectFired/toolRegistered=true`；`①_toolNameInLog=[read_file]`；`③_verdictOk=true`；`④_nonce=true`；marker 事件 5 条齐全 |
| `no-bundle` | `②_activated=false`（另 `②_injectFired/toolRegistered=false`）＋ `①_toolNameIsOurs=false`（日志里是官方 `read`） | `③_verdictOk=true` ／ `④_nonce=true` ／ bundles **4→3**（破坏动作**真执行**，非空转） |
| `wrong-key` | `③_verdictOk=false` ／ `③_errorCode=AUTH`（status 401） | `②_activated=true` ／ `②_toolRegistered=true` |
| `no-session-dir` | `logPresent=false` ／ `④_sessionContainsNonce=false`（另 `③_turnEndKind=error`／`errorCode=UNKNOWN` —— **与 CVM 记载形态一致**） | `②_activated=true`（插件激活早于落盘，链路确实起来了） |
| `kill-client` | `④_sessionContainsNonce=false` | `killedBy=first-session-log-byte` ／ `logPresent=true` ／ `bytes=1015>0`（杀时 652 → 落定 1015） |

### 4 · J4 源 profile 全程未被写入

| 源 | deps | `plugin-tool-readfile` 出现次数 | `node_modules` mtime | `package.json`/`pnpm-lock.yaml` sha256 |
|---|---|---|---|---|
| `.dsh-home/profiles/sdk` | 2 | **0** | **2026-09-17 18:46:35.004（与 09:23 基线逐位相同）** | `167A1F30…` / `C02DB313…`（**与基线一致**） |
| `~/.dsh/profiles/sdk`（runner 默认源） | 3（含 `@larryagent/plugin-015-preset-probe`） | **0** | 2026-09-15 17:54:49.338 | —（该 3 条依赖是**跑之前就有的**，非本轮引入） |

⇒ 两处源 profile **均零写入**（改动只落在临时 home 的副本里）；A 锁（`<profiles>/node_modules.lock`）两处**收尾均无孤儿**。

### 5 · J5 转出项 ①：`chmodSync(dir, 0o500)` 在 Windows 上**不能**令 ④ 变红

- **判定：不能。** 证据（run2 原文）：该变体在**未改用等价手段**时**整轮照常跑通** —— `②_activated/injectFired/toolRegistered=true`、`③_verdictOk=true`、`logPresent=true`、`④_sessionContainsNonce=true` ⇒ 断言 `负向 3：落盘应当确实没发生…: expected true to be false` **直接红**。
- **机制**：Node 在 Windows 上对目录只翻"只读"属性，而 Windows 对目录**忽略**该属性 ⇒ 不构成写保护（POSIX 的 `0500` 语义在 Windows 无对应物）。
- **等价手段（实测）**：`icacls <dir> /deny <me>:(AD,WD)` ⇒ 子项 `mkdir`／`writeFile` 均返回 **`EPERM: operation not permitted`**（与 POSIX 的 `EACCES` 同类）；`icacls … /remove:d` 后**恢复可写**（撤销幂等，已进 `afterAll` 清理）。
- **复跑**：改用等价手段后，该变体在 run4 ／ run5 **两次**均按期望落位（`logPresent=false` ＋ `②_activated=true`），且红灯形态与 CVM 记载的 `③_turnEndKind=error/errorCode=UNKNOWN` **一致** ⇒ 是**等价**而非放宽。

### 6 · J6 转出项 ②：`pwsh` 受限路径 ⇒ fail-safe 假红 —— **已在真 dsh 链路重放，结论被我自己的实测推翻一半**

**补跑（2026-09-20，真 dsh 链路；两臂唯一变量 = `DSH_PERMISSION_MODE`）**
- 装置：`374\j6\run-j6-dsh.mjs` ｜模式开关的源头 = profile 自身配置 `dsh-base/cordis.patch.yml:211`（`mode: !!js process.env.DSH_PERMISSION_MODE ?? 'workspace-write'`）｜临时 home = 复制 `.dsh-home/profiles/sdk`（**不碰工程 home、不切 patch**）｜工作区 `<SBOX>/ws`、越界目标 `<SBOX>/outside/denied.txt`、口令与 R3 同形｜Key 只经环境变量注入（`backend/config.yaml` 首条），**值不落盘、不打印**。
- 原文：`374\j6\dsh\J6-toolresult.raw.txt`（两臂 `tool/result` 帧全文）＋ 会话日志副本 `374\j6\dsh\sessionlog-*/`

| 臂 | 会话（运行自报 id） | `tool/result` 要点 | 越界文件 |
|---|---|---|---|
| A `workspace-write` | `session-15f7be025dab4d53a6c4832061056cb5` | `Error: EPERM: operation not permitted…` ＋ `[sandbox: file access denied under workspace-write mode]` ＋ 升权提示 ＋ `[exit code: 1]` | 未创建 |
| B `read-only` | `session-af1976d123e9434f81be723ca15cc5df` | **`CannotCreateTypeConstrainedLanguage` ×2**（开头 `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)` 失败）**—— 但其后 `Error: EPERM …` 照旧出现** ＋ `[sandbox: file access denied under **read-only** mode]` ＋ 升权提示 ＋ `[exit code: 1]` | 未创建 |

**三条判定（第 2 条订正我上一版的写法）**：
1. **触发条件（本机实测成立）**：`DSH_PERMISSION_MODE=read-only` ⇒ pwsh 进 **ConstrainedLanguage**，报 **`CannotCreateTypeConstrainedLanguage`**（**与 R3 的 tool/result 同一 error id**）。机制源头有 DSH 自述原文（`dsh-tool-pwsh/lib/index.js:144`）："**Under the Windows sandbox, read-only pwsh runs in PowerShell ConstrainedLanguage mode, while workspace-write stays in FullLanguage unless host policy says otherwise.**"
2. ⚠️ **但"read-only ⇒ 装置假红"不成立**：B 臂里 **`EPERM` 与 marker 一个都没少**（ConstrainedLanguage 只打掉了 prelude 那一行，**命令照样被执行**）⇒ 3.7.2 装置的两态判据**仍会通过**，**不构成假红**。
3. ⇒ **假红的充分条件比"read-only"多一层**：R3 的 `tool/result` 里**连 `EPERM` 都没有**、只有「**无法运行 node.exe：拒绝访问**」⇒ 它那次是**受限令牌进一步阻止了子进程创建**（ConstrainedLanguage 只是第一层）；本机 read-only **只满足前一半**。
4. ⛔ **R3 为何落到那一层：成因未定** —— 同机、同一 profile 的 workspace-write 臂在我这里完全正常，而 R3 的会话头是 workspace-write 却受限 ⇒ 只可能是 DSH 自述里那条 "**unless host policy says otherwise**" 分支，但**具体是什么策略/什么差别，未查到，不补成因**。能确定的只有：**该路径确实存在，且方向上只可能"假红"（不会有假绿）**。

### 7 · J7 原文原样落盘 ＋ 文件清单

- `S0_EVIDENCE_DIR` = **`D:\Code\LarryAgent\.s0-evidence`**（= `run-s0-e2e.mjs` 的默认 `resolve(repoDir, '.s0-evidence')`）。
  ⚠️ **与本稿 J8 前提写的 `harness/.s0-evidence/` 不是同一处** —— 默认落点是**仓根**，不是 `harness/`（两者此前皆不存在，故不影响判据，但记账口径要改）。
- 清单（14 件）：`base.evidence.json` ／ `base.marker.log` ／ `base.session.txt` ／ `no-bundle.evidence.json` ／ `no-bundle.session.txt` ／ `wrong-key.evidence.json` ／ `wrong-key.marker.log` ／ `wrong-key.session.txt` ／ `no-session-dir.evidence.json` ／ `no-session-dir.marker.log` ／ `no-session-dir.session.txt` ／ `kill-client.evidence.json` ／ `kill-client.marker.log` ／ `kill-client.session.txt`
- 原文**未做任何后处理**（含编码）：pnpm 报错、PowerShell 本地化文字、marker 里的 `dshHome` 路径均按工具原样入盘。
  ⚠️ **一处陈旧件**：`no-session-dir.session.txt`（mtime **09:32:53**，属 run2）—— 最新两轮该变体**没有**会话日志（`logPresent=false` 正是判据），该文件**不属最新一轮**；引用时勿当本轮产物。

### 8 · J8 前提：逐条实测 vs 本稿

| 前提 | 本稿 | 我的实测 | 结论 |
|---|---|---|---|
| `harness/node_modules/.modules.yaml` | `isolated` ／ 绝对 | `isolated` ／ `D:\Code\LarryAgent\harness\node_modules\.pnpm`（绝对） | ✅ 一致 |
| `.dsh-home/profiles/sdk/node_modules/.modules.yaml` | `hoisted` ／ 绝对 | `hoisted` ／ `D:\Code\LarryAgent\.dsh-home\profiles\sdk\node_modules\.pnpm`（绝对） | ✅ 一致 |
| `.s0-evidence/` 不存在 | 写的是 `harness/.s0-evidence/` | 两处**均**不存在；但 runner 默认落点是**仓根** | ⚠️ **口径要订正**（落点） |
| 行号锚 `:20`｜`:92`｜`:238`｜`:246`｜`:252`｜`:327-377` | — | 逐条核对**全中**（cpSync import ／ installPlugin ／ cpSync ／ installPlugin() ／ chmodSync ／ 五变体断言） | ✅ 一致 |

### 9 · 未闭合（本项不做／做不了，逐条列明）

1. **本机 pnpm 默认 store = `D:\.pnpm-store\v11` 的来源未查清**（5 处候选 rc 全缺，环境变量无相关项）—— 只报了"是什么"，没报"为什么"。
2. **J6 已补做（见 §6），但"R3 落到的那一层"的成因仍未定** —— 本机 `read-only` 只复现出「ConstrainedLanguage」这**半层**；让 `node.exe` **也起不来**的那个额外限制**未查到**（不补成因）。
3. **runner 的默认源与测试自身默认源不一致**（`run-s0-e2e.mjs` → `~/.dsh/profiles`；`real-api.ts:251` → `<repo>/.dsh-home/profiles`，J4 锚也在后者）⇒ 我**按现状跑**（用 runner 默认源，才有 §1.3 的第二个字段发现），**未改** runner `scope`。待裁：是否把 runner 默认改到 `.dsh-home`。
4. `no-session-dir` 的 **POSIX 分支我未在此机实跑**（无 Linux 通道；CVM 属 3.7.5）⇒ POSIX 行为保持原样但**本轮未复验**。
5. `docs/`（`local-env.md` 等）与本段相关的承接**未回填**（本稿只动 `s0-e2e.test.ts` ＋ `.gitignore`）。

### 10 · 自曝

1. **我第一版修法不够**（改写 `virtualStoreDir` → `.pnpm`）：它确实把那一个字段治了，但**换源到 `~/.dsh/profiles` 后立刻暴出第二个字段 `storeDir`**（§1.3）⇒ 才改成"删文件"。**若我只按 `.dsh-home` 跑一遍就收工，会把一个只治一半的修法当成交付**。
2. **我第一版 Windows 破坏手段跑歪**：先用"同名文件占位"，结果**运行时抛 RPC 异常**（`JsonRpcResponseError: cannot create effect on inactive context`）且**证据未落盘**（run3 该变体 FAIL 且 `evidence.json` 是上一轮的）⇒ 换成 ACL 拒绝。**教训：破坏动作要落在"与目标错误同类"的层**（文件占位让 `mkdir` 在 boot 期就炸，ACL 让子项创建在落盘期炸）。
3. **我自己造的 `.ps1` 编码没给对**（UTF-8 **无 BOM**，PS 5.1 按 ANSI 读）⇒ J6 探针输出里出现 `鈶?鍚屽舰` 这类乱码。**原文保留、未粉饰**；探针结论所依赖的那行（`FullyQualifiedId = CannotCreateTypeConstrainedLanguage`）不受影响。
4. **BOM 又踩一次**：J1 的 `e1c` 探针用 `Set-Content` 写 JSON ⇒ pnpm 报 `Unexpected token '\uFEFF'`（这是 3.7.2 学过的坑）⇒ 改用 `[System.IO.File]::WriteAllText(..., UTF8Encoding($false))`。
5. **多改了一行 `.gitignore`**：加 `.s0-evidence/`（与既有 `.s372-evidence/` 同向）。理由：runner 每次复跑都会把仓判脏；**若复核认为超范围，删该行即可**（不影响任何判据）。
6. **判据未放宽**：三处改动里只有 #3 触及"破坏动作"，其**期望值一个没动**（仍是 `logPresent=false` ＋ `④=false` ＋ `②_activated=true`），且等价性有实测支撑（§5）。
7. ⭐ **我上一版 §6 写错了一半，已按实测订正**：原写「read-only ⇒ 工具返回**既无 `EPERM` 也无 marker** ⇒ 装置必然假红」—— 本机真链路重放证明 **`EPERM` 与 marker 一个都没少**（ConstrainedLanguage 只打掉 prelude 那一行，命令照样执行）⇒ **「read-only ⇒ 假红」不成立**。那是我拿 R3 的**单次实物外推**出的"必然"，没先在本机重放就写进了报告。**教训：跨环境外推一句"必然"之前，先在本机重放一次。**
8. **补跑用 Key 的处理**：老大给了一只临时 Key，我**没有**把它写进任何命令行／文件（命令行文本也算"工具输出"，凭据零落盘的适用面）⇒ 补跑仍走 `backend/config.yaml` 那条既有通道（值不入任何文本）。若后续要用指定 Key，安全姿势是**先用环境变量注入到会话**，再让我读环境变量。

### 11 · 收尾

- **`git status --short`**：`M .gitignore` ／ `M harness/tests/s0-e2e.test.ts` ／ `M exchange/log-trae.md`（`.s0-evidence/` 已按 §7 忽略，不再出现）
- **本项改动的受版本控制文件 = 3 个**；未改 `harness/node_modules`、未改 `run-s0-e2e.mjs`、未改 `real-api.ts`、未碰 CVM、未切 `cordis.patch.yml`（J6 补跑走临时 home）。
- **仓外证据**：`D:\Code\_trae-evidence\374\`（`j1\` 五臂探针 ｜ `j2\` 四次 runner 原文 ｜ `j4\` 源 profile 基线 ｜ `j5\` ACL 语义 ｜ `j6\` 触发式与 dsh 两臂重放）＋ `D:\Code\LarryAgent\.s0-evidence\`（装置自产 14 件）。


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
