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
