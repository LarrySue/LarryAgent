# DSH-2.4 测试隔离基建（Vitest）——Claude 交付报告

> **执行者**：Claude Code（测试方）
> **日期**：2026-09-09
> **基线**：`dsh-v0.1.2-rc.1`（锁定）；harness/ 为 Trae DSH-2.1~2.3 交付后状态
> **参照物**：`backend/tests/conftest.py`（七条设计原则平移，非代码平移）
>
> 🔄 **2026-09-09 返工版（R1/R2/R3）**：原交付 `8796b0c` 经 WB 复验，硬验收 ①② 通过、③ 结论成立但机制从未执行（key 扫描挂在 worker 下不触发的 exit 钩子）。返工修复 R1（扫描迁主进程 teardown 先扫后删）/ R2（断言改正向白名单堵 unset 盲区）/ R3（注释措辞），并补 2 组反向哨兵。返工提交 `fb30d77`。

---

## 1 结论一行

**基建可跑。** 五条验收全部达成（原始输出见 §2 / §4）：① fail-fast 真的会拦 ② 正常用例绿 ③ **R1 反向哨兵**——人为写 key 明文后 teardown 确实告警 ④ **R2 反向哨兵**——`DSH_HOME` unset 被白名单拦下 ⑤ 真实库零触碰。

> ⚠️ **首版曾有的缺陷（勿回退）**：首版第 ③ 条**结论对但机制不存在**——key 残留自检挂在 `process.on('exit')`，而该钩子在 Vitest worker 下**不触发**（即便触发也是先删后扫、必然 ENOENT）。现已迁入主进程 `globalSetup` teardown 且**先扫后删**（顺序写死，勿调回）。同理首版守卫用「≠ 真实库」精确比对，**unset 场景放行**（`resolve('')` = cwd），已改为**正向白名单**（必须位于 `tmpdir()` 之下）。

## 2 三条硬验收原始输出

### 2.1 fail-fast 真的会拦（硬验收 1）

哨兵测试 `tests/sentinel-failfast.test.ts` 故意在模块加载时把 `DSH_HOME` 指回真实 `.dsh-home` → 全局 `beforeEach` 守卫拦截：

```
 FAIL  tests/sentinel-failfast.test.ts > ... > 污染 DSH_HOME 指向真实库时应被隔离守卫拦截
Error: [test-isolation] FAIL: DSH_HOME 解析为 D:\Code\LarryAgent\.dsh-home，不在临时根 D:\Temp\Sys 下。测试必须运行在临时 DSH_HOME 内——请勿覆盖 DSH_HOME 为真实路径或删除该环境变量。
```

（正常路径 `tests/guard.test.ts` 同文件全绿——护栏存在且不误伤。）

### 2.2 真实数据未被触碰（硬验收 2）

```
跑前 mtime: backend/data/larry.db 1788027498
跑后 mtime: backend/data/larry.db 1788027498   ← 未变
.dsh-home/sessions/ 子目录数：3（Trae DSH-2.x 产物，本次零新增）
```

### 2.3 无 key 残留（硬验收 3，返工后——机制存在性已证明）

**R1 反向哨兵输出**（人为写 `sk-abcdefghijklmnopqrstuvwxyz123456` 到临时目录，teardown 必须告警）：

```
[test-isolation] ⚠️ KEY RESIDUE: 临时目录残留疑似 key 明文（1 处）——可能 --real-api 模式泄漏，须人工检查: ...larry-test-VpPXZI
[test-isolation]   at ...larry-test-VpPXZI\simulated-leak\creds.txt
[test-isolation] global teardown 清理: ...larry-test-VpPXZI
```

告警先于清理行（先扫后删顺序生效）；干净路径（guard）0 告警；真实 .dsh-home grep sk-{16,} 零命中。

## 3 设计说明：七原则 Vitest 等价对照

> **R3 措辞修正**：原注释宣称隔离对象含 `backend/data/larry.db` + `.dsh-home/` 且均不被触碰——机制只对 DSH_HOME 有程序化断言。已改措辞：**larry.db 待 DSH-4 接入时补断言**（A-framework 下 harness 纯 TS、无 Python 运行路径，larry.db 不可能被触碰，现仅靠约定；DSH-4 引入真实业务模块时须补 mtime/size 断言），注释不再声称"均已覆盖"。

| # | Python 原则 | Vitest 等价实现 | 状态 |
|---|---|---|---|
| 1 | 会话级临时配置（真配置为基底只换持久化路径） | `isolated-setup.ts`：mkdtemp 临时 `DSH_HOME`（sessions/storages 全落临时）；**平移说明**：A-framework 下配置源是 profile 而非单一 yaml，本阶段隔离对象 = `DSH_HOME`（数据落点），配置基底平移推迟到 DSH-4 有真实 config 时 | ✅ 等价 |
| 2 | 环境变量时序（conftest 先于收集） | **setupFiles 先于测试文件静态 import**——已实测（时序探针：setupFiles 设的 env 在 import 时可见） | ✅ 实测确认 |
| 3 | key 一律占位符 | 基建不注入任何 key（DSH key 走环境变量）；**key 残留自检在主进程 teardown 内、rmSync 之前**（R1 修复：原挂在 worker exit 钩子从未触发；先扫后删顺序写死，命中高警） | ✅ R1 |
| 4 | 密钥判定模式匹配（`endswith("_api_key")` 禁子串） | 平移说明：本阶段基建无密钥字段替换需求（不生成配置）；**该原则在 DSH-4 生成临时 config 时生效**——已记录为后续实现的硬约束（勿用 `"token" in k` 子串） | 📌 推迟生效（原因：本阶段无配置生成） |
| 5 | 断言"行为"非"动作" | `assertIsolated()`：**正向白名单**——resolve(DSH_HOME) 必须位于临时根（tmpdir）之下（R2 修复：原"≠真实库"精确比对有 unset 盲区——resolve('')=cwd 被放行，而 unset 时 dsh 向上查找写仓库根 .dsh-home；白名单一次覆盖：指向真实库 / 位于真实库内 / unset 落 cwd） | ✅ R2 |
| 6 | `--real-api` 开关 | 平移说明：本阶段无真实 API 用例（无 LLM 测试）；开关语义在 DSH-6 接 e2e 时实现（默认跳过 + 显式开注入 key + 残留高警） | 📌 推迟（无真实 API 用例故无开关需求） |
| 7 | 清理失败告警不静默 | **globalSetup 返回 teardown 函数**（主进程，唯一可靠位）：先扫 key 残留（命中高警）后删全部 `larry-test-*`，删除失败打 stderr。（原 setupFiles 的 `process.on('exit')` 在 worker 下不触发——实测失效已移除，isolated-setup.ts 不再注册 exit 钩子） | ✅ |

**关键时序发现（原则 2 的实测答案）**：setupFiles 先于测试文件静态 import 执行（Vitest 保证）——等价 conftest 先于 pytest 收集。**但 process.on('exit') 清理钩子在 Vitest worker 下不触发**（线程/子进程模式差异），必须用 globalSetup 返回值做 teardown——这是 Python conftest 的 atexit 平移时**不成立**的一条，已用 globalSetup 兜底。

## 4 可复跑步骤 + 踩坑清单

```bash
cd harness
pnpm add -D vitest               # 已装
npx vitest run tests/guard.test.ts           # 正常路径：绿
npx vitest run tests/sentinel-failfast.test.ts  # 哨兵：红（护栏在）
npx vitest run tests/sentinel-unset.test.ts  # R2 反向哨兵：红（unset 被拦）
npx vitest run tests/sentinel-key-residue.test.ts  # R1 反向哨兵：绿 + teardown 告警 KEY RESIDUE
# package.json 已加 test:isolated / test:isolated:sentinel
```

**踩坑清单**：
1. **Vitest 5 无 `globalTeardown` 配置项**——用 globalSetup 返回值 teardown 模式
2. **`process.on('exit')` 在 worker 下不触发**——清理钩子须放主进程（globalSetup teardown）
3. **`import.meta.dirname`** 可用（Node 20.11+），但哨兵文件里 `resolve` 等须显式 import（首版哨兵因漏 import 报 ReferenceError 而非守卫拦截——教训：哨兵自身也要先能跑）
4. vitest 临时目录前缀用 `larry-test-`（与 Python `larry_test_` 区分避免误清）

## 5 未解决的技术不确定性

1. **`.dsh-home` 向上查找机制已确认**（仓库根 .dsh-home/ 有 `--D-Code-LarryAgent-harness--` sessions 子目录 = Trae 从 harness 跑时写入的实证）——**但 DSH 内部如何定位（cwd 向上找 vs 其他）未读源码确认**；隔离基建以"强制 DSH_HOME"覆盖该机制，不依赖其内部行为，故不阻塞
2. **setupFiles 的 env 是否覆盖所有 worker 并发场景**：多 worker 并行时每个 worker 独立跑 setupFiles（各自 mkdtemp 各自 DSH_HOME）——单 worker 已验证；多 worker 的目录隔离逻辑相同（每 worker 独立 env），但未用多 worker 实测（当前测试量小默认单 worker）
3. **哨兵测试的"污染窗口"**：哨兵在模块顶层污染 env → beforeEach 拦截。若未来业务代码在 **import 时** 就启动 DSH（比 beforeEach 更早），守卫需前移到模块加载级——当前守卫粒度（beforeEach）覆盖"测试执行前"，对"import 副作用"的保护需 DSH-6 引入真实业务模块时复核

## 附：产物清单（均在 harness/ 内，未触碰 docs/archive/.workbuddy）

```
harness/vitest.config.ts              # setupFiles + globalSetup 注册
harness/tests/isolated-setup.ts       # 隔离基建（临时 DSH_HOME + 守卫 + key 自检）
harness/tests/global-setup.ts         # teardown 兜底
harness/tests/guard.test.ts           # 哨兵 1：隔离生效（绿）
harness/tests/sentinel-failfast.test.ts  # 哨兵 2：fail-fast（红=护栏在）
harness/tests/sentinel-unset.test.ts  # R2 反向哨兵：delete env 必须红
harness/tests/sentinel-key-residue.test.ts  # R1 反向哨兵：写 sk- 文件 teardown 告警
harness/tests/global-setup.ts  # R1: 先扫 key 后删目录（主进程 teardown）
harness/package.json                  # 加 test:isolated 脚本
```
