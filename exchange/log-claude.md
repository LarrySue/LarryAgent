# Claude 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）
---

## 状态：无在飞任务（2026-09-10 晚收口）

---

## 2026-09-11 仓库外测试目录排查（老大指派：确认哪些是我建的）

**范围**：`D:\Code\`、`D:\Temp\`、`D:\Temp\Sys\`、用户目录下与 DSH/测试相关的仓库外目录（本机时区 UTC+8）。
**方法**：目录内容/时间戳 × 我侧会话记录（工具调用 + UTC 时间戳）× `.workbuddy/memory/*.md` 交叉比对。

### 1. 我建的（可清理）
| 路径 | 建立时间 | 用途 |
|---|---|---|
| `D:\Temp\Sys\gitrm-probe`、`gitrm-probe2`、`gitrm-probe3` | 09-11 00:55-00:57 | 「git rm 删深层文件 → 父目录链消失」现象的**工作区外对照复现**（临时仓库）；结论已入档，物料可删 |

### 2. 我侧测试的自动残留（非手建目录，可清理）
| 路径 | 时间 | 说明 |
|---|---|---|
| `D:\Temp\Sys\larry-test-realapi-Zt4zqh`、`larry-test-realapi-tpkFrr` | 09-10 21:20-21:21 | harness real-api 运行的临时 DSH_HOME（`larry-test-*` 前缀 = 我方测试隔离目录），未走 teardown 的残壳。我当天 21:20 前后无工具活动记录，**最可能来自当晚 WB 复验那次**（「跑完不退出」被杀的运行恰好只留这种残壳），无法 100% 区分 |

### 3. 非我（有其他 AI 的证据）
- **WB 侧**：`D:\Code\t2probe`、`D:\Code\sandbox-probe`（`wb-env-probe.mjs`）、`D:\Temp\dsh-diag`、`D:\Temp\Sys\larry_root_data_backup_20260830_071346`、`C:\Users\SuLarry\wb-sbx-direct-outside`、`D:\Temp\Sys\dsh-acl-locks` 与 `dsh-spill-xCaSSP`（09-11 11:1x-11:2x，落在 WB 沙箱探针窗口，我该时段无活动）——前三项在 `.workbuddy/memory` 有明载
- **Trae 侧**：`D:\Code\embed-probe`（DSH-2.5 task 5 产物，WB 记忆 09-10 记「与 Trae 报告逐位一致」）、`D:\Code\dsh-src`（worktree → `ref/dsh-bare`，WB 记忆 09-09 载 worktree 用法）
- **DSH 运行时自动目录**：`D:\Temp\Sys\dsh-spill-{64rl2O,HP7evc,TQYXfu}`、`dsh-subprocess-{7krsGc,wMJ8G8,xc5LcY}`（09-08 21:21-21:23）——DSH spill/subprocess 后端在 OS temp 自动生成；与我当晚 pysdk 探针运行（`D:\Temp\dsh-probe\probe-claude`）时间窗完全重合，**疑似我探针运行的副产物**（也可能是同晚他人 DSH 运行，同机制不可区分）

### 4. 非我（我侧无任何创建/引用痕迹）
`D:\Temp\` 下 `check_dsh.py`、`probe-err.txt`、`probe-out.json`、`dsh-fresh\`、`dsh-lock-backup\`（均 09-09 上午，我当日该时段无活动）；`D:\Temp\Sys\` 下 `larry-baseline.txt`、`larry-harness.tgz`（09-10）

### 5. 已消失（无需处理）
`D:\Temp\dsh-probe\`（我 09-08 的 pysdk 探针目录，现不存在）；`D:\Temp\Sys\larry-sandbox-probe*`、`C:\Users\SuLarry\.larry-sandbox-probe-outside`（沙箱探针物料，现不存在，非我建）

**我名下待清理项合计 5 个**（gitrm-probe×3 + larry-test-realapi×2）。清理动作未做，等老大指令。

---
