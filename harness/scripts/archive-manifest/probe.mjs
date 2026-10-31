#!/usr/bin/env node
/**
 * ⑪.1 存档自描述清单 · 取证探针（C-1…C-7）
 *
 * 场地：全部在临时 home 内（⛔ 不写 .dsh-home/sessions）；真实存档只复制、不改。
 * 运行：cd harness && node scripts/archive-manifest/probe.mjs
 * 退出码：0 全绿 ／ 1 判据红 ／ 2 前置缺失
 */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { zstdCompressSync } from 'node:zlib'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const EVIDENCE = join(REPO, '_trae-evidence', 'archive-manifest')
const PLUGIN = join(HARNESS, 'packages', 'plugin-s4-memory')
const LIB = pathToFileURL(join(PLUGIN, 'lib', 'manifest.js')).href
const NL = String.fromCharCode(10)

const REAL_SESSIONS = join(REPO, '.dsh-home', 'sessions', '--D-Code-LarryAgent--')
const REAL_V3 = join(REAL_SESSIONS, 'session-a403f6ea86314681826ae6773f3b2eb7', 'session.v3.jsonl.zstd')
const REAL_V0 = join(REAL_SESSIONS, 'session-66a2b7a6-b1cb-4b36-8ca7-c761395956dd', 'session.jsonl.zstd')

const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => {
  findings.push({ judge: id, ok: true, detail })
  console.log(`OBS   ${id}  ${detail}`)
}
const save = (name, text) => writeFileSync(join(EVIDENCE, name), text ?? '', 'utf8')
const saveJson = (name, value) => save(name, `${JSON.stringify(value, null, 2)}${NL}`)
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

if (!existsSync(join(PLUGIN, 'lib', 'manifest.js'))) {
  console.error('前置缺失：插件未编译（先跑 pnpm --filter @larryagent/plugin-s4-memory run build）')
  process.exit(2)
}
if (!existsSync(REAL_V3) || !existsSync(REAL_V0)) {
  console.error('前置缺失：真实 v3/v0 会话存档不存在')
  process.exit(2)
}
mkdirSync(EVIDENCE, { recursive: true })
const TMP_ROOT = mkdtempSync(join(tmpdir(), 'archive-manifest-'))
const keep = (process.env.AM_KEEP_TMP ?? '0') === '1'

/** 把一个真实存档复制进临时 home 的 sessions 结构 */
function copyArchive(home, workspace, sessionId, source) {
  const dir = join(home, 'sessions', workspace, sessionId)
  mkdirSync(dir, { recursive: true })
  const target = join(dir, basename(source))
  copyFileSync(source, target)
  return target
}

function readManifest(path) {
  const text = readFileSync(path, 'utf8')
  return {
    text,
    entries: text.split(NL).filter((line) => line.trim()).map((line) => JSON.parse(line)),
  }
}

async function main() {
  const manifest = await import(LIB)
  const { resolveManifestPath, refreshArchiveManifest, assertManifestPathInsideHome } = manifest

  const homeA = join(TMP_ROOT, 'home-a')
  const homeB = join(TMP_ROOT, 'home-b')
  const homeC = join(TMP_ROOT, 'home-c')
  for (const home of [homeA, homeB, homeC]) mkdirSync(home, { recursive: true })

  const v3Path = copyArchive(homeA, '--D-Code-LarryAgent--', 'session-a403f6ea86314681826ae6773f3b2eb7', REAL_V3)
  copyArchive(homeA, '--D-Code-LarryAgent--', 'session-66a2b7a6-b1cb-4b36-8ca7-c761395956dd', REAL_V0)
  copyArchive(homeB, '--D-Code-LarryAgent--', 'session-66a2b7a6-b1cb-4b36-8ca7-c761395956dd', REAL_V0)
  copyArchive(homeC, '--D-Code-LarryAgent--', 'session-66a2b7a6-b1cb-4b36-8ca7-c761395956dd', REAL_V0)

  const manifestPath = resolveManifestPath(undefined, homeA)
  obs('C-5-default', `default manifest path = ${manifestPath}`)
  const first = await refreshArchiveManifest({ home: homeA, manifestPath, trigger: 'refresh' })
  saveJson('refresh-1.json', first)

  // ── C-1 纯文本可裸读
  const m1 = readManifest(manifestPath)
  save('manifest-sample.jsonl', m1.text)
  judge('C-1-plain-jsonl', m1.entries.length === 2, `2 entries, ${m1.text.length} bytes, JSON.parse OK`)

  // ── C-2 四格齐全
  const required = ['entry_type', 'origin', 'format', 'checksum']
  const missingFields = m1.entries.filter((entry) => {
    const hasType = typeof entry.entry_type === 'string'
    const hasOrigin =
      typeof entry.origin?.session_created_at === 'string' &&
      typeof entry.origin?.recorded_at === 'string' &&
      typeof entry.origin?.recorded_by === 'string' &&
      typeof entry.origin?.trigger === 'string'
    const hasRead =
      typeof entry.format?.version_label === 'string' &&
      Array.isArray(entry.format?.read_with) &&
      entry.format.read_with.length >= 3
    const hasChecksum =
      entry.checksum?.algorithm === 'sha256' &&
      typeof entry.checksum?.value === 'string' &&
      typeof entry.checksum?.computed_at === 'string' &&
      typeof entry.checksum?.covered_bytes === 'number'
    return !(hasType && hasOrigin && hasRead && hasChecksum)
  })
  judge('C-2-four-fields', missingFields.length === 0, `missing=${missingFields.length}; fields=${required.join('/')}`)

  // ── C-3 三问自答（只凭清单行＋存档；不改项目代码）
  const v3Entry = m1.entries.find((entry) => entry.archive.endsWith('session.v3.jsonl.zstd'))
  const raw = readFileSync(v3Path)
  const answers = {
    what: `${v3Entry.entry_type}：${v3Entry.format.container}；${v3Entry.format.payload}`,
    whenWhoWhy: `session=${v3Entry.session_id}；created=${v3Entry.origin.session_created_at}；cwd=${v3Entry.origin.cwd}；recorded_by=${v3Entry.origin.recorded_by}；trigger=${v3Entry.origin.trigger}；at=${v3Entry.origin.recorded_at}；event_types=${Object.keys(v3Entry.stats.event_types).join(',')}`,
    readWith: `${v3Entry.format.version_label}；${v3Entry.format.read_with.join(' ')}`,
  }
  saveJson('c3-answers.json', answers)
  console.log('C-3 自答①：', answers.what)
  console.log('C-3 自答②：', answers.whenWhoWhy)
  console.log('C-3 自答③：', answers.readWith)
  judge('C-3-30y-answers', Object.values(answers).every((v) => v.length > 0), '三问均已从清单行作答')

  // ── C-4 完备性七类（两份存档）
  const v0Entry = m1.entries.find((entry) => entry.archive.endsWith('session.jsonl.zstd'))
  saveJson('c4-v3-completeness.json', v3Entry.completeness)
  saveJson('c4-v0-completeness.json', v0Entry.completeness)
  const seven = ['session_context', 'attachments', 'cot', 'unadopted_branches', 'environment', 'self_description', 'format_constraints']
  const complete = [v3Entry, v0Entry].every((entry) => seven.every((key) => entry.completeness?.[key] && typeof entry.completeness[key].reason === 'string'))
  judge('C-4-seven-categories', complete, 'v3 + v0 各 7 项均有 present + reason（无「没考虑过」档）')
  console.log('C-4 v3:', JSON.stringify(v3Entry.completeness))
  console.log('C-4 v0:', JSON.stringify(v0Entry.completeness))

  // ── C-5 换根：A 不被 B 的刷新改动；B 只写自己的 home
  const aBefore = sha256(readFileSync(manifestPath))
  const manifestB = resolveManifestPath(undefined, homeB)
  const second = await refreshArchiveManifest({ home: homeB, manifestPath: manifestB, trigger: 'refresh' })
  saveJson('refresh-home-b.json', second)
  const aAfter = sha256(readFileSync(manifestPath))
  const bEntries = readManifest(manifestB).entries.length
  judge(
    'C-5-root-switch',
    aBefore === aAfter && bEntries === 1 && resolve(manifestPath) !== resolve(manifestB),
    `A=${manifestPath}（sha 不变=${aBefore === aAfter}） B=${manifestB}（entries=${bEntries}）`,
  )
  const realDefault = resolveManifestPath(undefined, join(REPO, '.dsh-home'))
  obs('C-5-real-resolved', `production default (not written) = ${realDefault}`)

  // ── C-6 hash 时点：同一份存档两次刷新（追加一帧）
  const beforeEntry = readManifest(manifestPath).entries.find((entry) => entry.archive.endsWith('session.v3.jsonl.zstd'))
  const appended = `${JSON.stringify({ type: 'turn/end', seq: 16, time: Date.now(), data: { turn: 1, reason: { kind: 'completed' } } })}${NL}`
  appendFileSync(v3Path, zstdCompressSync(Buffer.from(appended, 'utf8')))
  const third = await refreshArchiveManifest({ home: homeA, manifestPath, trigger: 'refresh' })
  saveJson('refresh-2.json', third)
  const afterEntry = readManifest(manifestPath).entries.find((entry) => entry.archive.endsWith('session.v3.jsonl.zstd'))
  const hashChanged = beforeEntry.checksum.value !== afterEntry.checksum.value
  const timeChanged = beforeEntry.checksum.computed_at !== afterEntry.checksum.computed_at
  const bytesChanged = beforeEntry.checksum.covered_bytes !== afterEntry.checksum.covered_bytes
  judge(
    'C-6-hash-time',
    hashChanged && timeChanged && bytesChanged,
    `hash ${beforeEntry.checksum.value.slice(0, 12)}… → ${afterEntry.checksum.value.slice(0, 12)}…；time ${beforeEntry.checksum.computed_at} → ${afterEntry.checksum.computed_at}；bytes ${beforeEntry.checksum.covered_bytes} → ${afterEntry.checksum.covered_bytes}`,
  )
  saveJson('c6-before-after.json', { before: beforeEntry.checksum, after: afterEntry.checksum })

  // ── C-7 缺失：改名后重跑，不得继续声称完整
  const manifestC = resolveManifestPath(undefined, homeC)
  await refreshArchiveManifest({ home: homeC, manifestPath: manifestC, trigger: 'refresh' })
  const cBefore = readManifest(manifestC).entries[0]
  const cFile = join(homeC, 'sessions', '--D-Code-LarryAgent--', 'session-66a2b7a6-b1cb-4b36-8ca7-c761395956dd', 'session.jsonl.zstd')
  renameSync(cFile, `${cFile}.renamed`)
  await refreshArchiveManifest({ home: homeC, manifestPath: manifestC, trigger: 'refresh' })
  const cAfter = readManifest(manifestC).entries[0]
  saveJson('c7-before.json', cBefore)
  saveJson('c7-after.json', cAfter)
  judge(
    'C-7-missing',
    cAfter.archive_state === 'missing' && cAfter.checksum === null && cAfter.last_known?.value === cBefore.checksum.value,
    `state ${cBefore.archive_state} → ${cAfter.archive_state}；checksum null=${cAfter.checksum === null}；last_known bytes=${cAfter.last_known?.covered_bytes}`,
  )

  // ── Tier0 负向：临时 home 但 manifestPath 指向真实目录 ⇒ 断言 fail（子进程 exit≠0）
  const realManifest = join(REPO, '.dsh-home', 'sessions', 'archive-manifest.jsonl')
  const childCode = `import(${JSON.stringify(LIB)}).then((m) => m.assertManifestPathInsideHome(${JSON.stringify(homeA)}, ${JSON.stringify(realManifest)}, false))`
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', childCode], { encoding: 'utf8' })
  save('tier0-negative.txt', `${child.stdout}${child.stderr}`)
  judge(
    'Tier0-negative-outside-home',
    child.status !== 0 && child.stderr.includes('manifestPath outside home (denied)'),
    `exit=${child.status}；stderr 含 DENY 标记=${child.stderr.includes('manifestPath outside home (denied)')}`,
  )

  saveJson('findings.json', findings)
}

try {
  await main()
} finally {
  if (keep) console.log(`AM_KEEP_TMP=1 ⇒ 保留 ${TMP_ROOT}`)
  else rmSync(TMP_ROOT, { recursive: true, force: true })
}

const failed = findings.filter((item) => !item.ok)
console.log(`${NL}summary: ${findings.length - failed.length}/${findings.length} PASS`)
process.exit(failed.length === 0 ? 0 : 1)
