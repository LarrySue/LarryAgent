#!/usr/bin/env node
/**
 * P0② · 真实 dsh 装配面端到端验证（0 token）
 *
 * 目的：探针里的 fake ctx 只能验插件自己的监听器逻辑，不能证明
 * `ctx.on('system-prompt/assemble')` 这个 **全局** 监听器在真实 cordis 通道上会收到
 * scoped assembly。本脚本用实际 profile 副本 ＋ SDK 客户端跑一轮无 key 会话：
 *   - 预置 24 行（id=1 语义最相关、时间最早）＋ 已算好的向量；
 *   - prompt 作为 query；
 *   - 断言 system/message 帧与 context 面 synthetic 帧里出现「语义 top-」，
 *     且目标 id=1 的正文进入召回块。
 * ⛔ 无 key、0 token；临时 home，不碰真库。
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const DEPLOYED = join(SRC_SDK, 'node_modules', '@larryagent', 'plugin-s4-memory')
const MODEL_ID = 'Xenova/bge-small-zh-v1.5'
const MODEL_DIR = 'D:/Code/_models'
const EVIDENCE = process.env.P02_EVIDENCE_DIR ?? 'D:/Code/_trae-evidence/p02-vector-recall'
const KEEP_HOME = (process.env.P02_KEEP_HOME ?? '0') === '1'

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

const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id}  ${detail}`)
}

mkdirSync(EVIDENCE, { recursive: true })
const home = mkdtempSync(join(tmpdir(), 'p02-dsh-'))
mkdirSync(join(home, 'profiles'), { recursive: true })
cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })

const dbPath = join(home, 'memory.db')
const patchPath = join(home, 'profiles', 'sdk', 'cordis.patch.yml')
const patchText = readFileSync(patchPath, 'utf8')
const patched = patchText.replace(/dbPath:\s*'[^']*'/g, `dbPath: '${dbPath.replaceAll('\\', '/')}'`)
if (patched === patchText) {
  console.error('[P02-dsh] ❌ 前置：profile patch 里没找到 dbPath 可改')
  process.exit(2)
}
writeFileSync(patchPath, patched, 'utf8')

// 先算向量（父进程，部署件 embedding 模块；与插件同一预处理）
const embedding = await import(pathToFileURL(join(DEPLOYED, 'lib', 'embedding.js')))
const recall = await import(pathToFileURL(join(DEPLOYED, 'lib', 'recall.js')))
const embedder = embedding.createEmbedder({ modelId: MODEL_ID, cacheDir: MODEL_DIR })
const vectors = []
for (const content of contents) vectors.push(await embedder.encode(content))

const db = new DatabaseSync(dbPath)
try {
  db.exec(`CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    source_event_seq INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    embedding BLOB
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_session_seq ON memories(session_id, source_event_seq);`)
  const insert = db.prepare('INSERT INTO memories(session_id, source_event_seq, content, embedding) VALUES(?,?,?,?)')
  contents.forEach((content, i) => insert.run('seed-session', i + 1, content, recall.encodeVector(vectors[i])))
} finally {
  db.close()
}

const env = { ...process.env }
delete env.DEEPSEEK_API_KEY
env.CI = '1'

const harness = new DeepSeekHarness({
  profile: 'sdk',
  dshHome: home,
  env,
  provider: 'deepseek-official',
  model: 'deepseek-flash',
  initializeTimeoutMs: 60_000,
  requestTimeoutMs: 120_000,
})

let result
try {
  result = await harness.run(query)
} finally {
  try { await harness.close() } catch { /* 不掩盖主判定 */ }
}

const frameText = (type) => result.events
  .filter((e) => e.type === type)
  .map((e) => (e.data?.message?.content ?? []).map((b) => (b.type === 'text' ? b.text : '')).join(''))
  .join('\n')

const systemText = frameText('system/message')
const contextText = result.events
  .filter((e) => e.type === 'user/message' && e.data?.source?.kind === 'plugin')
  .map((e) => (e.data?.content ?? []).map((b) => (b.type === 'text' ? b.text : '')).join(''))
  .join('\n')

const evidence = {
  dbPath,
  prompt: query,
  targetId: 1,
  systemMessage: systemText,
  pluginContext: contextText,
  eventTypes: [...new Set(result.events.map((e) => e.type))],
}
writeFileSync(join(EVIDENCE, 'P4-dsh-integration.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

judge('P4-dsh-context-face-semantic', contextText.includes('语义 top-') && contextText.includes(target),
  `真实 dsh context 面（synthetic user/message）含「语义 top-」＋目标 id=1 正文（默认注入面）`)
const contextBlockCount = (contextText.match(/## LarryAgent 记忆召回/g) ?? []).length
judge('P4-dsh-single-block', contextBlockCount === 1,
  `context 面召回块标题出现 ${contextBlockCount} 次（替换而非追加）`)

if (!KEEP_HOME) rmSync(home, { recursive: true, force: true })
else console.log(`[P02-dsh] KEEP_HOME=1 ⇒ ${home}`)

const failed = findings.filter((f) => !f.ok).length
console.log(`\n[P02-dsh] ${findings.length} judgments, ${failed} FAIL`)
process.exit(failed ? 1 : 0)
