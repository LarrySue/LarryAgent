"""
pytest 会话级测试隔离（Tier 0 第 4 条的程序性强制实现）

职责：
- 在 pytest 收集任何测试模块之前，把 `LARRY_CONFIG` 指向会话级临时 yaml：
  以真实 config.yaml 为基底（保留 models/roles/tools/llm 等全部行为），
  仅替换 database.path 与 vector_store 段（临时 db + 临时 chroma 路径、enabled=false）
- autouse 断言 fixture：若最终解析出的 database.path 指向真实库
  `backend/data/larry.db`，直接 pytest.fail——不依赖任何测试的自觉
- 会话结束自动删除临时目录（含临时 yaml 里复制过来的真实 API key，不留盘）

关键时序（首版 fixture 翻车教训，见 docs/ai-governance.md §5.3）：
- main.py 的 lifespan 会无参调用 `load_config()`，从 `LARRY_CONFIG` 环境变量
  **重新读取**配置、忽略内存单例。所以环境变量必须在【导入任何业务模块之前】
  就位。pytest 在收集测试模块之前先加载本文件，天然满足时序。
- 验证对象是"最终连到哪个文件"（行为），不是"我改了哪个变量"（动作）——
  见 _assert_test_db_isolation。

与其他模块的关系：
- 影响全部测试文件的配置解析与 DB 路径
- test_conversations.py 的 temp_db fixture 基于本文件提供的 session_db_path
"""

import atexit
import os
import shutil
import tempfile
from pathlib import Path

import pytest
import yaml

_BACKEND_DIR = Path(__file__).parent.parent
_REAL_CONFIG = _BACKEND_DIR / "config.yaml"
_REAL_DB = (_BACKEND_DIR / "data" / "larry.db").resolve()

# ---------------------------------------------------------------------------
# 会话级临时配置（模块导入时执行——先于一切测试模块）
# ---------------------------------------------------------------------------

_session_tmpdir = tempfile.mkdtemp(prefix="larry_test_")
_session_db = Path(_session_tmpdir) / "session.db"
_session_chroma = Path(_session_tmpdir) / "chroma"
_session_yaml = Path(_session_tmpdir) / "config.session.yaml"

# 以真实配置为基底，只替换持久化路径——其余行为（models/roles/tools/llm）完全一致，
# 集成测试需要真实 API key 时行为不变；key 随临时目录在会话结束一并销毁。
with open(_REAL_CONFIG, "r", encoding="utf-8") as f:
    _cfg = yaml.safe_load(f)

_cfg.setdefault("database", {})["path"] = str(_session_db.resolve())
_cfg.setdefault("vector_store", {}).update(
    enabled=False,
    path=str(_session_chroma.resolve()),
)
_cfg.setdefault("server", {})["api_key"] = ""  # 鉴权透传，测试不校验

with open(_session_yaml, "w", encoding="utf-8") as f:
    yaml.safe_dump(_cfg, f, allow_unicode=True)

os.environ["LARRY_CONFIG"] = str(_session_yaml)

# 会话结束清理临时目录（含复制过来的真实 API key），无论测试成败
atexit.register(shutil.rmtree, _session_tmpdir, ignore_errors=True)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def _assert_test_db_isolation():
    """
    Tier 0 第 4 条的程序性强制：验证【行为】而非动作。

    断言最终解析出的 database.path 不指向真实库 backend/data/larry.db，
    指向即 fail——防止任何测试（包括未来新增）以任何方式连上真实库。
    """
    from config import get_config

    actual = Path(get_config().database.path).resolve()
    if actual == _REAL_DB:
        pytest.fail(
            f"测试隔离失效：database.path 指向真实库 {_REAL_DB}。"
            f"请勿在测试中覆盖 LARRY_CONFIG 或重载真实配置。"
        )


@pytest.fixture(scope="session")
def session_db_path() -> Path:
    """会话级临时 DB 文件路径，供需要直连 SQL 验证的测试使用。"""
    return _session_db
