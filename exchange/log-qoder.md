# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---


## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.5 · `(b)`** | Qoder | CVM（Linux ／ `49.232.129.252`） | ✅ **已回报 ＋ 已复核（WB 2026-09-22，CVM 现场独立取证）**；⭐ **§2-P2 两条待裁同日由老大裁 (A) 并执行完毕**（① `profiles/acp` 一并删 → `acp.bak.20260922-1007`；② `explicit` 分支退役改脚本 `ba3e42e`，双侧 sha256 一致 ／ 纯 LF）⇒ 判定全文 = `archive/roadmap-history.md` 的 `##### DSH-3.7.5` | 2026-09-22 |
| **DSH-3.4-R** | Qoder | 本机（联网检索 · 只读参考） | ✅ **已回报（2026-09-23）＋ 补遗（npm 通道）＋ 🔀 融合轮（2026-09-28）** —— 三段同在此文件（报告 ／ 补遗 ／ 融合轮） | 2026-09-23 |

- **判据、边界与遗留的权威落点 = `archive/roadmap-history.md` 的 `##### DSH-3.7.5`**（**一处两面**；`TODO.md`「待派发」段只留 `(c)` 待裁活条目 ＋ 指针）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯用 `git log -p -- exchange/log-qoder.md`。
- ⭐ **派发前重测前提（WB 2026-09-22 · ssh(Bash) 通道实测）** ⇒ **3 条新事实 ／ 缺口**⇒ 摘要 ／ 权威落点 = `archive/roadmap-history.md` 的 `##### DSH-3.7.5`「⭐ 派发前重测前提」条（2026-09-30 随其闭环由 `TODO.md` 迁入 archive）。
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.3 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  3. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  4. **收尾必核现场**（复核 ／ 取证动作自身也会改现场）。
  5. **工具输出的"原文"不得手工改写 ／ 意译**；但**工具链自身的语言 ／ 编码差异须原样保留**，并**注明该段取自哪条通道**。

---

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

- **建议侧重（非强制、不构成分工）**：你是文档一致性维护者 ⇒ 可优先把**名录 ／ 目录站的检索广度**与**版本脱节判断**做扎实；其余按规格走。不要求你猜别人扫了什么。

## ⏳ 未结项（待老大裁）

> **2026-09-30 全量巡检已逐条刷新**（上版 = 09-22）；新增 3 条标 🆕；第 10 条为当晚事件登记（非巡检项，详见文末〈事件记录〉段）。
> ⭐ **已消**（本轮核对确认）：TODO 精简「**第二刀**」（09-30 已由 A1 完成）；「3.4-T 状态行滞后」（已随 A1 压缩修正）。
> 详细证据 ／ 建议 ／ 合规对照见下方〈全量职责巡检报告（2026-09-30）〉。

1. **`docs/` 承接滞后批注 —— 仍 5 处（09-30 现状复核：仍未修）**：`docs/dsh/dsh-migration.md:796`（原 :740）／`docs/production-env.md:461`／`:512`／`:514`／`:529-531` 一带 —— 均为 `larry-dsh-home` ／ `explicit` 的**现在时**陈述，与"09-14 已改脚本、09-22 已退役＋删 profile"的现状不符。⛔ 建议**只加批注 ＋ 退役指向**（一处统一批注可覆盖五处，草样见巡检报告 §③-B）。
2. **上游路径与本仓库路径同名、写法无区分 —— 仍未修**（计数刷新：`docs/dsh` 内 `docs/subsystems/` **14 处**、`packages/…` 形态 **39 处**；另 `dsh-agents-md.md` 全文快照有 **39 处**上游链接形态）⇒ 建议统一加机制说明或显式前缀。
3. **稳定落点口径小差 —— 仍未统一**：`docs/README.md:20` 定三处（含 `TODO.md`）vs `exchange/README.md:30`「以 `docs/` 和 `archive/` 为主」（未含）。
4. **反引号路径「仓库根相对」惯例 —— 仍未入档**：建议 `docs/README.md` 加一句。
5. **`TODO.md` 精简**：第二刀 ✅（09-30）；**第三刀**（`DSH-3 · 贯穿规则` 迁 `docs/`）按原裁**等 DSH-3 完成后议**。
6. 🆕 **`docs/local-env.md:706` 活指针 1 处**：末句「实际跟踪点在 `exchange/log-claude.md` 的 `DSH-3.7.4-T·P` 块」——活区清理后会静默失活 ⇒ 建议改指 `TODO.md`（或注明"活区、以 TODO 为准"）。
7. 🆕 **`docs/dsh/README.md` 文件索引缺 `dsh-34-ref-research.md`**（52 KB；3.4-R 规格＋汇总）⇒ 建议补一行。
8. 🆕 **（提请规则层定）`docs/product-positioning.md` 4 处讨论稿引用**（`:265/:351/:410/:444` 指向 `exchange/` 下的稿）——`docs/README.md` 规则「只引用稳定落点」对"讨论稿"无明文 ⇒ 规则补例外或稿内加注，二选一。
9. 🆕 **Tier0 红线①「源短副长」＋ 派发稿凭据条款悬空**（2026-09-30 新增）：
   - **源短副长**（本区认领）：`docs/ai-governance.md:50`（**权威源头**）仍为**短版**（仅「…不受此限制。」，且无"正式"二字）；四份副本全为**长版**（含「允许任何形式的落盘…用完关闭该 Key」细则）：`.claude/CLAUDE.md:4` ／ `.trae/TRAE.md:4` ／ `.qoder/rules/QODER.md:8` ／ `.workbuddy/memory/MEMORY.md:5`。**根因**：09-10 的统一提交 `96871b4`（"三份 AI 规范/记忆同步"）**只改 3 份副本、未带源头**；`.qoder` 那份系 09-15 新建时自带新口径（`a803461`）；源头该行 `-S` 实查最近一次变更 = `bbd7c26`（DSH-2 期）后未再更新。⇒ **完整口径只活在副本里**（按源头同步会冲掉细则；新 AI 按源头抄只得短版）。**修法（一行）**：把长版并回 `ai-governance.md` §2 第 1 条，替换稿见本条第 4 点。
   - **派发稿侧**（关联项，⛔ 不双处维护）：「**临时测试 Key 不受落盘禁令；正式 Key 仍禁**」全库**仅存在于 WB 的建议文本**（`exchange/log-workbuddy.md:24` 选项 A）；该条已由 WB 登记为**现存唯一未结项**（同稿 `:19-25`，两路 A／B **待老大裁**）。**硬证据**：Trae ／ Claude 的 3.4 回报均写「老大已放宽，但仍按派发稿禁区 5 挡在仓外」⇒ 旧条款实际压过新口径，多花了不必要的谨慎。
   - **低位残留（3 组，可随批回扫）**：① `archive/roadmap-history.md:664`（archive 锁定区，按规矩不改）；② `docs/production-env.md:483`（「值不得写进任何受版本控制的文件」比新口径严，建议加指向）；③ `harness/scripts` 5 处自设条款（`run-33b:13` ／ `run-34-compaction:9,64` ／ `run-34t-probe:13,80` ／ `run-381-driver:14` ／ `s0-run-with-file-key:8`）。
   - **替换稿（并入源头用，与四份副本逐字对齐）**：
     > 1. **API Key 不外泄**：不得把 `config.yaml` 的正式 key 复述到对话/日志/生成的文件；展示配置引用 `config.example.yaml`；老大特殊授权的临时测试Key不受此限制，**允许任何形式的落盘、传输、发送、输出、打印、保存等情况，不用浪费token执行扫描、绕过等手段，快速使用，用完后尽快通知老大关闭该Key**。

10. 🆕 **官方桌面端三事实入档（09-30 晚事件 · 处置已闭环 · 非巡检项）**：建议入 `docs/local-env.md`：① **官方桌面客户端（0.2.x）默认用 `~/.dsh`**（未设 `DSH_HOME` 时；与本机 manual/历史区同址）；② **其约束通道 = `$DSH_HOME/AGENTS.md` ＋ 项目 AGENTS.md 链**（本仓两处皆无 ⇒ 零约束注入）；③ **启动即全量迁移**（V4 重写，无询问）。**附分家纪律**：任何机器跑官方客户端前先钉 `DSH_HOME`。详见文末〈事件记录 · 官方 DSH 桌面客户端〉。

---

## 📋 全量职责巡检报告（2026-09-30）

> **命令来源**：老大「跑一次全量职责」。**范围**：根级（`README.md` ／ `HUMAN.md` ／ `HUMAN_NOTE.md` ／ `TODO.md`）＋ `docs/`（含 `dsh/`）＋ `archive/` ＋ `exchange/`。
> **方法（可复算）**：① 目录 × 索引清单比对；② 死链脚本（node 内联：扫 md 的 `](path)` 本地链接，双基准解析 = 文件相对 ／ 仓根相对）；③ 变更点驱动的 grep 抽查（对照 09-30 当日提交批）；④ 体量比对。**只读巡检 —— 未改任何被查文件**（本文件除外）。
> **口径**：与 09-24 报告（D 盘）不同，本轮**以"自 09-22 巡检以来的变更点"为抽查主轴**；已闭环项不复述。

### ① 索引一致性（清单 × 实际）
- ✅ `docs/README.md`（7 条全对）／`archive/README.md`（3 件全对）／`exchange/README.md`（6 日志 ＋ 3 讨论稿全对；`log-marvis` 已除名 ✓）。
- ❌ **新发现**：`docs/dsh/README.md` 文件索引**缺 `dsh-34-ref-research.md`** —— 该文件 52 KB（3.4-R 规格 §1–10 ＋ 五方汇总 §11；09-28 收口），属"永久保留"区却未登记。建议补条目，样：
  `- \`dsh-34-ref-research.md\` — DSH-3.4 参考件调研（规格 ＋ 汇总）：§1–10 规则原文（硬闸门 ／ 反纪律 ／ 必扫区）；§11 汇总（候选池 ／ 通道对照 ／ 分歧点 ／ 版本观察 ／ 深读清单 Top14）。`

### ② 死链扫描（node 内联脚本 · 只读）
- 覆盖 **40 个 md**（根级＋`docs`＋`archive`＋`exchange`＋`harness` 等；排除 `node_modules` ／ `ref` ／ `.workbuddy` ／ 各证据目录）。结果：本地链接 **39 处**、"断" **39 处** —— **全部位于 `docs/dsh/dsh-agents-md.md`**，且**均为上游引文内的相对路径**（`docs/architecture.md` ／ `packages/README.md` ／ `.agents/…`）。
- ⇒ **不是本仓死链**，而是**「上游路径 vs 本仓同名无区分」的实例集中地**（并入下方未结项 2）。建议：该文件文首加一行机制说明（「文中路径均为上游仓（`ref/dsh-bare`）内路径，非本仓」）。
- 边界：本仓 markdown 链接形态本身极少（惯例用反引号路径 ⇒ 未结项 4）；本脚本只查 `](…)`，**不查反引号路径**（噪声过大，暂缓）。

### ③ 过期陈述抽查（变更点驱动）
**A. 今日已同步项（复核 ✓，无问题）**：A 落地落盘记录（`dsh-migration.md:957`「已追加 ✅ 09-30」＋备份名）｜Provider 观察项（`:1003` 靶子取消 ／ `:1005-1006` ⑦「已裁 …转入长期观察」）｜`dsh-src` 四处善后（`archive/roadmap-history.md:695` ／ `dsh-migration.md:726` ／ `local-env.md:384,425,435-436`，全带退役说明＋重建方式）｜TODO 3.4 段（L80-91 收口完备）｜「调研中」**零残留**｜「当前无条目」已订正（`dsh-migration.md:1193`）。

**B. 仍未修（09-22 遗项 · 现状复核）—— `larry-dsh-home` 相关 5 处**：
- `docs/dsh/dsh-migration.md:796`：「cvm-probes/*.sh **全部钉** `DSH_HOME=$HOME/larry-dsh-home`…照抄 = 无 key 假绿」——现在时；该形态 09-14 已参数化、`explicit` 分支 09-22 已退役。
- `docs/production-env.md:461`：同款「钉死此路径」（§12.5 表 "要填吗" 列）。
- `docs/production-env.md:512`：`cvm-step0.sh` 的 `explicit` 默认值描述（09-22 已退役 ⇒ 需批注）。
- `docs/production-env.md:514`：「降级为**负向对照器材**」——该定位**在 09-22 删 profile 之前就已不成立**（脚本已拒、器材本体已删）。
- `docs/production-env.md:529-531` 一带（附一之补）：表内 `~/larry-dsh-home/profiles/sdk` 行未标「已于 09-22 删除（→ `*.bak.20260922-*`）」。
- ⛔ 建议**统一批注草样**（一处可覆盖五处）：
  > ⚠️ **2026-09-22 后形态**：`cvm-probes/*.sh` 已参数化（`${DSH_HOME:-$HOME/.dsh}`）；`cvm-step0.sh` 的 `explicit` 分支已**退役**（显式拒绝 ＋ `exit 3`，`ba3e42e`）；`~/larry-dsh-home` 的 `sdk` ／ `acp` profile 已删（→ `sdk.bak.20260922-0948` ／ `acp.bak.20260922-1007`）⇒ 本节"钉死 ／ 器材"陈述均为**当时状态留痕**，勿再照抄。
- ⛔ 只加批注 ＋ 退役指向，**不改叙述本身**（`docs/` 属 AI 不动区 ⇒ 待老大裁 ／ 授权后执行）。

**C. 活指针 1 处（新）**：`docs/local-env.md:706` 末句「实际跟踪点在 `exchange/log-claude.md` 的 `DSH-3.7.4-T·P` 块」——**活区清理后会静默失活**。建议改指 `TODO.md`。
- 对照（合规范式，均带"已清理＋git 回溯"）：`dsh-015-capability-mapping.md:237` ／ `dsh-38-a-protocol-design.md:574` ／ `local-env.md:573` ／ `dsh-34-ref-research.md:182` ✓。

**D. 规则口径类（提请定夺，非错误）**：`docs/product-positioning.md:265/351/410/444` 指向 `exchange/` 下讨论稿（web-search-design ／ deployment-architecture ／ discussion-time-context）——`docs/README.md` 规则「只引用稳定落点」对"讨论稿"**无明文**；另 `ai-governance.md:255`（"开发前先读 log-trae ／ log_design"）属**行动指南例外**，合规。

### ④ 旧发现复核（`HUMAN.md`「Qoder观察到的问题」4 条 · 状态提醒）
- **#1「加模型零代码」不符 —— 未处置**：`README.md:145` 表述仍在（「可任意新增 … 无需改代码」）；抽查 `backend/models/llm.py:56` `_MODEL_PROVIDER_MAP` 仍为硬编码表、`:73` 抛错文案仍是 "Add it to …" ⇒ 现状与旧判**一致，提醒处置**（口径建议同旧：「加 provider 段零代码，加模型需登记一行映射」）。
- **#3（`server.host/port` 死配置）**：抽查 `uvicorn.run` 零命中 ／ `server.host|port` 零命中 ⇒ **与旧判一致（未变）**。
- **#4（`auth.py` 非恒定时间比较）**：`compare_digest` 零命中 ⇒ **未见按建议修改**。
- **#2（`config.example` 漂移）**：本轮**未逐条重验**（如需可下轮补）。
- （四条均在老大自有文件里跟踪；本区只做状态提醒，不重复建条目。）

### ⑤ 结构与精简判定
- `TODO.md`：09-30 一日两轮压缩 **93.6 KB → 70.9 KB（−24%）**（待派发段 −26%）⇒ **原「第二刀」已消**；「第三刀」仍按原裁等 DSH-3 完成后议。**本轮无新增精简提案。**
- 四区体量健康（`docs` 800K ／ `archive` 208K ／ `exchange` 300K ／ `TODO.md` 71K）；exchange 各日志无超载段；`docs/dsh/` 11 件全属「永久保留」区 ⇒ **无删除候选**；`archive/` 索引与实际一致。

### ⑥ 本轮边界
- 只读；未改任何被查文件（本文件除外）。未复核 `backend/` 与文档的**全面**一致性（仅按 HUMAN.md 旧发现抽查 3 条）；反引号路径未做存在性扫描（见 ②边界）。下轮可考虑：反引号路径全量扫描 ／ `config.example` 漂移复核。

@老大（②③④内所有建议**均未动手**，等你裁）。

---

## 🗂 已清理段落（按交流区规矩）

- **2026-09-22 清理**：删除 5 段（`DSH-3.7.5 派发稿` ＋ 其《附 · WB 重测前提实录》附录 ／ `DSH-3.7.5 回报` ／ `主职责巡检报告` ／ `TODO 精简专题报告`）—— 判据 ／ 边界 ／ 遗留 = `archive/roadmap-history.md` 的 `##### DSH-3.7.5`（2026-09-30 由 `TODO.md` 迁入 archive）；两份报告的**未裁建议**已提炼到上方「未结项」。回溯：`git log -p -- exchange/log-qoder.md`。

---
---

## DSH-3.4-R 调研报告

**状态**：已回报（2026-09-23）＋ 补遗（09-23 晚）＋ **融合轮（2026-09-28，见文末）** ｜ **执行**：Qoder（文档一致性维护者）｜ **规格**：`docs/dsh/dsh-34-ref-research.md`（逐条照执行）

### ⚠️ 先声明三条「流程调整」（老大已授权我可调整并须写明理由与改法）

**调整 A · 必须披露的事实（不是流程改动，但不写就是误导）**
规格 §12 内嵌了 **WB 自己的那份报告**，而派发稿要求我"逐条照规格执行" ⇒ **读规格必然看到 WB 的结论**。⇒ 本报告**不能**充当"同规则、异通道、互不影响"的第二次独立验证：**凡与 §12 重合的结论，只应记为 1 条通道，不是 2 条。**
**改法**：把重心移向 §12 自己声明"未做"的方向（拉源码读实现 ／ 目录站 ／ GitHub 侧），并在候选表里**逐条标注与 §12 的关系**。

**调整 B · 反转规格 §8 的代理做法（理由：前提已失效）**
§8 说"本机 git 全局配了**不在运行**的代理 ⇒ 要 `-c http.proxy= -c https.proxy=` 清掉"。**实测相反**：
```
$ git config --global --get https.proxy                            → socks5://127.0.0.1:7890
$ curl -sS -o /dev/null -w '%{http_code}' https://github.com        → http_code=000（直连不通）
$ git -c http.proxy= -c https.proxy= clone … /d/Temp/_p2            → EXIT=128 "Failed to connect to github.com port 443"
$ git clone --depth 1 … /d/Temp/_p1                                 → EXIT=0 ✅（用全局代理）
```
⇒ **代理在运行且是必需的**；清掉就出不去。**改法**：**保留全局代理、不加任何清除参数**。

**调整 C · 弃用我自己的包装（理由：它会静默吞输出）**
`timeout N env -u <VAR> <cmd>` 在本通道下**吞掉子命令全部输出**：
```
$ timeout 20 env -u https_proxy git --version   → （无输出）EXIT=0
$ timeout 20 git --version                      → git version 2.52.0.windows.1  EXIT=0
```
⇒ 我早期一次"clone 无输出 EXIT=0"的假象即由此造成（**不是网络问题、也不是 clone 行为**）。**改法**：用裸命令 ＋ `echo EXIT=$?`，**不接管道**（避免取到 `tail` 的退出码）。

### ① 检索账（可复算）

| # | 通道 | 动作 ／ 检索式 | 时间 | 扫描量 ／ 结果 |
|---|---|---|---|---|
| 1 | 本地 · 裸仓库 | §6② 三条路径可达性实测（`show` / `ls-tree`） | 09-23 | **3/3 可达** ✅ |
| 2 | 本地 · 官方包 | `ls -d *compaction*`（`~/.dsh/profiles/sdk/node_modules/@deepseek-ai/`） | 09-23 | 3 件在（basic ／ pruner ／ command-compact）；契约 `dsh-compaction` **不在**扁平层 |
| 3 | 本地 · 上游主仓 | `git show <tag>:packages/compaction/README.md` ＋ `packages/compaction/compaction/README.md` ＋ `ls-tree -r packages/compaction/compaction/` | 09-23 | 家族 README ＋ 契约 README 头部 ＋ 包树（含 **`src/checkpoint.ts`**、3 个 spec） |
| 4 | 本地 · 名录 | `ref/awesome-dsh-plugin.md`（3,386 行）；**只扫规格 §6④ 指定的 5 类**：Sessions&Messages(201) ／ Memory(149) ／ Usage&Billing(178) ／ Tools&Capabilities(425) ／ Dev&Runtime(254) = **1,207 条** | 09-23 | **宽扫 94 ／ 紧扫 54**（紧扫＝强相关词 ∧ 非 UI 噪音），**逐条读描述** |
| 5 | **联网 · 拉源码读实现**（§12 未做） | `git clone --depth 1`（带全局代理）两件已登记件 → `ref/community/` | 09-23 | **2 件落位**：`aerince__dsh-active-context-pruning`(8 文件) ／ `giter00__dsh-headroom`(25 文件)；实读 `index.js`(347) ＋ `lib.js`(119) ＋ headroom 的 manifest/hook 面 ＋ `tests/` |
| 6 | **联网 · 目录站**（§12 未做） | `deepseek-harness-plugin.com` | 09-23 | 可达；**333 plugins listed**；有 Memory ／ Sessions&Messages 分类；**无 compaction 专类**；**未见 summarization 插件**；见 `dsh-context`（观测面板） |
| 7 | **联网 · GitHub 方向搜索**（§12 未做） | WebSearch：「github dsh-plugin compaction context pruning DeepSeek Harness plugin」 | 09-23 | 6 命中：**新件 `bowenliang123/dsh-context`（发布 14 小时前）** ／ 两个 GitHub topic 入口（`deepseek-harness-plugin` ／ `dsh-plugins`）／ **第二个 awesome 列表 `0xsline/awesome-deepseek-harness`** ／ 中文第三方导航站 `ai.codefather.cn/dsh-plugin/` |

**未做**：npm 站内搜索（规格 §7 列了，本轮未做）｜ 未拉取新发现候选的源码 ｜ GitHub 侧只做了 **1 次**方向搜索（属抽样非穷尽）。
**通道说明**：本地走 **Bash 通道**；联网走**内置搜索 / 抓取工具** ＋ **git over 全局代理**。按项目铁律，**通道不同则结论不可互推**。

### ② 候选表

#### A 组 · 官方 ／ 上游（🟢 我方实读）

| 候选 | 类型 | 入口 | 锚版本 | 命中 | 档 | 借鉴点（具体到可抄什么） | ⛔ 不可参考 | 它怎么验的 | 证据 |
|---|---|---|---|---|---|---|---|---|---|
| `@deepseek-ai/dsh-compaction`（契约） | 官方 | `ref/dsh-bare:packages/compaction/compaction/` | 锚版本身 | T1 T5 | **A** | 包树实证 **`src/checkpoint.ts` 是独立源文件**（⇒ 「checkpoint marker 从 cordis-free 子路径导出」在**文件布局层**成立）；仓内自带 **3 个 spec**（`compaction.spec.ts` ／ `invariant.spec.ts` ／ `tool-pairing.spec.ts`） | 无 | 官方 spec ×3 | 🟢 |
| `compaction/` 家族 README | 官方 | `ref/dsh-bare:packages/compaction/README.md` | 锚版本身 | T1 T2 | B | 家族三分口径原文：**automatic ／ on-demand `/compact` ／ oversized tool outputs trimmed first**（"so there is less to condense"）⇒ **pruner 的位次 = 摘要之前**；且明写 token 计量**在另一个 LLM 家族服务里** | — | — | 🟢 |
| 官方 3 件（basic ／ pruner ／ command-compact） | 官方 | `~/.dsh/profiles/sdk/node_modules/@deepseek-ai/` | 锚版本身 | T2 T4 | **A** | 本机 profile 扁平层**实测在位**（§6① 复核成立） | — | — | 🟢 |

> ⚠️ A 组我只补了 **§12 未覆盖或浅覆盖的三处**（包树文件布局 ／ 家族 README 的三分位次原文 ／ 扁平层实测）；**不重复 §12 已给的契约与 basic 深读**（同通道，重复无增益）。

#### B 组 · 社区 —— **本轮实读源码的两件**

**B-1 `aerince/dsh-active-context-pruning`**（v0.1.0 ／ **MIT** ／ 本地 `ref/community/aerince__dsh-active-context-pruning`）

| 字段 | 内容 |
|---|---|
| 锚版本 | **读不出**：`package.json` **无 peerDependencies**（全文实读）⇒ 按 G4 **标 🔴、不进结论** |
| 命中 | T1 T2 T3 T5 T6 |
| **借鉴点 1：`summarize` 可实例级覆写，且可完全不调 LLM** | `index.js:160-179`：保存 `compaction.summarize` → 覆写 → `ctx.effect` 返回恢复函数；命中 pending 时返回 **`{summary:[{type:'text',text}], provider:'acp', model:'model-authored'}`** ⇒ ⭐ **这就是「换摘要来源」的现成正本**（T2 的答案不必只靠推断） |
| **借鉴点 2：范围安全约束的写法** | `assertSafeRange()`（`:119-130`）：起终点必须**在 surface 上**、且**不得包含最后 `preserveRecent`（默认 2）个 node** ⇒ 「近文保留」的**参数化实现** |
| **借鉴点 3：checkpoint 的可判据识别** | `lib.js:73-77`：`isCheckpointEvent = type==='user/message' && data.source.kind==='plugin' && data.source.plugin==='compact'` ⇒ **T5「摘要注入」的现成机读判定** |
| 计量与窗口来源 | `ctx.get('tokenMeter').measure(session).{nodes,totalTokens}`；窗口 = `ctx.get('llm').resolveModelInfo(provider,model).context.contextWindow`（`:84-96`）⇒ **T4 不必硬编码** |
| 阈值 | `minContextLimit '60%'` ／ `maxContextLimit '70%'`（**与官方 0.8 不同**） |
| 注册面 | 4 工具（`acp_status` / `acp_compress` / `acp_decompress` / `acp_search`）＋ 1 命令 ＋ systemPrompt **section ＋ 动态 context**（按用量给 SOFT/HARD 横幅） |
| ⛔ 不可参考 | ① **工具驱动**（模型主动压）与 S2「自动/显式触发」**不同构**；② 依赖官方 basic 提供 `compactRegion`；③ **`acp_` 非 Agent Client Protocol**（它自己在 prompt 里写了 "This is not Agent Client Protocol."） |
| 它怎么验的 | **无测试**；仅 `check.js`（65 行）非函数式自检 |
| 证据 | 🟢（`index.js` 347 ＋ `lib.js` 119 **全文实读**） |

**B-2 `giter00/dsh-headroom`**（v0.3.0 ／ **Apache-2.0** ／ 本地 `ref/community/giter00__dsh-headroom`）

| 字段 | 内容 |
|---|---|
| 锚版本（⭐ 本轮实质升级） | `peerDependencies` 实读为**区间**：`@deepseek-ai/dsh-agent` / `dsh-llm` / `dsh-session` / `dsh-tools` = **`>=0.0.1-rc.5 <0.1.0` 或 `>=0.1.0-rc.1 <0.2.0-0`** ⇒ **我方 `0.1.5-rc.2` 落在区间内**。⚠️ 但**声明 ≠ 实测** ⇒ 标 **🟡（声明级）**，不升 🟢 |
| 命中 | T3 T5 T6 |
| **借鉴点 1：hook 位点** | `lib/index.js:478` `ctx.on('tools/post-execute', …)` ⇒ **tool 结果物化前**的替换位（与官方 pruner 同生态位） |
| **借鉴点 2：可逆取回 = 多一个工具面** | 注册 3 工具：`retrieveTool(ccrStore)` / `compressTool(config)` / `statsTool(ccrStore)` ⇒ **引入 `headroom_retrieve` 让模型自己取回原文** |
| 实现规模与测试 | `lib/` **2,067 行**（ccr 216 ／ compress 769 ／ index 498 ／ kompress 406 ／ kompress-onnx 178）；**`tests/` 2 个（351 ＋ 142 行）＋ 5 个 verify/probe 脚本 ＋ GitHub CI** ⇒ **有真测试** |
| ⛔ 不可参考 | ① 它是 **tool-output 压缩**，**不解决**「摘要注入 ＋ 近文原文保留」；② 新增模型工具面，**与官方"人工命令、无模型工具"取向相反** ⇒ 若借鉴，**是产品决策不是实现细节** |
| 它怎么验的 | `scripts/verify-compress.mjs`(221) ／ `verify-apply.mjs`(98) ＋ `tests/`；README 自述断言**字节不变**与 **NEEDLE-42 可取回** |
| 证据 | 🟢（**manifest ＋ hook 注册面 ＋ 文件树实读**）／🟡（**2,067 行实现未逐行读** ⇒ 可逆取回机理只到**位点级**，不到实现级） |

**B-3 名录级候选（🟡）—— ⭐ 下列 5 件不在 §12 的清单里（我这轮扫出）**

| 候选 | 命中 | 档 | 借鉴点 | 为何值得单独看 |
|---|---|---|---|---|
| `savageops/dsh-rich-indexing` | T4 | **A?** | **用「可配置阶梯（默认 30/50/70/90）」替代单一的 80% 悬崖**，各档从温和到激进 | ⭐ **直接批评官方 0.8 单阈值**；T4 的**策略面**参照 |
| `fan56/dsh-dcp` | T3 T6 | **A?** | **零 LLM 调用**的规则化剪枝，**逐字保留** paths / commands / error traces / open todos | ⭐ 与"LLM 摘要"**相反路线**的现成件 |
| `GooDAnDReaDY/dsh-context-lens` | T3 T6 | B | AST 级压缩 ＋ 日志行过滤 ＋ **token 预算守卫** | 三个动作合在一条管线上 |
| `lifeodyssey/dsh-compressor` | T6 | B | 自述"**a slim port of Headroom**"；声称**不影响 model context cache** | ⚠️ ① 与 B-2 **同源**（派生关系）；② "不影响缓存"与项目关心的缓存成本直接相关 |
| `bowenliang123/dsh-context` | T1 T5 | B | **上下文构成观测面板**："see what the model's context window is made of and how it evolves" | ⭐ **发布仅 14 小时** ⇒ 极新件，锚版本必然读不出 ⇒ 按 G4 标 🔴 |

**B-4 名录级 · C 档（只登记一行，不展开）**：`dsh-plugins/dsh-auxiliary`（含 compaction 的专用模型路由）／`luxiwusuobuneng/dsh-plugin-context-manager`／`zhaoyuntao-wl/dsh-plugin-thread`／`pgmi-builds/better-dsh#dashr`／`rand0wn/dsh-minimal-anchor`（**tool schema 白名单裁剪 ＋ 首轮 preamble** ⇒ 另一压缩层）／`JohnXu22786/context-pruner`／`yoza10635/dsh-argp`／`songoao25/dsh-auto-compact`／`falling-ts/dsh-force-compact`／`ICCuse/dsh-premise-guard`／`ICCuse/dsh-file-memory`／`Icstick/dsh-context-maid`／`ishuowang/dsh-sideband`／`LFM097384/Context-Prism`／`Tyan66666/billion-context-dsh`／`ljsysfurryACE/dsh-compaction`／`zhubaohi/dsh-qwen38-compaction-fix`；另有 12 件 Memory 类与本主题**只到"名词级启发"**（`00080000/dsh-project-memory` ／ `JunNanLYS/dsh-layered-memory` ／ `Luisarg03/dsh-memory-vault#memory-auto` ／ `melandlabs/opencontext#dsh-opencontext` ／ `moononnn/…Hanako-Memory` ／ `diqierjia/StrataGate-AgentMemory` ／ `tinqiao-oss/engramory#plugin` ／ `w4xxx/dsh-xia-plugins#gameassist-memory` ／ `yangyongzhen/dsh-memory` ／ `Asher-2000/dsh-memory-connect` ／ `dream12347/dsh-session-manager` ／ `Relethe/dsh-brief-session-title`）。

#### D 组 · 排除（**G3 闸门的自我实证**）

我这轮紧扫（强相关词 ∧ 非 UI 噪音）后**仍混进三例同词异义**，逐条读描述才剔除：

| 候选 | 为何出局 |
|---|---|
| `PiedPiper911/dsh-video-tools` | "**compress** images" = **媒体转码**（FFmpeg.wasm） |
| `STARDUSTLC666/dsh-ffmpeg` | 视频工具，"encode" 被宽扫词命中 |
| `wingsky-1/dsh-plugin-hub#packages/dsh-gzip` | **HTTP gzip**（`/api` 响应压缩），与上下文无关 |

⇒ **印证 §1-G3 的必要性：即使收紧强相关词，仍必须逐条读描述**，否则会把媒体/传输压缩混进上下文压缩。

### ③ 评论（与上面的观察分开）

> 以下全部是**评论**（判断），不是观察。

1. **⭐ 3.4 的参考件至少分「三层」，不是两层 —— 建议在 §12 的二分法上补一层。**
   - ① **conversation compaction**（契约 / basic / command-compact / aerince / ljsysfurryACE / dcp / argp）→ **与 3.4 同题**
   - ② **tool-output 压缩**（pruner / headroom / context-lens / context-maid / context-pruner）→ 只在「压什么」互补，**不解决「摘要注入 ＋ 近文原文保留」**
   - ③ **上下文构成观测**（`bowenliang123/dsh-context`）→ ⭐ 这一类**对 T5 判据可能最有用**：「看模型上下文窗口由什么构成」正是「摘要注入 ＋ 近文保留」的**观测面**，而 T5 缺的恰是观测手段。
   ⇒ 只按二分法，会把 ③ 整类漏掉。

2. **⭐ "自写摘要"已有两条现成正本，且都不调 LLM** —— 这让 3.4 的"换策略"从**设计题**变成**选择题**：
   - **覆写 `summarize`**（aerince，🟢 实读）：把**模型自己写的文本**顶进官方管线 ⇒ 摘要来源 = 模型，但**不经第二次 LLM 调用**
   - **确定性抽取器**（`fan56/dsh-dcp` / `ljsysfurryACE/dsh-compaction`，🟡 名录级）：**保路径/命令/错误迹逐字、丢闲聊**
   ⇒ 两者对应 T3 的两条不同答案（"谁来写" vs "不写、只筛"），**建议都进深读清单**。

3. **T4 的阈值不是常数、是策略面 —— 且已有件把它当卖点。** 三套取值已被看到：官方 **0.8** / aerince **60%→70%**（🟢）/ rich-indexing **30/50/70/90 阶梯**（🟡）⇒ 建议 3.4 **不在本轮锁定阈值**，后置为**配置面**（aerince 已证明可配置）。

4. **⚠️ 版本脱节判断（§5-5 要求显式暴露）：本轮判「不成立」，社区红利可用。**
   - 官方三件与锚版**同代**（本机 profile 实测）✓
   - `giter00/dsh-headroom` 的 **peerDeps 区间实读包含我方锚版** ✓（⚠️ 声明级）
   - `aerince` **锚版本读不出**（无 peerDeps）⇒ 标 🔴，**不作为"可用"的依据**
   ⇒ **不构成"须单独一节上报老大"的条件**；但**没有任何一件是实测级兼容**，全部止于「同代」或「声明级」。

5. **两条我这轮新增的坑（供登记表"备注"列）**：① **名录去重必须读描述里的派生声明** —— `lifeodyssey/dsh-compressor` 自述是 headroom 的 "slim port"，不读描述会当成两件独立候选；② **极新件要在登记时带时间** —— `bowenliang123/dsh-context` 发布仅 14 小时，任何锚版本判断都无意义。

6. **两个社区清单规模差约 10 倍，说明"扫了多少"必须带通道名。** 我实读：目录站 **333 plugins** vs 本地名录 **3,196+**（同一天）；且**目录站没有 compaction 专类、未见 summarization 插件** ⇒ **只用目录站会系统性漏掉这一族**。⇒ 建议 WB 汇总时把"通道"与"扫描量"绑在一起列，否则各方数字不可比。

### ④ 本轮诚实边界

- **未翻阅任何 AI 的交流区文件**（`exchange/log-*.md`）；但**已披露**：规格 §12 内嵌 WB 报告 ⇒ 与 §12 重合处**不是独立第二次验证**（调整 A）。
- **headroom 的 2,067 行实现未逐行读** ⇒ 其"可逆取回"只到 **hook 位点级**，不到实现级（B-2 已分层标注）。
- **aerince 的锚版本读不出**（无 peerDeps）⇒ 按 G4 标 🔴、**不进结论**。
- **未做** npm 站内搜索；GitHub 侧只 1 次方向搜索（抽样）；**未拉取**新发现的 4 件（rich-indexing / dcp / context-lens / dsh-context）⇒ 它们仍是 🟡。
- 全部结论**只在「本地 Bash 通道 ＋ 内置搜索/抓取工具 ＋ git over 全局代理」内成立**，不可外推。

---

### 🔁 补遗（2026-09-23 · 老大告知代理已开后的追加；**只改本文件**）

**背景**：原报告自报两条未做，其一＝**npm 站内搜索**。代理开后补做；**全程只读 —— 未落任何文件、未 clone、未装**（`ref/` 我未动）。

#### ① 检索账 · 追加 2 条通道

| # | 通道 | 动作 ／ 检索式 | 时间 | 扫描量 ／ 结果 |
|---|---|---|---|---|
| 8 | 联网 · npm registry 搜索 | `registry.npmjs.org/-/v1/search?text=dsh+compaction` | 09-23 | `total=18146`；**前 20 条逐条读** |
| 9 | 联网 · npm 包元数据 | `/latest` 端点 ＋ **整包 packument**（dist-tags ／ 版本清单 ／ 发布时间） | 09-23 | 5 件；另核 2 件官方包的整包 packument |

（通道自检：走 `socks5://127.0.0.1:7890` ⇒ `http_code=200`）

#### ② 候选表 · 追加

##### B-5 · **npm 通道独有**的新候选（🟡 注册表级；名录与目录站**均未见**）

| 候选 | 版本 ／ License | peerDeps（**锚版本判据**） | 命中 | 档 | 借鉴点 |
|---|---|---|---|---|---|
| `Zhuchen00123/dsh-compaction-cacheaware` | 0.1.11 ／ MIT | `@deepseek-ai/dsh-*: ^0.1.0-rc.6` | T3 T6 | B | **cache-aware** 压缩后端（自述 "Reasonix-style"），replaces/enhances `compaction-basic` with `compact_ratio` ⇒ ⚠️ **与项目关心的缓存成本直接相关** |
| `TsFreddie/dsh-compaction-instant` | 0.1.4 ／ MIT | `^0.1.0-rc.6` | T2 T3 | B | "**near-lossless deterministic** compaction engine"，自称 **drop-in replacement for `dsh-compaction-basic`** |
| `helibeiqi/dsh-compaction-pro` | 0.1.0 ／ MIT | **全 `"*"`** ⇒ 锚版本**无可判**（G4） | T2 T3 | B | **"bilingual"** 高保真递归压缩（自称 drop-in upgrade over basic）⇒ 中文场景值得一看 |
| `gendui123/dsh-compaction-probe` | 0.1.0 ／ MIT | 仅 `cordis` ＋ `schemastery` | **T5** | **A?** | ⭐ **T5 的现成验证装置**：日志每一个 `compaction/*` 事件，并**探 `shadowedSeqs` 是否仍解析为可读事件** |
| （官方）`@deepseek-ai/dsh-compaction-image-offload` | **0.1.6-alpha.1** ／ MIT | `@deepseek-ai/dsh-compaction: ^0.1.6-alpha.1` | T6 | B | ⚠️ **只在 0.1.6 线存在 ⇒ 我方锚版拿不到**（见下面「发现 2」） |

##### ⭐ 渠道级发现（两条 —— 比单个候选更重要）

**发现 1 · npm 的 `@deepseek-ai/*` 有 dist-tag 陷阱，且它直接动摇 §14 参考件 3 的一条判据基础**

实读整包 packument：
```
@deepseek-ai/dsh-compaction        dist-tags = { latest: 0.0.1-rc.5（08-12）, next: 0.1.5-rc.3（09-22）, alpha: 0.1.7-alpha.2（09-22） }   共 23 版
@deepseek-ai/dsh-compaction-basic  dist-tags = { latest: 0.0.1-rc.3,           next: 0.1.5-rc.3,        alpha: 0.1.7-alpha.2 }          共 24 版
```
⇒ **`latest` 指向 08-12 的 `0.0.1-rc.5`，而同一个包**早已有 `0.1.5-rc.3` / `0.1.6-alpha.*` / **`0.1.7-alpha.2`**（均 09-22 发布）。
⚠️ **若只查 `latest`，会得出"官方包还停在 0.0.1"的错误结论。**
而 §14 参考件 3 对 `dsh-api-gateway`／`dsh-typert-*` 的「**不可启用**」判据，原文写的正是「**`latest` tag 停在 `0.0.1-rc.1`**」—— **两条形态完全同源**。
⇒ **建议（强化我 P2 的复核建议）**：复核 gateway 时**必须用 `next` ／ `alpha` dist-tag 与仓库 tag 双查**；**若"不可启用"只建立在 `latest` 上，该结论需要重验**。

**发现 2 · 锚版落后速率的实测**（规格 §5-5 要的口径，此前缺硬数据）
```
0.1.5-rc.2  ← 我方锚（09-15 拍定）
0.1.5-rc.3      published 2026-09-22 05:40
0.1.6-alpha.1 ／ .2
0.1.7-alpha.1 ／ .2   published 2026-09-22 15:50
```
⇒ **09-22 一天之内**，上游从 `0.1.5-rc.3` 推到 **`0.1.7-alpha.2`**（4 个版本）；且 **0.1.6 线已出现 compaction 家族新件**。

#### ③ 评论 · 追加与修正（与上面观察分开）

**修正 · 「版本脱节判断」：维持"不成立"，但**必须**补一条上游侧的持续成本**
- 我逐件核了社区件的 peerDeps：`cacheaware` ＝ `^0.1.0-rc.6` ／ `instant` ＝ `^0.1.0-rc.6` ／ `compaction-pro` ＝ **全 `"*"`** ／ `probe` ＝ 仅 cordis ⇒ **并不统一要求 ≥0.1.6** ⇒ **"社区壁垒"不成立，原判维持**。
- ⚠️ **补一条**：**上游自身**已在 0.1.6/0.1.7 线新增 compaction 家族件（`image-offload`，peer `^0.1.6-alpha.1`）⇒ **锚版拿不到；这不是社区问题，是锚版位置问题** ⇒ 归入「跟随 rc 的持续成本」，**建议报老大**（§5-5 的原话虽指社区，但这条证据类型相同、量级更大）。

**新增评论**
1. ⭐ **"观测／验证类"第三层又添一件**（`gendui123/dsh-compaction-probe`，专探 `shadowedSeqs` 可读性）⇒ **我原报告"建议补第三层（上下文构成观测）"的判断被独立加强**：T5 缺的确实是**观测手段**，而社区已在做这件事。
2. ⚠️ **npm 上存在「同名搬运件」，会污染版本判断**：`@monotykamary/` ／ `@x1a0f3n9/` ／ `@stackstackstack/` ／ `@dangzhuotong/` ／ `@alatastudio/` ／ `@prettier-ai/` ／ `@xneog/` 各自重发了 `dsh-compaction`（**描述逐字相同**："Abstract compaction service seam (ctx.compaction) for the DeepSeek Harness"），**版本号却各不相同**（0.1.9 ／ 0.1.5-rc.5 ／ 0.1.7 ／ 0.1.0-rc.7 ／ 0.1.1-rc.4 ／ 0.1.2-alpha.1 ／ 0.1.0）⇒ **登记与检索必须写全 `@scope`**，否则会把搬运件当官方件、把它们的版本号当上游代际。
3. **`dsh-compaction-pro` 的 peerDeps 全是 `"*"`** ⇒ 属 G4 的"字段在、但锚版本读不出" ⇒ 建议 §1-G4 补一句：**`"*"` 与"读不出"**同档处理（都不进结论）。

#### ④ 边界 · 追加

- 本轮**只读**：**未落任何文件、未 clone、未装**；`ref/` 未动。
- 📌 **我的一处近错已自查纠正、记此警示**：我先用 **`/latest` 端点**取版本，差点把"官方包停在 `0.0.1`"写成结论；改查**整包 packument** 才发现那是 **dist-tag 问题**（`next`／`alpha` 早已到 `0.1.7`）。⇒ **`/latest` ≠ 最新发布**；凡"版本判断"必须走整包 packument 或仓库 tag。
- npm 元数据（license ／ peerDeps ／ version）属**注册表级证据** ⇒ B-5 整组仍标 **🟡**（未读源码）。

---

## 🔀 DSH-3.4-R 融合轮（2026-09-28）：吸收三方方法（非结论）＋ 据此实做

> **授权**：老大 2026-09-28 ——「参考 Trae ／ Claude ／ WB 的报告，**吸收他们的方法、路径**，对你自己的报告作出你认为有必要的调整；**并非简单吸取、整合结论**」；**梯子已开**。
> **通道四元组（本段全部结论的适用范围）**：本机（Windows）／ bash(MSYS) ＋ node v24.14.1 ／ 用户级（无提权）／ **全局 socks5 代理在跑（127.0.0.1:7890）**。
> **口径**：老大三条（2026-09-23：S2 预算 5000 万 ／ 版本锚定降为观察 ／ 他方交付取当下状态）已读并遵守 ⇒ 本段不做版本考古。
> ⛔ **本段只动本文件**；对旧报告的更动**不重写历史行**，集中登记于 §③「调整清单」，供 WB 汇总取**当下状态**。

### ① 吸收清单（他的**办法** → 我的动作 —— 只吸收方法/路径，不搬运结论）

| # | 来源 | 方法 ／ 路径（不是结论） | 我的采纳 |
|---|---|---|---|
| M1 | Trae A1 | **名录是发现通道、不是判定通道** ⇒ G1／G2 只对**已落位件**判定；未落位条目显式标"未判"、不塞进 D 档 | ✅ 口径采纳：本段"落位名单＝判定域"；B‑3 ／ B‑5 未落位条目语义照此 |
| M2 | Trae A2 | **落位门槛 ＋ 名额**自定并写进检索账（可复核、可被否决） | ✅ 实做：门槛＝① 属本路未落位候选 ② 他方未实读（去重）③ 描述可见 T1–T6 直接命中；名额 ≤8（实落 7 件，§②‑1） |
| M3 | Trae A4 ／ Claude M5 | **两处 DSH home 都实测 ＋ sha256 同源比对** | ✅ 实做（§②‑3） |
| M4 | Trae A5 ／ Claude M1 | **不抄声明、实跑 semver**；`default` 与 `includePrerelease` **两栏并列**；加**反向对照** | ✅ 实做（§②‑2，含争议范围第三跑） |
| M5 | Trae A6 ／ WB 通道注记 | 通道坑：bash 长命令吃引号 ／ PowerShell 管道毁二进制 ／ `cmd \| tail && echo OK` **假 OK** | 📝 登记（他方实测，本路未复现；本路沿用自家"裸命令＋`echo EXIT=$?`、不接管道"） |
| M6 | Trae C5 | **落位抽样验活**（他方 8 抽 1 失效）＋ **许可红线逐件核** | ✅ 实做：7 件 clone 前逐件验活（**7／7 存活**）＋逐件 LICENSE 首行核（MIT 系，无 GPL 红线） |
| M7 | Claude ②‑4 | **引用逐条复核**（拿同一份源码逐条核数字） | ✅ 实做（§②‑4：本路 4 处数字全对；补文件名显式化） |
| M8 | Claude ②‑5 | "**现成可用**"的表述须过**运行期 API 核对** | ✅ 实做（§②‑5；产出一处**本路订正**＋一处**对他方推断的收窄**） |
| M9 | WB ③‑7 ／ ③‑8 | 兼容性**一律标"声明级"**；安装判据认 **`package.json#dsh.bundle.patch`**，声明文件不作依据 | ✅ 实做：7 件逐件核 `bundle.patch` ＋ 全表措辞统一 |
| M10 | WB ③‑9 | 判据须能**区分三种结局**（没触发 ／ 压了但摘要被截 ／ 完好） | 📝 登记（T5 轴，供汇总；不并入本路结论区） |
| M11 | Trae C2 → Claude 扩写 | "原文可取"**口径须先定**：留 surface ／ 可回取（外部 store）／ 仅在 append-only log | 📝 登记 ＋ 本路实例：本轮落位的 `instant`（seq 指针回取）与 `compressor`（locator 回取）是第二态的两个新样本 |
| M12 | WB 横切Ⅱ ／ WB ③‑3 | 下轮检索改从**机器可读注册表**起手；评估先用**分代尺（V0–V4）** | 📝 登记为下轮路径 ／ 评估轴（引用，不重做） |

**⛔ 明确不吸收**：三方的**候选结论、分档与订正**——本路结论区不追改、不搬运；只做"用他们的办法，把**我自己**没验完的验下去"。

### ② 据此实做（全只读）

**检索账 · 追加（接原报告 1–7 行 ／ 补遗 8–9 行）**

| # | 通道 | 动作 ／ 检索式 | 时间 | 扫描量 ／ 结果 |
|---|---|---|---|---|
| 10 | 联网 · `git clone`（梯子开） | 按 M2 门槛浅克隆 **7 件** → `ref/community/`（`.gitignore` 已整目录忽略，不扰仓） | 09-28 | **7／7 成功** |
| 11 | 本地 · **源码锚点实读** | 7 件：README ＋ 文件树 ＋ 关键实现锚点逐件定位 | 09-28 | 见 §②‑1 ／ §②‑5 |
| 12 | 本地 · **semver 实跑** | `node v24.14.1` ＋ `semver@7.8.5`（两处 home 各一份） | 09-28 | 见 §②‑2；脚本可复跑（§⑤） |

#### ②‑1 落位与实读（7 件；证据一律"**锚点级 🟢**"＝README ＋ 结构 ＋ 关键实现行实读，**非逐行通读**）

| 件（`owner/repo`） | HEAD（09-28） | License | 锚（peer 实读 → semver 类） | bundle.patch | 测试 | 借鉴点（具体到可抄什么） ／ ⛔ |
|---|---|---|---|---|---|---|
| `savageops/dsh-rich-indexing` | `bc093e6`（08-30） | MIT | **peerDeps 为空**（README 明示 peers 经 profile 模块回退解析）⇒ 声明层不可判 | ✓ | 3 | ⭐ **"覆盖 basic"的最完整实样**：阶梯 **30/50/70/90** 替代单 0.8 悬崖 ＋ 四档法律（gentle→standard→consolidating→maximum）＋确定性关键词索引并入 checkpoint ＋ 摘要模型链（primary ＋ ≤3 备份）。**`engine.js:133` 以 `super(ctx,{thresholdRatio:0.9,…})` 起手、`:200-206`"选档走原封的 stock 压力事务"（锁／head-anchor／重试全继承）** ⇒ 印证"覆写 `compactIfNeeded`＋`summarize`、其余全继承"；**disable／uninstall 语义**（managed patch 行自动增删，压缩永不被 toggle 留在死态）可直接抄进我方 S2 开关设计 ／ ⛔ 自带 Web 面板（产品面）；声明层锚不可判 |
| `GooDAnDReaDY/dsh-context-lens` | `57122f6`（09-26） | MIT | settings／tools `^0.1.0-rc.6` ⇒ **预发布歧义类** | ✓ | 0 | **边界划分的第三方视角**：自述"预算控制／计数／头尾截断归 DSH 核心（≥0.1.5）"，自身只做核心没有的**语义压缩**——AST 骨架（9+ 语言，depth 默认 3）、测试/构建日志压缩（阈值 4000 字符；raw/balanced/aggressive）、**焦点路径**（正在编辑的文件保全文）；工具面 `context_lens_code`／`context_lens_log` ／ ⛔ 工具驱动＋UI 卡；无测试 |
| `lifeodyssey/dsh-compressor` | `76b39ab`（08-16） | MIT（插件）＋ Apache-2.0（`crates/headroom-*`） | 子包形态（本副本未见子包 package.json） | —（子包） | 232（fixtures 为主） | **形态修正**：整仓是 **Rust workspace**（`crates/` ＋ `plugins/dsh-compressor`），npm 侧包 `dsh-compressor`；机制＝**"保前缀＝保 cache"**（明确写为设计目标：不重写已发送前缀）＋ 原文留盘 ＋ `compressor_retrieve` 工具（`<<compressor:hash>>` locator）取回；已接线 Log/Smart/Text/Search/Diff，未接 tree-sitter／ONNX ／ ⛔ tool-output 生态位；**同源对象＝ headroomlabs-ai/headroom**（与 `giter00/dsh-headroom` 同族，Kompress 同名） |
| `Zhuchen00123/dsh-compaction-cacheaware` | `a68ec4b`（08-27） | MIT | 多包 `^0.1.0-rc.6` ⇒ **预发布歧义类** | ✓ | 1 | **Reasonix 移植**：单触发 `compact_ratio` 默认 **0.85**；**近尾预算 `clamp(window×10%, 32K, 96K)`**（`selection.ts:8`）；尾选择细节可抄——**tool result 永不作为尾起点**、防孤儿 result、`force` 路径尾部减半（`:80,104,132-140`）；**"每事务单次摘要调用、不做应用层重试环"**＝成本纪律实样 ／ ⛔ 其 Web 面未核 |
| `TsFreddie/dsh-compaction-instant` | `f688029`（09-02） | MIT | 多包 `^0.1.0-rc.6` ⇒ **预发布歧义类** | ✓ | 7 | ⭐ **"零模型调用"路线的完整实现**：移植 lllyasviel/VCC 的"会话编译器"原理（`compiler.js` 头部即一份**移植说明范式**）——shadowed 区间毫秒级编译为**仅原文 token** 的引用式视图，每次截断/删除带 **`(seq N)` 指针**；工具调用塌缩为一行（白名单取关键参数）；契约级 drop-in（alias 安装，不改 preset）；配 `recall`／`search` 工具＋`/recall` 命令（`maxRecallTokens` 默认 16000）⇒ **第二态"可回取"的本地实现（不外呼）** ／ ⛔ 无摘要 ⇒ "摘要含 nonce"判据不适用（须另立：编译器确定性＋指针可回取） |
| `helibeiqi/dsh-compaction-pro` | `2e5297c`（v0.2.0，08-28） | MIT | peer 全 `"*"` ⇒ **实测 default=false（预发布规则）**，与"读不出"同档 | ✓ | 2 | **只换 `summarize()`**（自述"官方唯一子类钩子"）：高保真模板（保数值/路径/命令/标识符）＋**跟随会话语言**（`language:'auto'`）＋**可选递归分块**（`recursive` 默认 true、`chunkMessages` 40）＋`customInstruction`（`summarize.ts:39-48,71-73`）——**中文会话摘要**的第三个现成样本 ／ ⛔ 自称"无损升级"是营销措辞（仍是 LLM 摘要） |
| `gendui123/dsh-compaction-probe` | `177396e`（08-22） | MIT | 仅 cordis／schemastery ⇒ 锚不可判 | ✓ | 0 | 见 §②‑5（含订正） |

**去重说明**：原 B‑3 五件中 `fan56/dsh-dcp` 与 `bowenliang123/dsh-context` 已由他方实读（Trae ／ WB），按 M2 门槛不重复；本路缺口收窄为 `rich-indexing`／`context-lens`／`compressor` 三件——本轮已补齐。

#### ②‑2 semver 实跑（锚 = `0.1.5-rc.2`；脚本见 §⑤，可复跑）

| 声明范围 | default | includePrerelease | 类 |
|---|---|---|---|
| `^0.1.0-rc.6`（cacheaware ／ instant；context-lens 同形※） | false | **true** | **预发布歧义** |
| `"*"`（pro） | **false** | true | 与"读不出"同档（实测支持该口径） |
| headroom 复合区间 | false | true | 预发布歧义 |
| `>=0.0.1-rc.5`（Trae 样本） | false | true | 同上 |
| `^0.1.5-rc.2`（handoff-compaction） | **true** | true | 正锚 |
| `>=0.1.5-alpha.1 <0.1.6-0`（billion-context） | **true** | true | 正锚 |
| `^0.1.7-alpha.2`（argp） | false | false | **真脱节** |

※ context-lens 的同形范围未逐包重跑（同串 ⇒ 同判，判定为确定性输出）。
- **反向对照**（两组边界全对）：`^0.1.0-rc.6` ∋ `0.1.0-rc.6` ✓ ／ `0.1.9` ✓ ／ `0.2.0` ✗ ／ `0.0.9` ✗；`^0.1.5-rc.2` ∋ `0.1.5` ✓ ／ `0.1.5-rc.9` ✓ ／ `0.1.4` ✗ ／ `0.2.0` ✗。
- ⚠️ **争议范围第三跑**（Trae 记 `incl=false` ／ Claude 记 `incl=true` 的同串 `>=0.0.1-rc.5 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0`）：本路在**两份 semver（均 7.8.5）各跑一次**，均 **default=false ／ includePrerelease=true**。⛔ 只报数据、不裁决（红线③）。
- ⇒ **措辞**：所有"通过"一律标**声明级**；三类分清——**真通过** ／ **预发布歧义**（先按待核） ／ **真脱节**（两栏皆 ✗）。

#### ②‑3 两处 home 同源（M3）

`dsh-compaction-basic/package.json` sha256 —— `~/.dsh` 与 `.dsh-home` **均为 `9988b62641257a1208f932940327c522b86a9dc7e0f107194e41f6e90eec9100`**；两处 0.1.5-rc.2 ／ MIT ⇒ **同源** ✓（与 Trae ／ Claude 独立结论互证）。

#### ②‑4 aerince 引用自查（M7；只读复核）

| 我的原引用 | 实测 | 判定 |
|---|---|---|
| `index.js:160-179`（summarize 包装） | `installSummaryHook` 定义于 `:160`，恢复闭包 `:176-178` | ✓ |
| `（:119-130）`（assertSafeRange） | `:119-130`（**`index.js`**；`:126` lastAllowed 卡尾、`:128` 抛错文案） | ✓（**补文件名**） |
| `lib.js:73-77`（isCheckpointEvent） | 逐字一致 | ✓ |
| `:230`（compactRegion 调用） | `index.js:230` | ✓ |
| 阈值 `'60%'`／`'70%'` | `index.js:21-22`（默认值）＋`:287-289`（回读） | ✓（补行号） |
| `preserveRecent` 默认 2 | **`index.js:23/126/128/289`**；`lib.js` **无**该标识符 | 对账留痕（供汇总） |

⇒ 结论：**4 处数字全对**；仅补文件名 ／ 行号显式化。（他方融合轮记"本路与 WB 同有一处行号小滑"——经逐条复核，本路未见该表述；`preserveRecent` 实位 `index.js`，此处留痕对账。）

#### ②‑5 ⭐ probe 复核 ＋ `session.events` 深挖 —— 一处**本路订正** ＋ 一处**他方推断收窄**

**方法**（吸收 Claude ②‑5 的"运行期 API 核对"）：把源码引用的每个成员**对回锚版上游**（`ref/dsh-bare@dsh-v0.1.5-rc.2` 实读）＋ 全仓 grep。

- **结论一（订正）**：锚版核心 `Session` **无** `events` 访问器 —— 公开面只有 `eventAt(seq)`（`index.ts:621`）／`snapshotEvents()`（`:633`）／`ownEvents()`（`:648`）；`log` 与 `eventsSnapshot` 均私有；**上游全仓** `get events` 仅一处 ＝ `session-query` 的 **`SessionObservation` 观察对象**（`packages/session-query/session-query/src/observation.ts:291`，另一个类型、另一条通道）。⇒ probe 的 `session.events?.[seq]` 恒 `undefined` ⇒ 每条 shadowed 记录恒为 `{readable:false, reason:'missing'}` —— **装置在锚版不可分态（恒红）**。⇒ 本路原表述"⭐ 现成验证装置"**订正为「路线可借鉴、装置须先修」**（修法：换 `eventAt(seq)`／`snapshotEvents()` 读法）。
- **结论二（收窄他方）**：`session.deriveEventMessage?.(raw)` 半**不会**失效 —— 锚版 `Session` **有**实例方法 `deriveEventMessage(event)`（`index.ts:849-856`，注释原文 "Instance face of the pure per-node `deriveEventMessage` export from `surface.ts`"）；且 `raw` 恒 `undefined` 时该分支根本走不到 ⇒ 实为**单点失效**，非"双重失效"。
- **结论三（同款读法外溢 · 源码级 🟠）**：**`aerince`（本路 B‑1）同款** —— `findSummary`（`index.js:134/137-138`）与 `hiddenText`（`:153`）读 `session.events`，被 `:257/:260` 的"恢复"工具路径调用 ⇒ 该路径在锚版**疑似必抛**（未实跑；若被外层捕获则表现为工具失败）。⚠️ 其注册表矩阵标"`0.1.5-rc.2` ✓ L5 runtime verified" ⇒ **建议汇总把该矩阵的验证范围列为待核**。（边界：`0.1.6-alpha.1`——本地可核最远点——核心 session 亦无该访问器；0.1.7 线未核，按口径不深挖。）

### ③ 对我报告的调整清单（汇总请以此为准）

| # | 旧稿（原报告 ／ 补遗） | 现调整为 | 依据 |
|---|---|---|---|
| 1 | 状态区 `📬 已派发 · 待执行` | ✅ 已回报 ＋ 补遗 ＋ **融合轮**（三段同在本文件；状态行已同步） | 本文 |
| 2 | B‑3 三件（rich-indexing ／ context-lens ／ compressor）🟡 未落位 | **🟢（锚点级）**：已落位（HEAD 见表）＋许可／锚／测试已核；借鉴点按 §②‑1 | §②‑1 |
| 3 | B‑3 `compressor` "slim port of Headroom" | **补形态**：Rust workspace ＋ `plugins/dsh-compressor`；同源对象 ＝ **headroomlabs-ai/headroom**（与 giter00 件同族） | §②‑1 |
| 4 | B‑3 `context-lens` "token 预算守卫" | **归属修正**：预算控制／截断**它自述归 DSH 核心**；自身 ＝ AST 骨架 ＋ 日志压缩 ＋ 焦点路径 | §②‑1 |
| 5 | B‑5 三件（cacheaware ／ instant ／ pro）注册表级 🟡 | **🟢（锚点级）**；`pro` 记仓库版 v0.2.0；`instant` 补 VCC 移植与 recall/search 全貌；`cacheaware` 补近尾算法与"单次调用"纪律 | §②‑1 |
| 6 | B‑5 `probe` "⭐ 现成验证装置（A?）" | ⚠️ **订正**：「路线可借鉴、装置须先修（恒红，不可分态）」；证据 ＝ 源码级 🟠 | §②‑5 |
| 7 | 补遗 "社区**并不统一**要求 ≥0.1.6 ⇒ 壁垒不成立" | **细化为四类**（真通过 ／ 预发布歧义 ／ 真脱节 ／ 不可判），全标"声明级" | §②‑2 |
| 8 | aerince 行 `（:119-130）` 缺文件名 | 以本段为准：`assertSafeRange` ＝ **`index.js:119-130`**；另**新增 ⚠️** 恢复路径读 `session.events`（§②‑5） | §②‑4 ／ §②‑5 |

**另两条供汇总的旧口径提示**（非本路新结论）：① `isCompactCheckpointSource` 为**必要不充分**（他方订正）；② 保留的"尺"有三种（`retainRatio` token 比例 ／ `retainTokens` 绝对值 ／ `preserveRecent` **surface 节点数**）——本路 aerince 复核再证第三把尺语义。

### ④ 诚实边界

- 7 件均为**锚点级实读**；**未逐行通读**任何一件，**未装 ／ 未跑 ／ 未测**任何件（§3.0 纪律）。
- `session.events` 三条结论均为**源码级（🟠）**，未实跑；0.1.6／0.1.7 线未核。
- semver 表只覆盖所列范围；第三跑只报数据。三方结论未被改写、未并入本路结论区。
- 通道四元组见抬头；⛔ 不可外推；本节**只改动本文件**。

### ⑤ 留痕

- 落位（`ref/community/`，gitignored）：`savageops__dsh-rich-indexing@bc093e6` ／ `GooDAnDReaDY__dsh-context-lens@57122f6` ／ `lifeodyssey__dsh-compressor@76b39ab` ／ `gendui123__dsh-compaction-probe@177396e` ／ `Zhuchen00123__dsh-compaction-cacheaware@a68ec4b` ／ `TsFreddie__dsh-compaction-instant@f688029` ／ `helibeiqi__dsh-compaction-pro@2e5297c`
- semver 脚本曾落 `D:\Code\_qoder-evidence\34r\`；**2026-09-30 随临时件清理删除**（如需复跑按 §②‑2 主表重建，约 20 行）

@WorkBuddy（汇总：请以 §③ 为本路**当下状态**；§②‑5 优先看）@老大

---

## 🧹 事件记录 · 官方 DSH 桌面客户端（评估 ＋ 处置 · 2026-09-30）

> **命令来源**：老大 —— ①「先帮我看看，不要乱动，评估一下情况」（只读评估）；②「我决定先卸载它，后面我在别的机器上把它下载下来研究……我已经退出登录并且关掉客户端了，你按照你的计划来做」（授权处置）。
> **通道四元组**：本机（Windows）／ bash(MSYS) ／ 用户级 ／ 本轮全本地操作（无联网）。

### ① 事件与暴露

- 老大今日装了**官方桌面客户端**（`D:\App\DSH\`，`DeepSeek Harness 0.2.0-rc.2` nightly，Electron）—— 一打开即**看到 LarryAgent 的历史测试会话**（工作区分组「LarryAgent」4 会话 ／「dsh-fresh」空 ／「未分组」6 会话）⇒ 疑为互相污染。
- **评估结论：真污染，方向 = 客户端单向扫共享 home。** 机制：客户端默认 home 解析 = `$DSH_HOME` > `~/.dsh`；本机 `~/.dsh` 恰为我方 **manual ／历史测试区**（09-09 起）⇒ 首次启动即被**全量接管**：16:50–17:15 写入 **28 个文件**（文件级实测 = 11×V4 会话文件〔10 迁移 ＋ 1 新建空会话〕＋ 11×projcache ＋ `.credentials.yaml` ＋ `profiles/desktop/` 4 件 ＋ `workspace.json` 改写）。
- **边界**：仓库（含 `.dsh-home`）／git 工作树／`profiles/{sdk,web,node_modules}`（09-17 遗留）**均未动** ⇒ 污染仅限 `~/.dsh` ＋ Windows 侧客户端目录（AppData／`D:\App`／快捷方式／注册表）。
- 迁移形态 = **复制式**（新写 `session.v4.jsonl.zstd`，原 `session.jsonl.zstd` 未动）⇒ 删新文件即可恢复原状（本次按此执行）。

### ② 风险评估（对「把官方客户端当项目 AI 之一加入」假设；老大两点均成立）

- **① 交流歧义**：裸名 "DSH" 指代已 6+（上游框架／`ref/dsh-bare`／`harness/`／`.dsh-home`／`DSH-3.x`／桌面端）；且真正加入的实体是"桌面端里的一个 agent 任务"，非 DSH 本身 —— 连提问措辞都已含歧义。
- **② 混淆致危险操作**（已可点名）：升级/清理错 home（它有"未询问即全量迁移"的**行为实证**）／版本线混用（它 0.2.0-rc.2 vs 我方锚 0.1.5-rc.2）／双环境重叠（违反"同一环境只用一个 DSH home"自定规则）。
- **③ 约束注入缺口（补充中最硬）**：其原生指令通道 = `$DSH_HOME/AGENTS.md` ＋ 项目 AGENTS.md 链；实测**仓库无 AGENTS.md、`~/.dsh` 无 AGENTS.md** ⇒ 它进项目 = **零 Tier0、零 Tier1**。（具体后果：`backend/config.yaml` 真 key 在仓库里可被无红线 agent 读入会话 —— 而会话文件存客户端 home、UI 可见 = 正是红线①要防的场景。）
- **④ 留痕/治理缺口**：无 exchange 日志、产出不进证据链 ⇒ 与复验铁律冲突。**⑤ 权限面/审批模型未审**。**⑥ 成本/出网不可观测**。
- **路径**（若将来要用）：S0 分家（钉 `DSH_HOME`）→ S1 研究对象模式（独立工作区、不给仓库）→ S2 前置（AGENTS.md 约束 ＋ 登记 ＋ 命名纪律"桌面端"不裸称 DSH ＋ 版本纪律 ＋ 权限收紧）。

### ③ 处置执行（老大裁：卸载；研究改在别的机器）

| 动作 | 通道 ／ 方式 | 结果 ／ 证据 |
|---|---|---|
| 静默卸载 | 取注册表 `QuietUninstallString` → `Uninstall DeepSeek Harness.exe /currentuser /S` | ✅ 安装目录 ~8s 内清除；桌面＋开始菜单快捷方式已清；HKCU Uninstall 键 **0 匹配** |
| `~/.dsh` 清理 | 逐件删：11×V4 ／ `.credentials.yaml` ／ `profiles/desktop/` ／ 11×今日 projcache ／ 新空会话目录（`session-02fcb592…`） | ✅ 复扫：V4 **11→0**；今日修改文件**仅剩 `workspace.json`**（见下） |
| `workspace.json` 修复 | 移除**悬空引用**（客户端所建空会话） | ✅ node 复验仍为合法 JSON；其余 4 条引用对应旧会话文件在盘 ✓ |
| AppData 清理 | 删 `Roaming/@deepseek-ai/`（Electron userData）＋ `Local/@deepseek-aidsh-desktop-updater/`（含 **289 MB** installer 缓存） | ✅ 复扫 absent |
| **未动**（附理由） | HKCU 开始菜单磁贴缓存 2 处（`Start/TileProperties/W~com.deepseek.dsh` ＋ CloudStore 同项）—— Windows Shell 自维护数据，手删 CloudStore 有开始菜单布局受损风险 | 留痕备查 |
| **保留**（非今日物） | `.anonymous-user-id`（09-09）／10×旧会话（`session.jsonl.zstd`）／`profiles/{sdk,web,node_modules}`（09-17）／`session_projcache.json`（09-10）／5×旧 projcache（`1366361c` ＋ 4×trae-probe） | ✅ 均未动（清理以最小侵入为界） |

**终态**：`~/.dsh` 回到"09-17 形态"（历史遗留 ＋ manual 测试区，零今日客户端产物）；Windows 侧除磁贴缓存外全清；**本机不再有官方客户端**。

### ④ 新环境事实（已登记为未结项第 10 条，待老大裁入 `docs/local-env.md`）

1. **官方桌面端默认用 `~/.dsh`**（未设 `DSH_HOME` 时）→ **在任何机器上跑它之前，先钉 `DSH_HOME` 分家**，否则重演本次全量接管。
2. **其约束通道 = `$DSH_HOME/AGENTS.md` ＋ 项目 AGENTS.md 链** → 想约束它必须先造 AGENTS.md（本仓当前没有）。
3. **打开即全量迁移**（V4 重写 ＋ projcache 重建 ＋ workspace.json 改写），无询问、无确认。

> 📌 **给"别的机器上研究"的三条提醒**：① 独立 home（`DSH_HOME` 指向专用目录）；② 工作区不要用含真 key 的仓库（含本仓）；③ 若坚持要给它项目权限 —— 先补 AGENTS.md 约束并登记进治理名单。

@老大（处置全部执行完毕；④ 三事实入档待你裁）
