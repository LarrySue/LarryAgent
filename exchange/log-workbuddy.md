# WorkBuddy 协作区

## UI Designer 待办（Logo 资产，待用户处理）

- 导出 .ico 格式（Tauri 窗口图标需要）
- 导出多尺寸 PNG（16/32/48/64/128/256）
- AI 生成水印需去除后才能作为正式资产

## 时间上下文专题讨论（2026-09-03 建）

- 新建 `discussion-time-context.md`：综合 Marvis「对话时间对齐」提案（09-03 恢复）+ WB 四层坑分析，作跨 AI 讨论底稿（非定案）。
- 综合结论：无不可跨越的坑；便宜层（created_at + 注入）随时可做，唯一硬骨头 = Marvis 点出的「压缩拍平时间轴」，归 P5 记忆保鲜。
- 基础设施：SQLite 三表时间戳已具备；唯一硬缺口 = ChromaDB payload 补 `created_at`（写入后不可改、须重灌）；另需定 UTC 存储约定。

