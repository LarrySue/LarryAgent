# LarryAgent TODO
> **TODO 治理约定**（2026-08-17 定稿）
> - 本文件为**活跃 TODO**：只含当前待办（能力增强 / 长期迭代）+ 工程债务 + 部分远期计划。已完成部分见 `archive/roadmap-history.md`。
> - ⏸️ **「初步裁定为过时计划的条目（缓删）」区**（⚠️ **该区已于 2026-09-11 移出本文件 ⇒ 现存 `HUMAN_NOTE.md`**）：2026-09-11 老大初步裁定为过时，**缓删，AI 勿处理**（勿删、勿归档、勿当待办推进）。
> - **一致性不变量**：✅ 阶段内不得含 [ ]；含 [ ] 即误归档，须移出至 backlog 或对应未来阶段。
> - 加载方式：软性机制——AI 任务相关时主动 Read 本文件，不自动注入。
> - 检索归档：需要时 Grep `archive/roadmap-history.md`；排查 BUG / 做改动前先扫归档。

## DSH 迁移（A-framework · 已定稿 · DSH-1/DSH-2 已归档；DSH-3 进行中 —— 3.0～3.2.1 与 3.7 全族已归档）

> **分区约定**：**本区只放待办**。判定依据、行事规则、31 子项承接总表、风险清单、环境规格等一律留在 `docs` 相关文档内，本区不重复结论。
> - **编号**：DSH 线用独立 `DSH-N` 序列，与 P0–P4 主线无关；**完成一个即归档一个**——**DSH-1 / DSH-2 均已完成并冷存于 `archive/roadmap-history.md`**（**DSH-3 的 3.0～3.2.1 ／ 3.7 全族亦已于 2026-09-22 冷存**），本区自 **DSH-3** 起。

### DSH-2 · 代码形态 + 环境准备 ✅（2026-09-08 → 2026-09-11 · **已整体归档**）

> **六个隐性欠账处置（2026-09-11 结清）**：
> 1. 🔴 沙箱方言修复件**生产挂载落盘** → **转 DSH-3**（承 2.5③）——挂载范式见 `docs/local-env.md` §4.3
> 2. ✅ Trae 二轮 R1/R2/R3 —— 已回 + WB 复验通过（含 1 处 WB 订正：本机 OS 默认 UI = zh-CN）
> 3. ✅ **parentId —— 老大裁定：按线性记**（不采纳会话树结构）
> 4. 🟡 ②「跨进程 resume 成功」单方声明 → **转 DSH-3「首验 id collision 定性」**
> 5. ⬛ Vue → Tauri IPC → node 自动化覆盖 —— 老大定「后续推进中慢慢补」
> 6. ⬛ ⑤ 适用边界（量化 dtype / >512 token 截断 / 其他模型）→ 归 DSH-4

### DSH-3 · 核心能力 prototype

> **基线**：**`0.1.5-rc.2`**（**老大 2026-09-15 拍定挪**，解除 DSH-2.6「不升基线」——那条是 09-11 的判定，按当时状况成立）；0.1.2 → 0.1.5 的破坏性清单见 `docs/dsh/dsh-migration.md` §3.4〈基线收口复核〉（Session V2→V3 / 移除 `ctx.agent` / persona 前后缀拆分 / `conversation` slot → `main`）——**升级当独立动作，不在切片里顺手再升**。⚠️ `0.1.6-alpha.1`（09-15 发布）是 **alpha 支线，不挪**（npm `next` 仍指 015-rc.2）。
> ✅ **两侧已同步**：决策稿 `docs/dsh/dsh-migration.md` 已迁至 015 口径（提交 `4420652`）—— `:79` 锁定版本行 / `:85` 官方分发行 / §2.3 基线迁移复核 / §3.4〈基线收口复核〉均已随之改动，**原警示解除**。

> **进入前的前置件（2026-09-10 WB 梳理，按此顺序派发）**

- [x] 🔴 **前置件 1 — `--real-api` 等价物（真实调用断言机制）** ✅ **已完成**（Claude 提交 `0e2a7e9`；WB 2026-09-10 独立复验**通过**）
  - ⭐ **为什么必须补**：文档 §3.6 原话「…须在 DSH-2 设计到位——**不提前设计，DSH-3 起每步验证都裸奔**」。DSH-2.5 ④ 已实证：**无 key 时 `exit 0` + session 建立 + 12 条事件，与成功完全一致** → S0 的验收口径（消息往返 / 事件落盘 / 回读）**每一项都能在假绿灯下通过**。
  - 🟢 **WB 独立复验（真 Key 实跑，不采信声明）**：有效 Key → `verdict=OK assistant/message=1 turn/end.kind=completed` 3s（**绿灯是真的**）；错误 Key → `FAIL / error.code=AUTH / 401`（**红灯也是真的**）。两侧均复现 → 判据有效。
  - ⚠️ **判据订正（2026-09-10）**：成功判据是 **`turn/end.reason.kind === 'completed'`**，**不是**「`turn/end.reason` 不存在」—— 后者是 WB 字段路径取错（`turn/end.data.reason`）写下的错误表述，**照字面实现会假红**。`docs/local-env.md` §6 已订正。
  - ✅ **退回件已收口（2026-09-10 晚，WB 复验）**：原报「进程不退出**必现**」**撤回** —— 实测为**偶发**（Claude 独占 6 次 + WB 干净 1 次全部正常；WB 另 3 次复现，**均在其自己环境被污染的条件下**）。⚠️ **WB 原归因（"teardown 没跑"）是错的**，日志显示 teardown 跑了。
  - 🟢 **根因已收窄**：复现日志证明**挂点在「teardown 跑完之后、vitest 主进程真正退出之前」**，且 **EXIT-NET 安全网（teardown 布防）全程未触发** → **实测印证了 Claude 的"两层互补"判断**：该层救不了，**只有入口脚本墙钟看门狗能兜住**。
  - ✅ **防护已就位（Claude 交付，WB 判通过）**：① 启动期清扫过期残留（>2h）；② teardown 退出安全网（方案 A：真实退出码 + 诊断，**不因残留判红**——假红比没护栏更糟）；③ **入口脚本墙钟看门狗 20 分钟**（超时杀进程树 + exit 124，与测试失败的 1 区分）。CI 不会再挂死。
  - 🔒 **收口裁定（老大 2026-09-10 拍板）：不验，按偶发收口。** 接受「偶发、根因未定位」，靠入口脚本 20 分钟墙钟看门狗兜住（**CI 不会再挂死**）。三个候选方向（本机 dsh 并发争 profile / Bash 管道 stdio 非 TTY / 进程组语义）**均不验**。
    - ⚠️ **将来若在生产真撞到**（后端跑着 dsh 时并发跑测试 = 同一场景）→ **按当时现场重启这条线**，不预先投入。
    - 📌 **本件（DSH-3 前置件 1 退回件）至此全部收口**：三件交付通过（含看门狗）、退回撤回、安全网按方案 A 落地。
- [x] ✅ **S0 环境已拍（老大 2026-09-11）：CVM 单跑，本机对照省。**原三选一（① CVM（Linux，与生产形态一致，顺带回答"云上跑 DSH + 自做工具"这个上云核心未知）／② 本机 Windows／③ 双跑互为对照）收窄为 **① 单跑**。理由：S0–S4 的判定标的全在 Linux 侧（`sandbox/` 判定环境 = Linux、生产形态 = Linux），S0 目的是"能力接入"而非跨 OS 兼容；**Windows 侧的差异数据不丢**——由下方「生产挂载落盘（Windows 方言修复件）」在同机复跑时天然覆盖，不另开对照跑。
  - 🔴 **时间窗**：CVM 有效期至 **2026-10-09**（2026-09-09 起算）→ 到期前须把产出搬回本地/入库，**机器上任何产出不得是唯一副本**（`docs/production-env.md` §1 行事规则）。
  - ✅ **开工第一卡点已解（2026-09-14）**：三环境三把专用 Key（`larry-dev` / `larry-wsl` / `larry-cvm`），**按环境分不按轨分**（同环境内 backend 与 DSH 填同一把）；CVM 那把**已落位**（其处置见 `archive/roadmap-history.md`「DSH-3.0」段）

> **子阶段划分（2026-09-14 定）**：3.0 前置 → 3.1–3.6 主线六切片（**严格串行、逐层叠加**）→ 3.2（＋3.2.1）首验 / 3.7.1–3.7.2 方言修复件（支线）→ 3.8 设计产出 → 3.9 收口。
> **判据 / 验收基准 / 负向对照矩阵 / 采数口径 / 执行范式 → `docs/dsh/dsh-migration.md` §3.6「DSH-3」**；CVM 环境与凭据 → `docs/production-env.md` §12；方言修复件范式 → `docs/local-env.md` §4.3；**派发规格（执行人 / 批次）→ 本文件「待派发」段**。
> ⚠️ 原详细计划稿 `exchange/dsh-3-plan.md`（含四方评审附 A/A-2/B/C）的实质内容已于 2026-09-14 **全数承接入本文件与 §3.6**，该稿已于 `677523d` 处置（删除）；如需追溯评审原文：`git show 3362f57:exchange/dsh-3-plan.md`。

#### DSH-3.0 ～ DSH-3.2.1 · ✅ **已归档（2026-09-22）**

> 这四块的**完成态快照**（逐条判据 ／ WB 复验结论 ／ 未闭合项处置 ／ 证据包路径）已移入 `archive/roadmap-history.md` 的「DSH-3.0」「DSH-3.1」「DSH-3.2」「DSH-3.2.1」四段 —— **排查 BUG ／ 复验 ／ 做改动前先扫那里**。
> 📌 本区**在飞内容自 `DSH-3.3` 起**（下方）。

#### DSH-3.3 · S1 interaction 审批接入（→ 2.7.1）

- [x] ✅ **`3.3-a` 已交回 · 复核已完成（WB 2026-09-21）** —— 机制接入三项**均成立**：装载与注册 ✅ ／ **scope filter ✅（两组真对照）** ／ **fail-closed ✅（6/6 `unavailable`、被保护动作 0 次）**；⚠️ 复核另**订正 1 处证据引文改写**（见本段末「复核订正」）｜ **scope-filtered answerer 插件**（TS）—— ⭐ 答者来源做成可替换接口 ✅（注入点 `approvalAnswerer`；真 DSH 就绪时序留给 3.3-b）｜ 交付 = `harness/packages/plugin-approval-answerer`（产品）＋ `plugin-approval-probe`（装置）＋ `scripts/run-33a-answerer-e2e.mjs`｜ 派发稿 = `exchange/log-trae.md`「DSH-3.3-a」段（⚠️ 活日志会被随时清理 ⇒ **判据与边界的权威落点仍是本文件 ＋ `docs/dsh/dsh-migration.md` §3.6**）
- [ ] 🟢 **路已拍（老大 2026-09-14）：分阶段往 ② 走** —— 拆三段，证据与判据见 `docs/dsh/dsh-migration.md` §3.6〈S1 审批三段收敛路径〉：
  - **3.3-a**（本阶段，可随批次 2 跑）**本地策略答者**（`ctx.approval` waterfall 的最终应答者）—— 验**机制接入**：scope filter / 日志可观测 / fail-closed
    - ⚠️ **诚实边界**：「超时」「渠道断裂」两条是**同进程替身路径**（本地答者即同进程调用，无"渠道"可断）⇒ **3.3-a 单独不得声称"审批语义验成立"**
  - **3.3-b**（本阶段，**不依赖 3.8**）答者改为**真出站往返**：薄客户端（`JsonRpcLineTransport` + `onRequest`）↔ 本地 stub 对端 —— 验 ② 的真风险：跨进程等待 / 超时收尾 / 对端消失 / 取消传播
    - [x] ✅ **`3.3-b` 已交回 · 复核已完成（WB 2026-09-21）· 判定成立**（7 臂 66/66） ｜ **实测回填见 `docs/dsh/dsh-migration.md` §3.6** ｜ ⚠️ 复核**订正 2 处引文**（`-32601` 帧的 jsonrpcId ／ `selfVisibleAtApply=false` 无实物支撑；**均不影响结论**）＋ 补 3 条机制增量与 1 条装置代价（详见本段末「3.3-b 复核订正」）
    - ⚠️ **主要成本**：不能用 `HarnessClient`（其 `start()` 只挂 `onNotification`）+ 其 `exports` 不含 `resolveDshLaunch` ⇒ **起子进程的启动参数要自己构造**
    - ⭐ **产物不是一次性的**：薄客户端 = **3.8 driver 的骨架**
  - ✅ **3.3-b 复核订正（WB 2026-09-21）**：
    - **判定**：成立。7 臂 66/66（`main` 12 ／ `lateabort` 9 ／ `answertimeout` 9 ／ `noanswerer` 7 ／ `nohandler` 8 ／ `closestdin` 11 ／ `killpeer` 10）。**WB 现场独立复跑 `main` 臂 12/12 复现**：audit 序列完全一致、`relay`/`probe`/`peer` 三份日志归一化后逐条一致。
    - **订正 1**：`-32601`「原始帧」引文的 `jsonrpcId` 与物证不符（回报 `req_166e580f…` ／ 物证六处均为 `req_88a77059…`；全仓 468 件搜前者**仅回报自身 1 次**）。⇒ **按回报给的 id 找不到那帧**；帧的其余部分逐字一致。
    - **订正 2**：`selfVisibleAtApply=false` **无任何落盘支撑**（`_attempt1` 全 18 件无该字段；全仓该字段样本**恒为 `true`**）；该目录里唯一的 `false` 是 **`injectedAnswerer:false`**。⇒ 机制结论本身由 **`injectedAnswerer` 的 `false→true` 对照**支撑（实物在 `_attempt1/answerer.log` 与 `main/answerer.log`）。
    - **机制增量（已回填 `dsh-migration.md` §3.6）**：① `dsh plugin add` 装**符号链接** ⇒ 插件 `import` 在 **harness 工作区**解析（插件要 import `@deepseek-ai/*` 必须登记进 `harness/package.json`）；② 跨插件 seam **必须 `provide` 在 root ctx**（`ctx.get` 的 `strict` 语义：owner fiber 非 ACTIVE 即 `undefined`）；③ `insert` 落列表末尾 ⇒ **控层序只能重排 `dsh.profile.bundles`**。
    - **验收基准（限制，不得跨出）**：结论取自 **`node v24.14.1` ＋ 本机 Windows**；**POSIX 分支未验**；`approval/request` 为**本块临时约定**的 method 名（3.8 定稿后可能改名）；那批结论依赖**符号链接装载**（将来改实体复制须重验）。
    - ⚠️ **装置代价**：每次运行在系统 TEMP 复制一份 sdk profile 真副本（**≈330 MB ／ 4.35 万文件**）；本块累计留下 **≈10.2 GB** 临时 home ⇒ 同类装置收尾须**显式清理**。
  - **3.3-c = 3.8** 对端换成 driver + 前端 ⇒ 人审批闭环
- [ ] 用例覆盖 5 条：批准 / 拒绝 / **超时** / **抛错** / **渠道断裂** —— 后三条均须 fail-closed **且留可观测日志**（⚠️ 静默 fail-closed 会制造假绿：你以为是人点了拒绝，其实是请求从未到达）
  - ✅ **3.3-a 实测回填（WB 2026-09-21）**：本条原措辞「**answerer 超时**」已订正为「**超时**」—— `dsh-user-approval` 的 `decide()`（`lib/index.js:175-192`）**没有"答者超时"计时器**，唯一"放下"机制是**请求侧 `AbortSignal` 撤回**（`signal` 与应答赛跑，abort 先到 ⇒ 封 **`cancelled`**，**不是 `unavailable`**）。⇒ **3.3-b 的「超时收尾」大概率也走 signal 这条**，别再找一个不存在的「答者超时 API」。
  - ⏱️ **超时值须先定死**（否则"超时路径"无法构造）：建议 **30 s**，写入判据；可依实测调整
- [ ] 观测点 = **工具 handler 入口打点**（有行 = 真的执行了），UI 与 DSH 日志只作旁证
- [ ] 📚 **参考件**（登记表 3.3 行）：`ref/community/PerryLink__dsh-reach` —— **deferred answerer**（`approval/request` + `user-questions/request` 两个 waterfall，答案稍后从 IM 回来才兑现）+ `cardTimeoutSec`（超时）+ `bridge.dispose()`（结清待决）+ `inject: []` 降级矩阵；官方机制侧 `dsh-user-approval` / `dsh-permission-presets`

#### DSH-3.4 · S2 compaction 接入（→ 2.9.2）

- [ ] **compaction provider 插件**（`ctx.compaction` 是契约 ⇒ 自做 Provider 即换策略，消费者不动）
- [ ] 构造法：**注入大段填充文本逼出触发**（勿真灌 200+ 轮）⇒ ⭐ **量级阶梯与预算已算清**：`docs/dsh/dsh-migration.md` §3.6〈DSH-3.4 · S2 compaction：测试量级阶梯与预算〉
- [ ] 判据：摘要注入 **且** 近文原文保留 + 摘要含可验证 nonce 片段。⭐ **口径四条已写死（2026-09-29）** ⇒ 权威落点 `docs/dsh/dsh-migration.md` §3.6〈DSH-3.4 · S2 判据口径四条〉：① **「近文」= 留 surface**（`session.deriveMessages()` 输出里尾部逐字可见；⛔ **log 里有不算**（官方压缩不删 log，恒真等于没验）／ ⛔ **「能回取」不算**（那是 tool-output 压缩生态位））；② **尺 = `retainRatio`(0.16)**，期望保留量 `floor(被压区间 token × 0.16)`；⚠️ **手动 `/compact` 单列**（硬编码 `retainTokens=0` ⇒ 只留最后 1 条，**不算通过**，`compaction-basic/src/index.ts:380-384`）；③ **三态须可分**（没触发 ／ 摘要被截 `MAX_TOKENS` ／ 完好）—— ⚠️ **(i)(ii) 在 surface 上同形** ⇒ **只从事件侧判**（`compaction/start` ／ `summary`(带 `rawOutput` ＋ `usage`) ／ `end`；**有 `start` 无 `end` ＝ 失败，须 fail-loud**）；④ **断言位置 = `session.deriveMessages()`**（⛔ 不在 `session.events` ／ kernel 投影 ／ surface 内部结构上断言）
- [ ] 🔀 **产品决策（待老大拍）**：**手动 `/compact` 要不要也保留近文尾部？** ⚠️ **三个前置事实（2026-09-29 实读 · 🟢）**：① **配置改不动** —— `compactNow` 直接传字面量 `0`（`compaction-basic/src/index.ts:380-384`），**不读 `policy` / `spec`** ⇒ `retainRatio`(0.16) 只管自动路径；② **`0` ≠ 留 0 条** —— 语义 = 从尾部倒序累计 token 到 ≥ 参数即停 ⇒ 保留区 = **最后 1 个节点**，再向前吸附到 tool-pairing 安全边界（可能多留几条）；③ **官方默认组合自带 `/compact`** —— base bundle 启用（`:325`）／ web-app 禁用但 cordis / ptc / standard 三个 preset 均提供。**三选项**：**A 不做入口** ⇒ 决策消解，判据注明「手动路径不适用」；**B 做，接受官方语义**（手压后近文近乎清零）；**C 做且自做 Provider**（覆写 `compactNow`）⇒ ⭐ 即 **「换 Provider」第一个实际靶子**。✅ **低成本验证**：**L1 档本就是手动 `/compact`** ⇒ 顺带断言「保留几个节点 / 多少 token」即升为实测
- [x] ✅ **已定额（老大 2026-09-23）：总 token 硬上限 = 5000 万（50M）** —— 口径「范围内随便搞、**非**要求用完」。⚠️ **预算仍写进判据**：按量纲预计实耗极低（主线 L0＋L1＋L2 ≈ **5~10 万 input**；加 L3 ≈ 再多 20~40 万）⇒ **50M 是安全网，不是花销目标**。量级阶梯与「不做档」理由 ⇒ `docs/dsh/dsh-migration.md` §3.6〈DSH-3.4 · S2 compaction：测试量级阶梯与预算〉
- [x] ✅ **参考件调研（广撒网）已收口（2026-09-28）**：五方（WB ／ Trae ／ Claude ／ Qoder；**Other 已取消**）各自独立检索 ／ 梳理 ／ 筛选并出评论报告 —— **四方交付齐 ＋ 融合轮完成** ⇒ **规则原文 = `docs/dsh/dsh-34-ref-research.md` §1–§10**；**汇总（候选池 ／ 分档统计 ／ 通道对照 ／ 分歧点 ／ 版本观察 ／ 深读清单 Top 12）= 同稿 §11**。⚠️ **汇总口径（老大 2026-09-23）**：各方交付取当下状态当一版看待（不管改过几次、不区分轮次）；**版本锚定不做深度追踪**（DSH 演进快、社区探索期 ⇒ 持续观察即可）

#### DSH-3.5 · S3 sandbox 三档接入（→ 2.7.1 Linux 侧）

- [ ] 三档（read-only / workspace-write / danger）各自拒绝与提权流程生效 + **fail-closed 成立**
- [x] ✅ **前置核查：目标机 `bwrap` 是否存在 —— ⭐ 已核：不存在（WB 2026-09-23 dry-run）** ⇒ DSH **永远只走 landlock rung**（与预案一致）。⚠️ 且**“装上 bwrap”这条路实际堵死**：`apparmor_restrict_unprivileged_userns=1` ⇒ `unshare --mount/--pid` 全 FAIL（bwrap 依赖 mount ns + userns 映射）。**回填 → `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 前置核查实测回填〉**
- [ ] 加判据：**DSH 的 sandbox ruleset 在 CVM 上建立成功**，并**单独判其失败形态**（fail-open 还是 fail-closed —— 决定生产安全）—— ⭐ **fail 形态已由源码预先钉死 = fail-closed**（`main.c:23-28`：`exit 125` 且不 exec；`README:57`：招 `SANDBOX_UNAVAILABLE`）⇒ 判定轮只需**在真 DSH 上复核**该形态
- [ ] 器材：`D:\Temp\Sys\claude-wsl-probe\landlock_probe.py`（ABI 自适应 + `--fs-mask` 负向开关 + `VERDICT=` 机读行）
- [x] ✅ **执行姿势：先 dry-run 再判定 —— 已完成（WB 2026-09-23，只读／零装包／零 Key）**：ABI=**4**（landlock **正证通过**：设规则后读 `/etc/hostname` 被 `EACCES` —— ⚠️ **该掩码系探针自设的更严掩码；DSH 的 landlock profile 读权限是全开的（`readOnly:['/']`）⇒ 此正证只证「内核强制」，不得读成「DSH 沙箱挡读敏感文件」**，见 `docs/dsh/dsh-migration.md` §3.6② 姿势自证）／`bwrap` **不存在**／路径映射与 cgroup v2 齐备／**ABI 4 ⇒ `partial`**（差 `IOCTL_DEV` 一位）。⚠️ 原定位是"替代 WSL 预演"的姿势（CVM 10-09 到期）；**CVM 期限已确认非硬约束**（老大 2026-09-23：续费成本可忽略），但 dry-run 本身仍为必要前置
- ⚠️ **ABI 边界（2026-09-23 精确化）**：CVM = **4** / WSL = **7** ⇒ **判定只能写在 CVM 上，不得互搬**。⚠️ 原表述「ABI 5+ 掩码喂 ABI 4 ⇒ `create_ruleset` 直接 `EINVAL`」**限于“人工喂高位掩码”**；**DSH 自身按协商 ABI 裁剪掩码（`main.c:184-189`）不会 EINVAL** ⇒ 勿读成“DSH 在 ABI 4 上会失败”
- [x] ✅ **已裁（老大 2026-09-23）：接受降档（选项 ①）** —— `bwrap` 不可得 ⇒ CVM 上沙箱永远走 landlock rung；**不动主机 AppArmor**（选项 ② 不采纳）。⚠️ 裁定附**两处归因修正**（WB 读源码所得）：① **bwrap profile 同样不管网络**（`bwrapProfileArgs()` 无 `--unshare-net`，`sandbox-local/src/profiles.ts:17`）；② **读写权限两条 rung 等价**（bwrap `--ro-bind / /` ≡ landlock `readOnly:['/']` ＋ 写白名单）。⇒ 降档净损失仅「私有 PID ns ＋ `--die-with-parent` ＋ workspace-write 的临时 `/tmp`」三条，**与防误写／防外泄均无关**；选项 ② 代价是**主机级**（影响全机进程）⇒ 收益不抵。**不新造缺口**（「防外联另做」原样有效，`production-env.md:165-166`）。**完整回填 → `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 前置核查实测回填〉④**

#### DSH-3.6 · S4 记忆最小闭环（→ 2.4.2）

- [ ] **session 事件订阅插件**（TS）+ SQLite / ChromaDB 双写
- [ ] 判据：事件**确实被消费**（不是只注册了监听）+ 数据落在**我们自己的库**（⭐ **带反向哨兵**）+ **新会话能召回**
- [ ] ⚠️ **双写不是事务** ⇒ 须定义**一致性模型**（ChromaDB 不可达 / SQLite 独存时的降级行为与召回路径）
- ⚠️ 写码前必读：`node:sqlite` 在并发 + `busy_timeout=0` 时 **`prepare()` 阶段就抛错**（Python 侧只在 `run()` 阶段失败）⇒ 错误处理须包到 `prepare` 层
- [ ] 📚 **参考件**（登记表 3.6 行）：`ref/community/Asher-2000__dsh-memory-connect` —— SQLite FTS5 + 本地 embedding（`scripts/embed_server.py`）+ `systemPrompt.context` 逐轮召回；⚠️ 其 CHANGELOG 记了两个**静默不生效**根因（Cordis 惰性构造服务 ⇒ 只 `ctx.provide()` 不实例化；召回写进无人读的字段），**与本步判据“事件确实被消费”同源**

#### DSH-3.7 · 生产挂载落盘（Windows 方言修复件） ✅ **全族已归档（2026-09-22）**

> `3.7.1` ／ `3.7.2` ／ `3.7.3` ／ `3.7.3-T` ／ `3.7.4` ／ `3.7.4-T` ／「已定前提」**七块全部已回报并复验** ⇒ 完成态快照（判据 ／ 复验 ／ 未闭合项处置表 ／ 证据登记）已移入 `archive/roadmap-history.md` 的同名各段。
> 本区**唯一未闭合的下游尾巴 = `DSH-3.7.5`**（`(c)` 待裁）⇒ 见下方「待派发」段。

#### DSH-3.8 · A 段自定协议设计（通信面定型派生）

- ✅ 📄 **设计稿已定稿 v1.0（2026-09-22 · 三方评审已融合）** ⇒ `docs/dsh/dsh-38-a-protocol-design.md`（16 节：范围边界 ／ 上游约束 C1–C14 ／ 承载与帧形状 ／ HTTP 状态码 ／ blob ／ 消息集 ／ 排队与并发 ／ **审批双向中继（五路超时表）** ／ 终局扇出 ／ 会话三态 ／ 鉴权 ／ 多端同步 ／ 重连补帧 ／ C 段承载 ／ driver 接线 K1–K7 ／ 判据写法纪律 J-1〜J-6 ／ 分期 M1–M4 ／ **协议版本与维护** ／ 诚实边界 ／ 参考件 ／ 下一步）
  - **D1 ／ D2 已定案**：**D1-a**（HTTP unary ＋ SSE）／ **D2-a**（JSON-RPC 2.0 语义）—— 依 **Trae ／ Claude ／ Qoder 三方一致**意见收敛（⚠️ **非老大裁决**；改判成本 = 稿 §14-2）
  - **评审存档**：含三份评审附录的版本 = git `074a894`（原 `exchange/`，已移出）
  - ⚠️ **两条待复核（不阻塞实现，M1 前须有结论）**：**稿 §14-7 Gateway 可启用性重测**（等级最高）—— ⭐ **2026-09-22 装配层已见结果**（WB）：`--dump-config` 证实 `typert-gateway` 随 `dsh-base` **默认装配、未禁用**，包本体同代（`0.1.5-rc.2`）、npm `next` 亦指向它 ⇒ **原「不成立」在装配层翻转**；⛔ **运行时层仍未验**（原 404 出自运行时通道）⇒ **两通道并列留痕、不合并**，待验收窄为「钉版本下运行时能否挂路由 ／ 起 HTTP」，已作 `3.8.1` 的顺带判据 J6 ／ 稿 §14-8·9·10（跨设备时钟 · 通道维度 · 浏览器行为）
  - ⚠️ **产品定位联动**：「PC 侧弹框审批」是一次**能力树新增**（`product-positioning.md` 无"弹框/弹卡"字样）⇒ 拟落 `2.7.2` 边界透明 vs 新开子项，**待老大定**（属产品文档层，不在本稿）
- [x] ✅ 设计稿 → `docs/`：**流式转发 / 会话管理 / 鉴权 / 多端同步 / 重连补帧全自实现**（官方 Gateway 白送的恰是这部分）。**DSH-2 段「新增派生工作项」的同名条目已并此，勿双处维护** —— 2026-09-22 定稿落位
- 执行人（老大 2026-09-14 定）：**WB 出设计稿、Trae 承接实现**
- [ ] ⭐ **审批请求双向中继**（老大 2026-09-14 定「分阶段往 ②」，终点落在本段）：A 段协议须含 **server→client 请求**的承载。传输能力已由 `JsonRpcLineTransport`（protocol 包公开导出）提供 ⇒ 本段要做的是**协议定义 + 对端接线**，不是造传输（**协议定义已随 v1.0 定稿落位 ⇒ 稿 §4.3 ／ §5；剩余 = 实现**）
- ⭐ **可复用产物**：3.3-b 的薄客户端 = 本段 driver 的骨架（勿另起一套）
- [ ] 📚 **参考件**（登记表 3.8 行）：官方 `dsh-api-remotes`（原话“任何不依赖 React 的 `ctx.remote` 约定均可复用其 **Client face**”）+ `dsh-client-connection`（gateway 挂 `/api`；browser 半 = fetch/SSE）；社区同题 `litestartup-com/dsh-api-gateway`（REST + SSE + API-key 鉴权）/ `Jiachi5533/dsh-remote-gateway` —— 已登记进稿 §15（v1.0 增 2 档：**官方 Electron 桌面端同题先例** ／ **`dsh-client-*` 非 React 核心 8 件**）
- ⚠️ **它不再阻塞 3.3-a / 3.3-b**（2026-09-14 修正）：依赖只剩 **3.3-c** 这一段（见 3.3 三段拆分）
- [x] ✅ 📤 **派发稿（2026-09-22 已派发）⇒ ✅ 已回报 · WB 复核成立（2026-09-22）** ⇒ **`DSH-3.8.1 · driver 成型`**（承接人 **Trae** ／ 场地 本机 Windows）。派发稿 ＋ 回报 = `exchange/log-trae.md`（**已按交流区规矩清理，2026-09-22**；回溯 `git log -p -- exchange/log-trae.md`） 状态「待复核」→「复核成立」（终跑 `run9` **PASS 22／FAIL 0／OBS 10／未验 0**；⚠️ 含一次返工 —— 首版漏三条判据的**字面要求**，经老大追问后补齐）。**派发前已重测前提**（8 条：**2 条推翻旧登记** —— `--patch` 通道实测验有 ／ **gateway 装配层结论翻转**；**1 条前提缺口** —— `DEEPSEEK_API_KEY` 当时不存在）。✅ **该缺口已闭合（老大 2026-09-22 确认「Key给他了」）** ⇒ J2 ／ J4 可走稿内 (a) 分支真跑。⛔ **复验时仍须回源核其回报是否真走 key 路径**（"跑过"是声明、不是证据）。**本切片内容** = 把 3.3-b 的一次性装置对端改造成产品级 driver（按 C13 形态起 ／ 常驻 ／ 事件与反向请求交给上层）—— ⭐ **核心增量 = 「能自己退出」**（3.3-b 骨架此项不合格：靠 `child.kill()` ＋ `process.exit(0)` 收尾）。⛔ **本块边界**：只交 driver；**不覆盖**端到端审批闭环（属 M2）
  - ✅ **WB 复核成立（2026-09-22）** ⇒ 详情原载 `exchange/log-workbuddy.md`（**已按交流区规矩清理，2026-09-22**；回溯 `git log -p -- exchange/log-workbuddy.md`）。**独立复跑**（Bash 通道 ／ system node `v24.14.1`，同版本异通道）⇒ `PASS 18／FAIL 0／OBS 7／未验 1`、`EXIT=0` 自行结束 ⇒ ⭐ **核心增量「能自己退出」独立复现**；WB 加做两条（**Node 语义实证**：不调 `process.exit` 出 `beforeExit`、调了不出 ⇒ J3-b 基石成立 ＋ 把「骨架无 beforeExit」从推断升为实证 ／ **无 dsh 孤儿进程**）。⛔ **真 dsh 段（J4-real ／ J5-b）未复跑**（凭据最小接触）⇒ 判「物证多源交叉可采信、未独立复跑」。⚠️ **两处装置缺陷待修**：① **`J3-c` 的 `forced`／`killCalled` 恒真、无判别力**（宿主 `forceAfterMs: 0` ⇒ 源码该分支不可达；J3 的判别力实际来自 J3-a ／ J3-b ／ J3-d）；② **两处硬编码文本与环境脱钩**（`preflight.channel` 写死 `PowerShell/system`、`J2-b` detail 写死「本轮跑在有 key 的环境下」⇒ 异环境跑会**自相矛盾**）。ℹ️ 旧登记「≈330 MB ／ 4.35 万文件」**已过期**（实测源 profile `157.2 MB`；WB 已**排除**「统计对象不同」假说 —— 3.3-b 与本块 `cpSync` 源逐字相同）。
  - 📤 **装置缺陷修复已派发（2026-09-22）⇒ `DSH-3.8.2 · 3.8.1 装置缺陷修复`**（承接人 **Trae** ／ 场地 本机 Windows）。派发稿 = `exchange/log-trae.md` 的 `## DSH-3.8.2` 段（**已按交流区规矩清理，2026-09-22**；回溯 `git log -p -- exchange/log-trae.md`）。**内容** = 修上述两处装置缺陷：① `J3-c` 恒真 ⇒ 修成**双向可翻转**（加反向对照：桩 `S381_STUB_IGNORE_SHUTDOWN=1` ＋ 宿主 `--forceAfterMs` ⇒ 期望 `forced`／`killCalled` ＝ `true`）；② 两处硬编码文本 ⇒ 按实测环境**条件生成**（`preflight.channel` ／ `J2-b` detail）。⛔ **本块只改装置、不重判 3.8.1 的结论**（`run7`／`run9` 为冻结物证，新跑一律落新 run 目录）。 ⇒ ✅ **已回报 · WB 复核成立（2026-09-22）**（A1／A2／A3／B1／B2 全条成立；**WB 换通道（node `v22.22.2`）独立复跑复现 A1** ⇒ 跨运行时亦成立）

#### DSH-3.9 · 阶段收口

- [ ] ⭐ **CVM 产出回传核对表**：逐项列（会话库 / SQLite+ChromaDB / 日志与曲线 / dump-config 快照 / 复现脚本），标"已回传本机 / 无需回传"并附 sha256 —— **含 `~/larry-data/larry.db`（36 KB，该机独有的证据原件）**；CVM **10-09 到期**，这是唯一能系统性堵住"唯一副本"的时点
- [ ] **【退出信号 · 主观】老大本人对 DSH 调试体验的可接受度确认**（S0 跑通后）：alpha 框架 + Cordis 插件总线内部状态不透明 + 跨进程 source map，出 bug 时定位难度阶梯式跳升 —— 不可量化但真实的 go/no-go 信号（文档 §3.7）
- [ ] 退出条件勾对（核心链路达 **P4 等价**）+ 上游漂移复核 + 阶段归档

#### DSH-3 · 贯穿规则（写码 / 验收前必读）

- [ ] **负向对照矩阵**：每条 S 切片挑 1 条判据做"**破坏它、看它变红**"的对照 —— 不做则"真的通了"与"判据没生效"**不可区分**
  - `bundle` 注释掉 → 3.1 ②｜换错 Key → 3.1 ③ 与 3.0 红灯组｜摘/只读 session 落盘目录 → 3.1 ④｜answerer 抛错 ／ 请求侧超时撤回 → 3.3 拒绝路径（须 fail-closed）｜SQLite 路径指回 DSH 默认后端 → 3.6 哨兵｜kill SDK 客户端 → 3.1 ④ 完整性｜停 ChromaDB → 3.6 双写降级
- [ ] **每个验收脚本头部加一行「姿势自证」**：本脚本模拟的是哪条真实链路（哪个执行器 / 哪层前导 / 哪个 home+profile）—— DSH-2.5 ③ 教训：**判据姿势不对会同时造出假绿与假红**
- [ ] ⭐ **环境口径统一（老大 2026-09-14 指令）：同一环境内只用一个 DSH home，不再制造重叠环境**
  - **CVM**：以裸跑默认 **`~/.dsh`** 为准（凭据已在此）⇒ **`~/larry-dsh-home` 不再作运行 home**（**降级为「负向对照器材」**，见 `archive/roadmap-history.md`「DSH-3.0」段；⚠️ 拿它跑出"绿" = **无 key 假绿**）。`harness/scripts/cvm-probes/*.sh` 的钉死写法**已改，`b4b61ed` ✅** —— 5 处硬钉改为 `${DSH_HOME:-$HOME/.dsh}`、`cvm-step0.sh` 默认值改 `default`（不设 `DSH_HOME`），需隔离时由调用方显式传（裁定 J5：**保留** `:-` 写法，不用字面 `unset`）
  - **本机**：client 显式指 `.dsh-home` ⇒ 手工跑也**显式指同一处**（勿靠默认回落 `~/.dsh`）
- [ ] ⭐ **参考件先行（老大 2026-09-14 定）：每切片开工前，先在 `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉定位参考件**（官方读 `ref/dsh-bare/` 或 npm；社区读 `ref/community/`，未落位者按需拉取），**用完回填一行「借鉴点」**；找不到就写“无”
  - ⭐ **派发四要素（老大 2026-09-14 定）：派发稿里逐件写明 ① 路径 ② 怎么参考 ③ 参考程度 ④ 哪部分不可参考**（定义见 `docs/dsh/dsh-migration.md` §3.6 规矩；**落位三件的现成清单见同稿 §2.2.2「可参考 / 不可参考」表**，派发时照抄，勿另行转述）
  - 已落位三件（浅克隆、**只读参考、不进构建**）：`ref/community/kun2-5code__dsh-plugin-template`（3.1）/ `PerryLink__dsh-reach`（3.3）/ `Asher-2000__dsh-memory-connect`（3.6）；名录 `ref/awesome-dsh-plugin.md`（3,386 行 / 27 分类）
  - ⚠️ 拉取踩坑：git 全局配了**不在运行的本机代理** ⇒ 用 `git -c http.proxy= -c https.proxy= clone --depth 1 <url> <dst>`
  - ⚠️ 纪律边界：社区件**只读参考不纳入依赖**（§3.0）；真要抄进产品 ⇒ **fork → 本仓库 → review / 测试**
- [x] ✅ **WSL 在 DSH-3 期间的角色（老大 2026-09-14 拍定）：不参与** —— S0 已拍"CVM 单跑"，DSH-3 的判定链**只在 CVM 上跑** ⇒ `docs/test-env.md` §10 的「WSL 承载哪类测试」+「flock 未实测」**在 DSH-3 期间挂起、不等它**（⚠️ 是"挂起"不是"已解决"，`test-env.md` 侧状态仍是待定）
  - 🟡 **未采纳的建议（留痕，勿当既成事实）**：Claude 提「WSL 当**演练场**、CVM 当**判定场**」—— 脚本/范式/超时/日志先在 WSL 顺一遍（同 Linux），凡"拦住了/放行了"的判定**只在 CVM 出结论**。他的理由：CVM 10-09 到期、机会一次性，不先演练等于**脚本第一次跑就落在正式判定场**
  - ⛔ **不采纳的三条理由（2026-09-14）**：① 沙箱探针本就 **ABI 自适应**（`landlock_probe.py` 自测 ABI 选掩码）⇒ 不需在 ABI 7 的 WSL 预演，**且预演结果按 ABI 边界本就不可作判定**；② WSL 与 CVM 的差异不止 ABI（`/mnt` 三重限制 / flock 未实测 / seccomp 不同）⇒ WSL 上"顺通了"**大部分不可外推**，反造"WSL 通了 CVM 也会通"的**假安全感**；③ 一次性风险有**更便宜的化解**——CVM 上先跑一次 **dry-run**（只打印路径 / ABI / 权限探针，不出判定）+ 3.0 采数，分钟级成本，无需先搭一个状态本身未明的 WSL 环境
- [ ] ⬛ **`D:\Code\API Key.txt`**（老大自处理，未闭环）

**退出条件**：核心链路（会话 + 记忆 + 工具）在 DSH 下达到 **P4 等价**（不是"四个包跑通"——无交付通道的跑通不算）。

### DSH-4 · 差异化能力迁移

- [ ] 长期记忆双写 + 人审（`memory/archiver.py` + `engine.py` → TS 插件挂 `session/` 事件流，保 SQLite+ChromaDB 双写）
- [ ] **记忆迁移（活资产，非数据搬运）**：**无需全量重嵌**（DSH-2.5 ⑤ 实测：TS `bge-small-zh` 与 Python 侧漂移 `2.2e-7`、cosine ≥ 0.9999999999；⚠️ **硬前提 = 预处理严格对齐**，任一项不对齐会产生 0.77 级假漂移）+ 召回等价性抽样验收 + 语义字段不降级（`is_active` / `last_hit_at` / `source_role`，ChromaDB 只能重灌、机会只有一次）
- [ ] **2.7.2 边界透明 → TS answerer 插件**（B1 通道已实测可行；退路 = permission-preset 白名单）
  - ⛔ **执行前置（DSH-3.0.2 实测，配错就 boot 不起来）**：`preset` 服务要求会 confinement 的 `ctx.shell`（`sandboxMode === undefined` ⇒ load throw）；`patch` 整行替换非 merge（加自定义档须重述官方三条、`workspace-write` 必留表）。**依据** → `docs/dsh/dsh-015-capability-mapping.md` §3.1
  - [ ] **未验 ①**：`ctx.tools.restrict()` **真 agent 轮** deny 后模型侧行为（DSH-3.0.2 只覆盖契约面；对应承接总表〈待实测〉②）
  - [ ] **未验 ②**：**反向对照** —— 故意给一个无 `sandboxMode` 的 `ctx.shell` executor ⇒ 断言 plugin load **throw**（须改 composition；DSH-3.0.2 未做）
- [ ] 角色机制（`config.yaml` 5 角色 → `preset/` + `cordis.yml`）
- [ ] 工具生态（`tools/` 844 行 → DSH 工具插件；**web_search 暂保留自实现 Brave**——不配正文抓取，SSRF/清洗成本是刻意规避的）
- [ ] 用户画像 📐
- [ ] 知识库（三层递进 + BM25/FTS 混合检索）
- [ ] **回收站**（DSH 无对应语义，全自做）；**每会话文件沙盒（2.3.3）**—— 上游 `workspace` 已给数据模型（membership 过滤 / `attachSession`），我方**只做隔离语义**（承接总表 2.3.3，档位 🟡 可降级；⚠️ 收益大小取决于 `workspace` 运行时行为，见 DSH-3 待实测 ①）
- [ ] **DSH-4 优先级排序**：哪些先做、哪些等（承接总表已给"用户感知优先"初排，**可否决**）

**退出条件**：**31 子项档位不降、用户可达**（逐行勾对文档 §3.6 承接总表）。**【老大裁定】不要求逐行翻译**——现有实现过于简陋，直接抛弃亦可，按 §3.0「借鉴社区设计重写 + 产品树勾对」即可。

### DSH-5 · 形态适配

- [ ] 本地 `host/` → 上云 server
- [ ] 客户端 Tauri 适配（保留 PC 端 C/S + 本地 file_ops / shell 能力下沉）
- [ ] 移动端 B/S 适配

**退出条件**：云端部署可用、移动端可访问。

### DSH-6 · 测试 + 验收

- [ ] 测试资产**按 DSH 四层体系重建**（非翻译）：mock LLM → snapshot record/replay（`test-support/llm-replay`，比手写 mock 更真且免费回归）；降级/异常/护栏单测约五成可平移 Vitest；conftest 隔离 / fail-fast 断言DSH-2 重做。四层对照表见文档 §3.6
- [ ] 验收五层：① 纯逻辑层翻译全绿 ② 关键路径 snapshot replay 覆盖 ③ 真实 API e2e 冒烟 ④ 数据迁移验证（双写 + 迁移前后召回抽样比对，**无需重嵌**）⑤ Windows 端侧执行器验收
- [ ] 升级回归并入：升级后契约漂移（RPC 快照 diff）+ 资源与凭据（句柄泄漏、key 不进日志）
- [ ] WB 复验 + 老大最终验收（勾对承接总表）

### 待核（不阻塞拍板）

> 均为 §3.0「只借鉴不直装」的配套，或包归属定位。

- [ ] ⭐ **DSH-3 的“每切片参考件”已建表** → `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉（10 切片 × 官方/社区参考 + 8 条可借鉴事实）；**下方两条是 DSH-4 的取样清单，与登记表互补，勿双处维护**
- [ ] **插件生态借鉴清单**（§3.3 降级 3 项）：Memory 分类 149 个中筛 3–5 个候选（重点 `dsh-memory-connect` / `dsh-auto-memory` / `dsh-project-memory` / ReMe），产出**可借鉴点清单**（schema / 检索融合 / 时间上下文建模 / 信任模型 / 已知陷阱），**不是"选哪个装"**；评估维度 = 设计可参考性 + 代码可读性 + 语义贴合度 + fork 改造量
- [ ] **借鉴调研的取样原则**：面对数千插件，产出「设计差异表」+「对方如何验证该设计」列 + 「改造后需补哪些测试」清单；目标是提炼可复用设计模式，不是给单个插件下价值判断
- [ ] **借鉴 / fork 代码纳入规范**：进库位置（独立 `vendor/` or 按能力模块落地）、upstream 出处与 license 标注格式、改造后须过本项目测试与命名规范、与自研代码的边界标识
- [ ] **upstream 追踪与 CVE 响应流程**（不直装 = 失去上游自动补丁通道）：CVE 如何得知 → 如何评估是否 backport → **上游弃坑但 CVE 未修时如何自补**
- [ ] **§3.0 是否升格为项目级原则**（写入 `docs/ai-governance.md`）
- [ ] **来源标注体系（🟢/🟡/🔴）是否升格**：任何 AI 对外部项目做事实断言须标证据等级，🔴 不入结论区
- [ ] DSH 搜索 / 抓取能力归属（`web/` 替换 Brave 证据不足）
- [ ] `webhook/` 包核实（config-catalog 无条目 vs 主仓搜索命中，两源冲突）
- [ ] **能力树套用后的三项转出**（2026-09-17 套用能力树改动提案稿时转出，见 `docs/product-positioning.md` §2.1）
  - [ ] **`workspace` 运行时行为实测**（2.3.3 的 ⚪）：membership 过滤 + `attachSession` 流程 —— 只读了类型与规格、未跑；跑完转 🟢 / 🟡 / 🔴 之一（**未跑前不得升格为 🟢**）
  - [ ] **⛔ 须关闭清单是否单列一张**（**待老大定**）：名义挂 `docs/dsh/dsh-migration.md` §3.6；口径段已按「建议单列」写，若否须改口径
  - [ ] **§2.2 顶层总览表是否加列「对手侧最厚 / 最薄」**（**待老大定**）：形态选择，可后补（不影响已落内容）

### 延后（低优先 · 待触发）

> **为什么单列这一段**（2026-09-20 老大裁）：DSH-3.7.4 有两条未闭合项**已判定"不影响本块结论"**，但**成因 / 覆盖确有缺口** ⇒ 不删、也不留在 3.7.4 段里当尾巴，挪到此处占位。
> ⚠️ **位置是临时的**（老大原话：「至少是一个临时的位置，到时候往后执行碰到这两条，发现位置不对，再往后改也可以」）—— **触发条件出现时**再决定并入哪一块（就近并入同类块，或单独立项）。**本段不参与任何批次排期、不阻塞任何在飞块。**

- [ ] ⏸ **J6 里「连 `node.exe` 也起不来」那一层的成因未定**（本轮只复现出 ConstrainedLanguage 半层）
  - **来源**：DSH-3.7.4 未闭合 #3（原 Trae §9#2）；老大 2026-09-20 裁「延后」。
  - **为什么延后**：它只解释"**约束更严**"这一侧，**不动摇 J6 的任何结论**（J6 的结论 = "read-only 臂里 `EPERM` 与 marker 都在 ⇒ 无假红"，已由 WB 解 DSH 原始帧证实）。属锦上添花。
  - **执行人**：**Trae**（J6 作者；需读 `dsh-sandbox-local` 的 Windows restricted-token ／ ACL 链）。
  - **触发条件**：① 后续任务要**复用**"read-only 到底拦到什么程度"这一判据时；② 或沙箱链本身要改时。
  - **已知边界**：`pwsh` ⑦ 存在性 ／ 系统与用户 UI 语言 ／ `LANG` 等六类候选**已实测排除**；「restricted token 沙箱链」**是猜测、不是结论**（`docs/local-env.md` §12.6 末）。
- [ ] ⏸ **J6 未由 Claude 独立重放**（本轮只做了原始帧解码复核，未重跑 DSH 会话）
  - **来源**：DSH-3.7.4 未闭合 #8；老大 2026-09-20 裁「延后」。
  - **为什么延后**：其价值只是"**跨环境重复性**"，而结论**已由 WB 解码 DSH 原始帧独立证实** ⇒ 边际价值低。
  - **执行人**：**Claude**（纯测试定位）。
  - **触发条件**：① 若 J6 的结论将来要**作为产品判据**（而非仅复验证据）；② 或 DSH 会话日志格式变更、需重校解码路径时。

### 待派发

- [ ] **DSH-3 prototype 派发**（**批次与执行人，老大 2026-09-14 拍定**）
  - 📮 **派发进度（2026-09-15 订正）**
    - **DSH-3.0.1 · 开工前置**（Trae，09-14）→ ⛔ **停止推进**：A / B / C / F 照用（与版本无关）、**F 组已闭合**；**D / E 归 DSH-3.0.3**（按 015 重做）；J1 装 profile 授权作废
    - **DSH-3.0.2 · 2.7.2 A-framework 契约实测**（Trae，09-15，插入项）→ ✅ **已回报 + WB 判「过」**；环境污点根因归 DSH-3.0.3；**改判与基线解耦**（012 已有、015 未变）
    - **DSH-3.0.3 · 装 profile + 重跑 D / E**（Trae）→ 📬 **已回报（2026-09-16）**｜WB 复核：**判定成立** —— 任务 1 ✅（profile 装齐 106 包）；任务 2 / 3 ⛔ **不可判**（环境阻断：CLI / hoisted 根 = `0.1.2-rc.1` ↔ profile = `0.1.5-rc.2` ⇒ runtime 启动即崩）
    - **DSH-3.0.4 · 环境同代化修复 + 重跑 D / E**（Trae）→ ✅ **阶段 Ⅰ ＋ Ⅱ 均已回报（2026-09-16）· WB 复验通过（主结论）**；**稿与两段回报已于 2026-09-16 按交流区规矩清理**（原文 `git show 8f86de8:exchange/log-trae.md`）；逐层原始观测在回传件 `D:\Code\_trae-cvm-evidence\304\004\`；老大拍「修复路都做」⇒ 四步串行已走完；**阶段 Ⅱ 结果**：①＋④ 升 015（CVM 上二者同处；改前已备份 `.bak-304`）＋ ③ 补 3 个可选 peer ⇒ **`~/.dsh` 现已能 boot / 建 session / 跑完真模型回合**；**⭐ D1 首次证成「凭据文件层真被读取且真用于调用」**（两套装置全程 `delete env.DEEPSEEK_API_KEY`，仅凭 `~/.dsh/.credentials.yaml` 拿到 `completed`）
      - ✅ **WB 复验（本机，2026-09-16，三条成立）**：① **D 组根基** —— 回传件里两装置源码 `d-probe2.mjs:70` / `d-codes.mjs:58` 均 `delete env.DEEPSEEK_API_KEY`，且 D2·D3 的 profile 走同一 `symlink` ⇒ **唯一变量 = 凭据文件**，对照干净；② **Tier0 独立重扫**（304 的 73 件 ＋ 整目录）—— 22 处命中全为伪造标签 / 脱敏正则，**零 SUSPECT**；③ **`initialize` 装置确有正反对照**（原先以为只有正向）—— `t2-layer1.log` / `layer1-rpc-probe.out` 显示**改前基线与第 1 层均 `initializeOk:false`**（error `-32603`），第 3 层 `true`
      - ⚠️ **1 条订正 · 待老大裁**：Trae §1.2 称 ② fallback 层的 012「来自 `larry` / `web` / `acp` 三个 profile」—— **WB 读源码（`dsh-app-boot/lib/index.js:588-627`）不符**：fallback 层来源是 **`installAnchor`**（dsh app 包自身，即 **CLI 安装代际**），`moduleFallbackEntryCurrent` 只比 symlink 目标是否等于当前安装代际 ⇒ **「② 与『`larry` 不动』互斥」缺依据**。但「**② 非必要**」**仍成立**（①＋③ 自洽 ＋ D1 结果性证据）。⚠️ 本机源码为 012 版、CVM 为 015 版（**版本不同**）⇒ 本项判「**存疑**」而非「推翻」，**待上机核**
      - ✅ **原硬前置已证不敏感（Trae 反例 → WB 已复验 → 3.0.5 再证并推强）**：稿定「boot 探针 `exit 0` 且无 `0.1.2-rc.1`」为硬前置；反例 = home 换成**不存在的目录**，四项观测**逐值相同**（exit 0 ／ 双流 0 B ／ entry 不在）⇒ 机制 = dsh 自动把 home 建成空壳 profile（`dependencies: {}`）、CLI 从自身安装树解析包 ⇒ **假绿源**（与 `--dump-config` 同类）。替代装置 = `initialize`（会 `await loader.await()`）＋ `session/prompt`（惰性真建 session），两通道已跑通。**3.0.5 推强**：不只"空壳探针不敏感"，是**空壳与「装了但缺 peer 的 015 home」在 SDK 握手处完全同形**（归一化后 stderr 逐字节相同）⇒ 判据不可区分的是「**profile 层不完整**」这一整类，见 `docs/dsh/dsh-migration.md` §3.6「判据抽象」
      - ✅ **2 处待裁 → 阶段 Ⅱ 处置（2026-09-16 二次上机后终结）**：① **② fallback 层**（dsh 自维护）→ Trae **未动**，理由「①＋③ 已让 sdk profile 自洽、不再回落」；其理由链**已订正**（见上条「1 条订正」）。**裁决：不动 ②、也不根治上游** —— 四组对照显示真因 = `~/harness` 的 **lockfile 被冻结在旧代际**（012 树上做单包增量升级的残留；删 lockfile 重装即得 015，保留 lockfile 重跑 `install` **不自愈**），`healProfilesModuleFallback()` 只是**忠实反映该树解析结果**、行为正确 ⇒ 修法 ③（heal 只回填同代）**撤销**、① 保留（理由改为「不依赖回退层兜底、缺件变清晰早失败」）、② 降为**一次性清理动作** ⇒ ✅ **已于 2026-09-16 由 WB 执行并验收**（⭐ **真修法 = 删 lockfile ＋ 删 `node_modules` 重装** —— 只删 lockfile **无效**，pnpm 会复用在装物理版本作解析偏好；机制与四组对照见 `docs/dsh/dsh-migration.md` §3.6）。详见 `docs/dsh/dsh-migration.md` §3.6；② **受控文件 `harness/package.json`（钉死 012，`:26-27`）＋ lockfile** → **已执行**（改前备份 `.bak-304`；`~/.dsh/profiles/sdk/package.json` **无备份**、需回退可 `plugin remove` 那 3 项）。阶段 Ⅱ 另报 **5 条未闭合**（含 **② 层未做**、**CLI symlink 仍指 012 store**、**本机 `~/.dsh` 未修**、`Packages: -60` 未查明、`exit 0` 不可单独当判据）
        - ⚠️ 其中 **「CLI symlink 仍指 012 store」已不再成立**（3.0.5 实测：`~/.dsh/profiles/node_modules/@deepseek-ai/dsh` 现指 `@deepseek-ai+dsh@0.1.5-rc.2`；boot 时 heal 已重链）⇒ 该条**销**
        - 📋 **5 条未闭合逐条结账（WB 2026-09-16，随 3.0 收口）**：① **② 层未做** → **已裁 · 不做**（不根治上游，理由见上）；② **「CLI symlink 仍指 012 store」** → **已销**（3.0.5 实测 heal 已重链）；③ **「`exit 0` 不可单独当判据」** → **已成口径**（假绿源：空壳 home ⇒ `exit 0`；原出处见 `archive/roadmap-history.md`「DSH-3.0」段）；④ **「本机 `~/.dsh` 未修」** → **移出 3.0**（DSH-3 判定链只在 CVM 跑；本机 PC client 走显式 `.dsh-home`，本机 `~/.dsh` 仅服务「手工跑 dsh」这一开发场景 ⇒ **不阻塞本段任何判据**；⚠️ 新落点待老大定）；⑤ **「`Packages: -60` 未查明」** → **不做追溯**（pnpm 装包计数变化，属拆改副产品、不进任何判据；再遇以当时现场为准）
    - **DSH-3.0.5 · 独立验收（D / E 三态复现）＋ 判据盲区（空壳 home）**（**Claude**，2026-09-16）→ ✅ **已回报 · WB 复验通过**（2026-09-16；原始件已回传 `D:\Code\_claude-cvm-evidence\305\`，32 件**逐字节核过**）；**A 独立复现成功** —— d1 / d1c `completed`、d2 `MISSING_CREDENTIAL`、d3 `AUTH`，且三个隔离 home 的 profile deps **完全相同** ⇒ 受控对成立（唯一变量 = 凭据文件）；**B 已答**：`~/.dsh-015`（同代但缺 3 peer）与「**根本不存在**的 home」**归一化后 stderr 逐字节相同** ⇒ **空壳与不完整 profile 不可分**、且「profile 完全不存在」在 wire 层**不可达**；**附带否证两件**：① `~/.dsh-015` **不是**健康样本（WB 指定有误）；② **「跨代必红」不成立**（015 CLI ＋ 012 profile 且依赖自洽 = **绿**）；**根因链已订正（WB 09-16 二次上机 · 四组对照）** —— 现象成立（回退层确给 `dsh-session-persistence@0.1.2-rc.1`），但**成因不是「heal 注射代际污染」**：`~/harness` 的 **lockfile 被冻结在旧代际**（012 树上做单包增量升级的残留；全新 015 树解析得 `0.1.5-rc.2`，删 lockfile 重装即修、保留 lockfile 重跑 `install` **不自愈**），heal 只是**忠实反映该解析结果** ⇒ **已订正回写 `docs/dsh/dsh-migration.md` §3.6**；⇒ **原「1 条架构发现」终结：非 DSH 缺陷、不立项**（修法 ③ 撤销 ／ ① 保留但理由改为「免兜底」／ ② 降为一次性清理动作）；**遗留**：丙样本需**干净重测**（现带 `plugin-storage-probe` link，非干净样本）、E 组**未走 vitest 夹具**（两项按老大 09-16 裁决**并入下一单**）；✅ `/tmp/c305*` 样例 home **已于 2026-09-16 清理完毕**（连同更早的测试残留共清理 105 项）。⚠️ **订正**：原记「三处 `.credentials.yaml` 是指向真凭据的符号链接」**不成立** —— 实测命中的 `credential-provider-*` 是 AWS SDK 包名、`dsh-credentials` 是包目录；**真凭据残留是另一处**：`/tmp/trae-iso-home/.credentials.yaml`（**48 B 实体文件**），已一并清除
    - ⭐ **3.1 提前派发（老大 2026-09-17 拍）**：原批次表把 3.1 排在批次 2（在 3.0 ＋ 3.2 ＋ 3.7 之后）；老大定调「**3.1 编号在前，故应先做**」⇒ **3.1 提前、3.2 / 3.7 顺延**。闸门侧无碍：DSH-3.0.5 已于 09-16 完成，「待 3.0.5 后」已满足、块已空出
    - 📮 **DSH-3.1 · S0 基础链路**（**Trae**，2026-09-17 派发）→ ✅ **已回报并复验**（见下行）；**派发稿与回报已按交流区规矩清理**（回溯：`git log -p -- exchange/log-trae.md`）；**前置已全清**（`cvm-probes` 参数化 ＋ 本机环境同代化，见本段「3.1 前置 · 仓库资产缺陷」／「3.1 前置 · 装置侧两面不同代」）；**场地 = CVM 单跑**
    - **DSH-3.1 · S0 基础链路**（Trae）→ ✅ **已回报（2026-09-17）· WB 复验通过（主结论）**：四项硬判据 **WB 独立复跑全绿**（CVM，`base` 变体，exit 0 —— 不采信其日志）；四条负向对照核回传证据自洽；**源 `sdk` profile 未被改写**（`plugin-tool-readfile` 出现 0 次 ／ mtime 停在 09-16 17:49 ⇒ §5(a) 真副本路线成立）；默认开关下 `1 skipped` 不红（WB 本机 vitest 实测）；**无真 Key 落盘**（WB 以**哈希比对**独立验证：`config.yaml` 唯一真值，4 处 fixture 与真 key 不同值）；CVM 侧残留 0（`/tmp/larry-s0-*`、孤儿锁）；交付物 = `713c103`（14 文件 ＋1159）；`docs/dsh/dsh-migration.md` 事实表补 9 / 10 两条并回填 3.1 行借鉴点
    - **✅ DSH-3.2 · 首验：跨进程 resume 的 id collision 定性**（**Trae**，2026-09-17 派发）→ ✅ **已回报（2026-09-17）· WB 复验：结论成立**（= **真缺口**，非姿势问题）；场地 = CVM；装置 = `harness/tests/s0-resume.test.ts` ＋ `scripts/run-s0-resume.mjs`（四变体 ＋ 构建前置检查 ＋ 退出码 0-1-2-124）；证据 = `D:\Code\_trae-cvm-evidence\s0-resume*`（4 份 JSON ＋ 原始 log，**WB 独立扫 Tier0：clean**）；**参考件借鉴点已回填**（`dsh-migration.md` 事实表 **11**）；⚠️ **Windows 侧锁子项仍为 3.2.1（未派）**；⚠️ **判据缺陷 1 已登记**（`p2LandedOnSameLog` 恒 `null`|`false`）
    - **✅ DSH-3.7.1 · 前置就位与定性**（**Trae**，2026-09-17 派发）→ ✅ **已回报（2026-09-17）· WB 复验：① ③ 成立 ／ ② 的判据被推翻** —— ① `EPERM` 归因**不成立**（4/4 可写、不给现象编主体）；② **实体安装属实**（4087/542 B、SHA256 与仓库源 SAME、真目录）**但「可加载」不成立**（落点 `import` 崩；根因 = peer `*` 把 `dsh-sandbox-local` 解析到旧代 **`0.0.1-rc.1`**，**已定为 3.7.2 硬前置 1**）；③ 凭据层 = **启动环境变量**；⭐ 附带硬发现：**`larry` 是 headless CLI 面、不是 SDK 面** ⇒ **3.7.2 岔口待裁（硬前置 2）**。**3.7.2 未派**，等两条前置清完
    - ⚠️ **WB 复验 · 两条驳回（2026-09-17）**：① Trae 自曝「`run-s0-e2e.mjs` 没有构建前置检查」**不成立** —— 本机该文件 `:40-61` **有**（WB 09-17 所加，提交 `cdc0fde`）；他核的应是 **CVM 上那份滞后同步的副本**（CVM 无完整仓库）⇒ **原待裁项「要不要回填 3.1 那只」随之作废**（无需回填）。② Trae commit message 称"订正 `dsh-pysdk-probe-claude.md:157`"，**但 `0f81c04` 未改该文件** ⇒ **WB 本轮已补正**（声明与交付不一致，记一条）
    - ✅ **WB 承认（出稿方义务）**：派发稿 §5 把 TS 客户端实物路径写成 `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-sdk-client/`，**CVM 上不存在**（实物在 `harness/node_modules/@deepseek-ai/dsh-sdk-client`）—— Trae 顶住了"照稿执行"的惯性并报出，**本条为回填**
    - ✅ **原记「3.2 / 3.7 未启」已作废（2026-09-17）** —— **3.2 全块 ＋ 3.7.1 已起跑**（两块**互不依赖**，即原批次 1 的分组，非破「同时只跑一块」）；**3.2.1 ／ 3.7.2 待前序回报后起跑**
      - ✅ **前序已清（2026-09-17）**：3.2 ✅、3.7.1 ✅ **双双回报并复验** ⇒ **3.2.1 ／ 3.7.2 的前置均已满足，待派**
      - ✅ **DSH-3.7.2 已交付并复验（2026-09-17：Trae 交付 ／ WB 逐条回源复核 J1–J7 全成立）**：场地 = **本机 Windows**｜落点 = **`sdk` 面 ＋ `sdk` 自身 `node_modules`**（复核结论与遗留见 `archive/roadmap-history.md`「DSH-3.7.2」段末引用块）；**原派发稿与回报已于 2026-09-17 按交流区规矩清理**（回溯：`git log -p -- exchange/log-trae.md`）
      - ✅ **DSH-3.7.3 · 工程卫生合并块**（**Trae**，2026-09-17 派发 → **已回报＋复验**）→ **J1–J11 全成立**；场地 = **本机 ＋ CVM 双侧**；三件合并（旧代依赖清理 ／ CVM 副本补齐 ／ 3.2 判据缺陷修复，来源见 `archive/roadmap-history.md`「DSH-3.7.2」／「DSH-3.2」段）；派发稿原载交流区 `exchange/log-trae.md`（**已随交流区清理，不可再查**），**判据权威落点 = 本文件「DSH-3.7.3」段**
      - ✅ **DSH-3.2.1 已交付并复验（Trae 交付 ／ WB 逐条回源复核：结论认可、另订正 3 处）** —— 场地 = **本机 Windows 单场地**；⚠️ 原「顺延」记录（保留口径、状态已变）：**3.7.2 ~ 3.7.3 均已交回 ⇒ 「争用同一棵 `harness/node_modules`」的约束解除 ⇒ 可起跑**。**判据：「独立判据 ＋ 独立场地」方可并行；两块只满足前半** ⇒ 它与 3.7.2 **场地相同**（均本机）且**争用同一棵 `harness/node_modules`**（3.7.2 要重算 lock ＋ 装插件 ⇒ 期间 CLI 树不稳）⇒ **不可并行**。等 3.7.2 交回后起跑（3.2 的锁归属结论已出：「A 锁全程无孤儿／B 锁全程未现」⇒ 3.2.1 的问法**无需改**，可直接按原判据跑）。⚠️ **2026-09-17 更新**：**DSH-3.7.3 已占该场地**（同样本机、同样要重算这棵 `harness/node_modules`）⇒ **3.2.1 顺延至 3.7.3 交回后起跑**
      - ⛔ **`larry` 面已退役（老大 2026-09-17 裁）**：原「3.7 落点 = `larry`」作废 ⇒ **3.7.2 落点 = `sdk` 面**（硬前置 2 已裁）。工程 `.dsh-home/profiles/larry` ＋ 全局空壳 `~/.dsh/profiles/larry` **两处已退役并于同日真删**（原备份名后缀 `.RETIRED-20260917-1808`，仅供追溯、**磁盘上已不存在**），**3.7.1 落在共享层的产物同步退役**（该层已实证会取到旧代）。⚠️ **CVM 那份 `larry` 经复核后已于同日一并退役**（原判「不动」为抄旧登记未核实；实测 = 012 代跨代残留 ＋ 零引用 ＋ 停 11 天 ⇒ 退役并于同日真删，原备份名 `larry.RETIRED-20260917-1818`）。`@larryagent/plugin-probe` **包保留**（最小自研 bundle 样板）
- [x] ✅ **落盘两项 —— 已完成（2026-09-17 DSH-3.7.2；下表为落盘**前**的实测现状）**（当时：`sdk/cordis.patch.yml` = `217 B` 模板空态 `[]`；`sdk/node_modules/@larryagent/` 不存在）：
  - ① **插件实体** = 仓库源 `harness/packages/plugin-sandbox-dialect/`（`index.js` **4087 B** ＋ `package.json` 542 B）**实体复制**到 `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-sandbox-dialect/`（**该 profile 自身层**；⚠️ 不是共享层 ／ 不 link ／ 不从全局 `~/.dsh` 拷）。⭐ **只拷 `index.js` ＋ `package.json` 两个文件，`node_modules/` 必须排除** —— 实测：插件源自带的 `node_modules/@deepseek-ai/dsh-sandbox-local` 是指向 `harness/.pnpm` **旧代那支**的 junction ⇒ **连它一起拷，无论落哪层都取旧代**。⚠️ 另实测：**`sdk` 自身层是独立真树**（`@deepseek-ai/` 下 **real=105 ／ link=0**），而有问题的共享层是 **real=0 ／ link=241**（全指 `harness/.pnpm`）⇒ **两层的结构本身就不同**，这才是"落层"是真变量的实底。⭐ 只拷两文件后 pnpm 不参与 ⇒ 依赖由 `sdk/node_modules/@deepseek-ai/`（实测 015）解析
  - ② **patch** = 把 `sandbox-dialect.mount.patch.yml` 两段写进 `sdk/cordis.patch.yml`（见下条）
    - ✅ **3.1 前置 · 仓库资产缺陷（WB 2026-09-16 发现 → 2026-09-17 已处置）**：`harness/scripts/cvm-probes/` 有 **3 个脚本 6 处曾钉 `@0.1.2-rc.1`**（⚠️ **原记「7 处」有误，2026-09-17 全目录逐字节实测为 6 处**：`cvm-setup-profile2.sh` ×3 ／ `cvm-acp-setup.sh` ×2 ／ `cvm-task1-setup.sh` ×1；`cvm-step0.sh` 等其余 8 个文件无钉版）—— 三者都是「**在 CVM 上装 profile ／ 插件**」的复现脚本，**会被 3.1 起的任务参考** ⇒ **照抄会装出 012 profile、重演混代崩溃**（3.0.3 已踩过一次）。详见 `docs/dsh/dsh-migration.md` §2.3 未闭合项 #6。**老大 2026-09-17 裁：走 ② 参数化** ⇒ ✅ **已执行（WB 同日）**：三脚本在 `export DSH_HOME=…` 之后插入 `DSH_VERSION="${DSH_VERSION:-0.1.5-rc.2}"` ＋ 3 行说明注释，6 处字面量改 `@${DSH_VERSION}`；**双验通过** —— `set -n` 语法检查 RC=0（无语法错）、展开验证「默认 ⇒ 6 处全 `0.1.5-rc.2` ／ 显式 `DSH_VERSION=0.1.2-rc.1` ⇒ 6 处全回 `0.1.2-rc.1`」、行尾纯 LF 未混排。✅ **已回同步 CVM**（scp 三文件；两侧 sha256 逐字节一致 `0484d821…` ／ `5fe6b699…` ／ `77986d45…`；同步前 CVM 侧与仓库 HEAD **同源**、无现场改动被覆盖）
    - ✅ **3.1 前置 · 装置侧两面不同代（WB 2026-09-16 发现 → 同日处置）**：`harness/package.json:26-27` 是**受版本控制**文件，本机原钉 `0.1.2-rc.1`，而 **CVM `~/harness` 那份已被 3.0.4 现场改成 `0.1.5-rc.2`**（`.bak-304` 为证）⇒ **同一份文件两面不同代**；又因同步方式 = **整树 tar**（CVM `SYNC-ANCHOR.txt` 原文 `excluded: node_modules, .git, dist`）⇒ **`package.json` ＋ `pnpm-lock.yaml` 都在覆盖范围内**，3.1 期间任何一次同步都会把 CVM 打回 012、重演 3.0.3 混代崩溃。**老大 2026-09-16 拍「本机整体升 015」（原选项 ①）**：
      - ✅ **已执行（提交 `a974258`）**：`harness/package.json` ＋ `pnpm-lock.yaml` 升 015（lockfile **删树重算**：`0.1.2-rc.1` 出现 0 次 ／ `0.1.5-rc.2` 出现 4923 次）；npm 全局 CLI（`%APPDATA%\npm`）升 `0.1.5-rc.2`；本机 `~/.dsh` 回退层已指 015 ⇒ 本段「5 条未闭合逐条结账」④「本机 `~/.dsh` 未修」**就此结清**
      - ✅ **剩余两项已派发 Qoder（2026-09-16）→ 已回报（2026-09-17）**：① `harness/node_modules` 重建（开工自检判 **symlink 可用** ⇒ 走 (a) 默认 isolated；顶层链接 `<SYMLINKD>`、**空壳目录 0**、4 条测试进程均自退出）✅；② 工程 `.dsh-home/profiles/{larry,sdk}` 升 015（与修前基线 diff **各仅 2 行版本号**、composition 未动；两个 lockfile `0.1.2-rc.1` 均 0 次）✅。**附带任务 C**：与 CVM lockfile 逐行 diff = **仅 1 行差异**（本机多 `packages/plugin-015-preset-probe` 空 importer，因 CVM 尚未同步提交 `8aee09b`）⇒ 无依赖解析分歧。**（Qoder 报告另提两处订正：① 与「符号链接问题已终结」条的记载矛盾暴露，已并入该条复验；② 原派发稿验收措辞需订正 —— 两条负向哨兵本就应红）**
      - ✅ **符号链接问题已终结（2026-09-17 WB 独立复验，推翻 WB 自己在 09-16 的记载）**：原记「本机创建真符号链接失败、仅 `%TEMP%` 内可建」**不成立**。实测（WB 与 Qoder **两条独立通道**）：`os.symlink` 与 `fs.symlink(...,'dir')` 会**抛** `WinError 2`／`ENOENT`，**但链接真实建成** —— `isSymbolicLink=true`、`readlink` 正常、`children` 可列、`reparse tag = 0xa000000c`（真 SYMLINK；junction 为 `0xa0000003`）；Qoder 另以 `mklink /D` 在四路径（`D:\` 根 ／ `C:\Users\SuLarry` ／ 项目目录 ／ `%TEMP%`）全数建出 `<SYMLINKD>`。⇒ **本机 symlink 可用**，`harness/node_modules` 已按 **(a) 默认 `pnpm install`** 装出 **isolated** 布局（`.modules.yaml` 实证 `"nodeLinker": "isolated"`），与 CVM **结构等价** ⇒ 下方「hoisted 兜底 ＋ `~/.npmrc` 固化」与「本机 hoisted ↔ CVM isolated」**均作废**（`~/.npmrc` 未动，仍只有 registry 一行；DSH-3.1 清单**无需**加"两面结构不同"标注）
        - **错因 · 元教训**：判据取在**异常分支**（见 `except` 即判 FAIL），从未验证实际结果；另把 `.NET` 的「需要管理员权限」当反面对照 —— 它**不传** `ALLOW_UNPRIVILEGED_CREATE` 标志，在任何路径都报同样错，**不构成对照**。09-16 观测到的「建出空目录」**今日不可复现**，**成因未查清**（不补成因）
        - ✅ **仍然成立的四条判据（与上述结论无关，勿一并丢弃）**：① **「目录存在」≠「链接建成」** —— 判链接须读 `os.lstat().st_reparse_tag`，不可用 `os.path.isdir`（pnpm 的 scope 目录 `@deepseek-ai`／`@types` 本身无 `package.json`，**不可当空壳**）；② **pnpm 状态缓存不校验内容** —— 外部删过树后 `install` 与 `--force` 均回 `Already up to date`、**不自愈**（须删 `.modules.yaml` ＋ `.pnpm-workspace-state-v1.json`，或整树重装）；⚠️ **2026-09-17 精细化（WB，3.7.3 实测）**：那两个文件**都不含旧代条目**（`0.0.1-rc.1` 计数 = 0；`.modules.yaml` = 98570 B ／ 1674 行 `hoistedDependencies`）⇒ **「缓存里留着旧记录」被证伪**；起效的是**删掉它们 ⇒ pnpm 放弃增量短路、走全量校验**（⚠️ 该句为**推断、未证**）。3.7.3 实测起效路径：lock 与声明都改对后，常规 `install` 报 `Packages: -4` 但**复扫树仍脏** ⇒ **重命名这两个文件**再 install 才 `stale = []`（两侧同法）；③ **install 输出不能当验收**（报 `Done`／`exit 0`／零 error 仍可能是空壳树），必须用 `require.resolve` 逐条验；④ **`pnpm run <script>` 会先自动跑一次不带参数的 `install`**
      - ✅ **剩余三处遗留已处置 / 已裁（WB 2026-09-17，老大同日裁决）**：① **`cvm-probes` 钉版 → 已参数化**（详见本段「3.1 前置 · 仓库资产缺陷」；✅ 已回同步 CVM）；② **CVM 缺 `packages/plugin-015-preset-probe/` → 随下次同步补齐**（老大裁「随下次同步补齐」；该包 3 文件受 git 跟踪、由 `8aee09b` 引入，**不补亦不影响 lockfile 解析一致性** —— 唯一的逐行差异就是这一行空 importer）；⚠️ **另发现一处滞后**：CVM `~/harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` 的注释仍写旧落点（`profiles/node_modules/…`，本机已于 2026-09-17 改为 profile 自身层）⇒ **随下次同步一并覆盖**（该处是"范式级"注释，留着会继续把人引到已证会取旧代的层）；③ **主 `~/.dsh` 的两个空 `node_modules` 已删**（2026-09-17 实测为 **`profiles/{larry,web}` 各一个**、均 0 项 —— ⚠️ 原记「`larry` 下两个」不准；用 `rmdir` **非递归**、删前断言为空、删后复核 `profiles/sdk` 那份 **82 项完好未动**）
  - **执行人分配**
    - **本机环境同代化收尾**（`harness` 树重建 ＋ 工程 `.dsh-home` profiles 升 015）→ **Qoder**（老大 2026-09-16 拍；属环境整理类、非代码实现，不占用 Trae 的 3.1 主战场；他已做过本机 / CVM / WSL 三处代际扫描，有现成上下文）
    - **3.1–3.6 实现侧 + 3.2 定性** → **Trae**（分工原则 + 他 §八 已自认领）
    - **3.5 上机跑** → **Trae**；**器材由 Claude 出**（`landlock_probe.py` 已回归：ABI 自适应 + 负向开关 + `VERDICT=` 机读行）
    - **3.0 CVM 侧**（本机 harness 同步 + real-api 三态 + 采数）→ **Trae**（他自验通道 ✅ 0.94 s、四范式齐备）；**Claude 只在验收环节上机**做负向对照
    - **3.8 A 段协议设计稿** → **WB 出稿、Trae 承接实现**。依据：分工「WB=架构」；且其核心是"审批请求双向中继"的协议定义（3.3 三段收敛的终点），需**跨段视角**，写码者自定协议易把实现细节当规范
    - **3.7 落盘** → ✅ **定性已完成（3.7.1，2026-09-17）：`EPERM` 归因不成立**（Trae 自己通道 4/4 可写、原命令两处均不复现）⇒ **落盘归 3.7.2**，落点 = **`sdk` 面**（不再是 `larry`）
    - **3.9 收口核对表 / `docs/` 维护 / 复验他人结论** → **WB**
  - **批次节奏**
    | 批次 | 内容 | 说明 |
    |---|---|---|
    | **1** | **3.0** + **3.2** + **3.7** | 三者互不依赖；⭐ **2026-09-17 实况**：3.0 ✅ ／ 3.2 ✅ **已回报＋复验** ／ 3.7 **拆为 3.7.1（✅ 已回报＋复验）＋ 3.7.2（✅ 已回报＋复验）**；⚠️ 3.7.2 落点**已由 `larry` 改 `sdk`**（该面已退役）｜＋ **3.7.3「工程卫生合并块」2026-09-17 派发 → ✅ 已回报＋复验（J1–J11 全成立）**（由 3.7.2 未闭合项 2 ／ 4 ＋ 3.2 判据缺陷 1 合并）｜＋ **3.2.1 ✅ 已交付并复验（WB 2026-09-17：结论认可、另订正 3 处）**｜＋ **3.7.3-T（Claude 独立测试件）✅ 已交回并复验（T1–T4 四项判定均成立）** ⇒ **批次 1 已全清** |
    | **1.5** | **3.7.4** + **3.7.5** | **3.7 的下游尾巴**（老大 2026-09-17 裁「两项单开」，WB 同日立项）：**3.7.4** = 本机 `s0-e2e` 装置缺陷（`cp -r` profile ⇒ pnpm 虚拟 store 失配）→ ✅ **已回报并复验（2026-09-20，本机／Trae 交付 ＋ WB 同日复核）＋ 独立测试件 `3.7.4-T`（本机／Claude）亦已回报并复验**；**3.7.5** = 旧代残留载体处置 —— `(b)` CVM 012 代参照 profile **✅ 已裁「删」（老大 2026-09-18）**、`(c)` 本机共享层 241 条 junction **已实质归位**（剩一条架构待裁）→ ✅ **`(b)` 已执行（含 `acp` 扩围 ／ `explicit` 分支退役）并 WB 复验成立（2026-09-22，CVM ／ Qoder）**。两者**均不阻断批次 3**；⚠️ 但 `3.7.4` 与批次 3 **执行人同为 Trae ⇒ 撞工位**，实际按「**先 `3.7.4`、批次 3 顺延**」处理（详见本段 `DSH-3.7 收尾两项` 的「顺序」条）⇒ ✅ **撞工位已于 2026-09-20 解除（`3.7.4` 当日收口）⇒ 批次 3 可起跑** |
    | **2** | **3.1 S0** | 单发；后续一切的地基 —— ⭐ **已提前至批次 1 之前派发（老大 2026-09-17 拍：编号在前即先做）** |
    | **3** | **3.3 → 3.4 → 3.5 → 3.6** | **严格串行**（逐层叠加、单独验收）｜**`3.3-a` 已交回并复核（2026-09-21）· 判定成立** ｜ ⭐ **2026-09-21：`3.3-b` 已交回并复核 · 判定成立**（WB 现场独立复跑复现） —— 分稿理由：批次 3 规矩是「逐层叠加、单独验收」；且 b 段**技术形状与 a 段不同**（要抢 stdio ＋ 跨进程）。**`3.3-c(=3.8)` 另派**（依赖 A 段协议） |
    | **4** | **3.8** + **3.9** | 3.8 可在批次 3 后期并行 ｜ ⭐ **2026-09-22：3.8 设计稿 v1.0 定稿 （三方评审融合）→ 实现第一切片 `3.8.1`（driver 成型）已派发（本机 ／ Trae）⇒ ✅ 已回报 · WB 复核成立（2026-09-22）**；⭐ **3.8.2（装置缺陷修复）已完成并复核成立（2026-09-22）** |
  - 「待核（不阻塞拍板）」段各条**全为调研类**（不碰 CVM、不等 Key）⇒ 可与批次 1 并行派出
- [x] ~~DSH-2 任务 0 派发~~ **已完成**（Claude 2026-09-08，报告已吸收内联至决策稿 §3.6 逐项证据表：A 案成立、8/8 机制属实，WB 复核订正 2 处行号）
- [x] ✅ **DSH-3.7.4 · 已闭环（2026-09-20）**（**老大 2026-09-17 裁：两项单开**；WB 同日立项并放入本顺序）—— 来源 = 3.7.3-T `T1` 暴露的存量装置缺陷。交付 ＋ WB 复验 ＋ 独立测试件 `3.7.4-T` **三件全完成**、**9 条未闭合项全部落地**（正文 = `archive/roadmap-history.md` 的 `##### DSH-3.7.4` ／ `##### DSH-3.7.4-T`）；⚠️ 唯一下游尾巴 `#5`（POSIX 分支补测）**已转出** ⇒ 跟踪点 = `exchange/log-claude.md` 的 `DSH-3.7.4-T·P`
- [ ] **DSH-3.7.5 · `(b)` 已回报并复验（2026-09-22 · 判定成立）｜ `(c)` 待裁**（**老大 2026-09-17 裁：两项单开**；WB 同日立项并放入本顺序）—— 来源 = 3.7.3 未闭合项 6（正文 = 本段末的 `DSH-3.7.5` 块）
  - 📮 **派发实况（2026-09-20）**：**`3.7.4` 已派发（本机／Trae）＋ ✅ 当日回报并复验** ＋ **其独立测试件 `3.7.4-T` 同日派发（本机／Claude）＋ ✅ 当日回报并复验**；**`3.7.5` 未派**（`(b)` 已裁「删」但**未起跑**、`(c)` 剩架构选择待裁）。⇒ **两件不合并** —— ① **性质不同**（`3.7.4` = 装置**代码修复**，属地归 **Trae**；`3.7.5` = **环境处置**，历史归口 = 环境整理类 ／ **Qoder**）；② 合并会把"待裁"与"可干活"绑进同一张稿。
  - 📮 **派发实况（2026-09-22）**：**`3.7.5` 的 `(b)` 已派发并已回报**（**CVM ／ Qoder**，派发稿 ＋ 回报同载 `exchange/log-qoder.md`（**已按交流区规矩清理，2026-09-22**；回溯 `git log -p -- exchange/log-qoder.md`））—— `(b)` 自述闭合（`sdk` 真删：同分区 `mv` 到 `sdk.bak.20260922-0948`，`rc=0`、全程无 `rm -rf`）；⚠️ **§2-P2 两条待裁同日由老大裁 (A) 并已执行**（① `profiles/acp` 一并删 → `acp.bak.20260922-1007`；② `explicit` 分支退役改脚本 → `ba3e42e`，双侧 sha256 一致 ／ 纯 LF）。⇒ **WB 当日复验：判定成立 · 回报可采信**（见本块末「✅ ⭐ WB 复验判定」）。⚠️ **派发前已重测前提**（老大点名）⇒ 实测**推翻 ／ 新增 3 条**（见本块末「⭐ 派发前重测前提」）。
  - 📐 **顺序（2026-09-20 实况 ＋ 一处新暴露的矛盾）**：`3.7.4` **已先起跑**（老大 2026-09-20 指示「派 374」）。⚠️ **新暴露：`3.7.4` 与批次 3（3.3→3.6）的执行人同为 Trae ⇒ 若真并行，Trae 手上同时两把活**，与「同时只跑一块」惯例冲突 —— **该冲突此前从未被登记**（原「场地重叠复核」条只核了 `3.7.4` vs `3.7.5` 的**场地**重叠，**没核执行人维度**）。⇒ ✅ **实际已按「先 `3.7.4`」走完（2026-09-20 同日交付 ＋ 复验）** ⇒ **该撞工位冲突随之解除，批次 3（3.3→3.6）可起跑**。`3.7.5` 执行人若定 **Qoder**，则**与 Trae 不撞工位**、可并行。
  - ⚠️ **场地重叠复核（不要照抄旧结论）**：`3.7.4` 只在**临时 home**（`mkdtempSync`）里跑 `dsh plugin add` ⇒ **不动 `harness/node_modules`**；`3.7.5` 的 `(c)` 只读本机共享层 ⇒ 两者**不争同一资源**、理论上可并行，但按「同时只跑一块」惯例**仍建议串行**。
  - 📎 **两块正文已升格为 `#####` 子节（2026-09-20 老大裁 · 按 WB 建议 ⓐ）** ⇒ 判据 ／ 证据 ／ 处置表 ／ 诚实边界全在 **`##### DSH-3.7.4`** 与 **`##### DSH-3.7.4-T`**（`archive/roadmap-history.md` 的 DSH-3.7 段内、紧随「已定前提」）。**本条目此后只留派发调度视角。**

  **DSH-3.7.5 · 旧代残留载体处置（`(b)` CVM 012 代参照 profile ／ `(c)` 工程共享层 241 条 junction）** 📌 **立项 · `(b)` 已裁「删」并已执行（含 `acp` 扩围 ／ `explicit` 分支退役）／ `(c)` 待裁** ｜ ✅ **已回报（CVM ／ Qoder，2026-09-22）⇒ 派发稿 ＋ 回报在 `exchange/log-qoder.md`（已清理，2026-09-22）**（✅ **WB 复验成立**；收口后按 `3.7.4` 体例升格）
  - **要回答的一件事**：3.7.3 只清了**引用者**（依赖声明 ＋ lock），**被引用者（旧代本体）是否还有活着的载体**、要不要处置。
  - ⭐ **`(c)` 已实质归位（WB 2026-09-17 实测，本条订正原登记）**：工程共享层 `.dsh-home/profiles/node_modules` 下 `@deepseek-ai/` **241 条 junction 逐条有效、悬空 0**（`st_reparse_tag = 0xa0000003`）；关键三件 `dsh-sandbox-local` ／ `dsh-sandbox-windows-acl` ／ `dsh-storage-domain` **均不直指某一支**，而是指向 `.pnpm/node_modules/@deepseek-ai/*` **汇总层**，该汇总层现只解析到**唯一存活**的 `0.1.5-rc.2`（实测分片 `@deepseek-ai+dsh-sandbox-lo_afd5a527…` 的 `package.json` = `0.1.5-rc.2`；旧支 `@deepseek-ai+dsh-sandbox-lo_fc402b20…` **已随 3.7.3 ① 消失**）⇒ **"镜像旧代"的实质已自动解除**。
    - ⚠️ **但暴露一条结构性事实（值得登记）**：该共享层**不是独立副本，是 `harness/node_modules/.pnpm` 的派生视图**（241 条 junction 目标全为 `harness/…` 的**绝对** junction）⇒ **harness 树一旦重装 ／ 换路径，这 241 条就有悬空风险**。⇒ 处置选项应从「清 241 条」改为「**要不要让它与 harness 树解耦**」，属架构选择、非清理动作。
  - ✅ **`(b)` 已裁（老大 2026-09-18）＝ ③ 删** ｜原记待裁三选项：① **升 015**（对齐 3.0.4 的处置）；② **保留作负向对照器材**（`docs/production-env.md` 已将其降级为"有完整 profile、无凭据"的对照件）；③ **删**。
    - **处置对象**：**CVM** `/home/ubuntu/larry-dsh-home/profiles/sdk`（实测**仍整体 012 代**：`dsh-base` ／ `dsh-sdk-app` ／ `dsh-storage-sqlite` 三件全 `0.1.2-rc.1`）。
    - ⚠️ **边界（照 3.7.3 同类处置的既有先例）**：只删**该 profile 目录**；**`~/larry-dsh-home` 本身不动**（它的其余内容 —— `sessions` ／ `storages` ／ 其它 profile —— **不在本裁范围内**）。⛔ **删前须先核「该 profile 是否仍被引用」**（`docs/production-env.md` 已记 `~/larry-dsh-home` 降级为**负向对照器材、不是运行 home**；但 `harness/scripts/cvm-probes/*.sh` 历史上钉过该 home ⇒ **须实测确认无脚本仍把它当运行 home**，照抄旧登记会踩 3.0.3 那个坑）。
    - ⚠️ **附带的跨代隐患随删除一并消失**：其 deps 里 `@larryagent/plugin-storage-probe` 是 `link:/home/ubuntu/harness/packages/plugin-storage-probe`，而 CVM `~/harness` 已升 015 ⇒ **012 profile 挂着 015 侧的 link**（3.0.3 混代形态的同类）—— 删后该隐患**自动解除**，**无需再单独判**。
    - 📌 **已执行（2026-09-22）**（原记：老大 2026-09-18「先不派，今天休息」⇒ 派发稿未写）⇒ 派发稿 ＋ 回报 = `exchange/log-qoder.md`（已清理，2026-09-22；回溯 `git log -p -- exchange/log-qoder.md`）；按 3.7.3 同类先例走（**先重命名备份 → 核验 → 真删**，⛔ 禁用 `rm -rf`）⇒ ✅ **实际手法 = 同分区 `mv`**（→ `sdk.bak.20260922-0948`，`rc=0`；备份内三件仍 `0.1.2-rc.1`、备份体积与删前对同路径读数**逐字节相同**）—— ✅ **WB 复验成立**（见本块末「WB 复验判定」）。
  - **场地**：CVM（`(b)`）＋ 本机只读复核（`(c)`）
  - **执行人**：环境整理类，历史归口 **Qoder**（**老大 2026-09-22 定**；与 Trae 不撞工位）
  - ✅ ⭐ **WB 复验判定（2026-09-22 · ssh(Bash) 通道 CVM 现场独立取证）＝ 判定成立 · 回报可采信**
    - **独立取物证（非读其结论）**：① `sdk` ／ `acp` 原路径 `test -e` **均为假** —— `profiles/` 现为 `acp.bak.20260922-1007` ／ `node_modules` ／ `sdk.bak.20260922-0948`；② 备份内版本**实读** = sdk 三件（`dsh-base` ／ `dsh-sdk-app` ／ `dsh-storage-sqlite`）＋ acp 两件（`dsh-base` ／ `dsh-acp-app`）**全 `0.1.2-rc.1`**；③ 备份体积 `du -sb --count-links` = **161469045** ／ **167075668**（与自述**逐字节相同** ⇒ 纯重命名、无拷贝损耗的形态与之相容）；④ `~/larry-dsh-home` 顶层四项均在，`sessions` ／ `storages` ／ `.anonymous-user-id` 的 `size` ＋ `mtime_epoch` **与自述逐项相同**；⑤ `find ~/.dsh -newermt 09:40(+08:00)` = **0** —— ⚠️ **锚比原稿的 09:48 更早 ⇒ 结论更强**（活 home 在**整个动作窗内**未被触碰）；⑥ 四根链接 **3582 ／ 悬空 26**；⑦ 共享层 **486 ／ 97 ／ 命中 012 分片 71**（WB 以 `readlink` 逐条匹配**独立复算**，与自述一致）；⑧ 证据包 **22 件**；⑨ `~/larry-data/larry.db` **57344 B ／ mtime `09-16 18:47` 未动**。
    - ⭐ **WB 加做一条比原判据更硬的判据**：遍历四根链接**逐条 `readlink`** ⇒ **无任何链接指向 `larry-dsh-home`** ⇒ **删除这两个 profile 在结构上不可能新增悬空**（该结论**不依赖"删前计数"**，绕开了对执行方单方读数的依赖）。现存 26 条悬空**全部落在 `~/harness/node_modules/.pnpm/node_modules/`**（React ／ Lexical ／ `node-addon-landlock-run` 等）⇒ 与本块动作无关。
    - **裁决② 双侧独立核**：本机 ／ CVM `cvm-step0.sh` **sha256 同为 `f2e15f35…`**（逐字节一致，本机侧取自 `ba3e42e`）、**CR 字节双侧 0**（纯 LF）；**WB 实跑 `explicit` ⇒ `EXIT=3`** ＋ stderr 三行退役说明 ＋ **`/tmp/step0.*` 均不存在** ⇒ **拒绝发生在任何探针动作之前**；脚本内注释已写明「⛔ 不得删掉本分支 —— 会 fallthrough 到 `unset DSH_HOME`、**静默在真实库 `~/.dsh` 上跑探针**」。
    - **诚实边界（本复验结论的适用面）**：① **J6「全程无 `rm -rf`」的手法取自执行方自述** —— 现场证据（原路径消失 ＋ 备份存在 ＋ `du` 逐字节相同 ＋ 备份目录 mtime = 动作时刻）与之**相容**，但**不可独立证否**；② **J7 到期日读不到** ⇒ 按登记 `2026-10-09`（WB 通道同样读不到）；③ **"删前"读数取自其证据包（非独立）** —— 但已由上面那条更硬的结论**绕开**。
    - **对其自曝的核**：§3-2 自曝「首轮用 `find -L` 计数等价于重复计悬空数（97）、正确应为 71」**成立**（WB 独立得 71）；§3-3「P2② 无害试跑**不可做**」的理由链（跨代组合可能触发 profile 层 heal 而**写盘到待备份的那棵**、污染 J2 物证）**成立**，且裁决② 落地后已用退役脚本实跑补上确定性结论；§3-1 ／ §3-5 ／ 新增自曝（`$"\r"` 是 gettext 引用**不是 CR**）三条，WB 均**无异议**（CR 侧已独立复核为 0）。
    - ⚠️ **一句话**：`(b)` 本块**可判闭环**；但 ⛔ **不得据此声称「CVM 上 012 代残留已清干净」** —— 共享层 486 ／ 97 ／ 71 **仍在**（原判据 J5② 的诚实边界，复验同样守）。
  - ⭐ **派发前重测前提（WB 2026-09-22 · ssh(Bash) 通道实测）⇒ 3 条新事实 ／ 缺口**（**该附录已按交流区规矩清理，2026-09-22**；回溯 `git log -p -- exchange/log-qoder.md`））：
    1. ✅ **旧登记成立**的：处置对象仍存在 ／ 三件仍全 `0.1.2-rc.1` ／ CVM `~/harness` 已升 `0.1.5-rc.2`（`.pnpm` 内 012 分片**已不存在**）／ 跨代 `link:` 仍在。
    2. ⚠️ **新缺口 ①（范围）**：同 home 的 **`profiles/acp` 也是 012 代**（`dsh-base` ／ `dsh-acp-app` = `0.1.2-rc.1`，**159 MB**）—— 原登记未列为处置对象 ⇒ **`(b)` 是否扩围 = 待老大裁**（WB 倾向一并删）⇒ ✅ **同日已裁 (A)：一并删，当日执行完毕**（→ `acp.bak.20260922-1007`，`rc=0`）。
    3. ⚠️ **新缺口 ②（"无脚本仍引用"不成立）**：`harness/scripts/cvm-probes/` **6 处**命中该 home —— 5 处注释 ＋ **1 处活赋值**（`cvm-step0.sh:13` 的 `explicit` 分支，自述定位 =「仅作负向对照器材」）；**且该分支实测已失效**（该 home 的 CLI 入口 `@deepseek-ai/dsh` 链接**已悬空**）⇒ 「负向对照器材」这一定位在删除**之前**就已不成立。**脚本要不要跟着改 = 待老大裁**。⇒ ✅ **同日已裁 (A)：删 profile ＋ 改脚本** —— 落地为「**显式拒绝 ＋ `exit 3`**」（⚠️ **不是移除分支**：移除后会 fallthrough 到 `unset DSH_HOME`、**静默在真实库 `~/.dsh` 上跑探针**），本机 ／ CVM 双侧 sha256 一致 ／ 纯 LF（`ba3e42e`）。
    4. ⚠️ **新缺口 ③（同族载体）**：该 home 的 `profiles/node_modules` 共享层 **486 条链接 ／ 97 条悬空**（其中 **71 条**指向已消失的 `@deepseek-ai+dsh@0.1.2-rc.1` 分片）—— 原登记只核了**本机**的 241 条（悬空 0），**CVM 侧从未核过**。
    5. 📌 **体积（统一口径 `du -sb --count-links`）**：`~/larry-dsh-home` 总 **313 MB**（`sdk` **153** ／ `acp` **159** ／ 共享层 **40 KB**）；该机余量 `39 GB ／ 50 GB` ⇒ **删除价值不在省空间**，在消除旧代载体的误用风险。

---

## 开发路线图

> 主线阶段 **P0–P4 已全部完成 ✅**，LarryAgent 进入「能力增强 / 长期迭代」新阶段。详细情况冷存于 `archive/roadmap-history.md`。

### 历史索引（已完成阶段，冷存于 `archive/roadmap-history.md`）

- **P0 - 最小聊天闭环** ✅（2026-08-07）→ 端到端聊天闭环。详见 `archive/roadmap-history.md`。
- **P1 - 记忆系统可用** ✅（2026-08-07）→ Embedding / ChromaDB / 长期记忆 / 归档 / 降级。详见 `archive/roadmap-history.md`。
- **P2 - 工具调用闭环** ✅（2026-08-11）→ FileOps / ShellTool / Function Calling / `/api/tools` / config。详见 `archive/roadmap-history.md`。
- **P3 - 流式 + 体验优化** ✅（2026-08-12~15）→ SSE / 重试 / Token / API Key 校验 / 异常类。详见 `archive/roadmap-history.md`。
- **P4 - PC 客户端可用** ✅（2026-08-15~19）→ Tauri 进程管理 / Vue 前端 / 界面基调 / 会话 API / 聊天界面 / 异常出口统一。详见 `archive/roadmap-history.md`。
- **DSH-1 - 事实校准** ✅（2026-09-08）→ DSH 迁移线（A-framework）第 1 阶段：packages 盘点 / AGENTS.md / releases / Py SDK 一等二等判定。详见 `archive/roadmap-history.md`。

> **DSH 线**（`DSH-N` 独立序列）：DSH 迁移专项，按照完成情况持续归档，在飞阶段见上方「DSH 迁移」区。

> 原 P5（移动端 + 部署）已取消 P 编号，2026-08-20 拆分为「移动端开发」「部署调试试运行」两个普通阶段（2026-09-11 起移出本文件，现存于 `HUMAN_NOTE.md`），与记忆系统调优等并列。
