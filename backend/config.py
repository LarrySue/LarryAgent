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
    host: str = "0.0.0.0"
    port: int = 8000


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

    _config = Config(
        machine_id=raw.get("machine_id", ""),
        roles=raw.get("roles", {}),
        models=models,
        server=ServerConfig(**raw.get("server", {})),
        database=DatabaseConfig(**raw.get("database", {})),
        vector_store=VectorStoreConfig(**raw.get("vector_store", {})),
        embedding=EmbeddingConfig(**raw.get("embedding", {})),
        tools=ToolsConfig(**raw.get("tools", {})),
        logging=LoggingConfig(**raw.get("logging", {})),
    )
    return _config


def get_config() -> Config:
    """获取已加载的配置单例。如果尚未加载则自动加载。"""
    global _config
    if _config is None:
        load_config()
    return _config
