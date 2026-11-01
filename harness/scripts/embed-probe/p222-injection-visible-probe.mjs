#!/usr/bin/env node
/**
 * ②.2.2 注入文本可见化 · 取证探针（W-0…W-6）
 *
 * 判据：
 *   W-0 部署件＝源码产物同 sha（lib/index.js ＋ lib/recall.js）
 *   W-1 语义路每一行匹配 `- [时间] (0.xxx, 8hex) 正文`，行数 == gate kept，标题行不变
 *   W-2 分数逐条等于 cosineTopK 返回值 toFixed(3)（同一来源，⛔ 另算余弦）
 *   W-3a 短标识可反查回原 session_id（JS 映射 ＋ SQL substr 两证）
 *   W-3b 两个不同会话同时注入 ⇒ 两行 src 必须不同
 *   W-4 降级路（时间倒序）改前／改后逐字相同，且无分数残留
 *   W-5 注入块只命中 contexts 面；sections 不含标题前缀；injectSection 默认仍 false
 *   W-6 不新增泄露：无完整 session_id、无被挡正文、无 undefined／null／NaN
 *
 * 全部在临时 home；不写真实库；退出码 0 全绿 ／ 1 判据红 ／ 2 前置缺失。
 */

import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
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
const RECALL_TITLE_PREFIX = '## LarryAgent 记忆召回'
const EVIDENCE = process.env.P222_EVIDENCE_DIR ?? 'D:/Code/_trae-evidence/p222-injection-visible'
const OLD_SRC = process.env.P222_OLD_LIB ?? join(EVIDENCE, 'old-lib', 'index.js')
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'p222-injection-'))
const KEEP_TEMP = (process.env.P222_KEEP_TEMP ?? '0') === '1'
const NL = String.fromCharCode(10)
// ⚠️ 旧件里的裸 import（`@huggingface/transformers`）只在 harness 工作区可解析：
// 直接把证据目录里的副本 import 进来会“import 失败”而不是“模型未就绪”，
// 会让 W-4 对照臂走错路径 ⇒ 复制到 harness 下的临时目录再 import，跑完删除。
const OLD_HOME = mkdtempSync(join(HARNESS, '.p222-oldlib-'))
mkdirSync(join(OLD_HOME, 'lib'), { recursive: true })
if (existsSync(dirname(OLD_SRC))) {
  for (const file of readdirSync(dirname(OLD_SRC))) {
    copyFileSync(join(dirname(OLD_SRC), file), join(OLD_HOME, 'lib', file))
  }
}
function cleanupOldHome() {
  try { rmSync(OLD_HOME, { recursive: true, force: true }) } catch { /* 清理失败不判红 */ }
}

const SESSION_QUERY = 'session-p222-current'
const SESSION_B = 'session-391-0a898fc33f8e'
const SESSION_C = 'session-0b48c8ccea4f4f378689b2704e6ee5cb'
const QUERY = 'P222 查询：家里的猫喜欢挑有日光的窗边打盹，怎么喊都不理人。'
const INJECTION_RE = /^- \[(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d)\] \((0\.\d{3}), ([0-9a-f]{8})\) (.+)$/

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
  return current
}
function parseInjection(text) {
  const lines = text.split(NL).filter((line) => line.length > 0)
  const title = lines[0] ?? ''
  const parsed = []
  const unmatched = []
  for (const line of lines.slice(1)) {
    const m = INJECTION_RE.exec(line)
    if (m) parsed.push({ ts: m[1], score: m[2], src: m[3], content: m[4], raw: line })
    else unmatched.push(line)
  }
  return { title, parsed, unmatched }
}
function parseGateKept(line) {
  const m = /candidates=(\d+) kept=(\d+) blocked=(\d+) truncated=(\d+)/.exec(line)
  return m ? { candidates: Number(m[1]), kept: Number(m[2]), blocked: Number(m[3]), truncated: Number(m[4]) } : null
}
function shortOf(sessionId) {
  return sessionId.slice(sessionId.lastIndexOf('-') + 1).slice(0, 8)
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
function seedRowsPlain(dbPath, contents, sessionId) {
  const db = new DatabaseSync(dbPath)
  try {
    const stmt = db.prepare(
      'INSERT INTO memories(session_id, source_event_seq, content, created_at) VALUES(?,?,?,?)',
    )
    contents.forEach((content, i) => stmt.run(sessionId, i + 1, content, '2026-11-01 00:00:00'))
  } finally {
    db.close()
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 前置：部署件、改前件、embedding 模块
// ══════════════════════════════════════════════════════════════════════════
const deployedIndex = join(DEPLOYED, 'lib', 'index.js')
const deployedRecall = join(DEPLOYED, 'lib', 'recall.js')
const sourceIndex = join(PLUGIN, 'lib', 'index.js')
const sourceRecall = join(PLUGIN, 'lib', 'recall.js')
if (!existsSync(deployedIndex) || !existsSync(deployedRecall) || !existsSync(sourceIndex) || !existsSync(OLD_SRC)) {
  console.error('[P222] ❌ 前置缺失：部署件／源码产物／改前件（old-lib）不存在')
  cleanupOldHome()
  saveJson('findings.json', findings)
  process.exit(2)
}
const plugin = await import(pathToFileURL(deployedIndex).href)
const oldPlugin = await import(pathToFileURL(join(OLD_HOME, 'lib', 'index.js')).href)
const recall = await import(pathToFileURL(deployedRecall).href)
const embedding = await import(pathToFileURL(join(DEPLOYED, 'lib', 'embedding.js')).href)

const deployedText = readFileSync(deployedIndex, 'utf8')
const indexSame = sha256File(sourceIndex) === sha256File(deployedIndex)
const recallSame = sha256File(sourceRecall) === sha256File(deployedRecall)
saveJson('W-0-deploy.json', {
  sourceIndex, deployedIndex, sourceRecall, deployedRecall,
  sourceIndexSha: sha256File(sourceIndex), deployedIndexSha: sha256File(deployedIndex),
  sourceRecallSha: sha256File(sourceRecall), deployedRecallSha: sha256File(deployedRecall),
  indexSame, recallSame,
})
judge('W-0-deployed-same-sha', indexSame && recallSame,
  `部署件与源码产物：index.js 同 sha=${indexSame}，recall.js 同 sha=${recallSame}（${deployedIndex}）`)
if (!indexSame || !recallSame) {
  console.error('[P222] ❌ 部署件未同步：停手')
  cleanupOldHome()
  saveJson('findings.json', findings)
  process.exit(2)
}

const embedder = embedding.createEmbedder({ modelId: MODEL_ID, cacheDir: MODEL_DIR })
const queryVector = await embedder.encode(QUERY)

// ══════════════════════════════════════════════════════════════════════════
// 语义路（新件）：两条不同会话的候选 ⇒ 验证 W-1／W-2／W-3／W-5／W-6
// ══════════════════════════════════════════════════════════════════════════
const LABELS = [
  { text: 'P222-L1：语义最相关（0.95）', cos: 0.95, session: SESSION_B },
  { text: 'P222-L2：次相关（0.80）', cos: 0.80, session: SESSION_C },
  { text: 'P222-L3：应被挡（0.70）', cos: 0.70, session: SESSION_B },
  { text: 'P222-L4：低分噪声（0.60）', cos: 0.60, session: SESSION_C },
  { text: 'P222-L5：更低分（0.55）', cos: 0.55, session: SESSION_B },
]

async function phaseSemantic(tag, pluginToUse, labels = LABELS) {
  const home = makeHome(tag)
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const gateLog = join(home, 'gate.log')
  const ctx = applyPlugin(pluginToUse, {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallGateLogPath: gateLog,
    recallLimit: 6,
    recallDelta: 0.20,
  })
  const vectors = labels.map((l, i) => vectorWithCosine(queryVector, l.cos, i + 1))
  try {
    seedRows(dbPath, labels.map((l, i) => ({
      sessionId: l.session,
      seq: i + 1,
      content: l.text,
      embedding: recall.encodeVector(vectors[i]),
    })))
    emitUserMessage(ctx, SESSION_QUERY, 1, QUERY)
    const assembly = await runAssembly(ctx, SESSION_QUERY)
    const rows = dbAll(dbPath, 'SELECT id, session_id, content FROM memories ORDER BY id')
    const gateLines = logLines(gateLog)
    return { home, dbPath, assembly, rows, gateLine: gateLines[gateLines.length - 1] ?? '', gateLines }
  } finally {
    ctx.dispose()
  }
}

const after = await phaseSemantic('semantic-after', plugin)
save('semantic-after-context.txt', after.assembly.contexts.find((c) => c.name === RECALL_NAME)?.text ?? '')
const parsed = parseInjection(after.assembly.contexts.find((c) => c.name === RECALL_NAME)?.text ?? '')
const kept = parseGateKept(after.gateLine)
const idByContent = new Map(after.rows.map((row) => [row.content, row.id]))
const rowById = new Map(after.rows.map((row) => [row.id, row]))

// W-1 字段可见且格式可解
judge('W-1-fields-visible',
  parsed.unmatched.length === 0
    && parsed.parsed.length > 0
    && kept !== null
    && parsed.parsed.length === kept.kept
    && parsed.title === `${RECALL_TITLE_PREFIX}（语义 top-${kept.kept}）`,
  `注入 ${parsed.parsed.length} 行（gate kept=${kept?.kept ?? '?'}）；全部匹配格式=${parsed.unmatched.length === 0}；标题=「${parsed.title}」`)

// W-2 分数值正确（同一来源 cosineTopK）
const vectorRows = dbAll(
  after.dbPath,
  'SELECT id, session_id, content, created_at, embedding FROM memories WHERE embedding IS NOT NULL AND session_id <> ? ORDER BY id DESC',
  SESSION_QUERY,
)
const scoredAll = recall.cosineTopK(vectorRows, queryVector, vectorRows.length)
const scoreById = new Map(scoredAll.map((entry) => [entry.row.id, entry.score]))
const scoreChecks = parsed.parsed.map((p) => {
  const id = idByContent.get(p.content)
  const expected = scoreById.get(id)
  return {
    content: p.content,
    id,
    textScore: p.score,
    expectedScore: expected === undefined ? null : expected.toFixed(3),
    ok: expected !== undefined && p.score === expected.toFixed(3),
  }
})
saveJson('W-2-scores.json', scoreChecks)
judge('W-2-score-correct', scoreChecks.every((check) => check.ok),
  `逐条比对 ${scoreChecks.length} 条：${scoreChecks.map((c) => `${c.textScore}/${c.expectedScore}`).join('，')}（文本分数／cosineTopK toFixed(3)）`)

// W-3a 来源可追（JS 映射 ＋ SQL substr）
const sourceChecks = parsed.parsed.map((p) => {
  const id = idByContent.get(p.content)
  const row = rowById.get(id)
  const expectedSrc = row ? shortOf(row.session_id) : null
  const sqlHits = dbAll(after.dbPath, 'SELECT DISTINCT session_id FROM memories WHERE instr(session_id, ?) > 0', p.src)
    .map((r) => r.session_id)
  return {
    content: p.content,
    src: p.src,
    expectedSrc,
    sessionId: row?.session_id ?? null,
    sqlHits,
    ok: row !== undefined && p.src === expectedSrc && sqlHits.includes(row.session_id),
  }
})
saveJson('W-3a-sources.json', sourceChecks)
judge('W-3a-source-traceable', sourceChecks.every((check) => check.ok),
  `逐条反查 ${sourceChecks.length} 条：${sourceChecks.map((c) => `${c.src}→${c.sessionId}`).join('，')}（src 均能在库中 substr 命中且等于取法结果）`)

// W-3b 可别性：两个不同会话 ⇒ src 不同
const srcSet = new Set(parsed.parsed.map((p) => p.src))
const sessionSet = new Set(sourceChecks.map((c) => c.sessionId))
judge('W-3b-distinguishable',
  srcSet.size >= 2 && sessionSet.size >= 2 && srcSet.size === sessionSet.size,
  `注入行 src=${JSON.stringify([...srcSet])}；对应 session_id=${JSON.stringify([...sessionSet])}（src 数=${srcSet.size}，会话数=${sessionSet.size}）`)

// W-5 位置约束
const contextText = after.assembly.contexts.find((c) => c.name === RECALL_NAME)?.text ?? ''
const sectionsHit = after.assembly.sections.filter((entry) => String(entry?.text ?? '').includes(RECALL_TITLE_PREFIX))
const contextsHit = after.assembly.contexts.filter((entry) => String(entry?.text ?? '').includes(RECALL_TITLE_PREFIX))
const injectSectionDefaultFalse = deployedText.includes('injectSection: false')
saveJson('W-5-assembly.json', {
  sections: after.assembly.sections,
  contexts: after.assembly.contexts.map((entry) => ({ name: entry.name, head: String(entry.text ?? '').slice(0, 40) })),
  sectionsHit: sectionsHit.length,
  contextsHit: contextsHit.length,
  injectSectionDefaultFalse,
})
judge('W-5-context-only',
  sectionsHit.length === 0 && contextsHit.length === 1 && injectSectionDefaultFalse,
  `sections 命中标题前缀=${sectionsHit.length}；contexts 命中=${contextsHit.length}；部署件 injectSection 默认 false=${injectSectionDefaultFalse}`)

// W-6 不新增泄露
const blockedRows = after.rows.filter((row) => !parsed.parsed.some((p) => p.content === row.content))
const leaks = []
for (const row of after.rows) {
  if (contextText.includes(row.session_id)) leaks.push(`完整 session_id：${row.session_id}`)
}
for (const row of blockedRows) {
  if (contextText.includes(row.content)) leaks.push(`被挡正文：${row.content}`)
}
if (/undefined|null|NaN/.test(contextText)) leaks.push('出现 undefined/null/NaN')
saveJson('W-6-leaks.json', { leaks, blockedContents: blockedRows.map((r) => r.content) })
judge('W-6-no-new-leak', leaks.length === 0, leaks.length === 0
  ? `无完整 session_id、无被挡正文（${blockedRows.length} 条）、无 undefined/null/NaN`
  : `泄露项：${leaks.join('；')}`)

// ══════════════════════════════════════════════════════════════════════════
// C 组（2026-11-01 三处补洞）：src 退化形态守卫
// ══════════════════════════════════════════════════════════════════════════
// C-1 正常形态不变：真实 session_id 的取法结果与 ②.2.2 基线一致
const normalSrcByContent = new Map(parsed.parsed.map((p) => [p.content, p.src]))
const c1 = [
  { content: LABELS[0].text, expected: '0a898fc3' },
  { content: LABELS[1].text, expected: '0b48c8cc' },
].map((item) => ({ ...item, actual: normalSrcByContent.get(item.content), ok: normalSrcByContent.get(item.content) === item.expected }))
saveJson('C-1-normal-src.json', c1)
judge('C-1-normal-src-unchanged', c1.every((item) => item.ok),
  `正常形态：${c1.map((item) => `${item.expected}→${item.actual ?? '（缺）'}`).join('，')}（期望与 ②.2.2 基线一致）`)

// 退化样本：末段不是 8 位小写 hex ⇒ 必须走 sha256 前 8 位
const DEG_LABELS = [
  { text: 'P222-D1：退化会话最相关（0.95）', cos: 0.95, session: 'seed-session' },
  { text: 'P222-D2：另一退化会话（0.80）', cos: 0.80, session: 'seed-session-b' },
  { text: 'P222-D3：应被挡（0.70）', cos: 0.70, session: 'seed-session' },
]
const degenerate = await phaseSemantic('degenerate', plugin, DEG_LABELS)
const degText = degenerate.assembly.contexts.find((c) => c.name === RECALL_NAME)?.text ?? ''
save('C-degenerate-context.txt', degText)
const degParsed = parseInjection(degText)
const degKept = parseGateKept(degenerate.gateLine)
const degSrcByContent = new Map(degParsed.parsed.map((p) => [p.content, p.src]))
const c2 = [
  { content: DEG_LABELS[0].text, expected: '70f6bbd7' },
  { content: DEG_LABELS[1].text, expected: '3a88e3f7' },
].map((item) => ({ ...item, actual: degSrcByContent.get(item.content), ok: degSrcByContent.get(item.content) === item.expected }))
saveJson('C-2-degenerate-src.json', { checks: c2, parsed: degParsed.parsed, gateLine: degenerate.gateLine })
judge('C-2-degenerate-sha256', c2.every((item) => item.ok),
  `退化形态：${c2.map((item) => `${item.content.slice(0, 12)}… expected=${item.expected} actual=${item.actual ?? '（缺）'}`).join('；')}（sha256(session_id) 前 8）`)

// C-3 负证：两个不同退化 id ⇒ src 必须不同（防塌成同一个值）
const degSrcSet = new Set(c2.map((item) => item.actual))
judge('C-3-degenerate-distinct', degSrcSet.size === 2 && c2.every((item) => item.actual !== undefined),
  `两个退化 session（seed-session / seed-session-b）⇒ src=${JSON.stringify([...degSrcSet])}（须 2 个不同值）`)

// C-4 格式仍合规：每一行仍匹配 ②.2.2 的注入格式正则
judge('C-4-degenerate-format',
  degParsed.unmatched.length === 0
    && degParsed.parsed.length === (degKept?.kept ?? -1)
    && degParsed.parsed.every((p) => /^[0-9a-f]{8}$/.test(p.src)),
  `退化臂注入 ${degParsed.parsed.length} 行（gate kept=${degKept?.kept ?? '?'}）；未匹配=${degParsed.unmatched.length}；src 全为 8 位 hex=${degParsed.parsed.every((p) => /^[0-9a-f]{8}$/.test(p.src))}`)

// ══════════════════════════════════════════════════════════════════════════
// 改前注入块（旧件，同一装置）——W-4 的「改前」参照
// ══════════════════════════════════════════════════════════════════════════
const before = await phaseSemantic('semantic-before', oldPlugin)
save('semantic-before-context.txt', before.assembly.contexts.find((c) => c.name === RECALL_NAME)?.text ?? '')

// ══════════════════════════════════════════════════════════════════════════
// 降级路（W-4）：模型未就绪 ⇒ 时间倒序；改前／改后逐字相同
// ══════════════════════════════════════════════════════════════════════════
const DEGRADED_SEEDS = [
  'P222 降级种子一：今天的待办清单还剩三件没有勾掉。',
  'P222 降级种子二：窗外的雨从下午一直下到傍晚。',
  'P222 降级种子三：冰箱里还有半盒没吃完的草莓。',
  'P222 降级种子四：地铁上读完了那本小说的最后一章。',
  'P222 降级种子五：手机电量到百分之二十的时候开始焦虑。',
  'P222 降级种子六：楼下便利店的关东煮换了新的汤底。',
  'P222 降级种子七：快递柜的取件码发到了旧手机上。',
  'P222 降级种子八：明天上午的会议改到了线上。',
]

async function phaseDegraded(tag, pluginToUse) {
  const home = makeHome(tag)
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const emptyCache = join(TEMP_ROOT, 'empty-cache')
  mkdirSync(emptyCache, { recursive: true })
  const ctx = applyPlugin(pluginToUse, {
    dbPath,
    modelCacheDir: emptyCache,
    degradedLogPath: degradedLog,
    recallLimit: 8,
  })
  try {
    seedRowsPlain(dbPath, DEGRADED_SEEDS, SESSION_C)
    emitUserMessage(ctx, SESSION_QUERY, 1, 'P222 降级查询句：这条不应改写回退结果。')
    const assembly = await runAssembly(ctx, SESSION_QUERY)
    return { text: assembly.contexts.find((c) => c.name === RECALL_NAME)?.text ?? '', degraded: logLines(degradedLog), assembly }
  } finally {
    ctx.dispose()
  }
}

const EMPTY_CACHE = join(TEMP_ROOT, 'empty-cache')
mkdirSync(EMPTY_CACHE, { recursive: true })
const modelReadyInEmptyCache = embedding.isModelReady(EMPTY_CACHE, MODEL_ID)
if (modelReadyInEmptyCache) {
  console.error('[P222] ❌ 前置失效：空 cache 下模型仍被判 ready，W-4 降级臂无法构造')
  cleanupOldHome()
  saveJson('findings.json', findings)
  process.exit(2)
}
const oldEndpoint = process.env.HF_ENDPOINT
process.env.HF_ENDPOINT = 'http://127.0.0.1:9' // 下载不可达，后台预取快速失败（召回路径不等它）
const degBefore = await phaseDegraded('degraded-before', oldPlugin)
const degAfter = await phaseDegraded('degraded-after', plugin)
if (oldEndpoint === undefined) delete process.env.HF_ENDPOINT
else process.env.HF_ENDPOINT = oldEndpoint

save('degraded-before-context.txt', degBefore.text)
save('degraded-after-context.txt', degAfter.text)
const degLineOk = degAfter.text.split(NL).filter((line) => line.startsWith('- [')).every((line) => {
  const payload = line.slice(line.indexOf('] ') + 2)
  return payload.length > 0 && !payload.startsWith('(')
})
const noScoreResidue = !/\(\d\.\d{3}/.test(degAfter.text) && !degAfter.text.includes('no-score') && !degAfter.text.includes('unknown0')
judge('W-4-degraded-unchanged',
  degBefore.text === degAfter.text && degAfter.text.length > 0 && degLineOk && noScoreResidue,
  `降级路全文改前／改后逐字相同=${degBefore.text === degAfter.text}；行格式无分数残留=${degLineOk && noScoreResidue}；行数=${degAfter.text.split(NL).filter((l) => l.startsWith('- [')).length}；degraded 行=${degAfter.degraded.length}`)

saveJson('findings.json', findings)
console.log(`${NL}summary: ${findings.filter((f) => f.ok).length}/${findings.length} PASS；证据目录 ${EVIDENCE}`)
if (KEEP_TEMP) console.log(`P222_KEEP_TEMP=1 ⇒ 保留 ${TEMP_ROOT}`)
else rmSync(TEMP_ROOT, { recursive: true, force: true })

const failed = findings.filter((item) => !item.ok)
cleanupOldHome()
process.exit(failed.length === 0 ? 0 : 1)
