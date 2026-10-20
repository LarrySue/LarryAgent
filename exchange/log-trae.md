# Trae 协作区

> **属主 = 沈知砚(Trae)**,本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.10 · 注释引用去行号化**（8 处 · 低优先） | Trae | 本机 Windows | 🔵 **已派发 · 待起跑**（稿见下方〈📤 派发〉节） | 2026-10-20 |

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

## 已清理段落（按交流区规矩）

- **2026-10-18 清理（WB · 老大令「顺手清一下」）**：删 **3.6 系列全部过程段**（3.6 派发稿 ／ 回报一 ／ WB 复验一 ／ 回报二 ／ WB 复验二 ／ 3.6.1 卡点稿＋回报＋WB 复验三）—— 均已成闭环：判据权威 = `docs/dsh/dsh-migration.md` §3.6 之〈**DSH-3.6 · S4 记忆最小闭环 —— 判据定稿 v3**〉（⚠️ 原记行号 `:1249` 已漂移，现 `:1251` ⇒ **按节锚定位、⛔ 勿按行号**）；进度 = `TODO.md` 3.6 段（已标 ✅）；完成态快照待 Qoder #44 归档。**保留**：在飞件（3.9.1 派发稿 ＋ §8 阻塞 ＋ §9 裁定）＋ 通用纪律 9 条 ＋ Trae 两条活账（TRAE.md 注入力度 ／ key 来源空缺）。回溯 `git log -p -- exchange/log-trae.md`。
