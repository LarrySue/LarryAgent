# Qoder 交流区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）

---

## 🔔 派发中 · 2026-09-16 · 本机环境同代化收尾：harness 树重建 + 工程 home 升 015

**状态**：已回报（2026-09-17 ｜ 回报段落见本文件下方〈🔔 回报 · 2026-09-17〉）
**派发**：老大 ｜ **出稿**：WB（架构 · 复验） ｜ **执行**：Qoder
**开工前置**：老大已手动完成删除（清单见 §2），并已开启 Windows 开发者模式
**建议先读**：`docs/local-env.md` §4.3.1、`TODO.md` DSH-3.1 前置段

---

### 1. 任务边界

DSH 基线已从 `0.1.2-rc.1` 换到 `0.1.5-rc.2`。本机「环境同代化」共五处，**两处已完成、其余待做**：

| # | 项 | 状态 |
|---|---|---|
| ① | `harness/package.json` + `pnpm-lock.yaml` | ✅ 已 015（lock：`0.1.2-rc.1` 出现 0 次 ／ `0.1.5-rc.2` 出现 4923 次） |
| ② | npm 全局 CLI（`%APPDATA%\npm`） | ✅ `0.1.5-rc.2` |
| ③ | **`harness/node_modules`（装置侧依赖树）** | ❌ **待重建** → 本单**任务 A** |
| ④ | **`.dsh-home/profiles/{larry,sdk}`（工程 home）** | ❌ **待升 015** → 本单**任务 B** |
| ⑤ | `~/.dsh`（全局 home）回退层 | ✅ `0.1.5-rc.2` |

### 2. 起点状态（WB 已实测复验）

**已删净**：`harness/node_modules` 内容、`.dsh-home/profiles/node_modules`、`.dsh-home/profiles/{larry,sdk}/node_modules` 与 `pnpm-lock.yaml`、`D:\Code\_bak-local015\node_modules.bak-*`、managed node 隔离区里误装的那份 dsh

**必须保留**（已核在）：
- `harness/pnpm-lock.yaml` — 547,540 B，已是 015（**重建时别动它**）
- `harness/package.json` — 已 015
- `D:\Code\_bak-local015\` 下 9 个文件（含 `baseline-20260916-222343.md`，修前基线，可作对照）

**当前起点**：`harness/node_modules` = **空目录**（entries=0）；`.dsh-home/profiles/{larry,sdk}` 各剩 5 项（`.dsh-module-fallback` / `cordis.patch.yml` / `cordis.yml` / `package.json` / `pnpm-workspace.yaml`）

### 3. ⚠️ 开工先自检（它决定任务 A 的装法）

WB 在本机实测到：**创建「真符号链接」会失败** —— 只有 `%TEMP%` 目录内可建，其它路径（含 `D:\Code`、`C:\Users\SuLarry`）均报 `WinError 2 系统找不到指定的文件`；而 **junction 与 hardlink 处处可用**。成因**未查清**（已排除：非管理员权限、非卷类型、非开发者模式、非沙箱开关）。**你的通道未必相同**，所以请先自测：

```cmd
mkdir D:\_symchk_T
mklink /D D:\_symchk_L D:\_symchk_T
dir D:\_symchk_L
```

判定（**要验证结果，别只看报错**——本机见过 `mklink` 报错但目录实际存在的情况）：

- `dir` 能列出 `D:\_symchk_T` 里的内容、或显示 `<SYMLINKD>` / `<JUNCTION>` → **symlink 可用** ⇒ 走 **A-(a)**
- 报错且 `dir` 为空 → **不可用** ⇒ 走 **A-(b)**

自检完删掉 `D:\_symchk_L`、`D:\_symchk_T` 再开工。

### 4. 任务 A：重建 harness 依赖树

```
cd D:\Code\LarryAgent\harness
```

**(a) symlink 可用**（期望路径 —— 与 CVM 结构一致）：
```
pnpm install
```

**(b) symlink 不可用**（兜底路径 —— 本机走扁平布局）：
```
pnpm install --config.node-linker=hoisted
```
并**必须**在 `C:\Users\SuLarry\.npmrc` 追加一行 `node-linker=hoisted`。
> **不要**改 `harness/pnpm-workspace.yaml` —— 那是受版本控制的仓库文件，同步过去会把本机的结构妥协传染给 CVM。

**三个坑（WB 已踩过，务必避开）**：
1. **`pnpm run <script>` 会先自动跑一次 `install`（不带任何自定义参数）** —— 若走 (b) 却没固化 `.npmrc`，跑一次脚本就把树打回坏形态（WB 实测踩中）
2. **「假绿」**：pnpm 可能报 `Done` / `EXIT=0` / 零 error，但**顶层链接层全是空壳**（目录在、`package.json` 不在）。**不得以 install 输出当验收**，必须用 `require.resolve` 验证
3. 若报 `Already up to date` 却树不可用 ⇒ 删掉 `node_modules/.modules.yaml` 与 `.pnpm-workspace-state-v1.json` 再装（pnpm 的状态缓存**不校验内容**，外部删过就不自愈）

### 5. 任务 B：`.dsh-home` 两个 profile 升 015

**只改版本号，不改 composition**（CVM 与本机的 composition 本就不同，不属本单范围）：

- `.dsh-home/profiles/larry/package.json`：`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-headless` 由 `0.1.2-rc.1` → `0.1.5-rc.2`；`@larryagent/plugin-probe: link:D:/Code/LarryAgent/harness/packages/plugin-probe` **保留不动**
- `.dsh-home/profiles/sdk/package.json`：`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-sdk-app` 由 `0.1.2-rc.1` → `0.1.5-rc.2`

装法：进各自 profile 目录跑 `pnpm install`。两个 profile 的 `pnpm-workspace.yaml` **已自带** `nodeLinker: hoisted` + `autoInstallPeers: false`，照用、别改。

装完各跑一次（会触发 DSH 的 profile heal，属正常）：
```
dsh --profile larry --help
dsh --profile sdk --help
```

注：`.dsh-home/` 被 `.gitignore` 排除，这两处改动不入仓库。

### 6. 验收判据（逐条附实测输出）

**任务 A**
- [ ] 在 `harness\` 下 `node -e "console.log(require.resolve('@deepseek-ai/dsh/package.json'))"` 解析成功
- [ ] `harness\node_modules\@deepseek-ai\dsh\package.json` 的 `version` = `0.1.5-rc.2`
- [ ] `harness\node_modules` 顶层**空壳目录数 = 0**（判据：目录存在、无 `package.json`、且非链接）
- [ ] `pnpm run test:isolated` 通过，且**进程能自己退出**（`exit 0` ≠ 进程已退出，须确认无需 timeout 强杀）
- [ ] `test:isolated:sentinel`、`test:isolated:sentinel-key`、`test:isolated:sentinel-unset` 三条同上

**任务 B**
- [ ] 两个 profile 的 `node_modules\@deepseek-ai\dsh-base\package.json` = `0.1.5-rc.2`
- [ ] 两个 profile 的 `pnpm-lock.yaml` 里 `0.1.2-rc.1` 出现 **0** 次
- [ ] 两条 `dsh --profile X --help` 均正常返回（非报错退出）

**收尾**
- [ ] `git status --porcelain` 的输出逐条解释（哪些是本次必要改动、哪些是噪声）

### 7. 红线

1. **不碰任何 `.credentials.yaml`**（任何路径下）
2. **不改 `harness/pnpm-workspace.yaml`**、**不改 `harness/package.json`**（已 015）
3. **不删 `harness/pnpm-lock.yaml`** —— 除非 install 失败且你判断必须重算；那就先备份、再重算，并在回报里写明
4. **不动 CVM 的 `~/.dsh/profiles/larry`**（CVM 侧 composition 不同，属 3.5/3.7 范围，不在本单）
5. **不擅自 `git commit`** —— 改动留在工作区，由 WB 复验后统一提交

### 8. 任务 C（可选）：lockfile 一致性核实

CVM 的 `~/harness/package.json` 与 `pnpm-lock.yaml` 是 3.0.4 在 CVM **现场改**的；本机这份是**删树重算**的。两边版本号都已 015，但**内容是否一致尚未核**。若有余力：SSH 取 CVM lockfile 的摘要（方案数 / `0.1.5-rc.2` 出现次数 / 关键包解析），与本机比对。**只回报差异，不要自行覆盖任一侧。**

### 9. 回报要求

- 写在本文件**新增段落**，沿用你惯用的表格 + 结论格式
- **每条验收判据附实测输出**（命令 + 原始输出片段），不接受"已完成"式声明
- 明确写出任务 A 走的是 **(a) 还是 (b)**；若走 (b)，附自检的原始输出
- 卡住或无法判定的地方：**如实写「未查清 + 卡在哪」**，不要为叙事完整性补一个成因
- 完成后在段落顶部标 **状态：已回报**，并在 `TODO.md` DSH-3.1 前置段对应条目上打勾（若你无 TODO 写权限，就在回报里说明"待 WB 勾"）

---

## 🔔 回报 · 2026-09-17 · 本机环境同代化收尾（任务 A 树重建 / 任务 B profiles 升 015 / 任务 C 核对）

**状态：已回报**
**执行**：Qoder ｜ **对应派发**：本文件〈派发中〉段 ｜ **任务 A 装法**：**(a) symlink 可用 ⇒ 默认 `pnpm install`（isolated）**

> 派发稿「建议先读」`docs/local-env.md` §4.3.1 已读；§1/§2 的启动锁章节亦一并核对（本次未撞锁，见 §5.3）。

### 0. 结论摘要

| # | 项 | 结果 |
|---|---|---|
| 开工自检 | symlink 可用性 | ✅ **可用**（**与本机既有记载相反**，见 §1）⇒ 走 (a) |
| 任务 A | `harness/node_modules` 重建 | ✅ 完成，5 条判据全过（§2） |
| 任务 B | `.dsh-home/profiles/{larry,sdk}` 升 015 | ✅ 完成，3 条判据全过（§4） |
| 任务 C | 与 CVM lockfile 比对 | ✅ 完成，**差异仅 1 行**且成因闭环（§6） |
| 红线 | 5 条 | ✅ 未触碰（§8） |
| 收尾 | `git status --porcelain` | ✅ **空**（受控文件零改动，§7） |

⚠️ **两条须过目的口径偏差**（都不是失败）：
1. 派发稿 §6 把 `sentinel` 两条也算作"应通过" —— 它们是**负向哨兵，本来就该红**，"三条同上"按字面读会误判成失败（§3）。
2. `TODO.md` :278-281 载「本机创建真符号链接失败、仅 `%TEMP%` 内可建」—— **与我这条通道实测相反**，我四路径全可建（§1）。⇒ :281 推论「本机 hoisted ↔ CVM isolated」在我这条通道**不成立**，两侧结构已等价。

---

### 1. 开工自检：symlink 判定 = 可用 ⇒ (a)

**自检命令**（派发稿 §3 原文形态，cmd 通道）：
```
mkdir D:\_symchk_T
mklink /D D:\_symchk_L D:\_symchk_T
dir D:\_symchk_L
```

**结果（`D:\Temp\symchk.bat`，原始输出）**：
```
=== [A] C:\Users\SuLarry ===
symbolic link created for C:\Users\SuLarry\_symchk_L <<===>> C:\Users\SuLarry\_symchk_T
MK_EXIT=0
2026/09/17  00:06    <SYMLINKD>     _symchk_L [C:\Users\SuLarry\_symchk_T]

=== [B] D:\Code\LarryAgent\harness ===
symbolic link created for D:\Code\LarryAgent\harness\_symchk_L <<===>> D:\Code\LarryAgent\harness\_symchk_T
MK_EXIT=0
2026/09/17  00:06    <SYMLINKD>     _symchk_L [D:\Code\LarryAgent\harness\_symchk_T]

=== [C] TEMP ===
TEMP=D:\Temp\Sys
symbolic link created for D:\Temp\Sys\_symchk_L <<===>> D:\Temp\Sys\_symchk_T
MK_EXIT=0

=== [D] file symlink @ project dir ===
symbolic link created for D:\Code\LarryAgent\harness\_symchk_F <<===>> D:\Code\LarryAgent\harness\package.json
MK_EXIT=0
2026/09/17  00:06    <SYMLINK>      _symchk_F [D:\Code\LarryAgent\harness\package.json]
2026/09/17  00:06    <SYMLINKD>     _symchk_L [D:\Code\LarryAgent\harness\_symchk_T]

=== [E] junction @ project dir ===
Junction created for D:\Code\LarryAgent\harness\_symchk_J <<===>> D:\Code\LarryAgent\harness\_symchk_T
MK_EXIT=0
```

附带确认 reparse tag（`fsutil reparsepoint query D:\_symchk_L`，原始片段）：
```
重分析标记值 : 0xa000000c
标记值: Microsoft
标记值: Name Surrogate
```
⇒ `0xa000000c` = **真 SYMLINK**（junction 为 `0xa0000003`），`dir /AL` 亦显示 `<SYMLINKD>` 而非 `<JUNCTION>`。

**结论**：`D:\` 根、`C:\Users\SuLarry`、项目目录、`%TEMP%` **四处全可建真 symlink**；文件符号链接与 junction 亦可用。**判 symlink 可用 ⇒ 走 (a)**。自检残留 4 处链接 + 4 处目标目录已全部清除（`symchk-clean.bat` + `del` 修文件符号链接，`rmdir` 在文件符号链接上静默失败故易漏），并逐路径复验为 clean。

> ⚠️ **与既有记载的矛盾（主动暴露，不自行消化）**：`TODO.md` :278 记「本机创建真符号链接失败 —— 仅 `%TEMP%` 内可建，其余路径一律 `WinError 2`」，:279 由此推出「pnpm isolated 在本机装不出链接层、顶层全是空壳」。**我这条通道实测相反**（四路径全可建，且任务 A 装出的顶层链接经 `dir /AL` 全部为 `<SYMLINKD>`）。
> - **我不为叙事完整性补成因** —— **成因未查清**，卡点在于「WB 的测试通道与我这条通道的差异点尚未定位」。
> - 可排除项（我这侧）：非管理员权限（`net session` → NOT-admin）、非开发者模式（已开）。
> - **待老大/WB 裁**：是通道差异（进程令牌/完整性级别）、还是两次实测之间的环境变化。**若采纳我的结论**，则 :280 的 `~/.npmrc` 固化 `node-linker=hoisted` **不需要做**（我未做，`~/.npmrc` 仍只有 registry 一行）。

---

### 2. 任务 A：重建 harness 依赖树 —— ✅ 5 条判据全过

**装法**：`cd D:\Code\LarryAgent\harness && pnpm install`（**(a)**，未加任何自定义参数）

**install 原始输出（尾段）**：
```
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 24m ago)
[WARN] 1 deprecated subdependencies found: node-domexception@1.0.0
Packages: +544
dependencies:
+ @deepseek-ai/dsh 0.1.5-rc.2
+ @deepseek-ai/dsh-sdk-client 0.1.5-rc.2
+ zod 4.6.5
Done in 10s using pnpm v11.7.0
EXIT=0
```

**逐条判据**：

| # | 判据 | 实测输出 | 判定 |
|---|---|---|---|
| A1 | `require.resolve` 解析成功 | `D:\Code\LarryAgent\harness\node_modules\.pnpm\@deepseek-ai+dsh@0.1.5-rc.2_0351730208d964c7e3b3400f4e092bdd\node_modules\@deepseek-ai\dsh\package.json`（EXIT=0） | ✅ |
| A2 | dsh 版本 = `0.1.5-rc.2` | `node -e "...version"` → `0.1.5-rc.2`；`dsh-sdk-client` 亦 `0.1.5-rc.2` | ✅ |
| A3 | 顶层**空壳目录数 = 0** | 自写检测器（判据同派发稿）：`{"topLevelNonDot":5,"symlinks":3,"realDirs":2,"plainFiles":0,"emptyShellDirs":0,"shells":[]}` | ✅ |
| A4 | `pnpm run test:isolated` 通过且**进程自退出** | `✓ tests/guard.test.ts (1 test) 4ms` / `Tests 1 passed (1)` / `EXIT=0` / **`ELAPSED=2s`**（外层 `timeout 180` 未触发，非 124） | ✅ |
| A5 | 三条哨兵同上（自退出） | 三条**均 `ELAPSED=2s`**、无 124（结论按 §3 口径，非字面"三条全绿"） | ✅ |

**假绿排查（派发稿"三个坑"）**：
- 坑 2「假绿」：**已按判据实测**，非以 install 输出当验收 —— A1 用 `require.resolve`、A3 逐条目 `lstat` 判"目录在 + 无 `package.json` + 非链接"。结果 **0 空壳**。
- 坑 3「状态缓存不自愈」：起点 `node_modules` 为 **空目录（entries=0）**、无 `.modules.yaml` / `.pnpm-workspace-state-v1.json` 残留，故未触发；未出现 `Already up to date`。
- 坑 1「`pnpm run` 自动 install」：走 (a) 默认布局，自动 install 不带参数亦为同一布局 ⇒ 无危害；四条测试跑完后树仍完好（A1/A3 复验通过）。

**结构与 CVM 一致性**（(a) 的期望形态）：
```
D:\Code\LarryAgent\harness\node_modules 的目录
2026/09/17  00:09    <SYMLINKD>     typescript [.pnpm\typescript@6.0.3\node_modules\typescript]
2026/09/17  00:09    <SYMLINKD>     vitest [.pnpm\vitest@5.0.1_@opentelemetry_...\node_modules\vitest]
2026/09/17  00:09    <SYMLINKD>     zod [.pnpm\zod@4.6.5\node_modules\zod]
（@deepseek-ai/dsh、dsh-sdk-client 同为 <SYMLINKD>）
```
`.modules.yaml` 实证：`"nodeLinker": "isolated"`。⇒ **未走 hoisted，未污染 `~/.npmrc`、未改 `harness/pnpm-workspace.yaml`**。

**lockfile 未被改动**：`wc -c` 前后均 **547,540 B**；harness 下 `git status --porcelain` 为空。

**真实库零触碰**（护栏⑤）：`stat .dsh-home` → `mtime=2026-09-09 10:31:40`（与历史记载一致，未变）。

---

### 3. 验收口径订正：两条哨兵**本来就该红**（不是失败）

派发稿 §6 把 `test:isolated:sentinel` / `-unset` 与 `test:isolated` 并列要求"同上（通过）"。**按源码与项目既有口径，这两条是负向哨兵、期望值就是 FAIL**，我实测与其完全吻合：

| 脚本 | 实测 EXIT | 实测现象 | 规范期望 | 出处 |
|---|---|---|---|---|
| `test:isolated` | 0 | `✓ guard.test.ts` 1 passed | 绿 | 哨兵 1「隔离生效」 |
| `test:isolated:sentinel` | **1** | `[test-isolation] FAIL: DSH_HOME 解析为 D:\Code\LarryAgent\.dsh-home，不在临时根 D:\Temp\Sys 下`（守卫 `isolated-setup.ts:56` throw） | **红（护栏在）** | `archive/roadmap-history.md:498` 原文 `# 哨兵：红（护栏在）`；`.workbuddy/memory/2026-09-09.md:232`「哨兵 → **fail**，且失败原因正是守卫拦截」 |
| `test:isolated:sentinel-key` | 0 | `✓ sentinel-key-residue.test.ts` + `⚠️ KEY RESIDUE: … creds.txt` | 绿 + 告警 | `roadmap-history.md:500`「R1 反向哨兵：绿 + teardown 告警」 |
| `test:isolated:sentinel-unset` | **1** | `[test-isolation] FAIL: DSH_HOME 解析为 D:\Code\LarryAgent\harness，不在临时根 D:\Temp\Sys 下`（delete env ⇒ `resolve('')` = cwd） | **红（unset 被拦）** | `roadmap-history.md:499`「R2 反向哨兵：红（unset 被拦）」 |

**判定**：**四条全部符合规范期望**，且**四条进程均自退出**（各 2 s，未触发 180 s 外层 timeout）。**建议派发稿措辞订正**为"`test:isolated` 绿；`sentinel`/`-unset` 红且红因须是守卫 throw；`sentinel-key` 绿 + `KEY RESIDUE` 告警"，避免后续复验者按字面把红哨兵当失败。

---

### 4. 任务 B：`.dsh-home/profiles/{larry,sdk}` 升 015 —— ✅ 3 条判据全过

**改动**：只替换版本号，composition 逐字节未动 —— 与修前基线（`D:\Code\_bak-local015\DREPO_.dsh-home_profiles_*_package.json`）逐行 diff：

```
--- larry 基线 +++ 现状        @@ -2,8 +2,8 @@
-    "@deepseek-ai/dsh-base": "0.1.2-rc.1",
-    "@deepseek-ai/dsh-headless": "0.1.2-rc.1",
+    "@deepseek-ai/dsh-base": "0.1.5-rc.2",
+    "@deepseek-ai/dsh-headless": "0.1.5-rc.2",
（`@larryagent/plugin-probe: link:D:/Code/LarryAgent/harness/packages/plugin-probe` 原样保留）
--- sdk 基线 +++ 现状          @@ -2,8 +2,8 @@
-    "@deepseek-ai/dsh-base": "0.1.2-rc.1",
-    "@deepseek-ai/dsh-sdk-app": "0.1.2-rc.1"
+    "@deepseek-ai/dsh-base": "0.1.5-rc.2",
+    "@deepseek-ai/dsh-sdk-app": "0.1.5-rc.2"
（`dsh.profile.bundles` / `patchReload` 未动）
```
⇒ 两个 diff **各只有 2 行变化**，即"只改版本号，不改 composition"成立。

**install**：两个 profile 各自 `pnpm install` → 均 `Packages: +243` / `Done in ~7s` / **EXIT=0**（`pnpm-workspace.yaml` 自带 `nodeLinker: hoisted` + `autoInstallPeers: false`，照用未改）。

**逐条判据**：

| # | 判据 | 实测输出 | 判定 |
|---|---|---|---|
| B1 | 两个 profile 的 `dsh-base` = `0.1.5-rc.2` | `larry: dsh-base=version:0.1.5-rc.2` / `sdk: dsh-base=version:0.1.5-rc.2` | ✅ |
| B2 | 两个 profile 的 `pnpm-lock.yaml` 中 `0.1.2-rc.1` = **0** 次 | `larry: lock012_occurrences=0` / `sdk: lock012_occurrences=0`（`grep -o … \| wc -l`） | ✅ |
| B3 | 两条 `dsh --profile X --help` 均正常返回 | 见 §5 —— **需显式设 `DSH_HOME`**，设后两条均 **EXIT=0** | ✅（附条件） |

> `.dsh-home/` 被 `.gitignore:29` 排除 ⇒ 这两处改动**不入仓库**（与派发稿 §5 注一致）。

---

### 5. 途中波折：`--profile larry --help` 静默挂死 ⇒ 定性为**漏设 `DSH_HOME`**（非 015 缺陷）

**现象**：首次按派发稿 §5 执行时，`dsh --profile sdk --help` 正常，但 **`dsh --profile larry --help` 零输出且永不返回**（`timeout 25` → EXIT=124）。`--task hello`、无参调用、`< /dev/null`、`DEBUG='*'` **四种变体全部零输出挂死**。

**定位过程**：① `--dump-config` 正常（332 行，属外层 dsh 拦截、不 boot）；② 全局 `~/.dsh/profiles` 的 mtime 变成 **00:11**（正是我运行时刻）⇒ 反推 dsh 用的是**全局 home** 而非仓库 `.dsh-home`；③ 核对全局 `~/.dsh/profiles/larry/package.json`：`dependencies: {}` + `bundles: ["@deepseek-ai/dsh-base"]` —— **只声明 dsh-base、没有 app 层** ⇒ 无 app 可 boot ⇒ 静默挂死。

**修正后实测**（`export DSH_HOME='D:\Code\LarryAgent\.dsh-home'`）：
```
=== [with DSH_HOME] dsh --profile larry --help ===
EXIT=0
[B1-PROBE] external bundle loaded by cordis (tag=v1)
Usage: dsh --profile headless [options] [task...]
Answer one task, stream reasoning to stderr, print the final assistant message,
and exit.
```
⇒ 正是 `docs/local-env.md:315` / `:373` 记载的**零成本断言**（`[B1-PROBE] external bundle loaded by cordis (tag=v1)`）。`--dump-config` 亦确认 `larry-probe` 插行在、`hmr` 行 `disabled: false`（larry 的 patch 已生效）。

`export DSH_HOME='D:\Code\LarryAgent\.dsh-home'` 后：
```
=== dsh --profile sdk --help ===
EXIT=0
Usage: dsh --profile sdk [options]
Serve DeepSeek Harness SDK clients over stdio JSON-RPC.
```

**副产品订正**：首次运行时 `sdk --help` 打出的 `[015PROBE] …` 诊断，**来自全局 `~/.dsh/profiles/sdk` 的 `plugin-015-preset-probe`**（该 profile 的 deps 里带此 link），**不是**仓库 profile 的输出 —— 仓库 sdk profile 只挂 dsh-base + dsh-sdk-app，`--help` 输出干净。

**5.3 未撞启动锁**：按 `local-env.md` §1/§2 核对 —— 两处 profiles 目录下**均无 `node_modules.lock` 残留**（含 `.bak.*`），本次未出现锁超时。

**5.4 我的误用对全局 home 的副作用（如实登记）**：那几条未设 `DSH_HOME` 的命令在全局 `~/.dsh` 触发了一次 heal，实际写入仅：
- 新建**两个空目录**：`~/.dsh/profiles/larry/node_modules/`（空）、`~/.dsh/profiles/larry/.dsh-module-fallback/node_modules/`（空），mtime 00:11
- `~/.dsh/profiles/node_modules/@deepseek-ai` 目录 mtime 被 touch（内部符号链接仍是 09-11 指向 npm 全局 dsh = `0.1.5-rc.2`，未换目标）
- `~/.dsh/profiles/larry/package.json` **未变**（mtime 仍 09-10 14:47），`cordis.yml` 内容未变
⇒ 无内容性破坏，**未回滚**（回滚反而可能弄坏一个本来正常的 profile）。**若老大认为不该留，我可以只删那两个空目录。**

---

### 6. 任务 C：与本机 lockfile 一致性核实 —— 差异**仅 1 行**，成因闭环

**方法**：SSH 取 CVM `~/harness/pnpm-lock.yaml` 摘要 + `scp` 一份副本到 `D:\Temp\cvm-harness-pnpm-lock.yaml`（**只读副本，未覆盖任一侧**），与本机逐行 `diff`。

| 指标 | 本机 `harness/pnpm-lock.yaml` | CVM `~/harness/pnpm-lock.yaml` | 同否 |
|---|---|---|---|
| size | 547,540 B | 547,500 B | ✗（差 40 B） |
| sha256 | `02510f76…1831` | `9a4e0b99…d61e` | ✗ |
| `lockfileVersion` | `9.0` | `9.0` | ✅ |
| `0.1.5-rc.2` 出现次数 | **4923** | **4923** | ✅ |
| `0.1.2-rc.1` 出现次数 | **0** | **0** | ✅ |
| `packages:` 条目 | 637 | 637 | ✅ |
| `snapshots:` 条目 | 639 | 639 | ✅ |
| `importers:` 条目 | **7** | **6** | ✗（差 1） |
| 关键解析 | `dsh@0.1.5-rc.2(035173…)` / `dsh-sdk-client@0.1.5-rc.2(3bcb32…)` / `zod@4.6.5` / `vitest@5.0.1(…)` / `typescript@6.0.3` | 同左（逐字节） | ✅ |

**diff 全文（`grep -c '^@@'` = 1，唯一 hunk）**：
```
@@ -28,8 +28,6 @@
         specifier: ^5.0.0
         version: 5.0.1(@opentelemetry/api@1.9.1)(@types/node@22.20.2)(vite@8.3.0(@types/node@22.20.2)(yaml@2.9.1))
 
-  packages/plugin-015-preset-probe: {}
-
   packages/plugin-probe:
     dependencies:
       '@deepseek-ai/cordis':
```
⇒ **除该 2 行外两侧逐字节相同**；size 差的 40 B 与 importers 差的 1 正是这两行。

**成因闭环**：
- 本机 `harness/pnpm-workspace.yaml` = `packages: [- packages/*]`；本机 `harness/packages/plugin-015-preset-probe/` **存在**（`package.json` / `index.js` 19543 B / `cordis.patch.yml`），**且三个文件都在 git 跟踪内**（引入于提交 `8aee09b`，**2026-09-15**）⇒ 本机 `pnpm install` 把它计为一个（无依赖的）空 importer。
- CVM `~/harness/packages/` **无此目录**（`ls: cannot access '…/plugin-015-preset-probe/': No such file or directory`；`packages/` mtime = **09-14 17:03**）⇒ CVM lockfile 无该 importer。
- ⇒ 差异**不涉及任何依赖解析分歧**，纯属"CVM 尚未同步到 `8aee09b` 之后的仓库状态"，与已知的"两边代码已分叉"同源。

**回报口径**：**只回报差异、未自行覆盖任一侧**（本机文件未动：改动前 547,540 B / sha256 `02510f76…1831`）。

---

### 7. 收尾：`git status --porcelain` 逐条解释

```
（输出为空）
```
**解释：无任何条目** —— 本次任务**未触碰任何受控文件**：
- 任务 A 只写入 `harness/node_modules/`（gitignore）
- 任务 B 只写入 `.dsh-home/profiles/{larry,sdk}/`（`.gitignore:29` 排除；其 `package.json` 亦不在版本控制内）
- `harness/package.json`、`harness/pnpm-lock.yaml` 已由老大在提交 `a974258` 中完成 015 化，我**未改**（install 后 size 不变、`git diff` 为空）
⇒ 派发稿 §6 预期"逐条解释哪些是必要改动"，实测是**零条目**：受控侧的必要改动已在派发前落定。

---

### 8. 红线遵守情况

| # | 红线 | 状态 |
|---|---|---|
| 1 | 不碰任何 `.credentials.yaml` | ✅ 未读取、未修改任何路径下的凭据文件 |
| 2 | 不改 `harness/pnpm-workspace.yaml`、`harness/package.json` | ✅ 均未改（`git status` 为空） |
| 3 | 不删 `harness/pnpm-lock.yaml` | ✅ 未删未改（547,540 B 恒定） |
| 4 | 不动 CVM 的 `~/.dsh/profiles/larry` | ✅ CVM 侧仅只读（`ls`/`wc`/`sha256sum`/`scp` 下行），**未写入** |
| 5 | 不擅自 `git commit` | ✅ **本单未产生任何 commit**，改动留在工作区/忽略区，待 WB 复验 |

---

### 9. 待办 / 待裁

| # | 事项 | 归属 |
|---|---|---|
| 1 | §1 矛盾：WB 记「本机建不出真 symlink」vs 我实测「四路径全可建」⇒ :280 的 `~/.npmrc` hoisted 固化**是否还需要**、:281「本机 hoisted ↔ CVM isolated」推论**是否作废** | **老大/WB 裁** |
| 2 | §3 派发稿 §6 验收措辞订正（两条负向哨兵应判"红且红因=守卫 throw"） | WB（出稿方） |
| 3 | §6 CVM `~/harness` 缺 `packages/plugin-015-preset-probe/`（09-14 后未同步）⇒ 是否随下次整树同步补齐 | 老大/Trae |
| 4 | `TODO.md` DSH-3.1 前置段对应条目打勾 | 已由我打勾（老大已临时授权），见下 |
| 5 | §5.4 全局 home 的两个空 `node_modules` 目录是否清理 | 老大（我倾向留着，无害） |
| 6 | `local-env.md` §4.3.1 记「实测整体仍是 0.1.2-rc.1」现已过时（本机 harness + 工程 home 均已 015） | WB（文档主笔） |

**TODO.md 产物**：已将 :277「📮 剩余两项已派发 Qoder」标记为 ✅ 已回报（附指向本段落），未改动 WB 的其余记载。

**临时文件**（均在 `D:\Temp`，可随时删）：`symchk.bat`/`symchk-clean.bat`（自检）、`taskA-install.log`、`taskA-test:isolated*.log`（4 条测试原始输出）、`check-shells.mjs`（空壳检测器）、`taskB-{larry,sdk}-install.log`、`larry-*.log`/`sdk-help-repohome.log`（DSH_HOME 定位过程）、`cvm-harness-pnpm-lock.yaml` + `lockdiff.txt`（任务 C）。

---

## 2026-09-16 · 精简候选摸底（老大指令「跑一次精简候选摸底」）

**方法**：全仓 md 文件行数统计 + 关键文件头部状态核查 + 引用面扫描。聚焦 exchange/ 讨论稿（最易积压区）与 docs/ 大型文档。

### 高置信建议（4 项，按动作成本排序）

**S1. `exchange/deployment-architecture.md` (191 行) → archive/**
- 状态明确：「方案（待DSH迁移完成后重新制定）」，DSH-3 进行中，短期不会完
- 留在 exchange（活区）误导读者以为是活跃方案
- 建议动作：`git mv` 到 `archive/deployment-architecture-2026-09-03.md`，更新 exchange/README + 根 README :185 + TODO :290 引用

**S2. `exchange/capability-tree-revision.md` (250 行) — 7/8 已批但未执行**
- 老大 2026-09-15 已批 7/8 提案（仅 2.5.2 web_fetch 暂缓）
- grep `docs/product-positioning.md` 无引用 → 变更未落地
- 建议动作：拍板是让 WB 执行已批部分并归档/删除此稿，还是继续等待

**S3. `exchange/web-search-design.md` (394 行) — 17 天未展开讨论**
- 生成 2026-08-29，内容详尽（provider 对比/MCP 集成/延迟数据）
- exchange/README 标记「尚未展开讨论」
- 建议动作：确认是等待审阅还是已放弃？若放弃 → archive；若等待 → 标注状态

**S4. `exchange/discussion-time-context.md` (531 行) — 卡在看齐循环 13 天**
- 状态：「待各方对更新后的结论区表态『同意/有异议』」，自 2026-09-03
- 531 行详尽讨论，无 AI 签字确认
- 建议动作：推动签字并移入 docs/，或归档讨论、只提取结论到 docs/

### 中置信观察（2 项，仅备注）

- `docs/dsh/` 探针报告三份（claude/qoder/trae, ~525 行）：按设计拆分（不同 AI 视角），可保持现状，除非想统一视角
- `exchange/log-workbuddy.md` (155+ 行)：WB 活日志，按「不留痕」原则可清理，但 WB 自管

### 不建议动

- 三份环境文档（production/test/local-env，按设计对仗拆分）
- `archive/roadmap-history.md`（锁定区历史）
- AI 约束文件（.claude/.trae/.qoder，按角色拆分）
- exchange/logs（活日志，由老大按需清理）

**待老大裁决汇总**：S1（归档）→ S2（执行或继续等）→ S3/S4（状态澄清）→ S5/S6（备知）。

**老大结论（2026-09-16）**：都不是大问题，文档体系基本健康。四个候选项均为锦上添花级别，不急。

---

## 2026-09-16 · 本地环境 012 残留扫描（老大单独交办，职责之外）

**背景**：项目已将 DSH 版本基线从 0.1.2 更换到 0.1.5（DSH-3 开始前拍定），现处于 DSH-3.1 阶段。老大要求检查本地环境是否仍存在 012 相关代码/运行时产物。

**方法**：磁盘实况核实——npm 全局版本、`.dsh-home/` 与 `~/.dsh/` 两套 profiles 的 package.json 声明 + node_modules 实际安装版本、`harness/` 与 `client/` 代码层 grep、源码工作树 tag 确认。

### 🔴 代码层残留（`harness/`）

| 位置 | 内容 | 性质 |
|------|------|------|
| `harness/package.json` :26-27 | `"@deepseek-ai/dsh": "0.1.2-rc.1"` + `"@deepseek-ai/dsh-sdk-client": "0.1.2-rc.1"` | **依赖硬编码**（根因） |
| `harness/pnpm-lock.yaml` | 整个锁文件都是 012（含所有传递依赖） | 锁文件跟随 |
| `harness/tests/real-api.ts` :69 | 注释引用 `dsh-v0.1.2-rc.1` | 信息性 |
| `harness/packages/plugin-sandbox-probe/src/index.ts` :80 | 注释引用 `dsh-v0.1.2-rc.1` | 信息性 |

### 🔴 运行时残留（工程 home `.dsh-home/`）— 全量 012

| Profile | package.json 声明 | node_modules 实况 |
|---------|------------------|-----------------|
| `larry` | `dsh-base@0.1.2-rc.1` + `dsh-headless@0.1.2-rc.1` | `dsh-base` = **0.1.2-rc.1** |
| `sdk` | `dsh-base@0.1.2-rc.1` + `dsh-sdk-app@0.1.2-rc.1` | `dsh-base` = **0.1.2-rc.1** |

### 🔴 全局工具残留

| 项 | 值 |
|----|----|
| npm global | `@deepseek-ai/dsh@0.1.2-rc.1` |
| `D:\Code\dsh-src` 源码工作树 | tag = `dsh-v0.1.2-rc.1`（仍挂载） |

### 🟢 已升 015

| 位置 | 版本 |
|------|------|
| `~/.dsh/profiles/sdk` | `dsh-base@0.1.5-rc.2` + `dsh-sdk-app@0.1.5-rc.2` |
| `~/.dsh/profiles/larry` | 空依赖、1 bundle（无 012 钉死） |
| `~/.dsh/profiles/web` | 空依赖、2 bundles（无 012 钉死） |

### 🟢 无 012 残留

| 区域 | 012 引用数 |
|------|----------|
| `client/` | 0 |
| `backend/` | 0（Python 项目，不涉及 dsh npm 包） |

### 结论

`harness/package.json` 是根因——dsh 和 dsh-sdk-client 钉死在 0.1.2-rc.1，`pnpm-lock.yaml` 锁住全量 012 传递依赖，工程 home 的 profiles 从这个锁构建，所以整个运行时链路都是 012。local-env.md §4.3.1 "实测整体仍是 0.1.2-rc.1" 与磁盘实况一致。

两套 home 的分化：
- **工程 home**（`.dsh-home/`）= 全量 012（项目实际运行环境）
- **全局 home**（`~/.dsh/`）= sdk 已升 015，larry/web 无版本钉死

---

## 2026-09-16 · WSL 环境 012 残留扫描（续前，老大指令「检查 WSL 环境」）

**背景**：同 Windows 侧扫描，检查 WSL 环境是否仍存在 012 相关产物。

**方法**：`wsl.exe -d Ubuntu-24.04` 进入后 source nvm，显式 PATH 避免 §6.2 的 Windows 互操作污染，逐项核实。

### 🟢 WSL 无 012 残留

| 检查项 | 结果 |
|---------|------|
| Node | v22.23.2（nvm，WSL 原生） |
| npm global dsh | **(empty)** — 未安装 |
| `dsh` CLI | **不存在** |
| `~/.dsh/` | **不存在** — 无任何 DSH profiles |
| `~/work/LarryAgent` | **不存在** — WSL 内无仓库副本 |

### ℹ️ 通过 /mnt/d 可见但属 Windows 侧

| 检查项 | 结果 |
|---------|------|
| `/mnt/d/Code/LarryAgent/harness/node_modules/@deepseek-ai/dsh` | `0.1.2-rc.1` — Windows 侧产物，9p 挂载可见，非 WSL 原生 |

### 📁 残留探测目录（test-env.md §9 已记录）

- `~/claude-probe`、`~/sqlite-check`、`~/trae-probe` — 2026-09-12 探测产物，非 012 相关

### 结论

**WSL 环境完全干净**，无任何 012 残留。这与 test-env.md §10「DSH-3 期间不参与」（老大 2026-09-14 拍定）一致——WSL 从未安装过 DSH，所以也不存在版本升级问题。

通过 `/mnt/d` 9p 挂载可以访问 Windows 侧的 harness（0.1.2-rc.1），但那是 Windows 侧的残留，不属于 WSL 环境本身。

### 综合两份扫描

| 环境 | 012 残留 |
|------|--------|
| Windows 本机 | 🔴 harness 代码层 + 工程 home + npm global + 源码工作树 |
| WSL | 🟢 无 |
| 全局 home (`~/.dsh/`) | 🟡 sdk 已升 015，larry/web 无版本钉死 |

---

## 2026-09-16 · CVM 环境 012 残留扫描（续前，老大指令「CVM 那边同样检查」）

**背景**：同 Windows/WSL 扫描。CVM 近期经 DSH-3.0.1 → 3.0.5 密集推进（Trae 执行、WB 复核），部分已升 015。参考 TODO.md DSH-3.0 段、.workbuddy/memory/2026-09-16.md、exchange/log-trae.md。

**方法**：SSH 直连（`ubuntu@49.232.129.252`，密钥 `~/.ssh/id_ed25519_cvm`），逐项核实。

### 🟢 已升 015

| 位置 | 版本 | 备注 |
|------|------|------|
| `~/harness/package.json` | `dsh@0.1.5-rc.2` + `dsh-sdk-client@0.1.5-rc.2` | ⭐ **CVM 侧已独立升级**，与本机 harness（仍 012）不同 |
| `~/harness/pnpm-lock.yaml` | lockfile 全 015 | `@deepseek-ai/dsh@0.1.5-rc.2` |
| `~/harness/node_modules/.pnpm/@deepseek-ai+dsh` | `0.1.5-rc.2` | 实际安装 |
| `~/harness/node_modules/.pnpm/@deepseek-ai+dsh-app-boot` | `0.1.5-rc.2` | boot 层已升（WB 曾报为 012） |
| `~/.dsh/profiles/sdk` | deps 5 项全 `0.1.5-rc.2`（109 包） | DSH-3.0.4 收口 |

### 🔴 012 残留

| 位置 | 版本 | 备注 |
|------|------|------|
| `~/.dsh/profiles/larry` | `dsh-api-gateway@0.1.2-rc.1` + `dsh-host-webserver@0.1.2-rc.1` | composition 与本机不同（本机 = base + headless） |
| `~/larry-dsh-home/profiles/sdk` | `dsh-base@0.1.2-rc.1` + `dsh-sdk-app@0.1.2-rc.1` + `dsh-storage-sqlite@0.1.2-rc.1` | 旧 home，仍活跃 |

### ℹ️ 存档物（非活跃，不影响运行）

| 位置 | 性质 |
|------|------|
| `~/harness/pnpm-lock.yaml.frozen-012` | 012 lockfile 冻结备份，留痕用 |

### 🟡 空壳（bundles 声明但无 deps，无版本钉死）

| Profile | bundles |
|---------|--------|
| `~/.dsh/profiles/web` | dsh-base + dsh-web-app |
| `~/.dsh/profiles/acp` | dsh-base + dsh-acp-app |

### 未装

| 项 | 状态 |
|----|------|
| npm global dsh | 未安装 |
| DSH CLI（~/node/bin/dsh） | 不存在 |

### 结论

CVM 处于**半升级状态**：
- `~/harness/` 代码层 + `~/.dsh/profiles/sdk` 已升 015（DSH-3.0.4 收口）
- `~/.dsh/profiles/larry` 仍是 012（TODO.md :72 已登记，「larry profile 在 CVM 的 composition 与本机不同」，3.5/3.7 待办）
- `~/larry-dsh-home/` 旧 home 全量 012（production-env.md §12.5 已标为「负向对照器材，不是运行 home」）
- 与本机关键差异：**CVM harness 已升 015，本机 harness 仍是 012**

### 三环境总表

| 环境 | 012 残留情况 |
|------|------------|
| **Windows 本机** | 🔴 harness 代码层 + 工程 home + npm global + 源码工作树 |
| **WSL** | 🟢 无 |
| **CVM** | 🟡 harness 已升 015，sdk profile 已升 015；larry profile + larry-dsh-home 仍 012 |
| **全局 home (`~/.dsh/`)** | 🟡 sdk 已升 015，larry/web 无版本钉死 |

### 半升级状态判定：正常

CVM 的 012 残留**与 DSH-3.0 交付范围精确匹配**，未升级项各有明确归属：

| 交付项（DSH-3.0） | CVM 状态 |
|-------------------|--------|
| `~/harness/` 代码层 | ✅ 015 |
| `~/.dsh/profiles/sdk` | ✅ 015（5 deps，109 包） |
| `~/.dsh/.credentials.yaml` | ✅ D1 证成 |
| boot 层（dsh-app-boot） | ✅ 015 |

| 012 残留项 | 归属 | 出处 |
|-----------|------|------|
| `~/.dsh/profiles/larry` | **3.5/3.7**（gateway + web server），非 3.0 范围 | TODO.md :72 已登记 |
| `~/larry-dsh-home/` | 设计为「负向对照器材」 | production-env.md §12.5 |
| `pnpm-lock.yaml.frozen-012` | 冻结备份，留痕 | 归档物 |

**⚠️ 一个待决点**：CVM `~/harness/package.json` 已升 015，但本机 `harness/package.json` 仍为 012——两边代码已分叉。这可能是有意为之（CVM 先行验证、本机作对照），也可能是还没来得及回同步。待老大决定是否/何时将 CVM 侧改动回传本地仓库。
