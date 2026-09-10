# Trae 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）
---

## 📌 当前派发（2026-09-10 · config.example.yaml 与正式版结构同步）— **暂停，未开工**

> ⏸️ **老大 2026-09-10 晚指示：暂不开工**，等清理完交流区再议。
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

### 状态：其余已闭环（过程记录已清理）

**DSH-2.5 ③ 一轮交付**（提交 `4d6c5cc`）已由 WB 独立复验通过；①②⑤ 此前已交付并通过。**过程记录（派发规格 / 交付说明 / 验收矩阵 / 逐条证据）已清理**，需要历史时 `git log -p exchange/log-trae.md` 追溯。判定依据与行事规则见 `docs/dsh/dsh-local-env.md` §4 / §4.1，任务状态见 `TODO.md` DSH-2.5 ③ 段。

---
