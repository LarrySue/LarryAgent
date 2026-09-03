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

- [ ] **搜索服务归属标注（about 弹窗末行，待 provider 定案后再填）**：Brave 现款「$5/月信用」在**条款上**以公开归属为条件（官方要求标注于 project's website / about pages），但**执行上靠自觉**——LarryAgent 为本地桌面应用，Brave 无从核验，不标亦无自动扣费机制（老大 2026-09-04 点破：「他知道我标没标」）。落点现成：老大 2026-08-28 做的「关于」弹窗（`docs/ui-reference.md` §5.6 v5）末行，**未写死 Brave 名**——`exchange/web-search-design.md` 选型未定案、最终是否用 Brave 未定（老大 2026-09-04：真要加也就一行字、换选型也就改一个词，本地应用无实际影响）。优先级：**低**（待选型定案后顺手加一行）。
- [ ] chat_service token 累计上限（单次对话 tool call 总 token 阈值）：防止单轮读大文件等场景暴增，当前仅轮次限制。优先级很低，不做主动处理；若后续出现相关问题再讨论完善，不静默自动处理。

---

## 开发路线图

> 主线阶段 **P0–P4 已全部完成 ✅**，LarryAgent 进入「能力增强 / 长期迭代」新阶段。详细情况冷存于 `archive/roadmap-history.md`。

### 历史索引（已完成阶段，冷存于 `archive/roadmap-history.md`）

- **P0 - 最小聊天闭环** ✅（2026-08-07）→ 端到端聊天闭环。详见 `archive/roadmap-history.md`。
- **P1 - 记忆系统可用** ✅（2026-08-07）→ Embedding / ChromaDB / 长期记忆 / 归档 / 降级。详见 `archive/roadmap-history.md`。
- **P2 - 工具调用闭环** ✅（2026-08-11）→ FileOps / ShellTool / Function Calling / `/api/tools` / config。详见 `archive/roadmap-history.md`。
- **P3 - 流式 + 体验优化** ✅（2026-08-12~15）→ SSE / 重试 / Token / API Key 校验 / 异常类。详见 `archive/roadmap-history.md`。
- **P4 - PC 客户端可用** ✅（2026-08-15~19）→ Tauri 进程管理 / Vue 前端 / 界面基调 / 会话 API / 聊天界面 / 异常出口统一。详见 `archive/roadmap-history.md`。

> 原 P5（移动端 + 部署）已取消 P 编号，2026-08-20 拆分为「移动端开发」「部署调试试运行」两个普通阶段，列入上方「当前待办」区与记忆系统调优等并列。