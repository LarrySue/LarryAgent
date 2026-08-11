"""
LLM 多模型路由模块

职责：
- 接收 chat 请求，根据 model_name 选择对应的 API 提供商
- 统一封装 OpenAI 兼容的 chat completions 调用
- 支持流式和非流式两种响应模式
- 支持 function calling（tools 参数 + 结构化返回）

与其他模块的关系：
- 被 services/chat_service.py 调用，作为模型调用的统一入口
- 依赖 config.py 获取各模型的 api_key 和 base_url
"""

import json
import logging
import time
from dataclasses import dataclass, field
from typing import AsyncGenerator

from openai import AsyncOpenAI

from config import get_config

logger = logging.getLogger(__name__)

# 按 provider 缓存客户端（api_key/base_url 按 provider 配置）
_clients: dict[str, AsyncOpenAI] = {}


@dataclass
class LLMResponse:
    """LLM 调用结果，支持 function calling。"""
    content: str = ""
    tool_calls: list[dict] = field(default_factory=list)  # [{id, name, arguments(JSON string)}]
    finish_reason: str = "stop"  # "stop" | "tool_calls" | "length"

    @property
    def has_tool_calls(self) -> bool:
        return bool(self.tool_calls)


def _resolve_provider_key(model_name: str) -> str:
    """从模型名解析 provider 配置键，如 deepseek-chat → deepseek。"""
    return model_name.split("-")[0] if "-" in model_name else model_name


def _get_client(model_name: str) -> AsyncOpenAI:
    """根据模型名获取或创建对应的 AsyncOpenAI 客户端。"""
    provider_key = _resolve_provider_key(model_name)
    if provider_key in _clients:
        return _clients[provider_key]

    config = get_config()
    model_cfg = config.models.get(provider_key)
    if model_cfg is None:
        raise ValueError(f"Unknown model provider: {provider_key} (model={model_name})")
    if not model_cfg.api_key:
        raise ValueError(f"API key not configured for provider: {provider_key}")

    logger.debug(
        "Creating LLM client provider=%s base_url=%s",
        provider_key,
        model_cfg.base_url,
    )
    client = AsyncOpenAI(
        api_key=model_cfg.api_key,
        base_url=model_cfg.base_url,
    )
    _clients[provider_key] = client
    return client


async def chat_completion(
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 4096,
    tools: list[dict] | None = None,
) -> LLMResponse:
    """
    非流式聊天补全，支持 function calling。

    Args:
        model: 模型名称，如 "deepseek-chat"、"gpt-4o"
        messages: 标准 OpenAI 消息列表
        temperature: 温度参数
        max_tokens: 最大输出 token 数
        tools: OpenAI function calling schema 列表，None 表示不启用工具

    Returns:
        LLMResponse，包含 content、tool_calls、finish_reason
    """
    client = _get_client(model)
    logger.info(
        "LLM request model=%s messages=%d tools=%s temperature=%s",
        model,
        len(messages),
        len(tools) if tools else 0,
        temperature,
    )
    start = time.perf_counter()
    try:
        kwargs = dict(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if tools:
            kwargs["tools"] = tools

        response = await client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        msg = choice.message
        content = msg.content or ""

        tool_calls = []
        if msg.tool_calls:
            for tc in msg.tool_calls:
                tool_calls.append({
                    "id": tc.id,
                    "name": tc.function.name,
                    "arguments": tc.function.arguments,
                })

        elapsed = time.perf_counter() - start
        logger.info(
            "LLM response model=%s finish=%s chars=%d tool_calls=%d elapsed=%.2fs",
            model,
            choice.finish_reason,
            len(content),
            len(tool_calls),
            elapsed,
        )
        return LLMResponse(
            content=content,
            tool_calls=tool_calls,
            finish_reason=choice.finish_reason or "stop",
        )
    except Exception:
        logger.exception("LLM request failed model=%s", model)
        raise


async def chat_completion_stream(
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """
    流式聊天补全。

    Args:
        model: 模型名称
        messages: 标准 OpenAI 消息列表
        temperature: 温度参数
        max_tokens: 最大输出 token 数

    Yields:
        每次返回一个增量文本片段
    """
    client = _get_client(model)
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
