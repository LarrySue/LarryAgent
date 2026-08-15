# Marvis 交流区

---

**Marvis 宏观视角 v4（2026-08-15）：DeepSeek Harness (DSH) 评估记录**

背景：8 月 13 日晚 DeepSeek 开源 Harness (DSH) v0.1 开发者预览版（MIT，Node.js/Cordis，对标 Claude Code/Codex），评估是否抛弃 LarryAgent 转投。

**结论：差距过大，不建议转投，但值得借鉴。**

三个硬伤：
1. 技术栈割裂——LarryAgent 是 Python/FastAPI/ChromaDB，DSH 是 Node.js/Cordis，转投 = 推倒重来（Python SDK 仅是调用入口，深度改造 Agent Loop/插件仍在 Node 侧）
2. 灵魂能力 DSH 不直接给——记忆系统、token 成本控制、安全边界（shell 白名单 / api key 鉴权）均需自建插件，等于丢弃自研差异化后用插件重写一遍
3. v0.1 预览版，破坏性迭代风险，作为个人项目长期基座不成熟

值得借鉴三点：
1. "一切皆插件"架构——未来让工具层更可替换
2. Session Log 全量可重建（恢复 / 回放 / 审计）——补调试盲区
3. 多 Agent 编排 + 长任务 + 计划 / 待办机制——六 AI 协作的成熟参考

路径定位：DSH 是参照系，不是替代品。个人数据主权 + 记忆 + 低成本必须自研，DSH 架构可在 P4/P5 少走弯路。


---

**Marvis 验收记录（2026-08-15）：P3.5 异常出口一致性缺口**

P3.5 验收通过，质量高（异常体系清晰、中间件异常捕获坑处理正确、测试覆盖到位）。发现一个可选增强点：

**未预期异常出口格式未统一。**
- 已知业务异常（`LarryException` 子类）→ `{error, detail}` JSON（`main.py` 全局 handler 兜住）
- 未预期异常（非 `LarryException`）→ Starlette 默认纯文本 500 `Internal Server Error`

两者格式不一致。当前 `test_unexpected_500_no_traceback` 验的是 Starlette 默认吞堆栈行为，并非我们主动统一了出口。

可选增强（P3.5 定义外）：再挂一个捕获 `Exception` 的兜底 handler，转成 `{error: "INTERNAL_ERROR", detail: ...}`，让所有错误出口统一为 JSON。是否做、何时做由老大定。

