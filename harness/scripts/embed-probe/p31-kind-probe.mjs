#!/usr/bin/env node
/**
 * ③.1 写侧挂点 ＋ B 案表结构 · 取证探针（L-1…L-8）
 *
 * 判据（权威 = exchange/log-trae.md 2026-11-03 21:20 派发稿）：
 *   L-1 表结构：kind TEXT NOT NULL 且无 DEFAULT；老库有数据走重建、空库直接建、幂等
 *   L-2 部分唯一索引：WHERE kind='transcript'；两条同 seq 的 memory 行都要能插入（负证）
 *   L-3 流水写入：新 user/message 行 kind='transcript' 且非 NULL
 *   L-4 摘要写入路径：程序内调用插入函数 ⇒ 库里出现 kind='memory' 行（内容＋来源会话）
 *   L-5 负证：插件代码零 backend 路由引用；本探针全程未发生 /api/memory 调用
 *   L-6 流水不算向量：新 transcript 行 embedding 增量为 0；回填查询只挑 memory
 *   L-7 诚实边界：本探针不声称「长期记忆已可用」
 *   L-8 禁改召回：selectRecentFiltered / selectVectorRows 的 SQL 未被改动
 *
 * 场地：全部在临时 home；⛔ 不碰真实 ~/.dsh。模型缓存指向空目录（不加载 317s 模型）。
 * 退出码：0 全绿 ／ 1 有红 ／ 2 前置缺失。
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const PLUGIN = join(HARNESS, 'packages', 'plugin-s4-memory')
const DEPLOYED = join(REPO, '.dsh-home', 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-s4-memory')
const EVIDENCE = process.env.P31_EVIDENCE_DIR ?? 'D:/Code/_trae-evidence/p31-kind'
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'p31-kind-'))
const KEEP_TEMP = (process.env.P31_KEEP_TEMP ?? '0') === '1'
const NL = String.fromCharCode(10)

mkdirSync(EVIDENCE, { recursive: true })
const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => {
  findings.push({ judge: id, ok: true, detail })
  console.log(`OBS   ${id}  ${detail}`)
}
const save = (name, text) => writeFileSync(join(EVIDENCE, name), text ?? '', 'utf8')
const saveJson = (name, value) => save(name, `${JSON.stringify(value, null, 2)}${NL}`)
const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function makeHome(tag) { return mkdtempSync(join(TEMP_ROOT, `${tag}-`)) }
function dbAll(path, sql, ...params) {
  const db = new DatabaseSync(path)
  try { return db.prepare(sql).all(...params) } finally { db.close() }
}
function dbGet(path, sql, ...params) {
  const db = new DatabaseSync(path)
  try { return db.prepare(sql).get(...params) } finally { db.close() }
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
function columnOf(cols, name) { return cols.find((c) => c.name === name) }
function countRows(dbPath) { return Number(dbGet(dbPath, 'SELECT COUNT(*) AS n FROM memories').n) }
function kindCount(dbPath, kind) {
  return Number(dbGet(dbPath, "SELECT COUNT(*) AS n FROM memories WHERE kind=?", kind).n)
}

// ══════════════════════════════════════════════════════════════════════════
// 前置：部署件同步（index.js ＋ write.js 同 sha）
// ══════════════════════════════════════════════════════════════════════════
const srcIndex = join(PLUGIN, 'lib', 'index.js')
const depIndex = join(DEPLOYED, 'lib', 'index.js')
const srcWrite = join(PLUGIN, 'lib', 'write.js')
const depWrite = join(DEPLOYED, 'lib', 'write.js')
if (![srcIndex, depIndex, srcWrite, depWrite].every((p) => existsSync(p))) {
  console.error('[P31] ❌ 前置缺失：插件 lib（含 write.js）不存在（先 build＋同步部署件）')
  saveJson('findings.json', findings)
  process.exit(2)
}
const deploySame = sha256File(srcIndex) === sha256File(depIndex) && sha256File(srcWrite) === sha256File(depWrite)
saveJson('L0-deploy.json', {
  srcIndexSha: sha256File(srcIndex), depIndexSha: sha256File(depIndex),
  srcWriteSha: sha256File(srcWrite), depWriteSha: sha256File(depWrite), deploySame,
})
judge('L0-deploy-sync', deploySame, `index.js＋write.js 源/部署件同 sha=${deploySame}`)
if (!deploySame) {
  console.error('[P31] ❌ 部署件未同步：停手')
  saveJson('findings.json', findings)
  process.exit(2)
}

const plugin = await import(pathToFileURL(depIndex).href)
const writer = await import(pathToFileURL(depWrite).href)
const pluginText = readFileSync(depIndex, 'utf8') + NL + readFileSync(depWrite, 'utf8')

// 空模型目录 ⇒ embedder.ready()=false ⇒ 不触发 317s 预取/回填（本单不依赖模型）
const emptyCacheParent = makeHome('empty-cache')
const emptyCacheDir = join(emptyCacheParent, 'cache')

// ══════════════════════════════════════════════════════════════════════════
// L-1a · 空库：直接建表带 kind
// ══════════════════════════════════════════════════════════════════════════
const homeEmpty = makeHome('empty-db')
process.env.DSH_HOME = homeEmpty
const emptyDb = join(homeEmpty, 'memory.db')
const ctxEmpty = applyPlugin(plugin, { dbPath: emptyDb, modelCacheDir: emptyCacheDir, injectContext: false, injectSection: false })
try {
  const cols = dbAll(emptyDb, 'PRAGMA table_info(memories)')
  const kind = columnOf(cols, 'kind')
  const idx = dbGet(emptyDb, "SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_memories_session_seq'")
  saveJson('L1a-empty.json', { columns: cols, indexSql: idx?.sql ?? null, rows: countRows(emptyDb) })
  judge('L-1a-empty-db', Boolean(kind) && Number(kind.notnull) === 1 && kind.dflt_value === null && countRows(emptyDb) === 0,
    `kind 存在=${Boolean(kind)} notnull=${kind?.notnull} dflt=${JSON.stringify(kind?.dflt_value)} 行数=${countRows(emptyDb)}`)
  judge('L-2-index-partial-empty', Boolean(idx?.sql) && /WHERE\s+kind\s*=\s*'transcript'/i.test(idx.sql),
    `索引 SQL 含 WHERE kind='transcript'=${Boolean(idx?.sql) && /WHERE\s+kind\s*=\s*'transcript'/i.test(idx.sql)}`)
} finally { ctxEmpty.dispose() }

// ══════════════════════════════════════════════════════════════════════════
// L-1b · 老库有数据（无 embedding、无 kind、旧非部分索引）：重建 + 回填 transcript
// ══════════════════════════════════════════════════════════════════════════
const homeOld = makeHome('old-db')
process.env.DSH_HOME = homeOld
const oldDb = join(homeOld, 'memory.db')
{
  const db = new DatabaseSync(oldDb)
  try {
    db.exec(`
      CREATE TABLE memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        source_event_seq INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE UNIQUE INDEX idx_memories_session_seq ON memories(session_id, source_event_seq);
    `)
    const ins = db.prepare('INSERT INTO memories(session_id, source_event_seq, content) VALUES(?,?,?)')
    ins.run('old-a', 1, '老库第一行：用户消息流水')
    ins.run('old-a', 2, '老库第二行：另一条用户消息')
    ins.run('old-b', 1, '老库第三行：另一个会话')
  } finally { db.close() }
}
const before = dbAll(oldDb, 'SELECT id, content FROM memories ORDER BY id')
const colsBefore = dbAll(oldDb, 'PRAGMA table_info(memories)')
const ctxOld = applyPlugin(plugin, { dbPath: oldDb, modelCacheDir: emptyCacheDir, injectContext: false, injectSection: false })
let after = []
let colsAfter = []
try {
  after = dbAll(oldDb, 'SELECT id, content, kind, embedding FROM memories ORDER BY id')
  colsAfter = dbAll(oldDb, 'PRAGMA table_info(memories)')
  const idx = dbGet(oldDb, "SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_memories_session_seq'")
  const kind = columnOf(colsAfter, 'kind')
  const sameRows = JSON.stringify(before) === JSON.stringify(after.map((r) => ({ id: r.id, content: r.content })))
  saveJson('L1b-old-db.json', { colsBefore, colsAfter, indexSql: idx?.sql ?? null, before, after })
  judge('L-1b-columns', colsAfter.length === colsBefore.length + 2 && Boolean(kind) && Number(kind.notnull) === 1 && kind.dflt_value === null,
    `列数 ${colsBefore.length} → ${colsAfter.length}；kind notnull=${kind?.notnull} dflt=${JSON.stringify(kind?.dflt_value)}`)
  judge('L-1b-rows-preserved', sameRows && after.length === before.length,
    `重建前后 ${before.length} 行 id/content ${sameRows ? '全同' : '不同'}，行数 ${after.length}`)
  judge('L-1b-backfill-transcript', after.every((r) => r.kind === 'transcript' && r.embedding === null),
    `老行 kind 全为 transcript=${after.every((r) => r.kind === 'transcript')}，embedding 全 NULL=${after.every((r) => r.embedding === null)}`)
  judge('L-2-index-partial-old', Boolean(idx?.sql) && /WHERE\s+kind\s*=\s*'transcript'/i.test(idx.sql),
    `旧非部分索引已替换=${Boolean(idx?.sql) && /WHERE\s+kind\s*=\s*'transcript'/i.test(idx.sql)}`)
} finally { ctxOld.dispose() }

// L-1c · 幂等：同一库再 apply 一次，行数/结构不变
const ctxAgain = applyPlugin(plugin, { dbPath: oldDb, modelCacheDir: emptyCacheDir, injectContext: false, injectSection: false })
try {
  const colsAgain = dbAll(oldDb, 'PRAGMA table_info(memories)')
  judge('L-1c-idempotent', countRows(oldDb) === before.length && colsAgain.length === colsAfter.length,
    `二次 apply 后行数=${countRows(oldDb)}（期望 ${before.length}），列数=${colsAgain.length}`)
} finally { ctxAgain.dispose() }

// ══════════════════════════════════════════════════════════════════════════
// L-2 负证：memory 同 seq 两条都成功；transcript 同 seq 第二条被唯一索引拦
//   ⚠️ 用裸 INSERT（⛔ 不用 insertRow 的 OR IGNORE，否则冲突会被吞掉）
// ══════════════════════════════════════════════════════════════════════════
let memoryInsertFail = ''
let transcriptConflict = false
{
  const db = new DatabaseSync(oldDb)
  try {
    const insMem = db.prepare("INSERT INTO memories(session_id, source_event_seq, content, kind) VALUES(?,?,?,'memory')")
    try {
      insMem.run('summary-src', 7, '摘要 A：同一来源事件的第一条')
      insMem.run('summary-src', 7, '摘要 B：同一来源事件的第二条')
    } catch (err) { memoryInsertFail = String(err?.message ?? err) }
    const insTr = db.prepare("INSERT INTO memories(session_id, source_event_seq, content, kind) VALUES(?,?,?,'transcript')")
    insTr.run('dup-src', 9, '流水 1')
    try { insTr.run('dup-src', 9, '流水 2') } catch { transcriptConflict = true }
  } finally { db.close() }
}
const memRows = dbAll(oldDb, "SELECT id, session_id, source_event_seq, content FROM memories WHERE kind='memory' ORDER BY id")
saveJson('L2-negative.json', { memoryRows: memRows, memoryInsertFail, transcriptConflict })
judge('L-2-negative-memory-not-blocked', memRows.length === 2 && memoryInsertFail === '',
  `两条 memory 同 seq 均插入成功=${memRows.length === 2}；异常=${memoryInsertFail || '无'}`)
judge('L-2-negative-transcript-still-unique', transcriptConflict,
  `transcript 同 seq 第二条被拦=${transcriptConflict}（对照组：唯一约束确实还在生效）`)

// ══════════════════════════════════════════════════════════════════════════
// L-3 ＋ L-6 · 流水写入带 kind；新流水不写 embedding
// ══════════════════════════════════════════════════════════════════════════
const homeFlow = makeHome('flow')
process.env.DSH_HOME = homeFlow
const flowDb = join(homeFlow, 'memory.db')
const ctxFlow = applyPlugin(plugin, { dbPath: flowDb, modelCacheDir: emptyCacheDir, injectContext: false, injectSection: false })
try {
  for (let i = 1; i <= 3; i++) emitUserMessage(ctxFlow, 'session-flow', i, `流水样本 ${i}：这是一条真实用户消息。`)
  await sleep(300)
  const rows = dbAll(flowDb, 'SELECT id, session_id, source_event_seq, content, kind, embedding FROM memories ORDER BY id')
  const transcriptCount = kindCount(flowDb, 'transcript')
  const embeddedTranscript = Number(dbGet(flowDb, "SELECT COUNT(*) AS n FROM memories WHERE kind='transcript' AND embedding IS NOT NULL").n)
  saveJson('L3-L6-flow.json', { rows, transcriptCount, embeddedTranscript })
  judge('L-3-transcript-kind', rows.length === 3 && rows.every((r) => r.kind === 'transcript' && r.session_id === 'session-flow'),
    `新行 ${rows.length} 条，kind 全 transcript=${rows.every((r) => r.kind === 'transcript')}`)
  judge('L-6-no-embedding-for-transcript', embeddedTranscript === 0 && transcriptCount === 3,
    `transcript=${transcriptCount}，其中 embedding 非空=${embeddedTranscript}（增量期望 0）`)
  // 静态：回填查询只挑 memory，且旧的无 kind 过滤 SQL 已不存在
  const hasMemoryOnlyBackfill = pluginText.includes("embedding IS NULL AND kind='memory'")
  const hasOldBackfill = pluginText.includes('WHERE embedding IS NULL ORDER BY id ASC')
  judge('L-6-backfill-memory-only-static', hasMemoryOnlyBackfill && !hasOldBackfill,
    `回填 SQL 含 kind='memory'=${hasMemoryOnlyBackfill}；旧 SQL 残留=${hasOldBackfill}`)
} finally { ctxFlow.dispose() }

// ══════════════════════════════════════════════════════════════════════════
// L-4 · 摘要写入路径：程序内直接调用写入函数（⛔ 产品无自动触发）
// ══════════════════════════════════════════════════════════════════════════
const SAMPLE = 'L-4 摘要样例：用户确认后的长期记忆（探针程序内直调，非产品默认路径）。'
const sampleSession = 'session-flow'
let memoryRow = null
{
  const db = new DatabaseSync(flowDb)
  try {
    const id = writer.insertMemoryRow(db, { sessionId: sampleSession, sourceEventSeq: 12, content: SAMPLE })
    memoryRow = db.prepare('SELECT id, session_id, source_event_seq, content, kind, embedding FROM memories WHERE id=?').get(id)
  } finally { db.close() }
}
saveJson('L4-memory-row.json', { memoryRow, callSite: 'writer.insertMemoryRow（探针直调；产品调用点须在 ③.2 人审闸后）' })
judge('L-4-memory-row-written', Boolean(memoryRow) && memoryRow.kind === 'memory' && memoryRow.content === SAMPLE && memoryRow.session_id === sampleSession,
  `id=${memoryRow?.id} kind=${memoryRow?.kind} session=${memoryRow?.session_id} content=${String(memoryRow?.content ?? '').slice(0, 24)}…`)

// ══════════════════════════════════════════════════════════════════════════
// L-5 · 负证：插件零 backend 路由引用；本探针全程无 HTTP
//   ⚠️ 边界：fake-ctx 臂不跑真实 backend 进程；此处只证「插件代码没有该调用点」＋「本探针无网络模块」
// ══════════════════════════════════════════════════════════════════════════
const apiHits = (pluginText.match(/\/api\/memory/g) ?? []).length
const confirmHits = (pluginText.match(/archive\/confirm/g) ?? []).length
const httpImports = (pluginText.match(/node:http|axios|fetch\s*\(/g) ?? []).length
saveJson('L5-static.json', { apiHits, confirmHits, httpImports })
judge('L-5-no-backend-route', apiHits === 0 && confirmHits === 0,
  `插件 index.js＋write.js 中 /api/memory=${apiHits}、archive/confirm=${confirmHits}（期望 0）`)
obs('L-5-scope', 'fake-ctx 臂不启动 backend；本判据的边界＝插件代码无调用点＋探针无网络模块，不等于「backend 服务端日志零调用」')

// ══════════════════════════════════════════════════════════════════════════
// L-8 · 禁改召回：两条召回 SQL 原样（不含 kind 过滤）
// ══════════════════════════════════════════════════════════════════════════
const recentSql = "FROM memories WHERE session_id <> ? ORDER BY id DESC LIMIT"
const vectorSql = "WHERE embedding IS NOT NULL AND session_id <> ? ORDER BY id DESC"
const recentUnchanged = pluginText.includes(recentSql)
const vectorUnchanged = pluginText.includes(vectorSql)
saveJson('L8-recall-untouched.json', { recentSqlPresent: recentUnchanged, vectorSqlPresent: vectorUnchanged })
judge('L-8-recall-untouched', recentUnchanged && vectorUnchanged,
  `selectRecentFiltered 原样=${recentUnchanged}；selectVectorRows 原样=${vectorUnchanged}（本单⛔ 禁改召回）`)

// ══════════════════════════════════════════════════════════════════════════
// L-7 · 诚实边界（不判绿，只登记）
// ══════════════════════════════════════════════════════════════════════════
obs('L-7-honest-scope', '本单未做 ③.2 人审闸／③.3 语义字段／④.1 迁移 ⇒ ⛔ 不得声称「长期记忆功能已可用」')

// ── 收尾 ──────────────────────────────────────────────────────────────────
saveJson('findings.json', findings)
const redCount = findings.filter((f) => !f.ok).length
console.log(`${NL}[P31] 判定：${redCount === 0 ? 'PASS' : `FAIL（${redCount} 红）`}；证据 ${EVIDENCE}`)
if (!KEEP_TEMP) {
  try { rmSync(TEMP_ROOT, { recursive: true, force: true }) } catch { /* 临时目录清理失败不判红 */ }
}
process.exit(redCount === 0 ? 0 : 1)
