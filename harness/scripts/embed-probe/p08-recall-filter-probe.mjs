#!/usr/bin/env node
/**
 * P8 · 召回排除本会话 ＋ 真库首启迁移演练（WB 2026-10-31 22:50 派发）
 *
 * 判据分组：
 *   P8-a 正证：同 session 连发两条，召回结果不含第一条（交集为空）
 *   P8-b 负证：其他 session 的近似文本仍必须出现在 top-k
 *   P8-c 覆盖：向量路 selectVectorRows ＋ 降级路 selectRecentFiltered 各跑 a＋b
 *   P8-d 边界：库里只有本会话历史 ⇒ 空召回可辨（RECALL_EMPTY_MARK）
 *   P8-e 真库首启迁移：复制真库到临时路径 → 迁移 → 原 54 行 id/content 逐行 sha 不变 + embedding 回填 54
 *   P7 口径：部署件内必须命中本单哨兵 p08-recall-session-filter-v1
 *
 * 全部读数从同步后的部署件取；测试库全在临时 home；真库只复制、⛔ 不打开写入。
 * 退出码：0 全绿 ／ 1 判据红 ／ 2 前置缺失
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const DEPLOYED = join(REPO, '.dsh-home', 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-s4-memory')
const MODEL_ID = 'Xenova/bge-small-zh-v1.5'
const MODEL_DIR = 'D:/Code/_models'
const REAL_DB = join(REPO, '.dsh-home', 'larry-memory.db')
const RECALL_NAME = 'larry-memory-recall'
const EVIDENCE = process.env.P08_EVIDENCE_DIR ?? 'D:/Code/_trae-evidence/p08-recall-filter'
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'p08-recall-'))
const KEEP_TEMP = (process.env.P08_KEEP_TEMP ?? '0') === '1'
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const rowHash = (row) => createHash('sha256').update(`${row.id}|${row.content}`).digest('hex')

function makeArmHome(tag) {
  return mkdtempSync(join(TEMP_ROOT, `${tag}-`))
}
function dbOpen(path) {
  return new DatabaseSync(path)
}
function dbAll(path, sql, ...params) {
  const db = dbOpen(path)
  try { return db.prepare(sql).all(...params) } finally { db.close() }
}
function dbGet(path, sql, ...params) {
  const db = dbOpen(path)
  try { return db.prepare(sql).get(...params) } finally { db.close() }
}
function logLines(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8').split(NL).filter((line) => line.length > 0)
}
async function waitForAllVectors(path, expected, timeoutMs = 180_000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    try {
      const row = dbGet(path, 'SELECT COUNT(*) AS n, SUM(embedding IS NOT NULL) AS m FROM memories')
      if (Number(row.n) === expected && Number(row.m) === expected) return true
    } catch { /* 表/列暂不可读：继续轮询 */ }
    await sleep(200)
  }
  return false
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
    fn({ id: sessionId }, {
      type: 'user/message',
      seq,
      data: { content: [{ type: 'text', text }] },
    })
  }
}
async function runAssembly(ctx, sessionId) {
  const provider = ctx.contexts.find((c) => c.name === RECALL_NAME)
  if (!provider) throw new Error('recall context provider missing')
  const context = { agent: { session: { id: sessionId } } }
  const fallback = typeof provider.text === 'function' ? provider.text(context) : provider.text
  // 与真实 systemPrompt.assemble 同口径：空文本的 context 不会进入装配
  let current = {
    sections: [],
    contexts: fallback ? [{ name: RECALL_NAME, text: fallback }] : [],
    tools: [],
    variables: {},
  }
  for (const fn of ctx.listeners.get('system-prompt/assemble') ?? []) {
    current = await fn(current, context, async () => current)
  }
  const text = current.contexts.find((c) => c.name === RECALL_NAME)?.text ?? ''
  return { fallback, text }
}
/** 召回块里的 content → memories.id（内容唯一；不往提示里塞 id） */
function recallIds(text, rows) {
  const byContent = new Map(rows.map((r) => [r.content, r.id]))
  const ids = []
  for (const line of text.split(NL)) {
    if (!line.startsWith('- [')) continue
    const close = line.indexOf('] ')
    if (close < 0) continue
    // ②.2.2 起语义路行首多了 `(0.xxx, src) ` 前缀；本函数只负责取正文，
    // ⛔ 断言本体不变——不剥前缀会把括号段算进正文，导致内容匹配落空。
    // ⚠️ 源标识取 [^)]+：本探针 fixture 的会话 id 可能不是 8 位 hex。
    const content = line.slice(close + 2).replace(/^\([0-9]\.[0-9]{3}, [^)]+\) /, '')
    const id = byContent.get(content)
    if (id !== undefined) ids.push(id)
  }
  return ids
}
function sessionIds(rows, sessionId) {
  return rows.filter((r) => r.session_id === sessionId).map((r) => r.id)
}
function intersection(a, b) {
  const setB = new Set(b)
  return a.filter((x) => setB.has(x))
}

// ══════════════════════════════════════════════════════════════════════════
// 前置：部署件与哨兵
// ══════════════════════════════════════════════════════════════════════════
const indexJs = join(DEPLOYED, 'lib', 'index.js')
if (!existsSync(indexJs)) {
  console.error(`[P08] ❌ 前置缺失：部署件 ${indexJs}`)
  saveJson('findings.json', findings)
  process.exit(2)
}
const plugin = await import(pathToFileURL(indexJs))
const indexText = readFileSync(indexJs, 'utf8')
const sentinelHits = (indexText.match(/p08-recall-session-filter-v1/g) ?? []).length
saveJson('P8-sentinel.json', {
  indexPath: indexJs,
  size: statSync(indexJs).size,
  mtime: statSync(indexJs).mtime.toISOString(),
  sha256: sha256File(indexJs),
  sentinelHits,
})
judge('P8-deployed-sentinel', sentinelHits >= 1,
  `部署件 lib/index.js 命中 p08-recall-session-filter-v1 ×${sentinelHits}`)
if (sentinelHits < 1) {
  console.error('[P08] ❌ 部署件未同步：停手（P8 读数不能取旧件）')
  saveJson('findings.json', findings)
  process.exit(2)
}
if (!existsSync(REAL_DB)) {
  console.error(`[P08] ❌ 前置缺失：真库 ${REAL_DB} 不存在`)
  saveJson('findings.json', findings)
  process.exit(2)
}

// ══════════════════════════════════════════════════════════════════════════
// P8-a/b/c · 两条召回路径
// ══════════════════════════════════════════════════════════════════════════
const A1 = 'A-同会话旧条：我家的橘猫团子最爱趴在朝南的窗台上晒太阳，一晒就是一下午。'
const A2 = 'A-同会话新条：家里的猫总挑有日光的窗边打盹，赖着不肯走，怎么喊都没反应。'
const B1 = 'B-跨会话近似条：猫喜欢在有阳光的窗台边睡觉，晒太阳时怎么叫都不理人。'
const B2 = 'B-跨会话无关条：今晚的会议纪要在共享文档里更新了三页。'
const C1 = 'C-跨会话无关条：咖啡豆的烘焙曲线决定风味，浅烘偏酸。'

async function phaseP8AB(tag, ready) {
  const home = makeArmHome(tag)
  const emptyCache = join(home, 'empty-cache')
  mkdirSync(emptyCache, { recursive: true })
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: ready ? MODEL_DIR : emptyCache,
    degradedLogPath: degradedLog,
    recallLimit: 8,
  })
  try {
    emitUserMessage(ctx, 'A', 1, A1)
    emitUserMessage(ctx, 'B', 1, B1)
    emitUserMessage(ctx, 'B', 2, B2)
    emitUserMessage(ctx, 'C', 1, C1)
    emitUserMessage(ctx, 'A', 2, A2) // 第二条：触发召回
    if (ready) await waitForAllVectors(dbPath, 5)
    const assembly = await runAssembly(ctx, 'A')
    const rows = dbAll(dbPath, 'SELECT id, content, session_id FROM memories ORDER BY id')
    const ids = recallIds(assembly.text, rows)
    const aIds = sessionIds(rows, 'A')
    const b1Id = rows.find((r) => r.content === B1)?.id
    const bad = intersection(ids, aIds)
    const warns = logLines(degradedLog)
    saveJson(`${tag}.json`, {
      ready,
      dbPath,
      recallIds: ids,
      aSessionIds: aIds,
      b1Id,
      intersectionWithA: bad,
      b1Recalled: b1Id !== undefined && ids.includes(b1Id),
      recallText: assembly.text,
      degradedLogLines: warns,
    })
    judge(`${tag}-a-no-current-session`, bad.length === 0,
      `召回 ids=${JSON.stringify(ids)}；A 会话 ids=${JSON.stringify(aIds)}；交集=${JSON.stringify(bad)}`)
    judge(`${tag}-b-other-session-recallable`, b1Id !== undefined && ids.includes(b1Id),
      `B1 id=${String(b1Id)} ${b1Id !== undefined && ids.includes(b1Id) ? '在' : '不在'}召回列表`)
    return { home, dbPath, ids, aIds, b1Id, warns }
  } finally {
    ctx.dispose()
  }
}

// ══════════════════════════════════════════════════════════════════════════
// P8-d · 过滤后为空要可辨（与真空库/未走到召回不同形）
// ══════════════════════════════════════════════════════════════════════════
async function phaseP8D() {
  const home = makeArmHome('p8d')
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallLimit: 8,
  })
  let emptyText = ''
  let emptyWarns = []
  try {
    emitUserMessage(ctx, 'A', 1, A1)
    emitUserMessage(ctx, 'A', 2, A2)
    await waitForAllVectors(dbPath, 2)
    const assembly = await runAssembly(ctx, 'A')
    emptyText = assembly.text
    emptyWarns = logLines(degradedLog)
  } finally {
    ctx.dispose()
  }
  const emptyLogHits = emptyWarns.filter((l) => l.includes(plugin.RECALL_EMPTY_MARK)).length
  judge('P8-d-filtered-empty-log', emptyText === '' && emptyLogHits === 1,
    `仅有本会话 2 行 ⇒ 召回正文为空（${JSON.stringify(emptyText)}），OBS 行 ${emptyLogHits} 条：${emptyWarns.filter((l) => l.includes(plugin.RECALL_EMPTY_MARK))[0] ?? '（缺）'}`)

  // 对照：真空库 —— provider 不产生注入条，且不得写「过滤后为空」日志
  const ctrlHome = makeArmHome('p8d-ctrl')
  process.env.DSH_HOME = ctrlHome
  const ctrlDb = join(ctrlHome, 'memory.db')
  const ctrlLog = join(ctrlHome, 'degraded.log')
  const ctrl = applyPlugin(plugin, {
    dbPath: ctrlDb,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: ctrlLog,
    recallLimit: 8,
  })
  try {
    const assembly = await runAssembly(ctrl, 'CTRL')
    const ctrlWarns = logLines(ctrlLog)
    const ctrlHits = ctrlWarns.filter((l) => l.includes(plugin.RECALL_EMPTY_MARK)).length
    saveJson('P8-d-control.json', { text: assembly.text, logLines: ctrlWarns })
    judge('P8-d-empty-db-no-empty-log', assembly.text === '' && ctrlHits === 0,
      `真空库 ⇒ 正文为空（${JSON.stringify(assembly.text)}），RECALL_EMPTY_MARK ${ctrlHits} 条（应为 0，与「过滤后为空」不同形）`)
  } finally {
    ctrl.dispose()
  }
  saveJson('P8-d.json', { emptyText, emptyWarns })
  return { home, dbPath, emptyWarns }
}

// ══════════════════════════════════════════════════════════════════════════
// P8-e · 真库首启迁移演练（副本）
// ══════════════════════════════════════════════════════════════════════════
async function phaseP8E() {
  const home = makeArmHome('p8e')
  process.env.DSH_HOME = home
  const copyDb = join(home, 'real-copy.db')
  copyFileSync(REAL_DB, copyDb)
  const degradedLog = join(home, 'degraded.log')

  const realHashBefore = sha256File(REAL_DB)
  const colsBefore = dbAll(copyDb, 'PRAGMA table_info(memories)')
  const rowsBefore = dbAll(copyDb, 'SELECT id, content FROM memories ORDER BY id')
  const hashesBefore = rowsBefore.map(rowHash)
  const countBefore = rowsBefore.length

  const ctx = applyPlugin(plugin, {
    dbPath: copyDb,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallLimit: 8,
  })
  try {
    const backfilled = await waitForAllVectors(copyDb, countBefore)
    const colsAfter = dbAll(copyDb, 'PRAGMA table_info(memories)')
    const rowsAfter = dbAll(copyDb, 'SELECT id, content FROM memories ORDER BY id')
    const hashesAfter = rowsAfter.map(rowHash)
    const row = dbGet(copyDb, 'SELECT COUNT(*) AS n, SUM(embedding IS NOT NULL) AS m FROM memories')
    const realHashAfter = sha256File(REAL_DB)
    const colNamesAfter = colsAfter.map((c) => c.name)
    const hashesEqual = JSON.stringify(hashesBefore) === JSON.stringify(hashesAfter)
    saveJson('P8-e-migration.json', {
      realDb: REAL_DB,
      copyDb,
      rowsBefore: countBefore,
      rowsAfter: rowsAfter.length,
      columnsBefore: colsBefore.map((c) => c.name),
      columnsAfter: colNamesAfter,
      rowHashesBefore: hashesBefore,
      rowHashesAfter: hashesAfter,
      rowHashesEqual: hashesEqual,
      embeddingNotNull: Number(row.m),
      backfilled,
      realDbSha256Before: realHashBefore,
      realDbSha256After: realHashAfter,
      realDbUnchanged: realHashBefore === realHashAfter,
    })
    judge('P8-e-column-added', colsBefore.length === 5 && colsAfter.length === 6 && colNamesAfter.includes('embedding'),
      `PRAGMA table_info：${colsBefore.length} 列 → ${colsAfter.length} 列，含 embedding`)
    judge('P8-e-original-rows-unchanged', hashesEqual && rowsAfter.length === countBefore,
      `${countBefore} 行：id/content 逐行 sha ${hashesEqual ? '全同' : '不同'}（行数 ${rowsAfter.length}）`)
    judge('P8-e-backfill-54', Number(row.m) === countBefore && Number(row.n) === countBefore,
      `embedding 非空 ${row.m} / 总 ${row.n}（期望 ${countBefore}）`)
    judge('P8-e-real-db-untouched', realHashBefore === realHashAfter,
      `真库 sha256 前后${realHashBefore === realHashAfter ? '相同' : '不同'}（${realHashBefore.slice(0, 12)}…）`)
  } finally {
    ctx.dispose()
  }
  return { home, copyDb }
}

// ══════════════════════════════════════════════════════════════════════════
// main
// ══════════════════════════════════════════════════════════════════════════
try {
  // 正向臂先跑；降级臂（空 cacheDir + 不可达下载）放最后，避免后台预取污染 transformers.env.cacheDir
  const vector = await phaseP8AB('P8ab-vector', true)
  const d = await phaseP8D()
  const e = await phaseP8E()
  const oldEndpoint = process.env.HF_ENDPOINT
  process.env.HF_ENDPOINT = 'http://127.0.0.1:9'
  const fallback = await phaseP8AB('P8ab-fallback', false)
  if (oldEndpoint === undefined) delete process.env.HF_ENDPOINT
  else process.env.HF_ENDPOINT = oldEndpoint

  obs('P8-c-two-paths', `向量路 ${vector.ids.length} 召回 / A 交集 ${intersection(vector.ids, vector.aIds).length}；降级路 ${fallback.ids.length} 召回 / A 交集 ${intersection(fallback.ids, fallback.aIds).length}`)
  saveJson('P8-summary.json', {
    vector: { ids: vector.ids, aIds: vector.aIds, b1: vector.b1Id },
    fallback: { ids: fallback.ids, aIds: fallback.aIds, b1: fallback.b1Id },
    d: { emptyWarns: d.emptyWarns },
    e: { copyDb: e.copyDb },
  })

  saveJson('findings.json', findings)
  const failed = findings.filter((f) => !f.ok).length
  console.log(`${NL}[P08] ${findings.length} judgments, ${failed} FAIL; evidence: ${EVIDENCE}`)
  if (!KEEP_TEMP) {
    try { rmSync(TEMP_ROOT, { recursive: true, force: true }) } catch { /* 临时目录清理失败不判红 */ }
  } else {
    console.log(`[P08] KEEP_TEMP=1 ⇒ ${TEMP_ROOT}`)
  }
  process.exit(failed ? 1 : 0)
} catch (err) {
  console.error(`[P08] ❌ 探针异常：${err?.stack ?? err}`)
  saveJson('findings.json', findings)
  if (!KEEP_TEMP) {
    try { rmSync(TEMP_ROOT, { recursive: true, force: true }) } catch { /* ignore */ }
  }
  process.exit(1)
}
