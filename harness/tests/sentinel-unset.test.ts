/**
 * 反向哨兵（R2）：DSH_HOME unset 盲区已堵
 *
 * 模块加载时删除 process.env.DSH_HOME（模拟默认行为/常见测试写法——
 * 若守卫只在测试体前跑则此处已生效）→ 全局 beforeEach 白名单必须拦截
 * （resolve('') = cwd 不在临时根下）→ 本测试必须 FAIL。
 * 证明 unset 场景不再漏放。
 */
delete process.env.DSH_HOME

import { describe, expect, it } from 'vitest'

describe('R2 反向哨兵（预期 FAIL——证明 unset 被拦）', () => {
  it('删除 DSH_HOME 后应被隔离守卫拦截', () => {
    expect(true).toBe(true)
  })
})
