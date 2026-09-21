/**
 * plugin-sdk-relay —— DSH-3.3-b **路 A**：把官方 stdio JSON-RPC server 换成
 * 「**同一装配** ＋ **把 transport 交出来**」。
 *
 * 为什么需要它（3.3-b 派发稿 §1）：
 *   - 官方 `dsh-sdk-jsonrpc-server` 的 `apply()` 里 `new JsonRpcLineTransport(input, output)` 是
 *     **闭包内造**、全文无任何 `ctx.provide` ⇒ transport 经 `ctx` **拿不到**；
 *   - 而本块的答者必须把 `approval/request` **发出去**给另一个进程 ⇒ 必须拿到那个 stdio transport。
 *   ⇒ 路 A = 在 profile 补丁层把官方那行 `disabled: true`，`insert` 本包的行；本包照抄官方装配，
 *     只多一行 `ctx.provide('sdkTransport', transport)`。
 *
 * **照抄范围**（`@deepseek-ai/dsh-sdk-jsonrpc-server/lib/index.js:257-294`）：
 *   `input/output/exit` 的取法、`new HarnessSdkJsonRpcServer(ctx, transport, {maxTokensAsSuccess})`、
 *   `disposeAndExit`、`transport.onRequest(...)` 的三段（`initialize` 等 loader、`handleRequest`、
 *   `shutdown` 后 `setImmediate(disposeAndExit)`）、`ctx.effect(..., "jsonrpc.serve")` 的启停 —— 逐行一致。
 *   本包**多出来的**只有三处：`trace()` 打点、`ctx.provide(...)`、以及 `config` 允许 undefined 的防御。
 *
 * 降级矩阵（能力 / 依赖服务 / 缺失时行为 / 卸载行为）：
 *   | 能力 | 依赖服务 | 缺失时行为 | 卸载行为 |
 *   |---|---|---|---|
 *   | stdio JSON-RPC 服务 | `sdkAppStartup` / `loader` | 由**行的 `inject`** 拦住（插件不 apply） | `ctx.effect` disposer：`server.shutdown()` ＋ `transport.close()` |
 *   | transport 暴露 | 无 | — | 随本 ctx 的 disposer 一起释放 |
 *   @module plugin-sdk-relay
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { Readable, Writable } from 'node:stream'
import { JsonRpcLineTransport } from '@deepseek-ai/dsh-sdk-protocol'
import { HarnessSdkJsonRpcServer } from '@deepseek-ai/dsh-sdk-jsonrpc-server'

/** 诊断用显示名（与官方行不同名，便于在日志里区分谁在服务）。 */
export const name = 'plugin-sdk-relay'

/** 与官方模块一致：`agents` 是模块级硬依赖；`sdkAppStartup`/`loader` 由**行的 `inject`** 补。 */
export const inject: string[] = ['agents']

/** 本包经 `ctx.provide` 暴露 transport 的服务名（答者插件按名取用）。 */
export const TRANSPORT_SERVICE = 'sdkTransport'

/** 插件配置：前四项与官方同名同义，第五项是本包的打点。 */
export interface Config {
  /** 透传给 `HarnessSdkJsonRpcServer`（官方行缺省 true，见本包 `cordis.patch.yml`）。 */
  maxTokensAsSuccess?: boolean
  /** 官方保留的接线口（测试用）；缺省 `process.stdin`。 */
  input?: Readable
  /** 官方保留的接线口（测试用）；缺省 `process.stdout`。 */
  output?: Writable
  /** 官方保留的接线口（测试用）；缺省 `process.exit`。 */
  exit?: (code: number) => void
  /** 打点文件路径；`false` = 关闭；缺省 = `<DSH_HOME>/plugin-sdk-relay.log`。 */
  activateMarker?: string | false
}

/** 结构化最小 ctx —— 不 import cordis 类型（照 3.1/3.3-a 纪律）。 */
interface FiberLike {
  dispose(): Promise<unknown>
}
interface Ctx {
  root: { fiber: FiberLike }
  get(name: string): unknown
  effect(callback: () => (() => unknown) | undefined, label: string): unknown
  provide(name: string, value: unknown): unknown
}

function markerPath(config: Config): string | null {
  if (config.activateMarker === false) return null
  if (typeof config.activateMarker === 'string' && config.activateMarker !== '') return config.activateMarker
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'plugin-sdk-relay.log')
}

/** 打点落盘（失败只吞 —— 打点是诊断，不是业务）。⛔ 绝不写 stdout（stdout 专属 JSON-RPC）。 */
function trace(marker: string | null, record: Record<string, unknown>): void {
  if (marker === null) return
  try {
    mkdirSync(dirname(marker), { recursive: true })
    appendFileSync(marker, `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`)
  } catch {
    /* 诊断失败不得影响服务 */
  }
}

/**
 * 安装 stdio JSON-RPC 服务，并把 transport 暴露给同进程内的其它插件。
 * @param ctx - cordis 上下文
 * @param config - 来自 patch 行的配置块；**允许 undefined**
 */
export function apply(ctx: Ctx, config?: Config | undefined): void {
  const resolvedConfig: Config = { ...(config ?? {}) }
  const marker = markerPath(resolvedConfig)
  const rootFiber = ctx.root.fiber
  /* 官方保留的接线口；生产走 stdio */
  const input = resolvedConfig.input ?? process.stdin
  const output = resolvedConfig.output ?? process.stdout
  const exit = resolvedConfig.exit ?? ((code: number) => {
    process.exit(code)
  })
  const transport = new JsonRpcLineTransport(input, output)
  const server = new HarnessSdkJsonRpcServer(ctx, transport, { maxTokensAsSuccess: resolvedConfig.maxTokensAsSuccess ?? true })
  // ⭐ 本包相对官方 apply 的**唯一机制增量**：把 transport 交出去（官方造在闭包内、无处可取）
  ctx.provide(TRANSPORT_SERVICE, transport)
  const pendingOf = (): number | null => {
    const pending = (transport as unknown as { pending?: Map<unknown, unknown> }).pending
    return pending instanceof Map ? pending.size : null
  }
  // ⭐ 装置观测点（DSH-3.3-b · J4）：**对端消失**时，本行必须能留下"那一刻还有几条出站请求没结清"。
  //   ① 注册在 `transport.start()` **之前** ⇒ 早于 transport 自己的 `onInputEnd → failPending` 执行，
  //      因此此刻读到的数就是**尚未结清**的条数（`failPending` 之后会清零）。
  //   ② `close()` 是**公开方法**：官方 effect 的 disposer 在收工时调它（= detach ＋ reject pending）。
  //      包一层只为**同步**留痕 —— 进程寿命与 stdin EOF 绑定（`exitOnStdinEnd`），
  //      插件层里那些走 microtask 的 reject 打点可能到不了盘，这一层不会。
  const observedInput = input as unknown as { on?: (event: string, cb: (...args: unknown[]) => void) => unknown }
  observedInput.on?.('end', () => trace(marker, { event: 'input-end', pendingAtEnd: pendingOf() }))
  observedInput.on?.('error', (e) => trace(marker, { event: 'input-error', pendingAtEnd: pendingOf(), error: String((e as Error)?.message ?? e) }))
  const originalClose = transport.close.bind(transport)
  transport.close = (): void => {
    // `close()` 官方语义 = detach ＋ **同步** failPending ⇒ 前后各采一次数，
    // "before > 0 且 after = 0" 就是"那条未结清的出站请求**被 reject**"的直接观测。
    const before = pendingOf()
    originalClose()
    trace(marker, { event: 'transport-close', pendingBeforeClose: before, pendingAfterClose: pendingOf(), note: 'close() = detach + reject pending（官方源码语义）' })
  }
  let exitTask: Promise<void> | undefined
  const disposeAndExit = (): Promise<void> => {
    exitTask ??= (async () => {
      await Promise.allSettled([Promise.resolve().then(() => transport.flush())])
      await Promise.allSettled([Promise.resolve().then(() => rootFiber.dispose())])
      exit(0)
    })()
    return exitTask
  }
  transport.onRequest(async (method, params) => {
    trace(marker, { event: 'server-request-in', method })
    if (method === 'initialize') await (ctx.get('loader') as { await?: () => Promise<unknown> } | undefined)?.await?.()
    const result = await server.handleRequest(method, params)
    if (method === 'shutdown') setImmediate(() => {
      void disposeAndExit()
    })
    return result
  })
  ctx.effect(() => {
    transport.start()
    return async () => {
      await server.shutdown()
      transport.close()
    }
  }, 'jsonrpc.serve')
  const caps = {
    pid: process.pid,
    dshHome: process.env.DSH_HOME ?? null,
    configWasUndefined: config === undefined,
    maxTokensAsSuccess: resolvedConfig.maxTokensAsSuccess ?? true,
    transportService: TRANSPORT_SERVICE,
    transportStarted: (transport as unknown as { started?: boolean }).started === true,
    officialLineDisabled: 'sdk-jsonrpc-server（本包 bundle 层置 disabled:true）',
    // 交叉自检：本插件 apply 很晚（等 sdkAppStartup）⇒ 它读得到别人 provide 的服务吗？
    selfTransportVisible: (ctx.get(TRANSPORT_SERVICE) as unknown) === transport,
    answererVisibleFromRelay: ctx.get('approvalAnswerer') !== undefined,
    answererSourceFromRelay: ((ctx.get('approvalAnswerer') as { source?: string } | undefined)?.source) ?? null,
  }
  process.stderr.write(
    `[plugin-sdk-relay] activate pid=${process.pid} provide=${TRANSPORT_SERVICE} maxTokensAsSuccess=${caps.maxTokensAsSuccess} config=${config === undefined ? 'undefined' : 'given'}\n`,
  )
  trace(marker, { event: 'activate', plugin: name, ...caps })
}
