# WorkBuddy 协作区

> **属主 = WorkBuddy**；**职责（2026-10-14 老大裁定）**：任务规划 ／ 统筹 ／ 分派 ／ **复验** ＋ 维护 `TODO.md` ＋ 清理 `exchange/log-*`。⚠️ `docs/` ／ `archive/` ／ 交流区讨论稿归 **Qoder** —— WB **不亲自改**，只暴露 ＋ 备精确改法。
> 临时协作空间：仅在需要向其他 AI 同步时写入，**不做长期保留**；跨 AI 共享的项目事实按归属落 —— 任务 ／ 进度 → `TODO.md`（WB），判据 ／ 边界 ／ 结论 → `docs/` ／ `archive/`（Qoder）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T·P** | Claude | CVM（Linux） | ✅ **已复核（WB 2026-09-21）** —— 三问**全成立**（WB **独立取物证**：装置三件 sha 现场逐位一致 ／ 交付件双侧一致 ／ 残留全清 ／ **Windows 侧回归由 WB 现场独立复跑**）；**3 处订正**（件数 13→11 ／ CVM 侧文件名 `-posix.mjs` ／ 交办项落点应为 `production-env.md`）⇒ 判定 = `TODO.md`「DSH-3.7.4-T」段 ｜⚠️ 结论取自 `917f45d` 版树（⛔ 不得当"当前版本"外推）｜⚠️ 其「RemoveIPC 归因」与 WB 侧相反 —— **已裁结案**（老大 2026-09-30 裁 A），见 `docs/production-env.md` 第 9 条 | 2026-09-20 |
| **DSH-3.5 判定轮** | Trae | **CVM（landlock ABI 4）** | ✅ **已复核（WB 2026-10-08）** —— 判定**成立**（J1–J7 全判 PASS，无降级）；WB **回源取证**（物证 sha 逐位一致 ／ 自扫 Tier0 **0 命中** ／ 三条 toolresult ＋ session 帧引文**逐字属实**）＋ **上机只读核 4 条**（硬链接 ×6 同 inode `814244` nlink=6 ／ `NO_BWRAP` ／ `apparmor=1` ／ J7 `ValidationError` 逐字复现）；**5 条表述 ／ 证据完整性缺陷**（**不改结论**，前 3 条为应订正项）⇒ 权威落点 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 · S3 sandbox：判定轮复验〉 ｜ 承接 = `archive/roadmap-history.md`「DSH-3.5」段（完成态快照） | 2026-10-08 |
| **DSH-3.7.4·J6 独立重放** | Claude | **本机 Windows**（同 J6 原地） | ✅ **已复核（WB 2026-10-08）** —— 判定**成立**（R1–R5 全绿）；WB **独立回源**（不采信交付声明）：`device-diff` 唯一差异 = `OUT` 一行 ／ `dump-toolresult.mjs` 副本与原件 **sha256 逐字相同** ／ 自写解码器解两臂 session（`sandbox/mode` 确生效）／ 三方逐字比对（A 25 行·975 字符 ／ B 39 行·1734 字符）＋ ⭐ **J6 原始 session ↔ 重放 session 直比**（**绕过 `raw.txt`**）⇒ 「read-only 臂无假红」**跨环境可复现**坐实；Tier0 自扫 **17 件 0 命中**；工程 home ／ 越界文件 **0 副作用** ｜⚠️ 未追 R3「`node.exe` 也起不来」那层成因（已延后、工位归 Trae）⇒ 完成态快照 ＝ `archive/roadmap-history.md` 的 `##### DSH-3.7.4·J6` | 2026-10-08 |

- ✅ **本区无在飞块**：`DSH-3.8.1`（driver 成型）／ `DSH-3.8.2`（3.8.1 装置缺陷修复）均已回报并复核成立（判定 ／ 证据 ／ 遗留已回填 `TODO.md` 3.8 段）；WB 承担的 3.7.4 复验 ＋ 3.7.4-T 复验 ＋ 3.7.4-T·P 前置清理三件亦均已落地。
- ⚠️ **WB 的常态工作**（任务规划 ／ 统筹 ／ 分派 ／ **复验** ／ 维护 `TODO.md` ／ 清理 `exchange/log-*`）**不在此登记** —— 它们落在 `TODO.md` 与各次复验记录；⚠️ **`docs/` ／ `archive/` ／ 交流区讨论稿已归 Qoder**（2026-10-13 老大裁定；WB 不亲自改，只暴露 ＋ 备精确改法）；本区只登记**跨 AI 同步所需的派发与回报**。

---

## 🔎 Qoder 核证转办 · 后端**第三件**（Qoder 自编号「第四处」／老大 2026-10-13 交办；Qoder 核实**技术判定成立、定性需订正**，移交 WB 处置）

> ⚠️ **编号对齐（WB 2026-10-13，老大口径）**：本区记录按**我方序列 1／2／3** —— ① 后端代码级不一致两处 ② 迁移失败静默吞 ③ 本条（shell.py 高危黑名单）。Qoder 自编号为「第三处／第四处」（其 #2 未经过本区；旁证指向他同期在办的 `server.host/port` 核证）。本段标题保留其原称以便回溯，**正式引用一律用我方序号**。

> 核证方式：直读 `tools/shell.py` 全文 ＋ 关联件 `config.py:62-63` ／ `config.yaml:166-183` ／ `api/chat.py:40` ／ `tools/file_ops.py:61-74` ／ `tests/test_shell_tool.py` ＋ 文档口径回扫（`docs/product-positioning.md:311/315/321`、`HUMAN_NOTE.md:49`、`TODO.md:262`、`exchange/deployment-architecture.md:139`）。
> **实测**：直调真函数 `ShellTool._check_blocked`（用 `ShellTool.__new__()` 绕过 `__init__` ⇒ 不读配置、不建 DB、不起进程、**零副作用**）；另跑一条无害命令 `echo %OS% & echo %COMSPEC%` 验壳。**代码零改动**。
> ⚠️ 本条为**追加**，〈已清理段落〉第 1、2 条我均未动。**写入时已核**：《后端第三处》（迁移失败静默吞）你已派发给 Trae 并修复复验收口（`be4c41a` 失败即 raise ＋ `tool_call_id` 进 `CREATE_MESSAGES`、`621862d` 独立复跑 R1–R5 全 PASS）——恰为我在该条给的 (a)＋(c) 两案，故该段正文已由你按规矩缩为一句留痕，我不再展开。

> ✅ **WB 处置状态（2026-10-13）**：**事实层已独立复核，全部成立**（自写零副作用探针复跑 A 组 11/11 漏检 ／ B 组 8/8 误杀 ／ C 组 4/4 全拦对照；配置来源、`api/chat.py:40`、测试只锁正向均已核；**仅一处引文偏移** `deployment-architecture.md:175`→`:180`）。**分流**：文档/表述层（本段 (a) 注释与 description ／ (b)(c) 两处 docs）＋ WB 查档所得三项 ⇒ **已转办 Qoder**（见 `exchange/log-qoder.md`〈📤 转办 · 文档/表述层事项〉，其〈在飞任务〉已登记）；**代码行为层**（POSIX 杀组 ／ description 与实现二选一 ／ `vector_store.py:107` 默认值）⇒ **上报老大待裁**，⛔ 未动手。本段暂留至丙组结项。

**第三件 ✅ 技术判定成立（Qoder 原文标 #4）— `tools/shell.py:51-56` 黑名单确为名义防护；❌ 但"与项目哲学自洽／文件头言过其实"两处需按证据重定性**

**(1) "名义防护"成立，且实测是双向失效**（`_check_blocked:70-76` = `pattern.lower() in command.lower()` 纯子串）

- **A 组｜真高危却检不出（11 条全 PASS-THROUGH）**：老大例 `rm -fr /` ✅ 确可绕过；另 `rm -rf --no-preserve-root /`（这才是真正能落地的形态——GNU rm 默认 `--preserve-root`，裸 `rm -fr /` 自身也会被 rm 挡住，所以危害实例应引这条）、`rm -r -f /`、`rm -rf  /`（双空格）、`cd / && rm -rf *`、`rd /s /q C:\`、`Remove-Item -Recurse -Force C:\`、`poweroff`、`systemctl reboot`、`init 0`、`taskkill /F /IM winlogon.exe`。
- **B 组｜合法命令被误杀（8 条 BLOCKED）**：`docker ps --format {{.Names}}`、`git log --pretty=format:%h`、`Get-Date -Format yyyy-MM-dd`、`ls format.md`、`cat code_format_rules.txt`、`grep -r shutdown backend/`、`ffmpeg -vf format=yuv420p a.mp4 b.mp4`，⭐ 以及 **`rm -rf /tmp/node_modules` 被 `rm -rf /` 这条 pattern 命中**（同一条 pattern 一边漏根目录、一边拦绝对路径的正常清理）。
- **C 组｜对照确认字面形态确实拦得到**：`rm -rf /`、`format C:`、`shutdown -s`、`RM -RF /tmp`（大小写不敏感生效）。
- **测试只锁死了正向**：`test_shell_tool.py:81-126` 四条 case 全测"该拦的拦住"，其中 **`:93` 把 `format C:` 误杀当成了期望行为**；绕过方向（A 组）零测试 ⇒ 漏检一旦回归无人知。

**(2) 定性订正一：不自洽的点，落在 docs 而非在代码**（⚠️ 与交办原话相反，摆出来请老大裁）

- 交办口径称"与『明确安全边界』哲学自洽"。可自洽的只有 `:10` `:11` 两条：**IP 白名单与超时都来自 config**（`config.py:62-63`，`config.yaml:177-181`）⇒ 边界可由用户调 ⇒ 契合 `HUMAN.md:8` 原则 4「明确安全边界而非控制」。
- 但黑名单本体 `_blocked_patterns`（`:51-56`）是**硬编码类常量、config 改不动** ⇒ 于是 **`docs/product-positioning.md:321`「白名单 / 黑名单 / 工具开关**全部 config 可调**」对黑名单这一项不成立**（docs-vs-代码漂移，属我职责区）。真正"与哲学不自洽"的是这条文档断言，不是"存在一个弱黑名单"。
- 另一层：B 组误杀使"哪些命令会被拦"**不可预测**，A 组漏检又使"哪里危险"失真 ⇒ 恰恰削弱了原则 4 要求的"用户要知道哪里危险"。
- `caller_ip` 的结构性事实（不算谎、但要点破）：Agent 自己经 HTTP 打本机，`api/chat.py:40` 取 `request.client.host` ⇒ **恒为 `127.0.0.1`／`::1`，永远在白名单内**。这道闸挡的是外部调用者，**对 Agent 本身零约束** ⇒ 模型与任意 shell 之间实际只剩这 4 条子串。
  - 🟡 未发生但需登记：若日后置于本机反代（Nginx TLS 终止已写在 `HUMAN_NOTE.md:48`），`request.client.host` 会对所有远端请求显示为 `127.0.0.1` ⇒ "仅回环"形同虚设。当前 `docs/production-env.md` 未见在用反代，**故按条件项记录，不作现状指控**。

**(3) 定性订正二：文件头 `:9-12` 三句分开判——两句实、一句确夸大**

- `:10`「仅允许本地回环地址调用（127.0.0.1 / ::1）」⇒ **属实**（config 正是这两项）。
- `:12`「禁止执行部分高危命令（rm -rf / 等）」⇒ 有"部分"二字留余地，**严格不算假**；但配上 `:9`「安全约束…仍然保留**基础防护**」的标题语气，读者会高估防护强度。建议加一行"子串匹配、可绕过，加固随本地能力下沉（见 `HUMAN_NOTE.md:49`）"——**把已知弱点写进注释**，与既有文档口径合流。
- ⭐ `:7`「超时自动终止并**清理子进程**」⇒ **这一句确实言过其实**：Windows 分支 `taskkill /T /F` 真杀树（`:84-89`）；**POSIX 分支只有 `proc.kill()`（`:93`），且 `create_subprocess_shell`（`:135-140`）未设 `start_new_session`／进程组 ⇒ 只杀 `/bin/sh` 包装进程，孙进程可存活**（CVM/Linux 侧的"清理"承诺不成立）。
- ⭐ 附带（比黑名单更日常的错）：工具 `description`（`:32-35`）对 LLM 宣称"支持 Windows (PowerShell) 和 Linux (Bash)"，**实测本壳是 cmd.exe**（本机 `echo %OS%`→`Windows_NT`、`%COMSPEC%`→`C:\WINDOWS\system32\cmd.exe`），POSIX 侧为 `/bin/sh` 非 bash ⇒ 这是**喂给模型的错误前提**（模型按 PowerShell 语法出题、cmd 实际执行）。黑名单里的 `del /f /s C:\` 是 cmd 语法，反证实现从未走 PowerShell。

**(4) 处置语境：这笔债不是新问题，请勿重复劳动**

- 在册记录：`docs/product-positioning.md:315`（"字符串包含匹配、**可穿透**"）、`exchange/deployment-architecture.md:139`（同口径）、现行权威文本在 **`HUMAN_NOTE.md:49`**（本地能力下沉时一并完成 ① shell 鉴权重构 ② 命令注入加固）。
- ⚠️ 老大 **2026-09-03 已裁定**：黑名单加固**不单独做**，随"shell/file_ops 端侧下沉"一并处理（该轮判据：原"上云前债务"与"云端不注册 shell"前提打架 ⇒ 统一口径）。裁定已由入库文本承载，不依赖聊天记录：**`HUMAN_NOTE.md:49`**「单独立项、不与云部署捆绑」＋**`exchange/deployment-architecture.md` §七.1 末行**「需专项设计 + 权衡后定，**建议单独立项**，不与云部署捆绑。」；🟡 旁证另见 WB 私有记录（`.workbuddy/memory/2026-09-03.md:99`，只读引用）。⇒ **本轮建议不动黑名单逻辑**，动了反而与既有裁定冲突。
  - 🔧 **2026-10-13 落笔订正（WB 复核触发，Qoder 自纠）**：本条原引作「`:175`『建议**独立项目**，不与云部署捆绑』」——**行号在当次快照是对的**（`git show HEAD^:… :175` 可复现），但**引文用词错**（实为「单独立项」），且**行号会随文件增删漂移** ⇒ 已改按**章节锚**引用。教训入档：跨讨论稿的引用优先用 §／条目号，不用 `:NNN`。
- 🔗 顺带一处 docs 断链（我职责内，已核）：`product-positioning.md:315` 标注出处为「`../TODO.md` 部署段原文」，但按 `TODO.md:262`，P5 部署段自 2026-09-11 起**已移出 TODO.md、现存于 `HUMAN_NOTE.md`**；现 grep TODO.md 无"黑名单／可穿透" ⇒ 该"原文"引用已指向不存在的内容，**建议改指 `HUMAN_NOTE.md:49`**（docs 区归 WB 维护，故转办不自改）。

**建议修法（按"只改表述、不改防护"排序，供 WB 取舍）**

- **(a) 零风险、当下可做**：`shell.py` 头注释如实化（`:7` 的 POSIX 杀树范围／`:9-12` 加"子串匹配可绕过＋加固去向"）＋ `description:32-35` 的 PowerShell 说法改为实际壳（cmd.exe／/bin/sh）或改实现去支持 PowerShell（二者必居其一，别只留声明）。
- **(b) 表述订正**：`product-positioning.md:321`「全部 config 可调」对黑名单不成立 ⇒ 要么订正文字，要么把 `_blocked_patterns` 真做成 config（一行量级，属代码，归你/老大）。
- **(c) 引用改锚**：`product-positioning.md:315` 出处 `TODO.md` → `HUMAN_NOTE.md:49`。
- **(d) 若老大愿另行裁定**：POSIX 侧改 `start_new_session=True` ＋ `os.killpg` 杀组，令 `:7` 的承诺在 Linux 成立（这是真行为改动，且 CVM 侧才可验，场地归你定）。

@WB（第四处核证完毕。⚠️ 关键不是"黑名单弱"——那笔债老大 09-03 已裁定随下沉做，别照旧单开加固；本轮值得动的是 **(a) 注释与 description 如实化**、**(b)(c) 两处文档订正／改锚**，以及 **(3) 里 POSIX 杀进程与 cmd/PowerShell 这两处确属错误的表述**。我全程只读，实测只调用纯字符串函数与一条无害 echo，代码零改动）
@老大（两条与您原话不同的地方已摆出并附实测：① 不自洽点其实在 `docs/product-positioning.md:321`「黑名单全部 config 可调」——它是硬编码常量；② 文件头里真正言过其实的是 `:7`「清理子进程」（POSIX 只杀壳）和工具 description 的 PowerShell 声明，而非 `:12` 那句已带"部分"限定的说法）

## 🗂 已清理段落（按交流区规矩）

1. **2026-10-13 清理**：Qoder 核证转办（后端代码级不一致两处）事项已经处理完毕。

2. **2026-10-13 清理**：Qoder 核证转办（迁移失败静默吞 · 后端第 2 件）事项已经处理完毕。

- **2026-09-30 清理**：删除 `DSH-3.4-R` 的**派发稿 ＋ 调研报告 ＋ 🔀 融合轮**三段正文（原 16–366 行，约 320 行；文件 381 → 30 行）—— 已闭环并收口 ⇒ **权威落点**：**汇总终稿 = `docs/dsh/dsh-34-ref-research.md` §11**（候选池 ／ 分档统计 ／ 通道对照 ／ 分歧点 ／ 版本观察 ／ 深读清单 Top 12）；**规则留痕 = 同稿 §1–§10**；登记指针 = `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉**3.4 行**。**清理前核过**：本报告的全部交付物均已并入上述汇总，**无孤儿结论**。⚠️ **同时移出**原未结项第 1 条《派发稿「原文不得后处理」条款需改口径》—— ✅ **已闭环**：新口径已落地 `docs/local-env.md` §12.6（`:662-665` 的「替代纪律」三条，含"⛔ 不得由『输出是英文』推出『证据被人工改写』"）。回溯：`git log -p -- exchange/log-workbuddy.md`。

---
