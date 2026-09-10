/**
 * 真实调用断言机制的自检 + 真实调用用例（DSH-3 前置件 1）
 *
 * 两层：
 * 1. **机制自检（无需 Key，始终运行）**——开关、判据、残留自查、结构防伪
 *    （关闭状态下发起真实调用必须抛）。判据用 docs/dsh/dsh-local-env.md §6
 *    四组实跑形态合成 fixture，锁死"哪些收尾算成功、哪些算失败"。
 * 2. **真实调用（开关关闭时 SKIP，不是 pass）**——`DSH_REAL_API=1` 才跑：
 *    有效 Key 绿用例 + R1 反向哨兵（错误 Key 必须判红且给出 error.code）。
 *
 * 🔴 纪律（改动前读）：
 * - 不得让「无 Key 时跳过」退化成「无 Key 时假装通过」：开关开而 Key 缺 →
 *   用例**显式失败**并给修复指引（见下方 green 用例），绝不静默 skip。
 * - 不得用 `exit 0` 判成功（§6：三种失败场景 exit 全为 0）。
 * - Key 只走环境变量；本文件不读、不写、不打印 Key（只打印长度/判定）。
 * - 别把 session 日志整段打进测试输出（DSH 脱敏保留后 4 位，整段日志会
 *   把后 4 位带出来）——本文件只打 `formatVerdict` 的单行概要。
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BAD_KEY_ENV,
  DEFAULT_BAD_KEY,
  KEY_ENV,
  SWITCH_ENV,
  assertNoKeyOnDisk,
  badKey,
  evaluateRun,
  expectRealApiSuccess,
  formatVerdict,
  injectedKey,
  realApiEnabled,
  runRealPrompt,
  type RunObservation,
} from './real-api'

const ENABLED = realApiEnabled()

/** §6 有效 Key 行形态（finalResponse=PROBE-OK-2026，含 assistant/message，completed 收尾） */
const OK_RUN: RunObservation = {
  finalResponse: 'PROBE-OK-2026',
  events: [
    { type: 'session/start', data: {} },
    { type: 'user/message', data: {} },
    { type: 'assistant/message', data: {} },
    { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } },
  ],
}

/** §6 失败三行形态（exit 0、finalResponse 空、无 assistant/message、turn/end.reason=error） */
function failureRun(code: string, status?: number): RunObservation {
  return {
    finalResponse: '',
    events: [
      { type: 'session/start', data: {} },
      { type: 'user/message', data: {} },
      { type: 'turn/end', data: { turn: 1, reason: { kind: 'error', error: { code, status } } } },
    ],
  }
}

describe('real-api 机制自检（无需 Key，始终运行）', () => {
  it(`开关：只认 ${SWITCH_ENV}=1/true（大小写不敏感），其余值一律关闭`, () => {
    expect(realApiEnabled({ [SWITCH_ENV]: '1' })).toBe(true)
    expect(realApiEnabled({ [SWITCH_ENV]: 'true' })).toBe(true)
    expect(realApiEnabled({ [SWITCH_ENV]: 'TRUE' })).toBe(true)
    expect(realApiEnabled({ [SWITCH_ENV]: '0' })).toBe(false)
    expect(realApiEnabled({ [SWITCH_ENV]: 'yes' })).toBe(false)
    expect(realApiEnabled({ [SWITCH_ENV]: '' })).toBe(false)
    expect(realApiEnabled({})).toBe(false)
  })

  it(`Key 只从 ${KEY_ENV} 读；空白视为未提供`, () => {
    expect(injectedKey({ [KEY_ENV]: 'sk-x' })).toBe('sk-x')
    expect(injectedKey({ [KEY_ENV]: '  sk-x  ' })).toBe('sk-x')
    expect(injectedKey({ [KEY_ENV]: '   ' })).toBeUndefined()
    expect(injectedKey({})).toBeUndefined()
  })

  it(`R1 备用 Key 来源：${BAD_KEY_ENV} 缺省为内置非法占位串`, () => {
    expect(badKey({ [BAD_KEY_ENV]: 'sk-bad' })).toBe('sk-bad')
    expect(badKey({})).toBe(DEFAULT_BAD_KEY)
  })

  // ---- 判据核心：四组 §6 实跑形态 + exit 0 陷阱 ----

  it('判据：有效 Key 形态 → OK（assistant/message + 非空 finalResponse + completed 收尾）', () => {
    const v = evaluateRun(OK_RUN)
    expect(v.failures).toEqual([])
    expect(v.ok).toBe(true)
    expect(v.assistantMessageCount).toBe(1)
    expect(v.turnEndKind).toBe('completed')
  })

  it('判据：无 Key 形态（MISSING_CREDENTIAL）→ FAIL 且输出 error.code', () => {
    const v = evaluateRun(failureRun('MISSING_CREDENTIAL'))
    expect(v.ok).toBe(false)
    expect(v.errorCode).toBe('MISSING_CREDENTIAL')
    expect(v.assistantMessageCount).toBe(0)
    expect(v.finalResponseLength).toBe(0)
  })

  it('判据：错误 Key 形态（AUTH/401）→ FAIL 且输出 code 与 status', () => {
    const v = evaluateRun(failureRun('AUTH', 401))
    expect(v.ok).toBe(false)
    expect(v.errorCode).toBe('AUTH')
    expect(v.errorStatus).toBe(401)
  })

  it('判据：已关闭 Key 形态（AUTH/401）→ FAIL（与错误 Key 输出层不可区分，勿写自动判因）', () => {
    const v = evaluateRun(failureRun('AUTH', 401))
    expect(v.ok).toBe(false)
    expect(formatVerdict(v)).toContain('error.code=AUTH')
  })

  it('判据：exit 0 陷阱（事件流存在、session 建立，但无 assistant/message 且 finalResponse 空）→ FAIL', () => {
    const trap: RunObservation = {
      finalResponse: '',
      events: [
        { type: 'session/start', data: {} },
        { type: 'user/message', data: {} },
      ],
    }
    const v = evaluateRun(trap)
    expect(v.ok).toBe(false)
    // 必须点明"缺 assistant/message"与"finalResponse 为空"两条，不靠 exit 0 之类外部信号
    expect(v.failures.join('|')).toContain('assistant/message')
    expect(v.failures.join('|')).toContain('finalResponse')
  })

  it('判据：非 completed 收尾（max-tokens/aborted 等异常收尾）→ FAIL', () => {
    for (const kind of ['max-tokens', 'aborted', 'blocked', 'interrupted']) {
      const v = evaluateRun({
        finalResponse: 'partial',
        events: [
          { type: 'assistant/message', data: {} },
          { type: 'turn/end', data: { turn: 1, reason: { kind } } },
        ],
      })
      expect(v.ok, `kind=${kind} 应判红`).toBe(false)
    }
  })

  it('R1 断言层：错误 Key 形态必须被 expectRealApiSuccess 拒绝（既非通过，也不得退化为 skip）', () => {
    expect(() => expectRealApiSuccess(failureRun('AUTH', 401))).toThrow(/error\.code=AUTH/)
  })

  it('结构防伪：开关关闭时调用 runRealPrompt 必须抛（禁止关闭状态下发起真实调用）', async () => {
    if (ENABLED) {
      // 开关已开时本用例不适用（发真实调用会烧 key）；真实调用组另有正向用例覆盖
      expect(realApiEnabled()).toBe(true)
      return
    }
    await expect(runRealPrompt({ message: 'must-not-run', key: 'sk-not-a-real-key' })).rejects.toThrow(
      /开关未开/
    )
  })

  it('残留自查：临时目录出现 sk- 形态明文 → assertNoKeyOnDisk 必须抛；干净目录不得误报', () => {
    // 目录名故意不带 larry-test- 前缀：避免主进程 teardown 每次误报 KEY RESIDUE
    // （那条告警是 R3 哨兵的专用信号，狼来了会让真残留失去信噪比）
    const probe = mkdtempSync(join(tmpdir(), 'scan-probe-'))
    try {
      const leak = join(probe, 'leak.txt')
      writeFileSync(leak, 'token=sk-abcdefghijklmnopqrstuvwxyz012345', 'utf-8')
      expect(() => assertNoKeyOnDisk(probe)).toThrow(/Key 残留/)

      // 干净目录不得误报
      rmSync(leak)
      writeFileSync(join(probe, 'clean.txt'), 'nothing to see here', 'utf-8')
      expect(() => assertNoKeyOnDisk(probe)).not.toThrow()

      // 注入 Key 原文比对通道（key 可能不是 sk- 形态，光靠 sk- 模式会漏）
      const nonSkKey = 'plain-key-abcdef0123456789'
      writeFileSync(join(probe, 'shaped.txt'), `key=${nonSkKey}`, 'utf-8')
      expect(() => assertNoKeyOnDisk(probe)).not.toThrow() // 无原文参数时 sk- 模式不误报
      expect(() => assertNoKeyOnDisk(probe, nonSkKey)).toThrow(/Key 残留/)
    } finally {
      rmSync(probe, { recursive: true, force: true })
    }
  })

  // R2 证据：开关关闭时，真实调用组必须显示为 SKIPPED（本用例把它显式喊出来）
  it.runIf(!ENABLED)('R2：开关关闭 → 真实调用组必须显式 SKIPPED，且 skip ≠ pass（禁止据 skip 宣称已验证）', () => {
    console.warn(
      `[real-api] ⚠️ ${SWITCH_ENV} 未开：下方「real-api 真实调用」组显示为 SKIPPED。` +
        'skip ≠ pass —— 本次运行**没有**验证任何真实调用，不得据此宣称连通性/凭据可用。'
    )
    expect(ENABLED).toBe(false)
  })
})

describe.skipIf(!ENABLED)('real-api 真实调用（开关关闭时本组为 SKIP，不是 pass）', () => {
  it(
    '有效 Key：真实调用必须判过（绿）',
    async () => {
      const key = injectedKey()
      if (key === undefined) {
        // 🔴 开关已开而 Key 缺失 → 显式失败（不得 skip，不得静默通过）
        throw new Error(
          `开关 ${SWITCH_ENV}=1 但环境变量 ${KEY_ENV} 未提供。\n` +
            '  修复：以环境变量提供 Key（禁止落盘/写进文件），例如 bash: ' +
            `DSH_REAL_API=1 ${KEY_ENV}=<key> npm run test:real-api\n` +
            '  若暂无可用 Key：不要跑本组——用 R1 哨兵（错误 Key）与机制自检即可覆盖断言层。'
        )
      }
      const run = await runRealPrompt({ message: 'Reply with exactly: REAL-API-OK', key })
      // 只打判定概要（含 error.code / 长度），不打会话正文、不打 key
      console.log(`[real-api] 有效 Key: ${formatVerdict(run.verdict)} 耗时=${Math.round(run.durationMs / 1000)}s`)
      expectRealApiSuccess(run.result)
      // 资源生命周期自检（mock 结构性测不到，见 CLAUDE.md「mock 覆盖不到清单」）
      expect(run.closeError).toBeUndefined()
      // 残留自查（与主进程 teardown 同源判据）
      assertNoKeyOnDisk(run.home.home, key)
    },
    300_000
  )

  it(
    'R1 反向哨兵：错误 Key 的真实调用必须判红且输出 error.code',
    async () => {
      const run = await runRealPrompt({ message: 'Reply with exactly: R1-SENTINEL', key: badKey() })
      console.log(`[real-api] 错误 Key: ${formatVerdict(run.verdict)} 耗时=${Math.round(run.durationMs / 1000)}s`)
      // 必须判红（不是 skip / 不是 pass）
      expect(run.verdict.ok).toBe(false)
      // §6：错误 Key 与已关闭 Key 同为 AUTH/401（输出层不可区分 → 不写自动判因）
      expect(run.verdict.errorCode).toBe('AUTH')
      expect(run.verdict.errorStatus).toBe(401)
      expect(run.verdict.assistantMessageCount).toBe(0)
      expect(run.verdict.finalResponseLength).toBe(0)
    },
    180_000
  )
})
