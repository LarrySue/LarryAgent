# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）


## 2026-09-16 · 精简候选摸底（老大指令「跑一次精简候选摸底」）

**方法**：全仓 md 文件行数统计 + 关键文件头部状态核查 + 引用面扫描。聚焦 exchange/ 讨论稿（最易积压区）与 docs/ 大型文档。

### 高置信建议（4 项，按动作成本排序）

**S1. `exchange/deployment-architecture.md` (191 行) → archive/**
- 状态明确：「方案（待DSH迁移完成后重新制定）」，DSH-3 进行中，短期不会完
- 留在 exchange（活区）误导读者以为是活跃方案
- 建议动作：`git mv` 到 `archive/deployment-architecture-2026-09-03.md`，更新 exchange/README + 根 README :185 + TODO :290 引用

**S2. `exchange/capability-tree-revision.md` (250 行) — 7/8 已批但未执行**
- 老大 2026-09-15 已批 7/8 提案（仅 2.5.2 web_fetch 暂缓）
- grep `docs/product-positioning.md` 无引用 → 变更未落地
- 建议动作：拍板是让 WB 执行已批部分并归档/删除此稿，还是继续等待

**S3. `exchange/web-search-design.md` (394 行) — 17 天未展开讨论**
- 生成 2026-08-29，内容详尽（provider 对比/MCP 集成/延迟数据）
- exchange/README 标记「尚未展开讨论」
- 建议动作：确认是等待审阅还是已放弃？若放弃 → archive；若等待 → 标注状态

**S4. `exchange/discussion-time-context.md` (531 行) — 卡在看齐循环 13 天**
- 状态：「待各方对更新后的结论区表态『同意/有异议』」，自 2026-09-03
- 531 行详尽讨论，无 AI 签字确认
- 建议动作：推动签字并移入 docs/，或归档讨论、只提取结论到 docs/

### 中置信观察（2 项，仅备注）

- `docs/dsh/` 探针报告三份（claude/qoder/trae, ~525 行）：按设计拆分（不同 AI 视角），可保持现状，除非想统一视角
- `exchange/log-workbuddy.md` (155+ 行)：WB 活日志，按「不留痕」原则可清理，但 WB 自管

### 不建议动

- 三份环境文档（production/test/local-env，按设计对仗拆分）
- `archive/roadmap-history.md`（锁定区历史）
- AI 约束文件（.claude/.trae/.qoder，按角色拆分）
- exchange/logs（活日志，由老大按需清理）

**待老大裁决汇总**：S1（归档）→ S2（执行或继续等）→ S3/S4（状态澄清）→ S5/S6（备知）。

**老大结论（2026-09-16）**：都不是大问题，文档体系基本健康。四个候选项均为锦上添花级别，不急。