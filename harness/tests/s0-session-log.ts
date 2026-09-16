/**
 * S0 e2e 的回读助手：定位 session 落盘文件并把内容解出来（判据 ④ 用）。
 *
 * 为什么需要它：`dsh-session-persistence-jsonl` 默认写 **`session.v3.jsonl.zstd`（多帧 zstd）**
 * ⇒ "回读可查到同一 nonce"不能靠 grep 原始字节，必须真解码。
 * 解码口径与上游一致：Node `zlib.zstdDecompressSync` **逐帧**解（上游包的 public fallback 同款），
 * 帧按 zstd magic `28 B5 2F FD` 切分。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd] as const

/** 递归找出 `session*.jsonl` / `session*.jsonl.zstd`（按 mtime 新→旧）。 */
export function listSessionLogs(root: string): string[] {
  const found: string[] = []
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return
    for (const dirent of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, dirent.name)
      if (dirent.isDirectory()) walk(full)
      else if (/^session.*\.jsonl(\.zstd)?$/.test(dirent.name)) found.push(full)
    }
  }
  walk(root)
  return found.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
}

/** 多帧 zstd 解码（含单帧）。解不出时抛，调用方据此判红而不是静默当空。 */
export function decodeZstdFrames(buf: Buffer): string {
  const starts: number[] = []
  let i = buf.indexOf(ZSTD_MAGIC[0])
  while (i >= 0) {
    if (buf[i + 1] === ZSTD_MAGIC[1] && buf[i + 2] === ZSTD_MAGIC[2] && buf[i + 3] === ZSTD_MAGIC[3]) starts.push(i)
    i = buf.indexOf(ZSTD_MAGIC[0], i + 1)
  }
  if (starts.length === 0) throw new Error('no zstd frame magic found')
  const parts: string[] = []
  for (let k = 0; k < starts.length; k += 1) {
    const end = k + 1 < starts.length ? starts[k + 1] : buf.length
    try {
      parts.push(zstdDecompressSync(buf.subarray(starts[k]!, end)).toString('utf8'))
    } catch {
      // 帧边界可能被压缩数据里的 magic 误切 ⇒ 退一步：从本帧起到文件尾整体解一次
      parts.push(zstdDecompressSync(buf.subarray(starts[k]!)).toString('utf8'))
      break
    }
  }
  return parts.join('')
}

/** 读一个 session 日志文件（自动判压缩）。 */
export function readSessionLog(path: string): string {
  const buf = readFileSync(path)
  return path.endsWith('.zstd') ? decodeZstdFrames(buf) : buf.toString('utf8')
}

/**
 * 从解码后的会话文本里取 `tool/call` 事件的**工具名**与原始片段。
 *
 * ⚠️ 为什么必须有这一步：判据 ①（回包含 nonce）**不能证明是我们的工具干的** ——
 * 官方 `dsh-tool-fs` 也有读文件工具（名叫 `read`），模型完全可以改用官方那只把文件读出来。
 * 所以"工具名是不是 `read_file`"必须单独断言，否则 ① 绿灯是假绿。
 * @param text - 解码后的 session 日志文本（每行一个 JSON 事件）
 * @returns 命中的工具名（可能为空数组）与第一条原始 tool/call 行
 */
export function findToolCalls(text: string): { names: string[]; firstRaw?: string } {
  const names: string[] = []
  let firstRaw: string | undefined
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || !trimmed.includes('tool/call')) continue
    try {
      const parsed = JSON.parse(trimmed) as { type?: string; data?: Record<string, unknown> }
      if (parsed.type !== 'tool/call') continue
      firstRaw ??= trimmed.slice(0, 400)
      const data = parsed.data ?? {}
      const candidate = data.name ?? data.toolName ?? (data.tool as { name?: unknown } | undefined)?.name ?? (data.call as { name?: unknown } | undefined)?.name
      if (typeof candidate === 'string') names.push(candidate)
      else names.push('(name-unparsed)')
    } catch {
      names.push('(unparsable)')
    }
  }
  return { names, firstRaw }
}

/**
 * 在 home 下回读 session：返回文本（含 sessionId 过滤）。
 * @param home - 临时 DSH_HOME
 * @param sessionId - 可选：只认这一条会话的目录
 * @returns 命中的文件路径与解码文本；没命中返回 null（**不抛** —— 判红由调用方做）
 */
export function readSessionText(home: string, sessionId?: string): { path: string; text: string } | null {
  const root = join(home, 'sessions')
  const all = listSessionLogs(root)
  const hits = sessionId === undefined ? all : all.filter((p) => p.includes(sessionId))
  const target = hits[0] ?? all[0]
  if (target === undefined) return null
  try {
    return { path: target, text: readSessionLog(target) }
  } catch (e) {
    return { path: target, text: `<<decode failed: ${String((e as Error).message).slice(0, 200)}>>` }
  }
}
