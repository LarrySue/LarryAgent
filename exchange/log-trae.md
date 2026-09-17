# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.3** · 工程卫生合并块（旧代依赖清理 ＋ CVM 副本补齐 ＋ 3.2 判据缺陷修复） | **Trae** | **本机 ＋ CVM 双侧** | ✅ **已回报（2026-09-17）** · **J1–J11** 逐条见下 · 一句话 = **(a) 已清干净、两侧 lock 逐字节一致** | 2026-09-17 |
| DSH-3.2.1 · Windows 侧 named semaphore 释放实测 | Trae | 本机 Windows | ⏸️ **仍顺延**（**与 3.7.3 场地相同、争用同一棵 `harness/node_modules` ⇒ 不可并行**；等 3.7.3 交回后起跑） | — |

- 已完成并复验（本段已清）：3.0 ✅ ／ 3.1 ✅ ／ 3.2 ✅ ／ 3.7.1 ✅ ／ **3.7.2 ✅（WB 逐条回源复核：J1–J7 全成立，一句话 = 生效）**。
- 任务清单与进度以 `TODO.md`「DSH-3」区为准（**一处两面**）；本区只放**怎么做**。
- ⚠️ **通用纪律（沿用 3.7.2 教训）**：**「权限前提已就绪」这类前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**；**改依赖树必须实跑，不得只凭推理**；**下失败判定前先验证执行通道本身**。

---

## 🚀 DSH-3.7.3 · 工程卫生合并块

> **派发日**：2026-09-17 ｜ **执行人**：Trae ｜ **场地**：本机 ＋ CVM 双侧 ｜ **老大裁决**：「完全没用的就删掉，不能删掉的就改，不严谨的地方收紧，合并派出去」
> **合并范围**（三件合成一块，因三者**同一场地 ＋ 争用同一棵 `harness/node_modules`** ⇒ 必须串行在一份稿里做）：
> ① **harness 工作区旧代依赖清理**（3.7.2 未闭合项 2 转出）
> ② **CVM 副本补齐**（3.7.2 未闭合项 4 ＋ 3.1 前置遗留）
> ③ **3.2 判据缺陷修复**（`resumeTarget.p2LandedOnSameLog` 恒 `null`/`false`）

### 0 · 目标

**要回答的一件事**：`harness` 工作区里那批旧代依赖（`0.0.1-rc.1`）**清干净了没有**，且**没顺手打断任何在飞成果**。

同时**必须把两个容易被混成同一件事的结论显式拆开**（⛔ 不可合并汇报）：

| | 是什么 | 本块范围 |
|---|---|---|
| **(a)** harness **工作区**的旧代依赖（`dsh-sandbox-local` / `dsh-sandbox-windows-acl` / `dsh-storage-domain` 三个包的 `0.0.1-rc.1`），由**声明不严谨**引入 | 依赖卫生问题 | ✅ **本次修** |
| **(b)** CVM **生产参照 profile** `~/larry-dsh-home/profiles/sdk` 整体仍是 **`0.1.2-rc.1`（012 代）** | 代际问题 | ⛔ **本次不动，另议** |
| **(c)** 工程 `.dsh-home/profiles/node_modules/` 共享层 **241 条 junction 全指 `harness/.pnpm`** | 落层问题 | ⛔ **本次不动**（3.7.2 的做法是"绕开它"，断它的引用是另一件事） |

**为什么不合并**：(a) 清完后，若 (c) 那 241 条 junction 仍指旧代，那是**共享层自身**的问题（它镜像的是旧解析结果），不是同一根因；把 (a)(b)(c) 混报会得出"旧代问题已彻底解决"的**错误结论**。⇒ 见「诚实边界」。

**一句话口径**：本块 = **把 (a) 的引用者清掉**；`(b)` / `(c)` 的清理由后续另行裁决。

---

### 1 · 判据

> 逐条编号。**每条写明取什么证据**；**缺这条即未闭合**。
> ⛔ 禁止"跑通了""验证过了"这类自述型判据 —— 每条都要能写出**命令 ＋ 期望观测**。

#### J1 · 声明终态（本机，4 个包）

改动**只允许**落在这 4 个文件的 `peerDependencies` / `peerDependenciesMeta` 两段上：

| 文件 | 期望终态 | 依据 |
|---|---|---|
| `harness/packages/plugin-sandbox-mount-probe/package.json` | **两段均不存在**（删干净，不是留空对象） | 该包 `index.js` 零 import 任何裸包（只用 `node:` 内建 ＋ `inject` 拿服务）；`node_modules` 里那条 peer 声明**唯一作用是把它拽进树** |
| `harness/packages/plugin-storage-probe/package.json` | **两段均不存在** | 同上；且其 `index.js` 头注释自己写明 *"Deliberately dependency-free … any bare import would resolve against the harness tree and fail"* |
| `harness/packages/plugin-probe/package.json` | `@deepseek-ai/cordis` 的 specifier = **`^4.0.2`**；`peerDependenciesMeta.optional` **保留** | 该包 `src/index.ts` 有 `import type { Context } from '@deepseek-ai/cordis'` ⇒ **编译期要用类型**，声明**不能删** |
| `harness/packages/plugin-sandbox-probe/package.json` | 同上一行 | 该包 `src/index.ts:63` 同为 `import type { Context }` |

**取什么证据**：逐文件 `json.load` 后打印 `peerDependencies` / `peerDependenciesMeta` 两键的**原始结构**（`null` 就是不存在）。
**⚠️ 为什么 `cordis` 不能删**：`plugin-probe` / `plugin-sandbox-probe` 是 **TS 包**（`build: tsc -p tsconfig.json`），`import type` 在 `tsc` 阶段**必须**能解析到 `@deepseek-ai/cordis`；而 `lib/index.js` 是编译产物、里面**没有** cordis 的 import ⇒ 类型从哪来？就靠这条 peer 被 pnpm 装进树。⇒ **删它 = 下次 `pnpm build` 失败**。（`mount-probe` / `storage-probe` 是**纯 JS、无 tsconfig**，故可删。）
**⚠️ 为什么目标值是 `^4.0.2` 而不是精确版**：生态惯例实测 —— `harness/node_modules/.pnpm` 里 **238 个** `0.1.5-rc.2` 代包**一律**写 `peer cordis = ^4.0.2`（唯三例外是 `0.0.1-rc.1` 旧代那三个包，写 `^4.0.1-rc.1`）。⛔ **不要照抄 `plugin-sandbox-dialect` 的精确版写法** —— 那个 `0.1.5-rc.2` 是 3.7.2 的**刻意收紧**，语义不同（见「参考件四要素」④）。

#### J2 · lock 变干净（**两侧都要**）

- `harness/pnpm-lock.yaml`（本机）与 `~/harness/pnpm-lock.yaml`（CVM）：**`specifier: '*'` 出现次数 = 0**、**`0.0.1-rc.1` 出现次数 = 0**。
- **改前基线（本机，供对比）**：`specifier: '*'` = **6**、`0.0.1-rc.1` = **16**；lock = 547517 B / sha256 前 16 = `88616e8fdb303a17`（CVM 同结构，仅少 `packages/plugin-015-preset-probe: {}` 那两行 ⇒ 547477 B）。

**取什么证据**：`grep -c` 命令原文 ＋ 原始输出。⚠️ **lock 变小 ≠ 树变干净**（见 J3），两样都要报。

#### J3 · 物理树变干净（**两侧都要**）

`harness/node_modules/.pnpm` 下遍历读每个 `package.json` 的 `name`/`version`，期望：

| 包 | 期望支数 | 期望版本 |
|---|---|---|
| `@deepseek-ai/dsh-sandbox-local` | **1** | `0.1.5-rc.2` |
| `@deepseek-ai/dsh-storage-domain` | **1** | `0.1.5-rc.2` |
| `@deepseek-ai/dsh-sandbox-windows-acl` | **1** | `0.1.5-rc.2` |

**⛔ 遍历不得用目录名 glob** —— pnpm 的长包名目录是**截断名**（实测 `@deepseek-ai+dsh-sandbox-lo_fc402b20f9faa9a7c02be663a2ee4def`，`local` 被砍掉）⇒ 用 `sandbox-local` 匹配目录名**必然 0 命中**。必须遍历 `.pnpm/*/node_modules/@scope/*/package.json` 读 `name` 比对（**scope 目录本身没有 `package.json`，别把它当空壳**）。
**取什么证据**：给出「包名 → 版本集合 → 支数」表。
**改前基线（本机，供对比）**：上述三包**各 2 支**（`0.0.1-rc.1` ＋ `0.1.5-rc.2`）。

#### J4 · 正锚 —— **不得只验"旧代消失"**

- `@deepseek-ai/dsh-sandbox-local@0.1.5-rc.2` **仍在树里**（`0.0.1-rc.1` 消失 ≠ 顺手把 015 也删了）。
- `@deepseek-ai/cordis` 全树**仍只有 `4.0.2` 一支**（收紧 cordis 声明后解析结果不得变）。
- `harness/packages/plugin-sandbox-dialect/package.json` 的 peer（`@deepseek-ai/dsh-sandbox-local: 0.1.5-rc.2`）**仍解析到 015**。

**为什么**：只断言"旧代没了"无法区分「旧代清除」与「整棵依赖树被装空了」—— 那是**假通过**。

#### J5 · 回归 —— **3.7.2 的方言件成果不得被本次清理打断** ★ 最强负向对照

本机实跑 `harness/scripts/run-372-dialect-e2e.mjs`：

- **`exit 0`** ＋ 装置判据全过；
- 输出目录用环境变量 **`S372_EVIDENCE_DIR` 指到临时目录**（⛔ 不要覆盖 3.7.2 的交付证据）；
- 跑完 **工程 `.dsh-home/profiles/sdk/cordis.patch.yml` 复位回原态** —— 原态锚：**769 B / sha256 前 16 = `74400d260d5d4e6c`**。

**为什么这条最关键**：本块的改动会动 `harness/node_modules` 这棵树，而方言件正是靠这棵树解析依赖的。**若清理误伤它，这条必红**；反之它绿，就同时证明了"清理没打断在飞成果"。

#### J6 · 构建不回归

`pnpm build`（本机，`harness/`）⇒ **`rc = 0`**，且 **3 个有 build 的包全 `Done`**（`plugin-probe` / `plugin-sandbox-probe` / `plugin-tool-readfile`）。
**⚠️ 这是"cordis 声明收紧"的唯一可验反馈面** —— `plugin-probe` / `plugin-sandbox-probe` 的 `tsc` 若解析不到 `@deepseek-ai/cordis` **必然**在这里红。

#### J7 · 3.2 判据缺陷修复 ＋ 实跑自洽

- **代码层**：`harness/tests/s0-resume.test.ts` 的 `resumeTarget.p2LandedOnSameLog` **不再结构性地排除 `true`**。
  - 缺陷原文（`:312`）：`p2LandedOnSameLog: p2Log === null ? null : false`，而 `:309` 的 `p2Log` 定义为 `find(l => l.hasP2 && l.hasP1 === false)`（**只找"含 P2 但不含 P1"的日志**，即**另一条**日志）⇒ 该字段**按构造永不可能是 `true`**。
  - 真语义 = **"P2 落在 P1 那条日志上"** ⇒ 判据应是**同时含 `hasP1 && hasP2`** 的那条日志（`logsEvidence()` 已按 `text.includes(TAG_P1/P2)` 产出这两个布尔，故**原始数据已在 evidence 里**）。
- **实跑**：在 **CVM** 上跑 `S0_RESUME_VARIANT=key` 变体，回报 `evidence.sessionLogs` 的 **`hasP1`/`hasP2` 分布**（逐条）＋ `resumeTarget` 的实际取值，**两者须自洽**。
  - ⚠️ **场地写死 CVM**：3.2 的装置与结论都是 **CVM 单环境**得出的，换场地 = **跨通道外推**（见铁律「结论不得跨通道外推」）。
  - ⚠️ **`key` 变体前置**：第一轮必须真拿到框架自产 `sessionId`（`p1.sessionId !== null`），否则第二轮压根没发起、该字段无观测意义。
- ⛔ **诚实边界（必写进回报）**：**在 015 现状下（跨进程复用同 ID 被拒 = 真缺口），该字段仍不可观察到 `true`** ⇒ 本项**只能**证两件事：① 实现**不再排除** `true`；② 实跑取值**与原始分布自洽**。**⛔ 不得声称"resume 已可用"或"该字段已能翻转"**。

#### J8 · lock 双面字节一致

同步后：**本机 `harness/pnpm-lock.yaml` 的 sha256 == CVM `~/harness/pnpm-lock.yaml` 的 sha256**。
**⚠️ 若不一致 ⇒ 必须给出逐行 diff ＋ 原因**，⛔ 不得只报"已同步"。改前那 **40 B 差异**的成因已知（CVM `packages/` 只有 6 个包），**本次副本补齐后该差异应当消失**；若仍存在，说明补齐没做全。

#### J9 · CVM 副本补齐落地

| 对象 | 期望 |
|---|---|
| `~/harness/packages/` | **7 个包**（含 `plugin-015-preset-probe/`，本机有 CVM 缺） |
| `~/harness/scripts/015-preset-probe/` | 2 文件（`custom-preset.patch.yml` / `run-probe.mjs`） |
| `~/harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` | 与**本机当前版**逐字节相同（注释已订正为"必须落该 profile 自身层"） |
| `~/harness/SYNC-ANCHOR.txt` | 更新：新 `source-commit` / `synced-at` / `files` / `bytes` |

**取什么证据**：逐文件 sha256 两侧对照表。

#### J10 · 基线未污染

- `harness/package.json`（sha256 前 16 = `e4d338caa2a0431b`，1283 B）**未被改动**（其 dsh 声明仍 `0.1.5-rc.2`）。
- `harness/packages/plugin-sandbox-dialect/package.json` **sha256 前 16 = `9d6f4794a8aec191`（551 B）未被改动**。
- 工程落点 `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-sandbox-dialect/`（`index.js` 4087 B / `022b0ff5efd11648`，`package.json` 551 B / `9d6f4794a8aec191`）**未被改动**。

**为什么**：本块是"清引用者"，**不是**"改方言件"；一旦这三个锚动了，说明改动**越界**了。

#### J11 · 旧代雷的传递面 —— 若 `windows-acl` 旧代仍在不许闷掉

`dsh-sandbox-windows-acl@0.0.1-rc.1` 是**被旧代 `sandbox-local` 拖进来的传递依赖**（而它正是**方言表**的宿主）。⇒ 若 J3 显示 `sandbox-local` 旧代已消失、但 `windows-acl@0.0.1-rc.1` **仍在**，**必须报出并追出还有谁在引它**（⛔ 不许当作"已清完"收口）。

---

### 2 · 判据前置

> 不满足则实验根本没跑起来、会得到**假阴性**。

- **前置 0 · pnpm 调用通道（★ 本机尤其注意）**
  - 本机 **必须用 `pnpm.cmd`**。实测：裸 `pnpm` 在本机 Bash 通道下**必崩** —— npm 的 sh 垫片依赖 `sed`/`dirname`/`uname`（本机 PATH shim 下不存在），且即使绕过也会把入口解析到 **`D:\node_modules\pnpm\bin\pnpm.mjs`**（错根）。**报错形如** `Error: Cannot find module 'D:\node_modules\pnpm\bin\pnpm.mjs'` ⇒ **那是通道问题、不是工程问题**。
  - **自证**：`pnpm.cmd -v` 必须 = **`11.7.0`**（与 `harness/package.json` 的 `packageManager: pnpm@11.7.0` 一致）。
  - CVM 侧裸 `pnpm` 正常（实测 11.7.0）。
  - ⛔ **不得改用 `npm` / `yarn`** —— 会重排整棵树，本块所有判据随之作废。
- **前置 1 · 先记改动前基线**：4 个 `package.json` 的 sha256 ＋ 两侧 `pnpm-lock.yaml` 的 sha256/尺寸 ＋ 旧代计数（`specifier: '*'` / `0.0.1-rc.1`）。**没有基线的改动无法证明"只有预期变化"**。
- **前置 2 · 孤儿锁**：本机 `harness` 下实测**无**（`*.lock` / `*.tgz` 命中 0）。⚠️ 若出现 `profiles/node_modules.lock`（A 锁，`dsh-atomic-write` 持有、**持有者死亡后永不自动回收**）⇒ 清法 = 读锁内 PID → `process.kill(pid, 0)` → **仅 `ESRCH`（进程不存在）才重命名**为 `*.lock.bak.<ts>`；⛔ **禁 `rm -f`**（会制造真并发故障）。
- **前置 3 · 重装路径**：优先 **`pnpm install --offline`** —— 依据：本次是**删引用**（`mount-probe` / `storage-probe` 不再需要那两个包）＋ `^4.0.2` 解析到的是**已在 store 里**的 `4.0.2` ⇒ **不需要新下载**。若 `--offline` 失败 ⇒ 改联网重试，并**记录实际走了哪条路**（这条属"通道"信息，须写进回报）。

---

### 3 · 交付物

- **改动件**（本机，受 git 跟踪，由你的改动直接落地）：
  - `harness/packages/plugin-sandbox-mount-probe/package.json`
  - `harness/packages/plugin-storage-probe/package.json`
  - `harness/packages/plugin-probe/package.json`
  - `harness/packages/plugin-sandbox-probe/package.json`
  - `harness/pnpm-lock.yaml`（重算产物）
  - `harness/tests/s0-resume.test.ts`（3.2 判据缺陷修复）
  - `harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml`（**仅当需要订正注释**；本机当前版已是订正后版本 ⇒ 大概率**不需改**，只需同步到 CVM）
- **CVM 侧**：按 J9 补齐 ＋ `~/harness/pnpm-lock.yaml` 重装。
- **证据落盘**：本机 `D:\Code\_trae-cvm-evidence\373\`（新建；逐件命名 `J<n>-<名称>.txt` / `.json`）；CVM 侧证据随 tar 或 scp 回传本机同一目录。
- **退出码约定**（沿用 3.1/3.2 家族）：`0` 通过 ／ `1` 测试失败 ／ `2` 前置缺失 ／ `124` 看门狗超时。
- ⚠️ **`harness/tests/s0-resume.test.ts` 类测试禁止注入真实 home**（`tests/isolated-setup.ts` 强制覆盖为临时目录 ＋ 正向白名单守卫；注入真实路径会触发 `sentinel-failfast` 判 FAIL）。

---

### 4 · 参考件四要素

① **路径（可复制）**

| 路径 | 作用 |
|---|---|
| `D:\Code\LarryAgent\harness\packages\plugin-sandbox-dialect\package.json` | **"声明 + 使用"配对的正确姿势样板**（peer 写显式版、`peerDependenciesMeta.optional: true`） |
| `D:\Code\LarryAgent\harness\packages\plugin-015-preset-probe\package.json` | **"无任何依赖声明"的包**该长什么样（整段**不存在**，不是空对象 `{}`） |
| `D:\Code\LarryAgent\harness\tests\s0-session-log.ts` | **多帧 zstd 回读**的现成器材（3.1 交付物）—— 若要读会话日志，⛔ **先用它，不要自造** |
| `D:\Code\LarryAgent\harness\scripts\run-372-dialect-e2e.mjs` | J5 的回归装置（**只跑、不改**） |

生态惯例取证（CVM 侧把 `harness` 换 `~/harness`）：
```bash
node -e "const fs=require('fs'),p=require('path');const R='harness/node_modules/.pnpm';let n=0;for(const e of fs.readdirSync(R)){const d=p.join(R,e,'node_modules','@deepseek-ai');if(!fs.existsSync(d))continue;for(const x of fs.readdirSync(d)){const j=p.join(d,x,'package.json');if(!fs.existsSync(j))continue;const k=JSON.parse(fs.readFileSync(j,'utf8'));const c=(k.peerDependencies||{})['@deepseek-ai/cordis'];if(c){console.log(k.name+'@'+k.version+' peer cordis = '+c);n++}}}console.error('样本数 '+n)"
```

② **怎么参考**：只读 `package.json` 的 `peerDependencies` / `peerDependenciesMeta` **两段的形态**（键名 / 嵌套 / 是否保留 `optional` / 整段不存在时的写法）。**读码即可，不需要跑**。

③ **参考程度**：**可抄形状**（段的存在与否、字段嵌套、`optional` 的写法）。**不要 fork、不要照搬别的段**。

④ **哪部分不可参考**（★ 必须逐条看）
- ⛔ `plugin-sandbox-dialect` 用的是**精确版** `0.1.5-rc.2` —— 那是 3.7.2 针对"方言件必须绑死当代"的**刻意收紧**，**语义不同**。本次 `cordis` 收紧**照生态惯例写 `^4.0.2`**，⛔ 不照抄精确版。
- ⛔ 这两个参考件的 `devDependencies`（`typescript`）、`dsh.bundle` 段、`scripts` 段**都不在本次范围**，⛔ 不要顺手对齐。
- ⛔ `plugin-015-preset-probe` 是 `private: true` 的**探针包**，其形态**不代表**产品包的规范写法。
- ⚠️ 上述 sha256 / 字节数锚**取自本机当前实物**；若你上手时核对不上，**先报出差异再动手**（多方可实时改文件，快照会过期）。

---

### 5 · 场地与器材

**本机**
- 仓库根：`D:\Code\LarryAgent`；工作区：`harness/`（pnpm workspace，`packages/*` 共 7 个包）
- node **22.22.2**；pnpm **11.7.0**，**本机调用式 = `pnpm.cmd`**（⛔ 不是裸 `pnpm`，见前置 0）
- 基线锚（改前实测，仅供你核对起点）：

| 对象 | 尺寸 | sha256 前 16 |
|---|---|---|
| `harness/pnpm-lock.yaml` | 547517 B | `88616e8fdb303a17` |
| `harness/package.json` | 1283 B | `e4d338caa2a0431b` |
| `harness/packages/plugin-sandbox-dialect/package.json` | 551 B | `9d6f4794a8aec191` |
| `.dsh-home/profiles/sdk/cordis.patch.yml` | 769 B | `74400d260d5d4e6c` |
| `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-sandbox-dialect/index.js` | 4087 B | `022b0ff5efd11648` |

**CVM**
- 通道（**一律前台跑**，后台任务拿不到沙箱放行）：
  ```
  ssh -i "C:/Users/SuLarry/.ssh/id_ed25519_cvm" -o BatchMode=yes ubuntu@49.232.129.252
  ```
- node **22.22.2**（需 `export PATH=$HOME/node/bin:$PATH`）；pnpm **11.7.0**（裸 `pnpm` 正常）
- `~/harness` = **无 `.git` 的 tar 副本**（同步协议见 `~/harness/SYNC-ANCHOR.txt`；`excluded: node_modules, .git, dist`；⚠️ 该文件还记着 **`kept:` 的 4 个手工脚本**（`multi-session-probe.mjs` / `mspp.mjs` / `lcp.mjs` / `wb-acp-fork-verify.mjs`）⇒ **沿用既有排除与保留规则，别把它们覆盖掉**）
- CVM 现有备份件（`package.json.bak-304` / `pnpm-lock.yaml.bak-304` / `pnpm-lock.yaml.frozen-012`）**不是本次产物、勿动**
- CVM `~/larry-dsh-home/profiles/sdk/package.json` 的 deps = `dsh-base@0.1.2-rc.1` ＋ `dsh-sdk-app@0.1.2-rc.1` ＋ `dsh-storage-sqlite@0.1.2-rc.1` ＋ `@larryagent/plugin-storage-probe`（**`link:/home/ubuntu/harness/packages/plugin-storage-probe`**）⇒ ⚠️ **该 profile 用 link 指到你的 `~/harness`**，所以**改 harness 会直接影响它** —— 这正是 J5 类回归判据存在的理由；但⛔ **它的内容本次不动**（012 代，另议）

**已知假绿坑（逐条都会让你得出反向结论）**
1. **本机裸 `pnpm` 会崩** ⇒ 看起来像"工程坏了"，实为通道问题（见前置 0）。
2. **`pnpm install` 在 up-to-date 时短路**：3.7.2 实测 frozen 路径 **430 ms 返回、无 `Verifying lockfile` 输出**。⇒ **"lock 变了"与"树变了"是两件事**，J2 / J3 都要报。
3. **遍历 `.pnpm` 不能用目录名 glob**（截断名，见 J3）。
4. **`pnpm run <script>` 会先自动跑一次不带参数的 `install`**（副作用）。
5. **pnpm 状态缓存不校验内容**：外部删过树后 `install` 与 `--force` 都可能回 `Already up to date`、**不自愈**（须删 `node_modules/.modules.yaml` ＋ `.pnpm-workspace-state-v1.json`，或整树重装）。⇒ 若 J3 显示旧代残留而 install 报 up-to-date，**先查这条**，再判"没清掉"。
6. **`install` 的输出不能当验收**（报 `Done` / `exit 0` / 零 error 仍可能是空壳树）⇒ 必须用遍历读 `package.json` 逐条验（J3）。
7. **CVM 的 `pnpm-workspace.yaml` 与 profile 那份不同**：`~/larry-dsh-home/profiles/sdk/pnpm-workspace.yaml` 是 `autoInstallPeers: false` ＋ `nodeLinker: hoisted`，**那不是我方工作区**，⛔ 别拿它当参考、也别改它。

---

### 6 · 回报格式

**结论先行**（一句话：旧代清了没有 / 两侧是否字节一致），然后：

1. **J1–J11 逐条**：命令原文 ＋ **原始输出** ＋ 判读。⛔ 不许只写"通过"。
2. **改动清单**：逐文件 `git diff --stat` ＋ 关键 diff 片段（`package.json` 的两段）。
3. **实际走的重装路径**（`--offline` 成功 ／ 联网 ／ 需 `--force` ／ 需删 `.modules.yaml`）—— 属**通道信息**，必报。
4. **未闭合项单列**（含你判断为"本次不该做"的）。
5. **自曝**：跑歪了 / 判据要订正 / 发现稿件矛盾，**直接写**。**「成因未知」是可接受的结论 —— 别为叙事完整编一个。**
6. **说"没有 / 不存在"必须附检索式与遍历范围**（否则不可验，等于没回答）。

---

### 7 · 禁区

- ⛔ **不碰 `.dsh-home/profiles/node_modules/`**（共享层，**241 条 junction** 属本块范围外的另一件事）。
- ⛔ **不碰工程落点** `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-sandbox-dialect/`（3.7.2 的成果，J10 有锚）。
- ⛔ **不碰 CVM `~/larry-dsh-home/profiles/sdk`** 的 `package.json` / `cordis.patch.yml` / `node_modules`（**012 代生产参照，另议**）。
- ⛔ **不改** `harness/packages/plugin-sandbox-dialect/package.json`（J10 有锚）。
- ⛔ **不删** `plugin-probe` / `plugin-sandbox-probe` 的 `cordis` 声明（编译期类型解析要用，见 J1）。
- ⛔ **不加 `pnpm.overrides`**（方案 C 未被采纳；本块只改声明本身）。
- ⛔ **`rm -rf` 一律禁用**：要清理树用 pnpm 自身机制，或先备份再整树重装。规范格式 = **重命名备份**（`xxx.bak.<ts>`），⛔ 不是 `rm`。
- ⛔ **凭据零落盘**：不打印、不写入、不落任何受版本控制的文件 / 日志 / 工具输出 —— 涉及 `backend/config.yaml`、任何 `.credentials.yaml`、CVM `~/.npmrc`。（本块**不需要**任何凭据；J7 若走 `key` 变体，凭据取值按既有装置原样引用，**值不得落稿**。）
- ⛔ **不改** `harness/package.json` 与 `harness/pnpm-workspace.yaml` 的 dsh 声明（J10 有锚）。
- ⛔ **不要在 CVM 上以"绕道"方式达成 J8**（如手工 `sed` 改 lock 让它字节相同）—— lock 必须是**重装产物**；两侧不一致而无法消除时，**如实报出并给逐行 diff**。

---

### 8 · 诚实边界（写明，避免后续误引）

- 本块**不得声称**「DSH 旧代问题已彻底解决」—— 见 §0 表：`(b)` 生产参照 profile 仍是 **012 代**、`(c)` 共享层 **241 条 junction** 未动，**两者都在范围外**。
- 本块**不得声称**「共享层那支旧代已被迁走」—— 删/改 peer 只消除**引用者**；共享层那 241 条 junction 需另行处置。
- 本块**不得声称**「resume 已可用」（见 J7 诚实边界）。
- 本块**不得声称**「两侧环境已完全一致」—— 本次只对齐 `pnpm-lock.yaml` 与列明的补齐件；两面 `node_modules` 的**布局差异**（本机 isolated ／ CVM 侧其余目录）不在范围。

---

# ✅ DSH-3.7.3 回报 · 工程卫生合并块（Trae 2026-09-17）

## 结论先行（一句话）

**(a) 已清干净**：本机与 CVM **两侧** `specifier: '*'` = **0**、`0.0.1-rc.1` = **0**，且物理树遍历 `stale = []`（三包版本集合都只剩 `0.1.5-rc.2`）；**两侧 `pnpm-lock.yaml` 逐字节一致**（541493 B / sha256 前 16 = `a03ede8de3f00ee3`）。
⛔ **边界**：`(b)` 012 代生产参照 profile 与 `(c)` 共享层 241 条 junction **本次未动** ⇒ **不得**据本块声称"旧代问题已彻底解决"或"共享层那支旧代已被迁走"。

## J1–J11 逐条

### J1 · 声明终态（本机，4 个包）✅

`node scan-pnpm-tree.mjs decl <4 文件>` 原始输出（`D:\Code\_trae-cvm-evidence\373\J1-decl-after.json`）：

| 文件 | `peerDependencies` | `peerDependenciesMeta` | `tsconfig` |
|---|---|---|---|
| `plugin-sandbox-mount-probe` | **null** | **null** | 无 |
| `plugin-storage-probe` | **null** | **null** | 无 |
| `plugin-probe` | `{ "@deepseek-ai/cordis": "^4.0.2" }` | `{ "@deepseek-ai/cordis": { "optional": true } }` | 有 |
| `plugin-sandbox-probe` | 同上一行 | 同上 | 有 |

**动手前先复核了依据**（通用纪律：不照抄旧前提）：
- `plugin-sandbox-mount-probe/index.js`：`grep -n '^\s*(import|export .* from|const .* = require)'` ⇒ 仅 3 行、**全是 `node:`**（`node:child_process` / `node:fs` / `node:path`）⇒ **零裸 import** ✔ 可删
- `plugin-storage-probe/index.js`：同检索式 ⇒ **0 命中**（唯一命中是头注释里那句 *"any bare import … would fail"*）⇒ 可删
- `plugin-probe/src/index.ts:12`、`plugin-sandbox-probe/src/index.ts:63` ⇒ `import type { Context } from '@deepseek-ai/cordis'` ✔ **声明不能删**

### J2 · lock 变干净（两侧）✅

| 侧 | 尺寸 | sha256 前 16 | `specifier: '*'` | `0.0.1-rc.1` |
|---|---|---|---|---|
| 本机 改前 | 547517 B | `88616e8fdb303a17` | **6** | **16** |
| 本机 改后 | **541493 B** | `a03ede8de3f00ee3` | **0** | **0** |
| CVM 改后 | **541493 B** | `a03ede8de3f00ee3` | **0** | **0** |

命令原文：`(Select-String -Path harness/pnpm-lock.yaml -Pattern "specifier: '*'" -SimpleMatch -AllMatches).Count`（旧代同法，pattern `0.0.1-rc.1`）。

### J3 · 物理树变干净（两侧）✅ —— ⚠️ 这里是本块最险的一步

**首装后扫，树竟然没变**（`D:\Code\_trae-cvm-evidence\373\J3-tree-after.json`）：

| 包 | branches（物理目录） | versions |
|---|---|---|
| `dsh-sandbox-local` | 4 | `["0.0.1-rc.1","0.1.5-rc.2"]` |
| `dsh-storage-domain` | 6 | 同上 |
| `dsh-sandbox-windows-acl` | 4 | 同上 |
| `stalePackagesStillInTree` | — | `[sandbox-local@0.0.1-rc.1, windows-acl@0.0.1-rc.1 ×2, storage-domain@0.0.1-rc.1]` |

⇒ 即"**lock 变小 ≠ 树变干净**"（派稿坑 2/5）**实测成立**。**起效路径**：

```
① 常规 pnpm.cmd install --offline --no-frozen-lockfile   → exit 0（Packages: -4）但复扫仍脏
② 重命名 node_modules/.modules.yaml ＋ .pnpm-workspace-state-v1.json（→ *.bak-373-20260917194716）
③ 再 install（--offline --no-frozen-lockfile）           → 复扫 stale = []  ✅
④ 另跑一次 --force（591 ms，Already up to date）—— 无副作用
```

**改后（本机）**：`sandbox-local` branches 3 / `dsh-storage-domain` 5 / `windows-acl` 2，**versions 全是 `["0.1.5-rc.2"]`**，`stale=[]`。
**CVM 同形同法**：首装后 stale 仍在（4/6/4）⇒ 同样重命名两个状态文件 → install ⇒ **`stale=[]`**（3/5/2）。
**检索式与遍历范围**（"没有残留"这句话的可验凭据）：遍历 `node_modules/.pnpm/*/node_modules/{@scope/}*/package.json` 读 `name`/`version` 比对（**不用目录名 glob**，因 pnpm 长包名目录是截断名）—— 本机扫 **2574** 个、CVM 扫 **2579** 个 `package.json`。

> ⚠️ **口径订正**：派稿写"改前**各 2 支**"，我实测是 **2 个版本 × 多个 peer 变体目录**（物理目录 4/6/4）⇒ "支数"若指**物理目录**，清理后仍会 >1（本机 3/5/2）。**本报告以「版本集合」为判据**（同时给物理目录数），避免把"peer 变体"误读成"没清干净"。

### J4 · 正锚 ✅

- `@deepseek-ai/dsh-sandbox-local@0.1.5-rc.2` **仍在树里**（`versions=["0.1.5-rc.2"]`）✔
- `@deepseek-ai/cordis` 全树**只有 `4.0.2` 一支**（branches 240 → **237**）✔
- `packages/plugin-sandbox-dialect/node_modules/@deepseek-ai/dsh-sandbox-local/package.json` = **`0.1.5-rc.2`**，且方言件 `import()` = **ok**（`extras` 三条）✔

### J5 · 回归（最强负向对照）✅ ★

`S372_EVIDENCE_DIR=D:\Temp\dsh-probe\373-evidence node harness/scripts/run-372-dialect-e2e.mjs` ⇒ **`E2E_EXIT=0`**（"判据全过（双锚成立）"）：

| 态 | marker | 普通失败词 | patch | dump-config |
|---|---|---|---|---|
| `unpatched` | **false** | `["operation not permitted","EPERM"]` | 217 B | sandbox 行在、未 disabled、无 dialect 行 |
| `patched` | **true** | 同上 | 769 B | sandbox 行在 + `disabled: true`、dialect 行在 |

越界文件两态均未创建 ✔；**证据目录指到临时目录**（未覆盖 3.7.2 交付证据）✔；跑完 `.dsh-home/profiles/sdk/cordis.patch.yml` 复位 = **769 B / sha16 `74400d260d5d4e6c`**，与派稿锚**逐字符一致** ✔

### J6 · 构建不回归 ✅

`pnpm.cmd build` ⇒ **rc = 0**；三个有 build 的包全 **Done**：`packages/plugin-probe build: Done` / `packages/plugin-sandbox-probe build: Done` / `packages/plugin-tool-readfile build: Done` ⇒ **cordis 收紧后 `tsc` 仍能解析到 `@deepseek-ai/cordis`** ✔

### J7 · 3.2 判据缺陷修复 ＋ 实跑自洽 ✅（附诚实边界）

**代码层（`harness/tests/s0-resume.test.ts`）**——订正前后：

```ts
// 订正前（结构性缺陷：按构造永不可能是 true）
const p2Log = evidence.sessionLogs.find((l) => l.hasP2 && l.hasP1 === false) ?? null
evidence.resumeTarget = { p1LogPath: …, p2LandedOnSameLog: p2Log === null ? null : false, p2LogPath: p2Log?.path ?? null }

// 订正后（真语义 = P2 是否落在 P1 那条日志上）
const p1Log = evidence.sessionLogs.find((l) => l.hasP1) ?? null
const landedOnP1Log = p1Log !== null && p1Log.hasP2 === true
evidence.resumeTarget = { p1LogPath: …, p2LandedOnSameLog: p1Log === null ? null : landedOnP1Log, … }
```

**实跑（CVM，`S0_TARGET_RUNNER=run-s0-resume.mjs … key`，exit = 0；证据 `J7-cvm-key.resume.json`）**：

| `sessionLogs` 分布 | 取值 |
|---|---|
| 1 条：`session-a76dc4b314d64fd8b51d2b9b514eda63/session.v3.jsonl.zstd`，11663 B，**`hasP1=true` / `hasP2=false`**，`lastEventType=turn/end` | `resumeTarget = { p1LogPath: <同一条>, p2LandedOnSameLog: **false**, p2LogPath: null }` |

**自洽性**：只有一条日志、且它不含 P2（第二轮被 `-32603 / session "…" already exists` 拒，根本没跑起来）⇒ `p2LandedOnSameLog=false` 与原始分布**一致**；第一轮真拿到框架自产 `sessionId` 且 `turnEndKind=completed`（前置成立）✔
⛔ **诚实边界（照派稿写明）**：015 现状下该字段**仍观察不到 `true`**（跨进程复用同 ID 被拒 = 真缺口）⇒ 本项**只证两件事**：① 实现**不再排除 `true`**；② 实跑取值与原始分布**自洽**。**不得**据此声称"resume 已可用"或"该字段已能翻转"。

### J8 · lock 双面字节一致 ✅

**本机 sha256 == CVM sha256**（两者都是 541493 B / 前 16 `a03ede8de3f00ee3`）⇒ 上轮那 40 B 差异（CVM 少 `plugin-015-preset-probe` 两行）**已消失**。
⚠️ **途中一度失败并已定位**：把干净 lock scp 到 CVM 后，CVM 的 install **把 lock 改回旧态**（547517 B / 16 处旧代）—— 根因 = 我**只同步了 lock、漏同步 4 个 `package.json`**（CVM 的 manifest 仍写 `*`）⇒ 补同步 4 件后重装即一致。**这条说明 J9 的"补齐"必须包含 J1 的 4 个 manifest，否则 J8 不可能达成。**

### J9 · CVM 副本补齐 ✅

逐文件 sha16（**11 件两侧完全一致**，原始表见 `J9-cvm-hashes.txt`）：

| 文件 | 尺寸 | sha16 |
|---|---|---|
| `packages/plugin-015-preset-probe/{package.json, index.js, cordis.patch.yml}` | 535 / 19543 / 387 | `7c6552639ebf5f76` / `82fd61a2949d1eca` / `916ffccb41ff7624` |
| `scripts/015-preset-probe/{custom-preset.patch.yml, run-probe.mjs}` | 1642 / 3140 | `110677d31dddc366` / `4e648059d0bac33f` |
| `packages/{mount-probe, storage-probe, probe, sandbox-probe}/package.json` | 384 / 361 / 920 / 939 | `49cb96905dd32261` / `e4c65b5c8819cee4` / `26a415c9ce217587` / `81c72be6de77d707` |
| `scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` | 1776 | `d3d7ef8b99073d20` |
| `pnpm-lock.yaml` | 541493 | `a03ede8de3f00ee3` |

- `~/harness/packages/` = **7 个包** ✔（含 `plugin-015-preset-probe`）
- `SYNC-ANCHOR.txt` **已更新**：`source-commit: 917f45d4a020f7711171e273711954676fe1b7ce` / `synced-at: 2026-09-17T20:05:00+08:00` / `files: 11 bytes: 571120` / `mode: incremental`
  - ⚠️ 顺手订正一行：`kept:` 那 4 个手工脚本**在 `~/harness/` 根、不在 `scripts/`**（我自己就曾因 `ls scripts/` 找不到而误以为被覆盖）

### J10 · 基线未污染 ✅

| 对象 | 实测 | 派稿锚 | |
|---|---|---|---|
| `harness/package.json` | 1283 B / `e4d338caa2a0431b` | 同 | ✔ |
| `harness/packages/plugin-sandbox-dialect/package.json` | 551 B / `9d6f4794a8aec191` | 同 | ✔ |
| 落点 `…/plugin-sandbox-dialect/index.js` | 4087 B / `022b0ff5efd11648` | 同 | ✔ |
| 落点 `…/plugin-sandbox-dialect/package.json` | 551 B / `9d6f4794a8aec191` | 同 | ✔ |

### J11 · `windows-acl` 旧代传递面 ✅

**已消失**：`stalePackagesStillInTree = []`（两侧）⇒ **无需追引用者**。
检索式与范围：遍历 `node_modules/.pnpm/*/node_modules/{@scope/}*/package.json`（本机 2574 / CVM 2579 个）读 `name`+`version`，末位判据 `version.includes('0.0.1-rc.1')` ⇒ **0 命中**。

## 改动清单

`git diff --stat`（6 文件 / **+16 −113**）：

```
harness/packages/plugin-probe/package.json         |  2 +-
harness/packages/plugin-sandbox-mount-probe/package.json |  6 --
harness/packages/plugin-sandbox-probe/package.json |  2 +-
harness/packages/plugin-storage-probe/package.json | 10 ---
harness/pnpm-lock.yaml                             | 96 +---------------------
harness/tests/s0-resume.test.ts                    | 13 ++-
```
- `mount-probe` / `storage-probe`：**整段删除** `peerDependencies` ＋ `peerDependenciesMeta`（不是留空对象）
- `probe` / `sandbox-probe`：`"@deepseek-ai/cordis": "*"` → **`"^4.0.2"`**，`peerDependenciesMeta.optional` **保留**
- `mount.patch.yml` **无 diff** ⇒ 派稿"大概率不需改"成立（3.7.2 已改并提交）

## 实际走的重装路径（通道信息，必报）

| 侧 | 步骤 | 结果 |
|---|---|---|
| 本机 | `pnpm install`（frozen 默认 true） | ❌ 拒：`[ERR_PNPM_OUTDATED_LOCKFILE] … (lockfile: *, manifest: ^4.0.2)` |
| 本机 | `--offline --no-frozen-lockfile` | ✅ exit 0（`Packages: -4`），但**复扫仍脏** |
| 本机 | **重命名 `.modules.yaml` ＋ `.pnpm-workspace-state-v1.json`** → 再 install | ✅ **树回收**（`stale=[]`） |
| 本机 | `--force` 补跑 | ✅ 591 ms up-to-date，无副作用 |
| CVM | `--offline --no-frozen-lockfile` | ✅ exit 0，但**把 lock 改回旧态**（漏同步 manifest）→ 补同步 4 件 → 再 install |
| CVM | 再 install 后**复扫仍脏** → 同法清状态文件 → install | ✅ **树回收**（`stale=[]`） |

⇒ **`--offline` 全程够用**（未联网）；**起效关键是清 pnpm 状态文件**，不是换命令。

## 未闭合项

| # | 项 | 说明 |
|---|---|---|
| 1 | `(b)` 012 代生产参照 profile | `~/larry-dsh-home/profiles/sdk` 仍是 `0.1.2-rc.1`；本块范围外（派稿 §0 已定） |
| 2 | `(c)` 共享层 241 条 junction | `工程 .dsh-home/profiles/node_modules/` 仍指 `harness/.pnpm`；本块范围外 |
| 3 | **pnpm"不回收旧 `.pnpm` 目录"的成因未查清** | 我只有现象（首装后残留）＋可行处置（清状态文件）；**未找到官方依据**，故不编成因 |
| 4 | 备份件仍在 | 本机与 CVM 各留 `node_modules/.{modules.yaml,pnpm-workspace-state-v1.json}.bak-373-*`（按禁区"重命名备份"处置，**未删**）—— 何时清待裁 |
| 5 | 两面 `node_modules` 布局差异 | 本机 isolated ／ CVM 其余目录，派稿 §8 已声明不在范围 |

## 自曝

1. **3.7.2 的一处顺序失误**：上轮 J6 的 `mount.patch.yml` 同步发生在**去重合并之前** ⇒ CVM 留的是合并前版本（1868 B），本机才是最终版（1776 B）。本轮已覆盖并逐字节核对（`d3d7ef8b99073d20`）。**这条是本次"两侧不一致"的真因，不是别人改的。**
2. **我扩了 J9 的范围**：派稿 J9 表里没列 4 个 `package.json`，但 J2 要求"两侧都要"干净 ⇒ 不同步它们，CVM 的 install **必然**把 lock 改回旧态（已实测）。**这条扩范围是必须的**，否则 J8 不可能达成。
3. **派稿 §5 的器材描述有两处与实测不符**：① `node` 实测 **v24.14.1**（派稿写 22.22.2）；② J3 的"改前各 2 支"是**版本数**、不是**物理目录数**（我实测 4/6/4）⇒ 已在 J3 写明口径。
4. **我多花了两步做"依据复核"**：动手删声明前，先实跑检索式确认两个 JS 包**零裸 import**、两个 TS 包**确有 `import type { Context }`**（派稿已给依据，按"不照抄旧前提"的通用纪律复核一遍）。
5. **`--force` 到底是必需还是空跑，我没能精确归因**：清状态文件后的 install（1.2–1.5 s）与随后的 `--force`（591 ms）之间**我没有再扫一次**，故只能说"该组合起效"，**不能**断言 `--force` 是必要条件。

## 证据位置

`D:\Code\_trae-cvm-evidence\373\`：`J0-preflight.txt`（前置 0/1/2）／`J1-decl-after.json`／`J2-install-offline*.{out,err}.txt`／`J2-diff-stat.txt`／`J3-tree-{before,after,after-force,CVM}.json`／`J3-install-force.*`／`J5-regression.log`／`J6-build.{out,err}.txt`／`J7-cvm-key.resume.json`／`J9-cvm-hashes.txt`／`J10-anchors.txt`／`SYNC-ANCHOR.txt.new`／`scan-pnpm-tree.mjs`（取证脚本，两侧通用）。CVM 侧另有 `/tmp/373-cvm-install{,2,3}.log`、`/tmp/373-resume-key.log`。
