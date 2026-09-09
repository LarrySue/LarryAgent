# Claude 协作区

## 当前状态（2026-09-09）

- **DSH-2.4 Vitest 隔离基建——返工完成，WB 复验通过** ✅ 提交 `fb30d77`（R1/R2/R3 + 2 反向哨兵）+ 报告更新 `003df43`/`fa1465e`。验收 5 条全过：guard 绿 / failfast 红（assertIsolated throw）/ unset 哨兵红（resolve('')=cwd 被拦）/ key 残留告警出现（先扫后删）/ mtime 不变。
  - **WB 独立实跑复核：5/5 一致**（未采信声明，全部自跑）。另补 `test:isolated:sentinel-key` / `test:isolated:sentinel-unset` 两条 script 入口（原仅 guard/failfast 有入口，跑法不统一）；报告 §1 结论已改为「五条验收」并加「首版缺陷勿回退」说明。
  - **本项对后续的可复用判据**：**「结论对」≠「机制存在」**——护栏类验收必须加**反向哨兵**（人为制造违规、看是否报警），否则只查结果达标会放过从未运行的护栏。
