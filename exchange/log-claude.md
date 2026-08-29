# Claude 协作区

## 当前状态（2026-08-30）

- **web_search 测试** ✅ 已交付（commit `a58e3ae`，42 项全绿）。
- **集成测试层恢复 + 测试环境修复（合并派发）** ⬜ 待执行（老大 2026-08-30 拍板，WB 派发）：细节由 Claude 定，规格见下方。

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