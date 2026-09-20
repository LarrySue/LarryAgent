#!/usr/bin/env node
/**
 * S0 基础链路 e2e **一键复跑**（DSH-3.1）。
 *
 * 用法（在 `harness/` 下）：
 *   DEEPSEEK_API_KEY=<你的 key> node scripts/run-s0-e2e.mjs        # 跑 base ＋四条负向对照
 *   DEEPSEEK_API_KEY=<你的 key> node scripts/run-s0-e2e.mjs base   # 只跑某一变体
 *   ⚠️ 非本机环境（如 CVM）须**显式传源**：DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles
 *      （默认源 = `<repo>/.dsh-home/profiles`，与测试自身默认同源；源不存在即 exit 2、**不回落**）
 *
 * 变体：`base`（四项判据必须全绿）｜`no-bundle`｜`wrong-key`｜`no-session-dir`｜`kill-client`（后四条各自期望**特定判据变红**）
 *
 * 🔴 本脚本**不读、不写、不打印 Key**（只判存在性）；Key 由外部环境变量提供并原样透传。
 * ⚠️ 已知坑：真实调用冷跑可达 ~106s、pnpm 装插件后 node 不退出 ⇒ 每个变体给足时限，见 `S0_VARIANT_TIMEOUT_MS`。
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
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

/**
 * profile 源目录（2026-09-20 统一，DSH-3.7.4 复验收尾）。
 *
 * ⚠️ 本脚本原默认 `~/.dsh/profiles`，而测试自身默认 `<repo>/.dsh-home/profiles`
 * （`tests/real-api.ts:251`）—— 两处**默认不一致** ⇒ 不带 env 跑会**静默换源**。
 * 且两处源常处于**不同卷** ⇒ pnpm store 亦随之不同（store 按卷回落，见
 * `docs/local-env.md` §12）⇒ 记录出来的 `storeDir` / `virtualStoreDir` 会换值。
 * ⇒ 现统一到**项目口径**（`TODO.md` 贯穿规则：本机手工跑亦显式指 `.dsh-home`、
 *   勿靠默认回落 `~/.dsh`），并在日志里**标明来源**（env / 默认）。
 */
const DEFAULT_PROFILE_HOME = resolve(repoDir, '.dsh-home', 'profiles')
const profileHome = process.env.DSH_REAL_API_PROFILE_HOME ?? DEFAULT_PROFILE_HOME
const profileHomeFrom = process.env.DSH_REAL_API_PROFILE_HOME ? 'env' : '默认'

const env = {
  ...process.env,
  DSH_REAL_API: '1',
  DSH_REAL_API_PROFILE_HOME: profileHome,
  S0_EVIDENCE_DIR: process.env.S0_EVIDENCE_DIR ?? resolve(repoDir, '.s0-evidence'),
}
mkdirSync(env.S0_EVIDENCE_DIR, { recursive: true })

// ---------------------------------------------------------------------------
// 构建前置检查（2026-09-17 补）
//
// `lib/` 是构建产物、被 `harness/.gitignore` 忽略（设计如此）⇒ **干净 clone 后直接复跑会因
// 缺 `lib/index.js` 失败**（CVM 那次能跑，只因现场已 build 过、`lib/` 07:47 生成）。
// 这里**只检查、不自动 build**：自动构建会在被测环境里造副作用，也会与 `package.json` 的
// build 入口形成两套逻辑。缺产物就明确报错（退出码 2），不让它伪装成"测试失败"（1）。
// ⚠️ 入口路径跟着被测包的 `main` 走，不硬编码 lib/index.js。
// ---------------------------------------------------------------------------
{
  const pluginDir = resolve(harnessDir, 'packages', 'plugin-tool-readfile')
  const pkgJson = JSON.parse(readFileSync(resolve(pluginDir, 'package.json'), 'utf8'))
  const entry = resolve(pluginDir, pkgJson.main ?? 'lib/index.js')
  if (!existsSync(entry)) {
    console.error(
      `[s0] ❌ 被测插件缺构建产物：${entry}\n` +
        `[s0]   lib/ 不入库，须先构建（退出码 2 ≠ 测试失败）：\n` +
        `[s0]     cd harness && pnpm --filter "./packages/*" run build\n`,
    )
    process.exit(2)
  }
}

// ---------------------------------------------------------------------------
// profile 源存在性检查（2026-09-20 补）
//
// 源不存在时 pnpm 会**造出一个空壳 profile**，装置看起来"跑过了"（DSH-3.0.5 已实证：
// 空壳 home 与"装过但缺 peer"的 home 在 SDK 握手处**不可分**）⇒ 静默换源 ＋ 空壳 profile
// 会合谋产出**假绿**。这里直接 exit 2，不让它伪装成测试失败（1）。
// ---------------------------------------------------------------------------
{
  const sdkPkg = resolve(profileHome, 'sdk', 'package.json')
  if (!existsSync(sdkPkg)) {
    console.error(
      `[s0] ❌ profile 源不存在：${sdkPkg}\n` +
        `[s0]   默认源 = <repo>/.dsh-home/profiles（本机口径）；其它环境请**显式传**：\n` +
        `[s0]     DSH_REAL_API_PROFILE_HOME=$HOME/.dsh/profiles node scripts/run-s0-e2e.mjs\n`,
    )
    process.exit(2)
  }
}

if (!env.DEEPSEEK_API_KEY) {
  console.warn('[s0] ⚠️ 未检测到 DEEPSEEK_API_KEY（仅判存在性、不读值）——base / 大多数变体会按"失败"报出，这不是环境 bug。')
}
console.log(`[s0] profiles=${profileHome}（来源：${profileHomeFrom}）`)
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
