# 本机（Windows）环境 — 事实、边界与已知坑

> **定位**：本项目**本机 Windows 侧**环境事实与坑的**唯一真相源**。本机同时担任**三种角色**，读本文档先分清是哪一种：
>
> | 角色 | 含义 | 对应章节 |
> |---|---|---|
> | ① **开发环境** | 全部代码（`harness/` / `client/` / `backend/`）在此编写与构建；**Windows 侧特有行为只能在此实测** | §4、§8、§10 |
> | ② **C 侧（client / PC 版）测试环境** | PC 版为 C/S —— **client 在本机、不上云** ⇒ 客户端集成（Tauri IPC → node → DSH）只能在 Windows 侧验证 | §9 |
> | ③ **PC 侧生产使用环境** | PC 版最终跑在**真实用户的 Windows** 上，本机即首个真实使用环境 ⇒ 本机暴露的 Windows 特有缺陷 = **产品缺陷**，不是环境怪癖 | §11 |
>
> **环境文档三者对仗**（同置 `docs/` 顶层，2026-09-12 起）：`production-env.md` 管**生产 / CVM**（server 侧）、`test-env.md` 管**测试 / WSL**（Linux 实验场）、本文档管**本机 Windows**。
> 跨 AI 共享的本地环境事实一律放此，交流区 / TODO / AI 记忆只留指针。
> **效力**：`TODO.md`、交流区、AI 记忆**只保留指向本文档的指针**，不复制内容。
> **边界**：其中属 **DSH 迁移专题**的部分（通信面定型、B 段路线判定）以 `dsh/dsh-migration.md` 为准，本文档只记**环境侧事实与复跑依据**。
> 全部为 🟢 实测或源码级确认；除 §11 明确标注为**推论**外，DSH 相关章节基线为 `dsh-v0.1.2-rc.1`。
>
> ⚠️ **代际状态更新（2026-09-17）**：上面这句声明的是**下文各节判据的验证基准年代**（保留不动）。但**本机环境本身已全面升到 `0.1.5-rc.2`**，四处同代 —— ① `harness/` 装置侧（`package.json` ＋ lockfile ＋ `node_modules`，isolated 布局）② npm 全局 CLI（`%APPDATA%\npm`）③ 工程 home `.dsh-home/profiles/{larry,sdk}` ④ 主 `~/.dsh` 回退层。
> ⇒ 读下文时**分清两件事**：**「012」是判据的出处年代，不是本机现状**；凡写「本机仍锁 `0.1.2-rc.1`」或给 `npm i -g @deepseek-ai/dsh@0.1.2-rc.1` 复跑命令的段落（§8.1 表 ＋ 复核注／§8.3／§9.2），**均为 09-09~09-11 的历史记录**，现状以本行为准。**基线迁移的环境事实**见 §4.3.1 末；**015 未复核的章节**不得据"已升级"外推（`confine()` 运行时行为仍属未验）。
> ⚠️ **本机 symlink 事项（2026-09-17 订正）**：曾记「本机建不出真符号链接、pnpm isolated 装不出链接层」—— **已推翻**（`os.symlink` 抛 `WinError 2` 但链接真实建成，`reparse tag = 0xa000000c`；isolated 装法实测可用）。判据细节见 `TODO.md` DSH-3.1 前置段。

---

## 1. profile 启动锁（会卡死所有 dsh 命令）

**现象**：任何 dsh 命令启动即失败，报

```
Error: atomic-write: timed out waiting for the writer lock at C:\Users\SuLarry\.dsh\profiles\node_modules.lock
    at withFileLock (...dsh-atomic-write/lib/index.js:136)
    at async healProfilesModuleFallback (...dsh-app-boot/lib/index.js:662)
```

**机制**（🟢 源码 `dsh-atomic-write/lib/index.js`）：
- 锁是 `wx` 排他创建的兄弟文件 `<filename>.lock`，内容 = 持有者 PID
- 默认 `DEFAULT_LOCK_WAIT_MS = 2e3` → **只等 2 秒**就抛超时
- 源码注释明写：**「The contender never removes an existing lock because file age cannot prove that its owner stopped; orphan recovery is an operator action.」** → **孤儿锁永远不会自动回收**

**判定与处理**（照做，别靠猜）：
1. `cat <lock>` 取 PID → 与 `tasklist | grep node.exe` 比对
2. PID 不在活进程里 = **死 PID 残留锁** → 可安全清理
3. 清理方式：**重命名备份，不删除**（dsh 自己就是这么做的，目录下已存在 `node_modules.lock.bak.<ts>` 先例）：
   ```
   mv node_modules.lock node_modules.lock.bak.$(date +%s)
   ```

⚠️ **不要**据此写"dsh 有 bug"——这是设计选择（宁可失败也不误删别人的锁）。**运维动作**才是正确归属。

---

## 2. `--patch` 引本地路径包会触发 heal → 撞上面那把锁

**现象**：`dsh --profile larry --patch ./packages/<pkg>/cordis.patch.yml` 启动即锁超时。〔2026-09-17：`larry` 面已退役；**该现象与 profile 名无关**，换任一自建 profile 同样适用〕

**原因**：本地路径包不在 profile 的 `node_modules` 里 → boot 时 `healProfilesModuleFallback` 试图 pnpm install → 争锁（见 §1）。

**正确处理**：本地包须**先装进 profile node_modules**，再 boot：
```
dsh plugin --profile <name> add <本地包路径>
... 跑 ...
dsh plugin --profile <name> remove <包名>
```
（`dsh plugin` 是转发给 pnpm，在 profile 目录执行；`--patch` **只适合**覆盖已装包的 patch 层。）

**替代（复验推荐，零侵入）**：不 boot profile，直接 spawn 被测二进制（见 §3）。

---

## 3. windows-acl runner 直调格式（绕开 profile 的独立验证路径）

想验证沙箱而**不想动 profile / 不想撞锁**，可直接 spawn runner：

```
node <...>/dsh-sandbox-windows-acl/lib/runner.js \
  --workspace <已存在目录> --temp <目录> \
  --mode <read-only|workspace-write> \
  -- <可执行文件绝对路径> <args...>
```

⚠️ `--` 后**第一个必须是可执行文件**（如 node.exe 绝对路径）。传 `-e ...` 之类会报：

```
windows-acl-run: CreateProcessAsUserW failed (Win32 2): command: -e
```

（Win32 error 2 = 文件不存在。这不是沙箱缺陷，是调用姿势错。）

---

## 4. Windows 沙箱：**拒绝方言缺口**（🟢 源码 + 实测，影响模型可见性）

**契约**（🟢 `packages/sandbox/sandbox-local/src/index.ts:205-213`，tag `dsh-v0.1.2-rc.1`；**015 复核见 §4.3.1 —— 该表逐字节未变**）：

```js
const DENIAL_SIGNATURES = {
  bwrap:    ['read-only file system'],
  landlock: ['permission denied'],
  seatbelt: ['operation not permitted'],
  // pwsh/.NET: "Access to the path '...' is denied."; cmd: "Access is denied.";
  // node EACCES: "permission denied".
  'windows-acl': ['access is denied', 'access to the path', 'permission denied'],
  runnerCommand: ['read-only file system', 'permission denied'],
}
```

> 注：`denialSignatures` 由 **provider（sandbox-local）** 组装，**不是**后端（sandbox-windows-acl）声明的——后者 `lib/` 里一个相关字符串都没有。改方言要改 provider。

**实测缺口分两层**（两层都独立复现，务必分开记）：

| 层 | 现象 | 是否跨语言成立 |
|---|---|---|
| **① 本地化层** | 中文 Windows 下 cmd/powershell 输出中文，英文签名命中不了 | ❌ 仅非英文系统 |
| **② 错误码类别层** | **node 写失败报 `EPERM: operation not permitted`，而签名备的是 `permission denied`（那是 EACCES 的文案）** | ✅ **英文 Windows 同样不命中** |

实测三条（🟢 2026-09-10 WB 独立复现，`locale=zh-CN` `oemcp=936` `IsInRole(Administrator)=False`）：

| 子进程 | 实际 stderr | 命中三条签名 |
|---|---|---|
| node | `Error: EPERM: operation not permitted, open '…'` | ❌ |
| Windows PowerShell | `对路径"…"的访问被拒绝。` | ❌ |
| cmd（无引号重定向写法） | `拒绝访问。` | ❌ |

**影响面**：`denied=false` → 模型侧**只当普通命令失败**，既看不到 `[sandbox: file access denied]` 标记，也拿不到升权提示 → **沙箱拦住了，但拦住的信号传不出去**。

⚠️ **② 比 ① 更硬**：不要把它整体归因为"中文 Windows 的问题"，那是把跨语言的缺陷降级成了本地化问题。

⚠️ **① 的作用域（2026-09-11 订正）**：① 不是"某台机器有／没有"，而是**取决于跑 DSH 的那棵进程树**。本机 **OS 用户 UI 语言 = zh-CN**（`Get-WinUserLanguageList` / `HKCU\Control Panel\Desktop\MuiCached` / `HKLM\SYSTEM\…\Nls\Language\Default=0804` 三来源一致），普通终端起的树 `Get-UICulture=zh-CN`、console CP 936 ⇒ **① 默认就会触发**；但**进程树的 UI 文化可被上层应用覆盖**（实测：Trae 的终端树 `Get-UICulture=en-US` → 子进程回英文 → ① 不触发）。⇒ ① 是否触发取决于**从哪个终端启动 DSH**，我们控制不了 ⇒ 补丁**两种方言都留**（零成本）。别把 trae 树的 en-US 当成系统设置。

### 4.1 ⭐ 第 ③ 层：编码层（决定 ① 层能否生效，比 ① ② 都更前置）

**机制**（🟢 源码 `packages/subprocess/subprocess-local/src/spawn.ts:213/246`）：子进程输出**一律按 UTF-8 解码**（`Buffer.concat(chunks).toString('utf8')`）。

**官方自述**（🟢 `packages/shell/pwsh-local/src/index.ts:40-49` 注释逐字）：

> "The subprocess collector decodes output bytes as UTF-8, but Windows PowerShell 5.1 **writes the console/OEM code page by default, which garbles non-ASCII output**"

对应解法是 `ENCODING_PREAMBLE`（`[Console]::OutputEncoding = UTF8; …`），**钉在每个命令前面**。

**关键**：沙箱版 `pwsh-sandbox/src/index.ts:28` **复用** `PwshLocalExecutor`（即带 preamble）→ 真实链路下 PS 输出 **UTF-8 中文**，可被 utf8 正确解码 → **中文签名有效**。

**实测矩阵**（🟢 2026-09-10 WB，runner `--mode workspace-write`，同一命令仅变 preamble）：

| 场景 | stderr 真实编码 | 官方签名 | 含中文的签名 |
|---|---|---|---|
| 裸 spawn（探针姿势） | **GBK/OEM** → utf8 解码成乱码 | false | **false** ❌ |
| 带 preamble（真实链路姿势） | **UTF-8** | false | **true** ✅ |

→ **判据纪律**：验证 ① 层**必须带 preamble 跑**；用裸 `spawn` 会得到**假阴性**（看起来"中文签名没用"，实为探针姿势与真实链路不符）。这与 §7「判据必须取自真实运行时」同源。

**字节级复现（🟢 2026-09-11，模拟 console CP 936 区制，同一句中文仅变"有无前导"）**：

| 组 | stderr 前 11 字节 hex | 按 UTF-8 解码 | 中文签名 |
|---|---|---|---|
| 裸 spawn（继承 936，无前导） | `b6 d4 c2 b7 be b6 20 58 20 b5 c4` = **GBK** | 乱码 `��·�� X �ķ��…` | **false**（0 命中） |
| 真实链路（936 被前导覆盖为 UTF-8） | `e5 af b9 e8 b7 af e5 be 84 20 58` = **UTF-8** | `对路径 X 的访问被拒绝。` | **true**（命中 `访问被拒绝`） |

**探针纪律（补充）**：探针要**直接 `import` 官方 `ENCODING_PREAMBLE`**（`…/dsh-pwsh-local/lib/index.js:412` 有 export），**不要手抄**——手抄会随上游改动漂移，抄漏一个分号就能重造一次假阴性。源码位置：定义 `:158`、拼进 argv `:278`。此结论已由生产侧独立印证：profile 内 boot 取到的消费方 argv **确实带前导**（§4.3）。

⬛ **未测**：`--mode read-only` 下 PS 进入 ConstrainedLanguage，官方 README 提示 preamble 的 `[Console]::` 赋值**可能被拒**、非 ASCII 输出会退回主机代码页 → 该模式下 ① 层是否仍有效**未验**。

### 4.2 「一劳永逸解决编码」的四条路径（🟢 源码 + 实测，2026-09-10 WB）

老大提问：前置 preamble 这种事，有没有配置能一劳永逸？——**分层看，四条的结论完全不同。**

| 层 | 机制 | 有没有 | 结论 |
|---|---|---|---|
| **DSH** | 配置项覆盖 preamble | ❌ **无**（`ENCODING_PREAMBLE` 是 `export const`，与 `DENIAL_SIGNATURES` 同构，拼死在 `index.ts:220` 的 argv 里） | **不需要**：dsh 默认就给每条命令前置，我们这条链路已"自动一劳永逸" |
| **PowerShell** | `$PROFILE`（`profile.ps1`，四作用域含 AllUsers* 可全局下发） | ⚠️ **有但被禁用** | dsh 一律 `-NoProfile` 启动 → **profile 不加载**。⚠️ **用 `-NoProfile` 等于放弃所有 profile 级治理手段**，这条有普适价值 |
| **Windows 系统** | ① `HKCU\Console\CodePage=65001`（可按 host 子键）<br>② 系统级 UTF-8 Beta（`HKLM\...\Nls\CodePage\ACP=65001`）<br>③ 装 PowerShell 7 | ① 存在<br>② 存在<br>③ 存在 | ① **配置在受限令牌下可见**（实测：受限进程读到 `HKCU\Environment\TEMP`、`LocaleName=zh-CN`），但**能否影响被管道捕获的 PS 5.1 输出未实测** ⬛；副作用是本机所有新建控制台窗口<br>② 本机 `ACP=936`（未开）；**影响所有非 Unicode 老程序，不建议为这一件事开**<br>③ **最干净**：dsh 解析顺序 **PS7 优先**（`resolve.ts`：`$ProgramFiles\PowerShell\7\pwsh.exe` → PATH 中的 `pwsh` → 5.1 兜底），且官方注释明说 **"pwsh 7 defaults to UTF-8 and is unaffected"**。本机**尚未装 PS7** |
| **我们自己的代码** | 保留 buffer 做 UTF-8/GBK 双解 | ✅ | ⭐ **必做**：第三方收集器一旦 `toString('utf8')`，GBK 字节**不可逆**（变 U+FFFD，还原不回来）。将来我们自己 spawn 子进程，必须**留 buffer 再解码**，别直接吃 `text` |

**实测基线**（直连 / 受限两种跑法**逐值相同**）：`[Console]::OutputEncoding=936`、`ACP=936`、`HKCU` 可读、`HKCU\Console\CodePage` **未设置**、`locale=zh-CN`、`USERPROFILE` 正常。

→ **当前建议：什么都不用改**（dsh 自带 preamble 已生效）。把「装 PS7」记为**备用手段**——仅当 read-only 模式下 preamble 被 ConstrainedLanguage 拒、① 层失效时才需要它。

### 4.3 修复件：自做 provider 与其挂载范式（🟢 2026-09-11）

**修复件** = `harness/packages/plugin-sandbox-dialect/`：子类化官方 `sandbox-local` provider，在 `confine()` 返回的 `ConfinedArgv` 上**追加**缺失方言（`operation not permitted` + `拒绝访问` + `访问被拒绝`），**不动第三方源码**（上游升级不破）。仅 `win32` 且 `enforcement==='partial'` 时生效。

**挂载范式（要在 patch 层覆盖官方同名行时）**：

```yaml
- id: sandbox
  disabled: true          # 先禁用官方行
- insert:                 # 再插入我们的行
    - id: sandbox-dialect
      name: '@larryagent/plugin-sandbox-dialect'
```

三条实测定案（🟢 profile 内 boot 实测）：

| 问题 | 结论 |
|---|---|
| 能否用 `- id: sandbox` + `name:` **原地改名**？ | ❌ **不行** —— loader 的 id 定位**只覆盖 `config`，不改该行加载哪个包**（sandbox 行仍是官方包）。故必须 disable + insert |
| 新行 id **必须**叫 `sandbox` 吗？ | ✅ **不必** —— 消费方按**服务名**注入（`dsh-pwsh-sandbox` 声明 `static inject = ['subprocess','sandbox','sandboxPolicy']`），不是按 loader 行 id |
| 插件怎么进 profile？ | **实体复制**进 `$DSH_HOME/profiles/<profile>/node_modules/@larryagent/…`（**该 profile 自身那层**，2026-09-17 修订）；`link` 方式下 bare import 从源目录解析，**取不到** `@deepseek-ai/dsh-sandbox-local` |

**生效自检**：`dsh --profile <p> --dump-config` → 官方 sandbox 行**不会消失**，而是**保留 + `disabled: true`**，末尾多出 `sandbox-dialect` 行。⚠️ **别拿"行消失"当判据**（会误判成未生效）。

**挂载层文件**：`harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml`（生产用，内容即上面两段）；`*.verify.patch.yml` 是叠了只读探针的复验版，**不进生产**。

**探针物料现状（2026-09-11）**：仓库外复验物 `D:\Code\sandbox-probe\`（`mount-probe.json` / `v3.json` / `forensics.json` / `dump-config.txt` / `boot-help.txt` 等）已随仓库外清理**整体进回收站**（可恢复窗口内可取回）。⇒ `mount-artifact-replay.mjs` 的**输入产物已不在原位**，要复跑须先用 `*.verify.patch.yml` 重跑一次 boot；**本节结论不依赖该产物，判定不受影响**。

**覆盖面**：凡 bundles 含 `@deepseek-ai/dsh-base` 的 profile 都要（带 sandbox 行 + win32 下启用的 pwsh-sandbox）⇒ **按实际启用的面来，不预设名单**。

> ⛔ **2026-09-17 推翻原记「共享层一份够多面」**（🟢 WB 实测 + 四组对照）：原记「插件实体放在 `profiles/node_modules/@larryagent/`，**三个共享，一份足够**」—— **该层是坏的**。同一份插件从该层 `import` 时，`dsh-sandbox-local` 被解析到 **`0.0.1-rc.1`（npm latest 那支）**，而同树 `dsh-llm` 是 `0.1.5-rc.2` ⇒ **`import` 即崩**。**必须落各 profile 自身的 `node_modules`**（那里按 profile 自己的 lock 装，代际正确）。
> 溯源：`peerDependencies` 写成 `"*"` 是**旧代之所以进树**的原因，**决定命中结果的是落点层级** —— 两因素叠加，不是同一个；引入点 = **`a974258`**（升 015 时 lockfile 重算）。修法见 `TODO.md`「DSH-3.7.2 硬前置 1」。
> ⭐ **跨机同形（2026-09-17 CVM 实测追加）**：CVM 的 `~/.dsh/profiles/node_modules/` 共享层**同样含 `dsh-sandbox-local@0.0.1-rc.1`**（该层由 09-16 装 `sdk` 时生成，**非人为复刻产物**）。解析实测（`createRequire.resolve`，只读）：从 `profiles/larry/`（当时仍在的 012 面）与 `profiles/node_modules/` 起点 → **`0.0.1-rc.1`**；从 `profiles/sdk/` 起点 → **`0.1.5-rc.2`** ✓。⇒ ① 旧代**不是本机某次操作的产物，而是依赖解析本身**（peer `*` → npm latest）—— **跨机同形即证**；② **3.7.2 落 `sdk` 自身层会被解析到 015**，该落点判断**正反两面均有实测**（正：会绿 ／ 反：落共享层即取旧代）。

**落盘状态**：⬛ **未落盘** → **老大 2026-09-11 拍定：并入 DSH-3 执行**（届时带真 end-to-end）。在此之前，③ 的修复在生产是**"已验收、未生效"**，勿当已上线。

> ⚠️ **2026-09-14 订正上句的判据表述**（⚠️ **`larry` 面已于 2026-09-17 退役**，下述路径为当时事实）：原记"三个 profile 的 `cordis.patch.yml` 仍为 `[]`"—— **只在全局 home 成立**。实测须分两处看：
> - `~/.dsh/profiles/{larry,sdk,web}/cordis.patch.yml` = **模板空态 `[]`** ✅ 原记正确
> - **`.dsh-home/profiles/larry/cordis.patch.yml` = 477 B，已含一条 `- id: hmr / disabled: false`**（即 §8.5 的模块级 HMR 开关）⇒ **非空**
>
> ⇒ **"未落盘"的结论不变**（两者都不是方言修复件），但**判"是否落盘"要看内容、不看文件是否为空；且必须区分 home**（工程 `.dsh-home/` vs 全局 `~/.dsh/`）。⚠️ 3.7 落盘时**是追加不是覆盖**（该文件已有那条 hmr 条目）。
>
> ⚠️ **前置缺项实测（2026-09-17 WB，仅本机 PC 侧）**：3.7 的落盘**前提并非已就绪**，两项缺项如下（两项**均已处置**，见段末）——
> - **工程 `.dsh-home` 的挂载点不存在**：`.dsh-home/profiles/node_modules/@larryagent/` **无该目录**（插件没装进去）〔2026-09-17：3.7.1 曾落进该共享层，**该产物已随退役移除**；且该层已被证会取到旧代 ⇒ 落点改 profile 自身层〕
>   ⇒ 只写 patch 而不装插件，patch 里那行 `name: '@larryagent/plugin-sandbox-dialect'` **解析不到**
> - **全局那份与仓库源「同功能、不同版」**：`~/.dsh/profiles/node_modules/@larryagent/plugin-sandbox-dialect/index.js`（2962 B）
>   与仓库 `harness/packages/plugin-sandbox-dialect/index.js`（4087 B）**去掉注释后逐行一致**，差异**只在注释头**
>   ⇒ 复制**以仓库源为准**，**勿从全局 home 拷**（且全局那份是主 `~/.dsh` 的，本项落点在工程 home）
> - ⇒ **两项处置（2026-09-17 收口）**：① 落点从「共享层」改为**该 profile 自身层**（`sdk/node_modules`，见 3.7.2 硬前置 1）；② **全局那份不再作参考**（本项只落工程 home，且全局副本同功能不同版）。**落盘仍属 3.7.2**

**已证 / 未证边界（别过度读）**：
- 🟢 已证：boot 时 `providerCtor=SandboxDialectProvider`；消费方 `SandboxPwshExecutor.confine()` 拿到的签名 = 加宽后 6 条；消费方 argv 含 preamble。
- ⬛ 未证：**模型真触发一次被拒命令并看到 `[sandbox: file access denied]`** 的真 end-to-end（boot 内的受限 spawn 被工具沙箱拦）→ 留 DSH-3。
- 适用面：本修复**仅 Windows**（`confine()` 在非 win32 直接返回原值）⇒ CVM(Linux/landlock) 上不需要、也无副作用。

#### 4.3.1 015 复核：上游**未**自修，修复件继续有效（🟢 2026-09-16 WB 本机上机）

**触发**：Trae 2026-09-15 提出「015 动过 `sandbox-local`（import 从需编译的 `fs-ext` 迁到 `@deepseek-ai/node-addon-system`）」⇒ 须先判「015 是否已自修该缺口」，已修则应让修复件退役。

**结论：未自修。** 判据 = 读 015 的 `DENIAL_SIGNATURES`：

| 项 | 012 | 015 |
|---|---|---|
| `DENIAL_SIGNATURES['windows-acl']` | `['access is denied','access to the path','permission denied']` | **逐字节相同** |
| 含 `operation not permitted`？ | ❌ | ❌ |
| 含 zh-CN 两条？ | ❌ | ❌ |
| `Config` 字段（有否签名注入点） | 3 项，无 | **相同**（仍无注入点） |
| `STATIC_ENFORCEMENT['windows-acl']` | `partial` | **相同** |
| `PLATFORM_CHAINS.win32` | `['windows-acl']` | **相同** |

⭐ **读法陷阱（本项的真正难点）**：`operation not permitted` 在 015 包里**确实出现 1 处** —— 但它属 **`seatbelt`（macOS）名下**（`DENIAL_SIGNATURES.seatbelt`）。**不判归属就会得出"已修"的反向结论**。⇒ 「某字符串在包里存在」与「Windows 问题已修」是两件事，必须**钉住它挂在哪个 runner 名下**。

**证据链（六条，均为 2026-09-16 实测）**：

1. **同文件全量 diff = 1 行**：`dsh-sandbox-local/lib/index.js` 012→015 唯一差异是 import 源 `@deepseek-ai/node-addon-landlock-run` → `@deepseek-ai/node-addon-system/landlock-run`（**包重命名**），其余 **538 行逐字节一致**。⇒ 「015 动过该包」**只是包改名**，与方言无关。
2. **runner 端也未修**：`dsh-sandbox-windows-acl` 的 012/015 **全部代码文件 sha256 相同**（`lib/index.js` / `lib/runner.js` / 全部 `.d.ts` / `lib/types-*.js`），仅 3 个 README（同一段话的**文案重写**）与 `package.json`（版本号）变 ⇒ 上游**没有**从"改 runner 输出文本"这一侧修。
3. **无其他扩展点**：扫 015 profile 全树 **12105 个 js/ts** ⇒ `DENIAL_SIGNATURES` **唯一一处**（就是 `sandbox-local`）；`拒绝访问` / `访问被拒绝` **0 命中**。
4. **非被改副本**：本机 `~/.dsh/profiles/sdk` 与 CVM 两处独立安装点的同文件 sha **一致** = `100c7d169f44da32`。
5. **修复件接口全部仍成立**：`super.confine()` 可调 ／ `ConfinedArgv.denialSignatures` 字段名未变 ／ gate `enforcement === 'partial'` 仍成立 ／ 默认导出仍是 provider 类（`export { LocalSandboxProvider, LocalSandboxProvider as default }`）⇒ **修复件不需改码**。
6. `PLATFORM_CHAINS.win32 = ['windows-acl']` 单候选、无 probe ⇒ 选档逻辑不变。

**⇒ 处置**：修复件**不退役**；DSH-3.7 走「**重跑全链路复验**」路径（**不得沿用 012 结论** —— 本项只证了"方言表未变"，`confine()` 的**运行时行为**在 015 上仍属未验）。

✅ **该代际落差已解除（2026-09-17 实测）**：工程 `.dsh-home` 已升 015 —— `profiles/{larry,sdk}` 的 `package.json` 与 `node_modules` 均 `0.1.5-rc.2`（`larry`: `dsh-base` ＋ `dsh-headless`；`sdk`: `dsh-base` ＋ `dsh-sdk-app`；composition 未动，与修前基线 diff **各仅 2 行版本号**），两个 lockfile 的 `0.1.2-rc.1` 出现 **0** 次。⇒ **3.7 的 end-to-end 真实宿主（client ＋ 工程 home）现跑在 015 上**，与本项判定基准（主 `~/.dsh/profiles/sdk`，015）**已同代**。
- 本项「修复件继续有效」的结论**不变且更干净**：015 未自修（证据链见上），且该结论本就设计为「**工程 home 升 015 后仍成立**」。⇒ 修复件**仍不退役**。
- ⚠️ **遗留不变**：本项只证了"方言表未变"，`confine()` 的**运行时行为**在 015 上仍属未验 ⇒ DSH-3.7 仍走「重跑全链路复验」，**不得沿用 012 结论**。
- 📌 **实测口径（2026-09-17）**：两条 `--profile X --help` 需**显式设 `DSH_HOME=D:\Code\LarryAgent\.dsh-home`** 才正常（`exit 0`／约 2 s 自退出；`larry` 打出 `[B1-PROBE] external bundle loaded by cordis (tag=v1)`）。**不设**则落到主 `~/.dsh`，而该处的 `larry` profile 只有 `dsh-base` bundle、`dependencies: {}`、**无 app 层** ⇒ 无 app 可 boot、**静默挂死（零输出且不返回）** —— 这是**用法问题、非 015 缺陷**（属 §1「会卡死所有 dsh 命令」同族的"看起来像卡死"陷阱）。

---

## 5. 环境噪声：WorkBuddy 的批量删除保护会污染沙箱探针输出

node 侧 `rmSync` 递归删除 **>50 个文件**时，会抛：

```
Error: [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":57,"threshold":50,"scope":"turn",...}
```

沙箱探针的 cleanup 阶段可能踩到（**exit 仍为 0，但 stderr 有这条**）。
→ **判读时不要把它误判成沙箱缺陷**。临时目录建议用带时间戳的新目录名、不递归删旧目录。

---

## 6. ⭐ 连通性 / 凭据状态判据矩阵（🟢 四组对照实跑，2026-09-10 WB）

场景：同一脚本 `scripts/dsh-prompt.mjs`（sdk profile + stdio JSON-RPC），只改 Key 状态。

| 场景 | exit | `finalResponse` | `assistant/message` 事件 | `turn/end.reason.kind` | `error.code` | status | 耗时 |
|---|---|---|---|---|---|---|---|
| **有效 Key** | 0 | `PROBE-OK-2026` | ✅ **有** | **`completed`** | — | — | 106.2s（冷跑）/ **1.9–3s（暖跑）** |
| **无 Key** | 0 | 空 | ❌ 无 | error | `MISSING_CREDENTIAL` | — | 2.9s |
| **错误 Key** | 0 | 空 | ❌ 无 | error | `AUTH` | 401 | 3.0s |
| **已关闭的有效 Key** | 0 | 空 | ❌ 无 | error | `AUTH` | 401 | 2.6s |
| **未知模型 id** | 0 | 空 | ❌ 无 | error | `INVALID_REQUEST` | 400 | 2s |

> 末行🟢 Claude 2026-09-10 补（含反向对照：同一 Key 下把模型名换成 `deepseek-not-a-real-model` 即现此行 → 证明模型名在服务端被校验，故"改名后冒烟绿"不是假绿）。

### 由此定出的判据（可直接写进 DSH-6 断言）

- **成功 ⇔ `assistant/message` 事件存在 且 `finalResponse` 非空 且 `turn/end.reason.kind === 'completed'`。**
  - 🔴 **此处早期写作「`turn/end.reason` 不存在」是错的**（2026-09-10 订正）：当时成功组取到的"无"是**字段路径取错**（实际在 `turn/end.data.reason`），**不是真的没有**。照字面实现 → **有效 Key 也被判红 = 假红**，而假红会逼人习惯性忽略红灯，比没有护栏更糟。
  - **非 `completed` 的收尾一律判红**：`error` / `max-tokens` / `aborted` / `blocked` / `interrupted`。
- **`exit 0` / session 建立 / 有事件流 —— 三项全部无效**：三种失败场景在这三项上都与成功一致。
- **要区分失败原因，读 `turn/end.reason.error.code`**：`MISSING_CREDENTIAL` = 没配；`AUTH`+401 = 配了但无效/已关。
- ⚠️ **错误 Key 与已关闭 Key 不可区分**（同为 `AUTH`/401）→ 用户报"AI 不回话"时，从输出**无法**判断是配错还是被关，只能凭 Key 后 4 位回查平台。

### 两个附带事实

- DSH **自带 Key 脱敏**：日志里呈现为 `****3c36`（**保留后 4 位**）→ 不会明文泄漏，但**后 4 位会进 session 日志**，涉及凭据时须知悉。
- **环境变量方式不落盘**：跑完再无 Key 复现同一脚本，仍得 `MISSING_CREDENTIAL`（未从环境变量偷偷持久化）。credentials service（web Models 页面）那条落盘路径**未测** ⬛。

### ⬛ 残留扫描的已知盲区：压缩

`scanForKeys` 只扫**明文**文件，而 session 日志是 `session.jsonl.zstd`（**多帧 zstd**）→ 结构上扫不进去，**压缩是残留扫描的盲区**。

- **现状可接受**：环境变量注入**不落 session 日志**（已解压核对，连脱敏形态都无）→ 该路径下盲区无实害，**本轮不补解压扫描**（裁定 ②：无收益不扩围）。
- 🔴 **触发条件（届时必须补）**：一旦改用 **credentials service 那条落盘路径**，Key 可能以明文进 session 日志 → **必须先补"解压后扫描"**（多帧魔数切帧，约 30 行），否则残留扫描形同虚设。**此为条件式欠账，不是"已知无害"。**

### ⚠️ 实跑前置（漏了会伪装成别的故障）

1. **先清 profile 锁**（见 §1）——任何一次 dsh 运行（含 `--dump-config`）都会留下孤儿锁。
   不清的表现是 `initialize timed out after 20000ms` 或 `JSON-RPC input closed`，**极易误判为"profile 启动慢 / SDK 握手有问题"**。
2. **真实模型调用耗时两极**：**冷跑**（含 profile boot / pnpm heal / 首次 SDK 握手）可到 **106 秒**；**暖跑**（同进程 SDK、profile 已热）**1.9–3 秒**。`dsh-prompt.mjs` 内置 `initializeTimeoutMs: 20_000`，冷跑容易超时 → **超时 ≠ 失败**，复跑前先确认锁。
   → 超时预算**别一律按 106s 设**（会拖慢正常用例）。建议 `initializeTimeoutMs=120s / requestTimeoutMs=240s`，取宽松侧防冷跑误杀。

---

## 7. 其他已确认事实

- `sandbox` provider 在 `dsh-base/cordis.patch.yml` 挂载 `@deepseek-ai/dsh-sandbox-local`，**未 disabled**；`bash-sandbox` 在 win32 被禁用、`pwsh-sandbox` 在非 win32 被禁用。
- `enforcement` 在 Windows 上静态声明为 **`partial`**（受限令牌须保留 Everyone 才能初始化 → 显式给 Everyone 写权限的对象仍可写；NTFS 硬链接是文件对象别名 → 工作区外硬链接仍可写）。**2.10.2「Windows 端侧执行器」按 partial 规划，不要按 full 宣传。**
- 旁路开关：无静默降级；显式配置 `DSH_PERMISSION_MODE=danger-full-access`（该档 `approval: never`）。

---

## 8. DSH 工程搭建与短路点复跑（DSH-2.1 / 2.2）

> **来源**：原文为 Trae 实测报告 `docs/dsh/dsh-b1-plugin-probe-trae.md`（2026-09-09）。2026-09-11 吸收至本节，独立报告文件随之删除（内容等价）。
> **结论（两个"能"，已采纳）**：① **DSH-2.2** 官方 demo 能在本机 Windows 跑通一次完整会话；② **DSH-2.1** 自做 Cordis 插件能经 **B1 通道**挂进 DSH 并被 cordis 实际加载。两者都不是"环境能装/能起服务"，而是**跑通到「LLM 完整回复 + 我们的 `apply` 被实际执行」**。
> 🟢 **WB 独立复验（2026-09-09）**：静态 + 动态证据均本地复现——`dsh --profile larry --dump-config` 见 `larry-probe` 插行、`hmr disabled: false`；`dsh --profile larry --help` 打出 `[B1-PROBE] external bundle loaded by cordis (tag=v1)`。**核心结论成立。**〔该 `larry` 面已于 2026-09-17 退役；结论与手法（`--profile <p> --dump-config/--help`）不随面退役，可换任一 profile 复用〕
> ⚠️ **WB 未独立复跑**：官方 demo 完整会话（需真实 key 触发 LLM），采信报告的 exit 0 + stdout + 会话产物说明。

### 8.1 版本基线（🟢 2026-09-09 快照；表内现值已于 2026-09-17 校）

| 项 | 值 |
|---|---|
| OS / shell | Windows x64 / PowerShell |
| Node | **v24.14.1**（`D:\App\node\node.exe`；root `package.json` engines 要求 `^22.19.0 \|\| >=24`） |
| pnpm | **11.7.0**（`npm i -g`；与 root `packageManager: pnpm@11.7.0` 精确一致） |
| dsh | `@deepseek-ai/dsh@0.1.5-rc.2`（npm 全局）〔2026-09-09 快照值 `0.1.2-rc.1`，2026-09-16 随 DSH-3.0 收口升级〕 |
| DSH_HOME | `D:\Code\LarryAgent\.dsh-home`（仓库内，已 gitignore） |
| profile | ~~`larry` = `dsh-base` + `dsh-headless` + 我们的 `@larryagent/plugin-probe`~~ 〔**2026-09-17 退役**：该面不接生产通道，且开发/冒烟价值已被 `sdk` 面涵盖 ⇒ 现按 `sdk` 面组装，见 §4.3〕 |
| 模型凭证 | 测试 key 仅经**环境变量** `DEEPSEEK_API_KEY` 注入，未落任何文件 |

（工程规格另见决策稿 §3.6「本阶段已定案的环境规格」表。）

> **复核注（2026-09-11 DSH-2.6）**：本节基线为 DSH-2 锁定的 `0.1.2-rc.1`；复核时上游最新已到 **`0.1.5-rc.2`**（`latest` = `0.1.5-rc.1`，7 天 2 个 rc）→ **老大拍定不升基线**（升级门槛太低，会导致频繁升级适配）。**本机仍锁 `0.1.2-rc.1`，DSH-3 写码按此 API 走**；0.1.5 破坏性清单与决定见决策稿 §3.4「DSH-2.6 收口复核」。
>
> **↑ 该"不升基线"决定已于 2026-09-16 被老大推翻**（DSH-3.0 收口时基线换 `0.1.5-rc.2`）⇒ 上面的"仍锁 012"已过时；**本节表格的 `dsh` 版本行已按现值修订**（2026-09-17，见表内括注留存快照值）。§8.3／§9.2 里 `npm i -g @deepseek-ai/dsh@0.1.2-rc.1` 这类复跑命令**仍属历史件**（记录当时做法，不回改）。现状见文首「代际状态更新」。

### 8.2 自做插件如何声明 bundle（B1 挂载的判定依据）

`package.json` 必须声明 `dsh.bundle.patch`：

```json
{ "main": "lib/index.js", "dsh": { "bundle": { "patch": "./cordis.patch.yml" } } }
```

`cordis.patch.yml`（profile 层插行）：

```yaml
- insert:
    - id: <row-id>
      name: '@larryagent/<pkg>'
      config: { ... }
```

插件骨架 = `export const name` + `export const inject` + `apply(ctx, config)`（范式见 `packages/fs/tool-fs/src/index.ts`，从 `export const inject` 起）。
挂载动作：`dsh plugin --profile <p> add <本地包路径>`（`<p>` = 当时在用的 profile；**2026-09-17 前为 `larry`（已退役），现为 `sdk`**）→ reconcile 后 profile manifest（`package.json` 内）的 `dsh.profile.bundles` **自动纳入该包** —— 这就是"挂进 profile 层"。⚠️ 注意与 B 段 Gateway 判定第 4 条呼应：`plugin add` 默认**只写 dependencies**，走 bundle 声明这条才会进 `bundles`。

### 8.3 复跑步骤（干净状态）

**前置**：`node ≥24` / `npm i -g pnpm@11.7.0` / `npm i -g @deepseek-ai/dsh@0.1.2-rc.1`（`dsh --version` 应打 `0.1.2-rc.1`）；源码查阅走 `ref/dsh-bare` 只读。

**A. 官方 demo（源码树）**

1. 建工作树：`git -C ref/dsh-bare worktree add --detach D:/Code/dsh-src dsh-v0.1.2-rc.1`
2. `cd D:\Code\dsh-src && pnpm install --ignore-scripts`（约 56s / 1001 包；`--ignore-scripts` 跳过 lefthook，**必须**）
3. `pnpm run build:lib:host`（**必须**，否则 `typert-loader` 找不到 `lib/typert.host.js`）
4. `$env:DSH_HOME="D:\Code\dsh-src\.dsh-home-demo"; $env:DEEPSEEK_API_KEY="<key>"; $env:DSH_TOOLS_MODE="ptc"; node scripts/demo-ptc.mjs "Reply with exactly: hello from dsh"` → 期望 stdout `hello from dsh`、exit 0，`.dsh-home-demo/sessions/` 生成 `session.jsonl`

**B. B1 挂载（npm 全局入口即可，无需源码树）**

1. `harness/`：`pnpm install && pnpm run build`（产出 plugin 的 `lib/`）
2. `$env:DSH_HOME="D:\Code\LarryAgent\.dsh-home"; dsh plugin --profile larry add @deepseek-ai/dsh-base@0.1.2-rc.1`（230 包；若因 `allowBuilds` 以 exit 1 结束 → 见 §8.4 第 3 条）
3. 同上 add `@deepseek-ai/dsh-headless@0.1.2-rc.1`，再 add `D:/Code/LarryAgent/harness/packages/plugin-probe`（link 方式）
4. 断言 manifest `bundles` 含三项；`dsh --profile larry --dump-config | grep larry-probe` 见插行
5. `dsh --profile larry "Reply with exactly: probe loaded"` → stderr 见 `[B1-PROBE] … loaded by cordis`、stdout 见回复、exit 0

> **零成本断言**（不需 key）：`dsh --profile larry --help` 即触发 cordis apply（见上方复验行）。

### 8.4 踩坑清单（6 条）

1. **源码跑 demo 必须先 `build:lib:host`**：headless 基于 dsh-base，`typert-loader` 运行时动态 `import` 各包 `exports "./typert"` 指向的 `lib/typert.host.js`（构建产物、gitignore）——不 build 必崩（`Cannot find module`）。
2. **`pnpm install` 要加 `--ignore-scripts`**：root postinstall 是 lefthook；独立 worktree 跑无需其 git hooks。
3. **pnpm 11 的 `allowBuilds` 安全机制**：`dsh plugin … add` 装到含 koffi/node-pty/protobufjs 等依赖时，会因 "ignored build scripts" 以 **exit 1** 结束、reconcile 不跑。解决：在 profile 的 `pnpm-workspace.yaml` 把 `allowBuilds` 待审批项**全设 `false`**（headless boot 不需要这些 native 构建），重跑即 exit 0。**这是 pnpm 11 相对旧版的行为变化，别当成 dsh 坏了。**
4. **源码入口 + tsx 在 PowerShell 下启动偶发卡住**（本次 add `dsh-headless` 一次后台卡住、CPU 停滞）：改用 **npm 全局 `dsh`**（`lib/bin.js`，无 tsx）后 1.3s 完成。**验证性操作一律走 npm 全局入口，又快又稳。**
5. **PowerShell 把原生 stderr 包装成 error 流**：`[B1-PROBE]` 这类 stderr 会被 PS 显示成红字 + RemoteException 外观，**内容本身没坏** —— 看字符串别被格式吓到。
6. **自定义 profile（`larry`）`patchReload` 默认 `live`**：profile 用户层 `cordis.patch.yml` 变化即热载（launcher watch-only fallback，不需要 hmr 插件）；**模块级代码 HMR 是另一个开关**（见 §8.5），别混。

### 8.5 模块级 HMR 开关（可开，非必需）

在 profile 用户层 `cordis.patch.yml` 覆盖 base 默认（base 中 hmr row 为 `disabled: true`）：

```yaml
- id: hmr
  disabled: false
```

`--dump-config` 后该 row 渲染为 `disabled: false`（覆盖生效）；开启后 headless boot 正常（`tag=v1` + `hmr enabled ok`，exit 0），**无副作用**。

> **口径**：**模块级 HMR 开关可开、且开启不影响现有 boot**；但"同进程改代码即热载"的动态观察需**长驻 profile**（web/tui 类有交互/服务生命周期），headless one-shot 跑完即退、没有观察窗口 → 该动态验证留待 web 连通一并做，**不构成阻塞**。

### 8.6 源码工作树生命周期

- 工作树挂载于 `D:\Code\dsh-src`（**仓库外**，未含于 LarryAgent git）；`ref/dsh-bare` 全程只读（`git show` / `worktree add`，未写任何 refs/config）。
- 保留供后续复用（HMR 动态验证 / web 连通）；一句话清理：

  ```
  git -C ref/dsh-bare worktree remove D:/Code/dsh-src
  ```

- `dsh plugin` 仅写 `$DSH_HOME/profiles/<name>`（隔离 DSH_HOME 内），**不触碰用户级全局 profile / `~/.dsh`**。

---

## 9. Vue/Tauri ↔ DSH 连通复跑（DSH-2.3）

> **来源**：原文为 Trae 实测报告 `docs/dsh/dsh-23-vue-tauri-connect-trae.md`（2026-09-09，基线 `dsh-v0.1.2-rc.1`）。2026-09-11 吸收至本节，独立报告文件随之删除（内容等价）。
> **结论（判"能"）**：现有 Vue/Tauri 客户端已能经 DSH 的 `sdk` profile（stdio JSON-RPC）发一条消息并收到**真实模型回包**；GUI 侧与无 GUI 复跑路径**走同一通道**（同一 `node` 驱动脚本、同一 profile）。
> **能力边界观察**（sdk 面的能做/做不了）落决策稿「sdk 面实测能力边界」小节——**B 段已定为 SDK（stdio），该表即 B 段的能力清单**。本节只留可复跑的环境侧事实。

### 9.1 连通方式

| 项 | 值 |
|---|---|
| profile | `sdk` = `dsh-base` + `dsh-sdk-app`（`.dsh-home/profiles/sdk`，bundles 2 项）⚠️ 与 `larry` 是两个 profile，**结论不可互推** |
| 传输 | **stdio JSON-RPC**（`sdk-jsonrpc-server`；**stdout 归协议独占**） |
| 驱动 | 官方 TS SDK `@deepseek-ai/dsh-sdk-client@0.1.2-rc.1`（`DeepSeekHarness` → `run()`），spawn 同版本 `@deepseek-ai/dsh` runtime 子进程 |
| 客户端进程管理 | Tauri 新增 `dsh_prompt` IPC command → `Command::new("node")` 跑 `harness/scripts/dsh-prompt.mjs` → 捕获 stdout/stderr 回传；一次性调用、无长驻句柄；DSH_HOME 由 Rust 注入项目 `.dsh-home`，凭据继承启动 env（`DEEPSEEK_API_KEY`，**未落文件**） |
| GUI 入口 | 主窗口顶栏右侧 **DSH** 按钮（`DshProbe.vue` modal：输入→发送→显示回复/stderr/exit code）；仅 Tauri 环境可用（纯浏览器 vite 下置灰） |

**通道一致性**：GUI invoke `dsh_prompt` 与 CLI 复跑 = 同一个 `node scripts/dsh-prompt.mjs` → GUI 复验可退化为人跑 CLI 命令，结论同源、无需复用点击。

### 9.2 复跑步骤

**前置**（一次性）：Node ≥ 24；`npm i -g pnpm@11.7.0`、`npm i -g @deepseek-ai/dsh@0.1.2-rc.1`；`.dsh-home/profiles/sdk` 已建（`dsh-base` + `dsh-sdk-app`，230 包，`allowBuilds` 全 `false`）；`harness/` 已 `pnpm install`。

**A. 无 GUI（CLI，核心证据路径）**

```
$env:DSH_HOME = "D:\Code\LarryAgent\.dsh-home"; $env:DEEPSEEK_API_KEY = "<key>"
node harness/scripts/dsh-prompt.mjs "Reply with exactly: hello from dsh sdk"
# → stdout: hello from dsh sdk        exit 0
node harness/scripts/dsh-probe-capability.mjs "Reply with exactly: probe ok"
# → 完整事件流 JSON（19 事件 / 21 通知 / finalResponse "probe ok"）
```

**B. GUI**

```
$env:DEEPSEEK_API_KEY = "<key>"; cd client; npm run dev:tauri
# 顶栏「DSH」→ 输入消息 → 发送 → modal 显示回复（同 A 通道）
```

### 9.3 踩坑（本节差异项；与 §8.4 重复的不再列）

1. **tauri dev 首次全量 debug build（~1.5min）**；`tauri-plugin-shell` v2.3.5 下 `tauri.conf.json` 的 `plugins.shell.scope`（旧 ACL 字段）是**未知字段**（该版本 schema 只剩 `open`）→ dev 直接 panic（`unknown field scope, expected open`）。删该段即恢复——main.rs 实际用 `std::process::Command` spawn，未用 shell 插件 API，**属修复且非新增破坏**。
2. **Python 后端冷启动慢**（chromadb 首启 ~2min）；`dsh_prompt` 与后端无耦合、DSH 通道不受影响，但点按钮前后端 healthy 可避免 ConnectionToast 干扰观感。
3. **sdk runtime stdout 归 JSON-RPC 独占**：驱动脚本自身进度只能走 stderr，往 stdout 混打会破坏协议。
4. **凭据只经环境变量**：起 tauri 前先 set `DEEPSEEK_API_KEY`，否则 runtime initialize 报缺 credential（与 headless 同行为）。
5. `pnpm 11 allowBuilds` / `PowerShell 包装 stderr` 两条与 §8.4 第 3、5 条同，不重复。

### 9.4 会话产物与 GUI 点验记录

- **持久化**：每次 prompt 落 `.dsh-home/sessions/`（`session.jsonl`），sessionId 可复现。
- **事件流粒度**（一次完整回合 = 19 事件）：`turn/start|end`、`step/start|end`、`assistant/chunk`（流式增量，7 条/次）、`assistant/message`、`user/message`、`request/header`、`request/context`、`session/title`、`agent/inbox/spliced`；通知流 `session.event` ×19 + `session.status` ×2。
- **GUI 人工点验（2026-09-09，老大实测）**：全链路确认「Vue modal → Tauri `dsh_prompt` IPC → `node harness/scripts/dsh-prompt.mjs` → sdk runtime → 真实模型回包」；自定义消息可用，事件流 318/320 为**一次完整对话回合**粒度。模型对"系统提示探测"的拒答 = DSH 侧 agent 指令约束生效的正确行为，非异常。
  - 注：运行时 cwd 继承 Tauri 进程（= `client/src-tauri`），故模型工作目录显示该路径；要固定工作区，`dsh_prompt` 注入 `cwd` 即可（本轮 hello world 无碍）。
- **隔离自检**：测试 key 仅经环境变量注入、未落任何文件；`.dsh-home/`（含 sdk profile 会话产物）被 `.gitignore` 排除；`ref/dsh-bare` 全程只读；tauri dev 验证后已停进程并释放 8000 端口。

---

## 10. 本机环境变量与工具链基线（附：各 AI 运行时差异警示）

> **来源**：QoderWork《本机开发与测试调试环境冲突摘要》（2026-09-11，原载交流区编外 AI 区，**该存根已清理**）；WB 于同机**逐条实测校验**后校正——**只保留实测成立项**，并**保留证伪项**（防后续 AI 再被误导）。

### 10.1 ⭐ 各 AI 工具运行时被注入不同环境 ⇒ 判据必须注明"取自哪棵树"

🟢 实测（2026-09-11，同机同一时刻）：

| 项 | WB 工具树 | 用户裸 shell / 持久层 |
|---|---|---|
| `python` / `python3` | **3.13.14**（注入 managed `…\.workbuddy\binaries\python\versions\3.13.12`） | `python` → **3.11.9**（`…\Programs\Python\Python311\`），`py -3` → **3.14.3** |
| `PYTHONUTF8` / `PYTHONIOENCODING` | **已设**（`1` / `utf-8`，工具注入） | User 作用域**未设** |
| `npm` | managed node 自带的 npm | `AppData\Roaming\npm` |
| PATH | — | 无 `.qoderwork\bin`（对方进程注入物，不在持久 PATH） |

⇒ **纪律**：任何"本机环境"结论**必须写明取自哪个运行时**（与 §7「判据必须取自真实运行时」同源）。拿某一棵树的结果去描述"本机"，会得到互相矛盾且不可复现的结论——这正是 QoderWork 报告多处失准的根因。

### 10.2 实测成立（持久层，与 DSH 开发相关）

- **Python 多入口并存**：持久 User `PATH` 含 `…\Programs\Python\Python311\`。`python` → **3.11.9**，`py -3` → **3.14.3**。⇒ 脚本一律显式 `py -3.x` 或绝对路径，**勿依赖裸 `python`**。
- **`git` 全局硬编码代理**：`http.proxy` = `https.proxy` = `socks5://127.0.0.1:7890`（用户梯子）。⇒ **梯子关时，`git fetch/pull/push` 与依赖 git 的插件安装会一起失败**；需临时 `git -c http.proxy= -c https.proxy=`（本机直连 GitHub 会被 reset；见决策稿 §3.4「DSH-2.6 收口复核」）。
- **行尾**：仓库内 `core.autocrlf=true`，全局未设 ⇒ 跨 AI 协作行尾噪声的来源（本仓治理检查已含"末字节与 HEAD 逐字节比对"）。
- **控制台编码**：中文 Windows 默认 GBK/CP936，且 User 层未设 `PYTHONUTF8` —— 与 §4.1「编码层」同源，是 ① 层缺口的环境底色。

### 10.3 实测**证伪**（留痕，防止再被误导）

| 曾被报为 | 实测 |
|---|---|
| `NODE_TLS_REJECT_UNAUTHORIZED=0`"已生效"（会关闭 Node 证书校验） | ❌ **User / Machine / Process 三作用域全为空** → 系统层无此开关 |
| 仓库根"只有 `.gitignore` 和 `backend/`" | ❌ 另有 `.claude/.dsh-home/.trae/.vscode/.workbuddy` + `HUMAN*.md/Makefile/README.md/TODO.md` + `archive/client/docs/exchange/harness/mobile/ref` |
| `tauri` / `vite`"未装到全局或当前工程目录" | ❌ PATH 无，但 **`client/node_modules/.bin/` 内有** `tauri`/`vite`/`vitest`（本地依赖，走 `npx`/package script） |
| PATH 有 `…\.qoderwork\bin` 重复条目 | ❌ 持久 User PATH 无该条 |

**校正经要**：QoderWork 报告整体属**"替身运行时"观察**，**不作为本机事实源**；本节为核准版。其余未列项（如全局工具链位置、PATH 顺序）低影响，不落。

---

## 11. PC 侧生产使用环境的口径（🟡 **推论**，非独立实测）

> **为何有这一节**（2026-09-12 定位统一后新增）：本机 Windows 的第三重角色是 **PC 侧生产使用环境** —— PC 版 client 不上云，最终跑在**真实用户的 Windows** 上。本节把 §4 / §4.1 / §7 / §10 的**开发期实测**换算成**用户机上会怎样**，用途是**防止"开发机能跑 = 产品没问题"的误判**。
> ⚠️ **证据等级**：下表左列支点全部 🟢 本机实测，但"落到真实用户机器上"右列是 🟡 **推论** —— **尚无他机验证**（见节末待补项）。

| 开发期观察（🟢 本机实测） | 到 PC 侧生产使用环境的含义（🟡 推论） |
|---|---|
| §4：**② 错误码类别层跨语言成立** —— 英文 Windows 下 node 报 `EPERM: operation not permitted`，同样命中不了所备的 `permission denied` 文案 | ⇒ **这不是中文 Windows 的本地化问题** ⇒ 真实用户的 Windows 上同样**"沙箱拦住了、但拒绝信号传不出去"** ⇒ 修复件（§4.3 `plugin-sandbox-dialect`）**必须随客户端发布**，不能指望"用户系统设置"绕开（⭐ **015 亦未修**，见 §4.3.1） |
| §4：**① 层的作用域 = 取决于跑 DSH 的那棵进程树**（`Get-UICulture` 可被上层应用覆盖） | ⇒ 修复件**两种方言都要留**（零成本）—— 不能假设用户机器"就是中文"或"就是英文" |
| §4.1：子进程输出**一律按 UTF-8 解码**，而 Windows PowerShell 5.1 默认写 OEM 代码页 | ⇒ 用户机器的代码页不可控 ⇒ **必须依赖 `ENCODING_PREAMBLE`**；⚠️ 而 `--mode read-only` 下 preamble **可能被 ConstrainedLanguage 拒**（§4.1 末尾 ⬛ 未测）⇒ **该未测项在 PC 侧生产环境是必答题，不是可选项** |
| §7：`enforcement` 在 Windows 上静态声明为 **`partial`**（受限令牌须保留 Everyone 才能初始化） | ⇒ 对真实用户同样只能按 `partial` 宣传（2.10.2「Windows 端侧执行器」已按 partial 规划，**勿按 full 宣传**） |
| §10.1：**各 AI 工具运行时被注入不同环境**；§10.2：`python` 多入口 / `git` 全局硬编码代理 / `core.autocrlf` 等属**本机持久层**配置 | ⇒ 这些**本机持有、不随产品分发** ⇒ 产品侧**不得依赖本机持久层**：不假设裸 `python` 可用、不假设存在 `git` 代理、行尾不依赖 `autocrlf` |

**⬛ 待补（决定本节的效力上限）**：本节**无他机验证**。要把它从 🟡 推论抬成 🟢 事实，至少需要**一台与本机配置不同的 Windows**（不同 UI 语言 / 非管理员账户 / 非开发机）跑一遍 §4 的探针。做不做、何时做 → 待老大定，**不自行立项**。
