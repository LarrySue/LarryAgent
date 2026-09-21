# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T** | Claude | 本机（Windows） | ✅ **已交回并复验（WB 2026-09-20：`T-1` 独立复跑逐条一致 ＋ `T-2` 三方字段比对一致；2 处差异均**非断言项**）** | 2026-09-20 |
| **DSH-3.7.4-T·P** | Claude | **CVM（Linux）** | ✅ **已交回 · 待复核（2026-09-21）** —— 三问全部直答：**`chmod 0o500` 在 Linux 上真生效**（`EACCES`／`errno -13`；ext4 与 tmpfs 两通道逐位一致；**另加 root 对照**把因果坐实）／**非 root**（`uid=1000`，`umask 0o2`）／装置层 `no-session-dir exit=0 PASS` **两轮**复现 ⇒ **真红**｜回报＝上节 ｜⚠️ 结论**取自 `917f45d` 版树**（⛔ 不得当"当前版本"外推） | 2026-09-20 |

- 已完成并复验（各段已按交流区规矩清理；3.0.x 系列与 DSH-2 系列均已在 `TODO.md` 承接）：**3.7.3-T ✅（WB 复核：T1–T4 四项判定均成立，另补 1 条更强的 ＋ 记我方派稿缺陷 1 处）** ／ **3.7.4-T ✅（WB 复核：`T-1` 独立复跑逐条一致 ＋ `T-2` 三方字段比对一致；2 处差异均**非断言项**）**。
- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3.7.4-T」段**；本区只放**怎么做**。⚠️ 需回溯时用 `git log -p -- exchange/log-claude.md`。
- ⚠️ **通用纪律**：
  1. **报告须注明通道** —— 同一台机器上，不同工具树 ／ 不同 shell 会话会给出**不同 node 版本**与不同文件系统视图 ⇒ 结论不可跨通道互推（"Bash 通道"这种写法对别人而言是**另一条**）。
  2. **"没有 ／ 不存在"须附检索式与遍历范围**，否则不可验、等于没回答。
  3. **自曝优于好看**：口径错 ／ 跑歪 ／ 覆盖了证据，都直接写。
  4. **未观测到的行为不得写成已证**（"可达但未观测"要标清；"构造成立"要标为构造）。
  5. **应红 ／ 应绿须逐件读源码定期望**，不得按"组"给口径（同一批哨兵里可能有**落绿才是绿**的件）。
  6. **收尾必核 `git status`**。

---

## ✅ DSH-3.7.4-T·P 回报（2026-09-21 · CVM 实测）

> **场地**：CVM（Linux）`ubuntu@49.232.129.252`｜**树版本**：`~/harness/SYNC-ANCHOR.txt` 记的 **`917f45d`**（synced-at 2026-09-17 20:05，**落后本机 3 天**）⇒ ⛔ **下列结论只对该版树成立，不得当"当前版本"外推**
> **交付件**：`harness/scripts/s0-e2e-destructive-actions.mjs`（平台自适应；POSIX 分支新增）sha256 `c5cb1149…3cee7bb` **本机／CVM 双侧逐位一致**
> **证据**：`D:\Code\_claude-evidence\374t-p\`（13 件，含 CVM 侧原件副本）｜CVM 侧目录 `~/claude-tp-evidence/{ext4,tmpfs,root,device,device-rerun}/`

### 0 · 结论先行（三问逐个直答）

| # | 问题 | 判定 | 依据（一句话） |
|---|---|---|---|
| 1 | `chmodSync(dir,0o500)` 在 CVM 的 Linux 上能否让写失败？ | ✅ **成立** | 权限位**真设上**（`arm1_modeAfterChmod500=0o500`）⇒ `writeFileSync`／`mkdirSync` **双双 `EACCES`／`errno -13`**；正对照 `0o700` 写成功；**两条文件系统通道逐位一致** |
| 2 | 运行身份？是否 root？ | ✅ **非 root** | `uid=1000(ubuntu) gid=1001(ubuntu)`、`umask=0o2` ⇒ 派发 §1.2 的 root 风险**排除**；另**加做 root 对照**（§2 通道 C），把该风险从"已排除"变成"**已实测**" |
| 3 | （装置层）那条破坏动作是真红还是假红？ | ✅ **做了 · 真红** | `no-session-dir` 单变体 `exit=0 PASS 13s`（**两轮**复现，判据字段逐字段一致）；`②_activated/②_injectFired/②_toolRegistered=true` ⇒ **链路确实起来了** ＋ `logPresent=false`／`④_sessionContainsNonce=false` ⇒ 期望落位达成 |

⇒ **第 3 条未退回机制层**（成本可控：该变体**模型回合根本没起** —— `assistantMessageCount=0`、事件仅 3 类、`assistant/message` 缺失 ⇒ 几乎不烧 token）。

**第 3 条的诚实边界（⚠️ 我修正了派发前自己的一个判断）**：`logPresent===false` **是对 chmod 效果的间接验证** —— 若 chmod 静默失败，落盘会成功 ⇒ 该判据变 `true` ⇒ **断言失败** ⇒ **装置其实能检出**。（我原先以为"装置无降级检查 ⇒ 给没有验证力的红"，**该判断偏重，实测修正**。）⇒ 真实缺口是**红的成因不可辨**：`③_errorCode=UNKNOWN`（不是 `EACCES`）⇒ 装置层**自己看不到权限错误**，本案归因到"chmod 生效"靠的是**装置外的机制层两通道互证**（§2）。

### 1 · 命令 ＋ 原文观测

```sh
# 共同前置
export PATH="$HOME/node/bin:$PATH"      # ⛔ 少了这行 node/pnpm 都 command not found（WB 更正稿已述）

# 通道 A（ext4）
mkdir -p ~/tp-scratch-ext4
S374T_SCRATCH_ROOT=$HOME/tp-scratch-ext4 S374T_EVIDENCE_DIR=$HOME/claude-tp-evidence/ext4 \
  node ~/harness/scripts/s0-e2e-destructive-actions-posix.mjs
# 通道 B（tmpfs）：同上，SCRATCH/证据目录换 /dev/shm/tp-scratch 与 .../tmpfs
# 通道 C（root 对照）
sudo -n env PATH="$HOME/node/bin:$PATH" S374T_SCRATCH_ROOT=/tmp/tp-root \
  S374T_EVIDENCE_DIR="$HOME/claude-tp-evidence/root" node scripts/s0-e2e-destructive-actions-posix.mjs
# 通道 D（装置层）—— key 为**盲取**（值只进 shell 变量→子进程 env，从不打印/落盘/进上下文）
KEY=$(node -e '…读 ~/.dsh/.credentials.yaml，正则取 sk-… 值…')   # 只打印 ${#KEY}=35
S0_VARIANT=no-session-dir S0_EVIDENCE_DIR="$HOME/claude-tp-evidence/device-rerun" \
DSH_REAL_API_PROFILE_HOME="$HOME/.dsh/profiles" DEEPSEEK_API_KEY="$KEY" \
  node scripts/run-s0-e2e.mjs no-session-dir > …/runner.stdout.txt 2>&1
```

**臂 1 原文（通道 A／ext4）**：

```
arm1_modeAfterChmod500 = 0o500
arm1_actualWrite = {"tag":"a1","writeFile":{"ok":false,"err":{"code":"EACCES","errno":-13,
  "message":"EACCES: permission denied, open '…/chmod500/probe-a1-write.txt'"}},
  "mkdir":{"ok":false,"err":{"code":"EACCES","errno":-13,
  "message":"EACCES: permission denied, mkdir '…/chmod500/probe-a1-subdir'"}},"entriesAfter":[]}
arm1p_modeAfterChmod700 = 0o700
arm1p_actualWrite = {"tag":"a1p","writeFile":{"ok":true},"mkdir":{"ok":true},
  "entriesAfter":["probe-a1p-subdir","probe-a1p-write.txt"]}
arm1p_arm1ArtifactsPersisted = []          ← 臂 1 产物**一个都没落盘**
arm1_accessSyncW_OK_非判据 = W_OK 抛错（EACCES）
```

⚠️ **`accessSync(dir, W_OK)` 的判据有效性是平台相关的**：POSIX 上它**抛 `EACCES`**（Windows 上 `0o444` 下**照样通过**，见 `docs/local-env.md` §12.3）⇒ 两平台一致地**不拿它当判据**，但**理由相反**。

**装置层原文（runner.stdout.txt 尾）**：

```
[s0]   no-session-dir   exit=0 PASS （期望 PASS：负向对照由测试内部断言"该判据变红"） 13s
```

⚠️ **PASS 的语义** = 负向对照"行为符合预期"，**不是**"链路正常/变体绿"——后续读者勿误读。

### 2 · 通道四元组（⚠️ 通道口径须一并读）

| 通道 | 运行时 | 身份（umask） | 文件系统（源） | `mode@500` | writeFile ／ mkdir | accessSync(W_OK) | 臂1产物 | 组杀后孙 ／ 只杀子后孙 |
|---|---|---|---|---|---|---|---|---|
| **A** `~/tp-scratch-ext4` | node v22.22.2 | uid=1000(ubuntu) `0o2` | **ext4**（`/dev/vda2`，挂 `/`） | `0o500` | **EACCES ／ EACCES**（-13） | 抛 `EACCES` | 0 件 | **死 ／ 活** |
| **B** `/dev/shm/tp-scratch` | node v22.22.2 | 同上 | **tmpfs**（`/dev/shm`） | `0o500` | **EACCES ／ EACCES**（-13） | 抛 `EACCES` | 0 件 | **死 ／ 活** |
| **C** `/tmp/tp-root`（root 对照） | node v22.22.2 | **uid=0(root)** `0o22` | ext4（`/`） | `0o500` | **ok ／ ok** | **通过** | **2 件** | 死 ／ 活 |
| **D** 装置层 | node v22.22.2 ＋ s0-e2e | uid=1000(ubuntu) | ext4（`DSH_HOME=/tmp/larry-s0-*`） | —（装置内） | — | — | — | — |

- **A 与 B 逐字段相同** ⇒ **文件系统维度不改变结论**（ext4 与 tmpfs 权限语义在本项上一致）。
- **C 与非 root 的唯一差异就是写结果**，而 `mode@500` 三者皆为 `0o500` ⇒ 权限位**确实设上了**、差异 **100% 来自 root 绕过 DAC** ⇒ **因果链闭合**，且派发 §1.2 的"已知风险点"由**实测对照**坐实（不是推理）。
- ⚠️ **通道口径**：**运行时只有一条**（CVM 上无系统 `node`，唯一 = `~/node/bin/node` v22.22.2）⇒ 两条"通道"是**文件系统**维度，**另加身份对照**；⛔ 不得叙述成"两条独立运行时通道"。
- 臂 3／4／4b 在 A／B／C 三通道**结论一致**（负 pid 组杀 ⇒ 子与孙俱死；只杀直连子 ⇒ **孙存活**，孙 stdio `ignore` 与 `pipe` 皆然）⇒ 与身份、文件系统**均无关**。⚠️ 本项是**POSIX 对照**（不在派发要求内，我主动加做）：它**正好是 Windows 的反面** ⇒ 解释了被测装置 `s0-e2e.test.ts:193` 注释「只杀直接子进程会留下它继续把回合写完」的来历（**描述的是 POSIX 行为**），也说明装置在 POSIX 上走主路径**必要**（回落不足）。

### 3 · 装置侧留痕与禁区核对

- 被测装置 `s0-e2e.test.ts` sha `ce562210…c2a42`、runner `4404bd18…12b7ff`、场地参考件 `9b5e1668…7ec3e4`、我的件 `c5cb1149…3cee7bb` —— **四项跑前／跑后逐位未变** ✓（⛔ 未改装置）
- 首跑 `DSH_HOME=/tmp/larry-s0-aWeo0T` **已自清**（`ls -d /tmp/larry-s0-*` ⇒ No such file）⇒ 无残留 ✓；我自建的容器目录 `~/tp-scratch-ext4`／`/tmp/tp-root` 跑后为**空**（脚本 `litter: []` 的自报得到独立印证），已 `rmdir` ✓
- ⚠️ **给后续复验者的坑**：runner `:36` 的 `S0_EVIDENCE_DIR` **默认值是 `repoDir/.s0-evidence`** —— 正是 **Trae 的证据目录**（派发 §5 禁区）。**忘传该 env 就会覆盖他人证据** ⇒ 复跑务必显式传（我两轮都传了 `$HOME/claude-tp-evidence/…`）。

### 4 · 自曝

1. **装置层 runner 的 stdout 首跑未落盘**（只落了装置自写的 `evidence.json`）⇒ 我报告的 `exit=0` 当时**不可由证据复核**。已**补跑一轮**并把 stdout 落盘（`device-rerun/runner.stdout.txt`，3761 B）；首跑原件**未覆盖**。两轮 evidence.json 逐字段一致（差异仅临时目录名／pid／sessionId／pnpm 耗时 3.5s→3s）。
2. **上面 §0 那条判断修正**：我原以为装置"无降级检查 ⇒ 给没有验证力的红"，**该判断偏重**，已按实测改写。
3. `no-session-dir` 首跑 `exit=1 FAIL` 的原因**不是 chmod** —— 是装置 `:275` 在跑之前 `throw 未检测到 DEEPSEEK_API_KEY`。⚠️ 这条差点被读成"破坏动作生效导致失败"，实为**环境前置**。
4. 通道 B **首跑 ENOENT**：`/dev/shm/tp-scratch` 在上一条 ssh 里建过却在会话外消失 ⇒ 我**没有停在猜测**，布了跨会话探针**实测确证** systemd-logind `RemoveIPC`（`ls /dev/shm` ⇒ `total 0`，探针目录不存在）。
5. **`sudo -u nobody` 身份轴「未做」**：CVM 上 `node` 位于 `0700` 的 `/home/ubuntu` 下、`nobody` 进不去 ⇒ 障碍明显；且派发 §1.2 只在"**若是 root**"时才要求补测非 root，**我非 root ⇒ 该条不触发**。如实标「未做」，⛔ 未含糊。
6. Q3 用的 key 是 **CVM 上 `~/.dsh/.credentials.yaml` 盲取**（值全程不打印／不落盘／不进上下文，只打长度 35）—— **未使用老大给的临时 Key**（该 Key 我已请老大关闭）。
7. 本条非自曝但须说明：**上表"通道"是文件系统维度**，运行时只有一条 —— 已在 §2 明写，避免被读成两条独立运行时。

### 5 · 未闭合 / 交办（⛔ 只提不改）

- **装置缺口（真缺口，非我原先说的那条）**：`logPresent=false` 的**成因不可辨** —— 装置不区分"落盘被拒"与"其他失败"，且 `③_errorCode=UNKNOWN` 使装置层看不到 `EACCES`。⇒ 生产上若出现该变体红，**归因须靠机制层**（本块已提供：同一条 chmod 的两文件系统通道互证 ＋ root 对照）。**是否给装置加一条"chmod 是否真设上"的显式检查，交 Trae／老大定**（⛔ 我不得改装置）。
- **树版本落后**：本块结论取自 `917f45d` 版树（落后本机 3 天，本块已定不同步）⇒ 若要作为**当前版本**的判据，须在本机树或同步后的树上复跑。
- 与 WB 更正稿核对：树版本锚 `917f45d` ✓／`~/harness` 非 git 仓库 ✓／node v22.22.2 ✓／pnpm 11.7.0 ✓（pnpm 原文自报 `v11.7.0`）／旧版 runner **无 `exit 2` 逻辑** ✓（未去验那条假矛盾）。**唯一新增**：`umask=0o2`（WB 未报，我自证）。

@Trae（装置缺口一条待你定）@WorkBuddy（复核）@老大

---

## 🗂 已清理段落（按交流区规矩）

- **DSH-3.7.4-T 派发稿 ＋ T-1／T-2 回报**（2026-09-20 派发／交付／复验后清理）—— 判据与边界的权威落点 = `TODO.md`「DSH-3.7.4-T」段；机制事实 = `docs/local-env.md` §12。回溯：`git show 5a1763d:exchange/log-claude.md`。
- **未结项随段转出**：`T-2 §6` 报的「派发稿 §7 凭据条款 vs Tier 0 临时 Key 豁免」口径冲突 ⇒ 并入 WB 侧「派发稿口径待采纳」项跟踪（同批还有 `J7` 原文条款）。
- **仓外证据（本轮）**：`D:\Code\_claude-evidence\374t\`。

---

## 🚀 DSH-3.7.4-T·P · POSIX 侧补测（装置 `chmod 0o500` 分支在 Linux 上是否真生效）

> **派发**：WB 2026-09-20（老大同日裁「**做**」）｜**执行人**：Claude ｜**场地**：**CVM（Linux）**
> ⚠️ **本块 = 你上一轮 `T-1-a` 的 POSIX 侧对照**：T-1-a 已判「`chmodSync(dir, 0o500)` 在 **Windows** 上**不成立**」；**Linux 侧从未验过**。而装置 `s0-e2e.test.ts` 的 `no-session-dir` 变体在 POSIX 上**仍走 `chmodSync(dir, 0o500)`** —— **生产环境就是 Linux**。
> 📌 **权威落点 = `TODO.md` 3.7.4 段「未闭合项处置」表 #5**；本区只放**怎么做**。

### 0 · 为什么必做（不是补仪式）

装置里那条破坏动作若在 Linux 上**也不生效**，`no-session-dir` 变体会**静默失效** —— 判据变成**没有验证力的红／绿**（看着像"抓到问题了"，其实**被测对象根本没被动到**）。**这比失败更危险**：失败会被发现，"静默失效"不会，且它会一路带进生产验收。

⚠️ **已知风险点（本块的核心变量）**：**若以 root 跑，`chmod 500` 对 root 无效**（root 无视权限位）⇒ **必须记录实际运行身份**，否则结论对生产无解释力。

### 1 · 要回答的三件事（逐个直答）

1. **`chmodSync(dir, 0o500)` 在 CVM 的 Linux 上，能否让 `writeFileSync` ／ `mkdirSync` 真的失败？**
   - **须附正对照**：同目录 `0o700` 时**写成功**（证明"不是到处都写不进"）。
   - 报**实际 `errno` ／ `code` 原文**（Linux 侧预期是 `EACCES`，但**以实测为准**）。
   - ⛔ **别用 `fs.accessSync(dir, W_OK)` 当判据**（它在 `0o444` 下照样通过 —— Windows 侧已实测，见 `docs/local-env.md` §12.3）。
2. **运行身份是什么**（`id` ／ `whoami`）？**是否 root**？
   - ⇒ 若**是 root**：**必须补报"非 root 用户下是否成立"**（另建账户或 `sudo -u nobody` 等，姿势自定），否则第 1 条的结论**对生产不成立**。
   - ⇒ 若**非 root**：直接报结果，并注明 `umask`。
3. **（装置层，成本可控才做）** 在 CVM 上实跑 `no-session-dir` 变体时，那条破坏动作**是否真的生效** —— 即红灯项是真红还是假红。
   - ➡️ **取舍写死**：若起一轮 s0-e2e 成本过高（CVM 上含 profile boot ／ 真实调用），**退回到"机制层 ＋ 读源码说明"**，并把第 3 条**明确标为「未做」** —— ⛔ 不得含糊过去、也不得用机制层结论**冒充**装置层结论。

### 2 · 通道要求（沿用本块既有纪律，不放松）

- **至少两条通道各跑一次**（例如：裸 shell ／ 经 harness 脚本 ／ 另一个 node 运行时），结论**分列在各通道上**；**两条不一致就并列留痕、不合并**。
- 若实际只有一条通道 ⇒ **明说**，按**单通道口径**写。
- 每条结论须注明四元组：**通道 ＋ 运行时（node 版本）＋ 身份（user/root）＋ 文件系统**（本地盘 ／ 挂载点 ／ overlayfs 等）。⚠️ `/mnt` 类挂载与 overlayfs 的权限语义**可能不同** ⇒ 若涉及，**并列报**。

### 3 · 交付物

- **独立测试件源码**（建议**扩**你上一轮的 T-1 件，加 POSIX 分支；⛔ **不得改被测装置**）。
  - ✅ **该件已由 WB 落位到你的场地**：`/home/ubuntu/harness/scripts/s0-e2e-destructive-actions.mjs`（2026-09-20 17:16 scp；sha256 `9b5e1668…e7ec3e4`／16101 B，**本机与 CVM 双侧核对一致**；落位留痕见 `~/harness/SYNC-ANCHOR.txt` 末节）。
  - ⇒ 它是**你场地上的拷贝** —— 改它**不影响本机仓库**，可放心扩；⛔ 但仍不得把它当被测装置。
- **原文证据落盘**（含编码），报**路径 ＋ 文件清单**；⚠️ **证据目录自定，不得覆盖他人**（Trae 的 `.s0-evidence` ／ 你的 `_claude-evidence\374t` 均不得动）。
- **回报**：写本文件**顶部状态区之后**，单独一节。

### 4 · 参考件四要素

| # | 件 | ① 路径 | ② 怎么参考 | ③ 参考程度 | ④ **不可参考** |
|---|---|---|---|---|---|
| a | 被测装置（**只读**） | `/home/ubuntu/harness/tests/s0-e2e.test.ts` | 读 `no-session-dir` 变体。⚠️ **你场地上这份是旧版、没有平台分支** —— `chmodSync(dir, 0o500)` **直接写在第 252 行**（平台分支是本机 2026-09-20 的修复，**未同步到 CVM**）。**本块要验的正是那一行**。另读该变体的期望落位（`logPresent=false` 等） | **只读** | ⛔ **不得改它**（那是 Trae 的活） |
| b | 你上一轮的 T-1 件（**已落位到场地**） | `/home/ubuntu/harness/scripts/s0-e2e-destructive-actions.mjs`（WB 2026-09-20 落位；sha256 `9b5e1668…e7ec3e4`） | **臂 1 ＋ 正对照**的写法与退出码语义（`0`=观测已取得，**不代表装置对**） | 可复用 ／ 可扩 | ⛔ 其 **Windows 侧结论不可外推**到 Linux（`0o444` 那套是 Windows 语义） |
| c | 机制说明（⚠️ **原文件在你场地上不存在**，要点就地摘录） | 本机仓库 `docs/local-env.md` §12.3（**CVM 上无此文件**） | 三手段要点：① `chmod` 在 Windows 上**不成立**（Windows 侧结论，⛔ **不可外推**）② `icacls /deny` **成立**（Windows 专用手段）③ ⛔ **`fs.accessSync(dir, W_OK)` 不可作判据**（`0o444` 下照样通过 —— 本机实测）。**本块只需第 ③ 条**，并记住 ①② 不可外推 | 照用 | ⚠️ §12.3 的实测**全在 Windows** —— 它只提供"该测什么"，**不提供 Linux 侧的答案** |

### 5 · 场地器材（⚠️ 本块有一处**与上一轮不同**的地方，别踩）

- **场地**：**CVM（Linux）**，`ubuntu@49.232.129.252`（WB 2026-09-20 实测可直连）。提醒：**CVM 10-09 到期**（见 `TODO.md` DSH-3.9）⇒ 本项属**发版前必做**，宜早。
- 🔴 **你场地上那棵 harness 树的版本 = `~/harness/SYNC-ANCHOR.txt` 记的 `917f45d`（synced-at 2026-09-17 20:05）**。⚠️ **它不是 git 仓库**（同步时排除了 `.git`／`node_modules`／`dist`）⇒ **别用 `git log` 判版本**，读那个锚文件。它**落后本机 3 天**；本块**已定不同步**（WB ＋ 老大 2026-09-20）：要验的那一行两版都在。
  ⇒ ⚠️ **结论必须注明"取自 `917f45d` 版树"** —— ⛔ 不得当作"当前版本"的结论外推。
- 🔴 **「默认源已改、不传即 `exit 2`」那条提醒，在你场地上不成立**（WB 已实测更正）：你那边是**旧版**（`scripts/run-s0-e2e.mjs:35` = `resolve(homedir(), '.dsh', 'profiles')`，**无 `exit 2` 逻辑**）；「源不存在即 exit 2 ＋ 不回落」是本机 **2026-09-20** 才改的（`TODO.md` 处置表 #4），**未同步到 CVM**。
  ⇒ 本块**仍按显式传** `DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles`（WB 实测：该目录存在 ✅，且**恰好等于旧版默认值** ⇒ 无副作用）；但 ⛔ **别把"不传会 exit 2"当判据** —— 旧版不会，去验它只会得到一条**假矛盾**。
- 🔴 **运行时不在 PATH 里**（WB 实测：裸 `node`／`pnpm` 均 `command not found`；`~/bin` 与 `~/.local/bin` **都不存在**，`.profile` 里那两行 PATH 追加是空转）。**实测调用式**：
  ```sh
  export PATH="$HOME/node/bin:$PATH"   # ⛔ 少了这行，pnpm 会以 /usr/bin/env: 'node': No such file or directory 挂掉
  node -v   # ⇒ v22.22.2（实测；与本机 managed 同版）
  pnpm -v   # ⇒ 11.7.0（锚文件记录）
  ```
- ✅ **运行身份已由 WB 实测**：`uid=1000(ubuntu)`、**非 root** ⇒ 本块的核心风险（root 下 `chmod 500` 无效）**已排除**。仍请**在你通道内自报一次** `id`／`umask` 作为你自己的证据。
- ✅ **凭据载体存在**：`~/.dsh/.credentials.yaml`（`-rw-------`，仅属主可读）。⛔ **本块只判存在性、不读值、不打印、不落盘**；第 3 条若需真模型回合，按你既有取法自取。
- **证据目录（现场已有，⛔ 别撞）**：`~/trae-evidence/`（Trae）、`~/claude-305/`、`~/s0-evidence.tgz`、`~/.dsh/`、`~/larry-dsh-home/`。⇒ **你自己的证据目录自定且不得覆盖上述任何一个**（建议 `~/claude-tp-evidence/`）。
- ⛔ 不得动 `~/harness` 的**受控文件**（`package.json` ／ lockfile 等）；⛔ 不得动源 profile；⛔ 不得动 `~/larry-dsh-home`（已降级为**负向对照器材**）。✅ 但**可以**在 `scripts/` 下**新增**测试件（参考件 b 就在那儿）。
- ⛔ 涉及依赖时锁死 `pnpm`（⛔ 禁 `npm` ／ `yarn`）。

### 6 · 回报格式

- **结论先行** —— 三问逐个直答（含"未做"也要直答）。
- 每项给**命令 ＋ 观测值（原文）**。
- **未观测到的行为不得写成已证**（"可达但未观测"须标清）；**「成因未知」可接受**，别为叙事完整编一个。
- **自曝优于好看**：口径错 ／ 跑歪 ／ 覆盖了证据，直接写。

### 7 · 禁区

- ⛔ 不得修改被测装置（`s0-e2e.test.ts` ／ `run-s0-e2e.mjs`）。
- ⛔ 不得覆盖他人证据目录。
- ⛔ 不得跨通道外推结论；⛔ **不得把 Windows 侧结论外推到 Linux**（本块存在的全部理由就是这条）。
- ⛔ 禁 `git rm`（全局禁）。
