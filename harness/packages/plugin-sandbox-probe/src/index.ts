/**
 * DSH-2.5 ③ 沙箱探针 —— Windows `ctx.sandbox` provider 实际生效性
 *
 * 不经 LLM：cordis 加载本 bundle 后，直接经 `ctx.sandbox.confine(argv, policy)`
 * 拿包装后的 argv 再 spawn，把「正反两组 + 反向对照 + 护栏自检」一次跑完，
 * 结果 JSON 打 stdout 后退出进程。
 *
 * ## 判定分层（这是本探针的核心，来自对源码的核实而非推测）
 *
 * `confine()` **不抛出拒绝**：它同步返回 `{ argv, enforcement, denialSignatures,
 * runnerFailureRules }`，调用方自己 spawn。于是「沙箱生效」与「沙箱没跑起来」
 * 必须由 spawn 后的**两类证据**分开判：
 *
 *   - 拒绝（= 沙箱生效）⇔ 非零退出 + stderr 命中该后端自己的 `denialSignatures`
 *   - runner 故障（= 命令压根没跑）⇔ 命中 `runnerFailureRules`
 *     （windows-acl：exit 127 + `windows-acl-run: `）
 *   - **两者都不命中 = FAILED-UNCLASSIFIED**，绝不并入「拒绝」
 *
 * 只看见「非零退出」就写「拦住了」，会把「沙箱根本没起来」读成「防护生效」——
 * 这是本探针首要防的假阳性。
 *
 * ## 探针矩阵
 *
 * 正反两组（授权路径应通过 / 未授权路径应被拒）：
 *   P1 workspace-write 写工作区内      → 期望成功（同时是**整体有效性锚点**：
 *      若 P1 失败则其余结论一律不可解释，不判「防护生效」）
 *   P2 workspace-write 写工作区外      → 期望被拒
 *   P3 read-only       写工作区内      → 期望被拒（**且 P3 跑在 P1 之后**，
 *      因此同时验证「工作区上已存在的常驻 ACE 在 read-only 下保持惰性」）
 *   P4 workspace-write 读工作区外      → 期望成功（读不受限，上游已声明）
 *
 * 反向对照 / 已声明边界（换条件看防护是否失效）：
 *   E1 read-only 写 NUL 设备           → 期望成功（上游声明：NUL 写入是 ambient）
 *   E2 workspace-write 写「显式授予 Everyone 写权限」的目录
 *                                      → 期望成功（上游声明边界：受限令牌必须
 *                                        保留 Everyone 才能完成进程初始化）
 *   E3 workspace-write 经由工作区外的**硬链接**写工作区文件
 *                                      → 期望成功（上游声明边界：硬链接是文件
 *                                        对象别名，非路径别名）
 *   C1 不经沙箱写同一工作区外目标      → 期望成功（证明 P2 的拒绝来自沙箱，
 *                                        而非该路径本身不可写）
 *
 * 护栏自检（防止「护栏从未运行」与「判定器坏了」）：
 *   S0 apply 入口 breadcrumb          → 探针没跑 ≠ 沙箱不可用（两者必须可分）
 *   S1 sandbox 服务不可用/超时        → 报 SANDBOX-SERVICE-MISSING，不静默
 *   S2 **判定器自检**：取 P1 真实包装 argv，只把 `--mode` 值改成非法值再跑
 *      → 期望被判定为 RUNNER-FAILED；若被判成 DENIED 则判定器失效，整体作废
 *
 * 另记（信息项，非判定项）：read-only 下对外 TCP 连接是否可用——上游声明
 * 「写受限，读/网络不受限」，网络结果与网络环境相关，故标 INFORMATIONAL。
 *
 * ## 依赖边界
 * 本包**只依赖 node 内建** + cordis 的**类型**导入。被测对象（sandbox 契约、
 * provider、runner 产物）一律经 `ctx.sandbox` 与运行时解析取得，**不做静态依赖**：
 * 探针不得依赖它要探测的东西。
 * @module @larryagent/plugin-sandbox-probe
 */

import { spawnSync } from 'node:child_process'
import { existsSync, linkSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, writeSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'

/** Cordis loader diagnostic name. */
export const name = 'larry-sandbox-probe'

// 故意**不导出 `inject`**：apply 必须立刻执行，否则「服务没就绪」会让 apply
// 静默不跑，而「探针没跑」与「沙箱不可用」就再也分不开了（S0/S1 的由来）。
// 服务等待改在 apply 内部显式做，并带超时。

/** 单次 spawn 的上限，避免 runner 卡死拖垮整轮。 */
const SPAWN_TIMEOUT_MS = 30_000
/** 等待 sandbox 服务就绪的上限。 */
const SERVICE_WAIT_MS = 20_000
/** 网络信息项的连接上限。 */
const NET_TIMEOUT_MS = 5_000

// ── 契约的**本地镜像**（不 import 被测包，见文件头「依赖边界」）────────────
// 形状抄自 ref/dsh-bare @ dsh-v0.1.2-rc.1 的 packages/sandbox/sandbox/src/index.ts

/** 镜像自上游 `RunnerFailureRule`。 */
interface RunnerFailureRule {
  allowedExitCodes?: readonly number[]
  fatalSignatures: readonly string[]
  informationalLines?: readonly string[]
}

/** 镜像自上游 `ConfinedArgv`。 */
interface ConfinedArgv {
  argv: string[]
  enforcement: string
  denialSignatures: readonly string[]
  runnerFailureRules: readonly RunnerFailureRule[]
}

/** 镜像自上游 `SandboxPolicy`（`danger-full-access` 不会到达 provider，故不含）。 */
interface SandboxPolicyLike {
  mode: 'read-only' | 'workspace-write'
  workspaceRoot: string
  sessionId?: unknown
}

/** 镜像自上游 `SandboxProvider` 的最小面。 */
interface SandboxProviderLike {
  confine(argv: readonly string[], policy: SandboxPolicyLike): ConfinedArgv
}

type Verdict =
  | 'SUCCESS'
  | 'DENIED'
  /** 确实被拒（未落盘 + 非零退出 + 该目标已被无沙箱对照证明可写），但**没命中
   *  provider 声明的 denialSignatures** —— 即「拒绝方言」没覆盖这个子进程。 */
  | 'DENIED-UNSIGNED'
  | 'RUNNER-FAILED'
  | 'FAILED-UNCLASSIFIED'
  | 'CONFINE-THREW'
  | 'SPAWN-ERROR'
  | 'INFORMATIONAL'

/** 一次 spawn 的原始观测。 */
interface RunObserved {
  exitCode: number | null
  signal: string | null
  stdout: string
  stderr: string
  wrote: () => boolean
}

/** 判定结果及其依据（判据必须随结论一起留证）。 */
interface Classification {
  verdict: Verdict
  evidence: string
  denialMatch: string | null
  runnerFailureMatch: string | null
}

/** 成功性校验：不同探针「成功」长什么样不一样（写=落盘；读=回显；NUL=退出 0）。 */
type Verify = (o: RunObserved) => { ok: boolean; detail: string }

/** 写类目标：成功 = 目标文件真的出现（退出码 0 但没落盘不算成功）。 */
function verifyWrote(target: string): Verify {
  return o => ({ ok: existsSync(target), detail: existsSync(target) ? '目标已落盘' : '目标未落盘' })
}

/** 读类目标：成功 = 退出 0 且回显里有预期内容（只有退出 0 不足以证明读到了）。 */
function verifyRead(expected: string): Verify {
  return o => ({
    ok: o.exitCode === 0 && o.stdout.includes(expected),
    detail: `exit ${String(o.exitCode)}；stdout=${JSON.stringify(o.stdout.slice(0, 80))}`,
  })
}

/** 无落盘产物的写（如 NUL 设备）：成功 = 退出 0。 */
function verifyExitZero(): Verify {
  return o => ({ ok: o.exitCode === 0, detail: `exit ${String(o.exitCode)}` })
}

// ── 小工具 ────────────────────────────────────────────────────────────────

/** 同步写 fd 1：`process.exit` 前必须保证已落盘，管道下的异步写会丢。 */
function out(text: string): void {
  writeSync(1, text)
}

/** 同步写 fd 2（人读的过程日志，与 stdout 的 JSON 分离）。 */
function log(text: string): void {
  writeSync(2, text)
}

/** 子进程脚本：写文件。用 argv 传路径，不经 shell，路径不含转义问题。 */
function writeArgv(target: string): string[] {
  return [process.execPath, '-e', `require('fs').writeFileSync(${JSON.stringify(target)}, 'probe-write')`]
}

/** 子进程脚本：读文件并回显内容。 */
function readArgv(target: string): string[] {
  return [process.execPath, '-e', `process.stdout.write(require('fs').readFileSync(${JSON.stringify(target)}, 'utf8'))`]
}

/** 子进程脚本：向外发起一次 TCP 连接（网络信息项）。 */
function netArgv(): string[] {
  return [
    process.execPath,
    '-e',
    "const s=require('net').connect(443,'1.1.1.1',()=>{console.log('CONNECTED');s.destroy();process.exit(0)});"
    + "s.on('error',e=>{console.log('ERR:'+e.code);process.exit(2)});"
    + 'setTimeout(()=>{console.log(\'TIMEOUT\');process.exit(3)},4000)',
  ]
}

/** spawn 一次并采集全部可判定的观测。 */
function run(argv: string[], target: string | null): RunObserved {
  const r = spawnSync(argv[0] as string, argv.slice(1), { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS })
  return {
    exitCode: r.status,
    signal: r.signal,
    stdout: (r.stdout ?? '').slice(0, 400),
    stderr: (r.stderr ?? '').slice(0, 1200),
    // 落盘判定只看文件是否真的出现：退出码 0 但没落盘不是「成功」
    wrote: () => (target === null ? false : existsSync(target)),
  }
}

/**
 * 判定器：把一次 spawn 的观测归到五类之一。
 * 顺序照上游契约：先排除 runner 故障，再判拒绝，最后才是「未分类」。
 */
function classify(
  o: RunObserved,
  c: ConfinedArgv,
  target: string | null,
  controlWritable: boolean | null,
): Classification {
  const wrote = o.wrote()

  // ⓪ 退出 0：命令跑完了（是否「成功」由调用方的 Verify 判，本函数不管）
  if (o.exitCode === 0) {
    return { verdict: 'SUCCESS', evidence: `exit 0（落盘=${String(wrote)}）`, denialMatch: null, runnerFailureMatch: null }
  }

  // ① runner 故障优先：命中即「命令压根没跑」，绝不能算拒绝
  try {
    const lines = o.stderr.split(/\r?\n/).filter(line => line.length > 0)
    for (const rule of c.runnerFailureRules) {
      const codeOk = rule.allowedExitCodes === undefined
        || (o.exitCode !== null && rule.allowedExitCodes.includes(o.exitCode))
      if (!codeOk) continue
      const kept = lines.filter(line =>
        !(rule.informationalLines ?? []).some(info => info.toLowerCase() === line.toLowerCase()))
      for (const sig of rule.fatalSignatures) {
        if (kept.some(line => line.toLowerCase().includes(sig.toLowerCase()))) {
          return {
            verdict: 'RUNNER-FAILED',
            evidence: `exit ${String(o.exitCode)} + stderr 命中 fatalSignature "${sig}"`,
            denialMatch: null,
            runnerFailureMatch: sig,
          }
        }
      }
    }
  } catch { /* 规则形状不符时按「未分类」处理，不吞成拒绝 */ }

  // ② 拒绝：只看**该后端自己的**方言，不用跨后端并集
  for (const sig of c.denialSignatures) {
    if (o.stderr.toLowerCase().includes(sig.toLowerCase())) {
      return {
        verdict: 'DENIED',
        evidence: `exit ${String(o.exitCode)} + stderr 命中 denialSignature "${sig}"`,
        denialMatch: sig,
        runnerFailureMatch: null,
      }
    }
  }

  // ③ 方言未命中，但若「未落盘 + 非零退出 + 该目标已被无沙箱对照证明可写」三条齐备，
  //    则拒绝为**实锤**，只是没被 provider 声明的方言覆盖 —— 单列一格，不并入 DENIED，
  //    也不假装成「未分类」。
  if (target !== null && !wrote && controlWritable === true) {
    return {
      verdict: 'DENIED-UNSIGNED',
      evidence: `exit ${String(o.exitCode)} 且未落盘，但 stderr 未命中任何 denialSignature；`
        + '该目标已被无沙箱对照证明可写 → 拒绝属实，方言未覆盖',
      denialMatch: null,
      runnerFailureMatch: null,
    }
  }

  // ④ 其余如实报「不知道」，这是最容易被粉饰成「拒绝」的一格
  return {
    verdict: 'FAILED-UNCLASSIFIED',
    evidence: `exit ${String(o.exitCode)} 但既未命中 runner 故障规则也未命中拒绝方言`
      + (target === null ? '（无落盘目标，无法佐证）' : `（对照可写=${String(controlWritable)}）`),
    denialMatch: null,
    runnerFailureMatch: null,
  }
}

/** 探针工作根（`%TEMP%` 下，结束时整体删除）。 */
const ROOT = join(tmpdir(), 'larry-sandbox-probe')
const WORKSPACE = join(ROOT, 'workspace')
const EVERYONE_DIR = join(ROOT, 'everyone')
/** 工作区外目标放在**用户主目录**下——刻意避开 `%TEMP%`，否则「temp 区可写」
 * 这层语义会让「工作区外被拒」的结论不干净。 */
const OUTSIDE_ROOT = join(homedir(), '.larry-sandbox-probe-outside')
const OUTSIDE_TARGET = join(OUTSIDE_ROOT, 'outside.txt')
const AMBIENT_TEMP_TARGET = join(tmpdir(), 'larry-sandbox-probe-ambient.txt')
/** 工作区外指向工作区内文件的硬链接（E3 用；必须与工作区同卷）。 */
const HARD_LINK = join(ROOT, 'hard-link-alias.txt')
const INSIDE_TARGET = join(WORKSPACE, 'inside.txt')
const READ_SOURCE = join(OUTSIDE_ROOT, 'read-source.txt')

/** 跑一次 icacls（E2 的 Everyone 授权与回收）。 */
function icacls(args: string[]): { code: number | null; out: string } {
  const r = spawnSync('icacls', args, { encoding: 'utf-8', timeout: 20_000 })
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.slice(0, 500) }
}

/** 列出 `%TEMP%` 下 `dsh-` 前缀目录（provider 私有 temp 的落点，用于残留取证）。 */
function dshTempDirs(): string[] {
  try {
    return readdirSync(tmpdir()).filter(n => n.startsWith('dsh-')).sort()
  } catch {
    return []
  }
}

/** 结果容器：随做随记，便于中途异常也能拿到已得结论。 */
interface ProbeResult {
  platform: string
  nodeVersion: string
  startedAt: string
  sandboxServicePresent: boolean
  sandboxResolve: Record<string, unknown> | null
  enforcement: string | null
  denialSignatures: readonly string[] | null
  runnerFailureRules: unknown
  wrappedArgvSample: string[] | null
  selfTests: Record<string, unknown>
  probes: Record<string, unknown>[]
  informational: Record<string, unknown>
  residue: Record<string, unknown>
  fatal: string | null
}

/** 一次取服务尝试的记录（判据要留证，不能只说「取不到」）。 */
interface ResolveAttempt {
  how: string
  ok: boolean
  detail: string
}

/** 其他服务名，用于区分「沙箱这一个取不到」与「所有服务都取不到」。 */
const PROBE_SERVICE_NAMES = ['sandbox', 'storage', 'session', 'llm', 'timer', 'approval', 'shell-env']

/**
 * 取 `ctx.sandbox`：按由直白到迂回的顺序试，**每条都记结果**。
 *
 * 之所以不是一句话 `ctx.sandbox`：本 bundle 是被插进 profile 根层的**外部层**，
 * 与 `dsh-base` 的 `sandbox` 行是**兄弟行**（`cordis.yml` 根层平铺）。cordis 的
 * 服务可见性沿 fiber 树**向上**解析，兄弟之间是否可见取决于服务注册到哪一层——
 * 这是必须实测的事，不能按印象写。
 */
async function resolveSandbox(ctx: Context): Promise<{
  api: SandboxProviderLike | null
  how: string
  attempts: ResolveAttempt[]
}> {
  const attempts: ResolveAttempt[] = []
  const c = ctx as unknown as {
    sandbox?: SandboxProviderLike
    reflect?: { get?: (name: string, strict?: boolean) => unknown }
    root?: { sandbox?: SandboxProviderLike }
    inject?: (deps: string[], cb: () => void) => unknown
    fiber?: { runtime?: unknown }
  }
  const take = (how: string, fn: () => unknown): SandboxProviderLike | null => {
    try {
      const v = fn()
      if (v !== undefined && v !== null) {
        attempts.push({ how, ok: true, detail: `取得（${typeof v}）` })
        return v as SandboxProviderLike
      }
      attempts.push({ how, ok: false, detail: '返回 undefined/null' })
      return null
    } catch (e) {
      attempts.push({ how, ok: false, detail: String(e).slice(0, 200) })
      return null
    }
  }

  // ① 先试直白访问：**本 bundle 未声明 inject，proxy 会抛 "without inject"**，
  //    故这一路在本插件形态下预期恒失败；留着是为了万一形态变了能立刻看出来。
  let api = take('ctx.sandbox（未声明 inject，预期抛错）', () => c.sandbox)
  if (api !== null) return { api, how: 'ctx.sandbox', attempts }

  // ② 非严格反射读：不经 inject 要求，直接从 store 取。apply 时刻 dsh-base 的
  //    插件尚未加载完（实测：此刻取不到），故这一路也可能落空。
  api = take('ctx.reflect.get("sandbox", false)', () => c.reflect?.get?.('sandbox', false))
  if (api !== null) return { api, how: 'ctx.reflect.get(sandbox,false)', attempts }

  // ③ 主路径：inject 回调**必须用回调传入的 ctx**——外层 ctx 没声明 inject，
  //    拿它读服务会抛 "cannot get property without inject"（这是本探针首版
  //    踩到的坑，故在此写死注释）。带超时，超时即报缺失，绝不静默。
  const viaInject = await new Promise<SandboxProviderLike | null>(resolve => {
    const timer = setTimeout(() => resolve(null), SERVICE_WAIT_MS)
    try {
      if (typeof c.inject !== 'function') {
        clearTimeout(timer)
        attempts.push({ how: 'ctx.inject(["sandbox"], cb)', ok: false, detail: 'ctx.inject 不是函数' })
        resolve(null)
        return
      }
      ;(c.inject as (deps: string[], cb: (child: unknown) => void) => unknown).call(
        ctx,
        ['sandbox'],
        (child: unknown) => {
          clearTimeout(timer)
          const inner = (child ?? ctx) as typeof c
          resolve(take('inject 回调内 ctx.sandbox', () => inner.sandbox))
        },
      )
    } catch (e) {
      clearTimeout(timer)
      attempts.push({ how: 'ctx.inject(["sandbox"], cb)', ok: false, detail: `抛出：${String(e).slice(0, 200)}` })
      resolve(null)
    }
  })
  if (viaInject !== null) return { api: viaInject, how: 'inject 回调 ctx.sandbox', attempts }
  attempts.push({ how: 'ctx.inject(["sandbox"], cb)', ok: false, detail: `等待 ${SERVICE_WAIT_MS}ms 未就绪` })

  // ④ 超时后的兜底：再直接查一次全局 store（区分「注册晚了」与「压根没注册」）
  api = take('超时后 reflect.get("sandbox", false)', () => c.reflect?.get?.('sandbox', false))
  if (api !== null) return { api, how: '超时后 reflect.get(sandbox,false)', attempts }

  // ⑤ 诊断：其他服务取不取得到？区分「只有 sandbox 取不到」与「一个都取不到」
  for (const n of PROBE_SERVICE_NAMES) {
    take(`诊断·reflect.get("${n}", false)`, () => c.reflect?.get?.(n, false))
  }
  return { api: null, how: 'none', attempts }
}

/** 探针主体。 */
async function probe(ctx: Context): Promise<never> {
  const r: ProbeResult = {
    platform: process.platform,
    nodeVersion: process.version,
    startedAt: new Date().toISOString(),
    sandboxServicePresent: false,
    sandboxResolve: null,
    enforcement: null,
    denialSignatures: null,
    runnerFailureRules: null,
    wrappedArgvSample: null,
    selfTests: {},
    probes: [],
    informational: {},
    residue: {},
    fatal: null,
  }
  const finish = (): never => {
    out(`\n--- SANDBOX PROBE JSON ---\n${JSON.stringify(r, null, 2)}\n--- PROBE-END ---\n`)
    process.exit(0)
  }

  const resolved = await resolveSandbox(ctx)
  const sandbox = resolved.api
  r.sandboxServicePresent = sandbox !== null
  r.sandboxResolve = { how: resolved.how, attempts: resolved.attempts }
  log(`[SANDBOX-PROBE] apply 已执行；ctx.sandbox 可用 = ${String(r.sandboxServicePresent)}（取法：${resolved.how}）\n`)
  if (sandbox === null) {
    // S1：这正是「探针没跑」与「沙箱不可用」必须分开的那一格
    r.fatal = 'SANDBOX-SERVICE-MISSING：服务等待超时或不可访问（不是「拒绝」，也不是「可用」）'
    for (const a of resolved.attempts) log(`[SANDBOX-PROBE]   取法 ${a.how}: ${a.ok ? 'OK' : '失败'} — ${a.detail}\n`)
    return finish()
  }

  // ── 准备目标 ───────────────────────────────────────────────────────────
  rmSync(ROOT, { recursive: true, force: true })
  rmSync(OUTSIDE_ROOT, { recursive: true, force: true })
  rmSync(AMBIENT_TEMP_TARGET, { force: true })
  mkdirSync(WORKSPACE, { recursive: true })
  mkdirSync(EVERYONE_DIR, { recursive: true })
  mkdirSync(OUTSIDE_ROOT, { recursive: true })
  writeFileSync(INSIDE_TARGET, 'seed')
  writeFileSync(READ_SOURCE, 'readable-outside')
  linkSync(INSIDE_TARGET, HARD_LINK) // 硬链接须在授权前建好：ACE 传播到的是文件对象

  const tempBefore = dshTempDirs()

  /** 跑一格：confine → spawn → 判定 → 记录。 */
  /**
   * 目标可写性对照表：某目标在**无沙箱**下是否可写。
   * 这是「拒绝是否属实」的锚——没有它，「未落盘」无法与「路径本来就不可写」区分开。
   */
  const targetWritable = new Map<string, boolean>()
  const controlWrite = (target: string): void => {
    rmSync(target, { force: true })
    const o = run(writeArgv(target), target)
    targetWritable.set(target, o.wrote())
    rmSync(target, { force: true })
  }

  const attempt = (
    label: string,
    argv: string[],
    policy: SandboxPolicyLike,
    expect: 'SUCCESS' | 'DENIED',
    target: string | null,
    verify: Verify,
  ): void => {
    const row: Record<string, unknown> = {
      label,
      policy: { mode: policy.mode, sessionId: policy.sessionId === undefined ? null : String(policy.sessionId) },
      expect,
      target,
      controlWritable: target === null ? null : targetWritable.get(target) ?? null,
    }
    let confined: ConfinedArgv
    try {
      confined = sandbox.confine(argv, policy)
    } catch (e) {
      row.verdict = 'CONFINE-THREW'
      row.detail = String(e).slice(0, 300)
      row.asExpected = expect === 'DENIED' // fail-closed 也算「拦住了」，但要标明是包装期抛的
      r.probes.push(row)
      log(`[SANDBOX-PROBE] ${label}: confine 抛出 —— ${String(e).slice(0, 200)}\n`)
      return
    }
    if (r.wrappedArgvSample === null) r.wrappedArgvSample = confined.argv.slice(0, 8)
    const o = run(confined.argv, target)
    const c = classify(o, confined, target, row.controlWritable as boolean | null)
    const v = verify(o)
    // 退出 0 但没达到该探针定义的「成功」→ 不算成功；其余按判定器结论
    const verdict: Verdict = c.verdict === 'SUCCESS' && !v.ok ? 'FAILED-UNCLASSIFIED' : c.verdict
    row.verdict = verdict
    row.verify = v.detail
    row.evidence = c.verdict === 'SUCCESS' && !v.ok ? `exit 0 但未达标：${v.detail}` : c.evidence
    row.exitCode = o.exitCode
    row.signal = o.signal
    row.wrote = target === null ? null : existsSync(target)
    row.denialMatch = c.denialMatch
    row.runnerFailureMatch = c.runnerFailureMatch
    row.stderrHead = o.stderr.slice(0, 500)
    // RUNNER-FAILED 不算「拦住了」：命令压根没跑，保护未被执行，只是 fail-closed
    row.asExpected = verdict === expect
    row.dialectGap = verdict === 'DENIED-UNSIGNED'
    r.probes.push(row)
    log(`[SANDBOX-PROBE] ${label}: ${verdict}（期望 ${expect}）${verdict === expect ? '' : ' ← 不符'}\n`)
    if (target !== null) rmSync(target, { force: true })
  }

  const wsPolicy: SandboxPolicyLike = { mode: 'workspace-write', workspaceRoot: WORKSPACE }
  const roPolicy: SandboxPolicyLike = { mode: 'read-only', workspaceRoot: WORKSPACE }

  // ── C0 目标可写性对照（无沙箱）：先建立「这些路径本来就写得进去」的事实 ──
  // 没有这一步，「未落盘」无法与「路径本来就不让写」区分 —— 这是本轮判据的地基。
  controlWrite(INSIDE_TARGET)
  controlWrite(OUTSIDE_TARGET)
  controlWrite(AMBIENT_TEMP_TARGET)
  controlWrite(HARD_LINK)
  r.selfTests.targetWritabilityControls = Object.fromEntries(targetWritable)
  log(`[SANDBOX-PROBE] C0 可写性对照（无沙箱）: ${JSON.stringify(Object.fromEntries(targetWritable))}\n`)

  // ── P1 先跑：既是正组，也是后续结论的有效性锚点，并落地常驻工作区 ACE ──
  attempt('P1_ws_write_inside', writeArgv(INSIDE_TARGET), wsPolicy, 'SUCCESS', INSIDE_TARGET, verifyWrote(INSIDE_TARGET))

  // 契约面事实（判定器自检与报告都需要）
  let contract: ConfinedArgv | null = null
  try {
    contract = sandbox.confine([process.execPath, '-e', ''], wsPolicy)
    r.enforcement = contract.enforcement
    r.denialSignatures = contract.denialSignatures
    r.runnerFailureRules = contract.runnerFailureRules
    r.wrappedArgvSample = contract.argv.slice(0, 8)
  } catch (e) {
    r.fatal = `confine 契约面取样失败：${String(e).slice(0, 200)}`
    return finish()
  }

  /** 拿真实包装 argv 改一个字段再跑 —— 反向哨兵专用（用的是真 argv，不是手搓的）。 */
  const mutateRealArgv = (mutate: (argv: string[]) => void): { argv: string[]; o: RunObserved; c: Classification } => {
    const argv = [...(contract?.argv ?? [])]
    mutate(argv)
    const o = run(argv, null)
    return { argv, o, c: classify(o, contract as ConfinedArgv, null, null) }
  }

  // ── S2 判定器自检：只把 `--mode` 的值改非法 ────────────────────────────
  // 若这一步被判成 DENIED，说明判定器把「runner 故障」读成了「拒绝」，
  // 那么后面所有「被拒」结论都不可信 —— 整体作废。
  {
    const { argv, o, c } = mutateRealArgv(a => {
      const i = a.indexOf('--mode')
      if (i >= 0 && a[i + 1] !== undefined) a[i + 1] = 'bogus-mode'
    })
    r.selfTests.classifierOnRunnerFailure = {
      mutatedArgv: argv.slice(0, 8),
      exitCode: o.exitCode,
      stderrHead: o.stderr.slice(0, 300),
      verdict: c.verdict,
      passed: c.verdict === 'RUNNER-FAILED',
      note: '期望 RUNNER-FAILED；若为 DENIED 则判定器失效，本轮全部「被拒」结论作废',
    }
    log(`[SANDBOX-PROBE] S2 判定器自检: ${c.verdict}（须为 RUNNER-FAILED）\n`)
  }

  // ── S3 fail-closed 自检：把 `--workspace` 改成不存在的目录 ─────────────
  // 上游承诺「runner 故障时命令绝不裸跑」。这里验证：(a) 报的是 runner 故障而非
  // 拒绝；(b) 命令**确实没跑**（目标文件不存在）。
  {
    const probeTarget = join(ROOT, 'failclosed-should-not-exist.txt')
    const sep = (contract?.argv ?? []).indexOf('--')
    // 保留 runner 前缀（含 --mode 等真参数），只做两处改动：
    //   ① `--workspace` 指向不存在的目录  ② 分隔符后的命令体换成「写 probeTarget」
    const patched = sep >= 0 ? [...(contract as ConfinedArgv).argv.slice(0, sep + 1), ...writeArgv(probeTarget)] : []
    const i = patched.indexOf('--workspace')
    if (i >= 0 && patched[i + 1] !== undefined) patched[i + 1] = join(ROOT, 'no-such-workspace-dir')
    const o = run(patched, probeTarget)
    const c = classify(o, contract as ConfinedArgv, probeTarget, null)
    r.selfTests.failClosedOnBadWorkspace = {
      mutatedArgv: patched.slice(0, 8),
      exitCode: o.exitCode,
      stderrHead: o.stderr.slice(0, 300),
      verdict: c.verdict,
      commandRan: existsSync(probeTarget),
      passed: c.verdict === 'RUNNER-FAILED' && !existsSync(probeTarget),
      note: '期望 RUNNER-FAILED 且命令未执行（fail-closed：绝不裸跑）',
    }
    rmSync(probeTarget, { force: true })
    log(`[SANDBOX-PROBE] S3 fail-closed 自检: ${c.verdict}；命令是否执行=${String(existsSync(probeTarget))}\n`)
  }

  // ── 正反两组 ───────────────────────────────────────────────────────────
  attempt('P2_ws_write_outside', writeArgv(OUTSIDE_TARGET), wsPolicy, 'DENIED', OUTSIDE_TARGET, verifyWrote(OUTSIDE_TARGET))
  attempt('P2b_ws_write_ambient_temp', writeArgv(AMBIENT_TEMP_TARGET), wsPolicy, 'DENIED', AMBIENT_TEMP_TARGET, verifyWrote(AMBIENT_TEMP_TARGET))
  attempt('P3_ro_write_inside', writeArgv(INSIDE_TARGET), roPolicy, 'DENIED', INSIDE_TARGET, verifyWrote(INSIDE_TARGET))
  attempt('P4_ws_read_outside', readArgv(READ_SOURCE), wsPolicy, 'SUCCESS', null, verifyRead('readable-outside'))

  // ── 反向对照 / 已声明边界 ──────────────────────────────────────────────
  attempt('E1_ro_write_nul_device', writeArgv('\\\\.\\NUL'), roPolicy, 'SUCCESS', null, verifyExitZero())

  const grant = icacls([EVERYONE_DIR, '/grant', '*S-1-1-0:(F)'])
  const everyoneTarget = join(EVERYONE_DIR, 'everyone.txt')
  r.selfTests.everyoneGrantSetup = { exitCode: grant.code, output: grant.out }
  if (grant.code === 0) {
    controlWrite(everyoneTarget)
    attempt('E2_ws_write_everyone_dir', writeArgv(everyoneTarget), wsPolicy, 'SUCCESS', everyoneTarget, verifyWrote(everyoneTarget))
  } else {
    r.probes.push({ label: 'E2_ws_write_everyone_dir', verdict: 'SKIPPED', detail: 'Everyone 授权失败，本格未测', asExpected: null })
  }

  // ⚠️ C0 的可写性对照会删掉该路径的文件、再写一个新文件 —— 对硬链接而言这等于
  // 把链接换成普通文件。故此处**重建硬链接**后再测，否则测的是「工作区外的普通文件」
  // （必被拒），而不是「工作区内文件的别名」（上游声明可写）。
  rmSync(HARD_LINK, { force: true })
  // inside.txt 已被前述探针的清场删掉（每格测完都会删目标），故重建后再链接
  writeFileSync(INSIDE_TARGET, 'seed')
  linkSync(INSIDE_TARGET, HARD_LINK)
  attempt('E3_ws_write_via_hardlink', writeArgv(HARD_LINK), wsPolicy, 'SUCCESS', HARD_LINK, verifyWrote(HARD_LINK))

  // ── D 组：拒绝方言覆盖对照（同一拒绝、不同子进程，看谁被 provider 的方言覆盖）──
  // 上游 denialSignatures 的注释声称覆盖 pwsh/.NET、cmd、node 三类；实测哪几类真被覆盖。
  {
    // pwsh 未必安装（Win11 自带的是 Windows PowerShell 5.1）——实测哪一个在，并记录
    const hasPwsh = spawnSync('pwsh', ['-NoProfile', '-Command', 'exit 0'], { timeout: 15_000 }).status === 0
    const shell = hasPwsh ? 'pwsh' : 'powershell'
    r.selfTests.dialectShellUsed = { shell, pwshInstalled: hasPwsh }
    attempt(
      `D1_${shell}_child_write_outside`,
      [shell, '-NoProfile', '-NonInteractive', '-Command', `Set-Content -Path '${OUTSIDE_TARGET}' -Value x`],
      wsPolicy, 'DENIED', OUTSIDE_TARGET, verifyWrote(OUTSIDE_TARGET),
    )
    // 目标路径不含空格，故不加内层引号（首版加了引号，cmd 报「语法不正确」，
    // 那是我的命令构造问题，不是沙箱现象）
    attempt(
      'D2_cmd_child_write_outside',
      ['cmd', '/c', `echo x > ${OUTSIDE_TARGET}`],
      wsPolicy, 'DENIED', OUTSIDE_TARGET, verifyWrote(OUTSIDE_TARGET),
    )
  }

  // ── S4 方言正向对照：证明「未命中方言」是**文本**不匹配，而非匹配逻辑坏了 ──
  // 让受限子进程主动输出上游声明的英文方言串，判定器应当判 DENIED。
  {
    const o = run(sandbox.confine(
      [process.execPath, '-e', "process.stderr.write('Access is denied.\\n');process.exit(1)"],
      wsPolicy,
    ).argv, null)
    const c = classify(o, contract as ConfinedArgv, null, null)
    r.selfTests.dialectPositiveControl = {
      injectedStderr: 'Access is denied.',
      exitCode: o.exitCode,
      verdict: c.verdict,
      denialMatch: c.denialMatch,
      passed: c.verdict === 'DENIED',
      note: '期望 DENIED —— 证明匹配逻辑本身可用，前述未命中是文本（方言/语言）问题',
    }
    log(`[SANDBOX-PROBE] S4 方言正向对照: ${c.verdict}（须为 DENIED）\n`)
  }

  // ── sessionId 组：走 provider 的 AclWriteGrant 物化路径（DSH 生产路径）──
  // 真实会话走这条；sessionId 用构造值，运行时只被 String() 与 SID 派发使用。
  const sidPolicy: SandboxPolicyLike = { mode: 'workspace-write', workspaceRoot: WORKSPACE, sessionId: 'probe-session-0001' }
  attempt('P5_session_ws_write_inside', writeArgv(INSIDE_TARGET), sidPolicy, 'SUCCESS', INSIDE_TARGET, verifyWrote(INSIDE_TARGET))
  attempt('P6_session_ws_write_outside', writeArgv(OUTSIDE_TARGET), sidPolicy, 'DENIED', OUTSIDE_TARGET, verifyWrote(OUTSIDE_TARGET))

  // ── 信息项：网络（上游声明「写受限，读/网络不受限」）────────────────────
  // 双向对照：无沙箱也连不上 → 环境问题，不下结论；只有「无沙箱通、沙箱内也通」
  // 或「无沙箱通、沙箱内不通」才有信息量。
  {
    const c0 = run(netArgv(), null)
    const confinedNet = run(sandbox.confine(netArgv(), roPolicy).argv, null)
    const c0Ok = c0.stdout.includes('CONNECTED')
    const cOk = confinedNet.stdout.includes('CONNECTED')
    r.informational.networkUnderReadOnly = {
      note: 'INFORMATIONAL —— 与网络环境相关，不作为判定项',
      unconfined: { exitCode: c0.exitCode, stdout: c0.stdout.slice(0, 100) },
      confinedReadOnly: { exitCode: confinedNet.exitCode, stdout: confinedNet.stdout.slice(0, 100) },
      verdict: !c0Ok
        ? 'INCONCLUSIVE —— 无沙箱对照也未连通，环境相关，不下结论'
        : cOk ? '沙箱内仍可外联（与上游「网络不受限」一致）' : '沙箱内不可外联（与上游声明不符）',
    }
    log(`[SANDBOX-PROBE] 网络信息项: 无沙箱=${c0Ok ? '通' : '不通'} / 沙箱内=${cOk ? '通' : '不通'}\n`)
  }

  // ── 残留取证（不清理，留给报告；provider 的私有 temp 由 dispose 回收，
  //     而本探针以 process.exit 结束，teardown 不跑 → 这是预期内的已知残留）──
  const tempAfter = dshTempDirs()
  r.residue = {
    dshTempDirsBefore: tempBefore,
    dshTempDirsAfter: tempAfter,
    newDshTempDirs: tempAfter.filter(d => !tempBefore.includes(d)),
    note: 'provider 私有 temp 目录；process.exit 跳过 cordis teardown，故未回收',
  }

  // 清理探针自建目录（工作区 ACE 随目录删除而消失）
  icacls([EVERYONE_DIR, '/remove:g', '*S-1-1-0'])
  rmSync(ROOT, { recursive: true, force: true })
  rmSync(OUTSIDE_ROOT, { recursive: true, force: true })
  rmSync(AMBIENT_TEMP_TARGET, { force: true })
  return finish()
}

/** 插件入口：cordis 加载本 bundle 后立即执行探测（不声明 inject，见文件头）。 */
export function apply(ctx: Context): void {
  // S0 入口 breadcrumb：没有这一行就说明探针压根没跑，与「沙箱不可用」不是一回事
  log('[SANDBOX-PROBE] apply() entered (bundle loaded by cordis)\n')
  void (async () => {
    try {
      await probe(ctx)
    } catch (e) {
      out(`\n--- SANDBOX PROBE JSON ---\n${JSON.stringify({ fatal: `探针自身异常：${String(e)}` }, null, 2)}\n--- PROBE-END ---\n`)
      process.exit(1)
    }
  })()
}
