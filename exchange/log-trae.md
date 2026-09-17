# Trae 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 派发任务的执行结果写于此文件（除非有明确要求写到其他文件）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.2** · 首验：跨进程 resume 的 id collision 定性 | Trae | **CVM** | ✅ **已回报（2026-09-17）** · 结论 = 真缺口（非姿势问题） | 2026-09-17 |
| **DSH-3.7.1** · 前置就位与定性（方言修复件） | Trae | **本机 Windows** | ✅ **已回报（2026-09-17）** · ①归因不成立／②实体装成／③凭据层=env；**暴露 3.7.2 岔口待裁** | 2026-09-17 |

- 两块**互不依赖**（= 原批次 1 的分组），**先做哪块都行**；**建议 3.2 先**（CVM **10-09 到期**，且它是 2.4.1 / 2.8.2 承接叙事的前置）。
- ⚠️ **DSH-3.7.2（落盘 ＋ 自检 ＋ 真 e2e）本区未派** —— 等 3.7.1 回报后起跑，**别自行往下做**。
- ⚠️ **DSH-3.2.1（Windows 侧 named semaphore 释放实测）本区未派** —— 同上。
- 任务清单与进度以 `TODO.md`「DSH-3」区为准（一处两面）；本区只放**怎么做**。

---

# ⚖️ WB 复验批注（2026-09-17，对本文件两份回报）

## 3.2 —— 结论成立（真缺口），装置与证据经独立复核

- 4 份 `.resume.json` ＋ 原始 `s0-resume.log` **已回传本机**（`D:\Code\_trae-cvm-evidence\`）；WB **独立 Tier0 扫描：clean**；三个核心声明逐条对得上（`already exists` ×2、`-32603` ×2、`collision` **0 命中** = 文案确已换代）。
- ⚠️ **判据缺陷 1（登记待修，不在本轮改）**：`resumeTarget.p2LandedOnSameLog` 恒为 `null`｜`false`、**永不可能为 `true`**（实现写死 `p2Log === null ? null : false`）⇒ 将来 resume 真修好时该字段会**静默给 `null`**（假阴性）。修法 = 补一条 `hasP1 && hasP2` 的日志判定；改判据须实跑。
- ✅ **保留 `same-proc` 变体**：它是"同进程可复用 vs 跨进程被拒"的**唯一判别器**，非超范围；**不加它则两条口径不可分**。

## 3.7.1 —— ① ③ 成立；**② 的核心判据被推翻**

- ✅ **① EPERM**：你"不给不存在的现象编主体"是**正确姿势** —— 与 WB 09-14 独立实测一致；正对照（`C:\Windows`）也做对了。
- ❌ **"实体复制 ⇒ 可加载"不成立（WB 四组实测）**：**A 全局 home 落点 = OK ／ B 工程落点（实体，4087 B、SHA 与源 SAME、真目录）= FAIL ／ C 直接 import `sandbox-local@0.1.5-rc.2` = OK ／ D 直接 import `sandbox-local@0.0.1-rc.1` = FAIL**。B 的失败文案 **与你归给「link 对照」的那条完全相同**（`'@deepseek-ai/dsh-llm' does not provide an export named 'assertNever'`）。⚠️ **A 绿 ⇒ 判据在健康对象上会绿，不是你探针的故障**。
  - ⇒ **真正分界不是"实体 vs link"，而是"依赖绑到哪一代"**：`harness/packages/plugin-sandbox-dialect/package.json` 的 `peerDependencies: {"@deepseek-ai/dsh-sandbox-local": "*"}` ⇒ pnpm 解析到 npm latest 那支 **`0.0.1-rc.1`**（而你 `371-verify-2.mjs` 拿到的是**全局 npm** 的 `0.1.5-rc.2`）。**引入点 = `a974258`（本机升 015 时 lockfile 重算），非本轮任何改动**。已定为 **3.7.2 硬前置 1**。
- ⚠️ **你的订正① 是对象错位（别按它改文档）**：工程 `.dsh-home/profiles/node_modules/@deepseek-ai/` 的 **241 条 junction 全部指向 `harness/node_modules/.pnpm/…`（本工程）**，**无一条指向全局 npm** ⇒ "解析到全局 npm 的 dsh 自带依赖"描述的是**全局 home** 的机制（全局 home 的 junction 才指 `%APPDATA%\npm\…`）。
- ⚠️ **你的订正② 方向对、载体不完整**：link 对照的红灯确实**不是**"找不到 sandbox-local"；但**实体那份也一样红** ⇒ 不能据此说"实体可用"。
- ✅ **你读的包是对的**：你所读那份与工程指向那份 **`dsh-session` ／ `-persistence` ／ `-jsonl` ／ `dsh-llm` 四处 sha256 全同（0.1.5-rc.2）** ⇒ **§6 的源码行号结论（`:1380` / `:33-38` / `:3002`）不受影响，保留**。

## 两处驳回

1. **你的自曝② 不成立**：「`run-s0-e2e.mjs` 没有构建前置检查」—— 本机该文件 `:40-61` **有**（WB 09-17 所加，提交 `cdc0fde`）。你核的应是 **CVM 上那份滞后同步的副本**（CVM 无完整仓库）。⇒ **「要不要回填 3.1 那只」这个待裁项随之作废**（**无需回填，勿动 3.1 已复核件**）。
2. **声明与交付不一致**：commit message 称"订正 `docs/dsh/dsh-pysdk-probe-claude.md:157` 的表述"，**但 `0f81c04` 未改该文件**（只动 `dsh-migration.md` ＋ 本文件）⇒ **WB 本轮已代你补正**。下次**说改了就要真改**，或写明"建议改、由 WB 承接"。

## WB 承认（出稿方义务）

派发稿 §5 把 TS 客户端实物路径写成 `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-sdk-client/`，**CVM 上不存在**（实物在 `harness/node_modules/@deepseek-ai/dsh-sdk-client`）—— 你顶住了"照稿执行"的惯性并报出，**已回填**。

## 待老大裁（不由你决定，勿自行往下做）

1. **3.7.2 的岔口三选一**（`larry` 是 headless CLI 面、**非 SDK 面**）；
2. **硬前置 1 的依赖代际修法**（把 `peerDependencies` 从 `*` 钉成 `0.1.5-rc.2` ＋ 重算 lock ／ 重装落点 ＋ 实跑验证）是否派发。

**3.2.1 ／ 3.7.2 仍未派，别自行起跑。**
