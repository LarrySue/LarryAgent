#!/usr/bin/env node
/**
 * DSH-3 · 待实测 ① · workspace 运行时行为实测 —— 验收驱动（判据 J1–J6）
 *
 * 权威判据：docs/dsh/dsh-migration.md §3.6（本驱动只做实现，不重定义口径）
 * 两轮：
 *   positive：mount patch（WB 件）+ probe patch ⇒ 探针 ctx.inject 满足 ⇒ J1–J5 正轮
 *   negative：再叠 j6 patch（disable session-persistence-jsonl ⇒ workspace 插件 static inject 缺
 *             sessionPersistence ⇒ fiber pending）⇒ 探针 15s 看门狗落 j6-pending 帧 ⇒ J6 对照读数
 *
 * 场地纪律：
 *   - 源 `.dsh-home` 只读；每轮临时 home = mkdtemp + cpSync(profiles/sdk) + rmSync(.modules.yaml)（381 形态）
 *   - 临时 home 内自建 junction：profiles/node_modules/@deepseek-ai/dsh-workspace → 源共享层同一实体
 *     （w3 实测：dsh-workspace 不在 dsh 安装闭包，heal 不建；junction 指向的字节与源 home 运行时一致）
 *   - 探针插件实体 cpSync 进临时 home 的 profiles/sdk/node_modules/@larryagent/plugin-workspace-probe/
 *   - spawn dsh 的 stdin 保持开放（防 exitOnStdinEnd 早退腰斩探针）；探针跑完自行 process.exit(0)
 *   - DSH_TELEMETRY_DISABLED=1 防遥测外泄
 *
 * 证据：D:\Code\_trae-evidence\wksp\<run>\（env WKSP_EVIDENCE_DIR / WKSP_RUN 可覆盖）
 * 退出码：0 判据全 PASS ／ 1 有 FAIL ／ 2 前置缺失 ／ 124 看门狗
 * ⛔ 本块只判 ①「插件的数据模型行为成立」；②「隔离语义成立」不在靶子内，VERDICT 不外推
 */
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const HARNESS = resolve(import.meta.dirname, '..', '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const SRC_SHARED_WS = join(REPO, '.dsh-home', 'profiles', 'node_modules', '@deepseek-ai', 'dsh-workspace')
const DSH_BIN = join(HARNESS, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const MOUNT_PATCH = join(HARNESS, 'scripts', 'workspace-probe', 'workspace.mount.patch.yml')
const PROBE_SRC = join(HARNESS, 'scripts', 'workspace-probe', 'plugin')
const EVIDENCE = process.env.WKSP_EVIDENCE_DIR ?? join(resolve(REPO, '..'), '_trae-evidence', 'wksp')
const OUT = join(EVIDENCE, process.env.WKSP_RUN ?? 'run1')

const readJsonl = (file) => (existsSync(file)
  ? readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)] } catch { return [] } })
  : [])

// ── 前置 ───────────────────────────────────────────────────────────────────
const preflight = { when: new Date().toISOString(), node: process.version, platform: process.platform, dshBin: DSH_BIN, evidence: OUT }
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'J0-preflight.json'), `${JSON.stringify(preflight, null, 2)}\n`)
for (const [label, p] of [['dsh-bin', DSH_BIN], ['mount-patch', MOUNT_PATCH], ['probe-plugin', PROBE_SRC], ['src-sdk', SRC_SDK], ['src-shared-ws', SRC_SHARED_WS]]) {
  if (!existsSync(p)) {
    console.error(`[wksp] ❌ 前置缺失：${label} 不存在（${p}）退出码 2`)
    process.exit(2)
  }
}

// ── patch 层（驱动生成，落证据目录）─────────────────────────────────────────
const probePatch = join(OUT, 'probe.patch.yml')
writeFileSync(probePatch, `# 探针层（驱动生成）：insert 探针插件行（先例：plugin-sandbox-dialect 挂载形态）\n- insert:\n    - id: workspace-probe\n      name: '@larryagent/plugin-workspace-probe'\n`)
const j6Patch = join(OUT, 'j6-disable-persistence.patch.yml')
writeFileSync(j6Patch, `# J6 负轮层（驱动生成）：摘 sessionPersistence 提供者（该行当前启用 ⇒ 真 disable ⇒ 真改动）\n- id: session-persistence-jsonl\n  disabled: true\n`)

const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, status: ok ? 'PASS' : 'FAIL', detail })
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => {
  findings.push({ judge: id, ok: true, status: 'OBS', detail })
  console.log(`OBS   ${id}  ${detail}`)
}

/** 跑一轮：建临时 home + 装探针 + dump 自检 + spawn dsh + 等退出 + 事后读数 */
function runRound(name, patches) {
  return new Promise((resolvePromise) => {
    // ── 临时 home ──
    const home = mkdtempSync(join(tmpdir(), `larry-wksp-${name}-`))
    mkdirSync(join(home, 'profiles'), { recursive: true })
    cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
    rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
    mkdirSync(join(home, 'profiles', 'node_modules', '@deepseek-ai'), { recursive: true })
    symlinkSync(SRC_SHARED_WS, join(home, 'profiles', 'node_modules', '@deepseek-ai', 'dsh-workspace'), 'junction')
    // ── 探针实体复制（勿 link：先例教训）──
    const probeDst = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-workspace-probe')
    mkdirSync(join(home, 'profiles', 'sdk', 'node_modules', '@larryagent'), { recursive: true })
    cpSync(PROBE_SRC, probeDst, { recursive: true })
    // ── 数据目录 + 结果文件 ──
    const dataDir = join(home, 'data')
    mkdirSync(dataDir, { recursive: true })
    const probeOut = join(OUT, `${name}.probe.jsonl`)
    writeFileSync(probeOut, '')
    writeFileSync(join(OUT, `${name}.home.json`), `${JSON.stringify({ home, probeDst, dataDir, probeOut, patches }, null, 2)}\n`)
    // ── dump-config 装配层自检（无副作用）──
    const dump = spawnSync(process.execPath, [DSH_BIN, '--profile', 'sdk', ...patches.flatMap((p) => ['--patch', p]), '--dump-config'], {
      cwd: REPO, env: { ...process.env, DSH_HOME: home, CI: '1' }, encoding: 'utf8', timeout: 60_000,
    })
    const dumpText = dump.stdout ?? ''
    writeFileSync(join(OUT, `${name}.dumpconfig.txt`), `# rc=${dump.status}\n${dumpText}`)
    // ── spawn dsh（stdin 保持开放：防 exitOnStdinEnd 早退腰斩探针）──
    const t0 = Date.now()
    const child = spawn(process.execPath, [DSH_BIN, '--profile', 'sdk', ...patches.flatMap((p) => ['--patch', p])], {
      cwd: REPO,
      env: { ...process.env, DSH_HOME: home, WKSP_PROBE_OUT: probeOut, WKSP_PROBE_DATA: dataDir, DSH_TELEMETRY_DISABLED: '1', CI: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (c) => { stdout += c })
    child.stderr.on('data', (c) => { stderr += c })
    let watchdogFired = false
    const watchdog = setTimeout(() => {
      watchdogFired = true
      try { child.kill() } catch { /* ignore */ }
    }, 90_000)
    child.once('exit', (code, signal) => {
      clearTimeout(watchdog)
      const ms = Date.now() - t0
      try { child.stdin?.end() } catch { /* ignore */ }
      const storagesDir = join(home, 'storages')
      const sessionsDir = join(home, 'sessions')
      const after = {
        round: name, home, code, signal, ms, watchdogFired,
        dumpRc: dump.status,
        dumpHasProbeRow: dumpText.includes('- id: workspace-probe'),
        dumpHasWorkspaceRow: dumpText.includes('- id: workspace'),
        dumpHasJ6Layer: name === 'negative' ? dumpText.includes('j6-disable-persistence') : null,
        storagesTop: existsSync(storagesDir) ? readdirSync(storagesDir) : null,
        sessionsTop: existsSync(sessionsDir) ? readdirSync(sessionsDir) : null,
      }
      writeFileSync(join(OUT, `${name}.after.json`), `${JSON.stringify(after, null, 2)}\n`)
      writeFileSync(join(OUT, `${name}.stdout.txt`), stdout)
      writeFileSync(join(OUT, `${name}.stderr.txt`), stderr)
      resolvePromise({ ...after, frames: readJsonl(probeOut) })
    })
  })
}

// ── 正轮 ───────────────────────────────────────────────────────────────────
console.log('[wksp] ── positive 轮（mount patch + probe patch）──')
const pos = await runRound('positive', [MOUNT_PATCH, probePatch])

// ── 负轮 ───────────────────────────────────────────────────────────────────
console.log('[wksp] ── negative 轮（+ j6 patch：disable session-persistence-jsonl）──')
const neg = await runRound('negative', [MOUNT_PATCH, probePatch, j6Patch])

// ── 判定 ───────────────────────────────────────────────────────────────────
const posFrames = Object.fromEntries(pos.frames.map((f) => [f.judge, f]))
const negFrames = Object.fromEntries(neg.frames.map((f) => [f.judge, f]))

// 装配层自检（OBS：装配层不是判定层，只是加证）
obs('J0-pos-dump', `dump rc=${pos.dumpRc}，probe 行=${pos.dumpHasProbeRow}，workspace 行=${pos.dumpHasWorkspaceRow}`)
obs('J0-neg-dump', `dump rc=${neg.dumpRc}，j6 层分节=${neg.dumpHasJ6Layer}`)

// J1–J5：唯一判定载体 = 运行时 ctx.workspaceRegistry 实际读数（正轮探针帧）
for (const j of ['J1', 'J2', 'J3', 'J4', 'J5']) {
  const f = posFrames[j]
  if (f === undefined) judge(j, false, '正轮探针帧缺失')
  else judge(j, f.pass === true, f.pass === true ? `${j} 全部断言通过（帧原文见 ${pos.round}.probe.jsonl）` : `${j} 有断言不成立：${JSON.stringify(f)}`)
}

// J6：强制启动依赖（负轮 fail-loud 观测 + 正负对照）
// ⚠️ 首跑实测（run1）：dsh 的真实行为不是「挂着等」——启动期 assertEntriesActivated 把 pending
//    插件转为树级 fail-loud（exit 1 + stderr 逐插件字面 pending 行），比挂起等待更强：拒绝启动、
//    无空历史 bootstrap。探针 15s 看门狗分支保留为兜底形态，判定不依赖它。
{
  const negStderrText = readFileSync(join(OUT, 'negative.stderr.txt'), 'utf8')
  const posStoragesWs = pos.storagesTop?.includes('workspace.json') === true
  const negStoragesWs = neg.storagesTop?.includes('workspace.json') === true
  const wsPendingLiteral = negStderrText.includes('@deepseek-ai/dsh-workspace: pending (waiting for service: sessionPersistence)')
  const failLoudExit = neg.code === 1 && negStderrText.includes('plugin tree failed to load')
  const noJ1InNeg = negFrames.J1 === undefined
  const detail = `负轮 dsh exit=${neg.code}（fail-loud=${failLoudExit}），stderr 字面 workspace pending (waiting for sessionPersistence)=${wsPendingLiteral}；无空历史：负轮 storages 无 workspace.json=${!negStoragesWs}，探针 J1 未跑=${noJ1InNeg}；对照正轮 storages/workspace.json=${posStoragesWs}、J1–J5 registry 实调通过`
  const ok = failLoudExit && wsPendingLiteral && !negStoragesWs && noJ1InNeg && posStoragesWs
  judge('J6', ok, detail)
}

// ── summary ＋ 机读结论行 ─────────────────────────────────────────────────
const verdict = findings.every((f) => f.ok)
const summary = {
  when: new Date().toISOString(),
  rounds: { positive: { home: pos.home, code: pos.code, ms: pos.ms }, negative: { home: neg.home, code: neg.code, ms: neg.ms } },
  findings,
  machineLines: [...findings.map((f) => `${f.judge}=${f.status}`), `VERDICT=${verdict ? 'PASS' : 'FAIL'}`],
  note: '⛔ 本块只判 ①「插件的数据模型行为成立」；②「隔离语义成立」不在靶子内，本 VERDICT 不外推',
}
writeFileSync(join(OUT, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
for (const line of summary.machineLines) console.log(line)
if (neg.watchdogFired || pos.watchdogFired) process.exitCode = 124
else if (!verdict) process.exitCode = 1
else process.exitCode = 0
