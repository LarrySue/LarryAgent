# Claude 协作区

## 当前状态（2026-08-24）

- **三点菜单 + 行内重命名回归测试** ✅ 已交付（commit 见下方，追加 7 项）。
- **三轮 UI 调整回归测试** ✅ 已交付（7 项全绿）。
- **web_search 测试** ✅ 已交付（commit `a58e3ae`，42 项全绿）。
- P4.4 前端测试基建 ✅（31/31，commit `a2d6d8f`）
- conftest 后端测试隔离 ✅（commit `5cd2104`）

---

## 三点菜单 + 行内重命名回归测试交付说明（2026-08-24）

**背景**：Trae 在老大的直接安排下新增"侧栏会话三点菜单 + 行内重命名"（commit `6a20204`）。审查判断：菜单开合、重命名确认链（Enter/Esc/blur/空输入）是功能逻辑，值得测；BrandText 纯静态渲染、第 4/5 轮纯视觉改动不测。

**交付物**：`client/tests/appLayout.test.ts` 追加 7 项（原 7 项 → 14 项），前端 45/45 全绿 + build 通过。

其余测试覆盖：菜单开合（含 document 点击关闭）/ 重命名 Enter 确认调 API + 重拉列表 / Esc 取消不调 API / 空输入视为取消 / blur 失焦确认 / 编辑态输入框预填原标题。

---

## 三轮 UI 调整回归测试交付说明（2026-08-21）

**背景**：老大直接对接 Trae 完成三轮 UI 调整（欢迎页清理 / 新建会话按钮 / 侧栏标题栏精简，均改 `client/src/components/AppLayout.vue`）。审查后判断：CSS 视觉类改动不值得测（jsdom 测不了视觉），但**新增的功能逻辑 `startNewChat()`（点"＋"→ `selectConversation(null)` → ChatView watch 清空消息显示欢迎页）必须测**。同时删除 RouterLink 导航的副作用（AppLayout 不再依赖 vue-router）一并钉住。

**交付物**：`client/tests/appLayout.test.ts`（7 项）

| 覆盖 | 验证点 |
|---|---|
| 新建按钮逻辑 | 点"＋" → store.currentConversationId 清空为 null（含已有会话列表时） |
| 会话列表 | 空状态"暂无会话" / 有数据渲染 / 空标题"新会话"占位 |
| 会话交互 | 点击列表项 → selectConversation + active 高亮 |
| TopBar | 选中会话标题显示 / 未选中显示应用名 |

**验证**：`npm run test:unit` 38/38 全绿（31 存量 + 7 新增）；`npm run build` 通过。

---

## web_search + Tool 底座测试交付说明（2026-08-20，commit `a58e3ae`）

### 交付物（3 个测试文件，42 项）

| 文件 | 覆盖 |
|---|---|
| `tests/test_web_search.py`（28 项） | Brave provider 解析（mock httpx：成功 / 空结果 / 坏 JSON / 缺 web 字段）；provider 可插拔契约（注入 mock provider 正常产出 / 未知 provider 抛 ToolError）；降级路径（空 query / 超时 / 429 重试后成功 / 无结果 / max_results 钳制）；SSRF 钩子（10 类内网地址拦截 + 4 类公网放行 + query 内嵌 URL 拦截 + run() 归一验证） |
| `tests/test_tool_base.py`（10 项） | run() 护栏：超时强制（wait_for 截断，实测 <3s 而非等满 5s）/ ToolError 归一 / 普通异常归一 / _validate_request try 内（校验失败不中断）/ 执行日志（caplog）/ execute 向后兼容 / schema 生成 |
| `tests/test_tool_registry.py`（3 项） | enabled_tools 过滤 / 空列表全启用 / 未知工具跳过 + warning；全局注册表前后恢复隔离 |

### 关键验证点

- **零真实 key / 零真实 config**：全部 mock provider / mock httpx；conftest 隔离兜底（autouse 断言真实库 fail-fast）
- **全套回归**：101 通过（59 存量基线 + 42 新增）/ 42 失败全部为已知存量债务（chromadb_degradation 6 + integration 3 + shell get_event_loop 14 + file_ops get_event_loop 19），**无新增回归**
- **真实库零写入**：全套跑后会话数 41 未变（41 = 07:03 测试残留 13 + 用户 17:21 试服务 1 条真实会话，非本次写入）

### 一个实现观察（@Trae @WorkBuddy，不越界改）

`WebSearchTool` 构造时 `get_config().search`——若 config 缺 `search` 段（老配置没同步），`get_config().search` 是 `SearchConfig` dataclass 默认实例（dataclass 已给默认值），不会崩。已由测试覆盖（registry 空列表全启用路径会构造 WebSearchTool）。

交 WorkBuddy 复验。
