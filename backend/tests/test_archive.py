"""
归档系统测试（2026-08-27 派发，Claude 测试）

职责：
- 归档双路径：A. 提取+确认（mock LLM）→ is_archived=1 + memories 写入；
              B. 仅归档 → is_archived=1 + memories 无新增
- 取消归档：unarchive → is_archived=0
- 回收站软删 / 恢复 / 硬删 purge
- 列表过滤：默认排除回收站；?archived= 过滤；?trash= 仅回收站
- generate_summary 放宽：已归档可重提取；回收站仍拒绝
- 重复提取幂等：unarchive → 再归档 → 再 confirm → memories 仅一条活跃记忆

隔离（Tier 0）：
- conftest 会话级临时 DB + 临时 chroma 路径（autouse fail-fast）
- LLM 调用 monkeypatch 假摘要；embedding/ChromaDB 写入 mock——零真实 key / 零真实 config
"""

import asyncio

import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Fixtures：TestClient + LLM/ChromaDB mock
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client(session_db_path):
    """真实 main.app 的 TestClient（conftest 已把 LARRY_CONFIG 指向临时库）。"""
    import db.database as db_module

    db_module._db = None  # 丢弃旧连接引用（跨事件循环安全）
    from main import app

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    db_module._db = None


@pytest.fixture(autouse=True)
def mock_llm_and_vectors(monkeypatch):
    """
    mock 记忆链路与聊天链路（零真实 key / 零真实 config / 零真实 ChromaDB）：
    - archiver.chat_completion → 固定假摘要（generate_summary 用）
    - chat_service.chat_completion_stream_events → 固定回复（POST /api/chat 用，
      避免测试触发真实 LLM 调用——日志曾出现真实 token 消耗，已修）
    - embed_batch → 固定向量（confirm_and_store 用）
    - insert / delete_by_memory_id → no-op（不真实写 ChromaDB）
    """
    import memory.archiver as archiver
    from services import chat_service

    async def _fake_chat_completion(**kwargs):
        from models.llm import LLMResponse
        return LLMResponse(
            content="## 关键事实\n- 用户偏好咖啡",
            usage={"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        )

    async def _fake_stream_events(**kwargs):
        yield {"type": "delta", "content": "收到"}
        yield {
            "type": "finish",
            "finish_reason": "stop",
            "tool_calls": [],
            "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
        }

    async def _fake_embed_batch(texts):
        return [[0.1] * 512 for _ in texts]

    monkeypatch.setattr(archiver, "chat_completion", _fake_chat_completion)
    monkeypatch.setattr(chat_service, "chat_completion_stream_events", _fake_stream_events)
    monkeypatch.setattr(archiver, "embed_batch", _fake_embed_batch)
    monkeypatch.setattr(archiver, "insert", lambda points: asyncio.sleep(0))
    monkeypatch.setattr(archiver, "delete_by_memory_id", lambda mid: asyncio.sleep(0))


# ---------------------------------------------------------------------------
# 归档双路径
# ---------------------------------------------------------------------------

class TestArchiveDualPath:
    def test_archive_extract_and_confirm(self, client):
        """
        路径 A（提取+确认）：
        POST /memory/archive（mock LLM 出摘要）→ POST /memory/archive/confirm
        → is_archived=1 且 memories 表有写入
        """
        # 1. 建会话 + 发一条消息（让摘要有内容可提取）
        cid = client.post("/api/conversations", json={"title": "双路径A"}).json()["id"]
        client.post("/api/chat", json={"conversation_id": cid, "message": "我喜欢喝咖啡"})
        # 提取（mock LLM）
        res = client.post("/api/memory/archive", json={"conversation_id": cid})
        assert res.status_code == 200
        summary = res.json()["summary"]
        assert "咖啡" in summary
        # 确认存入
        res = client.post("/api/memory/archive/confirm", json={
            "conversation_id": cid, "summary": summary,
        })
        assert res.status_code == 200
        memory_id = res.json()["memory_id"]
        assert res.json()["status"] == "archived"
        # 会话已归档
        convs = client.get("/api/conversations?archived=true").json()
        assert any(c["id"] == cid for c in convs)
        # 记忆已写入
        mems = client.get("/api/memory").json()
        assert any(m["id"] == memory_id for m in mems)

    def test_archive_session_only_no_memory(self, client):
        """
        路径 B（仅归档）：
        POST /conversations/{id}/archive → is_archived=1 且 memories 表无新增
        """
        cid = client.post("/api/conversations", json={"title": "仅归档"}).json()["id"]
        client.post("/api/chat", json={"conversation_id": cid, "message": "测试消息"})

        mem_before = len(client.get("/api/memory").json())

        res = client.post(f"/api/conversations/{cid}/archive")
        assert res.status_code == 200
        assert res.json()["status"] == "archived"

        convs = client.get("/api/conversations?archived=true").json()
        assert any(c["id"] == cid for c in convs)
        mem_after = len(client.get("/api/memory").json())
        assert mem_after == mem_before, "仅归档不应写入记忆"

    def test_unarchive(self, client):
        """取消归档：POST /unarchive → is_archived=0，活跃列表恢复可见。"""
        cid = client.post("/api/conversations", json={"title": "取消归档"}).json()["id"]
        client.post(f"/api/conversations/{cid}/archive")
        res = client.post(f"/api/conversations/{cid}/unarchive")
        assert res.status_code == 200
        assert res.json()["status"] == "unarchived"

        convs = client.get("/api/conversations?archived=false").json()
        assert any(c["id"] == cid for c in convs)
        convs_archived = client.get("/api/conversations?archived=true").json()
        assert not any(c["id"] == cid for c in convs_archived)


# ---------------------------------------------------------------------------
# 回收站：软删 / 恢复 / purge
# ---------------------------------------------------------------------------

class TestTrashLifecycle:
    def test_soft_delete_restore(self, client):
        """DELETE → deleted_at 非空（进回收站）；restore → deleted_at NULL。"""
        cid = client.post("/api/conversations", json={"title": "回收站"}).json()["id"]

        res = client.delete(f"/api/conversations/{cid}")
        assert res.status_code == 200

        trash = client.get("/api/conversations/trash").json()
        found = next(c for c in trash if c["id"] == cid)
        assert found["deleted_at"] is not None
        # 活跃列表不含
        assert not any(c["id"] == cid for c in client.get("/api/conversations").json())

        # 恢复
        res = client.post(f"/api/conversations/{cid}/restore")
        assert res.status_code == 200
        assert res.json()["status"] == "restored"
        convs = client.get("/api/conversations").json()
        assert any(c["id"] == cid for c in convs)
        trash_after = client.get("/api/conversations/trash").json()
        assert not any(c["id"] == cid for c in trash_after)

    def test_purge_removes_completely(self, client):
        """purge → 会话彻底消失（活跃/回收站均无）。"""
        cid = client.post("/api/conversations", json={"title": "硬删"}).json()["id"]
        client.delete(f"/api/conversations/{cid}")  # 先进回收站
        res = client.post(f"/api/conversations/{cid}/purge")
        assert res.status_code == 200
        assert res.json()["status"] == "purged"

        assert not any(c["id"] == cid for c in client.get("/api/conversations").json())
        assert not any(c["id"] == cid for c in client.get("/api/conversations/trash").json())


# ---------------------------------------------------------------------------
# 列表过滤
# ---------------------------------------------------------------------------

class TestListFilters:
    def test_default_excludes_trash(self, client):
        """默认列表不含回收站会话（含已归档的除外——默认 archived 不过滤）。"""
        cid = client.post("/api/conversations", json={"title": "默认过滤"}).json()["id"]
        client.delete(f"/api/conversations/{cid}")
        assert not any(c["id"] == cid for c in client.get("/api/conversations").json())

    def test_archived_filter(self, client):
        """?archived=true 仅归档；?archived=false 仅活跃。"""
        a = client.post("/api/conversations", json={"title": "归档A"}).json()["id"]
        b = client.post("/api/conversations", json={"title": "活跃B"}).json()["id"]
        client.post(f"/api/conversations/{a}/archive")

        archived = client.get("/api/conversations?archived=true").json()
        active = client.get("/api/conversations?archived=false").json()
        assert any(c["id"] == a for c in archived)
        assert not any(c["id"] == b for c in archived)
        assert not any(c["id"] == a for c in active)
        assert any(c["id"] == b for c in active)

    def test_trash_query_param(self, client):
        """?trash=true 仅回收站（与 /trash 端点等价）。"""
        cid = client.post("/api/conversations", json={"title": "trash查询"}).json()["id"]
        client.delete(f"/api/conversations/{cid}")
        trash = client.get("/api/conversations?trash=true").json()
        assert any(c["id"] == cid for c in trash)


# ---------------------------------------------------------------------------
# generate_summary 放宽（关键行为变更）
# ---------------------------------------------------------------------------

class TestGenerateSummaryRelaxed:
    def test_archived_conversation_can_regenerate(self, client):
        """已归档会话（is_archived=1）可再次提取 → 成功出摘要（硬卡已放宽）。"""
        cid = client.post("/api/conversations", json={"title": "重提取"}).json()["id"]
        client.post("/api/chat", json={"conversation_id": cid, "message": "测试消息"})
        # 先仅归档
        client.post(f"/api/conversations/{cid}/archive")
        # 再提取（应成功，而非 raise）——mock 摘要固定含"咖啡"
        res = client.post("/api/memory/archive", json={"conversation_id": cid})
        assert res.status_code == 200
        assert "咖啡" in res.json()["summary"]

    def test_trash_conversation_rejected(self, client):
        """
        回收站会话（deleted_at 非空）仍拒绝提取 → 400（业务校验失败，非 502）。

        api/memory.py 透传 archiver.generate_summary 抛出的 ValidationError（400），
        不再归并为 LLMError→502（P3.5 语义问题已修复，见 WB 复验闭环）。
        """
        cid = client.post("/api/conversations", json={"title": "回收站拒提"}).json()["id"]
        client.post("/api/chat", json={"conversation_id": cid, "message": "内容"})
        client.delete(f"/api/conversations/{cid}")  # 进回收站
        res = client.post("/api/memory/archive", json={"conversation_id": cid})
        assert res.status_code == 400, f"回收站会话应 400 拒绝，实际 {res.status_code}"
        assert "trash" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 重复提取幂等（Marvis 评审纳入）
# ---------------------------------------------------------------------------

class TestArchiveIdempotency:
    def test_rearchive_overwrites_not_duplicates(self, client):
        """
        unarchive → 再归档（提取+确认）→ memories 仍仅一条 is_active=1 记忆。
        """
        cid = client.post("/api/conversations", json={"title": "幂等"}).json()["id"]
        client.post("/api/chat", json={"conversation_id": cid, "message": "第一次偏好"})

        # 第一轮：提取 + 确认
        s1 = client.post("/api/memory/archive", json={"conversation_id": cid}).json()["summary"]
        m1 = client.post("/api/memory/archive/confirm", json={
            "conversation_id": cid, "summary": s1,
        }).json()["memory_id"]

        # unarchive → 再归档（新摘要）
        client.post(f"/api/conversations/{cid}/unarchive")
        s2 = client.post("/api/memory/archive", json={"conversation_id": cid}).json()["summary"]
        m2 = client.post("/api/memory/archive/confirm", json={
            "conversation_id": cid, "summary": s2,
        }).json()["memory_id"]

        # 同一 memory_id（覆盖更新而非新建）
        assert m1 == m2, "重复归档应覆盖原记忆而非新建"

        # memories 表仅一条该会话的活跃记忆
        mems = client.get("/api/memory").json()
        related = [m for m in mems if m["source_conversation_id"] == cid and m["is_active"] == 1]
        assert len(related) == 1, f"应仅一条活跃记忆，实际 {len(related)}"
