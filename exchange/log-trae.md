# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.8.1 ／ 3.8.2** | Trae | 本机（Windows） | ✅ **均已回报 · WB 复核成立（2026-09-22）** —— `3.8.1`（driver 成型：`PASS 22 ／ FAIL 0 ／ OBS 10 ／ 未验 0`）／ `3.8.2`（3.8.1 装置缺陷修复：A1 ／ A2 ／ A3 ／ B1 ／ B2 全条成立，`J3-c` 的构造性恒真**已被证伪**）⇒ 判定 ／ 证据 ／ 遗留 = `TODO.md`「DSH-3.8」段 | 2026-09-22 |
| **DSH-3.4-R** | Trae | 本机（联网检索 · 只读参考） | ✅ **已收口（2026-09-28）** —— 调研 ＋ 融合轮全数汇总进 `docs/dsh/dsh-34-ref-research.md` **§11**（原段已按交流区规矩清理）｜⚠️ 其中三处**订正过我自己的报告**（`includePrerelease` 记录错误／名录落点说反／`dsh-dcp` 与 `ljsysfurryACE` 的时点），详见 §11.4 ／ §11.6 | 2026-09-23 |
| **DSH-3.4** | Trae | **本机（Windows）** | 🚀 **已派发（2026-09-29）· 待起跑** —— S2 compaction 接入：**① A 落地**（显式禁用 `command-compact`）**② 验收 J1–J8 ③ 采数**（供产品面决策）。⚠️ **接入面已天然就位**（`compaction-basic` ／ `command-compact` ／ `tool-result-pruner` 三件在本机 sdk profile **默认装配**，WB 已实测）⇒ **本块不含「写新插件」**。派发稿 = 本文件 `## 📤 DSH-3.4` 段；判据 ／ 边界 ／ 遗留 → `TODO.md`「DSH-3.4」段 ＋ `docs/dsh/dsh-migration.md` §3.6 两节 | 2026-09-29 |

- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3」区**（**一处两面**）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯时用 `git log -p -- exchange/log-trae.md`。
- ⭐ **派发前已重测前提（WB 2026-09-22）** ⇒ **8 条实测**，其中 **2 条推翻旧登记**（`--patch` 通道实测验有 ／ **gateway 装配层结论翻转**）、**1 条前提缺口**（`DEEPSEEK_API_KEY` 当时不存在 —— 当日已闭合）⇒ 摘要与权威落点 = `TODO.md`「DSH-3.8」段。**逐条对账，别照抄旧前提。**
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.2.1 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— ⛔ **本条后半句已作废（2026-09-20 WB 复验实测推翻）**：原文写「本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，**出现英文即非本机原始产物**）」—— **「出现英文即非本机产物」不成立**：本机实测 `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统／用户 UI 语言实测是 zh-CN）。⇒ **保留前半**（⛔ 不得人工改写 ／ 意译），**撤掉后半的推论**。**替代纪律**：判「原文」只认**字节级**核对（按 ACP 936 解 GBK，或直接比原始字节），并**注明该段取自哪条通道**；**语言 ／ 编码不得作"证据是否被后处理"的判据**。详见 `docs/local-env.md` §12.6。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

## 📤 DSH-3.4 · S2 compaction 接入（派发于 2026-09-29）

**执行人**：Trae ｜ **场地**：本机 Windows（沿用 3.3 先例）｜ **前置依赖**：无（3.3 两段已交回并复验）
**权威落点**：`TODO.md`「DSH-3.4」段 ＋ `docs/dsh/dsh-migration.md` §3.6〈DSH-3.4 · S2 判据口径四条〉／〈DSH-3.4 · S2 compaction：测试量级阶梯与预算〉。**本段只放「怎么做」**，判据 ／ 边界 ／ 遗留一律回上面两处核。

---

### 0 · 目标（一句话 ＋ 一处必须先拆开的东西）

**要回答的一件事**：在**自动压力路径**下，DSH 的 compaction 是否**真按我们写死的口径**工作 —— 即「**摘要被注入**」＋「**近文原文保留**」两条**同时成立**，且**可机读验证**。

⚠️ **两个结论必须显式拆开**（混报会把「机制成了」读成「产品成了」）：
- **（甲）机制成立** ← **本块要判的**。
- **（乙）产品可接受** —— 保真度（生成式摘要 vs 逐字）／ 中文会话摘要形态是否满足 2.9.2 要求 ← **本块只采集数据，⛔ 不给判定**（属产品决策，见 §7）。

**本块三件事**：① **A 落地**（禁用 `command-compact`）② **验收**（J1–J8）③ **采数**（供 §7 的决策）。

---

### 1 · 判据（逐条编号；每条写明"取什么证据"＋"缺这条即未闭合"）

> **⭐ 本组判据的共同前提 —— 已由 WB 于 2026-09-29 实测（Bash 通道 ／ node `v22.22.2`），请勿再按旧假设推导**：
> 本机 `sdk` profile（`dsh.profile.bundles = @deepseek-ai/dsh-base ＋ @deepseek-ai/dsh-sdk-app`）的配置树里，**`compaction-basic` ／ `command-compact` ／ `tool-result-pruner` 三件已默认装配**（`--dump-config` 实读：`:238-241` ／ `:284-287`）。
> ⇒ **接入面已天然就位 ⇒ 本块不含「写新 compaction 插件」**。本块的代码量集中在**装置与验收**，不在产品插件。

**J1 · 配置层真被读入**（L0 档 · **0 token**）
- **做法**：在我方 patch 里对 `compaction-basic` 设 `retainRatio: 0.9`（≥ 默认 `thresholdRatio` 0.8）。
- **期望**：**load 期抛错** —— `retainRatio (0.9) must be less than the resolved thresholdRatio (0.8)`（`compaction-basic/src/config.ts:185-190`，🟢 已实读）。
- **双锚（必做）**：同一 profile **去掉该行 ⇒ 不抛错** —— 否则"抛错"可能来自别的层，与本判据无关。
- **顺带**：塞一个未知 key（如 `maxToken:`）⇒ 抛 `unknown key "maxToken"`（同文件 `:278-281`）。
- ❌ **不得用 `--dump-config` 的成功 ／ 失败作本判据** —— 它是**假绿源**（只组配置树、不激活插件；见 `TODO.md` 贯穿规则）。本判据要的是 **load 期真抛**。

**J2 · 手动入口「不存在」**（L0‑A 档 · **0 token**）—— ⭐ **A 裁定的落地验收**
- **先决**：把 `command-compact` 在我方 profile 里**显式 `disabled`**（base bundle `:325` **默认启用**，注释原文 "Human `/compact` … **below the automatic threshold**"）。
- **期望**：真实会话里发 `/compact` ⇒ **无 `compaction/start` 事件**、无 compact 反馈文本。
- **⛔ 不得只靠 `--dump-config` 作证**（同上，假绿源）。
- **反向对照（必做，双锚）**：拿一份**未禁用**的 profile 发 `/compact` ⇒ **应出现** `compaction/start` ＋ 返回 `Compacted N history items (~M tokens).`（`command-compact/src/index.ts:66-70`，🟢 已实读）。
  ⇒ 这一条同时是"无事件"**不是因为环境坏了**的对照。⛔ 缺它则 J2 的"没有"不可采信。

**J3 · 自动路径触发**（L2 档 · ≈5 万 input）
- **做法**：`defaultContextWindow: 20000`（或该 model 的 `contextWindow`）＋ **必须 2 个 turn**。
  ⚠️ **为何必须 2 个 turn**：`routedTarget()` 读 `session.requestHeader()`，**首轮 pre-step 无 header ⇒ 直接返回 `null` 不压**（`index.ts:53-61, 265`）⇒ 第 1 个 turn 只负责"灌填充 ＋ 建立 header"，第 2 个 turn 才压。
- **期望**：第 2 个 turn 出现 `compaction/start`。
- **⭐ 阈值边界双跑（硬证据，别省）**：造 **15,999 与 16,000** 两侧 ⇒ 期望 **不压 ／ 压**。这是"真按 `floor(容量 × 0.8)` 算"的唯一硬证据。
- **填充一律 ASCII**（⛔ 不用中文）：官方 token 估算按 **UTF-16 code unit ÷ 4** 的启发式**严重低估 CJK**（`token-meter/README.md:64,148`）⇒ 中文填充会把**真实**花费成倍抬上去，且压力不可控。

**J4 · 摘要注入**（L2）
- **证据 A（机读）**：`session.deriveMessages()` 的输出里存在 `user/message`，其 `source.kind === 'plugin' ∧ source.plugin === 'compact'`。
- **证据 B（⭐ 必须加这一层）**：**校验该 checkpoint 的 `compactionId` 与 `compaction/start` 事件的 id 一致**。
  ⚠️ 理由：`isCompactCheckpointSource()` **只看 `kind` ＋ `plugin`、不校验 `compactionId`** ⇒ **单用它会有假阳性**（任何 `{kind:'plugin',plugin:'compact'}` 的 user 消息都判真）。官方自己的完整判据 = **predicate 定位 ＋ invariant 校验 id**（负向用例＋错误信息正则见 `packages/compaction/compaction/tests/invariant.spec.ts`）。⇒ 该谓词是**必要不充分**，**不得单独构成"摘要注入成立"**。
- **证据 C（nonce）**：在被压区间里埋一个**独占 nonce** ⇒ 断言它**逐字出现在摘要文本中**。
  ⚠️ 诚实边界：官方摘要提示词**明文要求保留 identifiers**（`summarizer.ts:61`）⇒ 判据有背书，但**仍非保证**（LLM 非确定性）。**nonce 丢失 ⇒ 报"未通过"，不要报"机制不成立"**（两者是不同结论）。

**J5 · 近文原文保留**（L2）—— 口径 ①②④ 的验收面
- **证据**：`session.deriveMessages()` **输出尾部**逐字含「**被压区间之后的原文节点**」。
- **⛔ 两个"不算"**：**log 里有不算**（官方压缩从不删 log，该层恒真 ⇒ 作判据等于没验）／**「能回取」不算**（那是 tool-output 压缩生态位）。
- **尺 = `retainRatio`（默认 0.16）** ⇒ 期望保留量 ≈ `floor(被压区间 token × 0.16)`（`config.ts:144-147`）。
- ⚠️ **只做数量级报警，不设精确区间**：实测若 `< 1%` 或 `> 50%` 于期望值 ⇒ **报出并解释**（可能实际走了 `retainTokens` 或 `preserveRecent` 而非 ratio）。
- ⚠️ **实测值 ≠ 配置的线性结果**：保留区还经 `toolPairingBalancedBefore` **向前吸附**到 tool-call/result 配对安全边界（`region.ts:132-146`，🟢 已实读）⇒ 报数时把"吸附"算进解释，别当偏差。

**J6 · 三态可分**（L2）—— 口径 ③
- 三态：**(i) 没触发** ／ **(ii) 触发了但摘要被截** ／ **(iii) 完好**。
- ⚠️ **(i)(ii) 在 surface 上完全同形**（都表现为"没有替换发生"）⇒ **只从事件侧判**：`compaction/start` ／ `compaction/summary`（带 `rawOutput` ＋ `usage`）／ `compaction/end`。
- **有 `start` 无 `end` ⇒ 失败态（orphaned lock）⇒ 必须 fail-loud 报出**，⛔ 不得静默当"没触发"。

**J7 · 摘要截断 = fail-closed**（负向对照）
- **做法**：`maxTokens` 调小（如 256）＋ 开 thinking 逼出 `max-tokens` 终局。
- **期望**：抛 **`MAX_TOKENS`**（`summarizer.ts:194-207`：`error.code = 'MAX_TOKENS'`，🟢 已实读）、**不注入半截摘要**、保留最新 durable surface。
- ⚠️ **诚实边界（请一并观察，观察不到就写"未观测"）**：该检测**依赖 provider 如实上报 `max-tokens` 终局** —— **不上报**才是"静默注入半截"的可能路径（本轮请留意是否出现）。

**J8 · 成本**（L2）
- **证据**：`compaction/summary` 事件**自带 `usage`** ⇒ 报出该次摘要调用的实际 input ／ output。
- **对照**：量级阶梯的预算（主线 L0＋L2 ≈ 5–10 万 input）／ 硬上限 **5000 万 token**（安全网，⛔ 不是花销目标）。

---

### 2 · 判据前置（不满足 ⇒ 实验根本没跑起来，会得到假阴性）

1. **真 key**：J3–J8 需要（J1 ／ J2 **不需要**）。取哪一层凭据见 §5；**当前本机主流通道上 `DEEPSEEK_API_KEY` 为空、`backend/.env` 不存在 ⇒ 起跑前先确认拿到**。拿不到 ⇒ 见 §5「无 key 的降级路径」。
2. **临时 home 隔离**：`cp -r` 一份 `.dsh-home/profiles/sdk` 的**真副本**到临时 home（照 3.3-b 的姿势），⛔ **不许就地改源 profile**。
3. **A 落地先行**：J2 依赖"`command-compact` 已被禁用"⇒ 该改动要在跑 J2 **之前**完成；且 J3–J8 全程须保持"手动入口已禁用"状态（否则验收跑在一条**产品上不存在**的链路上）。
4. **每次跑前清临时 home**：⛔ 别复用上一臂的 home（3.3-b 的教训：残留会伪装成"选型问题"）。

---

### 3 · 交付物

- **装置**：`harness/scripts/run-34-*.mjs`（命名自定）—— ⚠️ 头部必须有**姿势自证**一行：本脚本模拟的是**哪条真实链路**（哪个执行器 ／ 哪层前导 ／ 哪个 home+profile ／ 哪条凭据层）。
- **A 落地的受控源**：禁用行**不得只写在 profile 的 `cordis.patch.yml` 里** —— 该文件在 `.dsh-home/`（**受 `.gitignore` 管、不入库**）⇒ 必须有一份**受版本控制的源文件**（照 3.7 的 `sandbox-dialect.mount.patch.yml` 先例），再由它复制进 profile。
- **证据**：`D:\Code\_trae-evidence\34\<arm>\`（JSON ＋ 原始 log ＋ 一份 `README.md` 列 arm 与判据对应关系）。
- **退出码约定**：`0` 通过 ／ `1` 判据失败 ／ `2` 前置缺失 ／ `124` 看门狗超时。

---

### 4 · 参考件四要素（⭐ 照抄，勿另行转述）

> **总纪律**：全部**只读参考、不纳入依赖**（§3.0）。官方件读**裸仓库**：`ref/dsh-bare/`（锁 `dsh-v0.1.5-rc.2`），取用式 `git show dsh-v0.1.5-rc.2:<path>`（**不必 checkout**）。下列路径 ＋ 行数均已由 WB 于 2026-09-29 **逐条实测存在**（🟢）。

**件 1 —— 契约与判据正本（官方）**
- ① 路径：`packages/compaction/compaction/tests/invariant.spec.ts`（**469 行**）／`tool-pairing.spec.ts`（**417 行**）／`compaction.spec.ts`（**171 行**）
- ② 怎么参考：读**测试**（不是读实现）——`invariant.spec.ts` 的 **18 条负向判据全带错误信息正则**，可直接照抄成我方断言；`tool-pairing.spec.ts` 是「**近文保留边界是否合法**」的现成机读判据；`compaction.spec.ts` 给契约形状 ＋ `isCompactCheckpointSource()` 的**规范用法**。
- ③ 参考程度：**可抄形状 ／ 可抄断言**（这是"零兼容风险"的一档：它就是锚版自己的测试）。
- ④ ⛔ 不可参考：**它的测试装置骨架**（`@deepseek-ai/dsh-testkit` 一类的夹具）—— 我方装置走自己的临 home 路线，别把官方夹具搬进来。

**件 2 —— 切点算法与摘要行为的权威实现（官方）**
- ① 路径：`packages/compaction/compaction-basic/src/{index,config,region,summarizer,types}.ts`；测试 `tests/compaction-basic.spec.ts`（**2 138 行**）／`tests/compaction-loop-repro.spec.ts`（**505 行**）
- ② 怎么参考：**先读 `config.ts` ＋ `region.ts` 定死"尺与切点"**，再读 spec 看官方自己怎么断言。`compaction-basic.spec.ts` 是**切点算法的判据**（向头部取整保 tool 对 ／ 计费口径 ／ 重试上限）。
- ③ 参考程度：**只借设计 ／ 可抄断言形状**；**实现不得照搬**（本块不写 Provider）。
- ④ ⛔ 不可参考：`tests/manual-compaction.spec.ts`（889 行）中**与手动 `/compact` 相关的部分** —— **本次已裁 A（不做该入口）**，其并发 ／ 排队／取消语义对我方**当前不适用**（**唯一可用的是"失败分类"那一节**，仍可参考）。

**件 3 —— 工具结果遮蔽（官方，产品 2.9.2 的「最划算第一步」）**
- ① 路径：`packages/compaction/compaction-tool-result-pruner/`（`src/` 三件 ＋ `tests/tool-result-pruner.spec.ts`，**280 行**）
- ② 怎么参考：读 `src/config.ts` 确认 `thresholdChars`（本机实读默认 **8192**）语义；读实现确认"遮蔽后原文是否仍可回取"。
- ③ 参考程度：**只借设计**（官方默认路径，产品文档说这条路"正好就是官方默认顺序"）。
- ④ ⛔ 不可参考：**别把它的"遮蔽"当成 J5 的"近文保留"** —— 两者是**不同生态位**（tool-output 压缩 vs conversation compaction），口径 ① 已写死区分。

**件 4 —— 子系统文档（官方）**
- ① 路径：`docs/subsystems/compaction.md`（**238 行**）；配套 `packages/core/session/src/surface.ts`（**566 行**）
- ② 怎么参考：先读文档拿**全景与术语**，再读 `surface.ts` 的**运行期校验器**（`sourceEventSeqs must …` 那一组抛错）。
- ③ 参考程度：**只借设计与术语**。
- ④ ⛔ 不可参考：文档里的**示例行号**可能与实现漂移 ⇒ **以实读源码为准**。

**件 5 —— 社区件（⛔ 本块原则上不用；仅两件供"判据校准"）**
- ⚠️ **本块的交付面是"官方默认路径 ＋ 验收"，不需要社区件**。若 J5 出现"保留量异常"需要校准口径，才看这两件（**只读，⛔ 不装**）：
- ① 路径：`ref/community/giter00__dsh-headroom`（「可回取」路线）—— **用途仅是校准我方判据口径，防把第二态误杀**；④ ⛔ 不可参考：**它的 store 与外呼设计**（生态位不同）。
- ① 路径：`ref/community/gendui123__dsh-compaction-probe`（观测装置）—— ② 仅参考其**字段面**；④ ⛔ **它的判据在锚版恒红**（写 `session.events?.[seq]`，而锚版 `Session` **无**该成员 ⇒ 恒记 `readable:false`）⇒ **不得登记为"现成可用装置"**，要用必须先改。

---

### 5 · 场地器材

- **通道**：**Bash 工具**（⛔ 不用 PowerShell 工具 —— 本机该通道未启用 ConPTY，原生 exe 不执行、stdout 全空，会把"工具故障"伪装成"被测对象崩溃"）。
- **执行器**：`harness/node_modules/@deepseek-ai/dsh/lib/bin.js`（实读 `0.1.5-rc.2`）。
  **实测调用式**（请先自证版本再动手）：`node harness/node_modules/@deepseek-ai/dsh/lib/bin.js --profile <p> …`
- **版本（⭐ 连通道一起核）**：`node v22.22.2`（取自 **WB 的 Bash 通道** ／ managed 路径）。⚠️ **同一台机器上 system node 是另一支（`D:\App\node`）** ⇒ **以你的通道实测为准；对不上先报差异、再动手**，别当"稿子写错了"。
- **home 与凭据**：
  - 工程 home = `.dsh-home/`（`DSH_HOME` 显式指，勿靠默认回落到 `~/.dsh`）。
  - ⚠️ **已实测：`.dsh-home/.credentials.yaml` 不存在**；本机 `~/.dsh/.credentials.yaml` **存在**；项目 ／ `backend` ／ `harness` 三处 `.env` **均不存在**。
  - **凭据取哪一层 ⇒ 见 `docs/production-env.md`**（本稿⛔不写值）。**值不得落任何受版本控制的文件、日志、工具输出或回报**。
  - **无 key 的降级路径**：先跑 **J1 ＋ J2**（0 token，可完整交付），**回报并按 J1／J2 判定收口**，同时单列"J3–J8 待 key"⇒ **不要**用假 key 硬跑（会得到 AUTH 红灯，与"机制不成立"混淆）。
- **⭐ 已实测的场地事实（照用，别重测）**：`--dump-config` **每次都会写** `$DSH_HOME/profiles/<p>/cordis.yml`（恒为 223 B 模板、幂等）⇒ **别拿它的 mtime 判污染**；且它**只组配置树、不激活插件** ⇒ **是假绿源**。
- **无副作用试验通道**：`dsh --patch <临时层.yml> --dump-config` —— `--patch` **可重复叠加**、叠加在 profile 层之后 ⇒ **不改场地文件就能把 patch 写法试通**。⚠️ 但它的警告**往往仍 `exit 0`** ⇒ 别把退出码 0 当没问题；⚠️ **判"未命中"必须先跑一个"必中的对照组"**。
- **已知假绿坑清单（逐条都会"看起来全绿"）**：① `--dump-config` 成功；② `exit 0` 单独当判据（无 key 时也 `exit 0` ＋ 建 session ＋ 有事件）；③ `log` 里能看到原文（恒真）；④ 在 `session.events` 上断言（证明不了发给模型的内容）。

---

### 6 · 回报格式

- **结论先行**：一句话给 **（甲）机制成立／不成立**。
- **逐条证据**：J1–J8 每条 → **命令 ＋ 期望观测 ＋ 实际观测 ＋ 判定**。⛔ 禁自述型（"跑通了"／"验证过"）。
- **原始证据落盘**：⛔ 不得手工整理 ／ 意译工具输出；工具链自身的语言与编码差异**原样保留**，并**注明取自哪条通道**。
- **未闭合项单列**（含"未观测到"的项 —— **未观测 ≠ 不存在**，写成"未观测"）。
- **自曝**：跑歪了 ／ 判据要订正 ／ 发现矛盾，直接写。⭐ **「成因未知」是可接受的结论，别为叙事完整编一个**
- **说"没有 ／ 不存在"必须附检索式与遍历范围**（否则不可验）。
- **§7 决策数据的采集表**：保真度样本（摘要文本 vs 原文的关键要素：路径 ／ 标识符 ／ 错误串 ／ 决策）＋ **中文会话摘要的实际语言形态**（是英文 ／ 中文 ／ 混合？照抄一段原样摘要即可）。

---

### 7 · 禁区 ＋ 待裁（⛔ 越界即失分）

**禁区**
1. ⛔ **不改 `docs/` 下任何文件**（含 `dsh-migration.md` ／ `dsh-34-ref-research.md`）—— 那是 WB 的维护面；有要改的**在回报里提**。
2. ⛔ **不改 `TODO.md`** —— 同上（只读）。
3. ⛔ **不动 `.dsh-home/profiles/sdk` 源 profile**（一律临时 home 副本）。
4. ⛔ **不装任何社区件**（§3.0：只参考不直装；要抄进产品须 fork → 本仓 → review）。
5. ⛔ **不把 key 写进任何受版本控制的文件 ／ 日志 ／ 回报**。
6. ⛔ **不用 `npm` / `yarn` 替 `pnpm`（涉及依赖树时）**；本块原则上不该动依赖树。
7. ⛔ **不碰 CVM** —— 本块判定链只在本机（见下）。

**待裁（⛔ 不要自行拍，也⛔不要等它才开工）**
- **（A）要不要自做 compaction Provider？** —— 两个诱因：① 官方摘要提示词**明文要求"Write concise English engineering prose"**（`summarizer.ts:61`）⇒ **中文会话会被写成英文**；② 保真度（生成式摘要 ≈37% vs 逐字 ≈98%）若不达标。⚠️ 技术上**只有一条硬约束**：`compaction-basic` 的 **config 面不含任何 prompt 配置项**（`config.ts:38-42` 的 key 白名单已实读）⇒ **要换提示词只能自做 Provider**（`summarize()` 是官方明示的**唯一子类定制钩子**，`index.ts:100/231`）。⇒ **本块按"官方默认路径"跑，不要预做**；本块的 §6 采数就是给它做决策输入。
- **（B）CVM 侧是否同步 A 落地** —— WB 倾向**留到部署环节**（本块判定链只在本机；compaction 无 OS 依赖）。
- **（C）`headroom` 类件引入新模型工具** —— 产品决策，不属本块。

**诚实边界（本块的适用面）**
- ⛔ 本块**不得**声称「产品可接受」—— 保真度与中文摘要形态是本块**采数项**，判定权在产品侧。
- ⛔ 本块**不覆盖 overflow 恢复**（L5 档，需真灌超真窗口，每次 ≥100 万 input）—— 属另一档，不在 3.4 主线。
- ⛔ 本块**不覆盖** L4（真 1M 容量）—— 机制里唯一的容量依赖是 `floor(contextWindow × thresholdRatio)` 一处纯算术，已读源码 🟢；**若要物证须单跑**（≥160 万 input，5000 万预算内可负担）。
- ⛔ 小窗口（20k）下的结论**不得外推成"1M 容量下亦然"**（除非另跑 L4）。
- ⛔ 结论取自**本机 Windows ＋ 你那条通道**；跨通道不可互推。

## 🗂 已清理段落（按交流区规矩）

- **2026-09-22 清理**：删除 4 段已闭环内容（`DSH-3.8.2 派发稿`／`DSH-3.8.1 派发稿`／`DSH-3.8.1 回报`／`DSH-3.8.2 回报`，含《附 · WB 2026-09-22 重测前提实录》）—— **判据 ／ 边界 ／ 遗留的权威落点 = `TODO.md`「DSH-3.8」段**（一处两面）。回溯：`git log -p -- exchange/log-trae.md`。

---
