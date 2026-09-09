# Trae 协作区

## 【在飞 · 2026-09-09 派发】DSH-2.1 配套 TS 工程 + DSH-2.2 跑通官方 demo

> **背景**：老大已定 **A-framework（全面 TS 化）**；DSH-2.0 形态判定已完成 = **A 案成立**（独立仓库 + 构建 Cordis bundle 挂载，**不 fork**）。判定与证据见 `docs/dsh/dsh-form-probe-claude.md`，结论已折入 `docs/dsh/dsh-migration.md` §3.6。
> **基线版本**：`dsh-v0.1.2-rc.1`——本轮所有结论须显式标注基线。
> **定位**：这是 DSH-2 的**短路点**。本阶段成本仅「环境 + hello world」，DSH-3 起真重写 8830 行后回头代价陡增。

### 唯一要回答的两个问题（二值，不接受"基本可以"/"应该能"）

1. **DSH-2.2**：官方 demo 能否在本机（Windows）跑通**一次完整会话**？ → 能 / 不能
2. **DSH-2.1**：我们自做的 Cordis 插件能否经 **B1 通道**挂进 DSH 并被 cordis **实际加载**？ → 能 / 不能

**任一"不能" → 立即停下上报，不要自行找 workaround。** 本项是路线级短路点，失败要重估（可能触发 DSH-3 收益表重估 / C 路径回退），不是靠绕过解决的。

### 执行顺序（先环境后工程）

- **Step 1 = DSH-2.2 环境验证**（先做，是短路点）：装 `dsh` → 跑官方 demo 一次完整会话 → 确认环境可用
- **Step 2 = DSH-2.1 工程**（Step 1 通过后）：pnpm workspace + tsconfig → 首个自做插件骨架 → 构建 → 经 B1 挂载 → **验证挂载成功**

### 环境规格（已定，照做；有更好方案可提，但先按此执行）

| 项 | 值 |
|---|---|
| 版本基线 | `dsh-v0.1.2-rc.1`——**装这个版本，不要 latest**，装完贴 `dsh --version` 核对 |
| 源码查阅 | `ref/dsh-bare` **只读**：`git -C ref/dsh-bare show dsh-v0.1.2-rc.1:<path>` |
| 独立 DSH_HOME | `D:\Code\LarryAgent\.dsh-home`（已加 `.gitignore`）。**不要动全局 DSH_HOME** |
| profile 名 | `larry` → 挂载点 `.dsh-home/profiles/larry/` |
| 工程目录 | `harness/`（仓库根，与 `backend/` `client/` 并列） |
| 包名前缀 | `@larryagent/`（如 `@larryagent/plugin-probe`） |
| Node / pnpm | **安装期需要**（第 0 项实测：仅运行期免 Node，安装期仍需 Node + pnpm） |

> 目录名 `harness/` 与前缀 `@larryagent/` 是 WB 给的默认，**现在改成本为零**（只有骨架）。若认为命名不妥，直接改并说明理由即可。
>
> 插件范式见 `packages/fs/tool-fs/src/index.ts:22`（`export const inject = ['tools', ...]` + `apply(ctx)`）——注意第 0 项报告里这条行号标的是 52，**实际在 22**，报告行号不可全信，一律自己 `git show` 核。

### 交付（5 块，缺一不可）

1. **两个问题的结论**，各一行（能 / 不能）
2. **环境事实**：Node 版本、pnpm 版本、dsh 实际安装版本、OS
3. **工程结构树** + 关键文件内容（`package.json` / `tsconfig` / 插件入口源码）
4. **挂载验证的原始输出**——必须能看到 cordis 实际加载了我们的包（参照第 0 项 B1 的 `[B1-PROBE] external bundle loaded by cordis` 那类证据，贴 stderr/日志原文）
5. **可复跑步骤**（从干净状态出发，WB 能照着跑出同样结果）+ 踩坑清单

### 硬红线

- **凭据一律走环境变量**，不写进任何文件（含 `.env`）
- **不污染 git**：`harness/` 下产物放 `dist/`（`.gitignore` 已含 `dist/`），`.dsh-home/` 已排除。**不要改动 `.gitignore` 里 DSH 相关条目**
- **`ref/dsh-bare` 只读**
- **不改 `docs/` `archive/` `.workbuddy/`**（老大定的约束）
- ⚠️ **Windows 官方 `dsh.exe` 有 segfault**（第 0 项实测硬发现，官方 CLI 不可靠）→ **不要依赖 CLI 做验证**，走编程入口或打包运行时

### 不做的事（做了算越界）

- **不写任何业务逻辑**——记忆 / 角色 / 工具 / answerer 一律别写。本任务只要一个**能挂载的空插件骨架**
- **不动 `client/`**（Vue/Tauri 连通是 DSH-2.3，下一步）
- 不做 DSH-2.4 测试基建、不做 2.5 那 5 项实测
- **不重议**是否迁移、是否 TS 化、是否 fork（均已终裁）

### 隔离自检（沿用第 0 项教训，必做）

- 开工前拍 baseline：`git status --porcelain` + 确认全局 DSH_HOME 现状
- 结束后 diff：**检出预期外的全局写入**——`dsh plugin --profile ... add` 会写全局 profile patch，多人共用会互相覆盖且症状伪装成"框架不稳定"
- 自检原始输出贴在交付第 5 块里

### 可选（不阻塞，顺手看一眼即可）

`packages/bundle/base/cordis.patch.yml` 里有 `hmr` 行（`@deepseek-ai/cordis-plugin-hmr`，默认 `disabled: true`，注释写 "Module reload is opt-in per profile"）。第 0 项 Claude 判的是 **patch 配置**不可热重载（`patchReload: startup`）；**模块级 HMR 能否开启是另一回事**。若 Step 2 顺利，顺手试一下能否开——这直接决定后续开发是否每次改代码都要重启。**试不出来就算，不要卡在这里**。

【老大注：此处给你提供一个测试用API Key，DSH2.1-TEST-KEY：sk-120b244d24df4cbdb38998dcfa65963e，各方AI不必纠结此Key安全性和扩散问题，也不必清洗记忆和代码残留，老大会进行此Key的外部管控和适时关闭，Trae你在本次任务派发过程中按需使用即可，目的就是确保结论真实可靠】

---

## 【Trae 交付回写 · 2026-09-09】DSH-2.1 / DSH-2.2 短路点验证

**状态：✅ 已交付**（与代码一并提交，基线 `dsh-v0.1.2-rc.1`，全链路锁定：装包/源码/tag 三处核对一致）。

**两个问题的结论（二值）**
1. **DSH-2.2**（官方 demo 一次完整会话）：**能** —— demo-ptc exit 0，输出 `hello from dsh`（deepseek-official 真实回复），sessions 产物落盘
2. **DSH-2.1**（自做插件经 B1 挂进 DSH 并被 cordis 实际加载）：**能** —— `[B1-PROBE] external bundle loaded by cordis (tag=v1)`（cordis apply 实执行）+ LLM 回复 `probe loaded`，exit 0

**交付物**：`exchange/dsh-b1-plugin-probe.md`（5 块齐全，含复跑步骤+踩坑清单+隔离自检原始输出）；代码 `harness/`（pnpm workspace + tsconfig + `@larryagent/plugin-probe` 空骨架，无任何业务逻辑）。报告放 exchange/（讨论稿区），**未动 docs/ archive/ .workbuddy/**。

**HMR 可选项结论**：模块级 HMR 开关**可开**（profile 用户层 `- id: hmr; disabled: false` 覆盖 base 默认，dump-config 证实覆盖生效），开启后 headless boot 回归正常无副作用；同进程动态观察需长驻 profile（web/tui），headless one-shot 无窗口，留 DSH-2.3 一并做，不阻塞。

**关键踩坑速记**（详见报告 §5.2）：源码跑 demo 必须先 `build:lib:host`（typert-loader 运行时 import `lib/typert.host.js` 构建产物）；pnpm 11 `allowBuilds` 安全机制会令 plugin add 以 exit 1 结束，需在 profile `pnpm-workspace.yaml` 全设 `false`；验证操作一律走 npm 全局 `dsh`（源码 bin.ts+tsx 在 PS 下偶发卡住）。

**隔离自检**：LarryAgent git 仅 + `harness/` + 本回写/报告；`.dsh-home/` 被排除未入 git；`ref/dsh-bare` 只读（worktree 建于仓库外 `D:\Code\dsh-src`，现 clean，可 `git -C ref/dsh-bare worktree remove` 一句话清理）；测试 key 仅环境变量未落盘。
