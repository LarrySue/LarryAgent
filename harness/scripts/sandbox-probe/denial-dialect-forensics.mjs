/**
 * DSH-2.5 二轮收尾 R1 取证：拒绝文案的「语言 + 编码」来源定位。
 *
 * 报告 §3.2 写的 cmd/powershell 输出是英文（`Access is denied.`），
 * WB 复跑拿到的是乱码中文。二者在同一台机器上，必须查出：
 *   a) 文案语言由什么决定（受限令牌是否改变 UI 语言？）
 *   b) 字节编码由什么决定（OEM/GBK vs UTF-8；preamble 是否改变）
 *
 * 手段：一律以 **原始 Buffer** 收 stderr（不做 utf8 解码），
 * 再分别按 utf8 / gbk 两种方式解出文本 + 打印 hex，避免"解码姿势"再次污染结论。
 *
 * 四个维度交叉：
 *   进程：cmd / powershell
 *   沙箱：direct（无 runner） / confined（经 windows-acl runner）
 *   前导：bare（裸命令） / pre（真实链路：ENCODING_PREAMBLE，从官方包 import）
 *   目标：C:\Windows\System32\... （direct 也会被系统拒，才有可比文案）
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const HOME = process.env.USERPROFILE
const NM = join(HOME, '.dsh/profiles/node_modules')
const url = p => pathToFileURL(join(NM, p)).href

/** 真实链路的前导 —— 直接 import 官方常量，不手抄，避免漂移。 */
const { ENCODING_PREAMBLE } = await import(url('@deepseek-ai/dsh-pwsh-local/lib/index.js'))

const RUNNER = join(NM, '@deepseek-ai/dsh-sandbox-windows-acl/lib/runner.js')
const CMD = 'C:\\Windows\\System32\\cmd.exe'
const PWSH = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
const ROOT = 'D:\\Code\\sandbox-probe'
const WS = join(ROOT, 'ws')
const TEMP = join(ROOT, 'temp')
for (const d of [WS, TEMP]) mkdirSync(d, { recursive: true })

/** 系统保护路径：direct（非提权）与 confined 都必然被拒 → 两条路径的拒绝文案可直接对比。 */
const PROTECTED = 'C:\\Windows\\System32\\larry-probe-denied.txt'

function decode(buf, enc) {
  try {
    return new TextDecoder(enc).decode(buf)
  } catch (e) {
    return `<decoder ${enc} unavailable: ${e.message}>`
  }
}
function hex(buf, max = 120) {
  return buf.subarray(0, max).toString('hex').replace(/(..)/g, '$1 ').trim() + (buf.length > max ? ' …' : '')
}
function run(argv) {
  const r = spawnSync(argv[0], argv.slice(1), { timeout: 120000 })
  const stderr = r.stderr ?? Buffer.alloc(0)
  const stdout = r.stdout ?? Buffer.alloc(0)
  return {
    exitCode: r.status,
    stderr_bytes: stderr.length,
    stderr_hex: hex(stderr),
    stderr_utf8: decode(stderr, 'utf-8').trim().slice(0, 160),
    stderr_gbk: decode(stderr, 'gbk').trim().slice(0, 160),
    stdout_utf8: decode(stdout, 'utf-8').trim().slice(0, 200),
    stdout_gbk: decode(stdout, 'gbk').trim().slice(0, 200),
  }
}
const direct = argv => run(argv)
const confined = argv =>
  run([process.execPath, RUNNER, '--workspace', WS, '--temp', TEMP, '--mode', 'workspace-write', '--', ...argv])

// ---- 0. 环境自述：direct vs confined 的 UI/区域/控制台代码页 ----
const ENV_PROBE = `[Console]::OutputEncoding.WebName; (Get-UICulture).Name; (Get-Culture).Name; (Get-WinSystemLocale).Name; chcp`
const envProbe = {
  direct_bare: direct([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', ENV_PROBE]),
  confined_bare: confined([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', ENV_PROBE]),
  confined_preamble: confined([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', ENCODING_PREAMBLE + ENV_PROBE]),
}

// ---- 1. 拒绝文案：cmd ----
const cmdArgs = [CMD, '/c', 'copy', 'NUL', PROTECTED]
const cmd = {
  direct_bare: direct(cmdArgs),
  confined_bare: confined(cmdArgs),
}

// ---- 2. 拒绝文案：powershell ----
const psCmd = `Set-Content -LiteralPath '${PROTECTED}' -Value hi`
const ps = {
  direct_bare: direct([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', psCmd]),
  confined_bare: confined([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', psCmd]),
  confined_preamble: confined([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', ENCODING_PREAMBLE + psCmd]),
}

// ---- 3. node 的 EPERM 文案（应语言无关）----
const nodeCmd = [process.execPath, '-e', `require('fs').writeFileSync(process.argv[1],'x')`, PROTECTED]
const node = {
  direct_bare: direct(nodeCmd),
  confined_bare: confined(nodeCmd),
}

// ---- 4. 编码轴（与文案语言无关）：非 ASCII 输出在「有/无前导」下的字节形态 ----
// 本树 console CP 已是 65001，故裸跑也已是 UTF-8 —— 这只能说明"本树两态等价"，
// **不能**证明前导的作用。真正的证明见第 5 节（模拟 936 区制）。
const NON_ASCII = `Write-Output '拒绝访问。'; Write-Output '对路径 X 的访问被拒绝。'`
const encodingAxis = {
  bare: confined([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', NON_ASCII]),
  preamble: confined([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', ENCODING_PREAMBLE + NON_ASCII]),
  direct_bare_console_cp: direct([CMD, '/c', 'chcp']),
}

// ---- 5. 复现 WB 的区制（继承 console CP=936）：证明前导是「中文签名能否被命中」的开关 ----
// 本树 UI=en-US，系统不会吐中文文案，故用显式中文串替代"系统文案"，只验证**编码轴**。
// 顺序还原真实部署：先落到 936（继承态），再由前导覆盖为 UTF-8。
const ZH = `[Console]::Error.WriteLine('对路径 X 的访问被拒绝。'); [Console]::Error.WriteLine('拒绝访问。'); exit 1`
const SIM936 = `[Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding(936); `
const PATCHED_SIGS = [...['access is denied', 'access to the path', 'permission denied'], 'operation not permitted', '拒绝访问', '访问被拒绝']
const sim936 = {
  bare: (() => {
    const r = confined([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', SIM936 + ZH])
    const stderr = r.stderr_utf8
    return { ...r, denied_patched: /拒绝访问|访问被拒绝/.test(stderr), sigs: PATCHED_SIGS.filter(s => stderr.toLowerCase().includes(s.toLowerCase())) }
  })(),
  realchain: (() => {
    const r = confined([PWSH, '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', SIM936 + ENCODING_PREAMBLE + ZH])
    const stderr = r.stderr_utf8
    return { ...r, denied_patched: /拒绝访问|访问被拒绝/.test(stderr), sigs: PATCHED_SIGS.filter(s => stderr.toLowerCase().includes(s.toLowerCase())) }
  })(),
  note: 'bare = 继承 936 且无前导（WB 侧裸 spawn 的等价区制）；realchain = 936 继承后由前导覆盖为 UTF-8（真实链路）',
}

console.log(JSON.stringify({
  preamble: ENCODING_PREAMBLE,
  protectedPath: PROTECTED,
  envProbe,
  cmd,
  ps,
  node,
  encodingAxis,
  sim936,
}, null, 2))
