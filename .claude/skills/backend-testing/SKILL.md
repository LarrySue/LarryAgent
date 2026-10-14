---
name: backend-testing
description: backend/ 测试的写与跑 —— 全套/定向/--real-api 冒烟命令、隔离范式、存量债务甄别、强杀后清理、交付自检；含"必须 cd backend 跑"与存量误判两坑
---

# backend 测试：写与跑

## 触发条件

- 要写 / 改 `backend/tests/` 下的测试，或要跑测试（定向、全套、`--real-api` 集成冒烟）
- 跑挂了，需要甄别「已知存量」还是「自己引入的回归」

## 怎么做

**跑**

- 一律在 `backend/` 下执行：全套 `python -m pytest tests/ -q`；定向 `python -m pytest tests/<file> -q`
- 集成冒烟：`python -m pytest tests/ --real-api`（默认全 skip；需 pytest-asyncio + 网络 + 可用 key；消耗真实额度）
- 后台跑时杀进程用 `taskkill /T`（Windows 下只杀外层 shell 会留下 python 子进程）

**写**

- 不自行设 `LARRY_CONFIG`、不 `load_config(真实路径)`：`tests/conftest.py` 在收集前已把配置指向会话级临时库，并有 session 级 autouse 断言（Tier 0 ④）
- 需要临时 DB 路径用 `session_db_path` fixture

**交付自检（对照「mock 覆盖不到什么」）**

- 清单：API 契约漂移（字段名/嵌套/usage/模型差异字段）｜SDK 流式 chunk 真结构｜网络层（超时/429/TLS/DNS/代理）｜鉴权与配额｜LLM 不确定性（幻觉 tool_calls/非法 JSON）｜字符编码（中文 Windows）｜真实延迟下 SSE 节奏｜**进程级资源生命周期**（连接/临时文件/退出期 GC，来由见 `archive/report-2026-08-30.md`）
- 凡涉及进程级资源的 mock/fixture，在代码注释标注 **「此处无法被 mock 覆盖，需集成层验证」** —— mock 全绿 ≠ 行为正确

**收尾**

- 强杀（taskkill /F / timeout）后 atexit 不执行 ⇒ 手动清 `tempfile.gettempdir()` 下的 `larry_test_*`（本机实测 `D:\Temp\Sys\`，不是 `/tmp`）
- ⚠️ `--real-api` 模式会向该目录写含**真实 key** 的 yaml（调真实 API 必须读到 key）⇒ 该模式残留必须清；默认模式残留无 key，仅磁盘卫生

## 已知坑

1. **必须 cd 到 `backend/` 再跑**：从仓库根跑会因 import 路径 / 配置解析差异出假失败。
2. **`no current event loop` ≠ 存量**：`test_shell_tool.py` / `test_file_ops_tool.py` 用旧式 `asyncio.get_event_loop()`，靠 `conftest.py::_ensure_event_loop`（autouse）兜住；若仍报此错 ⇒ 按真回归查。
3. **存量债务清单位置**：`HUMAN_NOTE.md`〈工程债务〉——`test_windows_dir`（中文 Win 编码断言）／`test_chromadb_degradation`（mock 已不存在的 archiver.get_db）／两文件的 asyncio 迁移；**以该处为准**（修完即删条）。清单外的失败 ⇒ 当回归查。
4. 集成冒烟跑挂不阻塞交付：它是契约哨兵，真实 API 不稳定属外部因素。
