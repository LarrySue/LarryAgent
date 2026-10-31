# Trae 协作区

> **属主 = 沈知砚(Trae)**,本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **测试场地隔离 · 工程化**（W1 相对解析 ／ W2 启动断言 ／ W3 自检可证伪） | **Trae** | `plugin-s4-memory/src/index.ts` ＋ `run-36-memory.mjs`（iso 相） | ✅ **已复验成立（WB 2026-10-30 22:40，带 2 条增量）** ⇒ 结论落 `TODO.md:89`；逐条读数、三条过程观察与判别力边界见本区〈📌 已办结 · 测试场地隔离〉 | 2026-10-30 |
| **CoT 存档 · A 侧**（raw 全量落盘 ＋ 三态显式标注） | **Trae** | `backend/models/llm.py` 两处入口 ＋ 新模块 ＋ `backend/tests/` | 🔵 **WB 2026-10-30 23:55 派发** ⇒ 见〈📮 派发 · CoT 存档 · A 侧〉节。⚠️ **不含回传侧**（B 侧单列）；⚠️ **不动 `messages` 表**（对阿衡原方案的一处实质修正，理由在稿内） | 2026-10-30 |
| **P0② 向量召回 · 第一期**（embedding 接通 ＋ 语义 top-k） | **Trae** | `harness/packages/plugin-s4-memory/**` ＋ profile 依赖布局 | 🟢 **已交付（Trae 2026-10-31 22:20）** ⇒ 见〈✅ 交付 · P0②〉节；P1–P7 部署件 21 判据全绿 ＋ 真实 dsh 装配面 2 判据全绿，待 WB 复验。⚠️ 部署件已同步（`lib/index.js` sha256 `72f2845c…`）；J5 旧装置 EEXIST 为既有老化，未改装置 | 2026-10-31 |
| — | — | — | ✅ **本区无其他在飞块**。2026-10-28：DSH-3.10 已归档 → `archive/roadmap-history.md`「2026-10-20 办结」；适配判断／剪枝复检已随 `docs/la-space/` 定稿承接；**硬件分项账已承接 → `local-env.md` §14 ＋ `production-env.md` §2.5**。⚠️ **唯一活账＝〈📥 过程观察 · DS 通道复测〉末两条待处置**（该段是 2026-10-28 现场观察，⛔ 非在飞任务） | — |

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

## ✅ 交付 · P0② 向量召回 · 第一期（Trae · 2026-10-31 22:20）

> **结论先行**：召回口径已从 `ORDER BY id DESC LIMIT ?` 换成「插件侧 CLS embedding ＋ 余弦 top-k」；写侧新增 `memories.embedding BLOB`（512 维 / 2048 B）＋老库幂等迁移＋回填；注入条数／位置未动（仍是同一个 `larry-memory-recall` context 条）。P1–P7 全部在**同步后的部署件**上取读数（21 判据 0 FAIL），另加真实 dsh 装配面端到端 2 判据全绿（0 token）。
> 证据目录：`D:/Code/_trae-evidence/p02-vector-recall/`；复跑：`node harness/scripts/embed-probe/p02-recall-probe.mjs` ＋ `node harness/scripts/embed-probe/p02-dsh-integration.mjs`。
> **提交**：`e14fa24`（author Trae）。首次 `git add` 与 WB 的提交窗口撞车（WB 已在 `e7c95d8` 记录并修正）；本单最终用 `commit --only` 只提交本单 6 个路径。

### 一、P1–P7 读数（部署件 = `.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-s4-memory/lib/index.js`，19,948 B，sha256 `72f2845cbf54b728e810c755eef1494a9734a26a4b4a08eadd1e72c3a4bd5370`）

| 判据 | 结论 | 证据 |
|---|---|---|
| **P1 依赖可达** | 🟢 | 从部署件实体目录 `import.meta.resolve('@huggingface/transformers')` ⇒ `file:///D:/Code/LarryAgent/.dsh-home/profiles/sdk/node_modules/@huggingface/transformers/dist/transformers.node.mjs`；`P1-resolve.txt`。实现选**甲**：依赖装进 profile（`hoisted`），插件向上查找命中；⛔ 未 bundle（`onnxruntime-node` 原生二进制） |
| **P7 部署件同步** | 🟢 | 构建→同步 `lib/`＋`package.json`→部署件命中新增哨兵 `p02-vector-recall-v1` ×1；`OUTSIDE_HOME_DENY_MARK` ×2（10-30 隔离断言已进入运行件）。旧件留档 `plugin-s4-memory.bak-20261031-2135`（8846 B / 10-18） |
| **P2 模型落点** | 🟢 | `modelCacheDir=D:/Code/_models`（绝对路径）；加载后 profile `node_modules/.cache` 0 B→0 B、harness `.cache` 95,292,085 B→同值；用户数据目录模型文件在（`model.onnx` 94,851,877 B）。**未配读数组**：`resolveModelCacheDir('')=null`；transformers 默认 `env.cacheDir=<profile>/node_modules/@huggingface/transformers/.cache`；`defaultModelCacheDir()` 同路径 |
| **P3 向量落库** | 🟢 | 经插件 `session/event` 写入 1 行：`memories.embedding` 列（BLOB），`count(*)=1`、非空=1、`length=2048/2048`、`typeof(embedding)='blob'`、向量 norm=1.000000（L2） |
| **P4 语义召回** | 🟢 | 24 行老 schema（无 embedding 列）⇒ 迁移＋回填全完成；query「家里的猫总挑有日光的窗边打盹…」⇒ 余弦 top-3 ids=`[25,1,21]`，目标 id=1 在 top-3；同一目标按时间倒序第 **25** 位（>20）⇒ 新旧口径可区分。装配注入条含「语义 top-」＋目标 id=1 正文，8 行 |
| **P4 真实 dsh 装配面** | 🟢 | 实际 sdk profile ＋ SDK 客户端（0 token）：context 面 synthetic `user/message` 含「语义 top-」＋目标正文；召回块标题仅 1 次（替换而非追加）。证据 `P4-dsh-integration.json` |
| **P5 降级（3 臂）** | 🟢 | 未就绪（空 cacheDir）／`import` 失败（临时复制件无 transformers）／cacheDir 指向普通文件：三臂均返回 8 条时间倒序、日志恰 1 行（`DEGRADED_MARK`＋`EMBED_RECALL_FALLBACK`＋哨兵）、墙上时间 **2.0 / 1.1 / 1.2 ms**（≤1000ms，⛔ 无阻塞等待） |
| **P6 Tier0 红线 4** | 🟢 | P3/P4/P5 共 5 个库全部在临时目录 `D:\Temp\Sys\p02-recall-…`；故意指向真库 `…/.dsh-home/larry-memory.db` ⇒ exit=1，stderr 含 `OUTSIDE_HOME_DENY_MARK`，真库 sha256 前后相同；断言在部署件 `lib/index.js:93` |

### 二、改了哪些

- **新增 `src/embedding.ts`**：CLS pooling ＋ L2 normalize ＋ `max_length:512` ＋ lowercase（与 `ts-embed.mjs` 逐项对齐）；`resolveModelCacheDir`／`defaultModelCacheDir`／`isModelReady`／懒加载 `createEmbedder`（失败不粘死，下次重试）。
- **新增 `src/recall.ts`**：Float32 ↔ BLOB 编解码、余弦 top-k。
- **`src/index.ts`**：
  - 写侧：`memories.embedding BLOB` ＋ 老库 `ALTER TABLE` 幂等迁移；入库后异步 `ingestEmbedding`，老库 `startBackfill`；**Chroma 的 `getChroma`／`doubleWrite` 原样保留**（默认关，⛔ 未启用）。
  - 读侧：`agent/inbox/claimed`（claim 在装配**之前**，带 agent）记当前 prompt；`session/event` map ＋ `session.deriveMessages()` 回退；`system-prompt/assemble` 瀑布把**同一个注入条**的文本替换成语义 top-k，⛔ 不增删条、不改位置。
  - 降级：未就绪／import 失败／编码失败 ⇒ 直接回时间倒序 ＋ 1 行统一降级日志 ＋ 后台预取（不等待）；`pooling:'mean'` 的旧 `getEmbed` 已移除，语义与 Chroma 共用同一 CLS 编码器。
- **环境（⛔ 不在 git）**：profile `package.json` 加 `@huggingface/transformers: 4.3.1`（甲案）；`pnpm-workspace.yaml` 的 `allowBuilds` 放行 `onnxruntime-node: true`；`pnpm install --offline` exit 0；部署件同步留旧件备份。

### 三、自曝与过程观察

1. **第一版真实 dsh 集成是红的，原因不在代码而在取 query 的通道**：`session/event` 是 post-commit，`deriveMessages()` 在装配时还是 0 条——首轮只拿到 fallback。改成监听 `agent/inbox/claimed`（claim 同步发生在 `systemPrompt.assemble` 之前，payload 自带 `agent`）后转绿。这与今天上午「检查的份 ≠ 干活的份」同族：**我监听的通道不在装配的关键路径上**。第一版读数（调试日志）：`assemble: listener fired`＋`contexts=sandbox:policy,approval:policy,larry-memory-recall`＋`semantic: sessionQueryLen=0 mapQueryLen=0 ready=true`。
2. **`defaultModelCacheDir()` 第一版返回 null**：先 `require.resolve('@huggingface/transformers/package.json')` 被 exports 挡（`ERR_PACKAGE_PATH_NOT_EXPORTED`）；改为解析入口文件再向上找 `package.json`，P2 附读数现已返回真实默认路径。
3. **部署件旧了 12 天**：旧件 8846 B / 10-18，缺 10-30 的隔离断言；P7 已同步，部署件现在 19,948 B 并命中哨兵。这是 WB「假完成」B 半的一个实例（源码已落地 ≠ 运行件已落地）。
4. **J5 旧装置 EEXIST 是既有老化**：`run-36-memory.mjs` 的 `mountPlugin` 在临时 home 已有插件实体目录时再 `symlinkSync` ⇒ `EEXIST`；`mountPlugin` 本次未改。为了不碰共享装置，改用独立的 `p02-dsh-integration.mjs` 做真实 dsh 装配面验证。若 WB 要复跑旧装置，需在 `mountPlugin` 里先 `rmSync` 目标（一行；⛔ 本单未擅自改）。
5. **真库回填未在测试里实跑**：Tier0 要求测试只用临时库；真库 54 行的回填会在下一次真实 dsh 会话启动时由 `startBackfill` 完成（模型已在 `D:/Code/_models`）。P4 用 24 行老 schema 临时库证明了同一路径。
6. **P2 未配的边界**：若有人显式把 `modelCacheDir` 置空，默认落点 = profile 自己的 `node_modules/@huggingface/transformers/.cache`（当前 0 B）；模型不在那里时语义召回持续走 fallback，不会崩。默认配置仍指 `D:/Code/_models`。

### 四、未闭合

- J5 旧装置 EEXIST（上述第 4 条）—— 属既有老化，等 WB 决定是否修装置。
- 真库老行回填只有设计路径，未在真库实测（Tier0 边界）。

---

## 📮 派发 · P0② 向量召回 · 第一期 —— embedding 接通 ＋ 语义 top-k（WB · 2026-10-31 21:10）

> **一句话**：把召回从「`ORDER BY id DESC LIMIT 8`（时间倒序）」改成「**向量相似度 top-k**」，向量在**插件侧**算。
> ⚠️ 本期**只改"选哪 8 条"**，⛔ 不改"8 条怎么进系统提示词"（注入策略属第二期）。

### 0 · 📌 WB 已实测的场地读数（⛔ 不必重测；仅 P1 那条请你亲自复核）

| 项 | 读数 | 取法 |
|---|---|---|
| transformers.js | `4.3.1` | `@huggingface/transformers/package.json` |
| TS 侧能否算 | ✅ 跑通 | `harness/scripts/embed-probe/ts-embed.mjs`（现成） |
| 维度 | **512** | 脚本自报 |
| 编码耗时 | 14 条 **0.06s**（≈5ms/条） | 同上 |
| **首次 load** | **317.5s**（含下载 **91MB** onnx 模型） | `load=317.54s` |
| **热缓存 load** | **0.21s** | 第二次跑 |
| 模型落点 | `node_modules/@huggingface/transformers/.cache`（**默认行为，91MB**） | `du` |
| 插件 `dependencies` | **`null`**，一个依赖都没声明 | `package.json` |
| 插件目录解析依赖 | ❌ **`ERR_MODULE_NOT_FOUND`** | `import.meta.resolve` 实测 |
| profile 布局 | pnpm workspace，**`nodeLinker: hoisted`**；插件是**实体目录**（非软链），旁有两份 `.bak-20261018` | `pnpm-workspace.yaml` ＋ `ls -la` |

**⚠️ 两条读数单独拎出来说，因为它们决定了方案**：
1. **首次 317s 不能出现在召回路径上** —— 那是把对话卡死 5 分钟。⇒ 见 P5 降级。
2. **模型默认落 `node_modules`** —— 依赖一升级/重装，91MB 白下。⇒ 见 P2。

### 0.2 · ⚠️ WB 21:35 复核后追加 —— 现有代码已有这套地基，⛔ 别重造

> 触发 = 你回报的两条读数（`getEmbed` 的 `pooling:'mean'` ＋ 部署件旧）。我回源码看了一遍，发现**21:10 那版单子漏了整整一层**：`src/index.ts:173-230` 已经有一套向量地基。

| 已有 | 位置 | 对本单的影响 |
|---|---|---|
| `getEmbed()` 动态 import ＋ **`env.cacheDir = cfg.modelCacheDir!`** | `:177-189` | **P2 不用新增**，只验它生效。⚠️ `modelCacheDir` 未配时 `!` 会拿到 `undefined` |
| `pooling: 'mean'` ＋ `normalize: true` | `:184` | **pooling 错**（应 CLS），**你判断对**。⚠️ 但 `normalize: true` **保留**，只换 pooling |
| `getChroma()` → `if (!cfg.chromaUrl) return null` | `:191-192` | 双写开关已存在且默认关 ⇒ **本期不配 `chromaUrl` 即可，⛔ 别删这段** |
| `doubleWrite()` fire-and-forget ＋ `DEGRADED_MARK` ＋ `degradedLogPath` | `:213-230` | **P5 复用这套模式**，⛔ 另起一套日志 |

**⇒ 本单真正要新写的只有两件**：① **读侧**（query 向量 ＋ 余弦 top-k）；② **写侧把向量存进 SQLite**（现在只写 Chroma、不落 SQLite）。其余全部复用。

⚠️ **同时更正我 21:10 的一条错判**：我说「整条路没有任何向量引用」——**错**，`getEmbed` 在 `:177`、`doubleWrite` 在 `:213`。根因是我 grep 用了 `embedding` 这个词，**匹配不到 `getEmbed`**。召回侧确实仍走时间倒序（结论对），但"没有向量代码"这个说法是错的。
⇒ 这顺带解释了一个一直没暴露的坑：**`doubleWrite` 在 `chromaUrl` 为空时 `:216` 就 return 了，根本走不到 `:217` 的 `getEmbed`** —— 所以 `ERR_MODULE_NOT_FOUND` 从来没被触发过。

### 1 · 判据（逐条可复算）

**P1 · 依赖可达（第一道闸，不过则停手报矛盾）**
从**插件实体目录**（`.dsh-home/profiles/sdk/node_modules/@larryagent/plugin-s4-memory`）执行 `import.meta.resolve('@huggingface/transformers')` 成功，给解析到的绝对路径。
允许两条实现路，选哪条都要报读数：**甲**＝依赖装到 profile（`hoisted` 布局，插件向上查找命中）／**乙**＝插件目录内自带 `node_modules`。
⛔ **不许 bundle 进 `lib/index.js`**：`onnxruntime-node` 含原生二进制，bundle 不了 ⇒ 会得到"编译过、运行崩"的假绿。

**P2 · 模型落点（已有实现，改为验证，⛔ 不必重写）**
`:180` 已有 `env.cacheDir = cfg.modelCacheDir!`。
判据：给 `modelCacheDir` 实际配置值 ＋ 解析后绝对路径；加载后 `node_modules/@huggingface/transformers/.cache` **大小不变**；用户数据目录出现模型文件。
⚠️ 顺带报一个读数：**`modelCacheDir` 未配时** `!` 断言拿到 `undefined`，此时 transformers.js 落回默认（＝`node_modules`）⇒ 给"未配 ⇒ 落哪里"的实测，这条决定默认值该不该写死。

**P3 · 向量落库**
新记忆入库后，同一行带 512 维向量（非全零、非 NULL）。判据：给列名与存储形态（BLOB／TEXT），断言 `count(向量非空) == count(*)`。

**P4 · 语义召回（核心，且必须能证伪）**
造 **≥20 条**库，其中含一组「**时间上最早、语义上最相关**」的记忆。
判据：给**具体 query ＋ 预期命中的 id**，断言该 id 进 top-3；**同时断言同一条按时间倒序排在第 20 位以后**。
⚠️ 后半句是这条判据的全部价值：**证不出新旧口径结果不同，这条对"根本没改"也成立**。

**P5 · 降级不抛错**
模型未就绪时召回**退回时间倒序**且**不抛异常**。三种故障各构造一次：① 下载中／未下载；② `import` 失败；③ `cacheDir` 不可写。
判据：调用方拿到 8 条时间倒序结果 ＋ 一条 warn 日志，**进程不崩**。
- ⚠️ **降级判据必须前置，⛔ 不许「先试再降」**：首次加载实测 **317s**。若降级写成「尝试加载 → 失败／超时 → 降级」，**用户第一次对话会卡 5 分钟**——那不叫降级，叫超时。
  正确形态 = **加载前先判就绪**（模型文件在不在 `modelCacheDir`／后台预取标记），未就绪**直接**走时间倒序，加载推后台。
  判据补一条：**在"模型未就绪"的干净环境里，一次召回的墙上时间 ≤ 1s**（证明没有阻塞等待）。
- ✅ 复用 `:224-228` 的 `DEGRADED_MARK` ＋ `degradedLogPath`，⛔ 别另造日志。

**P7 · 部署件同步（你回报带出来的，新增）**
读数（WB 21:30 复核，与你的回报一致）：部署件 `profiles/sdk/.../lib/index.js` **8846B / 10-18 16:32**；源码产物 **11264B / 10-30 21:48**；`OUTSIDE_HOME_DENY_MARK` 部署件 **0** 命中、源码产物 **2** 命中。
⇒ **10-30 的场地隔离断言从未进入实际运行件**，而 10-30 我复验判的是"已落地"——验的是源码，不是跑的那份。
判据：交付时给「重新构建 → 同步到 profile → **在部署件内**查到本条新增的哨兵字符串」三步证据。⛔ 只给源码产物不算交付。
⚠️ 本条对你有实际影响：**P1–P6 的读数必须在你**同步之后**的部署件上取**，否则验的是旧件。

**P6 · Tier0 红线 4**
测试跑**临时库／临时目录**。判据：给断言行号 ＋ **一次「故意指向真实库 ⇒ exit≠0」的记录**。

### 2 · 前置（不满足 ⇒ 先报，⛔ 别硬做）

- **J6 在飞**（CoT 存档 A 侧，改 `backend/models/llm.py`）。本单只动 `harness/packages/**`，**文件零重叠，可并行**。若你判断两单会互相干扰 ⇒ **停手报矛盾**，不自行排序。
- 模型首次下 91MB。**网络不通就报**，⛔ 别换模型、⛔ 别改预处理参数。

### 3 · 交付物

1. `plugin-s4-memory` 改动（新增 embedding 模块 ＋ 召回改造 ＋ 配置项 ＋ 依赖声明）
2. **读数表**：P1–P6 逐条，格式见 §5
3. ⛔ 不写 `docs/`（归 Qoder）

### 4 · 参考件四要素

- `harness/scripts/embed-probe/ts-embed.mjs` —— **可直接复用的调用法**（含 model id、CLS pooling、L2 normalize、max_length 512 四项预处理，⛔ 一项都不许改，`:1424` 记着任一项不对齐会产生 `0.77` 级假漂移）
- `harness/scripts/embed-probe/compare.mjs` —— 与 Python 侧比对的方法
- `plugin-s4-memory/src/index.ts:168` —— 现有召回 SQL
- `docs/dsh/dsh-migration.md:1424` —— 预处理对齐的硬前提

### 5 · 回报格式

每判据一行 = **判据原文 ／ 结论 ／ 证据（命令 ＋ 输出原文 ＋ `文件:行号`）**。
⚠️ "已完成"三个字不算证据；⛔ 不要把计划当作已完成报。

### 6 · 场地器材

`harness/node_modules/@huggingface/transformers`（依赖已装）＋ 上述两个探针脚本。测试库一律临时目录。

### 7 · 禁区

1. ⛔ **不砍 Python 侧**：`backend/memory/`、`rag/vector_store.py`、Chroma **一律不动**。依据 `dsh-migration.md:1424`（Python 侧向量是 TS 侧的对照基准，实测漂移 `2.2e-7`）＋ `:167`（已裁定走「TS 插件内直接 embedding」，`embed_server.py` 独立进程**不可采用**）。📌 **本条 WB 今晚差点判错**：曾据「Chroma 0 向量」判它是遗留骨架，实为「未启用 ≠ 已废弃」，且它还是迁移对照物。
2. ⛔ **本期不启用 Chroma（⛔ 不是删掉它）**：`chromaUrl` 留空即可（`:192` 自动 `return null`），**`getChroma` / `doubleWrite` 代码一律留着**——它们是 `:1423`「保留双写」的落地形态，删了就成"我今晚判错过一次、结果被删掉"的二次伤害。向量存进 SQLite 同一张表，召回路在内存算余弦（54 条 × 512 维，毫秒级）。⛔ 别自作主张引第三方向量库，也⛔ 别顺手"清理"这段代码。
3. ⛔ **不动 `docs/`**（归 Qoder）。
4. ⛔ **不改注入条数／注入位置**：本期只改"选哪 8 条"。

---

## 📮 派发 · CoT 存档 · A 侧 —— raw 全量落盘 ＋ 三态显式标注（WB · 2026-10-30 23:55）

### 0 · 目标

让 §7 ③ 要的那份「**模型返回的推理原文**」在 LA 现有后端上**真的存在**。

⚠️ **两件事别并成一件**：

- **(a) 有没有存** —— **本单**。
- **(b) 要不要回传给 provider** —— ⛔ **不在本单**（`chat_service.py:248–260` 的 `assistant_msg` 不回带 `reasoning_content`）。它与 10-26 那批 DS 4028 是否同源 **🟡 未证**，绑在一起会把一条未验证的因果带上红线。

⚠️ **对阿衡原方案的一处实质修正**（WB 实测后改，⛔ 不是笔误）：他给 A 侧的定义是「解析 ＋ `messages` 表加位 ＋ 三态标注」。WB 判 **`messages` 加位不是必需** —— ③ 要的是原文**能存能查**，**raw 全量落盘即满足**，且能绕开一个大坑：`backend/db/schema.py` 全是 `CREATE TABLE IF NOT EXISTS`，对**已存在的 `larry.db` 加位不生效**，得另写迁移（还要在 Tier0 红线 4 的临时库上验）。⇒ **本单只做 raw ＋ 显式标注，⛔ 不动 `messages` 表。**
（可反驳：你若认为 raw 不足、结构化存储必需，**停手报矛盾** —— 摆理由，⛔ 别自作主张加表。）

### 0.5 · 📥 WB 补充（2026-10-31 20:25）—— 取证已收，三态不再是假想态

派发时我写「provider 返不返 reasoning 未知，结果不到也不阻塞」。**现在收了**（3 次真实调用 229 token，WB 自跑）：

| 探针 | 读数 |
|---|---|
| `deepseek-reasoner` 流式 | `delta` 非空键 ＝ `[content, reasoning_content, role]`；53 chunk 中 **48 个带 reasoning、共 143 字符**，而 `content` 只有 **3 字符** |
| `deepseek-reasoner` 非流式 | `message` 同样含 `reasoning_content`（159 字符）⇒ **非流式也返** |
| `deepseek-chat` 流式（对照） | `delta` ＝ `[content, role]`，**无 reasoning** ⇒ 「无」是模型特性，不是我取法错 |

**对你本单的实际影响（三条）：**

1. **三态里的第二态「上游返回但我方未采」有真实用例了** —— 就是 `llm.py:498` 那句 `if delta.content`：实测场景下**丢掉 143／146 ＝ 97.9% 的输出**。三态标注的注释可直接引这个数，比空讲「可能」有力。
2. **B 侧技术前提成立**（provider 返 ＋ SDK `2.53.0` 保留字段 ＋ 非流式亦返），但 ⛔ **仍不解除 10-26 DS 4028 那条未证因果** —— 事实归事实、因果归因果。**⛔ 所以还是别顺手做回传。**
3. ⚠️ **判别力边界**：样本＝1 问 1 答／模型，未测多轮工具调用下的行为；`deepseek-chat` 不返只对**该模型名当下**成立，⛔ 当永久事实写死。

证据：`D:/Code/_la-evidence/2026-10-31-reasoning-probe/probe.json`；`TODO.md:95` 已回填结案。

### 1 · 判据（逐条可复算）

- **J6-1 两处入口都落**：非流式 `chat_completion`（`backend/models/llm.py:~316`）＋ 流式 `chat_completion_stream_events`（`:~408`）。判据：离线构造响应，断言**两处都产出 raw 文件**；给落盘路径与文件名规则。
- **J6-2 原样**：每 chunk 落 `model_dump()` 的 JSON，⛔ 不挑字段、⛔ 不重排、⛔ 不丢未知键。判据：构造一个带 `reasoning_content` 的 chunk ⇒ 落盘后可 `json.loads`，且该键**仍在**。
- **J6-3 请求侧也存**：一次调用一份记录，含 `model` ／ 调用参数 ／ `messages` 原文 ＋ 响应侧**全部** chunk。判据：只靠该文件能还原"当时问了什么、回了什么"。
- **J6-4 显式标注**（③ 的硬要求）：每次调用记一个**状态**，取值域三态、互不重叠：
  - `upstream_absent`（raw 里确实没有 reasoning 键）
  - `captured`（raw 里有，但未进结构化存储 —— 本单的阶段态）
  - `stored`（已进结构化存储 —— 若按 raw-only 方案，此项**暂不产生**，须在回报里明说）
  判据：**负向对照双锚** —— 构造「有 reasoning」与「无 reasoning」两种响应，断言两份记录的状态**不同**，**同时**断言其余字段仍完整（否则"环境没起来"与"判定生效"不可区分）。
- **J6-5 落点**：与现有会话数据**同根**、路径由**配置**指定，⛔ 硬编码盘符、⛔ 落系统盘。判据：给配置键名 ＋ 解析后绝对路径 ＋ 换根跑一次仍生效。
- **J6-6 Tier0 红线 4**：本单测试跑在**临时库／临时目录**，口径同 `docs/ai-governance.md` §5。判据：给断言行号 ＋ **一次「故意指向真实库 ⇒ exit≠0」的记录**。⚠️ 记忆插件的启动断言（`ff9392c`）只覆盖它自己那条路径，**不覆盖 backend** ⇒ 别当成已兜住。
- **J6-7 体量读数**：报离线实测（chunk 数 × 平均字节 ⇒ MB/会话）。⛔ **不得以此为由削减覆盖面** —— 存档不许有损是红线（`requirements.md` §7）。
- **J6-8 回归**：`backend/tests/` 全绿；`llm.py` 既有事件契约（`{"type":"delta"}` ／ `{"type":"finish"}`）**逐字不变**。判据：`git diff` 里事件构造那几行零改动 ＋ pytest 读数。

### 2 · 判据前置（不满足 ⇒ 先报，⛔ 别硬做）

- ⚠️ **provider 到底返不返 reasoning —— 未知**。WB 会跑一次最小真实调用取证（成本很低），结果**追加在本节下方**；**它不到也不阻塞本单** —— J6-1…J6-8 全部只依赖**离线构造**。
- 先报版本：`python -c "import openai;print(openai.__version__)"`。WB 通道实测 **2.53.0**；版本不同 ⇒ **先报差异再动手**（不同版本对未知字段的处理可能不同）。
- 落点根目录**先实测存在**，⛔ 让工具自建空目录 —— 那会让判据全绿而东西落错地方。

### 3 · 交付物

- 代码：`backend/models/llm.py`（两处入口挂钩）＋ 新模块（路径你定）。
- 测试：`backend/tests/` 下新增，⛔ 不触真实库。
- 证据：`_trae-evidence/<块名>/`，含两种响应的 raw 样例、状态标注样例、J6-1…J6-8 逐条读数。
- 回报：写 `exchange/log-trae.md`。

### 4 · 参考件四要素

- ① `backend/models/llm.py:490–527`（流式循环体） ② 读码，看现在只取 `delta.content` / `delta.tool_calls` ③ 作**改动锚点** ④ ⛔ 别照抄它的日志风格（既有代码，改动面越小越好）。
- ① `backend/services/chat_service.py:248–260`（`assistant_msg` 组装） ② 读码 ③ **只用来理解"回传侧缺什么"** ④ ⛔ **本单一个字都不改**。
- ① `docs/la-space/requirements.md` §7 ③ ② 读条款 ③ **拿去对齐语义**（什么算"已存"、什么算"未返回"） ④ ⛔ 不抄实现进 docs —— docs 归千千（J5 在做，你只读）。
- ① **WB 已实测前提**（2026-10-30）：`openai 2.53.0` 下 `ChatCompletionChunk.model_validate` 带 `reasoning_content` ⇒ `getattr(delta,'reasoning_content')` **取得到**、`model_extra` 保留、`model_dump()` 含该键 ② 当既成前提 ③ **只对该版本成立** ④ ⛔ **别据此断言线上一定返** —— 构造出来的东西 ≠ provider 真的给了。
- ① `TODO.md:88` 子项〈实体缺口 · `backend/` 侧 CoT 三处全缺〉 ② 读 ③ 对齐边界 ④ ⛔ 不改 TODO。

### 5 · 场地器材

- 本机 Windows。⚠️ **Bash 通道与 PowerShell 通道可能给不同 python** ⇒ 以你通道实测为准，报版本。
- 用后端现有 venv，⛔ 不新建虚拟环境、⛔ 不改依赖树（本单不需要新依赖；确需则**停手报**）。
- `backend/tests/` 走 pytest；`conftest.py` 已设 `LARRY_CONFIG` → 临时库（Tier0 红线 4 既有实现）。
- ⚠️ **已知假绿坑**：① `CREATE TABLE IF NOT EXISTS` 对已有库不生效（若你临时决定加字段，先想迁移）；② raw 落盘若与测试同路径，测试会**污染真实 raw 目录** ⇒ 判据要能区分"测试写的"与"真会话写的"。

### 6 · 回报格式

结论先行（改了什么 ／ 三态怎么落 ／ raw 够不够）＋ J6-1…J6-8 逐条读数（**命令 ＋ 观测**）＋ 未闭合单列 ＋ **自曝**（跑歪过、判据要订正、对"raw 是否足够"有不同判断，都直接写）。「成因未知」是可接受的结论，⛔ 别为叙事完整编一个。

### 7 · 禁区

- ⛔ **不做回传**：不往 `assistant_msg` 加 `reasoning_content`、不改工具循环的请求组装（B 侧单列）。
- ⛔ 不动 `messages` 表、不写迁移。
- ⛔ 不改 `docs/`（J5 归千千）／不改 `TODO.md`（WB 的）。
- ⛔ 不为省体量丢 chunk、采样、只存首尾。
- ⛔ 不给 `reasoning_content` 做任何"清洗/规范化" —— 原样即证据。
- **只做这一件**，别顺手动 `chat_service.py`。

---

## 📌 已办结 · 测试场地隔离 · 工程化（2026-10-30，`ff9392c` ＋ `3a5146f`）

> WB 2026-10-30 22:40 复验成立（独立复跑 17 条判据名与状态全同；真库指纹跑前／脚本自报／跑后三方同值）。结论落 `TODO.md:89`，派发稿与交付正文已按本区规矩清退。仅留三条**他处零承接**的过程观察：

1. **SDK 通道会吞掉失败原因**：`DeepSeekHarness.run()` 在子进程因断言退出时抛出的文案是 `cannot create effect on inactive context` —— **既无退出码也无 stderr 尾部**。⇒ 判「失败是否由断言引起」必须走**裸起 ＋ `dsh-driver`** 直接取 stderr 原文与退出码；只用 SDK 通道会得到「失败了但说不清为什么」的假读数。⚠️ 与 `docs/dsh/dsh-migration.md:1118`「`-32603` 间歇出现、成因未知」**不是同一件事**：那条是症状留痕，这条是**工具通道的判别力边界**。
2. 断言触发时 dsh 是 **fail-loud**：stderr 一行断言 ＋ 退出码 1，不重试、不静默继续。
3. 复算：`cd harness && $env:S36_PHASE='iso'; node scripts/run-36-memory.mjs`（退出码 0=全绿／1=有红／2=前置缺失）；**不联网、不调模型**（`DEEPSEEK_API_KEY` 在 child env 显式删除）。

⚠️ **判别力边界**：V3／V4 **未调真实模型**（0 token），验的是「插件加载 ＋ 落盘路径 ＋ 协议握手」，**不含**「模型真的说了一句话」。

---

## ✅ 已办结 · `config.example.yaml` 与实例键集合同构（2026-10-29 交付／WB 2026-10-30 复验成立）

> 补 `roles.science`（`color`／`label`／`system_prompt`）＋ `tools.enabled_tools` ＋ `search` 整段；**只往 example 补、未从实例删任何键**。
> WB 独立复算（YAML 递归键路径集合，含容器节点）：**69 = 69**、双侧差集 `[]`、`equal=True`；`example.brave_api_key` 实测 `''`（**模板零真值**）；凭据形态 **0 命中**。
> ⇒ `TODO.md:240` 已同步为 ✅。⚠️ 键路径计数 69 ≠ TODO 原记的 51：那是口径差（本次含容器节点），**缺口数 11 两边一致**。回溯 `git log -p -- exchange/log-trae.md`。

---

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

- **2026-10-30（WB）**：删〈📮 派发 · 测试场地隔离〉＋〈✅ 交付 · 测试场地隔离〉＋〈✅ 交付 · `config.example.yaml`〉**共 134 行**（227→93）。判据 ＝前两块 WB 22:40 复验成立（结论落 `TODO.md:89`）；后一块 WB 独立复算 69=69、模板零真值、零凭据（落 `TODO.md:240`）。**仅保留他处零承接的〈SDK 通道吞掉失败原因〉三条**。回溯 `git log -p -- exchange/log-trae.md`。
