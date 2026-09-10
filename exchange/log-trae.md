# Trae 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---

## 📌 当前派发（2026-09-10 · DSH-2.5 ③-修复：Windows 沙箱拒绝方言缺口）— 待接

> **回复位置**：报告写在本节下方，标题用 `## Trae 报告 · DSH-2.5 ③-修复 <日期>`。**不要覆盖本节派发内容**。
> **老大 2026-09-10 裁决**：该缺口由你修；④ 已勾掉。**①②⑤ 你此前已交付并通过 WB 复验，本次与前次无交集。**

### 背景（WB 已替你做完定位，直接用）

DSH-2.5 五项退出条件**已全部达成**（④ 老大今日勾掉）。但复验 ③ 时挖出一个**真实的护栏缺陷**：**Windows 沙箱拦得住，却把"拦住"这件事告诉不了模型。**

**根**（🟢 源码 `packages/sandbox/sandbox-local/src/index.ts:205-213`，tag `dsh-v0.1.2-rc.1`）：

```js
const DENIAL_SIGNATURES = {
  bwrap:    ['read-only file system'],
  landlock: ['permission denied'],
  seatbelt: ['operation not permitted'],
  // pwsh/.NET: "Access to the path '...' is denied."; cmd: "Access is denied.";
  // node EACCES: "permission denied".
  'windows-acl': ['access is denied', 'access to the path', 'permission denied'],
  runnerCommand: ['read-only file system', 'permission denied'],
}
```

> ⚠️ **关键认知**：`denialSignatures` 由 **provider `sandbox-local`** 组装，**不是**后端 `sandbox-windows-acl`（后者 `lib/` 里一个相关字符串都没有）。**别去改后端，改错地方会白做。**

**缺口分两层，第 ② 层更硬：**

| 层 | 现象 | 是否跨语言 |
|---|---|---|
| ① 本地化层 | 中文 Windows：cmd 输出 `拒绝访问。`、powershell 输出 `对路径"…"的访问被拒绝。` → 英文签名命中不了 | ❌ 仅非英文系统 |
| ② **错误码类别层** | **node 写失败报 `EPERM: operation not permitted`，而签名备的是 `permission denied`（那是 EACCES 的文案，源码注释就是这么写的）** | ✅ **英文 Windows 同样不命中，与语言无关** |

**② 优先级高于 ①** —— 不要把它整体当成"中文 Windows 本地化问题"处理掉。

**后果**（读了消费方代码）：`denied=false` → 模型只当普通命令失败，**既看不到 `[sandbox: file access denied]` 标记，也拿不到升权提示**，只能自己瞎猜。

完整事实见 **`docs/dsh/dsh-local-env.md` §4**（唯一真相源）。

---

### Step 0（跑之前先做，别浪费时间排查）—— 环境前置

⚠️ **每次运行 `dsh` 都会留下 profile 启动锁**（`$DSH_HOME/profiles/node_modules.lock`，**连 `--dump-config` 也留**），且**孤儿锁永不自动回收**。表现是 `initialize timed out` / `JSON-RPC input closed`——**极易误判成 profile 启动慢或网络问题**，我本轮连撞三次才确认。

→ **每次实跑前先删 `node_modules.lock`**。详见 `docs/dsh/dsh-local-env.md` §1。

### Step 1（必做，先别动手改）—— 判定改装点

这是本次唯一的**架构判断题**，先给我结论再动手：

- provider 的 `DENIAL_SIGNATURES` 是**硬编码常量**。请查明：
  1. 它**有没有配置注入点**（cordis patch / config 能否覆盖 provider 的签名列表）？
  2. 若改不了上游，我们**自己的消费层**在哪里接管 `denied` 判定？（`pwsh-sandbox` / `bash-sandbox` 工具层用 `matchesSignature(...)` 得出 `denied`，再决定模型看到什么）
- **倾向（采纳前先说明你的理由）**：**优先在我们自己的层做兼容，不动第三方包源码**（`'permission denied'` 这类常量改在 node_modules 里，上游一升级就没了）。
- ⚠️ **若你的结论是必须改第三方源码** → **停下先回报 WB**，按 `docs/dsh/dsh-migration.md` §3.0 第三方引入原则处置，不要自行 fork/patch。

### Step 2 —— 修

目标：**node / cmd / powershell 三个子进程在各自被拒时，`denied` 都必须为 true**（中文 Windows 下）。建议方向：补 `operation not permitted`（对应 EPERM）+ 本地化串或按 locale 的正则。

### Step 3 —— 验收（正反两组 + 反向哨兵，缺一不可）

**复跑判据**（三条独立证据链才定性）：① 无沙箱写同一目标成功；② 沙箱内写授权路径成功；③ 沙箱内写未授权路径失败且文件确实没出现。

三个子进程各跑一次被拒场景，逐个确认 `denied=true`。

**反向哨兵（必须做，否则会放过从未生效的护栏）**：

- **不得**出现"任何非零退出都判 denied" —— 那样会把 **runner 故障**（windows-acl：`exit 127` + stderr 含 `windows-acl-run: `）误读成"拦截成功"，**fail-closed 的区分能力会丧失**。这条边界不许改坏。
- **正向对照**：让受限子进程主动打印 `Access is denied.` → 应仍判 denied（证明匹配逻辑没坏）。

**本机直调 runner 的法子**（不经 dsh profile，最快）：

```
node <...>/dsh-sandbox-windows-acl/lib/runner.js \
  --workspace <已存在目录> --temp <目录> --mode <read-only|workspace-write> \
  -- <可执行文件绝对路径> <args...>
```

⚠️ `--` 后第一个必须是可执行文件（传 `-e ...` 会报 `CreateProcessAsUserW failed (Win32 2)`，不是沙箱问题）。

### 边界（不外推）

- 只判"当前 `dsh-v0.1.2-rc.1` + 本机 zh-CN 区域设置下修复生效"。
- ⬛ 英文 Windows / 其它语言 / pwsh 7 —— 本机未装，**不要求你测**，报告里标未测即可。
- ② 层（EPERM）应当在语言无关的意义上被修复，但**别把 ① 的本地化串当成 ② 的解法**。

### 卡点

Step 1 卡住半天以上，或结论是"必须改第三方源码" → 立刻回报，别闷头 fork。

---

## 📌 上一轮派发（2026-09-10 · DSH-2.5 ①②⑤）— 已交付并通过 WB 复验，待清理

> **回复位置**：本报告完成后写在本节下方，标题用 `## Trae 报告 · DSH-2.5 <日期>`。**不要覆盖本节派发内容**（WB 确认完成后会清理）。

### 背景（你不知道的部分，先补齐）

DSH-2 阶段已到**最后闸门**：`docs/dsh/dsh-migration.md` §3.6 定义的**五项退出条件**，任何一项不过 → DSH-3 收益表重估、C 路径回退进入议程。目前**五项一项未测**。

DSH-2.5 五项中，**①②⑤ 派给你**（③④ 派给 Claude，是 Windows 端纯测试，与你无交集，不用担心踩踏）。

### 🔧 可用环境：CVM（Linux 验证机）

WB 昨天已 ssh 打通并验收环境层，**你可直接用**：

| 项 | 值 |
|---|---|
| 地址 / 用户 | `ubuntu@49.232.129.252` |
| 登录 | SSH 密钥 `~/.ssh/id_ed25519_cvm`（**私钥在本机，勿复制勿外传**） |
| 系统 | Ubuntu 24.04.4 / 内核 6.8.0 / **2 核 1935MB** / swap 1.9G / 盘 50G ext4（**云盘，非本地 NVMe**） |
| sudo | 免密 |
| node | 已装 `v22.22.2`，在 `~/node/bin`（**需手动加 PATH**：`export PATH=$HOME/node/bin:$PATH`） |
| npm registry | 已设为 `https://registry.npmmirror.com` |
| 已有 DSH | `~/dshprobe`（`@deepseek-ai/dsh@0.1.2-rc.1`，303MB） |
| 完整环境档案 | **`docs/dsh/dsh-cloud-deployment.md`**（必读，含全部实测数据与踩坑） |

> ⏳ **该机有效期约至 2026-10-09**（老大 2026-09-10 确认：赠 1 个月，昨天为第 1 天）。**时间充裕，不要为抢时间牺牲严谨度**；但若你在环境连通上卡超过 2–3 天，立刻告知 WB，不要硬扛。用完请告知 WB，以便决定是否需要保留。

**①②⑤ 可以自行排序推进，也可以先只做 Step 0 后回报。** 建议顺序：**Step 0 → ① → ② → ⑤**（理由见 Step 0 开头）。

---

### Step 0 — CVM 冷启动：`自做服务 →(stdio)→ DSH` 最小闭环 PoC 🟢【建议第一个做】

**为什么插在 ① 前面**：① 要在 CVM 上验证 `storage/` 模块层，前提是**能在这台机器上驱动 DSH 跑一条消息**。这是一切的前置 —— 不先打通，① 写完代码可能发现根本连不上。同时它是**代价最低的 CVM 上手动作**（不用理解 DSH 内部），却顺手回答了架构上最大的未知：**我们自己的服务能否在云主机上驱动 DSH**。

**这条路不是从零写，本地已有现成资产可直接搬**（DSH-2.3 就是靠它们判「能」的）：

| 本地资产 | 作用 |
|---|---|
| `harness/scripts/dsh-prompt.mjs` | 最小驱动：spawn `--profile sdk` runtime，跑一条 prompt 并打印 `finalResponse`。**Tauri 壳底层跑的就是它** |
| `harness/scripts/dsh-probe-capability.mjs` | 同法一次完整 prompt，额外统计事件/通知分布 |
| `harness/package.json`（已含 `@deepseek-ai/dsh` + `@deepseek-ai/dsh-sdk-client` 同版本 `0.1.2-rc.1`） | 依赖可直接 `pnpm install` 复现 |

**做法（建议）**：把 `harness/` 的**源码与 package.json 传上去**（**不要传 `node_modules`**，303MB 会拖慢且已在机器上有等价物），在 CVM 上 `pnpm install`（npmmirror 很快），然后跑 `node scripts/dsh-prompt.mjs "Reply with exactly: probe ok"`。

**要拿到的数据（缺一不可）**：

1. **`finalResponse` 是否等于 `probe ok`** —— 云机上 stdio 通道是否真的通
2. **联合 RSS**：自做服务进程 + DSH runtime 子进程，**两个加起来的峰值 RSS**（`/usr/bin/time -v` 或轮询 `ps -eo rss`）→ 这是「2G 还是 4G」唯一还空的数
3. **冷启动耗时**（spawn → 首响）
4. **落地点确认**：本轮产生的 DSH_HOME 在哪（`DSH_HOME` 显式设置 vs 默认落 cwd）

**判据自检（必答）**：「通了」用什么现象判定？**它在「真的通」与「被 mock/被短路」两种情况下分别长什么样？** 若两者表现相同 → 判据无效。同样地，「没通」至少有「spawn 失败 / 握手超时 / provider 鉴权失败」三种不同故障，**报告里要说清是哪一种**，不要统写「连不上」。

**产出**：probe 脚本 + 四条数据 + 结论（云机 stdio 是否可行）。**它同时也是 ① 的脚手架，不要当成一次性 demo 扔掉。**

> ⚠️ **需要老大给一个临时测试 Key 或指定 mock 路径**（脚本默认走 `provider: deepseek-official`）。**这一步卡住就停下回报，不要自己去翻配置或改 key 读取逻辑**，也不要把 key 明文写进落到机器上的任何文件（一律用环境变量注入）。

### ⚠️ 三条 CVM 使用纪律（WB 实测踩过，别重复）

1. **境外资源下载 ~15KB/s**：Chroma 的 embedding 模型走自己的 S3，**设 `HF_ENDPOINT` 镜像无效**。npm/npmmirror 很快（31MB/3s），Python 包也一样快，**唯独模型文件慢**。别在这里空等。
2. **安全组默认只放行 22**：你起的服务本机 `curl 127.0.0.1:<port>` 可通，公网不通，**这不是你的 bug**。
3. **DSH 拒绝绑定 0.0.0.0**（官方理由：会向网络暴露 RCE）。启动必须 `--host 127.0.0.1`，否则直接报错。

---

### 任务 ① — `storage/` 外接 SQLite 可行性 🟢【最高优先级】

**目标一句话**：验证 DSH 的 `storage/`（storage-domain + storage-json）能否用作**外接 SQLite 的挂载点**，即我们的记忆能不能存进自己指定的 SQLite 文件。

**WB 已完成的部分（别重复做）**：环境层 —— SQLite WAL 并发写（node:sqlite 3.51.2，正反两组：反向 `busy_timeout=0` 应出现 locked、正向 10s 应 COUNT=200 无写丢失）、`flock` 互斥、fsync 延迟（avg 1.544ms），**全部已过**。见 `docs/dsh/dsh-cloud-deployment.md` §5。

**你要做的**：**模块层** —— 真跑 `storage/`，回答这些问题：

1. `storage/` 的 backend 机制是什么？`storage-json` 是唯一 backend 还是有可插的其他实现？**外接 SQLite 是要写自定义 Provider，还是配置一下就有？**
2. 若需自写 Provider：**契约面有多大**（要实现的接口数量）、有无现成参考实现？
3. 数据实际落在哪个文件、能否指定路径？
4. **用户约束**：DSH 自身的 `.dsh-home/` 默认落在 cwd（WB 已实测会向上查找），外接能否**脱离这个机制**、指到我们自己的 `backend/data/larry.db`？

**交付**：可运行的 probe + 落地路径证据（`ls` / 文件内容 / 日志），不是"应该可以"。

**⚠️ 判据自检（必答，在报告里显式写出）**：你打算用什么现象判定"外接成功"？这个现象在**「正常工作」和「压根没生效」**两种情况下分别长什么样？若两者表现相同 → **判据无效，换**。

---

### 任务 ② — `acp/` 契约稳定性

`acp/` 自称 "Automation-only Agent Client Protocol server"（+ `sdk/` JSON-RPC SDK）。**契约稳定性需实测**：

- 实际能建立连接吗？握手流程是什么？
- 有哪些可用方法与事件？**逐个列出**（不要只说"能连上"）。
- 连续多次调用 / 长连接 / 异常断连后，行为是否一致？
- 会话 fork / resume 是否可用？（TODO 174 有「id collision 定性」悬案，若你顺手拿到证据请一并报告，但不必为此专门做）

---

### 任务 ⑤ — TS 跑通 bge-small-zh 本地 embedding 并与 Python 侧比对

**目标**：决定 **DSH-4 记忆迁移是否需要全量重嵌**（直接影响工作量）。

- TS 侧跑 bge-small-zh，Python 侧跑同一模型，**同一批文本**各自出向量
- **比对余弦相似度 / 数值漂移**，给出量化的漂移数据（不只是"差不多"）
- 结论要明确：**漂移在什么阈值以内可判定"无需重嵌"** —— 这个阈值请你先提出，说明依据，WB 与老大确认

**⚠️ 环境建议**：**用本机（Windows）或 WSL，不要用 CVM**（2G 内存，很可能 OOM，且模型下载慢）。同时注意 `backend/` 现有 Python 侧用的是哪个版本/格式（ONNX q8 还是 PyTorch fp32）—— **两侧必须同一模型同一格式**，否则比对无意义。

---

### 📋 报告要求（沿用 DSH-2.4 定下的规矩）

1. **必须有反向哨兵**：任何"护栏/校验/兜底"类结论，都要**人为制造违规看它是否真的报警**。只查结果达标会放过从来没运行过的护栏。
2. **区分三层**：🟢 实测有据 / 🔴 估算推测 / ⬛ 未测。混写会被打回。
3. **不外推**：写"已排除 X"时，必须说明**你的实验覆盖哪条执行路径**，结论只能写在那条路径上。
4. **不过度声明**：适用边界逐条写清。过度声明会造成错误安全感，让后续 AI 在例外路径上重蹈覆辙。
5. **失败要如实报**：负结果同样有价值，**不要粉饰、不要省略**。

**优先级**：① > ② > ⑤。①卡住超过半天就先把卡点报出来，**不要闷头死磕**。

---
---

## Trae 报告 · DSH-2.5 ①②⑤（2026-09-10）

> 基线 `dsh@0.1.2-rc.1`；CVM（ubuntu@49.232.129.252，Ubuntu 24.04 / node v22.22.2 / pnpm 12.3.4 / 1935MB）；三条任务全部完成。分层标注：🟢 实测有据 / 🔴 估算推测 / ⬛ 未测。

### 0. 结论速览

| 项 | 结论 | 等级 |
|---|---|---|
| **Step 0** CVM 冷启动 stdio PoC | **能。** 自做服务经 stdio 驱动 DSH sdk profile 跑通真实会话 | 🟢 |
| **①** `storage/` 外接 SQLite | **能给。** 官方 `dsh-storage-sqlite` backend，仅需配置；`path` 可指到任意绝对路径（脱离 `.dsh-home`）；**我们自己的 domain 数据实测落入我们指定的库文件** | 🟢 |
| **②** `acp/` 契约稳定性 | **稳定可用**（协议 v1，5 个会话方法 + 通知实测）；**`session/fork` 不支持**（实测 -32601）；跨进程 `resume` 可用 | 🟢 |
| **⑤** TS/Python bge 漂移 | **无需全量重嵌**：预处理对齐后 maxAbsDiff **2.2e-7**、检索 top-1/3/5 **14/14 全一致**；漂移根因是**大小写预处理**而非模型差异 | 🟢 |

---

### 1. Step 0 — CVM 冷启动：`自做服务 →(stdio)→ DSH` 最小闭环 🟢

**脚本**：`harness/scripts/cvm-probes/cvm-step0.sh`（驱动用现成 `harness/scripts/dsh-prompt.mjs`，未另写）；profile 装配 `cvm-setup-profile2.sh`。CVM 产物在 `~/larry-dsh-home`（206MB）。

**四条数据**：

| # | 数据 | 实测值 |
|---|---|---|
| 1 | `finalResponse` | **`probe ok`**（与期望逐字节一致），exit 0 —— 两条路径均如此 |
| 2 | **联合 RSS 峰值**（driver + DSH runtime 进程树求和） | 显式 DSH_HOME **192 MB**（197032 KB / 15 次采样）；默认 DSH_HOME **189 MB**（11 次采样） |
| 3 | **冷启动耗时** | 显式 **3190 ms**；默认 **2359 ms**（口径：进程 spawn → `finalResponse` 落定，含一次真实 LLM 往返；非纯 boot） |
| 4 | **落地点** | 显式 `DSH_HOME=~/larry-dsh-home` → 产物落该目录（`storages/session_projcache/…json` + `sessions/--home-ubuntu-harness--/<sid>/session.jsonl.zstd`）；**不设 DSH_HOME** → 落 **`~/.dsh`**（非 cwd），复用该处已有 profile |

**判据自检（必答）**：
- **"通了"的判定现象**：① stdout 恰为 `probe ok`；② exit 0；③ `<DSH_HOME>/sessions/…/session.jsonl.zstd` 新落盘；④ stderr 报 `session=<uuid> events=19 notifications=21`。
- **"没通"的三种故障，本次报告的是哪一种**：本次是**真通**。三种故障的区分特征（供后续判读）：`spawn 失败` → node 起不来 / ENOENT（我们的首次失败即此类，但那是 profile 未装包而非网络）；`握手超时` → `initializeTimeoutMs` 到期、无 sessionId；`provider 鉴权失败` → 会话能建但 prompt 报 401/缺 credential。
- ⚠️ **判据弱点（如实报）**：**未构造 mock/短路对照**，因此"真通"与"被 mock 顶替"仅靠上述输出**无法区分**（mock 也是 runtime 内的 LLM 适配器，session/events 落盘行为相同）——区分它们需要独立证据（如抓 provider 出网、或比对 mock 固定串）。🔴 该项为推断，非实测。

**踩坑**：① `.bin/dsh` 不生成（npm 包 bin 链接失败）→ 直接用 `node_modules/@deepseek-ai/dsh/lib/bin.js`；② 首次失败是路径错（tar 解包到 `~/harness`）——**上传路径务必回显确认**；③ PowerShell 会剥引号/吃 `$`，远端脚本一律 **base64 传输 + `bash file`** 执行。

---

### 2. 任务 ① — `storage/` 外接 SQLite 可行性 🟢【最高优先级】

**脚本**：`cvm-task1-setup.sh`（装配）、`cvm-task1-verify.sh`（路由验证）、`cvm-task1-probe.sh`（自有 domain 写入）；插件 `harness/packages/plugin-storage-probe/`。

#### 1) backend 机制 / 是否需要自写 Provider → **配置即可，无需自写**
storage 家族三层：`dsh-storage`（hub，`ctx.storage`）→ **backend**（`storage-json` 默认 / **`storage-sqlite` 官方自带**）→ `dsh-storage-domain`（typed 层，`defineDomain` + `ctx.storageDomain.open`）。官方 README 给的切换方式就是配置：
```yaml
- name: '@deepseek-ai/dsh-storage-sqlite'
  config: { path: /var/lib/dsh/data.db }     # ← 任意外部绝对路径
- name: '@deepseek-ai/dsh-storage-domain'
  config: { backend: sqlite }
```
base bundle 默认是 **json** backend，且 root 写死 `dshHomePath('storages')`（**这就是"绑在 .dsh-home"的那一层**）。

#### 2) 契约面（若将来确要自写）
- 自写 backend：实现 `StorageBackend`（含 `kv: KvFacet`，`kv.open(descriptor) → KvUnit`）。**参考实现两个**：`storage-json`、`storage-sqlite`；测试用 `memory-backend.ts`。
- 业务侧（我们记忆）**不该碰 backend**，走 `defineDomain`（name/version/zod 表 schema）+ `open` + `table().put/get/update`（同步读、durable 写、`domain/changed` 事件）。**契约面很小**。

#### 3) 数据落点 / 能否脱离 `.dsh-home` → **能，实测**
我们的 profile patch：`storage-json disabled` + `storage-sqlite.path=/home/ubuntu/larry-data/larry.db` + `storage-domain.backend=sqlite`。dump-config 确认三层全部生效。运行后：

```
-rw------- 1 ubuntu ubuntu 36864 larry.db          # 0600，magic = "SQLite format 3"
tables: u_larry_probe_items, u_session_projcache_sessions, unit_globals, units
units:  [{"name":"session_projcache","version":5},{"name":"larry_probe","version":1}]
OUR PROBE ROWS: [{"key":"mem-1","value":"{\"text\":\"hello from larry storage probe\",\"at\":1789011103182}"}]
```
即：**DSH 自有 unit（session_projcache）与我们自定义 unit（larry_probe）同落这一个外部库**；`path` 是绝对路径配置 → **脱离 `.dsh-home` 成立**，可指向 `backend/data/larry.db` 定位。

#### 4) 判据自检（必答）
- **"外接成功"判定现象**：① 指定路径生成 SQLite 文件（magic 校验）；② 该库内出现**我们的** unit 表与记录；③ 反向哨兵：`storages/` 下 json 文件数 **不增长**（1→1）且本次 session 的 projcache **不在** json 侧。
- **"压根没生效"的模样**：`larry-data/larry.db` 不生成、`storages/session_projcache/*.json` 照旧新增、`units` 表无 larry_probe。**两者表现显著不同** → 判据有效 🟢。
- 反向哨兵已做：**disable storage-json 后仍能写入 sqlite**，证明数据确实走了 sqlite 而非 json 兜底。

**⚠️ 一个必须记下的坑（坑 8 的补充）**：**link 方式挂进 profile 的插件，其 bare import 解析走源目录**（`~/harness`），profile 内已装的依赖（zod / dsh-storage-domain）**解析不到** → 报 `Cannot find package 'zod'`。解法：探针改为**零外部 import**（spec 只用 `descriptorOf` 读取的字段 + identity `valueSchema`）。若未来我们的插件真要裸 import DSH 包，应**实体复制进 profile** 而非 link，或在源目录补齐依赖。另：`ctx.effect` 必须在**活着的 fiber** 上创建（`ctx.inject(deps, cb)` 回调内），apply 同步体里直接 effect 会报 `cannot create effect on inactive context`（本次现象的次生原因）。

---

### 3. 任务 ② — `acp/` 契约稳定性 🟢

**脚本**：`cvm-acp-probe.mjs`（契约）、`cvm-acp-resume.mjs`（resume/断连）；profile `~/larry-dsh-home/profiles/acp`。**手写 ndjson JSON-RPC**（不用 SDK），故原始帧逐条可见。

**① 能建立连接吗 / 握手**：能。`initialize` 返回：
```json
{"protocolVersion":1,"agentInfo":{"name":"deepseek-harness-acp","version":"0.0.1"},
 "agentCapabilities":{"mcpCapabilities":{"http":true},
   "promptCapabilities":{"image":false,"audio":false,"embeddedContext":false},
   "sessionCapabilities":{"close":{},"list":{},"resume":{}}},
 "authMethods":[]}
```
握手即标准 ACP `initialize(protocolVersion, clientCapabilities)`；**无鉴权方法**（authMethods 空）。

**② 可用方法与事件（逐个列，实测）**：

| 方向 | 方法/通知 | 实测 |
|---|---|---|
| client→agent | `initialize` | ✅ 通 |
| client→agent | `session/new` | ✅ 返回 sessionId + `configOptions`（model select：v4-flash/v4-pro/flash-vision-exp；reasoning_effort：off/low/high/max，默认 high） |
| client→agent | `session/prompt` | ✅ 两次连续调用均 `stopReason: end_turn` |
| client→agent | `session/list` | ✅ 返回持久化会话（本次 3 条） |
| client→agent | `session/resume` | ✅ **跨进程可用**（见下） |
| client→agent | `session/close` | ✅ 返回 `{}` |
| agent→client 通知 | `session/update` | ✅ 收到，`sessionUpdate` 实测有 `agent_message_chunk`、`usage_update` |
| agent→client 请求 | `session/request_permission` | 本次未触发（`DSH_PERMISSION_MODE=danger-full-access`）；声明支持 |

**明确不支持（实测 -32601 `Method not found`）**：`session/fork` / `session/load` / `session/delete`。
→ **直接回答派发稿的 fork 问题：fork 不可用；resume 可用。**（TODO 174 的 id collision 悬案本轮**未取到证据**，未专门做 ⬛）

**③ 连续调用 / 长连接 / 异常断连**：
- 连续多次：同一 session 两次 prompt 均 `end_turn` 🟢（未做长时压测 ⬛）
- 跨进程 resume：进程 #1 建会话→prompt→close→**退出**；进程 #2 `initialize` 后 `session/resume` **成功**（返回完整 configOptions），resume 后再 prompt 仍 `end_turn` 🟢 —— **会话持久化真实可用**
- 异常断连：中途 SIGKILL → 进程 exit `signal=SIGKILL`；客户端调用失败（本次 in-flight 报 `-32602 unknown session`）。
  ⚠️ **该用例设计有瑕疵（如实报）**：in-flight 请求用的 sessionId 取自 `session/list[0]`（未必是本进程该会话），故 `unknown session` **不能单独归因于 kill**。结论只能写到"进程被强杀后客户端调用失败、进程退出被观测到"这条路径上，**不外推**为 ACP 断连语义的一般结论。

**④ stdout 纯净性**：全程 stdout **零违规行**（每行均可 JSON.parse）🟢。

---

### 4. 任务 ⑤ — TS 跑通 bge-small-zh 并与 Python 侧比对 🟢

**脚本**：`harness/scripts/embed-probe/{python-embed.py, ts-embed.mjs, compare.mjs}`（本机 Windows，未用 CVM）。

**两侧口径（先对齐，否则比对无意义）**：
- Python 侧（现状）：**sentence-transformers 5.7.0（PyTorch）**，`BAAI/bge-small-zh-v1.5`。查模型自带 `modules.json` 确认链路 = Transformer → **Pooling(cls_token=true)** → **Normalize** → 输出 **512 维、已 L2 归一化**。**不是 ONNX/q8。**
- TS 侧：**transformers.js（ONNX Runtime）**，`Xenova/bge-small-zh-v1.5`，`dtype: 'fp32'`，手工 **CLS pooling + L2 normalize**、max_length 512。
- 同一 14 条文本批次（中/英/混/长/短/数字），两侧各出向量。

**比对结果**：

| 指标 | 修正预处理前 | **修正后** |
|---|---|---|
| 逐条 cosine | min **0.7732**（4 条偏离，全是含拉丁字母者） | **min 0.99999999999904，14/14 ≈ 1.0** |
| maxAbsDiff | 0.0889 | **2.2285e-7** |
| maxL2Diff | 0.6735 | **1.3887e-6** |
| 检索 top-1 / top-3 / top-5 同序 | 13/14 · 10/14 · 6/14 | **14/14 · 14/14 · 14/14**（overlap 全 1.0） |

**漂移根因（本轮最有价值的发现）**：偏离的 4 条**全部是含拉丁字母的文本**，纯中文/纯数字 14 条零偏差 → 定位到**预处理大小写**：Python 侧 `sentence_bert_config.json` 的 `do_lower_case: true` 生效，transformers.js **不会自动 lowercase**。显式 `.toLowerCase()` 后偏差塌到浮点噪声级。→ **这不是实现/精度漂移，是预处理对齐问题。**

**结论与阈值建议**：
- **判定：无需全量重嵌。** 依据：预处理对齐后 maxAbsDiff = **2.2e-7**（远低于任何有意义的阈值），且**检索 top-k 100% 同序**（语义等价）。
- **建议阈值**（供 WB/老大确认）：`maxAbsDiff ≤ 1e-4` **且** 检索 top-k 同序率 = 100% → 判"无需重嵌"。依据：实测值比阈值低 3 个数量级，留足余量；该阈值下"重嵌与否"对检索结果**无可见影响**。
- **前提（必须写进 DSH-4 迁移方案）**：向量可比**依赖预处理严格对齐** —— `do_lower_case`（或统一 lowercase）、CLS pooling、L2 normalize、max_length 512。**任一项不对齐会产生 0.77 级别的假漂移**（本轮已复现），据此误判"必须重嵌"会白做全量重嵌。
- **适用边界（不过度声明）**：本轮覆盖 14 条文本、单一模型（bge-small-zh-v1.5）fp32、CLS+normalize 路径；**未覆盖** q8/量化 dtype、超 512 token 截断行为、其他 embedding 模型 ⬛。

---

### 5. 可复跑步骤

**CVM（Step 0 / ①②）**：
1. 连通：`ssh -i ~/.ssh/id_ed25519_cvm ubuntu@49.232.129.252`；`export PATH=$HOME/node/bin:$PATH`
2. 上传：本地打包 harness（排除 node_modules）→ scp → `~/harness`；`pnpm install`（23s）+ `pnpm add zod`
3. 建 profile：`cvm-setup-profile2.sh`（sdk）、`cvm-acp-setup.sh`（acp）——均含 allowBuilds 补丁
4. Step 0：`DEEPSEEK_API_KEY=… bash cvm-step0.sh explicit|default`
5. ①：`cvm-task1-setup.sh` → `cvm-task1-verify.sh` → scp 插件 + `cvm-task1-probe.sh`
6. ②：`node scripts/acp-probe.mjs` → `node scripts/acp-resume.mjs`
（所有远端执行都用 **base64 传输 + `bash <file>`**，勿直接拼 ssh 命令行）

**本机（⑤）**：`python harness/scripts/embed-probe/python-embed.py`（需 sentence-transformers + 模型缓存）→ `node ts-embed.mjs`（需 `npm i @huggingface/transformers`，`HF_ENDPOINT=https://hf-mirror.com`）→ `node compare.mjs`。

---

### 6. 隔离自检 & CVM 资产

- **本机仓库**：本次仅新增 `harness/packages/plugin-storage-probe/`、`harness/scripts/cvm-probes/`、`harness/scripts/embed-probe/`，并改 `harness/package.json`+`pnpm-lock.yaml`（加 zod）。⑤ 的中间产物在**仓库外** `D:\Code\embed-probe`（未入库）。其余 `M` 文件（.workbuddy / TODO / docs / 其他 log）**均为他人在动，我未触碰**。
- **凭据**：测试 Key 全程**仅环境变量**注入（含 ssh 命令行 export），未写入任何落地文件；脚本内做过 key 泄漏自检（输出无 key）。
- **CVM 资产**（用完请告知 WB 决定保留/回收）：`~/larry-dsh-home`（sdk+acp profiles，206MB）、`~/harness`（208MB，含探针脚本）、`~/larry-data/larry.db`（①的外部库证据）、`~/acp-work`；`~/.dsh` 为 WB 既有（未改）。
- **未越界确认**：未写业务逻辑（plugin-storage-probe 是探针）；未动 `client/`；未动 `docs/ archive/ .workbuddy/`；`ref/dsh-bare` 全程只读。

### 7. 给 DSH-4 / 后续的直连结论

1. **记忆外接 SQLite 已可落地**：`storage-sqlite.path` 指到我们的库即可，`defineDomain` 注册我们的 domain —— 无需自写 backend，契约面小。
2. **stdio（SDK）走 B 段** 在 2C2G 云机上资源账很小：**联合峰值 ~190MB**，冷启动 ~2–3s。
3. **ACP 是稳定但窄的自动化面**：能用的是会话生命周期（new/list/resume/close/prompt）+ 语义更新；**没有 fork/load/delete**，也没有 UI 类能力——与"automation-only"定位一致。
4. **记忆迁移不必全量重嵌**（前提：预处理对齐），可省 DSH-4 一大块工作量。

---