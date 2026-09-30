# DSH-3.4（S2 compaction）参考件调研 · 筛选规则与五方分派

> **本稿性质（两段式）**：**§1–§10 = 操作规格**（2026-09-23 派发时的规则原文，保持不改 ／ 作留痕）；**§11 = 汇总**（2026-09-28 收口）。
> **✅ 调研已收口（2026-09-28）**：四方（WB ／ Trae ／ Claude ／ Qoder）交付齐、融合轮完成（**Other 编外任务已取消**）⇒ 候选池 ／ 排序 ／ 借鉴点见 **§11**，并回填 `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉**3.4 行**。
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

- 报告写进**各自交流区文件**（＝ §10 登记的那一份）
- 规则有歧义 ／ 不可执行 ⇒ **就地暴露并停手等裁决**（对齐 `exchange/README.md` 协作规则「升级路径」），不静默处理
- 无硬时限（老大节奏：无固定交付压力）
- 收齐后：WB 汇总 → 候选池 ＋ 排序 ＋ 借鉴点 → 回填 `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉**3.4 行**

---

## 10 五方分派登记（派发 2026-09-23 · 状态列 2026-09-28 更新）

| 方 | 落点 | 状态（2026-09-28） |
|---|---|---|
| **WB** | `exchange/log-workbuddy.md` | ✅ **已交付**（轮 1 ＋ 轮 2 ＋ 融合轮） |
| **Trae** | `exchange/log-trae.md` | ✅ **已交付**（原报告 ＋ 融合轮） |
| **Claude** | `exchange/log-claude.md` | ✅ **已交付**（原报告 ＋ 补遗 ＋ 融合轮） |
| **Qoder** | `exchange/log-qoder.md` | ✅ **已交付**（原报告 ＋ 补遗 ＋ 融合轮） |
| ~~**Other**~~（编外） | ~~`exchange/log-other.md`~~ | ⛔ **任务已取消**（老大 2026-09-23 ／ `ebe96e5`） |

> ⚠️ **独立纪律**：五方在**提交自己的报告前**不得翻阅其他方的交流区 —— 本设计要的是「同规则、异通道、互不影响」的**交叉对照**，不是分工协作。
> 📌 **落点时效说明（2026-09-30 补）**：上表「落点」列记的是**交付当时**的交流区位置；`log-*` **不承诺长期保留**（`exchange/README.md` 协作规则末条）⇒ 截至 2026-09-30，WB ／ Trae ／ Claude 三方的报到段落**均已按规矩清理**（原始文本回溯：`git log -p -- exchange/log-<方>.md`）。**本稿 §1–§11 才是稳定落点**，⛔ 上表不可当活指针用。

---

## 11 汇总（WB 收口 · 2026-09-28）

> **性质变化**：**§1–§10 是本任务 2026-09-23 派发时的规则原文**（保持不改，作留痕）；**§11 起为汇总**。⇐ 本稿由「操作规格」转为「**调研成果稿**」。
> **为何现在可以写进来**：规格稿的「中立」需求**只在各方独立作业期间成立**（防污染）。**四方交付齐 ＋ 融合轮完成（2026-09-28）⇒ 该窗口已关闭**，本稿对"下一批读者"而言是**成果**而非在用的规格。
> **汇总口径（老大 2026-09-23）**：各方交付**取当下状态当一版看待**（不管改过几次、不区分轮次）；**版本锚定不做深度追踪**（DSH 演进快、社区在探索期 ⇒ 持续观察）。
> **收口时点**：2026-09-28 ｜ **Other 编外任务已由老大取消**（`ebe96e5`）⇒ 五方实为四方。
> **修订（2026-09-28）**：二次**通读**四方全文，补入首版**跳读漏掉**的两段 —— Claude「补充调研」段与 Qoder「补遗」段 —— 及其方法级增量。

### 11.1 交付与污染披露（先讲限制，再讲结论）

| 方 | 落点 | 交付 | 通道 | 联网实读源码 |
|---|---|---|---|---|
| **WB** | `exchange/log-workbuddy.md` | 轮 1 ＋ 轮 2 ＋ 融合轮 | 裸仓 ／ 官方包 ／ 本地名录 ／ 内置搜索；**轮 2 起** GitHub REST ＋ npm registry ＋ 浅克隆 | ✅（梯子 09-23 晚开）→ **6 件** |
| **Trae** | `exchange/log-trae.md` | 原报告 ＋ 融合轮 | 本机 PowerShell ＋ 裸仓 ／ 名录 ＋ `git clone` | ✅（当日）→ **9 件** |
| **Claude** | `exchange/log-claude.md` | 原报告 ＋ **补充调研** ＋ 融合轮 | 本机 bash ＋ 裸仓 ＋ 内置搜索；**补充调研起**加联网 `git clone` | ⚠️ **两阶段**：白天 ❌（3 件 clone 全失败 ＋ WebFetch 被拦）→ **晚梯子开后 ✅ 5/5 clone 成功** ⇒ 社区实读 **5 件**（**不是 0 件**） |
| **Qoder** | `exchange/log-qoder.md` | 原报告 ＋ 补遗 ＋ 融合轮 | 本地 ＋ **目录站** ＋ GitHub 搜索 ＋ `git clone`；**补遗起**加 **npm registry（整包 packument）** | ✅ → **2 ＋ 7 件** |
| ~~Other~~ | ~~`exchange/log-other.md`~~ | **任务已取消** | — | — |

> ⚠️ **原文落点已清理（2026-09-29）**：上表与 **§10** 所记的四方交流区交付段，**已按交流区规矩清理** —— 其内容**已全数收进本稿 §11**。⛔ 追原文须走 git（`git log -p -- exchange/log-<方>.md`），**别再按上表路径去找**。

⚠️ **一条已披露的限制**（**老大 2026-09-28 口径**：独立性非必要条件、结果优先 ⇒ **保留披露，但不据此给任何候选打折**）：规格稿曾内嵌 WB 报告（**§12**，2026-09-23 提交 `b5f420f`），而该 §12 **在五方按规格作业的期间处于公开状态** —— **Claude 与 Qoder 都在各自报告里明确写"已读到它"**。
⇒ **凡与 WB 轮 1 结论重合的项，只能记 1 条通道，不是 2 条。** 本汇总据此**不把"多方都提到"当作独立互证**；**只有明确来自不同通道的实做（11.4 后两列）才算交叉验证**。
⇒ 这也解释了 11.5 里官方件相关条目占多数：它们**本就出自同一份上游**，重合是**必然而非互证**。

### 11.2 候选池（合并去重）

#### A 组 · 官方 ／ 上游（🟢，四方共读同一份锚版）

| # | 候选 ／ 入口 | 命中 | 可抄什么（具体） |
|---|---|---|---|
| **A1** | `dsh-compaction`（契约）`packages/compaction/compaction/src/index.ts:96-172`；子系统 `docs/subsystems/compaction.md`（238 行） | T1 T5 | 三操作签名：`compactIfNeeded(agent,trigger,signal)` ／ `compactNow(agent,signal,sourceCommandId?)` ／ `compactRegion(start,end,agent,signal?)`；`abstract class CompactionEngine extends Service` ＋ `super(ctx,'compaction')`；**checkpoint marker 从 cordis-free 子路径 `./checkpoint` 导出**（任何消费者可识别压缩历史） |
| **A2** | ⭐ `packages/core/session/src/types.ts:436` ＋ `surface.ts:229-240`（**replace 的权威定义 ＋ 运行期校验器**） | T1 T5 | ⭐ **replace surfaceOp 恰好三键**（`Object.keys(op).length === 3`，**多一即抛**）⇒ ⛔ 不得往里塞调试字段；字段名 **V0/V2 `{start,end}` → V3 `{startSeq,endSeq}`**（写旧名在锚版运行期抛错）；`assistant/message` 的 `sourceEventSeqs` 恒 `never` |
| **A3** | `dsh-compaction-basic`（默认 Provider）`packages/compaction/compaction-basic/` | T2 T3 T4 T6 | ⭐⭐ **T3 的权威答案在本件**：`thresholdRatio` **0.8** ／ `retainRatio` **0.16**（尾部逐字）／ `retainTokens`（绝对值，与 ratio **互斥**）／ `maxTokens` **8192** ／ `compactionRetries` **1**；`selectCompactableRange` **从尾反向累加**、**从不切开 tool-call/result 对**；**`summarize()` 是唯一子类钩子**；摘要框 `<compacted-summary>`；**截断 = 抛 `MAX_TOKENS`（fail-closed，不缩不丢）** |
| **A4** | ⭐ 官方**第 4 根杠杆**：`summarizationProvider` ＋ `summarizationModel`（`config.ts:30-31,89-90`，**必须成对**，`:254-271` 校验） | T2 T4 | 可把**摘要调用单独改路由**（小窗口会话交大窗口模型）——WB 轮 2 的增量，其余三方原报告均无 |
| **A5** | `dsh-compaction-tool-result-pruner` | T2 T3 T6 | 超 **8192 码点** → 头 **4096** ＋ `[... tool result middle pruned ...]` ＋ 尾 **1024**；**原文留 append-only log**、替换件以 `sourceEventSeqs` 引用 ⇒ 重放可复原；`compaction/prune` **shadow-price** 事件；**不发模型调用**；切片按 **Unicode code point** |
| **A6** | `dsh-command-compact`（`src/index.ts:66`） | T4 | `/compact` → `compactNow` → `selectCompactableRange(...,0)` ⇒ **不灌历史也能一次压到位**；⚠️ **手动路径硬编码 `retainTokens=0` ⇒ 只留最后 1 条**（与 `retainRatio` 语义不同，是判据陷阱）⛔ **2026-09-29 裁 A：本件不进我方栈**（产品不做手动入口）—— 本行留作「为何不能用手动路径验收」的依据 |
| **A7** | `dsh-token-meter`（`packages/llm/token-meter/src/estimate.ts`） | T4 T6 | 触发判定的**测量服务**（`ctx.tokenMeter.measure(session)`）；⚠️ **四字符≈1 token 启发式，明示低估 CJK 与 JSON schema** |
| **A8** | ⭐ **官方测试件 8 件 ／ 11 个 spec ／ 5,371 行**（`packages/compaction/*/tests/`） | T1 T3 T4 T5 T6 | ⭐⭐ **判据不必自造** —— 详见 **11.8 第一梯队**。Claude 全文实读 3 件（`invariant` 469 ／ `tool-pairing` 417 ／ `compaction` 171），其余 5 件四方合抓标题面 |
| **A9** | ⭐ **官方安装契约**：`apps/cli/src/plugin.ts:43-44` 读 `package.json#dsh.bundle.patch` | T6 | ⭐ **`dsh.plugin.json` 上游全仓无任何引用**（WB 全仓 grep 实测）⇒ 社区件里那份清单**无上游校验、不能当兼容性依据**；无 `dsh.bundle` 者被记为 plain dependency、**不入 profile 层** |

#### B 组 · 社区件（按**生态位分三层** —— 混层会在错误的层面设计）

**层① · conversation compaction（与 3.4 同题）**

| 候选 | LICENSE | 锚（**声明级**） | 实读 | 可抄什么 ／ ⚠️ |
|---|---|---|---|---|
| ⭐ `fan56/dsh-dcp` | MIT | ⚠️ **5 天内变**：09-23 `>=0.1.5-rc.2` → 09-28 **`>=0.1.7-rc.1`** | Trae 🟢 ／ WB 复核 | ⭐ **T2 教科书样本**：`class DcpEngine extends BasicCompactionEngine` ＋ **只 override `summarize()`**，触发／保留／事务锁／tool-pairing **全继承** ⇒ 「我们的 Provider」最小改动面就是这一个方法 |
| ⭐ `aerince/dsh-active-context-pruning` | MIT | 读不出（**无 peerDeps**）⇒ 🔴 | 三方 🟢 | ① **消费者路线**：调 `ctx.get('compaction').compactRegion(...)`；② ⭐ **外部包装 `compaction.summarize = …`（`ctx.effect()` 装／卸）** ⇒ 「换摘要来源」不必改官方源码；③ `isCheckpointEvent` 谓词；④ `preserveRecent` 默认 **2 = surface 节点数**；⚠️ **≥7 处读 `session.events`（锚版无该成员）⇒ 恢复／检索路径疑似失效，形态混合（抛／静默）**，🟠 源码级未实跑；⚠️ 注册表矩阵标 `0.1.5-rc.2 ✓ L5 runtime verified` ⇒ **矩阵验证范围待核** |
| ⭐ `knighthongyu/dsh-handoff-compaction` | MIT | ✅ **正锚**：`^0.1.5-rc.2`（default=true 实跑） | WB 🟢 | ⭐ **换 Provider 的端到端实样**：Bundle patch **禁用 `compaction-basic` ＋ `tool-result-pruner`、保留 `command-compact`**；**`retainTokens: 16000` 替代 16% 比例**（小窗口 16% 不足 ／ 大窗口过多）⇒ ⭐ `retainRatio` vs `retainTokens` 的**取舍实证**；其摘要调用**重放完整 surface**（为保前缀缓存）——与官方做法**相反** |
| ⭐ `QuanhuZeYu/dsh-compaction-zh` | MIT | 无 peer | WB 🟢 | ⭐ **直击我方产品问题**：官方压缩指令**硬编码英文**（含 "Write concise English engineering prose"）⇒ **中文会话的检查点也是英文**。它走 **`llm/stream` 瀑布 ＋ `options.purpose==='compaction'`** 只改那次辅助调用的尾指令；⭐ 并写明**上游没留指令注入口**（`COMPACTION_INSTRUCTION` 模块私有未导出、`summarizeWithLlm()` 不收指令参数） |
| `yoza10635/dsh-argp` | MIT | ⛔ **真脱节**：`^0.1.7-alpha.2` | Trae 🟢 | ⭐ **T3 最可抄的一条**：`infoSpans`（必保信息跨度）→ `verbatimInfo` → `fidelityGuard(verbatimInfo, candidate)` 得 `missing` ⇒ **「先声明必保跨度、压缩后做保真校验」**。⛔ 版本高于我方 ⇒ **只读思路** |
| ⛔ `ljsysfurryACE/dsh-compaction` | ⛔ **GPL-3.0** | `>=0.1.0`（预发布歧义） | Trae 🟢 ／ WB 独立复核 | 确定性语义抽取器**整环替换 LLM 摘要** ＋ 28.4× KV 记账。⛔ **传染性许可 ⇒ 思路可读、代码不可抄**（本地唯一 GPL 红线；WB 独立复核：LICENSE 实体 ＋ 字段 ＋ README **三处一致**） |
| `savageops/dsh-rich-indexing` | MIT | peer 空（经 profile 模块回退） | Qoder 🟢 | ⭐ **「覆盖 basic」的最完整实样**：阶梯 **30/50/70/90** 替代单 0.8 悬崖 ＋ 四档法律 ＋ 摘要模型链；**disable／uninstall 语义**（managed patch 行自动增删 ⇒ 压缩永不被 toggle 留在死态）可抄进我方 S2 开关设计 |
| `Zhuchen00123/dsh-compaction-cacheaware` | MIT | 预发布歧义（`^0.1.0-rc.6`） | Qoder 🟢 | `compact_ratio` 默认 **0.85**；近尾预算 `clamp(window×10%, 32K, 96K)`；**`tool result` 永不作为尾起点**／防孤儿 result；**「每事务单次摘要调用、不做应用层重试环」＝ 成本纪律实样** |
| `TsFreddie/dsh-compaction-instant` | MIT | 预发布歧义 | Qoder 🟢 | ⭐ **零模型调用路线的完整实现**（VCC「会话编译器」移植）：shadowed 区间编译为**仅原文 token 的引用式视图**，每次删改带 **`(seq N)` 指针**；配 `recall`／`search` 工具 ⇒ **「可回取」第二态的本地实现**；⛔ 无摘要 ⇒ 「摘要含 nonce」判据不适用 |
| `helibeiqi/dsh-compaction-pro` | MIT | `*` ⇒ 与"读不出"同档 | Qoder 🟢 | **只换 `summarize()`**：高保真模板（保数值／路径／命令／标识符）＋ **`language:'auto' 跟随会话语言`** ⇒ **中文会话摘要的第三个现成样本** |
| `JohnXu22786/context-pruner` | MIT | 预发布歧义（`>=0.0.1-rc.5`） | Trae 🟢 | 接 seam；**自带「未闭合压缩事务」检查**（`compaction/start` 无配对 `end`）⇒ 做"压缩中／失败态"观测可直接抄的形状 |
| `snow-The/dsh-session-handoff` | MIT | 读不出（未见 seam 声明） | Trae 🟢 ／ Claude 🟢 | ⭐ **归类异议已证实**：确有**独立 ACP 压缩子系统**（`lib/acp-config.js` 194 行 ／ `acp-recommend.js` 98 行 ＋ 3 个 `.mjs` 测试 ＋ `COMPAT-ACP.md`／`DESIGN-ACP-GRAPH.md`）⇒ **WB 原 C 档不成立，Claude 建议改 B**。用 `compactRegion` 做活动上下文压缩；自述**官方 `compactRegion` 只接受配对平衡范围**（与官方 `toolPairingBalanced*` 一致，**交叉验证成立**）；⚠️ Claude 指出它是 **handoff ＋ compaction 双功能件**，不宜只按 handoff 归档 |
| ⭐⭐ `Tyan66666/billion-context-dsh` | MIT（逐件读 LICENSE 首行） | ✅ **正锚**：`>=0.1.5-alpha.1 <0.1.6-0`（`default=true` **实跑**）＋ devDep pin `0.1.5-rc.2` ＋ ⭐ **自动化守卫** `tests/peer-range.test.ts` | **Claude 🟢**（补充调研实读） | **A 档 · 本批唯一「同代 ＋ 可读源码（6,263 行）＋ 有测试（30 spec）＋ 有文档（17 篇）」四全件**：`CompactionEngine` backend 实样（自做 Provider）；acp-kernel 自 `billion-context-pi` 逐字移植；**反向对照已过**（对 `0.1.6-alpha.1`／`0.1.6`／`0.2.0` = `false`）；⚠️ 依赖外部 `acp-kernel` 仓；⚠️ 当日分支名含 `2026-09-23_checkpoint-source-kind` ⇒ **活跃开发中，引用须带 sha**（实读 HEAD `171e5fb`） |
| `kolawong/fast-compaction-dsh` | MIT | 🔴 **读不出**（devDeps 全 `link:../deepseek-harness/…`） | **Claude 🟢** | **B 档**：⭐ **天然对照组** —— Verdict 式（keep／truncate／drop）、**明确「用判定替代有损 LLM 摘要」且保留内容逐字**；`pins` 机制（钉第一条 ＋ 最新尾部 ＋ system head 后第一条）；6 spec ＋ `scripts/e2e.ts` ＋ `scripts/inspect-compaction.mjs` 检视器。⛔⛔ **重大风险：把整段会话外呼第三方 API**（`src/jev.ts:13-14` `https://api.typesafe.ai/v1/systemone`；`:7` 明写 "the `state` sent with every request is the whole fitted conversation"）⇒ **路线可借鉴、引擎不可作参考实现**（对本项目 = 外部数据出站 ＋ 外部可用性依赖**双风险**） |
| `falling-ts/dsh-force-compact` | MIT | ⛔ **真脱节**：`>=0.1.7-alpha.1` | Trae 🟡 | "低上下文模型下强制压缩" ＋ 精修过的 compaction prompt；走 engine 的 idle manual 入口 `compactNow` |
| `zixin947/dsh-compact` | MIT | **预发布歧义**：`^0.1.0-rc.7`（`default=false` ／ `incl=true` **实跑**） | **Claude 🟢** | **C 档**：装配／策略层（依赖 `dsh-compaction-basic` ＋ `dsh-command-compact` 为 peer）＋ 带 Web 设置卡的整包。⚠️ **Claude 两度自我订正**：原判"明确脱节" →（补充调研）"明确脱节（0.1.0 线）" →（融合轮**实跑后**）判定为**「过度声明」**，形态与 `context-pruner`／`headroom` 同类 ⇒ **归「预发布歧义」** ⇒ ⭐ **"脱节"与"歧义"必须分开写**（前者影响选型、后者只影响安装姿势） |

**层② · tool-output 压缩 ／ 可逆取回**（只在「压什么」互补，**不解决**「摘要注入 ＋ 近文原文保留」）

| 候选 | LICENSE | 实读 | 可抄什么 ／ ⚠️ |
|---|---|---|---|
| `giter00/dsh-headroom` | Apache-2.0 | 三方 | ⭐ **「压了但可逐字节取回」**：挂 `tools/post-execute`（**结果物化前**替换）；CCR store 存原文 ＋ marker，模型调 `headroom_retrieve(id=…)` 取回；`verify-compress.mjs` 断言 **`NEEDLE-42` 在压视图不可见但可取回**；⚠️ `package.json` peerDeps **无任何 `@deepseek-ai/dsh-compaction*`** ⇒ 源码级确证**它不碰会话压缩**；⚠️ `headroomTokens` 默认 65536 属 **0.1.7 新增**（rc.2 无此字段，WB 已闭环） |
| `lifeodyssey/dsh-compressor` | MIT（插件）＋ Apache-2.0（crates） | Qoder 🟢 | ⭐ 形态是 **Rust workspace**；机制 = **「保前缀＝保 cache」**（明确写为设计目标：不重写已发送前缀）＋ 原文留盘 ＋ `compressor_retrieve`（`<<compressor:hash>>` locator）；同源对象 = `headroomlabs-ai/headroom`（与 `giter00` 件**同族**） |
| `GooDAnDReaDY/dsh-context-lens` | MIT | Qoder 🟢 | **边界划分的第三方视角**：自述「预算控制／计数／头尾截断**归 DSH 核心**（≥0.1.5）」，自身只做核心没有的**语义压缩**（AST 骨架 9＋ 语言 ／ 日志压缩 ／ 焦点路径保全文） |
| ⭐ `ICCuse/dsh-premise-guard` | 未核 | Trae 🟢 ／ 余 🟡 | ⭐⭐ **与我方 nonce 判据反向同题**：**压缩后前提漂移守卫** —— 摘要**丢掉关键 literal 锚**时注入一次性提示（"你可能丢了什么、怎么找回"） |

**层③ · 观测 ／ 验证（T5 落点）**

| 候选 | LICENSE | 实读 | 可抄什么 ／ ⚠️ |
|---|---|---|---|
| ⭐⭐ `bowenliang123/dsh-context` | Apache-2.0 | WB 🟢 ／ Qoder 🟡 | ⭐⭐ **`docs/compatibility.md` 是本轮最硬的单份材料**：① **DSH 会话日志分代 V0/V2/V3/V4**（**V3 = 我方锚版**；WB 已在锚版逐条核对 4 条字段）；② 版本闸门语义（channel order `release > rc > beta > alpha`，**取不到就 fail open**）；③ ⭐ **验证方法学**：**seam 矩阵**（按 tag 摆真源码 ＋ 装进该 tag 的真实投影注册表 ＋ **每条可选缝正反两侧都断言**）＋ 与官方自身 fold 的**差分校验** ＋ **一次性 profile 装／卸**（临时 `DSH_HOME`，真 `~/.dsh` 绝不碰） |
| ⚠️ `gendui123/dsh-compaction-probe` | MIT | Qoder 🟢 ／ Claude 🟠 | observe-only 监听器，把 `compaction/*` 落 JSONL；探 `rawOutput`／`shadowedProbe`／`summaryProvider` ⇒ **字段面可抄**。⚠️⚠️ **但它的判据在锚版恒红**：写 `session.events?.[seq]`，而锚版 `Session` **无**该成员 ⇒ `?.` 静默 ⇒ **每条都记 `readable:false`（不可分态，且反向误导）** ⇒ ⛔ **不得登记为「现成可用装置」**，要用须先改成 `eventAt(seq)` |
| `leesama/dsh-compact` | 未核 | ⛔ **未实读** | WB 轮 2 列入候选，但该次 `git clone` **SSL 握手失败**（且接了 `tail` 管道再 `&& echo OK` 的写法会 **假报 OK**）；Qoder 名录级提及"压缩遥测 ＋ shadow-cost" ⇒ **仍是线索** |

**C 档线索（只登记，不进结论）**：Trae 列 10 条（含 `Icstick/dsh-context-maid` ／ `GooDAnDReaDY/dsh-context-lens` ／ `dsh-plugins/dsh-auxiliary` ／ `zhubaohi/dsh-qwen38-compaction-fix` ／ `shyuan-hub/dsh-compact-button` ／ `orziz/odai` 明确锚 `0.1.1-rc.2` …）；Qoder 列 12 件 Memory 类 ＋ 一批 B-3 ／ B-5；WB 按**痛点簇**列 11 簇（**簇 D = reasoning 吃 `maxTokens` 致摘要截断，5 个互不相识的仓各自修** ⇒ 社区多次独立复现的真坑）。**完整清单见各方交流区，本稿不复述。**

**D 档（出局）**：`songoao25/dsh-auto-compact`（**仓库已不存在**）；`ljsysfurryACE` 的**代码**（GPL-3.0，思路可读）；Qoder 实测紧扫后仍混进的**同词异义 3 例**（`dsh-video-tools` 的 "compress images" = 媒体转码 ／ `dsh-ffmpeg` ／ `dsh-gzip` = HTTP gzip）⇒ **印证 G3 闸门（不许按关键词计数判相关）的必要性**。

### 11.3 分档统计

| 档 | 官方 ／ 上游 | 社区落位件 | 说明 |
|---|---|---|---|
| **A · 高价值** | **9**（含测试件 8） | **≈10** | 官方全部 A；社区 A 集中在层① ＋ 两个 T5 装置 |
| **B · 参考** | 2（`tool-meter` ／ `command-compact`） | ≈8 | 层② 全部归 B（生态位不同，不当 A 用） |
| **C · 存档线索** | — | 30＋ | 三方各列一批，**只登记不展开** |
| **D · 出局** | — | 5 | 失效仓 1 ／ GPL 代码 1 ／ 同词异义 3 |

⚠️ **合计规模**：社区方向**单 `dsh compaction` 一式在 GitHub 就有 211 个仓**（WB 轮 2 实测），远大于本地名录（`2026-09-07` 快照 ／ 3,386 行）反映的规模 ⇒ **本地名录已明显滞后**。

### 11.4 各方通道对照与独家增量

| 方 | 通道差异 | ⭐ 独家增量（**另一条通道拿不到**） |
|---|---|---|
| **WB** | 唯一做了 **GitHub REST 规模扫描** ＋ **npm 注册表直查** | ① 生态规模（211 仓）＋ **按痛点簇登记**；② **npm 版本梯** ＋ ⭐ **`latest` dist-tag 陷阱**（官方 compaction 包的 `latest` 指向 `0.0.1-rc.x`，`next` 才是 `0.1.5-rc.3` ⇒ **裸 `npm i` 会装错版**）；③ ⭐ **`dsh.plugin.json` 非官方契约** ＋ **官方契约 = `package.json#dsh.bundle.patch`**；④ 会话日志**分代表在锚版逐条核对**；⑤ 名录落点**条目级实测** ＋ 计数口径订正 |
| **Trae** | 社区**落位最广**（9 件实读）＋ 全程 PowerShell | ① **T3 的三条独立答案**（`argp` 保真校验 ／ `headroom` 外部 store ／ `dcp` 只覆写 summarize）；② 版本脱节**单列一节**（规格 §5-5 要求）；③ C 档线索 10 条；④ **前置修正 4 处**（名录计数 ／ 规格 §6③ 过期 ／ 代理今日可用 ／ spec 数） |
| **Claude** | **两阶段**：白天**联网不可用**（clone ＋ WebFetch 双失败）⇒ **被迫转向本地深挖**；**晚梯子开后**补做联网（5/5 clone 成功） | ① ⭐⭐ **官方测试件判据表**（本任务**最大独家增量**）：`invariant.spec.ts` 的 **18 条负向 ＋ 17 条正向**判据（**带错误信息正则，即"拒绝的理由"可机读**）／`toolPairingBalanced*` 的近文边界语义 ／ `compaction.spec.ts` 的契约形状。**官方自带 = 零兼容风险 ＋ 断言即判据**；② ⭐⭐ **方言断代从"第三方注释"升为「上游双 tag 类型 ＋ 运行期校验器」实测**（🟢🟢，不再依赖第三方注释）；③ ⭐⭐ **判据位置**：必须落在 `session.deriveMessages()`，**不是**引擎自己的 `eventsToCoreMessages(surfaceEventsOf(session))` 投影 —— 第三方 `byte-stability.test.ts` 头注**自曝其早期版本正犯此错**（见 11.5‑12）；④ ⭐⭐ **`isCompactCheckpointSource` 的精确缺陷**（不校验 `compactionId`，见 11.5‑2）；⑤ ⭐ `billion-context-dsh/docs/upstream-tracker.md`（**上游追踪机制**）；⑥ ⛔ `fast-compaction-dsh` 的**第三方 API 外呼风险** |
| **Qoder** | 唯一进 **目录站** ＋ 唯一产出 **T5 探针件** | ① **目录站实测 333 plugins、无 compaction 专类** ⇒ ⭐ **"只用目录站会系统性漏掉这一族"**；② **`gendui123/dsh-compaction-probe`**（T5 装置）＋ 实读后**抓出它恒红**；③ **三层分法**（compaction ／ tool-output ／ **观测验证**）⇒ 补上 WB 二分法漏掉的第三层；④ 融合轮**新落位 7 件**并实读 |

### 11.5 跨方一致结论

**（a）真正跨通道互证的实做（不同人各跑一遍，结果相同）**

| # | 事实 | 谁各跑了一遍 | 值 |
|---|---|---|---|
| 1 | **两处 DSH home 同源** | WB ／ Trae ／ Qoder（**三方各自算 sha256**） | 均 `9988b62641257a12…9100` ⇒ **同源** |
| 2 | **semver 对争议串的 `default`** | 四方**四跑** | 全 **`false`** ⇒ 一致（`includePrerelease` 记 **3:1**，见 11.6） |
| 3 | **锚版 `Session` 无 `events` 成员** | Qoder ／ Claude ／ WB（**各自读锚版源码 ＋ 全仓 grep**） | 全仓 `get events` **仅 1 处**，属 `SessionObservation`（另一类型、另一通道） |
| 4 | **`preserveRecent` 实位在 `index.js` 而非 `lib.js`** | WB ／ Claude ／ Qoder **三方独立复核** | **三方一致订正**了同一处行号错（原稿写 `lib.js:126`） |

**（b）判断汇合（依据同源，故**不构成互证**，但四方独立得出同一判断）**

| # | 结论 | 为什么可信 |
|---|---|---|
| 1 | **契约面不需要社区** | 官方契约 ＋ 生成式文档（**有 `verify-cordis-catalog` 防漂移**）＋ 测试件三者互锁；四方均独立指向同一结论 |
| 2 | **「摘要注入」有现成机读判据** | `isCompactCheckpointSource()`（上游 `checkpoint.ts`）＋ `aerince` **独立写出同一谓词**（`lib.js:73-77`）⇒ 判据是 `type==='user/message' ∧ source.kind==='plugin' ∧ source.plugin==='compact'`。**不必自造 nonce 探针**，但 ⇒ ⚠️ 它是**必要不充分**，且**两个维度都不够**：① **假阳性** —— 谓词**只看 `kind` ＋ `plugin`、不校验 `compactionId`**（`checkpoint.ts` 实读）⇒ **任何** `{kind:'plugin',plugin:'compact'}` 的 user 消息都为真；官方自己的完整判据 = **predicate 定位 ＋ invariant 校验 id**（`invariant.spec.ts` 负向用例：`/compaction checkpoint id .* does not match compaction\/start id/`）② **漏检** —— 它不覆盖"近文是否保留" |
| 3 | **T3 的权威答案在官方 basic** | 尾部按 token 预算 verbatim 保留（`retainRatio` 0.16）＋ 从尾反向累加 ＋ **不切 tool 对**。⇒ **来源偏好不能凌驾证据等级**（Trae A3） |
| 4 | **判据必须能区分「四问 ＋ 三结局」** | ① 是否触发 ② 摘要是否被截 ③ 是否完好。⚠️ **失败态在 surface 上与"没触发"同形**（官方政策：摘要失败**保留最新 durable surface**，不缩不丢）⇒ 只能靠**事件侧**分 |
| 5 | **「原文可取」有三态，判据须先定口径** | ① 留 surface（官方 `retainRatio` 路）／② 可回取（`headroom` ／ `instant` 路）／③ 仅在 append-only log（官方 pruner 路）。⇒ ⛔ **若判据只认 ①，会把 ②③ 误判为不合格；若把 ③ 也算"保留原文"，则该判据形同虚设** ⇒ **建议写死「近文」= ①** |
| 6 | **失败语义是 fail-closed** | 摘要被截 ⇒ **抛 `MAX_TOKENS`**（`summarizer.ts:191-207`），**不是静默注入半截**。⚠️ 但该检测**依赖 provider 如实上报 `max-tokens`** —— 不上报才是"静默半截"的可能路径（**未实测**） |
| 7 | **「保留了多少」有**三把尺** | `retainRatio`（**token 比例**）／`retainTokens`（**绝对 token 值**，与前者互斥）／`preserveRecent`（**surface 节点数**）。⇒ ⛔ 判据写"保留 N 条"**必须注明用哪把尺**；且**实测值 ≠ 配置的线性结果**（还要经 tool-pairing 向头部取整） |
| 8 | **四根杠杆** | `thresholdRatio`(0.8) ／ `retainRatio`(0.16) ／ `maxTokens`(8192) ／ **`summarizationProvider` ＋ `summarizationModel`（必须成对）** |
| 9 | **换摘要来源有三条路** | 路 A 子类覆写 `summarize()`（⚠️ 代价高于预期：私有常量未导出 ＋ 不收指令参数）；路 B **外部包装** `compaction.summarize = …`；路 C **`llm/stream` ＋ `purpose==='compaction'`**（两个独立实现都用它 ⇒ **社区公认接缝**）。⇒ 「覆写即换」的乐观表述**已收敛** |
| 10 | **参考件分三层，不是两层** | ① conversation compaction（**与 3.4 同题**）／② tool-output 压缩（只在"压什么"互补）／③ **观测验证**（T5 落点）。⇒ 只按二分法会漏掉 ③ 整类，而 T5 缺的**正是观测手段** |
| 11 | **两条代码级硬约束**（可写进我方实现） | ① replace `surfaceOp` **恰好三键**（多一即抛）；② 字段名 **V0/V2 `{start,end}` → V3 `{startSeq,endSeq}`**（写旧名运行期抛错） |
| 12 | ⭐ **判据必须落在 `session.deriveMessages()`** | 供方**能缓存的是 agent loop 放上网线的东西**，⛔ **不是**引擎自己的 `eventsToCoreMessages(surfaceEventsOf(session))` 投影 ⇒ **在"会话事件 ／ kernel 投影"上断言，证明不了发给模型的内容**（第三方 `byte-stability.test.ts` 头注**自曝其早期版本正犯此错**）。⚠️ **请求信封（tools ／ headers）与引擎真实 surface 写入需宿主 loop** ⇒ **单元层 ＋ 线级（e2e）两层分工**（与官方测试分层同构） |
| 13 | ⭐ **负向判据在「运行期校验器」层另有一组** | 与 `invariant.spec.ts`（**测试层**）**不同层次、两处都要**：`surface.ts` 运行期抛 —— `sourceEventSeqs must include every shadowed surface node` ／ `must not be empty` ／ `must not contain duplicates` ／ `must reference earlier events: N >= current seq M`（Claude **双 tag 实读**）；另 **`assistant/message` 的 `sourceEventSeqs` 类型级为 `never` 且运行期抛**（`surface.ts:275`） |

### 11.6 分歧点与待核项（红线③ —— 摆矛盾，不裁决）

| # | 分歧 | 各方立场 | 汇总口径（**倾向 ＋ 依据**） |
|---|---|---|---|
| 1 | 争议串（`>=0.0.1-rc.5 <0.1.0` **或** `>=0.1.0-rc.1 <0.2.0-0`）的 `includePrerelease` | **Trae 记 `false`**；**Claude ／ Qoder ／ WB 记 `true`（3 跑一致）** | 记 **3:1**，`default` 四方一致（`false`）。⭐ WB 另做**姿势分解（9 种）**：`includePrerelease` **只由 options 决定、不传即 false**，而 `satisfies()` **参数写反**会得到"看似合理的 false"且不抛错 ⇒ 提交 Trae **按实际姿势自查**。**不影响选型**（包管理器实际行为看 `default`） |
| 2 | `deriveEventMessage` 是否失效 | **Claude 称「双重失效」**；**Qoder ／ WB 裁定「单点失效」** | **Qoder ／ WB 对**：`Session` **确有**实例方法（`index.ts:854-855`）⇒ **"双重失效"收窄为单点（仅 `session.events`）** |
| 3 | 名录落点 | **Trae 原 C7**：「不在 `Sessions & Messages`／`Memory`，主要在 `Development & Runtime`」；**WB ／ Trae 融合轮实测相反** | **实测为准**：`Sessions & Messages`(26) ／ `Memory`(22) ／ UI Enhancements(22) ／ Usage & Billing(13) 是四大块；**`Development & Runtime` 仅 4**。⚠️ Trae 已在其融合轮**自发订正**；⚠️ **计数口径三方未统一 ⇒ 并列不合并**（条目总数 3222 vs 3199；紧口径 128 vs 132） |
| 4 | `fan56/dsh-dcp` 锚版本 | **Trae（09-23）**：正锚 `>=0.1.5-rc.2`；**WB（09-28）**：已抬到 `>=0.1.7-rc.1` | ⭐ **两边各自在其时点都正确**，冲突只来自 **5 天时间差** ⇒ **取当下状态记**（当前高于我方）。**这是老大「取当下状态」口径的活样本** |
| 5 | `ljsysfurryACE` 仓根有无 LICENSE | **Trae 记「无」**；**WB 实测「有」** | **时点差**：09-24 该仓提交「添加 GPL-3.0 许可证」⇒ **GPL 红线结论不变、依据升级为「实体 ＋ 字段 ＋ README」三处** |
| 6 | `aerince` 的注册表矩阵可信度 | 矩阵标 `0.1.5-rc.2 ✓ **L5 runtime verified**` vs **三方源码级发现其 `session.events` 路径在锚版失效** | ⚠️ **待核**：建议**把该矩阵的"验证范围"列为待核项** —— 它可能验的是"能装上／能加载"，**不是全部代码路径** |
| 7 | `giter00/dsh-headroom` 锚版本 | WB 记注册表最新行 = `0.1.2-rc.1`；Trae 记声明区间**不接纳**；Qoder 记区间**含锚版** | **一律标"声明级"**，而以**实跑**为准（本任务**禁装**，故止于待核）。且 WB 另有更硬的判断：其 `engines.dsh` 写在 `dsh.plugin.json` 里 ⇒ **该字段无上游校验** |
| 8 | ⭐ **`deriveEventMessage` 是否失效**（**第五处分歧**，2026-09-28 复核补） | **Claude 融合轮 §②‑5**：称它是**模块级导出**（`index.ts:29`）、"**不是 session 方法**"，故探针调用被 `?.` 静默跳过；**WB 实测**：**两者都存在** —— `:29` re-export **＋** `Session` 类**有实例方法**（`index.ts:854-855`：`deriveEventMessage(event){ return deriveEventMessage(event) }`，注释 `:849` 明写 "Instance face of the pure per-node export"） | **WB 对** ⇒ 探针写 `session.deriveEventMessage?.(raw)` **不会被 `?.` 跳过** ⇒ **该探针失效是单点（仅 `session.events`），不是"双重"**。⚠️ Claude 自标"🟠 高度可疑（源码级推断）**未穷尽全仓 grep**"⇒ **它留了余地，但"双重失效"论断应订正为单点** |
| 9 | ⭐ **clone 失败归因**（Claude 补充调研**订正 1**） | 原报告：清代理后仍失败 ⇒ 判"**链路级不可达**、规格 §8 不适用"；**实况**：梯子开后 `git ls-remote` **立即成功** | **真因 = 梯子未开**（代理后面没有出口）⇒ **"代理是根因 ／ 绕法是清代理"只在「梯子关着」时成立**；**梯子开着时正相反：必须留着 `socks5://127.0.0.1:7890`（清代理才是反向操作）** 。⇒ ⭐ **正确表述 = "克隆失败先看梯子状态，再看代理配置"**（两种条件对应**两种相反操作**，⛔ 不可写成单条规则）⇒ **规格 §8 只适用于梯子关闭态** |

### 11.7 版本观察（原「版本脱节判断」，**按老大口径降为观察、不做深度追踪**）

**四类（措辞纪律：所有"通过"一律标「声明级」）**：

| 类 | 判据 | 件 |
|---|---|---|
| **真通过**（`default` 即 true） | 包管理器实际行为即接纳 | `knighthongyu/dsh-handoff-compaction`（`^0.1.5-rc.2`）、`Tyan66666/billion-context-dsh`（`>=0.1.5-alpha.1 <0.1.6-0`，**＋ 反向对照已过**：对 `0.1.6-alpha.1`／`0.1.6`／`0.2.0` = `false`，与其自带 `peer-range.test.ts` 守卫断言**逐条一致**） |
| **预发布歧义**（`default=false` ／ `incl=true`） | 范围**看起来**覆盖我方，但 semver 预发布规则默认不认 | `context-pruner` ／ `headroom` ／ `cacheaware` ／ `instant` ／ `context-lens` ／ `zixin947/dsh-compact` |
| **真脱节**（两栏皆 ✗） | 要求**高于**我方 | `yoza10635/dsh-argp`（`^0.1.7-alpha.2`）、`falling-ts/dsh-force-compact`（`>=0.1.7-alpha.1`） |
| **不可判**（无 peer ／ `"*"` ／ 读不出） | 声明层无从判断 | `aerince`（**未声明任何 deps**）／ `snow-The/session-handoff`（未见 seam 声明）／ `helibeiqi/pro`（`*`，**与"读不出"同档**）／ `probe`（仅 `cordis` ＋ `schemastery`）／ `fast-compaction-dsh`（devDeps 全 `link:../deepseek-harness/…`） |

**格局（观察，不作选型指令）**：社区**已分叉为两条线** —— **RC ／ stable 线（`0.1.5-rc.2`）** 与 **`0.1.7-alpha` 线**；`fan56/dsh-dcp` 更在 5 天内从前者**跳到**后者。⇒ **"社区红利"不是单一方向**，按老大口径**持续观察即可**；⚠️ 但**兼容性一律以"装上后实测"为准**（声明只能当线索 —— `dsh.plugin.json` 那条已证明声明可无上游校验）。

**三条 2026-09-28 补入的观察**（Qoder 补遗 ＋ Claude 补充调研，均**注册表级**）：
- ⚠️ **上游侧的持续成本（不是社区问题，是锚版位置问题）**：上游**自己**已在 `0.1.6`／`0.1.7` 线新增 compaction 家族件（`@deepseek-ai/dsh-compaction-image-offload`，peer `^0.1.6-alpha.1`）⇒ **我方锚版拿不到** ⇒ 归入「跟随 rc 的持续成本」。
- ⚠️ **锚版落后速率实测**：`0.1.5-rc.2`（09-15 拍定）→ **09-22 一天之内**从 `0.1.5-rc.3` 推到 `0.1.7-alpha.2`（4 个版本）⇒ 落后是**日级**而非月级。
- ⚠️ **npm 存在「同名搬运件」，会污染版本判断**：`@monotykamary/` ／ `@x1a0f3n9/` ／ `@stackstackstack/` ／ `@dangzhuotong/` ／ `@alatastudio/` ／ `@prettier-ai/` ／ `@xneog/` **各自重发** `dsh-compaction`（描述**逐字相同**、版本号**各不相同**：0.1.9／0.1.5-rc.5／0.1.7／0.1.0-rc.7／0.1.1-rc.4／0.1.2-alpha.1／0.1.0）⇒ ⛔ **登记与检索必须写全 `@scope`**；⭐ **两方独立发现同一件事**（WB 轮 2 ＋ Qoder 补遗）⇒ 这条算**跨通道互证**。

### 11.8 建议深读清单（Top 14）

**第一梯队 · 判据直接可用（官方，零兼容风险）**
1. ⭐⭐ `packages/compaction/compaction/tests/invariant.spec.ts`（469 行）—— **18 条负向判据全带错误信息正则**，可**直接照抄成我方验收测试**
2. ⭐⭐ `packages/compaction/compaction/tests/tool-pairing.spec.ts`（417 行）—— **「近文保留边界是否合法」的现成机读判据**（`toolPairingBalancedBefore/After`）
3. ⭐ `packages/compaction/compaction/tests/compaction.spec.ts`（171 行）—— 契约形状正本 ＋ `isCompactCheckpointSource()` 用法
4. ⭐ `packages/compaction/compaction-basic/tests/compaction-basic.spec.ts`（2,138 行）—— **切点算法的判据**（向头部取整保 tool 对 ／ 计费口径 ／ 重试上限）
5. `packages/compaction/compaction-basic/tests/manual-compaction.spec.ts`（889 行）—— **并发 ／ 排队 ／ 失败分类／取消语义正本**（⚠️ 官方在这里有答案，不必自定）
6. `docs/subsystems/compaction.md`（238 行）＋ `packages/core/session/src/{types.ts,surface.ts}` —— 签名 ／ payload ／ **replace 硬约束**

**第二梯队 · T3 策略多样性（社区，⛔ 只读不装）**
7. ⭐ `knighthongyu/dsh-handoff-compaction` —— **换 Provider 的端到端实样** ＋ `retainTokens` vs `retainRatio` 取舍实证
8. ⭐ `yoza10635/dsh-argp` 的 `infoSpans ＋ fidelityGuard` —— **保真校验**（⛔ 版本不符，只读思路）
9. ⭐ `giter00/dsh-headroom` —— **「可回取」路线**，用于**校准我方判据口径**（防误杀第二态）
10. ⭐ `ICCuse/dsh-premise-guard` —— **nonce 判据的反向同题**（丢锚检测）
11. `QuanhuZeYu/dsh-compaction-zh` ＋ `helibeiqi/dsh-compaction-pro` —— **中文会话摘要**的两个现成样本（官方指令硬编码英文）
12. ⭐ `Tyan66666/billion-context-dsh`（**A 档 · 唯一「同代 ＋ 源码 ＋ 测试 ＋ 文档」四全件**）—— 其 `tests/peer-range.test.ts` 的**版本守卫断言**（"接受整条 0.1.5 线 ／ 拒绝 `0.1.6+` 与 `0.2.x`"）**可直接照抄成我方兼容性测试**；`tests/byte-stability.test.ts` 的**判据位置纪律**（见 11.5‑12）

**第三梯队 · 观测 ／ 验证**
13. ⭐⭐ `bowenliang123/dsh-context` 的 `docs/compatibility.md` —— **日志分代尺（V0–V4）＋ 验证方法学**（seam 矩阵 ／ 与官方 fold 差分 ／ 一次性 profile 装卸）；⚠️ `gendui123/dsh-compaction-probe` **路线可借鉴、装置须先修**（`session.events` **单点**恒红，**字段面可直接抄**）
14. ⭐⭐ `billion-context-dsh/docs/upstream-tracker.md` —— **本批最可移植的方法论**：把"依赖上游会漂移"**机械化**（上游缺陷走 **issue ＋ PR → 升 pin → 解除本地 workaround**；**任何 workaround 必须登记**；代码里 `UPSTREAM:` 注释作**机读标记**（"它还在，就说明这道门没关"）；状态机 `waiting-upstream`／`merged-released`／`resolved`（**已解决也不删，留档作证据链**）＋ 用**测试断言翻转**作解除动作）⇒ ⭐ 建议我方 3.4 ／ 3.7 参照建立同类机制

### 11.9 未决项与诚实边界

**⭐ 已决（2026-09-29）**
- **① 判据口径四条已写死** ⇒ 权威落点 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.4 · S2 判据口径四条〉；执行面 = `TODO.md`「DSH-3.4」段判据行。（原未决项第 1 条，现移出。）
- **② 手动 `/compact` 产品决策 = A「不做该入口」**（老大 2026-09-29 裁）⇒ 压缩只走自动路径，判据注明「手动路径不适用」；⚠️ **A ≠ 什么都不做**（官方默认组合自带 ⇒ 须显式禁用），**验收 ＝ 真实会话发 `/compact` 无 `compaction/start` 事件**；连带 **L1 档失去构造手段**（观测点搬 L2）、**新增 L0‑A 档**验「入口不存在性」⇒ 详见同节 ⑤ ／ ③。（原未决项第 2 条，现移出。）

**未决（需老大 ／ 3.4 开工时定）**
1. **`aerince` 的注册表矩阵"L5 runtime verified"覆盖什么**（11.6-6）—— 待核，可能只验了装／载。
2. **`headroom` 类件引入新模型工具**（`headroom_retrieve` 等）= **产品决策**，不是实现细节（官方取向是"人工命令、无模型工具"）。
3. ⭐ **是否建立「上游追踪机制」**（参照 `billion-context-dsh/docs/upstream-tracker.md`，见 11.8‑14）—— 我方同样**锚在别人的版本上**（`dsh-dcp` 5 天内抬 peer 就是实例）⇒ 由老大 ／ WB 定落点。
4. ⛔ **若考虑 `fast-compaction-dsh` 的 verbatim 路线，须先评估其第三方 API 外呼的数据边界**（11.2 层①）—— 本项目属**个人项目 ＋ 成本敏感 ＋ 数据安全边界** ⇒ **路线可借鉴、引擎不可参考**。

**诚实边界（本汇总**继承**各方的边界，不新增**）**
- ⛔ **四方全部止于「声明级 ／ 源码级」—— 无一件实装、实跑、实测**（§3.0 纪律：只参考不直装）。**所有"能不能用"都未到运行时。**
- `session.events` ／ `probe` 的失效判定均为**源码级 🟠**，非实跑结论（且存在"运行时被投射为观察对象"的反向边界）。
- 三方**名录计数口径未统一** ⇒ 本稿**并列不合并**。
- **§12 污染**（11.1）⇒ 与 WB 轮 1 重合项只记 1 条通道。
- 本汇总**未新增任何实做**；所有事实均取自四方报告，且**每条已在报告内注明通道与时间**。
- ⚠️ **本节自身的两处漏读已如实披露**：首版（`d1af516`）**跳读**了 Claude 的「补充调研」段（167–295）与 Qoder 的「补遗」段（217–283）⇒ 2026-09-28 **通读全文后补入**。⇒ ⭐ **教训：汇总必须连续通读全文，不得跳读分段** —— 跳读会把"**没读到**"伪装成"**没有**"。
