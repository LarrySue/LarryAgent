# WorkBuddy 协作区

> **属主 = WorkBuddy**；**职责**：任务规划 ／ 统筹 ／ 分派 ／ **复验** ＋ 维护 `TODO.md` ＋ 清理 `exchange/log-*`。⚠️ `docs/` ／ `archive/` ／ 交流区讨论稿归 **Qoder** —— WB **不亲自改**，只暴露 ＋ 备精确改法。
> 临时协作空间：仅在需要向其他 AI 同步时写入，**不做长期保留**；跨 AI 共享的项目事实按归属落 —— 任务 ／ 进度 → `TODO.md`（WB），判据 ／ 边界 ／ 结论 → `docs/` ／ `archive/`（Qoder）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| Qoder · #40 docs 帧名订正（`request/context` 记录不准 ＋ J5/J6 断言帧改钉 `system/message`） | Qoder | 本机 | 🔵 待办（改法在 `log-qoder.md` #40） | 2026-10-18 |
| Trae · DSH-3.6.1 召回闭环（J6，需 key） | Trae | 本机 Windows | 🔵 **待跑**（WB 已放行 · ≤10 次对话预算） | 2026-10-17 |

> ✅ **DSH-3.6 主块闭环**（2026-10-18 WB 复验判定成立）：J0–J5 全绿——事件消费（source_event_seq 交叉核对）／ 外接 SQLite（哨兵阳性）／ ChromaDB 双写（512 维 + 余弦 1.00000）／ 降级双锚（时间界 1.51× + 降级行锚定）／ 注入面（`system/message` 帧逐字含 nonce）。⏳ 待办：3.6.1 起跑 ／ docs 帧名订正（#40）／ Trae 工作区交付物提交时机（问老大）／ 3.6.1 收口后整段归档（Qoder）。历史各块落点见 `TODO.md` 与 `archive/roadmap-history.md`；正文按活日志规矩清理，见文末〈已清理段落〉。

---

## 🗂 已清理段落（按交流区规矩）

- **2026-10-15 清理（WB · 深夜）**：删〈⏳ 未结项〉两条——① 丙组① POSIX 子进程杀组缺落点：✅ **已闭环**，老大 10-15 亲笔补入 `HUMAN_NOTE.md`〈本地能力下沉〉第③项（含改法 `start_new_session=True`＋`os.killpg`＋⚠️ 只能 CVM/Linux 侧验）；② docs 同步转办：✅ **已闭环**，Qoder 办结（`3404a1c` ④），`product-positioning.md:181` 改「已消」＋`:507` 变更记录追加行，WB 当日实测回源确认。两条落点均在稳定区，不回溯本区。

---
