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
> **判定依据 / 环境规格表 / 8 项证据表 / 通信面定型（含 T1/T2/T3 触发线）** → `docs/dsh/dsh-migration.md` §3.4 / §3.6；**本机环境基线** → `dsh-local-env.md` §4 / §6 / §8 / §9 / §10。
> **六个隐性欠账处置（2026-09-11 结清）**：
> 1. 🔴 沙箱方言修复件**生产挂载落盘** → **转 DSH-3**（承 2.5③）——挂载范式见 `dsh-local-env.md` §4.3
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
  - ⚠️ **判据订正（2026-09-10）**：成功判据是 **`turn/end.reason.kind === 'completed'`**，**不是**「`turn/end.reason` 不存在」—— 后者是 WB 字段路径取错（`turn/end.data.reason`）写下的错误表述，**照字面实现会假红**。`dsh-local-env.md` §6 已订正。
  - ✅ **退回件已收口（2026-09-10 晚，WB 复验）**：原报「进程不退出**必现**」**撤回** —— 实测为**偶发**（Claude 独占 6 次 + WB 干净 1 次全部正常；WB 另 3 次复现，**均在其自己环境被污染的条件下**）。⚠️ **WB 原归因（"teardown 没跑"）是错的**，日志显示 teardown 跑了。
  - 🟢 **根因已收窄**：复现日志证明**挂点在「teardown 跑完之后、vitest 主进程真正退出之前」**，且 **EXIT-NET 安全网（teardown 布防）全程未触发** → **实测印证了 Claude 的"两层互补"判断**：该层救不了，**只有入口脚本墙钟看门狗能兜住**。
  - ✅ **防护已就位（Claude 交付，WB 判通过）**：① 启动期清扫过期残留（>2h）；② teardown 退出安全网（方案 A：真实退出码 + 诊断，**不因残留判红**——假红比没护栏更糟）；③ **入口脚本墙钟看门狗 20 分钟**（超时杀进程树 + exit 124，与测试失败的 1 区分）。CI 不会再挂死。
  - 🔒 **收口裁定（老大 2026-09-10 拍板）：不验，按偶发收口。** 接受「偶发、根因未定位」，靠入口脚本 20 分钟墙钟看门狗兜住（**CI 不会再挂死**）。三个候选方向（本机 dsh 并发争 profile / Bash 管道 stdio 非 TTY / 进程组语义）**均不验**。
    - ⚠️ **将来若在生产真撞到**（后端跑着 dsh 时并发跑测试 = 同一场景）→ **按当时现场重启这条线**，不预先投入。
    - 📌 **本件（DSH-3 前置件 1 退回件）至此全部收口**：三件交付通过（含看门狗）、退回撤回、安全网按方案 A 落地。
- [x] ✅ **S0 环境已拍（老大 2026-09-11）：CVM 单跑，本机对照省。**原三选一（① CVM（Linux，与生产形态一致，顺带回答"云上跑 DSH + 自做工具"这个上云核心未知）／② 本机 Windows／③ 双跑互为对照）收窄为 **① 单跑**。理由：S0–S4 的判定标的全在 Linux 侧（`sandbox/` 判定环境 = Linux、生产形态 = Linux），S0 目的是"能力接入"而非跨 OS 兼容；**Windows 侧的差异数据不丢**——由下方「生产挂载落盘（Windows 方言修复件）」在同机复跑时天然覆盖，不另开对照跑。
  - 🔴 **时间窗**：CVM 有效期至 **2026-10-09**（09-09 为第 1 天，**今天第 3 天**）→ 到期前须把产出搬回本地/入库，**机器上任何产出不得是唯一副本**（`dsh-cloud-deployment.md` §1 行事规则）。
  - ⚠️ **开工第一卡点 = 模型凭据**：云文档无「key 已落该机」的记载 ⇒ 须定**用临时测试 Key（用完关闭）还是正式 key 配到那台机器**（Tier0 红线 1：key 内容不进对话/日志）。
- [ ] ⬜ **首验：跨进程 resume 的 id collision 定性**（两说未收敛）→ 与 S0 **可并行、不阻塞**（派 Trae 或 Claude 均可，WB 倾向 Trae：他此前判"改 UUID 后成功"，让他自己验证自己的判据）

- [ ] `compaction/` 接入（替代 `max_input_tokens` 截断）→ 2.9.2
- [ ] `sandbox/` 接入（替代 IP/目录/SSRF 单一拦截）→ 2.7.1（Linux 侧）
- [ ] `interaction/` 接入（新增高危工具审批流）→ 2.7.1
- [ ] `session/` 接入（升级 trajectory）→ 2.8.2
- [ ] **S0–S4 最小可验证切片**（定义与勾对子项见文档 §3.6）：S0 一条消息完整生命周期 → S1 +interaction 审批 → S2 +compaction → S3 +sandbox 三档 → S4 +记忆最小闭环（**B 段 Gateway 能否起 HTTP 已于 2026-09-10 实测判定：不成立** → B 段定死走 SDK，详见 `docs/dsh/dsh-migration.md`「B 段 Gateway 路线实测判定」）
- [ ] **生产挂载落盘（Windows 方言修复件）**：把 `harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` 的两段写进 `sdk`／`larry`／`web` 三个 profile 的 `cordis.patch.yml`，并带**一次真 end-to-end**（模型触发被拒命令 → 看到 `[sandbox: file access denied]`）。范式 / 自检口径 / 已证未证边界见 `dsh-local-env.md` §4.3（**原 DSH-2.5 ③ 收口欠账 1**，老大 2026-09-11 拍定并入本阶段）
  - ⚠️ **本机有两个 dsh home**（2026-09-11 实测）：工程 home `.dsh-home/` 仅 `larry`／`sdk`（**无 web**），`~/.dsh/` 才有三个 —— **落盘目标与「web 是否补建」待老大定**（勿默认三 profile 都存在；两处 `cordis.patch.yml` 现状见 `dsh-local-env.md` §4.3）
- [ ] **A 段自定协议设计（通信面定型派生）**：前端 ↔ 自做云端服务 —— **流式转发 / 会话管理 / 鉴权 / 多端同步 / 重连补帧全部自实现**（中转方案主要成本项；官方 Gateway 白送的恰是这部分）。**DSH-2 段「新增派生工作项」的同名条目已并此，勿双处维护**
- [ ] **【退出信号 · 主观】老大本人对 DSH 调试体验的可接受度确认**（S0 跑通后）：alpha 框架 + Cordis 插件总线内部状态不透明 + 跨进程 source map，出 bug 时定位难度阶梯式跳升——不可量化但真实的 go/no-go 信号。文档 §3.7

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

- [ ] **插件生态借鉴清单**（§3.3 降级 3 项）：Memory 分类 149 个中筛 3–5 个候选（重点 `dsh-memory-connect` / `dsh-auto-memory` / `dsh-project-memory` / ReMe），产出**可借鉴点清单**（schema / 检索融合 / 时间上下文建模 / 信任模型 / 已知陷阱），**不是"选哪个装"**；评估维度 = 设计可参考性 + 代码可读性 + 语义贴合度 + fork 改造量
- [ ] **借鉴调研的取样原则**：面对数千插件，产出「设计差异表」+「对方如何验证该设计」列 + 「改造后需补哪些测试」清单；目标是提炼可复用设计模式，不是给单个插件下价值判断
- [ ] **借鉴 / fork 代码纳入规范**：进库位置（独立 `vendor/` or 按能力模块落地）、upstream 出处与 license 标注格式、改造后须过本项目测试与命名规范、与自研代码的边界标识
- [ ] **upstream 追踪与 CVE 响应流程**（不直装 = 失去上游自动补丁通道）：CVE 如何得知 → 如何评估是否 backport → **上游弃坑但 CVE 未修时如何自补**
- [ ] **§3.0 是否升格为项目级原则**（写入 `docs/ai-governance.md`）
- [ ] **来源标注体系（🟢/🟡/🔴）是否升格**：任何 AI 对外部项目做事实断言须标证据等级，🔴 不入结论区
- [ ] DSH 搜索 / 抓取能力归属（`web/` 替换 Brave 证据不足）
- [ ] `webhook/` 包核实（config-catalog 无条目 vs 主仓搜索命中，两源冲突）

### 待派发

- [ ] **DSH-3 prototype 派发**：Trae / Claude 分工与节奏
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
