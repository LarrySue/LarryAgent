# DSH 插件参考清单（值得参考插件策展）

> **定位**：DSH 生态（及值得借鉴的外部生态）中**值得参考的插件**的长期策展清单——每件沉淀「**值得参考的点**」。⛔ **只借鉴不直装**（原则 = `docs/dsh/dsh-migration.md` §3.0），本清单不回答"装不装"、只回答"参考什么"。**"浩如烟海"是常态** ⇒ 只收**筛选后的观察对象**，宁缺毋滥。
> **维护人**：**Qoder**（老大 2026-10-12 设立并归口）。
> **更新模式**：**老大触发制**——不设定期任务、不设执行间隔；每轮更新在 §⑥ 版本记录留痕。
> **区域属性**：本文件是 `docs/`（定案区）内的**例外活文档**——由 Qoder 持续维护；其余 AI 不直接改动（发现问题向 Qoder 或老大提出）。长期策展、不随任何阶段专题归档。
> **证据属性**：本清单**全部为桌面研究二手信息**（README／npm 元数据／社媒口碑）——**零下载、零安装、零测试**；老大已知悉并免除 100% 正确性责任 ⇒ 每条结论必带来源，未实测项 ⛔ 不得据此下"能用/不能用"的定论。

## ① 收录判据 ＋ 标注体系

**收录判据**（满足其一即可候选，最终由策展判断）：
1. 有**可借鉴的设计模式／机制／实现技巧**，且能与能力树（`docs/product-positioning.md` 2.x）某子项建立映射；
2. 代表某种**产品形态**的先行实践（即便我方暂无对应子项）；
3. 老大点名关注的对象。

**淘汰判据**：与产品定位冲突 ／ 关键信息无法核实 ／ 长期无活力且参考点已被吸收 ⇒ 移入 §⑤ 淘汰区（**留一行理由，不静默消失**）。

**标注体系**（沿用 `docs/ai-governance.md` §3.1 证据分级，按本清单细化）：🟢 已实测验证 ｜ 🟡 **已读公开资料**（README／规格／社媒；未实测；若已读源码可加注「源码级」）｜ 🔴 待研（仅传闻／一句话描述）。

**两条硬纪律**：
- **版本脱节哨兵**（`docs/dsh/dsh-migration.md` §3.0.1 事实 14）：每件必核其 peer 对基线 `dsh-v0.1.5-rc.2` 的 semver 兼容声明——**本轮已实证此哨兵的现势性：生态兼容前沿已到 `0.1.7-rc.2`／`0.2.0-rc.x`，多篇头部件已不兼容我方基线**（见 §③ 版本观察）；
- **采集锚**：每条记**采集日期**与**当时基线 tag**；换基线时旧读数不自动外推，**全表"可装性"须重判**。

## ② 清单主体（v2 深研版 · 采集 2026-10-12 · 基线锚 `dsh-v0.1.5-rc.2`）

### 1. `dsh-mnemon` —— 可组合分层记忆 🟡
- **身份**：`omdsh-dev/dsh-mnemon`｜npm `dsh-mnemon` v0.5.28（2026-10-11）｜★513｜MIT｜包族：`dsh-mnemon-source-runtime`／`dsh-mnemon-provider-mnemon-native`＋第三方 GC 治理件（`Zn-Dk/dsh-mnemon-gc`）
- **老大手记**：自带分层记忆的可组合记忆系统
- **亮点**（README）：**可组合、视图化记忆**——可插拔 sources 与 strategies、"layered memory out of the box"；**Memory Spaces ／ 运行时工作记忆 ／ Project Documents** 分层召回；UI 带 turn 记忆条（展开可见当轮读了哪个文档）；设计立论（README 原话）：「全塞一个记忆库要么每轮淹没、要么漏掉关键」⇒ 分而治之
- **技术边界**：**peer 要求 `dsh-app-boot ^0.1.7-rc.2 || ^0.2.0-rc.1` ⇒ 对我方 `0.1.5-rc.2` 不可装**（哨兵命中）；Node ≥20；未实测
- **口碑**：[composio.dev 榜单 #10](https://composio.dev/content/best-deepseek-harness-plugins)（"cross-session memory layer"）；deepseekdocs／springbrand／deepseek404 多目录站收录
- **横向**：对照我方 2.4 域自研（engine ＋ SQLite/ChromaDB 双写）——其"视图化＋可插拔 source/strategy"分层是 2.4.5 四作用域 schema 联审的现成参照

### 2. `dsh-univer-office` —— Univer 官方办公套件 🟡
- **身份**：`dream-num/dsh-univer-office`｜npm v0.3.7（10-08）｜★507／44 forks｜MIT｜**Univer 官方组织（dream-num）出品**
- **老大手记**：Univer官方出品的插件 表格文档的对话内联展示 浮窗worktree 会话复盘
- **亮点**："Give DeepSeek Harness a real office environment"——表格／文档／幻灯片／多维表格／画布**统一运行时（数据互联）**；**隔离 worktree ＋ 多智能体协作**；捆绑协作 Gateway 与 Viewer（对话内联预览）
- **技术边界**：兼容声明 **`0.1.5-rc.3 || 0.1.7-rc.1 || 0.2.0-rc.1`——比我方 rc.2 高一个小版本，现装不上**；Node ≥22.19；截图/PDF 需本地 Chromium；不支持幻灯片母版/备注、思维导图导出
- **口碑**：[WPS 官方论坛专帖](https://bbs.wps.cn/topic/95380)（08-21）、[jdon](https://www.jdon.com/94186-dsh-univer-office-office-plugin-deepseek-harness.html)（08-22）、codefather／dsh.plus 收录
- **横向**：官方另有 `@deepseek-ai/dsh-skill-office`（Word/PPT/Excel 工作流 skills，alpha 代）——**skill 路线 vs 本件 runtime 路线**两条 Office 路线并存；映射 2.3.4 展示面参照

### 3. `dsh-agent-teams` —— 多智能体团队（本轮生态头部）🟡
- **身份**：`NanmiCoder/dsh-agent-teams`｜npm `@nanmicoder/dsh-agent-teams` v0.1.23（10-11）｜**★2058（9 件最高）**｜MIT｜AtomGit 同步｜衍生：`dsh-agent-teams-fish`（中文增强：自然语言组队／任务依赖 DAG／信箱通信／右栏树状监测）、`@zaimokuza/dsh-agent-teams-office`、`Contexera/dsh-agent-team`（durable members）
- **老大手记**：Agent团队管理
- **亮点**（README）："One prompt. A working team."——当前会话变 **captain**，拉起 **durable sub-agents**、目标拆**依赖感知任务**、**直接消息**协调；**14 个协调工具 ＋ 持久状态 ＋ 自动共享任务调度 ＋ 实时 Web UI**，无需外置工作流引擎；Web ＋ Headless 双形态
- **技术边界**：peer **显式枚举含 `0.1.5-rc.2` ⇒ 我方基线可装 ✓**；Node `^22.19 || ≥24`；未实测
- **口碑**：[知乎专栏](https://zhuanlan.zhihu.com/p/2082818624419640339)（09-14）、[cnblogs 必装 10 插件榜 #7](https://www.cnblogs.com/12lisu/p/22521174)（08-17）、[BAIH"插件一夜燃爆"](https://hub.baai.ac.cn/view/57162)（08-16）、[B站实测视频](https://www.bilibili.com/video/BV1THhK63Ebd/)
- **横向**：⭐ **官方并行有 `@deepseek-ai/dsh-experimental-agent-team-profile`**（experimental：Lead ＋ 具名 teammate ＋ 直接消息 ＋ 持久共享任务板 ＋ 冷恢复）——**社区件跑在官方前面**的样本；对我方多 AI 协作模式有直接参照价值

### 4. `dsh-im`（xmanrui）—— IM 入口（9 平台）🟡
- **身份**：`xmanrui/dsh-im`｜npm `@xmanrui/dsh-im` v4.38.1（10-11）｜**★1902**｜MIT｜**DeepSeek Harness 官方赞助徽章**＋deepseek1024 下载 Top10＋dshfind 分类第一
- **老大手记**：让聊天软件成为agent入口
- **亮点**：扫码／机器人凭据把 **微信、飞书、钉钉、企业微信、QQ、Slack、Telegram、Discord、WhatsApp** 接入 DSH；「设置→IM机器人」统一入口；App Manifest 接入；deps 含邮件栈（imapflow/nodemailer/mailparser ⇒ IMAP/SMTP 通道）
- **技术边界**：peer **未声明**（兼容面以 README/实测为准）；Node ≥22.19；`$DSH_HOME/im` 目录约定；凭据/扫码为前提；⚠️ **命名撞车**：npm 裸名 `dsh-im` = 另一件 `shaobeichen/dsh-im-bridge`（统一 IM 桥核心：会话映射／命令／通知总线／审批流／MockChannel，v1.0.5、8 月中后更新放缓）
- **口碑**：[官方 discussion #5080](https://github.com/deepseek-ai/deepseek-harness/discussions/5080)、[知乎九大 IM 实测](https://zhuanlan.zhihu.com/p/2074184129298555725)（08-21：对照钉钉/飞书原生 Agent 入口——"DSH-IM 选择在 Harness 内部做插件"）、[CSDN 指南](https://deepseek.csdn.net/6a807aba10ee7a33f29b6afa.html)（08-15）
- **横向**：同域 `@michengai/dsh-im-connect`（10-12 活跃，飞书/钉钉/企微 SDK 直连）、`dsh-im-companion`（"助理/家"视图增强）；映射 2.3.5 主动触达 ＋ 2.10 多端；我方 B 段 stdio 不可跨机 ⇒ "入口在本地、通道在外"的现成形态参照

### 5. `dsh-cost-meter`（Han-1413141）—— 费用统计 🟡
- **身份**：npm `dsh-cost-meter` v1.8.23（10-12）｜★298｜周下载 ≈1.8 万｜MIT｜⚠️ **同名多枝**：`@goodandready`（0.8.16，需 ≥0.1.7-rc.2）、`@gamegeek-saikel`（0.5.1，仅 0.2.0-rc.2）、目录站另见 lopncod／Creakono 变体 ⇒ 认准主仓
- **老大手记**：费用消耗清单
- **亮点**（Web GUI 计费面，功能极重）：每会话/当日费用、历史、**官方价格一键同步**、**内置 170+ 模型 ID 价格目录自动匹配**、**峰谷时段计价显示＋切换前弹窗/系统通知**、预算与用量百分比、官方账户/自定义 provider 余额与进度条、Codex 式 token 热力格、**11 家 Coding Plan 配额**（Anthropic/Z.ai/MiniMax/Kimi/OpenRouter/SiliconFlow/CommandCode/SCNet/火山方舟/Qwen/小米 MiMo）、**订阅配额与 API 计费双轨**（日/周/月曲线）、输入框上方配额条
- **技术边界**：peer 含 `dsh-home-paths/credentials ^0.1.5-0 ⇒ 兼容我方 0.1.5-rc.2 ✓`；Node ≥20；web GUI 导向；"Ledger busy"账本锁有专文恢复（并发账本锁＝已知坑）；价格目录准确性依赖作者维护
- **口碑**：[aliyun 必备清单](https://developer.aliyun.com/article/1759329)（08-31"不看费用等于裸奔…峰谷切换前自动提醒"）、[避坑文](https://www.wsisp.com/helps/107739.html)（09-20）
- **横向**：**正中我方 2.7.4/2.8.3 自做面**（`token-meter` 只有"当前请求压力"快照，累计入库＋预算/告警自做）——"官方价目同步＋峰谷计价＋订阅/API 双轨"是需求清单级参照

### 6. `dsh-context`（bowenliang123）—— 上下文仪表盘 🟡
- **身份**：npm `dsh-context` v0.69.1（10-12，极活跃）｜**DeepSeek Harness 官方员工（@tianyicui／@turtle1999）公开推荐并 star**（X 帖）
- **老大手记**：上下文仪表盘，长会话上下文管理
- **亮点**（README）：跨会话 **Context Insights 一级侧栏页**（7 天 token/费用图、活跃热力图、构成环、可过滤会话卡）；会话内 **Context tab**（stats/composition/trend/events/messages）；**Fleet tab**（当前 agent ＋ parents ＋ 全部 subagent 实时卡）；右栏 Context panel；`/context` 斜杠命令
- **技术边界**：**peer `dsh-session >=0.1.7-rc.2 ⇒ 对我方 0.1.5-rc.2 不可装**；React 18.3；未实测
- **口碑**：codefather／dsh.so／deepseek404 收录；衍生：`dsh-context-compression-improved`、`dsh-context-milvus-core`
- **横向**：与我方 2.9.2（超长会话一致性）＋ 2.4 记忆联审——"组成/趋势/事件"观测层正是 `token-meter` 快照之上缺的那块

### 7. `dsh-skills-manager` —— 同名三枝 🟡
- **身份**：npm 裸名 = **Xichun123** 原版 v0.2.0（09-09，peer 停在 alpha 代 `^0.1.5-alpha.1` ⇒ 对 rc.2 兼容性存疑、疑停更）；**@michengai** v1.1.17（10-12 活跃，**显式枚举含 0.1.5-rc.2 ✓**、兼容至 0.2.1-alpha.2，[trendshift 趋势榜](https://trendshift.io/repositories/156890)、[awesome-dsh-skills](https://github.com/yzfly/awesome-dsh-skills) 收录）；@jasun0925（1.1.3，rc 早期代）；deepseek404 另见 penglai-doll 变体 ⇒ **同名生态混乱，认准维护活跃度**
- **老大手记**：（无描述）
- **亮点**：michengai 版——本地/项目 skills 统一管理（折叠源组/搜索/开关）、**跨 Agent 复用**（Codex/Claude Code/Copilot 的 skills 不改源文件接入）、GitHub skills 仓库发现＋更新预览＋备份恢复、ZIP/文件夹/SKILL.md 导入；Xichun 原版设计点——走官方 `ctx.skills` provider seam、「仅手动」开关**不重写 SKILL.md**、`skills-lock.json` 定向重装
- **技术边界**：michengai 版对我方基线可装 ✓；Apache-2.0；社区件非官方；未实测
- **横向**：我方若走 DSH skills 子系统，此为管理面 UI 现成参照；"跨 Agent 复用"与本项目多 AI 协作（.claude/.trae/.qoder 各自 skill 库）痛点直接对味

### 8. `modsearch`（@liustack）—— 免费联网搜索（DSH 原生件）🟡
- **身份**：npm `@liustack/modsearch` v5.10.6（10-04）｜MIT｜Node ≥22.13｜姊妹件 ModLens（文本模型视觉，免费 Antigravity CLI）
- **老大手记**：免费不需Key的网页搜索+X搜索+9网页抓取
- **亮点**（README）："In the chat app your model can search the web. On the API it cannot. ModSearch puts the web back"——**免费、免注册、免 API key**；网页搜索＋X 搜索＋单页抓取，返回**结构化 JSON 证据（搜索/抓取/引用）**；**引擎多路：Firecrawl（免钥匙，默认，免费额度）· Antigravity CLI · Tavily · Exa · Grok(X) · local ＋ 自动故障转移**；有 security.md
- **技术边界**：peer 未声明（安装形态按 README）；免费引擎有额度上限；抓取反爬风险与官方 `web-fetch-http` 同源；未实测
- **口碑**：[infoq 同域报道](https://www.infoq.cn/article/bfZzslUtldTMeEgYuVhe)（08-18）、skillhub／deepseek404 收录；同域竞品 `dsh-firecrawl`（需 Firecrawl Cloud key）
- **横向**：**直击我方 2.5.2**——现用 Brave（有 Key、有成本）；"多引擎 keyless ＋ failover ＋ 结构化证据"是 provider 层设计参照；X 搜索为 Brave 缺位能力

### 9. `cc-safety-net`（kenryu42）—— 跨 CLI 预执行护栏（**非 DSH 件**）🟡
- **身份**：npm `cc-safety-net` v2.6.10（10-12 活跃）｜MIT｜CI＋codecov｜[trendshift 趋势](https://trendshift.io/repositories/109730)
- **老大手记**：危险操作和敏感操作拦截
- **亮点**：**在工具调用执行前**拦截破坏性命令与密钥访问（SSH key/.env）；**解析命令真实语义**——包装命令/换序旗标不可绕过；**配置文件损坏时绝不拦截（fail-open）**；跨 **7+ 编码 agent CLI**（Claude Code/Codex/Gemini CLI/Copilot CLI/Kimi Code/OpenCode ＋ Pi/Cursor/Amp/Antigravity）
- **技术边界**：**peer = `@opencode/plugin`／`@opencode-ai/plugin` ⇒ 非 DSH 插件，我方仅作设计参照**；自述"不是沙盒"（不含进程、不设文件权限、不看网络出站）
- **横向**：对我方 2.7.2/2.3.3 的参照点＝**命令语义解析防绕过**（我方 approval 三段链是"问人"路线、此件是"自动拦"路线，两层可叠加）＋ **fail-open 哲学**（与我方"静默 fail-closed ＝ 假绿"纪律对照：护栏自身失效时宁可放行不误伤——两种失效取向都值得记录）

## ③ 版本观察（本轮最重要发现）＋ 横向对比

**⭐ 版本观察**：插件生态兼容前沿已推进至 `0.1.7-rc.2`／`0.2.0-rc.x`（npm 官方线已到 `0.2.0-rc.2`）。本轮 9 件的可装性判定：

| 件 | 对我方基线 `0.1.5-rc.2` |
|---|---|
| `dsh-agent-teams`（NanmiCoder）／`dsh-cost-meter`（Han）／`@michengai/dsh-skills-manager` | **显式枚举含 rc.2 ⇒ 可装 ✓** |
| `dsh-univer-office` | 要求 rc.3 ⇒ 差一个小版本 ✗ |
| `dsh-mnemon`／`dsh-context`／`@goodandready/dsh-cost-meter` | 要求 ≥0.1.7-rc.2 ⇒ 不可装 ✗ |
| `@xmanrui/dsh-im`／`@liustack/modsearch` | peer 未声明 ⇒ 未知，需实测 |
| `cc-safety-net` | 非 DSH 件（OpenCode/Claude Code 系） |

⇒ **生态已在"等我方跟版"**；本表"可装性"随基线变动，换基线时全表重判。（关联：跟版决策属老大裁，本清单只记事实。）

**横向对比簇**（一句话区分）：

| 簇 | 件与区分 |
|---|---|
| 记忆 | `dsh-mnemon`（分层可组合、视图化；需 ≥0.1.7）vs 官方 storage domain ＋ 我方自研 engine |
| 多智能体 | `dsh-agent-teams`（社区头部 ★2058）vs **官方 experimental agent-team**（Lead/teammate/任务板/冷恢复） |
| IM 入口 | xmanrui `dsh-im`（9 平台、官方赞助）vs `@michengai/dsh-im-connect`（SDK 直连）vs `dsh-im-bridge`（桥核心，撞名警告） |
| 费用 | Han `dsh-cost-meter`（全家桶，兼容 rc.2）vs `@goodandready`（轻量、需新基线）vs `@gamegeek-saikel`（仅 0.2.0） |
| 上下文观测 | `dsh-context`（观测层，需 ≥0.1.7）vs 官方 `token-meter`（压力快照） |
| 搜索抓取 | `modsearch`（免费多引擎 keyless）vs `dsh-firecrawl`（Cloud key）vs 我方现用 Brave（Key） |
| skills 管理 | `@michengai`（活跃、兼容 rc.2）vs Xichun123 原版（alpha 代、疑停更） |
| 护栏 | `cc-safety-net`（非 DSH：语义解析＋fail-open）vs 我方 approval/sandbox（fail-closed 纪律） |

**官方注意力信号**（收录/优先级参考）：dsh-im（官方赞助徽章＋官方 discussion）；dsh-context（官方员工 star＋公开推荐）；agent-teams（官方出 experimental 对位件）；univer-office（dream-num 为 Univer 官方）。

## ④ 观察渠道与工作方法（后续轮次）

1. **目录站/榜单**（本轮新发现，效率最高）：[dshfind.com](https://dshfind.com)（评分/下载徽章）／[dsh.deepseek404.com](https://dsh.deepseek404.com)（商店）／dsh-plugin.org／[deepseekdocs.com](https://deepseekdocs.com/en/ecosystem)／springbrand.ai／dsh.so／skillhub.cn／[composio.dev 榜](https://composio.dev/content/best-deepseek-harness-plugins)／[awesome-dsh-skills](https://github.com/yzfly/awesome-dsh-skills)／npm `keywords:dsh-plugin`／trendshift；
2. **社交平台（国内外）**：X ／ Reddit ／ 知乎专栏 ／ CSDN ／ cnblogs 必装榜 ／ aliyun 清单 ／ infoq ／ BAIH ／ B站/YouTube 实测视频 ／ WPS 论坛 ／ jdon ／ deepseek1024 下载榜——重点采**真实使用反馈**（活力与坑）；
3. **GitHub/npm 状态**：stars 趋势／最近提交／issue 响应／peer semver（哨兵）／是否 archived；
4. **技术角度**：源码与架构（capability seam 对接、与官方 `docs/subsystems/` 53 篇规格契合度）——本轮未做，后续可升"源码级"。

⚠️ 渠道结论一律按 §① 分级落档；**负面结论也是结论**（"不值得参考"记入 §⑤，不静默丢弃）。

## ⑤ 淘汰区

（暂无——v2 尚无淘汰件。）

## ⑥ 版本记录

- **v2（2026-10-12 · Qoder · 首轮深研）**：9 件全部 🔴→🟡（公开资料档：README＋npm packument＋社媒口碑；零下载零测试）。新增：逐件 semver 兼容判定（§③ 版本观察——生态前沿已到 0.1.7-rc.2/0.2.0-rc.x，3 件不兼容我方基线）；横向对比簇 8 组；官方注意力信号 4 条；目录站渠道 8+。方法备注：GitHub 本机 API 限流 ⇒ 元数据走 npm registry＋README 经 jsdelivr CDN，社媒走 WebSearch。
- **v1（2026-10-12 · Qoder）**：建档。收录老大手记 9 件（全部 🔴 待研）；确立收录／淘汰判据、标注体系与两条硬纪律；观察渠道框架成型；存量承接指针 3 处。基线锚 = `dsh-v0.1.5-rc.2`。
