/**
 * plugin-approval-probe —— DSH-3.3-a **装置用探针**（产品部署不要装）。
 *
 * 作用：给"审批接人"这件事提供一个**可复现的消费者**。它注册一只 `approval_probe` 工具：
 *   ① 进 handler ⇒ 记 `probe-request`（**工具侧入口打点**，用来区分"工具真执行了"与"压根没进"）；
 *   ② 调 `ctx.approval.request({ agent, toolName, callId, reason, signal })`；
 *   ③ **仅当**结果为 `allowed-once` 才走被保护动作并记 `probe-executed`；其余分支记 `probe-skipped`。
 *
 * `reason` = `case=<名>` —— 供本地策略答者（`plugin-approval-answerer` 的 `policy: from-request`）
 * 在**同一次运行**里跑满五条用例（approve / reject / timeout / throw / malformed）。
 * `timeoutMs`（缺省 30000）到点由本工具 `AbortController.abort()` 撤回 ⇒ 服务侧按 `signal` 中止结算。
 *
 * **零硬依赖 + 零外部 import**（照 3.1 纪律）：注册一律走 `ctx.inject(['approval','tools'], cb)`，
 * 绝不用 `ctx.get` 的探测结果当前置（3.1 实测：那会静默永不注册）。
 *   @module plugin-approval-probe
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** 诊断用显示名。 */
export const name = 'plugin-approval-probe'

/** 零硬依赖。 */
export const inject: string[] = []

/** 本工具对模型暴露的名字。 */
export const TOOL_NAME = 'approval_probe'

/** 插件配置（全部可选）。 */
export interface Config {
  /** 单次审批请求的撤回时限（缺省 30 s；即 `TODO.md` 3.3 段定死的建议值）。 */
  timeoutMs?: number
  /** 打点文件路径；`false` = 关闭；缺省 = `<DSH_HOME>/plugin-approval-probe.log`。 */
  activateMarker?: string | false
}

const DEFAULT_TIMEOUT_MS = 30_000

/** 结构化最小 ctx —— 不 import 外部类型。 */
interface Ctx {
  get?(name: string): unknown
  inject?(names: string[], callback: (ctx: Record<string, unknown>) => void): unknown
}
interface ToolRegistry {
  register(definition: unknown): unknown
}
interface ApprovalSeam {
  request(req: Record<string, unknown>): Promise<string>
}
/** `execute(args, exec)` 的第二个参数（实测形态取自 `dsh-tool-pwsh`：`exec.agent` / `exec.callId` / `exec.signal`）。 */
interface ExecLike {
  agent?: { id?: string }
  callId?: string
  signal?: AbortSignal
}

function probe<T>(ctx: Ctx, service: string): T | undefined {
  try {
    return typeof ctx.get === 'function' ? (ctx.get(service) as T | undefined) : undefined
  } catch {
    return undefined
  }
}

function trace(marker: string | null, record: Record<string, unknown>): void {
  if (marker === null) return
  try {
    mkdirSync(dirname(marker), { recursive: true })
    appendFileSync(marker, `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`)
  } catch {
    /* 诊断失败不得影响执行 */
  }
}

function markerPath(config: Config): string | null {
  if (config.activateMarker === false) return null
  if (typeof config.activateMarker === 'string' && config.activateMarker !== '') return config.activateMarker
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'plugin-approval-probe.log')
}

/**
 * 手搓 tool definition（不用 `defineTool`）。
 * ⚠️ `output.schema` 必须是**标准 JSON Schema**：`required` 写**顶层数组**，属性内**不得**带 `required: true`
 *（`dsh-tools` 的 `assertSupportedJsonSchema` 会直接抛；3.1 实测）。
 */
function buildTool(approval: ApprovalSeam, config: Config, marker: string | null): Record<string, unknown> {
  const timeoutMs = typeof config.timeoutMs === 'number' && config.timeoutMs > 0 ? Math.floor(config.timeoutMs) : DEFAULT_TIMEOUT_MS
  return {
    name: TOOL_NAME,
    description:
      'Request one approval decision through the harness approval seam and report what happened. ' +
      'Use `case` to select the answerer behaviour under test (approve / reject / timeout / throw / malformed / delegate). ' +
      'The protected side effect runs only when the outcome is allowed-once.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        case: { type: 'string', description: 'Which answerer behaviour to exercise (approve / reject / timeout / throw / malformed / delegate).' },
      },
      required: ['case'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          executed: { type: 'boolean' },
          outcome: { type: 'string' },
        },
        required: ['executed', 'outcome'],
      },
      render: (_args: unknown, value: { executed: boolean; outcome: string }) => [
        { type: 'text', text: `<executed>${value.executed}</executed>\n<outcome>${value.outcome}</outcome>` },
      ],
    },
    isConcurrencySafe: () => true,
    async execute(args: { case?: unknown }, exec?: ExecLike): Promise<Record<string, unknown>> {
      const caseName = String(args?.case ?? '')
      const agent = exec?.agent
      // 工具侧入口打点（含 exec 观测形状，便于核对"agent 从哪来"）
      trace(marker, {
        event: 'probe-request',
        tool: TOOL_NAME,
        case: caseName,
        agentId: agent?.id ?? null,
        callId: exec?.callId ?? null,
        hasSignal: exec?.signal !== undefined,
        execKeys: exec === undefined ? null : Object.keys(exec as object).sort(),
      })
      if (agent === undefined) {
        trace(marker, { event: 'probe-no-agent', tool: TOOL_NAME, note: 'execute 的 exec.agent 缺失：无法定位会话/agent' })
        return { executed: false, outcome: 'no-agent' }
      }
      const controller = new AbortController()
      const timer = setTimeout(() => {
        trace(marker, { event: 'probe-abort', tool: TOOL_NAME, case: caseName, timeoutMs })
        controller.abort()
      }, timeoutMs)
      let outcome = '(threw)'
      try {
        outcome = await approval.request({
          agent,
          toolName: TOOL_NAME,
          ...(exec?.callId !== undefined ? { callId: exec.callId } : {}),
          reason: `case=${caseName}`,
          signal: controller.signal,
        })
      } catch (e) {
        outcome = `(request-threw:${String((e as Error)?.message ?? e).slice(0, 120)})`
      } finally {
        clearTimeout(timer)
      }
      // ⭐ handler 入口打点 = **被保护动作**是否执行（J3 第①列就取这一行）
      const executed = outcome === 'allowed-once'
      trace(marker, executed
        ? { event: 'probe-executed', tool: TOOL_NAME, case: caseName, outcome }
        : { event: 'probe-skipped', tool: TOOL_NAME, case: caseName, outcome })
      return { executed, outcome }
    },
  }
}

/**
 * 插件入口：`config` 可能是 undefined（必须容忍）。
 * @param ctx - cordis 上下文
 * @param config - 来自 `cordis.patch.yml` 的配置块；**允许 undefined**
 */
export function apply(ctx: Ctx, config?: Config | undefined): void {
  const normalized: Config = { ...(config ?? {}) }
  const marker = markerPath(normalized)
  const approvalSeam = probe<ApprovalSeam>(ctx, 'approval')
  const toolsSeam = probe<ToolRegistry>(ctx, 'tools')

  process.stderr.write(
    `[plugin-approval-probe] activate pid=${process.pid} approval=${typeof approvalSeam?.request === 'function'} tools=${typeof toolsSeam?.register === 'function'} config=${config === undefined ? 'undefined' : 'given'}\n`,
  )
  trace(marker, {
    event: 'activate',
    plugin: name,
    pid: process.pid,
    dshHome: process.env.DSH_HOME ?? null,
    configWasUndefined: config === undefined,
    caps: { approvalSeam: typeof approvalSeam?.request === 'function', toolsSeam: typeof toolsSeam?.register === 'function' },
  })

  const register = (tctx: Record<string, unknown>, actx: Record<string, unknown>): void => {
    const tools = (tctx?.tools ?? toolsSeam) as ToolRegistry | undefined
    const approval = (actx?.approval ?? approvalSeam) as ApprovalSeam | undefined
    if (typeof tools?.register !== 'function' || typeof approval?.request !== 'function') {
      trace(marker, {
        event: 'degraded',
        plugin: name,
        reason: 'approval or tools service missing at inject time: tool not registered',
        hasTools: typeof tools?.register === 'function',
        hasApproval: typeof approval?.request === 'function',
      })
      return
    }
    try {
      tools.register(buildTool(approval, normalized, marker))
      trace(marker, { event: 'tool-registered', plugin: name, tool: TOOL_NAME })
    } catch (e) {
      const detail = String((e as Error)?.message ?? e).slice(0, 600)
      trace(marker, { event: 'register-failed', plugin: name, tool: TOOL_NAME, error: detail })
      process.stderr.write(`[plugin-approval-probe] register failed: ${detail}\n`)
    }
  }

  if (typeof ctx.inject === 'function') {
    trace(marker, { event: 'inject-requested', plugin: name, deps: ['approval', 'tools'] })
    ctx.inject(['approval', 'tools'], (ictx: Record<string, unknown>) => {
      trace(marker, {
        event: 'inject-fired',
        plugin: name,
        hasApproval: typeof (ictx?.approval as ApprovalSeam | undefined)?.request === 'function',
        hasTools: typeof (ictx?.tools as ToolRegistry | undefined)?.register === 'function',
      })
      register(ictx ?? {}, ictx ?? {})
    })
  } else {
    trace(marker, { event: 'degraded', plugin: name, reason: 'ctx.inject missing: fallback to probe' })
    register({ tools: toolsSeam }, { approval: approvalSeam })
  }
}
