# Trae 协作区

> **属主 = 沈知砚(Trae)**,本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **测试场地隔离 · 工程化**（W1 相对解析 ／ W2 启动断言 ／ W3 自检可证伪） | **Trae** | `harness/packages/plugin-s4-memory/src/index.ts` ＋ `harness/scripts/run-36-memory.mjs`（iso 相） | ✅ **已复验成立（WB 2026-10-30 22:40，带 2 条增量）**：`ff9392c` ＋ `3a5146f`，改动面无越界；**WB 独立复跑 17 条判据名与状态全同**；真库指纹**跑前（WB 亲取）／脚本自报／跑后（WB 亲取）三方同值** `16089de3…fa7446`、`mtime=15:01:18.815`；进程排除通道经 WB 独立验证（`[]` 是真零匹配、非枚举失败）；Tier0 零命中。⚠️ **增量①**：既有 `j0` 相 `EEXIST: symlink` **不可复跑** —— 经比对 `mountPlugin` 在 `ff9392c^` 与当前**一字未变** ⇒ **既存老化、⛔ 非本单引入**。**增量②**：V1 用「临时 home ＋ 装置原配置」**重放下午那次事故**，是负向哨兵的正确形态。判别力边界：V3／V4 未调真实模型（0 token）。结论已进 `TODO.md:89` | 2026-10-30 |
| — | — | — | **（上一块已清零）** 2026-10-28：DSH-3.10 已归档 → `archive/roadmap-history.md`「2026-10-20 办结」；适配判断／剪枝复检已随 `docs/la-space/` 定稿承接，原段按活日志规矩清理；**硬件分项账已承接 → `local-env.md` §14 ＋ `production-env.md` §2.5，原段同日清除**。⚠️ **另一活账＝〈📥 过程观察 · DS 通道复测〉末两条待处置** | — |

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

## 📮 派发 · 测试场地隔离 · 工程化（1 件）——（WB · 2026-10-30 21:40）

> 来源条目：`TODO.md:89`〈⭐ 测试场地隔离 · 工程化〉（2026-10-30 立，**老大批「要立的，这个重要的」**）。
> 性质：**Tier0 红线 4 的代码化**。红线 4 原文是「测试前自动断言 DB 路径为临时库，指向真实库直接 fail」——**目前它只是一句话，代码里没有这个断言。**

### 一、为什么是你（不是阿衡）

这是**代码实现**活，按分工 Trae = 全部代码实现。阿衡的活（独立复验）**排在本单交付后单发**，理由不是分工洁癖：**10-16 已经撞过一次车**（`log-claude.md:18`：共享工作树 ＋ 同一暂存区，双方互带对方未提交改动）。两个 AI 同时动同一个 repo，撞出来的收拾成本比省下的时间贵得多。

### 二、现状（🟢 2026-10-30 实测，非推测）

| 位置 | 事实 |
|---|---|
| `plugin-s4-memory/src/index.ts:38` | `dbPath: string` —— **必填、无默认** |
| `:95` | `if (!cfg.dbPath) throw` —— 只判**空**，不判**指向哪儿** |
| `:98` | `new DatabaseSync(cfg.dbPath)` —— **原样使用，无任何解析** |
| `.dsh-home/profiles/sdk/cordis.patch.yml:27` | `dbPath` 是一个**绝对路径值**，指向 `.dsh-home/larry-memory.db` |
| `.gitignore:40` | `.dsh-home/` 整目录不入库（`git ls-files .dsh-home` = **0**） |

**10-30 当场事故**：新建临时 home（`DSH_HOME` 指过去、`sessions/` 为空、无 db），跑两轮 ⇒ ① 临时 home 内**未生成任何 db**；② `.dsh-home/larry-memory.db` **mtime 被更新**。

⇒ **换 home ≠ 换库。** 这不是"配置写错了"，是**库路径与 home 之间没有任何绑定关系，全靠人记得去改配置**。

### 三、三件活儿

**W1 · `dbPath` 支持 home 相对解析**
- 相对路径 ⇒ 按**当前 DSH_HOME** 解析成绝对路径；
- 支持 `${DSH_HOME}` 占位替换；
- ⛔ **不得写死 `os.homedir()`**；"当前 home 从哪儿拿"由你实测决定（`ctx` 上有没有、还是 `process.env.DSH_HOME`），交付里写明依据。

**W2 · 启动断言（fail，不是 warn）**
- 解析后的绝对路径**不落在当前 DSH_HOME 之内** ⇒ 抛错退出。
- ⚠️ **这里有个坑，别踩**：插件头注释写着「装置臂控；**哨兵臂指向 DSH 默认后端位置**」⇒ **装置本身可能就有意把 dbPath 指到 home 之外**。断言若无豁免通道，会把装置自己打死。
- ⇒ 必须留**显式豁免**（配置项，如 `allowOutsideHome`），且豁免时**打一行可审计日志（含解析后的绝对路径）**。⛔ 静默通过 ＝ 本单白做。

**W3 · 自检可证伪**
- "配错 ⇒ 必 fail" 这条，你得给出**确定能触发的路径**，不是"理论上会"。判据见 V2。

### 四、判据（4 条，全部可复算）

| # | 操作 | 通过条件 |
|---|---|---|
| **V1** | 临时 home（`sessions/` 空、无 db）跑一轮；跑前记真库 `sha256` ＋ `mtime` | 跑后**两者均不变**。⛔ 不看退出码、⛔ 不看插件自报日志 |
| **V2** | `dbPath` 配成**另一个 home** 的路径，**不豁免** | 进程**非零退出**，stderr 含断言行 |
| **V3** | 同上但**显式豁免** | 进程正常，stderr 有豁免审计行且**含解析后绝对路径** |
| **V4** | `dbPath` 写相对路径（落在当前 home 内） | 实体文件出现在 `<当前 home>/<相对路径>` —— 用 `find`／`ls` 核**磁盘实存**，⛔ 不看日志 |

⚠️ **V1 的坑**：真库可能被**别的进程**写（比如你自己开着的 dsh）。⇒ 跑之前先确认没有其他 dsh 进程在跑，否则 mtime 变了说不清是谁写的。**这条要在交付里交代怎么排除的。**

### 五、边界（⛔ 不许做）

1. ⛔ **不动 `.dsh-home/`**。它 gitignore、是本地装置现场。配置那行改不改、怎么改，由 WB／老大在装置侧处理，**不进你的提交**。
2. ⛔ **不改 `recallLimit`／召回 SQL**（`LIMIT 8 ORDER BY id DESC`）。那是 **P0② 的活、另派**。本单只做"库往哪儿落"，不做"取哪些"。
3. ⛔ **不改装置的臂设计**（哨兵臂指哪儿照旧）——只加"解析 ＋ 断言"能力，不改装置行为。
4. ⛔ 不引入新依赖。

### 六、依据分级（照 J4 同一规矩）

- **A 级｜老大原话**：只一句 —— 2026-10-30「要立的，这个重要的」。
- **B 级｜WB 推论**（⛔ 不得署成"老大定"）：三件活儿的切法、"fail 而非 warn"；**豁免通道那条冲突是我推的**——你若实测发现装置根本没有"指到 home 之外"的情形，可以回来砍掉 W2 的豁免部分，但**先给读数再说**。
- **C 级｜禁入**：本单不涉及会话层归属、不涉及三层框架（边界／存储／召回），都还在讨论中 ⇒ ⛔ 一条都别写进代码注释。

### 七、交付与回报

1. 提交（署名 Trae）。
2. 回报写本文件：V1–V4 **逐条读数** ＋ `git status` 收尾读数。
3. 回报里**必须有那句**"其余 dsh 进程已排除" ＋ 你怎么排的。
4. ⛔ 不许只写"已实现、测试通过"。

### 八、与 P0② 的关系

W1+W2 是 **P0② 的硬前置**：② 要造 20+ 条库验语义命中，**场地不隔离 ⇒ 直接写进真库**（10-30 已发生一次）。本单交付后 ② 才能开工。跳过 ＝ 拿脏库当证据。

---

## ✅ 交付 · 测试场地隔离 · 工程化（Trae · 2026-10-30 22:02）

> 提交 `ff9392c`（author `Trae <dancingfire@live.cn>`，`-c user.name` 单次签名）。
> ⚠️ 该提交 subject 首行带一个 UTF-8 BOM（PowerShell 5.1 写提交消息临时文件所致，`git log` 首字符可见 `﻿`）。已提交内容无影响；按「不擅自改写历史」未 amend，留痕于此。
> 改动面 = 2 个文件：`plugin-s4-memory/src/index.ts`（新增 home／dbPath 解析＋断言＋豁免；旧 `new DatabaseSync(cfg.dbPath)` 改为解析后的路径）＋ `run-36-memory.mjs`（新增 `iso` 相）。证据目录（仓外）：`D:\Code\_trae-evidence\36\run-iso\`（`findings.json` ＋ 各臂 stderr 原文 ＋ 真库指纹）。

### 一、W1 · 当前 home 从哪儿拿（实测依据，非照抄）

| 候选 | 实测 | 结论 |
|---|---|---|
| `ctx` 上的 home 服务 | 在 `dsh/lib` 里检索 `provide('home'`／`provide('paths'`：**零命中** | 上游没有 home 服务可读 |
| `@deepseek-ai/dsh-home-paths`（上游正本解析器） | 在 `harness/packages/plugin-s4-memory` 下 `import()` ⇒ `ERR_MODULE_NOT_FOUND`；harness 工作区顶层亦无此包 | 要它就得加依赖，⛔ 本单禁 |
| `process.env.DSH_HOME` | dsh 自身解析 home 也走这条（`profile-boot`:117 调 `resolveDshHome()`） | **主来源** |

⇒ 本地复刻上游同一口径（`dsh-home-paths:resolveDshHome`）：**`$DSH_HOME`（trim 后非空）＞ `os.homedir()/.dsh`**；**空白视同未设**（否则 `resolve('')` = cwd，是上游文档点名的坑）。⛔ 没有把 `os.homedir()` 当主来源——它只在 env 未设时按上游默认值兜底。

配置侧支持两形态：相对路径（按当前 home 解析）、`${DSH_HOME}` 占位（先替换再解析）；绝对路径原样只做 `resolve` 归一。

### 二、W2 · 断言（fail，不是 warn）＋ 显式豁免

- 解析后的绝对路径**不落在当前 home 之内** ⇒ `stderr` 写一行断言（`[S36-MEMORY] dbPath outside home (denied): dbPath=<解析后绝对路径> home=<当前home>`）**并 `throw`**（进程退出码 1，不是降级继续）。
- 豁免通道 `allowOutsideHome: true` ⇒ 放行，但**每次启动**在 `stderr` 打审计行（`… (allowed by config.allowOutsideHome): dbPath=… home=…`，含解析后绝对路径）。⛔ 静默通过不存在。
- **W2 那条冲突（WB 自己标为 B 级推论）实测结果**：装置现配置 `dbPath = D:/Code/LarryAgent/.dsh-home/larry-memory.db` **落在 home 之内**（home 就是 `.dsh-home`），所以生产部署不触发断言；豁免通道保留（V3 臂证明它可用且有痕）。附加回归臂 V4-b 专验这一点。

### 三、V1–V4 逐条读数（本机 · 2026-10-30 21:57 一轮，`S36_PHASE=iso`）

**前置｜其余 dsh 进程已排除**：用 PowerShell `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` 取**全部 node 进程命令行**，过滤「除本进程外、命令行含 `bin.js` 且含 `--profile`」项 ⇒ **跑前 ×0**、**跑后 ×0**（`ISO-procs-before.json`／`ISO-procs-after.json` 原文在证据目录）。即：真库在本轮内的所有变化只可能来自被执行的臂。

| # | 读数（原文摘要） | 判 |
|---|---|---|
| **V1** | 临时 home ＋ 装置原配置（`dbPath`＝真库绝对路径）裸起：`exit=1`、`ms=1621`、stderr 含断言行；真库 `sha256=16089de3…fa7446`／`mtime=2026-10-30T07:01:18.815Z`／`size=24576` **跑前跑后逐项相同**；临时 home 内**未生成任何库文件**（断言在 `new DatabaseSync` 之前） | 🟢 |
| **V2** | `dbPath` 指另一个临时目录、不豁免：`exit=1`、`signal=null`、`ms=1421`；stderr 首行即断言（`dbPath=D:\Temp\…\larry-memory.db home=D:\Temp\…`）；该另一 home 的库文件**未被创建** | 🟢 |
| **V3** | 同上 ＋ `allowOutsideHome: true`：进程 `code=0`、`forced=false`、`killCalled=false`、`shutdown.ok=true`；stderr 有审计行且**含解析后绝对路径与当前 home**；库实体真实出现在该外部路径（`size=16384`）；协议侧 `initialize` 成功、`prompt` 受理 | 🟢 |
| **V4** | `dbPath: 'larry-memory-rel.db'`（相对）：磁盘实存 `<当前 home>/larry-memory-rel.db`（`size=16384`），库内 1 行且含本轮 nonce；仓库 `.dsh-home` 下**未出现**同名库 | 🟢 |
| **V4-b**（附加回归，非派发判据） | `dbPath` = home 内**绝对路径**（＝生产形态）：会话正常、库实体 `size=16384` | 🟢 |

整轮收尾真库指纹复读：`sha256`／`mtime` 与 V1 跑前完全一致（`ISO-real-db-final.json`）。

### 四、过程观察（事实，供裁定）

1. **SDK 通道会吞掉失败原因**：`DeepSeekHarness.run()` 在子进程因断言退出时，抛出的文案是 `cannot create effect on inactive context`——**既无退出码也无 stderr 尾部**。若按最初的写法只用 SDK 通道判 V1「失败是否由断言引起」，会得到「失败了但说不清为什么」的假读数（我第一跑就是这么红的，判据本身把它拦下了）。⇒ V1/V2/V3 改走**裸起 + `dsh-driver`**，直接取 `stderr` 原文与退出码。
2. 断言触发时 dsh 的行为是 **fail-loud**：stderr 一行断言 ＋ 退出码 1，不重试、不静默继续。
3. 复算方式：`cd harness && $env:S36_PHASE='iso'; node scripts/run-36-memory.mjs`（退出码 0=全绿／1=有红／2=前置缺失）。该脚本**不设 key、不联网调用模型**（`DEEPSEEK_API_KEY` 在 child env 显式删除）。

### 五、边界遵守

⛔ 未动 `.dsh-home/`（`cordis.patch.yml:27` 那一行**没改**，留 WB／老大在装置侧处置：改成相对路径或 `${DSH_HOME}/larry-memory.db` 都能被本单支持）；⛔ 未动 `recallLimit`／召回 SQL；⛔ 未改哨兵臂设计；⛔ 未引入新依赖（只用 `node:os`／`node:path`）。

### 六、`git status` 收尾读数

```
（本次提交后）M exchange/discussion-ai-constraints.md
```
该文件是**他人并发改动**（苏星野讨论稿 v3），**未暂存、未提交**——本单提交只含上列 2 个文件（`git diff --cached` 核过）。

---

## ✅ 交付 · `config.example.yaml` 补齐至与实例键集合同构（Trae · 2026-10-29）

> 触发：老大口头「顺手补上」（非正式派发）；来源条目 = `TODO.md`〈待派发〉🔵 `config.example.yaml` 与实例键集合同构（**TODO 归 WB，我未改其状态**）。
> ⚠️ 开工前先实测复核过「是不是已经解决了」：**没有**——`git log` 该文件最后改动仍是 `8e26920`（09-10），键比对只缺不多，缺口 **11** 个。

**改法（⛔ 只往 example 补，未从 `config.yaml` 删任何键）**：补 `roles.science`（`label`／`color`／`system_prompt`，原文照抄）＋ `tools.enabled_tools`（三值全列 ＋ 注释注明「留空 / 不写 = 全部启用」＋ 可用值清单）＋ `search` 整段（`brave_api_key` 空占位，其余键按 `config.py:71-78` 的默认值写并注明）。⛔ 模板内**零真值**：`git diff` 逐行核过，只新增键与注释。

**读数（本机 · Trae 通道 · 实跑）**

```
yaml_keys=69 example_keys=69 equal=True
only_in_yaml=[]        only_in_example=[]
LOAD_OK roles=code,default,finance,health,science enabled_tools=file_ops,shell,web_search search_provider=brave brave_key_len=0
```

- 比对法：递归收集两文件全部键路径（含容器节点）后集合相减；⛔ 未打印任何值（`brave_key_len=0` 即模板空值的佐证）。
- 第二条把 `LARRY_CONFIG` 指向 **example** 跑 `load_config()` ⇒ 模板本身能被 `Config` 完整解析（`science` 角色、`enabled_tools`、`search` 均落到 dataclass）。
- ⚠️ 键路径计数 69 ≠ TODO 记的 51：TODO 那组是 WB 脚本口径（不含容器节点），本次口径含容器；**缺口数（11）两边一致**。

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

- **2026-10-29（WB）**：删〈📮 派发 · dev 上锁 ＋ 配发钥匙（甲案）〉**整块 309 行**（派发稿 J1–J7 ＋ 回报 ＋ WB 复验 ＋ J6 闭环）。判据 ＝ 结论已承接：甲案裁定 ＋ 落地内容 ＋ **WB 复验九项读数** ⇒ `docs/deployment-architecture.md` §5.2（`:181-184`）；鉴权定性／`/health` 契约 ⇒ 同档 §5.1；`chat.html` 退役 ⇒ §5.3；CVM 判定 ⇒ §5.4；过程留档 ⇒ `archive/roadmap-history.md`〈2026-10-29 办结〉（提交 `b738b1c`）。⚠️ 块内自曝的「**越界实跑**（首轮实例漏带 `LARRY_CONFIG` 打开真库）」教训**不随本段丢**：其结论已是 Tier 0 第 4 条「测试隔离＝程序性强制」的来源之一，见 `docs/ai-governance.md:45`／`:49`／`:183` ＋ `backend/tests/conftest.py`。保留：〈📥 过程观察 · DS 通道复测〉（活，含两条待处置）＋ 通用纪律 9 条 ＋ 两条活账。回溯 `git log -p -- exchange/log-trae.md`。
- **2026-10-28（WB）**：三轮清扫，删 5 段（DSH-3.10 派发／回报／复验、补调研接单＋适配判断、剪枝复检派发／回报）＋〈评估 · 当前方案的硬件需求〉**62 行**；判据 ＝ `157 MB`／`109–168 MB`／`1.2–1.8 GB`／`7–8 GB`／48 GB 换代／单盘边界逐项在档（承接落 `local-env.md` §14 ＋ `production-env.md` §2.1／§2.5、`archive/roadmap-history.md`，提交 `334d7ef`）。保留：〈📥 过程观察 · DS 通道复测〉（活，含两条待处置）＋ 通用纪律 9 条 ＋ 两条活账。回溯 `git log -p -- exchange/log-trae.md`。
