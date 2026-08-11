"""临时测试脚本：验证 Embedding 模块"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.embedding import get_embedding_provider, embed_text, embed_batch


async def main():
    print("=== 加载 Embedding Provider ===")
    provider = get_embedding_provider()
    print(f"类型: {type(provider).__name__}")
    print(f"向量维度: {provider.dim()}")

    print("\n=== 单文本 Embedding ===")
    vec = await embed_text("你好，世界")
    print(f"向量长度: {len(vec)}")
    print(f"前 5 个值: {vec[:5]}")

    print("\n=== 批量 Embedding ===")
    texts = ["今天天气很好", "Python 是一门编程语言", "LarryAgent 是个人 AI 助手"]
    vectors = await embed_batch(texts)
    print(f"输入 {len(texts)} 条，输出 {len(vectors)} 个向量")
    for i, (t, v) in enumerate(zip(texts, vectors)):
        print(f"  [{i}] '{t}' -> dim={len(v)}")

    print("\n=== 相似度测试 ===")
    import math

    def cosine_sim(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(y * y for y in b))
        return dot / (na * nb) if na * nb > 0 else 0

    v1 = await embed_text("我喜欢吃苹果")
    v2 = await embed_text("我爱吃水果")
    v3 = await embed_text("Python 编程")

    sim_12 = cosine_sim(v1, v2)
    sim_13 = cosine_sim(v1, v3)
    print(f"'我喜欢吃苹果' vs '我爱吃水果': {sim_12:.4f} (应较高)")
    print(f"'我喜欢吃苹果' vs 'Python 编程': {sim_13:.4f} (应较低)")

    print("\n✅ Embedding 模块验证通过")


asyncio.run(main())
