# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）


## 2026-09-16 · 精简候选摸底（老大指令「跑一次精简候选摸底」）

**方法**：全仓 md 文件行数统计 + 关键文件头部状态核查 + 引用面扫描。聚焦 exchange/ 讨论稿（最易积压区）与 docs/ 大型文档。

### 高置信建议（4 项，按动作成本排序）

**S1. `exchange/deployment-architecture.md` (191 行) → archive/**
- 状态明确：「方案（待DSH迁移完成后重新制定）」，DSH-3 进行中，短期不会完
- 留在 exchange（活区）误导读者以为是活跃方案
- 建议动作：`git mv` 到 `archive/deployment-architecture-2026-09-03.md`，更新 exchange/README + 根 README :185 + TODO :290 引用

**S2. `exchange/capability-tree-revision.md` (250 行) — 7/8 已批但未执行**
- 老大 2026-09-15 已批 7/8 提案（仅 2.5.2 web_fetch 暂缓）
- grep `docs/product-positioning.md` 无引用 → 变更未落地
- 建议动作：拍板是让 WB 执行已批部分并归档/删除此稿，还是继续等待

**S3. `exchange/web-search-design.md` (394 行) — 17 天未展开讨论**
- 生成 2026-08-29，内容详尽（provider 对比/MCP 集成/延迟数据）
- exchange/README 标记「尚未展开讨论」
- 建议动作：确认是等待审阅还是已放弃？若放弃 → archive；若等待 → 标注状态

**S4. `exchange/discussion-time-context.md` (531 行) — 卡在看齐循环 13 天**
- 状态：「待各方对更新后的结论区表态『同意/有异议』」，自 2026-09-03
- 531 行详尽讨论，无 AI 签字确认
- 建议动作：推动签字并移入 docs/，或归档讨论、只提取结论到 docs/

### 中置信观察（2 项，仅备注）

- `docs/dsh/` 探针报告三份（claude/qoder/trae, ~525 行）：按设计拆分（不同 AI 视角），可保持现状，除非想统一视角
- `exchange/log-workbuddy.md` (155+ 行)：WB 活日志，按「不留痕」原则可清理，但 WB 自管

### 不建议动

- 三份环境文档（production/test/local-env，按设计对仗拆分）
- `archive/roadmap-history.md`（锁定区历史）
- AI 约束文件（.claude/.trae/.qoder，按角色拆分）
- exchange/logs（活日志，由老大按需清理）

**待老大裁决汇总**：S1（归档）→ S2（执行或继续等）→ S3/S4（状态澄清）→ S5/S6（备知）。

**老大结论（2026-09-16）**：都不是大问题，文档体系基本健康。四个候选项均为锦上添花级别，不急。

---

## 2026-09-17 · 能力树改动提案落位 · 可审清单（老大交办；**执行权在老大/WB，本清单只作参考**）

**对应**：2026-09-16 摸底 §S2（该项由此转出执行）。老大 2026-09-17 定：套用由 **WB** 做，本清单供其参考。
**对象**：`exchange/capability-tree-revision.md`（下称 **revision 稿**）—— 它是 `docs/dsh/dsh-015-capability-mapping.md` §6 那 8 条建议的「现状原文 → 建议改后」展开形态，老大已批 7 条、暂缓 1 条。
**性质提醒**：revision 稿**不是可并入的内容稿，而是一套「编辑指令集」**（逐条精确到 `product-positioning.md` 的行）。正确动作 = **套用编辑 + 退役草稿**；若按"合并"字面理解（两份内容并排放进 docs），会造出**双份"现状原文"**。

### 0. 三条前置结论（先看这个）

| # | 结论 |
|---|---|
| 1 | **锚点全部有效**：8 处「现状原文」的行号与文字**逐一复核仍在原位**（2026-09-17 实测）⇒ 可直接套用，无需重定位 |
| 2 | **原唯一硬卡点已闭合**：§2（2.7.2）原挂「须先实测」⇒ revision 稿 §11 记 **DSH-3.0.2 三项实测已过**（fail-closed 8/8；自定义 preset 在真实 profile 生效；`PresetSpec` 实只含 `sandbox` + `approval`）⇒ 前提消失 |
| 3 | **套用必须自下而上**：8 条都插在正文中间 ⇒ **从文档末尾往前改**，否则行号边改边漂。本条最易踩 |

### 1. ⚠️ 先处理依赖：草稿退役会造两处死链

`docs/dsh/dsh-015-capability-mapping.md`（**在 docs 区**）反向**承重引用** revision 稿：

| 位置 | 原文（节选） | 问题 |
|---|---|---|
| `:265` | 「本节 8 条已展开为「现状原文 → 建议改后」的可审形态 ⇒ **revision 稿**（`../../exchange/capability-tree-revision.md`）…**本表保留为索引**」 | 把 8 条的展开内容**委托**给活区草稿 ⇒ 草稿一退役即死链；且违反 docs 区「只引用稳定落点」 |
| `:189` | 「详见 `../../exchange/capability-tree-revision.md`（姊妹稿）§4」 | 同上 |

**建议改法**（取①更彻底）：
① 把 8 条结论**直接并入 mapping 稿 §6**（该节本就是「索引」，改成自足正文），两处路径引用一并去掉；
② 或保留委托但改指 `product-positioning.md` 对应条目（套用后正文即成唯一落点）。
**关键**：这两处必须与套用**同批**处理，不能先后分家。

### 2. 逐条编辑清单（8 条 + 2 处附带）

| 条 | 目标位置（`product-positioning.md`） | 动作 | 稿内成稿文本 | 备注 |
|---|---|---|---|---|
| 1(a) | §2.1「写实口径」块之后（原 `:44` 后） | 新增「对手侧状态口径」段（5+1 档表 + ⛔三条准入 + ⚪准出条件） | revision 稿 `:38-53` | ⚠️ 与现有「状态图例」（✅/🚧/📐/🗣️/🌱 = **我方**状态）是**两把正交的尺**，段内须写明以免混读 |
| 1(b) | 每条子项：**标题行之后、第一个字段块之前** | 加固定字段〈对手侧〉行 | 格式 `:63-64`；样例 `:57-61` | **31 条内容不在稿里** ⇒ 见本清单 §3 草案 |
| 1(c) | §2.2 顶层总览表（`:50-59`） | 加一列「对手侧最厚 / 最薄」 | `:66` | 🟡 **待老大定**（可选，不阻塞） |
| 2 | 2.7.2，原 `:250` 之后追加 | 追加两段（机制面由 DSH 承接 + 判据出处与覆盖边界 + 一条全树教训） | `:82-90` | 前提已闭合。⚠️ 务必保留「preset 只覆盖 sandbox+approval 两 knob；工具开关须另走 `ctx.tools.restrict()`、**端到端未验**」 |
| 3 | 2.3.3，原 `:95`「轻量判据」段**之前**插入 | 插入「上游已给数据模型」段 | `:106-110` | ⚠️ 原「轻量判据」段**保留**，但不再承担"为何自选目录级隔离"的论证；「⚪ 须实测后定」**原样保留** |
| 4 | 2.5.2，原 `:202` 之后追加 | **只加「观察点」，原文不动** | `:128-130` | 老大暂缓 ⇒ **不改范围边界**；连带：mapping 稿 §5.3 必关清单**不新增** `web_fetch` 条 |
| 5 | 2.3.5，原 `:117` 之后追加 | 追加「上游参照」段（catch-up 语义） | `:146-149` | —— |
| 6 | 2.9.2，原 `:326` **句末追加** | 追加一句（官方默认顺序即"遮蔽优先"） | `:161-163` | —— |
| 7a | 2.4.3，原 `:146` 之后追加 | 追加「架构前提」段（记忆本体不入 session log） | `:177-180` | ⚠️ 这是**写死防误判**段，建议照抄 |
| 7b | 2.7.6，原 `:279` 之后追加 | 追加「对手侧状态」段（单会话导出 ≠ 整体备份） | `:190-193` | —— |
| 8 | 2.10.1，原 `:344-346` 之后追加 | 追加「对手侧状态（**依据替换，结论不变**）」段 | `:206-211` | ⚠️ 原依据「DSH 无远程能力」**已失效**（0.1.5 已有单机远程完整实现），不换依据则下次复核会误判结论失效 |
| 9 | §2「写实口径」 | 追加两条全树教训 | `:217-218` | 建议与 1(a) 同批落 |
| 附 | §5 决策追溯（`:391+`） | 记档老大 `web_fetch` 判据原话 | `:23-26` | 该条是**行事规则**非结论，须留档（"上游有没有成熟挂载方式"≠"我们要不要做这个能力"） |

### 3. §1(b) 的 31 行〈对手侧〉草案

格式（取自 revision 稿 `:63-64`）：`**对手侧（DSH 0.1.5）**：<档位 emoji> <一句话状态> ｜ <我方剩余动作>`
原料 = `docs/dsh/dsh-015-capability-mapping.md` 逐条档位表（**31/31 覆盖**，🟢12 / 🟡15 / 🔴4 对得上）。**与映射稿冲突时以映射稿为准**（本草案只是转写、未加工）。

```
2.3.1  **对手侧（DSH 0.1.5）**：🟡 `session-title` + `workspace`（会话有序账户）+ `session-query`（跨语料列表/过滤/分页）+ `persistence` ｜ 回收站（软删 + 恢复）与批量归档自做——append-only 事件流语义下无对应
2.3.2  **对手侧（DSH 0.1.5）**：🟡 我方保留 Vue/Tauri ⇒ 官方 React 客户端不直接承接；`continuous-client-recovery`（恢复后 3s 警告 / 15s 中止的持续重连）等设计可借鉴 ｜ 流式 / 中断恢复 / 常驻 banner 自做（设计可抄）
2.3.3  **对手侧（DSH 0.1.5）**：🟡 `workspace` 即官方「会话↔目录」数据模型（稳定 id + 规范路径 + membership 规则）+ `scope` + `sandbox`/`permission-presets` ｜ 隔离语义自做——`workspace` root 原文明确「不是读边界」
2.3.4  **对手侧（DSH 0.1.5）**：🟡 `attachment`（内容寻址、图片与文件分存储）+ `client/file-upload`（015 新增：非图片不限类型/大小、byte-for-byte 存） ｜ 上限 + GC + 2.4.6 升级通道自做——上游原文「attachments are never deleted」
2.3.5  **对手侧（DSH 0.1.5）**：🟡 `schedule`（catch-up 只补最近一次、不枚举不重放；不打断当前回合；at-least-once）+ `webhook` + `jobs` ｜ 触达通道自做——上游明言「no external notification channel or cold-session scheduler exists」
2.4.1  **对手侧（DSH 0.1.5）**：🟢 `session`（append-only log 为唯一真相源，message history 是 derived）+ `compaction` 取代截断 ｜ 配置阈值 / 验收
2.4.2  **对手侧（DSH 0.1.5）**：🟡 `storage` domain form（`defineDomain` / `KvTable` / `domain/changed`；已实测可外接任意绝对路径 ✅） ｜ 向量召回 + 语义层（人审 / 矛盾检测 / 保鲜）自做——`storage` 只有 KV，无向量无 FTS
2.4.3  **对手侧（DSH 0.1.5）**：🔴 产品语义已裁定（硬删、不建回收站），DSH 无对应 ｜ 全部自做
2.4.4  **对手侧（DSH 0.1.5）**：🟡（**仅设计**）`session-query` 的 fold 语义（`current`/`shadowed`/`log-only`）+ proposed `Recallable compaction` 可作设计参照 ｜ 全部实现（设计可借鉴）
2.4.5  **对手侧（DSH 0.1.5）**：🔴 `identity/` 自我描述 = anonymous（"without identifying the user"） ｜ 全部自做
2.4.6  **对手侧（DSH 0.1.5）**：🟡 `storage`（KV 底座可挂）+ `session-query`（FTS 索引生命周期 / cursor 分页 / filter 代数可参照） ｜ 混合检索 / 元数据 schema / 引用体系自做；底座可复用
2.5.1  **对手侧（DSH 0.1.5）**：🟢 `llm` seam + providers（`llm-deepseek` / `llm-pi-ai` 等）+ `llm-retry` ｜ 配置。⚠️ `llm` 组 52 条欠账 ⇒ 承接但在演化
2.5.2  **对手侧（DSH 0.1.5）**：🟢 `tools` 管道 + `shell`/`fs`/`subprocess` seam；`web` seam 含 search 与 fetch（`web-fetch-http` 内建 SSRF 防护与逐跳封顶） ｜ 工具插件本体。⚠️ 本条**范围重估已暂缓**，只记档位，不在产品定位层预判
2.5.3  **对手侧（DSH 0.1.5）**：🟢 `mcp-client` + `extensions`（版本化 Cordis 包）+ `self-modification/` ｜ 配置。⚠️ MCP 只消费 tools（上游原文：resources / prompts 无 DSH 消费方）
2.6.1  **对手侧（DSH 0.1.5）**：🟢 `preset/`（agent-presets + persona，`inject = ['systemPrompt']`，公开面可达） ｜ cordis.yml 承接 config 角色。⚠️ 0.1.5 persona 前后缀拆分属**破坏性变更**，旧配置须适配
2.6.2  **对手侧（DSH 0.1.5）**：🔴 无路由子系统（53 篇子系统页无对应）；`scope` 只提供 per-agent 可见性载体 ｜ 全部自做（含「意图 → 角色 + 上下文源 + 工具集」的联合路由）
2.7.1  **对手侧（DSH 0.1.5）**：🟢 `sandbox`（bwrap/Landlock/Seatbelt/Windows restricted token；`sandbox-local` **fail-closed**，无 runner 报 `SANDBOX_UNAVAILABLE`，命令绝不静默裸跑）+ `permission-presets` 三档 ｜ 策略内容。⚠️ 上限：同世界隔离，不防恶意代码
2.7.2  **对手侧（DSH 0.1.5）**：🟢 **（改判）** `approval`（closed + fail-closed：缺失 / 非属主 / 抛错 / 不合规一律 `unavailable`，**不打开闸门**；`asked`·`decided` 审计对）+ `permission-presets`（表可配置）+ `user-questions`（可中继到已连接客户端） ｜ 只剩策略内容；可先用官方两档 preset **零代码**起步
2.7.3  **对手侧（DSH 0.1.5）**：🟢 `credentials`：reference 化（settings / cordis.yml 只存环境变量名）、四层 source、每次操作重解析（热轮换）、`describe()` 无可承载值的槽位、空值即 absent ｜ 配置。⚠️ 红字风险见 mapping 稿 §5.1
2.7.4  **对手侧（DSH 0.1.5）**：🟡 `token-meter`（detached replay 快照 + 逐节点定价 `TokenSurfaceNode`，按 route 声明定价） ｜ 累计入库 + 预算 / 告警自做——上游**无预算 / 限额 / 累计**（是"当前请求压力"快照）
2.7.5  **对手侧（DSH 0.1.5）**：🟡 `util/http-proxy`（015 新增：entry mount 之前装 global dispatcher，覆盖 9 个调用点及未来全部）+ `session-telemetry`（redaction；**仅显式反馈事件才授权上传**） ｜ 出境事实不变，处置口径仍归用户。⚠️ `api/gateway` 转发事件不脱敏、重连不重放
2.7.6  **对手侧（DSH 0.1.5）**：🟡 `SessionPersistence.export(id)` → raw artifact + apiproxy ZIP 下载（区分 `501` 后端不支持 / `404` 会话不存在） ｜ 整体备份 / 导出 / 迁移自做。⚠️ 别把"DSH 有导出"读成"DSH 有备份"
2.8.1  **对手侧（DSH 0.1.5）**：🟡 `session-projection`（把 log 派生状态整体当前值送 client）+ `client-resources`（`dsh-resource://`）+ `sidebar-right` ｜ 展示机制可承接；**记忆来源**（我方库）与其 schema 自做
2.8.2  **对手侧（DSH 0.1.5）**：🟢 `session-query`（跨会话全文检索 + 事件关系追溯 `replacedBy`/`replacementChain`/`sourceEventSeqs` + 会话家谱 `SessionLineageTrace`）+ `session-projection` + `feedback` ｜ 渲染层。✅ **维持且增强**——关系追溯原先是空白
2.8.3  **对手侧（DSH 0.1.5）**：🟡 同 2.7.4（`token-meter`） ｜ 用户侧展示 + 入库自做（需先建表 + 回填）
2.9.1  **对手侧（DSH 0.1.5）**：🔴 无时间感知子系统。可借只有 `schedule` 的时区纪律（必须显式给 offset / `time_zone`，绝不读浏览器 / 会话 / 进程 / 模型上下文；DST gap 拒绝、overlap 取较早）+ 笔记 `environment-prompt-suffix` ｜ 全部实现；上述两条应作为**设计约束**抄进本条
2.9.2  **对手侧（DSH 0.1.5）**：🟢 `compaction` seam + `compaction-tool-result-pruner`——官方默认在「range selection **之前**」调它 ⇒ 本条「①工具结果遮蔽 = 最划算第一步」**正好就是官方默认顺序** ｜ 阈值 / 保留尾部策略（可配）。⚠️ 保真度档位不达标则自做策略插件
2.9.3  **对手侧（DSH 0.1.5）**：🟢 `guard/`（loop-hygiene + tool-timeout）+ `llm-retry` + `subprocess-native-containment`（逃逸子孙进程 containment） ｜ `LarryException` 统一出口自做
2.10.1 **对手侧（DSH 0.1.5）**：🟡 出厂 = 本机 loopback 客户端（cookie 未标 `Secure`、无登出）；**但远程形态已有完整实现**（`workspace-files-service` 原文 "from a browser that may not be on the Host machine" + `/api/file` 认证路由 + 持续重连 + Electron 壳走 `dsh-app://`）+ `web-server` / `api-gateway` / `client-connection` / `api-remotes` ｜ 云侧部署 + **多用户 / 租户语义**自做——`identity` 仍 anonymous
2.10.2 **对手侧（DSH 0.1.5）**：🟡 capability seam 模型（Service Definition + Provider）天然支持「同一能力、不同位置、不同 provider」；已有先例（`sandbox-local` 三平台后端、`subagent` 多 provider、`e2b/` 云沙箱） ｜ 端侧执行器本体 + shell 鉴权重构（IP 白名单 → API Key）；架构路径已由上游证明可行
2.10.3 **对手侧（DSH 0.1.5）**：🟢 `identity` = anonymous（无用户维度）⇒ 与「单人」同向 ｜ 形态事实，无需动作
```

**档位分布自检**：🟢 12（2.4.1 / 2.5.1–2.5.3 / 2.6.1 / 2.7.1–2.7.3 / 2.8.2 / 2.9.2 / 2.9.3 / 2.10.3）｜ 🟡 15 ｜ 🔴 4（2.4.3 / 2.4.5 / 2.6.2 / 2.9.1）—— 与映射稿总数一致。

### 4. 未决项（4 条，**不阻塞**套用）

| 项 | 处置 |
|---|---|
| 2.3.3 的 ⚪（`workspace` 运行时行为未跑） | 改后文本里「⚪ 须实测后定」**原样带入**，不升格为 🟢 |
| 2.7.2 余项（工具开关 `restrict()` 端到端未验） | 同上，原样带入 |
| §1(c) 顶层总览表是否加列 | **待老大**（形态选择，可后补） |
| ⛔ 须关闭清单是否单列一张 | **待老大**（稿建议单列，挂 `dsh-migration.md` §3.6） |

### 5. 退役与落点

套用完成后 revision 稿即零残留 ⇒ 建议**直接删除**（活区新规：已闭环的直接删除、不留指针、不留底；git 存底）。⚠️ **删前**须确认三件已有落点：
- §9 两条全树教训 → `product-positioning.md` §2 写实口径（§2 表「9」行）
- §0 老大 `web_fetch` 判据原话 → §5 决策追溯（§2 表「附」行）
- §10 未决清单 → `TODO.md`（本清单 §4 四行）
另：`exchange/README.md:25` 的草稿索引条目须**同批删除**。

**本清单自身**：WB 套用完成后即可删除本段（活日志规矩）。
