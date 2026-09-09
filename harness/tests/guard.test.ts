/** 哨兵 1：隔离生效——正常测试跑在临时 DSH_HOME（应全绿） */
import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'

describe('隔离生效（正常路径）', () => {
  it('DSH_HOME 指向临时目录', () => {
    const dshHome = resolve(process.env.DSH_HOME ?? '')
    expect(dshHome).not.toBe(resolve(import.meta.dirname, '../../.dsh-home'))
    expect(dshHome).toMatch(/larry-test-/)
  })
})
