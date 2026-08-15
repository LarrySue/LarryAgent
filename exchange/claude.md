# Claude Code 交流区

**当前状态（2026-08-15 更新）**

- P3.4 测试已交付（commit `02d4d37`，7/7 通过），WorkBuddy 复验通过。
- 约束一致性改写已完成并复核：CLAUDE.md 已落实全部裁决，TODO 自查项 6 条确认解决后删除。

---

**P3.5 测试任务派发（2026-08-15，@Claude）**

## 任务概述

为 P3.5 自定义异常类体系编写测试，验证异常类型 → HTTP 响应映射正确，且 AuthMiddleware 的 raise 改造不引入回归。

## 交付项

### 1. 新建 `backend/tests/test_exceptions.py`

**核心测试项（强制）：**

| # | 测试 | 验证点 |
|---|---|---|
| 1 | 每种异常类型 → 正确 HTTP status + body | ConfigError→500、LLMError→502、ToolError→500、AuthError→401，body 格式 `{"error": "TYPE", "detail": "msg"}` |
| 2 | AuthMiddleware raise AuthError → 全局 handler 捕获 → 401 | **你提出的衔接验证点**：确认 BaseHTTPMiddleware 内 raise 的异常能被 FastAPI exception handler 正确捕获。设非空 api_key，无 Bearer header → 401 + `{"error": "AUTH_ERROR", "detail": "Invalid or missing API key"}` |
| 3 | AuthMiddleware raise AuthError → 正确 Bearer → 200 | 确认正常请求不受影响 |
| 4 | 非预期异常（非 LarryException）→ 500 | 确保未捕获异常不会暴露堆栈，返回 500 + 合理 body |

**建议：** 用 FastAPI TestClient（与 test_auth_middleware.py 一致），注册一个临时测试路由 raise 各类异常。

### 2. 回归测试

- `test_auth_middleware.py`：7 项全通过（验证 raise 改造后 HTTP 响应不变）
- `test_chat_service.py`：16 项全通过（验证 chat.py 异常类型改造无回归）

### 3. 测试文件归属

- `test_exceptions.py` 归你维护（你编写测试）
- 如果 `test_auth_middleware.py` 需要因 raise 改造而微调（比如去掉对 JSONResponse 类型的断言），由你修改

## 约束

- 测试范围：按 CLAUDE.md 测试环境段规则——`test_chat_service.py` + `test_auth_middleware.py` + 新 `test_exceptions.py` 为必跑项；`test_chromadb_degradation.py` / `test_integration_llm.py` / `test_shell_tool.py::test_windows_dir` 为已知跳过项
- 完成后立即 commit（`test(P3.5): 异常体系测试 + AuthMiddleware raise 改造回归`）
- commit 后在 exchange/claude.md 更新状态

## 时序

- Trae 先完成实现并 commit
- 你在 Trae commit 后开始测试（拉取最新代码）
- 如发现 Trae 实现的问题，在 exchange/claude.md 暴露并 @WorkBuddy，不私自改 Trae 的代码
