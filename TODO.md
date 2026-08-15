# LarryAgent TODO

## 当前待办

### 记忆系统调优

- [ ] 检索参数调优（`memory/engine.py::get_long_term_memory`）：长期 — 根据实际使用中召回质量持续调整 score_threshold / top_k / 分级阈值
- [ ] 向量检索上下文扩展 → **已归入 P3 记忆系统调优**
- [ ] 记忆保鲜机制 → **已归入 P3 记忆系统调优**
- [ ] 向量同步补偿：长期 — ChromaDB 异常恢复后自动校验 SQLite ↔ ChromaDB 一致性并补写缺失向量
- [ ] Embedding 模型迁移脚本：长期 / 待触发 — 更换模型时重建 collection + 全量重索引
- [ ] `llm.py::_resolve_provider_key` → **已归入 P3.0 前置修补**

### 多场景 AI 架构

> 以下为长期架构愿景，当前 P0-P3 仅支持手动切换角色，自动意图识别和跨域关联留待后续迭代。

- [ ] 意图识别机制：长期 — 对话开头快速分类用户意图，自动切换角色
- [ ] 跨域关联能力：长期 — 记忆检索不限单一领域，允许 AI 发现跨场景因果链
- [ ] 用户画像沉淀：长期 — 从记忆中提炼结构化用户画像，注入 system prompt
- [ ] 场景间信息同步策略：长期 — 定义全局共享 vs 领域私有的记忆边界

### 对于AI的约束条件/提示词/注意力/配置文件等的一致性调整（Marvis情况特殊，不纳入自查和调整）

> Claude Code 自查发现的协同张力点（独立自查，2026-08-14 提出三点，然后按"自查独立"原则复核扩充，待 WorkBuddy / 老大裁决）

- [x] **CLAUDE.md 字面规则与实际机制脱节**（2026-08-14 已自修）：交流区指向、当前阶段状态等过时引用已全部修正——交流区指向 `exchange/`；「当前开发阶段」段改为轻量引用 TODO，避免硬编码子阶段状态腐化
- [ ] **独立判定 vs 组长裁决的升级路径未固化**：两个场景均亲身经历/推演过——① 我下独立判定后被组长裁决推翻（token 翻倍"当前不修"被推翻改采方案 A），规则只写"分歧由人类裁决"，未明确升级前是否停手；② 我执行 WorkBuddy 派发（如 P3.4 测试任务）时若发现派发规格有遗漏/错误，规则未写"立即暴露停手"还是"按派发执行"。建议：分析含异议时明确标注；派发规格有误时立即在 exchange 暴露并停手，不私自补字段
- [ ] **立即 commit vs 做之前先确认的边界未定义**：两个维度都是我 CLAUDE.md 内部真实交叉——① 文件可见性：要改的文件是用户 IDE 打开/其他 AI 正在改的文件时怎么办；② 任务模糊度：字段级规格直接做+commit 无歧义，但模糊任务（如"优化一下 chat_service"）是先确认还是做完即提交。当前靠 git status + exchange 事后推断。建议：字段级派发直接做+commit；模糊任务先在 exchange 提方案确认再做
- [ ] **测试验证覆盖缺口**：三个问题均为我日常验证动作中实际体验——① 3 项存量债务（chromadb_degradation / integration / windows_dir）使"全套绿"基线不可用，回归可能从覆盖盲区漏出（先例：archiver.py 回归 P2.3 引入、隔天才发现）；② "每个任务必须跑哪些测试"无标准（P3.4 我只跑了 test_auth_middleware.py，没跑 test_chat_service.py，靠经验判断）；③ 主验证/全套/已知项甄别的优先级无规则。建议：每个任务必须跑相关测试文件 + 已知债务甄别；全套跑仅在跨模块改动时强制；是否修复债务恢复"全套绿"基线待定
- [ ] **跨 AI 文件归属与告知义务不对称**：我的 CLAUDE.md 只写"与 Trae CN 分工，避免同时改同一文件"，无对称告知约束。测试文件归属未定义——我写 `test_auth_middleware.py` 时未告知 Trae。建议：明确文件归属规则（如"测试文件归写测试的 AI 所有"）+ 对称告知义务，或统一改为"靠 exchange 同步"，取消告知要求
- [ ] **"不过度抽象" vs 项目 ABC 抽象基类约定**：CLAUDE.md 原则 1 要求不过度抽象，但项目既有约定是 LLM/Embedding provider 遵循 ABC（EmbeddingProvider、BaseTool 为既成事实）。新增模块按哪条走无判定标准（P3.5 exceptions.py 的 LarryException 基类已在 TODO 明确、无歧义；P4 前端等新领域未定）。建议：已用 ABC 的领域延续；新领域默认不抽象，除非用户/组长明确要求

> Trae CN 自查发现的张力点（2026-08-14）

- [x] **TRAE.md 字面规则与实际机制已脱节**（2026-08-14 已自修）：`.trae/TRAE.md` 行为准则第 4 条、"协作原则"、"当前开发阶段"、"关键约定"中共 4 处过时引用已全部修正——交流区指向 `exchange/`，"当前阶段"段改为轻量引用 TODO 避免硬编码子阶段状态。剩余 7 条张力点仍待人类裁决
- [ ] **顶层"默认不写注释" vs 项目原则"每个模块头部有职责说明"**：顶层系统提示要求 "Default to writing no comments"，但 TRAE.md 项目原则第 5 条要求"每个模块头部有职责说明，关键逻辑有注释"。新模块的注释密度无判断标准（P3.4 `auth.py` 实际两者都做了：模块 docstring + 关键行简注，但靠经验而非规则）。建议：明确"模块头部 docstring 必有 + WHY 类注释按需 + WHAT 类不加"为项目默认，覆盖顶层"默认不写"
- [ ] **"不设专属文件" vs "其他 AI 需修改先告知我"的内部矛盾 + 跨 AI 约束不对齐**：TRAE.md 协作原则同时写"不设专属文件"和"其他 AI 需修改某个文件应先告知我"，两条边界模糊；且 `.claude/CLAUDE.md` 只写"与 Trae CN 分工，避免同时改同一文件"，没有对称的"告知 Trae"约束。实测场景：Claude 写 `tests/test_auth_middleware.py` 算不算"修改我的文件"？测试文件归属未定义。建议：要么明确"测试文件归写测试的 AI 所有，我不得擅自改"，要么取消"告知"约束改为"靠 exchange 同步"
- [ ] **顶层"NEVER proactively create documentation files" vs 项目要求持续维护 TODO/exchange**：顶层禁主动创建 .md，但项目要求完成事项后更新 .md。编辑现有 .md 无歧义，但新增配置文件（如之前创建 `.trae/TRAE.md`、`.trae/roles.yaml`）的"必要"边界由谁判定不明确——用户指示创建时算必要，但"AI 主动建议创建配置文件固化约定"算不算？建议：明确"AI 可主动建议创建配置/约定类 .md，但必须先经用户确认"
- [ ] **顶层"不要过度抽象" vs project_memory "ABC 抽象基类"工程约定**：顶层要求"Don't add features, refactor, or introduce abstractions beyond what the task requires"，但 `project_memory.md` Engineering Conventions 已确立"LLM 和 embedding providers 遵循 ABC 抽象基类设计"。现有 ABC 是既成事实不会引发决策困难，但新增模块（如 P3.5 的 `exceptions.py` 是否要做 `LarryException` 基类？P4 的 PC 客户端是否要为前端做抽象层？）该按"项目约定 ABC"还是"顶层少抽象"无判定标准。建议：在 project_memory 明确"已用 ABC 的领域延续，新领域默认不抽象除非用户/组长明确要求"
- [ ] **独立判定 vs 组长裁决的升级路径未固化**（与 Claude 视角重叠但场景不同）：P3.3 中"双调用 token 翻倍"是我独立分析后向用户暴露的——但当时 WorkBuddy 还没派发 P3.4，如果是 **WorkBuddy 已派发任务且我在执行中发现派发规格有问题**（如 P3.4 派发漏了某个字段），规则没写我是按派发执行还是先停下来暴露。`exchange/README.md` 只写"分歧由人类裁决"，没写"AI 独立分析与组长派发冲突时的升级路径"。建议：明确"派发规格有遗漏/错误时立即在 exchange 暴露并停手等裁决，不私自补字段"
- [ ] **立即 commit vs 做之前先确认的衔接点未定义**（与 Claude 视角重叠但角度不同）：Claude 关注"文件可见性"（是否与他人冲突），我关注"任务模糊度"。TRAE.md 同时有"做之前先确认"和"立即 commit 不等待验收"两条——P3.4 派发规格已细化到字段级时我直接做+commit 没歧义，但模糊任务（如"优化一下 chat_service"）下"先确认"意味着停下来问，"立即 commit"意味着做完就提交，如果用户确认后我做完直接 commit、方向错了又要回滚。建议：明确"派发规格已细化到字段/函数级时直接做+commit；模糊任务先在 exchange 提方案确认再做+commit"
- [ ] **测试验证范围边界未定义**（与 Claude 视角重叠但角度不同）：Claude 关注"全套绿基线不可用"，我关注"TRAE.md vs user_profile 验证要求不一致"。TRAE.md 测试环境段写"主验证用 `test_chat_service.py`"，但 `user_profile.md` 写"end-to-end testing after completing each phase"——P3.3 我跑 16 项 test_chat_service.py 没跑全套（因为知道 3 项存量债务），P3.4 我只跑了临时 TestClient 验证脚本连 test_chat_service.py 都没跑（因为没有相关测试）。验证范围边界靠经验判断而非规则。建议：明确"每个任务必须跑相关测试文件 + 已知存量债务甄别，全套跑仅在跨模块改动时强制"

> WorkBuddy 自查发现的张力点（2026-08-14，独立自查；已读 Claude / Trae 自查受启发，但仍按自身「组长/架构师」角色独立描述，重复项不省略、从己方角度重述）

- [ ] **CoT 过度纠结 / 反复拿不定主意的根因 = 四条并行准则冲突（核心，用户已重点标注）**：用户经样本量不低的观察确认我存在普遍性过度纠结与反复。自查定位根因为四条同时生效的准则——「矛盾暴露」（要求全量暴露）、「拍板简明」（要求给方向性裁决）、「逃熊最小动作」（不过度工程、确认理解再派发）、「架构师展开」（权衡分析）——在需要裁决时互相拉扯且无优先级，导致同一问题来回拉锯。已提出「表达与决策协议」（结论先行 + 冲突收敛优先级 + 暴露尺度 + 不确定直说）写入项目 MEMORY.md，但该协议尚未经用户最终裁决落地，也未验证能否真正消除纠结。建议：以该协议为 WorkBuddy 后续自我调整的依据，先经用户确认再作为硬规则执行。

- [ ] **「架构师展开」与「组长拍板」是同一角色的两个相反动作，缺触发标准**：我同时被要求「把权衡掰开揉碎」（架构师）和「给简明方向性意见」（组长拍板），两者天然相反，但没有规则说明「什么场景展开到什么程度就该收口」，后果是展开过度显得絮叨、或为求简明吞掉关键权衡。此点与 Claude / Trae 的「独立判定 vs 组长裁决」不同——他们是「被裁决方」视角，我是「裁决方」视角：我做裁决时展开 / 收敛的分寸无标准。建议：明确「裁决先给结论，展开仅在结论有争议或涉及安全边界时补充」。

- [ ] **误判后的过度修正（hedging 反复）**：项目中有多次被我自信误判、被用户纠正的记录（config.yaml 是否入库、工具面板是否为 git 视图、变更面板是否含删除等）。每次被纠正后我会更谨慎，但谨慎滑向另一个极端——不确定就反复试探、来回改口，把「纠错」变成「过度 hedging」。缺少「误判后如何恢复到正常置信度」的机制。建议：明确「误判被纠正后基于证据重新给结论，不因一次纠错就全局降置信、不反复试探」。

- [ ] **派发方视角的边界未固化（与 Claude / Trae 执行方视角互补）**：Claude / Trae 从执行方提了「派发规格有误时停手暴露」，我从派发方自查：我派发任务（如 P3.4 给 Trae 实现 / Claude 测试）后，规格粒度、以及「派发后我是否有义务主动复验、还是等执行方回报」没有成文规则，现实是 P3.4 我至今未独立复验（auth.py 未读、测试未跑）。建议：明确「组长派发后应独立复验关键交付物，不能只等执行方回报」。

- [ ] **作为组长的「跨 AI 信息同步」越界边界未定义**：我的职责含「维护交流区、跨 AI 信息同步」，但 exchange/ 里我读 claude.md / trae.md、只改 workbuddy.md 的边界，以及「信息同步到哪一步算越界去改别人的文件」没有明确规则。与 Claude / Trae 的「文件归属不对称」是同一问题的不同侧面——他们是「我的文件被别人改了怎么办」，我是「我该不该主动去改别人的文件来做同步」。建议：明确「同步靠 exchange 各自区域 + TODO 人类区汇报，组长不代改其他 AI 的专属文件」。

- [ ] **安全底线的「强制语气」与「正向改写」的取舍未锁定**：用户近期提出把限制性文件的「不要如何」改写为「建议更多如何」，我据此计划改写，但已暴露一个矛盾：两条安全硬底线（不输出真实 key、实质矛盾必须暴露）若改成正向引导会被弱化成可选项。此取舍尚未与用户敲定，改写范围未锁定。建议：安全硬底线保留强制语气，仅对非安全类禁令做正向改写，改写范围先经用户确认。

---

## 开发路线图

按依赖顺序分 6 个阶段，每个阶段形成可运行的闭环。

### P0 - 最小聊天闭环 ✅

> 能发消息、收回复、存历史

- [x] 修复启动时序：DB 目录创建移到 `get_db()` 之前
- [x] Qdrant 加 `enabled` 开关 + try/except 容错，P0 不依赖
- [x] VectorStore 改为 ChromaDB 内嵌方案，无需独立进程
- [x] 新增 `db/conversations.py`：会话与消息 CRUD
- [x] 实现 `/api/chat` 非流式（短期记忆 + LLM 调用，跳过长期记忆和工具）
- [x] 修复 LLM 客户端缓存 key：按 provider 而非 model name
- [x] 新增 `logging_config.py`：统一日志格式 + 第三方库降噪
- [x] config.yaml 补 `vector_store.enabled` / `logging` 段，统一 larry 命名
- [x] chat.py 加默认 system prompt
- [x] 申请 API Key 填入 `config.yaml`，端到端测试通过（2026-08-07）

### P1 - 记忆系统可用 ✅

> 能检索上下文，多轮对话有记忆，跨会话归档

**P1.1 - Embedding 模块** ✅

- [x] 重写 `models/embedding.py`，抽象基类 `EmbeddingProvider` + 工厂函数 `get_embedding_provider()`
- [x] 实现 `LocalEmbedding`：基于 `sentence-transformers` 加载 `BAAI/bge-small-zh-v1.5`（512 维，~95MB）
- [x] 实现 `OpenAIEmbedding`：兼容 OpenAI embedding API（备用方案）
- [x] `config.yaml` / `config.py` 中 embedding 段补 `local_model_name`、`base_url`、`hf_endpoint` 字段
- [x] 安装依赖 `sentence-transformers`，验证模型可加载、可生成向量、余弦相似度正确（2026-08-07）
- [x] 测试文件归档：`tests/test_embedding.py`（基础验证）、`tests/test_embedding_enhanced_version.py`（增强版：多维度语义、多语言、长文本、边界测试）

**P1.2 - ChromaDB 向量库 CRUD** ✅

- [x] 从 Qdrant 切换到 ChromaDB 内嵌方案：无需独立进程，零外部依赖
- [x] `vector_store.py` 全量重写：`asyncio.to_thread` 包装同步 ChromaDB 调用
- [x] `config.py` / `config.yaml`：`QdrantConfig` → `VectorStoreConfig`（path + collection_name）
- [x] 实现 `insert(points)`：`coll.upsert(ids, embeddings, metadatas)` 批量插入
- [x] 实现 `search(query_vector, limit, score_threshold)`：`coll.query()` + 余弦距离→相似度转换 + 阈值过滤
- [x] 实现 `delete(point_ids)`：`coll.delete(ids)`
- [x] `ensure_collection`：`get_or_create_collection(schema-free)`，ChromaDB 无需预先指定维度
- [x] 验证 `chunker.py` 分块结果与向量库 insert 数据格式对接

**P1.3 - DB 层补全** ✅

- [x] `db/conversations.py` 补 `get_messages(conversation_id, limit)` 方法：最近 N 条消息，时间正序
- [x] `memory/engine.py` 的 `get_short_term_memory` 改为调用 `conversations.get_messages()`，消除直接 SQL
- [x] 新建 `db/memories.py`：`create_memory` / `get_memory` / `list_memories` / `update_memory` / `deactivate_memory` / `delete_memory`

**P1.4 - 长期记忆检索** ✅

- [x] 实现 `memory/engine.py` 的 `get_long_term_memory(query)`：query → embed → ChromaDB search → 返回文本列表
- [x] ChromaDB 不可用时降级返回空列表（try/except），不影响 P0 聊天功能
- [x] `api/chat.py` 接入：`long_term=await get_long_term_memory(req.message)` 注入 system prompt
- [x] `main.py` lifespan 已调整：embedding provider 初始化 → `ensure_collection(dim)`

**P1.5 - 归档流程** ✅

- [x] 新建 `memory/archiver.py`：对话全文 → LLM 摘要 → 分块 → 向量化 → 双写存储
- [x] 新建 `api/memory.py` 路由：POST archive / POST archive/confirm / GET list / DELETE
- [x] 设计摘要生成 prompt（保留需求/偏好/决策/事实信息，丢弃闲聊）
- [x] 记忆软标记：ChromaDB metadata 记录 `source_role`，检索时排序加权，不硬过滤
- [x] 端到端验证：归档 → 新会话记忆召回 → 双删（2026-08-07）

**P1.6 - 端到端测试 + 降级保护** ✅

- [x] `config.yaml` 开启 `vector_store.enabled: true`
- [x] 测试长期记忆检索：多轮对话后归档 → 新会话中验证记忆召回
- [x] 测试归档流程完整闭环
- [x] ChromaDB 降级测试（`tests/test_chromadb_degradation.py`，7 项全通过，2026-08-10）
- [x] 修复 `confirm_and_store` 降级保护：ChromaDB 写入失败时 SQLite 记录保留、会话正常归档

### P2 - 工具调用闭环

> Agent 能调用文件和 Shell。tools/ 骨架已存在（base.py / registry.py 完整，file_ops.py / shell.py / api/tools.py 仅 501 占位），各子阶段填充血肉。

**P2.1 - FileOpsTool 实现** ✅

路径沙箱用 pathlib：resolve 绝对路径 → 确认在 workspace 子树内 → 拒绝 `../` 逃逸。三动作：

- [x] `_read(path)`：`Path.read_text(encoding="utf-8")`，文件不存在返回 error
- [x] `_write(path, content)`：先检查路径在 workspace 内，同路径已存在则自动追加后缀 `_1` / `_2`（不覆盖），`Path.write_text`
- [x] `_list(path)`：目录存在返回文件和子目录名列表，不存在返回 error
- [x] `_read` 文件大小限制 100KB（`_MAX_READ_BYTES`），防止 LLM 读大文件撑爆上下文
- [x] `_list` 条目上限 1000（`_MAX_LIST_ENTRIES`），超出截断并提示总数

配置化：`_workspace_root` 从 `config.yaml` 的 `tools.file_ops_workspace` 读取，默认 `~/larry_workspace`。
端到端测试 20 项全通过（`tests/test_file_ops_tool.py`，2026-08-11）：读/写/列表三动作、路径沙箱（`../` 逃逸、绝对路径逃逸）、不覆盖写入、嵌套目录、文件大小限制、条目截断、工具注册与 schema。

**P2.2 - ShellTool 实现** ✅

- [x] `asyncio.create_subprocess_shell` 执行，`communicate()` 读 stdout/stderr
- [x] 30s `asyncio.wait_for` 超时（仅包裹 `communicate()`，不包裹进程创建）；超时后 `_kill_process()` 清理
- [x] `working_dir` 参数生效
- [x] 高危命令黑名单检测（`_blocked_patterns`：`rm -rf /`, `del /f /s C:\`, `format`, `shutdown`）
- [x] IP 白名单：从 `config.yaml` 的 `tools.shell_allowed_ips` 读取，默认 `["127.0.0.1", "::1"]`。校验逻辑下沉到 `ShellTool.execute()` 内部，从 `kwargs` 接收 `caller_ip` 比对
- [x] `config.py` `ToolsConfig` 新增 `shell_timeout` 字段（默认 30），配置驱动超时
- [x] 工具注册：`scan_and_register()` 自动发现 ShellTool，`get_openai_schema()` 生成 function calling schema
- [x] Windows 超时杀进程树：`taskkill /T /F /PID` 杀孙进程，非 Windows 用 `proc.kill()`
- [x] 端到端测试 15 项全通过（`tests/test_shell_tool.py`，2026-08-11）

- [ ] ShellTool 黑名单已知可绕过（字符串包含匹配，`rm -rf  /`、`rm --recursive --force /`、`find / -delete` 等变体均可穿透）。当前安全依赖 IP 白名单（仅 `127.0.0.1`/`::1`）兜底，单人本机使用场景下攻击面极小。不做主动修复，后续若放开 IP 白名单（如 P5 局域网部署），须先将黑名单升级为正则/词法解析或换用沙箱方案。

注意：config 采用扁平结构 `tools.shell_allowed_ips` + `tools.shell_timeout`，而非嵌套 `tools.shell.xxx`，简化读取逻辑。

**P2.3 - Function Calling 循环（/api/chat）** ✅

> P2 核心。改造 `/api/chat` 的 LLM 调用段。

**前置依赖（已完成）：**
- [x] `llm.py::chat_completion` 改为接受 `tools` 参数，返回 `LLMResponse(content, tool_calls, finish_reason)` 结构
- [x] `messages` 表新增 `tool_call_id` 列（增量迁移），`insert_message` / `get_messages` 支持 tool_calls 序列化存储 + OpenAI 格式转换
- [x] 重构 chat.py：业务逻辑下沉到 `services/chat_service.py`，API 层只做参数校验 + caller_ip 提取 + 错误转换

**功能实现：**
- [x] `get_openai_tools()` 返回的 schema 注入 LLM 请求的 `tools` 参数
- [x] LLM 返回后检测 `finish_reason == "tool_calls"`，解析 `tool_calls`
- [x] 从 registry 取工具 → `await tool.execute(**args)`，ShellTool 自动注入 `caller_ip`（从 `request.client.host` 获取）
- [x] tool result 作为 `role: "tool"` 消息追加到 messages，带 `tool_call_id`（来自原 tool_call 的 `id`）
- [x] 循环直到 `finish_reason == "stop"`（纯文本）
- [x] 最大轮次限制（`MAX_TOOL_ROUNDS = 10`），防止死循环
- [x] 工具按角色过滤：`_get_tools_for_role(role)` 按 config.yaml 中 role 的 `tools` 列表过滤，未配置则返回全部
- [x] 每轮 tool call 记录日志（工具名、结果摘要 200 字符）
- [x] 持久化设计：每轮的 assistant 消息（含 tool_calls）和 tool 结果消息（含 tool_call_id）实时写入 DB，会话恢复时 `get_messages` 反序列化并转为 OpenAI 格式，不丢失工具调用上下文。
- [x] 端到端测试 8 项全通过（`tests/test_chat_service.py`，2026-08-11）：无工具调用、单工具调用、多工具调用、最大轮次限制、工具不存在处理、消息持久化（tool_calls + tool_call_id）、角色过滤。
- [ ] 注：后续可加 token 累计上限（单次对话 tool call 总 token 阈值），防止单轮读大文件等场景暴增。当前仅轮次限制。本条目优先级很低，不做主动处理，后续若出现与此条目相关的问题，再考虑是否需要完善，完善前先进行充分讨论，任何情况下不静默自动处理。

**P2.4 - /api/tools 接口实现** ✅

- [x] `GET /api/tools`：调用 `list_tools()`，返回 `[{name, description, parameters, enabled}, ...]`
- [x] `POST /api/tools/execute`：从 registry 取工具 → `tool.execute(**params)`，ShellTool 自动注入 caller_ip

**P2.5 - config.yaml 扩展** ✅

- [x] 新增 `tools` 配置段（扁平结构，含 `file_ops_workspace`、`shell_allowed_ips`、`shell_timeout`、`function_calling_max_iterations`），`chat_service.py` 从 config 读取最大轮次
  ```yaml
  tools:
    file_ops_workspace: "~/larry_workspace"
    shell_allowed_ips: ["127.0.0.1", "::1"]
    shell_timeout: 30
    function_calling_max_iterations: 10  # P2.3 实现时补充
  ```

**P2.6 - 端到端测试**

- [x] 单工具调用：让 LLM 读一个已知文件，验证返回内容（`test_integration_llm.py::test_single_tool_call`，真实 DeepSeek API）
- [x] 多工具串行：先 `list` 目录再 `read` 其中某个文件（`test_integration_llm.py::test_multi_tool_serial`，真实 DeepSeek API）
- [x] Shell 工具：执行 `echo hello`，验证 stdout（`test_shell_tool.py` 已覆盖）
- [x] 沙箱拒绝：尝试 `../` 路径，验证返回 error（`test_file_ops_tool.py` 已覆盖）
- [x] 黑名单拒绝：尝试 `rm -rf /`，验证被拦截（`test_shell_tool.py` 已覆盖）
- [x] 循环上限：构造一个永远要调工具的场景，验证在第 N 轮截断（`test_chat_service.py::test_max_rounds`）
- [x] API 层：`GET /api/tools` 返回列表；`POST /api/tools/execute` 手动调工具（`test_integration_llm.py::test_api_tools_endpoint`）
- [x] 角色过滤端到端：role 只配 `tools: ["file_ops"]`，验证传给 LLM 的 `tools` 参数不含 shell schema（`test_chat_service.py::TestRoleFilterEndToEnd`）
- [x] 工具失败恢复：LLM 调 `file_ops.read` 读不存在的文件 → tool 返回 error → error 内容正确回到 messages 的 `role: "tool"` 且对话不中断（`test_chat_service.py::TestToolErrorRecovery`）
- [x] caller_ip 注入：通过 `_run_tool_loop` 调 ShellTool，验证 `caller_ip` 实际传入 kwargs（安全关键路径）（`test_chat_service.py::TestCallerIpInjection`）

### P3 - 流式 + 体验优化

> 打字机效果、Token 统计、错误处理、记忆调优
>
> 执行顺序（2026-08-12 确认）：P3.3 → P3.4 → P3.5 → P3.2

**P3.0 - 前置修补（流式实现前必须完成）** ✅

- [x] `llm.py:_resolve_provider_key` 前缀解析改显式 dict 映射（如 `{"deepseek-chat": "deepseek", "qwen-max": "qwen"}`），防止接第二个 provider 时解析断裂
- [x] `LLMResponse` 补 `usage` 字段（prompt_tokens / completion_tokens / total_tokens），`chat_completion` 解析 `response.usage` 写入返回
- [x] `config.py` 新增 `LLMConfig` dataclass（`max_retries` / `retry_backoff_base` / `max_input_tokens` / `debug_log`），`config.yaml` 和 `config.example.yaml` 同步新增 `llm` 配置段。P3.2/P3.3 的配置项统一挂在此段下

**P3.1 - SSE 流式聊天** ✅

> 通信协议保持现有 `/api/chat`，通过 Header 区分：`Accept: text/event-stream` 走流式，否则走非流式。

- [x] `llm.py` `chat_completion_stream` 补 `stream_options={"include_usage": True}`，流结束时记录 final chunk 的 usage；支持 `tools` 参数
- [x] `chat_service.py`：`_run_tool_loop` 重构为 `_chat_flow` async generator。FC 循环非流式检测 tool_calls，最终文本用 `chat_completion_stream` 真实流式输出。`handle_chat` 消费 generator 收集 delta，`handle_chat_stream` 包装为 SSE 字符串
- [x] 工具调用事件：`event: tool_call`（执行前推送，含工具名/轮次/参数）、`event: tool_result`（执行后推送，含成功/失败/结果摘要）、`event: delta`（文本流）、`event: done`、`event: error`
- [x] `chat.py`：端点复用 `/api/chat`，根据 `Accept: text/event-stream` 分支 → `StreamingResponse`
- [x] 移除 `/api/chat/stream` 501 占位端点
- [x] `client/chat.html`：SSE 流解析 + delta 文本实时追加 + 工具调用卡片（spinner→✅/❌ + 结果展示）
- [x] 测试验证：11 项 mock 测试全通过 + 3 项真实 DeepSeek API 集成测试全通过

**P3.2 - LLM 重试**

- [ ] 引入 `tenacity`，`chat_completion` 外层加 `@retry`
- [ ] 触发条件：网络错误、429（尊重 Retry-After header）、5xx
- [ ] 不在重试策略内：4xx 参数错误（代码 bug 重试没用）
- [ ] `config.yaml` 新增 `llm.max_retries`（默认 3）、`llm.retry_backoff_base`（默认 1.0，指数退避 1s/2s/4s）
- [ ] 日志：每次重试记录 `batch_llm_call retry attempt=2/3 error=xxx wait=2s`

**P3.3 - Token 用量统计** ✅（2026-08-12，含 token 翻倍优化）

- [x] token 翻倍优化（方案 A）：新增 `chat_completion_stream_events` 全程流式支持 tools——每轮 FC 循环单次流式调用同时拿到 delta + finish_reason + tool_calls + usage。有 tool_calls 时进入工具循环，无工具时 delta 已实时推送。消除"非流式探测 + 流式重生成"的 token 翻倍问题（无工具调用场景 LLM 调用次数从 2 → 1）
- [x] 风险控制（交付标准）：补 `TestLLMStreamEventsStateMachine` 单测覆盖"tool_calls 参数跨 chunk 拆分"场景（多 tool_call × arguments 分段 × id/name 分 chunk 出现），验证跨 chunk 拼接状态机正确
- [x] 每次 LLM 调用后记日志：`batch_llm_call token_usage model=... total=... prompt=... completion=...`（`llm.py::_log_token_usage`，流式 + 非流式统一输出）
- [x] `llm.max_input_tokens`（config 已存在）：新增 `models/token_counter.py`，tiktoken 估算 + 未安装时回退字符数保守估算。请求前超出阈值时按策略截断并 WARNING 日志
- [x] `chat_service.py` 单次请求累计 token（`_accumulate_usage` 按 FC 循环每轮叠加），超过 `llm.max_input_tokens` 阈值告警日志（只 warn 一次避免刷屏）
- [x] `llm.debug_log` 开关（config 已存在）：`llm.py::_debug_log_request` / `_debug_log_response` 控制 raw 请求/响应正文 DEBUG 日志输出，默认关闭

> ⚠️ **tiktoken 精度问题：** DeepSeek 的 tokenizer 与 OpenAI 不同（尤其是中文），tiktoken 估算值会偏。估算仅用于**截断触发**（超了就截），不做精确计费——精确用量以 API 返回的 `response.usage` 为准。tiktoken 未安装时自动回退字符数保守估算并 WARNING 提示。
>
> **截断策略：** 保留 system prompt + 最后 N 条消息，从中间删除旧消息，不从头部截（防止丢失 system prompt 上下文），中间插入"（历史消息因超 token 限额已省略）"占位提示。

测试：16 项全通过（11 项 chat_service 端到端 + 2 项 TokenCounter + 3 项 LLMStreamEvents 状态机，其中 test_no_tool_calls 新增强断言 call_count==1 直接验证了消除双调用）。

P3 只做记录告警，DB 表和 API 留给 P4。

**P3.4 - API Key 校验**（进行中，2026-08-12 派发：Trae 实现 / Claude 测试 / WorkBuddy 确认）

- [ ] 新增 `backend/middleware/auth.py`：`AuthMiddleware(BaseHTTPMiddleware)`，仅拦截 `path.startswith("/api/")`，非 `/api/` 天然透传；空 `server.api_key` 完全透传；非空时校验 `Authorization: Bearer <key>`，失败返回 401
- [ ] `config.py` `ServerConfig` 补 `api_key: str = ""` 字段（解析逻辑已兼容，无需改）
- [ ] `config.yaml` `server` 段新增 `api_key: ""`（保持空，当前不启用）
- [ ] `config.example.yaml` `server` 段新增 `api_key: ""` + "P5 放开局域网前必须设置"注释
- [ ] `main.py` 在 `include_router` 前 `app.add_middleware(AuthMiddleware)`
- [ ] 401 响应体严格为 `{"error": "AUTH_ERROR", "detail": "Invalid or missing API key"}`
- [ ] 测试 `tests/test_auth_middleware.py`（FastAPI TestClient）：空 key 透传 / 无 header→401 / 正确 Bearer→200 / 错误 Bearer→401

P5 局域网访问时必须启用（硬性前置：改 `host: 0.0.0.0` 前须先 set `server.api_key`），当前本机使用可空。

**P3.5 - 自定义异常类**

- [ ] `exceptions.py`：`LarryException` 基类 → `ConfigError` / `LLMError` / `ToolError` / `AuthError`
- [ ] 替换 `chat.py` 中通用 `ValueError`、`Exception` 为具体类型
- [ ] 全局异常 handler：`larry_exception_handler` 注册到 FastAPI，统一响应 `{"error": "TYPE", "detail": "msg"}` + 对应 HTTP 状态码

---

#### 记忆系统调优（P3 中后期）

- [ ] `engine.py` 向量检索上下文扩展：archive 中同一 memory_id 的相邻 chunk 在命中时一并拉出合并，避免 LLM 看到被截断的片段
- [ ] `search()` score_threshold 分级：不同来源检索用不同阈值
- [ ] 记忆保鲜机制：`last_hit_at` / `priority`，被频繁检索的记忆提升保留权重

### P4 - PC 客户端可用

> 双击图标直接用

- [ ] 选前端框架（推荐 Vue 3 + Vite，轻量）
- [ ] 聊天界面：会话列表 + 消息区 + 输入框
- [ ] Tauri Rust 端：拉起 uvicorn → health check → 显示窗口
- [ ] 窗口关闭时 kill Agent 进程

### P5 - 移动端 + 部署

> 手机浏览器可访问

- [ ] 响应式 UI 或独立 `mobile/index.html`
- [ ] Nginx 部署脚本示例（静态文件 + API 反代）
- [ ] PWA manifest + Service Worker（可选）
- [ ] 部署文档 + 安全加固

**上云前架构债清算（P5 前置，记账不追债，2026-08-12 确认）**

- [ ] 记忆隔离：长期记忆检索按 `source_role` 加权（软隔离），多场景角色记忆分离
- [ ] 边界侵蚀：工具消息与对话消息分离（`tool_calls` / `tool_call_id` 不再写入 `messages` 表）
- [ ] shell IP 白名单重构：`127.0.0.1` / `::1` 白名单与公网访问不兼容，上云前改为 API Key 鉴权为主

> AI 交流讨论区已迁移至 `exchange/` 目录（各 AI 独立文件，各自区域只有自己能修改，特殊：workbuddy有权在claude和trae的文件中通过新增内容的方式派发任务）。人类治理区迁移至`HUMAN.md`文件 