"""
db 包：SQLite 数据库层。

包含：
- database.py: 连接管理，提供 get_db() 获取 aiosqlite 连接
- schema.py: 建表 DDL
- migrations.py: 启动时自动执行 schema 的简易迁移
"""
