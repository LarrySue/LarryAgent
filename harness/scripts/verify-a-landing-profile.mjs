#!/usr/bin/env node
/**
 * DSH-3.4 · **A 落地「生产 profile」专项验收**（WB 2026-09-30 补）
 *
 * 为什么另起装置：现有 `run-34-compaction.mjs j2` 的两臂都是**装置自己 append**
 * 禁用行（`disableCompact: true/false`）⇒ 验的是"append 生效"，
 * ⛔ **不覆盖**「禁用行已落到源 profile 后、本体是否真的生效」。
 * 本脚本 = `disableCompact: false`（**不 append 任何东西**），完全依赖
 * `.dsh-home/profiles/sdk/cordis.patch.yml` 里已落的那 2 行。
 *
 * 判据（与文件头验收法同源）：
 *   PASS-A  运行期命令表**无** compact（`ctx.commands.list()`，source=live）
 *   PASS-B  反向对照：临时把禁用行摘掉 ⇒ 命令表**有** compact（证明读数能区分）
 *   ⛔ 不采信 `--dump-config` 单独作判（只组树、不激活插件）—— 仅作 OBS。
 *
 * 用法：node harness/scripts/verify-a-landing-profile.mjs
 * 退出码：0 通过 / 1 判据失败 / 2 前置缺失
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
const PROBE_SRC = join(HARNESS, 'packages', 'plugin-34-probe')
const EVIDENCE = process.env.S34A_EVIDENCE_DIR ?? join(REPO, '.s34a-evidence')

const findings = []
const judge = (id, ok, detail, status = ok ? 'PASS' : 'FAIL') => {
  findings.push({ judge: id, ok, status, detail })
  console.log(`${status.padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => judge(id, true, detail, 'OBS')
const relax = (ms) => new Promise((r) => setTimeout(r, ms))
const readJsonl = (f) => (existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)] } catch { return [] } }) : [])

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const DIR = join(EVIDENCE, `a-${stamp}`)
mkdirSync(DIR, { recursive: true })

/**
 * 建临时 home。`stripDisable=true` ⇒ **从副本里摘掉**禁用行（反向对照臂）。
 * ⛔ 源 profile 只读、绝不就地改。
 */
function makeHome({ label, stripDisable = false }) {
  const home = mkdtempSync(join(tmpdir(), 'larry-34a-'))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
  rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
  rmSync(join(home, 'profiles', 'sdk', 'cordis.patch.yml.bak-wb-20260930-100255'), { force: true })
  // 探针实体复制
  const dst = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-34-probe')
  mkdirSync(dst, { recursive: true })
  for (const f of ['package.json', 'cordis.patch.yml']) cpSync(join(PROBE_SRC, f), join(dst, f))
  cpSync(join(PROBE_SRC, 'lib'), join(dst, 'lib'), { recursive: true })

  const patchFile = join(home, 'profiles', 'sdk', 'cordis.patch.yml')
  let text = readFileSync(patchFile, 'utf8')
  const hadDisable = /- id: command-compact/.test(text)
  if (stripDisable) {
    // 摘掉 command-compact 条目块（该行 + 紧随的 disabled 行 + 前置的注释段）
    text = text.replace(/\n# DSH-3\.4 · A 裁定落地件[\s\S]*?- id: command-compact\n  disabled: true\n/, '\n')
  }
  // ⚠️ 探针必须**挂载**才加载：光复制目录不够 —— profile 的 patch 里要有一条 insert 指向它
  //    （装置 `run-34-compaction.mjs:88` 同款；漏了这步 = 探针静默不加载、marker 文件不生成）。
  text += '\n# DSH-3.4 装置：进程内探针（口径④ 断言位置 = deriveMessages()）\n- insert:\n    - id: probe-34\n      name: \'@larryagent/plugin-34-probe\'\n'
  writeFileSync(patchFile, text, 'utf8')
  return { home, patchFile, hadDisable, patchAfter: readFileSync(patchFile, 'utf8') }
}

async function runSession({ label, stripDisable = false }) {
  const { home, hadDisable, patchAfter } = makeHome({ label, stripDisable })
  writeFileSync(join(DIR, `${label}.cordis.patch.yml`), patchAfter, 'utf8')
  const marker = join(DIR, `${label}.probe.jsonl`)
  const driverMarker = join(DIR, `${label}.driver.jsonl`)
  const overlay = join(DIR, `${label}.overlay.yml`)
  writeFileSync(overlay, ['- id: probe-34', '  config:', `    marker: ${marker.replace(/\\/g, '/')}`].join('\n') + '\n', 'utf8')

  const driver = new DshDriver({
    profile: 'sdk', patches: [overlay], dshHome: home, cwd: REPO, marker: driverMarker,
    initializeTimeoutMs: 120_000, requestTimeoutMs: 240_000,
    shutdownTimeoutMs: 15_000, forceAfterMs: 0, reverseIdleWarnMs: 2_000,
  })
  const report = { label, hadDisable, stripDisable, home, prompts: [], stop: null }
  try {
    report.started = driver.start()
    const init = await driver.initialize()
    report.initializeOk = true
    report.envKeyPresent = report.started?.envKeyPresent ?? null
    try {
      const r = await driver.prompt(`session-34a-${label}`, '只回一句 ok，不要调用工具。', 240_000)
      report.prompts.push({ ok: true, messageId: r?.messageId ?? null })
    } catch (e) {
      report.prompts.push({ ok: false, error: `${e?.name}: ${e?.message}` })
    }
    // 等 agent 回到 idle（命令表读数依赖 agent/status:idle）
    const t0 = Date.now()
    while (Date.now() - t0 < 60_000) {
      const rows = readJsonl(marker)
      if (rows.some((r) => r.event === 'commands')) break
      await relax(500)
    }
    await relax(1_000)
  } catch (e) {
    report.error = `${e?.name}: ${e?.message}`
  } finally {
    try { report.stop = await driver.stop() } catch (e) { report.stopError = `${e?.name}: ${e?.message}` }
    report.childExit = driver.childExit ?? null
  }
  const probeRows = readJsonl(marker)
  report.compactionEvents = compactionTypes(probeRows)
  writeFileSync(join(DIR, `${label}.report.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return { report, probeRows, home }
}

function cmdRow(probeRows) {
  return probeRows.find((r) => r.event === 'commands') ?? null
}
/** ⚠️ 口径取自探针实读：compaction 事件落成 `{ event: 'compaction-event', type }`（`index.ts:180`）。 */
function compactionTypes(probeRows) {
  return probeRows.filter((r) => r.event === 'compaction-event').map((r) => r.type)
}

// ── 前置 ────────────────────────────────────────────────────────────────────
const pre = {
  when: new Date().toISOString(), node: process.version, platform: process.platform,
  dshBin: DSH_BIN, dshBinExists: existsSync(DSH_BIN),
  srcProfile: SRC_SDK, srcProfileExists: existsSync(SRC_SDK),
  keyPresent: Boolean(process.env.DEEPSEEK_API_KEY),
}
writeFileSync(join(DIR, 'preflight.json'), `${JSON.stringify(pre, null, 2)}\n`, 'utf8')
console.log(`preflight: dshBin=${pre.dshBinExists} srcProfile=${pre.srcProfileExists} keyPresent=${pre.keyPresent}`)
if (!pre.dshBinExists || !pre.srcProfileExists) { console.error('前置缺失：dsh bin 或源 profile 不在'); process.exit(2) }

// ── OBS：dump-config（只组树，不作判据） ────────────────────────────────────
{
  const r = spawnSync(process.execPath, [DSH_BIN, '--profile', 'sdk', '--dump-config'], {
    cwd: REPO, env: { ...process.env, DSH_HOME: join(REPO, '.dsh-home'), CI: '1' }, encoding: 'utf8', timeout: 120_000,
  })
  const hit = (r.stdout ?? '').split(/\r?\n/).findIndex((l) => l.includes('command-compact'))
  const after = hit >= 0 ? (r.stdout ?? '').split(/\r?\n/).slice(hit, hit + 3) : []
  obs('OBS-0 --dump-config（⛔ 不作判据，只组树）：command-compact 行保留且带 disabled',
    `exit=${r.status}；命中行 = ${JSON.stringify(after)}`)
}

// ── 主臂：完全依赖源 profile 的落地行（不 append） ──────────────────────────
const main = await runSession({ label: 'a-main', stripDisable: false })
const cmdMain = cmdRow(main.probeRows)
const compMain = compactionTypes(main.probeRows)
const hadDisableMain = main.report.hadDisable
console.log(`main: hadDisable=${hadDisableMain} cmdRow=${JSON.stringify(cmdMain)} compaction=${JSON.stringify(compMain)}`)

judge('A-1 源 profile 里确含禁用行（前置成立）', hadDisableMain === true, `副本 patch 含 "- id: command-compact" = ${String(hadDisableMain)}`)
judge('A-2 ⭐ 落地生效：运行期命令表**无** compact（source=live）',
  cmdMain?.source === 'live' && cmdMain?.hasCompact === false,
  `commands = ${JSON.stringify(cmdMain ?? null)}`)
obs('A-3 本臂 compaction/* 事件（应为空 ⇒ 入口确实不存在）', `compaction/* = ${JSON.stringify(compMain)}`)
obs('A-4 会话细节', `initializeOk=${String(main.report.initializeOk)} prompts=${JSON.stringify(main.report.prompts)} stop.forced=${String(main.report.stop?.forced)}`)

// ── 反向对照臂：从副本里摘掉禁用行 ⇒ 命令表**应有** compact ─────────────────
const rev = await runSession({ label: 'b-reverse', stripDisable: true })
const cmdRev = cmdRow(rev.probeRows)
const compRev = compactionTypes(rev.probeRows)
console.log(`rev: hadDisable=${rev.report.hadDisable} cmdRow=${JSON.stringify(cmdRev)} compaction=${JSON.stringify(compRev)}`)

judge('B-1 ⭐ 反向对照：摘掉禁用行 ⇒ 运行期命令表**有** compact（⇒ A-2 的读数能区分，不是恒假）',
  cmdRev?.source === 'live' && cmdRev?.hasCompact === true,
  `commands = ${JSON.stringify(cmdRev ?? null)}；compaction/* = ${JSON.stringify(compRev)}`)

// ── 结论 ────────────────────────────────────────────────────────────────────
const allOk = findings.filter((f) => f.status === 'FAIL').length === 0
writeFileSync(join(DIR, 'findings.json'), `${JSON.stringify(findings, null, 2)}\n`, 'utf8')
console.log(`\n=== ${allOk ? 'ALL PASS' : 'HAS FAILURE'} ===  evidence: ${DIR}`)
process.exit(allOk ? 0 : 1)
