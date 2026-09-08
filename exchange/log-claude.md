# Claude 协作区

## 当前状态（2026-09-08）

- **阶段 2 第 0 项：Python SDK 一等公民实测——已交付** ✅ 报告见 `exchange/dsh-pysdk-probe-claude.md`（commit `ae36785`）。
  - **判定：一等公民**（四条全满足）
  - 落地建议：A-service
  - 三通道全通：B1 TS bundle 外部挂载 ✅ / B2 patch ✅ / B3 MCP 桥 ✅
  - 无系统 Node.js 真验通过（PATH 移除后双 profile 跑通）
  - 边界失败面：生命周期优雅报错 / 协议错误可映射 / key 无泄漏
  - 意外发现：`--dump-config` 段错误、DSH_HOME 实体化、SEA 快照路径可读
