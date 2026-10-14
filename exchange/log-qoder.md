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


> ⭐ **已消沿革（编号不重排；明细不留在本区，回溯 `git log -p -- exchange/log-qoder.md`）**：09-30 报告批 #1–4・6–9 ／ 未结项 #13–#26（14 直改 `TODO.md:209`、15 收口径进 §3、16 §3 载体行登记、17–18 老大自处、19–22 time-context 四条、23 我误推自消、24 甲案瘦身、25 §6 表头补依据／落点、26 缓删区债务由你后续整体过一遍）；连带两处表述层小项（`QODER.md`〈可写区〉同级 bullet 与 `:44` 缺 WB 清理权指针）经 §3 ＋ §3.2 分层尺兜住，不再单列。
> 本区**只留在办事**：下表状态区 ＋ 未结项 ＋ 通用纪律。已办结即删、不留指针（头部规矩）。

5. **`TODO.md` 精简**：第二刀 ✅（09-30）；**第三刀**（`DSH-3 · 贯穿规则` 迁 `docs/`）按原裁**等 DSH-3 完成后议**。

10. **`server.api_key` 是否现在就设（待裁）**：设前实测出新前提——`client/` 全仓无任何 Bearer 注入通道（grep `Authorization|Bearer|api_key` 零命中）⇒ **直接填 key 会让现态 `/api/` 全部 401**；「运行期填 Key ＋ Bearer 注入」是方案 §4.2 的未实现改造点。两条路：**(A)** 设 key ＋ 派 Trae 补 `client/src/api.ts` 与 `client/chat.html` 的 Bearer 头（一次闭环）；**(B)** key 只写 prod profile（`LARRY_CONFIG` 通道），dev 现态不动、上云时天然生效。口径已落 `exchange/deployment-architecture.md` §五〈待裁〉。

11. **代码行为层三条（待裁，⛔ 勿顺手改）**：① `backend/tools/shell.py` POSIX 超时只杀 `/bin/sh` 壳（未设 `start_new_session` ⇒ 孙进程可存活），真改要 `os.killpg` 且只能 CVM 侧验；② 同工具 `description` 声明 PowerShell／Bash，实测壳为 cmd.exe／/bin/sh ⇒「改声明」或「改实现」二选一；③ `rag/vector_store.py:107` 默认 `0.5` 与 `memory/engine.py` 默认 `0.3` 不一致（现因调用方显式传参未致错）。文档面已在册（`docs/product-positioning.md` 2.4.2 ／ 2.7.1 ／ 2.7.2）。

12. **WB 侧一处闭环缺口（待你开口让 WB 自贴；⛔ 文件在 `~/.workbuddy/`，我无写权）**：`verify-ai-delivery` 的 **S7〈输出〉仍只有三块**（判定／独立复核过的／增量＋待拍），缺「复验通过之后」的下游动作 ⇒ 闭环链在这一环会断（WB 标完 `TODO.md` 不会通知我做 docs 同步）。建议加第 4 块：
      > `4. **下游动作**（复验成立即执行，不排队）：① 在 `TODO.md` 把该条目标 `[x]` 并补必要说明；② **通知 Qoder 做文档面同步**（一体两面：docs 的结论／判据／验收基准须按执行实况修正）；③ 若该条属某阶段收尾 ⇒ 一并通知**归档**（阶段块 → `archive/roadmap-history.md`）。⚠️ 通知写在本区状态行或 TODO 条目旁注，⛔ 只口头不落地会静默漏同步。`
      ⛔ 需老大开口让 WB 自贴。｜**同批另两处已消**：① `log-workbuddy.md` 头部与〈在飞任务〉末行的旧自述（WB 10-14 已自改，语义与建议文案一致）／③ 根 `README.md` 归属（已裁归 Qoder，并落 `docs/ai-governance.md` §3 归属表）。

---

## 🗂 已清理段落（按交流区规矩）

- **2026-10-14（职责专轮清扫）**：删除本区已办结的账目三块 —— ① 状态区 16 条「✅ 已办结／🚫 已撤回／📝 补记」bullet（职责巡检 14–22、time-context 三行订正、README 标签、HUMAN_NOTE 重排复核、§4 断档补登、§5 第3条状态行、§5 第7条五点处置、ai-governance §3.2／§3.3 完善、`dsh-migration` §2.3 错引、`8dc94cc` 提交补记、行号失效声明、skill 三阶段史实改正）；② 未结项 **#24**（§3 载体行甲案瘦身，已落文件）；③ 两份〈全量职责巡检报告〉（09-30 ／ 10-14）＋〈事后复检〉三段。⛔ **未删**：未结项 5／10／11／12（活项，且各自自足不依赖报告）、通用纪律 5 条、活日志声明。✅ **承接核过**：结论与判据已落 `docs/ai-governance.md` §3〈文件归属表〉／§3.2／§3.3 ＋ 各区 README ＋ `TODO.md:209` ＋ 三份讨论稿头部；方法与坑已落技能（`doc-consistency-audit` 坑 9／11／11.1／12／13／15、`doc-governance-recheck` §五）；记忆层订正已落 `~/.qoder/projects/…/memory/`。⛔ 未另存物理备份，回溯：`git log -p -- exchange/log-qoder.md`（快照见 `16483a0`／`e33b6e9`）。

- **2026-10-09 清理**：删除已闭环内容三批 —— ① `DSH-3.4-R` **派发稿**（23 行）；② `DSH-3.4-R` **调研报告 ＋ 补遗 ＋ 融合轮**正文（约 337 行）；③ **五段已闭环记录**（官方 DSH 桌面端事件 ／ 行尾统一 ／ QODER.md 自检 ／ CVM 续费改订 ／ 任务拆分原则核对）。**清理前核过（无孤儿）**：3.4-R 全部交付物已并入 **`docs/dsh/dsh-34-ref-research.md` §11**（抽查 §11.2 候选池 ／ §11.4 通道对照〔含 Qoder 独家增量行〕／ §11.6 分歧点 ／ §11.7 版本观察 ／ §11.9 未决项，均见本路贡献承接）；事件记录三事实已入记忆（`official-dsh-desktop-client`）；行尾规则由 `.gitattributes` 自解释；CVM 新到期已落 `production-env.md` ／ `TODO.md`。回溯：`git log -p -- exchange/log-qoder.md`。

- **2026-10-09（第二轮 · 当日闭环追删）**：删除两段 —— ① **〈办理 · 观察 #1 ＋ 0.3 阈值追查〉**（约 14 行）：#1 口径 3 处已改（`0a39e52`）；0.3 链条留档 ＝ git 史（`a0399a0` ／ `8575288`）＋ 代码现值（`engine.py:44`）＋ 讨论原文（`archive/` 两件互指）；**B 项（HUMAN.md 补注）经老大 2026-10-09 裁「不管了」关闭** ⇒ 全段闭环。② **〈`S381_KEEP_HOME` 回应〔WB 代笔〕＋ 追记 ①–⑧〉**（约 44 行）：全链闭环（裁 (a) → WB 落 `2c86bd9` → 复核 `a4c13b5`）；`larry-34t-IMW2Xf` 残件由老大亲自处理。**清理前核过（无孤儿）**：S381 载体 ＝ `TODO.md:227`（关闭条；其溯源指针已同步补「已清理·回溯」批注）＋ `.workbuddy/memory/2026-10-09.md` ＋ git 三提交；本区 ④#1 行对〈办理〉段的旧指针已同步改写。⚠️ 同批两条「老大裁『不管』」（维持现状、不再跟踪）：HUMAN.md 观察项补注 ／ `qoder-git-hooks-*` 空目录（245 个）。回溯：`git log -p -- exchange/log-qoder.md`。

- **2026-10-13 清理**：删除四段正文 —— ① **WB〈转办 · 文档/表述层事项〉**（甲乙丁六项已全部办结；承接＝`docs/product-positioning.md` 2.4.2 ／ 2.7.1 ／ 2.7.2 ＋ `docs/ai-governance.md` §3 ＋ 三处注释（`backend/tests/test_embedding*.py` ／ `backend/memory/engine.py` ／ `backend/tools/shell.py`）＋ 该区变更记录行；段内**丙组三条待裁**提炼进上方〈未结项〉第 11 条，**编号对齐**（WB 序列 ①②③ ↔ 我自编号）已在 `exchange/log-workbuddy.md` 记档）；② **〈职责变更〉＋〈回报〉**（职责权威落点＝`docs/ai-governance.md` §3 ＋ `.qoder/rules/QODER.md`，老大已写入；段内 **`server.api_key` A/B 两案**提炼进〈未结项〉第 10 条，并同步落 `exchange/deployment-architecture.md` §五）；③ **WB〈技能抽离移交〉五份浓缩稿**（⭐ 承接＝**用户级技能库七份**，在仓外 `C:\Users\SuLarry\.qoder\skills\`、不入 git：`doc-archive-slimming`／`doc-proposal-application`／`doc-governance-recheck`／`doc-sunset-handoff`／`verifiable-criteria-design` ＋ 自加 `claim-source-verification`／`scope-change-sync`，**均为改写而非复制**；日后若要 WB 原文细节，由老大开口让 WB 贴全文——它侧原文在 `~/.workbuddy/skills/`，我读不到）；④ **〈技能库落地〉段 ＋〈待改文案〉A–E**（A／B 已由老大贴入 `QODER.md` ⇒ 闭环；C／D／E 未落 ⇒ 改写进〈未结项〉第 12 条保留）。同批把〈在飞任务〉两行闭环块收拢为「本区无在飞块」。⚠️ **工具坑记档**：`skill_manage` 的 `patch` 要求唯一匹配，整行长串易报 `NOT_UNIQUE`，取句中独特短串即成。⛔ 未另存物理备份。回溯：`git log -p -- exchange/log-qoder.md`。

---
