/**
 * DSH-2.5 ③-修复 验收探针 v2（本机 Windows）。
 *
 * 对 node / cmd / powershell 三个子进程，各做「正反两组」：
 *   反（无沙箱）：同一命令直接 spawn 写未授权目标 → 应成功（证明命令本身有效）
 *   正（沙箱内）：经 runner 写同一未授权目标 → 应失败且文件不出现
 * 再用真实 stderr + 复刻的 matchesSignature（逐字对齐 dsh-pwsh-sandbox/src/helpers.ts）
 * 对「官方签名集」与「官方+补丁签名集」做 denied 对照。
 * 另含沙箱行为三链（A1/A2/A3）与反向哨兵（runner 故障 / 一般失败 / 正向对照）。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const HOME = process.env.USERPROFILE
const RUNNER = join(HOME, '.dsh/profiles/node_modules/@deepseek-ai/dsh-sandbox-windows-acl/lib/runner.js')
const NODE = process.execPath
const CMD = 'C:\\Windows\\System32\\cmd.exe'
const PWSH = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

const ROOT = 'D:\\Code\\sandbox-probe'
const WS = join(ROOT, 'ws')
const TEMP = join(ROOT, 'temp')
const OUTSIDE = join(ROOT, 'outside')
for (const d of [WS, TEMP, OUTSIDE]) mkdirSync(d, { recursive: true })

const stamp = Date.now()
const inside = join(WS, `inside-${stamp}.txt`)
const outside = join(OUTSIDE, `denied-${stamp}.txt`)

/** 逐字对齐 @deepseek-ai/dsh-pwsh-sandbox/src/helpers.ts 的 matchesSignature。 */
function matchesSignature(exitCode, stderr, signatures) {
  if (exitCode === null || exitCode === 0) return false
  const lowered = stderr.toLowerCase()
  return signatures.some(s => lowered.includes(s.toLowerCase()))
}
function whichSignature(exitCode, stderr, signatures) {
  if (exitCode === null || exitCode === 0) return null
  const lowered = stderr.toLowerCase()
  return signatures.find(s => lowered.includes(s.toLowerCase())) ?? null
}

const OFFICIAL = ['access is denied', 'access to the path', 'permission denied']
const PATCHED = [...OFFICIAL, 'operation not permitted', '拒绝访问', '访问被拒绝']

/** 取 stderr 里含拒绝/错误关键字的行（否则取非空末行）。 */
function keyLine(stderr) {
  const lines = stderr.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const hit = lines.find(l => /denied|permission|permitted|deny|拒绝|EPERM|EACCES/i.test(l))
  return (hit ?? lines[lines.length - 1] ?? '').slice(0, 180)
}

function direct(argv) {
  const r = spawnSync(argv[0], argv.slice(1), { encoding: 'utf8', timeout: 60000 })
  return { exitCode: r.status, stderr: r.stderr ?? '' }
}
function confined(argv) {
  const r = spawnSync(
    process.execPath,
    [RUNNER, '--workspace', WS, '--temp', TEMP, '--mode', 'workspace-write', '--', ...argv],
    { encoding: 'utf8', timeout: 120000 },
  )
  return { exitCode: r.status, stderr: r.stderr ?? '' }
}

// 「写未授权目标」的三种子进程命令（不用 shell 重定向符号，避免解析歧义）
const CASES = [
  { name: 'node', argv: t => [NODE, '-e', `require('fs').writeFileSync(process.argv[1],'x')`, t] },
  { name: 'cmd', argv: t => [CMD, '/c', 'copy', 'NUL', t] },
  { name: 'powershell', argv: t => [PWSH, '-NoProfile', '-Command', `Set-Content -LiteralPath '${t}' -Value hi`] },
]

const out = { platform: process.platform, runner: RUNNER, dirs: { WS, TEMP, OUTSIDE } }

// ---- A1: 无沙箱写未授权 → 成功 ----
{
  rmSync(outside, { force: true })
  const r = direct([NODE, '-e', `require('fs').writeFileSync(process.argv[1],'x')`, outside])
  out.A1_noSandbox_writeOutside = { exitCode: r.exitCode, fileExists: existsSync(outside) }
  rmSync(outside, { force: true })
}
// ---- A2: 沙箱内写授权（workspace 内）→ 成功 ----
{
  rmSync(inside, { force: true })
  const r = confined([NODE, '-e', `require('fs').writeFileSync(process.argv[1],'x')`, inside])
  out.A2_sandboxed_writeInside = { exitCode: r.exitCode, fileExists: existsSync(inside) }
  rmSync(inside, { force: true })
}

// ---- B: 三子进程 正反两组 + denied 对照 ----
out.B_subprocessDenials = {}
for (const c of CASES) {
  // 反：无沙箱写未授权（证明命令本身有效）
  rmSync(outside, { force: true })
  const d = direct(c.argv(outside))
  const directWrote = existsSync(outside)
  rmSync(outside, { force: true })

  // 正：沙箱内写未授权
  const s = confined(c.argv(outside))
  const leaked = existsSync(outside)
  rmSync(outside, { force: true })

  out.B_subprocessDenials[c.name] = {
    direct_noSandbox: { exitCode: d.exitCode, fileExists: directWrote },
    confined: {
      exitCode: s.exitCode,
      fileLeaked: leaked,
      denied_official: matchesSignature(s.exitCode, s.stderr, OFFICIAL),
      denied_patched: matchesSignature(s.exitCode, s.stderr, PATCHED),
      matchedOfficial: whichSignature(s.exitCode, s.stderr, OFFICIAL),
      matchedPatched: whichSignature(s.exitCode, s.stderr, PATCHED),
      keyStderrLine: keyLine(s.stderr),
    },
  }
}

// ---- A3: 沙箱内写未授权 → 失败且文件不出现（逐子进程已含，此处汇总判据）----
out.A3_summary = Object.fromEntries(
  Object.entries(out.B_subprocessDenials).map(([k, v]) => [k, { failedAndAbsent: v.confined.exitCode !== 0 && !v.confined.fileLeaked }]),
)

// ---- C1 反向哨兵：runner 故障不得判 denied ----
{
  const stderr = 'windows-acl-run: CreateProcessAsUserW failed (Win32 2): command: -e'
  out.C1_runnerFailureNotDenied = {
    exitCode: 127,
    denied_official: matchesSignature(127, stderr, OFFICIAL),
    denied_patched: matchesSignature(127, stderr, PATCHED),
  }
}
// ---- C2 正向对照：受限子进程主动打印 Access is denied. → 仍判 denied ----
{
  const r = confined([NODE, '-e', `process.stderr.write('Access is denied.\\n'); process.exit(1)`])
  out.C2_positiveControl = {
    exitCode: r.exitCode,
    denied_official: matchesSignature(r.exitCode, r.stderr, OFFICIAL),
    denied_patched: matchesSignature(r.exitCode, r.stderr, PATCHED),
    keyStderrLine: keyLine(r.stderr),
  }
}
// ---- C3 反向哨兵：非零退出但无签名 → 不得判 denied ----
{
  const r = confined([NODE, '-e', `console.error('some ordinary failure'); process.exit(3)`])
  out.C3_genericFailureNotDenied = {
    exitCode: r.exitCode,
    denied_official: matchesSignature(r.exitCode, r.stderr, OFFICIAL),
    denied_patched: matchesSignature(r.exitCode, r.stderr, PATCHED),
  }
}

console.log(JSON.stringify(out, null, 2))
