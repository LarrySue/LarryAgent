# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）


## 2026-09-16 · 精简候选摸底（老大指令「跑一次精简候选摸底」）

**方法**：全仓 md 文件行数统计 + 关键文件头部状态核查 + 引用面扫描。聚焦 exchange/ 讨论稿（最易积压区）与 docs/ 大型文档。

### 高置信建议（4 项，按动作成本排序）

**S1. `exchange/deployment-architecture.md` (191 行) → archive/**
- 状态明确：「方案（待DSH迁移完成后重新制定）」，DSH-3 进行中，短期不会完
- 留在 exchange（活区）误导读者以为是活跃方案
- 建议动作：`git mv` 到 `archive/deployment-architecture-2026-09-03.md`，更新 exchange/README + 根 README :185 + TODO :290 引用

**S2. `exchange/capability-tree-revision.md` (250 行) — 7/8 已批但未执行**
- 老大 2026-09-15 已批 7/8 提案（仅 2.5.2 web_fetch 暂缓）
- grep `docs/product-positioning.md` 无引用 → 变更未落地
- 建议动作：拍板是让 WB 执行已批部分并归档/删除此稿，还是继续等待

**S3. `exchange/web-search-design.md` (394 行) — 17 天未展开讨论**
- 生成 2026-08-29，内容详尽（provider 对比/MCP 集成/延迟数据）
- exchange/README 标记「尚未展开讨论」
- 建议动作：确认是等待审阅还是已放弃？若放弃 → archive；若等待 → 标注状态

**S4. `exchange/discussion-time-context.md` (531 行) — 卡在看齐循环 13 天**
- 状态：「待各方对更新后的结论区表态『同意/有异议』」，自 2026-09-03
- 531 行详尽讨论，无 AI 签字确认
- 建议动作：推动签字并移入 docs/，或归档讨论、只提取结论到 docs/

### 中置信观察（2 项，仅备注）

- `docs/dsh/` 探针报告三份（claude/qoder/trae, ~525 行）：按设计拆分（不同 AI 视角），可保持现状，除非想统一视角
- `exchange/log-workbuddy.md` (155+ 行)：WB 活日志，按「不留痕」原则可清理，但 WB 自管

### 不建议动

- 三份环境文档（production/test/local-env，按设计对仗拆分）
- `archive/roadmap-history.md`（锁定区历史）
- AI 约束文件（.claude/.trae/.qoder，按角色拆分）
- exchange/logs（活日志，由老大按需清理）

**待老大裁决汇总**：S1（归档）→ S2（执行或继续等）→ S3/S4（状态澄清）→ S5/S6（备知）。

**老大结论（2026-09-16）**：都不是大问题，文档体系基本健康。四个候选项均为锦上添花级别，不急。
---

## 2026-09-17 · 复核：`larry` 面退役后的文档承接（老大交办）

**背景**：项目里冗余的 `larry` 面（工程 `.dsh-home/profiles/larry` ＋ 主 `~/.dsh/profiles/larry` ＋ CVM `~/.dsh/profiles/larry`，含各自依赖树）已由 WB 清理（`81a47cd` 落点改判 / `66696e5` CVM 侧退役）。本单为**退役后的文档一致性复核**（老大指令）。
**方法**：全仓 `larry` 引用扫描（`docs/` ＋ 根级 ＋ 四个约束文件 ＋ `harness/` 代码/脚本/配置）→ 逐处比对是否已带退役批注；再以**本机 ＋ CVM 磁盘实况**核对台账类陈述。

### 0. 结论摘要

| 面 | 结果 |
|---|---|
| `harness/` 代码 / 脚本 / 配置 | ✅ **零残留**（`grep` 无任何把 `larry` 当 profile 用的引用） |
| 文档台账式批注 | ✅ 做得相当完整 —— 近 15 处引用**已有** `2026-09-17 退役` 批注（详见 §7） |
| **漏网** | ❌ **5 处**：2 处高、1 处中、2 处低 |

### 1. 🔴 高 · `TODO.md:72` —— **误判源头本身没改**

现文：`- ⛔ **\`larry\` 本次不动**：CVM \`~/.dsh/profiles/larry\` 现 composition（api-gateway + host-webserver）与本地（base + headless）**不同**，属 3.5/3.7 派发时单独定的事`

**问题**：`66696e5` 的提交信息**点名这行是误判源头** —— "上轮判「CVM larry 有主、不动」**系照抄 TODO:72 旧登记、未上机核**"。该提交修订了 `production-env.md` / `local-env.md` / TODO 的 **3.7.2 段**，但 **`:72` 本体未改**，仍是"不动"的肯定陈述。
**风险**：`TODO.md` 是**待办的唯一事实源**（非历史区），而这行**没有"已退役"批注** ⇒ 下一个读者照它再判一次"不动"是**可复现的路径** —— 上次误判正是这么发生的。
**建议**：在该行补一句 `〔2026-09-17 复核推翻：该面已退役（CVM 侧重命名备份 larry.RETIRED-20260917-1818，后真删），详见 production-env.md §12 附一之补〕`。

### 2. 🔴 高 · `docs/local-env.md:17` —— **全文的「现状权威行」仍列 larry**

现文：`⚠️ **代际状态更新（2026-09-17）**：… **本机环境本身已全面升到 0.1.5-rc.2**，四处同代 —— …③ 工程 home \`.dsh-home/profiles/{larry,sdk}\` ④ 主 \`~/.dsh\` 回退层。`

**问题**：这一行是**全文声明"现状"的位置**（§8.1 复核注末尾也写"现状见文首「代际状态更新」"），但它仍把 `larry` 列为在册 profile。larry 于**同日**退役（`81a47cd` 18:08，晚于本行的 09-17）⇒ **同日期内自相矛盾**，且矛盾落在最权威的那一行。
**连带**："四处同代"的计数与枚举也需一并看。
**建议**：③ 改 `{sdk}`（larry 已退役）。

### 3. 🟡 中 · 三处文档声称 "RETIRED 备份存在"，实际**已被真删**（本机 ＋ CVM 双侧实测）

| 位置 | 现文（节选） | 磁盘实况 |
|---|---|---|
| `TODO.md:217` | "3.7.1 落在那层的产物**已退役**（重命名备份在 `profiles/node_modules/@larryagent/*.RETIRED-20260917-*`）" | `.dsh-home/profiles/node_modules/@larryagent/` **已空**（仅目录，0 项） |
| `TODO.md:356` | "工程 `.dsh-home/profiles/larry` ＋ 全局空壳 `~/.dsh/profiles/larry` **两处已重命名备份**（后缀 `.RETIRED-20260917-1808`）" | 本机两处**均不存在**（`.dsh-home/profiles/` = `node_modules`/`sdk`；`~/.dsh/profiles/` = `node_modules`/`sdk`/`web`） |
| `docs/production-env.md:548` | "**处置**：重命名备份 `~/.dsh/profiles/larry.RETIRED-20260917-1818`（……真删可交老大）" | **CVM 侧亦不存在**（18:28 真删；`~/.dsh/profiles/` = `acp`/`node_modules`/`sdk`/`web`） |

**问题**：三处都把一个**已消失的路径**写成留痕物。虽不影响结论（该面确实已不在位），但**有人按图去取备份会取不到** —— 属操作性陈述失活。
**建议**：改为"已退役并**同日真删**（原备份名留档于此，便于追溯）"，保留名字、去掉"现存"含义。

### 4. 🟡 中 · `docs/local-env.md:258 / :261` —— 09-17 实测陈述里的 larry

- `:258`：`✅ **该代际落差已解除（2026-09-17 实测）**：… \`profiles/{larry,sdk}\` 的 \`package.json\` 与 \`node_modules\` 均 \`0.1.5-rc.2\`（\`larry\`: \`dsh-base\` ＋ \`dsh-headless\`；…）` —— 陈述"该次实测时"的状态，larry 未退役前为真；**未带"当时事实"批注**（同节 `:207` 有该批注，可对齐）。
- `:261`：`📌 **实测口径（2026-09-17）**：两条 \`--profile X --help\` …（\`larry\` 打出 \`[B1-PROBE] external bundle loaded by cordis (tag=v1)\`）` —— 这是**可复用口径**（非历史件），却以**已退役的 larry** 为可复现例 ⇒ **该例现已不可复现**。
**建议**：`:258` 补"当时事实"批注；`:261` 把例换成 `sdk`（或注明"larry 例已随该面退役不可复现"）。

### 5. 🟢 低 · `docs/dsh/dsh-migration.md:667` —— 「本阶段已定案的环境规格」表 profile 行

现文：`| profile 名 | \`larry\`（= \`dsh-base\` + \`dsh-headless\`） | …`（同表 `:671` 另有 sdk 行）
**问题**：该表是**现役规格表**（`local-env.md` §8.1 复核注亦引它），不是历史件 ⇒ 主 profile 行应随落点改为 `sdk`（或加批注）。
**建议**：行值改 `sdk`，把 larry 移入括注作历史。

### 6. 🟢 低 · `docs/local-env.md:403` —— §8.4 踩坑 6 以 larry 举例

现文：`6. **自定义 profile（\`larry\`）\`patchReload\` 默认 \`live\`** …`
**问题**：该条价值在"自定义 profile 默认 live"，larry 只是例；但 §8.3/§9.2 被文首 `:18` 声明为历史件时**未把 §8.4 列入清单** ⇒ 轻微漏项。
**建议**：例子改述为"自建 profile"或加一句括注。

### 7. 明确"不用动"的（已逐处核过，避免重复劳动）

| 位置 | 为何不用动 |
|---|---|
| `local-env.md:18` 文首 | **已明确声明** §8.1 表＋复核注／§8.3／§9.2 的 `0.1.2-rc.1` 复跑命令为 **09-09~09-11 历史件、不回改** ⇒ §8.3 的 `--profile larry`（4 处）随之归入历史件，**不算漏改** |
| `local-env.md:52` §2 现象 | 已有 `〔2026-09-17：larry 面已退役；该现象与 profile 名无关〕` |
| `local-env.md:205` §4.3 覆盖面 | 原"三个共享，一份足够"已被 ⛔ 推翻改写 |
| `local-env.md:207 / :211` | 分别已带"当时仍在的 012 面" / 退役批注 |
| `local-env.md:334` §8 开头 WB 复验行 | 已带 `〔该 larry 面已退役；结论与手法不随面退役〕` |
| `local-env.md:373` 挂载动作 | 已带"2026-09-17 前为 larry（已退役），现为 sdk" |
| `dsh-migration.md:568`（事实表 1） | 已带"该 profile 已退役…该事实本身仍成立" |
| `dsh-migration.md:652`（已知边界） | 已带"2026-09-17 前为 larry，该面已退役 ⇒ 现按 sdk" |
| `dsh-migration.md:676`（零成本复验法） | 已带"原写 `--profile larry`…该手法不绑定 larry" |
| `dsh-migration.md:571 / :1024` | 前者为历史实测值（layer 数），后者为设计纪律举例 ⇒ 陈述"当时事实" |
| `production-env.md:56` / `:537-542` | 已订正为 sdk ＋ 新增退役明细（§12 附一之补） |
| `TODO.md:58 / :83 / :192` | 历史实测 / 旧 home 夹具 / 已带退役批注 |
| `archive/*`、`.claude/CLAUDE.md`、`client/node_modules/**` | 冷存区（锁定）／ 讲临时目录前缀（无关）／ 第三方 |

### 8. 附：本次实测的磁盘证据（供复验）

- 本机：`.dsh-home/profiles/` = `node_modules`／`sdk`（larry 及其备份**均无**）；`.dsh-home/profiles/node_modules/@larryagent/` = **空**；`~/.dsh/profiles/` = `node_modules`／`sdk`／`web`
- CVM：`~/.dsh/profiles/` = `acp`／`node_modules`／`sdk`／`web`（`find ~/.dsh -name "*RETIRED*"` **无命中**）
- `harness/` 代码层：`grep -rn "profiles/larry\|profile: 'larry'\|--profile larry" harness/` = **0 命中**

**我未改动任何文档**（职责边界：对已存在文档不直接操作）。以上 5 处是否修、由谁修，待老大裁。
