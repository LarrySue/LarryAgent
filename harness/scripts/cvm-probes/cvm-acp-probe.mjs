/**
 * DSH-2.5 task 2: ACP contract probe.
 *
 * Drives the shipped `acp` profile over raw ndjson JSON-RPC (no SDK wrapper) so
 * every inbound method/notification is visible verbatim:
 *   initialize -> session/new -> session/prompt (collect session/update) ->
 *   session/list -> session/close, then probe unsupported methods (fork/load).
 * Also asserts stdout purity (every stdout line must be a JSON-RPC frame).
 *
 * Env: DEEPSEEK_API_KEY (injected by caller), DSH_HOME handled by caller.
 */
import { spawn } from 'node:child_process'

const DSH = 'node_modules/@deepseek-ai/dsh/lib/bin.js'
const CWD = '/home/ubuntu/acp-work'

const child = spawn(process.execPath, [DSH, '--profile', 'acp'], {
  env: { ...process.env, DSH_PERMISSION_MODE: 'danger-full-access' },
  stdio: ['pipe', 'pipe', 'pipe'],
})

const methodCount = new Map()
const purityViolations = []
const stopReasons = []
let buf = ''
const pending = new Map()
let nextId = 1

const send = obj => child.stdin.write(JSON.stringify(obj) + '\n')
const bump = k => methodCount.set(k, (methodCount.get(k) ?? 0) + 1)

child.stdout.on('data', chunk => {
  buf += chunk.toString('utf8')
  let idx
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx)
    buf = buf.slice(idx + 1)
    if (!line.trim()) continue
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      purityViolations.push(line.slice(0, 200))
      continue
    }
    // server -> client request (needs a response)
    if (msg.id !== undefined && msg.method) {
      bump('agent->client req: ' + msg.method)
      if (msg.method === 'session/request_permission') {
        const opts = msg.params?.options ?? []
        const allow = opts.find(o => /allow/i.test(String(o.optionId ?? o.kind ?? ''))) ?? opts[0]
        send({ jsonrpc: '2.0', id: msg.id, result: { outcome: { outcome: 'selected', optionId: allow?.optionId ?? 'allow_once' } } })
      } else {
        send({ jsonrpc: '2.0', id: msg.id, result: {} })
      }
      continue
    }
    if (msg.method) {
      bump('agent->client ntf: ' + msg.method)
      if (msg.method === 'session/update') {
        const u = msg.params?.update ?? {}
        bump('    update kind: ' + (u.sessionUpdate ?? '?'))
      }
      continue
    }
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
})
child.stderr.on('data', d => process.stderr.write('[agent-stderr] ' + d.toString()))

function rpc(method, params, timeoutMs = 120000) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, msg => (msg.error ? reject(new Error(`${method} -> ${JSON.stringify(msg.error)}`)) : resolve(msg.result)))
    send({ jsonrpc: '2.0', id, method, params })
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        reject(new Error('TIMEOUT ' + method))
      }
    }, timeoutMs)
  })
}

const out = {}
try {
  out.initialize = await rpc('initialize', { protocolVersion: 1, clientCapabilities: {} })

  const ns = await rpc('session/new', { cwd: CWD, mcpServers: [] })
  out.sessionNew = ns
  const sid = ns.sessionId

  // two consecutive prompts on the same session (repeat-call stability)
  for (const text of ['Reply with exactly: acp ok', 'Reply with exactly: acp ok 2']) {
    const pr = await rpc('session/prompt', { sessionId: sid, prompt: [{ type: 'text', text }] })
    stopReasons.push(pr?.stopReason ?? null)
  }
  out.promptResponses = stopReasons

  const list = await rpc('session/list', {})
  out.sessionListSessions = Array.isArray(list?.sessions) ? list.sessions.length : list

  out.sessionClose = await rpc('session/close', { sessionId: sid })

  // unsupported-method probes (expected: JSON-RPC error, method-not-found)
  for (const m of ['session/fork', 'session/load', 'session/delete']) {
    try {
      const r = await rpc(m, { sessionId: sid, cwd: CWD, mcpServers: [] })
      out['probe ' + m] = 'UNEXPECTEDLY SUPPORTED: ' + JSON.stringify(r).slice(0, 120)
    } catch (e) {
      out['probe ' + m] = String(e.message).slice(0, 160)
    }
  }

  out.stdoutPurityViolations = purityViolations
  out.methodInventory = Object.fromEntries([...methodCount.entries()].sort())
  console.log('=== ACP PROBE RESULT ===')
  console.log(JSON.stringify(out, null, 2))
} catch (e) {
  console.log('=== ACP PROBE ERROR ===', e.message)
  console.log('methodInventory so far:', JSON.stringify(Object.fromEntries(methodCount), null, 2))
} finally {
  child.kill()
}
