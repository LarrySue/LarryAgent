# LarryAgent UI 参考（权威）

> 本文件是 LarryAgent 前端 UI 设计的**单一权威参考**。所有 AI（Trae 实现 / Claude 测试 / Marvis 产品 / UI 设计 / WB 复验）以本文件为 UI 约定的最终真相源。
>
> **权威层级**：`client/src/styles/tokens.css`（代码数值事实）> 本文件（设计定案）> 交流区（`exchange/log_design.md` / `exchange/log-marvis.md`，过程与讨论）。
> 代码与设计不一致时以代码为准，并应回写本文件。

## 0. 产品调性（约束一切后续选择）

- 三个词：**克制、专业、可信赖**
- 核心美学：**克制的高级感**（中性灰阶、低饱和、靠层次与留白，不铺彩色）
- 暗色为主（P4 只做暗色）；个人助理类工具暗色耐看、长时间不疲劳
- 工具调用过程可见（Agent 产品差异化，区别于普通聊天）

## 1. 配色

### 1.1 交互锚点色（唯一彩色）

- `--color-accent: #378ADD`（低饱和蓝）——仅用于：主操作按钮（发送/新建）、链接文字、Focus ring、加载 spinner
- 不是"品牌主色"，是"交互锚点色"；**不做地毯式铺色**（纯灰阶界面缺可点击暗示，一个克制蓝点保住 WCAG 可用性底线）
- hover `#5BA4ED`；muted `rgba(55,138,221,0.15)`（选中态浅底）

### 1.2 背景 / 文字 / 边框

- 背景三级：`--color-bg-base #0F1117`（底板）/ `--color-bg-surface #1A1D24`（容器）/ `--color-bg-elevated #242830`（悬浮层）/ 遮罩 `rgba(0,0,0,0.6)`
- 文字三级：`--color-text-primary #E4E4E7` / `--color-text-secondary #A1A1AA` / `--color-text-muted #71717A` / `--color-text-inverse #0F1117`
- 边框：`--color-border-default rgba(255,255,255,0.08)` / `--color-border-hover rgba(255,255,255,0.15)` / `--color-border-focus #378ADD`
- 侧栏：`--sidebar-bg #13141C`；item hover `rgba(255,255,255,0.04)` / active `rgba(255,255,255,0.08)`

### 1.3 语义色（仅状态出现时使用，不常驻）

- success `#10B981` / warning `#F59E0B` / error `#EF4444` / info `#378ADD`（各带 `-bg` 12% 透明度底）

### 1.4 角色标识色（轻量差异化，不换肤）

- `--role-default #9CA3AF`（亮中性灰，无角色）
- `--role-health #34D399`（低饱和翠绿）
- `--role-finance #FBBF24`（低饱和琥珀）
- 语义层级：无角色=灰，有角色=淡彩

### 1.5 消息气泡

- 用户：`--bubble-user-bg #1E293B` + 边框 `rgba(55,138,221,0.3)`（带一抹强调色），右对齐，无角色色带
- AI：`--bubble-agent-bg #1A1D24`，左对齐，**左侧色带 3px = `--role-{current}`**，无外框
- 错误：`--bubble-error-bg rgba(239,68,68,0.08)` + 边框 `rgba(239,68,68,0.3)`，文字 `--color-error`

## 2. 排版 / 间距 / 圆角 / 过渡（数值以 `tokens.css` 为准）

- 字体：`--font-sans` Inter / SF / 微软雅黑 / 苹方（中文优先系统字体）+ `--font-mono` 等宽
- 字号：xs 12 / sm 13 / base 14（正文）/ lg 16 / xl 18 / 2xl 20
- 字重：normal 400 / medium 500（设计原则两级；代码另有 semibold 600 / bold 700 供需要时用）
- 行高：tight 1.25（标题）/ normal 1.5（英文）/ relaxed 1.6（中文正文）
- 间距：4px 基准（space-1~12 = 4~48px）
- 圆角：sm 6 / md 8（默认，输入框按钮）/ lg 12（卡片气泡）/ xl 16（大容器）/ full 9999px
- 过渡：fast 150 / normal 300 / slow 500ms；ease-standard / ease-in-out / ease-spring

## 3. 布局

- 左会话栏（默认 260px，可折叠）+ 右主区（消息流上 + 输入区下）+ 顶部栏（标题 + 角色切换）
- 响应式断点：sm 640 / md 768 / lg 1024 / xl 1280
  - `<640` 单栏全宽，侧栏抽屉；`640–1023` 侧栏可折叠（240px，collapsed 48px 图标）；`≥1024` 双栏完整（侧栏 260px，允许 200–320px 拖拽）
- Tauri 窗口约束：默认 900×700；最小宽 **800px**（低于此侧栏自动折叠 48px 图标模式）；700px 高容纳顶栏(48)+消息流+输入(~60)+状态栏

## 4. 多角色差异化呈现（轻量，不做三套换肤）

- 落地：侧栏条目角色色点 + AI 气泡左侧色带 + 工具卡片 header 色跟随角色 + 切换时 **color transition 200ms**（无 transform 位移）
- 明确不做：角色专属问候语（2026-08-21 老大定：不要问候语）
- 明确不做：三套完整主题换肤（成本高、维护噩梦）

## 5. 核心组件规格

### 5.1 ToolCallCard（灵魂组件）
- 展示：工具名 + 轮次 + 状态（执行中 spinner / 成功 ✅ / 失败 ❌）+ 参数（可折叠）+ 结果摘要
- 样式：`--color-bg-elevated` 底 + 1px `--color-border-default` 边 + radius-md(8px) + padding 12/16（实际代码 `--space-3 var(--space-4)`）+ max-width 85%
- header 左侧色带 3px = `--role-{current}`；成功→`--color-success` 绿条 / 失败→`--color-error` 红条
- 可点击 header toggle 参数/结果区

### 5.2 MessageBubble
- AI 气泡左侧 3px 色带 = `--role-{current}`；padding 12/16；max-width 72%（防过宽）
- 用户右对齐、`--bubble-user-bg`、带强调色边框、无角色色带
- 错误气泡：error 底/边/文字，左对齐

### 5.3 ChatInput
- `--color-bg-elevated` 底 + radius-lg(12px)；focus 时 border `--color-accent` + box-shadow `0 0 0 2px --color-accent-muted`
- min-height 24px（实际代码 `.input-area` 为 min-height: 24px）/ max-height 120px（约 5 行超出滚动）；发送按钮 `--color-accent` 底白字 radius-md，disabled opacity 0.4
- Enter 发送 / Shift+Enter 换行

### 5.4 SidebarItem
- 结构：标题(单行截断) + 时间戳(`--text-xs` 右对齐)；角色色点已删（2026-08-21 老大定：会话级角色归属待数据模型支撑后另行设计，见 TODO「角色归属设计」）
- hover `--sidebar-item-hover`；active `--sidebar-item-active` + 左侧 2px `--color-accent` 条

### 5.5 TopBar
- 高度 48px；`--color-bg-surface` 底 + 1px 底边框
- 左：侧栏折叠钮（仅桌面）；中：产品名/当前会话标题；右：角色切换下拉（角色色点+名+箭头）+ 设置按钮（图标，P4.5 砍除后当前无功能页）

## 6. 边界状态

| 场景 | 处理 |
|------|------|
| 空消息流 | 中央欢迎语（无快捷建议气泡——已砍） |
| 超长消息(>2000字) | 默认折叠前 6 行 + "展开全文"；代码块独立横向滚动 |
| 网络断开 | 顶部**常驻** warning banner（不做输入框禁用——网络属外部问题，不入工具范畴，2026-08-21 老大定）+ 自动重连 3 次失败显示"手动重试" |
| SSE 流中断 | 最后 delta 后 "..." 态；5s 无数据→"重新发送"；工具中断→卡片 spinner + 红警"执行超时" |
| AI 回复为空 | 不渲染气泡；状态栏闪现提示；不阻塞后续 |
| 并发防护 | 发送时禁用输入+发送；上一条未完成可"停止生成" |
| 会话标题过长 | 侧栏单行截断 + tooltip；>20 字后端截取（P4.3 定） |
| 工具结果超大 | 结果区 max-height 100px 滚动 + "查看完整结果"；JSON 自动缩进 |

## 7. Accessibility（WCAG AA）

- 触控目标 ≥ 44×44px；键盘 Tab 序：侧栏→消息流→输入框→发送；Focus ring `--color-accent` 2px outline + 2px offset
- 屏幕阅读器：消息 `role="article"` + `aria-label="{role}的消息"`；工具卡片 `role="region"` + `aria-label="工具调用: {name}"`；SSE 更新 `aria-live="polite"`
- 动效减弱：`@media (prefers-reduced-motion: reduce)` 关闭所有过渡（spinner 转静态指示器）
- 对比度：正文 10.2:1 / 辅助 5.4:1 / 链接 5.8:1 / role 色 7.2–9.1:1，均达 AA

## 8. Logo 定案（2026-08-15）

- **C2 写意版**：毛笔三笔 + 禅圆缺口（缺口=灵魂）+ 一枚朱红点（印章意象），其余全墨色灰阶
- 设计语言：当代抽象书法（非国画），飞白质感是核心识别；缩到 32px 仍感知"笔触非色块"
- 资产：`.workbuddy/artifacts/FINAL_app_icon_logo_for_LarryA_2026-08-15T10-10-35.png`（1024×1024）
- 待导出：`.ico`（Tauri 窗口图标需要）+ 多尺寸 PNG（16/32/48/64/128/256）；AI 水印需去除后作正式资产

## 9. 过渡动画

- 原则：**color transition 替代 transform**（柔和无冲击感，"温和地变了，没有动的感觉"）
- 角色切换色带 / 侧栏色点 / 工具卡片 header 条：background-color transition 150–200ms ease
- `prefers-reduced-motion` 时全部关闭

## 10. 来源与版本

- **v1（2026-08-21，WB 汇聚）**：来源 = `exchange/log_design.md`（设计精化定案 §3–§7、§8 Logo、§9 过渡）+ `exchange/log-marvis.md`（产品方向 §0–§5、结构层决策）+ `client/src/styles/tokens.css`（代码数值事实，以之为准）
- **已知局限**：Trae 实现时的部分 UI 决策已固化于 `tokens.css` / 组件代码（如新增 `--weight-semibold/bold`），未单独文档化的细节以代码为准；后续由 Trae 点将时回写补充本文件
- **过程与未决项**：设计冲突分析、迭代历程见 `exchange/log_design.md`；**未决 / 待办（待拍板、Trae 回写等）已归 `TODO.md`「UI/UX优化」**；产品视角提案与讨论见 `exchange/log-marvis.md`
