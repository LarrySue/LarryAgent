#!/usr/bin/env node
/**
 * DSH-3.8.1 · 装置：**桩 dsh**（canonical stub）—— 它说 DSH 的**行分帧 JSON-RPC**
 * （`@@deepseek-ai/dsh-sdk-protocol` 的 `JsonRpcLineTransport` 语义），但**不牵 LLM、不要 key**。
 *
 * 用途（派发稿 §1-J4「装置」栏指定优先用它）：验「driver 接住反向请求但**不自答**」——
 *   - 桩在 `session/prompt` 之后**主动发出一条约定的反向请求** `approval/request`；
 *   - 然后**等** driver 回帧：收到 ⇒ 记 `stub-reverse-answer-received`（**正向锚**，证明装置有判别力）；
 *     等不到 ⇒ 记 `stub-reverse-no-answer`（**负向锚**，J4 的期望观测）。
 *
 * ⚠️ 边界：本文件**不是**「自造另一个 executable」（禁区 6 禁的是**产品侧**另造 host）。
 *   它只在**验收装置**里扮演 dsh 对端，驱动**产品路径**永远只 spawn `dsh --profile <name>`。
 *
 * 环境：
 *   S381_STUB_LOG             打点文件（JSONL）
 *   S381_STUB_REVERSE_WAIT_MS 等答案的上限（缺省 6000）
 *   S381_STUB_EMIT            是否在 prompt 后发反向请求（缺省 1）
 *   S381_STUB_IDLE_AFTER      等完答案后是否发 `session/status idle`（缺省 1）
 *   S381_STUB_IGNORE_SHUTDOWN 置 `1` 时**收到 `shutdown` 只打点、不回帧、不因此自退**（缺省 0 ＝ 现行为**逐字不变**）
 *                             ⭐ DSH-3.8.2 · A1 用：把 driver 的 `force-kill` 分支从"不可达"逼成**可达**
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createInterface } from 'node:readline'

const LOG = process.env.S381_STUB_LOG ?? null
const WAIT_MS = Number(process.env.S381_STUB_REVERSE_WAIT_MS ?? 6000)
const EMIT = (process.env.S381_STUB_EMIT ?? '1') !== '0'
const IDLE_AFTER = (process.env.S381_STUB_IDLE_AFTER ?? '1') !== '0'
/** DSH-3.8.2 · A1 反向对照开关（缺省 `0` ⇒ 现行为不变）。 */
const IGNORE_SHUTDOWN = (process.env.S381_STUB_IGNORE_SHUTDOWN ?? '0') === '1'
const SESSION_ID = process.env.S381_STUB_SESSION_ID ?? 'session-stub-1'
const REVERSE_FRAME_ID = 's-1'
const REVERSE_REQUEST_ID = 'stub-rev-1'

function log(record) {
  if (LOG === null) return
  try {
    mkdirSync(dirname(LOG), { recursive: true })
    appendFileSync(LOG, `${JSON.stringify({ t: new Date().toISOString(), role: 'stub-dsh', pid: process.pid, ...record })}\n`)
  } catch {
    /* 诊断失败不影响协议 */
  }
}
const send = (frame) => process.stdout.write(`${JSON.stringify(frame)}\n`)
const sendResult = (id, result) => send({ jsonrpc: '2.0', id, result })
const sendError = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } })

log({ event: 'stub-start', node: process.version, execPath: process.execPath, waitMs: WAIT_MS, emit: EMIT })

let reversePending = null // {frameId, sentAt}
let reverseTimer = null

function emitReverseRequest() {
  const params = {
    requestId: REVERSE_REQUEST_ID,
    toolName: 'approval_probe',
    callId: 'call_stub_1',
    agentId: SESSION_ID,
    reason: 'case=stub',
  }
  reversePending = { frameId: REVERSE_FRAME_ID, sentAt: Date.now() }
  log({ event: 'stub-reverse-request-sent', frameId: REVERSE_FRAME_ID, method: 'approval/request', params, note: '⛔ 若 driver 自答，这条会被立刻结算 ⇒ 负向对照就失效' })
  send({ jsonrpc: '2.0', id: REVERSE_FRAME_ID, method: 'approval/request', params })
  reverseTimer = setTimeout(() => {
    if (reversePending === null) return
    log({
      event: 'stub-reverse-no-answer',
      frameId: REVERSE_FRAME_ID,
      waitedMs: WAIT_MS,
      verdict: '对端观测到：**无响应**（J4 的期望观测之一：driver 没替人答）',
    })
    reversePending = null
    finishTurn()
  }, WAIT_MS)
}

function finishTurn() {
  if (IDLE_AFTER) {
    send({ jsonrpc: '2.0', method: 'session/status', params: { sessionId: SESSION_ID, status: 'idle' } })
    log({ event: 'stub-status-idle-sent', sessionId: SESSION_ID })
  }
}

const rl = createInterface({ input: process.stdin })
rl.on('line', (line) => {
  const text = line.trim()
  if (text === '') return
  let frame
  try {
    frame = JSON.parse(text)
  } catch {
    log({ event: 'stub-bad-frame', raw: text.slice(0, 200) })
    return
  }
  const { id, method, result, error } = frame

  // 响应帧：只可能是**反向请求的答案**（本桩只发过一条）
  if (method === undefined && id !== undefined) {
    if (reversePending !== null && String(id) === String(reversePending.frameId)) {
      clearTimeout(reverseTimer)
      const waitedMs = Date.now() - reversePending.sentAt
      reversePending = null
      if (error !== undefined) {
        log({ event: 'stub-reverse-error-received', frameId: id, code: error?.code ?? null, message: error?.message ?? null, waitedMs })
      } else {
        log({ event: 'stub-reverse-answer-received', frameId: id, result: result ?? null, waitedMs, note: '**正向锚**：装置确实看得见"被答了"这件事' })
      }
      finishTurn()
      return
    }
    log({ event: 'stub-unexpected-response', frameId: id, raw: text.slice(0, 300) })
    return
  }

  if (method === 'initialize') {
    log({ event: 'stub-request-in', method, frameId: id })
    sendResult(id, { serverInfo: { name: 'stub-dsh-runtime', version: '0.0.0-stub' } })
    return
  }
  if (method === 'session/prompt') {
    log({ event: 'stub-request-in', method, frameId: id, params: frame.params ?? null })
    sendResult(id, { messageId: 'msg_stub_1' })
    if (EMIT) setTimeout(emitReverseRequest, 50)
    else finishTurn()
    return
  }
  if (method === 'shutdown') {
    log({ event: 'stub-request-in', method, frameId: id })
    // ⭐ DSH-3.8.2 · A1 反向对照：置 `S381_STUB_IGNORE_SHUTDOWN=1` 时**只打点、不回帧、不 exit**
    //    ⇒ driver 的 `if (!exited && forceAfterMs > 0)` 分支**可达**（把恒真的 forced/killCalled 翻到 true）。
    if (IGNORE_SHUTDOWN) {
      log({ event: 'stub-shutdown-ignored', frameId: id, note: '按 S381_STUB_IGNORE_SHUTDOWN=1：不回 shutdown 帧、不自退 ⇒ 等 driver 的 force-kill（A1 期望观测）' })
      return
    }
    // ⭐ 收工前把"那条反向请求到底有没有被答"结清一次：**确定性**优于靠等一个 6 s 窗口
    if (reversePending !== null) {
      clearTimeout(reverseTimer)
      log({
        event: 'stub-reverse-no-answer',
        frameId: REVERSE_FRAME_ID,
        waitedMs: Date.now() - reversePending.sentAt,
        via: 'shutdown-while-pending',
        verdict: '对端观测到：**无响应**（J4 期望观测：driver 没替人答）',
      })
      reversePending = null
    }
    sendResult(id, { ok: true })
    // 模仿真 dsh 的 `disposeAndExit`：先回帧、flush，再自己 exit(0)
    setTimeout(() => {
      log({ event: 'stub-exit', by: 'disposeAndExit(仿官方)' })
      process.exit(0)
    }, 50)
    return
  }
  log({ event: 'stub-method-not-found', method, frameId: id })
  sendError(id, -32601, `method not found: ${String(method)}`)
})

rl.on('close', () => {
  log({ event: 'stub-stdin-end' })
  process.exit(0)
})
