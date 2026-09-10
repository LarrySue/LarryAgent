# DSH 迁移决策区（docs/dsh/）

- `dsh-migration.md` — **决策稿**（已定稿 + 第 0 项终裁 2026-09-08：Py SDK 判 **二等** → 定 **A-framework**，全面 TS 化）
- `dsh-pysdk-probe-trae.md`（Trae）／`-claude.md`（Claude）／`-qoder.md`（Qoder）— 第 0 项（Py SDK 成色）三方实测报告
- `dsh-form-probe-claude.md` — DSH-2.0（代码存在形态 A/B/C 案）Claude 测绘报告，判 **A 案成立**。
- `dsh-b1-plugin-probe-trae.md` — DSH-2.1 / 2.2 短路点实测（自做插件经 B1 挂载 + 官方 demo 完整会话，两个"能"）。**含环境复现步骤**（源码树 `build:lib:host` / pnpm 11 `allowBuilds` / worktree 用法），后续阶段仍要引用
- `dsh-23-vue-tauri-connect-trae.md` — DSH-2.3 Vue/Tauri ↔ DSH 连通（sdk profile + TS SDK，判"能"）。**含 ⭐ 通信面能力边界观察（事件面宽 / 方法面窄）**，是通信面定型的直接输入
- `dsh-local-env.md` — **本机（Windows）环境约束唯一真相源**：profile 启动锁（wx/2s/孤儿不回收）、`--patch` 引本地包触发 heal 撞锁、windows-acl runner 直调格式、**⭐ 拒绝方言缺口（分本地化层与错误码类别层，后者跨语言成立）**、safe-delete 噪声
- `dsh-cloud-deployment.md` — **云部署（CVM）唯一真相源**：环境资产、规格判定（4C8G 非硬需求）、DSH 拒绝 0.0.0.0（官方 RCE 理由）、landlock sandbox 正反实测、node:sqlite 判据、部署坑清单。**跨 AI 共享的部署事实一律放此**，交流区/TODO/AI 记忆只留指针

## 规则（本目录内一律适用）

1. **六份报告是证据，不是历史**：§3.5（二等）以第 0 项三份为证据支点，§3.6（A 案）以形态测绘报告为支点，DSH-2 的环境复现步骤以 B1 挂载报告为依据，通信面选型以 2.3 报告的边界观察为输入；且「跨进程 resume id collision」「同会话热切角色」等待核项仍需回看原始输出。故与决策稿**同目录存放，不拆、不进 `archive/`**（`archive/README.md` 的落位判据是"是否仍被引用"，不是"是否闭环"）。
2. **永久保留**：老大定，此区域文档价值高，不参与柔性清理，任何人不得删。
3. **结论以决策稿为准**：第 0 项 Trae / Claude 两份的「一等」为原始交付，已被 §3.5 覆盖；Qoder 的「二等」即最终口径。引用一律用 `dsh-migration.md` 对应节。

## 源码查阅

DSH 源码走项目根 `ref/dsh-bare`（只读裸仓库，锁定 `dsh-v0.1.2-rc.1`，`.gitignore` 排除、不入 git），规则见决策稿 §2.2。
