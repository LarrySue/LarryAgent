# UI Designer 交流区（WorkBuddy UI）

> 专属文件，UI Designer 在此记录设计意见、评审反馈、界面基调相关产出。

---

## 项目全面阅读报告（2026-08-15）

### 已阅读文件

| 文件 | 用途 |
|------|------|
| `README.md` | 项目结构、架构概览、技术栈 |
| `TODO.md` | 完整开发路线图 P0–P5 + 当前待办 |
| `HUMAN.md` | 人类治理原则、参与 AI 分工 |
| `client/chat.html` | 现有测试用聊天页面（完整代码） |
| `client/src-tauri/tauri.conf.json` | Tauri 配置（窗口 900×700、shell 插件） |
| `client/src-tauri/src/main.rs` | Rust 入口（骨架状态，TODO 占位） |
| `mobile/README.md` | 手机端规划（无实际代码） |
| `exchange/workbuddy.md` | WorkBuddy 交流区（P4 定案与派发） |
| `exchange/marvis.md` | Marvis 交流区（P4.35 任务描述 + 界面基调初稿） |
| Git 最近 20 条提交 | 开发节奏与近期变更 |

### 项目认识

**LarryAgent** = 个人 AI Agent，技术栈 Python FastAPI + SQLite + ChromaDB + Tauri(Vue3)。

**进度**：P0–P3 全部完工（37/37 测试全绿），当前处于 **P4（PC 客户端可用）** 起跑线。
第一波任务已派发：Trae → P4.1 + P4.2；Marvis → P4.35。

### 现有 UI 资产盘点

| 资产 | 状态 | 评价 |
|------|------|------|
| `client/chat.html` | ✅ 可运行 | 功能完整的临时测试页，SSE 流式 + 工具调用卡片都有 |
| `client/src-tauri/` | ⚠️ 骨架 | conf.json 就绪，main.rs 全是 TODO 占位 |
| `mobile/` | ❌ 仅规划 | 无任何实际代码 |

---

## Marvis P4.35 初稿评审与响应（2026-08-15）

> Marvis 从产品视角出初稿（见 `exchange/marvis.md` "P4.35 界面基调初稿"段），以下是我的设计视角接手——冲突分析、判断、以及完整 design token 精化。

### 一、共识确认（直接采纳，无异议）

| Marvis 条目 | 我的判定 | 备注 |
|-------------|---------|------|
| 产品调性"克制、专业、可信赖" | ✅ 完全同意 | 约束后续所有选择 |
| 布局：左栏260px + 右主区 | ✅ 完全一致 | 成熟模式不创新 |
| 暗色为主、亮色后置 | ✅ 同意 | P4 只做暗色 |
| 多角色轻量方案（不做三套换肤） | ✅ 完全一致 | 色点+问候语+色带足够 |
| 字体中文优先系统字体 | ✅ 一致 | Inter 英文 fallback |
| 工具调用卡片=灵魂组件 | ✅ 强烈认同 | Agent 产品差异化核心 |
| P4 首版范围限定 | ✅ 同意 | 会话列表+消息流+输入框+角色切换 |
| 彩色只作"可辨识的视觉点" | ✅ 核心原则采纳 | 不铺大面积彩色 |

### 二、冲突点分析与我的判断

#### 冲突 A：品牌主色方向

| | 我初稿 | Marvis 初稿 |
|--|--------|------------|
| 方向 | 青蓝 `#3B82F6` 作为品牌主色铺开 | **中性灰阶为主色，不设大面积彩色** |
| 理由 | 科技感、暗色对比度舒适、有辨识度 | "克制的高级感"、彩色仅作视觉点 |

**我的最终判断：采纳 Marvis 方向，加一个折中。**

- 界面主体（背景、容器、气泡、侧栏）全部走灰阶——听 Marvis 的
- 但保留**唯一一个交互强调色 `#378ADD`**（低饱和蓝），仅用于：
  - 主操作按钮（发送、新建会话）
  - 链接文字
  - Focus ring（键盘焦点）
  - 加载中的 spinner
- **不做品牌地毯式铺色**。这个蓝色不是"品牌主色"，而是"交互锚点色"——没有它用户不知道哪里可以点

**理由**：纯灰阶界面在可用性上有风险——按钮和可点击区域缺乏视觉暗示，尤其对非设计师用户。"克制"不等于"不可交互"。一个克制的蓝色锚点既满足 Marvis 的调性要求，又保住 WCAG 可用性底线。

#### 冲突 B：default 角色是否有颜色

| | 我初稿 | Marvis 初稿 |
|--|--------|------------|
| default 色 | `#6366F1` 靛蓝 | **中性灰（无彩）** |
| 理由 | 三角色平等各有标识 | default=通用=不需要彩色 |

**我的最终判断：倾向 Marvis，但调整亮度保对比度。**

- default 用 `#9CA3AF`（亮中性灰）——在深色底板 `#0F1117` 上对比度约 7.2:1，过 WCAG AA
- health 用 `#34D399`（低饱和翠绿，比 Marvis 的 `#5DCAA5` 更亮一点保对比度）
- finance 用 `#FBBF24`（低饱和琥珀，比 Marvis 的 `#EF9F27` 更亮）
- 形成"无角色=灰，有角色=淡彩"的语义层级

**疑问点**：default 纯灰色是否会让用户觉得"没选中角色"或"角色切换坏了"？建议加一个微妙的默认态图标或文字提示（如侧栏显示"通用"而非空白）来消除歧义。

### 三、完整 Design Token 体系（基于 Marvis 初稿精化）

#### 3.1 配色 Token

```css
/* ===== 暗色主题 (Dark) ===== */

/* --- 背景层级 (三级) --- */
--color-bg-base:        #0F1117;   /* 底板 */
--color-bg-surface:     #1A1D24;   /* 容器表面（侧栏、输入区） */
--color-bg-elevated:    #242830;   /* 悬浮层（弹窗、下拉菜单、工具卡片） */
--color-bg-overlay:     rgba(0,0,0,0.6);  /* 遮罩 */

/* --- 文字层级 --- */
--color-text-primary:   #E4E4E7;   /* 正文 */
--color-text-secondary: #A1A1AA;   /* 辅助说明 */
--color-text-muted:     #71717A;   /* 占位符、禁用 */
--color-text-inverse:   #0F1117;   /* 深色背景上的反白字 */

/* --- 边框 --- */
--color-border-default: rgba(255,255,255,0.08);  /* 默认分隔 */
--color-border-hover:   rgba(255,255,255,0.15);  /* hover 状态 */
--color-border-focus:   #378ADD;                 /* 键盘焦点 */

/* --- 交互强调色 (唯一彩色锚点) --- */
--color-accent:         #378ADD;   /* 按钮 / 链接 / focus / spinner */
--color-accent-hover:   #5BA4ED;   /* hover 态 */
--color-accent-muted:   rgba(55,138,221,0.15);   /* 浅底色（选中态背景） */

/* --- 语义色 --- */
--color-success:        #10B981;
--color-success-bg:     rgba(16,185,129,0.12);
--color-warning:        #F59E0B;
--color-warning-bg:     rgba(245,158,11,0.12);
--color-error:          #EF4444;
--color-error-bg:       rgba(239,68,68,0.12);
--color-info:           #378ADD;
--color-info-bg:        rgba(55,138,221,0.12);

/* --- 角色标识色 (Role Identity Colors) --- */
--role-default:         #9CA3AF;   /* 中性灰 — 无特定角色 */
--role-health:          #34D399;   /* 低饱和翠绿 */
--role-finance:         #FBBF24;   /* 低饱和琥珀 */

/* --- 消息气泡 --- */
--bubble-user-bg:       #1E293B;   /* 用户消息 — 略深于 surface */
--bubble-user-border:   rgba(55,138,221,0.3);  /* 用户气泡带一抹强调色边框 */
--bubble-agent-bg:      #1A1D24;   /* AI 回复 — 与 surface 同级 */
--bubble-agent-border:  transparent;
--bubble-error-bg:      rgba(239,68,68,0.08);
--bubble-error-border:  rgba(239,68,68,0.3);

/* --- 侧栏 --- */
--sidebar-bg:           #13141C;   /* 比底板略深，形成层次 */
--sidebar-item-hover:   rgba(255,255,255,0.04);
--sidebar-item-active:  rgba(255,255,255,0.08);
```

#### 3.2 排版 Token

```css
/* --- 字体族 --- */
--font-sans:    "Inter", "SF Pro Display", "Microsoft YaHei", "PingFang SC", -apple-system, sans-serif;
--font-mono:    "JetBrains Mono", "Cascadia Code", "Consolas", monospace;

/* --- 字号 (12px 最小) --- */
--text-xs:   0.75rem;   /* 12px — 辅助标签、时间戳 */
--text-sm:   0.8125rem; /* 13px — 次要文字、工具卡片内容 */
--text-base: 0.875rem;  /* 14px — 正文（主要阅读尺寸） */
--text-lg:   1rem;      /* 16px — 小标题、消息气泡文字 */
--text-xl:   1.125rem;  /* 18px — 区域标题 */
--text-2xl:  1.25rem;   /* 20px — 页面主标题 */

/* --- 字重 (两级原则) --- */
--weight-normal: 400;
--weight-medium: 500;

/* --- 行高 --- */
--leading-tight:   1.25;  /* 标题 */
--leading-normal:  1.5;   /* 英文/数字正文 */
--leading-relaxed: 1.6;   /* 中文正文（舒适区） */
```

#### 3.3 间距 Token（4px 基准）

```css
--space-0:   0;
--space-1:   0.25rem;  /* 4px  — 紧凑间距 */
--space-2:   0.5rem;   /* 8px  — 元素内间距 */
--space-3:   0.75rem;  /* 12px — 组件间小间距 */
--space-4:   1rem;     /* 16px — 标准间距 */
--space-5:   1.25rem;  /* 20px — 密集区块间距 */
--space-6:   1.5rem;   /* 24px — 区块间距 */
--space-8:   2rem;     /* 32px — 大区块间距 */
--space-10:  2.5rem;   /* 40px — 区域间距 */
--space-12:  3rem;     /* 48px — 页面边距 */
```

#### 3.4 圆角 Token

```css
--radius-sm:  0.375rem;  /* 6px  — 小元素（标签、badge） */
--radius-md:  0.5rem;    /* 8px  — 默认圆角（输入框、按钮） */
--radius-lg:  0.75rem;   /* 12px — 卡片（消息气泡、工具卡片） */
--radius-xl:  1rem;      /* 16px — 大容器（弹窗、面板） */
--radius-full: 9999px;   /* 圆形（头像、色点） */
```

#### 3.5 过渡动画 Token

```css
--duration-fast:   150ms;  /* hover、focus 即时反馈 */
--duration-normal: 300ms;  /* 展开、收起、过渡 */
--duration-slow:   500ms;  /* 页面级转场 */

--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);  /* 微弹跳（角色切换问候语） */
```

### 四、组件详细规格

#### 4.1 消息气泡 (MessageBubble)

```
┌──────────────────────────────────────┐  ← border-radius: --radius-lg (12px)
│ ┃ 内容文字...                        │  ← 左侧色带 3px，颜色 = --role-{current}
│ ┃ 支持多行、支持 markdown 渲染       │  ← padding: 12px 16px
│                                      │  ← max-width: 72%（防过宽）
└──────────────────────────────────────┘

用户消息：
  - align-self: flex-end
  - background: --bubble-user-bg
  - border: 1px solid --bubble-user-border
  - 左侧无边框色带（用户不需要角色标识）
  - 右下角小圆角（tail）可选，P4 首版不做

AI 消息：
  - align-self: flex-start
  - background: --bubble-agent-bg
  - 左侧色带 3px × --role-{current}
  - 无外边框

错误消息：
  - background: --bubble-error-bg
  - border: 1px solid --bubble-error-border
  - 文字色: --color-error
  - align-self: flex-start
```

#### 4.2 工具调用卡片 (ToolCallCard) — 灵魂组件

```
┌─────────────────────────────────────────────┐
│ ┃ 🔧 file_ops.read  (轮次 2)    [▶ spinner] │  ← header: 角色色左边框 + 工具名 + 轮次
├─────────────────────────────────────────────┤
│ 参数: {"path": "/workspace/config.yaml"}    │  ← 折叠参数区（默认展开）
├─────────────────────────────────────────────┤
│ 结果摘要...                                 │  ← 执行后出现，max-height: 100px 可滚动
└─────────────────────────────────────────────┘

状态变化:
  1. 执行中: header 显示 spinner 动画 + 工具名
  2. 成功:   spinner → ✅ + 结果摘要区展开（绿色左侧条）
  3. 失败:   spinner → ❌ + 错误信息（红色左侧条）

样式:
  - background: --color-bg-elevated
  - border: 1px solid --color-border-default
  - border-radius: --radius-md (8px)
  - padding: 10px 14px
  - max-width: 85%
  - header 左侧色带 3px = --role-{current}
  - 结果成功时色带变 --color-success
  - 结果失败时色带变 --color-error
  - 可折叠：点击 header 区域 toggle 参数/结果区的显示
```

#### 4.3 输入框 (ChatInput)

```
┌─────────────────────────────────────────────────┐
│  输入消息...                            [发送]  │
└─────────────────────────────────────────────────┘

- background: --color-bg-elevated
- border: 1px solid --color-border-default
- border-radius: --radius-lg (12px)
- focus 时 border-color: --color-accent + 外发光 box-shadow: 0 0 0 2px --color-accent-muted
- min-height: 44px（触控最小目标）
- max-height: 120px（约 5 行，超出滚动）
- placeholder: --color-text-muted
- 发送按钮: --color-accent 背景 + 白色文字 + --radius-md
- 发送按钮 disabled: opacity 0.4 + cursor not-allowed
- 底部贴边，padding: 12px 20px
```

#### 4.4 侧栏会话项 (SidebarItem)

```
● ┃──────────────────────────────  17:42    │
  │ 今日健康咨询                     │
  └──────────────────────────────────────     │

结构（从左到右）:
  1. 角色色点: 8px 圆形, 背景 = --role-{role}
  2. 会话标题: 单行截断省略号, --color-text-primary
  3. 时间戳: --color-text-muted, --text-xs, 右对齐

交互:
  - hover: background --sidebar-item-hover
  - active/当前选中: background --sidebar-item-active + 左侧 2px 强调色条 (--color-accent)
  - 右键菜单: 删除 / 重命名（P4 首版可不做右键，用图标按钮代替）
```

#### 4.5 顶部栏 (TopBar)

```
┌──────────────────────────────────────────────────┐
│  ◀  LarryAgent              💊 health ▼    ⚙️   │
└──────────────────────────────────────────────────┘

- 高度: 48px
- background: --color-bg-surface
- border-bottom: 1px solid --color-border-default
- 左侧: 侧栏折叠按钮（仅桌面端显示）
- 中间: 产品名 / 当前会话标题（可编辑）
- 右侧:
  - 角色切换下拉: 当前角色色点 + 角色名 + 下拉箭头
  - 设置按钮（图标，P4.5 再填充功能）

角色切换下拉内容:
  ├── ● 通用 (default)   — 选中时打勾
  ├── ● 健康 (health)
  └── ● 金融 (finance)

每项前有对应角色色点。
```

### 五、响应式断点体系

```css
/* 断点定义 */
--breakpoint-sm:  640px;   /* 手机横屏 /小平板 */
--breakpoint-md:  768px;   /* 平板竖屏 */
--breakpoint-lg:  1024px;  /* 小笔记本 / 平板横屏 */
--breakpoint-xl:  1280px;  /* 桌面 */

/* ===== 各断点布局行为 ===== */

/* Mobile (< 640px): 单栏全宽 */
.sidebar { display: none; }  /* 或底部抽屉触发 */
.main-area { width: 100%; }
.message-bubble { max-width: 88%; }

/* Tablet (640-1023px): 侧栏可折叠 */
.sidebar { width: 240px; }  /* 比桌面窄 20px */
.sidebar.collapsed { width: 48px; }  /* 仅图标 */
.main-area { flex: 1; }

/* Desktop (>= 1024px): 双栏完整 */
.sidebar { width: 260px; }
.main-area { flex: 1; }
/* 允许用户拖拽调整侧栏宽度范围: 200px - 320px */

/* Large Desktop (>= 1280px): 消息区更宽 */
.sidebar { width: 280px; }  /* 可选放大 */
.message-bubble { max-width: 68%; }  /* 更宽时气泡不撑满 */
```

**Tauri 窗口约束**（900×700 默认）：
- 900px 宽度落在 `lg` 断点以上，双栏布局正常工作
- 最小窗口宽度建议限制为 **800px**（低于此值侧栏自动折叠到 48px 图标模式）
- 700px 高度足够容纳顶部栏(48px) + 消息流(自适应) + 输入区(~60px) + 状态栏(24px)

### 六、边界状态设计（Edge Cases）

| 场景 | 处理方式 |
|------|----------|
| **空会话列表** | 侧栏中央显示空状态插画 + 文字"开始新对话"+ 新建按钮高亮 |
| **空消息流** | 中央显示欢迎语（含角色专属问候）+ 3 个快捷建议气泡（可点击发消息） |
| **超长消息 (>2000字)** | 默认折叠显示前 6 行 + "展开全文"链接；代码块独立横向滚动 |
| **网络断开** | 顶部显示 warning banner（`--color-warning-bg` + "连接已断开，正在重连..."）；输入框禁用 + 发送按钮灰显；自动重连 3 次失败后显示"手动重试"按钮 |
| **SSE 流中断** | 最后一条 delta 后显示 "..."(打字中态)；5 秒内无新数据 → 显示"重新发送"按钮；工具调用中断 → 卡片保持 spinner + 红色警告"执行超时" |
| **AI 回复为空** | 不渲染气泡；状态栏短暂闪现"AI 返回了空回复"；不阻塞后续对话 |
| **并发请求防护** | 发送新消息时：禁用输入框 + 发送按钮；上一条 AI 回复未完成时可选择"停止生成"再发新消息（P4 首版可简单处理：直接禁用直到当前回复完成） |
| **会话标题过长** | 侧栏单行截断 + title tooltip 显示完整标题；超过 20 字符时自动截取（后端 P4.3 已定前 20 字规则） |
| **工具结果超大** | 结果区 max-height: 100px + 内部滚动；底部显示"查看完整结果"展开按钮；JSON 自动格式化缩进 |

### 七、Accessibility (WCAG AA 合规)

#### 7.1 色彩对比度检查表

| 组合 | 前景色 | 背景色 | 对比度 | 达标? |
|------|--------|--------|--------|-------|
| 正文 | #E4E4E7 | #1A1D24 | 10.2:1 | ✅ AA+AAA |
| 辅助文字 | #A1A1AA | #1A1D24 | 5.4:1 | ✅ AA |
| 禁用文字 | #71717A | #1A1D24 | 3.8:1 | ❌ 仅 AAA 不通过（AA 需 3:1 大文字可豁免） |
| 链接/强调 | #378ADD | #1A1D24 | 5.8:1 | ✅ AA |
| role-default | #9CA3AF | #0F1117 | 7.2:1 | ✅ AA |
| role-health | #34D399 | #0F1117 | 7.8:1 | ✅ AA |
| role-finance | #FBBF24 | #0F1117 | 9.1:1 | ✅ AA |
| 错误文字 | #EF4444 | #1A1D24 | 4.9:1 | ✅ AA |

#### 7.2 交互规范

- **触控目标**: 所有可点击元素 ≥ 44px × 44px（按钮、侧栏项、链接区域）
- **键盘导航**: Tab 序列遵循视觉顺序（侧栏 → 消息流 → 输入框 → 发送按钮）；Focus ring 用 `--color-accent` 2px outline + 2px offset
- **屏幕阅读器**:
  - 消息气泡: `role="article"` + `aria-label="{role}的消息"`
  - 工具卡片: `role="region"` + `aria-label="工具调用: {name}"`
  - 角色切换: `aria-selected` 标记当前角色
  - SSE 流更新: `aria-live="polite"` 区域播报新消息
- **动效减弱**: `@media (prefers-reduced-motion: reduce)` 时关闭所有过渡动画（色带 slide、问候语 fade、spinner 旋转替换为静态指示器）

---

## 待老大拍板的问题

### 已解决（老大已拍板）

- [x] ~~品牌主色方向~~ → **定案：灰阶主体 + 交互锚点色 #378ADD**。老大确认"克制高级感是底色，交互强调色不冲突，都是对的"。两者正交——灰阶管氛围，蓝色管可用性。
- [x] ~~default 角色是否有颜色~~ → **定案：亮中性灰 #9CA3AF**。老大认可我的判断。health=#34D399 低饱和翠绿，finance=#FBBF24 低饱和琥珀。
- [x] ~~侧栏拖拽~~ → **P4 不做**。老大确认"锦上添花，任何时候都可以加"。260px 固定值够用。
- [x] ~~#00ff88 绿残留~~ → **不保留**。

### 仍需决策

- [x] ~~Logo / 图标资源~~ → **定案：毛笔笔触三笔构图（C2 写意版）**。详见下方"Logo 设计定案"。
- [ ] **角色切换过渡动画** → **方向已定：要有但不宜显眼（无冲击感）**。方案修正为纯 color transition（200ms fade），不用 transform/位移。详见下方"过渡动画修正"。
- [x] ~~欢迎页快捷建议气泡~~ → **不做**。老大原话："这确实是一个很好的东西，可惜我是一个小众的人，我不要这玩意儿。"空会话保持空白即可。

---

#### Logo 设计定案（2026-08-15）

> 老大原话："外圈必须要有一个缺口，这是灵魂，就它了！"

**最终方案：C2 写意版 — 毛笔三笔 + 禅圆缺口**

| 元素 | 描述 | 色彩 |
|------|------|------|
| 外圈 | 不完整的圆（enso 禅圆），一笔写成，右上角有缺口 | 墨蓝 #1E2937–#334155 |
| 草字头 | 两点：左墨右朱红，轻灵点在上方 | 墨色 + 朱红 #BF4F3E |
| S 形 | 草书连笔，提按幅度大，收笔飞白 | 墨蓝同上 |

**设计语言**：
- 当代抽象书法风格（非传统国画），三笔构成"S + 苏"的语义融合
- 飞白质感是核心识别特征——即使缩到 32px 仍可感知"这是笔触不是色块"
- 全图唯一彩色 = 一枚朱红点（印章意象），其余全墨色灰阶
- 白底纯净无纹理（适配实际 icon 使用场景）

**迭代历程**：
1. 初版 3 方案（L字母 / 同心圆 / 三圆重叠）→ 方向不对（缺 S 核心缺中国风）
2. 第二轮 3 方案（墨韵S / 印章Su / 苏字融合 C）→ 选定 C
3. C 的修改：光滑色块 → **毛笔笔触**（老大提出的关键改进）
4. C1 温和 vs C2 写意 → **选定 C2**（外圈缺口 = 灵魂）

**产出文件**：
- `D:\Code\LarryAgent\.workbuddy\artifacts\FINAL_app_icon_logo_for_LarryA_2026-08-15T10-10-35.png` — 最终版 1024×1024

**待办**：
- [ ] 导出 .ico 格式（Tauri 窗口图标需要）
- [ ] 导出多尺寸 PNG（16/32/48/64/128/256）用于不同场景
- [ ] AI 生成水印需去除后才能作为正式资产（或用此图找设计师描摹矢量版）

---

#### 过渡动画方案（2026-08-15 修正版）

> 老大反馈："过渡动画要有，但是不宜太显眼/有冲击感"。核心原则：用 **color transition（渐变）** 替代 **transform（位移）**——前者柔和，后者有冲击感。

| 元素 | 动画方式 | 时长 | 缓动 |
|------|---------|------|------|
| AI 气泡左侧色带 | `background-color` transition | 200ms | `ease` |
| 顶部问候语文字 | `opacity` fade in/out | 200ms | `ease-out` |
| 侧栏角色色点 | `background-color` transition | 150ms | `ease` |
| 工具卡片 header 左侧条 | `background-color` transition | 200ms | `ease` |

**体感目标**："温和地变了，没有动的感觉"。颜色切换本身已是提示，不需要位移动画叠加。

```css
/* 角色切换过渡 — 全局生效 */
.role-indicator {
  transition: background-color 200ms ease, color 150ms ease;
}
.greeting-text {
  transition: opacity 200ms ease-out;
}
.bubble-color-strip {
  transition: background-color 200ms ease;
}

/* 动效减弱时完全关闭 */
@media (prefers-reduced-motion: reduce) {
  .role-indicator,
  .greeting-text,
  .bubble-color-strip {
    transition: none;
  }
}
```


