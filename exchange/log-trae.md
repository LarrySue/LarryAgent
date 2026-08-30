# Trae 协作区

## 当前状态（2026-08-30 更新）

🔴 **【待点将·未开工】修 `vector_store.enabled=false` 被绕过** —— 派发规格在**文末（第 60 行起）**，WB 2026-08-30 实测。**开工前先读完这一条再看别的。**

- **web_search 工具 + Tool 框架底座** ✅ 已交付（Trae，2026-08-20），交付说明见下方；等 Claude 补规范测试 + WorkBuddy 复验。

---

## web_search + Tool 框架底座 交付说明（2026-08-20，实现本体）

### 改动文件清单（6 文件：1 新增 + 5 修改）

| 文件 | 改动 |
|---|---|
| `tools/web_search.py`（新） | WebSearchTool（注册名 `web_search`）+ SearchProvider 抽象 + BraveSearchProvider + SSRF 拦截钩子 + 指数退避重试 + 降级信号 |
| `tools/base.py` | 护栏基类：`ToolError` + `guard_level` + `timeout` + `run()` 模板方法（超时强制 + 错误归一 + 执行日志 + `_validate_request` 钩子）；`execute` 接口不变（向后兼容） |
| `tools/registry.py` | 配置驱动启用：读 `config.tools.enabled_tools` 过滤注册；空列表 = 全部启用（向后兼容）；新增工具只需在 `_available_tool_classes()` 登记 + config 加名字 |
| `config.py` | 新增 `SearchConfig`（provider/brave_api_key/timeout/max_retries/max_results）+ `ToolsConfig.enabled_tools` |
| `config.yaml` | 加 `search:` 段 + `tools.enabled_tools` 列表（含 web_search） |
| `services/chat_service.py` + `api/tools.py` | 工具调用点 `execute()` → `run()`（护栏统一入口） |

### 功能点对应

| 规格要求 | 实现 |
|---|---|
| provider 可插拔 | `SearchProvider` ABC + `BraveSearchProvider`（GET Brave API，`X-Subscription-Token`）；换 SearXNG 只写新类 |
| 超时 + 降级 | 每轮尝试 `asyncio.wait_for(timeout=8s)`；tenacity 指数退避（最多 2 次重试）；仍失败 → `ToolResult(success=False, error="未能联网核实：...")`，chat_service 传给 LLM 降级为正常回答，不报错不中断 |
| SSRF 拦截 | `_validate_request` 钩子（在 `run()` try 内，失败归一不冒泡）；`_is_blocked_ssrf_url` 拦 169.254/10.x/192.168/127.x/localhost/0.x/100.64；域名留 DNS 解析给将来 web_fetch |
| 配置驱动启用 | `enabled_tools` 列出启用工具；空列表兜底全开 |
| 前端展示 | 复用 P4.4 ToolCallCard（SSE tool_call/tool_result 事件驱动），零新组件 |
| key 安全 | 仅 backend config 读取；测试用 mock provider，不碰真实 key |

### 护栏基类设计决策（重要）

- **不破坏现有工具**：`execute` 保持抽象接口，FileOpsTool/ShellTool **零改动**（run() 自动给它们加错误归一 + 执行日志；ShellTool 的 30s 超时仍在 execute 内部，run() 的 timeout=None 不嵌套强制）。
- **`_validate_request` 在 try 内调用**：校验失败（ToolError）归一为失败 ToolResult，不中断聊天（自测发现并修复）。

### 自测验证（内联 mock，非测试文件）

- SSRF 拦截：169.254.169.254 / 10.x / 192.168.x / 127.x / localhost 全部拦截；公网域名/IP 放行 ✅
- 成功路径：mock provider 返回结果 → ToolResult(success=True, content 含标题+URL+摘要) ✅
- 降级路径：provider 抛异常 → 重试后 `未能联网核实：网络搜索超时（>8.0s，重试2次）` ✅
- SSRF query 拦截：query 含内网 URL → 归一为失败结果 ✅
- 空 query → 失败结果 ✅
- 工具注册：`['file_ops', 'shell', 'web_search']` ✅

### 回归验证

- 核心测试（chat_service/exceptions/auth_middleware/conversations/llm_retry）：**58 passed** ✅
- shell + file_ops 单文件跑：**34 passed, 1 failed**（`test_windows_dir` 为 TODO 已记录存量债务：中文 Windows 编码断言）
- ⚠️ 混跑 7 个测试文件会触发旧测试代码 `asyncio.get_event_loop()` 与 Python 3.11 的既有互操作污染（非本次改动引入，单独跑各文件均正常）

### 待 Claude / WorkBuddy

- Claude 补规范测试（mock provider，不碰真实 key / 真实 config）
- WorkBuddy 复验（读代码 + 看报告）；真机搜索流程（首次搜索 / 来源标注 / 降级）需老大 GUI 环境收尾

---

## 【待点将·未开工】修 `vector_store.enabled=false` 被绕过（WB 2026-08-30 实测派发）

> 状态：**等老大点将后再动手**，不要自行开工。
> 来源：WB 用老大提供的专用测试 key 实测 `--real-api` 时连带发现，**稳定复现 2/2**，非偶发。

### 一句话任务

让 `vector_store.enabled=false` 真正生效——按该开关跳过长期记忆召回，不要再偷偷跑 embedding 和向量检索。

### 根因（已定位到行，不用再查）

- `services/chat_service.py:142`：`long_term = await get_long_term_memory(req.message)` —— **无条件调用，不看开关**
- `memory/engine.py:57-66`：`get_long_term_memory` 内部直接 `embed_text()` + `vector_store.search()`，**也不看开关**
- `rag/vector_store.py:32-42`：`_get_client()` 建 `chromadb.PersistentClient`，**同样不看开关**
- 正确写法对照：`api/memory.py:136` 是 `if config.vector_store.enabled:` 才碰向量库。**照这个写法补即可**

### 为什么必须修（两条后果，都是真的）

1. **生产路径**：开关关着，每次 chat 仍跑一次本地 embedding 并建 ChromaDB 客户端——白耗算力与内存，降级设计形同虚设。`test_chromadb_degradation.py` 声称的"enabled=false 时聊天正常工作"，实际是「偷偷做、失败被 `except` 吞成 `[]`」的静默降级，不是真降级。
2. **测试路径**：因为建了 ChromaDB 客户端，`chroma.sqlite3` 句柄不释放 → `--real-api` 跑完 atexit 的 `shutil.rmtree` 抛 `[WinError 32]`，**正常退出也残留含 key 的临时目录**（此前"只有强杀才残留"的说法已被证伪，conftest 注释已改）。

### 修复取向（建议，细节你定）

在 `memory/engine.py::get_long_term_memory` 开头加开关判断，与 `api/memory.py:136` 保持一致：

```python
if not get_config().vector_store.enabled:
    return []
```

放 engine 层（而不是 chat_service 层）：`get_long_term_memory` 可能还有别的调用方，在入口拦住最稳。若你认为该在 `_get_client()` 再加一道防御，也行——但**别只加在 `_get_client()`**，那样 embedding 仍会白跑。

### 验收标准

- `vector_store.enabled=false` 时跑一次 chat，日志中**不应出现** `ChromaDB client created` / `Long-term memory search`，也不应加载 embedding 模型
- `pytest tests/test_chromadb_degradation.py` 保持通过（这是降级测试，别改测试来迁就代码；若必须改，说明理由）
- `pytest tests/ -q` 与基线 `2 failed / 150 passed / 3 skipped` 对比无新增失败（2 个 failed 为独立存量债务：chromadb mock、windows_dir 编码，**禁止顺手改**）
- 附带自证：修复后再跑 `--real-api`，`D:\Temp\Sys\larry_test_*` 目录数应为 0（WB 会复验）

### 边界

- 不要动 `conftest.py`（WB 已改：清理失败告警区分 `--real-api` / 默认路径）
- 不要动 `backend/config.yaml`
- 不要碰任何真实 key