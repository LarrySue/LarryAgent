/**
 * globalSetup + teardown（主进程可靠清理，R1 返工版）
 *
 * 职责：
 * 1. **key 残留自检（必须在 rmSync 之前）**——扫所有 larry-test-* 目录，
 *    命中 sk-{16,} 即高警。顺序写死：先扫后删。若先删后扫则必然 ENOENT
 *    静默跳过——R1 返工根因，勿调回。
 * 2. **清理**——删除全部 larry-test-* 前缀临时目录（Vitest 5 无
 *    globalTeardown 配置；setupFiles 的 process.on('exit') 在 worker 下
 *    不触发（实测残留），此处是唯一可靠清理位）。
 * 3. 清理失败告警不静默（P7）。
 *
 * 为什么在这：globalSetup 跑在主进程、所有 worker 结束后执行其返回值
 * （teardown）——主进程上下文才有文件系统可靠访问与稳定执行时序。
 */
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** 扫描目录内疑似 key 明文（sk- 前缀 + 16 位以上字母数字） */
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
        } catch {
          /* 跳过二进制 */
        }
      }
    }
  }
  walk(dir)
  return hits
}

export default function setup(): () => void {
  return () => {
    const base = tmpdir()
    const targets: string[] = []
    for (const name of readdirSync(base)) {
      if (name.startsWith('larry-test-')) targets.push(join(base, name))
    }

    // ⚠️ 先扫后删（顺序勿调——先删后扫必然 ENOENT 静默跳过，R1 返工根因）
    for (const dir of targets) {
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

    // 后删（含扫描失败/告警的目录，仍须清理）
    for (const dir of targets) {
      try {
        rmSync(dir, { recursive: true, force: true })
        console.log(`[test-isolation] global teardown 清理: ${dir}`)
      } catch (e) {
        console.error(`[test-isolation] global teardown 清理失败: ${dir} (${e})`)
      }
    }
  }
}
