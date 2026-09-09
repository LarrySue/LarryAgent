/**
 * globalSetup + 返回 teardown：主进程在所有 worker 结束后清理临时目录。
 * （Vitest 5 无 globalTeardown 配置项——用 globalSetup 返回值模式。
 *  setupFiles 的 process.on('exit') 在 worker 下不触发（实测残留），
 *  主进程 teardown 是可靠兜底。）
 */
import { readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export default function setup(): () => void {
  return () => {
    const base = tmpdir()
    for (const name of readdirSync(base)) {
      if (name.startsWith('larry-test-')) {
        try {
          rmSync(join(base, name), { recursive: true, force: true })
          console.log(`[test-isolation] global teardown 清理: ${name}`)
        } catch (e) {
          console.error(`[test-isolation] global teardown 清理失败: ${name} (${e})`)
        }
      }
    }
  }
}
