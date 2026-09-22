#!/usr/bin/env node
/**
 * DSH-3.8.1 · **验收脚本**（J1–J6 ＋ 反例对照 ＋ 双锚负向对照）
 *
 * 姿态自证
 *   - 场地：本机（Windows）；node ＝ `process.execPath` 自报（见 J0-preflight）
 *   - profile：**临时 home** 里 `cp -r` 出来的 sdk profile 真副本（源 `.dsh-home` 只读；⛔ 不碰）
 *   - 器件：`381-driver-host.mjs`（被观测的 driver 进程）＋ `381-stub-dsh.mjs`（桩 dsh，零 key）
 *   - 验靶：`dsh --profile sdk --patch <临时层> --dump-config`（**零副作用**；不改场地文件）
 *   - 证据：`D:\Code\_trae-evidence\381\<run>\`（env `S381_EVIDENCE_DIR` 可覆盖）
 *   - ⛔ **不打印、不落盘、不回报任何凭据值**：只判 `DEEPSEEK_API_KEY` **存在性**
 *
 * 退出码：`0` 通过 ／ `1` 判据失败 ／ `2` 前置缺失 ／ `124` 看门狗
 */
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const HARNESS = resolve(import.meta.dirname, '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const DSH_BIN = join(HARNESS, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const HOST = join(HARNESS, 'scripts', '381-driver-host.mjs')
const PEER_33B = join(HARNESS, 'scripts', '33b-thin-client.mjs')
const DRIVER_LIB = join(HARNESS, 'packages', 'dsh-driver', 'lib', 'index.js')
const EVIDENCE = process.env.S381_EVIDENCE_DIR ?? join(resolve(HARNESS, '..', '..'), '_trae-evidence', '381')
const OUT = join(EVIDENCE, process.env.S381_RUN ?? 'run1')

const findings = []
const judge = (id, ok, detail, status = ok ? 'PASS' : 'FAIL') => {
  findings.push({ judge: id, ok, status, detail })
  console.log(`${status.padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => judge(id, true, detail, 'OBS')
const na = (id, detail) => judge(id, true, detail, '未验')

const save = (name, text) => writeFileSync(join(OUT, name), text ?? '', 'utf8')
const saveJson = (name, value) => save(name, `${JSON.stringify(value, null, 2)}\n`)
const readJsonl = (file) => (existsSync(file)
  ? readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)] } catch { return [] } })
  : [])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

// ── 前置 ───────────────────────────────────────────────────────────────────
const preflight = {
  when: new Date().toISOString(),
  node: process.version,
  execPath: process.execPath,
  platform: process.platform,
  channel: 'PowerShell/system（本机直跑 node）',
  harness: HARNESS,
  evidence: OUT,
  dshBin: DSH_BIN,
  driverLibExists: existsSync(DRIVER_LIB),
  /** ⚠️ 只判**存在性**，永不读值 */
  keyPresent: process.env.DEEPSEEK_API_KEY !== undefined,
}
saveJson('J0-preflight.json', preflight)
console.log(`[381] node=${preflight.node} at ${preflight.execPath}  key=${preflight.keyPresent ? '存在' : '不存在'}`)

if (!preflight.driverLibExists) {
  console.error('[381] ❌ 前置缺失：driver 未构建 ⇒ cd harness && pnpm --filter @larryagent/dsh-driver run build（退出码 2）')
  process.exit(2)
}
if (!existsSync(SRC_SDK)) {
  console.error('[381] ❌ 前置缺失：源 profile 不存在（退出码 2）')
  process.exit(2)
}

// ── 场地：临时 home（源 profile 只读） ─────────────────────────────────────
const home = mkdtempSync(join(tmpdir(), 'larry-381-'))
mkdirSync(join(home, 'profiles'), { recursive: true })
cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
// DSH-3.7.4：副本不得沿用**源** profile 的 pnpm 元数据（绝对路径）⇒ 否则会 ERR_PNPM_UNEXPECTED_*
rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
saveJson('J0-home.json', { home, srcSdk: SRC_SDK, keepHome: (process.env.S381_KEEP_HOME ?? '1') !== '0' })

// ── 器件：三级 overlay（真改动 ／ 空改动 ／ 必不中）⇒ 让「有没有追记」这件事有判别力 ──
// ⚠️ 首跑教训（2026-09-22）：第一版的"必中"层指向 `sandbox` 并写 `disabled: true`，而**该行早已被
//    profile 层禁用** ⇒ 这是**空改动**，dump 里**不会**追记 provenance（见 J1-dump-noop.txt）
//    ⇒ 拿"没有 patched by"当"没命中"会误判。真改动 = 让某个字段**真的变了**。
const overlayHit = join(OUT, 'overlay-hit.yml')
const overlayNoop = join(OUT, 'overlay-noop.yml')
const overlayMiss = join(OUT, 'overlay-miss.yml')
writeFileSync(overlayHit, '# 必中：对**当前启用**的 session-title 行做**真改动**（→ 应被追记 patched by）\n- id: session-title\n  disabled: true\n')
writeFileSync(overlayNoop, '# 空改动对照：对**已被 profile 层禁用**的 sandbox 行再写一次 disabled: true（→ 值没变）\n- id: sandbox\n  disabled: true\n')
writeFileSync(overlayMiss, '# 必不中：id 不存在 ⇒ 应当留下 not found 警告（且仍 exit 0）\n- id: 381-definitely-not-a-real-entry\n  disabled: true\n')

const childEnv = { ...process.env, DSH_HOME: home, CI: '1' }
const envFor = (extra = {}) => ({ ...childEnv, ...extra })

function runSync(args, extraEnv = {}, timeout = 180_000) {
  const r = spawnSync(process.execPath, args, { cwd: REPO, env: envFor(extraEnv), encoding: 'utf8', timeout })
  return { code: r.status, signal: r.signal, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

/** 起一个被观测的子进程：拿到退出码/信号/墙钟/是否触发看门狗。 */
function spawnObserve(script, args, extraEnv, watchdogMs, label) {
  return new Promise((resolvePromise) => {
    const t0 = Date.now()
    const child = spawn(process.execPath, [script, ...args], { cwd: REPO, env: envFor(extraEnv), stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let watchdogFired = false
    let killedByHarness = false
    child.stdout.on('data', (c) => { stdout += c })
    child.stderr.on('data', (c) => { stderr += c })
    const watchdog = setTimeout(() => {
      watchdogFired = true
      killedByHarness = true
      try { child.kill() } catch { /* ignore */ }
    }, watchdogMs)
    child.once('exit', (code, signal) => {
      clearTimeout(watchdog)
      const ms = Date.now() - t0
      save(`${label}.stdout.txt`, stdout)
      save(`${label}.stderr.txt`, stderr)
      resolvePromise({ code, signal, ms, stdout, stderr, watchdogFired, killedByHarness, pid: child.pid })
    })
  })
}
const parseHostReport = (stdout) => {
  const line = stdout.split(/\r?\n/).find((l) => l.startsWith('HOST-REPORT '))
  return line === undefined ? null : JSON.parse(line.slice('HOST-REPORT '.length))
}

// ── J1 · 按 C13 形态能起（**同一次运行**顺带做 J6 运行时层取样） ─────────────
// ⚠️ 首跑教训：J6 的取样若放在这次运行**结束之后**，pid 早没了 ⇒ 等于没测；
//    另一次首跑教训：`exit` 监听挂在"探测之后"，而宿主可能**已经退了** ⇒ 监听挂在已死进程上，
//    await 永不结算 ⇒ Node 直接以 13（unsettled top-level await）退场。
//    ⇒ 本块：**先挂 exit 承诺**，再轮询 pid / 探测端口，最后 await。
const j1Marker = join(OUT, 'real-j1.log')
const j1T0 = Date.now()
/**
 * ⭐ 全机**监听端口快照**：只探"直接子进程 pid"会漏掉**孙进程**（若 gateway 另起一个进程来 listen）。
 * ⇒ 取"起装置前"与"装置存活期"两次全机快照，**增量**才是"这次运行新开的监听口"。
 */
function listListenPorts() {
  const r = spawnSync('netstat', ['-ano'], { encoding: 'utf8', timeout: 30_000 })
  const out = new Set()
  for (const line of (r.stdout ?? '').split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue
    const parts = line.trim().split(/\s+/)
    const local = parts[1] ?? ''
    const pid = parts[parts.length - 1] ?? ''
    const port = local.slice(local.lastIndexOf(':') + 1)
    if (port !== '') out.add(`${port}@${pid}`)
  }
  return out
}
const listenBaseline = listListenPorts()
const j1Child = spawn(process.execPath, [HOST, '--mode', 'real', '--prompt', '0', '--home', home, '--patch', overlayHit, '--marker', j1Marker], {
  cwd: REPO, env: envFor({}), stdio: ['ignore', 'pipe', 'pipe'],
})
let j1Stdout = ''
let j1Stderr = ''
let j1WatchdogFired = false
j1Child.stdout.on('data', (c) => { j1Stdout += c })
j1Child.stderr.on('data', (c) => { j1Stderr += c })
const t1Exit = new Promise((resolvePromise) => {
  j1Child.once('exit', (code, signal) => resolvePromise({ code, signal, ms: Date.now() - j1T0 }))
})
const j1Watchdog = setTimeout(() => {
  j1WatchdogFired = true
  try { j1Child.kill() } catch { /* ignore */ }
}, 180_000)

let j1ChildPid = null
for (let i = 0; i < 300; i += 1) {
  const rows = readJsonl(j1Marker)
  const started = rows.find((r) => r.event === 'driver-start')
  if (typeof started?.childPid === 'number') { j1ChildPid = started.childPid; break }
  await sleep(100)
}
const probes = []
const curls = []
for (const delayMs of [700, 2_000]) {
  await sleep(delayMs)
  if (typeof j1ChildPid !== 'number') break
  const netTcp = spawnSync('powershell', ['-NoProfile', '-Command', `Get-NetTCPConnection -State Listen -OwningProcess ${j1ChildPid} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort`], { encoding: 'utf8', timeout: 30_000 })
  const netstat = spawnSync('netstat', ['-ano'], { encoding: 'utf8', timeout: 30_000 })
  const ownLines = (netstat.stdout ?? '').split(/\r?\n/).filter((l) => l.includes('LISTENING') && l.trim().endsWith(String(j1ChildPid)))
  const ports = (netTcp.stdout ?? '').trim().split(/\r?\n/).filter(Boolean)
  const during = listListenPorts()
  const delta = [...during].filter((k) => !listenBaseline.has(k))
  probes.push({
    at: new Date().toISOString(),
    delayMs,
    childPid: j1ChildPid,
    aliveAtSample: true,
    netTcpLocalPorts: ports,
    netstatListenLines: ownLines,
    machineListenBaseline: listenBaseline.size,
    machineListenDuring: during.size,
    newListenPortsSinceBaseline: delta,
  })
  for (const port of ports) {
    const c = spawnSync('curl.exe', ['--noproxy', '*', '-s', '-o', 'NUL', '-w', '%{http_code}', '--max-time', '5', `http://127.0.0.1:${port}/api/remote.mux`], { encoding: 'utf8', timeout: 20_000 })
    curls.push({ port, url: `http://127.0.0.1:${port}/api/remote.mux`, httpCode: (c.stdout ?? '').trim(), exit: c.status })
  }
}
const t1raw = await t1Exit
clearTimeout(j1Watchdog)
const t1 = { ...t1raw, stdout: j1Stdout, stderr: j1Stderr, watchdogFired: j1WatchdogFired, killedByHarness: j1WatchdogFired, pid: j1ChildPid }
save('j1-host.stdout.txt', j1Stdout)
save('j1-host.stderr.txt', j1Stderr)
const j1 = parseHostReport(t1.stdout)
saveJson('J1-host-report.json', { ...j1, __exit: { code: t1.code, signal: t1.signal, ms: t1.ms, watchdogFired: t1.watchdogFired } })
judge('J1-a 启动形态 = dsh --profile <name>',
  j1 !== null && j1.started.argv.includes('--profile') && j1.started.argv.includes('sdk'),
  `实际 spawn 的 argv 原文 = ${JSON.stringify(j1?.started.argv ?? null)}`)
judge('J1-b 子进程 pid 已取得', typeof j1?.started.childPid === 'number' && j1.started.childPid > 0,
  `childPid=${String(j1?.started.childPid)}；launchMode=${String(j1?.started.launchMode)}`)
judge('J1-c overlay 以 --patch 原文出现在 argv',
  j1 !== null && j1.started.argv.includes('--patch') && j1.started.argv.includes(overlayHit),
  `argv 含 --patch=${j1?.started.argv.includes('--patch')}、含该层文件=${j1?.started.argv.includes(overlayHit)}`)

const dumpHit = runSync([DSH_BIN, '--profile', 'sdk', '--patch', overlayHit, '--dump-config'])
const dumpNoop = runSync([DSH_BIN, '--profile', 'sdk', '--patch', overlayNoop, '--dump-config'])
const dumpMiss = runSync([DSH_BIN, '--profile', 'sdk', '--patch', overlayMiss, '--dump-config'])
save('J1-dump-hit.txt', `${dumpHit.stdout}\n--- stderr ---\n${dumpHit.stderr}`)
save('J1-dump-noop.txt', `${dumpNoop.stdout}\n--- stderr ---\n${dumpNoop.stderr}`)
save('J1-dump-miss.txt', `${dumpMiss.stdout}\n--- stderr ---\n${dumpMiss.stderr}`)
const hitProvenance = dumpHit.stdout.split(/\r?\n/).filter((l) => l.includes('patched by'))
const hitNotFound = dumpHit.stderr.split(/\r?\n/).filter((l) => l.includes('not found'))
const noopProvenance = dumpNoop.stdout.split(/\r?\n/).filter((l) => l.includes('overlay-noop.yml'))
const missNotFound = dumpMiss.stderr.split(/\r?\n/).filter((l) => l.includes('not found'))
judge('J1-d 合并树里 overlay 层的**真改动**被追记',
  hitProvenance.some((l) => l.includes('overlay-hit.yml')) && hitNotFound.length === 0,
  `命中行的来源注释原文 = ${JSON.stringify(hitProvenance.filter((l) => l.includes('overlay-hit.yml')))}；not found 行数=${hitNotFound.length}`)
judge('J1-e ⭐ 必不中对照组：不存在的 id 确实打 not found（⇒「没有 not found」才可信）',
  missNotFound.length > 0 && dumpMiss.code === 0,
  `overlay-miss 的 not found 原文 = ${JSON.stringify(missNotFound).slice(0, 400)}；exit=${dumpMiss.code}（⚠️ 未命中仍 exit 0 ⇒ 不能只看退出码）`)
obs('J1-f ⚠️ 空改动不追记：对**已被禁用**的行再禁用一次，dump 里不出现该层名',
  `overlay-noop 层名在 dump stdout 里出现 ${noopProvenance.length} 次（原文 = ${JSON.stringify(noopProvenance)}）` +
  ` ⇒ **「命中」= 字段真的变了**；拿"没有 patched by"当"没命中"会误判（首跑就是这么栽的）`)

// ── J2 · 一次协议往返（initialize），并验「零 LLM 也能起」 ──────────────────
const initFrames = j1?.initialize?.frames ?? []
const initOut = initFrames.find((f) => f.dir === 'out' && f.raw.includes('"initialize"'))
const initIn = initFrames.find((f) => f.dir === 'in' && f.raw.includes('serverInfo'))
judge('J2-a initialize 往返成功（请求帧 ＋ 响应帧原文齐全）',
  j1?.initialize != null && initOut !== undefined && initIn !== undefined && typeof j1.initialize.elapsedMs === 'number',
  `耗时=${String(j1?.initialize?.elapsedMs)}ms；请求帧=${JSON.stringify(initOut?.raw ?? null)}；响应帧=${JSON.stringify(initIn?.raw ?? null)}`)
judge('J2-b ⭐ 零 LLM 也能起：该次运行 env 里**没有** key，且往返照成',
  j1?.started.envKeyPresent === false && j1?.initialize != null,
  `envKeyPresent=${String(j1?.started.envKeyPresent)}（只判存在性）；initialize 结果=${JSON.stringify(j1?.initialize?.result ?? null)}`)
const realStderr = t1.stderr
const llmErrLines = realStderr.split(/\r?\n/).filter((l) => /api.?key|unauthor|401|llm|deepseek/i.test(l))
save('J2-child-stderr.txt', realStderr)
obs('J2-c 该次运行未出现 LLM/凭据类错误行（"没牵 LLM"的旁证）',
  `子进程 stderr 共 ${realStderr.length} 字节；命中 /api.?key|unauthor|401|llm|deepseek/ 的行走 ${llmErrLines.length} 条：${JSON.stringify(llmErrLines.slice(0, 4))}`)

// ── J3 · ⭐ 能自己退出（本块核心）＋ 反例对照 ──────────────────────────────
const realStop = j1?.stop
const hostExitLog = readJsonl(`${join(OUT, 'real-j1.log')}.host-exit.log`)
const beforeExitRow = hostExitLog.find((r) => r.event === 'beforeExit')
judge('J3-a 宿主（driver 进程）自行退出：code 0 / 信号为 null / 未触发看门狗',
  t1.code === 0 && t1.signal === null && t1.watchdogFired === false,
  `host exit code=${String(t1.code)} signal=${String(t1.signal)} watchdogFired=${t1.watchdogFired} killedByHarness=${t1.killedByHarness} 宿主墙钟=${t1.ms}ms`)
judge('J3-b ⭐ 自退的机制级证据：`beforeExit` 触发（`process.exit()` 不会触发它）',
  beforeExitRow !== undefined,
  `host-exit.log 原文 = ${JSON.stringify(beforeExitRow ?? null)}（含 event=beforeExit ＋ code=${String(beforeExitRow?.code)}）`)
judge('J3-c 未依赖 kill：stop.forced / stop.killCalled 双 false',
  realStop?.forced === false && realStop?.killCalled === false,
  `forced=${String(realStop?.forced)} killCalled=${String(realStop?.killCalled)}；shutdown=${JSON.stringify(realStop?.shutdown ?? null)}`)
judge('J3-d dsh 子进程自己退了（exit code 0）',
  realStop?.childExit?.exited === true && realStop?.childExit?.code === 0,
  `childExit=${JSON.stringify(realStop?.childExit ?? null)}；**从收工信号到子进程退出的墙钟=${String(realStop?.childExit?.msSinceStopRequest)}ms**`)
obs('J3-e 收工后残留资源快照（⛔ 不作判据 —— 见回报自曝：已关闭未回收的管道也会被列出）',
  `before=${JSON.stringify(realStop?.activeResourcesBefore ?? null)} after=${JSON.stringify(realStop?.activeResourcesAfter ?? null)}（宿主仍自行退出）`)

// 反例对照：同条件跑 33b 骨架（真 dsh、无 key）
const peerOut = join(OUT, 'peer33b')
mkdirSync(peerOut, { recursive: true })
const peerRun = await spawnObserve(PEER_33B, [], {
  S33B_HOME: home,
  S33B_OUT: peerOut,
  S33B_ARM: 'main',
  S33B_CWD: REPO,
  S33B_PROMPT: '只回一句 ok，不要调用工具。',
  S33B_LATE_MS: '0',
  S33B_GRACE_MS: '1000',
  S33B_IDLE_TIMEOUT_MS: '8000',
  S33B_WATCHDOG_MS: '60000',
}, 120_000, 'j3-peer33b')
const peerLog = readJsonl(join(peerOut, 'peer.log'))
const peerChildExit = peerLog.find((r) => r.event === 'peer-child-exit')
const peerGapMs = peerChildExit === undefined ? null : peerRun.ms - (Date.parse(peerChildExit.t) - Date.parse(peerLog[0].t)) - (Date.parse(peerLog[0].t) - Date.parse(peerLog[0].t))
const peerExitToProcessEnd = peerChildExit === undefined ? null : peerRun.ms - (Date.parse(peerChildExit.t) - Date.parse(peerLog[0]?.t ?? peerChildExit.t))
const peerSource = readFileSync(PEER_33B, 'utf8').split(/\r?\n/)
const peerTail = peerSource.slice(294, 310).join('\n')
save('J3-peer33b-tail.txt', peerTail)
judge('J3-f 反例对照：33b 骨架的收尾**不是**自退（固定 4 s 后 kill ＋ process.exit）',
  peerExitToProcessEnd !== null && peerExitToProcessEnd > 2_000 && peerTail.includes('child.kill()') && peerTail.includes('process.exit(0)'),
  `dsh 子进程退出 → 骨架进程退出 的间隔 ≈ ${peerExitToProcessEnd}ms（骨架源码原文见 J3-peer33b-tail.txt：「setTimeout(() => { try { child.kill() } catch {} process.exit(0) }, 4_000)」）；` +
  `骨架 exit code=${String(peerRun.code)} signal=${String(peerRun.signal)}；⛔ 它**没有** beforeExit（无法在被测进程外注册该监听 ⇒ 靠源码原文 ＋ Node 语义）`)
void peerGapMs

// ── J4 · 反向请求：接住但⛔不自答（桩 dsh；双锚） ─────────────────────────
async function stubVariant(label, answerWord, stubWaitMs, holdMs) {
  const stubLog = join(OUT, `${label}-stub.log`)
  const driverMarker = join(OUT, `${label}-driver.log`)
  const r = await spawnObserve(HOST, ['--mode', 'stub', '--prompt', '1', '--answer', answerWord, '--marker', driverMarker, '--waitMs', '12000', '--holdMs', String(holdMs)], {
    S381_STUB_LOG: stubLog,
    S381_STUB_REVERSE_WAIT_MS: String(stubWaitMs),
  }, 60_000, label)
  return { r, report: parseHostReport(r.stdout), stubRows: readJsonl(stubLog), driverRows: readJsonl(driverMarker) }
}
const silent = await stubVariant('j4-silent', 'none', 2500, 3500)
const answered = await stubVariant('j4-answered', 'allowed-once', 6000, 1200)
for (const [label, v] of [['j4-silent', silent], ['j4-answered', answered]]) {
  saveJson(`${label}.json`, { report: v.report, stub: v.stubRows, driver: v.driverRows, exit: { code: v.r.code, signal: v.r.signal, ms: v.r.ms, watchdogFired: v.r.watchdogFired } })
}
const s4req = silent.driverRows.find((r) => r.event === 'reverse-request')
const s4ans = silent.driverRows.filter((r) => r.event === 'reverse-answer-sent')
const s4stubNo = silent.stubRows.find((r) => r.event === 'stub-reverse-no-answer')
const a4req = answered.driverRows.find((r) => r.event === 'reverse-request')
const a4ans = answered.driverRows.find((r) => r.event === 'reverse-answer-sent')
const a4stubYes = answered.stubRows.find((r) => r.event === 'stub-reverse-answer-received')
judge('J4-a driver 接住反向请求并把字段原样交出',
  s4req !== undefined && s4req.frameId !== null && s4req.requestId === 'stub-rev-1' && s4req.toolName === 'approval_probe' && s4req.callId === 'call_stub_1' && s4req.agentId === 'session-stub-1' && s4req.reason === 'case=stub',
  `driver 打点原文 = ${JSON.stringify(s4req ?? null)}`)
judge('J4-b ⛔ 上层未答 ⇒ driver **没有**替它答（负向锚）',
  s4ans.length === 0 && s4stubNo !== undefined && s4req?.noAutoAnswer === true,
  `driver 侧 reverse-answer-sent 行数=${s4ans.length}（应为 0）；对端侧 stub 打点原文 = ${JSON.stringify(s4stubNo ?? null)}；driver 自注 noAutoAnswer=${String(s4req?.noAutoAnswer)}`)
judge('J4-c ⭐ 正向锚：装置确实看得见"被答了"这件事（⇒ 上一条的"没答"不是装置看不见）',
  a4ans !== undefined && a4ans.byUpperLayer === true && a4stubYes !== undefined && a4stubYes.result === 'allowed-once',
  `driver：${JSON.stringify(a4ans ?? null)}；对端：${JSON.stringify(a4stubYes ?? null)}`)
judge('J4-d 两个变体都自行退出（未依赖 kill）',
  silent.r.code === 0 && answered.r.code === 0 && silent.report?.stop?.forced === false && answered.report?.stop?.forced === false,
  `silent exit=${String(silent.r.code)}/forced=${String(silent.report?.stop?.forced)}；answered exit=${String(answered.r.code)}/forced=${String(answered.report?.stop?.forced)}`)

// ── J5 · 双侧留痕（交叉） ─────────────────────────────────────────────────
judge('J5-a 桩路双侧交叉：driver 侧与对端侧**两个独立进程**对同一条请求各自留痕',
  s4req !== undefined && s4req.requestId === 'stub-rev-1' && silent.stubRows.some((r) => r.event === 'stub-reverse-request-sent' && r.params?.requestId === 'stub-rev-1'),
  `driver pid=${String(silent.report?.stop === undefined ? null : silent.report?.started?.childPid)} 侧 requestId=${String(s4req?.requestId)}；对端自身 requestId=stub-rev-1（见 j4-silent-stub.log）`)
na('J5-b DSH 侧同名插件日志（plugin-sdk-relay ／ plugin-approval-remote-answerer）那一形态',
  '**未验**：该形态要走真 dsh 触发一次出站 approval/request（需真跑一个 turn ⇒ 依赖 key）。按派发稿 §2-P2 → key 缺失分支处置；桩路（J5-a）为替代证据')

// ── J6 · gateway（顺带，不阻塞 J1–J5） ────────────────────────────────────
// ⚠️ 派发稿假绿坑 1：**装配层（dump）与运行时层（起没起 HTTP）可能不同结论** ⇒ 并列留痕、不合并。
const mergedText = dumpHit.stdout
const gatewayRowIndex = mergedText.split(/\r?\n/).findIndex((l) => l.includes('typert-gateway'))
const gatewayBlock = gatewayRowIndex < 0 ? [] : mergedText.split(/\r?\n/).slice(gatewayRowIndex, gatewayRowIndex + 6)
save('J6-dump-gateway.txt', gatewayBlock.join('\n'))
obs('J6-a 装配层：typert-gateway 行**未标 disabled**（原文）',
  `原文 = ${JSON.stringify(gatewayBlock)}`)

// 运行时层：取样已并入 J1 那次运行（进程存活期）
saveJson('J6-live-probe.json', { childPid: j1ChildPid, listenBaseline: [...listenBaseline], probes, curls })
obs('J6-b 运行时层：**本机监听端口增量**（含孙进程）＋ 直接子进程端口（存活期取样）',
  `childPid=${String(j1ChildPid)}；取样 = ${JSON.stringify(probes.map((p) => ({ delayMs: p.delayMs, 直接子进程端口: p.netTcpLocalPorts, netstat该pid监听行: p.netstatListenLines.length, 全机监听基线: p.machineListenBaseline, 存活期: p.machineListenDuring, 新增监听: p.newListenPortsSinceBaseline })))}；` +
  `curl(--noproxy '*') 试 /api/remote.mux = ${JSON.stringify(curls)}`)
obs('J6-c 两通道并列（⛔ 不合并）',
  `装配层＝typert-gateway 未标 disabled（J6-dump-gateway.txt）；运行时层＝见 J6-b。` +
  `派发稿 §附-5「装配层已翻转、运行时层仍未验」在本块被**同机同版本**复现（本块给出的是**本机运行时层读数**，与派发稿的解析口径一致）`)

// ── 汇总 ───────────────────────────────────────────────────────────────────
/**
 * 临时 home 的体积账（派发稿 §5 要求：**收尾打印路径与体积**；清理**必须走显式开关**，
 * ⛔ 不许 ad-hoc `rm -rf`）。开关：
 *   `S381_KEEP_HOME=0`      收尾删除**本次**的 home（默认 `1` 保留，复核要用）
 *   `S381_CLEAN_ORPHAN_HOMES=1` 顺带清掉 tmp 下**本块遗留**的 `larry-381-*`（默认 0，保守）
 */
function dirStats(dir) {
  let files = 0
  let bytes = 0
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name)
      if (entry.isDirectory()) walk(p)
      else {
        files += 1
        try { bytes += statSync(p).size } catch { /* ignore */ }
      }
    }
  }
  try { walk(dir) } catch { /* ignore */ }
  return { files, bytes, mb: Math.round((bytes / 1024 / 1024) * 10) / 10 }
}
const homeStats = dirStats(home)
const orphanHomes = readdirSync(tmpdir(), { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name.startsWith('larry-381-') && join(tmpdir(), e.name) !== home)
  .map((e) => join(tmpdir(), e.name))
const orphans = orphanHomes.map((p) => ({ path: p, ...dirStats(p) }))

const summary = {
  when: new Date().toISOString(),
  preflight,
  home,
  homeStats,
  findings,
  verdict: findings.every((f) => f.ok) ? '判据成立' : '存在不成立判据',
  counts: {
    pass: findings.filter((f) => f.status === 'PASS').length,
    fail: findings.filter((f) => f.status === 'FAIL').length,
    observation: findings.filter((f) => f.status === 'OBS').length,
    notVerified: findings.filter((f) => f.status === '未验').length,
  },
  cleanup: { keepHome: (process.env.S381_KEEP_HOME ?? '1') !== '0', orphanHomesBefore: orphans },
}
saveJson('summary.json', summary)
console.log(`\n[381] 结论：${summary.verdict}（PASS ${summary.counts.pass} ／ FAIL ${summary.counts.fail} ／ OBS ${summary.counts.observation} ／ 未验 ${summary.counts.notVerified}）`)
for (const f of findings) if (f.status === 'FAIL') console.log(`   未成立：${f.judge} — ${f.detail}`)
console.log(`[381] 证据：${OUT}`)
console.log(`[381] 临时 home：${home} — ${homeStats.mb} MB ／ ${homeStats.files} 文件（S381_KEEP_HOME=${process.env.S381_KEEP_HOME ?? '1'}）`)
if (orphans.length > 0) {
  console.log(`[381] tmp 下另有本块遗留 home ${orphans.length} 个，合计 ${Math.round(orphans.reduce((s, o) => s + o.mb, 0))} MB：${JSON.stringify(orphans.map((o) => o.path))}`)
  if ((process.env.S381_CLEAN_ORPHAN_HOMES ?? '0') === '1') {
    for (const o of orphans) {
      rmSync(o.path, { recursive: true, force: true })
      console.log(`[381] 已按开关清除遗留 home：${o.path}（${o.mb} MB）`)
    }
  }
}
if ((process.env.S381_KEEP_HOME ?? '1') === '0') {
  rmSync(home, { recursive: true, force: true })
  console.log(`[381] 已按开关删除本次临时 home（释放 ${homeStats.mb} MB）`)
}
process.exit(summary.counts.fail === 0 ? 0 : 1)
