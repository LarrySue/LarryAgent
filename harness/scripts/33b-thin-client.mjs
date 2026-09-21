#!/usr/bin/env node
/**
 * DSH-3.3-b · **薄客户端 ＋ stub 对端**（装置，产品部署不要装）。
 *
 * 它扮演"另一个进程"：自己 `spawn` dsh（`--profile sdk`），用
 * `JsonRpcLineTransport(child.stdout, child.stdin)` 跟它说 JSON-RPC，
 * 并（除了 `nohandler` 臂）用 `onRequest` **作答** —— 即接收 dsh 侧
 * `plugin-approval-remote-answerer` 发出的**出站** `approval/request`，回一个结果词汇。
 *
 * 姿态自证
 *   - ⛔ 不用 `HarnessClient` / `DeepSeekHarness`（它们内部只挂 `onNotification`、无 `onRequest`）——
 *     本文件自己 spawn ＋ 自己 `new JsonRpcLineTransport` ＋ 自己装 `onRequest`。
 *   - ⛔ 不打印 Key（只从 env 继承给子进程，不读值）。
 *   - **双侧留痕**：本对端把自己这一侧的收发写进 `<out>/peer.log` / `<out>/peer-wire.jsonl`；
 *     dsh 那一侧由插件打点（`plugin-approval-remote-answerer.log` / `plugin-sdk-relay.log`）。
 *   - **原始帧级证据**：另挂一个 `child.stdout` 的 `data` 监听（注册早于 transport 的监听 ⇒ 先看到帧），
 *     逐帧落到 `peer-wire.jsonl` —— J5 的"迟到回答"要靠它拿到出站请求的 JSON-RPC `id`。
 *
 * 按 `case`（出站 params 里的 `case` 字段）决定怎么作答：
 *   approve   → 立刻回 `'allowed-once'`
 *   reject    → 立刻回 `'rejected'`
 *   timeout   → **挂起不回**（J2 负向 / J3(a) 请求侧 signal 的观察对象）
 *   lateabort → 挂起；等 `S33B_LATE_MS` 后用**原始帧**回一个 `'allowed-once'`（J5 的"迟到回答"）
 *   killpeer  → 挂起（等 runner 把本进程杀掉）（J4）
 *   其它/缺省 → 回 `'rejected'`
 *
 * 退出码：`0` 正常收工 ／ `2` 前置缺失 ／ `124` 看门狗
 */
import { spawn } from 'node:child_process'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { JsonRpcLineTransport } from '@deepseek-ai/dsh-sdk-protocol'

const HARNESS = resolve(import.meta.dirname, '..')
const DSH_BIN = join(HARNESS, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')

const home = process.env.S33B_HOME
const out = process.env.S33B_OUT
const arm = process.env.S33B_ARM ?? 'main'
const lateMs = Number(process.env.S33B_LATE_MS ?? 12_000)
const graceMs = Number(process.env.S33B_GRACE_MS ?? 4_000)
const watchdogMs = Number(process.env.S33B_WATCHDOG_MS ?? 240_000)
const cwd = process.env.S33B_CWD ?? process.cwd()
const provider = process.env.S33B_PROVIDER ?? 'deepseek-official'
const model = process.env.S33B_MODEL ?? 'deepseek-flash'
const promptText = process.env.S33B_PROMPT ?? ''

if (home === undefined || out === undefined || promptText === '') {
  console.error('[33b-peer] 前置缺失：需要 S33B_HOME / S33B_OUT / S33B_PROMPT')
  process.exit(2)
}
mkdirSync(out, { recursive: true })

const logFile = join(out, 'peer.log')
const wireFile = join(out, 'peer-wire.jsonl')
function log(record) {
  appendFileSync(logFile, `${JSON.stringify({ t: new Date().toISOString(), arm, pid: process.pid, ...record })}\n`)
}
function wire(direction, raw) {
  appendFileSync(wireFile, `${JSON.stringify({ t: new Date().toISOString(), arm, direction, raw })}\n`)
}

log({ event: 'peer-start', node: process.version, execPath: process.execPath, home, cwd, arm, lateMs, graceMs })

/** dsh 子进程是否已退出（用于提前结束等 idle，避免无谓的 180 s 空等）。 */
let childExited = false

// ── 自己 spawn dsh ─────────────────────────────────────────────────────────
const child = spawn(process.execPath, [DSH_BIN, '--profile', 'sdk'], {
  cwd,
  env: { ...process.env, DSH_HOME: home },
  stdio: ['pipe', 'pipe', 'pipe'],
})
log({ event: 'peer-spawned', dshBin: DSH_BIN, childPid: child.pid ?? null, args: [DSH_BIN, '--profile', 'sdk'] })
writeFileSync(join(out, 'peer-child-pid.txt'), `${child.pid ?? ''}\n`, 'utf8')
let stderrTail = ''
const stderrFile = join(out, 'peer-child-stderr.stream.txt')
child.stderr.setEncoding('utf8')
child.stderr.on('data', (chunk) => {
  stderrTail += chunk
  if (stderrTail.length > 40_000) stderrTail = stderrTail.slice(-40_000)
  // ⭐ 逐块落盘（不是收工时才写）：`killpeer` 臂里本进程会被 runner 杀掉 ⇒ 收工时那段写不到
  try {
    appendFileSync(stderrFile, chunk)
  } catch {
    /* ignore */
  }
})
child.once('exit', (code, signal) => {
  log({ event: 'peer-child-exit', code, signal })
  childExited = true
  for (const [key, waiter] of notificationWaiters) {
    notificationWaiters.delete(key)
    waiter({ method: 'child/exit', params: {} })
  }
})

/** 原始帧监听：注册在 `transport.start()` **之前** ⇒ 先于 transport 看到同一批 chunk。 */
const tapDecoder = new StringDecoder('utf8')
let tapBuffer = ''
/** 出站请求（dsh → 本对端）的帧登记：`requestId` → JSON-RPC `id`。 */
const outboundIds = new Map()
let lastOutboundApproval = null
child.stdout.on('data', (chunk) => {
  tapBuffer += tapDecoder.write(chunk)
  for (;;) {
    const nl = tapBuffer.indexOf('\n')
    if (nl < 0) break
    const line = tapBuffer.slice(0, nl).trim()
    tapBuffer = tapBuffer.slice(nl + 1)
    if (line === '') continue
    wire('dsh-to-peer', line)
    let frame
    try {
      frame = JSON.parse(line)
    } catch {
      continue
    }
    if (frame?.method === 'approval/request') {
      lastOutboundApproval = frame
      if (typeof frame.params?.requestId === 'string') outboundIds.set(frame.params.requestId, frame.id)
      log({ event: 'peer-wire-seen-outbound-approval', jsonrpcId: frame.id, requestId: frame.params?.requestId ?? null, case: frame.params?.case ?? null })
    }
  }
})

const transport = new JsonRpcLineTransport(child.stdout, child.stdin)

// ⭐ 出站帧留痕（对端 → dsh）：包一层 `child.stdin.write`。
//    为什么不用手写 `wire()`：`nohandler` 臂里那条 `-32601` 是 **transport 自己**写的
//    （未装 handler ⇒ `handleIncomingRequest` 直接 `writeError(id, -32601, …)`），
//    不走本文件任何一行 ⇒ 只有在这一层才抓得到。
const originalStdinWrite = child.stdin.write.bind(child.stdin)
child.stdin.write = (chunk, ...rest) => {
  try {
    wire('peer-to-dsh', String(chunk).replace(/\n+$/, ''))
  } catch {
    /* 留痕失败不影响协议 */
  }
  return originalStdinWrite(chunk, ...rest)
}

// ── 通知面（收 idle 用）────────────────────────────────────────────────────
const notifications = []
const notificationWaiters = new Map()
const notificationCounts = {}
transport.onNotification((method, params) => {
  notificationCounts[method] = (notificationCounts[method] ?? 0) + 1
  notifications.push({ method, params })
  const key = `${method}:${params?.sessionId ?? params?.parentSessionId ?? ''}`
  const waiter = notificationWaiters.get(key)
  if (waiter !== undefined) waiter({ method, params })
})

if (arm !== 'nohandler') {
  // ⭐ J2/J3/J4/J5 的挂载点：对端**作答**（`onRequest` 是替换语义，本进程只有这一处）
  transport.onRequest(async (method, params) => {
    const caseName = typeof params?.case === 'string' ? params.case : ''
    const jsonrpcId = outboundIds.get(params?.requestId) ?? lastOutboundApproval?.id ?? null
    log({ event: 'peer-request', method, case: caseName, requestId: params?.requestId ?? null, jsonrpcId, toolName: params?.toolName ?? null, callId: params?.callId ?? null, agentId: params?.agentId ?? null, reason: params?.reason ?? null, transportPending: transport.pending?.size ?? null })
    if (caseName === 'timeout' || caseName === 'killpeer') {
      log({ event: 'peer-hang', method, case: caseName, note: caseName === 'timeout' ? '收到但不回（J2 负向 / J3(a)）' : '收到但不回，等 runner 杀本进程（J4 · 进程级）' })
      return new Promise(() => {})
    }
    if (caseName === 'closestdin') {
      // ⭐ J4 主形态：**终止传输**（派发稿：把对端「进程**/传输**」终止）。
      //    只关 dsh 的 stdin —— dsh 侧的 `onInputEnd` ⇒ `failPending`（reject pending）
      //    ＋ 官方 effect 收工时 `transport.close()` ⇒ 两条都由中继同步留痕。
      log({ event: 'peer-hang', method, case: caseName, note: '收到但不回；随即关闭 dsh 的 stdin（终止传输）', jsonrpcId })
      setTimeout(() => {
        try {
          child.stdin.end()
          log({ event: 'peer-closed-stdin', method, case: caseName, note: '已 end() dsh 的 stdin；本进程继续存活（不 kill）' })
        } catch (e) {
          log({ event: 'peer-close-stdin-failed', error: `${e?.name}: ${e?.message}` })
        }
      }, Number(process.env.S33B_CLOSE_STDIN_MS ?? 500))
      return new Promise(() => {})
    }
    if (caseName === 'lateabort') {
      log({ event: 'peer-hang', method, case: caseName, note: `收到但不回；${lateMs}ms 后用原始帧补一条"迟到回答"（J5）`, lateMs, jsonrpcId })
      setTimeout(() => {
        // ⛔ 刻意绕过 transport，直接往 dsh 的 stdin 写一个**原始响应帧**（模拟"对端迟到的回答"）
        const frame = { jsonrpc: '2.0', id: jsonrpcId, result: 'allowed-once' }
        child.stdin.write(`${JSON.stringify(frame)}\n`)
        log({ event: 'peer-late-answer-sent', method, case: caseName, jsonrpcId, result: 'allowed-once', note: '此时 dsh 侧早已按请求侧 signal 结算 ⇒ 本条必须被丢弃' })
      }, lateMs)
      return new Promise(() => {})
    }
    const result = caseName === 'reject' ? 'rejected' : caseName === 'approve' ? 'allowed-once' : 'rejected'
    log({ event: 'peer-answer', method, case: caseName, jsonrpcId, result })
    return result
  })
} else {
  log({ event: 'peer-nohandler', note: '本臂**故意不装** onRequest ⇒ dsh 的出站请求应收到 -32601（J6②）' })
}
transport.start()

function logWireOutbound(method, result) {
  wire('peer-to-dsh', JSON.stringify({ jsonrpc: '2.0', method, result }))
}

const sessionId = `session-33b-${Math.random().toString(36).slice(2, 10)}`
const result = { arm, sessionId, steps: [], ok: false }

function waitForIdle(target, timeoutMs) {
  return new Promise((resolvePromise) => {
    // 先扫历史（可能 idle 已经先到）
    const hit = notifications.find((n) => n.method === 'session.status' && n.params?.sessionId === target && n.params?.status === 'idle')
    if (hit !== undefined) {
      resolvePromise(hit)
      return
    }
    const key = `session.status:${target}`
    const waiter = (n) => {
      if (n.method === 'child/exit') {
        clearTimeout(timer)
        notificationWaiters.delete(key)
        resolvePromise(null)
        return
      }
      if (n.params?.status !== 'idle') return
      clearTimeout(timer)
      notificationWaiters.delete(key)
      resolvePromise(n)
    }
    const timer = setTimeout(() => {
      notificationWaiters.delete(key)
      resolvePromise(null)
    }, timeoutMs)
    notificationWaiters.set(key, waiter)
  })
}

const watchdog = setTimeout(() => {
  log({ event: 'peer-watchdog', watchdogMs })
  try {
    child.kill()
  } catch {
    /* ignore */
  }
  process.exit(124)
}, watchdogMs)

try {
  const init = await transport.request('initialize', { cwd, provider, model })
  log({ event: 'peer-initialized', result: JSON.stringify(init ?? null).slice(0, 300) })
  result.steps.push({ step: 'initialize', ok: true })

  const prompted = await transport.request('session/prompt', { sessionId, contentBlocks: [{ type: 'text', text: promptText }] })
  log({ event: 'peer-prompted', messageId: prompted?.messageId ?? null })
  result.steps.push({ step: 'session/prompt', ok: true, messageId: prompted?.messageId ?? null })
} catch (e) {
  log({ event: 'peer-error', where: 'handshake', error: `${e?.name}: ${e?.message}` })
  result.steps.push({ step: 'handshake', ok: false, error: `${e?.name}: ${e?.message}` })
}

// 等 idle（通知已由上面的统一 handler 收集）
{
  const idle = childExited ? null : await waitForIdle(sessionId, Number(process.env.S33B_IDLE_TIMEOUT_MS ?? 180_000))
  result.steps.push({ step: 'idle', ok: idle !== null })
  log({ event: 'peer-idle', reached: idle !== null, childExited, notificationCounts })
}

// 给"迟到回答"留落地窗口
await new Promise((r) => setTimeout(r, graceMs))
log({ event: 'peer-grace-done', graceMs, transportPending: transport.pending?.size ?? null })

// 收工：best-effort 发 shutdown（失败不算判据）
if (childExited) {
  // ⚠️ 首跑暴露：dsh 已经退出后，再 `transport.request()` 会**永久挂起**（输入流已 end ⇒
  //    新条目没有对端可答，`failPending` 也早已在 end 时跑过）⇒ 本臂必须跳过，否则要等看门狗。
  log({ event: 'peer-shutdown-skipped', reason: 'dsh child already exited' })
} else {
  const abandon = new AbortController()
  const timer = setTimeout(() => abandon.abort(new Error('shutdown timeout')), 3_000)
  try {
    await transport.request('shutdown', {}, abandon.signal)
    log({ event: 'peer-shutdown-sent' })
  } catch (e) {
    log({ event: 'peer-shutdown-failed', error: `${e?.name}: ${e?.message}` })
  } finally {
    clearTimeout(timer)
  }
}
clearTimeout(watchdog)
result.ok = true
result.notificationCounts = notificationCounts
writeFileSync(join(out, 'peer-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
writeFileSync(join(out, 'peer-child-stderr.txt'), stderrTail, 'utf8')
log({ event: 'peer-done', transportPending: transport.pending?.size ?? null })
// 让 dsh 自己收尾（EOF/退出），本进程直接退
try {
  child.stdin.end()
} catch {
  /* ignore */
}
setTimeout(() => {
  try {
    child.kill()
  } catch {
    /* ignore */
  }
  process.exit(0)
}, 4_000)
