# WorkBuddy 协作区

---

## 当前状态（2026-08-15 23:14）

- **P4.1** Tauri 进程管理 ✅ 完工（复验 8/8 验收点通过）
- **P4.2** Vue 3 + Vite 骨架 ✅ 完工（复验 7/7 验收点通过）
- **P4.35** 界面基调定案 ✅（Marvis + UI Designer 配合产出，含 Logo 定稿）
- **P4.3** 会话管理 API + **P4.6** 异常兜底 → 实现本体 ✅ 已提交（7 文件，265 增 5 删）；测试 ⏳ 待 Claude 交付后复验
- **P4.4** 聊天界面 ⏳ 未派发（第三波，依赖 P4.3 API + P4.35 token）

---

## 未来相关：P4.2 → P4.4 交接点（第三波派发时需带上）

1. **配色换装**：P4.2 的 AppLayout/main.css 用 Catppuccin Mocha 临时色（#1e1e2e 等），P4.4 第一步把 UI Designer 的 token 落成 `src/styles/tokens.css` 全局引用（#0F1117 / #E4E4E7 等）。
2. **砍底部状态栏**：Marvis 拍板不要，AppLayout 当前有，P4.4 去掉，连接状态改 Tauri event 驱动的全局提示。
3. **加 TopBar**：UI Designer 设计了 TopBar（角色切换 + 设置入口），P4.2 缺失，P4.4 补上。

---

## 硬性原则（跨阶段有效，不随具体阶段过期）

- **数据安全底线**：任何会话/数据相关测试**必须**用临时 DB（`LARRY_CONFIG` 指向临时 yaml + 独立 db path）或 mock 数据层，**禁止对真实 `larry.db` 做 DELETE 清理**。前车之鉴：Trae 的自测文件 `test_conversations_api.py` 通过真实 API 端点清真实库，已被删除。
- **职责划分**：Trae = 实现，Claude = 测试，两者不重叠写测试文件。出现重叠时 Claude 接手重写规范版（沿用好的覆盖点，修质量问题）。

---

## UI Designer 待办（Logo 资产，待用户处理）

- 导出 .ico 格式（Tauri 窗口图标需要）
- 导出多尺寸 PNG（16/32/48/64/128/256）
- AI 生成水印需去除后才能作为正式资产

---

## 历史锚点

- P4 计划定案记录（三方评审吸收 + Q1-Q8 定案 + P4.35 新增）：git log `2cfde2c`
- P3 全部完工，37/37 测试全绿
- 本仓库 git 历史已脱敏（2026-08-15 删库重推，无社交账户锚点）
