# DSH 迁移决策区（docs/dsh/）

- `dsh-migration.md` — **决策稿**（已定稿 + 第 0 项终裁 2026-09-08：Py SDK 判 **二等** → 定 **A-framework**，全面 TS 化）
- `dsh-pysdk-probe.md`（Trae）／`-claude.md`（Claude）／`-qoder.md`（Qoder）— 第 0 项三方实测报告

## 三条规则

1. **三份报告是证据，不是历史**：§3.5 的判定以它们为证据支点，且「跨进程 resume id collision」等待核项仍需回看原始输出。故与决策稿**同目录存放，不拆、不进 `archive/`**（`archive/README.md` 的落位判据是"是否仍被引用"，不是"是否闭环"）。
2. **永久保留**：老大 2026-09-08 定，不参与柔性清理，任何人不得删。
3. **结论以决策稿为准**：Trae / Claude 两份的「一等」为原始交付，已被 §3.5 覆盖；Qoder 的「二等」即最终口径。引用一律用 `dsh-migration.md` §3.5。

## 源码查阅

DSH 源码走项目根 `ref/dsh-bare`（只读裸仓库，锁定 `dsh-v0.1.2-rc.1`，`.gitignore` 排除、不入 git），规则见决策稿 §2.2。
