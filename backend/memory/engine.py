"""
记忆引擎模块

职责：
- 短期记忆：调用 db/conversations.py 加载当前会话的最近 N 条消息
- 长期记忆：对用户查询做向量检索，召回相关历史记忆
- 合并后注入到 LLM 的系统提示中

与其他模块的关系：
- 被 api/chat.py 调用，在模型调用前检索记忆
- 依赖 db/conversations.py 读取消息历史
- 依赖 rag/vector_store.py 检索长期记忆
- 依赖 models/embedding.py 生成查询向量
"""

import logging

from config import get_config
from db.conversations import get_messages

logger = logging.getLogger(__name__)


async def get_short_term_memory(
    conversation_id: int,
    max_messages: int = 20,
) -> list[dict]:
    """
    获取当前会话的最近消息作为短期记忆。

    Args:
        conversation_id: 会话 ID
        max_messages: 最多取多少条消息

    Returns:
        消息列表，每条包含 role 和 content
    """
    return await get_messages(conversation_id, limit=max_messages)


async def get_long_term_memory(
    query: str,
    top_k: int = 5,
    score_threshold: float = 0.3,
) -> list[str]:
    """
    根据用户查询检索相关的长期记忆。

    Args:
        query: 用户当前消息文本
        top_k: 返回最相关的记忆条数
        score_threshold: 相似度阈值，低于此值的结果被过滤

    Returns:
        相关记忆文本列表（从 payload.text 字段提取）

    ⚠️ **为何默认 0.3**（WHY 注，勿只记数值）：本地 bge-small-zh 实测——弱相关／不相关对
    可打到 0.43~0.50，而真相关的短查询↔归档摘要只有 0.3573，两带**重叠** ⇒ 用 0.5 会滤掉
    真命中；记忆量小的阶段**宁可多召回、不可漏召回**，故取 0.3（召回优先于精度的刻意取舍）。
    根据 = `tests/test_embedding_enhanced_version.py` 的 `SIMILARITY_TEST_CASES` ＋
    `tests/test_embedding.py` 的相似度对照（两脚本为**阈值标定器材**，可复跑）；
    史料 `archive/qoder-work-historical-record.md:16478` 区；结论落点 `docs/product-positioning.md` 2.4.2。
    ⚠️ 注意 `rag/vector_store.py` 的 `search()` 默认阈值是 **0.5**，与本函数不一致——
    调用方须显式传参（本函数内对 `search()` 的调用即显式传 `score_threshold`）；
    默认值去留属代码层，待老大裁。
    """
    # 开关关闭时跳过长期记忆召回：不加载 embedding、不建 ChromaDB 客户端
    # （与 api/memory.py:136 的写法保持一致，放在入口拦截以覆盖所有调用方）
    if not get_config().vector_store.enabled:
        return []
    try:
        from models.embedding import embed_text
        from rag.vector_store import search

        query_vector = await embed_text(query)

        results = await search(
            query_vector=query_vector,
            limit=top_k,
            score_threshold=score_threshold,
        )

        # 从 payload 中提取 text 字段作为记忆内容
        memories = [r["payload"]["text"] for r in results if "text" in r.get("payload", {})]
        logger.info("Long-term memory search: %d results for query=%r", len(memories), query[:30])
        return memories
    except Exception as e:
        logger.warning("Long-term memory search failed: %s", e)
        return []


def build_memory_context(
    short_term: list[dict],
    long_term: list[str],
    system_prompt: str = "",
) -> list[dict]:
    """
    构造注入记忆后的消息列表，作为 LLM 的输入。

    Args:
        short_term: 短期记忆（最近消息）
        long_term: 长期记忆文本列表
        system_prompt: 基础系统提示

    Returns:
        完整的 messages 列表，可直接传给 LLM
    """
    memory_section = ""
    if long_term:
        memory_section = "\n\n## 相关历史记忆\n" + "\n".join(f"- {m}" for m in long_term)

    messages = []
    full_system = system_prompt + memory_section
    if full_system.strip():
        messages.append({"role": "system", "content": full_system.strip()})
    messages.extend(short_term)
    return messages
