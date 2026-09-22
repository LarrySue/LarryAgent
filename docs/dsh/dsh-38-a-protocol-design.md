# DSH-3.8 · A 段协议设计（v1.0 定稿）

> **状态**：**v1.0 定稿**（2026-09-22）· 承接实现 = **Trae**
> **本版由三方评审融合产出**：Trae（实施方视角）／ Claude（测试与取证视角）／ Qoder（文档一致性视角）。含三份评审附录的存档版本 = git `074a894`（**当时**路径 `exchange/dsh-38-a-protocol-design.md`，已随定稿移入本区）——**归档只作溯源，不作依据**；意见的处置结论已全部落进本稿正文。
> **上游依据**：`TODO.md`「DSH-3.8」段 ＋ `dsh-migration.md` §3.6〈通信面选型分析〉／〈UI 自由度边界〉／〈定型结论：自做服务中转〉／〈B 段 Gateway 路线实测判定〉／〈S1 审批三段收敛路径〉
> **本文是 A 段协议的唯一落点**。B 段（服务 ↔ DSH）选型见 `dsh-migration.md`；C 段（本地副作用工具）的**协议承载**在本文 §10，其**能力边界**在产品文档。

---

## 0 这份稿要解决什么

`TODO.md` 对 3.8 的定义是一句话：**「流式转发 / 会话管理 / 鉴权 / 多端同步 / 重连补帧 —— 全自实现」**（官方 Gateway 白送的恰是这部分）。

外加一条**核心增量**：**A 段协议须含 `server → client` 请求的承载** —— 即「审批请求双向中继」，它是 3.3 三段收敛的**终点**，也是「PC 侧弹框审批」这个产品能力的**技术前提**。

⇒ 本文要交出的是**一份可照着实现的协议规格**，不是选型比较（选型已在 `dsh-migration.md` 定案）。实现方需要能从本文得到：端点表、帧形状、方法集、状态机、错误与降级语义、与 B 段的接线契约。

### 0.1 两处岔路的定案（原「待老大裁」）

出稿时留了两处岔路，**本版已定案**：

| 岔路 | 定案 | 依据 |
|---|---|---|
| **D1 承载** | **D1-a：HTTP unary（client→server）＋ SSE（server→client）** | 与出稿倾向同向，且 **Trae ／ Claude ／ Qoder 三方一致**（Qoder 未提异议）。Claude 另给一条独立理由：**可验性** —— D1-a 的 HTTP 层让判据能用现成工具观察（`curl` ／ 反代日志 ／ 抓包），对"第三方可独立复验"更友好 |
| **D2 帧形状** | **D2-a：JSON-RPC 2.0 语义**（承载换 HTTP/SSE） | 同上。关键理由：D2-a 让 §5.4 那条「协议错误要能追溯到原始帧」**有落点**；自定 REST 形状下它无处安放 |

⚠️ **定案留痕**：本版依三方一致意见收敛，**非老大裁决**。若老大改判，§3.2（帧形状）与 §3.3（端点表）须**整体重写**，且 §4.3 ／ §9 ／ §12 的判据要跟着改 —— 改判成本已记在 §14-2。

---

## 1 范围与边界

**链路三段**（`dsh-migration.md`〈定型结论〉，2026-09-09 拍定）——本文只管 **A 段**：

| 段 | 路径 | 协议归属 | 跨网络 | 本文角色 |
|---|---|---|---|---|
| **A** | 前端（PC 的 Vue/Tauri、移动版浏览器）↔ **自做云端服务** | **我们自定，与 DSH 无关** | ✅ | **本文全部内容** |
| **B** | 自做云端服务 ↔ DSH host | DSH 通信面（已定 **SDK/stdio**） | ❌ 同机 | §11 只定**接线契约** |
| **C** | DSH host ⇢ C 侧本地工具（file_ops / shell） | **自做**（三官方面均无此语义） | — | §10 定**承载** |

⛔ **本文不重新讨论的**（上游已拍，勿在实现时翻案）：
1. 中转架构本身（A 段退出 DSH 选型范围）。
2. B 段 = SDK（stdio）；Gateway 在当前版本不成立 ⇒ **会话树 / fork / cancel / 历史分页 / 重连追赶 / gap 修复 / 心跳这些"官方白送的"，A 段必须自做**。⚠️ **本条依据已被本版标为待重测** —— 见 §14-7（闸门：若 Gateway 实际可用，本条与 §12 的工作量都会变）。
3. L3「换整个前端、直连 `/api`」为**主路径**。官方 `@deepseek-ai/dsh-client-*` 包 **51 个**（口径：`packages/client/*/package.json` 的包名，取自 `ref/dsh-bare` @ `dsh-v0.1.5-rc.2`，2026-09-22 本版复核；⚠️ `dsh-migration.md` 按其 **09-09 时点**记作 **41 个** —— **两个数字都对，差在时点**，引用时须带时点）。它们可 `pnpm add` 直接依赖（源码随包分发）。
   ⚠️ **但"用官方组件拼"这句只对其中一部分成立**：这 51 个包里**大多数是 React 组件**（`react ^18.2.0`）⇒ **UI 半边官方是 React，Vue 项目只能参照、不能复用**。真正可当"组件"拼的是下面这批**非 React 核心件**（本版实测其 `dependencies` 里无 react）：

   | 包 | 自我描述（原文摘） | 对 A 段的意义 |
   |---|---|---|
   | `dsh-client-connection` | "**Authenticated RPC transport**, generation lifecycle, and **browser fixture**" | ⭐ **正是 §3.3／§4.3 要自做的那一层**（鉴权 RPC 传输 ＋ 代际生命周期 ＋ 浏览器端 fixture） |
   | `dsh-client-store` | "**React-free** observable and snapshot-store contracts…" | 前端状态层（原文自写 React-free） |
   | `dsh-client-ui-slots` | "Slot registry **pure core**: SlotMap declaration merging…" | 插槽注册的纯核心（Vue 侧可直接对接） |
   | `dsh-client-resources` | "Unified client **resource model**…" | 对应 §3.5 的 `/a/blob/:ref` 那一类 |
   | `dsh-client-modules` ／ `file-upload` ／ `hmr` ／ `ui-reference` | 客户端模块系统 ／ 上传 ／ 热重载 ／ `@file`·`@session` 引用源 | 按需 |

   ⇒ 结论：**前端可"拼"的是上表这几件传输 / 状态 / 插槽 / 资源核心；UI 半边要自做（Vue）**。这条不改，实现方按"拼 UI 组件"的预期去开工会在 M1 撞墙。
   ⚠️ 两处 `/api` **不是同一个**：本条说的是**官方 web surface 的 `/api`**；§15 参考件 1 里"实测 404"的是 `remote.mux` 那条。二者不矛盾，勿互推。

---

## 2 上游既定约束（设计输入，逐条须在协议里有落点）

| # | 约束 | 出处 | 本协议落点 |
|---|---|---|---|
| C1 | **三态模型** `cold` / `warm` / `hot` 须可表达 | 〈定型结论〉条 3 | §6 |
| C2 | **「打开看看」不得触发 LLM 调用** | 同上 | §4.1 `session/open` vs `session/prompt` 分离 |
| C3 | **多终端叠加**（PC ＋ 手机同看一个会话）属 A 段职责 | 同上 | §8 |
| C4 | **C 段指令下发 / 结果回传发生在「服务 ↔ C 侧」**，完全不经过 DSH | 同上条 4 | §10 |
| C5 | 鉴权：官方网关内置 token→cookie，但**多用户 / 租户隔离须自做** | 〈通信面选型〉风险② | §7 |
| C6 | 官方 connection 的传输形状 = **HTTP unary ＋ SSE**（非 WebSocket） | 〈UI 自由度边界〉边界 3 | §3.1（**已定案 D1-a**） |
| C7 | 上云：**不支持绑定全部网卡** ⇒ 反代或显式白名单 | 〈通信面选型〉条 6 | §3.3 部署前提 |
| C8 | 3.3-b 已实测的**结果词汇封闭**：`allowed-once` / `rejected` / `cancelled` / `unavailable`；**无 `allow-always`** | `dsh-migration.md`〈S1 三段收敛〉 | §5.3 |
| C9 | **超时两路语义**：请求侧 `AbortSignal` ⇒ `cancelled`；答者侧自建计时器 ⇒ `unavailable`（官方无答者侧超时） | 同上 | §5.4 |
| C10 | **对端消失 ⇒ fail-closed ＋ 必须留可观测日志**（静默 fail-closed ＝ 假绿源） | 同上 ＋ `TODO.md` 贯穿规则 | §5.4 ／ §5.6 ／ §12 |
| C11 | **`approval/request` 是 3.3-b 的临时 method 名，3.8 定稿后可改名** | 同上〈未验〉条 | §5.1 定名（**沿用**） |
| C12 | `onRequest` 是**替换语义**（"replacing any prior handler"），抢装会静默顶掉先装者 | `transport.d.ts` 原文 | §11.2 K2 |
| **C13** | **应用启动形态 = 「`dsh --profile <name>` ＋ ordered patch files」** —— 上游明文："custom plugin composition remains **a profile plus ordered patch files, not another executable or inline application tree**"；且 `verify-application-entrypoints` "rejects a Node application path that bypasses `dsh`"。官方 Python SDK 即此范式（"the client launches `dsh --profile sdk` with an explicit Harness home"） | 上游 `docs/architecture.md`〈Application launch〉@ `dsh-v0.1.5-rc.2`（本版逐字复核） | §11.1 ／ K6 |
| **C14** | **官方桌面端（Electron）自己就在做同题**：Unary RPC ＋ Remote streams 走 framed byte pipes、**"opens no Web server or loopback port"** | 同上〈Desktop application〉 | §15 参考件（新增一档） |

> ⚠️ **C13 的边界**：该禁令的**语境**是上游自身仓库的准入门禁（`verify-application-entrypoints` 是上游的脚本）。它对**第三方产品**是否构成硬约束，**本版不定性**；但"向该形态对齐"是**零成本**的（我们的路 A 装配本来就是 profile ＋ patch），故按 C13 执行。

---

## 3 协议总览

### 3.1 承载（**定案 D1-a**）

| 方案 | 形状 | 优势 | 代价 |
|---|---|---|---|
| **D1-a（定案）** | **HTTP unary（client→server）＋ SSE（server→client）** | ① 贴合官方 `dsh-client-connection` 形状，参照成本最低；② 反代友好（C7）；③ 移动端 `EventSource` 原生支持；④ 判据可用现成工具观察（`curl` ／ 反代日志 ／ 抓包）⇒ **可被第三方独立复验** | ① 反向请求要用 unary POST 回响应（§4.3）；② **须自造"撤回"下行通知**（§4.3 纪律 4）；③ **须自定义重连后 pending 的归属**（§4.3 纪律 5）；④ 上行信道单向 ⇒ 前端→server 的一切（含回帧）都走 unary |
| D1-b（备选） | WebSocket 单连接双向 | 反向请求天然对称；连接状态单一 | 需自管心跳 / 重连 / 反代兼容；偏离官方形状；**判据须专门客户端才能观察** |

⚠️ **代价栏已按 C1 意见改准**：出稿时只写了第 ① 项。**②③ 是v1.0 评审新增的两项真实成本** —— 记准它们是为日后复盘时**不再以为它是白送的**。

**结论不变（D1-a）**：D1-b 省掉的只是"回帧那一次往返"，而**撤回 ／ 结清 ／ 重连**三件事在 WS 下**一样要自做**；且"反代友好"与移动端 `EventSource` 是实打实的省事。

> ⛔ 无论裁哪个，**A 段与 B 段的边界不变**：承载是 A 段内部事，不影响 driver 与 DSH 的 stdio 约定。

### 3.2 帧形状（**定案 D2-a**）

| 方案 | 形状 | 说明 |
|---|---|---|
| **D2-a（定案）** | **JSON-RPC 2.0 语义**，承载换成 HTTP/SSE | ① 与 B 段（`JsonRpcLineTransport`）同构 ⇒ 3.3-b 薄客户端骨架的**语义**可整套复用（**注意：是语义，不是类本体**，见 §11.1）；② 双向请求天然对称（有 `id` 就是 request）；③ 通知与请求的区分是现成语义；④ **§5.4「协议错误要能追溯到原始帧」有落点** |
| D2-b（备选） | 自定 REST 形状 | 更"接口化"，但对前端直观**只对 client→server 那半边成立**；server→client 那半边（正是本项目的**核心增量**）仍要自造 ⇒ **两套形状并存** |

**帧分类**（沿用 DSH `transport` 心智模型，B 段已实测）：

| 形状 | 语义 |
|---|---|
| `{id, method, params}` | **请求**（要回 `{id, result}` 或 `{id, error}`） |
| `{id, result}` ／ `{id, error}` | **响应** |
| `{method, params}`（无 `id`） | **通知**（不回） |
| 无 handler 的请求 | 回 **`-32601 method not found`**（**不静默丢弃** ⇒ 天然可观测，已在 3.3-b 实测作负向对照） |
| handler 抛错 | 回 **`-32603`** |

**id 命名空间**（⚠️ 必须写死，否则双向请求会撞 id）：

1. 帧 `id` **统一为字符串**（不得用数字）。
2. `c-<n>` = client 发起，`s-<n>` = server 发起；两端各自单调递增。
3. **同一 id 在未结清窗口内不得复用**。
4. ⛔ **`requestId`（§5.3）不得挪用作帧 `id`** —— 二者是两个层面（前者 = 业务对账键，后者 = 帧关联键）。
5. ⛔ **重连后旧 `s-<n>` 一律作废**（见 §4.3 纪律 5）。
6. ⚠️ **跨重启的线上对账键不能沿用 DSH 侧 `requestId`**：3.3-b 实测它是**进程内自增**（`remote-1` / `remote-2` / …），**重启即复用** ⇒ 它只能做**单次运行内**的对账键。跨重启的对账键另定，建议 `(sessionId, uuid)` 或 `(deviceId, seq)`。

### 3.3 端点表（按 D1-a 列）

| 端点 | 方法 | 用途 | 鉴权 |
|---|---|---|---|
| `/a/rpc` | `POST` | **全帧入口**：client→server 的 request / response / notification 都走这里 | ✅ |
| `/a/stream` | `GET`（SSE） | **上行信道**：server→client 的通知 ＋ **反向请求** | ✅（**一次性 ticket**，见 §7） |
| `/a/ticket` | `POST` | 取一次性 SSE 凭证（§7） | ✅ |
| `/a/blob/:ref` | `GET` | 大对象取回（附件 / 长工具输出），避免塞进事件流（语义见 §3.5） | ✅ |

**部署前提（C7）**：本协议**不绑全部网卡**（对齐官方 web surface 约束）⇒ 生产形态是「绑定 loopback ＋ 反向代理」或「显式 `--trusted-host` 白名单」。反代已实测可行（`production-env.md` §7.1）。
⚠️ **反代日志须对 query 脱敏**（因为 `/a/stream` 的 ticket 会出现在 query 里，见 §7）。

### 3.4 HTTP 状态码语义（v1.0 新增，防"两套错误处理"）

`/a/rpc` 的 **HTTP 层只表达传输**，不表达业务：

| 情形 | HTTP | 体 |
|---|---|---|
| unary **请求**（request 帧） | `200` | `{id, result}` 或 `{id, error}`（**协议错误也是 200**） |
| **notification / response** 帧 | `202` ／ `204` | 空体 |
| 未认证 / 凭证过期 | `401` | 空体或 `{error}` |
| 限速（§7） | `429` | 空体 |
| **回一个已结清或未知的 `s-<n>`** | **`409`** | `{error:{code, data:{kind}}}`（`kind` ∈ `unknown` ／ `settled`）—— **须能区分这两种**（见 §4.3 纪律 4） |
| 服务端故障 | `5xx` | 空体 |

⛔ **协议错误一律 `200` ＋ JSON-RPC error 帧**（`-32601` ／ `-32603`）。若反过来用 `404` 表达 `-32601`，前端要写两套错误处理，且 §5.4 那条「协议错误要能追溯到原始帧」的负向对照会**失去落点**。

### 3.5 大对象（blob）语义（v1.0 补全）

`/a/blob/:ref` 出稿时只给了端点，三件事须补全：

| 项 | 语义 |
|---|---|
| 签发 | **server 侧短期签名 URL**（`ref` 里带签名或另附 `sig` 参数） |
| TTL | 短期（建议 ≤ 10 min）；过期后前端重新申请 |
| 跨设备 | 同 `ownerId` **可跨设备取**（多端看同一附件）；⛔ `ref` **不可猜测**（含随机量） |
| 阈值 | 单块超过 **64 KB**（建议值，可配）即走 blob，**不塞事件流** |

---

## 4 消息集

### 4.1 下行（client → server）

| method | 参数（要点） | 结果 | 触 LLM？ |
|---|---|---|---|
| `auth/login` | `{deviceLabel, pairingCode}`（⚠️ **凭据须补**，见 §7） | `{token, expiresAt}` | — |
| `stream/ticket` | `{deviceId}` | `{ticket, expiresAt}`（TTL ≤ 60 s、一次性） | — |
| `session/list` | `{cursor?, limit?}` | `{items:[{id,title,updatedAt,state}], nextCursor?}` | ❌ |
| `session/open` | `{sessionId, sinceSeq?}`（⚠️ **参数已扩**，见下） | `{history:[…], state, snapshotSeq}`（`state` ∈ `warm` ／ `hot`） | ❌ **（C2：只读不跑）** |
| `session/prompt` | `{sessionId, blocks:[…]}` | `{messageId, queuePosition?}`（**受理回执，非答案**） | ✅ |
| `session/cancel` | `{sessionId, messageId?}` | `{ok}` | — |
| `session/new` | `{cwd?}` | `{sessionId}` | ❌ |
| `session/rename` | `{sessionId, title}` | `{ok}` | ❌ |
| `session/subscribe` ／ `session/unsubscribe` | `{sessionId}` | `{ok}` | ❌ |
| `stream/resume`（若不用 SSE 的 `Last-Event-ID`） | `{sessionId, sinceSeq}` | `{ok}` | ❌ |

⛔ **`session/open` 与 `session/prompt` 的分离是硬要求**（C2）：前者是"打开看看"（历史加载，可能几十万 token 的历史**不得**因此触发 context 重建），后者才是"真的发一条"。前端**不得**用 open 的副作用当 prompt 用。

⚠️ **`session/open` 一个方法背两种语义，参数必须能区分**（v1.0 修正）：

| 传参 | 语义 | 返回值 |
|---|---|---|
| **不给** `sinceSeq` | **全量快照** | 带 **`snapshotSeq`** |
| **给** `sinceSeq` | **增量**（补一段） | 带 `snapshotSeq`（= v1.0 数据的续播基准） |

⛔ **重建后的续播基准 = 返回的 `snapshotSeq`** —— 不写死这条，重建与实时流会错位，§9 的 `seq` 会串。
⚠️ 且对**已是 `hot`** 的会话，open **只回状态与增量**，**不得**重放历史进 context（§6-③）。

### 4.2 上行事件（server → client，通知 / SSE）

| 事件 method | 语义 | 备注 |
|---|---|---|
| `session/state` | 三态变更（`cold`/`warm`/`hot`） | C1 |
| `message/delta` | 流式增量（文本 / thinking / 工具入参） | 流式转发的主通道 |
| `message/complete` | 一条消息收口 | |
| `tool/state` | 工具调用状态（起 / 止 / 结果摘要） | |
| `approval/request` | **反向请求**（见 §4.3 ／ §5） | 本段核心增量 |
| `approval/decided` | **终局扇出通知**（见 §5.5） | v1.0 新增：多端下关卡用 |
| `tool/execute` | **反向请求**（C 段，见 §10） | 本段核心增量 |
| `stream/cancel` | **作废一个已发出的反向请求**（见 §4.3 纪律 4） | v1.0 新增：撤回的承载 |
| `session/queue` | 排队状态变更（见 §4.4） | v1.0 新增 |
| `session/compaction` | 上下文压缩事件 | |
| `stream/gap` | 补帧窗口不足 ⇒ 客户端须走快照重建 | §9 |
| `stream/ping` | 心跳（2 s，对齐官方） | §9 |

### 4.3 反向请求层（⭐ 本段核心增量）

**问题**：`server → client` 的**请求-响应**语义，在纯事件流里没有天然承载。

**做法**：

- **D1-a（定案 · SSE）**：server 通过 `/a/stream` 下发 `{id:'s-<n>', method, params}` ⇒ client 处理完后，把 `{id:'s-<n>', result}` **作为一帧 POST 到 `/a/rpc`**（该端点同时接受 request / response / notification 三类帧）。server 侧的 pending 表按 id 结清。

**五条纪律**（两侧共用）：

1. **pending 表两侧对称**：server 发反向请求后登记 pending；client 回帧或超时后结清。
2. **超时归属见 §5.4**（五路语义不同，⛔ 不得混用）。
3. **对端不在线 ⇒ 立即 fail-closed ＋ 落日志**（C10）。
4. **⛔ 撤回即清 ／ 迟到丢弃 ／ 回帧被拒要能分态**（v1.0 新增整块）：
   - server 若需作废一个**已发出**的反向请求 ⇒ 必须发**下行通知** `stream/cancel {id, reason}`。
   - client 收到即**清本地 pending ＋ 关卡**（否则前端**无从知道**卡片已作废，会一直挂着）。
   - client 的**迟到回帧**到 server 后**不得结算** ⇒ server 回 **`409`**，且响应体**须区分** `kind:'unknown'`（我从没有过这个 id）与 `kind:'settled'`（有过，但已结清/已作废）。
   - **依据**：3.3-b `lateabort` 臂实测 —— DSH 侧 `req.signal` 中止 ⇒ 出站 pending 条目**被移除**；对端**迟到的 `allowed-once` 被丢弃**（该帧之后的采样恒 0）；结果恒 `cancelled`。A 段须复现同一语义。
5. **⛔ 重连后未结清的反向请求必须分两类，不得一刀切**（v1.0 新增）：

   | 类 | 处理 |
   |---|---|
   | `approval/request` | **可重问**（幂等、无副作用）⇒ server 用**新 `s-<n>` 重发**；client 按 §5.3 的 `requestId` **去重、复用同一张卡** |
   | `tool/execute` | ⛔ **绝不自动重发**（可能重复写文件 / 重复执行命令，非幂等）⇒ 旧 id 一律判 `unavailable` ＋ 落日志 ＋ 提示"需人工重发" |

   ⚠️ 这条差异是"审批与工具**共用一个反向层**"之后**最容易出事的地方**（§10 与 §5 的同层代价）。

### 4.4 排队与并发语义（v1.0 补定，原为缺口）

出稿时 §8 只写了"多设备同时发 prompt ⇒ server 侧串行化"，**排队后的语义未定**。本版补：

| 项 | 语义 |
|---|---|
| 受理时机 | `session/prompt` **受理即给 `messageId`**（不等轮到）—— 前端需要它做本地占位与撤回 |
| 队列可见性 | 响应带 `queuePosition`；队列变动下发 `session/queue {sessionId, items:[{messageId, position}]}` |
| 撤回自己 | 排队期间 `session/cancel {sessionId, messageId}` **可撤回自己那一条**；未开始的直接出队，已开始的走 §5.4 路 (a) |
| 上限 | 单会话队列上限建议 **8 条**（可配），超出回 `429` |
| ⛔ 硬约束 | **同一会话在 DSH 侧任何时刻只有一个 turn**（队列只存在 server 侧，不进 DSH） |

---

## 5 审批请求双向中继（3.3-c 的终点）

### 5.1 定名（C11 收口）

3.3-b 用的是**临时约定**的 `approval/request`。本稿**定名沿用它**（理由：减少一层无谓翻译；且它与 DSH 内部 `approval/request` waterfall **同名同义**，转换层可直通）。

⚠️ **但两者是两件事，实现时不得混指**：
- DSH 侧 `approval/request` = **进程内 waterfall 事件名**（`dsh-user-approval` 的机制面）。
- A 段 `approval/request` = **线上 method 名**（server→client 反向请求）。
- driver（§11）是二者之间**唯一**的翻译点（K1）。

### 5.2 链路全图

```
DSH 内插件（remote-answerer）
  └─ DSH 出站请求（B 段 · stdio JSON-RPC）  method = approval/request
      └─ driver（= 3.3-b 薄客户端骨架）     ← 翻译点
          └─ A 段反向请求（server→client）  method = approval/request
              └─ 前端（PC Tauri 弹卡 / 移动端浏览器弹卡）
                  └─ 人答 ⇒ 回帧（client→server response）
              ← 答案沿原路回填 ⇒ DSH 侧答者结算
              ← 终局另扇出 `approval/decided` ⇒ 该会话**全部**订阅者关卡
```

### 5.3 参数与结果（**须与 3.3-b 的实测词汇一致**）

请求 `params`：
```
{
  requestId,        // 两侧日志对账（DSH 侧已有此字段）
  toolName, callId, agentId, reason,
  options: ['allowed-once', 'rejected'],   // 前端据此渲染按钮
  expiresAt?        // 可选：见 §5.4（⛔ 绝对时间戳以 server 时钟为准）
}
```

结果：**封闭词汇，不得扩展**（C8）—— `allowed-once` ／ `rejected` ／ `cancelled` ／ `unavailable`。
⛔ **无 `allow-always`**（3.3-b 实测：`dsh-user-approval` 的结果词汇表里不存在）。前端**不得**自行造"总是允许"按钮。

⚠️ **对账键的边界**：`requestId` 只作**单次运行内**对账（它进程内自增、重启即复用，见 §3.2 第 6 条）。

### 5.4 超时与失败（⚠️ **本段最易错处**，C9）—— 五路封闭表

| 路 | 机制 | 落哪个词汇 | 谁负责 |
|---|---|---|---|
| **(a) 请求侧中止** | DSH 侧 `req.signal` abort（如探针 `timeoutMs` 到点） | **`cancelled`** | DSH 侧（非我方） |
| **(b) 答者侧自建超时** | **官方答者侧不存在超时计时器** ⇒ 须自做（3.3-b 已在远端答者里做过） | **`unavailable`** | 我方（答者 / driver） |
| **(c) 前端不答** | 人没点、页面关了、网络断了 ⇒ 由 **server 侧 pending 超时**兜底 | **`unavailable`**（**不是** `cancelled` —— "取消"是请求侧的动作） | 我方（server） |
| **(d) 对端消失** | 传输终止 / PC 离线 | **`unavailable`** ＋ fail-closed（动作 0 次）＋ **必须留可观测日志** | 我方 |
| **(e) 人主动放弃**（v1.0 新增） | 人在卡上点"拒绝 / 放弃" | **`rejected`**（人做了"不放行"的决定） | 前端上报 |

⚠️ **(b)(c)(d) 三路同词**（`unavailable`）—— 这是**对的**（它们本来就是"没人答 / 答不了"），但⇒ **"落对词汇"这条判据对它们没有区分力**。区分须靠 §5.6 的**独立痕迹**与**原始帧可追溯**（§12.1 探针矩阵）。

⛔ **`-32601` 与 `-32603` 不得直接当业务结果**：DSH 侧会把它归一化成 `unavailable`（3.3-b 实测：对端未装 handler ⇒ 原始帧 `-32601` ⇒ dsh 侧归一化为 `unavailable`）。A 段同理——**协议错误要能追溯到原始帧**，但不能让它变成"另一个业务词汇"。

**超时参数（v1.0 定口径）**：

| 项 | 定法 |
|---|---|
| 值 | **可配置，默认 120 s**（产品参数，**不写死在协议里** —— 否则"改它 = 改协议"） |
| 判据 | 跑测试时**设短路值**（如 2 s）验**机制**；产品默认值由使用侧另定（本项目成本敏感，`120 s × 4 路` 的等待成本不可接受） |
| 时钟 | `expiresAt` 若用绝对时间戳，**以 server 时钟为准**；前端**倒计时显示仅供参考**，⛔ 不得据本地时钟判业务终局 |

### 5.5 终局扇出（v1.0 新增）

**问题**：多端（§8）下，某个 `s-<n>` 被 A 设备答掉（或被 server 兜底）之后，**B 设备那张卡永远不会关**，且 B 再答一次还会撞 pending。

**定法**：反向请求一旦产生**终局**（人答 / 撤回 / 超时 / 兜底）⇒ server 向该会话**全部订阅者**下发

```
approval/decided {requestId, outcome}     // outcome ∈ 封闭词汇（C8）
```

各端收到即**关卡**。⚠️ 与 DSH 侧审计事件**同名同义** ⇒ 三侧（DSH ／ server ／ 前端）可对账。

### 5.6 前端的**唯一硬要求**（可审计）

**审批卡必须在"被保护动作真的没发生"时可观测**（C10）。⛔ 静默 fail-closed ＝ 假绿源：UI 上什么都不弹、日志里什么都不留、动作也没发生 —— 这三件事同时成立时，**看不出请求到底到没到**。

⇒ 前端须落**两个时刻**（v1.0 加固）：

| 时刻 | 何时写 | 事后能回答什么 |
|---|---|---|
| **卡已渲染** | 每次收到 `approval/request` **先落一条本地记录**，再渲染卡片 | 请求确实**到过**（区别于"根本没到"） |
| **终局** | 收到 `approval/decided`（或本端答完）时**补一笔** | "人看了没答（超时）"＝ 有渲染痕迹、**无人的动作**；"人主动拒绝"＝ **有人的动作痕迹** ⇒ 二者可区分 |

⚠️ 这条是必要的：**词汇封闭（C8）下无法靠扩展词汇区分"人拒了"与"没人看"**，只能靠这两个时刻的痕迹。

---

## 6 会话管理（三态）

| 态 | 含义 | 内存量级 | 进入条件 | 退出条件 |
|---|---|---|---|---|
| `cold` | 只有元数据（列表 / 标题 / 时间） | ≈ 0 | 默认 | `session/open` |
| `warm` | 历史已加载（供渲染），**未发 LLM** | 0（历史不驻留） | `session/open` | `session/prompt` ／ 超时回收 |
| `hot` | runtime 内活跃（B 段 DSH 侧持有） | ≈ 2.24 MB/个（实测） | `session/prompt` | 取消 / 空闲回收 |
| `unreadable`（v1.0 新增） | **会话文件存在但跨代不可读** | ≈ 0 | 读取失败且判定为格式代变更 | 人工处置（**不得**自动降级为 `cold` 空会话） |

**一期策略**：
1. **不设激进 LRU**（实测外推 20 会话 ≈ 182 MB，占 2C2G 约 9%）。
2. 真正的约束是 **token 成本不是内存** ⇒ 优化目标是**减少无谓的 context 重建**。
3. ⚠️ **`session/open` 对 `hot` 会话不得触发重建** —— 若该会话已在 runtime 内为 `hot`，open 只回状态与增量，**不得**重放历史进 context。
4. **进程关系写死**（v1.0 新增）：**单 driver 进程 = 单 dsh 子进程**，多个会话在**其内复用**（3.3-a／3.3-b 实测：一个 dsh 进程内可并存多个 session／agent）。
   ⇒ 不写死这条，`hot` 的内存账（2.24 MB/个）与 §8 的"串行化"**都没有确定基数**。
5. **跨代不可读的降级语义**（v1.0 新增）：会话格式已变过代（实测：012 期 `.dsh-home/sessions/` 是 `session.jsonl.zstd`，015 期是 `session.v3.jsonl.zstd`）⇒ 读不出时须判 `unreadable`，⛔ **不得静默当空会话**（那会把"格式不兼容"伪装成"这个会话是空的"）。
   ⚠️ **这是 §12 各期"绿"的隐藏前提** —— M1 的补帧判据、M4 的多端判据都假设"会话可读"，该假设在跨代时会被推翻。

> ⚠️ **未闭合（承上游）**：接近 100 万 token 上限时的 compaction 行为未测（实测 compaction 事件计数为 0，**不可据此断言无此机制**）。协议侧只要求能转发 `session/compaction` 事件，**不对其行为作承诺**。

---

## 7 鉴权

| 项 | 做法 |
|---|---|
| 载体 | **正常路径**：`Authorization: Bearer <token>`（unary 用此头）。**SSE 用一次性 ticket**（见下） |
| 获取 | `auth/login {deviceLabel, pairingCode}` ⇒ 长期 token。⚠️ **`pairingCode` 须补**（部署期生成、一次性 / 可轮换）—— 否则"打到这个端点就能换 token"，而 §3.3 的生产形态「loopback ＋ 反代」**对公网可见** ⇒ 等于门没锁 |
| 限速 | `auth/login` 须**限速 ＋ 失败计数**（v1.0 落到端点级；出稿只有"token 轮换 ＋ 限额作兜底"一句） |
| **SSE 凭证** | `stream/ticket`：**一次性、TTL ≤ 60 s、绑 device**；`GET /a/stream?ticket=…`。⛔ **长期 token 永不进 URL**（会进反代访问日志与浏览器历史） |
| 存储 | 前端存本地（PC 端 Tauri 安全存储 / 移动端浏览器 localStorage） |
| 多设备 | 同一账号可持多 token，**逐个可吊销** |
| TTL | **90 天 ＋ 轮换**（不是事实上的永久） —— 与 `auth/login` 返回的 `expiresAt` 口径统一 |

⛔ **Tier0 红线（本设计稿的硬边界）**：
1. **LLM key 只在云端**，绝不进前端、绝不进事件流、绝不进日志。前端**永远**看不到任何上游凭据。
2. **多用户 / 租户隔离须自做**（C5）——一期单用户，但**数据模型从一开始就带 `ownerId`**，避免二期改造。⚠️ 官方网关内置的 token→签名 cookie 只解决"是不是本机发起的"，**不解决"这是谁的数据"**。

---

## 8 多端同步

**模型**：每个设备一条 `/a/stream` 连接；server 按 **`(ownerId, sessionId)`** 把事件**扇出**给所有订阅者。

| 场景 | 语义 |
|---|---|
| 设备 A 发 prompt，设备 B 同时在看 | B 通过扇出看到同一事件流（**无独立状态**） |
| 多设备同时发 prompt | **server 侧串行化**（对齐"runtime 单会话"）⇒ 后来者**排队**（语义见 §4.4），**不并发进 DSH** |
| 设备 A 答掉一张审批卡 | server 向**全部订阅者**扇出 `approval/decided` ⇒ B 的卡**也关**（§5.5） |
| 设备加入 / 离开 | `session/subscribe` ／ `session/unsubscribe`（订阅粒度 = 会话） |
| 设备离线一段时间后回来 | 走 §9 补帧；**未结清的反向请求**按 §4.3 纪律 5 分两类处置 |

⛔ **不得让两个设备各自持一份会话状态**（那会造出"同一会话两个真相"）。**单一真相在 server**，前端是投影。

---

## 9 重连补帧

**机制**：SSE 每条事件带**单调递增 `seq`**（作用域 = 会话）。

| 情形 | 行为 |
|---|---|
| 断线重连 | 带 `since=<lastSeq>` ⇒ server **补发** `(lastSeq, now]` 的事件 |
| 补发窗口够 | 正常补齐，无感 |
| **窗口不足**（超出任一上限） | server 发 **`stream/gap`** ⇒ client 走 **`session/open` 快照重建**（**不是**重放全部历史进 LLM —— C2）；**续播基准 = 返回的 `snapshotSeq`**（§4.1） |
| 心跳 | `stream/ping`（2 s，对齐官方）⇒ client 侧 `stale` 判定阈值建议 3×心跳 |
| 长时间离线 | 与"窗口不足"同路（快照重建） |
| **会话跨代不可读** | 快照重建**也救不了**（§6-5）⇒ 判 `unreadable` ＋ 提示人工处置 |

**关键设计点**：

1. **`seq` 与"消息 id"是两件事** —— `seq` 是**信道序号**（用于补帧），消息 id 是**业务标识**。⛔ 不得混用。
2. **环形缓冲须"双上限"**（v1.0 修正）：**同时**限**条数**与**字节** —— 建议默认 **1 000 条 且 8 MB**／会话（大 delta / 长工具输出会撑爆纯条数口径）。超**任一项**即算"窗口不足" ⇒ `stream/gap`。
3. **补帧必须幂等**：client 按 `seq` 去重（同一 `seq` 收到两次不得渲染两次）。
4. **补帧的续播基准**须用 §4.1 的 `snapshotSeq`，⛔ 不得用"client 自己记的最后一条"。

---


## 10 C 段 · 本地工具反向执行

**承载**：**复用 §4.3 的反向请求层**（`tool/execute`）。这是本设计稿的一个**架构统一点** ——
「审批要人答」与「工具要 PC 执行」**在协议上是同一件事**（server 向 client 要一个结果），只是 `method` 与**幂等分级**不同。⛔ **不要为 C 段另造一套反向信道。**

| 项 | 语义 |
|---|---|
| 方向 | server → **PC client**（有本地文件 / 命令能力的那端）；移动端**不接**此类请求 |
| 请求 | `{id:'s-<n>', method:'tool/execute', params:{toolName, callId, args}}` |
| 结果 | `{id:'s-<n>', result:{ok, output 或 error}}` |
| PC 不在线 | **fail-closed** ＋ 落日志（不得静默失败、不得假装成功） |
| 超时 | 由 server 侧 pending 计时（业务侧），落 `unavailable` 语义 |
| **幂等分级** | ⛔ **非幂等** ⇒ **重连后绝不自动重发**，旧 id 判 `unavailable` ＋ 日志 ＋ 提示"需人工重发"（§4.3 纪律 5） |
| 体积 | 长输出走 `/a/blob/:ref`，**不塞事件流** |

⚠️ **与"本地副作用"的边界**：C 段工具操作的是 **PC 本机的文件 / 命令**（见 `local-env.md`），因此**只能在 PC client 上执行**；移动端即使收到同类请求也必须**拒绝并报错**（**不得试图在浏览器里模拟**）。

---

## 11 与 B 段的接线（driver）

### 11.1 driver 是什么

**driver = 3.3-b 薄客户端骨架的「语义」＋ A 段服务侧的会话管理**。

⚠️ **"复用"的准确边界（v1.0 收窄）** —— 出稿写"可整套复用"，过于宽：

| | 项 |
|---|---|
| ✅ **可复用（语义）** | `onRequest` 单挂载语义 ／ `id` 关联 ／ 清空 pending ／ `AbortSignal` 语义 ／ 双侧留痕纪律 |
| ⛔ **不可复用（类本体）** | `JsonRpcLineTransport` 是**行分帧**（以 `\n` 切帧）；A 段是**每事件一帧**（SSE `data:` ／ HTTP body）⇒ `new JsonRpcLineTransport(...)` **本体不能直接用** |

现成可复用的部分（`harness/scripts/33b-thin-client.mjs`，已实测通过）：

| 复用点 | 说明 |
|---|---|
| 自己 `spawn` dsh ＋ 自构启动参数 | ⛔ **不能复用 `HarnessClient`**（它内部只挂 `onNotification`、**无 `onRequest`**）。⚠️ 但启动形态须按 C13 收敛，见下 |
| `new JsonRpcLineTransport(child.stdout, child.stdin)` | 传输层用官方公开导出件（**B 段**用；A 段只借其语义） |
| **`onRequest` 挂载点** | **判据的落点**：DSH 出站请求在这里被接住 |
| 原始帧 tap（`data` 监听，注册**早于** transport） | 拿原始 JSON-RPC `id` 的唯一手段（3.3-b 的"迟到回答"判据靠它） |
| 出站帧留痕（包 `child.stdin.write`） | **只有这一层**抓得到 transport **自己**写的帧（如 `-32601`） |
| `AbortController` ＋ `transport.request(…, signal)` | 请求侧中止语义（C9 路 a） |
| 双侧留痕纪律 | ⛔ 单侧自述不算证据 |

⚠️ **已实测的坑（勿重踩）**：dsh 子进程**已退出后**再 `transport.request()` 会**永久挂起**（输入流已 end ⇒ 新条目无对端可答、`failPending` 也已跑过）⇒ 必须先判子进程存活。

**⛔ 启动形态（v1.0 新增，C13）**：

driver 启动 dsh 的形态 = **`dsh --profile <name>` ＋ ordered patch files**。

| 依据 | 内容 |
|---|---|
| 上游明文 | "custom plugin composition remains **a profile plus ordered patch files, not another executable or inline application tree**" |
| 上游门禁 | `verify-application-entrypoints` "rejects a Node application path that bypasses `dsh`" |
| 官方先例 | Python SDK 即此范式："the client launches `dsh --profile sdk` with an explicit Harness home"、"Python exposes profile selection and ordered patch files rather than a complete Cordis tree" |

⇒ LarryAgent 的组成建议做成 **bundle（分发物）＋ profile（启动物）**（上游口径："A bundle is what you author and distribute; a profile is what a user boots with. **Nothing is both.**"）。
⚠️ **本条的适用边界**：该禁令的语境是**上游自身仓库的准入门禁** ⇒ 它是否**硬约束第三方产品**，本版**不定性**；但向它对齐是**零成本**的（3.3-b 的路 A 装配本来就是 profile ＋ patch 层），故按 C13 执行。

**进程关系**：**单 driver 进程 = 单 dsh 子进程**（§6-4）。

### 11.2 接线契约

| # | 契约 |
|---|---|
| K1 | driver 是 A 段 `approval/request` 与 DSH 侧 `approval/request` 之间**唯一**的翻译点（§5.1） |
| K2 | ⛔ **`onRequest` 是替换语义**（C12）：**全进程只允许一处** `onRequest` 挂载。谁后装谁赢、先装者**被静默顶掉** ⇒ 必须先定挂载归属再写码 |
| K3 | 跨插件 seam **必须 `provide` 在 root ctx**（3.3-b 实测：`ctx.get` 走 strict 语义，owner fiber 非 ACTIVE 即返回 `undefined`） |
| K4 | 3.3-b 的路 A 装配（profile 补丁层 `disabled: true` ＋ `insert` relay 行）是**当前唯一走通的装配**；`insert` 只能落列表末尾 ⇒ 控层序只能重排 `dsh.profile.bundles` |
| K5 | 装载形态**依赖符号链接**（`dsh plugin add` 装的是 symlink）⇒ 插件的模块解析域不是 profile 域、而是 **harness 工作区域** ⇒ **任何非 `node:` 的 import（含我们自家包）都会在 harness 树里解析**。⇒ 插件要 import 的包，**必须登记进 `harness/package.json`**（原文只写了 `@deepseek-ai/*`，**v1.0 按实测放宽到全部非 `node:` 依赖**）。⚠️ 若将来改**实体复制**装载，本前提**须重验** |
| **K6** | **启动形态 = `dsh --profile <name>` ＋ ordered patch files**（C13）；⛔ 不得自造另一个 executable 或 inline application tree |
| **K7** | **反向请求的幂等分级必须实现**：`approval/request` 可重问（幂等）／ `tool/execute` 绝不重发（非幂等）（§4.3 纪律 5） |

### 11.3 DSH 侧上行事件 → A 段事件的映射（实现时须逐条填全）

DSH 侧上行 **19 类事件**（见 `dsh-migration.md`〈sdk 面实测能力边界〉）→ A 段 `message/delta` / `tool/state` / `session/state` 等。⚠️ **映射表须实现时逐条落实并留痕**，⛔ 不得"看到什么转发什么"（那会让前端与 DSH 版本耦合）。

⚠️ **本表是 A 段与 DSH 的「主要耦合面」**（§13）—— 上游换代时，**先核这张表**。

---

## 12 实现分期与判据

### 12.1 判据写法纪律（v1.0 新增 —— 先定纪律，再列判据）

以下六条是三方评审里**测试与取证视角**提出的**通用写法要求**，适用于 §12.2 的每一条判据：

| # | 纪律 | 为什么（依据） |
|---|---|---|
| **J-1** | **"没有" ≠ "没发生"**：任何"日志里没有 X"型判据，须**三条同时**：① **阳性对照**（同一路径在真跑时**必须**出现该痕迹，证明"该路径的日志机制在工作"）② **独立锚**（另给一条不依赖该日志的判据）③ **版本锚**（日志路径 ＋ 行类型取自哪个版本） | 本项目已实测：子串型判据测的是"存在"不是"发生"（`exit 0` ／ stdout 字节 ／ 通知条数 ／ 旧 boot 探针**全都不可分态**）。**"日志里没有"也可能是"该变体根本不写日志"** |
| **J-2** | **期望值必须双侧独立**：服务端落一张 `(seq, 事件类型)` 表 ＋ 客户端落一张收帧表，**两处交叉**。⛔ 不得用"同一条流自报"的期望值 | 单侧自述不算证据（本项目既有纪律） |
| **J-3** | **每条判据注明「通道四元组」**：工具通道 ／ 运行时 ／ 身份 ／ 文件系统 | **同一行代码在不同通道下语义可以相反**（实测：`chmodSync(dir, 0o500)` 在 Windows 上落成 `0o444`、写入照常成功，在 Linux 上 `EACCES`；**装置自身不报错**） |
| **J-4** | **"动作 0 次"必须从被保护对象取证**，⛔ 不从链路取证 | "我没收到请求"／"我回了 error" **都不等于**"动作没发生" |
| **J-5** | **触发装置写在判据旁**（否则无法复跑） | — |
| **J-6** | **"红灯"必须能追溯到成因**；⛔ **"成因未知"是可接受的结论** | 别为叙事完整性编一个成因 |

⚠️ **一条推论（必须写进判据）**：§5.4 的 (b)(c)(d) 三路**同词**（`unavailable`）⇒ "落对词汇"这条判据对它们**没有区分力** ⇒ **必须补"触发原因的独立痕迹"**（J-1 ／ J-5）。

### 12.2 分期表

| 期 | 内容 | 判据（可验） |
|---|---|---|
| **M1** | 会话基础面：`auth/login` ＋ `session/list` ／ `open` ／ `prompt` ＋ `/a/stream` ＋ 补帧 | ① **「打开看看」不触发 LLM**（C2）：**主判据** = token 账 ／ 上游调用计数；**辅判据** = 会话日志无 `turn/start`；**阳性对照** = 同一会话**真发一次 prompt** 时**必须出现** `turn/start`；**版本锚** = 日志路径与行类型取自哪个版本（J-1）<br>② **断线重连后无缺无重**：双侧独立计数交叉（J-2）；**断线造法写死一种**并注明平台（PC Tauri ／ 移动浏览器语义不同）；补一条**"链路确实是活的"锚**（否则"没收到事件"与"没连上"不可分）<br>③ driver 能起 dsh 并完成一次往返（含**"能自己退出"**）<br>④ **鉴权侧**：所有查询 / 落盘都带 `ownerId` 过滤（**表结构 ＋ 至少一处查询**举证）<br>⑤ 每条判据注明**通道四元组**（J-3） |
| **M2** | **审批中继**：§4.3 反向请求层 ＋ 前端审批卡 | ① 端到端"弹卡 → 人答 → 决策生效"（PC 侧真弹）<br>② **五路**各一组实测（请求侧中止 ／ 答者侧超时 ／ 前端不答 ／ 对端消失 ／ **人主动放弃**），**逐条落对词汇**（§5.4）；⚠️ 因 (b)(c)(d) 同词，**每路须附"触发原因的独立痕迹"**（谁超时 ／ 谁消失）＋ **触发装置**（J-1 ／ J-5）<br>③ **取消传播 ／ 迟到回答**（3.3-b J5 的对应物）：请求侧撤回 ⇒ 出站请求 abort ＋ **pending 无泄漏** ＋ **迟到回答被丢弃** ＋ 结果不变<br>④ **负向对照**：不装答者 ⇒ `unavailable` ＋ **动作 0 次**（**从被保护对象取证**，J-4）<br>⑤ 超时判据用**短路值**（如 2 s）验机制 |
| **M3** | C 段反向工具执行（§10） | ① PC 侧真执行本地文件操作并回传<br>② PC 不在线 ⇒ fail-closed ＋ 日志 ＋ **目标文件真的没被创建**（**产物清单为空**才算"零落盘"，J-4）<br>③ 移动端收到同类请求**拒绝**而非模拟<br>④ **重连后 `tool/execute` 不自动重发**（幂等分级，K7） |
| **M4** | 多端同步与排队打磨（§8 ／ §4.4） | ① 两设备同看一会话，事件一致（双侧独立计数，J-2）<br>② 并发 prompt **串行化**，**不并进 DSH**<br>③ **排队语义**：受理即给 `messageId` ／ 队列位置可见 ／ 可撤回自己那一条<br>④ **终局扇出**：A 设备答掉 ⇒ B 设备的卡**也关**（§5.5） |

⛔ **每期收尾须清临时 home，且装置须先自检** —— 见 §12.3。

### 12.3 装置纪律（临时 home 与副本可用性）

**成本账**：3.3-b 的 runner 每次运行在系统 TEMP 下 `cp -r` 一份 sdk profile **真副本**（≈330 MB ／ 4.35 万文件）并保留供复核 ⇒ 累计 **≈10.2 GB**。本段实现沿用同一装置 ⇒ **同类成本会重演**。

**组合动作（三条同时，合成一条纪律）**：

| # | 动作 | 为什么 |
|---|---|---|
| ① | **装置启动前校验副本可用性** | ⚠️ `cp -r` 的 profile 真副本会带**源绝对 `virtualStoreDir`** ⇒ `plugin add` 的 pnpm **拒跑** ⇒ 表现为"**装置起不来**"，**极易被误判成"被测对象故障"**（本项目已实测过同款）。**这条比空间问题更该先治** |
| ② | **收尾显式清理** | 加显式开关（如 `KEEP_HOME=0` 才删，**默认保留** —— 复核要用），并在 runner 收尾**打印 home 路径与体积** |
| ③ | 评估"共享基准 ＋ 增量覆盖" | ⚠️ **未验** —— 不敢先承诺收益；先记账，后评估 |

---

## 13 协议版本与维护（v1.0 新增）

**立论**：本协议是一份**永久自持**的协议 —— 上游 GitHub Issues 对公众关闭、PR 功能关闭（内部走私有 org 镜像）⇒ **我们这份 A 段协议上游看不到、也不会吸收**；而 A 段存在的全部理由，就是"官方白送的那部分（会话树 / 分叉 / 取消 / 分页 / 重连追赶 / gap 修复 / 心跳）必须自做"。

⇒ 一份自持协议需要它**自己的**维护条款：

| 项 | 定法 |
|---|---|
| **协议版本** | 本协议持**独立版本号**（当前 `v1.0`），与 DSH 版本**解耦**；DSH 换代**不自动**升本协议版本 |
| **主要耦合面** | **§11.3 的 19 类上行事件映射表** ＋ §3.3 端点与帧形状。上游事件集变化时，**先核这两处** |
| **变更分级** | **破坏性**（帧形状 / 封闭词汇 / 端点）⇒ 升**大**版本 ＋ **双栈过渡窗口**；**增量**（新增 method / 事件）⇒ 升**小**版本，且**老客户端须能忽略未知 method**（收到未知上行事件**不得崩**） |
| **责任图** | 上游换代时做三段判定：**适配**（只改 §11.3 映射表）／**破坏**（升大版本 ＋ 迁移）／**无关**（不动）。⚠️ 没有这张图，下次换代没人分得清"适配"与"破坏" |
| **本文的维护触发** | 下列任一发生即须回看本稿：① 上游 DSH 换代（`0.1.x → 0.2`）；② §14-7 的 Gateway 重测出结论；③ 封闭词汇（C8）变更 |

---

## 14 诚实边界（本稿未验项）

1. **本文是设计稿，无任何运行时验证** —— 所有"须 / 建议"级判定均**未经跑**。
2. **D1 ／ D2 已定案，但非老大裁决**（§0.1 依三方一致意见收敛）。⚠️ 若改判，§3.2（帧形状）／§3.3（端点表）／§4.3（纪律 4 与 5）／§9（补帧基准）／§12（M1② / M2②）须**整体重写**。
3. **POSIX 分支未验**（3.3-b 的结论取自 `node v24.14.1` ＋ 本机 Windows）。
4. **"实体复制装载"下的解析未验**（承 3.3-b 边界）。
5. **官方包的具体接口形状未逐条复核** —— 本稿只引用已实测部分（`/api` 挂载点、browser 半 = fetch/SSE、401 鉴权、`dsh-client-*` 包可 `pnpm add`）。⚠️ 其中包数 **51** 系本版实测（`ref/dsh-bare` @ `dsh-v0.1.5-rc.2`，2026-09-22），**须带时点引用**（`dsh-migration.md` 按其 09-09 时点记 **41**）。
6. **上云部署形态未详设**（C7 只给了约束与"反代可行"的实测，**未出部署图**）。
7. ⚠️ **上游依据待重测（v1.0 新增・等级最高）**：§1-2 的「Gateway 在当前版本不成立」。本版复核结果：**原观察面成立**（npm `latest` 确实停在 `0.0.1-rc.1`），**但同包存在 `0.1.5-rc.2`** 且 `next` dist-tag 指向它；`packages/api/gateway` 与 `packages/typert/{protocol,loader,registry,generator}` 在 `dsh-v0.1.5-rc.2` 源码树里**都存在且同代**，其 deps 为 `dsh-typert-protocol`（**不含**原记录的 `dsh-type-meta`）。
   ⇒ **若原实测是在"未钉版本"的装置上做的，则"不可启用"可能是装置产物而非上游事实**。⚠️ **须在钉死 `0.1.5-rc.2` 的装置上重测一次**（含否定结论也要留痕）。
   ⇒ **影响面**：若 Gateway 在钉版本下**可用**，则 §1-2（"官方白送的那部分必须自做"）与 §12 的工作量**都会变** ⇒ 这是本稿**最重的一条待复核项**。
   ⚠️ 本条**不阻塞实现**：即使 Gateway 可用，A 段协议（前端 ↔ 自做服务）的形状**不变**；变的是**服务侧要自做多少**。
   ⭐ **2026-09-22 WB 装配层实测（新增）**：在 `.dsh-home/profiles/sdk`（`0.1.5-rc.2`）上跑 `dsh --profile sdk --dump-config`（**零副作用** —— 组合出配置树即退出、**不激活插件**）⇒ 合并树里 `# == @deepseek-ai/dsh-base` 层**有** `- id: typert-gateway` ／ `name: '@deepseek-ai/dsh-api-gateway'`，**未标 `disabled`**（同层对照：`hmr` 行标了 `disabled: true`）；该包本体**已装在** `profiles/sdk/node_modules/@deepseek-ai/dsh-api-gateway`（版本 `0.1.5-rc.2`）；npm `dist-tags` = `latest: 0.0.1-rc.1` ／ **`next: 0.1.5-rc.2`** ／ `alpha: 0.1.6-alpha.2`。
   ⇒ **装配层结论：本稿 §1-2 的「Gateway 在当前版本不成立」不成立** —— 它随 `dsh-base` **默认装配**、包本体就在同代版本里，**不需要额外启用动作**。
   ⛔ **但运行时层仍未验** —— 原结论（`/api/remote.mux` 带 cookie 仍 404、无法独立起 HTTP）出自**运行时通道**；本轮采的是**静态装配通道** ⇒ **两通道并列留痕、不合并**（`dsh-migration.md`〈B 段 Gateway 路线实测判定〉**不因本轮而失效**）。
   ⇒ **待验范围已收窄为一句**：在钉死 `0.1.5-rc.2` 的装置上，`typert-gateway` **运行时**是否真的挂上路由 ／ 起 HTTP。该项已作为 `DSH-3.8.1`（driver 成型）的顺带判据 **J6**（见 `exchange/log-trae.md`）。
8. ⚠️ **跨设备时钟未验（v1.0 新增）**：本协议有三处依赖时间 —— `expiresAt`（§5.3）／ 心跳 `stale` 阈值 3×（§9）／ pending 超时（§5.4）。多设备下**时钟偏移**会产生一类**只能观测、不能复现**的现象（前端倒计时显示"还剩 10 s"而 server 已判超时）。⇒ 协议侧的纪律已定（⛔ 不得据本地时钟判业务终局，§5.4），但**现象本身未验**。
9. ⚠️ **通道维度未验（v1.0 新增）**：本协议横跨 **PC（Tauri）／ 移动浏览器／ 云端**三类执行环境，而**同一段代码在不同通道下语义可以相反**（已在 `chmodSync` 一例上实测）⇒ ⛔ **不得把"本机绿"写成"协议成立"**（生产 = Linux ＋ 反代 ＋ 跨网络，与开发机不同）。
10. ⚠️ **浏览器行为未实测（v1.0 新增）**：`EventSource` 的头限制、HTTP/1.1 同域连接数、iOS 后台冻结 SSE —— 属**公共常识级判断，未在本机实测**；实现前应**各留一次实跑**。

---

## 15 参考件（按「派发四要素」列）

> 规矩见 `dsh-migration.md` §3.6。⚠️ 本表除**参考件 1** 与 §1-3 的包数系本版复核外，**其余未复跑**，借鉴点一律 **🟡**；抄进产品仍走 §3.0（fork → 本仓库 → review / 测试）。

| # | 件 | ① 路径 | ② 怎么参考 | ③ 参考程度 | ④ 哪部分不可参考 |
|---|---|---|---|---|---|
| 1 | `dsh-client-connection` | `ref/dsh-bare/` @ `dsh-v0.1.5-rc.2` ＋ npm | 读 node half（gateway 挂 `/api` 的接法）＋ browser half（fetch / SSE 客户端）＋ 代际生命周期 ＋ **浏览器端 fixture** | ⭐ **可直接复用其非 React 核心**（本版复核：deps = `dsh-credentials` ／ `schemastery` ／ `zod`，peer = `cordis`，**无 React**） | ⛔ 其余 **React 半边不复用**；⛔ 它的 gateway 后端在本项目**不可达**（`/api/remote.mux` 实测 404） |
| 2 | `dsh-client-store` ／ `ui-slots` ／ `resources` ／ `modules` ／ `file-upload` ／ `hmr` ／ `ui-reference`（**新增**） | 同上 | 读状态层 / 插槽纯核心 / 资源模型 / 模块系统 / 上传 / 热重载 / 引用源 | **可按需复用**（本版复核：运行时 `dependencies` 里均**无 React**；`ui-slots` 仅 devDeps 里有 `@types/react` 类型包） | ⛔ 若其 peer 要求 `cordis` 生态件，须先满足 K5 |
| 3 | `dsh-api-remotes` | 同上 | 读其 `ctx.remote` 约定的 **Client face**（原话："任何不依赖 React 的 `ctx.remote` 约定均可复用其 Client face"） | **只借鉴设计**（面向对象化的 client face 组织方式） | ⛔ 不依赖 React；⛔ 与锁定基线 `0.1.5-rc.2` 不符处不照抄 |
| 4 | `dsh-api-gateway` ＋ `dsh-typert-*`（4 件） | 同上 | 读会话全生命周期 / 历史分页 / 事件流 / 快照流 / **重连追赶 ＋ gap 修复 ＋ 2s 心跳** 的设计 | **只借鉴设计**（这正是 A 段要自做的那部分 ⇒ 设计参考价值最高） | ⛔ **不可启用** —— ⚠️ **但本版复核后此结论「待重测」**（见 §14-7）：rc.2 源码树里 `packages/api/gateway` 与 `packages/typert/*` **均为 `0.1.5-rc.2` 且存在**；原记录的 `dsh-type-meta` 未在 rc.2 现身 |
| 5 | **官方 Electron 桌面端**（`apps/desktop` ＋ Desktop Host）（**新增**） | 同上 | 读其 **Unary RPC ＋ Remote streams 走 framed byte pipes**、**"opens no Web server or loopback port"** 的形态；以及"占一个**保留 profile** ＋ 绑定一个**精确 dsh 版本** ＋ 自带第一方离线 seed"的装配 | **只借鉴设计**（与本项目 A 段**同题**，尤其 PC 端；是"官方自己也这么干"的先例） | ⛔ 它的承载是 **Node IPC byte pipes**，与我们的 HTTP/SSE 不同；⛔ 不照抄其保留 profile 策略 |
| 6 | `dsh-sdk-protocol` | `harness` 依赖树（**须先补进 `harness/package.json`**，见 K5） | 读 `JsonRpcLineTransport` 的帧分类 / `onRequest` / `request(signal)` 语义 | **语义可复用**（3.3-b 已实测通过） | ⛔ **类本体不可直接用**（行分帧 vs 每事件一帧，见 §11.1） |
| 7 | `litestartup-com/dsh-api-gateway` | 社区，**未落位** ⇒ 按需 `git -c http.proxy= -c https.proxy= clone --depth 1` | 读其 REST ＋ SSE 暴露运行中会话 ＋ **API-key 鉴权** | **只借鉴设计**（与自做 driver 同题） | ⛔ 只读参考、不纳入依赖（§3.0） |
| 8 | `Jiachi5533/dsh-remote-gateway` | 同上 | 读其 **source-filtered** HTTP/SSE/WS 网关 | **只借鉴设计** | 同上 |
| 9 | `PerryLink__dsh-reach` 的 `client/` 半边 | ✅ **已落位** `ref/community/PerryLink__dsh-reach/` | 读 `src/bridge.ts`（deferred answerer ＋ `cardTimeoutSec`）＋ `client/`（`dsh.client.inject` 声明） | **只借鉴设计**（审批卡的超时 / 卸载语义有现成参照） | ⛔ 不 fork；其 IM 适配器与本产品形态无关 |

**社会名录索引**：`ref/awesome-dsh-plugin.md` 的 `Remote & Mobile` 分类 —— ⚠️ **行号是快照位置，会漂移**（实测 13 天增 25%），检索请用**分类名**。

---

## 16 本文的下一步（不存放待办 —— 待办在 `TODO.md`）

- ✅ **D1 ／ D2 已定案** ⇒ 本文为 **v1.0 定稿**。
- **实现派发**：`TODO.md`「DSH-3.8」项转已定稿，并生出**派发稿**（承接人 **Trae**）。
- ⚠️ **两条待复核（不阻塞实现，但须在 M1 前有结论）**：§14-7（Gateway 可启用性重测，**等级最高**）、§14-8/9/10（时钟 ／ 通道 ／ 浏览器行为）。
- ⚠️ **产品定位联动**：审批流跨越 A/B 段边界 ⇒「PC 侧弹框审批」这一产品能力取决于本协议何时落地。**本版已具备讨论条件**：`product-positioning.md` 全文**无"弹框 / 弹卡"字样** ⇒ 这是一次**能力树新增**（不是改写）。**拟落在哪一条（`2.7.2` 边界透明 vs 新开子项）待老大定** —— ⛔ 本条**不在本稿决定**（属产品文档层）。

---

**版本**：v1.0 · 2026-09-22 定稿 · 融三方评审（Trae ／ Claude ／ Qoder）· 含评审附录的存档版本 = git `074a894`
