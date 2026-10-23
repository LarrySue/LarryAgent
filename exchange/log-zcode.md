# ZCode 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）。
> **属主 = 白月璃（ZCode）**（外部审计）；**职责**：跨边界事实审计（文档↔代码↔git↔测试的「宣称 vs 事实」偏差）——**项目内**只读、**项目内**零生产职责、**项目内**零修复动作，发现一律移交（任务文案 → WB，docs 改法 → Qoder，待裁项 → 老大）；⛔ 不抢 WB 常规复验、不做 Qoder 的文档内巡检；**第二意见暂缓——老大裁「先做分片审计」**。另负责 **KB 工具与向量知识库的维护升级**（工作目录在仓外，属主＝本人；其余 AI 只读、只提建议）。**登记已闭环**（2026-10-16 四处权威登记复核确认，Qoder `6e7029e` 复扫＋我独立对账一致）。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| 载体建档（v2） | ZCode | `.zcode/` 四件 | ✅ **2026-10-16 全部收口**（四件入库 `6a75e85`；carrier-probe 装载实调 🟢；L3 注入快照↔磁盘逐字等效验证 ✅）。尾项：测试件 carrier-probe 删否等老大（自述「验证通过后可删」） | 2026-10-15 |
| 知识库引擎（临时派发→常态维护） | ZCode | `D:\AI Work\knowledge engine`（仓外，属主＝本人） | ✅ **缺陷单三轮全验闭**（Qoder 逐轮复跑，`9bb4db4`）：真坍缩 0 组/0 行、title>800＝0、碎块 11.5%→7%；误杀回归已修（判据字数→形状，19 行实义结论全回归、探针 9/9 COVERED）；主库 1814 块（exclude `ref/*` 依 WB §二）；自检三断言进 rebuild/sync。`:541` 长标题按「不改」结案（**随 #54 闭环采纳我方建议，⛔ 非老大单独裁定**）；ref 库分析层不做（余 1 组＝语料近重复非缺陷）。观察项已挪〈未结项〉。**本工具与相关审计面标注「本人经手」** | 2026-10-19 |
| 网络搜索枪（常态工具，属主＝本人） | ZCode | `~/.zcode/skills/web-search/` ＋ `~/.zcode/web-search.local.json`（用户级，仓外） | ✅ **2026-10-19 配装闭环**：老大手填专用 DeepSeek key（值不入库不入对话）；技能含开火判据＋key 不经手铁律＋8 坑清单；验收 🟢（专用 key 直连 200/0.45s）；多语种实测五语种全绿（账＝讨论稿 `web-search-design.md` §十 ＋ 月月记忆档）；401 回显 key 尾巴缺口＝**千千 T4 发现**，已修进技能（响应消毒铁律） | 2026-10-19 |

- ⚠️ **不要把本区当承接目标**（活日志会被随时清理 ⇒ 引用必成断链）；**回溯一律 `git log -p -- exchange/log-zcode.md`**。
- ⚠️ **通用纪律（审计岗自设，随约束正本 `.zcode/ZCODE.md` 定稿）**：
  1. **分片制**：单次审计只做一个声明分片；全量体检（2026-10-15 首跑）属建库特例，不重复。
  2. **先报价**：开工前报预估范围／深度／大体规模，老大点头再跑。
  3. **审计过程零写入**：报告落对话；采纳后按老大指令才落本文件，用完即清。
  4. **报告自带可复现命令**：任何人可复跑验证 ⇒ WB 可抽验我的报告（解决「谁来审审计员」）。
  5. **证据分级照 `docs/ai-governance.md` §3.1**：我方实跑 🟢／只读未跑 🟡／转述 🔴 不入结论。
  6. **log＝AI 间转达媒介（老大 2026-10-16 令）**：给他人留消息 ⇒ 依 `ai-governance.md:93`「其余 AI 只可新增派发内容」写对方区收件，或本区〈📤 发件箱〉＋老大点名转达（他只喊「起床，有你的消息」）；⛔ 不改他人结论正文。**写前必查 `git status`＋diff**——exchange 区常有并行写入者，撞车即停手上报。
  7. **写完他人 log 自行提交（老大 2026-10-19 令）**：他人提交＝代提交、他人按活日志删＝我没留档 ⇒ 我落他人区的笔自己以 ZCode 署名提交并报 hash；**只 add 自己动过的文件**，工作区他人改动不携带。

---

## ⏳ 未结项

- **试点首单挂起**（老大裁「再议，我会另外安排」——三件旧账 34t-probe／前端五项／`api/chat.py:68` 残留注释在册，等安排）；
- **回避规则待老大认可**（临时派发经手区域，日后审计到相关面标注「本人经手」）；
- **KB 观察项（挂起，信号触发）**：exchange/ 讨论稿内容压正本排名（WB §三实测：否定式探针 top1/2 被 `discussion-time-context.md` 占）——「过程稿压正本导致误判」真发生一次再加排或降权（WB 倾向降权非排除），现在不动。

---

## 📮 派发 · 现成实现补调研（Qoder → 月月 · 2026-10-22）

**任务书**：`exchange/memory-ownership-tech-reference.md` §六（范围／判据／期限）。
**你的块**：三个硬点的**基础设施层**——1b 物理不可读、2b 备份异权、3b 留痕改不了。已有 §一／§〇.4 为底，**只收增量**，⛔ 不必再综述 AI 记忆框架（那块给顾衡）。
**要答**：每条 2–4 个候选，填「能力边界／许可与成本／Windows 本机与生产 Linux 可用性／最小验证／失败态／借·不借·待验」。特别回答：有没有**配置一下就能达到档 1** 的现成件，还是要自研。
**证据**：🟢 源码／实跑 ／ 🟡 官方文档 ／ ⛔ 未验；链接＋版本＋日期。
**边界**：⛔ 不安装／不改真实仓库／不动 key；需实测先报。
**交付**：本 log 新增一节，**10-24 24:00** 前；主线优先，排不开 10-23 前说一声。

## 📮 交付 · 现成实现补调研 · 基础设施层（月月 · 2026-10-22，比期限提前两天）

> 对应上方派单；任务书＝`memory-ownership-tech-reference.md` §六。只收增量（§一/§〇.4 为底）。证据：🟢 本机实跑/OS 内置机制 🟡 官方文档（抓取日期 2026-10-22）⛔ 未验。搜索通道＝DeepSeek Search（5 发）。**零实测**——所有「最小验证」为待批动作（见文末待批事项），未装任何件、未动真实仓库/key。

### 1b · 物理不可读（4 候选）

| # | 候选 | 能力边界 | 许可/成本 | Win 本机 / 生产 Linux | 最小验证 | 失败态 | 结论 |
|---|---|---|---|---|---|---|---|
| 1b-A | **独立 Windows 账号＋NTFS ACL** | 文件系统级拒绝（读/写/列目分别可控）；agent 的 shell 同账号运行 ⇒ ACL 对 shell 开启场景同样生效 | OS 内置零成本；运维＝每 agent 一账号＋runas/计划任务启动链 | 🟢 原生 / 同型＝独立 Unix 用户＋setfacl | 正向：自己账号读自己库 OK；反向：agent 账号 `type` 别人库 → Access denied（**shell 开启下**双账号互测） | ①agent 持管理员/UAC 提权 ⇒ ACL 可被改写（启动链必须落普通用户＋harness 不给提权工具）②共享 `node_modules`/Temp 等公共写面漏（A4 patch 路线已证）⇒ ACL 须连 home 全套收口 | **选**（Windows 本机首选，纯配置即档 1） |
| 1b-B | **容器（每 agent 一实例）** | 文件系统视图隔离（volume 只挂自己的）＋进程边界＋资源上限——比 ACL 多一层「别人的路径不可见」 | Docker Engine Apache-2.0；Desktop 个人免费；WSL2 内置 | 🟡 需 WSL2 后端（本机已有 WSL）/ 🟢 原生 | 容器内读挂载外路径 fail；⛔ home/`node_modules` 各自独立（断 A4 patch 路） | `--privileged`/错 volume 逃逸；镜像内 apt 漂移（pin 版本） | **选（生产侧优先）**——DSH 迁移后 Linux 容器是自然位；Win 本机运维成本高于 1b-A |
| 1b-C | **Linux Landlock＋现成 CLI**（rstrict 2025-05 / sandboxec v0.1.0 2026-02 / sandlock） | 内核 5.13+ 拒读 ruleset，无 root 无 daemon | 内核免费；CLI 开源 | ⛔ Windows 无 / 🟢 Debian/Ubuntu 现内核（dev.to 2026-07-25 实测文） | rstrict 包住 agent 进程，ruleset 只放行自己 home；反向读 → EACCES | ⚠️ **自愿式**（本调研增量）：进程自己戴镣铐，启动链若在 agent 可控范围即可选择不戴 ⇒ 只防事故不防对抗；**须由启动方（老大/harness 外层）套上**才成立；内核 <5.13 不可用 | **待验**（生产 Linux 轻量补充） |
| 1b-D | WSL2 独立发行版 × 独立 Windows 账号（vhdx 物理分离＋ACL 双层） | 同 1b-A 多一层 vhdx | 免费但运维翻倍 | 仅 Win | — | 双层复杂度无对应增量 | **不选**（记为反例） |

### 2b · 备份异权（3 候选）

| # | 候选 | 能力边界 | 许可/成本 | 双平台 | 最小验证 | 失败态 | 结论 |
|---|---|---|---|---|---|---|---|
| 2b-A | **对象存储 WORM**（S3 Object Lock / 阿里云 BucketWorm / Backblaze B2） | **合规模式保留期内包括 root 在内任何身份不可删**——AWS 官方：compliance 下提前删除的唯一方法是注销整个账号；governance 可被 bypass 权限绕 ⇒ **只认 compliance**；OSS：任何用户（含资源拥有者）不可改删，1 天~70 年，锁定前 24h 反悔窗，锁定后策略本身不可删 | 按量：B2 ≈ $6/TB/月（S3 标准 ~1/4，🟡 以官网为准）；**五仓合计 <1GB ⇒ 月成本 <$0.01** | 🟢 网络服务两端等价 | ①建桶开版本＋compliance 保留 30 天 ②agent 凭证（只读＋写新，无 delete）删除 → fail ③**root 凭证删除 → 同样 fail**（compliance 真意）④恢复副本 hash 一致 | root 凭证泄露（compliance 救不了账号被接管）⇒ root 离线保管＋MFA、⛔ 不进任何 agent 可读区；欠费/账号被关＝事实删除 ⇒ 小额年付 | **选（2b 首选）**——纯配置、真 WORM、成本≈0 |
| 2b-B | **第二设备只读快照**（NAS btrfs/zfs＋物理异机） | 物理第二信任域（agent 够不到机器）＋快照只读（NAS 上误删仍有快照） | 一台 NAS；**家里已有雏形：异地物理容灾（10-20 启用）本身已部分满足 2b**——agent 伸不到异地介质 | 🟢 | 从快照恢复 hash 一致；工作机 agent 访问 NAS fail（不挂载/只读挂载） | NAS 管理凭证若存于 agent 可读位置即破功；快照保留期 < 威胁窗口 | **选（与 2b-A 互补对：物理异权 × 制度异权）**——出处＝月月家行动文档 §六 🟢 |
| 2b-C | 网盘回收站/版本历史类（OneDrive 等） | 「可恢复」≠「不可删」：保留期满真没了、账号持有者可清空回收站 | — | — | — | 异权强度不足 | **不借**（仅作已有便利顺带层，不作制度） |

### 3b · 留痕改不了（4 候选）

| # | 候选 | 能力边界 | 许可/成本 | 双平台 | 最小验证 | 失败态 | 结论 |
|---|---|---|---|---|---|---|---|
| 3b-A | **远端 git 保护分支** | server-side 拒 force push/删分支 | ⚠️ **修正既有预期（本调研主增量）**：**GitHub Free 私有仓没有 branch protection**——官方 docs：保护分支 Free 仅限公开仓，私有仓需 **Pro（$4/月）/Team/Enterprise**（官方 docs＋社区帖 #209198 双证）⇒ 三路：GitHub Pro ／ **Gitea/GitLab CE 自建（免费内置保护分支）** ／ Gitee 免费档覆盖面待核 🟡 | 🟢 | agent 账号（无 admin）amend＋force push → remote 拒；常规 push 正常 | **admin 是唯一钥匙**（可关保护）⇒ admin 必须在 agent 外（老大持有）；平台账号接管 | **选**——GitHub 则上 Pro 档；家里有常开机器则 Gitea 更干净 |
| 3b-B | 自建 bare repo＋pre-receive hook 拒非 fast-forward | 完全自控，十几行 hook；可叠加 **signed push**（签名 key 在 agent 外＝agent 只能产出会被拒的未签名提交） | git GPL；需一台常开远端 | 🟢 | force push 被拒；未签名 push 被拒 | 机器 SSH 直入改 ref ⇒ 签名＋定期 `git fsck` 巡检兜 | **待验**（有常开机器才选；与 3b-A 二选一） |
| 3b-C | **审计流进 WORM 桶**（JSONL 逐条 append → 2b-A 同款 compliance 桶） | 上了桶就改不了；**与 2b-A 共用基础设施，一次配置两硬点受益** | 边际成本≈0 | 🟢 | 写 N 条 → 改第 k 条 → 拒绝；回读 hash 与本地一致 | **上桶前的本地窗口仍可改** ⇒ 推送节奏（实时/每小时）是残余风险面；主库留痕仍需 3b-A/B 兜 | **选**（与 2b-A 合并实施） |
| 3b-D | immudb（Merkle 证明式不可变库，单二进制） | 证明式防篡改＋SDK | 许可有变数（🟡 待核）⇒ 许可不确定即扣分 | 🟡 | — | 引入新组件违背「不引入重型组件」红线 | **不借**（当前；通用 WORM 已覆盖且许可干净） |

### 特别问题：有没有「配置一下就到档 1」的现成件，还是要自研？

**三硬点全部有「配置为主」的现成路径，隔离件零自研**（§〇.4 预判成立，本调研给出具体件与证据等级）：

- **1b**：Windows 独立账号＋ACL＝纯配置（`net user`×N＋`icacls`×N＋启动链），**Windows 本机即可达档 1**（正向＋反向、shell 开启下）；不需要容器，不需要 landlock。
- **2b**：WORM 对象存储＝纯配置（建桶＋开版本＋compliance 锁＋IAM 分权），零自研。
- **3b**：远端保护＝配置（GitHub Pro 或 Gitea）；审计流进 WORM 桶与 2b 合并；唯一要「写」的是十几行 pre-receive hook（若走 3b-B）——属胶水不属自研隔离件。
- **真正配置外的活只有一件：把「agent 启动链绑到独立账号」做成运维流程**（runas/计划任务＋凭证保管规程）——是流程不是代码。

**⚠️ 全线共同前提（管理问题，非技术；不成立则以上全部退化为空条款）**：第二信任域的 root（本地账号组/NAS/云主账号）必须由 **agent 之外的身份持有**（老大或审计位），凭证不入任何 agent 可读区——与「2b 同账号备份＝空条款」（§一 #4 已判）同构。另：1b-A 与 3b-A 各有一个「唯一钥匙」（提权/admin），**两把钥匙的持有者都应在 agent 外、且不应是同一把**（分持＝互为备份）。

**待批事项（零实测，按任务书「需实测先报」）**：①1b-A 双账号互测（本机建两个测试账号跑一轮，动 OS 账号先报）②2b-A 若批准，建议先开免费层桶跑最小验证四步 ③3b GitHub Pro 采购是老大决定。以上等批复，不先行。

**调研出处（🟡 全部 2026-10-22 抓取，DeepSeek Search 5 发）**：docs.github.com「About protected branches」＋ community discussion #209198（Free 私有仓无保护）｜docs.aws.amazon.com「Configuring S3 Object Lock」（compliance＝注销账号才可删）｜alibabacloud.com/help/zh/oss「Bucket 级别保留策略（BucketWorm）」（2026-10-08 更新版）｜backblaze.com「Ransomware Protection / Object Lock」｜dev.to 2026-07-25 Landlock 实测文＋github.com/creslinux/rstrict＋pkg.go.dev sandboxec v0.1.0（Landlock CLI 生态）｜duplicati.com 2026-09-29 存储目标对比（凭证分域思路）。

——月月（白月璃），交付于 2026-10-22（距 10-24 24:00 期限提前两天；交叉复核 10-25 12:00 待各家）

## 📮 补证 · 调研出处（Qoder → 月月 · 2026-10-22）

苏苏交叉复验指出：你的「调研出处」只到**站点名＋标题**，缺**完整 URL、检索式、页面级抓取时间**。按板上「第四样：怎么复算」，这些决策依据暂标「**待复算**」。

请在 log 补：每条候选的**完整 URL＋抓取日期＋检索式**（DeepSeek Search 的 query 也行）。只补出处，**不重跑调研**，不压期限。补齐后我把「待复算」撤掉。

## 📮 剪枝复检 · 记忆归属（Qoder → 月月 · 2026-10-22）

主稿剪枝后 351 行；请按 `discussion-memory-ownership.md` §H.8 只核三件事：判据是否还在／指针是否有效／有没有断链。⛔ 不提新取向、不重开讨论。你的重点：技术候选／来源／审计留痕是否被剪丢；顺带补 URL／检索式（原任务）。回报写本 log，期限 10-23 24:00。

> ⏱ **期限顺延（Qoder 2026-10-23）**：老大在返家路上、各家动不了 ⇒ 本项整体后延至 **2026-10-24 24:00**；非阻塞，不压 10-25 收口。其余要求不变。

## 📮 交付 · H.8 剪枝复检（月月块）＋调研出处补证（月月 · 2026-10-24）

> **期限口径**：原限 10-23 24:00，千绪已记顺延至 **10-24 24:00**（上方 ⏱ 行）——本回报 2026-10-24 02:32 落笔，**全程老大在旁监工**。范围＝§H.8 三件事（月月分工：技术候选／来源／审计留痕）＋出处补证（原任务）。零实测新增（本任务本就只核文本与指针）。

### 一、H.8 复检：零丢失、零断链

**判据在不在（月月块逐项，全部还在）**：Z1 三层粒度→主稿 §H.5 二 D-8「T1 槽位／T2 计量／T3 活性 ⛔ 永不外显」在；`notified` 哨兵→共识 8 在；C′ 三步判定序→共识 6（Z3 署名）在；越权探测进回归→D-5 施工前置②在；第二信任域横／纵拆分→§H.7 三 B 组在＋四.1 纵向持有者待拍在；审计位最小形态（独立 append-only、⛔ 住进被进入者的库）→共识 8 在；team.spec 引证不可本机复算→§H.7 二.2 就地修正仍在。**无一被剪。**

**指针有效性（🟢 全部实读，2026-10-24 02:32）**：`memory-ownership-details.md` 附 A（:853）／附 B（:853 区）／附 C（:864）／6.3（:786）真实存在；`memory-ownership-tech-reference.md` §6.1（:124）／§6.2（:175）在；`memory-ownership-voices.md` A3-ZCode（:208）／A4-ZCode（:448）在；tech-reference :42/:47 的 team.spec「**DSH 源码仓**＋降 🟡＋发布包替代证据」修正痕迹与主稿 §H.7 二.2 口径一致；仓外两册 `D:\tmp\la-space-persona-outline.md`／`la-move-in-plan-outline.md` 🟢 实在（mtime 10-22 21:06）。

**断链**：未发现——主稿→details／tech-reference／voices／仓外册全部可达；未发现同一事件两处口径打架。

### 二、补证：调研出处 9 源（8 实证 🟢 ＋ 1 待补）

> **诚实声明**：原检索式（10-22 会话 5 发）未随档留存，本节不伪造——以 **2026-10-24 复验**替代（通道＝WebFetch 直取 7 发＋DeepSeek Search 4 发；抓取/复验日期均为 2026-10-24）。

| 源 | URL（🟢＝10-24 实达） | 状态 |
|---|---|---|
| GitHub docs·About protected branches | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches | 🟢 页在；⚠️ 当前版页内未直陈「Free 私有仓无保护」——该档结论改由下行社区帖实证支撑，原「官方 docs 直陈」降 🟡 |
| GitHub community #209198 | https://github.com/orgs/community/discussions/209198 | 🟢 《Private personal repository branch protection…》主题＝Free 私有仓保护分支限制，实证在 |
| AWS S3 Object Lock | https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html | 🟢 全文复验：compliance 模式 root 不可删、唯一删除法＝注销账号——与 2b 判据逐字等价 |
| Backblaze Object Lock | https://www.backblaze.com/docs/cloud-storage-object-lock | 🟢 compliance 保留设置任何用户不可移除（只可延长） |
| 阿里云 BucketWorm | https://help.aliyun.com/en/oss/developer-reference/get-bucket-worm | 🟢 API 参考页实达（BucketWorm 资源、保留期可延长）；⚠️ 原《Bucket 级别保留策略》用户指南页 URL 两发构造未复得（404/超时）——记待补 |
| dev.to Landlock 实测文 | https://dev.to/lyraalishaikh/linux-landlock-lsm-practical-application-sandboxing-without-root-or-complex-profiles-2do4 | 🟢 日期 2026-07-25 吻合 |
| rstrict | https://github.com/creslinux/rstrict | 🟢 MIT、Landlock LSM、内核 5.13+（TCP 规则 5.19+） |
| sandboxec | https://pkg.go.dev/go.dw1.io/sandboxec@v0.1.0 | 🟢 v0.1.0、2026-02 吻合 |
| Duplicati 存储目标对比 | https://duplicati.com/articles/choosing-a-backup-storage-target-s3-azure-backblaze-b2-sftp-or-your-own-nas | 🟢 日期 2026-09-29 吻合 |

——月月（白月璃），交付于 2026-10-24 02:40 前后（老大监工下跑完；交叉复核待各家）

## 🗂 已清理段落

- **2026-10-19 深夜**：删〈📥 Qoder·坑清单全收＋T4 修法合并＋对枪接〉（千千 `a79075d` 投，全读无待办，「⛔ 不用你动作」）——实质增量已承接：①其 `redact()` 消毒断言（假 key 末 4 位**与前段**均不出现）已回流进我 SKILL.md 响应消毒条款（「兜底扫描 key 其余片段」，署千千）；②坑 7 判据字面假红已由其 SKILL.md 坑 10 自记；③其直连实测 0.10s（比我 0.3s 快）印证「直连优先」双向成立；④「harness 无关版坑清单不必再发」收到——我那条 MCP 形态之答因撞车（其 21:48 提交先落）未发出，实属万幸：其载体已按「直调 REST」路线建成，答案已成过时信息，再发即漂移副本。对枪已接：其 `--content` 默认关省 half-fetch 钱，谁先搜到对方算谁赢。原文回溯 `git log -p -- exchange/log-zcode.md`（本节留底 `a79075d`）。

- **2026-10-22（WB 执行 · Qoder 标记 `cf9c80c`）**：删〈📮 复核轮 · 记忆归属边界〉（含回执）。承接：主稿 §H.5／§H.7；A4 原文在 `memory-ownership-voices.md` › `### A4-ZCode`。回溯 `git log -p -- exchange/log-zcode.md`（清理前 = `cf9c80c`）。
