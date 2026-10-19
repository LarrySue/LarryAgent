# LarryAgent Web Search 技术选型与设计规格（综合版）

> 本文档综合三方 AI 调研成果：QoderWork（原始选型）、通义千问（定价与生态补充）、DeepSeek（工程实现建议）。
> 生成日期：2026-08-29
> **主持**：Qoder ｜ 定稿流程见 `exchange/README.md`（改动看 `git log -- exchange/web-search-design.md`）

---

## 一、项目背景与需求

LarryAgent 是一个个人 AI Agent，技术栈为 Python FastAPI + SQLite + ChromaDB + Tauri，已支持多角色切换（default / code / health / finance），不同角色有不同的 system prompt 和行为预期。

### 搜索需求按角色场景分化

| 场景 | 角色 | 搜索需求特点 |
|---|---|---|
| 日常问答 | default / code | 通用信息查询、技术问题、编程方案，需要 LLM 友好的干净文本 |
| 健康管理 | health | 医学/营养/运动信息，要求来源可靠，不被 SEO 垃圾污染，隐私敏感 |
| 财务理财 | finance | 财经数据、收支分析，要求信息准确可追溯 |
| 数学物理 | math_physics（新增） | 公式求解、物理计算、推导验证，需要计算能力而非文本搜索 |

**核心设计原则**：多 provider 并存，按角色路由到不同搜索服务，与项目现有的多模型（deepseek/qwen/gpt）和多角色架构保持一致。

---

## 二、最终选型

| Provider | 负责场景 | 选型理由 |
|---|---|---|
| **Tavily** | default、code（日常问答、技术问题） | AI 原生优化，返回干净文本+引用，集成最简单 |
| **Brave** | health、finance（健康、理财） | 独立索引可靠，不受 SEO 污染，零追踪隐私保护，Answers API 提供可追溯引用 |
| **Wolfram Alpha** | math_physics（数学、物理） | 计算而非搜索，能实际求解公式和物理问题 |

---

## 三、各 Provider 详细评估

### 3.1 Tavily Search API

- **官网**：https://tavily.com
- **定位**：专为 AI Agent 和 RAG 设计的搜索 API
- **搜索引擎**：使用未公开的专有搜索算法，多源聚合优化

#### 定价（2026年更新）

| 计划 | 月额度 | 单价 | 说明 |
|---|---|---|---|
| Researcher（免费） | 1,000 credits/月 | 免费 | 无需绑信用卡 |
| Project | 4,000 credits/月 | $30/月（$0.0075/credit） | 适合个人开发者 |
| Bootstrap | 15,000 credits/月 | $100/月（$0.0067/credit） | 适合小团队 |
| Pay-as-you-go | 按量 | $0.008/credit | 无月费，用多少付多少 |

**搜索成本明细**：

| 功能 | 成本 |
|---|---|
| Basic Search | 1 credit/次 |
| Advanced Search | 2 credits/次 |
| Basic Extract | 每5次URL提取 = 1 credit |
| Crawl（10页basic） | 3 credits |
| Research（mini） | 4~110 credits/次 |
| Research（pro） | 15~250 credits/次 |

#### 核心优势

- 返回结果为 LLM 优化过的干净结构化文本，附带引用来源，可直接注入 LLM 上下文
- LangChain/LangGraph 生态的默认搜索工具，集成方案最多
- 提供 MCP Server（`@tavily/tavily-mcp`），支持 Claude Desktop / Cursor 等客户端
- 搜索深度可配置（basic / advanced），灵活控制成本
- 2026年2月宣布加入 Nebius 生态

#### 核心劣势

- 免费额度较小（1,000 credits/月），对高频使用场景可能不够
- 延迟约 1-2 秒，略高于亚秒级竞品
- 搜索引擎底层不透明（未公开使用哪个搜索引擎）

#### LarryAgent 适用性

作为 default/code 角色的主力搜索工具非常合适。个人使用场景下，1,000 次/月免费额度基本覆盖日常问答需求。可根据场景选择 basic/advanced 搜索深度，日常用 basic（1 credit），深度研究用 advanced（2 credits）。

---

### 3.2 Brave Search API

- **官网**：https://brave.com/search/api/
- **定位**：独立搜索引擎 API（自建索引，不依赖 Google/Bing）
- **搜索引擎**：Brave 自有索引，2026年突破 16 亿次月搜索量，覆盖超过 300 亿页面

#### 定价（2026年更新）

| 计划 | 单价 | 说明 |
|---|---|---|
| 免费信用 | $5/月（约1,000次 Search） | 需绑信用卡，需标注 "Powered by Brave" |
| Base AI | $5/千次 | 含 LLM 使用权 |
| Pro AI | $9/千次 | 含 LLM 使用权 |

**注意**：Web Search API（$5/千次）和 Answers API（$4/千次）独立计费，千万不要在同一请求中同时调用两者再合并结果，否则单次成本翻倍。

**重要变化**：2026年2月，Brave 取消了独立免费套餐（原5,000次/月），改为按量计费 + $5月度信用模式。

#### 核心优势

- 独立索引，结果不受 Google/Bing SEO 影响——在 Microsoft 于2025年8月停运 Bing Search API 后，Brave 是目前唯一拥有独立大规模网页索引的商业搜索 API
- Answers API 返回带引用的结构化回答，单价 $4/千次比 Search 还便宜
- 亚秒级延迟
- 零追踪、零数据留存，SOC 2 合规认证
- 最高每秒 50 个查询

#### 隐私敏感场景说明（Brave 的核心差异化价值）

- **健康管理**：查询内容直接关联个人健康状况，零追踪政策保护隐私
- **金融理财**：查询行为本身可能暴露商业意图，Brave 不记录用户身份和查询历史
- **AI Agent**：Agent 查询中可能包含内部项目代号等敏感信息，零数据留存使其成为隐私优先的理想后端

#### 核心劣势

- 绑卡后超额直接扣费，无硬上限（需代码层软上限保护）
- 返回标准搜索结果格式，非 LLM 原生优化
- 标注要求：产品内任意位置添加 "Search powered by Brave" 文字即可，无位置/大小要求

#### LarryAgent 适用性

作为 health/finance 角色的搜索工具非常合适。建议优先调用 Answers API（更便宜、更结构化），仅在 Answers 无结果时降级到 Web Search API。需在代码中加本地计数器做软上限保护。

---

### 3.3 Wolfram Alpha API

- **官网**：https://products.wolframalpha.com/api
- **定位**：计算知识引擎（非搜索引擎），可执行数学/物理/化学计算

#### 定价（2026年更新）

| 计划 | 月 API 调用量 | 价格 | 说明 |
|---|---|---|---|
| 免费（非商业） | 2,000 次/月 | 免费 | LarryAgent 个人项目符合 |
| Wolfram\|One Professional | 5,000 次/月 | $6~12/月 | 含桌面和云端访问 |

#### API 模式

- **LLM API**（`/v2/llm-api`）：返回结构化 JSON，专为 AI 消费优化——最适合 Agent 场景
- **Short Answers API**：返回简短文本答案，适合快速回答
- **Full Results API**：返回完整计算过程和可视化
- **Fast Query Recognizer API**：<10ms 快速分类查询是否可计算

#### 核心优势

- 能实际执行计算（解方程、求导、物理公式），而非返回文本搜索结果
- Fast Query Recognizer 可做前置校验，避免无效调用浪费额度
- 提供 MCP Server（`wolframalpha-llm-mcp`，GitHub 开源，39+ Stars）
- 覆盖数学、科学、技术、社会文化、日常生活等多个领域

#### 核心劣势

- 仅覆盖可计算的知识领域，不适合通用信息查询
- 自然语言输入识别准确率高度依赖格式，复杂公式可能返回"无法理解"但次数照扣
- 免费额度仅限非商业用途

#### LarryAgent 适用性

作为 math_physics 角色的核心计算工具。但需注意：不是所有数学物理问题都该走 Wolfram——查常数、查定义、查历史数据走 Tavily 更合适。建议在路由层增加意图分类（见工程实现章节）。

---

### 3.4 其他评估过的方案（未采纳）

| 方案 | 不采纳原因 | 最新状态 |
|---|---|---|
| Serper | 返回原始 SERP 数据，非 LLM 优化，需自行提取内容 | 基础版最高 2500 查询/天，$50/50K 积分 |
| Exa | 语义搜索，延迟 1-2 秒，适合找相似内容而非精确回答 | 已发布 Exa Deep，$7/1K 搜索 |
| Google Custom Search | 免费仅 100 次/天，国内访问受限 | 无变化 |
| Bing Web Search API | 微软已关闭 | 2025年8月停运 |
| Semantic Scholar | 学术论文搜索，日常数学讨论不需要搜论文 | 优先级低于 Wolfram |
| Firecrawl | 更强在网页抓取/清洗，非完整搜索引擎 | $16/月起，依赖 Serper 底层 |
| DDGS | 开源免费，可作为国内访问不稳定时的备用 | 支持 Brave/DuckDuckGo/Google 等多引擎 |

---

### 3.5 未来关注：AnySearch

2026 年 AI Agent 搜索领域值得关注的新兴方案：

- 专为 AI Agent 设计的全域智能搜索基础设施
- 原生支持 MCP 协议，REST API + Skill 插件两种接入
- 联邦多源深度检索：通用索引 + 20+ 类垂直领域自建深度索引
- 零遥测、无追踪，匿名访问通道无需注册
- 学生与开发者计划：每日 2,000 次免费搜索

**重要警告**：端到端延迟 47.8 秒，对实时对话场景几乎不可接受。若未来引入，仅作为后台异步深度研究（Deep Research）任务的专用引擎，不进入实时对话搜索链路。

---

## 四、架构设计

### 4.1 config.yaml 扩展

```yaml
web_search:
  providers:
    tavily:
      api_key: "tvly-xxx"
      base_url: "https://api.tavily.com"
    brave:
      api_key: "BSA-xxx"
      base_url: "https://api.search.brave.com"
    wolfram:
      api_key: "WA-xxx"
      base_url: "https://api.wolframalpha.com"
  routing:
    default: "tavily"
    code: "tavily"
    health: "brave"
    finance: "brave"
    math_physics: "wolfram"
  # 全局配置
  timeout:
    tavily: 10          # 秒
    brave: 10
    wolfram: 15         # 计算类延迟更高
  max_results: 5
  cache:
    enabled: true
    ttl_hours: 24       # 缓存有效期
    similarity_threshold: 0.85  # 语义缓存命中阈值
```

### 4.2 角色配置扩展

```yaml
roles:
  default:
    system_prompt: |
      ...
    search_provider: "tavily"
  math_physics:
    system_prompt: |
      你是 Larry 的数学物理助手。你可以使用计算工具求解公式、推导定理、分析物理问题。
    search_provider: "wolfram"
```

### 4.3 WebSearchTool 设计

新增 `tools/web_search.py`，继承 `BaseTool`：

```python
class WebSearchTool(BaseTool):
    name = "web_search"
    description = (
        "搜索互联网获取实时信息。支持通用搜索、健康理财信息查询、"
        "数学物理计算。provider=auto 时根据当前角色和查询意图自动路由。"
    )
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "搜索关键词或问题"
            },
            "provider": {
                "type": "string",
                "enum": ["tavily", "brave", "wolfram", "auto"],
                "description": "搜索引擎选择。auto 表示自动路由"
            },
            "depth": {
                "type": "string",
                "enum": ["basic", "advanced"],
                "description": "搜索深度，仅 Tavily 生效"
            }
        },
        "required": ["query"]
    }
```

**执行流程**：

1. 缓存检查：先查语义缓存（ChromaDB 向量匹配）→ 再查精确缓存（query+provider 完全匹配）
2. 若 `provider == "auto"`，根据当前 role 查 `web_search.routing` 映射确定实际 provider
3. math_physics 场景特殊处理：用 Wolfram Fast Query Recognizer（<10ms）预判断，若不可计算则 fallback 到 Tavily
4. 根据 provider 分发到对应搜索逻辑：
   - **tavily**：POST `/search`，返回 AI 优化文本+引用
   - **brave**：优先 Answers API（$4/千次），无结果时降级 Web Search API（$5/千次）
   - **wolfram**：先做自然语言→Wolfram 语法预处理，再调 LLM API
5. 结果写入缓存，统一返回 `ToolResult`

**Wolfram 自然语言预处理**：

复杂公式的自然语言输入识别率不稳定（"x的平方从0到1的积分"可能返回"无法理解"但次数照扣）。建议增加一层本地预处理：

- 简单方案：正则匹配常见数学模式，转换为 Wolfram 语法（`D[...]`、`Integrate[...]`、`Solve[...]`）
- 进阶方案：用轻量 LLM 调用做自然语言→Wolfram 语法转换
- 保底方案：调用 Fast Query Recognizer API（<10ms）前置校验，不可计算则跳过

### 4.4 降级策略

- 搜索 API 调用失败 → `ToolResult(success=False, error="搜索服务暂时不可用")`，不阻塞对话
- 单个 provider 不可用 → fallback 到 default provider（tavily）
- Wolfram 不可用或查询不可计算 → fallback 到 tavily 做文本搜索
- 每个 provider 独立超时（httpx.AsyncClient），超时后立即降级

### 4.5 流式状态反馈

搜索耗时较长（Tavily 1-2s，Wolfram 可能更久），为避免用户以为 Agent 卡死，在 WebSearchTool 执行时通过 SSE 推送状态事件：

```json
{"type": "tool_status", "status": "searching", "provider": "brave", "query": "..."}
{"type": "tool_status", "status": "computing", "provider": "wolfram", "hint": "正在计算..."}
```

---

## 五、工程实现要点（DeepSeek 实战建议）

### 5.1 缓存策略（成本控制的命脉）

个人 Agent 在调试和频繁使用中，重复提问很容易耗尽免费额度。两层缓存：

- **语义缓存**：利用现有 ChromaDB，对查询做向量相似度匹配，命中高相似历史问题且 TTL 内（默认24h）直接返回，不调 API。实测可减少 40%~60% 实际 API 调用
- **精确缓存**：完全相同的 query+provider 组合直接读内存字典或 SQLite

### 5.2 Brave 计费陷阱

Web Search API（$5/千次）和 Answers API（$4/千次）独立计费。health/finance 角色应优先调 Answers API（更便宜、更结构化），仅在无结果时降级到 Web Search。**不要在同一请求中同时调用两者再合并结果**。

### 5.3 Wolfram 额度保护

Fast Query Recognizer API（<10ms）做前置校验，判断"不可计算"则跳过 Wolfram 调用，用 Tavily 文本搜索兜底。守住免费额度不被无效请求浪费。

### 5.4 异步非阻塞

所有 Provider 的 HTTP 请求必须使用 `httpx.AsyncClient` + `asyncio`，不可用同步 requests 库（会阻塞 FastAPI 事件循环）。每个 Provider 独立超时设置。

### 5.5 math_physics 路由不应一刀切

不是所有数学物理问题都需要计算。查常数、查定义、查历史实验数据走 Tavily 更合适。建议在 `provider=auto` 时，由 LLM 通过额外字段辅助判断意图：

- 包含"计算/求解/推导/证明"→ Wolfram
- 包含"是什么/定义/常数/历史/谁发现"→ Tavily

---

## 六、成本预估

| Provider | 月免费额度 | 单价 | 个人使用月预算 |
|---|---|---|---|
| Tavily | 1,000 credits | $0.008/credit（超量） | 日常问答 1,000 次内免费 |
| Brave | ~1,000 次（$5 信用） | $4-5/千次 | 健康理财低频使用，信用内覆盖 |
| Wolfram | 2,000 次 | 免费（非商业） | 数学物理低频使用，额度内覆盖 |

三个 provider 免费额度合计约 4,000 次/月。加上语义缓存（预计减少 40-60% 调用），实际可用量等效 7,000-10,000 次/月。正常情况下月成本 $0。

---

## 七、测试覆盖

- 各 provider 正常返回结果的单元测试（mock HTTP 响应）
- provider 路由逻辑测试：不同 role 映射到正确 provider
- math_physics 意图分类测试：计算类走 Wolfram，查询类走 Tavily
- 降级测试：provider 超时/报错时不崩溃，fallback 正确
- 缓存命中测试：相同查询不重复调用 API
- Brave 计费分离测试：确认 Answers 和 Search 不会同时触发
- Wolfram 预处理测试：自然语言正确转换为 Wolfram 语法
- config 解析测试：新增配置段正确加载

---

## 八、注意事项清单

1. **Brave 标注**：产品内任意位置添加 "Search powered by Brave" 文字即可
2. **Brave 绑卡风险**：超额后信用卡直接扣费无硬上限，必须加本地计数器做软上限
3. **Wolfram 非商业限制**：免费额度仅限非商业用途，个人项目符合
4. **国内访问**：Tavily 和 Brave 为海外服务，需测试延迟；备用方案 DDGS（开源免费多引擎）
5. **新增 math_physics 角色**：需在 config.yaml 的 roles 段新增
6. **异步必须**：httpx.AsyncClient，不能用同步 requests
7. **Brave Answers 优先**：health/finance 角色优先 Answers API，降级 Web Search
8. **Wolfram 预处理**：自然语言→Wolfram 语法转换层，防止无效调用浪费额度
9. **语义缓存**：利用现有 ChromaDB 基础设施，TTL 24h，减少 40-60% API 调用
10. **AnySearch 延迟警告**：47.8s 端到端延迟，仅用于后台异步深度研究，不进实时对话链路

---

## 九、附录：MCP 集成参考

| Provider | MCP Server | 安装方式 | 备注 |
|---|---|---|---|
| Tavily | `@tavily/tavily-mcp` | `npx -y @tavily/tavily-mcp` | 官方维护 |
| Brave | `@modelcontextprotocol/server-brave-search` | `npx -y @modelcontextprotocol/server-brave-search` | 官方维护 |
| Wolfram | `wolframalpha-llm-mcp` | `git clone` + `npm install` | 社区开源 |
| AnySearch | `@anysearch/mcp-server` | `npx -y @anysearch/mcp-server` | 官方维护 |

---

## 十、增补 · 2026-10-19：DeepSeek Search/Fetch API 实测记录（月月/ZCode）

> **状态**：讨论稿冻结期间的成果顺手留档。本节是实测记录＋一家之言，**未并入上方选型结论**；解冻后汇总归主持人千千裁。
> 背景：本稿定稿于 08-29，当时 DeepSeek 搜索服务尚不存在（3.4 未采纳清单里也没有它）——它是 **08-29 之后新出现的候选**，故在此补记。§3.4 可留意。

### 10.1 事件与接口

- **2026-10-16 DeepSeek 官宣 Search/Fetch API 上线**（自研搜索引擎，宣称千亿级网页索引，多语言）。
- **独立原生 JSON 接口**（非 chat `tools` 字段）：
  - `POST https://api.deepseek.com/v1/tools/search`：字段 `query` / `count` / `need_content`；`after:YYYY-MM-DD` 运算符实测生效，**`site:` 不支持**（返回 0 结果）。
  - `POST https://api.deepseek.com/v1/tools/fetch`：字段 `url`，返回 `{content, title}`。
- **key 与 chat 共用（账户身份、无 scope 细分）**——泄露面＝全产品线，这与本文档其他 provider「独立 key 独立额度」的风险模型不同。

### 10.2 计费

| 项 | 值 |
|---|---|
| 单价 | **$0.75/千次成功请求**（按次不按 token） |
| 限速 | search/fetch 各 5 QPS，超限 429 |
| 免费额度 | 无（纯按量），但单价低于 Tavily 超量（$8/千）与 Brave（$4-5/千）之间偏下 |
| 注意 | 2026-11-01 00:00（北京）起，经 DeepSeek Harness 等服务端工具调用**同价计费** |

### 10.3 实测数据（10-17 初测 ＋ 10-19 复验，临时 key）

- **速度**：search 亚秒级（实测 0.27–0.41s，六连发无波动）；fetch ~3.2s（含抓远端页面）。
- **新鲜度**：索引 ≤3 天——`after:2026-10-10` 可搜到 10-16 发布页面；俄语查询命中**测试当天（10-19）**发布的 Mail.ru 国防部简报。
- **返回字段**：`title / site_name / site_icon / authority / rerank_score / date / url / summary`，`need_content=true` 直附全文 content（省一次 fetch）——对 LLM 消费比 Brave 的标准 SERP 友好。
- **多语种（EN/RU/UK/FR/DE 各 5 发全绿）**：信源不止英美大媒——乌克兰本地媒（Ukrinform/UNN/LB.ua/Українська правда/24 Канал/Espreso.tv）、俄地区媒（URA.RU）、德公共媒（Deutschlandfunk/ZDF/BR）、北欧 SVT、比卢 RTL；同一事件（泽连斯基秋季战果声明）在 EN/RU/UK 三语种各自独立命中，天然多源交叉印证。军事冲突类查询**无内容过滤迹象**。

### 10.4 短板（实测实锤）

1. **社媒弱**：Reddit 原生帖搜不到；但 Fediverse/论坛可达（feddit.org、lemmy.eco.br、arrse.co.uk）。社媒监听面仍需 Brave 或专门工具。
2. **`site:` 运算符不支持**。
3. **跨语种混入**：FR/DE 主题查询会混入日语/韩语结果（rerank 主题权重 > 语言精确）。
4. **垃圾长尾**：duckduckgo.com 结果页 URL 被当普通网页返回过一次。

### 10.5 工程坑（调用侧必读）

- **401 回显 key 尾巴**（千千 T4 发现，月月复现补记）：上游 401 的 message 形如 `Your api key: ****-xxxx is invalid`，xxxx＝**请求所发 key 的末 4 位**——真 key 失效（关停/轮换）时该尾巴会随错误响应进日志/对话。处置：响应体进对话前消毒（key 末 4 替换为 `****`）；401＝停火提醒老大，不贴原始 message。
- **python `open()` 默认 GBK（Windows）**：读 key 文件、落盘响应、含中文 query 的 body 一律 `open(path, encoding='utf-8')`——否则中文 JSON 乱码或 UnicodeEncodeError（月月全部验证脚本带此参数才没炸；千千收件区已同步，其脚本为 python）。
- **python requests/httpx 不读 Windows 系统代理**：挂代理须显式 `proxies={'https':'http://127.0.0.1:7890'}`；但见 §10.8——api.deepseek.com 直连可达，直连最省心。
- **key 不进脚本源码**：脚本/skills 若被 git 或同步机制带走，源码里的 key 跟着走——脚本只留路径，key 从独立文件读。

- **非 ASCII query 不能内联**：curl `-d '中文/西里尔/重音…'` 直接 400 invalid unicode——JSON body 落盘（UTF-8）后 `--data-binary @file`。
- **fetch 正文带转义**：content 里 Markdown 特殊字符被插反斜杠（`\-`、`\:`，MarkdownV2 风格），消费前需 unescape。
- Git Bash 终端把 UTF-8 显示成 GBK 乱码是**显示层假象**，数据层完好，别重抓。

- **千千补两条（2026-10-19 · 我侧首跑 4 发实测 · 一家之言，待汇总）**：
  - 转义字符不止上面两例：fetch example.com 首跑抓到 `\;`（分号；原文 `service;` 被编成 `service\;`）⇒ unescape 的字符类建议按 **MarkdownV2 全集**写，⛔ 只照两例抄。我的 `deepseek-search-fetch` 已扩全集并本地单测 6 例（含「字面反斜杠不碰」）；月月那侧若也照两例写，建议同扩。
  - search 响应外层＝顶层 dict、条目在 **`results`** 键下（⛔ 非裸数组、也⛔ 非 `data`）；fetch 外层即 §10.1 的 `{content, title}` 平铺。解析侧别假设别的形状。

### 10.6 对选型的初步看法（一家之言，待汇总）

- DeepSeek 搜索可考虑作为**新增 provider 候选**评估：字段与新鲜度优于 Brave，多语种新闻情报面强；劣势是无免费层（Tavily 有 1,000/月）、key 无 scope 隔离、社媒弱。
- 若引入，routing 上适合接**通用/新闻/多语种**场景；health/finance 的隐私诉求（零追踪）仍指向 Brave，DeepSeek 的数据留存政策本文未调研，**引入前需补这一面**。

### 10.7 可复现命令（key 用 `<KEY>` 占位）

```bash
# search（中文/小语种一律走文件体）
curl -x http://127.0.0.1:7890 -X POST https://api.deepseek.com/v1/tools/search \
  -H "Authorization: Bearer <KEY>" -H "Content-Type: application/json" \
  --data-binary @query.json   # {"query":"… after:2026-10-12","count":5,"need_content":true}
# fetch
curl -x http://127.0.0.1:7890 -X POST https://api.deepseek.com/v1/tools/fetch \
  -H "Authorization: Bearer <KEY>" -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### 10.8 配装实录（月月实践 · 2026-10-19 晚）——AI 岗位级搜索枪，与本稿 §四 平行的形态

- **形态**：AI 岗位自配搜索枪 ＝ ①**用户级技能**（开火/收枪判据＋调用模板＋坑清单＋key 铁律，任何工作区可触发）＋ ②**本地 key 文件**（用户目录、不入任何 git，**老大手填**）。与本稿 §四 的 backend WebSearchTool 是平行形态：backend 走 config.yaml＋服务端路由，AI 岗位走 harness 技能＋本地 key，**共用同一上游接口**——讨论稿选型结论对两者同样适用。
- **key 制度**：**专用 key**（爆炸半径隔离：search 出事不连坐 chat；独立账单可对账）＋ **老大手填**（授权链闭环，AI 不经手值）＋ **key 不经手铁律**（取用＝变量注入＋与 curl 同一条命令，永不回显；响应体进对话前按 §10.5 消毒）。
- **网络策略**：**api.deepseek.com 国内直连可达（实测 200/0.3s）**——直连优先，代理 `127.0.0.1:7890` 备胎。§八 注意事项 4「海外服务需测延迟」对 DeepSeek 不成立（国内服务商）。
- **临时 key 纪律**：测试/过渡 key 快用快关。本次实战（临时 key）：三次实测＋深查＋验收共 14 发成功请求 ≈ $0.01，全程闭环退役。
- **Brave 处置**：老大 2026-10-19 裁「打算关停」（DS 效果更好）⇒ §二选型与 §六成本预估中 Brave 面待解冻汇总时正式修订；§3.2 的隐私差异化价值（health/finance 零追踪）若真关停需另行评估，结论暂留档。
- **验收**：专用 key 直连试调 🟢 200 / 0.45s / 3 结果（首搜即命中 DeepSeek 自家搜索 API 上线报道，中英信源混合）。

```bash
# search（中文/小语种一律走文件体）
curl -x http://127.0.0.1:7890 -X POST https://api.deepseek.com/v1/tools/search \
  -H "Authorization: Bearer <KEY>" -H "Content-Type: application/json" \
  --data-binary @query.json   # {"query":"… after:2026-10-12","count":5,"need_content":true}
# fetch
curl -x http://127.0.0.1:7890 -X POST https://api.deepseek.com/v1/tools/fetch \
  -H "Authorization: Bearer <KEY>" -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

*—— 月月（ZCode）2026-10-19，临时 key 已用毕待老大关闭；完整实测过程与坑清单另存于月月记忆档案。*

---

*文档生成时间：2026-08-29*
*综合来源：QoderWork 原始选型、通义千问定价与生态调研、DeepSeek 工程实现建议*
