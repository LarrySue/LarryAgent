# Trae 协作区

## 当前状态（2026-09-03 更新）

✅ **【已交付·待复验】前端角色清单改为后端下发** —— Trae 2026-09-03 交付，交付说明见文末；等 Claude 规范测试 + WorkBuddy 复验。
- **web_search 工具 + Tool 框架底座** ✅ 已交付（Trae，2026-08-20），交付说明见下方；等 Claude 补规范测试 + WorkBuddy 复验。
- vector_store.enabled 开关贯通（召回 + 归档写入双路径）已于 2026-08-30 全链路闭环（Trae 修复 / Claude 测试 / WB 复验+补修写入+`--real-api` 终验），完整记录归档于 `archive/roadmap-history.md`，派发稿已清理。

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

## 【已交付·待复验】前端角色清单改为后端下发（WB 派发 2026-09-03，Trae 2026-09-03 交付）

### 交付说明（Trae，2026-09-03，实现本体）

**后端（3 处）**：
- 新建 `backend/api/roles.py`：`GET /api/roles` → `[{key, label, color}, ...]`，顺序 = config roles 段书写序；label/color 缺省兜底（label→key，color→`#9CA3AF`）
- `backend/main.py`：include roles_router（与 conversations/memory/tools 一致，不塞 main.py）
- `backend/config.example.yaml` roles 段：补全 default/code/health/finance + label + color（example 为模板，system_prompt 简版）

**前端（8 文件）**：
- `api.ts`：`RoleInfo` 接口 + `listRoles()`
- `stores/app.ts`：`type Role` 联合 → `export type Role = string`；新增 `roles` / `setRoles`（空走兜底）/ `fetchRoles`（失败兜底）/ `currentRoleInfo` getter（找不到回退 default）
- `RoleSelector.vue`：删硬编码 roles 数组与本地 `type Role`；从 store 读 `roles`（空则本地 FALLBACK_ROLES，防白屏）
- 色值改造：`AppLayout.vue` / `MessageList.vue`（含 CSS `--role-default` fallback 删除）/ `ToolCallCard.vue` 的 `var(--role-*)` → `currentRoleInfo.color`（hex 直用）
- `tokens.css`：删 `--role-default/health/finance` 三变量
- `ChatView.vue`：onMounted 拉取 `fetchRoles()`（与 conversations/models 并列）
- `docs/ui-reference.md`：§1.4 / §5.5 / §10 回写 v6

**验证**：
- 后端全套 `pytest tests/ -q` → **2 failed / 155 passed / 3 skipped**，与基线对比无新增失败（2 failed 均为存量债务：chromadb `archiver.get_db` mock、windows_dir 中文编码）
- `GET /api/roles`（TestClient）→ 200，返回本地 config 全角色（default/code/health/finance/science——`code` 等此前前端选不到的角色已可下发）；label/color 缺省兜底正确
- 前端 `vue-tsc --noEmit` 通过 + Vitest **45 passed**
- 未动 `backend/config.yaml`（label/color 待老大补，不补则英文 key + 灰色，不阻塞）；未动 `get_system_prompt`/`_get_tools_for_role`

**待 Claude / WB**：Claude 规范测试（`/api/roles` 端点 + 前端兜底）；WB 复验（验收标准 4 项）。

### 目标一句话

角色清单从「前端硬编码 + 后端 config 两份、人工同步」改为「后端 config 单一数据源 + `GET /api/roles` 下发 + 前端动态渲染」——**加新角色只改 config.yaml + 重启**，前端零改动。

### 背景 / 根因（WB 已实测定位）

- 前端硬编码 4 处：`RoleSelector.vue:4`（`type Role` 联合类型）+ `:20-24`（`roles` 数组）+ `app.ts:4`（重复的 `type Role`）+ `tokens.css:42-44`（`--role-*` 三个变量）。
- 后端 config 已是纯配置驱动（`config.py:92 roles: dict[str,dict]`、`get_system_prompt` 动态查、`ChatRequest.role: str` 不强校验），但**角色清单没暴露给前端**。
- **已脱节实锤**：本地 `config.yaml` roles 段有 4 个角色（default / code / health / finance），前端只硬编码 3 个（default / health / finance）——`code`（编程搭档）后端有完整提示词、前端选不到。

### WB 已裁定（照做，勿自行折中）

1. **颜色方案**：后端下发 **hex 色值**，前端废除 `var(--role-*)` 动态拼接；`tokens.css` 的 `--role-default/health/finance` 三个变量删除。
2. **角色元数据放 `config.yaml` 的 `roles` 段**：`roles.<key>.label`（显示名，缺省回退 = key）、`roles.<key>.color`（hex，缺省回退 = `#9CA3AF`）。
3. **端点**：新建 `backend/api/roles.py`（`APIRouter(prefix="/api/roles")`），`main.py` `include_router`，与 conversations/memory/tools 一致（不要学 `/api/models` 塞在 main.py）。
4. **前端 `type Role` 从联合类型改 `string`**（角色动态化）。
5. **兜底**：前端 `listRoles` 失败或返回空 → 兜底 `[{key:"default", label:"通用", color:"#9CA3AF"}]`，不白屏；后端缺 label/color 同理兜底。

### 后端改动（2 文件）

1. **`config.example.yaml` roles 段**：补全为 4 个角色并加 `label` + `color`（当前 example 只有 default，code/health/finance 是注释掉的示例，落后于本地 config.yaml）。system_prompt 给简版即可（example 是模板，不必逐字复制本地人设文案）：
   - `default`：label `通用` / color `#9CA3AF`
   - `code`：label `编程` / color `#60A5FA`
   - `health`：label `健康` / color `#34D399`（沿用现 `--role-health`）
   - `finance`：label `金融` / color `#FBBF24`（沿用现 `--role-finance`）
2. **新建 `api/roles.py`**：`GET /api/roles` → `[{key, label, color}, ...]`，顺序 = config.yaml roles 段书写顺序（py dict 保序，default 排首位）。读取 `get_config().roles`，对每个 key 做 label/color 兜底。

### 前端改动（6 文件）

1. **`api.ts`**：加 `RoleInfo` 接口（`{key: string; label: string; color: string}`）+ `listRoles(): Promise<RoleInfo[]>`。
2. **`app.ts`**：`currentRole` 改 `string`；新增 `roles: RoleInfo[]` + `setRoles()` + `currentRoleInfo` getter（返回当前角色 `{label, color}`，找不到回退 default 兜底对象）。
3. **`RoleSelector.vue`**：删硬编码 `roles` 数组 + `type Role` 联合类型；改为从 store 读 `roles` 列表动态渲染。
4. **`AppLayout.vue:189` / `MessageList.vue:28` / `ToolCallCard.vue:16`**：`var(--role-${currentRole})` → `appStore.currentRoleInfo.color`（hex 直用）。
5. **`tokens.css:42-44`**：删 `--role-default/health/finance` 三个变量。
6. **`MessageList.vue:171`**：fallback `var(--role-color, var(--role-default))` → 改用 store 色值（删 `--role-default` 引用）。

前端启动拉取时机：app store 初始化时调 `listRoles()`，失败/空走兜底；切换角色即时更新 `currentRoleInfo`。

### 不改 / 兼容（红线）

- **不动 `backend/config.yaml`**（含真实 key，不入库）。本地 config.yaml 的 label/color 由老大自行决定何时补——不补则前端显示英文 key + 灰色，**不阻塞改造验收**。
- 不动 `get_system_prompt` / `_get_tools_for_role` 逻辑（label/color 经 `roles: dict[str, dict]` 透传，无需改 config.py）。
- `source_role`（消息表字段）本就是 string，兼容任意角色 key，无需改。
- 不动其它组件 / 路由。

### 验收标准（WB 复验用）

1. `GET /api/roles` 返回后端 `config.roles` 的完整角色清单（含 code），字段 `key/label/color` 齐全。
2. 前端启动后角色下拉 = 后端下发清单（含 code）；grep 确认 `type Role = "default" | "health" | "finance"` 联合类型与硬编码 `roles` 数组已消失。
3. 切换角色颜色/文案随下发值变化；`listRoles` 失败时兜底 default 不白屏。
4. 后端全套测试 + 前端 Vitest 全绿，无新增回归。
