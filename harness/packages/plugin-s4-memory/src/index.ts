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
import { homedir } from 'node:os'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-session' // Context.sessions + session/* 事件的 declare 合并
import type {} from '@deepseek-ai/dsh-system-prompt' // Context.systemPrompt 的 declare 合并
import { createEmbedder, resolveModelCacheDir } from './embedding.js'
import { cosineTopK, encodeVector, type RecallRow, type RecallVectorRow } from './recall.js'

export const name = 'larry-s4-memory'
export const inject = ['sessions', 'systemPrompt']

/** J4 降级行唯一匹配串（stderr 通道，只出自失败路径） */
export const DEGRADED_MARK = '[S36-MEMORY] chroma degraded:'
/** P0② 本单新增部署哨兵（P7：部署件内必须命中这条唯一串） */
export const P02_DEPLOY_SENTINEL = '[S36-MEMORY] p02-vector-recall-v1'
/** P8 本单新增部署哨兵（P7 口径：部署件内必须命中） */
export const P08_DEPLOY_SENTINEL = '[S36-MEMORY] p08-recall-session-filter-v1'
/** 语义召回降级原因（与 DEGRADED_MARK 共用同一 stderr／degradedLogPath 通道） */
export const EMBED_RECALL_FALLBACK = 'recall fallback to time-order'
/** P8-d 空召回 OBS 行（与降级共用同一通道；⛔ 不冒充降级） */
export const RECALL_EMPTY_MARK = '[S36-MEMORY] recall empty after session filter:'
/** provider 占位（零宽空格）：过滤后为空时保住注入条，瀑布随后替换为最终文本（'' 渲染时被过滤） */
const RECALL_PLACEHOLDER = '\u200B'
/** 场地隔离断言：dbPath 落在当前 home 之外且未豁免（stderr ＋ throw，只出自失败路径） */
export const OUTSIDE_HOME_DENY_MARK = '[S36-MEMORY] dbPath outside home (denied):'
/** 场地隔离断言：同上但显式豁免（stderr 审计行，含解析后的绝对路径） */
export const OUTSIDE_HOME_ALLOW_MARK = '[S36-MEMORY] dbPath outside home (allowed by config.allowOutsideHome):'

/**
 * 当前 DSH_HOME 的解析（与上游 `@deepseek-ai/dsh-home-paths:resolveDshHome` 同口径：
 * `$DSH_HOME` ＞ `~/.dsh`；空白字符串视同未设，避免 resolve('') 落成 cwd）。
 * ⛔ 不从 ctx 取：dsh 无 home 服务（实测 `provide('home'` 零命中）；
 * 上游 resolver 包在本工作区不可解析（实测 ERR_MODULE_NOT_FOUND），且本单禁引入新依赖。
 */
function resolveHarnessHome(): string {
  const fromEnv = process.env.DSH_HOME
  if (fromEnv !== undefined && fromEnv.trim().length > 0) return resolve(fromEnv.trim())
  return join(homedir(), '.dsh')
}

/** 配置里的 dbPath：`${DSH_HOME}` 占位替换 ＋ 相对路径按当前 home 解析为绝对路径 */
function resolveDbPath(raw: string, home: string): string {
  const substituted = raw.split('${DSH_HOME}').join(home)
  return isAbsolute(substituted) ? resolve(substituted) : resolve(home, substituted)
}

/** `child` 是否落在 `parent` 之内（含 parent 自身；win32 下 path.relative 忽略大小写） */
function isWithin(parent: string, child: string): boolean {
  const rel = relative(parent, child)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

export interface Config {
  /**
   * SQLite 真相源路径（装置臂控；哨兵臂指向 DSH 默认后端位置）。
   * 相对路径按当前 DSH_HOME 解析；支持 `${DSH_HOME}` 占位。
   */
  dbPath: string
  /**
   * 场地隔离断言的显式豁免：dbPath 落在当前 home 之外时默认 fail；
   * 置 true 则放行，但每次启动在 stderr 留一行审计（含解析后的绝对路径）。
   */
  allowOutsideHome?: boolean
  /** ChromaDB server URL；留空则不做向量双写（SQLite 单写） */
  chromaUrl?: string
  /** 本地 embedding 模型（transformers.js onnx） */
  embedModel?: string
  /** 模型缓存目录（支持 `${DSH_HOME}` 占位与相对路径；留空 = transformers.js 默认 .cache） */
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

  /** 降级行统一通道：stderr ＋ 可选 degradedLogPath（⛔ 失败路径只走这里） */
  function writeDegraded(line: string): void {
    const text = line.endsWith('\n') ? line : `${line}\n`
    process.stderr.write(text)
    if (cfg.degradedLogPath) {
      try { appendFileSync(cfg.degradedLogPath, text) } catch { /* 诊断失败不得反噬业务 */ }
    }
  }

  // ── 场地隔离断言（Tier0 红线 4 的代码化）：换 home ≠ 换库 ──────────────────
  //   home 之外的库 ⇒ 默认 fail（⛔ 不是 warn）：临时 home 跑测试时真库必须不受波及。
  const home = resolveHarnessHome()
  const dbPath = resolveDbPath(cfg.dbPath, home)
  if (!isWithin(home, dbPath)) {
    if (cfg.allowOutsideHome === true) {
      process.stderr.write(`${OUTSIDE_HOME_ALLOW_MARK} dbPath=${dbPath} home=${home}\n`)
    } else {
      const line = `${OUTSIDE_HOME_DENY_MARK} dbPath=${dbPath} home=${home}`
      process.stderr.write(`${line}\n`)
      throw new Error(line)
    }
  }

  // ── SQLite 真相源（node:sqlite · Node 24 内置，零外部依赖）─────────────────
  const db = new DatabaseSync(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      source_event_seq INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      embedding BLOB
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_session_seq
      ON memories(session_id, source_event_seq);
  `)
  // ⚠️ CREATE TABLE IF NOT EXISTS 对**已存在**的老库不生效 ⇒ embedding 列须显式迁移（幂等）。
  const memoryColumns = db.prepare('PRAGMA table_info(memories)').all() as unknown as Array<{ name?: string }>
  if (!memoryColumns.some((column) => column.name === 'embedding')) {
    db.exec('ALTER TABLE memories ADD COLUMN embedding BLOB')
  }
  // ⚠️ 显式写 created_at 而不是依赖列 DEFAULT：CREATE TABLE IF NOT EXISTS 对**已存在**的表不生效，
  //    老库的 DEFAULT 仍是 UTC。显式 localtime 对新旧库行为一致（本机时区，便于人读）。
  const insertRow = db.prepare(
    "INSERT OR IGNORE INTO memories(session_id, source_event_seq, content, created_at) VALUES(?,?,?, datetime('now','localtime'))"
  )
  // P8：两条召回路径的最终过滤都在 SQL 层（⛔ 别一边 SQL 一边 JS）。
  //   selectRecent 保留为「库非空」探针（不过滤），用于区分「过滤后为空」与「真空白库」。
  const selectRecent = db.prepare(
    'SELECT id, content, created_at FROM memories ORDER BY id DESC LIMIT ?'
  )
  const selectRecentFiltered = db.prepare(
    'SELECT id, content, created_at FROM memories WHERE session_id <> ? ORDER BY id DESC LIMIT ?'
  )
  const selectVectorRows = db.prepare(
    'SELECT id, content, created_at, embedding FROM memories WHERE embedding IS NOT NULL AND session_id <> ? ORDER BY id DESC'
  )
  const selectMissingVectors = db.prepare(
    'SELECT id, content FROM memories WHERE embedding IS NULL ORDER BY id ASC'
  )
  const updateEmbedding = db.prepare(
    'UPDATE memories SET embedding = ? WHERE id = ?'
  )
  // cordis 4.0.2 effect 语义：execute 返回 disposer（fiber 卸载时回收）
  ctx.effect(() => () => { db.close() })

  // ── 本地 embedding（P0②：semantic recall ＋ Chroma 双写共用同一 CLS 编码器）──
  const modelCacheDir = resolveModelCacheDir(cfg.modelCacheDir, home)
  const embedder = createEmbedder({ modelId: cfg.embedModel, cacheDir: modelCacheDir })

  let prewarmStarted = false
  let backfillStarted = false

  /** 写侧：单条记忆 → SQLite embedding 列（失败静默；召回侧按需统一 warn） */
  async function ingestEmbedding(rowId: number, text: string): Promise<void> {
    if (!embedder.ready()) { startPrewarm(); return }
    try {
      const vector = await embedder.encode(text)
      updateEmbedding.run(encodeVector(vector), rowId)
      startBackfill() // 预取曾失败但本次 encode 成功时，老库也能被补齐
    } catch { /* 静默：写失败不得反噬业务 */ }
  }

  /** 老库回填：模型就绪后把 embedding IS NULL 的行补齐（只跑一次） */
  function startBackfill(): void {
    if (backfillStarted || !embedder.ready()) return
    backfillStarted = true
    void (async () => {
      try {
        const rows = selectMissingVectors.all() as unknown as Array<{ id: number; content: string }>
        for (const row of rows) {
          try {
            const vector = await embedder.encode(row.content)
            updateEmbedding.run(encodeVector(vector), row.id)
          } catch {
            return // 模型失败即停；保持 NULL，等下次就绪再回填
          }
        }
      } catch { /* 库已关／查询失败：静默（后台任务不得反噬业务） */ }
    })()
  }

  /** 后台预取（P5：召回路径 ⛔ 不等待；后台失败静默，不抢降级日志） */
  function startPrewarm(): void {
    if (prewarmStarted) return
    prewarmStarted = true
    void embedder.prewarm().then(() => startBackfill()).catch(() => { /* 后台失败不阻塞业务 */ })
  }

  if (embedder.ready()) startPrewarm()

  // ── ChromaDB 派生索引（本期不启用；getChroma／doubleWrite 保留）──────────
  let chromaHandle: Promise<ChromaHandle | null> | null = null

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

  /** fire-and-forget 双写派生索引；任一步失败 → 统一降级行（只出自失败路径） */
  async function doubleWrite(rowId: string, text: string): Promise<void> {
    try {
      const chroma = await getChroma()
      if (!chroma) return
      // 本期 Chroma 默认关；若显式启用，模型未就绪时也不得把 317s 加载拖进写路径
      if (!embedder.ready()) {
        startPrewarm()
        throw new Error('embedding not ready (model cache missing)')
      }
      const vec = await embedder.encode(text)
      await chroma.add(rowId, text, vec)
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err)
      // V6 失败特征「如 URL／errno」：chromadb client 的 ChromaConnectionError 吞掉
      // cause 链（实测 cause=undefined 无 code）⇒ errno 侧不可得，url= 侧字面满足
      writeDegraded(`${DEGRADED_MARK} row=${rowId} url=${cfg.chromaUrl} reason=${reason}`)
    }
  }

  // ── 事件消费：session/event 火线（post-commit fire-and-forget）──────────────
  //  P0②：同一事件顺带记下该会话最新 user/message 文本，作为下一轮召回 query。
  const lastUserBySession = new Map<string, string>()
  const queryVectorCache = new Map<string, { text: string; vector: number[] }>()

  /** 真用户消息的文本面（过滤 plugin/tool/system 注入） */
  function userMessageText(message: unknown): string {
    const m = message as {
      role?: string
      source?: { kind?: string }
      content?: Array<{ type?: string; text?: string }>
    }
    if (m.role !== 'user' || m.source?.kind !== 'user') return ''
    return (m.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text as string)
      .join('\n')
      .trim()
  }

  // P0②：inbox claim 发生在 systemPrompt.assemble **之前**，且事件带 agent；
  // 用它同步记下当前 prompt，弥补 session/event（post-commit）晚于装配的时差。
  type InboxClaimedPayload = { agent?: { session?: { id?: unknown } }; message?: unknown }
  const onAnyEvent = ctx.on as unknown as (name: string, listener: (payload: InboxClaimedPayload) => void) => () => void
  onAnyEvent('agent/inbox/claimed', (payload) => {
    const rawSid = payload?.agent?.session?.id
    if (rawSid === undefined) return
    const text = userMessageText(payload.message)
    if (!text) return
    lastUserBySession.set(String(rawSid), text)
  })

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
    lastUserBySession.set(String(session.id), text)
    const info = insertRow.run(session.id, e.seq, text) as unknown as {
      changes: number | bigint
      lastInsertRowid: number | bigint
    }
    if (Number(info.changes) === 0) return // 重复事件（重放/重跑）—— 幂等跳过
    void ingestEmbedding(Number(info.lastInsertRowid), text)
    void doubleWrite(String(info.lastInsertRowid), text)
  })

  // ── 注入面（默认仅 context 面；section 面由 config 显式开启）────────────────
  const RECALL_NAME = 'larry-memory-recall'
  const RECALL_TITLE_PREFIX = '## LarryAgent 记忆召回'

  /** 统一渲染；semantic 与否只影响标题，行格式不变 */
  function formatRecall(rows: RecallRow[], semantic: boolean): string {
    if (rows.length === 0) return '' // 空库 → 空贡献（不产生注入块）
    // 时间戳以本地时刻呈现（数据层已 localtime）。召回只走 context 面（动态区），
    // ⇒ 时间戳不会进入 system prompt 前缀，不影响缓存命中。
    const lines = rows.map((r) => `- [${r.created_at}] ${r.content.replace(/\n/g, ' ')}`)
    const label = semantic ? `语义 top-${rows.length}` : `最近 ${rows.length} 条`
    return `${RECALL_TITLE_PREFIX}（${label}）\n${lines.join('\n')}`
  }

  /** 当前装配所属会话 id（来自 context.agent.session；无 agent 装配返回 null） */
  function sessionIdOf(context: unknown): string | null {
    const agent = (context as { agent?: { session?: { id?: unknown } } }).agent
    const rawSessionId = agent?.session?.id
    return rawSessionId === undefined ? null : String(rawSessionId)
  }

  /** 过滤后的时间倒序回退（P8：两条召回路径都在 SQL 层排除本会话） */
  function fallbackRecallText(sessionId: string): string {
    const rows = selectRecentFiltered.all(sessionId, cfg.recallLimit) as unknown as RecallRow[]
    return rows.length ? formatRecall(rows, false) : ''
  }

  /**
   * provider 面：P8 过滤后的时间倒序；过滤后为空时返回零宽占位，
   * 保住注入条让 system-prompt/assemble 瀑布把最终文本（语义或空）替换进来。
   * ⚠️ 真空白库（一行都没有）不产生注入条 ⇒ 与「过滤后为空」不同形（P8-d）。
   */
  const recallText = (context: unknown): string => {
    const sessionId = sessionIdOf(context)
    if (!sessionId) return ''
    const anyRows = selectRecent.all(1) as unknown as RecallRow[]
    if (anyRows.length === 0) return ''
    return fallbackRecallText(sessionId) || RECALL_PLACEHOLDER
  }

  /** 会话历史里的最后一条「真用户消息」（source.kind='user'；过滤 plugin/tool/system 注入） */
  function lastUserTextFromSession(session: unknown): string {
    const s = session as { deriveMessages?: () => unknown[] }
    try {
      const messages = s.deriveMessages?.()
      if (!Array.isArray(messages)) return ''
      for (let i = messages.length - 1; i >= 0; i--) {
        const text = userMessageText(messages[i])
        if (text) return text
      }
    } catch { /* 会话历史不可得：走 map 回退 */ }
    return ''
  }

  interface SemanticRecallResult {
    text: string
    /** 最终没有语义结果时的可区分原因（P8-d 日志用） */
    emptyReason?: string
  }

  /**
   * 语义召回（读侧，P0② 核心；P8 排除本会话）：
   *   - query = 当前会话最后一条真 user 消息；优先读 session.deriveMessages()
   *     （装配时当前 prompt 已在会话日志里，而 session/event 回调是 post-commit，
   *     可能晚于装配 ⇒ 只靠事件 map 会在首轮拿不到 query），map 作回退
   *   - 就绪检查是同步文件检查；未就绪 ⇒ 一条降级行 ＋ 后台预取，⛔ 不等待加载
   *   - 向量来自 memories.embedding（写侧先落库，老库由 backfill 补齐）
   *   - P8：selectVectorRows 用 SQL `session_id <> ?` 排除本会话（与降级路同层）
   */
  async function semanticRecallText(context: unknown): Promise<SemanticRecallResult> {
    const agent = (context as { agent?: { session?: { id?: unknown } } }).agent
    const sessionId = sessionIdOf(context)
    if (!sessionId) return { text: '', emptyReason: 'no-session' }
    const sessionQuery = lastUserTextFromSession(agent?.session)
    const mapQuery = lastUserBySession.get(sessionId) ?? ''
    const query = mapQuery || sessionQuery
    if (!query) return { text: '', emptyReason: 'no-query' }

    if (!embedder.ready()) {
      writeDegraded(`${DEGRADED_MARK} ${EMBED_RECALL_FALLBACK} reason=${P02_DEPLOY_SENTINEL} cause=model-not-ready`)
      startPrewarm()
      return { text: '', emptyReason: 'model-not-ready' }
    }

    try {
      let cached = queryVectorCache.get(sessionId)
      if (!cached || cached.text !== query) {
        const vector = await embedder.encode(query)
        cached = { text: query, vector }
        queryVectorCache.set(sessionId, cached)
        startBackfill()
      }
      const rows = selectVectorRows.all(sessionId) as unknown as RecallVectorRow[]
      if (rows.length === 0) return { text: '', emptyReason: 'no-cross-session-vectors' }
      const top = cosineTopK(rows, cached.vector, cfg.recallLimit)
      if (top.length === 0) return { text: '', emptyReason: 'no-candidates' }
      return { text: formatRecall(top, true) }
    } catch (err: unknown) {
      const reason = (err instanceof Error ? err.message : String(err)).replace(/\s+/g, ' ')
      writeDegraded(`${DEGRADED_MARK} ${EMBED_RECALL_FALLBACK} reason=${P02_DEPLOY_SENTINEL} cause=${reason}`)
      startPrewarm()
      return { text: '', emptyReason: 'embedding-error' }
    }
  }

  // ── 读侧接线（P0②/P8）：装配瀑布里替换同一注入条文本，⛔ 不改条数与位置 ────
  if (cfg.injectContext || cfg.injectSection) {
    ctx.on('system-prompt/assemble', async (assembly, context, next) => {
      const assembled = await next()
      const replace = <T extends { name: string; text: string }>(entries: T[], text: string): { entries: T[]; hit: boolean } => {
        let hit = false
        const list = entries.map((entry) => {
          if (entry.name !== RECALL_NAME) return entry
          hit = true
          return { ...entry, text }
        })
        return { entries: list, hit }
      }
      try {
        const sessionId = sessionIdOf(context)
        if (!sessionId) return assembled
        const semantic = await semanticRecallText(context)
        const finalText = semantic.text || fallbackRecallText(sessionId)
        const sections = replace(assembled.sections, finalText)
        const contexts = replace(assembled.contexts, finalText)
        if (!sections.hit && !contexts.hit) return assembled
        if (!finalText) {
          writeDegraded(`${RECALL_EMPTY_MARK} reason=${semantic.emptyReason ?? 'no-cross-session-rows'} sentinel=${P08_DEPLOY_SENTINEL}`)
        }
        return { ...assembled, sections: sections.entries, contexts: contexts.entries }
      } catch {
        // 兜底：至少把 provider 的过滤后时间倒序交出去，⛔ 不把未过滤内容留给模型
        try {
          const sessionId = sessionIdOf(context)
          if (!sessionId) return assembled
          const fallback = fallbackRecallText(sessionId)
          const sections = replace(assembled.sections, fallback)
          const contexts = replace(assembled.contexts, fallback)
          if (!sections.hit && !contexts.hit) return assembled
          if (!fallback) {
            writeDegraded(`${RECALL_EMPTY_MARK} reason=assemble-error-fallback sentinel=${P08_DEPLOY_SENTINEL}`)
          }
          return { ...assembled, sections: sections.entries, contexts: contexts.entries }
        } catch {
          return assembled
        }
      }
    })
  }

  const disposers: Array<() => void> = []
  if (cfg.injectSection) {
    disposers.push(ctx.systemPrompt.section({
      name: RECALL_NAME,
      order: 500,
      text: recallText, // 动态 provider：每次 assembly 求值（system/message 帧）
    }))
  }
  if (cfg.injectContext) {
    disposers.push(ctx.systemPrompt.context({
      name: RECALL_NAME,
      order: 500,
      text: recallText, // user-role snapshot（synthetic user/message 帧）
    }))
  }
  ctx.effect(() => () => { for (const d of disposers) d() })
}
