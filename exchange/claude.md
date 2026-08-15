# Claude 协作区

## 当前任务

### P3.2 - LLM 重试测试（Claude 实现）

**前置：** 等 Trae 完成实现并 commit 后再开始。

---

#### 1. 测试文件

新建 `backend/tests/test_llm_retry.py`

---

#### 2. 强制测试用例（5 项）

**用例 1：可重试异常触发重试**
- Mock `AsyncOpenAI.chat.completions.create`：前 2 次抛 `openai.RateLimitError`，第 3 次返回正常响应
- `config.llm.max_retries=3`
- 断言：`create` 被调用 3 次，最终返回正常 `LLMResponse`

**用例 2：不可重试异常不触发重试**
- Mock `create`：直接抛 `openai.AuthenticationError`
- 断言：`create` 只被调用 1 次，异常直接抛出

**用例 3：重试耗尽后抛原始异常**
- Mock `create`：始终抛 `openai.InternalServerError`
- `config.llm.max_retries=2`
- 断言：`create` 被调用 3 次（首次 + 2 次重试），最终抛出 `InternalServerError`

**用例 4：max_retries=0 不重试**
- `config.llm.max_retries=0`
- Mock `create`：抛 `openai.APIConnectionError`
- 断言：`create` 只被调用 1 次，异常直接抛出

**用例 5：流式调用重试覆盖 create 阶段**
- Mock `create`（stream=True）：前 1 次抛 `openai.APITimeoutError`，第 2 次返回 mock stream
- `config.llm.max_retries=3`
- 断言：`create` 被调用 2 次，`chat_completion_stream_events` 正常 yield delta + finish 事件

---

#### 3. Mock 注意事项

- 用 `unittest.mock.AsyncMock` 或 `unittest.mock.patch` 替换 `_get_client` 返回的 client
- `openai` 异常的构造方式：
  - `openai.RateLimitError`：需要 `response` 参数，建议用 `openai.RateLimitError(message="test", response=httpx.Response(429), body=None)`
  - `openai.InternalServerError`：`openai.InternalServerError(message="test", response=httpx.Response(500), body=None)`
  - `openai.APIConnectionError`：`openai.APIConnectionError(request=httpx.Request("POST", "https://api.test.com"))`
  - `openai.APITimeoutError`：`openai.APITimeoutError(request=httpx.Request("POST", "https://api.test.com"))`
  - `openai.AuthenticationError`：`openai.AuthenticationError(message="test", response=httpx.Response(401), body=None)`
- 如果某些异常构造过于复杂，用 `unittest.mock.patch` 直接 mock `create` 的 side_effect 更简单
- **重试间隔**：测试中用 `tenacity` 的 `wait` 参数设为 0 或 mock 掉 `asyncio.sleep`，避免测试变慢

---

#### 4. 回归测试

- `test_chat_service.py`（16 项）全通过——确认重试机制不影响正常聊天流程
- `test_auth_middleware.py`（7 项）全通过
- `test_exceptions.py`（9 项）全通过

---

#### 5. 提交

完成后 commit，message: `test(P3.2): LLM 重试机制测试（5 项强制 + 回归）`
