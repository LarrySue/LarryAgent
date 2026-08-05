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

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from config import get_config

_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """获取 Qdrant 客户端单例。"""
    global _client
    if _client is None:
        config = get_config()
        _client = QdrantClient(host=config.qdrant.host, port=config.qdrant.port)
    return _client


async def ensure_collection(vector_size: int = 1536):
    """
    确保 Qdrant 集合存在，不存在则创建。
    vector_size 默认 1536（text-embedding-3-small）。

    Args:
        vector_size: 向量维度，与 embedding 模型匹配
    """
    client = get_qdrant_client()
    config = get_config()
    collection_name = config.qdrant.collection_name

    # TODO: 检查集合是否存在，不存在则创建
    #   如果已存在但维度不匹配，需要删旧建新
    if not client.collection_exists(collection_name):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )


async def insert(
    points: list[dict],
    collection_name: str | None = None,
):
    """
    批量插入向量点到 Qdrant。

    Args:
        points: 点列表，每个点包含 id、vector、payload
                例: [{"id": 1, "vector": [...], "payload": {"text": "..."}}]
        collection_name: 集合名，默认使用配置中的
    """
    # TODO: 实现批量插入逻辑
    #   - 构造 PointStruct 列表
    #   - 调用 client.upsert()
    #   - 处理插入失败的点
    raise NotImplementedError("Vector store insert not yet implemented")


async def search(
    query_vector: list[float],
    limit: int = 5,
    score_threshold: float = 0.7,
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
        匹配的 payload 列表，按相似度降序
    """
    # TODO: 实现向量检索逻辑
    #   - 调用 client.search()
    #   - 按 score_threshold 过滤
    #   - 返回 payload 中的文本内容
    raise NotImplementedError("Vector store search not yet implemented")


async def delete(point_ids: list[int], collection_name: str | None = None):
    """
    删除指定 ID 的向量。

    Args:
        point_ids: 要删除的点 ID 列表
        collection_name: 集合名
    """
    # TODO: 实现删除逻辑
    raise NotImplementedError("Vector store delete not yet implemented")
