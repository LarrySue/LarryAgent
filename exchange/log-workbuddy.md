# WorkBuddy 协作区

## 当前议题

- **⏸ 其余讨论稿（各自独立排期）** — `web-search-design.md`（搜索选型，未展开）／`deployment-architecture.md`（云部署草案）／`discussion-time-context.md`（时间上下文）。

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

## 0.1.5 全新笔记扫描（2026-09-15 产，讨论稿）

- 新建 `exchange/dsh-015-notes-scan.md`：`ref/dsh-bare` 两 tag 对照，**110 篇**全新笔记（basename 差集 ÷3）逐篇过完 + 判读。
- ⭐ **最高级发现（改判据）**：`AGENTS.md` 的产品哲学在 **0.1.5 正式转向** —— 012 的 `Pre-release stance: foundation over blast radius`（"Remove at the first tagged release"、"reject old on-disk formats"、"no compatibility promise"）→ 015 的 `Pre-stable APIs and released Session data`（"**never move, overwrite, or delete committed generations**"），且**直接引用** `2026-08-31-released-session-format-migrations` 这篇笔记；同版新增官方治理文档 `docs/session-format-status.md`。⇒ **「等第一个 stable 才体现产品哲学」的理由失去支点——哲学变身已在 rc 阶段发生。**
- ⭐ **3.2 靶子改判**：015 新增 `packages/session/session-persistence-jsonl/src/lease.ts` + `win32.ts`（012 上不存在，已 `ls-tree` 确认）。**跨进程同 session 写-open** 在 015 上被内核锁保护（POSIX flock / Win32 named semaphore），争用抛 `SessionAlreadyOwnedError`，故意不做 TTL 抢占。⇒ 09-11 判的「0.1.5 没修掉 3.2 要查的行为」**已过时**：进程内 collision 未变，跨进程层已变 ⇒ **3.2 实验设计若挪 015 必须重做，结论不可跨版本引用**。
- 🟡 其余命中：`2026-08-27-outbound-proxy-policy`（**正是我们踩的 socks5 代理坑，015 已正式解决**，新增 `packages/util/http-proxy`）／`2026-08-26-generic-file-upload` + 新增包 `packages/client/file-upload`（**2.3.4 对手侧已给**，迁移后有从「自做」降为「承接」的空间）／`workspace-files` + `client-resource-model` + `/api/file`（**官方正面承认「浏览器可能不在 Host 机器上」**，远程形态开端，但 `identity/` 两版未变 ⇒ 仍非多租户云）／ACP `src/` 有真实改动（`flush` / `stat` 取代 `ensureMaterialized` / `list`）⇒ `-32601` 结论**待实测重核**。
- ⚪ 结构性：档位 implemented 96 / archived 13 / proposed 1（012 的 proposed 是 78）⇒ **13 篇「新写即归档」= 「有些特性还没来得及做/被自己推翻」的直接实证**；process/testing 类占 25 篇 ⇒ 工程化基建投入巨大（对「项目长期可持续」是正面证据）；`promote-open-anywhere-plugin` = **社区插件被官方吸收的先例**。
- 边界：AGENTS.md / identity / acp / lease.ts / 新增包存在性 = **代码复核**；其余机制描述仅笔记自述，进 docs 前须复验。015 的 ACP 是否仍缺 `fork`/`load`/`delete` **未实测**。

