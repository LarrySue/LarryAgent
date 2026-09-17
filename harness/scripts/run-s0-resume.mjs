#!/usr/bin/env node
/**
 * DSH-3.2 · 「跨进程 resume 的 id collision 定性」—— **一键复跑**（骨架照 `run-s0-e2e.mjs`，勿另起一套）
 *
 * 用法（在 `harness/` 下，一条命令含全部环境变量）：
 *   DEEPSEEK_API_KEY=<你的 key> \
 *   DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles \
 *   node scripts/run-s0-resume.mjs                 # 跑全部 4 变体
 *   node scripts/run-s0-resume.mjs key             # 只跑某一变体
 *
 * 变体：`forward`（③ 两次新 UUID）｜`reverse`（② 固定 id 跨进程两次）
 *      ｜`key`（④ 框架自产 id 跨进程复用）｜`same-proc`（同进程同 id 连发两次，判别器）
 *
 * 退出码口径（与 3.1 对齐）：`0` 通过 ／ `1` 测试失败 ／ `2` 前置缺失 ／ `124` 看门狗超时
 * 🔴 本脚本**不读、不写、不打印 Key**（只判存在性）；Key 由外部环境变量提供并原样透传。
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const harnessDir = resolve(import.meta.dirname, '..')
const repoDir = resolve(harnessDir, '..')
const ALL = ['forward', 'reverse', 'key', 'same-proc']
const picked = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const variants = picked.length > 0 ? picked : ALL
const unknown = variants.filter((v) => !ALL.includes(v))
if (unknown.length > 0) {
  console.error(`[s0r] 未知变体：${unknown.join(', ')}（可选：${ALL.join(' / ')}）`)
  process.exit(2)
}

// ---------------------------------------------------------------------------
// 构建前置检查（**只检查，不自动 build** —— 缺产物退 2）
//
// 为什么单独这一步：改了 `harness/**` 后忘了 `pnpm --filter "./packages/*" run build`，
// 会拿**旧 lib** 跑出新结论（最难发现的一类假证据）。故宁可退 2 让人先去 build。
// ---------------------------------------------------------------------------
function missingArtifacts() {
  const missing = []
  const clientLib = join(harnessDir, 'node_modules', '@deepseek-ai', 'dsh-sdk-client', 'lib', 'index.js')
  if (!existsSync(clientLib)) missing.push(`sdk-client 构建产物：${clientLib}`)
  const pkgRoot = join(harnessDir, 'packages')
  if (existsSync(pkgRoot)) {
    for (const name of readdirSync(pkgRoot)) {
      const dir = join(pkgRoot, name)
      const hasSrc = existsSync(join(dir, 'src', 'index.ts'))
      const hasLib = existsSync(join(dir, 'lib', 'index.js'))
      if (hasSrc && !hasLib) missing.push(`${name}：有 src 但缺 lib/index.js`)
    }
  }
  return missing
}

const missing = missingArtifacts()
if (missing.length > 0) {
  console.error('[s0r] ⛔ 构建前置未就位（在 harness/ 下 `pnpm --filter "./packages/*" run build` 后再跑）：')
  for (const m of missing) console.error(`[s0r]   - ${m}`)
  process.exit(2)
}

const env = {
  ...process.env,
  DSH_REAL_API: '1',
  DSH_REAL_API_PROFILE_HOME: process.env.DSH_REAL_API_PROFILE_HOME ?? resolve(homedir(), '.dsh', 'profiles'),
  S0_EVIDENCE_DIR: process.env.S0_EVIDENCE_DIR ?? resolve(repoDir, '.s0-resume-evidence'),
}
mkdirSync(env.S0_EVIDENCE_DIR, { recursive: true })

if (!env.DEEPSEEK_API_KEY) {
  console.warn('[s0r] ⚠️ 未检测到 DEEPSEEK_API_KEY（仅判存在性、不读值）——本轮会按"失败"报出，这不是环境 bug。')
}
console.log(`[s0r] profiles=${env.DSH_REAL_API_PROFILE_HOME}`)
console.log(`[s0r] evidence=${env.S0_EVIDENCE_DIR}`)
console.log(`[s0r] variants=${variants.join(', ')}\n`)

/** 每个变体给 12 分钟（含 cp -r 真副本 ＋ 多次真实调用）。 */
const TIMEOUT_MS = Number(process.env.S0_VARIANT_TIMEOUT_MS ?? 12 * 60 * 1000)

const results = []
for (const variant of variants) {
  console.log(`\n===== [s0r] variant=${variant} =====`)
  const started = Date.now()
  const child = spawn(
    process.execPath,
    [resolve(harnessDir, 'scripts', 'run-real-api.mjs'), 'tests/s0-resume.test.ts'],
    { cwd: harnessDir, stdio: 'inherit', env: { ...env, S0_RESUME_VARIANT: variant } },
  )
  const timer = setTimeout(() => {
    console.warn(`[s0r] ⏱ variant=${variant} 超过 ${Math.round(TIMEOUT_MS / 1000)}s，杀进程`)
    child.kill('SIGKILL')
  }, TIMEOUT_MS)
  const code = await new Promise((done) => child.on('exit', (c, s) => done(s ? 124 : (c ?? 1))))
  clearTimeout(timer)
  results.push({ variant, code, seconds: Math.round((Date.now() - started) / 1000) })
  console.log(`===== [s0r] variant=${variant} 退出码=${code} 用时=${results.at(-1).seconds}s =====`)
}

console.log('\n[s0r] ===== 汇总 =====')
for (const r of results) {
  const status = r.code === 0 ? 'PASS' : 'FAIL'
  console.log(`[s0r]   ${r.variant.padEnd(12)} exit=${r.code} ${status} ${r.seconds}s`)
}
console.log(`[s0r] 证据：${env.S0_EVIDENCE_DIR}/*.resume.json`)
process.exit(results.some((r) => r.code !== 0) ? 1 : 0)
