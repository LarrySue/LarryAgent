# Claude 协作区

## 当前状态（2026-09-03）

- **前端角色清单后端下发 —— 测试** ✅ 已交付（commit `0e10537`：后端 5 项 + 前端 13 项全绿），交付说明见下，待 WB 复验。

---

## 角色清单后端下发测试交付说明（2026-09-03，commit `0e10537`）

**背景**：Trae 实现「前端角色清单从后端拉取」（`GET /api/roles` + 前端动态化，见 log-trae.md）。补测试验证实现契约与兜底行为，未碰实现代码。

### 交付物

| 文件 | 覆盖 |
|---|---|
| `backend/tests/test_roles_api.py`（5 项） | 正常清单（顺序 = config 书写序、default 首位、字段齐全）/ label·color 缺省兜底（label→key、color→#9CA3AF）/ 缺 default 不 500 / 空 roles 返回 [] / 鉴权透传（空 api_key 不被拦） |
| `client/tests/roles.test.ts`（13 项） | `listRoles`（成功 / HTTP 错误走 detail / 非 JSON 回退 HTTP 状态）；store（`setRoles` 后 `currentRoleInfo` 派生、当前角色不在清单回退 default、空数组兜底 FALLBACK、`fetchRoles` 失败兜底、Role 动态化可承载任意 key）；RoleSelector（动态渲染含后端新角色 key 如 science、trigger 显示当前 label、点击 emit + 勾选联动、store 空走 FALLBACK 防白屏） |

### 验证

- 后端全套：**2f / 160p / 3s**（155+5 新增，无回归；2 failed 为存量债务）
- 前端：**58/58 全绿**（45+13 新增）
- **grep 验证**（派发验收标准）：`var(--role-${...})` 动态拼接已消失；`type Role = "default" | ...` 联合类型已消失；残留的 `--role-color` 为自定义 CSS 属性透传（inline style 注入 `currentRoleInfo.color` hex），是新模式的正确写法

### 实现观察（@WB，无问题不越界改）

1. `RoleSelector` 的本地 FALLBACK 与 store 的 FALLBACK_ROLES 是同一份数据（store 导出，组件引用）——无重复定义
2. `GET /api/roles` 端点行为与派发规格完全一致（顺序/兜底/鉴权），测试逐项钉死

交 WorkBuddy 复验。
- vector_store.enabled 开关测试 ✅ 已交付并经 WB 复验通过（commit `45a0625`，3 项）——整条 vector_store 开关贯通链路（Trae 修复 / Claude 测试 / WB 复验+补修写入+`--real-api` 终验）已全链路闭环，记录归档于 `archive/roadmap-history.md`。
- 历史交付（web_search 测试 / 集成测试层恢复 / 卡顿之谜闭环 / 三项待办）均已完成并归档，详见 `archive/report-2026-08-30.md`。

---

## 【待开工】角色清单后端下发 —— 测试派发（WB 派发 2026-09-03）

### 测试对象与背景

Trae 将实现「前端角色清单从后端拉取」：后端新增 `GET /api/roles`（读 `config.roles`，序列化 `[{key, label, color}]`），前端废除硬编码角色联合类型 + `--role-*` CSS 变量，改为启动时拉取清单动态渲染。

你的职责：**补测试验证实现契约与兜底行为，不碰实现代码**。发现实现问题 → 写测试挂红 + 在本文档说明现象，**不要代改实现**（那是 Trae 的）。

### 后端测试（新建 `backend/tests/test_roles_api.py`）

参考 `test_auth_middleware.py` 的 TestClient + monkeypatch `config.roles` 模式，不碰真实 `config.yaml` / key：

1. **正常清单**：`config.roles` 含 default/code/health/finance → `GET /api/roles` 返回 `[{key, label, color}]`，顺序 = 配置书写顺序，`default` 在首位。
2. **label/color 缺省兜底**：某角色只有 `system_prompt`、无 label/color → 端点返回 label 回退 = key、color 回退 = `#9CA3AF`，不抛异常。
3. **缺 default**：`config.roles` 不含 default 键 → 端点不 500，返回非空（或明确兜底），行为与前端兜底契约一致。
4. **空 roles**：`config.roles = {}` → 不 500（返回 `[]` 或兜底，需与前端契约对齐并写断言钉死）。
5. **鉴权透传**：空 api_key 时 `/api/roles` 不被 AuthMiddleware 拦（参考 test_auth_middleware 的透传断言写法）。

### 前端测试（`client/tests/`）

1. **`api.test.ts` 加 `listRoles`**：mock fetch —— 成功返回数组 / HTTP 错误 / 非 JSON 响应，沿用现有 `vi.stubGlobal("fetch", ...)` 模式。
2. **store（`app.ts`）**：`setRoles` 后 `currentRoleInfo` 派生正确（找当前角色的 label/color）；`roles` 为空或当前角色不存在时兜底到 default（key=default / label=通用 / color=#9CA3AF）。
3. **`RoleSelector` 渲染**：从 store 读动态列表渲染 N 项（含 code）；选中态与 modelValue 联动正确；不再有硬编码 `roles` 数组。
4. **组件角色色**：`AppLayout` / `MessageList` / `ToolCallCard` 的角色色取自 store 的 `currentRoleInfo.color`（hex），不再依赖 `var(--role-*)`。

### 约束

- 全程 mock：后端 monkeypatch `config.roles`、前端 stub fetch / 纯 store 单元测试。
- 不修改任何实现代码；不新增实现依赖；测试文件可新建。
- 完成后在本文档顶部状态区更新交付说明（跑了哪些、结果、发现的问题）。
