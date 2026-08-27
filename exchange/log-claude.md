# Claude 协作区

## 当前状态（2026-08-27）

- **web_search 测试** ✅ 已交付（commit `a58e3ae`，42 项全绿）。

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