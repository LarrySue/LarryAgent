# DSH-3.6 · S4 记忆最小闭环 —— 判据草稿（未定稿）

> **性质**：WB 拟的**未定稿讨论稿**（2026-10-17）。定稿后判据权威落点 = `docs/dsh/dsh-migration.md` §3.6（Qoder 办）；本稿随稿演化，**引用须标注「未定稿」身份**。
> **拆分结论**（已落 `TODO.md` 3.6 段）：3.6 = 双写闭环（0 token）／ 3.6.1 = 召回闭环（需 key · LLM 端到端，老大 2026-10-17 裁）。
> **上游依据**：`docs/dsh/dsh-migration.md` §3.6 S4 骨架表 ＋ 负向对照矩阵 ＋ S4 修订（双写一致性模型）；`docs/product-positioning.md:178-198`（双写架构 ／ 降级口径 ／ 记忆本体不入 session log）；`design-verifiable-criteria` 四问。

---

## 0 · 目标（一句话）

**挂 `session/` 事件流的自做插件，把会话记忆写进「我们自己的库」（SQLite 真相源 + ChromaDB 向量），并让新会话能召回** —— 回答「记忆本体在 DSH 下可脱离 session log 独立存 ／ 取」这一个问题。

⛔ 两个**易混成同一件事**的结论，显式拆开：
- **「双写通路成立」**（3.6，0 token）≠ **「召回对产品可用」**（3.6.1，LLM 端到端）—— 前者不依赖后者成立；
- **「降级不阻塞」**（3.6 J4）≠ **「补偿恢复」**（恢复后补写，**本步定义不验**，属产品规划 2.4.4）。

## 1 · 拆分与场地形态

| 块 | 内容 | 判据 | token | key | 场地 |
|---|---|---|---|---|---|
| 3.6 | 双写闭环 | J1–J4 | **0** | **不需要** | 381 同款**临时 home**（mkdtemp + cpSync profiles/sdk）＋ 临时 memory 库 |
| 3.6.1 | 召回闭环 | J5–J6 | 少量 | 需要（env 层注入） | 同临时 home 装置 ＋ env 注入 key |

- ⭐ **0 token 的构造原理**（同 3.0 三态教训）：**无 key 态下 session 照常建立、`user/message` 与 `turn/end`（reason=error）事件照常产生**（3.0 实证：无 key 时 exit 0 + session + 12 条事件）⇒ 事件消费与落库**不需要 LLM 调用**。
- ⭐ **临时 home = 天然无 key 态**：`mkdtemp` 出的 home 无 `.credentials.yaml` ⇒ 四层优先级全部落空 ⇒ 不碰真 home 的 key（凭据最小接触，同 3.8.1 复验纪律）。
- ⚠️ **3.6.1 的 key 注入走 env 层**（优先级最高，精确可控）；`.credentials.yaml` 的**值不进派发稿、不进日志、不进证据**。

## 2 · 判据（四问形态：作用层 ／ 计量口径 ／ 结果态可分 ／ 断言视图）

### J1 事件确实被消费（不是只注册了监听）

- **作用层（唯一判定载体）** = **我们 SQLite 库里新增的记忆行**（行内容含本轮输入的 nonce）。
- ⛔ **不算的层**（写明理由）：
  - ① 插件 `inject` ／ `provide` 声明在、activate 打点有 —— **注册 ≠ handler 挂上 ≠ 事件流到 handler**（参考件 v0.3.0 哑坑①同款：Cordis 惰性构造，provide 类则构造器从不跑）；
  - ② DSH session log 里有事件 —— 那是 DSH 自家持久化，**恒真**（我们的双写是语义层，两者互补——dsh-pysdk-probe-trae.md:135）；
  - ③ `--dump-config` 里插件行在 —— 只组配置树、不激活插件（L0 已定假绿源）。
- **计量口径**：构造输入 = 一个会话里 user message 含 `PING-<nonce>`，跑完一轮（无 key 态即可，turn/end error 也算事件产生）⇒ 库里可查到含同一 nonce 的行。
- **结果态可分**：**负向对照** = 不产生 user/message（空转一轮）⇒ 库**不得**新增行；否则「没发生」与「发生了没消费」同形。
- **断言视图**：直接读我们指定的 SQLite 库文件（sqlite 查询），⛔ 不在内存对象 ／ 事件流 ／ 打点日志上单独断言（那些只算旁证）。

### J2 数据落在我们自己的库（带反向哨兵）

- **作用层** = 插件配置指定的**外接 SQLite 绝对路径**（临时目录下的 `larry-memory-<run>.db`，不碰任何活库）。
- ⭐ **反向哨兵**（判据有效性的检验本身）：把 path **指回 DSH 默认后端**（session 落盘目录）⇒ 数据**不在**我们指定文件里 ⇒ J2 **必须变红**。双锚：指对时绿、指错时红，两个方向都实测（承 §3.6 负向对照矩阵「SQLite 路径指回 DSH 默认后端 → S4 ②」）。
- **计量口径**：库文件里能**查到同一 nonce**（同 S0④：不是「文件存在 ／ 条数够」）。
- **结果态可分**：反向哨兵臂即负向对照；另加「空输入不落行」（同 J1 负向）。
- **断言视图**：库文件内容；⛔ 不在「DB 对象已 open」上断言（open ≠ 有我们的行）。

### J3 ChromaDB 双写落库

- **作用层** = chroma collection（HTTP，`chromadb` npm client → `npx chroma run --path <临时目录>` 起的 server；server 与库路径均临时，收尾清理）。
- **计量口径**（三条都要）：① collection `count` +1；② 按 id `get` 命中，metadata/document 含 nonce；③ 以 nonce 原文做 `queryTexts` 语义检索，**返回该条 id**（验 embedding + 存储 + 相似检索整条小通路）。
- **embedding 来源** = 我方 TS 侧 bge-small-zh 资产（`harness/scripts/embed-probe/`，DSH-2.5 实测与 Python 侧漂移 2.2e-7）；⛔ 不用 chroma server 默认 embedding（英文 onnx，与产品中文场景不符）。⚠️ 该资产可跑性属**派发前待实测前提**（Trae 侧）。
- **结果态可分**：负向对照 = 停 server 后 add 不得静默成功（落 J4）。
- **断言视图**：chroma HTTP API 的 get/query 返回原文；⛔ 不在插件侧「我调用了 add」上断言（调用 ≠ 落库——参考件哑坑②同款：写进没人读的字段）。

### J4 降级行为（ChromaDB 不可达）

- **作用层** = 停 chroma server 后**继续跑一轮**（无 key 态）：① 对话不阻塞（turn 正常走完到 error 态的终局，不被向量库卡住）；② SQLite 真相源**仍写入**（nonce 行在）；③ **日志有降级记录**（fail-loud 到日志）。
- **产品口径依据**：`product-positioning.md:182`「ChromaDB 不可用时静默降级，不阻塞对话」—— ⚠️ 「静默」指**不弹给用户**，⛔ 不是**无日志**；观测点在日志，日志无记录即红。
- **计量口径**：三条件全满足才算 PASS；任一不满足即红（不许「部分降级」）。
- **结果态可分**：双锚 = 同装置 server 活着时 ①②③ 全绿（环境没坏）＋ server 停时 ①不阻塞 ②真相源在 ③日志有（降级真的走了）。
- **断言视图**：turn 终局事件 ／ 我们库 ／ 插件日志三处分别取证。
- ⛔ **本块不验**：恢复后补偿补写（「定义不验」，见 §3）。

### J5 召回注入面（3.6.1，0 token 断言）

- **作用层** = `systemPrompt.context` provider 的 `text()` **返回值**（同步断言：A 会话写过 nonce 后，B 会话的注入块**含该 nonce**）。
- 形状承参考件：`ctx.systemPrompt.context({ name, order: 500, text: (context) => … })`（`lib/index.js:2217-2229`）；召回查询走 `recallSync` 同款**同步** API（node:sqlite 同步，无需 async）。
- ⛔ **不算的层**：① 「provider 注册成功」—— ⚠️ 参考件自己就把注册包在 try/catch 里（:2230，失败只 `console.error`）⇒ **注册 API 不抛错 ≠ 注册生效**，必须断言 `text()` 实际返回；② 插件日志里「组装过上下文」—— 中间表示，证明不了注入进模型视图（四问 4）。
- **计量口径**：返回的 markdown 块含同一 nonce（逐字）；块为空字符串即红。
- **结果态可分**：负向对照 = **空 memory 库**（DB 指向全新文件）⇒ `text()` 返回空 ／ 不含 nonce。
- **断言视图**：`text()` 返回值；⛔ 不在事件流上断言（同 J1 ②）。

### J6 LLM 端到端召回（3.6.1，需 key）

- **作用层** = **模型实际收到的上下文**（`request/context` 事件 ／ 或模型输出）——老大 2026-10-17 裁「就用 LLM 端到端」。
- **计量口径**：A 会话让模型写「项目代号 = `PING-<nonce>`」（或直接 user message 陈述，确保入库）→ 全新会话 B 问「我的项目代号是什么」→ **模型回答含该 nonce**。
- **结果态可分（判别力所在）**：**负向对照** = B 会话指向**空 memory 库**，同问 ⇒ 回答**不含** nonce。双锚：有库态含 ／ 空库态不含 —— 否则「模型本来就知道」或「模型瞎编一个」不可区分（同 3.0 错 key 红灯组思路）。
- **key 纪律**：env 层注入；不注入 env 的对照臂（文件层）**不在本块要求**（3.6.1 不承担 key 落位证成，那是 3.0 已闭环事）。
- **断言视图**：`request/context` 事件帧（注入面）＋ assistant/message 输出（效果面）**双取证**；⛔ 只凭模型输出不算（证明不了是召回注入起的作用，可能是模型已知 ／ 瞎编）。

## 3 · 双写一致性模型（3.6 交付的「定义」，判据只验其可观测部分）

- **模型定义**：SQLite = **真相源**（同步写、权威）；ChromaDB = **派生索引**（后写、可重建 —— 承 `product-positioning.md:178`「可由 SQLite 重建」）。
- **不可达时**：SQLite 写入**不受影响**（fail-open 只在向量侧；真相源侧 fail-closed——写不进真相源必须报错）；对话不阻塞；**日志记降级**（J4 验的正是这三条）。
- **补偿**（恢复后按 SQLite 重建 Chroma）：**本块只定义、不验** —— 产品规划已列（`:210` 向量同步补偿，属 2.4.4）；最小闭环边界，诚实写进回报。
- ⚠️ **双写不是事务** ⇒ 定义里必须写明「允许短暂不一致，以真相源为准收敛」，⛔ 不得声称「双写一致」（那是不可能交付的）。

## 4 · 参考件四要素（照抄清单，勿另行转述）

- **路径**：`ref/community/Asher-2000__dsh-memory-connect/`（v0.6.1，MIT，单文件 `lib/index.js` 2236 行）
- **怎么参考**：读 `lib/index.js` 五处形状 —— ① `:2202` `inject: ['sessions','systemPrompt']` ② `:2205-2206` `new Service(...)` 后 `ctx.provide('crossSessionMemory', service)`（**实例，非类**）③ `:2217-2229` `systemPrompt.context` 注册（order 500 ／ 同步 text()）④ `:2006`＋`:343` `turn/end` 订阅与轮末摘要 ⑤ `:1301-1325` `recallSync`（FTS5 ＋ `session_id != ?` 跨会话过滤 ＋ 最近记忆兜底）；另读 CHANGELOG v0.4.0 节（两个哑坑自曝）。
- **参考程度**：**借设计 ／ 抄形状**（⛔ 不 fork、不直装 —— §3.0 第三方原则；我方插件自做 TS）。
- **哪部分不可参考**：① **无 ChromaDB 形态**（其向量在自家 SQLite `memory_embeddings` 表 ＋ Python embedding server；我方 ChromaDB 半边无参考形状，自设计）② schema 按产品 2.4 域自做（它的 memories/memory_fts 表不是产品 schema）③ LLM consolidation ／ scheduler decay ／ Soul 注入均非本步靶子 ④ **API 形状须在我方实物（0.1.5-rc.2）上复核** —— README 自述验证于 `0.1.1-rc.2`，peer range `^0.1.0-rc.7` 虽兼容（版本脱节哨兵不命中），签名与行号锚在它的版本上。
- ⚠️ **两个哑坑（与本块判据同源，写码时即防）**：① provide 类 ⇒ 构造器从不跑（J1 直接覆盖）② 召回结果写进无人读的字段（J3/J5 的「断言在实际消费面」覆盖）。

## 5 · 诚实边界（本块不得声称什么）

- 3.6 单独**不得**声称「记忆系统建成」—— 只证「事件→我们库」的双写通路；**召回质量**（排序 ／ 相关性 ／ token 预算）不在靶子内。
- 3.6.1 单独**不得**声称「补偿恢复成立」（定义不验）。
- J3 的语义 query 只证「小通路通」（nonce 原文自检索），⛔ 不外推「中文语义检索质量达标」（那要 2.4.5 四作用域的语料）。
- 无 key 态结论（J1/J2/J4）**只写在「临时 home 无凭据」这一形态上**；⛔ 不外推到「任何无 key 场景」。

## 6 · 产品决策单列（要人拍的，不混在技术条款里）

1. ✅ **已裁**（老大 2026-10-17）：召回验到 **LLM 端到端**层 ⇒ 3.6.1 需要 key（env 层注入，已备好 `.dsh-home/.credentials.yaml`）。
2. ✅ **已裁**（老大 2026-10-17 倾向 ＋ WB 建议）：**保 ChromaDB**（不换 sqlite-vec）—— TS client 是 HTTP 形态，server 由 node 起亦可去 Py 运行时；架构变量（`production-env.md:266`）维持挂起，3.6 不替它拍板。
3. ⬜ **待确认**：补偿行为「定义不验」是否认可（WB 倾向：认可，最小闭环优先；不认可则 3.6 增加 J4b 补偿臂，成本 +一次 chroma server 重启循环）。

---

## 附 · 派发前实测台账（WB 2026-10-17 已做 ／ 待 Trae 做）

**已做（WB）**：
| # | 项 | 结果 |
|---|---|---|
| 1 | `.dsh-home/.credentials.yaml` `refs.DEEPSEEK_API_KEY` 结构 | ✅ PASS（dict ／ 键就位 ／ 冒号空格未中哑坑） |
| 2 | sdk profile `system-prompt` 装配（召回注入面承载） | ✅ `--dump-config` :331-332 在位 |
| 3 | 参考件 peer 兼容性 | ✅ `^0.1.0-rc.7` 覆盖 `0.1.5-rc.2`，版本脱节哨兵不命中 |
| 4 | 参考件实物存在 ＋ 形状可读 | ✅ 2236 行单文件，五处形状已定位 |

**待 Trae 侧实测（写进派发稿「判据前置」）**：
| # | 项 | 不通过则 |
|---|---|---|
| A | 自做插件 import 的 `@deepseek-ai/*` 已在 `harness/package.json`（3.3-b 机制事实 (a)：pnpm 严格模式，未登记 = `ERR_MODULE_NOT_FOUND`） | 先补依赖再开工（⛔ 禁 npm/yarn，锁定 pnpm） |
| B | `npx chroma run --path <tmp>` 本机可用（server 真含在 npm 包内） | 降级 = Docker `chromadb/chroma`；再不行 ⇒ 停手回报，⛔ 不自行造等价物 |
| C | TS 侧 embedding（`embed-probe` 资产）可跑 | 停手回报（J3 的语义 query 条暂缺 ⇒ 判据降级需 WB 重裁） |
