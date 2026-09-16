# WorkBuddy 协作区

## 当前议题

**DSH 线待老大拍板的挂件**（已迁 `TODO.md`「DSH 迁移」区，本处仅留索引）：DSH-3 prototype 派发节奏 / DSH-4 差异化优先级 / 借鉴 fork 代码进库位置与 license 标注 / §3.0 是否升格进 `docs/ai-governance.md`

## UI Designer 待办（Logo 资产，待用户处理）

- 导出 .ico 格式（Tauri 窗口图标需要）
- 导出多尺寸 PNG（16/32/48/64/128/256）
- AI 生成水印需去除后才能作为正式资产

## 时间上下文专题讨论（2026-09-03 建）

- 新建 `discussion-time-context.md`：综合 Marvis「对话时间对齐」提案（09-03 恢复）+ WB 四层坑分析，作跨 AI 讨论底稿（非定案）。
- 综合结论：无不可跨越的坑；便宜层（created_at + 注入）随时可做，唯一硬骨头 = Marvis 点出的「压缩拍平时间轴」，归 P5 记忆保鲜。
- 基础设施：SQLite 三表时间戳已具备；唯一硬缺口 = ChromaDB payload 补 `created_at`（写入后不可改、须重灌）；另需定 UTC 存储约定。

## 云部署架构方案（2026-09-03 产，待老大确认）

- 老大指示：结合 TODO 已有上云计划，统一出「部署方案细化」，厘清哪些上云、哪些在客户端、开发/生产两态、配置、隔离、切换、打包。
- 产出 `exchange/deployment-architecture.md`（草案，待定稿后回 `docs/`）：结论 = 云脑（LLM 编排/云端记忆/web_search/鉴权）+ 本地手（file_ops/shell/本地文件记忆/工作空间/本地库），并给出三阶段渐进路径（现态单机 → 第一版上云只出脑能力 → 本地能力下沉后全套）。
- 关键实证（对照代码）：① 前端 `API_BASE="/api"` 相对路径，生产 Tauri 会断链，须改可配置；② `shell`/`file_ops` 上云后因 `caller_ip` 公网 IP 不在白名单而天然失效，印证「本地工具须下沉」；③ `LARRY_CONFIG` 即现成的环境切换底座。
- 待议（未展开）：本地工具下沉实现路径（双向通道 vs 本地 agent 运行时，倾向后者）、记忆系统分层、多端设备身份、移动端能力不对称。
- 现状 gap（已纳入方案 §七.1 待议）：file_ops/shell 目前在 backend，上云后会操作云端机器而非本机，需下沉 client 端。

## DSH-3.0.3 复验结论（2026-09-16）｜✅ 已裁 → 转 DSH-3.0.4

**判定：Trae 回报成立。** 任务 1 ✅（profile 装齐，106 包）；任务 2 / 3 ⛔ **不可判**（环境阻断：CLI / hoisted 根 = `0.1.2-rc.1` ↔ profile = `0.1.5-rc.2` ⇒ runtime 启动即 `plugin tree failed to load`）。

**独立复核（逐条回源，不采信声明）**：

- 三条失败 entry 的 `[cause]` 原文与栈帧 ✅ 属实（`session-persistence` / `session-query` 导出名不符、`dsh-http-proxy` 包缺失）
- D 组三态 err **sha256 完全相同**（`e09432824c33`）⇒「三态同崩」坐实
- E 组三态 out **完全同形**（同 `2 failed | 12 passed | 1 skipped`、同两项、同耗时量级）⇒ 坐实
- Tier0：我独立扫 30 件回传，命中**全部**为伪造标签 / `sk-REDACTED` 占位 / 脱敏正则（以 sha256 比对确认）⇒ **无真 key 落盘**（另：E 组机制自检本含 `assertNoKeyOnDisk`）
- `pnpm-workspace.yaml` 改前是 **pnpm 11 占位模板**（五处 `set this to true or false`）⇒ Trae 填 `false` 属**必要修复**，非篡改

**两条增量（Trae 回报未提）**：

1. ⭐ **跨代是「三方」，且 CLI 侧在关键路径上** —— D 组崩栈首行 = `harness/…/dsh-sdk-protocol@0.1.2-rc.1`；rt-real boot 栈首行 = `harness/…/dsh-app-boot@0.1.2-rc.1`。他的结论先行只写「profile 与 hoisted 根跨代」，但**栈帧直接证明 CLI（harness）也是 012 且参与执行**（boot 器与装置侧协议库皆 012）⇒ **评估修复路时必须把 CLI 层纳入**；P1 / P2 只动 profile 侧，boot 器仍 012。
2. ⭐ **CVM 参照 profile 是四项不是两项** —— `d-summary.json` 里 `~/larry-dsh-home` 的 sdk deps = `dsh-base` + `dsh-sdk-app` + **`dsh-storage-sqlite`** + **`@larryagent/plugin-storage-probe`(link)**；而 DSH-3.0.3 稿称「deps 恰为这两项 = 完整 composition」⇒ 该前提**未经 CVM 验证**，疑为失败的第二重原因。
3. 小线索：`Packages: -60` 与 `reused 60` **数量一致** ⇒ 疑为 pnpm 统计口径（hoist 复用计负），可按此方向查，不必再实测。

**分清「缺失」与「致败」**：sdk 侧缺 5 包，但只有 3 个引发 entry 失败（`dsh-app-boot` / `dsh-scope` 缺失未致败）。

**我认领的写稿瑕疵**：DSH-3.0.3 稿任务 0 的门禁「CLI / hoisted 与 profile 同代」在**装前不可满足**（profile 空壳 ⇒ 无代际可比）⇒ 门禁应设在**装后回核**。

**老大 2026-09-16 裁定**：① 修复路**两条都做**（原 P1 / P2 二选一解除）⇒ 展开为四步串行（诊断 → 验证 → 修复 → 验收）；② DSH-3.0.3 按**部分交付**结（任务 1 完成），环境修复**拆为独立派发** = DSH-3.0.4（稿在 `exchange/log-trae.md` 顶部）。
