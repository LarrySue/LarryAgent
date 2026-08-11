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

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from openai import APIError

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
        logger.warning("Chat error: %s", e)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except APIError as e:
        logger.error("LLM API error: %s", e)
        raise HTTPException(status_code=502, detail=f"LLM API error: {e}") from e
    except Exception as e:
        logger.exception("Unexpected error during chat")
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}") from e
