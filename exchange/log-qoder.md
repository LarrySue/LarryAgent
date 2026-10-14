# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---


## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| — | — | — | ✅ **本区无在飞块** —— WB 转办〈文档/表述层事项〉（甲 3 ＋ 乙 2 ＋ 丁 1）已办结并落 docs ／ 代码注释；〈技能抽离移交〉五份浓缩稿已吸收进用户级技能库 ⇒ 承接见下方〈已清理段落〉 | — |

- ⚠️ **本区是活日志**（已闭环段直接删；**不要把本区当承接目标**——引用必成断链；需回溯用 `git log -p -- exchange/log-qoder.md`）；**判据 ／ 边界类内容一律落 `docs/` ／ `archive/`**，本区只放"怎么做"。
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.3 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  3. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  4. **收尾必核现场**（复核 ／ 取证动作自身也会改现场）。
  5. **工具输出的"原文"不得手工改写 ／ 意译**；但**工具链自身的语言 ／ 编码差异须原样保留**，并**注明该段取自哪条通道**。

---

## ⏳ 未结项（待老大裁）


> **2026-10-09 批量办理**（老大授权「直接处理」）：原 **1–9 条已办结 8 条**，**仅余第 5 条**。
> 办理明细（一处一行）：**#1** `larry-dsh-home` 承接滞后 ⇒ 6 处「当时形态留痕」批注已加（`dsh-migration:796/1073` ／ `production-env:464/515/517/532` 一带）｜**#2** 上游路径 ⇒ `dsh/README.md` 规则 4〈上游路径默认口径〉｜**#3** 落点口径 ⇒ `exchange/README.md` 对齐（`docs/` ／ `archive/` ／ `TODO.md`）｜**#4** 反引号惯例 ⇒ `docs/README.md`〈书写约定〉｜**#7** 索引 ⇒ `dsh/README.md` 补 `dsh-34-ref-research.md` 行｜**#8** 讨论稿引用 ⇒ `docs/README.md` 规则补「例外二」｜**#9** Tier0 源短副长 ⇒ 结（五载体末句全平、`production-env:483` 已加指向、余项皆已定论）。
> ⭐ **已消沿革**：第二刀（09-30）／「3.4-T 状态行滞后」（09-30）／#6 活指针（10-09）／#1–4・7–9（10-09 批）。
> 详细证据 ／ 建议 ／ 合规对照见下方〈全量职责巡检报告（2026-09-30）〉（09-30 快照；本批已办项以此清单为准）。

5. **`TODO.md` 精简**：第二刀 ✅（09-30）；**第三刀**（`DSH-3 · 贯穿规则` 迁 `docs/`）按原裁**等 DSH-3 完成后议**。

10. **`server.api_key` 是否现在就设（待裁）**：设前实测出新前提——`client/` 全仓无任何 Bearer 注入通道（grep `Authorization|Bearer|api_key` 零命中）⇒ **直接填 key 会让现态 `/api/` 全部 401**；「运行期填 Key ＋ Bearer 注入」是方案 §4.2 的未实现改造点。两条路：**(A)** 设 key ＋ 派 Trae 补 `client/src/api.ts` 与 `client/chat.html` 的 Bearer 头（一次闭环）；**(B)** key 只写 prod profile（`LARRY_CONFIG` 通道），dev 现态不动、上云时天然生效。口径已落 `exchange/deployment-architecture.md` §五〈待裁〉。

11. **代码行为层三条（待裁，⛔ 勿顺手改）**：① `backend/tools/shell.py` POSIX 超时只杀 `/bin/sh` 壳（未设 `start_new_session` ⇒ 孙进程可存活），真改要 `os.killpg` 且只能 CVM 侧验；② 同工具 `description` 声明 PowerShell／Bash，实测壳为 cmd.exe／/bin/sh ⇒「改声明」或「改实现」二选一；③ `rag/vector_store.py:107` 默认 `0.5` 与 `memory/engine.py` 默认 `0.3` 不一致（现因调用方显式传参未致错）。文档面已在册（`docs/product-positioning.md` 2.4.2 ／ 2.7.1 ／ 2.7.2）。

12. **待他方同步的旧口径（我无写权）**：① `exchange/log-workbuddy.md`〈在飞任务〉末行仍写 WB「维护 `docs/`」；② WB 自有 skill `archive-closed-todos` ／ `apply-proposal-to-doc` 编的是旧分工（WB 已自记"不再按其触发"，是否正式改造待定）；③ 根 `README.md` 归属——WB 按旁证暂记 Qoder 维护，待老大确认；④ `TODO.md`〈治理约定〉宜补一行「一体两面、须同步」指针（TODO 属 WB 操作域，老大点头我可代加）。

13. **老大自有文件的未提交改动**：`.qoder/rules/QODER.md` 已由老大写入新可写区与两条职责（一体两面 ／ 主持讨论稿），**目前仍在工作区未提交**，我不代提；`HUMAN.md` ／ `HUMAN_NOTE.md` 归老大自处。

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
- ✅ **#1「加模型零代码」不符 —— 已处置（2026-10-09）**：口径已修 **3 处**（`README.md:145` ／ `docs/product-positioning.md:251` ／ `:271`）⇒ 统一为「**新增 provider 段零代码**；**新增具体模型需登记一行映射**（`backend/models/llm.py::_MODEL_PROVIDER_MAP`）」；代码侧不动（映射表＝既有设计，非缺陷）。办理细节已随 2026-10-09 第二轮清理删除（回溯 `git log -p -- exchange/log-qoder.md`）。
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

- **2026-10-09 清理**：删除已闭环内容三批 —— ① `DSH-3.4-R` **派发稿**（23 行）；② `DSH-3.4-R` **调研报告 ＋ 补遗 ＋ 融合轮**正文（约 337 行）；③ **五段已闭环记录**（官方 DSH 桌面端事件 ／ 行尾统一 ／ QODER.md 自检 ／ CVM 续费改订 ／ 任务拆分原则核对）。**清理前核过（无孤儿）**：3.4-R 全部交付物已并入 **`docs/dsh/dsh-34-ref-research.md` §11**（抽查 §11.2 候选池 ／ §11.4 通道对照〔含 Qoder 独家增量行〕／ §11.6 分歧点 ／ §11.7 版本观察 ／ §11.9 未决项，均见本路贡献承接）；事件记录三事实已入记忆（`official-dsh-desktop-client`）；行尾规则由 `.gitattributes` 自解释；CVM 新到期已落 `production-env.md` ／ `TODO.md`。回溯：`git log -p -- exchange/log-qoder.md`。

- **2026-10-09（第二轮 · 当日闭环追删）**：删除两段 —— ① **〈办理 · 观察 #1 ＋ 0.3 阈值追查〉**（约 14 行）：#1 口径 3 处已改（`0a39e52`）；0.3 链条留档 ＝ git 史（`a0399a0` ／ `8575288`）＋ 代码现值（`engine.py:44`）＋ 讨论原文（`archive/` 两件互指）；**B 项（HUMAN.md 补注）经老大 2026-10-09 裁「不管了」关闭** ⇒ 全段闭环。② **〈`S381_KEEP_HOME` 回应〔WB 代笔〕＋ 追记 ①–⑧〉**（约 44 行）：全链闭环（裁 (a) → WB 落 `2c86bd9` → 复核 `a4c13b5`）；`larry-34t-IMW2Xf` 残件由老大亲自处理。**清理前核过（无孤儿）**：S381 载体 ＝ `TODO.md:227`（关闭条；其溯源指针已同步补「已清理·回溯」批注）＋ `.workbuddy/memory/2026-10-09.md` ＋ git 三提交；本区 ④#1 行对〈办理〉段的旧指针已同步改写。⚠️ 同批两条「老大裁『不管』」（维持现状、不再跟踪）：HUMAN.md 观察项补注 ／ `qoder-git-hooks-*` 空目录（245 个）。回溯：`git log -p -- exchange/log-qoder.md`。

- **2026-10-13 清理**：删除四段正文 —— ① **WB〈转办 · 文档/表述层事项〉**（甲乙丁六项已全部办结；承接＝`docs/product-positioning.md` 2.4.2 ／ 2.7.1 ／ 2.7.2 ＋ `docs/ai-governance.md` §3 ＋ 三处注释（`backend/tests/test_embedding*.py` ／ `backend/memory/engine.py` ／ `backend/tools/shell.py`）＋ 该区变更记录行；段内**丙组三条待裁**提炼进上方〈未结项〉第 11 条，**编号对齐**（WB 序列 ①②③ ↔ 我自编号）已在 `exchange/log-workbuddy.md` 记档）；② **〈职责变更〉＋〈回报〉**（职责权威落点＝`docs/ai-governance.md` §3 ＋ `.qoder/rules/QODER.md`，老大已写入；段内 **`server.api_key` A/B 两案**提炼进〈未结项〉第 10 条，并同步落 `exchange/deployment-architecture.md` §五）；③ **WB〈技能抽离移交〉五份浓缩稿**（⭐ 承接＝**用户级技能库七份**，在仓外 `C:\Users\SuLarry\.qoder\skills\`、不入 git：`doc-archive-slimming`／`doc-proposal-application`／`doc-governance-recheck`／`doc-sunset-handoff`／`verifiable-criteria-design` ＋ 自加 `claim-source-verification`／`scope-change-sync`，**均为改写而非复制**；日后若要 WB 原文细节，由老大开口让 WB 贴全文——它侧原文在 `~/.workbuddy/skills/`，我读不到）；④ **〈技能库落地〉段 ＋〈待改文案〉A–E**（A／B 已由老大贴入 `QODER.md` ⇒ 闭环；C／D／E 未落 ⇒ 改写进〈未结项〉第 12 条保留）。同批把〈在飞任务〉两行闭环块收拢为「本区无在飞块」。⚠️ **工具坑记档**：`skill_manage` 的 `patch` 要求唯一匹配，整行长串易报 `NOT_UNIQUE`，取句中独特短串即成。⛔ 未另存物理备份。回溯：`git log -p -- exchange/log-qoder.md`。

---
