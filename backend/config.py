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
class QdrantConfig:
    host: str = "localhost"
    port: int = 6333
    collection_name: str = "larry_memories"


@dataclass
class EmbeddingConfig:
    provider: str = "openai"
    model: str = "text-embedding-3-small"
    api_key: str = ""
    local_model_path: str = ""


@dataclass
class ToolsConfig:
    shell_allowed_ips: list = field(default_factory=lambda: ["127.0.0.1", "::1"])


@dataclass
class Config:
    machine_id: str = ""
    models: dict[str, ModelConfig] = field(default_factory=dict)
    server: ServerConfig = field(default_factory=ServerConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    qdrant: QdrantConfig = field(default_factory=QdrantConfig)
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    tools: ToolsConfig = field(default_factory=ToolsConfig)


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
        models=models,
        server=ServerConfig(**raw.get("server", {})),
        database=DatabaseConfig(**raw.get("database", {})),
        qdrant=QdrantConfig(**raw.get("qdrant", {})),
        embedding=EmbeddingConfig(**raw.get("embedding", {})),
        tools=ToolsConfig(**raw.get("tools", {})),
    )
    return _config


def get_config() -> Config:
    """获取已加载的配置单例。如果尚未加载则自动加载。"""
    global _config
    if _config is None:
        load_config()
    return _config
