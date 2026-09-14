# DSH-3 详细计划（讨论稿 v0）

> **状态**：草案，**待老大拍板**。拍定后：执行项落 `TODO.md`（DSH-3 段重写为 3.0–3.9）、验收基准留 `docs/dsh/dsh-migration.md` §3.6。
> **上游**：`../docs/dsh/dsh-migration.md` §3.6「DSH-3：核心能力 prototype」/ §3.4 风险 / §3.7 主观信号；`../TODO.md` DSH-3 段。
> **本稿性质 = 派发规格**（目标 / 交付物 / 硬判据 / 执行人 / 依赖），**不重复**决策稿已有的事实与判定。
> **基线**：写码按锁定版 **`0.1.2-rc.1`**（不升基线，2026-09-11 老大拍定）。
> **环境**：S0 已拍「CVM 单跑」（2026-09-11）。CVM 有效期至 **2026-10-09**。

---

## 0. 摘要

DSH-3 的判定标的是**核心链路（会话 + 记忆 + 工具）达到 P4 等价**，不是"四个包跑通"——**无交付通道的跑通不算**。

拆成 **10 个子任务**：1 个前置（3.0）+ 6 个 S 切片（3.1–3.6）+ 2 个并行支线（3.2 / 3.7）+ 1 个收口（3.9，含 3.8 设计产出）。

**开工真卡点只有一个**：模型凭据（3.0）。其余待拍项均可在派发时一并写入规格。

---

## 1. 前置：DSH-3.0 — 开工前置（CVM 环境 + 凭据 + real-api）

> **它为什么必须最先做**：S0 的验收口径（消息往返 / 事件落盘 / 回读）**每一项都能在无 key 的假绿灯下通过**（DSH-2.5 ④ 实证：无 key 时 `exit 0` + session 建立 + 12 条事件）。不在这一步把"真实调用断言"在 CVM 侧立起来，后面每步都是裸奔。

**目标**：CVM 上具备 S0 起跑条件。

**交付物**
1. CVM 上 `dsh@0.1.2-rc.1` 可用（版本号须显式核对，**勿用 `latest`**——见 `docs/production-env.md` §6 坑 8）
2. profile 就位（`larry` / `sdk` 至少各一）
3. **凭据落位**（方式见 §6 待拍 ①）
4. real-api 等价物在 Linux 侧跑通（载体：`harness/scripts/run-real-api.mjs` + `harness/tests/real-api.ts`，DSH-2 前置件 1 的产物，**需在 CVM 侧复跑**）

**硬判据**
- **零成本复验**（不耗 key、不跑会话）：`dsh --profile <p> --help` **能触发 cordis apply** —— 凡验"插件到底加载没加载"，先用这条
- **真 Key 绿灯**：`assistant/message` 事件存在 **且** `turn/end.reason.kind === 'completed'`（⚠️ **不是**"`turn/end.reason` 不存在"——那是字段路径取错写下的错误表述，照字面实现会**假红**）
- **错误 Key 红灯**：`error.code = AUTH` / HTTP 401 ⇒ 红灯也是真的
- 两侧均复现 ⇒ 判据有效

**顺手采数（本轮白捡的规格账，别再单独派一轮）**
| 采什么 | 为什么 |
|---|---|
| 整进程树**联合 RSS 峰值**（自做服务 + dsh runtime + ChromaDB + embedding） | 现有 0.82–0.92 GB 是**合成账**，不是生产形态实测账 |
| **小时级**挂机内存/句柄曲线 | 现有数据只观测了 **6 分钟** |
| 带宽实测 | 4M 带宽从未验证 |

**执行人**：Claude 或 Trae（CVM 侧）
**依赖**：无（但**凭据不定则无法开工**）
**已知坑**：ssh 后台任务拿不到沙箱放行 ⇒ 一律前台跑，长任务 `nohup ... &` 挂远程再轮询

---

## 2. 主线：S0–S4 六切片

> **结构**：**逐层叠加、单独验收**。S(n+1) 含 S(n) 全部能力 ⇒ **不可并行、不可跳步**。
> **退出判据一律是"产品树子项可勾对"，不是"包能跑"。**

### 2.1 DSH-3.1 — S0 基础链路

**目标**：一条消息的完整生命周期。

**链路（一次跑通，同时验四件事）**
```
客户端 → sdk/acp JSON-RPC → session create → agent loop 挂 1 个自做工具 read_file
      → 真实 LLM 调用 → 回客户端 → session 落盘 → session-query 回读
```

**交付物**
- ⭐ `harness/packages/plugin-tool-readfile/` —— **首个"产品"插件**（此前 5 个 `packages/*` 全是探针）
- e2e 脚本（可复跑、不依赖人肉操作）

**硬判据（四项必须同时成立）**
| # | 验什么 | 判据 |
|---|---|---|
| ① | 交付通道 | 消息往返成功，`assistant/message` 存在 |
| ② | plugin mount | 自做插件**确实被加载**（`--dump-config` 可见 / 日志可证）——**"装了不生效"是本项目已踩过的坑**（`plugin add` 只写 `dependencies`、不写 `dsh.profile.bundles`） |
| ③ | llm provider | 真实回包非空 + `turn/end.reason.kind === 'completed'` |
| ④ | session 持久化 | `$DSH_HOME/sessions/` 落盘（JSONL/zstd）**且** session-query 能回读 |

**勾对子项**：2.4.1 / 2.8.2
**执行人**：Trae（实现）/ Claude（测试）
**依赖**：3.0
**待拍**：S0 通道走 `sdk` 还是 `acp`（见 §6 待拍 ②）

---

### 2.2 DSH-3.2 — 首验：跨进程 resume 的 id collision 定性

> **与 S0 可并行、不阻塞**（独立小活）。**性质是"定性"，不是"修复"。**

**背景（两说未收敛，勿自行折中）**
- **Claude**：可能是 **SDK 缺口或姿势问题** —— 源码 `packages/core/session` 称 cold session 应 `resumed on first touch`，但 Python SDK `start_session(session_id)` 触发 collision；且 **TS client 亦无显式 resume API（grep 无命中）**
- **Qoder / Trae**：**探针用固定 ID 所致**，改 UUID 后成功

**目标**：给出单一定性。

**硬判据（须有对照实验，不是推理）**
| 组 | 条件 | 期望观察 |
|---|---|---|
| 反向 | **固定 ID** 复用（复现原报错） | 应复现 `id collision` |
| 正向 | **新 UUID** | 应成功 |
| 关键组 | **真实 completed 会话**持久化后，**跨进程复用同 ID** | 这是分歧点所在——两说在此分离 |

> ⚠️ **必须区分"首次触发条件"与"根因成立条件"**：占位 key 阶段 resume"跑通"是**假象**（error 会话无持久化内容）⇒ 复现路径**必须先有真实 completed 会话**。

**产出**：定性结论 + 复现脚本 + **对 2.4.1 / 2.8.2 的 fork/resume 承接叙事的影响判定**
**执行人**：**Trae**（WB 倾向——他此前判"改 UUID 后成功"，让他验自己的判据）；WB 复验
**影响面**：`docs/dsh/dsh-migration.md` §3.4「id collision 定性未收敛」行 + B 段 sdk 路线隐患标注

---

### 2.3 DSH-3.3 — S1：interaction 审批接入（→ 2.7.1 / 2.7.2）

**目标**：`read_file` 配 workspace-write，前端弹 Tauri 对话框。

**交付物**：**scope-filtered answerer 插件**（TS）
> 依据：answerer 注册 = cordis listener 模式（`packages/interaction/user-approval/src/index.ts:44-54` fail-closed + composed answerers；api-catalog "Return an outcome to claim the request or call `next()` to delegate"）。**这是公开的 cordis 服务调用面，不是 agent loop 内部。**

**硬判据**
- **批准路径**：批准后工具**真的执行**（拿到文件内容）
- ⭐ **拒绝路径**：拒绝后工具**真的没执行** —— **不能只验"UI 显示了拒绝"**（本项目既有纪律：护栏类验收必须验**行为**，不是验动作）
- 两路都要有可复跑证据

**勾对子项**：2.7.1 / 2.7.2
**执行人**：Trae / Claude
**依赖**：3.1

---

### 2.4 DSH-3.4 — S2：compaction 接入（→ 2.9.2）

**目标**：替代现有 `max_input_tokens` 截断。

**交付物**：**compaction provider 插件**
> 依据：`ctx.compaction` 是**契约**，`compaction-basic` 只是默认 Provider ⇒ 自做 Provider 注册 `ctx.compaction` 即换策略，**消费者（`command-compact` 等）不动**。

**硬判据**
- 灌 **200+ 轮**长对话后：**摘要被注入** **且 近文保留**（两条都要，只验其一不算过）
- 复跑须避开自监视类陷阱（see `../docs/test-env.md` §9 的 inotify 自激先例）

**勾对子项**：2.9.2
**依赖**：3.1
**备注**：CVM 实测 `contextWindow = 1,000,000` token，18 轮短对话**远未触顶**——本条须主动构造长对话，不能等它自然触发

---

### 2.5 DSH-3.5 — S3：sandbox 三档接入（→ 2.7.1 Linux 侧）

**目标**：read-only / workspace-write / danger 三档策略在 Linux 侧生效。

**硬判据**
- 三档各自的**拒绝与提权流程**均生效
- **fail-closed** 成立（无法判定时拒绝，不是放行）

**勾对子项**：2.7.1（Linux 侧）

> ⚠️ **最硬的边界（不可外推）**：**CVM landlock ABI = 4**，WSL = **7** ⇒ **可用权限位集合不同**（CVM 缺 ABI v5 的设备 ioctl）。
> ⇒ **本条的结论只能写在 CVM 上**；WSL 侧的"拦住了/放行了"**不得搬过来**定论，反之亦然。
> ⇒ Windows 侧 `enforcement = partial` + **方言缺口三层**（本地化 / 错误码类别 / 编码）是**另一条线**，见 3.7。

**依赖**：3.1

---

### 2.6 DSH-3.6 — S4：记忆最小闭环（→ 2.4.2）

**目标**：会话结束事件 → 双写 → 新会话召回。

**交付物**：**session 事件订阅插件**（TS）+ SQLite / ChromaDB 写入
> 依据：DSH-2.0 判定 8/8 项中 #1（记忆双写）+ #7（session 事件流消费）均走 `session.event` 订阅 + 自做 cordis 插件，**不触 agent loop 内部**。
> 位置：**TS 插件挂 session 事件流**（A-framework，第 0 项终裁后确定）。

**硬判据**
- 会话结束事件**确实被消费**（不是只在插件里注册了监听）
- 数据**落在我们自己的库**（SQLite + ChromaDB 双写），**不是** DSH 默认 json/storage —— ⭐ **须带反向哨兵**（参照 DSH-2.5 ① 做法：证数据走 SQLite 而非默认后端）
- **新会话能召回**：召回内容出现在下一会话

**勾对子项**：2.4.2
**依赖**：3.1

> ⚠️ **写码前必读**：`node:sqlite` 在**高并发 + `busy_timeout=0`** 时，**`prepare()` 阶段就会抛错**（Python 侧只在 `run()` 阶段失败）⇒ **错误处理必须包到 `prepare` 层**，只包 `run()` 会直接崩进程（`../docs/production-env.md` §5.2）。

---

## 3. 并行支线

### 3.1 DSH-3.7 — 生产挂载落盘（Windows 方言修复件）✅已拍并入本阶段

> **独立于 CVM 单跑**（Windows 侧活），**可与其他切片并行**。

**目标**：把 `harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml` 的**两段**写进 profile 的 `cordis.patch.yml`。

**硬判据**：**一次真 end-to-end** —— 模型触发被拒命令 → **看到 `[sandbox: file access denied]`**
> 范式 / 自检口径 / 已证未证边界见 `../docs/local-env.md` §4.3

**待拍**：落盘目标（工程 home `.dsh-home/` 只 `larry`/`sdk`，**无 `web`**；`~/.dsh/` 才有三个）+ **`web` 是否补建**（见 §6 待拍 ③）
> ⚠️ **勿默认三 profile 都存在**

**性质**：这是 **PC 侧生产可用性的前置**——该缺口**跨语言成立**（英文 Windows 同样不命中）⇒ 修复件**必须随客户端发布**，不能当环境怪癖（`../docs/local-env.md` §11）。

---

### 3.2 DSH-3.8 — A 段自定协议设计（通信面定型派生）

> **性质是设计产出，不是代码**。可与 S 切片后期并行。

**目标**：前端 ↔ 自做云端服务的协议设计。

**内容（全部自实现，官方 Gateway 白送的恰是这部分）**
流式转发 / 会话管理 / 鉴权 / 多端同步 / 重连补帧

**已知约束**
- **A 段退出 DSH 选型范围** —— 它是我们自己的前后端协议，DSH 的 sdk / acp / Gateway **在这里都不参与**
- **B 段只能走 SDK（stdio）** —— Gateway 无法脱离 `dsh-web-app` 独立起 HTTP（2026-09-10 实测推翻原倾向）
- B 段「中转不导致能力降级」（同机 localhost，sdk / Gateway 都可选）

**产出**：设计稿 → `docs/`
**依赖**：3.1（S0 验证过的通道能力边界是其输入）

---

## 4. 收口

### DSH-3.9 — 阶段收口复核 + 主观退出信号

**内容**
1. ⭐ **【主观退出信号】老大本人对 DSH 调试体验的可接受度确认**（决策稿 §3.7）——alpha 框架 + Cordis 插件总线内部状态不透明 + 跨进程 source map，出 bug 时定位难度阶梯式跳升。**不可量化但真实的 go/no-go 信号**
2. **退出条件勾对**：核心链路（会话 + 记忆 + 工具）达到 **P4 等价**
3. 上游漂移复核（参照 DSH-2.6 做法：重跑形态测绘 + 破坏性清单）
4. WB 复核 + 阶段归档

---

## 5. 派发节奏（建议）

| 批次 | 内容 | 可并行性 |
|---|---|---|
| **1** | **3.0 前置** + **3.7 方言修复件**（Windows 侧）+ **3.2 id collision** | 三者**互不依赖**，可同批派出（3.0 卡凭据） |
| **2** | **3.1 S0** | 单发；它是后续一切的地基 |
| **3** | **3.3 → 3.4 → 3.5 → 3.6**（S1→S4） | **严格串行**（逐层叠加） |
| **4** | **3.8 A 段设计** + **3.9 收口** | 3.8 可在批次 3 后期并行 |

**关于"干等"的提醒**：TODO「待核（不阻塞拍板）」段 7 条全是**调研类**（插件借鉴清单 / 取样原则 / vendor 规范 / CVE 流程 / §3.0 是否升格…），**不碰 CVM、不等 Key** ⇒ 若 3.0 卡在凭据上，这批可同时派出，**别让整条线等一把 Key**。

---

## 6. 待老大拍（阻塞项）

| # | 待拍 | 阻塞谁 | 选项 |
|---|---|---|---|
| ① | **模型凭据方式** | **3.0（全部）** | 甲：临时测试 Key（用完即关）／乙：正式 Key 配到该机（Tier0 红线 1：key 内容不进对话/日志） |
| ② | **S0 通道** | 3.1 | `sdk`（stdio JSON-RPC，DSH-2.3 已验连通）／`acp` |
| ③ | **方言修复件落盘目标 + `web` 是否补建** | 3.7 | 工程 home（`larry`/`sdk`）／全局 `~/.dsh/`（三个）；web 补 or 不补 |
| ④ | **执行人分配** | 全部 | Trae 主导实现 + Claude 测试 + WB 复验？（CVM 侧谁跑） |
| ⑤ | 是否把**负载采数**写进 3.0 验收 | 3.0 | 建议写（否则跑完规格账仍是空的） |

**不阻塞、但建议同时定死的两条**（否则将来扯皮）
- ⬛ **WSL 在 DSH-3 期间干什么**：S0 已拍"CVM 单跑" ⇒ 若 WSL **不参与**，则 `../docs/test-env.md` §10 的「WSL 承载哪类测试」+「flock 未实测」**不阻塞 DSH-3**，可从卡点列表摘出
- ⬛ **`D:\Code\API Key.txt`**（用户自处理，未闭环）

---

## 7. 硬边界与风险（写码前必读，勿踩）

1. **判据必须取自真实运行时**；「机制存在」≠「实现真的走这条路」（须正反两组 + 反向对照）
2. **`patchReload` 不可跨 profile 外推**：`larry` = `live` / `sdk` = `startup`
3. **ABI 边界**：CVM 4 vs WSL 7 ⇒ landlock 判定**不可互搬**（见 2.5）
4. **`0.1.2-rc.1` 的 API**：升级当独立动作，**不在本阶段顺手升**（上游 7 天 2 个 rc）
5. **profile 组装三坎**：`plugin add` 依赖 pnpm / **必须显式锁版本** / 只写 `dependencies` 不写 `bundles`（装了不生效）
6. **`exit code = 0` ≠ 进程已退出**：凡涉及子进程/长驻 host 的验收，须含「能自己退出」这一条（靠入口脚本 20 分钟墙钟看门狗兜底）
7. **CVM 产出的唯一副本禁令**：机器 10-09 到期 ⇒ **任何产出不得是唯一副本**
8. **无 key 假绿灯**：见 3.0 —— 这是本阶段最容易整体翻车的点

---

## 8. 本稿待办（拍板后执行）

- [ ] 老大逐条拍 §6 五项
- [ ] TODO.md DSH-3 段重写为 3.0–3.9（执行项）
- [ ] `docs/dsh/dsh-migration.md` §3.6 DSH-3 节补**验收基准**（判定依据）
- [ ] `exchange/README.md` 文件索引登记本稿（或定稿后移 `docs/` 并清理）
