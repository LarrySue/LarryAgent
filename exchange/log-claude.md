# Claude 协作区

## 当前状态（2026-08-30）

- **集成测试层恢复 + 测试环境修复** ✅ 已交付（commit `0e8d52a`，交付说明见下）——**含一次卡顿之谜排查**，当前结论：pytest 测试执行正常，**病根在"测试完成后进程退出阶段挂起 10-20 分钟"**，根因排查进行中。
- **web_search 测试** ✅ 已交付（commit `a58e3ae`，42 项全绿）。

---

## 真实 API 集成测试"卡顿之谜"排查记录（2026-08-30，附于交付说明后）

### 一、已固化的成果（改造交付，commit `0e8d52a`）

| 文件 | 改动 |
|---|---|
| `tests/conftest.py` | `--real-api` 开关 + 默认 skip integration + marker 注册 + **事件循环重建 autouse fixture**（修复 33 个跨文件污染失败） |
| `tests/test_integration_llm.py` | 3 用例加 `@pytest.mark.integration` + `@pytest.mark.asyncio`；**去假绿**（脚本式 try/except → assert 直抛）；key 缺失 → skip |
| `.claude/CLAUDE.md` | 分层原则 + mock 覆盖清单（不占 TODO） |

**基线对比**：42 failed/113 passed → **2 failed/150 passed/3 skipped**（剩余 2 = chromadb mock 存量 + windows_dir 编码存量，独立问题）。

**前提修正**：派发稿"pytest-asyncio 插件没被加载"实测为误（插件已加载，真卡点 = strict 模式缺 `@pytest.mark.asyncio` marker）；**无需升降任何依赖版本**（无损实验证实 pytest 9.1.1 + 1.4.0 兼容）。

### 二、排查过程与结论（重要：纠正过一次错误结论）

**现象**：`--real-api` 跑 3 用例时 wall clock 远超 pytest 计时——两次等待 10 分钟+ 无结果（用户手动停），一次 pytest 报 42.48s 但用户体感更长。

**已排除的假设**（干净实验 A/B/C/D 逐一推翻）：
- API 限流 429：❌ 非流式 10 次 + 流式 5 次连续调用全 200（1.8-2.7s）
- 进程退出清理挂起：❌（实验 C 中脚本自身退出毫秒级干净）
- embedding 初始化：⚠️ 慢但有限（首次 ~26s：import 16.6 + init 9.5；缓存后 0.01s）

**❌ 错误结论（已纠正）**：曾归因"僵尸 pytest 进程持续发调用"（用户反驳成立：卡死期间无新增调用 + 讨论期间调用数稳定 → 僵尸进程是**结果**不是**原因**）。

**✅ 正确结论（铁证）**：终极测试完整日志（日志落文件，非管道）：
```
START: 03:27:29
3 passed in 32.66s     ← pytest 计时（测试执行仅 32.66s）
EXIT_CODE: 1           ← 退出码 1！pytest 报 3 passed 但进程异常退出
END: 03:45:31          ← 进程真正退出（= 18 分 2 秒 wall clock）
```
**病根 = 测试执行完成后，进程在退出阶段挂起 17.5 分钟（退出码 1）**。两次卡死的"无新增调用"完全吻合（测试已完成，挂起阶段无调用）。中间那次"成功"是 `timeout 300` 到点强制杀进程所致（wall clock ≈ 5 分钟 ≠ pytest 计时 42.48s）。

### 三、下一步（轻装上阵继续）

**退出挂起根因排查**——最强嫌疑：conftest 的 atexit `shutil.rmtree` 删临时目录（Windows 上 ChromaDB/SQLite 文件被进程持有锁时 rmtree 卡住），且只在"用过 ChromaDB 的串行跑"时发生。计划：最小复现脚本（模拟 atexit 删临时 chroma 目录）验证。

**遗留观察**：DS 控制台调用数 155（含全部历史实验累计，精确归因待退出挂起根因确认后复盘）。

---

## 集成测试层恢复 + 测试环境修复 交付说明（2026-08-30，commit `0e8d52a`）

### 关键前提修正（与派发稿不符，实测实证）

| 派发稿描述 | 实测真相 |
|---|---|
| pytest-asyncio 插件没被加载 | **插件已加载**（`--trace-config` 实证：PLUGIN registered + asyncio mode=STRICT）。真卡点 = strict 模式缺 `@pytest.mark.asyncio` marker |
| 需升/降 pytest-asyncio 版本 | **无需任何版本变更**。无损实验证实 pytest 9.1.1 + 1.4.0 在 marker 下完全兼容（带 marker passed / 无 marker failed，与现状吻合） |

### 交付物

| 文件 | 改动 |
|---|---|
| `tests/conftest.py` | `--real-api` 开关（`pytest_addoption`）+ `pytest_collection_modifyitems` 默认 skip integration + `pytest_configure` 注册 integration marker + **事件循环重建 autouse fixture**（修复 33 个污染失败） |
| `tests/test_integration_llm.py` | 3 用例加 `@pytest.mark.integration` + `@pytest.mark.asyncio`；**去假绿**：脚本式 try/except + return True/False 改 assert 直抛；key 缺失 → `pytest.skip` |
| `.claude/CLAUDE.md` | 分层原则 + mock 覆盖清单（不占 TODO） |

### 基线对比（验收）

| | 派发基线（WB 实测） | 交付后 |
|---|---|---|
| passed | 113 | **150** |
| failed | 42 | **2** |
| skipped | 0 | 3（integration 默认跳过 ✅） |

- **净转绿 40 个**：33 个事件循环污染（shell 14 + file_ops 19 + chromadb 5）+ integration 3 从 failed → skipped（显式可跑且已真实验证）
- **剩余 2 failed 为独立存量**（与本次无关）：`test_chromadb_degradation`（mock 了已不存在的 `archiver.get_db`）+ `test_windows_dir`（中文 Windows 编码）

### 真实验证（--real-api，真实 DeepSeek 调用）

- 3 用例全过：single 23.95s / multi 25.84s / api 2.89s，串行全套 42.48s
- **卡顿根因定位**（首跑 14 分钟无输出的排查过程）：二分诊断——不调 LLM 的 API 用例 2.89s 秒过 → 卡点不在环境初始化；真实 LLM 用例单跑 24-26s 正常 → 卡在**embedding 模型加载与 LLM 调用在测试进程内累积初始化**（非本轮引入，单独/串行跑均正常，不影响交付）

### 注意事项（供 WB 复验）

- `--real-api` 跑真实调用会消耗真实 key 额度（DeepSeek 便宜，3 用例约 2 万 token 内）
- integration 用例走 conftest 临时库（handle_chat 写临时 DB，不碰真实库）
- `test_api_tools_endpoint` 不调 LLM（纯 API 层），可作为"环境自检"快速验证

交 WorkBuddy 复验。

---

## web_search + Tool 底座测试交付说明（2026-08-20，commit `a58e3ae`）

### 交付物（3 个测试文件，42 项）

| 文件 | 覆盖 |
|---|---|
| `tests/test_web_search.py`（28 项） | Brave provider 解析（mock httpx：成功 / 空结果 / 坏 JSON / 缺 web 字段）；provider 可插拔契约（注入 mock provider 正常产出 / 未知 provider 抛 ToolError）；降级路径（空 query / 超时 / 429 重试后成功 / 无结果 / max_results 钳制）；SSRF 钩子（10 类内网地址拦截 + 4 类公网放行 + query 内嵌 URL 拦截 + run() 归一验证） |
| `tests/test_tool_base.py`（10 项） | run() 护栏：超时强制（wait_for 截断，实测 <3s 而非等满 5s）/ ToolError 归一 / 普通异常归一 / _validate_request try 内（校验失败不中断）/ 执行日志（caplog）/ execute 向后兼容 / schema 生成 |
| `tests/test_tool_registry.py`（3 项） | enabled_tools 过滤 / 空列表全启用 / 未知工具跳过 + warning；全局注册表前后恢复隔离 |

### 关键验证点

- **零真实 key / 零真实 config**：全部 mock provider / mock httpx；conftest 隔离兜底（autouse 断言真实库 fail-fast）
- **全套回归**：101 通过（59 存量基线 + 42 新增）/ 42 失败全部为已知存量债务（chromadb_degradation 6 + integration 3 + shell get_event_loop 14 + file_ops get_event_loop 19），**无新增回归**
- **真实库零写入**：全套跑后会话数 41 未变（41 = 07:03 测试残留 13 + 用户 17:21 试服务 1 条真实会话，非本次写入）

### 一个实现观察（@Trae @WorkBuddy，不越界改）

`WebSearchTool` 构造时 `get_config().search`——若 config 缺 `search` 段（老配置没同步），`get_config().search` 是 `SearchConfig` dataclass 默认实例（dataclass 已给默认值），不会崩。已由测试覆盖（registry 空列表全启用路径会构造 WebSearchTool）。

交 WorkBuddy 复验。

---

## 集成测试层恢复 + 测试环境修复（合并派发，2026-08-30 · WB 派发 · 待 Claude 执行）

**背景**：Claude 2026-08-27 提的 5 条测试建议，老大 2026-08-30 拍板「建议执行 + 环境修复」合并成一批派发给你。**细节（具体版本、改造方式、文件组织）由你定**，本规格只给方向、事实与硬约束。

### 一、先纠两个过期前提（WB 实测，务必先看，否则会白做）

| 原描述 | 实测真相 |
|---|---|
| 「因缺 pytest-asyncio 被列为存量债务」 | **已装 `pytest-asyncio 1.4.0`**（`import pytest_asyncio` OK）。真卡点 = **pytest 9.1.1 与它不兼容、插件压根没被加载**。3 个用例是 **failed** 而非 skip，报 `async def functions are not natively supported`。→ 动作是**升/降版本使二者兼容**，不是"装上它" |
| 42 个失败 = 一堆零散存量债务 | **33 个（`test_shell_tool` 14 + `test_file_ops_tool` 19）跟 pytest-asyncio 无关**，是**跨文件事件循环污染**（见下）。升级依赖很可能一个都修不掉 |

**33 个污染型失败的根因（WB 二分实证）**：FastAPI `TestClient`（`test_conversations` / `test_chat_service` 在用）退出时销毁当前线程事件循环，后续 sync 测试调 `asyncio.get_event_loop()` → `RuntimeError: There is no current event loop in thread 'MainThread'`（`asyncio/events.py:681`）。

二分证据（供你复现，不必重跑）：
- `pytest tests/test_file_ops_tool.py` → **20 passed**（单跑全绿）
- `pytest tests/test_archive.py tests/test_file_ops_tool.py` → **31 passed**（全绿）
- `pytest tests/test_chromadb_degradation.py tests/test_file_ops_tool.py` → 仅 chromadb 自己 1 failed
- `pytest tests/test_conversations.py tests/test_file_ops_tool.py` → **19 failed**
- `pytest tests/test_chat_service.py tests/test_file_ops_tool.py` → **19 failed**

### 二、任务范围（合并后）

1. **环境修复**：让 pytest 与 pytest-asyncio 兼容（优先升 pytest-asyncio；最新版仍不兼容则考虑降 pytest 到 8.x）。**硬约束**：改完必须跑全套，确保现有 113 passed 一项不丢、无新增回归。
2. **恢复 3 个集成用例 + 去假绿**：`test_integration_llm.py` 现为脚本式（`try/except` + `return True/False`），**跑挂了 pytest 也不判失败**。必须改成 assert/raise，否则"恢复"做完是假绿，比不做更危险。
3. **`--real-api` marker + conftest 开关**：`@pytest.mark.integration` 默认 skip；`pytest tests/ --real-api` 才跑。`pytest_addoption` 放 `tests/conftest.py`（它是 initial conftest，可定义；现有 conftest 结构见该文件）。
4. **分层原则 + mock 覆盖清单** → 写入 `.claude/CLAUDE.md` 或 docs，**不占 TODO**（TODO 治理约定：活跃 TODO 只含待办）。这两条是原则与论据，不是待办项。
5. **（建议·未单独拍板）** 顺带评估第「一」节那 33 个污染型失败的修复成本——若低成本（如 autouse fixture 重置事件循环 / 测试内改 `asyncio.run()`）可一并修，基线能从 113p/42f 跳到约 146p/9f；若复杂，**回报待裁，不要硬做**。

### 三、老大已裁决的争议点（照办，不必再议）

- 冒烟频率 = **发版前 + 大改动后**
- Brave 真实搜索 **暂不纳入**冒烟
- `--real-api` 跑挂 **不阻塞交付**（真实 API 不稳定属外部因素；该层定位是"契约哨兵"）

### 四、硬约束（Tier 0，不可越）

- **默认必须跳过真实 API**——恢复后日常跑不得误烧 key。Tier0 禁的是 key 落日志/代码，不禁止显式跑真实 API，但**前提是默认跳过**。
- 测试隔离照旧：复用 `tests/conftest.py` 的临时库机制，禁连真实 `backend/data/larry.db`。
- 验收基线（WB 2026-08-30 01:47 实测）：**42 failed / 113 passed**。构成：integration 3 + chromadb 6（mock 了已不存在的 `archiver.get_db`，独立问题）+ `test_shell_tool::test_windows_dir` 1（中文 Windows 编码）= 真失败 10 个；其余 33 个为污染所致、单跑即绿。**交付时给出新旧基线对比**。

### 五、验收

Claude 执行 → 交付说明写回本文件 → 交 WorkBuddy 复验（读代码 + 亲跑测试对比基线）。