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
> ⚠️ **代际状态更新（2026-09-17）**：上面这句声明的是**下文各节判据的验证基准年代**（保留不动）。但**本机环境本身已全面升到 `0.1.5-rc.2`**，四处同代 —— ① `harness/` 装置侧（`package.json` ＋ lockfile ＋ `node_modules`，isolated 布局）② npm 全局 CLI（`%APPDATA%\npm`）③ 工程 home `.dsh-home/profiles/{sdk}`（⚠️ `larry` 已于同日退役、不在册） ④ 主 `~/.dsh` 回退层。
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

**落盘状态**：🟢 **已落盘（2026-09-17 DSH-3.7.2 收口，✅ WB 复核）** —— 落点 = **工程 `.dsh-home`**：插件实体 `profiles/sdk/node_modules/@larryagent/plugin-sandbox-dialect/`（**只 `index.js` ＋ `package.json` 两文件，且不带插件自带的 `node_modules/`**）＋ `profiles/sdk/cordis.patch.yml`（**769 B** = disable 官方 sandbox 行 ＋ insert 方言件）。⇒ ③ 的修复在生产面**已生效**（原记「已验收、未生效」作废）。⚠️ 该落点目录在 `.gitignore` 内、不入库 ⇒ 重装/换机须按 `TODO.md`「DSH-3.7.2」的步骤重做。

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
- 🟢 **已证（2026-09-17 DSH-3.7.2 收口，✅ WB 复核）**：**模型真触发一次被拒命令并看到 `[sandbox: file access denied]`** 的真 end-to-end —— 真模型 ／ **工程 `.dsh-home`** ／ client 同源通道 `dsh-prompt.mjs` ／ profile `sdk` ／ `workspace-write` 下往工作区**外**写文件（`D:\Code\larry-sbox-372\outside\denied.txt`）。
  - **双锚**：挂上修复件 ⇒ 模型侧看到 `[sandbox: file access denied under workspace-write mode]`（工具返回原文 998 B）；摘掉 ⇒ 同一命令只剩 `EPERM` 原文 ＋ `[exit code: 1]`（758 B）⇒ 两态差 **240 B = 恰好那两行标记**。两态**目标文件均未被创建**（正对照：该命令确实写不出去）。
  - **取证面 = 工具返回帧**，不是模型复述：判据取自 DSH 自己的会话日志 `$DSH_HOME/sessions/<cwd>/session-*/session.v3.jsonl.zstd` 的 `tool/result` 帧（⚠️ 该文件是**多 zstd frame 串联**，`zstdDecompressSync` 只解第一帧 ⇒ 须按 magic 切分逐帧解）。
  - ⚠️ **未闭合（脆弱性，非缺陷）**：同一装置在同一台机上**另有一次运行走了 pwsh 受限失败路径** —— 工具返回为 `CannotCreateTypeConstrainedLanguage` ＋ `无法运行 node.exe：拒绝访问`，且输出是 **GBK 乱码** ⇒ 既无 marker、也匹配不到 `PLAIN_DENIAL_WORDS` ⇒ 该路径下 `unpatched` 态会被判 FAIL。**方向是 fail-safe（假红，非假绿）**，但「命令一定走到 EPERM」这一前提**不成立**。
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

✅ **该代际落差已解除（2026-09-17 实测）**〔**当时事实** —— ⚠️ `larry` 已于同日退役，本行按原状保留〕：工程 `.dsh-home` 已升 015 —— `profiles/{larry,sdk}` 的 `package.json` 与 `node_modules` 均 `0.1.5-rc.2`（`larry`: `dsh-base` ＋ `dsh-headless`；`sdk`: `dsh-base` ＋ `dsh-sdk-app`；composition 未动，与修前基线 diff **各仅 2 行版本号**），两个 lockfile 的 `0.1.2-rc.1` 出现 **0** 次。⇒ **3.7 的 end-to-end 真实宿主（client ＋ 工程 home）现跑在 015 上**，与本项判定基准（主 `~/.dsh/profiles/sdk`，015）**已同代**。
- 本项「修复件继续有效」的结论**不变且更干净**：015 未自修（证据链见上），且该结论本就设计为「**工程 home 升 015 后仍成立**」。⇒ 修复件**仍不退役**。
- ⚠️ **遗留不变**：本项只证了"方言表未变"，`confine()` 的**运行时行为**在 015 上仍属未验 ⇒ DSH-3.7 仍走「重跑全链路复验」，**不得沿用 012 结论**。
- 📌 **实测口径（2026-09-17）**：两条 `--profile X --help` 需**显式设 `DSH_HOME=D:\Code\LarryAgent\.dsh-home`** 才正常（`exit 0`／约 2 s 自退出；**原例** `larry` 打出 `[B1-PROBE] external bundle loaded by cordis (tag=v1)` —— ⚠️ **该例已随三个 `larry` 面退役而不可复现**）。**不设**则落到主 `~/.dsh`，而该处的 `larry` profile（**已退役并真删**）只有 `dsh-base` bundle、`dependencies: {}`、**无 app 层** ⇒ 无 app 可 boot、**静默挂死（零输出且不返回）** —— 这是**用法问题、非 015 缺陷**（属 §1「会卡死所有 dsh 命令」同族的"看起来像卡死"陷阱）。⚠️ **本口径仍成立**，但其两个可复现例（工程 home 的 `larry`、主 `~/.dsh` 的空壳 `larry`）**均已随 2026-09-17 退役真删而不可复现** ⇒ 要复现此坑需**自建**一个只引 `dsh-base`、`dependencies: {}` 的 profile。

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

> ⚠️ **本段依赖的 `D:\Code\dsh-src` 工作树已于 2026-09-30 删除**（见 §8.6）⇒ **第 1 步"建工作树"本身即整体 checkout，⛔ 在 Windows 上会卡死**。本段现存价值 = **记录官方 demo 的完整跑法**（`build:lib:host` 必要性、`--ignore-scripts`、`DSH_TOOLS_MODE=ptc` 等）—— 真要跑，须先按 §8.6「重建方式」建树，**并自行承担卡死风险**；日常查源码走裸仓只读即可。

1. 建工作树：`git -C ref/dsh-bare worktree add --detach D:/Code/dsh-src dsh-v0.1.2-rc.1`（⚠️ 见上方警示）
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
6. **自定义 profile（原例 `larry`，该面 2026-09-17 已退役并真删）`patchReload` 默认 `live`**：profile 用户层 `cordis.patch.yml` 变化即热载（launcher watch-only fallback，不需要 hmr 插件）；**模块级代码 HMR 是另一个开关**（见 §8.5），别混。

### 8.5 模块级 HMR 开关（可开，非必需）

在 profile 用户层 `cordis.patch.yml` 覆盖 base 默认（base 中 hmr row 为 `disabled: true`）：

```yaml
- id: hmr
  disabled: false
```

`--dump-config` 后该 row 渲染为 `disabled: false`（覆盖生效）；开启后 headless boot 正常（`tag=v1` + `hmr enabled ok`，exit 0），**无副作用**。

> **口径**：**模块级 HMR 开关可开、且开启不影响现有 boot**；但"同进程改代码即热载"的动态观察需**长驻 profile**（web/tui 类有交互/服务生命周期），headless one-shot 跑完即退、没有观察窗口 → 该动态验证留待 web 连通一并做，**不构成阻塞**。

### 8.6 源码查阅通道（**工作树已于 2026-09-30 删除**）

- ⚠️ **`D:\Code\dsh-src` 工作树已删**（老大 2026-09-30 裁定）——原为 `ref/dsh-bare` 的 worktree、检出 `dsh-v0.1.2-rc.1`，**用途仅"追进 DSH 内部行为"**。⇒ **§8.3 A 段的源码树复跑步骤（建工作树 + `pnpm install` + demo）自此不再可用**；如需重建见下方"重建方式"。
- **查源码的默认通道 = 裸仓只读，不需要工作区**（`ref/dsh-bare` 全程只读、从未写 refs/config）：

  ```bash
  git -C ref/dsh-bare ls-tree -d --name-only <tag> packages/     # 列包
  git -C ref/dsh-bare show <tag>:<路径>                          # 读文件
  git -C ref/dsh-bare grep -i "<词>" <tag> -- <路径>              # 跨版本搜索
  ```

- **确需实体文件时只做「按需局部检出」**：`git -C ref/dsh-bare --work-tree=ref/dsh-wt checkout <tag> -- packages/<包>` —— 只写出该包。
- ⛔ **不要在 Windows 上做整体 checkout**（9,080 文件 × 实时防护逐文件扫描 ⇒ 实测卡死 5.5 小时；本地已有两次踩坑记录）⇒ 这也是**删除 `dsh-src` 的根本理由**：工作树本身即"整体检出物"，重跑只能整体 checkout。
- **重建方式**（确需时）：`git -C ref/dsh-bare worktree add --detach D:/Code/dsh-src <tag>`，用完 `git -C ref/dsh-bare worktree remove D:/Code/dsh-src` ＋ `worktree prune` 清注册。
- `dsh plugin` 仅写 `$DSH_HOME/profiles/<name>`（隔离 DSH_HOME 内），**不触碰用户级全局 profile / `~/.dsh`**。

---

### 8.7 pnpm 树维护与核对口径（🟢 2026-09-17 实测，DSH-3.7.3 复验）

1. **调用通道：本机必须用 `pnpm.cmd`** —— 裸 `pnpm` 在本机 Bash 通道下**必崩**：npm 的 sh 垫片依赖 `sed`/`dirname`/`uname`（PATH shim 下不存在），且即使绕过也会把入口解析到 **`D:\node_modules\pnpm\bin\pnpm.mjs`**（错根）⇒ 报 `Cannot find module 'D:\node_modules\pnpm\bin\pnpm.mjs'` **是通道问题、不是工程问题**。自证式：`pnpm.cmd -v` = **`11.7.0`**（与 `harness/package.json` 的 `packageManager` 一致）。⛔ 不得改用 `npm` / `yarn` —— 会重排整棵树。
2. **树回收路径：改完 lock 与声明后，常规 `install` 可能不回收到位** —— 实测（3.7.3，本机与 CVM 同形）：lock 与声明都改对后，`install --offline --no-frozen-lockfile` 报 `Packages: -4` ／ `exit 0`，但**遍历复扫树仍见旧包**；**重命名** `node_modules/.modules.yaml` ＋ `.pnpm-workspace-state-v1.json`（→ `*.bak.<ts>`）后再 install，树才回收（`stale = []`）。
   - ⚠️ **机理未证、勿编**：这两个文件**本身不含旧包条目**（实测 `0.0.1-rc.1` 计数 = **0**；`.modules.yaml` = 98570 B ／ 1674 行 `hoistedDependencies`）⇒ **「缓存里留着旧记录」被证伪**。合理猜测是「删掉它们 ⇒ pnpm 放弃增量短路、走全量校验」，但**该句是推断、未证**。
   - ⚠️ **`--force` 是否必需未定**（清状态文件后的 install 与随后 `--force` 之间未复扫）⇒ 只可说「该组合起效」，不可断言 `--force` 是必要条件。
3. **核对口径：判「树里有没有某个包」必须读 `package.json`，不可用目录名匹配**
   - `.pnpm` 下的目录名是**截断名**（实测 `@deepseek-ai+dsh-sandbox-lo_fc402b20f9faa9a7c02be663a2ee4def`，`local` 被砍掉）⇒ 用包名 glob 匹配**必然 0 命中**；更隐蔽的是**截断名恰为全长名的前缀** ⇒ 用「子串包含」判定会得到**恒为 0 的假命中**（实测踩过两次）。
   - 正确姿势：遍历 `node_modules/.pnpm/*/node_modules/{@scope/}*/package.json`，读其 `name` / `version` 比对。⚠️ scope 目录（`@deepseek-ai`）**自身没有 `package.json`**，别把它当空壳。
   - **更强的判据（树 vs lock 全量对齐）**：把树里读出的 `name` 集合与 lock `packages:` 段的 key 比对 ⇒ 「**树有 lock 无**」应为 **0**（无多余包）；「**lock 有树无**」应**全为异平台 optional**（本机实测 91 项，全是 `sharp` ／ `node-addon-system-*` 的 darwin/linux/wasm 支）。
   - ⚠️ **「物理目录数」≠「版本数」**：同一版本因 **peer 变体**会有多个物理 entry（实测清理后 `dsh-sandbox-local` **3** 个 entry ／ `dsh-storage-domain` **5** 个 ／ `sandbox-windows-acl` **2** 个，而**版本集合各只一支**）⇒ 报「支数」须**注明是版本数还是物理目录数**，否则会把 peer 变体误读成「没清干净」。
4. **⚠️ `cp -r` profile 到临时 home ⇒ pnpm 直接拒（判「装置跑不起来」用，2026-09-17 实测；✅ 2026-09-20 已修，见末条）** —— profile 的 `node_modules/.modules.yaml` 里 **`virtualStoreDir` 是源 profile 的绝对路径**（实测 ＝ `D:\Code\LarryAgent\.dsh-home\profiles\sdk\node_modules\.pnpm`，且 `"nodeLinker": "hoisted"`、`storeDir` ＝ `D:\.pnpm-store\v11`）⇒ 复制到临时 home 后 pnpm 算出的是**副本路径** ⇒ 二者不一致 ⇒ **`ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`、`exit 1`，且发生在解析依赖之前**（⇒ 与「包在不在树里」**无关**）。
   - **现象**：依赖 `installPlugin` 的装置（如 `run-s0-e2e.mjs` 的各变体）报 `plugin add: exit=1` ／ `dsh: pnpm failed in profile directory <临时home>\profiles\sdk`，**看着像工程坏了、实为复制姿势**。
   - ✅ **已实施（2026-09-20，`4a2bb5b`）**：`cpSync` 出副本后**删掉副本的 `node_modules/.modules.yaml`**，交给 pnpm 重建（`s0-e2e.test.ts`：定义 `:128-141`／调用 `:276`）⇒ 本机五变体 5/5 全绿（Trae 两轮 ＋ Claude 两轮，判据字段逐条一致）。**成因 = pnpm 的平台分支**（Windows 写绝对 ／ POSIX 写相对）**＋ pnpm store 按卷回落 —— 机制见 §12.1 ／ §12.2**。⚠️ 本机 `.dsh-home` 的 profile 现场建于 `2026-09-17 00:11`（早于 3.7.3 的依赖清理约 19.7 h）⇒ **该失效非本次清理所致**。

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
| `node` | **`22.22.2`**（managed `…\.workbuddy\binaries\node\versions\22.22.2-3`，`command -v node` 命中它） | 同机 `D:\App\node\node.exe` 直呼 = **`24.14.1`** |
| PATH | — | 无 `.qoderwork\bin`（对方进程注入物，不在持久 PATH） |

⇒ **纪律**：任何"本机环境"结论**必须写明取自哪个运行时**（与 §7「判据必须取自真实运行时」同源）。
⭐ **2026-09-17 追加实证（同机两条通道给出不同 node）**：WB 的 Bash 通道 `node -v` = **`22.22.2`**，而 `D:\App\node\node.exe -v` = **`24.14.1`** ⇒ 派发稿若只写「node 22.22.2」而**未注明通道**，执行方在另一条通道上会读到另一版本并**报为矛盾**（DSH-3.7.3 实际发生过一次）⇒ **写器材基线必须写「版本 ＋ 取自哪条通道」**。拿某一棵树的结果去描述"本机"，会得到互相矛盾且不可复现的结论——这正是 QoderWork 报告多处失准的根因。

### 10.2 实测成立（持久层，与 DSH 开发相关）

- **Python 多入口并存**：持久 User `PATH` 含 `…\Programs\Python\Python311\`。`python` → **3.11.9**，`py -3` → **3.14.3**。⇒ 脚本一律显式 `py -3.x` 或绝对路径，**勿依赖裸 `python`**。
- **`git` 全局硬编码代理**：`http.proxy` = `https.proxy` = `socks5://127.0.0.1:7890`（用户梯子）。⇒ **梯子关时，`git fetch/pull/push` 与依赖 git 的插件安装会一起失败**；需临时 `git -c http.proxy= -c https.proxy=`（本机直连 GitHub 会被 reset；见决策稿 §3.4「DSH-2.6 收口复核」）。
- **行尾**：仓库内 `core.autocrlf=true`，全局未设 ⇒ 跨 AI 协作行尾噪声的来源（本仓治理检查已含"末字节与 HEAD 逐字节比对"）。
- **控制台编码**：中文 Windows 默认 GBK/CP936，且 User 层未设 `PYTHONUTF8` —— 与 §4.1「编码层」同源，是 ① 层缺口的环境底色。
- ⭐ **工具输出的语言与编码（判"证据原文"用，2026-09-17 实测）**：中文 Windows 上 `taskkill` 的成功输出**恒为 GBK 中文**（原始字节 `b3c9b9a6…` ＝ `成功: 已终止 PID 为 <pid> 的进程。`），`tasklist` 无匹配 ＝ `信息: 没有运行的任务匹配指定标准。`；`GetACP` ／ `GetConsoleOutputCP` ＝ **936**、`GetUserDefaultUILanguage` ＝ **0x804**（zh-CN）。⇒ **node 的 `spawnSync(cmd, …, {encoding:'utf8'})` 读这些输出必得替换字符乱码**（实测：`����: �޷���ֹ …`），**绝不会**得到英文（**前提：该进程确实按 ACP 输出、且未经本地化**）。⇒ 凡把这类输出当「证据原文」存盘 ／ 引用：① 须按 **ACP（936）** 解码。
  - ⛔ **原 ②「出现英文 ⇒ 不是本机该进程的原始产物」已作废（2026-09-20 实测推翻）**：同一台机器、同一条路径**能**产出英文 —— `icacls` 92 次采样中 **2 次英文**；PS 5.1 在**带 DSH 编码前导码**的形态下 **11/12 出英文**（而系统/用户 UI 语言实测确是 zh-CN）。⇒ **语言 ／ 编码不得作"证据是否被后处理"的判据**（该条曾误伤 Trae 的 3.7.4 证据）。完整实测与替代纪律见 **§12.6**。

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

---

## 12. DSH-3.7.4 复验沉淀 · Windows 装置类事实与判据纪律（🟢 2026-09-20 WB 复验：源码 ＋ 字节级实测）

> **来源**：WB《DSH-3.7.4 ／ DSH-3.7.4-T · 复验判定》（2026-09-20），原载交流区 `exchange/log-workbuddy.md` —— **该段已随交流区清理**（回溯 `git show 5a1763d:exchange/log-workbuddy.md`）。本节只收**跨块可复用**的事实；3.7.4 的判据与验收基准仍在 `TODO.md`。
> **证据等级**：§12.1 ／ §12.2 ／ §12.5 为 🟢 **源码逐行 ＋ 独立实测**；§12.3 ／ §12.4 为 🟢 **独立复跑最小装置**（**§12.3 另于 2026-09-21 补齐 POSIX 侧**，两平台各自取证）；§12.6 为 🟢 **多轮采样**（但**触发机制未定**，见该节）；§12.7 为 🟢 **env 实测 ＋ 源码定位**（2026-09-20 追加）。
> **本节范围**：**12.1–12.6** = DSH-3.7.4 复验沉淀的**装置类事实**；**12.7** = **本机临时区（`TEMP`／`Sys`）语义**（**非 3.7.4 产物**，同日追加）；**12.8** = 未闭合指针（已转入 `TODO.md`）。

### 12.1 pnpm `virtualStoreDir` 的平台分支 ⇒ `cp -r` profile 必失效（3.7.4 的成因）

实物源码 `…\npm\node_modules\pnpm\dist\pnpm.mjs`（本机 pnpm 11.7.0）：

| 行 | 内容 |
|---|---|
| `:155097` | `async function writeModulesManifest(modulesDir, modules)` |
| `:155114-155116` | **平台分支**：`if (!isWindows()) { saveModules.virtualStoreDir = path.relative(modulesDir, saveModules.virtualStoreDir) }` ⇒ **Windows 写绝对 ／ POSIX 写相对** |
| `:155060-155064` | 读侧：缺省 = `join(modulesDir, '.pnpm')`；**相对值**按 `join(modulesDir, …)` 还原 ⇒ **跟着副本走、自洽** |
| `:187869` ／ `:187876` | `UnexpectedStoreError` ／ `UnexpectedVirtualStoreDirError`（均在 `checkCompatibility` 内，**先于依赖解析**） |

⇒ 本机（Windows）profile 的 `.modules.yaml` 记的是**源 profile 的绝对路径**；`cp -r` 到临时 home 后 pnpm 按**副本路径**复算 ⇒ 不一致 ⇒ `ERR_PNPM_UNEXPECTED_(VIRTUAL_)STORE`、`exit 1`、**在解析依赖之前退出**。
⇒ **读侧独立验证**：本机三处 `.modules.yaml` 的 `virtualStoreDir` **全为绝对**（`harness` = isolated ／ `.dsh-home/profiles/sdk` = hoisted ／ `~/.dsh/profiles/sdk` = hoisted）。
⇒ **已实施的修法**见 §8.7 第 4 条末条（`4a2bb5b`：删副本的 `.modules.yaml`）。⚠️ 副作用 = 删含 `node_modules` 的副本变慢 ⇒ 同提交把 `describe` ／ `afterAll` 超时放宽到 `900_000`（`s0-e2e.test.ts:310` ／ `:434` ／ `:456`；原 vitest 默认 `hookTimeout` = 10 s）。

### 12.2 ⭐ pnpm store 的位置**按卷回落**，不是全局配置

`getStorePath`（同文件 `:161743-161785`）逻辑：先试「家目录 store 能否与 `pkgRoot` **hardlink**」——
- **能**（同卷）⇒ 用家目录 store（`%LOCALAPPDATA%\pnpm\store\vN`）；
- **不能**（**跨卷**，hardlink 不成立）⇒ 落到 **`pkgRoot` 所在卷的根**：`<mountpoint>\.pnpm-store\<ver>`；异常再回落家目录。

⇒ **实测逐字印证**（同一 pnpm 11.7.0，仅换 cwd）：

| cwd | `pnpm store path` |
|---|---|
| `D:\Code\LarryAgent` | **`D:\.pnpm-store\v11`** |
| `C:\Users\SuLarry` | **`C:\Users\SuLarry\AppData\Local\pnpm\store\v11`** |

⇒ **不是谁配的**：`~/.npmrc` 只有 registry 一行；`pnpm config get store-dir` = `undefined`；env 无 `PNPM_HOME` ／ `npm_config_store_dir`；DSH 各包内搜 `store-dir` ／ `.pnpm-store` ／ `PNPM_HOME` = **0 命中**。
⇒ **对判据的用处**：同一 profile 被拷到**另一个卷**，`storeDir` 与 `virtualStoreDir` 会**双双换值** ⇒ 报"两侧 `.modules.yaml` 不同"时，**先看卷、再看内容**（这正是 3.7.4 那场"换了源就暴出第二个字段"的机制）。

### 12.3 「把目录设成只读」的正确与错误手段（**两平台各自取证** —— Windows = T-1 2026-09-20 ／ POSIX = T·P 2026-09-21）

**§12.3.1 · Windows 侧**（本机 · node v24.14.1）：

| 手段 | 实测结果 |
|---|---|
| `fs.chmodSync(dir, 0o500)` | ❌ **不成立** —— 落成 `0o444`（只翻「只读」属性，Windows 对目录忽略该位）；`writeFileSync` ／ `mkdirSync` **照常成功** |
| `fs.accessSync(dir, W_OK)` | ⛔ **不可当判据** —— 在 `0o444` 下**照样通过**（只查属性位、不试写） |
| `icacls <dir> /deny <me>:(AD,WD)` | ✅ **成立** —— `writeFileSync`／`mkdirSync` 双双 `EPERM: operation not permitted`（`errno:-4048`）；`icacls <dir> /remove:d <me>` 撤销且**幂等** |

**§12.3.2 · POSIX 侧**（CVM · **非 root** · node v22.22.2 · 取自 `917f45d` 版树）：

| 通道 | 身份 ／ 文件系统 | `mode@0o500` | `writeFile` ／ `mkdir` | `accessSync(W_OK)` |
|---|---|---|---|---|
| A `~/tp-scratch-ext4` | `uid=1000` ／ ext4（`/dev/vda2`） | `0o500` | **`EACCES` ／ `EACCES`（`errno -13`）** | 抛 `EACCES` |
| B `/dev/shm/tp-scratch` | 同上 ／ tmpfs | `0o500` | **逐字段同 A** | 抛 `EACCES` |
| C `/tmp/tp-root`（**root 对照**） | `uid=0` ／ ext4 | `0o500` | **`ok` ／ `ok`** | **通过** |
| （正对照：同目录 `0o700`） | 非 root ／ ext4 | `0o700` | `ok` ／ `ok`（落 2 件产物） | — |

⇒ ✅ **POSIX 侧成立**：非 root 下 `chmod 0o500` 是真写保护（`EACCES`）。⚠️ **文件系统维度不改变结论**（A 与 B 逐字段一致）。
⇒ ✅ **root 对照把因果坐实**：C 与 A／B 的**唯一**差异是"写成功"，而 `mode@0o500` 三者皆为 `0o500` ⇒ 权限位**确实设上了**，差异 **100% 来自 root 绕过 DAC**。
⚠️ **两平台对 `accessSync(W_OK)` 都不可采为判据，但理由相反** —— Windows：**照样通过**（只查属性位、不试写）；POSIX：**抛 `EACCES`**（它确实按权限位拒了，但它**不试写** ⇒ 与"落盘必失败"不是同一命题）。
⚠️ **版本限定**：POSIX 结论取自 CVM 的 `917f45d` 版树（无 git 的同步副本、落后本机 3 天；已定**不同步**，见 `TODO.md` 3.7.4 段处置表 #5）⇒ ⛔ 不得当"当前版本"外推。**WB 补证收窄一条**：本机新版 `s0-e2e.test.ts:311` 的 POSIX 分支仍是同一行 `chmodSync(dir, 0o500)`（`:296` 起才分平台）⇒ 与 CVM 旧版**行为等价**；但**仍未在新版树上实跑**。

⇒ 装置 `s0-e2e.test.ts` 的 `no-session-dir` 变体已按平台分支：**Windows 走 `icacls`，POSIX 保留 `chmodSync(dir, 0o500)`**；两臂**各自成立**（Windows 侧 T-1 ／ POSIX 侧 T·P）—— ⛔ 但**结论仍不可跨平台外推**。
⚠️ 附带：装置里 `spawnSync('icacls', …, {encoding:'utf8'})` 在本机**必得乱码**（icacls 恒按 ACP 936 输出）——该行**不承载判据**，但原作者须知道它落盘不会是中文。

### 12.4 Windows 上「杀进程组」不可行 ⇒ 必须回落

`process.kill(-pid, 'SIGKILL')`（负 PID = 进程组）在 Windows **必抛 `ESRCH`（errno -4040）且直连子进程仍活** ⇒ 装置必须走 `child.kill('SIGKILL')` 回落（`s0-e2e.test.ts:241`）。
⚠️ 本探针拓扑下**回落仍能带走孙进程**（stdio = ignore ／ pipe 两形态皆然）—— 这是"**在该拓扑下**"的观察，**不可外推**成"任何形态都能带走"。

### 12.5 DSH pwsh 工具：可执行文件解析 ＋ 编码前导码（解释"输出为何常是英文"）

- **可执行文件解析在 `dsh-pwsh-local`**（`dsh-tool-pwsh` 只委派给 `ctx.shell`）；`resolvePwshPath` 候选顺序：
  1. `%ProgramFiles%\PowerShell\7\pwsh.exe`（⑦）→ 2. `%PATH%` 各项 `\pwsh.exe` → 3. `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`（5.1 兜底）
  - ⚠️ **本机 `pwsh` ⑦ 不存在**（`shutil.which('pwsh')` = `None`、`C:\Program Files\PowerShell` 无）⇒ 本机解析**只能落到 PS 5.1**。
  - ⚠️ 注意 `pwsh` ≠ `powershell`：任何"本机 pwsh 行为"的结论**先定该程序是哪一个**（两者本地化资源与默认编码都不同）。
- **`ENCODING_PREAMBLE`** 定义在 `dsh-pwsh-local/lib/index.js:158`、拼接在 `:278` —— 即 `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); …`。
- ⭐ **该前导码形态实测倾向英文 ＋ UTF-8**：「前导码 ＋ 报错」**11/12 出英文**，而**单语句短命令** 12/12 中文。⇒ **DSH pwsh 的输出本来就偏英文**，那里**不存在**"本地化中文原文"。

### 12.6 ⭐ 判据纪律：**语言与编码不得作"证据是否被后处理"的判据**（本条订正 §10.2 末条）

§10.2 末条原立「**出现英文 ⇒ 不是本机该进程的原始产物**」为**硬判据** —— **该全称命题不成立**（2026-09-20 实测推翻）：

| 观察 | 结果 |
|---|---|
| `icacls` 92 次采样（裸名／全路径／大小写三种拼写各 20 次起） | **90 中文 ／ 2 英文**；英文那次与某证据行**逐字符同形** |
| PS 5.1（**同 exe、同 flags、同命令**） | 出现过 `en-US ＋ 英文`（6/6、11/12）与 `zh-CN ＋ 中文`（12/12、5/5）**两种稳定态**；`[CultureInfo]::CurrentUICulture.Name` 实测值与消息语言**一一对应** |
| 系统 ／ 用户默认 UI 语言 | `0x0804`(zh-CN) ／ `MachinePreferredUILanguages = ['zh-CN']` ／ `InstallLanguage = 0804` —— **不解释**英文 |

**已实测排除的六类候选**：系统／用户 UI 语言、`SetProcessPreferredUILanguages`、`LANG`／`LC_ALL`／`DOTNET_CLI_UI_LANGUAGE`、PATH 形态与裸名/全路径拼写、`pwsh` ⑦ 是否存在、icacls 路径形态。
⇒ **触发机制至今未定**（且在不承载判据时不必追；留一条未测线索：restricted token 沙箱链 —— **是猜测，不是结论**）。

**替代纪律**（可直接抄进派发稿）：
- ⛔ **不得**由「输出是英文」推出「证据被人工改写」；⛔ 也**不得**反推"必是本机原产"（双向都不下结论）。
- ✅ 判「原文」只认**字节级**核对（编码按 **ACP 936** 解 GBK，或直接比原始字节）；**每段引用须注明取自哪条通道**（原生 shell ／ DSH pwsh ／ 沙箱运行器）。**通道不同则结论不可互推**。
- ✅ 派发稿口径改为「**⛔ 禁止人工改写 ／ 意译；工具链自身的语言与编码差异须原样保留，并注明该段取自哪条通道**」——原「禁把本地化文字英文化」在 DSH pwsh 路径上**必然误伤**（每次都会被判"疑似英文化"）。

### 12.7 ⭐ `TEMP` ／ `TMP` 指向 `D:\Temp\Sys` —— 该目录是**系统临时区**，不是 AI 可以扫荡的杂项区（2026-09-20 追加）

> **动机**：本机把 `TEMP`／`TMP`／`TMPDIR` 定向到了 `D:\Temp\Sys`（系统默认在 C 盘）。该事实**不在任何仓库文档里**，只能从 env 现场读到 ⇒ **AI 极易把它当成"几个 AI 堆出来的杂物区"而去清理**（2026-09-20 本轮清理时差点如此，靠老大口述才划清边界）。故落此节。

**一、事实（实测）**

- `TEMP` ＝ `TMP` ＝ `TMPDIR` ＝ **`D:\Temp\Sys`**；Python `tempfile.gettempdir()` 同值 ⇒ 它就是本机 **TEMP 本体**。
- ⚠️ 边界易错：**`D:\Temp` 本身不是 TEMP**，只有其下的 `Sys\` 是 ⇒ `D:\Temp\<别的>`（如探针产物）与 `D:\Temp\Sys\<系统临时物>` **语义完全不同，不可一并处理**。

**二、语义（Windows 侧的准确表述）**

| 常见说法 | 判定 |
|---|---|
| "属于系统规则的一部分" | ⚠️ **宜改述** —— **文件系统层面它就是普通目录**（无自动过期、无 tmpfs／内存语义，ACL 与普通目录同级，仅默认更宽）。"临时"是**约定**、不是**机制**：**违反约定没有系统兜底**（不会自动过期，也无恢复通道）。 |
| "随便删也没事" | ⛔ **错** —— 删掉**正被某进程占用**的临时文件 ⇒ 运行中程序报错／崩溃／安装失败／丢数据；且**目录里没有任何标记能区分活跃与垃圾**。 |
| "清理太频繁没意义" | ✅ 成立，但**主因是风险（活跃文件），不是效率**（IO 成本是次要项）。 |
| "里面的东西不保证持久性、要接受随时不存在的风险" | ✅ **最准确，一字不用改** —— 这是契约对**放东西的一方**的义务面。 |

- ✅ **系统自带清理器（存储感知／磁盘清理）才是安全通道**：它**只清「超过 N 天未被访问」**的文件 ＝ 主动避开活跃文件 ⇒ **要清就交给它，不要人工扫荡**。
- **契约两侧的义务**：放东西的一方（软件）**不得存唯一副本**、用完自清、不得假定它还在；清东西的一方（人／清理器）**不得主动扫荡**。

**三、对本项目的推论（可执行）**

1. ⛔ **证据／需要复核的产物不得落 TEMP** —— 系统清理器 N 天后可回收 ⇒ **证据可能在有人复核之前就没了**。
2. ⚠️ **现状盘点（本轮实测）**：装置证据**默认就落 TEMP** —— `harness/tests/s0-e2e.test.ts:51` ／ `s0-resume.test.ts:49` 均为 `EVIDENCE_DIR = process.env.S0_EVIDENCE_DIR ?? join(tmpdir(), 'larry-s0-evidence' ／ 'larry-s0-resume-evidence')`。**走 `run-s0-e2e.mjs` 时被 `S0_EVIDENCE_DIR` 覆盖到仓库 `.s0-evidence`（正规通道安全）；绕过 runner 直跑 vitest 才落 TEMP。**
3. ✅ 其余落 TEMP 的皆为 `mkdtempSync` 出来的临时 home（`larry-test-*`／`larry-s0-*`／`larry-test-realapi-*`）—— **符合契约**，丢了不影响。
4. ⚠️ **`plugin-sandbox-probe` 属契约边缘用法**：`packages/plugin-sandbox-probe/lib/index.js:192`（`src/index.ts:280`）在 TEMP 里建**半持久**工作目录 `larry-sandbox-probe`（＋ `larry-sandbox-probe-ambient.txt`），并 `readdirSync(tmpdir())` 采样 ⇒ **假定它还在**。探针插件可接受，**登记备查**。
5. ✅ **`Sys` 不做人工清理**（与"清理太频繁无意义"同向）：里面的测试残留（`larry-*`）交**系统清理器或装置自清理**。

**四、给 AI 的读法（一句话）**

`D:\Temp\Sys` **既不是自由文件夹，也不是你的垃圾堆** —— 它是**别人的临时区**：**别往里写需要留存的东西，也别去扫它。**

### 12.8 未闭合（已转入 `TODO.md`，勿在本节追）

- J6 中「**连 `node.exe` 也起不来**」那一层的成因（只复现出 ConstrainedLanguage 半层）。
- J6 **未由 Claude 独立重放**（本轮只做了原始帧解码复核）。
⇒ 上述两条的承接位置（⚠️ **2026-09-30 订正**：两条现已**分居两段**，勿再当一处）：
  - 「`node.exe` 起不来成因」→ `TODO.md`「**延后（低优先 · 待触发）**」段（仍未触发）；
  - 「J6 独立重放」→ ⭐ **老大 2026-09-30 裁「从『延后』收回」** ⇒ 现为 `TODO.md`「**待派发**」段的**正式待办**（执行人 Claude ／ 场地本机 Windows）。
（另两条已由老大裁掉：英文触发机制**关闭收口**并降为规则（即本条 §12.6）；`④_bytesAtKill` **降级为参考项**——它本就不是断言项。）
- `no-session-dir` 的 **POSIX 分支**未在 Linux 上验过 ⇒ **不属延后**，属**发版前必做**（见 §12.3）。**已转出（2026-09-20）** ⇒ 承接位置 = `TODO.md` 3.7.4 段处置表 **#5** ＋ **`archive/roadmap-history.md` 的 `##### DSH-3.7.4-T`**（⚠️ **2026-09-30 订正**：原写「派发稿 `exchange/log-claude.md` 的 `DSH-3.7.4-T·P` 块（实际跟踪点在后者）」—— 该块已于 2026-09-21 复核后收口 ⇒ **活区指针已失活，改为指向定案区**）。
