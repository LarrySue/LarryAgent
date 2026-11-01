#!/usr/bin/env node
/**
 * ②.2.1 相关性门 · 取证探针（R-1…R-8）
 *
 * 判据：
 *   R-1 高相关进（top1 在被选中集合）
 *   R-2 低分噪声（top1-0.30）不进
 *   R-3 上限不是目标（只有 2 条过门 ⇒ 注入 2 条）
 *   R-4 delta 0.05 ⇒ 被选中条数减少
 *   R-5 被挡记录：被挡条数 ＋ 被挡最高分（top1-0.25，±0.001）
 *   R-6 过滤后候选池为空 ⇒ RECALL_EMPTY_MARK＋被挡记录；真空库仍 0 条（P8-d 不变）
 *   R-6′ 结果第一条必须是该 query 的 top1
 *   R-7 由 P0②/P8 两个既有探针回归（本脚本不重复）
 *   R-8 部署件内命中本单哨兵（源码产物不算）
 *   T-1a `truncated=` 正证：过门 4 条 > limit 2 ⇒ truncated=2
 *   T-1b 恒等式 candidates == kept + blocked + truncated（截断／未截断／候选池空三种场景）
 *
 * 判据总数 = 既有 11 条（R-*）＋ 新增 2 条（T-1a／T-1b）。
 * 全部在临时 home；不写真实库；退出码 0 全绿 ／ 1 判据红 ／ 2 前置缺失。
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const PLUGIN = join(HARNESS, 'packages', 'plugin-s4-memory')
const DEPLOYED = join(REPO, '.dsh-home', 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-s4-memory')
const MODEL_ID = 'Xenova/bge-small-zh-v1.5'
const MODEL_DIR = 'D:/Code/_models'
const RECALL_NAME = 'larry-memory-recall'
const EVIDENCE = process.env.P221_EVIDENCE_DIR ?? 'D:/Code/_trae-evidence/p221-recall-gate'
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'p221-gate-'))
const KEEP_TEMP = (process.env.P221_KEEP_TEMP ?? '0') === '1'
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

function makeHome(tag) {
  return mkdtempSync(join(TEMP_ROOT, `${tag}-`))
}
function dbAll(path, sql, ...params) {
  const db = new DatabaseSync(path)
  try { return db.prepare(sql).all(...params) } finally { db.close() }
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
function recallIds(text, rows) {
  const byContent = new Map(rows.map((r) => [r.content, r.id]))
  const ids = []
  for (const line of text.split(NL)) {
    if (!line.startsWith('- [')) continue
    const close = line.indexOf('] ')
    if (close < 0) continue
    // ②.2.2 起语义路行首多了 `(0.xxx, src) ` 前缀；本函数只负责取正文，
    // ⛔ 断言本体不变——不剥前缀会把括号段算进正文，导致内容匹配全部落空。
    // ⚠️ 源标识取 [^)]+：本探针 fixture 的会话 id 是单字符（`B`），短标识不是 8 位 hex。
    const content = line.slice(close + 2).replace(/^\([0-9]\.[0-9]{3}, [^)]+\) /, '')
    const id = byContent.get(content)
    if (id !== undefined) ids.push(id)
  }
  return ids
}
function parseGateCounts(line) {
  const m = /candidates=(\d+) kept=(\d+) blocked=(\d+) truncated=(\d+)/.exec(line)
  if (!m) return null
  return { candidates: Number(m[1]), kept: Number(m[2]), blocked: Number(m[3]), truncated: Number(m[4]) }
}

// ── 向量构造：给定 query 向量与目标余弦，造一条精确分数的行 ──────────────
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
  const orth = r.map((x, i) => x - dot * q[i])
  return normalize(orth)
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
      'INSERT INTO memories(session_id, source_event_seq, content, created_at, embedding) VALUES(?,?,?,?,?)',
    )
    for (const row of rows) {
      stmt.run(row.sessionId, row.seq, row.content, '2026-11-01 00:00:00', row.embedding)
    }
  } finally {
    db.close()
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 前置：部署件、哨兵、embedding 模块
// ══════════════════════════════════════════════════════════════════════════
const deployedIndex = join(DEPLOYED, 'lib', 'index.js')
const deployedRecall = join(DEPLOYED, 'lib', 'recall.js')
const sourceIndex = join(PLUGIN, 'lib', 'index.js')
if (!existsSync(deployedIndex) || !existsSync(deployedRecall) || !existsSync(sourceIndex)) {
  console.error('[P221] ❌ 前置缺失：插件 lib 不存在（先 build＋同步部署件）')
  saveJson('findings.json', findings)
  process.exit(2)
}
const plugin = await import(pathToFileURL(deployedIndex).href)
const { createEmbedder } = await import(pathToFileURL(join(DEPLOYED, 'lib', 'embedding.js')).href)
const recall = await import(pathToFileURL(deployedRecall).href)

const deployedText = readFileSync(deployedIndex, 'utf8')
const sourceText = readFileSync(sourceIndex, 'utf8')
const sentinelHits = (deployedText.match(/p221-recall-gate-v1/g) ?? []).length
const sourceEqual = sha256File(sourceIndex) === sha256File(deployedIndex)
saveJson('P221-R8-deploy.json', {
  sourceIndex,
  deployedIndex,
  sourceSha256: sha256File(sourceIndex),
  deployedSha256: sha256File(deployedIndex),
  sourceEqual,
  sentinelHits,
})
judge('R-8-deployed-sentinel', sentinelHits >= 1 && sourceEqual,
  `部署件 ${deployedIndex}：哨兵 ×${sentinelHits}；与源码产物同 sha=${sourceEqual}`)
if (sentinelHits < 1) {
  console.error('[P221] ❌ 部署件未同步：停手')
  saveJson('findings.json', findings)
  process.exit(2)
}

const embedder = createEmbedder({ modelId: MODEL_ID, cacheDir: MODEL_DIR })
const QUERY = 'P221 查询：猫喜欢在有阳光的窗台边睡觉，晒太阳时怎么叫都不理人。'
const queryVector = await embedder.encode(QUERY)

// ══════════════════════════════════════════════════════════════════════════
// R-1/R-2/R-3/R-5/R-6′：同一份合成候选池，delta=0.20，k=6
// ══════════════════════════════════════════════════════════════════════════
async function phaseGate(tag, delta) {
  const home = makeHome(tag)
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const gateLog = join(home, 'gate.log')
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallGateLogPath: gateLog,
    recallLimit: 6,
    recallDelta: delta,
    recallMinTop: 0, // 预留键：本期必须不生效
  })

  const labels = [
    'P221-B1：最相关（top1）',
    'P221-B2：次相关',
    'P221-B3：已知会被挡（top1-0.25）',
    'P221-B4：低分噪声（top1-0.30）',
    'P221-B5：更低分',
  ]
  const cosines = [0.95, 0.80, 0.70, 0.60, 0.55]
  const vectors = cosines.map((c, i) => vectorWithCosine(queryVector, c, i + 1))
  const seeded = labels.map((content, i) => ({
    sessionId: 'B',
    seq: i + 1,
    content,
    embedding: recall.encodeVector(vectors[i]),
  }))

  try {
    seedRows(dbPath, seeded)
    emitUserMessage(ctx, 'A', 1, QUERY)
    const assembly = await runAssembly(ctx, 'A')
    const rows = dbAll(dbPath, 'SELECT id, content, session_id FROM memories ORDER BY id')
    const ids = recallIds(assembly.text, rows)
    const idOf = (label) => rows.find((r) => r.content === label)?.id
    const top1Id = idOf(labels[0])
    const noiseId = idOf(labels[3])
    const gateLines = logLines(gateLog)
    const lastGate = gateLines[gateLines.length - 1] ?? ''
    const blockedTopMatch = /blocked_top=([0-9.]+)/.exec(lastGate)
    const blockedCountMatch = /blocked=(\d+)/.exec(lastGate)
    const keptMatch = /kept=(\d+)/.exec(lastGate)
    const result = {
      delta,
      query: QUERY,
      cosines,
      seededIds: rows.filter((r) => r.session_id === 'B').map((r) => ({ id: r.id, content: r.content })),
      recallIds: ids,
      top1Id,
      noiseId,
      gateLine: lastGate,
      assemblyText: assembly.text,
      degradedLogLines: logLines(degradedLog),
    }
    saveJson(`${tag}.json`, result)

    if (tag === 'r1235') {
      judge('R-1-high-relevance-in', top1Id !== undefined && ids.includes(top1Id),
        `top1 id=${top1Id} ${top1Id !== undefined && ids.includes(top1Id) ? '在' : '不在'}被选中集合 ids=${JSON.stringify(ids)}`)
      judge('R-2-low-noise-out', noiseId !== undefined && !ids.includes(noiseId),
        `噪声（top1-0.30）id=${noiseId} ${noiseId !== undefined && !ids.includes(noiseId) ? '不在' : '在'}被选中集合`)
      judge('R-3-cap-not-target', ids.length === 2,
        `只有 2 条过门（0.95/0.80；0.70 起被挡）⇒ 注入 ${ids.length} 条（k=6 不得凑数）`)
      const blockedTop = Number.parseFloat(blockedTopMatch?.[1] ?? 'NaN')
      const blockedOk = blockedCountMatch?.[1] === '3'
        && Number.isFinite(blockedTop)
        && Math.abs(blockedTop - 0.70) <= 0.001
      judge('R-5-blocked-record', blockedOk,
        `gate 行=${lastGate || '（缺）'}；被挡条数=${blockedCountMatch?.[1] ?? '?'}，被挡最高分=${blockedTopMatch?.[1] ?? '?'}（期望 3 / 0.70 ±0.001）`)
      judge('R-6p-top1-first', ids.length > 0 && ids[0] === top1Id,
        `结果第一条 id=${ids[0]}；独立算出的 top1 id=${top1Id}（必须一致）`)
      judge('R-6p-minTop-not-applied', Number(keptMatch?.[1]) === 2,
        `recallMinTop=0 预留键未过滤：kept=${keptMatch?.[1] ?? '?'}（期望 2）`)
    } else if (tag === 'r4') {
      result.kept = Number(keptMatch?.[1] ?? -1)
      saveJson('R-4.json', result)
    }
    return { result, ids, gateLines }
  } finally {
    ctx.dispose()
  }
}

const base = await phaseGate('r1235', 0.20)
const narrow = await phaseGate('r4', 0.05)

// ══════════════════════════════════════════════════════════════════════════
// T-1a：过门条数 > limit ⇒ gate 行必须出现 truncated=，且值 = 过门总数 − kept
// ══════════════════════════════════════════════════════════════════════════
async function phaseTruncated(tag) {
  const home = makeHome(tag)
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const gateLog = join(home, 'gate.log')
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallGateLogPath: gateLog,
    recallLimit: 2, // 上限 2 < 过门条数 4 ⇒ 必须有 2 条被截
    recallDelta: 0.20,
  })
  const labels = [
    'T1-1：top1（0.95）',
    'T1-2：过门（0.90）',
    'T1-3：过门（0.85）',
    'T1-4：过门（0.80）',
    'T1-5：被挡（0.60）',
  ]
  const cosines = [0.95, 0.90, 0.85, 0.80, 0.60]
  const vectors = cosines.map((c, i) => vectorWithCosine(queryVector, c, i + 1))
  const seeded = labels.map((content, i) => ({
    sessionId: 'T1',
    seq: i + 1,
    content,
    embedding: recall.encodeVector(vectors[i]),
  }))
  try {
    seedRows(dbPath, seeded)
    emitUserMessage(ctx, 'A', 1, QUERY)
    const assembly = await runAssembly(ctx, 'A')
    const rows = dbAll(dbPath, 'SELECT id, content, session_id FROM memories ORDER BY id')
    const ids = recallIds(assembly.text, rows)
    const gateLines = logLines(gateLog)
    const lastGate = gateLines[gateLines.length - 1] ?? ''
    const counts = parseGateCounts(lastGate)
    const result = {
      tag,
      cosines,
      recallLimit: 2,
      recallDelta: 0.20,
      seededIds: rows.filter((r) => r.session_id === 'T1').map((r) => ({ id: r.id, content: r.content })),
      recallIds: ids,
      gateLine: lastGate,
      counts,
      assemblyText: assembly.text,
    }
    saveJson('T-1a.json', result)
    return { result, ids, gateLines }
  } finally {
    ctx.dispose()
  }
}

const trunc = await phaseTruncated('t1a-truncated')
const truncLine = trunc.gateLines[trunc.gateLines.length - 1] ?? ''
const truncCounts = parseGateCounts(truncLine)
judge('T-1a-truncated-field',
  truncCounts !== null
    && truncCounts.candidates === 5
    && truncCounts.kept === 2
    && truncCounts.blocked === 1
    && truncCounts.truncated === 2
    && trunc.ids.length === 2,
  `gate 行=${truncLine || '（缺）'}；观测 candidates=${truncCounts?.candidates ?? '?'} kept=${truncCounts?.kept ?? '?'} blocked=${truncCounts?.blocked ?? '?'} truncated=${truncCounts?.truncated ?? '?'}，注入 ${trunc.ids.length} 条（期望 5/2/1/2）`)

judge('R-4-delta-configurable', narrow.ids.length < base.ids.length,
  `delta 0.20 ⇒ kept/ids=${base.ids.length}；delta 0.05 ⇒ kept/ids=${narrow.ids.length}（明显减少）`)
judge('R-4-gate-line', (narrow.result.gateLine.match(/delta=0.05/) ?? []).length === 1,
  `delta=0.05 时 gate 行含 delta=0.05：${narrow.result.gateLine || '（缺）'}`)

// ══════════════════════════════════════════════════════════════════════════
// R-6：过滤后候选池为空 ⇒ RECALL_EMPTY_MARK ＋ 被挡记录；真空库仍 0 条
// ══════════════════════════════════════════════════════════════════════════
async function phaseEmpty(tag, seedCurrentOnly) {
  const home = makeHome(tag)
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const gateLog = join(home, 'gate.log')
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallGateLogPath: gateLog,
    recallLimit: 6,
    recallDelta: 0.20,
  })
  try {
    if (seedCurrentOnly) {
      emitUserMessage(ctx, 'A', 1, QUERY)
      emitUserMessage(ctx, 'A', 2, 'P221 同会话第二条：只用于把 A 会话填出候选过滤条件。')
    }
    const assembly = await runAssembly(ctx, seedCurrentOnly ? 'A' : 'CTRL')
    const gateLines = logLines(gateLog)
    const degraded = logLines(degradedLog)
    return { text: assembly.text, gateLines, degraded, result: { tag, seedCurrentOnly, assemblyText: assembly.text, gateLines, degraded } }
  } finally {
    ctx.dispose()
  }
}

const filteredEmpty = await phaseEmpty('r6-filtered-empty', true)
const vacuum = await phaseEmpty('r6-vacuum', false)
saveJson('R-6.json', { filteredEmpty: filteredEmpty.result, vacuum: vacuum.result })
const emptyMarkerHits = filteredEmpty.degraded.filter((l) => l.includes(plugin.RECALL_EMPTY_MARK)).length
const gateEmptyHits = filteredEmpty.gateLines.filter((l) => l.includes(plugin.RECALL_GATE_MARK)).length
judge('R-6-filtered-empty', filteredEmpty.text === '' && emptyMarkerHits === 1 && gateEmptyHits >= 1,
  `过滤后为空 ⇒ 正文空=${filteredEmpty.text === ''}，RECALL_EMPTY_MARK=${emptyMarkerHits}，gate 行=${gateEmptyHits}`)
const vacMarkerHits = vacuum.degraded.filter((l) => l.includes(plugin.RECALL_EMPTY_MARK)).length
const vacGateHits = vacuum.gateLines.filter((l) => l.includes(plugin.RECALL_GATE_MARK)).length
judge('R-6-vacuum-control', vacuum.text === '' && vacMarkerHits === 0 && vacGateHits === 0,
  `真空库（库里没有任何记忆）⇒ 正文空=${vacuum.text === ''}，RECALL_EMPTY_MARK=${vacMarkerHits}，gate 行=${vacGateHits}（P8-d 控制臂保持 0）`)

// ══════════════════════════════════════════════════════════════════════════
// T-1b：恒等式 candidates == kept + blocked + truncated（覆盖 4 个场景实例：截断／未截断 ×2／候选池空）
// ══════════════════════════════════════════════════════════════════════════
const identityScenarios = [
  ['r1235（k 未截断 ⇒ truncated=0）', base.gateLines],
  ['r4（delta 0.05，k 未截断 ⇒ truncated=0）', narrow.gateLines],
  ['r6-filtered-empty（候选池空 ⇒ 全 0）', filteredEmpty.gateLines],
  ['t1a（过门>limit ⇒ truncated>0）', trunc.gateLines],
]
const identityFailures = []
const identityRows = []
for (const [name, lines] of identityScenarios) {
  if (lines.length === 0) {
    identityFailures.push(`${name}: 无 gate 行`)
    identityRows.push({ name, lines: [], counts: null, ok: false })
    continue
  }
  for (const line of lines) {
    const counts = parseGateCounts(line)
    const hasField = line.includes('truncated=')
    const identityOk = counts !== null && counts.candidates === counts.kept + counts.blocked + counts.truncated
    if (!hasField) identityFailures.push(`${name}: gate 行缺 truncated= 字段`)
    if (!counts) identityFailures.push(`${name}: 计数解析失败`)
    else if (!identityOk) {
      identityFailures.push(`${name}: ${counts.candidates} != ${counts.kept}+${counts.blocked}+${counts.truncated}`)
    }
    identityRows.push({ name, line, counts, hasField, identityOk })
  }
}
const baseCounts = parseGateCounts(base.result.gateLine)
const narrowCounts = parseGateCounts(narrow.result.gateLine)
const emptyCounts = parseGateCounts(filteredEmpty.gateLines[0] ?? '')
if (!(baseCounts && baseCounts.truncated === 0)) identityFailures.push('r1235: truncated 应为 0')
if (!(narrowCounts && narrowCounts.truncated === 0)) identityFailures.push('r4: truncated 应为 0')
if (!(emptyCounts && emptyCounts.candidates === 0 && emptyCounts.kept === 0 && emptyCounts.blocked === 0 && emptyCounts.truncated === 0)) {
  identityFailures.push('r6-filtered-empty: candidates=0 应 kept=blocked=truncated=0')
}
if (!(truncCounts && truncCounts.truncated === 2)) identityFailures.push('t1a: truncated 应为 2')
saveJson('T-1b-identity.json', { scenarios: identityRows, failures: identityFailures })
judge('T-1b-gate-identity', identityFailures.length === 0,
  identityFailures.length === 0
    ? `四种场景 ${identityRows.length} 条 gate 行均满足 candidates == kept + blocked + truncated；r1235/r4 truncated=0，空池全 0，t1a truncated=2`
    : `恒等式/特值不符：${identityFailures.join('；')}`)

saveJson('findings.json', findings)
if (KEEP_TEMP) console.log(`P221_KEEP_TEMP=1 ⇒ 保留 ${TEMP_ROOT}`)
else rmSync(TEMP_ROOT, { recursive: true, force: true })

const failed = findings.filter((item) => !item.ok)
console.log(`${NL}summary: ${findings.length - failed.length}/${findings.length} PASS`)
process.exit(failed.length === 0 ? 0 : 1)
