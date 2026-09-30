#!/usr/bin/env node
/**
 * DSH-3.4 · **S2 compaction 接入 · 验收装置**
 *
 * 姿势自证（本脚本模拟的真实链路）
 *   - 执行器：`harness/node_modules/@deepseek-ai/dsh/lib/bin.js`（`dsh 0.1.5-rc.2`）
 *   - 链路：**dsh SDK 通道**（`dsh --profile sdk`，stdio 行分帧 JSON-RPC；同进程可连发多次 `session/prompt`）
 *   - home：**临时 home 副本**（`cp -r .dsh-home/profiles/sdk` 到 `mkdtemp`；⛔ 不就地改源 profile）
 *   - 凭据层：**启动环境**（`DEEPSEEK_API_KEY` 由 caller 注入子进程 env；⛔ 本脚本不读值、不落盘、不进输出）
 *   - 进程内探针：`@larryagent/plugin-34-probe`（实体复制进 profile 自身层 node_modules）—— 口径④ 要求在
 *     `session.deriveMessages()` 上断言，而 SDK 客户端拿不到该视图 ⇒ 必须进程内取
 *
 * 用法
 *   node harness/scripts/run-34-compaction.mjs j1                      # L0：配置层真被读入（0 token）
 *   node harness/scripts/run-34-compaction.mjs j2                      # L0-A：手动入口不存在性（0 token）
 *   node harness/scripts/run-34-compaction.mjs run --fill <tokens> [--turns 2] [--a 1] [--maxTokens N] [--nonce 1] [--window 20000]
 *
 * 退出码：`0` 通过 ／ `1` 判据失败 ／ `2` 前置缺失 ／ `124` 看门狗超时
 *
 * ⛔ 本脚本不打印 key；只判其存在性。
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DshDriver } from '../packages/dsh-driver/lib/index.js'

const HARNESS = resolve(import.meta.dirname, '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const DSH_BIN = join(HARNESS, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const DRIVER_LIB = join(HARNESS, 'packages', 'dsh-driver', 'lib', 'index.js')
const PROBE_SRC = join(HARNESS, 'packages', 'plugin-34-probe')
const DISABLE_PATCH = join(HARNESS, 'scripts', 'compaction', 'disable-compact-entry.mount.patch.yml')
const EVIDENCE = process.env.S34_EVIDENCE_DIR ?? join(resolve(HARNESS, '..', '..'), '_trae-evidence', '34')

const findings = []
const judge = (id, ok, detail, status = ok ? 'PASS' : 'FAIL') => {
  findings.push({ judge: id, ok, status, detail })
  console.log(`${status.padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => judge(id, true, detail, 'OBS')
const save = (dir, name, text) => writeFileSync(join(dir, name), text ?? '', 'utf8')
const saveJson = (dir, name, v) => save(dir, name, `${JSON.stringify(v, null, 2)}\n`)
const readJsonl = (f) => (existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)] } catch { return [] } }) : [])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const argOf = (name, dflt) => { const i = process.argv.indexOf(name); return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : dflt }
const has = (name) => process.argv.includes(name)

// ── 前置 ────────────────────────────────────────────────────────────────────
const preflight = {
  when: new Date().toISOString(),
  node: process.version,
  execPath: process.execPath,
  platform: process.platform,
  channel: 'Windows / PowerShell 通道（RunCommand）',
  dshBin: DSH_BIN,
  dshBinExists: existsSync(DSH_BIN),
  srcProfile: SRC_SDK,
  srcProfileExists: existsSync(SRC_SDK),
  driverLibExists: existsSync(DRIVER_LIB),
  probeBuilt: existsSync(join(PROBE_SRC, 'lib', 'index.js')),
  disablePatchExists: existsSync(DISABLE_PATCH),
  /** ⚠️ 只判**存在性**，永不读值、不打印、不落盘 */
  keyPresent: typeof process.env.DEEPSEEK_API_KEY === 'string' && process.env.DEEPSEEK_API_KEY.length > 0,
  repo: REPO,
}
mkdirSync(EVIDENCE, { recursive: true })

const ARM = process.argv[2] ?? 'help'

// ── 工具：建临时 home（含 A 落地 ／ 探针实体复制） ──────────────────────────
function makeHome({ arm, disableCompact = false, probe = true }) {
  const home = mkdtempSync(join(tmpdir(), 'larry-34-'))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
  // 副本不得沿用源 profile 的 pnpm 元数据（绝对路径 ⇒ ERR_PNPM_UNEXPECTED_*，3.7.4 教训）
  rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
  const patchFile = join(home, 'profiles', 'sdk', 'cordis.patch.yml')
  const before = existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : ''
  let appended = ''
  if (probe) {
    // 实体复制（⛔ 不 link、不放共享层 —— 3.7.2 实测教训）
    const dst = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-34-probe')
    mkdirSync(dst, { recursive: true })
    for (const f of ['package.json', 'cordis.patch.yml']) cpSync(join(PROBE_SRC, f), join(dst, f))
    cpSync(join(PROBE_SRC, 'lib'), join(dst, 'lib'), { recursive: true })
    appended += `\n# DSH-3.4 装置：进程内探针（口径④ 断言位置 = deriveMessages()）\n- insert:\n    - id: probe-34\n      name: '@larryagent/plugin-34-probe'\n`
  }
  if (disableCompact) {
    appended += `\n# DSH-3.4 · A 裁定落地（受控源 = harness/scripts/compaction/disable-compact-entry.mount.patch.yml）\n${readFileSync(DISABLE_PATCH, 'utf8').split('\n').filter((l) => l.startsWith('- id:') || l.trimStart().startsWith('disabled:')).join('\n')}\n`
  }
  writeFileSync(patchFile, `${before}${appended}`, 'utf8')
  return { home, patchFile, patchBefore: before, patchAfter: readFileSync(patchFile, 'utf8') }
}

function makeOverlay(dir, name, lines) {
  const p = join(dir, name)
  writeFileSync(p, `${lines.join('\n')}\n`, 'utf8')
  return p
}

// ── J1 · 配置层真被读入（L0 · 0 token）────────────────────────────────────
function bootOnce({ home, overlay, label, dir }) {
  const t0 = Date.now()
  const r = spawnSync(process.execPath, [DSH_BIN, '--profile', 'sdk', '--patch', overlay], {
    cwd: REPO, env: { ...process.env, DSH_HOME: home, CI: '1' }, input: '', encoding: 'utf8', timeout: 120_000,
  })
  const rec = { label, overlay, code: r.status, signal: r.signal, ms: Date.now() - t0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
  save(dir, `boot-${label}.stderr.txt`, rec.stderr)
  save(dir, `boot-${label}.stdout.txt`, rec.stdout)
  return rec
}

async function armJ1(dir) {
  const cases = [
    { label: 'bad-retain', lines: ['# 必中：retainRatio(0.9) ≥ thresholdRatio(0.8) ⇒ load 期必抛', '- id: compaction-basic', '  config:', '    retainRatio: 0.9'], expect: /retainRatio \(0\.9\) must be less than the resolved thresholdRatio \(0\.8\)/ },
    { label: 'bad-key', lines: ['# 必中：未知 key ⇒ load 期必抛', '- id: compaction-basic', '  config:', '    maxToken: 1'], expect: /unknown key "maxToken"/ },
    { label: 'anchor-ok', lines: ['# 双锚（反向对照）：改用合法配置 ⇒ 上述两类错误均不得出现', '- id: compaction-basic', '  config:', '    thresholdRatio: 0.5'], expect: null },
  ]
  const results = {}
  for (const c of cases) {
    const { home } = makeHome({ arm: 'j1', disableCompact: false, probe: false })
    const overlay = makeOverlay(dir, `overlay-${c.label}.yml`, c.lines)
    const rec = bootOnce({ home, overlay, label: c.label, dir })
    results[c.label] = { ...rec, expectRegex: String(c.expect) }
    rmSync(home, { recursive: true, force: true })
  }
  saveJson(dir, 'J1-boot-runs.json', results)

  const bad = results['bad-retain']
  judge('J1-a 非法 retainRatio ⇒ load 期真抛（含官方原文）',
    bad.code !== 0 && /retainRatio \(0\.9\) must be less than the resolved thresholdRatio \(0\.8\)/.test(bad.stderr),
    `exit=${bad.code} ms=${bad.ms}；stderr 命中行 = ${JSON.stringify((bad.stderr.split(/\r?\n/).find((l) => l.includes('retainRatio (0.9)')) ?? null))}`)
  const bkey = results['bad-key']
  judge('J1-b 未知 key ⇒ load 期真抛 unknown key',
    bkey.code !== 0 && /unknown key "maxToken"/.test(bkey.stderr),
    `exit=${bkey.code}；stderr 命中行 = ${JSON.stringify((bkey.stderr.split(/\r?\n/).find((l) => l.includes('unknown key')) ?? null))}`)
  const ok = results['anchor-ok']
  judge('J1-c 双锚：合法配置 ⇒ 上述两类错误均不出现（⇒ 抛错来自本判据，不是别处）',
    ok.code === 0 && !/retainRatio|unknown key/.test(ok.stderr),
    `exit=${ok.code} ms=${ok.ms}；stderr 里 retainRatio/unknown-key 命中数 = ${(ok.stderr.match(/retainRatio|unknown key/g) ?? []).length}`)
}

// ── 通用会话跑（J2 ／ J3–J8）──────────────────────────────────────────────
async function runSession({ dir, label, fills, prompts, disableCompact, overlays, watchdogMs = 300_000, window = null, maxTokens = null, nonce = null, probeCfg = [] }) {
  const { home, patchAfter } = makeHome({ arm: label, disableCompact, probe: true })
  const marker = join(dir, `${label}.probe.jsonl`)
  const driverMarker = join(dir, `${label}.driver.jsonl`)
  save(dir, `${label}.cordis.patch.yml`, patchAfter)
  save(dir, `${label}.fills.txt`, JSON.stringify(fills ?? null, null, 2))

  const cfg = [
    '- id: probe-34',
    '  config:',
    `    marker: ${marker.replace(/\\/g, '/')}`,
    ...probeCfg,
  ]
  if (window !== null) {
    // ⚠️ 夹具必须用 **per-model 覆盖**，不能只设 defaultContextWindow：
    //   `dsh-llm-deepseek/lib/index.js:1580` = `configured?.contextWindow ?? connection.defaultContextWindow`，
    //   而 `deepseek-flash` 在 `DEFAULT_MODELS`（:1843）里**自带** `contextWindow = 1e6` ⇒ defaultContextWindow 对它不生效。
    //   该行同时是派发稿 §5 自己给的替代口径（"或该 model 的 contextWindow: 20000"）。
    cfg.unshift(
      '# 夹具：改小**路由模型**的容量（per-model；⚠️ defaultContextWindow 对目录模型无效）',
      '- id: llm-deepseek',
      '  config:',
      '    models:',
      '      - id: deepseek-flash',
      `        contextWindow: ${window}`,
    )
  }
  if (maxTokens !== null) {
    cfg.push('- id: compaction-basic', '  config:', `    maxTokens: ${maxTokens}`)
  }
  const overlayFiles = [makeOverlay(dir, `${label}.overlay.yml`, cfg), ...(overlays ?? [])]

  const driver = new DshDriver({
    profile: 'sdk',
    patches: overlayFiles,
    dshHome: home,
    cwd: REPO,
    marker: driverMarker,
    reverseIdleWarnMs: 2_000,
    shutdownTimeoutMs: 15_000,
    forceAfterMs: 0,
    hooks: {
      onNotification(method, params) {
        if (method === 'session.event') {
          const t = params?.event?.type
          if (typeof t === 'string' && t.startsWith('compaction/')) {
            compactionNotifs.push({ method, type: t, params })
            if (t === 'compaction/end') compactionEnds += 1
          } else if (t === 'turn/end') turnEnds.push(params?.event)
        }
      },
    },
  })
  const compactionNotifs = []
  const turnEnds = []
  let compactionEnds = 0
  const report = { label, home, marker, driverMarker, overlays: overlayFiles, initialize: null, prompts: [], stop: null, childExit: null }
  try {
    report.started = driver.start()
    const init = await driver.initialize()
    report.initialize = { ok: true, elapsedMs: init.elapsedMs, result: init.result }
    const sessionId = `session-34-${label}`
    for (let i = 0; i < prompts.length; i += 1) {
      const before = turnEnds.length
      try {
        const r = await driver.prompt(sessionId, prompts[i], 240_000)
        report.prompts.push({ i, ok: true, messageId: r.messageId })
      } catch (e) {
        report.prompts.push({ i, ok: false, error: `${e?.name}: ${e?.message}` })
      }
      // 等本步结束：`turn/end` **或** `compaction/end` 任一到达即算（`/compact` 不是 turn ⇒ 靠后者）
      const beforeC = compactionEnds
      const t0 = Date.now()
      const waitMs = Number(argOf('--turnWaitMs', '120000'))
      while (turnEnds.length <= before && compactionEnds <= beforeC && Date.now() - t0 < waitMs) await sleep(500)
      report.prompts[report.prompts.length - 1].turnEnds = turnEnds.length - before
      report.prompts[report.prompts.length - 1].waitedMs = Date.now() - t0
    }
    await sleep(1_000)
  } catch (e) {
    report.error = `${e?.name}: ${e?.message}`
  } finally {
    try { report.stop = await driver.stop() } catch (e) { report.stopError = `${e?.name}: ${e?.message}` }
    report.childExit = driver.childExit ?? null
  }
  report.compactionNotifications = compactionNotifs
  report.turnEndCount = turnEnds.length
  report.home = home
  // ⚠️ 临时 home 必须清：一次 `cp -r` 源 profile = **≈157 MB ／ ≈1.9 万文件**（实测），
  //    跑几十臂就会堆出 GB 级垃圾（老大 2026-09-30 明确指出）。证据已全部落 `OUT`，
  //    home 本身只是可再生的拷贝 ⇒ 默认删；要事后翻查就 `S34_KEEP_HOME=1`。
  const keepHome = (process.env.S34_KEEP_HOME ?? '0') === '1'
  if (!keepHome) {
    try { rmSync(home, { recursive: true, force: true }); report.homeRemoved = true } catch (e) { report.homeRemoved = false; report.homeRemoveError = String(e?.message ?? e) }
  } else {
    report.homeRemoved = false
    report.homeKeptBecause = 'S34_KEEP_HOME=1'
  }
  saveJson(dir, `${label}.report.json`, report)
  const probeRows = readJsonl(marker)
  const driverRows = readJsonl(driverMarker)
  return { report, probeRows, driverRows, home, patchAfter }
}

/** 生成 ASCII 填充：`FILL-####` 独占标记 ＋ 定长正文。**字符数精确**＝`tokens*4`（官方启发式 ceil(len/4) ⇒ 恰好 tokens）。 */
function makeFill(tokens, startIdx = 1) {
  const targetChars = tokens * 4
  const parts = []
  let chars = 0
  let i = startIdx
  while (chars < targetChars) {
    const head = `FILL-${String(i).padStart(4, '0')} `
    const body = 'x'.repeat(Math.max(1, Math.min(80, targetChars - chars - head.length - 1)))
    const chunk = head + body
    parts.push(chunk)
    chars += chunk.length + 1 // +1 = 换行
    i += 1
  }
  let text = parts.join('\n')
  // 精确对齐（补/裁到 targetChars；⛔ 不破坏 marker 结构）
  if (text.length > targetChars) text = text.slice(0, targetChars)
  else if (text.length < targetChars) text += '\n' + 'y'.repeat(targetChars - text.length - 1)
  return { text, startIdx, endIdx: i - 1, chars: text.length }
}

// ── J2 · 手动入口「不存在」（L0-A · 0 compaction token，含双锚反向对照）──────
async function armJ2(dir) {
  const base = '只回一句 ok，不要调用工具。'
  const absent = await runSession({ dir, label: 'j2-absent', fills: [], prompts: [base], disableCompact: true, probeCfg: ['    execCompact: true'] })
  const reverse = await runSession({ dir, label: 'j2-reverse', fills: [], prompts: [base], disableCompact: false, probeCfg: ['    execCompact: true'] })

  const typesOf = (res) => res.report.compactionNotifications.map((x) => x.type)
  const hasStart = (res) => typesOf(res).includes('compaction/start')
  const rowOf = (res, ev) => res.probeRows.find((r) => r.event === ev) ?? null
  const cmdAbsent = rowOf(absent, 'commands')
  const cmdReverse = rowOf(reverse, 'commands')
  const execAbsent = rowOf(absent, 'exec-compact')
  const execReverse = rowOf(reverse, 'exec-compact')
  const rawHasCompacted = (res) => existsSync(res.report.marker) && readFileSync(res.report.marker, 'utf8').includes('Compacted ')

  obs('J2-0 ⚠️ 通道限制（必记）：SDK 通道**不派发斜杠命令** ⇒ 判据「真实会话发 /compact」在本通道不可执行',
    '证据：`dsh-sdk-jsonrpc-server/README.md:108` 原文「For each accepted session/prompt, text and durable content references enter one user message **verbatim**」；' +
    '实测两臂的 prompt 文本 /compact 均产生**一轮普通 turn**。⇒ 本臂改用**运行期等价物**：ctx.commands 的**活注册表 list()** ＋ **execute("/compact")** 真链路（⛔ 不靠 --dump-config）')
  obs('J2-1 两臂的 ctx.commands.list() 运行期读数（A 落地面）',
    `absent（A 已落地）hasCompact=${String(cmdAbsent?.hasCompact)} names=${JSON.stringify(cmdAbsent?.names ?? null)}；` +
    `reverse（未禁用）hasCompact=${String(cmdReverse?.hasCompact)} names=${JSON.stringify(cmdReverse?.names ?? null)}；source=${String(cmdAbsent?.source)}/${String(cmdReverse?.source)}`)
  judge('J2-a ⭐ A 落地：禁用后 ⇒ 运行期命令表里**没有 compact**，且 execute("/compact") **不产生 compaction/start**',
    cmdAbsent?.hasCompact === false && hasStart(absent) === false,
    `absent：commands.hasCompact=${String(cmdAbsent?.hasCompact)}；compaction/* = ${JSON.stringify(typesOf(absent))}；exec-compact = ${JSON.stringify(execAbsent ?? null)}`)
  judge('J2-b ⭐ 反向对照（双锚）：未禁用 ⇒ 运行期命令表里**有 `compact`**，执行后出现 `compaction/start` ＋ 反馈文本',
    cmdReverse?.hasCompact === true && hasStart(reverse) === true,
    `reverse：commands.hasCompact=${String(cmdReverse?.hasCompact)}；compaction/* = ${JSON.stringify(typesOf(reverse))}；` +
    `exec-compact = ${JSON.stringify(execReverse ?? null)}；物证里 "Compacted " = ${rawHasCompacted(reverse)}`)
  saveJson(dir, 'J2-verdict.json', {
    absent: { commands: cmdAbsent, exec: execAbsent, events: typesOf(absent), hasStart: hasStart(absent) },
    reverse: { commands: cmdReverse, exec: execReverse, events: typesOf(reverse), hasStart: hasStart(reverse), rawHasCompacted: rawHasCompacted(reverse) },
  })
}

// ── 入口 ───────────────────────────────────────────────────────────────────
async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  if (ARM === 'help' || ARM === '--help') {
    console.log('usage: node run-34-compaction.mjs j1|j2|run [flags]'); process.exit(2)
  }
  if (ARM === 'j1') {
    const dir = join(EVIDENCE, `j1-${stamp}`)
    mkdirSync(dir, { recursive: true })
    saveJson(dir, 'preflight.json', preflight)
    if (!preflight.dshBinExists || !preflight.srcProfileExists) { console.error('前置缺失：dsh bin 或源 profile 不在'); process.exit(2) }
    await armJ1(dir)
  } else if (ARM === 'j2') {
    const dir = join(EVIDENCE, `j2-${stamp}`)
    mkdirSync(dir, { recursive: true })
    saveJson(dir, 'preflight.json', preflight)
    if (!preflight.keyPresent) { console.error('前置缺失：J2 反向对照需要真 key（本臂要求 key 存在）'); process.exit(2) }
    await armJ2(dir)
  } else if (ARM === 'run') {
    const fillsArg = argOf('--fills', null)
    const fillTokens = Number(argOf('--fill', '0'))
    const window = Number(argOf('--window', '20000'))
    const maxTokens = has('--maxTokens') ? Number(argOf('--maxTokens', '0')) : null
    const tailTiny = has('--tinyLast')
    const label = argOf('--label', `run-${fillsArg ?? fillTokens}${maxTokens !== null ? `-mt${maxTokens}` : ''}`)
    const dir = join(EVIDENCE, `${label}-${stamp}`)
    mkdirSync(dir, { recursive: true })
    saveJson(dir, 'preflight.json', preflight)
    if (!preflight.keyPresent) { console.error('前置缺失：本臂需要 key'); process.exit(2) }
    const instr = '只回一句 ok，不要调用工具。'
    const fills = []
    const prompts = []
    let nextIdx = 1
    const specs = fillsArg !== null ? fillsArg.split(',').map((x) => Number(x.trim())) : Array.from({ length: Number(argOf('--turns', '2')) }, () => fillTokens)
    for (let t = 1; t <= specs.length; t += 1) {
      const tk = specs[t - 1]
      if (tk > 0) {
        const f = makeFill(tk, nextIdx)
        nextIdx = f.endIdx + 1
        fills.push({ turn: t, ...f })
        const body = t === 1 && has('--nonce') ? `NONCE-34ALPHA7\n${f.text}\n${instr}` : `${f.text}\n${instr}`
        prompts.push(body)
      } else {
        prompts.push(t === 1 && has('--nonce') ? `NONCE-34ALPHA7 ${instr}` : instr)
      }
    }
    if (tailTiny) prompts.push('ok')
    const res = await runSession({ dir, label, fills, prompts, disableCompact: has('--a'), window, maxTokens })
    console.log(`[34] arm=${label} dir=${dir}`)
    console.log(`[34] compaction/* = ${JSON.stringify(res.report.compactionNotifications.map((x) => x.type))}`)
    console.log(`[34] turnEnd=${res.report.turnEndCount} 探针行=${res.probeRows.length}`)
    const pre = res.probeRows.filter((r) => r.event === 'pre-step').map((r) => r.totalTokens)
    console.log(`[34] pre-step totalTokens 序列 = ${JSON.stringify(pre)}`)
    process.exit(0)
  } else {
    console.error(`未知 arm：${ARM}`); process.exit(2)
  }

  saveJson(EVIDENCE, `summary-${ARM}-${stamp}.json`, { when: stamp, arm: ARM, preflight, findings, counts: { pass: findings.filter((f) => f.status === 'PASS').length, fail: findings.filter((f) => f.status === 'FAIL').length } })
  const failed = findings.filter((f) => f.status === 'FAIL').length
  console.log(`\n[34] arm=${ARM} 结论：${failed === 0 ? '判据成立' : '存在不成立判据'}（PASS ${findings.filter((f) => f.status === 'PASS').length} ／ FAIL ${failed} ／ OBS ${findings.filter((f) => f.status === 'OBS').length}）`)
  process.exit(failed === 0 ? 0 : 1)
}

await main()
