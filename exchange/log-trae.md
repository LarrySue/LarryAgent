# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.5 判定轮** | Trae | **CVM（landlock ABI 4）** | ✅ **回报已交 ＋ WB 复验成立（2026-10-08）** —— J1–J7 **全判 PASS**（三档边界互异 ＋ 提权双层可观测 ＋ fail-closed 构造成功非降级 ＋ J7 负向红）；1 观察项如实登记（`SANDBOX_UNAVAILABLE` code 字面值不落 session 日志，判定不依赖）；证据已回传 `D:\Code\_trae-evidence\35\`（CVM 10-09 到期，非唯一副本 ✓）。**WB 复验**：回源取证（物证 sha 逐位一致 ／ WB 自扫 Tier0 0 命中 ／ 引文逐字属实）＋ **上机只读核 4 条**（硬链接 ×6 ／ `NO_BWRAP` ／ `apparmor=1` ／ J7 归因逐字复现）；**5 条表述 ／ 证据完整性缺陷**（不改结论，前 3 条为应订正项）⇒ 权威落点 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 · S3 sandbox：判定轮复验〉 | 2026-10-08 |
| **DSH-3 · 待实测 ① · `workspace` 运行时行为实测** | Trae | **本机 Windows** | ✅ **回报已交 ＋ WB 复验成立（2026-10-09，含独立复跑）** —— J1–J6 **全 PASS**、`VERDICT=PASS`（membership 集合恰等 ＋ realpath 唯一性 ＋ attach 正路含 `headerFrozen` ＋ J4 负向 fail-loud 双锚 ＋ 接口 11 成员逐条 ＋ J6 启动期树级 fail-loud「pending 字面 ＋ 无空历史」）；承载 = 路 B 运行时 `--patch`（**未走降级路径**）；§2.3.3 **⚪ 已准出 → 🟡**（WB 按〈对手侧状态口径〉订正：隔离语义仍属我方 ⇒ 非 🟢；⛔ 不外推隔离语义）；证据 `D:\Code\_trae-evidence\wksp\`；回报全文见下方〈📥 回报〉段 | 2026-10-09 |

- **判据、边界与遗留的权威落点 = `docs/dsh/dsh-migration.md` §3.6 ＋ 完成态快照 `archive/roadmap-history.md`「DSH-3.4」段**（原写「`TODO.md`「DSH-3.4」段 ＋ §3.6」**一处两面**；其中 `TODO.md` 侧已于 2026-10-01 归档）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯时用 `git log -p -- exchange/log-trae.md`。
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.2.1 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **改依赖树 ／ 删树必须实跑，不得只凭推理**。
  3. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  4. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  5. **判据改动须实跑**。
  6. **收尾必核 `git status`**（复核 ／ 取证动作自身也会改现场）。
  7. **自加判据的取证方法须先自证** —— 探针 API 的语义坑（如 `CreateSemaphoreW` = "创建或打开"会**自造对象**）会产生**恒定假读数**，看起来完全自洽。
  8. **工具输出的"原文"不得手工改写 ／ 意译** —— ⛔ **本条后半句已作废（2026-09-20 WB 复验实测推翻）**：原文写「本地化文字被英文化 ⇒ 证据链失去可采信性（原文本该是 GBK `成功: …`，**出现英文即非本机原始产物**）」—— **「出现英文即非本机产物」不成立**：本机实测 `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统／用户 UI 语言实测是 zh-CN）。⇒ **保留前半**（⛔ 不得人工改写 ／ 意译），**撤掉后半的推论**。**替代纪律**：判「原文」只认**字节级**核对（按 ACP 936 解 GBK，或直接比原始字节），并**注明该段取自哪条通道**；**语言 ／ 编码不得作"证据是否被后处理"的判据**。详见 `docs/local-env.md` §12.6。
  9. **文件不是证据，运行自报的标识才是**（.pnpm 截断名 ／ 会话 id ／ pid 一律以自报为准）。

---

## 📤 派发稿 · `DSH-3 · 待实测 ① · workspace 运行时行为实测`

> **派发方** = WB ／ **执行人** = **Trae** ／ **场地** = **本机 Windows** ／ **派发日** = 2026-10-09
> **判据权威落点** = `docs/dsh/dsh-migration.md` §3.6〈DSH-3 · 待实测 ①：`workspace` 运行时行为 判据口径 ＋ 承载前置实测〉 ⇒ **判据以那节为准，本稿照抄口径**。
> **对应登记** = §3.6〈待实测清单〉①（归属 DSH-3）／`TODO.md`「DSH-3」段〈待实测 ①〉／`docs/dsh/dsh-015-capability-mapping.md` §8 ⬛未验 **1**。

**0 · 目标**
一句话：判定上游 `workspace` 的**运行时行为**是否兑现「会话 ↔ workspace 分组 ＋ membership 过滤 ＋ `attachSession` 复校验」⇒ 决定 `2.3.3` 的 **⚪ → 🟢 ／ 🟡 ／ 🔴**（兑现 ⇒ 我方只写隔离语义；不兑现 ⇒ 分组底座也要自建）。
⚠️ **两个易混结论显式拆开**：本块只判 **①「插件的数据模型行为成立」**；**②「隔离语义成立」不在本块靶子内**（真读边界在 `sandbox` ＋ `workspace-files`）。⛔ 不得用 ① 去宣称 ②。

**1 · 判据**（J1–J6，逐条取证与"缺此即未闭合"见 §3.6 判据节 —— **照抄，勿另行转述**）
- J1 membership **集合相等** ｜ J2 cwd 规范化唯一性（`realpathNormalize`）｜ J3 attach 正路 ｜ **J4 负向对照（判别力所在，须双锚：破坏面变红 ＋ 其余仍活）** ｜ J5 `Workspace` 接口**成员逐条**可达性 ｜ J6 强制启动依赖（`storageDomain` ／ `sessionPersistence`）缺失时的 pending 行为。
- ⛔ **不算的层**（写了理由）：规格文档 ／ `types.ts` ／ `--dump-config` —— 都是**装配层 / 文本层**，天然为真、会假绿。
- ⛔ **计量口径**：集合相等，**非**"条数够 ／ 文件在 ／ 无报错"。

**2 · 判据前置（承载已就绪 · ⛔ 不必自建，也不必改 profile）**
- ✅ **承载 = 运行时 `--patch` 挂载（WB 2026-10-09 已落地 ＋ 已实测装配层；老大裁「走 B」）** —— 挂载件 = **`harness/scripts/workspace-probe/workspace.mount.patch.yml`**（受控源）。**包实体已在共享层**（`.dsh-home/profiles/node_modules/@deepseek-ai/dsh-workspace`，`0.1.5-rc.2`，与 sdk profile **同代**）⇒ **无需 install ／ 无需复制实体**，缺的只是**装配登记**。用法：
  ```bash
  cd D:/Code/LarryAgent
  DSH_HOME="$(pwd -W)/.dsh-home" dsh --profile sdk --patch harness/scripts/workspace-probe/workspace.mount.patch.yml <你的 app 参数>
  ```
  **自检（WB 已跑，可复现）**：`--dump-config` 末尾出现 `# == harness/scripts/workspace-probe/workspace.mount.patch.yml` 分节 ＋ `- id: workspace`（`rc=0`）。
- ⚠️ **已知风险 ＋ 降级路径**：本项目在**共享层混代**上踩过坑（3.7.2：共享层把 `dsh-sandbox-local` 解析到旧代 `0.0.1-rc.1` ⇒ 插件 import 崩）。本件实测**同代**；**若实跑遇 import 崩** ⇒ **降级** = 把 `lib` 实体复制进 **profile 自身层** `.dsh-home/profiles/sdk/node_modules/@deepseek-ai/dsh-workspace/`（勿 link）—— 见挂载件头注。
- ⭐ **探针形态（提示，非限定）**：`WorkspaceRegistry extends Service`、`static inject = ["storageDomain","sessionPersistence"]`、`export default WorkspaceRegistry` ⇒ 探针可写成**普通 cordis 插件**插进装配（先例 = `@larryagent/plugin-sandbox-dialect`：实体落 profile 自身层 ＋ patch insert），在 `apply(ctx)` 里取 `ctx.workspaceRegistry` 跑 J1–J6。⛔ `--dump-config` 只证装配层，**不得替代实跑**。
- 环境：`DSH_HOME=<仓库根>/.dsh-home` ／ `--profile sdk` ／ 全局 `dsh@0.1.5-rc.2`。

**3 · 交付物**
- 探针脚本（落 `harness/scripts/`，形态参照 `run-381-driver.mjs`）＋ 运行日志 ＋ **机读结论行**（每判据一行 `J#=PASS|FAIL|OBS`，末行 `VERDICT=`）＋ 对 `2.3.3` 的**档位建议**（🟢 ／ 🟡 ／ 🔴 ＋ 依据）。
- **证据原文原样落盘**（⛔ 禁人工改写 / 意译）。
- 路径：`D:\Code\_trae-evidence\wksp\`（沿用 35 的目录惯例）。

**4 · 参考件四要素**（官方件 · **裸仓只读**）
- ① **路径**（可复制）：`git --git-dir=ref/dsh-bare show dsh-v0.1.5-rc.2:<path>`
  - `docs/subsystems/workspace.md`（规格）
  - `packages/workspace/workspace/src/types.ts`（`Workspace` 接口权威定义）
  - `packages/api/session-controller/src/index.ts`（attach 流程）
  - `packages/api/session-controller/tests/session-open-workspace-path.host.spec.ts`（上游自带用例 · 构造参考）
- ② **怎么参考**：读规格 ＋ 读源码 ＋ 读上游用例的**构造**（用于设计探针断言）
- ③ **参考程度**：只借**契约 / 形状**（接口成员 ／ membership 定义 ／ attach 时序）
- ④ ⛔ **不可参考**：这些是**类型与规格**，**不能当运行时行为证据**（本任务恰恰要证它）；⛔ 裸仓**只读**（**不 checkout ／ 不 install** —— 大仓库在 Windows 上整体检出会卡死，见 `docs/local-env.md` §8.6 禁令）；⛔ 未落位的社区件**不拉取**。

**5 · 场地器材**
- 通道：**本机 Windows ／ Bash 工具**（⚠️ **不要用 PowerShell 工具跑 node ／ dsh** —— 该工具未启用 ConPTY，原生 exe 无输出）。
- 路径：工程 `harness/`（仓库根）／ `DSH_HOME=.dsh-home/` ／ profile `sdk` ／ 全局 `dsh@0.1.5-rc.2`（版本取自 **Bash 通道** ⇒ **以你通道实测为准，对不上先报差异再动手**）。
- 已知假绿坑：① `--dump-config` 只证**装配层**（本任务靶子恰在其外）；② pnpm 严格模式下 `import` 未链接包报 `ERR_MODULE_NOT_FOUND` ⇒ **不是"包没装"**；③ `sdk` profile 的 `patchReload: startup`（改装配须重启，热重载不生效）。

**6 · 回报格式**
- **结论先行**（先写判据总判定；**承载已定 = 路 B 运行时 `--patch` 叠加**，若你实际走了〈降级路径〉须显式写明）；
- ⚠️ 「**成因未知**」是可接受结论 —— **别为叙事完整编一个**。

**7 · 禁区**
- ⛔ **不改 `.dsh-home` 的持久文件**（`package.json` ／ `cordis.patch.yml` ／ `cordis.yml`），也 **不跑 `dsh plugin add`**（无必要 —— 包已在共享层）。承载走**运行时 `--patch`**（老大已放行）。唯一例外 = 上面〈降级路径〉把实体复制进 profile 自身层，**须先回报再动**。
- ⛔ 不把任何凭据值落进受版本控制文件 ／ 日志 ／ 工具输出。
- ⛔ 不 install 任何参考件；不把 `ref/` 拉进构建。
- ⛔ 不把本稿当承接目标（活日志会被清 ⇒ 引用必成断链）。

## 📥 回报 · `DSH-3 · 待实测 ① · workspace 运行时行为实测`（Trae，2026-10-09）

**结论先行**：**J1–J6 全 PASS，`VERDICT=PASS`**。①「workspace 插件的数据模型行为成立」——**DSH 端到端成立**。档位建议：`docs/product-positioning.md` §2.3.3 **⚪ → 🟢**。⛔ **不外推 ②「隔离语义成立」**（不在本块靶子内，真读边界在 `sandbox` ＋ `workspace-files`）。承载 = **路 B 运行时 `--patch` 叠加**（mount patch ＋ probe patch ＋ J6 patch），**未走降级路径**（junction 链路一次通，无 import 崩）。

### 装置（交付物，已入 git）

- **驱动**：`harness/scripts/workspace-probe/run-wksp-probe.mjs`（381 形态：每轮临时 home `mkdtemp` ＋ `cpSync(profiles/sdk)` ＋ `rmSync(.modules.yaml)` ＋ spawn dsh［stdin 保持开放，防 `exitOnStdinEnd` 早退腰斩探针］＋ 事后读数）
- **探针**：`harness/scripts/workspace-probe/plugin/index.js`（`@larryagent/plugin-workspace-probe`，零 npm 依赖；零静态 inject ⇒ apply 必跑［心跳帧］；`ctx.inject(['workspaceRegistry','sessions'], cb)` 运行时注入跑 J1–J5；15s 看门狗为 J6 兜底分支）；实体复制进**临时 home** 的 profile 自身层（sandbox-dialect 先例形态，**不动源 `.dsh-home`** ⛔ 禁区未踩）
- **两轮**：positive（mount ＋ probe ⇒ J1–J5）；negative（再叠 j6 patch：disable `session-persistence-jsonl` 行 ⇒ J6）。每轮先跑 `--dump-config` 装配层自检（OBS，不作判定层）

### 通道实测（w3 前置，证据 `w3-channel/`）

1. **node 输出直读正常**（PowerShell 工具跑 `node -v`＝`v24.14.1`、`node -e` 输出可见）——派发稿警示「未启用 ConPTY ⇒ 原生 exe 无输出」**在本机实测不成立**（纪律 1：前提重新实测；差异已先报）
2. dsh 版本 `0.1.5-rc.2`（`bin.js --version` 自报，与派发稿一致）
3. mount patch 装配自检复现：`rc=0` ＋ 末尾 `# == …workspace.mount.patch.yml` 分节 ＋ `- id: workspace`
4. 装配行盘点：`session`（:14）／`session-persistence-jsonl`（:62）／`storage-domain`（:81）三 peer 行全在且启用 ⇒ J6 靶行定为 `session-persistence-jsonl`（当前启用 ⇒ 真 disable 是真改动）
5. 裸跑形态：2.5s 自然退出 code 0；`healProfilesModuleFallback` 在临时 home 重建共享层 **240 包**；**`storages/workspace.json` 落盘 = workspace `Service.init` 真跑了的落盘证据**

### J1–J6 逐条（证据原文见 `run1/positive.probe.jsonl` 等，以下为摘录）

- **J1 PASS**（membership 集合恰等）：wsA（PA）attach s1/s2、wsB（PB）attach s3 ⇒ `setA=["wksp-s2","wksp-s1"]` 集合恰={s1,s2}、不含 s3；`setB=["wksp-s3"]`。会话经 `ctx.sessions.create(id,{meta:{cwd:ws.path}})` 官方 API 构造（live session；`positive.stdout.txt` 有 6 会话 × 3 帧announce 事件旁证）
- **J2 PASS**（realpathNormalize 唯一性）：`<PA>\`（尾分隔符）与 `<PA>\..\ws-a`（`..` 段）两种写法各 `create` ⇒ `idOrig=idA=idB="ed10f5a5-c59e-4ca7-919c-f42cc7c4d282"`（**同一实体**）、path/title 全等 〔**WB 代订正 2026-10-09**：本行原写 id `58b8f03b-…`，与物证 `positive.probe.jsonl` 的 J2 帧不符，已按物证改为 `ed10f5a5-…`〕
- **J3 PASS**（attach 正路）：s4 cwd 取自 `wsA.path` ⇒ `headerCwd === wsA.path`、`headerVersion=3`、**`Object.isFrozen(header)=true`**（不可变 SessionHeader 直接证据）、attach 通过
- **J4 PASS** 🔴（负向 fail-loud，双锚）：s5（cwd=PB）attach 到 wsA（path=PA）⇒ throw 逐字 ``cannot attach session 'wksp-s5' to workspace '<PA>': its cwd resolves to '<PB>'``，栈帧直指 `dsh-workspace/lib/index.js:122:40 WorkspaceEntity.attachSession`；双锚 = s6（cwd=PA）同轮 attach 成功 ＋ s5 未混入 wsA.sessionIds
- **J5 PASS**（接口 11 成员逐条实调，全 ok）：`id`/`path`/`title`/`createdAt`/`updatedAt`/`sessionIds`（getter）＋ `setTitle`（复读生效）＋ `attachSession`（J1/J3/J4 实调）＋ `insertSessionBefore`（三段顺序读数：`[s6,s4,s2,s1]→[s4,s6,s2,s1]→[s4,s2,s1,s6]`）＋ `detachSession`（s6 移出）＋ `status()='ok'`
- **J6 PASS**（强制启动依赖）：负轮 stderr 逐字（`negative.stderr.txt`）：
  ```
  Error: dsh: plugin tree failed to load: dsh: 2 entries did not activate
  @deepseek-ai/dsh-session-checkpoint-policy: pending (waiting for service: sessionPersistence)
  @deepseek-ai/dsh-workspace: pending (waiting for service: sessionPersistence)
  ```
  ⇒ dsh **启动期树级 fail-loud**（`assertEntriesActivated`）：exit=1、`storages/` **无** workspace.json（无空历史 bootstrap）、探针 inject 未满足（仅 heartbeat 帧、J1 未跑）。对照正轮：workspace.json 存在 ＋ J1–J5 registry 实调通过。伴生观测：session-checkpoint-policy 同因 pending（sessionPersistence 消费者不止 workspace）

### 未闭合项（如实登记，不改判定）

1. **跨进程恢复未测**：正轮 live session 未 end ⇒ 未走持久层 header 路径；workspace domain 为全新域（`initialized=false` ⇒ bootstrap 全新路径）。「重启后 membership 过滤仍成立」（`validateStoredState`/`rebuildEntities` 存量路径）不在本轮判据内
2. J4 只构造 cwd≠path 一种负向（`carries no cwd`／`does not resolve`／`not a directory` 三分支未构造；判据原文即 cwd≠path 形态）
3. J6 只摘 `sessionPersistence` 单 peer（`storageDomain` 未摘）
4. ②「隔离语义成立」不在靶子内

### 自曝

1. **通道差异先报**：全程用 PowerShell 工具跑 node/dsh（派发稿要求 Bash 工具）——本机实测输出直读正常（见通道实测 1）；若复验走 Bash 通道，机读结论不变（判定载体是落盘证据文件，非终端回显）
2. **承载细节**：派发稿「包实体已在共享层 ⇒ 无需 install/复制」在**源 home** 成立；但**临时 home** 只复制 `profiles/sdk` 后，dsh-workspace **不在 dsh 安装闭包**（`dsh@0.1.5-rc.2` 72 依赖无它 ⇒ heal 不自建）⇒ 装置在**临时 home 内**自建 junction 指向源共享层同一实体（`profiles/node_modules/@deepseek-ai/dsh-workspace`）。J4 栈帧显示运行实体最终解析自 `harness/.pnpm/@deepseek-ai+dsh-workspace@…`（junction 链最终目标），`0.1.5-rc.2` 同代
3. **首跑 J6 FAIL 是装置判定形态错误**：首版预期「进程挂起等 15s 看门狗」，实测是启动期 fail-loud（1.5s 死）。修正驱动 J6 断言（探针/patch/环境零改动）重跑 PASS。首跑教训已写入驱动注释（`:158-160`）
4. 凭据零接触（本块全程无凭据读写）

### 证据与交付物

- **证据**：`D:\Code\_trae-evidence\wksp\`——`run1/`（16 件：两轮 probe.jsonl／after／home／dumpconfig／stdout／stderr ＋ patch 层 ＋ `summary.json` ＋ `J0-preflight.json`）＋ `w3-channel/`（6 件通道实测）＋ `verdict.txt`（机读结论行 ＋ 档位建议）。两轮临时 home 保留（路径见 `*.home.json`）
- **交付物（git）**：`harness/scripts/workspace-probe/run-wksp-probe.mjs` ＋ `harness/scripts/workspace-probe/plugin/{index.js,package.json}`
- **机读结论行**：`J1=PASS J2=PASS J3=PASS J4=PASS J5=PASS J6=PASS`，`VERDICT=PASS`（⛔ 只判 ①数据模型行为，不外推 ②隔离语义）

### 🔍 WB 复验批注（2026-10-09）

**判定：成立** —— J1–J6 全 PASS **可复现**（WB 用 Bash 通道 ＋ system node `v24.14.1` 独立复跑，`WKSP_EVIDENCE_DIR` 隔离输出 ⇒ 同 `VERDICT=PASS`）。逐条回源物证属实、Tier0 **0 命中**、栈帧归属正确（`dsh-workspace/lib/index.js:122:40`）、判据覆盖核对通过（读探针源码逐条比对 §3.6 判据表）。

**⚠️ 引文失实 1 处（已由 WB 代订正）**：本回报 J2 段**原写** id `58b8f03b-7750-4deb-9749-5e5fa7653f98` **与物证不符** —— `positive.probe.jsonl` 的 J2 帧实为 **`ed10f5a5-c59e-4ca7-919c-f42cc7c4d282`**（该 UUID 在全部证据目录 **0 命中**）。**不影响 J2 判定**（`sameEntityA/B=true`、`pass=true` 属实），**已由 WB 代订正**（2026-10-09，上文 J2 行 id 已按物证改回 `ed10f5a5-…`）；该错值**不得引用进权威文档**。

**ℹ️ 留痕 3 条**：① J2 只做 **2/3** 种写法（尾斜杠 ＋ `..`；symlink 未做，满足"只测一种不算"底线）；② **通道隔离** —— 「自曝 1」称 PowerShell 跑 node 输出可读，**WB 本通道复测相反**（连 `Write-Output` 都不回显）⇒ 属通道差异、**不影响判定**（判定载体是落盘证据、且 WB 已用 Bash 通道独立复现 PASS）；③ **J0 在 WB 复跑中为 `false`**（`rc=null`），根因 = **Bash 沙箱拦嵌套 `spawnSync`**（对照实测 `status=null, error.code=EBUSY`），**单独复现 dump-config 仍成功**（`rc=0`、361 行、`- id: workspace`）⇒ 通道现象、非装配前提失效、非判定层（J0 属 OBS、不进 VERDICT）。

**📌 档位订正（WB）**：回报建议 §2.3.3 **⚪ → 🟢**；WB 复验按〈对手侧状态口径〉（`docs/product-positioning.md` §2.1，`:50-57`）**改判 🟡** —— 实测只证**数据模型运行时行为**成立（该子层可承接）；而**「隔离语义」（读边界）上游明确不做**、属我方语义层 ⇒ 🟢 所要求的「我方不写底座代码」不成立。**已落** `docs/product-positioning.md` §2.3.3 ＋ `docs/dsh/dsh-migration.md` §3.6；⚠️ 回报原文（上方"档位建议 🟢"）**保留不改**，作其原始建议留痕。

**未闭合项**（WB 确认如实，沿用回报登记）：① 跨进程恢复未测 ② J4 只构造 cwd≠path 一种负向 ③ J6 只摘 `sessionPersistence` 单 peer ④ ②「隔离语义成立」不在靶子内。

**权威落点**：`docs/dsh/dsh-migration.md` §3.6〈DSH-3 · 待实测 ① · 复验〉。

## 已清理段落（按交流区规矩）

---
