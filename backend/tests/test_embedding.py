"""
手动脚本：验证 Embedding 模块（**非 pytest 用例** —— 无 test_ 函数，不参与 `pytest tests/`）。

运行方式：`python tests/test_embedding.py`（会调真实 Embedding API）。
⚠️ 末尾 `asyncio.run(main())` 必须留在 `__main__` 守卫内：否则 pytest 收集时
import 即执行（真网络调用），代理不通会让**整个测试会话在收集阶段**报错中断。

📌 **史料价值 —— 本脚本属「阈值标定器材」，⛔ 勿当废脚本清理**：脚本内 `=== 相似度测试 ===`
段的余弦对照（`我喜欢吃苹果` / `我爱吃水果` / `Python 编程` 三对）与
`test_embedding_enhanced_version.py` 里的预定义断言表 `SIMILARITY_TEST_CASES`（`:71-113`，
带期望下界）一起，构成召回阈值
`score_threshold = 0.3`（消费方 `memory/engine.py:44`）的经验根据：**弱相关／不相关对实测可打到
0.43~0.50**（苹果 vs 公司苹果 0.46、跨领域 0.50、英文不同主题 0.4339、跨语言 0.4448），
而**真相关**的短查询↔归档摘要只有 **0.3573** ⇒ 两带重叠 ⇒ 若取 0.5 必滤真命中 ⇒ 取 0.3
（**召回优先于精度**的刻意取舍）。史料：`archive/qoder-work-historical-record.md`——
0.3573 论证见 `:16478` 区（P1.6 端到端测试），0.43~0.50 读数与小结见 `:9637`／`:10251-10298` 区。
结论落点：`docs/product-positioning.md` 2.4.2。两个脚本均可复跑复现。
"""
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


if __name__ == "__main__":
    asyncio.run(main())
