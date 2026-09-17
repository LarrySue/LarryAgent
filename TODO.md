# LarryAgent TODO
> **TODO 治理约定**（2026-08-17 定稿）
> - 本文件为**活跃 TODO**：只含当前待办（能力增强 / 长期迭代）+ 工程债务 + 部分远期计划。已完成部分见 `archive/roadmap-history.md`。
> - ⏸️ **文件末尾「初步裁定为过时计划的条目（缓删）」区**：2026-09-11 老大初步裁定为过时，**缓删，AI 勿处理**（勿删、勿归档、勿当待办推进）。
> - **一致性不变量**：✅ 阶段内不得含 [ ]；含 [ ] 即误归档，须移出至 backlog 或对应未来阶段。
> - 加载方式：软性机制——AI 任务相关时主动 Read 本文件，不自动注入。
> - 检索归档：需要时 Grep `archive/roadmap-history.md`；排查 BUG / 做改动前先扫归档。

## DSH 迁移（A-framework · 已定稿 · DSH-1/DSH-2 已归档，DSH-3 待启动）

> **分区约定（2026-09-08）**：**本区只放待办**。判定依据、行事规则、31 子项承接总表、风险清单一律留在 `docs/dsh/dsh-migration.md`（下文每条标注出处），本区不重复结论。
> - **编号**：DSH 线用独立 `DSH-N` 序列，与 P0–P4 主线无关；**完成一个即归档一个**——**DSH-1 / DSH-2 均已完成并冷存于 `archive/roadmap-history.md`**，本区自 **DSH-3** 起。
> - **DSH-2 已整体归档（2026-09-11）**：**2.0–2.6 全部 ✅**（5 项退出条件全通过 + 2.6 收口复核完成）；冷历史快照见 `archive/roadmap-history.md`「DSH-2」段，判定依据见 `docs/dsh/dsh-migration.md` §3.6、复核见 §3.4。

### DSH-2 · 代码形态 + 环境准备 ✅（2026-09-08 → 2026-09-11 · **已整体归档**）

> **全文冷存于 `archive/roadmap-history.md`「DSH-2」段**（治理约定：完成一个即归档一个）——含 2.0–2.6 各子任务结论、5 项退出条件原始证据、DSH-2.4 全量详情、2.5③ 方言缺口三层、2.6 收口复核。
> **判定依据 / 环境规格表 / 8 项证据表 / 通信面定型（含 T1/T2/T3 触发线）** → `docs/dsh/dsh-migration.md` §3.4 / §3.6；**本机环境基线** → `docs/local-env.md` §4 / §6 / §8 / §9 / §10。
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
  - ✅ **开工第一卡点已解（2026-09-14）**：三环境三把专用 Key（`larry-dev` / `larry-wsl` / `larry-cvm`），**按环境分不按轨分**（同环境内 backend 与 DSH 填同一把）；CVM 那把**已落位**，见 3.0

> **子阶段划分（2026-09-14 定）**：3.0 前置 → 3.1–3.6 主线六切片（**严格串行、逐层叠加**）→ 3.2（＋3.2.1）首验 / 3.7.1–3.7.2 方言修复件（支线）→ 3.8 设计产出 → 3.9 收口。
> **判据 / 验收基准 / 负向对照矩阵 / 采数口径 / 执行范式 → `docs/dsh/dsh-migration.md` §3.6「DSH-3」**；CVM 环境与凭据 → `docs/production-env.md` §12；方言修复件范式 → `docs/local-env.md` §4.3；**派发规格（执行人 / 批次）→ 本文件「待派发」段**。
> ⚠️ 原详细计划稿 `exchange/dsh-3-plan.md`（含四方评审附 A/A-2/B/C）的实质内容已于 2026-09-14 **全数承接入本文件与 §3.6**，该稿已于 `677523d` 处置（删除）；如需追溯评审原文：`git show 3362f57:exchange/dsh-3-plan.md`。

#### DSH-3.0 · 开工前置（CVM 环境 + 凭据 + real-api + 采数）✅ **全段已收口（2026-09-16）** ｜ DSH-3.0.5 已回报 · WB 复验通过（A 独立复现成功 ｜ B 已答：空壳与不完整 profile 不可分）｜ ✅ 原「1 条架构发现」已定性（09-16 二次上机 · 四组对照）：**非 DSH 缺陷 ⇒ 不立项**，真因 = `~/harness` 的 lockfile 被冻结在旧代际（跨代增量升级残留）⇒ 改记**行事规则「跨代升级须重算 lockfile」** ｜ ✅ **`~/harness` 已于 2026-09-16 修好并验收（WB 上机）**：012 物理目录 **215 → 0**、lockfile 全 015（`persistence` / `query` / `fs` 三处）；两个 home 的回退层经 heal 重建（`~/.dsh-015` 悬空 **74 → 0**、`~/.dsh` 余 24 且**修前既有**、全为 web 前端包）；`~/.dsh` 端到端 **8/8 绿**（D1 条件：不注入 env key）⇒ **修复未引入回归**。⚠️ 过程留痕 1 条：`-32603 cannot create effect on inactive context` **曾间歇出现、成因未知**（已排除「代际变化」「残留进程」两个假说），详见 `docs/dsh/dsh-migration.md` §3.6 ｜ ✅ **CVM 残留清理完成（2026-09-16）**：旧探针 3 件（landlock 正反对照 / node:sqlite 并发 / python 对照）**已回传入仓** `harness/scripts/cvm-probes/`（加 `cvm-` 前缀）、CVM 侧原件与 `~/dshprobe` 已删；家目录旧脚本 6 件（硬钉 `larry-dsh-home` 的改前版）＋ sqlite 测试库 5 件＋ 旧同步包 `larry-harness*` 已清；`~/.dsh` 余 **24 条悬空已定为当前事实（不阻塞、不根治）**，见 `docs/dsh/dsh-migration.md` §3.6

> **派发块 · 号 = 一份派发稿（2026-09-16 订正）**：**DSH-3.0.1（09-14 → Trae）已停止推进** —— A / B / C / F 四组照用（与 DSH 版本无关）；**D / E 归 DSH-3.0.3**（按 015 重做）；J1 装 profile 授权**作废**（命令钉死 `0.1.2-rc.1`）。**DSH-3.0.2（2.7.2 A-framework 契约实测）** 为插入项，已回报并经 WB 判「过」；其环境污点根因已并入本段 `:64-65` 前置。**DSH-3.0.3（装 profile + 重跑 D / E）已回报（09-16）⇒ 环境阻断**；老大裁定修复路两条都做 ⇒ **DSH-3.0.4（环境同代化修复 + 重跑 D / E）09-16 已发 Trae，当日回报「阶段 Ⅰ」**（任务 0 全层代际诊断 ✅ ／ 任务 1 隔离 015 环境 boot 验证 ✅，**未动 `~/.dsh`**）⇒ **阶段 Ⅱ 同日回报**：任务 2 ✅（**①＋④** CLI / 装置升 015 ＋ **③** 补 3 个可选 peer；**② fallback 层未动、待裁**）、任务 3 ✅ **D / E 两组三态判据全部成立** ⇒ **WB 已复验（主结论通过 · D1 证成 · 1 条订正）**（见 `:257`）。

- [x] ✅ **凭据落位**（2026-09-14）：CVM `~/.dsh/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY`（600 / 223 B，`records:` 段完好）
- [x] ⚠️ **环境核对**（2026-09-14，**同日订正**）：`dsh@0.1.2-rc.1` 双证（CLI + `package.json`）；node v22.22.2
  - ⛔ **原记"`~/.dsh/profiles/` 四个全在"是错的** —— 那是**数目录、没验依赖**。实测：`~/.dsh/profiles/sdk` 的 `dependencies` = **`{}`**、`node_modules/@deepseek-ai` = **0** ⇒ **空壳**；`larry` 有 7 包；**装齐的 profile 全在 `~/larry-dsh-home`**（sdk 101 / acp 100）
  - ⭐ **本机同一形态**（`.dsh-home/profiles/sdk` 99 包 / `~/.dsh/profiles/*` 空壳）⇒ **"凭据落一个 home、profile 落另一个 home"是系统性问题**，非 CVM 独有
  - ⇒ 纪律「CVM 以 `~/.dsh` 为准」**结论不变**（其理由本就含"裸跑默认"一条，与依赖无关），但**前提需补真**（见下）。
- [x] ✅ **同步本机 `harness/` → CVM**（Trae 2026-09-14）：**26 → 61 文件 / 566,393 → 753,485 B**，目标 `/home/ubuntu/harness/`；`SYNC-ANCHOR.txt` 已落（源 commit `57304ac` / `HEAD:harness` = `6c268877`；tar 145.6 KB / 55 条目、`scp` 1.11 s；`pnpm install` exit 0 / 18 s）
  - ✅ **卡 3.5 的那三个沙箱探针包已到位**（`plugin-sandbox-probe` / `plugin-sandbox-mount-probe` / `plugin-sandbox-dialect`）
  - ⚠️ CVM **原本无 pnpm / 无 corepack** ⇒ 已 `npm i -g pnpm@11.7.0`（3 s）
- [x] ✅ **装齐 CVM `~/.dsh/profiles/sdk`**（**归 DSH-3.0.3 → 续 DSH-3.0.4**；DSH-3.0.1 的 J1 授权**已作废** —— 那两条命令钉死 `0.1.2-rc.1`）：两条 `dsh plugin --profile sdk add`（`dsh-base` + `dsh-sdk-app` @ **`0.1.5-rc.2`**，**全程带 `DSH_HOME=$HOME/.dsh`**）
  - ✅ **已达成（DSH-3.0.4 执行 · WB 2026-09-16 上机独立复核）**：deps **恰 5 项** —— `dsh-base` ／ `dsh-sdk-app` ＋ 3 个可选 peer（`dsh-session-persistence` ／ `dsh-session-query` ／ `dsh-http-proxy`），**全 `0.1.5-rc.2`**；`node_modules/@deepseek-ai` **109 包**；CLI 亦 `0.1.5-rc.2` ⇒ **CLI ／ profile ／ 落点树三方同代**（`：65` 前置达成）。⚠️ 扫代际时勿把 `node-addon-system@0.1.2` 误判为残留（**非 `dsh-*` 体系**、与代际无关）
  - ⭐ **DSH-3.0.3 前置（2026-09-15 精确化，来自 DSH-3.0.2 的本机实测污点）**：先 `npm view @deepseek-ai/dsh versions` 确认有 `0.1.5-rc.2`，且 **CLI / hoisted 层与 profile 同代** —— 本机 `~/.dsh` 现为**跨版本混合体**（sdk 侧 105 包 @015 ｜ hoisted 根 214 包 @`0.1.2-rc.1` ｜ CLI 是 npm 全局 `0.1.2-rc.1` 经 Junction 进来）⇒ **三条 loader entry 装载失败 + `exit 1`**（`session-persistence-jsonl` / `session-query-sqlite` / `web-fetch-http`）。**015 上没有这个修**（上游 `0.1.6-alpha.1` 新增 `boot/app-boot/src/profile-resolution/` 正面修，PR `fix/profile-module-resolution`）⇒ **DSH-3.0.3 若按 015 原样重跑会重演**。规避：CLI 与 profile 同代装 015，**或**换干净 `DSH_HOME` 全量装 015。**⭐ 2026-09-16 实测：本条预言命中** —— Trae 按 015 原样重跑（CLI 仍 012）⇒ 三条 entry 重演、runtime 启动即崩。⚠️ 两条规避路当时**未同步进 DSH-3.0.3 派发稿**（派发稿只写「装前核代际、装后回核」，未写「不同代走哪条路」）⇒ 执行人只能现场推导（他独立推出了等价的 P2/P3）。**派发稿完整性教训：规格里的「前置不通过 ⇒ 走哪条路」必须一起承接。**
  - **这就是完整 composition**：本机 `.dsh-home/profiles/sdk` 的 deps 恰为这两项，`storage` / `session` 类包随传递装齐（`dsh-session-persistence-jsonl` / `dsh-session-query-sqlite` / `dsh-storage-json`）⇒ **无需**手工补 `storage-sqlite`
    - ⚠️ **2026-09-16 存疑（CVM 实测反例）**：`~/larry-dsh-home/profiles/sdk` 的 deps 是**四项** —— 上述两项 ＋ **`dsh-storage-sqlite`** ＋ **`@larryagent/plugin-storage-probe`(link)** ⇒「两项 = 完整」**未经 CVM 验证**，待核（可能与 `session-query-sqlite` entry 的装载相关）
      - ✅ **已核（2026-09-16 DSH-3.0.4 任务 2 / 3）：原判「两项 = 完整」实测不成立** —— 缺 **3 个「可选 peer」**（`dsh-session-persistence` / `dsh-session-query` / `dsh-http-proxy`）。它们在锁文件里是 `peerDependenciesMeta.optional: true`，而 profile 配 `autoInstallPeers: false` ⇒ pnpm 把 32 条列进 `transitivePeerDependencies` **并不安装** ⇒ 运行时回落 fallback 层（**这正是 DSH-3.0.3 崩的机制**）。⇒ **015 的完整 composition ＝ base ＋ sdk-app ＋ 这 3 个 peer**（⚠️ 若 fallback 层与 profile **同代**则可省）。旁证：dsh 对 `web-fetch-http` 那类另给 warning —— *"declares no dsh.bundle — installed as a plain dependency, not a profile layer"*
  - ⛔ **2026-09-16 实测（DSH-3.0.3 回报 + WB 复核）**：**装了但不足以 boot** —— deps 已非空（106 包），但 **`dsh-session-persistence` / `dsh-session-query` / `dsh-http-proxy` 三个可选 peer 未装**（profile 配 `autoInstallPeers: false`）⇒ Node 解析回落 hoisted 根（012）⇒ 导出名不符 / 包缺失 ⇒ `plugin tree failed to load`、`exit 1`。**根因 ＝ 跨代，不是漏装**（反证：`~/larry-dsh-home` 同样缺这 5 包、但**同代** ⇒ 不崩）。另缺 `dsh-app-boot` / `dsh-scope`，**未致败**（**缺 ≠ 致败**）
    - ⭐ **WB 补充：跨代是「三方」，CLI 侧也在关键路径上** —— D 组崩栈首行 = `harness/…/dsh-sdk-protocol@0.1.2-rc.1`、rt-real boot 栈首行 = `harness/…/dsh-app-boot@0.1.2-rc.1` ⇒ **boot 器与装置侧协议库都是 012** ⇒ 评估修复路时须把 CLI 层纳入（P1 / P2 只动 profile 侧）
  - ⛔ **`larry` 本次不动**：CVM `~/.dsh/profiles/larry` 现 composition（api-gateway + host-webserver）与本地（base + headless）**不同**，属 3.5/3.7 派发时单独定的事
  - ⛔ **软链方案不采纳**（两个 home 缠在一起 = 正是要消灭的重叠环境）
  - ⭐ **`~/larry-dsh-home` 降级为「负向对照器材」**：有完整 profile、**无凭据** ⇒ D 组"无 key 态"的理想对照（只变凭据一个变量）。**它不是运行 home**，拿它跑出"绿"即无 key 假绿（D2 已实证）
- [x] ✅ **凭据层验真（2026-09-14 查实后新增，本步最重要）** —— 证明 `~/.dsh/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY` **确实被读取且真用于调用**：用 `harness/scripts/dsh-prompt.mjs` **裸跑**（它**不覆盖 `DSH_HOME`** ⇒ 落 `~/.dsh`），三态 = 真 key（**不注入** env）/ 无 key（`DSH_HOME=~/larry-dsh-home`：有 profile、无凭据）/ 错 key（隔离 home + 伪造值 + 600）；判据 = **三态互不相同** + 每态记 `(DSH_HOME, profile, 凭据来源层)` 三元组
  - ⚠️ **为什么必须新开这条路径**：`run-real-api.mjs` → vitest → `vitest.config.ts` 的 `setupFiles: ['tests/isolated-setup.ts']` **强制把 `DSH_HOME` 覆盖为临时目录**（该文件 `:31-33`）⇒ **real-api 读不到凭据文件**，其 key 只能来自 env（`tests/real-api.ts:28`）。⇒ `production-env.md` §12.5 原写"真生效待 3.0 real-api 复跑"**是错的，已订正**（该文档 §12.5 第三条订正）
  - ⚠️ **不得改动** `~/.dsh/.credentials.yaml`（负向两态一律用隔离 home 造）；回报只写键名 / 是否存在 / 长度
  - 🔴 **DSH-3.0.1 首次尝试 ⛔ 未闭合**（2026-09-14）：D1 ≡ D3（同为 `-32603 cannot create effect on inactive context`，**崩在启动期、不是鉴权**）、D2 exit 0 + stdout 全空（**无 key 假绿**）⇒ **三态不互异，判据不成立**。根因 = `~/.dsh/profiles/sdk` **空壳**（**与凭据无关**）⇒ **装齐后重跑，归 DSH-3.0.3**（DSH-3.0.1 的 J1 钉版授权已作废；规格与判据照用，只换版本）
  - ✅ **已达成（DSH-3.0.4 阶段 Ⅱ · 3.0.5 独立复现 · WB 复验）**：三态**互不相同** —— **D1** 真 key（`~/.dsh`，凭据文件 223 B / 600，值 35 字符非占位）→ `turn/end.kind=completed` ＋ 回复 12 B；**D2** 无 key（隔离 home）→ `errorCode=MISSING_CREDENTIAL`；**D3** 错 key（伪造 600）→ `errorCode=AUTH` ＋ `status=401`。⇒ **D1 首次证成「凭据文件层真被读取且真用于调用」**（两套装置全程 `delete env.DEEPSEEK_API_KEY` ⇒ 唯一变量 = 凭据文件）。每态三元组 `(DSH_HOME, profile, 凭据来源层)` 已记 —— 原始件 `D:\Code\_trae-cvm-evidence\304\004\d-codes.json` ／ 独立复现 `D:\Code\_claude-cvm-evidence\305\`
  - ⛔ **判据已被证不敏感的一件**（裁定 J2 采纳为口径）：`dsh --profile <p> --help` **不校验 profile 依赖**（三 home 全绿，1 s 内 exit 0）⇒ **不得**用于"profile 可用性"判定（与 `--dump-config` 同类假绿源 —— 后者只组配置树、不激活）
- [x] ✅ **real-api 在 CVM 侧复跑**（**归 DSH-3.0.3 → 续 DSH-3.0.4**：DSH-3.0.1 那轮是按 `0.1.2-rc.1` 跑的，结论**跨版本失效**，只留下"通道 / 环境自证"这一层效力）—— ⭐ **三态对照：无 key / 错 key / 真 key，同一脚本跑**，判据 = **三态表现互不相同**（⚠️ 无 key 态正是已证会假绿的那一态）
  - ✅ **Trae 2026-09-14 跑通三态**（互不相同 ✔）：**E1 不注入** → guard **显式失败**（"开关 `DSH_REAL_API=1` 但环境变量未提供"；有效 Key 用例 **5 ms 即抛 = 未发起调用**）/ **E2 错 key** → 走了 API、**AUTH·401** / **E3 真 key** → **OK**（`verdict=OK … turn/end.kind=completed`；`Tests 14 passed | 1 skipped`）。三态各 ~2 s（网络好，**未触发看门狗、无 124**）
  - ⚠️ **夹具声明**：`real-api.ts` 默认 profile 源是 `<repo>/.dsh-home/profiles`（**本机约定**），CVM 上不存在 ⇒ Trae 用 `DSH_REAL_API_PROFILE_HOME` 指到**唯一装好的** `~/larry-dsh-home/profiles`。**这是夹具来源、不是 home 决定** ⇒ 装齐后**重跑并把夹具改指 `~/.dsh/profiles`**
  - ✅ **已达成（DSH-3.0.4 阶段 Ⅱ）**：三态 = `e1` 无 key（exit 1，guard 显式失败）／ `e2` 错 key（exit 1，`AUTH·401`）／ `e3` 真 key（**exit 0** ＋ `Tests 14 passed | 1 skipped`）—— **三态互不相同**。**夹具已按 `：81` 改指 `~/.dsh/profiles`**（`e-summary.json` 的 `facts.profileHome` = `/home/ubuntu/.dsh/profiles`；`profileHomeSdkDeps` 5 项全 015）⇒ `：81` 的「装齐后改指」要求同时达成。原始件 `D:\Code\_trae-cvm-evidence\304\003\e-summary.json`。｜ **遗留**（老大 2026-09-16 裁**并入下一单**）：3.0.5 侧「丙样本干净重测」「E 组未走 vitest 夹具」（见 `：263`）
  - ⚠️ **本组只代表「环境变量层」**，**不得**用于宣称"CVM 凭据文件生效"
- [x] ✅ **顺手采数**（白捡的规格账；**老大 2026-09-14 拍：纳入 3.0 验收**，口径见 `docs/dsh/dsh-migration.md` §3.6〈采数口径〉）：cgroup v2 为主口径 + 免轮询三件（`memory.peak` / `memory.events` / `memory.pressure`）+ 带宽（记工具/目标/时段）
  - ✅ **已闭合（Trae 2026-09-15）**：`mem-sample-full.csv` = **240 点齐**，`2026-09-14T17:06:18 → 19:05:50+08:00`（30 s × 240 ≈ 2 h），**`oom_kill` 全程 0**；已回传本机 `D:\Code\_trae-cvm-evidence\`（仓库外）。采样器 = CVM `/home/ubuntu/trae-evidence/sampler.sh`
  - ⭐ **口径发现：`memory.peak` 是 cgroup 生命周期峰值、不是窗口峰值** —— WB 复核 CSV：峰值在 **17:07:18 由 30.8 MB 跳到 255.5 MB**（= E 组测试运行窗），此后**每行都停在 255.5 MB 再不回落**。⇒ ① 255 MB **有出处**（E 组 vitest/node），**非"原因未知"**；② **引用 `peak` 必须同时给 cgroup 起点 / boot 时间**，否则"这轮没吃紧"是假结论
  - ⚠️ **与 Claude 昨日读数（`peak≈1234 MB`）对不上**（本机 uptime 4d20h、`peak` 单调不减 ⇒ 今日 17:06 的 30.8 MB 不可能小于昨日值）⇒ 两种解释：① 两次读的**不是同一个 cgroup**；② user slice 在两次读之间被重建过（全登出即销毁）⇒ **并列留痕不合并**，待 Trae 写明取值路径
  - ⚠️ **采数窗口内冻结 CVM 其他活动**（2G 机器；OOM 会把曲线**断掉**、事后被误读成"内存稳定"）
  - ⚠️ 采样窗**受第三方会话干扰**（Trae 记 `pts/0` 14:01 起；**WB 17:26 实测该会话已不在**、机器空载 load 0.00）⇒ 曲线须标"受干扰"
  - 📊 带宽实测（17:06）：`registry.npmmirror.com` **784 KB/s**（2.27 MB / 2.90 s）/ `github.com` **121 KB/s**；工具 = 远端 curl 经 ssh
- [x] ✅ **执行说明就位**（Trae 2026-09-14 出）：`node` / `dsh` **都不在 PATH**（`export PATH=$HOME/node/bin:$PATH`）+ **四条范式实测通过**（PATH 前置 / 后台长任务 `setsid nohup` + 完成标记 + `rc` / 前台长任务 / 非阻塞轮询 30 s 精确）
  - ⚠️ **Trae 通道独有坑（他自记）**：内联引号 / `$VAR` / 反引号会被本地吃掉（本轮又踩 6 次）⇒ **命令一律走 base64 载体；本地文件操作用字面路径、不用变量**

#### DSH-3.1 · S0 基础链路

- [x] ⭐ **`harness/packages/plugin-tool-readfile/`**（**首个"产品"插件**，此前 5 个 `packages/*` 全是探针）+ 可复跑 e2e 脚本 —— ✅ **已交付**（Trae 2026-09-17，提交 `713c103`）：插件本体（零外部 import ／ 注册走 `ctx.inject` 回调 ／ 标准 JSON Schema）＋ `tests/s0-e2e.test.ts`（四项判据 ＋ 四条负向对照，`S0_VARIANT` 开关）＋ `tests/s0-session-log.ts`（多帧 zstd 回读）＋ `scripts/run-s0-e2e.mjs` 一键复跑
- [x] 四项硬判据**同时**成立：① 消息往返 + **nonce 内容断言** ② plugin **确实被激活**（⭐ 以 boot 时 `activate` 打点为准；⚠️ **`--dump-config` 是假绿源**——只组配置树、不激活） ③ 真实回包非空 + `turn/end.reason.kind === 'completed'` ④ session 落盘 + **回读可查到同一 nonce** —— ✅ **WB 独立复跑（2026-09-17，CVM，非采信其日志）**：`base` 全绿（新 home `/tmp/larry-s0-olL5t5`、`1 passed`、exit 0；`①_toolNameInLog=["read_file"]`｜`② activate·inject-fired·tool-registered` 齐｜`turn/end.reason.kind=completed`｜`④_sessionContainsNonce=true`）；**四条负向对照**核其回传证据自洽（负向 1 里模型改用官方 `read` 仍读到 nonce ⇒ 反证环境存活）
- [x] ✅ **S0 通道已定（老大 2026-09-14）：走 `sdk`** —— 它走的就是 **B 段**（09-09 已定型 SDK/stdio），**非新开面**；前置件 1（`harness/tests/real-api.ts`）已用 `dsh-sdk-client` + `profile: 'sdk'` 且绿/红两侧经 WB 独立复验 ⇒ **零新增器材**；S0 四项判据在〈sdk 面实测能力边界〉逐条覆盖。理由与 ACP 用途的定位见 `docs/dsh/dsh-migration.md` §3.6〈通信面选型分析〉落定块
- [x] 📚 **参考件**（登记表 3.1 行）：`ref/community/kun2-5code__dsh-plugin-template` —— 插件脚手架（`dsh.bundle.patch` + `dsh.client` 清单形状、`service` / `hook` / `commands` 三个半边、**假 ctx 单测范式** `test/smoke.mjs`）；e2e 台可参照 ✅ 借鉴点已回填（事实表 5 / 8 / **9 / 10**，2026-09-17）｜ `iiwish/dsh-testkit`（Docker 隔离真宿主生命周期测试）/ `PerryLink/dsh-test-drive`（一次性 profile 冒烟）
- [x] 🧹 **清退代码内的 log 指针**（**3.1 顺带项**，WB 2026-09-17 发现；原则见 `exchange/README.md` 协作规则末条）：三处**均已失活**（`log-claude.md` 内容此后整体轮换）——① `harness/tests/global-setup.ts:75-77` 引「防挂死安全网」节 ⇒ **就地自足化**（把「方案 A：真实退出码 ＋ 诊断，不因残留判红——假红比没护栏更糟」的语义 ＋ 裁决日期写进注释本体；内容源 = `TODO:40`，原出处已消失）；② `harness/tests/global-setup.ts:127` 运行期输出串内嵌「见 exchange/log-claude.md 裁决记录」⇒ **删该括注**，其余不动；③ `backend/tests/test_integration_llm.py:48`「排查记录见 exchange/log-claude.md」⇒ **改指** `archive/report-2026-08-30.md`（该事故复盘的永久落点，内容在）。

- ✅ **3.1 复验发现 3 条 —— 均已处置（WB 2026-09-17，老大授权 WB 直接改）**：
  1. **构建链**（原判"复跑说明缺一步 `pnpm build`" —— **实情更重，已订正**）：`harness/package.json` 的 `build` 此前只 filter `plugin-probe` ⇒ **新插件与 `plugin-sandbox-probe` 都不在构建链内**（不是"说明漏写"，是脚本没跟上）。**已修**：`build` 改为 `pnpm --filter "./packages/*" --if-present run build`（本机实测：选中 7 项目、3 个有 build 的包全 Done、rc=0）；`run-s0-e2e.mjs` 补**构建前置检查** —— 缺被测包 `main` 指向的产物即报错退出 **2**（与"测试失败 1"／"看门狗 124"区分）。⚠️ 刻意**只检查、不自动 build**：自动构建会在被测环境造副作用，且与 `package.json` 的 build 入口形成两套逻辑 —— 不是遗漏。
  2. **负向对照 3 / 4 补"破坏动作生效"锚 —— 已补 ＋ CVM 实跑验证**：负向 3 加 `②_activated === true` ＋ `logPresent === false`；负向 4 加 `logPresent === true` ＋ `bytes > 0` ＋ `killedBy !== 'child-exited-first'`（为此把 `killClientRun` 改为返回结构化，另把 `④_killedBy` / `④_bytesAtKill` 落进证据）。**实跑**：两变体均 exit=0（`no-session-dir` 7s、`kill-client` 9s），实证 `killedBy=first-session-log-byte`、`bytesAtKill=636` → 终值 995 B（与 Trae 那次独立跑**同值**，变体行为稳定）。
     - 📌 顺带订正一条**过度声明**：负向 3 的真实破坏面**大于其名** —— 实测下 **③ 也红**（`turnEndKind=error` / `errorCode=UNKNOWN` / `finalResponse` 空）⇒ 只读 sessions 目录令 **session 创建即失败**，模型根本没被调到。已在该变体注释里写明"**别断言 ③ 必须绿**"（那是当下实现的副作用，非判据要求）。
  3. **`smoke.mjs` 用例 ② 写真实 home —— 已修**：改为临时把 `DSH_HOME` 指到临时目录（`finally` 还原），并把"缺省打点跟随 `DSH_HOME`"钉成断言。**本机实测**：`smoke ok`，且真实 `~/.dsh/plugin-tool-readfile.activate.log` 前后**完全未变**（3784 B / mtime 07:55:09）。

#### DSH-3.2 · 首验：跨进程 resume 的 id collision 定性

> ✅ **已收口（Trae 2026-09-17 交付 ／ WB 2026-09-17 复验）**｜场地 = **CVM 单环境**；**Windows 侧的锁子项已拆出** → **3.2.1（未派）**。
> **结论 = 真缺口（不是姿势问题）**：对**框架自产、已真 `completed` 并落盘**的会话，第二个进程复用同 ID **一样被拒**（`JsonRpcResponseError` / `code=-32603` / `session "<id>" already exists`）⇒ 缺口在 **runtime 的 session 物化路径**（`session/prompt` 对"日志已在盘上"的 id 走 **create**，而 jsonl 后端自己注明**该走 open**），**不在 SDK 的 API 面**（两套 SDK 的"指定 id"入口**都在**）。
> ⭐ **产品影响**：**跨进程 resume 在 015 上不可用** ⇒ `2.4.1` / `2.8.2` 的 fork / resume 叙事**必须改口径**（走「同进程内复用」—— 已证可用 —— 或「用 `sessionPersistence.load/inspect` 自建重放」）。
> **交付物** = 可复跑复现脚本（与 3.1 同族：一行复跑 ＋ 明确退出码）＋ 定性结论；退出码沿用 3.1 约定（`0` 通过 ／ `1` 测试失败 ／ `2` 前置缺失 ／ `124` 看门狗超时）。
> **本项要回答的一件事**：「固定 ID 撞车 ⇒ 换个 ID 就好」（**姿势问题**）与「同 ID 复用被系统性拒绝」（**真缺口**）**是两回事，且可能同时存在** —— 定论前不得只报其中一支。

- [x] ✅ **四变体装置已交付并跑通**（WB 复跑：CVM 4/4 exit 0；证据 `D:\Code\_trae-cvm-evidence\s0-resume*`）｜反向组（固定 ID 复现 `id collision`）+ 正向组（新 UUID）+ **关键组**（真实 completed 会话、跨进程复用同 ID）
- [x] ✅ **已答：两套 SDK 的「指定 session id」入口都在、都不叫 resume**（TS `dsh-sdk-client` `lib/types/api.d.ts:55/62/78-83`；Python `api.py:120-131`）⇒ 下述检索式/遍历范围要求已满足（详见 3.2 回报 §2）｜原项：grep SDK client 源码确认**是否存在显式 resume 入口** —— 若不存在，"SDK 不支持 resume"与"固定 ID 会 collision"是**两个独立的 bug**，可能同时存在。⚠️ **在 015 实物上核**（参考件锚在 harness master，签名可能漂）；⚠️ 说"没有"须附**检索式 ＋ 遍历范围**，否则不可验
- [x] ✅ **已照办**（骨架照 `run-s0-e2e.mjs` 抄；临时 home 建法 ＋ `listSessionLogs`/`readSessionLog` 复用）｜原要求：复用 3.1 产出的 nonce 会话，不另造（否则两处会话构造法会漂）—— 落实为：**复用 3.1 的会话构造法**（`harness/tests/s0-e2e.test.ts` ＋ `s0-session-log.ts` 的多帧 zstd 回读 ＋ 临时 home 建法）；⚠️ **不要求**复用 3.1 那次的**会话实体**（其 temp home 已随 3.1 收口清理，实体不在了）
- [x] ✅ **已答：A 锁全程无孤儿 ／ B 锁全程未现**（每轮 `close()` 走到真退出 ⇒ 租约由内核释放）⇒ **②/④ 的红灯与锁无关**｜原要求：判据须先区分"两把锁"（Trae 2026-09-15 提出，原意见稿已清；未裁则按此执行）——本任务靶子是 **015 的 session 写租约**（`session-persistence-jsonl/lease.ts`：POSIX `flock(2)` / Windows named semaphore，**进程死亡即由内核释放**、**故意不做 TTL 抢占**）；而系统里还有**另一把语义相反的锁** —— `$DSH_HOME/profiles/node_modules.lock`（`dsh-atomic-write`，profile 装/修复时持有），**持有者死亡后永不自动回收**（源码原文：*"the contender never removes an existing lock because file age cannot prove that its owner stopped; **orphan recovery is an operator action**"*）
  - ① 报告里凡"锁残留"**必须标是哪一把**（两把表现不同：A 锁 = 任何 dsh 命令启动即失败 `atomic-write: timed out waiting for the writer lock`，默认只等 2 s，**极易误判成"启动慢/网络问题"**；B 锁 = 第二个写者收 `SessionAlreadyOwnedError`）
  - ② 实验**前置须先清 A 锁的孤儿**，否则实验根本没跑起来，会得到"租约没生效"的**假阴性**
  - ③ **Windows 侧 named semaphore 的释放实测** → **已拆出为 3.2.1**（同判据体系、但换场地，故独立编号；**本段不跑**）
  - 📖 机制与实测：`docs/dsh/dsh-migration.md` §3.6（锁争用矩阵）、`docs/local-env.md`（本机锁原文与实测）
- 执行人：**Trae**（他此前判"改 UUID 后成功"，让他自己验自己的判据）
- ✅ 前置：我方 CVM 通道核查（见 3.0）—— **已通**（3.1 起即用）
- ✅ **参考件已落位（2026-09-17，WB 拉取）**：`ref/community/EvilIrving__dsh-repro`（MIT，浅克隆 HEAD `e51736ba`）—— **四要素（① 路径 ② 怎么参考 ③ 参考程度 ④ 不可参考）见 `docs/dsh/dsh-migration.md` §2.2.2 表，派发稿照抄**
- [x] 📚 **官方参考件**（登记表 3.2 行）：`dsh-session-persistence-sqlite` / `-jsonl` / `dsh-session-query-sqlite`（社区件见上条，**已落位**）

- ⚠️ **WB 复验 · 判据缺陷 1（登记待修）**：`s0-resume.test.ts` 的 `resumeTarget.p2LandedOnSameLog` **恒为 `null`｜`false`、永不可能是 `true`**（实现写死 `p2Log === null ? null : false`）⇒ **将来 resume 真修好时该字段会静默给 `null`（假阴性）**。修法 = 补一条 `hasP1 && hasP2` 的日志判定；⚠️ **改判据须实跑**（下次上 CVM 时随 3.2.1 一并验，不在此处改）
- ⚠️ **Trae 报的 4 条未闭合（并入后续，不单开任务）**：① 抛错点二选一（`dsh-session` 的 `prepare` vs `dsh-session-persistence` 的 `SessionAlreadyExistsError`，**文案完全相同**）→ 并入 3.3/3.6 插桩位顺手取；② `-32603` 映射点未定位 → 记入「包归属待核」；③ **012 那版文案（`(id collision)` 尾巴）不可在 015 复核**（SEA 快照）⇒ 结论只按 015 记；④ **Python 侧未真跑**（只做源码侧）⇒ 两通道是否一致未验

#### DSH-3.2.1 · 锁子项：Windows 侧 named semaphore 的内核释放实测（**未派**）

> **为什么单列**：与 3.2 同属"锁"判据体系，但**换场地**（本机 Windows，非 CVM）⇒ 独立编号、独立跑。**等 3.2 的锁归属结论出来再起跑**（若 3.2 实测显示租约机制与其自述不符，本项的问法要跟着改）。

- [ ] **`taskkill /F` 杀进程后，named semaphore 是否真被内核释放** —— 这是"**自述 vs 实测**"的分界点：015 的 `session-persistence-jsonl/lease.ts` 自述"进程死亡即由内核释放、故意不做 TTL 抢占"，Windows 侧走 named semaphore，**该自述在 Windows 上从未被实测**
- [ ] 判据须**双锚**：既验"首写者死后第二个写者能拿到"（= 真释放了），**也**验"首写者活着时第二个写者被拒"（`SessionAlreadyOwnedError`，= 租约**真的在起作用**而非根本没生效）—— 缺后锚则"释放"与"锁压根没生效"不可区分
- ⚠️ 场地：本机 Windows（**WSL 在 DSH-3 期间不参与**，见贯穿规则）；依据 `docs/dsh/dsh-migration.md` §3.6「锁争用矩阵」＋ `docs/local-env.md` 的本机锁原文与实测
- 执行人：**Trae**

#### DSH-3.3 · S1 interaction 审批接入（→ 2.7.1）

- [ ] **scope-filtered answerer 插件**（TS）—— ⭐ **答者来源须做成可替换接口**（本地策略 ↔ 远端真人），否则 3.3-b 要重写
- [ ] 🟢 **路已拍（老大 2026-09-14）：分阶段往 ② 走** —— 拆三段，证据与判据见 `docs/dsh/dsh-migration.md` §3.6〈S1 审批三段收敛路径〉：
  - **3.3-a**（本阶段，可随批次 2 跑）**本地策略答者**（`ctx.approval` waterfall 的最终应答者）—— 验**机制接入**：scope filter / 日志可观测 / fail-closed
    - ⚠️ **诚实边界**：「超时」「渠道断裂」两条是**同进程替身路径**（本地答者即同进程调用，无"渠道"可断）⇒ **3.3-a 单独不得声称"审批语义验成立"**
  - **3.3-b**（本阶段，**不依赖 3.8**）答者改为**真出站往返**：薄客户端（`JsonRpcLineTransport` + `onRequest`）↔ 本地 stub 对端 —— 验 ② 的真风险：跨进程等待 / 超时收尾 / 对端消失 / 取消传播
    - ⚠️ **主要成本**：不能用 `HarnessClient`（其 `start()` 只挂 `onNotification`）+ 其 `exports` 不含 `resolveDshLaunch` ⇒ **起子进程的启动参数要自己构造**
    - ⭐ **产物不是一次性的**：薄客户端 = **3.8 driver 的骨架**
  - **3.3-c = 3.8** 对端换成 driver + 前端 ⇒ 人审批闭环
- [ ] 用例覆盖 5 条：批准 / 拒绝 / **answerer 超时** / **answerer 抛错** / **渠道断裂** —— 后三条均须 fail-closed **且留可观测日志**（⚠️ 静默 fail-closed 会制造假绿：你以为是人点了拒绝，其实是请求从未到达）
  - ⏱️ **超时值须先定死**（否则"超时路径"无法构造）：建议 **30 s**，写入判据；可依实测调整
- [ ] 观测点 = **工具 handler 入口打点**（有行 = 真的执行了），UI 与 DSH 日志只作旁证
- [ ] 📚 **参考件**（登记表 3.3 行）：`ref/community/PerryLink__dsh-reach` —— **deferred answerer**（`approval/request` + `user-questions/request` 两个 waterfall，答案稍后从 IM 回来才兑现）+ `cardTimeoutSec`（超时）+ `bridge.dispose()`（结清待决）+ `inject: []` 降级矩阵；官方机制侧 `dsh-user-approval` / `dsh-permission-presets`

#### DSH-3.4 · S2 compaction 接入（→ 2.9.2）

- [ ] **compaction provider 插件**（`ctx.compaction` 是契约 ⇒ 自做 Provider 即换策略，消费者不动）
- [ ] 构造法：**注入大段填充文本逼出触发**（勿真灌 200+ 轮 —— `contextWindow` 实测 1M，"200+ 轮"这个数字本身待核）
- [ ] 判据：摘要注入 **且** 近文原文保留 + 摘要含可验证 nonce 片段
- [ ] ⚠️ 开跑前先给 **token / 费用上限**，写进判据

#### DSH-3.5 · S3 sandbox 三档接入（→ 2.7.1 Linux 侧）

- [ ] 三档（read-only / workspace-write / danger）各自拒绝与提权流程生效 + **fail-closed 成立**
- [ ] **前置核查：目标机 `bwrap` 是否存在**（DSH Linux 链 = `['bwrap','landlock']` 两个 rung ⇒ probe 仲裁；不存在则永远只走 landlock rung）
- [ ] 加判据：**DSH 的 sandbox ruleset 在 CVM 上建立成功**，并**单独判其失败形态**（fail-open 还是 fail-closed —— 决定生产安全）
- [ ] 器材：`D:\Temp\Sys\claude-wsl-probe\landlock_probe.py`（ABI 自适应 + `--fs-mask` 负向开关 + `VERDICT=` 机读行）
- [ ] ⭐ **执行姿势：先 dry-run 再判定**（2026-09-14 定「WSL 不参与」的**替代手段**，见 DSH-3 段）—— 探针第一次上 CVM 时**先跑一轮不出判定的 dry-run**（只打印 ABI / 路径映射 / 权限探针 / `bwrap` 存在性），确认场地与预期一致后再跑判定轮。⚠️ 这是替代"WSL 预演"的姿势（CVM 10-09 到期、机会一次性），**不是可省的步骤**
- ⚠️ **ABI 边界**：CVM = **4** / WSL = **7** ⇒ **判定只能写在 CVM 上，不得互搬**（实测：ABI 5+ 掩码喂 ABI 4 内核 ⇒ `create_ruleset` 直接 `EINVAL`）

#### DSH-3.6 · S4 记忆最小闭环（→ 2.4.2）

- [ ] **session 事件订阅插件**（TS）+ SQLite / ChromaDB 双写
- [ ] 判据：事件**确实被消费**（不是只注册了监听）+ 数据落在**我们自己的库**（⭐ **带反向哨兵**）+ **新会话能召回**
- [ ] ⚠️ **双写不是事务** ⇒ 须定义**一致性模型**（ChromaDB 不可达 / SQLite 独存时的降级行为与召回路径）
- ⚠️ 写码前必读：`node:sqlite` 在并发 + `busy_timeout=0` 时 **`prepare()` 阶段就抛错**（Python 侧只在 `run()` 阶段失败）⇒ 错误处理须包到 `prepare` 层
- [ ] 📚 **参考件**（登记表 3.6 行）：`ref/community/Asher-2000__dsh-memory-connect` —— SQLite FTS5 + 本地 embedding（`scripts/embed_server.py`）+ `systemPrompt.context` 逐轮召回；⚠️ 其 CHANGELOG 记了两个**静默不生效**根因（Cordis 惰性构造服务 ⇒ 只 `ctx.provide()` 不实例化；召回写进无人读的字段），**与本步判据“事件确实被消费”同源**

#### DSH-3.7 · 生产挂载落盘（Windows 方言修复件）

> **本段分两块（2026-09-17 拆）**：**3.7.1 前置就位与定性**（📮 **已派发 Trae 2026-09-17**）→ **3.7.2 落盘 ＋ 自检 ＋ 真 e2e**（**未派**，等 3.7.1 回报后起跑）。
> **为什么拆**：原规格把"前提已就绪"当前提，而 2026-09-17 WB 实测**三项前提实为缺项**（见 3.7.1）；且 `EPERM` 归因本身**结果开放**（可能反推落盘人结论）⇒ **先定性、再落盘**，避免"落点对了却没生效"。范式 / 自检口径 / 已证未证边界见 `docs/local-env.md` §4.3（**原 DSH-2.5 ③ 收口欠账 1**）。

##### DSH-3.7.1 · 前置就位与定性 ✅ **已回报（Trae 2026-09-17）· WB 复验：① ③ 成立、② 的判据被推翻**

> 本块**不写 patch、不跑 e2e**（那是 3.7.2）；只把前提清干净 ＋ 把 `EPERM` 归因定性。

- [x] ✅ **① 已答：归因不成立**（他自己的通道 ＋ 正对照 `C:\Windows`；4/4 可写、09-14 那条命令两处都不复现；**没有为不存在的现象编主体** —— 正确姿势）｜原项：`EPERM` 归因定性（必须用他自己的通道复跑） —— 判据**要钉主体**：同一条拒绝，出自 **AI 工具沙箱** 还是 **DSH 自身沙箱**，归属与严重性**完全不同**（09-12 已有一次同类"主体错位"）。须给**触发命令原文 ＋ 完整错误对象（`code` / `errno` / 栈帧里的模块路径）**，并**指出抛出者是谁**。
  - ⚠️ **两处各测一次**：`~/.dsh/profiles/…`（09-14 那条记录的现场）与**工程 `.dsh-home/profiles/larry/…`**（**当时的落点**；⚠️ 该面已于 2026-09-17 退役）⇒ 判"哪个能写、不能的那个是谁拦的"
  - ⚠️ 结论**只写在实测过的那条通道上、不得跨通道外推**（WB 通道能写 ≠ Trae 能写，反之亦然）
  - ⚠️ 写探针只允许"**建一个探针文件后立即删除**"；**不得改动现存任何文件**（全局 home 的 profile 勿动）
- [x] ⚠️ **② 实体安装属实、但「判据成立」被 WB 复验推翻**（详见下方 WB 复验）｜原项：方言插件实体安装（工程 home） —— 现状（WB 2026-09-17 实测）：**挂载点不存在** —— `.dsh-home/profiles/node_modules/@larryagent/` **无该目录**（`~/.dsh` 侧那份是**全局 home**、不是本项落点）
  - 目标：`工程 .dsh-home/profiles/node_modules/@larryagent/plugin-sandbox-dialect/`（范式原文 `docs/local-env.md` §4.3「插件怎么进 profile」）
  - **源 = 仓库 `harness/packages/plugin-sandbox-dialect/`**（`index.js` ＋ `package.json`）；⚠️ **必须实体复制、不得 link**（link 下 bare import 从源目录解析 ⇒ **取不到** `@deepseek-ai/dsh-sandbox-local`）
  - ⚠️ **不得从全局 home 那份拷**：`~/.dsh/profiles/node_modules/@larryagent/plugin-sandbox-dialect/` 那份**功能码与源逐行一致、但注释头是旧版**（2962 B vs 源 4087 B）⇒ 以仓库源为准
  - ❌ **判据本身不成立（WB 2026-09-17 复验推翻）**：`import()` **落点那份插件 失败** —— `SyntaxError: The requested module '@deepseek-ai/dsh-llm' does not provide an export named 'assertNever'`，**与 Trae 归给"link 对照"的红灯是同一条**。⇒ **真正分界不是"实体 vs link"，而是"依赖绑到哪一代"**。WB 四组实测：**A 全局 home 落点 = OK ／ B 工程落点（实体）= FAIL ／ C 直接 import `sandbox-local@0.1.5-rc.2` = OK ／ D 直接 import `sandbox-local@0.0.1-rc.1` = FAIL**（A 绿 ⇒ 判据在健康对象上会绿，排除探针自身故障）
  - ⭐ **根因（WB 追溯）**：`harness/packages/plugin-sandbox-dialect/package.json` 的 `peerDependencies: {"@deepseek-ai/dsh-sandbox-local": "*"}` ⇒ pnpm 解析到 npm latest 那支 **`0.0.1-rc.1`**（DSH 0.0.1 时代的包），而同一棵树里 `dsh-llm` 是 **`0.1.5-rc.2`** ⇒ **跨代混装 ⇒ 加载即崩**。**引入点 = `a974258`（本机升 015 时 lockfile 重算），非本轮任何改动**
  - ⛔ **这是 3.7.2 的硬前置**：修法 = 把该 peer 从 `*` 改为显式 `0.1.5-rc.2`（或 `^0.1.5-rc.2`）＋ 重算 lock ／ 重装落点 ＋ **实跑验证**（改依赖树必须实跑，不得只凭推理）。⚠️ lockfile 属**双面同步范围**（本机 ↔ CVM）⇒ 改动须同步
  - ✅ **junction 归属订正（WB 实测）**：工程 `.dsh-home/profiles/node_modules/@deepseek-ai/` 的 **241 条 junction 全部指向 `harness/node_modules/.pnpm/…`（本工程）**，**无一条指向全局 npm** ⇒ Trae §3.1① 的「依赖实际解析到全局 npm 的 dsh 自带依赖」是**取错了观测对象**（那是**全局 home** 的机制 —— 全局 home 的 junction 才指 `%APPDATA%\npm\…`）。⚠️ 但他**另一条是对的**：他所读那份包与工程指向那份**同版本同字节**（`dsh-session` / `-persistence` / `-jsonl` / `dsh-llm` 四处 sha256 全同）⇒ **他的 §6 源码行号结论不受影响**
- [x] ✅ **③ 已答：实际凭据层 = 启动环境变量**（两态互异：无 key ⇒ `MISSING_CREDENTIAL`；env 注入 ⇒ `completed`）；**该层就是 client 会走的那层**（`main.rs:274-291` 只设 `DSH_HOME`、不设 key ⇒ 由 Tauri 启动环境带入）。⚠️ **遗留**：B 态 key 取自 `backend/config.yaml`、**不是 client 的真实取值路径**（"谁往 Tauri 启动环境放 key"未找到代码路径）⇒ Trae 已如实标为待核｜原项：凭据路径打通（在工程 `.dsh-home` 上跑通一次真 prompt） —— 现状：`.dsh-home` **无 `.credentials.yaml`**；而 `client/src-tauri/src/main.rs:275-276` 注释写"凭据**继承本进程 env**（由启动环境注入）"、`docs/production-env.md` §12.5 表把该文件标"**可选**"、本段的「配套三件①」却写"**须建**" ⇒ ⚠️ **三处口径不一致，以实测为准**（这不是笔误，是三种说法并存，须落下一条实测结论）
  - **交付** = 在工程 `.dsh-home` 上跑通一次真 prompt，并**写明实际走的是哪一层**（启动环境 ／ 存储文件 ／ 项目 `.env` ／ 主目录 `.env`）＋ **该层是否就是 client 路径会走的那层**
    - ⚠️ **落点 profile = `larry`，但 `harness/scripts/dsh-prompt.mjs:25` 硬钉 `profile: 'sdk'`** ⇒ **别把「`sdk` 通了」当成「`larry` 通了」**；本块只要求验掉"凭据层通不通"，**但回报须写明跑的是哪个 profile**（3.7.2 需要能指 `larry` 的入口）。⚠️ **2026-09-17 修订**：`larry` 面**已退役** ⇒ 落点改 `sdk`（见 3.7.2 硬前置 2）
  - 🔴 key 值**不得**落任何受版本控制的文件 / 日志 / 工具输出；手工复验命令模板与 `pwd -W` 那个坑见本节「落点已定」条
- [x] ⭐ **④ 附带硬发现（WB 复核属实）：落点 `larry` 根本不是 SDK 面** —— `larry` = `dsh-base` ＋ `dsh-headless`（CLI 面，要位置参数当 task）；`sdk` = `dsh-base` ＋ `dsh-sdk-app`（stdio JSON-RPC）⇒ **"落盘在 larry"与"client 实际跑的 sdk"不是同一条通道**，⇒ **3.7.2 起跑前须在三条里选一条**：① 给 `larry` 加 `dsh-sdk-app`（改该 profile 依赖）② 把落点改到 `sdk` ③ e2e 改用 CLI 直跑 `dsh --profile larry "…"`（**非 SDK 通道，须单独声明**）
  - ⛔ **已裁（老大 2026-09-17）＝ ②**：落点改 `sdk`，且**把 `larry` 面一并退役**（工程 `.dsh-home/profiles/larry` ＋ 全局空壳 `~/.dsh/profiles/larry` 均已重命名备份；⚠️ **CVM 那份上轮判「不动」，2026-09-17 复核后改为一并退役** —— 原判「有主」系抄旧登记未核实，实测 = 012 代跨代残留 ＋ 零引用 ＋ 停 11 天，详见 `docs/production-env.md` §12 附一之补）。**理由**：该面不接生产通道（`dsh-prompt.mjs:25` 硬钉 `sdk`）；且其"零成本冒烟"价值**不是独有** —— 实测 `dsh --profile sdk --dump-config` 同样 `rc=0` / 不需 key / 0.5s。⚠️ **另订正一条**：`larry` 面里挂的是 **`plugin-probe`，不是方言件** ⇒ 它**当不了方言件的正对照**（方言件单独落在已被证坏的共享层，四组对照见 ②）
- [x] ✅ **该冲突已随 `larry` 面退役一并消失（2026-09-17）**；`@larryagent/plugin-probe` **包本身保留**（`harness/packages/plugin-probe/`，仍是最小自研 bundle 样板，除 `harness/package.json` 的 `build:probe` 脚本外无引用）｜原记：`larry` 里**已有一个 `link:` 挂载的 `@larryagent/plugin-probe`**（boot 打 `[B1-PROBE] external bundle loaded by cordis`）⇒ 落点 profile **已有"link 挂载"先例**，与 ② 要求的"必须实体复制"并存
- ⛔ **本块禁区**：不写 `cordis.patch.yml`；不碰 `.dsh-home/profiles/{larry,sdk}/package.json` 与 lockfile（刚由 Qoder 升 015）；**不把插件装进全局 `~/.dsh`**（那份已存在、勿动）
- 执行人：**Trae**

##### DSH-3.7.2 · 落盘 ＋ 自检 ＋ 真 e2e（**未派**）

- [ ] ⛔ **硬前置 1（WB 2026-09-17 复验新增）：先钉方言件的依赖代际** —— 现 `peerDependencies: "*"` 解析到 `dsh-sandbox-local@0.0.1-rc.1` ⇒ **落点那份插件当前 `import` 即崩**（已实测，见 3.7.1 ②）。**修好前挂 patch 必崩，不得跳过**
- [x] ✅ **硬前置 2（已裁：老大 2026-09-17 ＝ ②）**：落点 = **`sdk` 面**（headless 的 `larry` 面已退役，见 3.7.1 ④）⇒ e2e 走 **client 同源通道**；`harness/tests/s0-e2e.test.ts` / `s0-resume.test.ts` 骨架本就钉 `profile: 'sdk'`，**可直接沿用**，不必另造装置
- [ ] ⛔ **硬前置 3（WB 2026-09-17 新增）：落点必须落"该 profile 自身那层"** —— 即 `sdk/node_modules/@larryagent/plugin-sandbox-dialect/`，**不可**落 `profiles/node_modules/…`（后者实测把 `dsh-sandbox-local` 解析到旧代 `0.0.1-rc.1` ⇒ 插件 `import` 即崩）。3.7.1 落在那层的产物**已退役**（重命名备份在 `profiles/node_modules/@larryagent/*.RETIRED-20260917-*`）
  - ⭐ **跨机双向验过（2026-09-17 CVM 实测）**：该现象**非本机独有** —— CVM 共享层 `profiles/node_modules` 同样含 `dsh-sandbox-local@0.0.1-rc.1`（**09-16 装 `sdk` 时由 pnpm 生成**，排除"本机人为复刻"这一解释），且从 `sdk/` 起点解析得 `0.1.5-rc.2` ✓ ⇒ 旧代来自**依赖解析本身**（peer `*` → npm latest）。本条落点判断**正反两面均有实测**：反例＝落共享层取旧代、正例＝落 `sdk` 自身层取 015
- [ ] 把 `harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` 的两段写进**工程** `.dsh-home/profiles/sdk/cordis.patch.yml`（**追加，不是覆盖**；该文件现为模板空态 `[]` ⇒ **须把 `[]` 删掉换成条目**，见「已定前提」末条）
- [ ] **一次真 end-to-end**：模型触发被拒命令 → 看到 `[sandbox: file access denied]` —— 这是 `docs/local-env.md` §4.3 标注的**唯一未证项**
- [ ] **生效自检**：`dsh --profile sdk --dump-config`（须**显式设 `DSH_HOME=工程 .dsh-home`**）⇒ 官方 sandbox 行**保留 ＋ `disabled: true`**、末尾多出 `sandbox-dialect` 行。⚠️ **别拿"行消失"当判据**（会误判成未生效）
- [ ] **负向对照**（贯穿规则）：破坏它、看它变红 —— 候选：不落 patch ／ 插件改用 link 装 ／ 摘掉方言三项之一 ⇒ 断言"拒命令**未被识别为沙箱拒绝**"。⚠️ **负向变体须双锚**（同时断言"其余仍活"），否则"环境没起来"与"破坏生效"不可区分
- [ ] ⚠️ **不得沿用 012 结论**：`docs/local-env.md` §4.3.1 只证了"方言表未变"，`confine()` 的**运行时行为**在 015 上仍属未验
- 执行人：**Trae**

##### DSH-3.7 · 已定前提（两块共有，勿重复推导）

- [x] ✅ **首项判定已完成（WB 2026-09-16，本机上机）⇒ 结论 = ③「未修」**：015 **未自修** Windows 沙箱方言缺口 ⇒ **修复件不退役、且无需改码**；**须重跑全链路复验，不得沿用 012 结论**
  - **判据（读 015 `DENIAL_SIGNATURES` 是否已含 `operation not permitted`）**：015 的 `windows-acl` 方言仍是 `['access is denied','access to the path','permission denied']` —— **不含** `operation not permitted`、**也不含** zh-CN 两条
  - ⭐ **读法陷阱（判归属才能定）**：`operation not permitted` 在 015 包里**确实出现 1 处**，但它属 **`seatbelt`（macOS）名下** —— 不判归属就会得出"已修"的反向结论
  - **证据链六条**：① `dsh-sandbox-local/lib/index.js` 012→015 **全量 diff 仅 1 行**（包重命名 `node-addon-landlock-run` → `node-addon-system/landlock-run`），其余 538 行**逐字节一致**（含 `DENIAL_SIGNATURES` / `Config` 三字段 / `STATIC_ENFORCEMENT` / `PLATFORM_CHAINS` / 默认导出）⇒ **015 所谓"动过该包"只是包重命名，与方言无关**；② runner 端 `dsh-sandbox-windows-acl` 的 012/015 **代码文件 sha256 全部相同**（仅 README 文案重写 ＋ 版本号变）⇒ 上游**也未从"改输出文本"侧修**；③ 全树扫 **12105 个 js/ts**：`DENIAL_SIGNATURES` **唯一一处**、zh-CN 文本 **0 命中** ⇒ **无其他扩展点**；④ **三独立安装点 sha 一致**（本机 `~/.dsh/profiles/sdk` ＋ CVM 两处）= `100c7d169f44da32` ⇒ **非被改副本**；⑤ 修复件依赖的接口**全部仍成立**（`super.confine()` 可调、`ConfinedArgv.denialSignatures` 字段名未变、`STATIC_ENFORCEMENT['windows-acl']='partial'` gate 仍成立、默认导出仍是 provider 类）；⑥ `PLATFORM_CHAINS.win32=['windows-acl']` 单候选不变
  - ⚠️ ~~**附带的真矛盾（待老大定，不在本项范围）**~~ ✅ **该矛盾已解除（2026-09-17）**：原记"**3.7 的落点 home = 工程 `.dsh-home`，实测整体仍是 `0.1.2-rc.1`**"（`larry` / `sdk` 各 94/99 包 = 012；回退层 213/223 = 012；建于 09-09~09-10）⇒ 当时 3.7 的 end-to-end 宿主（client ＋ 工程 home）跑在 012 上。**工程 `.dsh-home/profiles/{larry,sdk}` 已由 Qoder 升 015**（与修前基线 diff 各仅 2 行版本号、composition 未动、两个 lockfile 的 `0.1.2-rc.1` 均 0 次；详见 `docs/local-env.md` §4.3.1 末段）⇒ **宿主与判定基准（主 `~/.dsh/profiles/sdk`，015）已同代**。⚠️ 但「**修复件仍不退役**」的结论**不变**（015 未自修）
  - 📚 详见 `docs/local-env.md` §4.3「015 复核（2026-09-16）」
- [x] ✅ **落盘人已定（老大 2026-09-14）**：先由 **Trae 复跑一次**把 `EPERM` 归因定性清楚，**他通道实测可写则由他落盘**（分配明细见「待派发」段）
- [x] ✅ **落点已定（老大 2026-09-14）**：写**工程 `.dsh-home/profiles/larry/cordis.patch.yml`**（追加）；**不落 `~/.dsh/`**；**`web` profile 不补建**
  - ⛔ **⚠️ 本条已被 2026-09-17 修订**：profile 由 `larry` **改 `sdk`**（同工程 home、同样"追加不是覆盖"）。原判据（真实宿主 = client 启动的 DSH ＋ client 显式指工程 home）**不变且仍有效** —— 变的只是"client 实际用哪个 profile"这一具体值
  - 判据：3.7 的 end-to-end **真实宿主是 client 启动的 DSH**，而 client **显式指工程 home**（`main.rs:291`）⇒ 落全局只能验"手工跑生效"，属**替身路径**；且"手工跑回落全局／client 读工程"正是 09-14 刚定要消灭的重叠环境
  - ⭐ **配套三件（缺一即"落点对了却没生效"）**：① `.dsh-home/.credentials.yaml` **须建**并填 `larry-dev`（`refs.DEEPSEEK_API_KEY`）—— ⚠️ **此处"须建"与另外两处口径冲突**（`client/src-tauri/src/main.rs:275-276` 称凭据**继承本进程 env**；`docs/production-env.md` §12.5 表标"**可选**"）⇒ **改判为待实测项 → 见 3.7.1 ③**（若 client 路径确走 env 注入，则"不带该文件也无 key"不成立）；② 手工复验**须显式注入 `DSH_HOME`**（模板见下）；③ 凡启动 DSH 处**一律显式注入、不靠默认回退**
  - 🔧 **手工复验命令模板**：`cd /d/Code/LarryAgent && DSH_HOME="$(pwd -W)/.dsh-home" node harness/scripts/dsh-prompt.mjs "…"`
    - ⚠️ **`pwd -W` 不是可选的**：Git Bash 的 **env 值不做路径转换**（转换只发生在 argv）⇒ `/d/Code/…` 原样给 Windows node，被 resolve 成 **`D:\d\Code\…`**（当前盘根多一层 `d\`）⇒ DSH **自己新建一个空 home** ⇒ **无 key 假绿、判据全绿**（**与 `cvm-probes` 钉错 home 同形态**）。三写法实测对照 → `docs/production-env.md` §12.7 附二
    - ⛔ **跑 harness 测试时禁止注入真实 home**：`tests/isolated-setup.ts` 强制覆盖为临时目录 + 正向白名单守卫；注入真实路径会触发 `sentinel-failfast` 判 FAIL
  - 🔍 **落盘人待定的实况（2026-09-14 WB 实测）**：Trae 报其通道写 `~/.dsh/profiles/*/cordis*.yml` 被拒 `EPERM` —— ⚠️ **该归因待复核**（09-12 曾出现同类"主体错位"：把 **DSH 自身沙箱**的 EPERM 记成 AI 工具沙箱）；**WB 通道实测可写**（`~/.dsh/profiles/sdk/` 试写成功）。⚠️ **三通道结论不可互推**，Trae 那条须他自己复跑定性
  - ⚠️ 落盘**是追加不是覆盖**：~~`.dsh-home/profiles/larry/cordis.patch.yml` 现有 477 B，**已含一条 `- id: hmr / disabled: false`**~~ ⇒ **2026-09-17 修订**：该面已退役，**落点文件换成 `sdk/cordis.patch.yml`（现为模板空态 `[]`，无 hmr 条目）** ⇒ **"追加"的要害改为"先删 `[]` 再写条目"**
    - ⭐ **追加的正确写法 = 把模板里的 `[]` 那行删掉、换成条目**；**不能**在 `[]` 之后再续 `- id: …`（🟢 2026-09-14 用真实解析器实测：`~/.dsh/profiles/node_modules/js-yaml@4.3.2` 下前者报 `end of the stream or a document separator is expected (2:1)`、后者 OK）。模板文件内容 = 4 行注释 + `[]`（217 B）；工程 `larry` 那份的 hmr 条目就是**已删 `[]`** 的实样
  - 📚 **参考件**：模板的 `dev/cordis.yml` 记了一条开发回路坑 —— **overlay 只加载 host 半边**，`dsh.client` 包级声明发现不了（要测 client 半边必须把包装进 profile）；另：`patch` 是**行级覆盖**非深合并（与本项“追加不是覆盖”互证）；病毒式参照 `WSL & Windows Interop` 整类（37 件，登记表 3.7 行）

#### DSH-3.8 · A 段自定协议设计（通信面定型派生）

- [ ] 设计稿 → `docs/`：**流式转发 / 会话管理 / 鉴权 / 多端同步 / 重连补帧全自实现**（官方 Gateway 白送的恰是这部分）。**DSH-2 段「新增派生工作项」的同名条目已并此，勿双处维护**
- 执行人（老大 2026-09-14 定）：**WB 出设计稿、Trae 承接实现**
- [ ] ⭐ **审批请求双向中继**（老大 2026-09-14 定「分阶段往 ②」，终点落在本段）：A 段协议须含 **server→client 请求**的承载。传输能力已由 `JsonRpcLineTransport`（protocol 包公开导出）提供 ⇒ 本段要做的是**协议定义 + 对端接线**，不是造传输
- ⭐ **可复用产物**：3.3-b 的薄客户端 = 本段 driver 的骨架（勿另起一套）
- [ ] 📚 **参考件**（登记表 3.8 行）：官方 `dsh-api-remotes`（原话“任何不依赖 React 的 `ctx.remote` 约定均可复用其 **Client face**”）+ `dsh-client-connection`（gateway 挂 `/api`；browser 半 = fetch/SSE）；社区同题 `litestartup-com/dsh-api-gateway`（REST + SSE + API-key 鉴权）/ `Jiachi5533/dsh-remote-gateway`
- ⚠️ **它不再阻塞 3.3-a / 3.3-b**（2026-09-14 修正）：依赖只剩 **3.3-c** 这一段（见 3.3 三段拆分）

#### DSH-3.9 · 阶段收口

- [ ] ⭐ **CVM 产出回传核对表**：逐项列（会话库 / SQLite+ChromaDB / 日志与曲线 / dump-config 快照 / 复现脚本），标"已回传本机 / 无需回传"并附 sha256 —— **含 `~/larry-data/larry.db`（36 KB，该机独有的证据原件）**；CVM **10-09 到期**，这是唯一能系统性堵住"唯一副本"的时点
- [ ] **【退出信号 · 主观】老大本人对 DSH 调试体验的可接受度确认**（S0 跑通后）：alpha 框架 + Cordis 插件总线内部状态不透明 + 跨进程 source map，出 bug 时定位难度阶梯式跳升 —— 不可量化但真实的 go/no-go 信号（文档 §3.7）
- [ ] 退出条件勾对（核心链路达 **P4 等价**）+ 上游漂移复核 + 阶段归档

#### DSH-3 · 贯穿规则（写码 / 验收前必读）

- [ ] **负向对照矩阵**：每条 S 切片挑 1 条判据做"**破坏它、看它变红**"的对照 —— 不做则"真的通了"与"判据没生效"**不可区分**
  - `bundle` 注释掉 → 3.1 ②｜换错 Key → 3.1 ③ 与 3.0 红灯组｜摘/只读 session 落盘目录 → 3.1 ④｜answerer 抛错或超时 → 3.3 拒绝路径（须 fail-closed）｜SQLite 路径指回 DSH 默认后端 → 3.6 哨兵｜kill SDK 客户端 → 3.1 ④ 完整性｜停 ChromaDB → 3.6 双写降级
- [ ] **每个验收脚本头部加一行「姿势自证」**：本脚本模拟的是哪条真实链路（哪个执行器 / 哪层前导 / 哪个 home+profile）—— DSH-2.5 ③ 教训：**判据姿势不对会同时造出假绿与假红**
- [ ] ⭐ **环境口径统一（老大 2026-09-14 指令）：同一环境内只用一个 DSH home，不再制造重叠环境**
  - **CVM**：以裸跑默认 **`~/.dsh`** 为准（凭据已在此）⇒ **`~/larry-dsh-home` 不再作运行 home**（**降级为「负向对照器材」**，见 3.0 `:73`；⚠️ 拿它跑出"绿" = **无 key 假绿**）。`harness/scripts/cvm-probes/*.sh` 的钉死写法**已改，`b4b61ed` ✅** —— 5 处硬钉改为 `${DSH_HOME:-$HOME/.dsh}`、`cvm-step0.sh` 默认值改 `default`（不设 `DSH_HOME`），需隔离时由调用方显式传（裁定 J5：**保留** `:-` 写法，不用字面 `unset`）
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
        - 📋 **5 条未闭合逐条结账（WB 2026-09-16，随 3.0 收口）**：① **② 层未做** → **已裁 · 不做**（不根治上游，理由见上）；② **「CLI symlink 仍指 012 store」** → **已销**（3.0.5 实测 heal 已重链）；③ **「`exit 0` 不可单独当判据」** → **已成口径**（`:260` 假绿源，已写进判据注解）；④ **「本机 `~/.dsh` 未修」** → **移出 3.0**（DSH-3 判定链只在 CVM 跑；本机 PC client 走显式 `.dsh-home`，本机 `~/.dsh` 仅服务「手工跑 dsh」这一开发场景 ⇒ **不阻塞本段任何判据**；⚠️ 新落点待老大定）；⑤ **「`Packages: -60` 未查明」** → **不做追溯**（pnpm 装包计数变化，属拆改副产品、不进任何判据；再遇以当时现场为准）
    - **DSH-3.0.5 · 独立验收（D / E 三态复现）＋ 判据盲区（空壳 home）**（**Claude**，2026-09-16）→ ✅ **已回报 · WB 复验通过**（2026-09-16；原始件已回传 `D:\Code\_claude-cvm-evidence\305\`，32 件**逐字节核过**）；**A 独立复现成功** —— d1 / d1c `completed`、d2 `MISSING_CREDENTIAL`、d3 `AUTH`，且三个隔离 home 的 profile deps **完全相同** ⇒ 受控对成立（唯一变量 = 凭据文件）；**B 已答**：`~/.dsh-015`（同代但缺 3 peer）与「**根本不存在**的 home」**归一化后 stderr 逐字节相同** ⇒ **空壳与不完整 profile 不可分**、且「profile 完全不存在」在 wire 层**不可达**；**附带否证两件**：① `~/.dsh-015` **不是**健康样本（WB 指定有误）；② **「跨代必红」不成立**（015 CLI ＋ 012 profile 且依赖自洽 = **绿**）；**根因链已订正（WB 09-16 二次上机 · 四组对照）** —— 现象成立（回退层确给 `dsh-session-persistence@0.1.2-rc.1`），但**成因不是「heal 注射代际污染」**：`~/harness` 的 **lockfile 被冻结在旧代际**（012 树上做单包增量升级的残留；全新 015 树解析得 `0.1.5-rc.2`，删 lockfile 重装即修、保留 lockfile 重跑 `install` **不自愈**），heal 只是**忠实反映该解析结果** ⇒ **已订正回写 `docs/dsh/dsh-migration.md` §3.6**；⇒ **原「1 条架构发现」终结：非 DSH 缺陷、不立项**（修法 ③ 撤销 ／ ① 保留但理由改为「免兜底」／ ② 降为一次性清理动作）；**遗留**：丙样本需**干净重测**（现带 `plugin-storage-probe` link，非干净样本）、E 组**未走 vitest 夹具**（两项按老大 09-16 裁决**并入下一单**）；✅ `/tmp/c305*` 样例 home **已于 2026-09-16 清理完毕**（连同更早的测试残留共清理 105 项）。⚠️ **订正**：原记「三处 `.credentials.yaml` 是指向真凭据的符号链接」**不成立** —— 实测命中的 `credential-provider-*` 是 AWS SDK 包名、`dsh-credentials` 是包目录；**真凭据残留是另一处**：`/tmp/trae-iso-home/.credentials.yaml`（**48 B 实体文件**），已一并清除
    - ⭐ **3.1 提前派发（老大 2026-09-17 拍）**：原批次表把 3.1 排在批次 2（在 3.0 ＋ 3.2 ＋ 3.7 之后）；老大定调「**3.1 编号在前，故应先做**」⇒ **3.1 提前、3.2 / 3.7 顺延**。闸门侧无碍：DSH-3.0.5 已于 09-16 完成，「待 3.0.5 后」已满足、块已空出
    - 📮 **DSH-3.1 · S0 基础链路**（**Trae**，2026-09-17 派发）→ **派发稿 = `exchange/log-trae.md` 末尾〈📮 DSH-3.1 派发稿〉段**（该文件当前唯一在飞任务）；**前置已全清**（`cvm-probes` 参数化 ＋ 本机环境同代化，见 `:275` / `:276`）；**场地 = CVM 单跑**
    - **DSH-3.1 · S0 基础链路**（Trae）→ ✅ **已回报（2026-09-17）· WB 复验通过（主结论）**：四项硬判据 **WB 独立复跑全绿**（CVM，`base` 变体，exit 0 —— 不采信其日志）；四条负向对照核回传证据自洽；**源 `sdk` profile 未被改写**（`plugin-tool-readfile` 出现 0 次 ／ mtime 停在 09-16 17:49 ⇒ §5(a) 真副本路线成立）；默认开关下 `1 skipped` 不红（WB 本机 vitest 实测）；**无真 Key 落盘**（WB 以**哈希比对**独立验证：`config.yaml` 唯一真值，4 处 fixture 与真 key 不同值）；CVM 侧残留 0（`/tmp/larry-s0-*`、孤儿锁）；交付物 = `713c103`（14 文件 ＋1159）；`docs/dsh/dsh-migration.md` 事实表补 9 / 10 两条并回填 3.1 行借鉴点
    - **✅ DSH-3.2 · 首验：跨进程 resume 的 id collision 定性**（**Trae**，2026-09-17 派发）→ ✅ **已回报（2026-09-17）· WB 复验：结论成立**（= **真缺口**，非姿势问题）；场地 = CVM；装置 = `harness/tests/s0-resume.test.ts` ＋ `scripts/run-s0-resume.mjs`（四变体 ＋ 构建前置检查 ＋ 退出码 0-1-2-124）；证据 = `D:\Code\_trae-cvm-evidence\s0-resume*`（4 份 JSON ＋ 原始 log，**WB 独立扫 Tier0：clean**）；**参考件借鉴点已回填**（`dsh-migration.md` 事实表 **11**）；⚠️ **Windows 侧锁子项仍为 3.2.1（未派）**；⚠️ **判据缺陷 1 已登记**（`p2LandedOnSameLog` 恒 `null`|`false`）
    - **✅ DSH-3.7.1 · 前置就位与定性**（**Trae**，2026-09-17 派发）→ ✅ **已回报（2026-09-17）· WB 复验：① ③ 成立 ／ ② 的判据被推翻** —— ① `EPERM` 归因**不成立**（4/4 可写、不给现象编主体）；② **实体安装属实**（4087/542 B、SHA256 与仓库源 SAME、真目录）**但「可加载」不成立**（落点 `import` 崩；根因 = peer `*` 把 `dsh-sandbox-local` 解析到旧代 **`0.0.1-rc.1`**，**已定为 3.7.2 硬前置 1**）；③ 凭据层 = **启动环境变量**；⭐ 附带硬发现：**`larry` 是 headless CLI 面、不是 SDK 面** ⇒ **3.7.2 岔口待裁（硬前置 2）**。**3.7.2 未派**，等两条前置清完
    - ⚠️ **WB 复验 · 两条驳回（2026-09-17）**：① Trae 自曝「`run-s0-e2e.mjs` 没有构建前置检查」**不成立** —— 本机该文件 `:40-61` **有**（WB 09-17 所加，提交 `cdc0fde`）；他核的应是 **CVM 上那份滞后同步的副本**（CVM 无完整仓库）⇒ **原待裁项「要不要回填 3.1 那只」随之作废**（无需回填）。② Trae commit message 称"订正 `dsh-pysdk-probe-claude.md:157`"，**但 `0f81c04` 未改该文件** ⇒ **WB 本轮已补正**（声明与交付不一致，记一条）
    - ✅ **WB 承认（出稿方义务）**：派发稿 §5 把 TS 客户端实物路径写成 `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-sdk-client/`，**CVM 上不存在**（实物在 `harness/node_modules/@deepseek-ai/dsh-sdk-client`）—— Trae 顶住了"照稿执行"的惯性并报出，**本条为回填**
    - ✅ **原记「3.2 / 3.7 未启」已作废（2026-09-17）** —— **3.2 全块 ＋ 3.7.1 已起跑**（两块**互不依赖**，即原批次 1 的分组，非破「同时只跑一块」）；**3.2.1 ／ 3.7.2 待前序回报后起跑**
      - ✅ **前序已清（2026-09-17）**：3.2 ✅、3.7.1 ✅ **双双回报并复验** ⇒ **3.2.1 ／ 3.7.2 的前置均已满足，待派**
      - ⛔ **`larry` 面已退役（老大 2026-09-17 裁）**：原「3.7 落点 = `larry`」作废 ⇒ **3.7.2 落点 = `sdk` 面**（硬前置 2 已裁）。工程 `.dsh-home/profiles/larry` ＋ 全局空壳 `~/.dsh/profiles/larry` **两处已重命名备份**（后缀 `.RETIRED-20260917-1808`），**3.7.1 落在共享层的产物同步退役**（该层已实证会取到旧代）。⚠️ **CVM 那份 `larry` 经复核后已于同日一并退役**（原判「不动」为抄旧登记未核实；实测 = 012 代跨代残留 ＋ 零引用 ＋ 停 11 天 ⇒ 重命名备份 `larry.RETIRED-20260917-1818`）。`@larryagent/plugin-probe` **包保留**（最小自研 bundle 样板）
    - ✅ **3.1 前置 · 仓库资产缺陷（WB 2026-09-16 发现 → 2026-09-17 已处置）**：`harness/scripts/cvm-probes/` 有 **3 个脚本 6 处曾钉 `@0.1.2-rc.1`**（⚠️ **原记「7 处」有误，2026-09-17 全目录逐字节实测为 6 处**：`cvm-setup-profile2.sh` ×3 ／ `cvm-acp-setup.sh` ×2 ／ `cvm-task1-setup.sh` ×1；`cvm-step0.sh` 等其余 8 个文件无钉版）—— 三者都是「**在 CVM 上装 profile ／ 插件**」的复现脚本，**会被 3.1 起的任务参考** ⇒ **照抄会装出 012 profile、重演混代崩溃**（3.0.3 已踩过一次）。详见 `docs/dsh/dsh-migration.md` §2.3 未闭合项 #6。**老大 2026-09-17 裁：走 ② 参数化** ⇒ ✅ **已执行（WB 同日）**：三脚本在 `export DSH_HOME=…` 之后插入 `DSH_VERSION="${DSH_VERSION:-0.1.5-rc.2}"` ＋ 3 行说明注释，6 处字面量改 `@${DSH_VERSION}`；**双验通过** —— `set -n` 语法检查 RC=0（无语法错）、展开验证「默认 ⇒ 6 处全 `0.1.5-rc.2` ／ 显式 `DSH_VERSION=0.1.2-rc.1` ⇒ 6 处全回 `0.1.2-rc.1`」、行尾纯 LF 未混排。✅ **已回同步 CVM**（scp 三文件；两侧 sha256 逐字节一致 `0484d821…` ／ `5fe6b699…` ／ `77986d45…`；同步前 CVM 侧与仓库 HEAD **同源**、无现场改动被覆盖）
    - ✅ **3.1 前置 · 装置侧两面不同代（WB 2026-09-16 发现 → 同日处置）**：`harness/package.json:26-27` 是**受版本控制**文件，本机原钉 `0.1.2-rc.1`，而 **CVM `~/harness` 那份已被 3.0.4 现场改成 `0.1.5-rc.2`**（`.bak-304` 为证）⇒ **同一份文件两面不同代**；又因同步方式 = **整树 tar**（CVM `SYNC-ANCHOR.txt` 原文 `excluded: node_modules, .git, dist`）⇒ **`package.json` ＋ `pnpm-lock.yaml` 都在覆盖范围内**，3.1 期间任何一次同步都会把 CVM 打回 012、重演 3.0.3 混代崩溃。**老大 2026-09-16 拍「本机整体升 015」（原选项 ①）**：
      - ✅ **已执行（提交 `a974258`）**：`harness/package.json` ＋ `pnpm-lock.yaml` 升 015（lockfile **删树重算**：`0.1.2-rc.1` 出现 0 次 ／ `0.1.5-rc.2` 出现 4923 次）；npm 全局 CLI（`%APPDATA%\npm`）升 `0.1.5-rc.2`；本机 `~/.dsh` 回退层已指 015 ⇒ `:271` ④「本机 `~/.dsh` 未修」**就此结清**
      - ✅ **剩余两项已派发 Qoder（2026-09-16）→ 已回报（2026-09-17）**：① `harness/node_modules` 重建（开工自检判 **symlink 可用** ⇒ 走 (a) 默认 isolated；顶层链接 `<SYMLINKD>`、**空壳目录 0**、4 条测试进程均自退出）✅；② 工程 `.dsh-home/profiles/{larry,sdk}` 升 015（与修前基线 diff **各仅 2 行版本号**、composition 未动；两个 lockfile `0.1.2-rc.1` 均 0 次）✅。**附带任务 C**：与 CVM lockfile 逐行 diff = **仅 1 行差异**（本机多 `packages/plugin-015-preset-probe` 空 importer，因 CVM 尚未同步提交 `8aee09b`）⇒ 无依赖解析分歧。**（Qoder 报告另提两处订正：① 与 `:278` 符号链接记载的矛盾暴露，已并入 `:278` 复验；② 原派发稿验收措辞需订正 —— 两条负向哨兵本就应红）**
      - ✅ **符号链接问题已终结（2026-09-17 WB 独立复验，推翻 WB 自己在 09-16 的记载）**：原记「本机创建真符号链接失败、仅 `%TEMP%` 内可建」**不成立**。实测（WB 与 Qoder **两条独立通道**）：`os.symlink` 与 `fs.symlink(...,'dir')` 会**抛** `WinError 2`／`ENOENT`，**但链接真实建成** —— `isSymbolicLink=true`、`readlink` 正常、`children` 可列、`reparse tag = 0xa000000c`（真 SYMLINK；junction 为 `0xa0000003`）；Qoder 另以 `mklink /D` 在四路径（`D:\` 根 ／ `C:\Users\SuLarry` ／ 项目目录 ／ `%TEMP%`）全数建出 `<SYMLINKD>`。⇒ **本机 symlink 可用**，`harness/node_modules` 已按 **(a) 默认 `pnpm install`** 装出 **isolated** 布局（`.modules.yaml` 实证 `"nodeLinker": "isolated"`），与 CVM **结构等价** ⇒ 下方「hoisted 兜底 ＋ `~/.npmrc` 固化」与「本机 hoisted ↔ CVM isolated」**均作废**（`~/.npmrc` 未动，仍只有 registry 一行；DSH-3.1 清单**无需**加"两面结构不同"标注）
        - **错因 · 元教训**：判据取在**异常分支**（见 `except` 即判 FAIL），从未验证实际结果；另把 `.NET` 的「需要管理员权限」当反面对照 —— 它**不传** `ALLOW_UNPRIVILEGED_CREATE` 标志，在任何路径都报同样错，**不构成对照**。09-16 观测到的「建出空目录」**今日不可复现**，**成因未查清**（不补成因）
        - ✅ **仍然成立的四条判据（与上述结论无关，勿一并丢弃）**：① **「目录存在」≠「链接建成」** —— 判链接须读 `os.lstat().st_reparse_tag`，不可用 `os.path.isdir`（pnpm 的 scope 目录 `@deepseek-ai`／`@types` 本身无 `package.json`，**不可当空壳**）；② **pnpm 状态缓存不校验内容** —— 外部删过树后 `install` 与 `--force` 均回 `Already up to date`、**不自愈**（须删 `.modules.yaml` ＋ `.pnpm-workspace-state-v1.json`，或整树重装）；③ **install 输出不能当验收**（报 `Done`／`exit 0`／零 error 仍可能是空壳树），必须用 `require.resolve` 逐条验；④ **`pnpm run <script>` 会先自动跑一次不带参数的 `install`**
      - ✅ **剩余三处遗留已处置 / 已裁（WB 2026-09-17，老大同日裁决）**：① **`cvm-probes` 钉版 → 已参数化**（详见 `:274`；✅ 已回同步 CVM）；② **CVM 缺 `packages/plugin-015-preset-probe/` → 随下次同步补齐**（老大裁「随下次同步补齐」；该包 3 文件受 git 跟踪、由 `8aee09b` 引入，**不补亦不影响 lockfile 解析一致性** —— 唯一的逐行差异就是这一行空 importer）；⚠️ **另发现一处滞后**：CVM `~/harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` 的注释仍写旧落点（`profiles/node_modules/…`，本机已于 2026-09-17 改为 profile 自身层）⇒ **随下次同步一并覆盖**（该处是"范式级"注释，留着会继续把人引到已证会取旧代的层）；③ **主 `~/.dsh` 的两个空 `node_modules` 已删**（2026-09-17 实测为 **`profiles/{larry,web}` 各一个**、均 0 项 —— ⚠️ 原记「`larry` 下两个」不准；用 `rmdir` **非递归**、删前断言为空、删后复核 `profiles/sdk` 那份 **82 项完好未动**）
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
    | **1** | **3.0** + **3.2** + **3.7** | 三者互不依赖；⭐ **2026-09-17 实况**：3.0 ✅ ／ 3.2 ✅ **已回报＋复验** ／ 3.7 **拆为 3.7.1（✅ 已回报＋复验）＋ 3.7.2（前序已清、待派）**；⚠️ 3.7.2 落点**已由 `larry` 改 `sdk`**（该面已退役） |
    | **2** | **3.1 S0** | 单发；后续一切的地基 —— ⭐ **已提前至批次 1 之前派发（老大 2026-09-17 拍：编号在前即先做）** |
    | **3** | **3.3 → 3.4 → 3.5 → 3.6** | **严格串行**（逐层叠加、单独验收） |
    | **4** | **3.8** + **3.9** | 3.8 可在批次 3 后期并行 |
  - 「待核（不阻塞拍板）」段各条**全为调研类**（不碰 CVM、不等 Key）⇒ 可与批次 1 并行派出
- [x] ~~DSH-2 任务 0 派发~~ **已完成**（Claude 2026-09-08，报告已吸收内联至决策稿 §3.6 逐项证据表：A 案成立、8/8 机制属实，WB 复核订正 2 处行号）

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

> **DSH 线**（`DSH-N` 独立序列，与 P0–P4 无关）：DSH 迁移专项，**完成一个归档一个**；在飞阶段见上方「DSH 迁移」区。

> 原 P5（移动端 + 部署）已取消 P 编号，2026-08-20 拆分为「移动端开发」「部署调试试运行」两个普通阶段（2026-09-11 起位于本文件末尾「过时计划（缓删）」区），与记忆系统调优等并列。

## 以下是初步裁定为过时计划的条目，但是缓删，AI勿处理

### 移动端开发

- [ ] 响应式 UI 或独立 `mobile/index.html`
- [ ] PWA manifest + Service Worker（可选）

### 部署调试试运行

> 统一架构方案见 **`exchange/deployment-architecture.md`**（云/端边界、配置、隔离、打包、落地顺序，2026-09-03，**待 DSH 迁移完成后重新制定**）。本段各条为其落地步骤，顺序 = 方案 §八。

- [ ] Nginx 部署脚本示例（静态文件 + API 反代）
- [ ] 部署文档 + 安全加固
- [ ] 计划：租 VPS 部署 backend + SQLite + 小模型（bge-small 等），非纯本机。数据落云厂商磁盘，embedding 在自有服务器跑，LLM API 是唯一出境通道。
- [ ] **上云硬前置（方案 §五，不满足别上）**：① `server.api_key` 强制强随机 key（P3.4 校验已就绪）；② HTTPS（Nginx TLS 终止，DV 免费证书即可）；③ 上云初期显式禁用 shell/file_ops（`enabled_tools: ["web_search"]`），防云端误操作云机器。
- [ ] **本地能力下沉（shell/file_ops 端侧化，方案 §七.1，单独立项、不与云部署捆绑）**：云端 backend 不注册 shell/file_ops，本地执行器（复用 backend 瘦身本地模式，倾向方案 B）承接。下沉时一并完成：① shell 鉴权重构（IP 白名单 `127.0.0.1`/`::1` 与公网不兼容，改 API Key 鉴权为主）；② ShellTool 命令注入加固（字符串包含匹配可穿透，升级正则/词法解析或换沙箱）。

### UI/UX优化

- [ ] 绝对长期项目，人类至高训导权 + 个人项目 的完全体现，人类想做啥就做啥，我就是要五彩斑斓的黑！
- [ ] 初步测试，UI还是存在一些BUG，这个慢慢来
- [ ] **角色切换过渡动画回写**：方向已定（纯 color transition 200ms，不用 transform/位移，定案见 `docs/ui-reference.md` §9）；C2 已落地，余留细节由 Trae 点将实现时回写 `docs/ui-reference.md`（优先级：低）
- [ ] **Trae 实现期 UI 细节文档化**：实现期新增的 UI 细节（如 `--weight-semibold/bold` 等 token）以 `tokens.css` / 组件代码为准，待点将时回写 `docs/ui-reference.md` §10 已知局限所列项
- [ ] **会话项时间戳展示**：UI-Reference §5.4 SidebarItem 规格要求"标题 + 时间戳（右对齐）"，当前代码只有标题（API 已返回 `updated_at`，待实现展示）
- [ ] **角色归属设计**（老大暂缓，待数据模型支撑）：会话级角色（每条会话属于哪个场景角色）目前无数据模型支撑，前端已删全局色点；如何按会话表达角色待定
- [ ] **断点折叠模式（640–1023 48px 图标）**：UI-Reference §3 规格，当前代码仅实现 <768 抽屉，640–1023 折叠模式未落地
- [ ] **网络断开常驻提示**：ConnectionToast 由临时 toast 改为**常驻 banner**；不做输入框禁用（网络问题是外部问题、不入工具范畴），有提示即可（UI-Reference §6）
- [ ] **SSE 中断恢复**：流中断 5s 无数据 → 提示"重新发送"（UI-Reference §6）
- [ ] **超长消息折叠**：>2000 字默认折叠前 6 行 + "展开全文"；代码块独立横向滚动（UI-Reference §6，优先级：低）
- [ ] **Accessibility（WCAG AA）**：触控目标 ≥44px / aria-label / prefers-reduced-motion 关闭动画（UI-Reference §7）

### UI 页面：设置入口 / 已归档列表 / 回收站列表（同期实现，待点将）

> 用户 2026-08-27 指示：设置按钮"另有考虑"，且大概率与"回收站""已归档"页面一起做。三者合并为一批 UI 页面工作。

- [ ] **设置入口页面（复活）**：P4.5 砍除 `/settings` 路由与 TopBar 设置按钮；用户另有考虑（方案待定），倾向与下方两页面同期复活设置入口。最终方案定后回写/对齐 `docs/ui-reference.md` §5.5 原设置按钮描述
- [ ] **已归档会话列表页面**：归档系统后端已通（`GET /conversations?archived=`），前端 `api.ts` 函数已备（`listConversations({archived:true})` 等），仅缺 Vue 页面；UI 高度复用活跃列表骨架
- [ ] **回收站列表页面**：后端已通（`GET /conversations/trash` + restore/purge），前端 `api.ts` 函数已备（`listTrash` / `restoreConversation` / `purgeConversation`），仅缺 Vue 页面；UI 高度复用
- 注：三者复用同一列表组件骨架，归一批做性价比最高（用户 2026-08-27 定调同期）

### 记忆系统调优

- [ ] 检索参数调优（`memory/engine.py::get_long_term_memory`）：长期 — 根据实际使用中召回质量持续调整 score_threshold / top_k / 分级阈值
- [ ] 向量检索上下文扩展：archive 中同一 memory_id 的相邻 chunk 在命中时一并拉出合并，避免 LLM 看到被截断的片段
- [ ] `search()` score_threshold 分级：不同来源检索用不同阈值
- [ ] 记忆保鲜机制：`last_hit_at` / `priority`，被频繁检索的记忆提升保留权重
- [ ] 向量同步补偿：长期 — ChromaDB 异常恢复后自动校验 SQLite ↔ ChromaDB 一致性并补写缺失向量
- [ ] Embedding 模型迁移脚本：长期 / 待触发 — 更换模型时重建 collection + 全量重索引

### 多场景 AI 架构

> 当前仅支持手动切换角色，以下为长期架构愿景，留待后续迭代。

- [ ] 意图识别机制：长期 — 对话开头快速分类用户意图，自动切换角色
- [ ] 跨域关联能力：长期 — 记忆检索不限单一领域，允许 AI 发现跨场景因果链
- [ ] 用户画像沉淀：长期 — 从记忆中提炼结构化用户画像，注入 system prompt
- [ ] 场景间信息同步策略：长期 — 定义全局共享 vs 领域私有的记忆边界；落地手段 = 长期记忆检索按 `source_role` 加权（软隔离），多场景角色记忆分离
- [ ] 根据记忆向量空间的分析，自动形成新角色的建议

### 工程债务（需要重新考虑）

- [ ] **❌ 已作废（老大裁决：此事延后至DSH6再做评估）** 主要考虑到全面TS化之后，配置方式可能会有变化: `config.example.yaml` 与正式版结构漂移
- [ ] **前端集成层测试**：会话切换加载 / 角色切换传参的集成测试（mock RouterView + store 联动）。逻辑层已由 Claude 覆盖（P4.4 测试 31/31 绿），集成层待补；原规格"引入新逻辑层时一并补，或 WB 明确要求再做"。P4 完结时不阻塞（功能闭环已达成），归此待补
- [ ] **存量测试债务是否修复**：`test_chromadb_degradation.py`（mock 了已不存在的 archiver.get_db）、`test_shell_tool.py::test_windows_dir`（中文 Windows 编码断言）。选项 A：修复恢复"全套绿"基线；选项 B：维持"相关测试 + 已知项甄别"现状。当前规则以 B 运转（见 CLAUDE.md/TRAE.md 测试环境段）。此事不是很急，找个合适的机会讨论一下
- [ ] **边界侵蚀（工具/对话消息分离）**：`tool_calls` / `tool_call_id` 不再写入 `messages` 表，工具消息与对话消息分离（数据模型整洁）

### 其他长期增强（待触发）

- [ ] chat_service token 累计上限（单次对话 tool call 总 token 阈值）：防止单轮读大文件等场景暴增，当前仅轮次限制。优先级很低，不做主动处理；若后续出现相关问题再讨论完善，不静默自动处理。
