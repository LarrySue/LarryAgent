# Trae 协作区

> **属主 = 沈知砚(Trae)**,本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **dev 上锁 ＋ 配发钥匙**（`server.api_key` 甲案） | Trae | 本机 Windows | 🆕 **待起跑**（WB 2026-10-29 派发，见下方〈📮 派发 · dev 上锁 ＋ 配发钥匙〉） | 2026-10-29 |
| — | — | — | **当前无在飞块**（2026-10-28：DSH-3.10 已归档 → `archive/roadmap-history.md`「2026-10-20 办结」；适配判断／剪枝复检已随 `docs/la-space/` 定稿承接，原段按活日志规矩清理；**硬件分项账已承接 → `local-env.md` §14 ＋ `production-env.md` §2.5，原段同日清除**）。⚠️ **唯一活账＝〈📥 过程观察 · DS 通道复测〉末两条待处置** | — |

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

## 📮 派发 · dev 上锁 ＋ 配发钥匙（`server.api_key` 甲案）（WB · 2026-10-29）

> 老大 2026-10-29 10:55 拍板：**今天上锁 ＋ 配发钥匙**（甲案）；token 机制升级另记 `HUMAN`，**不在本块**。
> 本稿只覆盖 **dev 环境**。⛔ 不覆盖产线（Tauri 打包产物里 key 会是明文，产线必须走「设置页 ＋ 运行期注入」，属另一块）。

### 0 · 目标

把 dev 环境从「**`/api/` 谁都不查**」变成「**必须出示 `Authorization: Bearer <key>`**」，同时让两个客户端自动带证件。

⚠️ **两个容易被混成一件的结论，本块只做前者**：

| # | 结论 | 本块 |
|---|---|---|
| ① | 「客户端代码会带 Bearer header」 | ✅ 本块做（代码层） |
| ② | 「后端已经上锁」 | ❌ **不是本块结论** —— 老大填 `server.api_key` 后才成立 |

⇒ 本块交付完成时，正确的说法是「**钥匙配发通道已就绪，锁待老大扣上**」，⛔ 不得写成「鉴权已启用」。

### 1 · 判据（逐条可复跑）

**J1 · 后端两态（用临时实例，⛔ 不碰真 `backend/config.yaml`）**

```
临时 yaml 只写 server 段，`api_key` 填一个自定的测试串（自己起名，⛔ 不是真 key）
LARRY_CONFIG=<临时yaml> uvicorn main:app --port 8001   （cwd = backend/）
```
| 动作 | 期望 |
|---|---|
| `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8001/api/roles`（无 header） | **401** |
| 同上 ＋ `-H "Authorization: Bearer <TESTKEY>"` | **200** |
| 同上但 header 值错误 | **401** |
| 401 的响应体 | `{"error": ..., "detail": ...}` 两字段 |

⚠️ `Bearer` 后**必须有一个空格**（`auth.py:59` 按 `len("Bearer ")` 切片）；大小写敏感。

**J2 · `/health` 不受 key 影响（缺这条即未闭合）**

- 同一临时实例，`GET /health` **不带任何 header** → 期望 **200** 且 body 含 `version` 字段。
- **为什么这条最要紧**：Tauri 壳启动时会轮询 `/health` 判断后端是否起来（`client/src-tauri/src/main.rs:143` 的 `health_get()`，签名校验要求 `version` 存在）。若 `/health` 被 401，**整个 PC 客户端会在健康检查处超时**，症状是"客户端打不开"，且**不会**指向鉴权。
- 依据：`auth.py:44` 只拦 `path.startswith("/api/")` ⇒ `/health` 天然透传。WB 已读码确认，但**你仍须自己实测一次**（判据不采信他方读码）。

**J3 · 客户端带证（单测，硬证据）**

- 用 `vitest` mock `fetch`，断言：
  - `api.ts` **全部导出函数**（15 处 `await fetch(` ＋ `streamChat`）发出的请求头含 `Authorization: Bearer <注入值>`；
  - `VITE_API_KEY` **为空时**，请求头**不含** `Authorization`（退化行为：未设 key 时不得发无用头）。
- ⛔ 判据要求覆盖**全量**，不接受"抽样三处代表"。

**J4 · SSE 流式行为不变（回归）**

- `streamChat` 仍逐块 `yield`，**不得**被整包缓冲。
- 优先跑现有单测；若现无覆盖，可用临时实例实跑 `/api/chat` 观察分块。
- ⚠️ 临时 yaml 无 `models` 段 ⇒ 真 LLM 调用起不来。**若因此拿不到流，可退为「代码审查 ＋ 保留原 `headers` 结构」**，但**必须在回报里如实标「未跑」**，⛔ 不得写成"已验证"。

**J5 · `chat.html` —— ⛔ 不改造，只验「预期退场」**

- ⛔ **本块不碰 `client/chat.html`。** 老大 2026-10-29 定原则：**前端只许一个出口，不管套不套壳、套几层，对外是一个整体**。
- 事实：`client/chat.html`（391 行，`<title>LarryAgent - Test Chat</title>`）是**第二套 UI ＋ 第二套 `fetch` ＋ 第二套 SSE 解析**（`consumeSSEStream`／`parseSSE` 与 `api.ts` 内实现各一份），而功能已被 SPA 完全覆盖（`ChatView.vue` ／ `ChatInput.vue` ／ `MessageList.vue` ／ `ToolCallCard.vue` ／ `ModelSelector.vue` ／ `RoleSelector.vue`）⇒ 它是**重复出口，处置方式是退场，不是配钥匙**。
- 判据：改完 ＋ 老大填 key 之后，打开 `http://127.0.0.1:8000/chat.html` → **401**。这是**预期结果，⛔ 不是缺陷**（临时调试页随鉴权自然退场）。
- ⛔ 禁止"为了让它还能用"而给它加 header ／ 加输入框 ／ 由后端注入 key —— 那是把重复出口焊死。
- **退役动作另立**（登记在 `TODO.md`），⛔ 不在本块、⛔ 本块不删它。

**J6 · 真实链路（WB 做，⛔ 不在你的交付范围）**

- 老大填真 key 后，WB 从 `client/.env.local` 读值（**不回显**）用 `curl` 验 401／200 两态，并核 `chat.html` 与 SPA 真机可用。
- 本节仅作闭环登记，你无需执行。

### 2 · 判据前置（不满足则实验根本没跑起来）

- **P1** `/health` 不被拦 —— 见 J2。WB 读码判为成立，你须自证。
- **P2** `client/.env.local` **已被 gitignore** —— WB 实测：`git check-ignore -v client/.env.local` 命中 `.gitignore:14:*.env.local`。⚠️ 这条是凭据纪律的物理保证，**若你的实测结论不同，立即停手回报**。
- **P3** 项目已有 vitest（`client/package.json` 的 `test:unit`）。
- **P4 · 不通过走哪条路**：
  - J2 红（`/health` 也被拦）⇒ **立即停手回报**，⛔ **不得自行放宽 `auth.py` 的拦截范围** —— 那是在改安全边界，须 WB 重新定。
  - `.env.local` 未被忽略 ⇒ **停手回报**，⛔ 不得改为「先写进去再说」。

### 3 · 交付物

| 类型 | 路径 | 说明 |
|---|---|---|
| 改 | `client/src/api.ts` | 15 处 `await fetch(` ＋ `streamChat` 统一带 header |
| 改 | `client/src/env.d.ts` | 声明 `ImportMetaEnv.VITE_API_KEY`（`build` 会跑 `vue-tsc --noEmit`，类型必须过） |
| 新增 | `client/.env.example` | **只放占位** `VITE_API_KEY=`（可进 git，⛔ 无真值） |
| 新增 | 单测文件（路径自定） | 须能被 `npm run test:unit` 拾到 |

**⛔ 不得改**：`backend/config.yaml`（老大填）、`backend/middleware/auth.py`（安全边界，归 WB 重定）、`client/.env.local`（老大填）。

### 4 · 参考件四要素

1. **路径**：`backend/middleware/auth.py`（全文 65 行）
   - 怎么参考：读 `_do_dispatch`（`:42-64`）作为**判据唯一权威**
   - 参考程度：**可抄形状**
   - ⛔ 不可参考：不要改它
2. **路径**：`exchange/deployment-architecture.md` §4.2（`:107-115`）＋ §五 表鉴权行（`:139`）
   - 怎么参考：读「两路注入」设计
   - 参考程度：**只借设计**
   - ⛔ 不可参考：§4.2 的「**运行期覆盖／设置页**」本块**不做**；§4.2 提到的 `API_BASE` 改绝对路径**也不做**
3. **`client/src/api.ts` 现状**：15 处 `fetch` 各自只带 `Content-Type`，无任何鉴权头 —— 这是要被替换的现状，不是你写坏的。

### 5 · 场地与器材

- **构建链**：`client` = Vite ＋ Vue3 ＋ TS。`npm run build` = `vue-tsc --noEmit && vite build` ⇒ **类型不通过就构建失败**。
- **node 版本以你通道实测为准**；对不上先报差异再动手（同机不同通道会读到不同版本，别当成工程坏了）。
- **后端启动**：`cd backend && uvicorn main:app --port 8001`（用 8001 避开 dev 占用的 8000）。
- **临时 yaml**：**只写 `server:` 段**，其余走 dataclass 默认值（`config.py:168` 起）。`database.path` 相对**配置文件所在目录**解析（`config.py:150-152`）⇒ 放临时目录即天然隔离。
  - ⛔ 临时 yaml、临时库**都别建在 `backend/` 下**，会污染真实库。
  - ⛔ 临时 yaml **不要复制真 `config.yaml`**（里面有真 LLM key，复制＝把凭据摊到未保护的位置）。
- **`VITE_API_KEY` 注入方式**：跑测试时用**环境变量注入**（`VITE_API_KEY=<TESTKEY> npm run test:unit`），⛔ **不要新建 `client/.env.local`** —— 那个文件归老大填，你建了之后会被他覆盖，双方都以为是对方写的。
- **已知假绿坑**：临时实例返回 200 未必说明鉴权通过 —— 必须**同时**验「无 header → 401」，只验 200 等于没验（key 为空时也是 200）。

### 6 · 回报格式

- 结论先行 → J1–J5 逐条**读数 ＋ 命令原文** → 未闭合单列 → **自曝**（跑歪／判据要订正／发现矛盾，直接写；「成因未知」是可接受的结论，⛔ 别为叙事完整编一个）。
- ⛔ **不得回显任何 key 值**（`<TESTKEY>` 之外的都不许出现在回报里）；只报"已注入／长度／是否含空格"。
- ⛔ 不得手工改写／意译工具输出；注明每条证据取自哪条通道。

### 7 · 禁区

- ⛔ 不改 `backend/config.yaml`、`auth.py`、`client/.env.local`、**`client/chat.html`**（重复出口，处置权在老大，⛔ 本块不碰）
- ⛔ 不动 `API_BASE = "/api"` 的相对路径（改它是产线设置页的活）
- ⛔ 不把 key 值写进任何受版本控制的文件、注释、日志、测试夹具
- ⛔ 不升级依赖树、不引入新包（`axios` / `reqwest` 之类一律不加）
- ⛔ 不做设置页、不做 Tauri 打包改动、不做 prod profile
- ⛔ 不顺手修与本块无关的代码（看到了就**写进回报**，别动手）


## 📥 过程观察 · DS 通道复测 ＋ `reasoning_content` 回传缺口（Trae · 2026-10-28）

> 触发：老大 2026-10-28 晚（庆阳落脚后）要求「多次调用各种工具后生成一段文字」，观察一轮对话内多次调用模型 API 是否正常。本节只记事实，处置待主持。

### 一、通道复测（🟢 本机 · Trae 客户端 · 2026-10-28 20:07–20:30）

一轮对话内**跨 5 类工具、共 10 次调用**，全部返回正常：

| 工具 | 次数 | 结果 |
|---|---|---|
| `Glob`（`exchange/*.md` ／ 成长日记 ／ 留言板） | 3 | 命中数正常，无超时 |
| `LS`（仓库根） | 1 | 全树列出 |
| `Read`（`log-trae.md` ／ 日记 ／ 留言板 ／ `chat_service.py`） | 3 | 内容完整，无截断 |
| `Grep`（`reasoning_content` ／ `chat_service.py` 关键形态） | 2 | 见下 |
| `GetDiagnostics` | 1 | `[]` |
| `RunCommand`（`Write-Output` 心跳） | 3 | exit 0 |

**含一次自愈**：首轮把终端工具名写成 `Shell`（正确名 `RunCommand`），系统返回 `Tool's name Shell is not available in given tool list`，非通道故障；下一轮改正后正常。全程**零 4028、零超时、零中断**。

⚠️ 口径边界：以上证明的是「**Trae 客户端本轮多轮工具调用正常**」，⛔ 未证明 10-26 那批 4028 的根因已消除——样本不同、宿主不同。

### 二、`reasoning_content` 回传缺口（事实层 🟢 ／ 因果层 🟡）

1. **全仓 grep `reasoning_content`：17 命中**，分布仅两处：
   - `archive/qoder-work-historical-record.md`（15 处，Qoder 历史存档里的报文样例，形如 `{"choices":[{"delta":{"role":"assistant","content":null,"reasoning_content":""}}]}`）
   - `.workbuddy/memory/2026-10-20.md:9`（苏苏 10-20 记录，**只读引用，未改动他人文件**）
   - **`backend/` 零命中。**
2. **消息组装处实测**：`backend/services/chat_service.py`〈工具循环〉段，assistant 消息仅 `role` ／ `content` ／ `tool_calls` 三个字段，**无 `reasoning_content`**。
   - 复跑：`grep -n "reasoning_content" backend/` ⇒ 期望零命中；`grep -n "assistant_msg" backend/services/chat_service.py` 定位组装点。
3. **推论（🟡 未证）**：若 provider 在思考模式下要求历史 assistant 消息回带 `reasoning_content`，本后端在工具循环中不会回带 ⇒ 与服务端 4028 报错的语义方向一致。
4. **交叉印证**：苏苏 10-20 记为「全后端 grep `reasoning_content|reasoning|thinking` 零命中 ⇒ provider 即使返回也被丢掉」——同一缺口当时从**流式解析侧**发现，今日从**消息回传侧**确认。两处指向同一处缺失。
5. **⚠️ 归属边界**：以下**不能串成一条因果**——(a) LarryAgent 后端（本仓 `chat_service.py`）；(b) 老大 10-26 遇到的 Trae 客户端调 DS 崩溃。两侧报错形态相似不等于同源，需各自取证。

### 三、待处置（未动代码）

- [ ] 是否将本节第 2 条提为待办（工具循环回传 `reasoning_content`）
- [ ] 若提，需先定「回传空串 ／ 回传原值 ／ 不落库只回传」三选一，并确认与 `db/conversations.py` 落库结构的关系


## 已清理段落（按交流区规矩）

- **2026-10-28（WB）**：三轮清扫，删 5 段（DSH-3.10 派发／回报／复验、补调研接单＋适配判断、剪枝复检派发／回报）＋〈评估 · 当前方案的硬件需求〉**62 行**；判据 ＝ `157 MB`／`109–168 MB`／`1.2–1.8 GB`／`7–8 GB`／48 GB 换代／单盘边界逐项在档（承接落 `local-env.md` §14 ＋ `production-env.md` §2.1／§2.5、`archive/roadmap-history.md`，提交 `334d7ef`）。保留：〈📥 过程观察 · DS 通道复测〉（活，含两条待处置）＋ 通用纪律 9 条 ＋ 两条活账。回溯 `git log -p -- exchange/log-trae.md`。
