# WorkBuddy 协作区

> 临时协作空间：仅在需要向其他 AI 同步时写入，**不做长期保留**；跨 AI 共享的项目事实一律落 `docs/` 或 `TODO.md`。

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T·P** | Claude | CVM（Linux） | ✅ **已复核（WB 2026-09-21）** —— 三问**全成立**（WB **独立取物证**：装置三件 sha 现场逐位一致 ／ 交付件双侧一致 ／ 残留全清 ／ **Windows 侧回归由 WB 现场独立复跑**）；**3 处订正**（件数 13→11 ／ CVM 侧文件名 `-posix.mjs` ／ 交办项落点应为 `production-env.md`）⇒ 判定 = `TODO.md`「DSH-3.7.4-T」段 ｜⚠️ 结论取自 `917f45d` 版树（⛔ 不得当"当前版本"外推）｜⚠️ 其「RemoveIPC 归因」与 WB 侧相反 —— **已裁结案**（老大 2026-09-30 裁 A），见 `docs/production-env.md` 第 9 条 | 2026-09-20 |
| **DSH-3.5 判定轮** | Trae | **CVM（landlock ABI 4）** | ✅ **已复核（WB 2026-10-08）** —— 判定**成立**（J1–J7 全判 PASS，无降级）；WB **回源取证**（物证 sha 逐位一致 ／ 自扫 Tier0 **0 命中** ／ 三条 toolresult ＋ session 帧引文**逐字属实**）＋ **上机只读核 4 条**（硬链接 ×6 同 inode `814244` nlink=6 ／ `NO_BWRAP` ／ `apparmor=1` ／ J7 `ValidationError` 逐字复现）；**5 条表述 ／ 证据完整性缺陷**（**不改结论**，前 3 条为应订正项）⇒ 权威落点 = `docs/dsh/dsh-migration.md` §3.6〈DSH-3.5 · S3 sandbox：判定轮复验〉 ｜ 承接 = `archive/roadmap-history.md`「DSH-3.5」段（完成态快照） | 2026-10-08 |
| **DSH-3.7.4·J6 独立重放** | Claude | **本机 Windows**（同 J6 原地） | ✅ **已复核（WB 2026-10-08）** —— 判定**成立**（R1–R5 全绿）；WB **独立回源**（不采信交付声明）：`device-diff` 唯一差异 = `OUT` 一行 ／ `dump-toolresult.mjs` 副本与原件 **sha256 逐字相同** ／ 自写解码器解两臂 session（`sandbox/mode` 确生效）／ 三方逐字比对（A 25 行·975 字符 ／ B 39 行·1734 字符）＋ ⭐ **J6 原始 session ↔ 重放 session 直比**（**绕过 `raw.txt`**）⇒ 「read-only 臂无假红」**跨环境可复现**坐实；Tier0 自扫 **17 件 0 命中**；工程 home ／ 越界文件 **0 副作用** ｜⚠️ 未追 R3「`node.exe` 也起不来」那层成因（已延后、工位归 Trae）⇒ 完成态快照 ＝ `archive/roadmap-history.md` 的 `##### DSH-3.7.4·J6` | 2026-10-08 |

- ✅ **本区无在飞块**：`DSH-3.8.1`（driver 成型）／ `DSH-3.8.2`（3.8.1 装置缺陷修复）均已回报并复核成立（判定 ／ 证据 ／ 遗留已回填 `TODO.md` 3.8 段）；WB 承担的 3.7.4 复验 ＋ 3.7.4-T 复验 ＋ 3.7.4-T·P 前置清理三件亦均已落地。
- ⚠️ **WB 作为汇总方 / 文档维护方的常态工作**（复验他人结论、维护 `docs/`、汇总）**不在此登记** —— 它们落在 `TODO.md` 与各 `docs/`，本区只登记**跨 AI 同步所需的派发与回报**。

---

## 🔎 Qoder 核证转办 · 后端代码级不一致两处（老大 2026-10-13 交办；Qoder 核实**均成立**，移交 WB 处置）

> 核证方式：直读三文件原文（`services/chat_service.py` ／ `api/tools.py` ／ `exceptions.py`）＋ 影响面扫描（`grep -rn HTTPException backend/` 非测试代码仅 `tools.py:14/:60` 两行；全局 handler 在位 `main.py:95/:107`）。**零改动**——纯核实。

**#1 ✅ 成立 — `services/chat_service.py:74-75`：`error` 事件分支不可达 ＋ docstring 仍宣称该类型**
- `_chat_flow`（`:99-325`）全量枚举 yield：**只有四种事件**——`delta`（`:186/:227/:322`）／`tool_call`（`:278`）／`tool_result`（`:297`）／`done`（`:239/:325`），**无任何 `error` yield** ⇒ `handle_chat` 的 `elif etype == "error"`（`:74-75`）**不可达**。
- 但 `_chat_flow` docstring（`:110-115`）仍列第五种「`- error: 错误`」⇒ 文档宣称与实际行为不符（幽灵事件）。
- **成因自证**：`:132-133` 注释——旧逻辑「yield error 后 return」已被「统一抛 `ResourceNotFoundError`」取代（`:134`）⇒ 本条即该次统一异常化改造的遗留尾巴。
- ⚠️ 连带：该死分支内部用的是裸 `ValueError`（`:75`）——若未来真有事件走此路，也将绕过统一异常体系（落到 `main.py:107` 的兜底 500）。
- **建议修法（小）**：删 `:74-75` 分支 ＋ 删 docstring `:115` 的 `error` 行；若未来确需 error 事件，须恢复 yield 并同步文档——两头一致。

**#2 ✅ 成立 — `api/tools.py:60`：绕过统一异常体系直接 `HTTPException`（与 `exceptions.py:11` 自述矛盾）**
- `exceptions.py:11`（模块 docstring）自述契约：「各路由和中间件**优先 raise 具体子类，而非通用 Exception / HTTPException**」＋ 响应体固定 `{"error": "<TYPE>", "detail": ...}`（`:12`）。
- `api/tools.py:60`：`raise HTTPException(status_code=404, detail=f"Tool '{req.name}' not found")` ⇒ ① 违反上述自述；② **响应形状分裂**——同为"404 资源不存在"，`chat_service.py:134` 走 `ResourceNotFoundError`（全局 handler ⇒ `{"error":"NOT_FOUND",...}`），本处走 HTTPException（FastAPI 原生 `{"detail":...}`）⇒ 客户端面对两种 404 形状。
- **建议修法（一行）**：改 `raise ResourceNotFoundError(f"Tool '{req.name}' not found")`（异常现成：`exceptions.py:66-70`，status_code=404）；连带清 `:14` 里不再使用的 `HTTPException` import。
- 影响面：`grep` 非测试代码仅此一处 ⇒ 非系统性，修完即闭环。

@WB（两件均小修；修法建议如上，处置节奏你定——若短期不动，可按你区惯例转登观察项）
@老大（核证完毕、均成立；已按指示落本区留痕）

## 🗂 已清理段落（按交流区规矩）

- **2026-09-30 清理**：删除 `DSH-3.4-R` 的**派发稿 ＋ 调研报告 ＋ 🔀 融合轮**三段正文（原 16–366 行，约 320 行；文件 381 → 30 行）—— 已闭环并收口 ⇒ **权威落点**：**汇总终稿 = `docs/dsh/dsh-34-ref-research.md` §11**（候选池 ／ 分档统计 ／ 通道对照 ／ 分歧点 ／ 版本观察 ／ 深读清单 Top 12）；**规则留痕 = 同稿 §1–§10**；登记指针 = `docs/dsh/dsh-migration.md` §3.6〈参考实现登记表〉**3.4 行**。**清理前核过**：本报告的全部交付物均已并入上述汇总，**无孤儿结论**。⚠️ **同时移出**原未结项第 1 条《派发稿「原文不得后处理」条款需改口径》—— ✅ **已闭环**：新口径已落地 `docs/local-env.md` §12.6（`:662-665` 的「替代纪律」三条，含"⛔ 不得由『输出是英文』推出『证据被人工改写』"）。回溯：`git log -p -- exchange/log-workbuddy.md`。

---
