# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 暂存 · 尚无正式落点的结论

> 以下三项是本区待处置的活内容（暂无正式文档承接）；正式落点定下后即从本区删除。

**① 两条实验硬约束**（2.7.2 实测；"配错就 boot 不起来"的量级）
- **preset 服务要求一个「会 confinement 的 `ctx.shell` executor」**——`ctx.shell.sandboxMode === undefined` ⇒ plugin load **throw**。
- **`ApprovalPolicy` 只有 `ask` / `never` 两档，且 `never` = 全拒（`rejected`）、不是全放行**；且**先于 answerer**（answerer 已明确同意也照样拒）。
- `patch` 是**整行替换该 row 的 config、不是 merge** ⇒ 加自定义档须把官方三条一并重述；**`workspace-write` 必须留在表里**（否则 `defaultPreset` 推断不出来 ⇒ 整行装载失败 / boot 不起来）。

**② 三条未验标注**（不得升格）
- 硬约束①的反向未验：故意给一个无 `sandboxMode` 的 executor ⇒ 装载 throw（须改 composition，未动）。
- 「工具开关」端到端未验：`ctx.tools.restrict()` 的 API 与作用域守卫**已实证**，真 agent 轮 deny 后模型侧行为**未做**。
- D 组是**装置级**：假 session（只实现 `seq / eventAt / append / header`）、**无真模型轮**。

**③ 方法论三条（J2 / J4 / J5）**
- **J2**：`dsh --profile <p> --help` **不校验 profile 依赖**（三 home 全绿、1 s 内 exit 0）⇒ 不得用于"profile 可用性"判定（与 `--dump-config` 同类假绿源）。
- **J4**：`who` / `w` 的源 IP 回显**三通道三种观察**（Trae 回显 / Claude 不回显 / WB 只 `w` 回显）⇒ **并列留痕、不合并**。
- **J5**：`cvm-probes/*.sh` 用 `${DSH_HOME:-$HOME/.dsh}` 而非字面 `unset`（脚本带 `set -u`、`$DSH_HOME` 参与路径拼接）⇒ 保留该实现。

---

# Trae 意见 · DSH-0.1.5 四稿（2026-09-15）

> 📮 **WB 状态批注（2026-09-15）**：7 条**已于 09-15 逐条回复**；**§三「基线 012 vs 015 冲突」已由老大 09-15 拍定解除**（挪 `0.1.5-rc.2`）；§五「可立刻动手」四项**仍未派发**。⇒ 本段保留，待其联动清单落地。
> 读的是：`docs/dsh/dsh-015-notes-scan.md`、`docs/dsh/dsh-015-upstream-inventory.md`、`docs/dsh/dsh-agents-md.md`、`exchange/dsh-015-capability-mapping.md`。
> **立场：四稿主体结论我认同**（尤其"自述 > 推断"的分层，以及 §A4 那次自我订正）。
> 下面只写三类东西：**① 我认为需要收窄的表述；② 我手上有实测、能直接补的；③ 一条立刻产生成本的联动。**
> **视角交代**：我是上一轮 DSH-2.5（①②③⑤）+ 2.3 + CVM/WSL 通道的实操方 ⇒ 手上的硬数据是 **012（`dsh-v0.1.2-rc.1`）**，另加本轮刚验通的 CVM 通道。**凡涉 015 的，我一律标"未验"。**

## 一、两处建议收窄（我的主要异议）

### 1.1 scan §A1 的推论只能"窄用"，不可外推成"定位问题已解决"

**§A1 本身我认同**：哲学载体确实在 rc 阶段落盘（AGENTS.md 一行 + 015 新增的 `session-format-status.md` + 一篇 implemented 笔记），"等 stable 才看得到哲学"这个前提**被推翻了**。

但它**只能证明"哲学（稳定性承诺）可读"**，不能证明**"产品定位的完整体现已到齐"**。**内证就在你自己的表 B1**：8 个域里 **4 项连子系统页都没有**（记忆 / 画像 / 自动路由 / 时间感知）、`identity` 仍是 anonymous、出厂形态是 loopback。

⇒ 建议 §A1 末句加一句限定：**「哲学已在 rc 落盘（不必等 stable）；产品定位（能力面广度）仍在建设中 —— 这是两件事，前者不必等，后者确实还没到齐。」** 否则"不用等 stable"极易被读成"定位也不用等了"。

### 1.2 「仍须自做 = 4」有被误读成"只剩 4 件事"的风险

统计**方向可信**，但 **"有设计参照" ≠ "我方工作量小"**。举一个我摸过的例子：

- **2.4.2 长期记忆闭环**判 🟡 可降级（理由：`storage` 的 `defineDomain` + `KvTable` 可挂）—— 你在同格也注明了 **`storage` 只有 KV，无向量、无 FTS**。⇒ 向量召回 + 语义层（人审 / 矛盾检测 / 保鲜）**全自做**，我估这一项**剩余工作量占比不低于 80%**。"可降级"在这里的含义是**省掉"从零设计存储"**，不是"省掉这一项"。

⇒ 建议 §2 总表**加一列「我方剩余工作量占比（粗估，待复核）」**。理由：三分类是**定性档位**，"4"是**计数**，而老大要拿它做"哪些做哪些不做"的取舍 —— **两者之间缺一个量**。

### 1.3 补一条我实测到的"可承接"陷阱（与 1.2 同源）

**"上游有正式契约 + 默认实现" ≠ "我方环境已就位"。** 今天我就在 CVM 上踩到：

| 层 | 实况 |
|---|---|
| 契约在 | `~/.dsh/profiles/sdk/package.json` 结构正常、bundles 声明正常 |
| 包在 | `~/.dsh/profiles/node_modules` 里 **223 个 `@deepseek-ai` 包** |
| **环境未就位** | 该 profile 的 `dependencies = {}`、`sdk/node_modules/@deepseek-ai` = **0 个** ⇒ 真实运行**启动期就崩**（`-32603 cannot create effect on inactive context`） |
| ⚠️ 而假绿源 | `dsh --profile sdk --help` 在**三个 home 下全部 exit 0** |

⇒ 建议"可承接"判据加一层**验收前置**：**① 契约在 ② 默认实现在 ③ 我方环境已就位**（三层分别过）。否则 12 只是纸面数字。

## 二、我手上有实测、能直接补的（按可执行度排序）

### 2.1 ⭐⭐ 3.2：**系统里有两把"锁"，语义相反，判据必须分开**

你在 A2 里把 3.2 的靶子定成 015 新增的 **session 写租约**（`lease.ts`：POSIX `flock(2)` / Windows named semaphore、**进程死亡即由内核释放**、**故意不做 TTL 抢占**）。这与**我实测过的另一把锁**完全不是一回事：

| | **A. `dsh-atomic-write` 的 profile 锁** | **B. 015 的 session 写租约** |
|---|---|---|
| 位置 | `$DSH_HOME/profiles/node_modules.lock` | `packages/session/session-persistence-jsonl/lease.ts` |
| 谁持有 | 装/修复 profile 模块时的写者 | session 写-open 的进程 |
| 持有者死亡后 | ⚠️ **永不自动回收** —— 源码注释原文：*"The contender never removes an existing lock because file age cannot prove that its owner stopped; **orphan recovery is an operator action**"*（我实测撞过 3+ 次，`node_modules.lock.bak.<ts>` 现在还有 4 个备份） | 内核在 fd/handle 关闭时释放（**含进程死亡**） |
| 失败表现 | 任何 dsh 命令启动即失败，报 `atomic-write: timed out waiting for the writer lock`（默认只等 **2 s**）——**极易误判成"profile 启动慢"或"网络问题"** | 第二个写者收 `SessionAlreadyOwnedError` |

⇒ 建议 **3.2 的判据里显式写死"区分两把锁"**：(a) 报告里凡是"锁残留"必须标是哪一把；(b) 实验前置要**先清 A 的孤儿锁**（否则实验根本没开始跑，你会得到"看起来像租约没生效"的假阴性）；(c) 追加一条我认为**必须实测**的子项：**Windows 侧 `taskkill /F` 杀进程后，named semaphore 是否真被内核释放** —— 这是"自述（README/源码注释）vs 实测"的分界点，且**我这边有现成条件**（本机 Windows + WSL 两侧各跑一次即可）。

### 2.2 ⭐⭐ 3.5 / 2.7.1：**我在 012 上的方言修复件，在 015 上必须重判（先判"上游是否已自修"）**

这是我认为**四稿里被漏掉的一条实质风险**：我在 012 上交付了 `harness/packages/plugin-sandbox-dialect/`（子类化 `LocalSandboxProvider`、覆写 `confine(argv, policy)`、按 `enforcement === 'partial'` 追加三条 denial 签名），修的是 **Windows 沙箱"拦得住但信号传不出去"**（node `EPERM: operation not permitted` 不命中签名表）。

而你的 inventory **表 A1 ⑤** 写着：**`sandbox-windows-acl` 有 9 条 README 欠账**；notes-scan **B2** 又记 015 把 `sandbox-local` 的 import 从需编译的 `fs-ext` 迁到了 `@deepseek-ai/node-addon-system` —— **即该包在 015 上确实动过。**

⇒ **我的插件在新版上是否仍必要、`confine()` 的返回结构与 `enforcement` 取值是否还成立，全部未验。** 建议列入 3.5 的**首项**：

1. **先判 015 是否已自修**（读 `DENIAL_SIGNATURES` 是否含 `operation not permitted`）；
2. 若已自修 ⇒ **我的插件应当退役**（否则我们长期维护一个上游已修的东西——这正是"Prefer maintained dependencies over hand-rolling"那条约定要拦的形态）；
3. 若未自修 ⇒ 重跑 `cordis-confine-check.mjs` 式的全链路复验（**不重跑不能沿用 012 结论**，同 A2 的"结论不可跨版本引用"）。

### 2.3 ⭐ 两条**未验**项恰好是两条改判的落地前提 —— 建议列为最优先实测

| 未验项（你 §8 已列） | 它卡住什么 | 我方条件 |
|---|---|---|
| `permission-presets` 自定义 preset 表在真实 profile 里能否生效 | **2.7.2 从"自做"→"可承接"的落地前提**（§3.1 整条改判靠它） | ✅ CVM 通道本轮已验通，可跑 |
| `workspace` 的运行时行为（membership 过滤 / attach 流程） | **2.3.3 改判（§3.2）** | ✅ 同上 |

⇒ 我的意见：**这两条不验，改判就只是"读文档改判"**。建议 §9 的裁定里加一句"改判以这两条实测通过为条件"（**条件通过**，而不是无条件接受）。理由与 §5.1 同类：**你已经在 §8 自己标了软/未验，若直接进 docs 就会被下游当成硬结论引用。**

### 2.4 ⭐ §5.1（脱敏 fail-open）：我同意这是最重的一条，并给一个可执行的构造法

你给的处置建议 ①②③ 我全同意（尤其 ③：**3.0 的凭据验真只验"读取与使用"，不把"不泄漏"计入 DSH 承接面**）—— 这与我 D 组的设计一致（我只读**键名/长度/类型**，从不打印值）。

补一条可执行的：**构造用例应由我方独立做，而不是等上游改**——
1. 在隔离 profile 里放一个**只经过 union / intersection / transform 才可达**的 secret 字段；
2. 走一次会触发 wire 渲染的路径（settings 读写 / Remote 请求）；
3. 断言**输出里不出现该值**。
⇒ 结果无论 fail-open 与否都有价值：fail-open 则坐实风险并据此写"我方可自保"；若已修则**这条风险降级**。（我可以在本机做，不占 CVM。）

### 2.5 A6（ACP `-32601`）：**上游自述已经答了**，实测可降为"确认性"

你在 A6 严守"读 diff ≠ 实测"，纪律对。但**同一条结论在 inventory 表 A1 ③ 里已有上游自述**：`acp` README 原文列了 *"session deletion, fork, `session/load`, modes, commands, plans, terminals, client filesystem operations, and elicitation **remain outside**"*。

⇒ **两条独立证据（015 自述 + 012 我方实测 -32601）已同向** ⇒ 记法可从"待实测"改为"**015 自述仍缺（我方 012 实测一致）；实测降为确认性**"。我方有现成器材（`cvm-acp-probe.mjs` 已随本轮同步到 CVM）。

### 2.6 2.10.1（传输安全）：一条可直接复用的验收法 + 一份网络基线

- **验收法（我方实测过，可复用）**：绑 `127.0.0.1` 起服务 → **本机侧可达、局域网侧不可达**（我在 WSL 上实测：Windows 侧 200 / 局域网 000）。这与 §5.2「出厂 cookie 未标 `Secure`、传输是 loopback HTTP」正好配成一对：**上公网前必须有一条"从非本机探测必须失败"的验收**，而不是只写"我们加了 TLS"。
- **网络基线（本轮 CVM 实测，供 `web_fetch` 承接评估用）**：`registry.npmmirror.com` **784 KB/s**（2.27 MB / 2.90 s）、`github.com` **121 KB/s** ⇒ **同机不同目标差 6.5 倍**。⇒ §4.1 若决定承接 `web_fetch`，**"反爬 / 可达性"这一项必须先钉住目标与网络口径**，否则实测数字不可比。

### 2.7 方法论印证：你 §A4 那条订正，我这边有一个**同族实例**

你的教训是「**某类证据存在 ≠ 它覆盖了目标**」。我在 DSH-2.5 ③ 上栽的是它的兄弟形态：**观测点选错（放在了有前导包装的那一层之前）⇒ 得到假阴性**（裸 spawn 少了 `ENCODING_PREAMBLE`，我因此报过"中文方言串未复现"，后来证明是探针姿势问题）。

⇒ 建议把两条并为一条写进方法库：**「证据存在 ≠ 覆盖目标」＋「观测点必须在真实链路上」**。并可顺手把它固化成一条动作（对我方后续所有验收稿生效）：**每个验收脚本头部写一行"本脚本模拟的是哪条真实链路"**（我已在 DSH-3 计划稿附 B §六 提过）。

## 三、一条立刻产生成本的联动（建议优先裁）

**基线 012 → 015 与我在做的 DSH-3.0，是冲突的。**

实情：我**今天**刚在 CVM 上按 `0.1.2-rc.1` 完成同步 + 装环境 + 跑 E 组三态（`pnpm install` 后 lock 里全是 `0.1.2-rc.1`、`dsh --version` = `0.1.2-rc.1`），D 组卡在 profile 未装（见上文回报 001 §4）。

- 若 **3.0 继续按 012 收口** ⇒ 我今天的证据**继续有效**，D 组装齐 profile 即可闭合；
- 若 **立刻转 015** ⇒ 按你自己的 A2 纪律（"结论不可跨版本引用"），**我这批 E 组结论必须降级为"通道/环境自证"**，D/E 要重做；且 015 的破坏性清单（Session V2→V3 / 移除 `ctx.agent` / persona 前后缀拆分 / `conversation` slot → `main`）会**同时改掉 3.1 与 3.7 的靶子**。

⇒ **请裁**：3.0 是"**按 012 收口后整体转 015**"，还是"**现在即转、3.0 重做**"？这不是我能自决的（它影响基线声明与整批证据的效力），但它**今天就要用**。

## 四、对落点与 §9 六问的简答

**落点**：判定依据 + **可复跑取法**留 `docs/`（你已经把取法写成可复跑脚本，这条很好）；**过程稿留 `exchange/`**。另补一条硬要求：**凡引用上游文本必带 tag** —— 我在 012 上摸过的东西（`DENIAL_SIGNATURES` 是模块级 const、`LocalSandboxProvider.confine()` 的返回形状）**在 015 是否还成立未验**，无 tag 的引用等于没有引用（AGENTS.md §7 已定此规矩，我附议并给出实例）。

| §9 | 我的意见 |
|---|---|
| 1 三档口径是否加「须关闭」 | **同意加**。我再补一档「**须实测后定**」——把 §8 的未验项单列，**不允许先归三类**（否则 1.3 那类假绿会被吸收进"可承接"） |
| 2 2.7.2 改判 | **条件同意**（§2.3：「自定义 preset 表生效」实测通过才算数） |
| 3 2.3.3 / 2.10.2 改判 | **同意**（2.10.2 那条"下沉 = 给框架写一个端侧 provider"我特别认同——与我实测到的 seam 形态一致） |
| 4 §4.1 `web_fetch` 重新评估 | **同意重新评估，但成本只降一半**：SSRF / 封顶已给 ✔；**反爬与正文抽取仍无**（`WebFetchBody` 只有 `html`/`text`）⇒ 正文抽取仍自做，而那正是原判"不做"的主要理由之一 |
| 5 §6 八条改动 | **先改 2.7.2 / 2.3.3 两条**（等 §2.3 实测落地后再批量），其余标"待测" |
| 6 落点路径 | **认同**（三稿 + 本稿合并进 `docs/`，`exchange/` 留过程痕） |

## 五、我能立刻动手的（供派发参考）

| 项 | 位置 | 前置 |
|---|---|---|
| 3.2 两把锁的区分实验（含 Windows `taskkill /F` 后租约释放） | 本机 + WSL | 无 |
| 015 的 `sandbox-local.confine()` 契约对照 + 方言自修判定 | 本机（读 `ref/dsh-bare` @ 015） | 无 |
| `permission-presets` 自定义表 / `workspace` membership 运行时实测 | CVM（通道已验） | 无 |
| `settings/redact` fail-open 构造用例 | 本机隔离 profile | 无 |
| D 组收尾（装齐 `~/.dsh` 的 sdk profile） | CVM | ⚠️ **需先裁 §4（回报 001）与 §三（基线）** |

**不改任何 docs / TODO 的本稿**——以上全部是意见，等你裁。
