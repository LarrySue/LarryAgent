#!/usr/bin/env node
/**
 * DSH-3.2.1 · 装置（父进程）：Windows 侧 named kernel semaphore 的**内核释放语义实测**
 *
 * 问法（派发稿 §0）：015 `dsh-session-persistence-jsonl` 自述的
 *   「Windows 走 named kernel semaphore、进程死亡即由内核释放、故意不做 TTL 抢占」
 * 在**本机 Windows** 上是否属实。
 *
 * 双锚（缺正锚则"能拿到"无法区分"内核真释放"与"锁压根没生效"）：
 *   J1 正锚 = 首写者活着 ⇒ 第二个写者被拒（`SessionAlreadyOwnedError`）
 *   J2 负锚 = `taskkill /F` 首写者 ⇒ 第二个写者**能拿到**（且由独立 koffi 探针佐证"真持有"）
 *
 * 驱动面：**直接**用 `@deepseek-ai/dsh-session-persistence-jsonl` 的 `create/flush/open(id,'write')`
 *   —— 不经 SDK：SDK 通道第二个进程撞的是「会话已存在」（`-32603 already exists`，DSH-3.2 已定性），
 *   **到不了租约层**，取不到本项要的 `SessionAlreadyOwnedError`。
 *
 * 场地：临时 root 落在 `<证据目录>/work-root`（仓外）⇒ 不碰 `$DSH_HOME` / 不改仓库。
 * 退出码：0 = 全部判据成立；1 = 有判据不成立；2 = 装置自身故障。
 */
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const HARNESS = resolve(import.meta.dirname, '..')
const REPO = resolve(HARNESS, '..')
const NODE = process.execPath
const CHILD = join(HARNESS, 'scripts', '321-lease-child.mjs')
const EVIDENCE_DIR = process.env.DS321_EVIDENCE_DIR ?? join(resolve(HARNESS, '..', '..'), '_trae-evidence', '321')
const WORK_ROOT = join(EVIDENCE_DIR, 'work-root')
const SESSION_ID = 's321-lease-0001'
const CWD = HARNESS

/** 派发稿 §5 的 5 个基线锚（本项预计零改动 ⇒ 收尾须逐一对上）。 */
const BASELINE_ANCHORS = [
  ['harness/pnpm-lock.yaml', join(HARNESS, 'pnpm-lock.yaml'), '541493B/a03ede8de3f00ee3'],
  ['harness/package.json', join(HARNESS, 'package.json'), '1283B/e4d338caa2a0431b'],
  ['plugin-sandbox-dialect/package.json', join(HARNESS, 'packages', 'plugin-sandbox-dialect', 'package.json'), '551B/9d6f4794a8aec191'],
  ['.dsh-home/profiles/sdk/cordis.patch.yml', join(REPO, '.dsh-home', 'profiles', 'sdk', 'cordis.patch.yml'), '769B/74400d260d5d4e6c'],
  ['落点 plugin-sandbox-dialect/index.js', join(REPO, '.dsh-home', 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-sandbox-dialect', 'index.js'), '4087B/022b0ff5efd11648'],
]

function anchorOf(file) {
  if (!existsSync(file)) return { exists: false }
  const body = readFileSync(file)
  return { exists: true, bytes: body.length, sha256_16: createHash('sha256').update(body).digest('hex').slice(0, 16) }
}
function anchorsNow() {
  return BASELINE_ANCHORS.map(([label, file, expected]) => {
    const a = anchorOf(file)
    const actual = a.exists ? `${a.bytes}B/${a.sha256_16}` : '(missing)'
    return { label, file, expected, actual, matches: actual === expected }
  })
}
function gitStatus() {
  const r = spawnSync('git', ['status', '--short'], { cwd: REPO, encoding: 'utf8' })
  return { status: r.status, short: (r.stdout ?? '').trim() }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ev = (name) => join(EVIDENCE_DIR, name)

function save(name, text) {
  mkdirSync(EVIDENCE_DIR, { recursive: true })
  writeFileSync(ev(name), text, 'utf8')
}
function saveJson(name, value) {
  save(name, `${JSON.stringify(value, null, 2)}\n`)
}
function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
}

async function waitJson(file, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (existsSync(file)) {
      try {
        return readJson(file)
      } catch {
        /* 半截写入：继续等 */
      }
    }
    if (Date.now() > deadline) throw new Error(`${label}: ${file} 未在 ${timeoutMs}ms 内出现可解析内容`)
    await sleep(100)
  }
}

function node(args, timeoutMs = 60_000) {
  return spawnSync(NODE, [CHILD, ...args], { cwd: HARNESS, encoding: 'utf8', timeout: timeoutMs })
}

function spawnHolder(args, outFile, errFile) {
  const child = spawn(NODE, [CHILD, ...args], { cwd: HARNESS, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  const out = []
  const err = []
  child.stdout.on('data', (d) => out.push(d))
  child.stderr.on('data', (d) => err.push(d))
  child.on('exit', () => {
    writeFileSync(outFile, Buffer.concat(out).toString('utf8'), 'utf8')
    writeFileSync(errFile, Buffer.concat(err).toString('utf8'), 'utf8')
  })
  return child
}

function tasklist(pid) {
  const r = spawnSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8' })
  return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim() }
}

/** `taskkill /F /PID <pid>` —— 派发稿 §4 明令：用 taskkill，不用 SIGKILL。 */
function taskkill(pid) {
  const r = spawnSync('taskkill', ['/F', '/PID', String(pid)], { encoding: 'utf8' })
  return { status: r.status, code: r.error?.code ?? null, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim() }
}

const findings = []
function judge(id, ok, detail) {
  findings.push({ judge: id, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail}`)
}

let childA
let childC
let summary

/** 看门狗（沿用 run-s0-resume.mjs 的退出码 124 约定）：卡住不许静默挂死。 */
const WATCHDOG_MS = Number(process.env.DS321_WATCHDOG_MS ?? 240_000)
setTimeout(() => {
  console.error(`看门狗超时（${WATCHDOG_MS}ms）`)
  for (const child of [childA, childC]) if (child && child.exitCode === null) { try { taskkill(child.pid) } catch { /* ignore */ } }
  process.exit(124)
}, WATCHDOG_MS)

try {
  // ── 前置（J6 A 锁 / J7 通道自证）────────────────────────────────────────────
  mkdirSync(EVIDENCE_DIR, { recursive: true })
  const pre = {
    when: new Date().toISOString(),
    node: process.version,
    execPath: NODE,
    childScript: CHILD,
    evidenceDir: EVIDENCE_DIR,
    workRoot: WORK_ROOT,
    sessionId: SESSION_ID,
    cwd: CWD,
    taskkill: spawnSync('where.exe', ['taskkill'], { encoding: 'utf8' }).stdout.trim() || '(where.exe 未命中)',
    aLock: {
      repo: join(REPO, '.dsh-home', 'profiles', 'node_modules.lock'),
      repoExists: existsSync(join(REPO, '.dsh-home', 'profiles', 'node_modules.lock')),
      user: join(process.env.USERPROFILE ?? '', '.dsh', 'profiles', 'node_modules.lock'),
      userExists: existsSync(join(process.env.USERPROFILE ?? '', '.dsh', 'profiles', 'node_modules.lock')),
    },
    workRootPreexisting: existsSync(WORK_ROOT),
    baselineAnchors: anchorsNow(),
    gitStatusShort: gitStatus(),
  }
  saveJson('J6J7-preflight.json', pre)
  console.log(`preflight: node=${pre.node} taskkill=${pre.taskkill}`)
  judge('J6-基线锚起跑全对', pre.baselineAnchors.every((a) => a.matches),
    pre.baselineAnchors.map((a) => `${a.label}=${a.matches ? 'OK' : `${a.actual}≠${a.expected}`}`).join(' ｜ '))

  if (existsSync(WORK_ROOT)) rmSync(WORK_ROOT, { recursive: true, force: true })
  mkdirSync(WORK_ROOT, { recursive: true })

  // A 锁（`dsh-atomic-write`）：本装置不碰 profiles ⇒ 全程应为"无孤儿"
  judge('J6-A锁无孤儿(起跑)', pre.aLock.repoExists === false && pre.aLock.userExists === false,
    `工程=${pre.aLock.repoExists} 用户=${pre.aLock.userExists}`)

  // ── 第一个写者（持有租约，常驻）────────────────────────────────────────────
  const readyA = ev('J1-holder-A-ready.json')
  if (existsSync(readyA)) rmSync(readyA, { force: true })
  childA = spawnHolder(['hold', WORK_ROOT, SESSION_ID, CWD, readyA], ev('J1-holder-A-stdout.txt'), ev('J1-holder-A-stderr.txt'))
  const A = await waitJson(readyA, 30_000, 'holder A ready')
  saveJson('J1-holder-A-ready.json', A)
  judge('J7-子进程自证(pid一致)', A.pid === childA.pid, `spawn=${childA.pid} 自报=${A.pid} node=${A.node}`)
  judge('J4-B锁无文件足迹', A.lockFileExists === false,
    `lockPath=${A.lockPath} 存在=${A.lockFileExists} 日志=${A.logBytes}B`)

  // ── J1 正锚：首写者活着时第二个写者被拒 ──────────────────────────────────────
  const j1 = ev('J1-open-try-second-writer.json')
  if (existsSync(j1)) rmSync(j1, { force: true })
  const r1 = node(['open-try', WORK_ROOT, SESSION_ID, j1])
  if (r1.status !== 0) throw new Error(`open-try(child) 自身失败: ${r1.status}\n${r1.stderr}`)
  const J1 = readJson(j1)
  const j1Rejected = J1.ok === false && J1.error?.name === 'SessionAlreadyOwnedError' && J1.error?.isSessionAlreadyOwned === true
  judge('J1-正锚(第二个被拒)', j1Rejected,
    `ok=${J1.ok} name=${J1.error?.name ?? '-'} code=${J1.error?.code ?? '-'} msg=${J1.error?.message ?? '-'}`)

  // J1 的机制佐证：独立 koffi 探针（同式名字派生）在首写者活着时应当等不到
  const rawA = ev('J4-raw-probe-during-A.json')
  if (existsSync(rawA)) rmSync(rawA, { force: true })
  const r2 = node(['raw', A.lockPath, rawA])
  if (r2.status !== 0) throw new Error(`raw(child) 自身失败: ${r2.status}\n${r2.stderr}`)
  const RAW_A = readJson(rawA)
  judge('J4-内核对象确实被占用', RAW_A.prefixes?.Local?.wait === 258,
    `Local wait=${RAW_A.prefixes?.Local?.wait} (${RAW_A.prefixes?.Local?.verdict}) ｜ Global wait=${RAW_A.prefixes?.Global?.wait} (${RAW_A.prefixes?.Global?.verdict})`)
  judge('J4-持锁期会话目录无锁文件(遍历范围)',
    Array.isArray(A.sessionDirEntries) && A.sessionDirEntries.length > 0 && !A.sessionDirEntries.includes('session.lock'),
    `sessionDir 全量列举 = [${(A.sessionDirEntries ?? []).join(', ')}]`)

  // ── J7 通道自证：杀之前进程在；杀之后进程不在 ────────────────────────────────
  const tlBefore = tasklist(A.pid)
  save('J7-tasklist-before-kill.txt', `> tasklist /FI "PID eq ${A.pid}" /FO CSV /NH\nexit=${tlBefore.status}\n${tlBefore.stdout}\n${tlBefore.stderr}\n`)
  judge('J7-被杀进程确实在跑', tlBefore.stdout.includes('node.exe') && tlBefore.stdout.includes(String(A.pid)),
    `tasklist: ${tlBefore.stdout || '(空)'}`)

  // ── J2 负锚：taskkill /F 首写者 ⇒ 第二个写者能拿到 ───────────────────────────
  const killA = taskkill(A.pid)
  save('J2-taskkill-A.txt',
    `> taskkill /F /PID ${A.pid}\nexit=${killA.status} spawnError=${killA.code}\n--- stdout ---\n${killA.stdout}\n--- stderr ---\n${killA.stderr}\n`)
  await sleep(800)
  const tlAfter = tasklist(A.pid)
  save('J7-tasklist-after-kill.txt', `> tasklist /FI "PID eq ${A.pid}" /FO CSV /NH\nexit=${tlAfter.status}\n${tlAfter.stdout}\n${tlAfter.stderr}\n`)
  judge('J7-taskkill 生效(进程已消失)', killA.status === 0 && !tlAfter.stdout.includes('node.exe'),
    `taskkill exit=${killA.status} out="${killA.stdout}" ｜ tasklist after="${tlAfter.stdout}"`)
  saveJson('J2-kill-A.json', { killA, tlBefore, tlAfter, holderPid: A.pid })

  // 第二个写者：**新进程** open(id,'write') 并常驻（不只"open 返回成功"，还要"真持有"）
  const readyC = ev('J2-holder-C-ready.json')
  if (existsSync(readyC)) rmSync(readyC, { force: true })
  const cErr = ev('J2-holder-C-stderr.txt')
  if (existsSync(cErr)) rmSync(cErr, { force: true })
  childC = spawnHolder(['hold-open', WORK_ROOT, SESSION_ID, readyC], ev('J2-holder-C-stdout.txt'), cErr)
  let C = null
  let cFailure = null
  try {
    C = await waitJson(readyC, 20_000, 'holder C ready')
    saveJson('J2-holder-C-ready.json', C)
    judge('J2-负锚(首写者死后第二个能拿到)', true,
      `ok=true pid=${C.pid} sessionDir=${C.sessionDir} lockFileExists=${C.lockFileExists}`)
  } catch (e) {
    cFailure = { message: e.message, stderr: existsSync(cErr) ? readFileSync(cErr, 'utf8') : '(无)' }
    saveJson('J2-holder-C-failure.json', cFailure)
    judge('J2-负锚(首写者死后第二个能拿到)', false, `未取得：${e.message} ｜ stderr=${cFailure.stderr.slice(0, 400)}`)
  }

  // 佐证：C 若真持有，独立探针此刻应仍等不到 ⇒ 排除"内核没释放只是没人要"
  let rawC = null
  let rawAfterC = null
  if (C !== null) {
    const f = ev('J2-raw-probe-during-C.json')
    if (existsSync(f)) rmSync(f, { force: true })
    const r3 = node(['raw', C.lockPath, f])
    if (r3.status !== 0) throw new Error(`raw(child) 自身失败: ${r3.status}\n${r3.stderr}`)
    rawC = readJson(f)
    judge('J2-第二个写者真持有(独立探针仍等不到)', rawC.prefixes?.Local?.wait === 258,
      `Local wait=${rawC.prefixes?.Local?.wait} (${rawC.prefixes?.Local?.verdict})`)

    // 再杀一次 ⇒ 释放可重复（不是一次性偶发）
    const killC = taskkill(C.pid)
    save('J2-taskkill-C.txt', `> taskkill /F /PID ${C.pid}\nexit=${killC.status}\n${killC.stdout}\n${killC.stderr}\n`)
    await sleep(800)
    const f2 = ev('J2-raw-probe-after-C-died.json')
    if (existsSync(f2)) rmSync(f2, { force: true })
    const r4 = node(['raw', C.lockPath, f2])
    if (r4.status !== 0) throw new Error(`raw(child) 自身失败: ${r4.status}\n${r4.stderr}`)
    rawAfterC = readJson(f2)
    judge('J2-释放可重复(第二次杀后内核亦释放)', rawAfterC.prefixes?.Local?.wait === 0,
      `Local wait=${rawAfterC.prefixes?.Local?.wait} (${rawAfterC.prefixes?.Local?.verdict})`)
  }

  // ── J5 作用域边界 ─────────────────────────────────────────────────────────
  const qw = spawnSync('qwinsta', [], { encoding: 'utf8' })
  save('J5-qwinsta.txt', `> qwinsta\nexit=${qw.status}\n${qw.stdout ?? ''}\n${qw.stderr ?? ''}\n`)
  const j5 = {
    sameLogonSessionAcrossProcesses: { tested: true, evidence: 'J1-* / J2-*（同一登录会话内两个独立 node 进程）' },
    localVsGlobalSameObject: {
      local: RAW_A.prefixes?.Local ?? null,
      global: RAW_A.prefixes?.Global ?? null,
      note: 'Local\\ 与 Global\\ 是两套名字空间：首写者持 Local\\ 时，裸探针在同一时刻对两前缀的零超时等待结果不同 ⇒ 二者不是同一对象',
    },
    crossTerminalServicesSession: {
      tested: false,
      reason: '需要第二个交互登录会话（另一用户 / RDP）才能起进程，本机无凭据无法制造；该维度**未实测**',
    },
    qwinstaStdout: (qw.stdout ?? '').trim(),
  }
  saveJson('J5-scope.json', j5)
  const distinctNamespaces = RAW_A.prefixes?.Local?.wait === 258 && RAW_A.prefixes?.Global?.wait !== 258
  judge('J5-Local 与 Global 非同一对象', distinctNamespaces,
    `持有时 Local=${RAW_A.prefixes?.Local?.wait}(${RAW_A.prefixes?.Local?.verdict}) / Global=${RAW_A.prefixes?.Global?.wait ?? 'create失败'}(${RAW_A.prefixes?.Global?.verdict})`)

  // ── J8 不污染基线 + 收尾清理 ───────────────────────────────────────────────
  const after = {
    aLock: {
      repoExists: existsSync(join(REPO, '.dsh-home', 'profiles', 'node_modules.lock')),
      userExists: existsSync(join(process.env.USERPROFILE ?? '', '.dsh', 'profiles', 'node_modules.lock')),
    },
  }
  for (const [label, child] of [['A', childA], ['C', childC]]) {
    if (child && child.exitCode === null && !child.killed) {
      try { taskkill(child.pid) } catch { /* 已死 */ }
    }
  }
  await sleep(500)
  const leftovers = []
  for (const [label, child] of [['A', childA], ['C', childC]]) {
    if (child) leftovers.push({ label, pid: child.pid, exitCode: child.exitCode, signalCode: child.signalCode })
  }
  const workExistsBefore = existsSync(WORK_ROOT)
  const workStat = workExistsBefore ? statSync(WORK_ROOT) : null
  if (workExistsBefore) rmSync(WORK_ROOT, { recursive: true, force: true })
  after.workRoot = { existedBeforeCleanup: workExistsBefore, isDir: workStat?.isDirectory() ?? null, existedAfterCleanup: existsSync(WORK_ROOT) }
  after.holders = leftovers
  after.baselineAnchors = anchorsNow()
  after.gitStatusShort = gitStatus()
  saveJson('J8-no-baseline-pollution.json', after)
  judge('J8-不污染基线', after.aLock.repoExists === false && after.aLock.userExists === false && after.workRoot.existedAfterCleanup === false,
    `A锁=${JSON.stringify(after.aLock)} 工作区已清=${!after.workRoot.existedAfterCleanup}`)
  judge('J8-5个基线锚收尾仍全对', after.baselineAnchors.every((a) => a.matches),
    after.baselineAnchors.map((a) => `${a.label}=${a.matches ? 'OK' : `${a.actual}≠${a.expected}`}`).join(' ｜ '))
  // 判据只覆盖本项**禁区范围**（`harness/**` 与 5 个基线锚）：`docs/**` 的结论回填是本项**有意**的交付动作，
  // 由 5 个基线锚 + 回报里的 `git status --short` 原文各自把关，不在此判据里制造假红。
  const unexpectedGit = after.gitStatusShort.short.split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && / harness\//.test(l))
    .filter((l) => !/^\?\? harness\/scripts\/(run-)?321-/.test(l))
  judge('J8-harness 侧除本项新增装置外无改动', unexpectedGit.length === 0,
    `git status --short 全文 = [${after.gitStatusShort.short.split('\n').map((l) => l.trim()).filter(Boolean).join(' ; ')}]`)

  // ── J9 若 J2 也红：两种成因的区分器 ────────────────────────────────────────
  const j2Ok = findings.find((f) => f.judge.startsWith('J2-负锚'))?.ok === true
  const j9 = j2Ok
    ? { needed: false, note: 'J2 成立 ⇒ 无需区分；J1 亦成立 ⇒ 正负双锚齐备，"内核释放语义属实"' }
    : {
        needed: true,
        discriminator: 'J1（正锚）结果',
        reading: j1Rejected
          ? 'J1 成立而 J2 不成立 ⇒ 锁**生效**但内核**未**随进程死亡释放（自述的释放语义不属实）'
          : 'J1 亦不成立 ⇒ 锁**压根没生效**，此时 J2 的"能拿到"不可作释放证据',
      }
  saveJson('J9-discriminator.json', j9)

  summary = {
    when: new Date().toISOString(),
    question: 'Windows 侧 named kernel semaphore：进程死亡是否由内核释放？',
    verdict: findings.every((f) => f.ok) ? '全部判据成立' : '存在不成立判据',
    findings,
    j5,
    j9,
    samples: { holderA: A, rawDuringA: RAW_A, secondWriterAttempt: J1, holderC: C, rawDuringC: rawC, rawAfterCDied: rawAfterC },
  }
  saveJson('summary.json', summary)

  console.log('')
  console.log(`结论：${summary.verdict}（${findings.filter((f) => f.ok).length}/${findings.length}）`)
  for (const f of findings) if (!f.ok) console.log(`  未成立：${f.judge} — ${f.detail}`)
  process.exit(findings.every((f) => f.ok) ? 0 : 1)
} catch (error) {
  saveJson('device-error.json', { message: error.message, stack: error.stack, findings })
  console.error(`装置自身故障：${error.message}`)
  for (const child of [childA, childC]) {
    if (child && child.exitCode === null) { try { taskkill(child.pid) } catch { /* ignore */ } }
  }
  process.exit(2)
}
