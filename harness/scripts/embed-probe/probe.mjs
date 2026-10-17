#!/usr/bin/env node
/**
 * DSH-3.6 前置 C · embed-probe：bge-small-zh-v1.5（ONNX）加载 ＋ 512 维断言
 * 姿态自证：@huggingface/transformers 4.3.1（Node · CPU · ONNX runtime）；
 *   模型 = Xenova/bge-small-zh-v1.5（transformers.js 生态 onnx 转换版）；
 *   缓存显式落 S36_MODEL_CACHE（缺省 D:/Code/_models，repo 外器材位）。
 * 下载走 HF_ENDPOINT（若设置）；离线验证 = 第二跑把 HF_ENDPOINT 指向无效域，仍能载入即缓存命中。
 * 输出：stdout JSON（dims / 耗时 / cacheDir / 模型 / 相似度健康检查）
 */
import { pipeline, env } from '@huggingface/transformers'
import { mkdirSync } from 'node:fs'

const CACHE_DIR = process.env.S36_MODEL_CACHE ?? 'D:/Code/_models'
env.cacheDir = CACHE_DIR
if (process.env.HF_ENDPOINT) env.remoteHost = process.env.HF_ENDPOINT  // 主动尊重镜像变量

const MODEL = process.env.S36_EMBED_MODEL ?? 'Xenova/bge-small-zh-v1.5'
const started = Date.now()
const extractor = await pipeline('feature-extraction', MODEL)
const loadedMs = Date.now() - started

const texts = ['项目代号是 PING-abc12345', 'The project code is PING-abc12345', '今天天气不错']
const out = await extractor(texts, { pooling: 'mean', normalize: true })
const dims = out.dims  // [batch, hidden]
const vecs = out.tolist()

const cosine = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)  // 已归一化 ⇒ 点积 = 余弦
const report = {
  when: new Date().toISOString(),
  model: MODEL,
  cacheDir: CACHE_DIR,
  hfEndpoint: process.env.HF_ENDPOINT ?? env.remoteHost,
  loadedMs,
  dims,
  assert512: dims[1] === 512,
  cosinePairs: {
    'zh-en 同义': cosine(vecs[0], vecs[1]),
    'zh-zh 无关句': cosine(vecs[0], vecs[2]),
  },
}
console.log(JSON.stringify(report, null, 2))
if (!report.assert512) {
  console.error(`❌ 维度断言失败：${dims[1]} ≠ 512`)
  process.exit(1)
}
console.log('✓ 512 维断言 PASS')
