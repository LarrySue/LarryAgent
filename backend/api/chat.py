"""
聊天 API 路由

职责：
- POST /api/chat：接收用户消息，完成记忆检索 → LLM 调用 → 返回响应的完整流程
- 支持流式（SSE）和非流式两种响应模式
- 自动保存对话到数据库

与其他模块的关系：
- 依赖 memory/engine.py 检索短期和长期记忆
- 依赖 models/llm.py 调用 LLM
- 依赖 tools/registry.py 获取工具列表
- 依赖 db/database.py 保存消息
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    """聊天请求体"""
    conversation_id: int | None = None  # None 表示新建会话
    message: str
    model: str = "deepseek-chat"
    stream: bool = False
    temperature: float = 0.7


class ChatResponse(BaseModel):
    """非流式聊天响应体"""
    conversation_id: int
    reply: str
    model: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    聊天接口 - 非流式。

    处理流程：
    1. 如果无 conversation_id，创建新会话
    2. 保存用户消息到数据库
    3. 检索短期记忆（最近消息）+ 长期记忆（向量检索）
    4. 获取可用工具列表（OpenAI function calling schema）
    5. 调用 LLM，传入记忆 + 工具
    6. 保存助手回复到数据库
    7. 返回响应
    """
    # TODO: 实现完整聊天流程
    #   1. 创建/获取会话
    #   2. 保存用户消息
    #   3. 记忆检索 → memory.engine
    #   4. 构建 messages → memory.engine.build_memory_context
    #   5. LLM 调用 → models.llm.chat_completion
    #   6. 保存助手回复
    #   7. 返回
    raise HTTPException(status_code=501, detail="Chat endpoint not yet implemented")


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    聊天接口 - 流式（Server-Sent Events）。

    与 /api/chat 流程相同，但使用 SSE 逐步返回生成内容。
    """
    # TODO: 实现 SSE 流式响应
    #   使用 StreamingResponse + models.llm.chat_completion_stream
    #   每收到一个 chunk 就 yield 一个 SSE 事件
    raise HTTPException(status_code=501, detail="Stream chat not yet implemented")
