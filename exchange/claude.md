# Claude 协作区

## 当前状态（2026-08-19）

- P4.4 测试任务已派发。

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
