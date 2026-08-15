"""
LarryAgent 统一异常体系

职责：
- 提供项目级异常基类 LarryException
- 按错误域分为四个子类：Config / LLM / Tool / Auth
- 每个异常自带 error_type 和 HTTP status_code，供全局 handler 统一格式化

与其他模块的关系：
- main.py 通过 @app.exception_handler(LarryException) 注册全局 handler
- 各路由和中间件优先 raise 具体子类，而非通用 Exception / HTTPException
- 响应体固定为 {"error": "<TYPE>", "detail": "<msg>"}，与 P3.4 AuthMiddleware 原格式一致
"""


class LarryException(Exception):
    """LarryAgent 统一异常基类。

    所有业务错误都应抛出其子类，由 main.py 中的全局 handler
    转换为统一格式的 JSON 响应。
    """

    error_type: str = "LARRY_ERROR"
    status_code: int = 500

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class ConfigError(LarryException):
    """配置加载或解析错误。"""

    error_type = "CONFIG_ERROR"
    status_code = 500


class LLMError(LarryException):
    """LLM API 调用失败或上游 LLM 返回异常。"""

    error_type = "LLM_ERROR"
    status_code = 502


class ToolError(LarryException):
    """工具执行错误（ShellTool / FileOpsTool 等）。"""

    error_type = "TOOL_ERROR"
    status_code = 500


class AuthError(LarryException):
    """鉴权失败（API Key 缺失或不匹配）。"""

    error_type = "AUTH_ERROR"
    status_code = 401


class ValidationError(LarryException):
    """业务校验失败（请求体非法、参数越界等，客户端可修正）。"""

    error_type = "VALIDATION_ERROR"
    status_code = 400


class ResourceNotFoundError(LarryException):
    """请求的资源不存在（对话不存在、消息不存在等）。"""

    error_type = "NOT_FOUND"
    status_code = 404
