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
import logging
import os
import shutil
import tempfile
from pathlib import Path

import pytest

logger = logging.getLogger(__name__)
import yaml

_BACKEND_DIR = Path(__file__).parent.parent
_REAL_CONFIG = _BACKEND_DIR / "config.yaml"
_REAL_DB = (_BACKEND_DIR / "data" / "larry.db").resolve()

# ---------------------------------------------------------------------------
# 会话级临时配置（模块导入时执行——先于一切测试模块）
# ---------------------------------------------------------------------------
# 安全设计（2026-08-30 待办 1+2 硬化，源：archive/report-2026-08-30.md §七）：
# - **key 占位符**：默认路径下临时 yaml 的 api_key 一律写占位符，真实 key 不落盘；
#   强杀残留也不含 key（WB 2026-08-30 实证：残留目录 yaml 中 api_key = 占位符）。
# - **⚠️ 例外（勿误读）**：`--real-api` 模式会在 pytest_configure 注入真实 key
#   并重写 yaml——调真实 API 必须读到 key，无法避免。**该模式残留的目录含 key
#   明文**，须立即清理。故"key 永不落盘"仅对默认路径成立。
# - **残留不限于强杀（WB 2026-08-30 实测更正）**：`--real-api` 正常退出同样会
#   残留——ChromaDB 的 chroma.sqlite3 句柄未释放，atexit 的 rmtree 抛 WinError 32。
#   此前"仅强杀才残留"的说法不成立，勿据此放松清理。
# - **清理告警**：atexit 删除失败时 logger.warning 告警，不静默吞。
#   注：atexit 阶段 logging stream 可能已关闭（ValueError: I/O operation on
#   closed file），靠 logging.handleError 兜底打到 stderr 才可见，输出带噪音。

_session_tmpdir = tempfile.mkdtemp(prefix="larry_test_")
_session_db = Path(_session_tmpdir) / "session.db"
_session_chroma = Path(_session_tmpdir) / "chroma"
_session_yaml = Path(_session_tmpdir) / "config.session.yaml"

# 以真实配置为基底，只替换持久化路径——其余行为（models/roles/tools/llm）完全一致
with open(_REAL_CONFIG, "r", encoding="utf-8") as f:
    _cfg = yaml.safe_load(f)

_cfg.setdefault("database", {})["path"] = str(_session_db.resolve())
_cfg.setdefault("vector_store", {}).update(
    enabled=False,
    path=str(_session_chroma.resolve()),
)
_cfg.setdefault("server", {})["api_key"] = ""  # 鉴权透传，测试不校验

# 所有名为 api_key 的键写占位符（递归，防 key 明文落盘）
# 覆盖 models.<name>.api_key / embedding.api_key / search.brave_api_key 等
# 全部位置——未来新增 provider 自动覆盖，不硬编码名单（WB 派发规格要求）
_KEY_PLACEHOLDER = "__TEST_PLACEHOLDER__"


def _redact_keys(node):
    """递归替换所有名为 api_key / brave_api_key 的值为占位符。"""
    if isinstance(node, dict):
        for k, v in list(node.items()):
            if k in ("api_key", "brave_api_key") and isinstance(v, str) and v:
                node[k] = _KEY_PLACEHOLDER
            else:
                _redact_keys(v)
    elif isinstance(node, list):
        for item in node:
            _redact_keys(item)


_redact_keys(_cfg)


def _write_session_yaml():
    """写临时 yaml（占位符或注入后的真实 key）。"""
    with open(_session_yaml, "w", encoding="utf-8") as f:
        yaml.safe_dump(_cfg, f, allow_unicode=True)


_write_session_yaml()
os.environ["LARRY_CONFIG"] = str(_session_yaml)


def _cleanup_session_tmpdir():
    """atexit 清理：失败告警而非静默（待办 1）。

    先 gc.collect() 释放文件句柄（ChromaDB/sqlite 句柄是 Windows 删除失败主因），
    再删除；仍失败则告警——告警文案须区分是否 --real-api：该模式残留含 key 明文。
    """
    try:
        import gc

        gc.collect()  # 释放 ChromaDB/sqlite 文件句柄，提高删除成功率
        shutil.rmtree(_session_tmpdir, ignore_errors=False)
        logger.info("Test session temp dir cleaned: %s", _session_tmpdir)
    except Exception as e:
        if _REAL_API_MODE:
            logger.error(
                "⚠️ 清理失败且为 --real-api 模式：%s 中的 config.session.yaml "
                "【含真实 API key 明文】，请立即手动删除。原因：%s",
                _session_tmpdir, e,
            )
        else:
            logger.warning(
                "Test session temp dir cleanup FAILED: %s (%s). "
                "目录残留（无 key，占位符设计），可手动删除。",
                _session_tmpdir, e,
            )


atexit.register(_cleanup_session_tmpdir)


# ---------------------------------------------------------------------------
# --real-api 开关（integration 层：真实 API 契约哨兵）
# ---------------------------------------------------------------------------

# --real-api 模式标志：决定清理失败时告警的严重级别（含 key vs 占位符）
_REAL_API_MODE = False


def pytest_addoption(parser):
    """--real-api：显式开启真实 API 集成测试（默认跳过，防误烧 key）。"""
    parser.addoption(
        "--real-api",
        action="store_true",
        default=False,
        help="跑真实 API 集成测试（test_integration_llm.py，会消耗真实 key 额度）",
    )


def pytest_configure(config):
    """注册自定义 mark + --real-api 时注入真实 key（待办 2：占位符→真实 key 仅显式开启时注入）。"""
    config.addinivalue_line("markers", "integration: 真实 API 集成测试（默认跳过，--real-api 显式开启）")

    global _REAL_API_MODE
    if config.getoption("--real-api"):
        _REAL_API_MODE = True
        # 从真实 config 递归复制所有 key 到临时 yaml（仅显式开启时；默认占位符，key 不落盘）
        with open(_REAL_CONFIG, "r", encoding="utf-8") as f:
            real_cfg = yaml.safe_load(f)

        def _inject_keys(target, source):
            """递归：source 的 api_key/brave_api_key 非空时覆盖 target 对应位置。"""
            if isinstance(source, dict):
                for k, v in source.items():
                    if k in ("api_key", "brave_api_key") and isinstance(v, str) and v:
                        if isinstance(target, dict) and k in target:
                            target[k] = v
                    elif isinstance(v, (dict, list)) and isinstance(target, dict) and k in target:
                        _inject_keys(target[k], v)

        _inject_keys(_cfg, real_cfg)
        _write_session_yaml()
        logger.info("--real-api: injected real API keys into session config")


def pytest_collection_modifyitems(config, items):
    """默认跳过 integration 标记的用例；--real-api 才放行。"""
    if config.getoption("--real-api"):
        return
    skip_integration = pytest.mark.skip(reason="真实 API 集成测试，需 --real-api 显式开启")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_integration)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _ensure_event_loop():
    """
    修复跨文件事件循环污染（WB 二分实证，2026-08-30）。

    根因：FastAPI TestClient（test_conversations / test_chat_service）退出时
    销毁当前线程事件循环，后续 sync 测试（test_shell_tool / test_file_ops_tool）
    调 asyncio.get_event_loop() 抛 RuntimeError: There is no current event loop
    in thread 'MainThread'。

    修复：每个测试前确保当前线程存在可用事件循环（无则新建）。
    """
    import asyncio

    try:
        asyncio.get_event_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())
    yield


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
