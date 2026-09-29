# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T·P** | Claude | **CVM（Linux）** | ✅ **已复核（WB 2026-09-21）** —— 三问**全成立**（WB **独立取物证**：装置三件 sha 现场逐位一致 ／ 交付件双侧一致 ／ 残留全清 ／ **Windows 侧回归由 WB 现场独立复跑，三方逐字段比对仅 3 处预期差异**）；**3 处订正**（件数 13→11 ／ CVM 侧文件名 `-posix.mjs` ／ 交办项落点应为 `production-env.md` 且「RemoveIPC」归因**未复现**）⇒ **判定 ／ 三处订正已承接**（原「🔍 WB 复核订正」节已按交流区规矩清理）｜ 落点 = `TODO.md`「DSH-3.7.4-T」段 ＋ `archive/roadmap-history.md`；回溯 `git log -p -- exchange/log-claude.md` ｜⚠️ 结论**取自 `917f45d` 版树**（⛔ 不得当"当前版本"外推）｜⚠️ **该行的「RemoveIPC 未复现」与 Claude 的实测结论相反、⛔ 未合并 ⇒ 见本文件下方 `## ⚠️ 待裁` 段（待裁，非已闭环）** | 2026-09-20 |
| **DSH-3.4-T** | Claude | **本机（Windows）** | ✅ **已交回（2026-09-29）· 待 WB 复核** —— 靶子 = 「**3.4 的判据有没有判别力**」：**四条维度均有判别力**（T2 三档 4804／9608／19216 单调；T3 半判据 vs 完整判据两臂；T4 (a)/(b) 同刻不同读数；T5 A 落地反向对照），**另出 3 处口径订正**（保留量是「下界＋节点吸附」／事件侧字段是 `event.data.source`／"压前"锚 `compaction/start`）＋ **1 条本 profile 事实**（`invariants` 未挂载 ⇒ 伪造 checkpoint 零防护）。回报 = 本文件 `## 📥 DSH-3.4-T · 回报` 段；⛔ 不重判产品面。 | 2026-09-29 |

- 已完成并复验（各段已按交流区规矩清理；3.0.x 系列与 DSH-2 系列均已在 `TODO.md` 承接）：**3.7.3-T ✅（WB 复核：T1–T4 四项判定均成立，另补 1 条更强的 ＋ 记我方派稿缺陷 1 处）** ／ **3.7.4-T ✅（WB 复核：`T-1` 独立复跑逐条一致 ＋ `T-2` 三方字段比对一致；2 处差异均**非断言项**）**。
- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3.7.4-T」段**；本区只放**怎么做**。⚠️ 需回溯时用 `git log -p -- exchange/log-claude.md`。
- ⚠️ **通用纪律**：
  1. **报告须注明通道** —— 同一台机器上，不同工具树 ／ 不同 shell 会话会给出**不同 node 版本**与不同文件系统视图 ⇒ 结论不可跨通道互推（"Bash 通道"这种写法对别人而言是**另一条**）。
  2. **"没有 ／ 不存在"须附检索式与遍历范围**，否则不可验、等于没回答。
  3. **自曝优于好看**：口径错 ／ 跑歪 ／ 覆盖了证据，都直接写。
  4. **未观测到的行为不得写成已证**（"可达但未观测"要标清；"构造成立"要标为构造）。
  5. **应红 ／ 应绿须逐件读源码定期望**，不得按"组"给口径（同一批哨兵里可能有**落绿才是绿**的件）。
  6. **收尾必核 `git status`**。

## 📤 DSH-3.4-T · 独立测试件（派发于 2026-09-29）

**执行人**：Claude ｜ **场地**：本机 Windows（与 3.4 同场地 ⇒ ⛔ 不可并行）｜ **起跑卡点**：**等 `3.4` 主体交回后起跑**
**性质**：**独立测试件** —— 靶子不是"主块结论对不对"，而是「**3.4 的判据本身有没有判别力**」。

---

### 0 · 目标（一句话）

**回答一件事**：3.4 那套判据，**会不会被"看起来满足"的路径自动通过**？

> 为什么这值得单独派人：3.4 的四条口径（① 近文定义 ／ ② 尺 ／ ③ 三态可分 ／ ④ 断言位置）**每一条都是在堵一个"自动为真"的坑** —— 这类判据的共同失败形态是**恒真**（永远为绿），而恒真在一次成功跑里**看不出来**。⇒ 本件用**破坏 ＋ 对照**去逼它变红。

**本件不做什么**：⛔ 不重判"产品可接受"（保真度 ／ 中文摘要形态 —— 那是产品决策）；⛔ 不覆盖 overflow 恢复（L5）。

---

### 1 · 判据

> **素材**：主块装置 `harness/scripts/run-34-*.mjs` 与其证据包。⚠️ **可读主块装置，但结论必须独立取证** —— 主块的"跑通了"是**声明**、不是证据。

**T1 · 独立复跑主干三判据**
- **做什么**：**自己写装置**（⛔ 不照抄主块装置的判据代码）复跑 **J4（摘要注入）／ J5（近文原文保留）／ J6（三态可分）**。
- **期望**：与主块结论一致（一致则**升级为跨通道互证**；不一致 ⇒ **并列留痕、⛔ 不合并**）。
- **诚实边界**：T1 是**复现**，不是"更权威"—— 若两方不一致，**结论是"存在分歧"，不是"谁对"**。

**T2 · 尺的判别力（破坏对照）** ⭐ 本件最重要的一条
- **做什么**：把 `retainRatio` 从默认 **0.16** 分别改成 **0.02** 与 **0.5**，各跑一次 L2。
- **期望**：**近文保留量随配置单调变化**（且 0.5 会被 `retainRatio < thresholdRatio` 放行，因为它仍 < 0.8）。
- **若不变** ⇒ **判据在测别的东西**（例如实际走的是 `retainTokens` ／ `preserveRecent`），**J5 的"尺"口径作废**。
- **双锚**：同时断言"其余仍活"（摘要仍注入、`start`/`end` 仍成对）—— 否则"环境没起来"与"破坏生效"不可区分。

**T3 · 谓词的假阳性（对照）** ⭐ 第二条重点
- **做什么**：构造一条 `user/message`，其 `source.kind === 'plugin' ∧ source.plugin === 'compact'`，但 **`compactionId` 不匹配**任何 `compaction/start`。
- **期望**：**完整判据（predicate ＋ id 校验）拒绝它**；而 **`isCompactCheckpointSource()` 单独判定会接受它**。
- **意义**：坐实该谓词**必要不充分** ⇒ 主块 J4 的"证据 B"（id 校验）**不是多余工序**。
- ⚠️ 官方负向用例的**错误信息正则**在 `packages/compaction/compaction/tests/invariant.spec.ts`（469 行）⇒ 尽量**对齐官方的判据措辞**（这样我方断言与官方同构，将来换版可直接对账）。

**T4 · 断言位置（对照）**
- **做什么**：同一份数据，**分别在两个位置断言** —— (a) `session.events` ／ kernel 投影；(b) `session.deriveMessages()`。
- **期望**：**(a) 证明不了"发给模型的内容"**（这是官方第三方件 `byte-stability.test.ts` 头注**自曝其早期版本犯过的错**）。
- **意义**：坐实口径 ④ 的必要性；同时给出"在 (a) 上断言会怎么骗人"的**具体形态**（这比结论更有用）。

**T5 · A 落地的反向对照（双锚）**
- **做什么**：拿一份**未禁用 `command-compact`** 的 profile 发 `/compact` ⇒ 断言 `compaction/start` **出现** ＋ 返回 `Compacted N history items (~M tokens).`。
- **意义**：主块 J2 的"**无** `compaction/start`"若没有这条对照，就**无法与"环境坏了 ／ 命令根本没被识别"区分**。
- ⚠️ 与主块 J2 的反向对照**互为独立**（两方各做一次）⇒ 一致则升级为**跨通道互证**。

**T6 · 三态的构造性**（选做，视成本）
- **做什么**：造出 **(ii) 触发但摘要被截**（`maxTokens` 调小 ＋ 开 thinking）⇒ 断言 **`MAX_TOKENS` fail-closed**，且**它在上层与 (i) 没触发可分**（口径 ③ 的要害就是这两者**在 surface 上同形**）。
- **期望**：**只从事件侧**可分；⛔ 若你在 surface 侧也能分出来，那是**新发现**，请单列。

---

### 2 · 判据前置

1. **等主块交回**（场地相同 ＋ 需要其装置与 A 落地产物）。
2. **真 key**（T1–T4 ／ T6 需要；T5 需要但只在"未禁用"那份 profile 上）。⛔ 拿不到 ⇒ 只做 T3 ／ T4（**纯构造性，0 token**，且这两条恰好不依赖真调用）。
3. **临时 home 隔离**，⛔ 不动源 profile。
4. **两套 profile 并存**：① 主块的"已禁用 command-compact"版；② 你自己的"未禁用"版（T5 用）。⛔ 别混用同一份。

---

### 3 · 交付物

- 装置：`harness/scripts/run-34t-*.mjs`（头部含**姿势自证**）。
- 证据：`D:\Code\_claude-evidence\34t\<arm>\`（JSON ＋ 原始 log ＋ `README.md` 列 arm↔判据对应）。
- 退出码：`0` 通过 ／ `1` 判据失败 ／ `2` 前置缺失 ／ `124` 看门狗。
- **报告落点**：本文件（⛔ 不写 `docs/` —— 那是 WB 的维护面，有要改的在回报里提）。

---

### 4 · 参考件四要素（⭐ 照抄，勿另行转述）

> 全部**只读参考、不纳入依赖**（§3.0）。官方件读裸仓库 `ref/dsh-bare/`（锁 `dsh-v0.1.5-rc.2`），取用式 `git show dsh-v0.1.5-rc.2:<path>`（不必 checkout）。路径与行数均由 WB 于 2026-09-29 逐条实测存在（🟢）。

**件 1 · 负向判据正本（T3 ／ T4 的直接素材）**
- ① 路径：`packages/compaction/compaction/tests/invariant.spec.ts`（**469 行**）；`tests/tool-pairing.spec.ts`（**417 行**）；`tests/compaction.spec.ts`（**171 行**）
- ② 怎么参考：`invariant.spec.ts` 的 **18 条负向判据全带错误信息正则** —— 那是官方的"**拒绝理由**"，**可直接照抄成断言**；`tool-pairing.spec.ts` 是"**近文保留边界是否合法**"的现成机读判据。
- ③ 参考程度：**可抄断言 ／ 可与官方对齐措辞**（同版测试 = 零兼容风险）。
- ④ ⛔ 不可参考：官方测试夹具的**骨架**（我方可自建轻装置）。

**件 2 · 运行期校验器（T4 的第二组负向面）**
- ① 路径：`packages/core/session/src/surface.ts`（**566 行**）
- ② 怎么参考：找 `sourceEventSeqs must …` 那一组**运行期抛错**（`must include every shadowed surface node` ／ `must not be empty` ／ `must not contain duplicates` ／ `must reference earlier events`）。
- ③ 参考程度：**可抄断言**。
- ④ ⛔ 不可参考：它是**运行期校验器**，与 T3 引用的**测试层**是**两个层次** —— 两处都要，⛔ 别只做一层就声称覆盖。

**件 3 · 判据位置纪律的来源（T4 的"为什么"）**
- ① 路径：社区件 `ref/community/Tyan66666__billion-context-dsh`（⚠️ 若未落位则**按需浅克隆**：`git -c http.proxy= -c https.proxy= clone --depth 1 <url> <dst>`）
- ② 怎么参考：读 `tests/byte-stability.test.ts` 的**头注**（它自曝早期版本**在事件侧断言**这个错）。
- ③ 参考程度：**只借"这个坑真实存在"的事实**。
- ④ ⛔ 不可参考：**它的引擎实现**（依赖外部 `acp-kernel` 仓；且当日分支**活跃开发中** ⇒ 引用须带 sha）。

**件 4 · 观测装置的字段面（可选）**
- ① 路径：`ref/community/gendui123__dsh-compaction-probe`
- ② 怎么参考：**只借它的 JSONL 字段面**（`rawOutput` ／ `shadowedProbe` ／ `summaryProvider`）。
- ③ 参考程度：**只借字段名**。
- ④ ⛔ **它的判据在锚版恒红**（写 `session.events?.[seq]`，而锚版 `Session` **无**该成员 ⇒ 恒记 `readable:false`，**不可分态且反向误导**）⇒ ⛔ **不得当"现成可用装置"**；照抄它 = 照抄一个恒假读数。

---

### 5 · 场地器材

- **通道**：**Bash 工具**（⛔ 不用 PowerShell 工具 —— 该通道未启用 ConPTY，原生 exe 不执行、stdout 全空 ⇒ 会把**工具故障**伪装成**被测对象崩溃**）。
- **执行器**：`harness/node_modules/@deepseek-ai/dsh/lib/bin.js`（实读 `0.1.5-rc.2`）；**实测调用式**：`node harness/node_modules/@deepseek-ai/dsh/lib/bin.js --profile <p> …`
- **版本（⭐ 连通道一起核）**：`node v22.22.2`（取自 **WB 的 Bash 通道** ／ managed）。⚠️ **同机 system node 是另一支（`D:\App\node`）** ⇒ **以你的通道实测为准，对不上先报差异再动手**。
- **凭据**：⚠️ 已实测 `.dsh-home/.credentials.yaml` **不存在**；`~/.dsh/.credentials.yaml` **存在**；三处 `.env` **均不存在**。取哪一层见 `docs/production-env.md`（本稿不写值）。**值不得落版本控制 ／ 日志 ／ 回报**。
- **已知假绿坑**：① `--dump-config` 成功（只组配置树、不激活插件）；② `exit 0` 单独当判据（无 key 时同样 `exit 0`）；③ `log` 里能看到原文（官方压缩从不删 log ⇒ **恒真**）；④ 在 `session.events` 上断言（**T4 的靶子**）。
- **无副作用试验通道**：`dsh --patch <临时层.yml> --dump-config`（`--patch` 可重复叠加）—— ⚠️ 其警告**往往仍 `exit 0`**；⚠️ **判"未命中"必须先跑一个"必中的对照组"**。

---

### 6 · 回报格式

- **结论先行**：一句话给「**判据有判别力 ／ 存在恒真项**」。
- **逐条**：T1–T6 每条 → **做法 ＋ 期望 ＋ 实际 ＋ 判定**；⛔ 禁自述型判据（"验证过"）。
- **⭐ 强制自曝三项**：① 每条判据**"破坏它、它变红了吗"**的实测结果（含**未变红**的）；② 你自认为**可能被自动满足**的其他判据；③ **未观测项**（写成"未观测"，⛔ 不写成"不存在"）。
- **跨通道一致性**：凡与主块同题的结论，**逐条标"一致 ／ 分歧"**；分歧**并列留痕、⛔ 不合并**。
- **注明通道四元组**（宿主 shell ／ node 版本 ／ 权限 ／ 代理）—— 结论只写在你实测过的那条通道上。

---

### 7 · 禁区

1. ⛔ **不改 `docs/` ／ `TODO.md`**（WB 的维护面；有要改的在回报里提）。
2. ⛔ **不动 `.dsh-home/profiles/sdk` 源 profile**（一律临时 home 副本）。
3. ⛔ **不装社区件**（§3.0）。
4. ⛔ **不把 key 写进任何受版本控制的文件 ／ 日志 ／ 回报**。
5. ⛔ **不碰 CVM**。
6. ⛔ **不重判产品面**（保真度 ／ 中文摘要形态）—— 那不是本件的靶子。
7. ⛔ **不得以"主块已通过"为前提跳过破坏对照** —— 本件的价值恰在**不采信**。

**诚实边界**：本件只回答「判据有没有判别力」；⛔ 不得据此声称「3.4 机制成立」（那是主块 ＋ WB 复验的结论面）或「产品可接受」。

---

## 📥 DSH-3.4-T · 回报（独立测试件 · Claude ／ 本机 Windows · 2026-09-29）

> **结论先行：四条判据维度都有判别力**（每条都在**破坏／对照**下逼出了应有的红绿，不是"跑通一次"），⛔ **但主块报告里有 3 处「口径」原样照抄会失真**：
> ①「近文保留量 ≈3200」不是靶心 —— 源码级口径是 **`retainTokens` 下限 ＋ 按 surface 节点粒度向上吸附**（T2 三档实测 4804／9608／19216）；
> ② 主块探针的**事件侧**取字段路径 `ev.data.message.source` 实测**恒空**（34/34 行连键都没有），真实路径是 `event.data.source`（其 J4-B 取的是 `deriveMessages()` 侧，故结论不受影响）；
> ③「surface 缩小过」的"压前"读数只能锚在 `compaction/start`。
> ⛔ 本件**不判产品面**是否可接受（派发稿 §0／诚实边界）。
>
> **通道四元组**：宿主 shell = **MSYS bash**（`MSYSTEM`／`TERM` 见各臂 `preflight.json`）｜ node = **v24.14.1**（`D:\App\node\node.exe`；⚠️ 派发稿假设的 v22.22.2 **不成立** —— 与主块的 PowerShell 通道**同一个二进制、只是 shell 不同**）｜ 权限 = 同宿主（无提权）｜ 代理 = 未设（四组代理变量全空）。
> 执行器 `harness/node_modules/@deepseek-ai/dsh/lib/bin.js`（实读 `0.1.5-rc.2`）／链路 = **dsh SDK 通道**（`--profile sdk`，stdio 行分帧 JSON-RPC）／home = **临时副本**（`mkdtemp` ＋ `cp -r`，⛔ 源 profile 未动）／本件探针 = `harness/packages/plugin-34t-probe`（⛔ 非产品件，只进临时 home）。
> **证据**：`D:\Code\_claude-evidence\34t\<arm>/`（臂↔判据对照 ＋ 迭代期剔除说明见该目录 `README.md`）。

### T1 · 独立重跑 J4／J5／J6-iii（臂 `l2-2026-09-29T08-00-51`）

**做法**：自写探针 ＋ 自写夹具（**5 头 × 4800 token ／ `contextWindow=37000`**，⛔ 与主块不同粒度、不同容量）＋ 自写判据（⛔ 未复用主块的断言代码）。
**夹具自证（先证夹具真的生效，再看结论）**：`model-info.contextWindow=37000`（per-model 覆盖到位）；`agent/pre-step` 真读数 `[0,12601,17422,22243,27064,**31885**]` 跨过阈值 `floor(37000×0.8)=29600`，且**触发点恰在最后一头**。

| # | 判据 | 期望 | 实际 | 判定 |
|---|---|---|---|---|
| L2-3 | 双锚：**只压一次** ＋ 全部回合无错 | 三件套恰好各一 ／ 6 回合全 `completed` | `[start,summary,end]` ／ 6/6 `completed` | PASS |
| T1-J4a | 摘要注入（`deriveMessages()` 有 `source.kind=plugin ∧ source.plugin=compact`） | 有且 `chars>0` | i=1 `role=user` `chars=1707` | PASS |
| T1-J4b | nonce 逐字（**两处**：事件侧 summary 原文 ＋ 模型输入侧标记集） | 两处都有 | 两处都有（⚠️ 实测形状：`data.summary` 是**内容块数组**，⛔ 不是字符串） | PASS |
| T1-J4c | id 一致性 + **非空**（挡 `undefined===undefined`） | 四值逐字相同且非空 | `983e7b9d-…` ×4 | PASS |
| T1-J5a | 被压区间自洽 | seqs 非空、首尾=`shadowedRange` 两端、每个 seq 都在**当刻** surface 上 | `8..29` ／ `[8,9,13,20,21,28,29]` ／ `shadowedTokenCount=14591` | PASS |
| T1-J5b | 近文保留量的**尺** | **下界** `floor(37000×0.16)=5920` ≤ 保留量 < `0.8×window` | 保留 **9608**（2 个节点）／下界 5920 ⇒ 吸附 +62.3% | PASS |
| T1-J6 | 状态 (iii) 完好（**只从事件侧**） | 三件套齐 ＋ `end.error=null` ＋ surface 节点数**缩小** | 12 → 8（−4）；压后总 token 17778 < 29600 | PASS |
| T4-1 | (a) 事件侧压后**仍含全部原文** | (a) 的 FILL 标记数 > (b) | (a) 1055 ／ (b) 428（被压 627） | PASS |
| T4-2 | (a) 与 (b) **同刻不同读数** | (b) 字符 < (a) | (a) 96564 ／ (b) 44819 | PASS |
| T4-3 | ⭐ **无容差**定向对照 | `被压标记 − 摘要引用` 在 (a) 一个不少 ／ 在 (b) 一个没有 | 应消失 **627** 个 ⇒ (a) 侧 627、**(b) 侧 0** | PASS |

⇒ **与主块同题的三条（J4／J5／J6）在我这条独立实现上全部复现**（夹具／探针／判据代码／节点粒度全不同）。

### T2 · ⭐ 尺的单调性（臂 `t2-2026-09-29T08-03-21`）

**做法**：同一夹具，只改 `compaction-basic.config.retainRatio`：`0.02` ／ `0.5`（基线 = l2 的 `0.16`）。
**期望**：近文保留量随 ratio **单调增**；若不变 ⇒ J5 的"尺"维度作废。

| ratio | `retainTokens` 下限 | 实测保留量 | 保留节点数 | 双锚（摘要注入＋三件套成对＋id 一致＋回合无错） |
|---|---|---|---|---|
| 0.02 | 740 | **4804** | 1 | 全绿（6/6 `completed`） |
| 0.16（l2 基线） | 5920 | **9608** | 2 | 全绿 |
| 0.5 | 18500 | **19216** | 4 | 全绿（6/6 `completed`） |

⇒ **尺有判别力**：三档保留量 4804 < 9608 < 19216，**且逐档 = `floor(window×ratio)` 在节点粒度上的向上取整**（0.02 → 1 个 4804 节点；0.5 → 4 个共 19216）—— 与 `selectCompactableRange` 源码逐字吻合（`accumulated += pricedNodes[index].tokens`，够 `retainTokens` 即 break）。⇒ ⭐ **"≈3200"应改写成「≥ `floor(window×ratio)` 的下界 ＋ 节点吸附」**；主块的 "+6.4%" 只是因为它的节点够细，换粗节点会立刻失真（我第一版夹具 +200%）。

### T3 · ⭐ 谓词假阳性／完整判据（臂 `t3-…08-11-54` 与 `t3m-…08-12-50`，**0 token**）

**做法**：进程内解析官方 `dsh-compaction/lib/types/checkpoint.js`（**路径 ＋ sha256 留痕**）→ 拿真 `isCompactCheckpointSource` 判三组**构造** source → 再把**同形**的伪造事件（`user/message` ＋ `surfaceOp=replace`，只差 `source`）投进真链路，两臂：**未挂载** ／ **挂载**官方伴生件（`@deepseek-ai/dsh-invariants` ＋ `@deepseek-ai/dsh-compaction/invariant`）。

| 观测 | 未挂载臂 | 挂载臂 |
|---|---|---|
| `isCompactCheckpointSource({kind:'plugin',plugin:'compact'})`（**无** compactionId） | `true` | `true` |
| 同上 ＋ `compactionId:'T3-BOGUS-NO-MATCH'` | `true` | `true` |
| 对照（换 plugin 名 `compaction-tool-result-pruner`） | `false` | `false` |
| `ctx.get('invariants')` | `null`（**无执行者**） | 有（`registrations` 等） |
| 投毒投递（伪造 source） | **threw=false**（零拒绝） | `InvariantError`：`compaction checkpoint has no matching compaction/start` |
| 投毒投递（只有标记、无 id） | **threw=false** | `InvariantError`：`compaction checkpoint compactionId must be a non-empty string` |
| 同形对照投递（非 compact 来源） | threw=false | **threw=false**（⛔ 不误伤） |

⇒ ⭐ **半判据必要不充分坐实**：谓词对"只有标记"与"标记＋假 id"**都收**；**完整判据**（`validateCheckpoint` 要求与打开中的 `compaction/start` 逐字同 id）只对投毒来源触发、对照不触发 ⇒ 既非恒真、也不是恒假。
⇒ ⚠️ **本 profile 产品侧零防护**：未挂载臂下伪造 checkpoint 投递**不被任何东西拦**（`invariants` 服务为 `null`；两件在 CLI 树里**可解析但未挂载**）⇒ ⛔ 不得声称"产品会拒绝伪造 checkpoint"。

### T4 · ⭐ 断言位置（含在 T1 表内，此处只记结论）

同一份数据、同一时刻：(a) `snapshotEvents()`／kernel 投影 **1055** 个 FILL 标记 ／ (b) `deriveMessages()` **428** 个；字符 96564 vs 44819；被压 seqs 携带的 633 个标记里，扣除摘要逐字引用的 6 个后 **627 个在 (a) 侧一个不少、在 (b) 侧一个没有**。⇒ **在 (a) 上断言"原文不见了"恒假**（它永远看得见），**"发给模型的内容"只能在 (b) 上断言**。

### T5 · A 落地反向对照（臂 `t5-2026-09-29T08-10-13`）

| # | 判据 | 期望 | 实际 | 判定 |
|---|---|---|---|---|
| T5-1 | 禁用 profile 下执行 `/compact` | 命令表**无** `compact` ＋ **不产生** `compaction/start` | `names=["feedback","goal","permission","plan"]`；`compaction/*=[]`；`exec.result=null` | PASS |
| T5-2 | 未禁用 profile（反向对照） | 有 `compact` ＋ 出现 `compaction/start` ＋ 反馈 `Compacted N history items` | `start,summary,end`；`Compacted 2 history items (~2140 tokens).` | PASS |
| T5-3 | ⭐ 手动／自动**可分**（主块未用） | `compaction/start.data.sourceCommandId` 手动=非空串 ／ 自动=空 | 手动 `cmd-b6ca467f-1` ／ 自动 `null`（l2／t6 臂） | PASS |

⚠️ **主块 J2-b 的"成功反馈文案未观测"我这里观测到了**（原文见上）。⚠️ 手动路径素材不足时会走**官方 fail-closed**：`Compaction could not produce a useful summary. The conversation is unchanged…`（本轮 `t5-…08-06-51` 实撞一次）—— 该文案可用于把「没压」与「压不动」分开。

### T6（选做）· 状态 (ii)：触发但摘要被截（臂 `t6-2026-09-29T08-08-17`）

**做法**：同夹具，`compaction-basic.config.maxTokens=16` 逼摘要截断。
**实测**：`compaction/end.data.error = "summarization truncated at the token cap (incomplete checkpoint)"`（**与主块 J7 的错误串逐字相同**）；`compactionTypes=[start,end]`（**无 summary**）；`deriveMessages()` 里 checkpoint **0 条**（半成品不进模型输入）；6/6 回合仍 `completed`（**这条失败不打断回合**）。
**三态在 surface 上的形状**（我**独立量**，末次 idle 快照逐字段）：

| 态 | 臂 | surface 节点 ／ messages ／ (b) 侧 checkpoint ／ 带标记节点 |
|---|---|---|
| (i) 没触发 | `below-…08-06-04` | **14 ／ 14 ／ 0 ／ 5** |
| (ii) 截断 | `t6-…08-08-17` | **14 ／ 14 ／ 0 ／ 5** |
| (iii) 完好 | `l2-…08-00-51` | 8 ／ 8 ／ 1 ／ 3 |

⇒ ⭐ **(i) 与 (ii) 在 surface 视图上逐字段同形**，只能从**事件侧**分开（(i) 零条 `compaction/*`；(ii) 有 `start` 且 `end` 带 error）—— 与主块 J6 的口径③**独立一致**，且这是我自己的数值证据。

### ⭐ 自曝（派发稿 §6 强制三项）

**① 每条判据"破坏它、它变红了吗"（含未变红）**
- T2 尺：改 ratio ⇒ 保留量**变了**（4804／9608／19216）；**未**出现"不变" ⇒ 该维度**不是**恒真项。
- T3 谓词：换 plugin 名的对照 ⇒ **变红（false）**；投毒 source ⇒ 未挂载臂**没有拒绝**（我的断言恰是"不拒绝"，作**防护命题**是红的）⇒ 我据此只敢说"本 profile 无执行者"，⛔ 不外推。
- T4 断言位置：同一份数据换位置 ⇒ 结论会翻（627 个标记在 (a) 全在／在 (b) 全无）⇒ 位置敏感，非恒真。
- J6 三态：三态实测可分（上表）。
- ⛔ **一条"未变红"的是判据口径本身**：T1-J5b 我第一版照主块口径写"≈3200"，在粗节点夹具下直接 FAIL（9616 vs 3200，**+200%**）—— 那不是判据错，是**口径**错；改成"下界 ＋ 吸附"后 PASS（+62.3%）。⇒ **该判据的判别力依赖夹具节点粒度，⛔ 不可当普适判据搬用**。
- ⛔ **我的装置第一版被自己的对照锚拦下**：T3 首版伪造事件用 `seq:999999` ⇒ 触发无关的投影校验（`session projection "title" cannot advance across missing seq`），**投毒臂与对照臂同错 ⇒ 不可归因**；改成 `seq=末尾+1` ＋ 当刻 surface span 后才成为决定性证据（首轮留痕在 `t3-…07-20-24`）。
- ⛔ **装置时序自曝**：`compaction/*` 出现**不等于**该回合结束（摘要是数十秒的 LLM 调用）；我第一版等到"有动静"就关 driver ⇒ 实测 `compaction/end.error="DeepSeek request aborted by caller"`，会把**装置杀进程**误读成产品 fail-closed（`l2-…07-51-26`）。

**② 我自认为可能被自动满足的判据**
- `T4-1`（(a) 侧"原文都在"）**故意接近恒真**（日志从不删原文）—— 它的用途是**展示陷阱**，⛔ 不可当产品判据用。
- `T1-J4a`（"存在 compact 来源的消息"）只要压过就近乎必然成立；真正挡假绿的是 **J4c 的非空 id 逐字一致**。
- `T2-2` 的 `≥ floor(window×ratio)` 单独看是弱断言（保留量足够大就真），必须与 T2-1 的单调性 ＋ `< 0.8×window` 上界**合读**。
- `T5-3`（`sourceCommandId` 非空）**只在手动压成功时有值** ⇒ 必须与自动臂的 `null` 并列读，⛔ 不可单用。
- `B-2`（below 臂"没压是真的没压"）中 `viewB 标记数 == viewA 标记数` 在**未压**时必然相等 ⇒ 信息量靠 `turnEnd` 全 `completed` 这条双锚兜底。

**③ 未观测（⛔ 不写成"不存在"）**
- **orphaned lock（有 `start` 无 `end`）未观测**：本轮唯一一次"start 无 end"是**我自己**把 driver 停在摘要生成中造成的 ⇒ 记**装置口径**，⛔ 不记为产品观测。
- `compaction/summary` 快照**落在替换之后**的情形**未观测**（本轮 summary 当刻与 start 当刻读数相同，都是 12 节点）。
- 0.5 档保留量只观测 **1 次**，未做重复性；`compactionRetries=1`（源码默认）**重试穷尽后抛错**的路径本轮未复现。
- T3 挂载臂只测了**两条构造事件**，⛔ 未观测它在**真实** compaction 流下的行为。
- `context-overflow`（L5）／真 1M 容量（L4）**未覆盖**（派发稿边界）⇒ 结论⛔ 不外推。

### 跨通道一致性（与主块同题，逐条标）

| 题 | 主块（PowerShell ／ 同 node 二进制） | 本件（MSYS bash） | 标 |
|---|---|---|---|
| J4 摘要注入 ＋ nonce | PASS（两臂皆真） | PASS（`data.summary` 是内容块数组，非字符串） | **一致**（我方补形状） |
| J4-B id 一致性 | PASS，记作 `sourceCompactionId` | PASS，字段是 **`source.compactionId`**；我已独立核其**非空** | **一致**（键名订正：`sourceCompactionId` 是探针 JSONL 键名，⛔ 不是上游字段名） |
| J5 被压区间 | `8..13`／`[8,9,13]`／`4927` | `8..29`／`[8,9,13,20,21,28,29]`／`14591` | **一致**（夹具不同，结构同） |
| J5 的"尺" | 实测 3404 ≈ 3200，**+6.4%**，"在数量级内" | 保留量是**下界**，按节点吸附；我 +62.3%（9608 vs 5920） | ⚠️ **分歧（口径）**：不是"≈ 靶心／数量级内"，是 **≥ 下限 ＋ 节点粒度吸附** |
| J6 三态可分 | PASS（(i)(ii) surface 同形） | PASS，且我**独立量到** (i)(ii) 逐字段相同（14/14/0/5） | **一致**（我方补数值） |
| J7 摘要截断 fail-closed | PASS，错误串 `summarization truncated at the token cap…` | **独立复现同一错误串** | **一致** |
| J2-b 手动成功文案 | **未观测**（SDK 通道不派发斜杠命令） | 用运行期等价物观测到 `Compacted 2 history items (~2140 tokens).` | **补充**（同一"运行期等价物"口径） |
| 探针**事件侧**取字段路径 | `ev.data.message.source` | 实测**该路径恒空**（主块 j3-at-16000 的 34 条事件行**连键都没有**；正路 = `event.data.source`，我方同源事件读得到 `plugin/compact` ＋ id） | ⚠️ **分歧（路径）**，⚠️ 但**不影响主块的结论**（其 J4-B 取的是 `deriveMessages()` 侧，那侧取值正确且非空） |
| J3 阈值边界（15999／16000） | PASS（当刻读数） | **未复跑**（本件靶子不是边界） | 未观测（不做） |

### 交付物与建议

- 装置：`harness/scripts/run-34t-probe.mjs`（头部含姿势自证；退出码 `0/1/2/124`）＋ 探针 `harness/packages/plugin-34t-probe/`（⛔ 非产品件）。
- 证据：`D:\Code\_claude-evidence\34t\`（臂↔判据 ＋ 迭代期剔除见 `README.md`）；回执 = 本段。
- **建议（⛔ 不自行改 `docs/`／`TODO.md`）**：把三处口径写进 `TODO.md` 的 3.4 段作为**判据订正** —— ① 保留量改"下界＋吸附"；② 事件侧字段名改 `event.data.source`（并注明 `sourceCompactionId` 只是探针键名）；③"压前"读数锚 `compaction/start`；④ 若要判"产品会拒绝伪造 checkpoint"，先确认 `invariants` 执行者**是否挂载**（本 profile 实测：未挂载 ⇒ 零防护）。
- ⚠️ **临时测试 Key 用毕，请老大关闭**（Tier 0 红线①要求）。

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

---

## 🗂 已清理段落（按交流区规矩）

- **2026-09-29 清理**：删除 `DSH-3.4-R · 参考件广撒网调研` 的全部段落（派发稿 ／ 调研报告 ／ 补充调研 ／ 融合轮）—— 已闭环并收口 ⇒ **权威落点 = `docs/dsh/dsh-34-ref-research.md` §1–§10（规则留痕）＋ §11（汇总）**，`TODO.md`「DSH-3.4」段有登记。回溯：`git log -p -- exchange/log-claude.md`。

- ⚠️ **保留未闭环项**：`## ⚠️ 待裁（Tier 0 红线③）：/dev/shm 的 RemoveIPC 归因` —— 该段**尚未裁定**，原样留在本文件（不属"已闭环"）。

---
