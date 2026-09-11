# DSH 迁移决策区（docs/dsh/）

- `dsh-migration.md` — **决策稿**（已定稿 + 第 0 项终裁 2026-09-08：Py SDK 判 **二等** → 定 **A-framework**，全面 TS 化）
- `dsh-pysdk-probe-trae.md`（Trae）／`-claude.md`（Claude）／`-qoder.md`（Qoder）— 第 0 项（Py SDK 成色）三方实测报告
- `dsh-local-env.md` — **本机（Windows）环境约束唯一真相源**：profile 启动锁（wx/2s/孤儿不回收，**且每次 dsh 运行都会留下**）、`--patch` 引本地包触发 heal 撞锁、windows-acl runner 直调格式、**⭐ 拒绝方言缺口（分本地化层与错误码类别层，后者跨语言成立）**、safe-delete 噪声、**⭐ 连通性/凭据四组对照判据矩阵（成功信号 = `assistant/message` 存在 + 回包非空 + `turn/end.reason.kind === 'completed'`；`exit 0` 无效）**、**⭐ §8 DSH 工程搭建与短路点复跑（版本基线 / 自做插件 bundle 声明范式 / 复跑步骤 / 6 条踩坑 / HMR 开关；原 B1 挂载报告吸收于此）**、**§9 Vue/Tauri ↔ DSH 连通复跑（sdk profile / 复跑步骤 / 踩坑 / GUI 点验；原 2.3 报告吸收于此）**
- `dsh-cloud-deployment.md` — **云部署（CVM）唯一真相源**：环境资产、规格判定（4C8G 非硬需求）、DSH 拒绝 0.0.0.0（官方 RCE 理由）、landlock sandbox 正反实测、node:sqlite 判据、部署坑清单、**⭐ §7.1 部署拓扑约束（B 段 stdio 不可跨机）+ T2 触发线实测（官方 web surface 经反代对外可行）**。**跨 AI 共享的部署事实一律放此**，交流区/TODO/AI 记忆只留指针

## 规则（本目录内一律适用）

1. **报告是证据，不是历史**：§3.5（二等）以第 0 项三份为证据支点，DSH-2 的环境复现步骤以 `dsh-local-env.md` §8 为依据（~~B1 挂载报告~~ **原文已于 2026-09-11 吸收至该节，独立文件随之删除**），通信面选型的 **sdk 面实测边界**见 `dsh-migration.md`「sdk 面实测能力边界」（原 2.3 报告已吸收），环境侧复跑见 `dsh-local-env.md` §9；且「跨进程 resume id collision」「同会话热切角色」等待核项仍需回看原始输出。故与决策稿**同目录存放，不拆、不进 `archive/`**（`archive/README.md` 的落位判据是"是否仍被引用"，不是"是否闭环"）。~~§3.6（A 案）以形态测绘报告为支点~~ **该报告的逐项证据表已于 2026-09-11 内联决策稿 §3.6，独立文件随之删除**（内容等价，不再作为独立证据文件存在）。
2. **永久保留**：老大定，此区域文档价值高，不参与柔性清理，任何人不得删。
3. **结论以决策稿为准**：第 0 项 Trae / Claude 两份的「一等」为原始交付，已被 §3.5 覆盖；Qoder 的「二等」即最终口径。引用一律用 `dsh-migration.md` 对应节。

## 源码查阅

DSH 源码走项目根 `ref/dsh-bare`（只读裸仓库，锁定 `dsh-v0.1.2-rc.1`，`.gitignore` 排除、不入 git），规则见决策稿 §2.2。
