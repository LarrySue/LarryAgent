# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| DSH-3.9.1 · DSH 调试体验台 | Trae | 本机 Windows | ✅ **已交付并通过 WB 复验**（§10 `ae33325` ＋ §11）｜🔵 **待老大再体验**（返工 §13 已完成）⇒ 退出信号① | 2026-10-18 |
| DSH-3.9.1-a · 实测反馈返工（cwd 换安全区 ＋ 时间戳本地化 ＋ ③ 定性探针） | Trae | 本机 Windows | ✅ **已回报并通过 WB 复验**（§12-5 ／ §12-6：J-a–J-d 全过；③ 判仓库根特例已随换 cwd 修复；代码 `97c1477`） | 2026-10-18 |
| DSH-3.9.1-b · **缓存前缀修复 ＋ 召回块时间戳收口**（**原 b／c 合单**：cache 前缀＋时间戳移除＋DB 修正＋usage 计量＋compaction 核查＋双面去重） | Trae | 本机 Windows | ✅ **已通过 WB 复验**（§5 主体 `55ae302` ＋ §6 老大指令反转 `a010f1e` ＋ §7：判定**成立**·带订正 1／增量 3；J-e 改口径为 J-e′）｜✅ **id 51 脏行已补**（§8）｜🟡 compaction 800k 阈值事实上不触发（长期优化）｜🟡 召回快照累积存疑 | 2026-10-18 |

> 📌 **Trae 侧两条活账（2026-10-18 留痕）**：① **TRAE.md 注入力度**——L38「git 提交以 Trae 身份签名」全仓历史未生效（author 均为 SuLarry），Trae 自相关提交起以 `-c user.name='Trae'` 单次参数签名（历史不动）；**老大接手操心中**。② **key 来源规则空缺**——派发稿预设两个工程内 key 来源，未覆盖「老大直接给测试 key」场景；规则空缺处先查工程层 Tier 0，已沉淀 Trae 私有 memory。

- ⚠️ **不要把本区当承接目标**（活日志会被随时清理 ⇒ 引用必成断链）；**回溯一律 `git log -p -- exchange/log-trae.md`**。
- ⚠️ **通用纪律**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— ⛔ **本条后半句已作废（2026-09-20 WB 复验实测推翻）**：原文写「本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，**出现英文即非本机原始产物**）」—— **「出现英文即非本机产物」不成立**：本机实测 `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统／用户 UI 语言实测是 zh-CN）。⇒ **保留前半**（⛔ 不得人工改写 ／ 意译），**撤掉后半的推论**。**替代纪律**：判「原文」只认**字节级**核对（按 ACP 936 解 GBK，或直接比原始字节），并**注明该段取自哪条通道**；**语言 ／ 编码不得作"证据是否被后处理过"的判据**。详见 `docs/local-env.md` §12.6。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

---

## 📤 DSH-3.9.1 · DSH 调试体验台（WB 派发 · 2026-10-18 · Trae · 本机 Windows）

### 0 · 目标

搭一个**浏览器调试体验台**：多轮对话 ＋ **实时事件流面板** ＋ 审批按钮，让老大亲手摸 DSH 的完整交互（对话 ／ 记忆召回 ／ 事件可见性 ／ 审批）——服务 **DSH-3.9 退出信号①**（调试体验 go/no-go）。⏸ **临时台定位**：⛔ 不按产品形态设计，验收后归宿 = 3.8 延后清单的器材。

### 1 · 判据（J1–J6，工具验收 · 每条可复算）

| # | 判据 | 取证 |
|---|---|---|
| J1 | **一条命令起台**：README 写明起法；bridge 自报监听 URL ｜ 复现命令 ＋ 输出 |
| J2 | **多轮 ≥3 轮上下文保持**：同一 session 连问，第 3 轮问「我们第一句说了什么」类 ⇒ 答含首轮内容 ｜ 对话录（页面 DOM 快照 ／ WS 帧落盘） |
| J3 | **事件流实时可见**：`user/message` ／ `assistant/message` ／ `system/message` ／ `turn/end` 在面板按 seq 实时滚出 ｜ 面板快照 ＋ 帧原文 |
| J4 | **记忆注入肉眼可见**：先陈述一个事实（如「记住：我的咖啡偏好是燕麦奶」）→ 后续轮次 `system/message` 帧的召回块**含该事实** ｜ 帧原文（3.6 J5 判据同款，此处用页面验证） |
| J5 | **审批闭环可点**：诱导一个需审批动作（如让 AI 写文件到 workspace）⇒ 页面弹审批卡 ⇒ 批准后动作发生 ／ 拒绝后被拦 ｜ 两臂各一次的证据 |
| J6 | **收尾无孤儿**：关页面 ／ 停 bridge ⇒ `tasklist` 无残留 dsh 进程 ｜ tasklist 输出 |

### 2 · 判据前置（WB 已实测 · Trae 开工即用）

- **A · 插件落 `.dsh-home`（本块授权改，⛔ 仅限落盘三件）**：3.6 的 memory 插件现只在 381 临时 home 生效，**持久台必须落盘**。范式照 **3.7.2**（`archive/roadmap-history.md`「DSH-3.7.2」段）：源 = `harness/packages/plugin-s4-memory/`（`lib/` ＋ `package.json`，**实体复制、⛔ 不 link**）→ 目标 = `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-s4-memory/`；patch 追加进 `.dsh-home/profiles/sdk/cordis.patch.yml`（19 行现存量：9-30 老大落的 disable-compact 行）—— ⚠️ **改前备份**（先例：`cordis.patch.yml.bak-<ts>`）。⚠️ **`.modules.yaml` 不复制**（381 `:100` 教训）。⭐ **memory 插件配置持久库路径**（固定绝对路径如 `.dsh-home/larry-memory.db`，⛔ 不随临时 home 走 ⇒ 记忆跨台持续 —— §9 裁定 B 的代价修正）。
- **B · driver 骨架在位**：`harness/packages/dsh-driver/lib/index.js`（DshDriver 库）＋ `harness/scripts/381-driver-host.mjs`（宿主编范：⛔ 不调 `process.exit`、退出由事件循环排空）。
- **C · 事件消费形态参照**：`run-36-memory.mjs`（session/event 消费 ＋ system/message 帧提取）。
- **D · key 走文件层**：`.dsh-home/.credentials.yaml`（老大已配 larry-dev）⇒ bridge ⛔ **不注入 env key**、⛔ 不改凭据文件本体；⛔ key 值不得出现在页面 ／ WS 帧 ／ 日志 ／ 任何输出。

### 3 · 交付物

- `harness/scripts/dsh-console/`：`bridge.mjs`（node：起 dsh `--profile sdk` via DshDriver ＋ WS 服务 ＋ 事件广播 ＋ 审批反向请求转发）＋ `index.html`（**单文件页面**）＋ `README.md`（起法 ＋ 验收对照表）
- `.dsh-home` 落盘三件（插件实体 ／ patch 追加 ／ 备份）
- 证据：`D:\Code\_trae-evidence\391\`（各 J 一子目录 ＋ README）

### 4 · 参考件四要素

- **路径**：`harness/scripts/381-driver-host.mjs`（driver 宿主编范）｜`harness/packages/dsh-driver/lib/index.js`（driver 本体）｜`harness/scripts/run-36-memory.mjs`（事件消费＋帧提取）｜`harness/scripts/33b-thin-client.mjs` ＋ `run-33b-remote-approval.mjs`（审批反向请求通道形状）｜`client/src/components/DshProbe.vue`（**反面**：单发架构 —— 每次 spawn、无会话、无事件流，⛔ 别抄它）
- **怎么参考**：driver 生命周期抄 381 host（自退出 ／ 看门狗）；审批通道抄 33b 的 `approval/request` method 形态（⚠️ 3.8 定稿后可能改名，本台临时约定自定即可但须在 README 写明）；页面⛔ 不参考任何前端框架——原生 HTML+JS 单文件
- **参考程度**：借形状；⛔ 不 fork、不引入新依赖（WS 用 `ws` 包——若未登记 harness/package.json，按 3.6 前置 A 同法补，锁 pnpm）
- **哪部分不可参考**：DshProbe 的单发 IPC 形态；381 的**临时 home** 范式（本台是持久台，落 `.dsh-home`）

### 5 · 场地器材

- 本机 Windows；`DSH_HOME=.dsh-home`（持久，本块授权落盘）；profile `sdk`；node 以你通道实测为准并连通道一起记
- **假绿坑**：`--dump-config` 不证插件激活（须真 boot）｜注册 API 不抛错 ≠ 生效（参考件 `:2230` 教训）｜审批卡弹出 ≠ 回传链路通（须两臂实测）
- **收尾**：bridge 提供显式停法；⛔ 不留孤儿 dsh

### 6 · 回报格式

结论先行 → J1–J6 逐条证据（原文落盘、⛔ 不改写、注明通道）→ 未闭合项 → 自曝。写完改顶部状态区。

### 7 · 禁区

⛔ 产品化设计（临时台，禁框架 ／ 禁构建链 ／ 禁状态管理库）｜⛔ 动 `backend/`（老后端保持可退）｜⛔ 改 `docs/` `archive/` `HUMAN*.md`｜⛔ 凭据值进任何输出｜⛔ 不提远程｜⛔ 只提自己的文件（提交前 `git diff --cached --stat`）｜⛔ `.dsh-home` 改动仅限 §2-A 三件（多一行都不行）

### 8 · ⛔ 开工阻塞：J5 在 §2-A／§7 约束下不可实现（2026-10-18 · Trae · `98ffda4`）

**结论**：现行 `.dsh-home` 里**没有任何审批答者**，审批请求不会到达 bridge；J5「页面弹审批卡 ⇒ 批准／拒绝」在「`.dsh-home` 只落三件」的约束下无法成立。**已停手等裁决**，未改任何文件。

**事实（均可复算）**：

1. 持久 profile 现状：`package.json` 的 `dsh.profile.bundles` 只有 `@deepseek-ai/dsh-base` ＋ `@deepseek-ai/dsh-sdk-app`；`cordis.patch.yml` 只有 sandbox／compact 两类行；`node_modules/@larryagent/` 下只有 `plugin-sandbox-dialect`。
2. `dsh-base` 的 `approval` 行默认 `policy: ask`（`cordis.patch.yml`，`!!js` 表达式：danger-full-access 时 never 否则 ask）。
3. `dsh-user-approval` 的裁决走 `ctx.waterfall('approval/request', …)`，**无答者时的默认返回值 = `'unavailable'`**（`lib/index.js:179`）——即 fail-closed，页面来不及介入。
4. `dsh-sdk-app` 不注册 `approval/request` 答者（grep `approval` 仅命中一行注释）。
5. 出站审批链路 = `plugin-sdk-relay` ＋ `plugin-approval-answerer` ＋ `plugin-approval-remote-answerer` 三插件（`run-33b-remote-approval.mjs:38-53`）——三者都只在 3.3-b 的**临时 home** 里装过，持久 `.dsh-home` 从未装。

**选项**：A 扩持久落盘（＋3 插件＋3 patch，relay 会 disable 官方 server 行，持久 profile 变 relay 形态）｜B 起台时临时 home（复制＋junction＋overlay，放弃持久落盘意图但无持久副作用）｜C `--patch` overlay 引实体（未验证，需 boot 探针）｜D 砍 J5（不建议）。Trae 倾向 C＞B＞A。

### 9 · WB 裁定：**B 为主，A 否，J5 保留**（2026-10-18）

**复验判定：阻塞报告成立**（WB 抽核坐实：bundles=base+sdk-app ✅ ／ approval 默认 ask ✅ ／ 持久 home `@larryagent/` 仅 sandbox-dialect ✅ ／ 审批三插件在 `harness/packages/` 在 ✅）。⚠️ **派发稿设计漏洞（WB 认账）**：§2-A「`.dsh-home` 只落三件」与 J5 的审批链路需求**打架**——写前置时只惦记 memory 落盘，漏了审批链路另需三个插件。Trae 按纪律停手正确。

**裁定**：

1. ❌ **否 A**：扩持久落盘 = 把 relay 形态固化进 `.dsh-home` —— 与 **3.8 延后令正面冲突**（relay 的 `approval/request` method 名是 3.3-b 临时约定、3.8 定稿后可能改；持久 profile 不该提前替延后的架构决策拍板）。
2. ✅ **主 B**：bridge 起台时复制 `.dsh-home` → **临时 home**（381 范式：`mkdtemp`＋`cpSync`＋删副本 `.modules.yaml`）＋ **junction 审批三插件实体**（`harness/packages/` 下 `plugin-sdk-relay` ／ `plugin-approval-answerer` ／ `plugin-approval-remote-answerer`）＋ overlay patch —— ⭐ **这正是 3.3-b 7 臂 66/66 验证过的形态**，审批机制本身已被充分验证，体验台只是复用；「远端答者」= bridge 的 WS 对端（页面用户）。
3. ⭐ **B 的代价修正（关键）**：memory 插件配置**持久库路径**（固定绝对路径 `.dsh-home/larry-memory.db`，⛔ 不随临时 home 走）⇒ **记忆跨台持续**，「J4 只在台内有效」归零。
4. ⬜ **C optional（不专排轮）**：续跑中若顺带 5 分钟 boot 探针验证「loader 接受绝对路径插件名」⇒ 可行则 C（`.dsh-home` 零额外落盘），不可行回落 B；⛔ 不为它专门开一轮。
5. ✅ **J5 保留**：砍判据 = 残台，退出信号少摸一环。

**续跑范围**：§2-A 三件照落（memory 持久库路径）＋ bridge ／ 页面按 B 实现；J1–J6 全判；J5 两臂证据（批准 → 动作发生 ／ 拒绝 → 被拦）。

**记账（WB）**：派发稿设计漏洞一笔——**前置写「授权落盘清单」时必须逐判据反查其链路依赖**（J5 → 审批三插件 ／ J4 → memory 插件），不能只列「已知要落的」。已入 WB 日志。

### 10 · 回报：体验台交付，J1–J6 全过（2026-10-18 · Trae · commit `2a6e066`）

**结论**：按 §9 的 B 主案交付。`harness/scripts/dsh-console/`（bridge ＋ 单文件页面 ＋ README）；`.dsh-home` §2-A 三件已落（memory 插件实体 ＋ patch 追加 ＋ 备份 `cordis.patch.yml.bak-20261018-024736`）。证据 `D:\Code\_trae-evidence\391\README.md`（按 J 分目录）。真调用 5 轮、零重试。

| # | 结论 | 证据（通道） |
|---|---|---|
| J1 | ✅ 一条命令：`node harness/scripts/dsh-console/bridge.mjs`；自报 `http://127.0.0.1:8791/` | `J1/startup.json`（bridge 自报：listen／launch.argv／bundles／envKeyPresent=false）＋ 终端 stdout |
| J2 | ✅ 同 session 3 轮；第 3 轮答含首句 `ORANGE-742` | `J2/dialog-frames.jsonl`（dsh 帧原文）＋ `J2/ws-frames.jsonl` ＋ `J2/browser-report.md` |
| J3 | ✅ 四类事件全在：user/message×11、assistant/message×9、system/message×6、turn/end×5 | `J3/event-types.json` ＋ `J3/session-notifications.jsonl`（全量原文）＋ `J3/screens/` |
| J4 | ✅ 第 2／3 轮 system/message 帧含召回块与 `ORANGE-742`；记忆库跨台持久 | `J4/system-message-frames.json` ＋ `J4/system-message-checks.json` ＋ `J4/memory-db-rows.json` |
| J5 | ✅ 两臂：asked#52→decided `allowed-once`（文件存在、内容对）／ asked#74→decided `rejected`（文件不存在） | `J5/approval-frames.json` ＋ `J5/approvals.jsonl` ＋ `J5/fs-proof.txt` ＋ `J5/arm-*.png` |
| J6 | ✅ 两次起台均 `childExit.code=0`／`forced=false`／临时 home 已删；无 dsh 孤儿 | `J6/stop-report.json` ＋ `J6/tasklist-after-stop*.txt` |

**未闭合项 / 边界**：① C 案（`--patch` 引绝对路径插件名）未探针验证——WB 已标 optional、不专排轮；② 审批 method 名 `approval/request` 仍是 3.3-b 临时约定，3.8 定稿改名则本台同步；③ 关页面只断 WS，停止手段是「停 bridge」（设计如此，不算孤儿）；④ 会话日志随临时 home 删除，证据一律取自 bridge 通知流；⑤ `.dsh-home/` 在 `.gitignore:32`，三件落盘是本机状态、不进 git。

**自曝**：① bridge 初版未落 `startup.json`，J1 由第二次起台补采（同命令同形态）；② `system/message` 帧是整块系统提示词（含工具说明），页面原样展示、未截断；③ J4 第 3 轮同时受上下文与召回影响，不能单独归因召回——判别力取自第 2 轮帧原文（仅 1 条召回即含首句）。

---

### 11 · WB 复验：3.9.1 判定成立，放行老大体验（2026-10-18）

**复验判定：回报成立**（回源核证据目录 10+ 件 ＋ 关键原文 ＋ 源码核心，⛔ 非采信声明）：

- **J1** ✅ `startup.json` 自报完整：listen 8791 ／ bundles 含审批三插件（B 案落地）／ tempHome 在 `D:\Temp\Sys\larry-391-*`（临时 home 形态）／ srcHome=.dsh-home 持久 ／ **envKeyPresent=false**（key 走文件层 ✅）
- **J2** ✅ 同 session 3 轮，第 3 轮答含首句 `ORANGE-742`
- **J3** ✅ 四类事件计数：user/message×11 ／ assistant/message×9 ／ system/message×6 ／ turn/end×5
- **J4** ✅ **B 案核心修正坐实**：`memory-db-rows.json` 显示 `dbPath=.dsh-home/larry-memory.db`（**持久路径、不在临时 home 内**，5 行记忆含 ORANGE-742 暗号）；`system-message-checks.json`：6 帧全含召回标题＋nonce 逐字
- **J5** ✅ **两臂因果闭合**：`approvals.jsonl` 帧链（reverse-request〔真实 escalation 理由：D:\Temp 工作区外需提权〕→ page-answer allowed-once/rejected → child-exit code=0）＋ `fs-proof.txt`（批准臂文件在且内容对 ／ 拒绝臂文件不存在）
- **J6** ✅ tasklist 双采样（after-stop ＋ boot2 后）：node 进程中命令行含 dsh 的段**空**、原 child PID 段**空** ⇒ 无孤儿
- **源码核心** ✅ bridge `buildTempHome`（复制源 profile＋junction 审批三件＋改副本 bundles＋overlay）＋ 审批链路 = dsh 出站 → bridge → 页面 → `driver.answer` 写回（⛔ bridge 不代答）
- **Tier0** ✅ 证据目录 ＋ dsh-console `sk-` 零命中；交付物 Trae 自行提交（`ae33325`）；`.dsh-home` 三件按 §2-A（含备份）

**放行**：台子干净，可交老大上手。**给老大的体验提示**（README 已知边界提炼）：① 审批卡不点会一直等（`answerTimeoutMs=0`）——想放弃就停 bridge ② 每次起台是新临时 home，**记忆库持久**（`.dsh-home/larry-memory.db`，里面躺着 Trae 测的 5 行——包括 ORANGE-742 暗号，可直接翻玩）③ 体验重点：事件流面板有没有让「DSH 内部发生了什么」变透明——这正是退出信号①的靶子。

---

## 📤 DSH-3.9.1-a · 实测反馈返工（WB 派发 · 2026-10-18 · Trae · 本机 Windows）

### 0 · 背景（老大上手实测五条，WB 已查实归因；④⑤ 不属本块）

老大摸台后五条反馈，WB 排查结论：**① cwd = 产品决策要变**（`bridge.mjs:58` 默认 `--cwd REPO` 是有意设计——仓库根即工作空间、信任区内操作合法；但 system prompt 注入「Your working directory is D:\Code\LarryAgent」暴露源码根，老大见路径判危险，**已创建 `D:\Temp\DSH-Dev-Temp`** 作替代）；**② 时间戳 UTC 错位**（实锤我方代码：`new Date().toISOString()` 恒 UTC，与 DeepSeek 服务器无关）；**③ shell 调不动 = 独立技术 bug**（帧实证：pwsh 起外部 PS 子进程，DSH 沙箱放行前对它做 Windows ACL 自授权 `SetNamedSecurityInfoW → grantWrite(cwd)`，在仓库根 **ACCESS_DENIED（Win32 5）** ⇒ 进程起不来；信任区不走授权流程 ⇒ 无弹窗静默 fail-closed；非 shell 工具走 Node 进程内不过此 ACL ⇒ 创建/列举全正常）。④（8 轮＝机制确认）⑤（召回双注入面疑点，**待老大裁**）⛔ 不属本块。

### 1 · 任务（四项）

- **A · 默认 cwd 改安全区**：`bridge.mjs:58` 默认值 REPO → `D:\Temp\DSH-Dev-Temp`（保留 `--cwd` 参数可覆盖；README 起法说明同步）。
- **B · 时间戳本地化**：`bridge.mjs:69`（marker 落盘）／`:299`（stop-report）＋ `packages/dsh-driver/src/index.ts:225/232`（及其构建产物 `lib/index.js` 对应处）的 `new Date().toISOString()` → 输出**本地时刻**（ISO 带 `+08:00` 偏移或本地 wall-clock，择一，全台统一）。⭐ **epoch 值（帧内 `time`）不动**——那是中性事实，只改序列化/显示层。页面显示若有时钟组件一并核。
- **C · ③ 定性探针（⛔ 只定性、⛔ 不修）**：以新默认 cwd（`D:\Temp\DSH-Dev-Temp`）起台，跑一次**最小 pwsh 调用**（echo 级别），记录 `grantWrite` 是否仍失败。产出二选一判决：
  - **pwsh 成功** ⇒ ③ = 仓库根目录特例，**已随换 cwd 修复** ⇒ 记档关闭
  - **仍 Win32 5** ⇒ ③ = 代码缺陷实锤（`SetNamedSecurityInfoW` 调用方 = 上游 dsh-sandbox 组件 vs 我方 `plugin-sandbox-dialect`〔已挂 `.dsh-home` 持久 profile〕——能定位到哪一层就写到哪层，定位不了就如实记「未定位」）⇒ **记档挂「套壳前必修」**，本块⛔不动手修
- **D · J5 演示路径连锁**：cwd 换区后，README/验收说明里「工作区外需提权」的参照路径同步更新（选一个稳定的台外路径，⛔ 不要用仓库根反向制造提权演示——那正是要消除的暴露面）。

### 2 · 判据（J-a～J-d，工具验收 · 每条可复算）

| # | 判据 | 取证 |
|---|---|---|
| J-a | 起台后 **working directory = `D:\Temp\DSH-Dev-Temp`**（帧原文 ／ startup.json 自报二选一，须原文） | `J-a/system-message-frame.json` 或 startup 自报 |
| J-b | **时间为本地时刻**：wireLog/事件流时间与墙钟差 **<2s**（同机对表），且形态为本地（+08:00 偏移 ／ 本地 wall-clock） | `J-b/clock-compare.json`（wireLog 首末 t vs `date` 墙钟） |
| J-c | **探针判决明确落盘**：pwsh 退出码＋输出原文（成功 ⇒ 关 ③；Win32 5 ⇒ 记「套壳前必修」＋ 调用方定位到哪层写到哪层） | `J-c/probe-*.json`（含失败原文） |
| J-d | **J5 两臂在新 cwd 配置下仍成立**：批准 → 动作发生 ／ 拒绝 → 被拦（用 D 更新后的路径） | `J-d/approvals.jsonl` ＋ 文件级证明 |

### 3 · 前置实测（WB 已做 · Trae 开工即用，⛔ 仍须自行复测不照抄）

- `bridge.mjs:58` `const cwd = resolve(argOf('--cwd', REPO))`；`D:\Temp\DSH-Dev-Temp` **已由老大创建存在**
- ③ 帧证据在 `D:\Code\_trae-evidence\391\run-1792266691996\driver.log.wire.jsonl`（seq 25/47/48 tool/result 原文）＋ 同 run `approvals.jsonl`（仅 child-exit 一条，**零授权帧** ⇒ 信任区静默）
- 时间戳点：`bridge.mjs:69/:299`；dsh-driver `src/index.ts:225/232`（`lib/index.js` 是构建产物，改 src 后须连产物一起改 ／ 或重新构建——你定，README 注明）
- 假绿坑：`--dump-config` 不证生效（须真 boot）｜时间「看起来是本地」≠ 判据成立（须与墙钟对表 <2s）｜pwsh 一次成功 ≠ 稳（探针至少 2 次，都记）

### 4 · 交付物与纪律

- 改动仅限：`harness/scripts/dsh-console/`（bridge＋README）＋ `packages/dsh-driver/`（时间戳）；⛔ **不动** `plugin-s4-memory` ／ `.dsh-home`（本块零落盘）／ `docs/` `archive/` `HUMAN*.md` ／ `backend/`
- 证据：`D:\Code\_trae-evidence\391a\`（J-a～J-d 各子目录 ＋ README）
- 提交：只提自己文件（提交前 `git diff --cached --stat`）；以 Trae 身份签名（L38 单次参数法）
- 回报格式：结论先行 → J-a～J-d 逐条证据（原文落盘、⛔ 不改写、注明通道）→ ③ 判决书 → 未闭合项 → 自曝。写完改顶部状态区。

### 5 · 回报：返工四项完成，J-a～J-d 全过（2026-10-18 · Trae · commit `97c1477`）

**结论**：A/B/D 已改，C 判 **pwsh 成功 ×2 ⇒ 仓库根特例，已随换 cwd 修复 ⇒ 记档关闭**（⛔ 未修代码）。证据 `D:\Code\_trae-evidence\391a\README.md`。真调用 6 轮（J-a 1 ／ 探针 2 ／ J-d 2 ／ 时钟对表 1），零重试；收尾 `childExit.code=0`、`forced=false`。

| # | 结论 | 证据（通道） |
|---|---|---|
| J-a | ✅ 默认 cwd = `D:\Temp\DSH-Dev-Temp`（未传 `--cwd`） | `J-a/startup.json` ＋ `J-a/health.json`（bridge 自报）；帧原文 `Your working directory is D:\Temp\DSH-Dev-Temp.`（`J-a/system-message-frame.json`） |
| J-b | ✅ 本地时刻，形态 `+08:00`；与墙钟 **delta=61ms**（<2s） | `J-b/clock-compare.json`（wireLog 最后一条 t `04:27:48.729+08:00` vs 采样 `04:27:48.790+08:00`）＋ `clock-before/after.txt` |
| J-c | ✅ pwsh 两次成功（`isError=false`，输出 `391a-probe-1/2`）；旧 run 对照 `Win32 5: grantWrite(D:\Code\LarryAgent)` | `J-c/probe-verdict.json` ／ `.md` ＋ `J-c/probe-tool-calls.json`（新）＋ `J-c/old-run-contrast.json`（旧 run 只读） |
| J-d | ✅ 两臂：`#62 asked→#63 allowed-once`（文件在、内容对）／ `#84 asked→#85 rejected`（文件不存在） | `J-d/approval-frames.json` ＋ `J-d/approvals.jsonl` ＋ `J-d/fs-proof.txt` ＋ 截图 4 张 |

**③ 判决书**：调用方定位 = 上游 `@deepseek-ai/dsh-sandbox-windows-acl`（`SetNamedSecurityInfoW`／`grantWrite` 仅该包命中）；我方 `plugin-sandbox-dialect` 零命中。唯一变量 = cwd（同机同版本同 profile）。详见 `391a/J-c/probe-verdict.md`。

**改动**：`bridge.mjs`（默认 cwd ＋ `localIso()` 落盘）｜`dsh-console/README.md`（cwd 缺省、J5 台外路径 `D:\Temp\DSH-Outside\`、时间戳与 lib 构建说明）｜`dsh-driver/src/index.ts`（`localIso()`，6 处序列化点全替换；本机已重构建 `lib/`，⛔ lib 被 `harness/.gitignore` 忽略不入库）。⛔ 未动 `plugin-s4-memory`／`.dsh-home`／`docs`／`backend`。

**未闭合 / 自曝**：① 臂 A 的 toast 因代理选错选择器未逐字采集，以 `approval/result` 帧＋system 消息原文替代；② 仓库根 ACL 失败原因未深挖（不属判据）；③ J-c 只证 echo 级；④ 时钟对表额外 1 次最小真调用（`只回复 ok`）以落进 2s 窗口；⑤ 旧实例标签页显示「已停止」属旧页残留，新起台需新开标签。

### 6 · WB 复验：3.9.1-a 判定成立（2026-10-18）

**复验判定：回报成立**（回源核证据 12+ 件 ＋ 关键原文 ＋ 源码，⛔ 非采信声明）：

- **J-a** ✅ 源码实改坐实：`bridge.mjs:59` 默认值 = `D:\Temp\DSH-Dev-Temp`；帧原文逐字 `Your working directory is D:\Temp\DSH-Dev-Temp.`（`J-a/system-message-frame.json`——顺带佐证：同帧召回块 8 条仍在，老大实测样本未丢）
- **J-b** ✅ `clock-compare.json`：wireLog 末条 `04:27:48.729+08:00` vs 墙钟采样 `04:27:48.790+08:00`，**delta=61ms**（判据 <2000ms），全序列化点带 `+08:00` 偏移；源码侧 `localIso()` 落实（bridge :70/:300 ＋ driver src 六处），注释写明「为什么不用 toISOString」——修法有据
- **J-c** ✅ 判决书三要素齐：新配置探针帧（`echo 391a-probe-1/2`，seq 24/39，`isError=false`）＋ 旧配置对照原文（`Win32 5: grantWrite(D:\Code\LarryAgent)`）＋ **唯一变量论证**（同机同版本同 profile）；调用方定位 = 上游 `@deepseek-ai/dsh-sandbox-windows-acl`，我方 `plugin-sandbox-dialect` grep 零命中——**③ = 仓库根目录特例，已随换 cwd 修复，记档关闭**；探针期零 `approval/asked` 帧（信任区静默，与旧配置对照的静默失败同形）
- **J-d** ✅ `approvals.jsonl` 两臂帧链（reverse-request → page-answer `allowed-once` ／ `rejected`）＋ `child-exit code=0`；fs-proof 文件级因果在回报内
- **Tier0** ✅ 证据目录 ＋ dsh-console `sk-` 零命中；Trae 自行提交 `97c1477`（返工）＋ `2190bb4`（回报）

**放行**：①②③④ 闭环。**连带处理**：③ 判决已转 Qoder 登记（连同 J6 边界注记 ／ 判据设计教训，见 `log-qoder.md`）；⑤ 两疑点仍挂老大（向量召回接入后联动裁决）。**台子可再摸**：cwd 已安全区化、时间已本地化——老大重新体验时，①（路径暴露）和②（时间错位）两条体感应消失；③（shell）在新区内已通。

---

## 📤 DSH-3.9.1-b · 缓存前缀修复 ＋ 召回块时间戳收口（WB 派发 · 2026-10-18 · Trae · 本机 Windows）

> **本单 ＝ 原 3.9.1-b 稿（时间戳 UTC 补修）＋ 原 3.9.1-c 稿（token 经济性）合并**（2026-10-18 老大拍板）。合并原因：两单在时间戳上**方向相反** —— b 稿要把 `created_at` 在召回块里**显示成本地时间**，c 稿要把 `created_at` 从召回块里**整个删掉**；且改**同一文件同一行**（`index.ts:203`）、同步**同一份 `.dsh-home` 持久副本**，分跑必有一单白做。合单后**以 c 稿的「移除」为主线**，b 稿的两项（存量数据修正 ／ 第三时间源清查）并入 A-④／A-⑤。原 **3.9.1-b 单号停用**。

### 0 · 背景（老大红线 ＋ 调研修正 ＋ 老大插话定位 ＋ 时间戳根因认账）

**① 时间戳仍在（原 3.9.1-b 稿背景 · WB 派发稿盲区认账）**：老大二轮实测 ②③ 已修复，但召回块里 `[2026-10-17 20:46:08]` 写的是她本地 04:46 说的话 —— UTC 原样呈现。根因 = `plugin-s4-memory/src/index.ts:102` 的 `created_at TEXT NOT NULL DEFAULT (datetime('now'))`（SQLite `datetime('now')` **恒为 UTC**），该值由插件直写进 system prompt 召回块，⛔ 不过 bridge 序列化层。**3.9.1-a 的 ② 只排查了序列化层（wireLog 的 `t`），漏了数据库默认值这个第二时间源。教训：「时间戳本地化」必须按「时间源」穷举（序列化层 ／ DB 默认值 ／ 框架帧内字段），不能只修已知那一层。**

**② 消耗红线**：老大二轮实测第五条「问了几句话的消耗 ≈ Trae 两轮工作的量，真用不起」。WB 初列「就地省钱」候选被老大纠正「**勿闭门造车 —— 上下文放大增成本但影响体验，关键是两端平衡，成熟方案大量存在，须充分参考**」。两路调研（sombrainc ／ aifrontierpost ／ particula 三源综述 ＋ DeepSeek 官方计价）后方案重排：

- ⭐ **DeepSeek V4-Flash 缓存命中输入价 = 未命中的 1/30**（低谷 $0.05 vs $1.5/百万 token；工作日 9-12／14-18 点双价、周末全低谷）⇒ **ROI 第一是「让前缀命中缓存」而非「减少上下文」** —— 后者伤体验，前者免费
- ⭐ **老大插话定位（WB 帧原文验证坐实）**：召回块位于 system prompt **第 4 行**（两行框架身份之后、几千 token 工具说明**之前**），每条带 `[created_at]` 时间戳 —— **新记忆写入即前缀变动 ⇒ 第 4 行往后全部缓存必 miss**。这是成熟方案里点名最狠的反模式（volatile prefix：动态值混进前缀 = 永久 cache miss，single highest-return fix）

**成本四源诊断**（`391a/run` wireLog）：① 缓存必 miss（上述）② 消息历史线性累积（第 N 轮背全部前轮）③ 工具结果滞留（老大测试时模型整本 read 俄乌简报 —— 几十 k token 一次进、之后每轮背着走）④ reasoningEffort=high 输出侧计费。

### 1 · 任务（四项）

- **A · 缓存前缀修复（核心）**
  - **A-① 召回块移除 `created_at` 时间戳**：`index.ts:203` 的 `` `- [${r.created_at}] ${r.content}` `` → `` `- ${r.content}` ``。时间戳是 debug 信息、对模型零价值却毒化前缀；可见性移居事件流面板（或保留 SQLite 内，⛔ 不进 prompt）。**⛔ 不要先做本地化再删 —— 直接删**（此条取代原 3.9.1-b 稿 A 项的 `datetime('now','localtime')` 方案）。
  - **A-② 召回块移出稳定前缀区**：改到动态区（尾部 ／ 或仅走 context 面 synthetic 帧），保证系统提示词前 1k token 在无新记忆时 **byte-identical**。
  - **A-③ 全审计**：把一次真实请求的前 1k token 逐行过一遍，列出所有 volatile 元素（时间戳 ／ session id ／ 随机值），逐个处置。
  - **A-④（并入原 3.9.1-b 稿 B 项）存量 DB 数据修正**：`.dsh-home/larry-memory.db` 内已入库数据（含老大二轮实测的 8 条）仍是 UTC。时间戳不再进 prompt 后仍做，理由是**数据层正确性**（面板显示 ／ 将来查询），成本几分钟。顺序：① `cp` 备份 `.bak-<ts>` ② SELECT 抽样确认值确为 UTC 形态 ③ 本机时区固定 UTC+8 ⇒ `UPDATE memories SET created_at = datetime(created_at, '+8 hours')`。
  - **A-⑤（并入原 3.9.1-b 稿 C 项）全查第三时间源**：grep 插件内全部 `datetime(` ／ `new Date` ／ `toISOString`，逐个判定「是否进 prompt」—— 进 prompt 的按 A-① 处置，不进 prompt 的只登记上报。
  - ⚠️ **A-② 与 D 落在同一改动面**（注入位置 ／ 双面开关）：一次判、一次改，⛔ 别当两件事各改一遍。
- **B · usage 计量（配套先行）**：查 DeepSeek API 的 `prompt_cache_hit_tokens`／`prompt_cache_miss_tokens` 是否被 DSH provider 层透传（grep 上游 adapter ／ 真调用抓 usage 字段）；若透传 ⇒ 事件流面板显示每轮「输入 token ＋ 缓存命中 ／ 未命中 ＋ 输出 token」；未透传 ⇒ 如实记「未定位」并给最小可行替代（请求大小日志）。**没有计量，A 的效果无法验证**。
- **C · compaction 生效性核查**：`compaction-basic` ＋ `compaction-tool-result-pruner` 实际在不在跑（⛔ 不信 bundles 列表 —— 3.4 只 disable 了手动入口 `command-compact`，自动档状态未知）；在跑则报阈值与实测触发证据；没跑则报默认配置与启用路径。⚠️ 只核查不改（改 compaction 策略属 DSH-2 域另有流程）。
- **D · 双面注入去重**：`injectSection`／`injectContext` 现状双开（`index.ts:65-66` 均 true）⇒ 同一召回文本注入两次（system prompt 一份 ＋ user snapshot 一份）。关一个面（留哪个你判 —— 留 section 则 prompt 内可读、留 context 则消息流内可读，README 写明）。⚠️ **若选「留 section」，须同时满足 A-② 的尾部动态区要求**，否则等于把 volatile 块留在前缀里、白关。回归验证召回仍生效（nonce 仍逐字在帧内）。

### 2 · 判据（J-e～J-k）

| # | 判据 | 取证 |
|---|---|---|
| J-e | **召回块内不含时间戳**：召回块原文中无 `[YYYY-MM-DD HH:MM:SS]` 形态，且该信息去向明确（事件流面板可见 ／ 仅存 DB） | `J-e/recall-block.txt`（原文）＋ 正则 grep 无命中 ＋ 面板截图或去向说明 |
| J-f | **存量数据修正结论明确**：已 UPDATE（前后抽样对照）或判定不修（附理由），二选一落盘 | `J-f/db-before-after.json`（抽样行前后值）＋ 备份文件在位证明 |
| J-g | **前缀稳定可证**：连发两轮**不写新记忆**的对话 ⇒ 两次请求的 system prompt 前 1k token 逐字节相同（哈希一致） | `J-g/prefix-hash.json`（两轮请求前缀 sha256 对照） |
| J-h | **计量可见**：事件流 ／ 落盘可见每轮输入 ＋ 缓存命中 ／ 未命中 ＋ 输出（或明确记录「未透传」＋ 替代方案） | `J-h/usage-*.json` ＋ 面板截图 |
| J-i | **compaction 状态报告**：在跑（阈值＋触发证据）或未跑（默认配置＋启用路径），二选一落盘 | `J-i/compaction-report.md` |
| J-k | **召回回归**：去重后新写一条记忆，召回块仍含该条逐字（nonce 同款手法） | `J-k/recall-regression.json` |

> 原 3.9.1-b 稿的 J-e（「新写一条记忆 ⇒ 召回块时间戳 = 本地时刻」）**作废** —— 时间戳被移除后该判据失去对象，已由上行新 J-e 替代。

### 3 · 边界（⚠️ 本单破 §12 禁区，明示授权范围）

- ✅ **授权动**（两单并集）：`plugin-s4-memory/src/index.ts` 的**时间相关行**（INSERT 列 ／ `created_at` 生成 ／ DEFAULT 行）＋**召回呈现相关行**（时间戳移除 ／ 注入位置 ／ 双面开关）＋ `.dsh-home/larry-memory.db` 数据修正（带备份）＋ `.dsh-home` 持久 profile 实体副本同步（`.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-s4-memory/` —— 照 3.7.2 范式，⛔ 仍只此一件、改前备份）＋ `dsh-console` 面板 ／ bridge 计量显示
- ⛔ **仍不碰**：reasoningEffort（体验权衡 —— 留老大拍，⛔ 本单不许动）｜工具集裁剪（25 个的能力面影响，同上）｜召回**语义**（SELECT 排序 ／ `recallLimit` ／ session 过滤 —— ⑤-b 联动向量召回，DSH-4 流程）｜compaction **策略**（只核查）｜判据文件｜`docs/` `archive/` `HUMAN*.md`｜`backend/`
- ⛔ **不做全局上下文重排 ／ 排序分析**：老大 2026-10-18 明确 —— 「前部越稳定越省钱」本身是**相对**命题（尾部内容同样影响命中与切点），整体重排属**迁移完成后的长期优化**（老大 2026-10-18 定为长期项，归 `HUMAN_NOTE.md` 人类治理区，WB 不代笔）。**本单只做点状 volatile 消除，⛔ 不得顺手改造整段上下文的顺序或结构。**
- ⚠️ 3.6 J4「时间界」判据**不受影响**：它用 DB 内两条 `created_at` 的**差值**，时区平移不改变量；本单删的是 **prompt 内的呈现**、数据层保留 —— 回归时核一句即可
- 附产品层备忘（不派活）：峰谷计费 —— 工作日白天双价，重活（长会话 ／ 批处理）可排低谷，纯产品策略题

### 4 · 回报格式

结论先行 → J-e～J-k 逐条证据（原文落盘、⛔ 不改写）→ 缓存前缀审计的 volatile 清单（含 A-③）→ 第三时间源清查登记（A-⑤）→ 未闭合项 → 自曝。写完改顶部状态区。

### 5 · 回报：3.9.1-b 四项完成，J-e～J-k 成立（2026-10-18 · Trae · commit `55ae302`）

**结论**：A（前缀修复）／B（usage 计量）／C（compaction 核查）／D（双面去重）全部落地。真调用 3 轮，零重试；收尾 `childExit.code=0`、`forced=false`。证据 `D:\Code\_trae-evidence\391b\README.md`。

| # | 结论 | 证据（通道） |
|---|---|---|
| J-e | ✅ 召回块无时间戳（正则命中 0） | `J-e/recall-block.txt`（context 面帧 #30 原文）＋ `J-e/timestamp-check.json` |
| J-f | ✅ 42 行 UPDATE +8h，备份在位 | `J-f/db-before-after.json`（前后抽样 id=1/2 对照；备份 `.dsh-home/larry-memory.db.bak-20261018-160549`） |
| J-g | ✅ 前缀稳定：`system/message` 仅第 1 轮 #7；第 2/3 轮无更新帧（`request/header` 同）⇒ 前缀未变；前 4096 字符 sha256 `9807275…998a` | `J-g/prefix-hash.json` ＋ `J-g/prefix-first4096.txt` ＋ `J-g/prefix-audit.json` |
| J-h | ✅ usage 已透传并可见：1 轮 in 6892/cache 768/out 77 → 2 轮 369/7680/2 → 3 轮 383/7936/9 | `J-h/usage.jsonl` ＋ `J-h/usage-summary.json` ＋ 页面截图（内存 `tok in … | cache … | out …`） |
| J-i | ⚠️ **已挂载、auto=true、未触发**：阈值 80%×1M=800k，实测最高 8328；无触发证据 | `J-i/compaction-report.md`（含默认配置出处、启用路径、手动入口已 disable） |
| J-k | ✅ 第 2 轮写入 `391B-NONCE-7Q` → 第 3 轮 context 召回帧 #30 逐字含；回答逐字一致 | `J-k/recall-regression.json` |

**A-③ volatile 清单**：前 4096 字符 27 行，date／time／session-id／uuid／ISO **0 命中**；框架身份／persona／工具说明均为静态（cwd 是部署常量）。唯一 volatile 是召回块，已移出 system prompt（原第 4 行 → context 面 synthetic 帧）。

**A-⑤ 时间源清查**：插件内只剩 `src/index.ts:104` `created_at DEFAULT (datetime('now'))`（数据层 UTC，**不进 prompt**，登记保留）；无 `new Date`／`toISOString`。`.dsh-home` 实体副本已同步（备份 `plugin-s4-memory.bak-20261018-160536`）。

**改动**：`plugin-s4-memory/src/index.ts`（A-① 去时间戳／A-②+D 默认仅 context 面／SELECT 去 created_at）｜`bridge.mjs`（`usage.jsonl` 落盘）｜`index.html`（逐轮 usage ＋ 累计；context 面召回气泡）｜`dsh-console/README.md`。⛔ 未动 reasoningEffort／工具集／召回语义／compaction 策略／docs／backend。

**未闭合 / 自曝**：① J-i 落在判据二选一之外（已挂载但无触发证据），如实记；② J-g 用「无 system/message 更新帧 + request/header 仅一次」论证（无第二份样本可哈希）；③ A-④ 依赖本机 UTC+8；④ 每轮都会写新记忆，字面「不写新记忆的两轮」不可构造——稳定性由「召回移出前缀」保证；⑤ 页面新增 context 面召回气泡（UI 变化）。

### 6 · 追加：召回时间戳加回（老大 2026-10-18 直接指令 · commit `a010f1e`）

**背景**：老大明确「时间戳加回去吧，后面有用」。本指令覆盖 3.9.1-b 的 A-①／J-e（原本要求移除时间戳）。

**结论**：已加回，且为**本地时刻**（`- [2026-10-18 16:34:39] 内容`）。

- **为什么现在能加**：A-②/D 已把召回移出 system prompt 前缀（只走 context 面动态区）⇒ 时间戳不再毒化缓存前缀。2 轮实测 `system/message` 仍只有 1 帧（首轮），前缀稳定。
- **写入改 `datetime('now','localtime')` 且显式写列**：`CREATE TABLE IF NOT EXISTS` 对已存在表不生效，老库 DEFAULT 仍是 UTC；显式写入对新旧库一致。
- **DB 补正**：id 43–48（前一单修正后新写入的 UTC 行）补 +8h；备份 `larry-memory.db.bak-20261018-163222`。新行 id 49/50 实测 = `16:34:39`／`16:34:41`（与本机墙钟同段）。
- **判据口径**：最新时间戳 vs 墙钟 delta **4.25s**（`391c/J-e/timestamp-verdict.json`）。⚠️ 我第一版用「小时 6–22」粗判把真实本地凌晨 `05:04` 误判为 UTC、第二版漏方括号出 `NaN`，均已修并记档。
- ⚠️ **3.9.1-b 的 J-e 应作废/改写**（判据反转），请 WB 复验时按本追加为准；A-① 的原始理由仍成立，只是被结构性修复（A-②）覆盖。

证据：`D:\Code\_trae-evidence\391c\README.md`（含 DB 前后对照、召回块原文、usage）。
⚠️ 老大当前 8791 实例是 16:13 启动的**旧插件**，需重启 bridge 才能看到时间戳；我的验证跑在 8793，未打扰该实例。

### 7 · WB 复验：判定**成立（带订正 1 ＋ 增量 3）**（2026-10-18 16:55）

**判定**：3.9.1-b 主体成立 —— 前缀修复 ／ 时间戳加回并本地化 ／ 双面去重 ／ 缓存命中四项均以执行级证据坐实；J-e 按老大的反转指令**改口径**（原「不含时间戳」作废），改判据后成立。Trae 的两处自曝（旧实例需重启 ／ J-i 落在二选一之外）均属实且已在下方订正。

**我独立核过的（方法 → 结论）**：

| # | 核什么 | 取证方式 | 结果 |
|---|---|---|---|
| 1 | 源码终态 | 直读 `plugin-s4-memory/src/index.ts` | ✅ `:102` DEFAULT ＋ `:107-108` INSERT 均 `datetime('now','localtime')`（显式列）｜`:203` 召回行 `- [${created_at}] …` 已恢复｜`:65-66` `injectSection:false` / `injectContext:true` |
| 2 | 持久副本同步 | 比 `lib/index.js` 与 `src/index.ts` 的 mtime ＋ 关键行 grep | ✅ 副本 `16:32:56` 晚于源码 `16:32:48`；副本内含 `localtime` / 召回恢复行 |
| 3 | **召回去向（D＋A-②）** | 解 `notifications.jsonl` 全事件流 | ✅ `seq=7 system/message`(5141B) **不含**召回；召回在 `seq=9`(2196B) / `seq=21`(2213B) 的 **user/message（当轮尾部）** ⇒ 双面去重成立、且确实在动态区 |
| 4 | 前缀是否真命中 | 读 `usage.jsonl` 两轮 | ✅ 第 1 轮 in 412 / cache **7296** / total 7711；第 2 轮 in 383 / cache **7680** / total 8105 ⇒ **命中率 ~95%**，且第 2 轮 cacheRead 比第 1 轮多 384（前缀随轮增长而非重置） |
| 5 | 时间戳形态 | 召回块原文 8 行 ＋ 墙钟对表 | ✅ 8 条均 `[2026-10-18 HH:MM:SS]` 本地形态；最新 `16:34:39` vs `16:34:43.250` ⇒ **delta 4.25s** |
| 6 | DB 实际状态（我自己连库读） | `sqlite3` 直读 `.dsh-home/larry-memory.db` | ✅ id 43–48 已 `+8h`（16:08–16:15）；id 49/50 = `16:34:39`/`16:34:41` 新写入即本地；备份件两枚在位（`…160549`／`…163222`）｜⚠️ **id 51 仍是 UTC**（见增量①） |
| 7 | Tier0 | 自写脚本扫证据目录 ＋ 源码（只报 len/sha，不回显） | ✅ 命中 0 |
| 8 | 老大测的是不是新代码 | DB id 52 = `2026-10-18 16:48:21`「大肥鱼！再测试一下！」 | ✅ 该行是**本地时刻**、且晚于 Trae 的验证（16:34）⇒ 老大已重启并测过新实例（8791 现已无 LISTENING，仅 TIME_WAIT） |

**订正 ①（判据口径 · 老大指令反转）**：原 **J-e「召回块内不含时间戳」作废**，改为 **J-e′「召回块含本地时刻时间戳，且该块位于 user 侧尾部帧、不进 system prompt 前缀」**。理由：老大明示「时间戳后面有用」，而 volatile 毒化前缀的前提已被 A-② 结构性消除（本复验 #3/#4 坐实）。⇒ **A-① 的原始理由仍成立，只是被执行路径替换**，两者不矛盾。

**订正 ②（J-g 论证不采信，改用数据支撑）**：Trae 自曝「无第二份样本可哈希」，其原论证（无 system/message 更新帧）本身只能证「系统帧没重发」，证不了「请求前缀命中」。⇒ **本复验改用 `usage.cacheReadTokens` 递增（7296→7680）作为 J-g 的硬支撑**，原论证降为旁证。

**增量（回报未报 / 报得不够）**：

1. **🔴 id 51 是 UTC 脏行 —— 必须补一次**：`2026-10-18 08:37:04`，夹在 id 50（`16:34:41`）与 id 52（`16:48:21`）之间，`+8h` = `16:37:04` 正好顺次。成因 = 老大 16:37 在**未重启的 8791 旧实例**上发了一句，旧插件仍走 UTC 写入 ⇒ **正好印证 Trae 自曝的「旧插件需重启」**。⚠️ 这也说明「重启窗口内的写入会脏」是**可复发**的，⛔ 不是一次性事故。修法：`UPDATE memories SET created_at=datetime(created_at,'+8 hours') WHERE id=51`（A-④ 授权内，带备份）。
2. **🟡 compaction 阈值事实上永不触发**：`thresholdRatio 0.8 × contextWindow 1,000,000 = 800k`，而实测请求仅 ~8.1k ⇒ **自动压缩兜底等于不存在**。这不是本单缺陷（J-i 只核查不改），但它意味着**「上下文缩减」没有长期护栏**，属老大已定的「深度优化往后放」范围。
3. **🟡 召回快照是否逐轮累积 —— 存疑，证据不足**：事件流里 recall 帧每轮新增一条（seq 9／21）且旧帧留在历史中，若全量累积则每轮多背 ~550 token；但 `usage` 第 2 轮总增量只有 394，与「+550 旧快照」不吻合。⚠️ wire 层没有完整 `messages` 数组，**我判不了**，如实记为未闭合，⛔ 不写成结论。后续优化时用一次专门对照实测。

**收口**：TODO 已标完成并挂遗留项；docs 侧（`product-positioning.md` §1.2 判据号 `J-g～J-k` → `J-e～J-k`）已由 Qoder `bcd4e14` 同步，**本次判据反转（J-e→J-e′）需 Qoder 再补一句**（转办在 `log-qoder.md`）。

### 8 · 增量①闭环：id 51 UTC 脏行已补（2026-10-18 · Trae）

- **处置**：`UPDATE memories SET created_at = datetime(created_at, '+8 hours') WHERE id = 51` ⇒ `2026-10-18 08:37:04` → `2026-10-18 16:37:04`（changes=1）。
- **备份**：`larry-memory.db.bak-20261018-165847`（在位）。
- **复检**：全表 52 行按 id 顺序重跑「时间倒退 >1h」检测 ⇒ **非单调点 0**（此前唯一一处就是 id 51）。
- **旁证**：WB 的成因判断成立——该行落在 id 50（16:34:41）与 id 52（16:48:21）之间，
  时间戳 16:37 正是老大在**未重启的 8791 旧实例**上发消息的窗口。
- 证据：`D:\Code\_trae-evidence\391d\J-f\id51-fix.json`（前后值、备份路径、全表复检结果）。
- ⚠️ **可复发说明**：插件升级后未重启的实例仍按旧代码写入 UTC。换插件后必须重启台子；
  若再现同类脏行，修法同上（先备份，再按 id 定点 `+8h`，最后跑单调性复检）。

---

## 已清理段落（按交流区规矩）

- **2026-10-18 合单（WB · 老大拍板）**：原 **§14（3.9.1-b 时间戳 UTC 补修）＋ §15（3.9.1-c token 经济性）合并为一份派发稿** —— 两单在时间戳上方向相反（前者要本地化显示、后者要整个删除）且改同一文件同一行、同步同一份持久副本，分跑必有一单白做。合并后以「移除」为主线，§14 的存量数据修正／第三时间源清查降为 A-④／A-⑤，原 J-e 作废并重定义。**原 §14 单号停用**。回溯原文 `git log -p -- exchange/log-trae.md`。
- **2026-10-18 清理（WB · 老大令「顺手清一下」）**：删 **3.6 系列全部过程段**（3.6 派发稿 ／ 回报一 ／ WB 复验一 ／ 回报二 ／ WB 复验二 ／ 3.6.1 卡点稿＋回报＋WB 复验三）—— 均已成闭环：判据权威 = `docs/dsh/dsh-migration.md` §3.6:1249；进度 = `TODO.md` 3.6 段（已标 ✅）；完成态快照待 Qoder #44 归档。**保留**：在飞件（3.9.1 派发稿 ＋ §8 阻塞 ＋ §9 裁定）＋ 通用纪律 9 条 ＋ Trae 两条活账（TRAE.md 注入力度 ／ key 来源空缺）。回溯 `git log -p -- exchange/log-trae.md`。
