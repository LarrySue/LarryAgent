# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---


## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.5 · `(b)`** | Qoder | CVM（Linux ／ `49.232.129.252`） | ✅ **已回报 ＋ 已复核（WB 2026-09-22，CVM 现场独立取证）**；⭐ **§2-P2 两条待裁同日由老大裁 (A) 并执行完毕**（① `profiles/acp` 一并删 → `acp.bak.20260922-1007`；② `explicit` 分支退役改脚本 `ba3e42e`，双侧 sha256 一致 ／ 纯 LF）⇒ 判定全文 = `TODO.md`「DSH-3.7.5」段末 | 2026-09-22 |
| **DSH-3.4-R** | Qoder | 本机（联网检索 · 只读参考） | 📬 **已派发 · 待执行（2026-09-23）** | 2026-09-23 |

- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3.7.5」段**（**一处两面**）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯用 `git log -p -- exchange/log-qoder.md`。
- ⭐ **派发前重测前提（WB 2026-09-22 · ssh(Bash) 通道实测）** ⇒ **3 条新事实 ／ 缺口**⇒ 摘要 ／ 权威落点 = `TODO.md`「DSH-3.7.5」段「⭐ 派发前重测前提」条。
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.3 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  3. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  4. **收尾必核现场**（复核 ／ 取证动作自身也会改现场）。
  5. **工具输出的"原文"不得手工改写 ／ 意译**；但**工具链自身的语言 ／ 编码差异须原样保留**，并**注明该段取自哪条通道**。

---

## 📤 DSH-3.4-R · 参考件广撒网调研（派发于 2026-09-23）

**规格（筛选规则 ／ 报告格式 ／ 反纪律 ／ 必扫区）→ `docs/dsh/dsh-34-ref-research.md`** —— 逐条照它执行，不要即兴发挥。

**任务**：为 `DSH-3.4`（S2 compaction 接入）做参考件调研 —— **独立**检索、梳理、筛选，出具**评论报告**。要回答六问 T1–T6（见规格 §0）。

**边界（违反即报告不可采信）**
- ⛔ **提交前不得翻阅其他 AI 的交流区**（含 `log-workbuddy.md`）—— 本任务的价值在「同规则、异通道、互不影响」。
- ⛔ 只作参考源：报告**不得出现「装上就能用 ／ 可作产品依赖」**式结论（§3.0）。
- ⛔ **不把候选件装进任何环境** —— 连 `dsh plugin add` 试装也不在本次范围内。
- ⛔ **不编**：找不到就写「无」。
- ⚠️ 星标 ／ 热度不构成理由；README 宣称 ≠ 实现。

**动手前先做的前提实测**（别照抄登记表旧结论）
- 规格 §6 必扫区的路径**至少实测一条**可达（例：`git -C ref/dsh-bare show dsh-v0.1.5-rc.2:packages/compaction/README.md`）；不可达 ⇒ 报出，不静默跳过。
- 本机代理坑见规格 §8（`git clone` 报 443 失败 **≠ 被墙**）。

**报告落点**：本文件新增一段 `## DSH-3.4-R 调研报告`。
**回报格式**（三段固定，顺序不可换）：① **检索账**（通道 ／ 检索式 ／ 时间 ／ 扫描量 —— 须可复算）② **候选表**（按规格 §3 字段）③ **评论**（观察与评论**分开写**，并给**版本脱节判断**）。

**判据权威落点**：`docs/dsh/dsh-34-ref-research.md`（规格）＋ `TODO.md`「DSH-3.4」段（切片判据）。回收后由 WB 汇总并回填 `docs/dsh/dsh-migration.md` §3.6 登记表 3.4 行。

- **建议侧重（非强制、不构成分工）**：你是文档一致性维护者 ⇒ 可优先把**名录 ／ 目录站的检索广度**与**版本脱节判断**做扎实；其余按规格走。不要求你猜别人扫了什么。

## ⏳ 未结项（待老大裁）

1. **`docs/` 5 处「2026-09-22 变更承接滞后」**（2026-09-22 主职责巡检 §1；WB 复验时逐处读取确认**仍未修**）：
   - `docs/dsh/dsh-migration.md:740` —— 「`cvm-probes/*.sh` 全部钉 `larry-dsh-home` ⇒ 照抄 = 无 key 假绿」用**现在时**陈述；而该形态自 09-14 已改、`explicit` 分支 09-22 已退役 ⇒ **该陷阱已不存在** ⇒ 建议加批注。
   - `docs/production-env.md:512` ／ `:516` ／ `:529` ／ `:531` —— 只反映 09-14 那次改动 ／ 表行所载 profile **已于 09-22 删除**（`:531` 的「凭据与可运行 profile 被劈开」**事实基础已消失**）。
   - ⛔ 建议**只加批注 ＋ 加退役指向**，不改叙述本身（`docs/` 属 AI 不动区 ⇒ 待老大裁 ／ 或授权后在授权范围内执行）。
2. **上游路径与本仓库路径同名、写法无区分**（同次巡检 §2，40+ 处）：`docs/dsh/` 下多稿直接写上游仓库路径（如 `docs/subsystems/approval.md`），与本仓 `docs/` 同名 ⇒ 读者会当本仓文件去找。建议给上游引用加**显式前缀**（如 `ref/dsh-bare:docs/…`）。**未裁。**
3. **稳定落点口径小差**（巡检 §4）：`docs/README.md:20` 定三处（`docs/` ／ `archive/` ／ `TODO.md`）；`exchange/README.md:31` 写「以 `docs/` 和 `archive/` 为主」**未含 `TODO.md`** ⇒ 建议统一。**未裁。**
4. **反引号路径「仓库根相对」惯例无文档记载**（巡检 §6）：是全项目惯例却没写进任何文档 ⇒ 建议在 `docs/README.md` 加一句。**未裁。**
5. **`TODO.md` 精简「第二刀 ／ 第三刀」**（同次专题 §2）：第二刀 = 压 `### 待派发` 段；第三刀 = `#### DSH-3 · 贯穿规则` 迁 `docs/`。⇒ **老大 2026-09-22 裁：先搁置，等 DSH-3 完成后再议。**

---

## 🗂 已清理段落（按交流区规矩）

- **2026-09-22 清理**：删除 5 段（`DSH-3.7.5 派发稿` ＋ 其《附 · WB 重测前提实录》附录 ／ `DSH-3.7.5 回报` ／ `主职责巡检报告` ／ `TODO 精简专题报告`）—— 判据 ／ 边界 ／ 遗留 = `TODO.md`「DSH-3.7.5」段；两份报告的**未裁建议**已提炼到上方「未结项」。回溯：`git log -p -- exchange/log-qoder.md`。

---
---

## DSH-3.4-R 调研报告

**状态**：已回报（2026-09-23）｜ **执行**：Qoder（文档一致性维护者）｜ **规格**：`docs/dsh/dsh-34-ref-research.md`（逐条照执行）

### ⚠️ 先声明三条「流程调整」（老大已授权我可调整并须写明理由与改法）

**调整 A · 必须披露的事实（不是流程改动，但不写就是误导）**
规格 §12 内嵌了 **WB 自己的那份报告**，而派发稿要求我"逐条照规格执行" ⇒ **读规格必然看到 WB 的结论**。⇒ 本报告**不能**充当"同规则、异通道、互不影响"的第二次独立验证：**凡与 §12 重合的结论，只应记为 1 条通道，不是 2 条。**
**改法**：把重心移向 §12 自己声明"未做"的方向（拉源码读实现 ／ 目录站 ／ GitHub 侧），并在候选表里**逐条标注与 §12 的关系**。

**调整 B · 反转规格 §8 的代理做法（理由：前提已失效）**
§8 说"本机 git 全局配了**不在运行**的代理 ⇒ 要 `-c http.proxy= -c https.proxy=` 清掉"。**实测相反**：
```
$ git config --global --get https.proxy                            → socks5://127.0.0.1:7890
$ curl -sS -o /dev/null -w '%{http_code}' https://github.com        → http_code=000（直连不通）
$ git -c http.proxy= -c https.proxy= clone … /d/Temp/_p2            → EXIT=128 "Failed to connect to github.com port 443"
$ git clone --depth 1 … /d/Temp/_p1                                 → EXIT=0 ✅（用全局代理）
```
⇒ **代理在运行且是必需的**；清掉就出不去。**改法**：**保留全局代理、不加任何清除参数**。

**调整 C · 弃用我自己的包装（理由：它会静默吞输出）**
`timeout N env -u <VAR> <cmd>` 在本通道下**吞掉子命令全部输出**：
```
$ timeout 20 env -u https_proxy git --version   → （无输出）EXIT=0
$ timeout 20 git --version                      → git version 2.52.0.windows.1  EXIT=0
```
⇒ 我早期一次"clone 无输出 EXIT=0"的假象即由此造成（**不是网络问题、也不是 clone 行为**）。**改法**：用裸命令 ＋ `echo EXIT=$?`，**不接管道**（避免取到 `tail` 的退出码）。

### ① 检索账（可复算）

| # | 通道 | 动作 ／ 检索式 | 时间 | 扫描量 ／ 结果 |
|---|---|---|---|---|
| 1 | 本地 · 裸仓库 | §6② 三条路径可达性实测（`show` / `ls-tree`） | 09-23 | **3/3 可达** ✅ |
| 2 | 本地 · 官方包 | `ls -d *compaction*`（`~/.dsh/profiles/sdk/node_modules/@deepseek-ai/`） | 09-23 | 3 件在（basic ／ pruner ／ command-compact）；契约 `dsh-compaction` **不在**扁平层 |
| 3 | 本地 · 上游主仓 | `git show <tag>:packages/compaction/README.md` ＋ `packages/compaction/compaction/README.md` ＋ `ls-tree -r packages/compaction/compaction/` | 09-23 | 家族 README ＋ 契约 README 头部 ＋ 包树（含 **`src/checkpoint.ts`**、3 个 spec） |
| 4 | 本地 · 名录 | `ref/awesome-dsh-plugin.md`（3,386 行）；**只扫规格 §6④ 指定的 5 类**：Sessions&Messages(201) ／ Memory(149) ／ Usage&Billing(178) ／ Tools&Capabilities(425) ／ Dev&Runtime(254) = **1,207 条** | 09-23 | **宽扫 94 ／ 紧扫 54**（紧扫＝强相关词 ∧ 非 UI 噪音），**逐条读描述** |
| 5 | **联网 · 拉源码读实现**（§12 未做） | `git clone --depth 1`（带全局代理）两件已登记件 → `ref/community/` | 09-23 | **2 件落位**：`aerince__dsh-active-context-pruning`(8 文件) ／ `giter00__dsh-headroom`(25 文件)；实读 `index.js`(347) ＋ `lib.js`(119) ＋ headroom 的 manifest/hook 面 ＋ `tests/` |
| 6 | **联网 · 目录站**（§12 未做） | `deepseek-harness-plugin.com` | 09-23 | 可达；**333 plugins listed**；有 Memory ／ Sessions&Messages 分类；**无 compaction 专类**；**未见 summarization 插件**；见 `dsh-context`（观测面板） |
| 7 | **联网 · GitHub 方向搜索**（§12 未做） | WebSearch：「github dsh-plugin compaction context pruning DeepSeek Harness plugin」 | 09-23 | 6 命中：**新件 `bowenliang123/dsh-context`（发布 14 小时前）** ／ 两个 GitHub topic 入口（`deepseek-harness-plugin` ／ `dsh-plugins`）／ **第二个 awesome 列表 `0xsline/awesome-deepseek-harness`** ／ 中文第三方导航站 `ai.codefather.cn/dsh-plugin/` |

**未做**：npm 站内搜索（规格 §7 列了，本轮未做）｜ 未拉取新发现候选的源码 ｜ GitHub 侧只做了 **1 次**方向搜索（属抽样非穷尽）。
**通道说明**：本地走 **Bash 通道**；联网走**内置搜索 / 抓取工具** ＋ **git over 全局代理**。按项目铁律，**通道不同则结论不可互推**。

### ② 候选表

#### A 组 · 官方 ／ 上游（🟢 我方实读）

| 候选 | 类型 | 入口 | 锚版本 | 命中 | 档 | 借鉴点（具体到可抄什么） | ⛔ 不可参考 | 它怎么验的 | 证据 |
|---|---|---|---|---|---|---|---|---|---|
| `@deepseek-ai/dsh-compaction`（契约） | 官方 | `ref/dsh-bare:packages/compaction/compaction/` | 锚版本身 | T1 T5 | **A** | 包树实证 **`src/checkpoint.ts` 是独立源文件**（⇒ 「checkpoint marker 从 cordis-free 子路径导出」在**文件布局层**成立）；仓内自带 **3 个 spec**（`compaction.spec.ts` ／ `invariant.spec.ts` ／ `tool-pairing.spec.ts`） | 无 | 官方 spec ×3 | 🟢 |
| `compaction/` 家族 README | 官方 | `ref/dsh-bare:packages/compaction/README.md` | 锚版本身 | T1 T2 | B | 家族三分口径原文：**automatic ／ on-demand `/compact` ／ oversized tool outputs trimmed first**（"so there is less to condense"）⇒ **pruner 的位次 = 摘要之前**；且明写 token 计量**在另一个 LLM 家族服务里** | — | — | 🟢 |
| 官方 3 件（basic ／ pruner ／ command-compact） | 官方 | `~/.dsh/profiles/sdk/node_modules/@deepseek-ai/` | 锚版本身 | T2 T4 | **A** | 本机 profile 扁平层**实测在位**（§6① 复核成立） | — | — | 🟢 |

> ⚠️ A 组我只补了 **§12 未覆盖或浅覆盖的三处**（包树文件布局 ／ 家族 README 的三分位次原文 ／ 扁平层实测）；**不重复 §12 已给的契约与 basic 深读**（同通道，重复无增益）。

#### B 组 · 社区 —— **本轮实读源码的两件**

**B-1 `aerince/dsh-active-context-pruning`**（v0.1.0 ／ **MIT** ／ 本地 `ref/community/aerince__dsh-active-context-pruning`）

| 字段 | 内容 |
|---|---|
| 锚版本 | **读不出**：`package.json` **无 peerDependencies**（全文实读）⇒ 按 G4 **标 🔴、不进结论** |
| 命中 | T1 T2 T3 T5 T6 |
| **借鉴点 1：`summarize` 可实例级覆写，且可完全不调 LLM** | `index.js:160-179`：保存 `compaction.summarize` → 覆写 → `ctx.effect` 返回恢复函数；命中 pending 时返回 **`{summary:[{type:'text',text}], provider:'acp', model:'model-authored'}`** ⇒ ⭐ **这就是「换摘要来源」的现成正本**（T2 的答案不必只靠推断） |
| **借鉴点 2：范围安全约束的写法** | `assertSafeRange()`（`:119-130`）：起终点必须**在 surface 上**、且**不得包含最后 `preserveRecent`（默认 2）个 node** ⇒ 「近文保留」的**参数化实现** |
| **借鉴点 3：checkpoint 的可判据识别** | `lib.js:73-77`：`isCheckpointEvent = type==='user/message' && data.source.kind==='plugin' && data.source.plugin==='compact'` ⇒ **T5「摘要注入」的现成机读判定** |
| 计量与窗口来源 | `ctx.get('tokenMeter').measure(session).{nodes,totalTokens}`；窗口 = `ctx.get('llm').resolveModelInfo(provider,model).context.contextWindow`（`:84-96`）⇒ **T4 不必硬编码** |
| 阈值 | `minContextLimit '60%'` ／ `maxContextLimit '70%'`（**与官方 0.8 不同**） |
| 注册面 | 4 工具（`acp_status` / `acp_compress` / `acp_decompress` / `acp_search`）＋ 1 命令 ＋ systemPrompt **section ＋ 动态 context**（按用量给 SOFT/HARD 横幅） |
| ⛔ 不可参考 | ① **工具驱动**（模型主动压）与 S2「自动/显式触发」**不同构**；② 依赖官方 basic 提供 `compactRegion`；③ **`acp_` 非 Agent Client Protocol**（它自己在 prompt 里写了 "This is not Agent Client Protocol."） |
| 它怎么验的 | **无测试**；仅 `check.js`（65 行）非函数式自检 |
| 证据 | 🟢（`index.js` 347 ＋ `lib.js` 119 **全文实读**） |

**B-2 `giter00/dsh-headroom`**（v0.3.0 ／ **Apache-2.0** ／ 本地 `ref/community/giter00__dsh-headroom`）

| 字段 | 内容 |
|---|---|
| 锚版本（⭐ 本轮实质升级） | `peerDependencies` 实读为**区间**：`@deepseek-ai/dsh-agent` / `dsh-llm` / `dsh-session` / `dsh-tools` = **`>=0.0.1-rc.5 <0.1.0` 或 `>=0.1.0-rc.1 <0.2.0-0`** ⇒ **我方 `0.1.5-rc.2` 落在区间内**。⚠️ 但**声明 ≠ 实测** ⇒ 标 **🟡（声明级）**，不升 🟢 |
| 命中 | T3 T5 T6 |
| **借鉴点 1：hook 位点** | `lib/index.js:478` `ctx.on('tools/post-execute', …)` ⇒ **tool 结果物化前**的替换位（与官方 pruner 同生态位） |
| **借鉴点 2：可逆取回 = 多一个工具面** | 注册 3 工具：`retrieveTool(ccrStore)` / `compressTool(config)` / `statsTool(ccrStore)` ⇒ **引入 `headroom_retrieve` 让模型自己取回原文** |
| 实现规模与测试 | `lib/` **2,067 行**（ccr 216 ／ compress 769 ／ index 498 ／ kompress 406 ／ kompress-onnx 178）；**`tests/` 2 个（351 ＋ 142 行）＋ 5 个 verify/probe 脚本 ＋ GitHub CI** ⇒ **有真测试** |
| ⛔ 不可参考 | ① 它是 **tool-output 压缩**，**不解决**「摘要注入 ＋ 近文原文保留」；② 新增模型工具面，**与官方"人工命令、无模型工具"取向相反** ⇒ 若借鉴，**是产品决策不是实现细节** |
| 它怎么验的 | `scripts/verify-compress.mjs`(221) ／ `verify-apply.mjs`(98) ＋ `tests/`；README 自述断言**字节不变**与 **NEEDLE-42 可取回** |
| 证据 | 🟢（**manifest ＋ hook 注册面 ＋ 文件树实读**）／🟡（**2,067 行实现未逐行读** ⇒ 可逆取回机理只到**位点级**，不到实现级） |

**B-3 名录级候选（🟡）—— ⭐ 下列 5 件不在 §12 的清单里（我这轮扫出）**

| 候选 | 命中 | 档 | 借鉴点 | 为何值得单独看 |
|---|---|---|---|---|
| `savageops/dsh-rich-indexing` | T4 | **A?** | **用「可配置阶梯（默认 30/50/70/90）」替代单一的 80% 悬崖**，各档从温和到激进 | ⭐ **直接批评官方 0.8 单阈值**；T4 的**策略面**参照 |
| `fan56/dsh-dcp` | T3 T6 | **A?** | **零 LLM 调用**的规则化剪枝，**逐字保留** paths / commands / error traces / open todos | ⭐ 与"LLM 摘要"**相反路线**的现成件 |
| `GooDAnDReaDY/dsh-context-lens` | T3 T6 | B | AST 级压缩 ＋ 日志行过滤 ＋ **token 预算守卫** | 三个动作合在一条管线上 |
| `lifeodyssey/dsh-compressor` | T6 | B | 自述"**a slim port of Headroom**"；声称**不影响 model context cache** | ⚠️ ① 与 B-2 **同源**（派生关系）；② "不影响缓存"与项目关心的缓存成本直接相关 |
| `bowenliang123/dsh-context` | T1 T5 | B | **上下文构成观测面板**："see what the model's context window is made of and how it evolves" | ⭐ **发布仅 14 小时** ⇒ 极新件，锚版本必然读不出 ⇒ 按 G4 标 🔴 |

**B-4 名录级 · C 档（只登记一行，不展开）**：`dsh-plugins/dsh-auxiliary`（含 compaction 的专用模型路由）／`luxiwusuobuneng/dsh-plugin-context-manager`／`zhaoyuntao-wl/dsh-plugin-thread`／`pgmi-builds/better-dsh#dashr`／`rand0wn/dsh-minimal-anchor`（**tool schema 白名单裁剪 ＋ 首轮 preamble** ⇒ 另一压缩层）／`JohnXu22786/context-pruner`／`yoza10635/dsh-argp`／`songoao25/dsh-auto-compact`／`falling-ts/dsh-force-compact`／`ICCuse/dsh-premise-guard`／`ICCuse/dsh-file-memory`／`Icstick/dsh-context-maid`／`ishuowang/dsh-sideband`／`LFM097384/Context-Prism`／`Tyan66666/billion-context-dsh`／`ljsysfurryACE/dsh-compaction`／`zhubaohi/dsh-qwen38-compaction-fix`；另有 12 件 Memory 类与本主题**只到"名词级启发"**（`00080000/dsh-project-memory` ／ `JunNanLYS/dsh-layered-memory` ／ `Luisarg03/dsh-memory-vault#memory-auto` ／ `melandlabs/opencontext#dsh-opencontext` ／ `moononnn/…Hanako-Memory` ／ `diqierjia/StrataGate-AgentMemory` ／ `tinqiao-oss/engramory#plugin` ／ `w4xxx/dsh-xia-plugins#gameassist-memory` ／ `yangyongzhen/dsh-memory` ／ `Asher-2000/dsh-memory-connect` ／ `dream12347/dsh-session-manager` ／ `Relethe/dsh-brief-session-title`）。

#### D 组 · 排除（**G3 闸门的自我实证**）

我这轮紧扫（强相关词 ∧ 非 UI 噪音）后**仍混进三例同词异义**，逐条读描述才剔除：

| 候选 | 为何出局 |
|---|---|
| `PiedPiper911/dsh-video-tools` | "**compress** images" = **媒体转码**（FFmpeg.wasm） |
| `STARDUSTLC666/dsh-ffmpeg` | 视频工具，"encode" 被宽扫词命中 |
| `wingsky-1/dsh-plugin-hub#packages/dsh-gzip` | **HTTP gzip**（`/api` 响应压缩），与上下文无关 |

⇒ **印证 §1-G3 的必要性：即使收紧强相关词，仍必须逐条读描述**，否则会把媒体/传输压缩混进上下文压缩。

### ③ 评论（与上面的观察分开）

> 以下全部是**评论**（判断），不是观察。

1. **⭐ 3.4 的参考件至少分「三层」，不是两层 —— 建议在 §12 的二分法上补一层。**
   - ① **conversation compaction**（契约 / basic / command-compact / aerince / ljsysfurryACE / dcp / argp）→ **与 3.4 同题**
   - ② **tool-output 压缩**（pruner / headroom / context-lens / context-maid / context-pruner）→ 只在「压什么」互补，**不解决「摘要注入 ＋ 近文原文保留」**
   - ③ **上下文构成观测**（`bowenliang123/dsh-context`）→ ⭐ 这一类**对 T5 判据可能最有用**：「看模型上下文窗口由什么构成」正是「摘要注入 ＋ 近文保留」的**观测面**，而 T5 缺的恰是观测手段。
   ⇒ 只按二分法，会把 ③ 整类漏掉。

2. **⭐ "自写摘要"已有两条现成正本，且都不调 LLM** —— 这让 3.4 的"换策略"从**设计题**变成**选择题**：
   - **覆写 `summarize`**（aerince，🟢 实读）：把**模型自己写的文本**顶进官方管线 ⇒ 摘要来源 = 模型，但**不经第二次 LLM 调用**
   - **确定性抽取器**（`fan56/dsh-dcp` / `ljsysfurryACE/dsh-compaction`，🟡 名录级）：**保路径/命令/错误迹逐字、丢闲聊**
   ⇒ 两者对应 T3 的两条不同答案（"谁来写" vs "不写、只筛"），**建议都进深读清单**。

3. **T4 的阈值不是常数、是策略面 —— 且已有件把它当卖点。** 三套取值已被看到：官方 **0.8** / aerince **60%→70%**（🟢）/ rich-indexing **30/50/70/90 阶梯**（🟡）⇒ 建议 3.4 **不在本轮锁定阈值**，后置为**配置面**（aerince 已证明可配置）。

4. **⚠️ 版本脱节判断（§5-5 要求显式暴露）：本轮判「不成立」，社区红利可用。**
   - 官方三件与锚版**同代**（本机 profile 实测）✓
   - `giter00/dsh-headroom` 的 **peerDeps 区间实读包含我方锚版** ✓（⚠️ 声明级）
   - `aerince` **锚版本读不出**（无 peerDeps）⇒ 标 🔴，**不作为"可用"的依据**
   ⇒ **不构成"须单独一节上报老大"的条件**；但**没有任何一件是实测级兼容**，全部止于「同代」或「声明级」。

5. **两条我这轮新增的坑（供登记表"备注"列）**：① **名录去重必须读描述里的派生声明** —— `lifeodyssey/dsh-compressor` 自述是 headroom 的 "slim port"，不读描述会当成两件独立候选；② **极新件要在登记时带时间** —— `bowenliang123/dsh-context` 发布仅 14 小时，任何锚版本判断都无意义。

6. **两个社区清单规模差约 10 倍，说明"扫了多少"必须带通道名。** 我实读：目录站 **333 plugins** vs 本地名录 **3,196+**（同一天）；且**目录站没有 compaction 专类、未见 summarization 插件** ⇒ **只用目录站会系统性漏掉这一族**。⇒ 建议 WB 汇总时把"通道"与"扫描量"绑在一起列，否则各方数字不可比。

### ④ 本轮诚实边界

- **未翻阅任何 AI 的交流区文件**（`exchange/log-*.md`）；但**已披露**：规格 §12 内嵌 WB 报告 ⇒ 与 §12 重合处**不是独立第二次验证**（调整 A）。
- **headroom 的 2,067 行实现未逐行读** ⇒ 其"可逆取回"只到 **hook 位点级**，不到实现级（B-2 已分层标注）。
- **aerince 的锚版本读不出**（无 peerDeps）⇒ 按 G4 标 🔴、**不进结论**。
- **未做** npm 站内搜索；GitHub 侧只 1 次方向搜索（抽样）；**未拉取**新发现的 4 件（rich-indexing / dcp / context-lens / dsh-context）⇒ 它们仍是 🟡。
- 全部结论**只在「本地 Bash 通道 ＋ 内置搜索/抓取工具 ＋ git over 全局代理」内成立**，不可外推。
