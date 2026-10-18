/**
 * DSH-3.6 · S4 记忆最小闭环插件（TS 自做，判据权威 = docs/dsh/dsh-migration.md §3.6 定稿 v3）
 *
 * 姿态自证：dsh 0.1.5-rc.2 cordis 插件（--profile sdk 运行）。消费 `session/event`
 * 火线（`user/message`，排除 synthetic runtime snapshot）；SQLite 真相源 ＋
 * ChromaDB 派生向量索引双写；注入面默认**只走 context 面**——
 *   - `systemPrompt.context`（→ user-role snapshot → synthetic `user/message` 帧，动态区）
 *   - `systemPrompt.section` **默认关闭**（DSH-3.9.1-b A-②/D：召回是 volatile 内容，
 *     放进 system prompt 前缀会让「新记忆写入 ⇒ 第 4 行起全部缓存 miss」）
 * ⚠️ 召回块带 `created_at`（本地时刻）：此前曾按「volatile 毒化前缀」理由移除，
 *    但召回已只走 context 面（动态区），不再位于 system prompt 前缀 ⇒ 时间戳可安全保留
 *    （老大 2026-10-18 指令：时间戳后面有用）。数据层写入用 `datetime('now','localtime')`。
 *
 * 双写一致性模型：
 *   - SQLite = 真相源：每条真 `user/message` 落 memories 表（行 id 主键；
 *     `(session_id, source_event_seq)` 唯一 ⇒ 事件重放/装置重跑幂等）。
 *   - ChromaDB = 派生索引：id ≡ SQLite 行 id（字符串化），可从真相源全量重建。
 *   - Chroma 不可达 / 写失败 → 不阻塞 append 火线（fire-and-forget），
 *     stderr 记降级行（唯一匹配串 `[S36-MEMORY] chroma degraded:`，只出自失败路径）。
 *   - 允许「SQLite 有、Chroma 暂缺」的短暂不一致，以真相源收敛。
 *
 * key 纪律：0 token，全程无凭据接触。
 */
import { appendFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-session' // Context.sessions + session/* 事件的 declare 合并
import type {} from '@deepseek-ai/dsh-system-prompt' // Context.systemPrompt 的 declare 合并

export const name = 'larry-s4-memory'
export const inject = ['sessions', 'systemPrompt']

/** J4 降级行唯一匹配串（stderr 通道，只出自 Chroma 失败路径） */
export const DEGRADED_MARK = '[S36-MEMORY] chroma degraded:'

export interface Config {
  /** SQLite 真相源路径（装置臂控；哨兵臂指向 DSH 默认后端位置） */
  dbPath: string
  /** ChromaDB server URL；留空则不做向量双写（SQLite 单写） */
  chromaUrl?: string
  /** 本地 embedding 模型（transformers.js onnx） */
  embedModel?: string
  /** 模型缓存目录（repo 外器材位） */
  modelCacheDir?: string
  /** 注入面召回条数 */
  recallLimit?: number
  /** ChromaDB collection 名 */
  collectionName?: string
  /**
   * 降级行日志文件（判据 V6 通道二：插件日志文件）。SDK client pipe 吞 child
   * stderr（stderrTail 仅 runtime 死亡诊断用），验收装置经此文件断言降级行。
   * 缺省 = 只写 stderr。文件写失败只吞（诊断不得反噬业务）。
   */
  degradedLogPath?: string
  /** section 面（system prompt 正文）注册开关 */
  injectSection?: boolean
  /** context 面（user-role snapshot）注册开关 */
  injectContext?: boolean
}

const DEFAULTS: Required<Pick<Config,
  'embedModel' | 'modelCacheDir' | 'recallLimit' | 'collectionName' | 'injectSection' | 'injectContext'
>> = {
  embedModel: 'Xenova/bge-small-zh-v1.5',
  modelCacheDir: 'D:/Code/_models',
  recallLimit: 8,
  collectionName: 'larry_memories',
  injectSection: false,
  injectContext: true,
}

/**
 * `user/message` 事件最小面（判据字段自持：不赌上游 SessionEvent 泛型形状，
 * 边界处一次 as 收窄）。J0 实测：真用户消息 data 无 source；synthetic
 * runtime snapshot 带 `source: {kind:'plugin', form:'snapshot'}`。
 */
interface UserMessageLike {
  type: string
  seq: number
  data: {
    content?: Array<{ type: string; text?: string }>
    source?: { kind?: string; form?: string }
  }
}

/** Chroma 派生索引句柄（lazy singleton） */
interface ChromaHandle {
  add: (rowId: string, text: string, embedding: number[]) => Promise<void>
}

export function apply(ctx: Context, userConfig: Partial<Config> = {}): void {
  // 类型面统一为 Required：默认值兜底后逐字段非空（dbPath 例外——必填无默认，
  // 由下方显式 throw 守卫，类型断言只是让必填语义通过编译）
  const cfg = { ...DEFAULTS, ...userConfig } as Required<Config>
  if (!cfg.dbPath) throw new Error(`${DEGRADED_MARK} config.dbPath is required`)

  // ── SQLite 真相源（node:sqlite · Node 24 内置，零外部依赖）─────────────────
  const db = new DatabaseSync(cfg.dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      source_event_seq INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_session_seq
      ON memories(session_id, source_event_seq);
  `)
  // ⚠️ 显式写 created_at 而不是依赖列 DEFAULT：CREATE TABLE IF NOT EXISTS 对**已存在**的表不生效，
  //    老库的 DEFAULT 仍是 UTC。显式 localtime 对新旧库行为一致（本机时区，便于人读）。
  const insertRow = db.prepare(
    "INSERT OR IGNORE INTO memories(session_id, source_event_seq, content, created_at) VALUES(?,?,?, datetime('now','localtime'))"
  )
  const selectRecent = db.prepare(
    'SELECT id, content, created_at FROM memories ORDER BY id DESC LIMIT ?'
  )
  // cordis 4.0.2 effect 语义：execute 返回 disposer（fiber 卸载时回收）
  ctx.effect(() => () => { db.close() })

  // ── ChromaDB 派生索引 ＋ 本地 embedding（lazy，首次双写时加载）────────────
  let chromaHandle: Promise<ChromaHandle | null> | null = null
  let embedFn: ((text: string) => Promise<number[]>) | null = null

  async function getEmbed(): Promise<(text: string) => Promise<number[]>> {
    if (embedFn) return embedFn
    const { pipeline, env } = await import('@huggingface/transformers')
    env.cacheDir = cfg.modelCacheDir!
    if (process.env.HF_ENDPOINT) env.remoteHost = process.env.HF_ENDPOINT
    const extractor = await pipeline('feature-extraction', cfg.embedModel!)
    embedFn = async (text: string) => {
      const out = await extractor([text], { pooling: 'mean', normalize: true })
      const vecs = out.tolist() as number[][]
      return vecs[0]
    }
    return embedFn
  }

  async function getChroma(): Promise<ChromaHandle | null> {
    if (!cfg.chromaUrl) return null
    if (!chromaHandle) {
      chromaHandle = (async (): Promise<ChromaHandle> => {
        const { ChromaClient } = await import('chromadb')
        const client = new ChromaClient({ path: cfg.chromaUrl })
        const col = await client.getOrCreateCollection({ name: cfg.collectionName })
        const handle: ChromaHandle = {
          add: async (rowId: string, text: string, embedding: number[]): Promise<void> => {
            await col.add({ ids: [rowId], embeddings: [embedding], documents: [text] })
          },
        }
        return handle
      })().catch((err: unknown) => {
        chromaHandle = null // 失败不粘死：下次双写重试（J4 活臂恢复自愈）
        throw err
      })
    }
    return chromaHandle
  }

  /** fire-and-forget 双写派生索引；任一步失败 → stderr 降级行（只出自失败路径） */
  async function doubleWrite(rowId: string, text: string): Promise<void> {
    try {
      const chroma = await getChroma()
      if (!chroma) return
      const embed = await getEmbed()
      const vec = await embed(text)
      await chroma.add(rowId, text, vec)
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err)
      // V6 失败特征「如 URL／errno」：chromadb client 的 ChromaConnectionError 吞掉
      // cause 链（实测 cause=undefined 无 code）⇒ errno 侧不可得，url= 侧字面满足
      const line = `${DEGRADED_MARK} row=${rowId} url=${cfg.chromaUrl} reason=${reason}\n`
      process.stderr.write(line)
      if (cfg.degradedLogPath) {
        try { appendFileSync(cfg.degradedLogPath, line) } catch { /* 诊断失败不得反噬业务 */ }
      }
    }
  }

  // ── 事件消费：session/event 火线（post-commit fire-and-forget）──────────────
  ctx.on('session/event', (session, event) => {
    const e = event as unknown as UserMessageLike
    if (e.type !== 'user/message') return
    // J0 实证：synthetic runtime snapshot 带 source.kind='plugin'，真用户消息无 source
    if (e.data?.source?.kind === 'plugin') return
    const text = (e.data?.content ?? [])
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('\n')
      .trim()
    if (!text) return
    const info = insertRow.run(session.id, e.seq, text) as unknown as {
      changes: number | bigint
      lastInsertRowid: number | bigint
    }
    if (Number(info.changes) === 0) return // 重复事件（重放/重跑）—— 幂等跳过
    void doubleWrite(String(info.lastInsertRowid), text)
  })

  // ── 注入面（默认仅 context 面；section 面由 config 显式开启）────────────────
  const recallText = (): string => {
    const rows = selectRecent.all(cfg.recallLimit) as unknown as Array<{
      id: number
      content: string
      created_at: string
    }>
    if (rows.length === 0) return '' // 空库 → 空贡献（不产生注入块）
    // 时间戳以本地时刻呈现（数据层已 localtime）。召回只走 context 面（动态区），
    // ⇒ 时间戳不会进入 system prompt 前缀，不影响缓存命中。
    const lines = rows.map((r) => `- [${r.created_at}] ${r.content.replace(/\n/g, ' ')}`)
    return `## LarryAgent 记忆召回（最近 ${rows.length} 条）\n${lines.join('\n')}`
  }

  const disposers: Array<() => void> = []
  if (cfg.injectSection) {
    disposers.push(ctx.systemPrompt.section({
      name: 'larry-memory-recall',
      order: 500,
      text: recallText, // 动态 provider：每次 assembly 求值（system/message 帧）
    }))
  }
  if (cfg.injectContext) {
    disposers.push(ctx.systemPrompt.context({
      name: 'larry-memory-recall',
      order: 500,
      text: recallText, // user-role snapshot（synthetic user/message 帧）
    }))
  }
  ctx.effect(() => () => { for (const d of disposers) d() })
}
