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
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
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
