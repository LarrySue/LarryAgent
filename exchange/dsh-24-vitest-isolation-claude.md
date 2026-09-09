# DSH-2.4 测试隔离基建（Vitest）——Claude 交付报告

> **执行者**：Claude Code（测试方）
> **日期**：2026-09-09
> **基线**：`dsh-v0.1.2-rc.1`（锁定）；harness/ 为 Trae DSH-2.1~2.3 交付后状态
> **参照物**：`backend/tests/conftest.py`（七条设计原则平移，非代码平移）

---

## 1 结论一行

**基建可跑。** 三条硬验收全部达成（原始输出见 §2）：fail-fast 真的会拦 / 真实库零触碰 / 无 key 残留。

## 2 三条硬验收原始输出

### 2.1 fail-fast 真的会拦（硬验收 1）

哨兵测试 `tests/sentinel-failfast.test.ts` 故意在模块加载时把 `DSH_HOME` 指回真实 `.dsh-home` → 全局 `beforeEach` 守卫拦截：

```
 FAIL  tests/sentinel-failfast.test.ts > ... > 污染 DSH_HOME 指向真实库时应被隔离守卫拦截
Error: [test-isolation] FAIL: DSH_HOME 指向真实库 D:\Code\LarryAgent\.dsh-home。测试不得触碰真实 .dsh-home——请勿在测试中覆盖 DSH_HOME 指向真实路径。
```

（正常路径 `tests/guard.test.ts` 同文件全绿——护栏存在且不误伤。）

### 2.2 真实数据未被触碰（硬验收 2）

```
跑前 mtime: backend/data/larry.db 1788027498
跑后 mtime: backend/data/larry.db 1788027498   ← 未变
.dsh-home/sessions/ 子目录数：3（Trae DSH-2.x 产物，本次零新增）
```

### 2.3 无 key 残留（硬验收 3）

```
测试后 /tmp/larry-test-* 残留：0（global teardown 清理）
真实 .dsh-home/profiles/larry/ grep sk-{16,}：零命中（key 走环境变量，profile 配置无 key 明文）
```

## 3 设计说明：七原则 Vitest 等价对照

| # | Python 原则 | Vitest 等价实现 | 状态 |
|---|---|---|---|
| 1 | 会话级临时配置（真配置为基底只换持久化路径） | `isolated-setup.ts`：mkdtemp 临时 `DSH_HOME`（sessions/storages 全落临时）；**平移说明**：A-framework 下配置源是 profile 而非单一 yaml，本阶段隔离对象 = `DSH_HOME`（数据落点），配置基底平移推迟到 DSH-4 有真实 config 时 | ✅ 等价 |
| 2 | 环境变量时序（conftest 先于收集） | **setupFiles 先于测试文件静态 import**——已实测（时序探针：setupFiles 设的 env 在 import 时可见） | ✅ 实测确认 |
| 3 | key 一律占位符 | 基建不注入任何 key（DSH key 走环境变量，测试路径无 key）；key 残留自检在清理前扫描临时目录（`sk-{16,}` 命中即高警） | ✅ |
| 4 | 密钥判定模式匹配（`endswith("_api_key")` 禁子串） | 平移说明：本阶段基建无密钥字段替换需求（不生成配置）；**该原则在 DSH-4 生成临时 config 时生效**——已记录为后续实现的硬约束（勿用 `"token" in k` 子串） | 📌 推迟生效（原因：本阶段无配置生成） |
| 5 | 断言"行为"非"动作" | `assertIsolated()`：resolve 当前 `process.env.DSH_HOME` 后与真实路径比对（**解析后比对**，不比对"设过哪个变量"）；全局 `beforeEach` 注册 = 每测试前自动断言（等价 Python autouse fixture） | ✅ |
| 6 | `--real-api` 开关 | 平移说明：本阶段无真实 API 用例（无 LLM 测试）；开关语义在 DSH-6 接 e2e 时实现（默认跳过 + 显式开注入 key + 残留高警） | 📌 推迟（无真实 API 用例故无开关需求） |
| 7 | 清理失败告警不静默 | 双层：setupFiles `process.on('exit')`（**实测 worker 下不触发**——Vitest 线程模式 exit 钩子失效，曾残留 3 目录）+ **globalSetup 返回 teardown 函数**（主进程跑完所有 worker 后删全部 `larry-test-*`，可靠兜底，失败打 stderr） | ✅（含踩坑修正） |

**关键时序发现（原则 2 的实测答案）**：setupFiles 先于测试文件静态 import 执行（Vitest 保证）——等价 conftest 先于 pytest 收集。**但 process.on('exit') 清理钩子在 Vitest worker 下不触发**（线程/子进程模式差异），必须用 globalSetup 返回值做 teardown——这是 Python conftest 的 atexit 平移时**不成立**的一条，已用 globalSetup 兜底。

## 4 可复跑步骤 + 踩坑清单

```bash
cd harness
pnpm add -D vitest               # 已装
npx vitest run tests/guard.test.ts           # 正常路径：绿
npx vitest run tests/sentinel-failfast.test.ts  # 哨兵：红（护栏在）
npm run test:isolated / test:isolated:sentinel  # package.json 已加脚本
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
harness/package.json                  # 加 test:isolated 脚本
```
