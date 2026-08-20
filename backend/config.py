"""
配置管理模块

职责：
- 启动时从 config.yaml 读取全部配置
- 将配置封装为简单的 Python 对象，供其他模块通过 get_config() 获取
- 不涉及环境变量覆盖，所有配置集中在 config.yaml 管理
"""

import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml


# === 配置数据结构 ===

@dataclass
class ModelConfig:
    api_key: str = ""
    base_url: str = ""


@dataclass
class ServerConfig:
    host: str = "127.0.0.1"
    port: int = 8000
    api_key: str = ""


@dataclass
class DatabaseConfig:
    path: str = "data/larry.db"


@dataclass
class VectorStoreConfig:
    enabled: bool = False
    path: str = "data/chroma"
    collection_name: str = "larry_memories"


@dataclass
class LoggingConfig:
    level: str = "DEBUG"


@dataclass
class EmbeddingConfig:
    provider: str = "local"
    model: str = "text-embedding-3-small"
    api_key: str = ""
    base_url: str = ""
    local_model_name: str = "BAAI/bge-small-zh-v1.5"
    local_model_path: str = ""
    hf_endpoint: str = ""


@dataclass
class ToolsConfig:
    shell_allowed_ips: list = field(default_factory=lambda: ["127.0.0.1", "::1"])
    shell_timeout: int = 30
    file_ops_workspace: str = "~/larry_workspace"
    function_calling_max_iterations: int = 10
    # 配置驱动启用：列出的工具名才会被注册（registry.scan_and_register 读取）。
    # 空列表 = 未配置 → 全部启用（保持向后兼容）。
    enabled_tools: list = field(default_factory=list)


@dataclass
class SearchConfig:
    """网络搜索配置（web_search 工具）"""
    provider: str = "brave"
    brave_api_key: str = ""
    timeout: float = 8.0          # 单次搜索硬超时（秒）
    max_retries: int = 2          # 失败/限流后的指数退避重试次数
    max_results: int = 5          # 默认返回结果条数


@dataclass
class LLMConfig:
    max_retries: int = 3
    retry_backoff_base: float = 1.0
    max_input_tokens: int = 128000
    debug_log: bool = False


@dataclass
class Config:
    machine_id: str = ""
    roles: dict[str, dict] = field(default_factory=dict)
    models: dict[str, ModelConfig] = field(default_factory=dict)
    server: ServerConfig = field(default_factory=ServerConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    vector_store: VectorStoreConfig = field(default_factory=VectorStoreConfig)
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    tools: ToolsConfig = field(default_factory=ToolsConfig)
    search: SearchConfig = field(default_factory=SearchConfig)
    llm: LLMConfig = field(default_factory=LLMConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)

    def get_system_prompt(self, role: str = "default") -> str:
        """获取指定角色的 system prompt，不存在则回退到 default。"""
        role_config = self.roles.get(role, self.roles.get("default", {}))
        return role_config.get("system_prompt", "")


# === 全局单例 ===

_config: Config | None = None


def load_config(config_path: str | None = None) -> Config:
    """
    加载配置文件并返回 Config 对象。
    默认从 backend/config.yaml 读取，也可通过环境变量 LARRY_CONFIG 指定路径。

    Args:
        config_path: 配置文件路径，为 None 时自动查找

    Returns:
        Config 对象
    """
    global _config

    if config_path is None:
        config_path = os.environ.get("LARRY_CONFIG")
    if config_path is None:
        # 默认相对于本文件所在目录的 config.yaml
        config_path = Path(__file__).parent / "config.yaml"

    with open(config_path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    # 解析 models 子配置
    models = {}
    for name, cfg in raw.get("models", {}).items():
        models[name] = ModelConfig(
            api_key=cfg.get("api_key", ""),
            base_url=cfg.get("base_url", ""),
        )

    # === 路径锚定（修复双库问题）===
    # 相对路径一律相对【配置文件所在目录】解析，而非当前工作目录(CWD)。
    # 原因：原实现按 CWD 解析 data/larry.db，从项目根 / backend/ 等不同目录启动后端
    #       会写出多个散落的 larry.db。锚定后无论何处启动都指向同一文件。
    # 注意：测试通过 LARRY_CONFIG 指向临时 yaml 且 database.path 用【绝对路径】，
    #       此处会原样透传，因此测试隔离不受影响。
    config_dir = Path(config_path).resolve().parent

    db_raw = dict(raw.get("database", {}) or {})
    db_path = db_raw.get("path", "data/larry.db")
    if not os.path.isabs(db_path):
        db_path = str((config_dir / db_path).resolve())
    db_raw["path"] = db_path

    vs_raw = dict(raw.get("vector_store", {}) or {})
    vs_path = vs_raw.get("path", "data/chroma")
    if not os.path.isabs(vs_path):
        vs_path = str((config_dir / vs_path).resolve())
    vs_raw["path"] = vs_path

    _config = Config(
        machine_id=raw.get("machine_id", ""),
        roles=raw.get("roles", {}),
        models=models,
        server=ServerConfig(**raw.get("server", {})),
        database=DatabaseConfig(**db_raw),
        vector_store=VectorStoreConfig(**vs_raw),
        embedding=EmbeddingConfig(**raw.get("embedding", {})),
        tools=ToolsConfig(**raw.get("tools", {})),
        search=SearchConfig(**raw.get("search", {})),
        llm=LLMConfig(**raw.get("llm", {})),
        logging=LoggingConfig(**raw.get("logging", {})),
    )
    return _config


def get_config() -> Config:
    """获取已加载的配置单例。如果尚未加载则自动加载。"""
    global _config
    if _config is None:
        load_config()
    return _config
