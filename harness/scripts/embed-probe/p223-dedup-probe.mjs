#!/usr/bin/env node
/**
 * ②.2.3 近似去重 · 取证探针（D-1…D-7）
 *
 * 判据：
 *   D-1 正证：3 条近似（真实 embedding，彼此余弦 ≥ 默认阈值）⇒ 只留 1 条，且是独立算出的 top1
 *   D-2 负证：3 条不相关 ⇒ 3 条全在（⛔ 防「去重」做成「清空」）
 *   D-3a 反向独立：只改 recallDelta（0.20 ↔ 0.90）⇒ 去重行为不变（removed / 注入条数相同）
 *   D-3b 正向独立：只改 recallDedupThreshold（0.86 ↔ 0.70）⇒ 去重行为变化（removed 0 ↔ 1）
 *   D-3c 默认键：部署件含独立键 recallDedupThreshold，默认 0.86（静态）
 *   D-4 插入点与留谁：人工向量精确构造（A1 0.95 / A2≈A1 0.99 / B1 0.80 / B2 0.55，k=2）
 *                       去重在全量候选之后、applyRecallGate 之前 ⇒ 注入 A1＋B1（2 条）
 *                       若顺序反转（门后去重）⇒ 只注入 1 条，可区分
 *   D-5 降级路不受影响：空 cacheDir ＋ 不可达 HF_ENDPOINT ⇒ 时间倒序格式逐字保留、无 dedup 行
 *   D-6 可观测：dedup 行含 removed=N；removed 数值随场景变化；⛔ 行内不出现正文
 *   D-7 部署件同步：lib/index.js ＋ lib/recall.js 与源码产物同 sha；哨兵 p223-recall-dedup-v1 命中
 *
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
const EVIDENCE = process.env.P223_EVIDENCE_DIR ?? 'D:/Code/_trae-evidence/p223-dedup'
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'p223-dedup-'))
const KEEP_TEMP = (process.env.P223_KEEP_TEMP ?? '0') === '1'
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
/** 召回块里的 content → memories.id（内容唯一；不往提示里塞 id） */
function recallIds(text, rows) {
  const byContent = new Map(rows.map((r) => [r.content, r.id]))
  const ids = []
  for (const line of text.split(NL)) {
    if (!line.startsWith('- [')) continue
    const close = line.indexOf('] ')
    if (close < 0) continue
    // 语义路行首有 `(0.xxx, src) ` 前缀；只取正文，⛔ 断言本体不变
    const content = line.slice(close + 2).replace(/^\([0-9]\.[0-9]{3}, [^)]+\) /, '')
    const id = byContent.get(content)
    if (id !== undefined) ids.push(id)
  }
  return ids
}
function parseDedup(line) {
  const m = /candidates=(\d+) removed=(\d+) threshold=([0-9.]+)/.exec(line)
  if (!m) return null
  return { candidates: Number(m[1]), removed: Number(m[2]), threshold: Number(m[3]) }
}

// ── 向量构造：给定基准向量与目标余弦，造一条精确分数的行（同 p221 口径） ──
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
function cosineOf(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}
function seedRows(dbPath, rows) {
  const db = new DatabaseSync(dbPath)
  try {
    const stmt = db.prepare(
      'INSERT INTO memories(session_id, source_event_seq, content, created_at, embedding) VALUES(?,?,?,?,?)',
    )
    for (const row of rows) {
      stmt.run(row.sessionId, row.seq, row.content, '2026-11-02 00:00:00', row.embedding)
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
const sourceRecall = join(PLUGIN, 'lib', 'recall.js')
if (!existsSync(deployedIndex) || !existsSync(deployedRecall) || !existsSync(sourceIndex) || !existsSync(sourceRecall)) {
  console.error('[P223] ❌ 前置缺失：插件 lib 不存在（先 build＋同步部署件）')
  saveJson('findings.json', findings)
  process.exit(2)
}
const plugin = await import(pathToFileURL(deployedIndex).href)
const { createEmbedder } = await import(pathToFileURL(join(DEPLOYED, 'lib', 'embedding.js')).href)
const recall = await import(pathToFileURL(deployedRecall).href)

// ══════════════════════════════════════════════════════════════════════════
// D-7：部署件同步 ＋ 哨兵
// ══════════════════════════════════════════════════════════════════════════
const deployedText = readFileSync(deployedIndex, 'utf8')
const sentinelHits = (deployedText.match(/p223-recall-dedup-v1/g) ?? []).length
const indexSame = sha256File(sourceIndex) === sha256File(deployedIndex)
const recallSame = sha256File(sourceRecall) === sha256File(deployedRecall)
saveJson('D-7-deploy.json', {
  sourceIndex,
  deployedIndex,
  sourceIndexSha: sha256File(sourceIndex),
  deployedIndexSha: sha256File(deployedIndex),
  sourceRecallSha: sha256File(sourceRecall),
  deployedRecallSha: sha256File(deployedRecall),
  indexSame,
  recallSame,
  sentinelHits,
})
judge('D-7-deploy-sync', sentinelHits >= 1 && indexSame && recallSame,
  `哨兵 ×${sentinelHits}；index.js 同 sha=${indexSame}；recall.js 同 sha=${recallSame}`)
if (sentinelHits < 1) {
  console.error('[P223] ❌ 部署件未同步：停手')
  saveJson('findings.json', findings)
  process.exit(2)
}

// D-4 静态：调用点必须位于 applyRecallGate 之前
const dedupCallAt = deployedText.indexOf('dedupeNearDuplicates(scoredAll')
const gateCallAt = deployedText.indexOf('applyRecallGate(dedup.kept')
judge('D-4-static-order', dedupCallAt >= 0 && gateCallAt > dedupCallAt,
  `dedupeNearDuplicates 调用 @${dedupCallAt}，applyRecallGate(dedup.kept) @${gateCallAt}（去重必须先于门）`)

// D-3c 静态：独立配置键与默认值
const hasDedupKey = deployedText.includes('recallDedupThreshold')
const defaultLine = /recallDedupThreshold:\s*0\.86/.test(deployedText)
const dedupChannel = deployedText.includes('recallDedupLogPath')
judge('D-3c-default-key', hasDedupKey && defaultLine && dedupChannel,
  `部署件含独立键 recallDedupThreshold=${hasDedupKey}，默认值 0.86=${defaultLine}，独立日志通道 recallDedupLogPath=${dedupChannel}`)

const embedder = createEmbedder({ modelId: MODEL_ID, cacheDir: MODEL_DIR })

const QUERY = '咖啡的酸苦和烘焙程度有什么关系？'
const NEAR_TEXTS = [
  '咖啡豆的烘焙曲线直接决定风味，浅烘偏酸、深烘偏苦。',
  '烘焙程度影响咖啡风味：浅度烘焙酸味重，深度烘焙更苦。',
  '咖啡的酸苦取决于烘焙曲线，浅烘酸、深烘苦。',
]
const FAR_TEXTS = [
  '洗衣机脱水时声音变大，查了说明书才知道是衣物放偏了。',
  '公园的樱花这周开得正好，周末要排队。',
  '冰箱里的酸奶过期了，只能扔掉。',
]
const BORDER_TEXTS = [
  '烘焙程度影响咖啡风味：浅度烘焙酸味重，深度烘焙更苦。',
  '浅烘焙的豆子偏酸，深烘焙偏苦，关键看烘焙曲线。',
]

// ══════════════════════════════════════════════════════════════════════════
// 真实 embedding 臂
// ══════════════════════════════════════════════════════════════════════════
async function realArm(tag, { query, texts, recallDelta, recallLimit = 6, dedupThreshold }) {
  const home = makeHome(tag)
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const gateLog = join(home, 'gate.log')
  const dedupLog = join(home, 'dedup.log')
  const config = {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallGateLogPath: gateLog,
    recallDedupLogPath: dedupLog,
    recallLimit,
    recallDelta,
    ...(dedupThreshold === undefined ? {} : { recallDedupThreshold: dedupThreshold }),
  }
  const ctx = applyPlugin(plugin, config)
  try {
    const queryVector = await embedder.encode(query)
    const vectors = []
    for (const text of texts) vectors.push(await embedder.encode(text))
    seedRows(dbPath, texts.map((content, i) => ({
      sessionId: 'B',
      seq: i + 1,
      content,
      embedding: recall.encodeVector(vectors[i]),
    })))
    emitUserMessage(ctx, 'A', 1, query)
    const assembly = await runAssembly(ctx, 'A')
    const rows = dbAll(dbPath, 'SELECT id, content, session_id, embedding FROM memories ORDER BY id')
    const ids = recallIds(assembly.text, rows)
    const independent = recall.cosineTopK(rows.filter((r) => r.session_id === 'B'), queryVector, texts.length)
    const top1 = independent[0]?.row.id
    const dedupLine = logLines(dedupLog).pop() ?? ''
    const gateLine = logLines(gateLog).filter((l) => l.includes(plugin.RECALL_GATE_MARK)).pop() ?? ''
    const result = {
      tag, query, texts, recallDelta, recallLimit, dedupThreshold,
      ids, top1, gateLine, dedupLine, assemblyText: assembly.text,
      degradedLogLines: logLines(degradedLog),
      pairwise: texts.length > 1
        ? vectors.map((a, i) => vectors.map((b, j) => (i < j ? +cosineOf(a, b).toFixed(4) : null))).flat().filter((x) => x !== null)
        : [],
    }
    saveJson(`${tag}.json`, result)
    return { ids, top1, gateLine, dedupLine, text: assembly.text, dedup: parseDedup(dedupLine), result }
  } finally {
    ctx.dispose()
  }
}

// D-1 正证
const nearArm = await realArm('d1-near', { query: QUERY, texts: NEAR_TEXTS, recallDelta: 1.0 })
const nearPairwise = nearArm.result.pairwise
judge('D-1-positive', nearArm.ids.length === 1 && nearArm.ids[0] === nearArm.top1 && nearArm.dedup?.removed === 2,
  `近似三条两两余弦=${JSON.stringify(nearPairwise)}；注入 ${nearArm.ids.length} 条（期望 1）；首条 id=${nearArm.ids[0]}，独立 top1 id=${nearArm.top1}；dedup removed=${nearArm.dedup?.removed ?? '?'}（期望 2）`)

// D-2 负证
const farArm = await realArm('d2-far', { query: QUERY, texts: FAR_TEXTS, recallDelta: 1.0 })
judge('D-2-negative', farArm.ids.length === 3 && farArm.dedup?.removed === 0,
  `不相关三条两两余弦=${JSON.stringify(farArm.result.pairwise)}；注入 ${farArm.ids.length} 条（期望 3）；dedup removed=${farArm.dedup?.removed ?? '?'}（期望 0）`)

// D-3a 反向：只改 recallDelta ⇒ 去重行为不变
const deltaSmall = await realArm('d3-delta-020', { query: QUERY, texts: NEAR_TEXTS, recallDelta: 0.20 })
const deltaBig = await realArm('d3-delta-090', { query: QUERY, texts: NEAR_TEXTS, recallDelta: 0.90 })
judge('D-3a-delta-independent',
  deltaSmall.dedup?.removed === 2 && deltaBig.dedup?.removed === 2
    && deltaSmall.ids.length === 1 && deltaBig.ids.length === 1,
  `只改 recallDelta：0.20 ⇒ removed=${deltaSmall.dedup?.removed ?? '?'} 注入 ${deltaSmall.ids.length}；0.90 ⇒ removed=${deltaBig.dedup?.removed ?? '?'} 注入 ${deltaBig.ids.length}（两臂必须相同）`)

// D-3b 正向：只改 recallDedupThreshold ⇒ 去重行为变化
const borderHigh = await realArm('d3-threshold-086', { query: QUERY, texts: BORDER_TEXTS, recallDelta: 1.0, dedupThreshold: 0.86 })
const borderLow = await realArm('d3-threshold-070', { query: QUERY, texts: BORDER_TEXTS, recallDelta: 1.0, dedupThreshold: 0.70 })
judge('D-3b-threshold-key',
  borderHigh.dedup?.removed === 0 && borderHigh.ids.length === 2
    && borderLow.dedup?.removed === 1 && borderLow.ids.length === 1,
  `边界对余弦=${JSON.stringify(borderHigh.result.pairwise)}；阈值 0.86 ⇒ removed=${borderHigh.dedup?.removed ?? '?'} 注入 ${borderHigh.ids.length}；阈值 0.70 ⇒ removed=${borderLow.dedup?.removed ?? '?'} 注入 ${borderLow.ids.length}`)

// ══════════════════════════════════════════════════════════════════════════
// D-4 行为：人工向量精确构造，验证插入点与「留高分者」
// ══════════════════════════════════════════════════════════════════════════
async function vectorArm() {
  const home = makeHome('d4-vector')
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const gateLog = join(home, 'gate.log')
  const dedupLog = join(home, 'dedup.log')
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallGateLogPath: gateLog,
    recallDedupLogPath: dedupLog,
    recallLimit: 2,
    recallDelta: 0.20,
  })
  const vectorQuery = 'P223 查询：猫喜欢在有阳光的窗台边睡觉，怎么叫都不理人。'
  try {
    const qv = await embedder.encode(vectorQuery)
    const a1 = vectorWithCosine(qv, 0.95, 1)
    const a2 = vectorWithCosine(a1, 0.99, 2)
    const b1 = vectorWithCosine(qv, 0.80, 3)
    const b2 = vectorWithCosine(qv, 0.55, 4)
    const labels = [
      'D4-A1：top1（0.95）',
      'D4-A2：A1 的近似（≈0.99）',
      'D4-B1：不同事件（0.80）',
      'D4-B2：被门挡（0.55）',
    ]
    seedRows(dbPath, [a1, a2, b1, b2].map((vector, i) => ({
      sessionId: 'B', seq: i + 1, content: labels[i], embedding: recall.encodeVector(vector),
    })))
    emitUserMessage(ctx, 'A', 1, vectorQuery)
    const assembly = await runAssembly(ctx, 'A')
    const rows = dbAll(dbPath, 'SELECT id, content, session_id FROM memories ORDER BY id')
    const ids = recallIds(assembly.text, rows)
    const idOf = (label) => rows.find((r) => r.content === label)?.id
    const dedupLine = logLines(dedupLog).pop() ?? ''
    const gateLine = logLines(gateLog).filter((l) => l.includes(plugin.RECALL_GATE_MARK)).pop() ?? ''
    const result = {
      cosineA1A2: +cosineOf(a1, a2).toFixed(4),
      cosineA1B1: +cosineOf(a1, b1).toFixed(4),
      ids, idA1: idOf(labels[0]), idA2: idOf(labels[1]), idB1: idOf(labels[2]),
      dedupLine, gateLine, assemblyText: assembly.text,
    }
    saveJson('D-4-vector.json', result)
    return result
  } finally {
    ctx.dispose()
  }
}
const varm = await vectorArm()
const vIds = varm.ids
judge('D-4-insert-point',
  vIds.length === 2 && vIds.includes(varm.idA1) && vIds.includes(varm.idB1) && !vIds.includes(varm.idA2),
  `A1↔A2=${varm.cosineA1A2}，A1↔B1=${varm.cosineA1B1}；注入 ${vIds.length} 条（期望 A1＋B1）；A1=${varm.idA1} A2=${varm.idA2} B1=${varm.idB1}，实际 ids=${JSON.stringify(vIds)}；排序若在门后去重则只会剩 1 条`)

// D-6 可观测：removed 数值随场景变化 ＋ 行内无正文
const d6Line = nearArm.dedupLine
const d6LineFar = farArm.dedupLine
const contentLeak = [...NEAR_TEXTS, ...FAR_TEXTS, ...BORDER_TEXTS].some((t) => d6Line.includes(t) || d6LineFar.includes(t))
judge('D-6-observable',
  nearArm.dedup?.removed === 2 && farArm.dedup?.removed === 0
    && d6Line.includes('removed=') && !contentLeak,
  `dedup 行（near）=${d6Line || '（缺）'}；行内正文泄露=${contentLeak}`)

// ══════════════════════════════════════════════════════════════════════════
// D-5 降级路：空 cacheDir ＋ 不可达 HF_ENDPOINT ⇒ 时间倒序格式逐字保留
// ══════════════════════════════════════════════════════════════════════════
async function fallbackArm() {
  const home = makeHome('d5-fallback')
  const emptyCache = mkdtempSync(join(TEMP_ROOT, 'empty-cache-'))
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const gateLog = join(home, 'gate.log')
  const dedupLog = join(home, 'dedup.log')
  const oldEndpoint = process.env.HF_ENDPOINT
  process.env.HF_ENDPOINT = 'http://127.0.0.1:9'
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: emptyCache,
    degradedLogPath: degradedLog,
    recallGateLogPath: gateLog,
    recallDedupLogPath: dedupLog,
    recallLimit: 6,
    recallDelta: 0.20,
  })
  try {
    const zero = new Array(512).fill(0.02)
    const labels = ['D5-降级路第一条', 'D5-降级路第二条']
    seedRows(dbPath, labels.map((content, i) => ({
      sessionId: 'B', seq: i + 1, content, embedding: recall.encodeVector(zero),
    })))
    emitUserMessage(ctx, 'A', 1, 'P223 降级路查询：随便一句。')
    const assembly = await runAssembly(ctx, 'A')
    const result = {
      text: assembly.text,
      dedupLines: logLines(dedupLog),
      gateLines: logLines(gateLog).filter((l) => l.includes(plugin.RECALL_GATE_MARK)),
      degraded: logLines(degradedLog),
    }
    saveJson('D-5-fallback.json', result)
    return result
  } finally {
    if (oldEndpoint === undefined) delete process.env.HF_ENDPOINT
    else process.env.HF_ENDPOINT = oldEndpoint
    ctx.dispose()
  }
}
const fb = await fallbackArm()
const fbLines = fb.text.split(NL).filter((l) => l.startsWith('- ['))
const fbSemanticPrefix = fbLines.some((l) => /\s\(0\.\d{3}, /.test(l))
judge('D-5-fallback-untouched',
  fbLines.length === 2 && !fbSemanticPrefix && fb.dedupLines.length === 0 && fb.gateLines.length === 0,
  `降级路注入 ${fbLines.length} 行；行内出现语义分数前缀=${fbSemanticPrefix}；dedup 行=${fb.dedupLines.length}；gate 行=${fb.gateLines.length}（降级路无分数、⛔ 不应有去重行）`)

saveJson('findings.json', findings)
if (KEEP_TEMP) console.log(`P223_KEEP_TEMP=1 ⇒ 保留 ${TEMP_ROOT}`)
else rmSync(TEMP_ROOT, { recursive: true, force: true })

const failed = findings.filter((item) => !item.ok)
console.log(`${NL}summary: ${findings.length - failed.length}/${findings.length} PASS`)
process.exit(failed.length === 0 ? 0 : 1)
