# Claude 协作区

## 当前状态（2026-08-19）

- conftest.py 测试隔离程序性强制已交付（commit `5cd2104`），详见下方交付说明。
- P4.3 / P4.6 测试均已交付复验通过。

---

## conftest.py 交付说明（2026-08-19，commit `5cd2104`）

### 交付物

| 文件 | 改动 |
|---|---|
| `tests/conftest.py`（新） | 会话级隔离：导入时把 `LARRY_CONFIG` 指向临时 yaml（真实 config 为基底、仅替换 db/chroma 路径 + 关 vector_store + 空 api_key）；autouse session fixture 断言解析后的 database.path ≠ 真实库，指向即 fail（Tier 0 第 4 条程序性强制落地）；atexit 清理临时目录（含复制的 API key） |
| `tests/test_conversations.py` | fixture 改用 conftest 会话级路径，删除本文件内的 env/config 切换（去重复） |
| `tests/test_chat_service.py` | 删除 5 处 asyncSetUp/setUp 中把 `LARRY_CONFIG` 指回真实 config.yaml 的写法 |

### 过程中发现并修复的关键问题（影响面清单没有覆盖到的第 ④ 项）

**env 泄漏链**：test_chat_service.py 的 5 处 setup 会把 `LARRY_CONFIG` 写回真实 config.yaml 且不恢复。conftest 环境下泄漏后果：

1. 我的 autouse 断言 fixture 先缓存了临时 config 单例 → chat_service 测试自身仍写临时库（单例未重载）
2. 但 test_conversations 的 TestClient lifespan **无条件调 load_config()**，从被污染的 env 重读 → 真实 config → 真实库
3. 首次全套验证因此向真实库写入 13 条测试会话（已定位，见下）

修复 = 删除 5 处泄漏点。修复后全套重跑：**真实库会话数 40 → 40，零污染**。

### 影响面清单执行结果

| 预判项 | 结果 |
|---|---|
| ① 全部测试 DB 路径 | ✅ conftest env 生效，DB 相关 56 项全绿且零真实库写入 |
| ② chromadb mock 路径 | ✅ 不受影响（仍为存量债务 6 失败，与之前一致） |
| ③ config 单例加载时序 | ✅ 断言 fixture 先行缓存临时配置；⚠️ 未预判到 lifespan 无参重载 + 他文件 env 泄漏的组合（已修复，见上） |
| ④ 他文件 env 覆盖（新增发现） | ⚠️→✅ 已修复 |

### 回归结果（全套 101 项）

- **通过 59**（chat_service 16 / conversations 17 / auth 7 / exceptions 11 / retry 5 / file_ops+shell 单独跑时的存量基线等）
- **失败 42，全部为存量债务，非本次引入**：
  - `test_chromadb_degradation.py` 6（mock 已删除的 archiver.get_db，P3 已知）
  - `test_integration_llm.py` 3（缺 pytest-asyncio，已知）
  - `test_shell_tool.py` 14 + `test_file_ops_tool.py` 19（**新定位的债务面**：`asyncio.get_event_loop().run_until_complete()` 模式在全套顺序下失效——先行的 asyncio.run/IsolatedAsyncio 关闭 loop 后该 API 抛 RuntimeError；单独跑各自全绿）
  - 建议把"get_event_loop 模式需迁移 asyncio.run"补入 TODO 工程债务条目（涉及 Trae 写的两个测试文件，按其归属规则需在 exchange 提建议后再动，本任务未越界处理）

### 污染清理：已关闭（2026-08-19 老大裁定）

首次验证写入真实库的 13 条测试会话（id 267-280 缺 276）——老大裁定：当前为测试库，无需清理，记录归档即可。

---

## 前端测试基建任务（P4.4 逻辑层，2026-08-19 WorkBuddy 派发）

**背景**：Marvis 分层判断（2026-08-19）——前端测试基建为零（无 vitest/vue-test-utils/jsdom），P4.4 逻辑层（parseSSE / 错误体解析 / 工具卡片状态机 / 输入框快捷键）Claude 搭 Vitest + mock 后可测；真机层（Tauri 窗口/SSE 实跑/视觉）必须老大收尾。WB 据此派发。
**目标**：从零搭 client 端 Vitest 栈 + 补 P4.4 核心逻辑层单测，为老大真机验收前提供自动化保障。

### 一、范围
1. **基建**：`client/package.json` 加 vitest + @vue/test-utils + jsdom（或 happy-dom）；加 `npm run test:unit` 脚本 + `vitest.config.ts`。
2. **逻辑层单测**（优先，mock 成本低）：
   - `useChatStream.parseSSE`：SSE 分块解析（delta / tool_call / tool_result / done / error）
   - `api.ts` 错误体解析：解析 `{error, detail}`（P4.6 统一格式）
   - `ToolCallCard` 状态机：spinner→✅/❌ 切换、可折叠
   - `ChatInput` 快捷键：Enter 发送 / Shift+Enter 换行 / 禁用态
3. **集成层（次优先，依赖 mock 质量）**：会话切换加载、角色切换传参——仅做 mock 后端版，不依赖真实 Tauri/后端。

### 二、关键约束
- **零 Tauri 依赖**：P4.4 聊天界面已天然 HTTP 解耦（零 `window.__TAURI__`），mock 只需 stub fetch / store，难度低。
- **测试隔离**：前端测试不碰真实 `data/larry.db`、不碰真实 `config.yaml`（沿用 conftest 的 LARRY_CONFIG 临时库思维，前端侧用 mock）。
- **只补测试、不越界改实现**：发现 P4.4 实现 bug 先提 exchange 给 Trae/WB，不擅自改 Trae 的组件代码。
- **工程债顺带**：如触达 `test_shell_tool.py` / `test_file_ops_tool.py` 的 `get_event_loop` 模式（已定位为存量债务），不本任务处理，记入 TODO 工程债务。

### 三、验收
- `npm run test:unit` 绿；WB 复验（读测试代码 + 看结果）；真机层交付时标注清楚。
