/**
 * plugin-approval-answerer —— S1 审批接入**第一段**：一个**限定到 agent 的本地策略答者**
 * （DSH-3.3-a）。
 *
 * **姿态自证**
 *   - 接的是官方 seam `ctx.approval`（`@deepseek-ai/dsh-user-approval`）：答者 = `approval/request`
 *     waterfall 监听器，**返回一个结果即为所负责的 agent 作答**，否则 `next()` 委托。
 *   - **scope filter 靠注册位置实现**（`@deepseek-ai/dsh-scope`）：服务侧以
 *     `ctx.waterfall(scopeTarget(req.agent, req.agent), 'approval/request', …)` 分发（源码
 *     `dsh-user-approval/lib/index.js:179`），放行规则 = 「无标签监听器放行；有标签监听器仅当
 *     标签为分发键**或其祖先**时放行」。⇒ **把监听器注册在 `agent.ctx`（带该 agent 作用域标签）上，
 *     它就只收到该 agent 的请求**；注册在根 ctx（无标签）则是全局答者。
 *   - **零硬依赖 + 注册走 `ctx.inject([...], cb)`**（照 3.1 纪律）：`inject: []` 让 `apply()` 在
 *     boot 极早期执行，此刻 `ctx.get('approval')` 往往为 `undefined` ⇒ **绝不用探测结果决定是否注册**
 *     （3.1 实测：那会**静默永不注册**）。
 *   - **零外部 import**（只用 `node:`）：本包可能以 link/复制方式挂载，模块从仓库目录解析，
 *     取不到 profile 里的 `@deepseek-ai/*`；不 import 就没有这个坑（类型用结构化接口表达）。
 *
 * ⚠️ **本块（3.3-a）只证"机制接入"**：答者能挂上、能被路由到、能决定结果、失败时不放行。
 *    「超时」「渠道断裂」在本块是**同进程替身路径**（本地答者与宿主同进程，无渠道可断）
 *    ⇒ ⛔ 本块**单独不得声称"审批语义验成立"**，那两条的真验在 3.3-b。
 *
 * 降级矩阵（能力 / 依赖服务 / 缺失时行为 / 卸载行为）：
 *   | 能力 | 依赖服务 | 缺失时行为 | 卸载行为 |
 *   |---|---|---|---|
 *   | 答者注册 | `approval` | 记 `degraded` 打点后**静默返回**，插件仍处已激活态 | 随 `agent.ctx` / 本 `ctx` 的 disposer 自动注销 |
 *   | 判定 | 无（本地策略，或外部注入的 `approvalAnswerer`） | — | — |
 *   | 打点 | 无（直接写文件） | 写失败**只吞掉** | — |
 *   @module plugin-approval-answerer
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** 诊断用显示名。 */
export const name = 'plugin-approval-answerer'

/** 零硬依赖：任何 profile 组合下都可加载（缺失即降级）。 */
export const inject: string[] = []

/** 官方 seam 的结果词汇（`dsh-user-approval/lib/index.js:30-35`）。 */
export const OUTCOMES = ['allowed-once', 'rejected', 'cancelled', 'unavailable'] as const
export type ApprovalOutcome = (typeof OUTCOMES)[number]

/** 答者接口 —— **3.3-b 的替换点**。 */
export interface Answerer {
  /** 人类可读来源标签（写进打点，便于"结果出自谁"可核）。 */
  readonly source: string
  /**
   * 对一次请求作答。
   * @param req - 官方请求事件（`agent` / `toolName` / 可选 `callId` / 可选 `reason`）
   * @returns 一个结果词汇；返回 `'delegate'` 表示**不认领**、交给 `next()`（其余答者／最终应答者）
   */
  decide(req: ApprovalRequestEvent): ApprovalOutcome | 'delegate' | Promise<ApprovalOutcome | 'delegate'>
}

/** 官方请求事件的结构化投影（不 import 外部类型，避免 link 挂载下解析失败）。 */
export interface ApprovalRequestEvent {
  readonly agent?: { readonly id?: string }
  readonly toolName?: string
  readonly callId?: string
  readonly reason?: string
  readonly signal?: AbortSignal
}

/** 插件配置（全部可选 —— `apply` 必须容忍 `config === undefined`）。 */
export interface Config {
  /**
   * 目标 agent 的选择方式：
   * `'first'`（默认）= **首个被创建的 agent**；`'all'` = 不限定（**全局答者**，负向对照用）。
   */
  scope?: 'first' | 'all'
  /** 指定 agent id（给了就优先于 `scope`）。 */
  scopeAgentId?: string
  /**
   * 静态策略。`'from-request'` = 由请求 `reason` 里的 `case=<名>` 决定（装置用，一次跑满五条用例）。
   * `'delegate'` = 一律委托（**不认领**，等于"答者存在但不应答"）。
   */
  policy?: 'approve' | 'reject' | 'timeout' | 'throw' | 'malformed' | 'delegate' | 'from-request'
  /** 打点文件路径；`false` = 关闭打点；缺省 = `<DSH_HOME>/plugin-approval-answerer.log`。 */
  activateMarker?: string | false
}

/** 结构化最小 ctx —— 不 import 外部类型。 */
interface Ctx {
  get?(name: string): unknown
  on?(event: string, listener: (...args: never[]) => unknown): unknown
  inject?(names: string[], callback: (ctx: Record<string, unknown>) => void): unknown
  logger?: { info?(m: string): void; warn?(m: string): void }
}
/** agent 对象的结构化投影：关键是 `ctx`（带该 agent 作用域标签的注册面）。 */
interface AgentLike {
  id?: string
  ctx?: Ctx
}

const DEFAULT_POLICY: NonNullable<Config['policy']> = 'approve'

/** 探测式取服务：缺失返回 undefined，**绝不抛**。 */
function probe<T>(ctx: Ctx, service: string): T | undefined {
  try {
    return typeof ctx.get === 'function' ? (ctx.get(service) as T | undefined) : undefined
  } catch {
    return undefined
  }
}

/** 打点落盘（失败只吞 —— 打点是诊断，不是业务）。 */
function trace(marker: string | null, record: Record<string, unknown>): void {
  if (marker === null) return
  try {
    mkdirSync(dirname(marker), { recursive: true })
    appendFileSync(marker, `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`)
  } catch {
    /* 诊断失败不得影响 boot 与请求处理 */
  }
}

/** 打点文件路径：`false` 关闭；字符串用之；缺省落 `<DSH_HOME>`。 */
function markerPath(config: Config): string | null {
  if (config.activateMarker === false) return null
  if (typeof config.activateMarker === 'string' && config.activateMarker !== '') return config.activateMarker
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'plugin-approval-answerer.log')
}

/** 从请求 `reason` 里取 `case=<名>`（装置用它把五条用例放进同一次运行）。 */
export function caseOfRequest(req: ApprovalRequestEvent): string {
  const reason = typeof req.reason === 'string' ? req.reason : ''
  const hit = /(?:^|[^\w])case=([\w-]+)/.exec(reason)
  return hit?.[1] ?? ''
}

/**
 * **本地策略答者**（默认实现；3.3-b 的远端真人是同接口的另一实现）。
 *
 * 策略 → 行为（逐条实现在 `decide`）：
 *   `approve` → `'allowed-once'`（**唯一授权**）｜`reject` → `'rejected'`
 *   `timeout` → 返回**永不兑现**的 promise（把撤回交给**请求方**的 `AbortSignal`；服务侧
 *      `signal` 中止 ⇒ `'cancelled'`，实测见报告）｜`throw` → 抛错（服务归一化为 `'unavailable'`）
 *   `malformed` → 返回**不合词汇**的值（服务归一化为 `'unavailable'`；"渠道断裂"的同进程替身）
 *   `delegate` → `'delegate'`（不认领 ⇒ `next()`）
 *   `from-request` → 由 `reason` 的 `case=` 选上述之一，缺省 `approve`
 * @param config - 已归一化配置
 * @param marker - 打点文件路径（null = 关闭）
 * @returns 答者实现
 */
export function createLocalPolicyAnswerer(config: Config, marker: string | null = null): Answerer {
  const mode = config.policy ?? DEFAULT_POLICY
  return {
    source: `local-policy:${mode}`,
    decide(req: ApprovalRequestEvent): ApprovalOutcome | 'delegate' | Promise<ApprovalOutcome | 'delegate'> {
      const selected = mode === 'from-request' ? (caseOfRequest(req) || DEFAULT_POLICY) : mode
      trace(marker, { event: 'answerer-deciding', source: `local-policy:${mode}`, selected, toolName: req.toolName ?? null })
      switch (selected) {
        case 'approve':
          return 'allowed-once'
        case 'reject':
          return 'rejected'
        case 'delegate':
          return 'delegate'
        case 'throw':
          throw new Error('plugin-approval-answerer: 答者故障（策略 throw；本块的 fail-closed 替身路径）')
        case 'malformed':
          // 故意越词汇：服务把它归一化为 'unavailable'（"渠道断裂"的同进程替身）
          return 'maybe' as unknown as ApprovalOutcome
        case 'timeout':
          return new Promise<ApprovalOutcome>(() => {
            trace(marker, { event: 'answerer-pending', source: `local-policy:${mode}`, note: '永不兑现；撤回交给请求方 signal' })
          })
        default:
          // 未知策略名：不认领（不静默放行、也不静默拒绝）
          trace(marker, { event: 'answerer-unknown-policy', selected })
          return 'delegate'
      }
    },
  }
}

/**
 * 插件入口：cordis 在依赖就绪后调用；`config` 可能是 undefined（必须容忍）。
 * @param ctx - cordis 上下文
 * @param config - 来自 `cordis.patch.yml` 的配置块；**允许 undefined**
 */
export function apply(ctx: Ctx, config?: Config | undefined): void {
  const normalized: Config = { ...(config ?? {}) } // ⭐ 容忍 undefined
  const marker = markerPath(normalized)
  const scope = normalized.scope ?? 'first'
  const approvalSeam = probe<{ request?: unknown }>(ctx, 'approval')
  // ⭐ J5 的替换点：别的插件只要 `ctx.provide('approvalAnswerer', impl)`，答者本体不动
  const injected = probe<Answerer>(ctx, 'approvalAnswerer')
  const source = injected ?? createLocalPolicyAnswerer(normalized, marker)

  process.stderr.write(
    `[plugin-approval-answerer] activate pid=${process.pid} scope=${scope} source=${source.source} injected=${injected !== undefined} config=${config === undefined ? 'undefined' : 'given'}\n`,
  )
  trace(marker, {
    event: 'activate',
    plugin: name,
    pid: process.pid,
    dshHome: process.env.DSH_HOME ?? null,
    configWasUndefined: config === undefined,
    scope,
    scopeAgentId: normalized.scopeAgentId ?? null,
    source: source.source,
    injectedAnswerer: injected !== undefined,
    caps: { approvalSeam: typeof approvalSeam?.request === 'function' },
  })

  /** 真正的应答体：先留"收到"打点（J2/J3 靠它判"答者有没有收到"），再决定。 */
  const answerer = async (req: ApprovalRequestEvent, next: () => Promise<ApprovalOutcome>): Promise<ApprovalOutcome> => {
    trace(marker, {
      event: 'answerer-request',
      source: source.source,
      toolName: req?.toolName ?? null,
      callId: req?.callId ?? null,
      reason: req?.reason ?? null,
      agentId: req?.agent?.id ?? null,
      hasSignal: req?.signal !== undefined,
    })
    let outcome: ApprovalOutcome | 'delegate'
    try {
      outcome = await source.decide(req ?? {})
    } catch (e) {
      // 答者抛错必须留痕（否则"静默 fail-closed"会制造假绿：看不出请求到没到）
      trace(marker, { event: 'answerer-threw', source: source.source, error: String((e as Error)?.message ?? e).slice(0, 300) })
      throw e // 交给服务归一化（⇒ 'unavailable'）
    }
    if (outcome === 'delegate') {
      trace(marker, { event: 'answerer-delegated', source: source.source })
      return next()
    }
    trace(marker, { event: 'answerer-decision', source: source.source, outcome })
    return outcome as ApprovalOutcome
  }

  const registerGlobal = (): void => {
    // 无标签（根 ctx）注册 ⇒ 全局放行：**收到所有 agent 的请求**（负向对照用）
    if (typeof ctx.on !== 'function') {
      trace(marker, { event: 'degraded', plugin: name, reason: 'ctx.on missing: answerer not registered' })
      return
    }
    ctx.on('approval/request', answerer as never)
    trace(marker, { event: 'answerer-registered', plugin: name, scope: 'global', via: 'root-ctx' })
  }

  const registerScoped = (agent: AgentLike): void => {
    const agentCtx = agent?.ctx
    if (agentCtx === undefined || typeof agentCtx.on !== 'function') {
      trace(marker, {
        event: 'degraded',
        plugin: name,
        reason: 'agent.ctx missing: scoped answerer not registered',
        agentId: agent?.id ?? null,
      })
      return
    }
    agentCtx.on('approval/request', answerer as never)
    trace(marker, {
      event: 'answerer-registered',
      plugin: name,
      scope: 'agent',
      via: 'agent.ctx',
      agentId: agent?.id ?? null,
      scopeFilter: '只收该 agent 的请求（dsh-scope 按注册标签放行）',
    })
  }

  if (typeof ctx.inject === 'function') {
    trace(marker, { event: 'inject-requested', plugin: name, deps: ['approval'] })
    ctx.inject(['approval'], (actx: Record<string, unknown>) => {
      trace(marker, {
        event: 'inject-fired',
        plugin: name,
        hasApproval: typeof (actx?.approval as { request?: unknown } | undefined)?.request === 'function',
      })
      if (scope === 'all') {
        registerGlobal()
        return
      }
      // 限定到某个 agent：等它被创建，然后在**它自己的 ctx** 上注册（作用域标签 = 该 agent）
      if (typeof ctx.on !== 'function') {
        trace(marker, { event: 'degraded', plugin: name, reason: 'ctx.on missing: cannot watch agent/created' })
        return
      }
      let picked = false
      ctx.on('agent/created', ((payload: { agent?: AgentLike }) => {
        const agent = payload?.agent
        trace(marker, { event: 'agent-created-seen', agentId: agent?.id ?? null, alreadyPicked: picked })
        if (picked) return
        if (typeof normalized.scopeAgentId === 'string' && normalized.scopeAgentId !== '' && agent?.id !== normalized.scopeAgentId) {
          trace(marker, { event: 'agent-skipped', agentId: agent?.id ?? null, want: normalized.scopeAgentId })
          return
        }
        picked = true
        registerScoped(agent ?? {})
      }) as never)
      trace(marker, { event: 'agent-watch-armed', plugin: name, mode: normalized.scopeAgentId ?? 'first-created' })
    })
  } else {
    // 极简/假 ctx（如单测）没有 inject ⇒ 直接按探测结果注册（仅全局形态可表达）
    trace(marker, { event: 'degraded', plugin: name, reason: 'ctx.inject missing: fallback to probe' })
    if (scope === 'all') registerGlobal()
  }
}
