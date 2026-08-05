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
4. 用户确认后 → 分块 → 向量化 → 写入 Qdrant + SQLite

与其他模块的关系：
- 被 api/memory.py 调用
- 依赖 db/database.py 读取会话消息、写入 memories 表
- 依赖 models/llm.py 生成摘要
- 依赖 models/embedding.py + rag/vector_store.py 写入向量
- 依赖 rag/chunker.py 分块
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
    # TODO: 实现归档逻辑
    #   1. 从 messages 表加载完整对话历史
    #   2. 构造提示词，让 LLM 提取：
    #      - 用户表达了哪些偏好/习惯
    #      - 做出了哪些决策
    #      - 有哪些值得记住的事实信息
    #   3. 返回结构化摘要（Markdown 格式）
    raise NotImplementedError("Archive summary generation not yet implemented")


async def confirm_and_store(
    conversation_id: int,
    summary: str,
):
    """
    用户确认摘要后，存储到长期记忆。

    Args:
        conversation_id: 源会话 ID
        summary: 经用户确认的摘要文本
    """
    # TODO: 实现存储逻辑
    #   1. 将 summary 写入 SQLite memories 表
    #   2. 调用 chunker 对摘要分块
    #   3. 对每个块调用 embedding 生成向量
    #   4. 将向量写入 Qdrant
    #   5. 标记 conversation 的 is_archived = 1
    raise NotImplementedError("Archive storage not yet implemented")
