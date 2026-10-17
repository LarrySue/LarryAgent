#!/usr/bin/env node
/**
 * DSH-3.6 · S4 记忆最小闭环 · 验收装置（判据 J0–J5，判据权威全文 =
 * docs/dsh/dsh-migration.md §3.6〈DSH-3.6 · S4 记忆最小闭环 —— 判据定稿 v3〉:1249）
 *
 * 姿态自证（本脚本模拟哪条真实链路）：
 *   - 执行器：官方 TS SDK 客户端 `@deepseek-ai/dsh-sdk-client`（DeepSeekHarness，
 *     与 Tauri 客户端同一 GUI-free 复跑路径，同 scripts/dsh-prompt.mjs 形态），
 *     内部 spawn dsh runtime（--profile sdk，stdio JSON-RPC）。
 *   - home：**临时 home**（mkdtemp ＋ 只 cpSync 源 `.dsh-home/profiles/sdk` ＋
 *     删副本 `.modules.yaml`；源 `.dsh-home` 只读，⛔ 不碰；381 先例形态）。
 *   - 挂载：临时 home 内 **junction** → harness/packages/plugin-s4-memory（零持久
 *     改动；3.3-b 机制事实：link 挂载下插件 import 在 harness workspace 解析）
 *     ＋ **--patch overlay**（insert entry 形态，plugin-probe/cordis.patch.yml 样本）
 *     ＋ 每臂独立 config（dbPath / chromaUrl 臂控）。
 *   - profile：sdk（0.1.5-rc.2 基线）。
 *
 * Phase：`S36_PHASE` ∈ { j0, j1j2, j3, j4, j5 }（缺省 j0）。
 * ⛔ key 纪律：本块 0 token；child env 显式剔除 DEEPSEEK_API_KEY；只判存在性。
 * 退出码：`0` 通过 ／ `1` 判据失败 ／ `2` 前置缺失 ／ `124` 看门狗
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync, cpSync, symlinkSync, readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

const HARNESS = resolve(import.meta.dirname, '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const PLUGIN_DIR = join(HARNESS, 'packages', 'plugin-s4-memory')
const EVIDENCE = process.env.S36_EVIDENCE_DIR ?? join(resolve(HARNESS, '..', '..'), '_trae-evidence', '36')
const PHASE = process.env.S36_PHASE ?? 'j0'
const OUT = join(EVIDENCE, process.env.S36_RUN ?? `run-${PHASE}`)
const KEEP_HOME = (process.env.S36_KEEP_HOME ?? '0') === '1'
const DEGRADED_MARK = '[S36-MEMORY] chroma degraded:'

const findings = []
const judge = (id, ok, detail, status = ok ? 'PASS' : 'FAIL') => {
  findings.push({ judge: id, ok, status, detail })
  console.log(`${status.padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => judge(id, true, detail, 'OBS')
const save = (name, text) => writeFileSync(join(OUT, name), text ?? '', 'utf8')
const saveJson = (name, value) => save(name, `${JSON.stringify(value, null, 2)}\n`)

// ── 共用设施 ───────────────────────────────────────────────────────────────
/** 临时 home（381 形态） */
function makeHome() {
  const home = mkdtempSync(join(tmpdir(), 'larry-36-'))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
  rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
  return home
}

/** 无 key 态 child env（显式构造） */
function childEnvOf(home) {
  const env = { ...process.env }
  delete env.DEEPSEEK_API_KEY
  env.CI = '1'
  return env
}

/**
 * 挂载插件：junction ＋ --patch overlay（insert entry，形态 = plugin-probe 样本）。
 * @returns overlay 文件路径
 */
function mountPlugin(home, tag, config) {
  const nmDir = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent')
  mkdirSync(nmDir, { recursive: true })
  symlinkSync(PLUGIN_DIR, join(nmDir, 'plugin-s4-memory'), 'junction')
  const lines = ['- insert:', `    - id: larry-s4-memory`, `      name: '@larryagent/plugin-s4-memory'`]
  if (config && Object.keys(config).length > 0) {
    lines.push('      config:')
    for (const [k, v] of Object.entries(config)) {
      const val = String(v).replaceAll('\\', '/').replaceAll("'", "''")
      lines.push(`        ${k}: '${val}'`)
    }
  }
  const overlayName = `overlay-${tag}.yml`
  save(overlayName, lines.join('\n') + '\n') // save() 内部已 join(OUT, name)，这里只给文件名
  return join(OUT, overlayName)
}

/** 跑一轮无 key 会话（带 nonce prompt），返回 { result, home } */
async function runOnce(tag, config, prompt) {
  const home = makeHome()
  const overlay = mountPlugin(home, tag, config)
  const harness = new DeepSeekHarness({
    profile: 'sdk',
    dshHome: home,
    env: childEnvOf(home),
    patches: [overlay],
    provider: 'deepseek-official',
    model: 'deepseek-flash',
    initializeTimeoutMs: 60_000,
    requestTimeoutMs: 120_000,
  })
  try {
    const result = await harness.run(prompt)
    return { result, home }
  } finally {
    try { await harness.close() } catch { /* 不掩盖主判定 */ }
    if (!KEEP_HOME) rmSync(home, { recursive: true, force: true })
    else console.log(`[36] KEEP_HOME=1 ⇒ 保留 ${tag} home：${home}`)
  }
}

/** 从事件流提取某 type 帧的 content 全文（block 数组拼接） */
function frameText(result, type) {
  return result.events
    .filter((e) => e.type === type)
    .map((e) => {
      const c = e.data?.message?.content ?? []
      return c.map((b) => (b.type === 'text' ? b.text : '')).join('')
    })
    .join('\n')
}

/** 打开装置侧 SQLite 断言句柄（node:sqlite） */
function openDb(path) {
  return new DatabaseSync(path)
}

/** stderr 捕获（J4 降级行断言用）：monkey-patch，返回还原函数与捕获数组 */
function captureStderr() {
  const captured = []
  const orig = process.stderr.write.bind(process.stderr)
  process.stderr.write = (chunk, ...rest) => {
    captured.push(typeof chunk === 'string' ? chunk : chunk.toString())
    return orig(chunk, ...rest)
  }
  return { captured, restore: () => { process.stderr.write = orig } }
}

// ── 前置 ───────────────────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const envPaths = [join(REPO, '.env'), join(HARNESS, '.env'), join(REPO, 'backend', '.env')]
const preflight = {
  when: new Date().toISOString(),
  node: process.version,
  execPath: process.execPath,
  phase: PHASE,
  evidence: OUT,
  srcSdk: SRC_SDK,
  srcSdkExists: existsSync(SRC_SDK),
  pluginDir: PLUGIN_DIR,
  pluginLibExists: existsSync(join(PLUGIN_DIR, 'lib', 'index.js')),
  keyPresentInParentEnv: process.env.DEEPSEEK_API_KEY !== undefined,
  envFilePresence: Object.fromEntries(envPaths.map((p) => [p, existsSync(p)])),
}
saveJson('J0-preflight.json', preflight)
console.log(`[36] phase=${PHASE} node=${preflight.node} key=${preflight.keyPresentInParentEnv ? '存在(⧗异常)' : '不存在'} evidence=${OUT}`)

if (!preflight.srcSdkExists || !preflight.pluginLibExists) {
  console.error('[36] ❌ 前置缺失（源 profile 或插件 lib/index.js）退出码 2')
  process.exit(2)
}

// ── 看门狗 ─────────────────────────────────────────────────────────────────
const WATCHDOG_MS = Number(process.env.S36_WATCHDOG_MS ?? 420_000)
const watchdog = setTimeout(() => {
  console.error(`[36] ⏱ 看门狗 ${WATCHDOG_MS}ms 触发（退出码 124）`)
  process.exit(124)
}, WATCHDOG_MS)
watchdog.unref?.()

/** 判定收尾 */
function finish() {
  clearTimeout(watchdog)
  const failed = findings.filter((f) => f.status === 'FAIL')
  saveJson('findings.json', { phase: PHASE, findings })
  if (failed.length > 0 || process.exitCode) {
    console.error(`[36] 判定：未通过（FAIL ×${failed.length}${failed.length ? `：${failed.map((f) => f.judge).join(', ')}` : ''}${process.exitCode ? '，exitCode=' + process.exitCode : ''}）`)
    process.exitCode = process.exitCode ?? 1
  } else {
    console.log(`[36] 判定：${PHASE} PASS（findings ×${findings.length}，证据 ${OUT}）`)
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Phase J0 · 无 key 态自证 ＋ 事件清单预检
// ══════════════════════════════════════════════════════════════════════════
async function phaseJ0() {
  const home = makeHome()
  const overlay = mountPlugin(home, 'j0', {}) // 无 config（J0 只验基线，不注入记忆配置）
  const harness = new DeepSeekHarness({
    profile: 'sdk', dshHome: home, env: childEnvOf(home), patches: [overlay],
    provider: 'deepseek-official', model: 'deepseek-flash',
    initializeTimeoutMs: 60_000, requestTimeoutMs: 120_000,
  })
  const nonce = 'DSH-3.6 J0 no-key probe: 这是一条无 key 预检消息，内容本身无意义。'
  let result
  try {
    result = await harness.run(nonce)
  } finally {
    try { await harness.close() } catch { /* 不掩盖主判定 */ }
    if (!KEEP_HOME) rmSync(home, { recursive: true, force: true })
  }

  save('J0-events.jsonl', result.events.map((e) => JSON.stringify(e)).join('\n') + '\n')
  save('J0-notifications.jsonl', result.notifications.map((n) => JSON.stringify(n)).join('\n') + '\n')

  const typeCounts = new Map()
  for (const e of result.events) typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1)
  const eventTypes = [...typeCounts.entries()].map(([type, count]) => ({ type, count }))
  saveJson('J0-event-types.json', { sessionId: result.sessionId, total: result.events.length, types: eventTypes })

  judge('J0-a-key-absent', !preflight.keyPresentInParentEnv,
    `parent env DEEPSEEK_API_KEY ${preflight.keyPresentInParentEnv ? '存在（⧗异常）' : '不存在'} + childEnv 显式 delete + 临时 home 无 .credentials.yaml`)
  const envLeak = envPaths.filter((p) => existsSync(p))
  judge('J0-b-no-dotenv', envLeak.length === 0, `cwd .env 检索（Test-Path × ${envPaths.length}）⇒ 全部不存在`)

  const hasUserMessage = typeCounts.has('user/message')
  judge('J0-c-user-message-present', hasUserMessage,
    hasUserMessage ? `事件清单含 user/message ×${typeCounts.get('user/message')}` : `清单缺 user/message ⇒ 停手回报（⛔ 不自行换事件类型凑）`)
  const hasTurnEnd = typeCounts.has('turn/end')
  judge('J0-d-turn-end-present', hasTurnEnd,
    hasTurnEnd ? `事件清单含 turn/end ×${typeCounts.get('turn/end')}` : `清单缺 turn/end ⇒ 停手回报（⛔ 不自行换事件类型凑）`)
  const assistantCount = typeCounts.get('assistant/message') ?? 0
  judge('J0-e-no-assistant-message', assistantCount === 0, `assistant/message 出现 ×${assistantCount}（期望 0）`)

  const turnEnds = result.events.filter((e) => e.type === 'turn/end')
  const kinds = turnEnds.map((e) => e.data?.reason?.kind ?? '(missing reason.kind)')
  judge('J0-f-turn-end-not-completed', kinds.length > 0 && kinds.every((k) => k !== 'completed'),
    `turn/end reason.kind = [${kinds.join(', ')}]（期望全部非 completed）`)

  const reqHeader = result.events.filter((e) => e.type === 'request/header')
  const reqContext = result.events.filter((e) => e.type === 'request/context')
  if (reqHeader.length > 0) saveJson('J0-frame-request-header.json', reqHeader)
  if (reqContext.length > 0) saveJson('J0-frame-request-context.json', reqContext)
  obs('J0-g-frames', `request/header ×${reqHeader.length}、request/context ×${reqContext.length}${reqHeader.length + reqContext.length > 0 ? '（原文已落盘）' : '（本跑未出现）'}`)

  const userMsgs = result.events.filter((e) => e.type === 'user/message')
  saveJson('J0-user-message-seqs.json', { sessionId: result.sessionId, seqs: userMsgs.map((e) => e.seq) })
  saveJson('J0-run-summary.json', {
    sessionId: result.sessionId, finalResponseLength: result.finalResponse.length,
    eventCount: result.events.length, notificationCount: result.notifications.length,
    eventTypes, turnEndKinds: kinds, findings,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// Phase J1–J2 · 事件确实被消费（nonce ＋ sourceEventSeq 交叉核对）＋ 落自己的库（反向哨兵）
// ══════════════════════════════════════════════════════════════════════════
async function phaseJ1J2() {
  // ── 活臂：dbPath 指外接证据目录 ──
  const nonce1 = `PING-j1-${Math.random().toString(36).slice(2, 10)}`
  const liveDb = join(OUT, 'larry-memory-j1.db')
  const { result: r1 } = await runOnce('j1-live', { dbPath: liveDb }, `${nonce1} 这条消息应被 S4 插件消费并落 SQLite 真相源。`)
  save('J1-live-events.jsonl', r1.events.map((e) => JSON.stringify(e)).join('\n') + '\n')

  // J1-a：库文件在
  judge('J1-a-db-exists', existsSync(liveDb), `外接库文件 ${liveDb} ${existsSync(liveDb) ? '存在' : '不存在'}`)

  // J1-b：行含 nonce ＋ sourceEventSeq 与事件流交叉核对
  let j1Row = null
  let wireSeq = null
  if (existsSync(liveDb)) {
    const db = openDb(liveDb)
    try {
      const rows = db.prepare('SELECT id, session_id, source_event_seq, content FROM memories').all()
      saveJson('J1-live-rows.json', rows)
      j1Row = rows.find((r) => String(r.content).includes(nonce1)) ?? null
      const nonceEvent = r1.events.find((e) => e.type === 'user/message' && JSON.stringify(e.data?.content ?? '').includes(nonce1))
      wireSeq = nonceEvent?.seq ?? null
      judge('J1-b-nonce-row', j1Row !== null,
        j1Row ? `库行 id=${j1Row.id} 含 nonce（content 原文已落 J1-live-rows.json）` : `库中无含 nonce 的行 ⇒ 消费失败`)
      judge('J1-c-sourceEventSeq-match', j1Row !== null && wireSeq !== null && Number(j1Row.source_event_seq) === Number(wireSeq),
        j1Row && wireSeq ? `source_event_seq=${j1Row.source_event_seq} ≡ 事件流 user/message seq=${wireSeq}` : `交叉核对缺件（库行=${j1Row !== null}，wireSeq=${wireSeq}）`)
      // J1-d：session_id 与 RunResult.sessionId 一致
      judge('J1-d-session-id-match', j1Row !== null && j1Row.session_id === r1.sessionId,
        j1Row ? `库行 session_id=${j1Row.session_id} ≡ RunResult.sessionId=${r1.sessionId}` : '缺库行')
    } finally { db.close() }
  } else {
    judge('J1-b-nonce-row', false, '库文件不存在，无法断言')
    judge('J1-c-sourceEventSeq-match', false, '库文件不存在，无法断言')
    judge('J1-d-session-id-match', false, '库文件不存在，无法断言')
  }

  // ── 哨兵臂：dbPath 指回临时 home 内 DSH 默认后端区 ──
  const nonce2 = `PING-j2-${Math.random().toString(36).slice(2, 10)}`
  const home2 = mkdtempSync(join(tmpdir(), 'larry-36-'))
  try {
    mkdirSync(join(home2, 'sessions'), { recursive: true }) // DSH 默认后端区（哨兵位置父目录预建）
    cpSync(SRC_SDK, join(home2, 'profiles', 'sdk'), { recursive: true })
    rmSync(join(home2, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
    const sentinelDb = join(home2, 'sessions', 'larry-memory-sentinel.db')
    const overlay2 = mountPlugin(home2, 'j2-sentinel', { dbPath: sentinelDb })
    const harness2 = new DeepSeekHarness({
      profile: 'sdk', dshHome: home2, env: childEnvOf(home2), patches: [overlay2],
      provider: 'deepseek-official', model: 'deepseek-flash',
      initializeTimeoutMs: 60_000, requestTimeoutMs: 120_000,
    })
    let r2
    try {
      r2 = await harness2.run(`${nonce2} 哨兵臂：这条消息应落进哨兵位置而非外接标准位。`)
    } finally {
      try { await harness2.close() } catch { /* 不掩盖主判定 */ }
    }
    save('J2-sentinel-events.jsonl', r2.events.map((e) => JSON.stringify(e)).join('\n') + '\n')

    // J2-a：哨兵位置有 nonce（阳性证据）
    let sentinelRow = null
    if (existsSync(sentinelDb)) {
      const db = openDb(sentinelDb)
      try {
        const rows = db.prepare('SELECT id, session_id, source_event_seq, content FROM memories').all()
        saveJson('J2-sentinel-rows.json', rows)
        sentinelRow = rows.find((r) => String(r.content).includes(nonce2)) ?? null
      } finally { db.close() }
    }
    judge('J2-a-sentinel-positive', sentinelRow !== null,
      sentinelRow ? `哨兵位置（home 内 sessions/larry-memory-sentinel.db）行 id=${sentinelRow.id} 含 nonce ⇒ 阳性证据成立` : `哨兵位置未找到 nonce（哨兵 db ${existsSync(sentinelDb) ? '存在但无行' : '不存在'}）`)

    // J2-b：外接标准位必须变红（本臂 nonce 不在活臂外接库里）
    const stdPosHasNonce = existsSync(liveDb)
      ? (() => { const db = openDb(liveDb); try { return db.prepare('SELECT COUNT(*) AS n FROM memories WHERE content LIKE ?').get(`%${nonce2}%`).n > 0 } finally { db.close() } })()
      : false
    judge('J2-b-std-pos-red', !stdPosHasNonce,
      stdPosHasNonce ? `哨兵臂 nonce 出现在外接标准位 ⇒ 未变红（红因被破坏）` : `外接标准位无哨兵臂 nonce ⇒ 变红 ✓（红因唯一：写到哨兵位置）`)
  } finally {
    if (!KEEP_HOME) rmSync(home2, { recursive: true, force: true })
    else console.log(`[36] KEEP_HOME=1 ⇒ 保留哨兵 home：${home2}`)
  }
}

// ══════════════════════════════════════════════════════════════════════════
// J3/J4/J5 共用器材
// ══════════════════════════════════════════════════════════════════════════
const CHROMA_EXE = process.env.S36_CHROMA_EXE
  ?? 'C:\\Users\\SuLarry\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\chroma.exe' // Python chromadb 1.5.9 自带（Rust server 1.4.4），WB 已裁第三路放行（仅本机判定场地）
const MODEL_CACHE = process.env.S36_MODEL_CACHE ?? 'D:/Code/_models'
const COLLECTION = 'larry_memories'
const RECALL_TITLE = '## LarryAgent 记忆召回'

/** SQLite 查询 helper（装置侧断言，读完即关；⛔ 断言视图 = 库文件内容，非 DB 对象已 open） */
function sqliteAll(dbPath, sql, ...args) {
  const db = openDb(dbPath)
  try { return db.prepare(sql).all(...args) } finally { db.close() }
}
function findNonceRow(dbPath, nonce) {
  return sqliteAll(dbPath, 'SELECT id, session_id, source_event_seq, content FROM memories')
    .find((r) => String(r.content).includes(nonce)) ?? null
}

/** chroma server 生命周期（判据③ 钉临时端口 ＋ host ＋ 两侧显式配置；stdout/stderr 全量落盘）
 * ⚠️ 实测：chroma.exe 默认 --host localhost 在 Windows 绑 [::1] 仅 IPv6，127.0.0.1 全连失败
 *    ⇒ 显式 --host 127.0.0.1 钉 IPv4，插件 chromaUrl 与断言侧 client 同用 127.0.0.1 */
function spawnChroma(port, dataDir, logName) {
  mkdirSync(dataDir, { recursive: true })
  const child = spawn(CHROMA_EXE, ['run', '--path', dataDir, '--host', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] })
  const chunks = []
  for (const s of [child.stdout, child.stderr]) {
    s.setEncoding('utf8')
    s.on('data', (c) => chunks.push(String(c)))
  }
  const flushLog = () => save(logName, chunks.join(''))
  return {
    async waitReady(timeoutMs = 45_000) {
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        if (child.exitCode !== null) { flushLog(); throw new Error(`chroma server 提前退出 code=${child.exitCode}（log=${logName}）`) }
        try {
          const r = await fetch(`http://127.0.0.1:${port}/api/v2/heartbeat`, { signal: AbortSignal.timeout(2000) })
          if (r.ok) return await r.json()
        } catch { /* 尚未就绪，继续轮询 */ }
        await new Promise((res) => setTimeout(res, 600))
      }
      flushLog()
      throw new Error(`chroma server ${timeoutMs}ms 未就绪（log=${logName}）`)
    },
    async stop() {
      if (child.exitCode === null) {
        child.kill()
        await new Promise((res) => { child.once('exit', res); setTimeout(res, 15_000) })
      }
      flushLog()
      return child.exitCode
    },
  }
}

/** 装置侧本地向量（与插件同源：bge-small-zh-v1.5 ＋ mean pooling ＋ normalize；模型缓存离线可跑） */
let embedPipeline = null
async function localEmbed(text) {
  if (!embedPipeline) {
    embedPipeline = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      env.cacheDir = MODEL_CACHE
      return pipeline('feature-extraction', 'Xenova/bge-small-zh-v1.5')
    })()
  }
  const extractor = await embedPipeline
  const out = await extractor([text], { pooling: 'mean', normalize: true })
  return (out.tolist())[0]
}
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2 }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// ══════════════════════════════════════════════════════════════════════════
// Phase J3 · ChromaDB 双写落库（四件：nonce 定位增量 / id≡行id / 临时端口 / 512 维指纹＋余弦）
// ══════════════════════════════════════════════════════════════════════════
async function phaseJ3() {
  if (!existsSync(CHROMA_EXE)) {
    console.error(`[36] ❌ chroma.exe 不存在：${CHROMA_EXE}（S36_CHROMA_EXE 可覆写）`)
    process.exitCode = 2
    return
  }
  const port = Number(process.env.S36_CHROMA_PORT ?? 18931)
  const server = spawnChroma(port, join(OUT, 'chroma-data'), 'J3-chroma-server.log')
  try {
    const hb = await server.waitReady()
    obs('J3-server-ready', `heartbeat=${JSON.stringify(hb)} port=${port} exe=${CHROMA_EXE}`)

    // 断言侧 client（chromadb npm → 临时 server；判据：断言视图 = chroma HTTP API get/query 返回原文，⛔ 不在插件侧「我调用了 add」上断言）
    const require36 = createRequire(import.meta.url)
    const { ChromaClient } = require36('chromadb')
    const client = new ChromaClient({ path: `http://127.0.0.1:${port}` })
    const col = await client.getOrCreateCollection({ name: COLLECTION })
    const baseGot = await col.get({ include: ['documents'] }).catch(() => null)
    const baselineCount = baseGot?.ids?.length ?? -1
    saveJson('J3-baseline.json', { collection: COLLECTION, port, baselineCount })

    // 活臂（chromaUrl 两侧显式同端口 —— 判据③ 防连错 server）
    const nonce = `PING-j3-${Math.random().toString(36).slice(2, 10)}`
    const dbPath = join(OUT, 'larry-memory-j3.db')
    const degradedLog = join(OUT, 'J3-live-degraded.log')
    const t0 = Date.now()
    const { result } = await runOnce('j3-live', {
      dbPath, chromaUrl: `http://127.0.0.1:${port}`, collectionName: COLLECTION, degradedLogPath: degradedLog,
    }, `${nonce} 这条消息应被双写进 ChromaDB 派生索引（SQLite 真相源 ＋ 512 维 bge 向量）。`)
    obs('J3-live-run', `活臂一轮完成，耗时 ${Date.now() - t0}ms`)
    save('J3-live-events.jsonl', result.events.map((e) => JSON.stringify(e)).join('\n') + '\n')

    const row = findNonceRow(dbPath, nonce)
    judge('J3-a-sqlite-row', row !== null, row ? `SQLite nonce 行 id=${row.id}（双写关联根）` : 'SQLite 无 nonce 行 ⇒ 停：chroma 断言失去关联根')
    if (!row) return

    // 取回：fire-and-forget 双写竞态 ⇒ 轮询（上限 90s，child 首次加载 bge 模型占大头）
    let entry = null
    const deadline = Date.now() + 90_000
    while (entry === null && Date.now() < deadline) {
      const got = await col.get({ include: ['embeddings', 'documents'] }).catch(() => null)
      if (got) {
        const hit = got.ids.findIndex((id) => id === String(row.id))
        if (hit >= 0 && String(got.documents[hit]).includes(nonce)) {
          entry = { id: got.ids[hit], document: String(got.documents[hit]), embedding: got.embeddings[hit] }
        }
      }
      if (entry === null) await new Promise((res) => setTimeout(res, 1_000))
    }
    saveJson('J3-chroma-entry.json', entry ?? { absent: true })
    judge('J3-b-chroma-nonce-entry', entry !== null,
      entry ? `基线条目=${baselineCount} → nonce 定位到目标条 id=${entry.id}（判据① ⛔ 无基线式 count+1）` : 'chroma 90s 内未见 nonce 条目（双写未落或落错 collection）')
    if (!entry) return

    judge('J3-c-id-equiv-rowid', entry.id === String(row.id), `chroma id=${entry.id} ≡ SQLite 行 id=${row.id}（判据② 双写关联）`)
    judge('J3-d-embedding-512', Array.isArray(entry.embedding) && entry.embedding.length === 512,
      `取回向量维度=${entry.embedding?.length}（判据④ 能力指纹；chroma 默认 384 维 MiniLM ⇒ 不传向量被免费满足是假绿，必须我方 512 维）`)

    const localVec = await localEmbed(row.content)
    const cos = cosine(localVec, entry.embedding)
    judge('J3-e-cosine-ge-0.9999', cos >= 0.9999, `同文本本地向量 vs 存储向量 cos=${cos.toPrecision(6)} ≥ 0.9999（DSH-2.5 实测漂移 2.2e-7 量级）—— 判据④ 更强做法`)
    if (cos < 0.9999) saveJson('J3-cosine-debug.json', { localFirst5: localVec.slice(0, 5), storedFirst5: entry.embedding.slice(0, 5) })

    const q = await col.query({ queryEmbeddings: [localVec], nResults: 1 }).catch(() => null)
    obs('J3-f-self-retrieval', q ? `nonce 原文自检索 top-1 id=${q.ids?.[0]?.[0]}（旁证，判别力弱不判红）` : '自检索调用失败（旁证缺失，不判红）')

    const liveDegraded = existsSync(degradedLog) ? readFileSync(degradedLog, 'utf8') : ''
    const liveLines = liveDegraded.split('\n').filter((l) => l.includes(DEGRADED_MARK))
    obs('J3-g-live-no-degraded', `活臂降级行 ×${liveLines.length}（期望 0；J4 活臂锚预证）`)
  } finally {
    const exit = await server.stop()
    obs('J3-server-stopped', `chroma server 收尾 exit=${exit}（判据：server 与库路径均临时，收尾清理）`)
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Phase J4 · 降级行为双锚（V6 改向：活臂无降级行 ／ 停臂降级行在；V7 时间界软阈值）
// ══════════════════════════════════════════════════════════════════════════
async function phaseJ4() {
  if (!existsSync(CHROMA_EXE)) {
    console.error(`[36] ❌ chroma.exe 不存在：${CHROMA_EXE}（S36_CHROMA_EXE 可覆写）`)
    process.exitCode = 2
    return
  }
  const port = Number(process.env.S36_CHROMA_PORT ?? 18932)
  const url = `http://127.0.0.1:${port}`

  // ── 活臂（server 在）：①不阻塞 ②真相源在 ③无降级行（反向日志哨兵）──
  const server = spawnChroma(port, join(OUT, 'chroma-data-j4'), 'J4-chroma-server.log')
  let liveMs = null
  try {
    await server.waitReady()
    const nonceL = `PING-j4live-${Math.random().toString(36).slice(2, 10)}`
    const liveDb = join(OUT, 'larry-memory-j4-live.db')
    const liveLog = join(OUT, 'J4-live-degraded.log')
    const t0 = Date.now()
    const { result: rLive } = await runOnce('j4-live', {
      dbPath: liveDb, chromaUrl: url, collectionName: COLLECTION, degradedLogPath: liveLog,
    }, `${nonceL} 活臂：chroma 可达，应双写成功且无任何降级行。`)
    liveMs = Date.now() - t0
    save('J4-live-events.jsonl', rLive.events.map((e) => JSON.stringify(e)).join('\n') + '\n')

    judge('J4-a-live-turn-end', rLive.events.some((e) => e.type === 'turn/end'), `活臂终局到达（耗时 ${liveMs}ms ⇒ ① 不阻塞）`)
    const liveRow = findNonceRow(liveDb, nonceL)
    judge('J4-b-live-sqlite-row', liveRow !== null, liveRow ? `活臂 SQLite nonce 行 id=${liveRow.id} ⇒ ② 真相源在` : '活臂 SQLite 无 nonce 行')
    const liveDegraded = existsSync(liveLog) ? readFileSync(liveLog, 'utf8') : ''
    const liveLines = liveDegraded.split('\n').filter((l) => l.includes(DEGRADED_MARK))
    judge('J4-c-live-no-degraded', liveLines.length === 0,
      `活臂降级行 ×${liveLines.length}（${existsSync(liveLog) ? '日志文件在但' : '日志文件不存在，'}期望 0 ⇒ ③ 反向日志哨兵成立`)
  } finally {
    await server.stop()
  }

  // ── 停 server，取证「确已死」（停臂有效性前置）──
  let downEvd = ''
  try {
    const r = await fetch(`${url}/api/v2/heartbeat`, { signal: AbortSignal.timeout(3000) })
    downEvd = `heartbeat 仍通（status=${r.status}）⇒ server 未死`
    judge('J4-server-down-proven', false, downEvd)
  } catch (err) {
    downEvd = `heartbeat 拒绝：${err?.cause?.code ?? err?.message}`
    judge('J4-server-down-proven', true, `${downEvd}（V7 诚实收窄：本臂只覆盖 connection-refused 快失败，不测 hung-server）`)
  }
  save('J4-server-down.txt', downEvd + '\n')

  // ── 停臂（server 死）：①不阻塞 ②真相源在 ③降级行在 ──
  const nonceD = `PING-j4down-${Math.random().toString(36).slice(2, 10)}`
  const downDb = join(OUT, 'larry-memory-j4-down.db')
  const downLog = join(OUT, 'J4-down-degraded.log')
  const t1 = Date.now()
  const { result: rDown } = await runOnce('j4-down', {
    dbPath: downDb, chromaUrl: url, collectionName: COLLECTION, degradedLogPath: downLog,
  }, `${nonceD} 停臂：chroma 不可达，对话不得阻塞，SQLite 仍写，向量侧必须降级留痕。`)
  const downMs = Date.now() - t1
  save('J4-down-events.jsonl', rDown.events.map((e) => JSON.stringify(e)).join('\n') + '\n')

  judge('J4-d-down-turn-end', rDown.events.some((e) => e.type === 'turn/end'),
    `停臂终局到达 ⇒ ① 不阻塞（耗时 ${downMs}ms；活臂 ${liveMs}ms，比值 ${(liveMs ? (downMs / liveMs).toFixed(2) : '?')}×）`)
  const downRow = findNonceRow(downDb, nonceD)
  judge('J4-e-down-sqlite-row', downRow !== null, downRow ? `停臂 SQLite nonce 行 id=${downRow.id} ⇒ ② 真相源不受损（fail-open 只在向量侧）` : '停臂 SQLite 无 nonce 行')
  const downDegraded = existsSync(downLog) ? readFileSync(downLog, 'utf8') : ''
  const downLines = downDegraded.split('\n').filter((l) => l.includes(DEGRADED_MARK))
  judge('J4-f-down-degraded-line', downLines.length >= 1, `停臂降级行 ×${downLines.length} ⇒ ③ 日志有降级记录（V6 停臂侧；通道 = 插件日志文件，SDK pipe 吞 child stderr 故 stderr 通道装置不可达）`)
  if (downRow && downLines.length >= 1) {
    const hasRow = downLines.some((l) => l.includes(`row=${downRow.id}`))
    judge('J4-g-degraded-row-anchor', hasRow, `降级行锚 row=${downRow.id} ≡ SQLite 行 id（关联到具体失败条目）`)
    // V6 失败特征「如 URL／errno」：chromadb client 的 ChromaConnectionError 吞掉 cause 链
    // （实测 cause=undefined 无 code）⇒ 降级行带 url=（与停臂 config 同款）＋ 连接失败固定文案；
    // child 侧裸 errno 不可得，由装置侧同端口 J4-server-down-proven（ECONNREFUSED）互补取证
    const featureOk = downLines.some((l) => l.includes(`url=${url}`) && /Failed to connect to chromadb/i.test(l))
    judge('J4-h-degraded-failure-feature', featureOk,
      `降级行含本次失败特征 url=${url} ＋「Failed to connect to chromadb」（连接失败文案）；errno 被 client 包装层吞没 ⇒ 由 J4-server-down-proven 同端口裸 ECONNREFUSED 互补`)
  } else {
    judge('J4-g-degraded-row-anchor', false, '缺降级行或库行，无法锚定')
    judge('J4-h-degraded-failure-feature', false, '缺降级行，无法验失败特征')
  }
  obs('J4-i-failure-path-only', '降级行唯一写点 = 插件 doubleWrite catch（plugin-s4-memory/src/index.ts，唯一匹配串只在该分支出现）；活臂同通道零行对照（J4-c）⇒ 只出自失败路径（⛔ 无启动期无条件打印形态）')
  if (liveMs && downMs > liveMs * 10 + 30_000) {
    obs('J4-time-budget-warn', `V7 软报警：停臂 ${downMs}ms 超活臂 ${liveMs}ms 一个数量级（不判红）`)
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Phase J5 · 召回注入面（WB 裁定：断言帧 = system/message；V10 双臂 ＋ context 面附证）
// ══════════════════════════════════════════════════════════════════════════
async function phaseJ5() {
  // ── 正向臂：预置库（装置侧 INSERT nonce 行——写入路径归 J1，本判据只验装配产物）──
  const nonce = `PING-j5-${Math.random().toString(36).slice(2, 10)}`
  const seedDb = join(OUT, 'larry-memory-j5-seeded.db')
  {
    const db = openDb(seedDb)
    try {
      db.exec(`CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    source_event_seq INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_session_seq ON memories(session_id, source_event_seq);`)
      db.prepare('INSERT INTO memories(session_id, source_event_seq, content) VALUES(?,?,?)')
        .run('j5-seed-session', 0, `${nonce} J5 预置行：注入面正向臂应把此行渲染进装配产物。`)
    } finally { db.close() }
  }
  const posPrompt = '请只回复两个字：收到。本句不含任何代号或标记。' // V10 ①：B 会话自身输入不得含 nonce
  const { result: rPos } = await runOnce('j5-positive', { dbPath: seedDb }, posPrompt)
  const posFrames = rPos.events.filter((e) => e.type === 'system/message')
  saveJson('J5-positive-system-message.json', posFrames)
  const posText = frameText(rPos, 'system/message')
  judge('J5-a-positive-frame-contains-nonce', posText.includes(nonce),
    `system/message 帧 ×${posFrames.length}，原文含 nonce 逐字 ⇒ 召回注入块出现在 J0 定帧（WB 裁定断言帧）`)
  judge('J5-b-positive-block-title', posText.includes(RECALL_TITLE), `帧含召回块标题（块为空字符串即红 —— 此处非空）`)
  const ctxText = rPos.events
    .filter((e) => e.type === 'user/message' && e.data?.source?.kind === 'plugin')
    .map((e) => (e.data?.content ?? []).map((b) => (b.type === 'text' ? b.text : '')).join(''))
    .join('\n')
  obs('J5-c-context-face-obs', ctxText.includes(nonce)
    ? 'context 面（synthetic user/message，source.kind=plugin）亦含 nonce ⇒ 双面注册同源成立（附证）'
    : 'context 面未见 nonce（synthetic user/message 帧缺——附证缺，不判红，如实记录）')

  // ── 负向臂：全新空库 → 注入块不得含 nonce（结果态可分）──
  const negDb = join(OUT, 'larry-memory-j5-empty.db')
  const negPrompt = '请只回复两个字：明白。本句同样不含任何代号或标记。'
  const { result: rNeg } = await runOnce('j5-negative', { dbPath: negDb }, negPrompt)
  const negFrames = rNeg.events.filter((e) => e.type === 'system/message')
  saveJson('J5-negative-system-message.json', negFrames)
  const negText = frameText(rNeg, 'system/message')
  judge('J5-d-negative-frame-no-nonce', !negText.includes(nonce),
    `空库（全新 DB 文件）⇒ system/message 帧不含 nonce；两臂 prompt 均不含 nonce 且不复用会话 ⇒ 判别力成立（V10 ①）`)
  judge('J5-e-negative-no-block', !negText.includes(RECALL_TITLE), `空库 ⇒ 空贡献（无召回块）`)
}

try {
  if (PHASE === 'j0') await phaseJ0()
  else if (PHASE === 'j1j2') await phaseJ1J2()
  else if (PHASE === 'j3') await phaseJ3()
  else if (PHASE === 'j4') await phaseJ4()
  else if (PHASE === 'j5') await phaseJ5()
  else {
    console.error(`[36] ❌ 未实现的 phase：${PHASE}（本版实现 j0 / j1j2 / j3 / j4 / j5）`)
    process.exitCode = 2
  }
} catch (err) {
  save('error.txt', `${err?.stack ?? String(err)}\n`)
  console.error(`[36] ❌ ${PHASE} 运行异常：${err?.message ?? err}`)
  process.exitCode = 1
} finally {
  finish()
}
