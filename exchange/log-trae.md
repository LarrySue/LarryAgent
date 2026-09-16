# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。
>
> 📌 **2026-09-16 清理**：DSH-3.0.3 / 3.0.4 的派发稿与三段回报（原 `:8-386`）已按上条删除；其结论已承接进 `TODO.md` DSH-3.0 段、`docs/dsh/dsh-migration.md` §3.6、`docs/dsh/dsh-015-capability-mapping.md` §5.1 / §8，执行范式与通道坑进了 §3.6〈执行范式与边界〉。原始全文（524 行）：`git show 8f86de8:exchange/log-trae.md`。

> 📮 **当前派发（2026-09-17）→ DSH-3.1 · S0 基础链路**（WB 出稿，⬜ 待执行）。**这是本文件当前唯一在飞的任务，正文在文件末尾**〈DSH-3.1 派发稿〉段。

---

# Trae 意见 · 未结项（原《DSH-0.1.5 四稿意见》2026-09-15，2026-09-16 清理后留存）

> 📮 **WB 批注**：原稿 138 行。**已承接的**（§2.1 两把锁 → `TODO.md` DSH-3.2；§2.2 方言修复件 015 重判 → `TODO.md` DSH-3.7；§2.3 → mapping §8 未验项；§2.4 → mapping §5.1；§2.5 → mapping §8 未验项 4；§2.7 → `dsh-migration.md` §3.6「姿势自证」）与**已闭合的**（§三 基线冲突 09-15 老大已拍；§四 落点 / 六问已认）均已删除。
> **下面只剩未获裁决的建议 ＋ 未派发的实测项。**

## 一、未结建议 · 对正式文档的改动（**待老大裁**）

> 三条均已核对：**未落地**。性质属"要不要改"，故不自行处置。

### 1.1 `notes-scan.md` §A1 的结论建议加限定（防"定位也不用等了"的误读）

现结论 =「产品哲学已在 rc 落盘、不必等 stable」。Trae 指出它**只证"哲学（稳定性承诺）可读"**，**不证"产品定位（能力面广度）已到齐"** —— 内证：8 个域里 **4 项连子系统页都没有**（记忆 / 画像 / 自动路由 / 时间感知）、`identity` 仍是 anonymous、出厂形态是 loopback。
⇒ 建议末句加：「**哲学已在 rc 落盘（不必等 stable）；产品定位（能力面广度）仍在建设中 —— 这是两件事，前者不必等，后者确实还没到齐。**」

### 1.2 `capability-mapping.md` §2 总表建议加一列「我方剩余工作量占比」（粗估，待复核）

理由：三分类是**定性档位**、"仍须自做 = 4" 是**计数**，而老大要拿它做"哪些做哪些不做"的取舍 ⇒ **两者之间缺一个"量"**。
反例（Trae 亲测项）：**2.4.2 长期记忆闭环**判 🟡，但 `storage` 只有 KV、无向量无 FTS ⇒ 向量召回 ＋ 语义层（人审 / 矛盾检测 / 保鲜）**全自做**，剩余工作量占比 **≥ 80%**；"可降级"在此 = 省掉"从零设计存储"，**不等于**省掉这一项。

### 1.3 「可承接」判据建议加三层验收前置

> 「上游有正式契约 ＋ 默认实现」**≠**「我方环境已就位」。

建议拆三层、**分别过**：**① 契约在 → ② 默认实现在 → ③ 我方环境已就位**；否则"12"只是**纸面数字**。
实测实例（Trae 2026-09-15，CVM）：契约在（`~/.dsh/profiles/sdk/package.json` 结构正常）、包在（`profiles/node_modules` 里 223 个 `@deepseek-ai` 包），但**环境未就位**（该 profile `dependencies = {}`、`sdk/node_modules/@deepseek-ai` = 0）⇒ 真实运行**启动期即崩**；而假绿源 `dsh --profile sdk --help` 在**三个 home 下全部 exit 0**。

### 1.4 传输安全的一条验收法（未来上公网时用）

`2.10.1` 的可复用验收法（Trae 在 WSL 实测）：**绑 `127.0.0.1` 起服务 → 本机侧可达（200）／局域网侧不可达（000）**。它与 mapping §5.2「出厂 cookie 未标 `Secure`、传输是 loopback HTTP」配成一对 ⇒ **上公网前必须有一条"从非本机探测必须失败"的验收**，而不是只写"我们加了 TLS"。
（同节的网络基线已入 `TODO.md` DSH-3.0 段〈顺手采数〉：`registry.npmmirror.com` 784 KB/s ／ `github.com` 121 KB/s，**同机不同目标差 6.5 倍**。）

## 二、未派发 · Trae 能立刻动手的（供派发参考）

| 项 | 位置 | 前置 | 对应 |
|---|---|---|---|
| **3.2 两把锁区分实验**（含 Windows `taskkill /F` 后租约是否真释放） | 本机 ＋ WSL | 无 | `TODO.md` DSH-3.2（判据已补） |
| **015 `sandbox-local.confine()` 契约对照 ＋ 方言自修判定** | 本机（读 `ref/dsh-bare` @ 015） | 无 | `TODO.md` DSH-3.7（前置已补） |
| `permission-presets` 自定义表 ／ `workspace` membership 运行时实测 | CVM（通道已验） | 无 | 前者 ✅ 已验（DSH-3.0.2）／后者 = mapping §8 未验项 1 |
| `settings/redact` fail-open 构造用例 | 本机隔离 profile | 无 | mapping §5.1（🅿️ 缓办 · 归 TODO 层） |

---

# 📮 DSH-3.1 · S0 基础链路 — 派发稿（WB 2026-09-17 出稿）

> **状态**：⬜ **待执行** · 本文件当前唯一在飞任务
> **执行人**：**Trae** ｜ **场地**：**CVM 单跑**（老大 2026-09-11 拍定；理由：S0–S4 的判定标的全在 Linux 侧，本机对照省）
> **判据源**：`TODO.md` DSH-3.1 段（四项硬判据）＋ `docs/dsh/dsh-migration.md` §3.6（〈各切片判据细则〉/〈负向对照矩阵〉/〈执行范式与边界〉/〈参考实现登记表〉3.1 行）
> **回报**：写到本段**下方**（含负向对照与三元组），不另开文件

## 0 · 一句话目标

造出**首个"产品"插件**（此前 `harness/packages/*` 全是探针）`harness/packages/plugin-tool-readfile/`，并跑通一条**可复跑**的 e2e：

> 客户端 → `sdk` JSON-RPC → session create → agent loop 挂 1 个自做工具 `read_file` → 真实 LLM 调用 → 回客户端 → session 落盘 → 回读

**这一条链同时验四个前置**：交付通道 / plugin mount / llm provider / session 持久化。

## 1 · 四项硬判据（**须同时成立**，缺一不算过）

| # | 判据 | ⚠️ 陷阱（照字面实现会假绿或假红） |
|---|---|---|
| ① | 消息往返 **＋ `PING-<nonce>` 内容断言** | 只验「往返成功」**会被空壳会话骗过** ⇒ 必须断言回包内容含我们发出的 nonce |
| ② | plugin **确实被激活** | ⭐ **以 boot 时 `activate` 打点为准**。**`--dump-config` 是假绿源** —— 实测只组配置树、不激活插件（探针行**出现在 dump 里但没执行**） |
| ③ | 真实回包非空 **＋ `turn/end.reason.kind === 'completed'`** | ⚠️ 口径订正：成功跑**必然带** `turn/end.data.reason = {kind:'completed'}`，**不是**「reason 不存在」——后者是字段路径取错写下的错误表述，**照字面实现会假红**。`max-tokens` / `aborted` / `blocked` / `interrupted` **一律判红** |
| ④ | session **落盘 ＋ 回读可查到同一 nonce** | 不是「文件存在 / 条数够」 |

**不得作判据的三项**：`exit 0` / session 建立 / 有事件流 —— 它们在**无 key / 错 key / 关 key** 三种失败场景下与成功**完全一致**。

## 2 · 交付物（进仓库，不只留 CVM）

1. **`harness/packages/plugin-tool-readfile/`** —— 首个产品插件
   - 形状参照**同目录 `plugin-probe/`**（`package.json` 的 `dsh.bundle.patch` 声明 ＋ `cordis.patch.yml` ＋ `src/index.ts` ＋ `lib/`）
   - ⚠️ **`apply(ctx, config)` 必须容忍 `config === undefined`** —— 社区件实证：patch 里无 `config:` 块时 cordis 传 `undefined`，**裸 `dsh plugin add` 会崩**（§3.6 登记表事实 8）
   - ⚠️ **声明 `inject: []`（零硬依赖）**：能力用 `ctx.get(...)` 探测、缺失即降级（§3.6 事实 3 的设计纪律）
2. **可复跑 e2e 脚本**（`harness/scripts/` 或 `harness/tests/`，随你定；须一条命令复跑）
3. **回报**（格式见 §6）

## 3 · 参考件（四要素 —— 开工前先在登记表 3.1 行定位，用完**回填一行「借鉴点」**；找不到就写"无"）

**主参考 · `ref/community/kun2-5code__dsh-plugin-template/`**（已落位本机）
- **路径**：`ref/community/kun2-5code__dsh-plugin-template/`
- **怎么参考**：读 `package.json`（`dsh.bundle.patch` ＋ `dsh.client` 的**包级声明形状**）、`src/index.ts`（`service` / `hook` / `commands` 三半边划分）、**`test/smoke.mjs`（假 ctx 单测范式）**、`dev/cordis.yml`（开发 overlay）
- **参考程度**：**只借鉴设计 ＋ 可抄形状**（逻辑自写）
- ⛔ **不可参考**：`src/client/` 14 个文件**全是 React**（本项目前端 Vue/Tauri，**UI 代码不可照搬**）；`dev/cordis.yml` 的 overlay **只加载 host 半边**（模块解析到源码文件，**发现不了 `dsh.client` 包级声明**）⇒ **不能拿它判 client 半边可用**
- **许可**：MIT（真要抄代码走 §3.0：**fork → 本仓库 → review / 测试**）

**官方参考**（`ref/dsh-bare/` 是**裸仓库**，读法 = `git -C ref/dsh-bare show dsh-v0.1.5-rc.2:<路径>`）
- sdk 面：`packages/sdk/{protocol,client,server}` ＋ 包 `@deepseek-ai/dsh-sdk-app`
- **工具注册范式**：`packages/fs/tool-fs`（已核实 015 存在）
- 最小组合：`@deepseek-ai/dsh-sdk-minimal`
- ⚠️ 四条已踩坑（§2.2.1）：不用工作区 `ls` 判包是否存在；不把 config-catalog 当包清单；**嵌套子包不在顶层**；**不在 Windows 做整体 checkout**

**e2e 台（未落位，要用则自拉）**：`iiwish/dsh-testkit`（Docker 隔离的真宿主生命周期测试）／`PerryLink/dsh-test-drive`（一次性 profile 冒烟）
- ⚠️ 拉取坑：本机 git 全局配了 socks5 代理，代理未运行时 clone 报「连不上 github」（**看起来像被墙，实为代理**）⇒ 绕法 `git -c http.proxy= -c https.proxy= clone --depth 1 <url> <dst>`

**社区名录**：`ref/awesome-dsh-plugin.md` 的 `Tools & Capabilities`（行 1417）／`Development & Runtime`（行 2705）

## 4 · 负向对照（**必须做** —— 不做则「真通了」与「判据没生效」不可区分）

| 破坏动作 | 期望变红的判据 |
|---|---|
| profile 里注释掉自做 bundle | ② plugin mount |
| 换成错 Key | ③ ＋ 3.0 红灯组 |
| 摘掉 / 只读 session 落盘目录 | ④ |
| kill SDK 客户端进程 | ④（已写入部分的一致性） |

## 5 · 场地与器材（**已由 WB 实测核对，勿重造**）

**CVM**（`docs/production-env.md` §1 / §12）

```
host 49.232.129.252 · user ubuntu · ssh -i ~/.ssh/id_ed25519_cvm
```

- ⚠️ **PATH 必须显式加**：`export PATH="$HOME/node/bin:$PATH"` —— 实测**非交互与登录 shell 都找不到 `node` / `dsh`**（`./node_modules/.bin/dsh` 直接报 `exec: node: not found`）
- **dsh CLI**：`~/harness/node_modules/.bin/dsh` = **`0.1.5-rc.2`**（⭐ **不在 PATH 里**，须写全路径）
- **node**：`~/node/bin/node` = `v22.22.2`
- **home**：`~/.dsh`；凭据 `~/.dsh/.credentials.yaml` **已就位**（`600` / 223 B）
- **`~/.dsh/profiles/sdk`** deps 五项**全 015**：`dsh-base` / `dsh-http-proxy` / `dsh-sdk-app` / `dsh-session-persistence` / `dsh-session-query`
- ⚠️ **CVM 上没有整个仓库**，只有 `~/harness`（tar 同步，排除 `node_modules` / `.git` / `dist`）⇒ `DSH_REAL_API_PROFILE_HOME` **必须显式指** `~/.dsh/profiles`（其默认值是 `<repo>/.dsh-home/profiles`，**CVM 上不存在**）
- ⚠️ CVM `~/harness/packages/` 现有 5 个（缺本机的 `plugin-015-preset-probe/`）⇒ 下次同步补齐，**不影响本任务**

**SDK 会话器材 —— 复用 `harness/tests/real-api.ts`，勿另写一套**（否则两处会话构造法会漂）

- `runRealPrompt({message, key, model?, timeoutMs?})` → 内部 `new DeepSeekHarness({profile:'sdk', provider:'deepseek-official', dshHome:<临时 home>, env})`
- 临时 home 复用 sdk profile（**177 MB 不可拷贝**）；跑前 / 跑后各清一次**孤儿锁**（`releaseOrphanProfileLock`：**只清死 PID，重命名备份不删除**；持有者仍存活 → **停手抛错**）
- 超时已放宽：`INITIALIZE_TIMEOUT_MS=120s` / `REQUEST_TIMEOUT_MS=240s`（**真实调用实测 ~106 s**，SDK 默认 20 s ⇒ 不放宽会假超时）
- ⚠️ **real-api 链路读不到 `.credentials.yaml`**：`tests/isolated-setup.ts` 把 `DSH_HOME` **强制覆盖成临时目录** ＋ 正向白名单断言 ⇒ **Key 只能来自环境变量**

**⚠️ 一个必须你自己决策并声明的点：装插件会写 profile**

§3.6 实测「**boot 类动作不是只读**」—— 对任意 home 跑一次 boot 会**改写该 home 的 `profiles/node_modules`**（触发门槛很低：`dsh --profile <p> --help` 就够）。所以「把新插件装进 sdk profile」这一步**必然写 profile**。两条路二选一：

- **(a) 真副本（推荐）**：把 sdk profile `cp -r` 到临时目录，在副本上装插件与跑 e2e ⇒ 源 profile 不动。
  ⚠️ 注意 `real-api.ts` 的 `createRealApiHome()` 内部用的是 **symlink**（**会穿透写源**）⇒ 选 (a) 须改用 `cp -r`。
- **(b) 直接写源 profile**：可接受，但**必须留痕** —— 跑前 / 跑后各取一次 `readlink` 与 `ls` 快照。

## 6 · 回报格式（写回本段下方）

1. **判据逐条**：① ② ③ ④ 各报「实测值 ＋ 绿灯证据」；**② 必须附 `activate` 打点的原文**
2. **负向对照**：4 条各报「破坏了什么 → 哪条判据变红 → **红灯原文**」
3. **三元组**：每态显式记 **`(DSH_HOME, profile, 凭据来源层)`** —— 否则「无 key 态」与「真 key 态」可能测的是同一件事
4. **复跑命令**：一条能让人一步复跑的命令（含全部环境变量）
5. **姿态自证行**：脚本头部写明本脚本模拟的是**哪条真实链路**（哪个执行器 / 哪层前导 / 哪个 home＋profile）—— 判据姿势不对会**同时造出假绿与假红**
6. **坑与订正**：凡与本稿 / 文档记载不符的**逐条列出**（这是最有价值的部分，别只报好消息）

## 7 · 禁区

- 🔴 **Key 绝不落盘**：只走环境变量注入；跑完 `assertNoKeyOnDisk()` 自查（`harness/tests/real-api.ts:375`）
- 🔴 **禁用 `git rm`**；**不做任何 git 远程操作**（push / fetch 由老大做）
- ⚠️ **CVM 产出不得是唯一副本**（机器 10-09 到期）⇒ 新造件与证据**同步回本仓库**
- ⚠️ **「启动 / 装载类」假绿三连**（判「环境可用 / profile 可用」前必读）：
  ① `dsh --profile <p>` 在 profile **不存在时同样 `exit 0` ＋ 双流全空**（dsh 会自动把 home 建成**空壳 profile**）⇒ **`exit 0` 永远不能单独当判据**；
  ② boot / 启动探针**必须保 stdin 打开**（`stdio:'ignore'` 会得「exit 0 ＋ 双流全空」的假绿）；
  ③ **必须配负向对照**：拿一个**必然坏的输入**（如不存在的 `DSH_HOME`）重跑，观测若**逐值不变** ⇒ 该判据对这类坏**不敏感**
- ⚠️ **安装 / 启动类命令的退出码也不可信**：`dsh plugin add` 在 pnpm 报 `Done` 后 **node 不退出**（CVM 实测挂 1:51）⇒ 范式 = **后台 ＋ 轮询日志 ＋ 人工收尾**
- ⚠️ **远程长任务范式**：`setsid nohup <cmd> >log 2>&1 </dev/null &` ＋ 完成标记 ＋ `echo $? > rc`；**复入时先看 rc 再看日志**

## 8 · 顺带项（同批交，不单独派）

🧹 **清退代码内的 log 指针**（原则见 `exchange/README.md`「协作规则」末条；三处**均已失活** —— 它们指向的 `exchange/log-claude.md` 内容此后整体轮换过）：

| # | 位置 | 改法 |
|---|---|---|
| ① | `harness/tests/global-setup.ts:75-77` | **就地自足化**：把语义写进注释本体 —— 「**方案 A —— 按真实退出码退出 ＋ 打印诊断，不因残留本身判红**；另一候选「残留即判红」因会制造假红而被否，**假红比没护栏更糟**」＋ 裁决日期。**内容源 = `TODO.md:40`**（原出处已消失，archive 两份归档件均无） |
| ② | `harness/tests/global-setup.ts:127` | **删**「，见 exchange/log-claude.md 裁决记录」括注，其余不动 |
| ③ | `backend/tests/test_integration_llm.py:48` | **改指** `archive/report-2026-08-30.md`（该 aiosqlite 事故复盘的**永久落点**，内容在）—— 这处**不该删、该改指** |
