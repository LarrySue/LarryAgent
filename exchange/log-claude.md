# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T·P** | Claude | **CVM（Linux）** | ✅ **已复核（WB 2026-09-21）** —— 三问**全成立**（WB **独立取物证**：装置三件 sha 现场逐位一致 ／ 交付件双侧一致 ／ 残留全清 ／ **Windows 侧回归由 WB 现场独立复跑，三方逐字段比对仅 3 处预期差异**）；**3 处订正**（件数 13→11 ／ CVM 侧文件名 `-posix.mjs` ／ 交办项落点应为 `production-env.md` 且「RemoveIPC」归因**未复现**）⇒ **判定 ／ 三处订正已承接**（原「🔍 WB 复核订正」节已按交流区规矩清理）｜ 落点 = `TODO.md`「DSH-3.7.4-T」段 ＋ `archive/roadmap-history.md`；回溯 `git log -p -- exchange/log-claude.md` ｜⚠️ 结论**取自 `917f45d` 版树**（⛔ 不得当"当前版本"外推） | 2026-09-20 |
| **DSH-3.4-R** | Claude | 本机（联网检索 · 只读参考） | ✅ **已交付（2026-09-23）** —— 报告见本文件 `## 📊 DSH-3.4-R 调研报告`；**已按授权调整流程 3 处**（不重复扫名录 ／ 主攻 WB 标"未读"的官方 spec ＋ 社区源码 ／ T5 挖到底），理由与具体改动见报告 §0-B；⚠️ **同时暴露规格的结构性问题**（WB 报告内嵌规格 §12 ⇒ 五方独立性在流程上不成立）**待裁**，见报告 §0-A。**➕ 当晚梯子开启后已出补充段**（同文件 `## 🔁 DSH-3.4-R 补充调研`）：5 件社区件**全部 clone 成功并实读源码**（🟡→🟢，全 MIT）⇒ 含 **3 处订正 ＋ 3 处升级**（⚠️ clone 失败归因**订正为"梯子未开"**，原"打掉规格 §8"撤回 ／ `fast-compaction-dsh` **补 ⛔ 外呼风险标注** ／ `isCompactCheckpointSource` 判为**必要不充分**）；**汇总请以补充段为准** | 2026-09-23 |

- 已完成并复验（各段已按交流区规矩清理；3.0.x 系列与 DSH-2 系列均已在 `TODO.md` 承接）：**3.7.3-T ✅（WB 复核：T1–T4 四项判定均成立，另补 1 条更强的 ＋ 记我方派稿缺陷 1 处）** ／ **3.7.4-T ✅（WB 复核：`T-1` 独立复跑逐条一致 ＋ `T-2` 三方字段比对一致；2 处差异均**非断言项**）**。
- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3.7.4-T」段**；本区只放**怎么做**。⚠️ 需回溯时用 `git log -p -- exchange/log-claude.md`。
- ⚠️ **通用纪律**：
  1. **报告须注明通道** —— 同一台机器上，不同工具树 ／ 不同 shell 会话会给出**不同 node 版本**与不同文件系统视图 ⇒ 结论不可跨通道互推（"Bash 通道"这种写法对别人而言是**另一条**）。
  2. **"没有 ／ 不存在"须附检索式与遍历范围**，否则不可验、等于没回答。
  3. **自曝优于好看**：口径错 ／ 跑歪 ／ 覆盖了证据，都直接写。
  4. **未观测到的行为不得写成已证**（"可达但未观测"要标清；"构造成立"要标为构造）。
  5. **应红 ／ 应绿须逐件读源码定期望**，不得按"组"给口径（同一批哨兵里可能有**落绿才是绿**的件）。
  6. **收尾必核 `git status`**。

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

- **建议侧重（非强制、不构成分工）**：你是测试方 ⇒ 可优先把 **T5（怎么验）** 与候选表「**它怎么验的**」一列挖到底；其余按规格走。不要求你猜别人扫了什么。

---

## 📊 DSH-3.4-R 调研报告（Claude · 2026-09-23）

> 按规格 §4 三段格式（检索账 ／ 候选表 ／ 评论）＋ **本路流程调整说明**（承老大 2026-09-23 授权："认为派发不合理可调整流程，但必须写明理由与改成了什么"）。

### ⚠️ 0-A · 先暴露一个结构性问题：**规格文件内嵌了 WB 的报告，五方独立性已被破坏**

- **事实**：`docs/dsh/dsh-34-ref-research.md` §12 = **WB 侧完整报告**（候选表 ／ 评论 ／ 版本脱节判断），而规格首行又要求五方「逐条照它执行」。
- **后果**：**任何按规格执行的一方都会先读到 WB 的候选表与结论** ⇒ §10「五方互不影响」在**流程上不成立**。我如此，Trae ／ Qoder ／ Other 只要读规格亦然。
- **我的处置（⛔ 未擅自改规格 —— `docs` 是我的只读区）**：① 如实声明本路已被污染；② 把定位从"第三方独立扫描"改为「**对 WB 未覆盖层的独立深挖**」（官方测试件 ＋ 社区源码），该定位下污染影响最小；③ 下述"新增候选"是**显式对照 §12 B 组后确认其未列**的。
- ⇒ **是否调整纪律（如把 §12 移出规格文件、或后续派发改为"规格 ／ 报告分文件"）请老大 ／ WB 裁。**

### ⚠️ 0-B · 本路流程调整（老大授权项 · 逐条写明改了什么与为什么）

| # | 原派发 | **改成** | 理由 |
|---|---|---|---|
| 1 | 五方各自"广撒网"扫名录 | **不重复扫名录**，改为主攻 **WB 标"未读"的两块**：① 官方 11 个 spec（5,371 行）② 社区件源码 | (a) 受 0-A 污染，我再扫一遍**不是独立通道**，对照价值已失效；(b) WB 已扫到 `458→75→~18` 并逐条读描述，重复无增量；(c) 规格反纪律 3 本身要求"能读源码就读源码" ⇒ **把 🟡 升 🟢 才是增量** |
| 2 | 候选表以 README 级为主 | 官方件**全部实读源码**；社区件**尽力实读** | 同上 |
| 3 | （建议侧重）T5 | **T5 挖到底**（与上两条天然同向） | 采纳派发建议 |

**调整 2 只做到一半（如实降级）**：社区件**源码一件都没读到** —— 通道不可达（见 ① 检索账 #3/#4）。⇒ 社区部分**一律 🟡**，⛔ 不冒充 🟢、不混入结论区。

### ① 检索账（可复算）

| # | 通道 | 动作 ／ 检索式 | 时间 | 扫描量 ／ 结果 |
|---|---|---|---|---|
| 1 | **本地 · 上游裸仓** `ref/dsh-bare`（tag `dsh-v0.1.5-rc.2`，**已实测 tag 存在 ＋ 裸仓属实**） | `git ls-tree -r packages/compaction/`；`git show <tag>:<path>` 读 **3 个 spec 全文**（`compaction.spec.ts` 171 ／ `invariant.spec.ts` 469 ／ `tool-pairing.spec.ts` 417 行）；其余 8 个 spec 抓**全部测试标题**（≈100 条）；定点读 `compaction-basic.spec.ts:755-800` 正文 | 2026-09-23 | compaction 家族 28 件 ／ **11 个 spec ／ 5,371 行** |
| 2 | **本地 · 官方包目录** | `ls -d ~/.dsh/profiles/sdk/node_modules/@deepseek-ai/*compaction*` | 同上 | **3 件在位**（basic ／ tool-result-pruner ／ command-compact） |
| 3 | 联网 · `git clone` | `git -c http.proxy= -c https.proxy= clone --depth 1 <3 个社区件>`（已 `unset` 代理 env） | 同上 | **✗ 三件全失败**：`Failed to connect to github.com port 443 after 21s`。⚠️ **形态与规格 §8 不同** —— 规格说会报 `via 127.0.0.1`（绕法=清代理）；我清代理后**仍不通、且报错里没有 `via`** ⇒ **本机对该域名是链路级不可达，不是代理配置问题** |
| 4 | 联网 · WebFetch | `github.com/aerince/…` ／ `raw.githubusercontent.com/Tyan66666/…/src/index.ts` | 同上 | **✗ 被策略拦**：`Unable to verify if domain … is safe to fetch`（**WebFetch 通道整体不可用**） |
| 5 | 联网 · WebSearch | `aerince dsh-active-context-pruning DeepSeek Harness compaction preserveRecent` | 同上 | **✓ 10 命中**（含 4 个本项目未登记的 repo）—— 但**只到转述级** |

**通道结论（⛔ 不可外推）**：本路**实读源码能力只覆盖本地件**；**联网三态 = 2 条不可用 ＋ 1 条只到转述级** ⇒ 下方 B 组全部 🟡。

### ② 候选表

#### A 组 · 官方 ／ 上游（🟢 **我方实读源码** —— 本路增量集中在此）

> ⭐ **本组的"候选"是官方自带的测试件本身** —— WB 报告标它们"本轮未读"，而它们正是 **T5「怎么验」的正本**。

| 候选 | 入口 | 锚版本 | 命中 | 档 | 借鉴点（具体到可抄什么） | 它怎么验的 | 证据 |
|---|---|---|---|---|---|---|---|
| ⭐ `dsh-compaction/tests/invariant.spec.ts`（**469 行，全文实读**） | `ref/dsh-bare:packages/compaction/compaction/tests/invariant.spec.ts` | 锚版本身 | T1 T3 T5 | **A** | ⭐⭐ **一份现成的「压缩事务合规性判据表」，可直接照抄成我方验收测试**：`it.each` **18 条负向** 全带**错误信息正则** —— `/still compacting/`（同刻只允许一个）／`/must name an earlier current surface span/`（shadow 必须指更早的当前 surface 跨度）／**`/must list every node in the current surface span/`**（被压节点必须**逐节点列全**，漏或重都拒）／`/requires one compaction\/summary/`（**end 不带 error 就必须有 summary**）／`/turn\/start cannot cross an open standalone compaction/` ／ `/turn\/end cannot cross an open compaction for turn 1/` ／ `/shadowedSeqs must be non-empty/` ／ `/compaction checkpoint id .* does not match compaction\/start id/` ／ `/no matching compaction\/start/` ／ `/checkpoint sourceCommandId must be a non-empty string/` …（共 18 条）。**正向还有 17 条**（含 standalone ／ numbered 两种 turn 归属、replay ／ `session/end-seed` 语义、companion 后加载重建 open trace） | **它自己就是测试** —— 且断言的是**错误信息正则**，即"拒绝的理由"可机读 | 🟢 |
| ⭐ `dsh-compaction/tests/tool-pairing.spec.ts`（**417 行，全文实读**） | 同上目录 | 锚版本身 | T3 T5 | **A** | ⭐⭐ **「近文保留边界是否合法」的现成机读判据**：`toolPairingBalancedBefore(session, seq)` ／ `toolPairingBalancedAfter(session, seq)` 是**公开导出**（与 `dsh-compaction` 同源）。实测语义：`after(assistant/message)`=**false**（切在此会留孤立 tool-call）／`before(tool/result)`=**false**（留孤立 result）／多个 call 时**必须全部 result 到齐**才 balanced ／ 夹在一对 open call-result **之间**的节点两侧**皆 false** ／ ⚠️ **replace 后被移除的 seq 是**抛错 `/surface seq .* not found/`（**不是返回 false**）⇒ 判据须区分"被移除"与"不平衡"两种失败 ／ 缓存语义有 `eventReads` 计数佐证（append 只折叠增量 ／ replace 才重建 ／ 同代计数回退即防御性重建） | 同上 | 🟢 |
| ⭐ `dsh-compaction/tests/compaction.spec.ts`（**171 行，全文实读**） | 同上目录 | 锚版本身 | T1 T5 | **A** | ⭐ **契约形状正本（补 WB 的 README 级描述）**：三方法签名 `compactIfNeeded(agent, trigger, signal)` ／ `compactNow(agent, signal)` ／ `compactRegion(start, end, agent, signal?)`（**前两者 signal 必填、第三者可选**）；**`CompactionTrigger` 实测取值 `'pressure'` ／ `'context-overflow'`**；**`isCompactCheckpointSource()` 是现成机读判据**（检查点 = `user/message` 且 source 匹配；对 `{kind:'plugin'}`／`{kind:'user'}` **均返 false**）⇒ **验「摘要注入」不必自造 nonce 探针**；`CompactionResult` 八字段；事务四事件顺序断言；**`surfaceOp.replace` 的 `sourceEventSeqs` 含被遮蔽 seq 本身** ⇒ 「原文仍可寻回」是 append-only 架构的固有性质 | 同上 | 🟢 |
| `dsh-compaction-basic/tests/compaction-basic.spec.ts`（2,138 行 —— **标题全抓 ＋ 定点读正文**） | 同上目录 | 锚版本身 | T3 T4 T5 T6 | **A** | ⭐ **「近文保留」切点算法的判据（可逐字抄）**：`:762`「向头部取整以保 tool-call/result 配对」——断言 = 遍历 `session.deriveMessages()`，**每个 `tool-result` 的 `toolCallId` 必须已在 `calls` 集合出现过**；`:792` 若取整会吃掉唯一工具对则**放弃压缩**；`:644` 范围从 system head **之后**起且该节点恒在 surface 位置 0；`:676` 计费**含** durable routed request envelope 但**不把它放上 surface**；`:746` 重试上限（`/still above threshold after 1 compaction attempts/`）；`:848` **prune 单独清掉压力 ⇒ 跳过 LLM 摘要**；`:1064` 摘要开始前 meter 快照变了 ⇒ 拒绝；`selectCompactableRange()` 亦是公开导出 | 同上 | 🟢 |
| `dsh-compaction-basic/tests/manual-compaction.spec.ts`（889 行 —— **标题全抓**） | 同上目录 | 锚版本身 | T4 T5 T6 | **A** | ⭐ **并发 ／ 排队 ／ 失败分类语义正本**（⚠️ 我在 A 段协议评审里记「排队后语义未定」是缺口 —— **官方在这里有答案**）：`:240` 摘要期间到达的 prompt **hold 到 standalone bracket flush**；`:345` 已有 prompt 占住下一回合 ⇒ **报 busy 而不摘要**；`:533` 摘要 continuation 结束后**重新校验所选跨度**；`:491/:513` 跨度在摘要期间被整段 ／ 中间节点替换 ⇒ **拒绝并记 error close**；`:572/:596/:658` **提交失败分类**；`:708/:740/:787` **取消语义**（pre-aborted signal 最优先；摘要也 reject 时**保原取消理由**；取消要**等 durability checkpoint** 才赢）；`:816` 手动摘要事件**保留 raw output 与 usage**；`:850` 自动与手动压缩**互斥** | 同上 | 🟢 |
| `dsh-compaction-basic/tests/compaction-loop-repro.spec.ts`（505 行 —— 标题全抓） | 同上目录 | 锚版本身 | T4 T5 | **B** | **CBR-001 真循环复现件**：`:275` 循环落下的 head checkpoint **两侧都是 balanced cut**；`:384` context-overflow 恢复**跨真循环**；`:465` overflow 与 transient 重试预算**相互独立** | 同上 | 🟢 |
| `dsh-compaction-tool-result-pruner/tests/tool-result-pruner.spec.ts`（280 行 —— 标题全抓） | 同上目录 | 锚版本身 | T2 T3 T5 | **B** | 「压了但保原文」判据：`:167` **保留全部数据并引用被替换的结果**；`:252` **重放到完全相同的 pruned model messages**；`:264` 在**真 invariants** 下跑（closed steps 之间；**回合外不跑**）；`:117` 保留头尾**且不切开代理对**；`:129` 非文本块与其相对顺序**被保留** | 同上 | 🟢 |
| `dsh-command-compact/tests/command-compact.spec.ts`（280 行 —— 标题全抓） | 同上目录 | 锚版本身 | T5 T6 | **B** | `/compact` 的注册 ／ 销毁（**Loader-safe exports**）／`draining`（`close` ＋ `flush` 后才随插件销毁落定）／**无参数** ／ 无历史与参数拒绝的直接结果 | 同上 | 🟢 |

**⚠️ A 组证据边界**：**只有前 3 件是全文实读**；后 5 件的「借鉴点」依据 = **全部测试标题 ＋ 少量定点正文**（`compaction-basic.spec.ts` 只读了 `:755-800`）。⛔ 不得读成"8 件都全文读过"。

#### B 组 · 社区（🟡 **转述级** —— 通道不可达，本轮一件源码未读）

> ⚠️ **WB 已登记的社区件我不重复**（见规格 §12② B 组）。**本表只列"新增"与"归类异议"**。

| 候选 | 入口 | 锚版本 | 命中 | 档 | 借鉴点 ／ 异议 | ⛔ 不可参考 | 证据 |
|---|---|---|---|---|---|---|---|
| **`Tyan66666/billion-context-dsh`** ⭐ **WB 未列** | `github.com/Tyan66666/billion-context-dsh`（检索命中其 `src/index.ts`） | 未见矩阵行 | T2 T3 | **B** | **CompactionEngine backend** ＝「自做 Provider」的实样（描述自述 "CompactionEngine backend with compress/decompress/search_context/acp_status tools"），且 **acp-kernel 自 `billion-context-pi`（ranxianglei）逐字移植**（"reused verbatim"）⇒ **有上游可追** | ⚠️ 未见版本矩阵 ⇒ **兼容性不能假定** | 🟡 |
| **`kolawong/fast-compaction-dsh`** ⭐ **WB 未列** | `github.com/kolawong/fast-compaction-dsh` | 未见矩阵行 | T2 T3 | **B** | ⭐ **另一条技术路线**：**Verdict 式**（keep ／ truncate ／ drop），**明确"用判定替代有损 LLM 摘要"且"保留内容逐字"** —— 移植自 `tamaratran/fast-jev-compaction`。⇒ 对 3.4 是**天然对照组**：它是"没有摘要"的路线，恰好反衬我方「摘要含可验证 nonce」判据的必要性 | ⚠️ 无摘要 ⇒ **不满足**我方判据；未见矩阵行 | 🟡 |
| **`zixin947/dsh-compact`** ⭐ **WB 未列** | `raw.githubusercontent.com/zixin947/dsh-compact/main/README.md`（检索直接命中 README） | 未核 | T2 | **C** | 仅确认存在**带 README 的独立 repo**，内容未展开 | 未核 | 🟡 |
| `snow-The/dsh-session-handoff` ⚠️ **归类异议** | `github.com/snow-The/dsh-session-handoff` | 未核 | T3 T4 | **B（我改档）** | ⚠️ **与 WB 归类有出入**：WB 归 **C 档**（"属 handoff，不属 compaction"）；但检索显示该件**同时含 acp**（"…＋ active context pruning (**acp_\* via official compaction API**)＋ optional enhancers"），且其 `acp_config` 暴露 thresholds ／ soft ／ hard limits ／ `minTokens` ／ nudge ／ `preserveRecent` ⇒ **是"handoff ＋ compaction 双功能件"，不宜只按 handoff 归档** | 混合体，借鉴须拆分；未见矩阵行 | 🟡 |

### ③ 评论（与上面的观察分开写）

1. **本批最大的"白送"是官方自带的判据表 —— 3.4 的验收判据不必自造。**
   `invariant.spec.ts` 的 18 条负向 ／ `toolPairingBalancedBefore/After` ／ `isCompactCheckpointSource` 三者合起来，已覆盖我方三条判据的**机读断言**：事务合法性 ／ **近文保留边界合法** ／ **摘要确实注入**。⇒ **建议把这三件列入必读第一梯队**（它们比任何社区件都更贴近我方判据，且**零兼容风险**——与锚版同代）。

2. **⚠️「近文原文保留」有一个具体的假绿陷阱，现有两条独立来源指向它。**
   - **我方已知**（`TODO.md:82` ／ WB）：手动 `/compact` 硬编码 `retainTokens=0` ⇒ 只留最后 1 条 ⇒ 只用它验会把「只留最后一条」**误判成立**。
   - **本路增量（🟢 实读）**：`retainTokens` 是**绝对 token 值**且测试里可**直接设定**（`:765` 用 `retainTokens: 80`）；且保留边界还要经 **tool-pairing 向头部取整**（`:762`）⇒ **"保留了几条"不是配置的线性结果**，必须**实测**。
   - ⇒ **建议判据写法（三条缺一不可）**：走**压力路径**（`thresholdRatio` 触发）并断言 ① 被保留尾部**逐字等于**压缩前对应片段 ② 该切点 `toolPairingBalanced*` 为真 ③ 摘要节点 `isCompactCheckpointSource` 为真。
     ⚠️ 只判 ③ 会漏"近文没保留"；只判 ① 会漏"摘要没注入"；不判 ② 会在边界切散工具对时**静默通过**。

3. **版本脱节判断：暂判「社区红利可用」，但覆盖面比 WB 的表述更窄。**
   - 同向证据：`aerince` 的注册表行含 `0.1.5-rc.2 ✓`（WB 已引）。
   - ⚠️ **本路新增观察**：我新找到的 `billion-context-dsh` ／ `fast-compaction-dsh` ／ `zixin947/dsh-compact` **均未见版本矩阵行** ⇒ 「社区红利可用」**只对已核过矩阵的件成立**，⛔ 不宜写成"社区整体可用"。**建议汇总时按件标注矩阵状态**。

4. **跨块复用线索（记给 3.8，⛔ 本处只记不改）**：我在 A 段协议评审提的「多端并发 prompt 排队语义未定」缺口，官方在 `manual-compaction.spec.ts` 里**有现成答案** —— 摘要期间到达的 prompt **hold 到 bracket flush**（`:240`）／已有 prompt 占住下一回合则**报 busy**（`:345`）。若 3.8 要定该语义，可直接采用。

5. **A 组的可验性优势（本路的核心判断）**：官方测试件是**与锚版同代**的 —— 没有版本脱节风险、没有许可风险、**且断言即判据**。社区件的价值集中在 **T3 的策略多样性**（第二路线 ／ 判定式 ／ 可逆取回）与 **T4 的实践取值**；**契约面与验证面不需要社区**。

### ④ 本路诚实边界

- 官方 11 个 spec：**读了 3 个全文（1,057 行）**，其余 8 个**只抓了测试标题 ＋ 少量定点正文** ⇒ 涉及其余 8 件的「借鉴点」**不是全文实读**。
- 社区件：**源码一件未读**（通道不可达）⇒ B 组全部 🟡，⛔ 不进结论区。
- **本路已被 0-A 的污染覆盖**（我读了规格内嵌的 WB 报告）⇒ 本报告的定位是「**对 WB 未覆盖层的深挖**」，**不是**独立第三方扫描。
- **未验**任何件能否真装上 ／ 跑通（规格 §8：不在本次范围）；**未拉**任何候选到仓内（⛔ 不擅动 `ref/community/`；本地源码副本落 `D:\Code\_claude-evidence\34r\`）。
- 全部结论只在**「本地 git ＋ 官方包目录 ＋ 内置搜索」**三条通道内成立；⛔ 不可外推。

### ⑤ 留痕

- 本地实读副本：`D:\Code\_claude-evidence\34r\upstream-contract-{compaction,invariant,tool-pairing}.spec.ts`（3 件，实读用）
- 检索式与全部命令见 ① 检索账

@WorkBuddy（汇总）@老大（§0-A 结构性问题待裁）

---

## ⚠️ 待裁（Tier 0 红线③）：`/dev/shm` 的 RemoveIPC 归因 —— **我方实证 vs WB 复核「未复现」**

**矛盾本体（两个方向相反的观测，均各有现场记录）**

| 方向 | 观测 | 场合 |
|---|---|---|
| **我方（实测确证）** | CVM 上 `/dev/shm` **确有 systemd-logind `RemoveIPC` 生效** —— 跨会话探针**两次**独立得到同一结论（登出后 `/dev/shm` 内我方文件消失） | DSH-3.7.4-T·P 执行期（2026-09-2x），证据在 `D:\Code\_claude-evidence\374t-p\` 分组内 |
| **WB（复核）** | 状态表 `T·P` 行记：交办项「RemoveIPC」归因 **未复现** | WB 复核（2026-09-21） |

**⚠️ 尚未做的一步（诚实标注）**：我**没有**再次上 CVM 复跑探针，也**没有**读 WB 的复核记录原文（3.4-R 边界要求提交前不读他人交流区；且我也刻意不去读以避免影响独立性）⇒ 我**不知道** WB 的"未复现"是**同条件复跑失败**，还是**换条件 ／ 换通道 ／ 换探针形态**下的结果。

**我的倾向（供裁）**：最可能的解释不是"谁测错了"，而是**触发条件不同** —— `RemoveIPC` 是 **logind 会话级**行为，其触发依赖**登录会话如何结束**（正常登出 ／ ssh 断开 ／ 会话未真正销毁）。⇒ 建议**不要**二选一归档，而是：① 由 WB 补记"未复现"时的**具体做法**（命令 ＋ 会话结束方式 ＋ 通道四元组），② 与我方的做法逐字段比对，**差异项即真结论**（这比"到底有没有"更有价值：它直接决定 `production-env.md` 里该怎么写部署注意事项）。

**我不私自裁定**（红线③ ＋ 派发纪律：规格有遗漏 ／ 结论冲突即暴露停手等裁决）。@WorkBuddy @老大

---

## 🔁 DSH-3.4-R 补充调研（2026-09-23 晚 · **梯子开启后** · 追加段）

**背景**：老大中途开了梯子 ⇒ 原报告 §① 判定"不可用"的两条通道**当前可用**。本节是**通道改变后的复测与增量**，⛔ **不覆盖原报告**（原报告的受限结论保留原状，差异本身即"报告须注明通道"的实例）。

**通道四元组（本节全部结论的适用范围）**：本机（宿主 bash ／ MSYS）＋ node 侧无关（纯 git ／ 文件操作）＋ 用户级（无提权）＋ **本机 git 全局 socks5 代理 `127.0.0.1:7890`（梯子已开）**。

### ⚠️ 订正 1：原报告对 clone 失败的**归因错了**（这条最重要）

| | 原报告 §① #3（2026-09-23 白天） | **实况（梯子开启后复测）** |
|---|---|---|
| 现象 | `Failed to connect to github.com port 443 after 21s` | `git ls-remote` **立即成功** |
| 我的归因 | "**链路级不可达，不是代理配置问题**"（因清代理后报错形态与规格 §8 不同） | ✅ **梯子未开** ⇒ 真因是**代理后面没有出口**，报错形态差异只是超时点不同 |
| 处置 | 清代理（`-c http.proxy= -c https.proxy=`）后仍失败 ⇒ 我判定规格 §8 描述不适用 | ⚠️ **清代理是反向操作** —— 本机全局 `socks5://127.0.0.1:7890` **本身就是要用的那条路** |

⇒ **撤回**原报告"打掉规格 §8"的隐含结论；**规格 §8 的说法（代理是根因、绕法是清代理）在"梯子关着"的条件下成立**，而**梯子开着时正相反：必须留着这个代理**。⇒ 正确表述应为：**"克隆失败先看梯子状态，再看代理配置"** —— 两种条件对应两种相反操作，⛔ 不可写成单条规则。

### ①′ 检索账追加

| # | 通道 | 动作 | 结果 |
|---|---|---|---|
| 6 | 联网 · `git clone`（**梯子开**） | `git clone --depth 1` × 5 个社区件 → `D:\Code\_claude-evidence\34r\community\` | **✓ 5/5 成功**（3.5M ／ 419K ／ 167K ／ 136K ／ 751K） |
| 7 | 本地实读（clone 物） | 结构普查 ／ LICENSE ／ package.json 锚版本 ／ 测试标题 ／ 关键源码与测试**全文** | 见下 |

### ②′ 候选表（**B 组升级：🟡 → 🟢**）

**G1 通关**：5 件**全部 MIT**（逐件读 LICENSE 首行确认）。

| 候选 | 类型 | 入口 | LICENSE | **锚版本（实读）** | 命中 | 档 | 借鉴点 | ⛔**不可参考／风险** | 它怎么验的 | 证据 |
|---|---|---|---|---|---|---|---|---|---|---|
| ⭐⭐ **`Tyan66666/billion-context-dsh`** | 引擎 ＋ 工具层（acp-kernel backend） | `src/`（6,263 行）／ `tests/`（**30 个 spec**）／ `docs/`（**17 个设计文档**） | MIT | peer `>=0.1.5-alpha.1 <0.1.6-0` ／ devDep pin `0.1.5-rc.2` ／ **且有自动化守卫** ⇒ ✅ **同代** | T2 T3 T4 T5 **T6** | **A** | **本批唯一"同代 ＋ 可读源码 ＋ 有测试 ＋ 有文档"四全的件**（明细见 ③′） | 依赖上游 `acp-kernel`（外部仓库）；非我方场景 | 见 ③′‑1 | 🟢 |
| `kolawong/fast-compaction-dsh` | 引擎（判定式） | `src/`（1,493 行）／ `tests/`（**6 个 spec**） | MIT | ⚠️ devDeps 全 `link:../deepseek-harness/...` ⇒ **锚不可从包声明读出** | T2 T3 T5 | **B** | verdict 式 keep/truncate/drop；**verbatim 保留**；**pins 机制**；**降级四轴**（见 ③′‑4） | ⛔⛔ **整段会话外呼第三方 API**（见 ③′‑5 风险订正） | 单元层 6 spec ＋ `scripts/e2e.ts` ／ **`scripts/inspect-compaction.mjs` 检视器** | 🟢 |
| `aerince/dsh-active-context-pruning` | 插件（工具驱动压缩） | `index.js` 347 ／ `lib.js` 119 ／ **`check.js` 65** | MIT | ⚠️ **未声明任何 deps** ⇒ 锚不明 | T2 T3 T5 | **B** | 见 ③′‑3（自查脚本范式） | 工具驱动（模型主动压），非自动触发 | **零依赖自查脚本**（`node:assert/strict`，退出码即判据） | 🟢 |
| `zixin947/dsh-compact` | **装配/策略层**（依赖 `dsh-compaction-basic` ＋ `dsh-command-compact` 为 peer） | `lib/`（5 文件） | MIT | peer 全 `^0.1.0-rc.7`，README 明写「面向 `dsh 0.1.0-rc.7`」⇒ ⚠️ **明确脱节** | T2 | **C** | 带 Web 设置卡的整包 | ⚠️ **错代**（0.1.0 线；跨方言断代） | 无测试件 | 🟢 |
| `snow-The/dsh-session-handoff` | **handoff ＋ ACP 压缩双功能** | `lib/acp*.js` ＋ `test/acp*.mjs` | MIT | 未见 seam 声明 | T3 T4 | **B**（**我改档**，原 WB 归 C） | 见 ③′‑6 | 混合体，借鉴须拆分 | 12 个 `.mjs` 测试（含 `acp.test.mjs` 254 行） | 🟢 |

**⚠️ 归类异议现已证实（🟢）**：`snow-The/dsh-session-handoff` **确有独立 ACP 压缩子系统** —— `lib/acp-config.js`(194) ／ `lib/acp-recommend.js`(98) ＋ `test/acp.test.mjs`(254) ／ `acp-config.test.mjs`(87) ／ `acp-recommend.test.mjs`(63) ＋ 两份设计文档 `COMPAT-ACP.md` ／ `DESIGN-ACP-GRAPH.md`。⇒ WB 的 C 档"属 handoff 不属 compaction"**不成立**，建议改 **B 档**。

### ③′ 评论追加（补充调研的实质增量）

**1. ⭐⭐ 最硬的一条：`replace` surfaceOp 方言**按会话版本**断代**（🟢 逐字引自 `billion-context-dsh/tests/peer-range.test.ts` 头部注释）

> "The replace surfaceOp protocol is DRAFTED per session version by a strict validator that accepts **EXACTLY three keys**: `dsh-session <= 0.1.3-alpha.2` wants `{ op, start, end }`, `>= 0.1.5-alpha.1` wants `{ op, startSeq, endSeq }`. The engine emits one dialect only, so hosts on older lines **reject every compress at runtime** — admitting them in the peer range would be a lie."

⇒ **对 3.4 的直接含义（我方锚 `0.1.5-rc.2`）**：
- 我方**必须用 `{op, startSeq, endSeq}`**；写成 `{op, start, end}` 在 0.1.5 上会被**运行时拒绝**（而非静默忽略）。
- 0.1.5 线还**同时**改了另两处（同一注释）：assistant 落定形状 **`stream` 必填** ／ **禁止 assistant replace 携带 `sourceEventSeqs`**。
- ⇒ **这是"为什么必须锁 0.1.5"的独立证据链**，建议并入 `TODO.md` S2 段的判据区（⛔ 该文件我只读，不擅自改）。
- ⚠️ **但该断代来自第三方注释，非我方实测** ⇒ 证据等级 **🟢（源码实读）但不等于我方环境已验**；若要入判据，建议按我方惯例**在 CVM ／ 本机跑一次"旧方言被拒"的负向对照**才算"已验"。

**2. ⭐⭐ 官方判据的精确语义（🟢 实读官方源码 `packages/compaction/compaction/src/checkpoint.ts`）—— 我方判据必须加强**

```ts
const COMPACT_CHECKPOINT_MARKER = Object.freeze({ kind: 'plugin', plugin: 'compact' } as const)
export function isCompactCheckpointSource(source) {
  return source.kind === 'plugin' && source.plugin === COMPACT_CHECKPOINT_MARKER.plugin
}
```
- 生成端 `compactCheckpointSource(compactionId, sourceCommandId?)` 才**附加** `compactionId`。
- ⇒ **判据端只看 `kind` ＋ `plugin` 两个字段，不校验 `compactionId`** ⇒ 任何 `{kind:'plugin',plugin:'compact'}` 的 user 消息都为真。
- ⇒ ⚠️ **订正我原报告 §③.2 的建议**：`isCompactCheckpointSource` 是**必要不充分** —— **必须再断言该 source 的 `compactionId` 与同批 `compaction/start` ／ `compaction/summary` 事件的 id 一致**。
- ✅ **官方自己就是这么做的**：`invariant.spec.ts` 的负向用例里有 `/compaction checkpoint id .* does not match compaction\/start id/` ⇒ **predicate 定位 ＋ invariant 校验 id**，两条合起来才是完整判据。
- ✅ **旁证一致**：`aerince` 的自查判据用 `source.plugin === 'compact'` —— 与官方 marker **逐字一致**（正面互证，非自造约定）。

**3. ⭐⭐ 一个"判据写在错误位置"的现成实例（🟢 引自 `billion-context-dsh/tests/byte-stability.test.ts` 头注）**

> "The messages a provider can cache are the ones the agent loop puts on the wire: `session.deriveMessages()` … **NOT** the engine's own `eventsToCoreMessages(surfaceEventsOf(session))` projection … **Asserting on the projection proves nothing about the request bytes — an earlier version of this file made exactly that mistake**."

⇒ **对 3.4 的含义**：断言落在"会话里的事件 ／ kernel 投影"上，**证明不了发给模型的内容**。我方"近文原文保留 ／ 摘要注入"的判据**必须落在 `session.deriveMessages()`**（与官方 `:762` 的判据用法**独立互证** ✓）。
⇒ 且该件**诚实划了边界**："NOT pinned here: 请求信封（tools ／ headers）与引擎真实的 surface 写入 —— 那些需要宿主 loop，由 `npm run test:e2e` 在**线级**检查" ⇒ **单元层 ＋ e2e 线级两层分工**，与我方"测试分层原则"同构；⭐ **建议我方 3.4 也照此配一条线级检查**。

**4. ⭐ `fast-compaction-dsh` 的测试组织（**测试范式可借鉴，引擎不可用**）**：四轴 ——
- **pairing**：`collectToolCalls` 按 call id 配对 ＋ **`pins calls whose result is missing`**（未闭合的 call 被钉住）／`reports orphan results`
- **pinning（保护窗口的显式实现，正是我方"近文保留"的机制对偶）**：`isPinned` = 钉住**第一条消息** ＋ **最新尾部** ＋ **system head 之后的第一条对话消息**
- **verbatim**：`keeps text verbatim and applies per-call decisions` ／ **`never touches pinned calls`** ／ `emits a placeholder when everything is dropped` ／ `reports the character reduction`
- **degradation（配置层故障注入 —— 我在 A 段评审里提的"降级要能分态"的现成范例）**：`settings-broken.spec.ts` = 无 settings provider 时只用组合配置 ／ 存储段过不了 schema 时**保留组合值并告警**
- 另有 `fitState`：**`degrades inputs before texts`**（降级顺序被断言）／`throws when nothing fits`

**5. ⛔⛔ 风险订正（这条必须在汇总时看到）：`fast-compaction-dsh` 把整段会话外呼第三方 API**

- `src/jev.ts:13-14`：`SYSTEM_ONE_URL = 'https://api.typesafe.ai/v1/systemone'`
- `:3-4` 注释："one POST per batch of `noul` questions against the TypeSafe System One endpoint, authenticated with `TYPESAFE_API_KEY`"
- ⛔ `:7`：**"The `state` sent with every request is the whole fitted conversation"** ⇒ **每次压缩把整段会话内容发往 `api.typesafe.ai`**
- 正面项：4 条降级路径（无候选 ／ 被禁用 ／ 应答非法 ／ 缩减不足）+ `redacts the apiKey from the described wire view`
- ⇒ **判定**：技术路线（verbatim 保留）有参考价值，但其**引擎不可作参考实现** —— 对本项目（个人项目 ＋ 成本敏感 ＋ 数据安全边界）属**外部数据出站 ＋ 外部可用性依赖**双风险。**⛔ 我原报告把它列为"⭐ 另一条路线"而未标风险，此处订正为「路线可借鉴 ／ 引擎不可参考」。**

**6. ⭐⭐ 方法论文档：`billion-context-dsh/docs/upstream-tracker.md`（本批对我方**最可移植**的一件）**

它把"依赖上游会漂移"这件事**机械化**了：
- 规则：「上游缺陷一律走 **上游 issue + PR → 升级 pin → 解除本地 workaround**；**任何本地 workaround 必须登记**，上游修复后**必须删除**」
- 每道"门"有**解除条件清单**，且要求**同一个 PR 内四步走完**（上游发布 → bump pin → 解除本地锁定 → 状态改 `resolved`）
- **机读标记**：「代码里带 `UPSTREAM:` 注释指向本行 —— **它还在，就说明这道门没关**」＋ 用**测试断言翻转**（如把 characterization 断言改判）作为解除动作
- 状态机：`waiting-upstream` ／ `merged-released` ／ `resolved`（**已解决的也不删，留档作证据链**）
- 实例：`acp-kernel#93 → PR#123` **明确标注 open 未合并**；`#335` 用 `tests/checkpoint-span.test.ts` **以 characterization 锁定当前（已知有缺陷的）行为**，而不是假装它是对的
- ⇒ ⭐ **建议我方 3.4 ／ 3.7 参照建立同类机制**（我方同样"锚在别人的版本上"）。⛔ 但这是**建议**，落点属 `TODO.md` ／ `docs`（我的只读区），**由 WB ／ 老大定**。

**7. ⭐ `aerince` 的自查脚本范式**：`check.js` 用 `node:assert/strict` ＋ 末尾 `console.log("ok")`，**零依赖 ／ 无测试框架 ／ 退出码即判据**。含**边界语义断言**：`pressureLevel(700, 600, 700) === "hard"` ⇒ **取等号算 hard（闭区间）**；`parseLimit("60%") → {kind:'ratio',value:0.6}` ／ `"154000" → {kind:'tokens'}` ⇒ ⭐ **比例与绝对值两种阈值形态**。⚠️ 局限：**纯逻辑层自查，无端到端**。

**8. 版本脱节判断（最终版，逐件硬判）**

| 件 | 声明的锚（实读） | **判定** |
|---|---|---|
| `billion-context-dsh` | peer `>=0.1.5-alpha.1 <0.1.6-0`；devDep pin `0.1.5-rc.2`；**＋ 自动化守卫**（`peer-range.test.ts` 断言"接受整条 0.1.5 线"且"拒绝 0.1.6+ 与 0.2.x"） | ✅ **同代（且唯一带守卫的）** |
| `fast-compaction-dsh` | devDeps 全 `link:../deepseek-harness/...` ⇒ **不可从包声明读出** | 🔴 **待核**（须看其 harness 检出） |
| `dsh-active-context-pruning` | **未声明任何 deps** | 🔴 **待核** |
| `dsh-session-handoff` | 未见 seam 声明 | 🔴 **待核** |
| `dsh-compact` | peer 全 `^0.1.0-rc.7` ＋ README 明写 | ⚠️ **明确脱节**（0.1.0 线） |

⇒ **修正我原报告 §③.3 的判断**：原写"新找到的 3 件均未见矩阵行"。现升级为 —— **"未见矩阵行"里已有 1 件拿到硬判定（`dsh-compact` 脱节）／ 1 件拿到硬判定（`billion-context-dsh` 同代且带守卫）／ 2 件仍待核**。⇒ 「**按件标注**」的建议**更加成立**。

**9. ⚠️ 一条我未能证实但必须记的现象**：`billion-context-dsh` 远端当日的分支名含 `2026-09-23_checkpoint-source-kind` ／ `2026-09-23_direct-kind-classification` —— **日期即今天，且涉 compaction 领域词**。⇒ 说明该件**当前正在活跃开发**。⚠️ **对"参考件"的双面含义**：活跃 = 参考价值高；活跃 = **我们据以判断的状态会漂移**（我这次读的 HEAD 是 `171e5fb`，⛔ 引用时必须带这个 sha）。**我不做进一步推测**（可能与别的 AI 活动无关）。

### ④′ 本路诚实边界（补充段）

- **仍未读任何其他 AI 的交流区**（含 `log-workbuddy.md`）✓ 独立性在本段内保持。
- 本段**只读了 5 件的源码与测试，未跑过其中任何一件**（未 `npm i` ／ 未执行其测试）⇒ **"它怎么验的"是读出来的，不是跑出来的** ⇒ 证据等级 🟢 指"源码实读"，⛔ 不指"已复现其验证有效"。
- `billion-context-dsh` 的 `tests/` 我只**全文读了 4 个**（`peer-range` ／ `tool-pairing-host` ／ `byte-stability` ／ `region.test.ts` 的标题），其余为**标题级**。
- 订正记录：**订正 1（clone 归因）** ／ **订正 2（`fast-compaction-dsh` 风险标注）** ／ **订正 3（`isCompactCheckpointSource` 必要不充分）** ／ **升级 1（B 组 🟡→🟢）** ／ **升级 2（归类异议已证实）** ／ **升级 3（版本脱节逐件硬判）**。
- 全部结论的通道四元组见本段开头；⛔ **不可外推到其他机器 ／ 梯子关闭状态**。

### ⑤′ 留痕

- 5 件完整副本（`--depth 1`）：`D:\Code\_claude-evidence\34r\community\{billion-context-dsh,fast-compaction-dsh,dsh-compact,dsh-active-context-pruning,dsh-session-handoff}\`（⛔ 全在仓库外）
- `billion-context-dsh` 实读 HEAD：`171e5fbf29996e92258a79ba6c5cc4c640fb8eb2`
- 官方 `checkpoint.ts` 实读来源：`ref/dsh-bare` @ tag `dsh-v0.1.5-rc.2`（本机，未联网）

@WorkBuddy（汇总：**本节对原报告有 3 处订正 ＋ 3 处升级，请以本节为准**）@老大

---

## 🔀 DSH-3.4-R 融合轮（2026-09-28）：读三方报告后的**方法与路径吸收** ＋ 据此实做

> 授权：老大 2026-09-28「参考三方报告，**吸收他们的方法、路径**，对你自己的报告做出你认为有必要的调整；**并非简单吸取整合结论**」。
> 通道四元组（本段全部结论）：本机 ／ bash（MSYS）＋ **node v24.14.1** ＋ 用户级 ＋ **梯子已开（全局 socks5 代理在跑）**。
> ⚠️ **老大三条口径已读并遵守**（2026-09-23）：预算 5000 万 ／ **版本锚定降为观察** ／ 他方交付取当下状态。⇒ 本段**不做版本考古**；下述"方言"一条的定位是**我方代码的硬约束**（写成 `{start,end}` 会在锚版上抛错），**不是**版本矩阵考据。
> ⛔ 我**不改规格、不改他人交流区**；本段只动本文件。

### ① 吸收清单（别人的**方法/路径** → 我的采纳动作）

| # | 来源 | 方法 ／ 路径（不是结论） | 我的采纳 |
|---|---|---|---|
| M1 | **Trae** A5 | **不抄声明，实跑 `semver.satisfies()` 判 peer 范围** —— 预发布规则会让"看起来兼容"判 false ⇒ 只抄声明会造**假脱节**也会漏**真脱节** | ✅ 实做（§②‑2）⇒ **抓出我自己的一处过度声明** |
| M2 | **Trae** A1 | **名录是"发现通道"、不是"判定通道"** ⇒ G1／G2 只对**已落位件**判定；未落位件归线索并**显式标"未判"**，不塞进 D 档 | ✅ 采纳为口径（我原报告无"未落位线索"档） |
| M3 | **Trae** A2 | 自定**落位门槛 ＋ 名额上限**并写进检索账 ⇒ **取舍规则可复核、可被否决** | ✅ 已在原报告 §0‑B 表声明（"不重复扫名录"＋两条主攻），此处补明**名额规则**：我方实读 5 件社区件，全部来自"已有名字"的候选，**未做名录盲扫取名额** ⇒ 弃权而非覆盖 |
| M4 | **Trae** A3 | **来源偏好不能凌驾证据等级**（T3 先由官方答，社区作对照） | ✅ 已在原报告（官方 A 组为主）⇒ 补显式声明 |
| M5 | **Trae** A4 | **两处 DSH home 都实测 ＋ sha256 比对同源性** | ✅ 实做（§②‑3）—— 我原报告只查了 `~/.dsh` **一处** |
| M6 | **Trae** C2 | 判据**口径**问题：「**留 surface** 还是**可回取**」——若判据只认前者，会把"外部 store ＋ 回取工具"那条路**误判为不合格** | ✅ 采纳并**扩成三态**（§③‑3） |
| M7 | **WB** ③‑3 | **负结果的"精确含义"必须读源码确认**（他一 grep 差点误报，读到 `obsolete` 才反转） | ✅ 采纳 —— **我自己本轮就踩了同款**（§④‑1 自曝） |
| M8 | **WB** 轮 2 | **把"分代"做成可核对的尺子**（V0/V2/V3/V4），并在**锚版逐条核对** | ✅ 实做（§②‑1）—— 我用了更直接的路径：**裸仓有旧 tag ⇒ 两端各读一次** |
| M9 | **WB** ③‑7 | 声明**不可作依据**（`dsh.plugin.json` 上游全仓无引用；官方契约是 `package.json#dsh.bundle.patch`）⇒ 兼容性**以实测为准** | ✅ 采纳为**统一的措辞纪律**（§③‑0 表头：一律标"声明级"） |
| M10 | **WB** ③‑9 | **判据必须能区分"三种结局"**：① 根本没触发 ② 压了但摘要被截 ③ 压了且摘要完好 | ✅ 采纳 —— **这是对我原判据的实质补强**（§③‑1） |
| M11 | **Qoder** ②‑1 | **参考件分三层**：conversation compaction ／ tool-output 压缩 ／ **上下文构成观测**（第三层对 T5 最有用） | ✅ 采纳（§③‑4）—— 我原报告是平表，**缺第三层** |
| M12 | **Qoder** 补遗 ④ | **`/latest` ≠ 最新发布**（dist-tag 陷阱）；同名搬运件必须写全 `@scope`；`"*"` 与"读不出"同档 | ✅ 采纳为通道纪律（§④‑2） |
| M13 | **WB** C 组 | **按"痛点簇"登记**而非按件平铺 | ✅ 采纳为登记法（§③‑5） |
| M14 | **Qoder** ③‑6 | **"扫了多少"必须与通道绑定**（目录站 333 vs 名录 3,196+，同为一天） | ✅ 采纳（原报告 §① 已带通道列，此处补明**不可比**） |
| M15 | **WB** 横切 II | 下轮检索**改从机器可读注册表起手**（本地名录是快照、已滞后） | ✅ 登记为**路径优化**（§④‑3），本轮不做 |

**⛔ 我明确不吸收的**：各方的**候选结论与分档**（旧报告已提交、结论区不重写）；**版本矩阵深挖**（老大口径）。⇒ 本段只吸收**做事的办法**，不搬运**做出来的答案**。

### ② 据此实做（可复算 · 只读）

**②‑1 ⭐⭐ 方言断代：从"第三方注释"升级为「上游双 tag 类型 ＋ 运行期校验器」实测**

| tag | `SurfaceOp` 的 replace 分支 | `isReplaceOp()` 校验 |
|---|---|---|
| `dsh-v0.1.3-alpha.2` | `{ op:'replace'; **start**; **end** }`（`types.ts:422-424`） | `Object.keys(op).length === 3` ∧ hasOwn `start`／`end`（`surface.ts:183-192`） |
| `dsh-v0.1.5-alpha.1` | `{ op:'replace'; **startSeq**; **endSeq** }`（`types.ts:434-436`） | `Object.keys(op).length === 3` ∧ hasOwn `startSeq`／`endSeq`（`surface.ts:229-238`） |
| `dsh-v0.1.5-rc.2`（**我方锚**） | 同 `0.1.5-alpha.1`（`types.ts:436`） | 同上 |

- 裸仓 tag 列表里 `0.1.3-alpha.2` 之后**直接跳到** `0.1.5-alpha.1`（无中间 tag）⇒ **分界点两侧各实测一次**，第三方注释的分界说法**被证实**。
- ⇒ **升级为 🟢🟢（上游类型定义 ＋ 运行期校验器，双 tag 实读）**，不再依赖第三方注释。
- ⭐ **拿到一条原报告没有的硬约束**：校验器**第一行**就是 `Object.keys(op).length === 3` ⇒ **恰好三个键，多一个就抛**（`session event "…" carries an invalid replace surfaceOp`）。⇒ 我方实现**不能往 replace 里塞任何额外字段**（想加调试字段即运行期报错）。
- ⭐ **顺带坐实另一条**：`SurfaceIntent` 类型级规定 **`assistant/message` 的 `sourceEventSeqs` 为 `never`**，且运行期也抛（`surface.ts:275` `'assistant/message embeds its source stream and cannot carry sourceEventSeqs'`）⇒ 第三方注释"0.1.5 禁止 assistant replace 带 `sourceEventSeqs`"**上游双重确认**。
- ⭐ **负向判据表又得一组**（运行期校验器层，与官方 `invariant.spec.ts` 同族但**层次不同**）：`surface replace: sourceEventSeqs must include every shadowed surface node; missing …`（`surface.ts:302`）／`sourceEventSeqs must not be empty` ／`must not contain duplicates` ／`must reference earlier events: N >= current seq M`。

**②‑2 ⚠️ 实跑 semver ⇒ 抓出我自己的过度声明（订正）**

`semver@7.8.5`（取自 `.dsh-home` profile），`node v24.14.1`，锚 = `0.1.5-rc.2`：

| 件 | 声明范围 | default | includePrerelease | **我据此的判定** |
|---|---|---|---|---|
| `billion-context-dsh` | `>=0.1.5-alpha.1 <0.1.6-0` | **true** | true | ✅ **默认语义即成立**（**自带守卫测试**）⇒ 本批最强的一件 —— 但仍是**声明级** |
| `handoff-compaction`（WB B 组） | `^0.1.5-rc.2` | **true** | true | ✅ 默认即成立 ⇒ 与 WB"peerDeps 覆盖 `^0.1.5-rc.2`"一致 ✓ |
| **`dsh-compact`（zixin947）** | `^0.1.0-rc.7` | **false** | **true** | ⚠️ **订正原报告** |
| Qoder 的 `cacheaware`／`instant` | `^0.1.0-rc.6` | **false** | **true** | ⚠️ 同上（Qoder 原判"并不统一要求 ≥0.1.6"**成立**；但**形态**属预发布歧义） |
| Trae 的宽范围样本 | `>=0.0.1-rc.5` | false | true | 同上 |

- **订正**：我原报告写 `dsh-compact`「⚠️ **明确脱节**」—— **过度声明**。实测形态是 **`default=false` ／ `includePrerelease=true`** ⇒ 与 `context-pruner`／`headroom` 属**同一类**（Trae 命名的"**预发布语义伪脱节**"）。⇒ **改判 🔴 待核（预发布歧义）**，并明确：**"脱节"与"歧义"必须分开写**（前者会影响选型，后者只影响安装姿势）。
- ✅ **反向对照通过**：`billion-context-dsh` 的 peer 对 `0.1.5`／`0.1.5-rc.9` = true，对 `0.1.6-alpha.1`／`0.1.6`／`0.2.0` = **false** ⇒ 与它 `peer-range.test.ts` 的守卫断言**逐条一致**（独立互证）。
- ⇒ **M9 的应用**：所有件的兼容性结论**一律标"声明级"**（含 `true` 的那些），⛔ 不写成"可用"——**未实测**。

**②‑3 两处 home 同源性（Trae A4 的方法）**
`~/.dsh/profiles/sdk/node_modules/@deepseek-ai/dsh-compaction-basic/package.json` 与 `.dsh-home/...` **sha256 前 16 位均为 `9988b62641257a12`** ⇒ **同源** ✓（与 Trae 独立结论一致）

**②‑4 复核三方对 `aerince` 的引用（我用同一份源码逐条核对）**
✅ **Qoder 与 WB 的引用逐条成立**：`installSummaryHook`（`index.js:160-179`：保存 `compaction.summarize` → 覆写 → 返回恢复闭包；命中 pending 时返回 `{summary:[…], provider:'acp', model:'model-authored'}`）／`assertSafeRange`（`:119-130`，用 `nodes.length - 1 - config.preserveRecent` 卡尾）／`isCheckpointEvent`（`lib.js:73-77`，与官方 marker `{kind:'plugin',plugin:'compact'}` **逐字一致**）／`compactRegion(start,end,agent,exec.signal)` 调用点（`:230`）。
⚠️ **一处行号小滑**（Qoder 与 WB 同）：`preserveRecent` 在 **`index.js:23/126/289`**，**不在 `lib.js`**（`lib.js` 无该标识符）。
⚠️ **补一条两方都没提的**：该 hook 有**静默降级** —— `if (compaction == null || typeof compaction.summarize !== 'function') return () => {}` ⇒ 宿主若无该方法则**静默不装**，外部观测不到 ⇒ ⭐ **又是"降级不可分态"的一例**（inject 与否不可辨）。

**②‑5 ⭐⭐ 实读 Qoder 独家发现的 T5 装置，核出一个真缺陷**

`gendui123/dsh-compaction-probe`（MIT ／ `src/index.ts` 130 行 **全文实读** ／ 仓外 `…/34r/community/dsh-compaction-probe`）
- **它是什么**：observe-only（"never injects, never blocks"）的 `session/event` 监听器，把每个 `compaction/*` 事件落 JSONL（`dsh-home/reports/compaction-probe.jsonl`）；对 `compaction/summary` 额外探 `shadowedSeqs` 是否仍可读。自述定位 = **"is the source-of-truth readable at the moment the summary lands"** 这道闸门。
- ⭐ **它与我原报告的概念区分是同一条**：「被压原文留在 append-only log ≠ 近文原文保留」—— 第三方独立做出了**可观测版本** ✓
- ⭐ **它探的字段面可直接抄**：`summaryText` ／ `shadowedProbe[{seq,readable,type,textLen,textPreview}]` ／ `summaryProvider`／`summaryModel` ／ `shadowedRange` ／ `shadowedTokenCount` ／ **`hasRawOutput = Array.isArray(d.rawOutput)`** ／ `maxTokens`；start／end 侧记 `compactionId`／`sourceCommandId`／`turn`／`error`。⇒ ⭐ **`hasRawOutput` 是"摘要是否被截"的现成探针素材**（呼应 `manual-compaction.spec.ts:816`「保留 raw output 与 usage」＋ WB 的 D 簇）⇒ 收进 §③‑1。
- ⚠️⚠️ **但它的判据在本锚版会恒红（不可分态）** —— 我实读上游核对：
  - 它写 `session.events?.[seq]`。**上游 `Session` 类自身无公开 `events` 访问器**（实读 `packages/core/session/src/index.ts`）：读事件的正路是 **`eventAt(seq)`**（`:621`，实现 `return this.log[seq]`）／**`snapshotEvents(from,to)`**（`:633`）／`ownEvents()`；存储是**私有** `log`，缓存字段名是私有 `eventsSnapshot`。
  - 可选链 `?.` **不抛错** ⇒ `raw === undefined` ⇒ **每条都记 `{readable:false, reason:'missing'}`** —— **无论原文是否真的可读** ⇒ **恒红，且反向误导**（真因是 API 用错，看起来像"原文丢了"）。
  - ⭐ **官方自己的读法可作旁证**：`packages/compaction/compaction/src/tool-pairing.ts:53` 用的是 `session.eventAt(seq)`。
  - 它另写 `session.deriveEventMessage?.(raw)`，而 `deriveEventMessage` 是**模块级导出**（`index.ts:29 export { deriveEventMessage, … } from './surface.ts'`）**不是 session 方法** ⇒ 同样被 `?.` 静默跳过 ⇒ `textLen: 0`。**双重失效**。
  - ⚠️ **诚实边界**：我**未穷尽全仓** grep `events` 的 augmentation 面、**未实跑**该探针 ⇒ 判定为 **🟠 高度可疑（源码级推断）**，⛔ **不写成"已证失效"**。但**足以否掉"现成可用装置"这个描述** —— 要用必须先补一次实跑。
- ✅ **可抄的部分照旧成立**：四层 containment（`apply` 外包 try/catch ⇒ 激活失败自禁 ＋ 告警；`record` 落盘失败只告警；handler 单事件异常不扩散；`probeShadowed` 单条不可读不中断）＋ **`inject = ['sessions']`（复数）带注释解释**（"A SINGULAR `session` would fail to resolve ('pending (waiting for service: session)')"）—— ⭐ 这条与我既有经验**独立互证**（插件取服务要用注入面，取不到 ≠ 服务不可用）。
- **锚版本**：peerDeps 仅 `cordis`／`schemastery`；devDep `dsh-session: ^0.0.1-rc.1` ⇒ 按 G4 **🔴 读不出**。`package.json#dsh.bundle.patch` **在** ✓（符合 WB 说的官方安装契约）。

### ③ 我方判据的调整（吸收 M6／M10／M11 ＋ 前几轮自读）

**③‑0 措辞纪律（M9）**：全表**一律标证据级**；兼容性结论统一写「**声明级**」，⛔ 不写"可用／可作产品依赖"；`default` 与 `includePrerelease` **两栏并列**（M1）。

**③‑1 ⭐ 判据补强：从"三条"改为"四问 ＋ 三结局"**

原报告给的三条（①尾部逐字 ②切点 balanced ③checkpoint 为真）**漏了一态**：**"压了但摘要被截"** —— 此时 ①②③ **全绿**，而摘要其实残缺（WB 的 D 簇 5 件互不相识的仓各自修 `reasoning → maxTokens` 截断 ⇒ **该态真实存在**）。⇒ 改：

- **第 0 问（先判"是否发生"）**：`compaction/start`·`summary`·`end` 三事件齐 ＋ `CompactionResult` 非 null ⇒ 分开「**根本没触发**」与「压了」。⚠️ 官方失败语义是「摘要失败**保留最新 durable surface**」⇒ 失败态**不缩不丢**，与"没触发"**在 surface 上长得一样** ⇒ 必须靠**事件侧**分。
- **第 1–3 问**：原三条**保留**（尾部逐字 ／ `toolPairingBalanced*` ／ `isCompactCheckpointSource` ＋ **`compactionId` 一致性**）。
- **第 4 问（新）**：**摘要完好性** —— 用 summary 事件的 **`rawOutput` 是否存在 ＋ 与 `summary` 的长度关系**，配 `maxTokens` 判「**被截**」（探针素材见 §②‑5）。
- ⇒ **四问对应三结局**：①触发与否 ②摘要是否被截 ③摘要完好 —— ⛔ **三态必须能分开**，否则"nonce 丢失"无法归因。

**③‑2 "保留了多少"要用对尺 —— 三种语义并存（Qoder 的输入 ＋ 我的自读）**

| 尺 | 语义 | 出处（🟢） |
|---|---|---|
| `retainRatio` = **0.16** | 窗口的 **token 比例**，`floor(窗口 × ratio)` | 官方 basic |
| `retainTokens` | **绝对 token 值**，与 `retainRatio` **互斥** | 官方 basic（测试里直接设 `80`） |
| `preserveRecent` = **2** | **surface 节点数**（不是 token） | `aerince/index.js:23` |

⇒ ⛔ **判据里写"保留 N 条"时，必须标明用的是哪把尺**；且**实测值 ≠ 配置的线性结果**（还要经 tool-pairing 向头部取整）。

**③‑3 "原文可取"的**三态**（M6 扩写）** —— 判据口径必须先定，否则会误杀：
1. **留 surface**（近文原文，官方 `retainRatio` 路）
2. **可回取**（外部 store ＋ 取回工具，`headroom` 路：原文入 CCR store ＋ marker，模型调 `retrieve(id)` **逐字节**取回）
3. **只在 append-only log**（官方 pruner 路：`sourceEventSeqs` 引用替换件 ⇒ 重放可复原，但**要经 session API 读**）
⇒ ⛔ **若判据只认 ①，会把 ②③ 误判为不合格**；反之若把 ③ 也算"保留了原文"，则"近文原文保留"这条判据**形同虚设**。⇒ **建议我方判据明确写死"近文"= ①**，②③ 另立条目。

**③‑4 登记分三层（M11）**：① **conversation compaction**（与 3.4 同题）／② **tool-output 压缩**（只在"压什么"互补）／③ **观测验证**（T5 落点 —— **我原报告缺这一层**，而它恰是我的侧重）。
**③‑5 按痛点簇登记（M13）**：用于后续"广度"轮，避免平铺。
**③‑6 我方 3.4 的"四根杠杆"补齐**：官方 `thresholdRatio`(0.8) ／ `retainRatio`(0.16) ／ `maxTokens`(8192) ／ **`summarizationProvider` ＋ `summarizationModel`（必须成对）** —— 第四根是 WB 轮 2 的增量，我方原报告无。

### ④ 通道／方法级陷阱登记（供下轮与汇总，均非本路新证）

1. ⚠️ **我本轮自曝（M7 的同款）**：我用 `grep -nA6 "function isReplaceOp"` 读 `0.1.5-rc.2` 的校验器时，**窗口截断了函数首行** `Object.keys(op).length === 3` ⇒ 差一步就写成"上游未见键数限制，第三方表述与上游不一致"的**误报**。⇒ **读函数体不得用固定行数窗口**（改 `-A30` 或整段 `show`）；**负结果必须整段确认**。
2. **Qoder／WB 的通道陷阱**（采纳为下轮纪律，未在本轮复现）：`/latest` dist-tag ≠ 最新发布；npm 同名搬运件 ⇒ 必须写全 `@scope`；`peerDeps:"*"` 与"读不出"同档；`dsh.plugin.json` 非官方契约（官方 = `package.json#dsh.bundle.patch`）。
3. **路径优化**（M15，登记不执行）：下轮广撒网改从**机器可读注册表**起手（`XingLingQAQ/dsh-plugin-registry`，每日刷新），本地名录是 `2026-09-07` 快照、已滞后。
4. **本地通道小坑（本轮新增）**：MSYS 的 `$HOME`（`/c/Users/…`）喂给 Windows node 会 `MODULE_NOT_FOUND` ⇒ 走 Windows 路径写法（`C:/Users/…`）。

### ⑤ ⚠️ 红线③暴露：一处**通道间不一致**（我与 Trae 对同一 range 的 `includePrerelease` 结果相反）

| | 范围（双方**逐字相同**） | default | **includePrerelease** |
|---|---|---|---|
| **Trae（`log-trae.md` §4）** | `>=0.0.1-rc.5 <0.1.0 \|\| >=0.1.0-rc.1 <0.2.0-0` | false | **false**（他记"includePrerelease 亦 false"） |
| **我（本机复跑）** | 同 | false | **true** |

- 我的原始输出（可复算）：`node` ＋ `semver@7.8.5`，`semver.satisfies('0.1.5-rc.2', RANGE, {includePrerelease:true})` ⇒ `true`。
- **我不判谁对**（红线③：摆矛盾）。**我的倾向**：这**不影响任何选型结论** —— 两方都判 `default=false`，而 `default` 才是包管理器的实际行为 ⇒ **该件按 🔴 待核处理是一致的**。差异可能出在"`||` 复合范围在 includePrerelease 下的求值被逐段测过还是整体测过"。
- ⛔ **我未读 `log-trae.md` 之外的场合来交叉验证此事**；也**不替 Trae 圆**。⇒ **请 WB 汇总时按"两方 default 一致、includePrerelease 存疑"记**。

### ⑥ 本段诚实边界

- 本段**只吸收方法、不搬运结论**；三方的候选表与分档**我未重写**（旧报告已提交，结论区不追改）。
- **实做项 5 条**：方言双 tag 实测 ／ semver 实跑 ／ 两处 home sha256 ／ aerince 引用逐条核对 ／ probe 源码实读。**其余为阅读与登记**。
- **仍未装、未跑任何候选件**；`probe` 的失效判定是**源码级推断（🟠）**，⛔ 不是实跑结论。
- 本段**未读 `log-other.md`／`log-marvis.md`／`log_design.md`**（老大已取消 other 的调研任务；非本任务范围）。
- 通道四元组见本段抬头；⛔ 不可外推。

@WorkBuddy（汇总可引用：§②‑1 方言双 tag 实测 ／ §②‑2 我的订正 ／ §②‑5 probe 的 **🟠 高度可疑**（⛔ 请勿登记为"现成可用装置"）／ §③‑1 四问三结局 ／ §⑤ 通道间不一致待裁）@老大

---
