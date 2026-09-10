/**
 * DSH-2.5 ③-修复：真实 cordis 链路验证。
 *
 * 起最小 cordis 应用，分别加载「官方 sandbox provider」与「我们的方言修复插件」，
 * 对同一「写未授权路径」的 argv 调 confine()，用其返回的 denialSignatures
 * spawn 受限进程，再用复刻的 matchesSignature 判定 denied —— 全链路真实，
 * 不经 dsh profile、不调模型。
 *
 * 两个 provider 在同一进程内分两个 Context 先后加载（同名 service 不冲突）。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const HOME = process.env.USERPROFILE
const NM = join(HOME, '.dsh/profiles/node_modules')
const url = p => pathToFileURL(join(NM, p)).href

const { Context } = await import(url('@deepseek-ai/cordis/lib/index.js'))
const OfficialProvider = (await import(url('@deepseek-ai/dsh-sandbox-local/lib/index.js'))).default
const DialectProvider = (await import(url('@larryagent/plugin-sandbox-dialect/index.js'))).default

const ROOT = 'D:\\Code\\sandbox-probe'
const WS = join(ROOT, 'ws')
const TEMP = join(ROOT, 'temp')
const OUTSIDE = join(ROOT, 'outside')
for (const d of [WS, TEMP, OUTSIDE]) mkdirSync(d, { recursive: true })
const outside = join(OUTSIDE, `cordis-${Date.now()}.txt`)

/** 逐字对齐 dsh-pwsh-sandbox/src/helpers.ts 的 matchesSignature。 */
function matchesSignature(exitCode, stderr, signatures) {
  if (exitCode === null || exitCode === 0) return false
  const lowered = stderr.toLowerCase()
  return signatures.some(s => lowered.includes(s.toLowerCase()))
}

const POLICY = { mode: 'workspace-write', workspaceRoot: WS }
const ARGV = [process.execPath, '-e', `require('fs').writeFileSync(process.argv[1],'x')`, outside]

async function runWith(ProviderClass, label) {
  const ctx = new Context()
  let confined
  try {
    const fiber = ctx.plugin(ProviderClass, {})
    await Promise.resolve(fiber)
    await new Promise(r => setTimeout(r, 300)) // 让 provider 完成激活
    confined = ctx.sandbox.confine(ARGV, POLICY)
  } catch (e) {
    return { label, error: String(e?.message ?? e) }
  }
  const exits = confined.argv[0] === process.execPath && confined.argv[1] === process.execPath ? null : undefined
  rmSync(outside, { force: true })
  const r = spawnSync(confined.argv[0], confined.argv.slice(1), { encoding: 'utf8', timeout: 120000 })
  const leaked = existsSync(outside)
  rmSync(outside, { force: true })
  const keyLine = (r.stderr ?? '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .find(l => /permitted|denied|EPERM|拒绝/i.test(l)) ?? ''
  const result = {
    label,
    argv0: confined.argv[0].split('\\').pop(),
    enforcement: confined.enforcement,
    denialSignatures: confined.denialSignatures,
    exitCode: r.status,
    fileLeaked: leaked,
    keyStderrLine: keyLine.slice(0, 160),
    denied: matchesSignature(r.status, r.stderr ?? '', confined.denialSignatures),
  }
  try {
    await ctx.dispose?.()
  } catch {}
  return result
}

const official = await runWith(OfficialProvider, 'official (dsh-sandbox-local)')
const patched = await runWith(DialectProvider, 'patched (@larryagent/plugin-sandbox-dialect)')

console.log(
  JSON.stringify(
    {
      policy: POLICY,
      argvTail: ARGV.slice(1, 2).concat('<outside path>'),
      official,
      patched,
      verdict: {
        officialDenied: official.denied,
        patchedDenied: patched.denied,
        fixWorks: official.denied === false && patched.denied === true,
        extraSignatures: patched.denialSignatures.filter(s => !official.denialSignatures.includes(s)),
      },
    },
    null,
    2,
  ),
)
