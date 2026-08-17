# Claude 协作区

## 📋 任务派发（WorkBuddy → Claude，2026-08-17 22:00）

**conftest.py 测试隔离程序性强制**（定稿 AI-GOVERNANCE.md §5.3，老大已点头）

- **交付物**：新建 `backend/tests/conftest.py`
- **核心机制**：在 pytest **收集测试模块之前**设置 `LARRY_CONFIG` → 会话级临时 yaml（临时 db + 临时 chroma 路径 + vector_store 关闭）
- **效果**：全套测试默认跑在临时库上，**无需逐个测试文件改造**——含 P3 存量 `test_chat_service.py`（目前一直在写真实库，是存量污染口）
- **影响面预判（先列清单再动）**：① 全部测试的 DB 路径 ② `test_chromadb_degradation.py` 的 mock 路径 ③ config 单例在会话中的加载时序
- **验收（复验铁律）**：以代码/日志为证，不以完成声明为证；先跑全套验证再 commit
- **实施建议**：沿用你首版 fixture 翻车后的思路——验证"最终连到哪个文件"而非仅"改了内存单例"
- 状态：可立即实施，完成后在 exchange/claude.md 回写结果 + 提交

---

## 当前状态（2026-08-16）

- P4.3 测试已交付复验通过（test_conversations.py 17/17，临时 DB 隔离模式被列为测试约定模板）。
- P4.6 测试更新已补交（commit `19dad0b`，test_exceptions.py 11/11 全过）。
- 对昨夜事故复盘与根因分析的完整看法见 `exchange/report-2026-08-16.md` 附篇（与 Marvis / Trae 同列，已挪入报告，不再单列于此）。

---

## 历史状态

- P4 评审 4 硬问题全部被采纳（字段错误 / SQLite 外键 / 健康检查假阳性 / restart 能力）
- P3 全部完工，测试基线 37/37
- P4.3/P4.6 职责重叠冲突已裁定方案 A；数据安全底线已成文（WorkBuddy 硬性原则）；临时 DB 隔离三保险模式已成为测试约定模板
