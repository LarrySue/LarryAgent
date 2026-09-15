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
- 📌 该稿**已移入 `docs/dsh/dsh-015-notes-scan.md`**（老大 2026-09-15 指示，保留 git 历史）。同区另有 `dsh-agents-md.md`（AGENTS.md 参考件 + 机制判读）与 `dsh-015-upstream-inventory.md`（两张只读表）。

## 0.1.5 能力树映射 —— 第 2 步（2026-09-15 产，讨论稿）

- 新建 `exchange/dsh-015-capability-mapping.md`：**31 子项 × 三分类**（🟢 可承接 12 ／ 🟡 可降级 15 ／ 🔴 仍须自做 4）。主料是 **`docs/subsystems/` 53 篇正式规格**（上游对自身能力的权威描述），基线 `dsh-v0.1.5-rc.2`。
- ⭐⭐ **架构级改判 · 2.7.2 边界透明：自做 → 可承接**。原判「自做」的依据是「SDK 请求面无 answer 方法（Zero listeners fall through to unavailable）」——**该依据只在 A-service 下成立**；已拍板的 **A-framework** 下我们就在 DSH 进程内，`ctx.approval`（closed + **fail-closed** 结果集、`approval/asked`·`decided` 审计对）／`ctx.permissionPresets`（**preset 表可配置**＝边界 config 化的官方形态）／`ctx.userQuestions`（瀑布 listener **可中继到已连接客户端**）全是公开契约。⇒ 自做只剩「策略内容」，且**可先用官方两档 preset 零代码起步**。
- ⭐ **2.3.3 会话沙盒：自做 → 可降级**。上游 `workspace` 子系统**正是**「会话↔目录归属」的数据模型（稳定 id + 规范路径 + 有序 session 账户；membership = id 在账户内 且 header cwd 等于 workspace path；`session-controller` 已实现「cwd 取自选定 workspace、落 immutable header、再 attach」）。⇒ 我方只做**隔离语义**（`workspace` 明说 root「不是读边界」）。
- ⭐ **2.10.2 端侧能力：认知改判**——DSH 每项本地副作用能力都是 capability seam（定义与实现分离），「下沉」不是对抗框架，而是**给它写一个端侧 provider**（与 `e2b/` 是同一机制的反向用法）。
- ⭐⭐ **最重的新增风险：上游凭据脱敏是 fail-open**（`settings/redact.ts` 的 `TODO(settings-wire-redaction)`：经 union/intersection/transform 可达的秘密**原样返回且无记录**）⇒ **「key 不进日志」不得依赖 DSH 的 wire redaction**，撞我方 Tier0 红线 1。
- ⭐ **新增能力位 3 处**：① `web_fetch`——**SSRF（DNS pinning + NAT64 + 逐跳复查）与资源封顶上游已吃**，我方原判「不做正文抓取」的 4 项成本降到 2 项（反爬 / 清洗仍在）⇒ 范围应重估；② **`compaction-tool-result-pruner` 就是官方默认顺序**（先 pruner 后 range selection）——产品树 §2.9.2「最划算第一步」不必自造；③ **`schedule` 的 catch-up 语义**（只补最近一次 + 不重放 + 批量合并 + 等 idle 不打断当轮）**正面回答**产品树 2.3.5 的「missed-run 是否必答」。
- 🟡 另两条风险：出厂 **cookie 未标 `Secure` + 无登出**（对 2.7.5「HTTPS 硬前置」是实证支持）；**`web_fetch` 不受 sandbox/approval 管辖、无 per-call 确认**（若承接须挂 `tools/pre-execute` 策略，进「迁移必关清单」）。
- 🔴 **仍须自做的只剩 4 项：2.4.3 记忆可管理 / 2.4.5 用户画像 / 2.6.2 自动路由 / 2.9.1 时间感知**——恰好全是产品语义核心（与 §3.3「一概替不了的 7 项」高度重合）。
- 附带澄清：**2.4.3「硬删 vs append-only」的冲突前提不成立**（只成立于"记忆事件留在 session log"；记忆存自己的库即无冲突）⇒ 建议 DSH-4 写死「记忆本体不入 session log」。
- 边界：契约 / 类型 / 子系统正文 = **代码级复核**；`web-fetch-http` 的 SSRF 行为、`settings/redact.ts` 的 fail-open、`workspace` 运行时行为、自定义 preset 表能否生效 = **读规格未实跑**，采纳前须补测。
- 待裁定 6 条见稿件 §9（含"是否要再加一档『须关闭』"）。**本稿未改动任何 docs / TODO。**

## 交流区两份意见处置（2026-09-15 下午）

- 老大两问：① Trae 交流区里 DSH-3 任务那部分能否先清理（可能要重做）；② 看 Trae / Claude 在交流区写的东西。
- **清理判决：不做整块清理。** ① 001 周期未闭环（`TODO.md` DSH-3.0 仍有 4 条 `[ ]`）；② **「要重做」的精确边界 = 仅 D（从未跑成）+ E（012 结论跨版本失效）**，A / B / C / F 四组与 DSH 版本无关、照用（C 的 `cvm-probes` 修复已随 `b4b61ed` 落库）；③ 001 的规格与裁定实质已由 `TODO.md` 3.0 段 + `dsh-migration.md` §3.6 承接 ⇒ 等 002 发出时一次性折叠为指针，不返工。
- **裁定 001 §J1 就地作废、不执行**（两条命令钉 `@0.1.2-rc.1`，基线已转 015 ⇒ 装了即作废；Trae 附注 §2 的预判正确）。
- 落 `exchange/log-trae.md`「回复 001」+ `exchange/log-claude.md`「WB 回复」；提交 **`b9bb652`**（含 Trae 之前**未提交**的 198 行意见，一并入库）。
- 采纳要点：Trae 1.1 收窄 §A1（**认错**：§A1 把"哲学与定位"并列，实测只证明哲学可读）/ 1.3 **三层验收前置** / 2.1 两把锁 / 2.2 方言重判 / 2.4 redact 构造法 / 2.5 ACP 降为确认性 / 2.6 传输安全验收法 / 2.7 方法论；Claude 总判（**四稿全为文献证据、无执行证据**）+ 2.4 **会话格式迁移单向**（⭐ 升格为挪基线前置）+ 2.2 `per-package ≥6` 判据 + 2.5 全线。
- **独立复验两处属实**：`packages/boot/app-boot/src/profile.ts:559` 的 `withFileLock(modulesDir)` ⇒ `<profiles>/node_modules.lock`（⚠️ **2026-09-10 我们已留痕过**，Trae 的增益在于**与 015 新租约并排对照**）；`dsh-015-upstream-inventory.md:90` 的 ACP 自述。
- ⚠️ **暴露一处两份意见的直接矛盾（未合并）**：Claude 记「harness 同步缺 30 文件 / 0.13 MB」，本机核数 **55 文件 / 733,106 B** vs CVM **61 / 753,485 B**（**CVM 反多 6 件 = 他保留的 09-10 旧件**）⇒ 已请其补可核命令与时点，单列待核。
- ⚠️ **一处 1 字节格式瑕疵已直接改（事后说明）**：`log-claude.md` 末尾补换行符（原无，不符仓库"末尾换行"约定）。
- **未动 docs / TODO**；待老大拍 4 项（三分类加档 / 2.7.2 是否条件化 / Trae §五 四项实测是否派发 / Claude #4 是否优先做）。

## 老大对 8 条的裁定 + 能力树改动提案落盘（2026-09-15 傍晚）

- 老大逐一裁定映射稿 §6 的 8 条：**认 6（其中 2.7.2 须先实测）/ 暂缓 1（`web_fetch`）/ 缓办 1（合并）**。
- ⭐ **`web_fetch` 暂缓的老大判据（建议升格为行事规则）**：「**上游有没有成熟的挂载方式**」与「**我们要不要做这个能力**」是**两个问题**——前者属架构层（DSH 必然是支持挂载各种 tool 的，插件或其他形式），后者才是产品决策。**混在一起判会得出"因为上游给了 SSRF 所以我们要做 fetch"的错误推论**。
  ⇒ 映射稿 **§4.1 / §5.3 双双挂起**；「迁移必关清单」**不新增**该条；`product-positioning.md` **2.5.2 不改**，只加一条"迁移后按 DSH 挂载形态重估"的观察点。
- **新建 `exchange/capability-tree-revision.md`**：把 §6 的 8 条展开为「**现状原文 → 建议改后**」的可审形态，供老大逐条批（**老大批此稿后才动 `product-positioning.md`**）。含三块：
  1. ⭐ **统一字段行〈对手侧状态 + 依赖版本〉的具体形态** —— 每条子项标题下固定一行 `**对手侧（DSH <版本>）**：<档位> <一句话状态> ｜ <我方剩余动作>`；**必须带版本号**（上游高速演化，不带版本号的记录下次无法判断是否仍成立）
  2. **5+1 档分类**（新增 ⚪ 须实测后定 / ⛔ 须关闭 / ⬜ 无对手侧）；**⛔ 建议单列清单、不混入三分类**——理由：一条能力同时是"可承接"和"须关闭"是常态，混判会串味；⛔ 三条准入（Claude 提）已采用
  3. **2 条全树教训**：① **判据会随架构选型失效**（A-service → A-framework，同一个"不可达"换架构前提就作废）② **「上游有没有 X」≠「我们要不要做 X」**
- 映射稿同步：§1 扩档 / §4.1 + §5.3 挂起 / §6 加指针 / §7 合并行标缓 / **§9 由「待老大裁定」转「裁定记录」**（6 项全裁完）。
- **下一步待定**：① 2.7.2 的实测**派给谁**（WB 建议：**Trae 执行** + **Claude 审装置**，WB **不参与执行**——该改判是 WB 提的，自测即自证）；② `product-positioning.md` 的实改顺序，待老大批 `capability-tree-revision.md` 后启动。
- 仍缓：`docs/dsh/` 三份稿的**过期状态区订正**与**合并**（老大：「合并不是目的，先做其他的」）。

## 派发 002（2.7.2 契约实测）+ Trae 交流区结构清理（2026-09-15 晚）

- 老大两问：① 把 2.7.2 **派给 Trae**；② 看 Trae 交流区**要不要清**。
- **新建〈派发 002〉**（`exchange/log-trae.md` 末尾）：2.7.2 边界透明的 **A-framework 契约实测**，四组断言（A 契约在 / B 默认实现在 / C 自定义 preset 生效 / D fail-closed 反向对照）+ 前置装 015 profile。
  - **归属**：本条是 2.7.2「自做 → 可承接」改判的**唯一下游前提** —— 不通过即撤回。
  - **前置 = 裁定 001 §J1 的订正版**（版本 `0.1.2-rc.1` → `0.1.5-rc.2`）；**停手条件 1 = npm 上没有 `0.1.5-rc.2`**（只有 git tag）—— 这条会连带影响 003 全部排期，要求**最早上报**。
  - **编号订正**：原〈回复 001〉写「D / E → 002」⇒ 现 002 已被 2.7.2 占用，**D / E 顺延 003**；log-trae.md 内三处已同步订正。
- ⭐ **写稿时读原文挖到两条硬约束 + 一处自我订正**（全部出自 `docs/subsystems/` 四篇 @ `dsh-v0.1.5-rc.2`，**逐句核对**）：
  1. **preset 服务要求一个「会 confinement 的 `ctx.shell` executor」**，否则 **plugin load 时直接 throw** ⇒ 比"自定义表生效"更**前置**的门槛（已写进派发稿 §1 与 C 组）。
  2. **`ApprovalPolicy` 只有 `ask` / `never` 两档，且 `never` = 全拒（`rejected`）、不是全放行** —— 语义极易读反（已要求回报里写明其理解与判据）。
  3. ⚠️ **自我订正（过度声明，本轮同类第 2 次）**：上轮映射稿 §3.1 写 preset「与 2.7.2 的『白名单 / 黑名单 / 工具开关全部 config 可调』**同构**」—— **过强**。`PresetSpec` 实测只有 `sandbox: SandboxMode` + `approval: ApprovalPolicy` **两个 knob**（且 `SandboxMode` **只管文件效果**，原文 *"Network and process visibility are outside this vocabulary"*）⇒ **preset 表管不到「工具开关」**。已订正映射稿 §3.1 及其口径行 + `capability-tree-revision.md` §2 / §11 / 变更记录。
- **Trae 交流区清理判决：做「结构性清理」，不删内容。**
  - **加顶部〈分区导航〉**（7 段 + 各段状态 + 按时间序的阅读指引）—— 该文件已 600+ 行，且阅读顺序被 Trae 自报过一次打乱。
  - **订正过期自述**：〈派发 001〉状态 `🟡 待续` → `⛔ 已停止推进`。
  - **不删的理由**（沿用上轮判决）：D / E 归 003，**折叠时机未到**；且〈派发 001〉§1 那条发现（real-api 链路读不到 `~/.dsh` 凭据）**仍是 003 的前提**。
  - **其余 exchange 文件判为不动**：`log-claude.md` 已由其自己清过（`bfe168b`，现 120 行）；`discussion-time-context.md` **在飞**（第 2 轮待各方表态）；`deployment-architecture.md` / `web-search-design.md` 是「**未启动**」而非「过期」（前者状态行已写明"待 DSH 迁移完成后重新制定"）；`log-marvis.md` / `log_design.md` 设计定案已固化进 `docs/ui-reference.md`；`log-other.md` 空。
- **未动** `docs/` 与 `TODO.md`（能力树实改待老大批 `capability-tree-revision.md`）。

## 2026-09-15 傍晚 · 〈回报 002〉复验（2.7.2 A-framework 契约实测）

**结论：四组全过 → 判「过」**。WB 逐条独立复验（未采信自述）+ 4 条 WB 侧新增发现，已写入 `log-trae.md` 文末〈回复 002〉。

**复验证据（本机可复现）**：
- 产物：`harness/packages/plugin-015-preset-probe/`（3 文件）+ `harness/scripts/015-preset-probe/`（2 文件）
- 证据：`D:\Code\_trae-015\` 19 文件；`dump-config-custom.txt` **367 行** ✅、`dsh-version.txt` = `0.1.2-rc.1` ✅（与回报一致）
- 原始：`runs/*.probe.json` 的 `A.services` / `B.config` / `C.sessionTests` / `D.verdict` **逐字段对上**；`errors: []`
- 判据：`dsh-permission-presets@0.1.5-rc.2` 的 lib 逐行 —— `:109` / `:112` / `:245` / `:255-267` / **`:280-286`（只写"变了"的 knob）** / `:293-311` 全部吻合 C 组观察
- 硬约束：`dsh-base/cordis.patch.yml:6-7`（整体替换非 merge）+ `:229-241`（三条 preset 写死）

⭐ **新增发现 4 条**：
1. **改判与基线解耦** —— permission-presets / user-approval / user-questions / sandbox-policy **两版逐字节相同**（sha 一致、diff 0 行）；`dsh-tools` 仅 PTC 改名、**`restrict()` 段零差异**；base 三条 preset 两版都有 ⇒ **012 就已存在**，口径应写「**012 已有，015 未变**」，不是"015 带来的承接"
2. **工具开关也是 012 就有**（`restrict` 作用域守卫原文两版逐字相同）
3. ⭐ **上游没静默** —— `dsh-v0.1.6-alpha.1` @ **2026-09-15 10:42**（距 015-rc.2 仅 **4d13h / 800 commits**；排除生成物 +143,605 行，日均提速 3.6×）。**016-alpha 新增 `packages/boot/app-boot/src/profile-resolution/`（015 无，`resolver.ts` 975 行，PR `fix/profile-module-resolution`）** ⇒ **Trae §6-1 的"profile 跨版本混合"是上游已知/正在修的系统性问题**；003 若按 015 重跑会重演 ⇒ 前置钉「**CLI 与 profile 同代**」（`@deepseek-ai/dsh` 也有 015-rc.2），**不必换 alpha 基线**
4. **npm `dist-tags` 揭示通道** —— `next`=0.1.5-rc.2 / `alpha`=0.1.6-alpha.1 / **`latest`=0.0.1-rc.1（从未推进）** ⇒ stable 通道长期空置是**有意设计**；格式版仍 =3（016-alpha 未变）

⚠️ **口径自警**：016 区间原始 `+784,113 行` 中 **65% 是 schema 归档生成物** ⇒ **不得当"变化量"引用**（已算排除口径 143,605）。

**未动** `docs/` 与 `TODO.md`。**待老大拍**：003 排期 + 是否把"CLI 与 profile 同代"钉进 003 前置。

## 2026-09-15 晚 · ① 折叠 Trae 区（1029 → 191 行）+ ② `TODO.md` DSH-3.0 订正（老大拍「先做 1+2，做完看一眼」）

**① 折叠**（判据 = **承接方写出来没有**，不是内容重不重要）：
- 折 8 段为指针：〈派发 / 回报 / 裁定 / 附注 / 回复 001〉+〈派发 / 回报 / 回复 002〉
- **保留块 4 项**（无处承接 / 不得随折叠消失）：**两条实验硬约束**（preset 需会 confinement 的 `ctx.shell`；`never` = 全拒且先于 answerer；patch 整行替换 + `workspace-write` 必留）／**三条未验标注**／**J2 · J4 · J5**／**003 待发（含 CLI 同代前置）**
- **〈Trae 意见 7 条〉136 行原文保留**（前置 = 映射稿 §7 联动未落地），仅在其上加一条 WB 状态批注
- **复验**：去批注后与折叠前版本 311–446 行**逐行等价 = True**
- **折完反查悬空引用**（见下"教训"），修 5 处

**② `TODO.md` 订正**：
- `:29` 基线 `0.1.2-rc.1` → **`0.1.5-rc.2`**（+ `0.1.6-alpha.1` 不挪 + **"两侧待同步"警示行**）
- `:52-54` DSH-3.0 段标题与派发状态行（001 停推 / A·B·C·F 照用 / **D·E 归 003** / 002 判过）
- `:64-65` 装 profile：版本 `012 → 015` + **CLI 与 profile 同代**前置（本机跨版本混合污点）
- `:70-74` D 组规格标归 003；`:75` real-api 复跑标「012 结论**跨版本失效**」
- `:79-85` 采数 → ✅ **已闭合**（240 点 / `oom_kill` 全 0 / 已回传本机）
- `:179-181` 环境口径统一：钉死脚本**已改 `b4b61ed` ✅**；「废弃 `larry-dsh-home`」→「**不再作运行 home、降级为负向对照器材**」（与 `:69` 对齐）
- 「待派发」段：派发进度块重写为 **001 / 002 / 003** 三段
- `:74` 顺手修掉一条死引用（「附 B §二」→ 直写 `--dump-config`）

**⚠️ 主动暴露（未动，等老大定）**：`docs/dsh/dsh-migration.md` 仍记「锁定 **`0.1.2-rc.1`**」（`:61` / `:84` / `:278` / `:315`）—— **09-15 挪基线只落在 exchange 侧**，决策稿侧未随动。**我没有单方面改决策稿**，只在 `TODO.md :30` 留了警示行。建议按「09-11 历史裁定保留不动 + 另增 09-15 覆盖判定」处理（历史不可改写）；时机与执行人待老大定。

**教训（可复用）**：**折叠会制造悬空引用，而悬空引用在被折文件里看不见** —— 折完必须**反查全仓**对该段名的引用（本轮 `grep` 查出 5 处：`TODO.md` ×2、`capability-tree-revision.md` ×1、`production-env.md` ×2），逐个改指新落点。另：**落点引用以"条目名"为主、"行号"为辅**（行号随编辑漂移）。

**未动**：`docs/dsh/dsh-migration.md`、`dsh-015-capability-mapping.md` §3.1（待写入）、`product-positioning.md`、003 派发稿。**待老大**：审 ①+②；拍 003；定决策稿侧基线同步的时机与执行人。

## 2026-09-15 晚（第二轮）· log 文件处置原则 + Trae 区「去痕」收尾

- 老大宣布：**清理工作已从 WB 职责移除**（后续老大本人接手）。本轮「既然已做了就做到底」⇒ WB 只完成 Trae 区收尾，其余不再主动清理。
- ⭐ **新原则（老大原话）**：`log-*.md` 这类交流区文件**非常临时** —— **不引用、不被引用、不记录、不留痕**。
- **Trae 区收尾**（191 → 166 行）：
  - 删〈折叠记录〉落点表 + 〈原文取回〉`git show` 命令块（前者是跨文档引用网，两者都属"留痕"）
  - 原「折叠时保留」→ 改「暂存 · 尚无正式落点的结论」：**实质内容保留**（硬约束 2 条 / 未验标注 3 条 / 方法论 J2·J4·J5），去掉指向其它文档的指针
  - 顶部说明改为「已闭环段**直接删除**，不留指针、不留底、不进引用关系」
  - 〈Trae 意见〉136 行原文**一字未动**（仅修其 WB 批注里两处坏引用）
  - 复验：禁用串（折叠记录 / 原文取回 / 0ba8c55 / log-trae.md / 取回）**0 命中**；意见段逐行等价、差异 = 1 行（批注修复）
- **断掉正式文档指向 log 的引用 4 处**（其中 3 处是本轮上一提交新引入的）：`TODO.md` `:54`/`:242`、`docs/production-env.md` `:467`、`exchange/capability-tree-revision.md` `:237`；另修本文件上一节两处失效指针。
- ⚠️ **暴露 · 未动（待老大）**：
  1. 项目级 `.workbuddy/memory/MEMORY.md` `:11` 仍写「TODO/交流区/存档区/文档区维护」，未跟上本次职责变更（该文件属"人类操作"清单，WB 不改）
  2. **存量 log 引用面**：`docs/ai-governance.md:243`（**机制性** —— 要求 Trae 读 `log-trae.md` 作任务简报）、`docs/ui-reference.md:5/139/147`、`docs/test-env.md:4-5`、`docs/local-env.md:439`、`archive/report-2026-08-30.md`、`archive/roadmap-history.md:354`、`harness/tests/global-setup.ts:77/127`、`backend/tests/test_integration_llm.py:48`
  3. **本文件自身也是 `log-*.md`** ⇒ 按新原则同样待处置（历史行里仍有若干指向已删段的指针）
- 未动：`docs/dsh/dsh-migration.md`（决策稿侧仍记 012）、003 派发稿、`product-positioning.md`。

## DSH 015 能力树映射 · 定稿移入 `docs/dsh/`（2026-09-15 晚）

- **动作**：`exchange/dsh-015-capability-mapping.md` → **`docs/dsh/dsh-015-capability-mapping.md`**（`git mv`，历史保留）。性质由「🔴 讨论稿」改「✅ **判定稿**」，用途定为 **`dsh-migration.md` §3.6 承接总表的逐条依据**（二者同源，任一侧变更须同步另一侧）。
- **移区时做的状态区订正**（不订正就会把过期表述带进 `docs/`）：
  1. `:19` 统计表「对比现行总表 8 → 12 / 23 → 4」→ 改「**旧口径**」列（总表已按本稿重划，原对比列变成自我指涉、读不出差异）
  2. §7「联动清单（**待裁定后执行，本稿未动**）」→ **执行状态表**（加状态列，✅/⏳/🅿️/⏸/🟡 逐条）
  3. §9 落点行「本稿继续留 `exchange/`」→ 已移入 `docs/dsh/`
  4. 头部「本稿**未改动任何 docs / TODO**」→ 该声明已过期，改述移区事实
- **引用面同步**（移区必做，否则死链）：`dsh-migration.md` ×2（`:862`/`:907`）／`capability-tree-revision.md` ×4（改 `../../exchange/…` 并定义简称「revision 稿」）／`docs/local-env.md` ×1／两区 README 同步（`exchange/README.md` 删索引条 + 留一行「已移入」指针；`docs/dsh/README.md` 新增索引条）。
  - ⭐ **顺带修好一处原路径错误**：`dsh-migration.md` 原写 `../exchange/dsh-015-capability-mapping.md` —— 从 `docs/dsh/` 出发应解析到不存在的 `docs/exchange/`（`../` 只到根下一层的 `docs/`，`product-positioning.md` 用 `../exchange/` 才对是因为它在 `docs/` 下）。改同目录裸名后既正确又简短。
- **复查**：全仓 grep `exchange/dsh-015-capability-mapping` ⇒ **正式文档 0 命中**；存量仅在 `log-*.md`（历史记录，按「log 不留痕」原则不追改）与 `.workbuddy/memory/`（历史存档）。
- **遗留（均已知、非漏项）**：§7 表中 ⏳ 三项 —— §3.3 依据换口径 ／ §3.4 漂移① 收窄 ／ `TODO.md` DSH-4 段；🅿️ fail-open 一条已归 TODO 层（老大 2026-09-15 裁定）。
- **顺带发现（未动，待老大）**：`dsh-migration.md` §3.2 表两行与 §3.4 自相矛盾 —— `storage/` 行仍写「外接 SQLite **待实测**」（§3.4 `:294` 已记 ✅ 实测通过）；`sandbox/` 行仍写「仅 Linux/macOS 侧成立」（§3.4 `:285` 已推翻「Windows 非一等」）。两者都是**依据层**文字，非格式瑕疵，未擅自改。

## 2026-09-15 深夜 · 复核 Qoder 首轮巡查（`log-qoder.md`）

**背景**：老大将「文档一致性维护」移交 Qoder，定性为 **筛查 + 初步核实**层；其产出**由 WB 复核**，最终一起处理（2026-09-15 23:04 五条裁定）。本节即首轮复核。

**复核方法**：不看其叙述，逐条回源实测（行号 / 引用 / 存在性 / git 时序 / npm registry）。

**逐条判定**：

| 项 | 判定 | 取证 |
|---|---|---|
| H1 `TODO.md` :30 警示行过期 | ✅ **属实** | :30 仍写「决策稿仍记 `0.1.2-rc.1`…尚未随本次订正改」；对照 `dsh-migration.md` :79 已是 `dsh-v0.1.5-rc.2`。**根因＝WB 自己的遗漏**：`2c5db52`（18:25）写警示行 → `4420652`（19:09）改完决策稿却未回清 |
| H2 `deployment-architecture.md` 状态口径 | ✅ 属实，**实为 4 处**（其报 3 处） | 文件 :4「**方案（待DSH迁移完成后重新制定）**」；未跟上：根 `README.md` `:12` + `:184`、`exchange/README.md` `:23`、`TODO.md` `:290` |
| M1 Qoder 角色未入两份文档 | ✅ 属实 | `README.md` :197 角色清单无 Qoder；`docs/ai-governance.md` :63-66 载体制无 Qoder。其称「已登记两处」核实无误（`HUMAN_NOTE.md` :19、`exchange/README.md` :16） |
| M2 README 结构树 / 状态行漂移 | ✅ 属实 | 结构树 :19-54 确无 `harness/`、`ref/`（两者均实际存在）；:14 状态行 = 2026-08-30 硬快照 |
| M3 npm `latest` 两处矛盾 | ⚠️ **半对：方向对、归属反** | **实测**（直连 registry.npmjs.org）：`@deepseek-ai/dsh` = `{latest: 0.1.5-rc.1, next: 0.1.5-rc.2, alpha: 0.1.6-alpha.1}` ⇒ **docs 侧正确**（`:79`/`:85`），错的是 **log 侧**（本文件 :111 写 `latest=0.0.1-rc.1`）。**根因可定**：`0.0.1-rc.1` 是 **`dsh-api-gateway`** 的 latest ⇒ 当时把两个包的值串了。其建议「以实测订正 `dsh-migration.md`」**不成立** |
| L1 `roadmap-history.md` 头部 | ✅ 属实 | :3 只写 P0–P3（实含 P4 / DSH-1 / DSH-2）；:5 检索提示同缺；:6 引 `WORKBUDDY.md` —— **实测 MISSING**（死引用）；:395 引 `dsh-local-env.md` / `dsh-cloud-deployment.md` —— **两者均已不存在**（现为 `docs/local-env.md` / `docs/production-env.md`） |
| L2 `archive/README.md` :27 + `TODO.md` :277 | ✅ 属实 | :27 未提 DSH-1/DSH-2；`TODO.md` :277 引「P0–P5」（同段 :12 用 P0–P4） |
| L3 派发权限清单未含 `log-qoder` | ✅ 属实 | `exchange/README.md` :4 仅列 log-marvis / log-claude / log-trae / log_design |
| L4 log 内旧路径引用 | ✅ 属实（按「不留痕」不动） | `log-trae.md` :32、`log-claude.md` :10 / :51 均引 `exchange/dsh-015-capability-mapping.md` |
| L5 `HUMAN.md` 第 4 条可收口 | ✅ **依据成立** | `roadmap-history.md` :331-339 = 该开关贯通的完整闭环（含提交号 / 三方分工 / 复验结论） |

**WB 补充发现 1 条（Qoder 未报）**：

- **N1 · `HUMAN.md` :43「有 6 项值得测」与表实存 5 行矛盾** —— 老大 2026-09-15 22:5x 自行删掉「015 ACP 缺 `fork`/`load`/`delete`」一行后，**计数未同步**。⚠️ 它未报**不是能力问题**：其巡查快照早于老大改动 ⇒ **正是 WB 早前提示的「建议方无写权限 ⇒ 认知为快照」失效模式的首个实例**。`HUMAN.md` 属人类治理区，WB 不擅改，仅报告。

**总体评价**：9 条中 **8 条完全属实**、1 条方向对而**归属判反**；1 条因快照时效未捕捉（非能力问题）。⇒ **筛查层可用，复核层必要** —— 本轮 M3 若照其建议直接执行，会去改一份**本来正确**的文档。

**待老大裁决（按建议动作排序）**：

1. **H1** —— `TODO.md` :30 警示行（**WB 自己的遗留**，建议改写为「已随 `4420652` 同步 015」的完成记录）
2. **H2** —— 四处统一到「待 DSH 迁移完成后重新制定」
3. **N1** —— `HUMAN.md` :43 计数（人类治理区，老大自改）
4. **M1** —— 是否补 Qoder 角色登记（`ai-governance.md` §3 载体清单 + `README.md` 协作段）
5. **M2** —— `README.md` 结构树补 `harness/` `ref/` + 状态行改指针式
6. **M3** —— log 侧错值处置（WB 区，按「不留痕」建议**删除**该半句；docs 侧不动）
7. **L1 / L2** —— archive 冻结区，仅报（L1 建议头部追加一行订正注记、不改正文）
8. **L3** —— 是否授权 WB 向 `log-qoder` 派发
9. **L5** —— `HUMAN.md` 第 4 条收口（人类治理区，老大自决）
