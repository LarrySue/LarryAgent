"""
角色清单 API

职责：
- GET /api/roles  返回角色清单（config.yaml roles 段下发），供前端动态渲染

与其它模块的关系：
- 依赖 config.py 的 get_config().roles（dict[str, dict]，书写顺序即下发顺序）
- 前端不再硬编码角色，加新角色只需改 config.yaml + 重启
- 前缀 /api → 自动经过 AuthMiddleware（P3.4）
"""

import logging

from fastapi import APIRouter

from config import get_config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/roles", tags=["roles"])

# 角色缺省色：与 docs/ui-reference.md §1.4 原 --role-default 一致
DEFAULT_ROLE_COLOR = "#9CA3AF"


@router.get("")
async def list_roles():
    """
    返回角色清单：[{key, label, color}, ...]，顺序 = config.yaml roles 段书写顺序。
    label/color 缺省时兜底：label → key；color → #9CA3AF。
    """
    roles_cfg = get_config().roles  # py dict 保序，default 排首位
    result = []
    for key, cfg in roles_cfg.items():
        item_cfg = cfg if isinstance(cfg, dict) else {}
        label = item_cfg.get("label") or key
        color = item_cfg.get("color") or DEFAULT_ROLE_COLOR
        result.append({"key": key, "label": label, "color": color})
    return result
