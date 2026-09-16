#!/usr/bin/env node
/**
 * S0 基础链路 e2e **一键复跑**（DSH-3.1）。
 *
 * 用法（在 `harness/` 下，一条命令含全部环境变量）：
 *   DEEPSEEK_API_KEY=<你的 key> \
 *   DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles \
 *   node scripts/run-s0-e2e.mjs                 # 跑 base ＋ 四条负向对照
 *   node scripts/run-s0-e2e.mjs base            # 只跑某一变体
 *
 * 变体：`base`（四项判据必须全绿）｜`no-bundle`｜`wrong-key`｜`no-session-dir`｜`kill-client`（后四条各自期望**特定判据变红**）
 *
 * 🔴 本脚本**不读、不写、不打印 Key**（只判存在性）；Key 由外部环境变量提供并原样透传。
 * ⚠️ 已知坑：真实调用冷跑可达 ~106s、pnpm 装插件后 node 不退出 ⇒ 每个变体给足时限，见 `S0_VARIANT_TIMEOUT_MS`。
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const harnessDir = resolve(import.meta.dirname, '..')
const repoDir = resolve(harnessDir, '..')
const ALL = ['base', 'no-bundle', 'wrong-key', 'no-session-dir', 'kill-client']
const picked = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const variants = picked.length > 0 ? picked : ALL
const unknown = variants.filter((v) => !ALL.includes(v))
if (unknown.length > 0) {
  console.error(`[s0] 未知变体：${unknown.join(', ')}（可选：${ALL.join(' / ')}）`)
  process.exit(2)
}

const env = {
  ...process.env,
  DSH_REAL_API: '1',
  DSH_REAL_API_PROFILE_HOME: process.env.DSH_REAL_API_PROFILE_HOME ?? resolve(homedir(), '.dsh', 'profiles'),
  S0_EVIDENCE_DIR: process.env.S0_EVIDENCE_DIR ?? resolve(repoDir, '.s0-evidence'),
}
mkdirSync(env.S0_EVIDENCE_DIR, { recursive: true })

if (!env.DEEPSEEK_API_KEY) {
  console.warn('[s0] ⚠️ 未检测到 DEEPSEEK_API_KEY（仅判存在性、不读值）——base / 大多数变体会按"失败"报出，这不是环境 bug。')
}
console.log(`[s0] profiles=${env.DSH_REAL_API_PROFILE_HOME}`)
console.log(`[s0] evidence=${env.S0_EVIDENCE_DIR}`)
console.log(`[s0] variants=${variants.join(', ')}\n`)

/** 每个变体给 12 分钟（含 cp -r 真副本 ＋ 装插件 ＋ 真实调用）。 */
const TIMEOUT_MS = Number(process.env.S0_VARIANT_TIMEOUT_MS ?? 12 * 60 * 1000)

const results = []
for (const variant of variants) {
  console.log(`\n===== [s0] variant=${variant} =====`)
  const started = Date.now()
  const child = spawn(
    process.execPath,
    [resolve(harnessDir, 'scripts', 'run-real-api.mjs'), 'tests/s0-e2e.test.ts'],
    { cwd: harnessDir, stdio: 'inherit', env: { ...env, S0_VARIANT: variant } },
  )
  const timer = setTimeout(() => {
    console.warn(`[s0] ⏱ variant=${variant} 超过 ${Math.round(TIMEOUT_MS / 1000)}s，杀进程`)
    child.kill('SIGKILL')
  }, TIMEOUT_MS)
  const code = await new Promise((done) => child.on('exit', (c, s) => done(s ? 124 : (c ?? 1))))
  clearTimeout(timer)
  results.push({ variant, code, seconds: Math.round((Date.now() - started) / 1000) })
  console.log(`===== [s0] variant=${variant} 退出码=${code} 用时=${results.at(-1).seconds}s =====`)
}

console.log('\n[s0] ===== 汇总 =====')
for (const r of results) {
  const expectedBase = r.variant === 'base'
  const status = r.code === 0 ? 'PASS' : 'FAIL'
  const note = expectedBase ? '（期望 PASS）' : '（期望 PASS：负向对照由测试内部断言"该判据变红"）'
  console.log(`[s0]   ${r.variant.padEnd(16)} exit=${r.code} ${status} ${note} ${r.seconds}s`)
}
console.log(`[s0] 证据：${env.S0_EVIDENCE_DIR}/*.evidence.json ＋ *.marker.log ＋ *.session.txt`)
process.exit(results.some((r) => r.code !== 0) ? 1 : 0)
