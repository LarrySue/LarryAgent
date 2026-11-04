#!/usr/bin/env node
/**
 * 探针守卫：真实 home 的入口快照 / 出口比对（只读，不写不删）
 *
 * 由来：p3holes-a 的 A-2 臂「不设 DSH_HOME ⇒ 落默认 home」把库真写进了
 * C:/Users/SuLarry/.dsh（11-01、11-03 各污染一轮）。A-2 改假 home 只治这一次；
 * 本模块是兜底层：探针入口记指纹、出口再取一次，任何臂想偷偷写真实 home 就变红。
 *
 * 用法：
 *   const guard = createHomeGuard({ root: REAL_HOME_ROOT })   // 入口，env 未改动之前
 *   ...探针主体...
 *   const result = guard.verify()                             // 出口，清理临时目录之前
 *   if (!result.ok) { 打印 result.diffs; process.exit(非零) }
 *
 * ⚠️ `root` 必须在改动 USERPROFILE／HOME 之前算好并显式传入：
 *    守卫要盯的是「真实 home」，而 os.homedir() 会被假 home 改掉。
 * ⚠️ 指纹必须能表达「不存在」：状态是三态 absent | present(size+mtime+sha256)，
 *    文件缺失不是「没法测」，而是一种必须保持的状态。
 * ⚠️ 新探针须自带此守卫（派发 H-4/H-6 口径）。
 *
 * 负证（不碰真实 home，全部在临时目录）：
 *   node probe-guard.mjs --negtest
 *   期望：对照跑绿；造「不存在→出现」「已存在被改一字」两红；退出码 1（守卫如预期变红）。
 */

import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const NL = String.fromCharCode(10)

/** 默认盯防文件（相对 root）；其他探针可传自己的 watchFiles */
export const DEFAULT_WATCHED = ['larry-memory.db', join('sessions', 'archive-manifest.jsonl')]

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/**
 * 单个路径的指纹，三态：absent（不存在）| dir（目录）| present（文件：size+mtime+sha256）
 */
export function fingerprintPath(path) {
  if (!existsSync(path)) return { path, state: 'absent' }
  const stat = statSync(path)
  if (!stat.isFile()) return { path, state: 'dir', mtimeMs: stat.mtimeMs }
  return {
    path,
    state: 'present',
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    mtime: stat.mtime.toISOString(),
    sha256: sha256File(path),
  }
}

/** root 的一份完整指纹：根自身状态 ＋ 顶层项清单 ＋ 逐个盯防文件指纹 */
export function snapshotHome(root, watchFiles = DEFAULT_WATCHED) {
  const rootExists = existsSync(root)
  return {
    root,
    state: rootExists ? 'present' : 'absent',
    topLevel: rootExists ? readdirSync(root).sort() : null,
    watched: watchFiles.map((rel) => fingerprintPath(join(root, rel))),
    takenAt: new Date().toISOString(),
  }
}

function describe(fp) {
  if (fp.state === 'absent') return '不存在'
  if (fp.state === 'dir') return '目录'
  return `存在 len=${fp.size} mtime=${fp.mtime} sha256=${fp.sha256}`
}

/** 两份指针对比 → 差异明细数组（空数组＝零变化） */
export function diffSnapshots(before, after) {
  const diffs = []
  if (before.state !== after.state) {
    diffs.push(`根 ${before.root}：${before.state} → ${after.state}`)
  }
  if (before.topLevel !== null && after.topLevel !== null) {
    for (const name of after.topLevel) {
      if (!before.topLevel.includes(name)) diffs.push(`顶层新增：${name}`)
    }
    for (const name of before.topLevel) {
      if (!after.topLevel.includes(name)) diffs.push(`顶层消失：${name}`)
    }
  }
  for (let i = 0; i < before.watched.length; i++) {
    const b = before.watched[i]
    const a = after.watched[i]
    if (b.state !== a.state) {
      diffs.push(`${b.path}：${describe(b)} → ${describe(a)}`)
      continue
    }
    if (b.state !== 'present') continue
    if (b.sha256 !== a.sha256) diffs.push(`${b.path}：sha256 ${b.sha256} → ${a.sha256}`)
    if (b.size !== a.size) diffs.push(`${b.path}：size ${b.size} → ${a.size}`)
    if (b.mtimeMs !== a.mtimeMs) diffs.push(`${b.path}：mtime ${b.mtime} → ${a.mtime}`)
  }
  return diffs
}

/**
 * 创建一个守卫实例。
 * @param {object} opts
 * @param {string} [opts.root] 被盯的 home 根；⚠️ 默认值取调用时刻的 homedir()，
 *   必须在改 USERPROFILE／HOME 之前创建。
 * @param {string[]} [opts.watchFiles] 相对 root 的盯防文件
 * @param {string} [opts.label] 输出标签
 */
export function createHomeGuard({ root = join(homedir(), '.dsh'), watchFiles = DEFAULT_WATCHED, label = 'real-home' } = {}) {
  const before = snapshotHome(root, watchFiles)
  return {
    label,
    root: before.root,
    before,
    /** 出口比对；ok=false 时 diffs 为差异明细 */
    verify() {
      const after = snapshotHome(root, watchFiles)
      const diffs = diffSnapshots(before, after)
      return { label, root: before.root, ok: diffs.length === 0, diffs, before, after }
    },
  }
}

// ── 负证 CLI：全部在临时目录，⛔ 不碰真实 ~/.dsh ────────────────────────────
function negtest() {
  const root = mkdtempSync(join(tmpdir(), 'probe-guard-negtest-'))
  mkdirSync(join(root, 'sessions'), { recursive: true })
  const watchFiles = DEFAULT_WATCHED
  const results = []

  // 对照：不动 → 必须绿
  const g0 = createHomeGuard({ root, watchFiles, label: 'control' })
  const r0 = g0.verify()
  results.push({ case: 'control-no-change', guardRed: !r0.ok, expect: 'green' })
  console.log(`${r0.ok ? 'GREEN' : 'RED  '} control-no-change  diffs=${r0.diffs.length}`)

  // 负证 1：不存在 → 出现
  const g1 = createHomeGuard({ root, watchFiles, label: 'absent-to-present' })
  writeFileSync(join(root, 'larry-memory.db'), 'seed-row')
  const r1 = g1.verify()
  results.push({ case: 'absent-to-present', guardRed: !r1.ok, expect: 'red' })
  console.log(`${r1.ok ? 'GREEN' : 'RED  '} absent-to-present  diffs=${r1.diffs.length}`)
  for (const line of r1.diffs) console.log(`      - ${line}`)

  // 负证 2：已存在被改一个字
  const manifest = join(root, join('sessions', 'archive-manifest.jsonl'))
  writeFileSync(manifest, `{"seed":1}${NL}`)
  const g2 = createHomeGuard({ root, watchFiles, label: 'byte-mutated' })
  appendFileSync(manifest, `{"x":1}${NL}`)
  const r2 = g2.verify()
  results.push({ case: 'byte-mutated', guardRed: !r2.ok, expect: 'red' })
  console.log(`${r2.ok ? 'GREEN' : 'RED  '} byte-mutated  diffs=${r2.diffs.length}`)
  for (const line of r2.diffs) console.log(`      - ${line}`)

  rmSync(root, { recursive: true, force: true })
  const misbehaved = results.filter((r) => r.expect === 'green' ? r.guardRed : !r.guardRed)
  if (misbehaved.length > 0) {
    console.log(`${NL}negtest: FAIL 守卫行为不符预期 ${JSON.stringify(misbehaved)}`)
    process.exit(2)
  }
  console.log(`${NL}negtest: 负证成立（对照绿；两处污染均红）；退出码 1＝守卫如预期变红`)
  process.exit(1)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.dirname, 'probe-guard.mjs') && process.argv.includes('--negtest')) {
  negtest()
}
