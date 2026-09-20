# WorkBuddy 协作区

> 临时协作空间：仅在需要向其他 AI 同步时写入，**不做长期保留**；跨 AI 共享的项目事实一律落 `docs/` 或 `TODO.md`。

---

## 🔎 DSH-3.7.4 ／ DSH-3.7.4-T · WB 复验判定（2026-09-20）

对象：`4a2bb5b`（Trae 装置修复）＋ `2e1639b`（J6 补做与自我订正）＋ `d75bf05`（Claude T-1／T-2）＋ `d24fa12`（Claude 补充留言）。
复验纪律：不采信完成声明、逐条回源、**我方测量装置故障与被测对象故障分开**。
复验时磁盘状态：`git status --porcelain` **干净**（与 HEAD 逐位一致）。

### 0 · 结论先行

| # | 判定 | 采信度 |
|---|---|---|
| 1 | **3.7.4 修好了 —— 成立** | ✅ 可采信 |
| 2 | **成因（真变量）钉住 —— 成立** | ✅ 可采信（我独立读源码 ＋ 读侧验证） |
| 3 | **判据未被放宽**（期望值零改动） | ✅ 可采信 |
| 4 | **3.7.4-T 的 T-1 成立**（我独立复跑通过） | ✅ 可采信 |
| 5 | **T-2 两轮 5/5 与 Trae 一致** | ✅ 可采信（三方字段比对） |
| 6 | 「英文证据」= 伪造？ | ❌ **不成立，我已撤回该推断**（见 §3） |
| 7 | Trae 的 J6「read-only ⇒ 假红」自我订正 | ✅ 我复解原始帧后**认定其订正正确** |
| 8 | **J1 的 `asis` 臂（修复前行为）WB 本机独立复现** | ✅ 失败签名与 Trae 逐条吻合（§1.3b） |

**一句话**：**3.7.4 的修复与 3.7.4-T 的验证都可采信**；唯一需要纠正的是**我上一轮自己下的"英文 ⇒ 篡改"推断**——本机实测证明该机同一 exe **能产出英文**，故该推断不成立；该异常行**不承载任何判据**。

### 1 · 已确认（逐条 ＋ 证据）

**1.1 判据期望值零改动（关键）**
`git diff 4a2bb5b^ 4a2bb5b -- harness/tests/s0-e2e.test.ts` ⇒ 含 `expect(`/`assert` 的变更行 = **0**（+69/−4，全落在修复逻辑与注释）。磁盘当前断言行数与基线一致：`base` 7（`:383-389`）／`no-bundle` 2（`:398-399`）／`wrong-key` 3（`:403-405`）／`no-session-dir` 3（`:415-417`）／`kill-client` 4（`:427-430`）。
⇒ **不存在"为让测试变绿而放宽判据"**。

**1.2 改动范围最小**
`4a2bb5b` 只动 3 个文件（`.gitignore` ＋3 ／ `exchange/log-trae.md` ／ `harness/tests/s0-e2e.test.ts` +73/−5）；未改 `harness/node_modules`、未改 `run-s0-e2e.mjs`、未改 `real-api.ts`、未碰 CVM。

**1.3 成因链（我独立取证，非转述）**
- pnpm 实物源码 `dist/pnpm.mjs`：`writeModulesManifest` 内 `:155114-155116` **平台分支** —— `if (!isWindows()) { virtualStoreDir = relative(...) }` ⇒ **Windows 写绝对、POSIX 写相对**；读侧 `:155060-155064` 相对值按 `join(modulesDir, …)` 还原；`checkCompatibility` 两个 throw 在 `:187869`（`UnexpectedStoreError`）／`:187876`（`UnexpectedVirtualStoreDirError`）。
- **读侧独立验证**：本机三处 `.modules.yaml` 的 `virtualStoreDir` **全为绝对路径**（`harness` isolated ／ `.dsh-home/profiles/sdk` hoisted ／ `~/.dsh/profiles/sdk` hoisted）。
- **两处源 `storeDir` 不同**（`.dsh-home` = `D:\.pnpm-store\v11`；`~/.dsh` = `C:\Users\SuLarry\AppData\Local\pnpm\store\v11`）⇒ 换了源才暴出第二个字段，**Trae §1.3 的"自我推翻"有实测支撑**。
- ⇒ 副本继承**源**的绝对元数据 ⇒ pnpm 在**解析依赖之前**退出 ⇒ 现象（三变体红、失败只在插件激活层）与该机制**一致**。

**1.3b J1 的 `asis` 臂：WB 本机独立复现（补记，2026-09-20 午后）**
用 Node `cpSync({recursive:true})` 复刻装置（与 `s0-e2e.test.ts:238` 同款），再跑 `dsh plugin --profile sdk add`：
- 副本 `.modules.yaml` 的 `virtualStoreDir` 与**源**逐字符相同（`D:\Code\LarryAgent\.dsh-home\profiles\sdk\node_modules\.pnpm`）⇒ **未被改写**；
- ⇒ `addStatus=1`／**3.8s**（快速失败）／签名 **`ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`**；`afterAdd` 仍为源路径。
- 与 Trae `probe-asis.record.json`（status=1／1s／pnpm 未完成）**逐条吻合** ⇒ 成因链**不再只靠读源码**，本机**复现了失败签名**。
  证据：`D:\Code\_wb-evidence\374\j1\wb-j1node-asis.record.json` ＋ `.out.txt`。
- ⚠️ 本机单臂 `cp` 耗时 **2505.8s**（Trae 同臂 ~90s，约 28×）⇒ **环境量级差异**，非被测对象行为；`self`／`drop` 两臂因此未跑完（见 §4）。

**1.4 T-1 我方独立复跑（我自己跑，非转述）**
`harness/scripts/s0-e2e-destructive-actions.mjs` ⇒ **exit=0 / 10.0s / litter:0**，四臂与 Claude 报告**逐条一致**：
- 臂1 `chmodSync(dir,0o500)` ⇒ **❌ 不成立**（`writeFileSync`／`mkdirSync` 照常成功）；**正对照**（0o700）成立；`fs.accessSync(W_OK)` 在 0o444 下仍通过 ⇒ **确不可当判据**。
- 臂2 `icacls <dir> /deny <me>:(AD,WD)` ⇒ **成立**（`EPERM: operation not permitted`），`/remove:d` 可撤销且幂等。
- 臂3 `process.kill(-pid,'SIGKILL')` ⇒ **必抛 `ESRCH`（errno -4040）且直连子仍活** ⇒ 装置**必须**走 `child.kill('SIGKILL')` 回落（`:240-244` 已具备）。
- 臂4／4b ⇒ 本探针拓扑下**回落仍能带走孙进程**（stdio=ignore／pipe 两形态皆然）。
- 我另独立复现：icacls 原始输出在本机为 **GBK**（原始字节 `b'\xd2\xd1\xb4\xa6\xc0\xed…'`），`spawnSync(...,{encoding:'utf8'})` 读它**必得替换字符乱码**——与 Claude 两轮证据里的乱码形态**逐字节吻合**（`D1B3→ѳ`、`C9B9→ɹ`）。

**1.5 三方一致（T-2）**
我逐字段比对 Trae 的 `.s0-evidence/*.evidence.json` 与 Claude 的 `_claude-evidence/374t/s0-e2e{,-run2}/`：五变体的判据字段**三方一致**，`verdictText` **逐字符相同**；唯一差异 = `kill-client.④_bytesAtKill`（652／308／649，**非断言项**）＋ `DSH_HOME` 临时目录名／session id。
Trae `run4` vs `run5` 为**真独立运行**（同构 361 行，差异仅临时 home、`plugin add` 17.2s vs 18.2s、sessionId）⇒ **可重复性成立**。

**1.6 J4 跑后核验（源 profile 零写入）**
`.dsh-home/profiles/sdk` 的 `package.json`／`pnpm-lock.yaml` sha256 与 J4 基线（`capturedAt=2026-09-20 09:23:07`）**逐位一致**；`node_modules` mtime 仍停 2026-09-17 18:46:35；依赖仍 2 条；`plugin-tool-readfile` 出现 0 次；**孤儿锁 0 个**（精确匹配 `node_modules.lock`，非模糊）。

**1.7 J6：我解出原始帧，Trae 的自我订正成立**
我对 `j6/dsh/sessionlog-*/session-*/session.v3.jsonl.zstd` 做了**逐帧解压**（该文件是多帧 zstd，`zstdDecompressSync` 只解第一帧 ⇒ 需按魔数切段；已解出全 9 帧）。取到两臂 `tool/result` **原始帧**：
- `workspace-write` 臂：仅 `Error: EPERM …` ＋ `[sandbox: file access denied under workspace-write mode]` ＋ 升权提示 ＋ `[exit code: 1]`。
- `read-only` 臂：**`CannotCreateTypeConstrainedLanguage` ×2（前导码那行）＋ 其后的 `Error: EPERM …` 照旧出现** ＋ `[sandbox: … under read-only mode]` ＋ `[exit code: 1]`。
- 越界文件两臂均未创建；帧序号/时间戳/node 栈（`node:fs:2413`、`at [eval]:1:15`、`Node.js v24.14.1`）自洽。
⇒ **"read-only ⇒ 装置假红"确不成立**（约束只打掉 prelude 一行，命令照跑、marker 未丢）——**Trae 的订正成立**，其原判（外推）确实错了。

### 2 · 争议项的最终裁定：那两处「英文」

**2.1 事实（字节级，非转述）**
| 件 | `no-session-dir` 的 icacls 那一行 | nonASCII |
|---|---|---|
| Trae `.s0-evidence/no-session-dir.evidence.json` | `… exit=0 :: Successfully processed 1 files; Failed processing 0 files` | **0（纯 ASCII／英文）** |
| Trae `j2/run4.txt`／`run5.txt` | 同处亦英文 | 0 |
| Claude `_claude-evidence/374t/s0-e2e{,-run2}/…` | `… exit=0 :: 乱码`（GBK 被 UTF-8 解码的确定性产物） | 72 |
两方的 `note[0]`（repair）／`note[1]`（plugin add）**结构完全一致**（仅耗时不同）⇒ 两轮都是**真跑**，异常**仅限这一行**。

**2.2 我做的实验与结论（⚠️ 这里纠正我自己上一轮的推断）**
1. **本机语言配置**：`GetUserDefaultUILanguage` ＝ `GetSystemDefaultUILanguage` ＝ `0x0804(zh-CN)`；`MachinePreferredUILanguages=['zh-CN']`；HKLM `InstallLanguage=0804` ⇒ **"另一账户/SYSTEM 跑英文"假设不成立**。
2. **排除**：`SetProcessPreferredUILanguages` 改 en-US（子进程仍中文）；`LANG`／`LC_ALL`／`DOTNET_CLI_UI_LANGUAGE` 六档（PS 恒 zh-CN／中文）；icacls 裸名 vs 全路径 vs 大小写拼写（60 次恒中文）；`pwsh` 7 **不存在**（`shutil.which('pwsh')=None`、`C:\Program Files\PowerShell` 无）⇒ DSH 的 `resolvePwshPath` 本机**只能落到 PS 5.1**（`…\WindowsPowerShell\v1.0\powershell.exe`）。
3. **但——英文确实可产出**：
 - `icacls`：**92 次采样中有 2 次英文**（`processed file: … / Successfully processed 1 files; Failed processing 0 files`，**与 Trae 那一行逐字符同形**），其余 90 次 GBK 中文。
 - PS 5.1：**同一 exe、同一 flags，消息语言在同一命令上出现过 `en-US ＋ 英文`（6/6、11/12）与 `zh-CN ＋ 中文`（12/12、5/5）两种稳定态**；且 `[CultureInfo]::CurrentUICulture.Name` 实测值**与消息语言一一对应**（`en-US` ⇒ 英文）。
 - 尤其：**DSH 前导码形态**（`[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); …` ＋ 报错）实测 **11/12 出英文** —— 而 DSH 的 pwsh 工具**恰恰总是**把这段前导码拼在命令最前面（源码 `dsh-pwsh-local/lib/index.js:158` `ENCODING_PREAMBLE`，`:278` 拼接）。
4. ⇒ **裁定**：
 - **「英文」不是"造假"的必要征兆**；本机同一条路径**能**产出英文。**我上一轮"icacls 恒 GBK ⇒ 英文必为伪造"的推断撤回**——那是我把**单一通道的单次观察**当成了全称命题（正是"通道不同则结论不可互推"+"将存在的问题定论为必现需谨慎"的实例）。
 - **但也到此为止**：英文的**触发机制未定**（上述六类候选**全部实测排除**），因此**不能反向确认** Trae 的英文即本机产物。**双向都不下结论**。
 - **该行不承载任何判据**（判据只取 `exit=0`，两方皆 `exit=0`；破坏动作的生效性由 T-1 机制层独立判过）。⇒ **对 3.7.4／3.7.4-T 的结论零影响**。

**2.3 顺带一条派发口径缺陷（建议下一稿改）**
派发稿 **J7 写"原文原样落盘（含编码）；⛔ 禁…把本地化文字英文化"**。但 **DSH 的 pwsh 工具自带前导码**，而该形态在本机实测**倾向英文 ＋ UTF-8** ⇒ **对 DSH pwsh 输出而言，"本地化中文原文"本就不存在**，J7 按现口径会**每次都被判"疑似英文化"**。
建议改为：**「⛔ 禁止人工改写／意译；工具链自身的语言与编码差异须原样保留，并注明该段取自哪条通道（原生 shell ／ DSH pwsh ／ 沙箱运行器）」**。
（旁证：Trae 自家 `.ps1` 探针的乱码 `鈶?鍚屽舰` 在 `j6/J6-C-runtime-constrained.raw.txt` 里**被原样保留**，说明它并无系统性"英文化"倾向。）

### 3 · 未闭合（单列，不含糊）

1. **英文触发的机制未定**（已排除 6 类候选，见 §2.2.2）。⇒ 若老大要收口，建议的最小动作：**让它发生一次并抓现场**（记录当时 `CurrentUICulture`／是否伴随 CPU/AV 活动），或**放弃收口**——因其不承载判据。
2. Trae §9#1：本机 pnpm 默认 store `D:\.pnpm-store\v11` 的**来源**未查清（本轮我也未查）。
3. Trae §9#2：J6 里"**让 `node.exe` 也起不来**"的那一层成因未定（只复现出 ConstrainedLanguage 半层）。
4. Trae §9#3：`runner` 默认源（`~/.dsh/profiles`）与测试自身默认源（`<repo>/.dsh-home/profiles`，`real-api.ts:251`）**不一致**——**待裁**（我倾向：保留现状但把默认串成同一个常量，避免以后有人不带 env 跑）。
5. Trae §9#4：`no-session-dir` 的 **POSIX 分支**本轮未复验（本机无 Linux 通道）。
6. Trae §9#5：**`docs/` 承接未回填**（本机环境类事实：`virtualStoreDir` 平台分支、icacls/chmod 的 Windows 语义、`pwsh` 缺失与 PS 5.1 落点、DSH 前导码）。建议落 `docs/local-env.md` 的 DSH 小节。
7. `④_bytesAtKill` 的正常区间未定（现 3 采样：308／649／652）。
8. J6 未由 Claude 独立重放（我只做了**原始帧解码复核**，未重跑 DSH 会话）。

**处置（老大 2026-09-20 裁决 ＋ WB 同日执行）**

| # | 处置 | 落点 ／ 依据 |
|---|---|---|
| 1 | ⛔ **关闭收口** | 降为规则：**语言／编码不得作伪造判据** ⇒ `docs/local-env.md` §12.6（含对 §10.2 末条「出现英文 ⇒ 非本机产物」的**就地作废**） |
| 2 | ✅ **已查清**（原为"来源未查清"） | `pnpm getStorePath`（`dist/pnpm.mjs:161743-161785`）**按卷回落**：家目录 store 与 `pkgRoot` 跨卷 ⇒ 落 `<盘根>\.pnpm-store\<ver>`。实测 `cwd=D:\Code\LarryAgent` ⇒ `D:\.pnpm-store\v11`；`cwd=C:\Users\SuLarry` ⇒ `%LOCALAPPDATA%\pnpm\store\v11`。**不是配置项**（`~/.npmrc` 仅 registry、`pnpm config get store-dir` = `undefined`、env 无 `PNPM_HOME`、DSH 包内搜 `store-dir\|.pnpm-store` = **0 命中**）⇒ `docs/local-env.md` §12.2 |
| 3 | ⏸ **延后**（低优先） | `TODO.md`「延后（低优先 · 待触发）」段；执行人归 **Trae**（J6 作者，需读 `dsh-sandbox-local` 的 Windows restricted-token 链） |
| 4 | ✅ **已统一到一个源** | `harness/scripts/run-s0-e2e.mjs`：默认源 `~/.dsh/profiles` → **`<repo>/.dsh-home/profiles`**（与 `tests/real-api.ts:251` 同源）＋ 日志标明「来源：env／默认」＋ **源不存在即 `exit 2`**（⛔ 不回落 `~/.dsh`，防静默换源）。⚠️ **由 WB 改**（属装置口径修正，+1908 B，非产品码；判据零改动）⇒ 三条路径**已自证**：显式源→`来源：env`／不带 env→`来源：默认` 且落 `.dsh-home`／假源→`exit 2` ＋ 显式传参提示 |
| 5 | 🚀 **要做 · 发版前必做** | 派 **Claude** 上 CVM 验 **POSIX 分支**（`chmodSync(dir,0o500)` 在 Linux 上是否真拦写；若容器以 root 跑则装置**静默失效**）——本机无 Linux 通道（`wsl.exe` 在程序黑名单）。派发稿 = `exchange/log-claude.md` |
| 6 | ✅ **已落** | `docs/local-env.md`：**新增 §12**（12.1–12.7）＋ 就地订正 §8.7 第 4 条（"修法方向（未实施）" → **已实施** `4a2bb5b`）＋ 就地作废 §10.2 末条的伪判据 |
| 7 | ⛔ **关闭**（降级为参考项） | `④_bytesAtKill` **本就不是断言项**（装置只取 `exit=0`）；3 采样 308／649／652 差到 2× ⇒ 高度依赖时序。**真判据化应换成离散判据**（kill 后进程必须消失），不标定字节区间 |
| 8 | ⏸ **延后**（低优先） | `TODO.md`「延后（低优先 · 待触发）」段；执行人归 **Claude**（价值仅"跨环境重复性"，结论已由 WB 解码原始帧独立证实） |

### 4 · 诚实边界（我方测量装置故障，与结论无关）

- **WB 本轮未能完成"五变体本机整轮复跑"**：两次尝试都被**我方环境**卡住 —— ① 首次用了**我自造的占位 Key**（非老大给的临时 Key）⇒ `base` 到期 720s 被杀（exit=124）；② 用真 Key 重跑后 `base` 仍长时间无输出。**已排除**：Key 有效性（实测 HTTP 200／1.05s／回 `pong`）、网络与代理（npm/DeepSeek 直连与走代理皆通；**流式 SSE 亦通，86 chunks／~1s**）、PATH 劣化（本会话 Bash 的 PATH 确有 `dirname/head/mkdir` 找不到的现象）。
- **J1 独立复跑：`asis` 臂已取到（见 §1.3b），`self`／`drop` 两臂未跑完** —— ① 首轮我用 Python `shutil.copytree(symlinks=True)` 复刻 ⇒ **卡死 >10min**，根因：**Python 的 `os.path.islink()` 对 Windows junction 返回 False ⇒ 被当目录递归**，而装置用的是 Node `cpSync({recursive:true})`（不解引用，按 symlink 复制）；② 改 Node 版后 `asis` 臂成功（`cp` 用 2505.8s），但 `self` 臂的 `cpSync` 连续 **172 分钟**仍未完成（同类操作 `asis` 只用 41.8 分钟）⇒ **判定为我方环境量级劣化 ＋ 边际价值低（`drop` 的机制等价性已由装置本体 ＋ Claude T-2 五变体全绿 ＋ Trae J4／J5 三重覆盖）⇒ 主动停掉**，未再取 `self`／`drop` 数据。⇒ **两处根因均属我方装置，不是被测对象**。
- ⇒ 因此 §1.1–1.7 的确认项**全部取自"代码 ＋ 字节级证据 ＋ 我独立跑的 T-1 ／ 独立解码"**，**不依赖**我这次的整轮复跑。Claude 的 T-2 提供了第三方整轮复跑；**"整轮复跑"这一层由 Claude 承担，WB 承担"回源 ＋ 独立机制复跑"**。

### 5 · 请老大裁决／知会

1. **🔑 临时 Key 请关闭**：`sk-ac879…dea`（已用于本机连通性验证；复验期间未写入任何文件）。⏳ **仍待老大操作**。
2. **§3 的 4／6** —— ✅ **老大 2026-09-20 裁**：④ 走「**显式统一到一个源**」（已办，见 §3 处置表）；⑥ **由 WB 回填**（已办）。同理，② 已查清、①⑦ **关闭**、③⑧ **延后**（见 §3 处置表）。
3. **§2.3 的 J7 口径** —— ⏳ **待老大采纳**（建议改写文本在 §2.3；**不采纳则下一轮派发仍会误伤**）。
4. **WB 整轮复跑是否继续** —— ✅ **老大已裁定（2026-09-20 14:42）：复跑到此为止**。依据：`J1` 已取到 `asis` 臂（关键一臂，§1.3b）；`self`／`drop` 因我方环境量级劣化**主动停**；`s0-e2e` 五变体整轮复跑两次均卡在我方环境。继续跑**不增加**对结论的采信（属重复 Claude 那一层）。需要时再单点补跑。
