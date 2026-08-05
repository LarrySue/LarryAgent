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

from config import get_config


async def embed_text(text: str) -> list[float]:
    """
    将单段文本转换为向量。

    Args:
        text: 输入文本

    Returns:
        浮点数向量列表
    """
    # TODO: 根据 config.embedding.provider 选择实现
    #   - openai: 调用 OpenAI Embeddings API
    #   - local: 加载本地 ONNX/SentenceTransformers 模型
    config = get_config()
    if config.embedding.provider == "openai":
        # TODO: 调用 openai.Embeddings.create()
        raise NotImplementedError("OpenAI embedding not yet implemented")
    elif config.embedding.provider == "local":
        # TODO: 加载本地模型并推理
        raise NotImplementedError("Local embedding not yet implemented")
    else:
        raise ValueError(f"Unknown embedding provider: {config.embedding.provider}")


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    批量将文本转换为向量。

    Args:
        texts: 输入文本列表

    Returns:
        向量列表，每个向量对应一个输入文本
    """
    # TODO: 批量调用 embedding API，减少网络往返
    #   OpenAI 单次最多 2048 条，需分批处理
    results = []
    for text in texts:
        vec = await embed_text(text)
        results.append(vec)
    return results
