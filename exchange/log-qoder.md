# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---


## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| — | — | — | ✅ **本区无在飞块** —— WB 转办〈文档/表述层事项〉（甲 3 ＋ 乙 2 ＋ 丁 1）已办结并落 docs ／ 代码注释；〈技能抽离移交〉五份浓缩稿已吸收进用户级技能库 ⇒ 承接见下方〈已清理段落〉 | — |

- ✅ **2026-10-14〈全量职责巡检 · 职责专轮〉已办结**（老大令「全面检查我自己的职责在约束／记忆／文档中是否一致」）⇒ 报告见下方〈全量职责巡检报告（2026-10-14）〉。产出：**repo 侧 5 条待裁／待办**（本区未结项 **14–18**，其中 14 归 WB、15–18 归老大）＋ **记忆层 9 处不一致**（我的载体、本轮已自改，见报告 ⑤）。
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
> ⭐ **已消沿革**：第二刀（09-30）／「3.4-T 状态行滞后」（09-30）／#6 活指针（10-09）／#1–4・7–9（10-09 批）／**#12① WB log 旧自述**（10-14 实测：WB 已自改，语义与建议文案一致）。
> 详细证据 ／ 建议 ／ 合规对照见下方〈全量职责巡检报告（2026-09-30）〉（09-30 快照；本批已办项以此清单为准）。

5. **`TODO.md` 精简**：第二刀 ✅（09-30）；**第三刀**（`DSH-3 · 贯穿规则` 迁 `docs/`）按原裁**等 DSH-3 完成后议**。

10. **`server.api_key` 是否现在就设（待裁）**：设前实测出新前提——`client/` 全仓无任何 Bearer 注入通道（grep `Authorization|Bearer|api_key` 零命中）⇒ **直接填 key 会让现态 `/api/` 全部 401**；「运行期填 Key ＋ Bearer 注入」是方案 §4.2 的未实现改造点。两条路：**(A)** 设 key ＋ 派 Trae 补 `client/src/api.ts` 与 `client/chat.html` 的 Bearer 头（一次闭环）；**(B)** key 只写 prod profile（`LARRY_CONFIG` 通道），dev 现态不动、上云时天然生效。口径已落 `exchange/deployment-architecture.md` §五〈待裁〉。

11. **代码行为层三条（待裁，⛔ 勿顺手改）**：① `backend/tools/shell.py` POSIX 超时只杀 `/bin/sh` 壳（未设 `start_new_session` ⇒ 孙进程可存活），真改要 `os.killpg` 且只能 CVM 侧验；② 同工具 `description` 声明 PowerShell／Bash，实测壳为 cmd.exe／/bin/sh ⇒「改声明」或「改实现」二选一；③ `rag/vector_store.py:107` 默认 `0.5` 与 `memory/engine.py` 默认 `0.3` 不一致（现因调用方显式传参未致错）。文档面已在册（`docs/product-positioning.md` 2.4.2 ／ 2.7.1 ／ 2.7.2）。

12. **WB 侧职责同步（2026-10-13 我实地读了 `~/.workbuddy/skills/`，逐件核过）**：⛔ 那些文件我无写权，此处只列实况与建议。
    - ✅ **已自改完（无需再动）**：`archive-closed-todos`／`apply-proposal-to-doc` 正文顶部均标「执行权移交 Qoder，WB 不再执行；本文件留作移交吸收 ＋ 复验对照」；`doc-sunset-handoff` 已换新权限矩阵（`log-*` 归本人 ／ 讨论稿·`docs`·`archive`·`exchange/README` 归 Qoder ／ `TODO.md` 归 WB 只改标记 ／ 根 `README.md` 暂记 Qoder）并明文作废旧矩阵；`dispatch-ai-task` 末节已改为「后三者执行权归 Qoder，WB 仅在清理自己 `log-*` 时用 `doc-sunset-handoff`，其余作复验对照」。**⇒ 我此前那条「WB 两 skill 编的是旧分工待定」的判断已按实测撤销**。
    - ⚠️ **仍差两处**（10-14 实测：① 已消、③ 已裁，唯 ② 原文未动）：
      ① ~~**`exchange/log-workbuddy.md`〈在飞任务〉末行**仍是旧自述（把「维护 `docs/`」列为 WB 常态工作）~~ ⇒ ✅ **已消（10-14 实测复核）**：WB 已自改，现头部行写「属主 = WorkBuddy ＋ 规划／统筹／分派／复验 ＋ 维护 `TODO.md` ＋ 清理 `log-*`」，〈在飞任务〉末行亦已改为「`docs/` ／ `archive/` ／ 讨论稿已归 Qoder（WB 不亲自改，只暴露 ＋ 备精确改法）」⇒ 与建议文案语义一致，无需再动。
      ② ⚠️ **10-14 实测仍未改** —— `~/.workbuddy/skills/verify-ai-delivery/SKILL.md` 的 **S7〈输出〉仍只有三块**（判定 ／ 独立复核过的 ／ 增量＋待拍），没有"复验通过之后"的下游动作 ⇒ **闭环链在这一环仍会断**（WB 标完 TODO 不会通知我做 docs 同步）。建议加第 4 块：
      > `4. **下游动作**（复验成立即执行，不排队）：① 在 `TODO.md` 把该条目标 `[x]` 并补必要说明；② **通知 Qoder 做文档面同步**（一体两面：docs 的结论／判据／验收基准须按执行实况修正）；③ 若该条属某阶段收尾 ⇒ 一并通知**归档**（阶段块 → `archive/roadmap-history.md`）。⚠️ 通知写在本区状态行或 TODO 条目旁注，⛔ 只口头不落地会静默漏同步。`
      ⛔ 该文件在 `~/.workbuddy/`（我无写权、且属 WB 私有）⇒ **需老大开口让 WB 自贴**。
      ③ ~~**根 `README.md` 归属**：WB 按旁证暂记 Qoder 维护，待老大确认或改判。~~ ⇒ ✅ **已裁：归 Qoder**，并落进 `docs/ai-governance.md` §3 新增的〈文件归属表〉（该区唯一权威落点；`archive/README.md` 与 `exchange/README.md` 的维护方行已加指向本表的指针）。WB 侧把 `doc-sunset-handoff` 权限矩阵里"根 README：Qoder（若老大另有裁定从其）"的条件句去掉即可，归属已定。

13. **老大自有文件的未提交改动**：`.qoder/rules/QODER.md` 的新可写区与两条职责由老大写入、**尚未提交**（我不代提）；`HUMAN.md` ／ `HUMAN_NOTE.md` 归老大自处。⚠️ **10-14 复核仍在途**（`git status --short` → `M .qoder/rules/QODER.md`）——与项目原则 4「严格版本管理」相抵，建议尽早提交。

14. **`TODO.md:209` 旧分工残留（归 WB 改，附可粘贴文案）**：现文把 **`docs/` 维护**记在 WB 名下 ——
    > `- **3.9 收口核对表 / `docs/` 维护 / 复验他人结论** → **WB**`
    与现行六处口径冲突（`docs/ai-governance.md` §3 归属表 ／ `docs/README.md`:5 ／ `README.md`:209 ／ `archive/README.md`:5 ／ **WB 自己 log 头部 10-14 版**均写 docs 归 Qoder）。⚠️ **这不是无害的措辞**：它是「一处两面跨两人」的接缝点 —— WB 若按此行理解，会继续认为文档面由它自己改，而我在等它通知；闭环链会**静默空转**（同 #12② 的病根）。建议改：
    > `- **3.9 收口核对表 ／ 复验他人结论** → **WB**；**`docs/` 维护（文档面同步 ＋ 阶段归档）→ Qoder**（归属表见 `docs/ai-governance.md` §3）`
    ⛔ `TODO.md` 归 WB（我只在阶段归档时搬块），**未自改**。

15. **`log-*` 的「谁能改／谁能清」口径三档不一（待老大裁，定了我一次同步）**：同一件事五处写法强度不同 ——

    | 载体 | 现文 |
    |---|---|
    | `exchange/README.md`:4 | WB「有权在本区各 log 文件中派发任务，**或根据需要修改内容**」（**最宽**：可读作能改他人 log 正文） |
    | `exchange/README.md`:5 | 清理主体写的是**老大**（原文有衍字：「老大**会对不定期**对交流区进行清理…」⇒ 本轮已顺手改错别字，语义未动） |
    | `exchange/README.md`:6 | 「老大可以**直接（或要求 WB）**对本区文件进行干涉」（＝间接授权 WB，但未定义范围） |
    | `docs/ai-governance.md` §3 归属表 | 「各 AI 自己｜他方只可新增内容派发；**WB 有权派发与干涉**」（"干涉"未定义） |
    | `exchange/log-workbuddy.md` 头部（10-14 版） | WB 职责**明列**「**清理 `exchange/log-*`**」 |
    ⇒ 待裁：**清理主体是 WB 还是老大／WB 能否改他人 log 正文（还是只能删已闭环段）**。⛔ **自纠一处**：我草拟时曾把 `TODO.md` 治理约定也列为"WB 清理 log-*"的出处，实测该文件**未载此项**（它只写 WB 管 TODO 增改标、Qoder 管搬块）⇒ 已从表内删除。我的倾向＝按 §3 表收一处权威、其余只留指针，建议文样：
    > `| `exchange/log-*.md` | 各 AI 自己 | WB 有权派发、干涉与**定期清理已闭环段**；其余 AI 只可新增派发内容；老大保留不定期复核清理权 |`
    定了之后我改 §3 ＋ `exchange/README.md`（两份都在我可写区），并把 README 的重复表述换成指针。

16. **Qoder 侧「载体」在治理文本里无处索引（待老大裁，属新增一行而非改行为）**：`docs/ai-governance.md` §3〈文件与载体〉只写了 Claude／Trae／Qoder 的**约束文件**与 WB 的 `MEMORY.md`，**没有一处记载**：① 我的工作法落在**用户级技能库** `~/.qoder/skills/doc-*`（7 份，仓外、不入 git）；② 我的记忆载体在 `~/.qoder/projects/…/memory/`（同样仓外）。后果：其他 AI 或新会话想按图索引「Qoder 的操作纪律」时**查无此处**，只能撞见约束文件里那几行（那里按设计不写流程）。⚠️ 顺带一条张力：项目原则 4 是「严格版本管理」，而这两类载体**天然不入 git**（平台机制决定，非我可改）。建议 §3 载体行补：
    > `- **Qoder**：`.qoder/rules/QODER.md`（约束，入 git）＋ **用户级技能库** `~/.qoder/skills/`（工作法载体）＋ **auto-memory** `~/.qoder/projects/<proj>/memory/`（记忆载体）——后两者**在仓外、不入 git、跨会话共享**；流程细节按设计不进约束文件。`

17. **HUMAN_NOTE 给我的「宏观观察／把控」职责未进治理文本（待老大裁）**：`HUMAN_NOTE.md`:19 写「负责文档一致性观察和维护，**同时辅助用户进行项目的宏观观察、把控与管理**」，:7（Marvis 条）又写其退出后「职责由用户本人接替，**Qoder 进行一定的辅助**」；而 `docs/ai-governance.md` §3:56 写 Marvis 的「外部审计」生态位**随之不再单设**，`README.md`:209 与 §3 归属表里的我**只有文档面 ＋ 讨论稿主持 ＋ 归档**。⇒ 三种记法并存：一条只在**不列入频繁读取**的零散记录里、一条说该位已撤、一条根本不含该职责。我的倾向＝**不升格为常设职责**（守 §0「机制只保留低成本高收益」，也避免与 WB「架构把关」重叠），把 HUMAN_NOTE 那句理解成约束文件里已有的「老大临时派发的一些特殊任务」；若老大认为该辅助是**长期常态**，则应写进 `.qoder/rules/QODER.md`〈职责重点〉一行（文案我可备）。⛔ 两份 HUMAN 文件归老大，我不动。

18. **`.qoder/rules/QODER.md`〈可写区〉缺「TODO 搬块」例外（归老大贴）**：现行〈行为准则〉可写区只列 `docs/` ／ `archive/` ／ 讨论稿 ＋ `log-*` 各自 ／ 各级 README，而〈职责重点〉要求我**把阶段块从 `TODO.md` 搬进** `archive/roadmap-history.md` —— 搬块必然删改 `TODO.md`（可写区未授权的文件）。例外目前**只写在** `docs/ai-governance.md` §3 归属表 TODO 行的"边界"列（「Qoder 仅在阶段归档时搬块」）。⇒ 建议可写区加一行指针，免得日后被判越界：
    > `  - `TODO.md` — **仅限阶段归档时搬块**（新增／标完成／加说明仍归 WB；权威表述见 `docs/ai-governance.md` §3 归属表）`

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
  > ⚠️ **10-14 订正（权限行过期，其余叙述保留）**：本行「`docs/` 属 AI 不动区」是 **09-30 当时口径**；现行分工下 **`docs/` 维护方＝Qoder**（权威表述见 `docs/ai-governance.md` §3 归属表），上述批注已于 **10-09 经老大授权「直接处理」办完**（未结项 #1 已结）。⇒ 读本报告时按此替换权限前提，**⛔ 勿再据此把 docs 区改动上报待裁**。

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

## 📋 全量职责巡检报告（2026-10-14 · 职责专轮）

> **命令来源**：老大「全面检查你自己的职责在各种约束、记忆、文档中是否存在不一致之处」。
> **主轴**：以「**Qoder 岗位职责**」为单一主题做全载体横切（变更点驱动：10-09 批量办理批 → 10-13 职责变更＋技能库建立批 → 10-14 WB 区头部改写批）。
> **方法（可复算）**：① 目录 × 索引逐条比对；② node 内联死链脚本（扫 `](path)`，双基准解析）；③ `git grep` 关键词集（`文档一致性` 34 处／12 文件、`一体两面` 32 处／18 文件、`主持.*Qoder` 5 处／5 文件、`归档进` 4 处／3 文件、`维护方`／`AI 不动`）；④ 记忆层逐文件读（两份 `MEMORY.md` ＋ 项目／用户作用域 12 条相关条目）；⑤ 跨读 WB 侧载体（`.workbuddy/memory/MEMORY.md` ＋ `~/.workbuddy/skills/verify-ai-delivery`，**只读**）。
> **只读巡检**：本轮**未改任何被查文件**（仅改本区 ＋ 我自己的记忆载体）。

### ① 索引一致性 —— ✅ 全对，零缺项零悬空
- `docs/README.md` 7 条 ↔ `docs/` 实际 7 件（`README`／`ai-governance`／`production-env`／`test-env`／`local-env`／`product-positioning`／`ui-reference` ＋ `dsh/` 目录行）✓
- `docs/dsh/README.md` 11 条 ↔ 实际 11 件 ✓（09-30 报告 ① 的缺项已补，`dsh-34-ref-research.md` 在列 ✓）
- `archive/README.md` 5 条 ↔ 实际 5 件 ✓（含 10-09 老大归置的 QW 两件互指条目）
- `exchange/README.md` 6 日志 ＋ 3 讨论稿 ↔ 实际 ✓（`log-marvis` 已除名、`log-other` 在列）
- 根 `README.md` 文档导航段 ＋〈多 AI 协作〉角色行 ↔ §3 归属表 ✓（唯 `TODO.md:209` 见未结项 **14**）

### ② 死链 ／ 引用 —— ✅ 真实断链 0
- 覆盖 **41 个 md**，markdown 链接 **102 处**，未解析 **102 处**，**逐条判定后全部属三类非本仓链接**：
  - `archive/qoder-work-historical-record.md` **61 处** —— 锁定区内嵌的上游引文 ＋ QW 时代记忆条目相对链接（`qoderwork-memory-*.md` 现活在用户记忆目录、不在仓内）。⛔ 按 `archive/README.md` 规则**不改老报告**，只可批注 ⇒ 本轮**未动**。
  - `docs/dsh/dsh-agents-md.md` **39 处** —— 上游仓（`ref/dsh-bare`）内路径。⇒ **已由 10-09 新增的 `dsh/README.md` 规则 4〈上游路径默认口径〉覆盖**（即 09-30 报告 ② 的建议承接点），非本仓死链。
  - `exchange/log-qoder.md` **2 处**（`](path)`／`](…)`）—— 我自己写的**扫描方法说明文字**，假阳性。
- 数字对照：09-30 报告记「39 处／全在 `dsh-agents-md.md`」——现该文件仍 39 处（未变），总量因 10-09 归档 QW 记录而升至 102。**该报告是带时间戳的快照**，不复用其计数当现态。

### ③ 过期陈述抽查（职责口径 · 变更点驱动）
**A. 一致项（逐字核过，六／七处同口径，无需动）**
- **任务闭环链**：`.qoder/rules/QODER.md`〈职责重点〉／`docs/ai-governance.md` §3〈任务闭环〉／`README.md`:209／`docs/README.md`:5／`archive/README.md`:5／`TODO.md`:4-5／`exchange/log-workbuddy.md` 头部 —— **七处一致** ✓（含「WB 标完成 → Qoder 同步 docs → 阶段归档 roadmap」的顺序与主体）。
- **讨论稿主持流程**：QODER.md:31／§3 归属表:85／`exchange/README.md`:19／三份稿头部（`deployment-architecture`／`discussion-time-context`／`web-search-design`）／`product-positioning.md`:413 —— **口径逐字一致**（各方发言 → 主持与老大吸收 → 无异议定稿 → 去痕迹 → 移入 `docs/`）✓
- **可写区**：QODER.md〈可写区〉↔ §3 归属表 ↔ 技能 `doc-consistency-audit` §四 权限行 —— 一致 ✓。`.claude/CLAUDE.md`／`.trae/TRAE.md` 把 `docs`／`archive` 列为只读，**与现行分工不冲突**（§3 表正是「其他 AI 发现问题 ⇒ 暴露 ＋ 备改法，不擅改」）✓
- **环境整理类归口**：QODER.md:19〈另承接〉↔ `TODO.md`:210／:226「历史归口 Qoder」✓
- **插件清单职责**：QODER.md:26 ↔ `docs/dsh/README.md`:11「Qoder 维护、老大触发制」↔ 记忆 `dsh-plugin-catalog-duty` ✓
- **Tier 0 四条**：五份载体（CLAUDE／TRAE／QODER／WB `MEMORY.md`／§2 总纲）逐字一致 ✓（末句括注各写自己场地的指向，属"刻意复制"设计内差异）。

**B. 不一致项（⇒ 已提进未结项 14–18，此处只列编号对应）**
- **14** `TODO.md:209` 仍把 `docs/` 维护记为 WB —— 六处冲突，**影响闭环接缝**（不是纯措辞）。
- **15** `log-*` 的「谁能改／谁能清」在 4 份载体上三档强度不一。
- **16** Qoder 的**技能库 ＋ 记忆载体**在治理文本里无处索引（§3〈文件与载体〉只有约束文件一行）。
- **17** `HUMAN_NOTE`:7／:19 给我的「宏观观察／把控辅助」未进任何治理文本，且与 §3:56「Marvis 生态位不再单设」并读含混。
- **18** QODER.md〈可写区〉未列「阶段归档时对 `TODO.md` 搬块」例外（例外只在 §3 表的边界列）。
- **13（复核）** QODER.md 的新可写区 ＋ 两条职责 **仍未提交**（`git status` → `M .qoder/rules/QODER.md`）。
- **表述层（低优先，未单开条目）**：`docs/dsh/README.md`:4 把 `dsh-pysdk-probe-qoder.md` 署为 **QoderWork**（正文头亦写 QoderWork、日期 09-08，早于 09-16 并入）⇒ **文件名与署名不一致**；⛔ 不建议改名（`dsh-migration.md`:821 以 `probe-qoder` 为引），可只在索引行加「（QW 时代产物）」注。

### ④ 旧发现复核（09-30 报告遗项 ＋ `HUMAN.md` 观察四条）
- **09-30 报告 ③B 权限行已过期** ⇒ 本区正文已就地加**订正注**（见该段下方「10-14 订正」），原叙述未改。
- **#12①**（WB log 旧自述）⇒ **已消**（实测 WB 10-14 已自改，语义等价）；**#12②**（`verify-ai-delivery` S7 无下游动作块）⇒ **实测仍未改**，闭环链在这一环仍会断 ⇒ 保留，需老大开口让 WB 自贴（我无写权）。
- `HUMAN.md`〈Qoder观察到的问题〉：**#1 已按新口径落地三处**（`README.md`:145／`product-positioning.md`:251／:271 实测复核 ✓ 统一为「加 provider 段零代码 ＋ 加模型登记一行映射」），但该节现文仍以"待处理问题"叙述 ⇒ 老大自有文件、只提醒；**第 4 条（`auth.py` 非恒定时间比较）丢了序号**（:42 行首无编号，与 :39-41 的 1.2.3. 不同形）；**#3**（`server.host/port` 死配置）与 `README.md`:147 警示一致 ✓。
- 未结项 **#10／#11**（`server.api_key` 两案 ／ 代码行为层三条）状态未变 ⇒ 继续挂起。

### ⑤ 记忆层不一致（我的载体，**本轮已全部自改**）
巡检把记忆当被查面对了一遍，发现 **9 处**与现行分工／实况不符或已过时（危害方向＝**下次开工按旧边界行为**）：
1. `qoder.md` —— 与 QODER.md／§3 一致 ✓（唯一无需改的核心条目）。
2. `qoder-methods-as-skills.md` —— **自相矛盾**：上半写「已建成 7 份」，下半〈遗留〉〈风险〉仍写「五份浓缩稿只在 `log-*`、下次开工第一件事是取到稳定载体」；而该段正文 10-13 已清理 ⇒ 已订正。
3. `larryagent-multi-ai-collaboration-governance-model.md` —— 角色清单**漏 Qoder**，仍列 Marvis 在职（09-29 已退出），无归属表／闭环 ⇒ 已补并改指向 §3。
4. `qoder-qoderwork.md` —— 「Qoder 与 QoderWork **完全无关联**、全新角色、无历史包袱」过绝对：与 `HUMAN_NOTE`:13／:19（09-16 并入 ＋ 升级）、`dsh/README.md`:18 与 `dsh-migration.md`:425（**QW 的「二等」即最终口径、我入职后一直沿用**）、技能坑 #8（P0~P2 素材在 `archive/qoder-work-historical-record*.md`，先查它）三处张力 ⇒ 已改写为「不同会话与上下文，但承接其结论与史料」。
5. `important-decision-experience-c5f6f65c.md` —— 「拒绝打包授权／编辑权需复验／定案权留用户」＋「角色＝事实对账员 ＋ 瘦身执行者」＋「先跑 docs **vs code** vs TODO 三方对账」：现行边界已扩（四区直接改并 commit、改完回报；**代码一致性明确不在职责内**，仅高风险才读）⇒ 已加时限定性注。
6. `ai.md` —— 「每个 AI 角色**必须**有纳入版本控制的约束文件 ＋ 持久化记忆载体」与 §0「**对称不是目标**」＋ §3「Marvis 不进约束体系」对撞；实况亦非"都入库"（我的技能库与记忆在仓外）⇒ 已订正为按风险面 ＋ 加实况。
7. `exchange-reference-rule-application.md` —— 「正面内容引用 `exchange/` ⇒ **真违规**」已被老大 **10-09 裁定「讨论稿引用保留」**（`docs/README.md`〈例外二〉＋ `TODO.md`:11）部分推翻；原三分口径仍适用于 `log-*` ⇒ 已改为「四分：`log-*` 才算违规 ／ 讨论稿可引（须标未定案 ＋ 定稿同批改指）」。⚠️ 不改的后果＝我把合法引用反复当违规上报。
8. `memory-system-capacity-check.md`（用户级）—— 基线数字过期（原记 user 18 行／2.2KB、project 32 行／4.6KB）⇒ 刷新为**本轮改后终值：user 35 行／5435 B、project 37 行／6050 B（合计 11.5 KB）**；仍远低于 ~30 KB 警戒参照。⚠️ 顺带记一条增长成因：**我给指针行写长了 hook** ⇒ 瘦身时优先压 hook 长度，不删条目。
9. **`qoderwork-memory-eb26c884e032.md`（用户级「LarryAgent exchange 文档协作与表态惯例」）—— 口径已废 ＋ 作用域错放**：原文写「`exchange/*.md` 中**结论区由 WB 维护**」（现行＝**讨论稿主持＝Qoder**，10-13 起只换主持人、流程不变）＋「我的区块名可能是『**QoderWork（编外但可阅读项目工程）**』」（已无此身份）＋ 靠 `:204`／`:267` 这类**行号引用**定位能力树。且内容全属**本项目专属**，却存于 USER 作用域。⇒ 处理：**订正后迁成 project 条目** `capability-tree-and-change-log-conventions.md`（能力树 `2.3`–`2.10`＝域一–域八 ＋ §4〈变更记录〉表署名留痕 ＋ 讨论稿结论区现由我综合），旧文件已删、两份 `MEMORY.md` 索引行已同步。
- ⛔ 未动的条目：`project-documentation-system-*` 两条（属**任务史实记录**，其文件清单含已不存在的 `exchange/capability-tree-revision.md` ⇒ 作为历史不必改，但**不得当现态引用**）。另有观察（不本轮处理）：user 作用域仍有 3 条纯项目条目（`qoderwork-memory-4bd240ff3468` 技术实现约定／`-43bc757b330f` Web 搜索约定／`-55290e151c05` DSH 包清单权威源）⇒ 按路由规则宜迁 project 作用域；**要不要迁请老大示下**，我不做无谓搬家。

### ⑥ 结构与精简判定
- **体量**（`du -sk`）：`docs` **856** ／ `archive` **3300** ／ `exchange` **169** ／ `TODO.md` **56** ／ `README.md` **16**。⇒ 与 09-30 报告（archive 208K）相比**激增源于单件 `qoder-work-historical-record.md` = 3.10 MB**（老大 10-09 归置，占归档区 94%）。
  观察（不提案）：① 该件是**冷历史**、落位正确（`archive/`），但**未标"永久保留"**（区别于 `docs/dsh/` 规则 2）；② 它内嵌 10 条 `qoderwork-memory-*.md` 链接 ＋ 记忆正文 ⇒ 与仍在演化的 `~/.qoder/memory/` 构成**双写**（同一内容两处、只有一处会更新）。⚠️ 两者都**不属我可处置**：锁定区不改叙述 ＋ 记忆载体在仓外 ⇒ 仅登记观察。
- **`TODO.md` 精简（未结项 #5）**：现 54.5 KB／43 个未勾项；「第三刀」（`DSH-3 · 贯穿规则` 迁 `docs/`）仍按原裁**等 DSH-3 完成后议** ⇒ 本轮无新增精简提案。
- **本轮无删除候选**：`docs/` 各区索引一致、`exchange/` 讨论稿三件仍"未定案"（按 10-09 裁定保留）、`archive/` 锁定。

### ⑦ 本轮边界
- 只读；未改任何被查文件（仅本区 ＋ 我的记忆载体）。未复核 `backend/`／`harness/` 与文档的全面一致性（职责外；仅按 `HUMAN.md` 旧发现抽查 3 条）。
- 未做：反引号路径全量存在性扫描（噪声大，历史决定抽查）、`config.example` 漂移复核（09-30 遗项）、QW 3.1 MB 记录的内容级复核。
- 记忆层判定基于当前两份 `MEMORY.md` ＋ 12 条相关条目全文；**未逐条读尽 36＋37 条**。

@老大 —— **14／15／16／17／18 五条等你裁**：14 归 WB（我已备可粘贴文案，需你开口）；15 需你定"清理主体能否改他人 log 正文"，定了我一次同步 §3 表 ＋ `exchange/README.md`；16／18 是各加一行（18 归你贴进 QODER.md）；17 我倾向**不升格**、按「临时派发」理解，你若认常设我备文案。



---

## 🗂 已清理段落（按交流区规矩）

- **2026-10-09 清理**：删除已闭环内容三批 —— ① `DSH-3.4-R` **派发稿**（23 行）；② `DSH-3.4-R` **调研报告 ＋ 补遗 ＋ 融合轮**正文（约 337 行）；③ **五段已闭环记录**（官方 DSH 桌面端事件 ／ 行尾统一 ／ QODER.md 自检 ／ CVM 续费改订 ／ 任务拆分原则核对）。**清理前核过（无孤儿）**：3.4-R 全部交付物已并入 **`docs/dsh/dsh-34-ref-research.md` §11**（抽查 §11.2 候选池 ／ §11.4 通道对照〔含 Qoder 独家增量行〕／ §11.6 分歧点 ／ §11.7 版本观察 ／ §11.9 未决项，均见本路贡献承接）；事件记录三事实已入记忆（`official-dsh-desktop-client`）；行尾规则由 `.gitattributes` 自解释；CVM 新到期已落 `production-env.md` ／ `TODO.md`。回溯：`git log -p -- exchange/log-qoder.md`。

- **2026-10-09（第二轮 · 当日闭环追删）**：删除两段 —— ① **〈办理 · 观察 #1 ＋ 0.3 阈值追查〉**（约 14 行）：#1 口径 3 处已改（`0a39e52`）；0.3 链条留档 ＝ git 史（`a0399a0` ／ `8575288`）＋ 代码现值（`engine.py:44`）＋ 讨论原文（`archive/` 两件互指）；**B 项（HUMAN.md 补注）经老大 2026-10-09 裁「不管了」关闭** ⇒ 全段闭环。② **〈`S381_KEEP_HOME` 回应〔WB 代笔〕＋ 追记 ①–⑧〉**（约 44 行）：全链闭环（裁 (a) → WB 落 `2c86bd9` → 复核 `a4c13b5`）；`larry-34t-IMW2Xf` 残件由老大亲自处理。**清理前核过（无孤儿）**：S381 载体 ＝ `TODO.md:227`（关闭条；其溯源指针已同步补「已清理·回溯」批注）＋ `.workbuddy/memory/2026-10-09.md` ＋ git 三提交；本区 ④#1 行对〈办理〉段的旧指针已同步改写。⚠️ 同批两条「老大裁『不管』」（维持现状、不再跟踪）：HUMAN.md 观察项补注 ／ `qoder-git-hooks-*` 空目录（245 个）。回溯：`git log -p -- exchange/log-qoder.md`。

- **2026-10-13 清理**：删除四段正文 —— ① **WB〈转办 · 文档/表述层事项〉**（甲乙丁六项已全部办结；承接＝`docs/product-positioning.md` 2.4.2 ／ 2.7.1 ／ 2.7.2 ＋ `docs/ai-governance.md` §3 ＋ 三处注释（`backend/tests/test_embedding*.py` ／ `backend/memory/engine.py` ／ `backend/tools/shell.py`）＋ 该区变更记录行；段内**丙组三条待裁**提炼进上方〈未结项〉第 11 条，**编号对齐**（WB 序列 ①②③ ↔ 我自编号）已在 `exchange/log-workbuddy.md` 记档）；② **〈职责变更〉＋〈回报〉**（职责权威落点＝`docs/ai-governance.md` §3 ＋ `.qoder/rules/QODER.md`，老大已写入；段内 **`server.api_key` A/B 两案**提炼进〈未结项〉第 10 条，并同步落 `exchange/deployment-architecture.md` §五）；③ **WB〈技能抽离移交〉五份浓缩稿**（⭐ 承接＝**用户级技能库七份**，在仓外 `C:\Users\SuLarry\.qoder\skills\`、不入 git：`doc-archive-slimming`／`doc-proposal-application`／`doc-governance-recheck`／`doc-sunset-handoff`／`verifiable-criteria-design` ＋ 自加 `claim-source-verification`／`scope-change-sync`，**均为改写而非复制**；日后若要 WB 原文细节，由老大开口让 WB 贴全文——它侧原文在 `~/.workbuddy/skills/`，我读不到）；④ **〈技能库落地〉段 ＋〈待改文案〉A–E**（A／B 已由老大贴入 `QODER.md` ⇒ 闭环；C／D／E 未落 ⇒ 改写进〈未结项〉第 12 条保留）。同批把〈在飞任务〉两行闭环块收拢为「本区无在飞块」。⚠️ **工具坑记档**：`skill_manage` 的 `patch` 要求唯一匹配，整行长串易报 `NOT_UNIQUE`，取句中独特短串即成。⛔ 未另存物理备份。回溯：`git log -p -- exchange/log-qoder.md`。

---
