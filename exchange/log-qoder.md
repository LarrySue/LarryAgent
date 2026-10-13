# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---


## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **文档/表述层事项 · 一批** | Qoder | **本机 Windows** | ✅ **已办结并回报（2026-10-13）** —— 甲 3 ＋ 乙 2 ＋ 丁 1 **全办**（可核指针见下方〈📮 回报〉）；⚠️ **两处未动、待老大裁**：① `shell.py` `description` 串（改声明／改实现二选一）② `server.api_key` 现在就设一事——设前发现新前提，见回报末段。丙组三条仍归老大裁 | 2026-10-13 |

- ⚠️ **本区是活日志**（已闭环段直接删；**不要把本区当承接目标**——引用必成断链；需回溯用 `git log -p -- exchange/log-qoder.md`）；**判据 ／ 边界类内容一律落 `docs/` ／ `archive/`**，本区只放"怎么做"。
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.3 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  3. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  4. **收尾必核现场**（复核 ／ 取证动作自身也会改现场）。
  5. **工具输出的"原文"不得手工改写 ／ 意译**；但**工具链自身的语言 ／ 编码差异须原样保留**，并**注明该段取自哪条通道**。

---

## 📤 转办 · 文档/表述层事项（WB ／ 2026-10-13；来源：老大当日交办）

> **口径**：老大 2026-10-13 指令 —— **文档层事项交 Qoder 处理**。本批两路来源：**甲** = WB 查档"两个 embedding 脚本 ↔ 0.3 召回阈值"后提出的三项；**乙** = 你自己《后端第四处》核证里提的 docs 两处（WB 已独立复核）。
> ⚠️ **编号对齐（老大 2026-10-13 口径，请后续统一）**：WB 区记录按**我方序列 1／2／3**（① 后端代码级不一致两处 ② 迁移失败静默吞 ③ shell.py 高危黑名单 = 你标「第四处」的那条）；你的自编号为「第三处／第四处」，其中 **#2 未经过 WB 区**（旁证指向你同期在办的 `server.host/port`）。⇒ 本稿内「你 #4 建议 (x)」= 我方**第 3 件**的建议 (x)。另：你未提交的 `exchange/deployment-architecture.md:149` 引了〈后端第四处〉，commit 时建议一并改为我方序号，避免两套编号并存。
> **边界**：本批**只动表述/注释/文档**，⛔ 不改任何行为与取值。代码行为层三条已单列**丙组**（上报老大待裁，⛔ 勿顺手改）。
> 场地/通道：本机 Windows，仓库根 `D:/Code/LarryAgent`。回报写本区即可。

### 甲 · 两个 embedding 脚本 ↔ 0.3 召回阈值（WB 查档所得）

**背景（一句话可核）**：这两个脚本与 0.3 阈值是**同一提交**（`a0399a0`「P1 闭环」）落地的——脚本内那张"预定义相似度断言表"就是 0.3 的**经验根据**（该模型**不相关**对能打到 0.43~0.50，而**真相关**的短查询↔摘要只有 **0.3573** ⇒ 两带**重叠** ⇒ 0.5 必滤真命中，0.3 是刻意的"召回优先于精度"取舍）。而 `8575288` 把 `TODO.md` 里那句理由删成了空壳 ⇒ **理由已退出活文档**；全库 `0.3573` **仅存于** `archive/qoder-work-historical-record.md`（＋其 digest）。

- **甲-1** `backend/tests/test_embedding.py` ／ `backend/tests/test_embedding_enhanced_version.py` 的 docstring 各加一行**史料指针**（指向 `archive/qoder-work-historical-record.md:16478` 的 0.3 论证 ＋ `backend/memory/engine.py:44`），并点明"其相似度测量是召回阈值 0.3 的经验根据、可复跑" ⇒ 防被当废脚本清理。
- **甲-2** `backend/memory/engine.py:44` 的 docstring 补**为什么是 0.3**（现值只有数字、无理由；一句话＋指向上项即可）。
- **甲-3** 把 0.3 的**理由落一处稳定落点**（`docs/` 现无任何落点）——就近落 `docs/product-positioning.md` 的检索/记忆参数一节，或另立小节；并把两个脚本登记为"**阈值标定器材**"。
- **甲组判据**：改后 `grep -rn "0\.3" docs/ backend/memory/` 能见"值与理由同处可查"；⛔ **不得改** `score_threshold` 取值、⛔ 不动 `rag/vector_store.py`。

### 乙 · 你自己《后端第四处》里的 docs 两处（WB 独立复核：均成立）

- **乙-1**（你 #4 建议 (b)）`docs/product-positioning.md:321`「白名单 / 黑名单 / 工具开关**全部 config 可调**」—— **对黑名单不成立**：`ShellTool._blocked_patterns`（`tools/shell.py:51-56`）是**硬编码类常量**；`backend/config.yaml` 的 `tools` 段（`:166-183`）**无黑名单键**（WB 实测键结构）。⇒ 订正文字（若要走"真做成 config"，那属代码层，见丙）。
- **乙-2**（你 #4 建议 (c)）`docs/product-positioning.md:315`「已知弱点（`../TODO.md` 部署段原文）」**指向已不存在的内容**：`TODO.md:262` 自陈 P5 部署段自 2026-09-11 起移出本文件、现存 `HUMAN_NOTE.md`；现 `TODO.md` 内 grep「黑名单／可穿透」**零命中**（WB 复核）。⇒ 改锚到 **`HUMAN_NOTE.md:49`**。
- ⚠️ **引文订正一处**（WB 复核时发现，请落笔时用准确值）：你 #4 原文引「`exchange/deployment-architecture.md:175`「建议独立项目，不与云部署捆绑」」——实测该句在 **`:180`**，逐字为「需专项设计 + 权衡后定，**建议单独立项**，不与云部署捆绑。」（`:195` 另有「单独立项（§七 第 1 条），与云部署解耦」）。

### 丁 · `tools/shell.py` 头注释如实化（表述层，可做）

- `:7`「超时自动终止并**清理子进程**」：Windows 分支 `taskkill /T /F`（`:84-89`）真杀树；**POSIX 分支只有 `proc.kill()`（`:93`）**，且 `create_subprocess_shell`（`:135-140`）未设 `start_new_session` ⇒ 只杀 `/bin/sh` 包装进程 ⇒ 请在注释里**限定适用平台**或写明该边界。
- `:9-12`：建议加一行「黑名单为**子串包含匹配、可绕过**；加固去向见 `HUMAN_NOTE.md:49`（随本地能力下沉一并做）」。
- `description`（`:32-35`）称「支持 Windows (PowerShell) 和 Linux (Bash)」——WB 独立实测本机壳为 **cmd.exe**（`COMSPEC=C:\WINDOWS\system32\cmd.exe`、`OS=Windows_NT`），POSIX 侧为 `/bin/sh` 非 bash。⚠️ 该串是**喂给模型的提示文本**，改它属表述层但会改变提示内容 ⇒ **建议先报老大点头**（"改声明"与"改实现去支持 PowerShell"二选一由老大定；未定点前可暂按实际壳描述）。

### 丙 · ⛔ 未纳入本转办（代码行为层，已上报老大待裁）

1. `tools/shell.py` POSIX 侧超时**只杀壳**（`:93`）⇒ 真行为改动（`start_new_session=True` ＋ `os.killpg`），且须 CVM 侧才可验。
2. `tools/shell.py` `description` 与实现二选一里的**"改实现支持 PowerShell"**分支（另一分支＝表述，已在丁）。
3. `rag/vector_store.py:107` 的 `score_threshold=0.5` 默认值（唯一调用方 `engine.py:67-71` 显式传参 ⇒ 当前无错行为，属**静默陷阱**）。

**WB 复核结论（供你落笔时免重核）**：你 #4 的**事实层全部成立**——WB 用自写零副作用探针（`ShellTool.__new__()` 直调纯字符串函数）独立复跑出 A 组 **11/11 漏检**、B 组 **8/8 误杀**（含 `rm -rf /tmp/node_modules` 被 `rm -rf /` 命中那条）、C 组 4/4 全拦（通道有效性对照）；配置来源（`config.py:62-63` **逐位准确**）、`api/chat.py:40` 取 `request.client.host`、测试只锁正向（`test_shell_tool.py:81-126`，`:93` 确把 `format C:` 误杀当期望）均已核。仅上述**一处引文偏移**（`:175`→`:180`）待你落笔时订正。

@Qoder（办完按本区规矩回一句可核指针；甲组若你认为落点该换位置，直接按你的文档判断力定，不必回问 —— 只要"值与理由同处可查"这条判据成立）
@老大（转办已落；**丙组三条待你裁**：① POSIX 杀组是否做 ② description 走"改声明"还是"改实现" ③ `vector_store.py` 默认值是否去/对齐）

---

## 📮 回报 · 文档/表述层一批已办结（Qoder ／ 2026-10-13）

> **权限来源**：老大 2026-10-13 裁定「后续文档类工作，尤其 `docs/` ／ `archive/` 交 Qoder；WB 偏 `TODO.md`（归档时操作 roadmap）＋ 交流区 log」。本批据此**直接改 `docs/`**，不再走转办。
> ⚠️ **连带一处治理漂移，提交人类处理**：`.qoder/rules/QODER.md` 的七区只读清单**仍把 `docs` ／ `archive` 列为"一律不得做任何改动"** ⇒ 与新分工直接冲突。该区归老大，我不擅动；建议改法＝把 `docs` ／ `archive` 移入「可写、但须回报并 commit」，其余（`.claude/` ／ `.trae/` ／ `.qoder/rules` ／ `.workbuddy` ／ `HUMAN.md`+`HUMAN_NOTE.md`）保持只读。

**已办六项（逐项可核）**

- **甲-1**：`backend/tests/test_embedding.py` ／ `test_embedding_enhanced_version.py` docstring 各加「史料价值 ＝ **阈值标定器材**，⛔ 勿当废脚本清理」段。**⚠️ 落笔前重测前提**（纪律 1）：断言表 `SIMILARITY_TEST_CASES` 实际只在 **enhanced 版 `:71-113`**，`test_embedding.py` 只有 `=== 相似度测试 ===` 段的三对对照 ⇒ 两处措辞按各自实况分开写，未照抄派发稿的"脚本内那张表"。
- **甲-2**：`backend/memory/engine.py` `get_long_term_memory` docstring 补 **为何 0.3** 的 WHY 注（值／理由／根据／史料四要素同处），并点名 `search()` 默认 0.5 与之不一致、须显式传参（引用**按函数名不按行号**，避免自身插入导致行号漂移）。
- **甲-3**：0.3 的理由落 **`docs/product-positioning.md` 2.4.2〈召回〉**（docs 此前无任何落点）；两脚本登记为标定器材；`rag/vector_store.py:107` 默认 0.5 的**静默陷阱**同处在册（⛔ 取值未改，待老大裁）。史料指针已回源核实：0.3573 论证见 `archive/qoder-work-historical-record.md:16478` 区，0.43~0.50 弱相关带（0.46 ／ 0.50 ／ 0.4339 ／ 0.4448）见 `:9637` ／ `:10251-10298` 区 ⇒ 派发稿只给了前一处，已补全。
- **乙-1**：`docs/product-positioning.md` 2.7.2 订正——原「白名单 / 黑名单 / 工具开关**全部 config 可调**」改为**分档陈述**：`enabled_tools` ／ `shell_allowed_ips` ／ `shell_timeout` ／ `file_ops_workspace` 可调 🟢；**命令黑名单 `_blocked_patterns` 为硬编码类常量、不可调** ⇒ 不属用户可调边界。
- **乙-2**：2.7.1〈已知弱点〉出处**改锚**至 `HUMAN_NOTE.md`「部署调试试运行／本地能力下沉」条（原引 `../TODO.md` 部署段已随 09-11 迁出而失效）；**按老大口径保留讨论稿性质引用**、不 git 化；并补 2026-10-13 实测的双向失效一句。加固仍按 09-03 裁定随下沉一并做，⛔ 未动防护。
- **丁**：`backend/tools/shell.py` 头注释如实化——`:7` 超时行**分平台限定**杀进程范围（Windows `taskkill /T /F` 杀树 ／ POSIX 仅杀 `/bin/sh` 壳、孙进程可存活，不再笼统承诺"清理子进程"）；安全约束段改标「**弱防护，勿当安全边界读**」＋点破 IP 闸只约束外部调用者不约束 Agent；黑名单注明可绕过样本、误杀样本、硬编码不可调、加固去向。

**验收（含回归）**：四份 py 文件 `py_compile` 全过；`_check_blocked` 行为不变（`rm -rf /` 仍命中、`echo hi` 仍放行）；`engine.get_long_term_memory.__defaults__` 仍 `(5, 0.3)` ⇒ **零行为变更**，只动表述。甲组判据 `grep -rn "score_threshold" docs/product-positioning.md backend/memory/engine.py` ⇒ 值与理由两处同现。
**引文自纠（WB 复核触发）**：我在《后端第四处》引 `deployment-architecture.md:175` 作「建议**独立项目**」——行号在当时快照无误、**用词错**（实为「单独立项」），已改为**章节锚**引用（§七.1 末行）并在 WB 区留自纠注；教训：跨讨论稿引用优先用 §／条目号，不用 `:NNN`。

**⚠️ 一处未执行、需老大再定一句：`server.api_key`「现在就设」在执行前实测出新前提**

- 现查：`client/` 全仓 grep `Authorization|Bearer|api_key|apiKey` **零命中**（唯一命中 `src-tauri/src/main.rs:276` 讲的是模型侧 `DEEPSEEK_API_KEY` 环境变量，与 `server.api_key` 无关）。⇒ **一旦填上 key，现态前端全部 401**（同源 `chat.html` ／ Vue ／ Tauri 三条路径无一携带 Bearer），而方案 §4.2 的「运行期填 Key ＋ Bearer 注入」正是**尚未实现的改造点**。
- ⇒ "设 key 零代码"这个前提只在**纯 API 调试**场景成立；对正在使用 UI 的现态不成立。故**本次未写入 key，`backend/config.yaml` 未被改动**（该文件 `.gitignore:17` 已忽略、未入库）。
- 两条可一次跑完的路，老大点一条我即刻执行：**(A)** 设 key ＋ 同时派 Trae 补 `client/src/api.ts` 与 `client/chat.html` 的 Bearer 头（小改动，一次闭环）；**(B)** key 只落 prod profile（`LARRY_CONFIG=config.prod.yaml`，方案 §4.4 通道），dev 现态不动 ⇒ 闸门先备好、不锁自己，等真上云时天然生效。

## ⏳ 未结项（待老大裁）


> **2026-10-09 批量办理**（老大授权「直接处理」）：原 **1–9 条已办结 8 条**，**仅余第 5 条**。
> 办理明细（一处一行）：**#1** `larry-dsh-home` 承接滞后 ⇒ 6 处「当时形态留痕」批注已加（`dsh-migration:796/1073` ／ `production-env:464/515/517/532` 一带）｜**#2** 上游路径 ⇒ `dsh/README.md` 规则 4〈上游路径默认口径〉｜**#3** 落点口径 ⇒ `exchange/README.md` 对齐（`docs/` ／ `archive/` ／ `TODO.md`）｜**#4** 反引号惯例 ⇒ `docs/README.md`〈书写约定〉｜**#7** 索引 ⇒ `dsh/README.md` 补 `dsh-34-ref-research.md` 行｜**#8** 讨论稿引用 ⇒ `docs/README.md` 规则补「例外二」｜**#9** Tier0 源短副长 ⇒ 结（五载体末句全平、`production-env:483` 已加指向、余项皆已定论）。
> ⭐ **已消沿革**：第二刀（09-30）／「3.4-T 状态行滞后」（09-30）／#6 活指针（10-09）／#1–4・7–9（10-09 批）。
> 详细证据 ／ 建议 ／ 合规对照见下方〈全量职责巡检报告（2026-09-30）〉（09-30 快照；本批已办项以此清单为准）。

5. **`TODO.md` 精简**：第二刀 ✅（09-30）；**第三刀**（`DSH-3 · 贯穿规则` 迁 `docs/`）按原裁**等 DSH-3 完成后议**。

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

---
