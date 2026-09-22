# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.8.1 · driver 成型** | Trae | 本机（Windows） | 🚀 **执行中**（老大 2026-09-22 已让 Trae 起跑 ｜ ✅ **前提缺口已闭合（2026-09-22）：`DEEPSEEK_API_KEY` 老大确认已交付** ⇒ J2 ／ J4 走 (a) 分支真跑；⛔ 回报须写明**实际走的哪条分支**，走了 key 路径就给证据、没走就如实标「未验」） | 2026-09-22 |

- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3」区**（**一处两面**）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯时用 `git log -p -- exchange/log-trae.md`。
- ⭐ **WB 重测前提（2026-09-22，本块派发前）** 见文末《附 · WB 2026-09-22 重测前提实录》 —— 8 条实测，其中 **2 条推翻旧登记**（`--patch` 通道实测验有 ／ **gateway 装配层结论已翻转**）、**1 条前提缺口**（key 不存在 —— ⚠️ **该缺口已于 2026-09-22 当日闭合**，见上方状态区）。**逐条对账，别照抄旧前提。**
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.2.1 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— ⛔ **本条后半句已作废（2026-09-20 WB 复验实测推翻）**：原文写「本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，**出现英文即非本机原始产物**）」—— **「出现英文即非本机产物」不成立**：本机实测 `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统／用户 UI 语言实测是 zh-CN）。⇒ **保留前半**（⛔ 不得人工改写 ／ 意译），**撤掉后半的推论**。**替代纪律**：判「原文」只认**字节级**核对（按 ACP 936 解 GBK，或直接比原始字节），并**注明该段取自哪条通道**；**语言 ／ 编码不得作"证据是否被后处理"的判据**。详见 `docs/local-env.md` §12.6。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

---


---

## DSH-3.8.1 · driver 成型（3.3-b 骨架 → 产品级 driver）

### 0 · 目标（一句话）

**把 `harness/scripts/33b-thin-client.mjs` 这个「跑一次就退」的装置对端，改造成产品级 driver** —— 一个按上游 C13 形态起 dsh、常驻、把 dsh 的**上行事件**与**出站反向请求**交给上层、并且**能自己退出**的模块。

⛔ **三个结论必须显式拆开，不得混报**：

| # | 结论 | 本块是否覆盖 |
|---|---|---|
| ① | **能起 dsh 并完成一次协议往返** | ← 本块（3.3-b 验过，本块按**新形态**复验） |
| ② | **能自己退出**（不靠 `kill` ／ 不靠超时强杀） | ← **本块的核心增量**（3.3-b 骨架此项**不合格**，见 §1-J3） |
| ③ | **端到端审批闭环**（弹卡 → 人答 → 决策生效） | ⛔ **不在本块**（属 M2；要 A 段 server ＋ 前端。本块只做到「交给上层」为止） |

⇒ **诚实边界**：本块完成后**不得**声称「审批中继已跑通」或「A 段协议已落地」—— 本块只交出 **driver 这一件**。

---

### 1 · 判据（逐条编号；缺任一条即未闭合）

| # | 判据 | 取什么证据（命令 ＋ 期望观测） |
|---|---|---|
| **J1** | **按 C13 形态能起** | driver 实际 `spawn` 的 **argv 原文**（须含 `--profile <name>`）＋ 子进程 pid ＋ **`--dump-config` 合并树里 overlay 层的命中痕迹**（命中行会追记 `, patched by <层>`；未命中打 `not found`） |
| **J2** | **一次协议往返**（`initialize`） | 请求帧 ＋ 响应帧**原文** ＋ 耗时。⚠️ **本条目标之一是验「零 LLM 也能起」** —— 若你的通道必须给 key 才能起，**如实标「需要 key」**，并按 §2-P2 分支处置 |
| **J3** | ⭐ **能自己退出**（本块核心） | ① driver 进程**退出码** ＋ 从「收工信号」到「进程退出」的墙钟；② dsh 子进程的 `exit` 事件与 code；③ **须证明未依赖 `kill()` ／ 未触发看门狗超时**。<br>⚠️ **`exit 0` ≠ 已退出** —— 判据是**进程生命周期**（是否需强杀），不是测试脚本打印的 pass。<br>⭐ **反例对照（必做）**：同条件跑一次 `33b-thin-client.mjs`，记录它是否靠 `child.kill()` ＋ `process.exit(0)` 收尾（源码 `:299-306` 是这么写的）⇒ 用来证明「本块的改进点到底改了什么」 |
| **J4** | **反向请求：接住，但⛔不自答** | driver 接到 DSH 出站的 `approval/request` 后**不得自己产生答案** ⇒ 应把它**交给上层**；上层**未答**时，对端的观测须是「无响应／超时」路径，**不是** driver 替它答了一个词。<br>证据：driver 侧留痕（接住时刻 ／ method ／ 帧 `id` ／ `requestId`）＋ 对端侧观测。<br>⚠️ **装置**：优先用**桩进程**替 dsh（可造帧、零 key）；用真 dsh 触发须真跑一个 turn ⇒ 依赖 key |
| **J5** | **双侧留痕** | driver 侧 ＋ DSH 侧（`plugin-sdk-relay` ／ `plugin-approval-remote-answerer` 的日志）**两处交叉**。⛔ **单侧自述不算证据** |
| **J6** | 顺带（**不阻塞 J1–J5**）：**gateway 在 sdk profile 下起没起 HTTP** | dsh 启动日志里 gateway 相关行 ＋ `127.0.0.1` 端口探测（`curl --noproxy '*'`）。<br>背景：WB 09-22 实测 `dsh-base` 默认树里 `typert-gateway → @deepseek-ai/dsh-api-gateway` **未禁用**、包本体已在 profile（`0.1.5-rc.2`）⇒ 稿 §14-7 的「不可启用」在**装配层已翻转**。<br>⚠️ **装配层（dump）与运行时层（起没起 HTTP）可能不同结论 ⇒ 并列留痕、不合并** |

**⛔ 不是判据的**：driver「代码好看 ／ 结构清晰」。本块只认上表六条。

---

### 2 · 判据前置

**P1 · 通道**

- 本机（Windows）；harness 树 = `D:\Code\LarryAgent\harness`。
- node：⚠️ **先报版本，别默认**。WB 的 Bash 通道读到：managed `22.22.2`（`~/.workbuddy/binaries/node/versions/22.22.2-3/`）／ system `D:\App\node\node.exe` = `24.14.1` ⇒ **同机不同通道给不同版本，两个都真**。3.3-b 的结论口径是 `v24.14.1`。
  ⇒ **钉一个并注明「取自哪条通道」**；若你读到的不一样，**先报差异再动手**（别把它当故障）。

**P2 · ⛔ 前提缺口：key**

- 现状：WB 09-22 实测 **`DEEPSEEK_API_KEY` 在当前环境不存在**（只判存在性，未读值）。
- 处置分支（**不通过 ⇒ 走哪条**）：
  - **(a) 你能拿到 key** ⇒ J2 ／ J4 的真 dsh 变体按真跑；⛔ **值不得落任何受版本控制的文件 ／ 日志 ／ 工具输出**（只进子进程 env）。
  - **(b) 拿不到** ⇒ J1 ／ J3 ／ J4（桩路线）／ J5 照做；**J2 与 J4 的真 dsh 变体如实标「未验（key 缺失）」**。
- ⛔ **不得**为了闭合判据去"想办法"（自造 key ／ 改判据 ／ 跳过）。**「未验」是可接受的结论。**

**P3 · 器材（WB 09-22 实测已就绪）**

- **四包已构建**：`lib/index.js` 4/4 存在 —— `plugin-sdk-relay` ／ `plugin-approval-remote-answerer` ／ `plugin-approval-probe` ／ `plugin-approval-answerer`。
- ⭐ **`--patch` 通道实测验有**（`dsh --help` 原文）：`--patch <path>  extra patch-list overlay applied after the profile layer (repeatable)`。
- `dsh` 入口 = `harness/node_modules/@deepseek-ai/dsh/lib/bin.js`（版本 `0.1.5-rc.2`）。

**P4 · 待裁**

- **无**。本块的**落点 ／ 形态 ／ 边界由 WB 定死**（见 §3）。有异议**先回报再动**。

---

### 3 · 交付物

| # | 物 | 落点 |
|---|---|---|
| 1 | **driver 模块** | `harness/packages/dsh-driver/`（建议包名 `@larryagent/dsh-driver`；**改名须在回报写明**） |
| 2 | **验收脚本** | `harness/scripts/run-381-driver.mjs` |
| 3 | **证据包**（J1–J6 的命令 ＋ 原始输出） | 本机，路径**由你定**并在回报写明；关键行**内联**进回报正文 |
| 4 | **回报** | **本文件**（`exchange/log-trae.md`），追加在下 |

**落点判定（WB 定，含理由与迁移触发条件）**

- 落 `harness/` 的**两个理由**：(i) 它要 `import` `@deepseek-ai/dsh-sdk-protocol`，而该树**已登记**（K5 的解析域在 harness 工作区）；(ii) 3.3-b 骨架就在同树，演进关系最直。
- ⚠️ **但它是产品件**（最终随云端服务部署）⇒ **迁移触发条件 = A 段 server 开工时**（届时与「服务侧用哪个语言」一并定）。
- ⛔ 本块**不要**顺手去建产品区目录。

**driver 须具备的四类能力（形态要求 —— 具体 API 签名由你定，本块不写死）**

1. **生命周期**：`起`（按 C13 形态 spawn dsh）／ `停`（**能自己退**）。
2. **事件上行**：把 DSH 的通知转出去（本块只需**最小切片**：至少 `session/status` 一类的状态通知能上来；⚠️ 稿 §11.3 的 19 类映射表**未填全**，别在本块硬填）。
3. **反向请求上行**：把 DSH 出站的 `approval/request` **原样交给上层**（含帧 `id` ／ `requestId` ／ toolName ／ callId ／ agentId ／ reason）。
4. **应答下行**：上层给出人答结果后，由 driver 回填给 DSH。

⛔ **第 3 类能力必须满足 J4**（接住但不自答）—— 这是本块与「3.3-b 装置对端」的**本质区别**（那个对端收到就自己答 `allowed-once`）。

---

### 4 · 参考件四要素

| # | 件 | ① 路径 | ② 怎么参考 | ③ 参考程度 | ④ ⛔ 不可参考处 |
|---|---|---|---|---|---|
| **a** | **本块正文（权威）** | `docs/dsh/dsh-38-a-protocol-design.md`（v1.0 定稿 · 607 行 · LF） | 读 §4.3（反向请求层五条纪律）／ §5（审批中继）／ §11（driver 与 K1–K7）／ §12.1（判据纪律 J-1〜J-6）／ §12.2（M1–M4）／ §14（诚实边界） | **判据 ／ 契约 ／ 边界** | ⛔ 它的 §11.3「19 类上行事件映射表」**只有指针、未填全** ⇒ 别当现成映射用 |
| **b** | **3.3-b 骨架** | `harness/scripts/33b-thin-client.mjs`（14,049 B） | 读全文；复用点清单见稿 §11.1 的两栏表（✅ 可复用语义 ／ ⛔ 不可复用类本体） | **语义可复用**：`onRequest` 单挂载 ／ 原始帧 tap（注册**早于** transport）／ 出站帧留痕（包 `child.stdin.write`）／ `AbortController` ＋ `request(signal)` ／ 双侧留痕 | ⛔ **不改它**（3.3-b 留档）；⛔ **它的收尾靠 `child.kill()` ＋ `process.exit(0)`**（`:299-306`）⇒ **不满足「能自己退出」**，本块要改进的正是这点；⛔ `JsonRpcLineTransport` **类本体不可直接用**（行分帧 vs 每事件一帧） |
| **c** | **3.3-b 装置** | `harness/scripts/run-33b-remote-approval.mjs`（684 行） | 读五段：**前置 ／ 装插件（`plugin add`）／ 重排 `dsh.profile.bundles` ／ 覆盖 profile patch 层 ／ `--dump-config` 取证** | **借流程形状**（先锚后动、留件清单、装包后重排层序） | ⛔ **别照抄它的结论**；⛔ 它 `cp -r` 整个 profile 副本（≈330 MB ／ 4.35 万文件）的做法**要按稿 §12.3 加清理开关**（默认保留 ＋ 收尾打印路径与体积） |
| **d** | **官方源码（只读）** | `ref/dsh-bare` —— ⚠️ **bare 仓库、无工作树** ⇒ 用 `git --git-dir=ref/dsh-bare show <tag>:<path>` 读；tag = **`dsh-v0.1.5-rc.2`** | 读 `dsh-sdk-protocol` 的 transport 语义（帧分类 ／ `onRequest` ／ `request(signal)`）；`docs/architecture.md` 的〈Application launch〉 | **语义 ／ 形态** | ⛔ 类本体不可直接用；⛔ 别在 bare 仓库里 `checkout`（会动到只读件） |
| **e** | 官方 Electron 桌面端（同题先例） | 同上 tag 的 `apps/desktop` ＋ Desktop Host | 读其 **Unary RPC ＋ Remote streams 走 framed byte pipes**、**「opens no Web server or loopback port」** 的形态 | **只借鉴设计** | ⛔ 它的承载是 **Node IPC byte pipes**，与我们的 HTTP/SSE 不同 |

⚠️ 上述**所有行号**系 WB 09-22 实测所处位置 ⇒ **你动手时先自行复核**（文件会变）。

---

### 5 · 场地器材

| 项 | 值 | 备注 |
|---|---|---|
| 机 | 本机（Windows） | — |
| harness 树 | `D:\Code\LarryAgent\harness`（pnpm workspace：`packages/*`） | 包管理器⛔ **锁定 pnpm**，禁 `npm` ／ `yarn`（换掉会重排整棵树 ⇒ 本块判据全作废） |
| dsh 入口 | `harness/node_modules/@deepseek-ai/dsh/lib/bin.js` | WB 实测可跑（`--help` ／ `--dump-config` 均 exit 0） |
| dsh 版本 | `0.1.5-rc.2` | 取自 `harness/package.json`（`@deepseek-ai/dsh` ＋ 3 个 sdk 包同代） |
| node | ⚠️ **钉一个并注明通道**：managed `22.22.2` ／ system `24.14.1`（3.3-b 口径） | 见 §2-P1 |
| profile 源 | `.dsh-home/profiles/sdk`（**只读源**，⛔ 别改） | 装置里 `cp -r` 出临时 home |
| **验靶通道 A** | `dsh --profile sdk --dump-config` —— 组合出配置树**即退出、不激活插件** | ⚠️ 它**幂等重写** `profiles/<name>/cordis.yml`（WB 09-22 复现：内容不变、**mtime 被刷新**）⇒ 别用 mtime 判「有没有被动过」 |
| **验靶通道 B** | ⭐ `--patch <临时层.yml>`（**可重复叠加**）＝ **不改场地文件就能把写法试通** | 本块**可选**用它替掉「改 profile 自身 patch 文件」那一步（不强制） |
| 插件构建 | `cd harness && pnpm --filter <pkg> run build` | 四包 `lib/index.js` 已存在；改了源码须重建 |
| key | `DEEPSEEK_API_KEY` —— ⚠️ WB 09-22 实测**当前不存在** | 只判存在性；**值不落稿**（见 §2-P2） |
| 成本账 | 每次临时 home `cp -r` ≈ **330 MB ／ 4.35 万文件**；3.3-b 累计已 **10.2 GB** ｜ 稿 §12.3 | 须加 **显式清理开关**（默认**保留**，复核要用）＋ 收尾**打印 home 路径与体积** |

**⚠️ 已知「假绿」坑（写死，别踩）**

1. **`--dump-config` 的组合树 = 静态装配**，**不等于**运行时可用。WB 本轮实测已见**同一对象在两条通道给出不同结论**（装配层 vs 运行时层）⇒ 两个通道的结论**并列留痕、不合并**。
2. **`du` 跨参数调用会去重 hardlink** ⇒ 体积一律**单路径单命令**：`du -sb --count-links <一个路径>`；同一路径在不同命令里读数不同是**正常现象**，别当矛盾。
3. `ls -la` 里**目录的 size 恒为 4096** ⇒ 不代表内容大小；判「有没有东西」用 `find <path> | wc -l`。
4. ⚠️ **`dsh` 子进程已退出后**，再 `transport.request()` 会**永久挂起**（输入流已 end ⇒ 新条目无对端可答、`failPending` 已跑过）⇒ **先判子进程存活**。3.3-b 已实测。
5. ⚠️ **`onRequest` 是替换语义**（「replacing any prior handler」）⇒ **全进程只准一处**；谁后装谁赢、先装者**被静默顶掉**（K2）。
6. `--dump-config` 的警告**仍 `exit 0`**（未命中打 `not found` 但不失败）⇒ ⛔ 别把「退出码 0」当「没问题」。
7. ⭐ 判「未命中」**必须先有一个「必中的对照组」** —— 用一个明知不存在的目标跑出那条警告，才敢说「没警告 ＝ 命中」。

---

### 6 · 回报格式

1. **结论先行**：一句话 —— `3.8.1` 是否闭合。
2. **逐条**：J1–J6，每条 = **命令 ＋ 原始输出 ＋ 判定**（PASS ／ FAIL ／ 未验）。
3. **未闭合项单列**（含 §2-P2 key 分支的实际走向）。
4. **自曝（必填）**：跑歪的 ／ 判据要订正的 ／ 发现的矛盾，**直接写**。
   ⚠️ 并写明：**「成因未知」是可接受的结论，别为叙事完整编一个**。
5. ⛔ **证据原文原样落盘**；工具链自身的语言 ／ 编码差异**原样保留**，并**注明该段取自哪条通道**。**禁人工改写 ／ 意译。**

---

### 7 · 禁区

1. ⛔ **不改** `harness/scripts/33b-thin-client.mjs` ／ `harness/scripts/run-33b-remote-approval.mjs`（3.3-b 留档件）。
2. ⛔ **不碰真 home** `.dsh-home` —— 它只作**只读源**；装置一律用**临时 home**。
3. ⛔ **不把凭据值**（`DEEPSEEK_API_KEY` 等）落任何**受版本控制的文件 ／ 日志 ／ 工具输出**。
4. ⛔ **不越界**：不做 A 段 server、不做前端 UI、不改官方包（`ref/` 只读、`node_modules` 只读）。
5. ⛔ **禁 `rm -rf`**；清临时 home 走**显式开关**（默认保留 + 收尾打印路径与体积）。
6. ⛔ **不得自造另一个 executable 或 inline application tree**（C13 ／ K6 明文禁止）—— 启动形态只能是 `dsh --profile <name>` ＋ ordered patch files。
7. ⛔ **不得让 driver 自己答审批**（J4）—— 答案只能来自上层。
8. ⛔ **不装包管理器替代**：涉及依赖树一律 `pnpm`，禁 `npm` ／ `yarn`。

---

### 附 · WB 2026-09-22 重测前提实录（派发前实测，供你对账）

> 以下为 WB 在 `2026-09-22 09:5x–10:1x (+08:00)` 经 **Bash 通道**实测（部分经 `--dump-config` 零副作用通道）。**旧登记 ≠ 现状**，逐条对账如下。

| # | 项 | 旧登记 | WB 09-22 实测 | 判定 |
|---|---|---|---|---|
| 1 | `dsh --patch` 通道存在 | 稿 §5 提到该通道（未标"实测"） | ✅ `dsh --help` 原文有：`--patch <path> extra patch-list overlay applied after the profile layer (repeatable)`；`--from-default-profile` ／ `--dump-config` ／ `--dump-default-config` 同在 | **成立**（本轮实测） |
| 2 | harness 依赖树同代 | `0.1.5-rc.2` | ✅ `harness/package.json`：`@deepseek-ai/dsh` ／ `dsh-sdk-client` ／ `dsh-sdk-jsonrpc-server` ／ `dsh-sdk-protocol` 四件**全 `0.1.5-rc.2`**；`node_modules/@deepseek-ai/dsh` 实读版本同 | **成立** |
| 3 | 3.3-b 交付物在且可用 | relay ／ remote-answerer ／ 骨架 | ✅ 四包 `lib/index.js` **4/4 存在**（已构建）；`33b-thin-client.mjs` 14,049 B | **成立** |
| 4 | **凭据** | 装置"只判 `DEEPSEEK_API_KEY` 存在性" | ⚠️ **当前环境不存在**（`os.environ` 遍历，只判存在性未读值） | ⚠️ **前提缺口** ⇒ §2-P2 |
| 5 | **gateway 装配** | 稿 §1-2「Gateway 在当前版本**不成立**」 | ⚠️ **装配层翻转**：`--dump-config` 合并树里 `# == @deepseek-ai/dsh-base` 层有 `- id: typert-gateway` ／ `name: '@deepseek-ai/dsh-api-gateway'`，**未标 `disabled`**（对照：同层的 `hmr` 行标了 `disabled: true`）；包本体**已在** `profiles/sdk/node_modules/@deepseek-ai/dsh-api-gateway`，版本 `0.1.5-rc.2`；npm `dist-tags`：`latest=0.0.1-rc.1` ／ **`next=0.1.5-rc.2`** ／ `alpha=0.1.6-alpha.2` | ⚠️ **本篇 §14-7 的"待重测"在装配层已见结果** ⇒ J6 顺带收口。⛔ **运行时层仍未验**（原 `/api/remote.mux` 404 出自运行时通道）⇒ **两通道并列留痕、不合并** |
| 6 | node 口径 | 3.3-b 结论取自 `node v24.14.1` | ⚠️ WB Bash 通道：managed `22.22.2`；system `D:\App\node\node.exe` = **`24.14.1`** ⇒ 3.3-b 用的应是 **system node** | **须钉通道**（§2-P1） |
| 7 | `--dump-config` 副作用 | 稿 §5 假绿坑 1（"会幂等重写 `cordis.yml`"） | ✅ **复现**：跑一次后 `.dsh-home/profiles/sdk/cordis.yml` **mtime 被刷新**（内容仍为注释 ＋ `[]`，**逐字节未变**） | **成立**（本轮实测复现） |
| 8 | 临时 home 成本 | 稿 §12.3：≈330 MB ／ 4.35 万文件每次，累计 10.2 GB | **未复跑**（本轮全程零副作用，**未起装置**） | **沿用登记**（⛔ 未验，勿当已核） |

**⚠️ 一处必须点明**：上表第 5 条是**本轮新挖**，它同时意味着 —— **`plugin-sdk-relay` ／ `plugin-approval-remote-answerer` 的「装置用，产品部署不要装」定位已过时**（A 段 driver 在生产也要同款装配）⇒ 本块⛔ **不改它们的描述**（属定位变更，WB 另行处置），你**按现状用**即可。
