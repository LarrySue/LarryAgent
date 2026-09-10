#!/usr/bin/env node
/**
 * 真实调用测试入口（等价 Python 侧 `pytest --real-api` 的分层开关）
 *
 * 为什么要有这个脚本：开关必须走环境变量，而跨 shell（bash/cmd/powershell）
 * 设置环境变量的写法不一致，容易"以为开了其实没开"→ 真实调用组静默 SKIP，
 * 却被当成"跑过了"。这里统一在脚本内设 DSH_REAL_API=1，跨 shell 一致。
 *
 * 🔴 本脚本**不读、不写、不打印 Key**：
 * - Key 由外部环境变量提供，原样透传给子进程（子进程自己会在 SDK 层用它）
 * - 仅做"在不在"的布尔判断并提示，绝不打印值/长度/片段
 *
 * 用法（在 harness/ 下）：
 *   npm run test:real-api                                  # 机制自检 + 真实调用组
 *   npm run test:real-api:sentinel-r1                      # R1 反向哨兵（预期 FAIL）
 *   npm run test:real-api:sentinel-r3                      # R3 残留告警哨兵（预期 PASS + stderr 告警）
 *   node scripts/run-real-api.mjs tests/real-api.test.ts -t R1   # 额外参数透传 vitest
 */
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, writeSync } from 'node:fs'
import { resolve } from 'node:path'

const harnessDir = resolve(import.meta.dirname, '..')
const vitestEntry = resolve(harnessDir, 'node_modules/vitest/vitest.mjs')
if (!existsSync(vitestEntry)) {
  console.error(`[run-real-api] 找不到 vitest 入口：${vitestEntry}（先在 harness/ 下装依赖）`)
  process.exit(2)
}

// `--real-api` 只是与 Python 侧命名对齐的显式标志，本脚本一律设开关；已知则剥掉
const passthrough = process.argv.slice(2).filter((a) => a !== '--real-api')
const targets = passthrough.length > 0 ? passthrough : ['tests/real-api.test.ts']

const env = { ...process.env, DSH_REAL_API: '1' }
if (!env.DEEPSEEK_API_KEY) {
  console.warn(
    '[run-real-api] ⚠️ 未检测到 DEEPSEEK_API_KEY（仅检查存在性，不读值）。\n' +
      '  机制自检与 R1 哨兵（错误 Key）不受影响；「有效 Key 绿用例」会显式失败（不是 skip）。'
  )
}
console.log(`[run-real-api] 开关 DSH_REAL_API=1；目标：${targets.join(' ')}`)

const child = spawn(process.execPath, [vitestEntry, 'run', ...targets], {
  cwd: harnessDir,
  stdio: 'inherit',
  env,
})

// ---------------------------------------------------------------------------
// 墙钟看门狗（2026-09-10 老大裁决：默认 20 分钟）
//
// 为什么要有（与 tests/global-setup.ts 的退出安全网是**两层**，别混）：
// - global-setup 那层在 teardown 里布防，只覆盖「测试已完成、主进程被句柄拖住」；
// - 若挂起发生在 **worker/进程池**层，teardown 根本到不了、那层网没机会布防
//   （WB 复验遇到的就是这一类：跑完 summary 后进程不退出，CI 永远拿不到退出码）。
// 本层是入口脚本的兜底：整跑超过时限 → 杀 vitest 进程树 + 打诊断 + 非零退出。
//
// 超时 ≠ 测试失败：这里报的是"这次跑压根没跑完"，不是判红被测对象。
// 退出码用 **124**（timeout(1) 的惯例码）：与"测试失败(1)"区分开，CI 一眼能辨。
//
// 验证方式（一次性探针，勿常驻——常驻会让整套测试挂满时限）：
//   临时写一个 `it('hang', () => new Promise(() => {}), 10 * 60_000)` 的测试文件，
//   `LARRY_REAL_API_WATCHDOG_MS=20000 node scripts/run-real-api.mjs <该文件>`
//   → 预期 20s 后 WATCHDOG 告警 + 进程树诊断 + 退出码 124。
// ---------------------------------------------------------------------------
const WATCHDOG_MS_ENV = 'LARRY_REAL_API_WATCHDOG_MS'
const DEFAULT_WATCHDOG_MS = 20 * 60 * 1000
/** 0 或非法值 → 用默认；显式关闭用 `off` */
function watchdogMs() {
  const raw = process.env[WATCHDOG_MS_ENV]
  if (raw === undefined) return DEFAULT_WATCHDOG_MS
  if (/^off$/i.test(raw.trim())) return 0
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_WATCHDOG_MS
}

/** 触发时的诊断：先取证（进程树）再杀——杀完就没得看了 */
function watchdogDiagnostics() {
  const lines = []
  try {
    const ps =
      "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -or $_.Name -eq 'dsh.exe' } | " +
      'ForEach-Object { $c = $_.CommandLine; if ($c.Length -gt 110) { $c = $c.Substring(0, 110) }; ' +
      '"{0}|parent={1}|{2}" -f $_.ProcessId, $_.ParentProcessId, $c }'
    lines.push(`node/dsh 进程:\n${execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf-8', timeout: 20_000 }).trim()}`)
  } catch (e) {
    lines.push(`进程树读取失败: ${e}`)
  }
  return lines.join('\n')
}

/** 杀 vitest 进程树（Windows 用 taskkill /T；POSIX 退化为杀直接子进程） */
function killVitestTree(pid) {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
    else child.kill('SIGKILL')
    return '已杀进程树'
  } catch (e) {
    return `杀进程树失败（人工排查）: ${e}`
  }
}

const ms = watchdogMs()
if (ms > 0) {
  const startedAt = Date.now()
  const watchdog = setTimeout(() => {
    const elapsedS = Math.round((Date.now() - startedAt) / 1000)
    // 同步写 fd 2：下面立刻 process.exit，普通 console 写可能被截断
    writeSync(
      2,
      `[run-real-api] ⚠️ WATCHDOG FIRED: 整跑超过 ${Math.round(ms / 1000)}s（实际 ${elapsedS}s）仍未结束（当前共 ${elapsedS}s）。\n` +
        `[run-real-api]   这不是"测试失败"，是"这次跑没走完"；按 124 退出（与测试失败的 1 区分）。\n` +
        `[run-real-api]   目标: ${targets.join(' ')}\n` +
        `[run-real-api]   ${watchdogDiagnostics().replace(/\n/g, '\n[run-real-api]   ')}\n` +
        `[run-real-api]   ${killVitestTree(child.pid)}\n`
    )
    process.exit(124)
  }, ms)
  watchdog.unref()
  child.on('exit', () => clearTimeout(watchdog))
}

child.on('error', (e) => {
  console.error(`[run-real-api] 启动 vitest 失败：${e}`)
  process.exit(2)
})
child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[run-real-api] vitest 被信号终止：${signal}`)
    process.exit(1)
  }
  console.log(`[run-real-api] vitest 退出码 ${code}`)
  process.exit(code ?? 1)
})
