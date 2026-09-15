/**
 * 派发 002 · 探针驱动：在**真实 profile 内 boot** 起探针，并把 boot 期间的 stderr 完整落盘。
 *
 * 为什么不用 `--help`：`--help` 打完用法即退，插件图未必来得及激活 + 我们的 `ctx.inject`
 * 回调未必来得及触发 ⇒ 会得到"服务未就绪"的**假阴性**。sdk profile 的入口是 stdio JSON-RPC
 * 服务（"serve one SDK runtime until its client disconnects"），所以本驱动**保持 stdin 打开**
 * 让进程活到超时，再收回 stderr 作为原始证据。
 *
 * 用法：
 *   node harness/scripts/015-preset-probe/run-probe.mjs <label> [patchFile]
 * 环境：
 *   DSH_HOME      默认 %USERPROFILE%\.dsh
 *   TRAE_015_OUT  探针报告目录，默认 D:\Code\_trae-015
 *   PROBE_MS      存活毫秒数，默认 20000
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const [label, patchArg] = process.argv.slice(2)
if (!label) {
  console.error('usage: node run-probe.mjs <label> [patchFile]')
  process.exit(2)
}

const DSH_HOME = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const OUT_ROOT = process.env.TRAE_015_OUT ?? 'D:\\Code\\_trae-015'
const RUNS = join(OUT_ROOT, 'runs')
const ALIVE_MS = Number(process.env.PROBE_MS ?? 20_000)
const BIN = join(DSH_HOME, 'profiles', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')

mkdirSync(RUNS, { recursive: true })

const args = [BIN, '--profile', 'sdk']
if (patchArg !== undefined) args.push('--patch', resolve(patchArg))

const child = spawn(process.execPath, args, {
  env: { ...process.env, DSH_HOME, CI: '1', TRAE_015_OUT: OUT_ROOT },
  stdio: ['pipe', 'pipe', 'pipe'],
})

let out = ''
let err = ''
child.stdout.on('data', (d) => (out += d.toString('utf8')))
child.stderr.on('data', (d) => (err += d.toString('utf8')))

const closeStdin = setTimeout(() => child.stdin.end(), ALIVE_MS)
const kill = setTimeout(() => child.kill('SIGKILL'), ALIVE_MS + 3_000)

child.on('exit', (code, signal) => {
  clearTimeout(closeStdin)
  clearTimeout(kill)
  writeFileSync(join(RUNS, `${label}.stdout.txt`), out)
  writeFileSync(join(RUNS, `${label}.stderr.txt`), err)
  let probe = null
  try {
    probe = JSON.parse(readFileSync(join(OUT_ROOT, 'probe.json'), 'utf8'))
    writeFileSync(join(RUNS, `${label}.probe.json`), JSON.stringify(probe, null, 2))
  } catch {
    /* 探针没写出报告也是结果 */
  }
  const lines = err.split(/\r?\n/).filter((l) => l.includes('[015PROBE]'))
  console.log(`=== label=${label} patch=${patchArg ?? '(none)'} exit=${code} signal=${signal ?? '-'} ===`)
  console.log(lines.join('\n'))
  console.log(`--- probe.json: A=${probe?.A ? 'ok' : 'null'} B=${probe?.B ? 'ok' : 'null'} C=${probe?.C ? 'ok' : 'null'} D=${probe?.D ? 'ok' : 'null'} notReady=${probe?.notReady ?? '-'}`)
  if (probe?.D?.verdict) console.log(`--- D.verdict=${JSON.stringify(probe.D.verdict)}`)
  if (probe?.errors?.length) console.log(`--- errors=${JSON.stringify(probe.errors)}`)
  console.log(`--- artifacts: ${join(RUNS, `${label}.stderr.txt`)}`)
})
