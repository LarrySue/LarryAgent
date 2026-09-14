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

> **基线**：写码按锁定版 **`0.1.2-rc.1`** API（**不升基线**，DSH-2.6 定）；0.1.5 破坏性清单见 `docs/dsh/dsh-migration.md` §3.4「DSH-2.6 收口复核」——**升级当独立动作，不在本阶段顺手升**。

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

> **子阶段划分（2026-09-14 定）**：3.0 前置 → 3.1–3.6 主线六切片（**严格串行、逐层叠加**）→ 3.2 首验 / 3.7 方言修复件（支线）→ 3.8 设计产出 → 3.9 收口。
> **判据 / 验收基准 / 负向对照矩阵 / 采数口径 / 执行范式 → `docs/dsh/dsh-migration.md` §3.6「DSH-3」**；CVM 环境与凭据 → `docs/production-env.md` §12；方言修复件范式 → `docs/local-env.md` §4.3；**派发规格（执行人 / 批次）→ 本文件「待派发」段**。
> ⚠️ 原详细计划稿 `exchange/dsh-3-plan.md`（含四方评审附 A/A-2/B/C）的实质内容已于 2026-09-14 **全数承接入本文件与 §3.6**，该稿已于 `677523d` 处置（删除）；如需追溯评审原文：`git show 3362f57:exchange/dsh-3-plan.md`。

#### DSH-3.0 · 开工前置（CVM 环境 + 凭据 + real-api + 采数）📮 派发 001 → Trae（2026-09-14）｜**回报已收 · 裁定 001 已发**

- [x] ✅ **凭据落位**（2026-09-14）：CVM `~/.dsh/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY`（600 / 223 B，`records:` 段完好）
- [x] ⚠️ **环境核对**（2026-09-14，**同日订正**）：`dsh@0.1.2-rc.1` 双证（CLI + `package.json`）；node v22.22.2
  - ⛔ **原记"`~/.dsh/profiles/` 四个全在"是错的** —— 那是**数目录、没验依赖**。实测：`~/.dsh/profiles/sdk` 的 `dependencies` = **`{}`**、`node_modules/@deepseek-ai` = **0** ⇒ **空壳**；`larry` 有 7 包；**装齐的 profile 全在 `~/larry-dsh-home`**（sdk 101 / acp 100）
  - ⭐ **本机同一形态**（`.dsh-home/profiles/sdk` 99 包 / `~/.dsh/profiles/*` 空壳）⇒ **"凭据落一个 home、profile 落另一个 home"是系统性问题**，非 CVM 独有
  - ⇒ 纪律「CVM 以 `~/.dsh` 为准」**结论不变**（其理由本就含"裸跑默认"一条，与依赖无关），但**前提需补真**（见下）。
- [x] ✅ **同步本机 `harness/` → CVM**（Trae 2026-09-14）：**26 → 61 文件 / 566,393 → 753,485 B**，目标 `/home/ubuntu/harness/`；`SYNC-ANCHOR.txt` 已落（源 commit `57304ac` / `HEAD:harness` = `6c268877`；tar 145.6 KB / 55 条目、`scp` 1.11 s；`pnpm install` exit 0 / 18 s）
  - ✅ **卡 3.5 的那三个沙箱探针包已到位**（`plugin-sandbox-probe` / `plugin-sandbox-mount-probe` / `plugin-sandbox-dialect`）
  - ⚠️ CVM **原本无 pnpm / 无 corepack** ⇒ 已 `npm i -g pnpm@11.7.0`（3 s）
- [ ] ⭐ **装齐 CVM `~/.dsh/profiles/sdk`**（**裁定 001 已授权**，2026-09-14）：两条 `dsh plugin --profile sdk add`（`dsh-base` + `dsh-sdk-app` @ `0.1.2-rc.1`，**全程带 `DSH_HOME=$HOME/.dsh`**）
  - **这就是完整 composition**：本机 `.dsh-home/profiles/sdk` 的 deps 恰为这两项，`storage` / `session` 类包随传递装齐（`dsh-session-persistence-jsonl` / `dsh-session-query-sqlite` / `dsh-storage-json`）⇒ **无需**手工补 `storage-sqlite`
  - ⛔ **`larry` 本次不动**：CVM `~/.dsh/profiles/larry` 现 composition（api-gateway + host-webserver）与本地（base + headless）**不同**，属 3.5/3.7 派发时单独定的事
  - ⛔ **软链方案不采纳**（两个 home 缠在一起 = 正是要消灭的重叠环境）
  - ⭐ **`~/larry-dsh-home` 降级为「负向对照器材」**：有完整 profile、**无凭据** ⇒ D 组"无 key 态"的理想对照（只变凭据一个变量）。**它不是运行 home**，拿它跑出"绿"即无 key 假绿（D2 已实证）
- [ ] ⭐ **凭据层验真（2026-09-14 查实后新增，本步最重要）** —— 证明 `~/.dsh/.credentials.yaml` 的 `refs.DEEPSEEK_API_KEY` **确实被读取且真用于调用**：用 `harness/scripts/dsh-prompt.mjs` **裸跑**（它**不覆盖 `DSH_HOME`** ⇒ 落 `~/.dsh`），三态 = 真 key（**不注入** env）/ 无 key（`DSH_HOME=~/larry-dsh-home`：有 profile、无凭据）/ 错 key（隔离 home + 伪造值 + 600）；判据 = **三态互不相同** + 每态记 `(DSH_HOME, profile, 凭据来源层)` 三元组
  - ⚠️ **为什么必须新开这条路径**：`run-real-api.mjs` → vitest → `vitest.config.ts` 的 `setupFiles: ['tests/isolated-setup.ts']` **强制把 `DSH_HOME` 覆盖为临时目录**（该文件 `:31-33`）⇒ **real-api 读不到凭据文件**，其 key 只能来自 env（`tests/real-api.ts:28`）。⇒ `production-env.md` §12.5 原写"真生效待 3.0 real-api 复跑"**是错的，已订正**（该文档 §12.5 第三条订正）
  - ⚠️ **不得改动** `~/.dsh/.credentials.yaml`（负向两态一律用隔离 home 造）；回报只写键名 / 是否存在 / 长度
  - 🔴 **Trae 首次尝试 ⛔ 未闭合**（2026-09-14）：D1 ≡ D3（同为 `-32603 cannot create effect on inactive context`，**崩在启动期、不是鉴权**）、D2 exit 0 + stdout 全空（**无 key 假绿**）⇒ **三态不互异，判据不成立**。根因 = `~/.dsh/profiles/sdk` **空壳**（**与凭据无关**）⇒ **裁定 001 已授权装齐后重跑**
  - ⛔ **判据已被证不敏感的一件**：`dsh --profile <p> --help` **不校验 profile 依赖**（三 home 全绿，1 s 内 exit 0）⇒ **不得**用于"profile 可用性"判定（与附 B §二 `--dump-config` 同类）
- [ ] **real-api 在 CVM 侧复跑** —— ⭐ **三态对照：无 key / 错 key / 真 key，同一脚本跑**，判据 = **三态表现互不相同**（⚠️ 无 key 态正是已证会假绿的那一态）
  - ✅ **Trae 2026-09-14 跑通三态**（互不相同 ✔）：**E1 不注入** → guard **显式失败**（"开关 `DSH_REAL_API=1` 但环境变量未提供"；有效 Key 用例 **5 ms 即抛 = 未发起调用**）/ **E2 错 key** → 走了 API、**AUTH·401** / **E3 真 key** → **OK**（`verdict=OK … turn/end.kind=completed`；`Tests 14 passed | 1 skipped`）。三态各 ~2 s（网络好，**未触发看门狗、无 124**）
  - ⚠️ **夹具声明**：`real-api.ts` 默认 profile 源是 `<repo>/.dsh-home/profiles`（**本机约定**），CVM 上不存在 ⇒ Trae 用 `DSH_REAL_API_PROFILE_HOME` 指到**唯一装好的** `~/larry-dsh-home/profiles`。**这是夹具来源、不是 home 决定** ⇒ 装齐后**重跑并把夹具改指 `~/.dsh/profiles`**
  - ⚠️ **本组只代表「环境变量层」**，**不得**用于宣称"CVM 凭据文件生效"
- [ ] **顺手采数**（白捡的规格账；**老大 2026-09-14 拍：纳入 3.0 验收**，口径见 `docs/dsh/dsh-migration.md` §3.6〈采数口径〉）：cgroup v2 为主口径 + 免轮询三件（`memory.peak` / `memory.events` / `memory.pressure`）+ 带宽（记工具/目标/时段）
  - 🟡 **Trae 2026-09-14 已在 CVM 后台起采样器**：`/home/ubuntu/trae-evidence/sampler.sh`，**30 s × 240 点 ≈ 2 h**（`~19:06` 满）→ 待取数回传
  - ⭐ **口径发现：`memory.peak` 是 cgroup 生命周期峰值、不是窗口峰值** —— WB 复核 CSV：峰值在 **17:07:18 由 30.8 MB 跳到 255.5 MB**（= E 组测试运行窗），此后**每行都停在 255.5 MB 再不回落**。⇒ ① 255 MB **有出处**（E 组 vitest/node），**非"原因未知"**；② **引用 `peak` 必须同时给 cgroup 起点 / boot 时间**，否则"这轮没吃紧"是假结论
  - ⚠️ **与 Claude 昨日读数（`peak≈1234 MB`）对不上**（本机 uptime 4d20h、`peak` 单调不减 ⇒ 今日 17:06 的 30.8 MB 不可能小于昨日值）⇒ 两种解释：① 两次读的**不是同一个 cgroup**；② user slice 在两次读之间被重建过（全登出即销毁）⇒ **并列留痕不合并**，待 Trae 写明取值路径
  - ⚠️ **采数窗口内冻结 CVM 其他活动**（2G 机器；OOM 会把曲线**断掉**、事后被误读成"内存稳定"）
  - ⚠️ 采样窗**受第三方会话干扰**（Trae 记 `pts/0` 14:01 起；**WB 17:26 实测该会话已不在**、机器空载 load 0.00）⇒ 曲线须标"受干扰"
  - 📊 带宽实测（17:06）：`registry.npmmirror.com` **784 KB/s**（2.27 MB / 2.90 s）/ `github.com` **121 KB/s**；工具 = 远端 curl 经 ssh
- [x] ✅ **执行说明就位**（Trae 2026-09-14 出）：`node` / `dsh` **都不在 PATH**（`export PATH=$HOME/node/bin:$PATH`）+ **四条范式实测通过**（PATH 前置 / 后台长任务 `setsid nohup` + 完成标记 + `rc` / 前台长任务 / 非阻塞轮询 30 s 精确）
  - ⚠️ **Trae 通道独有坑（他自记）**：内联引号 / `$VAR` / 反引号会被本地吃掉（本轮又踩 6 次）⇒ **命令一律走 base64 载体；本地文件操作用字面路径、不用变量**

#### DSH-3.1 · S0 基础链路

- [ ] ⭐ **`harness/packages/plugin-tool-readfile/`**（**首个"产品"插件**，此前 5 个 `packages/*` 全是探针）+ 可复跑 e2e 脚本
- [ ] 四项硬判据**同时**成立：① 消息往返 + **nonce 内容断言** ② plugin **确实被激活**（⭐ 以 boot 时 `activate` 打点为准；⚠️ **`--dump-config` 是假绿源**——只组配置树、不激活） ③ 真实回包非空 + `turn/end.reason.kind === 'completed'` ④ session 落盘 + **回读可查到同一 nonce**
- [x] ✅ **S0 通道已定（老大 2026-09-14）：走 `sdk`** —— 它走的就是 **B 段**（09-09 已定型 SDK/stdio），**非新开面**；前置件 1（`harness/tests/real-api.ts`）已用 `dsh-sdk-client` + `profile: 'sdk'` 且绿/红两侧经 WB 独立复验 ⇒ **零新增器材**；S0 四项判据在〈sdk 面实测能力边界〉逐条覆盖。理由与 ACP 用途的定位见 `docs/dsh/dsh-migration.md` §3.6〈通信面选型分析〉落定块
- [ ] 📚 **参考件**（登记表 3.1 行）：`ref/community/kun2-5code__dsh-plugin-template` —— 插件脚手架（`dsh.bundle.patch` + `dsh.client` 清单形状、`service` / `hook` / `commands` 三个半边、**假 ctx 单测范式** `test/smoke.mjs`）；e2e 台可参照 `iiwish/dsh-testkit`（Docker 隔离真宿主生命周期测试）/ `PerryLink/dsh-test-drive`（一次性 profile 冒烟）

#### DSH-3.2 · 首验：跨进程 resume 的 id collision 定性

- [ ] 反向组（固定 ID 复现 `id collision`）+ 正向组（新 UUID）+ **关键组**（真实 completed 会话、跨进程复用同 ID）
- [ ] **对照组 0**：grep SDK client 源码确认**是否存在显式 resume 入口** —— 若不存在，"SDK 不支持 resume"与"固定 ID 会 collision"是**两个独立的 bug**，可能同时存在
- [ ] ⚠️ **复用 3.1 产出的 nonce 会话，不另造**（否则两处会话构造法会漂）
- 执行人：**Trae**（他此前判"改 UUID 后成功"，让他自己验自己的判据）
- 🟡 前置：我方 CVM 通道核查（见 3.0）
- [ ] 📚 **参考件**（登记表 3.2 行）：`EvilIrving/dsh-repro`（导出**最小可复放的问题包**，含会话日志 / 失败命令 —— 复现件的形态参照）；官方 `dsh-session-persistence-sqlite` / `-jsonl` / `dsh-session-query-sqlite`

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

- [ ] 把 `harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` 的两段写进 profile 的 `cordis.patch.yml` + **一次真 end-to-end**（模型触发被拒命令 → 看到 `[sandbox: file access denied]`）。范式 / 自检口径 / 已证未证边界见 `docs/local-env.md` §4.3（**原 DSH-2.5 ③ 收口欠账 1**）
- [x] ✅ **落盘人已定（老大 2026-09-14）**：先由 **Trae 复跑一次**把 `EPERM` 归因定性清楚，**他通道实测可写则由他落盘**（分配明细见「待派发」段）
- [x] ✅ **落点已定（老大 2026-09-14）**：写**工程 `.dsh-home/profiles/larry/cordis.patch.yml`**（追加）；**不落 `~/.dsh/`**；**`web` profile 不补建**
  - 判据：3.7 的 end-to-end **真实宿主是 client 启动的 DSH**，而 client **显式指工程 home**（`main.rs:291`）⇒ 落全局只能验"手工跑生效"，属**替身路径**；且"手工跑回落全局／client 读工程"正是 09-14 刚定要消灭的重叠环境
  - ⭐ **配套三件（缺一即"落点对了却没生效"）**：① `.dsh-home/.credentials.yaml` **须建**并填 `larry-dev`（`refs.DEEPSEEK_API_KEY`）——否则带对 home 也**无 key**；② 手工复验**须显式注入 `DSH_HOME`**（模板见下）；③ 凡启动 DSH 处**一律显式注入、不靠默认回退**
  - 🔧 **手工复验命令模板**：`cd /d/Code/LarryAgent && DSH_HOME="$(pwd -W)/.dsh-home" node harness/scripts/dsh-prompt.mjs "…"`
    - ⚠️ **`pwd -W` 不是可选的**：Git Bash 的 **env 值不做路径转换**（转换只发生在 argv）⇒ `/d/Code/…` 原样给 Windows node，被 resolve 成 **`D:\d\Code\…`**（当前盘根多一层 `d\`）⇒ DSH **自己新建一个空 home** ⇒ **无 key 假绿、判据全绿**（**与 `cvm-probes` 钉错 home 同形态**）。三写法实测对照 → `docs/production-env.md` §12.7 附二
    - ⛔ **跑 harness 测试时禁止注入真实 home**：`tests/isolated-setup.ts` 强制覆盖为临时目录 + 正向白名单守卫；注入真实路径会触发 `sentinel-failfast` 判 FAIL
  - 🔍 **落盘人待定的实况（2026-09-14 WB 实测）**：Trae 报其通道写 `~/.dsh/profiles/*/cordis*.yml` 被拒 `EPERM` —— ⚠️ **该归因待复核**（09-12 曾出现同类"主体错位"：把 **DSH 自身沙箱**的 EPERM 记成 AI 工具沙箱）；**WB 通道实测可写**（`~/.dsh/profiles/sdk/` 试写成功）。⚠️ **三通道结论不可互推**，Trae 那条须他自己复跑定性
  - ⚠️ 落盘**是追加不是覆盖**：`.dsh-home/profiles/larry/cordis.patch.yml` 现有 477 B，**已含一条 `- id: hmr / disabled: false`**
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
  - **CVM**：以裸跑默认 **`~/.dsh`** 为准（凭据已在此）⇒ **废弃 `~/larry-dsh-home`**，并改掉 `harness/scripts/cvm-probes/*.sh` 里钉死的 `export DSH_HOME="$HOME/larry-dsh-home"`（⚠️ **照抄这些脚本 = "无 key 假绿"**）
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
- [ ] 角色机制（`config.yaml` 5 角色 → `preset/` + `cordis.yml`）
- [ ] 工具生态（`tools/` 844 行 → DSH 工具插件；**web_search 暂保留自实现 Brave**——不配正文抓取，SSRF/清洗成本是刻意规避的）
- [ ] 用户画像 📐
- [ ] 知识库（三层递进 + BM25/FTS 混合检索）
- [ ] 回收站 / 每会话文件沙盒（DSH `sandbox/` 语义不同，须自定义）
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

### 待派发

- [ ] **DSH-3 prototype 派发**（**批次与执行人，老大 2026-09-14 拍定**）
  - 📮 **派发进度（2026-09-14）**：**001 · DSH-3.0 已发** → `exchange/log-trae.md`（执行人 Trae）
    - **回报已收**（同日）：A/B/C/E/F 完成；**D 组曾阻塞**于 `~/.dsh/profiles/sdk` 空壳
    - **裁定 001 已发**（WB 同日，见 `log-trae.md`）：授权装齐 `sdk` → 重跑 D 组、重跑 E 组（夹具改指 `~/.dsh/profiles`）、取 2 h 采样
    - 老大定「**一个一个发，不要并行发**」⇒ **3.2 / 3.7 待 001 收口后再发**
  - **执行人分配**
    - **3.1–3.6 实现侧 + 3.2 定性** → **Trae**（分工原则 + 他 §八 已自认领）
    - **3.5 上机跑** → **Trae**；**器材由 Claude 出**（`landlock_probe.py` 已回归：ABI 自适应 + 负向开关 + `VERDICT=` 机读行）
    - **3.0 CVM 侧**（本机 harness 同步 + real-api 三态 + 采数）→ **Trae**（他自验通道 ✅ 0.94 s、四范式齐备）；**Claude 只在验收环节上机**做负向对照
    - **3.8 A 段协议设计稿** → **WB 出稿、Trae 承接实现**。依据：分工「WB=架构」；且其核心是"审批请求双向中继"的协议定义（3.3 三段收敛的终点），需**跨段视角**，写码者自定协议易把实现细节当规范
    - **3.7 落盘** → 先由 **Trae 复跑一次**把 `EPERM` 归因定性清楚（⚠️ 该归因**待复核**；09-12 曾有同类"主体错位"：把 **DSH 自身沙箱**的 EPERM 记成 AI 工具沙箱），**他通道可写则由他落盘**
    - **3.9 收口核对表 / `docs/` 维护 / 复验他人结论** → **WB**
  - **批次节奏**
    | 批次 | 内容 | 说明 |
    |---|---|---|
    | **1** | **3.0** + **3.2** + **3.7** | 三者互不依赖（凭据已定、落点已定）；⚠️ 3.7 待"落盘人"定性后起跑 |
    | **2** | **3.1 S0** | 单发；后续一切的地基 |
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

> **DSH 线**（`DSH-N` 独立序列，与 P0–P5 无关）：DSH 迁移专项，**完成一个归档一个**；在飞阶段见上方「DSH 迁移」区。

> 原 P5（移动端 + 部署）已取消 P 编号，2026-08-20 拆分为「移动端开发」「部署调试试运行」两个普通阶段（2026-09-11 起位于本文件末尾「过时计划（缓删）」区），与记忆系统调优等并列。

## 以下是初步裁定为过时计划的条目，但是缓删，AI勿处理

### 移动端开发

- [ ] 响应式 UI 或独立 `mobile/index.html`
- [ ] PWA manifest + Service Worker（可选）

### 部署调试试运行

> 统一架构方案见 **`exchange/deployment-architecture.md`**（云/端边界、配置、隔离、打包、落地顺序，2026-09-03，草案待定稿）。本段各条为其落地步骤，顺序 = 方案 §八。

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
