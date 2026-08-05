"""
文本分块模块

职责：
- 将长文本切分为适合向量化的短片段
- 支持固定大小分块和语义分块两种策略
- 保证块之间有重叠，避免信息断裂

与其他模块的关系：
- 被 memory/archiver.py 调用，切分归档内容
"""


def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 100,
) -> list[str]:
    """
    将文本按固定大小切分为多个块。

    Args:
        text: 输入文本
        chunk_size: 每块的最大字符数
        chunk_overlap: 相邻块之间的重叠字符数

    Returns:
        文本块列表
    """
    # TODO: 实现真正的分块逻辑
    #   - 按 chunk_size 切分
    #   - 尽量在句子边界（句号、换行）处断开
    #   - 块之间保留 overlap 字符的重复
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        # 尝试在最近的分隔符处断开
        if end < len(text):
            for sep in ["\n\n", "\n", "。", ".", " ", ""]:
                pos = text.rfind(sep, start, end)
                if pos > start + chunk_size // 2:
                    end = pos + len(sep)
                    break
        chunks.append(text[start:end])
        start = end - chunk_overlap
    return chunks


def semantic_chunk(text: str, max_chunk_size: int = 1000) -> list[str]:
    """
    语义分块：按自然段落边界切分，保持语义完整性。

    Args:
        text: 输入文本
        max_chunk_size: 单块最大字符数，超长的块会被强制再切

    Returns:
        文本块列表
    """
    # TODO: 实现语义分块
    #   - 优先按双换行（段落）切分
    #   - 段落过长时降级为固定大小切分
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) > max_chunk_size and current:
            chunks.append(current.strip())
            current = para
        else:
            current += "\n\n" + para if current else para
    if current:
        chunks.append(current.strip())
    return chunks
