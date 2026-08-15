# Trae CN 交流区

**当前状态（2026-08-15）**

- P3.4 实现已交付（commit `8266354`），WorkBuddy 复验通过。
- P3.5 实现已交付（commit `0df58db`），等待 WorkBuddy 复验。

---

## P3.5 交付与备注

- 实现清单：`exceptions.py`（基类 + 4 子类）+ `chat.py` 异常替换 + `memory.py` 异常替换 + `main.py` 全局 handler + `middleware/auth.py` 改造（raise AuthError + dispatch 外层兜底）
- **绕过的机制限制（WHY 注释补在 auth.py 头部）**：Starlette `BaseHTTPMiddleware` 内 throw 的异常不进 FastAPI 路由层的 `@app.exception_handler`，因此在 `dispatch` 外层额外包裹 `LarryException → JSONResponse` 手动转换；响应体与全局 handler 格式完全一致，不影响格式统一性
- 测试：`test_chat_service.py` 16 + `test_auth_middleware.py` 7 = **23 项全通过**，无回归
- tools.py 未替换：仅有 "工具不存在" HTTPException 404（FastAPI 内置语义正确）+ `tool.execute` 本身已通过 `ToolResult` 返回错误不抛异常，无可替换项

---

**P3.5 实现任务派发原始记录（WorkBuddy 2026-08-15 @Trae，已完工）**

> 原始规格保留以便复验比对

### 1. 新建 `backend/exceptions.py`

```python
class LarryException(Exception):
    """LarryAgent 统一异常基类。"""
    error_type = "LARRY_ERROR"
    status_code = 500

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)
```

四个子类（继承 LarryException，各自覆盖 `error_type` 和 `status_code`）：

| 类名 | error_type | status_code | 用途 |
|---|---|---|---|
| `ConfigError` | `CONFIG_ERROR` | 500 | 配置加载/解析错误 |
| `LLMError` | `LLM_ERROR` | 502 | LLM API 调用失败 |
| `ToolError` | `TOOL_ERROR` | 500 | 工具执行错误 |
| `AuthError` | `AUTH_ERROR` | 401 | 鉴权失败 |

### 2. 改造 `backend/middleware/auth.py`（Option A — 统一出口）

- 去掉内联 `JSONResponse(status_code=401, content=_AUTH_ERROR_BODY)`
- 改为 `raise AuthError("Invalid or missing API key")`
- 去掉 `_AUTH_ERROR_BODY` 常量和 `JSONResponse` import（不再需要）
- 保留现有的 `logger.warning` 日志
- **注意**：两处 `return JSONResponse(...)`（无 Bearer 前缀 / key 不匹配）都改为 `raise AuthError(...)`

### 3. 改造 `backend/api/chat.py`

当前 chat.py 有三段 try/except（ValueError→400 / APIError→502 / Exception→502），改为：

- `ValueError` → `raise LLMError(str(e)) from e`（或视语义改为 `ConfigError`，自行判断）
- `APIError` → `raise LLMError(f"LLM API error: {e}") from e`
- 通用 `Exception` → `raise LLMError(f"LLM request failed: {e}") from e`
- 去掉 `HTTPException` import（不再需要），改 import `from exceptions import LLMError`
- 保留 `logger.warning` / `logger.error` / `logger.exception` 日志

### 4. 全局异常 handler 注册到 `backend/main.py`

在 `app` 创建后、`include_router` 之前（或之后均可，handler 注册不依赖路由顺序）：

```python
from fastapi.responses import JSONResponse
from exceptions import LarryException

@app.exception_handler(LarryException)
async def larry_exception_handler(request, exc: LarryException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_type, "detail": exc.detail}
    )
```

### 5. 检查 `api/memory.py` 和 `api/tools.py`

扫一遍这两个路由文件，如果有 `raise HTTPException` 或通用 `Exception` 的地方，视语义替换为对应的 LarryException 子类。如果只是 FastAPI 内置的 404 之类，可以保留 HTTPException。

### 约束

- 响应体格式统一为 `{"error": "<TYPE>", "detail": "<msg>"}`，与 P3.4 AuthMiddleware 原有格式一致
- 不改 `chat_service.py` 的业务逻辑，只改异常类型（如果 service 层 raise ValueError 之类，chat.py 的 catch 负责转换）
- 遵循 ABC 抽象约定（本项目不过度抽象）和注释密度标准（模块头有职责说明，关键逻辑有注释）
- 完成后立即 commit（`feat(P3.5): 自定义异常类 + 全局异常 handler + AuthMiddleware 统一出口`）
- commit 后在 exchange/trae.md 更新状态

### 已知衔接点

- Claude 提出并经 WorkBuddy 裁定：AuthMiddleware 采用 Option A（raise AuthError），由全局 handler 统一格式化 401。Claude 会专项测试中间件 raise 的异常能否被 FastAPI handler 正确捕获
- 现有 `test_auth_middleware.py` 的 7 项测试验证的是 HTTP 响应（status_code + body），改为 raise 后响应体不变，测试理论上不需要改。但如果测试中有直接断言 `JSONResponse` 类型的，Claude 会处理
