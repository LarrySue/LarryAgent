/**
 * 哨兵 2：fail-fast 真的会拦（硬验收 1）
 * 故意在模块加载时把 DSH_HOME 指回真实 .dsh-home（模拟业务代码/测试
 * import 时错误触碰真实库）→ 全局 beforeEach 必须拦下 → 本测试必须 FAIL。
 * 证明护栏存在、不依赖自觉。
 */
import { resolve } from 'node:path'
process.env.DSH_HOME = resolve(import.meta.dirname, '../../.dsh-home')

import { describe, it, expect } from 'vitest'

describe('fail-fast 哨兵（预期 FAIL——证明护栏存在）', () => {
  it('污染 DSH_HOME 指向真实库时应被隔离守卫拦截', () => {
    expect(true).toBe(true)
  })
})
