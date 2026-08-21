# Trae 协作区

## 当前状态（2026-08-21 更新）

> **流程说明**：2026-08-21 三轮 UI 调整为**老大直接对接 Trae** 完成（未走 WB 派发流程，非派发任务），WB 已复验（38/38 前端单测绿 + 构建类型检查通过）。

- **前端 UI 调整（三轮）** ✅ 已提交（Trae，2026-08-21）
  - 第一轮：欢迎页清理 + logo 占位
  - 第二轮：新建会话按钮 + 删冗余导航
  - 第三轮：侧栏标题栏精简（logo + 新建按钮并入标题行）
- **logo 定稿 + 调试台** ✅ 已提交（Trae，2026-08-21，老大直接对接）：占位 SVG logo 从 C2 简化稿迭代定稿（禅圆缺口 7 点方向 + 双控制点笔触 + 红/白双点，配色压低饱和度）；附赠临时工具 `client/public/logo-preview.html`（SVG 源码编辑 + 实时预览 + 取色器调色 + 项目色板，方便老大自行微调）
- **web_search 工具 + Tool 框架底座** ✅ 已交付（Trae，2026-08-20），交付说明见下方；等 Claude 补规范测试 + WorkBuddy 复验。

---

## web_search + Tool 框架底座 交付说明（2026-08-20，实现本体）

### 改动文件清单（6 文件：1 新增 + 5 修改）

| 文件 | 改动 |
|---|---|
| `tools/web_search.py`（新） | WebSearchTool（注册名 `web_search`）+ SearchProvider 抽象 + BraveSearchProvider + SSRF 拦截钩子 + 指数退避重试 + 降级信号 |
| `tools/base.py` | 护栏基类：`ToolError` + `guard_level` + `timeout` + `run()` 模板方法（超时强制 + 错误归一 + 执行日志 + `_validate_request` 钩子）；`execute` 接口不变（向后兼容） |
| `tools/registry.py` | 配置驱动启用：读 `config.tools.enabled_tools` 过滤注册；空列表 = 全部启用（向后兼容）；新增工具只需在 `_available_tool_classes()` 登记 + config 加名字 |
| `config.py` | 新增 `SearchConfig`（provider/brave_api_key/timeout/max_retries/max_results）+ `ToolsConfig.enabled_tools` |
| `config.yaml` | 加 `search:` 段 + `tools.enabled_tools` 列表（含 web_search） |
| `services/chat_service.py` + `api/tools.py` | 工具调用点 `execute()` → `run()`（护栏统一入口） |

### 功能点对应

| 规格要求 | 实现 |
|---|---|
| provider 可插拔 | `SearchProvider` ABC + `BraveSearchProvider`（GET Brave API，`X-Subscription-Token`）；换 SearXNG 只写新类 |
| 超时 + 降级 | 每轮尝试 `asyncio.wait_for(timeout=8s)`；tenacity 指数退避（最多 2 次重试）；仍失败 → `ToolResult(success=False, error="未能联网核实：...")`，chat_service 传给 LLM 降级为正常回答，不报错不中断 |
| SSRF 拦截 | `_validate_request` 钩子（在 `run()` try 内，失败归一不冒泡）；`_is_blocked_ssrf_url` 拦 169.254/10.x/192.168/127.x/localhost/0.x/100.64；域名留 DNS 解析给将来 web_fetch |
| 配置驱动启用 | `enabled_tools` 列出启用工具；空列表兜底全开 |
| 前端展示 | 复用 P4.4 ToolCallCard（SSE tool_call/tool_result 事件驱动），零新组件 |
| key 安全 | 仅 backend config 读取；测试用 mock provider，不碰真实 key |

### 护栏基类设计决策（重要）

- **不破坏现有工具**：`execute` 保持抽象接口，FileOpsTool/ShellTool **零改动**（run() 自动给它们加错误归一 + 执行日志；ShellTool 的 30s 超时仍在 execute 内部，run() 的 timeout=None 不嵌套强制）。
- **`_validate_request` 在 try 内调用**：校验失败（ToolError）归一为失败 ToolResult，不中断聊天（自测发现并修复）。

### 自测验证（内联 mock，非测试文件）

- SSRF 拦截：169.254.169.254 / 10.x / 192.168.x / 127.x / localhost 全部拦截；公网域名/IP 放行 ✅
- 成功路径：mock provider 返回结果 → ToolResult(success=True, content 含标题+URL+摘要) ✅
- 降级路径：provider 抛异常 → 重试后 `未能联网核实：网络搜索超时（>8.0s，重试2次）` ✅
- SSRF query 拦截：query 含内网 URL → 归一为失败结果 ✅
- 空 query → 失败结果 ✅
- 工具注册：`['file_ops', 'shell', 'web_search']` ✅

### 回归验证

- 核心测试（chat_service/exceptions/auth_middleware/conversations/llm_retry）：**58 passed** ✅
- shell + file_ops 单文件跑：**34 passed, 1 failed**（`test_windows_dir` 为 TODO 已记录存量债务：中文 Windows 编码断言）
- ⚠️ 混跑 7 个测试文件会触发旧测试代码 `asyncio.get_event_loop()` 与 Python 3.11 的既有互操作污染（非本次改动引入，单独跑各文件均正常）

### 待 Claude / WorkBuddy

- Claude 补规范测试（mock provider，不碰真实 key / 真实 config）
- WorkBuddy 复验（读代码 + 看报告）；真机搜索流程（首次搜索 / 来源标注 / 降级）需老大 GUI 环境收尾

---

## 历史状态

- **P4.4 已交付**（2026-08-19）：聊天界面 Vue 组件
- P4.2→P4.4 交接点全部完成：配色换 design token / 砍底部状态栏 / 新增 TopBar
