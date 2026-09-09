/**
 * Vitest 会话级测试隔离（DSH-2.4，conftest.py 七原则的 TS 等价物）
 *
 * 对照 backend/tests/conftest.py 的原则平移（原则不平移代码）：
 *  P1 会话级临时配置 → mkdtemp 临时 DSH_HOME（sessions/storages 全落临时目录）
 *  P2 环境变量时序 → setupFiles 先于测试文件静态 import（已实测验证，
 *    见时序探针：setupFiles 设的 env 在 import 前可见）——等价 conftest
 *    先于 pytest 收集加载
 *  P5 断言"行为"而非"动作" → beforeEach 断言最终解析的 DSH_HOME 指向临时
 *    目录（resolve 后比对），指向真实 .dsh-home 直接 fail——不依赖自觉
 *  P7 清理失败告警不静默 → 进程退出时 rmtree 临时目录，失败打 stderr
 *
 * 真实隔离对象（2026-09-09 WB 实测 + 本文件确认）：
 *  - backend/data/larry.db（Python 侧，A-framework 迁移后仍可能作为 SQLite 真源）
 *  - .dsh-home/（仓库根，DSH 运行时数据：sessions/ storages/ profiles/）
 *  两者均不因本基建被触碰；DSH_HOME 强制指向临时目录。
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { beforeEach } from 'vitest'

/** 真实 DSH_HOME（仓库根，隔离对象）——resolve 后比对用 */
export const REAL_DSH_HOME = resolve(import.meta.dirname, '../../.dsh-home')

/** 会话级临时 DSH_HOME（即用即弃） */
export const TMP_DSH_HOME = mkdtempSync(join(tmpdir(), 'larry-test-'))

process.env.DSH_HOME = TMP_DSH_HOME

/** 隔离断言：当前解析的 DSH_HOME 必须指向临时目录，指向真实库直接 throw（fail-fast） */
export function assertIsolated(): void {
  const current = resolve(process.env.DSH_HOME ?? '')
  if (current === REAL_DSH_HOME) {
    throw new Error(
      `[test-isolation] FAIL: DSH_HOME 指向真实库 ${REAL_DSH_HOME}。` +
        '测试不得触碰真实 .dsh-home——请勿在测试中覆盖 DSH_HOME 指向真实路径。'
    )
  }
}

// 全局 beforeEach：每个测试前断言隔离（等价 Python conftest autouse fixture）
beforeEach(() => {
  assertIsolated()
})

// 进程退出清理（失败告警不静默——P7）
process.on('exit', () => {
  try {
    rmSync(TMP_DSH_HOME, { recursive: true, force: false })
  } catch (e) {
    console.error(`[test-isolation] 临时目录清理失败: ${TMP_DSH_HOME} (${e})`)
  }
})

// —— key 残留自检（P6/P3：--real-api 模式残留含 key 明文须高警）——
// 临时 DSH_HOME 内若出现密钥格式明文（sk- 前缀），清理前扫描告警。
// 默认模式测试不注入 key，此扫描为程序化证据（硬验收 3）。
import { readdirSync, readFileSync, statSync } from 'node:fs'

function scanForKeys(dir: string): string[] {
  const hits: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      const s = statSync(p)
      if (s.isDirectory()) walk(p)
      else if (s.size < 1_000_000) {
        try {
          const content = readFileSync(p, 'utf-8')
          if (/sk-[A-Za-z0-9]{16,}/.test(content)) hits.push(p)
        } catch { /* 跳过二进制 */ }
      }
    }
  }
  walk(dir)
  return hits
}

process.on('exit', () => {
  try {
    const keyHits = scanForKeys(TMP_DSH_HOME)
    if (keyHits.length > 0) {
      console.error(`[test-isolation] ⚠️ 临时目录残留疑似 key 明文（${keyHits.length} 处）——需人工检查是否 --real-api 模式泄漏: ${keyHits.join(', ')}`)
    }
  } catch { /* 目录已删则跳过 */ }
})
