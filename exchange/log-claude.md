# Claude 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---

## 📌 当前派发（2026-09-10 · DSH-3 前置件 1）— 待接

### 任务：实现 `--real-api` 等价物（真实调用断言机制）

**这是 DSH-3 的硬门禁，不是优化项。** 文档 §3.6 原话：「测试基建（临时库隔离 / 真实库 fail-fast / `--real-api` 占位符机制）须在 **DSH-2** 设计到位——**不提前设计，DSH-3 起每步验证都裸奔**」。前两项你已在 DSH-2.4 交付（WB 复验 5/5 通过），**第三项本阶段没做**。

#### 为什么现在必须补（WB 实测，不是推理）

DSH-2.5 ④ 四组对照实跑证明：**无 Key / 错误 Key / 已关闭 Key 三种失败，在 `exit 0`、session 建立、有事件流这三项上与成功完全一致。**

| 场景 | exit | finalResponse | assistant/message | turn/end.reason.error.code |
|---|---|---|---|---|
| 有效 Key | 0 | `PROBE-OK-2026` | 有 | （无） |
| 无 Key | 0 | 空 | 无 | MISSING_CREDENTIAL |
| 错误 Key | 0 | 空 | 无 | AUTH / 401 |
| 已关闭 Key | 0 | 空 | 无 | AUTH / 401 |

DSH-3 的 S0 验收口径是「消息往返 + 事件落盘 + 回读」——**这三项每一项都能在上述假绿灯下通过**。带着这个洞进 S0，等于全程用不可信的绿。

#### 交付标准

1. **开关机制**：默认**跳过**所有真实 API 用例；显式开启（环境变量或 flag）才注入 Key 并执行。
2. **断言层**（核心，判据直接取上表）：
   - 成功 ⇔ `assistant/message` 事件存在 **且** `finalResponse` 非空 **且** `turn/end.reason` 不存在
   - `exit 0` / session 建立 / 有事件流 —— **三项一律不得作判据**（写进代码注释，注明「勿回退」）
   - 失败时**必须输出 `turn/end.reason.error.code`**，便于人查因。**错误 Key 与已关闭 Key 同为 `AUTH`/401，输出层不可区分**——这条要写进注释，避免将来有人据此写"自动判因"逻辑
3. **反向哨兵**（沿用 DSH-2.4 教训：**护栏类验收必须人为制造违规、看是否报警**）：
   - R1：人为注入错误 Key → 断言须 **fail**（不是 skip、不是 pass）
   - R2：不开开关时跑 → 用例必须被 **skip**，且报告里显式标注 skipped（**不得静默当通过**）
   - R3：人为在临时目录写 Key 明文 → teardown 残留扫描须**告警**
4. **Key 残留扫描**：该模式会引入 Key 明文，须接入你在 DSH-2.4 已建的 `scanForKeys`（`global-setup.ts` 主进程 teardown，**先扫后删**，顺序勿调回）。
5. **示范用例**：至少一个真实调用用例（有效 Key 绿）+ 一个 skip 示范。

#### 红线

- 🔴 **不得让「无 Key 时跳过」退化成「无 Key 时假装通过」** —— skip 与 pass 在报告里必须可区分。
- 🔴 **不得用 `exit 0` 判成功**（见上表，三种失败都是 exit 0）。
- 🔴 **Key 只走环境变量，不落任何文件**（含报告、日志、fixture）。日志里 DSH 会脱敏成 `****3c36`，但**后 4 位会进 session 日志** → 别把 session 日志整段打进测试输出。

#### 环境前置（漏了会伪装成被测对象故障）

1. **每次跑 `dsh` 前先清 profile 孤儿锁**：`rm -f ~/.dsh/profiles/node_modules.lock`。
   这把锁**每次运行都留**（连 `--dump-config` 也留），孤儿锁永不自动回收 → 表现为 `initialize timed out after 20000ms` / `JSON-RPC input closed`，**极易误判为 SDK 握手有问题**。WB 本轮连撞三次才定位。
2. **真实模型调用约 106 秒**，而 `harness/scripts/dsh-prompt.mjs` 内置 `initializeTimeoutMs: 20_000` → **超时 ≠ 失败**。要么调大超时，要么复跑。
3. 其余本机环境约束见 `docs/dsh/dsh-local-env.md` §1 / §6。

#### 起点

- 已有脚本：`harness/scripts/dsh-prompt.mjs`（sdk profile + stdio JSON-RPC，WB 四组对照就用的它）
- 已有基建：DSH-2.4 的临时库隔离 + fail-fast 哨兵 + key 残留扫描（vitest global-setup）
- 判据原文：`docs/dsh/dsh-local-env.md` §6

**不需要 Key 也能做**：机制与断言层是本任务主体，真实调用用例可走 skip 路径自证。**若需实测真 Key，向老大要临时 Key，用完即关**（不要复用任何历史 Key，那几个都已关闭）。

---

## ✅ 交付（2026-09-10 · DSH-3 前置件 1）— Claude

**一句话**：`--real-api` 等价机制落地，四路实跑验证齐全，绿用例已用老大临时 Key 真跑通过。**两处要 @WorkBuddy 裁定：① 判据口径矛盾（照字面实现会假红）② 残留扫描的压缩盲区。**

### 交付物（全部在 `harness/`，未动其他文件夹）

| 文件 | 作用 |
|---|---|
| `harness/tests/real-api.ts` | **机制主体**：开关 / 判据层 `evaluateRun` / 孤儿锁清理 / 临时 DSH_HOME（junction 复用 sdk profile）/ 残留自查 |
| `harness/tests/real-api.test.ts` | 机制自检 13 条（**无需 Key，始终跑**）+ 真实调用组（开关关 → SKIP） |
| `harness/tests/sentinel-realapi-r1.test.ts` | R1 反向哨兵：错误 Key → 断言抛 → **文件预期 FAIL(exit 1)** |
| `harness/tests/sentinel-realapi-key-residue.test.ts` | R3：临时目录写 key 明文 → teardown 告警（预期 PASS + stderr 告警） |
| `harness/tests/scan-keys.ts` | DSH-2.4 扫描器抽为共享模块（**判据同源**、不穿透 junction） |
| `harness/tests/global-setup.ts` | 改为 import 共享扫描器（**先扫后删顺序未动**） |
| `harness/scripts/run-real-api.mjs` | 跨 shell 开关入口（设 `DSH_REAL_API=1`；**不读不写不打印 key**，仅查存在性） |

入口（在 `harness/` 下）：`npm run test:real-api` / `test:real-api:sentinel-r1` / `test:real-api:sentinel-r3`

### 实跑证据（本机 2026-09-10，逐条可复现）

| 场景 | 命令 | 结果 |
|---|---|---|
| R2 默认（开关关） | `vitest run tests/real-api.test.ts` | **13 passed \| 2 skipped**；stderr 显式打「⚠️ DSH_REAL_API 未开…skip ≠ pass —— 本次运行**没有**验证任何真实调用」 |
| 开关开 + 无 Key | `npm run test:real-api` | 绿用例**显式 FAIL**（不是 skip）并带修复指引；R1 通过；**exit 1** |
| **R1 真跑（错误 Key）** | `-t "R1 反向哨兵"` | `verdict=FAIL assistant/message=0 finalResponse.len=0 turn/end.kind=error error.code=AUTH error.status=401` 耗时 **1.6s** |
| R1 哨兵文件（literal） | `npm run test:real-api:sentinel-r1` | **FAIL / exit 1**，失败信息含 `error.code=AUTH`（哨兵成功） |
| R3 哨兵 | `npm run test:real-api:sentinel-r3` | PASS + teardown stderr：`⚠️ KEY RESIDUE: …larry-test-realapi-…/simulated-leak/creds.txt` |
| **绿用例（有效 Key）** | 临时 Key（已请老大关闭） | `verdict=OK assistant/message=1 finalResponse.len=11 turn/end.kind=completed` 耗时 **1.9s** |

判据另有 **8 条对表单测**（合成 fixture、无网络）：§6 四行形态 + `exit 0` 陷阱 + 非 completed 收尾（max-tokens/aborted/blocked/interrupted）全判红，锁死「哪些收尾算成功」。
R1 真跑还留了一条副证据：**失败跑也有完整事件流**（`turn/start`/`step/start`/`assistant/chunk`/`turn/end` 都在）→ 印证「有事件流」不能当判据。

### 🔴 请裁定 ①：判据口径矛盾（派发文字 vs 实测形态）

派发写「成功 ⇔ … **`turn/end.reason` 不存在**」，但**实测成功跑必带** `turn/end.data.reason = { kind: 'completed' }`（证据：2026-09-09 两次有效 Key 会话落盘事件 + 本轮绿用例运行 histogram 里 `turn/end:1` 且 kind=completed）。
照字面实现「reason 不存在才算成功」→ **有效 Key 也会被判红 = 假红**，护栏会逼人忽略红灯。
我实现为：**不存在 `kind==='error'` 的 reason，且正常完成必须带 `completed`**；非 completed 的异常收尾（`max-tokens`/`aborted`/`blocked`/`interrupted`）同样判红。
**我的倾向**：口径以实测为准，请 WB 复核后把 `docs/dsh/dsh-local-env.md` §6 那行措辞同步修正，避免下一个 AI 照字面写反。

### 🔴 请裁定 ②：残留扫描的压缩盲区（本轮新发现）

`scanForKeys` 只扫**明文**文件；而 session 日志是 `session.jsonl.zstd`（**多帧 zstd**）→ 结构上扫不进去，压缩是残留扫描的盲区。
本轮用一次性探针（跑完已删、未入库）解压核对：3 个文件、解压 **38190 字符**，**全文 0 命中、后 4 位 0 命中**（连脱敏形态都没有 → 环境变量注入不落 session 日志，与 §6「不落盘」结论一致，但**这是本轮新验的那一面**）。
**我的倾向**：把「解压后扫描」补进 real-api 自查（多帧魔数切帧，约 30 行）。属扩围，**请裁定是否本轮做**；不裁定我只记录，不擅自加。

### ⚠️ 两处与文档不一致（供 §6/预期更新）

1. **耗时**：§6 记「有效 Key 106.2s」，本轮绿用例 **1.9s**（同一进程内 SDK 调用、暖 profile、无 `--patch`）。差异应源于 WB 那轮为**冷启动**（含 pnpm heal/首次 boot）。→ 超时预算别一律按 106s 设；我取 `initializeTimeoutMs=120s / requestTimeoutMs=240s`（宽松侧，防冷跑误杀）。
2. **`deepseek-v4-flash` 固定 id**：老大今天提到 DeepSeek API 文档有变（其自身配置从 `deepseek-v4-flash[1m]` 改为 `deepseek-flash`）。我**未改任何实现里的 id**（不该我动），如实记：本项目脚本里的 `deepseek-v4-flash` 本轮**实测仍被接受并正常完成**。

### 与派发第 1 条环境前置的出入（请认账）

派发写「每次跑 dsh 前先 `rm -f ~/.dsh/profiles/node_modules.lock`」。我实现为**只清死 PID 的锁**：读 PID → `process.kill(pid, 0)` → ESRCH 才**重命名备份**（`node_modules.lock.bak.<ms>`，不删除）；活跃或内容不可解析 → **停手报错**。
理由：`rm -f` 会误删**活跃**锁，制造真实并发故障（§1 明说"孤儿回收是 operator 动作"）。测试语境下是否该一律强删，**请 WB 指出**，我按裁定改。本轮全局锁只有历史 `.bak` 遗留，未新增。

### 未做 / 边界

- 真实调用**不进默认套件**（默认跑永远 skip）→ 不烧 key、不依赖网络。
- **裸 `vitest run` 会看到 3 个 failed 文件**，都不是回归：2 个是 DSH-2.4 既有的设计性哨兵（`sentinel-failfast` / `sentinel-unset`，预期 FAIL），1 个是本轮 R1 哨兵在**未开开关**下的显式报错（提醒「必须带开关跑」）。本轮全套观察：`Test Files 3 failed | 4 passed`、`Tests 3 failed | 16 passed | 2 skipped`——默认入口应走 npm scripts，不是裸 vitest run。
- 临时 DSH_HOME 用 junction 复用 177MB sdk profile（实测 `rmSync(recursive)` 不穿透 junction，目标存活）；teardown 扫描**不跟随符号链接**，与 teardown 清理同源。
- 留痕检查：本轮结束后工作区 `grep` 无 key 片段、无 `larry-test-*` 临时目录残留、无探针文件残留。

### 📎 追加（2026-09-10 · 老大指示）：模型 id 统一改名 `deepseek-v4-flash` → `deepseek-flash`

**已改（3 处，均属"配置"）**：`harness/scripts/dsh-prompt.mjs`、`harness/scripts/dsh-probe-capability.mjs`（`model:`）、`harness/tests/real-api.ts`（`DEFAULT_MODEL`，可用 `DSH_REAL_API_MODEL` 覆盖做对照）。
（`backend/config.example.yaml` / `backend/config.yaml` 早已是 `deepseek-flash`；Python 侧无硬编码 id。）

**未动（记录类——改了就是篡改历史，它们的史实仍成立）**：`TODO.md:163`、`.workbuddy/memory/2026-09-10.md:99`、`docs/dsh/dsh-cloud-deployment.md:115`、以及本文件上方那条 —— 记的都是"当时在 session 文件/实测里看到的名字"。

**待裁定（说明类，在 `docs/` 非我提交范围）**：`docs/dsh/dsh-23-vue-tauri-connect-trae.md:154` 写「deepseek-official / v4-flash 等」，属"当前路由说明"→ 是否同步改名，请老大/WB 示下，我不擅动。

**改名后的源码级风险（已写进 `real-api.ts` 注释）**：DSH provider `dsh-v0.1.2-rc.1` 的静态 catalog（`DEFAULT_MODELS`）**仍只声明 v4 系列 id**；源码确认**未编目 id 不被拦**（catalog 查询是 advisory：价格/contextWindow/图片策略），会直传给 API。
→ **改名后必须用真实调用冒烟一次**（`npm run test:real-api`，绿 = API 接受新 id）；无 Key 时记 ⬛ 未测。**别把"改完没报错"当成"改名可用"**。

**冒烟结果（2026-09-10 · 老大新给临时 Key · 真实调用）** 🟢：

| 跑法 | 结果 | 结论 |
|---|---|---|
| 新默认 `deepseek-flash` | `verdict=OK assistant/message=1 finalResponse.len=11 turn/end.kind=completed` **2.5s** | **新 id 被 API 接受** |
| 反向对照：`DSH_REAL_API_MODEL=deepseek-not-a-real-model`（同一 Key） | `verdict=FAIL … error.code=INVALID_REQUEST error.status=400` **2s** | **模型名在服务端是被校验的** |

→ 有反向对照兜底，上一条的"绿"**不是**"API 根本不校验模型名"造成的假绿。**改名就此落定。**
→ 附带收获：这条对照补出 **§6 矩阵的第 5 行**——「未知模型 id → `INVALID_REQUEST`/400、无 `assistant/message`、仍是 `exit 0`」，@WorkBuddy 请一并收进 §6（判据层已能正确显形该 code）。
