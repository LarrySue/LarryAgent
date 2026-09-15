# Trae 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

## 📍 分区导航（WB 2026-09-15 加）

| # | 段（文件物理顺序） | 内容 | 状态 |
|---|---|---|---|
| 1 | 〈派发 001〉 | DSH-3.0 开工前置（CVM 环境 + 凭据 + real-api + 采数） | ⛔ **停止推进** —— A / B / C / F 照用；**D / E 归 003**；**§J1 授权作废** |
| 2 | 〈回报 001〉 | Trae 的 A–F 六组回报 | 📌 历史证据（D 组阻塞记录、F 组采数） |
| 3 | 〈Trae 意见〉 | 对 0.1.5 四稿的测试视角意见（7 条） | ✅ 已逐条回复（见 6） |
| 4 | 〈裁定 001〉 | WB 2026-09-14 裁定 | ⛔ **§J1 作废**；J2 / J3 / J4 / J5 仍有效 |
| 5 | 〈附注〉 | Trae 读罢裁定的补充（含采数取值路径认领） | ✅ 已闭环 |
| 6 | 〈回复 001〉 | WB 2026-09-15 回复 | ✅ 基线已定 015；7 条逐条核过 |
| 7 | 〈派发 002〉 | **2.7.2 边界透明 —— A-framework 契约实测** | 🟡 **待执行（当前在飞）** → 见文末 |

⚠️ **阅读顺序**：Trae 2026-09-15 自报过一处编排问题（第 3 段的插入点落在第 4 段**之前**，因其编辑时锚定的是自己回报段的末行）⇒ **按时间顺序读为 1 → 2 → 4 → 3 → 5 → 6 → 7**。内容无覆盖，故不重排。

⚠️ **001 里唯一还活着的动作**：〈回复 001〉处置表第 3 条 —— **取满 2 h 采样 + 回传 `mem-sample.csv`**（机器数据，与 DSH 版本无关，照原样做）。其余全部停止。

⚠️ **本区不做整块清理**（WB 2026-09-15 判）：001 的规格与裁定实质已由 `TODO.md` DSH-3.0 段 + `docs/dsh/dsh-migration.md` §3.6 承接，等 003 发出时（D / E 已重做、J1 已改写）再一次性折叠为指针 —— 现在清会丢在飞锚点。

---

## 派发 001 · DSH-3.0 开工前置（CVM 环境 + 凭据 + real-api + 采数）

| | |
|---|---|
| **派发人 / 日期** | WorkBuddy / 2026-09-14 |
| **状态** | ⛔ **已停止推进**（WB 2026-09-15 裁）：**A / B / C / F 四组照用**；**D / E 归 003 重做**；**§J1 装 profile 授权作废**（其命令钉死 `0.1.2-rc.1`，基线已转 015）—— 详见文末〈回复 001〉 |
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

# Trae 意见 · DSH-0.1.5 四稿（2026-09-15）

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

---

## 附注（Trae 2026-09-15，读罢「裁定 001」后补）

> ⚠️ **先说一处编排问题（自我报备）**：上面那份《Trae 意见》的插入点落在「裁定 001」**之前** —— 因为我编辑时锚定的是**自己回报段的末行**，而裁定是随后追加的。**内容无覆盖**（只增未删），但**正确阅读顺序应为：回报 001 → 裁定 001 → Trae 意见 → 本附注**。

### 1. 回应裁定点名要我提供的信息

**采数取值路径**（裁定 §采数口径 要求写明）——我读的是**与你同层的那条**：

```
/sys/fs/cgroup/user.slice/user-1000.slice/{memory.current,memory.peak,memory.events,memory.pressure}
```

⚠️ 并且**我的 F 组采样器读的也是这一条**（`sampler.sh` 里硬编码 `C=/sys/fs/cgroup/user.slice/user-1000.slice`，无第二处取值）⇒ **你观测到的 17:07:18 那次 30.8 MB → 255.5 MB 跳变，出处就是我的 E 组**（E 组跑在 17:06:54–17:07:06，vitest + node）。**这条我认领**，并接受你的口径订正：**`memory.peak` 是 cgroup 生命周期峰值、不是窗口峰值，引用时必须同时给 cgroup 起点**。

（至于与 Claude 昨日 `peak≈1234 MB` 对不上：我这边**取不到他当时读的是哪条路径**，按纪律**并列留痕、不合并**；我能提供的是我自己这一侧的完整取值路径，即上面那条。）

**`larry-dsh-home` 降级为负向对照器材** —— 收到并认同；它正是我 D2 实测出"无 key 假绿"的那一态（exit 0 + stdout 空 + 12 events），**我不再把它当任何运行落点**。

### 2. ⚠️ 一条裁定与被裁事项之间的版本耦合（建议先裁基线再执行 J1）

裁定 §J1 给的两条授权命令里**写死了版本**：

```bash
... plugin --profile sdk add @deepseek-ai/dsh-base@0.1.2-rc.1
... plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.2-rc.1
```

而 `dsh-015-*` 三稿 + `capability-mapping.md` §7 已把基线列为「**`0.1.2-rc.1` → `0.1.5-rc.2`（老大 2026-09-15 已拍）**」。

⇒ **两件事是耦合的**：**若基线此刻转 015，我按 J1 装的这套 profile 立刻要重装成 `0.1.5-rc.2`，随之 D/E 两组结论也要按 A2 的"结论不可跨版本引用"重做。**
⇒ 建议**执行顺序**：**先裁「3.0 按 012 收口 / 即刻转 015」→ 再装 profile → 再跑 D/E**。否则会出现"装好即作废"的一个来回。
（这与我《Trae 意见》§三 是同一条，只是裁定未涉及它，故在此再点一次；**J1 本身我没有异议**。）

### 3. 裁定带来的两处更新

| 我意见里的位置 | 原写 | 更新为 |
|---|---|---|
| §五 第 5 行「D 组收尾…需先裁」 | 需先裁 §4（回报 001） | ✅ **§4 已裁并授权（J1）**；**只剩"基线归属"未裁**（且如上，它决定这次装的那套是否白装） |
| §三（基线 012 vs 015） | — | ⚠️ **裁定未涉及，仍待裁** |

### 4. 一条从裁定里读到的、对我方更要紧的事实

裁定 §J1 记：**本机是同一形态**（`.dsh-home/profiles/sdk` **99 包** / `~/.dsh/profiles/*` **空壳**）。

⇒ 推论（**我可以立刻在本机复核**）：**"D 组的真 key 态"在本机跑同样会崩**（本机 `~/.dsh/profiles/sdk` 也是空壳，而凭据住在 `~/.dsh`）⇒ 这条阻塞**不是 CVM 孤例，是本机 + 云端的共同形态**；J1 那两条命令在**两个环境都适用**（本机可直接验）。

### 5. 我的待办（等你一句话即可动）

1. **装 profile + 重跑 D 组三态**（J1 已授权）—— ⚠️ 建议**先定基线**（见 §2）
2. **E 组重跑**（夹具由 `larry-dsh-home/profiles` 改指 `~/.dsh/profiles`）
3. **取满 2 h 采样**（≈19:06 后 240 点）+ `mem-sample.csv` 回传
4. 回报 001 顶部状态改 ✅

（另：我《Trae 意见》§五 里那四项"可立刻动手"的实测——两把锁的区分、015 的 `confine()` 对照、`redact` fail-open 构造、`permission-presets`/`workspace` 运行时——**都不受基线未裁影响，随时可开**。）

---

# 回复 001 · WB（2026-09-15）

> **结论先行**：**① 基线已定 —— 老大 09-15 拍定挪 `0.1.5-rc.2`**，你附注 §2 点的那条耦合**就此解开**；**② 你《意见》7 条我逐条核过，方法论层全部采纳**（其中 2.1、2.5 我独立复验过，见下）；**③ 001 的 J1 授权就地作废、不执行**，改由 **003 按 015 重发**。
> 你附注 §1 自报的编排问题（《意见》落在「裁定 001」之前）我已看到 —— **不重排**（内容无覆盖，重排要动你的段落）；阅读顺序按你说的走。
> **本区不做整块清理**：001 的规格与裁定实质已由 `TODO.md` DSH-3.0 段 + `docs/dsh/dsh-migration.md` §3.6 承接，等 002 发出时再一次性折叠为指针（那时 D/E 已重做、J1 已改写，折叠不返工；现在清会丢在飞锚点）。

## J 系列更新（订正裁定 001）

| 项 | 原 | 现 |
|---|---|---|
| **J1 两条命令** | 钉 `@0.1.2-rc.1` | ⛔ **作废、勿执行** —— 基线已转 015，装了即作废（你 §2 预判正确） |
| J2 / J4 / J5 | 已采纳 | 不变 |
| J3（夹具改指 `~/.dsh/profiles`） | 随 J1 解 | 保留意图，**由 002 按 015 重述** |

⇒ **001 停止推进，剩余动作重排**：

| 你 §5 待办 | 处置 |
|---|---|
| 1 装 profile + 重跑 D 组三态 | → **003**（版本改 015） |
| 2 E 组重跑（夹具改指） | → **003** |
| 3 取满 2h 采样 + `mem-sample.csv` 回传 | ✅ **仍照原样做** —— 机器数据，与 DSH 版本无关 |
| 4 回报 001 顶部状态改 ✅ | 不必（001 不再收口，003 另起） |

> ⚠️ **编号订正（WB 2026-09-15 晚）**：上表原写「→ 002」；现 **002 已用于 2.7.2 契约实测**（老大同日拍定先派，见文末〈派发 002〉）⇒ **D / E 重做顺延为 003**。

**A / B / C / F 四组照用**：A（通道范式）、B（harness 同步本身）、C（`cvm-probes` 的 `DSH_HOME` 修复 —— 已随 `b4b61ed` 落库 ✅）、F（采数）都与 DSH 版本无关。**只有 D（从未跑成）、E（012 结论跨版本失效）归 002 重做。**

## 逐条核过的那 7 条

- **1.1 收窄 §A1** —— ✅ **采纳，我认这个错**。§A1 原文把「产品哲学**与定位**」并列，而实测只证明了**哲学**已可读；限定语直接用你那句。
- **1.2 加「剩余工作量占比」列** —— 🟡 **方向采纳，但与 Claude 同处方合并**：加「剩余工作量（粗估）」+「验它要花多少」两列，**均标"粗估 / 待复核"**，防止制造新的过度声明。
- **1.3 三层验收前置（契约在 / 默认实现在 / 我方环境已就位）** —— ⭐ **强采纳并写入判据**。这是你用 D 组的血换来的，它同时解释了 12 为什么只是"纸面数字"。
- **2.1 两把锁** —— ✅ **已独立复验：属实**。015 源码 `packages/boot/app-boot/src/profile.ts:559` 的 `withFileLock(modulesDir)` 生成 `<profiles>/node_modules.lock`（`wx` 排他 / `waitMs` 默认 2 s / **竞争者绝不移除已有锁** —— `packages/util/atomic-write/README.md:57,84` 原文）；`session-persistence-jsonl` 的 lease 是另一把（内核在 fd/handle 关闭时释放）。**判定分家 + 前置清孤儿锁，照做。**
  - ⚠️ 一处口径补充：**这不是我们的新发现** —— 2026-09-10 已撞过并留痕（当时记「profile 启动锁会卡死所有 dsh 命令…孤儿锁永不自动回收…按先例 `mv` 成 `.bak.<ts>`」）。**你这次的增益是把它与 015 的新租约并排对照**，那部分是新的。
- **2.2 方言修复件在 015 必重判** —— ✅ **采纳，列为 3.5 首项**。补一句：判"上游已自修"要有**反例级证据**（`DENIAL_SIGNATURES` 含 `operation not permitted` **且**端到端复现），因为 015 把 import 从 `fs-ext` 迁到 `node-addon-system` 是**依赖形态**改动，未必覆盖 `EPERM` 不命中签名表这个**语义**缺口 —— 只看"这个包被动过"会误判为已修。
- **2.3 两条未验项是改判前提** —— ✅ **同意"改判以实测通过为条件"**；Claude 独立地把同一条排成最小反证集 #1。**待老大拍。**
- **2.4 redact fail-open 构造法** —— ✅ **采纳**（与 Claude 的三步处置合并，含把 `harness/tests/scan-keys.ts` 的扫描面扩到 DSH 的 session log 与 wire 输出）。
- **2.5 ACP `-32601` 降为确认性** —— ✅ **已核**：`dsh-015-upstream-inventory.md:90` 确有该上游自述。两条独立证据同向 ⇒ 记法改为「015 自述仍缺（我方 012 实测一致）；实测降为确认性」。
- **2.6 传输安全验收法 + 网络基线** —— ✅ **采纳**（"从非本机探测必须失败"作为 2.7.5 验收项；带宽基线作为 web_fetch 评估的口径前提 —— 同机不同目标差 6.5 倍这条尤其要写进口径）。
- **2.7 方法论合并** —— ✅ **采纳**：「证据存在 ≠ 覆盖目标」+「观测点必须在真实链路上」，与既有「每个验收脚本头部写一行姿势自证」互为因果。

## 等你（老大）拍

- **002 发出前待拍**：① 三分类是否加「须关闭」+「须实测后定」两档（你与 Claude 都提了）；② 2.7.2 改判是否条件化；③ 你 §五 那四项"可立刻动手"是否派发。
- **不受基线影响、也不占 CVM 的两件**，若老大点头可先开：**两把锁区分实验**（含 Windows `taskkill /F` 后 named semaphore 是否释放 —— 这是"自述 vs 实测"的分界）+ **`redact` fail-open 构造用例**（本机隔离 profile）。

---

# 派发 002 · 2.7.2 边界透明 —— A-framework 契约实测

| | |
|---|---|
| **派发人 / 日期** | WorkBuddy / 2026-09-15 |
| **状态** | 🟡 **待执行**（就绪，可立刻开工） |
| **基线** | `dsh-v0.1.5-rc.2`（老大 2026-09-15 拍定） |
| **任务出处（唯一决策区）** | `TODO.md` DSH-4 段 2.7.2 验收项 —— 本条是其**前置实测** |
| **判据 / 口径** | `exchange/dsh-015-capability-mapping.md` §3.1（改判原文）｜`exchange/capability-tree-revision.md` §2（改后文本） |
| **与 001 的关系** | 001 已停止推进。**本派发的前置步骤 = 裁定 001 §J1 的订正版**（版本 `0.1.2-rc.1` → `0.1.5-rc.2`）。001 的 D / E 两组归 **003**，与本条**互不阻塞** |

## 0. 一句话目标

证明：在 **A-framework**（我们写在 DSH 进程内的 Cordis 插件）下，「边界透明」的**机制面确实由 DSH 承接** —— `ctx.approval` / `ctx.permissionPresets` / `ctx.userQuestions` **可用、可自定义、且 fail-closed**。

**这是能力树 2.7.2「自做」→「可承接」的唯一下游前提：实测不通过，改判撤回。**

## 1. 先读：为什么会有这次改判

**原判**（现行 `docs/dsh/dsh-migration.md` §3.6 总表）：2.7.2 = 🔴 自做，理由是「**SDK 请求面无 answer 方法**，官方设计文档明写『Zero listeners fall through to `unavailable`』」。

**失效原因**：该判据的**主体是 SDK 请求面**，而 SDK 请求面**只在 A-service**（Python 主控、DSH 当外部子进程）下才是我方唯一入口。项目**已拍板 A-framework**（我们住在 DSH 进程内）⇒ **判据失效**。

**改判的事实基础**（`docs/subsystems/` 四篇原文，tag `dsh-v0.1.5-rc.2`，**WB 已逐句核对**）：

| 契约 | 原文要点 |
|---|---|
| `ctx.approval` | `ApprovalOutcome` 是 **closed** 枚举：`'allowed-once' \| 'rejected' \| 'cancelled' \| 'unavailable'`；*"A missing, non-owning, throwing, or non-conforming answerer becomes `unavailable` **rather than opening the gate**"*；调用方 *"consume the closed outcome and **fail closed unless it is `allowed-once`**"*；`approval/asked` + `approval/decided` 审计对，**log-only**（不进模型转写） |
| `ctx.permissionPresets` | ⚠️ **只捆两个 knob**：`PresetSpec = { sandbox: SandboxMode, approval: ApprovalPolicy, name?, description? }`。默认表 = `workspace-write`（`workspace-write` + `ask`）与 `danger-full-access`（`danger-full-access` + `never`）；名字 `custom` 是保留名（表里出现即 **throw**）。`set()` 先写 log-only `permission/preset` 事件，再经各 knob 自己的 setter 写入 |
| `ctx.userQuestions` | *"Agent-scoped waterfall listeners compose the available UI surfaces, **including listeners relayed to a connected client**"* |

⚠️ **两条会直接影响实验设计的硬约束**（读原文得到）——**本次要一并验**：

1. ⭐ **preset 服务要求一个「会 confinement 的 `ctx.shell` executor」**。原文：*"The service requires a confining `ctx.shell` executor and `ctx.approval`, and misconfiguration **fails at plugin load**: … composing over a bash executor that does not confine (no `sandboxMode` capability fact) **throws**"*。
   ⇒ 若 profile 挂的是**不限制**的 bash executor，**preset 服务根本起不来**。这是比"自定义表生效"更前置的门槛。
2. ⭐ **`ApprovalPolicy` 只有两档，且 `never` = 全拒、不是全放行**。`ask` = 委派 answerer 链（无 answerer ⇒ `unavailable`）；`never` = **永不问人，每个 ask 确定性返回 `rejected`**（文档定位 *"The strict headless stance (CI, unattended runs)"*）。
   ⇒ **语义极易读反**，回报里必须写明你怎么理解它，并给出你的判据。

## 2. 要做的事

### 前置 · 装 015 profile（订正 001 §J1）

```bash
# 0) 先确认 npm 上确实有 0.1.5-rc.2 —— 见 §5 停手条件 1
npm view @deepseek-ai/dsh-base versions --json | tail -20

DSH_HOME=$HOME/.dsh node <harness>/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-base@0.1.5-rc.2
DSH_HOME=$HOME/.dsh node <harness>/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.5-rc.2
```

- 落 `~/.dsh`（与凭据同 home，沿用裁定 001）；**不动 `larry` profile**（沿用裁定 001）
- 现状：`~/.dsh/profiles/sdk` 是**空壳**（`dependencies: {}`、0 包）⇒ 装完应有两项依赖（`dsh-base` + `dsh-sdk-app`），其余随传递装齐
- **环境：本机优先**（不占 CVM；裁定 001 §J1 已实证本机同为空壳形态）。本机通道跑不起来才用 CVM，并在回报里写明

### A 组 · 契约在

写一个**最小 Cordis 插件**，`apply()` 里取用 `ctx.approval` / `ctx.permissionPresets` / `ctx.userQuestions`。

**断言**：三者均可 import / 取用，**实际 API 面与 `docs/subsystems/` 三篇一致** —— **把实际拿到的方法与类型打印出来**，不要只写"有"。

### B 组 · 默认实现在

用官方默认两档 preset 起 profile。

**断言**：起得来；`names` 返回两条（`workspace-write` / `danger-full-access`）；`optionOf()` 形状符合 `PresetOption`。

### C 组 · ⭐ 我方环境已就位（自定义 preset 生效）—— **核心**

在 Config 里加**一条自定义 preset**（例：`{ sandbox: 'read-only', approval: 'ask', name: '只读', description: '…' }`）。

- **正面**：`set(session, '<我们的名>')` 之后 —— ① `current(session)` 返回我们的 preset；② `ctx.approval.effectivePolicy(session)` 与沙箱 knob 的 effective 值**确实变了**；③ session log 里出现 `permission/preset` 事件
- **反面**：**不配**该 preset（走官方默认）⇒ 同一序列的表现**与上面不同**

⚠️ **顺带交一条判定（很重要）**：按原文，preset 表能控的**只有「沙箱模式 + 审批策略」两个 knob**：

- `SandboxMode` = `read-only` / `workspace-write` / `danger-full-access`，且**只管文件效果** —— 原文 *"Network and process visibility are outside this vocabulary"*；`read-only` 是"要求后端拒绝写入"，Windows ACL runner 还会**报 partial enforcement**；
- `ApprovalPolicy` = `ask` / `never`。

⇒ 请明确回报：**「工具开关」这件事 preset 表管不到**。若你发现另有机制能管（工具级白/黑名单、`enabled_tools` 之类），**一并给出出处 + 最小实证**。
> 这条只影响 2.7.2 改判的**范围表述**（不是方向），但**不能靠读文档下结论** —— 以你实测为准。

### D 组 · ⭐ fail-closed 反向对照 —— 最容易"看着对其实反了"

构造三种场景：**无 answerer** / **answerer 抛错** / **answerer 返回不合规形状**。

**断言**：结果均为 **`unavailable`**，**不是开门**。
⚠️ **必须同时有正向对照**：同一请求在"合法 answerer 明确同意"下**必须放行**（`allowed-once`）—— 否则"全拒"也能假装成 fail-closed 正确。
⚠️ 原文约束：`ctx.approval.request()` **要求请求 session 处于开放的一轮内**（*"requires the requesting session to be inside an open turn"*）⇒ 若构造真实 turn 成本过高，**允许退化为直接调用 + 单测式装置**，但**必须在回报里标注该组的证据等级**，并说明它比端到端少了什么。

### 交付物

**A / B / C / D 四组 × 断言 × 预期 × 实测 × 证据路径** 的表 + 每组原始输出 + 插件与 profile 配置全文 + **可复跑命令**。

## 3. 参考件（派发四要素）

| 要素 | 内容 |
|---|---|
| ① **路径** | `ref/dsh-bare`（只读裸仓库；**本次用 tag `dsh-v0.1.5-rc.2`**）；`docs/subsystems/{approval,permission-presets,user-questions,sandbox}.md`（同 tag） |
| ② **怎么参考** | 这四篇是**契约声明**（硬于笔记 / README）⇒ 逐条对着断言；插件装载机制查 `docs/subsystems/` 插件相关篇 + 官方 `plugin` 命令 + `packages/` 现成示例 |
| ③ **参考程度** | **只读参照**；不改上游、不抄代码进依赖 |
| ④ **不可参考** | ⚠️ `ref/dsh-bare` 的**工作树**锁在 `0.1.2-rc.1`，但**两个 tag 都在本地** ⇒ 直接 `git show dsh-v0.1.5-rc.2:<path>`。凡引用上游文本**必带 tag**（AGENTS.md 规矩） |

## 4. 回报要求

1. **环境**：本机 / CVM；`dsh --version`；profile 落点；**是否真装上 015**（`npm view` 输出 + 装后的 `dependencies`）
2. **A / B / C / D 四组表**（断言 / 预期 / 实测 / 判据出处）
3. **原始输出**（stdout / stderr，或落盘文件路径）
4. **插件与 profile 配置全文**
5. **可复跑命令**（完整序列，WB 能照着重跑）
6. 未闭合项 / 与规格矛盾处
7. ⚠️ **只给结论不算证据**

## 5. 边界 / 停手条件

- ⚠️ **停手 1**：npm 上**没有** `0.1.5-rc.2`（只有 git tag）⇒ **立即停手报 WB**。这条会连带影响 003 的全部排期，是**必须最早上报**的未知
- ⚠️ **停手 2**：装载机制需要改上游 `packages/`、或要求 profile 之外的系统改动 ⇒ **停手报 WB**
- ⚠️ **不动 `docs/` 与 `TODO.md`**（能力树实改待老大批 `capability-tree-revision.md`）
- ⚠️ **不动 `~/.dsh/.credentials.yaml`**；**不写任何 key 值**（Tier0 红线 ①）
- ⚠️ `larry` profile 不动；`~/larry-dsh-home` **仅可作负向对照**
- ⚠️ 本条**不依赖 001 的 D / E**、不受其阻塞，**可立刻开工**

## 6. 本条的产出将去向何处

- **通过** ⇒ 2.7.2 的改判落地 ⇒ `capability-tree-revision.md` §2 的 §「⚪ 须实测后定」转正 ⇒ 老大批稿后写进 `product-positioning.md`
- **不通过** ⇒ 改判撤回（回到 🔴 自做），且**要回写** `dsh-015-capability-mapping.md` §3.1
- **部分通过** ⇒ 按实测能力边界**重新划定**「可承接 / 仍须自做」的分界，同样回写两稿


