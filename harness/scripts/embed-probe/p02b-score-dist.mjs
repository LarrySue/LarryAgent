/**
 * ②.2.1 前置读数：余弦分数的分布（噪声 vs 相关）
 *
 * 目的：**不猜阈值**。先看三组语料（高相关 / 中相关 / 噪声）与同一 query 的余弦落在哪，
 * 再判「有没有可用阈值」——如果没有清晰间隙，绝对阈值这条路就不可行，得换相对口径。
 *
 * 判据（跑完才判）：
 *   A. 若 max(噪声) < min(高相关) 且间隙 ≥ 0.05 ⇒ 绝对阈值可行，取间隙中点做初值
 *   B. 若噪声与相关**重叠** ⇒ 绝对阈值不可行，记「不可行」，改议相对口径（top1−delta 或 margin）
 *   C. 若噪声 max 接近高相关 min（间隙 < 0.05）⇒ 阈值可设但脆，须标「紧邻带」
 *
 * ⚠️ 只用插件侧同一套 embedding（transformers.js 的 bge-small-zh），不用 Python 侧，
 *    因为决策对象是插件的行为。
 * ⚠️ 本脚本不写任何库、不碰真库，纯内存算分。
 */
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const HARNESS = join(HERE, '..', '..')
const require = createRequire(import.meta.url)

const PLUGIN = join(HARNESS, 'packages', 'plugin-s4-memory', 'lib')
const embedding = require(join(PLUGIN, 'embedding.js'))
const recall = require(join(PLUGIN, 'recall.js'))

const MODEL_DIR = 'D:/Code/_models'
const MODEL_ID = 'Xenova/bge-small-zh-v1.5'
const OUT = process.env.P02B_OUT ?? join(HERE, 'p02b-score-dist.json')

// ── 三组语料：每个用例一个 query ＋ 高相关 / 中相关 / 噪声 ────────────────
// ⚠️ 语料用真实记忆口吻（不是「测试文本1」），否则 embedding 分布失真。
const CASES = [
  {
    name: '召回排除本会话',
    query: '记忆召回怎么排除当前会话',
    high: [
      '召回要按 session_id 过滤，避免把本会话说过的话又捞回来',
      '本会话的消息不该进召回槽，八个槽本来就不够用',
    ],
    mid: [
      '向量召回用余弦相似度取 top-k，不按时间倒序',
      '记忆插件把向量存在 SQLite 的 embedding 列里',
    ],
    noise: [
      '今天的会议纪要在共享文档里更新了三页',
      '咖啡豆的烘焙曲线决定风味，浅烘偏酸',
      '跑步鞋的鞋底磨平了，教练建议换一双缓震更好的',
      '洗衣机脱水时声音变大，查了说明书才知道是衣物放偏了',
      '超市的鸡蛋涨价了，促销员说下个月可能还会再涨',
      '雨伞落在出租车后排，打电话过去司机说已经交到公司了',
    ],
  },
  {
    name: '存档三态',
    query: 'CoT 存档的三态怎么区分',
    high: [
      '三态要分开：上游未返回、上游返回但我方未采、已存',
      '不能把「我方没采到」记成「上游没给」，这是两件事',
    ],
    mid: [
      '推理原文要保留分块和断句，不许为可读性整理',
      '存档落盘要保留原始 JSON，不挑字段不重排',
    ],
    noise: [
      '楼下的便利店换了招牌，关东煮的汤底也换了口味',
      '信用卡账单提醒本月有一笔年费，需要打电话申请减免',
      '邻居家的狗半夜叫了两次，第二天在电梯里碰到没好意思提',
      '把旧手机里的照片导进移动硬盘，花了整整一个晚上',
      '今天的日落比预报的早，站在桥上看完最后一抹橙色',
      '早餐店新出了豆浆油条套餐，排队的人比平时多了一倍',
    ],
  },
  {
    name: '构建与部署',
    query: '本地起前端怎么配代理',
    high: [
      '本地开发要配反向代理，把接口请求转到后端端口',
      '前端 dev server 起在 5173，接口走 proxy 转发到 8000',
    ],
    mid: [
      '打包产物要放到 dist 目录，由后端静态托管',
      '环境变量里的接口地址要和部署环境对齐',
    ],
    noise: [
      '冰箱里的酸奶过期了，只能扔掉',
      '公园的樱花这周开得正好，周末人多得要排队',
      '手机屏幕贴膜进了灰，去店里重新贴了一张',
      '公司楼下的停车场涨价了，一小时多了五块',
      '这本书看到一半才发现是三部曲的第二部',
      '楼上的装修从早上八点开始，电钻声一整天没停',
    ],
  },
]

function stats(arr) {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const sum = s.reduce((a, b) => a + b, 0)
  return {
    n: s.length,
    min: +s[0].toFixed(4),
    max: +s[s.length - 1].toFixed(4),
    mean: +(sum / s.length).toFixed(4),
    median: +s[Math.floor(s.length / 2)].toFixed(4),
  }
}

const embedder = embedding.createEmbedder({ modelId: MODEL_ID, cacheDir: MODEL_DIR })

const results = []
for (const c of CASES) {
  const texts = [c.query, ...c.high, ...c.mid, ...c.noise]
  // ⚠️ 插件侧 encode 只收**单个字符串**（embedding.js:97 `encode: async (text) =>`），
  // 不是批量接口 —— 逐条编码。语料仅 11 条/用例，耗时可忽略。
  const vecs = []
  for (const t of texts) vecs.push(await embedder.encode(t))
  const q = vecs[0]

  // 用插件同一套 cosineTopK 逻辑（把每条当一行，limit 给满）
  const rows = texts.slice(1).map((content, i) => ({
    id: i + 1,
    content,
    created_at: '2026-11-01 00:00:00',
    embedding: recall.encodeVector(vecs[i + 1]),
  }))
  const scored = recall.cosineTopK(rows, q, rows.length)
  const scoreOf = new Map()
  for (const entry of scored) {
    // ②.2.1 起 score 随返回值带出；探针直接用，不再自己补算
    scoreOf.set(entry.row.id, entry.score)
  }

  const group = { high: [], mid: [], noise: [] }
  const detail = []
  texts.slice(1).forEach((t, i) => {
    const id = i + 1
    const s = scoreOf.get(id)
    const kind = i < c.high.length ? 'high' : i < c.high.length + c.mid.length ? 'mid' : 'noise'
    group[kind].push(s)
    detail.push({ kind, score: +s.toFixed(4), text: t.slice(0, 40) })
  })
  detail.sort((a, b) => b.score - a.score)

  const hs = stats(group.high), ms = stats(group.mid), ns = stats(group.noise)
  const gapHighNoise = +(hs.min - ns.max).toFixed(4)   // 高相关最低 − 噪声最高
  const gapMidNoise = ms ? +(ms.min - ns.max).toFixed(4) : null

  let verdict
  if (ns.max < hs.min) {
    verdict = gapHighNoise >= 0.05 ? 'A 绝对阈值可行（间隙≥0.05）' : 'C 可设但脆（间隙<0.05）'
  } else {
    verdict = 'B 噪声与高相关重叠 ⇒ 绝对阈值不可行'
  }

  results.push({ case: c.name, query: c.query, high: hs, mid: ms, noise: ns, gapHighNoise, gapMidNoise, verdict, detail })
  console.log(`\n######## ${c.name}`)
  console.log(`  high : min=${hs.min} max=${hs.max} mean=${hs.mean}`)
  console.log(`  mid  : min=${ms.min} max=${ms.max} mean=${ms.mean}`)
  console.log(`  noise: min=${ns.min} max=${ns.max} mean=${ns.mean}`)
  console.log(`  间隙(high.min − noise.max) = ${gapHighNoise}  |  间隙(mid.min − noise.max) = ${gapMidNoise}`)
  console.log(`  判定：${verdict}`)
  console.log('  排序：')
  for (const d of detail) console.log(`    ${d.score.toFixed(3)}  [${d.kind.padEnd(5)}] ${d.text}`)
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ model: MODEL_ID, results }, null, 2), 'utf8')
console.log(`\n[OUT] ${OUT}`)
