# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.4-T 装置缺陷修复** | Claude | **本机（Windows）** | ✅ **已修完 · 待 WB 复验（2026-09-30）** —— 回收移入 `runSession()`（`homeRemoved`／`homeRemoveError`／`S34_KEEP_HOME` 三件套照抄主块）；**正反两向自证**通过（默认轮计数回 0 ／ 对照轮 home 留存 ＋ `homeKeptBecause`）；⛔ 判据未动（T3M 与改前一致） | 2026-09-30 |
| **DSH-3.4-T** | Claude | **本机（Windows）** | ✅ **已交回并复验（WB 2026-09-29）** —— 靶子 = 「**3.4 的判据有没有判别力**」：**四条维度均有判别力**（T2 三档 4804／9608／19216 单调；T3 半判据 vs 完整判据两臂；T4 (a)/(b) 同刻不同读数；T5 A 落地反向对照）；**另出 3 处口径订正**（保留量是「下界＋节点吸附」／事件侧字段是 `event.data.source`／"压前"锚 `compaction/start`）＋ **2 条判据增补**（手动／自动可分 `sourceCommandId` ／ 断言"拒绝伪造 checkpoint"前先确认 `invariants` 是否挂载，本 profile 实测**未挂载 = 零防护**）。⛔ 不重判产品面 | 2026-09-29 |
| **DSH-3.5 器材重建**（`landlock_probe.py`） | Claude | **CVM（ABI 4）＋ WSL（ABI 7）** | 🚀 **已派（2026-10-08）· 待回报** —— 原件已丢失（五处核查全空）⇒ **重建**；落点改到 `harness/scripts/cvm-probes/`（受 git 跟踪） | 2026-10-08 |

---

## 🔧 DSH-3.5 器材重建：`landlock_probe.py`（2026-10-08 派发）

**背景**：`DSH-3.5` 的 landlock **独立通道器材** `D:\Temp\Sys\claude-wsl-probe\landlock_probe.py` **已确认丢失** —— WB 2026-10-08 五处核查**全部为空**：① Windows `D:\Temp\Sys\claude-wsl-probe\`（目录在、内容空）② WSL `~/claude-probe/` ③ Windows 回收站（`$I` 索引无命中）④ git 全历史（`git log --all --name-only` 无此文件）⑤ CVM 侧（`find ~ -iname '*landlock*'` 仅命中 pnpm 元数据）。⚠️ **正文从未入过库**，历史里只剩一行**描述**（旧版 `log-claude.md:55`：「已升级为 ABI 自适应；新增 `--fs-mask` 负向开关 + `VERDICT=` 机读行；WSL ABI 7 回归通过」）⇒ **只能重建，捞不回来**。

⚠️ **本块只造器材，不做 3.5 的判定**（判定轮工位归 Trae）。

### 0 · 目标

造一件**不依赖 DSH 任何包**、可在 Linux 上跑的 landlock 探针，落到**受版本控制的落点**。

⚠️ **两个结论必须拆开**（本块只覆盖 ①）：
- ① **器材可用**（**本块靶子**）：脚本能跑、能探测 ABI、能出正证、`VERDICT=` 可机读。
- ② **3.5 判据成立**（⛔ **不在本块**）：三档拒绝／提权 ＋ fail-closed 在 CVM 上生效 —— 那要跑**真 DSH**。
⇒ 本块**不得**声称「3.5 sandbox 已验」。

### 1 · 判据（逐条可复跑；每条写「取什么证据」）

| # | 判据 | 取什么证据 |
|---|---|---|
| P1 | **ABI 探测**：调 `LANDLOCK_CREATE_RULESET_VERSION` | 输出里**打印探测到的 ABI 数值** |
| P2 | **正证**：设规则（拒读掩码）→ `restrict_self` 后读被掩码路径 | 观测到 **`EACCES`** |
| P3 | **`--fs-mask` 开关**：能喂**指定** FS 掩码 | 用一条**人工喂高位掩码**的对照复现 `EINVAL`（见 §5） |
| P4 | **`VERDICT=` 机读行** | 输出含一行形如 `VERDICT=…` 的行 |
| P5 | **ABI 自适应「可读性」**：**打印「据此 ABI 声明的掩码位」** | 使「自适应」在**单场地**即可由读数验证（不必只靠跑两个 ABI 佐证） |
| P6 | **落点** = `harness/scripts/cvm-probes/landlock_probe.py` | 该文件入 git（与 `cvm-landlock-verify.mjs` 同目录） |
| P7 | **头部 provenance** | 头注释写明：v1 已丢失（正文从未入库）／本件为**重建**／v1 的历史读数**不用于逐字比对** |
| P8 | **至少一处场地实跑** | 见 §5 场地表；跑不了的那栏如实报「未跑」 |

### 2 · 判据前置（不满足则实验根本没跑起来）

- **场地可达**：CVM `ssh -i ~/.ssh/id_ed25519_cvm ubuntu@49.232.129.252` —— **前台**跑（后台拿不到沙箱放行）。⚠️ 长脚本走 `ssh host 'bash -s' <<'EOF' … EOF`、**首行 `exec 2>&1`** 归一混流，⛔ 别在 `ssh '…'` 里套多层引号。
- **CVM 侧 python 已由 WB 实测就绪（2026-10-08）**：`/usr/bin/python3` = **Python 3.12.3** ／ `import ctypes` **通过** ／ 内核 `6.8.0-124-generic`。⚠️ CVM 裸跑 `node`／`dsh` 不可信（PATH 不含），本块只用 `python3`、不受影响。
- ⛔ **本机 Windows 跑不了** landlock（内核无此 LSM）⇒ 只在 WSL／CVM 跑。
- ⛔ **别把 v1 的读数当对照基线** —— v1 正文不可得，无法比对。

### 3 · 交付物

- **脚本**：`harness/scripts/cvm-probes/landlock_probe.py`（**入 git**）。
- **原始输出**：各场地跑的**输出原样落盘**（⛔ **禁手工整理／意译**），并附**通道四元组**（宿主 shell ／ python 版本 ／ 场地 ／ 探测到的 ABI）。
- **退出码约定**：正证通过 ⇒ 0；探针自身失败 ⇒ 非 0（⛔ 别让 `VERDICT=` 与退出码表达同一件事却不一致）。

### 4 · 参考件四要素（照抄，勿另行转述）

① **路径**：
- `harness/scripts/cvm-probes/cvm-landlock-verify.mjs`（同仓 · **DSH addon 通道** · 5 臂）
- `harness/scripts/cvm-probes/cvm-sqlite-probe.py`（同仓 · python 探针的落点／风格参照）
- **规格** = `TODO.md` 3.5 器材行：`ABI 自适应 + --fs-mask 负向开关 + VERDICT= 机读行`
- **历史读数** = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 前置核查实测回填〉②（WB dry-run 的独立正证）

② **怎么参考**：读码；**抄臂结构** —— `A 写授权目录→应成功` ／ `B 写未授权→应被拒` ／ `C 读未授权→应被拒` ／ `D 读已授权→应成功` ／ `E 网络外联→不受限`（前 4 臂是「拒／许」对照，**D 臂的存在是为证明「不是全都拒」**）。

③ **参考程度**：可抄**形状**（臂的组织与期望值）；可 fork 思路。

④ **不可参考**：⛔ `.mjs` 走 **DSH 自家 addon**（`@deepseek-ai/node-addon-landlock-run`）—— **本件存在的唯一理由就是「不依赖 DSH」**（独立通道）；照搬它 = 毁掉独立通道。⚠️ 其签名／行号锚在特定版本，须在本方实物上复核。
⚠️ **v1 正文不可得** ⇒ 本件是**重写**、不是**恢复**；⛔ 不得声称「与原 v1 一致」。

### 5 · 场地器材

| 场地 | 通道 | ABI | 用途 |
|---|---|---|---|
| **CVM** `ubuntu@49.232.129.252` | `ssh -i ~/.ssh/id_ed25519_cvm`（**前台**） | **4** | **目标场地**（3.5 判定只写这里） |
| **WSL** `Ubuntu-24.04` | 你自己的通道（见下） | **7** | 回归（跑 ABI 自适应路径） |

- ⚠️ **WSL 若进不去（本机 `wsl.exe` 有拦截），如实报「未跑 WSL」** —— 靠 **P5**（打印声明的掩码位）在 **CVM 单场地**验证自适应；⛔ 别为「凑齐两场地」造等价方案。
- ⚠️ **假绿坑（必读，并写进你回报的诚实边界段）**：探针**自设掩码**（拒读）**≠** DSH 的 profile 掩码 —— DSH 的 landlock grants = `readOnly:['/']` ＋ 写白名单（`sandbox-local/src/profiles.ts:32-38`）⇒ **读权限全开、白名单只约束写**。⇒ 探针正证**只证「内核确实强制」**，⛔ **不得读成「DSH 会挡住读敏感文件」**（CVM 非独占、他方 AI 产物在库）。
- ⚠️ **ABI 边界**：**人工喂高位掩码**给低 ABI 内核 ⇒ `create_ruleset` 直接 `EINVAL`（**此条成立**，可当 P3 的对照）—— 但 ⛔ 别据此推断「DSH 在 ABI 4 上会失败」（**DSH 自身按协商 ABI 裁剪掩码**，`main.c:184-189`）。

### 6 · 回报格式

**结论先行** → 逐条 P1–P8 的证据（**命令 ＋ 观测原文**）→ **未闭合项单列** → **自曝**。
⛔「成因未知」是可接受结论，别为叙事完整编一个。⚠️ 按本区**通用纪律 6 条**（通道须注明 ／ 「没有」须附检索式 ／ 自曝优于好看 ／ 未观测不得写成已证 ／ 应红应绿逐件读源码 ／ 收尾必核 `git status`）。

### 7 · 禁区

- ⛔ **不依赖 DSH 的任何 addon／包／模块**（独立通道是本件唯一的存在理由）。
- ⛔ **不做 3.5 判定、不改任何判据**（判定轮工位归 Trae）。
- ⛔ **不落凭据**（本件用不到任何 key）。
- ⛔ **不改 `docs/`**（定案区，WB 处置）；**不改 `TODO.md`**（WB 处置）。
- ⛔ **别把产物放回 `D:\Temp\…`** —— 那个目录被 `docs/test-env.md:280` 标注「**可整目录删，未清**」，**v1 就是这样没的**；重做还放那儿 = 再丢一次。**只落 `harness/scripts/cvm-probes/`**。
- ⛔ 若发现还需别的器材，**报告出来、不扩大范围**。

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
