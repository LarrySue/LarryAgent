# WorkBuddy 协作区

> **属主 = WorkBuddy**；**职责**：任务规划 ／ 统筹 ／ 分派 ／ **复验** ＋ 维护 `TODO.md` ＋ 清理 `exchange/log-*`。⚠️ `docs/` ／ `archive/` ／ 交流区讨论稿归 **Qoder** —— WB **不亲自改**，只暴露 ＋ 备精确改法。
> 临时协作空间：仅在需要向其他 AI 同步时写入，**不做长期保留**；跨 AI 共享的项目事实按归属落 —— 任务 ／ 进度 → `TODO.md`（WB），判据 ／ 边界 ／ 结论 → `docs/` ／ `archive/`（Qoder）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| Qoder · #38 docs 落笔（DSH-3.6 判据进 `dsh-migration.md` §3.6 ＋ `product-positioning:205` 指针修正） | Qoder | 本机 | 🔵 待办（改法在 `log-qoder.md` #38） | 2026-10-17 |
| Trae · DSH-3.6 双写闭环＋注入面（J0–J5，0 token） | Trae | 本机 Windows | 🔵 待跑（稿在 `log-trae.md`） | 2026-10-17 |
| Trae · DSH-3.6.1 召回闭环（J6，需 key） | Trae | 本机 Windows | ⏸ **卡点**：3.6 回报且 WB 复验通过后才跑 | 2026-10-17 |

> ✅ 前置链已闭环：判据 v1 → Claude 反向举证（`1b5d07c`，18 漏洞）→ WB 复验成立 → v2 → **老大 2026-10-17 终审通过（v3 定稿）**：补偿「定义不验」＋ 时点三层（HUMAN_NOTE:103 ／ DSH-4 默认 ／ 降级真发生提前触发）＋ J5 并入 3.6。历史各块（3.7.4·J6 ／ 3.8.1 ／ 3.8.2）均已回报并复核成立，落点见 `TODO.md` 与 `archive/roadmap-history.md`；正文按活日志规矩清理，见文末〈已清理段落〉。

---

## 🗂 已清理段落（按交流区规矩）

- **2026-10-15 清理（WB · 深夜）**：删〈⏳ 未结项〉两条——① 丙组① POSIX 子进程杀组缺落点：✅ **已闭环**，老大 10-15 亲笔补入 `HUMAN_NOTE.md:50`〈本地能力下沉〉第③项（含改法 `start_new_session=True`＋`os.killpg`＋⚠️ 只能 CVM/Linux 侧验）；② docs 同步转办：✅ **已闭环**，Qoder 办结（`3404a1c` ④），`product-positioning.md:181` 改「已消」＋`:507` 变更记录追加行，WB 当日实测回源确认。两条落点均在稳定区，不回溯本区。

---
