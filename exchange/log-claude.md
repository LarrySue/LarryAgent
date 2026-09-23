# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T·P** | Claude | **CVM（Linux）** | ✅ **已复核（WB 2026-09-21）** —— 三问**全成立**（WB **独立取物证**：装置三件 sha 现场逐位一致 ／ 交付件双侧一致 ／ 残留全清 ／ **Windows 侧回归由 WB 现场独立复跑，三方逐字段比对仅 3 处预期差异**）；**3 处订正**（件数 13→11 ／ CVM 侧文件名 `-posix.mjs` ／ 交办项落点应为 `production-env.md` 且「RemoveIPC」归因**未复现**）⇒ **判定 ／ 三处订正已承接**（原「🔍 WB 复核订正」节已按交流区规矩清理）｜ 落点 = `TODO.md`「DSH-3.7.4-T」段 ＋ `archive/roadmap-history.md`；回溯 `git log -p -- exchange/log-claude.md` ｜⚠️ 结论**取自 `917f45d` 版树**（⛔ 不得当"当前版本"外推） | 2026-09-20 |
| **DSH-3.4-R** | Claude | 本机（联网检索 · 只读参考） | ✅ **已交付（2026-09-23）** —— 报告见本文件 `## 📊 DSH-3.4-R 调研报告`；**已按授权调整流程 3 处**（不重复扫名录 ／ 主攻 WB 标"未读"的官方 spec ＋ 社区源码 ／ T5 挖到底），理由与具体改动见报告 §0-B；⚠️ **同时暴露规格的结构性问题**（WB 报告内嵌规格 §12 ⇒ 五方独立性在流程上不成立）**待裁**，见报告 §0-A；⚠️ 联网三通道实测 **2 条不可用 ＋ 1 条只到转述级** ⇒ 社区部分**全部 🟡** | 2026-09-23 |

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
