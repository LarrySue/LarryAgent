# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

# DSH-3.0.5 · 独立验收回报（Claude｜2026-09-16）

> 派发单见下方 §📮。器材自造、未跑 Trae 任何装置；真 key 只从 `~/.dsh/.credentials.yaml` 读入内存，未落盘、未回显（所有产物双重脱敏，`sk-` 形态命中数 = 0）。
> 通道：**CVM** `ubuntu@49.232.129.252`，`sh`（非交互 PATH 手动补 `node`），`DSH_HOME` 逐态指定；CLI 一律 `~/harness/node_modules/@deepseek-ai/dsh` = **0.1.5-rc.2**。本机（Windows/MSYS）未跑 ⇒ 不得外推。

## 结论先行

- **A（独立复现 D / E 三态）：复现成功。** 三态在 `error.code` 上可分：无 key → `MISSING_CREDENTIAL`，错 key → `AUTH/401`；真 key → `completed` + 非空回复。我另加了一组**只差一个变量的受控对**（d1c ↔ d2，同为隔离 home，唯一区别是凭据文件的有无），故因果而非相关。
- **B（空壳 home 判据盲区）：❌ 无判别力——乙与甲逐值同形。** 但**根因不是「`initialize` 对空壳也盲」，而是「空壳这个样本不存在」**：boot 会把不存在的 home **自建成与甲结构同构的 sdk profile**，两者再走同一条回退路径、撞同一个错。⇒ **「profile 完全不存在」在 wire 层是一个不可达状态。**
- **附带否证：`~/.dsh-015` 不是健康样本**（WB 指定甲为"同代健康"，实测**红**，根因与乙**相同**：缺 3 个 peer）；**「跨代必红」也被实测否证**（丙实测绿，方向与 Trae 记录相反）。
- **实测坐实 WB 预警的只读坑**：`healProfilesModuleFallback()` 确实改写目标 home 的 `profiles/node_modules`（逐秒归因见下），Trae 相位 Ⅰ 记的"hoisted 层 ABSENT"在跑过 boot 后**已失效**。

## 一、观测表（逐项，格式 = 派发 §3）

**D 组**（`key-mode=none` ⇒ 子进程 env **显式 `delete DEEPSEEK_API_KEY`**，`parentKey=no` / `childKey=no` 四态全成立；只能读凭据文件）

| 态 | home | 凭据层 | `initialize` | `messageId` | 通知 | asst 消息/字节 | `turn/end` | `error.code` | exit | stdout / stderr | 存活 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| d1 真·原生 | `~/.dsh` | 真文件 223B/600 | ok 1217ms | YES | 18 | 1 / 26 | `completed` | — | **0** | 37232 / 0 B | 2585ms |
| d1c 真·隔离 | `/tmp/c305/iso-cred` | **符号链接**→真文件 | ok 1255ms | YES | 18 | 1 / 26 | `completed` | — | **0** | 35493 / 0 B | 2583ms |
| d2 无 key | `/tmp/c305/iso-plain` | **absent** | ok 1223ms | YES | 18 | 0 / 0 | `error` | **`MISSING_CREDENTIAL`** | **0** | 35149 / 0 B | 1388ms |
| d3 错 key | `/tmp/c305/iso-forge` | 自造 80B/600 | ok 1196ms | YES | 18 | 0 / 0 | `error` | **`AUTH/401`** | **0** | 34837 / 0 B | 1836ms |

**E 组**（环境变量层；home 均 `/tmp/c305/iso-plain`，**无凭据文件**，只经 env 注入）

| 态 | env | `initialize` | `messageId` | 通知 | asst | `turn/end` | `error.code` | exit | stdout / stderr | 存活 |
|---|---|---|---|---|---|---|---|---|---|---|
| e2 错 key | 伪造串 | ok 1211ms | YES | 18 | 0 / 0 | `error` | **`AUTH/401`** | **0** | 34837 / 0 B | 1879ms |
| e3 真 key | 真值（内存） | ok 1176ms | YES | 18 | 1 / 26 | `completed` | — | **0** | 36796 / 0 B | 2049ms |

**B 组**（`key-mode=none`，真实模型未参与）

| 样本 | home | `initialize` | 错码 | `messageId` | 通知 | exit | stdout / stderr | 存活 |
|---|---|---|---|---|---|---|---|---|
| 甲 b-jia1 | `~/.dsh-015` | **error** 1240ms | `-32603` | no | **0** | **1** | 102 / **15247** B | 1259ms |
| 乙a b-yia | `/tmp/c305-empty-a`（**不存在**） | **error** 1209ms | `-32603` | no | **0** | **1** | 102 / **15499** B | 1232ms |
| 乙b b-yib | 不存在 home + 真凭据 | **error** 1220ms | `-32603` | no | **0** | **1** | 102 / **15499** B | 1241ms |
| 丙 b-bing | `/tmp/c305/iso-crossgen`（012 profile） | **ok** 1325ms | — | YES | 68 | **0** | 46692 / 359 B | 2637ms |

- **乙与甲同形**（唯一差异 = 路径名长度带来的 stderr 252 B）⇒ 按派发判据：**无判别力，照写**。
- **乙a 与乙b 逐字节相同**（102 / 15499 B）⇒ **profile 层崩塌时凭据层完全不参与**（plugin tree 先于凭据解析）⇒ 凭据态会被 profile 态**掩蔽**。
- 两态 stdout 均为同一条 `{"jsonrpc":"2.0","id":1,"error":{"code":-32603,"message":"cannot create effect on inactive context"}}`。
- **stdin 全程保持打开**（`stdio:['pipe','pipe','pipe']`），无「双流全空的假绿」；四态 exit 0 也**再次证明 exit code 不能单独当判据**。
- D 组内 **stdout 字节数亦无判别力**（d2 35149 vs d3 34837，差 312 B）；判据只能是 `turn/end.reason.error.code`。

## 二、B 的根因链（本单最有价值的部分，逐环有据）

1. `~/.dsh-015/profiles/sdk/node_modules/@deepseek-ai/` **106 项**，健康态 `~/.dsh` **109 项**，**diff 只有 3 行**：缺 `dsh-http-proxy`、`dsh-session-persistence`、`dsh-session-query`。
2. 而 `dsh-session-persistence-jsonl` / `dsh-session-query-sqlite` 在**两者**私有层里**都是 015** ⇒ **甲不是"缺插件"，是缺 peer**。
3. `dsh-session-persistence-jsonl@015` 的 `peerDependencies` 要求 `@deepseek-ai/dsh-session-persistence: ^0.1.5-rc.2`。甲私有层没有 ⇒ Node 解析**向上回退**到 `profiles/node_modules` 回退层。
4. 回退层被 `healProfilesModuleFallback()` 回填成 **CLI 落点树（`~/harness`）的代际**，而该树是 **012/015 混装**（顶层依赖升了，`.pnpm` 里 012 残留未清）⇒ 该位置是 **`@deepseek-ai+dsh-session-persistence@0.1.2-rc.1`**。
5. ⇒ 015 的 entry 装入 012 的 peer ⇒ `failed to import loader entry session-persistence-jsonl (…): The requested module '@deepseek-ai/dsh-session-persistence' does not provide an export named 'Session…'` ⇒ cordis 报 `-32603 cannot create effect on inactive context`。
6. **乙走的是同一条路**：boot 把不存在的 home 自建出 `profiles/sdk/{package.json（`dependencies:{}`）、cordis.yml、cordis.patch.yml、pnpm-workspace.yaml、.dsh-module-fallback/}` **＋同一个 240 条回退层** ⇒ 与甲**解析行为等价** ⇒ 同一个错、同一个码。

⇒ **判据含义**：这题的正确问法不是"空壳红不红"，而是"**空壳与不完整 profile 能不能分开**"——**不能**。可用的判据在 **stderr**：`failed to import loader entry <entry> (<pkg>): … does not provide an export named <sym>`（能读出代际不匹配），但它**不给实际解析到的版本/路径** ⇒ **可诊断性缺口**，验收脚本应把 `readlink` 探针与这条错误一并收。

## 三、只读坑：实测坐实（逐秒归因）

- `~/.dsh-015/profiles/node_modules/@deepseek-ai/` **240 条**链接，mtime = **`2026-09-16 18:47:08`**，正落在 b-jia1 运行窗口（结果落盘 `18:47:09`，`initMs=1240`）⇒ **这批回退链接是我这次 boot 建出来的**；Trae 相位 Ⅰ 记的"hoisted 层 ABSENT"当时为真。
- 空壳 home 上同一现象重复：`/tmp/c305-empty-a/profiles/node_modules/@deepseek-ai/` **0 → 240**，mtime `18:47:10`。⇒ **对任意 home 跑一次 boot 都会改写该 home 的 profiles 回退层**。
- **归因精度声明**：链接 mtime 与 e3 结果落盘同秒，无法 100% 排除 e3 进程尾段所为；但 e3 的 `DSH_HOME=/tmp/c305/iso-plain`，唯一指向 `~/.dsh-015` 的进程是 b-jia1 ⇒ 归因 b-jia1。
- 顺带回答 Trae 遗留项 #2：`~/.dsh/profiles/node_modules/@deepseek-ai/dsh` 的 readlink **现在是 015 store**（`@deepseek-ai+dsh@0.1.5-rc.2_cfa263ec…`）⇒「symlink 仍指 012 store」**已不再成立**（状态已变）。d1 的**跑后**值未取到（跑后观测补丁在 wave1 之后才加，如实标注），只给「跑前 = 当前 = 015 store」。

## 四、与 Trae 数据的差异点

1. **丙（跨代）方向相反**：Trae 记录的红是「**012 CLI + 015 profile**」；我实测的绿是「**015 CLI + 012 profile**」⇒ **「跨代必红」不成立**。四观测点可收敛为**方向性规则**：*约束在 profile ↔ 其回退层/自身依赖的同代性，CLI 更新无害*（`~/.dsh` 015/015 ✓；`~/.dsh-015` 015/回退层混装 ✗；`larry-dsh-home` 012/012 在 015 CLI 下 ✓；Trae 改前 012CLI/015profile ✗）。
   ⚠️ **混淆项声明**：我的丙样本 profile 带 `@larryagent/plugin-storage-probe` link + `dsh-storage-sqlite@012`，是遗留实验 home，**不是干净样本** ⇒ 该规则仍是**候选**，需干净重测。
2. **`~/.dsh-015` 被判为"健康同代"是误判**：它与 `~/.dsh` 的差别只有 3 个包，不是代际差异；它在**旧四项 boot 探针**下 PASS，在 SDK 握手处必红 ⇒ 旧判据应退役（与 Trae 的反例一致，此处再证一次）。
3. **退出码**：D/E 四态**全部 exit 0**（与 Trae 一致）；B 组失败态 exit 1。
4. **E 组我未走 vitest 夹具**（见 §五），只用语义等价的自造路径，故**仅**证明"env 层在本路径上独立充分"，**不代表夹具语义**。

## 五、未做到的部分（不粉饰）

1. **未跑项目 vitest 夹具路线**（`harness/tests/real-api.ts` + `DSH_REAL_API_PROFILE_HOME`）作交叉核对 ⇒ 派发中「E 组只代表环境变量层」那条限定，我**既未证实也未证伪**。
2. **丙需干净重测**（去掉 probe 插件）才能把"方向性规则"从候选升为结论。
3. **d1/d1c 缺跑后观测**（补丁时序所致）；只 e3/b-yia 有完整前后值。
4. **未实测**"若 CLI 树为纯 015，缺 peer 的 profile 是否会被 heal 救活"——这是根因链第 4 步的**推论**，标注为推论。
5. 全在 CVM 单通道；**未碰** `larry`/`web`/`acp` 三个 profile，也未宣称它们可用。

---

# 📮 附：WB 单列待核项 —— harness 同步核账（Claude｜2026-09-16）

> 你说「我核到的数字与你相反」，我复测后确认：**你的对账成立，我此前记的"缺 30 文件"是 09-14 同步前的过期观测，该条作废。**

- **时点**：`2026-09-16T10:44:38Z`（CVM `date -u` 与本机同时刻取值）
- **取值路径与一条可复跑命令**：
  ```sh
  find <harness_dir> -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*"
  #   计数： … | wc -l       字节： … | xargs -d'\n' stat -c%s | awk '{s+=$1} END{print s}'
  ```
- **结果**：本机 `D:\Code\LarryAgent\harness` = **60 文件 / 758,353 B**；CVM `~/harness` = **64 文件 / 1,308,792 B**
- **归一化 diff**（`tr -d '\r'` + 去 `/home/ubuntu/` 前缀）：
  - **本机独有 5**：`packages/plugin-015-preset-probe/{cordis.patch.yml,index.js,package.json}` ＋ `scripts/015-preset-probe/{custom-preset.patch.yml,run-probe.mjs}`
  - **CVM 独有 9**：6 个 09-10 手工脚本 ＋ `package.json.bak-304` ＋ `pnpm-lock.yaml.bak-304` ＋ `SYNC-ANCHOR.txt`
- **对账**：60 − 5 = **55** = 64 − 9 ⇒ **与你的记录 reconciled 一致**。`61 / 753,485 B` 是 **`SYNC-ANCHOR.txt` 里 09-14 解包时的锚**（`synced-at: 2026-09-14T17:04:54+08:00`、`tar 145.6 KB / 55 entries`、`Packages: +7 -1`）；此后 CVM 又多了 `.bak-304` 两件与 6 个手工脚本 ⇒ **1.3 MB 的主要增量在 `.bak-304`（pnpm-lock 备份约 527 KB 量级）**，与"多 6 件"不矛盾。
- **差异成因**（可复核）：本机 5 件是 **Trae 3.0.4 新写的 015-preset-probe**（未同步上 CVM）；CVM 9 件是**升级时按 SYNC-ANCHOR 明记 "kept" 保留的备份与手工脚本**。

---

# 🔧 架构发现（给 WB / Trae，需裁定是否立项）

`healProfilesModuleFallback()` 用 **CLI 落点树**（可能混代）给**任意 home** 回填回退层 ⇒ ① 把宿主的**代际污染注入被隔离的 home**；② 把"缺模块"（清晰、早失败）变成"**装错代际**"（隐蔽、晚失败、错误码误导，`-32603` 不含任何代际信息）。
- 直接后果：`~/harness` 树**当前仍是 012/015 混装**（顶层升了、`.pnpm` 里 012 残留未清）⇒ **任何以它为 CLI 落点的 home，只要私有层缺 peer，就会被灌 012**。
- 可选修法（择一或并用）：① profile 显式声明全部 peer（`~/.dsh` 的 5 项做法，已验证有效）；② 重建 `~/harness` 依赖树使 `.pnpm` 纯净；③ 让 heal 只回填**与 profile 同代**的路径。
- 我倾向 **①＋②**：① 成本最低且已被 `~/.dsh` 实证；② 是根治（否则下一个缺 peer 的 home 会重复踩）。

**器材与产物**（按派发"不改任何仓内文件"，我**未**提交进仓库；需要我落 `harness/scripts/dsh-305-probe/` 请说）：
- 装置：`D:\Temp\Sys\claude-305\d-raw.mjs`（自造 NDJSON JSON-RPC 客户端，零项目模块依赖，协议面取自上游 `packages/sdk/protocol/README.md`）＋ `prepare.sh` / `run-wave{1,2}.sh` / `sum.mjs` / `scrub.mjs` / `peek.mjs`
- CVM 落点：`/home/ubuntu/claude-305/`（`results/*.json` 全部脱敏，`sk-` 命中 0）
- 样本 home：`/tmp/c305/{iso-cred,iso-plain,iso-forge,iso-crossgen}`、`/tmp/c305-empty-a`、`/tmp/c305/shell-cred`（**待清理**：其中 `iso-cred`/`shell-cred`/`iso-crossgen` 的 `.credentials.yaml` 是指向真凭据文件的符号链接）

---

# 📮 派发 DSH-3.0.5 · 独立验收（D / E 三态复现）＋ 判据盲区（空壳 home）（Claude，2026-09-16｜WB 出稿）

> 号按现行口径顺推（DSH-3.0 段内第 5 块）；**编号口径由老大动态维护，以他为准**。
> 🔴 **本单与原计划不同**：原题（验 Trae 新装置灵不灵）经 WB 复验**已部分作答**（见 §0），故重新定位为两件仍缺的事 —— **独立复现**与**找出判据盲区**。
> 通道你已有（9-15 你自己写过「均在 CVM 上跑、按约定落文件、不吞 key」）。

## 0. 为什么有这一单（背景，你不必去追上下文）

**DSH-3.0.4 已由 Trae 修完并重跑 D / E**（CVM，改前已备份 `.bak-304`）：
- 任务 2：harness 侧 ①CLI ＋ ④装置升到 `0.1.5-rc.2`，并给 `~/.dsh/profiles/sdk` 补 3 个 optional peer ⇒ 现在 **`~/.dsh` 能 boot、能建 session、能跑完真模型回合**。
- 任务 3：D 组 / E 组三态判据**全部成立**。最重的一条是 **D1** —— 全程不注入 `env` key，只凭 `~/.dsh/.credentials.yaml` 就拿到 `completed` ＋ 非空回复。

**WB 已在本机复核的部分**（不是本单要做的，列出来免得你重复）：D 组两套装置源码里确有 `delete env.DEEPSEEK_API_KEY`、对照干净；`initialize` 装置对「**跨代 / 缺 peer**」**有**正反对照（改前 `initializeOk:false` + error `-32603 cannot create effect on inactive context` → 修后 `true`）。

**⇒ 仍缺的两件，都属「判据与结论能否被信任」这一类，故不能由 Trae 自证**：

| | 目标 | 一句话 |
|---|---|---|
| **A** | **独立复现 D / E 三态** | 换人换器材重跑一遍，看结论是否复现 |
| **B** | **补一个判据盲区** | `initialize` 对「**profile 完全不存在**」这种坏，红不红？ |

**B 的来由**：旧 boot 探针恰在「空壳 home」场景下是**盲的**（Trae 的反例：home 换成不存在的目录，四项观测逐值相同）。`initialize` 对跨代敏感已证，但**对空壳是否也盲，至今无人测**。若同样盲，将来判「环境可用」时必须另立判据。

## 1. 目标 A · 独立复现 D / E 三态

### A.1 硬要求

- **器材你自己写**（**不许**直接跑 Trae 的 `d-codes.mjs` / `d-probe2.mjs` / `e-probe.mjs` —— 那等于用被验对象验它自己）。样本构造法可以照抄，那是方法不是判据。
- **跑 D 组时必须 `delete env.DEEPSEEK_API_KEY`** —— 这是 D 组「凭据文件层」命题的全部根据。
- **真 key 的用法**：从 `~/.dsh/.credentials.yaml` 读，**只用不落盘、不回显**；回报只写键名 / 存在性 / 长度。伪造态用你自己的明示无效串（别用真形态）。

### A.2 三态（照 Trae 的框架，但**由你自造与自认证**）

| 态 | 凭据层 | 预期 |
|---|---|---|
| 真 key | `~/.dsh/.credentials.yaml`（真文件） | 应**跑完**（拿到非空回复、无跨代回落） |
| 无 key | 隔离 home，**无**凭据文件 | 应**红**，且与下态**可区分** |
| 错 key | 隔离 home，**伪造**凭据 | 应**红**，且与上态**可区分** |

⚠️ **「怎么把这两个坏态区分开」本身就是判据**：Trae 实测它们在「退出码 / stdout」上**同形**，必须靠 `error.code`（`MISSING_CREDENTIAL` vs `AUTH/401`）才分得开。你若用别的判据，请说明它为什么能分开。

### A.3 E 组

- 夹具 `DSH_REAL_API_PROFILE_HOME=~/.dsh/profiles`；三态同上。
- ⚠️ **E 组只代表「环境变量层」**（vitest 的 `isolated-setup.ts` 会把 `DSH_HOME` 覆盖为临时目录）—— **不得**用它宣称「凭据文件生效」（那是 D 组的结论）。这条限定如不成立，照写。

## 2. 目标 B · 判据盲区（空壳 home）

拿 `initialize` ＋ `session/prompt` 对三组样本各跑一次：

| # | 样本 | 怎么来 | 预期 |
|---|---|---|---|
| 甲 | **同代健康** | 优先 **`~/.dsh-015`**（Trae 阶段 Ⅰ 所建）；代际**自己认证**（自己 `--version`、自己数包） | 绿 |
| 乙 | **空壳 / 不存在 home** | `DSH_HOME` 指向一个**不存在**的目录（dsh 会自建空壳 profile） | **？这就是本单要答的** |
| 丙（可选） | 跨代态 | 你自造（隔离目录）；或放弃 —— Trae 已有改前对照数据 | 应红 |

**判据**：
- ✅ **有判别力**：乙与甲**不同形**（并指出是哪一项观测抓到的）
- ❌ **无判别力**：乙与甲**同形** ⇒ `initialize` 在「profile 缺失」场景同样是盲区 —— **照写，这本身就是我要的答案**

### ⚠️ 「只读」的一个坑（WB 读源码所得，先告诉你）

boot **本身会写**：源码里 `healProfilesModuleFallback()` 会维护 `$DSH_HOME/profiles/node_modules` 的链接（symlink 重链到与安装锚点同代的路径），并有跨进程文件锁。
⇒ **对 `~/.dsh` 跑 boot 不算纯只读。** 甲组优先用 `~/.dsh-015`；若必须用 `~/.dsh`，请在回报里记下跑前 / 跑后 `profiles/node_modules/@deepseek-ai/dsh` 的 `readlink`（这正好能顺带回答 Trae 报的那条「symlink 仍指 012 store」）。
**其余不碰**：不改任何仓内文件、不动 `~/.dsh/.credentials.yaml`、不动 `larry` / `web` / `acp` 三个 profile。

## 3. 观测记录（逐项，缺一不算）

- `exit code` ／ `stdout` 与 `stderr` 的**字节数** ／ 存活时长 ms
- `initialize` 返回（成功？返回体？抛错？**错码**？）
- `session/prompt` 是否拿到 `messageId`
- 通知条数
- **通道**（哪台机 / 哪个 shell / `DSH_HOME` 取值）—— 通道不同则结论不可互推
- ⚠️ **保 stdin 打开**（sdk app 是 stdio 服务，stdin 一关就退出；用 `stdio:'ignore'` 会得到「exit 0 ＋ 双流全空」的**假绿**，Trae 栽过一次）

## 4. 边界（不许外推）

- 结论只覆盖「**你实际跑的那条路径 ＋ 那台机 ＋ 那个 `DSH_HOME`**」，**不得**外推成本机结论
- **不吞 key**；回报只写键名 / 存在性 / 长度
- A 组若 `session/prompt` 不注入 key ⇒ 只证明「会话被建、turn 被发起」，**不证明模型回合跑完**

## 5. 交付

- 回报写在**本文件顶部**，标题挂 `DSH-3.0.5`
- 结构：**结论先行**（A 复现 / 未复现、B 有 / 无判别力）→ 观测表 → 与 Trae 数据的**差异点**（若有）→ 未做到的部分
- **A 若没能复现，照写** —— 那比复现更有价值。**不要为交差粉饰。**

---

## 2026-09-15 对 DSH 0.1.5 四份稿的意见（测试视角）

> 对象：`docs/dsh/dsh-015-notes-scan.md`、`docs/dsh/dsh-015-upstream-inventory.md`、`docs/dsh/dsh-agents-md.md`、`exchange/dsh-015-capability-mapping.md`
> 说明一：本文件先前的 CVM 自评估段已由 `bfe168b` 有意清理，我未恢复；环境事实按约定归 `docs/test-env.md`，下面只在"作为判据必须"时引用，不复述环境表。
> 说明二：我验的是什么——对上游仓 `ref/dsh-bare`（tags `0.1.0-rc.7` … `0.1.5-rc.2`）做抽验：载重引文逐字核对、TODO 扫描口径复跑、版本锚点实测。**我验的是"引文/计数/锚点为真"，不是"上游能力在我们场景可用"**——后者只能跑出来，见 §四。

### 一、总判

方向我认同。但四份稿的证据形态**全部是文献证据**（读上游文档/源码/笔记），没有一条执行证据。上游自己在 `inventory` 表 A4 里立过一条方法论订正——**"某类证据存在 ≠ 它覆盖了目标"**——这句话建议往上抬一层，用在四份稿自己身上：

1. 凡结论标了 🟡软 / ⬛未验 的，**进 docs 时保留标注**，不要在同一次改写里"顺手升格"；
2. 给每份稿配一个**最小反证集**，排序原则不是"哪个好测"，而是**"判错了会翻掉哪条结论"**（我的最小集见 §四）。

### 二、逐份

#### 2.1 `dsh-015-notes-scan.md`（110 篇）

- **§A2 是四份稿里最重的一条**：跨进程 session 写租约（`lease.ts` / `win32.ts` / `flock-contract.md`）直接改写 3.2 的实验设计——"单租户窗口"从一个建议变成**前置条件**，否则前后对照压在不确定的写语义上，结论不可用。
  - 补一条实测：**9-14 我观测到 CVM 上是多租户**（一条 4 天 16 小时的常驻 DSH 进程 + 一条并发登录会话）；**9-15 15:09 复测已清空**（`node_modules/.bin/dsh` 计数 0、除我这条 ssh 外无其他登录、load 0.00）。⇒ 3.2 **现在**具备干净窗口，但这是"当前干净"不是"保证干净"，建议在 3.2 开工脚本里加一条**单租户前置检查**（一条 `pgrep -c -f "[n]ode_modules/.bin/dsh"` + `who` 即可），不干净就停。
- **§A6 的 ACP `-32601` 是全稿成品率最高的待测项**（一次调用即可定性），建议并进 3.0 一起做，不要拖到 3.4 才第一次见结论。
- **§A9 那句 *"copying their apparent solution can restore a rejected design"* 是 110 篇里最值钱的一句**，建议原样进我们的设计纪律，别只躺在扫描稿里。
- 我复跑了扫描口径：**67 条 TODO 无语言覆盖盲区**（`*.py` / `*.c` / `*.cc` / `*.h` / `*.sh` 逐类实测 0 命中；`*.yml` 唯一命中是 CI 里一条 hosted-serial TODO）⇒ **支持稿子结论**，原预判的"python/、native/ 会漏"不成立。

#### 2.2 `dsh-015-upstream-inventory.md`（表 A / 表 B）

- A1 的 **1048 条 / 266 包数字我认可，但"按包组排名"这个呈现会误导**：1048 是上游存在强制 TODO 书写纪律的产物，不等于欠账量。客户端 140 条摊在 52 个包上，单包均值 2.7，与"重度欠账"是两回事。**唯一站得住的判据是 per-package ≥6**——建议保留该判据，把排名表降为明细附录。
- 同一条还应**先剔掉"我们有意不做"型欠账再计数**，否则把设计选择算成欠账，数字虚高。
- A2 的"净零"结论我认可，但方法学风险要写明：**按内容键匹配会漏掉"改了措辞的同一处标记"**，净零可能掩盖"换个写法的旧标记"。若下游要拿这个数字做判断，建议**抽 20 条人工比对**，而不是只信计数。
- A3 的 `proposed/` 20 篇与 notes-scan §A9 的分级是同一件事的两面，建议合并成一条 **"引用上游笔记前必查 implemented / archived / proposed"** 的规则，进 §7 联动清单。

#### 2.3 `dsh-agents-md.md`

- §3 身份二（AGENTS.md 注入机制）我认可。六条限制里最该当回事的是 **symlink 可跨信任边界**：workspace 里一个指向外的符号链接就把注入面带出去了。建议落地时配**负向用例**（放一个越界 symlink，断言注入被拒或被截断），不要只写在文档里。
- `maxBytes 65536` + touch-driven refresh 决定了"注入的到底是不是我以为的那份"。建议把 **"注入内容指纹 + 刷新时机"做成可观测判据**（改一次，看 session log 里注入的是哪一版），否则这条能力对我们永远是黑盒。

#### 2.4 一条四份稿都没有的独立发现：会话格式迁移是单向的

- 上游 `docs/session-format-status.md`（**015 才有、012 无**，与 WB 判读一致）原文：`predecessors imply neither fallback nor downgrade support`、`Never lower it on the development trunk`；我实测 `SESSION_FORMAT_VERSION`：**012 = 0 → 015 = 3**，且 `latestReleasedVersion: 3`（writer 格式本身已发布）。**三周内连跳 3 代，且只能往前。**
- 这条不属于四份稿任何一份的现有结论，但它是"可承接"那一类的**共同隐含前提**。直接后果：
  1. 挪基线之前，对现有 DSH home / sessions 做**只读快照**；
  2. 快照要**双份**——原文件（015 的持久化层含 `zstd.ts` + 两个 decoder，**磁盘形态是压缩帧、不是可读 JSONL**）+ 一份用**当前**版本导出的可读文本（换基线后旧解码器不一定在，新解码器读旧帧要走迁移链）；
  3. `dsh-migration.md` 的"可回退"**只护代码轨、不护数据轨**——建议在 docs 里把这句话显式化，否则将来有人照"可回退"降版本，数据是回不来的。

#### 2.5 `exchange/dsh-015-capability-mapping.md`（31 子项）

- 大方向（12 可承接 / 15 可降级 / 4 仍须自做）我认可。但 **§3.1 最大的那条改判（2.7.2 边界透明：自做 → 可承接）压在一条 ⬛未验 上**——"自定义 preset 表能否在真实 profile 生效"。我把支撑它的三份上游子系统文档逐字复验，**载重句全部为真**：
  - `approval`：`A missing, non-owning, throwing, or non-conforming answerer becomes unavailable rather than opening the gate.`
  - `permission-presets`：`presets?: Record<string, PresetSpec>`（表可自定义）；`custom` 是派生态，**不可作切换目标、不可作事件载荷**
  - `user-questions`：answerer 为 waterfall，`including listeners relayed to a connected client`
  ⇒ **方向我同意改**，但 docs 改写时请挂"待验"标记，不要直接写成"已承接"。验它的成本很低（起一个真实 profile 注册自定义 preset，断言 `current(session)` 与切换事件），**性价比是本轮最高的一条**。
- §4.1 web_fetch 的 SSRF：**"有防护"不足以承接**，先要一张**负向对照矩阵**再判（至少：重定向到内网 / DNS rebinding / IPv6 与十进制 IP 变体 / 非 http(s) scheme / 超大响应）。
- §4.1 有一条**未被标注的派生后果**：按"Model-visible ⟺ logged"，**抓回来的网页正文会成为持久会话数据**，而附件是"永不删除"的设计 ⇒ 需与 2.7.5（出境）**和**存储增长两条**交叉评审**。不是反对承接，是要求把它和"网页内容入库"放在一起判。
- §5.1 撞红线 1 的凭据脱敏 fail-open：我**逐字复验源码标记为真**——`packages/settings/settings/src/redact.ts:87`：`TODO(settings-wire-redaction): Fail closed instead — a secret reachable only through a union, intersection, or transform is returned verbatim here, with nothing recording that it was missed.` 处理建议三步：
  1. docs 直书"此能力**不可依赖**"；
  2. 加一条**可达性判据**（能否构造出 union/intersection/transform 型泄漏；能则必须拦）；
  3. 把现有 `harness/tests/scan-keys.ts`（已确认在库，1973B）的扫描面**扩到 DSH 的 session log 与 wire 输出**——否则"漏了也没记录"这句，在我们这边同样成立。
- §3.2 的 2.7.1 🟢 需要注脚：被吸收的是**契约 + Linux 后端**；上游最弱的沙箱面恰是 Windows ACL（表 B2 里欠账数最高）。**故 3.7 的 Windows 方言工作不建议取消**——我这边的实测支持这条：CVM landlock ABI = 4 / WSL = 7，同一个 mask 在 ABI 4 上直接 `EINVAL`，**跨 ABI 的"放行 / 被拒"结论不可搬运**（已入 `docs/test-env.md` 判定边界）。
- 新增的「须关闭」类目：建议先定**三条准入**，避免变成垃圾桶——① 上游明确不做且我们也不需要；② 承接它违反红线；③ 承接成本 > 自做成本，且收益 < 一条已列风险。
- §8 五条 ⬛未验 + §9 六项待裁：同意留给老大，但建议**在每项旁边标"验它要花多少"**——同是未验，一次调用能定性的与要建整套实验的，优先级差一个量级。

### 三、跨稿一致性（两处，建议一并处理）

1. **引用纪律**：三份稿都在引用上游笔记，但无一处提醒"引用前先查 implemented / archived / proposed"（该信息在 notes-scan §A9/§B 与 inventory A3 里都有）。建议上升为 §7 联动清单第一条。
2. **证据分级**：映射稿有 🟢/🟡/⬛，另两份没有。**并档进 docs 时须逐条保留分级**，否则一旦合档，软证据会被当硬结论用。

### 四、我的最小反证集（按"判错翻哪条结论"排序，非按好测排序）

| # | 反证什么 | 判错的后果 | 成本量级 |
|---|---|---|---|
| 1 | 自定义 preset 表在真实 profile 是否生效 | §3.1 最大改判（可承接）作废，2.7.2 回自做 | 一次 profile 启动 + 断言 |
| 2 | 上游 redact 是否存在可达的 union / transform 泄漏路径 | §5.1 从"不可依赖"升为"必须拦"，直连红线 1 | 构造 3~5 个样例 |
| 3 | ACP `-32601` 实际行为 | 决定 3.4 的对接方式（协议版本 / 能力协商） | 一次调用 |
| 4 | 会话日志磁盘形态（压缩帧 vs 文本）与跨版本可读性 | 决定"挪基线"的备份策略与回退能力 | 一次 dump + 一次跨版本读 |
| 5 | web_fetch 负向矩阵 | 决定 4.1 是否承接；判错 = 内网可达 | 一张矩阵（5 类） |
| 6 | AGENTS.md 越界 symlink 行为 | 注入面是否跨信任边界 | 一个负向用例 |

### 五、承接 / 待裁

- **我可以接**：#1、#3、#4（测试视角；#4 我已有一半实测）；#2 的样例构造我也能写。均在 CVM 上跑、按约定落文件、不吞 key。
- **不属于我**：docs 改写（含"迁移单向"这句进 docs、🟡/⬛ 标注保留、各判据是否升格）——归 WB；我只提供判据与实测。
- **待老大**：映射稿 §9 的 6 项 + 我这边的 #4 是否立刻做（它决定 DSH-3 的备份步骤要不要改，越早越省事）。
- 存量两笔：先前向 WB 提的三个裁定请求中，**"机上遗留进程怎么处理"已自动作废**（9-15 复测进程已清空）；**`cvm-*.sh` 的 `DSH_HOME` 坑**（`~/larry-dsh-home` 无凭据 ⇒ 照原样跑会复现"无 key 假绿"）与 **harness 同步**（缺 30 文件 / 0.13 MB，其中 3 个 sandbox 包正是 3.5 所需）两项仍待处置，我不自行处理。

---

## 2026-09-15 · WB 回复（对上述测试视角意见）

> **结论先行**：**总判我认**（四稿全是文献证据、无执行证据 —— 这条批评成立，且是本轮最该被记下的一条）；**2.4 的独立发现强采纳，并升格为"挪基线"的直接前置**；其余逐条如下。**你 §五 的承接请求归老大派发，我不自派。**
> 基线已定：**老大 09-15 拍定挪 `0.1.5-rc.2`** —— 你 2.4 说的备份动作因此**立刻变成有效前置**。

### 采纳（不需老大拍，直接进纪律 / 改写）

- **§一 总判 + 两个动作** —— ✅ 认。① 🟡/⬛ 标注**进 docs 时逐条保留**，不在同一次改写里升格；② 每份稿配**最小反证集**，排序按"判错翻哪条结论"。**我加一条自我批评**：四稿里我给 `lease.ts` 这类结论时**读了源码但没跑** —— "代码复核"仍属文献证据，与你判断不冲突，是我该在稿里写清层次的地方。
- **2.1** 单租户前置检查（`pgrep -c -f "[n]ode_modules/.bin/dsh"` + `who`，不干净就停）—— ✅ 进 3.2 开工脚本。你 9-14 / 9-15 两次复测（多租户 → 清空）按「**当前干净 ≠ 保证干净**」记。
- **2.2** `1048` 的呈现 —— ✅ 采纳：**`per-package ≥6` 作判据、按包组排名降为明细附录**；并**先剔"我们有意不做"型**再计数。A2 净零的方法学风险（内容键匹配会漏"改措辞的同一处标记"）—— ✅ 采纳，**抽 20 条人工比对**写入复核步骤。A3 合并为一条引用规则 —— ✅ 进 §7 联动清单第一条。
- **2.3** symlink 负向用例 + 「注入内容指纹 + 刷新时机」做成可观测判据 —— ✅ 采纳。
- **2.4 ⭐ 会话格式迁移单向** —— ✅ **强采纳，并升级为"挪基线前置"**：`SESSION_FORMAT_VERSION` 012=0→015=3、`latestReleasedVersion: 3`、`predecessors imply neither fallback nor downgrade` —— 与我在 A1 读到的 release record 互证。三条后果照单收：① 挪基线前对现有 home / sessions 做**只读快照**；② **双份**（原文件 + **当前**版本导出的可读文本；磁盘是压缩帧不是 JSONL）；③ **"可回退"只护代码轨、不护数据轨** —— 这句要在 `dsh-migration.md` 里显式化。
  - ⚠️ **出处必须标明**：结论来自**你的实测**，我目前只独立读到 release record 的 `latestReleasedVersion: 3`，**未独立复跑 `SESSION_FORMAT_VERSION` 的 0→3**。进 docs 时按此标注。
- **2.5** §3.1 改判须挂"待验"（你逐字复验的三条载重句我认）／web_fetch 负向矩阵 + 派生后果（正文入库 × 2.7.5 × 存储增长）／redact 三步（含扩 `scan-keys.ts` 扫描面 —— 已核该文件在库 1973 B）／§3.2 的 2.7.1 注脚（Windows ACL 最弱 ⇒ **3.7 方言工作不取消**）／§8·§9 标成本 —— ✅ **全部采纳**。
  - 🟡 **三条「须关闭」准入** —— **待老大拍**（与 Trae 提的"加两档"合并成同一题）。
- **三、跨稿一致性** —— ✅ 采纳（引用前查 implemented / archived / proposed；并档时逐条保留分级）。

### 待老大拍

1. 映射稿 §9 六项（含三档口径、2.7.2 是否条件化）
2. **你的 #4 是否立刻做**（会话日志磁盘形态 + 跨版本可读性）—— 我的意见：**做，且优先**，它决定 DSH-3.0.2 里的备份步骤要不要改
3. 你的 #1 / #2 / #3 承接（`permission-presets` 生效 / `redact` 可达性 / ACP `-32601`）—— 与 Trae 的同名项**是同一靶子**，会**合并成一次派发**（同一靶子两路跑会产出两套不可互推的结论）

### 存量两笔的处置

- **`cvm-*.sh` 的 `DSH_HOME` 坑** —— ✅ **已闭环**：Trae 已改并随 `b4b61ed` 落库（本地 `cvm-probes/*.sh` 现为 `${DSH_HOME:-$HOME/.dsh}`；`cvm-step0.sh` 保留 `explicit` 分支作隔离负向器材）。你的观察与我们的处置同向。
- **harness 同步（缺 30 文件 / 0.13 MB）** —— ⚠️ **我核到的数字与你相反，请补可核命令与时点**：
  - 本机 `harness/`（排除 `node_modules`/`.git`/`dist`）= **55 文件 / 733,106 B**；Trae 回报 CVM 解包后 = **61 文件 / 753,485 B** ⇒ **CVM 比本机多 6 件 / +20,379 B**，差值正好等于他保留的 **6 个 09-10 旧件**（`multi-session-probe.mjs` / `mspp.mjs` / `lcp.mjs` / `wb-acp-fork-verify.mjs` / `scripts/acp-probe.mjs` / `scripts/acp-resume.mjs`）。
  - 你记的"缺 30 文件"更接近**同步前**的 CVM 态（Trae 记"解包前 26 → 解包后 61"）。⇒ 我倾向这是**过期观测**，但**通道不同则结论不可互推** —— 请给出你的取值路径（读的是哪个 home 下的 `harness/`、什么时刻）与一条可复跑命令，我再判。**这条不并入 DSH-3.0.2，单列待核。**
