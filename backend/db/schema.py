"""
数据库 Schema 定义

表结构设计（单人使用，无需 user 表）：
- conversations: 对话会话
- messages: 对话消息（属于某个 conversation）
- memories: 长期记忆（归档后的摘要）
- tools: 已注册的工具列表（启动时同步）
"""

# === 建表 SQL ===

CREATE_CONVERSATIONS = """
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_archived INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT DEFAULT NULL
);
"""

CREATE_MESSAGES = """
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL DEFAULT '',
    tool_calls TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
"""

CREATE_MEMORIES = """
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source_conversation_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (source_conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
);
"""

CREATE_TOOLS = """
CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    parameters_schema TEXT NOT NULL DEFAULT '{}',
    is_enabled INTEGER NOT NULL DEFAULT 1,
    group_name TEXT NOT NULL DEFAULT 'core'
);
"""

# 索引：加速按会话查询消息
CREATE_INDEX_MESSAGES_CONV = """
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
ON messages(conversation_id);
"""

CREATE_INDEX_MEMORIES_ACTIVE = """
CREATE INDEX IF NOT EXISTS idx_memories_is_active
ON memories(is_active);
"""

ALL_TABLES = [
    CREATE_CONVERSATIONS,
    CREATE_MESSAGES,
    CREATE_MEMORIES,
    CREATE_TOOLS,
    CREATE_INDEX_MESSAGES_CONV,
    CREATE_INDEX_MEMORIES_ACTIVE,
]
