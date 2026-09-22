#!/usr/bin/env node
/**
 * DSH-3.8.1 · 装置：**驱动宿主**（driver host）—— 一个"用 driver 的应用"的最小切片。
 *
 * 为什么单独一个进程：J3 判的是 **driver 进程的生命周期**（退出码 ／ 从收工信号到退出的墙钟 ／
 * 未依赖 kill ／ 未触发看门狗）。若把 driver 跑在验收脚本自己身上，这两件事就混成一个进程、
 * 判据失去观测面 ⇒ **宿主必须是被观测的独立进程**（它同时充当 `DshDriver` 的"上层"）。
 *
 * ⛔ 本文件**不调用 `process.exit`**：它的退出必须由**事件循环自然排空**产生 —— 这正是 J3 的观测对象。
 *
 * 用法：
 *   node 381-driver-host.mjs --mode real|stub --prompt 0|1 --home <临时home> [--patch <file>]...
 *                            --marker <driver打点> [--answer none|allowed-once|rejected]
 *                            [--waitMs N] [--holdMs N] [--forceAfterMs N]
 * 输出：stdout 打一行 `HOST-REPORT {json}`（验收脚本据此判读）。
 */
import { randomUUID } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DshDriver } from '../packages/dsh-driver/lib/index.js'

const argv = process.argv.slice(2)
const argOf = (name, fallback) => {
  const at = argv.indexOf(name)
  return at >= 0 && at + 1 < argv.length ? argv[at + 1] : fallback
}
const argsOf = (name) => {
  const out = []
  for (let i = 0; i < argv.length; i += 1) if (argv[i] === name && i + 1 < argv.length) out.push(argv[i + 1])
  return out
}

const mode = argOf('--mode', 'stub')
const doPrompt = argOf('--prompt', '0') === '1'
const home = argOf('--home')
const patches = argsOf('--patch')
const marker = argOf('--marker')
const answerWord = argOf('--answer', 'none')
const promptText = argOf('--promptText', '只做这一件事：不要调用任何工具，直接回一句 ok。')
const waitMs = Number(argOf('--waitMs', mode === 'stub' ? 12_000 : 60_000))
const holdMs = Number(argOf('--holdMs', 1_500))
/** ⚠️ DSH-3.8.2 · A1：缺省 `0` ⇒ 现行为**不变**（正式跑不用它；只有 A1 反向对照传 `1500`）。 */
const forceAfterMs = Number(argOf('--forceAfterMs', '0'))
const stubPath = resolve(import.meta.dirname, '381-stub-dsh.mjs')

/**
 * ⭐ **自退的判据级证据**：`beforeExit` 只在**事件循环自然排空**时触发；
 * 官方语义明写「process.exit() 这类**显式终止**不会触发 beforeExit」。
 * ⇒ 本文件**全程不调 process.exit**，若此事件出现，就等于"它自己走掉了"。
 * 报告在 stdout 里打不到这一刻（它发生在打印之后）⇒ 单独落一份文件，由验收脚本在进程退出后读。
 */
const hostExitLog = marker === undefined ? null : `${marker}.host-exit.log`
let beforeExitObserved = false
process.on('beforeExit', (code) => {
  beforeExitObserved = true
  if (hostExitLog === null) return
  try {
    appendFileSync(hostExitLog, `${JSON.stringify({ t: new Date().toISOString(), role: 'driver-host', pid: process.pid, event: 'beforeExit', code, activeResources: process.getActiveResourcesInfo(), note: '事件循环自然排空 ⇒ 未调 process.exit' })}\n`)
  } catch {
    /* ignore */
  }
})
process.on('exit', (code) => {
  if (hostExitLog === null) return
  try {
    appendFileSync(hostExitLog, `${JSON.stringify({ t: new Date().toISOString(), role: 'driver-host', pid: process.pid, event: 'exit', code, beforeExitObserved })}\n`)
  } catch {
    /* ignore */
  }
})

const notifications = []
const diagnostics = []
let reverseEntry = null
let resolveReverse = () => {}
const reverseSeen = new Promise((r) => { resolveReverse = r })

const driver = new DshDriver({
  profile: 'sdk',
  patches,
  dshHome: home,
  cwd: process.cwd(),
  marker,
  reverseIdleWarnMs: 2_000,
  shutdownTimeoutMs: 5_000,
  // ⛔ **恒真的根源**（DSH-3.8.2 · A3）：`forceAfterMs === 0` ⇒ 产品码 `src/index.ts:548` 的
  //    `if (!exited && forceAfterMs > 0)` **分支不可达** ⇒ `stop.forced` ／ `stop.killCalled` **必然为 false**。
  //    ⇒ 正式跑里这两个 `false` **没有判别力**（`J3-c` 已按 A2 降级为 OBS 并显式声明）；
  //    判别力来自 **A1 反向对照**：`--forceAfterMs 1500` ＋ 不理 `shutdown` 的桩（`S381_STUB_IGNORE_SHUTDOWN=1`）
  //    ⇒ 该分支可达 ⇒ 双 `true`（见 `A1-forced.json`）。
  forceAfterMs,
  ...(mode === 'stub' ? { launch: { command: process.execPath, args: [stubPath] } } : {}),
  hooks: {
    onNotification(method, params) {
      if (notifications.length < 200) notifications.push({ method, params })
    },
    onReverseRequest(entry) {
      reverseEntry = entry
      resolveReverse(entry)
    },
    onDiagnostic(line) {
      if (diagnostics.length < 400) diagnostics.push(line)
    },
  },
})

const sessionId = `session-381-${randomUUID().replaceAll('-', '').slice(0, 12)}`
const report = { mode, doPrompt, sessionId, started: null, initialize: null, prompt: null, reverse: null, stop: null }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  report.started = driver.start()
  const init = await driver.initialize()
  report.initialize = { elapsedMs: init.elapsedMs, result: init.result ?? null, frames: init.frames, frameCount: init.frames.length }

  if (doPrompt) {
    try {
      report.prompt = { ok: true, ...(await driver.prompt(sessionId, promptText)) }
    } catch (e) {
      report.prompt = { ok: false, error: `${e?.name}: ${e?.message}` }
    }
    const effectiveWait = report.prompt.ok === false ? Math.min(waitMs, 2_000) : waitMs
    const gotReverse = await Promise.race([reverseSeen.then(() => true), wait(effectiveWait).then(() => false)])
    if (gotReverse && reverseEntry !== null) {
      report.reverse = {
        seen: true,
        frameId: reverseEntry.frameId,
        method: reverseEntry.method,
        requestId: reverseEntry.requestId,
        toolName: reverseEntry.toolName,
        callId: reverseEntry.callId,
        agentId: reverseEntry.agentId,
        reason: reverseEntry.reason,
        receivedAt: reverseEntry.receivedAt,
        answeredByUpperLayer: false,
        answerWord: null,
      }
      if (answerWord !== 'none' && reverseEntry.frameId !== null) {
        report.reverse.answeredByUpperLayer = driver.answer(reverseEntry.frameId, answerWord)
        report.reverse.answerWord = answerWord
      }
      // 留一段"悬置窗口"：未答时它就是"对端等不到答案"的真实时长；已答时够回写落盘
      await wait(holdMs)
    } else {
      report.reverse = { seen: false, note: `等了 ${effectiveWait}ms 没有反向请求到达（prompt.ok=${report.prompt.ok}）` }
    }
  }

  await wait(200)
  report.stop = await driver.stop()
  report.pendingReverseCountAtEnd = driver.pendingReverseCount
  report.childExit = driver.childExit
} catch (e) {
  report.error = `${e?.name}: ${e?.message}`
  try {
    report.stop = await driver.stop()
  } catch (e2) {
    report.stopError = `${e2?.name}: ${e2?.message}`
  }
}

report.notifications = notifications
report.diagnosticsTail = diagnostics.slice(-25)
report.hostProcessExitCalled = false
report.hostExitLog = hostExitLog
process.stdout.write(`HOST-REPORT ${JSON.stringify(report)}\n`)
// ⛔ 不调 process.exit：让事件循环自然排空。退出码只用 exitCode。
process.exitCode = report.error === undefined && report.stop?.forced === false ? 0 : 3
