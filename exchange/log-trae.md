# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.8.1 ／ 3.8.2** | Trae | 本机（Windows） | ✅ **均已回报 · WB 复核成立（2026-09-22）** —— `3.8.1`（driver 成型：`PASS 22 ／ FAIL 0 ／ OBS 10 ／ 未验 0`）／ `3.8.2`（3.8.1 装置缺陷修复：A1 ／ A2 ／ A3 ／ B1 ／ B2 全条成立，`J3-c` 的构造性恒真**已被证伪**）⇒ 判定 ／ 证据 ／ 遗留 = `TODO.md`「DSH-3.8」段 | 2026-09-22 |
| **DSH-3.4-R** | Trae | 本机（联网检索 · 只读参考） | ✅ **已回报（2026-09-23）· 待复核** —— 报告见下方 `## 📊 DSH-3.4-R 调研报告`（三段式：检索账／候选表／评论）。摘要：官方 5 件（T1／T2／T3／T4 全答）＋ 社区落位 9 件（7 成功／1 失效／含 1 件 GPL 红线）；**T3 权威答案＝官方 `retainRatio 0.16` 尾部 verbatim**；**T4 确定路径＝`/compact`→`compactNow(retain=0)`**；⚠️ **版本脱节：社区已分叉（RC 线 vs `0.1.7-alpha` 线），实测 semver 见报告 §4**；含**流程调整声明 6 条**（报告 §0） | 2026-09-23 |

- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3」区**（**一处两面**）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯时用 `git log -p -- exchange/log-trae.md`。
- ⭐ **派发前已重测前提（WB 2026-09-22）** ⇒ **8 条实测**，其中 **2 条推翻旧登记**（`--patch` 通道实测验有 ／ **gateway 装配层结论翻转**）、**1 条前提缺口**（`DEEPSEEK_API_KEY` 当时不存在 —— 当日已闭合）⇒ 摘要与权威落点 = `TODO.md`「DSH-3.8」段。**逐条对账，别照抄旧前提。**
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.2.1 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— ⛔ **本条后半句已作废（2026-09-20 WB 复验实测推翻）**：原文写「本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，**出现英文即非本机原始产物**）」—— **「出现英文即非本机产物」不成立**：本机实测 `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统／用户 UI 语言实测是 zh-CN）。⇒ **保留前半**（⛔ 不得人工改写 ／ 意译），**撤掉后半的推论**。**替代纪律**：判「原文」只认**字节级**核对（按 ACP 936 解 GBK，或直接比原始字节），并**注明该段取自哪条通道**；**语言 ／ 编码不得作"证据是否被后处理"的判据**。详见 `docs/local-env.md` §12.6。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

## 📤 DSH-3.4-R · 参考件广撒网调研（派发于 2026-09-23）

**规格（筛选规则 ／ 报告格式 ／ 反纪律 ／ 必扫区）→ `docs/dsh/dsh-34-ref-research.md`** —— 逐条照它执行，不要即兴发挥。

**任务**：为 `DSH-3.4`（S2 compaction 接入）做参考件调研 —— **独立**检索、梳理、筛选，出具**评论报告**。要回答六问 T1–T6（见规格 §0）。

**边界（违反即报告不可采信）**
- ⛔ **提交前不得翻阅其他 AI 的交流区**（含 `log-workbuddy.md`）—— 本任务的价值在「同规则、异通道、互不影响」。
- ⛔ 只作参考源：报告**不得出现「装上就能用 ／ 可作产品依赖」**式结论（§3.0）。
- ⛔ **不把候选件装进任何环境** —— 连 `dsh plugin add` 试装也不在本次范围内。
- ⛔ **不编**：找不到就写「无」。
- ⚠️ 星标 ／ 热度不构成理由；README 宣称 ≠ 实现。

**动手前先做的前提实测**（别照抄登记表旧结论）
- 规格 §6 必扫区的路径**至少实测一条**可达（例：`git -C ref/dsh-bare show dsh-v0.1.5-rc.2:packages/compaction/README.md`）；不可达 ⇒ 报出，不静默跳过。
- 本机代理坑见规格 §8（`git clone` 报 443 失败 **≠ 被墙**）。

**报告落点**：本文件新增一段 `## DSH-3.4-R 调研报告`。
**回报格式**（三段固定，顺序不可换）：① **检索账**（通道 ／ 检索式 ／ 时间 ／ 扫描量 —— 须可复算）② **候选表**（按规格 §3 字段）③ **评论**（观察与评论**分开写**，并给**版本脱节判断**）。

**判据权威落点**：`docs/dsh/dsh-34-ref-research.md`（规格）＋ `TODO.md`「DSH-3.4」段（切片判据）。回收后由 WB 汇总并回填 `docs/dsh/dsh-migration.md` §3.6 登记表 3.4 行。

- **建议侧重（非强制、不构成分工）**：你是 3.4 的实现方 ⇒ 可优先把 **T1（契约）／ T2（现成 Provider 怎么写）** 挖到底；其余按规格走。不要求你猜别人扫了什么。

## � DSH-3.4-R 调研报告（Trae · 2026-09-23）

> 通道 = **本机（Windows）** ｜ 独立作业：**提交前未翻阅任何其他 AI 的交流区**（`log-workbuddy.md` ／ `log-claude.md` ／ `log-qoder.md` ／ `log-other.md` **一次未开**）
> 时间锚：**2026-09-23 17:50–17:56 (+08:00)**
> 落位区（**仓外只读**，⛔ 未装入任何环境、未执行 `dsh plugin add`、未进任何依赖树）：`D:\Code\_trae-evidence\34r\`
> ⚠️ 本报告在规格三段（检索账／候选表／评论）之外**额外加了两段**：**§0** 是老大本次的额外授权要求（流程调整须写明理由与改动），**§4** 是规格 §5-5 明文要求的"单独一节"。**不属于我即兴加戏。**

---

### 0 · 我对调研流程的调整声明（老大授权：可调整，但必须写明理由与改成了什么）

| # | 规格原样 | 我改成什么 | 理由 |
|---|---|---|---|
| **A1** | §1 G1（有 LICENSE）／G2（有可读实现源码）为**一票否决**，对**所有候选**适用 | **G1／G2 只对「已落位件」判定**；仅来自名录一行的条目归 **§5 C 档线索**，并显式标「⏳ 未落位 ⇒ G1／G2 **未判**」，**不塞进 D 档** | 名录是**发现通道**、不是**判定通道**：它的条目只有一句描述，既无 LICENSE 也无源码 ⇒ 按字面 G1+G2 **整份名录都会被误杀成出局**，而规格 §6④ 又强制要扫它。⇒ 我把"判定"限定在"落位之后"，并把这个口径写在表里，**不静默** |
| **A2** | §7 自选区"不限通道"（未给名额） | 自定**落位门槛 + 名额上限 8**：① 从描述能看出**直接命中 T3（保原文）／T1（走官方 seam）／T2（替换 backend）**；② 能看出**有实现**（非纯 UI／纯文档）；③ 上限 8 件（信噪比），其余留作线索 | 名录相关条目 20+，全落位会淹没在低价值件里；门槛与名额写在检索账里 ⇒ **取舍规则可复核、可被否决** |
| **A3** | §0 把 T3（"压了但近文原文保留"）标为「优先社区件」 | **不按"来源偏好"答题**：T3 先由**官方 `region.ts`（🟢 实读源码）**答，社区件作**对照与补充** | T3 是 3.4 判据的核心 ⇒ 不该被"社区优先"绑架；且本地／上游是 🟢 实读，社区多为 🟡。**来源偏好不能凌驾证据等级** |
| **A4** | §6① 官方包落点写作 `~/.dsh/profiles/sdk/node_modules/@deepseek-ai/` | **两处 home 都实测**（`~/.dsh` ＋ 项目 `.dsh-home`），并比对同源性 | 本项目纪律是"只用一个 DSH home"（`TODO.md` 贯穿规则）⇒ 规格 §6① 与项目纪律**可能冲突**，必须实测而非照抄。实测结果见 §1-C1（**两处同源**） |
| **A5** | §5-5 要求"版本脱节"单列给老大 | 我把"**版本可辨率**"一并并入该节，并**实跑 semver** 判 peer 范围，而非只抄声明 | 严格 semver 的**预发布规则**会让"看起来兼容"的范围判 `false`（实测：`>=0.0.1-rc.5` 对 `0.1.5-rc.2` = false）⇒ 只抄声明会造出**假脱节**，也会漏掉真脱节 |
| **A6** | §8 只说"`git clone` 443 失败 ≠ 被墙" | 实测发现本机 `bash`（`D:\App\Git\bin\bash.exe`）**会吃引号**、PowerShell 管道**会毁二进制**（`git archive \| tar` 报 bad header checksum）⇒ 长命令一律走**脚本文件**、归档走 `--output=` 落盘再解 | 通道故障会伪装成被测对象故障（本项目通用纪律 3）；这两条是本次**新增**的坑，写下来省后人时间 |

---

### 1 检索账（通道 ＋ 检索式 ＋ 时间 ＋ 扫描量）

| 通道 | 用什么跑 | 检索式／动作 | 结果与扫描量 |
|---|---|---|---|
| **C1 本机官方包扁平层** | PowerShell | `Get-ChildItem <home>\profiles\sdk\node_modules\@deepseek-ai` 过滤 `compaction\|compact\|context`（两处 home） | 命中 **3 包 × 2 处**，版本均 `0.1.5-rc.2`、`license` 均 `MIT`；`dsh-compaction-basic/package.json` 的 **sha256 两处相同**（`9988B626…EEC9100`）⇒ **同源** |
| **C2 上游主仓（裸仓）** | `git -C ref/dsh-bare` | `ls-tree -r --name-only dsh-v0.1.5-rc.2 packages/compaction/` ／ `show <tag>:<path>` ／ `archive --output=` 抽树 | `packages/compaction/` = **50 文件**（含 **11 个 `*.spec.ts`**）；另抽 **2 篇 Agent Note**（134 ／ 110 行）＋ **`docs/subsystems/compaction.md`（193 行）**。tag → commit `fb2c4b9e698e30edb738bca4cf0618587db7d203` |
| **C3 本机社区落位区** | PowerShell | `Get-ChildItem ref/community` → 12 目录 | 与 T1–T6 相关 **2**（`aerince__dsh-active-context-pruning` ／ `giter00__dsh-headroom`）—— ⚠️ **规格 §6③ 登记为「本地落位 = —，尚未拉取」⇒ 该条已过期** |
| **C4 本机名录** | Grep | `ref/awesome-dsh-plugin.md`（3,386 行）；关键词分别计**行数**：`compact` 62 ／ `compaction` 37 ／ `prune` 4 ／ `pruning` 5 ／ `token` 233 ／ `summar` 79 ／ `budget` 31 ／ `window` 202 ／ `context` **155** | 逐条读描述 **≈56 条**（Grep 输出 60 行，其中 4 行超长被工具省略）<br>⚠️ **与规格 §6④ 登记的「关键词命中 458 条」对不上**（我口径＝含 `context` 的**行数** = **155**）。口径未在规格里给出 ⇒ **如实报差异，不替它圆** |
| **C5 GitHub** | `git` | `ls-remote` 通道验证 1 次；`clone --depth 1` **8 件** | **7 成功 ／ 1 失败**：`songoao25/dsh-auto-compact` → `Repository not found`（名录里的**失效件**，样本极小但如实记） |
| **C6 npm registry** | node `https` | `GET registry.npmjs.org/@deepseek-ai%2Fdsh-compaction` | **HTTP 200（952 ms）** ⇒ 通道可用（本次未用它做候选发现，仅验通道） |
| **C7 社区目录站** | node `https` | `GET deepseek-harness-plugin.com` | **HTTP 200** ⇒ 可达（本次未深挖，见 §6 边界） |

**通道前提（规格 §8）复核**：
- 全局 git 代理 = `socks5://127.0.0.1:7890`；env 无 `http_proxy`／`https_proxy`。
- ⭐ **实测「用代理」与「绕代理」两种姿势都通**（`ls-remote` 双双 exit 0）⇒ 规格 §8 记的"本机代理**不在运行**、`clone` 报 443 失败"**今日不成立**。**前提已变，勿照抄。**

**新踩的两个通道坑（本次新增，供后人）**：
1. `bash.exe -lc "<带引号的命令>"` 在本机**会吃引号**（内层 `"` 被剥掉 ⇒ bash 语法错）⇒ 长命令走**脚本文件**（我用了 `_run11.sh` 式做法）。
2. PowerShell 管道**会毁二进制**：`git archive <tag> <path> | tar -x` ⇒ `tar: Damaged tar archive (bad header checksum)`（重试刷屏）⇒ 必须 `git archive --output=<file>.tar` 落盘再 `tar -xf`。

**时间锚**：`2026-09-23 17:50:49`（落位区创建）→ `17:56:30`（收尾）；产物 mtime 可复算。
**落位件 HEAD（复算用）**：`dsh-argp b2a861a7` ／ `context-pruner 9fcef3da` ／ `dsh-dcp 04dc4690` ／ `dsh-compaction 7a752307` ／ `premise-guard 2161842c` ／ `session-handoff 46ae6b58` ／ `dsh-force-compact 7ac1858e` ／ `aerince/acp d52b5f2a` ／ `giter00/headroom ca5de630`。
**抽取命令原文**：`git -C ref/dsh-bare archive --format=tar --output=D:\Code\_trae-evidence\34r\compaction.tar dsh-v0.1.5-rc.2 packages/compaction` ＋ `tar -xf … -C D:\Code\_trae-evidence\34r\upstream`

---

### 2 候选表

> ⚠️ 为可读性拆成**两张同键表**（identifying ／ qualitative），**候选 键一致 ⇒ 仍可合并**；字段与规格 §3 一一对应，无遗漏、无自造字段。

**2-a 标识与判定**

| 候选 | 类型 | 入口 | LICENSE | 锚版本（＋判据） | 最后更新（取自何处） | 命中 | 分档 | 证据等级 |
|---|---|---|---|---|---|---|---|---|
| `@deepseek-ai/dsh-compaction` | 官方包 | 本机 `…\@deepseek-ai\dsh-compaction-basic` 同族；上游 `packages/compaction/compaction/src/{index,types,checkpoint,tool-pairing,invariant}.ts` | MIT（`package.json.license`） | **0.1.5-rc.2**（`package.json.version` @tag `dsh-v0.1.5-rc.2`） | tag commit `fb2c4b9e`（`git rev-parse <tag>`） | **T1** | **A** | 🟢 |
| `@deepseek-ai/dsh-compaction-basic` | 官方包 | 本机 `~/.dsh` ＋ `.dsh-home`（同源 sha256）；上游 `packages/compaction/compaction-basic/src/*.ts` | MIT | **0.1.5-rc.2**（同上；⚠️ 其 `peerDependencies` 全是 `workspace:^` ⇒ **不可作锚版本判据**） | tag commit 同上 | **T2 ／ T3 ／ T4 ／ T6** | **A** | 🟢 |
| `@deepseek-ai/dsh-compaction-tool-result-pruner` | 官方包 | 本机同上；上游 `…/compaction-tool-result-pruner/src/index.ts` | MIT | **0.1.5-rc.2** | 同上 | **T2 ／ T3 ／ T6** | **A** | 🟢 |
| `@deepseek-ai/dsh-command-compact` | 官方包 | 本机同上；上游 `…/command-compact/src/index.ts` | MIT | **0.1.5-rc.2** | 同上 | **T4** | **A** | 🟢 |
| **上游主仓** `deepseek-ai/deepseek-harness` | 上游主仓 | `ref/dsh-bare`（裸仓）@`dsh-v0.1.5-rc.2`：11 个 spec ＋ 2 篇 Agent Note ＋ `docs/subsystems/compaction.md` | MIT（仓根 `LICENSE`） | **0.1.5-rc.2**（tag） | commit `fb2c4b9e` | **T1 ／ T2 ／ T5 ／ T6** | **A** | 🟢 |
| `aerince/dsh-active-context-pruning` | 社区件 | `ref/community/aerince__dsh-active-context-pruning`（HEAD `d52b5f2a`）；`index.js:50,230` | MIT | ⚠️ **读不出**（`peerDependencies` **为空**）⇒ 🔴 待核；但 `index.js:51` 硬要求 `ctx.compaction.compactRegion` ⇒ **锚官方 seam** | 2026-08-15（`git log -1`） | **T2 ／ T3** | **B**（锚版本 🔴） | 🟢（源码 484 行 3 文件） |
| `giter00/dsh-headroom` | 社区件 | `ref/community/giter00__dsh-headroom`（HEAD `ca5de630`）；`lib/`＋`scripts/`＋`tests/` | Apache-2.0 | ⚠️ 声明了显式范围，但**严格 semver 不接纳我方 `0.1.5-rc.2`**（实测，见 §4）⇒ 🔴 | 2026-08-24（`git log -1`） | **T3 ／ T6** | **A**（T3 强命中；锚版本 🔴） | 🟡（我读了 README ＋ 元数据，**未深读 701 行 `compress.js`**） |
| `fan56/dsh-dcp`（包名 `@aiwayds/dsh-dcp`） | 社区件 | `D:\Code\_trae-evidence\34r\community\fan56__dsh-dcp`（HEAD `04dc4690`） | MIT | **`>=0.1.5-rc.2`**（判据：`package.json.peerDependencies` **＋** README 明写"要求 dsh >= 0.1.5-rc.2…不再支持 alpha 线"）⇒ **正锚我方版本** | 2026-09-22（`git log -1`） | **T2 ／ T3 ／ T6** | **A** | 🟢 |
| `JohnXu22786/context-pruner`（包名 `dsh-context-triage`） | 社区件 | 同上目录 `JohnXu22786__context-pruner`（HEAD `9fcef3da`）；`engine-host.ts` | MIT | `@deepseek-ai/dsh-compaction@>=0.0.1-rc.5`（宽范围，**含预发布歧义**）⇒ 🔴 待核 | 2026-08-16 | **T1 ／ T2 ／ T3** | **A** | 🟢（读 `engine-host.ts` 命中行） |
| `yoza10635/dsh-argp` | 社区件 | 同上目录 `yoza10635__dsh-argp`（HEAD `b2a861a7`）；`decision.js`／`flush.js` | MIT | ⛔ **`@deepseek-ai/dsh-agent@^0.1.7-alpha.2`**（判据：`peerDependencies`）⇒ **高于我方** | 2026-09-23（`git log -1`，**当天仍在提交**） | **T3 ／ T6** | **A**（借鉴点强，但 ⛔ 版本不符） | 🟢（命中行级） |
| `snow-The/dsh-session-handoff` | 社区件 | 同上目录（HEAD `46ae6b58`）；`index.js:12,855` | MIT | ⚠️ **读不出**（**无 `peerDependencies`**）⇒ 🔴；但硬要求 `ctx.compaction.compactRegion` | 2026-09-20 | **T2 ／ T3** | **B** | 🟢（命中行级） |
| `ljsysfurryACE/dsh-compaction`（包名 `@agentframe/dsh-compaction`） | 社区件 | 同上目录（HEAD `7a752307`） | ⚠️ **仓根无 LICENSE 文件**；`package.json.license = GPL-3.0` | `@deepseek-ai/dsh-compaction@>=0.1.0`（含预发布歧义）⇒ 🔴 待核 | 2026-08-15 | **T2 ／ T3** | **B** | 🟢（`index.d.ts` 命中行级） |
| `ICCuse/dsh-premise-guard` | 社区件 | 同上目录（HEAD `2161842c`）；`index.ts:22-24` ＋ 自带 `dsh-premise-guard.spec.ts` | MIT | 读不出（peer 只有 `cordis`／`schemastery`）⇒ 🔴；代码 append `compaction/start` ⇒ 锚 seam | 2026-08-14 | **T5 ／ T6** | **B** | 🟢（命中行级） |
| `falling-ts/dsh-force-compact` | 社区件 | 同上目录（HEAD `7ac1858e`） | MIT | ⛔ **`@deepseek-ai/dsh-*@>=0.1.7-alpha.1`**（判据：`peerDependencies`） | 2026-09-23 | **T4 ／ T2 ／ T6** | **B**（版本不符） | 🟡（仅元数据 ＋ 命中行） |

**2-b 质量栏**

| 候选 | 借鉴点（具体到可抄什么） | ⛔ 不可参考 | 它怎么验的 | 备注 |
|---|---|---|---|---|
| `dsh-compaction`（契约） | ① Provider 的**替换点**＝「子类化 `CompactionEngine` ＋ 一个实现随 context 装载为 `ctx.compaction`」；② 三方法语义分工：`compactIfNeeded(自动)`／`compactNow(按需·空闲)`／`compactRegion(指定范围·程序化)`；③ 替换产物必须用 **`compactCheckpointSource(compactionId)`** 作 source，消费者用 `isCompactCheckpointSource()` 认它 ⇒ **我们验"摘要注入"应断言这个 source，而不是猜文本** | 类**不可复用**（是 abstract Service，非工具函数） | 自带 `compaction.spec.ts`(171 行)＋`invariant.spec.ts`(469 行)：注册成 `ctx.compaction`／dispose 后注销（HMR）／三方法存在／`compaction/*` 只入日志不入 surface／取消信号透传 | `packages/compaction/compaction/README.md` 明写「**Human command, not a model tool**」⇒ **无模型可见的压缩工具** |
| `dsh-compaction-basic` | ① ⭐ **T3 权威答案**：`retainRatio` 默认 **0.16**（"新版 16% verbatim"）＋ `thresholdRatio` 默认 **0.8**，`retainTokens = floor(contextWindow × ratio)`；② 范围选择 `selectCompactableRange`：**从尾部反向累加**到 ≥ retain ⇒ 压前面、**留尾部原文**，且**从不切开 tool-call/result 对**；③ **尾部保留**之外还有"**system head 永不入范围**"；④ 摘要调用是 `ctx.llm.stream()`，**把对话前缀原样重放 ＋ 指令作为最后一条 user** ⇒ 复用 provider 前缀缓存（省成本）；⑤ 摘要框 `<compacted-summary>`；⑥ 截断＝**抛错**（`MAX_TOKENS`，fail-closed，不会静默注入半截摘要） | 直接照搬它的 policy 数值不适用（我们 1M 窗口） | `compaction-basic.spec.ts`(2138 行)＋`manual-compaction.spec.ts`(889 行)＋`compaction-loop-repro.spec.ts`(505 行)＋`loader-composition.spec.ts`；**断言层面＝session surface／`compaction/*` 事件（`shadowedSeqs`／`shadowedRange`／`summary`），不验摘要文本** | README 声称的默认值与源码**逐一相符**（.8／.16／8192／1）⇒ 本件 README 可信 |
| `dsh-compaction-tool-result-pruner` | ① **model-free 先手**：`pruneSession()` 在摘要**之前**跑，可能**直接让压缩不需要摘要**；② 切片按 **Unicode code point**（不切 surrogate pair）；③ 剪掉的中段插 `PRUNE_MARKER`；④ 每次替换前**紧邻** append `compaction/prune` shadow-price 事件 ⇒ 消费者无需留存逐节点价 | 与我们"保原文"目标**相反**（它是丢中段保头/尾） | `tool-result-pruner.spec.ts`(280 行)：code point 边界、marker 落位、`charsAfter < charsBefore` 且 ≤ threshold 的自证 | 它是**可选**兄弟服务（`ctx.get('toolResultPruner')`），basic 不依赖它 |
| `dsh-command-compact` | ⭐ **T4 最直接的答案**：`/compact` ⇒ `ctx.compaction.compactNow(...)`；而 `compactNow` 内部用 **`selectCompactableRange(session, measurement, 0)`（retain=0）** ⇒ **不灌历史也能一次压到位** | — | `command-compact.spec.ts`(280 行)＋`loader-composition.spec.ts`：经**真实 Loader 组装**的命令面发现并执行 `/compact` | 参数带内容 ⇒ 回 USAGE；`busy`／`cancelled`／`changed`／`summary`／`commit`／`persistence` 六类失败各有文案 |
| 上游主仓 | ① **`docs/subsystems/compaction.md` 是由源码生成、且有 `verify-cordis-catalog` 防漂移** ⇒ 可作 🟢 引用；② 两篇 Agent Note（`2026-06-18-compaction-capability-seam` 134 行／`2026-07-30-queued-manual-compaction` 110 行）是**设计动机与排队语义**的一手出处 | 主仓整体体量巨大，不宜整树参考 | 11 个 spec 覆盖 seam／invariant／region／pruner／command／loader 五层 | 我另存了两篇 Note 于落位区，可离线复读 |
| `aerince/dsh-active-context-pruning` | 用 `ctx.compaction.compactRegion(start, end, agent, signal)` 做**模型自定**的选择区间 ⇒ 展示"**不用 Provider 位、只借 seam 的 `compactRegion`**"这条路 | 无 peer 声明 ⇒ 版本不敢保证；**未实跑** | 无测试文件（机械核：0） | 与 `snow-The/dsh-session-handoff` 的 `acp_*` 同题 ⇒ **疑似同源/同思路的两件**，建议 WB 合并考察 |
| `giter00/dsh-headroom` | ⭐ **T3 的另一条路**：不在 surface 上保值，而是**挂 `tools/post-execute` 在结果物化前压缩**，**有损压缩的原文全部进本地 CCR store ＋ 摘要里注入短 marker**，模型需要精确原文时调 `headroom_retrieve(id=…)` **逐字节取回** ⇒ 对"近文原文保留"给出**外部 store ＋ 回取工具**的对照方案 | 不锚官方 compaction seam（机械核：seam 命中 **0**）⇒ 与官方 pruner **同题异路**；版本信号 🔴 | `tests/` 2 文件 448 行（`compress.test.js`／`kompress-onnx.test.js`） | 名里带 `headroom`，名词录里另有 `WODE25500/dsh-token-headroom`（**不同 owner**）⇒ 注意**同名不同件** |
| `fan56/dsh-dcp` | ⭐ **T2 的教科书样本**：`class DcpEngine extends BasicCompactionEngine` ＋ **只 override `summarize(input, agent, signal)`** ⇒ **实证了官方注释「summarize() is the sole subclass customization hook」**；且**继承官方全部安全机制**（触发／保留尾巴／事务锁／tool-pairing）⇒ 说明"我们的 Provider"最小改动面就是这一个方法 | 其"零 LLM 摘要"与我们要"摘要含 nonce"的判据**不冲突但不同路**（它不产可校验文本） | `tests/` 9 文件 **1671 行**（社区件里测试密度最高之一） | README 明写**只跟随 RC/stable 线、不支持 alpha 线** ⇒ 与本报告 §4 的分叉格局互证 |
| `JohnXu22786/context-pruner` | ① `engine-host.ts` 明确"把分诊引擎**接入 dsh 的压缩能力接缝**"，摘要走 `compaction/start → compaction/summary`；② **确定性抽取式摘要（无模型调用）**；③ 自带"**未闭合压缩事务**（`compaction/start` 无配对 `end`）"的检查 ⇒ 这是我们做"压缩中/失败态"观测可直接抄的形状 | 包名与名录名不一致（`dsh-context-triage` vs 名录写 `context-pruner`）⇒ 别按名录名找包 | `tests/` 15 文件 1447 行 | 中文注释 ⇒ 参考成本低 |
| `yoza10635/dsh-argp` | ⭐ **T3 最可抄的一条**：`decision.js:238-256` 从原文抽出 `infoSpans`（**必保信息跨度**）→ 生成 `verbatimInfo` → 压缩候选与它比对 `fidelityGuard(verbatimInfo, candidate)` 得到 `missing` → 再算 `hlsRepairEconomics` ⇒ **"verbatim guard"＝先声明必保跨度、压缩后做保真校验**。另：它**不占 `ctx.compaction` 位**，而是普通 cordis 服务 + 自己 append `compaction/start`／用 `compactCheckpointSource` | ⛔ **peer 要求 `^0.1.7-alpha.2`** ⇒ 与我方 `0.1.5-rc.2` **不兼容（声明层，实测）**；且 **182 文件 ／ 43952 行**，参考成本高 | `tests/` **43 文件 ／ 11266 行**（本批最重） | 当日（09-23）仍在提交 ⇒ **活跃** |
| `snow-The/dsh-session-handoff` | 用 `ctx.compaction.compactRegion` 做"活动上下文压缩"，并**自述官方 `compactRegion` 只接受配对平衡范围** ⇒ 与官方源码 `toolPairingBalanced*` 一致（**交叉验证成立**） | 无 peer 声明；体量 6189 行，含大量 handoff 业务（与 3.4 无关） | `tests/` 17 文件 1447 行 | 与 `aerince` 同题（`acp_*`） |
| `ljsysfurryACE/dsh-compaction` | 展示"**把 LLM 摘要整环换掉**"（确定性语义抽取器，保 code/paths/commands）＋ **28.4× KV 压缩记账** | ⛔ **GPL-3.0**（仓根无 LICENSE 文件，仅 `package.json` 字段）⇒ **只可读思路，⛔ 不可抄代码**（传染性） | `tests/` 1 文件 59 行（近乎无） | `index.d.ts` 显示它 `extends CompactionEngine` 并实现三方法 ⇒ 另一条"占位"路 |
| `ICCuse/dsh-premise-guard` | ⭐ **T5 的第三方装置**：**压缩后检查摘要是否丢了"关键 literal anchor"**，丢了就注入一次性提醒 ⇒ 这正是我们"nonce 校验"的**外部先例**（它验的粒度＝字面锚点，比 nonce 更通用） | peer 读不出锚版本 | 自带 `dsh-premise-guard.spec.ts`（`tests/` 2 文件 210 行） | 小（962 行）、聚焦 ⇒ **参考性价比高** |
| `falling-ts/dsh-force-compact` | ① "低上下文模型下**强制压缩**"＋**精修过的 compaction prompt**（与我们 T2 的 prompt 设计同题）；② 走 **engine 的 idle manual 入口 `compactNow`**（源码注释原文） | ⛔ `>=0.1.7-alpha.1` | 测试文件 **0** | 8240 行；UI 与设置面板占大头 |

---

### 3 评论（**观察**与**评论**分开写）

**3.1 观察（带证据）**

- **O1** 官方契约的三方法分工**在源码与文档两处一致**：`compactIfNeeded`／`compactNow`／`compactRegion`（`compaction/src/index.ts:113-169`；`docs/subsystems/compaction.md` §The service）。
- **O2** T3（"压了但近文原文保留"）**在官方是"尾部按 token 预算 verbatim 保留"**：默认 `retainRatio = 0.16`，`selectCompactableRange` 从尾反向累加到阈值，且**不切 tool 对**（`compaction-basic/src/config.ts:23`、`region.ts:132-154`）。
- **O3** T4（一轮内逼出）**有确定路径**：`/compact` → `compactNow` → `selectCompactableRange(..., 0)`（`command-compact/src/index.ts:66` ＋ `compaction-basic/src/index.ts:380-384`）。
- **O4** 「摘要注入」有**机器可认的指纹**：替换的 `user/message` 用 `compactCheckpointSource(...)`，正文被 `<compacted-summary>` 标签包裹（`summarizer.ts:21-22,186-192`）⇒ 不必猜文本。
- **O5** 官方**不把压缩暴露成模型工具**（`compaction/README.md` 原文「Human command, not a model tool」）。
- **O6** 官方测试**只断言 surface／事件层**，不验摘要文本内容（11 个 spec 的标题面，见 §2-b）。
- **O7** 社区件里**至少 4 件**明确用官方 seam：`dsh-dcp`（extends basic）／`context-pruner`（接 seam）／`aerince`＋`session-handoff`（`compactRegion`）／`argp`（`compactCheckpointSource` ＋ 自 append 事件）。
- **O8** 名录计数与规格登记不一致：`context` 行数 **155** vs 规格写 **458**（口径未知）。
- **O9** 名片式发现通道的**失效样本**：8 抽样里 1 件仓库已不存在（`songoao25/dsh-auto-compact`）。
- **O10** 名录里存在**同名不同件**：`giter00/dsh-headroom`（已登记）vs `WODE25500/dsh-token-headroom`。
- **O11** ⚠️ 规格 §6③ 与 §6④ 的两处登记**已过期**：两件社区件**已在本地**；名录实际条目远多于 2 件相关。

**3.2 评论（标注为评论）**

- **C1（评论）** 3.4 的 T1／T2／T3 三问**其实都不依赖社区**：官方把契约、默认策略、范围选择、摘要框都给了，且**源码与生成式文档互相防漂移**。⇒ 我建议 3.4 的**主借鉴对象定为官方三件**，社区件按"补哪一格"定位：**`dsh-dcp` 补 T2（最小改动面）／`premise-guard` 补 T5（校验姿势）／`argp` 的 `infoSpans + fidelityGuard` 补 T3（保真校验）**。
- **C2（评论）** `giter00/dsh-headroom` 值得**单独深读**：它是"**外部 store ＋ 逐字节回取**"的**另一条路**，与官方"尾部 verbatim"正交。若 3.4 的判据只认"surface 上留原文"，会把这条路**误判为不合格** ⇒ 建议 WB 在汇总时明确判据口径（**留 surface 还是可回取**）。
- **C3（评论）** 本批社区件的**版本信号是分裂的**（详见 §4）：既有"只跟随 RC 线"（`dsh-dcp`），也有"要求 0.1.7-alpha 线"（`argp`／`force-compact`）⇒ **"社区红利"不是单一方向**，不能一句话结论。
- **C4（评论）** `ljsysfurryACE/dsh-compaction` 的 **GPL-3.0** 是本次唯一的**许可红线**：其思路（确定性抽取代替 LLM 摘要）可读，但**代码不可抄**。建议在登记表 3.4 行明确写死"⛔ 因许可不可参考"。
- **C5（评论）** `aerince/acp` 与 `snow-The/session-handoff` 的 `acp_*` 描述高度重合 ⇒ 我在**不读他人报告**的前提下只能给"**疑似同源，建议合并考察**"，**不下结论**（我无法排除一个派生自另一个）。
- **C6（评论）** T5 我们**不必从零设计**：官方"断言在 surface／事件层"＋`premise-guard`"压缩后查字面锚点丢失"两条合起来，已能覆盖我们判据的三要素（摘要注入／近文保留／nonce 可查）。
- **C7（评论）** 规格 §6④ 让扫的 5 个分类里，真正有 compaction 相关件的**不在** `Sessions & Messages`／`Memory`，而主要落在 **`Development & Runtime`（2705+）** 与 `Usage & Billing` 一带（按行号看，compaction 相关条目集中在 1040–1530 区间）。⇒ **下批可省掉前几个分类的盲扫**。

---

### 4 版本脱节判断（**单列给老大** —— 规格 §5-5 明文要求）

> 口径前置（**重要**）：以下全是 **`peerDependencies` 声明层**的判定，用 `semver@7.8.5` **实跑** `satisfies()`；**不是**运行时兼容结论（本任务**禁止试装**）。
> ⚠️ **预发布语义会造出"看起来该兼容却判 false"**：`>=0.0.1-rc.5` 对 `0.1.5-rc.2` 实测 **false**（`includePrerelease:true` 才是 true）⇒ **不得只凭"范围看起来包含"就下脱节结论**。

| 件 | 声明范围（peer） | 我方 `0.1.5-rc.2` 满足？ | 含义 |
|---|---|---|---|
| `fan56/dsh-dcp` | `@deepseek-ai/dsh-*@>=0.1.5-rc.2` | ✅ **true** | **正锚我方版本**；README 亦明写"不支持 alpha 线" |
| `JohnXu22786/context-pruner` | `@deepseek-ai/dsh-compaction@>=0.0.1-rc.5` | ❌ false（`includePrerelease` ⇒ true） | **预发布语义伪脱节**，实为"宽兼容" |
| `giter00/dsh-headroom` | `>=0.0.1-rc.5 <0.1.0 \|\| >=0.1.0-rc.1 <0.2.0-0` | ❌ false（`includePrerelease` 亦 false） | 作者**大概意在以 `0.1.x` 覆盖我方**，但 semver 预发布规则不认 ⇒ 标 🔴 |
| `yoza10635/dsh-argp` | `^0.1.7-alpha.2` | ❌ **false** | **真脱节**：要求**高于**我方 |
| `falling-ts/dsh-force-compact` | `>=0.1.7-alpha.1` | ❌ **false** | **真脱节**：要求**高于**我方 |
| （对照）`@deepseek-ai/cordis` | `>=4.0.1-rc.4 <4.1.0 \|\| >=4.1.0-rc.1 <5.0.0-0` | ✅ **true**（本机 cordis = **4.0.2**，实测） | 框架层无脱节 |

**判断（评论）**：社区**已经分叉**——一部分件锚 **RC/stable 线（`0.1.5-rc.2`）**，另一部分已跑到 **`0.1.7-alpha` 线**。
⇒ **风险不是"社区普遍要求高于我方"（那会让社区红利整体失效），而是"红利集中在两条线中的一条"**：3.4 若锚 `0.1.5-rc.2`，则**能用的社区件是 `dsh-dcp` 那一支**（外加若干宽范围件，但需按 §4 口径逐一实跑，**不可凭范围字面**）。
⇒ **建议**：**不要**把 `0.1.7-alpha` 线的件计入可用池；**也不要**因为 semver 判 false 就把宽范围件一票否决（先按上文口径复核）。

---

### 5 C 档线索（相关，但**未落位** ⇒ G1／G2 **未判**，只登记一行）

> 全部来自名录 `ref/awesome-dsh-plugin.md`（口径见 §0-A1）；**未克隆、未读源码** ⇒ ⛔ 不得当作依据。

| 线索 | 名录行 | 为什么相关 |
|---|---|---|
| `Icstick/dsh-context-maid` | 1128 | "content-aware tool-output slimming ＋ **pinned user requirements and in-flight work** ＋ archive-then-compact with audit trail"（T3 语义接近） |
| `GooDAnDReaDY/dsh-context-lens` | 1521 | AST 压缩 ＋ **token budget guard**（T3／T6） |
| `WODE25500/dsh-token-headroom` / `WODE25500/dsh-token-rtk` | 2280／2281 | 分层压缩与输入冗余剪枝（**与 `giter00/dsh-headroom` 同名不同件**） |
| `dsh-plugins/dsh-auxiliary` | 1492 | **compaction 专用模型路由**（T6 成本） |
| `zhubaohi/dsh-qwen38-compaction-fix` | 1044 | 关掉 compaction／session-title 的 thinking 以免烧光输出预算（**T6 成本坑**） |
| `shyuan-hub/dsh-compact-button` | 466 | 从 UI 经命令通道提交 `/compact`（T4 触发面） |
| `GreenLv/dsh-completion-guard` / `ICCuse/dsh-file-memory` / `863683348/dsh-plugin-focus` / `zhaoyuntao-wl/dsh-plugin-thread` | 2994／1308／1270／1409 | "跨 compaction 不丢关键约束"的一族（T3／T5 语义） |
| `yamingmou/dsh-retrace` | 1247 | 明写"rewinds … never break `/compact`"（T6 兼容性） |
| `orziz/odai#odai-dsh-plugin` | 2422 | **明确写"compatible with DSH 0.1.1-rc.2"** ⇒ 是一条**显式锚版本**的样本（低于我方） |
| `songoao25/dsh-auto-compact` | 1379 | ⛔ **落位失败：仓库不存在**（G2 无实现）⇒ **D 档** |

**D 档（出局）**：`songoao25/dsh-auto-compact`（仓库不存在）；`ljsysfurryACE/dsh-compaction` 的**代码**（GPL-3.0 ⇒ 思路可读、代码不可抄，已在 §2-b 标注）。

---

### 6 反纪律自检 ＋ 诚实边界

**反纪律（§5 六条）逐条自检**
1. **不编**：所有"读不出"一律写 **🔴 待核**；名录计数与规格不一致处**只报差异不下推论**；`plugin.com` 可达但**我承认未深挖**（不假装扫过）。
2. **星标／热度不作为理由**：本报告**一个 star 数都没引用**。
3. **不采信二手转述**：官方 5 件＝🟢 实读源码；社区 9 件里 **7 件读了实现代码**（命中行级），**2 件（`headroom`／`force-compact`）只到 README ＋ 元数据 ⇒ 标 🟡**。
4. **提交前未翻阅其他 AI 的交流区** —— 已履行（见报告抬头）。
5. **版本脱节已单列**（§4）。
6. **通道 ＋ 时间已注明**（§1）。

**诚实边界（没验的东西）**
1. **未装任何候选件**（连 `dsh plugin add` 试装都没有）⇒ **所有"能不能用"都只到"声明层"**，没到运行时。
2. **`plugin.com` 目录站只验了 200**，未做站内检索 ⇒ 该通道**产出为 0**，不是"没有件"。
3. `giter00/dsh-headroom` 的 **701 行 `compress.js` 未读** ⇒ 其"逐字节回取"只到 README 级（🟡）。
4. `yoza10635/dsh-argp` 的 `infoSpans`／`fidelityGuard` 我只读了**命中行与邻域**，未通读其 43 个测试如何验保真度。
5. **semver 判定只覆盖 6 个范围**（§4）；其余社区件（如 `ljsysfurryACE` 的 `>=0.1.0`、`premise-guard`／`aerince`／`handoff` 的无 peer）**未实跑**，标 🔴 待核而非结论。
6. 名录条目**只逐条读了描述**，未对任何名录条目做落位 ⇒ §5 全是线索，**不得进入结论区**。
7. `~/.dsh` 与 `.dsh-home` 我比的是 `dsh-compaction-basic/package.json` 的 sha256（**同源**），**未逐文件比对整包**。

---

## �� 已清理段落（按交流区规矩）

- **2026-09-22 清理**：删除 4 段已闭环内容（`DSH-3.8.2 派发稿`／`DSH-3.8.1 派发稿`／`DSH-3.8.1 回报`／`DSH-3.8.2 回报`，含《附 · WB 2026-09-22 重测前提实录》）—— **判据 ／ 边界 ／ 遗留的权威落点 = `TODO.md`「DSH-3.8」段**（一处两面）。回溯：`git log -p -- exchange/log-trae.md`。

---
