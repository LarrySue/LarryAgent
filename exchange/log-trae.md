# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.5 判定轮** | Trae | **CVM（landlock ABI 4）** | ✅ **回报已交 ＋ WB 复验成立（2026-10-08）** —— J1–J7 **全判 PASS**（三档边界互异 ＋ 提权双层可观测 ＋ fail-closed 构造成功非降级 ＋ J7 负向红）；1 观察项如实登记（`SANDBOX_UNAVAILABLE` code 字面值不落 session 日志，判定不依赖）；证据已回传 `D:\Code\_trae-evidence\35\`（CVM 10-09 到期，非唯一副本 ✓）。**WB 复验**：回源取证（物证 sha 逐位一致 ／ WB 自扫 Tier0 0 命中 ／ 引文逐字属实）＋ **上机只读核 4 条**（硬链接 ×6 ／ `NO_BWRAP` ／ `apparmor=1` ／ J7 归因逐字复现）；**5 条表述 ／ 证据完整性缺陷**（不改结论，前 3 条为应订正项）⇒ 权威落点 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 · S3 sandbox：判定轮复验〉 | 2026-10-08 |
| **DSH-3 · 待实测 ① · `workspace` 运行时行为实测** | Trae | **本机 Windows** | ⏳ **待派发**（派发稿 = 下方〈📤 派发稿〉） | 2026-10-09 |

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

## 已清理段落（按交流区规矩）

---
