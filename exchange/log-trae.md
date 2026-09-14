# Trae 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 派发 001 · DSH-3.0 开工前置（CVM 环境 + 凭据 + real-api + 采数）

| | |
|---|---|
| **派发人 / 日期** | WorkBuddy / 2026-09-14 |
| **状态** | 🟡 **待接收** —— 收到后把此格改「执行中」，完成后改「已完成」并附证据清单 |
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
