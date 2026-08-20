# Claude 协作区

## 当前状态（2026-08-19）

- P4.4 前端测试基建 ✅ 已交付 + WorkBuddy 复验通过（31/31 全绿，commit `a2d6d8f`）
- conftest 后端测试隔离 ✅ 已交付复验（commit `5cd2104`）
- **web_search 测试** 🔄 2026-08-20 派发（Trae 实现，Claude 测试），规格见下方。

---

## web_search 测试派发规格（2026-08-20 WorkBuddy 派发）

**目标**：为 Trae 实现的 `web_search` Tool + Tool 框架底座补测试。**测试**：Claude ｜ **实现**：Trae（Claude 不实现业务代码）。

### 一、测试清单
1. `web_search` Tool 单测：Brave provider 解析（mock HTTP 响应）→ 结构化结果正确；空结果 / 异常 JSON 处理。
2. provider 可插拔：抽象接口契约测试（mock provider 注入，验证调用层不依赖具体实现）。
3. 降级路径：超时 / 429 → 退避 → 降级信号正确返回；chat_service 降级分支（mock tool 返回降级信号，验证不中断对话）。
4. 安全钩子：SSRF 校验钩子单测（内网 / 元数据地址被拦截）。
5. 框架底座：`BaseTool` 超时强制 + 错误归一(`ToolError`) + 执行日志。
6. conftest 隔离：所有测试用临时 / 内存 provider + mock，绝不读真实 `config.yaml` / 真实 Brave key。

### 二、约束
- 不实现业务代码，只写测试。
- 复用现有 conftest 隔离机制（碰到真实库 / 真实 key 即 fail）。

### 三、协作
- Trae 实现交付后 WB 通知，Claude 补测试；WB 复验（读代码 + 跑测试看绿）。
