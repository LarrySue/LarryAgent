/**
 * DSH-2.5 task 2 (cont.): ACP persistent-resume and disconnect behavior.
 *
 * Phase A: process #1 -> initialize, session/new, prompt, session/close, exit.
 * Phase B: process #2 (fresh) -> initialize, session/resume on that id, prompt, close.
 * Phase C: process #3 -> initialize, then SIGKILL; report what the client sees.
 */
import { spawn } from 'node:child_process'

const DSH = 'node_modules/@deepseek-ai/dsh/lib/bin.js'
const CWD = '/home/ubuntu/acp-work'

function startAgent() {
  const child = spawn(process.execPath, [DSH, '--profile', 'acp'], {
    env: { ...process.env, DSH_PERMISSION_MODE: 'danger-full-access' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const state = { child, pending: new Map(), nextId: 1, buf: '', closed: null, stderrTail: '' }
  child.stdout.on('data', chunk => {
    state.buf += chunk.toString('utf8')
    let i
    while ((i = state.buf.indexOf('\n')) >= 0) {
      const line = state.buf.slice(0, i)
      state.buf = state.buf.slice(i + 1)
      if (!line.trim()) continue
      let msg
      try { msg = JSON.parse(line) } catch { continue }
      if (msg.id !== undefined && msg.method) {
        const opts = msg.params?.options ?? []
        const allow = opts.find(o => /allow/i.test(String(o.optionId ?? o.kind ?? ''))) ?? opts[0]
        state.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { outcome: { outcome: 'selected', optionId: allow?.optionId ?? 'allow_once' } } }) + '\n')
        continue
      }
      if (msg.id !== undefined && state.pending.has(msg.id)) { state.pending.get(msg.id)(msg); state.pending.delete(msg.id) }
    }
  })
  child.stderr.on('data', d => { state.stderrTail = (state.stderrTail + d.toString()).slice(-400) })
  child.on('exit', (code, signal) => { state.closed = { code, signal } })
  child.stdin.on('error', () => {})
  state.rpc = (method, params, timeoutMs = 60000) => new Promise((resolve, reject) => {
    const id = state.nextId++
    state.pending.set(id, msg => (msg.error ? reject(new Error(method + ' -> ' + JSON.stringify(msg.error))) : resolve(msg.result)))
    state.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    setTimeout(() => { if (state.pending.has(id)) { state.pending.delete(id); reject(new Error('TIMEOUT ' + method)) } }, timeoutMs)
  })
  return state
}

const out = {}

// ---- Phase A: create a durable session, then exit the process ----
try {
  const a = startAgent()
  await a.rpc('initialize', { protocolVersion: 1, clientCapabilities: {} })
  const ns = await a.rpc('session/new', { cwd: CWD, mcpServers: [] })
  const sid = ns.sessionId
  out.phaseA_sessionId = sid
  const pr = await a.rpc('session/prompt', { sessionId: sid, prompt: [{ type: 'text', text: 'Reply with exactly: acp resume seed' }] })
  out.phaseA_stopReason = pr?.stopReason ?? null
  await a.rpc('session/close', { sessionId: sid })
  a.child.kill()
  await new Promise(r => setTimeout(r, 1500))

  // ---- Phase B: fresh process, resume the persisted session ----
  const b = startAgent()
  await b.rpc('initialize', { protocolVersion: 1, clientCapabilities: {} })
  try {
    const rs = await b.rpc('session/resume', { sessionId: sid, cwd: CWD, mcpServers: [] })
    out.phaseB_resume = 'OK: ' + JSON.stringify(rs).slice(0, 200)
    const pr2 = await b.rpc('session/prompt', { sessionId: sid, prompt: [{ type: 'text', text: 'Reply with exactly: acp resume ok' }] })
    out.phaseB_promptAfterResume = pr2?.stopReason ?? null
    await b.rpc('session/close', { sessionId: sid })
  } catch (e) {
    out.phaseB_resume = 'FAILED: ' + String(e.message).slice(0, 220)
  }
  b.child.kill()
  await new Promise(r => setTimeout(r, 1000))
} catch (e) {
  out.phaseAB_error = String(e.message).slice(0, 300)
}

// ---- Phase C: kill mid-flight, see what the client observes ----
try {
  const c = startAgent()
  await c.rpc('initialize', { protocolVersion: 1, clientCapabilities: {} })
  await c.rpc('session/new', { cwd: CWD, mcpServers: [] })
  // issue a prompt but do NOT await it; kill the server mid-turn
  const inflight = c.rpc('session/prompt', { sessionId: (await c.rpc('session/list', {})).sessions?.[0]?.sessionId ?? 'x', prompt: [{ type: 'text', text: 'count from 1 to 3' }] }, 8000)
    .then(r => 'resolved: ' + JSON.stringify(r).slice(0, 100))
    .catch(e => 'rejected: ' + String(e.message).slice(0, 200))
  await new Promise(r => setTimeout(r, 400))
  c.child.kill('SIGKILL')
  await new Promise(r => setTimeout(r, 1200))
  out.phaseC_inflightAfterKill = await inflight
  out.phaseC_processExit = c.closed
} catch (e) {
  out.phaseC_error = String(e.message).slice(0, 300)
}

console.log('=== ACP RESUME / DISCONNECT RESULT ===')
console.log(JSON.stringify(out, null, 2))
