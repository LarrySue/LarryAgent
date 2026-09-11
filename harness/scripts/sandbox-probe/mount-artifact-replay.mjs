/**
 * 挂载实跑（DSH-2.5 ③ 二轮收尾 R3）补充证据：把 profile 内 boot 产出的**真实产物**拿到 boot 之外重放。
 * 定案与已证/未证边界见 `docs/dsh/dsh-local-env.md` §4.3。
 *
 * 为什么需要它：R3 要求"实跑端到端"。但本机 Trae 工具沙箱会拦截
 * **沙箱进程内部的孙进程 spawn**（观测到 `TRAE Sandbox Error: process launch failed`,
 * code 2147483653），所以探针在 boot 内发起的受限 spawn 起不来。
 *
 * 做法（诚实标注：argv 与签名单是 profile 内真实产物，spawn 发生在 profile 之外）：
 *   1. 读 `mount-probe.json` 里 `shellConfine.argv` —— 这是消费方
 *      `SandboxPwshExecutor.confine()` 在真实 profile 内生成、含 ENCODING_PREAMBLE 的 argv；
 *   2. 读同一文件里的 `shellConfine.denialSignatures` —— 这是**生产挂载后**消费方拿到的签名单；
 *   3. 在 boot 之外 spawn 该 argv，用同一份签名单判定 denied。
 *
 * 于是"插件被消费方拿到"（第 2 步）与"被拒信号确实能算成 denied"（第 3 步）各自都是实跑，
 * 唯一被拆开的是最后那次 CreateProcessAsUserW 的发起位置。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'

const ART = 'D:\\Code\\sandbox-probe\\mount-probe.json'
const OFFICIAL = ['access is denied', 'access to the path', 'permission denied']

function matchesSignature(exitCode, stderr, signatures) {
  if (exitCode === null || exitCode === 0) return false
  const lowered = stderr.toLowerCase()
  return signatures.some(s => lowered.includes(s.toLowerCase()))
}

const art = JSON.parse(readFileSync(ART, 'utf8'))
const c = art.shellConfine
if (c === undefined) throw new Error(`artifact has no shellConfine: ${ART}`)

const argv = c.argv
/** 从 `Set-Content -LiteralPath '<target>'` 里取回目标路径，用于"文件是否泄漏"判定。 */
const target = argv[argv.length - 1].match(/'([^']+)'/)?.[1] ?? null
rmSync(target, { force: true })

const r = spawnSync(argv[0], argv.slice(1), { timeout: 120000 })
const stderr = (r.stderr ?? Buffer.alloc(0)).toString('utf8')
const leaked = target !== null && existsSync(target)
rmSync(target, { force: true })

const keyLine = stderr.split(/\r?\n/).map(l => l.trim()).find(l => /denied|permitted|permission|拒绝|EPERM/i.test(l)) ?? ''

console.log(JSON.stringify({
  source: ART,
  providerCtor: art.providerCtor,
  shellCtor: art.shellCtor,
  argvFromProfile: argv,
  signaturesFromProfile: c.denialSignatures,
  replay: {
    exitCode: r.status,
    fileLeaked: leaked,
    keyStderrLine: keyLine.slice(0, 200),
    denied_inProfileSignatures: matchesSignature(r.status, stderr, c.denialSignatures),
    denied_officialOnly: matchesSignature(r.status, stderr, OFFICIAL),
  },
}, null, 2))
