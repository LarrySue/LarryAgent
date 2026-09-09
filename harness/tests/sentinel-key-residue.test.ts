/**
 * 反向哨兵（R1）：key 残留告警机制存在性证明
 *
 * 人为在临时 DSH_HOME 写一个含 sk-{16,} 格式的文件 → 跑完测试后
 * global-setup teardown 必须先扫到并高警（stderr 可见 KEY RESIDUE）。
 * 无告警 = R1 未修复（扫描从未执行）。此文件本身测试全绿，验收看
 * teardown 的 stderr 告警输出。
 */
import { describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TMP_DSH_HOME } from './isolated-setup'

describe('R1 反向哨兵：key 残留告警（期望 teardown 输出 KEY RESIDUE 高警）', () => {
  it('写入含 sk- 明文文件，teardown 必须告警', () => {
    // 人为制造 key 残留（模拟 --real-api 泄漏）
    const dir = join(TMP_DSH_HOME, 'simulated-leak')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'creds.txt'), 'DEEPSEEK_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456\n', 'utf-8')
    // 测试本身不做断言（文件写成功即可）——验收看跑完后的 teardown stderr
    expect(true).toBe(true)
  })
})
