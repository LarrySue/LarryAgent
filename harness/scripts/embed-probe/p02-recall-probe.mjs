#!/usr/bin/env node
/**
 * P0② 向量召回 · 第一期 · 部署件验收探针
 *
 * 判据权威 = exchange/log-trace.md? ⛔ 不引用活日志（会被清理）；本探针只认
 * exchange/log-trae.md 当时派发节的原文，读数表由调用方回填。
 *
 * 姿态：
 *   - 全部读数从 **同步后的部署件** 取：
 *     .dsh-home/profiles/sdk/node_modules/@larryagent/plugin-s4-memory/lib/*
 *   - fake cordis ctx（effect／on／systemPrompt.context），不 spawn dsh；
 *   - 所有测试库在临时 home 内；真库只用于 P6 负向哨兵（预期 apply 直接 throw，不打开）。
 *   - 模型缓存默认 D:/Code/_models（已有 512 维 bge-small-zh-v1.5，零下载）。
 *
 * 退出码：0 全绿 ／ 1 判据红 ／ 2 前置缺失
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const DEPLOYED = join(REPO, '.dsh-home', 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-s4-memory')
const MODEL_ID = 'Xenova/bge-small-zh-v1.5'
const MODEL_DIR = 'D:/Code/_models'
const RECALL_NAME = 'larry-memory-recall'
const EVIDENCE = process.env.P02_EVIDENCE_DIR ?? 'D:/Code/_trae-evidence/p02-vector-recall'
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'p02-recall-'))
const KEEP_TEMP = (process.env.P02_KEEP_TEMP ?? '0') === '1'
const REAL_DB = join(REPO, '.dsh-home', 'larry-memory.db')

mkdirSync(EVIDENCE, { recursive: true })

const findings = []
const judge = (id, ok, detail, status = ok ? 'PASS' : 'FAIL') => {
  findings.push({ judge: id, ok, status, detail })
  console.log(`${status.padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => judge(id, true, detail, 'OBS')
const save = (name, text) => writeFileSync(join(EVIDENCE, name), text ?? '', 'utf8')
const saveJson = (name, value) => save(name, `${JSON.stringify(value, null, 2)}\n`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

function makeArmHome(tag) {
  return mkdtempSync(join(TEMP_ROOT, `${tag}-`))
}

function dirSize(path) {
  if (!existsSync(path)) return 0
  let total = 0
  const walk = (p) => {
    for (const entry of readdirSync(p, { withFileTypes: true })) {
      const child = join(p, entry.name)
      if (entry.isDirectory()) walk(child)
      else if (entry.isFile()) total += statSync(child).size
    }
  }
  walk(path)
  return total
}

function openDb(path) {
  return new DatabaseSync(path)
}

function dbGet(path, sql, ...params) {
  const db = openDb(path)
  try { return db.prepare(sql).get(...params) } finally { db.close() }
}

function dbAll(path, sql, ...params) {
  const db = openDb(path)
  try { return db.prepare(sql).all(...params) } finally { db.close() }
}

/** 老式 memories 表（无 embedding 列）——顺带验 CREATE TABLE IF NOT EXISTS 的迁移 */
function seedOldSchema(path, contents) {
  const db = openDb(path)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      source_event_seq INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_session_seq ON memories(session_id, source_event_seq);`)
    const insert = db.prepare('INSERT INTO memories(session_id, source_event_seq, content) VALUES(?,?,?)')
    contents.forEach((content, i) => insert.run('seed-session', i + 1, content))
    return Number(db.prepare('SELECT COUNT(*) AS n FROM memories').get().n)
  } finally {
    db.close()
  }
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

/** 用注册的 context provider 生成 fallback 文本，再把装配交给 plugin 的 waterfall 监听器 */
async function runAssembly(ctx, sessionId) {
  const provider = ctx.contexts.find((c) => c.name === RECALL_NAME)
  if (!provider) throw new Error('recall context provider missing')
  const fallback = typeof provider.text === 'function' ? provider.text({}) : provider.text
  let current = {
    sections: [],
    contexts: [{ name: RECALL_NAME, text: fallback }],
    tools: [],
    variables: {},
  }
  const context = { agent: { session: { id: sessionId } } }
  for (const fn of ctx.listeners.get('system-prompt/assemble') ?? []) {
    current = await fn(current, context, async () => current)
  }
  const text = current.contexts.find((c) => c.name === RECALL_NAME)?.text ?? ''
  return { fallback, text, assembly: current }
}

function logLines(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8').split('\n').filter((line) => line.length > 0)
}

async function waitForAllVectors(path, expected, timeoutMs = 120000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    try {
      const row = dbGet(path, 'SELECT COUNT(*) AS n, SUM(embedding IS NOT NULL) AS m FROM memories')
      if (Number(row.n) === expected && Number(row.m) === expected) return true
    } catch { /* DB 暂不可读：继续轮询 */ }
    await sleep(200)
  }
  return false
}

// ══════════════════════════════════════════════════════════════════════════
// 前置：部署件、依赖解析、模型缓存
// ══════════════════════════════════════════════════════════════════════════
const indexJs = join(DEPLOYED, 'lib', 'index.js')
if (!existsSync(indexJs)) {
  console.error(`[P02] ❌ 前置缺失：部署件 ${indexJs}`)
  saveJson('findings.json', findings)
  process.exit(2)
}

const plugin = await import(pathToFileURL(indexJs))
const embedding = await import(pathToFileURL(join(DEPLOYED, 'lib', 'embedding.js')))
const recall = await import(pathToFileURL(join(DEPLOYED, 'lib', 'recall.js')))

const requireFromDeployed = createRequire(pathToFileURL(indexJs))
const transformersEntry = requireFromDeployed.resolve('@huggingface/transformers')
const transformers = await import(pathToFileURL(transformersEntry))
const transformersDefaultCache = transformers.env.cacheDir // ⛔ 必须在任何 embedder 加载前读
const profileCacheDir = join(dirname(transformersEntry), '..', '.cache')
const harnessCacheDir = join(HARNESS, 'node_modules', '@huggingface', 'transformers', '.cache')

// ── P1 · 依赖可达 ─────────────────────────────────────────────────────────
let p1Resolved = ''
let p1Error = ''
try {
  p1Resolved = execFileSync(process.execPath, [
    '--input-type=module',
    '-e',
    "console.log(import.meta.resolve('@huggingface/transformers'))",
  ], { cwd: DEPLOYED, encoding: 'utf8', timeout: 30_000 }).trim()
} catch (err) {
  p1Error = String(err?.stderr ?? err?.message ?? err)
}
save('P1-resolve.txt', p1Resolved || p1Error)
let p1PathOk = false
try { p1PathOk = p1Resolved.startsWith('file://') && existsSync(fileURLToPath(p1Resolved)) } catch { p1PathOk = false }
judge('P1-dependency-reachable', Boolean(p1Resolved) && p1PathOk,
  `from ${DEPLOYED} ⇒ ${p1Resolved || `FAIL ${p1Error}`}`)
if (!(p1Resolved && p1PathOk)) {
  saveJson('findings.json', findings)
  console.error('[P02] ❌ P1 不过闸：停手报矛盾（不继续 P2–P6）')
  process.exit(2)
}

// ── P7 · 部署件同步 ───────────────────────────────────────────────────────
const indexText = readFileSync(indexJs, 'utf8')
const deployedLibFiles = readdirSync(join(DEPLOYED, 'lib')).filter((f) => f.endsWith('.js'))
const sentinelHits = (indexText.match(/p02-vector-recall-v1/g) ?? []).length
const denyIdentifierHits = (indexText.match(/OUTSIDE_HOME_DENY_MARK/g) ?? []).length
saveJson('P7-deployed.json', {
  indexPath: indexJs,
  size: statSync(indexJs).size,
  mtime: statSync(indexJs).mtime.toISOString(),
  sha256: sha256File(indexJs),
  jsFiles: deployedLibFiles,
  sentinelHits,
  denyIdentifierHits,
})
judge('P7-deployed-sentinel', sentinelHits >= 1,
  `部署件 lib/index.js 命中哨兵 p02-vector-recall-v1 ×${sentinelHits}（P1–P6 读数均从该部署件取）`)
judge('P7-isolation-mark-deployed', denyIdentifierHits >= 2,
  `部署件 lib/index.js 命中 OUTSIDE_HOME_DENY_MARK ×${denyIdentifierHits}（10-30 隔离断言已进入运行件）`)

// ── P2 前置 · 模型文件与缓存基线 ──────────────────────────────────────────
const modelReady = embedding.isModelReady(MODEL_DIR, MODEL_ID)
const resolveEmpty = embedding.resolveModelCacheDir('', TEMP_ROOT)
const defaultCache = embedding.defaultModelCacheDir()
const profileBytesBefore = dirSize(profileCacheDir)
const harnessBytesBefore = dirSize(harnessCacheDir)
saveJson('P2-cache-baseline.json', {
  modelDir: MODEL_DIR,
  modelReady,
  resolveEmptyModelCacheDir: resolveEmpty,
  transformersDefaultCache,
  embeddingDefaultModelCacheDir: defaultCache,
  profileCacheDir,
  profileCacheBytesBefore: profileBytesBefore,
  harnessCacheDir,
  harnessCacheBytesBefore: harnessBytesBefore,
  modelFiles: existsSync(join(MODEL_DIR, ...MODEL_ID.split('/'), 'onnx'))
    ? readdirSync(join(MODEL_DIR, ...MODEL_ID.split('/'), 'onnx')).map((f) => ({
      name: f,
      bytes: statSync(join(MODEL_DIR, ...MODEL_ID.split('/'), 'onnx', f)).size,
    }))
    : [],
})
obs('P2-extra-model-cachedir-unset',
  `未配 modelCacheDir ⇒ resolveModelCacheDir('')=${String(resolveEmpty)}；transformers 默认 env.cacheDir=${String(transformersDefaultCache)}；embedding.defaultModelCacheDir()=${String(defaultCache)}`)
if (!modelReady) {
  saveJson('findings.json', findings)
  console.error(`[P02] ❌ 前置缺失：${MODEL_DIR} 下没有完整的 ${MODEL_ID} 模型文件`)
  process.exit(2)
}

// ══════════════════════════════════════════════════════════════════════════
// P3 · 写侧：新记忆入库后同一行带 512 维向量
// ══════════════════════════════════════════════════════════════════════════
async function phaseP3() {
  const home = makeArmHome('p3')
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallLimit: 8,
  })
  try {
    emitUserMessage(ctx, 'p3-session', 1, 'P3 探针：这是一条进入 SQLite 真相源并需要落向量的记忆。')
    const ok = await waitForAllVectors(dbPath, 1, 120_000)
    const stats = dbGet(dbPath,
      "SELECT COUNT(*) AS n, SUM(embedding IS NOT NULL) AS m, MIN(length(embedding)) AS minLen, MAX(length(embedding)) AS maxLen, MIN(typeof(embedding)) AS type FROM memories")
    let norm = 0
    let first = []
    try {
      const row = dbGet(dbPath, 'SELECT embedding FROM memories LIMIT 1')
      const vec = recall.decodeVector(row.embedding)
      if (vec) {
        first = Array.from(vec.slice(0, 4))
        for (const x of vec) norm += x * x
        norm = Math.sqrt(norm)
      }
    } catch { /* 统计不足时下面判红 */ }
    saveJson('P3-row.json', { dbPath, stats, norm, firstFour: first })
    judge('P3-vector-persisted', ok && Number(stats.n) === 1 && Number(stats.m) === 1 &&
      Number(stats.minLen) === 2048 && Number(stats.maxLen) === 2048 && String(stats.type) === 'blob' && norm > 0,
      `memories.embedding BLOB；count(*)=${stats.n}，向量非空=${stats.m}，length=${stats.minLen}/${stats.maxLen}，typeof=${stats.type}，norm=${norm.toFixed(6)}`)
  } finally {
    ctx.dispose()
  }
  return dbPath
}

// ══════════════════════════════════════════════════════════════════════════
// P4 · 语义召回：时间最早、语义最相关的行进 top-3，且时间倒序 >20 位
// ══════════════════════════════════════════════════════════════════════════
async function phaseP4() {
  const target = '我家的橘猫团子最爱趴在朝南的窗台上晒太阳，一晒就是一下午，叫都叫不动。'
  const query = '家里的猫总挑有日光的窗边打盹，赖着不肯走，怎么喊都没反应。'
  const unrelated = [
    '数据库索引优化的第一原则是让查询走对索引，而不是盲目增加索引数量。',
    '今晚的会议纪要在共享文档里更新了三页，重点是把交付时间往后挪了一周。',
    '咖啡豆的烘焙曲线决定风味，浅烘偏酸，深烘偏苦，中烘比较均衡。',
    '周末整理了书柜，把历史类书籍按年代重新排了一遍。',
    '新买的键盘手感偏软，打字速度快了，但误触也跟着变多。',
    '车载导航这次绕开了高速，走乡道反而快了二十分钟。',
    '冰箱里的牛奶过期了两天，倒掉之前先闻了一下，还是扔了。',
    '楼下的桂花开了，晚上回家一路都是甜的。',
    '给阳台的绿萝换了个大盆，根系比想象中长得密。',
    '今天的快递到了三个，其中一个是我等了两周的耳机。',
    '手机相册提醒我去年今天拍过一张山里的云海。',
    '物业通知下周三上午停水检修，记得提前储水。',
    '洗衣机脱水时声音变大，查了说明书才知道是衣物放偏了。',
    '超市的鸡蛋涨价了，促销员说下个月可能还会再涨。',
    '电脑风扇积灰太多，清完之后温度降了七八度。',
    '跑步鞋的鞋底磨平了，教练建议换一双缓震更好的。',
    '公司楼下的便利店换了招牌，关东煮的汤底也换了口味。',
    '雨伞落在出租车后排，打电话过去司机说已经交到公司了。',
    '信用卡账单提醒本月有一笔年费，需要打电话申请减免。',
    '邻居家的狗半夜叫了两次，第二天在电梯里碰到没好意思提。',
    '把旧手机里的照片导进移动硬盘，花了整整一个晚上。',
    '今天的日落比预报的早，站在桥上看完最后一抹橙色。',
    '早餐店新出了豆浆油条套餐，排队的人比平时多了一倍。',
  ]
  const contents = [target, ...unrelated]
  const home = makeArmHome('p4')
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const seeded = seedOldSchema(dbPath, contents)
  const ctx = applyPlugin(plugin, {
    dbPath,
    modelCacheDir: MODEL_DIR,
    degradedLogPath: degradedLog,
    recallLimit: 8,
  })
  try {
    const backfilled = await waitForAllVectors(dbPath, seeded, 180_000)
    emitUserMessage(ctx, 'p4-query', 999, query)

    // 直接判据（可复算）：query 向量 + 库内向量 → cosine top-k
    const embedder = embedding.createEmbedder({ modelId: MODEL_ID, cacheDir: MODEL_DIR })
    const queryVector = await embedder.encode(query)
    const vectorRows = dbAll(dbPath, 'SELECT id, content, created_at, embedding FROM memories WHERE embedding IS NOT NULL ORDER BY id DESC')
    const top = recall.cosineTopK(vectorRows, queryVector, 8)
    const topIds = top.map((r) => r.id)
    const timeOrderIds = dbAll(dbPath, 'SELECT id FROM memories ORDER BY id DESC').map((r) => r.id)
    const timeRank = timeOrderIds.indexOf(1) + 1
    saveJson('P4-topk.json', {
      targetId: 1,
      query,
      seeded,
      backfilled,
      topIds,
      topContents: top.map((r) => r.content.slice(0, 60)),
      timeOrderRankOfTarget: timeRank,
      timeOrderIds,
    })
    judge('P4-semantic-top3', topIds.slice(0, 3).includes(1),
      `query「${query.slice(0, 24)}…」⇒ top-3 ids=${JSON.stringify(topIds.slice(0, 3))}，目标 id=1 ${topIds.slice(0, 3).includes(1) ? '在' : '不在'} top-3`)
    judge('P4-time-order-contrapositive', timeRank > 20,
      `同一目标按时间倒序排第 ${timeRank} 位（>20）⇒ 新旧口径结果可区分，不是"没改也成立"`)
    judge('P4-old-schema-migration-ok', backfilled && seeded === contents.length,
      `无 embedding 列的老 schema 共 ${seeded} 行 ⇒ apply 后幂等迁移＋回填 ${backfilled ? '全部完成' : '未完成'}`)

    // 装配侧：同一 query 必须让注入条变成语义 top-k
    const assembly = await runAssembly(ctx, 'p4-query')
    const semanticText = assembly.text
    save('P4-assembly-context.txt', semanticText)
    const semanticLineCount = semanticText.split('\n').filter((line) => line.startsWith('- [')).length
    judge('P4-assembly-semantic-text', semanticText.includes('语义 top-') && semanticText.includes(target),
      `装配注入条含「语义 top-」且含目标 id=1 的正文；行数=${semanticLineCount}`)
  } finally {
    ctx.dispose()
  }
  return dbPath
}

// ══════════════════════════════════════════════════════════════════════════
// P5 · 降级：未就绪直接回时间倒序，不抛错，不阻塞；三故障各一次
// ══════════════════════════════════════════════════════════════════════════
const P5_SEEDS = [
  'P5 种子一：今天的待办清单还剩三件没有勾掉。',
  'P5 种子二：窗外的雨从下午一直下到傍晚。',
  'P5 种子三：冰箱里还有半盒没吃完的草莓。',
  'P5 种子四：地铁上读完了那本小说的最后一章。',
  'P5 种子五：手机电量到百分之二十的时候开始焦虑。',
  'P5 种子六：楼下便利店的关东煮换了新的汤底。',
  'P5 种子七：快递柜的取件码发到了旧手机上。',
  'P5 种子八：明天上午的会议改到了线上。',
]

async function phaseP5(tag, pluginToUse, configOverrides, setup) {
  const home = makeArmHome(tag)
  process.env.DSH_HOME = home
  const dbPath = join(home, 'memory.db')
  const degradedLog = join(home, 'degraded.log')
  const seeded = seedOldSchema(dbPath, P5_SEEDS)
  if (setup) setup(home)
  const ctx = applyPlugin(pluginToUse, {
    dbPath,
    degradedLogPath: degradedLog,
    recallLimit: 8,
    ...configOverrides,
  })
  try {
    emitUserMessage(ctx, `${tag}-session`, 1, `P5 ${tag} 的查询句：这条不应改写回退结果。`)
    const t0 = performance.now()
    const assembly = await runAssembly(ctx, `${tag}-session`)
    const elapsedMs = performance.now() - t0
    const lines = assembly.text.split('\n').filter((l) => l.startsWith('- ['))
    const warnLines = logLines(degradedLog)
    save(`${tag}-context.txt`, assembly.text)
    save(`${tag}-degraded.log`, warnLines.join('\n') + (warnLines.length ? '\n' : ''))
    saveJson(`${tag}-reading.json`, { dbPath, seeded, elapsedMs, warnLines, fallbackLines: lines.length })
    judge(`${tag}-fallback-time-order`,
      !assembly.text.includes('语义 top-') && lines.length === 8 && seeded === 8,
      `调用方拿到 ${lines.length} 条时间倒序（种子 ${seeded} 条）；标题未变语义 → 回退成立`)
    judge(`${tag}-one-warn`,
      warnLines.length === 1 && warnLines[0].includes(plugin.DEGRADED_MARK) &&
      warnLines[0].includes(plugin.EMBED_RECALL_FALLBACK) && warnLines[0].includes(plugin.P02_DEPLOY_SENTINEL),
      `降级日志 ${warnLines.length} 行，含 DEGRADED_MARK ＋ EMBED_RECALL_FALLBACK ＋ 哨兵`)
    judge(`${tag}-wall-time`, elapsedMs <= 1000,
      `一次召回墙上时间 ${elapsedMs.toFixed(1)}ms ≤ 1000ms（未阻塞等待加载）`)
  } finally {
    ctx.dispose()
  }
  return dbPath
}

// ══════════════════════════════════════════════════════════════════════════
// P6 · Tier0 红线 4：临时库 ＋ 一次真库负向哨兵
// ══════════════════════════════════════════════════════════════════════════
function phaseP6(tempDbPaths) {
  const home = makeArmHome('p6')
  const negativeScript = join(home, 'p6-negative.mjs')
  const script = `
import { pathToFileURL } from 'node:url'
const plugin = await import(pathToFileURL(${JSON.stringify(indexJs)}))
try {
  plugin.apply({}, { dbPath: ${JSON.stringify(REAL_DB)} })
  console.error('NO_THROW')
  process.exit(0)
} catch (err) {
  console.error('DENIED ' + (err && err.message ? err.message : String(err)))
  process.exit(1)
}
`
  writeFileSync(negativeScript, script, 'utf8')
  const hashBefore = existsSync(REAL_DB) ? sha256File(REAL_DB) : null
  let status = 0
  let stderr = ''
  try {
    execFileSync(process.execPath, [negativeScript], {
      env: { ...process.env, DSH_HOME: home },
      encoding: 'utf8',
      timeout: 30_000,
    })
  } catch (err) {
    status = err?.status ?? 1
    stderr = String(err?.stderr ?? err?.message ?? err)
  }
  const hashAfter = existsSync(REAL_DB) ? sha256File(REAL_DB) : null
  const assertionLine = readFileSync(indexJs, 'utf8').split('\n')
    .findIndex((line) => line.includes('isWithin(home, dbPath)')) + 1
  save('P6-negative.txt', `exit=${status}\n${stderr}`)
  saveJson('P6-db-paths.json', {
    tempRoot: TEMP_ROOT,
    tempDbPaths,
    allUnderTemp: tempDbPaths.every((p) => p.startsWith(TEMP_ROOT)),
    realDb: REAL_DB,
    realDbHashBefore: hashBefore,
    realDbHashAfter: hashAfter,
    assertionLine,
  })
  judge('P6-temp-db-isolation', tempDbPaths.every((p) => p.startsWith(TEMP_ROOT)),
    `P3/P4/P5 测试库全部在临时目录 ${TEMP_ROOT}（${tempDbPaths.length} 个）`)
  judge('P6-real-db-negative-sentinel',
    status !== 0 && stderr.includes(plugin.OUTSIDE_HOME_DENY_MARK) && hashBefore === hashAfter,
    `故意指向真库 ⇒ exit=${status}，stderr 含 OUTSIDE_HOME_DENY_MARK；真库 sha256 前后${hashBefore === hashAfter ? '相同' : '不同'}；断言在部署件 lib/index.js:${assertionLine}`)
}

// ══════════════════════════════════════════════════════════════════════════
// main
// ══════════════════════════════════════════════════════════════════════════
const tempDbPaths = []
try {
  tempDbPaths.push(await phaseP3())
  tempDbPaths.push(await phaseP4())

  // P2 正向：模型从配置 cacheDir 加载后，两份 node_modules/.cache 大小不变
  const profileAfter = dirSize(profileCacheDir)
  const harnessAfter = dirSize(harnessCacheDir)
  judge('P2-model-cache-dir-respected',
    profileAfter === profileBytesBefore && harnessAfter === harnessBytesBefore,
    `node_modules/.cache 大小不变：profile ${profileBytesBefore}B→${profileAfter}B，harness ${harnessBytesBefore}B→${harnessAfter}B；模型只从 ${MODEL_DIR} 读取`)
  saveJson('P2-cache-after.json', {
    profileCacheBytesAfter: profileAfter,
    harnessCacheBytesAfter: harnessAfter,
    modelReady: embedding.isModelReady(MODEL_DIR, MODEL_ID),
  })

  // P5 三故障臂：放在最后，避免后台预取改写 transformers.env.cacheDir 干扰正向臂
  const oldEndpoint = process.env.HF_ENDPOINT
  process.env.HF_ENDPOINT = 'http://127.0.0.1:9' // 下载不可达，后台预取快速失败（召回路径不等它）
  tempDbPaths.push(await phaseP5('P5a-not-ready', plugin, { modelCacheDir: join(TEMP_ROOT, 'empty-cache') }, (home) => {
    mkdirSync(join(TEMP_ROOT, 'empty-cache'), { recursive: true })
  }))
  if (oldEndpoint === undefined) delete process.env.HF_ENDPOINT
  else process.env.HF_ENDPOINT = oldEndpoint

  // ② import 失败：把部署件复制到临时目录（附近没有 transformers）再 apply
  const copyHome = makeArmHome('p5b-copy')
  const copyPluginDir = join(copyHome, 'plugin-copy')
  mkdirSync(join(copyPluginDir, 'lib'), { recursive: true })
  for (const file of ['index.js', 'embedding.js', 'recall.js', 'index.d.ts', 'embedding.d.ts', 'recall.d.ts']) {
    const src = join(DEPLOYED, 'lib', file)
    if (existsSync(src)) copyFileSync(src, join(copyPluginDir, 'lib', file))
  }
  copyFileSync(join(DEPLOYED, 'package.json'), join(copyPluginDir, 'package.json'))
  const copyPlugin = await import(pathToFileURL(join(copyPluginDir, 'lib', 'index.js')))
  tempDbPaths.push(await phaseP5('P5b-import-fail', copyPlugin, { modelCacheDir: MODEL_DIR }, null))

  // ③ cacheDir 不可写：把 cacheDir 指到普通文件（写入必失败）
  tempDbPaths.push(await phaseP5('P5c-cache-unwritable', plugin, { modelCacheDir: join(TEMP_ROOT, 'cache-is-a-file') }, (home) => {
    writeFileSync(join(TEMP_ROOT, 'cache-is-a-file'), 'not a directory', 'utf8')
  }))

  // P6 放在 P5 之后：临时库清单要覆盖全部臂（P3/P4/P5a/b/c）
  phaseP6(tempDbPaths)

  saveJson('findings.json', findings)
  const failed = findings.filter((f) => f.status === 'FAIL').length
  console.log(`\n[P02] ${findings.length} judgments, ${failed} FAIL; evidence: ${EVIDENCE}`)
  if (!KEEP_TEMP) {
    try { rmSync(TEMP_ROOT, { recursive: true, force: true }) } catch { /* 临时目录清理失败不判红 */ }
  } else {
    console.log(`[P02] KEEP_TEMP=1 ⇒ ${TEMP_ROOT}`)
  }
  process.exit(failed ? 1 : 0)
} catch (err) {
  console.error(`[P02] ❌ 探针异常：${err?.stack ?? err}`)
  saveJson('findings.json', findings)
  if (!KEEP_TEMP) {
    try { rmSync(TEMP_ROOT, { recursive: true, force: true }) } catch { /* ignore */ }
  }
  process.exit(1)
}
