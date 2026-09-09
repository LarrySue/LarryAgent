/**
 * Vitest 会话级测试隔离（DSH-2.4 R2 返工版）
 *
 * 对照 backend/tests/conftest.py 的原则平移（原则不平移代码）：
 *  P1 会话级临时配置 → mkdtemp 临时 DSH_HOME（sessions/storages 全落临时目录）
 *  P2 环境变量时序 → setupFiles 先于测试文件静态 import（已实测验证）
 *  P5 断言"行为"而非"动作" → beforeEach 断言 resolve(DSH_HOME) **位于临时
 *    根目录之下**（正向白名单），非"不等于真实库"——后者有 unset 盲区
 *  P7 清理失败告警不静默 → 见 global-setup.ts（主进程 teardown，本文件
 *    不注册 process.on('exit')——worker 下不触发，实测失效）
 *
 * 隔离对象：
 *  - `.dsh-home/`（仓库根，DSH 运行时数据：sessions/ storages/ profiles/）
 *    → DSH_HOME 正向白名单程序化断言（R2）
 *  - `backend/data/larry.db`（Python 侧 SQLite）→ **待 DSH-4 接入时补断言**
 *    （A-framework 下 harness 为纯 TS，无 Python 代码运行路径，larry.db
 *    不可能被触碰；现仅靠"不触碰"约定。DSH-4 引入真实业务模块时须补
 *    mtime/size 断言——勿将"均已覆盖"当已实现）
 *
 * 真实库定位机制（WB 实测 + 本文件确认）：未设 DSH_HOME 时 dsh 向上查找，
 * 数据落仓库根 .dsh-home/（.dsh-home/sessions/--D-Code-LarryAgent-harness--
 * 即 Trae 从 harness 跑的实证）——unset 场景等同写真实库，须被白名单拦截。
 */
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { beforeEach } from 'vitest'

/** 会话级临时 DSH_HOME（即用即弃）——resolve 后必在 tmpdir 下 */
export const TMP_ROOT = resolve(tmpdir())
export const TMP_DSH_HOME = mkdtempSync(join(TMP_ROOT, 'larry-test-'))

process.env.DSH_HOME = TMP_DSH_HOME

/**
 * 隔离断言（正向白名单）：resolve(DSH_HOME) 必须位于临时根目录之下。
 * 一次覆盖三种漏法：
 *  1. DSH_HOME 指向真实 .dsh-home（等于真实库）
 *  2. DSH_HOME 指向真实库之内的子路径
 *  3. DSH_HOME 被 unset → resolve('') = cwd → 不在 tmpdir 下 → 拦截
 *     （unset 时 dsh 向上查找写仓库根 .dsh-home = 真实库被写入——R2 盲区）
 * 等价 Python conftest 的 autouse 断言，每个测试前自动执行。
 */
export function assertIsolated(): void {
  const current = resolve(process.env.DSH_HOME ?? '')
  if (!current.startsWith(TMP_ROOT)) {
    throw new Error(
      `[test-isolation] FAIL: DSH_HOME 解析为 ${current}，不在临时根 ${TMP_ROOT} 下。` +
        '测试必须运行在临时 DSH_HOME 内——请勿覆盖 DSH_HOME 为真实路径或删除该环境变量。'
    )
  }
}

// 全局 beforeEach：每个测试前断言隔离（等价 Python conftest autouse fixture）
beforeEach(() => {
  assertIsolated()
})
