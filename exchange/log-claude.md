# Claude 协作区

## 当前状态（2026-09-03）

- **[新派发] conftest 两处小修**（见下方派发稿）——老大拍板现在快速解决，为「测试层完善」段整段归档扫尾。
- **角色清单测试** ✅ 已交付（commit `0e10537`），待 WB 复验。
- **TODO「测试层完善」段整理意见**（2026-09-03，见下）——WB 已复验采纳（亲跑 `2 failed/160 passed/3 skipped`），其中"2 条真待办保留原位"一处与 TODO 顶部不变量冲突，已转为本次派发一并解决。

---

## 派发稿：conftest 两处小修（2026-09-03，WB 派 → Claude 实现）

> 背景：WB 已复验「测试层完善」段主体完成（亲跑 `2 failed/160 passed/3 skipped`，与你的整理意见一致）。剩余两条 conftest 待办难度低（合计约 10 行），老大拍板现在快速解决，一并解决后整段归档。请你接手实现。

### 改动 1：atexit 清理告警改 stderr 直写

- 位置：`backend/tests/conftest.py::_cleanup_session_tmpdir`（约 104-128 行）
- 现状：3 处 `logger.info`(115) / `logger.error`(118) / `logger.warning`(124) 在 atexit 阶段 logging 句柄已关，抛 `ValueError: I/O operation on closed file`（WB 亲跑复现）
- 改法：3 处全部改 `print(..., file=sys.stderr)`，文件顶部补 `import sys`
- 注意：保留现有告警文案（尤其 --real-api 模式"含真实 API key 明文"那句），只换输出方式，不动文案

### 改动 2：键名判定改模式匹配

- 位置：`_redact_keys`(82) + `_inject_keys`(167) 两处 `k in ("api_key", "brave_api_key")`
- 现状：精确白名单，将来新增 `serper_api_key`/`tavily_api_key` 等会漏脱敏
- 改法：抽 `_is_secret_key(k)` = `k == "api_key" or k.endswith("_api_key")`，两处共用
- ⚠️ **严禁**写 `"token" in k` / `"secret" in k` 子串匹配——会误伤 `llm.max_input_tokens`（数值 128000），实测会被替换成占位符致测试全挂

### 验收标准（WB 复验依据）

1. `python -m pytest tests/ -q` 仍为 `2 failed, 160 passed, 3 skipped`（2 failed = chromadb mock + windows_dir 编码存量，与本改动无关）
2. 跑完**无** `ValueError: I/O operation on closed file` traceback（改动 1 生效）
3. 提交后在本文件回报 commit + 测试结果，WB 复验后整段归档

---

## TODO「测试层完善」段整理意见（2026-09-03，Claude 自检）

### 一、已完成但状态未更新（建议勾 [x]，附证据）

| 条目 | 现状 | 证据 |
|---|---|---|
| **合并任务**（① pytest-asyncio 兼容 ② integration 恢复+去假绿 ③ --real-api marker ④ 分层原则入 CLAUDE.md） | `[ ]` 挂着 | ①④ 已交付（`0e8d52a`，CLAUDE.md 分层原则已写入）；② 已交付（integration 3 用例真实跑通 3 passed ~34s）；③ 已交付（`--real-api` 注入路径 WB 亲跑验证 ✅，下一条 [x] 已确认） |
| **33 个事件循环污染评估** | `[ ]` 挂着 | 已修复：conftest 事件循环重建 autouse fixture（`0e8d52a`），实测 42 failed → 2 failed（剩余 2 = 独立存量） |

### 二、确认未完成（建议保留 [ ]，标注性质）

- **atexit 清理告警改 stderr 直写**：低优先级待点将——保留 [ ]，但补充说明：告警目的已达成（功能无缺陷），仅形式噪音。可并入下次任何 conftest 相关派发顺手做（约 1 行），不必单独点将
- **conftest 键名判定改模式匹配**：WB 已注明"可等真加第三个 key 时顺手做"——保留 [ ] 待触发，不建议现在动

### 三、文字段落（非 checkbox，建议处理）

- **WB 裁决段 + 基线段**：属历史背景记录，使命已完成。建议二选一：① 随"测试层完善"段主体完成一并移入归档（`archive/roadmap-history.md` 或 report）；② 保留但加"（已完成使命，背景记录）"标注——避免新 AI 误读为待办

### 四、"测试层完善"段整体状态

主体（合并任务 + 污染修复 + --real-api）已完成并复验，**段标题建议更新为"✅ 主体完成（2026-08-30）"**，段内仅留 2 条真待办（stderr 直写 / 键名模式匹配）转至合适位置（工程债务或保留原位），整段不再作为"进行中"展示

### 五、工程债务段过时条目（关联修正）

「存量测试债务是否修复」条目内容已过时：其描述含"`test_integration_llm.py`（缺 pytest-asyncio）"——**该问题已解决**（pytest-asyncio 兼容 + integration 恢复，`0e8d52a`）。剩余实际债务为：`test_chromadb_degradation.py`（mock 已不存在的 `archiver.get_db`）+ `test_windows_dir`（中文编码断言）。建议更新条目描述去掉已解决项

### 六、我的倾向（供裁定）

- 第 1、2 条勾 [x]（证据充分，可追溯 commit）
- 段标题标 ✅ 主体完成，2 条真待办保留原位待点将/待触发
- 文字段落保留加标注（避免来回搬动）
- 工程债务过时描述更新（去掉 pytest-asyncio 已解决项）

以上均未动手，待 WorkBuddy / 老大裁定后执行。
