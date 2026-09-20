/**
 * DSH-3.1 · S0 基础链路 e2e（首个产品插件的四项硬判据 ＋ 四条负向对照）
 *
 * **姿态自证**（§3.6〈执行范式与边界〉要求 —— 判据姿势不对会同时造出假绿与假红）：
 *   - 模拟的真实链路：客户端 → `sdk` JSON-RPC（stdio） → session create → agent loop 挂**自做工具 `read_file`**
 *     → 真实 LLM 调用 → 回客户端 → session 落盘 → 回读
 *   - 执行器：`harness/node_modules/@deepseek-ai/dsh`（0.1.5-rc.2，即 profile 的 CLI）
 *   - 前导：**无**（不经 CLI 子命令，直接走 SDK 的 stdio 通道）
 *   - home＋profile：`<临时 home>` 里 **`cp -r` 出来的 sdk profile 真副本**（**不穿透源 profile**，见派发稿 §5(a)）
 *   - 凭据来源层：**环境变量**（`tests/isolated-setup.ts` 把 DSH_HOME 强制覆盖 ⇒ 本链路读不到 `.credentials.yaml`）
 *   - nonce 设计：nonce **只写在文件里、不进 prompt** ⇒ 判据 ① 一旦绿灯即证明"工具真的读到并回了内容"，
 *     而不是"模型把 prompt 里的串复述了一遍"
 *
 * 变体（`S0_VARIANT`，一条命令复跑见 `scripts/run-s0-e2e.mjs`）：
 *   base（默认）｜ no-bundle ｜ wrong-key ｜ no-session-dir ｜ kill-client
 */
import { spawn, spawnSync } from 'node:child_process'
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'
import {
  INITIALIZE_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
  evaluateRun,
  injectedKey,
  realApiEnabled,
  realApiModel,
} from './real-api'
import { findToolCalls, listSessionLogs, readSessionText } from './s0-session-log'

const VARIANT = process.env.S0_VARIANT ?? 'base'
const harnessDir = resolve(import.meta.dirname, '..')
const repoDir = resolve(harnessDir, '..')
const PLUGIN_DIR = join(harnessDir, 'packages', 'plugin-tool-readfile')
const DSH_BIN = join(harnessDir, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const MARKER_NAME = 'plugin-tool-readfile.activate.log'
const BAD_KEY = process.env.DSH_REAL_API_BAD_KEY ?? 'sk-invalid-0000000000000000000000000000'
const EVIDENCE_DIR = process.env.S0_EVIDENCE_DIR ?? join(tmpdir(), 'larry-s0-evidence')

interface Evidence {
  variant: string
  triple: { DSH_HOME: string; profile: string; credentialsSourceLayer: string }
  activation?: { markerPath: string; events: string[]; raw?: string }
  criteria?: Record<string, unknown>
  verdictText?: string
  sessionLog?: { path: string; logPresent: boolean; bytes: number; containsNonce: boolean; tail?: string }
  toolCallRaw?: string
  notes: string[]
}

let home = ''
let nonce = ''
let noncePath = ''
let evidence: Evidence
let finalResponse = ''
let verdict: ReturnType<typeof evaluateRun> | undefined
let sessionText: { path: string; text: string } | null = null
let markerRaw = ''

function markerPath(): string {
  return join(home, MARKER_NAME)
}

function markerEvents(): string[] {
  if (!existsSync(markerPath())) return []
  return readFileSync(markerPath(), 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => {
      try {
        return String(JSON.parse(l).event ?? '(no-event)')
      } catch {
        return '(unparsable)'
      }
    })
}

/** 把插件装进**临时 home 的副本 profile**（源 profile 不动）。 */
function installPlugin(): string {
  const r = spawnSync(process.execPath, [DSH_BIN, 'plugin', '--profile', 'sdk', 'add', PLUGIN_DIR], {
    cwd: harnessDir,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, DSH_HOME: home, CI: '1' },
  })
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
  // ⚠️ 已知坑：pnpm 报 `Done in …` 后 node 不退出（CVM 实测挂 1:51）⇒ 见到 Done 即视为装成功
  const done = /Done in .*pnpm/.test(out)
  evidence.notes.push(`plugin add: exit=${r.status} signal=${r.signal ?? '-'} pnpmDone=${done} :: ${out.trim().split('\n').slice(-2).join(' | ').slice(0, 300)}`)
  return out
}

/**
 * 修复 `cp -r` 副本继承的**源 profile pnpm 元数据**（DSH-3.7.4）。
 *
 * 成因（本机 pnpm 11.7.0 实物源码 `dist/pnpm.mjs:155097-155119` 的 `writeModulesManifest`）：
 * ```js
 * if (!isWindows()) {                                     // ← 155114
 *   saveModules.virtualStoreDir = path.relative(modulesDir, saveModules.virtualStoreDir)  // ← 155115
 * }
 * ```
 * ⇒ `.modules.yaml` 里的 `virtualStoreDir` **在 Windows 上必然写绝对、在 POSIX 上写相对**
 *（相对基是 `modulesDir`，即 `<proj>/node_modules`）。副本逐字节复制过来后，pnpm 拿它
 * 与自己算出的位置比对（`checkCompatibility`，同文件 `:187868` / `:187875`），不一致即抛
 * `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`（或 `storeDir` 不一致时的 `ERR_PNPM_UNEXPECTED_STORE`）
 * 并在**解析依赖之前**退出（实测 1 s）—— 这就是本机五变体全红、CVM 全绿的原因
 *（CVM 是 Linux ⇒ 源里本来就是相对值 ⇒ 副本也该是相对值）。
 *
 * 修法：**删掉副本的 `node_modules/.modules.yaml`**，让 pnpm 按当下环境重算。
 * 为什么不是"把值改写成 .pnpm"（该写法实测也能绿）：一个文件里**不止一个**绝对路径字段 ——
 * 实测 `storeDir` 同样会咬（用 `~/.dsh/profiles` 作源时红的是 `ERR_PNPM_UNEXPECTED_STORE`）。
 * 删掉是唯一对"所有继承字段"都成立的做法，代价只是 pnpm 重建清单（实测 +9 s）。
 * 对照实验（唯一变量 = 副本 `.modules.yaml`）：原样=红 ／ 副本自身绝对=绿 ／ `.pnpm`=绿 ／ **删=绿**。
 */
function repairCopiedPnpmMetadata(): void {
  const modulesYaml = join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml')
  if (!existsSync(modulesYaml)) {
    evidence.notes.push('repair: 副本无 node_modules/.modules.yaml（跳过）')
    return
  }
  const raw = readFileSync(modulesYaml, 'utf8')
  const recorded = [...raw.matchAll(/"(virtualStoreDir|storeDir)":\s*"([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`)
  rmSync(modulesYaml, { force: true })
  evidence.notes.push(
    `repair: 删除副本 node_modules/.modules.yaml（源记录的绝对路径：${recorded.join(' ｜ ')}）` +
      '（DSH-3.7.4；改的是副本，源 profile 未动）',
  )
}

/** 负向对照 1 的破坏动作：把自做 bundle 从 profile manifest 里摘掉（等价于"注释掉 bundle"）。 */
function dropBundleFromManifest(): void {
  const pj = join(home, 'profiles', 'sdk', 'package.json')
  const doc = JSON.parse(readFileSync(pj, 'utf8'))
  const before: string[] = doc?.dsh?.profile?.bundles ?? []
  doc.dsh = doc.dsh ?? {}
  doc.dsh.profile = doc.dsh.profile ?? {}
  doc.dsh.profile.bundles = before.filter((b) => !b.includes('plugin-tool-readfile'))
  writeFileSync(pj, `${JSON.stringify(doc, null, 2)}\n`)
  evidence.notes.push(`no-bundle: bundles ${JSON.stringify(before)} -> ${JSON.stringify(doc.dsh.profile.bundles)}`)
}

function buildPrompt(): string {
  return (
    `Use the read_file tool to read the file at ${noncePath}. ` +
    'Then reply with exactly the PING token that appears inside that file. Reply with the token only.'
  )
}

async function runPrompt(key: string): Promise<{ response: string; verdict: ReturnType<typeof evaluateRun>; sessionId: string }> {
  const harness = new DeepSeekHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: realApiModel(),
    dshHome: home,
    env: { ...process.env, DEEPSEEK_API_KEY: key },
    initializeTimeoutMs: INITIALIZE_TIMEOUT_MS,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
  })
  try {
    const result = await harness.run(buildPrompt())
    const v = evaluateRun(result)
    evidence.verdictText = Object.entries(v)
      .map(([k, val]) => `${k}=${JSON.stringify(val)}`)
      .join(' ')
    return { response: result.finalResponse ?? '', verdict: v, sessionId: result.sessionId }
  } finally {
    await harness.close().catch(() => undefined)
  }
}

/**
 * 负向对照 4 的破坏动作：**在"落盘刚起笔"的那一刻**杀掉 SDK 客户端进程组，看已写入部分留成什么样。
 *
 * ⚠️ 为什么不是"固定 2.5s 后杀"（原设计，实测**不成立**）：一次单工具回合 ~1.5s 就跑完并整段落盘，
 * 定时杀落在**回合结束之后** ⇒ 日志完整含 nonce，④ 依旧是绿的（该变体当时红灯的是我自己写错的断言，
 * 不是被测判据）。故改成**事件驱动**：轮询到会话日志文件**首次出现且字节数 > 0** 就立刻杀
 * —— 此时"文件存在"这一弱判据已成立，而工具结果（唯一携带 nonce 的东西）尚未落盘。
 *
 * ⚠️ 另两个坑：① 必须杀**进程组**（`detached` ＋ `kill(-pid)`）—— harness 的 dsh CLI 是孙进程，
 * 只杀直接子进程会留下它继续把回合写完，日志照样含 nonce（不确定的假绿）；
 * ② 杀完要**等文件落定**再读，否则读到"正在写的中间态"。
 */
async function killClientRun(): Promise<{ summary: string; killedBy: string; bytesAtKill: number }> {
  const fallbackMs = Number(process.env.S0_KILL_AFTER_MS ?? 8000)
  const child = spawn(
    process.execPath,
    [join(harnessDir, 'scripts', 's0-kill-child.mjs'), home, noncePath, realApiModel()],
    {
      cwd: harnessDir,
      env: { ...process.env }, // Key 原样透传（本变体必须用真 key 才能真跑到一半）
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true, // 自成进程组 ⇒ 可以整组杀
    },
  )
  let out = ''
  child.stdout.on('data', (d) => (out += d))
  child.stderr.on('data', (d) => (out += d))

  const started = Date.now()
  let killedBy = 'fallback-timeout'
  let bytesAtKill = 0
  while (Date.now() - started < fallbackMs) {
    const logs = listSessionLogs(join(home, 'sessions'))
    if (logs.length > 0) {
      let size = 0
      try {
        size = statSync(logs[0]!).size
      } catch {
        size = 0
      }
      if (size > 0) {
        killedBy = 'first-session-log-byte'
        bytesAtKill = size
        break
      }
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      killedBy = 'child-exited-first'
      break
    }
    await new Promise((r) => setTimeout(r, 25))
  }

  try {
    if (child.pid !== undefined) process.kill(-child.pid, 'SIGKILL') // 整组（含孙进程 dsh CLI）
  } catch {
    try {
      child.kill('SIGKILL')
    } catch {
      /* 已退出 */
    }
  }
  await new Promise((r) => setTimeout(r, 2000)) // 等落定再回读
  return {
    summary:
      `killedBy=${killedBy} bytesAtKill=${bytesAtKill} pid=${child.pid} ` +
      `exitCode=${String(child.exitCode)} signal=${String(child.signalCode)} soFar=${out.slice(0, 160)}`,
    killedBy,
    bytesAtKill,
  }
}

beforeAll(() => {
  evidence = {
    variant: VARIANT,
    triple: {
      DSH_HOME: '(per-run temp home)',
      profile: 'sdk（cp -r 真副本，源 profile 不动）',
      credentialsSourceLayer: '环境变量 DEEPSEEK_API_KEY（real-api 链路读不到 .credentials.yaml）',
    },
    notes: [],
  }
  // 开关把关在 describe.skipIf（本 beforeAll 只在开关已开时才会跑到）

  const srcProfiles = process.env.DSH_REAL_API_PROFILE_HOME ?? join(repoDir, '.dsh-home', 'profiles')
  const srcSdk = join(srcProfiles, 'sdk')
  if (!existsSync(join(srcSdk, 'package.json'))) {
    throw new Error(`缺少 sdk profile：${srcSdk}（用 DSH_REAL_API_PROFILE_HOME 指到装好的 profiles 目录）`)
  }
  home = mkdtempSync(join(tmpdir(), 'larry-s0-'))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(srcSdk, join(home, 'profiles', 'sdk'), { recursive: true })
  repairCopiedPnpmMetadata() // DSH-3.7.4：副本不得沿用**源** profile 的 pnpm 元数据（绝对路径）
  evidence.triple.DSH_HOME = home

  nonce = `PING-${randomBytes(6).toString('hex')}`
  noncePath = join(home, 's0-nonce.txt')
  writeFileSync(noncePath, `S0 e2e nonce file (this token is NOT in the prompt)\n${nonce}\n`)

  // 插件安装（除 no-bundle 之外都要真装上；no-bundle 装完再摘 bundle）
  installPlugin()
  if (VARIANT === 'no-bundle') dropBundleFromManifest()

  if (VARIANT === 'no-session-dir') {
    // ⚠️ DSH-3.7.4 实测（本机 Windows）：`chmodSync(dir, 0o500)` **完全无效** —— Node 在 Windows 上
    //    对目录只翻"只读"属性，Windows 对目录忽略该属性 ⇒ 落盘照常成功（2026-09-20 实测：
    //    ③ 全绿 / logPresent=true / ④ 仍含 nonce ⇒ 本变体的断言必红，是**平台缺陷**不是判据缺陷）。
    //    Windows 上的等效手段 = **ACL 拒绝**（`icacls <dir> /deny <me>:(AD,WD)`）：实测子项
    //    创建/写入均返回 `EPERM: operation not permitted`，与 POSIX 的 `EACCES` 同类，
    //    且**可撤销**（`/remove:d`）。POSIX 分支保持原样（`chmod 500`），不改动已绿的 CVM 侧行为。
    const dir = join(home, 'sessions')
    mkdirSync(dir, { recursive: true })
    if (process.platform === 'win32') {
      const me = `${process.env.USERDOMAIN ?? ''}\\${process.env.USERNAME ?? ''}`
      const r = spawnSync('icacls', [dir, '/deny', `${me}:(AD,WD)`], { encoding: 'utf8' })
      const tail = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').pop() ?? ''
      evidence.notes.push(`no-session-dir: icacls /deny ${me}:(AD,WD) exit=${r.status} :: ${tail.trim()}`)
      if (r.status !== 0) {
        // 拒绝静默降级：ACL 没设上 ⇒ 破坏动作未发生，让断言按实测变红（不可伪装成"通过"）
        evidence.notes.push('no-session-dir: ⛔ ACL 未设上 ⇒ 本变体的破坏动作**未生效**')
      }
    } else {
      chmodSync(dir, 0o500) // 只读 ⇒ 落盘必失败
      evidence.notes.push('no-session-dir: <home>/sessions chmod 500（只读）')
    }
  }
}, 900_000)

/**
 * 开关：**默认关**。不设 `DSH_REAL_API=1` 时整组 SKIP（与 `tests/real-api.test.ts` 同口径：
 * skip ≠ pass —— 用例必须显示为 skipped，禁止"无开关就当通过"；也**不得**让默认 `npm test` 变红）。
 */
const ENABLED = realApiEnabled()

describe.skipIf(!ENABLED)(`S0 基础链路（variant=${VARIANT}）`, () => {
  it('四项判据 / 负向对照', async () => {
    if (VARIANT === 'kill-client') {
      const kc = await killClientRun()
      evidence.notes.push(`kill-client: ${kc.summary.slice(0, 300)}`)
      // ⭐ 破坏动作的生效锚（2026-09-17 复验发现）：只断言 ④ 为假，会被"日志从未创建"
      //    这一平凡情形同样满足（假通过）⇒ 把"何时杀的 / 杀时已写多少"一并留证（见下方断言）。
      evidence.criteria = { '④_killedBy': kc.killedBy, '④_bytesAtKill': kc.bytesAtKill }
    } else {
      // base 用**环境里注入的真 key**（由 run-s0-e2e / s0-run-with-file-key 注入）；
      // wrong-key 变体换成明示无效的占位串（判据 ③ 的负向对照）。
      const key = VARIANT === 'wrong-key' ? BAD_KEY : injectedKey(process.env)
      if (key === undefined) throw new Error('未检测到 DEEPSEEK_API_KEY：base 变体必须用真 key（只判存在性、不打印）')
      const run = await runPrompt(key)
      finalResponse = run.response
      verdict = run.verdict
      evidence.notes.push(`sessionId=${run.sessionId}`)
      evidence.criteria = {
        '①_pingInResponse': run.response.includes(nonce),
        '③_verdictOk': run.verdict.ok,
        '③_turnEndKind': run.verdict.turnEndKind,
        '③_errorCode': run.verdict.errorCode,
        '③_finalResponseLen': run.verdict.finalResponseLength,
      }
    }

    markerRaw = existsSync(markerPath()) ? readFileSync(markerPath(), 'utf8') : ''
    const events = markerEvents()
    evidence.activation = { markerPath: markerPath(), events, raw: markerRaw.slice(0, 1200) }

    sessionText = readSessionText(home)
    const toolCalls = sessionText === null ? { names: [], firstRaw: undefined } : findToolCalls(sessionText.text)
    evidence.sessionLog = {
      path: sessionText?.path ?? '(none)',
      logPresent: sessionText !== null,
      bytes: sessionText === null ? 0 : Buffer.byteLength(sessionText.text, 'utf8'),
      containsNonce: sessionText?.text.includes(nonce) ?? false,
      tail: sessionText?.text.slice(-400),
    }
    evidence.criteria = {
      ...(evidence.criteria ?? {}),
      '①_pingInResponse': finalResponse.includes(nonce),
      // ⭐ 防假绿：① 的内容断言不能证明是"我们的工具"读的（官方还有一只读文件工具叫 read）
      '①_toolNameInLog': toolCalls.names,
      '①_toolNameIsOurs': toolCalls.names.includes('read_file'),
      '②_activated': events.includes('activate'),
      '②_injectFired': events.includes('inject-fired'),
      '②_toolRegistered': events.includes('tool-registered'),
      '②_registerFailed': events.includes('register-failed'),
      '②_toolCalled': events.includes('tool-call'),
      '④_sessionContainsNonce': evidence.sessionLog.containsNonce,
    }
    if (toolCalls.firstRaw !== undefined) evidence.toolCallRaw = toolCalls.firstRaw

    // 落盘证据（"产出不得是唯一副本"）
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    writeFileSync(join(EVIDENCE_DIR, `${VARIANT}.evidence.json`), JSON.stringify(evidence, null, 2))
    if (markerRaw !== '') writeFileSync(join(EVIDENCE_DIR, `${VARIANT}.marker.log`), markerRaw)
    if (sessionText !== null) writeFileSync(join(EVIDENCE_DIR, `${VARIANT}.session.txt`), sessionText.text)

    console.log(`\n===== S0 e2e evidence (variant=${VARIANT}) =====`)
    console.log(JSON.stringify(evidence, null, 2))
    console.log('===== end evidence =====\n')

    if (VARIANT === 'base') {
      expect(evidence.criteria['②_activated'], '② 插件必须在 boot 期真的 activate').toBe(true)
      expect(evidence.criteria['②_injectFired'], '② ctx.inject([tools]) 回调必须触发').toBe(true)
      expect(evidence.criteria['②_toolRegistered'], '② 工具必须注册成功（且不能是 register-failed）').toBe(true)
      expect(evidence.criteria['①_toolNameIsOurs'], '① 会话日志里的 tool/call 必须是我们那只 read_file').toBe(true)
      expect(finalResponse.includes(nonce), '① 回包必须含只存在于文件里的 nonce').toBe(true)
      expect(verdict?.ok, '③ 真实回包非空 ＋ turn/end.kind=completed').toBe(true)
      expect(evidence.sessionLog.containsNonce, '④ 落盘回读必须能查到同一 nonce').toBe(true)
      return
    }
    if (VARIANT === 'no-bundle') {
      // ⚠️ 订正（实测）：本变体破坏的是 **② plugin mount**，故只该断言 ② 变红。
      // 原稿还断言「① 也应红（没有工具可读）」—— **错**：官方 `dsh-tool-fs` 也有读文件工具
      // （名叫 `read`），摘掉我们的 bundle 后模型改用官方那只，nonce 照样读得到 ⇒ ① 的
      // **内容断言对这一破坏不敏感**。① 里真正会红的是**工具名归属**（不是我们的 read_file），
      // 这也正是 base 里必须单独断言 `①_toolNameIsOurs` 的理由（防假绿）。
      expect(evidence.criteria['②_activated'], '负向 1：摘掉 bundle 后 ② 必须变红').toBe(false)
      expect(evidence.criteria['①_toolNameIsOurs'], '负向 1：tool/call 的工具名不应再是我们的 read_file').toBe(false)
      return
    }
    if (VARIANT === 'wrong-key') {
      expect(verdict?.ok, '负向 2：错 Key 时 ③ 必须红').toBe(false)
      expect(verdict?.errorCode, '负向 2：必须给出 error.code').toBeTruthy()
      expect(evidence.criteria['②_activated'], '负向 2：插件本身仍应激活（③ 才是被破坏的那条）').toBe(true)
      return
    }
    if (VARIANT === 'no-session-dir') {
      // ⭐ 补锚（2026-09-17 复验发现）：仅断言 ④ 为假，会被"整条链路压根没起来"平凡满足（假通过）。
      //   实测（CVM 09-17）：本变体下 ③ **也**红 —— turnEndKind=error / errorCode=UNKNOWN、
      //   finalResponse 空、toolNameInLog 空 ⇒ 只读 sessions 目录让 **session 创建即失败**，
      //   模型根本没被调到。故唯一可用的"链路是活的"锚是**插件激活层**（实测 true）。
      //   ⚠️ 记：本变体的真实破坏面**大于**其名（不止打掉 ④）—— 别据此断言 ③ 必须绿，
      //     那是当下实现的副作用，不是判据要求（DSH 若改成"落盘失败不阻断回合"，③ 就该变绿）。
      expect(evidence.criteria['②_activated'], '负向 3：插件激活层必须仍是绿的（否则"红"可能只是链路没起来）').toBe(true)
      expect(evidence.sessionLog.logPresent, '负向 3：落盘应当确实没发生（文件不存在，而非"存在但无 nonce"）').toBe(false)
      expect(evidence.criteria['④_sessionContainsNonce'], '负向 3：落盘目录只读后 ④ 必须红').toBe(false)
      return
    }
    if (VARIANT === 'kill-client') {
      // ④ 的红灯形态 = 「**文件已存在且已写了 N 字节**，但回读查不到 nonce」——
      // 这同时否掉"文件存在就算 ④ 过"这一弱判据（派发稿 §1 判据 ④ 明文：不是「文件存在 / 条数够」）。
      //
      // ⭐ 补锚（2026-09-17 复验发现）：上面这条形态**此前只写在注释里、没进断言** ——
      //   仅断言 ④ 为假时，"日志从未创建"（环境没起来）同样满足（假通过）。
      //   实测（CVM 09-17）：logPresent=true / bytes=995（杀时 636，杀后仍涨到 995 ⇒ 必须"等落定再读"）。
      expect(evidence.criteria['④_killedBy'], '负向 4：破坏动作须在客户端仍存活时执行（不能是它已跑完退出后再补杀）').not.toBe('child-exited-first')
      expect(evidence.sessionLog.logPresent, '负向 4：日志文件必须已存在（否则是"从未落盘"，不是"写到一半被杀"）').toBe(true)
      expect(evidence.sessionLog.bytes, '负向 4：必须已写入 > 0 字节（实证 995 B）').toBeGreaterThan(0)
      expect(evidence.criteria['④_sessionContainsNonce'], '负向 4：客户端在中途被杀后，回读不得含完整 nonce').toBe(false)
      return
    }
    throw new Error(`未知变体：${VARIANT}`)
  }, 900_000)
})

afterAll(() => {
  // 证据已复制到 EVIDENCE_DIR；home 里含 node_modules 副本，跑完即删（先恢复 sessions 权限）
  try {
    const sessions = join(home, 'sessions')
    if (existsSync(sessions)) {
      // Windows：先撤销 no-session-dir 变体设下的 ACL 拒绝，否则子项删不掉（撤销是幂等的）
      if (process.platform === 'win32') {
        const me = `${process.env.USERDOMAIN ?? ''}\\${process.env.USERNAME ?? ''}`
        spawnSync('icacls', [sessions, '/remove:d', me], { encoding: 'utf8' })
      }
      chmodSync(sessions, 0o700)
    }
    if (home !== '') rmSync(home, { recursive: true, force: true })
  } catch {
    /* 清理失败不影响判据（证据已落 EVIDENCE_DIR） */
  }
  // ⚠️ DSH-3.7.4 实测：这里**必须给超时**。home 是 sdk profile 的完整副本（含 node_modules，
  //    实测 300 包 / 243 待链），`rmSync` 在 Windows 上会超过 vitest 默认 hookTimeout（10 s）
  //    ⇒ 报 `Hook timed out in 10000ms`，**测试本身已过**却把套件判红（wrong-key/kill-client 实测命中）。
}, 900_000)
