/**
 * DSH-2.5 task 5 (compare): quantify drift between the Python (PyTorch
 * sentence-transformers) and TS (transformers.js ONNX) embeddings of the same
 * batch, and decide whether existing vectors can be reused without re-embedding.
 *
 * Run:  node compare.mjs
 */
import { readFileSync } from 'node:fs'

const A = JSON.parse(readFileSync('python-vectors.json', 'utf8'))
const B = JSON.parse(readFileSync('ts-vectors.json', 'utf8'))

if (A.texts.join('\u0000') !== B.texts.join('\u0000')) {
  console.error('TEXT BATCHES DIFFER — comparison invalid')
  process.exit(1)
}

const cos = (a, b) => {
  let s = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    s += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return s / Math.sqrt(na * nb)
}

const perPair = A.vectors.map((v, i) => cos(v, B.vectors[i]))
const stats = arr => {
  const sorted = [...arr].sort((x, y) => x - y)
  return { min: sorted[0], p50: sorted[Math.floor(sorted.length / 2)], max: sorted[sorted.length - 1], mean: arr.reduce((s, x) => s + x, 0) / arr.length }
}

let maxAbs = 0
let maxL2 = 0
for (let i = 0; i < A.vectors.length; i++) {
  let l2 = 0
  for (let d = 0; d < A.vectors[i].length; d++) {
    const diff = Math.abs(A.vectors[i][d] - B.vectors[i][d])
    if (diff > maxAbs) maxAbs = diff
    l2 += diff * diff
  }
  maxL2 = Math.max(maxL2, Math.sqrt(l2))
}

const topk = (vecs, qi, k) =>
  vecs
    .map((v, j) => ({ j, s: cos(vecs[qi], v) }))
    .filter(x => x.j !== qi)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map(x => x.j)

const n = A.vectors.length
const retrieval = {}
for (const k of [1, 3, 5]) {
  let identical = 0
  let overlap = 0
  for (let i = 0; i < n; i++) {
    const ta = topk(A.vectors, i, k)
    const tb = topk(B.vectors, i, k)
    if (ta.join(',') === tb.join(',')) identical++
    overlap += ta.filter(x => tb.includes(x)).length / k
  }
  retrieval[`top-${k}`] = { identicalOrder: `${identical}/${n}`, meanOverlap: Number((overlap / n).toFixed(4)) }
}

const report = {
  python: { stack: A.stack, st: A.st_version, dim: A.dim, pooling: A.pooling, normalize: A.normalize },
  ts: { stack: B.stack, dtype: B.dtype, dim: B.dim, pooling: B.pooling, normalize: B.normalize },
  texts: n,
  cosinePerPair: stats(perPair).min === stats(perPair).max ? { all: perPair[0] } : stats(perPair),
  cosineDetail: perPair.map(x => Number(x.toFixed(9))),
  maxAbsDiff: Number(maxAbs.toExponential(6)),
  maxL2Diff: Number(maxL2.toExponential(6)),
  retrievalAgreement: retrieval,
  cosineThresholdCheck: {
    'min>=0.9999': Math.min(...perPair) >= 0.9999,
    'min>=0.999': Math.min(...perPair) >= 0.999,
    'min>=0.99': Math.min(...perPair) >= 0.99,
  },
}

console.log(JSON.stringify(report, null, 2))
