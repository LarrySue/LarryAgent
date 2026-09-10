# Claude 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---

## 📌 当前派发（2026-09-10 · DSH-2.5 ③④）— 待接

> **回复位置**：报告写在本节下方，标题用 `## Claude 报告 · DSH-2.5 <日期>`。**不要覆盖本节派发内容**（WB 确认完成后会清理）。

### 背景

DSH-2 阶段到了最后闸门：`docs/dsh/dsh-migration.md` §3.6 定义的**五项退出条件**，任一不过 → DSH-3 收益表重估、C 路径回退进入议程。**目前五项一项未测**。

**③④ 派给你**（均为 **Windows 本机** + 纯测试，符合你的职责边界）。①②⑤ 已派给 Trae（Linux 侧 / 需写代码），**与你无交集，不用担心踩踏**。

⚠️ **注意分工边界**：你是**纯测试**，发现有 Bug / 缺失能力 → **写报告报缺口**，不要自行改实现代码。

---

### 任务 ③ — Windows 端 `ctx.sandbox` provider 可用性 🟢【优先】

**为什么重要**：它是 **2.10.2 端侧执行器**的前提。这一项不过，`sandbox/` 相关能力在 Windows 端就没有落点。

**已知事实**（后端已确认，不用重验）：
- 实现存在：`restricted token` + `sandbox-windows-acl/`
- **fail-closed**：无 runner 时报 `SANDBOX_UNAVAILABLE`，**不静默裸跑**（这点很关键，别漏）

**待验**：
1. **实际生效性** —— 声明"有限制"和"真的拦住"是两件事。做**正反两组**：授权路径应通过 / 未授权路径应被拒。**必须抓到实际的拒绝现象**（错误码 / Access Denied / 具体是哪一个机制拦住的）。
2. **反向对照** —— 换一个条件看防护是否失效（例如管理员权限 vs 普通权限、`--no-sandbox` 之类的开关是否存在、存在的话后果是什么）。**没有反向对照的"生效"结论不算数。**
3. **提权流程** —— 启动 runner 需不需要 UAC？需不需要预先安装什么？**在普通个人电脑上能否无感运行**？
4. **对照设计预期**：把实测结果对照 **2.7.1 / 2.10.2 的设计预期**，发现不符就**直接给出你的判断**，不必迁就既有结论。

---

### 任务 ④ — Vue/Tauri → `sdk` profile 连通

**⚠️ 先做一件事**：DSH-2.3 已完成过「Vue/Tauri ↔ DSH 连通（sdk profile + TS SDK）」。**请先判定本次 ④ 与之是什么关系** —— 是同一件事的重申（那就在报告里写"已在 2.3 完成，此处仅确认"，附上当时的证据位置），还是确实不同（比如要在真实 `client/` 工程而非 demo 上验证）？**不要重复劳动，也不要默认它已完成。**

判定后按你的结论执行。交付要求：**可复现的步骤 + 实际输出证据**，不接受"能连上"三个字。

---

### 📋 报告要求（沿用 DSH-2.4 定下的规矩）

1. **必须有反向哨兵**：任何护栏/校验/兜底类结论，都要**人为制造违规看它是否真的报警**。只查结果达标会放过从未运行的护栏。（这是你在 2.4 返工时自己挣出来的判据，继续守。）
2. **区分三层**：🟢 实测有据 / 🔴 估算推测 / ⬛ 未测。
3. **判据自检**：写清"用什么现象判定成功"，以及**该现象在「正常工作」和「压根没生效」时分别长什么样**。若两者相同 → 判据无效，换。
4. **不外推**：写"已排除 X"时说明实验覆盖哪条执行路径，结论只能写在那条路径上。
5. **负结果如实报**，不粉饰、不省略 —— 例如你若验出 sandbox 在某条件下可绕过，**照写**。
6. **测试隔离**：涉及真实库的测试，环境必须是临时库，不要碰 `backend/data/larry.db`。

**优先级**：③ > ④。③ 卡住半天以上先把卡点报出来，别闷头死磕。

---

## 当前状态（2026-09-09）

- **DSH-2.4 Vitest 隔离基建——返工完成，WB 复验通过** ✅ 提交 `fb30d77`（R1/R2/R3 + 2 反向哨兵）+ 报告更新 `003df43`/`fa1465e`。验收 5 条全过：guard 绿 / failfast 红（assertIsolated throw）/ unset 哨兵红（resolve('')=cwd 被拦）/ key 残留告警出现（先扫后删）/ mtime 不变。
  - **WB 独立实跑复核：5/5 一致**（未采信声明，全部自跑）。另补 `test:isolated:sentinel-key` / `test:isolated:sentinel-unset` 两条 script 入口（原仅 guard/failfast 有入口，跑法不统一）；报告 §1 结论已改为「五条验收」并加「首版缺陷勿回退」说明。
  - **本项对后续的可复用判据**：**「结论对」≠「机制存在」**——护栏类验收必须加**反向哨兵**（人为制造违规、看是否报警），否则只查结果达标会放过从未运行的护栏。

---
---

# Claude 报告 · DSH-2.5 ③④（2026-09-10 · 进行中）

> **本区随做随更**（老大 2026-09-10 指示：执行进度需可见，不再只在交付时出现）。
> **基线**：`dsh-v0.1.2-rc.1`（源码经 `ref/dsh-bare` 按 tag 取；⚠️ 该仓库 HEAD 已是 `dsh-v0.1.3-alpha.1`，**取源码一律写 tag，不得用 HEAD**）。
> **范围**：③④ 均为 Windows 本机纯测试；发现缺口只报不改（派发稿边界）。

## 进度快照

| 步骤 | 状态 |
|---|---|
| 0. 上下文重建（含上一会话断点定位） | ✅ |
| 1. 契约核实：`ctx.sandbox` 服务定义 + windows-acl 机制 + 上游自述边界 | ✅ |
| 2. 环境核实：provider 是否真被挂载 / runner 产物是否存在 | ✅ |
| 3. 探针重写（上一会话骨架**有 3 处判定缺陷**，见下） | ✅ |
| 4. 挂载并实跑 P 组（正反）+ C/E/S 组（反向对照 / 护栏自检） | ✅ → §4 |
| 5. ④ 与 DSH-2.3 关系判定 | ✅ → §5（判为**同一件事的重申**） |
| 6. 报告整理 + 提交 | ✅ |

## 1. 契约核实结论（🟢 源码 `packages/sandbox/`，非推测）

1. **`confine()` 是同步的，且「被拒绝」不是它抛出来的**——它返回包装后的 argv（`ConfinedArgv: { argv, enforcement, denialSignatures, runnerFailureRules }`），调用方自己去 spawn。**这是判定分层的关键**：
   - **拒绝（=沙箱生效）** ⇔ spawn 后**非零退出 + stderr 命中该后端自己的 `denialSignatures`**（windows-acl 方言：`access is denied` / `access to the path` / `permission denied`）
   - **runner 故障（=命令压根没跑）** ⇔ 命中 `runnerFailureRules`：windows-acl 是 **`allowedExitCodes: [127]` + stderr 含 `windows-acl-run: `**。上游原文：「runner failure means the command never ran, while denial means confinement worked and blocked it」
   - **⚠️ 这两者混淆 = 判据失效**：只看见"非零退出"就写"拦住了"，会把"沙箱根本没跑起来"读成"防护生效"
2. **Windows 链只有一个候选（`windows-acl`），且不做探针**（`PLATFORM_CHAINS.win32` 长度 1 → 直接选中）。→ 连带推论：**fail-closed 在 Windows 上表现为「执行期 exit 127 + `windows-acl-run:`」，而不是包装期的 `SANDBOX_UNAVAILABLE` 抛出**。包装期抛错需"平台无链"，win32 走不到。
3. **enforcement 在 Windows 上静态声明为 `partial`**（源码 `STATIC_ENFORCEMENT`），原因是两条**已声明的边界**：① 受限令牌必须保留 Everyone 才能完成进程初始化 → **显式给 Everyone 写权限的对象仍可写**；② NTFS 硬链接是文件对象别名 → 工作区内文件被外部别名指向时仍可写。
4. 上游 README 另列**已声明边界**（可直接当反向对照的预期）：写受限但**读/网络/进程可见性不受限**；`read-only` 下 pwsh 退化为 ConstrainedLanguage；FAT 卷目标在两种模式下都可写；`NUL` 设备两类模式下均可写。

## 2. 环境核实结论（🟢 本机实查）

| 项 | 结论 |
|---|---|
| `ctx.sandbox` 是否真有 provider | **有**——`dsh-base/cordis.patch.yml:211` 明确挂载 `@deepseek-ai/dsh-sandbox-local`，**未 disabled**（同文件 222/228 行显示 bash-sandbox 在 win32 被禁用、pwsh-sandbox 在非 win32 被禁用） |
| runner 产物是否存在 | **在**——`dsh-sandbox-windows-acl/lib/runner.js` 随包分发（生产路径命中，**不会退化到 tsx 源码入口**，该退路需 tsx，本机无） |
| profile 现状 | `larry` = `dsh-base` + `dsh-headless` + `@larryagent/plugin-probe`，`patchReload: live` |

## 3. ⚠️ 上一会话探针骨架的问题（自查，未采信为可用）

上一会话（断点）留下 `harness/packages/plugin-sandbox-probe/`（未编译、未挂载、未跑、未提交）。核源码后判定**骨架不可直接用**，三处缺陷：

1. **缺 runnerFailureRules 分支** → 无法区分「被拦」与「runner 根本没跑」，正是上面 §1.1 点名的判据失效模式
2. **「工作区外」目标选在 `tmpdir()`** → 撞在 temp 语义边界上（`workspace-write` 含后端定义的 temp 区），判据不干净：拒绝与放行都可能被解释成合理
3. **无「护栏自身是否运行」哨兵** → 插件用 `inject: ['sandbox']`，若服务未就绪则 apply 静默不执行，**探针不跑与沙箱不可用长得一模一样**

→ 处理：**重写**（保留其正向思路，补判定分层 + 哨兵）。已完成。

---

## 4. ③ 实测结果（Windows 本机 · 2026-09-10）

**探针**：`harness/packages/plugin-sandbox-probe/`（重写后）。**不经 LLM**：cordis 加载 bundle 后经 `ctx.sandbox.confine()` 取包装 argv、直接 spawn，跑完即退出。
**样本**：单机单轮，`D:\Temp\Sys`（tmpdir）+ 用户主目录；非管理员会话（已核 `IsInRole(Administrator)=False`）。

### 4.1 结论（分档）

| 结论 | 档位 | 证据 |
|---|---|---|
| **`ctx.sandbox` provider 在 Windows 上真实可用，且真的拦得住** | 🟢 实测 | P1 授权路径通过；P2/P2b/P3/P6 未授权路径**文件确实没落盘**；C0 已先证明这些路径在无沙箱下**本来就写得进去** |
| **fail-closed 属实** | 🟢 实测 | S3：把 `--workspace` 改成不存在目录 → runner 以 `windows-acl-run: …` + exit 127 失败，**且命令确实没执行**（目标文件不存在） |
| **无需 UAC、无需预装**（用户自有目录场景） | 🟢 实测 | 全程非管理员会话，一次通过；runner 为包内 `lib/runner.js`，随包分发 |
| **上游声明的两条边界都真实存在**（Everyone / 硬链接） | 🟢 实测复现 | E2 显式授 Everyone 写权限的目录**可写**；E3 工作区外硬链接**可写**（= `enforcement: partial` 的由来） |
| **读不受限** | 🟢 实测 | P4：读工作区外文件成功回显 |
| ⚠️ **「拒绝方言」在本机环境下完全失效** | 🟢 实测（**缺口**） | 见 §4.3 —— **这是本轮最重要的发现** |

### 4.2 判定矩阵（含反向哨兵）

| 格 | 条件 | 期望 | 实测 | 判定 |
|---|---|---|---|---|
| C0 | 无沙箱写四个目标 | 可写 | 四个全部 `true` | ✅ 判据地基 |
| P1 | workspace-write 写工作区内 | 成功 | 落盘 | ✅ |
| P2 | workspace-write 写工作区外（用户主目录） | 被拒 | 未落盘 + EPERM | ✅ 拒绝属实 |
| P2b | workspace-write 写 ambient temp 根 | 被拒 | 未落盘 | ✅ |
| P3 | read-only 写工作区内（**跑在 P1 之后**，工作区上已有常驻 ACE） | 被拒 | 未落盘 | ✅ 且**证明常驻 ACE 在 read-only 下确实惰性** |
| P4 | workspace-write 读工作区外 | 成功 | 回显正确内容 | ✅ |
| E1 | read-only 写 `\\.\NUL` | 成功 | exit 0 | ✅（上游声明的 ambient 边界） |
| E2 | workspace-write 写「Everyone 可写」目录 | 成功 | 落盘 | ✅ 边界复现 |
| E3 | workspace-write 经工作区外硬链接写工作区文件 | 成功 | 落盘 | ✅ 边界复现 |
| P5 | **带 sessionId** 写工作区内（走 provider 的 ACL 授权物化路径） | 成功 | 落盘 | ✅ |
| P6 | 带 sessionId 写工作区外 | 被拒 | 未落盘 | ✅ |
| **S2** | 取真实包装 argv 只把 `--mode` 改非法 | 判为 runner 故障 | `RUNNER-FAILED`（exit 127 + 签名） | ✅ **判定器自检通过** |
| **S3** | 同上，把 `--workspace` 改不存在 | 判为 runner 故障且命令未跑 | `RUNNER-FAILED` + `commandRan=false` | ✅ |
| **S4** | 受限子进程主动输出 `Access is denied.` | 判为被拒 | `DENIED`（命中 `access is denied`） | ✅ **证明匹配逻辑可用**，故 §4.3 的未命中是**文本**问题 |
| 信息项 | 网络（无沙箱 vs 沙箱内，双向对照） | — | 无沙箱也连不上 → **INCONCLUSIVE，不下结论** | ⬛ |

> **P2 的「拒绝属实」为何可信**：三条独立证据链 —— ① 无沙箱对照写同一路径成功（C0）；② 沙箱内写工作区内成功（P1）；③ 沙箱内写该路径失败且文件不存在。任一单独都不足以定性。

### 4.3 ⚠️ 缺口：拒绝方言（`denialSignatures`）在本机环境下**一条都不匹配**

**现象**：被拒时沙箱确实拦住了（文件未落盘），但 stderr 与 provider 声明的三条方言**全部不匹配** → 消费方 `denied=false`。

| 子进程 | 实际 stderr | 是否命中声明方言 |
|---|---|---|
| node | `Error: EPERM: operation not permitted, open '…'` | ❌（三条都不是 EPERM） |
| Windows PowerShell | `对路径"C:\…"的访问被拒绝。` | ❌（声明是英文 `access to the path`） |
| cmd | `拒绝访问。` | ❌（声明是英文 `access is denied`） |

**归因（不是我的判定器坏了）**：
- **S4 正向对照**：让受限子进程主动打印 `Access is denied.` → 判定器**正确判 DENIED** → 匹配逻辑本身可用。
- **语言归因硬证据**：用**无沙箱**同样被拒的路径复现同一条系统消息 —— `cmd` 得 `拒绝访问。`、`powershell` 得 `对路径"…"的访问被拒绝。`。二者分别是 "Access is denied." / "Access to the path … is denied." 的**本地化形态**。本机为**中文 Windows**，故英文签名**在结构上不可能命中**。

**影响面（读了消费方代码，非推测）**：`pwsh-sandbox`（win32 上启用的那个）/`bash-sandbox` 用 `matchesSignature(...)` 得出 `denied`，再由 `sandboxDenialMarker` / `escalationHintMarker` 决定模型看到什么：
- `denied=true` → 模型看到 `[sandbox: file access denied under <mode> mode]` + 升权提示（可带 `sandbox_permissions` 重试、走审批）
- `denied=false` → **只当普通命令失败**：模型既不知道是沙箱拦的，也拿不到升权提示，**只能自己瞎猜**

→ 即：**在中文 Windows 上，本项目的沙箱拦截对模型是不可见的**。护栏拦住了，但拦住的信号传不出去。

**边界（不外推）**：
- 🟢 覆盖：本机、Windows 11、中文区域设置、node/powershell/cmd 三个子进程、`workspace-write` 与 `read-only` 两档。
- ⬛ 未测：英文区域设置 Windows（预计命中，未验）；其它语言；`pwsh` 7（本机未安装，实测 `pwshInstalled=false`，D 组退用 Windows PowerShell 5.1）；经由真实 `pwsh-sandbox` 工具全链路（本轮只到 runner 层，未从工具层下发命令）。
- ⚠️ **不判「上游永远如此」**：只判「当前版本 `dsh-v0.1.2-rc.1` + 本机区域设置下不成立」。

### 4.4 提权与前置条件（③.3 的回答）

| 问 | 答 | 档 |
|---|---|---|
| 启动 runner 要不要 UAC？ | **不要**。全程非管理员会话，P1/P5 均通过 | 🟢 |
| 要不要预先安装什么？ | **不要**。runner 是包内 `lib/runner.js`，window-acl 依赖随包分发 | 🟢 |
| 普通个人电脑能否无感运行？ | 用户自有目录场景**能**；但**有个已知前提**：被授权的目录必须**由调用者拥有**（上游 README 明列「Granted directories must be caller-owned」，因为要靠 owner 的隐式 `WRITE_DAC` 改 DACL）。**非自有目录（如系统目录）本轮未测** —— 不拿推测当结论 | 🟢 / ⬛ |
| 有无 `--no-sandbox` 类开关？ | 无静默降级开关；旁路是**显式配置**：`DSH_PERMISSION_MODE=danger-full-access`（`dsh-base` 配置里该档 `approval: never` 且 `sandbox: danger-full-access`）。**属显式选择，非默认** | 🟢 源码 |

### 4.5 判据自检（本轮「什么算成功」及其反例）

- **P1 是整轮的锚**：P1 若失败，则「其他路径写不进去」无法与「沙箱压根不工作/命令跑不起来」区分 → **本轮不判防护生效**。P1 通过，故此锚成立。
- **「被拒」判据 = 三条同时成立**（未落盘 + 非零退出 + 无沙箱对照可写）。反例：只看「非零退出」会把 S2/S3 的 runner 故障读成「拦截成功」—— 本轮已用 S2/S3 单独占格，**不并入被拒**。
- **「护栏运行过」判据**：S0 breadcrumb（apply 入口）+ `ctx.sandbox 可用=true` 两行都出现，才说明探针真的跑了。首轮正是靠 S1 哨兵抓出「服务取不到」，而非误报「沙箱不可用」。

### 4.6 隔离与残留自检

- **真实库**：全程未触碰 `backend/data/larry.db`；探针只用 `%TEMP%` 与用户主目录下的自建目录，结束即删（已复核三处探针目录均不存在）。
- **DSH profile**：探针经 `dsh plugin --profile larry add/remove` 挂载与摘除，**已还原**（`bundles` 回到 3 项，`--dump-config` 中 `sandbox-probe` 计数 = 0）。
- **残留**：`process.exit` 跳过 cordis teardown，provider 私有 temp（`%TEMP%\dsh-XXXXXX`）不会自动回收 → 本轮 3 个（`dsh-70m9RK`/`dsh-5QgbMa`/`dsh-IpxoBr`）**已手动删除**；工作区常驻 ACE 随目录删除一并消失。**⇒ 这是本探针形态的已知副作用，复跑者请照做。**
- **凭据**：全程无 key 参与（探针不经 LLM）。

### 4.7 建议（只提建议，不改实现 —— 派发稿边界）

1. **拒绝方言需按「子进程 × 区域设置」补齐**，否则中文 Windows 上的拦截对模型不可见（§4.3）。最小改法方向是加 `EPERM: operation not permitted` 与本地化串/正则；但**具体方案属实现，交给 Trae/WB 定**。
2. **`enforcement: partial` 的两条边界是真的**（E2/E3）—— 承接总表里 2.10.2「Windows 端侧执行器」按 partial 规划，不要按 full 宣传。
3. 本探针**可留在 harness 作常驻测试资产**（WB 复验可直接复跑）；是否固化进 DSH-6 测试体系由 WB 定。

---

## 5. ④ Vue/Tauri → sdk profile 连通 —— 判定与复核

### 5.1 判定：**与 DSH-2.3 是同一件事**（重申，不是新任务）

依据 = 读 2.3 报告 **+ 实查产物**（不采信声明）：

- 2.3 用的**就是真实 `client/` 工程，不是 demo**：交付含 `client/src-tauri/src/main.rs`（`dsh_prompt` IPC，**实查 3 处引用**）、`client/src/components/DshProbe.vue`（**实查存在**）、`harness/scripts/dsh-prompt.mjs`（**实查存在**）；改动已提交，`git log -- client/` 首条即 `d8108c6 DSH-2.3 连通交付（Trae）`。
- 2.3 §3.4 记录**老大 GUI 一手点验**（Vue modal → Tauri IPC → node → sdk runtime → 真实模型回包）。
- `TODO.md` 亦已写「退出条件 ④ 与本项同源——本项跑通即 ④ 达成，不重复验收」。

→ **判为同一件事的重申**。不重复劳动；下面只做「非重复部分」的独立复核。

### 5.2 我的独立复核（只验「今天还在不在」，不重跑 2.3 全流程）

| 项 | 实测 | 档 |
|---|---|---|
| 驱动脚本 / 能力探针脚本 | 均在（`harness/scripts/`） | 🟢 |
| client 侧 2.3 改动 | 在且已提交（见 §5.1） | 🟢 |
| `@deepseek-ai/dsh-sdk-client` | 已装于 harness | 🟢 |
| `sdk` profile | 在（bundles = `dsh-base` + `dsh-sdk-app`） | 🟢 |
| **通道实跑**（无 key） | `node scripts/dsh-prompt.mjs "…"` → **exit 0**、session 建立、12 事件、干净退出 | 🟢 传输层成立 |
| **真实模型回包**（④ 原有的验收点） | **未由我复验** —— 本机 `DEEPSEEK_API_KEY` **未设**；我不自翻配置、不向任何文件写 key | ⬛ |

### 5.3 ⚠️ 顺带发现：**无 key 时「看起来是成功的」**

无 key 跑同一脚本：**exit 0**、session 正常建立、事件流正常（12 条）——只是：

- `finalResponse` = **空字符串**
- 事件分布**缺 `assistant/message`**（2.3 有 key 时该事件存在，且 `assistant/chunk: 7`；无 key 时 `assistant/chunk: 1` 且**无 `assistant/message`**）

→ **判据警示**：只按「exit 0 / 有 session / 有事件」判「连得上」，会把**「没 key」读成「通了」**。可判定的信号 = **`assistant/message` 事件存在 且 `finalResponse` 非空**。
→ 对 DSH-3 起的连通性回归（尤其无 key 的 CI 场景）有直接价值：**必须有「模型回包非空」的断言，否则绿灯无意义。**

### 5.4 建议

- ④ 按 2.3 结论**勾掉**即可，不必重跑全流程。
- 若要 ④ 的「真实回包」由我方独立复验一次：给临时测试 key（**只经环境变量**，不落盘），我 1 分钟内补跑并附原始输出。
- §5.3 的断言建议纳入 DSH-6 测试体系：**无 key 应红，不能绿**。
