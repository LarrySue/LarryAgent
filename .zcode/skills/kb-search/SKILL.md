---
name: kb-search
description: 语义检索 LarryAgent 知识库——当需要「意思相近但字面不同」的跨文件查找、聚合同一概念的所有讨论、或 grep 无果时使用。本地工具，返回 file:line 线索，引用前必须回读正本。
---

# kb-search — 语义检索（knowledge engine）

## 触发条件

- grep 无果但坚信内容存在（字面不同、意思相近的表述）
- 聚合类问题：「哪些地方讨论过 X」「X 相关的口径散落在哪几份文档」
- 新会话冷启动摸底：某主题在项目里的讨论地图
- **分工口径（Qoder 10-19 实测）**：**关键词已知 → grep 更准**（实测反例：查「退出安全网」kb 未命中 `roadmap-history.md:590`、grep 一击命中——正文用词零重叠是双刃剑）；**怀疑自己的词不对 → kb 先行**（实测战果：Qoder 五跳没找到的〈判据写法纪律〉，kb 一跳命中）；**不适用**：已知关键词的精确查找；查 log/TODO（已排除在索引外，直接读文件）

## 做法

```
python "D:/AI Work/knowledge engine/kb.py" search "<查询文本>" -p LarryAgent -k 8
```

- 另有 `-p larryagent-ref`（只索引 `ref/` 参考资料，治理类查询默认不用，DSH 插件策展用）
- 首次调用若提示无索引，跑 `python "D:/AI Work/knowledge engine/kb.py" rebuild -p LarryAgent`
- 输出格式：`#序号 分数 绝对路径:起始行-结束行 [标题路径] + 片段预览`
- 命中 `HUMAN*.md` 行尾带 ⚠️ 标记＝体系外收纳区，⛔ 不作项目口径依据
- 结构：根目录 `kb.py` ＝通用引擎（多项目共用）；`LarryAgent/` ＝本项目的配置(kb.json)与索引(indexes/)。改排除规则后跑 `sync -p LarryAgent` 秒级生效，不必 rebuild。

## 已知坑

1. **命中只是 🟡 级线索**——引用任何内容前必须 Read 对应 file:line 正本核对，与「背诵不可信，验证读盘」同一条纪律。
2. 分数基线 ~0.45-0.5 属无关水位，判读看排序不看绝对分。
3. bge-small 是主题级模型：意图级查询（推理链长的）可能偏航，换措辞重试或退回 grep。
4. `archive/qoder-work-historical-record.md` 是大块过程日志，检索噪声源，命中时注意甄别。
5. 索引损坏/账实不符：删 `LarryAgent/indexes/` 下两件后跑 rebuild（约 9 分钟）；日常无需维护（懒更新自动同步）。
