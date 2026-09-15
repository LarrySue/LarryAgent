# Qoder 交流区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）

---

## 2026-09-15 · 首轮全量文档一致性巡查（老大指令「跑一遍职责」）

**范围**：根级四份（README / HUMAN / HUMAN_NOTE / TODO）＋ 三区 README ＋ archive 全部（含 roadmap-history 与两份事故报告）＋ docs 顶层索引与 ai-governance / product-positioning 抽查 ＋ docs/dsh 索引与 dsh-migration.md 定向核查（基线口径）＋ exchange 全部 log 与四份讨论稿状态核查。**未改动任何本项目其他文档**（git 工作区干净，所有发现仅登记于此）。

### H · 高优先级（现役状态漂移，影响判断）

**H1. `TODO.md` :30「两侧待同步」警示行已过期——决策稿基线订正实际已完成**

- 现状：TODO.md :30 写「⚠️ 两侧待同步：决策稿 `docs/dsh/dsh-migration.md` 仍记『锁定 0.1.2-rc.1』（:61 / :84 / :278 / :315 一带）⇒ 基线归属的正式落点在那份稿，尚未随本次订正改」。
- 事实：git 时序证明该行已过期——①`2c5db52`（09-15 18:25）WB 订正 TODO 并写入警示行，当时准确（WB log 同步留痕「我没有单方面改决策稿」）；②`4420652`（同日 19:09）「docs(dsh): dsh-migration.md 基线全面迁移 012 -> 0.1.5-rc.2（老大 2026-09-15 拍）」完成全面迁移，现行 :55 / :67-68 / :79 / :112 / :177（§2.3 基线迁移复核）/ :311（§3.4 基线收口复核）全部为 015 口径；③其后 `8a1f8c8`（§3.6 总表按 015 重划）、`3b6f4e7`（§3.2 两处自相矛盾订正）陆续落库，`docs/dsh/README.md` :21 也已记「当前上游基线：dsh-v0.1.5-rc.2」；④TODO.md 最后一次提交为 `00eb6c5`（18:31），早于 19:09，警示行未曾随之清理。
- 影响：TODO.md 是唯一事实源，该行会让读者（含后续 AI）误以为决策稿基线仍未同步，重复排查或误报。
- 建议：删除或改写 TODO.md :30 该警示行（保留一行「决策稿已随 `4420652` 同步 015」的完成记录即可）。

**H2. `deployment-architecture.md` 的状态在三处描述不一致——文件已自行改状态，三份引用未跟上**

- 文件实际状态（exchange/deployment-architecture.md :4）：「**方案（待DSH迁移完成后重新制定）**」。
- 未跟上的三处：①根 README.md :12「（草案，定稿后回 docs/）」与 :184「待老大确认后派发，定稿回 docs/」；②exchange/README.md :23「WB 2026-09-03 产，待老大确认后派发」；③TODO.md :290（部署调试试运行段引言）「…2026-09-03，草案待定稿」。
- 影响：按旧描述，读者会以为该方案处于「老大确认后即可派发」的待命态；实际已被搁置、等 DSH 迁移完成后重制。DSH-3 正在进行中，该时间点信息对排期判断有实际意义。
- 建议：三处统一改为指向文件自身的现行状态口径（「待 DSH 迁移完成后重新制定」）。

### M · 中优先级（登记滞后）

**M1. Qoder 角色未入两份角色分工文档**

- 已登记处：HUMAN_NOTE.md :19（2026-9-15 加入、与 Qoder Work 区分、负责文档观察）✓；exchange/README.md :16（log-qoder.md — Qoder 文档一致性观察者）✓；约束载体 `.qoder/rules/QODER.md` 已实际生效（本会话验证注入正常）✓。
- 未登记处：①根 README.md「多 AI 协作」段（:197）列 Trae CN / Claude Code / Marvis / WorkBuddy / UI 设计角色，无 Qoder；②docs/ai-governance.md §3「Tier 1 角色约束文件」载体清单（:63-66）无 Qoder（该总纲为 2026-08-17 v2，早于 Qoder 加入）。
- 建议：ai-governance.md 是角色分工总纲，活跃角色缺席会影响新会话对协作面的完整认知；建议择机补一行（载体 `.qoder/rules/QODER.md`，职责文档一致性观察）。README 协作段可一并补。

**M2. 根 README.md 项目结构树与现状漂移（最后核对 2026-08-30）**

- 结构树缺实体目录：`harness/`（DSH-2.1 起的 pnpm workspace 工程区，现为迁移主战场）、`ref/`（上游裸仓库 dsh-bare + 社区参考件，docs/dsh/README.md 明文依赖它）；另缺 `.dsh-home/`（本机 DSH home，属运行时可略）。
- 顶部状态（:14）「当前状态（2026-08-30 核对）：主线阶段 P0–P4 已完成…」未反映 DSH 迁移线（DSH-1/2 已归档、DSH-3 进行中）——现役主线实际在 TODO.md「DSH 迁移」区。
- 建议：harness/ 与 ref/ 至少应入结构树（有独立维护规则与被依赖关系）；状态行可改为指针式「当前阶段以 TODO.md 为准」避免快照失真（README 自身 :15 已有此口径，顶部状态行却仍是硬快照，两者不一致）。

**M3. npm dist-tag `latest` 值两处记录矛盾（定案稿 vs WB 活日志，同日各自「实测」）**

- dsh-migration.md :79 与 :85：`latest = 0.1.5-rc.1`（自 09-10 起未推进）。
- log-workbuddy.md :111（09-15 晚，回报 002 复验）：`latest = 0.0.1-rc.1（从未推进）`。
- 两说均支撑「勿以 latest 判断上游进度」的纪律，但数值不同（0.1.5-rc.1 vs 0.0.1-rc.1），至少一处错。按区规 docs 为定案级、log 为临时记录，若错在 docs 侧需订正。
- 建议：能跑 npm 的一方（Claude/Trae/WB 任一）执行一次 `npm view @deepseek-ai/dsh dist-tags` 定音，然后以实测值订正 dsh-migration.md（log 侧按「不留痕」原则不追改，但定案稿须准）。

### L · 低优先级（历史快照 / 轻微问题）

**L1. archive/roadmap-history.md 头部自述与检索提示过期（锁定区，仅报不改）**

- :3 自述「P0–P3 已完成阶段全文」——现文件含 P4、功能增强、DSH-1、DSH-2。
- :5 检索提示只列 `### P0 / P1 / P2 / P3`——实际可检 P4 / DSH-1 / DSH-2。
- :6 引用 `WORKBUDDY.md`——根目录无此文件（WB 载体实为 `.workbuddy/memory/MEMORY.md`），死引用。
- :395 引用 `dsh-local-env.md` / `dsh-cloud-deployment.md`——两文件已于 2026-09-12 迁移更名为 docs/local-env.md / docs/production-env.md（docs/README.md :23 有案），DSH-2 归档段内旧名失效。
- 定性：锁定区历史快照的自然漂移；但该文件是「排查 BUG 前先扫」的检索入口，头部提示失效会降可用性。建议老大裁决是否以「头部追加一行订正注记」方式处理（不改正文）。

**L2. archive/README.md :27 索引描述滞后**：roadmap-history.md 描述为「P0–P4 已完成阶段详情＋后续功能持续迭代」，未提 DSH-1/DSH-2 已冷存于此（TODO.md :12-13 明言「冷存于 archive/roadmap-history.md」）。另 TODO.md :277「与 P0–P5 无关」引用了已取消的 P5 编号（同段 :12 用 P0–P4），口径不一，轻微。

**L3. exchange/README.md :4 WB 派发权限清单未含 log-qoder**：若老大有意让 WB 也可向 Qoder 派发（如文档核对类任务），需补登记；若有意让 Qoder 只受老大直管，现状即正确但建议显式说明一句，免歧义。

**L4.（备知，可不处理）log-claude.md :10/:51、log-trae.md :32 引用旧路径 `exchange/dsh-015-capability-mapping.md`**——该文件已 git mv 至 docs/dsh/。按「log 不留痕、不追改」新原则属历史陈述，不动。

**L5. HUMAN.md「Qoder观察到的问题」第 4 条可收口**：该条问「vector_store.enabled 绕过是否已修好、TODO 待点将状态建议核对」。经核：roadmap-history.md :331-339 已记录「vector_store.enabled 开关贯通（召回＋归档写入双路径）✅（2026-08-30，四步闭环＋提交号）」，现 TODO.md 无对应待办。该问题已闭环，HUMAN.md 该条可由老大自行删除或标记已处理。

### 核对无误项（简列）

- exchange/README.md 对 log-qoder / capability-tree-revision / web-search-design / discussion-time-context 的索引描述与各文件实际状态一致 ✓
- product-positioning.md「8 域 / 31 子项」与根 README、docs/README 口径一致（变更记录 29→30→31 演进有据）✓
- docs/dsh/README.md 索引、环境文档迁移说明、ref/dsh-bare 查阅规则自洽 ✓
- capability-tree-revision.md「待老大逐条批」状态与 §0 已记的 8 条方向并存（方向≠批准改稿，属流程中自然状态，不算矛盾）✓；其 2.7.2「须先实测」前置已由 002 实测判「过」满足（TODO.md :242），老大批稿时可参考
- git 工作区干净；`ec3d7ea`（历史文档中「Qoder」订正为「QoderWork」）未误伤 Qoder 现行记录（HUMAN.md / log-qoder.md / exchange/README.md 均未动）✓
- WB log 已自我暴露的已知项（MEMORY.md 职责描述滞后、存量 log 引用面、harness 同步数字矛盾单列待核）不重复登记，以 WB 记录为准 ✓

---

**待老大裁决汇总**（按建议动作排序）：删改 TODO.md :30 警示行（H1）→ 统一 deployment-architecture 三处状态口径（H2）→ 补 Qoder 角色登记（M1）→ README 结构树/状态行刷新（M2）→ npm dist-tag 定音（M3）→ archive 两项老大自便（L1/L2）→ log-qoder 派发权限表态（L3）→ HUMAN.md 第 4 条收口（L5）。



【老大批复：M1、L1、L2、L3、L4、L5、N1我已处理，其他的已由WB处理，你可先行针对性复检处理情况，检查完之后再跑一遍全量检查】