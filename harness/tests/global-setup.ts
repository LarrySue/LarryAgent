/**
 * globalSetup + teardown（主进程可靠清理，R1 返工版 + 启动期过期清扫）
 *
 * 职责：
 * 1. **key 残留自检（必须在 rmSync 之前）**——扫所有 larry-test-* 目录，
 *    命中 sk-{16,} 即高警。顺序写死：先扫后删。若先删后扫则必然 ENOENT
 *    静默跳过——R1 返工根因，勿调回。
 * 2. **清理**——删除全部 larry-test-* 前缀临时目录（Vitest 5 无
 *    globalTeardown 配置；setupFiles 的 process.on('exit') 在 worker 下
 *    不触发（实测残留），此处是唯一可靠清理位）。
 * 3. 清理失败告警不静默（P7）。
 * 4. **启动期过期清扫**——teardown 只在跑完时执行；进程被强杀（taskkill /
 *    timeout）时 teardown 根本不会跑，目录就攒下来了（WB 2026-09-10 复验时
 *    见到 3 个历史残留：teardown 只清当次）。故启动时先扫一遍**过期**目录。
 *
 * 为什么在这：globalSetup 跑在主进程、所有 worker 结束后执行其返回值
 * （teardown）——主进程上下文才有文件系统可靠访问与稳定执行时序。
 */
import { readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// 扫描判据与 real-api.ts 的自查**必须同源**（DSH-3 前置件 1 抽取为共享模块；
// 原实现逐字保留在 scan-keys.ts，勿在此处内联回副本）
import { scanForKeys } from './scan-keys'

/**
 * 启动期清扫的过期阈值。
 * 为什么是 2 小时：一次真实调用是分钟级（§6 实测含冷启动 ~106s），2 小时
 * 远超任何正常跑一次的时长 → 只可能是被杀进程的残留。用年龄而不是"全删"
 * 是为了**不误伤并发跑的另一次会话**（对方刚建的目录是"年轻"的）。
 */
const STALE_MS = 2 * 60 * 60 * 1000

/** 当前 tmp 下所有 larry-test-* 目录 */
function larryTempDirs(): string[] {
  const base = tmpdir()
  const targets: string[] = []
  for (const name of readdirSync(base)) {
    if (name.startsWith('larry-test-')) targets.push(join(base, name))
  }
  return targets
}

/** ⚠️ 先扫后删（顺序勿调——先删后扫必然 ENOENT 静默跳过，R1 返工根因） */
function scanResidue(dirs: readonly string[]): void {
  for (const dir of dirs) {
    try {
      const keyHits = scanForKeys(dir)
      if (keyHits.length > 0) {
        console.error(
          `[test-isolation] ⚠️ KEY RESIDUE: 临时目录残留疑似 key 明文（${keyHits.length} 处）——` +
            `可能 --real-api 模式泄漏，须人工检查: ${dir}`
        )
        for (const hit of keyHits) console.error(`[test-isolation]   at ${hit}`)
      }
    } catch (e) {
      console.error(`[test-isolation] key 扫描失败（目录异常）: ${dir} (${e})`)
    }
  }
}

/** 后删（含扫描失败/告警的目录，仍须清理）；失败告警不静默 */
function removeDirs(dirs: readonly string[], reason: string): void {
  for (const dir of dirs) {
    try {
      rmSync(dir, { recursive: true, force: true })
      console.log(`[test-isolation] ${reason} 清理: ${dir}`)
    } catch (e) {
      console.error(`[test-isolation] ${reason} 清理失败: ${dir} (${e})`)
    }
  }
}

export default function setup(): () => void {
  // 启动期：清**过期**残留（强杀不执行 teardown 的历史垃圾）。判据同 teardown：先扫后删。
  const stale: string[] = []
  for (const dir of larryTempDirs()) {
    try {
      if (Date.now() - statSync(dir).mtimeMs > STALE_MS) stale.push(dir)
    } catch {
      // 读不到状态（并发删除等）→ 不擅动，留给下次
    }
  }
  if (stale.length > 0) {
    scanResidue(stale)
    removeDirs(stale, '过期残留')
  }

  return () => {
    const targets = larryTempDirs()
    scanResidue(targets)
    removeDirs(targets, 'global teardown')
  }
}
