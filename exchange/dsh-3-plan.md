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

**开工卡点已于 2026-09-14 解开**（模型凭据：三环境三把专用 Key，见 §6）。其余待拍项均可在派发时一并写入规格。

---

## 1. 前置：DSH-3.0 — 开工前置（CVM 环境 + 凭据 + real-api）

> **它为什么必须最先做**：S0 的验收口径（消息往返 / 事件落盘 / 回读）**每一项都能在无 key 的假绿灯下通过**（DSH-2.5 ④ 实证：无 key 时 `exit 0` + session 建立 + 12 条事件）。不在这一步把"真实调用断言"在 CVM 侧立起来，后面每步都是裸奔。

**目标**：CVM 上具备 S0 起跑条件。

**交付物**
1. CVM 上 `dsh@0.1.2-rc.1` 可用（版本号须显式核对，**勿用 `latest`**——见 `docs/production-env.md` §6 坑 8）
2. profile 就位（`larry` / `sdk` 至少各一）
3. **凭据落位**：CVM 侧 `$DSH_HOME/.credentials.yaml` 的 `refs:` 分节 —— ⚠️ **键名固定为 `DEEPSEEK_API_KEY`**（`dsh-llm-deepseek` 的 `apiKeyEnv` 默认值，**不可自命名**），值取控制台那把 `larry-cvm`；POSIX 下须 `chmod 600`。机制与落点详见 `docs/production-env.md` §12（含"不用改 profile / 改完自动热重载 / 别删已有 `records:` 段"三条实操）
   - ✅ **2026-09-14 已完成落位**：`refs.DEEPSEEK_API_KEY` 就位（`sk-` 起 / 35 字符），600 / 223 B，`records:` 原段完好；结构校验通过。⇒ 派发 3.0 时**无需重做**，只需跑 real-api 验"真生效"。
   - ⚠️ 落位过程踩坑一次：**冒号后缺空格** ⇒ `refs` 静默降级为字符串（YAML 层零报错，`grep` 仍命中）。已入档 `docs/production-env.md` §12.4 第 5 条。
4. real-api 等价物在 Linux 侧跑通（载体：`harness/scripts/run-real-api.mjs` + `harness/tests/real-api.ts`，DSH-2 前置件 1 的产物，**需在 CVM 侧复跑**）
   - ⚠️ **2026-09-14 勘察：CVM 上该载体不存在** —— `~/harness` 是 09-10 的部分拷贝：`scripts/` 仅 4 个探针（缺 `run-real-api.mjs`），`tests/` 缺 `real-api.ts` 全套，`packages/` 缺 3 个沙箱探针包
   - ⇒ 交付物 4 前面**还有一道未列出的工作**：**同步本机 harness → CVM**（连带 `pnpm-lock.yaml`；同步后可能须重跑 `pnpm install`，2G 内存 + 境内源速度是风险点）

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
**依赖**：无（凭据已于 2026-09-14 定，见 §6）
**已知坑**
- ssh 后台任务拿不到沙箱放行 ⇒ 一律前台跑，长任务 `nohup ... &` 挂远程再轮询
- ⚠️ **CVM 上 `node` / `dsh` 都不在 PATH**：node 在 `~/node/bin`、dsh 在 `~/harness/node_modules/.bin/`，非交互 SSH 与 `bash -lc` 都不加载 ⇒ 裸跑 `node -v` 双双 `command not found`（**是通道问题，不是没装**）。执行说明须写死 `export PATH=$HOME/node/bin:$PATH`

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
| **1** | **3.0 前置** + **3.7 方言修复件**（Windows 侧）+ **3.2 id collision** | 三者**互不依赖**，可同批派出（凭据已定，3.0 可直接起跑） |
| **2** | **3.1 S0** | 单发；它是后续一切的地基 |
| **3** | **3.3 → 3.4 → 3.5 → 3.6**（S1→S4） | **严格串行**（逐层叠加） |
| **4** | **3.8 A 段设计** + **3.9 收口** | 3.8 可在批次 3 后期并行 |

**关于"干等"的提醒**：TODO「待核（不阻塞拍板）」段 7 条全是**调研类**（插件借鉴清单 / 取样原则 / vendor 规范 / CVE 流程 / §3.0 是否升格…），**不碰 CVM、不等 Key** ⇒ 可与 3.0 同批派出（与主线无依赖，并行仍有价值）。

---

## 6. 待老大拍（阻塞项）

> ✅ **① 模型凭据 —— 2026-09-14 已定（不再是待拍项）**：**三环境三把专用 Key**（`larry-dev` / `larry-wsl` / `larry-cvm`，老大已在控制台备好，随时可填）。三条口径：
> 1. **按环境分，不按轨分** —— 同一环境内 backend 与 DSH 两处填**同一把**；Key 的用途是"分辨哪台机器在烧"，不是"分辨哪条轨"。
> 2. **DSH-3 期间只需两把**：`larry-cvm`（3.0，CVM 侧 `$DSH_HOME/.credentials.yaml` 的 `refs:`，**键名固定 `DEEPSEEK_API_KEY`**、POSIX 须 600）+ `larry-dev`（3.7 本机 end-to-end；**落哪个 home 随待拍 ③ 一并定**）。
> 3. `larry-wsl` **暂不动用**（S0 已拍 CVM 单跑；WSL 将来参与测试再启）。
>
> 载体优先级（启动环境 > 受管文件 > 项目 `.env` > 主目录 `.env`）与**三环境落点现状**见 `docs/production-env.md` §12。

| # | 待拍 | 阻塞谁 | 选项 |
|---|---|---|---|
| ② | **S0 通道** | 3.1 | `sdk`（stdio JSON-RPC，DSH-2.3 已验连通）／`acp` |
| ③ | **方言修复件落盘目标 + `web` 是否补建** | 3.7 | 工程 home（`larry`/`sdk`）／全局 `~/.dsh/`（三个）；web 补 or 不补。⭐ **此选择同时决定 DSH 凭据落点**（profile 与 `.credentials.yaml` 同 home；谁启动 DSH 决定 home）——见 `../docs/production-env.md` §12.7 附录 |
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

---

## 附 A：Claude 评审意见（2026-09-14，测试/验证视角）

> 立场：只审"判据能不能证伪"，不重排 WB 的计划。共 15 条，其中 **1 条为文档内矛盾（B1，按红线 3 主动暴露、不自行折中）**、1 条为未决项风险评估（B2）。
> 声明：本附录为**纯追加**，未改动本稿任何既有文字。

### 一、判据强度（建议必须补，4 条）

**A1. 3.0 判据要从"两态"扩到"三态"——缺的那态正是已知翻车点**
现判据 = 真 Key 绿灯 + 错 Key 红灯。但 §1 自己写着"DSH-2.5 ④ 实证：**无 key 时 exit 0 + session 建立 + 12 条事件**"——**无 key 恰是已证会假绿的那一态，却没进对照**。
⇒ 要求：三态**同一脚本**跑（无 key / 错 key / 真 key），并明确"**只有三态表现互不相同**，判据才算有效"，否则"真 Key 绿灯"可能只是同一片假绿中的一条。

**A2. 每条 S 切片挑 1 条判据做"负向对照"，证明判据**能红****
现在所有判据只规定了"绿了算过"，**没有任何一条证明"坏了它会红"**。建议矩阵（低成本、可复跑）：
| 破坏动作 | 期望变红的判据 |
|---|---|
| profile 里注释掉自做 bundle | 3.1 ②（plugin mount） |
| 换成错 Key | 3.1 ③、3.0 红灯组 |
| 摘掉/只读 session 落盘目录 | 3.1 ④ |
| answerer 抛错或超时 | 3.3 拒绝路径（且必须 fail-closed） |
| SQLite 路径指回 DSH 默认后端 | 3.6 ②（反向哨兵） |

不做的后果：**"真的通了"与"判据没生效"不可区分**。

**A3. S0 判据加 nonce 语义断言（一次性堵死空壳会话与假回包）**
- ① "消息往返成功"要断言**内容**：发 `PING-<random>`，回包必须包含该串
- ④ "落盘 + 回读"要断言**语义**：回读结果里必须能查到同一 nonce（不是"文件存在/条数够"）
- 副产品：3.2 所需的"**真实 completed 会话**"由此得到标准构造法，避免"占位 key 阶段假象"重演

**A4. 3.3 的拒绝路径观测点应在写码前先勘察（read_file 无副作用，"没执行"怎么证？）**
建议观测点 = **工具 handler 入口打点落文件**（有行=执行了，无行=没执行）；UI 与 DSH 日志只作旁证。
并补两条用例（现只覆盖"人点了拒绝"）：
- **answerer 超时**（人不在场、没人点对话框）⇒ 必须 fail-closed
- **answerer 抛错/返回非法值** ⇒ 必须 fail-closed

理由：这两条是**无人值守下的真实路径**，不是边缘情况。

### 二、文档内矛盾与依赖错位（主动暴露）

**B1. §5 批次 1「三者互不依赖」与 §3.1/§6 冲突**
3.7 的硬判据是"**一次真 end-to-end**" ⇒ 需 `larry-dev` Key + home 落点，后者正是**待拍 ③**。⇒ 3.7 实际**阻塞于待拍 ③**，不满足"互不依赖、可同批派出"。
建议改为：**3.0 与 3.2 互不依赖可同批；3.7 待 ③ 拍定后起跑**（或按 §0 口径，派发时把 ③ 一并拍掉）。

**B2. §6「WSL 在 DSH-3 期间干什么」若选"不参与"，3.5 将没有 Linux 预演场**
3.5 只在 CVM 出结论（ABI 4），而 CVM **10-09 到期**、机会一次性；若 WSL 不参与，等于**脚本与流程第一次跑就落在正式判定场地**上。
⇒ 建议：**WSL 当"演练场"、CVM 当"判定场"**——脚本/范式/超时/日志/轮询先在 WSL 顺一遍（同 Linux），**凡涉"拦住了/放行了"的判定只在 CVM 出结论**（严守 §2.5 ABI 边界）。顺带回答了 §6 那条未决项。

### 三、场地与执行范式（4 条，均为可操作项）

**C1. CVM 侧必须串行：3.0 采数期间别并行 3.2**
2G 内存机器上，3.2 的"真实 completed 会话"会污染 3.0 的小时级内存曲线；OOM 还会把曲线**断掉**，事后极易被误读成"内存稳定"。⇒ 采数窗口内冻结其他 CVM 活动；做不到则数据须标注"受干扰"。

**C2. 采数口径先定死（否则又是糊涂账）**
- RSS 口径：建议 **cgroup v2 `memory.current` / `memory.peak`**（进程树求和易漏子进程）——**先验 CVM 有没有 cgroup v2**，没有则退回 `ps` 求和并写明口径
- 记 `date -Is` 时间戳 + 采样间隔 + **断点/重启留痕**
- **OOM 事件一并采**（`dmesg -T | grep -i oom`），否则内存事故只表现为"曲线最后一帧"
- 带宽实测记**工具 + 目标 + 时段**（4M 共享/独享影响结论）

**C3. §1「已知坑」两条规则之间缺一条仲裁规则（长任务到底怎么跑？）**
- 事实 A：ssh 后台任务**拿不到沙箱放行** ⇒ 一律前台跑
- 事实 B：长任务须 `nohup … &` 挂远程再轮询（小时级采数、dev host 长驻）
- 二者没说**怎么选**：前台跑遇 SSH 断连被 SIGHUP 杀；后台跑又"拿不到沙箱放行"⇒ 存在一段没人负责的地带，而 3.0 的小时级采数正好落在这里
- ⇒ 建议写死判定规则（例：**需沙箱放行的 → tmux/前台**；**纯采数脚本、不涉沙箱判定的 → `setsid nohup`**），并统一范式：`setsid nohup <cmd> >log 2>&1 </dev/null &` + **退出码落文件**（`echo $? > rc`）+ 复入轮询时**先看 rc 再看日志**
- 附注：本条与 §7.6「20 分钟墙钟看门狗」**不冲突**（那是"进程能否自己退出"的兜底），**不列为矛盾**，只是缺判定规则

**C4. 我这条通道的 CVM 可用性尚未验证 ⇒ 建议 3.0 增一小项**
本机有 `~/.ssh/id_ed25519_cvm` 与 `docs/production-env.md` 的连接信息，但**我（Claude）本会话从未验证过 ssh 通道，也没有 CVM 侧的落盘/轮询范式**。不先核，派给我等于裸奔。
⇒ 3.0 加一项：**Claude 侧 CVM 通道核查**（连通 + 非交互命令 + PATH 前置 + 后台范式 + 回读范式），产出半页《我方 CVM 执行说明》。

### 四、可复用资产与归因（3 条）

**D1. 3.5 的判定器材已现成**：`D:\Temp\Sys\claude-wsl-probe\landlock_probe.py`（2026-09-12 实测有效）——ABI 从内核**读取**（非推断）+ 先设 `PR_SET_NO_NEW_PRIVS`（**不设必 EPERM**，初版踩过的坑）+ 空规则集正证 deny（读 `/etc/hostname` 被 EACCES）。可直接搬 CVM；注意先核 CVM 上 python3 可用性（不可用则退 C 或 node 版）。

**D2. WSL 侧已实测范式同 Linux 可复用**：PATH 净化、`exec 2>&1` 归一混流、`setsid nohup` 存活、落盘 + 回读。**但 CVM 上不要照抄 MSYS 那套**（`MSYS_NO_PATHCONV` 是宿主通道的坑，CVM 没有）。

**D3. harness 同步 → CVM 要留"版本锚点"**：记录被同步的 **commit + 文件清单/sha256**，否则将来"CVM 上跑不过"无法区分**环境问题**与**代码漂移**；同步产物同时在本机留副本（对齐 §7.7）。

### 五、成本与收口补漏（2 条）

**E1. 3.4 的「200+ 轮」是烧钱项，建议换构造方式**：优先**压低 compaction 阈值/窗口**把行为逼出来，而不是真灌 200 轮；无论哪种，先给**token/费用上限**并写进判据。CVM 实测 contextWindow = 1,000,000 token，真灌轮数一轮就是万级 token，**先估算再开跑**。

**E2. 3.9 收口建议加一条硬清单：CVM 产出回传核对表**——逐项列（会话库 / SQLite+ChromaDB / 日志与曲线 / dump-config 快照 / 复现脚本），标"已回传本机 / 无需回传"并附 sha256。理由：CVM 10-09 到期（§7.7），**收口是唯一能系统性堵住"唯一副本"的时点**。

### 六、我的角色与边界（自我声明）

- **我承担**：测试设计与 **A2 负向对照矩阵**、判据脚本入库、对 Trae/WB 结论的**独立复跑对拍**（看复现脚本不看 log）、CVM 侧 ssh 执行（C4 核查通过后）、WSL 侧预演（B2 方案）
- **我不做**：不把 WSL 的 landlock 判定搬到 CVM（反之亦然）；不替 WB 排期、不改他人文件；`docs/` 按职责不动（本意见只续在本文件）
- **提示**：本稿当前处于**未提交改动**状态（我落笔前即如此），若手上还有未保存的编辑，请先保存再合并本附录，避免互相覆盖

---

## 附 A-2：CVM 通道实测记录（2026-09-14 同日，Claude）

> 老大指示"docs 里有 CVM 环境说明，照著跑" ⇒ 我按 `docs/production-env.md` §1/§6 实跑了一遍。**附 A 的四条据此修订**（两条我原来写错了，已订正）。
> 通道：`ssh -i ~/.ssh/id_ed25519_cvm ubuntu@49.232.129.252`（BatchMode + ConnectTimeout 即可直连；scp 回传亦通）。
> ⚠️ **2026-09-14 结束时的未决项**：机器上有**另一条活跃会话**（`who` = 一条 `pts/0`，14:01 起；源 IP 不回显，按 Tier0 红线 ②）⇒ 我的"前后对照"类观测在归因上不可靠（见第 8 条）。

### 一、硬事实（12 条，均可复跑）

1. **PATH 坑复现**：裸跑 `node`/`dsh` 双双 `not found`；`export PATH=$HOME/node/bin:$PATH` 后 `node v22.22.2` ✓。DSH 入口两条等价：`~/harness/node_modules/.bin/dsh` 与 `node node_modules/@deepseek-ai/dsh/lib/bin.js`（现有 `cvm-*.sh` 用后者）。
2. **§1「零成本复验」判据成立**：`dsh --profile web --help` ⇒ `exit=0` / **4.07 s** / 18 行。零 API 成本 ✓。但**"4 秒"不是"瞬时"**，写看门狗预算时别当 0 成本。
3. **后台存活（推翻一条文档结论）**：裸 `&` 起的长任务 **5/5 全存活**；`setsid nohup` **6/6 + 完成标记 + `$$` 落 pid 文件**。
   ⇒ `production-env.md` §6.3「ssh 后台任务拿不到沙箱放行 ⇒ 一律前台跑」的**远程侧理由不成立**——该约束属**本地通道层**（宿主沙箱/审批），不是远程进程会死。远程长任务范式：`setsid nohup <cmd> >log 2>&1 </dev/null &` + **完成标记/退出码落文件** + 复入**先看标记再看日志**。
4. **采数点（C2 修订，重要）**：`stat -fc %T /sys/fs/cgroup` = `cgroup2fs` **但 root 与 session scope 都没有 `memory.current`**——单看这个判据会**假阳性**。实测可读点在 **slice 层**：
   - `/sys/fs/cgroup/user.slice/user-1000.slice/memory.current` = **452 MB**
   - `.../memory.peak` = **1234 MB**（❗**开机至今高水位，已含 4.5 天 DSH 挂机**）
   - `.../memory.events` = `oom 0 / oom_kill 0`（⭐ **OOM 的权威计数，比 dmesg/journal 可靠**）
   - `.../memory.pressure` = `some total=613`（微秒）⇒ **开机至今零内存停顿**
   - ⇒ **§1 想要的小时级挂机曲线，机器里已经存着**，不必再挂一小时；`memory.peak` + `memory.events` + PSI 三个文件**免轮询**即可回答"是否吃紧过"。
5. **ps 求和口径虚高 53%**：同刻 `ps -eo rss` 求和 = **693 MB**，cgroup = **452 MB**。⇒ §1「联合 RSS 峰值」若用 ps 求和，结论被抬高一半（共享页重复计）。建议：**cgroup 为主口径，ps 树求和只用于进程定位**。
6. **机上现有进程（都不是我的，我没动）**：
   - PID 21399 `node ./node_modules/.bin/dsh --profile web --host 127.0.0.1 --port 8124 --no-open`：**启动于 09-09 22:06:10，已 4 天 16 小时**，RSS **172 MB 稳定**（8 次采样零漂移），cwd `~/dshprobe`，PPID=1
   - PID 19520 `python3 -m http.server 8123 --bind 0.0.0.0`：§6.1 那次的遗留，**监听 0.0.0.0**（靠安全组只放通 22 兜着）
   - ⇒ **对 3.0**：基线不干净（1935 MB 里已用 615，其中 172 是它）；**对 §2.4**：这是一条**免费的 4.5 天长驻实测**。**请 WB/老大裁定**：采数前停掉（我倾向停，换干净基线）还是保留并标注基线与所有权。
7. **我起的采数原型**（`/tmp/claude-probe/sample.sh`，每 30 s 一条，40 条，14:33:50 起）：8 条已有数据 = slice 453→459 MB 缓涨、`dsh_web` 恒定 172 MB、`avail` 随 buff/cache 波动、PSI 恒定。**这是 3.0 采数脚本的可直接改造件**（含 cgroup+PSI+目标进程三合一），已在 `/tmp/claude-probe/`，需要当交付物我再收拾干净（脚本里 `avg10=avg10=` 是我 awk 写重了，小瑕疵，**等我改时脚本已停**——顺带记一条坑：**bash 按字节偏移懒读脚本，改运行中的脚本会执行错乱**）。
8. **"前后对照"在本机不成立（C1 的实证，非推测）**：我观察到 `~/.dsh/profiles` mtime = `14:34:08`，与我首次 `--help` **同秒**；但**对照实验**（取 mtime → 跑 `--help` → 再取 mtime）**前后完全一致**。
   ⇒ 我**无法归因**，按红线 3 记为"**观测到、未归因**"，不作结论。真正结论是：**这台机上随时可能有第三方会话**（第 6 条那条 pts/0）⇒ **凡"前后对照"实验必须在单租户窗口内做**，否则证据自动降级。**这就是 C1「必须串行」的最强论据，比 2G 内存那条更硬。**
9. **判据漏洞（新，已核实）：CVM 上也有两个 DSH home，凭据只在一个里**
   - `~/.dsh/`：**有** `.credentials.yaml`（600 / 223 B / 09-14 14:09 落位）。**结构已验**（§12.4⑤ 判据）：`refs` 是 **dict**、键 `['DEEPSEEK_API_KEY']`、长度 35、非空、`records:` 完好 ⇒ **冒号后缺空格的哑陷阱在这台机上不存在**（这一条可放心，不必再排）
   - `~/larry-dsh-home/`：**没有任何凭据文件**（`ls -a` 无 `.credentials.yaml`、无 `.env`）；profiles = acp/sdk
   - 全机**无**注入源：`.bashrc`/`.profile` 对 `DEEPSEEK_API_KEY` 提及 **0 次**；`~/.dsh/.env`、`~/harness/.env`、`~/larry-dsh-home/.env` **均不存在**
   - ⇒ **凭据只有"存储文件"一层来源**，而 `$DSH_HOME` **显式设置优先于**默认 `~/.dsh`（§12.7 附的解析顺序）
   - ⇒ ⚠️ **`harness/scripts/cvm-probes/cvm-*.sh` 全部钉 `DSH_HOME=$HOME/larry-dsh-home`**（它们头注也写着靠调用方注入 `DEEPSEEK_API_KEY`）⇒ **若 3.0 照抄这些脚本且不注入 env，则"真 Key 绿灯"跑在一个没有凭据的 home 上 ⇒ 精确落进 §1 已记录的「无 key 假绿」（exit 0 + session 建立 + 12 条事件），而判据看起来全绿。**
   - ⇒ **A1 修订**：三态对照表每态必须显式写 **(DSH_HOME, profile, 凭据来源层)** 三元组；绿灯态除"消息往返 + nonce"外，**再加一条"凭据确实被读取"的断言**（如确认响应不是 AUTH 降级）。否则"无 key 态"与"真 key 态"可能测的是同一件事。
10. **harness 同步（WB 那条 note 属实，此处给精确清单）**：CVM 副本 = **09-10 的部分拷贝**（mtime 09-10 11:23–14:31），对照本机 HEAD `d8cc7c4b`：
    | 目录 | CVM 缺 |
    |---|---|
    | `scripts/` | `run-real-api.mjs` + `cvm-probes/`(7) + `embed-probe/`(3) + `sandbox-probe/`(6) |
    | `tests/` | `real-api.ts` `real-api.test.ts` `scan-keys.ts` `sentinel-realapi-key-residue.test.ts` `sentinel-realapi-r1.test.ts` |
    | `packages/` | **`plugin-sandbox-dialect` / `plugin-sandbox-mount-probe` / `plugin-sandbox-probe`** |
    - **合计 30 文件 / 0.13 MB**；harness 全量源码 **51 文件 / 0.66 MB**（`node_modules` 313 MB 不传，CVM 侧装）
    - ⇒ **传输不是瓶颈**（4M ≈ 全量 1.5 s）；真成本在同步后的 `pnpm install`。**CVM 已配 `~/.npmrc → registry.npmmirror.com`** ⇒ §6.2 的"境外源 15 KB/s"场景**不适用**，风险下调（仍建议量一次 install 墙钟时间）
    - ⚠️ **`packages/` 缺的正是三个沙箱探针包 ⇒ 3.5 也被同步卡着**，不只 3.0 的交付物 4（**B1 的依赖图要补这条边**）
11. **§2.5 的 ABI 边界有了机制层证据（D1 更新）**：
    - **CVM 实测 `landlock_abi = 4`**（从内核读取，非推断）；`fs_mask=0x7FFF` + `attr_size=16` ⇒ `restrict_self=OK`、读 `/etc/hostname` **DENIED errno=13** ⇒ **判定链在 CVM 上完整走通**。内核侧 `CONFIG_SECURITY_LANDLOCK=y`、`CONFIG_LSM` 首位即 landlock
    - **负向对照已跑**：把 ABI 5+ 的掩码 `0xFFFF`（含 bit15 `IOCTL_DEV`）喂给 ABI 4 内核 ⇒ **`create_ruleset` 直接 `EINVAL`（errno=22）**
    - ⇒ §2.5 不只是"结论可能不同"——**是掩码位不存在导致系统调用失败**。**若 DSH 自身硬编码了更新的掩码，在 CVM 上就会 EINVAL**，而**失败是 fail-open 还是 fail-closed 决定生产安全** ⇒ **建议 3.5 加一条硬判据：在 CVM 上确认 DSH 的 sandbox ruleset 建立成功，并单独判其失败形态**（并入 §2.5 的 fail-closed 项）
    - 探针已升级为 **ABI 自适应 + `--fs-mask` 负向开关 + `VERDICT=` 机读行**：`D:\Temp\Sys\claude-wsl-probe\landlock_probe.py`（同文件在 WSL ABI 7 上回归通过）
12. **版本锚点（D3 落地，可直接抄）**：同步源 = 本机 **`d8cc7c4b11012ebab0d22f2f94e607004f07aa0d`**；`git rev-parse HEAD:harness` = **`6c2688778207664d2afb06da3600e329412b9712`**。同步时把这两个值写进 CVM 侧 `SYNC-ANCHOR.txt` 且本机留副本 ⇒ 将来"CVM 上跑不过"可区分**环境问题 vs 代码漂移**。

### 二、收口补漏（E2 追加唯一副本）

`/home/ubuntu/larry-data/larry.db`（36 KB，09-10 11:31）是 DSH-2.5 task1「自做插件写进外部钉死 SQLite」的**证据原件**，且**该机独有** ⇒ 进 E2 回传清单的"必须回传"类。CVM 10-09 到期，**这是唯一能系统性堵住"唯一副本"的时点**。

### 三、我方承接与不承接（据实测更新）

- **我承接**：采数脚本（第 7 条已成型）、landlock 器材（第 11 条已成型）、判据脚本入库、Trae/WB 结论的独立复跑对拍、CVM 侧 ssh 执行（**通道已验证 ✓**）、WSL 侧预演
- **我不承接**：不替 WB/老大停或重启机上现有进程（第 6 条，等裁定）；不读任何凭据文件内容（第 9 条只验结构，§12.4⑤ 的判据不打印值）；`docs/` 不动
- **执行说明已成文**：`exchange/log-claude.md`《我方 CVM 执行说明》（含通道、范式、以及本次踩到的四个坑：`pgrep -f` 自匹配、嵌套引号易碎、勿改运行中脚本、scp 需 `MSYS_NO_PATHCONV=1`）
