# LarryAgent TODO

## 待讨论 / 待决策

- [x] AI 提示词（system_prompt）当前为简陋版本，后续需要用户自行完善。20260807，已确定为bge-small-zh-v1.5
- [x] Embedding 模型选型：已确定 bge-small-zh-v1.5（512 维），矢量化测试通过。已知限制：中文多义词区分能力中等（0.46），后续可升级 bge-base（768 维），但需重建 ChromaDB collection + 全量重索引
- [ ] 长记忆检索参数（top_k、score_threshold 等）需要持续优化以平衡成本与效果
- [ ] 记忆保鲜机制：memories 表预留 last_hit_at / priority 字段，后续需实现降权与淘汰策略
- [ ] 更换 Embedding 模型时需配套迁移脚本（重建 ChromaDB collection + 全量重索引）

## 架构演进：多场景 AI 设计

- [x] AI 角色场景化：支持多套 system prompt 模板（健康管理、工作协助、代码编写、财务分析、阅读探讨等），通过 config.yaml 的 roles 配置定义。已配置 4 个角色：default / code / health / finance
  - [x] 切换策略：P1 阶段已支持手动切换（/api/chat 接收 role 字段），按角色加载 system prompt；P2 再加自动判断（轻量 LLM 调用）
- [ ] 意图识别机制：对话开头快速分类用户意图（关键词匹配或轻量 LLM 调用），决定激活哪个角色和对应工具组
- [ ] 记忆软标记：在 ChromaDB metadata 中记录 source_role（产生记忆时的角色），检索时不硬过滤，仅用于排序加权；语义匹配天然区分场景，一条记忆跨多场景不受限（P1.5 归档流程中实现）
- [x] 工具分组与按需加载：tools 表已新增 group_name 字段（core / 领域工具），核心工具始终可用，领域工具按场景动态注入 function calling schema，避免 prompt 膨胀和选择困难
- [ ] 跨域关联能力：记忆检索时不限制单一领域，允许 AI 发现跨场景因果链（如工作压力 → 睡眠差 → 健康下降），可在 system prompt 中鼓励这种关联思考
- [ ] 用户画像沉淀：长期积累后从记忆中提炼结构化用户画像（性格特征、决策偏好、生活习惯），作为额外上下文注入所有场景的 system prompt
- [ ] 场景间信息同步策略：明确哪些记忆是全局共享、哪些是领域私有，避免财务细节污染健康对话或反之

## P2 - P4

- 尚未讨论，暂不列入
