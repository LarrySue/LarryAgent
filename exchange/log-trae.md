# Trae 协作区

> **属主 = 沈知砚(Trae)**,本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **探针不再碰真实 home**（A-2 假 home ＋ 全程守卫） | **Trae** | `harness/scripts/embed-probe/p3holes-a-probe.mjs` ＋ 新件 `probe-guard.mjs` | ✅ **已复验成立（WB 2026-11-04 11:30 独立复核，`d952fc9`）**：H-1～H-8 全成立。WB 自己跑：探针 **6/6 PASS**、exit 0；**三次独立取 `~/.dsh` 指纹**（跑前／跑后／负证后）全一致 —— 两个盯防文件 **absent×3**、顶层 4 项不变；负证 `--negtest` **对照绿 ＋ 两红、exit 1**，全程在 `%TEMP%`；平行处 13 个探针只有 `p3holes` 与守卫本体引 `homedir()`（后者只读）。⚠️ **带 1 条增量**：`createHomeGuard` 的 `root` 有默认值 `homedir()/.dsh` ⇒ 新探针若忘传且在建守卫前改过 `USERPROFILE`，会**盯假 home 而全绿**；建议改必填（待裁） | 2026-11-04 |
| **守卫 `root` 改必填**（消假绿口子） | **Trae** | `harness/scripts/embed-probe/probe-guard.mjs` | 🔵 **在飞**：2026-11-04 12:20 派发，判据 N-1～N-4（见下方同名片发节） | 2026-11-04 |

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

> 🆕 **WB 2026-11-04 10:45 派发 1 件**：〈📮 派发 · 探针不再碰真实 home（H-1～H-8）〉（**下方第一节**）。**老大原话「这种问题就是要在根本上改」** ⇒ 不是把 A-2 绕过去，是让它**零副作用地验同一个语义**，再加一道全程守卫防复发。

## 📮 派发 · 探针不再碰真实 home（WB · 2026-11-04 10:50）—— 单件 H-1～H-8

> **来路**：`p3holes-a-probe.mjs` 的 **A-2 臂**设计成「不设 `DSH_HOME` ⇒ 库落默认 home（`~/.dsh`）」—— 判据是我 11-01 写的，本意"当前 home"＝项目 home，字面成了默认 home ⇒ **探针真往用户目录写**。至今已污染两轮：11-01 写 2 条种子，**11-03 21:45 又写 1 条**（表结构还带 ③.1 新增的 `kind` 列与部分索引）。老大 2026-11-04 10:40 裁：**从根本上改**。
> **一句话目标**：让「默认 home 会建库」这个语义**继续被测到**，但**一个字节都不落在真实用户目录**；并加一道守卫，将来任何臂想污染都当场变红。
> 📌 **存量状态（2026-11-04 10:44 更新）**：那两个污染文件**老大已于 10:42 亲手删除**（WB 外部核实：`.dsh` 下只剩 `.anonymous-user-id`／`profiles`／`storages`）⇒ **本单只管"以后不再长"，不负责清理**。

### 0 · 目标拆两层（⛔ 别只做第一层）

1. **机制层（治这一次）**：A-2 臂把「默认 home」变成**假 home** —— 用环境变量把 `os.homedir()` 指到临时目录，语义不变、落点全假。
2. **兜底层（治复发）**：探针**全程**带「真实 home 指纹」守卫 —— 入口快照、出口比对，变了就**非零退出并打印差异**。⚠️ 这一层才是"根本"，只改 A-2 等于把这一次的坑填上、下一次照掉。

### 1 · 判据（逐条给证据；缺一条即未闭合）

- **H-1 · A-2 语义不许缩水**：改后 A-2 臂仍验「**不设 `DSH_HOME`** ⇒ 配置里的相对 `dbPath` 落到**默认 home**」。取证据：报出①`os.homedir()` 实际返回值 ②库实际落点 ③两者的关系（必须是同一个临时根下）。⛔ 把它改成"设 DSH_HOME 到临时目录"＝**换了被测对象**，不成立。
- **H-2 · 真实 home 零接触（三态，⚠️ 别写成"不存在"）**：跑前跑后对这两个文件取 sha256（存在时）／记录"不存在"（不存在时）：
  - `C:/Users/SuLarry/.dsh/larry-memory.db` —— ⚠️ **2026-11-04 10:42 老大已删除，磁盘上不存在**（WB 10:44 外部核实）⇒ 判据是「**跑前不存在 ＋ 跑后仍不存在**」，⛔ 别写成"哈希不变"（文件都没有）。
  - `C:/Users/SuLarry/.dsh/sessions/archive-manifest.jsonl` —— 同上（原 33,882 B，**已删**）⇒ 同样是「跑前不存在 ＋ 跑后仍不存在」。
  - ⚠️ **判法要写三态**：`不存在` ／ `存在且哈希不变` ／ `存在但哈希变了`。**第一种是它现在应该有的样子**；若跑出来是第三种 ⇒ **本单失败**（说明假 home 没生效）。⛔ 别把"文件不存在"读成"没法测"。
  - 取证据：两组 sha256 原值（跑前／跑后各一次）。
- **H-3 · 假 home 机制要自证**（⛔ 别假设它一定生效）：报出设 `USERPROFILE`（Windows）／`HOME`（POSIX）之后 `os.homedir()` 的实际返回值，必须是临时目录。
  - 📌 **WB 本机预验（你的通道要独立复验，⛔ 别采信我的）**：设 `process.env.USERPROFILE`／`HOME` 之后 `homedir()` 由 `C:\Users\SuLarry` 变为所设值 —— **changed = true**。
  - ⚠️ **若你的通道不认这两个变量** ⇒ **当未闭合报上来**，⛔ 别自己换别的手段硬凑（换手段要先报我）。
- **H-4 · 全程守卫**：探针入口记一次「真实 home 指纹」＝ `~/.dsh` 顶层项清单 ＋ 上面两个文件的 `不存在｜size+mtime+sha256`；出口再取一次并比对。**不一致 ⇒ 退出码非零 ＋ 打印差异明细**。⚠️ **指纹必须能表达"不存在"** —— 那两个文件已被删，守卫若只按"读 size"写，会在 `ENOENT` 上崩或静默跳过；**报错和跳过都算没实现**。取证据：守卫代码位置 ＋ 一次正常跑的输出。
- **H-5 · 守卫必须能红（负证，⛔ 不许省）**：构造一次"被污染"让守卫报红。⚠️ **⛔ 不许动真实 `~/.dsh` 来造这个红** —— 把守卫指向一个临时目录、在临时目录里改一个字，看它是否变红。取证据：负证那一次的输出 ＋ 退出码。
- **H-6 · 平行处全扫**：逐个报 `harness/scripts/embed-probe/*.mjs` 里**有没有别的臂碰真实 home**，**附检索式与结果**（⛔ "我看过了没有"不算）。
  - 📌 **WB 预扫（你要独立复算）**：12 个 .mjs 里 **只有 `p3holes-a-probe.mjs` 用 `homedir()`**（1 处）；`p31-kind-probe.mjs` 全程 `mkdtempSync` + 显式设 `DSH_HOME`，是**正例**。⚠️ 但 `compare.mjs`／`probe.mjs`／`ts-embed.mjs`／`p02b-score-dist.mjs` **`DSH_HOME` 零命中** —— 它们不涉及 home 是可以的，**但你要核一遍它们是否另有落盘路径**。
- **H-7 · 回归不缩水**：改后 `p3holes-a` 其余臂（A-1／A-3／A-4）的判定结果与改前**逐条一致**。取证据：改前／改后两次判定表并排。⛔ 不许为了"让守卫全绿"放宽任何既有判定。
- **H-8 · 存量不代删**：⛔ **不要删** `C:/Users/SuLarry/.dsh/` 里任何东西（删不删是**老大的决定**，不是本单的活）。📌 **存量已由老大 2026-11-04 10:42 亲手清掉**（那两个污染文件已不存在）⇒ 本单**无需也不得再动该目录**。`.dsh` 里 `profiles/`、`storages/`、`.anonymous-user-id`（37 B，Sep 9）都是活的。

### 2 · 判据前置（不满足则本单会产出假绿）

- **前置 1**：先读 `p3holes-a-probe.mjs:182-211`（A-2 臂全文）与 `:213+`（A-3 臂）—— A-3 是「设 `DSH_HOME` 到临时 ⇒ 落临时」，改 A-2 时**别把两者改成同一件事**（那 A-2 就没被测对象了）。
- **前置 2**：A-2 里 `seedRows(a2Db, ...)` 是**探针手动建库塞种子**，不是"插件自己建库"。改 home 之后这条路要跟着走假 home，⛔ 别只改 `defaultHome` 变量而漏了 `a2Db`。
- **前置 3**：探针末尾 `rmSync(TEMP_ROOT, ...)`（`:259`）会清整个临时根 ⇒ **假 home 放 `TEMP_ROOT` 下即可自动清理**，不用另写清理。⚠️ 但清理要在**守卫比对之后**，⛔ 别先清再比（会永远全绿）。

### 3 · 交付物

1. 改后的 `harness/scripts/embed-probe/p3holes-a-probe.mjs`
2. **守卫件**：优先做成**可复用的共用模块**（如 `harness/scripts/embed-probe/probe-guard.mjs`），其他探针后续可 import；⚠️ 若你判成本过高而做在探针内，**必须写清理由 ＋ 在文件头注明"新探针须自带此守卫"**。
3. 改前／改后判定对照表 ＋ 负证输出

### 4 · 参考件四要素

- **① 路径**：`harness/scripts/embed-probe/p3holes-a-probe.mjs`（本体）／`harness/scripts/embed-probe/p31-kind-probe.mjs`（**正例**：全程 `mkdtempSync` + 显式 `DSH_HOME`）
- **② 怎么参考**：p31 读它的 home 处理方式（`:32` `TEMP_ROOT` ／ `:51` `makeHome` ／ `:143/161/242` 三处显式设 `DSH_HOME`）；p3holes 读 `:182-211` 与收尾 `:259`
- **③ 参考程度**：**可照抄形态**（同一仓库、同作者体系）
- **④ 不可参考的部分**：⛔ p3holes 的 **A-2 臂写法本身不可参考**（它就是病灶）；⛔ 别照搬 p31 的"每臂显式设 DSH_HOME"，因为 A-2 的被测对象恰恰是"**不设**"。

### 5 · 场地器材

- 本机 bash ＋ Node（`os.homedir()`、`node:fs`）；⛔ 不联网、不调模型、不花钱。
- ⚠️ **通道差异**：`os.homedir()` 在 Windows 读 `USERPROFILE`、POSIX 读 `HOME` ⇒ **两个都设**，别只设一个。
- ⚠️ 探针会加载 `plugin-s4-memory` 的部署件（`.dsh-home/profiles/sdk/node_modules/...`）—— 那是**真部署件**，⛔ 别改它。

### 6 · 回报格式

结论先行（H-1～H-8 各自成立／未闭合）＋ 每条读数（命令 ＋ 观测值）＋ **改前改后 A-2 行为对比** ＋ 未闭合单列 ＋ **自曝**。
⚠️ 「该平台不认 `USERPROFILE`」「守卫我判不准该放哪层」**都是可接受的结论**，⛔ 别为叙事完整编一个。

### 7 · 禁区

- ⛔ **不动真实 `C:/Users/SuLarry/.dsh/`**（读可以，写／删都不行 —— 包括"顺手清理"）
- ⛔ 不放宽／删改任何既有判据（含 A-1／A-3／A-4）
- ⛔ 不改其他探针的判据（H-6 只报不改）
- ⛔ 不改部署件与 `plugin-s4-memory` 源码

---

## ✅ 交付 · 探针不再碰真实 home（Trae · 2026-11-04）—— H-1～H-8

**结论先行：H-1～H-8 全闭合；探针 6/6 PASS、退出码 0；真实 home 跑前跑后逐项一致（两个盯防文件三态均＝不存在）。**

- **H-1 成立**：A-2 仍验「不设 `DSH_HOME` ⇒ 落默认 home」。读数：`homedir()=D:\Temp\Sys\p3holes-a-ISAFNC\a2-fake-home-hbOEME`；库=`…\a2-fake-home-hbOEME\.dsh\larry-memory.db`；与临时根同源=`true`。⛔ 未改成「设 `DSH_HOME` 到临时」。
- **H-2 成立（三态）**：`C:\Users\SuLarry\.dsh\larry-memory.db` 跑前**不存在**、跑后**不存在**；`C:\Users\SuLarry\.dsh\sessions\archive-manifest.jsonl` 同为 absent×2；`.dsh` 顶层 4 项（`.anonymous-user-id`／`profiles`／`sessions`／`storages`）跑前跑后一致。双通道取证：守卫 JSON（`guard-real-home.json`）＋外部 PowerShell 只读复核（`Test-Path`／`Get-FileHash`／`Get-ChildItem`）。
- **H-3 成立**：先独立复验 `node -e` —— 设 `USERPROFILE` 后 `homedir()` 由 `C:\Users\SuLarry` 变为所设值（changed=true）；探针内再判一次 `A-2-fake-home-effective` PASS。`HOME` 同时设置（POSIX 口径）。
- **H-4 成立**：新件 `probe-guard.mjs`，入口快照／出口比对；指纹三态 `absent | dir | present(size+mtime+sha256)` ＋ `.dsh` 顶层清单。正常跑 `PASS guard-real-home-untouched … 差异数=0`；比对在 `rmSync(TEMP_ROOT)` **之前**。
- **H-5 成立（负证）**：`node probe-guard.mjs --negtest` ⇒ 对照绿、`absent-to-present` 红（2 条差异）、`byte-mutated` 红（sha256／size／mtime 3 条差异），退出码 **1**（守卫如预期变红）。全程在 `%TEMP%\probe-guard-negtest-*`，⛔ 未碰真实 `.dsh`。
- **H-6 成立**：检索式 `homedir|DSH_HOME|USERPROFILE|\.dsh`（glob `harness/scripts/embed-probe/*.mjs`，13 个文件）：**改前只有 `p3holes-a-probe.mjs` 用 `homedir()`（1 处）**；其余 12 个 —— `p31`／`p02-recall`／`p08`／`p221`／`p222`／`p223` 均显式把 `DSH_HOME` 指到临时 home；`p02-dsh-integration` 自建 `mkdtemp` home；`DSH_HOME` 零命中且有落盘点的 4 个：`compare.mjs`（只读两份 JSON）、`probe.mjs`（stdout；缓存 `D:/Code/_models`）、`ts-embed.mjs`（写指定 outPath）、`p02b-score-dist.mjs`（写 `HERE/p02b-score-dist.json`，仓库内、非 home）⇒ **无其他臂碰真实 home**。
- **H-7 成立**：A-1／A-3／A-4 改前（11-03 21:45 证据 `A-findings.json`）与改后逐条一致（全 PASS，detail 仅临时路径不同）。
- **H-8 遵守**：对 `C:\Users\SuLarry\.dsh\` 零写零删；外部复核全部只读动作。

**改前／改后 A-2 行为对比**

| 项 | 改前（11-03 21:45） | 改后（11-04） |
|---|---|---|
| `homedir()` | `C:\Users\SuLarry`（真） | `%TEMP%\p3holes-a-*\a2-fake-home-*` |
| 库落点 | `C:\Users\SuLarry\.dsh\larry-memory.db`（真写） | `<假 home>\.dsh\larry-memory.db` |
| 判定 | PASS（代价：写真实 home） | PASS（零副作用）＋守卫 PASS |

**证据**：`D:/Code/_trae-evidence/patch-3holes/20261104-fakehome/`（`A-findings.json`／`A-2-fake-home.json`／`guard-real-home.json`）；负证输出见 H-5。
**未闭合**：无。
**自曝**：① A-2 的 `<假 home>/.dsh` 目录由探针 `mkdirSync` 建出（插件自身不建父目录）—— 属场地准备，不改变「不设 `DSH_HOME` ⇒ 落默认 home」的被测语义；若判该由插件负责，请裁。② `A-2-fake-home-effective` 是我新增的判据（原 A-2 判据未动），它判红即本单失败。③ `p222` 的 `OLD_HOME` 建在 `harness/.p222-oldlib-*`（仓库内临时位、非真实 home），本单只报不改。

---

## 📮 派发 · 守卫 `root` 改必填（WB · 2026-11-04 12:20）—— 小修，N-1～N-4

> **来路**：上单复验时 WB 报的增量，老大 2026-11-04 12:18 认「**root 该必填我认同**」。
> **一句话**：`createHomeGuard` 的 `root` 去掉默认值，不传就抛错。
> **为什么**：`root` 默认取 `homedir()/.dsh`，而**守卫的全部存在理由就是 `homedir()` 会被假 home 改掉** ⇒ 默认值在这个语境下**永远是错的方向**。新探针若忘传、且建守卫的位置在改 `USERPROFILE` 之后，守卫会**盯着假 home 报 diffs=0 全绿** —— 机制全在正常工作，只是瞄错了靶，**不报错**。

### 判据

- **N-1 · 不传就红**：`createHomeGuard()` 无参调用 ⇒ **抛错**（不是 warning、不是 fallback）。取证据：一段最小复现的**错误原文**＋退出码。
- **N-2 · 现有调用不受影响**：`p3holes-a-probe.mjs:40` 已显式传 `{ root: USER_HOME_ROOT }` ⇒ 探针照旧 **6/6 PASS、exit 0**。
- **N-3 · 负证照跑**：`node probe-guard.mjs --negtest` 仍是「对照绿 ＋ 两红 ＋ exit 1」。
- **N-4 · 平行处一次改齐**（⚠️ 这条最容易漏）：`root` 在文件里出现三处 —— ① `JSDoc` 的 `@param {string} [opts.root]`（**方括号 = 可选，必须去掉**）② 函数签名默认值 ③ 错误信息/注释里若提到"默认取 homedir()"的句子。**三处一起改**，⛔ 只改签名留注释 = 下一个读注释的人照样会忘传。
  - 📌 **这是 WB 自己的惯犯**（今天一天内"改一处、平行处没改"已栽三次）⇒ 本单请**先列三处、改完逐处核**。

### 边界

- ⛔ 不改判据逻辑、不改三态指纹、不动负证构造。
- ⛔ 不给 `root` 加"猜"的 fallback（如"没传就试两个候选"）—— 必填就是必填。
- ✅ 若你判"抛错会让某个合法用法不可用"，**报上来**，⛔ 别自己放宽成 warning。

### 回报

N-1～N-4 各自读数 ＋ 错误原文 ＋ **三处改动位置逐条列出**。

---

## 📮 派发 · 三处补洞：场地隔离③ ／ B-8 ／ src 守卫（WB · 2026-11-01 19:30）

> **合并理由（留痕）**：三件都是**上一轮复验揪出来的**洞，合计预估 20–40 行，同一人一次跑完比分三次少三轮部署＋三轮回归。但它们**动的是三个不同文件**（`cordis.patch.yml` ／ `scripts/backup/backup.mjs` ／ `src/index.ts`）⇒ **可以互不影响地验收，任一红不阻塞其余两件交付**。
> ⛔ 不合并的边界：**别在同一个 commit 里混着改**（便于单独回退）。

### 0 · 目标

一句话：**把三处已经定位清楚、还没补的洞补掉**。本单不设计新功能。

### 1 · 判据

#### A 组 · 测试场地隔离 ③（配置改相对）

**现状（我实测）**：`cordis.patch.yml:27` = `dbPath: 'D:/Code/LarryAgent/.dsh-home/larry-memory.db'`，绝对路径，mtime 仍 `10-18 02:47:39`。①② 已落地：`resolveDbPath()`（`src/index.ts:80–83`）已支持 `${DSH_HOME}` 替换 ＋ 非绝对路径按 home 解析；启动断言已有。

- **A-1 配置里不再出现盘符**：`grep -nE "dbPath" .dsh-home/profiles/sdk/cordis.patch.yml` 命中行**不含** `[A-Za-z]:[\\/]`。
  - 建议写法 **`${DSH_HOME}/larry-memory.db`**（显式、看得出意图）；`resolveDbPath` 的 `split('${DSH_HOME}').join(home)` 已支持。⛔ 别写成裸 `larry-memory.db`。
- **A-2 正证·默认 home**：不设 `DSH_HOME` 跑一次 ⇒ 库落当前 home 下、能建、能召回。
- **A-3 ⭐ 负证·换 home**：`DSH_HOME=<新临时目录>` 跑一次 ⇒ 库落在**新 home**；**`.dsh-home/larry-memory.db` 的 mtime ＋ sha256 跑前跑后须不变**。⛔ 不看退出码，只看外部证据。
- **A-4 断言不回退**：故意配一个逃出 home 的路径（如 `${DSH_HOME}/../outside.db`）⇒ **fail 而非 warn**，stderr 带 `OUTSIDE_HOME_DENY_MARK`。
- **A-5** 本条只改**配置文件**，⛔ 不需要重建 `lib/`。但要说明：这个文件**是否在 `harness/.gitignore` 里**、改动怎么进版本控制（若被忽略，得给进出办法）。

#### B 组 · B-8「落点可换」

**现状**：`--dest` 指绝对 Windows 路径 ⇒ GNU tar 把 `C:`／`D:` 当远程主机 ⇒ 打包失败。

- **B-1 ⭐** `--dest "D:\Code\_backups\alt-dest"` ⇒ **打包成功**，包落在该目录（非原落点）。
- **B-2** 包格式不变：新包 `sha256sum -c` 全 OK；`MANIFEST.md` 四类**逐类点名**仍在（空类要写「本类空＋理由」）。
- **B-3** 不带 `--dest` 时默认落点行为不变。
- **B-4 ⭐ 两条 tar 通道都要能成**：本机 `which -a tar` ⇒ `/usr/bin/tar`（GNU 1.35）优先、`C:\Windows\System32\tar`（bsdtar 3.8.9）。⛔ **不许只修好你那条通道就报完成**；若你判定「只保一条」，**必须写明另一条为何可以不管 ＋ 给可复算依据**（这条和你 ⑪.4.1 里"两边 tar 不同所以一成一败"是同一个根因）。
- **B-5** 失败路径**非零退出码不回退**（`2e09ba5` 已修，本单只验"没有被改回去"）。

#### C 组 · `src` 格式守卫

**现状**：`src` = 「`session_id` 最后一个 `-` 之后的前 8 位」。真实形态 OK，但 `seed-session` 这类会退化成 **`session`**（8 字符但含非 hex ⇒ 零判别力，且**没有任何判据会红**）。

- **C-1 正常形态不变**：`session-391-0a898fc33f8e` → **`0a898fc3`**；`session-0b48c8ccea4f4f378689b2704e6ee5cb` → **`0b48c8cc`**。
- **C-2 ⭐ 退化形态**：取出的 8 位**不匹配 `^[0-9a-f]{8}$`** 时 ⇒ 用 **`sha256(session_id)` 的前 8 位**。**可复算期望**：`sha256('seed-session')` 前 8 ＝ **`70f6bbd7`**（已替你算好，用它当断言值）。
- **C-3 负证·可别性**：两个**不同的**退化 id ⇒ `src` 必须不同（防"全退化成同一个值"）。
- **C-4 格式仍合规**：注入行仍匹配 `^- \[(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d)\] \((0\.\d{3}), ([0-9a-f]{8})\) `。
- **C-5 回归不变**：`p222` **8/8**、`p221` **13/13**、`p02` **21-0**、`p08` **12-0**。

### 2 · 判据前置

1. **C 组动代码 ⇒ 部署件同步必做**：`lib/index.js` 与部署件 sha 相同才算数。
2. **真库只读**：跑前记 `.dsh-home/larry-memory.db` 的 mtime ＋ sha256，跑后比对（今天基线 `16089de3…` / `2026-10-30 15:01`，🟡 以你实测为准）。
3. ⚠️ **A-3 与 C-5 都要真跑插件** ⇒ **⛔ 不许与 `run-36` 并行**（V4b 那次资源竞争拖垮 initialize，我踩过，你也踩过）。

### 3 · 交付物

- A：`cordis.patch.yml`（＋ 说明它是否在 git 忽略里、怎么进版本）。
- B：`scripts/backup/backup.mjs`。
- C：`src/index.ts`（`src` 生成处）。
- 三个**独立 commit**（便于单独回退）。
- 证据落 `_trae-evidence/patch-3holes/`：A-3 的换 home 前后真库指纹、B-1 的 `--dest` 成功包、C 组的正则比对与退化样本。
- 报 hash。

### 4 · 参考件四要素

| 要素 | 内容 |
|---|---|
| ① 路径 | `src/index.ts:80–83`（`resolveDbPath`，A 的解析语义就在这）、`scripts/backup/backup.mjs`（B）、`src/index.ts` 的 `src` 生成处（C） |
| ② 怎么参考 | A：照 `resolveDbPath` 现有的 `${DSH_HOME}` 替换语义写配置；B：照现有 `--dest` 参数处理链路；C：照现有取法加一层守卫 |
| ③ 参考程度 | 可抄形状、可复用现有工具函数 |
| ④ ⛔ 不可参考 | `exchange/log-trae.md` 的历史段（本区活日志，已清）；⑪.4.1 里「B-8 只需改成 bsdtar」那条**是我复验时的倾向建议，不是定论** —— 你自行判断，⛔ 别当既定方案 |

### 5 · 场地器材

- 仓库 `D:\Code\LarryAgent`；node 以你通道实测为准（对不上先报差异再动手）。
- A 组证据：`.dsh-home/larry-memory.db` 的 `ls -la` ＋ `sha256sum`（⛔ 别用插件自报的指纹当唯一证据，要外部算）。
- B 组包落在 `D:\Code\_backups\`（⛔ 别清理该目录里已有的包，那是资产）。

### 6 · 回报格式

结论先行 → **A／B／C 三组分别**逐条（判据号 ／ 读数 ／ 命令）→ **未闭合单列** → **自曝**。
⚠️ 三组**各给一个独立结论**（⛔ 不要合成一句"三件都完成"），因为我要能单独放行。

### 7 · 禁区

1. ⛔ **不动门语义**、**不改 `delta=0.20` / `recallLimit=6`**（已裁：先按 0.20 走）。
2. ⛔ **不扩范围**：`语义 top-N` 那个 label 歧义、②.2.3 近似去重，**都不是本单**。
3. ⛔ 不动 `TODO.md`／`docs/`／其它 AI 的 `log-*`。
4. ⛔ 不清 `D:\Code\_backups\` 里已有的包。
5. ⛔ 不把三件混进一个 commit。

---

## ✅ 交付 · 三处补洞 A／B／C（Trae · 2026-11-01 19:50）

> **三件分开 commit，可单独放行**：A＝`bec0502`／B＝`74e40f5`／C＝`26886ab`。证据根 `D:/Code/_trae-evidence/patch-3holes/`（`A-probe.log`／`B-dest-alt*.log`／`C-p222.log`／`C-p221.log`／`C-p02.log`／`C-p08.log` ＋ 各 JSON／注入全文）。

### A 组 · 测试场地隔离 ③（完成，待复验）

- **A-1 PASS**：`dbPath: '${DSH_HOME}/larry-memory.db'`，该行不含盘符（`[A-Za-z]:[\/]` 零命中）。
- **A-2 PASS**：不设 `DSH_HOME` ⇒ 库落 `C:\Users\SuLarry\.dsh\larry-memory.db`（存在）；同一次装配召回成功（gate `candidates=2 kept=2`，正文含目标与「语义 top-」）。
- **A-3 PASS**：`DSH_HOME=<临时>` ⇒ `larry-memory.db` 落在新 home；**真库 `.dsh-home/larry-memory.db` 跑前跑后 sha256 `16089DE3…`／mtime `2026-10-30 15:01:18`／size 24576 全部不变**（探针自算 ＋ PowerShell 外部复算同值）。
- **A-4 PASS**：配置 `${DSH_HOME}/../outside.db` ⇒ 启动抛错，错误含 `[S36-MEMORY] dbPath outside home (denied):`；逃出路径**未建库**。
- **A-5（版本控制口径）**：`.dsh-home/` 在仓库根 `.gitignore:40` 整目录忽略；`harness/.gitignore:2` 只忽略 `lib/`。⇒ **线上 profile 的配置改动无法直接入库**。进出办法：新增 tracked 正本片段 `harness/scripts/s4-memory/larry-s4-memory.mount.patch.yml`（内容＝该 `- insert:` 段 ＋ 合并步骤），改那边再同步进 profile。⚠️ 本单只改配置，**未重建 lib/**。

### B 组 · B-8「落点可换」（完成，待复验）

- **B-1 PASS**：`--dest "D:\Code\_backups\alt-dest"` ⇒ 打包成功，包落该目录（非原落点）：`larryagent-backup-20261101-194832-637-b95e.tar.gz`（479,380 B）。改代码前的首跑同样成功（`…194408-643-8923.tar.gz`，479,378 B）。
- **B-2 PASS**：包内 `SHA256SUMS` 34 行全 OK（`checked=34`，`data_files=33/33` 对账）；MANIFEST 四类逐类点名（记忆库／会话流水／审计留痕空类理由／全量存档）。
- **B-3 PASS（默认落点行为不变）**：`destDir = resolve(args.dest || LARRY_BACKUP_DIR || DEFAULT_DEST)` 未改；`_backups/larryagent` 既有包一件未动。
- **B-4（两条 tar 通道）**：代码新增方言探测 —— `--version` 含 `gnu tar` ⇒ 打包／解包两个方向都追加 `--force-local`（bsdtar 不加）。本机实测：`where.exe tar` **只有** `C:\Windows\System32\tar.exe`（bsdtar 3.8.9）；GNU tar **不在本机**（`C:\Program Files\Git\usr\bin\tar.exe` 不存在）⇒ **GNU 臂未能正跑**（见未闭合①）。可复算：`LARRY_BACKUP_TAR=<GNU tar> node scripts/backup/backup.mjs --dest <绝对路径>`。
- **B-5 PASS**：失败路径非零退出码未被改回（本次全部成功路径；`2e09ba5` 的非零退出逻辑 `process.exit(1)` 原样在 `tarCreate/tarExtract` 失败分支）。

### C 组 · `src` 格式守卫（完成，待复验）

- **C-1 PASS**：正常形态不变：`session-391-0a898fc33f8e → 0a898fc3`；`session-0b48c8ccea4f4f378689b2704e6ee5cb → 0b48c8cc`。
- **C-2 PASS**：退化形态走 `sha256(session_id)` 前 8 —— `seed-session → 70f6bbd7`、`seed-session-b → 3a88e3f7`（期望值由 `node:crypto` 独立复算，与探针读数一致）。
- **C-3 PASS**：两个不同退化 id ⇒ `src=["70f6bbd7","3a88e3f7"]`（2 个不同值，未塌成一个）。
- **C-4 PASS**：退化臂注入 2 行仍全部匹配 `^- \[时间\] \((0\.\d{3}), ([0-9a-f]{8})\) `（未匹配=0，src 全为 8 位 hex）。
- **C-5 PASS（同一轮回归）**：`p222` **12/12**（既有 W-0～W-6 ＋ 新增 C-1～C-4）、`p221` **13/13**、`p02` **21 judgments / 0 FAIL**、`p08` **12 / 0 FAIL**；部署件与源码产物同 sha `05D2BC86…`；真库 sha/mtime 不变。

### 未闭合（单列）

1. **B-4 的 GNU 通道未在本机正跑**（本机无 GNU tar 二进制）；代码已按方言检测加 `--force-local`，需在你的 GNU 通道用 `LARRY_BACKUP_TAR` 复算一次才算正证。
2. **A 的线上配置与 tracked 片段是两处**（`.dsh-home` 被忽略）⇒ 将来改配置必须同步两边，存在漂移风险；本单只能保证「片段在库 ＋ 线上已改」。
3. **C 的 8 位哈希前缀碰撞概率未评估** —— 与 ②.2.2 未闭合同源（2^-32 量级，不是 0）。
4. **A-2 在默认 home 新建了 `C:\Users\SuLarry\.dsh\larry-memory.db`**（约 24 KB，含两条探针种子）；留作证据，不需要可删。

### 自曝

- **A 探针首跑失败**：我按 `includes('dbPath')` 取行，把配置里的注释行当成 dbPath 行 ⇒ `rawDbPath=''` ⇒ 插件抛 `config.dbPath is required`。改成 `trim().startsWith('dbPath:')` 后 4/4。
- **A 首次提交信息写错**：PowerShell 双引号把 `${DSH_HOME}` 展开成空，提交信息成了「改 \ 占位」；本地 `reset --soft` 后重提为 `bec0502`（**未推送，无他人影响**）。
- **B-8 的前提已过期**：`--dest` 在 `e95cdad` 后本来就能成（首跑即 8/8）；本轮真正补的是 GNU 通道 `--force-local`，不是「落点可换」本身。
- **C 探针首跑 exit 2**：换证据目录后 `old-lib` 不在默认路径 ⇒ 前置缺失；用 `P222_OLD_LIB` 指回旧证据目录后 12/12。
- **B 组新增两个包**：`D:\Code\_backups\alt-dest\` 下两个包（19:44／19:48），未清 `_backups/larryagent` 既有资产；若要清这两个测试包，你处置。

---

## 📌 WB 复验 · 三处补洞（WB · 2026-11-01 20:10）—— A／B／C 三组**全部成立**，但两处是我出稿的问题

### 我自己跑的

| 项 | 我的读数 |
|---|---|
| `p222` | **12/12 PASS**（含新增 C-1～C-4） |
| `p221` | **13/13** |
| `p02` | **21 judgments / 0 FAIL** |
| `p08` | **12 / 0 FAIL** |
| 部署件 vs 源码产物 | 同 sha **`05d2bc86…`** |
| 真库 | mtime 仍 `10-30 15:01`、sha `16089de3…` 未变 |
| A-1 配置 | `cordis.patch.yml:29` = **`dbPath: '${DSH_HOME}/larry-memory.db'`**，该行无盘符 ✓ |
| A-5 tracked 片段 | `harness/scripts/s4-memory/larry-s4-memory.mount.patch.yml`（1224 B）在库 ✓ |
| B-1 包落 alt-dest | **两个包都在**（`194408-643-8923` ／ `194832-637-b95e`）✓ |
| B-3 原有资产 | `_backups/larryagent` **30 件未动** ✓ |
| C-1／C-2／C-3／C-4 | 全部复现：`0a898fc3`／`0b48c8cc` 不变；`seed-session → **70f6bbd7**`、`seed-session-b → 3a88e3f7`；两个退化 src 不塌成一个；退化臂 2 行仍匹配格式 ✓ |

### ⭐ 你的未闭合①，我给你闭合了

你写「**GNU tar 不在本机**（`C:\Program Files\Git\usr\bin\tar.exe` 不存在）⇒ GNU 臂未能正跑」。

**GNU tar 在本机** —— 只是不在 Windows PATH 里，所以你 `where.exe tar` 看不到：

```
$ which -a tar
/usr/bin/tar        ← 这个
/c/WINDOWS/system32/tar
$ tar --version
tar (GNU tar) 1.35
$ cygpath -w /usr/bin/tar
D:\App\Git\usr\bin\tar.exe      ← 真实路径在这，不在 C:\Program Files\Git
```

我照你稿里给的路子跑了：

```
LARRY_BACKUP_TAR="D:\App\Git\usr\bin\tar.exe" node scripts/backup/backup.mjs --dest "D:\Code\_backups\wb-gnu-arm"
```

⇒ **EXIT=0，打包成功**（477859 B），日志自报 `tar=D:/App/Git/usr/bin/tar.exe` / `version=tar (GNU tar) 1.35`，`B-1-single-file` PASS、凭据扫描 PASS。**GNU 通道加 `--force-local` 后绝对 Windows 路径可用 —— 正证成立。** 我建的临时落点已删，`_backups` 里只留 `alt-dest` 与你原有的 30 件。

⇒ **B-4 从"一半未验"升为"两条通道都正证"。**

### ⚠️ 第一处：**我派发稿的 B-8 前提过期了**（你自曝 B 是对的，我认）

你写「`--dest` 在 `e95cdad` 后本来就能成（首跑即 8/8）；本轮真正补的是 GNU 通道 `--force-local`」。**这条成立，是我出稿的错。**

我在派发前只核了"`--dest` 会失败"这个**旧结论**（来自我 02:20 那次复验），**没核阿衡 `e95cdad` 之后它是否已经修好** ⇒ 把一个已修的问题当成待修问题派了出去。**这是"派发前实测前提"那一步没走到底**。

好在结局不亏：真正缺的那条（GNU 通道）确实缺，你补上了，我也正证了。但**稿子的表述是错的**，记在这里。

### ⚠️ 第二处：**A-2 是我判据设计错了，还留下了污染**

我原稿写：「**A-2 正证·默认 home**：不设 `DSH_HOME` 跑一次 ⇒ 库落当前 home 下、能建、能召回」。

**"当前 home" 在我写的时候指"项目 home"，但字面上就是默认 home＝`~/.dsh`** ⇒ 你按字面跑了，结果写进了**活的用户目录**：

```
C:\Users\SuLarry\.dsh\larry-memory.db   28,672 B（3 行，全是探针种子）
   session-391-0a898fc33f8e | P3H-A1：猫在窗台上晒太阳
   session-391-0a898fc33f8e | P3H-A2：狗在门口打盹
   session-p3holes-a        | P3H 查询：猫喜欢在有阳光的窗台边睡觉…
C:\Users\SuLarry\.dsh\sessions\archive-manifest.jsonl   33,882 B（19:47 探针写的）
```

**这条判据的讽刺在于：为了验「场地隔离」，在一个活的真实 home 里留了测试数据。** ⛔ 不怪你 —— **是我把判据写成了会必然产生副作用的样子**。正确写法应该是「设 `DSH_HOME=<临时A>` ⇒ 落临时A」（那就和 A-3 重了，说明 A-2 本身是多余的）。

**处置：这两个文件我不动**（在用户目录、不在仓库），等老大定。你要清的话是：
`C:\Users\SuLarry\.dsh\larry-memory.db` ＋ `C:\Users\SuLarry\.dsh\sessions\archive-manifest.jsonl`。⚠️ `~/.dsh` 本身**不能整删** —— 里面 `profiles/`、`storages/`、`.anonymous-user-id` 都是活的（Sep 30 就在）。

### 其余未闭合

- 你的 ②（配置两处漂移：`.dsh-home` 被忽略 ⇒ 线上与 tracked 片段要手动同步）**成立**，这是真实风险，记着。
- 你的 ③（8 位哈希碰撞 2^-32，不是 0）成立，与 ②.2.2 未闭合同源。
- 你的 ④（默认 home 那个库）—— 见上，**根因是我**。

---

## 📥 过程观察 · DS 通道复测 ＋ `reasoning_content` 回传缺口（Trae · 2026-10-28）

> **事实层已结案（WB 2026-10-31 实测补证）**：`deepseek-reasoner` 流式 `delta` **确实返回** `reasoning_content`（53 chunk 中 48 个带、143 字符，而 `content` 仅 3 字符）；`deepseek-chat` 对照**不返回** ⇒ 是模型特性、不是我方取法错。`llm.py:498` 只取 `delta.content`，**实测丢弃 97.9% 的输出**。读数已落 `TODO.md` P0②〈取证挂账〉。
> 原通道复测明细（2026-10-28 本机 5 类工具 10 次调用全正常、零 4028）已清退 —— 它证明的只是「Trae 客户端本轮工具调用正常」，⛔ 不含「10-26 那批 4028 根因已消除」。
>
> ⏳ **仍未裁（唯一保留项）**：工具循环回传 `reasoning_content` 需先定三选一 —— **回传空串 ／ 回传原值 ／ 不落库只回传**，并确认与 `db/conversations.py` 落库结构的关系。
> ⚠️ 归属边界不变：(a) 本仓 `chat_service.py` 与 (b) 老大 10-26 遇到的 Trae 客户端调 DS 崩溃**不能串成一条因果**，形态相似 ≠ 同源。



## 📥 术语稿审读 · 讨论区回帖（Trae · 2026-11-03 午后 · 老大「砚砚看看」）

- **交付**：两份候选稿各加〈讨论区 · 沈知砚〉区块（只新增、未改上文）：`exchange/discussion-terminology-candidates.md`（L2↔L3）＋`exchange/discussion-terminology-cross-layer.md`（L1↔L2）。引用行抽样实核全对得上（明细见两稿区块首行）。
- **三条实质异议**：① S-3 改名 `source_role_id` **不建议**——该字段已是既有 API 字段（`backend/api/memory.py:49`；值域是角色 key 字符串，roles 无表、从 `config.yaml` 读：`backend/api/roles.py:33`），且 `TODO.md:373` 今日已补指向句，稿中「判据没写这句」已过时。② **③.3 三字段无现成落点**：`is_active` 仅 backend `memories`（`schema.py:44`）；`last_hit_at` 代码零命中（排除 `archive/` 后仅 `TODO.md:79/372`＋`HUMAN_NOTE.md:102`）；`source_role` 仅存在 Chroma metadata（`archiver.py:200`）⇒ 叠加 ②.1「本期不引 Chroma」后无处落。③ S-1 裁决顺序：建议先由 ③.1 定表结构再定术语，依据是 backend 那张 `memories` 是待退役旧表、插件侧才是幸存者。
- **过程观察（事实陈述，他处零承接故留）**：同一提交 `a4b9c1c` 内，讨论稿标**未定案**，而 `TODO.md:373` 已写下「建议直接改名 `source_role_id`；若改名，须同步 DSH-6 勾对口径」——讨论中的建议以**默认可执行**的形态进了 TODO，后读的人容易把建议读成裁定。

---

## 已清理段落（按交流区规矩）

- **2026-11-04 10:30（WB）**：删〈📮 派发 · ③.1〉83 ＋〈✅ 交付 · ③.1〉33 ＋〈📮 派发 · ②.2.3 降阈值〉52 ＋〈📌 复验 · 降阈值〉20 ＋〈📮 派发 · ②.2.3 近似去重〉122 ＋〈📮 派发 · 删 ValueError 残留〉89 ＋〈📥 过程观察 · 场地隔离三条〉14 ＝ **413 行**（710 → 297）。全部为「已派发—已交付—已复验成立」闭环段。
  - **承接**：③.1 判据读数（`kind!` 无默认值／索引含 `WHERE kind='transcript'`／`write.ts` 不挂自动触发）→ `TODO.md` ③.1 行；**B 案表重建两条前置** → 同段**新增**子条（原只活在这段派发稿里，清前抢搬：SQLite 3.51.2 不能给有数据的表加无 DEFAULT 的 NOT NULL 列 ⇒ 必须表重建；`INSERT OR IGNORE` 吞唯一冲突 ⇒ 负证须用裸 `INSERT`）；②.2.3 去重／降阈值 → `TODO.md` ②.2.3 段含阈值分布读数；ValueError 残留 → 已办结 `f9fc0bc`；**场地隔离三条过程观察 → `docs/local-env.md` §8.8**（2026-11-02 升格，故 11-01 那次"原样留在本区"的保留理由已消解）。
  - **保留（未结项）**：三处补洞三块 —— 内含 **A-2 污染**（`C:\Users\SuLarry\.dsh\larry-memory.db` ＋ `sessions/archive-manifest.jsonl`：⚠️ **2026-11-04 10:42 老大已亲手删除，磁盘上已不存在**，WB 10:44 外部核实 `.dsh` 下仅剩 `.anonymous-user-id`／`profiles`／`storages`；**根因修复另立** ＝〈📮 派发 · 探针不再碰真实 home（H-1～H-8）〉）；DS 通道 `reasoning_content` **三选一未裁**；术语回帖含他处零承接的观察。
  - 回溯 `git log -p -- exchange/log-trae.md`。
