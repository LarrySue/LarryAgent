/**
 * DSH-3.4 · 装置用探针（⛔ **非产品件**，只进临时 home）
 *
 * **为什么必须存在**：判据口径 ④ 写死「断言位置 = `session.deriveMessages()`」（＝模型实际输入视图），
 * 而 SDK ／ JSON-RPC 客户端**拿不到**该视图（客户端只收到 `session.event` 通知流；
 * 实测 `request/context` 事件只带 tools，不带 messages）⇒ 只能在 **dsh 进程内**取。
 *
 * 它只做三件事（⛔ 不注入、不阻断、不改任何状态）：
 *   1. 落每一条 `session.event` 的**类型**（全量，用于事件侧判据：三态可分 ／ 括号完整性）
 *   2. 落每一条 `compaction/*` 事件的**全部 data**（`rawOutput` ／ `usage` ／ `shadowedRange` …）
 *   3. 在 `compaction/summary` ／ `compaction/end` ／ `agent/status:idle` 三个时点**快照**
 *      `session.deriveMessages()`：逐条记 role ／ `source.kind` ／ `source.plugin` ／
 *      `source.compactionId` ／ 字符数 ／ **命中的 marker 集合**（`FILL-####` ／ `NONCE-…`）／
 *      头尾 80 字符；尾部若干条与 checkpoint 条**附全文**（供逐字比对与 §6 采数）
 *
 * **marker 机制**：填充文本里埋 `FILL-0001` 这类**独占标记**，摘要里埋 `NONCE-…` ⇒
 * 「近文原文保留」与「摘要含 nonce」都变成**标记集合的集合运算**，可复算且落盘体量小。
 *
 * ⚠️ 装法：`inject = ['sessions']`（**复数**）—— 单数 `session` 会解析不到（pending）；
 * 且插件须**实体复制**进 profile 自身层的 `node_modules`（3.7 实测：共享层会解析到旧代）。
 *
 * @module @larryagent/plugin-34-probe
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export const name = 'plugin-34-probe'

/** ⚠️ 复数 `sessions`：单数会 pending（3.7 ／ Claude 复验的既有教训）。 */
export const inject = ['sessions', 'tokenMeter']

export interface Config {
  /** 打点 JSONL 落点（绝对路径）。**未配 ⇒ 本插件静默不装**（便于产品链路里保留本件）。 */
  marker?: string
  /** 每条快照里「附全文」的尾部消息条数（缺省 6）。 */
  fullTextTail?: number
  /** 单条消息全文落盘上限（字符，缺省 24000）。 */
  maxTextChars?: number
  /**
   * ⚠️ 装置用：首个 `agent/status:idle` 时走**真实命令链路**调一次 `/compact`。
   * 存在理由：SDK 通道**不派发斜杠命令**（`session/prompt` 文本 verbatim 进 user message）
   * ⇒ 判据「真实会话发 `/compact`」在本通道**不可执行**，只能用 `ctx.commands` 的
   * **运行期注册表 ＋ execute** 作等价物（比 `--dump-config` 强：这是激活后的活服务）。
   */
  execCompact?: boolean
}

interface AnySession {
  id?: string
  deriveMessages?: () => unknown[]
  surface?: { nodes?: unknown[] }
  eventAt?: (seq: unknown) => unknown
}

/** 填充 ／ nonce 的独占标记（大小写敏感、词边界）。 */
const MARKER_RE = /\b(FILL-\d{4}|NONCE-[A-Za-z0-9]{6,})\b/g

export function apply(ctx: any, config: Config = {}): void {
  const marker = typeof config.marker === 'string' && config.marker.length > 0 ? config.marker : null
  // 未配 marker ⇒ 静默不装（⛔ 不抛错、不影响宿主）
  if (marker === null) return
  const fullTextTail = config.fullTextTail ?? 6
  const maxTextChars = config.maxTextChars ?? 24_000
  const execCompact = config.execCompact === true
  let idleCount = 0

  try { mkdirSync(dirname(marker), { recursive: true }) } catch { /* ignore */ }
  let n = 0
  const emit = (record: Record<string, unknown>): void => {
    try {
      appendFileSync(marker, `${JSON.stringify({ t: new Date().toISOString(), n: (n += 1), ...record })}\n`)
    } catch { /* 落盘失败不影响宿主 */ }
  }

  const textOf = (m: any): string => {
    const blocks: any[] = Array.isArray(m?.content) ? m.content : []
    return blocks
      .filter((b) => b?.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('\n')
  }

  const brief = (m: any, i: number, withText: boolean): Record<string, unknown> => {
    const text = textOf(m)
    const found = new Set<string>()
    for (const hit of text.matchAll(MARKER_RE)) found.add(hit[1] as string)
    const row: Record<string, unknown> = {
      i,
      role: m?.role ?? null,
      sourceKind: m?.source?.kind ?? null,
      sourcePlugin: m?.source?.plugin ?? null,
      sourceCompactionId: m?.source?.compactionId ?? null,
      chars: text.length,
      markers: [...found].sort(),
      head: text.slice(0, 80),
      tail: text.slice(-80),
    }
    if (withText) row.text = text.slice(0, maxTextChars)
    return row
  }

  const meterOf = (session: AnySession): Record<string, unknown> => {
    try {
      const meter: any = ctx.get('tokenMeter')
      if (meter == null || typeof meter.measure !== 'function') return { error: 'no tokenMeter', available: meter != null }
      const m: any = meter.measure(session)
      return {
        totalTokens: m?.totalTokens ?? null,
        nodeCount: Array.isArray(m?.nodes) ? m.nodes.length : null,
        nodeTokens: Array.isArray(m?.nodes) ? m.nodes.map((x: any) => x?.tokens ?? null) : null,
        keys: m != null ? Object.keys(m) : null,
      }
    } catch (e: any) {
      return { error: String(e?.message ?? e) }
    }
  }

  const snapshot = (session: AnySession | null | undefined, why: string): void => {
    try {
      if (session == null) { emit({ event: 'snapshot-skip', why, reason: 'no-session' }); return }
      const msgs = typeof session.deriveMessages === 'function' ? session.deriveMessages() : null
      if (msgs === null) { emit({ event: 'snapshot-skip', why, reason: 'no deriveMessages' }); return }
      const nodes: unknown[] = session.surface?.nodes ?? []
      const nodeEvents = nodes.map((seq) => {
        let ev: any = null
        try { ev = typeof session.eventAt === 'function' ? session.eventAt(seq) : null } catch { ev = null }
        return { seq, type: ev?.type ?? null, source: ev?.data?.message?.source ?? null }
      })
      const rows: any[] = msgs.map((m: any, i: number) => brief(m, i, i >= msgs.length - fullTextTail || m?.source?.plugin === 'compact'))
      emit({
        event: 'snapshot',
        why,
        sessionId: session.id ?? null,
        surfaceNodeCount: nodes.length,
        messageCount: msgs.length,
        meter: meterOf(session),
        allMarkers: [...new Set(rows.flatMap((r: any) => (r.markers as string[]) ?? []))].sort(),
        messages: rows,
        nodeEvents,
      })
    } catch (e: any) {
      emit({ event: 'snapshot-error', why, error: String(e?.message ?? e) })
    }
  }

  ctx.on('session/event', (session: AnySession, event: any): void => {
    try {
      const type = event?.type ?? null
      if (typeof type === 'string' && type.startsWith('compaction/')) {
        emit({ event: 'compaction-event', type, sessionId: session?.id ?? null, data: event?.data ?? null })
        if (type === 'compaction/summary' || type === 'compaction/end') snapshot(session, type)
      } else {
        emit({ event: 'event', type, seq: event?.seq ?? null })
      }
    } catch (e: any) {
      emit({ event: 'handler-error', where: 'session/event', error: String(e?.message ?? e) })
    }
  })

  ctx.on('agent/status', (payload: any): void => {
    try {
      if (payload?.status !== 'idle') return
      snapshot(payload?.agent?.session, 'idle')
      if (idleCount === 0) {
        idleCount = 1
        // 运行期命令注册表（等价物：证「该入口在不在」，⛔ 不靠 --dump-config）
        try {
          const svc: any = (typeof ctx.get === 'function' ? ctx.get('commands') : undefined) ?? ctx.commands
          const names = svc != null && typeof svc.list === 'function' ? svc.list(payload?.agent).map((d: any) => d?.name ?? null) : null
          emit({ event: 'commands', source: svc == null ? 'no-service' : 'live', names, hasCompact: Array.isArray(names) ? names.includes('compact') : null })
          if (execCompact === true && svc != null && typeof svc.execute === 'function') {
            const p = svc.execute(payload?.agent, '/compact', [], AbortSignal.timeout(180_000))
            void Promise.resolve(p).then(
              (res: any) => emit({ event: 'exec-compact', ok: true, result: JSON.parse(JSON.stringify(res ?? null)) }),
              (e: any) => emit({ event: 'exec-compact', ok: false, error: e?.name !== undefined ? `${e.name}: ${e.message}` : String(e) }),
            )
          } else if (execCompact === true) {
            emit({ event: 'exec-compact', ok: false, error: 'commands.execute 不可用' })
          }
        } catch (e: any) {
          emit({ event: 'commands-error', error: String(e?.message ?? e) })
        }
      }
    } catch (e: any) {
      emit({ event: 'handler-error', where: 'agent/status', error: String(e?.message ?? e) })
    }
  })
}
