/**
 * `@larryagent/dsh-driver` —— DSH-3.8.1 · **driver 成型**
 *
 * 它是 `harness/scripts/33b-thin-client.mjs`（3.3-b 的**装置对端**）的**产品级继承者**：
 * 那个对端「跑一次就退、收到审批就自己答 `allowed-once`」；本 driver **常驻**、把出站反向请求
 * **原样交给上层**，并且**能自己退出**（⛔ 不靠 `kill()`、⛔ 不靠 `process.exit()`）。
 *
 * 四类能力（对应派发稿 §3）：
 *   1. **生命周期**：`start()` 按 C13 形态起 dsh（`dsh --profile <name> [--patch <file>…]`）；
 *      `stop()` **自退** —— 发协议 `shutdown` ⇒ 等 dsh 自己 `exit` ⇒ 摘干净监听与定时器 ⇒
 *      让 Node 的**事件循环自然排空**（本模块**全文无 `process.exit`**，可 grep 自证）。
 *   2. **事件上行**：`hooks.onNotification`（本块只保证最小切片：`session/status` 一类能上来；
 *      稿 §11.3 的 19 类映射表未填全 ⇒ ⛔ 本块不硬填）。
 *   3. **反向请求上行**：`hooks.onReverseRequest`（帧 `id` ／ `requestId` ／ `toolName` ／ `callId` ／
 *      `agentId` ／ `reason` 全部原样交出）。⛔ **driver 绝不自答** —— 没有上层调 `answer()`，
 *      那条 inbound 请求的应答就**永远不写回**（对端观测到"无响应/超时"，而不是某个词汇）。
 *   4. **应答下行**：`answer(frameId, result)` ⇒ 把结果写回那条反向请求。
 *
 * ⚠️ **三条从 3.3-b 继承来的既知坑（勿重踩）**：
 *   - `onRequest` 是**替换语义**（"replacing any prior handler"）⇒ **全进程只准一处挂载**（K2）。
 *   - **帧 `id` 拿不到**：`onRequest` 的 handler 签名只有 `(method, params)` ⇒ **必须**靠原始帧 tap
 *     （注册**早于** `transport.start()`）才能取到该请求的帧 `id` —— 没有它 `answer()` 无从下手。
 *     ⇒ tap 不是可选优化，是**应答能力的必要条件**。
 *   - dsh 子进程**已退出后**再 `transport.request()` 会**永久挂起**（输入流已 end ⇒ 新条目无对端可答、
 *     `failPending` 也已跑过）⇒ 本模块在 `request()` 入口先判存活并**立即抛错**。
 *
 * ⚠️ **类本体不可复用**（稿 §11.1）：`JsonRpcLineTransport` 是**行分帧**；A 段是**每事件一帧**。
 * 本模块复用的是它的**语义**（id 关联 ／ 单挂载 ／ 失败清空 ／ `AbortSignal`），不是它的类。
 *
 * @module @larryagent/dsh-driver
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { fileURLToPath } from 'node:url'
import { JsonRpcLineTransport } from '@deepseek-ai/dsh-sdk-protocol'

/** 实际 spawn 的东西（`command` ＋ `args` 原文）。 */
export interface LaunchSpec {
  command: string
  args: string[]
}

/** 一条来自 DSH 的**出站反向请求** —— 原样交给上层，driver 不解释、不自答。 */
export interface ReverseRequestEntry {
  /** 该请求的 JSON-RPC 帧 `id`（靠 tap 取到；`answer()` 用它定位）。 */
  frameId: string | number | null
  method: string
  params: Record<string, unknown>
  requestId: string | null
  toolName: string | null
  callId: string | null
  agentId: string | null
  reason: string | null
  receivedAt: string
}

/** 上层挂钩（全部可选）。 */
export interface DriverHooks {
  /** 事件上行：DSH 的通知（`session/status` 等）。 */
  onNotification?(method: string, params: Record<string, unknown>): void
  /** 反向请求上行：⛔ 上层不答 ⇒ 该请求就一直不结算。 */
  onReverseRequest?(entry: ReverseRequestEntry): void
  /** 子进程退出（driver 自己也会随之收工）。 */
  onChildExit?(info: { code: number | null; signal: string | null }): void
  /** 诊断行（stderr 等），**不是**协议面。 */
  onDiagnostic?(line: string): void
}

/** 构造参数。 */
export interface DriverOptions {
  /** `--profile <name>`（必填 —— C13 形态要求启动形态只能是这一种 ＋ ordered patch files）。 */
  profile: string
  /** `--patch <file>`（可重复；叠加在 profile 层之后）。 */
  patches?: string[]
  /** `DSH_HOME`（**临时 home**；⛔ 不指真 home，见派发稿禁区 2）。 */
  dshHome?: string
  /** 子进程 cwd。 */
  cwd?: string
  /** 子进程 env（缺省继承本进程；`dshHome` 会覆盖其中的 `DSH_HOME`）。 */
  env?: Record<string, string | undefined>
  /** node 可执行文件；缺省 `process.execPath`。 */
  nodePath?: string
  /** dsh bin；缺省按 `@deepseek-ai/dsh/lib/bin.js` 解析。 */
  dshBin?: string
  /** ⚠️ **仅装置用**：直接指定 command/args（J4 的**桩 dsh** 走这里）。产品路径不用。 */
  launch?: LaunchSpec
  initializeTimeoutMs?: number
  requestTimeoutMs?: number
  /** 发完 `shutdown` 后等子进程自退的上限。 */
  shutdownTimeoutMs?: number
  /** 超过此值仍不退才 `kill()`（**会被记为 `forced:true`**，判据要求 `forced:false`）。0 = 永不 force。 */
  forceAfterMs?: number
  /** 关流之后再等子进程退出的上限（见 `stop()` 的第二段等待）。缺省 3 000。 */
  postCloseExitWaitMs?: number
  /** 反向请求"上层迟迟未答"的**留痕**阈值（只留痕，⛔ 不代答、不结算）。0 = 关。 */
  reverseIdleWarnMs?: number
  /** 打点文件；`false` = 关；缺省 = `<DSH_HOME>/dsh-driver.log`。 */
  marker?: string | false
  hooks?: DriverHooks
}

export interface StartReport {
  launchMode: 'dsh-cli' | 'device-stub'
  command: string
  args: string[]
  argv: string[]
  cwd: string
  dshHome: string | null
  childPid: number | null
  /** ⚠️ 只判**存在性**，⛔ 从不读值。 */
  envKeyPresent: boolean
  marker: string | null
  wireLog: string | null
}

export interface StopReport {
  stopRequestedAt: string
  totalMs: number
  childWasAliveAtStop: boolean
  shutdown: { ok: boolean; result?: unknown; error?: string }
  childExit: { exited: boolean; code: number | null; signal: string | null; msSinceStopRequest: number | null }
  /** 第一段等待（发完 shutdown 后）是否直接等到；若 false 而 childExit.exited=true，说明靠**关流级联**才退的。 */
  exitedBeforeStreamClose: boolean
  /** ⛔ 判据要求 false：true 表示收尾**依赖了** kill。 */
  forced: boolean
  killCalled: boolean
  pendingReversesAtStop: number
  activeResourcesBefore: string[]
  activeResourcesAfter: string[]
  /** 本模块**从不**调用 `process.exit` —— 这一栏是自证：false = 收尾靠事件循环自然排空。 */
  processExitCalled: false
}

/** ⚠️ 已知坑的显式化：子进程已退出后**不能**再发请求（会永久挂起）。 */
export class DriverChildExitedError extends Error {
  readonly code = 'DRIVER_CHILD_EXITED'
  constructor(message = 'dsh child already exited: a new request would hang forever (input stream ended)') {
    super(message)
    this.name = 'DriverChildExitedError'
  }
}

/** 默认 dsh bin：先按包名解析，再退化为"向上找 node_modules"。 */
function defaultDshBin(): string {
  try {
    return createRequire(import.meta.url).resolve('@deepseek-ai/dsh/lib/bin.js')
  } catch {
    /* 落到下面的目录回退 */
  }
  let dir = dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(dir, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
    if (existsSync(candidate)) return candidate
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  throw new Error('@larryagent/dsh-driver: cannot locate @deepseek-ai/dsh/lib/bin.js (pass options.dshBin)')
}

function markerPathFor(config: DriverOptions): string | null {
  if (config.marker === false) return null
  if (typeof config.marker === 'string' && config.marker !== '') return config.marker
  const home = config.dshHome ?? process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'dsh-driver.log')
}

/**
 * DSH driver：起 dsh、常驻、把上行交给上层、**并能在收工时自己退出**。
 */
export class DshDriver {
  private readonly options: DriverOptions
  private readonly hooks: DriverHooks
  private readonly marker: string | null
  private readonly wireLog: string | null
  private readonly timers = new Set<NodeJS.Timeout>()
  private readonly activeResourcesBefore: string[]

  private child: ChildProcessWithoutNullStreams | undefined
  private transport: JsonRpcLineTransport | undefined
  private launch: LaunchSpec | undefined
  private startReport: StartReport | undefined
  private stopReport: StopReport | undefined

  private readonly tapDecoder = new StringDecoder('utf8')
  private tapBuffer = ''
  /** 帧原文留痕（有上限）——J2 要的"请求帧／响应帧原文"从这里取。 */
  private readonly frames: { dir: 'in' | 'out'; raw: string; at: string }[] = []
  private readonly inboundIdByRequestId = new Map<string, string | number>()
  private lastInboundRequestFrame: { id?: string | number; method?: string } | null = null
  private readonly reverse = new Map<string | number, {
    entry: ReverseRequestEntry
    resolve: (value: unknown) => void
    warnTimer: NodeJS.Timeout | null
    receivedMs: number
  }>()

  private childExited = false
  private childExitInfo: { code: number | null; signal: string | null; at: string } | null = null
  private childExitWaiter: ((info: { code: number | null; signal: string | null }) => void) | null = null
  private childExitPromise: Promise<{ code: number | null; signal: string | null }> | null = null
  private stderrTail = ''
  private started = false

  constructor(options: DriverOptions) {
    if (typeof options?.profile !== 'string' || options.profile === '') {
      throw new Error('@larryagent/dsh-driver: options.profile is required (启动形态只能是 dsh --profile <name>)')
    }
    this.options = options
    this.hooks = options.hooks ?? {}
    this.marker = markerPathFor(options)
    this.wireLog = this.marker === null ? null : `${this.marker}.wire.jsonl`
    this.activeResourcesBefore = process.getActiveResourcesInfo()
  }

  // ── 打点（⛔ 绝不写 stdout：stdout 在 SDK 形态里归协议） ─────────────────────
  private trace(record: Record<string, unknown>): void {
    if (this.marker === null) return
    try {
      mkdirSync(dirname(this.marker), { recursive: true })
      appendFileSync(this.marker, `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`)
    } catch {
      /* 诊断失败不得影响协议 */
    }
  }

  private wire(dir: 'in' | 'out', raw: string): void {
    this.frames.push({ dir, raw, at: new Date().toISOString() })
    if (this.frames.length > 500) this.frames.shift()
    if (this.wireLog === null) return
    try {
      appendFileSync(this.wireLog, `${JSON.stringify({ t: new Date().toISOString(), dir, raw })}\n`)
    } catch {
      /* 留痕失败不影响协议 */
    }
  }

  private timer(fn: () => void, ms: number): NodeJS.Timeout {
    const handle = setTimeout(() => {
      this.timers.delete(handle)
      fn()
    }, ms)
    this.timers.add(handle)
    return handle
  }

  /** 解析实际启动形态。 */
  private resolveLaunch(): LaunchSpec {
    if (this.options.launch !== undefined) return this.options.launch
    const command = this.options.nodePath ?? process.execPath
    const bin = this.options.dshBin ?? defaultDshBin()
    const args = [bin, '--profile', this.options.profile]
    for (const patch of this.options.patches ?? []) args.push('--patch', patch)
    return { command, args }
  }

  /** 起 dsh（幂等：重复调用返回同一份报告）。 */
  start(): StartReport {
    if (this.startReport !== undefined) return this.startReport
    const launch = this.resolveLaunch()
    this.launch = launch
    const env: Record<string, string | undefined> = { ...(this.options.env ?? process.env) }
    if (this.options.dshHome !== undefined) env.DSH_HOME = this.options.dshHome
    const cwd = this.options.cwd ?? process.cwd()

    const child = spawn(launch.command, launch.args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] })
    this.child = child

    // ⭐ 原始帧 tap：注册**早于** `transport.start()` ⇒ 先于 transport 看到同一批 chunk。
    //    它是**取帧 id 的唯一手段**（`onRequest` 的 handler 拿不到 id），也是 J2 帧原文的来源。
    child.stdout.on('data', (chunk: Buffer | string) => this.onStdoutData(chunk))
    // ⭐ 出站帧留痕：包 `child.stdin.write` —— 只有这一层抓得到 transport **自己**写的帧。
    const originalWrite = child.stdin.write.bind(child.stdin)
    child.stdin.write = ((chunk: string | Buffer, ...rest: unknown[]) => {
      this.wire('out', String(chunk).replace(/\r?\n+$/, ''))
      return (originalWrite as (...args: unknown[]) => boolean)(chunk, ...rest)
    }) as typeof child.stdin.write
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => {
      this.stderrTail += chunk
      if (this.stderrTail.length > 40_000) this.stderrTail = this.stderrTail.slice(-40_000)
      for (const line of chunk.split(/\r?\n/)) if (line.trim() !== '') this.hooks.onDiagnostic?.(line)
    })
    child.once('exit', (code, signal) => {
      this.childExited = true
      this.childExitInfo = { code, signal, at: new Date().toISOString() }
      this.trace({ event: 'child-exit', code, signal, pid: child.pid ?? null })
      this.childExitWaiter?.({ code, signal })
      this.childExitWaiter = null
      this.hooks.onChildExit?.({ code, signal })
    })
    this.childExitPromise = new Promise((resolvePromise) => {
      if (this.childExited) resolvePromise({ code: this.childExitInfo?.code ?? null, signal: this.childExitInfo?.signal ?? null })
      else this.childExitWaiter = resolvePromise
    })

    const transport = new JsonRpcLineTransport(child.stdout, child.stdin)
    transport.onNotification((method, params) => {
      this.trace({ event: 'notification', method })
      this.hooks.onNotification?.(method, params)
    })
    // ⛔⛔ 全进程**唯一**一处 `onRequest`（替换语义 —— 谁后装谁赢，先装者被静默顶掉）
    transport.onRequest(async (method, params) => this.handleReverseRequest(method, params))
    transport.start()
    this.transport = transport
    this.started = true

    const report: StartReport = {
      launchMode: this.options.launch !== undefined ? 'device-stub' : 'dsh-cli',
      command: launch.command,
      args: launch.args,
      argv: [launch.command, ...launch.args],
      cwd,
      dshHome: this.options.dshHome ?? process.env.DSH_HOME ?? null,
      childPid: child.pid ?? null,
      envKeyPresent: 'DEEPSEEK_API_KEY' in env,
      marker: this.marker,
      wireLog: this.wireLog,
    }
    this.startReport = report
    this.trace({
      event: 'driver-start',
      ...report,
      pid: process.pid,
      node: process.version,
      execPath: process.execPath,
      note: '帧 id 由 transport 内部生成；原文见 wireLog',
    })
    return report
  }

  private onStdoutData(chunk: Buffer | string): void {
    this.tapBuffer += this.tapDecoder.write(chunk)
    for (;;) {
      const nl = this.tapBuffer.indexOf('\n')
      if (nl < 0) break
      const line = this.tapBuffer.slice(0, nl).trim()
      this.tapBuffer = this.tapBuffer.slice(nl + 1)
      if (line === '') continue
      this.wire('in', line)
      let frame: { id?: string | number; method?: string; params?: Record<string, unknown> } | undefined
      try {
        frame = JSON.parse(line)
      } catch {
        continue
      }
      if (frame !== undefined && typeof frame.method === 'string' && frame.id !== undefined) {
        this.lastInboundRequestFrame = frame
        const requestId = frame.params?.requestId
        if (typeof requestId === 'string') this.inboundIdByRequestId.set(requestId, frame.id)
      }
    }
  }

  /**
   * DSH 出站反向请求的**唯一**入口。
   * ⛔ 这里**绝不**产生答案：返回的 Promise 只可能被上层 `answer()` 兑现。
   */
  private handleReverseRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    const rawParams = (params ?? {}) as Record<string, unknown>
    const requestId = typeof rawParams.requestId === 'string' ? rawParams.requestId : null
    const frameId = (requestId !== null ? this.inboundIdByRequestId.get(requestId) : undefined)
      ?? this.lastInboundRequestFrame?.id ?? null
    const entry: ReverseRequestEntry = {
      frameId,
      method,
      params: rawParams,
      requestId,
      toolName: typeof rawParams.toolName === 'string' ? rawParams.toolName : null,
      callId: typeof rawParams.callId === 'string' ? rawParams.callId : null,
      agentId: typeof rawParams.agentId === 'string' ? rawParams.agentId : null,
      reason: typeof rawParams.reason === 'string' ? rawParams.reason : null,
      receivedAt: new Date().toISOString(),
    }
    this.trace({
      event: 'reverse-request',
      ...entry,
      noAutoAnswer: true,
      detail: frameId === null
        ? '⚠️ 未取到帧 id（tap 未覆盖该帧？）⇒ 上层即使想答也无从下手'
        : '已交给上层；driver 自身不会代答',
    })
    this.hooks.onReverseRequest?.(entry)

    if (frameId === null) {
      // 拿不到 id ⇒ 这条请求**无法**被结算（诚实暴露，而不是假装答了）
      return new Promise<never>(() => {})
    }
    return new Promise<unknown>((resolvePromise) => {
      const warnMs = this.options.reverseIdleWarnMs ?? 0
      const warnTimer = warnMs > 0
        ? this.timer(() => {
          this.trace({
            event: 'reverse-answer-missing',
            frameId,
            method,
            requestId,
            waitedMs: warnMs,
            note: '上层仍未作答；本条**保持未结算**（⛔ driver 不代答、不造词）',
          })
        }, warnMs)
        : null
      this.reverse.set(frameId, { entry, resolve: resolvePromise, warnTimer, receivedMs: Date.now() })
    })
  }

  /** 上层给出人答结果 ⇒ 由 driver 写回（capability 4）。`frameId` 取自 `onReverseRequest`。 */
  answer(frameId: string | number, result: unknown): boolean {
    const pending = this.reverse.get(frameId)
    if (pending === undefined) {
      this.trace({ event: 'reverse-answer-rejected', frameId, reason: 'unknown-or-already-settled' })
      return false
    }
    this.reverse.delete(frameId)
    if (pending.warnTimer !== null) {
      clearTimeout(pending.warnTimer)
      this.timers.delete(pending.warnTimer)
    }
    this.trace({
      event: 'reverse-answer-sent',
      frameId,
      result,
      byUpperLayer: true,
      waitedMs: Date.now() - pending.receivedMs,
      method: pending.entry.method,
      requestId: pending.entry.requestId,
    })
    pending.resolve(result)
    return true
  }

  get pendingReverseCount(): number {
    return this.reverse.size
  }

  get isChildExited(): boolean {
    return this.childExited
  }

  get childExit(): { code: number | null; signal: string | null } | null {
    return this.childExitInfo === null ? null : { code: this.childExitInfo.code, signal: this.childExitInfo.signal }
  }

  get argv(): string[] {
    return this.startReport?.argv ?? []
  }

  /** 发一条请求（带超时；⛔ 子进程已退则立即抛错，不挂死）。 */
  async request(method: string, params: object = {}, timeoutMs?: number): Promise<unknown> {
    if (!this.started) this.start()
    if (this.childExited) throw new DriverChildExitedError(`cannot send "${method}": dsh child already exited`)
    const transport = this.transport
    if (transport === undefined) throw new DriverChildExitedError('transport is not attached')
    const timeout = timeoutMs ?? this.options.requestTimeoutMs ?? 10_000
    const abandon = new AbortController()
    const timer = this.timer(() => abandon.abort(new Error(`${method} timed out after ${timeout}ms`)), timeout)
    try {
      return await transport.request(method, params, abandon.signal)
    } finally {
      clearTimeout(timer)
      this.timers.delete(timer)
    }
  }

  /** 一次协议往返：`initialize`（J2）。返回结果 ＋ 耗时 ＋ **该次往返的帧原文**。 */
  async initialize(extra: Record<string, unknown> = {}): Promise<{
    result: unknown
    elapsedMs: number
    frames: { dir: 'in' | 'out'; raw: string; at: string }[]
  }> {
    const before = this.frames.length
    const t0 = Date.now()
    const params = {
      cwd: this.options.cwd ?? process.cwd(),
      provider: 'deepseek-official',
      model: 'deepseek-flash',
      ...extra,
    }
    const result = await this.request('initialize', params, this.options.initializeTimeoutMs ?? 10_000)
    const elapsedMs = Date.now() - t0
    const frames = this.frames.slice(before)
    this.trace({
      event: 'initialize',
      elapsedMs,
      requestParams: params,
      responseRaw: JSON.stringify(result ?? null),
      frameCount: frames.length,
      note: '帧原文见 wireLog；响应形状须含 serverInfo.name/version',
    })
    return { result, elapsedMs, frames }
  }

  /** 发一条 prompt（受理回执，非答案）。 */
  async prompt(sessionId: string, text: string, timeoutMs?: number): Promise<{ messageId: string }> {
    const result = await this.request(
      'session/prompt',
      { sessionId, contentBlocks: [{ type: 'text', text }] },
      timeoutMs,
    )
    const messageId = (result as { messageId?: unknown } | null)?.messageId
    if (typeof messageId !== 'string') throw new Error(`session/prompt returned no messageId: ${JSON.stringify(result ?? null)}`)
    return { messageId }
  }

  /** 等子进程退出（或到时）。 */
  private waitChildExit(timeoutMs: number): Promise<boolean> {
    if (this.childExited) return Promise.resolve(true)
    const promise = this.childExitPromise ?? Promise.resolve(null)
    return new Promise<boolean>((resolvePromise) => {
      const timer = setTimeout(() => resolvePromise(false), timeoutMs)
      void promise.then(() => {
        clearTimeout(timer)
        resolvePromise(true)
      })
    })
  }

  /**
   * 收工：**能自己退出**的那条路径。
   * 顺序 = 发协议 `shutdown`（让 dsh 自己收尾并 `exit`）⇒ 等它真的退出 ⇒ 摘监听／清定时器／销毁流
   * ⇒ 事件循环自然排空。⛔ 全程**不调 `process.exit`**；只有在超时才 `kill()` 并记 `forced:true`。
   */
  async stop(): Promise<StopReport> {
    if (this.stopReport !== undefined) return this.stopReport
    const stopRequestedAt = new Date().toISOString()
    const childWasAliveAtStop = !this.childExited
    const shutdownTimeoutMs = this.options.shutdownTimeoutMs ?? 5_000
    const forceAfterMs = this.options.forceAfterMs ?? shutdownTimeoutMs + 2_000

    this.trace({ event: 'stop-requested', at: stopRequestedAt, childAlive: childWasAliveAtStop, pendingReverses: this.reverse.size })
    const t0 = Date.now()
    let shutdown: StopReport['shutdown'] = { ok: false, error: 'child already exited before shutdown' }
    if (childWasAliveAtStop) {
      try {
        const result = await this.request('shutdown', {}, shutdownTimeoutMs)
        shutdown = { ok: true, result }
      } catch (e) {
        shutdown = { ok: false, error: String((e as Error)?.message ?? e) }
      }
    }
    const exited = await this.waitChildExit(Math.max(shutdownTimeoutMs, 1_000))
    let forced = false
    let killCalled = false
    if (!exited && forceAfterMs > 0) {
      // ⚠️ 最后手段：会被如实记为 forced:true（判据要求 false ⇒ 这里不该被走到）
      this.trace({ event: 'force-kill', reason: `child did not exit within ${forceAfterMs}ms after shutdown` })
      killCalled = true
      try {
        this.child?.kill()
      } catch {
        /* ignore */
      }
      forced = true
      await this.waitChildExit(2_000)
    }
    // ⭐ 第二段等待（3.8.1 实测补）：**关流会触发对端 EOF 级联** ⇒ 若第一段没等到（例如收工时还挂着
    //    一条未结算的反向请求，dsh 的 root dispose 会被在飞的回合拖住），关掉本侧管道后它往往立刻退。
    //    ⛔ 这一步必须**先关流、后摘 `exit` 监听** —— 否则监听被摘掉就再也等不到（会退化成"永远 exited:false"）。
    let exitedAfterClose = exited
    if (!exited) {
      this.closeStreams()
      exitedAfterClose = await this.waitChildExit(this.options.postCloseExitWaitMs ?? 3_000)
      this.trace({ event: 'post-close-exit-wait', parentExitWaitTimedOut: !exited, exitedAfterClose })
    }
    const msSinceStopRequest = this.childExitInfo === null
      ? null
      : Date.parse(this.childExitInfo.at) - Date.parse(stopRequestedAt)
    const pendingReversesAtStop = this.reverse.size
    this.teardown()
    // ⚠️ `destroy()` 对管道是**异步**回收的 ⇒ 紧接着采样会把刚销毁的 PipeWrap 仍算作"活着"。
    //    让出一个微/宏任务再采，读数才诚实（首跑实测：立即采样得 ["PipeWrap","ProcessWrap","PipeWrap","Timeout"]，
    //    而进程随后自行退出 ⇒ 那批是采样时机问题，不是真泄漏）。
    await new Promise((r) => setImmediate(r))
    const report: StopReport = {
      stopRequestedAt,
      totalMs: Date.now() - t0,
      childWasAliveAtStop,
      shutdown,
      childExit: {
        exited: this.childExited,
        code: this.childExitInfo?.code ?? null,
        signal: this.childExitInfo?.signal ?? null,
        msSinceStopRequest,
      },
      forced,
      killCalled,
      pendingReversesAtStop,
      exitedBeforeStreamClose: exited,
      activeResourcesBefore: this.activeResourcesBefore,
      activeResourcesAfter: process.getActiveResourcesInfo(),
      processExitCalled: false,
    }
    this.stopReport = report
    this.trace({ event: 'driver-stop', ...report, stderrTail: this.stderrTail.slice(-2_000) })
    return report
  }

  /** 关掉三条管道（会触发对端 EOF 级联）——⛔ 不动监听与定时器，供"关流后还能等到 exit"用。 */
  private closeStreams(): void {
    const streams = [this.child?.stdin, this.child?.stdout, this.child?.stderr]
    for (const stream of streams) {
      if (stream === undefined || stream === null) continue
      try {
        stream.destroy()
      } catch {
        /* ignore */
      }
    }
  }

  /** 摘干净一切会吊住事件循环的东西（**自退**的关键就在这一步）。 */
  private teardown(): void {
    for (const handle of this.timers) clearTimeout(handle)
    this.timers.clear()
    for (const pending of this.reverse.values()) {
      if (pending.warnTimer !== null) clearTimeout(pending.warnTimer)
      pending.warnTimer = null
    }
    this.reverse.clear()
    if (this.child !== undefined) {
      this.child.stdout.removeAllListeners('data')
      this.child.stderr.removeAllListeners('data')
      this.child.removeAllListeners('exit')
    }
    this.transport?.close()
    this.transport = undefined
    this.closeStreams()
  }
}
