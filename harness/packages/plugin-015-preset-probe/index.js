/**
 * DSH 0.1.5「边界透明」契约探针 —— 派发 002 的 A / B / C / D 组装置。
 *
 * 在**真实 profile 内 boot** 的前提下回答：
 *   A 组 `ctx.approval` / `ctx.permissionPresets` / `ctx.userQuestions` 是否可用（打印**实际成员**，不是只写"有"）；
 *   B 组 官方 preset 表起得来 + `names`/`optionOf`/`selectFor`/`defaultPreset` 的**实际返回值**；
 *   C 组 我们加的**自定义 preset** 是否被服务登记并写穿（正/反两跑各一次）；
 *   D 组 `ctx.approval.request()` 的 fail-closed 语义（含**正向对照**，否则"全拒"也能假装正确）。
 *
 * 纪律：
 *   - **零外部 import**（只用 node: 内建）—— 插件以 link 方式挂载时 bare import 取不到 @deepseek-ai/*；
 *   - 服务**缺席必须显形**（t0 快照 + 就绪超时记录），不静默；
 *   - 探针自身异常一律吞掉并写进报告，**绝不影响 boot**；
 *   - 只读探针：不改 profile、不改第三方包、不写除本报告以外的文件。
 *   - 不打印任何凭据；不调模型（本探针不发起任何 LLM 请求）。
 *
 * 输出：`<TRAE_015_OUT>/probe.json`（默认 `D:\Code\_trae-015`）+ 逐行 `[015PROBE]` 打 stderr。
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.env.TRAE_015_OUT ?? 'D:\\Code\\_trae-015'
const OUT = join(ROOT, 'probe.json')
const LOG = join(ROOT, 'probe.log')

/** C 组：我们要加进 preset 表的那条自定义档（与官方 `read-only` 同 bundle —— 故意如此，见报告）。 */
const OUR_PRESET = 'trae-readonly-ask'
/** 官方 dsh-base `permission` 行里实际配的三条（⚠️ 不是文档说的两条）。 */
const OFFICIAL = ['read-only', 'workspace-write', 'danger-full-access']

function say(line) {
  try {
    process.stderr.write(`[015PROBE] ${line}\n`)
  } catch {
    /* 探针自身失败不得影响 boot */
  }
}

function logLine(line) {
  try {
    mkdirSync(ROOT, { recursive: true })
    appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`)
  } catch {
    /* ignore */
  }
}

/** 同时打 stderr + 落日志。 */
function note(line) {
  say(line)
  logLine(line)
}

/** 收集对象自己的 + 原型链上的全部成员名（方法 / getter / 字段）。 */
function membersOf(obj) {
  if (obj === undefined || obj === null) return null
  const out = new Set()
  try {
    for (const n of Object.getOwnPropertyNames(obj)) out.add(n)
    let p = Object.getPrototypeOf(obj)
    while (p && p !== Object.prototype) {
      for (const n of Object.getOwnPropertyNames(p)) out.add(n)
      p = Object.getPrototypeOf(p)
    }
  } catch {
    /* ignore */
  }
  return [...out].sort()
}

/** JSON 可序列化（含循环引用 / undefined 兜底）。 */
function plain(v) {
  if (v === undefined) return '<undefined>'
  if (v === null) return null
  try {
    return JSON.parse(JSON.stringify(v))
  } catch {
    return `<unserializable ${typeof v}>`
  }
}

/** 同步调用：成功值或异常文本——异常本身也是证据。 */
function attempt(sink, label, fn) {
  try {
    sink[label] = { ok: true, value: plain(fn()) }
  } catch (e) {
    sink[label] = { ok: false, error: String(e?.message ?? e).slice(0, 400) }
  }
}

/** 一个"满足 open-turn 前置"的假 session —— 只实现被 request()/set() 真正用到的那几个成员。 */
function fakeSession(events) {
  const log = events.slice()
  return {
    id: 'trae-015-probe-fake-session',
    header: { cwd: ROOT, version: 1 },
    get seq() {
      return log.length
    },
    eventAt: (i) => log[i],
    append: (type, data) => {
      log.push({ type, data })
      return log.length
    },
    get log() {
      return log
    },
  }
}

/** 一个假 agent —— `scopeTarget()` 只读 `agent[Context.filter]`（普通对象为 undefined ⇒ 全局 listener 收得到）。 */
function fakeAgent(session) {
  return { id: 'trae-015-probe-agent', session }
}

/** 取一个 session 的事件类型序列（真实 session 用）。 */
function eventTypes(session, from = 0) {
  const out = []
  try {
    for (let i = from; i < session.seq; i += 1) out.push(session.eventAt(i)?.type ?? '<none>')
  } catch (e) {
    out.push(`<error ${String(e?.message ?? e).slice(0, 80)}>`)
  }
  return out
}

export default class PresetProbe015 {
  /** 不强制任何服务：服务缺席要被"报告出来"，而不是让插件永远 pending。 */
  static inject = []

  constructor(ctx) {
    const report = {
      at: new Date().toISOString(),
      pid: process.pid,
      platform: process.platform,
      ourPreset: OUR_PRESET,
      officialExpected: OFFICIAL,
      t0: {},
      A: null,
      B: null,
      C: null,
      D: null,
      notReady: null,
      errors: [],
    }

    // ---------- t0 快照：不 inject 时立刻能看到哪些服务（证明激活顺序 / 缺席显形） ----------
    for (const name of ['shell', 'approval', 'permissionPresets', 'userQuestions', 'sessions', 'sessionProjections']) {
      try {
        report.t0[name] = ctx[name] === undefined ? 'undefined' : ctx[name]?.constructor?.name ?? '<anon>'
      } catch (e) {
        report.t0[name] = `THREW: ${String(e?.message ?? e)}`
      }
    }
    note(`t0: ${JSON.stringify(report.t0)}`)

    const write = () => {
      try {
        mkdirSync(ROOT, { recursive: true })
        writeFileSync(OUT, JSON.stringify(report, null, 2))
      } catch (e) {
        report.errors.push(`write failed: ${String(e?.message ?? e)}`)
      }
    }

    // ---------- 主套件：等四个服务就绪后跑 ----------
    const main = async (sctx) => {
      try {
        await runAll(sctx, report)
      } catch (e) {
        report.errors.push(`main: ${String(e?.stack ?? e).slice(0, 900)}`)
        note(`main threw: ${String(e?.message ?? e)}`)
      }
      write()
      note(`report written -> ${OUT}`)
    }

    try {
      ctx.inject(['shell', 'approval', 'permissionPresets', 'sessionProjections', 'sessions'], (sctx) => {
        main(sctx)
      })
    } catch (e) {
      report.errors.push(`inject threw: ${String(e?.message ?? e)}`)
      note(`inject threw: ${report.errors.at(-1)}`)
    }

    // 缺席显形：8 s 后仍未开跑 ⇒ 写明"服务未就绪"，不静默
    try {
      setTimeout(() => {
        if (report.A === null && report.notReady === null) {
          report.notReady =
            'shell/approval/permissionPresets/sessionProjections 四服务在 8 s 内未同时就绪 ⇒ ctx.inject 回调未触发'
          note(report.notReady)
          write()
        }
      }, 8000)
    } catch {
      /* ignore */
    }

    write()
  }
}

/** A 组：服务存在性 + 实际成员 + shell 的 confinement 能力事实。 */
function runA(ctx, octx, report) {
  const A = { services: {} }
  for (const name of ['approval', 'permissionPresets', 'shell', 'sessionProjections', 'sessions']) {
    let svc
    try {
      svc = ctx[name]
    } catch (e) {
      A.services[name] = { threw: String(e?.message ?? e) }
      continue
    }
    A.services[name] = { ctor: svc?.constructor?.name ?? null, members: membersOf(svc) }
    note(`A ${name}: ctor=${A.services[name].ctor} members=[${A.services[name].members.join(',')}]`)
  }

  // 次要服务（userQuestions / sandbox / sandboxPolicy / tools）：另一条 inject 线取，缺席不等于主套件失败
  A.optionalReached = octx !== null
  if (octx === null) {
    for (const name of ['userQuestions', 'sandbox', 'sandboxPolicy', 'tools']) A.services[name] = 'not-ready(3s)'
    note('A optional: userQuestions/sandbox/sandboxPolicy/tools 在 3 s 内未就绪')
  } else {
    for (const name of ['userQuestions', 'sandbox', 'sandboxPolicy', 'tools']) {
      try {
        const svc = octx[name]
        A.services[name] = { ctor: svc?.constructor?.name ?? null, members: membersOf(svc) }
        note(`A ${name}: ctor=${A.services[name].ctor} members=[${A.services[name].members.join(',')}]`)
      } catch (e) {
        A.services[name] = { threw: String(e?.message ?? e) }
      }
    }
    // 派发稿 C 组追问：「工具开关」preset 表管不到 —— 那另有机制吗？`ctx.tools.restrict()` 就是那个机制。
    // 这里只做**最小实证**：从插件 ctx（无 agent 作用域）调用，应被作用域守卫拒绝。
    if (A.services.tools?.members !== undefined) {
      A.toolGate = {}
      attempt(A.toolGate, 'typeof tools.restrict', () => typeof octx.tools?.restrict)
      attempt(A.toolGate, "restrict({deny:['tool_pwsh']}) 从无作用域 ctx 调用", () => octx.tools.restrict({ deny: ['tool_pwsh'] }))
    }
  }

  // ⭐ preset 服务的**装载前置**：要求一个"会 confinement 的 ctx.shell executor"
  A.shellSandboxMode = {
    value: ctx.shell?.sandboxMode ?? null,
    typeof: typeof ctx.shell?.sandboxMode,
    shellCtor: ctx.shell?.constructor?.name ?? null,
  }
  note(`A shell.sandboxMode=${A.shellSandboxMode.value} (typeof ${A.shellSandboxMode.typeof}) shell=${A.shellSandboxMode.shellCtor}`)

  // 关键方法的实际签名面（typeof 逐项）
  A.typeofs = {}
  attempt(A.typeofs, 'permissionPresets.names', () => typeof ctx.permissionPresets?.names)
  attempt(A.typeofs, 'permissionPresets.current', () => typeof ctx.permissionPresets?.current)
  attempt(A.typeofs, 'permissionPresets.resolve', () => typeof ctx.permissionPresets?.resolve)
  attempt(A.typeofs, 'permissionPresets.optionOf', () => typeof ctx.permissionPresets?.optionOf)
  attempt(A.typeofs, 'permissionPresets.selectFor', () => typeof ctx.permissionPresets?.selectFor)
  attempt(A.typeofs, 'permissionPresets.set', () => typeof ctx.permissionPresets?.set)
  attempt(A.typeofs, 'permissionPresets.defaultPreset', () => typeof ctx.permissionPresets?.defaultPreset)
  attempt(A.typeofs, 'approval.request', () => typeof ctx.approval?.request)
  attempt(A.typeofs, 'approval.setPolicy', () => typeof ctx.approval?.setPolicy)
  attempt(A.typeofs, 'approval.effectivePolicy', () => typeof ctx.approval?.effectivePolicy)
  attempt(A.typeofs, 'approval.overrideOf', () => typeof ctx.approval?.overrideOf)
  attempt(A.typeofs, 'userQuestions.ask', () => typeof ctx.userQuestions?.ask)
  attempt(A.typeofs, 'sessions.create', () => typeof ctx.sessions?.create)
  attempt(A.typeofs, 'sandboxPolicy.resolve', () => typeof ctx.sandboxPolicy?.resolve)
  attempt(A.typeofs, 'sandboxPolicy.overrideOf', () => typeof ctx.sandboxPolicy?.overrideOf)
  return A
}

/** B 组：官方表起得来 + 各 API 的实际返回值形状。 */
function runB(ctx, report) {
  const pp = ctx.permissionPresets
  const B = { config: {}, called: {} }
  attempt(B.config, 'typeof names (getter?)', () => typeof pp.names)
  attempt(B.config, 'names', () => pp.names)
  attempt(B.config, 'names.length', () => pp.names?.length)
  attempt(B.config, 'defaultPreset', () => pp.defaultPreset)
  attempt(B.config, 'presets 表内容', () => pp.presets)

  for (const n of [...OFFICIAL, OUR_PRESET, 'custom', 'no-such-preset-xyz']) {
    attempt(B.called, `resolve(${n})`, () => pp.resolve(n))
  }
  for (const n of [...OFFICIAL, OUR_PRESET, 'custom', 'no-such-preset-xyz']) {
    attempt(B.called, `optionOf(${n})`, () => pp.optionOf(n))
  }
  attempt(B.called, 'selectFor({}) 空 knob 态', () => pp.selectFor({ preset: null, sandbox: null, approval: null }))
  attempt(B.called, 'selectFor(workspace-write + ask)', () =>
    pp.selectFor({ preset: null, sandbox: 'workspace-write', approval: 'ask' }),
  )
  attempt(B.called, 'selectFor(read-only + never) —— 表里没有的 combo', () =>
    pp.selectFor({ preset: null, sandbox: 'read-only', approval: 'never' }),
  )
  note(`B names=${JSON.stringify(B.config['names'])} defaultPreset=${JSON.stringify(B.config['defaultPreset'])}`)
  return B
}

/** C 组：自定义 preset 是否被登记 + 是否写穿（真 session）。 */
function runC(ctx, octx, report, { session }) {
  const pp = ctx.permissionPresets
  const sp = octx === null ? null : octx.sandboxPolicy
  const C = {
    ourPreset: OUR_PRESET,
    inNames: Array.isArray(pp.names) ? pp.names.includes(OUR_PRESET) : null,
    names: plain(pp.names),
    resolveOur: null,
    optionOfOur: null,
    selectForOur: null,
    sessionTests: {},
  }
  attempt(C, 'resolveOur', () => pp.resolve(OUR_PRESET))
  attempt(C, 'optionOfOur', () => pp.optionOf(OUR_PRESET))
  attempt(C, 'selectForOur（含我们的档在 options 里）', () => pp.selectFor({ preset: null, sandbox: 'read-only', approval: 'ask' }))

  const S = C.sessionTests
  if (session === null) {
    S.error = '无法创建真实 session ⇒ 本组退化为表级断言（证据等级：装置级）'
    note('C: 无真实 session')
    return C
  }
  S.sessionId = session.id
  const before = eventTypes(session)
  S.logBefore = before
  attempt(S, 'current(session) 切换前', () => pp.current(session))
  attempt(S, `set(session, our="${OUR_PRESET}")`, () => pp.set(session, OUR_PRESET))
  attempt(S, 'current(session) 切换后', () => pp.current(session))
  attempt(S, 'approval.overrideOf(session)', () => ctx.approval.overrideOf(session))
  attempt(S, 'approval.effectivePolicy(session)', () => ctx.approval.effectivePolicy(session))
  attempt(S, 'sandboxPolicy.overrideOf(session)', () => sp.overrideOf(session))
  attempt(S, 'sandboxPolicy.resolve({session})', () => sp.resolve({ session }))
  const after = eventTypes(session)
  S.logDelta = after.slice(before.length)
  S.logAfter = after
  note(`C inNames=${C.inNames} set=${JSON.stringify(S[`set(session, our="${OUR_PRESET}")`])} delta=${JSON.stringify(S.logDelta)}`)

  // 正向对照：另一条官方档也必须能切（证明"写路径本身是通的"，避免把装置坏掉读成"我们的档不生效"）
  attempt(S, "set(session, 'danger-full-access')（正向对照）", () => pp.set(session, 'danger-full-access'))
  attempt(S, 'current(session) 对照后', () => pp.current(session))
  attempt(S, 'approval.effectivePolicy(session) 对照后', () => ctx.approval.effectivePolicy(session))
  S.logDeltaControl = eventTypes(session).slice(after.length)
  return C
}

/** D 组：fail-closed 反向对照 × 正向对照（假 session 满足 open-turn 前置，证据等级 = 装置级）。 */
async function runD(ctx, report) {
  const D = { evidenceLevel: '装置级：假 session（部分实现 seq/eventAt/append）满足 request() 的 open-turn 前置；未经模型轮', scenarios: [] }
  let invoked = 0
  let mode = 'none'

  /** 单场景。 */
  const scenario = async (id, { answerer = 'none', policy = null, abort = false, noOpenTurn = false } = {}) => {
    const events = noOpenTurn ? [{ type: 'turn/end' }] : [{ type: 'turn/start' }]
    if (policy !== null) events.unshift({ type: 'approval/policy', data: { policy } })
    const session = fakeSession(events)
    const agent = fakeAgent(session)
    mode = answerer
    const before = invoked
    const rec = { id, answerer, policy, abort, noOpenTurn }
    try {
      const signal = abort ? AbortSignal.abort() : undefined
      const outcome = await ctx.approval.request({
        agent,
        toolName: 'trae-015-probe',
        reason: `fail-closed probe: ${id}`,
        ...(signal === undefined ? {} : { signal }),
      })
      rec.threw = false
      rec.outcome = outcome
    } catch (e) {
      rec.threw = true
      rec.error = String(e?.message ?? e).slice(0, 300)
    }
    rec.answererInvoked = invoked > before
    rec.auditAppended = session.log.filter((e) => String(e.type).startsWith('approval/')).map((e) => `${e.type}:${JSON.stringify(e.data)}`)
    D.scenarios.push(rec)
    note(`D ${id}: ${rec.threw ? `THREW(${rec.error?.slice(0, 60)})` : `outcome=${rec.outcome}`} answererInvoked=${rec.answererInvoked} audit=${rec.auditAppended.join('|')}`)
    return rec
  }

  // ① 完全没有 answerer（listener 尚未注册）
  await scenario('D1 无 answerer（零 listener）', { answerer: 'none' })

  // 注册我们的 answerer（此后所有场景共用；行为由 mode 控制）
  ctx.on('approval/request', (_req, next) => {
    invoked += 1
    switch (mode) {
      case 'throw':
        throw new Error('trae-015-probe: answerer 故意抛错')
      case 'garbage':
        return 'yes' // 不在封闭词表内
      case 'allow':
        return 'allowed-once'
      case 'reject':
        return 'rejected'
      case 'cancel':
        return 'cancelled'
      default:
        return next() // 委派 ⇒ 落到 terminus 'unavailable'
    }
  })

  await scenario('D2 answerer 委派 next()', { answerer: 'none' })
  await scenario('D3 answerer 抛错', { answerer: 'throw' })
  await scenario('D4 answerer 返回非词表值 "yes"', { answerer: 'garbage' })
  await scenario('D5 ⭐正向对照：answerer 明确同意', { answerer: 'allow' })
  await scenario('D6 正向对照：answerer 明确拒绝', { answerer: 'reject' })
  await scenario('D7 正向对照：answerer 明确取消', { answerer: 'cancel' })
  await scenario('D8 signal 已 abort（answerer=同意）', { answerer: 'allow', abort: true })
  await scenario('D9 policy=never + answerer=同意（证明 never 先于 answerer）', { answerer: 'allow', policy: 'never' })
  await scenario('D10 无 open turn（前置不满足）', { answerer: 'allow', noOpenTurn: true })

  D.verdict = {
    noAnswererUnavailable: D.scenarios.find((s) => s.id.startsWith('D1'))?.outcome === 'unavailable',
    delegateUnavailable: D.scenarios.find((s) => s.id.startsWith('D2'))?.outcome === 'unavailable',
    throwUnavailable: D.scenarios.find((s) => s.id.startsWith('D3'))?.outcome === 'unavailable',
    garbageUnavailable: D.scenarios.find((s) => s.id.startsWith('D4'))?.outcome === 'unavailable',
    positiveAllowed: D.scenarios.find((s) => s.id.startsWith('D5'))?.outcome === 'allowed-once',
    neverRejects: D.scenarios.find((s) => s.id.startsWith('D9'))?.outcome === 'rejected',
    noOpenTurnThrows: D.scenarios.find((s) => s.id.startsWith('D10'))?.threw === true,
    abortedCancelled: D.scenarios.find((s) => s.id.startsWith('D8'))?.outcome === 'cancelled',
  }
  note(`D verdict=${JSON.stringify(D.verdict)}`)
  return D
}

/** 取一条**次要**服务线（userQuestions / sandbox / sandboxPolicy）：3 s 拿不到就继续，不拖垮主套件。 */
function optionalContext(ctx) {
  return new Promise((resolvePromise) => {
    let settled = false
    const done = (v) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolvePromise(v)
    }
    const timer = setTimeout(() => done(null), 3000)
    try {
      ctx.inject(['userQuestions', 'sandbox', 'sandboxPolicy', 'tools'], (octx) => done(octx))
    } catch {
      done(null)
    }
  })
}

/** A → B → C → D 总装。 */
async function runAll(ctx, report) {
  const octx = await optionalContext(ctx)
  report.A = runA(ctx, octx, report)
  report.B = runB(ctx, report)

  // 真 session（create 会 announce ⇒ 触发 preset 服务的 pinInitialPermission）
  let session = null
  try {
    session = ctx.sessions.create(`trae-015-probe-${Date.now()}`.slice(0, 64), { meta: { cwd: ROOT } })
    note(`真 session 创建成功: ${session.id} seq=${session.seq} events=[${eventTypes(session).join(',')}]`)
  } catch (e) {
    note(`真 session 创建失败（C 组退化为表级）: ${String(e?.message ?? e)}`)
    report.errors.push(`sessions.create: ${String(e?.message ?? e)}`)
  }
  report.C = runC(ctx, octx, report, { session })
  report.D = await runD(ctx, report)
}
