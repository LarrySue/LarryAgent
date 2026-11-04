#!/usr/bin/env node
/**
 * ③.2b 人审闸验收驱动（WB 派发 W-1～W-8）
 *
 * 链路：真 dsh 运行时（SDK 客户端 `--profile sdk` ＋ patch）→ 一条 prompt＝一个真 open turn
 *      → 模型调用装置工具 `memory_write_probe` → 插件 `memoryWriteGate`：
 *      stage（staging 表）→ 审批表决（本地答者）→ 仅 allowed-once 时重读 staging 落库。
 *
 * 场地：源 `.dsh-home/profiles/sdk` 只读；每臂一个临时 home（cpSync）＋ 临时 db；
 *      真实 home 由 probe-guard 守卫（root 必填）；⛔ 不碰 `.dsh-home/`、`~/.dsh`、`backend/config.yaml`。
 *
 * 用法：
 *   node harness/scripts/probe-32b/run-probe.mjs [--cases=approve,reject,cancelled,unavailable,edit,no-turn]
 *   凭据：外部注入 DEEPSEEK_API_KEY（⛔ 本文件不读不打印）
 * 退出码：0 判据全 PASS ／1 有 FAIL ／2 前置缺失
 */
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'
import { createHomeGuard } from '../embed-probe/probe-guard.mjs'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const DEPLOYED_MEMORY = join(SRC_SDK, 'node_modules', '@larryagent', 'plugin-s4-memory')
const TRIGGER_SRC = join(HERE, 'plugin')
const EDIT_ANSWERER_SRC = join(HERE, 'edit-answerer')
const ANSWERER_SRC = join(HARNESS, 'packages', 'plugin-approval-answerer')
const STAMP = new Date().toISOString().replace(/[:.]/g, '-')
const EVIDENCE = process.env.P32B_EVIDENCE ?? join(REPO, '_trae-evidence', 'probe-32b', STAMP)
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'probe-32b-'))

const REAL_HOME = join(homedir(), '.dsh')
const guard = createHomeGuard({ root: REAL_HOME })

mkdirSync(EVIDENCE, { recursive: true })
const requested = process.argv.find((a) => a.startsWith('--cases='))?.slice('--cases='.length)
const CASE_SET = requested ? new Set(requested.split(',')) : null

for (const [label, p] of [['src-sdk', SRC_SDK], ['deployed-memory', DEPLOYED_MEMORY], ['trigger', TRIGGER_SRC], ['answerer', ANSWERER_SRC], ['edit-answerer', EDIT_ANSWERER_SRC]]) {
  if (!existsSync(p)) {
    console.error(`[p32b] ❌ 前置缺失：${label} 不存在（${p}）`)
    process.exit(2)
  }
}
// 部署件自检：staging 网关已同步（否则验的是旧部署件）
if (!readFileSync(join(DEPLOYED_MEMORY, 'lib', 'write.js'), 'utf8').includes('memory_write_staging')) {
  console.error('[p32b] ❌ 部署件未同步：deployed write.js 无 memory_write_staging')
  process.exit(2)
}

const PLAIN_PROMPT = '只回复一个词：OK'

const CASES = [
  { name: 'approve', mode: 'approval', policy: 'approve', content: 'A句', prompt: PLAIN_PROMPT, expectRows: 1, expectContent: 'A句', expectOutcome: 'allowed-once' },
  { name: 'reject', mode: 'approval', policy: 'reject', content: 'A句', prompt: PLAIN_PROMPT, expectRows: 0, expectOutcome: 'rejected' },
  { name: 'cancelled', mode: 'approval', policy: 'timeout', abortAfterMs: 2000, content: 'A句', prompt: PLAIN_PROMPT, expectRows: 0, expectOutcome: 'cancelled' },
  { name: 'unavailable', mode: 'approval', policy: 'throw', content: 'A句', prompt: PLAIN_PROMPT, expectRows: 0, expectOutcome: 'unavailable' },
  { name: 'edit', mode: 'edit', edited: 'B句', content: 'A句', prompt: PLAIN_PROMPT, expectRows: 1, expectContent: 'B句' },
  { name: 'no-turn', mode: 'approval', policy: 'approve', noTurn: true, prompt: PLAIN_PROMPT },
  // W-7 负证：闸被短路后重跑 reject 臂（期望红：rows=1）
  { name: 'bypass-reject', mode: 'approval', policy: 'reject', content: 'A句', prompt: PLAIN_PROMPT, expectRows: 1, expectContent: 'A句', bypass: true },
]

function readFrames(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)] } catch { return [] }
  })
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitDone(framesPath, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (readFrames(framesPath).some((f) => f.judge === 'decision' || f.judge === 'W6-no-turn')) return true
    await sleep(500)
  }
  return false
}

async function runCase(c) {
  const out = join(EVIDENCE, c.name)
  mkdirSync(out, { recursive: true })
  const home = mkdtempSync(join(TEMP_ROOT, `${c.name}-`))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
  rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
  const modulesDir = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent')
  mkdirSync(modulesDir, { recursive: true })
  cpSync(TRIGGER_SRC, join(modulesDir, 'plugin-32b-trigger'), { recursive: true })
  if (c.mode === 'edit') cpSync(EDIT_ANSWERER_SRC, join(modulesDir, 'plugin-32b-edit-answerer'), { recursive: true })
  else cpSync(ANSWERER_SRC, join(modulesDir, 'plugin-approval-answerer'), { recursive: true })

  const dbPath = join(home, 'larry-memory.db')  // 复用 profile 既有行：dbPath=${DSH_HOME}/larry-memory.db
  const framesPath = join(out, 'frames.jsonl')
  writeFileSync(framesPath, '')
  const marker = join(out, 'answerer.log')
  const patch = join(out, 'probe.patch.yml')
  const answererRow = c.mode === 'edit'
    ? `    - id: probe-32b-edit-answerer\n      name: '@larryagent/plugin-32b-edit-answerer'\n      config:\n        dbPath: ${JSON.stringify(dbPath)}\n        editedContent: ${JSON.stringify(c.edited)}\n`
    : `    - id: probe-32b-answerer\n      name: '@larryagent/plugin-approval-answerer'\n      config:\n        policy: ${c.policy}\n        activateMarker: ${JSON.stringify(marker)}\n`
  writeFileSync(patch, [
    '# ③.2b 验收层（驱动生成）—— 复用 profile 既有 larry-s4-memory 行（⛔ 不重复插同一插件）',
    '- insert:',
    '    - id: probe-32b-trigger',
    "      name: '@larryagent/plugin-32b-trigger'",
    answererRow.trimEnd(),
    '',
  ].join('\n'))

  process.env.DSH_HOME = home
  process.env.DSH_TELEMETRY_DISABLED = '1'
  process.env.P32B_PROBE_OUT = framesPath
  process.env.P32B_CONTENT = c.content ?? 'A句'
  if (c.noTurn) process.env.P32B_NO_TURN = '1'
  else delete process.env.P32B_NO_TURN
  if (c.abortAfterMs) process.env.P32B_ABORT_AFTER_MS = String(c.abortAfterMs)
  else delete process.env.P32B_ABORT_AFTER_MS

  const runInfo = { case: c.name, home, dbPath, patch, prompt: c.prompt, error: null, finalResponse: null }
  let harness = null
  try {
    harness = new DeepSeekHarness({ profile: 'sdk', patches: [patch], provider: 'deepseek-official', model: 'deepseek-flash', initializeTimeoutMs: 20_000 })
    const result = await harness.run(c.prompt)
    runInfo.finalResponse = result.finalResponse ?? null
    await waitDone(framesPath, 90_000)
    await sleep(500)
  } catch (error) {
    runInfo.error = {
      name: error?.name ?? null,
      message: error?.message ?? String(error).slice(0, 300),
      stackHead: String(error?.stack ?? '').split('\n').slice(0, 10).join('\n'),
      own: Object.getOwnPropertyNames(error ?? {}).map((k) => [k, String(error[k]).slice(0, 400)]),
    }
  } finally {
    try { await harness?.close() } catch { /* 关闭失败不影响读数 */ }
  }

  // ── 一律读库取证（⛔ 不以返回值推断写入）──
  let memories = []
  let staging = []
  try {
    const db = new DatabaseSync(dbPath, { readOnly: true })
    try {
      memories = db.prepare("SELECT id, session_id, source_event_seq, content, kind FROM memories WHERE kind='memory' ORDER BY id").all()
      staging = db.prepare('SELECT id, session_id, source_event_seq, content, status FROM memory_write_staging ORDER BY id').all()
    } finally {
      db.close()
    }
  } catch (error) {
    runInfo.readError = String(error?.message ?? error).slice(0, 200)
  }
  const frames = readFrames(framesPath)
  const reading = { case: c.name, run: runInfo, memoryRows: memories, memoryRowCount: memories.length, stagingRows: staging, frames }
  writeFileSync(join(out, 'reading.json'), `${JSON.stringify(reading, null, 2)}\n`)
  return reading
}

const results = []
for (const c of CASES) {
  if (CASE_SET !== null && !CASE_SET.has(c.name)) continue
  console.log(`[p32b] ── case ${c.name} ──`)
  results.push(await runCase(c))
}

// ── 判定（W-1～W-6；W-5/7/8 在驱动外）──
const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id}  ${detail}`)
}
const byCase = Object.fromEntries(results.map((r) => [r.case, r]))
const decisionOf = (r) => r?.frames?.find((f) => f.judge === 'decision')
const outcomeOf = (r) => decisionOf(r)?.outcome ?? null
const idsOf = (r, c) => (r?.memoryRows ?? []).filter((row) => row.content === c)

if (byCase.approve && byCase.reject) {
  const approveTexts = byCase.approve.memoryRows.map((r) => r.content)
  const pairOk = byCase.reject.memoryRowCount === 0 && byCase.approve.memoryRowCount === 1
  judge('W-1', pairOk && idsOf(byCase.reject, 'A句').length === 0,
    `reject 臂 rows=${byCase.reject.memoryRowCount}（期望 0）；approve 臂 rows=${byCase.approve.memoryRowCount}（正证，期望 1）；approve 内容=${JSON.stringify(approveTexts)}`)
}
if (byCase.approve) {
  judge('W-2', byCase.approve.memoryRowCount === 1 && idsOf(byCase.approve, 'A句').length === 1 && idsOf(byCase.approve, 'B句').length === 0,
    `rows=${byCase.approve.memoryRowCount}；content=${JSON.stringify(byCase.approve.memoryRows.map((r) => r.content))}；outcome=${outcomeOf(byCase.approve)}`)
}
if (byCase.edit) {
  const hasB = idsOf(byCase.edit, 'B句').length === 1
  const hasA = idsOf(byCase.edit, 'A句').length
  judge('W-3', byCase.edit.memoryRowCount === 1 && hasB && hasA === 0,
    `入库 content=${JSON.stringify(byCase.edit.memoryRows.map((r) => r.content))}；A句命中=${hasA}（期望 0）；B句命中=${idsOf(byCase.edit, 'B句').length}`)
}
const states = [
  ['rejected', byCase.reject],
  ['cancelled', byCase.cancelled],
  ['unavailable', byCase.unavailable],
]
for (const [expected, r] of states) {
  if (r === undefined) continue
  judge(`W-4:${expected}`, r.memoryRowCount === 0 && outcomeOf(r) === expected,
    `outcome=${JSON.stringify(outcomeOf(r))}（期望 ${expected}）；rows=${r.memoryRowCount}（期望 0）；staging=${JSON.stringify(r.stagingRows.map((s) => s.status))}`)
}
if (byCase['no-turn']) {
  const f = byCase['no-turn'].frames.find((x) => x.judge === 'W6-no-turn')
  const outcome = f?.outcome ?? null
  judge('W-6', f !== undefined && outcome !== 'allowed-once' && byCase['no-turn'].memoryRowCount === 0,
    `无 open turn 的 outcome=${JSON.stringify(outcome)}（期望 ≠ allowed-once）；rows=${byCase['no-turn'].memoryRowCount}（期望 0）`)
}
if (byCase['bypass-reject']) {
  const red = byCase['bypass-reject'].memoryRowCount === 1
  judge('W-7:bypass-must-red', red,
    `短路闸后 reject 臂 rows=${byCase['bypass-reject'].memoryRowCount}（期望 1＝闸失去判别力，证明 W-1/W-4 不是恒绿）`)
}

const guardResult = guard.verify()
writeFileSync(join(EVIDENCE, 'guard-real-home.json'), `${JSON.stringify(guardResult, null, 2)}\n`)
judge('guard-real-home-untouched', guardResult.ok, `真实 home=${guardResult.root}；跑前跑后一致=${guardResult.ok}；差异=${JSON.stringify(guardResult.diffs)}`)

writeFileSync(join(EVIDENCE, 'summary.json'), `${JSON.stringify({ when: new Date().toISOString(), findings, evidence: EVIDENCE }, null, 2)}\n`)
console.log(`\n证据：${EVIDENCE}`)
process.exit(findings.every((f) => f.ok) ? 0 : 1)
