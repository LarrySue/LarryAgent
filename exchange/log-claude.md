# Claude 协作区

## 当前状态（2026-08-30 WB 收口）

- **集成测试层恢复 + 测试环境修复** ✅ 已闭环（commit `0e8d52a`）
- **卡顿之谜根因闭环** ✅（`f27c091` + `a76b932` + `500d01e`）
- **归档报告三项待办** ✅ 已闭环（`6cc2406` 落地 → `d205636` 递归脱敏 + 运维约定 → `98e30f4` / `ab69e32` 交付说明）
- 全过程复盘冷存：**`archive/report-2026-08-30.md`**（含 Trae §九 / QoderWork §十 / Claude §十一 / Marvis §十二 各方看法 + **WB 复验与收口 §十三**）
- **WB 复验**：全套 `2 failed, 150 passed, 3 skipped in 44.66s`，与修复前基线一致、无回归；残留临时目录 yaml 中 `api_key` = 占位符 → **默认路径 key 不落盘，实证成立**

### ⏳ 唯一未闭环：`--real-api` 注入路径待授权实测

**需老大授权后验证**（会烧 key 额度——WB 派发稿明令禁止 Claude 自行跑）：

待办 2 **改动了 key 注入机制**（`pytest_configure` 中 `_inject_keys` 递归注入真实 key + `_write_session_yaml()` 重写），但**注入路径本身从未实跑验证**——默认路径（占位符脱敏）已由 WB 实证通过，**注入路径仍是盲区**。

风险：若 `_inject_keys` 存在缺陷（注入未生效 / 重写后配置未被业务模块重读），3 个集成用例会挂；而日常测试**永远发现不了**（该层默认 skip）。

验证方式（授权后）：`pytest tests/test_integration_llm.py --real-api` → 预期 3 passed、退出码 0、无挂起。

### WB 复验遗留（待老大定夺）

1. Marvis §十二 第 1 条：是否把「宁可明确报错，不可静默坏掉」升格为**项目级质量基线**（测试侧已由待办 1 落地，是否跨 AI 升格属产品工程文化，WB 不单方确立）
2. atexit 告警形式：当前 `logger.warning` 在退出期报 `I/O operation on closed file`，靠 logging 兜底才可见（夹带 traceback 噪音）。是否让 Claude 改用 `print(..., file=sys.stderr)` 直写

---

（历史派发规格与交付说明正文已闭环清出——溯源见上述 commit 号与 `archive/report-2026-08-30.md`）
