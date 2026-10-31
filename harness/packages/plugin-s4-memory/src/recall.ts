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

/**
 * 余弦 top-k。
 * @param rows 带向量的记忆行（按 id 倒序或任意序均可）
 * @param query query 向量（维度须与入库向量一致）
 * @param limit 返回条数
 * @returns 按余弦得分降序的行（不含 embedding 列）
 */
export function cosineTopK(rows: RecallVectorRow[], query: number[], limit: number): RecallRow[] {
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
  return scored.slice(0, limit).map((s) => s.row)
}
