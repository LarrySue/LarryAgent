#!/usr/bin/env node
/**
 * DSH-3.9.1 · 调试体验台 bridge（WB 裁定 B 主案 · 2026-10-18）
 *
 * 一个**临时台**：浏览器页面 ⇄ WebSocket ⇄ 本进程 ⇄ DshDriver ⇄ dsh（--profile sdk）。
 * 三件事：多轮对话（同一 sessionId）、`session.event` 实时上行、审批反向请求转给页面。
 *
 * home 形态（B 主案）：
 *   - 每次起台复制 `.dsh-home/profiles/sdk` → **临时 home**（mkdtemp ＋ cpSync ＋ 删副本
 *     `.modules.yaml`；381 范式），源 `.dsh-home` 只读（唯一例外 = §2-A 已落的 memory 三件）。
 *   - 临时 home 内 **junction** 三个审批插件（relay ／ remote answerer ／ answerer），
 *     并把三个包名追加进副本 `dsh.profile.bundles`（顺序 = base → sdk-app → relay →
 *     remote → answerer；remote 必须早于 answerer，因为后者在 apply 时 probe 替换口）。
 *   - 凭据只**复制**（`.credentials.yaml`）到临时 home，供 dsh 自己读取；⛔ 不读值、
 *     ⛔ 不注入 env、⛔ 不进任何输出。
 *
 * 记忆插件（§2-A 落盘件）：随 `.dsh-home/profiles/sdk` 一起复制；其 `dbPath` 是固定绝对
 * 路径 ⇒ 记忆库跨台持续（不随临时 home 删除）。
 *
 * WS 协议（页面 ⇄ bridge，临时约定；3.8 定稿后可能改名）：
 *   server→client: hello ／ event ／ notification ／ approval ／ approval-result ／
 *                  prompt-accepted ／ error ／ stopping
 *   client→server: prompt ／ approval-answer ／ stop
 *
 * 用法：
 *   node harness/scripts/dsh-console/bridge.mjs [--port 8791] [--cwd <dir>] [--home <dir>]
 *                                              [--evidence <dir>] [--keep-home] [--session <id>]
 * 收尾：Ctrl+C 或页面「停止 bridge」⇒ 发协议 shutdown ⇒ 等 dsh 自退 ⇒ 关 WS/HTTP ⇒
 *       删临时 home（--keep-home 保留）⇒ 打印 STOP-REPORT。⛔ 不调 process.exit。
 */
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { WebSocketServer } from 'ws'
import { DshDriver, localIso } from '../../packages/dsh-driver/lib/index.js'

const HARNESS = resolve(import.meta.dirname, '..', '..')
const REPO = resolve(HARNESS, '..')
const PAGE = join(import.meta.dirname, 'index.html')

/** 审批链路三件（3.3-b 66/66 验证过的形态，本台只复用）。顺序敏感：remote 必须早于 answerer。 */
const APPROVAL_PKGS = [
  { name: '@larryagent/plugin-sdk-relay', dir: 'plugin-sdk-relay' },
  { name: '@larryagent/plugin-approval-remote-answerer', dir: 'plugin-approval-remote-answerer' },
  { name: '@larryagent/plugin-approval-answerer', dir: 'plugin-approval-answerer' },
]

const argv = process.argv.slice(2)
const argOf = (name, fallback) => {
  const at = argv.indexOf(name)
  return at >= 0 && at + 1 < argv.length ? argv[at + 1] : fallback
}
const hasFlag = (name) => argv.includes(name)

const port = Number(argOf('--port', '8791'))
/** 缺省工作区 = 安全区（⛔ 不暴露仓库根）；`--cwd` 可覆盖。 */
const cwd = resolve(argOf('--cwd', 'D:\\Temp\\DSH-Dev-Temp'))
const srcHome = resolve(argOf('--home', join(REPO, '.dsh-home')))
const keepHome = hasFlag('--keep-home')
const sessionId = argOf('--session', `session-391-${randomUUID().replaceAll('-', '').slice(0, 12)}`)
const evidence = resolve(argOf('--evidence', join(resolve(REPO, '..'), '_trae-evidence', '391', `run-${Date.now()}`)))
mkdirSync(evidence, { recursive: true })

const frameFile = join(evidence, 'ws-frames.jsonl')
const notifFile = join(evidence, 'notifications.jsonl')
const approvalFile = join(evidence, 'approvals.jsonl')
const save = (file, record) => {
  try { appendFileSync(file, `${JSON.stringify({ t: localIso(), ...record })}\n`) } catch { /* 取证失败不影响台 */ }
}

/** 临时 home：复制源 profile ＋ junction 审批三件 ＋ 改副本 bundles ＋ 写 overlay。 */
function buildTempHome() {
  const home = mkdtempSync(join(tmpdir(), 'larry-391-'))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(join(srcHome, 'profiles', 'sdk'), join(home, 'profiles', 'sdk'), { recursive: true })
  // 副本不得沿用源 profile 的 pnpm 元数据（3.7.4 教训：绝对路径会让 plugin add 立刻报错）
  rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
  // 凭据只复制、不读（dsh 自己从 DSH_HOME/.credentials.yaml 解析）
  for (const f of ['.credentials.yaml', '.anonymous-user-id']) {
    if (existsSync(join(srcHome, f))) cpSync(join(srcHome, f), join(home, f))
  }
  // junction 审批三件（实体在 harness/packages，临时 home 内只放链接）
  const nm = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent')
  mkdirSync(nm, { recursive: true })
  for (const p of APPROVAL_PKGS) {
    const target = join(nm, p.name.split('/')[1])
    if (!existsSync(target)) symlinkSync(join(HARNESS, 'packages', p.dir), target, 'junction')
  }
  // 副本 bundles 追加审批三件（顺序：base → sdk-app → relay → remote → answerer）
  const pkgPath = join(home, 'profiles', 'sdk', 'package.json')
  const manifest = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const bundles = manifest.dsh?.profile?.bundles ?? []
  for (const p of APPROVAL_PKGS) if (!bundles.includes(p.name)) bundles.push(p.name)
  manifest.dsh.profile.bundles = bundles
  writeFileSync(pkgPath, `${JSON.stringify(manifest, null, 2)}\n`)
  // overlay：覆盖审批两件的 config（整行覆盖语义，见 3.3-b 装置注释）
  const overlay = join(home, 'overlay-391.yml')
  writeFileSync(overlay, [
    '# DSH-3.9.1 体验台 overlay（临时 home 内，⛔ 不进 .dsh-home）',
    '- id: plugin-approval-remote-answerer',
    '  config:',
    '    method: approval/request',
    '    answerTimeoutMs: 0',
    '- id: plugin-approval-answerer',
    '  config:',
    '    scope: first',
    '    policy: approve',
    '',
  ].join('\n'))
  return { home, overlay, bundles }
}

const { home: tempHome, overlay, bundles } = buildTempHome()
console.log(`[391] 临时 home=${tempHome}`)
console.log(`[391] bundles=${JSON.stringify(bundles)}`)
console.log(`[391] 证据=${evidence}`)

// ── WS 广播 ────────────────────────────────────────────────────────────────
/** @type {Set<import('ws').WebSocket>} */
const clients = new Set()
const broadcast = (payload) => {
  const text = JSON.stringify(payload)
  save(frameFile, { dir: 'server-to-page', payload })
  for (const ws of clients) {
    if (ws.readyState === 1) {
      try { ws.send(text) } catch { /* 单个客户端失败不影响其它 */ }
    }
  }
}

// ── driver ─────────────────────────────────────────────────────────────────
const diagnostics = []
const driver = new DshDriver({
  profile: 'sdk',
  patches: [overlay],
  dshHome: tempHome,
  cwd,
  marker: join(evidence, 'driver.log'),
  reverseIdleWarnMs: 0,
  shutdownTimeoutMs: 8_000,
  hooks: {
    onNotification(method, params) {
      save(notifFile, { method, params })
      if (method === 'session.event') {
        broadcast({ type: 'event', sessionId: params?.sessionId ?? null, event: params?.event ?? null })
        return
      }
      broadcast({ type: 'notification', method, params })
    },
    onReverseRequest(entry) {
      save(approvalFile, { event: 'reverse-request', entry })
      // ⛔ 这里绝不代答：页面点按钮后才会 driver.answer(...)
      broadcast({
        type: 'approval',
        approval: {
          frameId: entry.frameId,
          method: entry.method,
          requestId: entry.requestId,
          toolName: entry.toolName,
          callId: entry.callId,
          agentId: entry.agentId,
          reason: entry.reason,
          receivedAt: entry.receivedAt,
        },
      })
    },
    onDiagnostic(line) {
      if (diagnostics.length < 400) diagnostics.push(line)
      if (diagnostics.length === 400) diagnostics.push('…（diagnostics 截断）')
    },
    onChildExit(info) {
      save(approvalFile, { event: 'child-exit', info })
      broadcast({ type: 'notification', method: 'child.exit', params: info })
    },
  },
})

const started = driver.start()
console.log(`[391] dsh child pid=${started.childPid} marker=${started.marker}`)

// ── HTTP ＋ WS ─────────────────────────────────────────────────────────────
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: true, sessionId, childPid: started.childPid, evidence, cwd, bundles }))
    return
  }
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = readFileSync(PAGE, 'utf8')
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(html)
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(`index.html 读取失败：${e?.message ?? e}`)
    }
    return
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  res.end('not found')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
  ws.on('error', () => clients.delete(ws))
  ws.send(JSON.stringify({
    type: 'hello',
    sessionId,
    childPid: started.childPid,
    cwd,
    evidence,
    bundles,
    node: process.version,
  }))
  ws.on('message', async (raw) => {
    let msg
    try { msg = JSON.parse(String(raw)) } catch { return }
    save(frameFile, { dir: 'page-to-server', payload: msg })
    if (msg?.type === 'prompt' && typeof msg.text === 'string' && msg.text.trim() !== '') {
      try {
        const receipt = await driver.prompt(sessionId, msg.text)
        broadcast({ type: 'prompt-accepted', messageId: receipt.messageId, text: msg.text })
      } catch (e) {
        broadcast({ type: 'error', message: `prompt 失败：${e?.name}: ${e?.message}` })
      }
      return
    }
    if (msg?.type === 'approval-answer') {
      const frameId = msg.frameId ?? null
      const result = msg.result
      const accepted = frameId === null ? false : driver.answer(frameId, result)
      save(approvalFile, { event: 'page-answer', frameId, result, accepted })
      broadcast({ type: 'approval-result', frameId, result, accepted })
      return
    }
    if (msg?.type === 'stop') {
      void stopSequence('page-stop')
    }
  })
})

// ── 收尾 ───────────────────────────────────────────────────────────────────
let stopping = null
const stopSequence = (reason) => {
  if (stopping !== null) return stopping
  stopping = (async () => {
    console.log(`[391] 收尾：${reason}`)
    broadcast({ type: 'stopping', reason })
    let report = null
    try {
      report = await driver.stop()
    } catch (e) {
      report = { error: `${e?.name}: ${e?.message}` }
    }
    for (const ws of clients) {
      try { ws.terminate() } catch { /* ignore */ }
    }
    clients.clear()
    await new Promise((r) => server.close(() => r()))
    await new Promise((r) => wss.close(() => r()))
    if (!keepHome) rmSync(tempHome, { recursive: true, force: true })
    const summary = {
      reason,
      sessionId,
      tempHome,
      tempHomeRemoved: !keepHome,
      evidence,
      pendingReversesAtEnd: driver.pendingReverseCount,
      childExit: driver.childExit,
      diagnosticsTail: diagnostics.slice(-20),
      stop: report,
      driverFrames: driver.frames.length,
    }
    writeFileSync(join(evidence, 'stop-report.json'), `${JSON.stringify(summary, null, 2)}\n`)
    console.log(`STOP-REPORT ${JSON.stringify({ reason, tempHomeRemoved: !keepHome, childExit: summary.childExit, forced: report?.forced ?? null })}`)
    return summary
  })()
  return stopping
}
process.on('SIGINT', () => { void stopSequence('SIGINT') })
process.on('SIGTERM', () => { void stopSequence('SIGTERM') })

// ── 起台 ───────────────────────────────────────────────────────────────────
try {
  const init = await driver.initialize()
  console.log(`[391] initialize ${init.elapsedMs}ms serverInfo=${JSON.stringify(init.result?.serverInfo ?? null)}`)
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen)
    server.listen(port, '127.0.0.1', () => resolveListen())
  })
  console.log(`[391] 监听 http://127.0.0.1:${port}/  （WS 同端口）`)
  console.log(`[391] sessionId=${sessionId}`)
  // J1 取证：起台自报的监听 URL / 启动形态 / 插件 bundle 顺序（⛔ 不含凭据值）
  writeFileSync(join(evidence, 'startup.json'), `${JSON.stringify({
    when: localIso(),
    node: process.version,
    execPath: process.execPath,
    command: [process.execPath, ...process.argv.slice(1)],
    cwd,
    srcHome,
    tempHome,
    evidence,
    bundles,
    listen: `http://127.0.0.1:${port}/`,
    sessionId,
    launch: started,
    initialize: { elapsedMs: init.elapsedMs, serverInfo: init.result?.serverInfo ?? null },
  }, null, 2)}\n`)
} catch (e) {
  console.error(`[391] ❌ 起台失败：${e?.name}: ${e?.message}`)
  try { await driver.stop() } catch { /* ignore */ }
  if (!keepHome) rmSync(tempHome, { recursive: true, force: true })
  writeFileSync(join(evidence, 'start-failure.json'), `${JSON.stringify({ error: `${e?.name}: ${e?.message}`, diagnosticsTail: diagnostics.slice(-40) }, null, 2)}\n`)
  process.exitCode = 2
}
