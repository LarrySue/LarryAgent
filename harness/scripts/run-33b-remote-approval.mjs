#!/usr/bin/env node
/**
 * DSH-3.3-b · 真出站往返（S1 审批接入 · 第二段）**一键复跑装置**
 *
 * 回答一件事：3.3-a 的「本地策略答者」换成**真跨进程往返**之后，§3.6 表里
 * 「② 的真风险」四条还成不成立 —— **跨进程等待 / 超时收尾 / 对端消失 / 取消传播**。
 *
 * 姿态自证
 *   - 执行器：`harness/node_modules/@deepseek-ai/dsh`（0.1.5-rc.2，`--profile sdk`）
 *   - 前导：**无**（走 SDK 的 stdio JSON-RPC；客户端 = 本装置自己的**薄客户端**
 *     `harness/scripts/33b-thin-client.mjs`，⛔ 不用 `HarnessClient`/`DeepSeekHarness`）
 *   - home＋profile：**临时 home** 里 `cp -r` 出来的 sdk profile **真副本**（源 profile 不动）
 *   - 键：只判 `DEEPSEEK_API_KEY` **存在性**；只进子进程 env；⛔ 不打印、不落盘、不进回报
 *   - 证据：`<repo>/../_trae-evidence/33b/<arm>/`（⛔ 与 3.3-a 的 `33a` 完全分开）
 *
 * arm（唯一变量 = 装了哪些插件 / 哪一侧的装置行为）：
 *   `main`          中继 ＋ 远端答者 ＋ 答者（3.3-a）＋ 探针；对端**作答** ⇒ J1/J2/J3(a)/J5
 *   `answertimeout` 同上，但**答者侧自建超时** 3 s（对端一直不回）⇒ J3(b)（落 `unavailable`）
 *   `noanswerer`    只装 中继 ＋ 探针（**不装任何答者**）⇒ J6①（fail-closed 锚）
 *   `nohandler`     全装，但对端**不装 `onRequest`** ⇒ dsh 侧收到 `-32601` ⇒ J6②
 *   `killpeer`      全装，对端收到后**被 runner 杀掉** ⇒ J4
 *
 * 退出码：`0` 通过 ／ `1` 判据失败 ／ `2` 前置缺失 ／ `124` 看门狗
 */
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

const HARNESS = resolve(import.meta.dirname, '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const DSH_BIN = join(HARNESS, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const PEER = join(HARNESS, 'scripts', '33b-thin-client.mjs')
const EVIDENCE = process.env.S33B_EVIDENCE_DIR ?? join(resolve(HARNESS, '..', '..'), '_trae-evidence', '33b')

const PKG = {
  relay: { name: '@larryagent/plugin-sdk-relay', dir: join(HARNESS, 'packages', 'plugin-sdk-relay'), rowId: 'sdk-jsonrpc-relay', built: 'lib/index.js' },
  remote: { name: '@larryagent/plugin-approval-remote-answerer', dir: join(HARNESS, 'packages', 'plugin-approval-remote-answerer'), rowId: 'plugin-approval-remote-answerer', built: 'lib/index.js' },
  answerer: { name: '@larryagent/plugin-approval-answerer', dir: join(HARNESS, 'packages', 'plugin-approval-answerer'), rowId: 'plugin-approval-answerer', built: 'lib/index.js' },
  probe: { name: '@larryagent/plugin-approval-probe', dir: join(HARNESS, 'packages', 'plugin-approval-probe'), rowId: 'plugin-approval-probe', built: 'lib/index.js' },
}

const ARM_SPEC = {
  main: {
    install: ['relay', 'remote', 'answerer', 'probe'],
    cases: ['approve', 'reject', 'timeout'],
    answerTimeoutMs: 0,
    probeTimeoutMs: 8000,
    lateMs: 0,
    handler: true,
    watchKill: false,
  },
  // ⚠️ 装置订正（2026-09-21 首跑暴露）：`lateabort` **单独成臂**。
  //    原因：探针 `isConcurrencySafe: () => true` ⇒ 模型可能**并发**发出多个工具调用，
  //    此时 `transport.pending` 里同时有多条出站请求，绝对 pending 数不再可解释
  //    （首跑实测：main 臂下一条请求采到 pendingBefore=2）。
  //    本臂**只发一条**探针调用 ⇒ 任一时刻至多一条出站请求 ⇒ pending 数无歧义。
  lateabort: {
    install: ['relay', 'remote', 'answerer', 'probe'],
    cases: ['lateabort'],
    answerTimeoutMs: 0,
    probeTimeoutMs: 8000,
    // ⚠️ 装置订正（首跑暴露）：`lateMs` 必须**略晚于请求侧撤回**（8 s）而不是远晚于，
    //    否则迟到帧落在 dsh 收工之后，采样窗口覆盖不到它（首跑：+5 s 之后的采样全丢）。
    //    本臂 graceful 收工窗口同时拉长，保证"迟到帧之后"至少还有 2 次采样。
    lateMs: 9000,
    graceMs: 8000,
    handler: true,
    watchKill: false,
  },
  answertimeout: {
    install: ['relay', 'remote', 'answerer', 'probe'],
    cases: ['timeout'],
    answerTimeoutMs: 3000,
    probeTimeoutMs: 30000,
    lateMs: 0,
    handler: true,
    watchKill: false,
  },
  noanswerer: {
    install: ['relay', 'probe'],
    cases: ['approve'],
    answerTimeoutMs: 0,
    probeTimeoutMs: 8000,
    lateMs: 0,
    handler: true,
    watchKill: false,
  },
  nohandler: {
    install: ['relay', 'remote', 'answerer', 'probe'],
    cases: ['approve'],
    answerTimeoutMs: 0,
    probeTimeoutMs: 8000,
    lateMs: 0,
    handler: false,
    watchKill: false,
  },
  killpeer: {
    install: ['relay', 'remote', 'answerer', 'probe'],
    cases: ['killpeer'],
    answerTimeoutMs: 0,
    probeTimeoutMs: 30000,
    lateMs: 0,
    handler: true,
    watchKill: true,
  },
  // ⚠️ J4 的**主形态**（首跑暴露后加的）：对端「进程**/传输**终止」里，**终止传输**这一路
  //    才落在派发稿 J4 期望的词汇上（`close()` = detach ＋ reject pending）。
  //    进程级 kill 那一臂（`killpeer`）会把 dsh 的**进程寿命**一并带走（`exitOnStdinEnd`），
  //    插件层的 reject 打点来不及落盘 —— 两臂都跑、分别报，见回报。
  closestdin: {
    install: ['relay', 'remote', 'answerer', 'probe'],
    cases: ['closestdin'],
    answerTimeoutMs: 0,
    probeTimeoutMs: 30000,
    lateMs: 0,
    handler: true,
    watchKill: false,
  },
}

const arm = process.argv[2] ?? 'main'
const spec = ARM_SPEC[arm]
if (spec === undefined) {
  console.error(`未知 arm：${arm}（可选：${Object.keys(ARM_SPEC).join(' / ')}）`)
  process.exit(2)
}

const out = join(EVIDENCE, arm)
// ⚠️ 先清**本臂自己的**输出目录（3.3-a 首跑暴露：打点/证据是 append 的，重复跑会读到跨轮混样）
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
const t = (name) => join(out, name)
const save = (name, text) => writeFileSync(t(name), text ?? '', 'utf8')
const saveJson = (name, value) => save(name, `${JSON.stringify(value, null, 2)}\n`)

// ── 前置 ───────────────────────────────────────────────────────────────────
{
  const missing = [...new Set(spec.install.map((k) => PKG[k]))]
    .filter((p) => !existsSync(join(p.dir, p.built)))
    .map((p) => `  cd harness && pnpm --filter ${p.name} run build`)
  if (missing.length > 0) {
    console.error(`[33b] ❌ 缺构建产物（退出码 2 ≠ 测试失败）：\n${missing.join('\n')}`)
    process.exit(2)
  }
}
if (!process.env.DEEPSEEK_API_KEY) {
  console.error('[33b] ❌ 需要真 Key（只判存在性、不读值）：base 通道必须走真模型回合')
  process.exit(2)
}

const home = mkdtempSync(join(tmpdir(), 'larry-33b-'))
mkdirSync(join(home, 'profiles'), { recursive: true })
cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
// DSH-3.7.4：副本不得沿用**源** profile 的 pnpm 元数据（绝对路径）⇒ 否则 plugin add 1 s 即
// `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`（本机 Windows 必现）
rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })

const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail}`)
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
  evidence: out,
  dshBin: DSH_BIN,
  aLockPre: releaseOrphanLock(join(home, 'profiles')),
  keyPresent: true,
  spec,
}
saveJson('J0-preflight.json', pre)
console.log(`[33b] arm=${arm} home=${home} aLock=${pre.aLockPre.action}`)

// ── 装插件 ─────────────────────────────────────────────────────────────────
const installs = []
function installPkg(key) {
  const p = PKG[key]
  const r = spawnSync(process.execPath, [DSH_BIN, 'plugin', '--profile', 'sdk', 'add', p.dir], {
    cwd: HARNESS,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, DSH_HOME: home, CI: '1' },
  })
  const combined = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
  const done = /Done in .*pnpm/.test(combined)
  save(`install-${key}.stdout.txt`, r.stdout ?? '')
  save(`install-${key}.stderr.txt`, r.stderr ?? '')
  installs.push({ key, name: p.name, dir: p.dir, status: r.status, pnpmDone: done })
  console.log(`[33b] plugin add ${key}: exit=${r.status} pnpmDone=${done}`)
}
for (const key of spec.install) installPkg(key)
saveJson('install-summary.json', installs)
judge('J1-plugin-add', installs.every((i) => i.status === 0 && i.pnpmDone), JSON.stringify(installs.map((i) => `${i.key}:exit=${i.status},pnpm=${i.pnpmDone}`)))

// ── 重排 bundle 层顺序（⚠️ 装置动作，报告里必须写明）─────────────────────────
// 为什么必须重排：3.3-a 的答者插件在 **apply 时** `ctx.get('approvalAnswerer')` 取值
// ⇒ `plugin-approval-remote-answerer` 的行必须**排在它之前**（详见该包 cordis.patch.yml 的说明）。
// 另：中继行必须排在 `@deepseek-ai/dsh-sdk-app` **之后**（否则它 disable 不动官方那一行）。
const profileJsonPath = join(home, 'profiles', 'sdk', 'package.json')
const manifest = JSON.parse(readFileSync(profileJsonPath, 'utf8'))
const bundlesBeforeList = manifest.dsh.profile.bundles ?? []
const desired = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-sdk-app']
for (const key of ['relay', 'remote', 'probe', 'answerer']) if (spec.install.includes(key)) desired.push(PKG[key].name)
// 只保留 `dsh plugin add` 真装上了的层（未装的包名不得凭空写进 bundles 列表）
manifest.dsh.profile.bundles = desired.filter((n) => bundlesBeforeList.includes(n))
writeFileSync(profileJsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
saveJson('bundles.json', {
  note: '装置动作：重排 dsh.profile.bundles（唯一目的 = 让「远端答者」的行先于 3.3-a 答者的行 apply，因为 3.3-a 在 apply 时 `ctx.get(\'approvalAnswerer\')`）',
  before: bundlesBeforeList,
  after: manifest.dsh.profile.bundles,
})

// ── 覆盖配置（profile 自身 patch 层 = 最后一层）────────────────────────────
const markerRelay = t('relay.log')
const markerRemote = t('remote-answerer.log')
const markerAnswerer = t('answerer.log')
const markerProbe = t('probe.log')
const override = []
if (spec.install.includes('relay')) {
  override.push(
    '- id: sdk-jsonrpc-relay',
    '  config:',
    `    activateMarker: ${markerRelay.replace(/\\/g, '/')}`,
  )
}
if (spec.install.includes('remote')) {
  override.push(
    '- id: plugin-approval-remote-answerer',
    '  config:',
    '    method: approval/request',
    `    answerTimeoutMs: ${spec.answerTimeoutMs}`,
    `    activateMarker: ${markerRemote.replace(/\\/g, '/')}`,
  )
}
if (spec.install.includes('answerer')) {
  override.push(
    '- id: plugin-approval-answerer',
    '  config:',
    '    scope: first',
    '    policy: from-request',
    `    activateMarker: ${markerAnswerer.replace(/\\/g, '/')}`,
  )
}
if (spec.install.includes('probe')) {
  override.push(
    '- id: plugin-approval-probe',
    '  config:',
    `    timeoutMs: ${spec.probeTimeoutMs}`,
    `    activateMarker: ${markerProbe.replace(/\\/g, '/')}`,
  )
}
const patchFile = join(home, 'profiles', 'sdk', 'cordis.patch.yml')
const before = existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : ''
writeFileSync(patchFile, `${before}${before.endsWith('\n') || before === '' ? '' : '\n'}\n# DSH-3.3-b 装置覆盖层\n${override.join('\n')}\n`)
save('cordis.patch.yml.after.txt', readFileSync(patchFile, 'utf8'))

// ── J1 证据：合并后的配置树（官方行是否真被禁用 / 中继行是否真在）────────────
{
  const r = spawnSync(process.execPath, [DSH_BIN, '--profile', 'sdk', '--dump-config'], {
    cwd: HARNESS,
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, DSH_HOME: home, CI: '1' },
  })
  save('cordis.merged-config.txt', `${r.stdout ?? ''}\n--- stderr ---\n${r.stderr ?? ''}`)
  console.log(`[33b] --dump-config exit=${r.status} bytes=${(r.stdout ?? '').length}`)
}

// ── 提示词 ─────────────────────────────────────────────────────────────────
const prompt = [
  '只做这一件事，不要做任何探索、不要读别的文件。',
  `依次调用 approval_probe 工具 ${spec.cases.length} 次，参数 case 分别取：`,
  spec.cases.join('、'),
  '每调用一次就把返回的 <executed> 与 <outcome> 原样贴回来（不要总结、不要解释、不要省略）。',
  '⛔ 必须**严格串行**：一次只调用一个工具，等它返回之后再调用下一个（不要并发发起多个调用）。',
  '⛔ 不要传 sandbox_permissions 或任何升权参数；不要用别的工具；不要重试失败的调用。',
].join('\n')

// ── 跑（薄客户端 ＋ stub 对端 = 另一个进程）────────────────────────────────
const peerOut = out
const peerEnv = {
  ...process.env,
  S33B_HOME: home,
  S33B_OUT: peerOut,
  S33B_ARM: arm,
  S33B_CWD: process.cwd(),
  S33B_PROMPT: prompt,
  S33B_LATE_MS: String(spec.lateMs),
  S33B_GRACE_MS: String(spec.graceMs ?? 4000),
  S33B_PROVIDER: 'deepseek-official',
  S33B_MODEL: 'deepseek-flash',
}
const peerStarted = Date.now()
const peer = spawn(process.execPath, [PEER], { cwd: HARNESS, env: peerEnv, stdio: ['ignore', 'pipe', 'pipe'] })
let peerStdout = ''
let peerStderr = ''
peer.stdout.setEncoding('utf8')
peer.stderr.setEncoding('utf8')
peer.stdout.on('data', (c) => { peerStdout += c })
peer.stderr.on('data', (c) => { peerStderr += c })
console.log(`[33b] peer pid=${peer.pid} (handler=${spec.handler})`)

/** 轮询对端日志（对端日志是 appendFileSync 写的 ⇒ 进程被杀也已在盘上）。 */
function readJsonl(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).flatMap((l) => {
    try {
      return [JSON.parse(l)]
    } catch {
      return []
    }
  })
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let killAction = { killed: false, at: null, sawRequestAt: null }
if (spec.watchKill) {
  const peerLog = t('peer.log')
  const deadline = Date.now() + 120_000
  for (;;) {
    const rows = readJsonl(peerLog)
    const hit = rows.find((r) => r.event === 'peer-request' && r.case === 'killpeer')
    if (hit !== undefined) {
      killAction.sawRequestAt = new Date().toISOString()
      break
    }
    if (Date.now() > deadline) break
    await sleep(200)
  }
  if (killAction.sawRequestAt !== null) {
    // ⭐ J4 的破坏动作：**建连之后把对端进程杀掉**
    peer.kill()
    killAction.killed = true
    killAction.at = new Date().toISOString()
    console.log('[33b] J4：已 kill 对端进程（stub 对端）')
  }
}
const peerExit = await new Promise((resolvePromise) => {
  const timer = setTimeout(() => {
    try { peer.kill() } catch { /* ignore */ }
    resolvePromise({ code: null, signal: 'WATCHDOG' })
  }, 300_000)
  peer.once('exit', (code, signal) => {
    clearTimeout(timer)
    resolvePromise({ code, signal })
  })
})
save('peer.stdout.txt', peerStdout)
save('peer.stderr.txt', peerStderr)
saveJson('peer-exit.json', { ...peerExit, seconds: Math.round((Date.now() - peerStarted) / 1000), ...killAction })
console.log(`[33b] peer exit=${peerExit.code} signal=${peerExit.signal} ${Math.round((Date.now() - peerStarted) / 1000)}s`)

// killpeer 臂：对端死后 dsh 侧还会写一段收尾打点 ⇒ 给它窗口
if (spec.watchKill) await sleep(6000)

// ── 取证：打点 ＋ 会话日志（多帧 zstd）──────────────────────────────────────
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

const relayRows = readJsonl(markerRelay)
const remoteRows = readJsonl(markerRemote)
const answererRows = readJsonl(markerAnswerer)
const probeRows = readJsonl(markerProbe)
const peerRows = readJsonl(t('peer.log'))
const peerWire = readJsonl(t('peer-wire.jsonl'))

const sessionRows = []
const sessionsRoot = join(home, 'sessions')
for (const project of existsSync(sessionsRoot) ? readdirSync(sessionsRoot) : []) {
  for (const session of readdirSync(join(sessionsRoot, project))) {
    const f = join(sessionsRoot, project, session, 'session.v3.jsonl.zstd')
    if (!existsSync(f)) continue
    const rows = decodeSessionLog(f).split('\n').filter(Boolean).flatMap((l) => {
      try {
        return [JSON.parse(l)]
      } catch {
        return []
      }
    })
    sessionRows.push({ path: f, session, rows })
  }
}
saveJson('relay.marker.json', relayRows)
saveJson('remote-answerer.marker.json', remoteRows)
saveJson('answerer.marker.json', answererRows)
saveJson('probe.marker.json', probeRows)
saveJson('peer.marker.json', peerRows)
saveJson('peer.wire.json', peerWire)
saveJson('sessions.index.json', sessionRows.map((s) => ({ path: s.path, session: s.session, rowTypes: s.rows.map((r) => r.type) })))
const rawDir = join(out, 'sessionlogs')
mkdirSync(rawDir, { recursive: true })
for (const s of sessionRows) {
  const dest = join(rawDir, `${s.session}.session.v3.jsonl.zstd`)
  cpSync(s.path, dest)
  writeFileSync(`${dest}.decoded.jsonl`, s.rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8')
}

const audit = sessionRows.flatMap((s) => s.rows
  .filter((r) => r.type === 'approval/asked' || r.type === 'approval/decided')
  .map((r) => ({ session: s.session, type: r.type, id: r.data?.id ?? null, outcome: r.data?.outcome ?? null, reason: r.data?.reason ?? null })))
saveJson('audit.json', audit)
const toolResults = sessionRows.flatMap((s) => s.rows.filter((r) => r.type === 'tool/result').map((r) => {
  const block = r.data?.message?.content?.[0]?.content?.[0]?.text ?? ''
  return { session: s.session, callId: r.data?.message?.source?.callId ?? null, text: block }
}))
saveJson('toolresults.json', toolResults)

// ── 判读公共量 ─────────────────────────────────────────────────────────────
const decided = audit.filter((r) => r.type === 'approval/decided')
// ⚠️ 装置判据订正（2026-09-21 首跑暴露）：`approval/decided` 行**不带** `reason`（只有 `asked` 行带）
//    ⇒ 按 `reason` 直接过滤 decided 行恒为空。正确做法：`asked`（按 reason 认领）→ `id` → `decided.outcome` 回填。
const outcomeById = new Map(decided.map((r) => [r.id, r.outcome]))
const decidedByCase = (c) => audit
  .filter((r) => r.type === 'approval/asked' && String(r.reason ?? '').includes(`case=${c}`))
  .map((r) => ({ id: r.id, outcome: outcomeById.get(r.id) ?? null }))
const outcomesOfCase = (c) => decidedByCase(c).map((x) => x.outcome).filter((o) => o !== null)
const executedByCase = (c) => probeRows.some((r) => r.event === 'probe-executed' && r.case === c)
const skippedByCase = (c) => probeRows.find((r) => r.event === 'probe-skipped' && r.case === c) ?? null
const remoteSendByCase = (c) => remoteRows.filter((r) => r.event === 'remote-send' && String(r.reason ?? '').includes(`case=${c}`))
const peerRequestByCase = (c) => peerRows.filter((r) => r.event === 'peer-request' && r.case === c)

const cases = {}
for (const c of spec.cases) {
  const sends = remoteSendByCase(c)
  const answers = remoteRows.filter((r) => (r.event === 'remote-answer' || r.event === 'remote-aborted' || r.event === 'remote-timeout' || r.event === 'remote-error') && sends.some((s) => s.requestId === r.requestId))
  cases[c] = {
    dshSideSent: sends.length,
    dshSideSendPendingBefore: sends.map((s) => s.pendingBefore),
    dshSideTerminal: answers.map((a) => ({ event: a.event, pendingAfter: a.pendingAfter ?? null, result: a.result ?? null, code: a.code ?? null, error: a.error ?? null })),
    peerSideReceived: peerRequestByCase(c).length,
    peerSideAnswers: peerRows.filter((r) => (r.event === 'peer-answer' || r.event === 'peer-late-answer-sent') && r.case === c).map((r) => ({ event: r.event, result: r.result ?? null, jsonrpcId: r.jsonrpcId ?? null })),
    probeExecuted: executedByCase(c),
    probeSkipOutcome: skippedByCase(c)?.outcome ?? null,
    auditDecisions: decidedByCase(c),
    auditOutcomes: outcomesOfCase(c),
  }
}
saveJson('J-cases.json', cases)

// ── 判据 ───────────────────────────────────────────────────────────────────
const relayActivate = relayRows.find((r) => r.event === 'activate') ?? null
judge('J1-中继激活(transport 已 provide)', relayActivate !== null && relayActivate.transportStarted === true,
  `relay activate=${JSON.stringify(relayActivate)}`)
const merged = existsSync(t('cordis.merged-config.txt')) ? readFileSync(t('cordis.merged-config.txt'), 'utf8') : ''
/** 从 `--dump-config` 的合并配置树里切出某个 loader 行的块（含其上一行的 `# == 来源层` 注释）。 */
function configSection(text, id) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => new RegExp(`^- id:\\s*${id}\\s*$`).test(l))
  if (start === -1) return null
  let end = lines.length
  for (let i = start + 1; i < lines.length; i += 1) if (/^- id:/.test(lines[i])) { end = i; break }
  const provenance = start > 0 && /^# ==/.test(lines[start - 1]) ? lines[start - 1] : null
  return { provenance, text: lines.slice(start, end).join('\n') }
}
const officialSection = configSection(merged, 'sdk-jsonrpc-server')
const relaySection = configSection(merged, 'sdk-jsonrpc-relay')
judge('J1-官方 sdk-jsonrpc-server 行已被禁用',
  officialSection !== null && /^\s*disabled: true\s*$/m.test(officialSection.text),
  `合并配置树里的官方行（来源层=${String(officialSection?.provenance)}）原文=${JSON.stringify(officialSection?.text ?? null)}`)
judge('J1-中继行已插入合并配置树（行 id/包名/inject 齐全）',
  relaySection !== null && /name: '@larryagent\/plugin-sdk-relay'/.test(relaySection.text) && /sdkAppStartup/.test(relaySection.text) && /loader/.test(relaySection.text),
  `中继行原文=${JSON.stringify(relaySection?.text ?? null)}`)

if (arm !== 'noanswerer') {
  const answererActivate = answererRows.find((r) => r.event === 'activate') ?? null
  judge('J1-3.3-a 答者取用了注入的 approvalAnswerer', answererActivate?.injectedAnswerer === true,
    `3.3-a activate 的 injectedAnswerer=${String(answererActivate?.injectedAnswerer)}、source=${String(answererActivate?.source)}（为 false ⇒ 本臂顺序没排对，全部结论作废）`)
} else {
  judge('J1-本臂故意不装任何答者', answererRows.length === 0 && remoteRows.length === 0,
    `3.3-a 答者打点=${answererRows.length} 行、远端答者打点=${remoteRows.length} 行（都应 0）`)
}

if (arm === 'main') {
  // J2：跨进程往返（两侧各自留痕）
  const approve = cases.approve
  const reject = cases.reject
  judge('J2-①dsh 侧真发出站请求', approve.dshSideSent >= 1 && reject.dshSideSent >= 1,
    `approve 发出=${approve.dshSideSent} 次、reject 发出=${reject.dshSideSent} 次`)
  judge('J2-②对端进程真收到（对端自己的日志）', approve.peerSideReceived >= 1 && reject.peerSideReceived >= 1,
    `对端收到 approve=${approve.peerSideReceived} 次、reject=${reject.peerSideReceived} 次（对端 peer.log，与 dsh 侧打点相互独立）`)
  judge('J2-③对端的答案回传后决策生效（批准⇒动作发生）', approve.probeExecuted === true && approve.auditOutcomes.includes('allowed-once'),
    `approve：probe-executed=${approve.probeExecuted}、审计 outcome=${JSON.stringify(approve.auditOutcomes)}`)
  judge('J2-④对端的答案回传后决策生效（拒绝⇒动作被拦）', reject.probeExecuted === false && reject.auditOutcomes.includes('rejected'),
    `reject：probe-executed=${reject.probeExecuted}、probe-skip=${JSON.stringify(reject.probeSkipOutcome)}、审计 outcome=${JSON.stringify(reject.auditOutcomes)}`)
  // J2 负向：对端收到但不回
  judge('J2-⑤负向：对端收到但不回 ⇒ 不得静默放行',
    cases.timeout.peerSideReceived >= 1 && cases.timeout.probeExecuted === false && cases.timeout.auditOutcomes.every((o) => o === 'cancelled'),
    `timeout：对端收到=${cases.timeout.peerSideReceived}、probe-executed=${cases.timeout.probeExecuted}、审计 outcome=${JSON.stringify(cases.timeout.auditOutcomes)}`)

  // J3(a)：请求侧 signal ⇒ cancelled
  judge('J3a-请求侧 signal 中止 ⇒ cancelled（不是 unavailable）',
    cases.timeout.auditOutcomes.length > 0 && cases.timeout.auditOutcomes.every((o) => o === 'cancelled'),
    `timeout：审计 outcome=${JSON.stringify(cases.timeout.auditOutcomes)}（应全为 cancelled）；本臂 answerTimeoutMs=0 ⇒ 答者侧不设表`)
  judge('J3a-答者侧未参与结算（本臂无自建超时打点）', remoteRows.filter((r) => r.event === 'remote-timeout').length === 0,
    `remote-timeout 打点=${remoteRows.filter((r) => r.event === 'remote-timeout').length} 行（应为 0）`)
}

if (arm === 'lateabort') {
  // J5：取消传播（本臂**只发一条**探针调用 ⇒ pending 数无歧义）
  const aborted = remoteRows.filter((r) => r.event === 'remote-aborted')
  const sendRow = remoteSendByCase('lateabort')[0] ?? null
  const abortedRow = aborted.find((r) => r.requestId === sendRow?.requestId) ?? null
  const late = peerRows.find((r) => r.event === 'peer-late-answer-sent' && r.case === 'lateabort') ?? null
  const samples = remoteRows.filter((r) => r.event === 'remote-pending-sample' && r.requestId === sendRow?.requestId)
  const samplesAfterLate = samples.filter((s) => late !== null && Date.parse(s.t) > Date.parse(late.t))
  judge('J5-①请求侧撤回 ⇒ 出站请求被 abort（pending 条目被移除、无泄漏）',
    abortedRow !== null && sendRow !== null && abortedRow.via === 'request-signal' && abortedRow.pendingAfter === sendRow.pendingBefore,
    `同一 requestId=${String(sendRow?.requestId)}：send.pendingBefore=${String(sendRow?.pendingBefore)} → aborted.pendingAfter=${String(abortedRow?.pendingAfter)}（via=${String(abortedRow?.via)}）`)
  judge('J5-②撤回后连续采样 pending 恒为 0（无泄漏）',
    samples.length >= 3 && samples.every((s) => s.pendingSize === 0) && sendRow?.pendingBefore === 0,
    `采样=${JSON.stringify(samples.map((s) => `+${s.afterAbortMs}ms:${s.pendingSize}`))}（至少 3 次）；本臂单发一条 ⇒ 撤回后应有 0 条未结清`)
  judge('J5-③对端补发的"迟到回答"被丢弃（窗口覆盖到该帧之后）',
    late !== null && samplesAfterLate.length >= 1 && samplesAfterLate.every((s) => s.pendingSize === 0),
    `迟到帧由对端在 @${String(late?.t)} 写出（result=${String(late?.result)}，jsonrpcId=${String(late?.jsonrpcId)}）；其后的采样=${JSON.stringify(samplesAfterLate.map((s) => `+${s.afterAbortMs}ms:${s.pendingSize}`))}；若该帧被留成 pending，这里会 >0`)
  judge('J5-④迟到回答不得改变结果（该用例仍是 cancelled / 动作未发生）',
    cases.lateabort.auditOutcomes.length > 0 && cases.lateabort.auditOutcomes.every((o) => o === 'cancelled') && cases.lateabort.probeExecuted === false,
    `lateabort：审计 outcome=${JSON.stringify(cases.lateabort.auditOutcomes)}、probe-executed=${cases.lateabort.probeExecuted}`)
}

if (arm === 'answertimeout') {
  const timeoutRows = remoteRows.filter((r) => r.event === 'remote-timeout')
  const reqs = peerRows.filter((r) => r.event === 'peer-request')
  judge('J3b-答者侧自建超时确实触发', timeoutRows.length > 0 && timeoutRows.every((r) => r.answerTimeoutMs === spec.answerTimeoutMs),
    `remote-timeout 打点=${timeoutRows.length} 行、answerTimeoutMs=${JSON.stringify(timeoutRows.map((r) => r.answerTimeoutMs))}`)
  judge('J3b-同一请求对端一直没回（证明不是对端先答）', reqs.length > 0 && peerRows.filter((r) => r.event === 'peer-answer' || r.event === 'peer-late-answer-sent').length === 0,
    `对端收到=${reqs.length}、对端作答=${peerRows.filter((r) => r.event === 'peer-answer' || r.event === 'peer-late-answer-sent').length}（应为 0）`)
  judge('J3b-答者侧超时 ⇒ unavailable（⛔ 不是 cancelled）',
    cases.timeout.auditOutcomes.length > 0 && cases.timeout.auditOutcomes.every((o) => o === 'unavailable'),
    `审计 outcome=${JSON.stringify(cases.timeout.auditOutcomes)}（应全为 unavailable）；probe-executed=${cases.timeout.probeExecuted}`)
  judge('J3b-请求侧 signal 未参与结算（30 s 表没到点）', cases.timeout.dshSideTerminal.every((x) => x.event !== 'remote-aborted'),
    `dsh 侧终结事件=${JSON.stringify(cases.timeout.dshSideTerminal.map((x) => x.event))}（应为 remote-timeout，不含 remote-aborted）`)
}

if (arm === 'noanswerer') {
  judge('J6①-不装远端答者 ⇒ 请求落 unavailable、被保护动作 0 次',
    decided.length > 0 && decided.every((r) => r.outcome === 'unavailable') && probeRows.filter((r) => r.event === 'probe-executed').length === 0,
    `审计 outcome=${JSON.stringify(decided.map((r) => r.outcome))}、probe-executed=${probeRows.filter((r) => r.event === 'probe-executed').length}（应为 0）`)
  judge('J6①-请求根本没发出站（无远端答者 ⇒ 无出站）', remoteRows.filter((r) => r.event === 'remote-send').length === 0,
    `remote-send 打点=${remoteRows.filter((r) => r.event === 'remote-send').length} 行（应为 0）`)
}

if (arm === 'nohandler') {
  const rejected = peerWire.filter((w) => w.direction === 'peer-to-dsh' && /-32601/.test(w.raw))
  const errRows = remoteRows.filter((r) => r.event === 'remote-error')
  judge('J6②-对端未装 handler ⇒ 天然回 -32601（原始帧）', rejected.length > 0,
    `对端写回的 -32601 帧=${rejected.length} 条；原文=${rejected[0]?.raw ?? '(无)'}`)
  judge('J6②-dsh 侧把 -32601 归一化为 unavailable、动作 0 次',
    errRows.some((r) => r.code === -32601) && decided.length > 0 && decided.every((r) => r.outcome === 'unavailable') && probeRows.filter((r) => r.event === 'probe-executed').length === 0,
    `remote-error code=${JSON.stringify(errRows.map((r) => r.code))}、审计 outcome=${JSON.stringify(decided.map((r) => r.outcome))}、probe-executed=${probeRows.filter((r) => r.event === 'probe-executed').length}`)
  judge('J6②-对端确实看到了出站请求（不是"没发出去"）', peerRows.filter((r) => r.event === 'peer-wire-seen-outbound-approval').length > 0,
    `对端原始帧登记的出站 approval/request=${peerRows.filter((r) => r.event === 'peer-wire-seen-outbound-approval').length} 条`)
}

if (arm === 'closestdin') {
  // J4 主形态：**终止传输**（对端收到请求后不答，随即 end() dsh 的 stdin）
  const inputEnd = relayRows.filter((r) => r.event === 'input-end' || r.event === 'input-error')
  const closeRow = relayRows.filter((r) => r.event === 'transport-close')
  judge('J4-①对端收到请求后不答、随即终止传输',
    peerRows.some((r) => r.event === 'peer-request' && r.case === 'closestdin') && peerRows.some((r) => r.event === 'peer-closed-stdin'),
    `对端 peer-request=${peerRows.filter((r) => r.event === 'peer-request').length} 行、peer-closed-stdin=${peerRows.filter((r) => r.event === 'peer-closed-stdin').length} 行、peer-answer=${peerRows.filter((r) => r.event === 'peer-answer').length} 行（后者应为 0）`)
  judge('J4-②dsh 侧输入流结束，**那一刻仍有未结清的出站请求**',
    inputEnd.length > 0 && inputEnd.some((r) => typeof r.pendingAtEnd === 'number' && r.pendingAtEnd > 0),
    `中继同步观测：${JSON.stringify(inputEnd.map((r) => ({ event: r.event, pendingAtEnd: r.pendingAtEnd, error: r.error ?? null })))}（>0 = 请求还没结清就被掐断）`)
  const rejectRow = remoteRows.filter((r) => r.event === 'remote-error')
  judge('J4-③dsh 侧那条未结清请求**被 reject**（不是靠超时兜底、也不是对端回错）',
    rejectRow.some((r) => r.code === null && /input closed|transport closed|JSON-RPC/i.test(String(r.error ?? '')) && r.pendingAfter === 0),
    `答者打点：${JSON.stringify(rejectRow.map((r) => ({ code: r.code, error: r.error, pendingAfter: r.pendingAfter, outcomeByService: r.outcomeByService })))}（code=null + "input closed" + pendingAfter=0 ⇒ 是传输关闭把它 reject 掉的）`)
  judge('J4-④`transport.close()` 在 dsh 收工时走到（此刻已无未结清条目）',
    closeRow.length > 0 && closeRow.every((r) => r.pendingAfterClose === 0),
    `中继同步观测：${JSON.stringify(closeRow.map((r) => ({ before: r.pendingBeforeClose, after: r.pendingAfterClose })))}（条目已在 input 结束时被清掉 ⇒ close 时 before=0）`)
  judge('J4-⑤请求确实已发出（不是"没发出去"）',
    remoteRows.some((r) => r.event === 'remote-send') && peerRows.some((r) => r.event === 'peer-wire-seen-outbound-approval'),
    `dsh 侧 remote-send=${remoteRows.filter((r) => r.event === 'remote-send').length} 行；对端原始帧登记=${peerRows.filter((r) => r.event === 'peer-wire-seen-outbound-approval').length} 条`)
  judge('J4-⑥fail-closed：请求落 `unavailable` 且被保护动作 0 次',
    cases.closestdin.probeSkipOutcome === 'unavailable' && cases.closestdin.probeExecuted === false,
    `探针自报（消费侧独立留痕）：probe-skip outcome=${JSON.stringify(cases.closestdin.probeSkipOutcome)}、probe-executed=${cases.closestdin.probeExecuted}；` +
    `⚠️ 会话日志（审计面）在本臂被 dsh 的**异步持久化**截断 —— 末行只到 approval/asked、没有 approval/decided（见 summary.observations），所以这条不取审计）`)
}

if (arm === 'killpeer') {
  // J4 的第二形态：**进程级 kill**。⚠️ 首跑实测：对端一死，dsh 的**进程寿命**就被 stdin EOF 绑走
  //    （`dsh-sdk-app` 的 `exitOnStdinEnd`）⇒ 走 microtask 的插件层打点（答者的 `remote-error`、
  //    会话日志的 `approval/asked`）**到不了盘**，连中继的 `input-end` 都抢不到（本臂实测为空）。
  //    ⇒ 本臂只断言**确实可观测**的那几条，其余作为「诚实边界」写进回报。
  const probeIssued = probeRows.filter((r) => r.event === 'probe-request')
  const lastRowType = sessionRows.at(-1)?.rows.at(-1)?.type ?? null
  judge('J4P-①对端进程确实被终止', killAction.killed === true,
    `runner kill 了对端：${killAction.killed}（看到请求帧于 ${String(killAction.sawRequestAt)}，kill 于 ${String(killAction.at)}）`)
  judge('J4P-②对端没作答（不是"答了才断"）', peerRows.filter((r) => r.event === 'peer-answer' || r.event === 'peer-late-answer-sent').length === 0,
    `对端作答打点=${peerRows.filter((r) => r.event === 'peer-answer' || r.event === 'peer-late-answer-sent').length} 行（应为 0）`)
  judge('J4P-③请求确实已发出（两侧各自留痕）',
    remoteRows.some((r) => r.event === 'remote-send') && peerRows.some((r) => r.event === 'peer-wire-seen-outbound-approval'),
    `dsh 侧 remote-send=${remoteRows.filter((r) => r.event === 'remote-send').length} 行；对端原始帧登记=${peerRows.filter((r) => r.event === 'peer-wire-seen-outbound-approval').length} 条`)
  judge('J4P-④fail-closed：被保护动作 0 次',
    probeIssued.length >= 1 && probeRows.filter((r) => r.event === 'probe-executed').length === 0,
    `probe-request=${probeIssued.length} 行、probe-executed=${probeRows.filter((r) => r.event === 'probe-executed').length}（应为 0）`)
  judge('J4P-⑤dsh 随即收工：会话日志停在该次 tool/call，无一条 tool/result',
    sessionRows.length > 0 && lastRowType === 'tool/call' && toolResults.length === 0,
    `会话日志末行类型=${String(lastRowType)}、tool/result 行数=${toolResults.length}（该次工具调用没走完 = 动作没发生）`)
}

const summary = {
  when: new Date().toISOString(),
  arm,
  spec,
  findings,
  verdict: findings.every((f) => f.ok) ? '判据成立' : '存在不成立判据',
  counts: {
    relayRows: relayRows.length,
    remoteRows: remoteRows.length,
    answererRows: answererRows.length,
    probeRows: probeRows.length,
    peerRows: peerRows.length,
    peerWire: peerWire.length,
    auditAsked: audit.filter((r) => r.type === 'approval/asked').length,
    auditDecided: decided.length,
    sessions: sessionRows.length,
  },
  // 诚实边界用的原始观测（不作判据）：哪些"插件层 reject 打点"真的落到了盘上
  observations: {
    relaySyncObservations: relayRows.filter((r) => ['input-end', 'input-error', 'transport-close'].includes(r.event)),
    answererRejectTraceLanded: remoteRows.some((r) => r.event === 'remote-error' || r.event === 'remote-aborted' || r.event === 'remote-timeout'),
    toolResults: toolResults.length,
    lastSessionRowType: sessionRows.at(-1)?.rows.at(-1)?.type ?? null,
  },
  cases,
}
saveJson('summary.json', summary)
releaseOrphanLock(join(home, 'profiles'))
console.log(`\n[33b] arm=${arm} 结论：${summary.verdict}`)
for (const f of findings) if (!f.ok) console.log(`   未成立：${f.judge} — ${f.detail}`)
console.log(`[33b] 证据：${out}`)
console.log(`[33b] 临时 home 保留在 ${home}（供复核；复核后可删）`)
process.exit(findings.every((f) => f.ok) ? 0 : 1)
