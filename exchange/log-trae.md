# Trae 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 派发 001 · DSH-3.0 开工前置（CVM 环境 + 凭据 + real-api + 采数）

| | |
|---|---|
| **派发人 / 日期** | WorkBuddy / 2026-09-14 |
| **状态** | 🟡 **待续**（Trae 2026-09-14 回报 → **WB 同日裁定 001 已授权**）：**A/B/C/E/F 完成；D 组**曾因 `~/.dsh/profiles/sdk` 空壳阻塞 ⇒ **授权装齐后重跑**（见文末〈裁定 001〉） |
| **任务出处（唯一决策区）** | `TODO.md` DSH-3.0 段 |
| **判据 / 口径（规则区）** | `docs/dsh/dsh-migration.md` §3.6（含〈采数口径〉）；`docs/production-env.md` §12 |
| **节奏** | 老大 2026-09-14 定「**一个一个发，不要并行发**」⇒ 批次 1 的另两项（**3.2 / 3.7 本次不发**），等本步回报后再发下一份 |

### 0. 一句话目标

让 CVM 具备跑 DSH-3 全系列判据的**场地**（器材同步 + 环境自证），并把「**凭据真生效**」这件事**首次**验证下来。

### 1. 🔴 先读：一条会改变你做法的发现（WB 2026-09-14 查实）

`harness/scripts/run-real-api.mjs` → vitest → `harness/vitest.config.ts` 的 `setupFiles: ['tests/isolated-setup.ts']` → 该文件 `process.env.DSH_HOME = TMP_DSH_HOME`（`mkdtempSync` 出来的**临时目录**）。

⇒ **real-api 链路读不到 `~/.dsh/.credentials.yaml`**。它的 Key **只能来自环境变量** `DEEPSEEK_API_KEY`（`tests/real-api.ts:28` 自述"注入值"、`:31` 临时 home 隔离）。

⇒ 所以：

1. **「CVM 凭据落位真生效」不能用 real-api 验证** —— `production-env.md` §12.5 原写"真生效待 3.0 real-api 复跑"**是错的**，本次一并订正；
2. `cvm-probes/*.mjs`（`cvm-acp-probe.mjs:10` 等）与 `dsh-prompt.mjs` 的注释都写"Key 由 caller 注入" ⇒ **CVM 上至今没有任何一条路径消费过那份 `.credentials.yaml`**；
3. ⇒ 因此本步的**最重要产出**是下面 **D 组**（凭据层验真），它需要一条**新建的、非 vitest 的**路径。

### 2. 要做的事

#### A. 通道核查 + 出《我方执行说明》（**先做**）

- 已知事实（**须你实测确认，不要照抄**）：`node` / `dsh` 都不在 PATH（`export PATH=$HOME/node/bin:$PATH`）；远程长任务范式 `setsid nohup <cmd> >log 2>&1 </dev/null &` + 完成标记 + `echo $? > rc`。
- ⚠️ 纪律（`dsh-migration.md` §3.6）：**各执行人各自做一次通道核查、各自出《我方执行说明》** —— 三种工具形态坑不同，**谁也不能替谁许愿**。你 09-14 已自验通道（0.94 s、四范式齐备），本步是把它**写下来**。
- 产出写进本文件。

#### B. 同步 `harness/` → CVM

- **源**：本机 `D:\Code\LarryAgent\harness\`（**排除** `node_modules/`、`.git/`、`dist/`）
- **目标**：CVM `/home/ubuntu/harness/`（该目录已存在，09-10 的手工脚本在里面；**以你实测为准并在回报中写明绝对路径**）
- **缺口**（2026-09-14 核查，**约 30 个文本文件 / 0.13 MB**）：
  - `scripts/`（19 件）：`run-real-api.mjs`、`dsh-prompt.mjs`、`dsh-probe-capability.mjs`、`cvm-probes/`（9 件）、`embed-probe/`（3 件）、`sandbox-probe/`（6 件，**含 `sandbox-dialect.mount.patch.yml` 与 `.verify.patch.yml`**）
  - `tests/`（11 件）：`real-api.ts` / `real-api.test.ts` / `isolated-setup.ts` / `global-setup.ts` / `guard.test.ts` / `scan-keys.ts` / **5 个 sentinel**
  - `packages/` 的 **3 个沙箱探针包**：`plugin-sandbox-probe`、`plugin-sandbox-mount-probe`、`plugin-sandbox-dialect`
  - ⚠️ **它同时卡着 3.5** —— 缺的 3 个包里正含 3.5 要用的沙箱探针包
- ⚠️ **不要覆盖** 09-10 的手工脚本（`multi-session-probe.mjs` / `mspp.mjs` / `lcp.mjs` 等）—— 它们是历史证据
- 传输：`tar czf` → scp → 远端解包（传输非瓶颈，1.5 s 级）；**成本在后置 `pnpm install`**（CVM 已配 npmmirror 源 ⇒「境外源 15 KB/s」场景不适用）——**记墙钟**
- ⭐ **留 `SYNC-ANCHOR.txt`**，否则将来"CVM 上跑不过"无法区分**环境问题 vs 代码漂移**：

```
source-commit:        <git rev-parse HEAD>
source-harness-tree:  <git rev-parse HEAD:harness>
synced-at:            <date -Is>
files: <n>   bytes: <n>   excluded: node_modules, .git, dist
```

  （`TODO.md` 记的 `d8cc7c4b` / `6c268877` 是 09-14 早先的快照值，**以你同步时实测为准**。）

#### C. 修 `cvm-probes/*.sh` 的 `DSH_HOME` 目标

- **背景**：CVM 上两个 home —— `~/.dsh`（**凭据在此**，profiles 四个齐）与 `~/larry-dsh-home`（09-10 建，profiles/sessions/storages 齐、**独无凭据**）
- **纪律（老大 2026-09-14 定）**：同一环境只用一个 home ⇒ **CVM 以裸跑默认 `~/.dsh` 为准，废弃 `larry-dsh-home` 作为运行 home**
- **实际现状（⚠️ WB 2026-09-14 订正，此前文档写"6 个全部钉死"不精确）**：
  - **5 个硬钉**：`cvm-acp-setup.sh:5`、`cvm-setup-profile2.sh:5`、`cvm-task1-probe.sh:7`、`cvm-task1-setup.sh:7`、`cvm-task1-verify.sh:7`
  - **1 个有开关**：`cvm-step0.sh` —— `L8 MODE="${1:-explicit}"`、`L11 export DSH_HOME="$HOME/larry-dsh-home"`、`L13 unset`（即 `bash cvm-step0.sh default` 已可落 `~/.dsh`，**但默认值是 explicit**）
- **要求**：改成「**默认不设 `DSH_HOME`**（落 `~/.dsh`）；需要隔离时由调用方显式传」；**回报里给 diff**
- ⚠️ 照抄现状运行 ⇒ **永远"无 key"** 且**判据看起来全绿**（本步最典型的假绿形态）

#### D. ⭐ 凭据层验真（**本步最重要**，见 §1）

- **目标**：证明 `~/.dsh/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY` **确实被读取、且真的用于模型调用**
- **路径**：`harness/scripts/dsh-prompt.mjs` —— 它**不覆盖 `DSH_HOME`**（与 vitest 链相反）⇒ 裸跑落 `~/.dsh`
- **三态对照（同一脚本）**：

| 态 | 怎么造 | 预期 |
|---|---|---|
| 真 key | 裸跑 + **不注入** `DEEPSEEK_API_KEY` 环境变量（若成功 ⇒ 即证明**文件层被读**） | 成功回包 |
| 无 key | `DSH_HOME=~/larry-dsh-home`（profiles 齐、**无凭据**）—— 这正是它作为**负向对照器材**的用途 | 失败（缺凭据） |
| 错 key | `DSH_HOME=<隔离目录>`：`ln -s ~/.dsh/profiles <dir>/profiles` + 写一份 `refs.DEEPSEEK_API_KEY: invalid-key-for-probe`（`chmod 600`） | 鉴权失败 |

- **判据：三态表现互不相同**（**不是**"真态成功就算过"）
- ⚠️ 每态必须显式记 **(DSH_HOME, profile, 凭据来源层)** 三元组 —— 否则"无 key 态"与"真 key 态"可能测的是同一件事
- ⚠️ **键名固定 `DEEPSEEK_API_KEY`**
- ⚠️ 写 YAML 时 **`key:` 后必须有空格** —— 若写成 `DEEPSEEK_API_KEY:<值>`（冒号后紧贴、无空格），会让**整个 `refs` 段退化成字符串**，而 YAML / 解析器 / grep **全程零报错**（09-14 实测）⇒ 判据是**看类型不看键在不在**
- ⚠️ **不得改动 `~/.dsh/.credentials.yaml`**（那是已落好的资产）—— 负向两态一律用隔离 home 造
- ⚠️ 伪造值用 `invalid-key-for-probe` 类**明示无效**的标签，**不得使用任何真实 key 的片段**
- ⚠️ 回报**只写键名 / 是否存在 / 长度**，**不得写值**（Tier0 红线 ①）

#### E. 环境变量层三态（real-api）

- 跑 `run-real-api.mjs`，三态：**注入真 key / 注入错 key / 不注入**
- 判据：三态互不相同；⚠️ **"不注入"态是已证会"静默 SKIP 被当成跑过了"的那一态**（脚本只 warn，"有效 Key 绿用例"应**显式失败**——请核对它确实是 **fail 而不是 skip**）
- ⚠️ **本组结论只代表「环境变量层」**，**不得**用于宣称"CVM 凭据文件生效"（见 §1）
- ⚠️ 看门狗默认 20 分钟 ⇒ 退出码 **124 = 这次压根没跑完**、**1 = 测试失败**，两者含义不同，回报时**分开写**

#### F. 采数（口径见 `dsh-migration.md` §3.6〈采数口径〉）

- **cgroup v2 为主口径**：`/sys/fs/cgroup/user.slice/user-1000.slice/{memory.current,memory.peak,memory.events,memory.pressure}`
  - ⚠️ `ps -eo rss` 求和**虚高 53%**（共享页重复计）⇒ 不要用它当口径
  - ⚠️ root / session scope **没有**这几个文件 ⇒ 用 `stat -fc` 判 cgroup2fs 会**假阳性**
- **免轮询三件**（`memory.peak` / `memory.events` / `memory.pressure`）即可回答"是否吃紧过"；`memory.events` 是 OOM 的**权威计数**
- 小时级曲线：定时采样 + `date -Is` 时间戳 + **断点 / 重启留痕**
- ⚠️ **采数窗口内冻结其他活动**（2G 机器；OOM 会把曲线**断掉**，事后被误读成"内存稳定"）
- 带宽：记**工具 + 目标 + 时段**（4M 共享 / 独享影响结论）

### 3. 参考件（派发四要素）

| 要素 | 内容 |
|---|---|
| ① **路径** | 官方：`ref/dsh-bare/`（上游主仓，锁 `dsh-v0.1.2-rc.1`）+ npm 的 `dsh-home-paths` 与五个 profile 模板（`dsh-web-app` / `dsh-headless` / `dsh-sdk-app` / `dsh-sdk-minimal` / `dsh-acp-app`）。社区：`omdsh-dev/dsh-security-audit`（**未落位**，按 §2.2.2 约定按需拉） |
| ② **怎么参考** | 本切片是**工程执行**（同步 / 自证 / 采数），不是写插件 ⇒ 主要看 `dsh-home-paths` 的 **`DSH_HOME` 解析规则**与 profile 模板的**形状**；采数项可参照 `dsh-security-audit` 的只读审计清单 |
| ③ **参考程度** | **只读参照**，不改、不抄、不进依赖 |
| ④ **不可参考** | `dsh-security-audit` **未落位**，且其与锁定版 `0.1.2-rc.1` 是否同代**未核** ⇒ 只借"采数该看哪些项"的思路，**不引入其代码**；五个官方 profile 模板是**脚手架**、不是我们的产品形态 |

### 4. 回报要求（写在本文件顶部状态区下方）

必须含，且**每项都要有原始回显或日志路径**：

1. 《我方执行说明》（你通道的工具形态坑 + 实测可用范式）
2. 同步清单：文件数 / 字节 / 目标**绝对路径** / `SYNC-ANCHOR.txt` 全文
3. `cvm-probes/*.sh` 的 **diff**
4. **D 组三态表**（每态三元组 + 表现 + 原始输出）
5. **E 组三态表** + 退出码
6. 采数原始输出（含 `date -Is`）
7. 未闭合项 / 与规格矛盾处
8. ⚠️ **只给结论不算证据** —— 复验以**日志 / 代码**为证

### 5. 边界 / 停手条件

- ⚠️ 规格遗漏或与实测矛盾 ⇒ **立即停手 + 在本区暴露 + 等裁决**，不私自补字段（`exchange/README.md` 协作规则）
- ⚠️ **不得**把 key 值写进任何回报 / 日志 / 产物（Tier0 红线 ①）
- ⚠️ **不动 profile** —— 方言件落盘（`cordis.patch.yml`）是 **3.7** 的事，本次**不碰**
- ⚠️ **不动** `/etc/wsl.conf`（与本步无关，但列此提醒：凡跨 AI 共享的改动须先拍板）
- ⚠️ **CVM 2026-10-09 到期** ⇒ 本步产出的**证据原件**（日志 / 采数 / 三态输出）**须回传本机**，不得只留在 CVM（`dsh-migration.md` §3.6）

---

# 回报 001 · DSH-3.0（Trae，2026-09-14）

> **结论先行**：**A / B / C / E / F 完成**；**D 组 ⛔ 阻塞**（原因与凭据无关，是 `~/.dsh` 的 sdk profile 为空壳），已按 §5 停手等裁决。
> 本回报按 §4 的 8 项组织；所有数字取自回传本机的原始日志（路径见 §8）。

## 1. 《我方执行说明》（A 组）

**通道**：`ssh -i ~/.ssh/id_ed25519_cvm -o BatchMode=yes ubuntu@49.232.129.252`（Windows OpenSSH 9.5p2；私钥**可读**——我的沙箱不拦 `~/.ssh`，与 WB 不同）；首连 **0.94 s**；**无 TTY**；退出码透传。

**实测可用的四条范式**（全部本轮复现）：

| 范式 | 证据 |
|---|---|
| PATH 前置 | `export PATH=$HOME/node/bin:$PATH` → `node v22.22.2`；裸跑 `node`/`dsh` 均 `NOT_FOUND` |
| 后台长任务 | `setsid nohup <cmd> >log 2>&1 </dev/null &` + **完成标记 + `echo $? > rc`**；复入 pid 不变，`done`/`rc` 精确落地 |
| 前台长任务 | ssh 内 `sleep 25` → 本地墙钟 25.7 s、exit 0 |
| **非阻塞 + 轮询** | `NB_START 17:33 → NB_DONE 18:03`（精确 30 s）—— ⚠️ **WB 那边此路被拦，我这边可用** |

**⚠️ 我这条通道独有的坑（本轮又踩 6 次）**：**内联引号 / `$VAR` / 反引号会被本地吃掉**，且**本地 PowerShell 命令里也吃**：
`bash -c "sleep 20"`→`sleep`（missing operand）／`tr "\n"`→`tr "n"`／`echo "(…)"`→引号被剥／`pgrep -f "…"`→`only one pattern`／`cut -d" "`→`delimiter must be single char`／**`$L`（本地变量）在一个命令里被吃掉 → 整条 scp/解包落空**。
⇒ **铁律：命令一律走 base64 载体；本地文件操作用字面路径、不用变量**（后者是本轮新教训）。

## 2. 同步清单（B 组）

| 项 | 实测值 |
|---|---|
| 源 → 目标 | 本机 `D:\Code\LarryAgent\harness\` → CVM **`/home/ubuntu/harness/`**（绝对路径） |
| 排除 | `node_modules` / `.git` / `dist` |
| 文件数 / 字节 | 解包前 **26 → 解包后 61**；566,393 → **753,485 B** |
| tar / 传输 | `trae-harness-sync.tgz` **145.6 KB / 55 条目**；`scp` **1.11 s** |
| 解包 | `tar -xzf` → **exit 0**（`-C /home/ubuntu/harness`，合并式，不删旧件） |
| **旧件保留** ✅ | `multi-session-probe.mjs`(2776B) / `mspp.mjs`(2573B) / `lcp.mjs`(1858B) / `wb-acp-fork-verify.mjs` / `scripts/acp-probe.mjs` / `scripts/acp-resume.mjs` **全部仍在** |
| 关键新件 | `scripts/run-real-api.mjs`、`scripts/dsh-prompt.mjs`、`tests/real-api.ts`+`isolated-setup.ts`+`real-api.test.ts`、`packages/{plugin-sandbox-dialect,plugin-sandbox-mount-probe,plugin-sandbox-probe}`（后者是 TS 包：`src/index.ts` + `lib/index.js`）—— 全部 OK |
| pnpm | CVM 原本**无 pnpm / 无 corepack** ⇒ `npm i -g pnpm@11.7.0`（**3 s**） |
| `pnpm install` | **exit 0 / 18 s**（`Packages: +7 -1`，lockfile 过供应链策略 633 条）；`vitest`/`typescript`/`zod` 到位 |

**`SYNC-ANCHOR.txt` 全文**（已回传本机）：

```
source-commit:        57304ac5dd82faf481beb85cb469cab61e427fe5
source-harness-tree:  6c2688778207664d2afb06da3600e329412b9712
synced-at:            2026-09-14T17:04:54+08:00
files: 61   bytes: 753485   excluded: node_modules, .git, dist
tar:    trae-harness-sync.tgz (145.6 KB / 55 entries)  scp 1.11s
pnpm:   11.7.0 (npm i -g, 3s)   pnpm-install: exit 0, 18s, "Packages: +7 -1"
kept:   09-10 手工脚本 multi-session-probe.mjs / mspp.mjs / lcp.mjs + wb-acp-fork-verify.mjs（未覆盖）
```

## 3. `cvm-probes/*.sh` 的 diff（C 组）

`git diff --stat`：**6 文件 / +19 −7**。5 处硬钉统一改为：

```diff
- export DSH_HOME="$HOME/larry-dsh-home"
+ # 默认落 ~/.dsh（凭据在此）；需隔离时由调用方显式传 DSH_HOME=...
+ # （老大 2026-09-14 纪律：同一环境只用一个 home；larry-dsh-home 不再作运行 home）
+ export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
```

`cvm-step0.sh`：`MODE="${1:-explicit}"` → **`${1:-default}`**（默认不设 DSH_HOME；`explicit` 保留为隔离负向器材），头注同步更新。

> ⚠️ **一处实现选择需复核**：我**没有**写成字面的 `unset DSH_HOME`，因为 5 个脚本内 `$DSH_HOME` **参与路径拼接**（`$DSH_HOME/profiles/...`）+ 脚本都带 `set -u` ⇒ 真 unset 会**硬报错**。`${DSH_HOME:-$HOME/.dsh}` 的**效果**是"默认落 `~/.dsh`、调用方显式传则被尊重"，与你要求的语义等价。**若你要字面 unset 版**（并把路径改用独立变量），说一声我改。

## 4. D 组三态表 ⛔（**阻塞，未闭合**）

| 态 | 三元组 (DSH_HOME, profile, 凭据层) | 结果 | 原始证据 |
|---|---|---|---|
| D1 真 key | `<unset→~/.dsh>`, sdk, 文件(223B/600) | **exit 1** | `JsonRpcResponseError: cannot create effect on inactive context`（code **-32603**） |
| D2 无 key | `~/larry-dsh-home`, sdk, 无 | **exit 0** | `session=… events=12 notifications=14`，**stdout 全空**（=经典无 key 假绿形态） |
| D3 错 key | `/tmp/trae-iso-home`, sdk, 文件(伪造 `invalid-key-for-probe`) | **exit 1** | **与 D1 完全相同的 -32603 崩溃** |

⇒ **三态不互异**（D1≡D3），**判据不成立**；且 D1 崩的不是鉴权，是**启动期**。

**根因（与凭据无关，已定位）**：`~/.dsh/profiles/sdk` 是**空壳** ——
- `package.json` 的 `dependencies` = **`{}`**；`sdk/node_modules/@deepseek-ai` = **0 个**；**缺 `.dsh-module-fallback`/`cordis.yml`**
- 对照 `~/larry-dsh-home/profiles/sdk`：deps 4 项、`node_modules/@deepseek-ai` = **101 个** ✔
- 时间线：`~/.dsh/profiles/*` 建于 **09-10 11:27**（空模板）；`larry-dsh-home` 同日 11:26:54；`~/.dsh/.credentials.yaml` 是 **09-14 14:09** 才落的
- ⇒ **凭据落到了"从未装过 profile"的 home 上**；`larry`/`web`/`acp` 同样为空（仅 `larry` 有 7 个包）

**另一处判据发现**：`dsh --profile sdk --help` 在**三个 home 下全部 exit 0 / 1 s** ⇒ 该"零成本复验"**不校验 profile 依赖**，在本例是**假绿源**（与附 B §二 的 `--dump-config` 同类）。

**⛔ 请裁**（我未执行，§5「不动 profile」）：把 `~/.dsh` 的 sdk profile 装齐 —— 即 DSH-2.5 在 `larry-dsh-home` 上做过的同款两步：
```bash
node node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-base@0.1.2-rc.1
node node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.2-rc.1
```
（若 `pnpm allowBuilds` 拦，按 `pnpm-workspace.yaml` 全设 `false` 的既有手法处理。）装齐后我即可重跑 D 三态。
**备选**：把 `~/.dsh/profiles/sdk` 临时软链到 `larry-dsh-home/profiles/sdk`（不动凭据、可回滚，但仍是改 `~/.dsh` 结构）。**两条都请你点头**。

## 5. E 组三态表 ✅

| 态 | 注入 | exit | 「有效 Key 绿用例」 | R1 哨兵 | 关键证据 |
|---|---|---|---|---|---|
| E1 不注入 | 无 | **1** | **显式失败（非 skip）** | ✓ 通过 | `开关 DSH_REAL_API=1 但环境变量 DEEPSEEK_API_KEY 未提供`；`Tests 1 failed \| 13 passed \| 1 skipped` |
| E2 错 key | `sk-invalid-…`（明示无效） | **1** | 失败（**走了 API**：`error.code=AUTH / status=401`） | ✓ 通过 | `Tests 1 failed \| 13 passed \| 1 skipped` |
| E3 真 key | 取自 `~/.dsh/.credentials.yaml`（**全程不打印值**） | **0** | **通过** | ✓ 通过 | `verdict=OK assistant/message=1 finalResponse.len=11 turn/end.kind=completed`；**`Tests 14 passed \| 1 skipped`** |

⇒ **三态互不相同** ✔（E1=未发起调用；E2=AUTH/401；E3=OK）。**无 124**（未触发看门狗）——本轮三态各自仅 2 s 级（比文档记的 ~106 s 快得多，网络好）。
**副产品**：E3 证明**这把 key 本身有效** ⇒ D 组唯一未答的问题**只剩"文件层是否被读取"**。

> ⚠️ **必须声明的一处夹具选择**：`real-api.ts` 的 profile 源默认是 `<repo>/.dsh-home/profiles/sdk`（CVM 上不存在）。我按代码提供的 env 开关 `DSH_REAL_API_PROFILE_HOME=$HOME/larry-dsh-home/profiles` 指向**唯一装好的** sdk profile。**这是夹具来源，不是"运行 home 决定"**——但它同时说明：**当前 CVM 上只有 `larry-dsh-home` 的 sdk profile 是可用的**，与"废弃 larry-dsh-home"的纪律**存在现实冲突**（同 §4 根因）。

## 6. 采数（F 组）🟡（采样进行中）

**免轮询三件（17:06 一组，口径 = cgroup v2 slice 层）**：
```
cgroup_fs      = cgroup2fs
memory.current = 5812224 / 6062080（≈5.5–5.8 MB，此时几乎空载）
memory.peak    = 32264192（≈30.8 MB，本次开机至今）
memory.events  = low 0 high 0 max 0 oom 0 oom_kill 0 oom_group_kill 0   ← OOM 权威计数
memory.pressure= some … total=0  full … total=0
```
（对照：Claude 昨日读到 `current≈461 MB / peak≈1234 MB` ⇒ **两次开机之间峰值完全不同**，说明 `peak` 强依赖"这轮开机干了什么"。）

**小时级曲线**：采样器**已在 CVM 后台运行** —— `/home/ubuntu/trae-evidence/sampler.sh`（pid 1610222），**30 s 一点 × 240 点 ≈ 2 h**，落 `mem-sample.csv`（列：`ts,mem_current,mem_peak,oom_kill,psi_some_total`），跑完自动结束。
⚠️ **窗口不干净**：该机有**第三方会话**（`who` = `pts/0`，14:01 起，含一条 4.7 天长驻 `node`）⇒ **本曲线须标注"受干扰"**，不可当纯净基线（与附 A-2 第 8 条同理）。

**带宽（记工具 / 目标 / 时段）**：`tool=远端 curl（经我的 ssh）`；`target=registry.npmmirror.com` → **784 KB/s**（2.27 MB / 2.90 s）；`github.com` → **121 KB/s**；`time=2026-09-14T17:06+08:00`。

**交接（2 h 后取数）**：
```bash
ssh -i ~/.ssh/id_ed25519_cvm ubuntu@49.232.129.252 \
  'tail -20 /home/ubuntu/trae-evidence/mem-sample.csv; cat /home/ubuntu/trae-evidence/mem-sample.csv' > mem-sample.csv
```

## 7. 未闭合项 / 与规格矛盾处（共 5 条）

1. **⛔ D 组阻塞（最重要）**：`~/.dsh` 的 sdk profile 为空壳 ⇒ "裸跑默认 `~/.dsh`"这条纪律**当前不具备可运行条件**；**派发稿 A–F 未列"装 profile"这一步**（而它正是计划 §1 交付物 2「profile 就位」）。→ **请裁：授权我装齐（§4 的两条命令）还是改用软链？**
2. **`--help` 零成本判据不敏感**：三个 home 全绿，不校验 profile 依赖 ⇒ 建议在口径里注明其**不能**用于"profile 可用性"判定。
3. **E 组的 profile 源**：默认路径 `<repo>/.dsh-home/profiles` 在 CVM 不存在 ⇒ 我用 env 开关指到 `larry-dsh-home`。**若纪律要求"只用 `~/.dsh`"，则 E 也受 §1 阻塞**（同一根因）。
4. **观感差异一处（并列记录，不判谁对）**：`who` 在我这边**回显源 IP**（`42.89.102.244`），与 Claude 记的"不回显"不一致。
5. **C 组的实现选择**：`${DSH_HOME:-$HOME/.dsh}` vs 字面 unset（理由见 §3）——若不符规格请点我改。

## 8. 证据回传（本机绝对路径）

- **本机**：`D:\Code\_trae-cvm-evidence\`（**仓库外**）
  `d1.err/out`、`d2.err/out`、`d3.err/out`（D 组原始）、`e-summary.txt`、`e1.log`、`e2.log`、`e3.log`（E 组原始）、`run-e.sh`、`mem-sample.csv`（F 组）、`sampler.sh`、`SYNC-ANCHOR.txt`、`trae-evidence.tgz`（5308 B）
  ⚠️ 已对 E 组日志做 **`sk-…→sk-REDACTED` 兜底脱敏**；**全程未打印任何 key 值 / 长度以外信息**（Tier0 红线 ① 守）
- **CVM 侧**：`/home/ubuntu/trae-evidence/`（原件）；`/home/ubuntu/harness/SYNC-ANCHOR.txt`
- **未动**：`~/.dsh/.credentials.yaml`（只读键名/长度/类型）、任何第三方进程、`/etc/wsl.conf`、profile 内容（§4 待裁）

---

# 裁定 001 · WB（2026-09-14）

> **结论**：**J1 授权装 profile（落 `~/.dsh`）**；J3 随之解；J5 保持你的实现；J2/J4 采纳为口径记录。
> 你按 §5 停手是对的 —— 派发稿写死"不动 profile"，而根因恰恰在 profile，这属规格与现实的冲突，该停下来问。

## J1 ⛔ 授权：装齐 `~/.dsh/profiles/sdk`（本步唯一要做的事）

**根因已由 WB 独立复验**（自己 ssh 上 CVM 实测，非采信自述）：

| home / profile | `dependencies` | `node_modules/@deepseek-ai` | 结论 |
|---|---|---|---|
| `~/.dsh/profiles/sdk` | **`{}`** | **0** | **空壳**（bundles 已声明，依赖从没装过） |
| `~/.dsh/profiles/larry` | api-gateway, host-webserver | 7 | 有装（composition 与本地不同，见下） |
| `~/larry-dsh-home/profiles/sdk` | base, sdk-app, storage-sqlite, plugin-storage-probe | 101 | 完整 |
| `~/larry-dsh-home/profiles/acp` | — | 100 | 完整 |

⭐ **本机是同一个形态**（`.dsh-home/profiles/sdk` 99 包 / `~/.dsh/profiles/*` 空壳）⇒ **"凭据落一个 home、profile 落另一个 home"是系统性问题，不是 CVM 独有。**

**授权范围 = 你 §4 给的那两条命令，只装 `sdk`：**

```bash
DSH_HOME=$HOME/.dsh node /home/ubuntu/harness/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-base@0.1.2-rc.1
DSH_HOME=$HOME/.dsh node /home/ubuntu/harness/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.2-rc.1
```

- **这就是完整 composition**：本机 `.dsh-home/profiles/sdk` 的 deps 恰为 `base + sdk-app` 两项；`storage` / `session` 类包**随传递装齐**（实测含 `dsh-session-persistence-jsonl` / `dsh-session-query-sqlite` / `dsh-storage-json`）⇒ **无需**手工补 `storage-sqlite`。
- **`larry` 本次不动**：`~/.dsh/profiles/larry` 现 composition（api-gateway + host-webserver）与本地（base + headless）**不同**，属 3.5/3.7 派发时要单独定的事，**别顺手改**。
- **软链方案不采纳**：`~/.dsh/profiles/sdk → ~/larry-dsh-home/…` 会让两个 home 缠在一起 —— 正是"同一环境只用一个 home"要消灭的重叠环境。
- `pnpm allowBuilds` 若拦，按 `pnpm-workspace.yaml` 全设 `false` 的既有手法处理。

**前提订正**（与本步无关，但一并落痕）：09-14 那条「CVM 以 `~/.dsh` 为准」的纪律，当时记的依据是"`~/.dsh` profiles 四个全在"—— 那是**数目录、没验依赖**得出的，实测为空壳。**结论不变**（该 home 仍是 `~/.dsh`，其理由本就含"裸跑默认"一条，与依赖无关），但要**把前提补真**：装齐之后它才真正可用。

## J3 随 J1 解 → E 组夹具改指 `~/.dsh/profiles`

你把夹具指 `larry-dsh-home/profiles` 并**主动声明"这是夹具来源、不是 home 决定"** —— 声明正确，做法在当时也是唯一可行的。装齐 sdk 后**重跑 E**，夹具改指 `~/.dsh/profiles`，消掉这个漂移。

> ⚠️ 附注：`real-api.ts` 的默认夹具源是 `<repo>/.dsh-home/profiles`（**本机约定**），CVM 上不存在 ⇒ **CVM 侧永远靠 `DSH_REAL_API_PROFILE_HOME` 显式指**。这是刻意保留的夹具开关，**不是缺陷**，不必"修好"。

## J2 采纳 → 进口径

`dsh --profile <p> --help` **不校验 profile 依赖**（三 home 全绿）⇒ 记入口径：**该命令不得用于"profile 可用性"判定**。你这条与附 B §二 的 `--dump-config` 同类，是真问题。

## J5 保持你的实现，不必改

`${DSH_HOME:-$HOME/.dsh}` 而非字面 `unset` —— 理由**成立**（5 个脚本里 `$DSH_HOME/profiles/…` 参与路径拼接 + 脚本带 `set -u` ⇒ 真 unset 会硬报错）。语义与规格等价，**保留**。

## J4 并列留痕，不合并

`who` / `w` 的源 IP 回显**三条观察互不相同**：你=回显 `42.89.102.244`；Claude=不回显；**WB 实测（17:26）= `who` 输出为空、`w` 回显同一 IP**。⇒ 三通道三种观察，**并列记录，谁也不覆盖谁**（"通道不同则结论不可互推"）。

另：你记的"第三方会话 `pts/0`（14:01 起）"**已不在**（WB 17:26 实测：`who` 空、`w` 仅本会话、`ps` 无长驻 node）⇒ 采样曲线的"**受干扰**"标注**保持**（采样期内确有），但**当前已干净**。

## ⚠️ 采数口径一条：`memory.peak` 是 cgroup 生命周期峰值，不是窗口峰值

WB 读了 `mem-sample.csv`（17:06:18 起）：峰值在 **17:07:18 那一行由 30.8 MB 跳到 255.5 MB**，正落在 **E 组测试运行窗（17:06:54–17:07:06）**。⇒ 三件事：

1. **255 MB 有出处**（E 组 vitest/node），**不是"原因未知"**；
2. **峰值一旦被抬高就再不回落**（此后每行都是 255.5 MB）⇒ **`peak` 不能当"本窗口峰值"用**，它继承 cgroup 生命周期内的历史。**引用时必须同时给出 cgroup 起点**（或 boot 时间），否则"这轮没吃紧"是假结论；
3. ⚠️ **与 Claude 昨日的读数（`peak≈1234 MB`）对不上**：本机 uptime = 4d20h，若两者读的是**同一个 cgroup**，`peak` 单调不减 ⇒ 今日 17:06 的 30.8 MB 不可能小于昨日值。两种解释：① **两次读的不是同一个 cgroup/slice**；② user slice 在两次读之间被重建过（全部登出即销毁）。⇒ **并列留痕不合并**，并请你在回报里**写明取值路径**（`/sys/fs/cgroup/...` 具体哪一个），必要时向 Claude 索取他当时的那一行。

## 本步剩余动作（4 条）

1. 装 `sdk` → **重跑 D 组三态** → 回报（三态表 + 每态 `(DSH_HOME, profile, 凭据来源层)` 三元组 + 原始输出）
2. **重跑 E 组**（夹具改 `~/.dsh/profiles`）
3. **取 2 h 采样**（`~19:06` 后，240 点满）→ 回传 `mem-sample.csv`
4. 回报 001 顶部状态改 ✅ 全部完成

## 纪律钉死（本条新增）

**`~/larry-dsh-home` 不废弃、但降级为「负向对照器材」** —— 它有完整 profile 而**无凭据**，是 D 组"无 key 态"的**理想对照**（只变凭据这一个变量，profile 这个变量被控住）。

⚠️ **它不是运行 home** —— 不得作为任何验收链路的运行落点；将来若有人拿它起 DSH 跑出"绿"，那是**无 key 假绿**，本步 D2 已实证。

