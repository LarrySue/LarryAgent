# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.4-T 装置缺陷修复** | Claude | **本机（Windows）** | ✅ **已修完 · 待 WB 复验（2026-09-30）** —— 回收移入 `runSession()`（`homeRemoved`／`homeRemoveError`／`S34_KEEP_HOME` 三件套照抄主块）；**正反两向自证**通过（默认轮计数回 0 ／ 对照轮 home 留存 ＋ `homeKeptBecause`）；⛔ 判据未动（T3M 与改前一致） | 2026-09-30 |
| **DSH-3.4-T** | Claude | **本机（Windows）** | ✅ **已交回并复验（WB 2026-09-29）** —— 靶子 = 「**3.4 的判据有没有判别力**」：**四条维度均有判别力**（T2 三档 4804／9608／19216 单调；T3 半判据 vs 完整判据两臂；T4 (a)/(b) 同刻不同读数；T5 A 落地反向对照）；**另出 3 处口径订正**（保留量是「下界＋节点吸附」／事件侧字段是 `event.data.source`／"压前"锚 `compaction/start`）＋ **2 条判据增补**（手动／自动可分 `sourceCommandId` ／ 断言"拒绝伪造 checkpoint"前先确认 `invariants` 是否挂载，本 profile 实测**未挂载 = 零防护**）。⛔ 不重判产品面 | 2026-09-29 |

---

## 🔧 DSH-3.4-T 装置缺陷修复（2026-09-30 派发）

**背景**：`DSH-3.4-T` **已于 2026-09-29 交回并复验成立**（见上表）⇒ 该交付件**复核已放行**，本块是它遗留的**装置卫生缺陷**，修完即彻底结项。⚠️ **本块不改任何判据、不重判任何结论**（T1–T6 的判定保持原样）。

### 要修的一件事（只有一件）

**`harness/scripts/run-34t-probe.mjs` 的临时 home 不回收 —— 每臂泄漏一份完整 profile 副本。**

- **现象**：每跑一臂，`makeHome()`（`:132`）`mkdtempSync(join(tmpdir(),'larry-34t-'))` 造一份临时 home，内含 `cpSync(SRC_SDK, …)` 的**完整 profile 副本（≈341 MB ／ 4.35 万文件）**，**跑完不删**。实测累积 **21 份 ≈7.2 GB**（老大 2026-09-30 已手工清掉 `D:\Temp\Sys\larry-34t-*`）。
- **根因**：回收语句写在了**错的路径**上 —— `:518` 的 `rmSync(join(sub, 'home'), { recursive: true, force: true })`；其中 `sub = join(dir, label)`（`:499`）是**证据子目录**，**其下根本没有 `home` 这个子目录** ⇒ 该调用**恒 no-op**（`force: true` 连报错都不会有）。真正的 home 是 `makeHome()` 内部 `mkdtempSync` 出来的那个值 —— 它经 `:195` 解构为 `runSession()` 的**局部变量 `home`**，**函数返回时即丢失**，调用方拿不到 ⇒ 无从删。

### 修法（照抄正解，勿自创）

**正解已在同工程的姊妹装置里** ⇒ `harness/scripts/run-34-compaction.mjs:232-241`：

```js
const keepHome = (process.env.S34_KEEP_HOME ?? '0') === '1'
if (!keepHome) {
  try { rmSync(home, { recursive: true, force: true }); report.homeRemoved = true }
  catch (e) { report.homeRemoved = false; report.homeRemoveError = String(e?.message ?? e) }
} else {
  report.homeRemoved = false
  report.homeKeptBecause = 'S34_KEEP_HOME=1'
}
```

**逐条要求**：

1. **让 home 可被回收**：把 `home` 从 `runSession()` 传出来（返回 `{ report, …, home }`，与主块同形），**在真正持有它的作用域里删** —— ⛔ **不要再写 `join(sub,'home')` 这种猜路径**。
2. **必需三件套**（照抄主块）：① `rmSync` **包 `try/catch`**（长路径在 Windows 上偶发失败，⛔ 不得让回收失败把整轮判红）；② 落 **`homeRemoved` 布尔**入证据 JSON；③ 失败时落 **`homeRemoveError`**。
3. **保留开关**：`S34_KEEP_HOME=1` ⇒ 不删、落 `homeKeptBecause`（照抄主块语义，便于事后翻查）。
4. **长路径兜底**：主块注释里提到的"含长路径失败兜底" —— 若主块有额外处理（如 `\\?\` 前缀或重试），**一并照抄**；若主块其实就是 `try/catch`，则照此即可。
   - ⚠️ 若你认为还须加主块没有的兜底，**先说明理由再改**（⛔ 不要默默比主块多做一层 —— 两装置行为须可对照）。
5. **收尾自证**：修完后**跑一轮**（哪怕是最小的单臂），**贴出**：① 本轮前后 `tmpdir()` 下 `larry-34t-*` 目录数（**应回到 0**）；② 证据 JSON 里 `homeRemoved === true`；③ 反向对照 —— 加 `S34_KEEP_HOME=1` 跑一次 ⇒ 目录**应存在**、`homeKeptBecause === 'S34_KEEP_HOME=1'`（**证明开关双向可用、非恒真**）。

### ⛔ 禁区

- **不改任何判据、不改 T1–T6 的任何期望值** —— 本块纯装置卫生。
- **不重跑、不重判 3.4-T 的结论**（原证据快照为冻结物证）。
- **不动 `run-34-compaction.mjs`**（它是正解来源，照抄即可）。
- 若发现**还有别处也在泄漏**（如同装置其他临时目录），**报告出来**但⛔ **不擅自扩大范围** —— 由 WB 决定是否并入本块。

### 报告要求

- 按本区**通用纪律 6 条**（通道须注明 ／ "没有"须附检索式 ／ 自曝优于好看 ／ 未观测不得写成已证 ／ 应红应绿逐件读源码 ／ 收尾必核 `git status`）。
- **交付 = 改动 + 一轮正反两向的自证读数**（上面第 5 条那三样）。
- 完成后回写本区（`## 📮 在飞任务` 表内更新状态 ＋ 正文附回报），WB 复验后本块即结项。

---

- **判据、边界与遗留的权威落点 = `docs/dsh/dsh-migration.md` §3.6 ＋ `archive/roadmap-history.md`（「DSH-3.4」段 2026-10-01 归档 ／ 「DSH-3.7.4-T」段；原写 `TODO.md`「DSH-3.4」段）**；本区只放**怎么做**。⚠️ 需回溯时用 `git log -p -- exchange/log-claude.md`。
- ⚠️ **通用纪律**：
  1. **报告须注明通道** —— 同一台机器上，不同工具树 ／ 不同 shell 会话会给出**不同 node 版本**与不同文件系统视图 ⇒ 结论不可跨通道互推（"Bash 通道"这种写法对别人而言是**另一条**）。
  2. **"没有 ／ 不存在"须附检索式与遍历范围**，否则不可验、等于没回答。
  3. **自曝优于好看**：口径错 ／ 跑歪 ／ 覆盖了证据，都直接写。
  4. **未观测到的行为不得写成已证**（"可达但未观测"要标清；"构造成立"要标为构造）。
  5. **应红 ／ 应绿须逐件读源码定期望**，不得按"组"给口径（同一批哨兵里可能有**落绿才是绿**的件）。
  6. **收尾必核 `git status`**。

---

## 📥 DSH-3.4-T 装置缺陷修复 · 回报（Claude ／ 本机 Windows · 2026-09-30）

**结论先行**：泄漏已修，**正反两向自证**通过 —— 默认轮 `homeRemoved=true` 且 `tmpdir()` 计数回到 0；对照轮（`S34_KEEP_HOME=1`）home **留存**且 `homeKeptBecause` 落值。⛔ 未改任何判据：两轮 T3M 判定与改前一致（PASS 3 ／ FAIL 0 ／ OBS 3，exit 0）。

### 1 · 改了什么（两处，均在 `harness/scripts/run-34t-probe.mjs`）

| 处 | 改动 | 为什么 |
|---|---|---|
| `runSession()` 尾部（`saveJson` **之前**） | 照抄主块 `run-34-compaction.mjs:232-241` 三件套：`try{ rmSync(home); homeRemoved=true }catch{ homeRemoved=false; homeRemoveError }`；`S34_KEEP_HOME=1` ⇒ 不删 ＋ `homeKeptBecause` | `home` 由本函数 `makeHome()` 造出、**只在本作用域可达**；且必须在 `saveJson` 前删，`homeRemoved` 才落得进证据 JSON |
| `armT2()` 循环内（原 `:518`） | **删除** `rmSync(join(sub,'home'), …)`，留注释写明它为何恒 no-op | 它在**证据子目录**下猜了个不存在的 `home`（`force:true` 连错都不报）⇒ 那 21 份 ≈7.2 GB 就是它漏出来的 |

- `report.home` ／ 返回 `{ …, home }` **原先就有** ⇒ 与主块同形，可逐行对照。
- **长路径兜底**：主块**就是** try/catch —— 检索式 `grep -n '\\\\?\\\|retry\|longpath' harness/scripts/run-34-compaction.mjs`，范围＝该文件全文，**0 命中** ⇒ 照此即可，未自创额外层。
- **调用方影响**：全文件 5 处 `await runSession` **全部**只解构 `{ report, probeRows }`（检索式 `grep -n '\bhome\b' harness/scripts/run-34t-probe.mjs` ⇒ `home` 使用点只剩 makeHome／report 字段／回收块）⇒ 返回「已被删的 home」不影响任何臂。

### 2 · 自证读数（臂 `t3m`；证据 `D:\Code\_claude-evidence\34t-fix\<stamp>\`，索引见其 `README.md`）

| 项 | 期望 | 实测 |
|---|---|---|
| A 轮 `larry-34t-*` 计数（跑前→跑后） | 0 → 0 | **0 → 0** ✓ |
| A 轮 证据 JSON | `homeRemoved === true` | **true**（`home=D:\Temp\Sys\larry-34t-miHv2H`，无 `homeRemoveError`）✓ |
| B 轮 同计数（`S34_KEEP_HOME=1`） | 0 → **1** | **0 → 1**（`larry-34t-fzui48`，实测 5,674 目录／43,527 文件／**≈340.6 MB**）✓ |
| B 轮 证据 JSON | `homeRemoved === false` ＋ `homeKeptBecause === 'S34_KEEP_HOME=1'` | **一致** ✓ |
| 两轮判据（应红／应绿逐件读源码定期望） | 与改前一致 | **一致**（T3M-2／3／6 全 PASS，exit 0）✓ |

**通道**：MSYS bash（宿主）／ node **v24.14.1**（`D:\App\node\node.exe`）／ dsh `0.1.5-rc.2` ／ 链路 = dsh SDK 通道（`--profile sdk`）—— 同 2026-09-29 交付轮。

### 3 · 自曝（三件）

1. **两轮都没用真 Key**：本通道凭据无效 ⇒ 单次模型回合以 `AUTH` 收尾（`turnEndSummary[0].errorCode="AUTH"`）。选 `t3m` 正因它的 6 条判定全在谓词／投递层、不看模型输出 ⇒ 省 token 且不碰本块靶子。⛔ 未申请临时 Key、未落任何凭据。
2. **B 轮那份 340.6 MB home 是我读完读数后手动删的** ⇒ 证据里只有「留存」那一刻的读数；删后计数回 0 的复核也记在 `README.md`。
3. **「长路径失败」未观测 ≠ 不存在**：两轮 `rmSync` 均成功（无 `homeRemoveError`）；同一批目录我用 `cmd rmdir` 时确实吃过长路径亏（21 份里 5–6 份删不净）—— 但那是 **cmd** 的限制，不是 Node `rmSync` 的实测结论。

### 4 · 扫到别处（⛔ 未动，按禁区「报告但不扩大范围」）

检索式 `grep -l "mkdtempSync" harness/scripts/*.mjs` ⇒ **7 件**，逐件核回收：

| 件 | 回收情况 | 判定 |
|---|---|---|
| `run-34-compaction.mjs` | 2 处（正解） | ✅ |
| `run-34t-probe.mjs` | 本块修后 1 处 | ✅ |
| `run-381-driver.mjs` | 有回收 ＋ 另扫孤儿 home；但开关 `S381_KEEP_HOME` **缺省 `'1'`（缺省＝保留）** | ⚠️ 与主块口径相反，供裁 |
| `s0-e2e-destructive-actions.mjs` | `rmSync(scratch…)`（在自建 root 下、非 `tmpdir()`） | ✅ |
| `run-33a-answerer-e2e.mjs`／`run-33b-remote-approval.mjs` | **设计上保留**（`console.log("临时 home 保留在 …（供复核；复核后可删）")`） | ⚠️ 非缺陷但需人工清；当前两前缀残留 **0**（检索式 `ls -d /d/Temp/Sys/larry-33a-* larry-33b-*`） |
| `verify-a-landing-profile.mjs` | **2026-09-30 11:25 已由主人补上回收**（`:126`） | ✅（**时间线订正**：我 10:35 曾在本区写过「A 落地装置无回收代码」—— 写入时检索确无命中、为真；该句随后已随交流区清理删除，11:25 该件补上回收 ⇒ 现行状态＝有回收） |

### 5 · 收尾

- `git status`（提交前）：**只有** ` M harness/scripts/run-34t-probe.mjs`（别家的 `run-34-compaction.mjs` 改动已由主人自行提交，不在我这里）。
- 本块**结项后**不会再有 `larry-34t-*` 堆积；本目录（`_claude-evidence/34t-fix/`）只留两轮小件（≈0.2 MB），B 轮那份 340.6 MB 已删。

---

## 🗂 已清理段落（按交流区规矩）

- **2026-09-30 清理（第二轮）**：删除 `## ⚠️ 待裁（Tier 0 红线③）：/dev/shm 的 RemoveIPC 归因` 段 —— ✅ **老大 2026-09-30 裁 A「就此结案」**（接受"成因未知"，⛔ 不补做对照实验）⇒ **权威落点 = `docs/production-env.md` 第 9 条**（含双方观测 ／ 机器事实 ／ Claude 侧建议 ／ 结案留痕 ／ 日后事故起点说明），**已闭环**。回溯：`git log -p -- exchange/log-claude.md`。

---
