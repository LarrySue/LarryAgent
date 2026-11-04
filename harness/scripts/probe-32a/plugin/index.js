/**
 * ③.2a 运行时可执行性探针 —— 探针插件（被测件：插件态能否拿到父 Agent 并起 subagent）
 *
 * 判据（WB 派发 P-1～P-6）：
 *   P-1  ctx.inject(['agents','subagents']) 能满足 ⇒ 报 provider 列表
 *   P-2  `session/event` 回调里 `ctx.get('agents').currentInitiator()` 的实际读数（⭐ 核心，两分支都报）
 *   P-3  有 initiator 时 `ctx.subagents.start('spawn', {prompt,parent,signal})` 能起、能跑完
 *   P-4  run.result 里能取回纯文本
 *   P-5  无 initiator 的负证：注入回调内 / setTimeout 里调同样 API ⇒ undefined 或抛错
 *
 * 输出：每帧一行 JSONL（env `P32A_PROBE_OUT`）；⛔ 不写产品代码、不碰部署件。
 */
import { appendFileSync } from 'node:fs'

const OUT = process.env.P32A_PROBE_OUT
const iso = () => new Date().toISOString()
const emit = (frame) => {
  if (OUT) appendFileSync(OUT, `${JSON.stringify(frame)}\n`)
}

const describeAgent = (agent) => {
  if (agent === undefined || agent === null) return { kind: 'undefined' }
  const id = agent.id ?? agent.session?.id ?? agent.session?.header?.id ?? ''
  return {
    kind: 'agent',
    id: String(id),
    ctor: agent.constructor?.name ?? null,
    sessionId: String(agent.session?.id ?? agent.session?.header?.id ?? ''),
    hasSession: agent.session !== undefined,
  }
}

const describeThrown = (error) => ({
  name: error?.name ?? null,
  message: error?.message ?? String(error),
})

const blockText = (blocks) => {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('')
}

let started = false
const NO_DELEGATE = process.env.P32A_NO_DELEGATE === '1'

export default {
  name: '@larryagent/plugin-32a-probe',
  apply(ctx) {
    emit({ judge: 'heartbeat', t: iso(), pid: process.pid })

    // P-1 · 动态注入两个服务（deps 满足即回调；取 provider 列表）
    ctx.inject(['agents', 'subagents'], (sub) => {
      let providers = null
      let providersError = null
      try {
        providers = sub.subagents.list()
      } catch (error) {
        providersError = describeThrown(error)
      }
      emit({
        judge: 'P-1',
        t: iso(),
        agentsVisible: sub.agents !== undefined,
        subagentsVisible: sub.subagents !== undefined,
        providers,
        providersError,
      })

      // P-5 负证（注入上下文内立即取；此处可能已在某个 initiator 边界外）
      let injectInitiator = null
      try {
        injectInitiator = describeAgent(sub.agents.currentInitiator())
      } catch (error) {
        injectInitiator = { kind: 'threw', ...describeThrown(error) }
      }
      emit({ judge: 'P-5-inject-ctx', t: iso(), initiator: injectInitiator })

      // P-5 负证（setTimeout：脱离任何异步边界，预期 undefined 或抛错）
      setTimeout(() => {
        let timed = null
        let required = null
        try {
          timed = describeAgent(sub.agents.currentInitiator())
        } catch (error) {
          timed = { kind: 'threw', ...describeThrown(error) }
        }
        try {
          const a = sub.agents.requireInitiator()
          required = { kind: 'returned', agent: describeAgent(a) }
        } catch (error) {
          required = { kind: 'threw', ...describeThrown(error) }
        }
        emit({ judge: 'P-5-timer', t: iso(), currentInitiator: timed, requireInitiator: required })
      }, 0)
    })

    // P-2 · session/event 火线上取 initiator（逐事件取读数）
    // ⚠️ 实测：在 `turn/start` 里立刻起子 agent，会把根请求的 extension 准备打断
    //    （turn/end reason=error / REQUEST_EXTENSION）。⇒ 只在此处"捕获" parent Agent，
    //    等根轮次 `turn/end` 后再延迟委派，避免与根请求的 LLM 扩展准备并发。
    let eventFrames = 0
    let parentAgent = null
    let lastProviders = null
    ctx.on('session/event', (session, event) => {
      const agents = ctx.get('agents')
      const subagents = ctx.get('subagents')
      const eventType = event?.type ?? null
      const sessionId = String(session?.id ?? session?.header?.id ?? '')
      let initiator = null
      try {
        initiator = agents === undefined ? { kind: 'service-undefined' } : describeAgent(agents.currentInitiator())
      } catch (error) {
        initiator = { kind: 'threw', ...describeThrown(error) }
      }
      let providers = null
      try { providers = subagents === undefined ? null : subagents.list() } catch { /* 列 provider 失败另记 null */ }
      if (subagents !== undefined && Array.isArray(providers) && providers.length > 0) lastProviders = providers
      if (eventFrames < 40 && !started) {
        eventFrames += 1
        emit({ judge: 'P-2', t: iso(), seq: eventFrames, eventType, sessionId, agentsVisible: agents !== undefined, providers, initiator })
      }
      if (!started && initiator?.kind === 'agent' && agents !== undefined) {
        parentAgent = agents.currentInitiator()
      }
      if (!started && parentAgent !== null && eventType === 'turn/end' && !NO_DELEGATE && subagents !== undefined) {
        started = true
        setTimeout(() => runDelegation(subagents, parentAgent), 200)
      }
    })

    // 子 agent 结算事件的原文（stopReason / lastAssistantMessage）
    ctx.on('subagent/end', (info) => {
      emit({ judge: 'P-4-subagent-end', t: iso(), info })
    })
    ctx.on('agent/status', (payload) => {
      emit({ judge: 'agent-status', t: iso(), status: payload?.status ?? payload ?? null })
    })
  },
}

async function runDelegation(subagents, parent) {
  const provider = subagents.list().includes('spawn') ? 'spawn' : subagents.list()[0]
  const controller = new AbortController()
  const prompt = [{ type: 'text', text: '只回复一个词：OK' }]
  let run = null
  try {
    run = await subagents.start(provider, { prompt, parent, signal: controller.signal, label: 'p32a-probe-child' })
    emit({ judge: 'P-3', t: iso(), ok: true, provider, childId: String(run?.id ?? ''), localAgent: run?.localAgent !== undefined })
  } catch (error) {
    emit({ judge: 'P-3', t: iso(), ok: false, provider, error: describeThrown(error) })
    return
  }
  try {
    const result = await run.result
    const text = blockText(result?.output)
    emit({
      judge: 'P-4',
      t: iso(),
      stopReason: result?.stopReason ?? null,
      diagnostic: result?.diagnostic ?? null,
      structured: result?.structured ?? null,
      blockCount: Array.isArray(result?.output) ? result.output.length : null,
      text,
    })
  } catch (error) {
    emit({ judge: 'P-4', t: iso(), ok: false, error: describeThrown(error) })
  } finally {
    try { await run.dispose() } catch { /* 子 agent 拆除失败不判红 */ }
    emit({ judge: 'done', t: iso() })
  }
}
