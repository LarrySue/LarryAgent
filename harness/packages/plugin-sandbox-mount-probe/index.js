/**
 * R3 挂载验证探针（DSH-2.5 ②轮收尾）。
 *
 * 目的：**在真实 profile 内 boot 的前提下**回答两件事，而不是只在配置层看 YAML：
 *   1. 我们替换的 `sandbox` provide 是否真的被 **消费方** 拿到 ——
 *      判据取 `ctx.sandbox.constructor.name`（应为 SandboxDialectProvider）+
 *      `ctx.shell.constructor.name`（应为 SandboxPwshExecutor）。
 *   2. 消费方自己的接缝是否走通 —— `ctx.shell.confine(spec, policy)` 是
 *      `SandboxPwshExecutor` 的内部路径，它内部调 `PwshLocalExecutor.argv()`
 *      （**带 ENCODING_PREAMBLE**）再交给 `ctx.sandbox.confine()`。
 *      用返回的 argv 真实 spawn 一次被拒写入，并用返回的 denialSignatures 判定。
 *
 * 输出落 `D:\Code\sandbox-probe\mount-probe.json`（仓库外）。
 * 探针只读、只写自己的输出文件与临时目标；不改任何 profile / 第三方包。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'D:\\Code\\sandbox-probe'
const OUT = join(ROOT, 'mount-probe.json')
const WS = join(ROOT, 'ws')
const OUTSIDE = join(ROOT, 'outside')

/** 逐字对齐 dsh-pwsh-sandbox 的 matchesSignature。 */
function matchesSignature(exitCode, stderr, signatures) {
  if (exitCode === null || exitCode === 0) return false
  const lowered = stderr.toLowerCase()
  return signatures.some(s => lowered.includes(s.toLowerCase()))
}
function keyLine(stderr) {
  const lines = stderr.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  return (lines.find(l => /denied|permitted|permission|拒绝|EPERM/i.test(l)) ?? lines[0] ?? '').slice(0, 200)
}

export default class SandboxMountProbe {
  static inject = ['sandbox', 'shell']

  constructor(ctx) {
    const report = { at: new Date().toISOString(), ok: false }
    try {
      mkdirSync(WS, { recursive: true })
      mkdirSync(OUTSIDE, { recursive: true })

      // ① 谁在 provide
      report.providerCtor = ctx.sandbox?.constructor?.name ?? null
      report.shellCtor = ctx.shell?.constructor?.name ?? null

      const policy = { mode: 'workspace-write', workspaceRoot: WS }
      const target = join(OUTSIDE, `mount-${Date.now()}.txt`)

      // ② 直接经 provider 接缝
      if (typeof ctx.sandbox?.confine === 'function') {
        const c = ctx.sandbox.confine(
          [process.execPath, '-e', `require("fs").writeFileSync(process.argv[1],"x")`, target],
          policy,
        )
        report.providerConfine = { enforcement: c.enforcement, denialSignatures: c.denialSignatures }
      }

      // ③ 经消费方接缝（这条才是"provide 被消费方拿到"的证据）
      if (typeof ctx.shell?.confine === 'function') {
        const spec = { command: `Set-Content -LiteralPath '${target}' -Value hi`, workdir: WS }
        const c = ctx.shell.confine(spec, policy)
        report.shellConfine = {
          enforcement: c.enforcement,
          denialSignatures: c.denialSignatures,
          argv: c.argv,
          argv0: c.argv?.[0],
        }
        rmSync(target, { force: true })
        const r = spawnSync(c.argv[0], c.argv.slice(1), { timeout: 120000 })
        const leaked = existsSync(target)
        const stderr = (r.stderr ?? Buffer.alloc(0)).toString('utf8')
        rmSync(target, { force: true })
        report.shellConfine.run = {
          exitCode: r.status,
          fileLeaked: leaked,
          denied: matchesSignature(r.status, stderr, c.denialSignatures),
          keyStderrLine: keyLine(stderr),
        }
      }
      report.ok = true
    } catch (error) {
      report.error = String(error?.stack ?? error).slice(0, 800)
    }
    try {
      mkdirSync(ROOT, { recursive: true })
      writeFileSync(OUT, JSON.stringify(report, null, 2))
    } catch {
      /* 探针自身失败不得影响 boot */
    }
  }
}
