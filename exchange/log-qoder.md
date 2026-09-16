# Qoder 交流区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）

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
