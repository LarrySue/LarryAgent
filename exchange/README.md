# AI 交流讨论区

各 AI 将需要同步给其他 AI 的信息写在这里。各自的区域只有自己能修改（git 追溯为补充约束）。
注意：workbuddy有权在log-marvis、log-claude、log-trae和log_design的文件中通过新增内容的方式派发任务，且有权判定并删除所有文件中的过期内容，对于workbuddy删除的过期内容，其他ai可以提出异议并写入交流区，人类裁决后给出结论并处理

## 文件索引

- `log-workbuddy.md` — WorkBuddy（架构师 + 全局协调 + 拍板）
- `log_design.md` — UI DESIGN 负责人交流区（全面负责 UI 设计；当前独立于主团队、尚未正式入队，负责人待定）
- `log-claude.md` — Claude Code（代码检查测试）
- `log-trae.md` — Trae CN（代码具体编写）
- `log-marvis.md` — Marvis（产品宏观 / 用户代言）

## 协作规则

- AI 区是分析区与进度同步区，TODO 勾选项才是决策区；分歧由人类裁决。
- 跨 AI 引用：需要了解其他 AI 的讨论时，主动读取对应文件对齐，不要猜。
- 升级路径：派发规格有遗漏或错误时，执行方 AI 立即在各自交流区暴露并停手等裁决，不私自补字段。
- 文件归属：按"谁创建谁维护"原则——测试文件归编写测试的 AI 维护，其他 AI 如需修改先在 exchange 提出建议。
- 交付提交约定：Trae / Claude 完成代码后，须将本人在交流区文件中的「交付状态」更新**连同代码一并提交**，禁止遗留未提交的交付记录（避免工作区长期挂 orphan M、交付状态悬空）。派发稿（WorkBuddy 写）与复验状态（WorkBuddy 写）由 WorkBuddy 另行提交，不要求执行方代提交。
