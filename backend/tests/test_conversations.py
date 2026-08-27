"""
P4.3 会话管理 API 测试（规范版）

职责：
- 验证 GET/POST/PATCH/DELETE /api/conversations 全套 CRUD
- 验证列表排序（updated_at DESC + id DESC 二级键）与 limit 参数
- 验证删除会话 → messages 级联删除（PRAGMA foreign_keys=ON 实际生效，
  用独立连接直接查 messages 表证明行已消失，而非只看 API 返回码）
- 验证 GET /api/conversations/{id}/messages 完整历史（含 tool 消息）
- 验证 chat 续接：不存在会话 → 404（流式/非流式都必须是 JSON 404 而非空 200）；
  存在会话 → 续接不新建会话
- 验证新会话标题 = 首条用户消息前 20 字符
- 验证 GET /api/models

安全约束（WorkBuddy 硬性原则）：
- 全程使用临时 DB（临时 yaml + 独立 db 文件），不触碰真实 data/larry.db
- 测试数据留在临时库内，随 pytest tmp 目录自动清理，无需 DELETE 清理 fixture

与其他模块的关系：
- 依赖 main.py 真实 app + 全局异常 handler + conversations 路由
- 依赖 db/conversations.py 的 CRUD 与 FK 级联语义
- 不依赖 LLM / ChromaDB（流式事件与长期记忆均 mock）
"""

import asyncio
import time
from pathlib import Path

import aiosqlite
import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Fixtures：临时 DB 环境（安全硬约束）
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def temp_db(session_db_path):
    """
    返回会话级临时 DB 文件路径（由 conftest.py 提供，LARRY_CONFIG 指向会话级临时 yaml）。

    额外职责：把 db.database._db 置 None 丢弃旧连接引用——session 中其他测试文件
    可能留下绑定在已结束事件循环上的连接，弃用后由本模块 TestClient 的 lifespan
    在自身事件循环内用临时配置重建新连接。
    """
    import db.database as db_module

    db_module._db = None
    yield Path(session_db_path)
    db_module._db = None


@pytest.fixture(scope="module")
def client(temp_db):
    """
    真实 main.app 的 TestClient（模块级，lifespan 启动时用临时配置初始化 DB）。

    进入 with 块触发 lifespan startup（get_db → 临时库），退出触发 shutdown
    （close_db 在 TestClient 自己的事件循环内执行，无跨循环问题）。
    """
    from main import app

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def mock_llm(monkeypatch):
    """
    mock chat_service 命名空间内的 LLM 与长期记忆依赖：
    - chat_completion_stream_events → 固定输出一段 delta + finish
    - get_long_term_memory → 空列表（跳过 embedding + ChromaDB）
    返回收到的 messages 快照容器，供断言"续接会话时带历史"。
    """
    from services import chat_service

    captured = {}

    async def _fake_stream_events(**kwargs):
        captured["messages"] = kwargs.get("messages")
        yield {"type": "delta", "content": "reply text"}
        yield {
            "type": "finish",
            "finish_reason": "stop",
            "tool_calls": [],
            "usage": {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3},
        }

    async def _no_long_term(query, **kwargs):
        return []

    monkeypatch.setattr(chat_service, "chat_completion_stream_events", _fake_stream_events)
    monkeypatch.setattr(chat_service, "get_long_term_memory", _no_long_term)
    return captured


# ---------------------------------------------------------------------------
# P4.3-1 列表 + 创建
# ---------------------------------------------------------------------------

class TestConversationListAndCreate:
    """GET /api/conversations + POST /api/conversations"""

    def test_create_empty_title(self, client):
        """POST 空 body → title=""，返回 {id, title}。"""
        res = client.post("/api/conversations", json={})
        assert res.status_code == 200
        body = res.json()
        assert isinstance(body["id"], int)
        assert body["title"] == ""

    def test_create_with_title(self, client):
        """POST 指定 title → 原样返回并可在列表中找到。"""
        res = client.post("/api/conversations", json={"title": "测试会话A"})
        assert res.status_code == 200
        cid = res.json()["id"]
        convs = client.get("/api/conversations").json()
        found = next(c for c in convs if c["id"] == cid)
        assert found["title"] == "测试会话A"

    def test_list_order_updated_desc(self, client):
        """
        列表按 updated_at DESC, id DESC 排序。
        updated_at 为秒级精度，用 sleep(1.1) 跨秒保证时间戳可区分。
        """
        c1 = client.post("/api/conversations", json={"title": "先创建"}).json()["id"]
        time.sleep(1.1)
        c2 = client.post("/api/conversations", json={"title": "后创建"}).json()["id"]

        ids = [c["id"] for c in client.get("/api/conversations").json()]
        assert ids.index(c2) < ids.index(c1), "后创建的应排在前面"

        # 重命名 c1 后（updated_at 刷新），c1 应排到第一
        time.sleep(1.1)
        client.patch(f"/api/conversations/{c1}", json={"title": "重命名"})
        ids2 = [c["id"] for c in client.get("/api/conversations").json()]
        assert ids2[0] == c1, "刚修改过的会话应排在列表第一位"

    def test_list_limit(self, client):
        """limit 参数生效：limit=2 只返回 2 条。"""
        for i in range(3):
            client.post("/api/conversations", json={"title": f"limit测试{i}"})
        res = client.get("/api/conversations?limit=2")
        assert res.status_code == 200
        assert len(res.json()) == 2


# ---------------------------------------------------------------------------
# P4.3-2 重命名 + 删除
# ---------------------------------------------------------------------------

class TestConversationPatchAndDelete:
    """PATCH /api/conversations/{id} + DELETE /api/conversations/{id}"""

    def test_patch_rename(self, client):
        """重命名生效，返回 {id, title}。"""
        cid = client.post("/api/conversations", json={"title": "原名"}).json()["id"]
        res = client.patch(f"/api/conversations/{cid}", json={"title": "新名"})
        assert res.status_code == 200
        assert res.json() == {"id": cid, "title": "新名"}
        found = next(c for c in client.get("/api/conversations").json() if c["id"] == cid)
        assert found["title"] == "新名"

    def test_patch_empty_title(self, client):
        """空标题合法（前端显示"新会话"占位）。"""
        cid = client.post("/api/conversations", json={"title": "有标题"}).json()["id"]
        res = client.patch(f"/api/conversations/{cid}", json={"title": ""})
        assert res.status_code == 200
        assert res.json()["title"] == ""

    def test_patch_not_found_404(self, client):
        res = client.patch("/api/conversations/999999", json={"title": "x"})
        assert res.status_code == 404
        body = res.json()
        assert body["error"] == "NOT_FOUND"
        assert "Conversation not found" in body["detail"]

    def test_delete_ok(self, client):
        cid = client.post("/api/conversations", json={"title": "待删"}).json()["id"]
        res = client.delete(f"/api/conversations/{cid}")
        assert res.status_code == 200
        assert res.json() == {"ok": True}
        convs = client.get("/api/conversations").json()
        assert not any(c["id"] == cid for c in convs)

    def test_delete_not_found_404(self, client):
        res = client.delete("/api/conversations/999999")
        assert res.status_code == 404
        assert res.json()["error"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# P4.3-3 消息历史 + 级联删除（PRAGMA foreign_keys=ON 实证）
# ---------------------------------------------------------------------------

class TestMessagesAndCascade:
    """GET /{id}/messages + 软删/硬删语义（2026-08-27 归档系统变更）。"""

    def _db_count(self, db_file, sql, params):
        """用独立 aiosqlite 连接执行查询（避免跨事件循环复用全局单例连接）。"""

        async def _run():
            conn = await aiosqlite.connect(str(db_file))
            try:
                cursor = await conn.execute(sql, params)
                row = await cursor.fetchone()
                return row[0]
            finally:
                await conn.close()

        return asyncio.run(_run())

    def _db_get(self, db_file, sql, params):
        """取单行单值（如 deleted_at）。"""

        async def _run():
            conn = await aiosqlite.connect(str(db_file))
            try:
                cursor = await conn.execute(sql, params)
                row = await cursor.fetchone()
                return row[0] if row else None
            finally:
                await conn.close()

        return asyncio.run(_run())

    def test_messages_not_found_404(self, client):
        res = client.get("/api/conversations/999999/messages")
        assert res.status_code == 404
        assert res.json()["error"] == "NOT_FOUND"

    def test_messages_empty_new_conv(self, client):
        cid = client.post("/api/conversations", json={"title": "空会话"}).json()["id"]
        res = client.get(f"/api/conversations/{cid}/messages")
        assert res.status_code == 200
        assert res.json() == []

    def _seed_messages(self, temp_db, cid):
        """裸 SQL 插 3 条消息（含 tool_calls / tool_call_id），返回前确认 3 行。"""

        async def _insert():
            conn = await aiosqlite.connect(str(temp_db))
            try:
                await conn.execute(
                    "INSERT INTO messages (conversation_id, role, content, tool_calls, tool_call_id) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (cid, "user", "u1", None, None),
                )
                await conn.execute(
                    "INSERT INTO messages (conversation_id, role, content, tool_calls, tool_call_id) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (cid, "assistant", "a1", '[{"id": "call_1", "name": "shell", "arguments": "{}"}]', None),
                )
                await conn.execute(
                    "INSERT INTO messages (conversation_id, role, content, tool_calls, tool_call_id) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (cid, "tool", "t1", None, "call_1"),
                )
                await conn.commit()
            finally:
                await conn.close()

        asyncio.run(_insert())

    def test_soft_delete_keeps_messages(self, client, temp_db):
        """
        软删语义（2026-08-27 变更）：
        1. 创建会话 + 插 3 条消息
        2. DELETE → deleted_at 置非空（进回收站），会话行保留
        3. messages 行保留（软删不触发外键级联）
        4. 历史接口仍可读（恢复可见）
        """
        cid = client.post("/api/conversations", json={"title": "soft"}).json()["id"]
        self._seed_messages(temp_db, cid)

        before = self._db_count(temp_db, "SELECT COUNT(*) FROM messages WHERE conversation_id = ?", (cid,))
        assert before == 3, f"测试前置失败：应插 3 条消息，实际 {before}"

        res = client.delete(f"/api/conversations/{cid}")
        assert res.status_code == 200

        # 会话行保留 + deleted_at 非空
        deleted_at = self._db_get(temp_db, "SELECT deleted_at FROM conversations WHERE id = ?", (cid,))
        assert deleted_at is not None, "软删后 deleted_at 应为非空"
        # messages 保留
        after_msg = self._db_count(temp_db, "SELECT COUNT(*) FROM messages WHERE conversation_id = ?", (cid,))
        assert after_msg == 3, f"软删不应级联删 messages：还剩 {after_msg} 行（应为 3）"
        # 活跃列表不含回收站
        convs = client.get("/api/conversations").json()
        assert not any(c["id"] == cid for c in convs)
        # 回收站列表包含
        trash = client.get("/api/conversations/trash").json()
        assert any(c["id"] == cid for c in trash)
        # 历史消息仍可读
        msgs = client.get(f"/api/conversations/{cid}/messages").json()
        assert [m["role"] for m in msgs] == ["user", "assistant", "tool"]
        assert msgs[1]["tool_calls"][0]["function"]["name"] == "shell"
        assert msgs[2]["tool_call_id"] == "call_1"

    def test_purge_cascades_messages(self, client, temp_db):
        """
        硬删（purge）级联实证：
        1. 创建会话 + 插 3 条消息
        2. POST /purge → 会话行消失 + messages 级联清空
        失败信息明确指向 PRAGMA foreign_keys=ON 未生效。
        """
        cid = client.post("/api/conversations", json={"title": "purge"}).json()["id"]
        self._seed_messages(temp_db, cid)

        res = client.post(f"/api/conversations/{cid}/purge")
        assert res.status_code == 200

        after_msg = self._db_count(temp_db, "SELECT COUNT(*) FROM messages WHERE conversation_id = ?", (cid,))
        after_conv = self._db_count(temp_db, "SELECT COUNT(*) FROM conversations WHERE id = ?", (cid,))
        assert after_msg == 0, f"purge 级联删除未生效：messages 还剩 {after_msg} 行"
        assert after_conv == 0, f"purge 后会话行仍存在"


# ---------------------------------------------------------------------------
# P4.3-4 chat 续接会话 + 标题生成
# ---------------------------------------------------------------------------

class TestChatContinuation:
    """POST /api/chat 的 conversation_id 语义。"""

    def test_nonexistent_conv_non_stream_404(self, client):
        """非流式：不存在会话 → 404 JSON（而非 500）。"""
        res = client.post("/api/chat", json={"conversation_id": 999999, "message": "hi"})
        assert res.status_code == 404
        assert res.json()["error"] == "NOT_FOUND"

    def test_nonexistent_conv_stream_404(self, client):
        """
        流式：不存在会话 → 必须返回 JSON 404，而非"response already started"
        吞掉异常后的空 200。这是 api/chat.py 预校验的关键回归点。
        """
        res = client.post(
            "/api/chat",
            json={"conversation_id": 999999, "message": "hi"},
            headers={"Accept": "text/event-stream"},
        )
        assert res.status_code == 404
        assert res.json()["error"] == "NOT_FOUND"

    def test_continuation_keeps_conversation(self, client, mock_llm):
        """续接存在会话：不新建会话，消息写入原会话，回复正常返回。"""
        cid = client.post("/api/conversations", json={"title": "续接会话"}).json()["id"]
        count_before = len(client.get("/api/conversations").json())

        res = client.post(
            "/api/chat",
            json={"conversation_id": cid, "message": "接着聊"},
        )
        assert res.status_code == 200, res.text
        assert res.json()["reply"] == "reply text"
        assert res.json()["conversation_id"] == cid

        # 会话数不变（没有新建）
        count_after = len(client.get("/api/conversations").json())
        assert count_after == count_before

        # 原会话内多出 user + assistant 两条消息
        msgs = client.get(f"/api/conversations/{cid}/messages").json()
        assert [m["role"] for m in msgs] == ["user", "assistant"]
        assert msgs[0]["content"] == "接着聊"

        # 标题不被续接改写
        convs = client.get("/api/conversations").json()
        found = next(c for c in convs if c["id"] == cid)
        assert found["title"] == "续接会话"

    def test_new_conversation_title_from_first_message(self, client, mock_llm):
        """新建会话标题 = 首条用户消息去空白后前 20 字符。"""
        long_msg = "这是一个超过二十个字符的测试消息用来验证标题截断逻辑是否正确"
        res = client.post("/api/chat", json={"message": long_msg})
        assert res.status_code == 200, res.text
        cid = res.json()["conversation_id"]

        convs = client.get("/api/conversations").json()
        found = next(c for c in convs if c["id"] == cid)
        assert found["title"] == long_msg[:20]


# ---------------------------------------------------------------------------
# P4.3-5 /api/models
# ---------------------------------------------------------------------------

class TestModelsEndpoint:
    """GET /api/models 返回 _MODEL_PROVIDER_MAP 的模型列表。"""

    def test_models_returns_list(self, client):
        res = client.get("/api/models")
        assert res.status_code == 200
        body = res.json()
        assert isinstance(body["models"], list)
        assert "deepseek-chat" in body["models"]
