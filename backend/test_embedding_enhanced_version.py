"""增强版 Embedding 测试脚本：覆盖多维度语义、否定、多义、长文本及边界情况"""

import asyncio
import sys
import os
import math

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.embedding import get_embedding_provider, embed_text, embed_batch


# ---------- 余弦相似度工具 ----------
def cosine_sim(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na * nb > 0 else 0.0


# ---------- 测试数据集 ----------
ALL_TEXTS = [
    # 基础日常
    "今天天气真不错，适合出去散步。",
    "帮我查一下明天去北京的高铁票。",
    "这个新功能简直是 yyds，太方便了！",
    "哎呀，我不小心把咖啡洒在键盘上了。",
    "周末打算去超市买点日用品，顺便吃个火锅。",

    # 多语言 / 中英混杂
    "帮我查一下今天的 Python 官方文档。",
    "我的 MacBook Pro 突然死机了怎么办？",
    "请帮我总结一下这篇 AI paper 的核心观点。",
    "What is the capital of France?",
    "Can you explain the concept of 'machine learning' in simple terms?",
    "Das ist ein sehr schönes Auto.",

    # 专业术语
    "请解释一下 Transformer 架构中的 Self-Attention 机制。",
    "在量子力学中，薛定谔的猫代表了什么物理概念？",
    "请分析这段代码的时间复杂度和空间复杂度。",
    "什么是 RESTful API 的最佳实践？",
    "通货膨胀对宏观经济和居民消费有什么具体影响？",

    # 代码 / 符号
    "这段 SQL 语句 SELECT * FROM users WHERE age > 18 有问题吗？",
    "如何用 Python 写一个快速排序算法？",
    "报错信息：NullPointerException at line 42，怎么解决？",
    "请解释这行正则表达式：^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
    "JSON 格式：{\"name\": \"Alice\", \"age\": 30, \"isStudent\": false}",

    # 长难句
    "尽管面临着资金短缺、人员流失以及市场需求急剧变化等诸多前所未有的挑战，但核心团队依然凭借着坚韧不拔的毅力和持续不断的创新精神，最终成功跨越了这道看似不可逾越的鸿沟，完成了这个看似不可能的任务。",
    "如果明天下雨，我们就不去爬山了，改为在室内看一部经典的科幻电影，不过前提是你能把那份重要的报告在周五下班前提交给主管。",

    # 数字 / 结构化
    "订单号为 20240807-XYZ-9527 的物流状态显示异常，请联系客服。",
    "联系电话：010-12345678，邮箱：support@example.com。",
    "公式：E = mc^2，其中 E 代表能量，m 代表质量，c 代表光速。",
    "步骤：1. 打开设置；2. 点击账户；3. 选择安全选项；4. 修改密码。",

    # 语义对比专用（用于相似度测试）
    "我喜欢吃苹果，它又脆又甜。",      # 水果苹果
    "苹果公司今天发布了最新的 iPhone 16。",  # 公司苹果
    "香蕉是一种富含钾元素的黄色水果。",  # 同类水果
    "我非常喜欢吃水果，尤其是苹果和香蕉。",
    "今天天气真不错，阳光明媚。",        # 与第一句相似
]


# ---------- 预定义的相似度测试对（包含期望阈值） ----------
SIMILARITY_TEST_CASES = [
    # (text_a, text_b, expected_similarity_lower_bound, description)
    (
        "今天天气真不错，适合出去散步。",
        "今天天气真不错，阳光明媚。",
        0.70,
        "天气相近（同主题，措辞不同）"
    ),
    (
        "我喜欢吃苹果，它又脆又甜。",
        "我非常喜欢吃水果，尤其是苹果和香蕉。",
        0.65,
        "水果偏好（包含关系）"
    ),
    (
        "我喜欢吃苹果，它又脆又甜。",
        "苹果公司今天发布了最新的 iPhone 16。",
        0.35,   # 期望较低，因为多义词应区分
        "多义词区分（水果苹果 vs 公司苹果）"
    ),
    (
        "请解释一下 Transformer 架构中的 Self-Attention 机制。",
        "什么是 RESTful API 的最佳实践？",
        0.30,   # 不同领域，相似度应很低
        "不同技术领域区分"
    ),
    (
        "这个新功能简直是 yyds，太方便了！",
        "哎呀，我不小心把咖啡洒在键盘上了。",
        0.35,   # 情绪褒贬完全不同
        "情绪/场景区分"
    ),
    (
        "What is the capital of France?",
        "Can you explain the concept of 'machine learning' in simple terms?",
        0.40,   # 都是英文问句，但主题完全不同
        "英文不同主题区分"
    ),
    (
        "帮我查一下今天的 Python 官方文档。",
        "如何用 Python 写一个快速排序算法？",
        0.55,   # 都和 Python 相关，但意图不同（查文档 vs 写算法），期望中等偏上但不应太高
        "Python 相关但意图不同"
    ),
]


# ---------- 边界测试 ----------
BOUNDARY_TEXTS = [
    ("", "空字符串"),               # 期望正常处理，不崩溃
    ("A", "单字符"),
    ("  ", "仅空格"),
]


# ---------- 主测试函数 ----------
async def main():
    print("=" * 60)
    print("🔍 Embedding 模块增强测试")
    print("=" * 60)

    # 1. 加载 Provider
    print("\n📦 加载 Embedding Provider ...")
    provider = get_embedding_provider()
    print(f"   类型: {type(provider).__name__}")
    print(f"   向量维度: {provider.dim()}")

    # 2. 单文本基础测试
    print("\n📄 单文本 Embedding 测试 ...")
    sample = "你好，世界"
    vec = await embed_text(sample)
    print(f"   文本: '{sample}' -> 向量长度: {len(vec)}")
    print(f"   前 5 个值: {vec[:5]}")

    # 3. 批量 Embedding（使用所有测试句子）
    print(f"\n📚 批量 Embedding 测试（共 {len(ALL_TEXTS)} 条）...")
    vectors = await embed_batch(ALL_TEXTS)
    print(f"   成功向量化 {len(vectors)} 条")
    for i, (t, v) in enumerate(zip(ALL_TEXTS[:5], vectors[:5])):  # 只打印前5条
        print(f"   [{i}] '{t[:30]}...' -> dim={len(v)}")
    if len(vectors) == len(ALL_TEXTS):
        print("   ✅ 数量匹配")
    else:
        print(f"   ❌ 数量不匹配！期望 {len(ALL_TEXTS)}，实际 {len(vectors)}")

    # 4. 预定义相似度断言测试
    print("\n🧪 语义相似度断言测试 ...")
    all_passed = True
    for idx, (ta, tb, lower_bound, desc) in enumerate(SIMILARITY_TEST_CASES, 1):
        va = await embed_text(ta)
        vb = await embed_text(tb)
        sim = cosine_sim(va, vb)
        passed = sim >= lower_bound
        status = "✅" if passed else "❌"
        print(f"   {status} Case {idx}: {desc}")
        print(f"       '{ta[:20]}...' vs '{tb[:20]}...'")
        print(f"       相似度 = {sim:.4f} (阈值 >= {lower_bound})")
        if not passed:
            all_passed = False

    # 5. 多语言 / 代码混合的额外成对测试（无阈值，仅观察）
    print("\n🌐 多语言 & 代码混合 Embedding 观察（无断言）...")
    extra_pairs = [
        ("What is the capital of France?", "法国的首都是什么？"),
        ("请解释这行正则表达式：^[a-zA-Z0-9_.+-]+@...", "这串字符可能是一个邮箱地址的匹配模式。"),
        ("JSON 格式：{\"name\": \"Alice\"}", "这是一个关于用户信息的 JSON 对象。"),
    ]
    for ta, tb in extra_pairs:
        va = await embed_text(ta)
        vb = await embed_text(tb)
        sim = cosine_sim(va, vb)
        print(f"   '{ta[:15]}...' vs '{tb[:15]}...' -> sim = {sim:.4f}")

    # 6. 长文本压缩测试（只输出统计信息，不设断言，仅观察）
    print("\n📏 长文本向量统计（观察是否坍缩）...")
    long_text = ALL_TEXTS[20]  # 第一个长难句
    v_long = await embed_text(long_text)
    mean_val = sum(v_long) / len(v_long)
    var_val = sum((x - mean_val) ** 2 for x in v_long) / len(v_long)
    print(f"   文本长度: {len(long_text)} 字符")
    print(f"   向量均值: {mean_val:.6f} (理想接近 0)")
    print(f"   向量方差: {var_val:.6f} (不应过小，否则坍缩；也不应过大)")

    # 7. 边界输入测试（空字符串、单字符、空格）
    print("\n🧹 边界输入测试 ...")
    for text, desc in BOUNDARY_TEXTS:
        try:
            v = await embed_text(text)
            print(f"   ✅ '{desc}' -> 向量长度 {len(v)}")
        except Exception as e:
            print(f"   ❌ '{desc}' 抛出异常: {e}")

    # 8. 最终结论
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 所有断言测试通过！Embedding 模块表现良好。")
    else:
        print("⚠️ 存在未通过的断言测试，请检查模型或调整阈值。")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())