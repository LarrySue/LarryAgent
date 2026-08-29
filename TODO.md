# LarryAgent TODO
> **TODO 治理约定**（2026-08-17 定稿）
> - 本文件为**活跃 TODO**：只含当前待办（能力增强 / 长期迭代）+ 工程债务 + 部分远期计划。已完成主线阶段（P0–P4）见 `archive/roadmap-history.md`。
> - **一致性不变量**：✅ 阶段内不得含 [ ]；含 [ ] 即误归档，须移出至 backlog 或对应未来阶段。
> - 加载方式：软性机制——AI 任务相关时主动 Read 本文件，不自动注入。
> - 检索归档：需要时 Grep `archive/roadmap-history.md`；排查 BUG / 做改动前先扫归档（精细索引见 WORKBUDDY.md）。
> AI 交流讨论区已迁移至 `exchange/` 目录（该目录规则参照 `exchange/README.md` ）。
> 人类治理区迁移至`HUMAN.md`和`HUMAN_NOTE.md`两个文件，前者偏约束和提示，后者偏零散记录。

## 当前待办

### 网络搜索能力 ✅（实现 Trae CN / 测试 Claude Code / WorkBuddy 逻辑层复验通过，2026-08-20）

> 实现：Trae CN ｜ 测试：Claude Code ｜ WB 复验：读代码 + 42 项测试绿（本人亲跑）+ 前端零改动 + Tier0 key 不落日志

- [x] **web_search Tool（Brave 免费层，provider 可插拔）**：对话内 AI 自主发起搜索，实时性问题自动搜并整合，回答标注来源 URL；首版数据源用 Brave 免费层（2000 次/月，需 key），provider 封装可插拔，后续按需替换为 SearXNG（VPS 自托管）
- [x] **Tool 框架底座（与 web_search 同步夯实地基）**：BaseTool 护栏基类统一超时强制 + 错误归一(ToolError) + 执行日志；"访问外部/本地资源"类叠加 SSRF/caller 校验钩子；配置驱动启用（config.yaml 列启用 Tool + 各自参数）；第三方挂载契约先留接口
- [x] **安全边界**：目标 URL 内网拦截（SSRF，防 169.254.169.254/10.x/192.168.x/localhost）+ 硬性超时，不阻塞 SSE 流
- [x] **降级策略**：搜索失败/限流 → 指数退避后仍失败 → 降级为正常回答并提示"未能联网核实"，不报错不中断
- [x] **前端展示**：复用 P4.4 ToolCallCard 展示搜索过程与来源（工具调用可见性价值）
- [x] **验收方向**：实时性问题→自动搜→带来源标注；失败→降级不中断；抓取超时/内网 URL 被拦截（均由测试覆盖验证）
- [ ] **真机端到端验收（待老大收尾）**：WB 不碰真实 key（Tier0 红线）且需 GUI 环境，此步只能由老大做——填 `config.yaml` 的 `search.brave_api_key` 真实 Brave key → 启动 LarryAgent → 聊实时问题看来源标注 → 测降级（错 key/断网出现"未能联网核实"且不崩）。逻辑层已全收口，此步为端到端收尾。
- 注：首版**不做 web_fetch 正文抓取**（代价高：SSRF/反爬/内容清洗/阻塞风险，复杂度高一个量级）；SearXNG 待 VPS 部署后替换 Brave

### 归档系统：会话归档 + 记忆归档 两层合一 ✅（2026-08-27 闭环，冷存见 `archive/roadmap-history.md`）

- [x] 已实现并复验闭环：WB 设计 / Trae 实现（`43213e3`）/ Claude 测试（`2db9130`）/ WB 复验（`ffa3683`）/ P3.5 语义修复（`50ed895`）；派发稿 `exchange/log-trae.md`、测试 `exchange/log-claude.md`、复验 `exchange/log-workbuddy.md`

### 测试层完善（老大 2026-08-30 拍板：环境修复 + 集成层恢复 合并派发 Claude）

> 派发规格见 `exchange/log-claude.md`「集成测试层恢复 + 测试环境修复（合并派发）」。细节由 Claude 定。

- [ ] **合并任务（Claude 执行）**：① 修复 pytest 9.1.1 ↔ pytest-asyncio 1.4.0 不兼容（插件未被加载）② 恢复 `test_integration_llm.py` 3 用例并改 assert/raise 去假绿 ③ `--real-api` marker + conftest 开关（默认跳过，防误烧 key）④ 分层原则 + mock 覆盖清单写入 `.claude/CLAUDE.md`（不占 TODO）
- [ ] **WB 复验新发现 · 建议一并评估**：33 个失败（`test_shell_tool` 14 + `test_file_ops_tool` 19）实为**跨文件事件循环污染**，与 pytest-asyncio 无关——FastAPI `TestClient` 退出时销毁当前线程事件循环，后续 sync 测试调 `asyncio.get_event_loop()` 抛 `RuntimeError: There is no current event loop in thread 'MainThread'`（`asyncio/events.py:681`）。实证：file_ops 单跑 20/20 绿；test_archive+file_ops 31 全绿；test_conversations 或 test_chat_service + file_ops → 19 failed。Claude 先评估修复成本，复杂则回报待裁
- **WB 裁决（2026-08-30 已定，Claude 照办）**：冒烟频率 = 发版前 + 大改动后；Brave 真实搜索**暂不纳入**冒烟；`--real-api` 跑挂**不阻塞交付**（真实 API 不稳定属外部因素，该层定位为"契约哨兵"）
- **基线（2026-08-30 01:47 WB 实测，供验收对比）**：`42 failed / 113 passed`。构成：integration 3（pytest-asyncio）+ chromadb 6（mock 已不存在的 `archiver.get_db`）+ test_windows_dir 1（中文 Windows 编码）= 真失败 10 个；其余 33 个为上述污染所致、单跑即绿。修复后须对比此基线，确保无新增回归
- [x] **`--real-api` 注入路径实测（老大 2026-08-30 授权专用测试 key，WB 亲跑 2 轮，✅ 通过）**：对照组（无 flag）session yaml 的 `deepseek.api_key` = `__TEST_PLACEHOLDER__`；实验组（带 flag）= 真实 key（len 35，非占位符）→ **注入路径确实生效**；3 用例 `3 passed in ~34s`，**进程不再挂起**（原 17.5min aiosqlite BUG 已修复）；config.yaml 跑后已原样还原（校验一致）
- [ ] **新发现（待 Trae 修，WB 实测·稳定复现 2/2）`vector_store.enabled=false` 被绕过**：`services/chat_service.py:142` 无条件调 `get_long_term_memory()` → `memory/engine.py:57-66` 直连 `embed_text` + `rag.vector_store.search`，**全程不判 `config.vector_store.enabled`**（`rag/vector_store.py:_get_client` 也不判）。后果两条：① 生产路径——每次 chat 白跑一次本地 embedding + 持有 ChromaDB 客户端，降级开关形同虚设（`test_chromadb_degradation.py` 声称的场景 1 实为「偷偷做、失败被 except 吞成 []」的静默降级）；② 测试路径——`--real-api` 下 chroma.sqlite3 句柄不释放，atexit 的 rmtree 抛 `WinError 32`，**正常退出也残留含 key 目录**（此前"仅强杀才残留"的说法已证伪）。修复取向：照 `api/memory.py:136` 既有写法，在 `get_long_term_memory` 开头判 `if not config.vector_store.enabled: return []`（治本，①②同解）

### 移动端开发

- [ ] 响应式 UI 或独立 `mobile/index.html`
- [ ] PWA manifest + Service Worker（可选）

### 部署调试试运行

- [ ] Nginx 部署脚本示例（静态文件 + API 反代）
- [ ] 部署文档 + 安全加固

### 上云前架构债清算

- [ ] 记忆隔离：长期记忆检索按 `source_role` 加权（软隔离），多场景角色记忆分离
- [ ] 边界侵蚀：工具消息与对话消息分离（`tool_calls` / `tool_call_id` 不再写入 `messages` 表）
- [ ] shell IP 白名单重构：`127.0.0.1` / `::1` 白名单与公网访问不兼容，上云前改为 API Key 鉴权为主
- [ ] ShellTool 黑名单加固：当前字符串包含匹配可穿透变体，上云/放开 IP 前须升级正则/词法解析或换沙箱（与白名单重构同批）
- 注：局域网/上云访问 `host: 0.0.0.0` 前须先 set `server.api_key`，当前本机使用可空

### UI/UX优化

- [ ] 绝对长期项目，人类至高训导权 + 个人项目 的完全体现，人类想做啥就做啥，我就是要五彩斑斓的黑！
- [ ] 初步测试，UI还是存在一些BUG，这个慢慢来
- [x] **BUG（Claude 测出 · WB 读代码复验 2026-08-24 · ✅ 已修复闭环）会话重命名输入框自动聚焦失效**：根因 `AppLayout.vue` `ref="renameInput"` 落 v-for 作用域被 Vue3 收为数组 → `startRename` 的 `.focus()` 在数组上抛 `TypeError`，点重命名后不自动聚焦/全选。修复：v-for 内改函数 ref `:ref="(el) => (renameInput = el)"`（Trae commit `e2fbb74`）；Claude 移除测试兜底、45/45 全绿；WB 读代码复验通过（ref 已为单值绑定）。
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

> 以下为长期架构愿景，当前 P0-P3 仅支持手动切换角色，自动意图识别和跨域关联留待后续迭代。

- [ ] 意图识别机制：长期 — 对话开头快速分类用户意图，自动切换角色
- [ ] 跨域关联能力：长期 — 记忆检索不限单一领域，允许 AI 发现跨场景因果链
- [ ] 用户画像沉淀：长期 — 从记忆中提炼结构化用户画像，注入 system prompt
- [ ] 场景间信息同步策略：长期 — 定义全局共享 vs 领域私有的记忆边界

### 工程债务（需要重新考虑）

- [ ] **前端集成层测试**：会话切换加载 / 角色切换传参的集成测试（mock RouterView + store 联动）。逻辑层已由 Claude 覆盖（P4.4 测试 31/31 绿），集成层待补；原规格"引入新逻辑层时一并补，或 WB 明确要求再做"。P4 完结时不阻塞（功能闭环已达成），归此待补
- [ ] **存量测试债务是否修复**：`test_chromadb_degradation.py`（mock 了已不存在的 archiver.get_db）、`test_integration_llm.py`（缺 pytest-asyncio）、`test_shell_tool.py::test_windows_dir`（中文 Windows 编码断言）。选项 A：修复恢复"全套绿"基线；选项 B：维持"相关测试 + 已知项甄别"现状。当前规则以 B 运转（见 CLAUDE.md/TRAE.md 测试环境段）。此事不是很急，找个合适的机会讨论一下

### 其他长期增强（待触发）

- [ ] chat_service token 累计上限（单次对话 tool call 总 token 阈值）：防止单轮读大文件等场景暴增，当前仅轮次限制。优先级很低，不做主动处理；若后续出现相关问题再讨论完善，不静默自动处理。

---

## 开发路线图

> 主线阶段 **P0–P4 已全部完成 ✅**，LarryAgent 进入「能力增强 / 长期迭代」新阶段。主线阶段详细情况冷存于 `archive/roadmap-history.md`。

### 历史索引（已完成阶段，冷存于 `archive/roadmap-history.md`）

- **P0 - 最小聊天闭环** ✅（2026-08-07）→ 端到端聊天闭环。详见 `archive/roadmap-history.md`。
- **P1 - 记忆系统可用** ✅（2026-08-07）→ Embedding / ChromaDB / 长期记忆 / 归档 / 降级。详见 `archive/roadmap-history.md`。
- **P2 - 工具调用闭环** ✅（2026-08-11）→ FileOps / ShellTool / Function Calling / `/api/tools` / config。详见 `archive/roadmap-history.md`。
- **P3 - 流式 + 体验优化** ✅（2026-08-12~15）→ SSE / 重试 / Token / API Key 校验 / 异常类。详见 `archive/roadmap-history.md`。
- **P4 - PC 客户端可用** ✅（2026-08-15~19）→ Tauri 进程管理 / Vue 前端 / 界面基调 / 会话 API / 聊天界面 / 异常出口统一。详见 `archive/roadmap-history.md`。

> 原 P5（移动端 + 部署）已取消 P 编号，2026-08-20 拆分为「移动端开发」「部署调试试运行」「上云前架构债清算」三个普通阶段，列入上方「当前待办」区与记忆系统调优等并列。