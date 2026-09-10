/**
 * DSH-2.5 task 5 (TS side): embed the SAME fixed text batch with transformers.js
 * (ONNX Runtime), matching the shipped Python stack's preprocessing exactly:
 *   - same model: bge-small-zh-v1.5 (Chinese BGE small)
 *   - same pooling: CLS token (position 0)
 *   - same post-processing: L2 normalize
 *   - same max_length: 512
 *
 * The TS side is ONNX (no PyTorch in Node); that implementation difference is
 * exactly what the drift measurement is meant to quantify.
 *
 * Run:  node ts-embed.mjs <out.json>
 */
import { writeFileSync } from 'node:fs'
import { AutoTokenizer, AutoModel, env } from '@huggingface/transformers'

const TEXTS = [
  '你好，世界',
  'LarryAgent 是一个本地 AI 助手项目',
  '记忆检索使用向量相似度',
  '用户偏好：喜欢简洁的回答',
  '今天天气不错，适合出门散步',
  'The quick brown fox jumps over the lazy dog',
  '向量维度必须与 embedding 模型一致',
  '2026-09-10 15:30:00',
  '混合 English 和中文 的 sentence',
  '数据库使用 SQLite 和 ChromaDB 双写',
  '这是一个比较长的句子，用来测试模型在处理较长文本时的向量稳定性，包含多个从句、修饰成分以及一些重复出现的词汇，例如记忆、检索、向量、相似度等术语。',
  '短',
  '空字符串的邻居',
  '开饭啦',
]

const MODEL = 'Xenova/bge-small-zh-v1.5'
const outPath = process.argv[2] ?? 'ts-vectors.json'

// Mirror for mainland network (transformers.js honors env.remoteHost).
env.remoteHost = process.env.HF_ENDPOINT ?? 'https://hf-mirror.com'
env.allowLocalModels = true
env.useBrowserCache = false

const t0 = Date.now()
const tokenizer = await AutoTokenizer.from_pretrained(MODEL)
const model = await AutoModel.from_pretrained(MODEL, { dtype: 'fp32' })
const loadSeconds = (Date.now() - t0) / 1000

const t1 = Date.now()
// Python's sentence-transformers config sets do_lower_case: true (see
// sentence_bert_config.json); transformers.js does not lowercase on its own, so
// match it explicitly — otherwise Latin-script inputs tokenize differently.
const inputs = await tokenizer(TEXTS.map(t => t.toLowerCase()), { padding: true, truncation: true, max_length: 512 })
const { last_hidden_state: hidden } = await model(inputs)
const [batch, seq, dim] = hidden.dims
const data = hidden.data
const encodeSeconds = (Date.now() - t1) / 1000

const vectors = []
for (let b = 0; b < batch; b++) {
  const v = new Float32Array(dim)
  const offset = b * seq * dim
  for (let d = 0; d < dim; d++) v[d] = data[offset + d] // CLS pooling
  let norm = 0
  for (let d = 0; d < dim; d++) norm += v[d] * v[d]
  norm = Math.sqrt(norm)
  const out = new Array(dim)
  for (let d = 0; d < dim; d++) out[d] = v[d] / norm // L2 normalize
  vectors.push(out)
}

const payload = {
  side: 'typescript',
  stack: 'transformers.js (ONNX Runtime)',
  model: MODEL,
  dtype: 'fp32',
  dim,
  normalize: true,
  pooling: 'cls',
  load_seconds: Number(loadSeconds.toFixed(3)),
  encode_seconds: Number(encodeSeconds.toFixed(3)),
  texts: TEXTS,
  vectors,
}
writeFileSync(outPath, JSON.stringify(payload), 'utf8')
console.log(`ts side: dim=${dim} texts=${TEXTS.length} load=${loadSeconds.toFixed(2)}s encode=${encodeSeconds.toFixed(2)}s -> ${outPath}`)
