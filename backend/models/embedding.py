"""
Embedding 向量化模块

职责：
- 将文本转换为向量，供 RAG 检索使用
- 支持云端 API（OpenAI 兼容）和本地模型两种模式
- 统一接口，调用方无需关心底层实现

与其他模块的关系：
- 被 rag/vector_store.py 调用，在写入和检索时生成向量
- 被 memory/archiver.py 调用，生成记忆摘要的向量
- 依赖 config.py 获取 embedding 配置
"""

import asyncio
import logging
import os
from abc import ABC, abstractmethod

from config import get_config

logger = logging.getLogger(__name__)


class EmbeddingProvider(ABC):
    """Embedding 提供商抽象基类，便于更换底层实现。"""

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """批量将文本转换为向量。"""
        ...

    @abstractmethod
    def dim(self) -> int:
        """返回向量维度。"""
        ...


class LocalEmbedding(EmbeddingProvider):
    """基于 Sentence-Transformers 的本地 Embedding 实现。"""

    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(model_name)
        self._dim = self._model.get_embedding_dimension()
        logger.info(
            "Local embedding model loaded: %s (dim=%d)", model_name, self._dim
        )

    async def embed(self, texts: list[str]) -> list[list[float]]:
        loop = asyncio.get_running_loop()
        vectors = await loop.run_in_executor(None, self._model.encode, texts)
        return vectors.tolist()

    def dim(self) -> int:
        return self._dim


class OpenAIEmbedding(EmbeddingProvider):
    """OpenAI 兼容的 Embedding API 实现。"""

    def __init__(self, api_key: str, base_url: str, model: str):
        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._model = model
        self._dim = 1536  # 默认值，实际维度取决于模型
        logger.info("OpenAI embedding client created: model=%s", model)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        all_vectors = []
        batch_size = 2048
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = await self._client.embeddings.create(
                model=self._model,
                input=batch,
            )
            all_vectors.extend([item.embedding for item in response.data])
        return all_vectors

    def dim(self) -> int:
        return self._dim


_provider: EmbeddingProvider | None = None


def get_embedding_provider() -> EmbeddingProvider:
    """获取或创建 Embedding 提供商单例。"""
    global _provider
    if _provider is None:
        _provider = _create_provider()
    return _provider


def _create_provider() -> EmbeddingProvider:
    """根据配置创建对应的 Embedding 提供商。"""
    config = get_config()
    embedding_cfg = config.embedding

    if embedding_cfg.provider == "local":
        model_name = (
            embedding_cfg.local_model_name or "BAAI/bge-small-zh-v1.5"
        )
        if embedding_cfg.hf_endpoint:
            os.environ["HF_ENDPOINT"] = embedding_cfg.hf_endpoint
            logger.info("Using HF mirror: %s", embedding_cfg.hf_endpoint)
        logger.info("Creating local embedding provider: %s", model_name)
        return LocalEmbedding(model_name)

    elif embedding_cfg.provider == "openai":
        if not embedding_cfg.api_key:
            raise ValueError("Embedding API key not configured for openai provider")
        # base_url 优先级：embedding.base_url > deepseek.base_url > 默认
        base_url = embedding_cfg.base_url
        if not base_url:
            deepseek_cfg = config.models.get("deepseek")
            base_url = (
                deepseek_cfg.base_url
                if deepseek_cfg
                else "https://api.deepseek.com"
            )
        logger.info(
            "Creating OpenAI embedding provider: model=%s base_url=%s",
            embedding_cfg.model,
            base_url,
        )
        return OpenAIEmbedding(
            api_key=embedding_cfg.api_key,
            base_url=base_url,
            model=embedding_cfg.model,
        )

    else:
        raise ValueError(
            f"Unknown embedding provider: {embedding_cfg.provider}"
        )


async def embed_text(text: str) -> list[float]:
    """将单段文本转换为向量（便捷函数）。"""
    provider = get_embedding_provider()
    vectors = await provider.embed([text])
    return vectors[0]


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """批量将文本转换为向量（便捷函数）。"""
    provider = get_embedding_provider()
    return await provider.embed(texts)
