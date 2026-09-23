# DSH-3.4（S2 compaction）参考件调研 · 筛选规则与五方分派

> **本稿性质**：3.4 开工前「参考件广撒网」的**操作规格**（筛选规则 / 报告格式 / 反纪律 / 必扫区）。
> **它不是结论稿** —— 结论（候选池 / 排序 / 借鉴点）在各方报告收齐后由 WB 汇总，并回填 `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉**3.4 行**。
> **立项**：2026-09-23，老大指令「先制定筛选规则，发给 WB ／ Trae ／ Claude ／ Qoder ／ Other 交流区，各 AI 独自搜索梳理筛选并出评论报告」。
> **上位依据**：`docs/dsh/dsh-migration.md` §3.0（只参考不直装）／ §3.6〈参考实现登记表〉（口径 / 派发四要素 / 证据等级）／ 同表表头「老大注」（社区脱节须暴露）｜ `TODO.md`「DSH-3.4」段（切片判据）。

---

## 0 先划边界：这一步要解决什么（防偏题）

3.4 = **S2 compaction 接入**。`ctx.compaction` 是**契约** ⇒ 自做 Provider 即换策略、消费者不动。

调研要回答的是**六问（T1–T6）** —— 候选件命中其中**任一条**即算相关：

| 代号 | 要问什么 | 谁最可能回答 |
|---|---|---|
| **T1** | `ctx.compaction` 契约**长什么样**、Provider 的**替换点与注册方式** | 官方契约件 ＋ 上游主仓 |
| **T2** | 现成 Provider **怎么写的**（默认 `compaction-basic` ／ `compaction-tool-result-pruner`） | 官方 Provider 件 |
| **T3** | **「压了但近文原文保留」**怎么办 —— **这是 3.4 判据的核心** | 优先社区件 |
| **T4** | 怎么在**1 轮内逼出** compaction（`contextWindow` 实测 1M；⚠️ 勿真灌 200+ 轮） | 官方件 ／ 社区件 |
| **T5** | 怎么**验**「摘要注入 ＋ 近文原文保留 ＋ 摘要含可验证 nonce」 | 官方测试 ／ 社区测试 ／ 第三方装置 |
| **T6** | **已知坑**：静默不生效 ／ 版本兼容 ／ 成本 ／ 性能 | 全部来源（尤其 CHANGELOG ／ Issues） |

---

## 1 硬闸门（一票否决 —— 不过者出局，不占报告篇幅）

| # | 闸门 | 判法 |
|---|---|---|
| **G1** | **有明确 LICENSE** | 读仓根 `LICENSE` ／ `package.json` 的 `license` 字段。**无或不详 ⇒ 出局** |
| **G2** | **有可读实现源码** | **只读 README 不算**。能读到实现（`.ts` ／ `.js` ／ `.py`）才进池；纯 binary ／ 只有文档 ⇒ 出局 |
| **G3** | **与「上下文压缩 ／ 上下文预算 ／ 摘要」直接相关** | ⚠️ **「context」一词大量指 UI 的 context menu ／ 上下文折叠**（本项目实测：名录关键词命中 **458** 条，**绝大多数是此类噪音**）⇒ **必须逐条读描述**，⛔ 不许按关键词计数判相关 |
| **G4** | **能确定它锚的 DSH 版本** | 读 `package.json` 的 peerDeps ／ README 声明。读不出 ⇒ **不剔除，但标 🔴 待核**、不进结论 |
| **G5** | **只作参考源** | ⛔ 报告中**不得**出现「装上就能用 ／ 可作产品依赖」式结论（§3.0 硬约束） |

---

## 2 分档（不用打分 —— 避免虚假精确）

| 档 | 判据 | 去向 |
|---|---|---|
| **A · 高价值** | 命中 **T1 ／ T2 ／ T3 至少一条** ＋ 有可读实现 ＋ 锚版本可辨 | 进「**必读清单**」 |
| **B · 参考** | 命中 T4 ／ T5 ／ T6；或命中 T1–T3 但**实现浅 ／ 版本旧 ／ 只有 README** | 进「**扫描清单**」 |
| **C · 存档** | 相关，但借鉴点只到「名词级启发」 | **只登记一行**，不展开 |
| **D · 出局** | 硬闸门 G1–G5 任一不过 | 不展开（最多一行「已排除 ＋ 理由」） |

---

## 3 候选必填字段（**统一表 —— 五方报告必须同格式，否则无法合并**）

| 字段 | 填法 |
|---|---|
| 候选 | `owner/repo` 或 `@scope/pkg` |
| 类型 | 官方包 ／ 社区件 ／ 上游主仓 |
| **入口** | **写到可复制**：本地路径（若已落位）或 URL |
| LICENSE | SPDX 标识，或原样照抄 |
| 锚版本 | 它声明适配的 DSH 版本 ＋ **判据**（哪个文件哪一行 ／ 哪个字段） |
| 最后更新 | 日期 ＋ **取自何处**（`git log` ／ npm publish time ／ 仓内 CHANGELOG） |
| 命中 | T1…T6 中的哪些 |
| 分档 | A ／ B ／ C ／ D |
| **借鉴点** | 一句话，**具体到可抄什么**（不是「很值得学习」，而是「它的 X 解决我们的 Y」） |
| **⛔ 不可参考** | 许可限制 ／ 版本不符 ／ 形态冲突（如 React ↔ 我方 Vue/Tauri）／ 与产品语义冲突 |
| **它怎么验的** | 对方有无测试、怎么验的（对应 §3.6 登记表那张「对方如何验证该设计」列） |
| **证据等级** | 🟢 我方实读源码 ／ 🟡 仅读到 README 或转述 ／ 🔴 不可作依据（🔴 不进结论区） |
| 备注 | 已知坑、待核项 |

---

## 4 报告形态（三段缺一不可，顺序固定）

1. **检索账**：用了**哪些通道**（本地名录 ／ 上游主仓 ／ npm ／ GitHub 搜索 ／ 目录站 …）、**检索式**、**时间**、**扫了多少条** —— 目的是**可复算**。⚠️ 本项目铁律：**通道不同则结论不可互推** ⇒ 通道必须写明。
2. **候选表**：按 §3 字段。
3. **评论**：对这批判的判断（哪些值得深读 ／ 哪些是坑 ／ **版本脱节判断**）。⚠️ **评论须与观察分开写** —— 观察带证据，评论标注为评论。

---

## 5 反纪律（6 条 —— 违反即本报告不可采信）

1. ⛔ **不编**：找不到就写「无」。§3.6 原话「**空着比编一个强**」。
2. ⛔ **星标 ／ 热度不构成理由**（§3.0 立论：现象级爆发必然伴随弃坑；14.7k star 的精选，两年后相当比例是弃坑件）。
3. ⛔ **不采信二手转述**：README 宣称 ≠ 实现。能读源码就读源码；只能读 README 的，标 🟡。
4. ⛔ **提交前不得翻阅其他 AI 的交流区**（含 `log-workbuddy.md`）。**本任务的对照价值就在「同规则、异通道、互不影响」** —— 一旦互看，跨通道交叉验证即失效。
5. ⚠️ **版本脱节必须显式暴露**：若发现社区主流已普遍要求**高于 `0.1.5-rc.2`** 的 DSH（即无法利用社区红利），**单独一节写给老大**（§3.6 表头老大注原文要求）。
6. ⚠️ **报告须注明检索通道 ＋ 时间**（社区日新月异；结论只在标注的通道内成立）。

---

## 6 必扫区（**共同基线 —— 五方都要过一遍**，保证可对账）

### ① 官方包（本机已在，`~/.dsh/profiles/sdk/node_modules/@deepseek-ai/`）
```
dsh-compaction-basic/               ← 默认 Provider（registers ctx.compaction）
dsh-compaction-tool-result-pruner/  ← tool 输出裁剪
dsh-command-compact/                ← 按需 /compact
```

### ② 契约件（本机不在扁平层 ⇒ 读上游主仓 `ref/dsh-bare/`）
```bash
git -C ref/dsh-bare ls-tree -r --name-only dsh-v0.1.5-rc.2 packages/compaction/
git -C ref/dsh-bare show dsh-v0.1.5-rc.2:packages/compaction/README.md
git -C ref/dsh-bare show dsh-v0.1.5-rc.2:packages/compaction/compaction/README.md
git -C ref/dsh-bare ls-tree -r --name-only dsh-v0.1.5-rc.2 packages/context/
```
> `ref/dsh-bare` 是**裸仓库**，tag 已含 `dsh-v0.1.5-rc.2`（＝我方锚版）⇒ 直接用 `git show <tag>:<path>`，**不必 checkout**。拉新 tag 用 `git -C ref/dsh-bare fetch --tags`。
> 已实测的包树形状（2026-09-23）：`packages/compaction/{compaction,compaction-basic,compaction-tool-result-pruner,command-compact}`，其中 `compaction-basic/src/` 有 `index.ts` ／ `config.ts` ／ `region.ts` ／ `summarizer.ts` ／ `types.ts` 与 **5 个 spec**。

### ③ 社区已登记 2 件（登记表 3.4 行；**本地落位 = 「—」，尚未拉取**）
```
aerince/dsh-active-context-pruning   ← 经官方 compaction API 做模型自定剪枝
giter00/dsh-headroom                 ← 压 tool 输出、保原文
```

### ④ 本地名录 `ref/awesome-dsh-plugin.md`（3,386 行 ／ 27 分类，**不联网**）
⚠️ **名录无 compaction 专类** ⇒ 重点扫：
`Sessions & Messages`(行 1061) ／ `Memory`(1265) ／ `Usage & Billing`(615，token 计费) ／ `Tools & Capabilities`(1417) ／ `Development & Runtime`(2705)

### ⑤ 社区目录站（如可达）：`deepseek-harness-plugin.com`

---

## 7 自选区（各自外扩 —— **不限通道，但须记账**）

- npm org 搜索（`@deepseek-ai/*` 全量 ＋ 关键词）
- GitHub 搜索（`dsh compaction` ／ `context pruning` ／ `token budget` …）
- 其他名录 ／ 博客 ／ 讨论帖

**建议侧重（非强制）**：各方检索通道与视角天然不同 —— 这正是本任务的价值。若某方向你判断已由他方覆盖，可转向别的方向；但**不要求你猜别人扫了什么**，按自己通道走即可。

---

## 8 通道提示（已知坑，省你时间）

- **本机 git 全局配了「不在运行」的本机代理** ⇒ `git clone` 报 `Failed to connect to github.com port 443 via 127.0.0.1`，**看起来像被墙、实为代理**。绕法：
  `git -c http.proxy= -c https.proxy= clone --depth 1 <url> <dst>`（并清掉 env 的 `http_proxy` ／ `https_proxy`）
- **浅克隆**（`--depth 1`）；**只读参考、不进构建、不入依赖**（§3.0）
- ⛔ **不把候选件装进任何环境** —— 连 `dsh plugin add` 试装也**不在本次范围内**（要试装是另一次授权动作）

---

## 9 交付与落点

- 报告写进**各自交流区文件**（WB 另有汇总落点，见 §10）
- 规则有歧义 ／ 不可执行 ⇒ **就地暴露并停手等裁决**（对齐 `exchange/README.md` 协作规则「升级路径」），不静默处理
- 无硬时限（老大节奏：无固定交付压力）
- 收齐后：WB 汇总 → 候选池 ＋ 排序 ＋ 借鉴点 → 回填 `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉**3.4 行**

---

## 10 五方分派登记（2026-09-23 派发）

| 方 | 落点 | 状态 |
|---|---|---|
| **WB** | `exchange/log-workbuddy.md` | 📬 已派发（WB 自承，报告与本稿汇总区合并） |
| **Trae** | `exchange/log-trae.md` | 📬 已派发 |
| **Claude** | `exchange/log-claude.md` | 📬 已派发 |
| **Qoder** | `exchange/log-qoder.md` | 📬 已派发 |
| **Other**（编外，待老大点将） | `exchange/log-other.md` | 📬 已派发 |

> ⚠️ **独立纪律**：五方在**提交自己的报告前**不得翻阅其他方的交流区 —— 本设计要的是「同规则、异通道、互不影响」的**交叉对照**，不是分工协作。

---

## 11 汇总区（WB 收到报告后填）

> 待填。字段：候选池（合并去重）／ 分档统计 ／ 各方通道对照 ／ 分歧点 ／ 版本脱节判断 ／ 建议深读清单（Top N）。
>
> ⏳ **已到**：**WB 侧 = §12**（2026-09-23 自承）｜ **待**：Trae ／ Claude ／ Qoder ／ Other。

---

## 12 WB 侧调研报告（自承 · 2026-09-23）

> 按本稿 §4 三段格式。WB 同时是汇总方 ⇒ 本段只交**自己那一路**的结果，**不代替**其他四方；五方收齐后再填 §11。

### ① 检索账（可复算）

| # | 通道 | 动作 ／ 检索式 | 时间 | 扫描量 ／ 结果 |
|---|---|---|---|---|
| 1 | 本地 · 上游主仓（裸仓库 `ref/dsh-bare`，tag `dsh-v0.1.5-rc.2`） | `git ls-tree -r packages/compaction/` ＋ `git show <tag>:<path>` 读 4 件 README ＋ `src/index.ts`（172 行）＋ `src/config.ts` ＋ `docs/subsystems/compaction.md`（结构） | 2026-09-23 | compaction 家族 4 件 ／ context 家族 1 组 |
| 2 | 本地 · 官方包（`~/.dsh/profiles/sdk/node_modules/@deepseek-ai/`） | `ls -d *compaction*` | 2026-09-23 | **3 件在**：`dsh-compaction-basic` ／ `dsh-compaction-tool-result-pruner` ／ `dsh-command-compact`（契约 `dsh-compaction` 不在扁平层，只在上游主仓与 `.pnpm` 深层） |
| 3 | 本地 · 社区名录 `ref/awesome-dsh-plugin.md`（3,386 行） | 宽扫 `compact\|prun\|summar\|headroom\|compress\|context budget\|token budget\|context window` ⇒ **458 条**；紧扫（**强相关词 ∧ 非 UI 噪音词**）⇒ **75 条**；再逐条读描述 | 2026-09-23 | 3,386 行全量 ／ 定稿候选 ~18 条 |
| 4 | 联网 · WebSearch | `giter00/dsh-headroom DeepSeek Harness plugin compaction tool output` | 2026-09-23 | 5 命中（含 dsh.so ／ dsh.pub 注册表 ／ 同名异物） |
| 5 | 联网 · WebSearch | `aerince/dsh-active-context-pruning DeepSeek Harness compaction API` | 2026-09-23 | 5 命中（含注册表**版本矩阵** ／ awesome 站 ／ 中文解读） |

**未做（留给其他方，避免同通道重复）**：GitHub 站内搜索 ／ npm 站内搜索 ／ `deepseek-harness-plugin.com` 目录站 ／ 拉取任何候选源码到 `ref/community/`。

⚠️ **通道说明**：本地 git 走 **Bash 通道**；联网走**内置搜索工具**（供应商 Provider 1）。按本项目铁律，**通道不同则结论不可互推** —— 本报告结论只在上述通道内成立。

### ② 候选表

#### A 组 · 官方 ／ 上游（🟢 我方实读源码或 README）

| 候选 | 类型 | 入口 | 锚版本 | 命中 | 档 | 借鉴点 | ⛔ 不可参考 | 它怎么验的 | 证据 |
|---|---|---|---|---|---|---|---|---|---|
| `@deepseek-ai/dsh-compaction`（契约） | 官方 | `ref/dsh-bare:packages/compaction/compaction/`；签名 `src/index.ts:96-172`；子系统参考 `ref/dsh-bare:docs/subsystems/compaction.md`（238 行） | **我方锚版本身** | T1 T5 | **A** | 三操作 `compactIfNeeded(agent,trigger,signal)` ／ `compactNow(agent,signal,sourceCommandId?)` ／ `compactRegion(start,end,agent,signal?)`；`abstract class CompactionEngine extends Service` ＋ `super(ctx,'compaction')`；**日志括号锁**：`compaction/start` →（summarize）→ `compaction/summary` → **唯一 surface 变更**（一条 `user/message` 带 `surfaceOp:{op:'replace',startSeq,endSeq}`）→ `compaction/end`；**checkpoint marker 从 cordis-free 子路径 `./checkpoint` 导出** ⇒ ⭐ **验「摘要注入」的现成机读判据**；`toolPairingBalancedBefore/After(session,seq)` 做边界吸附 | 无（我方自做 Provider 的正本） | 官方仓自带 tests（本轮未读） | 🟢 |
| `@deepseek-ai/dsh-compaction-basic` | 官方 Provider | `~/.dsh/profiles/sdk/node_modules/@deepseek-ai/dsh-compaction-basic/`；上游 `packages/compaction/compaction-basic/`（`src/` 5 文件 ＋ **5 个 spec**） | 锚版本身 | T2 T4 T5 T6 | **A** | ⭐ **T4 量化锚**：`thresholdRatio` **0.8**（`floor(routedContextWindow × ratio)`）／ `retainRatio` **0.16**（保留最新 16% 原文逐字）／ `retainTokens`（绝对值，与 ratio 互斥）／ `maxTokens` 8192 ／ `compactionRetries` 1 ／ `maxOverflowRetries` ／ `auto` ／ `modelPolicies`（每模型覆盖）；**触发点 = `agent/pre-step` 前置**（自动）＋ `agent/request-error` 的 `CONTEXT_WINDOW_EXCEEDED`（溢出恢复）；**`summarize()` 是唯一子类钩子**（覆写即换摘要来源：模板 ／ 远端）；替换消息用 **`<compacted-summary>`** 标签包裹、`GenerateOptions.purpose='compaction'`、原文摘要在 `compaction/summary` 事件上 | 无（正本） | 官方 5 个 spec（本轮未读） | 🟢 |
| `@deepseek-ai/dsh-compaction-tool-result-pruner` | 官方 | 同上（profile 内 `<1000>`） | 锚版本身 | T2 T3 T6 | **A** | ⭐ **「压了但保原文」的最强现成范式**：超 `thresholdChars`(8192 码点) 的结果 → 头 `headChars`(4096) ＋ 标记 `[... tool result middle pruned ...]` ＋ 尾 `tailChars`(1024)；**原文留在 append-only log**，替换件以 `sourceEventSeqs` 引用原事件 ⇒ **重放可复原**；`compaction/prune` **shadow-price 事件**紧 precede 替换；**不发模型调用**，可能因此**跳过摘要** | 无 | 官方 tests（未读） | 🟢 |
| `@deepseek-ai/dsh-command-compact` | 官方命令 | 同上 | 锚版本身 | T5 T6 | B | `/compact` **不消耗 model turn**；报告「压缩条目数 ＋ 估计省 token」；mid-turn ／ 已在压缩 ⇒ unavailable；**不接受参数** | — | 官方 tests | 🟢 |
| `@deepseek-ai/dsh-token-meter` | 官方 | 上游 `packages/llm/token-meter/` | 锚版本身 | T4 T6 | B | 触发判定的**测量服务**：singleton `ctx.tokenMeter`；⚠️ **四字符≈1 token 启发式，明确低估 CJK 与 JSON schema** | — | — | 🟢（README 引述） |
| 上游 `docs/subsystems/compaction.md`（238 行） | 上游主仓 | `ref/dsh-bare:<path>` | 锚版本身 | T1 T2 | **A** | 结构：`compaction/*` 事件 ／ `CompactionResult` ／ service ／ tool-result pruning outcomes ／ **Cordis API**（`ctx.compaction` ／ `ctx.toolResultPruner`）⇒ 精确签名与每事件 payload 的权威落点 | — | — | 🟢（**仅读结构**，内容未读 ⇒ 内容面 🟡） |
| 上游设计 note `.agents/notes/implemented/feature/2026-06-18-compaction-capability-seam.md` | 上游主仓 | `ref/dsh-bare:<path>` | 锚版本身 | T1 | B | seam 分裂 ＋ session/llm 依赖的**设计理由**（本轮只从契约 README 里看到路径，**未读内容**） | — | — | 🟡（仅见引用） |
| 上游 `docs/config-catalog.md#deepseek-aidsh-compaction-basic` ／ `#…-tool-result-pruner` | 上游主仓 | 同上 | 锚版本身 | T4 | B | 「每个可接受字段的**穷尽来源**」（未读） | — | — | 🟡（未读） |

#### B 组 · 社区（🟡 README ／ 注册表级 —— **本轮一件源码都没读**）

| 候选 | 入口 | LICENSE | 锚版本 | 命中 | 档 | 借鉴点 | ⛔ 不可参考 | 它怎么验的 | 证据 |
|---|---|---|---|---|---|---|---|---|---|
| `aerince/dsh-active-context-pruning` | 名录 L1273 ／ `github.com/aerince/dsh-active-context-pruning` | **MIT** | 注册表矩阵：v0.1.0 对 **`dsh 0.1.5-rc.2` ✓ L5 runtime verified**（另 0.1.6-α1 ／ 0.1.3-α2 ／ 0.1.3-α1 ／ 0.1.2-rc.1 亦 ✓） | T2 T3 T5 | **A** | ⭐ **与我方最同题**：**模型自选** surface seq 范围、**模型自写摘要**，走官方 `ctx.compaction.compactRegion`；产物 = `acp_status` ／ `acp_compress` ／ `acp_decompress` ／ `acp_search` 四工具 ＋ `/acp` 命令；**`preserveRecent`（默认 2，含未闭合工具调用）** ⇒ 「近文保留」的现成参数化；`minTokens:200`；`minContextLimit:"60%"` ／ `maxContextLimit:"70%"`（**与官方 0.8 不同**，是另一套取值）；`acp_decompress` **只读原文、不撤销 replace**；**摘要必须比被藏内容短**，否则官方引擎拒绝 | ① 它是**工具驱动**（模型主动压），与 S2 判据（自动/显式触发）**不完全同构**；② `acp_` 前缀**不是** Agent Client Protocol（官方 `@deepseek-ai/dsh-acp`）—— 命名歧义；③ **依赖官方 basic 提供 `compactRegion`**，不装 basic 它没意义 | README 给 `node check.js` 纯函数自检 ＋ `--dump-config` 验证；**无测试说明** | 🟡 |
| `giter00/dsh-headroom` | 名录 L1298 ／ dsh.pub v0.3.0 | 未核 | 注册表：**`dsh 0.1.2-rc.1` ✓ L5（2026-09-05）**；0.1.3-α2 ◐ L4；⚠️ **未见 `0.1.5-rc.2` 行** | T2 T3 T5 T6 | B | ⭐ **「压了但可逐字节取回」**：挂 `tools/post-execute`，**结果物化前**替换文本；**内容路由 ＋ 专用压缩器**（JSON 透视 `_keys`/`_rows`/`_common`；grep 按文件折叠；日志连续重复行折叠但保 error/fail/exception/assert；表格保表头首尾、中间 offload；长文本 Kompress）；**CCR store 存原文 ＋ marker**，模型可 `headroom_retrieve(id=…)` **逐字节取回**；**代码默认不压**；自述省 token：JSON 65.6% ／ grep 41.3% ／ log 56.8% ／ CSV 59.8% ／ prose 94.7% | ① 它是 **tool-output 压缩**（与官方 pruner 同生态位），**不是** conversation summarization ⇒ **不解决"近文原文保留 ＋ 摘要注入"**；② 自述 **Kompress 默认评分器是启发式模拟、非真模型推理**，输出可读性有限；③ 引入 `headroom_retrieve` = **新增模型工具面**（官方取向是"人工命令、无模型工具"）；④ **版本矩阵未见我们锚版** | 自带 `scripts/verify-compress.mjs` ／ `verify-apply.mjs`：断言结构化事实保留、code ／ short ／ error 输出**字节不变**、CCR 可取回、**NEEDLE-42 在压视图不可见但可取回** | 🟡 |
| `ljsysfurryACE/dsh-compaction` | 名录 L1334 | 未核 | 未核 | T2 T3 | B | ⭐ **「自做 Provider」的实样**：Compaction backend **以确定性语义抽取器替换 LLM 摘要**（保 code ／ paths ／ commands，丢 chatter）＋ 自述 28.4x KV 压缩 | 未读源码 | 未核 | 🟡 |
| `ICCuse/dsh-premise-guard` | 名录 L1310 | 未核 | 未核 | T5 T6 | **A?** | ⭐⭐ **与我方判据反向同题**：**压缩后前提漂移守卫** —— 当摘要**丢掉了关键字面锚**时注入一次性提示 ⇒ 「摘要含可验证 nonce ／ 锚」这条判据的**现成对照装置** | 未读 | 未核 | 🟡 |
| `yoza10635/dsh-argp` | 名录 L1253 | 未核 | 未核 | T2 T3 | B | 「LLM proposes, **deterministic guards dispose**」＋ per-atom shrink（extract ／ summary ／ …）⇒ **守卫式压缩**：模型只提议、确定性守卫裁决 | 未读 | 未核 | 🟡 |
| `JohnXu22786/context-pruner` | 名录 L1323 | 未核 | 未核 | T2 T3 | B | **确定性筛选器**裁 stale ／ duplicate ／ failed ／ oversized，描述称 **"through the official …"**（截断，疑走官方接口） | 未读 | 未核 | 🟡 |
| `songoao25/dsh-auto-compact` | 名录 L1379 | 未核 | 未核 | T4 | B | 一键应用**调优过的 threshold ／ retention 预算 ＋ 每模型策略** ⇒ 官方阈值参数的**实践取值**参考 | 未读 | 未核 | 🟡 |
| `falling-ts/dsh-force-compact` | 名录 L1105 | 未核 | 未核 | T4 | B | **强制触发压缩**（低上下文模型场景）⇒ T4「逼出触发」的现成思路 | 未读 | 未核 | 🟡 |
| `ICCuse/dsh-file-memory` | 名录 L1308 | 未核 | 未核 | T3 | C | 文件式工作记忆：**关键前提逐字存盘**，以无损穿过压缩 | 未读 | 未核 | 🟡 |
| `zhubaohi/dsh-qwen38-compaction-fix` | 名录 L1044 | 未核 | 未核 | T6 | B | **坑实证**：压缩调用与 session-title 调用**需禁 thinking**，否则高 reasoning 把 `maxTokens` 吃掉 ⇒ 与官方已知限制（`maxTokens` 截断可被 hidden reasoning 消耗）**对上** | 未读 | 未核 | 🟡 |
| `Tyan66666/billion-context-dsh` | 名录 L1388 | 未核 | 未核 | T2 | C | 与上表 `aerince` 同题（"Active Context Pruning"）⇒ 疑 fork ／ 同源，**待去重** | 未读 | 未核 | 🟡 |
| `Icstick/dsh-context-maid` | 名录 L1128 | 未核 | 未核 | T3 T6 | C | content-aware tool-output slimming ＋ dead-log sweep ＋ 钉住用户要求与在飞工作 ＋ archive-then-… | 未读 | 未核 | 🟡 |
| `ishuowang/dsh-sideband` | 名录 L1131 | 未核 | 未核 | T3 | C | 冻结有限 session 快照、**异步摘要**（不打断在跑 agent） | 未读 | 未核 | 🟡 |
| `LFM097384/Context-Prism` | 名录 L1330 | 未核 | 未核 | T3 | C | 项目级本地上下文引擎（检索 ／ 压缩 ／ 优先级） | 未读 | 未核 | 🟡 |
| `qwert702/dsh-context-compressor` | 名录 L1192 | 未核 | 未核 | T4 | C | UI 层「一键压缩」（会话标题栏按钮） | 未读 | 未核 | 🟡 |
| `snow-The/dsh-session-handoff` ／ `whiteS18/dsh-handoff-button` | 名录 L1211 ／ L1231 | 未核 | 未核 | T3 | C | 交接文档式摘要（export ／ resume ／ status）⇒ **属 handoff，不属 compaction** | 未读 | 未核 | 🟡 |
| `vibeinging/dsh-agent-budget` | 名录 L758 | 未核 | 未核 | T4 | C | agent-tree token 预算管理 | 未读 | 未核 | 🟡 |

#### D 组 · 排除（**G3 闸门的实测印证**）

- 名录宽扫 **458 条**命中里，绝大多数是 **UI 语义**（`context menu` ／ 折叠 ／ 侧栏 ／ 面板 ／ chip）；收紧规则（强相关词 ∧ 非 UI 噪音词）后 **75 条**；逐条读描述后**真相关 ~18 条**。⇒ **「不许按关键词计数判相关」这条闸门是必要的**，且**名录无 compaction 专类**，必须落到 `Sessions & Messages`(1061) ／ `Memory`(1265) 两个分类里逐条读。

### ③ 评论（与上面的观察分开）

1. **3.4 的参考件横跨两个生态位，混了会在错误的层面设计。**
   - **(a) conversation compaction**：官方契约 ＋ basic ＋ command-compact；社区 `aerince` ／ `ljsysfurryACE` ／ `yoza10635` ／ `songoao25` ／ `falling-ts`。→ **与 3.4 同题**。
   - **(b) tool-output 压缩 ／ 可逆取回**：官方 pruner；社区 `headroom` ／ `context-pruner` ／ `context-maid`。→ 只在**「压什么」上互补**，**不解决**「摘要注入 ＋ 近文原文保留」。
   - ⇒ 若把 (b) 当 (a) 参考，会把 S2 做成"工具输出瘦身"，**判据永远验不到"近文原文保留"**。

2. **契约面不需要社区。** 官方契约 ＋ 上游 `docs/subsystems/compaction.md` ＋ `src/index.ts` 已是**完整正本**（🟢，实读）。社区的价值集中在 **T3（策略）／ T4（阈值实践）／ T5（守卫与验证）**。

3. **T5 可能有一个"白送"的机读判据，且正反面都有现成件。** 契约的 checkpoint marker 从 **cordis-free 子路径**导出 ⇒ 验「摘要注入」**不必自造探针**；而 `ICCuse/dsh-premise-guard` 提供**反向**做法（摘要丢锚即告警）⇒ 两者合起来正好覆盖我方「摘要含可验证 nonce」的正反两侧。**建议列入 Top 深读。**

4. **T4 的量化锚已由官方给出，且有量可算。** 阈值 = 路由模型窗口 × **0.8**、保留 **16%** 逐字、摘要输出上限 **8192**。若 `contextWindow` 1M 成立，则「1 轮逼出」需注入约 **80 万 token 量级** —— 这正是判据要「开跑前给 token ／ 费用上限」的**量纲依据**（不再是毛估）。
   ⚠️ **且有一条系统性偏差**：`ctx.tokenMeter` 用**四字符≈1 token** 的启发式、**明确低估 CJK** ⇒ 中文填充文本的**真实 token 数高于估值**，构造时须以**真 token 读数**校准，别用字符数反推。

5. **版本脱节判断（老大注要求）—— 暂判「社区红利可用」，无需上报脱节。** 依据：`aerince` 在 **`dsh 0.1.5-rc.2` 上拿到 L5 runtime verified**；官方三件与锚版**同代**（本机 profile 内即是）。⚠️ **唯一待核**：`giter00/dsh-headroom` 的注册表矩阵**未见我们锚版行**（最新行 = 0.1.2-rc.1 ✓）。⇒ 这不构成"脱节"，但**该件的兼容性不能假定**。

6. **两条值得单独记的坑。**
   - **摘要被截断是真实失败模式**：`zhubaohi/dsh-qwen38-compaction-fix` 与官方 Dev Note 都指向 **hidden reasoning tokens 吃掉 `maxTokens`** ⇒ 我方判据要能区分「**没压**」与「**压了但摘要被截**」，否则"摘要含 nonce"失败时无法归因。
   - **`dsh-headroom` 的 CCR 模式引入新模型工具**（`headroom_retrieve`），与官方"compaction 是人工命令、无模型工具"取向**相反** ⇒ 若借鉴，**那是产品决策，不是实现细节**，须走老大拍板而非在 3.4 里顺手做掉。

7. **⚠️ 同名异物（检索陷阱，已实测撞到）**：`giter00/dsh-headroom`（tool 输出压缩**插件**）≠ `wjxn13/dsh-headroom`（Python Headroom **代理**，需 pip venv 约 50MB、走"线路切换"），二者都会命中 "dsh-headroom"。⇒ 登记与检索**必须写全 `owner/repo`**。（旁证：另有 `Zenjibad/headroom-stats-plugin` 服务于代理线。）

### ④ 本轮诚实边界

- **社区件一件源码都没读** —— 全部 🟡（README ／ 注册表级）。所有 B 组条目的「借鉴点」**只是候选线索，不是已核事实**。
- 上游有 **3 件只读了结构未读内容**：`docs/subsystems/compaction.md`（238 行，只读标题）、设计 note、config-catalog。
- **未做** GitHub ／ npm 站内搜索；**未拉**任何候选到 `ref/community/`；**未装**任何件（§3.0 纪律）。
- 上述所有结论**只在「本地 Bash 通道 ＋ 内置搜索工具」这两条通道内成立**，不可外推。
