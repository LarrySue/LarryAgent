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

## 排查记录 · 项目目录之外的测试文件夹归属（2026-09-11）

> **来源**：老大问「为 DSH 测试在项目目录外建的文件夹，哪些是 Trae 这边搞的」。
> **方法**：逐一 `Get-ChildItem` + 体积实测（**不是凭记忆**），时间戳一并记录。
> ⚠️ **本记录只做归属核实，不含任何清理动作**；清理取舍待老大/WB 定。**我未删除本表中任何一项。**

### 一、本机 · 确认是 Trae 建的（可在老大点头后清）

| 路径 | 用途 | 体积 | 我的建议 |
|---|---|---|---|
| `D:\Code\sandbox-probe\` | DSH-2.5 ③ 沙箱拒绝方言复验（两轮）。含 `ws/` `temp/` `outside/`（探针夹具，现为空）、`v3.json`、`forensics.json`、`mount-probe.json`、`dump-config.txt`、`boot-help.txt`、`dsh-home/`（本轮为绕开工具沙箱建的 **DSH_HOME 副本**：三个 profile 小文件 + `node_modules` 为 junction 指回真实安装点 + `storages/`） | **< 1 MB** | ⚠️ **先别清** —— 目录里有 WB 的文件（见二），且 WB 尚未复验 R3 |
| `D:\Code\embed-probe\` | DSH-2.5 ⑤ TS(ONNX) vs Python(PyTorch) bge 向量漂移比对（`python-embed.py` / `ts-embed.mjs` / `compare.mjs` / 两个 `*-vectors.json`） | **466 MB**（几乎全在 `node_modules`） | ⑤ 已结案、结论已进报告 → **可清**（两个 vectors JSON 若要留档可先拷走） |
| `~\.dsh\profiles\node_modules\@larryagent\plugin-sandbox-dialect\` | ③-修复插件的安装点（9/10 建） | 小 | 挂载层落盘前**保留**；若最终决定不挂载，可连它一起清 |
| `~\.dsh\profiles\node_modules\@larryagent\plugin-sandbox-mount-probe\` | R3 复验探针（9/11 建，**未挂载**，不写进 patch 层就不会被加载） | 小 | **可清**（复验完即弃） |
| `~\.dsh\profiles\node_modules.lock.bak.{1788929028320, 1788929218319, 1789023117, 1789024961}` | 孤儿锁**重命名**备份（按 `dsh-local-env.md` §1 的处置纪律；其中可能也有 dsh 自身产生的，**无法逐一归属**） | 小 | 可清 |
| ~~`D:\Code\probe-trae\`~~ | DSH-2.1 探针 —— **上轮已删**（约 257 MB） | 0 | — |

另：`~\.dsh\sessions\*`、`~\.dsh\storages\*` 是 **DSH 运行时自己写的数据目录**（由我 DSH-2.1/2.3/2.5 的实跑产生），不是我"建的文件夹"，一般不算测试残留，清理需单独判断。

### 二、**不是 Trae 的**，或归属待认领

| 路径 | 观察 | 判断 |
|---|---|---|
| `D:\Code\sandbox-probe\wb-env-probe.mjs`、`wb-env.json`、`wb-env3.json` | 9/11 11:30 前后写入 | **WB 的文件** → 所以 `sandbox-probe` 是**共享目录**，**清理前必须与 WB 对齐** |
| `D:\Code\t2probe\`（`proxy.py` `run.sh` `run2.sh` `proxy-*.log` `web.log` `jar.txt`） | 9/11 10:42–10:44 | 像 **T2 反向代理**方向的探针，**不是我**（我没做过 T2 相关）→ 疑 WB |
| `D:\Code\dsh-src\` | `deepseek-harness` 全量 clone（tag `0.1.2-rc.1`，工作树干净，已 install，有 host 构建产物 `tsconfig.host.tsbuildinfo`），9/9 9:48 检出 | **归属未定**：我 DSH-2.1/2.2 走的是仓库内 `ref/dsh-bare`（bare 库 + 工作树）这条路；但 `build:lib:host` 我确实跑过 → **不能排除是我的**。**在认领清楚前我不动它**（1.52 GB） |
| `~\.dsh\sessions\--D-Temp-dsh-fresh--` | 指向 `D:\Temp\dsh-fresh` | 不是我用的工作目录 → 疑他人 |
| `D:\Temp\Sys` | 终端系统 TEMP | 非 AI 新建 |

### 三、远程 CVM（`49.232.129.252`，不在本机，未 ssh 复核）

- **Trae 的**：`~/harness`（我上传并 `pnpm install` 的那份）、`~/larry-harness`（早期路径写错的一次，可删）、`~/larry-dsh-home`（约 206 MB）、`~/larry-data/larry.db`（① 的外接 SQLite 库）
- **WB 的**：`~/dshprobe`（约 303 MB）
- 需要时我可 ssh 上去核实再清。

### 四、清理前须知（四条）

1. `D:\Code\sandbox-probe\` **是共享目录**（含 WB 三个文件）→ 清理须先与 WB 对齐，我不会擅自动它。
2. `D:\Code\dsh-src\`（1.52 GB）**归属未定 → 我不动**，请老大/WB 认领后再处置。
3. 实测到 `ref/dsh-bare` 时间戳为 **2026-09-11 11:45**（即 WB 当时正在动仓库）→ 本记录期间 **Trae 未触碰 `ref/` 下任何内容**。
4. ⚠️ **自我报备（已修复，留痕以防再犯）**：本条记录第一次提交时，我基于**过期快照**编辑本文件，**覆盖掉了 WB 刚写入的「阶段状态」块（5 行）**。发现后已按 `db830d0` 的原文**逐字恢复**（现位于「排查记录」之上），并 amend 掉那次提交。教训同 `log-other.md` 那条：**编辑共享文档前必须重读最新全文，不能只看几分钟前的快照**。

---

