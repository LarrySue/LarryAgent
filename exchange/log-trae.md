# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| DSH-3.9.1 · DSH 调试体验台 | Trae | 本机 Windows | ✅ **已交付并复验通过**（§10 交付 `ae33325` ＋ WB §11 复验成立）｜🔵 **待老大上手体验** ⇒ 退出信号① | 2026-10-18 |

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

## 已清理段落（按交流区规矩）

- **2026-10-18 清理（WB · 老大令「顺手清一下」）**：删 **3.6 系列全部过程段**（3.6 派发稿 ／ 回报一 ／ WB 复验一 ／ 回报二 ／ WB 复验二 ／ 3.6.1 卡点稿＋回报＋WB 复验三）—— 均已成闭环：判据权威 = `docs/dsh/dsh-migration.md` §3.6:1249；进度 = `TODO.md` 3.6 段（已标 ✅）；完成态快照待 Qoder #44 归档。**保留**：在飞件（3.9.1 派发稿 ＋ §8 阻塞 ＋ §9 裁定）＋ 通用纪律 9 条 ＋ Trae 两条活账（TRAE.md 注入力度 ／ key 来源空缺）。回溯 `git log -p -- exchange/log-trae.md`。
