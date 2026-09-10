"""DSH-2.5 task 5 (Python side): embed a fixed text batch with the SHIPPED stack.

The shipped backend uses sentence-transformers (PyTorch) with BAAI/bge-small-zh-v1.5,
whose sentence-transformers config is CLS pooling + L2 Normalize (512-dim).
We record the exact model, dim, and vectors for a byte-level comparison against
the TS side.

Run:  python python-embed.py <out.json>
"""
from __future__ import annotations

import json
import os
import sys
import time

TEXTS = [
    "你好，世界",
    "LarryAgent 是一个本地 AI 助手项目",
    "记忆检索使用向量相似度",
    "用户偏好：喜欢简洁的回答",
    "今天天气不错，适合出门散步",
    "The quick brown fox jumps over the lazy dog",
    "向量维度必须与 embedding 模型一致",
    "2026-09-10 15:30:00",
    "混合 English 和中文 的 sentence",
    "数据库使用 SQLite 和 ChromaDB 双写",
    "这是一个比较长的句子，用来测试模型在处理较长文本时的向量稳定性，包含多个从句、修饰成分以及一些重复出现的词汇，例如记忆、检索、向量、相似度等术语。",
    "短",
    "空字符串的邻居",
    "开饭啦",
]


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "python-vectors.json"
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    from sentence_transformers import SentenceTransformer

    model_name = "BAAI/bge-small-zh-v1.5"
    t0 = time.time()
    model = SentenceTransformer(model_name)
    load_s = time.time() - t0
    dim = model.get_embedding_dimension()

    t1 = time.time()
    vectors = model.encode(TEXTS, normalize_embeddings=True, batch_size=8)
    encode_s = time.time() - t1

    payload = {
        "side": "python",
        "stack": "sentence-transformers (PyTorch)",
        "st_version": __import__("sentence_transformers").__version__,
        "model": model_name,
        "dim": int(dim),
        "normalize": True,
        "pooling": "cls (from modules.json 1_Pooling/config.json)",
        "load_seconds": round(load_s, 3),
        "encode_seconds": round(encode_s, 3),
        "texts": TEXTS,
        "vectors": [list(map(float, v)) for v in vectors],
    }
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)
    print(f"python side: dim={dim} texts={len(TEXTS)} load={load_s:.2f}s encode={encode_s:.2f}s -> {out_path}")


if __name__ == "__main__":
    main()
