"""
聊天 API 路由

职责：
- POST /api/chat：接收用户消息，根据 Accept header 分支流式/非流式
  - Accept: text/event-stream → SSE 流式（StreamingResponse）
  - 其他 → 非流式 JSON 响应
- 从 request.client.host 提取 caller_ip 传入服务层

与其他模块的关系：
- 依赖 services/chat_service.py 处理业务逻辑
"""

import logging

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from openai import APIError

from db import conversations as conv_db
from exceptions import LLMError, ResourceNotFoundError
from services.chat_service import ChatRequest, ChatResponse, handle_chat, handle_chat_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(req: ChatRequest, request: Request):
    """
    聊天接口 — 根据 Accept header 分支：

    - Accept: text/event-stream → SSE 流式
    - 其他 → 非流式 JSON

    两条路径共享同一个 _chat_flow generator，
    流式路径通过 handle_chat_stream 格式化为 SSE 事件。
    """
    caller_ip = request.client.host if request.client else "unknown"
    accept = request.headers.get("accept", "")

    # P4.6 关键修复：在**返回 StreamingResponse 之前**预校验会话存在性。
    # 原因：一旦 StreamingResponse(...) 被 return，HTTP 200 响应头就已经发出，
    # 之后 handle_chat_stream → _chat_flow 再 raise ResourceNotFoundError
    # 会触发 Starlette "Caught handled exception, but response already started"
    # （全局 handler 无法改写 status_code），最终客户端收到空的 200 而非 404。
    # 非流式路径 handle_chat 也会走此预检查，避免重复 DB 查询可以接受（轻量单条 SELECT）。
    if req.conversation_id is not None:
        existing = await conv_db.get_conversation(req.conversation_id)
        if existing is None:
            raise ResourceNotFoundError(f"Conversation not found: {req.conversation_id}")

    if "text/event-stream" in accept:
        # 流式 SSE
        return StreamingResponse(
            handle_chat_stream(req, caller_ip),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",  # Nginx 透传，不缓冲
            },
        )

    # 非流式 JSON
    try:
        return await handle_chat(req, caller_ip)
    except ValueError as e:
        # _chat_flow 里 generator 推送的 error 事件对应 LLM 请求过程内部异常，归 LLMError
        logger.warning("Chat error: %s", e)
        raise LLMError(str(e)) from e
    except APIError as e:
        logger.error("LLM API error: %s", e)
        raise LLMError(f"LLM API error: {e}") from e
    except Exception as e:
        logger.exception("Unexpected error during chat")
        raise LLMError(f"LLM request failed: {e}") from e
