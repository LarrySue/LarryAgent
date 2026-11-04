/**
 * ③.2b 人审闸验收 · 触发装置（⛔ 产品部署不要装）
 *
 * 形状：**不注册模型工具**。在根会话首个 `user/message` 事件回调里（= 真 open turn 内）
 * 把一条假摘要送进插件的 `memoryWriteGate`：stage（staging 表）→ 调审批表决 →
 * 仅 allowed-once 时重读 staging 落库。假摘要内容取 env `P32B_CONTENT`。
 * 这既符合「写入前的内部闸」定位，也避开"工具注册晚于 agent 工具快照"的时序坑（实测过）。
 *
 * W-6 臂：`P32B_NO_TURN=1` 时，在 `turn/end` 之后（无 open turn）再走一次闸，记录 outcome。
 *
 * 零外部 import；服务走 `ctx.inject(['memoryWriteGate'], cb)`（⛔ 不用 get 结果当前置注册）。
 */
import { appendFileSync } from 'node:fs'

const OUT = process.env.P32B_PROBE_OUT
const CONTENT = process.env.P32B_CONTENT ?? 'A句'
const ABORT_AFTER_MS = Number(process.env.P32B_ABORT_AFTER_MS ?? 0)
const NO_TURN = process.env.P32B_NO_TURN === '1'
const emit = (frame) => {
  if (OUT) appendFileSync(OUT, `${JSON.stringify({ t: new Date().toISOString(), ...frame })}\n`)
}

let inTurnDone = false
let noTurnDone = false

export default {
  name: '@larryagent/plugin-32b-trigger',
  apply(ctx) {
    emit({ judge: 'heartbeat', pid: process.pid })

    ctx.inject(['memoryWriteGate'], (sub) => {
      const gate = sub.memoryWriteGate
      emit({ judge: 'gate-visible', hasGate: gate !== undefined })
      if (gate === undefined) return

      ctx.on('session/event', (session, event) => {
        if (!NO_TURN && !inTurnDone && event?.type === 'user/message') {
          inTurnDone = true
          const agents = ctx.get('agents')
          let agent = null
          try { agent = agents?.currentInitiator?.() ?? null } catch { agent = null }
          const sessionId = String(session?.id ?? session?.header?.id ?? 'probe-32b')
          // ⚠️ 不能在 event 回调的同步栈里直接调审批：session 日志正在发布 append，
          //    重入会被拒（实测 `session append cannot reenter while another append is being published`）。
          //    setTimeout(0) 跳出发布栈，turn 仍 open。
          setTimeout(() => { void runGate(gate, sessionId, CONTENT, agent, 'in-turn') }, 0)
        }
        if (NO_TURN && !noTurnDone && event?.type === 'turn/end') {
          noTurnDone = true
          const agents = ctx.get('agents')
          let captured = null
          try { captured = agents?.currentInitiator?.() ?? null } catch { captured = null }
          setTimeout(() => {
            runGate(gate, String(session?.id ?? session?.header?.id ?? 'probe-32b'), 'W6-no-turn-摘要', captured, 'no-turn')
          }, 1500)
        }
      })
    })

    async function runGate(gate, sessionId, content, agent, phase) {
      const stageId = gate.stage({ sessionId, sourceEventSeq: phase === 'no-turn' ? 99 : 1, content })
      emit({ judge: 'staged', stageId, content, phase, agentId: String(agent?.id ?? agent?.session?.id ?? '') })
      const controller = new AbortController()
      const timer = ABORT_AFTER_MS > 0 ? setTimeout(() => controller.abort(), ABORT_AFTER_MS) : null
      try {
        const decision = await gate.approveAndWrite(stageId, {
          agent,
          callId: `probe-32b-${phase}`,
          signal: controller.signal,
        })
        emit({ judge: phase === 'no-turn' ? 'W6-no-turn' : 'decision', stageId, ...decision })
      } catch (error) {
        emit({ judge: phase === 'no-turn' ? 'W6-no-turn' : 'decision', outcome: `(threw:${String(error?.message ?? error).slice(0, 200)})`, writtenId: null })
      } finally {
        if (timer !== null) clearTimeout(timer)
      }
    }
  },
}
