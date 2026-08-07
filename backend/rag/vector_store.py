"""
Qdrant 向量库操作模块

职责：
- 封装 Qdrant 客户端的插入、检索、删除操作
- 在应用启动时确保集合存在
- 统一向量维度（由 embedding 模型决定）

与其他模块的关系：
- 被 memory/archiver.py 调用，写入长期记忆
- 被 memory/engine.py 调用，检索相关记忆
- 依赖 models/embedding.py 生成向量
- 依赖 config.py 获取 Qdrant 连接信息
"""

import logging

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointIdsList, PointStruct, VectorParams

from config import get_config

logger = logging.getLogger(__name__)

_client: AsyncQdrantClient | None = None


def get_qdrant_client() -> AsyncQdrantClient:
    """获取 Qdrant 异步客户端单例。"""
    global _client
    if _client is None:
        config = get_config()
        _client = AsyncQdrantClient(host=config.qdrant.host, port=config.qdrant.port)
        logger.info("Qdrant async client created: %s:%s", config.qdrant.host, config.qdrant.port)
    return _client


async def ensure_collection(vector_size: int):
    """
    确保 Qdrant 集合存在，不存在则创建。

    Args:
        vector_size: 向量维度，由 embedding 模型决定
    """
    client = get_qdrant_client()
    config = get_config()
    collection_name = config.qdrant.collection_name

    exists = await client.collection_exists(collection_name)
    if not exists:
        logger.info(
            "Creating Qdrant collection '%s' (vector_size=%d, distance=cosine)",
            collection_name,
            vector_size,
        )
        await client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
        logger.info("Qdrant collection '%s' created", collection_name)
    else:
        # 验证已有 collection 的维度是否匹配当前 embedding 模型
        collection_info = await client.get_collection(collection_name)
        existing_size = collection_info.config.params.vectors.size
        if existing_size != vector_size:
            raise RuntimeError(
                f"Qdrant collection '{collection_name}' exists with vector_size={existing_size}, "
                f"but current embedding model requires vector_size={vector_size}. "
                f"Either delete the collection manually or switch back to the original embedding model."
            )
        logger.info(
            "Qdrant collection '%s' exists (vector_size=%d, matches)",
            collection_name,
            vector_size,
        )


def _resolve_collection(collection_name: str | None = None) -> str:
    """解析集合名，未指定则使用配置中的默认集合。"""
    if collection_name:
        return collection_name
    return get_config().qdrant.collection_name


async def insert(
    points: list[dict],
    collection_name: str | None = None,
) -> None:
    """
    批量插入向量点到 Qdrant。

    Args:
        points: 点列表，每个点包含 id、vector、payload
                例: [{"id": 1, "vector": [...], "payload": {"text": "..."}}]
        collection_name: 集合名，默认使用配置中的
    """
    client = get_qdrant_client()
    coll = _resolve_collection(collection_name)

    point_structs = [
        PointStruct(id=p["id"], vector=p["vector"], payload=p.get("payload", {}))
        for p in points
    ]
    await client.upsert(collection_name=coll, points=point_structs)
    logger.info("Inserted %d points into '%s'", len(point_structs), coll)


async def search(
    query_vector: list[float],
    limit: int = 5,
    score_threshold: float = 0.5,
    collection_name: str | None = None,
) -> list[dict]:
    """
    向量相似度检索。

    Args:
        query_vector: 查询向量
        limit: 返回结果数上限
        score_threshold: 相似度阈值，低于此值的结果被过滤
        collection_name: 集合名

    Returns:
        匹配的 payload 列表，每条包含 payload 和 score，按相似度降序
    """
    client = get_qdrant_client()
    coll = _resolve_collection(collection_name)

    results = await client.search(
        collection_name=coll,
        query_vector=query_vector,
        limit=limit,
        score_threshold=score_threshold,
    )
    logger.info("Search '%s': %d results (threshold=%.2f)", coll, len(results), score_threshold)
    return [
        {"payload": hit.payload, "score": hit.score, "id": hit.id}
        for hit in results
    ]


async def delete(point_ids: list[int], collection_name: str | None = None) -> None:
    """
    删除指定 ID 的向量。

    Args:
        point_ids: 要删除的点 ID 列表
        collection_name: 集合名
    """
    client = get_qdrant_client()
    coll = _resolve_collection(collection_name)

    await client.delete(
        collection_name=coll,
        points_selector=PointIdsList(points=point_ids),
    )
    logger.info("Deleted %d points from '%s'", len(point_ids), coll)
