/**
 * R3 反向哨兵：真实调用临时目录里的 Key 明文必须被 teardown 残留扫描喊出来
 *
 * 做法：按真实调用同一工厂（real-api.ts `createRealApiHome()`）建临时 DSH_HOME
 * （`larry-test-realapi-` 前缀 + 指向真实 sdk profile 的 junction），在其中写入
 * 一段 sk- 形态明文，模拟"真实调用把 Key 落到磁盘"的泄漏形态。
 *
 * 预期结果：**本用例 PASS**，但验收依据在 **teardown 的 stderr**：
 *   [test-isolation] ⚠️ KEY RESIDUE: 临时目录残留疑似 key 明文（1 处）…
 *   [test-isolation]   at <…/simulated-leak/creds.txt>
 * （global-setup.ts 先扫后删；顺序勿调。见 DSH-2.4 结论：alarm 型哨兵靠 stderr 取证。）
 *
 * 单独跑（不需要开关、不需要有效 Key）：
 *   npm run test:real-api:sentinel-r3        （在 harness/ 下）
 *
 * ⚠️ 前置：本机存在 sdk profile（`.dsh-home/profiles/sdk`，或用
 * `DSH_REAL_API_PROFILE_HOME` 指定）——缺了会 fail-fast 报错，这是有意的
 * （真实调用的临时目录形状长这样，形状本身就是要验的对象之一）。
 * ⚠️ junction 是**不穿透**扫描的：扫描器若跟随符号链接，会走进 177MB 真实
 * profile（既慢又扫错对象）。本哨兵同时是这条性质的回归。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createRealApiHome } from './real-api'
import { scanForKeys } from './scan-keys'

describe('R3 反向哨兵（临时目录写入 Key 明文 → teardown 必须告警）', () => {
  it('写入 sk- 形态明文后，与 teardown 同源的扫描器必须命中', () => {
    const home = createRealApiHome()
    const leakDir = join(home.home, 'simulated-leak')
    mkdirSync(leakDir, { recursive: true })
    writeFileSync(join(leakDir, 'creds.txt'), 'DEEPSEEK_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456', 'utf-8')

    // 与 teardown 同一套判定（scan-keys.ts）：命中即为"teardown 一定会告警"的充分条件。
    // 本用例 PASS = 残留可被检出；真正取证看 teardown stderr（见文件头）。
    const hits = scanForKeys(home.home)
    console.log(`[real-api R3] 残留命中 ${hits.length} 处（预期 1）：${hits.join(', ')}`)
    expect(hits.length).toBe(1)
    expect(hits[0].endsWith('creds.txt')).toBe(true)
  })
})
