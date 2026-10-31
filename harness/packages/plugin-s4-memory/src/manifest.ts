/**
 * S4 记忆插件 · ⑪.1 存档自描述清单（D6 第 ⑥ 类）
 *
 * 职责：
 * - 为 `$DSH_HOME/sessions/<workspace>/<session>/session[.vN].jsonl.zstd` 每份存档
 *   写一行纯文本 JSONL：是什么 / 怎么来的 / 用什么读 / 校验和
 * - 校验和必须带「算于哪个时刻、覆盖多少字节」——存档是多帧 zstd 追加，
 *   hash 只在某一时刻成立
 * - 存档缺失时不得继续声称完整：标记 missing ＋ last_known
 * - 清单本身不依赖本项目代码：任何 zstd 解码器 ＋ JSON 解析器即可读
 *
 * 三问（C-3）在清单里能自答：`entry_type`/`format`（是什么）、`origin`（何时·谁·
 * 为何）、`format.read_with`（用什么工具与格式版本）。七类完备性在
 * `completeness` 字段逐项给出 present/reason，⛔ 不用「没考虑过」这一档。
 *
 * 与其他模块的关系：
 * - 被 `src/index.ts` 调用：启动时清点一次，此后每个 `turn/end` 刷新当前会话
 * - 路径由 `config.manifestPath` 指定（支持 `${DSH_HOME}` 占位与相对路径）
 * - 只读会话存档，⛔ 不改任何存档文件
 */

import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

export const MANIFEST_VERSION = 1
/** 默认落点：与 sessions 存档同层（`$DSH_HOME/sessions/`） */
export const MANIFEST_DEFAULT_PATH = 'sessions/archive-manifest.jsonl'
/** 清单写失败/读失败统一通道（与 Chroma 降级串区分，⛔ 不冒充降级） */
export const MANIFEST_DEGRADED_MARK = '[S36-MEMORY] manifest degraded:'
/** 场地隔离断言：manifestPath 落在当前 home 之外且未豁免 */
export const MANIFEST_OUTSIDE_HOME_DENY_MARK =
  '[S36-MEMORY] manifestPath outside home (denied):'
/** 场地隔离断言：同上但显式豁免（stderr 审计行，含解析后的绝对路径） */
export const MANIFEST_OUTSIDE_HOME_ALLOW_MARK =
  '[S36-MEMORY] manifestPath outside home (allowed by config.allowOutsideHome):'

const ZSTD_MAGIC = 0xfd2fb528
const ZSTD_SUFFIX = '.zstd'

/** 非附件类内容块（其余块类型按附件证据计数） */
const NON_ATTACHMENT_BLOCK_TYPES = new Set(['text', 'reasoning', 'tool-call', 'tool-result'])

type JsonRecord = Record<string, unknown>

/** `child` 是否落在 `parent` 之内（含 parent 自身；win32 下 path.relative 忽略大小写） */
function isWithin(parent: string, child: string): boolean {
  const rel = relative(parent, child)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

/** 配置里的 manifestPath：`${DSH_HOME}` 占位替换 ＋ 相对路径按 home 解析 */
export function resolveManifestPath(raw: string | undefined, home: string): string {
  const substituted = (raw ?? '').split('${DSH_HOME}').join(home).trim()
  const value = substituted || MANIFEST_DEFAULT_PATH
  return isAbsolute(value) ? resolve(value) : resolve(home, value)
}

/**
 * 场地隔离断言（Tier0 红线 4 的代码化）：
 * manifestPath 落在 home 之外 ⇒ 默认 fail（⛔ 不是 warn），防止临时 home 的测试
 * 把清单写进真实 `.dsh-home/sessions/`。
 */
export function assertManifestPathInsideHome(
  home: string,
  manifestPath: string,
  allowOutsideHome: boolean,
): void {
  if (isWithin(home, manifestPath)) return
  if (allowOutsideHome) {
    process.stderr.write(
      `${MANIFEST_OUTSIDE_HOME_ALLOW_MARK} manifestPath=${manifestPath} home=${home}\n`,
    )
    return
  }
  const line = `${MANIFEST_OUTSIDE_HOME_DENY_MARK} manifestPath=${manifestPath} home=${home}`
  process.stderr.write(`${line}\n`)
  throw new Error(line)
}

// ==========================================================================
// 事件统计（live 与 archive-read 共用同一个口径）
// ==========================================================================

export interface SessionEventStats {
  events: number
  eventTypes: Record<string, number>
  firstSeq: number | null
  lastSeq: number | null
  firstTime: number | null
  lastTime: number | null
  userMessages: number
  assistantMessages: number
  assistantAttempts: number
  toolCalls: number
  toolResults: number
  interruptedMessages: number
  reasoningBlocks: number
  reasoningTokens: number
  attachmentBlocks: number
  turnEndKinds: Record<string, number>
  requestHeader: number
  systemMessage: number
  modelSelection: number
  environmentPrompt: number
  readErrors: number
}

export function createSessionStats(): SessionEventStats {
  return {
    events: 0,
    eventTypes: {},
    firstSeq: null,
    lastSeq: null,
    firstTime: null,
    lastTime: null,
    userMessages: 0,
    assistantMessages: 0,
    assistantAttempts: 0,
    toolCalls: 0,
    toolResults: 0,
    interruptedMessages: 0,
    reasoningBlocks: 0,
    reasoningTokens: 0,
    attachmentBlocks: 0,
    turnEndKinds: {},
    requestHeader: 0,
    systemMessage: 0,
    modelSelection: 0,
    environmentPrompt: 0,
    readErrors: 0,
  }
}

function recordOf(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function stringOf(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function numberOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function addCount(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1
}

function addReasoningTokens(stats: SessionEventStats, usage: unknown): void {
  const record = recordOf(usage)
  const tokens = record ? numberOf(record.reasoningTokens) : null
  if (tokens !== null) stats.reasoningTokens += tokens
}

/** 内容块：reasoning 计原文；非 text/reasoning/tool 类块计附件证据 */
function scanContentBlocks(content: unknown, stats: SessionEventStats): void {
  if (!Array.isArray(content)) return
  for (const raw of content) {
    const block = recordOf(raw)
    if (!block) continue
    const type = stringOf(block.type)
    if (!type) continue
    if (type === 'reasoning') stats.reasoningBlocks += 1
    else if (!NON_ATTACHMENT_BLOCK_TYPES.has(type)) stats.attachmentBlocks += 1
  }
}

/** v3 stream 记录：reasoning-chunks / block-start|end 的 reasoning 块 */
function scanStreamRecords(stream: unknown, stats: SessionEventStats): void {
  if (!Array.isArray(stream)) return
  for (const raw of stream) {
    const record = recordOf(raw)
    if (!record) continue
    if (stringOf(record.type) === 'reasoning-chunks') {
      stats.reasoningBlocks += 1
      continue
    }
    const chunk = recordOf(record.chunk)
    if (!chunk) continue
    if (stringOf(chunk.type) === 'block-start' && stringOf(chunk.blockType) === 'reasoning') {
      stats.reasoningBlocks += 1
    }
    if (stringOf(chunk.type) === 'block-end') {
      const block = recordOf(chunk.block)
      if (block && stringOf(block.type) === 'reasoning') stats.reasoningBlocks += 1
    }
    if (stringOf(chunk.type) === 'usage') addReasoningTokens(stats, chunk.usage)
  }
}

/** v0 stream 事件（assistant/chunk）与 v3 共用同一 chunk 形状 */
function scanLegacyChunk(chunk: unknown, stats: SessionEventStats): void {
  const record = recordOf(chunk)
  if (!record) return
  if (stringOf(record.type) === 'block-start' && stringOf(record.blockType) === 'reasoning') {
    stats.reasoningBlocks += 1
  }
  if (stringOf(record.type) === 'block-end') {
    const block = recordOf(record.block)
    if (block && stringOf(block.type) === 'reasoning') stats.reasoningBlocks += 1
  }
  if (stringOf(record.type) === 'usage') addReasoningTokens(stats, record.usage)
  if (stringOf(record.type) === 'reasoning-delta') stats.reasoningBlocks += 1
}

/**
 * 观测一个 `session/event`（live）或存档里的一行事件（archive-read）。
 * ⛔ 只读，不修改传入事件。
 */
export function observeSessionEvent(stats: SessionEventStats, event: unknown): void {
  const envelope = recordOf(event)
  if (!envelope) return
  const type = stringOf(envelope.type) ?? ''
  if (!type) return
  stats.events += 1
  addCount(stats.eventTypes, type)

  const seq = numberOf(envelope.seq)
  if (seq !== null) {
    stats.firstSeq = stats.firstSeq === null ? seq : Math.min(stats.firstSeq, seq)
    stats.lastSeq = stats.lastSeq === null ? seq : Math.max(stats.lastSeq, seq)
  }
  const time = numberOf(envelope.time)
  if (time !== null) {
    stats.firstTime = stats.firstTime === null ? time : Math.min(stats.firstTime, time)
    stats.lastTime = stats.lastTime === null ? time : Math.max(stats.lastTime, time)
  }

  const data = recordOf(envelope.data) ?? {}

  switch (type) {
    case 'user/message': {
      stats.userMessages += 1
      scanContentBlocks(data.content, stats)
      const message = recordOf(data.message)
      if (message) scanContentBlocks(message.content, stats)
      break
    }
    case 'assistant/message': {
      stats.assistantMessages += 1
      if (data.interrupted === true) stats.interruptedMessages += 1
      addReasoningTokens(stats, data.usage)
      scanStreamRecords(data.stream, stats)
      const message = recordOf(data.message)
      if (message) scanContentBlocks(message.content, stats)
      break
    }
    case 'assistant/attempt': {
      stats.assistantAttempts += 1
      scanStreamRecords(data.stream, stats)
      break
    }
    case 'assistant/chunk': {
      scanLegacyChunk(data.chunk, stats)
      break
    }
    case 'reasoning-chunks': {
      stats.reasoningBlocks += 1
      break
    }
    case 'tool/call': {
      stats.toolCalls += 1
      break
    }
    case 'tool/result': {
      stats.toolResults += 1
      break
    }
    case 'turn/end': {
      const reason = recordOf(data.reason)
      const kind = reason ? stringOf(reason.kind) : null
      addCount(stats.turnEndKinds, kind ?? 'unknown')
      break
    }
    case 'request/header': {
      stats.requestHeader += 1
      const header = recordOf(data.header)
      const system = header ? stringOf(header.system) : null
      if (system && system.trim().length > 0) stats.environmentPrompt += 1
      break
    }
    case 'system/message': {
      stats.systemMessage += 1
      const message = recordOf(data.message)
      if (message) {
        const content = message.content
        if (Array.isArray(content)) {
          for (const raw of content) {
            const block = recordOf(raw)
            if (block && stringOf(block.type) === 'text' && stringOf(block.text)) {
              stats.environmentPrompt += 1
              break
            }
          }
        }
      }
      break
    }
    case 'model/selection': {
      stats.modelSelection += 1
      break
    }
    case 'deliverables/presented': {
      stats.attachmentBlocks += 1
      break
    }
    default:
      break
  }
}

// ==========================================================================
// Zstandard 多帧扫描（与上游 @deepseek-ai/dsh-session-persistence-jsonl 同构）
// ==========================================================================

interface ZstdFrameRange {
  start: number
  end: number
}

interface ZstdFrameScan {
  frames: ZstdFrameRange[]
  tornStart?: number
}

/** 定位完整 zstd 帧，不解压（上游 scanZstdFrames 的等价实现） */
function scanZstdFrames(buffer: Buffer, maxFrames = Number.POSITIVE_INFINITY): ZstdFrameScan {
  const frames: ZstdFrameRange[] = []
  let offset = 0
  while (offset < buffer.length) {
    const start = offset
    if (buffer.length - offset < 4) return { frames, tornStart: start }
    if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) {
      throw new Error(`invalid zstd frame magic at byte ${offset}`)
    }
    offset += 4
    if (offset === buffer.length) return { frames, tornStart: start }
    const descriptor = buffer.readUInt8(offset)
    offset += 1
    if ((descriptor & 24) !== 0) {
      throw new Error(`reserved zstd frame-header bit at byte ${offset - 1}`)
    }
    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 32) !== 0
    const checksum = (descriptor & 4) !== 0
    const dictionaryFlag = descriptor & 3
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag
    const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    if (buffer.length - offset < remainingHeaderBytes) return { frames, tornStart: start }
    offset += remainingHeaderBytes
    for (;;) {
      if (buffer.length - offset < 3) return { frames, tornStart: start }
      const blockHeader = buffer.readUIntLE(offset, 3)
      offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 3
      const blockSize = blockHeader >>> 3
      if (blockType === 3) throw new Error(`reserved zstd block type at byte ${offset - 3}`)
      const payloadBytes = blockType === 1 ? 1 : blockSize
      if (buffer.length - offset < payloadBytes) return { frames, tornStart: start }
      offset += payloadBytes
      if (lastBlock) break
    }
    if (checksum) {
      if (buffer.length - offset < 4) return { frames, tornStart: start }
      offset += 4
    }
    frames.push({ start, end: offset })
    if (frames.length === maxFrames) return { frames }
  }
  return { frames }
}

// ==========================================================================
// 存档读取：header ＋ 事件统计 ＋ 帧结构
// ==========================================================================

export interface ArchiveHeader {
  version: number | null
  id: string | null
  createdAt: number | null
  cwd: string | null
}

export interface ArchiveFacts {
  header: ArchiveHeader
  stats: SessionEventStats
  frames: number
  torn: boolean
  errors: string[]
}

function emptyHeader(): ArchiveHeader {
  return { version: null, id: null, createdAt: null, cwd: null }
}

/**
 * 读一份存档的「可自描述事实」：header、事件类型统计、帧数、损坏说明。
 * 支持 `.zstd` 多帧容器与未压缩 `.jsonl`；⛔ 不依赖 DSH 内部库。
 */
export function readArchiveFacts(buffer: Buffer): ArchiveFacts {
  const stats = createSessionStats()
  const errors: string[] = []
  const header = emptyHeader()
  let frames = 0
  let torn = false

  const compressed =
    buffer.length >= 4 && buffer.readUInt32LE(0) === ZSTD_MAGIC
  let plain: Buffer = Buffer.alloc(0)

  if (compressed) {
    try {
      const scan = scanZstdFrames(buffer)
      frames = scan.frames.length
      torn = scan.tornStart !== undefined
      const parts: Buffer[] = []
      for (const frame of scan.frames) {
        try {
          parts.push(zstdDecompressSync(buffer.subarray(frame.start, frame.end)))
        } catch (err) {
          errors.push(
            `zstd frame ${frame.start}-${frame.end} decode failed: ${err instanceof Error ? err.message : String(err)}`,
          )
        }
      }
      plain = Buffer.concat(parts)
    } catch (err) {
      errors.push(`zstd frame scan failed: ${err instanceof Error ? err.message : String(err)}`)
      try {
        plain = zstdDecompressSync(buffer)
        frames = 1
      } catch (inner) {
        errors.push(
          `whole-file decompress failed: ${inner instanceof Error ? inner.message : String(inner)}`,
        )
      }
    }
  } else {
    plain = buffer
    frames = 1
  }

  const lines = plain.toString('utf8').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(line)
    } catch (err) {
      stats.readErrors += 1
      errors.push(`json line parse failed: ${err instanceof Error ? err.message : String(err)}`)
      continue
    }
    const record = recordOf(parsed)
    if (!record) {
      stats.readErrors += 1
      continue
    }
    if (stringOf(record.type) === 'session') {
      const version = numberOf(record.version)
      header.version = version
      header.id = stringOf(record.id)
      header.createdAt = numberOf(record.createdAt)
      header.cwd = stringOf(record.cwd)
      continue
    }
    observeSessionEvent(stats, parsed)
  }

  return { header, stats, frames, torn, errors }
}

// ==========================================================================
// 清单行
// ==========================================================================

export type CompletenessState = boolean | 'unknown'

export interface CompletenessItem {
  present: CompletenessState
  reason: string
}

export interface ManifestChecksum {
  algorithm: 'sha256'
  value: string
  computed_at: string
  covered_bytes: number
  mtime_ms: number
  note: string
}

export interface ManifestStats {
  source: 'live-events' | 'archive-read'
  frames: number
  torn: boolean
  events: number
  event_types: Record<string, number>
  first_seq: number | null
  last_seq: number | null
  first_time: string | null
  last_time: string | null
  user_messages: number
  assistant_messages: number
  assistant_attempts: number
  interrupted_messages: number
  tool_calls: number
  tool_results: number
  reasoning_blocks: number
  reasoning_tokens: number
  attachment_blocks: number
  turn_end_kinds: Record<string, number>
  environment_prompt: number
  read_errors: number
  stale?: true
}

export interface ManifestEntry {
  manifest_version: number
  entry_type: 'dsh-session-archive'
  archive: string
  session_id: string
  workspace: string
  origin: {
    recorded_by: string
    trigger: string
    recorded_at: string
    timezone: string
    session_created_at: string | null
    cwd: string | null
    first_seen_at: string
    last_checked_at: string
  }
  format: {
    version: number | null
    version_label: string
    filename_pattern: string
    container: string
    payload: string
    read_with: string[]
    legacy_note?: string
    no_project_dependency: true
  }
  archive_state: 'present' | 'missing' | 'unreadable'
  checksum: ManifestChecksum | null
  last_known: (ManifestChecksum & { last_seen_at: string }) | null
  stats: ManifestStats | null
  completeness: {
    session_context: CompletenessItem
    attachments: CompletenessItem
    cot: CompletenessItem
    unadopted_branches: CompletenessItem
    environment: CompletenessItem
    self_description: CompletenessItem
    format_constraints: CompletenessItem
  }
}

interface ScannedArchive {
  file: string
  archive: string
  workspace: string
  sessionId: string
}

function archiveRelative(home: string, file: string): string {
  return relative(home, file).split('\\').join('/')
}

/** 盘点 `<home>/sessions/<workspace>/<session>/session[.vN].jsonl[.zstd]` */
export function scanSessionArchives(home: string): ScannedArchive[] {
  const root = join(home, 'sessions')
  if (!existsSync(root)) return []
  const found: ScannedArchive[] = []
  for (const workspace of readdirSync(root, { withFileTypes: true })) {
    if (!workspace.isDirectory()) continue
    const workspacePath = join(root, workspace.name)
    for (const session of readdirSync(workspacePath, { withFileTypes: true })) {
      if (!session.isDirectory()) continue
      const sessionPath = join(workspacePath, session.name)
      for (const entry of readdirSync(sessionPath, { withFileTypes: true })) {
        if (!entry.isFile()) continue
        if (!/^session(\.v\d+)?\.jsonl(\.zstd)?$/.test(entry.name)) continue
        const file = join(sessionPath, entry.name)
        found.push({
          file,
          archive: archiveRelative(home, file),
          workspace: workspace.name,
          sessionId: session.name,
        })
      }
    }
  }
  return found.sort((a, b) => a.archive.localeCompare(b.archive))
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function isoFromMs(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString()
}

function formatOf(version: number | null): ManifestEntry['format'] {
  const label = version === null ? 'unknown' : `dsh-session-format v${version}`
  const pattern = version === 0 ? 'session.jsonl[.zstd]' : 'session.vN.jsonl[.zstd]'
  const format: ManifestEntry['format'] = {
    version,
    version_label: label,
    filename_pattern: pattern,
    container: version === 0 ? 'single/multi-frame Zstandard (.jsonl.zstd) or raw .jsonl' : 'concatenated Zstandard frames (.jsonl.zstd) or raw .jsonl',
    payload:
      'UTF-8 JSONL: first line is the session header object; following lines are session events with type/seq/time/data',
    read_with: [
      '1) If the file ends with .zstd, decompress every Zstandard frame in file order (any zstd decoder works, e.g. Node >= 24 zlib.zstdDecompressSync or the zstd CLI).',
      '2) Concatenate the frame plaintexts; the result is UTF-8 JSONL.',
      '3) Parse each non-empty line as JSON: first object is the session header, the rest are events.',
      '4) No project code, database, or network is required.',
    ],
    no_project_dependency: true,
  }
  if (version !== null && version < 3) {
    format.legacy_note =
      'Historical format: model stream pieces appear as assistant/chunk + text-chunks events; v3 stores them inside assistant/message.stream. The JSONL envelope stays the same.'
  }
  return format
}

function statsForManifest(stats: SessionEventStats, source: 'live-events' | 'archive-read', frames: number, torn: boolean): ManifestStats {
  return {
    source,
    frames,
    torn,
    events: stats.events,
    event_types: stats.eventTypes,
    first_seq: stats.firstSeq,
    last_seq: stats.lastSeq,
    first_time: isoFromMs(stats.firstTime),
    last_time: isoFromMs(stats.lastTime),
    user_messages: stats.userMessages,
    assistant_messages: stats.assistantMessages,
    assistant_attempts: stats.assistantAttempts,
    interrupted_messages: stats.interruptedMessages,
    tool_calls: stats.toolCalls,
    tool_results: stats.toolResults,
    reasoning_blocks: stats.reasoningBlocks,
    reasoning_tokens: stats.reasoningTokens,
    attachment_blocks: stats.attachmentBlocks,
    turn_end_kinds: stats.turnEndKinds,
    environment_prompt: stats.environmentPrompt,
    read_errors: stats.readErrors,
  }
}

function completenessFor(
  stats: SessionEventStats | null,
  archiveState: 'present' | 'missing' | 'unreadable',
  checkedAt: string,
): ManifestEntry['completeness'] {
  const unknown = (reason: string): CompletenessItem => ({ present: 'unknown', reason })
  const selfReason = '本清单行（archive-manifest.jsonl）'
  const formatReason = 'format 字段给出文件名/容器/版本/读取步骤'

  if (archiveState !== 'present' || stats === null) {
    return {
      session_context: unknown(`存档 ${archiveState}（检查时刻 ${checkedAt}），未核实当前内容`),
      attachments: unknown(`存档 ${archiveState}（检查时刻 ${checkedAt}），未核实当前内容`),
      cot: unknown(`存档 ${archiveState}（检查时刻 ${checkedAt}），未核实当前内容`),
      unadopted_branches: unknown(`存档 ${archiveState}（检查时刻 ${checkedAt}），未核实当前内容`),
      environment: unknown(`存档 ${archiveState}（检查时刻 ${checkedAt}），未核实当前内容`),
      self_description: { present: true, reason: selfReason },
      format_constraints: { present: true, reason: formatReason },
    }
  }

  const contextCount =
    stats.userMessages + stats.assistantMessages + stats.toolCalls + stats.toolResults
  const aborted = stats.turnEndKinds.aborted ?? 0
  const errored = stats.turnEndKinds.error ?? 0
  const blocked = stats.turnEndKinds.blocked ?? 0
  const unadopted =
    stats.assistantAttempts + stats.interruptedMessages + aborted + errored + blocked

  let cot: CompletenessItem
  if (stats.reasoningBlocks > 0) {
    cot = {
      present: true,
      reason: `流中含 reasoning 原文块 ${stats.reasoningBlocks} 个（reasoningTokens=${stats.reasoningTokens}）`,
    }
  } else if (stats.reasoningTokens > 0) {
    cot = {
      present: 'unknown',
      reason: `usage.reasoningTokens=${stats.reasoningTokens} 但流中无 reasoning 原文；无法核实是否适配层未采`,
    }
  } else {
    cot = {
      present: false,
      reason:
        '流中无 reasoning 原文且 usage.reasoningTokens=0；无法核实 provider 是否返回（可能未返回或未采）',
    }
  }

  return {
    session_context: {
      present: contextCount > 0,
      reason: `user/message=${stats.userMessages}, assistant/message=${stats.assistantMessages}, tool/call=${stats.toolCalls}, tool/result=${stats.toolResults}`,
    },
    attachments: {
      present: stats.attachmentBlocks > 0,
      reason:
        stats.attachmentBlocks > 0
          ? `附件类内容块/deliverables 事件 ${stats.attachmentBlocks} 个`
          : '本会话事件中未出现附件类内容块或 deliverables/presented 事件',
    },
    cot,
    unadopted_branches: {
      present: unadopted > 0,
      reason: `assistant/attempt=${stats.assistantAttempts}, interrupted=${stats.interruptedMessages}, turn/end.aborted=${aborted}, error=${errored}, blocked=${blocked}`,
    },
    environment: {
      present: stats.requestHeader + stats.systemMessage + stats.modelSelection > 0,
      reason: `request/header=${stats.requestHeader}, system/message=${stats.systemMessage}, model/selection=${stats.modelSelection}, 提示词原文=${stats.environmentPrompt}`,
    },
    self_description: { present: true, reason: selfReason },
    format_constraints: { present: true, reason: formatReason },
  }
}

// ==========================================================================
// 清单刷新
// ==========================================================================

export interface RefreshOptions {
  /** 当前 DSH_HOME（绝对路径） */
  home: string
  /** 解析后的 manifest 绝对路径 */
  manifestPath: string
  /** 本进程内观察到的会话事件统计（可选；无则从存档读） */
  liveStats?: ReadonlyMap<string, SessionEventStats>
  /** 触发方：startup / turn/end / refresh */
  trigger?: string
  /** 便于测试固定时刻 */
  now?: Date
}

export interface ManifestRefreshResult {
  manifestPath: string
  entries: number
  added: number
  updated: number
  missing: number
  unreadable: number
  errors: string[]
  checkedAt: string
}

function readExistingEntries(manifestPath: string, errors: string[]): ManifestEntry[] {
  if (!existsSync(manifestPath)) return []
  let text: string
  try {
    text = readFileSync(manifestPath, 'utf8')
  } catch (err) {
    errors.push(`manifest read failed: ${err instanceof Error ? err.message : String(err)}`)
    return []
  }
  const entries: ManifestEntry[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try {
      const parsed = JSON.parse(line) as ManifestEntry
      if (
        parsed &&
        typeof parsed.archive === 'string' &&
        parsed.manifest_version === MANIFEST_VERSION &&
        parsed.origin !== undefined &&
        parsed.format !== undefined
      ) {
        entries.push(parsed)
      }
    } catch (err) {
      errors.push(`manifest line parse failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return entries
}

function writeManifestAtomic(manifestPath: string, entries: ManifestEntry[]): void {
  mkdirSync(dirname(manifestPath), { recursive: true })
  const body = entries.map((entry) => JSON.stringify(entry)).join('\n') + (entries.length ? '\n' : '')
  const tmp = `${manifestPath}.tmp-${process.pid}`
  writeFileSync(tmp, body, 'utf8')
  renameSync(tmp, manifestPath)
}

function missingEntry(prev: ManifestEntry, checkedAt: string): ManifestEntry {
  return {
    ...prev,
    origin: { ...prev.origin, last_checked_at: checkedAt },
    archive_state: 'missing',
    checksum: null,
    last_known: prev.checksum
      ? { ...prev.checksum, last_seen_at: prev.origin.last_checked_at }
      : null,
    stats: prev.stats ? { ...prev.stats, stale: true } : null,
    completeness: completenessFor(null, 'missing', checkedAt),
  }
}

function unreadableEntry(
  prev: ManifestEntry | undefined,
  scanned: ScannedArchive,
  checkedAt: string,
  reason: string,
): ManifestEntry {
  const base: ManifestEntry = {
    manifest_version: MANIFEST_VERSION,
    entry_type: 'dsh-session-archive',
    archive: scanned.archive,
    session_id: scanned.sessionId,
    workspace: scanned.workspace,
    origin: {
      recorded_by: 'plugin-s4-memory',
      trigger: 'refresh',
      recorded_at: checkedAt,
      timezone: 'UTC',
      session_created_at: null,
      cwd: null,
      first_seen_at: checkedAt,
      last_checked_at: checkedAt,
    },
    format: formatOf(null),
    archive_state: 'unreadable',
    checksum: null,
    last_known: null,
    stats: null,
    completeness: completenessFor(null, 'unreadable', checkedAt),
  }
  const merged = prev ? { ...prev } : base
  return {
    ...merged,
    archive_state: 'unreadable',
    checksum: null,
    last_known: prev?.checksum
      ? { ...prev.checksum, last_seen_at: prev.origin.last_checked_at }
      : merged.last_known,
    stats: prev?.stats ? { ...prev.stats, stale: true } : null,
    origin: { ...merged.origin, last_checked_at: checkedAt },
    completeness: completenessFor(null, 'unreadable', checkedAt),
  } as ManifestEntry
}

/**
 * 刷新清单：盘点所有存档 → 更新/新增/标记缺失 → 原子重写 JSONL。
 *
 * 选择「甲案」：每个 `turn/end` 更新该会话同一行（不依赖不存在的封存信号），
 * 同时在每次刷新时清点全部存档并标记缺失；⛔ 不追加同一存档的第二行。
 */
export async function refreshArchiveManifest(
  options: RefreshOptions,
): Promise<ManifestRefreshResult> {
  const now = options.now ?? new Date()
  const checkedAt = now.toISOString()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const errors: string[] = []
  const previous = readExistingEntries(options.manifestPath, errors)
  const previousByArchive = new Map(previous.map((entry) => [entry.archive, entry]))
  const scanned = scanSessionArchives(options.home)
  const entries: ManifestEntry[] = []
  const seen = new Set<string>()
  let added = 0
  let updated = 0
  let missing = 0
  let unreadable = 0

  for (const item of scanned) {
    seen.add(item.archive)
    const prev = previousByArchive.get(item.archive)
    let stat
    try {
      stat = statSync(item.file)
    } catch (err) {
      if (prev) {
        entries.push(missingEntry(prev, checkedAt))
        missing += 1
      } else {
        errors.push(
          `${item.archive}: stat failed: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
      continue
    }

    const unchanged =
      prev !== undefined &&
      prev.archive_state === 'present' &&
      prev.checksum != null &&
      prev.checksum.covered_bytes === stat.size &&
      prev.checksum.mtime_ms === stat.mtimeMs

    if (unchanged && prev) {
      entries.push({
        ...prev,
        origin: { ...prev.origin, last_checked_at: checkedAt },
      })
      continue
    }

    let buffer: Buffer
    try {
      buffer = readFileSync(item.file)
    } catch (err) {
      entries.push(
        unreadableEntry(
          prev,
          item,
          checkedAt,
          `${item.archive}: read failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
      )
      unreadable += 1
      continue
    }

    const checksum: ManifestChecksum = {
      algorithm: 'sha256',
      value: sha256(buffer),
      computed_at: checkedAt,
      covered_bytes: buffer.length,
      mtime_ms: stat.mtimeMs,
      note:
        'hash covers exactly covered_bytes bytes read at computed_at; the archive is append-only, so later writes change both hash and time',
    }

    const facts = readArchiveFacts(buffer)
    if (facts.errors.length > 0) {
      errors.push(`${item.archive}: ${facts.errors[0]}`)
    }

    const live = options.liveStats?.get(item.sessionId)
    const useLive = live !== undefined && live.firstSeq === 0
    const stats = useLive ? live : facts.stats
    const source: 'live-events' | 'archive-read' = useLive ? 'live-events' : 'archive-read'
    const version = facts.header.version
    const sessionId = facts.header.id ?? item.sessionId
    const readable = facts.errors.length === 0 && !facts.torn
    const entry: ManifestEntry = {
      manifest_version: MANIFEST_VERSION,
      entry_type: 'dsh-session-archive',
      archive: item.archive,
      session_id: sessionId,
      workspace: item.workspace,
      origin: {
        recorded_by: 'plugin-s4-memory',
        trigger: options.trigger ?? 'refresh',
        recorded_at: checkedAt,
        timezone,
        session_created_at: isoFromMs(facts.header.createdAt),
        cwd: facts.header.cwd,
        first_seen_at: prev?.origin.first_seen_at ?? checkedAt,
        last_checked_at: checkedAt,
      },
      format: formatOf(version),
      archive_state: readable ? 'present' : 'unreadable',
      checksum,
      last_known: null,
      stats: statsForManifest(stats, source, facts.frames, facts.torn),
      completeness: completenessFor(stats, readable ? 'present' : 'unreadable', checkedAt),
    }
    entries.push(entry)
    if (prev) updated += 1
    else added += 1
  }

  for (const [archive, prev] of previousByArchive) {
    if (seen.has(archive)) continue
    entries.push(missingEntry(prev, checkedAt))
    missing += 1
  }

  entries.sort((a, b) => a.archive.localeCompare(b.archive))
  if (entries.length > 0 || existsSync(options.manifestPath)) {
    writeManifestAtomic(options.manifestPath, entries)
  }

  return {
    manifestPath: options.manifestPath,
    entries: entries.length,
    added,
    updated,
    missing,
    unreadable,
    errors,
    checkedAt,
  }
}
