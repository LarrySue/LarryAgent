# Claude 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---

## 📌 当前派发（2026-09-10 · DSH-3 前置件 1）— 待接

### 任务：实现 `--real-api` 等价物（真实调用断言机制）

**这是 DSH-3 的硬门禁，不是优化项。** 文档 §3.6 原话：「测试基建（临时库隔离 / 真实库 fail-fast / `--real-api` 占位符机制）须在 **DSH-2** 设计到位——**不提前设计，DSH-3 起每步验证都裸奔**」。前两项你已在 DSH-2.4 交付（WB 复验 5/5 通过），**第三项本阶段没做**。

#### 为什么现在必须补（WB 实测，不是推理）

DSH-2.5 ④ 四组对照实跑证明：**无 Key / 错误 Key / 已关闭 Key 三种失败，在 `exit 0`、session 建立、有事件流这三项上与成功完全一致。**

| 场景 | exit | finalResponse | assistant/message | turn/end.reason.error.code |
|---|---|---|---|---|
| 有效 Key | 0 | `PROBE-OK-2026` | 有 | （无） |
| 无 Key | 0 | 空 | 无 | MISSING_CREDENTIAL |
| 错误 Key | 0 | 空 | 无 | AUTH / 401 |
| 已关闭 Key | 0 | 空 | 无 | AUTH / 401 |

DSH-3 的 S0 验收口径是「消息往返 + 事件落盘 + 回读」——**这三项每一项都能在上述假绿灯下通过**。带着这个洞进 S0，等于全程用不可信的绿。

#### 交付标准

1. **开关机制**：默认**跳过**所有真实 API 用例；显式开启（环境变量或 flag）才注入 Key 并执行。
2. **断言层**（核心，判据直接取上表）：
   - 成功 ⇔ `assistant/message` 事件存在 **且** `finalResponse` 非空 **且** `turn/end.reason` 不存在
   - `exit 0` / session 建立 / 有事件流 —— **三项一律不得作判据**（写进代码注释，注明「勿回退」）
   - 失败时**必须输出 `turn/end.reason.error.code`**，便于人查因。**错误 Key 与已关闭 Key 同为 `AUTH`/401，输出层不可区分**——这条要写进注释，避免将来有人据此写"自动判因"逻辑
3. **反向哨兵**（沿用 DSH-2.4 教训：**护栏类验收必须人为制造违规、看是否报警**）：
   - R1：人为注入错误 Key → 断言须 **fail**（不是 skip、不是 pass）
   - R2：不开开关时跑 → 用例必须被 **skip**，且报告里显式标注 skipped（**不得静默当通过**）
   - R3：人为在临时目录写 Key 明文 → teardown 残留扫描须**告警**
4. **Key 残留扫描**：该模式会引入 Key 明文，须接入你在 DSH-2.4 已建的 `scanForKeys`（`global-setup.ts` 主进程 teardown，**先扫后删**，顺序勿调回）。
5. **示范用例**：至少一个真实调用用例（有效 Key 绿）+ 一个 skip 示范。

#### 红线

- 🔴 **不得让「无 Key 时跳过」退化成「无 Key 时假装通过」** —— skip 与 pass 在报告里必须可区分。
- 🔴 **不得用 `exit 0` 判成功**（见上表，三种失败都是 exit 0）。
- 🔴 **Key 只走环境变量，不落任何文件**（含报告、日志、fixture）。日志里 DSH 会脱敏成 `****3c36`，但**后 4 位会进 session 日志** → 别把 session 日志整段打进测试输出。

#### 环境前置（漏了会伪装成被测对象故障）

1. **每次跑 `dsh` 前先清 profile 孤儿锁**：`rm -f ~/.dsh/profiles/node_modules.lock`。
   这把锁**每次运行都留**（连 `--dump-config` 也留），孤儿锁永不自动回收 → 表现为 `initialize timed out after 20000ms` / `JSON-RPC input closed`，**极易误判为 SDK 握手有问题**。WB 本轮连撞三次才定位。
2. **真实模型调用约 106 秒**，而 `harness/scripts/dsh-prompt.mjs` 内置 `initializeTimeoutMs: 20_000` → **超时 ≠ 失败**。要么调大超时，要么复跑。
3. 其余本机环境约束见 `docs/dsh/dsh-local-env.md` §1 / §6。

#### 起点

- 已有脚本：`harness/scripts/dsh-prompt.mjs`（sdk profile + stdio JSON-RPC，WB 四组对照就用的它）
- 已有基建：DSH-2.4 的临时库隔离 + fail-fast 哨兵 + key 残留扫描（vitest global-setup）
- 判据原文：`docs/dsh/dsh-local-env.md` §6

**不需要 Key 也能做**：机制与断言层是本任务主体，真实调用用例可走 skip 路径自证。**若需实测真 Key，向老大要临时 Key，用完即关**（不要复用任何历史 Key，那几个都已关闭）。
