# Trae 协作区

## 当前状态（2026-08-21 更新）

> **流程说明**：2026-08-21 三轮 UI 调整为**老大直接对接 Trae** 完成（未走 WB 派发流程，非派发任务）；三轮提交均附报告并列见下方，供 Claude 审查 + WorkBuddy 复验。

- **前端 UI 调整（三轮）** ✅ 已提交（Trae，2026-08-21），报告并列见下方。
  - 第一轮：欢迎页清理 + logo 占位
  - 第二轮：新建会话按钮 + 删冗余导航
  - 第三轮：侧栏标题栏精简（logo + 新建按钮并入标题行）
- **web_search 工具 + Tool 框架底座** ✅ 已交付（Trae，2026-08-20），交付说明见下方；等 Claude 补规范测试 + WorkBuddy 复验。

---

## 第三轮：侧栏标题栏精简报告（2026-08-21）

### 背景

老大主导 UI 瘦身（个人自用项目，说明性文字能省则省）：删「会话列表」标题文字、"新建会话"按钮只留「＋」图标、侧栏标题左侧加 logo 占位，最后把「＋」并入标题栏右对齐，进一步精简顶部空间。

### 改动文件清单（1 文件修改，复用已有 logo 资源）

| 文件 | 改动 |
|---|---|
| `client/src/components/AppLayout.vue` | ① 删「会话列表」标题文字；② 「＋」按钮瘦身为 28×28 纯图标；③ 侧栏标题栏加 logo 占位（`assets/logo.svg`，24×24，左对齐，后续换正式素材）；④ 「＋」移入标题栏右对齐（`justify-content: space-between`），删除会话列表顶部独立按钮行（`.section-header`） |

### 侧栏最终结构

```
┌────────────────────┐
│ 🎨 LarryAgent    ＋ │  ← logo + 标题（左）+ 新建按钮（右，同一行）
├────────────────────┤
│ [会话1]             │
│ [会话2]             │
└────────────────────┘
```

### 验证

- `npm run build`（vue-tsc + vite）：✅ 通过，0 错误
- 真机效果：标题栏一行完成「品牌 + 新建」；logo 占位待正式素材替换

---

## 第一轮：前端 UI 清理 + 欢迎页 logo 调整报告（2026-08-21）

### 背景

老大在 [MessageList.vue](file:///d:/Code/LarryAgent/client/src/components/MessageList.vue) 中手动删除了欢迎态的副标题 + 快捷建议按钮（`.welcome-subtitle` / `.welcome-suggestions` / `.suggestion-btn`），并希望欢迎态标题上方的色点换成图片 logo（先占位）。

### 改动文件清单（3 文件：1 新增 + 2 修改）

| 文件 | 改动 |
|---|---|
| `client/src/assets/logo.svg`（新） | 占位 logo：暗色圆底 + 锚点色缺口环 + 白色写意笔触 + 朱红点（C2 logo 概念简化版），48×48，待 UI Designer 正式稿替换 |
| `client/src/components/MessageList.vue` | ① 清理死 CSS：删除 `.welcome-subtitle` / `.welcome-suggestions` / `.suggestion-btn` / `.suggestion-btn:hover`；② 欢迎态色点 `.welcome-role-dot` → `<img class="welcome-logo">`，`import logoUrl from "@/assets/logo.svg"` |
| `client/src/views/ChatView.vue` | 清理残留：删除 `onSuggestion()` 函数 + `<MessageList @suggestion="onSuggestion">` 事件绑定 |

### 图片资源目录约定

- 前端图片统一放 **`client/src/assets/`**（Vite 标准资源目录，import 引入会打包 hash 文件名）
- 区别于 `client/public/`（原样复制）与 `client/src-tauri/icons/`（Tauri 窗口图标）
- 正式 logo 到位后：替换 `logo.svg` 文件内容即可，代码不用动（PNG 也行，改 import 后缀）

### 验证

- `npm run build`（vue-tsc + vite）：✅ 通过，0 错误
- 真机效果：dev server 热更新中，欢迎态显示 logo 图片

---

## 第二轮：新建会话入口 + 删除冗余导航报告（2026-08-21）

### 背景

老大确认「欢迎页 = 新建会话 = 同一状态」（`currentConversationId === null`，发消息时 conversation_id 为空后端自动新建），但此前侧栏没有"新建会话"按钮，点进已有会话后无法回到欢迎页；同时左侧栏导航区只有指向当前页的"聊天"链接（`/settings` 路由已随 P4.5 砍除），点击无实际作用。

### 改动文件清单（1 文件修改）

| 文件 | 改动 |
|---|---|
| `client/src/components/AppLayout.vue` | ① 新增「＋ 新建会话」按钮（会话列表标题右侧）：`startNewChat()` → `selectConversation(null)` → ChatView watch 到 null 清空消息回欢迎页；移动端自动收起侧栏；② 删除冗余导航区 `<nav>`（"聊天" RouterLink）+ 清理 `RouterLink` import + `.nav` / `.nav-item` 系列 4 个死样式 |

### 侧栏新结构

```
┌──────────────┐
│ LarryAgent   │  ← logo
├──────────────┤
│ 会话列表  ＋新建 │  ← 标题 + 新建按钮
│ [会话1]       │
│ [会话2]       │
└──────────────┘
```

### 验证

- `npm run build`（vue-tsc + vite）：✅ 通过，0 错误
- 真机效果：点「新建会话」从任意会话回到欢迎页；欢迎页发消息自动创建新会话

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
