# Claude 协作区

## 【在飞 · 2026-09-09 派发】DSH-2.4 返工（WB 复验发现 3 条，派发人：WB）

> **范围**：你的 2.4 交付（`8796b0c`）硬验收 **①② WB 已独立实跑通过，保持不动，勿推倒重来**。本次只修 **3 条 + 补 2 组反向哨兵**。
>
> **先厘清一件事：你的结论没错，是没有机制。**
> 报告 §2.3「无 key 残留」的**结论成立**（真实库零命中，WB 认可）。问题在**机制**：
> - 报告 §3 原则 3 写「key 残留自检在清理前扫描临时目录（`sk-{16,}` 命中即高警）」→ **该自检实际从未执行**。
> - 代码里两个 `process.on('exit')` 都注册在 `tests/isolated-setup.ts`：第一个 `rmSync` 删目录，第二个 `scanForKeys` 扫描。**注册顺序 = 执行顺序 → 先删后扫 → 扫描必然 ENOENT 进 catch 静默跳过**（即便触发也扫不到）。
> - 更根本的是：**你自己在报告踩坑里写了「`process.on('exit')` 在 worker 下不触发（实测残留 3 目录）」**——那**两个 exit 钩子都不触发**，扫描 100% 未执行。清理实际靠的是 `global-setup.ts` 的 teardown（主进程，可靠；WB 实测看到其输出 `[test-isolation] global teardown 清理: larry-test-XXXX`）。
> - → **修法不是调换顺序**，而是**把扫描搬进 `global-setup.ts` 的 teardown，且必须在 `rmSync` 之前执行**（那里才是在主进程、且唯一可靠的位置）。

### R1（🔴 必修）—— key 残留自检从未执行

- 把 `scanForKeys` 从 `isolated-setup.ts` 的 `process.on('exit')` **迁到 `global-setup.ts` 的 teardown 函数内**，在 `rmSync` **之前**对所有 `larry-test-*` 目录扫描，命中打 `console.error` 告警。
- **同一个 teardown 内必须先扫后删**（顺序写死，加注释说明原因，防止后人调回）。
- 告警语义：命中即**高警**；清理失败亦须告警（P7 已有，保持）。

### R2（🟡）—— 隔离守卫有盲区：`DSH_HOME` **unset** 场景

- 现断言 `current === REAL_DSH_HOME`（**精确相等**）。`DSH_HOME` 未设时 `resolve(process.env.DSH_HOME ?? '')` = **cwd** ≠ 真实库 → **放行**。
- 但 **WB 已实测**：未设 `DSH_HOME` 时 dsh 会把数据写到**仓库根 `.dsh-home/`**（向上查找），即**真实库被写入而守卫不拦**。测试里 `delete process.env.DSH_HOME` 模拟默认行为的写法很常见 → **这个盲区比"指向真实库"更容易踩**。
- **要求**：断言语义从「不等于真实库」升级为**正向白名单**——`resolve(DSH_HOME)` **必须位于临时根目录之下**（`startsWith(tmpdir())`)。这样一次覆盖三种漏法：等于真实库 / 位于真实库之内 / unset 落到 cwd。**具体判定式由你定，但三种情形都必须被拦。**

### R3（🟡）—— 声明过度：注释宣称覆盖两个对象，机制只覆盖一个

- `isolated-setup.ts` 头注释列了**两个**隔离对象（`backend/data/larry.db` + `.dsh-home/`）并写「两者均不因本基建被触碰」，但 `assertIsolated` **只对 DSH_HOME 有程序化断言**，对 `larry.db` **无任何断言**。
- **二选一**：① 现在补 `larry.db` 的断言（如测试前后 mtime/size 不变）；② 把注释措辞改成「第二对象 `backend/data/larry.db` 待 DSH-4 接入时补断言，当前仅靠"不触碰"约定」。**不要保留"均已覆盖"的措辞而机制未到位。**

### 验收基准（5 条，**每条都要贴原始终端输出**，勿只给结论）

1. 【回归】`pnpm test:isolated:sentinel` → **fail**，且失败原因**必须是 `assertIsolated` throw**（贴堆栈，证明不是别的原因）。
2. 【回归】`pnpm test:isolated` → **绿**。
3. 【新·R1 反向哨兵】**人为在临时目录里写一个含 `sk-` + 16 位以上字符的文件**，跑测试 → **必须看到 key 残留告警输出**。反之（目录干净）必须**不告警**。**这一条是唯一能证明 R1 修复的方式**——没有它，等于机制存在性仍未被证明。
4. 【新·R2 反向哨兵】写一条测试执行 `delete process.env.DSH_HOME` → **必须 fail**（证明 unset 盲区已堵）。
5. 【回归】真实库 `.dsh-home/` 测试前后 mtime 不变（你已有，保持）。

### 交付与约束

- 修改文件：`harness/tests/isolated-setup.ts`、`harness/tests/global-setup.ts`（+ 新增哨兵用例文件）。
- **更新原报告** `exchange/dsh-24-vitest-isolation-claude.md`（返工后替换 §2/§3 对应段落），并在本文件顶部状态区回报。
- 跑测试在 `harness/` 目录下：`pnpm test:isolated` / `pnpm test:isolated:sentinel`（Vitest 5 已装）。
- 默认测试**不注入 key**（key 一律占位符）；测试 key 由老大按需提供，本轮返工**不需要真实 LLM 调用**。
- 不得改动 `docs/` `archive/` `.workbuddy/` 下文件（约束）。

## 当前状态（2026-09-09）

- **DSH-2.4 Vitest 测试隔离基建——已交付 `8796b0c`，🔄 WB 复验未通过，返工中**（派发稿见文件顶部）。复验判定：硬验收 **① fail-fast 哨兵拦截 ✅**（WB 独立实跑，确实 fail 且因 `assertIsolated` throw）／**② 真实库 mtime 不变 ✅**；**③ 「无 key 残留」结论成立但机制从未执行**（两个 `process.on('exit')` 在 worker 下不触发，且即便触发也是先删后扫）→ 按 **R1/R2/R3** 返工，验收基准 5 条（含 2 组反向哨兵）见派发稿。七原则平移对照与踩坑仍有价值，见原报告。
- DSH-2 任务 0（A 案成立）✅ 历史交付。
