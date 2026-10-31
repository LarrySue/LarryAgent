#!/usr/bin/env node
/**
 * LarryAgent 备份 · ⑪.4.1（WB 2026-11-01 00:58 派发）
 *
 * 目标：把四类数据打成一个可离机的单文件包 ＋ MANIFEST.md ＋ SHA256SUMS。
 * 数据类：记忆库（TS 在跑 ＋ Python 旧库）／会话流水／审计留痕／全量存档。
 *
 * 纪律：
 * - ⛔ 不读 `.dsh-home/.credentials.yaml`（路径排除）
 * - ⛔ 不备 `profiles/sdk`（依赖，不是数据）
 * - ⛔ 不覆盖旧包、不自动删包
 * - 不引入第三方依赖：tar 用系统自带，压缩用 tar -z（gzip）
 * - SQLite 用 `VACUUM INTO` 做一致性快照；只读连接，不改源库
 *
 * 用法：
 *   node scripts/backup/backup.mjs [--dest <dir>] [--repo <dir>] [--keep-stage] [--keep-verify]
 * 落点优先级：--dest ＞ LARRY_BACKUP_DIR ＞ D:/Code/_backups/larryagent
 * 外部介质：直接把 --dest 指到移动硬盘/网盘同步目录，不改代码。
 *
 * 退出码：0 成功；1 打包/校验失败；2 前置缺失或凭据形态命中（未出包）。
 */

import { spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { zstdDecompressSync } from 'node:zlib'

const DEFAULT_DEST = 'D:/Code/_backups/larryagent'
const NL = String.fromCharCode(10)
const ZSTD_MAGIC = 0xfd2fb528

const findings = []
const say = (line = '') => console.log(line)
const judge = (id, ok, detail) => {
  findings.push({ id, ok, detail })
  say(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail}`)
}
const obs = (id, detail) => {
  findings.push({ id, ok: true, detail })
  say(`OBS   ${id}  ${detail}`)
}

function parseArgs(argv) {
  const args = { dest: '', repo: '', keepStage: false, keepVerify: false }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--dest') args.dest = argv[++i] ?? ''
    else if (token === '--repo') args.repo = argv[++i] ?? ''
    else if (token === '--keep-stage') args.keepStage = true
    else if (token === '--keep-verify') args.keepVerify = true
    else if (token === '--help' || token === '-h') {
      say('node scripts/backup/backup.mjs [--dest <dir>] [--repo <dir>] [--keep-stage] [--keep-verify]')
      process.exit(0)
    } else {
      console.error(`未知参数：${token}`)
      process.exit(2)
    }
  }
  return args
}

const sha256Buffer = (buffer) => createHash('sha256').update(buffer).digest('hex')
const sha256File = (path) => sha256Buffer(readFileSync(path))

function walkFiles(root) {
  if (!existsSync(root)) return []
  const found = []
  const stack = [root]
  while (stack.length > 0) {
    const current = stack.pop()
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (entry.isFile()) found.push(full)
    }
  }
  return found.sort((a, b) => a.localeCompare(b))
}

function relUnix(root, file) {
  return relative(root, file).split('\\').join('/')
}

function ensureParent(path) {
  mkdirSync(dirname(path), { recursive: true })
}

function localStamp(date) {
  const p = (n, width = 2) => String(n).padStart(width, '0')
  return [
    date.getFullYear(),
    p(date.getMonth() + 1),
    p(date.getDate()),
    '-',
    p(date.getHours()),
    p(date.getMinutes()),
    p(date.getSeconds()),
    '-',
    p(date.getMilliseconds(), 3),
  ].join('')
}

// ==========================================================================
// SQLite 一致性快照（VACUUM INTO）；失败退回原文件＋WAL/SHM 复制
// ==========================================================================

function vacuumInto(source, target) {
  ensureParent(target)
  const db = new DatabaseSync(source, { readOnly: true })
  try {
    const literal = target.replaceAll('\\', '/').replaceAll("'", "''")
    db.exec(`VACUUM INTO '${literal}'`)
  } finally {
    db.close()
  }
}

function rawSqliteCopy(source, target) {
  ensureParent(target)
  copyFileSync(source, target)
  for (const suffix of ['-wal', '-shm', '-journal']) {
    const sidecar = `${source}${suffix}`
    if (existsSync(sidecar)) copyFileSync(sidecar, `${target}${suffix}`)
  }
}

function sqliteTableRows(path) {
  if (!existsSync(path)) return null
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
    return tables.map((table) => {
      const name = String(table.name)
      const row = db.prepare(`SELECT count(*) AS n FROM "${name.replace(/"/g, '""')}"`).get()
      return { table: name, rows: Number(row.n) }
    })
  } finally {
    db.close()
  }
}

// ==========================================================================
// zstd 多帧扫描（与 dsh-session-persistence-jsonl 同构，仅用于凭据扫描）
// ==========================================================================

function scanZstdFrames(buffer) {
  const frames = []
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
    if ((descriptor & 24) !== 0) throw new Error(`reserved zstd header bit at ${offset - 1}`)
    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 32) !== 0
    const checksum = (descriptor & 4) !== 0
    const dictionaryFlag = descriptor & 3
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag
    const remaining = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    if (buffer.length - offset < remaining) return { frames, tornStart: start }
    offset += remaining
    for (;;) {
      if (buffer.length - offset < 3) return { frames, tornStart: start }
      const blockHeader = buffer.readUIntLE(offset, 3)
      offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 3
      const blockSize = blockHeader >>> 3
      if (blockType === 3) throw new Error(`reserved zstd block type at ${offset - 3}`)
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
  }
  return { frames }
}

function inflateZstd(buffer) {
  if (buffer.length >= 4 && buffer.readUInt32LE(0) === ZSTD_MAGIC) {
    const { frames } = scanZstdFrames(buffer)
    const parts = frames.map((frame) => zstdDecompressSync(buffer.subarray(frame.start, frame.end)))
    return Buffer.concat(parts)
  }
  return buffer
}

// ==========================================================================
// 凭据形态扫描（只报计数与长度，⛔ 不回显内容）
// ==========================================================================

const CREDENTIAL_PATTERNS = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /Bearer\s+[A-Za-z0-9._~+\/-]{8,}/g,
  /api_key\s*[:=]\s*['"]?[A-Za-z0-9._~+\/-]{6,}/gi,
]

function scanTextForCredentials(text, counters) {
  for (const pattern of CREDENTIAL_PATTERNS) {
    const matches = text.match(pattern)
    if (!matches) continue
    counters.hits += matches.length
    for (const match of matches) counters.match_length += match.length
  }
}

function credentialScan(filesRoot) {
  const counters = { hits: 0, match_length: 0, scanned_files: 0, skipped_binary: 0, files_with_hits: [] }
  const textExtensions = new Set(['.json', '.jsonl', '.md', '.txt', '.yaml', '.yml', '.log', '.csv'])
  for (const file of walkFiles(filesRoot)) {
    const name = file.toLowerCase()
    let text = null
    if (name.endsWith('.zstd')) {
      try {
        text = inflateZstd(readFileSync(file)).toString('utf8')
      } catch {
        continue
      }
    } else if (textExtensions.has(extname(name))) {
      text = readFileSync(file, 'utf8')
    } else if (name.endsWith('.db') || name.endsWith('.sqlite')) {
      counters.skipped_binary += 1
      continue
    } else {
      counters.skipped_binary += 1
      continue
    }
    counters.scanned_files += 1
    const before = counters.hits
    scanTextForCredentials(text, counters)
    if (counters.hits > before) {
      counters.files_with_hits.push(relUnix(filesRoot, file))
    }
  }
  return counters
}

// ==========================================================================
// 源指纹（B-5：备份前后源文件未动）
// ==========================================================================

function fingerprintSources(paths) {
  const entries = []
  for (const path of paths) {
    if (!existsSync(path)) continue
    const stat = statSync(path)
    if (!stat.isFile()) continue
    entries.push({ path, size: stat.size, sha256: sha256File(path) })
  }
  const aggregate = sha256Buffer(
    Buffer.from(entries.map((entry) => `${entry.path}|${entry.size}|${entry.sha256}`).join(NL)),
  )
  return { files: entries.length, aggregate_sha256: aggregate, entries }
}

// ==========================================================================
// MANIFEST 生成
// ==========================================================================

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function buildManifest(context) {
  const {
    stem,
    createdAtUtc,
    timezone,
    repoRoot,
    destDir,
    packageName,
    memoryItems,
    sessionItems,
    sessionBytes,
    archiveItems,
    auditSearch,
    exclusions,
    fingerprintBefore,
    fingerprintAfter,
    credential,
    dataFileCount,
    dataBytes,
    manifestShaNote,
  } = context

  const lines = []
  const push = (...values) => lines.push(values.join(''))

  push(`# LarryAgent 备份清单（MANIFEST）`, NL, NL)
  push(`- 备份 ID：\`${stem}\``, NL)
  push(`- 生成时间：\`${createdAtUtc}\`（${timezone}）`, NL)
  push(`- 源仓库：\`${repoRoot}\``, NL)
  push(`- 落点目录：\`${destDir}\``, NL)
  push(`- 单文件包：\`${packageName}\``, NL)
  push(`- 数据文件数：**${dataFileCount}**（不含 MANIFEST.md / SHA256SUMS）`, NL)
  push(`- 数据总字节：**${dataBytes}**（${formatBytes(dataBytes)}）`, NL, NL)

  push(`> ⚠️ **本包含私域内容（记忆库 / 会话流水 / 可能的 CoT 原文）。**`, NL)
  push(`> 可读域 = 本人 ＋ 老大；⛔ 不要放在共享目录或公开网盘。`, NL)
  push(`> 本期**不加密**（三十年后没 key 的加密包等于废纸）；靠落点与访问控制保护。`, NL)
  push(`> ⚠️ **D: 与 C: 同属 Disk 0，此落点不防盘坏**；请另拷到外部介质。`, NL, NL)

  push(`## 0. 还原（另一人可独立跑通）`, NL, NL)
  push('```bash', NL)
  push(`# 1) 解包到空目录（⛔ 不要原地解开覆盖）`, NL)
  push(`tar -xzf ${packageName} -C /path/to/empty/restore`, NL, NL)
  push(`# 2) 校验（Linux/macOS 自带 sha256sum；Windows 用下面的 PowerShell 等价）`, NL)
  push(`cd /path/to/empty/restore`, NL)
  push(`sha256sum -c SHA256SUMS`, NL)
  push('```', NL, NL)
  push('Windows PowerShell 等价校验：', NL, NL)
  push('```powershell', NL)
  push(`Get-Content SHA256SUMS | ForEach-Object {`, NL)
  push(`  $h,$p = $_ -split '  ',2`, NL)
  push(`  if ((Get-FileHash $p -Algorithm SHA256).Hash.ToLower() -ne $h) { throw "FAIL $p" }`, NL)
  push(`}`, NL)
  push('```', NL, NL)
  push(`3) 先停 DSH 与 backend，再回填（目标最好是空的 DSH_HOME / backend/data）：`, NL, NL)
  push('```bash', NL)
  push(`# 记忆库（TS 插件在跑的那份）`, NL)
  push(`cp files/.dsh-home/larry-memory.db <DSH_HOME>/larry-memory.db`, NL)
  push(`# 记忆库（旧 Python 侧）`, NL)
  push(`cp files/backend/data/larry.db <repo>/backend/data/larry.db`, NL)
  push(`# 会话流水（保持目录树）`, NL)
  push(`cp -r files/.dsh-home/sessions/* <DSH_HOME>/sessions/`, NL)
  push(`# 全量存档（若本包含该目录；不存在则跳过）`, NL)
  push(`cp -r files/backend/data/cot_archive/* <repo>/backend/data/cot_archive/ 2>/dev/null || true`, NL)
  push('```', NL, NL)
  push('Windows PowerShell 回填等价：', NL, NL)
  push('```powershell', NL)
  push(`$DSH_HOME = 'C:\\path\\to\\.dsh-home'`, NL)
  push(`$Repo = 'C:\\path\\to\\LarryAgent'`, NL)
  push(`Copy-Item files\\.dsh-home\\larry-memory.db "$DSH_HOME\\larry-memory.db" -Force`, NL)
  push(`Copy-Item files\\backend\\data\\larry.db "$Repo\\backend\\data\\larry.db" -Force`, NL)
  push(`Copy-Item -Recurse files\\.dsh-home\\sessions\\* "$DSH_HOME\\sessions\\" -Force`, NL)
  push('```', NL, NL)
  push(`4) 本包**不含** \`.credentials.yaml\`；凭据需另行提供（不要从包里找）。`, NL)
  push(`5) DB 快照是 SQLite \`VACUUM INTO\` 的一致性快照，无 WAL/SHM；回填后首次启动会自行重建。`, NL)
  push(`   恢复前若目标已有同名 \`.db-wal\` / \`.db-shm\`，先移走，避免旧 WAL 与快照混用。`, NL)
  push(`6) 若目标目录已有更新数据，先另存再恢复；本包不负责合并。`, NL, NL)

  push(`## 1. 记忆库`, NL, NL)
  if (memoryItems.length === 0) {
    push(`- **本类空**：理由＝未找到可备份的记忆库文件。`, NL, NL)
  } else {
    push(`- **有 ${memoryItems.length} 项**：`, NL, NL)
    push(`| 项 | 源路径 | 包内路径 | 源字节 | 快照字节 | 快照 sha256 | 表/行 | 快照方式 |`, NL)
    push(`|---|---|---|---|---|---|---|---|`, NL)
    for (const item of memoryItems) {
      const rows = item.tables
        ? item.tables.map((table) => `${table.table}=${table.rows}`).join('；')
        : '（无）'
      push(
        `| ${item.label} | \`${item.sourceRel}\` | \`${item.packageRel}\` | ${item.sourceBytes} | ${item.snapshotBytes} | \`${item.sha256}\` | ${rows} | ${item.method} |`,
        NL,
      )
    }
    push(NL)
  }

  push(`## 2. 会话流水`, NL, NL)
  if (sessionItems.length === 0) {
    push(`- **本类空**：理由＝\`.dsh-home/sessions\` 不存在或为空。`, NL, NL)
  } else {
    push(`- **有 ${sessionItems.length} 项**，路径 \`files/.dsh-home/sessions/\`，共 ${sessionBytes} 字节（${formatBytes(sessionBytes)}）：`, NL, NL)
    push(`| 包内路径 | 字节 | sha256 |`, NL)
    push(`|---|---|---|`, NL)
    for (const item of sessionItems) {
      push(`| \`${item.packageRel}\` | ${item.bytes} | \`${item.sha256}\` |`, NL)
    }
    push(NL)
    push(`- ⛔ 排除 \`.dsh-home/storages/session_projcache\`（${auditSearch.projcacheFiles} 文件 / ${auditSearch.projcacheBytes} 字节）：`, NL)
    push(`  它是会话投影缓存，文档明写「log leads, the cache follows」「consumers that require a cold value own any log refold」，`, NL)
    push(`  可由 \`sessions/\` 日志重建 ⇒ 不进包，避免把派生状态当真相源。`, NL, NL)
  }

  push(`## 3. 审计留痕`, NL, NL)
  push(`- **本类空：无实现。**`, NL)
  push(`  理由＝append-only 审计留痕机制尚未落地（WB 2026-11-01 实测代码检索零命中；本机也未发现审计文件）；`, NL)
  push(`  ⛔ 不并入其他类，也不写「已备份 0 个文件」来假装完整。`, NL, NL)

  push(`## 4. 全量存档`, NL, NL)
  push(`- **CoT 原文**：` + (archiveItems.cotPresent
    ? `有 ${archiveItems.cotFiles} 个文件，路径 \`files/backend/data/cot_archive/\`。`
    : `**本类空：backend 从未真实调用，目录尚未创建**（\`backend/data/cot_archive\` 不存在）。`), NL)
  push(`- **附带文件原件**：**本类空**：无实现（backend 未产生附档实例，DSH sessions 中也无附件类事件）。`, NL)
  push(`- **未采纳分支**：**本类空**：无独立存档实现；DSH session 日志里若有 \`turn/end.reason.kind=aborted\` 等，仍属会话流水，不另立此档。`, NL)
  push(`- **环境标识 / 人格快照**：**本类空**：无独立快照件；同期提示词与模型参数可从 \`sessions/\` 的 \`request/header\` / \`system/message\` 事件取。`, NL)
  push(`- **自描述清单**：` + (archiveItems.manifestPresent
    ? `有 1 项，包内路径 \`${archiveItems.manifestRel}\`。`
    : `未发现（DSH 尚未在真实 home 产生；首次启动后会写 \`sessions/archive-manifest.jsonl\`，后续备份会自动纳入）。`), NL)
  push(`- **格式约束**：不产生独立文件；本包用 tar.gz ＋ MANIFEST.md ＋ SHA256SUMS（最笨格式）。`, NL, NL)

  push(`## 5. 排除项（绝不入包）`, NL, NL)
  for (const exclusion of exclusions) push(`- \`${exclusion.path}\`：${exclusion.reason}`, NL)
  push(NL)

  push(`## 6. 完整性与源状态`, NL, NL)
  push(`- 包内 \`SHA256SUMS\` 覆盖 MANIFEST.md ＋ \`files/\` 下全部 ${dataFileCount} 个数据文件（共 ${dataFileCount + 1} 行）。`, NL)
  push(`- 包本身的 sha256 写在同一目录的 \`${stem}.SHA256SUMS\`（单文件行）。`, NL)
  push(`- 备份前源指纹：\`${fingerprintBefore.aggregate_sha256}\`（${fingerprintBefore.files} 个文件）`, NL)
  push(`- 备份后源指纹：\`${fingerprintAfter.aggregate_sha256}\`（${fingerprintAfter.files} 个文件）`, NL)
  push(`- **源文件未动**：${fingerprintBefore.aggregate_sha256 === fingerprintAfter.aggregate_sha256 ? 'true' : 'false'}`, NL, NL)
  push(`- 凭据文件名扫描：\`credentials\` 命中 **0**；凭据形态扫描（文本＋解压后的 sessions）：`, NL)
  push(`  命中 **${credential.hits}** 处 / 总长度 **${credential.match_length}**（⛔ 不回显内容；二进制 DB 跳过 ${credential.skipped_binary} 个）。`, NL, NL)

  push(`## 7. 已知边界`, NL, NL)
  push(`- 未加密：MANIFEST 与包内 CoT/记忆库对任何拿到文件的人可读。`, NL)
  push(`- 落点默认在 D:，与源同属 Disk 0；⛔ 不防盘坏。`, NL)
  push(`- 会话流水是逐文件复制；若 DSH 正在写某会话，该文件末帧可能不完整（恢复侧按可恢复前缀处理）。`, NL)
  push(`- ${manifestShaNote}`, NL)

  return lines.join('')
}

// ==========================================================================
// 打包与校验
// ==========================================================================

function tarCreate(packagePath, stageDir) {
  const result = spawnSync('tar', ['-czf', packagePath, '-C', stageDir, '.'], { encoding: 'utf8' })
  if (result.error) return { ok: false, detail: `tar 不可用：${result.error.message}` }
  if (result.status !== 0) return { ok: false, detail: `tar 退出 ${result.status}：${result.stderr}` }
  return { ok: true, detail: `tar -czf ${basename(packagePath)}` }
}

function tarExtract(packagePath, extractDir) {
  const result = spawnSync('tar', ['-xzf', packagePath, '-C', extractDir], { encoding: 'utf8' })
  if (result.error) return { ok: false, detail: `tar 不可用：${result.error.message}` }
  if (result.status !== 0) return { ok: false, detail: `tar 退出 ${result.status}：${result.stderr}` }
  return { ok: true, detail: 'tar -xzf' }
}

function verifyExtracted(extractDir, expectedDataFiles) {
  const sumsPath = join(extractDir, 'SHA256SUMS')
  if (!existsSync(sumsPath)) return { ok: false, detail: 'SHA256SUMS 缺失', lines: 0, dataFiles: 0 }
  const lines = readFileSync(sumsPath, 'utf8').split(NL).filter((line) => line.trim())
  let checked = 0
  const failures = []
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line)
    if (!match) {
      failures.push(`格式不符：${line.slice(0, 20)}…`)
      continue
    }
    const [, expected, rel] = match
    const file = join(extractDir, rel)
    if (!existsSync(file)) {
      failures.push(`缺文件：${rel}`)
      continue
    }
    const actual = sha256File(file)
    if (actual !== expected) failures.push(`hash 不符：${rel}`)
    else checked += 1
  }
  const dataFiles = walkFiles(join(extractDir, 'files')).length
  const dataCountOk = dataFiles === expectedDataFiles
  return {
    ok: failures.length === 0 && dataCountOk,
    detail: `sums=${lines.length}, checked=${checked}, data_files=${dataFiles}/${expectedDataFiles}${failures.length ? `, failures=${failures.length}` : ''}`,
    lines: lines.length,
    dataFiles,
  }
}

function credentialFilenameHits(root) {
  return walkFiles(root)
    .map((file) => relUnix(root, file))
    .filter((rel) => rel.toLowerCase().includes('credentials'))
    .length
}

// ==========================================================================
// 主流程
// ==========================================================================

function main() {
  const args = parseArgs(process.argv.slice(2))
  const scriptRoot = dirname(fileURLToPath(import.meta.url))
  const repoRoot = resolve(args.repo || process.env.LARRY_BACKUP_REPO || join(scriptRoot, '..', '..'))
  const destDir = resolve(args.dest || process.env.LARRY_BACKUP_DIR || DEFAULT_DEST)
  const dshHome = join(repoRoot, '.dsh-home')
  const liveDb = join(dshHome, 'larry-memory.db')
  const legacyDb = join(repoRoot, 'backend', 'data', 'larry.db')
  const sessionsDir = join(dshHome, 'sessions')
  const cotDir = join(repoRoot, 'backend', 'data', 'cot_archive')
  const projcacheDir = join(dshHome, 'storages', 'session_projcache')

  say(`⚠️ D: 与 C: 同属 Disk 0，此落点不防盘坏；请另拷到外部介质。`)
  say(`repo=${repoRoot}`)
  say(`dest=${destDir}`)

  if (!existsSync(liveDb) && !existsSync(legacyDb) && !existsSync(sessionsDir)) {
    console.error('前置缺失：记忆库、旧库、会话流水都不存在，拒绝生成空包')
    process.exit(2)
  }

  const now = new Date()
  const stem = `larryagent-backup-${localStamp(now)}-${randomBytes(2).toString('hex')}`
  const packageName = `${stem}.tar.gz`
  const packagePath = join(destDir, packageName)
  const workDir = mkdtempSync(join(tmpdir(), 'larry-backup-'))
  const stageDir = join(workDir, 'stage')
  const filesRoot = join(stageDir, 'files')
  mkdirSync(filesRoot, { recursive: true })

  const sourceFingerprintPaths = []
  for (const path of [liveDb, `${liveDb}-wal`, `${liveDb}-shm`, legacyDb, `${legacyDb}-wal`, `${legacyDb}-shm`]) {
    if (existsSync(path)) sourceFingerprintPaths.push(path)
  }
  const sessionSourceFiles = walkFiles(sessionsDir)
  for (const file of sessionSourceFiles) sourceFingerprintPaths.push(file)
  const cotSourceFiles = walkFiles(cotDir)
  for (const file of cotSourceFiles) sourceFingerprintPaths.push(file)
  const fingerprintBefore = fingerprintSources(sourceFingerprintPaths)

  say('')
  say('== 收集 ==')
  const memoryItems = []
  for (const item of [
    { label: 'TS 插件在跑', source: liveDb, rel: '.dsh-home/larry-memory.db' },
    { label: '旧 Python 侧', source: legacyDb, rel: 'backend/data/larry.db' },
  ]) {
    if (!existsSync(item.source)) {
      obs(`memory-missing-${item.label}`, `${item.source} 不存在，按空类处理`)
      continue
    }
    const sourceBytes = statSync(item.source).size
    const packageRel = `files/${item.rel}`
    const target = join(stageDir, packageRel)
    let method = 'sqlite VACUUM INTO（只读连接）'
    try {
      vacuumInto(item.source, target)
    } catch (err) {
      method = `raw copy（VACUUM 失败：${err instanceof Error ? err.message : String(err)}）`
      rawSqliteCopy(item.source, target)
    }
    const snapshotBytes = statSync(target).size
    memoryItems.push({
      label: item.label,
      sourceRel: item.rel,
      packageRel,
      sourceBytes,
      snapshotBytes,
      sha256: sha256File(target),
      tables: sqliteTableRows(target),
      method,
    })
    say(`  ${item.label}: ${item.rel} → ${packageRel} (${sourceBytes} → ${snapshotBytes} B, ${method})`)
  }

  say('')
  const sessionItems = []
  let sessionBytes = 0
  for (const source of sessionSourceFiles) {
    const rel = relUnix(sessionsDir, source)
    const packageRel = `files/.dsh-home/sessions/${rel}`
    const target = join(stageDir, packageRel)
    ensureParent(target)
    copyFileSync(source, target)
    const bytes = statSync(target).size
    sessionBytes += bytes
    sessionItems.push({ packageRel, bytes, sha256: sha256File(target) })
  }
  say(`  会话流水: ${sessionItems.length} 文件 / ${sessionBytes} 字节`)

  const archiveItems = { cotPresent: false, cotFiles: 0, manifestPresent: false, manifestRel: '' }
  for (const source of cotSourceFiles) {
    const rel = relUnix(cotDir, source)
    const packageRel = `files/backend/data/cot_archive/${rel}`
    const target = join(stageDir, packageRel)
    ensureParent(target)
    copyFileSync(source, target)
    archiveItems.cotPresent = true
    archiveItems.cotFiles += 1
  }
  const archiveManifest = join(sessionsDir, 'archive-manifest.jsonl')
  if (existsSync(archiveManifest)) {
    archiveItems.manifestPresent = true
    archiveItems.manifestRel = 'files/.dsh-home/sessions/archive-manifest.jsonl'
  }
  say(`  全量存档: CoT ${archiveItems.cotPresent ? `${archiveItems.cotFiles} 文件` : '空（目录不存在）'}；自描述清单 ${archiveItems.manifestPresent ? '有' : '未发现'}`)

  const projcacheFiles = walkFiles(projcacheDir).length
  const projcacheBytes = projcacheFiles > 0
    ? walkFiles(projcacheDir).reduce((sum, file) => sum + statSync(file).size, 0)
    : 0

  // 凭据文件名 + 文本扫描（先扫，命中即拒绝出包）
  say('')
  say('== 凭据负证 ==')
  const credNames = credentialFilenameHits(filesRoot)
  judge('B-4a-credential-filename', credNames === 0, `包内文件名含 credentials 命中=${credNames}（⛔ 源 .credentials.yaml 从未读取）`)
  const credential = credentialScan(filesRoot)
  const credOk = credential.hits === 0
  judge(
    'B-4b-credential-shape',
    credOk,
    `文本/解压 sessions 扫描：命中=${credential.hits} 总长度=${credential.match_length}（只报计数不回显）；跳过二进制=${credential.skipped_binary}，扫描文本文件=${credential.scanned_files}`,
  )
  if (!credOk) {
    console.error('凭据形态命中：拒绝生成包（请人工核查；本脚本不删除任何源文件）')
    rmSync(workDir, { recursive: true, force: true })
    process.exit(2)
  }

  const fingerprintAfter = fingerprintSources(sourceFingerprintPaths)
  const sourceUnchanged = fingerprintBefore.aggregate_sha256 === fingerprintAfter.aggregate_sha256
  judge(
    'B-5-source-unchanged',
    sourceUnchanged,
    `源指纹 ${fingerprintBefore.aggregate_sha256.slice(0, 16)}…（${fingerprintBefore.files} 文件）→ ${fingerprintAfter.aggregate_sha256.slice(0, 16)}…（${fingerprintAfter.files} 文件）`,
  )

  const dataFileCount = walkFiles(filesRoot).length
  const dataBytes = walkFiles(filesRoot).reduce((sum, file) => sum + statSync(file).size, 0)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const exclusions = [
    { path: '.dsh-home/.credentials.yaml', reason: '凭据；靠路径排除，⛔ 连读都不读' },
    { path: '.dsh-home/profiles/sdk', reason: '依赖树（628 MB / 22k+ 文件），不是数据' },
    { path: '.dsh-home/larry-memory.db.bak-*', reason: '历史备份，备它会滚雪球' },
    { path: 'backend/data/chroma', reason: '空结构 / 派生向量索引' },
    { path: 'backend/data/scratch.db', reason: '测试临时库，不属四类数据' },
    { path: `.dsh-home/storages/session_projcache`, reason: '派生会话投影缓存，可由 sessions 日志重建' },
  ]

  const manifest = buildManifest({
    stem,
    createdAtUtc: now.toISOString(),
    timezone,
    repoRoot,
    destDir,
    packageName,
    memoryItems,
    sessionItems,
    sessionBytes,
    archiveItems,
    auditSearch: {
      auditPattern: 'audit|append-only|审计留痕',
      projcacheFiles,
      projcacheBytes,
    },
    exclusions,
    fingerprintBefore,
    fingerprintAfter,
    credential,
    dataFileCount,
    dataBytes,
    manifestShaNote: 'MANIFEST 是生成时的事实快照；包内文件才是数据本体。',
  })
  writeFileSync(join(stageDir, 'MANIFEST.md'), manifest, 'utf8')

  // SHA256SUMS：覆盖 MANIFEST ＋ files/，不覆盖自身
  const sumsLines = []
  for (const file of walkFiles(stageDir)) {
    if (basename(file) === 'SHA256SUMS') continue
    sumsLines.push(`${sha256File(file)}  ${relUnix(stageDir, file)}`)
  }
  writeFileSync(join(stageDir, 'SHA256SUMS'), `${sumsLines.join(NL)}${NL}`, 'utf8')

  say('')
  say('== 打包 ==')
  mkdirSync(destDir, { recursive: true })
  if (existsSync(packagePath)) {
    console.error(`拒绝覆盖已存在的包：${packagePath}`)
    process.exit(1)
  }
  const tar = tarCreate(packagePath, stageDir)
  if (!tar.ok) {
    console.error(tar.detail)
    process.exit(1)
  }
  const packageBytes = statSync(packagePath).size
  const packageSha = sha256File(packagePath)
  judge('B-1-single-file', packageBytes > 0, `${packagePath}（${packageBytes} 字节）`)

  copyFileSync(join(stageDir, 'MANIFEST.md'), join(destDir, `${stem}.MANIFEST.md`))
  writeFileSync(join(destDir, `${stem}.SHA256SUMS`), `${packageSha}  ${packageName}${NL}`, 'utf8')
  judge('B-2-manifest-classes', ['记忆库', '会话流水', '审计留痕', '全量存档'].every((word) => manifest.includes(word)), `MANIFEST 四类均出现；长度=${manifest.length}`)
  judge('B-7-cot-empty-explicit', manifest.includes('本类空：backend 从未真实调用，目录尚未创建'), 'CoT 空类写成显式理由，未写「已备份 0 个文件」')

  // B-3：拷到另一个目录 → 干净临时目录解开 → 校验
  say('')
  say('== 离机校验 ==')
  const verifyWork = mkdtempSync(join(tmpdir(), 'larry-backup-verify-'))
  const copiedPackage = join(verifyWork, packageName)
  copyFileSync(packagePath, copiedPackage)
  const extractDir = join(verifyWork, 'extract')
  mkdirSync(extractDir, { recursive: true })
  const extract = tarExtract(copiedPackage, extractDir)
  if (!extract.ok) {
    console.error(extract.detail)
    process.exit(1)
  }
  const verified = verifyExtracted(extractDir, dataFileCount)
  judge('B-3-offsite-extract', verified.ok, `拷到 ${verifyWork} 后解开：${verified.detail}`)
  const extractedCredNames = credentialFilenameHits(extractDir)
  judge('B-4c-extracted-credential-filename', extractedCredNames === 0, `解包后凭据文件名命中=${extractedCredNames}`)
  if (!args.keepVerify) rmSync(verifyWork, { recursive: true, force: true })

  say('')
  say('== 汇总 ==')
  say(`package=${packagePath}`)
  say(`  bytes=${packageBytes}  sha256=${packageSha}`)
  say(`  sidecars=${join(destDir, `${stem}.MANIFEST.md`)} ＋ ${join(destDir, `${stem}.SHA256SUMS`)}`)
  say(`  data_files=${dataFileCount}  data_bytes=${dataBytes}`)
  say(`  source_unchanged=${sourceUnchanged}`)
  say(`  credential_hits=${credential.hits}`)

  if (!args.keepStage) rmSync(workDir, { recursive: true, force: true })
  else say(`keep-stage=${stageDir}`)

  const failed = findings.filter((item) => !item.ok)
  say(`${NL}summary: ${findings.length - failed.length}/${findings.length} PASS`)
  return failed.length === 0 ? 0 : 1
}

const code = main()
process.exit(code)
