# WorkBuddy 协作区

> 临时协作空间：仅在需要向其他 AI 同步时写入，**不做长期保留**；跨 AI 共享的项目事实一律落 `docs/` 或 `TODO.md`。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T·P** | Claude | CVM（Linux） | ✅ **已复核（WB 2026-09-21）** —— 三问**全成立**（WB **独立取物证**：装置三件 sha 现场逐位一致 ／ 交付件双侧一致 ／ 残留全清 ／ **Windows 侧回归由 WB 现场独立复跑**）；**3 处订正**（件数 13→11 ／ CVM 侧文件名 `-posix.mjs` ／ 交办项落点应为 `production-env.md` 且「RemoveIPC」归因**未复现**）⇒ 判定 = `TODO.md`「DSH-3.7.4-T」段 ｜⚠️ 结论取自 `917f45d` 版树（⛔ 不得当"当前版本"外推） | 2026-09-20 |
| **DSH-3.4-R** | WB | 本机（上游主仓 ＋ profile ＋ 名录 ＋ 内置搜索） | ✅ **WB 侧报告已出（2026-09-23，自承）** ⇒ **本文件 `## DSH-3.4-R 调研报告`**（含轮 2 补遗 ＋ 🔀 **融合轮 2026-09-28**） | 2026-09-23 |

- ✅ **本区已收口（2026-09-22）**：`DSH-3.8.1`（driver 成型）／ `DSH-3.8.2`（3.8.1 装置缺陷修复）**均已回报并复核成立**（判定 ／ 证据 ／ 遗留已回填 `TODO.md` 3.8 段）⇒ **本区当前无在飞块**。WB 于 2026-09-20 承担的 **3.7.4 复验 ＋ 3.7.4-T 复验 ＋ 3.7.4-T·P 前置清理** 三件亦均已落地。

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

- 🔒 **老大裁定（2026-09-23）**：
  1. **DSH-3.4 测试预算硬上限 = 5,000 万 token**（口径「在这个范围内随便搞」、**非**要求用完）⇒ 量级阶梯与「不做档」理由见 `docs/dsh/dsh-migration.md` §3.6〈S2 测试量级阶梯与预算〉。⭐ **同步已补做**（`TODO.md` 3.4 段 ＋ §3.6 标题与 ⑧ 段，原「暂缓」解除）。
  2. **版本锚定不做深度追踪** —— DSH 演进过快，社区本身也在探索合适的方式与节奏 ⇒ **持续观察即可，做好我们自己的事情**。§3.6 表头「版本脱节哨兵」纪律**保留**（老大原注不动），但执行力度**降为观察**：不必每轮深挖版本矩阵。
  3. **其他 AI 的分轮补充：取当下状态当一版看待** —— 原话「你看到啥就是啥，不管改了几次」⇒ WB 汇总时**不作版本考古、不区分轮次**。⚠️ 与 WB 自身「跨通道两轮须分写」**不冲突**：后者约束的是**自己的**结论（通道不同不可互推），前者是**他方的交付物**（汇总方只关心最终态）。
  4. **Qoder 的 repo 级 git 钩子**：**老大自去看**（WB 不动 —— 属其他 AI 的运行时资产）⇒ **后续 ✅ 已闭环（2026-09-28）**：老大查明 **Qoder 侧更新已修复／调整该行为**；WB 侧**复现确认不再触发**（2026-09-28 及上一轮 `git commit` 均 `exit 0`、无 `PROGRAM BLOCKED`）。⚠️ **通用纪律保留**：本仓判 `git commit` 成败一律看 `git log -1` ＋ `git status`，**不看退出码**（工具层故障会伪装成提交失败）。

## DSH-3.4-R 调研报告

> **落点**：本报告原写在本任务规格稿 `docs/dsh/dsh-34-ref-research.md` 的 **§12**；**2026-09-23 依老大裁定移回本文件** —— 规格稿须对五方保持中立，WB 的结论留在其中会**污染其他 AI 的独立性**。
> **本报告＝三轮**：**轮 1**（代理未开：本地上游主仓 ／ profile ／ 名录 ／ 内置搜索）／**轮 2 补遗**（代理开后：GitHub REST ＋ npm 注册表 ＋ 浅克隆实读源码）／**🔀 融合轮**（2026-09-28：吸收 Trae ／ Claude ／ Qoder 的**方法**后实做，与轮 2 **同通道** —— 代理已开）。**轮 1 与轮 2 ／ 融合轮通道不同 ⇒ 结论不可互推；轮 2 与融合轮同通道 ⇒ 融合轮的订正直接作用于轮 2 的结论。**
> WB 同时是汇总方 ⇒ 本报告只交**自己那一路**，不代替其他四方。**四方交付齐 ＋ 融合轮完成（2026-09-28）⇒ 汇总终稿＝`docs/dsh/dsh-34-ref-research.md` §11**（候选池 ／ 分档统计 ／ 通道对照 ／ 分歧点 ／ 版本观察 ／ 深读清单 Top 12）；另于 `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉**3.4 行**留指针。⚠️ **口径变更留痕**：收口前曾定「汇总**不进**规格稿」以防污染各方独立性；**该窗口在四方交付齐后关闭 ⇒ 规格稿由「操作规格」转为「调研成果稿」**，故 §11 写入本稿属**主动性质转换**，非漏改。

### ① 检索账（可复算）

| # | 轮 | 通道 | 动作 ／ 检索式 | 时间 | 扫描量 ／ 结果 |
|---|---|---|---|---|---|
| 1 | 1 | 本地 · 上游主仓（裸仓 `ref/dsh-bare`，tag `dsh-v0.1.5-rc.2`） | `git ls-tree -r packages/compaction/` ＋ `git show <tag>:<path>` 读契约 README ＋ `compaction-basic/src/{index,config,region,summarizer}.ts` ＋ `docs/subsystems/compaction.md` | 2026-09-23 | compaction 家族 4 件 ／ context 家族 1 组 |
| 2 | 1 | 本地 · 官方包（`~/.dsh/profiles/sdk/node_modules/@deepseek-ai/`） | `ls -d *compaction*` | 2026-09-23 | **3 件在**：`dsh-compaction-basic` ／ `-tool-result-pruner` ／ `dsh-command-compact`（契约件 `dsh-compaction` 只在深层 `.pnpm`） |
| 3 | 1 | 本地 · 社区名录 `ref/awesome-dsh-plugin.md`（3,386 行 ／ 27 分类） | 宽扫 8 词 ⇒ **458 条**；紧扫（强相关 ∧ 非 UI 噪音）⇒ **75 条**；再逐条读描述 | 2026-09-23 | 全量 ／ 真相关 ~18 条 |
| 4 | 1 | 联网 · 内置搜索工具 | 2 式（`giter00/dsh-headroom…` ／ `aerince/dsh-active-context-pruning…`） | 2026-09-23 | 各 5 命中（含注册表版本矩阵 ／ 同名异物） |
| 5 | 2 | 联网 · **GitHub REST 搜索**（未认证，代理开） | `search/repositories` 6 式：`dsh compaction` ／ `dsh context pruning` ／ `deepseek-harness plugin` ／ `"deepseek harness" compaction` ／ `topic:deepseek-harness-plugin` ／ `dsh compaction in:name,description` | 2026-09-23 | **total 211 ／ 9 ／ 7098 ／ 143 ／ 678 ／ 196**；每式取前 50 条实读描述 |
| 6 | 2 | 联网 · **npm 注册表直查** | 7 个官方包 `dist-tags` ＋ 版本尾 10 | 2026-09-23 | 官方 compaction 全家族 **同一版本梯** |
| 7 | 2 | 本地 · **实读社区源码** | `ref/community/` 两件（已在盘）＋ 浅克隆 4 件到**仓库外**临时目录（`git -c http.proxy=socks5://127.0.0.1:7890 clone --depth 1`） | 2026-09-23 | **6 件实读**（2 件全读源码；4 件读 README ／ 清单 ／ 机制段） |

**通道说明**：轮 1 走 **Bash ＋ 内置搜索工具**；轮 2 走 **GitHub REST（未认证，60 core/h）＋ npm registry ＋ Git 浅克隆**。⚠️ 轮 2 有一次 `git clone` 因 **SSL 握手失败**（`leesama/dsh-compact`）——且 `cmd \| tail && echo OK` 会**假报 OK**（管道掩盖退出码），已记为通道注意项。
**未做**：目录站（`dsh.pub` ／ `dsh.so`）注册表矩阵；**GitHub code search**（需认证）；Issues ／ CHANGELOG 检索；**未装 ／ 未跑任何件**；未做任何环境实测。

### ② 候选表

#### A 组 · 官方 ／ 上游（🟢 我方实读源码或 README）

| 候选 | 类型 | 入口 | 锚版本 | 命中 | 档 | 借鉴点 | ⛔ 不可参考 | 它怎么验的 | 证据 |
|---|---|---|---|---|---|---|---|---|---|
| `@deepseek-ai/dsh-compaction`（契约） | 官方 | `ref/dsh-bare:packages/compaction/compaction/`；签名 `src/index.ts:96-172`；子系统 `docs/subsystems/compaction.md`（238 行） | 锚版本身 | T1 T5 | **A** | 三操作 `compactIfNeeded(agent,trigger,signal)` ／ `compactNow(agent,signal,sourceCommandId?)` ／ `compactRegion(start,end,agent,signal?)`；`abstract class CompactionEngine extends Service` ＋ `super(ctx,'compaction')`；**日志括号锁**：`compaction/start` →（summarize）→ `compaction/summary` → **唯一 surface 变更** → `compaction/end`；**checkpoint marker 从 cordis-free 子路径 `./checkpoint` 导出**；`toolPairingBalancedBefore/After(session,seq)` 做边界吸附 | 无（我方自做 Provider 的正本） | 官方仓自带 tests（本轮未读） | 🟢 |
| ⭐ **`packages/core/session/src/types.ts` ＋ `surface.ts`（surface op 权威定义 ／ 校验器）** | 上游主仓 | `types.ts:427,436`（`SurfaceOp` 联合）／ `surface.ts:75,205,229,326,441,468` | 锚版本身 | T1 T5 | **A** | ⭐ **我上一版漏掉的契约件**：`SurfaceOp = {op:'replace'; startSeq: SessionSeq; endSeq: SessionSeq}` 是**类型级权威**；`surface.ts` 是**校验器**（`isReplaceOp` ／ 违反 surface metadata ／ source-event 引用 ／ range ／ tool-result 重写规则时抛错）⇒ 「合法 replace 到底长什么样」以这两处为准，不以我方推断为准 | — | 官方 spec（未读） | 🟢 |
| `@deepseek-ai/dsh-compaction-basic` | 官方 Provider | `~/.dsh/profiles/sdk/node_modules/@deepseek-ai/dsh-compaction-basic/`；上游 `packages/compaction/compaction-basic/`（`src/` 5 文件 ＋ 5 个 spec） | 锚版本身 | T2 T4 T5 T6 | **A** | ⭐ **T4 量化锚**：`thresholdRatio` **0.8**（`floor(routedContextWindow × ratio)`）／ `retainRatio` **0.16** ／ `retainTokens`（绝对值，与 ratio 互斥）／ `maxTokens` 8192 ／ `compactionRetries` 1 ／ `maxOverflowRetries` ／ `auto` ／ `modelPolicies`（每模型覆盖）；**触发点 = `agent/pre-step` 前置** ＋ `agent/request-error` 的 `CONTEXT_WINDOW_EXCEEDED`；**`summarize()` 是唯一子类钩子**；替换消息用 `<compacted-summary>` 包裹、`GenerateOptions.purpose='compaction'` | 无（正本） | 官方 5 个 spec（未读） | 🟢 |
| ⭐ **新增配置面：`summarizationProvider` ／ `summarizationModel`** | 官方 Provider | 上游 `compaction-basic/src/config.ts:30-31,89-90`；**必须成对设置**（`:254-271` 校验）；`modelPolicies` 级可 override（`:119-120,161-162`） | 锚版本身 | T2 T4 | **A** | ⭐ **我上一版的遗漏**：可把**摘要调用单独改路由**（如小窗口会话的摘要交大窗口模型）⇒ 我方测试阶梯的第 **4** 根杠杆 | — | 配置校验有测试 | 🟢 |
| `@deepseek-ai/dsh-compaction-tool-result-pruner` | 官方 | 同上 | 锚版本身 | T2 T3 T6 | **A** | ⭐ **「压了但保原文」最强现成范式**：超 `thresholdChars`(8192 码点) → 头 `headChars`(4096) ＋ `[... tool result middle pruned ...]` ＋ 尾 `tailChars`(1024)；**原文留 append-only log**，替换件以 `sourceEventSeqs` 引用 ⇒ 重放可复原；`compaction/prune` **shadow-price 事件**；**不发模型调用** | 无 | 官方 tests（未读） | 🟢 |
| `@deepseek-ai/dsh-command-compact` | 官方命令 | 同上 | 锚版本身 | T5 T6 | B | `/compact` **不消耗 model turn**；mid-turn ／ 已在压缩 ⇒ unavailable；**不接受参数**；⚠️ 手动路径硬编码 `retainTokens = 0`（`compaction-basic/src/index.ts:380-384`）⇒ **只留最后 1 条**，与 `retainRatio` 语义不同 | — | 官方 tests | 🟢 |
| `@deepseek-ai/dsh-token-meter` | 官方 | 上游 `packages/llm/token-meter/` | 锚版本身 | T4 T6 | B | 触发判定的**测量服务**（`ctx.tokenMeter` ／ `measure(session)`）；⚠️ **四字符≈1 token 启发式**，明示低估 CJK 与 JSON schema | — | — | 🟢 |
| 上游 `docs/subsystems/compaction.md`（238 行） | 上游主仓 | `ref/dsh-bare:<path>` | 锚版本身 | T1 T2 | **A** | 事件 ／ `CompactionResult` ／ service ／ pruning outcomes ／ Cordis API（`ctx.compaction` ／ `ctx.toolResultPruner`）⇒ 精确签名与 payload 的权威落点 | — | — | 🟢 结构（内容未读 ⇒ 内容面 🟡） |
| ⭐ **官方安装契约：`package.json#dsh.bundle.patch`** | 上游主仓 | 判定点 `apps/cli/src/plugin.ts:43-44`（`readProfileManifest('dsh',dir).dsh?.bundle?.patch !== undefined`）；无 `dsh.bundle` 者被记为 **plain dependency、不入 profile 层**（`:72` warn） | 锚版本身 | T6 | **A** | ⭐ **「一件社区件能不能被 `dsh plugin add` 真正挂上」的判据**；且 ⇒ **`dsh.plugin.json` 全仓无任何引用**（见 ③-8） | — | 上游 CLI 测试 | 🟢 |

#### B 组 · 社区（**轮 2 起部分实读源码**；仍余多为 🟡）

| 候选 | 入口 | LICENSE | 锚版本 | 命中 | 档 | 借鉴点 | ⛔ 不可参考 | 它怎么验的 | 证据 |
|---|---|---|---|---|---|---|---|---|---|
| `aerince/dsh-active-context-pruning` | `ref/community/aerince__dsh-active-context-pruning`（HEAD `d52b5f2`） | **MIT** | 注册表矩阵 **`dsh 0.1.5-rc.2` ✓ L5 runtime verified**；`package.json` 有 `dsh.bundle.patch` | T2 T3 T5 | **A** | ⭐ **与我方最同题，且源码已读**：① 它**不是 Provider 而是消费者** —— 调 `ctx.get('compaction').compactRegion(start,end,agent,signal)`（`index.js:230`）；② ⭐⭐ **并用 `compaction.summarize = async (input,agent,signal) => …` 外部包装**注入"模型自写摘要"（`index.js:160-179`，`ctx.effect()` 装/卸）⇒ **「换摘要来源」有两条路：子类覆写 vs 外部包装**；③ ⭐⭐ **「摘要注入」的精确谓词**：`isCheckpointEvent` = `type==='user/message' && data.source.kind==='plugin' && data.source.plugin==='compact'`（`lib.js:73-77`）；④ 断言可直接复用：`result.shadowedRange.{start,end}` ／ `shadowedSeqs` ／ `shadowedTokenCount` ／ `compaction/summary.data.compactionId`；⑤ `preserveRecent` 默认 **2 = surface 节点数**（`lib.js:126`）——与官方 **16% token 比例**是**两种语义**；⑥ 阈值写 `"60%"`／`"70%"` 或 token 数，`floor(window×ratio)`（`lib.js:29-33`）；⑦ 取真窗口的正路：`llm.resolveModelInfo(provider,model).context.contextWindow` ＋ `agent/pre-step` 缓存（`index.js:84-96,304-308`）；⑧ `assertSafeRange` **只校验 surface 范围与新尾**，**工具配对平衡交给引擎** | ① 工具驱动（模型主动压），与 S2 判据不完全同构；② `acp_` **不是** Agent Client Protocol，命名歧义；③ **依赖 official basic 提供 `compactRegion`** | README 给 `node check.js` 纯函数自检；**无测试说明** | **🟢（轮 2 升）** |
| `giter00/dsh-headroom` | `ref/community/giter00__dsh-headroom`（HEAD `ca5de63` v0.3.0） | **Apache-2.0**（含 NOTICE） | 注册表最新行 = `0.1.2-rc.1`；源码 `dsh.plugin.json#engines.dsh` 范围覆盖 0.1.5-rc.2 但**该字段无上游校验**（见 ③-8） | T2 T3 T5 T6 | **B** | ⭐ **「压了但可逐字节取回」**：挂 `tools/post-execute`（`lib/index.js:478`），**结果物化前**替换文本；内容路由 ＋ 专用压缩器（JSON ／ grep ／ log ／ 表格 ／ 长文 Kompress）；**CCR store 存原文 ＋ marker**，模型可 `headroom_retrieve(id=…)` 取回；**代码默认不压** | ① 属 **tool-output 生态位**，**不解决**「摘要注入 ＋ 近文原文保留」；② ⭐ **`package.json` peerDeps 只有 cordis/agent/llm/session/tools —— 无任何 `@deepseek-ai/dsh-compaction*`** ⇒ **源码级确证它不碰会话压缩**；③ 引入新模型工具 = **产品决策**；④ ⚠️ `dsh.plugin.json` 声明 `contributes:{tools:[],skills:[]}` 为空，**运行时却注册 3 个工具** ⇒ 清单与实际不一致 | 自带 `scripts/verify-compress.mjs`：断言 code ／ error 输出**字节不变**、CCR 可取回、**NEEDLE-42 在压视图不可见但可取回** | **🟢（轮 2 升）** |
| `knighthongyu/dsh-handoff-compaction` | `github.com/knighthongyu/dsh-handoff-compaction` v0.1.4 | MIT | ⭐ **README 明列 `0.1.1-rc.2` ／ `0.1.2-rc.1` ／ `0.1.5-rc.2`（注：npm `latest`）／ `0.1.7-alpha.2`**；peerDeps 覆盖 `^0.1.5-rc.2` | T2 T3 T4 T5 | **A** | ⭐⭐ **「换 Provider」的端到端实样**：Bundle patch **禁用 `compaction-basic` ＋ `tool-result-pruner`、保留 `command-compact`**，注入自己的 compactor ＋ 挂官方 SQLite 检索后端。**`retainTokens: 16000`（绝对值）替代 16% 比例** —— 理由是小窗口下 16% 不够／大窗口下过多 ⇒ ⭐ **`retainRatio` vs `retainTokens` 的取舍实证**；摘要调用**重放完整当前 surface**（而非先截到被压区间），理由 = 本地 provider 无法复用缩短后的 prompt（与官方做法**相反**） | ① 面向小窗口本地模型，取向不等于我方；② 引入 5 个官方史检索工具 = **产品决策**；③ "cache hits 取决于 provider" 自承 | ⭐**验证配方可抄**：`dsh plugin --profile X list --depth 0` ＋ `dsh --profile X --dump-config` 断言条目默认值（`thresholdRatio:0.8` ／ `retainTokens:16000` ／ `maxTokens:8192`） | 🟢（README ＋ 清单实读；**未读 `lib/handoff-engine.js`**） |
| `QuanhuZeYu/dsh-compaction-zh` | `github.com/QuanhuZeYu/dsh-compaction-zh` v0.1.0 | MIT | 无 peerDeps；`dsh.bundle.patch` 有 | T5 T6 | **A** | ⭐⭐ **直击我方产品问题**：官方把压缩指令**硬编码为英文常量**（含 "Write concise English engineering prose"）⇒ **中文会话的检查点也是英文**。它走 **`llm/stream` 瀑布 ＋ `options.purpose==='compaction'`**（`{global:true,prepend:true}`）**只改那一次辅助调用的尾部指令**。⭐ **并写明「上游没留指令注入口」**：`COMPACTION_INSTRUCTION` **模块私有、未导出**；`summarizeWithLlm()` **不收指令参数**；覆写 `summarize()` **要自己重做整段模型调用与目标解析**。三条边界值得抄：**前缀字节不变**（不伤 KV cache）／**不确定就放行**（深冻结请求、含图片块、认不出指令 ⇒ 不改写）／**异常不扩散**（只 warn，宁可检查点是英文也不能让压缩失败） | ① 它自承**仅改指令、不改阈值／保留窗口／重试**；② 依赖"官方文档明说 `llm/stream` 可拦截"（我方**未回上游核对** ⇒ 该前提 🟡） | 自带 `tests/{unit,integration,e2e}.test.mjs`；README 给热挂载与 bundle 两条启用法 | 🟢（README ＋ 说明实读；**未全读 `src/localize.ts`**） |
| `argszero/cordis-plugin-compaction-route-fallback` | `github.com/argszero/cordis-plugin-compaction-route-fallback` v0.1.0 | MIT | peerDep `@deepseek-ai/dsh-llm` 覆盖 `>=0.1.5-alpha.1 <0.2.0`（**含锚版**） | T4 T6 | **B** | ⭐⭐ **给出一个必须防的失败级联**：官方**把被压区间逐字重放**、且**在会话自己的路由上**发摘要调用（除非配 `summarizationProvider/Model`）⇒ 小窗口路由下「**要缩的东西，正是那个缩不动的调用**」→ 溢出 → `compaction/end` 出错 → 官方政策「摘要失败**保留最新 durable surface**」→ surface 没缩 → 下一轮同样失败（**确定性自锁**，报 discussion **#7423 ／ #5594**）。它的解法是在 `llm/stream` 上把"**未吐任何内容块前**就 `CONTEXT_WINDOW_EXCEEDED` 收尾"的那次调用**原样重发**到备用大窗口路由 | ① 未在锚版实测；② 其"小窗口预算算术报错、自动监听器跳过"一条**无法在锚版定位**（见 ③-2） | 自带 `test/{decide,waterfall,packaging}.spec.mjs` | 🟢（README 实读；未读 `src/index.ts`） |
| `bowenliang123/dsh-context`（1494★） | `github.com/bowenliang123/dsh-context` v0.55.0 | Apache-2.0 | ⭐ `package.json#dsh.compatibility.dshReleases` = `{0.1.2-rc.1, 0.1.3-alpha.2, 0.1.5-rc.1, 0.1.7-alpha.2: compatible}`（⚠️ **无 rc.2**）；peerDeps `>=0.1.2-rc.1` | T5 T6 | **A** | ⭐⭐ **`docs/compatibility.md` 是这轮最硬的单份材料**：① **DSH 会话日志分代表 V0/V2/V3/V4**（见 ③-3，我方已在锚版核对 4 条）；② 版本闸门语义（"channel order: **release > rc > beta > alpha**"，**取不到就 fail open**）；③ ⭐ **验证方法学**：seam 矩阵（按 tag 摆出**真源码**、把插件装进该 tag 的真实投影注册表、**每条可选缝正反两侧都断言**）＋ 与官方自身 fold 的**差分校验**（`sessionStats` ／ `contextBreakdown` ／ `contextPressure` ／ `tokenUsage` 逐项对齐）＋ **一次性 profile 装／卸**（临时 `DSH_HOME`，真 `~/.dsh` 绝不碰） | ① 它是 **UI 观测件**，不是压缩策略件；② 自承「不等于真实 Profile 的运行验收」；③ 高星**不构成理由**（§3.0） | 上述三项，`pnpm test` 内的 `compat` 项目 | 🟢（`docs/compatibility.md` ＋ `package.json` 实读） |
| `ICCuse/dsh-premise-guard` | 名录 L1310 | 未核 | 未核 | T5 T6 | **A?** | ⭐⭐ **与我方判据反向同题**：**压缩后前提漂移守卫** —— 摘要**丢掉关键 literal 锚**时注入一次性提示（"你可能丢了什么、怎么找回"） | 未读源码 | 未核 | 🟡 |
| `ljsysfurryACE/dsh-compaction` ／ `yoza10635/dsh-argp` ／ `JohnXu22786/context-pruner` ／ `songoao25/dsh-auto-compact` ／ `falling-ts/dsh-force-compact` ／ `Tyan66666/billion-context-dsh` ／ `Icstick/dsh-context-maid` ／ `ishuowang/dsh-sideband` ／ `LFM097384/Context-Prism` ／ `qwert702/dsh-context-compressor` ／ `snow-The/dsh-session-handoff` ／ `whiteS18/dsh-handoff-button` ／ `vibeinging/dsh-agent-budget` ／ `zhubaohi/dsh-qwen38-compaction-fix` ／ `ICCuse/dsh-file-memory` | 名录 L1105–L1388 各行 | 未核 | 未核 | T2–T6 | B ／ C | 轮 1 从**本地名录**取出的 15 条（确定性语义抽取、守卫式压缩、强制触发、交接式摘要、token 预算等）；**轮 2 已在 GitHub 侧复核到同名件仍活跃**（多条 2026-09-23 仍有提交） | 均未读源码 | 未核 | 🟡 |

#### C 组 · **轮 2 新见候选（按簇 —— 只登记，不逐条展开）**

> 这是"广撒网"的实际产出：**单 `dsh compaction` 一式在 GitHub 就有 211 个仓**，远大于本地名录（3,386 行 ／ 2026-09-07 快照）所反映的规模。以下按**痛点簇**登记，**全部 🟡**（仅读 API 的 description，未见 README）⇒ ⭐ **分档是"按描述粗判"，深读时须重判**。

| 簇 | 代表候选（`owner/repo`） | 为什么登记 |
|---|---|---|
| **A · 接管 compaction（与 aerince ／ handoff 同生态位）** | `MimicHunterZ/dsh-agent-compact` ★4 ／ `jonah791/dsh-agent-compact(+self)` ／ `brunhildzhou/dsh-context-zip` ／ `adrianwebb/dsh-chapters` ／ `52sujiu/dsh-context-mode-compaction` ／ `SeptTpes/dsh-cache-aware-compaction` ／ `Zhuchen00123/dsh-compaction-cacheaware` ／ `yindf/taskfold` ★7 ／ `wjw66/deepseek-harness-jev-pre-compaction` | **候选件最多的一簇** ⇒ 3.4 选型时"自己写 vs 抄"的样本充足；其中多条聚焦 **KV-cache 友好**（重放而非改写前缀） |
| **B · 无 LLM 的确定性压缩** | `TsFreddie/dsh-compaction-instant` ★16（"LLM-free lossless*"）／`zhan21391-max/dshx-algo-compact` ／ `qingshanjiluo/dsh-context-manager` ／ `bobcyw/dsh-compaction-fact` ／ `kolawong/fast-compaction-dsh` ／ `perfirstvito/dsh-compaction-micro` | 与我方 T3 直接相关：**不发模型调用**⇒ 无摘要截断风险，但"摘要含 nonce"判据不适用（**要分开验**） |
| **C · 阈值 ／ 触发实践** | `jcleener/dsh-compaction-threshold` ／ `Raylen-berry/dsh-cache-control`（改写触发点与**保留比例**）／`sagmans` ／ `xuediner-source` ／ `vzina` ／ `wangxiang0605qvq` ／ `lileikeji` ／ `subfocusx/utm-auto-compact` ／ `Zh-U-hB` ／ `QuanhuZeYu/dsh-idle-compactor` ／ `muigoochen/dsh-compaction-director` | 官方 `thresholdRatio/retainRatio` 的**实践取值**池 ⇒ T4 参考 |
| **D · ⭐ reasoning 吃掉 `maxTokens` 导致摘要截断** | `zhubaohi/dsh-qwen38-compaction-fix` ／ `hustlxc/dsh-compress-caveman` ／ `IamWWT/dsh-gateway-compaction` ／ `Yunado/dsh-qwen38-local-qol` ／ `782042369/dsh-model-compat-guard` | ⭐⭐ **同一失败模式被 5 个互不相识的仓各自修** ⇒ 这是**已被社区多次独立复现**的真坑（非个别 provider 怪癖）。**我方判据必须能区分「没压」／「压了但摘要被截」** |
| **E · 观测 ／ 判据（T5）** | `leesama/dsh-compact`（压缩遥测 ＋ shadow-cost）／`bowenliang123/dsh-context`（已列 B 组）／`aoripus/dsh-optimize` ／ `jijiwu3526/dsh-token-governor` ／ `QIANLING-0831/dsh-memory-plus`（**CJK-aware** 全文检索 ＋ 近无损 locator）／ `PerryLink/dsh-fast` | "怎么看出它真压了／压了多少"的现成面板与埋点 |
| **F · 溢出 ／ 错误归类（T6，直击我方 L5"不做"）** | `argszero/cordis-plugin-overflow-classifier-guard`（把 provider 的 `max_prompt_tokens` 拒绝**重新归类**为 `CONTEXT_WINDOW_EXCEEDED`；源 discussion **#6361**）／ `LuminariSoftwares/context-guardian` | ⭐ **独立佐证**：官方归一化会**漏掉某些提供方的拒绝形态** ⇒ 我方 L5"不做"是对的，且**将若要做，第一件事是确认归一化覆盖** |
| **G · 压缩界面（前端 ／ 观测）** | `wallpap/dsh-compact-activity` ★8 ／ `focksor/dsh-plugin-node-time`（悬停看压缩标记耗时）／ `suntianc/dsh-ui-tool-result-images`（Compact 折叠后仍保图）／ `liutian11451-png/dsh-plugin-compact-button` ／ `ComeCaramelos/dsh-ask-before-compact`（**压缩前问用户**）／ `863683348/dsh-plugin-focus`（**跨压缩钉住目标 ／ 约束 ／ 决策**） | 后两条属**反向侧**（人机确认 ／ 前提钉住）⇒ 与 `premise-guard` 共同覆盖我方 nonce 判据的反面 |
| **H · 穿越压缩的检索 ／ 记忆** | `fengshenx/dsh-remind` ／ `ycr40/dsh-prolong-memory` ／ `astral-0619/dsh-session-memory` ／ `vv5v5/dsh-memory-archive` ／ `EPCN-fla/dsh-observational-memory` ／ `xiyiyiru/dsh-state` | "被压掉的东西怎么按需取回"——与官方 pruner 的 `sourceEventSeqs` 同思路 |
| **横切 Ⅰ · "Jev" 排序簇** | `Mire-2019/dsh-jev-compaction` ／ `bojansandhaus/jev-lcm-dsh-compaction` ／ `yangyu666/dsh-jev-prune` ／ `mastwet/dsh-fast-jev-compaction` ／ `justhalfbit/dsh-plugin-jev-effort-selector` ／ `LXBWOW/dsh-context-curator` | 4＋ 件**独立**使用同一排序器 ⇒ 一个**事实上的第三方标准（非官方）** ⇒ 选型时须问"要不要引入这个外部依赖" |
| **横切 Ⅱ · 生态目录 ／ 注册表（检索通道本身）** | `XingLingQAQ/dsh-plugin-registry`（**机器可读目录，每日刷新**）／`Dominic789654/awesome-deepseek-harness` ★346 ／`LiuRJ99/awesome-dsh-plugins` ／`HackSing/dsh-plugins` ／`kejixiaoliang/awesome-dsh-plugins` ／`Noob-stupid/dsh-plugin-gating-hub` ★88（含 500+ 插件索引 ＋ 升级门控）／`LivXue/dsh-plugin-shop` ★875 | ⭐ 本地名录是 **2026-09-07 快照**、已明显滞后 ⇒ **下轮检索应改从注册表 JSON 起手**（不必再爬名录） |
| **横切 Ⅲ · 源码学习材料** | `ChenYu1991ppak/deepseek-harness-anatomy`（17 章源码研读教程，从最小 agent-loop 起）／`bowenliang123/dsh-context` 的 seam 矩阵 | 上手 DSH 内部结构的**第三方教材**（非官方）⇒ 可作我方 new-joiner 参考 |

#### D 组 · 排除（**G3 闸门的实测印证**）

- 本地名录宽扫 **458 条** → 紧扫 **75 条** → 真相关 **~18 条**：绝大多数命中是 **UI 语义**（`context menu` ／ 折叠 ／ 侧栏 ／ 面板 ／ chip）。⇒ **「不许按关键词计数判相关」是必要闸门**。
- GitHub 侧同病：`deepseek-harness plugin` 一式 **total 7098**，前 50 条里真与压缩相关的 **≈1/6**。⚠️ **同名异物**：`giter00/dsh-headroom`（插件）≠ `wjxn13/dsh-headroom`（Python 代理）⇒ **登记必须写全 `owner/repo`**。

### ③ 评论（与上面的观察分开）

1. **3.4 的参考件横跨两个生态位，混了会在错误的层面设计。**
   - **(a) conversation compaction**：官方契约 ＋ basic ＋ command-compact；社区 `aerince` ／ `handoff-compaction` ／ `ljsysfurryACE` ／ `yoza10635` ／ C 组候选。→ **与 3.4 同题**。
   - **(b) tool-output 压缩 ／ 可逆取回**：官方 pruner；社区 `headroom` ／ `context-pruner` ／ `context-maid`。→ 只在**「压什么」上互补**，**不解决**「摘要注入 ＋ 近文原文保留」。
   - ⇒ 判据侧证据：`headroom` 的 `package.json` **peerDeps 里没有任何 `@deepseek-ai/dsh-compaction*`**（🟢 源码级）⇒ (b) 类件**在依赖层就与 (a) 无关**。

2. **⚠️ 一条第三方断言在我方锚版无法定位，不得据此改方案。**
   `argszero` 称小窗口下预算算术 `W − O − headroomTokens`（默认 **65,536**）会报配置错、自动监听器跳过。**我在锚版全仓 grep 无 `headroomTokens`**（仅剩无关同名常量：`session-reference` 的 65_536 字节 ／ `agent-team` 消息字节上限等）。⇒ 该字段属**其他版本线**，**不得外推到 rc.2**。但它提出一个**必须实测的风险**：**L2 把窗口压到 20000 时，自动触发是否仍成立** ⇒ 我据此把 L2 的观测项加一条（见 §修正 5）。

3. **⭐⭐ 拿到一把"版本脱节"的尺子：DSH 会话日志分代表（社区产出，我方已在锚版逐条核对 4 条）。**
   `dsh-context/docs/compatibility.md` 给出 V0(`0.1.2-rc.x`) ／ V2(`0.1.3-alpha.x`) ／ **V3(`0.1.5-alpha.x+` ← 我方锚版)** ／ V4(`0.1.6`/`0.1.7+`)。我在锚版核对：
   - 替换端点 V0/V2 `{start,end}` → **V3 `{startSeq,endSeq}`** ⇒ `packages/core/session/src/types.ts:436` 的 `SurfaceOp` 联合 ✓
   - system prompt V3 = `system/message` **surface 节点** ⇒ `packages/client/connection/src/client/fixture.ts:729` ✓
   - 嵌套分发 V3 = `tool/ptc-dispatch` ⇒ `docs/persistence-catalog.md:966` 有该事件；且 `session-format-v2-to-v3` 把旧名 `tool/code-dispatch` 标为 **`obsolete`** ✓
   - tool-result V3 仍为**包装块 ＋ `role:'user'`**（V4 才改为 `role:'tool'` 直挂 `message.toolCallId`/`isError`）⇒ `packages/core/session/src/index.ts:378-380` ✓
   ⇒ 用法：**评估任何候选件前，先看它写的是哪个分代的字段**；写 V0/V2 或 V4 字段的，在 rc.2 上必错。
   ⚠️ **自我纠错留痕**：我第一眼只 grep 到 `tool/code-dispatch` 就以为社区表写错，**差点误报**；读到 `session-format-v2-to-v3/payload.ts:268` 的 `obsolete` 才反转。⇒ **负结果的"精确含义"必须读源码确认**（这条已进本轮教训）。

4. **「摘要注入」的机读判据：上游早有正本，轮 2 补上"可直接断言"的字段名 ＋ 第三方独立印证。**
   ⚠️ **先纠一处过度声明**：`isCompactCheckpointSource()`（`compaction/src/checkpoint.ts:19,49`，判定 `source.kind==='plugin' ∧ plugin==='compact'`）**上游本来就有**，轮 1 已记 —— 不是轮 2 的发现。轮 2 的实际增量是：**（i）** `aerince` **独立**写了同一个谓词（`lib.js:73-77`）⇒ 该判据得到第三方印证；**（ii）** 拿到断言要用的字段名 —— 事件侧 `data.shadowedRange.{start,end}` ／ `data.shadowedSeqs` ／ `data.shadowedTokenCount` ／ `data.compactionId`，返回值侧 `result.shadowedRange` ／ `shadowedSeqs` ／ `shadowedTokenCount`（`index.js:232`）。原谓词：**`event.type === 'user/message' && event.data.source.kind === 'plugin' && event.data.source.plugin === 'compact'`**，配套字段 `data.shadowedRange.{start,end}` ／ `data.shadowedSeqs` ／ `data.shadowedTokenCount` ／ `data.compactionId`。⇒ 判据（摘要注入 ／ 近文原文保留 ＋ 摘要含 nonce）**可全部做成机读断言，无需人眼**。

5. **⭐⭐ 换摘要来源有两条路，且"覆写 `summarize()`"比我上轮写的要贵。**
   - 路 A **子类覆写** `summarize()`（官方唯一钩子）：`compaction-zh` 明写其代价 —— `COMPACTION_INSTRUCTION` **模块私有未导出**、`summarizeWithLlm()` **不收指令参数** ⇒ **要自己重做整段模型调用与目标解析**。
   - 路 B **外部包装** `compaction.summarize = …`：`aerince` 实证可行（`ctx.effect()` 装/卸），且**不改官方源码**。
   - 路 C **`llm/stream` ＋ `options.purpose==='compaction'`**：`compaction-zh`（改指令）与 `argszero`（失败重路由）**两个独立实现**都用这条缝 ⇒ ⭐ **社区公认接缝**。
   ⇒ 我方选型结论：**「换策略」优先考虑路 B/C，"覆写即换"的乐观表述已收敛**。

6. **T4 的量化锚 + 第四根杠杆。**
   官方：阈值 = 路由窗口 × **0.8**、保留 **16%** 逐字、摘要输出上限 **8192**。轮 2 补上：**`retainRatio` 与 `retainTokens` 是互斥的两种语义**，`handoff-compaction` 用**绝对值 16000** 替代比例（小窗口下 16% 不足 ／ 大窗口下 16% 过多）⇒ 我方默认值应**按窗口量级选**；并新增 `summarizationProvider`/`summarizationModel`（**必须成对**）作**第四根杠杆**。
   ⚠️ 成本修正：官方摘要调用的输入 **≈ 被压区间**（逐字重放）；`handoff-compaction` 反其道**重放完整 surface**（为保本地 provider 前缀缓存）⇒ **两条路成本不同，选型要一并权衡**，不能笼统写"输入是被压区间"。

7. **⭐⭐ 版本脱节判断 —— 升级为"无脱节，但有安装陷阱"。**（老大注要求，单列）
   npm 注册表直查：`@deepseek-ai/dsh` 的 **`latest` ／ `next` = `0.1.5-rc.3`**（`alpha` = `0.1.7-alpha.2`）；**官方全部 compaction 家族包与 CLI 共用同一条版本梯**（… `0.1.5-rc.2` → `0.1.6-alpha.{1,2}` → `0.1.5-rc.3` → `0.1.7-alpha.{1,2}`）。
   - ⇒ **社区并未普遍要求高于我方锚版的 DSH** ⇒ **不需要按 §3.6 表头"老大注"上报脱节**。
   - ⭐ **但有一个实操陷阱**：这些包的 **`latest` dist-tag 指向 `0.0.1-rc.x`**（如 `dsh-compaction-basic` ／ `-tool-result-pruner` ／ `dsh-command-compact` 的 `latest` 都是 `0.0.1-rc.x`，而 `next` 才是 `0.1.5-rc.3`）⇒ **裸 `npm i` 会装到与锚版不匹配的早期版**。⇒ 我方**装官方 compaction 包必须显式钉版本或走 `next` 标签**。
   - ⇒ 对候选件的含义：`handoff-compaction` **点名 `0.1.5-rc.2` 且标注它是 npm `latest`**（该标注与注册表显示的 `latest=0.1.5-rc.3` **不一致**，⚠️ 后者是我实测、前者是它 README 自述 ⇒ **以实测为准**）。

8. **⭐⭐ `dsh.plugin.json` 不是官方契约 —— 兼容性声明不可作依据。**
   上游 **全仓无任何文件引用 `dsh.plugin.json`**；官方判据是 **`package.json#dsh.bundle.patch`**（`apps/cli/src/plugin.ts:43-44`），无该字段者被记为 **plain dependency、不入 profile 层**。
   ⇒ 因此 `headroom` 在 `dsh.plugin.json#engines.dsh` 写的那段范围**无上游校验**；其取值范围（`>=0.1.0-rc.1 <0.2.0-0`）与锚版的关系**按 npm semver 的 prerelease 默认排除规则本身存疑**（⚠️ **本轮未实测**，标待核）。⇒ **结论：候选件的兼容性一律以"装上后实测"为准，声明只能当线索。**

9. **官方失败语义是安全的，但**判据必须能区分三种结局**。**
   `argszero` 引官方政策：**「摘要失败保留最新 durable surface」** ⇒ 摘要失败**不缩、不丢**，只是不生效。结合 D 簇（5 件独立修 `reasoning → maxTokens` 截断）⇒ 三种结局必须分开：**① 根本没触发 ② 压了但摘要被截 ③ 压了且摘要完好**。否则"nonce 丢失"时无法归因（这条我上轮只写了 ②③ 的分野，轮 2 补上 ①）。

10. **`llm/stream` 是"动压缩调用"的公共接缝（可写进我方设计的备选路径）。**
    `compaction-zh` 与 `argszero` 两个独立实现都在它上面工作；官方文档称其可拦截（⚠️ 该前提我未回上游核对 ⇒ 🟡）。⇒ 我方若需本地化摘要、或做摘要调用重路由，**不必 fork basic**。

11. **轮 1 那条"契约面不需要社区"的结论，轮 2 进一步增强但补了一处。**
    官方契约 ＋ `docs/subsystems/compaction.md` ＋ `src/index.ts` 是完整正本；轮 2 又找到两件**我上轮漏掉的契约件**：`packages/core/session/src/types.ts`（`SurfaceOp` 联合类型）＋ `surface.ts`（replace 的校验器）。⇒ 社区的增量价值继续集中在 **T3（策略）／ T4（阈值实践）／ T5（守卫与验证）／ T6（坑）**。

12. **轮 1 的 T5 判据建议在轮 2 得到第三方印证与字段级补全，原建议仍作兜底** —— 谓词依赖 `source.plugin==='compact'`；若该值将来变化，`./checkpoint` 子路径导出的 marker 仍可识别压缩历史。

### ④ 对上一版（规格稿 §12）的修正与自我纠错

| # | 上一版怎么说 | 本轮改成 | 依据 |
|---|---|---|---|
| 1 | 配置面列了 8 个字段 | **补 `summarizationProvider` ／ `summarizationModel`（必须成对）** | 上游 `compaction-basic/src/config.ts:30-31,89-90,254-271` |
| 2 | "覆写 `summarize()` 即换摘要来源" | **收敛**："成本高于预期（私有常量 ／ 无指令参数 ／ 需重做整段调用）"；**并列路 B ／ 路 C** | `compaction-zh` 的书面说明 ＋ `aerince` 源码 |
| 3 | 社区件"一件源码都没读"，全 🟡 | **6 件实读**；`aerince` ／ `headroom` 升 **🟢**（全读 ／ 选择性） | 本轮读源码 ／ 清单 ／ 机制文档 |
| 4 | `headroom` 版本脱节"唯一待核" | **换成更硬的判断**：`dsh.plugin.json` 无上游校验 ⇒ **声明不可作依据，兼容性以实测为准** | 上游全仓 grep ＋ `apps/cli/src/plugin.ts:43-44` |
| 5 | L2「小窗口 20000 ⇒ 阈值 16000」 | ⚠️ **加一条必测项**：小窗口下**自动触发是否仍成立**；若不成立 ⇒ 窗口退到 **100k–200k** 档（L2 目的不变） | `argszero` 的 `headroomTokens` 断言**在锚版无法定位**（不可采信），但**风险成立** ⇒ 转为待测项 |
| 6 | T4 "1 轮逼出约 80 万 token 量级" | **不变**（阈值为 `floor(window×0.8)` 已源码确认）；但补 **`retainRatio`/`retainTokens` 互斥语义** 与 **摘要输入 ≈ 被压区间** 的成本口径 | 上游 `index.ts` ＋ `argszero` ＋ `handoff-compaction` |
| 7 | 判据"摘要含可验证 nonce" | **补"判据要区分三种结局"**（没触发 ／ 截断 ／ 完好） | D 簇 5 件独立实现的坑 ＋ 官方失败政策 |
| 8 | — | **新增**：`package.json#dsh.bundle.patch` 是官方安装契约；`npm latest` 指向 `0.0.1-rc.x` 的安装陷阱 | 上游 `plugin.ts` ＋ npm 注册表 |

### ⑤ 诚实边界

- **实读源码 6 件**：`aerince`（`index.js`＋`lib.js` 全读）／`headroom`（`lib/index.js` 关键段＋`package.json`＋清单）／`handoff-compaction`（README ＋ `package.json`）／`compaction-zh`（README）／`argszero`（README）／`dsh-context`（`docs/compatibility.md` ＋ `package.json`）。**其余候选一件源码未读**（全 🟡）。
- **未做**：目录站注册表矩阵；GitHub **code** search（需认证）；Issues ／ CHANGELOG 检索；**未装 ／ 未跑 ／ 未在任何环境实测**任何候选件（§3.0 纪律）。
- C 组候选的"命中／分档"是**按 GitHub description 粗判**，**不是阅读结论** ⇒ **深读时必须重判**。
- 全部结论分属**两条互不可推的通道**：轮 1 = **本地 Bash ＋ 内置搜索工具**；轮 2 = **GitHub REST（未认证）＋ npm registry ＋ git 浅克隆**。
- **一处未实测的存疑**：`headroom` 的 `engines.dsh` 范围是否在 npm semver 的 prerelease 规则下成立（未实测，标待核）。
- **一处第三方自述与实测不一致**：`handoff-compaction` README 称 `0.1.5-rc.2` 是 npm `latest`，而注册表实测 `latest = 0.1.5-rc.3` ⇒ 以实测为准。

## 🔀 DSH-3.4-R 融合轮（2026-09-28）：吸收三方方法（非结论）＋ 据此实做

> **授权**：老大 2026-09-28 ——「参考 Trae ／ Claude ／ Qoder 的报告，**吸收他们的方法、路径**，对你自己的报告作出你认为有必要的调整；**并非简单吸取、整合结论**」；**梯子已开**。
> **通道四元组（本段全部结论的适用范围）**：本机（Windows）／ bash(MSYS) ＋ **Windows node v24.14.1**（`D:\App\node`）／ 用户级（无提权）／ **socks5 代理在跑**。
> ⚠️ 老大三条口径（2026-09-23）已读并遵守：预算 5000 万 ／ **版本锚定降为观察** ／ 他方交付取当下状态 ⇒ 本段**不做版本考古**。
> ⛔ 本段**只动本文件**；对旧报告的订正**不重写历史行**，集中登记于 §③，供汇总取**当下状态**。

### ① 吸收清单（别人的**方法/路径** → 我的采纳）

| # | 来源 | 方法 ／ 路径（不是结论） | 我的采纳 |
|---|---|---|---|
| **M1** | **Trae** A1 | **名录是「发现通道」、不是「判定通道」** ⇒ G1／G2 只对**已落位件**判定；未落位条目归线索并**显式标「未判」**，不塞进 D 档 | ✅ 采纳为口径：本段把「名录条目」与「落位件」分开记（§②‑5 只报分布，不判档） |
| **M2** | **Trae** A5 ／ **Claude** M1 ／ **Qoder** M4 | **不抄声明、实跑 `semver.satisfies()`**；`default` 与 `includePrerelease` **两栏并列**；加**反向对照** | ✅ **实做**（§②‑1）—— 我前两轮**完全没做**，只查了 dist-tag 与版本梯 |
| **M3** | **Trae** C7 | **「扫描落点」要实测**（他给出"compaction 件集中在 Development & Runtime"） | ⚠️ **实做后与他相反**（§②‑5）⇒ **记矛盾、不替他圆** |
| **M4** | **Trae** A6 ／ **Qoder** M5 | 通道坑：bash 长命令**吃引号** ／ PowerShell 管道**毁二进制** ／ `cmd \| tail && echo OK` **假 OK** | 📝 登记（本路沿用"裸命令 ＋ 不接管道"；本轮**引号坑自己又踩一次**，见 §④‑1） |
| **M5** | **Claude** ②‑1 | **「方言断代」用上游双 tag 各读一次**（比第三方注释硬） | ✅ 已核（§②‑3 顺带复核其硬约束，**整段读**） |
| **M6** | **Claude** ②‑2 | **「脱节」与「歧义」必须分开写**；所有 `true` 也一律标**声明级** | ✅ 采纳为措辞纪律（§③‑0） |
| **M7** | **Claude** ②‑5 ／ **Qoder** ②‑5 | **「现成可用」须过运行期 API 核对**（对回锚版上游） | ✅ **实做**（§②‑8）—— 我 B 组对 `aerince` 的引用须补 ⚠️ |
| **M8** | **Claude** ③‑1 ／ **Qoder** M10 | 判据分「**四问 ＋ 三结局**」：① 是否触发 ② 摘要是否被截 ③ 是否完好 | ✅ 采纳 ＋ **我实做后进一步精确化**（§②‑2：官方对「被截」是**抛错**而非静默） |
| **M9** | **Claude** ③‑3 ／ **Qoder** M11 | 「原文可取」**三态**：留 surface ／ 可回取 ／ 仅 append-only log ⇒ 判据须**写死「近文」= ①** | ✅ 采纳（§③‑3） |
| **M10** | **Qoder** ②‑1 | **落位门槛 ＋ 名额上限**写进检索账（可复核、可被否决） | ✅ 采纳：本段自定**实做门槛**＝「有一条可复算的判据增量才做」（§② 共 9 项，各给命令／脚本可复跑） |
| **M11** | **Qoder** ②‑4 | **引用逐条复核**（拿同一份源码核数字） | ✅ **实做**（§②‑4：抓出我自己的行号错） |
| **M12** | **Trae** 2‑b ／ **Qoder** M6 | **许可红线逐件核**（读 LICENSE **实体**，不只看 `package.json` 字段） | ✅ **实做**（§②‑6：本地 13 件全核 ＋ 独立复核 1 件 GPL） |
| **M13** | **Trae** §2‑b（机械核） | **测试密度 ＝ 可抄性的代理指标**（spec 文件数／行数） | 📝 采纳为登记列（本段不重扫） |
| **M14** | **Claude** ④‑4 | 本地通道坑：MSYS `$HOME` 喂 Windows node ⇒ `MODULE_NOT_FOUND` | ✅ 采纳（本路 semver 脚本改用 `C:/…` 写法） |

**⛔ 我明确不吸收的**：三方的**候选结论、分档与订正**（旧报告已提交，结论区不追改）；**版本矩阵深挖**（老大口径）。⇒ 本段只吸收**做事的办法**，不搬运**做出来的答案**。

### ② 据此实做（可复算 · 只读）

**②‑1 ⭐ semver 实跑（第四跑；这是我前两轮**最大的方法缺口**）**

- 通道：`D:\App\node\node.exe`（**v24.14.1**）＋ `semver@7.8.5`（**两处 home 各一份**：`~/.dsh` ／ `.dsh-home`）。脚本 `D:\Temp\_wbverify\34ref\semver-wb.cjs`（可复跑）。锚 = `0.1.5-rc.2`；**两处 home 结果逐格一致** ⇒ 通道内部一致。

| 声明范围 | default | incl | 类 |
|---|---|---|---|
| `^0.1.0-rc.6`（cacheaware ／ instant ／ context-lens） | false | **true** | 预发布歧义 |
| `*`（pro） | false | true | 与「读不出」同档 |
| `>=0.0.1-rc.5`（Trae 样本） | false | true | 预发布歧义 |
| **`>=0.0.1-rc.5 <0.1.0 \|\| >=0.1.0-rc.1 <0.2.0-0`（★ 争议串）** | **false** | **true** | 预发布歧义 |
| `^0.1.5-rc.2`（handoff-compaction） | **true** | true | **正锚** |
| `>=0.1.5-alpha.1 <0.1.6-0`（billion-context） | **true** | true | **正锚** |
| `>=0.1.5-rc.2`（dsh-dcp，**09-23 时点**） | true | true | ⚠️ 见 §②‑7（**09-28 已变**） |
| `>=0.1.7-alpha.1`（force-compact） | false | false | **真脱节** |
| `^0.1.7-alpha.2`（argp） | false | false | **真脱节** |

- **反向对照（边界全对）**：`^0.1.0-rc.6` ∋ `0.1.0-rc.6` ✓ ／ `0.1.9` ✓ ／ `0.2.0` ✗ ／ `0.0.9` ✗；`^0.1.5-rc.2` ∋ `0.1.5` ✓ ／ `0.1.5-rc.9` ✓ ／ `0.1.4` ✗ ／ `0.2.0` ✗
- ⚠️ **争议串**（Trae 记 `incl=false`；Claude ＋ Qoder 记 `incl=true`）—— **我这是第四跑**：结果 **`default=false` ／ `includePrerelease=true`**（两份 semver 各跑一次，均同）⇒ **与 Claude ／ Qoder 一致，与 Trae 相反**。
- ⭐ **本跑的新增量：姿势分解**（前两方未做）。同一串、同一 semver，**9 种姿势**全测：

| 姿势 | 结果 |
|---|---|
| `satisfies(V,R)` | false |
| `satisfies(V,R,{includePrerelease:true})` | **true** |
| `satisfies(V,R,{includePrerelease:false})` | false |
| `satisfies(R,V)`（**参数反序**） | **false** ← ⭐ |
| `Range(R).test(V)` | false |
| `Range(R,{includePrerelease:true}).test(V)` | **true** |
| `Range(R).set[i].test(V)` ×3 | ERR（`set[i]` 非函数） |

⇒ **能解释「同串异果」的一条路径**：`includePrerelease` 的取值**只由 options 决定，不传即 false**；而 `satisfies()` 的**参数顺序写反**会得到**看似合理的 false**（且不抛错）。⛔ **但这是"可能性"，不是对 Trae 的断言**（红线③：摆矛盾、不裁决）。⇒ **汇总口径**：`default` 三方一致（false）；`includePrerelease` 记 **3:1**，**请 Trae 按其实际姿势自查**。

**②‑2 ⭐⭐ 摘要截断的失败语义 —— 订正我自己的表述**

我轮 2 §③‑9 写「判据必须能区分三种结局：① 没触发 ② 压了但摘要被截 ③ 压了且摘要完好」——**表述含糊**，易被读成「**被截的摘要会被静默注入**」。**实读上游后订正**：

- `compaction-basic/src/summarizer.ts:191-207`：`finishError(finish)` —— **`finish.kind === 'max-tokens'` ⇒ 抛 `Error('summarization truncated at the token cap (incomplete checkpoint)')`，`code = 'MAX_TOKENS'`**；`'aborted'` ／ `'error'` 亦抛（带 provider 的 code）；其余返回 `undefined`。
- 调用点 `:162`：`const error = finishError(assembler.finish)` ⇒ 有错即抛。
- ⇒ **官方对「被截」是 fail-closed：抛错 ⇒ 压缩失败（不缩、不丢），而不是"注入半截摘要"**（与 **Trae** 的独立结论一致）。
- ⚠️ **但「三种结局」依然成立、且更有必要**：因为（i）**失败态在 surface 上与"没触发"同形**（官方政策：摘要失败**保留最新 durable surface**）⇒ 只能靠**事件侧**分；（ii）该检测**依赖 `assembler.finish.kind`**，即**依赖 provider 如实上报 `max-tokens`**；若提供方不上报，这条 fail-closed **不成立**（⇒ 那才是"静默半截"的可能路径，**未实测**）。
- ⭐ **由此得到可写进判据的观测点**：`compaction/summary` 事件带不带 `rawOutput` ＋ 其 `usage`（写点 `region.ts:469-474,488`）⇒ 是"摘要完好性"的现成判据素材（**与 Claude 指出的 `hasRawOutput` 素材同源，我独立核到上游写点**）。
- ⭐ **社区 D 簇（5 件修 `reasoning → maxTokens`）的正确读法**：它们修的不是"防静默截断"，而是**防这类失败频发**（thinking 的 hidden reasoning 吃 `maxTokens` ⇒ 常触发上面的抛错）⇒ **与官方 fail-closed 不矛盾**。

**②‑3 `isReplaceOp` 硬约束复核（吸收 Claude ②‑1 的「读函数体不用定长窗口」）**

- `packages/core/session/src/surface.ts:229-240`（**整段读**）：首行 **`Object.keys(op).length === 3`** ＋ `hasOwn('op'|'startSeq'|'endSeq')` ＋ `op['op']==='replace'` ＋ 两个 `isEventSeq`。⇒ **Claude 的硬约束成立** 🟢
- ⇒ **对我方实现的硬约束**：replace surfaceOp **恰好三个键**，**多一个即运行期抛错** ⇒ ⛔ **不得往里塞调试字段**。

**②‑4 `preserveRecent` 行号订正（吸收 Qoder ②‑4 的「引用逐条复核」）**

- 我报告 B 组写「`preserveRecent` 默认 **2** = surface 节点数（`lib.js:126`）」⇒ **文件名错**。
- 实测（`grep -n preserveRecent`）：**`index.js:23`（schema 默认值）／`:126`（卡尾计算）／`:128`（抛错文案）／`:289`（回读）**；**`lib.js` 中出现 0 次**。⇒ **订正为 `index.js:23/126/128/289`**（与 Claude ／ Qoder 独立复核一致）。

**②‑5 ⭐ 名录落点与计数口径实测（吸收 Trae C7 的「扫描落点要实测」，但结论与他相反）**

- 方法：`ref/awesome-dsh-plugin.md`（**3,199 条条目**）—— 逐条取「所属分类」（按 `### ` 边界）＋ 关键词命中。脚本 `D:\Temp\_wbverify\34ref\catstat.py`（可复跑）。
- **口径声明**（必须写清，否则数不可比）：**宽口径** ＝ 条目描述含 `compaction|compact|prune|summar`（大小写不敏感）；**紧口径** ＝ 再排除 UI 噪音（`context menu` ／ `compact mode|panel|…`）。
- 结果（**宽 134 ／ 紧 132**）：

| 分类 | 紧命中 |
|---|---|
| **Sessions & Messages** | **26** ← 最多 |
| UI Enhancements | 22 |
| **Memory** | **22** |
| **Usage & Billing** | **13** |
| **Tools & Capabilities** | **11** |
| Vision & Multimodal | 7 |
| Workflow & Automation ／ **Development & Runtime** | 4 ／ **4** |
| 其余 9 类 | 各 1–3 |

- ⚠️ **与 Trae C7 相反**：他写「真正有 compaction 相关件的**不在** `Sessions & Messages` ／ `Memory`，而主要落在 **`Development & Runtime`（2705+）** 与 `Usage & Billing` 一带（compaction 相关条目集中在 **1040–1530** 区间）」——⚠️ 该句**自身不自洽**（`Development & Runtime` 起点是 **2705**，不含 1040–1530）。**实测：`Sessions & Messages`(26) ／ `Memory`(22) 恰是最多的两处**；`Development & Runtime` 仅 **4** 条。
- ⇒ **我自己的旧表述也不完整**：轮 1 只写「落点 = `Sessions & Messages`(1061) ／ `Memory`(1265)」——**方向对，但漏了两个大头**（`UI Enhancements` 22 ／ `Usage & Billing` 13）。**订正为四类为主**。
- **计数口径订正**：轮 1 我报「宽扫 8 词 ⇒ **458 条**」，**口径未写明**（Trae 记 `context` 单词 = 155 行；二者**不可比**）。⇒ 本段给出**口径明确**的数：**4 词命中条目 = 134（紧 132）**。⛔ **旧的 458 不可再引用**（口径不明）。

**②‑6 许可红线独立复核（吸收 Trae ／ Qoder 的「逐件核」）**

- **本地 13 件全核**（`ref/community/`）：**MIT ×10 ／ Apache-2.0 ×2**（`PerryLink/dsh-reach` ／ `giter00/dsh-headroom`）／ **字段空但有 `LICENSE` ×1**（`lifeodyssey/dsh-compressor`，Qoder 记其为 MIT（插件）＋ Apache-2.0（crates）子包形态）⇒ **本地无 GPL 红线**。
- **独立复核 Trae 报的 GPL 件** `ljsysfurryACE/dsh-compaction`（clone 到**仓外** `…\34ref\clone`）：
  - ✅ **GPL-3.0 成立**：`LICENSE` 首行 `GNU GENERAL PUBLIC LICENSE Version 3` ＋ `README §License` 明写 `GPL-3.0 © Cloud LTE Studio / AgentFrame` ＋ `package.json.license = GPL-3.0`。
  - ⚠️ **但订正 Trae 一处**：他记「**仓根无 LICENSE 文件**」—— **实测仓根有 `LICENSE`，且内容即 GPL-3.0**。⇒ 结论（GPL 红线）**不变**，**依据那一条不成立**。
  - ⇒ 对我方：思路可读、**代码不可抄**（传染性）——与 Trae 结论一致。

**②‑7 ⭐ `fan56/dsh-dcp` 的时间窗变化 —— 一条「取当下状态」的活样本**

- **Trae（09-23**，HEAD `04dc4690`）记它 peer = **`>=0.1.5-rc.2`** ⇒ 「**正锚我方版本**」，A 档。
- **我（09-28**，HEAD `c946d8f`，**09-24 提交**）实测：**全部 peer = `>=0.1.7-rc.1`**（`dsh-agent` ／ `dsh-compaction` ／ `dsh-compaction-basic` 等 12 个包）；README 首行改「**要求 dsh >= 0.1.7-rc.1**…不再支持 alpha 线」；`CHANGELOG` 明写「**dsh 0.1.7-rc.1 adaptation — dependency floor raised to `>=0.1.7-rc.1`**」。
- ⇒ **该件在 5 天内把 floor 从 0.1.5-rc.2 抬到 0.1.7-rc.1** ⇒ Trae 的「正锚我方版本」**在当下已不成立**（现在**高于**我方可选池）。
- ⇒ ⭐ **这正是老大「取当下状态、不管改了几次」口径的活样本**：两个结论**各自在其时点都正确**，冲突只来自时间窗。**汇总以当下状态记，并保留时点。**
- ✅ **Trae 的另一条声称独立成立**：`lib/index.js:109 export class DcpEngine extends BasicCompactionEngine` ＋ `:9` 注释「`summarize()` is the sole…hook」⇒ **"只覆写 `summarize()` ＋ 全继承"的教科书样本成立** 🟢。

**②‑8 ⭐ `session.events` 的失效形态（复核他方 ＋ 三点增量 ＋ 收窄一处）**

- **背景**：Qoder 报 `gendui123/dsh-compaction-probe` 写 `session.events?.[seq]` ⇒ 锚版恒 `undefined` ⇒ 装置恒红。Claude 复核后另称「`session.deriveEventMessage?.()` 也失效 ⇒ **双重失效**」；Qoder 反驳「`Session` **有**实例方法 `deriveEventMessage` ⇒ 实为**单点失效**」。
- **我独立核（对回锚版上游，整段读）**：
  - `packages/core/session/src/index.ts`：`eventsSnapshot` 是 **`private`**（`:614`）；公开面 = **`eventAt(seq)`**(`:621`) ／ **`snapshotEvents()`**(`:633`) ／ **`ownEvents()`**(`:648`)。
  - **全仓 `get events` 仅一处** ＝ `packages/session-query/session-query/src/observation.ts:291`（**`SessionObservation`**，另一个类型、另一条通道）⇒ **`Session` 类无 `events` 成员** ✓（与 Qoder 一致）。
  - **`deriveEventMessage`：`Session` 确实有实例方法**（`index.ts:854-855`，注释 `:849`「Instance face of the pure per-node `deriveEventMessage` export from `surface.ts`」）⇒ **Qoder 对；Claude 的「双重失效」应**收窄为单点**（仅 `session.events`）。
  - ⭐ **我另补一条他方未提**：`Session` **有 `get surface()`**（`index.ts:452`）⇒ `aerince` 的 `session.surface.nodes` **无问题**。
- ⭐ **我的三点增量**：
  1. **失效形态是「混合」而非单一**：`aerince` **≥7 处**读 `session.events` —— `for (const event of session.events)`（`:58`，`listCheckpoints`）⇒ **`TypeError`（显式失败）**；`[...session.events]`（`:137/138/142`，`findSummary`）⇒ **`TypeError`**；而 `session.events[seq]`（`:73/134/153`）⇒ **静默 `undefined`**；`searchEvents(session.events, …)`（`:277`，`acp_search` 工具）⇒ 取决于实现。⇒ **同一件里"有的路径抛、有的路径静默"**，**不能用一句话概括**。
  2. **影响面比他方记的宽**：`listCheckpoints`（`acp_status` 用）与 **`acp_search` 工具** 也在其中 ⇒ 不止"恢复工具路径"。
  3. **一条反向边界**：既然 `SessionObservation` **有** `get events()`，则**若运行时 `agent.session` 被投射为观察对象／别的形态**，上述判定不成立 ⇒ 我的判定**与 Claude ／ Qoder 同为源码级 🟠，不是实跑结论**。
- ⇒ **对我报告的直接影响**：B 组 `aerince` 行**须补 ⚠️**（"多处路径读 `session.events`，锚版无该成员 ⇒ 疑似失效，🟠 未实跑"）。**该行其余引用（`compactRegion` 调用 ／ `installSummaryHook` ／ `isCheckpointEvent` ／ `preserveRecent`）不受影响、仍成立**（Claude ／ Qoder 逐条复核一致）。

**②‑9 `headroomTokens` 待核项闭环**

- 我轮 2 §③‑2 记：`argszero` 称 `headroomTokens` 默认 **65,536**，**我在锚版全仓 grep 不到** ⇒ 标「属其他版本线，**不得外推**」。
- ✅ **本轮闭环**：`fan56/dsh-dcp` 的 README 表格明写 —— **`headroomTokens` ｜ 65536 ｜ 继承上游 `compaction-basic`（「0.1.7 新增」）**；其 CHANGELOG 亦记「compaction-basic 0.1.7 的 new pressure key（非负整数，默认 65536…）」。
- ⇒ **我轮 2 的判断正确**（该字段确非 rc.2 所有），且**得到了成因**（**0.1.7 新增**）。⚠️ 依据是**第三方 README**（🟡）——但与我方"全仓 grep 无"的**负向实测**方向一致 ⇒ 可作**闭环**，⛔ **不可作锚版行为依据**。

### ③ 对我报告的调整清单（汇总请以此为准）

| # | 旧稿（本文件原报告 ／ 轮 2） | 现调整为 | 依据 |
|---|---|---|---|
| **1** | B 组 `aerince` 行「`preserveRecent` 默认 2 = surface 节点数（`lib.js:126`）」 | **`index.js:23/126/128/289`**（`lib.js` 无此标识符） | §②‑4 实测 |
| **2** | §③‑9「三种结局」（易读成"被截的摘要被静默注入"） | **官方对「被截」是 fail-closed 抛 `MAX_TOKENS`**；三结局**仍须分**（失败态与"没触发"在 surface 上同形）；判据素材 = `summary` 事件的 `rawOutput` ＋ `usage` | §②‑2 上游 `summarizer.ts:191-207` |
| **3** | 轮 1「名录落点 = `Sessions & Messages`(1061) ／ `Memory`(1265)」 | **四类为主**：`Sessions & Messages`(26) ／ `UI Enhancements`(22) ／ `Memory`(22) ／ `Usage & Billing`(13)；`Development & Runtime` 仅 4 | §②‑5 实测 |
| **4** | 轮 1「宽扫 8 词 ⇒ 458 条」（**口径未写明**） | **作废、不可再引用**；改用口径明确的 **「4 词命中条目 = 134（紧 132）」** | §②‑5 |
| **5** | 轮 1 §②「名录**无** compaction 专类」 | **保留**（分类为 `###` 命名，确无 compaction 专类）；**分布**以上表为准 | §②‑5 |
| **6** | 轮 2 §③‑2「`headroomTokens` 属其他版本线（待核）」 | **闭环**：是 `compaction-basic` **0.1.7 新增**字段 ⇒ rc.2 无此字段（判断正确，成因已补） | §②‑9 |
| **7** | B 组 `aerince` 行（**仅加 ⚠️，不删原结论**） | 补：「≥7 处读 `session.events`，锚版 `Session` 无该成员 ⇒ 疑似失效（🟠 未实跑）；形态混合（抛／静默）」 | §②‑8 |
| **8** | — | **新增硬约束**：replace `surfaceOp` **恰好三键**（多一即抛）⇒ 不得加调试字段 | §②‑3 `surface.ts:229-240` |
| **9** | — | **新增「三态 ＋ 三把尺 ＋ 措辞纪律」**（见 §③‑0 ／ §③‑3） | M8 ／ M9 ／ M6 |

**③‑0 措辞纪律（M6）**：兼容性结论**一律标「声明级」**（含 `true` 者），⛔ 不写"可用／可作产品依赖"；`default` 与 `includePrerelease` **两栏并列**；**「真脱节」与「预发布歧义」分开写**。

**③‑3 三把尺（保留语义，判据须标尺）**：`retainRatio`（**token 比例**，0.16）／ `retainTokens`（**绝对 token 值**，与前者互斥）／ `preserveRecent`（**surface 节点数**，`aerince` 默认 2）。⛔ 判据写"保留 N 条"**必须注明用哪把尺**；且**实测值 ≠ 配置的线性结果**（还要经 tool-pairing 向头部取整）。

### ④ 通道／方法级陷阱登记（供下轮与汇总）

1. ⚠️ **本路本轮自己踩的**：一条含**内嵌双引号**的 Bash 命令被**工具层判为引号未闭合**而整体失败（`unexpected EOF while looking for matching '"'`）⇒ 与 Trae 记的"bash 吃引号"**同族**。**处置**：内嵌 `"` 改单引号包裹，或写成脚本文件。
2. **`| tail && echo OK` 假 OK**（Trae ／ Qoder 记；本路轮 2 亦踩过 —— `leesama/dsh-compact` 那次 SSL 失败仍打印 OK）⇒ **判成败看产物（`.git` 是否存在），不看管道回显**。
3. **MSYS `$HOME` 喂 Windows node ⇒ `MODULE_NOT_FOUND`**（Claude 记）⇒ 用 `C:/…` 直写（本路 semver 脚本已照此）。
4. **读函数体不得用定长窗口 `-A6`**（Claude 自曝）⇒ 本路复核 `isReplaceOp` 时**整段读**，一次到位。
5. **`grep` 含双引号的模式串在 Bash 工具里是高风险写法** ⇒ 用单引号，或改脚本。

### ⑤ 本段诚实边界

- 本段**只吸收方法、不搬运结论**；三方的候选表与分档**我未重写**（旧报告已提交，结论区不追改）。
- **实做 9 项**：semver ／ 截断语义 ／ `isReplaceOp` ／ `preserveRecent` ／ 名录落点 ／ 许可核 ／ `dsh-dcp` 时间窗 ／ `session.events` ／ `headroomTokens`。**其余为阅读与登记。**
- **仍未装、未跑、未在任何环境实测**任何候选件（§3.0 纪律）；`session.events` 与 `probe` 的判定均为**源码级 🟠**，⛔ 不是实跑结论。
- **新克隆 2 件**到**仓外**（`D:\Temp\_wbverify\34ref\clone`）：`ljsysfurryACE/dsh-compaction` ／ `fan56/dsh-dcp` —— ⛔ **未进 `ref/`、未入仓**。
- 通道四元组见本段抬头；⛔ 不可外推。
- 本段**未读** `log-other.md`（任务已由老大取消）／ `log-marvis.md`（已于 2026-09-29 随 Marvis 退出项目删除）／ `log_design.md`。

## ⏳ 未结项（待老大采纳）

1. **派发稿「原文不得后处理」条款需改口径**（2026-09-20 复验判定 §2.3）—— 现口径（`J7`）写「原文原样落盘（含编码）；⛔ 禁…把本地化文字英文化」，但 **DSH 的 pwsh 工具自带编码前导码**，该形态在本机实测**倾向英文 ＋ UTF-8** ⇒ 对 DSH pwsh 输出而言「本地化中文原文」本就不存在 ⇒ **按现口径会每次都被判「疑似英文化」**。
   建议改为：**「⛔ 禁止人工改写／意译；工具链自身的语言与编码差异须原样保留，并注明该段取自哪条通道（原生 shell ／ DSH pwsh ／ 沙箱运行器）」**。
   同类（Claude 侧新暴露）：派发稿 §7「Key 值不得落任何文件／日志／工具输出」与 **Tier 0 红线①**（老大授权临时 Key 不受此限、不必扫）**互相矛盾** ⇒ 派发稿模板的**凭据条款**与**原文条款**建议同批修订。

## 🗂 已清理段落（按交流区规矩）

- **2026-09-29 · Marvis 退出归置**：老大裁定「Marvis 正式退出本项目」（① 文件删除 ② 未闭环提案不再保留 ③ 产品署名保留）。处置：① 删除 `exchange/log-marvis.md` —— 内容已于此前全部承接（P4.35 界面基调初稿 → `docs/ui-reference.md` §0–§5；时间对齐提案 → `exchange/discussion-time-context.md`；ai-governance 四条修正／两次复盘看法／归档幂等评审 → 各自落点）；② 唯一未闭环的「名词解释／规范用语」提案随文件终止（老大：直接删，不另留待议位）；③ 全库引用修补 9 处（`README.md` 名单、`docs/ui-reference.md` 受众、`docs/ai-governance.md` §3、`exchange/README.md` 索引、`discussion-time-context.md` ×5、`log_design.md`）；④ 产品「关于」弹窗署名**保留**（署名记贡献、非在职状态）。⛔ 未动：`archive/` 与 `docs/dsh/dsh-migration.md` 的历史采纳留痕、`backend/tests/test_archive.py` 注释、`HUMAN.md`／`HUMAN_NOTE.md`（人类治理区）。回溯：`git log -p -- exchange/log-marvis.md`。
- **2026-09-28 清理**：未结项原第 2 条《Qoder repo 级 git 钩子致「提交」看似失败》**已闭环翻篇** —— 证据双侧：**老大查明 Qoder 侧更新已修复／调整该行为** ＋ **WB 复现确认不再触发**（2026-09-28 本轮及上一轮 `git commit` 均 `exit 0`、无 `PROGRAM BLOCKED`）。⇒ 该隐患不再挂起。**通用纪律保留**：本仓判 `git commit` 成败一律看 `git log -1` ＋ `git status`，**不看退出码**（工具层故障会伪装成提交失败；与「回收站 API 退出码不可采信」同族）。回溯：`git log -p -- exchange/log-workbuddy.md`（`e6f3b04`／`36d4962`）。
- **2026-09-23 清理**：未结项第 2 条《CVM 沙箱降档是否接受》**已裁（老大：接受降档）** ⇒ 回填 `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 前置核查实测回填〉④（含两处归因修正）＋ `TODO.md` DSH-3.5 段。
- **2026-09-22 清理**：删除三段已闭环复验记录（《Qoder 两报告复验》／《DSH-3.8.1 复验》／《DSH-3.8.2 复验》）—— 复验结论已各自回填（3.8.1 ／ 3.8.2 → `TODO.md` 3.8 段；3.7.5 → `TODO.md`「DSH-3.7.5」段末「WB 复验判定」）。回溯：`git log -p -- exchange/log-workbuddy.md`。

---
