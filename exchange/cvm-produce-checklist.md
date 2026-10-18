# CVM 产出回传核对表（DSH-3.9 收口项 · 2026-10-18）

> **本稿性质**：`TODO.md` 收口项「CVM 产出回传核对表」的交付件（专题稿，非长期文档）。
> **执行人**：WB（分工见 `TODO.md`「3.9 收口核对表 ／ 复验他人结论 → WB」）。
> **取证方式**：`ubuntu@49.232.129.252` 上**只读枚举** ＋ 逐文件 `sha256sum` 生成本地清单；本机侧对 `_trae-cvm-evidence` / `_claude-cvm-evidence` / `_claude-evidence` 全量算 sha **按内容比对**（不按路径，因两侧目录结构不同）。
> **回传落点**：`D:\Code\_cvm-inv\`（清单 ＋ 回传包 ＋ 解包目录）。

---

## 1 · 结论（一句话）

CVM 侧 **216 个文件**已**全部**在本机有同 sha 副本 —— **缺失 0，无唯一副本**。
本次补回 **39 件**（此前本机无同 sha 件），合计 119 KB 打包；`~/larry-data/larry.db`（该机独有原件）已回传。

## 2 · 逐项核对表

| # | 项（TODO 原列） | CVM 路径 | 机上实况 | 处置 | 本机落点 |
|---|---|---|---|---|---|
| 1 | **会话库** | `~/larry-dsh-home/sessions/` | 2 个 project 目录 / **9 个** `session.jsonl.zstd`（164 KB） | ✅ **本次补回 9 件** | `_cvm-inv/cvm-produce/larry-dsh-home/sessions/` |
| 1b | 会话投影缓存 | `~/larry-dsh-home/storages/session_projcache/` | 4 个 `*.json`（24 KB） | ✅ **本次补回 4 件** | 同上 `.../storages/` |
| 2 | **SQLite 原件** | `~/larry-data/larry.db` | **57,344 B（56 KB）** · 4 表：`units`=2 ／ `unit_globals`=0 ／ `u_session_projcache_sessions`=10 ／ `u_larry_probe_items`=1 | ✅ **本次补回** | `_cvm-inv/cvm-produce/larry-data/larry.db` |
| 3 | **ChromaDB** | `~/.cache/chroma/` | 仅 `onnx_models/all-MiniLM-L6-v2`（2.4 MB）—— **模型权重缓存，不是数据** | ⬜ **无需回传**（可重建，非唯一副本） | — |
| 4 | **日志与曲线** | `~/trae-evidence/mem-sample.csv`（13,244 B）＋ `sampler.sh` ／ `sampler.log` | 采样器与小时级曲线在位 | ✅ 已在本机（sha 匹配） | `_trae-cvm-evidence/` |
| 5 | **dump-config 快照** | **机上未落盘**（`grep typert-gateway` 全盘 0 命中，排除 node_modules） | 当时 dump 输出未存机 | ✅ 已在**本机**（Claude 3.7.3 两版对照） | `_claude-evidence/373t/t1a/372-{un,}patched.dump-config.out.txt` |
| 6 | **复现脚本** | `~/ll-probe/landlock_probe.py` | 探针脚本 | ✅ **本次补回** | `_cvm-inv/cvm-produce/ll-probe/` |
| 7 | 证据包（Trae） | `~/trae-evidence/`（832 KB）、`~/s0-evidence.tgz`（44 KB）、`~/larry35-out/`（240 KB）＋ `.tar.gz`、`~/larry35-sbox/`（20 KB） | — | ✅ 大部已在本机；**larry35-sbox 2 件本次补回** | `_cvm-inv/cvm-produce/larry35-sbox/` |
| 8 | 证据包（Claude） | `~/claude-tp-evidence/`（96 KB）、`~/claude-305/` | — | ✅ 已在本机 | `_claude-cvm-evidence/` |
| 9 | 证据包（Qoder） | `~/qoder-evidence/`（100 KB，22 件） | — | ✅ **本次补回 22 件** | `_cvm-inv/cvm-produce/qoder-evidence/` |

## 3 · 校验值

| 对象 | sha256 |
|---|---|
| 回传包 `cvm-produce-20261018.tgz`（119,239 B） | `8c5f861b26cd146dd2f1666e8e31342284a6a578d11316f6e557724cac8a80a8` |
| 清单 `produce-manifest-20261018.txt`（216 行 / 23,061 B） | 见本文件夹（按内容比对即校验） |

**闭环验证**：回传前「216 件中 39 件本机无同 sha 副本」；回传解包后重跑比对 ⇒ **216 匹配 / 0 未匹配**，且解包文件数 **= 39**（与缺口数一一对应）。tar 包本机复算 sha 与 CVM 侧一致 ⇒ 传输无损。

## 4 · 两处事实订正（写文档时请以本表为准）

1. ⚠️ **`larry.db` 已不是 36 KB**：`TODO.md` 记「36 KB，该机独有的证据原件」，实测 **56 KB / 57,344 B**（mtime `2026-09-16 18:47`）。原 36 KB 是更早时点的读数，未更新。
2. ⚠️ **"ChromaDB 产出"在机上不存在持久数据**：只有模型权重缓存目录。ChromaDB 若当时走 HTTP client，数据在其服务侧/内存，机上本就不落盘 ⇒ **本项应记为「无需回传」，不是「遗漏」**。

## 5 · 边界与未覆盖

- **监控曲线（云侧）**：腾讯云 Lighthouse 自带的 CPU/流量曲线属**平台侧数据**，不在机上、也不属本项目产出 ⇒ 本表不含；如需留档须在控制台导出。
- **本表只证「文件都在」**，不证「内容正确」—— 内容层面的判定在各切片的复验节（交流区 `log-*` 为活日志、**已随清理不可查**；权威落点 = `TODO.md` 各切片条目 ＋ `docs/dsh/dsh-migration.md` §3.x）。
- 回传目录 `D:\Code\_cvm-inv\` 在仓库外（与既有 `_trae-cvm-evidence` 同惯例），⛔ 不进 git。

---

**后续（待 Qoder 承接）**：本表内容应并入 `docs/`（建议 `docs/test-env.md` 的 CVM 产出回传节，或 `docs/production-env.md` 附录）；并入后本稿按交流区规矩清理，`git log -p` 可回溯。
