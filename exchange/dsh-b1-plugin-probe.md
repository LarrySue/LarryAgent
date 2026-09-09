# DSH-2.1 / DSH-2.2 短路点验证报告（Trae · 2026-09-09）

> **基线版本**：`dsh-v0.1.2-rc.1`（全链路锁定，装包/源码/tag 三处核对一致）
> **任务来源**：`exchange/log-trae.md`【在飞 · 2026-09-09 派发】DSH-2.1 / DSH-2.2
> **性质**：路线级短路点实测报告（对应 docs/dsh/dsh-migration.md §3.6 之后的 A-framework 前置验证）
> **证据存放**：本报告在 exchange/（讨论稿区，未动 docs/）；挂载产物在 `harness/`（随代码提交）；源码工作树在 `D:\Code\dsh-src`（仓库外，可随时重建/清理）

---

## 1. 两个问题的结论（二值）

1. **DSH-2.2**（官方 demo 能否在本机 Windows 跑通一次完整会话）：**能**
2. **DSH-2.1**（自做 Cordis 插件能否经 B1 通道挂进 DSH 并被 cordis 实际加载）：**能**

两者都不是"环境能装/能起服务"，而是**跑通到"LLM 完整回复 + 我们插件 apply 被实际执行"**。

---

## 2. 环境事实

| 项 | 值 |
|---|---|
| OS | Windows（PowerShell，x64） |
| Node | v24.14.1（`D:\App\node\node.exe`，root `package.json` engines 要求 `^22.19.0 \|\| >=24` 命中） |
| pnpm | 11.7.0（`npm i -g`，root `packageManager: pnpm@11.7.0` 精确一致） |
| dsh | `@deepseek-ai/dsh@0.1.2-rc.1`（npm 全局，`dsh --version` → `0.1.2-rc.1`） |
| DSH_HOME | `D:\Code\LarryAgent\.dsh-home`（任务指定，`.gitignore` 已含） |
| profile | `larry` → `.dsh-home/profiles/larry/`（模板 `dsh-base` + `dsh-headless` + 我们的 `@larryagent/plugin-probe`） |
| 模型凭证 | 测试 key（老大提供，**仅经环境变量** `DEEPSEEK_API_KEY` 注入，未落任何文件） |
| 真实回复验证 | `deepseek-official` 直连，无 mock（出参即真实模型回复） |

**重要口径**：官方 demo 与 B1 验证均用**编程/打包入口**（`node apps/cli/src/bin.ts`、npm 全局 `dsh` 的 `lib/bin.js`），全程未碰 Windows 官方 `dsh.exe`（第 0 项硬发现其 segfault，且本机也并未安装该 native 包）。

---

## 3. 工程结构树 + 关键文件内容

### 3.1 交付物（LarryAgent 仓库内，随本次提交）

```
harness/                                  # 仓库根，与 backend/ client/ 并列
├── package.json                          # @larryagent/harness（private，type: module）
├── pnpm-workspace.yaml                   # packages: ["packages/*"]
├── tsconfig.json                         # TS 6 基座（moduleResolution: Bundler 等）
├── .gitignore                            # lib/ + node_modules/（不污染根 .gitignore）
└── packages/
    └── plugin-probe/                     # 首个自做插件：空骨架，无任何业务逻辑
        ├── package.json                  # name: @larryagent/plugin-probe
        ├── tsconfig.json                 # src/ → lib/（产物不入 git）
        ├── cordis.patch.yml              # dsh.bundle.patch 指向的 profile 层
        └── src/index.ts                  # name + inject + apply（breadcrumb 唯一副作用）
```

### 3.2 关键文件内容

`harness/packages/plugin-probe/package.json`（bundle 声明——B1 挂载的判定依据）：

```json
{
  "name": "@larryagent/plugin-probe",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": { "types": "./lib/index.d.ts", "default": "./lib/index.js" },
    "./cordis.patch.yml": "./cordis.patch.yml",
    "./package.json": "./package.json"
  },
  "scripts": { "build": "tsc -p tsconfig.json" },
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

`harness/packages/plugin-probe/cordis.patch.yml`（profile 层插行）：

```yaml
- insert:
    - id: larry-probe
      name: '@larryagent/plugin-probe'
      config:
        tag: 'v1'
```

`harness/packages/plugin-probe/src/index.ts`（无业务，只留 breadcrumb 副作用）：

```ts
export const name = 'larry-probe'
export const inject: string[] = []
export function apply(_ctx: Context, config: { tag?: string }): void {
  const tag = config.tag ?? 'untagged'
  process.stderr.write(`[B1-PROBE] external bundle loaded by cordis (tag=${tag})\n`)
}
```

> 范式对照：`@deepseek-ai/dsh-tool-fs`（`packages/fs/tool-fs/src/index.ts:22` 起）是 `export const inject` + `apply(ctx, config)`，我们的空骨架是其最小投影。任务里 "line 22" 与第 0 项报告标的 52 行号差异——实测正确入口在 `src/index.ts` 的 `export const inject` 后。

### 3.3 构建产物（git 排除）

`harness/packages/plugin-probe/lib/index.js` + `lib/index.d.ts`（tsc 编译，`harness/.gitignore` 排除 lib/）。

---

## 4. 挂载验证的原始输出

### 4.1 DSH-2.2：官方 demo 完整会话

命令（隔离 DSH_HOME，`DSH_TOOLS_MODE=ptc`，源码入口）：

```
$env:DSH_HOME = "D:\Code\dsh-src\.dsh-home-demo"; $env:DEEPSEEK_API_KEY = "<key>"; $env:DSH_TOOLS_MODE = "ptc"
node scripts/demo-ptc.mjs "Reply with exactly: hello from dsh"
```

stderr/stdout 原始输出（末尾）：

```
hello from dsh
```
exit code = 0；`.dsh-home-demo/sessions/` 下生成 2 个 `session.jsonl`（LLM 调用持久化证据）。

> 关键中间步：源码树首次跑 demo 崩于 `typert-loader: … lib/typert.host.js Cannot find module` —— 因源码工作树无构建产物（`lib/` 被 gitignore）。headless 基于 dsh-base（含 `typert-loader`，运行时动态 `import` 各包的 `exports "./typert"` 产物）。需先 `pnpm run build:lib:host` 生成全部 host 产物后 demo 即通。**这是"源码跑 demo 必须 build"的硬前提，WB 复跑必须包含。**

### 4.2 DSH-2.1：B1 挂载 + cordis 实际加载（核心证据）

步骤 1 —— 挂载（npm 全局 `dsh`，`plugin --profile` 通道）：

```
$env:DSH_HOME = "D:\Code\LarryAgent\.dsh-home"
dsh plugin --profile larry add D:/Code/LarryAgent/harness/packages/plugin-probe
```

reconcile 后 profile manifest（`bundles` 自动纳入 plugin-probe —— 这就是 B1 的"挂进 profile 层"）：

```json
"dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-headless", "@larryagent/plugin-probe"], "patchReload": "live" } }
```

步骤 2 —— 静态挂载证据（`--dump-config` 逐层渲染）：

```
# == @larryagent/plugin-probe
- id: larry-probe
  name: '@larryagent/plugin-probe'
```

步骤 3 —— **动态加载证据（cordis 实际执行了我们的 apply）**：

```
$env:DEEPSEEK_API_KEY = "<key>"
dsh --profile larry "Reply with exactly: probe loaded"
```

stderr 首行（PowerShell 会把原生 stderr 包装成 error 流显示，内容本身干净）：

```
[B1-PROBE] external bundle loaded by cordis (tag=v1)
```

stdout（LLM 完整回复，真实模型出参）：

```
probe loaded
```
exit code = 0。

### 4.3 HMR 可选项（模块级热重载开关）

larry profile 用户层 `cordis.patch.yml` 覆盖 base 默认（base 中 hmr row `disabled: true`）：

```yaml
- id: hmr
  disabled: false
```

`--dump-config` 后该 row 渲染为 `disabled: false`（覆盖生效）。开启后 headless boot 回归正常（`tag=v1` + `hmr enabled ok`，exit 0），**无副作用**。

结论口径：**模块级 HMR 开关可开、且开启不影响现有 boot**；但"同进程改代码即热载"的动态观察需要长驻 profile（web/tui 类有交互/服务生命周期），headless one-shot 跑完即退没有观察窗口 —— 该动态验证留待 web 连通（DSH-2.3）一并做，本项**不构成阻塞**。

---

## 5. 可复跑步骤（干净状态）+ 踩坑清单 + 隔离自检

### 5.1 可复跑步骤

前置：`node ≥24`、`npm i -g pnpm@11.7.0`、`npm i -g @deepseek-ai/dsh@0.1.2-rc.1`（`dsh --version` 应打 `0.1.2-rc.1`）；源码查阅/运行走 `ref/dsh-bare` 只读（`git -C ref/dsh-bare show dsh-v0.1.2-rc.1:<path>`）。

A. **DSH-2.2（源码 demo）**
1. 从 bare 仓库建工作树：`git -C ref/dsh-bare worktree add --detach D:/Code/dsh-src dsh-v0.1.2-rc.1`
2. `cd D:\Code\dsh-src && pnpm install --ignore-scripts`（56s，1001 包；`--ignore-scripts` 跳过 lefthook，**必须**）
3. `pnpm run build:lib:host`（**必须**，否则 typert-loader 找不到 `lib/typert.host.js`）
4. `$env:DSH_HOME="D:\Code\dsh-src\.dsh-home-demo"; $env:DEEPSEEK_API_KEY="<key>"; $env:DSH_TOOLS_MODE="ptc"; node scripts/demo-ptc.mjs "Reply with exactly: hello from dsh"` → 期望 `hello from dsh`，exit 0

B. **DSH-2.1（B1 挂载，npm 全局入口即可，无需源码树）**
1. `harness/`：`pnpm install && pnpm run build`（产出 plugin-probe 的 lib/）
2. `$env:DSH_HOME="D:\Code\LarryAgent\.dsh-home"; dsh plugin --profile larry add @deepseek-ai/dsh-base@0.1.2-rc.1`（230 包；装完手工把 profile 的 `pnpm-workspace.yaml` 里 `allowBuilds:` 待审批块全设 `false` 后重跑一次到 exit 0）
3. 同上 add `@deepseek-ai/dsh-headless@0.1.2-rc.1`，再 add `D:/Code/LarryAgent/harness/packages/plugin-probe`（link 方式）
4. 断言 manifest `bundles` 含三项；`dsh --profile larry --dump-config | grep larry-probe` 见插行
5. `dsh --profile larry "Reply with exactly: probe loaded"` → stderr 见 `[B1-PROBE] … loaded by cordis`、stdout 见回复，exit 0

### 5.2 踩坑清单

1. **源码跑 demo 必须先 `build:lib:host`**：headless 基于 dsh-base，`typert-loader` 运行时动态 `import` 各包 `exports "./typert"` 指向的 `lib/typert.host.js`（构建产物，gitignore）——不 build 必崩（本次第 1 手错误）。
2. **`pnpm install` 加 `--ignore-scripts`**：root postinstall 是 lefthook；而本任务在独立 worktree 跑，无需其 git hooks。
3. **pnpm 11 的 `allowBuilds` 安全机制**：`dsh plugin … add` 装到含 koffi/node-pty/protobufjs 等依赖时会因"ignored build scripts"以 exit 1 结束、reconcile 不跑。解决：在 profile 的 `pnpm-workspace.yaml` 把 `allowBuilds` 待审批项全设 `false`（headless boot 不需要这些 native 构建），重跑即 exit 0。**这是 pnpm 11 相对旧版的行为变化，别当成 dsh 坏了。**
4. **源码入口 + tsx 在 PowerShell 下启动偶发卡住**（本次 add dsh-headless 一次后台卡住，CPU 停滞）：改用 npm 全局 `dsh`（`lib/bin.js`，无 tsx）后 1.3s 完成。验证性操作一律走 npm 全局入口，又快又稳。
5. **PowerShell 把原生 stderr 包装成 error 流**：`[B1-PROBE]` 这类 stderr 输出会被 PS 显示成红字 + RemoteException 外观，内容本身没坏——看字符串别被格式吓到。
6. **自定义 profile（larry）patchReload 默认 `live`**，profile 用户层 `cordis.patch.yml` 变化即热载（launcher watch-only fallback，不需要 hmr 插件）；模块级代码 HMR 是另一开关（见 4.3），别混。

### 5.3 隔离自检

- 开工 baseline：`git status --porcelain` 仅 `M exchange/log-trae.md`（WB 派发稿，预期内）；全局 `DSH_HOME` 未设。
- 结束后 LarryAgent：仅 `M exchange/log-trae.md`（本交付回写）+ `?? harness/`（本交付代码）+ 本报告新增；`.dsh-home/` 被 `.gitignore` 排除未入 git。无其它仓库写入。
- `ref/dsh-bare` 全程只读（`git show`/`worktree add`，未写任何 refs/config）；worktree 挂载于 `D:\Code\dsh-src`（仓库外，未含于 LarryAgent git）。
- 全局写入核查：`dsh plugin` 仅写 `$DSH_HOME/profiles/larry`（隔离 DSH_HOME 内），**未触碰用户级全局 profile/`~/.dsh`**；npm 全局新增 pnpm 11.7.0 与 `@deepseek-ai/dsh`（工具链，预期内）。
- 凭据：测试 key 全程仅环境变量，未写入任何文件（含 `.env`）；提交内容 grep 无可疑 key。
- 临时产物已清：`D:\Code\dsh-src\.dsh-home-demo/`、`demo-run.log`、`larry-boot.log` 已删；`D:\Code\dsh-src` 现 `git status` 干净。源码工作树保留供后续（hmr 动态验证/web 连通）复用，一句话可清理：`git -C ref/dsh-bare worktree remove D:/Code/dsh-src`。

---

## 附：对 DSH-2.3 的顺带提示（不阻塞）

- profile 用户层热载（patch 变化）默认已开（larry 是 `patchReload: live`），模块级 HMR 开关也验证可达（4.3）——DSH-2.3 起"改插件不重启"的机制前提都在，缺的只是 web/tui 类长驻载体来做动态观察。
- 插件开发迭代流已跑通：`harness/` 改码 → `pnpm build` →（web 阶段配 hmr 后无需）重启 profile。当前 headless 阶段仍是"改码→build→重跑"。
