"""
记忆归档模块

职责：
- 会话结束后，调用 LLM 从对话历史中提取关键信息
- 生成结构化摘要，经用户确认后写入向量库作为长期记忆
- 支持手动触发归档（通过 /api/memory 接口）

归档流程：
1. 加载完整会话消息
2. 调用 LLM 生成摘要（提取关键事实、决策、偏好）
3. 展示摘要给用户确认
4. 用户确认后 → 分块 → 向量化 → 写入 ChromaDB + SQLite

与其他模块的关系：
- 被 api/memory.py 调用
- 依赖 db/conversations.py 读取会话消息、标记归档
- 依赖 db/memories.py 写入 memories 表
- 依赖 models/llm.py 生成摘要
- 依赖 models/embedding.py 生成向量
- 依赖 rag/vector_store.py 写入向量
- 依赖 rag/chunker.py 分块
"""

import logging
import uuid

from db.conversations import get_messages, get_conversation, mark_archived
from db.memories import create_memory
from models.embedding import embed_batch
from models.llm import chat_completion
from rag.chunker import chunk_text
from rag.vector_store import insert

logger = logging.getLogger(__name__)

SUMMARY_SYSTEM_PROMPT = """\
你是一个归档助手。请分析以下对话历史，提取值得长期记住的关键信息，生成结构化摘要。

提取规则：
- 保留：用户的偏好、习惯、决策、目标、计划、重要事实、经验教训
- 保留：用户明确表达过的需求和想法
- 丢弃：闲聊、问候、重复确认、常规操作描述
- 使用简洁的要点式表达，每条一个信息点
- 用中文输出

输出格式：
## 关键事实
- ...

## 用户偏好
- ...

## 决策与计划
- ...
"""


async def generate_summary(
    conversation_id: int,
    model: str = "deepseek-chat",
) -> str:
    """
    为指定会话生成摘要。

    Args:
        conversation_id: 会话 ID
        model: 用于生成摘要的模型

    Returns:
        摘要文本
    """
    conv = await get_conversation(conversation_id)
    if conv is None:
        raise ValueError(f"Conversation not found: {conversation_id}")
    if conv["is_archived"]:
        raise ValueError(f"Conversation already archived: {conversation_id}")

    messages = await get_messages(conversation_id, limit=None)
    if not messages:
        raise ValueError(f"No messages in conversation: {conversation_id}")

    # 构造 LLM 输入：系统提示 + 对话历史
    history_text = ""
    for msg in messages:
        role_label = {"user": "用户", "assistant": "助手", "system": "系统", "tool": "工具"}.get(
            msg["role"], msg["role"]
        )
        history_text += f"{role_label}：{msg['content']}\n\n"

    llm_messages = [
        {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
        {"role": "user", "content": f"以下是对话历史：\n\n{history_text}\n\n请生成摘要。"},
    ]

    logger.info(
        "Generating summary for conv=%d messages=%d model=%s",
        conversation_id,
        len(messages),
        model,
    )
    summary = await chat_completion(
        model=model,
        messages=llm_messages,
        temperature=0.3,
        max_tokens=2048,
    )
    logger.info(
        "Summary generated conv=%d len=%d",
        conversation_id,
        len(summary),
    )
    return summary


async def confirm_and_store(
    conversation_id: int,
    summary: str,
    source_role: str = "default",
) -> int:
    """
    用户确认摘要后，双写入 SQLite + ChromaDB。

    Args:
        conversation_id: 源会话 ID
        summary: 经用户确认的摘要文本
        source_role: 归档时的角色（用于软标记）

    Returns:
        memory_id
    """
    # 1. 写入 SQLite memories 表
    memory_id = await create_memory(
        content=summary,
        source_conversation_id=conversation_id,
    )

    # 2. 分块
    chunks = chunk_text(summary)
    if not chunks:
        logger.warning("Summary produced no chunks, skipping vector store write")
        return memory_id

    # 3. 批量向量化
    vectors = await embed_batch(chunks)

    # 4. 写入 ChromaDB（ID 格式: {memory_id}_{uuid8}，保证全局唯一且可读）
    points = []
    for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
        points.append({
            "id": f"{memory_id}_{uuid.uuid4().hex[:8]}",
            "vector": vector,
            "payload": {
                "text": chunk,
                "memory_id": memory_id,
                "source_conversation_id": conversation_id,
                "source_role": source_role,
            },
        })

    try:
        await insert(points)
        logger.info(
            "Archived conv=%d memory_id=%d chunks=%d source_role=%s",
            conversation_id,
            memory_id,
            len(chunks),
            source_role,
        )
    except Exception as e:
        logger.warning(
            "ChromaDB insert failed for memory_id=%d (SQLite record kept): %s",
            memory_id,
            e,
        )

    # 5. 标记会话为已归档（无论 ChromaDB 是否成功，SQLite 记录已写入）
    await mark_archived(conversation_id)

    return memory_id
