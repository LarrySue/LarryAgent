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
import { createHash } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-session' // Context.sessions + session/* 事件的 declare 合并
import type {} from '@deepseek-ai/dsh-system-prompt' // Context.systemPrompt 的 declare 合并
import { createEmbedder, resolveModelCacheDir } from './embedding.js'
import {
  assertManifestPathInsideHome,
  createSessionStats,
  MANIFEST_DEGRADED_MARK,
  observeSessionEvent,
  refreshArchiveManifest,
  resolveManifestPath,
  type SessionEventStats,
} from './manifest.js'
import { applyRecallGate, cosineTopK, dedupeNearDuplicates, encodeVector, type RecallRow, type RecallVectorRow } from './recall.js'
import {
  createMemoryWriteGate,
  ensureStagingTable,
  readStaged,
  stageMemorySummary,
  updateStagedContent,
  type ApprovalRequestLike,
  type MemoryWriteInput,
} from './write.js'

export const name = 'larry-s4-memory'
export const inject = ['sessions', 'systemPrompt']

/** J4 降级行唯一匹配串（stderr 通道，只出自失败路径） */
export const DEGRADED_MARK = '[S36-MEMORY] chroma degraded:'
/** P0② 本单新增部署哨兵（P7：部署件内必须命中这条唯一串） */
export const P02_DEPLOY_SENTINEL = '[S36-MEMORY] p02-vector-recall-v1'
/** P8 本单新增部署哨兵（P7 口径：部署件内必须命中） */
export const P08_DEPLOY_SENTINEL = '[S36-MEMORY] p08-recall-session-filter-v1'
/** ②.2.1 本单新增部署哨兵（部署件内必须命中） */
export const P221_DEPLOY_SENTINEL = '[S36-MEMORY] p221-recall-gate-v1'
/** ②.2.1 被挡记录：正常操作日志，⛔ 不混入 degraded（那是故障语义） */
export const RECALL_GATE_MARK = '[S36-MEMORY] recall gate:'
/** ②.2.3 本单新增部署哨兵（部署件内必须命中） */
export const P223_DEPLOY_SENTINEL = '[S36-MEMORY] p223-recall-dedup-v1'
/** ②.2.3 近似去重日志：正常操作日志，同 gate 口径（只看计数，⛔ 不写内容） */
export const RECALL_DEDUP_MARK = '[S36-MEMORY] recall dedup:'
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
   * 场地隔离断言的显式豁免：dbPath / manifestPath 落在当前 home 之外时默认 fail；
   * 置 true 则放行，但每次启动在 stderr 留一行审计（含解析后的绝对路径）。
   */
  allowOutsideHome?: boolean
  /**
   * 存档自描述清单路径（D6 第 ⑥ 类）。支持 `${DSH_HOME}` 占位与相对路径；
   * 缺省 `sessions/archive-manifest.jsonl`（与 sessions 存档同层）。
   */
  manifestPath?: string
  /** ChromaDB server URL；留空则不做向量双写（SQLite 单写） */
  chromaUrl?: string
  /** 本地 embedding 模型（transformers.js onnx） */
  embedModel?: string
  /** 模型缓存目录（支持 `${DSH_HOME}` 占位与相对路径；留空 = transformers.js 默认 .cache） */
  modelCacheDir?: string
  /**
   * 注入面召回条数；②.2.1 起它也是相关性门的 **k 上限**（默认 6）。
   * ⭐ 上限不是目标：门内不足 k 条就注入实际条数，⛔ 不拿低分条凑数。
   */
  recallLimit?: number
  /** ②.2.1 相对门宽度：只保留 score >= top1 - recallDelta；默认 0.20 */
  recallDelta?: number
  /**
   * ②.2.3 近似去重阈值：候选之间余弦 >= 该值即视为「说同一件事」，只留 score 高者。
   * ⚠️ 独立键，⛔ 不与 recallDelta／recallMinTop 共用（那是 query 相关性口径）。
   * 默认 0.80，依据 2026-11-02 分布扫描：同义改写 min 0.7567／跨主题 max 0.5401／0.80 覆盖 61%。
   * ⭐ 老大 2026-11-02 裁「可以，先降低是可以的」：覆盖优先于保守。
   */
  recallDedupThreshold?: number
  /**
   * ②.2.3 去重记录文件（removed 计数，⛔ 不写内容）。
   * 缺省只写 stderr；⛔ 不复用 recallGateLogPath／degradedLogPath ——
   * 「相关性门挡掉」「近似合并」「故障降级」三种语义分开，混写会让解析器无法区分。
   */
  recallDedupLogPath?: string
  /**
   * ②.2.1 绝对下限 **预留键，当前不生效**：绝对下限（minTop）本期未实现，
   * 全文件无读取点 —— 改它不会改变任何召回行为（假配置键，仅占位）。
   */
  recallMinTop?: number
  /**
   * ②.2.1 被挡记录文件（被挡条数 ＋ 被挡最高分，⛔ 不写内容）。
   * 缺省只写 stderr；⛔ 不复用 degradedLogPath（故障/正常语义分开）。
   */
  recallGateLogPath?: string
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
  'embedModel' | 'modelCacheDir' | 'recallLimit' | 'recallDelta' | 'recallDedupThreshold' | 'collectionName' | 'injectSection' | 'injectContext' | 'manifestPath'
>> = {
  embedModel: 'Xenova/bge-small-zh-v1.5',
  modelCacheDir: 'D:/Code/_models',
  recallLimit: 6,
  recallDelta: 0.20,
  recallDedupThreshold: 0.80,
  collectionName: 'larry_memories',
  injectSection: false,
  injectContext: true,
  manifestPath: 'sessions/archive-manifest.jsonl',
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

  /**
   * ②.2.1 被挡记录通道：stderr ＋ 可选 recallGateLogPath。
   * ⛔ 不复用 degradedLogPath —— 被挡是正常工作，不是故障；混在一起会淹掉故障排查。
   */
  function writeGate(line: string): void {
    const text = line.endsWith('\n') ? line : `${line}\n`
    process.stderr.write(text)
    if (cfg.recallGateLogPath) {
      try { appendFileSync(cfg.recallGateLogPath, text) } catch { /* 诊断失败不得反噬业务 */ }
    }
  }

  /**
   * ②.2.3 去重记录通道：stderr ＋ 可选 recallDedupLogPath。
   * 口径同 gate 行（只写计数不写内容），但⛔ 不复用 gate 文件——
   * 「被门挡掉」与「近似合并」是两个原因，混写就无法回答「少的那条去哪了」。
   */
  function writeDedup(line: string): void {
    const text = line.endsWith('\n') ? line : `${line}\n`
    process.stderr.write(text)
    if (cfg.recallDedupLogPath) {
      try { appendFileSync(cfg.recallDedupLogPath, text) } catch { /* 诊断失败不得反噬业务 */ }
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

  // ── 存档自描述清单（⑪.1）────────────────────────────────────────────────
  // 路径同样受场地隔离断言保护：临时 home 的测试不得把清单写进真实 sessions。
  const manifestPath = resolveManifestPath(cfg.manifestPath, home)
  assertManifestPathInsideHome(home, manifestPath, cfg.allowOutsideHome === true)
  const sessionStats = new Map<string, SessionEventStats>()
  let manifestQueue: Promise<void> = Promise.resolve()

  /** 清单刷新串行化：turn/end 是 fire-and-forget，失败只走 degraded 通道 */
  function scheduleManifestRefresh(trigger: string): void {
    manifestQueue = manifestQueue
      .then(() => refreshArchiveManifest({
        home,
        manifestPath,
        liveStats: sessionStats,
        trigger,
      }))
      .then((result) => {
        if (result.errors.length > 0) {
          writeDegraded(
            `${MANIFEST_DEGRADED_MARK} trigger=${trigger} errors=${result.errors.length} first=${result.errors[0]}`,
          )
        }
      })
      .catch((err: unknown) => {
        const reason = (err instanceof Error ? err.message : String(err)).replace(/\s+/g, ' ')
        writeDegraded(`${MANIFEST_DEGRADED_MARK} trigger=${trigger} reason=${reason}`)
      })
  }

  // ── SQLite 真相源（node:sqlite · Node 24 内置，零外部依赖）─────────────────
  // ③.1 · B 案（老大 2026-11-03 21:12 拍）：单表 ＋ kind 列
  //   transcript＝用户消息流水（原 insertRow）／memory＝提炼摘要（③.2 人审后写入）
  //   ⛔ kind 不得有 DEFAULT：漏写 kind 的 INSERT 必须响亮报错，不能静默落进某一边。
  const MEMORIES_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      source_event_seq INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      embedding BLOB,
      kind TEXT NOT NULL
    );`
  const db = new DatabaseSync(dbPath)
  db.exec(MEMORIES_TABLE_SQL)
  // ⚠️ CREATE TABLE IF NOT EXISTS 对**已存在**的老库不生效 ⇒ embedding 列须显式迁移（幂等）。
  const memoryColumns = db.prepare('PRAGMA table_info(memories)').all() as unknown as Array<{ name?: string }>
  if (!memoryColumns.some((column) => column.name === 'embedding')) {
    db.exec('ALTER TABLE memories ADD COLUMN embedding BLOB')
  }
  // ⚠️ kind 列迁移（同上：老库的 CREATE 不生效）：ADD COLUMN 不能加「无 DEFAULT 的 NOT NULL」
  //    到有数据的表 ⇒ 有数据必须表重建；空库直接 DROP＋重建（不复制任何行）。
  const hasKindColumn = memoryColumns.some((column) => column.name === 'kind')
  if (!hasKindColumn) {
    const rowCount = Number((db.prepare('SELECT COUNT(*) AS n FROM memories').get() as { n: number | bigint }).n)
    if (rowCount === 0) {
      db.exec('DROP TABLE memories')
      db.exec(MEMORIES_TABLE_SQL)
    } else {
      db.exec('BEGIN IMMEDIATE')
      try {
        db.exec(`
          CREATE TABLE memories_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            source_event_seq INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            embedding BLOB,
            kind TEXT NOT NULL
          );
          INSERT INTO memories_new (id, session_id, source_event_seq, content, created_at, embedding, kind)
            SELECT id, session_id, source_event_seq, content, created_at, embedding, 'transcript' FROM memories;
          DROP TABLE memories;
          ALTER TABLE memories_new RENAME TO memories;
        `)
        db.exec('COMMIT')
      } catch (err) {
        db.exec('ROLLBACK')
        throw err
      }
    }
  }
  // ③.1 · 部分唯一索引：流水按「会话＋事件序号」唯一；摘要不是「某一条事件」、不受该约束。
  //   老库若已有非部分索引 ⇒ 先 DROP 再按新口径建（幂等）。
  const existingIndex = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_memories_session_seq'")
    .get() as { sql?: string } | undefined
  if (existingIndex?.sql && !/WHERE\s+kind\s*=\s*'transcript'/i.test(existingIndex.sql)) {
    db.exec('DROP INDEX idx_memories_session_seq')
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_session_seq
      ON memories(session_id, source_event_seq) WHERE kind='transcript';
  `)
  // ⚠️ 显式写 created_at 而不是依赖列 DEFAULT：CREATE TABLE IF NOT EXISTS 对**已存在**的表不生效，
  //    老库的 DEFAULT 仍是 UTC。显式 localtime 对新旧库行为一致（本机时区，便于人读）。
  const insertRow = db.prepare(
    "INSERT OR IGNORE INTO memories(session_id, source_event_seq, content, kind, created_at) VALUES(?,?,?,'transcript', datetime('now','localtime'))"
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
    'SELECT id, session_id, content, created_at, embedding FROM memories WHERE embedding IS NOT NULL AND session_id <> ? ORDER BY id DESC'
  )
  // ③.1：向量只服务召回（召回只看 kind='memory'）⇒ 回填只挑摘要；流水老行不返工、不删。
  const selectMissingVectors = db.prepare(
    "SELECT id, content FROM memories WHERE embedding IS NULL AND kind='memory' ORDER BY id ASC"
  )
  const updateEmbedding = db.prepare(
    'UPDATE memories SET embedding = ? WHERE id = ?'
  )
  // cordis 4.0.2 effect 语义：execute 返回 disposer（fiber 卸载时回收）
  ctx.effect(() => () => { db.close() })

  // ── ③.2b · 人审闸（写入前必须过人）────────────────────────────────────────
  // staging 表 ＋ 表决 ＋「只进被批准的那一版」。⛔ memories 的摘要 INSERT 只在本闸内发生。
  ensureStagingTable(db)
  interface ApprovalSeamLike {
    request(req: ApprovalRequestLike): Promise<string>
  }
  const memoryWriteGate = createMemoryWriteGate(
    db,
    async (req) => {
      const approval = ctx.get('approval') as unknown as ApprovalSeamLike | undefined
      // 审批服务缺失 ⇒ fail closed（抛错由闸归一为 unavailable，并留诊断原文）
      if (approval === undefined) throw new Error('approval service missing (ctx.get("approval") === undefined)')
      return await approval.request({ ...req, signal: req.signal ?? new AbortController().signal })
    },
    {
      afterInsert: (id, content) => {
        void ingestEmbedding(id, content)
        void doubleWrite(String(id), content)
      },
    },
  )
  const writeGateService = {
    stage: (input: MemoryWriteInput) => stageMemorySummary(db, input),
    updateStagedContent: (id: number, content: string) => updateStagedContent(db, id, content),
    readStaged: (id: number) => readStaged(db, id),
    approveAndWrite: (stageId: number, params: { agent: unknown; callId: string; signal?: AbortSignal }) =>
      memoryWriteGate.approveAndWrite(stageId, params),
  }
  // ⚠️ 服务提供在**本插件自己的 ctx**上：cordis 禁止子 fiber 往根 ctx 注册
  //    （实测报错 `service "memoryWriteGate" has been registered at <root>` ⇒ 插件树加载失败）。
  //    兄弟插件用 `ctx.inject(['memoryWriteGate'], cb)` 等它就绪（本 fiber ACTIVE 后即可见）。
  ctx.provide('memoryWriteGate', writeGateService)

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
    // ⑪.1：维护本会话的 live 事件统计；每个 turn/end 刷新自描述清单
    const sessionKey = String(session.id)
    let stats = sessionStats.get(sessionKey)
    if (!stats) {
      stats = createSessionStats()
      sessionStats.set(sessionKey, stats)
    }
    observeSessionEvent(stats, event)
    if ((event as { type?: string }).type === 'turn/end') {
      scheduleManifestRefresh('turn/end')
    }

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
    // ③.1 · L-6：流水行（kind='transcript'）不写 embedding —— 召回只看 kind='memory'，
    //   流水的向量没有消费方。⚠️ Chroma 双写未在本单收窄（本期默认关），见回报「边界」。
    void doubleWrite(String(info.lastInsertRowid), text)
  })

  // 启动清点：把已有存档（含插件安装前产生的）纳入清单；失败只走 degraded 通道
  scheduleManifestRefresh('startup')

  // ── 注入面（默认仅 context 面；section 面由 config 显式开启）────────────────
  const RECALL_NAME = 'larry-memory-recall'
  const RECALL_TITLE_PREFIX = '## LarryAgent 记忆召回'

  /**
   * 来源短标识：`session_id` 最后一个 `-` 之后的前 8 位；若这段不是 8 位小写 hex，
   * 改用 `sha256(session_id)` 的前 8 位（②.2.2 C 组守卫）。
   * ⚠️ 不能取整串前 8 位：实库里 session_id 均以 `session-` 开头（`session-391-*` 多个），
   * 前 8 位恒为 `session-`，没有任何可别性（②.2.2 实测）。
   * ⚠️ 退化样本如 `seed-session` ⇒ 末段 `session`（8 字符但非 hex，零判别力）⇒ 必须走哈希，
   * 否则格式正则不匹配、且不同退化 id 可能塌成同一 src。
   * `unknown0` 为不可达兜底（schema 里 session_id NOT NULL）——它**不匹配**注入格式正则，
   * 一旦出现会让探针判红，而不是静默产出假标识。
   */
  function shortSourceOf(sessionId: string | undefined): string {
    if (!sessionId) return 'unknown0'
    const tail = sessionId.slice(sessionId.lastIndexOf('-') + 1).slice(0, 8)
    if (/^[0-9a-f]{8}$/.test(tail)) return tail
    return createHash('sha256').update(sessionId, 'utf8').digest('hex').slice(0, 8)
  }

  /**
   * 统一渲染（②.2.2 起两条路共用，入参差异在此收口）：
   *   - `semantic=true`（语义路）：行格式 `- [时间] (0.687, 0a898fc3) 正文`，score 必由
   *     `cosineTopK` 返回的 `ScoredRecall` 带进来（⛔ 不在本函数重算余弦）；
   *   - `semantic=false`（时间倒序降级路）：**格式一字不改**，仍 `- [时间] 正文`，
   *     ⛔ 不接受 score，也绝不拼 `(0.000, …)`。
   * 标题行只随 semantic 变（`语义 top-N` / `最近 N 条`），⛔ 不重排。
   */
  function formatRecall(entries: Array<{ row: RecallRow; score?: number }>, semantic: boolean): string {
    if (entries.length === 0) return '' // 空库 → 空贡献（不产生注入块）
    // 时间戳以本地时刻呈现（数据层已 localtime）。召回只走 context 面（动态区），
    // ⇒ 时间戳不会进入 system prompt 前缀，不影响缓存命中。
    const lines = entries.map(({ row, score }) => {
      const content = row.content.replace(/\n/g, ' ')
      if (!semantic) return `- [${row.created_at}] ${content}`
      // 语义路 score 必存在（ScoredRecall）；`no-score` 是不可达兜底（不匹配格式正则 ⇒ 探针判红）
      const scoreText = typeof score === 'number' && Number.isFinite(score) ? score.toFixed(3) : 'no-score'
      return `- [${row.created_at}] (${scoreText}, ${shortSourceOf(row.session_id)}) ${content}`
    })
    const label = semantic ? `语义 top-${entries.length}` : `最近 ${entries.length} 条`
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
    return rows.length ? formatRecall(rows.map((row) => ({ row })), false) : ''
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
      const delta = Number.isFinite(cfg.recallDelta) ? cfg.recallDelta : 0.20
      const limit = Number.isFinite(cfg.recallLimit) ? cfg.recallLimit : 6

      if (rows.length === 0) {
        // ②.2.1 R-6：过滤后候选池为空 ⇒ 必写被挡记录；但**真空库**保持 P8-d 控制臂（不写）。
        // 判别：库里一行都没有（anyRows=0）＝真空库；有记忆但无跨会话候选＝过滤后为空。
        const anyRows = selectRecent.all(1) as unknown as RecallRow[]
        if (anyRows.length > 0) {
          writeGate(
            `${RECALL_GATE_MARK} candidates=0 kept=0 blocked=0 truncated=0 blocked_top=none top1=none delta=${delta} limit=${limit} reason=no-cross-session-vectors sentinel=${P221_DEPLOY_SENTINEL}`,
          )
        }
        return { text: '', emptyReason: 'no-cross-session-vectors' }
      }

      // 先取**全部**候选（limit=rows.length），再在 JS 层过门＋截上限：
      // ⛔ 不在 SQL 加 LIMIT，避免「候选变少」与「被门挡掉」两个变量混在一起。
      const scoredAll = cosineTopK(rows, cached.vector, rows.length)
      if (scoredAll.length === 0) return { text: '', emptyReason: 'no-candidates' }

      // ②.2.3：全量候选之后、相关性门之前先做近似去重——
      // 去重管「候选彼此是不是说同一件事」，门管「跟 query 够不够相关」，两件事不混。
      const dedupThreshold = Number.isFinite(cfg.recallDedupThreshold)
        ? cfg.recallDedupThreshold
        : 0.80
      const dedup = dedupeNearDuplicates(scoredAll, rows, dedupThreshold)
      // 每轮都写（removed=0 也写）：少了条必须能解释，否则会和「被门挡掉」混在一起
      writeDedup(
        `${RECALL_DEDUP_MARK} candidates=${scoredAll.length} removed=${dedup.removedCount} threshold=${dedupThreshold} sentinel=${P223_DEPLOY_SENTINEL}`,
      )

      const gate = applyRecallGate(dedup.kept, delta, limit)
      const blockedTopText = gate.blockedTop === null ? 'none' : gate.blockedTop.toFixed(6)
      const top1Text = gate.top1 === null ? 'none' : gate.top1.toFixed(6)
      // 每轮召回都写：被挡条数 ＋ 被挡最高分（⛔ 不写内容；全挡/空池也写）
      // ⚠️ candidates 记「进入门的条数」（= 去重后），保持 T-1b 恒等式
      // candidates == kept + blocked + truncated 在去重场景下仍成立。
      writeGate(
        `${RECALL_GATE_MARK} candidates=${dedup.kept.length} kept=${gate.kept.length} blocked=${gate.blockedCount} truncated=${gate.truncatedCount} blocked_top=${blockedTopText} top1=${top1Text} delta=${delta} limit=${limit} reason=ok sentinel=${P221_DEPLOY_SENTINEL}`,
      )
      if (gate.kept.length === 0) return { text: '', emptyReason: 'all-below-gate' }
      return { text: formatRecall(gate.kept, true) }
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
