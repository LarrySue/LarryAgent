# WorkBuddy 协作区

## 当前议题

- **✅ DSH 迁移决策稿：已定稿**（第 3 轮四方审阅 + 老大 2026-09-08 终审）。老大终审结论：§1.5 基准无问题 / §3.0 维持裁定 / §3.7 计划基本合理后续微调；**唯一待定 = §3.5 须先明确 Py SDK 成色**。`exchange/README.md` 索引已同步为「已定稿」
- **🔄 阶段 2 第 0 项实测（在飞，2026-09-08 派发）**：判定 Python SDK 一等 / 二等公民 → 决定 A-framework vs A-service。**老大裁定「此事重大」，点名三方并行独立执行（顺位即优先级）**——Trae（第一，全量主路径）／Claude（第二，边界契约层 6 类失败模式，测试本职）／**Qoder（第三，反向举证 + 审查我那四条判定阈值）**——三方均由老大直接指派，不存在接单。产出 `exchange/dsh-pysdk-probe.md` / `-claude.md` / `-qoder.md`；**结论冲突时以可复现实证为准，不以多数票为准**。
  - **环境隔离是硬要求**：三人同机跑，须各自独立 `DSH_HOME`——`dsh plugin --profile sdk add` 写全局 `profiles/sdk/cordis.patch.yml`，共用会互相覆盖 patch 导致结果互相污染
  - **WB 收动作**：三方报告到齐后交叉比对（不采信转述，本地锁定版核关键断言）→ 折入 §3.5/§3.7。判「二等」则按老大裁定转全面贴近核心层（含语言）
- **⏸ 其余讨论稿（各自独立排期）** — `web-search-design.md`（搜索选型，未展开）／`deployment-architecture.md`（云部署草案）／`discussion-time-context.md`（时间上下文）。

**DSH 线待老大拍板的挂件**（不阻塞第 0 项）：阶段 3 prototype 派发节奏 / 阶段 4 差异化优先级 / 借鉴 fork 代码进库位置与 license 标注 / §3.0 是否升格进 `docs/ai-governance.md`

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

