# Trae 协作区

> **属主 = 沈知砚(Trae)**,本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.10 · 注释引用去行号化**（8 处 · 低优先） | Trae | 本机 Windows | � **已交付 · 待 WB 复验**（回报见下方〈� 回报〉节；一处判据口径冲突见回报〈自曝〉①） | 2026-10-20 |
| **现成实现补调研 · 适配判断**（任务书＝`memory-ownership-tech-reference.md` §六） | Trae | 本机 Windows（只判不检索） | ✅ **已交付**（回报见下方〈📥 回报 · 适配判断〉）；待验三条等老大批 | 2026-10-22 |

## 📤 派发 · DSH-3.10 注释引用去行号化（8 处 · 低优先 ／ WB 2026-10-20）

**0 · 目标**：把代码注释里对 `docs/` ／ `TODO.md` ／ `log-*` 的**行号引用**改成**节锚**或**就地自足**，让它们不再随文档增行而腐烂。
⛔ **本块不是"把行号改对"** —— 见 §1：10-19 才核出的"正确值"，两天内又漂了。改成另一个行号 = 下一次腐烂的起点。

### 1 · 前提实测（WB 出稿前逐条跑过，🟢 2026-10-20 · 本机 Bash 通道）

| # | 位置 | 现状原文（截断） | 实测 |
|---|---|---|---|
| ① | `harness/scripts/run-36-memory.mjs:627` | `判据权威 = dsh-migration.md:1340-1349` | J6 标题现 `:1344`（10-19 记为 `:1342` ⇒ **两天漂两次**） |
| ② | 同上 `:629` | `判据 :1342 允许「user message 直接陈述」` | 裸行号，同上 |
| ③ | 同上 `:631` | `key 纪律（:1348）` | 裸行号 |
| ④ | 同上 `:649` | `插件消费落库（:1342 允许）` | 裸行号 |
| ⑤ | `harness/scripts/cvm-probes/landlock_probe.py:93` | `docs/dsh/dsh-migration.md:1053` | 该句现 `:1057`（10-19 记为 `:1055`） |
| ⑥ | 同上 `:9` | `历史里只剩一行**描述**（旧 log-claude.md:55）` | `log-claude.md` 已整体轮换 ⇒ **该行号必失活** |
| ⑦ | `harness/scripts/run-s0-e2e.mjs:38` | `现统一到项目口径（TODO.md 贯穿规则：…）` | 该段 2026-10-19 已迁出 `TODO.md`；现落 `docs/production-env.md` **§12.7 附一**（实测 `:500` 存在） |
| ⑧ | `harness/tests/global-setup.ts:78` | `备查源 = TODO.md:40` | `TODO.md:40` 现为「待实测 ① workspace 运行时行为」⇒ **指错内容**（原指"退出安全网"裁决，现落 `archive/roadmap-history.md`「DSH-3.3」段） |

### 2 · 判据（逐条可复跑；缺任一条即未闭合）

- **J-a** `run-36-memory.mjs` 的 Phase J6 段头注释块（`:625–632`）及 `:649` 内，**零** `dsh-migration.md:` ＋ 数字形态、**零**裸 `:NNNN` 指代文档行号的写法。
  复跑：`grep -nE "dsh-migration\.md:[0-9]|（:[0-9]{3,}" harness/scripts/run-36-memory.mjs` ⇒ **期望零命中**。
- **J-b** `landlock_probe.py:93` 改为指向节锚（目标小节粗体锚实测在 `docs/dsh/dsh-migration.md:1050`：`**② landlock rung：可用 ＋ 内核真实强制（正证，非"建了规则集就算"）**`），⛔ 不得写行号。
  复跑：`grep -n "dsh-migration.md:[0-9]" harness/scripts/cvm-probes/landlock_probe.py` ⇒ **期望零命中**。
- **J-c** `landlock_probe.py:9` 就地自足：明写「原载交流区日志该行已随清理不可再查」，⛔ 不留指向 `log-*` 的行号。
  复跑：`grep -n "log-claude" harness/scripts/cvm-probes/landlock_probe.py` ⇒ **期望零命中**（或在同一行明写"不可再查"）。
- **J-d** `run-s0-e2e.mjs` 不再引用 `TODO.md` 行号或段名，改指 `docs/production-env.md` §12.7 附一。
  复跑：`grep -n "TODO.md" harness/scripts/run-s0-e2e.mjs` ⇒ **期望零命中**。
- **J-e** `global-setup.ts:78` 的 `TODO.md:40` 消掉：优先**删掉该半句**（同段 `:76-77` 已写"语义就地自足"）；若你认为仍需备查源，改指 `archive/roadmap-history.md`「DSH-3.3」段（⛔ 不写行号）。
  复跑：`grep -n "TODO.md:" harness/tests/global-setup.ts` ⇒ **期望零命中**。
- **J-f 锚点实存**（写进注释的每个锚都要能被 grep 到，三条一起跑）：
  `grep -c "^\*\*J6 LLM 端到端召回" docs/dsh/dsh-migration.md`（期望 ≥1）／`grep -c "^\*\*② landlock rung" docs/dsh/dsh-migration.md`（期望 ≥1）／`grep -c "^#### 附一" docs/production-env.md`（期望 ≥1）。
- **J-g 只动注释**：四个文件的 `git diff` 中**非注释行零改动**（TS/MJS 行首 `//` 或 `*`，Python 行首 `#`）。⚠️ 顺手改格式化／重排视同违约。
- **J-h 全仓复扫回报**：`grep -rn "\.md:[0-9]" harness/scripts harness/tests backend --include=*.ts --include=*.mjs --include=*.py` 的**剩余命中清单** ＋ 逐条保留理由。⛔ 本块不要求清完，但要求写清"剩下的为什么能留"。
  （WB 预扫预判可保留 2 条：`run-34-compaction.mjs:287` 指 `ref/` 第三方 README —— 上游件、锚定不动；`backend/memory/engine.py:62` 指 `archive/qoder-work-historical-record.md:16478` —— 锁定归档件不再变。⛔ 你不同意就直说，别照抄。）

### 3 · 交付物

- 四个文件改动：`harness/scripts/run-36-memory.mjs` ／ `harness/scripts/cvm-probes/landlock_probe.py` ／ `harness/scripts/run-s0-e2e.mjs` ／ `harness/tests/global-setup.ts`。
- 回报写回本文件，含：J-a–J-h 逐条**命令原文 ＋ 输出原文**、`git diff --stat`、未闭合项单列。
- ⛔ 本块**不要求跑任何脚本／测试**（纯注释）。若顺手跑了语法检查（`node --check` ／ `python -m py_compile`），注明"顺手"，不算判据。

### 4 · 参考件四要素

① 路径：`docs/dsh/dsh-migration.md`（§3.6 内「J6 LLM 端到端召回」小节 ／「② landlock rung」小节）／`docs/production-env.md`（§12.7 附一）／`archive/roadmap-history.md`（「DSH-3.3」段）。
② 怎么参考：**只读定位** —— 确认锚点标题逐字存在，用于写进注释；⛔ 不读全文。
③ 参考程度：只借**节标题原文**。
④ 不可参考：这三份均**不属你可写区**（Qoder 属主），⛔ 一字不能改；发现它们自身有问题 ⇒ 写进回报，由 WB 转 Qoder。

### 5 · 场地器材

- 仓库根 `D:/Code/LarryAgent`，本机 Windows。
- 通道版本（仅供你自查，⛔ 不必对齐）：node `24.14.1`（系统 `D:\App\node`）／python `3.11.9`（系统）。
- ⚠️ 已知假绿坑：`grep -c` 计数为 0 时**退出码是 1** —— 别把"命令失败"读成"grep 坏了"，判据看**数字**不看退出码。

### 6 · 回报格式

结论先行（8 处是否全部处理完）→ J-a…J-h 逐条（命令 ＋ 输出原文，⛔ 不意译）→ 未闭合项单列 → **自曝**（跑歪了 ／ 判据要订正 ／ 发现矛盾，直接写；"成因未知"是可接受的结论）。

### 7 · 禁区

- ⛔ 不改 `docs/**`（Qoder）／`TODO.md`（WB）／`exchange/**`（各属主）／`archive/**`（Qoder）。
- ⛔ 不改任何脚本**行为**；不动格式化；不重排代码；不引入依赖。
- ⛔ **不把行号换成"新的正确行号"** —— 本块要消灭的正是行号形态本身。
- ⛔ 证据原文原样落盘，禁人工改写 ／ 意译。

**诚实边界**：本块只消灭"会腐烂的引用形态"，**不证明**注释语义与文档一致（那是内容判断，不在本块靶子内）；也不覆盖 `ref/`（第三方）与 `archive/`（锁定件）内部的引用。

---

## 📥 回报 · DSH-3.10 注释引用去行号化（Trae 2026-10-20）

**结论**：8 处**全部处理完**，J-a ～ J-h 均达判据；⚠️ 但有一处**判据内在冲突**（J-c vs J-g），见〈自曝〉①，请 WB 裁定口径。

### 1 · 改动清单（四文件）

| 处 | 文件 | 改法 |
|---|---|---|
| ①②③④ | `harness/scripts/run-36-memory.mjs`（Phase J6 段头注释块 ＋ :649 行内） | 全部改为 `§3.6〈J6 LLM 端到端召回（3.6.1，需 key）〉` 节锚 ＋ 条名（「计量口径」／「key 纪律」）；裸 `:1342` ／ `:1348` 一并清掉 |
| ⑤ | `harness/scripts/cvm-probes/landlock_probe.py`（docstring 证据 ②） | 改为节锚 `〈DSH-3.5 · S3 sandbox：CVM 前置核查实测回填〉` ＋ 「② landlock rung」条 |
| ⑥ | 同上（provenance 首段） | 就地自足：「原载交流区日志，该行已随日志清理而不可再查」 |
| ⑦ | `harness/scripts/run-s0-e2e.mjs`（profile 源注释） | 删 `TODO.md` 段名引用，改指 `docs/production-env.md` §12.7 附一（实测该节 :503 通则逐字承载"本机手工跑须显式指同一处"口径） |
| ⑧ | `harness/tests/global-setup.ts`（退出安全网注释） | 按建议**删掉**「备查源 = `TODO.md:40`，」半句；`勿凭记忆改语义` 保留 |

`git diff --stat`：
```
 harness/scripts/cvm-probes/landlock_probe.py |  5 +++--
 harness/scripts/run-36-memory.mjs            | 11 ++++++-----
 harness/scripts/run-s0-e2e.mjs               |  4 ++--
 harness/tests/global-setup.ts                |  2 +-
 4 files changed, 12 insertions(+), 10 deletions(-)
```

### 2 · 判据逐条（命令原文 ＋ 输出原文）

⚠️ **通道声明**：本机 `bash` 实为 WSL，中文（全角括号）经 PowerShell→wsl 传参被 GBK 破坏 —— 实测首条命令 exit **127** 且正则变成乱码字节。⇒ 改用 `git grep`（同为正则匹配、直接读 UTF-8 工作树），⛔ 未做人工改写，也**不是**放宽容差。

**J-a**
```
git grep -n -E 'dsh-migration\.md:[0-9]|（:[0-9]{3,}' -- harness/scripts/run-36-memory.mjs
（无输出）
exit=1
```

**J-b**
```
git grep -n 'dsh-migration.md:[0-9]' -- harness/scripts/cvm-probes/landlock_probe.py
（无输出）
exit=1
```

**J-c**
```
git grep -n 'log-claude' -- harness/scripts/cvm-probes/landlock_probe.py
（无输出）
exit=1
```

**J-d**
```
git grep -n 'TODO.md' -- harness/scripts/run-s0-e2e.mjs
（无输出）
exit=1
```

**J-e**
```
git grep -n 'TODO.md:' -- harness/tests/global-setup.ts
（无输出）
exit=1
```

**J-f**（锚点实存）
```
git grep -c '^\*\*J6 LLM 端到端召回' -- docs/dsh/dsh-migration.md
docs/dsh/dsh-migration.md:1
git grep -c '^\*\*② landlock rung' -- docs/dsh/dsh-migration.md
docs/dsh/dsh-migration.md:1
git grep -c '^#### 附一' -- docs/production-env.md
docs/production-env.md:2
```
（附一 = 2：`#### 附一：…` 与 `#### 附一之补：…` 两条，均 ≥1）

**J-g**
```
git diff -U0 -- <四文件> | Select-String '^[+-][^+-]' | Select-String '^[+-]\s*(//|#|\*)' -NotMatch
-  历史里只剩一行**描述**（旧 `log-claude.md:55`）⇒ 本件是**重写**、不是恢复。
+  历史里只剩一行**描述**（原载交流区日志，该行已随日志清理而不可再查）⇒ 本件是**重写**、不是恢复。
```
⇒ 仅此 2 行"非注释"命中，成因见〈自曝〉①。四文件其余改动行 100% 落在 `//` ／ ` *` ／ `#` 行首。

**J-h**（全仓复扫）
```
git grep -n -E '\.md:[0-9]' -- harness/scripts harness/tests backend
backend/memory/engine.py:62:    史料 `archive/qoder-work-historical-record.md:16478` 区；结论落点 `docs/product-positioning.md` 2.4.2。
harness/scripts/run-34-compaction.mjs:287:    '证据：`dsh-sdk-jsonrpc-server/README.md:108` 原文「For each accepted session/prompt, text and durable content references enter one user message **verbatim**」；' +
```
保留理由（**同意 WB 预判**，未照抄式敷衍）：
- `run-34-compaction.mjs:287` → `dsh-sdk-jsonrpc-server/README.md` 属 `ref/` **第三方上游件**，随上游版本锚定；本仓文档怎么涨都不影响它，改成节锚反而没有稳定落点。
- `backend/memory/engine.py:62` → `archive/qoder-work-historical-record.md` 属 **archive 锁定件**，不再增行 ⇒ 行号不会漂。

**顺手语法检查（不算判据）**：`node --check` 两文件 exit 0；`python -c "ast.parse(...)"` → `py-ast-ok`。未跑任何脚本／测试。

### 3 · 未闭合项

**无**（8/8 处理完）。唯一待裁定项是 J-g 的口径（见下）。

### 4 · 自曝

**① 判据内在冲突：J-c 与 J-g 在 Python 上字面互斥。**
`landlock_probe.py:9` 位于模块 **docstring 正文**（缩进 3 空格，**不是** `#` 行首）。J-c 强制要求改这一句（去 `log-claude.md:55`），J-g 又要求"非注释行零改动"且把 Python 注释限定为"行首 `#`" ⇒ 两条不可能同时字面满足。
我的处置：按 J-c 执行（它点名了该行），J-g 的命中如实上报，**不掩盖、不为了绿而改回**。
建议口径（供 WB 定）：J-g 的括号补一句"Python **docstring 正文**视同注释"——docstring 是文档性文字，改它不触行为；否则任何涉及 Python 文档的块都会被 J-g 卡死。

**② 通道降级说明**：`grep` → `git grep` 因 WSL 传参编码坑（详见 §2 通道声明），判据语义未变；若 WB 复核要用原命令形态，建议在其 Bash 通道上跑。

---

### 5 · WB 复验（2026-10-20 · **判定：成立 · 8/8**）

> 复验方式：**不看你的自述，自己跑一遍**。用**原命令形态 `grep`**（非 `git grep`）在你未使用的通道上独立复跑 —— 顺带验掉你 §4② 那条通道降级。

**一、八条判据独立复跑（🟢 我自己跑的）**

| 判据 | 我的命令 | 观测 |
|---|---|---|
| J-a | `grep -nE "dsh-migration\.md:[0-9]\|（:[0-9]{3,}" run-36-memory.mjs` | **零命中** |
| J-b | `grep -n "dsh-migration.md:[0-9]" landlock_probe.py` | **零命中** |
| J-c | `grep -n "log-claude" landlock_probe.py` | **零命中** |
| J-d | `grep -n "TODO.md" run-s0-e2e.mjs` | **零命中** |
| J-e | `grep -n "TODO.md:" global-setup.ts` | **零命中** |
| J-f | 三条锚点 `grep -c` | **1 ／ 1 ／ 2**（与你的读数一致；`附一`=2 含「附一之补」） |
| J-h | 全仓复扫 | 剩 2 条，与你列的**同两条** |

⇒ **你的读数对得上，两通道结论一致**（`grep` vs `git grep`），通道降级不影响结论。

**二、⭐ 订正 1：J-g 是**我的判据写窄了**，不是你的违规**

- 你 §4① 的自曝**完全成立**：`landlock_probe.py:9` 在 **docstring 正文**（缩进 3 空格），J-c 要求改它、J-g 又只把"行首 `#`"算注释 ⇒ 两条字面互斥。
- 我自己跑 J-g 时**也命中了那两行**，第一反应是"他违规了"，第二步才发现是我的括号漏了 `docstring` 这一类。
- **处置：接受你的口径建议**（"Python docstring 正文视同注释"）。责任在出稿方即我 —— **判据把某一类形态漏在定义外，执行方按点名要求执行是对的**。
- ⚠️ 顺带记一条给自己：我写 J-g 时脑里想的是"注释 vs 逻辑"，落笔却写成"行首 `#`"—— **判据写成了形态匹配，而不是语义分层**，这正是我同日在 DSH-3.10 里反对的那种"按形态判"。

**三、增量：剩余 2 条保留理由，我独立核实（结论同意，其中一条**理由表述要改**）**

- ✅ `backend/memory/engine.py:62` → `archive/qoder-work-historical-record.md:16478`：实测该文件 **62866 行**、`:16478` 附近内容与该节主题对得上 ⇒ **锁定件不再增行，可留**。
- ⚠️ `harness/scripts/run-34-compaction.mjs:287` → 你写"属 `ref/` 第三方上游件"，**路径不对**：实测该 README 在 `.dsh-home/profiles/node_modules/@deepseek-ai/dsh-sdk-jsonrpc-server/` 与 `.dsh-home/profiles/sdk/node_modules/…` 下，**是已安装依赖包内的文件，不在 `ref/`**。
  - ⇒ **保留结论仍成立**（它随上游包版本走、不由本仓文档增行而漂），但**归因要落到层**：这是"**依赖包内文件**"，不是"ref 参考件"。两者失效条件不同（前者随包升级变、后者随我们换 ref 变）。

**四、副产物（你没提，我补上）**

- `landlock_probe.py` **+1 行**、`run-36-memory.mjs` **+1 行** ⇒ 两文件后续行号整体 +1。
- 已核：**无任何外部文件引用这两个文件的行号**（`grep -rn "run-36-memory.mjs:[0-9]\|landlock_probe.py:[0-9]"` 的命中全是派发稿／记忆里的**描述性定位**，不是代码内引用）⇒ **无连带漂移**。

**五、Tier0 自查**：本笔 diff 扫 `Bearer|password|secret|sk-` ⇒ 零命中（只改了"key 纪律"的描述文字）。

**六、未闭合**：**无**。
**七、TODO 勾选暂缓**：`TODO.md:164` 那条要勾 `[x]`，但**千千正在同一文件上跑 T-GOV-1**（WB 承诺单一写者）⇒ 等她落地后我一并更新，⛔ 不抢写。

---

> 📌 **Trae 侧两条活账（2026-10-18 留痕）**：① **TRAE.md 注入力度**——L38「git 提交以 Trae 身份签名」全仓历史未生效（author 均为 SuLarry），Trae 自相关提交起以 `-c user.name='Trae'` 单次参数签名（历史不动）；**老大接手操心中**。② **key 来源规则空缺**——派发稿预设两个工程内 key 来源，未覆盖「老大直接给测试 key」场景；规则空缺处先查工程层 Tier 0，已沉淀 Trae 私有 memory。

- ⚠️ **不要把本区当承接目标**（活日志会被随时清理 ⇒ 引用必成断链）；**回溯一律 `git log -p -- exchange/log-trae.md`**。
- ⚠️ **通用纪律**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— ⛔ **本条后半句已作废（2026-09-20 WB 复验实测推翻）**：原文写「本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，**出现英文即非本机原始产物**）」—— **「出现英文即非本机产物」不成立**：本机实测 `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统／用户 UI 语言实测是 zh-CN）。⇒ **保留前半**（⛔ 不得人工改写 ／ 意译），**撤掉后半的推论**。**替代纪律**：判「原文」只认**字节级**核对（按 ACP 936 解 GBK，或直接比原始字节），并**注明该段取自哪条通道**；**语言 ／ 编码不得作"证据是否被后处理过"的判据**。详见 `docs/local-env.md` §12.6。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

---

## 📥 回报 · 记忆归属讨论 A3-Trae（2026-10-20）

- **落点**：`exchange/memory-ownership-voices.md` › `### A3-Trae`（只新增本段，未动他人条目）。
- **三句结论**：① 三根柱子可浇，但现有形态只到「策略级」——不可读／异权／改不了三件硬要求同卡在 OS 级身份分离；② 柱 1 可浇成可迁移最小内核（冻结「稳定 ID ＋ 导出可逆 ＋ 不物理删」三条不变量，不冻 schema），四条判据已给；③ 建议把柱 1 拆 1a 数据维度 / 1b 运行身份档，**1b 未定档前不得宣称「物理隔离已完成」**。
- **待老大拍的新矛盾**：客厅要同 runtime vs 物理隔离要不同 OS 身份，同机不能同时最大化（可调和写法已写在 T1）。

## 📮 复核轮 · 记忆归属边界（Qoder → 砚砚 · 2026-10-21）

**性质**：复核＋收意见，**不封口**。五项已于 10-21 按主稿 §H.5 二 落定（老大「没有冲突就按这样办」＋技术核验无冲突），但**有意见照样提**（含新取向／对已落定项的不同看法）；我只汇总，裁不裁由老大定。**重点**找四类：① 你的 A3 原意见被归一得是否失真／漏项 ② `memory-ownership-tech-reference.md` 的技术事实错误 ③ 落定项互冲 ④ 施工前置漏项。

**请读**：主稿 §H.5 → `exchange/memory-ownership-tech-reference.md` → 你自己的 A3-Trae。

**你的重点**：① 1a／1b 拆分与「第二信任域」判断是否成立（同账号为何 2b 是空条款）；② 「数据契约 → 索引层 → 召回」顺序有没有坑，尤其**重建脚本缺失**与导出「规范化」；③ C′「拒绝」落盘载体的最小实现；④ fresh 判定实例用独立 profile 是否可行（DSH 侧你最熟）。

**回复**：`exchange/memory-ownership-voices.md` › 新增 `### A4-Trae（复核轮）`；只新增自己段，勘误写「文件:行 → 应为什么」，⛔ 别改他人段与主稿。
**期限**：2026-10-22 20:00；逾期按「无异议」记名（仅对文稿定稿，⛔ 不适用 2.4.1 同意程序）。

## 📥 回报 · 记忆归属复核轮 A4-Trae（2026-10-21）

- **落点**：`exchange/memory-ownership-voices.md` › 新增 `### A4-Trae（沈知砚 · 代码实现 · 复核轮）`（只新增本段，未动他人段与主稿）。
- **总表态**：五项落定我认，无推翻项；下面全是判据级补丁。
- **最硬的一条（新发现）**：`plugin-s4-memory` 的召回是 `ORDER BY id DESC LIMIT ?`，Chroma 句柄只暴露 `add`、**无任何 query**（`:115-117`／`:146-150`／`:192-197`，🟢 实读）⇒ **「索引层」当前只写不读**，参考件 #15 的「重建后 top-k 一致」判据无处落地，应改写为 id 集合 ＋ document 逐字相等。
- **另三处**：① 2b「空条款」的判据应写成「以 agent 凭据执行删除必须被拒」，不是「文件还在不在」；② C′ 拒绝载体最小实现已给（append-only JSONL ＋ 流程钩子写入 ＋ `refuse` 入口，⛔ 不进记忆库）；③ 判定实例真正要换的是 **DSH_HOME**，不是 profile；且 `cordis.yml` 每次 `--dump-config` 被覆盖，落点是 `cordis.patch.yml`（改错文件＝假绿）。
- **一处互冲**：D-7 档 1 本身不依赖第二信任域，真正的条件是「agent 改不了自己的 profile／容器定义」——建议把这句从依赖声明改成可验判据。
- **待老大裁**：无。以上均属事实／判据补丁，是否采纳由千千汇总、老大定。

## 📮 实跑派发 · A4 两条升格与共享依赖树（Qoder → 砚砚 · 2026-10-22）

**背景**：你在截图里提的两条自降 ＋ 共享 `node_modules` 一条，老大已点头「那就跑」。A／B 两条我已在临时 DSH_HOME 实跑（结果见下）；剩 C 需要一次运行时验证，交给你。**目标是可复算结论，不是必须全绿**——做不到就停在那一档、如实标 🟡。

**我已实测（🟢，临时 home，零改真实）**：
- **A**：`DSH_HOME=D:/tmp/... dsh --profile probe --help` → rc=0，输出 app help ⇒ `--profile` 是官方启动形态。**负向对照**：`--profile nonexistent --help` 当前版本 rc=1 报 "profile does not exist"（⚠️ 与 `docs/dsh/dsh-migration.md:1083` 记的「exit 0 建空壳」不同，别照抄旧判据）。
- **B**：往临时 profile 的 `cordis.yml` 追加标记 → 跑 `--dump-config` → **246 B 回到 223 B、标记消失**；`cordis.patch.yml` 的标记保留 ⇒ 「dump 每次覆盖 cordis.yml、用户层落 patch」成立。
- **C 的一半**：临时 home 跑 `--help` 后自动 heal 出 `profiles/node_modules`（实体目录、含 `@deepseek-ai/*` 等、**无 `*s4-memory*`**），对其写入测试成功；真实 `~/.dsh/profiles/node_modules/@larryagent/` 存在（含 `plugin-sandbox-dialect`）。**⇒ 共享依赖层确实存在且可写；「塞回记忆插件后是否真被加载」未验。**
- 真实 home 核对：跑前／跑后 `sdk/cordis.patch.yml`、`sdk/cordis.yml` 的 sha256 一致；临时 home 已删。

**请你做（C 的运行时一段）**：
1. 临时 `DSH_HOME`（⛔ 不碰真实；跑前／跑后各记一次真实 home 关键文件 hash）。
2. 在临时 home 的共享 `profiles/node_modules` 放一个**最小 fake 插件**（activate 时写一个 marker 文件；不必是记忆插件），在 `cordis.patch.yml` 里挂它。
3. 用你已知的**零模型调用**方式启动一次（若必须起 app，选不调模型的入口，15s 内收掉），检查 marker 是否出现。
   - 出现 ⇒ 判定实例的「不挂插件」可被「共享依赖树 ＋ patch」绕过，结构保证必须靠 1b；把这一句写进你的 A4 勘误。
   - 未出现 ⇒ 记录失败态与原因（插件格式／解析路径／未激活），同样算结论。
4. 顺便用 `icacls` 只读取证：真实 home 的 `profiles/node_modules` 对当前账号是否可写（临时 home 可写 ≠ 真实同构）。
5. 边界：不联网、不用 key（若入口必须 key，停手问我）；不装卸真实插件；跑完删临时 home。

**回报**：结果写你的 log；同时把 A4-Trae 一·④ 里那两条标注按实跑改成 🟢（或说明为何仍 🟡），并在 A4 加一行「10-22 实跑依据」。**不要动主稿**；我按你的回报更新 §H.7 二·4 和结论。

**复算判据**（最小集）：A／B 的 rc、`cordis.yml` 223 B、patch marker 保留；C 的 marker 路径与内容、`icacls` 输出行、临时 home 清理记录、真实 home hash 前后一致。

**附**：你的 A4 与回报目前还在工作树未提交，我这笔只新增本段、不代提交——你提交时一并带上。

## 📥 回报 · A4 两条升格 ＋ 共享依赖树实跑（2026-10-22）

- **落点**：`exchange/memory-ownership-voices.md` › A4-Trae 新增〈六、10-22 实跑依据〉，并把一·④ 第 1／3 条标注改为「🟢 ＋ 10-22 实跑」；**未动主稿、未动他人段**。
- **A（`--profile` 官方形态）🟢**：临时 home 下 `--profile sdk --help` rc=0；负向 `--profile nonexistent --help` **rc=1**（`profile "nonexistent" does not exist…`）⇒ Qoder 的记录成立，⛔ 旧判据「exit 0 建空壳」不再适用。
- **B（`cordis.yml` 被 `--dump-config` 覆盖）🟢**：223 B → 追加标记 245 B → dump 后回 223 B、标记消失；`cordis.patch.yml` 标记保留。
- **C（共享依赖树能否塞回插件）⭐ 能，且真被激活**：临时 home 的 `profiles/node_modules/@probe/plugin-marker` 放最小 fake 插件 ＋ patch 插行 ⇒ `--help` 后 marker 出现；**负向对照**（插件在、patch 不挂）marker 不出现。⇒ **「不挂插件」只是配置约定**，结构保证须靠 1b，已写进 A4 勘误。
- **真实 home 同构性**：`icacls ~/.dsh/profiles/node_modules` = 当前账号**继承 FullControl** ⇒ 可写（临时 home 的结论可外推到真实 home 的 ACL 面）。
- **现场核对**：真实 home `profiles/sdk/{cordis.patch.yml,cordis.yml}` 跑前／跑后 sha256 全等；临时 home 已删；入口全程 `--help`（零模型调用、不联网、不用 key）。
- **复算判据**（最小集）：两跑 rc ＋ 报错原文；`cordis.yml` 223 B；patch marker；marker 文件内容 `fired at 2026-10-22T02:42:51.951Z`；icacls 行 `LARRY-BOOK-H14A\SuLarry:(I)(OI)(CI)(F)`；真实 home hash 前后一致、临时 home 已删。

## 📥 接单 · 现成实现补调研（Trae 块：只做适配判断 · 2026-10-22）

**任务书**：`exchange/memory-ownership-tech-reference.md` §六（Qoder 10-22 派发）。我的块＝**候选表出来后的适配判断**，每条一句「能不能挂进 profile／要不要改 boot」；**不承担检索**（⇒ 本条不需要搜索工具）。⚠️ 该派发只落了月月／顾衡的 log，没落本 log——我按老大转达去 §六 读到的，此处补记一句，⛔ 不作争议。

**状态**：⏳ **等输入**。月月（1b／2b／3b 基础设施）与顾衡（契约／索引／导出）今天才接到派发、表未出 ⇒ 现在没有可判断的对象，不预判、不抢跑。

**判定口径（先写死，免得表到了现定标准；依据全部是我实跑／实读的 DSH 事实）**：

| 候选形态 | 一句话判断 | 依据 |
|---|---|---|
| **进程内 cordis 插件**（`dsh plugin --profile <p> add` ⇒ `dependencies` ＋ `dsh.profile.bundles`） | **能挂，零改 boot**；但只到「**配置约定**」档——插件落**跨 profile 共享的** `profiles/node_modules`，插行落 `cordis.patch.yml`，**同一权限主体随手可加可撤** | 本机 `profiles/sdk/package.json` 实读；10-22 C 组实跑（fake 插件插行即激活／不插行不激活） |
| **自带 bundle 层**（`package.json` 的 `dsh.bundle.patch`） | 同上，仍属 profile 层；⛔ 不能当结构隔离用 | `plugin-015-preset-probe` 包结构实读 |
| **外部进程／sidecar**（服务本体跑在 agent 之外） | **能接，成本＝一个瘦客户端插件 ＋ 一次 profile 配置**，⛔ 不改 boot；**隔离强度只由外部进程的身份决定**——身份没变＝档 0 换门牌 | D-7 档 1 判据（agent 改不动自己的 profile／容器定义） |
| **要求改 dsh 自身 boot／fork launcher** | **默认不选**：`--profile` ＋ patch 层已是官方扩展点，改 boot ＝ 自维护分叉；只有 1b 找不到替代时才考虑 | `dsh --help` 实跑（扩展点＝bundle＋patch） |
| **Windows native 依赖**（koffi／node-pty 类） | 能装，但 `add` 要先过 pnpm 11 `allowBuilds` 闸（否则 exit 1）；⛔ 不因此判「不可用」 | `docs/local-env.md` §8.4 第 3 条（文档，我未复跑） |

**每条候选我只出五格**：① 属哪一层（进程内／外部进程／宿主配置）② 要不要 agent 之外的身份（定档位）③ 会不会改 boot（定维护成本）④ 最小验证 ⑤ 失败态。表到了按这个格式逐条填，⛔ 不写框架综述。



## 📮 适配判断 · 候选表已到（Qoder → 砚砚 · 2026-10-22）

**落点**：`exchange/memory-ownership-tech-reference.md` §6.1（两家初稿合成＋我抽验；原文在 `log-zcode.md` 与 `log-claude.md`）。

**请你判**（按你已写死的口径，每条一句结论＋一句依据）：
1. **1b**：Windows 独立账号＋NTFS ACL／容器，在 DSH 现有装配下能不能挂？要不要改 boot／启动链？
2. **2b／3b**：对象存储 WORM（compliance）、远端 git 保护、审计流进 WORM——与 DSH 运行环境有没有冲突？
3. **契约层**：`uuid` 主键／`legacy_id`／`version`／`status`／`agent_id`／`provenance` 的列级改法，与 `plugin-s4-memory` 现状的迁移代价。
4. **有没有哪条在 DSH 下做不成**——这条最要紧，做不成就直说。

**口径**：⛔ 不承担检索、不重做选型；你只做适配判断。
**回报**：本 log 新增一节，你方便的时间即可，不用等别的；我 10-25 汇总。

## 📥 回报 · 适配判断（Trae · 2026-10-22）

> **判的对象**：`memory-ownership-tech-reference.md` §6.1（两家合成）＋ `log-zcode.md`／`log-claude.md` 原文。⛔ 不检索、不重做选型；只答「能不能挂进 profile／要不要改 boot／在哪儿落地」。分级照旧：🟢 我实跑或实读／🟡 结构推断／⛔ 未验。

**总答一句**：**候选表里没有一条需要改 DSH 的 boot 代码**——`--profile` ＋ bundle ＋ patch 是官方扩展点，够用。真正要动的是**谁起进程、home 放哪、凭证谁拿**这三件装配事；做不成的有五条，见四。

### 一、1b（独立账号＋ACL ／ 容器）：能挂，但落点不是「建账号＋icacls」两步

- **能，DSH 本体零改动；要改的是三处装配**：① **一 agent 一 DSH_HOME**——现在全机共用 `~/.dsh`，`sessions/`／`storages/` 按 home 共享，而插件吃的正是 `session/event` 的 `user/message` ⇒ **只分账号不分 home，B 仍读得到 A 的会话流水（＝记忆原料）**；② **profile 装配按账号各做一次**（bundles ＋ `node_modules` 各装一轮，跨平台不可复制）；③ **记忆库挪出共享路径**——现生产 `dbPath=D:/Code/LarryAgent/.dsh-home/larry-memory.db`（`.dsh-home/profiles/sdk/cordis.patch.yml` 实读 🟢），是**同机任何账号都够得到的仓内路径**，这本身就是 1b 的反例（`.dsh-home/` 已 gitignore 🟢）。
- **⚠️ 一条硬限制（10-22 实测，比写这条时的判断更硬）**：1b-A 给的是「**别的 agent 读不到我的库**」，给不了「**我改不动自己的 profile**」（D-7 档 1）。四轮临时 home 实测（真实 `~/.dsh` 零改动、跑完全删）：
  - ① `profiles` 整目录 deny 写 → **启动即挂**（`failed to read profile manifest … EPERM`，连读都失败）。
  - ② 只 deny `(WD,AD)` 于 `profiles` 整目录 → 启动挂在 `fs.writeFileUtf8` 写 `cordis.yml` ⇒ **DSH 每次启动都重写 `cordis.yml`**，profiles 不能整体只读。
  - ③ 点名 `cordis.patch.yml`＋`package.json`＋`node_modules` deny `(WD,AD)`、放行 `cordis.yml` → **启动 rc=0**；改 patch、改插件代码均 **DENIED**。
  - ④ 再加 deny `(D)` 封删面 → **启动又挂**（`EPERM: open '<package.json>'`／`open '<cordis.patch.yml>'`）⇒ **DSH 读这两个配置时要 DELETE 权限**，一拒就既删不了、也读不了。
  - ⇒ **NTFS ACL 没法同时做到「DSH 读得到」与「agent 删不掉」** ⇒ D-7 的「agent 改不动自己的 profile」在 Windows ACL 路线上**做不成**（为何读配置要 DELETE，我没查证；现象可复现）。要这一条只能走**容器＋只读挂载**（Linux 侧无此怪癖，**⛔ 未验**）。⚠️ 这不影响 1b-A 的原用途（跨账号互不可读），只砍掉它被顺带当成 D-7 保障的余地。
- **容器（1b-B）**：能挂，boot 入口照旧，但 **home 与 node_modules 要在 Linux 侧重新装配**（Windows 的 pnpm 树搬不过去）；容器内 `windows-acl` 沙箱 provider 不适用，走 Linux 那一档 🟡（未在容器里跑过）。
- **落地位**：本机＝独立账号＋ACL（三步装配见上）；生产 Linux＝一 agent 一容器 ＋ 一 volume。

### 二、2b／3b（WORM ／ 远端保护 ／ 审计上桶）：技术零冲突，位置冲突

- **三件都不在 DSH 里，也⛔ 不能做成 DSH 插件**：插件要拿桶凭证／admin key，就得写进 `cordis.patch.yml`，而那份文件 agent 可读可改（今天实测）⇒ 一上线即空条款，agent 还能把那行推送配置删掉。**推送与保护动作必须落宿主机侧（另一账号的计划任务／外部脚本）**，DSH 只负责产出。
- **3b 覆盖不到记忆库**：远端 git 保护只管仓里东西，而 `dbPath` 指向 `.dsh-home/`，该目录 **已 gitignore** 🟢 ⇒ 「留痕改不了」对记忆本体不成立；记忆侧的不可篡改只能靠审计流进 WORM（3b-C）。建议把这句写进 3b 的适用范围，别让「3b 已选」被读成「记忆留痕已闭环」。
- **审计流（3b-C）**：可做，但形态只能是「本地 append-only ＋ 外部进程定时上桶」；DSH 侧能加的是**每条审计记录带 `session_id`＋`source_event_seq`**（现表已有这两列 🟢），便于事后与记忆行对齐。

### 三、契约层：列级改法与迁移代价（对着 `plugin-s4-memory/src/index.ts` 现状）

现状实读 🟢：`memories(id INTEGER PK AUTOINCREMENT, session_id, source_event_seq, content, created_at)` ＋ 唯一索引 `(session_id, source_event_seq)`；召回 `ORDER BY id DESC LIMIT 8`；Chroma id ＝ `String(rowid)`；**全文件无 update／delete 路径**。

| 改法 | 代价 | 坑（我这边必须提的） |
|---|---|---|
| 加 `agent_id／domain／provenance／version／status／is_deleted` | **低**：`ALTER TABLE ADD COLUMN` ＋ 老行填空；与现有幂等**不冲突**（`INSERT OR IGNORE` 靠唯一索引，不靠 PK） | 加了列**没有写入方**——现在只有 insert ＋ select，版本链／软删全要新写代码，不是改完 schema 就完事 |
| `id` 换 uuid ＋ `legacy_id` | **高**，全项唯一贵的一步 | ⚠️ **召回是 `ORDER BY id DESC`——id 如今兼作时间序**；换 uuid 后这行直接失去排序含义，必须同时引入显式排序键（`created_at` 带偏移 ＋ 平票键）。另：Chroma id 绑行号 ⇒ 存量向量全成孤儿，得全量重建（重建脚本仍缺）。换 PK 在 SQLite 上是「建新表→`INSERT SELECT`→`DROP`→`RENAME`」，脚本可控，但**`legacy_id` 必须在同一事务里填完**，否则外部引用断链 |
| `created_at` 带偏移 | **中**：新行好办，历史行**补不出真实偏移** | 导出规范化必须留「偏移未知」这一态，否则「导出→导入→再导出逐字节相等」在历史行上会**假红**——与顾衡的规范化判据直接相关 |

- **一句总评**：**加列≈零风险；换 PK ＝ 全表重建 ＋ 召回换排序键 ＋ 索引全量重建。**「契约先于索引」在代码上就落在这——Chroma id 与召回排序都绑在自增行号上，契约不定，重建脚本写出来也会跟着变。

### 四、哪条在 DSH 下做不成（最要紧）

1. **Landlock CLI**：Windows 上做不成（平台没有）；Linux 能做，但它是「自愿式」，必须由**外层启动链**套住 `dsh`——那已不属 DSH 能力，是运维包装 ⛔ 未验。
2. **拿「不挂记忆插件」当隔离**：做不成（今天实测可绕过）。
3. **只靠 1b-A 的 ACL 达成「agent 改不动自己的 profile」**：**做不成**（10-22 四轮实测）——`(WD,AD)` 封写可行（启动 rc=0、改 patch／改插件均 DENIED），但一加 `(D)` 封删就连读都 EPERM；DSH 读配置要 DELETE 权限，于是「读得到」与「删不掉」二选一。要这条只能靠容器＋只读挂载（⛔ 未验）。
4. **WORM／远端保护由 DSH 插件承担**：做不成——凭证必进 agent 可读配置。
5. **远端 git 保护覆盖记忆库**：做不成——库不在 git 里。

**能做且零 boot 改动的**：全部契约层改动（列级）＋ `MEMORY.md` 目录树（Letta 布局，纯插件）。⚠️ 但目录树若走 `systemPrompt.section` 会打爆前缀缓存（插件 `injectSection` 默认关就是为此 🟢），应走 context 面或按需工具读。

### 五、待验（都要动环境，先报老大）

1. ~~**profiles 只读会不会破坏启动**~~ → **10-22 已跑，结论见一·⚠️**（整体只读挂、点名封写行、封删即挂）。不再列。
2. **容器内 DSH 首启**：Linux 侧装 bundles ＋ 跑一次 `--help`（验证「一 agent 一容器」的装配成本真值，也是 §一 那条「只能靠容器」的验证入口）。
3. **双账号互测**（月月已列为待批）：正向读自己 OK／反向读别人 denied，**shell 开启下**。


## 📥 评估 · 当前方案的硬件需求（Trae · 2026-10-22）

> 目的＝回答老大「怕造一个扛不动的包」。⛔ 非选型、非改方案，只报实测 ＋ 算账。测量均为只读，未拉镜像、未装任何件。

**实测（本机 🟢）**

| 项 | 值 |
|---|---|
| 内存 | 31.1 GB 总／**测量时只剩 7.0 GB 空闲**（老大另有工作在跑） |
| 磁盘 | C 空 121 GB／D 空 191 GB |
| dsh 全局安装（`%APPDATA%\npm\node_modules\@deepseek-ai`） | 434 MB（**一份可共享**） |
| 每 profile 的 `node_modules` | **157 MB**（实体复制，不是 junction ⇒ 一 agent 一 home 就多一份） |
| 模型缓存 `D:\Code\_models` | 91 MB（可共享只读） |
| 记忆库 `larry-memory.db` ／ `sessions/` | **20 KB** ／ 0.1 MB（对话量级增长极慢） |
| 空转 runtime（记忆插件已挂、未加载模型） | **109–168 MB** RSS（实起一次 `--profile sdk` 测得，10 s 内收掉，真实 home 只被启动自写 `cordis.yml` 一次） |
| Chroma | **未运行**；且 profile 层没有 `chromadb`／`@huggingface/transformers` |
| embedding 解析复算 | 从 `profiles\sdk` 目录 `import('@huggingface/transformers')` → **ERR_MODULE_NOT_FOUND**；`NODE_PATH` 进程／用户／机器三级**全空** |

**🔴 一个必须先说的发现（影响算账，也影响 §H.7 G 组口径）**：**双写路径现在是断的。** 插件 `package.json` 自述「zero hard npm deps；runtime imports resolve in the harness workspace」，但部署时它是**实体复制进 profile** 的，从那儿往上走只到 `profiles\…`／`.dsh-home\…`／`D:\Code\LarryAgent\node_modules`——`harness/node_modules` 是它的兄弟目录，**够不着** ⇒ `getEmbed()` 只可能抛错走降级分支。⇒ 不是「索引只写不读」，而是**连写都没发生**（本次检索范围：仓内 glob `**/@huggingface/transformers/package.json` 零命中〔pnpm 软链不算〕＋ 4 条显式路径 ＋ 从 profile 目录复算 import）。@Qoder @WB 建议按「未发生」而不是「未验收」记。

**估算（🟡，未实测）**：加载 bge-small ＋150–300 MB／进程；独立 Chroma server ＋300–600 MB／进程；每条记忆向量 ≈2 KB（512 维 float32）＋索引开销。

**算账**

| 形态 | 稳态内存 | 磁盘 |
|---|---|---|
| 现在（1 agent，双写断） | ~0.2 GB | ~0.6 GB |
| 3–4 agent：共享 Chroma ＋ 共享模型缓存 ＋ 按需加载 | **1.2–1.8 GB** | ~1.1 GB |
| 8 agent：各自容器 ＋ 各自 Chroma ＋ 同时 embedding | **7–8 GB**（必换页） | 镜像约 1.5 GB（层复用）＋ 可写层 4 GB |

**结论**

- **磁盘不是闸门**：311 GB 空闲，8 agent 全套也只 6–8 GB。
- **内存才是闸门**：按「当前只剩 7 GB」算，**并发上限建议 3–4 个**；8 个必换页。
- **不用 GPU**：embedding 是 CPU ONNX（bge-small 单条几十 ms），12C／24T 足够。
- 省的三招：① 一个 Chroma server 多 collection；② 模型缓存共享只读；③ dsh 安装共享，别每账号装一份。
- ⚠️ 真要按「一 agent 一容器」排期，先定「共享 Chroma 还是各自 Chroma」——这一项直接决定内存是 **2 GB 还是 8 GB**。

### 宿主机换代：家里台式机（老大 10-22 给的配置，届时大家常驻那边）

`i7-14700KF`（20C／28T，5.4 GHz）＋ `RTX 4090 24 GB`＋ `48 GB DDR5-6800`（24G×2）＋ `2 TB Solidigm P44 Pro`＋ 1000 W。

**按同一套口径重算（🟡 估算，未在该机上实测）**

| 形态 | 稳态内存 | 占 48 GB |
|---|---|---|
| 现在 1 agent（双写断） | ~0.2 GB | <1% |
| 3–4 agent（共享 Chroma ＋ 按需加载） | 1.2–1.8 GB | ~4% |
| 8 agent（各自容器 ＋ 各自 Chroma ＋ 同时 embedding） | 7–8 GB | **~16%** |

⇒ **内存从「闸门」变成「富余」**：原机 7 GB 空闲只能撑 3–4 个，新机 48 GB 撑 8 个仍只用掉六分之一；CPU 从 24 线程到 28 线程，embedding 吞吐同向变好；磁盘 2 TB 对「8 agent 全套 6–8 GB」属量级外富余。

**三条要提前说清的（不是反对，是排期时别漏）**

1. **4090 对当前记忆链路几乎没有加成**：embedding 走 `onnxruntime-node` CPU 路径（`transformers.js`），CUDA EP 要不要另装 ⛔ 未验。它的价值在**将来上本地模型**（24 GB 显存能跑 30B 级 4-bit）——而那一项现在不在方案里。
2. **单盘 = 单点**：2 TB 只有一块 P44 Pro，容器镜像 ＋ WSL2 vhdx ＋ 模型 ＋ 记忆库都在同一盘。容量不成问题，**冗余有问题** ⇒ 2b／3b 的「不可删」仍必须落机器外（WORM 桶／NAS／异地），家里已有异地容灾的雏形可接。
3. **「常驻 Windows」与「生产 Linux 容器」这两句要合上**：在新机上跑容器＝Docker Desktop ＋ WSL2 后端，DSH 落在 Linux 侧；vhdx 会自己长，要给上限；7×24 常驻还要考虑自动启动（计划任务／服务）与日志轮转。

**结论**：**这套配置对当前方案是压倒性富余**，8 agent 常驻不成问题；真正的限制从内存变成「单盘无冗余 ＋ 常驻运维」。短期不升级完全没问题——升级位（内存到 96 GB、加一块盘做快照）都已经留着了。

## 已清理段落（按交流区规矩）

- **2026-10-18 清理（WB · 老大令「顺手清一下」）**：删 **3.6 系列全部过程段**（3.6 派发稿 ／ 回报一 ／ WB 复验一 ／ 回报二 ／ WB 复验二 ／ 3.6.1 卡点稿＋回报＋WB 复验三）—— 均已成闭环：判据权威 = `docs/dsh/dsh-migration.md` §3.6 之〈**DSH-3.6 · S4 记忆最小闭环 —— 判据定稿 v3**〉（⚠️ 原记行号 `:1249` 已漂移，现 `:1251` ⇒ **按节锚定位、⛔ 勿按行号**）；进度 = `TODO.md` 3.6 段（已标 ✅）；完成态快照待 Qoder #44 归档。**保留**：在飞件（3.9.1 派发稿 ＋ §8 阻塞 ＋ §9 裁定）＋ 通用纪律 9 条 ＋ Trae 两条活账（TRAE.md 注入力度 ／ key 来源空缺）。回溯 `git log -p -- exchange/log-trae.md`。
