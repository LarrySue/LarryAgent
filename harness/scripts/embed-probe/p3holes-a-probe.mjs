#!/usr/bin/env node
/**
 * 三处补洞 · A 组（测试场地隔离③）取证探针（A-1…A-4）
 *
 * 判据：
 *   A-1  profile 配置里 dbPath 不含盘符（[A-Za-z]:[\/]）
 *   A-2  不设 DSH_HOME ⇒ 库落默认 home（~/.dsh），可建库、可召回
 *   A-3  DSH_HOME=<临时> ⇒ 库落新 home；真库 mtime＋sha256 跑前跑后不变
 *   A-4  配置逃出 home（`${DSH_HOME}/../outside.db`）⇒ fail（stderr 断言行），不建库
 *
 * 全部在仓库外临时 home（除 A-2 的默认 home 臂）；不写真库；退出码 0/1/2。
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const DEPLOYED = join(REPO, '.dsh-home', 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-s4-memory')
const CONFIG = join(REPO, '.dsh-home', 'profiles', 'sdk', 'cordis.patch.yml')
const REAL_DB = join(REPO, '.dsh-home', 'larry-memory.db')
const MODEL_ID = 'Xenova/bge-small-zh-v1.5'
const MODEL_DIR = 'D:/Code/_models'
const RECALL_NAME = 'larry-memory-recall'
const EVIDENCE = process.env.P3HOLES_A_EVIDENCE ?? 'D:/Code/_trae-evidence/patch-3holes'
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'p3holes-a-'))
const NL = String.fromCharCode(10)

const SESSION_ROWS = 'session-391-0a898fc33f8e'
const SESSION_QUERY = 'session-p3holes-a'
const QUERY = 'P3H 查询：猫喜欢在有阳光的窗台边睡觉，怎么叫都不理人。'
const SEED = [
  { text: 'P3H-A1：猫在窗台上晒太阳', cos: 0.95 },
  { text: 'P3H-A2：狗在门口打盹', cos: 0.80 },
]

mkdirSync(EVIDENCE, { recursive: true })
const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id}  ${detail}`)
}
const save = (name, text) => writeFileSync(join(EVIDENCE, name), text ?? '', 'utf8')
const saveJson = (name, value) => save(name, `${JSON.stringify(value, null, 2)}${NL}`)
const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const fingerprint = (path) => {
  if (!existsSync(path)) return null
  const stat = statSync(path)
  return { path, sha256: sha256File(path), size: stat.size, mtimeMs: stat.mtimeMs, mtime: stat.mtime.toISOString() }
}

function makeHome(tag) {
  return mkdtempSync(join(TEMP_ROOT, `${tag}-`))
}
function logLines(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8').split(NL).filter((line) => line.length > 0)
}
function makeFakeCtx() {
  const listeners = new Map()
  const contexts = []
  const sections = []
  const disposers = []
  return {
    listeners,
    contexts,
    sections,
    on(name, fn) {
      if (!listeners.has(name)) listeners.set(name, [])
      listeners.get(name).push(fn)
      return () => {}
    },
    effect(fn) {
      const disposer = fn()
      if (typeof disposer === 'function') disposers.push(disposer)
      return () => {}
    },
    systemPrompt: {
      context(def) { contexts.push(def); return () => {} },
      section(def) { sections.push(def); return () => {} },
      getContextOrder() { return 500 },
    },
    dispose() {
      for (const disposer of disposers.splice(0)) {
        try { disposer() } catch { /* 临时库关闭失败不判红 */ }
      }
    },
  }
}
function applyPlugin(plugin, config) {
  const ctx = makeFakeCtx()
  plugin.apply(ctx, config)
  return ctx
}
function emitUserMessage(ctx, sessionId, seq, text) {
  for (const fn of ctx.listeners.get('session/event') ?? []) {
    fn({ id: sessionId }, { type: 'user/message', seq, data: { content: [{ type: 'text', text }] } })
  }
}
async function runAssembly(ctx, sessionId) {
  const provider = ctx.contexts.find((c) => c.name === RECALL_NAME)
  if (!provider) throw new Error('recall context provider missing')
  const context = { agent: { session: { id: sessionId } } }
  const fallback = typeof provider.text === 'function' ? provider.text(context) : provider.text
  let current = {
    sections: [],
    contexts: fallback ? [{ name: RECALL_NAME, text: fallback }] : [],
    tools: [],
    variables: {},
  }
  for (const fn of ctx.listeners.get('system-prompt/assemble') ?? []) {
    current = await fn(current, context, async () => current)
  }
  return current.contexts.find((c) => c.name === RECALL_NAME)?.text ?? ''
}
function normalize(vec) {
  let sum = 0
  for (const x of vec) sum += x * x
  const norm = Math.sqrt(sum)
  return norm === 0 ? vec.map(() => 0) : vec.map((x) => x / norm)
}
function orthogonalTo(q, seed) {
  let state = seed >>> 0
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff - 0.5
  }
  const r = new Array(q.length).fill(0).map(() => next())
  let dot = 0
  for (let i = 0; i < q.length; i++) dot += r[i] * q[i]
  return normalize(r.map((x, i) => x - dot * q[i]))
}
function vectorWithCosine(qInput, cosine, seed) {
  const q = normalize(qInput)
  const orth = orthogonalTo(q, seed)
  const s = Math.sqrt(Math.max(0, 1 - cosine * cosine))
  return normalize(q.map((x, i) => cosine * x + s * orth[i]))
}
function seedRows(dbPath, rows) {
  const db = new DatabaseSync(dbPath)
  try {
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO memories(session_id, source_event_seq, content, created_at, embedding) VALUES(?,?,?,?,?)',
    )
    for (const row of rows) stmt.run(row.sessionId, row.seq, row.content, '2026-11-01 00:00:00', row.embedding)
  } finally {
    db.close()
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 前置
// ══════════════════════════════════════════════════════════════════════════
const deployedIndex = join(DEPLOYED, 'lib', 'index.js')
if (!existsSync(deployedIndex) || !existsSync(CONFIG)) {
  console.error('[P3HOLES-A] ❌ 前置缺失：部署件或 profile 配置不存在')
  saveJson('findings-A.json', findings)
  process.exit(2)
}
const plugin = await import(pathToFileURL(deployedIndex).href)
const recall = await import(pathToFileURL(join(DEPLOYED, 'lib', 'recall.js')).href)
const embedding = await import(pathToFileURL(join(DEPLOYED, 'lib', 'embedding.js')).href)
const MODEL = embedding.createEmbedder({ modelId: MODEL_ID, cacheDir: MODEL_DIR })
const queryVector = await MODEL.encode(QUERY)

const configText = readFileSync(CONFIG, 'utf8')
const dbPathLine = configText.split(NL).find((line) => line.trim().startsWith('dbPath:')) ?? ''
const rawDbPath = (/'([^']*)'/.exec(dbPathLine) ?? [null, ''])[1]
const realBefore = fingerprint(REAL_DB)

// A-1 配置里不再出现盘符
const hasDrive = /[A-Za-z]:[\\/]/.test(dbPathLine)
saveJson('A-1-config.json', { dbPathLine, rawDbPath, hasDrive })
judge('A-1-no-drive-letter', dbPathLine.length > 0 && rawDbPath.length > 0 && !hasDrive,
  `dbPath 行=${dbPathLine.trim()}；含盘符=${hasDrive}`)

// A-2 默认 home：不设 DSH_HOME ⇒ ~/.dsh/larry-memory.db，可建库、可召回
const defaultHome = join(homedir(), '.dsh')
delete process.env.DSH_HOME
const a2Home = mkdtempSync(join(TEMP_ROOT, 'a2-logs-'))
const a2Ctx = applyPlugin(plugin, {
  dbPath: rawDbPath,
  modelCacheDir: MODEL_DIR,
  degradedLogPath: join(a2Home, 'degraded.log'),
  recallLimit: 6,
  recallDelta: 0.20,
})
const a2Db = join(defaultHome, 'larry-memory.db')
const a2Vectors = SEED.map((seed, i) => vectorWithCosine(queryVector, seed.cos, i + 1))
let a2Text = ''
try {
  seedRows(a2Db, SEED.map((seed, i) => ({
    sessionId: SESSION_ROWS,
    seq: i + 1,
    content: seed.text,
    embedding: recall.encodeVector(a2Vectors[i]),
  })))
  emitUserMessage(a2Ctx, SESSION_QUERY, 1, QUERY)
  a2Text = await runAssembly(a2Ctx, SESSION_QUERY)
} finally {
  a2Ctx.dispose()
}
save('A-2-default-home-context.txt', a2Text)
const a2Ok = existsSync(a2Db) && a2Text.includes('语义 top-') && a2Text.includes(SEED[0].text)
judge('A-2-default-home', a2Ok,
  `不设 DSH_HOME ⇒ 库=${a2Db} 存在=${existsSync(a2Db)}；召回含目标＝${a2Text.includes(SEED[0].text)}；标题语义＝${a2Text.includes('语义 top-')}`)

// A-3 换 home ⇒ 库落新 home；真库不动
const a3Home = makeHome('a3-home')
process.env.DSH_HOME = a3Home
const a3Ctx = applyPlugin(plugin, {
  dbPath: rawDbPath,
  modelCacheDir: MODEL_DIR,
  degradedLogPath: join(a3Home, 'degraded.log'),
  recallLimit: 6,
  recallDelta: 0.20,
})
a3Ctx.dispose()
const a3Db = join(a3Home, 'larry-memory.db')
const realAfterSwap = fingerprint(REAL_DB)
const realUnchanged = realBefore && realAfterSwap
  && realBefore.sha256 === realAfterSwap.sha256
  && realBefore.mtimeMs === realAfterSwap.mtimeMs
  && realBefore.size === realAfterSwap.size
saveJson('A-3-swap-home.json', { a3Home, a3Db, a3DbExists: existsSync(a3Db), realBefore, realAfter: realAfterSwap, realUnchanged })
judge('A-3-swap-home', existsSync(a3Db) && realUnchanged,
  `DSH_HOME=<tmp> ⇒ 库=${a3Db} 存在=${existsSync(a3Db)}；真库 sha/mtime/size 跑前跑后不变=${realUnchanged}`)

// A-4 逃出 home ⇒ fail（stderr 断言行），不建库
const a4Home = makeHome('a4-home')
process.env.DSH_HOME = a4Home
const escapePath = join(a4Home, '..', 'outside.db')
let a4Error = null
const a4Ctx = makeFakeCtx()
try {
  plugin.apply(a4Ctx, {
    dbPath: '${DSH_HOME}/../outside.db',
    modelCacheDir: MODEL_DIR,
    degradedLogPath: join(a4Home, 'degraded.log'),
  })
} catch (err) {
  a4Error = err instanceof Error ? err.message : String(err)
}
a4Ctx.dispose()
const a4Denied = a4Error !== null && a4Error.includes(plugin.OUTSIDE_HOME_DENY_MARK)
const a4Created = existsSync(escapePath)
saveJson('A-4-escape-denied.json', { a4Home, escapePath, error: a4Error, denied: a4Denied, escapeDbExists: a4Created })
judge('A-4-escape-denied', a4Denied && !a4Created,
  `配置 \${DSH_HOME}/../outside.db ⇒ 抛错=${a4Error !== null}；含断言行=${a4Denied}；逃出路径建库=${a4Created}（期望 false）`)

saveJson('A-findings.json', findings)
const failed = findings.filter((item) => !item.ok)
console.log(`${NL}summary: ${findings.length - failed.length}/${findings.length} PASS；证据 ${EVIDENCE}`)
rmSync(TEMP_ROOT, { recursive: true, force: true })
process.exit(failed.length === 0 ? 0 : 1)
