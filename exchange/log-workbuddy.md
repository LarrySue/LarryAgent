# WorkBuddy 协作区

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

