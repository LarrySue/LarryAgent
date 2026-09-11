# Claude 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）
---

## 状态：无在飞任务（2026-09-10 晚收口）

---

## 2026-09-11 仓库外测试目录 · 清理成效评估（老大指派 · 仅评估未操作）

> 前置：归属排查见本文件提交 `8406d2d`（已按惯例清理，需要时 `git log -p` 追溯）。本次为老大「初步处理」后的**核销评估**，只读检查、未做任何操作。

**结论：成效良好、无不可逆删除。** 清理方式为「暂存到 `D:\_larryagent_cleanup_20260911\` 再整夹删除」（部分原位删除），全部经回收站——抽查确认逐项可还原：gitrm 151 条 / realapi 501 条 / sandbox-probe 29 条 / t2probe 9 条 / dsh-diag 23 条 / root_data 4 条。

### 已清（核销通过）

- **我名下 5 项**：`D:\Temp\Sys\gitrm-probe{,2,3}`、`larry-test-realapi-{Zt4zqh,tpkFrr}` → 5/5 ✅
- **WB 侧**：`t2probe`、`dsh-diag`、`dsh-fresh`、`dsh-lock-backup`、`check_dsh.py`、`probe-err.txt`、`probe-out.json`、`wb-sbx-direct-outside`
- **Trae 侧**：`sandbox-probe`（含 WB 3 文件；R1/R2/R3 复验与收口已于 11:39 完成，删除时机 OK）、`embed-probe` 的 466 MB 主体
- **未认领项一并清**：`larry-baseline.txt`、`larry-harness.tgz`、`larry_root_data_backup_20260830_071346`、DSH 运行时目录（`dsh-spill-*` / `dsh-subprocess-*` / `dsh-acl-locks`）

### 正确保留

- `D:\Code\dsh-src`（1.52 GB，归属未定）——工作树注册与目录一致、无 stale。**将来若删**：必须走 `git -C ref/dsh-bare worktree remove --force D:/Code/dsh-src`（`docs/dsh/dsh-local-env.md:353` 已写明），不可直接 rm -rf
- `D:\Code\embed-probe`——只剩 `{python,ts}-vectors.json`（按 Trae 建议留档）。⚠️ 脚本（compare.mjs 等）已清 → **复现链断**，将来复核只能依据 WB 当时的独立复算
- `~\.dsh\`——Trae 插件安装点 + DSH 运行数据（细项见 `log-trae.md`）

### 漏网小件（不紧急）

- `D:\Temp\Sys\t2probe\`（只剩 `web.log` 82 B，可连夹删）
- `D:\Temp\Sys\` 下 `probe.log`/`probe2-6.log`/`probe-tty.log`/`probe.err`/`probe.out`/`wb-probe*.log`（09-10，共 ~20 KB）
- `D:\Temp\Sys\pytest-of-SuLarry\`（pytest 自管 tmp 基座，可随手删、会自动重建）
- `~\larry_workspace`（08-11 遗留）、`D:\Temp\wb_verify_0830.txt`、`D:\Temp\Sys\LARRY-BOOK-H14A-*.log`——非本轮测试物料，未动合理

### 备注（两条）

1. `larry_root_data_backup_20260830_071346`（8/30 `rm -rf data` 前的项目数据备份）已清但**在回收站**，仓库内 `data/` 现不存在——若那 6 个文件仍有价值可还原。
2. **订正上一版排查**：把 `D:\Code\sandbox-probe` 记在「WB 侧」有误——按 Trae 第一手清单（`log-trae.md:30`），该目录是 **Trae** 为 DSH-2.5 ③ 所建，WB 仅在其中放了 3 个文件（实为共享目录）。

---
