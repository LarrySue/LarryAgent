"""
聊天 API 路由

职责：
- POST /api/chat：接收用户消息，调用 chat_service 完成完整流程
- POST /api/chat/stream：流式聊天（P3 实现）
- 从 request.client.host 提取 caller_ip 传入服务层，供 ShellTool IP 白名单校验

与其他模块的关系：
- 依赖 services/chat_service.py 处理业务逻辑
- 依赖 tools/registry.py 获取工具列表
"""

import logging

from fastapi import APIRouter, HTTPException, Request
from openai import APIError

from services.chat_service import ChatRequest, ChatResponse, handle_chat

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    """
    聊天接口 - 非流式，支持 function calling。

    处理流程由 services/chat_service.py::handle_chat 完成：
    会话管理 → 记忆检索 → LLM + 工具循环 → 持久化 → 返回
    """
    caller_ip = request.client.host if request.client else "unknown"
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


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    聊天接口 - 流式（Server-Sent Events）。

    与 /api/chat 流程相同，但使用 SSE 逐步返回生成内容。
    """
    raise HTTPException(status_code=501, detail="Stream chat not yet implemented")
