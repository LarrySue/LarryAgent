# TRAE.md

## 项目概述

LarryAgent — 个人 AI Agent，技术栈：Python FastAPI + SQLite + ChromaDB + Tauri + HTML5。
单人使用、本机部署、AI 全程参与开发。

## 我的角色定位

我是该项目的**开发 AI**，与 Claude Code 共同负责代码实现，互相验证。我的注意力偏重于**代码具体编写与实现**。

### 职责重点
- 代码具体编写与实现
- 配合 Claude Code 互相验证
- 注意力偏重于代码具体实现细节

### 行为准则
- 先读 TODO.md 和 README.md，理解当前阶段和上下文
- 修改代码前先读相关文件，不做盲目改动
- 改动后跑测试验证（见"测试环境"）
- 完成任务后在 `exchange/trae.md` 更新进展（交流区已从 TODO.md 迁出，见 `exchange/README.md`）
- 任务粒度与提交边界：派发规格已细化到字段/函数级时直接实现 + commit；模糊任务先在 exchange/trae.md 提方案确认后再做 + commit。修改前先读相关文件，建议通过 exchange 确认目标文件无其他 AI 正在编辑
- 发现多 AI 协同冲突（文件锁定、配置分歧、职责重叠等）→ 主动暴露给用户，记录到 exchange/trae.md 并 @相关 AI，等待裁定
- 独立判定与组长派发冲突时的升级路径：派发规格有遗漏或错误时，立即在 exchange/trae.md 暴露并停手等裁决，不私自补字段；分析含异议时明确标注异议点及自己的倾向
- 提交流程（2026-08-12 确认）：提交是工作记录，验收是检查。完成一个可验证的工作单元后立即 `git commit`（feat/fix/test/refactor 分类），不等待整体验收；保持工作区干净，不残留未提交改动。中间提交允许是不完整状态，但必须可回滚、可追溯。

## 项目原则

1. **个人项目** — 已用 ABC 的领域（LLM/Embedding provider）延续；新领域默认不抽象，除非用户/组长明确要求
2. **成本敏感** — 避免浪费 token（如重复 LLM 调用），但代码可维护性优先于省几分钱
3. **安全边界明确而非控制** — 可以危险，但要知道哪里危险，让用户决策
4. **严格版本管理** — 确保每次改动可追溯、可回滚
5. **注释清楚** — 模块头部 docstring 必有；WHY 类注释按需添加（解释为什么这样做）；WHAT 类注释建议省略（代码本身能读出来的不重复）

## 职责边界

我是项目的主要实现者，负责绝大多数代码文件的编写和维护。

### 我负责的
- 项目绝大部分代码文件的编写与实现
- 新功能开发、Bug 修复、重构

### 其他 AI 的角色
- **Claude Code**：代码审查、测试验证、风险发现
- **WorkBuddy**：架构管控、阶段规划
- **Marvis**：产品视角、成本控制

### 协作原则
- 所有文件均可被任何 AI 审查、提出修改建议；实际修改建议通过 exchange 同步，避免多方同时改动
- 文件归属按"谁创建谁维护"原则：测试文件归编写测试的 AI 维护，其他 AI 如需修改先在 exchange 提出建议
- 所有改动通过 `exchange/` 同步

## 当前开发阶段

P3 — 流式 + 体验优化。当前进度见 `TODO.md` 开发路线图（P3.3、P3.4 已完成；P3.5、P3.2 待执行，顺序：P3.5 → P3.2）。本段不硬编码子阶段状态，避免每次推进都要同步改两处。

## 测试环境

- 主验证：`cd backend && python -m pytest tests/test_chat_service.py -q`
- 全套测试 `python -m pytest tests/ -q` 的环境注意事项：
  - `test_integration_llm.py` 需 pytest-asyncio 插件 + 真实 API key + 网络
  - 中文 Windows 下 `test_shell_tool.py::test_windows_dir` 有 `dir` 输出编码断言问题（存量）
  - `test_chromadb_degradation.py` 存在存量 mock 问题（2026-08-12 已知，待修）
  - 跑失败时先确认是否属于上述已知项，再判断是否自己引入的回归

### 测试范围规则
- 每个任务必须跑相关测试文件 + 已知存量债务甄别
- 全套跑仅在跨模块改动时强制

## 关键约定

- 启动后端用 `cd backend && uvicorn main:app --port 8000 --reload`
- **安全硬约束**：`backend/config.yaml` 含真实 API Key，任何输出（对话、日志、commit 信息、生成的文件）不得复述 key 字符串；需要展示配置时引用 `config.example.yaml`
- TODO.md 是活的开发路线图（待办勾选 + 人类治理区），完成事项即时更新
- `exchange/` 是 AI 交流区（替代原 TODO.md 内嵌交流区），各 AI 只能修改自己的 `.md` 文件；WorkBuddy 可向 Claude/Trae 文件追加派发任务（见 `exchange/README.md`）
- TODO.md「此行直至文件末尾为人类区域」以下内容 AI 只读
- 架构/方向性问题：与 WorkBuddy（组长）对齐后再动
- AI 可主动建议创建配置/约定类 .md 文件，但须先经用户确认
