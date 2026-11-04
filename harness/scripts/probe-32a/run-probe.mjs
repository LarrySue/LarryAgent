#!/usr/bin/env node
/**
 * ③.2a 运行时可执行性实测 —— 驱动（WB 派发 P-1～P-6）
 *
 * 场地纪律：
 *   - 源 `.dsh-home/profiles/sdk` 只读；临时 home = mkdtemp + cpSync（381 形态）
 *   - 探针插件实体复制进临时 home 的 profiles/sdk/node_modules/@larryagent/plugin-32a-probe
 *   - 走真运行时：SDK 客户端 spawn `dsh --profile sdk`，用 patches 挂探针层，发一条极小 prompt
 *   - 全程守卫真实 home（P-6 之外的兜底）：入口快照 / 出口比对（probe-guard.mjs，root 必填）
 *   - 凭据：由外部通过环境变量 DEEPSEEK_API_KEY 注入，⛔ 本文件不读、不打印、不落盘任何 key
 *
 * 用法：
 *   $env:DEEPSEEK_API_KEY = <从 config 读出到变量，不打印>
 *   node harness/scripts/probe-32a/run-probe.mjs
 *
 * 退出码：0 结论达成（a 或 b 均可）／1 判据不成立／2 前置缺失
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'
import { createHomeGuard } from '../embed-probe/probe-guard.mjs'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const PROBE_SRC = join(HERE, 'plugin')
const STAMP = new Date().toISOString().replace(/[:.]/g, '-')
const EVIDENCE = process.env.P32A_EVIDENCE ?? join(REPO, '_trae-evidence', 'probe-32a', STAMP)
const TEMP_ROOT = mkdtempSync(join(tmpdir(), 'probe-32a-'))

// 守卫：root 必填，且必须在任何 env 改动之前定下真实 home
const REAL_HOME = join(homedir(), '.dsh')
const guard = createHomeGuard({ root: REAL_HOME })

mkdirSync(EVIDENCE, { recursive: true })
const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => {
  findings.push({ judge: id, ok: true, detail })
  console.log(`OBS   ${id}  ${detail}`)
}

if (!existsSync(SRC_SDK) || !existsSync(PROBE_SRC)) {
  console.error('[p32a] ❌ 前置缺失：source sdk profile 或探针插件不存在')
  process.exit(2)
}

// ── 临时 home ＋ 探针实体 ──────────────────────────────────────────────────
const home = mkdtempSync(join(TEMP_ROOT, 'home-'))
mkdirSync(join(home, 'profiles'), { recursive: true })
cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
const probeDst = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-32a-probe')
mkdirSync(join(home, 'profiles', 'sdk', 'node_modules', '@larryagent'), { recursive: true })
cpSync(PROBE_SRC, probeDst, { recursive: true })

const patchPath = join(EVIDENCE, 'probe.patch.yml')
writeFileSync(patchPath, `# 探针层（驱动生成）：insert 探针插件行\n- insert:\n    - id: probe-32a\n      name: '@larryagent/plugin-32a-probe'\n`)
const framesPath = join(EVIDENCE, 'frames.jsonl')
writeFileSync(framesPath, '')

writeFileSync(join(EVIDENCE, 'preflight.json'), `${JSON.stringify({ when: new Date().toISOString(), node: process.version, home, probeDst, patchPath, framesPath, realHome: REAL_HOME }, null, 2)}\n`)

const readFrames = () => (existsSync(framesPath)
  ? readFileSync(framesPath, 'utf8').trim().split('\n').filter(Boolean).flatMap((line) => { try { return [JSON.parse(line)] } catch { return [] } })
  : [])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** 等某帧出现（子 agent 在根轮次 idle 后仍在跑，必须等它落帧再关客户端） */
async function waitForFrame(id, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (readFrames().some((f) => f.judge === id)) return true
    await sleep(500)
  }
  return readFrames().some((f) => f.judge === id)
}

// ── 跑真运行时（SDK 客户端 → dsh --profile sdk ＋ patch）──────────────────
process.env.DSH_HOME = home
process.env.P32A_PROBE_OUT = framesPath
process.env.DSH_TELEMETRY_DISABLED = '1'

const runInfo = { prompt: '只回复一个词：OK', model: 'deepseek-flash', provider: 'deepseek-official', startedAt: null, finishedAt: null, error: null, finalResponse: null, sessionId: null }
let harness = null
try {
  harness = new DeepSeekHarness({
    profile: 'sdk',
    patches: [patchPath],
    provider: 'deepseek-official',
    model: 'deepseek-flash',
    initializeTimeoutMs: 20_000,
  })
  runInfo.startedAt = new Date().toISOString()
  const result = await harness.run(runInfo.prompt)
  runInfo.finishedAt = new Date().toISOString()
  runInfo.finalResponse = result.finalResponse ?? null
  runInfo.sessionId = result.sessionId ?? null
  const interesting = new Set(['turn/start', 'turn/end', 'llm/request', 'llm/response', 'llm/error', 'error', 'agent/status', 'subagent/start', 'subagent/end'])
  runInfo.events = result.events
    .filter((e) => interesting.has(e.type))
    .slice(0, 40)
    .map((e) => ({ type: e.type, data: JSON.stringify(e.data ?? e.payload ?? {}).slice(0, 400) }))
} catch (error) {
  runInfo.error = { name: error?.name ?? null, message: error?.message ?? String(error), stackHead: (error?.stack ?? '').split('\n').slice(0, 8).join('\n') }
}
// ⚠️ 顺序：根轮次 idle ≠ 子 agent 跑完。先等探针落 done 帧，再关闭运行时。
runInfo.childDoneFrame = await waitForFrame('done', process.env.P32A_NO_DELEGATE === '1' ? 8_000 : 120_000)
try { await harness?.close() } catch { /* 关闭失败另记 */ }
writeFileSync(join(EVIDENCE, 'run.json'), `${JSON.stringify(runInfo, null, 2)}\n`)

// ── 收帧 ＋ 判定 ──────────────────────────────────────────────────────────
const frames = readFrames()
const byJudge = (id) => frames.find((f) => f.judge === id)

const p1 = byJudge('P-1')
const p2Frames = frames.filter((f) => f.judge === 'P-2')
const p2Agent = p2Frames.find((f) => f.initiator?.kind === 'agent')
const providersAtEvent = p2Frames.length > 0 ? p2Frames[p2Frames.length - 1].providers : null
if (p1 === undefined) judge('P-1', false, '注入帧缺失（ctx.inject([agents,subagents]) 未满足）')
else judge('P-1', p1.agentsVisible === true && p1.subagentsVisible === true && Array.isArray(providersAtEvent) && providersAtEvent.length > 0,
  `注入时机 agents=${p1.agentsVisible}、subagents=${p1.subagentsVisible}、providers=${JSON.stringify(p1.providers)}；事件时机 providers=${JSON.stringify(providersAtEvent)}`)

const p2Kind = p2Agent !== undefined ? 'agent' : (p2Frames[0]?.initiator?.kind ?? 'missing')
if (p2Frames.length === 0) judge('P-2', false, 'session/event 帧缺失（未发生会话事件）')
else {
  const eventTypes = p2Frames.map((f) => `${f.seq}:${f.eventType}:${f.initiator?.kind}`)
  obs('P-2', `事件序列（序:类型:initiator）=${eventTypes.join(' | ')}；含 agent 的事件=${p2Agent?.eventType ?? '无'}`)
  if (p2Agent !== undefined) obs('P-2-agent', `agent 读数原文=${JSON.stringify(p2Agent.initiator)}`)
}

const p3 = byJudge('P-3')
const p4 = byJudge('P-4')
const aPath = p2Kind === 'agent'
if (aPath) {
  judge('P-3', p3?.ok === true, `provider=${p3?.provider ?? 'n/a'}；childId=${p3?.childId ?? 'n/a'}；error=${JSON.stringify(p3?.error ?? null)}`)
  judge('P-4', typeof p4?.text === 'string' && p4.text.length > 0 && p4?.error === undefined,
    `stopReason=${p4?.stopReason ?? 'n/a'}；text=${JSON.stringify(p4?.text ?? null)}；diagnostic=${JSON.stringify(p4?.diagnostic ?? null)}；error=${JSON.stringify(p4?.error ?? null)}`)
} else {
  obs('P-3', `未闭合：session/event 里拿不到 initiator（kind=${p2Kind}）⇒ 本臂不可执行，不发生子 agent 调用`)
  obs('P-4', `未闭合：同上`)
}

const p5t = byJudge('P-5-timer')
const p5i = byJudge('P-5-inject-ctx')
if (p5t === undefined) judge('P-5', false, 'P-5 timer 帧缺失')
else judge('P-5', p5t.currentInitiator?.kind !== 'agent',
  `setTimeout 内 currentInitiator=${JSON.stringify(p5t.currentInitiator)}；requireInitiator=${JSON.stringify(p5t.requireInitiator)}；注入回调内 initiator=${JSON.stringify(p5i?.initiator ?? null)}`)

const guardResult = guard.verify()
writeFileSync(join(EVIDENCE, 'guard-real-home.json'), `${JSON.stringify(guardResult, null, 2)}\n`)
judge('guard-real-home-untouched', guardResult.ok, `真实 home=${guardResult.root}；跑前跑后一致=${guardResult.ok}；差异=${JSON.stringify(guardResult.diffs)}`)

const conclusion = aPath
  ? '(a) 可行：插件在 session/event 里拿到 parent Agent 并可起 subagent 取回文本'
  : '(b) 不可行：插件在 session/event 里拿不到 initiator ⇒ 生成路径应走 (b)'
const summary = { when: new Date().toISOString(), conclusion, p2Kind, run: runInfo, findings, evidence: EVIDENCE }
writeFileSync(join(EVIDENCE, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)

console.log(`\n结论：${conclusion}`)
console.log(`证据：${EVIDENCE}`)
const failed = findings.filter((f) => !f.ok)
if (runInfo.error !== null) {
  console.error(`[p32a] 运行时错误：${runInfo.error.name}: ${runInfo.error.message}`)
}
process.exit(failed.length === 0 ? 0 : 1)
