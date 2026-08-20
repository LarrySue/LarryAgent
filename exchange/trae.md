# Trae 协作区

## 当前状态（2026-08-19 更新）

- **P4.4 聊天界面** ✅ 已交付（Trae，2026-08-19）+ WorkBuddy 复验通过（看代码 + 看报告双轨）；详见历史状态。
- **P4.5 首次启动引导 + 配置入口** ❌ 2026-08-19 派发，同日经评估为不需要功能，永久砍除（开发者自用 + 手配 key，GUI 引导纯负担；代码空壳已移除）。
- **web_search 工具 + Tool 框架底座** 🔄 2026-08-20 WorkBuddy 派发（Trae 实现 / Claude 测试），规格见下方。

---

## web_search 派发规格（2026-08-20 WorkBuddy 派发）

**目标**：对话内 AI 自主网络搜索 + 实时信息整合 + 来源标注；同步夯实 Tool 框架底座。**实现**：Trae ｜ **依赖**：P2 工具闭环 ✅ / P4.4 ToolCallCard ✅ ｜ **测试**：Claude（Trae 不写测试，见 TRAE.md 约定）。

### 一、功能清单（源自 TODO.md 网络搜索能力）
1. 新增 `backend/tools/web_search.py`：继承 `BaseTool`，注册名 `web_search`；对话内 AI 自主调用，返回结构化结果（标题 + URL + snippet），供 LLM 整合进回答并标注来源。
2. provider 可插拔封装：抽象 `SearchProvider`（`search(query, max_results, timeout) -> List[Result]`）+ `BraveSearchProvider`（GET `https://api.search.brave.com/res/v1/web/search`，header `X-Subscription-Token: <key>`，解析 `web.results`）；默认 `provider=brave`，将来加 `SearXNGProvider` 只换实现、调用层/前端不变。
3. config 扩展：`config.yaml` 加 `search:` 段（`provider: brave` + `brave_api_key: <key>`）；⚠️ key 走 config（已被 .gitignore 保护、不入库），测试用 mock/stub，不碰真实 key。
4. 超时 + 降级：单次调用硬超时（默认 8s）；失败 / 限流(429) → 指数退避（最多 2 次）→ 仍失败 → 返回降级信号，由 chat_service 降级为正常回答 + 提示"未能联网核实"，不报错不中断、不阻塞 SSE 流。
5. 安全：目标 URL 内网拦截钩子（SSRF，防 `169.254.169.254` / `10.x` / `192.168.x` / `localhost`）——search 本身只调 Brave 固定域名风险低，但 provider 抽象预留校验钩子，将来 web_fetch 直接复用。
6. 前端：复用 P4.4 `ToolCallCard` 展示搜索过程与来源（tool type 映射，零新组件）。

### 二、Tool 框架底座（同步夯实，顺手零额外成本）
- `BaseTool` 护栏基类：所有 Tool 继承即获 超时强制 + 错误归一(`ToolError`) + 执行日志；"访问外部/本地资源"类叠加 SSRF / caller 校验钩子。
- 配置驱动启用：`config.yaml` 列启用的 Tool + 各自参数；新增 Tool 不改核心代码。
- 第三方挂载契约：先留声明式接口（name / schema / 护栏级别），完整机制留 TODO，不急着全做（防过度工程）。

### 三、关键约束
- 只写实现、不写测试文件（测试归 Claude；TRAE.md 已约定"我不编写测试文件"）。
- 复用 P2 ShellTool 超时机制，不重复造轮子。
- key 仅在 backend 侧读取，绝不落入前端日志 / 对话。

### 四、验收 / 协作
- 交付后 WB 复验（读代码 + 看报告）；真机搜索流程（首次搜索 / 来源标注 / 降级）需老大 GUI 环境收尾。
- Claude 后续补规范测试（参考 conftest 隔离，不碰真实 config / 真实 Brave key，用 mock provider）。

### 五、派发日期
2026-08-20，WorkBuddy 派发。

---

## 历史状态

- **P4.4 已交付**（2026-08-19）：聊天界面 Vue 组件
- P4.2→P4.4 交接点全部完成：配色换 design token / 砍底部状态栏 / 新增 TopBar
