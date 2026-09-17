#!/usr/bin/env node
/**
 * 桥接件：把「凭据文件里的 Key」接到「只认环境变量的 real-api 装置」上（复跑方便）。
 *
 * 为什么需要：`tests/isolated-setup.ts` 会把 `DSH_HOME` 强制覆盖成临时目录 ⇒ real-api 链路
 * **读不到** `$DSH_HOME/.credentials.yaml`，Key 只能来自环境变量；而人在 CVM 上通常只有文件。
 *
 * 🔴 纪律：本脚本**不打印 Key 值**（只打印"取到了 + 长度"）；Key 只进子进程 env，不落盘。
 * 🔴 仍然禁止把 Key 写进任何文件 —— 本脚本只是"文件 → 环境变量"的一次性桥。
 *
 * 用法（harness/ 下）：
 *   DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles node scripts/s0-run-with-file-key.mjs [variant...]
 * 覆盖凭据文件位置：`S0_CREDS=/path/to/.credentials.yaml`
 * 换目标 runner（默认 `run-s0-e2e.mjs`）：`S0_TARGET_RUNNER=run-s0-resume.mjs`（3.2 用）
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const harnessDir = resolve(import.meta.dirname, '..')
const creds = process.env.S0_CREDS ?? join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), '.credentials.yaml')
if (!existsSync(creds)) {
  console.error(`[s0-key] 凭据文件不存在：${creds}（用 S0_CREDS=… 指定）`)
  process.exit(2)
}
const matched = readFileSync(creds, 'utf8').match(/DEEPSEEK_API_KEY\s*:\s*["']?([^"'\s]+)["']?/)
if (matched === null || matched[1] === undefined || matched[1] === '') {
  console.error('[s0-key] 凭据文件里没有 DEEPSEEK_API_KEY 记录（或值为空）——本机常见，CVM 才有')
  process.exit(2)
}
const key = matched[1]
console.log(`[s0-key] 取自 ${creds}：长度 ${key.length}（值不打印）；以 env 注入子进程`)

const targetRunner = process.env.S0_TARGET_RUNNER ?? 'run-s0-e2e.mjs'
const child = spawn(process.execPath, [join(harnessDir, 'scripts', targetRunner), ...process.argv.slice(2)], {
  cwd: harnessDir,
  stdio: 'inherit',
  env: { ...process.env, DEEPSEEK_API_KEY: key },
})
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 1)))
