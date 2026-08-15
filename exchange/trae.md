# Trae 协作区

## 当前任务

### P3.2 - LLM 重试（Trae 实现）

**目标：** 引入 `tenacity`，为 LLM 调用增加指数退避重试机制。

---

#### 1. 依赖

- `requirements.txt` 新增 `tenacity>=8.2.0`
- 运行环境需 `pip install tenacity`

---

#### 2. 重试策略设计

在 `models/llm.py` 中新增一个重试装饰器/包装函数，应用于以下两个函数的**实际 API 调用段**：

- `chat_completion`（非流式）
- `chat_completion_stream_events`（全程流式）

**触发重试的异常类型（OpenAI SDK）：**

| 异常 | 重试 | 说明 |
|---|---|---|
| `openai.APITimeoutError` | ✅ | 请求超时 |
| `openai.APIConnectionError` | ✅ | 网络连接失败 |
| `openai.RateLimitError` | ✅ | 429，尊重 Retry-After header（SDK 已内置等待） |
| `openai.InternalServerError` | ✅ | 5xx 服务端错误 |
| `openai.APIStatusError` (其他) | ❌ | 4xx 参数错误等，重试无用 |
| `openai.AuthenticationError` | ❌ | 401 key 错误，不是重试能解决的 |
| 其他 `Exception` | ❌ | 不重试，直接 raise |

**重试参数（从 config 读取）：**

- `max_retries`：最大重试次数（默认 3，含首次调用共 4 次）
- `retry_backoff_base`：指数退避基数（默认 1.0s，等待 = base × 2^(attempt-1)，即 1s/2s/4s）

---

#### 3. 实现要点

**推荐方式：** 用 `tenacity` 的 `AsyncRetrying` + 自定义 `retry_if_exception_type`，而非 `@retry` 装饰器——因为需要从 config 动态读取参数（`@retry` 的参数是静态的）。

**示例结构（供参考，不是硬性要求逐行照抄）：**

```python
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

def _get_retry_config():
    """从 config 读取重试参数。"""
    cfg = get_config()
    return cfg.llm.max_retries, cfg.llm.retry_backoff_base

# 可重试的异常类型
_RETRYABLE_EXCEPTIONS = (
    openai.APITimeoutError,
    openai.APIConnectionError,
    openai.RateLimitError,
    openai.InternalServerError,
)

async def _call_with_retry(func, *args, **kwargs):
    """带重试的异步调用包装。"""
    max_retries, backoff_base = _get_retry_config()
    async for attempt in AsyncRetrying(
        stop=stop_after_attempt(max_retries + 1),  # +1 因为首次不算 retry
        wait=wait_exponential(multiplier=backoff_base, min=backoff_base, max=backoff_base * 2**max_retries),
        retry=retry_if_exception_type(_RETRYABLE_EXCEPTIONS),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,  # 重试耗尽后抛原始异常
    ):
        with attempt:
            return await func(*args, **kwargs)
```

**关键注意事项：**

1. **流式调用的重试边界**：`chat_completion_stream_events` 中，`await client.chat.completions.create(**kwargs)` 返回的是 stream 对象，真正的 API 请求在 `async for chunk in stream` 时才发生。重试应包裹**整个 `create + iterate` 过程**，而不是只包裹 `create`。如果流已经开始 yield delta 事件（已经向上层推送了文字），此时再失败就不应重试（因为用户已经看到部分输出了）。所以重试只应在**首次进入流循环之前**生效——如果 `create` 本身抛异常，重试；如果流迭代中抛异常，直接 raise（流已部分消费）。

2. **日志格式**：每次重试记录日志，格式为：
   ```
   batch_llm_call retry attempt=2/3 error=RateLimitError wait=2.0s
   ```
   `before_sleep_log` 可以自动记日志，但格式不一定是上面这个。如果不方便用 `before_sleep_log`，可以用 `before_sleep` 自定义回调。

3. **`chat_completion_stream`（兼容旧接口）**：不需要单独加重试，它内部调 `chat_completion_stream_events`，重试已包含在内。

4. **`chat_completion`（非流式）**：重试包裹 `await client.chat.completions.create(**kwargs)` 这一行即可（整个调用是原子的）。

---

#### 4. chat_completion 改造

当前 `chat_completion` 的 try/except 块保持不变（它 catch `Exception` 记日志后 re-raise），在 `response = await client.chat.completions.create(**kwargs)` 处套重试包装。

改造后：
```python
response = await _call_with_retry(
    client.chat.completions.create, **kwargs
)
```

---

#### 5. chat_completion_stream_events 改造

这是关键。当前代码：
```python
stream = await client.chat.completions.create(**kwargs)  # 这行创建 stream
# ... 
async for chunk in stream:  # 这行才真正发请求
```

**重试策略**：包裹 `create + 首次成功进入迭代`。如果 `create` 抛异常 → 重试。如果已经成功拿到 stream 并开始 yield delta → 后续异常不重试。

一种实现方式：
```python
async def _create_and_start_stream(client, kwargs):
    """创建 stream 并获取第一个 chunk，失败可重试。"""
    stream = await client.chat.completions.create(**kwargs)
    return stream

# 在 chat_completion_stream_events 中：
stream = await _call_with_retry(_create_and_start_stream, client, kwargs)
# 之后正常 async for chunk in stream，不再重试
```

注意：实际上 `await client.chat.completions.create(**kwargs)` 在 stream=True 时只是创建 stream 对象，第一个 chunk 的获取（即真正的 HTTP 请求）发生在 `async for` 的第一次迭代。所以如果想让重试覆盖"首个 chunk 获取失败"，需要把重试包裹到能拿到第一个 chunk 的地方。但这样做会让代码复杂很多（需要缓存第一个 chunk）。

**简化方案（推荐）**：只在 `create` 调用处重试（即 `await client.chat.completions.create(**kwargs)` 这一行）。如果 create 成功但流迭代中失败，不重试，直接 raise。理由：
- create 失败通常是连接/超时/429，值得重试
- 流迭代中失败通常是中途网络断开，重试整个流代价高且用户已看到部分输出
- 实现简单，风险低

---

#### 6. config.yaml / config.example.yaml

已存在 `llm.max_retries` 和 `llm.retry_backoff_base`，无需新增字段。但检查注释是否准确：
- `config.example.yaml` 第 113 行注释写"失败重试次数（网络错误 / 429 / 5xx），4xx 不重试"——准确，无需改
- `config.yaml` 无注释，保持原样即可

---

#### 7. 验收标准

- [ ] `requirements.txt` 含 `tenacity>=8.2.0`
- [ ] `models/llm.py` 新增重试逻辑，覆盖 `chat_completion` 和 `chat_completion_stream_events`
- [ ] 可重试异常：`APITimeoutError` / `APIConnectionError` / `RateLimitError` / `InternalServerError`
- [ ] 不可重试：4xx `APIStatusError` / `AuthenticationError` / 其他
- [ ] 重试参数从 config 读取（`max_retries` + `retry_backoff_base`）
- [ ] 每次重试有日志（含 attempt 次数 + 异常类型 + 等待时间）
- [ ] `max_retries=0` 时不重试（直接抛）
- [ ] 完成后 commit，message: `feat(P3.2): LLM 重试机制（tenacity 指数退避）`

---

#### 提交后

commit 后在 exchange/trae.md 更新状态，Claude 拉取最新代码开始测试。

---

## P3.2 交付总结（2026-08-15 Trae）

**commit:** `753160e` — `feat(P3.2): LLM 重试机制（tenacity 指数退避）`

### 实现清单（对照验收标准逐项勾选）

- [x] `requirements.txt` 新增 `tenacity>=8.2.0`（环境已有 9.1.4）
- [x] `models/llm.py` 新增重试逻辑，覆盖 `chat_completion`（[line 359](file:///d:/Code/LarryAgent/backend/models/llm.py#L359)）和 `chat_completion_stream_events`（[line 476](file:///d:/Code/LarryAgent/backend/models/llm.py#L476)）
- [x] 可重试异常：`APITimeoutError` / `APIConnectionError` / `RateLimitError` / `InternalServerError`（[line 153-158](file:///d:/Code/LarryAgent/backend/models/llm.py#L153-L158)）
- [x] 不可重试：4xx `APIStatusError` / `AuthenticationError` / 其他（不在 `_RETRYABLE_EXCEPTIONS` 中即不重试）
- [x] 重试参数从 config 读取：`max_retries` + `retry_backoff_base`（[line 200-202](file:///d:/Code/LarryAgent/backend/models/llm.py#L200-L202)）
- [x] 每次重试有日志：`batch_llm_call retry attempt=N/M error=XxxError wait=X.XXs`（[line 176-182](file:///d:/Code/LarryAgent/backend/models/llm.py#L176-L182)）
- [x] `max_retries=0` 时跳过 tenacity 直接调用（[line 204-206](file:///d:/Code/LarryAgent/backend/models/llm.py#L204-L206)）
- [x] commit message 完全匹配规格

### 设计决策

1. **采用规格推荐的简化方案**：流式调用只在 `create` 处重试，流迭代中失败不重试。理由如规格所述（用户已看到部分输出 + 重试代价高 + 实现简单）。代码中用 WHY 注释说明决策。
2. **日志用 `functools.partial` 绑定 `total_attempts`**：tenacity 的 `before_sleep` 回调签名只接 `state`，但日志格式需要"当前/总数"两个数。用 `partial(_log_retry, total_attempts=total_attempts)` 把总数绑定进闭包，避免每次重试都读 config。
3. **`reraise=True`**：重试耗尽后抛原始异常，不包装成 `RetryError`，上层 catch 不变。

### 验证

- **行为单测 3 项**（临时脚本，不入库）：
  - max_retries=0 → 直接调用 1 次 ✅
  - 可重试异常 RateLimitError + max_retries=2 → 调用 3 次（1+2 retries）✅，日志输出 `attempt=1/3 error=RateLimitError wait=0.01s` / `attempt=2/3 ...`
  - 不可重试异常 ValueError → 调用 1 次直接抛 ✅
- **现有测试回归**：`test_chat_service.py` 16 + `test_auth_middleware.py` 7 = **23 项全通过**（mock 路径不触发重试）
- **import 自检**：`from models.llm import _call_with_retry, _RETRYABLE_EXCEPTIONS` OK，`_RETRYABLE_EXCEPTIONS` 内容正确

### 已知限制（未做，留给 Claude 测试时考虑）

- 未为重试机制写专门的单元测试文件（如 `test_llm_retry.py`）。规格未要求，但 Claude 测试时可能想覆盖"真实抛可重试异常时确实重试了 N 次"。如果 Claude 需要此类测试，可以参考我临时验证脚本的写法（patch `get_config` + 抛 `openai.RateLimitError`）。
- `wait_exponential` 的 max 上限设为 `backoff_base * (2 ** max_retries)`，即 max_retries=3 时上限 8s。如果用户觉得退避太久，调小 `retry_backoff_base` 即可。

