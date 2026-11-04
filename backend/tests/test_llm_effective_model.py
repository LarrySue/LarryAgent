"""
B 案单测入仓：effective_model 解析分支 + load_config 的 YAML→dataclass 链路

职责：
- 验证 models/llm.py 唯一解析点 `effective_model` 的两条分支：
  ① 配置有值 ⇒ 用配置值（而非兜底）
  ② 配置为空 / 缺省 / None ⇒ 落 FALLBACK_MODEL
- 验证 config.py 的 `load_config`：YAML 里写的 `models.<provider>.model`
  确实能读进 `ModelConfig.model`；不写该键时不崩、字段为空
- 断言一律引用 `FALLBACK_MODEL` 常量，不写死模型名字面量：
  将来切换兜底模型（如 deepseek-chat → deepseek-flash）时本文件无需改动；
  写死字面量会在切换时产生"假红"——那正是 M 单要防的形状（改一处、平行处没改）

为什么两类测试在同一文件：
- 上游两条只 monkeypatch 构造 `ModelConfig`，**不经过 YAML 解析** ⇒
  config.py 字段名被改坏（`model` → `modle`）时它们照样全绿。
  load_config 级测试补的就是这段链路（WB 派发 V-1～V-4）。

与其他模块的关系：
- 被测：models/llm.py:75 `effective_model`（读 `get_config().models`）；
  config.py:125 `load_config`（YAML → Config 单例）
- 测试自足：monkeypatch `models.llm.get_config` 为就地构造的 `Config`；
  load_config 测试用 `tmp_path` 写最小 YAML，⛔ 不读实例 backend/config.yaml
  （含真实凭据，且值会随部署变化）
- 产品代码零改动；不触碰任何既有测试

来源：WB 派发 U-1～U-4（2026-11-04），承接砚砚 M 单（7fc5fe6）自曝的临时脚本自证；
V-1～V-4 补其自曝的 YAML→dataclass 链路缺口（2026-11-04 17:45）。
"""

import os
from pathlib import Path

import config as config_module
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


# ---------------------------------------------------------------------------
# load_config 级：YAML → dataclass 链路（V 单）
# ---------------------------------------------------------------------------

def _load_from_minimal_yaml(tmp_path, monkeypatch, yaml_text: str):
    """用 tmp_path 写最小 YAML 并调用 load_config，同时登记全局单例的还原。

    ⚠️ V-3 还原手法（load_config 内部 `global _config` 会直接替换单例对象）：
      ① try/finally 显式把 `_config` 设回调用前的对象；
      ② monkeypatch.setattr 再兜一层 —— 即便 finally 因故没跑到，
         fixture teardown 也会把 `_config` 恢复为同一原值。
    两层都指向同一个 `original`，重复还原是幂等的。
    """
    original = config_module._config
    monkeypatch.setattr(config_module, "_config", original)

    yaml_path = tmp_path / "config.min.yaml"
    yaml_path.write_text(yaml_text, encoding="utf-8")
    try:
        loaded = config_module.load_config(str(yaml_path))
        # 自证单例确实被替换 —— 这正是 V-3 必须还原的原因
        assert config_module._config is loaded
        return loaded
    finally:
        config_module._config = original


def test_load_config_reads_model_from_yaml(tmp_path, monkeypatch):
    """V-1：YAML 写了 models.deepseek.model ⇒ load_config 读进 ModelConfig.model。"""
    configured = "test-yaml-model"
    loaded = _load_from_minimal_yaml(
        tmp_path, monkeypatch,
        f"models:\n  deepseek:\n    model: {configured}\n",
    )

    assert loaded.models["deepseek"].model == configured


def test_load_config_without_model_key_does_not_crash(tmp_path, monkeypatch):
    """V-2：YAML 不写 model 键 ⇒ 不抛异常，字段为空值。"""
    loaded = _load_from_minimal_yaml(
        tmp_path, monkeypatch,
        'models:\n  deepseek:\n    base_url: "https://example.invalid"\n',
    )

    assert loaded.models["deepseek"].model == ""


def test_global_config_not_leaked_by_load_config_tests():
    """V-3 自检：上两条 load_config 测试必须已把全局单例还原。

    判据：`_config.database.path` 仍落在**会话临时目录** —— conftest 把
    `LARRY_CONFIG` 指向该目录下的 `config.session.yaml`；若前面的测试漏了还原，
    这里拿到的是 `tmp_path` 的派生配置，必红。

    ⚠️ 为什么需要这条：WB 原定「跑完整个 pytest 全绿」作证据，实测**不成立** ——
    去掉两层还原后全套照样 178 绿（后续测试里 TestClient 的 lifespan 会重新
    `load_config()`，自动冲掉泄漏）。故补一条能主动抓住「忘还原」的判据。
    已知局限：依赖同文件内测试按定义顺序执行（pytest 默认）。
    """
    session_cfg_dir = Path(os.environ["LARRY_CONFIG"]).resolve().parent

    assert config_module._config is not None
    assert Path(config_module._config.database.path).resolve().parent == session_cfg_dir
