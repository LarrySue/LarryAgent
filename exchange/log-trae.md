# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.2** · 落盘 ＋ 自检 ＋ 真 e2e（方言修复件） | Trae | **本机 Windows** | ✅ **已回报（2026-09-17）** · **J1–J7 全成立** · 一句话 = **生效** | 2026-09-17 |

- ⚠️ **DSH-3.2.1（Windows 侧 named semaphore 的释放实测）本区未派** —— 它与 3.7.2 **场地相同**（均本机）且**争用同一棵 `harness/node_modules`**（3.7.2 要重算 lock ＋ 装插件 ⇒ 期间 CLI 树不稳）⇒ **不可并行**，等 3.7.2 交回后起跑。**别自行往下做。**
- 已完成并复验（本区已清）：3.1 ✅ ／ 3.2 ✅ ／ 3.7.1 ✅。
- 任务清单与进度以 `TODO.md`「DSH-3」区为准（**一处两面**）；本区只放**怎么做**。

---

# 📮 DSH-3.7.2 派发稿 —— 方言修复件：落盘 ＋ 自检 ＋ 真 e2e

> **场地 = 本机 Windows** ｜ 执行人 = **Trae** ｜ 派发 **2026-09-17**
> 前序：3.7.1 已回报并复验（① ③ 成立 ／ ② 的判据被推翻）；**落点已由 `larry` 改 `sdk`**（老大 2026-09-17 裁 = 岔口 ②）。
> 任务清单与进度以 `TODO.md`「DSH-3.7.2」段为准（**一处两面**）；本稿只讲「怎么做」。

---

## 0 目标（一句话）

把 Windows 沙箱**拒绝方言修复件**落到**工程 `.dsh-home/profiles/sdk`**，并验它在**生产通道**上真生效 —— 即 `docs/local-env.md` §4.3 标注的**唯一未证项**：模型真触发一次被拒命令、看到 `[sandbox: file access denied]`。

---

## 1 硬判据（逐条可验，逐条回报）

| # | 判据 | 怎么验 |
|---|---|---|
| **J1** | **依赖代际已钉**（性质 = **防污染**，非阻断） | `harness/packages/plugin-sandbox-dialect/package.json` 的 peer 由 `"*"` 改为显式 `0.1.5-rc.2`（或 `^0.1.5-rc.2`）＋ 重算 `harness/pnpm-lock.yaml` ⇒ **实跑**从落点 `import()` 插件成功。⚠️ **双锚**：既验"改后 OK"，也**复现改前 FAIL**（否则"环境刚好没坏"与"改对了"不可分） |
| **J2** | **落点在 profile 自身层，且不带插件自带的 `node_modules`** | 插件实体落在 `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-sandbox-dialect/`，**只拷 `index.js`（4087 B）＋ `package.json`（542 B）两个文件**。⚠️ **不落** `profiles/node_modules/`（共享层，已证取旧代）；**不 link**；**不从全局 `~/.dsh` 拷**（同功能不同版，2962 B）；⛔ **`node_modules/` 必须排除** —— 仓库源自带的那份把 `dsh-sandbox-local` 绑到 `harness/.pnpm` 的**旧代支**（实测）⇒ 一起拷则**无论落哪层都取旧代** |
| **J3** | **patch 已写** | `.dsh-home/profiles/sdk/cordis.patch.yml`（实测现状 = **217 B 模板空态 `[]`**）写后须含两段：`- id: sandbox / disabled: true` ＋ `- insert:` 带 `sandbox-dialect`。⚠️ **必须把 `[]` 那行删掉换成条目**，不能在 `[]` 之后续写（会报 `end of the stream or a document separator is expected`） |
| **J4** | **生效自检** | `DSH_HOME=<工程 .dsh-home 绝对路径>` ＋ `--profile sdk --dump-config` ⇒ 官方 sandbox 行**保留 ＋ `disabled: true`**、末尾多出 `sandbox-dialect` 行。⚠️ **别拿"行消失"当判据**（会误判成未生效） |
| **J5** | **真 end-to-end（本项核心）** | 在**工程 `.dsh-home`** 上跑**真模型**，触发一条**确实会被 Windows 沙箱拒**的命令 ⇒ 观察到 `[sandbox: file access denied]`。⚠️ 通道／前置／双锚见 §4 |
| **J6** | **lockfile 双面同步** | 改后的 `harness/package.json` ＋ `pnpm-lock.yaml` 同步到 CVM（`~/harness` 是**无 `.git` 的 tar 副本**；实测其 lock 现含 `0.0.1-rc.1` **×17**、dialect peer 同为 `"*"`）⇒ 同步后在 CVM 上验"装得上 ＋ 解析得 015" |
| **J7** | **不污染基线** | 源 `sdk` profile 除「J2 落点 ＋ J3 patch」外**不得被改写**（`sdk/package.json` 的 deps ／ bundles 若被 `dsh plugin add` 改动，须单独说明）；`DSH_REAL_API` 默认关，`npm test` 不受影响 |

**退出码**沿用 3.1 约定：`0` 通过 ／ `1` 测试失败 ／ `2` 前置缺失 ／ `124` 看门狗超时。

---

## 2 交付物

1. **落盘产物**（在工程 `.dsh-home`，⚠️ 该目录在 `.gitignore` 内、**不入库**）：插件实体 ＋ `sdk/cordis.patch.yml`
2. **可复跑装置**：一条命令复跑（含全部环境变量）＋ 明确退出码；装置代码入库
3. **证据**：`--dump-config` 前后输出、e2e 的 session 日志 ／ 工具调用记录、负向对照记录 —— 回传本机（路径写进回报）
4. **回报**：写在本文件

---

## 3 参考件四要素（照抄 `docs/dsh/dsh-migration.md` §2.2.2 —— **逐件照抄，勿自行发挥**）

**`kun2-5code__dsh-plugin-template`**（MIT，`ref/community/`）
- ✅ 可参考：host 半边 `dsh.bundle.patch` ／ `dsh.client` 的**包级声明形状**；`service` / `hook` / `commands` 三半边划分；`test/smoke.mjs` 的**假 ctx 单测范式**
- ⛔ 不可参考：`src/client/` 14 个文件**全是 React**（本项目前端是 Vue/Tauri，UI 代码不可照搬）；`dev/cordis.yml` overlay **只加载 host 半边**，不能拿它判 client 半边可用

**仓库内现成器材（DSH-2.5 ③ 遗留 —— 优先复用，别从零写）**
- `harness/scripts/sandbox-probe/sandbox-denial-probe.mjs`（10793 B）：三链 A1/A2/A3 ＋ fail-closed 反向哨兵 ＋ **真实链路**（把 `ENCODING_PREAMBLE` 前导算进去 —— 少这层会得中文签名的**假阴性**）
- `harness/scripts/sandbox-probe/cordis-confine-check.mjs`（3716 B）：真实 cordis 链路，同一 argv 喂「官方 provider」与「方言插件」，比 `denialSignatures`
- `harness/scripts/sandbox-probe/sandbox-dialect.verify.patch.yml`（642 B）：**复验专用**覆盖层（叠只读探针），**不进生产**
- ⚠️ **它们的 `NM = ~/.dsh/profiles/node_modules`（全局 home）** ⇒ 复用须**改指工程 home 的落点层**（`<repo>/.dsh-home/profiles/sdk/node_modules`）。**别照抄路径**。

---

## 4 一次真 e2e 的设计（本项最难一步，务必按此做）

**通道（写死）**：`harness/scripts/dsh-prompt.mjs` —— **client 同源 SDK 通道**（脚本头原文：*"the Tauri client runs exactly this script under the hood"*）。
- ⛔ **不可**用 `harness/tests/s0-e2e.test.ts` 验工程 home —— 它经 `tests/isolated-setup.ts` **强制把 `DSH_HOME` 覆盖成临时目录**（`:9` 自述"**不穿透源 profile**"，`:97` 实证 `DSH_HOME: home`）⇒ **它验不了工程 home 的落盘生效**。
- ⚠️ 但它的**骨架与断言写法**（evidence 结构 ／ 退出码 ／ 判据函数）仍可借鉴。

**命令形态（"确实会被拒"）**：参考 `cordis-confine-check.mjs` —— 策略 `{ mode: 'workspace-write', workspaceRoot: WS }`，argv = 往 `workspaceRoot` **之外**写文件 ⇒ 被拒。
- ⇒ 让模型去**写一个工作区外的文件**（如往 `C:\Windows\...` 或工作区外的临时目录写）
- ⚠️ **前置须先自证"该命令确实被拒"**（正对照）：**不挂修复件**时该命令的拒绝**不被识别为沙箱拒绝**（表现为普通工具错误）；挂上后才被识别。**缺此正对照就会造出"没有拒绝发生"的假绿。**
- ⚠️ **判据双锚**：既验"挂上 ⇒ 被识别"，**也**验"摘掉 ⇒ 不被识别"（= 负向对照 ①）。缺后锚则"环境没起来"与"修复生效"不可分。

**`DSH_HOME` 必须显式注入**（不可靠默认回退）：

```bash
cd /d/Code/LarryAgent && DSH_HOME="$(pwd -W)/.dsh-home" node harness/scripts/dsh-prompt.mjs "…"
```

- ⚠️ **`pwd -W` 不是可选的**：Git Bash 的 **env 值不做路径转换**（转换只发生在 argv）⇒ `/d/Code/…` 原样交给 Windows node 会被 resolve 成 **`D:\d\Code\…`** ⇒ DSH 自己新建一个**空 home** ⇒ **无 key 假绿、判据全绿**。与 `cvm-probes` 钉错 home 是**同一种坑**。
- ⚠️ 不设 `DSH_HOME` 则落主 `~/.dsh`（那份是 015，但**不是本项落点**）⇒ 验的是**替身路径**。

**Key 供给**：凭据层 = **启动环境变量**（3.7.1 ③ 结论；工程 `.dsh-home` 顶层实测**无 `.credentials.yaml`**）。
- 桥接件：`harness/scripts/s0-run-with-file-key.mjs`（从凭据文件取 key → env 注入子进程，**只打印长度、不打印值**）。
- 本机工程 home 无凭据文件 ⇒ 可 `S0_CREDS=~/.dsh/.credentials.yaml`（全局 home 有该文件）。
- 🔴 **纪律**：key **只进子进程 env**，**不得**写进任何文件 ／ 日志 ／ 回报；回报里**只写长度或哈希前缀**。

---

## 5 场地与器材（写死）

- **场地**：本机 Windows。**工程 home** = `D:\Code\LarryAgent\.dsh-home`（实测顶层：`.anonymous-user-id` / `profiles` / `sessions` / `storages`）
- **CLI**：`harness/node_modules/@deepseek-ai/dsh`（`0.1.5-rc.2`）
- **`sdk` profile 实测**：`package.json` = `dsh-base` ＋ `dsh-sdk-app`（均 `0.1.5-rc.2`）；`sdk/node_modules/@deepseek-ai/dsh-sandbox-local` = **`0.1.5-rc.2`** ⇒ **自身层是干净的 015**（这正是硬前置 3 的道理）
- **插件源**：`harness/packages/plugin-sandbox-dialect/`（`index.js` **4087 B** ＋ `package.json` **542 B**）。
  - ⛔ **它自带一个 `node_modules/`，且里面是有东西的**（实测构成）：`@deepseek-ai/dsh-sandbox-local` → junction 指 `harness/node_modules/.pnpm/@deepseek-ai+dsh-sandbox-lo_fc402b20…`（**`0.0.1-rc.1` 旧代**）／ `@deepseek-ai/dsh-sandbox-windows-acl`（`0.0.1-rc.1`，真目录）／ `@deepseek-ai/.ignored_dsh-sandbox-local`（**空目录**）／ `.bin/cordis`。⇒ **视它与 `.ignored_*` 为「不要碰、也不要带着走」的东西**
  - ⭐ **两个旧代载体同根**（WB 2026-09-17 三层实测）：根 = `harness/node_modules/.pnpm/@deepseek-ai+dsh-sandbox-lo_fc402b20…`；载体 ①＝工程**共享层** `profiles/node_modules/@deepseek-ai/`（**241 条 junction 全指 `harness/.pnpm`**）②＝**插件自带的 `node_modules/`**（同一支 `.pnpm`）。而 **`sdk` 自身层是独立真树**（`@deepseek-ai/` 下 **real=105 ／ link=0**）⇒ **"落层"之所以是真变量，实底是两层结构根本不同**
- **挂载层文件**：`harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml`（生产用；其注释里的安装点已于 2026-09-17 订正为 `profiles/<profile>/node_modules/…`）
- **参考文档**：`docs/local-env.md` §4.3（范式 ＋ 已证/未证边界）／ §4.3.1（015 未自修的证据链）

---

## 6 负向对照（至少两条，每条须双锚）

| # | 破坏动作 | 期望变红 | ⚠️ 同时须断言"其余仍活" |
|---|---|---|---|
| ① | **摘掉修复件**（不挂 patch） | 拒命令**未被识别为沙箱拒绝** | dump-config 里官方 sandbox 行仍在（未被 disable） |
| ② | **落错层**（放共享层 `profiles/node_modules/`） | 插件 `import` **崩**（文案 `does not provide an export named 'assertNever'`） | `sdk` 自身层那份仍在（证明差异来自"层"） |
| ③ | （可选）**插件改用 link 装** | bare import 从源目录解析 ⇒ 取不到 `sandbox-local` | 实体那份仍可 import |

> ⚠️ **负向变体须双锚**：只断言"变红"时，"环境没起来"与"破坏生效"**不可区分**（假通过）。

---

## 7 回报格式

```markdown
## DSH-3.7.2 回报（Trae 2026-09-XX）

### 结论
- J1…J7 逐条：成立 ／ 不成立 ／ 未验
- 一句话总结（生效 ／ 未生效 ／ 部分生效）

### 原始观测（每条给命令原文 ＋ 输出摘要）
- J1: peer 改前/改后 ＋ 重算前后 lock 的解析结果
- J4: dump-config 关键行（sandbox-dialect 在不在 ／ sandbox 是否 disabled）
- J5: prompt 原文 ＋ 模型触发的命令 ＋ 工具返回 ＋ 是否出现 [sandbox: file access denied]
- J6: CVM 同步记录（哪些文件 ／ sha 比对）

### 未闭合项
- 逐条列出；**不确定就写"成因未查清"，不要补成因**

### 证据位置
- 回传件路径
```

**⚠️ 三个常见坑（都会被误判成结论）**：
1. **`exit 0` 单独不构成判据** —— 假绿源；须看进程**能否自己退出**（生命周期）＋ 具体判据字段。
2. **管道 ／ 重定向会吞输出** —— 长任务**先落盘再读文件**，不要依赖管道回显。
3. **"命令无输出"先怀疑通道** —— 跑一条必成功的对照命令自证判据健康，再怀疑被测对象。

---

## 8 禁区

- ⛔ **不得改**：`.claude/CLAUDE.md` ／ `.trae/TRAE.md` ／ `.workbuddy/memory/MEMORY.md` ／ `HUMAN.md` ／ `HUMAN_NOTE.md`
- ⛔ **Key 不落盘**（受版本控制的文件 ／ 日志 ／ 工具输出 ／ 回报）
- ⛔ **不落全局 `~/.dsh`**（那份已有副本、勿动）
- ⛔ **不落共享层** `profiles/node_modules/`（J2）
- ⛔ **不动** `acp` ／ `web` 两个空壳 profile（`web` 还是多条结论的基准面）
- ⛔ **跑 harness 测试禁注入真实 home**（`isolated-setup.ts` 有正向白名单守卫，注入会 FAIL）
- ⛔ **不从全局 home 拷插件**（同功能不同版）
- ⛔ **别自行起跑 3.2.1**（见状态区）

---

## 9 顺带项（不阻塞，能顺手就做）

1. **CVM `harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` 注释滞后**（仍写旧落点 `profiles/node_modules/…`）⇒ 随 J6 同步覆盖。
2. **`harness/packages/plugin-sandbox-dialect/node_modules/`**：它不是空目录（见 §5）。其中 `@deepseek-ai/.ignored_dsh-sandbox-local` 是个**空目录**、名字带 `.ignored_` 前缀 —— 报一下它是不是 pnpm「忽略 peer」机制的产物、能否清掉；**在弄清楚前不要删**（它是插件源目录的一部分）。

---

# ✅ DSH-3.7.2 回报 · 方言修复件：落盘 ＋ 自检 ＋ 真 e2e（Trae 2026-09-17）

## 结论

| 判据 | 结果 | 一句话 |
|---|---|---|
| **J1** 依赖代际已钉（双锚） | ✅ **成立** | peer `"*"` → `0.1.5-rc.2` ＋ 重算 lock；**改前 FAIL / 改后 OK** 两条都留了原文 |
| **J2** 落点在 profile 自身层、不带插件自带 `node_modules` | ✅ **成立** | 只 2 文件、哈希与源 SAME、`node_modules` 未带上；两级解析都落**自身层** |
| **J3** patch 已写（`[]` 换成条目） | ✅ **成立** | 217 B → 769 B；`[]` 已删 |
| **J4** 生效自检 | ✅ **成立** | 官方 sandbox 行**保留 ＋ `disabled: true`**，末尾多出 `sandbox-dialect` 行 |
| **J5** 真 end-to-end（本项核心） | ✅ **成立（双锚）** | 挂上 ⇒ 模型看到 `[sandbox: file access denied under workspace-write mode]`；摘掉 ⇒ 只看到 `EPERM` 原文 ＋ `[exit code: 1]` |
| **J6** lockfile 双面同步 | ✅ **成立**（含一处订正，见下） | 3 文件 md5 本地=CVM；CVM 上插件依赖 `0.1.5-rc.2` 且 `import` 成功 |
| **J7** 不污染基线 | ✅ **成立** | `sdk/package.json` 哈希未变；新装置不落 vitest include；未设 `DSH_REAL_API` |

**一句话总结：生效** —— 首次拿到**端到端"红灯 / 绿灯"对照原文**：同一台机、同一 profile、同一条命令，修复件把"沙箱拦住了但信号传不出去"（`docs/local-env.md` §4 的缺口）翻译成了模型看得懂的沙箱语义。

## 原始观测（命令 ＋ 输出摘要）

### J1（双锚）

同一条 `import()`（`node D:\Temp\dsh-probe\372-import-probe.mjs <entry> <label>`）：

| 锚 | lock（第 47 行） | 插件源 `node_modules/@deepseek-ai/dsh-sandbox-local` junction | 实跑 `import()` |
|---|---|---|---|
| **改前** | `specifier: '*'` / `version: 0.0.1-rc.1(…)` | `…\.pnpm\@deepseek-ai+dsh-sandbox-lo_**fc402b20**…`（**旧代支**） | ❌ `SyntaxError: The requested module '@deepseek-ai/dsh-llm' does not provide an export named 'assertNever'` |
| **改后** | `specifier: 0.1.5-rc.2` / `version: 0.1.5-rc.2(…)` | `…\.pnpm\@deepseek-ai+dsh-sandbox-lo_**afd5a527**…`（**015 支**） | ✅ `ok`，`extras=["operation not permitted","拒绝访问","访问被拒绝"]`、`default` 是 class |

- 改动：`harness/packages/plugin-sandbox-dialect/package.json` 的 `peerDependencies` `"*"` → `"0.1.5-rc.2"`（`peerDependenciesMeta.optional` 保留未动）
- 重算命令：`pnpm install --no-frozen-lockfile`（EXIT=0，`Done in 3.5s`；store `D:\.pnpm-store\v11`，**可写**，无历史坑）
- ⚠️ 先跑的是 `pnpm install`（frozen 默认 true）⇒ **拒**，报错原文正是双锚的第一半：
  `[ERR_PNPM_OUTDATED_LOCKFILE] … specifiers in the lockfile don't match specifiers in package.json: @deepseek-ai/dsh-sandbox-local (lockfile: *, manifest: 0.1.5-rc.2)`
- 旧代计数：lock 里 `0.0.1-rc.1` **17 → 16**（消掉的就是 dialect 那条）

### J2（落盘）

- 落点 = `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-sandbox-dialect/`
- 内容 = **只 2 文件**：`index.js` **4087 B** ＋ `package.json` **551 B**（551 = 改了 peer 之后的长度，原 542），SHA256 与仓库源 **SAME**；`node_modules` **未带上**（`Test-Path` = false）；`@larryagent/` 下只有这一条、`LinkType` 为空（**实体**）
- 两级解析（Node，从落点算）：`@deepseek-ai/dsh-sandbox-local` → `…\.dsh-home\profiles\sdk\node_modules\@deepseek-ai\dsh-sandbox-local\lib\index.js`（**自身层真树**）；`@deepseek-ai/dsh-llm` → 同层；`import` ✅

### J3 / J4（patch ＋ 生效自检）

```
改前 patch = 217 B（模板空态，末行 `[]`）
改后 patch = 769 B（模板 3 行头 + 两段：`- id: sandbox / disabled: true` ＋ `- insert: … sandbox-dialect`）
```
`--dump-config`（`DSH_HOME=<工程 .dsh-home 绝对路径>`）：

| 态 | `- id: sandbox` 行 | 该行 `disabled` | `sandbox-dialect` 出现次数 | out/err |
|---|---|---|---|---|
| 改前 | 在（`name: '@deepseek-ai/dsh-sandbox-local'`） | **无** | **0** | 11533 B / 0 B |
| 改后 | 在（**保留**） | **`disabled: true`** | **1**（行 `- id: sandbox-dialect` ＋ `name: '@larryagent/plugin-sandbox-dialect'`） | 11812 B / 0 B |

### J5（真 e2e，本项核心）

通道 = `harness/scripts/dsh-prompt.mjs`（client 同源 SDK 通道）；home = **工程 `.dsh-home`**（由装置内部按仓库绝对路径算，**不依赖 `pwd -W`**）；profile = `sdk`；cwd = `D:\Code\larry-sbox-372\ws`（⇒ session cwd ⇒ 沙箱 `workspaceRoot`）；越界目标 = `D:\Code\larry-sbox-372\outside\denied.txt`。

prompt 原文（含"别升权、别换写法"的约束）：

```
只做这一件事，不要做任何探索、不要读别的文件。
用 pwsh 工具运行下面这条命令（原样照抄，不要改写、不要换成别的写法）：
node -e "require('fs').writeFileSync('D:/Code/larry-sbox-372/outside/denied.txt','x')"
然后把该命令的 stdout 与 stderr **原样**贴回来（不要总结、不要解释、不要省略）。
⛔ 不要传 sandbox_permissions 或任何升权参数；不要换别的方式重试。
```

**两态工具返回原文**（模型侧看到的，逐字）：

`unpatched`（摘掉修复件）：
```
Error: EPERM: operation not permitted, open 'D:\Code\larry-sbox-372\outside\denied.txt'
    at Object.writeFileSync (node:fs:2413:20)        … errno: -4048, code: 'EPERM', syscall: 'open' …
Node.js v24.14.1
[exit code: 1]
```
`patched`（挂上修复件）—— **同样的 EPERM 原文，后面多两行**：
```
Node.js v24.14.1
[sandbox: file access denied under workspace-write mode]
[sandbox: escalation available — retry this exact command once with sandbox_permissions (the narrowest wider mode that suffices) + justification; the approval prompt asks the user]
[exit code: 1]
```

- 两态**越界文件都没被创建**（正对照：这条命令确实写不出去）✅
- 模型**照做了、也没升权**（未见 `sandbox_permissions` 调用）
- 证据脚本一次跑完两态：`node harness/scripts/run-372-dialect-e2e.mjs` ⇒ **EXIT=0 / 判据全过（双锚成立）**

### J6（双面同步）

| 文件 | 本地 md5 | CVM md5 | 一致 |
|---|---|---|---|
| `harness/packages/plugin-sandbox-dialect/package.json` | `c62d3c08413c58973cf89d98fab369f0` | 同 | ✅ |
| `harness/pnpm-lock.yaml` | `f1e41ed5d843f8f8998eccd8be1c9044` | 同 | ✅ |
| `harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` | `4dbcdacfad1317e3cb2345b22d73c627` | 同 | ✅（顺带项①） |

CVM 上（`export PATH=$HOME/node/bin:$PATH`）：
- `pnpm install --frozen-lockfile` ⇒ **拒**（EXIT=1），原文：`The importer resolution is broken at dependency "@deepseek-ai/dsh-sandbox-local": version "0.0.1-rc.1" doesn't satisfy range "*"` —— 原因**不是锁写错**，而是"同步 lock 后，既有 `node_modules` 仍是旧代"
- `pnpm install --no-frozen-lockfile` ⇒ **EXIT=0**（`Done in 4.5s`）
- 验"解析得 015"：插件自身依赖版本 = **`0.1.5-rc.2`**；junction → `.pnpm/@deepseek-ai+dsh-sandbox-local@0.1.5-rc.2_…_afd5a527…`；`import` **ok** ＋ `extras` 三条 ✅
- lock 的 dialect 条目 `specifier: 0.1.5-rc.2`；`0.0.1-rc.1` 计数 **17 → 16**

### J7（不污染基线）

- `sdk/package.json` 哈希 = `167A1F304B43C801`（与 3.7.1 取的 T0 **相同**）⇒ **未被 `dsh plugin add` 改动**（本块**没跑过** `plugin add`）
- `harness/vitest.config.ts` 的 `include = ['tests/**/*.test.ts']` ⇒ 新装置在 `scripts/`，**不在**测试面内
- 装置里 `DSH_REAL_API` 出现次数 = **0**（不改开关语义）
- 等价跑一遍 `npx vitest run`：`Test Files 3 failed | 4 passed | 2 skipped (9)` / `Tests 3 failed | 16 passed | 4 skipped (23)`；**3 条红全部是"设计上预期 FAIL"的反向哨兵**（`sentinel-failfast` / `sentinel-unset` / `sentinel-realapi-r1`，标题自带"预期 FAIL——证明护栏存在"）⇒ 与本次改动**无耦合**

## 负向对照

| # | 破坏动作 | 期望 | 实测 | "其余仍活"锚 |
|---|---|---|---|---|
| **①** | 摘掉修复件（patch 写回 `[]`） | 拒命令**未被识别** | ✅ marker **不出现**；但**能看到普通失败原文**（`operation not permitted` / `EPERM`）⇒ 证明"命令真跑了、真被拒了" | dump-config：官方 sandbox 行**在**且**未 disabled**、`sandbox-dialect` 行**不在** |
| **②** | **落错层**（放共享层 `profiles/node_modules/`） | 插件 `import` 崩 | ✅ 崩，文案逐字命中：`SyntaxError: The requested module '@deepseek-ai/dsh-llm' does not provide an export named 'assertNever'`（该层把 `dsh-sandbox-local` 解到旧代支 `…_fc402b20…`） | sdk **自身层**那份 `import` **ok**（extras 三条）⇒ 差异确实来自"层" |
| **③**（可选，**未全验**） | 插件改用 link 装 | bare import 从源目录解析 ⇒ 取不到配套依赖 | ⚠️ 只做到 **Node 层等价实验**：从仓库源目录解析 `dsh-sandbox-local` **成功**（新支）、`dsh-llm` **MODULE_NOT_FOUND**；真造 link-mount 的 dsh 启动**未做**（要动 profile manifest） | — |

⚠️ 负向 ② 的现场：3.7.1 落在共享层的那份**已不在**（复核方清掉），故**是我按 J2 的 ⛔ 现场构造的**（拷 2 文件 → 测 → **已删除**，共享层现为空）。

## 未闭合项

| # | 未闭合 | 说明 / 我的判断 |
|---|---|---|
| 1 | **负向 ③（真 link 挂载）未做** | 只到 Node 解析层。真验要改 profile manifest 起一次 dsh，属当时禁区；若要，可并入 3.2.1 同批 |
| 2 | **`.ignored_dsh-sandbox-local` 定性未定** | 实证：**空目录**（0 项）、**peer 改成 015 之后仍存在** ⇒ **不是**"peer 没装成"的标记；**推断**是 pnpm 对**可选 peer** 的占位记账 —— **未找到官方依据**，故**没删** |
| 3 | **同类旧代隐患仍在** | lock 里还有 **16 处** `0.0.1-rc.1`，属 `plugin-sandbox-mount-probe` / `plugin-storage-probe` 等**未派任务**的包（peer 同为 `*`）⇒ 同一个坑，本块**未动**（超范围）。建议单独派一行 |
| 4 | 同步后 `pnpm install` 必须 `--no-frozen-lockfile` | 本机与 CVM 都是；升级 SOP / 同步脚本里应写清（否则会以"锁坏了"的样子报错，实际是既有 `node_modules` 滞后） |
| 5 | 落盘后**未做真客户端（Tauri）重启**验证 | 本机没有可跑的 Tauri 链路；e2e 走的是 client 同源脚本 |

## 证据位置

- 本机：`D:\Code\LarryAgent\.s372-evidence\`（已加入 `.gitignore`）—— `372-{unpatched,patched}.prompt.{stdout,stderr}.txt`（两态工具返回原文）／`372-{unpatched,patched}.dump-config.{out,err}.txt`／`372-e2e.summary.json`
- 装置：`harness/scripts/run-372-dialect-e2e.mjs`（一条命令、退出码 `0/1/2/124`）
- 一次性探针（仓库外，备查）：`D:\Temp\dsh-probe\372-{import-probe,layer-probe}.mjs`
- CVM：`/tmp/372-cvm-install.log`、`/tmp/372-cvm-install2.log`
- 复跑（一条）：
  ```bash
  cd /d/Code/LarryAgent && node harness/scripts/run-372-dialect-e2e.mjs     # Key 自动取 backend/config.yaml
  ```

## 自曝

1. **派发稿两处与实际不符**：
   - §4 说"全局 home 有 `.credentials.yaml`（可取 key）" ⇒ **实测该文件只有 `secret`（43 字符）、没有 DeepSeek key**；本机真 key 源 = `backend/config.yaml` 的**首条 `api_key`（35 字符）**。装置已按"两种字段名都认 + 两个候选文件"实现（**只打长度**）。
   - §5 说 mount.patch.yml 的注释"**已于 2026-09-17 订正**为 `profiles/<profile>/node_modules/…`" ⇒ 我读到的是**旧文本**（`profiles/node_modules/…`）。⚠️ 我订正后**又发现该文件已被他人追加了一个「2026-09-17 修订」块**（内容同向：旧代 `0.0.1-rc.1` / `assertNever`）⇒ 我**只做了去重合并、没有覆盖他人文字**（顺带项①的"同步覆盖"因此变成"先订正再同步"）。
2. **`--frozen-lockfile` 在 CVM 拒**：不是锁写错，是"lock 已同步、`node_modules` 还旧"。J6 的"装得上"**只有** `--no-frozen-lockfile` 才算验成 —— 这条我改了命令才过，如实记。
3. **负向 ② 的现场是我造的**（3.7.1 遗留已被清），测完已删；若要长期保留该现场做回归，说一声我再造。
4. **J5 的模型行为不可完全控**：模型**可能**不照做（本次照做、也未升权）。装置的防线 = "prompt 双流全空即作废" ＋ "unpatched 必须同时看到普通失败词"，这两条专治"没跑"伪装成"没被识别"。
5. **我动了 `harness/pnpm-lock.yaml`**（J1/J6 要求）：本机与 CVM 各重算一次；CVM 那次是**在既有 node_modules 上就地升级**（`--no-frozen-lockfile`），会改写 `~/harness/node_modules` 与插件源目录的 `node_modules`（**未动任何 profile**）。
