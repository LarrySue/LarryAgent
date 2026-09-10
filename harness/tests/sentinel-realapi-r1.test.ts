/**
 * R1 反向哨兵：错误 Key 的真实调用必须被断言层判 FAIL（**单独运行**）
 *
 * 预期结果：本文件 **FAIL（exit 1）**——FAIL 才是哨兵成功（同 sentinel-failfast
 * / sentinel-unset 的约定：证据是"护栏真的拦了"）。
 * 验收看什么：失败信息里必须出现 `verdict=FAIL` 与 `error.code=AUTH` ——
 * 证明错误 Key 既没有"跳过"也没有"假装通过"，且失败原因可见。
 *
 * 单独跑（开关由脚本设；不需要有效 Key，错误 Key 即可）：
 *   npm run test:real-api:sentinel-r1        （在 harness/ 下）
 * 直接在 vitest 里跑也可以：
 *   DSH_REAL_API=1 node_modules/vitest/vitest.mjs run tests/sentinel-realapi-r1.test.ts
 *
 * ⚠️ 不加开关直接跑 → 本文件故意报错（不是 skip）：哨兵静默跳过等于没跑，
 * 与 R2 要防的"静默通过"是同一个坑。
 * ⚠️ 前置：profile 无孤儿锁（见 docs/dsh/dsh-local-env.md §1；runRealPrompt 会自动
 * 清死锁，活跃锁则停手报错）。
 */
import { describe, it } from 'vitest'
import { badKey, expectRealApiSuccess, formatVerdict, realApiEnabled, runRealPrompt } from './real-api'

if (!realApiEnabled()) {
  describe('R1 反向哨兵（未启用开关）', () => {
    it('必须带 DSH_REAL_API=1 运行——哨兵不允许静默跳过', () => {
      throw new Error('R1 哨兵需要真实调用（错误 Key 即可）：请带 DSH_REAL_API=1 运行本文件')
    })
  })
} else {
  describe('R1 反向哨兵（预期 FAIL——证明错误 Key 被断言层拒绝）', () => {
    it(
      '错误 Key 真实调用：expectRealApiSuccess 必须抛 → 本用例 FAIL',
      async () => {
        const run = await runRealPrompt({ message: 'Reply with exactly: R1-SENTINEL', key: badKey() })
        console.log(`[real-api R1] ${formatVerdict(run.verdict)} 耗时=${Math.round(run.durationMs / 1000)}s`)
        // 故意不捕获：断言层必须抛（错误 Key 判红）
        expectRealApiSuccess(run.result)
      },
      180_000
    )
  })
}
