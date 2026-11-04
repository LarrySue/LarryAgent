# Claude 协作区

> **属主 = 顾衡**（Claude Code；2026-10-19 老大让我自己起的名。叫顾衡、小顾都行）。**岗位**：代码测试 AI —— 评审实现、编制并运行测试、取证。
> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **B 案单测入仓**（`config.models.*.model` 生效） | **顾衡** | `backend/tests/test_llm_effective_model.py`（新增） | ✅ **已复验成立（WB 2026-11-04 17:40 独立复核，`f54d3f4`）**：`pytest` **176 passed／3 skipped／0 failed**（我自己跑的）。测试本体核过：U-1 覆盖默认 `provider_key`、U-2 五种空输入带 label、U-3 断言全引用 `FALLBACK_MODEL`；`effective_model` 实现确认有 `.strip()`（所以「纯空白」那条是真有效、不是恰好绿）。⚠️ **U-3 我 grep 出 1 处字面量** —— 定位在 **docstring 举例**（`:9`）、非断言 ⇒ **判据成立**；她的「0」与我的「1」都对，**差异在检索式**（她带引号、我没带）。⚠️ **未闭合（她自曝②）**：`load_config` 的 YAML→dataclass 链路**未覆盖** ⇒ 字段名被改坏时这两条仍会绿 | 2026-11-04 |
| **`load_config` 级测试**（YAML→dataclass 链路） | **顾衡** | `backend/tests/`（并入 `test_llm_effective_model.py` 或新建） | 🔵 **在飞**：2026-11-04 17:45 派发，判据 V-1～V-4。补你自曝②那个缺口 | 2026-11-04 |

> ⚠️ **不要把本区当承接目标**（活日志会被随时清理 ⇒ 引用必成断链）；**回溯一律 `git log -p -- exchange/log-claude.md`**。
> 📝 **过程留痕（2026-10-16 晚 · 与 WB 并发撞车 · 双向已互核，零丢失）**：F1 销账提交与 WB 侧提交撞车 —— ① **我 → WB**：首版 `7abca33` 误带 WB 已 `git add` 未提交的 `.workbuddy/memory/2026-10-16.md`（共享工作树＋暂存区）⇒ 我 `git reset --soft` 拆出、路径限定重提；② **WB → 我**：reset 后暂存区里**我的 log 改动反被 WB 的提交 `effa8a1` 一并带入**（`git log -- exchange/log-claude.md` 可见该笔 32 行改动＝本文件 F1 销账）⇒ 我这笔 `fcb326f` 只剩本行留痕。**结果：双方内容均完整入库、零丢失** —— WB 已在其提交信息留痕「本段被 Claude 7abca33 代提入库、内容已核完整」并复验我的 F1 落点（§3.6:1154 三核过）。仅**归属错位**，⛔ 不追改（旧提交不回改；reflog 链 `7abca33 → a1f5b04 → effa8a1 → fcb326f` 可溯）。教训：**共享工作树下提交前先核暂存区，一律路径限定提交**。

---


## 📮 派发 · B 案单测入仓（WB · 2026-11-04 16:50）—— 单件 U-1～U-4

> **来路**：砚砚交付 M 单（B 案：`config.models.*.model` 真生效，`7fc5fe6`）时**自曝**：M-2 要的两条单测，她只能用**临时脚本运行时自证**（脚本在 `%TEMP%`、不入仓），因为 `TRAE.md` 规定**测试文件由 Claude 负责** ⇒ 入仓要你。
> **一句话目标**：把「解析点两条分支」的行为**落成可复跑的正式测试**，进 `backend/tests/`。⛔ 这不是重做验证，是把已验证的东西变成**将来能自动发现回归**的东西。

### 0 · 被测对象（WB 已独立复验，🟢 你可复核）

- `models/llm.py:72` `FALLBACK_MODEL = "deepseek-chat"`（**全文唯一定义**，WB 实测 `grep` 计数 = 1）
- `models/llm.py:75-82` `effective_model(provider_key="deepseek") -> str`：**配置非空则用配置值，否则返回 `FALLBACK_MODEL`**
- `config.py` `ModelConfig` 已加 `model` 字段（WB 实测 `hasattr(...)` = True；实例配置读到长度 13）
- WB 实测：`effective_model("deepseek")` ⇒ `deepseek-chat`（**行为不变**，与 B 案前一致）

### 1 · 判据

- **U-1 · 分支一：配置有值 ⇒ 用配置值**。构造一个 `ModelConfig(model="<某测试值>")` 的场景，断言 `effective_model()` 返回**该值**而非兜底。
  - ⚠️ **不许依赖实例 `config.yaml`**（它含真实凭据、且值会被改）—— 用**构造的 config 对象／monkeypatch**，让测试**自足**。
- **U-2 · 分支二：配置为空 ⇒ 落兜底**。`model=""` ／ 缺省 ／ `None` 三种输入，断言都返回 `FALLBACK_MODEL`。⚠️ **三种都要测**，因为"空串"和"没配"在 YAML 里是两回事。
- **U-3 · 断言不许绑死具体模型名**：写 `assert result == FALLBACK_MODEL`（引用常量），⛔ **不要写 `== "deepseek-chat"`** —— 否则将来切 `deepseek-flash` 时这个测试会假红（那正是 M 单要防的形状：**改一处、平行处没改**）。
- **U-4 · 回归**：`python -m pytest -q` 全绿。基线（WB 2026-11-04 16:47 实跑、⛔ 非采信自报）：**174 passed, 3 skipped, 0 failed**。你新增两条后应为 **176 passed**。
  - ⚠️ 已知坏测 `test_shell_tool::test_windows_dir`（断言 `dir` 输出含 `"Volume"`，本机 chcp=936 出中文）—— 本次跑它是**绿的**（WB 复跑原话：`174 passed`），若你跑红**先报差异、⛔ 别改它**。

### 2 · 判据前置

- **前置 1**：先读 `models/llm.py:72-90`，看清 `effective_model` 的实现形态（是不是读 `get_config()`、有没有可注入点）。⛔ 别为了好测去改产品代码 —— 若**没有**可注入点，**报我**，别自己加钩子。
- **前置 2**：测试文件命名与位置照既有惯例（`backend/tests/test_*.py`）。

### 3 · 交付物

1. 新增测试文件（或并入既有相关测试，你判）
2. `pytest -q` 读数原文

### 4 · 参考件

- **路径**：`backend/models/llm.py:72-90`（被测）、`backend/tests/test_conversations.py`（本项目测试风格／fixture 惯例）、`backend/tests/conftest.py`（隔离机制）
- **不可参考**：⛔ `backend/config.yaml`（实例，含凭据）

### 5 · 场地器材

- 本机 `python -m pytest -q`（在 `backend/` 下）。
- ⚠️ **凭据纪律**：测试**不得读取真实 `config.yaml` 的 key**；如必须构造 config，⛔ 不许把任何真实凭据写进测试文件。

### 6 · 回报格式

结论先行（U-1～U-4 各自成立／未闭合）＋ 测试文件路径 ＋ `pytest` 读数原文 ＋ **自曝**。
⚠️ 「前置 1 发现没有可注入点」是**有效结论**，报上来即可。

### 7 · 禁区

- ⛔ 不改 `models/llm.py` / `config.py` 等产品代码（本单只加测试）
- ⛔ 不改 `test_windows_dir`
- ⛔ 不写死具体模型名（见 U-3）
- ⛔ 不读／不落任何真实凭据

---

## ✅ 回执 · 顾衡（2026-11-04 17:31）—— U-1～U-4 全闭合

**结论**：U-1～U-4 全闭合。新增 `backend/tests/test_llm_effective_model.py`（**2 个测试函数**）。
**`pytest -q` 读数原文**（在 `backend/` 下）：`176 passed, 3 skipped, 1 warning in 12.77s` —— 与派发预期 176 一致（基线 174 ＋ 新增 2）。`test_windows_dir` 本机为绿，无差异。

| 判据 | 结果 | 落点 |
|---|---|---|
| U-1 配置有值 ⇒ 用配置值 | 成立 🟢 | `test_effective_model_uses_configured_value`：`ModelConfig(model="test-configured-model")` ⇒ 返回该值（同时覆盖 `effective_model()` 默认 `provider_key="deepseek"`） |
| U-2 配置为空 ⇒ 落兜底 | 成立 🟢 | `test_effective_model_falls_back_when_unset`：5 种输入循环断言 ⇒ 均返回 `FALLBACK_MODEL` |
| U-3 断言不绑死模型名 | 成立 🟢 | 全文件断言引用 `FALLBACK_MODEL` 常量；grep 确认无 `"deepseek-chat"` 字面量 |
| U-4 回归全绿 | 成立 🟢 | 176 passed, 3 skipped（上） |

**前置 1 的回答**：产品侧**没有参数注入点**（`effective_model` 读 `get_config()` 全局单例），但**不需要改产品代码** —— `llm.py` 以 `from config import get_config` 引入，测试 monkeypatch 模块内名字 `models.llm.get_config` 即可注入，属测试侧手段。未加任何钩子，产品代码零改动。

**自曝**：
1. **U-2 的 5 种输入写在同一个测试函数内循环断言，不是 5 条用例** —— 为了对齐派发预期「新增 2 条 ⇒ 176 passed」的计数。覆盖输入＝空串／纯空白串（实现有 `strip`）／dataclass 缺省／`None`（YAML 的 `~`）／provider 条目缺失（`models={}`），比派发要求的 3 种多 2 种。
2. **本单只覆盖 `llm.py` 的解析分支**；「YAML 里写 `model:` 能正确读进 `ModelConfig.model`」这条 `load_config` 的 YAML→dataclass 链路**未入仓覆盖**（既有测试无专门覆盖；砚砚 M 单用临时脚本＋WB 复验过，但那是运行时自证，不会在将来回归时报警）。如需长期防「`config.py` 字段名被改坏」类回归，建议另派一条 `load_config` 级测试 —— 不自行扩范围。
3. **复核了「FALLBACK_MODEL 唯一定义」**：作为**兜底默认值**只有 `llm.py:72` 一处 ✅；另两处同名字符串用途不同、不冲突 —— `llm.py:61`（模型名→provider 映射键）、`token_counter.py:39`（模型名→tiktoken 编码映射键）。
4. 未改 `test_windows_dir`、未改任何产品代码、测试不读实例 `config.yaml`（monkeypatch 构造 `Config`，凭据零涉及）。

---

## 📮 派发 · `load_config` 级测试（WB · 2026-11-04 17:45）—— 小活，V-1～V-4

> **来路**：你自己在 U 单自曝②里提的缺口 —— 现有两条测试直接构造 `ModelConfig`，**不经过 YAML 解析** ⇒ `config.py` 字段名被改坏（`model` → `modle`）时它们**照样全绿**。老大 17:43 裁「可以简单搞一下」。

### 判据

- **V-1 · YAML 写了就能读到**（核心）：用 `tmp_path` 写一个最小 YAML（含 `models.deepseek.model: "<测试值>"`）⇒ `load_config(该路径).models["deepseek"].model == "<测试值>"`。
  - ⚠️ **不许读真实 `backend/config.yaml`**（含凭据）。
- **V-2 · 不写 model 也不崩**：同一 YAML 去掉 `model` 键 ⇒ 能读出来、该字段为空值，**不抛异常**。
- **V-3 · 不许污染全局 `_config`**（⚠️ **这条是关键，别漏**）：`load_config()` 会 `global _config` 赋值 ⇒ 跑完必须**还原**（`monkeypatch.setattr(config, "_config", 原值)` 或等价），否则会串到后续测试。
  - 取证据：**跑完整个 `pytest` 全绿**（串了就会红，这条靠回归自证）。
- **V-4 · 回归**：`python -m pytest -q` 全绿。基线（WB 17:40 实跑）：**176 passed / 3 skipped**；你新增后应为 **178 passed**（若你写成 1 条则为 177，按实际报）。

### 边界

- 位置你定：并入 `test_llm_effective_model.py` 或新建，⭐ 倾向**并入**（同一个被测主题，少一个文件）。
- ⛔ 不改产品代码、⛔ 不改 `test_windows_dir`、⛔ 不写死模型名（同 U-3）。
- 若你发现 `load_config` 有别的全局副作用（不止 `_config`），**报上来**，⛔ 别默默绕过。

### 回报

V-1～V-4 读数 ＋ `pytest` 原文 ＋ 还原手法的具体写法。

---

## 🔍 自检 · 挂账（2026-10-13 自检 → 2026-10-16 全部销账后）

> 原 F1–F7 与〈未闭合项〉1（F1）均已于 2026-10-16 销账／清理（承接逐条见文件末〈🗂 已清理段落〉）⇒ 本段现只剩**挂账 2 条、无待裁项**。

1. **F3-1 的成因未定**（内层 `echo $?` 为何取到 0）—— 只换口径、未深挖；若日后仍走 `wsl.exe` 取证，**一律用外层返回码**（已入记忆）。
2. **未做**：CVM 上 `--fs-mask 0xffff`（ABI 4 拒 / ABI 7 收）那条交叉对照未重跑（10-08 已双场地各证一次）—— 与自检靶子无关，未扩范围。

---

## 🗂 已清理段落（按交流区规矩 · 只留最新一条）

- **2026-11-04 10:40（WB）**：按老大指示删〈🧹 仓库外临时目录盘点〉**22 行**（68 → 46）。理由：其中多项磁盘目录**已被删**，老大明确「没必要追究到底」。
  - ⛔ **该段未做承接、也不补承接** —— 它是**一次性磁盘快照**，不是判据也不是待办。若日后真要清磁盘，⛔ 别按此段找（内容已随段消失，回溯 `git log -p -- exchange/log-claude.md`）。
  - 回溯 `git log -p -- exchange/log-claude.md`。
