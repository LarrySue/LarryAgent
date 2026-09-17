/**
 * DSH-3.2 · 「跨进程 resume 的 id collision」定性 —— 四项判据装置
 *
 * **姿态自证**（姿势不对会同时造出假绿与假红）：
 *   - 模拟的真实链路：调用方 → `dsh-sdk-client`（TS 半边，**客户端的实物**）
 *     → stdio JSON-RPC → session/prompt（**带 sessionId**） → runtime 内 agent loop
 *     → 真实 LLM 调用 → 回合结束 → session 落盘
 *   - 执行器：`harness/node_modules/@deepseek-ai/dsh-sdk-client` **同版本依赖**的 dsh CLI
 *     子进程（`--profile sdk`，`0.1.5-rc.2`）；**前导：无**（不经 CLI 子命令）
 *   - home＋profile：`<临时 home>` 里 `cp -r` 出来的 sdk profile **真副本**（**不改写源 profile**）
 *   - 凭据来源层：**环境变量**（`tests/isolated-setup.ts` 把 `DSH_HOME` 强制覆盖 ⇒ 读不到 `.credentials.yaml`）
 *   - **"跨进程"的口径**：每个 `DeepSeekHarness` 实例**自带一个 runtime 子进程**，`close()` 走
 *     EOF→SIGTERM→SIGKILL 阶梯**等到真的退出**；故 `runOnce` 之间是真·跨进程，不是复用同一进程。
 *   - **A/B 两把锁**：A = `<profiles>/node_modules.lock`（`dsh-atomic-write`，**持有者死亡后永不回收**）；
 *     B = jsonl 持久化的 session 写租约（POSIX `flock`，**进程死亡即内核释放**）。
 *     报告里凡"锁"必须标 A / B —— 两者语义相反（见派发稿 §2）。
 *
 * 变体（`S0_RESUME_VARIANT`，一条命令复跑见 `scripts/run-s0-resume.mjs`）：
 *   `forward`（③ 正向组：两次都**新 UUID**）｜`reverse`（② 反向组：**自选固定 id** 跨进程两次）
 *   ｜`key`（④ 关键组：第一轮真 completed 的**框架自产 id**，第二轮跨进程复用）
 *   ｜`same-proc`（**额外判别器**：同一进程内同 id 连发两次 ⇒ 区分"同进程可复用／跨进程被拒"）
 *
 * ⚠️ 本组**不预设结论**：判据 = 「② 复现出什么」＋「④ 对已存在的真会话是否拒」。
 *    ③ 是 ② 的对照（同时反证环境＋凭据都活着），没有它，② 的红绿都不可解释。
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'
import {
  INITIALIZE_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
  evaluateRun,
  globalProfilesDir,
  injectedKey,
  realApiEnabled,
  realApiModel,
  releaseOrphanProfileLock,
} from './real-api'
import { listSessionLogs, readSessionLog } from './s0-session-log'

const VARIANT = process.env.S0_RESUME_VARIANT ?? 'forward'
const ALL_VARIANTS = ['forward', 'reverse', 'key', 'same-proc'] as const

const harnessDir = resolve(import.meta.dirname, '..')
const repoDir = resolve(harnessDir, '..')
const SDK_CLIENT_LIB = join(harnessDir, 'node_modules', '@deepseek-ai', 'dsh-sdk-client', 'lib', 'index.js')
const EVIDENCE_DIR = process.env.S0_EVIDENCE_DIR ?? join(tmpdir(), 'larry-s0-resume-evidence')

/** 两轮的**可区分**口令：用来判断"第二轮到底写进了哪条日志"（真 resume vs 静默新会话）。 */
const TAG_P1 = 'OK-P1'
const TAG_P2 = 'OK-P2'

/** ② 反向组用的**自选固定 id**（"固定 ID"口径 —— 不随机、可被复跑复现）。 */
const FIXED_ID = 's0-resume-fixed-0001'

const ENABLED = realApiEnabled()

interface PhaseRecord {
  label: string
  requestedSessionId: string | null
  ok: boolean
  sessionId: string | null
  turnEndKind: string | null
  errorCode: string | number | null
  finalResponseLength: number
  finalResponseMatchesTag: boolean
  eventsCount: number
  durationMs: number
  /** 异常形态（只在抛错时有值）——判据 ② 要的"错误码 ＋ 文案 ＋ 出自哪一层"从这里取 */
  errorName?: string
  errorMessage?: string
  errorData?: unknown
  errorFields?: string[]
}

interface LogRecord {
  path: string
  bytes: number
  hasP1: boolean
  hasP2: boolean
  lastEventType: string
}

interface Evidence {
  variant: string
  triple: { DSH_HOME: string; profile: string; credentialsSourceLayer: string; clientPackage: string }
  locks: { aLockGlobal: string; aLockTempHome: string; note: string }
  phases: PhaseRecord[]
  sessionLogs: LogRecord[]
  /** ④ 专用：第二轮若成功，它写进了哪条日志（真 resume ⇒ 与第一轮同一条） */
  resumeTarget?: { p1LogPath: string; p2LandedOnSameLog: boolean | null; p2LogPath: string | null }
  notes: string[]
}

let home = ''
let evidence: Evidence

function makeHarness(): DeepSeekHarness {
  const key = injectedKey(process.env)
  if (key === undefined) throw new Error('未检测到 DEEPSEEK_API_KEY（只判存在性、不打印）')
  return new DeepSeekHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: realApiModel(),
    dshHome: home,
    env: { ...process.env, DEEPSEEK_API_KEY: key },
    initializeTimeoutMs: INITIALIZE_TIMEOUT_MS,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
  })
}

function errorFieldsOf(e: unknown): string[] {
  if (e === null || typeof e !== 'object') return []
  const names = new Set<string>(Object.getOwnPropertyNames(e))
  const proto: unknown = Object.getPrototypeOf(e)
  if (proto !== null && typeof proto === 'object') {
    for (const n of Object.getOwnPropertyNames(proto)) if (n !== 'constructor') names.add(n)
  }
  return [...names].sort()
}

/** 在一个**已建**的 harness 上跑一轮（跨进程与否由调用方决定 harness 的生命周期）。 */
async function runOn(
  harness: DeepSeekHarness,
  label: string,
  tag: string,
  sessionId?: string,
): Promise<PhaseRecord> {
  const started = Date.now()
  const base: PhaseRecord = {
    label,
    requestedSessionId: sessionId ?? null,
    ok: false,
    sessionId: null,
    turnEndKind: null,
    errorCode: null,
    finalResponseLength: 0,
    finalResponseMatchesTag: false,
    eventsCount: 0,
    durationMs: 0,
  }
  try {
    const result = await harness.run(
      `Reply with exactly this token and nothing else: ${tag}`,
      sessionId === undefined ? undefined : { sessionId },
    )
    const v = evaluateRun(result)
    return {
      ...base,
      ok: v.ok,
      sessionId: result.sessionId,
      turnEndKind: v.turnEndKind ?? null,
      errorCode: v.errorCode ?? null,
      finalResponseLength: v.finalResponseLength,
      finalResponseMatchesTag: result.finalResponse.trim() === tag,
      eventsCount: result.events.length,
      durationMs: Date.now() - started,
    }
  } catch (e) {
    const err = e as { name?: string; message?: string; code?: string | number; data?: unknown }
    const msg = String(err?.message ?? e)
    return {
      ...base,
      errorName: err?.name ?? typeof e,
      errorCode: err?.code ?? null,
      errorMessage: msg.slice(0, 1500),
      errorData: err?.data,
      errorFields: errorFieldsOf(e),
      durationMs: Date.now() - started,
    }
  }
}

/** 一轮 = 一个独立 harness（⇒ 独立 runtime 子进程）＋ 跑完即 close（等到真退出）。 */
async function runOnce(label: string, tag: string, sessionId?: string): Promise<PhaseRecord> {
  const harness = makeHarness()
  try {
    return await runOn(harness, label, tag, sessionId)
  } finally {
    await harness.close().catch(() => undefined)
  }
}

/** 同进程内连发两轮（**共用一个 harness**）——`same-proc` 变体的专用跑法。 */
async function runTwiceSameProcess(id: string): Promise<PhaseRecord[]> {
  const harness = makeHarness()
  try {
    const p1 = await runOn(harness, 'p1-sameproc', TAG_P1, id)
    const p2 = await runOn(harness, 'p2-sameproc', TAG_P2, id)
    return [p1, p2]
  } finally {
    await harness.close().catch(() => undefined)
  }
}

function logsEvidence(): LogRecord[] {
  return listSessionLogs(join(home, 'sessions')).map((path) => {
    let text = ''
    let bytes = 0
    try {
      text = readSessionLog(path)
      bytes = readFileSync(path).length
    } catch (e) {
      text = `<<decode failed: ${String((e as Error).message).slice(0, 200)}>>`
    }
    const last = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '')
      .at(-1)
    let lastEventType = '(none)'
    try {
      lastEventType = String((JSON.parse(last ?? '{}') as { type?: string }).type ?? '(no-type)')
    } catch {
      lastEventType = '(unparsable)'
    }
    return { path, bytes, hasP1: text.includes(TAG_P1), hasP2: text.includes(TAG_P2), lastEventType }
  })
}

function dumpEvidence(): void {
  mkdirSync(EVIDENCE_DIR, { recursive: true })
  writeFileSync(join(EVIDENCE_DIR, `${VARIANT}.resume.json`), JSON.stringify(evidence, null, 2))
  console.log(`\n===== S0 resume evidence (variant=${VARIANT}) =====`)
  console.log(JSON.stringify(evidence, null, 2))
  console.log('===== end evidence =====\n')
}

beforeAll(() => {
  if (!ALL_VARIANTS.includes(VARIANT as (typeof ALL_VARIANTS)[number])) {
    throw new Error(`未知变体：${VARIANT}（可选：${ALL_VARIANTS.join(' / ')}）`)
  }
  evidence = {
    variant: VARIANT,
    triple: {
      DSH_HOME: '(per-run temp home)',
      profile: 'sdk（cp -r 真副本，源 profile 不动）',
      credentialsSourceLayer: '环境变量 DEEPSEEK_API_KEY（real-api 链路读不到 .credentials.yaml）',
      clientPackage: '@deepseek-ai/dsh-sdk-client 0.1.5-rc.2（harness/node_modules，实物）',
    },
    locks: { aLockGlobal: '(未查)', aLockTempHome: '(未查)', note: '' },
    phases: [],
    sessionLogs: [],
    notes: [],
  }

  // ── 前置 1：A 锁（持有者死亡后永不回收）——开跑前必须确认无孤儿，有则**停手报错**
  const preGlobal = releaseOrphanProfileLock(globalProfilesDir())
  evidence.locks.aLockGlobal = `${preGlobal.action}${preGlobal.detail === undefined ? '' : ` :: ${preGlobal.detail}`}`
  if (preGlobal.action === 'live') {
    throw new Error(`A 锁被活跃进程持有，停手：${preGlobal.detail}（${preGlobal.lockPath}）——勿 rm，按重命名备份处置`)
  }

  // ── 前置 2：客户端实物在位（构建前置；**只检查，不自动 build**）
  if (!existsSync(SDK_CLIENT_LIB)) {
    throw new Error(`缺少 sdk-client 构建产物：${SDK_CLIENT_LIB}（先在 harness/ 下装依赖）`)
  }

  // ── 前置 3：临时 home（cp -r 真副本，源 profile 不动）
  const srcProfiles = process.env.DSH_REAL_API_PROFILE_HOME ?? join(repoDir, '.dsh-home', 'profiles')
  const srcSdk = join(srcProfiles, 'sdk')
  if (!existsSync(join(srcSdk, 'package.json'))) {
    throw new Error(`缺少 sdk profile：${srcSdk}（用 DSH_REAL_API_PROFILE_HOME 指到装好的 profiles 目录）`)
  }
  home = mkdtempSync(join(tmpdir(), 'larry-s0-resume-'))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(srcSdk, join(home, 'profiles', 'sdk'), { recursive: true })
  evidence.triple.DSH_HOME = home

  const preTemp = releaseOrphanProfileLock(join(home, 'profiles'))
  evidence.locks.aLockTempHome = `${preTemp.action}${preTemp.detail === undefined ? '' : ` :: ${preTemp.detail}`}`
  if (preTemp.action === 'live') {
    throw new Error(`临时 home 的 A 锁异常存活，停手：${preTemp.detail}`)
  }
  evidence.locks.note = 'A = profiles/node_modules.lock（持有者死亡后永不回收）；B = jsonl 写租约（flock，进程死亡即释放，不留文件）'
}, 900_000)

describe.skipIf(!ENABLED)(`S0 resume（variant=${VARIANT}）`, () => {
  it('四项判据 / 定性', async () => {
    if (VARIANT === 'forward') {
      // ③ 正向组：两次都新 UUID（不传 sessionId）⇒ 都给 completed，且两条 id **不同**
      evidence.phases.push(await runOnce('p1', TAG_P1))
      evidence.phases.push(await runOnce('p2', TAG_P2))
    } else if (VARIANT === 'reverse') {
      // ② 反向组：同一个**自选固定 id**，跨两个进程
      evidence.phases.push(await runOnce('p1', TAG_P1, FIXED_ID))
      evidence.phases.push(await runOnce('p2', TAG_P2, FIXED_ID))
    } else if (VARIANT === 'key') {
      // ④ 关键组：第一轮真 completed 的**框架自产 id**，第二轮跨进程复用
      const p1 = await runOnce('p1', TAG_P1)
      evidence.phases.push(p1)
      if (p1.sessionId !== null) {
        evidence.phases.push(await runOnce('p2', TAG_P2, p1.sessionId))
      } else {
        evidence.notes.push('④ 第一轮没拿到 sessionId ⇒ 第二轮无法发起（前置未成立）')
      }
    } else {
      // same-proc：同进程内同 id 连发两次（额外判别器）
      const [p1, p2] = await runTwiceSameProcess(FIXED_ID)
      evidence.phases.push(p1, p2)
    }

    evidence.sessionLogs = logsEvidence()

    if (VARIANT === 'key') {
      // ⚠️ 判据订正（2026-09-17，DSH-3.7.3）：原写法是
      //     p2Log = find(l => l.hasP2 && l.hasP1 === false)   // 只找"含 P2 但不含 P1"的**另一条**日志
      //     p2LandedOnSameLog: p2Log === null ? null : false  // ⇒ 按构造**永不可能是 true**（结构性缺陷）
      // 真语义 = **「P2 是否落在 P1 那条日志上」** ⇒ 判据应是同时含 `hasP1 && hasP2` 的那条
      //（`logsEvidence()` 已按 `text.includes(TAG_P1/P2)` 产出这两个布尔，原始数据本就在 evidence 里）。
      const p1Log = evidence.sessionLogs.find((l) => l.hasP1) ?? null
      const otherP2Log = evidence.sessionLogs.find((l) => l.hasP2 && l.hasP1 === false) ?? null
      const landedOnP1Log = p1Log !== null && p1Log.hasP2 === true
      evidence.resumeTarget = {
        p1LogPath: p1Log?.path ?? '(none)',
        // P1 那条日志都找不到 ⇒ 该字段无观测意义（保持 null）；找得到 ⇒ 如实报 true/false
        p2LandedOnSameLog: p1Log === null ? null : landedOnP1Log,
        p2LogPath: landedOnP1Log ? (p1Log?.path ?? null) : (otherP2Log?.path ?? null),
      }
    }

    dumpEvidence()

    const [p1, p2] = evidence.phases
    // 共同前提前置：**第一轮必须真的跑通**（否则这一组对"环境/凭据是否活着"无解释力）
    expect(p1, '第一轮必须存在').toBeDefined()
    expect(p1?.ok, `第一轮必须 completed（${p1?.errorName ?? 'no-error'} ${p1?.errorMessage ?? ''}）`).toBe(true)
    expect(p1?.turnEndKind, '第一轮 turn/end 必须是 completed').toBe('completed')

    // 第二轮的观测**必须存在且非空** —— 成功或失败都要留下可判读的形态（不许"什么也没发生"）
    expect(p2, '第二轮必须存在').toBeDefined()
    const observed = p2?.ok === true || (p2?.errorName !== undefined && p2?.errorMessage !== undefined)
    expect(observed, '第二轮必须留下明确观测：要么 ok=true，要么带 errorName+errorMessage').toBe(true)

    if (VARIANT === 'forward') {
      expect(p2?.ok, '③ 正向组第二轮也必须 completed（本条同时反证环境＋凭据活着）').toBe(true)
      const ids = evidence.phases.map((p) => p.sessionId)
      expect(new Set(ids).size, '③ 两次必须是不同的 session id（"每次新 UUID"）').toBe(2)
      const logs = evidence.sessionLogs
      expect(logs.length, '③ 两次新会话应落成两条日志').toBe(2)
      return
    }

    if (VARIANT === 'reverse') {
      // ② 不预设红绿 —— 这里只断言"两轮**请求的是同一个固定 id**"，结论由观测形态给出
      expect(evidence.phases[1]?.requestedSessionId, '② 两轮必须请求同一个固定 id').toBe(FIXED_ID)
      return
    }

    if (VARIANT === 'key') {
      expect(evidence.phases[1]?.requestedSessionId, '④ 第二轮必须复用第一轮的框架自产 id').toBe(p1?.sessionId)
      const p1Log = evidence.sessionLogs.find((l) => l.hasP1)
      expect(p1Log, '④ 第一轮的会话必须落盘（含第一轮口令）').toBeDefined()
      return
    }

    // same-proc：同进程第二次必须跑通（这是"跨进程被拒"的解释前提）
    expect(evidence.phases[1]?.ok, 'same-proc：同一进程内同 id 第二次应 completed').toBe(true)
  }, 900_000)
})

afterAll(() => {
  try {
    if (home !== '') rmSync(home, { recursive: true, force: true })
  } catch {
    /* 清理失败不影响判据（证据已落 EVIDENCE_DIR） */
  }
})
