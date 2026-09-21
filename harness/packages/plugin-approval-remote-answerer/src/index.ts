/**
 * plugin-approval-remote-answerer —— DSH-3.3-b（S1 审批接入 · 第二段）的**远端答者**。
 *
 * 它**不**注册 `approval/request` 监听器（注册是 3.3-a `plugin-approval-answerer` 的活），
 * 只做一件事：把 3.3-a 留的替换口接上 ——
 *
 *   `ctx.provide('approvalAnswerer', remoteImpl)`
 *   （3.3-a：`const injected = probe<Answerer>(ctx, 'approvalAnswerer')`；
 *     `const source = injected ?? createLocalPolicyAnswerer(...)`）
 *
 * `remoteImpl.decide(req)` 的行为 = **真出站往返**：经 `sdkTransport`（由 `plugin-sdk-relay`
 * 提供的那个 stdio transport）把一条 JSON-RPC 请求发给**对端进程**，拿到结果再作答。
 *
 * ⛔ **不改 3.3-a 的包** —— 改了就等于把它一次性化，违反「答者来源须是可替换接口」的设计约束。
 *
 * 三条计时/收尾语义（本块的核心判据来源）：
 *   - **请求侧 signal**（`req.signal`，来自 `ctx.approval` 的调用方）：中止时本插件把
 *     **出站请求一并 abort**（取消传播）⇒ `transport.request` 的 pending 条目被移除、无泄漏；
 *     ⛔ 此时落哪个词汇由**服务侧**决定 = `cancelled`（`dsh-user-approval/lib/index.js:181-191`
 *     的赛跑），本插件只管把出站请求收干净。
 *   - **答者侧自建超时**（`answerTimeoutMs`）：官方答者侧**不存在**超时计时器 ⇒ 想要超时必须在
 *     这里自己实现。到点本插件抛错 ⇒ 服务归一化为 **`unavailable`**，⛔ **不是 `cancelled`**。
 *   - **对端报错/消失**：`transport.request` 以 `JsonRpcResponseError`（如 `-32601`）或
 *     「input closed」类错误 reject ⇒ 本插件**留痕后原样抛出** ⇒ `unavailable`（fail-closed）。
 *
 * 降级矩阵（能力 / 依赖服务 / 缺失时行为 / 卸载行为）：
 *   | 能力 | 依赖服务 | 缺失时行为 | 卸载行为 |
 *   |---|---|---|---|
 *   | 提供 `approvalAnswerer` | 无（`ctx.provide` 即可） | — | 随本 ctx 的 disposer 释放（3.3-a 随即退回本地策略） |
 *   | 出站往返 | `sdkTransport`（`plugin-sdk-relay`） | 记 `remote-no-transport` 后**抛错** ⇒ `unavailable`（**不静默放行**） | — |
 *   | 打点 | 无（直接写文件） | 写失败只吞掉 | — |
 *   @module plugin-approval-remote-answerer
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** 诊断用显示名。 */
export const name = 'plugin-approval-remote-answerer'

/** 零硬依赖（transport 经 `ctx.get` 在**请求时**取，缺失即降级为抛错 ⇒ fail-closed）。 */
export const inject: string[] = []

/** 官方 seam 的结果词汇（`dsh-user-approval/lib/index.js:30-35`）。 */
export const OUTCOMES = ['allowed-once', 'rejected', 'cancelled', 'unavailable'] as const
export type ApprovalOutcome = (typeof OUTCOMES)[number]

/** 3.3-a 约定的替换口服务名（⭐ 两侧必须一致）。 */
export const ANSWERER_SERVICE = 'approvalAnswerer'

/** `plugin-sdk-relay` 暴露 transport 的服务名（⭐ 两侧必须一致）。 */
export const DEFAULT_TRANSPORT_SERVICE = 'sdkTransport'

/** 本块**临时约定**的 RPC 方法名（3.8 定稿后可能改名）。 */
export const DEFAULT_METHOD = 'approval/request'

/** 官方请求事件的结构化投影（不 import 外部类型，避免 link 挂载下解析失败）。 */
export interface ApprovalRequestEvent {
  readonly agent?: { readonly id?: string }
  readonly toolName?: string
  readonly callId?: string
  readonly reason?: string
  readonly signal?: AbortSignal
}

/** 答者接口（与 3.3-a 的 `Answerer` 结构一致）。 */
export interface Answerer {
  readonly source: string
  decide(req: ApprovalRequestEvent): ApprovalOutcome | 'delegate' | Promise<ApprovalOutcome | 'delegate'>
}

/** 出站面：`JsonRpcLineTransport` 的结构化投影（`pending` 是编译期 private、运行期可读，用来证「无泄漏」）。 */
export interface TransportLike {
  request(method: string, params: object, signal?: AbortSignal): Promise<unknown>
  readonly pending?: Map<unknown, unknown>
}

/** 插件配置（全部可选 —— `apply` 必须容忍 `config === undefined`）。 */
export interface Config {
  /** transport 服务名；缺省 `sdkTransport`。 */
  transportService?: string
  /** 出站 RPC 方法名；缺省 `approval/request`。 */
  method?: string
  /** 答者侧**自建**超时（毫秒）；`0`/缺省 = 关闭（把撤回完全交给请求侧 signal）。 */
  answerTimeoutMs?: number
  /** 打点文件路径；`false` = 关闭；缺省 = `<DSH_HOME>/plugin-approval-remote-answerer.log`。 */
  activateMarker?: string | false
}

/** 结构化最小 ctx —— 不 import 外部类型。 */
interface Ctx {
  get?(name: string): unknown
  provide?(name: string, value: unknown): unknown
  root?: Ctx
  logger?: { info?(m: string): void; warn?(m: string): void }
}

function markerPath(config: Config): string | null {
  if (config.activateMarker === false) return null
  if (typeof config.activateMarker === 'string' && config.activateMarker !== '') return config.activateMarker
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'plugin-approval-remote-answerer.log')
}

/** 打点落盘（失败只吞）。⛔ 绝不写 stdout（stdout 专属 JSON-RPC）。 */
function trace(marker: string | null, record: Record<string, unknown>): void {
  if (marker === null) return
  try {
    mkdirSync(dirname(marker), { recursive: true })
    appendFileSync(marker, `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`)
  } catch {
    /* 诊断失败不得影响 boot 与请求处理 */
  }
}

/** 读 pending 条目数（用于证「无泄漏」）；拿不到就读成 null（不编数）。 */
function pendingSize(transport: TransportLike | undefined): number | null {
  const pending = transport?.pending
  return pending instanceof Map ? pending.size : null
}

/** 从请求 `reason` 里取 `case=<名>`（装置用它把多条用例放进同一次运行）。 */
export function caseOfRequest(req: ApprovalRequestEvent): string {
  const reason = typeof req.reason === 'string' ? req.reason : ''
  const hit = /(?:^|[^\w])case=([\w-]+)/.exec(reason)
  return hit?.[1] ?? ''
}

let serial = 0

/**
 * 造**远端答者**实现：不认领本地策略，一切以对端进程的答案为准。
 * @param ctx - cordis 上下文（`decide` 在**请求时**才从它取 transport）
 * @param config - 已归一化配置
 * @param marker - 打点文件路径（null = 关闭）
 * @returns 答者实现
 */
export function createRemoteAnswerer(ctx: Ctx, config: Config, marker: string | null): Answerer {
  const transportService = config.transportService ?? DEFAULT_TRANSPORT_SERVICE
  const method = config.method ?? DEFAULT_METHOD
  const answerTimeoutMs = typeof config.answerTimeoutMs === 'number' && config.answerTimeoutMs > 0 ? Math.floor(config.answerTimeoutMs) : 0

  return {
    source: `remote:${method}`,
    async decide(req: ApprovalRequestEvent): Promise<ApprovalOutcome | 'delegate'> {
      const requestId = `remote-${++serial}`
      // transport 在**请求时**取：relay 的行等 `sdkAppStartup`，apply 晚于本插件 ⇒ 不能在 apply 时探
      const transport = (typeof ctx.get === 'function' ? ctx.get(transportService) : undefined) as TransportLike | undefined
      const pendingBefore = pendingSize(transport)
      if (transport === undefined || typeof transport.request !== 'function') {
        trace(marker, { event: 'remote-no-transport', requestId, transportService, note: 'relay 未装载或未 provide ⇒ fail-closed' })
        throw new Error(`plugin-approval-remote-answerer: transport service ${transportService} is unavailable`)
      }
      const params = {
        requestId,
        case: caseOfRequest(req),
        toolName: req.toolName ?? null,
        callId: req.callId ?? null,
        agentId: req.agent?.id ?? null,
        reason: req.reason ?? null,
      }
      const controller = new AbortController()
      /** 谁先触发撤回：请求侧 signal / 答者侧自建超时。两者落**不同**词汇，故必须分清。 */
      let stopReason: 'request-signal' | 'answerer-timeout' | null = null
      const onAbort = (): void => {
        stopReason = 'request-signal'
        controller.abort(new Error('request signal aborted'))
      }
      if (req.signal !== undefined) {
        if (req.signal.aborted) onAbort()
        else req.signal.addEventListener('abort', onAbort, { once: true })
      }
      const timer = answerTimeoutMs > 0 ? setTimeout(() => {
        stopReason = 'answerer-timeout'
        controller.abort(new Error('answerer-side timeout'))
      }, answerTimeoutMs) : null
      trace(marker, {
        event: 'remote-send',
        requestId,
        method,
        transportService,
        pendingBefore,
        answerTimeoutMs,
        hasRequestSignal: req.signal !== undefined,
        toolName: req.toolName ?? null,
        callId: req.callId ?? null,
        agentId: req.agent?.id ?? null,
        reason: req.reason ?? null,
      })
      try {
        const raw = await transport.request(method, params, controller.signal)
        trace(marker, {
          event: 'remote-answer',
          requestId,
          result: typeof raw === 'string' ? raw : JSON.stringify(raw ?? null),
          pendingAfter: pendingSize(transport),
        })
        if (typeof raw === 'string' && (OUTCOMES as readonly string[]).includes(raw)) return raw as ApprovalOutcome
        trace(marker, { event: 'remote-out-of-vocabulary', requestId, raw: String(raw) })
        throw new Error(`plugin-approval-remote-answerer: peer returned an out-of-vocabulary result: ${String(raw)}`)
      } catch (e) {
        const err = e as { message?: unknown; code?: unknown; name?: unknown }
        const detail = String(err?.message ?? e).slice(0, 300)
        if (stopReason === 'request-signal') {
          // 取消传播已生效：出站 pending 条目必须已移除（pendingAfter 应回到 pendingBefore）
          trace(marker, {
            event: 'remote-aborted',
            requestId,
            via: 'request-signal',
            pendingAfter: pendingSize(transport),
            outcomeByService: 'cancelled',
            error: detail,
          })
          // ⭐ J5 的**延迟采样**：撤回之后连续采样 pending 数。两条判据全靠它：
          //   ① 无泄漏 —— 采样值应恒等于"撤回后应有的值"；
          //   ② 迟到回答被丢弃 —— 若对端在采样窗口内补发了一条响应帧，而它被**留成 pending**，
          //      这些采样里就会出现 >0；全部为 0 ⇒ 该帧没有被保留任何状态。
          for (const afterAbortMs of [1000, 3000, 5000, 8000, 12000]) {
            setTimeout(() => {
              trace(marker, { event: 'remote-pending-sample', requestId, afterAbortMs, pendingSize: pendingSize(transport) })
            }, afterAbortMs)
          }
        } else if (stopReason === 'answerer-timeout') {
          trace(marker, {
            event: 'remote-timeout',
            requestId,
            via: 'answerer-side-timer',
            answerTimeoutMs,
            pendingAfter: pendingSize(transport),
            outcomeByService: 'unavailable',
            error: detail,
          })
        } else {
          // 对端消失/报错：留痕后原样抛 —— ⛔ 静默 fail-closed 是假绿源
          trace(marker, {
            event: 'remote-error',
            requestId,
            code: err?.code === undefined ? null : err.code,
            errName: err?.name ?? null,
            pendingAfter: pendingSize(transport),
            outcomeByService: 'unavailable',
            error: detail,
          })
        }
        throw e
      } finally {
        if (timer !== null) clearTimeout(timer)
        if (req.signal !== undefined) req.signal.removeEventListener('abort', onAbort)
      }
    },
  }
}

/**
 * 插件入口：`apply()` 在 boot 极早期执行 ⇒ **只做 `provide`**，出站能力全部推迟到 `decide`。
 * @param ctx - cordis 上下文
 * @param config - 来自 `cordis.patch.yml` 的配置块；**允许 undefined**
 */
export function apply(ctx: Ctx, config?: Config | undefined): void {
  const normalized: Config = { ...(config ?? {}) }
  const marker = markerPath(normalized)
  const answerer = createRemoteAnswerer(ctx, normalized, marker)
  if (typeof ctx.provide !== 'function') {
    trace(marker, { event: 'degraded', plugin: name, reason: 'ctx.provide missing: remote answerer not installed' })
    process.stderr.write(`[${name}] degraded: ctx.provide missing\n`)
    return
  }
  // ⚠️ **必须 provide 在根 ctx 上**（本块实测得出，不是推测）：
  //   cordis 的 `ctx.provide(name, v)` 记下的 `impl.fiber` 是**调用方自己的 fiber**，而
  //   3.3-a 的 `probe()` 走 `ctx.get(name)` ⇒ `reflect.get` 的 `strict` 默认 **true**
  //   ⇒ `impl.fiber.state !== 2`（未 ACTIVE）时**直接返回 undefined**。
  //   实测（`D:\Code\_trae-evidence\33b\_attempt1-jsonrpc-resolution`）：插件自己的 fiber 在
  //   `apply` 期间**还不是** ACTIVE —— 本插件自检 `selfVisibleAtApply=false`、150 ms 后同一自检
  //   `true`；中继（更晚 apply）读它却 `answererVisibleFromRelay=true`。⇒ 只有**根 fiber**恒为
  //   ACTIVE，挂在根上，先于本插件 apply 的 3.3-a 才读得到这个替换口。
  const provider = ctx.root ?? ctx
  provider.provide?.(ANSWERER_SERVICE, answerer)
  const selfNow = typeof ctx.get === 'function' ? ctx.get(ANSWERER_SERVICE) : undefined
  setTimeout(() => {
    trace(marker, {
      event: 'remote-self-check-later',
      selfVisibleLater: (typeof ctx.get === 'function' ? ctx.get(ANSWERER_SERVICE) : undefined) === answerer,
    })
  }, 0)
  const caps = {
    pid: process.pid,
    dshHome: process.env.DSH_HOME ?? null,
    configWasUndefined: config === undefined,
    answererService: ANSWERER_SERVICE,
    source: answerer.source,
    transportService: normalized.transportService ?? DEFAULT_TRANSPORT_SERVICE,
    method: normalized.method ?? DEFAULT_METHOD,
    answerTimeoutMs: typeof normalized.answerTimeoutMs === 'number' ? normalized.answerTimeoutMs : 0,
    selfVisibleAtApply: selfNow === answerer,
  }
  process.stderr.write(
    `[${name}] activate pid=${process.pid} provide=${ANSWERER_SERVICE} source=${answerer.source} answerTimeoutMs=${caps.answerTimeoutMs} config=${config === undefined ? 'undefined' : 'given'}\n`,
  )
  trace(marker, { event: 'activate', plugin: name, ...caps })
}
