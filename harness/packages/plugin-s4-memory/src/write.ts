/**
 * ③.1 / ③.2b · 长期记忆摘要写入（kind='memory'）＋ 人审闸
 *
 * ⛔ 本模块是**摘要写入的唯一落点**：
 *   `insertMemoryRow` / `writeMemorySummary` 的调用点只允许出现在本文件的
 *   `createMemoryWriteGate().approveAndWrite()` 内（闸之后）。任何"默认全入"的旁路
 *   都属于回归（W-5 的检索式会抓到）。
 *
 * 人审闸的形状（③.2b）：
 *   1. `stageMemorySummary(db, input)` —— 待审内容先进 **staging 表**（不碰 memories）；
 *   2. （可选）编辑通道 `updateStagedContent(db, id, content)` 改的是 staging；
 *   3. `approveAndWrite(stageId, …)` —— 调审批**表决**（只拿四态，接口不带内容）；
 *      仅 `allowed-once` 时**重读 staging 的最新内容**再落库 ⇒ 编辑后的版本才是入库版本。
 *
 * WHY staging 表而不是内存：编辑通道必须能在"审批等待期间"被外部（编辑器／测试装置）
 * 修改，且进程重启后仍可核对；表也能被探针直接 SELECT 取证。
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

/** 插入一条 kind='memory' 摘要行，返回行 id。⛔ 仅供闸内调用。 */
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
 * 摘要写入口（⛔ 仅由闸调用）：落库 → 可选派生动作。
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

// ── ③.2b 人审闸：staging ＋ 表决 ＋ 只进被批准的那一版 ─────────────────────

/** staging 表：待审内容只在这里等，⛔ 不进 memories */
export const STAGING_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS memory_write_staging (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    source_event_seq INTEGER NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    decided_at TEXT
  );`

export function ensureStagingTable(db: DatabaseSync): void {
  db.exec(STAGING_TABLE_SQL)
}

export interface StagedWrite {
  id: number
  session_id: string
  source_event_seq: number
  content: string
  status: string
}

/** 待审内容入 staging，返回 stage id（⛔ 不写 memories） */
export function stageMemorySummary(db: DatabaseSync, input: MemoryWriteInput): number {
  const info = db
    .prepare(
      "INSERT INTO memory_write_staging(session_id, source_event_seq, content, status) VALUES(?,?,?,'pending')",
    )
    .run(input.sessionId, input.sourceEventSeq, input.content) as { lastInsertRowid: number | bigint }
  return Number(info.lastInsertRowid)
}

export function readStaged(db: DatabaseSync, stageId: number): StagedWrite | undefined {
  return db.prepare('SELECT id, session_id, source_event_seq, content, status FROM memory_write_staging WHERE id = ?')
    .get(stageId) as StagedWrite | undefined
}

/** 编辑通道（产品侧编辑器／测试装置调用）：只改 staging，⛔ 不碰 memories */
export function updateStagedContent(db: DatabaseSync, stageId: number, content: string): boolean {
  const info = db.prepare("UPDATE memory_write_staging SET content = ? WHERE id = ? AND status = 'pending'")
    .run(content, stageId) as { changes: number | bigint }
  return Number(info.changes) === 1
}

function markStagedDecided(db: DatabaseSync, stageId: number, status: string): void {
  db.prepare('UPDATE memory_write_staging SET status = ?, decided_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run(status, stageId)
}

/** 审批通道的最小结构面（只表决，⛔ 接口不携带内容） */
export interface ApprovalRequestLike {
  agent: unknown
  toolName: string
  callId: string
  reason: string
  signal?: AbortSignal
}
export type ApprovalRequestFn = (req: ApprovalRequestLike) => Promise<string>

export interface GateDecision {
  outcome: string
  writtenId: number | null
  usedContent: string | null
  /** 诊断用：审批调用抛错时的原文（⛔ 不参与写入判定） */
  error?: string
}

/**
 * 创建人审闸。`requestApproval` 必须把结果原样返回（四态或异常）；
 * ⚠️ 判「是否写入」一律读库（W 判据），⛔ 不以 outcome 推断写入。
 */
export function createMemoryWriteGate(db: DatabaseSync, requestApproval: ApprovalRequestFn, hooks: MemoryWriteHooks = {}) {
  return {
    /** 落库前后唯一 INSERT 调用点 —— 只在 allowed-once 分支执行 */
    async approveAndWrite(
      stageId: number,
      params: { agent: unknown; callId: string; signal?: AbortSignal },
    ): Promise<GateDecision> {
      const staged = readStaged(db, stageId)
      if (staged === undefined) {
        return { outcome: 'unavailable', writtenId: null, usedContent: null }
      }
      let outcome: string
      try {
        outcome = await requestApproval({
          agent: params.agent,
          toolName: 'memory_write',
          callId: params.callId,
          reason: `memory-write:${stageId}`,
          signal: params.signal,
        })
      } catch (error) {
        // 答者抛错／服务异常 ⇒ fail closed（不写）
        markStagedDecided(db, stageId, 'unavailable')
        return { outcome: 'unavailable', writtenId: null, usedContent: null, error: String((error as Error)?.message ?? error).slice(0, 300) }
      }
      if (outcome !== 'allowed-once') {
        markStagedDecided(db, stageId, outcome)
        return { outcome, writtenId: null, usedContent: null }
      }
      // ⚠️ 批准后**重读** staging：审批等待期间可能被编辑 ⇒ 入库的是编辑后的版本（W-3）
      const current = readStaged(db, stageId)
      if (current === undefined) {
        return { outcome: 'unavailable', writtenId: null, usedContent: null }
      }
      const writtenId = writeMemorySummary(
        db,
        { sessionId: current.session_id, sourceEventSeq: current.source_event_seq, content: current.content },
        hooks,
      )
      markStagedDecided(db, stageId, 'written')
      return { outcome, writtenId, usedContent: current.content }
    },
  }
}
