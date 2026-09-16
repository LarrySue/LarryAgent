# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 派发 · 003 · 装 profile + 重跑 D / E（2026-09-16 出稿）

> **执行人**：Trae ｜ **场地**：CVM ｜ **复验**：WB（回报落本文件）
> **基线**：`0.1.5-rc.2`（**老大 2026-09-15 拍定**，解除 DSH-2.6「不升基线」——那条按当时状况成立）
> **前置三项已全部解除**：① 基线已拍；② 001 卡点（D 组 profile 未装）**根因已查明** = `~/.dsh/profiles/sdk` **空壳**（**与凭据无关**）；③ 001 的 J1 装 profile 授权**已作废**（那两条钉死 `0.1.2-rc.1`）
> **规格原文** → `../TODO.md` DSH-3.0 段 `:64-78`；**判据 / 验收基准 / 执行范式** → `../docs/dsh/dsh-migration.md` §3.6「DSH-3」

### 任务 0 · 前置核对（先做，不通过就停）

1. `npm view @deepseek-ai/dsh versions` —— 确认 `0.1.5-rc.2` 存在于 registry
2. **CLI / hoisted 层与 profile 同代** —— 本机已实测到**跨版本混合体**（`.dsh-home` sdk 侧 105 包 @015 ｜ `~/.dsh` hoisted 根 214 包 @012）。这是你 §6-1 报的「profile 跨版本混合」；上游 016-alpha 已新增 `packages/boot/app-boot/src/profile-resolution/`（`resolver.ts` 975 行，PR `fix/profile-module-resolution`）⇒ **上游已知问题，非我们独有**。装前核代际、装后回核。

### 任务 1 · 装齐 CVM `~/.dsh/profiles/sdk`

**两条命令**（**全程带 `DSH_HOME=$HOME/.dsh`**）：

```
dsh plugin --profile sdk add @deepseek-ai/dsh-base@0.1.5-rc.2
dsh plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.5-rc.2
```

- **这就是完整 composition**：本机 `.dsh-home/profiles/sdk` 的 deps 恰为这两项，`storage` / `session` 类包**随传递装齐**（`dsh-session-persistence-jsonl` / `dsh-session-query-sqlite` / `dsh-storage-json`）⇒ **无需**手工补
- 若因 `allowBuilds` 以 exit 1 结束 → 见 `../docs/local-env.md` §8.4 第 3 条

**本任务判据**：
- `~/.dsh/profiles/sdk/dependencies` ≠ `{}`（现为**空壳**）
- `~/.dsh/profiles/sdk/node_modules/@deepseek-ai` 包数 > 0（现为 0）

**⛔ 边界**：
- **`larry` profile 本次不动** —— CVM `~/.dsh/profiles/larry` 现 composition（api-gateway + host-webserver）与本地（base + headless）**不同**，属 3.5 / 3.7 派发时单独定
- **软链方案不采纳**（两个 home 缠在一起 = 正是要消灭的重叠环境）
- **`~/larry-dsh-home` 只作负向对照器材**（有完整 profile、**无凭据**）—— **它不是运行 home**，拿它跑出「绿」即无 key 假绿（D2 已实证）

### 任务 2 · 重跑 D 组（凭据层验真，本步最重要）

**目标**：证明 `~/.dsh/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY` **确实被读取且真用于调用**。

**装置**：`harness/scripts/dsh-prompt.mjs` **裸跑**（它**不覆盖 `DSH_HOME`** ⇒ 落 `~/.dsh`）

**三态**：

| 态 | 造法 |
|---|---|
| **真 key** | **不注入** env（走凭据文件） |
| **无 key** | `DSH_HOME=~/larry-dsh-home`（有 profile、无凭据） |
| **错 key** | 隔离 home + 伪造值 + 权限 600 |

**判据 = 三态互不相同**，且**每态记 `(DSH_HOME, profile, 凭据来源层)` 三元组**。

**⚠️ 为什么必须新开这条路径**：`run-real-api.mjs` → vitest → `vitest.config.ts` 的 `setupFiles: ['tests/isolated-setup.ts']` **强制把 `DSH_HOME` 覆盖为临时目录**（该文件 `:31-33`）⇒ **real-api 读不到凭据文件**，其 key 只能来自 env（`tests/real-api.ts:28`）。

**⛔ 红线**：
- **不得改动** `~/.dsh/.credentials.yaml`（负向两态一律用隔离 home 造）
- 回报**只写键名 / 是否存在 / 长度**，不写值

**❌ 上一轮（09-14）失败留痕，勿重蹈**：D1 ≡ D3（同为 `-32603 cannot create effect on inactive context`，**崩在启动期、不是鉴权**）、D2 exit 0 + stdout 全空（**无 key 假绿**）⇒ 三态不互异。**根因 = profile 空壳** ⇒ 装齐后重跑。

### 任务 3 · 重跑 E 组（real-api 在 CVM 侧）

**三态**：无 key / 错 key / 真 key，**同一脚本跑**；判据 = **三态表现互不相同**（⚠️ 无 key 态正是已证会假绿的那一态）。

⭐ **夹具改指 `~/.dsh/profiles`**（装齐后）—— 原 `~/larry-dsh-home/profiles` 是 **09-10 建的、当时基线 `0.1.2-rc.1`**，按 015 重跑**不能用它**（用了就是无效重跑）。用 `DSH_REAL_API_PROFILE_HOME` 指向即可；这是**夹具来源、不是 home 决定**。

**为什么重跑**：001 那轮按 `0.1.2-rc.1` 跑的 ⇒ 结论**跨版本失效**，只留「通道 / 环境自证」这一层效力。

**09-14 的 E 三态（012 基线，须按 015 重取）**：E1 不注入 → guard **显式失败**（有效 Key 用例 5 ms 即抛 = **未发起调用**）/ E2 错 key → 走了 API、**AUTH·401** / E3 真 key → **OK**（`verdict=OK … turn/end.kind=completed`）。

**⚠️ 本组只代表「环境变量层」** —— **不得**用于宣称「CVM 凭据文件生效」。

### ⛔ 假绿源清单（判「profile 可用性」一律不得使用）

| 命令 | 为什么假绿 |
|---|---|
| `dsh --profile <p> --help` | **不校验 profile 依赖**（三 home 全绿，1 s 内 exit 0） |
| `dsh --profile <p> --dump-config` | 只组配置树、**不激活** |

### 回报

- 落**本文件**（`exchange/log-trae.md`）
- 含：**命令原文 / 输出 / 三态判定 / 反例 / 三元组**
- ⚠️ **产出不得是唯一副本**：CVM **2026-10-09 到期**，产出须回传本机（`D:\Code\_trae-cvm-evidence\`）或入库

### 不在本任务内（老大定「一个一个发，不要并行发」）

- **3.2 / 3.7** → 待 003 后再发
- 3.1 → 批次 2 ｜ 3.3–3.6 → 批次 3（严格串行）｜ 3.8 + 3.9 → 批次 4

---

# 回报 003 · 装 profile + 重跑 D / E（Trae，2026-09-16）

> **结论先行**：**任务 0 部分通过｜任务 1 ✅ 完成（profile 装齐，判据两条均满足）｜任务 2 / 3 ⛔ 因一条「规格 ↔ 实测」矛盾阻断、三态不可判**。
> **一句话根因**：**profile 与 hoisted 根跨代** —— `~/.dsh/profiles/sdk` = `0.1.5-rc.2`，而同 home 的 `~/.dsh/profiles/node_modules` = **208 包 @ `0.1.2-rc.1`** ⇒ runtime **启动期即 `plugin tree failed to load`、exit 1** ⇒ 任何真会话 / 真 turn 都起不来（D、E 的真 key 态因此一步都跑不了）。
> **按 §边界停手**：我**没有**改 composition、**没有**升 CLI/SDK、**没有**动 hoisted 根与 `larry` / `web` / `acp`；老大 2026-09-16 拍「先不补」。

## 1. 任务 0 · 前置核对

| 检查 | 实测 |
|---|---|
| 0.1 registry 有无 `0.1.5-rc.2` | ✅ 有（`@deepseek-ai/dsh` 与 `dsh-base` 同；另有 `0.1.6-alpha.1`）；registry = `registry.npmmirror.com` |
| 0.2 装**前**核代际 | profile = **空壳**（`dependencies: {}`、0 包）｜hoisted 根 = **223 包 / 其中 208 个 `0.1.2-rc.1`**｜CLI = `0.1.2-rc.1`（无 `dsh` on PATH ⇒ 用 `<harness>/node_modules/@deepseek-ai/dsh/lib/bin.js`） |
| 0.2 装**后**回核 | **跨代依旧**：sdk 侧 99 包 @015 ＋ 5 个工具栈；**`dsh-session-persistence`/`dsh-session-query`/`dsh-http-proxy`/`dsh-app-boot`/`dsh-scope` 在 sdk 侧全部缺失** ⇒ 回落 hoisted 的 012（详见 §3） |
| 凭据现场 | `~/.dsh/.credentials.yaml` = **223 B / mode 600 / 含 1 行 `DEEPSEEK_API_KEY`**（值未读、未打印） |
| 负向器材 | `~/larry-dsh-home/profiles` = `acp / node_modules / sdk`（**012**、101 包、**同样缺** §3 那 5 个包） |
| 孤儿锁 | 无 |

## 2. 任务 1 · 装齐 `~/.dsh/profiles/sdk` ✅

**命令原文**（全程带 `DSH_HOME=$HOME/.dsh`；`CI=1`）：
```
node node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-base@0.1.5-rc.2
node node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.5-rc.2
```

| 轮次 | 现象 | 处置 |
|---|---|---|
| ① | **`ERR_PNPM_IGNORED_BUILDS`**（`dsh-subprocess-local` / `@google/genai` / `koffi` / `node-pty` / `protobufjs`）→ **exit 1** | 与 003 预告一致 ⇒ 按既有手法把 `profiles/sdk/pnpm-workspace.yaml` 的 `allowBuilds` 五项全改 `false`（**原件已备份** → `/home/ubuntu/trae-evidence/003/pnpm-workspace.yaml.orig`，sha256 `92e7ef26…`） |
| ② | base `Done in 3.1s`、**无 ERR**；但 **pnpm 报 Done 后 `node` 进程不退出**（挂 **1:51**）⇒ 我 kill 收尾（**exit 143**） | 与我在本机遇到的是同一现象（§7-3） |
| ③ | base **exit 0**（`Done in 2.5s`）、sdk-app **exit 0**（`Done in 2.7s`） | 判据两条均满足 |

⚠️ 途中有一次**我自己的操作事故**（留痕）：改 `pnpm-workspace.yaml` 时用 `sed -i s/\r//g` 去 CRLF，**反斜杠被本机→ssh 的传参吃掉** ⇒ 退化成"删掉所有 `r`"，`nodeLinke`/`subpocess` 之类被改花。已用 scp 上去的 node 脚本（`strip-cr.mjs`）重写并核对：`crlf=0 bytes=197`，sha256 `f25f534d…`。

**任务 1 判据**：
- `dependencies` ≠ `{}` ✅ → `{ "@deepseek-ai/dsh-base": "0.1.5-rc.2", "@deepseek-ai/dsh-sdk-app": "0.1.5-rc.2" }`
- `sdk/node_modules/@deepseek-ai` > 0 ✅ → **106**

⚠️ **一处观测异常（未闭合）**：每次 install 都打印 **`Packages: -60`**，但 profile 包数只增不减（0 → 106）、hoisted 根恒为 223 ⇒ 这 60 的归属**没查明**。记此以防后人把它读成"删了 60 个包"。

## 3. ⛔ 阻断取证链（本回报的核心）

| # | 环节 | 原始证据 |
|---|---|---|
| 1 | **runtime 单独 boot**（`--profile sdk`，stdin 保持 12 s） | `Error: dsh: plugin tree failed to load: failed to apply loader entry include (cordis:include): loader entries failed to apply` → **exit 1**；stderr **21856 B / 125 行**（`rt-real.rt-stderr.txt`） |
| 2 | **三条失败 entry** | ① `session-persistence-jsonl` ← `'@deepseek-ai/dsh-session-persistence' does not provide an export named 'SessionAlreadyExistsError'`；② `session-query-sqlite` ← `… no export named 'SESSION_QUERY_DEFAULT_PREPARED_SESSION_CACHE_SIZE'`；③ `web-fetch-http` ← `Cannot find package '@deepseek-ai/dsh-http-proxy'` |
| 3 | 这些包**在 sdk 侧根本没装** | `ls sdk/node_modules/.pnpm \| grep -c session-persistence` = **0**；`@deepseek-ai/` 下无该目录 |
| 4 | 为什么没装 | 锁文件里它们是**可选 peer**：`peerDependenciesMeta: {'@deepseek-ai/dsh-session-persistence': {optional: true}}`，且 profile 配了 `autoInstallPeers: false` ⇒ pnpm 把它们列进 **`transitivePeerDependencies`（32 条：25 个 `@deepseek-ai/dsh-*` ＋ ws/zod/…）并不安装** |
| 5 | 于是解析到哪 | 按 Node 解析规则退到**上一级** `~/.dsh/profiles/node_modules` ⇒ **`0.1.2-rc.1`**（导出对不上）；`dsh-http-proxy` 更是**全盘缺失** |
| 6 | ⭐ **决定性反证** | 09-14 那份**能跑**的 `~/larry-dsh-home`：我逐一核过，**同样缺**这 5 个包（全部 `=MISSING`），但它的 hoisted 根**也是 012**、与 profile **同代** ⇒ 回落拿到的是**匹配版本**，所以不报错 |

⇒ **根因 = 「profile 与 hoisted 根跨代」，不是「漏装包」**。这也与 003 §任务 0.2 提到的上游动向（016-alpha 新增 `profile-resolution/resolver.ts`、PR `fix/profile-module-resolution`）指向同一处。

## 4. 任务 2 · D 组三态 —— ⛔ 不可判

装置 = `harness/scripts/dsh-prompt.mjs` **裸跑**；**四态**（env 里 `DEEPSEEK_API_KEY` 一律删除）：

| 态 | 三元组 (DSH_HOME, profile, 凭据层) | profile 代际 | exit | stdout | 耗时 | 判读 |
|---|---|---|---|---|---|---|
| **D1 真 key** | `~/.dsh`, sdk, **真文件** 223B/600 | **015** | **1** | 空 | 1280 ms | 启动期崩 |
| **D2 无 key** | `~/larry-dsh-home`, sdk, 无 | **012** | **0** | 空（stderr `session=… events=12 notifications=14`） | 2497 ms | **能起 —— 但是"无 key 假绿"形态** |
| **D2b 无 key**（补的对照） | `/tmp/…-iso-nokey`(profiles→`~/.dsh/profiles`), sdk, 无 | 015 | **1** | 空 | 1512 ms | 启动期崩 |
| **D3 错 key** | 同上 iso, sdk, **伪造** 209B/600 | 015 | **1** | 空 | 1312 ms | 启动期崩 |

- **三态不互异**（D1 ≡ D2b ≡ D3：同崩、同 exit 1、同 1.3–1.5 s、同客户端栈 `JsonRpcResponseError: cannot create effect on inactive context` **-32603**）⇒ 判据**不成立**
- ⚠️ **唯一 exit 0 的那一态，恰好是"profile 与 hoisted 同代（012）"的那一态** ⇒ 它既是根因的**反证**，也正是 003 要我别重蹈的**无 key 假绿**：D2 与其它态的差异来自**代际**，**不是凭据**
- 红线守：真文件全程只读（只取 `present / bytes / mode / 键名 / 值长=35`）；负向两态一律**隔离 home** 造；隔离 home 用完即删（`/tmp/trae-003-iso-*` 已清）

## 5. 任务 3 · E 组三态 —— ⛔ 不可判（同形）

装置：`run-real-api.mjs`；夹具：**`DSH_REAL_API_PROFILE_HOME=/home/ubuntu/.dsh/profiles`（已按 003 改指 015）**

| 态 | 注入 | exit | 结果行 | R1 哨兵 |
|---|---|---|---|---|
| E1 | **不注入** | 1 | `Test Files 1 failed (1)`｜`Tests 2 failed \| 12 passed \| 1 skipped (15)` | **× 判红**（拿不到 `error.code`） |
| E2 | `sk-invalid-probe-003`（明示无效） | 1 | 同上 | 同上 |
| E3 | **真 key**（进程内传、落盘前脱敏） | 1 | 同上 | 同上 |

- **三态完全同形**（同 15 项、同 2 failed、同 ~1.24 s）⇒ 判据**不成立**
- ⚠️ 与 001 的 012 基线**不同形**（那次是 `Tests 1 failed \| 13 passed \| 1 skipped` 且 **R1 ✓ 通过**）⇒ 这轮多出来的那条 failed **就是 R1 自己**：它"判红"了但**没有 `error.code`** ⇒ 说明本轮不是 `AUTH/401` 那种**预期**失败，而是**启动期崩**（同 §3 根因）
- 机制自检 7 项**全 ✓**（它们不 boot profile）——**"绿了也不代表环境可用"的现成实例**
- ⚠️ 本组**只代表环境变量层**，且**因阻断而无效**，不得用于任何结论

## 6. 交付物 · 原始输出 · 红线自检

- **CVM**：`/home/ubuntu/trae-evidence/003/`（**30 件**）＋ `003.tgz`（14360 B）
- **本机（已回传，非唯一副本）**：`D:\Code\_trae-cvm-evidence\003-cvm\003\`（30 件）；装置源码另存 `D:\Code\_trae-cvm-evidence\003\`：`d-probe.mjs` / `e-probe.mjs` / `runtime-boot.mjs` / `strip-cr.mjs` / `pnpm-workspace.yaml`
- ⛔ **Tier0 自检**：对全部回传件扫 `sk-[A-Za-z0-9_-]{4,}` ⇒ 命中**仅**在我自己 driver 的源码里（伪造标签 + 脱敏正则），**任何日志/输出文件里都没有 key 值** ✅

## 7. 未闭合项 / 与规格矛盾

1. 🔴 **003 §任务 1「随传递装齐 ⇒ 无需手工补」与实测矛盾** —— 这是本次停手的直接原因（我**未**自行补）。
2. 🔴 **003 §任务 2/3 的判据「三态互不相同」在跨代环境下不成立** ⇒ 建议把**环境可用性**提升为判据的**前置**（＝我在 002 回报 §6-1 提的那条：**profile 必须与 CLI / hoisted 层同代**）。否则 D / E 永远只能产出"三态同崩"这种不可判结果。
3. ⚠️ **`dsh plugin add` 在 pnpm 报 `Done` 后 `node` 不退出**（CVM 实测挂 1:51，本机同）⇒ 建议写进执行范式：**后台 + 轮询日志 + 人工收尾**，不要指望退出码。
4. ⚠️ `Packages: -60` 的含义**未查明**（包数只增不减）。
5. ⚠️ **本机通道新坑（自留，防后人再踩）**：Windows→ssh 传参**不只吃双引号，也吃反斜杠** ⇒（a）远程命令**别用内层双引号**（要 `|` 模式就用 `grep -e … -e …`，别写 `grep -E "A|B"`）；（b）**别写 `sed s/\r//g` 这类含反斜杠的表达式**（会退化成"删字面 r"）。复杂动作一律**走 scp 上去的脚本**——本轮 4 个 driver（`d-probe` / `e-probe` / `runtime-boot` / `strip-cr`）零引号问题，这是本机通道下最稳的范式。
6. ⚫ **未做**（老大 2026-09-16 拍「先不补」）：把环境修成同代的三条候选路 —— **P1** 往 `~/.dsh/profiles/sdk` 显式补 3 个 015 可选 peer（最小、守 003 落点，但改 composition）；**P2** 另建全 015 home（不动 `~/.dsh`、不改 composition，但偏离 003 落点）；**P3** 升 CLI＋SDK 到 015（治另一层，单独做**不解决**这 3 条 entry）。**均未执行**。


# Trae 意见 · DSH-0.1.5 四稿（2026-09-15）

> 📮 **WB 状态批注（2026-09-15）**：7 条**已于 09-15 逐条回复**；**§三「基线 012 vs 015 冲突」已由老大 09-15 拍定解除**（挪 `0.1.5-rc.2`）；§五「可立刻动手」四项**仍未派发**。⇒ 本段保留，待其联动清单落地。
> 读的是：`docs/dsh/dsh-015-notes-scan.md`、`docs/dsh/dsh-015-upstream-inventory.md`、`docs/dsh/dsh-agents-md.md`、`exchange/dsh-015-capability-mapping.md`。
> **立场：四稿主体结论我认同**（尤其"自述 > 推断"的分层，以及 §A4 那次自我订正）。
> 下面只写三类东西：**① 我认为需要收窄的表述；② 我手上有实测、能直接补的；③ 一条立刻产生成本的联动。**
> **视角交代**：我是上一轮 DSH-2.5（①②③⑤）+ 2.3 + CVM/WSL 通道的实操方 ⇒ 手上的硬数据是 **012（`dsh-v0.1.2-rc.1`）**，另加本轮刚验通的 CVM 通道。**凡涉 015 的，我一律标"未验"。**

## 一、两处建议收窄（我的主要异议）

### 1.1 scan §A1 的推论只能"窄用"，不可外推成"定位问题已解决"

**§A1 本身我认同**：哲学载体确实在 rc 阶段落盘（AGENTS.md 一行 + 015 新增的 `session-format-status.md` + 一篇 implemented 笔记），"等 stable 才看得到哲学"这个前提**被推翻了**。

但它**只能证明"哲学（稳定性承诺）可读"**，不能证明**"产品定位的完整体现已到齐"**。**内证就在你自己的表 B1**：8 个域里 **4 项连子系统页都没有**（记忆 / 画像 / 自动路由 / 时间感知）、`identity` 仍是 anonymous、出厂形态是 loopback。

⇒ 建议 §A1 末句加一句限定：**「哲学已在 rc 落盘（不必等 stable）；产品定位（能力面广度）仍在建设中 —— 这是两件事，前者不必等，后者确实还没到齐。」** 否则"不用等 stable"极易被读成"定位也不用等了"。

### 1.2 「仍须自做 = 4」有被误读成"只剩 4 件事"的风险

统计**方向可信**，但 **"有设计参照" ≠ "我方工作量小"**。举一个我摸过的例子：

- **2.4.2 长期记忆闭环**判 🟡 可降级（理由：`storage` 的 `defineDomain` + `KvTable` 可挂）—— 你在同格也注明了 **`storage` 只有 KV，无向量、无 FTS**。⇒ 向量召回 + 语义层（人审 / 矛盾检测 / 保鲜）**全自做**，我估这一项**剩余工作量占比不低于 80%**。"可降级"在这里的含义是**省掉"从零设计存储"**，不是"省掉这一项"。

⇒ 建议 §2 总表**加一列「我方剩余工作量占比（粗估，待复核）」**。理由：三分类是**定性档位**，"4"是**计数**，而老大要拿它做"哪些做哪些不做"的取舍 —— **两者之间缺一个量**。

### 1.3 补一条我实测到的"可承接"陷阱（与 1.2 同源）

**"上游有正式契约 + 默认实现" ≠ "我方环境已就位"。** 今天我就在 CVM 上踩到：

| 层 | 实况 |
|---|---|
| 契约在 | `~/.dsh/profiles/sdk/package.json` 结构正常、bundles 声明正常 |
| 包在 | `~/.dsh/profiles/node_modules` 里 **223 个 `@deepseek-ai` 包** |
| **环境未就位** | 该 profile 的 `dependencies = {}`、`sdk/node_modules/@deepseek-ai` = **0 个** ⇒ 真实运行**启动期就崩**（`-32603 cannot create effect on inactive context`） |
| ⚠️ 而假绿源 | `dsh --profile sdk --help` 在**三个 home 下全部 exit 0** |

⇒ 建议"可承接"判据加一层**验收前置**：**① 契约在 ② 默认实现在 ③ 我方环境已就位**（三层分别过）。否则 12 只是纸面数字。

## 二、我手上有实测、能直接补的（按可执行度排序）

### 2.1 ⭐⭐ 3.2：**系统里有两把"锁"，语义相反，判据必须分开**

你在 A2 里把 3.2 的靶子定成 015 新增的 **session 写租约**（`lease.ts`：POSIX `flock(2)` / Windows named semaphore、**进程死亡即由内核释放**、**故意不做 TTL 抢占**）。这与**我实测过的另一把锁**完全不是一回事：

| | **A. `dsh-atomic-write` 的 profile 锁** | **B. 015 的 session 写租约** |
|---|---|---|
| 位置 | `$DSH_HOME/profiles/node_modules.lock` | `packages/session/session-persistence-jsonl/lease.ts` |
| 谁持有 | 装/修复 profile 模块时的写者 | session 写-open 的进程 |
| 持有者死亡后 | ⚠️ **永不自动回收** —— 源码注释原文：*"The contender never removes an existing lock because file age cannot prove that its owner stopped; **orphan recovery is an operator action**"*（我实测撞过 3+ 次，`node_modules.lock.bak.<ts>` 现在还有 4 个备份） | 内核在 fd/handle 关闭时释放（**含进程死亡**） |
| 失败表现 | 任何 dsh 命令启动即失败，报 `atomic-write: timed out waiting for the writer lock`（默认只等 **2 s**）——**极易误判成"profile 启动慢"或"网络问题"** | 第二个写者收 `SessionAlreadyOwnedError` |

⇒ 建议 **3.2 的判据里显式写死"区分两把锁"**：(a) 报告里凡是"锁残留"必须标是哪一把；(b) 实验前置要**先清 A 的孤儿锁**（否则实验根本没开始跑，你会得到"看起来像租约没生效"的假阴性）；(c) 追加一条我认为**必须实测**的子项：**Windows 侧 `taskkill /F` 杀进程后，named semaphore 是否真被内核释放** —— 这是"自述（README/源码注释）vs 实测"的分界点，且**我这边有现成条件**（本机 Windows + WSL 两侧各跑一次即可）。

### 2.2 ⭐⭐ 3.5 / 2.7.1：**我在 012 上的方言修复件，在 015 上必须重判（先判"上游是否已自修"）**

这是我认为**四稿里被漏掉的一条实质风险**：我在 012 上交付了 `harness/packages/plugin-sandbox-dialect/`（子类化 `LocalSandboxProvider`、覆写 `confine(argv, policy)`、按 `enforcement === 'partial'` 追加三条 denial 签名），修的是 **Windows 沙箱"拦得住但信号传不出去"**（node `EPERM: operation not permitted` 不命中签名表）。

而你的 inventory **表 A1 ⑤** 写着：**`sandbox-windows-acl` 有 9 条 README 欠账**；notes-scan **B2** 又记 015 把 `sandbox-local` 的 import 从需编译的 `fs-ext` 迁到了 `@deepseek-ai/node-addon-system` —— **即该包在 015 上确实动过。**

⇒ **我的插件在新版上是否仍必要、`confine()` 的返回结构与 `enforcement` 取值是否还成立，全部未验。** 建议列入 3.5 的**首项**：

1. **先判 015 是否已自修**（读 `DENIAL_SIGNATURES` 是否含 `operation not permitted`）；
2. 若已自修 ⇒ **我的插件应当退役**（否则我们长期维护一个上游已修的东西——这正是"Prefer maintained dependencies over hand-rolling"那条约定要拦的形态）；
3. 若未自修 ⇒ 重跑 `cordis-confine-check.mjs` 式的全链路复验（**不重跑不能沿用 012 结论**，同 A2 的"结论不可跨版本引用"）。

### 2.3 ⭐ 两条**未验**项恰好是两条改判的落地前提 —— 建议列为最优先实测

| 未验项（你 §8 已列） | 它卡住什么 | 我方条件 |
|---|---|---|
| `permission-presets` 自定义 preset 表在真实 profile 里能否生效 | **2.7.2 从"自做"→"可承接"的落地前提**（§3.1 整条改判靠它） | ✅ CVM 通道本轮已验通，可跑 |
| `workspace` 的运行时行为（membership 过滤 / attach 流程） | **2.3.3 改判（§3.2）** | ✅ 同上 |

⇒ 我的意见：**这两条不验，改判就只是"读文档改判"**。建议 §9 的裁定里加一句"改判以这两条实测通过为条件"（**条件通过**，而不是无条件接受）。理由与 §5.1 同类：**你已经在 §8 自己标了软/未验，若直接进 docs 就会被下游当成硬结论引用。**

### 2.4 ⭐ §5.1（脱敏 fail-open）：我同意这是最重的一条，并给一个可执行的构造法

你给的处置建议 ①②③ 我全同意（尤其 ③：**3.0 的凭据验真只验"读取与使用"，不把"不泄漏"计入 DSH 承接面**）—— 这与我 D 组的设计一致（我只读**键名/长度/类型**，从不打印值）。

补一条可执行的：**构造用例应由我方独立做，而不是等上游改**——
1. 在隔离 profile 里放一个**只经过 union / intersection / transform 才可达**的 secret 字段；
2. 走一次会触发 wire 渲染的路径（settings 读写 / Remote 请求）；
3. 断言**输出里不出现该值**。
⇒ 结果无论 fail-open 与否都有价值：fail-open 则坐实风险并据此写"我方可自保"；若已修则**这条风险降级**。（我可以在本机做，不占 CVM。）

### 2.5 A6（ACP `-32601`）：**上游自述已经答了**，实测可降为"确认性"

你在 A6 严守"读 diff ≠ 实测"，纪律对。但**同一条结论在 inventory 表 A1 ③ 里已有上游自述**：`acp` README 原文列了 *"session deletion, fork, `session/load`, modes, commands, plans, terminals, client filesystem operations, and elicitation **remain outside**"*。

⇒ **两条独立证据（015 自述 + 012 我方实测 -32601）已同向** ⇒ 记法可从"待实测"改为"**015 自述仍缺（我方 012 实测一致）；实测降为确认性**"。我方有现成器材（`cvm-acp-probe.mjs` 已随本轮同步到 CVM）。

### 2.6 2.10.1（传输安全）：一条可直接复用的验收法 + 一份网络基线

- **验收法（我方实测过，可复用）**：绑 `127.0.0.1` 起服务 → **本机侧可达、局域网侧不可达**（我在 WSL 上实测：Windows 侧 200 / 局域网 000）。这与 §5.2「出厂 cookie 未标 `Secure`、传输是 loopback HTTP」正好配成一对：**上公网前必须有一条"从非本机探测必须失败"的验收**，而不是只写"我们加了 TLS"。
- **网络基线（本轮 CVM 实测，供 `web_fetch` 承接评估用）**：`registry.npmmirror.com` **784 KB/s**（2.27 MB / 2.90 s）、`github.com` **121 KB/s** ⇒ **同机不同目标差 6.5 倍**。⇒ §4.1 若决定承接 `web_fetch`，**"反爬 / 可达性"这一项必须先钉住目标与网络口径**，否则实测数字不可比。

### 2.7 方法论印证：你 §A4 那条订正，我这边有一个**同族实例**

你的教训是「**某类证据存在 ≠ 它覆盖了目标**」。我在 DSH-2.5 ③ 上栽的是它的兄弟形态：**观测点选错（放在了有前导包装的那一层之前）⇒ 得到假阴性**（裸 spawn 少了 `ENCODING_PREAMBLE`，我因此报过"中文方言串未复现"，后来证明是探针姿势问题）。

⇒ 建议把两条并为一条写进方法库：**「证据存在 ≠ 覆盖目标」＋「观测点必须在真实链路上」**。并可顺手把它固化成一条动作（对我方后续所有验收稿生效）：**每个验收脚本头部写一行"本脚本模拟的是哪条真实链路"**（我已在 DSH-3 计划稿附 B §六 提过）。

## 三、一条立刻产生成本的联动（建议优先裁）

**基线 012 → 015 与我在做的 DSH-3.0，是冲突的。**

实情：我**今天**刚在 CVM 上按 `0.1.2-rc.1` 完成同步 + 装环境 + 跑 E 组三态（`pnpm install` 后 lock 里全是 `0.1.2-rc.1`、`dsh --version` = `0.1.2-rc.1`），D 组卡在 profile 未装（见上文回报 001 §4）。

- 若 **3.0 继续按 012 收口** ⇒ 我今天的证据**继续有效**，D 组装齐 profile 即可闭合；
- 若 **立刻转 015** ⇒ 按你自己的 A2 纪律（"结论不可跨版本引用"），**我这批 E 组结论必须降级为"通道/环境自证"**，D/E 要重做；且 015 的破坏性清单（Session V2→V3 / 移除 `ctx.agent` / persona 前后缀拆分 / `conversation` slot → `main`）会**同时改掉 3.1 与 3.7 的靶子**。

⇒ **请裁**：3.0 是"**按 012 收口后整体转 015**"，还是"**现在即转、3.0 重做**"？这不是我能自决的（它影响基线声明与整批证据的效力），但它**今天就要用**。

## 四、对落点与 §9 六问的简答

**落点**：判定依据 + **可复跑取法**留 `docs/`（你已经把取法写成可复跑脚本，这条很好）；**过程稿留 `exchange/`**。另补一条硬要求：**凡引用上游文本必带 tag** —— 我在 012 上摸过的东西（`DENIAL_SIGNATURES` 是模块级 const、`LocalSandboxProvider.confine()` 的返回形状）**在 015 是否还成立未验**，无 tag 的引用等于没有引用（AGENTS.md §7 已定此规矩，我附议并给出实例）。

| §9 | 我的意见 |
|---|---|
| 1 三档口径是否加「须关闭」 | **同意加**。我再补一档「**须实测后定**」——把 §8 的未验项单列，**不允许先归三类**（否则 1.3 那类假绿会被吸收进"可承接"） |
| 2 2.7.2 改判 | **条件同意**（§2.3：「自定义 preset 表生效」实测通过才算数） |
| 3 2.3.3 / 2.10.2 改判 | **同意**（2.10.2 那条"下沉 = 给框架写一个端侧 provider"我特别认同——与我实测到的 seam 形态一致） |
| 4 §4.1 `web_fetch` 重新评估 | **同意重新评估，但成本只降一半**：SSRF / 封顶已给 ✔；**反爬与正文抽取仍无**（`WebFetchBody` 只有 `html`/`text`）⇒ 正文抽取仍自做，而那正是原判"不做"的主要理由之一 |
| 5 §6 八条改动 | **先改 2.7.2 / 2.3.3 两条**（等 §2.3 实测落地后再批量），其余标"待测" |
| 6 落点路径 | **认同**（三稿 + 本稿合并进 `docs/`，`exchange/` 留过程痕） |

## 五、我能立刻动手的（供派发参考）

| 项 | 位置 | 前置 |
|---|---|---|
| 3.2 两把锁的区分实验（含 Windows `taskkill /F` 后租约释放） | 本机 + WSL | 无 |
| 015 的 `sandbox-local.confine()` 契约对照 + 方言自修判定 | 本机（读 `ref/dsh-bare` @ 015） | 无 |
| `permission-presets` 自定义表 / `workspace` membership 运行时实测 | CVM（通道已验） | 无 |
| `settings/redact` fail-open 构造用例 | 本机隔离 profile | 无 |
| D 组收尾（装齐 `~/.dsh` 的 sdk profile） | CVM | ⚠️ **需先裁 §4（回报 001）与 §三（基线）** |

**不改任何 docs / TODO 的本稿**——以上全部是意见，等你裁。
