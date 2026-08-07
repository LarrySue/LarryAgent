"""
向量库操作模块（ChromaDB 本地持久化）

职责：
- 封装 ChromaDB 的插入、检索、删除操作
- 在应用启动时确保集合存在
- 统一向量维度（由 embedding 模型决定）
- 所有公开函数为 async，内部用 asyncio.to_thread 包装同步 ChromaDB 调用

与其他模块的关系：
- 被 memory/archiver.py 调用，写入长期记忆
- 被 memory/engine.py 调用，检索相关记忆
- 依赖 models/embedding.py 生成向量
- 依赖 config.py 获取向量库配置
"""

import asyncio
import logging
from typing import Any, Optional

import chromadb
from chromadb.config import Settings

from config import get_config

logger = logging.getLogger(__name__)

_client: Optional[Any] = None
_collection: Optional[Any] = None


def _get_client() -> Any:
    """获取 ChromaDB 持久化客户端单例（同步）。"""
    global _client
    if _client is None:
        config = get_config()
        _client = chromadb.PersistentClient(
            path=config.vector_store.path,
            settings=Settings(anonymized_telemetry=False),
        )
        logger.info("ChromaDB client created: path=%s", config.vector_store.path)
    return _client


def _get_collection(collection_name: str | None = None) -> Any:
    """获取或创建集合（同步）。"""
    global _collection
    if _collection is None or _collection.name != collection_name:
        config = get_config()
        coll_name = collection_name or config.vector_store.collection_name
        _collection = _get_client().get_or_create_collection(
            name=coll_name,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("ChromaDB collection ready: '%s'", coll_name)
    return _collection


async def ensure_collection(vector_size: int):
    """
    确保向量集合存在，不存在则创建。
    ChromaDB 的集合是 schema-free 的，不需要预先指定维度。

    Args:
        vector_size: 向量维度，由 embedding 模型决定（仅用于日志记录）
    """
    coll = await asyncio.to_thread(_get_collection)
    count = await asyncio.to_thread(coll.count)
    logger.info(
        "ChromaDB collection '%s' ready (vector_size=%d, existing=%d)",
        coll.name,
        vector_size,
        count,
    )


async def insert(
    points: list[dict],
    collection_name: str | None = None,
) -> None:
    """
    批量插入向量点到 ChromaDB。

    Args:
        points: 点列表，每个点包含 id、vector、payload
                例: [{"id": 1, "vector": [...], "payload": {"text": "..."}}]
        collection_name: 集合名，默认使用配置中的
    """
    coll = await asyncio.to_thread(_get_collection, collection_name)

    ids = [str(p["id"]) for p in points]
    embeddings = [p["vector"] for p in points]
    metadatas = [p.get("payload", {}) for p in points]

    await asyncio.to_thread(
        coll.upsert,
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
    )
    logger.info("Inserted %d points into '%s'", len(points), coll.name)


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
        score_threshold: 相似度阈值（余弦相似度），低于此值的结果被过滤
        collection_name: 集合名

    Returns:
        匹配的 payload 列表，每条包含 payload、score 和 id，按相似度降序
    """
    coll = await asyncio.to_thread(_get_collection, collection_name)

    results = await asyncio.to_thread(
        coll.query,
        query_embeddings=[query_vector],
        n_results=limit,
    )

    # ChromaDB 返回 distances（余弦距离 = 1 - 相似度），转换为相似度
    outputs = []
    if results["ids"] and results["ids"][0]:
        for i, point_id in enumerate(results["ids"][0]):
            distance = results["distances"][0][i] if results["distances"] else 1.0
            similarity = 1.0 - distance  # cosine distance → cosine similarity
            if similarity >= score_threshold:
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                outputs.append({
                    "id": int(point_id),
                    "payload": metadata,
                    "score": round(similarity, 4),
                })

    # 按相似度降序
    outputs.sort(key=lambda x: x["score"], reverse=True)
    logger.info(
        "Search '%s': %d results (threshold=%.2f)",
        coll.name,
        len(outputs),
        score_threshold,
    )
    return outputs


async def delete(point_ids: list[int], collection_name: str | None = None) -> None:
    """
    删除指定 ID 的向量。

    Args:
        point_ids: 要删除的点 ID 列表
        collection_name: 集合名
    """
    coll = await asyncio.to_thread(_get_collection, collection_name)
    str_ids = [str(pid) for pid in point_ids]
    await asyncio.to_thread(coll.delete, ids=str_ids)
    logger.info("Deleted %d points from '%s'", len(point_ids), coll.name)


async def delete_by_memory_id(memory_id: int, collection_name: str | None = None) -> None:
    """
    按 memory_id 删除关联的所有向量分块。

    Args:
        memory_id: 记忆 ID（metadata 中的 memory_id 字段）
        collection_name: 集合名
    """
    coll = await asyncio.to_thread(_get_collection, collection_name)
    await asyncio.to_thread(coll.delete, where={"memory_id": memory_id})
    logger.info("Deleted vectors for memory_id=%d from '%s'", memory_id, coll.name)
