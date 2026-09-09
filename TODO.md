# LarryAgent TODO
> **TODO 治理约定**（2026-08-17 定稿）
> - 本文件为**活跃 TODO**：只含当前待办（能力增强 / 长期迭代）+ 工程债务 + 部分远期计划。已完成部分见 `archive/roadmap-history.md`。
> - **一致性不变量**：✅ 阶段内不得含 [ ]；含 [ ] 即误归档，须移出至 backlog 或对应未来阶段。
> - 加载方式：软性机制——AI 任务相关时主动 Read 本文件，不自动注入。
> - 检索归档：需要时 Grep `archive/roadmap-history.md`；排查 BUG / 做改动前先扫归档。

## 当前待办

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

- [ ] **前端集成层测试**：会话切换加载 / 角色切换传参的集成测试（mock RouterView + store 联动）。逻辑层已由 Claude 覆盖（P4.4 测试 31/31 绿），集成层待补；原规格"引入新逻辑层时一并补，或 WB 明确要求再做"。P4 完结时不阻塞（功能闭环已达成），归此待补
- [ ] **存量测试债务是否修复**：`test_chromadb_degradation.py`（mock 了已不存在的 archiver.get_db）、`test_shell_tool.py::test_windows_dir`（中文 Windows 编码断言）。选项 A：修复恢复"全套绿"基线；选项 B：维持"相关测试 + 已知项甄别"现状。当前规则以 B 运转（见 CLAUDE.md/TRAE.md 测试环境段）。此事不是很急，找个合适的机会讨论一下
- [ ] **边界侵蚀（工具/对话消息分离）**：`tool_calls` / `tool_call_id` 不再写入 `messages` 表，工具消息与对话消息分离（数据模型整洁）

### 其他长期增强（待触发）

- [ ] chat_service token 累计上限（单次对话 tool call 总 token 阈值）：防止单轮读大文件等场景暴增，当前仅轮次限制。优先级很低，不做主动处理；若后续出现相关问题再讨论完善，不静默自动处理。

## DSH 迁移（A-framework · 已定稿，DSH-2 进行中）

> **分区约定（2026-09-08）**：**本区只放待办**。判定依据、行事规则、31 子项承接总表、风险清单一律留在 `docs/dsh/dsh-migration.md`（下文每条标注出处），本区不重复结论。
> - **编号**：DSH 线用独立 `DSH-N` 序列，与 P0–P4 主线无关；**完成一个即归档一个**——**DSH-1 事实校准已完成**，全文冷存于 `archive/roadmap-history.md`，本区自 **DSH-2** 起。
> - **DSH-2 进行中**：2.0 ✅（A 案成立）／2.1 ✅／2.2 ✅（**路线级短路点已过**）／2.3 已派发 Trae（2026-09-09）／2.4–2.6 待派。
> - ⚠️ **启动后本区将取代上方「当前待办」中的多数条目**——A-framework 是全量 TS 化，后端 / 前端 / 测试资产均会重写。此消长关系未定案，待DSH-2 收口时一并处理。

### DSH-2 · 代码形态 + 环境准备

> **目标**：在锁定版上建起可挂载的 TS 工程，并实测 5 项关键可行性。
> **基线**：`dsh-v0.1.2-rc.1`——本阶段所有结论须显式标注基线；源码查阅走 `ref/dsh-bare`（**只读**）。
> ⚠️ **这是最后一次便宜的回头机会**：本阶段成本仅「环境 + hello world」，DSH-3 起真重写 8830 行后回头代价陡增。值得花时间，不要催。

**DSH-2.0 - 代码存在形态判定** ✅

- [x] **A 案成立** —— 独立仓库 + 构建 Cordis bundle 挂载，**不 fork**。8 项必需能力全部可经公开挂载面获得，无一项需改上游。架构根因 = DSH 核心能力层是 Service Definition / Provider / Consumer 三分架构。报告 `docs/dsh/dsh-form-probe-claude.md`；🟢 WB 本地复核（机制 8/8 属实，行号 2 处偏差）。**结论已折入文档 §3.6，本区不重复**
- [x] 附带确认：~~`patchReload: startup` → 部署期配置变更需重启~~ **⚠️ 已由 DSH-2.1 实测推翻**：我们采用的 `larry` profile（dsh-base + dsh-headless）manifest 为 **`patchReload: live`** 🟢 → **配置热重载默认已开，不用 hmr 插件、不必按"改配置必重启"规划**。第 0 项判的 `startup` 出自 sdk-app bundle，不适用我们（决策稿 §3.6 已同步）

**DSH-2.1 - 配套 TS 工程**（已派发 Trae 2026-09-09）

- [x] pnpm workspace + tsconfig 搭建（**安装期需 Node + pnpm**——第 0 项实测 B1 通道硬发现，仅运行期免 Node）
- [x] 首个自做 Cordis 插件骨架（`export const inject = [...]` + `apply(ctx)`，范式见 `packages/fs/tool-fs/src/index.ts:22`）
- [x] 构建产物为可挂载 bundle，经 B1 通道挂进 DSH 并**验证挂载成功**
- [x] **工程目录 / 仓库位置 / 包名前缀定案**，并明确与现有 `client/` 的关系

**DSH-2.2 - 跑通官方 demo**（已派发 Trae 2026-09-09，作为短路点先做）

- [x] 按官方 demo 走通一次完整会话，确认环境可用
- [x] ⚠️ ~~**避坑**：Windows 下官方 `dsh.exe` segfault → 走编程入口不依赖 CLI~~ **⚠️ 该避坑已推翻（DSH-2.2 反证）**：npm 全局 `dsh@0.1.2-rc.1` 在 Windows **全部可用**（plugin add / --dump-config / --help / 完整会话均 exit 0）。**卡住的只有源码入口（`bin.ts` + tsx）在 PowerShell 下偶发**。→ **默认走 npm 全局 `dsh`，不用源码 tsx 入口**（决策稿 §3.4 已同步）
- [x] 记录本机 Node / pnpm 版本与踩坑，作为后续复现基线

**DSH-2.3 - Vue/Tauri → DSH 连通 hello world** ✅（2026-09-09 交付 + 老大 GUI 一手点验）

- [x] 现有 Vue/Tauri 客户端经 sdk profile（stdio JSON-RPC + 官方 TS SDK）发消息并收到真实回包
- [x] ⚠️ **交付通道前提**：无交付通道的跑通不算数（DSH-3 退出条件同此口径）
- [x] 退出条件 ④ 与本项同源——本项跑通即 ④ 达成，不重复验收
- [x] 报告 `docs/dsh/dsh-23-vue-tauri-connect-trae.md`
- [x] ⭐ **能力边界结论（= 通信面定型输入）**：**上行事件面宽（19 类）/ 下行方法面窄**（`initialize` · `session.prompt` · `shutdown`）—— 记忆双写 / 流式 UI / 会话标题**可行**；会话树浏览 / 子代理管理 / 配置读写**不可行**

> **过程记录已闭环，此处不留副本**：WB 独立复现（含真实 LLM 回包）／「initialize 恒超时」根因（WB 的 PowerShell 工具无 ConPTY → 一律用 Git Bash）／残留锁「路径敏感」结论与行事规则 —— **均收口于决策稿 §3.6**。

**⭐ 通信面定型（DSH-2.3 产出 · 🟢 已定案 2026-09-09 · DSH-3 直接输入）**

> **完整分析见决策稿 §3.6「定型结论：自做服务中转」**；本节只留**待办与待验**，结论不重复。**老大原话：两方案各有利弊、很难判定，先按此推进** → **非终局，决策稿附三条重估触发线（T1/T2/T3），命中即回头。**

- [x] **前提① 已拍：经自做云端服务中转** → 链路切三段：**A** 前端↔自做服务（**自定协议，与 DSH 无关**）/ **B** 服务↔DSH host（**同机**）/ **C** DSH⇢C 侧本地工具反向驱动（**自做**）
- [x] **前提② 已拍**：C 段反向工具执行由我们自做，接受其不属于任何官方面（**在中转架构下反而变简单**——指令走"我们的服务↔C 侧"，**不经 DSH**）
- [ ] **⚠️ B 段选型未锁（新子决策，勿默认 sdk）**：中转**不等于**能力降级——B 段同机，sdk 与 Gateway **都可用**
  - **sdk 路线**：多会话 = 多子进程（单人低频可接受）；**无会话树/历史分页/fork**；`resume id collision` 未收敛是隐患
  - **Gateway 路线（WB 倾向）**：单进程多会话 + 官方会话树 / fork / cancel / 历史分页 / **重连追赶 + gap 修复 + 2s 心跳**——**这些恰是中转下我们本要自做的部分**
  - ⚠️ **待验**：Gateway 在 **`larry`（headless）profile** 下能否起 HTTP（已实测 8123 / 401 属 **web profile**，**不可跨 profile 外推**）→ **并入 DSH-3 S0 切片实测**
- [ ] **新增派生工作项（A 段，属 DSH-3 输入）**：**自定协议设计**——流式转发 / 会话管理 / 鉴权 / 多端同步 / 重连补帧**全部自实现**。**这是中转方案的主要成本项**，官方 Gateway 白送的恰是这部分
- [ ] **T2 触发线相关待验（低优先级）**：官方 web surface 经**反向代理**对外是否可行（`--trusted-host` 白名单为唯一已知障碍，未实测）
- [x] ~~web surface 开箱实测 ①②③~~ **价值随定型下调**（我们不承载官方 shell）；**官方 UI 组件仍可复用**——41 个 `dsh-client-*` 包可 `pnpm add`（exports 含 `./src/*`，源码随包分发）→ 自做前端 = **用官方组件拼**，非从零写

**DSH-2.4 - 测试隔离基建（返工完成 `fb30d77` · WB 复验 5/5 通过 · 遗留 1 项见下）**

> **WB 复验结论（2026-09-09 独立实跑，未采信声明）**：① `pnpm test:isolated:sentinel` → **fail**，且失败原因正是白名单 throw；② `pnpm test:isolated` → **绿**；③ **R1 反向哨兵**：人为写 key 明文 → teardown **确实告警**（输出 `KEY RESIDUE` + `creds.txt` 路径）；④ **R2 反向哨兵**：`delete DSH_HOME` → **fail**（解析为 cwd 不在 tmpdir 下）；⑤ 真实库零触碰（`.dsh-home` mtime 停在 10:31、`larry.db` 停在 08-30）。
> **关键判据（可复用）**：首版是「**结论对、机制不存在**」——结论（真实库无残留）成立，但自检挂在 `process.on('exit')`，该钩子在 Vitest worker 下**不触发**（即便触发也是先删后扫）。→ **护栏类验收必须加反向哨兵：人为制造违规、看是否报警**，只查"结果达标"会放过从未运行的护栏。
> 报告 `exchange/dsh-24-vitest-isolation-claude.md`（结论段已由 WB 补「首版缺陷勿回退」）。

- [x] Vitest **临时库隔离**（实测通过：临时 DSH_HOME + beforeEach 全局断言）
- [x] **fail-fast 哨兵测试**（实测通过：故意指回真实库 → fail，且由 `assertIsolated` throw 触发）
- [x] **先查清隔离对象**：迁移后真实数据落在哪（现有 `backend/data/larry.db`；DSH 侧在 `.dsh-home/`），可能不止一处
  - 🟢 **WB 已实测落点（2026-09-09）**：未设 `DSH_HOME` 时数据落在**仓库根 `.dsh-home/`**（已 gitignore），下有 `sessions/` `storages/` `profiles/` `.anonymous-user-id`；`sessions/` **按 cwd 分子目录**。从 `harness/` 子目录跑时写入仓库根那份（**向上查找**）
  - ✅ **"向上查找"机制未确认已不再阻塞**：R2 改用**正向白名单**（必须位于 `tmpdir()` 之下）后，守卫**不依赖**该机制的成立与否——无论 dsh 向上查找到哪，只要解析结果不在临时根下就拦。**这是白名单相对黑名单的额外收益：把未确认行为从依赖项里摘掉了。**（若日后仍需该机制的事实答案，另立项）
- [x] 🔴 **复验发现 1 — key 残留扫描是死代码 → 已修**：`scanForKeys` 迁入 `global-setup.ts` 主进程 teardown，**先扫后删**（顺序写死并注释"勿调回"）。原位置 `process.on('exit')` 在 worker 下不触发，已移除
- [x] 🟡 **复验发现 2 — 守卫盲区 `DSH_HOME` unset → 已修**：断言由精确相等改为**正向白名单** `resolve(DSH_HOME).startsWith(tmpdir())`，一次覆盖「等于真实库 / 位于库内 / unset 落 cwd」三种漏法
- [x] 🟡 **复验发现 3 — 声明过度 → 已修**：注释改为「`backend/data/larry.db` 待 DSH-4 接入时补断言」，并注明「勿将"均已覆盖"当已实现」
- [x] 对照 DSH 四层测试体系设计——测试资产已定稿为**重建**，不是翻译；参照物 = `backend/tests/conftest.py` 的七条设计原则（平移原则不平移代码）。**已完成七原则平移对照表**（见 Claude 报告 §3；P1/P2/P5/P7 有程序化实现，P6 即 R1 已修，P3/P4 本阶段无对应路径）
- [ ] `--real-api` 占位符机制的等价物（默认跳过真实 API 用例；开启才注入 key，且该模式残留含 key 明文）——**本阶段未做**，DSH-3 引入真实 API 用例前须补
- [ ] ⚠️ **不提前设计 = DSH-3 起每步验证都裸奔**（文档 §3.6 硬要求：本阶段设计到位）

**DSH-2.5 - 退出条件实测（5 项，任一不过 → DSH-3 收益表重估、C 路径回退进入议程）**

- [ ] **前置：准备 Linux 验证环境（WSL2）** —— **派发稿已写：`exchange/log-other.md`（2026-09-09，执行人 = 老大 / 或点将编外 AI）**，含硬要求 + 自检清单 + 已知坑。S 侧生产在 Linux，① 的 SQLite 文件锁 / WAL / 并发行为与 Windows 有差异，须在 Linux 上取数。⚠️ **用途仅为验证，不是生产环境**（生产环境属 DSH-5 上云）。若 WSL2 不足以复现目标行为，再上 CVM
  - ⚠️ **两条硬要求（不满足则数据无效）**：① 必须 **WSL2**（非 WSL1，无真内核→锁语义不同）；② 验证**必须跑在 ext4**，**绝对不能放 `/mnt/c/`**（drvfs/9P 的 POSIX 文件锁与 WAL 行为与 ext4 不一致，在它上面测并发 = 结论作废）
  - **验收是行为验收不是版本验收**：`df -T .` 须为 ext4 + **SQLite 并发写 200 次无 `database is locked` 且计数正确**——两条任一不过，环境不合格
  - 已知坑：WSL2 休眠后**时钟漂移会污染 mtime 类验证**（先 `date` 对表）；SQLite **CLI 版本 ≠ Node 内嵌版本**，下结论以内嵌版为准
- [ ] ① `storage/` 外接 SQLite 可行性（**须在 Linux 环境取数**，见前置）
- [ ] ② `acp/` 契约稳定性
- [ ] ③ **Windows 端 `ctx.sandbox` provider 可用性**（2.10.2 端侧执行器前提；后端已确认存在 = restricted token + `sandbox-windows-acl/`，且 fail-closed——无 runner 时报 `SANDBOX_UNAVAILABLE`、不静默裸跑。待验**实际生效性**与提权流程）
- [ ] ④ Vue/Tauri → sdk profile 连通（同 DSH-2.3）
- [ ] ⑤ **TS 跑通 bge-small-zh 本地 embedding，与 Python 侧同文本向量漂移比对**（决定是否需要全量重嵌，影响 DSH-4 记忆迁移工作量）

**DSH-2.6 - 阶段收口复核**

- [ ] DSH-2 全部完成后，用当时**最新 rc** 做一轮复核（锁定版是否过期、有无影响本阶段结论的变更）。**老大定：不与上游 alpha 节奏绑死，按我们的阶段节拍走**
- [ ] 重跑 DSH-2.0 的形态测绘（纯测绘、成本低）——**不要中途换版本继续**，否则结论混在两个基线上没法用

### DSH-3 · 核心能力 prototype

- [ ] `compaction/` 接入（替代 `max_input_tokens` 截断）→ 2.9.2
- [ ] `sandbox/` 接入（替代 IP/目录/SSRF 单一拦截）→ 2.7.1（Linux 侧）
- [ ] `interaction/` 接入（新增高危工具审批流）→ 2.7.1
- [ ] `session/` 接入（升级 trajectory）→ 2.8.2
- [ ] **S0–S4 最小可验证切片**（定义与勾对子项见文档 §3.6）：S0 一条消息完整生命周期 → S1 +interaction 审批 → S2 +compaction → S3 +sandbox 三档 → S4 +记忆最小闭环（**S0 另需验 B 段：Gateway 在 `larry` profile 下能否起 HTTP**，见上方通信面定型区块）
- [ ] **A 段自定协议设计（通信面定型派生）**：前端 ↔ 自做云端服务 —— **流式转发 / 会话管理 / 鉴权 / 多端同步 / 重连补帧全部自实现**（中转方案主要成本项；官方 Gateway 白送的恰是这部分）
- [ ] **首验：跨进程 resume 的 id collision 定性**（Claude 判"可能是 SDK 缺口或姿势问题" vs Qoder/Trae 判"固定 ID 所致"，两说未收敛）→ 影响 2.4.1 / 2.8.2 的 fork / resume 承接叙事
- [ ] **【退出信号 · 主观】老大本人对 DSH 调试体验的可接受度确认**（S0 跑通后）：alpha 框架 + Cordis 插件总线内部状态不透明 + 跨进程 source map，出 bug 时定位难度阶梯式跳升——不可量化但真实的 go/no-go 信号。文档 §3.7

**退出条件**：核心链路（会话 + 记忆 + 工具）在 DSH 下达到 **P4 等价**（不是"四个包跑通"——无交付通道的跑通不算）。

### DSH-4 · 差异化能力迁移

- [ ] 长期记忆双写 + 人审（`memory/archiver.py` + `engine.py` → TS 插件挂 `session/` 事件流，保 SQLite+ChromaDB 双写）
- [ ] **记忆迁移（活资产，非数据搬运）**：全量重嵌（PyTorch/FP32 与 ONNX/q8 不保证逐维一致）+ 漂移比对 + 召回等价性抽样验收 + 语义字段不降级（`is_active` / `last_hit_at` / `source_role`，ChromaDB 只能重灌、机会只有一次）
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
- [ ] 验收五层：① 纯逻辑层翻译全绿 ② 关键路径 snapshot replay 覆盖 ③ 真实 API e2e 冒烟 ④ 数据迁移验证（双写 + 全量重嵌后召回抽样比对）⑤ Windows 端侧执行器验收
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
- [ ] **DSH-2 任务 0 派发**（代码存在形态判定）

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

> 原 P5（移动端 + 部署）已取消 P 编号，2026-08-20 拆分为「移动端开发」「部署调试试运行」两个普通阶段，列入上方「当前待办」区与记忆系统调优等并列。