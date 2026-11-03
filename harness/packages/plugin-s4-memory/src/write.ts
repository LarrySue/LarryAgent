/**
 * ③.1 · 长期记忆摘要写入（kind='memory'）
 *
 * ⛔ 本模块**只提供写入函数**，不挂任何自动触发：
 *   调用点必须在 ③.2「人审闸」通过之后（确认／编辑后确认）。本单（③.1）不产出
 *   「默认全入」的旁路 —— 探针里的调用属程序内验证，不是产品路径。
 *
 * WHY 与 transcript 分开：`kind` 无 DEFAULT ⇒ 任何漏写 kind 的 INSERT 都会响亮报错；
 * 摘要不是「某一条事件」，不受 `UNIQUE(session_id, source_event_seq) WHERE kind='transcript'`
 * 约束（`source_event_seq` 传来源事件序号仅作溯源，不参与唯一性）。
 */

import type { DatabaseSync } from 'node:sqlite'

export interface MemoryWriteInput {
  /** 来源会话 id（DSH session） */
  sessionId: string
  /** 来源事件序号（溯源用；不参与唯一约束） */
  sourceEventSeq: number
  /** 经人审确认／编辑后的摘要正文 */
  content: string
}

/** 插入一条 kind='memory' 摘要行，返回行 id。 */
export function insertMemoryRow(db: DatabaseSync, input: MemoryWriteInput): number {
  const info = db
    .prepare(
      "INSERT INTO memories(session_id, source_event_seq, content, kind, created_at) VALUES(?,?,?,'memory', datetime('now','localtime'))",
    )
    .run(input.sessionId, input.sourceEventSeq, input.content) as { lastInsertRowid: number | bigint }
  return Number(info.lastInsertRowid)
}

export interface MemoryWriteHooks {
  /** 行落库后的派生动作（向量／Chroma 双写）；失败不得反噬写入 */
  afterInsert?: (id: number, content: string) => void
}

/**
 * 摘要写入口（③.2 直接调用）：落库 → 可选派生动作。
 * `afterInsert` 由调用方注入（插件内为 `ingestEmbedding` ＋ `doubleWrite`），
 * 本模块不反向依赖插件主体，便于单测与探针直接调用。
 */
export function writeMemorySummary(
  db: DatabaseSync,
  input: MemoryWriteInput,
  hooks: MemoryWriteHooks = {},
): number {
  const id = insertMemoryRow(db, input)
  hooks.afterInsert?.(id, input.content)
  return id
}
