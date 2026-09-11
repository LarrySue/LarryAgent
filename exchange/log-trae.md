# Trae 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）
---

## 📌 当前派发（2026-09-10 · config.example.yaml 与正式版结构同步）— **暂停，未开工**

> ⏸️ **老大指示：此条暂不开工，除非老大明确指示**
> 规格见 `git log -p exchange/log-trae.md`（2026-09-10 提交）或下方摘要。

**摘要**（细节以旧提交为准）：`backend/config.example.yaml` 与正式版结构漂移较大 —— example 缺 `search` 整段 + `tools.enabled_tools`，两处注释过期（`database.path` 口径 / `vector_store.enabled` 的 P1.4），段序不一致。

- **Step 1（先定设计题）**：`models.<name>.model` 字段**全项目无消费点**（`config.py:139-142` 的 `ModelConfig` 只收 `api_key`/`base_url`；实际模型名走 `llm.py:56` 的 `_MODEL_PROVIDER_MAP` + 请求体）。**WB 倾向删**，不接线。**若结论是"该接线" → 停下回报**（属架构变更）。
- **Step 2**：补 `search` 段 + `enabled_tools`、订正两处注释、统一段序。⚠️ `roles` 人格差异属**预期差异，不要同步**（example 不该带个人角色设定）。
- **Step 3（验收）**：`cp` 到临时目录 + `LARRY_CONFIG` 指向后**真启动一次**。
- **边界**：只改 example；正式版 `config.yaml` 含真 key，**不入库不动**。

---

## 📌 二轮收尾（2026-09-10 · DSH-2.5 ③-修复）— **待接（唯一真实在飞项）**

**先说结论**：**修复本身是对的、有效的，不用重做**（② 层 EPERM 修复已由 WB 独立复跑 `cordis-confine-check.mjs` 逐字确认）。**待办的是三件收尾**：

### R1 —— 报告数据更正（必做，defect）

WB 复跑 `sandbox-denial-probe.mjs`，输出与你报告 §3.2 表格不一致：

| 子进程 | 你报告写的 | WB 复跑的实际 |
|---|---|---|
| node | 官方 false / 补丁 **true** | false / **true** ✅ |
| **cmd** | 官方 **true** / 补丁 true | 官方 **false** / 补丁 **false**，stderr 是**乱码中文** |
| **powershell** | 官方 **true** / 补丁 true | 官方 **false** / 补丁 **false**，stderr 是**乱码中文** |

你写的 `Access is denied.` / `Set-Content : Access to the path '…' is denied.` 与**上游源码注释**（`sandbox-local/src/index.ts:22-23`）逐字相同，而实测是中文 → **疑似把注释文案当成了实测输出**。请按实测更正 + 说明成因。

### R2 —— 探针缺 preamble，① 层判定是**假阴性**（必做）

`pwsh-sandbox` 复用 `PwshLocalExecutor`，后者给每条命令前置 `ENCODING_PREAMBLE`（`[Console]::OutputEncoding = UTF8; …`）；收集器按 UTF-8 解码。**你的探针用裸 spawn、无 preamble** → PS 按 OEM/GBK 输出 → utf8 解码成乱码 → 中文签名匹配不上。**真实链路不是这样跑的。**

WB 实测（同一命令仅变 preamble）：裸 spawn → 官方 false / 补丁 **false**；带 preamble（真实链路）→ 官方 false / 补丁 **true** ✅。

→ **你低估了自己的修复**：① 层在真实链路下**是有效的**。请给探针补 preamble 后重跑、更新结论。
> 判据纪律实例：**探针姿势与真实运行时不符会制造假阴性**。已入档 `dsh-local-env.md` §4.1。

### R3 —— 生产挂载未生效（需给结论）⚠️ **本节是唯一未闭合项**

插件已复制进 `~/.dsh/profiles/node_modules/@larryagent/plugin-sandbox-dialect/`，但 **`larry` / `sdk` 的 `cordis.patch.yml` 都是 `[]`** → **当前生产路径下修复不生效**。

**WB 已实测两种挂载写法**：

| 写法 | 实测结果 |
|---|---|
| **A**（你插件源码注释的说法：`- id: sandbox` + `name:` 覆盖） | ❌ **name 覆盖不生效**（sandbox 行仍是官方包） |
| **B**（你 Step 2 的写法：`disabled: true` + `insert` 新 id） | ✅ 配置层成立，**但新行插在最末尾**，且 id 为 `sandbox-dialect` ≠ 消费方期望的 `sandbox` |

**要你定案两点**：
1. **插件源码注释那句 "Mounted by pointing the profile's `sandbox` row at this plugin" 字面实现不了** → 注释须改成 B 写法，否则后人照注释挂都挂不上。
2. **B 写法的 id 与插入位置能否被消费方正确拿到，从未实跑验证**（配置层成立 ≠ 服务被正确提供）。

→ **R3 的最终结论必须是实跑端到端**：或由模型实际触发一次被拒命令、观察到 `[sandbox: file access denied]` 标记；或至少在 profile 内 boot 时确认插件被实例化、`provide` 被消费方拿到。

### 附带（次要）

- **C1 哨兵是纸面**：直接构造 stderr 字符串调 `matchesSignature`，非真实 spawn → 改为真实触发（runner `--` 传不存在的 exe），或标注【纸面】。
- **cmd 中文文案**：WB 复跑 cmd 那条也拿到中文（`拒绝访问。`），官方签名同样不命中 → 别当"英文已覆盖"。

### 已确认成立、不用再动

- **Step 1 结论属实**：provider Config 只有 `runnerCommand`/`runnerFailureSignatures`/`probeTimeoutMs`（无 denial 注入点）；`enforcement==='partial'` 闸有效且选得对。
- **② 层（EPERM）修复成立** —— 本次的实质价值。
- **反向哨兵方向正确**：没退化成"非零退出即 denied"，fail-closed 区分能力保住。
- **未动第三方源码** —— 符合 §3.0。

---

## Trae 报告 · DSH-2.5 二轮收尾 R1/R2/R3（2026-09-11）

> 分层：🟢 实测 / 🔴 推断 / ⬛ 未测。**结论先行**：R2 **完全成立、且我已复现 —— 我上轮确实低估了自己的修复**；R1 是**结论作用域写错**（数字可复现、非抄注释），表格不能写"本机"；R3 挂载写法定案为 **disable + insert**，并在**真实 profile 内 boot 取得证据**。

### R1 —— 数据更正与成因（不是抄注释，是"作用域"写错了）

**更正**：旧 §3.2 表头写「本机（zh-CN）」，实际是**我这棵进程树（console CP 65001 / UI 文化 en-US）**。三种区制的实测并列如下：

| 区制 | cmd 实际输出 | powershell 实际输出 | 官方签名 |
|---|---|---|---|
| **我的进程树**（Trae 终端：CP 65001 / UI en-US） | `Access is denied.` | `Set-Content : Access to the path '…' is denied.` | ✅ 命中 |
| **模拟 WB 区制**（CP 936） | `拒绝访问。`（GBK 字节） | `对路径…的访问被拒绝。`（GBK 字节） | ❌ 不命中 |
| WB 侧（其进程树 UI=zh-CN） | `拒绝访问。` | `对路径"…"的访问被拒绝。` | ❌ 不命中 |

**成因（🟢 字节级取证）**，探针 `harness/scripts/sandbox-probe/denial-dialect-forensics.mjs`，**以原始 Buffer 收 stderr**（不做 utf8 解码，避免解码姿势再污染结论）：

1. **语言由进程树 UI 文化决定**，不是我抄注释：cmd 的 stderr hex = `41 63 63 65 73 73 20 69 73 20 64 65 6e 69 65 64 2e`（= ASCII `Access is denied.`，19 字节）。环境自述：`[Console]::OutputEncoding=utf-8`、**`Get-UICulture=en-US`**、`Get-Culture=zh-CN`、`Get-WinSystemLocale=zh-CN`。→ 系统 locale 是 zh-CN 但**用户 UI 语言是 en-US**，故系统 MUI 资源回英文。与上游注释逐字相同是**巧合**（上游注释写于英文 Windows），hex 可独立验证。
2. **不是受限令牌造成的语言切换**：`direct`（无沙箱）与 `confined`（经 runner）的 cmd stderr **逐字节相同**（各 19 字节）→ 沙箱不改变文案语言。
3. 🔴 **未定性**：同一用户同一台机上，我的树是 en-US、WB 的树是 zh-CN，**差异成因我未能定位**（我这边是 Trae 终端进程树）。故我**不否定** WB 的中文观测，也**不据为己见**，按"路径相关、未在同一棵树上双向复现"记录。

**更正后的判据**：旧 §3.2 的"① 层未复现中文"应读作**"在我的进程树里未触发"**，而非"本机不存在"。① 是否在生产触发，取决于**运行 DSH 的终端/进程树的 UI 语言**——见文末「待裁决 2」。

### R2 —— 探针补真实链路后，① 层**不是**假阴性（WB 判断正确）

**源码确认**：真实链路是 `SandboxPwshExecutor.confine()` → `PwshLocalExecutor.argv()`，后者给**每条命令前置** `ENCODING_PREAMBLE`（`dsh-pwsh-local/lib/index.js:158, 271-280`，`PwshLocalExecutor` 同时是 `SandboxPwshExecutor` 的父类）。v2 探针用**裸 spawn**，缺这层 → 姿势与真实运行时不符。

**机制（🟢 复现 WB 区制）**：开关是**继承到的 console output 码页**。同一句中文，只变"有无前导"：

| 组 | stderr hex（前 11 字节） | 按 UTF-8 解码 | 补丁签名 |
|---|---|---|---|
| `bare`（继承 936，无前导） | `b6 d4 c2 b7 be b6 20 58 20 b5 c4` = **GBK** | 乱码（`��·�� X �ķ��…`） | **false**（0 命中） |
| `realchain`（936 后由前导覆盖为 UTF-8） | `e5 af b9 e8 b7 af e5 be 84 20 58` = **UTF-8** | `对路径 X 的访问被拒绝。` | **true**（命中 `访问被拒绝`） |

→ **① 层在真实链路下有效**，我上一轮把它写成"未复现"是**探针姿势制造的假阴性**（正是 `dsh-local-env.md` §4.1 那条判据纪律的又一实例）。

**为什么我上一轮两态看不出差别**：本树 console CP **已是 65001**（`cmd /c chcp` → `Active code page: 65001`），前导**成为 no-op**；那只证明"本树两态等价"，**不能**推出"前导无用"。探针 v3 已把前导纳入（**直接 `import` 官方 `ENCODING_PREAMBLE`**，不手抄）。

### R3 —— 挂载定案 + profile 内实跑证据

**定案 1（写法 A 不成立，注释已改）**：`- id: sandbox` + `name:` 覆盖**只会覆盖该行的 config，不会改该行加载哪个包**（WB 实测与我源码判读一致）。⇒ 只能用 **`disabled: true` + `insert`**。插件 docblock 里 "Mounted by pointing the profile's `sandbox` row at this plugin" 已删除并替换为正确的两段式写法。

**定案 2（行 id 不必叫 `sandbox`）**：消费方按**服务名**注入，不按 loader 行 id —— `dsh-pwsh-sandbox` 的 `SandboxPwshExecutor` 声明 `static inject = ['subprocess','sandbox','sandboxPolicy']`。**已在真实 profile 内 boot 实测**（探针 `plugin-sandbox-mount-probe`，输出 `D:\Code\sandbox-probe\mount-probe.json`）：

```
providerCtor: "SandboxDialectProvider"      ← 我们的子类在 provide ctx.sandbox（不是官方类）
shellCtor:    "SandboxPwshExecutor"         ← 消费方在场
providerConfine.denialSignatures: [access is denied, access to the path, permission denied,
                                   operation not permitted, 拒绝访问, 访问被拒绝]   (enforcement=partial)
shellConfine.denialSignatures:    同上       ← 消费方自己的接缝拿到的就是加宽后的签名单
shellConfine.argv: [...dsh-sandbox-windows-acl/lib/runner.js --workspace … --mode workspace-write --
                    C:\…\powershell.exe -NoLogo -NoProfile -NonInteractive -Command
                    "<ENCODING_PREAMBLE> Set-Content -LiteralPath '…' -Value hi"]
```

→ 两点同时被证：**"插件被实例化且 provide 被消费方拿到"**；且消费方 argv 里**确实带前导**（顺带从生产链路侧实证 R2）。

**复跑姿势与两处偏差（如实标）**：

- 本机 Trae 工具沙箱**拒绝写 `~/.dsh/profiles/sdk/cordis.yml`**（`EPERM`）→ `dsh` 无法在原地 `prepareProfile`。改用**等价复制**复跑：`DSH_HOME=D:\Code\sandbox-probe\dsh-home`（三个 profile 小文件复制 + `profiles\node_modules` 用 junction 指回真实安装点），挂载层写在**复制体的 `cordis.patch.yml`**（与生产落盘同一 YAML 形态），再 `dsh --profile sdk --help` boot。⚠️ **`--dump-config` 不激活插件**（只组配置树）——已实测排除，别用它验挂载。
- ⬛ **boot 内的受限 spawn 被本工具沙箱拦截**（`TRAE Sandbox Error: process launch failed … code 2147483653`）→ 那一格 `denied=false`（stderr 为空）其实是**"启动失败 ≠ 拒绝"的正确 fail-closed 行为**，不是拒绝判定失败。为补上这一格，用**产物重放**（`mount-artifact-replay.mjs`）：把 profile 内产出的 argv 与签名单拿到 boot 之外 spawn → `exit 1 / fileLeaked false / keyStderrLine "Set-Content : Access to the path … is denied." / denied_inProfileSignatures **true**`。⚠️ 明确标注：**argv 与签名单是 profile 内真实产物，只有最后那次 spawn 发生在 boot 之外**。

**生产落盘：未做，且不做** ⬛ —— 写真实 `~/.dsh/profiles/sdk/cordis.patch.yml` 同样被本工具沙箱挡，且挡着就意味着**我无法在真实 home 里就地复跑验证**。**我不交付一个自己无法就地验证的改动**。交付现成 YAML 与应用命令（见下），请老大或 WB 落盘：
```
# 把 harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml 的内容
# 追加进 $DSH_HOME/profiles/<p>/cordis.patch.yml，然后
dsh --profile sdk --dump-config   # 组配置自检：sandbox 行应消失、出现 sandbox-dialect
```

### 附带项

- **C1 哨兵：已由纸面改为真实 spawn** 🟢 —— `--` 后传不存在的 exe → runner 真报 `windows-acl-run: CreateProcessAsUserW failed (Win32 2)`、**exit 127**；用官方 `classifyRunnerFailure` 口径复核**命中 runnerFailure**，官方/补丁签名**皆 false** → 未退化成"任何非零退出即 denied"。
- **cmd 中文文案**：不再按"英文已覆盖"处理。`拒绝访问` 保留在补丁内，并在**模拟 936 区制**下实测可命中（见 R2 表）。
- **C2 正向对照**改走真实链路、并**写到 stderr**（v2 里写的是 stdout，哨兵自身姿势有问题，顺手修）→ 仍判 `denied=true`。
- **顺带发现**（可作 ② 层注脚）：**本机 Trae 工具沙箱自己报的就是 `EPERM: operation not permitted`** —— 与我们修的这类缺口同源，说明"EPERM 文案缺失"在现实里确实会绊到工具链。

### 交付物

- 插件：`harness/packages/plugin-sandbox-dialect/`（docblock 已更正为 B 写法）、`harness/packages/plugin-sandbox-mount-probe/`（复验探针，非修复件）
- 挂载层：`harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml`（生产）、`sandbox-dialect.verify.patch.yml`（复验，含探针行）
- 探针：`sandbox-denial-probe.mjs`（v3：裸/真实链路双跑 + 真实 C1 + C2/C3）、`denial-dialect-forensics.mjs`（R1 字节取证 + 936 模拟）、`mount-artifact-replay.mjs`、`cordis-confine-check.mjs`
- 复验 fixture（**仓库外，可删**）：`D:\Code\sandbox-probe\dsh-home\`（DSH_HOME 副本 + junction）、`D:\Code\sandbox-probe\*.json`
- **未动**：第三方包源码、**真实 `~/.dsh` 的 profile 配置（`cordis.patch.yml` / `cordis.yml`）零改动**（仅在 `profiles/node_modules/@larryagent/` 下多了两个未挂载的包目录 —— `plugin-sandbox-dialect` 沿用上轮，`plugin-sandbox-mount-probe` 是本次复验探针；**不写进 patch 层就不会被加载**）、`client/`、`docs/ archive/ .workbuddy/`

### 待裁决（两条）

1. **是否落盘挂载层**到 `~/.dsh/profiles/{sdk,larry}/cordis.patch.yml`（我这边被工具沙箱挡，需你或 WB 执行）。
2. **R1 的 UI 文化差异是否有意为之**：我的树 `Get-UICulture=en-US` 而 WB 侧出中文。若你日常跑 DSH 的终端是 zh-CN，则**① 层在生产上确实会触发**，补丁里的中文串不是冗余；若你的 Windows 显示语言就是 en-US，则 ① 在生产不触发、② 仍是唯一实质价值。

---

### 状态：其余已闭环（过程记录已清理）

---
