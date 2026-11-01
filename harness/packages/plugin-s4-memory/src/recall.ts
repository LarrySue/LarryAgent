/**
 * S4 记忆插件 · 向量召回纯函数（P0② 第一期）
 *
 * 口径：
 *   - 向量以 Float32Array 的原始字节存 SQLite BLOB（512 维 = 2048 B）；
 *   - 评估用余弦相似度；入库向量与 query 向量都由 embedding 模块做 L2 normalize，
 *     这里仍显式算模长，避免上游预处理变动时静默失真；
 *   - 只做"选哪 top-k"，不负责注入位置／条数（注入策略属第二期）。
 */

/** 召回结果的最小行面（与 memories 表列同名） */
export interface RecallRow {
  id: number
  content: string
  created_at: string
}

/** 带向量的行面（embedding 列原样，由 decodeVector 校验） */
export interface RecallVectorRow extends RecallRow {
  embedding: unknown
}

/** number[] → 落库 BLOB（小端 Float32 原始字节） */
export function encodeVector(vector: number[]): Uint8Array {
  const f32 = new Float32Array(vector.length)
  for (let i = 0; i < vector.length; i++) f32[i] = vector[i]
  return new Uint8Array(f32.buffer)
}

/**
 * 落库 BLOB → Float32Array。
 * node:sqlite 回读是 Uint8Array（实测，非 Buffer）；先复制到 4 字节对齐的新缓冲，
 * 避免 byteOffset 不对齐时 Float32Array 构造抛错。
 */
export function decodeVector(blob: unknown): Float32Array | null {
  if (!(blob instanceof Uint8Array) || blob.byteLength === 0 || blob.byteLength % 4 !== 0) {
    return null
  }
  const copy = new Uint8Array(blob.byteLength)
  copy.set(blob)
  return new Float32Array(copy.buffer, 0, copy.byteLength / 4)
}

/** 带分数的召回行（②.2.1 相关性门需要 score；⛔ 不再在返回时丢掉） */
export interface ScoredRecall {
  row: RecallRow
  score: number
}

/**
 * 余弦 top-k。
 * @param rows 带向量的记忆行（按 id 倒序或任意序均可）
 * @param query query 向量（维度须与入库向量一致）
 * @param limit 返回条数
 * @returns 按余弦得分降序的 {row, score}（不含 embedding 列）
 */
export function cosineTopK(rows: RecallVectorRow[], query: number[], limit: number): ScoredRecall[] {
  if (limit <= 0 || query.length === 0) return []
  const q = Float32Array.from(query)
  let qNormSq = 0
  for (let i = 0; i < q.length; i++) qNormSq += q[i] * q[i]
  const qNorm = Math.sqrt(qNormSq)
  if (!qNorm) return []

  const scored: Array<{ row: RecallRow; score: number }> = []
  for (const row of rows) {
    const v = decodeVector(row.embedding)
    if (!v || v.length !== q.length) continue
    let dot = 0
    let vNormSq = 0
    for (let i = 0; i < v.length; i++) {
      dot += v[i] * q[i]
      vNormSq += v[i] * v[i]
    }
    const vNorm = Math.sqrt(vNormSq)
    if (!vNorm) continue
    scored.push({
      row: { id: row.id, content: row.content, created_at: row.created_at },
      score: dot / (vNorm * qNorm),
    })
  }

  scored.sort((a, b) => (b.score - a.score) || (b.row.id - a.row.id))
  return scored.slice(0, limit)
}

/** 相对门的判定结果（不含内容，只留计数与分数，供日志使用） */
export interface RecallGateResult {
  /** 过门且未超上限的行（按分数降序） */
  kept: ScoredRecall[]
  /** 被相对门挡掉的条数（score < top1 - delta） */
  blockedCount: number
  /** 被挡条目里的最高分；无被挡项时为 null */
  blockedTop: number | null
  /** 本轮 top1 分数；无候选时为 null */
  top1: number | null
  /** 过门但被 k 上限截掉的条数（= 过门总数 − kept）；k 未截断时为 0 */
  truncatedCount: number
}

/**
 * ②.2.1 相关性门：只保留 score >= top1 - delta，再截到 k。
 *
 * ⭐ k 是**上限不是目标**：门内不足 k 条就返回实际条数，⛔ 不拿低分条凑数。
 * ⚠️ minTop（绝对下限）本期不实现；这里刻意没有绝对阈值参数。
 * 数学性质：top1 自身必然过门（delta >= 0 ⇒ top1 >= top1 - delta），
 * 所以「全部被门挡掉」不可达——R-6 因此改为「候选池为空」的判据。
 */
export function applyRecallGate(scored: ScoredRecall[], delta: number, limit: number): RecallGateResult {
  if (scored.length === 0) {
    return { kept: [], blockedCount: 0, blockedTop: null, top1: null, truncatedCount: 0 }
  }
  const top1 = scored[0].score
  const threshold = top1 - delta
  const blocked = scored.filter((entry) => entry.score < threshold)
  const passed = scored.filter((entry) => entry.score >= threshold)
  const kept = passed.slice(0, Math.max(0, limit))
  return {
    kept,
    blockedCount: blocked.length,
    blockedTop: blocked.length > 0 ? Math.max(...blocked.map((entry) => entry.score)) : null,
    top1,
    truncatedCount: passed.length - kept.length,
  }
}
