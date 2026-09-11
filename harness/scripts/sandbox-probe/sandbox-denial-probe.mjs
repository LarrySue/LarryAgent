/**
 * DSH-2.5 ②轮收尾 验收探针 v3（本机 Windows）。
 *
 * v2 → v3 的三处修正（对应派发稿 R2 / 附带）：
 *
 *  R2 —— **补真实链路**。v2 用「裸 spawn 子进程」实测，而真实链路是
 *    `SandboxPwshExecutor.confine()` → `PwshLocalExecutor.argv()`，后者给每条命令前置
 *    `ENCODING_PREAMBLE`（`@deepseek-ai/dsh-pwsh-local/lib/index.js:158,271-280`）。
 *    裸 spawn 少了这层 → 子进程按「继承到的 console output CP」输出（非 646/UTF-8 的
 *    终端上是 GBK）→ 收集器按 UTF-8 解码 → 乱码 → 中文签名命中不了 → **① 层假阴性**。
 *    v3 每个子进程都跑「裸 / 真实链路（前导）」两组，前导**直接 import 官方常量**，不手抄。
 *
 *  附带1 —— **C1 哨兵由纸面改为真实 spawn**：v2 是直接构造 stderr 字符串调
 *    `matchesSignature`（不是真实进程）。v3 改为真跑一次必然 runner 故障的调用
 *    （`--` 后传不存在的可执行文件 → `windows-acl-run: CreateProcessAsUserW failed`），
 *    同时用官方 `classifyRunnerFailure` 规则口径复核。
 *
 *  附带2 —— 环境自述（console CP / UI 文化）随结果一起打印：**读者必须能判断
 *    这次运行落在哪个编码/语言区制**，否则同一个探针会得出两种结论（这正是 R1/R2 的根因）。
 *
 * 沙箱行为三链（A1/A2/A3）与 fail-closed 反向哨兵保留。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const HOME = process.env.USERPROFILE
const NM = join(HOME, '.dsh/profiles/node_modules')
const NMURL = p => pathToFileURL(join(NM, p)).href
const RUNNER = join(NM, '@deepseek-ai/dsh-sandbox-windows-acl/lib/runner.js')
const NODE = process.execPath
const CMD = 'C:\\Windows\\System32\\cmd.exe'
const PWSH = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

/** 真实链路的前导：直接 import 官方常量（不手抄，避免与上游漂移）。 */
const { ENCODING_PREAMBLE } = await import(NMURL('@deepseek-ai/dsh-pwsh-local/lib/index.js'))

const ROOT = 'D:\\Code\\sandbox-probe'
const WS = join(ROOT, 'ws')
const TEMP = join(ROOT, 'temp')
const OUTSIDE = join(ROOT, 'outside')
for (const d of [WS, TEMP, OUTSIDE]) mkdirSync(d, { recursive: true })

const stamp = Date.now()
const inside = join(WS, `inside-${stamp}.txt`)
const outside = join(OUTSIDE, `denied-${stamp}.txt`)
/** 裸 node 用例的脚本落盘，避免把 JS 塞进 pwsh 单引号串里做转义。 */
const nodeScript = join(TEMP, `write-${stamp}.js`)
// argv[1] 是脚本自身路径，目标路径从 argv[2] 取。
writeFileSync(nodeScript, 'require("fs").writeFileSync(process.argv[2], "x")\n')

/** 逐字对齐 @deepseek-ai/dsh-pwsh-sandbox/lib/index.js 的 matchesSignature。 */
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
/** 逐字对齐同文件的 classifyRunnerFailure（windows-acl 规则：exit 127 + `windows-acl-run: `）。 */
function classifyRunnerFailure(exitCode, stderr, rules) {
  if (exitCode === null || exitCode === 0) return undefined
  const lines = stderr.split(/\r?\n/)
  for (const rule of rules) {
    if (rule.allowedExitCodes !== undefined && !rule.allowedExitCodes.includes(exitCode)) continue
    const informationalLines = new Set((rule.informationalLines ?? []).map(l => l.toLowerCase()))
    const fatal = rule.fatalSignatures.map(s => s.toLowerCase())
    for (const line of lines) {
      const lowered = line.toLowerCase()
      if (informationalLines.has(lowered)) continue
      if (fatal.some(s => lowered.includes(s))) return { detail: line }
    }
  }
  return undefined
}
const RUNNER_FAILURE_RULES = {
  'windows-acl': [{ allowedExitCodes: [127], fatalSignatures: ['windows-acl-run: '] }],
}

const OFFICIAL = ['access is denied', 'access to the path', 'permission denied']
const PATCHED = [...OFFICIAL, 'operation not permitted', '拒绝访问', '访问被拒绝']

/** 取 stderr 里含拒绝/错误关键字的行（否则取非空末行）。 */
function keyLine(stderr) {
  const lines = stderr.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const hit = lines.find(l => /denied|permission|permitted|deny|拒绝|EPERM|EACCES|windows-acl-run/i.test(l))
  return (hit ?? lines[lines.length - 1] ?? '').slice(0, 200)
}

function raw(argv) {
  const r = spawnSync(argv[0], argv.slice(1), { timeout: 120000 })
  return {
    exitCode: r.status,
    stdout: (r.stdout ?? Buffer.alloc(0)).toString('utf8'),
    stderr: (r.stderr ?? Buffer.alloc(0)).toString('utf8'),
  }
}
function direct(argv) {
  return raw(argv)
}
function confined(argv) {
  return raw([process.execPath, RUNNER, '--workspace', WS, '--temp', TEMP, '--mode', 'workspace-write', '--', ...argv])
}

/** 把一条 pwsh 级命令包成真实链路的 argv（前导 + 执行器同款开关）。 */
const realChain = psCommand => [PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', ENCODING_PREAMBLE + psCommand]

// 「写未授权目标」的三个子进程：同时给出 bare argv（非真实链路）与 pwsh 级命令（真实链路）。
const CASES = [
  {
    name: 'node',
    bare: t => [NODE, nodeScript, t],
    psCommand: t => `& '${NODE}' '${nodeScript}' '${t}'`,
  },
  {
    name: 'cmd',
    bare: t => [CMD, '/c', 'copy', 'NUL', t],
    psCommand: t => `& '${CMD}' /c copy NUL '${t}'`,
  },
  {
    name: 'powershell',
    bare: t => [PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', `Set-Content -LiteralPath '${t}' -Value hi`],
    psCommand: t => `& '${PWSH}' -NoLogo -NoProfile -NonInteractive -Command "Set-Content -LiteralPath '${t}' -Value hi"`,
  },
]

/** 判定一组：官方 / 补丁签名、真实文案、runner 故障口径。 */
function classify(tag, r, leaked) {
  const runnerFailure = classifyRunnerFailure(
    r.exitCode,
    r.stderr,
    RUNNER_FAILURE_RULES['windows-acl'],
  )
  return {
    tag,
    exitCode: r.exitCode,
    fileLeaked: leaked,
    keyStderrLine: keyLine(r.stderr),
    runnerFailure: runnerFailure?.detail?.slice(0, 160) ?? null,
    denied_official: matchesSignature(r.exitCode, r.stderr, OFFICIAL),
    denied_patched: matchesSignature(r.exitCode, r.stderr, PATCHED),
    matchedOfficial: whichSignature(r.exitCode, r.stderr, OFFICIAL),
    matchedPatched: whichSignature(r.exitCode, r.stderr, PATCHED),
  }
}

const out = { platform: process.platform, preamble: ENCODING_PREAMBLE, dirs: { WS, TEMP, OUTSIDE } }

// ---- 0. 环境自述：本次运行落在哪个编码/语言区制（读者据此判断结论作用域）----
{
  const cp = direct([CMD, '/c', 'chcp'])
  const cult = direct([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command',
    `[Console]::OutputEncoding.WebName; (Get-UICulture).Name; (Get-Culture).Name; (Get-WinSystemLocale).Name`])
  out.env = {
    console_cp_chcp: cp.stdout.trim() || cp.stderr.trim() || null,
    ps_encoding_and_cultures: cult.stdout.trim().split(/\r?\n/).filter(Boolean),
    note: 'console CP 与 UI 文化决定「补丁签名是否够用」：CP 非 UTF-8 时中文经 UTF-8 解码成乱码 → 需 preamble 才能让中文签名可被命中；UI 非 zh-CN 时系统本就吐英文',
  }
}

// ---- A1: 无沙箱写未授权 → 成功 ----
{
  rmSync(outside, { force: true })
  const r = direct([NODE, nodeScript, outside])
  out.A1_noSandbox_writeOutside = { exitCode: r.exitCode, fileExists: existsSync(outside) }
  rmSync(outside, { force: true })
}
// ---- A2: 沙箱内写授权（workspace 内）→ 成功 ----
{
  rmSync(inside, { force: true })
  const r = confined([NODE, nodeScript, inside])
  out.A2_sandboxed_writeInside = { exitCode: r.exitCode, fileExists: existsSync(inside) }
  rmSync(inside, { force: true })
}

// ---- B: 三子进程 × {裸, 真实链路} × {无沙箱, 沙箱} ----
out.B_denials = {}
for (const c of CASES) {
  const cell = {}

  for (const [chainName, argvOf] of [['bare', c.bare], ['realchain', c.psCommand && (t => realChain(c.psCommand(t)))]]) {
    if (argvOf === undefined) continue

    // 无沙箱对照：证明命令本身有效（不该出现"本来就写不进去"的假阴性）
    rmSync(outside, { force: true })
    const d = direct(argvOf(outside))
    const directWrote = existsSync(outside)
    rmSync(outside, { force: true })

    // 沙箱内：判定 denied
    const s = confined(argvOf(outside))
    const leaked = existsSync(outside)
    rmSync(outside, { force: true })

    cell[chainName] = {
      direct_noSandbox: { exitCode: d.exitCode, fileExists: directWrote },
      confined: classify(`${c.name}/${chainName}`, s, leaked),
    }
  }
  out.B_denials[c.name] = cell
}

// ---- A3: 沙箱内写未授权 → 失败且文件不出现（以真实链路为准）----
out.A3_summary = Object.fromEntries(
  Object.entries(out.B_denials).map(([k, v]) => [
    k,
    Object.fromEntries(
      Object.entries(v).map(([chain, r]) => [
        chain,
        { failedAndAbsent: r.confined.exitCode !== 0 && !r.confined.fileLeaked },
      ]),
    ),
  ]),
)

// ---- C1 反向哨兵（真实 spawn）：runner 故障不得判 denied ----
{
  const r = confined(['C:\\larry-probe\\does-not-exist.exe'])
  out.C1_runnerFailureNotDenied = {
    ...classify('c1', r, false),
    stderr_utf8_head: r.stderr.trim().slice(0, 160),
  }
}
// ---- C2 正向对照（真实链路）：受限子进程主动打印 `Access is denied.` 到 stderr → 仍判 denied ----
{
  const r = confined(realChain(`[Console]::Error.WriteLine('Access is denied.'); exit 1`))
  out.C2_positiveControl = classify('c2', r, false)
}
// ---- C3 反向哨兵：非零退出但无签名 → 不得判 denied ----
{
  const r = confined(realChain(`[Console]::Error.WriteLine('some ordinary failure'); exit 3`))
  out.C3_genericFailureNotDenied = classify('c3', r, false)
}

// ---- 判据汇总：真实链路下三子进程是否都 patched=true ----
out.verdict = {
  realchain_denied_patched: Object.fromEntries(
    Object.entries(out.B_denials).map(([k, v]) => [k, v.realchain?.confined.denied_patched ?? null]),
  ),
  realchain_denied_official: Object.fromEntries(
    Object.entries(out.B_denials).map(([k, v]) => [k, v.realchain?.confined.denied_official ?? null]),
  ),
}

console.log(JSON.stringify(out, null, 2))
