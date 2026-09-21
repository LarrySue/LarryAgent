#!/usr/bin/env node
/**
 * DSH-3.3-a · S1 审批接入（第一段）**一键复跑装置**
 *
 * 回答一件事：`ctx.approval` 这条 seam 能不能被我们自己的插件接上 ——
 * 机制接入三件事：**scope filter 生效 ／ 日志可观测 ／ fail-closed 成立**。
 *
 * 姿态自证
 *   - 执行器：`harness/node_modules/@deepseek-ai/dsh`（0.1.5-rc.2，`--profile sdk`）
 *   - 前导：**无**（直接走 SDK 的 stdio JSON-RPC，用 `@deepseek-ai/dsh-sdk-client`）
 *   - home＋profile：**临时 home** 里 `cp -r` 出来的 sdk profile **真副本**（源 profile 不动）
 *   - 被装件：`packages/plugin-approval-answerer`（产品：本地策略答者）
 *             ＋ `packages/plugin-approval-probe`（装置用探针：`approval_probe` 工具 = 消费者替身）
 *   - 两个 agent：`run()` 不带 sessionId ⇒ **每次新会话**（`dsh-sdk-client/lib/index.js:686-699`）
 *     ⇒ 同一 runtime 里两个 agent，用于 scope filter 的两组对照
 *
 * arm（唯一变量 = 答者插件的装载/配置）：
 *   `main`      答者 `scope=first` ⇒ 只收首个 agent 的请求（J1/J2-①/J3/J4 都取自本臂）
 *   `scopeoff`  答者 `scope=all`  ⇒ 退化为全局答者（J6 负向 ②：J2-② 变红）
 *   `noanswerer`**不装答者**         ⇒ 请求落 `unavailable`（J6 负向 ①：fail-closed）
 *
 * 退出码：`0` 通过 ／ `1` 判据失败 ／ `2` 前置缺失（构建产物缺等，≠ 测试失败）／ `124` 看门狗
 * 🔴 本脚本**不打印 Key 值**（只判存在性）；Key 只进子进程 env，不落任何文件。
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

const HARNESS = resolve(import.meta.dirname, '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const DSH_BIN = join(HARNESS, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const ANSWERER = join(HARNESS, 'packages', 'plugin-approval-answerer')
const PROBE = join(HARNESS, 'packages', 'plugin-approval-probe')
const EVIDENCE = process.env.S33A_EVIDENCE_DIR ?? join(resolve(HARNESS, '..', '..'), '_trae-evidence', '33a')
const arm = process.argv[2] ?? 'main'
const ARMS = ['main', 'scopeoff', 'noanswerer']
if (!ARMS.includes(arm)) {
  console.error(`未知 arm：${arm}（可选：${ARMS.join(' / ')}）`)
  process.exit(2)
}
/** 每轮模型回合的时限（含 timeout 用例的 30 s 等待）。 */
const RUN_TIMEOUT_MS = Number(process.env.S33A_RUN_TIMEOUT_MS ?? 300_000)

const out = join(EVIDENCE, arm)
// ⚠️ 装置自证（2026-09-20 首跑暴露）：**必须先清本臂的输出目录**。本臂的打点/证据是 append 的，
//    同臂重复跑会把上一轮的 `answerer.log` / `probe.log` 留下来 ⇒ 判据读到**跨轮混样**
//    （实测：scopeoff 第二次跑读到第一轮的 home 行，main 的"非目标 agent"里混进历史会话）。
//    只清**本臂自己的目录**（不碰他人证据目录）。
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
const t = (name) => join(out, name)
function save(name, text) {
  writeFileSync(t(name), text ?? '', 'utf8')
}
function saveJson(name, value) {
  save(name, `${JSON.stringify(value, null, 2)}\n`)
}

// ── P-b 构建产物 ────────────────────────────────────────────────────────────
{
  const need = [
    [ANSWERER, join(ANSWERER, 'lib', 'index.js')],
    [PROBE, join(PROBE, 'lib', 'index.js')],
  ]
  if (arm === 'noanswerer') need.shift()
  const missing = need.filter(([, entry]) => !existsSync(entry))
  if (missing.length > 0) {
    console.error(`[33a] ❌ 缺构建产物（退出码 2 ≠ 测试失败）：\n${missing.map(([p]) => `  cd harness && pnpm --filter ${p} run build`).join('\n')}`)
    process.exit(2)
  }
}
if (!process.env.DEEPSEEK_API_KEY) {
  console.error('[33a] ❌ 需要真 Key（只判存在性、不读值）：base 通道必须走真模型回合')
  process.exit(2)
}

const home = mkdtempSync(join(tmpdir(), 'larry-33a-'))
mkdirSync(join(home, 'profiles'), { recursive: true })
cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
// ⚠️ DSH-3.7.4：副本不得沿用**源** profile 的 pnpm 元数据（绝对路径）⇒ 否则 plugin add 1 s 即
//    `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`（本机 Windows 必现）
rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })

const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`PASS  ${id}  ${detail}`.replace(/^PASS/, ok ? 'PASS' : 'FAIL'))
}

/** P-a：清孤儿 A 锁（只清死 PID；重命名备份，不删除）。 */
function releaseOrphanLock(profilesDir) {
  const lock = join(profilesDir, 'node_modules.lock')
  if (!existsSync(lock)) return { action: 'none', lock }
  const raw = readFileSync(lock, 'utf8').trim()
  const pid = Number.parseInt(raw, 10)
  if (!Number.isInteger(pid) || pid <= 0) return { action: 'live', lock, raw }
  let alive = true
  try {
    process.kill(pid, 0)
  } catch (e) {
    alive = e?.code !== 'ESRCH'
  }
  if (alive) return { action: 'live', lock, raw }
  const backup = `${lock}.bak.${Date.now()}`
  renameSync(lock, backup)
  return { action: 'renamed', lock, backup }
}

const pre = {
  when: new Date().toISOString(),
  arm,
  node: process.version,
  execPath: process.execPath,
  home,
  srcSdk: SRC_SDK,
  aLockPre: releaseOrphanLock(join(home, 'profiles')),
  keyPresent: true,
}
saveJson('J8-preflight.json', pre)
console.log(`[33a] arm=${arm} home=${home} aLock=${pre.aLockPre.action}`)

// ── 装插件（两个包；noanswerer 臂只装探针）──────────────────────────────────
const installs = []
function installPkg(dir, label) {
  const r = spawnSync(process.execPath, [DSH_BIN, 'plugin', '--profile', 'sdk', 'add', dir], {
    cwd: HARNESS,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, DSH_HOME: home, CI: '1' },
  })
  save(`install-${label}.stdout.txt`, r.stdout ?? '')
  save(`install-${label}.stderr.txt`, r.stderr ?? '')
  const done = /Done in .*pnpm/.test(`${r.stdout ?? ''}\n${r.stderr ?? ''}`)
  installs.push({ label, dir, status: r.status, pnpmDone: done })
  console.log(`[33a] plugin add ${label}: exit=${r.status} pnpmDone=${done}`)
}
if (arm !== 'noanswerer') installPkg(ANSWERER, 'answerer')
installPkg(PROBE, 'probe')
saveJson('install-summary.json', installs)
judge('J1-plugin-add', installs.every((i) => i.status === 0 && i.pnpmDone), JSON.stringify(installs))

// ── 覆盖配置（profile 自身 patch 层 = 最后一层，按 id 覆盖整行 config）────────
const answererMarker = t('answerer.log')
const probeMarker = t('probe.log')
const override = []
if (arm !== 'noanswerer') {
  const scope = arm === 'scopeoff' ? 'all' : 'first'
  override.push(
    '- id: plugin-approval-answerer',
    '  config:',
    `    scope: ${scope}`,
    '    policy: from-request',
    `    activateMarker: ${answererMarker.replace(/\\/g, '/')}`,
  )
}
override.push(
  '- id: plugin-approval-probe',
  '  config:',
  '    timeoutMs: 30000',
  `    activateMarker: ${probeMarker.replace(/\\/g, '/')}`,
)
const patchFile = join(home, 'profiles', 'sdk', 'cordis.patch.yml')
const before = existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : ''
writeFileSync(patchFile, `${before}${before.endsWith('\n') || before === '' ? '' : '\n'}\n# DSH-3.3-a 装置覆盖层\n${override.join('\n')}\n`)
save('cordis.patch.yml.after.txt', readFileSync(patchFile, 'utf8'))

// ── 提示词 ─────────────────────────────────────────────────────────────────
const CASES = ['approve', 'reject', 'throw', 'malformed', 'timeout']
const promptA = [
  '只做这一件事，不要做任何探索、不要读别的文件。',
  '依次调用 approval_probe 工具五次，参数 case 分别取：',
  CASES.join('、'),
  '每调用一次就把返回的 <executed> 与 <outcome> 原样贴回来（不要总结、不要解释、不要省略）。',
  '⛔ 不要传 sandbox_permissions 或任何升权参数；不要用别的工具；不要重试失败的调用。',
].join('\n')
const promptB = [
  '只做这一件事，不要做任何探索、不要读别的文件。',
  '调用 approval_probe 工具一次，参数 case 取 approve。',
  '然后把返回的 <executed> 与 <outcome> 原样贴回来。',
  '⛔ 不要用别的工具；不要重试。',
].join('\n')

// ── 跑（一个 runtime，两个 agent）──────────────────────────────────────────
const runs = []
const harness = new DeepSeekHarness({
  profile: 'sdk',
  provider: 'deepseek-official',
  model: 'deepseek-flash',
  dshHome: home,
  env: { ...process.env },
  initializeTimeoutMs: 120_000,
  requestTimeoutMs: RUN_TIMEOUT_MS,
})
try {
  for (const [label, prompt] of [['A', promptA], ['B', promptB]]) {
    const started = Date.now()
    const r = await harness.run(prompt)
    runs.push({
      label,
      sessionId: r.sessionId,
      seconds: Math.round((Date.now() - started) / 1000),
      events: r.events?.length ?? null,
      notifications: r.notifications?.length ?? null,
      finalResponse: r.finalResponse ?? '',
    })
    console.log(`[33a] run ${label}: session=${r.sessionId} ${runs.at(-1).seconds}s`)
  }
} catch (e) {
  runs.push({ label: 'ERROR', error: `${e?.name}: ${e?.message}` })
  save('run-error.txt', `${e?.stack ?? e?.message ?? String(e)}\n`)
} finally {
  await harness.close().catch(() => undefined)
}
saveJson('runs.json', runs)

// ── 取证：打点日志 ＋ 会话日志（多帧 zstd）──────────────────────────────────
const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])
function decodeSessionLog(file) {
  const buf = readFileSync(file)
  const starts = []
  let i = 0
  for (;;) {
    const at = buf.indexOf(MAGIC, i)
    if (at === -1) break
    starts.push(at)
    i = at + 4
  }
  const parts = []
  for (let k = 0; k < starts.length; k += 1) {
    const from = starts[k]
    const to = k + 1 < starts.length ? starts[k + 1] : buf.length
    try {
      parts.push(zstdDecompressSync(buf.subarray(from, to)))
    } catch {
      /* 尾帧截断 */
    }
  }
  return Buffer.concat(parts).toString('utf8')
}
function readMarker(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).flatMap((l) => {
    try {
      return [JSON.parse(l)]
    } catch {
      return []
    }
  })
}

const answererRows = arm === 'noanswerer' ? [] : readMarker(answererMarker)
const probeRows = readMarker(probeMarker)
const sessionRows = []
const sessionsRoot = join(home, 'sessions')
for (const project of existsSync(sessionsRoot) ? readdirSync(sessionsRoot) : []) {
  for (const session of readdirSync(join(sessionsRoot, project))) {
    const f = join(sessionsRoot, project, session, 'session.v3.jsonl.zstd')
    if (!existsSync(f)) continue
    const text = decodeSessionLog(f)
    const rows = text.split('\n').filter(Boolean).flatMap((l) => {
      try {
        return [JSON.parse(l)]
      } catch {
        return []
      }
    })
    sessionRows.push({ path: f, session, rows })
  }
}
saveJson('answerer.marker.json', answererRows)
saveJson('probe.marker.json', probeRows)
saveJson('sessions.index.json', sessionRows.map((s) => ({ path: s.path, session: s.session, rowTypes: s.rows.map((r) => r.type) })))
// 原始会话日志（多帧 zstd）另存一份进证据目录 ⇒ 判据"取哪份日志的哪一行"可被独立复核，
// 不依赖临时 home 是否还在（复核完删 home 也不丢证）
const rawDir = join(out, 'sessionlogs')
mkdirSync(rawDir, { recursive: true })
for (const s of sessionRows) {
  const dest = join(rawDir, `${s.session}.session.v3.jsonl.zstd`)
  cpSync(s.path, dest)
  writeFileSync(`${dest}.decoded.jsonl`, s.rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8')
}

// ── 判读 ───────────────────────────────────────────────────────────────────
const ev = (r) => answererRows.filter((x) => x.event === r)
const pv = (r) => probeRows.filter((x) => x.event === r)
const audit = sessionRows.flatMap((s) => s.rows.filter((r) => r.type === 'approval/asked' || r.type === 'approval/decided').map((r) => ({ session: s.session, ...r })))
const toolResults = sessionRows.flatMap((s) => s.rows.filter((r) => r.type === 'tool/result').map((r) => {
  const block = r.data?.message?.content?.[0]?.content?.[0]?.text ?? ''
  return { session: s.session, callId: r.data?.message?.source?.callId ?? null, text: block }
}))
saveJson('audit.json', audit)
saveJson('toolresults.json', toolResults)

// J1：四类打点
// ⚠️ 装置判据订正（2026-09-20 首跑暴露）：这两类打点**由答者插件产生** ⇒ `noanswerer` 臂
//    （故意不装答者）**不得**沿用同一期望，否则是"装置自身判据写错"伪装成被测对象失败。
if (arm !== 'noanswerer') {
  for (const kind of ['activate', 'inject-requested', 'inject-fired', 'answerer-registered']) {
    judge(`J1-打点:${kind}`, ev(kind).length > 0, `实测 ${ev(kind).length} 行｜首行=${JSON.stringify(ev(kind)[0] ?? null).slice(0, 220)}`)
  }
} else {
  judge('J1-答者未装(本臂的目的)', ev('activate').length === 0 && ev('answerer-registered').length === 0,
    `答者打点 activate=${ev('activate').length} registered=${ev('answerer-registered').length}（本臂故意不装答者，应全 0）`)
}
judge('J1-探针工具注册', pv('tool-registered').length > 0, `tool-registered ${pv('tool-registered').length} 行`)

// J2：scope filter 两组对照
// ⚠️ agent 集合的**可靠来源 = 探针的工具侧入口打点**（`probe-request` 带 agentId，与答者怎么注册无关）。
//    首跑教训：曾用 `agent-created-seen` 取"第二个 agent"——而那条打点只在 `scope=first`（监听 agent/created）
//    时才有 ⇒ 在 `scope=all` 臂恒为空，把"过滤失效"这条**期望的红**判成了装置故障。
const registered = ev('answerer-registered')
const probeAgents = [...new Set(pv('probe-request').map((r) => r.agentId).filter(Boolean))]
const answeredAgents = [...new Set(ev('answerer-request').map((r) => r.agentId).filter(Boolean))]
const registeredAgent = registered.find((r) => r.scope === 'agent')?.agentId ?? null
const nonTargets = probeAgents.filter((a) => a !== registeredAgent)
if (arm === 'main') {
  judge('J2-①目标agent-答者收到', registeredAgent !== null && answeredAgents.includes(registeredAgent),
    `注册=${JSON.stringify(registered.map((r) => `${r.scope}/${r.via}/${r.agentId}`))} ｜ 答者收到=${JSON.stringify(answeredAgents)} ｜ 发过请求的 agent=${JSON.stringify(probeAgents)}`)
  judge('J2-②非目标agent-答者未收到', nonTargets.length > 0 && nonTargets.every((a) => !answeredAgents.includes(a)),
    `非目标 agent=${JSON.stringify(nonTargets)}（必须非空，否则本组是空转）｜ 答者收到=${JSON.stringify(answeredAgents)}`)
}

// J3：五条用例
const cases = {}
for (const c of CASES) {
  const req = pv('probe-request').find((r) => r.case === c) ?? null
  const executed = pv('probe-executed').some((r) => r.case === c)
  const skipped = pv('probe-skipped').find((r) => r.case === c) ?? null
  const decided = audit.filter((r) => r.type === 'approval/decided')
  const askedForCase = audit.filter((r) => r.type === 'approval/asked' && String(r.data?.reason ?? '').includes(`case=${c}`))
  const ids = askedForCase.map((r) => r.data.id)
  const outcome = decided.filter((r) => ids.includes(r.data.id)).map((r) => r.data.outcome)
  cases[c] = {
    probeRequestSeen: req !== null,
    agentId: req?.agentId ?? null,
    executed,
    skipOutcome: skipped?.outcome ?? null,
    auditAsked: askedForCase.length,
    auditDecidedIds: ids.length,
    auditOutcomes: outcome,
  }
}
saveJson('J3-cases.json', cases)

// J4：审计事件成对
judge('J4-审计成对(asked/decided)', audit.filter((r) => r.type === 'approval/asked').length > 0 &&
  audit.filter((r) => r.type === 'approval/asked').length === audit.filter((r) => r.type === 'approval/decided').length,
  `asked=${audit.filter((r) => r.type === 'approval/asked').length} decided=${audit.filter((r) => r.type === 'approval/decided').length}`)

// J6：负向对照（**本臂的期望就是"该判据变红"** —— 见派发稿 J6 的两种现成破坏）
if (arm === 'noanswerer') {
  const outcomes = audit.filter((r) => r.type === 'approval/decided').map((r) => r.data.outcome)
  judge('J6①-不注册答者⇒unavailable(fail-closed)', outcomes.length > 0 && outcomes.every((o) => o === 'unavailable') && pv('probe-executed').length === 0,
    `outcomes=${JSON.stringify(outcomes)} ｜ probe-executed=${pv('probe-executed').length}（应为 0：一律不放行）`)
}
if (arm === 'scopeoff') {
  // 破坏动作 = 把答者从 agent 作用域改成全局（scope=all）⇒ **filter 失效**：
  //   期望 J2-② 的形态反转 —— 非目标 agent 的请求**也**被答者收到。
  judge('J6②-关掉scope-filter⇒非目标agent的请求也被收到(J2②变红)',
    probeAgents.length >= 2 && probeAgents.every((a) => answeredAgents.includes(a)),
    `发过请求的 agent=${JSON.stringify(probeAgents)}（须 ≥2 才构成对照）｜ 答者收到=${JSON.stringify(answeredAgents)}`)
}

const summary = {
  when: new Date().toISOString(),
  arm,
  findings,
  verdict: findings.every((f) => f.ok) ? '判据成立' : '存在不成立判据',
  runs,
  counts: {
    answererRows: answererRows.length,
    probeRows: probeRows.length,
    auditAsked: audit.filter((r) => r.type === 'approval/asked').length,
    auditDecided: audit.filter((r) => r.type === 'approval/decided').length,
    sessions: sessionRows.length,
  },
  cases,
}
saveJson('summary.json', summary)
releaseOrphanLock(join(home, 'profiles'))
console.log(`\n[33a] arm=${arm} 结论：${summary.verdict}`)
for (const f of findings) if (!f.ok) console.log(`   未成立：${f.judge} — ${f.detail}`)
console.log(`[33a] 证据：${out}`)
console.log(`[33a] 临时 home 保留在 ${home}（供复核；复核后可删）`)
process.exit(findings.every((f) => f.ok) ? 0 : 1)
