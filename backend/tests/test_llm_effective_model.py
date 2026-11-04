"""
B 案单测入仓：effective_model 的两条解析分支

职责：
- 验证 models/llm.py 唯一解析点 `effective_model` 的两条分支：
  ① 配置有值 ⇒ 用配置值（而非兜底）
  ② 配置为空 / 缺省 / None ⇒ 落 FALLBACK_MODEL
- 断言一律引用 `FALLBACK_MODEL` 常量，不写死模型名字面量：
  将来切换兜底模型（如 deepseek-chat → deepseek-flash）时本文件无需改动；
  写死字面量会在切换时产生"假红"——那正是 M 单要防的形状（改一处、平行处没改）

与其他模块的关系：
- 被测：models/llm.py:75 `effective_model`（读 `get_config().models`）
- 测试自足：monkeypatch `models.llm.get_config` 为就地构造的 `Config`，
  ⛔ 不读实例 backend/config.yaml（含真实凭据，且值会随部署变化）
- 产品代码零改动；不触碰任何既有测试

来源：WB 派发 U-1～U-4（2026-11-04），承接砚砚 M 单（7fc5fe6）自曝的临时脚本自证。
"""

from config import Config, ModelConfig
from models import llm as llm_module
from models.llm import FALLBACK_MODEL, effective_model


def _patch_config(monkeypatch, models: dict[str, ModelConfig]) -> None:
    """把 models.llm 模块内的 get_config 替换为返回构造配置的桩。

    ⚠️ llm.py 以 `from config import get_config` 引入，函数体内查的是模块全局名，
    因此必须打 `models.llm.get_config`；打 `config.get_config` 不会生效。
    """
    monkeypatch.setattr(llm_module, "get_config", lambda: Config(models=models))


def test_effective_model_uses_configured_value(monkeypatch):
    """U-1：配置有值 ⇒ 返回配置值，不落兜底。

    同时覆盖 `effective_model()` 的默认 provider_key="deepseek" 取值路径。
    """
    configured = "test-configured-model"
    _patch_config(monkeypatch, {"deepseek": ModelConfig(model=configured)})

    assert effective_model() == configured


def test_effective_model_falls_back_when_unset(monkeypatch):
    """U-2：空串 / 缺省 / None / provider 条目缺失 ⇒ 都返回 FALLBACK_MODEL。

    三种"空"在 YAML 里是不同写法、解析结果也不同（`model: ""` / 不写 `model` 键 /
    `model: ~`），必须逐一覆盖——不能只测其中一种就认为"空配置"已覆盖。
    """
    cases = {
        "空串": {"deepseek": ModelConfig(model="")},
        "纯空白串（实现有 strip）": {"deepseek": ModelConfig(model="   ")},
        "缺省（不传 model）= dataclass 默认值": {"deepseek": ModelConfig()},
        "None（YAML 的 ~）": {"deepseek": ModelConfig(model=None)},
        "provider 条目缺失": {},
    }

    for label, models in cases.items():
        _patch_config(monkeypatch, models)
        assert effective_model() == FALLBACK_MODEL, f"输入情形：{label}"
