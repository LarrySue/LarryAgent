# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

> 📮 **当前派发（2026-09-17）→ DSH-3.1 · S0 基础链路**（WB 出稿）—— ✅ **Trae 已执行完毕并回报**（本文件后段〈DSH-3.1 回报〉，含四项判据／四条负向对照／三元组／复跑命令／坑与订正），**待 WB 复核**。

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

> **状态**：✅ **已执行完毕（Trae 2026-09-17）· 回报见本段下方** · 结论 = 四项硬判据全成立 ＋ 四条负向对照逐条变红
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

---

# ✅ DSH-3.1 回报 · S0 基础链路（Trae 2026-09-17）

> **结论：四项硬判据同时成立；四条负向对照逐条把目标判据打红** —— CVM 上 base ＋ 4 变体**全 PASS**（每条负向变体的 PASS 口径 = "测试内部断言该判据确实变红"成立）。
> 基线 `0.1.5-rc.2`｜场地 **CVM 单跑**｜`DSH_REAL_API=1`｜真 Key 只存在于子进程 env，**不落盘**。

## 一 · 交付物（已进本仓库 · **未提交 git**）

| # | 路径 | 说明 |
|---|---|---|
| 1 | `harness/packages/plugin-tool-readfile/` | ⭐ **首个产品插件**：`src/index.ts`（零外部 import，只用 `node:`）＋ `package.json`（`dsh.bundle.patch` 包级声明）＋ `cordis.patch.yml` ＋ `tsconfig.json` ＋ `test/smoke.mjs`（假 ctx 单测，`smoke ok`） |
| 2 | `harness/tests/s0-e2e.test.ts` | 四项判据 ＋ 四条负向对照的一体化装置（变体开关 `S0_VARIANT`），头部含姿态自证 |
| 3 | `harness/tests/s0-session-log.ts` | 判据 ④ 的回读助手：多帧 zstd **逐帧**解码 ＋ `findToolCalls()`（取 `tool/call` 的**工具名**） |
| 4 | `harness/scripts/run-s0-e2e.mjs` | 一键复跑（默认全 5 变体，每变体 12 分钟上限） |
| 5 | `harness/scripts/s0-kill-child.mjs` · `s0-run-with-file-key.mjs` | 负向 4 的子进程；「凭据文件 → 环境变量」桥（**不打印 Key 值**） |
| 6 | `harness/tests/global-setup.ts` · `backend/tests/test_integration_llm.py` | §8 顺带项三处 log 指针（见第七节） |

**证据**（CVM 产出，**已回传本机** → `D:\Code\_trae-cvm-evidence\s0\`）：`*.evidence.json` / `*.marker.log` / `*.session.txt` ＋ 各轮原日志 `s0-base{,2,3,4,5}.log` / `s0-neg{,2}.log`。

## 二 · 判据逐条（base）

| # | 判据 | 实测值 | 绿灯证据 |
|---|---|---|---|
| ① | 往返 ＋ **`PING-<nonce>` 内容断言** | ✅ | nonce = `PING-b5cb8c74f73f`（17 字符），`finalResponseLength=17` ⇒ 回包**就是**那串；nonce **只写在文件里、不进 prompt** |
| ② | plugin **确实被激活** | ✅ | 打点五连齐：`activate → inject-requested → inject-fired → tool-registered → tool-call`（原文见下） |
| ③ | 真实回包非空 ＋ `turn/end.reason.kind==='completed'` | ✅ | `ok=true turnEndKind="completed" errorCode=undefined assistantMessageCount=2 finalResponseLength=17 failures=[]`；事件直方图含 `tool/call`×1、`tool/result`×1 |
| ④ | session **落盘 ＋ 回读可查同一 nonce** | ✅ | `session.v3.jsonl.zstd` / `37634 B` / `containsNonce=true`；解码后 tool/result 正文即 `<content>\nS0 e2e nonce file (this token is NOT in the prompt)\nPING-b5cb8c74f73f\n</content>` |

**② activate 打点原文**（`/tmp/larry-s0-ks02sg/plugin-tool-readfile.activate.log`）：

```json
{"t":"2026-09-16T23:55:22.126Z","event":"activate","plugin":"plugin-tool-readfile","pid":2497785,"dshHome":"/tmp/larry-s0-ks02sg","configWasUndefined":false,"caps":{"toolsSeam":false,"fsSeam":false}}
{"t":"2026-09-16T23:55:22.127Z","event":"inject-requested","plugin":"plugin-tool-readfile","deps":["tools"]}
{"t":"2026-09-16T23:55:22.313Z","event":"inject-fired","plugin":"plugin-tool-readfile","hasTools":true}
{"t":"2026-09-16T23:55:22.314Z","event":"tool-registered","plugin":"plugin-tool-readfile","tool":"read_file"}
{"t":"2026-09-16T23:55:23.661Z","event":"tool-call","tool":"read_file","path":"/tmp/larry-s0-ks02sg/s0-nonce.txt","bytes":70,"truncated":false}
```

⭐ **① 的防假绿（差点踩上，这是本次最值钱的一条）**：`①` 绿灯**不能证明是我们的工具**。base 的 tool/call 原文是

```json
{"type":"tool/call","seq":14,"data":{"turn":1,"step":1,"callId":"call_00_ET_vNxjq09dYFcU7npB84MH8219","name":"read_file","arguments":"{\"path\": \"/tmp/larry-s0-ks02sg/s0-nonce.txt\"}"}}
```

⇒ 故 ① 拆成**两半**断言：内容断言 ＋ **工具名归属**（`①_toolNameInLog=["read_file"]`、`①_toolNameIsOurs=true`）。依据见坑 3。

> 上面引的是**复跑确认轮**（改完 ①②③④ 断言与 kill-client 破坏动作之后重跑的 base）—— 两轮 base **均全绿**（首轮 `session-44f83f35…` / nonce `PING-1fcc072be456`；确认轮 `session-6c7c4d3f…` / nonce `PING-b5cb8c74f73f`）。交付的 `base.*` 文件 = 确认轮。

## 三 · 负向对照（4/4 全部把目标判据打红）

| # | 破坏动作 | 期望变红 | 实测 | 红灯原文（节选） |
|---|---|---|---|---|
| 1 | 从 profile manifest 摘掉自做 bundle | ② | ✅ | `no-bundle: bundles ["@deepseek-ai/dsh-base","@deepseek-ai/dsh-sdk-app","@larryagent/plugin-tool-readfile"] -> ["@deepseek-ai/dsh-base","@deepseek-ai/dsh-sdk-app"]`；`"activation":{"events":[],"raw":""}`（**一条打点都没有**）；`②_activated=false ②_injectFired=false ②_toolRegistered=false` |
| 2 | 换成明示无效 Key | ③（＋ 3.0 红灯组） | ✅ | `③_verdictOk=false ③_turnEndKind="error" ③_errorCode="AUTH"`；`failures=[…,"turn/end.reason.kind=error（非 completed）code=AUTH status=401"]`；同时 `②_activated=true` ⇒ **证明红的是 ③，不是环境没起来** |
| 3 | `<home>/sessions` chmod 500（只读） | ④ | ✅ | `"sessionLog":{"path":"(none)","logPresent":false,"bytes":0,"containsNonce":false}`（连带 `turn/end.kind=error code=UNKNOWN`） |
| 4 | 轮询到**会话日志首次落字节**即 SIGKILL **整进程组** | ④ | ✅ | `killedBy=first-session-log-byte bytesAtKill=636 signal=SIGKILL`；`"logPresent":true,"bytes":995,"containsNonce":false`，日志尾部停在 `{"type":"agent/inbox/spliced","seq":5,…}` ⇒ **文件在 / 内容在 / nonce 不在** —— 顺带否掉"文件存在即 ④ 过"的弱判据 |

## 四 · 三元组（每态显式记）

| 变体 | DSH_HOME | profile | 凭据来源层 |
|---|---|---|---|
| `base` | `/tmp/larry-s0-ks02sg`（每轮 `mkdtemp`） | `sdk`（**`cp -r` 真副本，源 profile 全程未改写**） | 环境变量 `DEEPSEEK_API_KEY`（real-api 链路读不到 `.credentials.yaml`） |
| `no-bundle` | `/tmp/larry-s0-lgtlJO` | 同上 | 同上 |
| `wrong-key` | `/tmp/larry-s0-gV5FVt` | 同上 | 同上（值换成 `sk-invalid-…` 占位串） |
| `no-session-dir` | `/tmp/larry-s0-mKElgS` | 同上 | 同上 |
| `kill-client` | `/tmp/larry-s0-Ua1QBO` | 同上 | 同上（真 Key 才能真跑到一半） |

## 五 · 复跑命令（一条，含全部环境变量）

```bash
cd ~/harness && export PATH=$HOME/node/bin:$PATH \
  && export DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles \
  && export S0_EVIDENCE_DIR=$HOME/trae-evidence/s0 \
  && node scripts/s0-run-with-file-key.mjs
```

不带参数 = `base no-bundle wrong-key no-session-dir kill-client` 全跑；单跑某变体：`… s0-run-with-file-key.mjs base`。
（`s0-run-with-file-key.mjs` 只把 `~/.dsh/.credentials.yaml` 的 Key 接进子进程 env，**不读值、不打印、不落盘**。）

## 六 · 姿态自证行（`harness/tests/s0-e2e.test.ts` 头部原文）

> - 模拟的真实链路：客户端 → `sdk` JSON-RPC（stdio） → session create → agent loop 挂**自做工具 `read_file`** → 真实 LLM 调用 → 回客户端 → session 落盘 → 回读
> - **执行器**：`harness/node_modules/@deepseek-ai/dsh`（0.1.5-rc.2，即 profile 的 CLI）｜**前导：无**（不经 CLI 子命令，直接走 SDK 的 stdio 通道）
> - **home ＋ profile**：`<临时 home>` 里 `cp -r` 出来的 sdk profile **真副本**（**不穿透源 profile**，见派发稿 §5(a)）｜**凭据来源层**：环境变量
> - **nonce 设计**：nonce 只写在文件里、**不进 prompt** ⇒ ① 一旦绿灯即证明"工具真的读到并回了内容"，而不是"模型把 prompt 里的串复述了一遍"

## 七 · §8 顺带项（三处 log 指针，全部已处置）

| # | 位置 | 处置 |
|---|---|---|
| ① | `harness/tests/global-setup.ts:76-97`（注释块） | ✅ **就地自足化**：写入「**方案 A** = 按真实退出码退出 ＋ 打印诊断，**不因"有残留"本身判红**」＋「**方案 B（否决）** = 残留即判红 —— 根因在 SDK 侧时会把绿跑判成红，**假红比没护栏更糟**」＋ 裁决日期 2026-09-10 ＋ 备查源 `TODO.md:40` |
| ② | `harness/tests/global-setup.ts:135`（运行时输出） | ✅ **删**「，见 exchange/log-claude.md 裁决记录」括注，其余不动（改为 `（方案 A：不因残留本身判红）`） |
| ③ | `backend/tests/test_integration_llm.py:48` | ✅ **改指** `archive/report-2026-08-30.md`（该 aiosqlite 事故复盘的永久落点） |

⚠️ 两点订正：**行号**——原稿写 `75-77` / `127`，实测是 `76-97`（①改后仍在此区间）/ `135`；**范围**——仓库内**代码侧已无 `log-claude.md` 活指针**，其余命中只剩 `.claude/CLAUDE.md` 的流程约定、`archive/` 冷存件、`.workbuddy/memory/` 历史日志（均非"代码内失活指针"，未动）。

## 八 · 坑与订正（本次最有价值的部分）

| # | 坑 | 订正 |
|---|---|---|
| 1 | ⭐ **`inject: []`（零硬依赖）≠ 可在 `apply()` 里探测 `tools` 后注册**：首跑 `②_toolRegistered=false`，打点**只剩 `activate`**（连 `register-failed` 都没有 ⇒ **静默不注册**，最像"环境问题"的那种失败）。根因：零硬依赖 ⇒ `apply()` 在 boot **极早期**执行，此刻 `ctx.get('tools')` 为 `undefined`，而我把探测结果当成了**注册前置** | **注册一律走 `ctx.inject(['tools'], cb)` 回调；`ctx.get` 只用于打点/降级判断**。已回填 `docs/dsh/dsh-migration.md` 事实表**第 9 条**，并标注它**订正事实 3 的适用边界**：零硬依赖是**加载策略**，不是**注册时序** |
| 2 | ⭐ **`ctx.tools.register()` 的 schema 口径 = 标准 JSON Schema**，不是 `defineTool` 的输入 spec：我照抄了**属性内** `required: true` ⇒ 真错原文 `unsupported JSON schema: schema.properties.path.required is not supported on type "string"`（`dsh-tools/lib/index.js:2773` 的 `assertSupportedJsonSchema` 只收标准子集，`required` 须是**顶层数组**） | 改成顶层 `required: [...]`；并在 `test/smoke.mjs` 加**结构防线**（断言 schema 串里不出现 `"required":true`）。已回填事实表**第 10 条**：**手搓工具不必 `defineTool` 包装 ⇒ 可做到零外部 import**（插件以 link 挂载时天然取不到 profile 的 `@deepseek-ai/*`，这是硬约束不是偏好） |
| 3 | ⭐ **① 的假绿风险实测成立**：负向 1（摘 bundle）里模型改用**官方 `read`** 工具把同一个 nonce 读了出来（`①_toolNameInLog=["read"]`、`①_pingInResponse=true`）⇒ **"回包含 nonce"本身完全不敏感**于"这工具是不是我们的" | ① 必须拆两半断言：内容断言 ＋ **工具名归属**。已修（base 与负向 1 各加一条断言） |
| 4 | ⭐ **负向 4 的原设计（固定 2.5 s 后杀）不成立**：单工具回合 ~1.5 s 就整段落盘，定时杀落在**回合结束之后** ⇒ 日志完整含 nonce、④ 依旧绿（当时亮红的是**我自己写错的断言**，不是被测判据）。另：**只杀直接子进程不够** —— harness 的 dsh CLI 是**孙进程**，会继续把回合写完 | 改成**事件驱动**：轮询到会话日志**首次出现且字节 > 0** 立刻以 `detached` ＋ `kill(-pid)` **杀整进程组**，杀完等 2 s 再回读。红灯形态因此升级为"**文件在/内容在/nonce 不在**"，顺带否掉"文件存在即 ④ 过" |
| 5 | **`dsh plugin add` 在 pnpm 报 `Done in …` 后 node 不退出**（本次复现） | e2e 按"见到 `Done` 即视为装成功"＋ 600 s 超时兜底；**其退出码不得当判据** |
| 6 | **CVM 通道**：Windows→ssh 的**内层引号/括号会被吃**（`awk '{print …}'`、`echo (…)`、`grep -E "…"` 全部变形；本次连"扫 Key 自查"都得先 scp 脚本上去跑）；**`node` 不在非交互 shell 的 PATH 里** | 一律 **scp 脚本 → 远程执行**；远程命令只用单层引号、不加括号；node 写全路径 `$HOME/node/bin/node` |
| 7 | 新增的 `tests/s0-e2e.test.ts` 会被 vitest 默认 `include` 命中 ⇒ 若它在开关关闭时直接抛，**默认 `npm test` 会变红** | 改 `describe.skipIf(!realApiEnabled())`（与 `tests/real-api.test.ts` 同口径：**skip ≠ pass**）。本机实测：不设开关 → `1 skipped`、无红灯 |

## 九 · 安全自查（§7）

- Key **只经环境变量**进子进程；临时 home 由 `afterAll` 删除 ⇒ CVM 上 `ls -d /tmp/larry-s0-* /tmp/larry-test-*` **为空**、`~/.dsh/profiles/node_modules.lock*` **不存在**（孤儿锁已按惯例重命名回收）。
- 对 `~/trae-evidence` ＋ `harness/tests` ＋ `harness/scripts` 共 **147 个文件**做 `sk-` 形态扫描：**16 处命中全部为占位串**（`sk-invalid-…`、哨兵 fixture 的 `sk-abcdefghijklmnopqrstuvwxyz…`、`sk-not-a-real-key`），**无真实 Key 落盘**。自查脚本 `_trae-cvm-evidence/s0-scan-key.mjs`（**不进仓库**，输出只含前缀 3 字符与长度，不含任何 Key 片段）。
- 未做任何 git 远程操作；新造件留在工作区（**未提交**）。

## 十 · 与派发稿的差异 / 待裁

1. **判据 ④ 的负向对照口径**：派发稿写「kill SDK 客户端进程 → ④（已写入部分的一致性）」。实测**定时杀不成立**（见坑 4），我改成了"落盘起笔即杀"，红灯形态 =「文件已存在且写了 636 B，但 nonce 不在其中」。若你认为该变体应改成别的形态（例如连"文件已存在即 ④ 过"这一弱判据也要单独出红灯），说一声我改。
2. **① 的附属断言**：`①_toolNameIsOurs` 是我自己加的防假绿断言（派发稿只要求"内容断言"）。它已实测救过一次红灯（负向 1），建议**升为正式判据**。
3. `harness/tests/s0-e2e.test.ts` 落 `tests/` 的原因：被 vitest 自动纳入、与 `real-api.test.ts` 同一套开关纪律；代价是**必须 `DSH_REAL_API=1` 才会真跑**（否则 skipped）。
4. 源 `sdk` profile 全程未被改写（选派发稿 §5 的 **(a) 真副本** 路线）——此处仅作留痕，无需裁定。
