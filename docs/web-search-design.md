# LarryAgent Web Search 技术选型与设计规格（综合版）

> 本文档综合三方 AI 调研成果：QoderWork（原始选型）、通义千问（定价与生态补充）、DeepSeek（工程实现建议）。
> 生成日期：2026-08-29

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

*文档生成时间：2026-08-29*
*综合来源：QoderWork 原始选型、通义千问定价与生态调研、DeepSeek 工程实现建议*
