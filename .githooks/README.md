# 仓库钩子（`.githooks/`）

本目录是**受版本控制的 git 钩子**（用 `core.hooksPath` 指向它，而非 `.git/hooks/`）。
好处：钩子随仓库分发、可审阅、可回溯；`.git/hooks/` 那份是每台机各自私有的。

## 安装（每台机器 / 每个工作副本各做一次）

```sh
cd <仓库根>
git config core.hooksPath .githooks
git config --get core.hooksPath    # 应输出 .githooks
```

> ⚠️ `core.hooksPath` 是**本地配置**（存 `.git/config`，不入版本控制）⇒ 新克隆 / 新机器须重跑上面一句。
> ⚠️ 设了它之后，`.git/hooks/` 下的钩子**全部失效**（本仓库那两份是空壳，无影响）。

## `pre-commit` · 凭据形态扫描

**拦住什么**：把 API key / token 明文提交进库 —— 尤其是"把 `backend/config.yaml` 片段粘进
记录 / 文档"这条旁路（`backend/config.yaml` 自身受 `.gitignore` 保护，但**粘出来的副本不受保护**）。

**扫什么**：`git diff --cached -U0` ⇒ 只扫**本次提交新增的行**（⛔ **不扫整个 index** —— 首版用 `git grep --cached` 会把历史遗留的旧凭据一并报出，任何提交都被拦，等于把钩子变成无差别阻断器；2026-10-13 实测揪出并修正）；命中形态：
- `sk-` 后接 20+ 位字母数字
- `Bearer` / `token` 后接 20+ 位
- `api_key` / `password` / `secret` 后接 16+ 位的引号串

**命中时**：打印 `文件:行号`（⛔ **不回显命中值**）并**阻断提交**。

### 豁免通道（任一即可）

| 通道 | 用法 | 适用 |
|---|---|---|
| 环境变量 | `LARRY_ALLOW_CRED=1 git commit ...` | 批量提交**已授权的临时 key** |
| 行内标记 | 该行任意位置写 `cred-scan:allow` | 哨兵 / 示例 / 文档里讨论 key 形态 |
| 路径白名单 | `harness/tests/sentinel-*`（脚本内） | 哨兵测试文件（整文件豁免） |
| git 内建 | `git commit --no-verify` | 应急绕过全部钩子 |

### 已知边界

- **不是"防泄露"的全部**：它只扫**本次暂存**的内容。**已在历史里的**（如已提交的旧记录）它管不了
  —— 那种情况只能用「**作废 + 轮换**」，因为 git 历史抹不掉。
- **形态匹配 ≠ 真凭据**：它会命中哨兵 / 占位 / 文档示例 ⇒ 所以豁免通道是必需的，命中不等于"泄露"。
- **扫描面 = git 可见范围**（`git diff --cached`；被 `.gitignore` 忽略的文件本就无法暂存 ⇒ 天然不在扫描面）—— 对本用途**正确**
  （要防的正是"进库"）；若要找"磁盘上哪里有明文"是另一件事，需 `--no-ignore` 全盘扫。
