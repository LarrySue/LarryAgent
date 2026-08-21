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
- [ ] **角色切换过渡动画回写**：方向已定（纯 color transition 200ms，不用 transform/位移，定案见 `UI-Reference.md` §9）；C2 已落地，余留细节由 Trae 点将实现时回写 `UI-Reference.md`
- [ ] **Trae 实现期 UI 细节文档化**：实现期新增的 UI 细节（如 `--weight-semibold/bold` 等 token）以 `tokens.css` / 组件代码为准，待点将时回写 `UI-Reference.md` §10 已知局限所列项

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