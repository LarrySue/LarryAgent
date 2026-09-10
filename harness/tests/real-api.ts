/**
 * 真实调用断言机制（DSH-3 前置件 1；等价 Python 侧的 `--real-api` 分层）
 *
 * 设计要点——每条都对应一次实测教训，改动前先读：
 *
 * 1. **开关默认关**：不设 `DSH_REAL_API=1` 时，真实调用用例一律 skip。
 *    🔴 skip ≠ pass：用例必须显示为 skipped，且禁止"无 Key 就当通过"。
 *    R1 场景（开关开 + 错误 Key）必须判 **fail**——既不是 skip 也不是 pass。
 *
 * 2. **判据**（取自 docs/dsh/dsh-local-env.md §6 四组对照实跑，勿回退）：
 *    成功 ⇔ `assistant/message` 事件存在 ∧ `finalResponse` 非空 ∧ 无 error 类 turn/end.reason
 *    - `exit 0` / session 建立 / 有事件流：三项在三种失败场景下与成功**完全一致**
 *      （WB 实测：无 Key/错误 Key/已关闭 Key 全是 exit 0）→ **一律不得作判据**。
 *    - ⚠️ 口径注记：判据原文写作「turn/end.reason 不存在」，但实测**成功跑必然带**
 *      `turn/end.data.reason = { kind: 'completed' }`（证据：2026-09-09 两次有效 Key
 *      会话 session-64832acf / session-793c14d8 的落盘事件；失败跑带
 *      `{ kind: 'error', error: { code } }`）。故实现为「不存在 kind==='error' 的
 *      reason，且正常完成必须带 completed」——此口径差异已在交付报告暴露，待 WB 复核。
 *    - `max-tokens` / `aborted` / `blocked` / `interrupted` 等非 completed 收尾同样判红
 *      （它们是"异常收尾"，契约哨兵必须显形而不是静默放行）。
 *
 * 3. **失败必须输出 `turn/end.reason.error.code`**（如 `MISSING_CREDENTIAL` / `AUTH`）。
 *    ⚠️ **错误 Key 与已关闭 Key 同为 AUTH/401，输出层不可区分**——禁止据此写
 *    "自动判因"逻辑；要区分只能凭 Key 后 4 位回查平台。
 *
 * 4. **Key 只走环境变量**：不落任何文件（含本文件、报告、fixture、日志）。
 *    子进程 env 显式构造（SDK 语义：传 env 即整体替换父 env），最后一步覆写
 *    `DEEPSEEK_API_KEY` = 注入值——保证子进程用的就是我们注入的 key，
 *    而不是父进程环境里可能存在的其它凭据。
 *
 * 5. **会话数据隔离**：临时 DSH_HOME（`larry-test-` 前缀 → 被 DSH-2.4 的主进程
 *    teardown 统一"先扫后删"）。sdk profile 177MB 不可拷贝 → 用 junction 复用
 *    （已实验：rmSync 递归删除**不会**穿透 junction，目标存活，2026-09-10）。
 *    本模块不改 `process.env.DSH_HOME`（vitest 会话级隔离另有一份），
 *    临时 home 只经 SDK 的 `dshHome` 选项传递。
 *
 * 6. **环境前置：跑前清 profile 孤儿锁**（§1：每次 dsh 运行都留、孤儿锁永不自动
 *    回收；不清会伪装成 `initialize timed out` / `JSON-RPC input closed`）。
 *    只清**死 PID** 的锁（重命名备份，不删除，与 dsh 自身惯例一致）；
 *    持有者仍存活 → 不擅动，抛错停手。
 *
 * 7. **超时 ≠ 失败**：真实调用实测 ~106s，而 SDK 默认 `initializeTimeoutMs` 仅
 *    20s → 这里显式放宽（见 INITIALIZE_TIMEOUT_MS / REQUEST_TIMEOUT_MS）。
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, symlinkSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'
import type { RunResult } from '@deepseek-ai/dsh-sdk-client'
import { scanForText, scanForKeys } from './scan-keys'

// ---------------------------------------------------------------------------
// 开关与注入源
// ---------------------------------------------------------------------------

/** 开关环境变量：`1`/`true` 视为开启；其余（含未设）一律关闭 */
export const SWITCH_ENV = 'DSH_REAL_API'
/** Key 注入唯一通道（环境变量；禁止落盘） */
export const KEY_ENV = 'DEEPSEEK_API_KEY'
/** 模型 id 覆盖位（默认与 scripts/dsh-prompt.mjs 一致；见报告中的 id 风险提示） */
export const MODEL_ENV = 'DSH_REAL_API_MODEL'
/** R1 哨兵用的"错误 Key"来源；缺省用一个明显非法的占位串 */
export const BAD_KEY_ENV = 'DSH_REAL_API_BAD_KEY'
/** sdk profile 源目录覆盖位（默认仓库根 .dsh-home/profiles） */
export const PROFILE_HOME_ENV = 'DSH_REAL_API_PROFILE_HOME'

/**
 * 默认模型 id。2026-09-10 由 `deepseek-v4-flash` 更名（DeepSeek API 文档变更，老大指示统一）。
 * ⚠️ DSH provider（dsh-v0.1.2-rc.1）的静态 catalog 仍只声明 v4 系列 id——源码级确认未编目 id
 * 只是**查不到价格/contextWindow**（advisory 查询不拦、不抛），可直传给 API。
 * 故更名后**必须用真实调用冒烟一次**（`npm run test:real-api`）：绿 = 新 id 被 API 接受。
 */
export const DEFAULT_MODEL = 'deepseek-flash'
export const DEFAULT_BAD_KEY = 'sk-invalid-0000000000000000000000000000'

export const INITIALIZE_TIMEOUT_MS = 120_000
export const REQUEST_TIMEOUT_MS = 240_000

export function realApiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const v = env[SWITCH_ENV]
  // 只认 1/true（大小写不敏感）；其余值（含 'yes'、'0'、空串）一律视为关闭——
  // 宁可不跑，也不允许"模糊值被猜成开"而误烧 key
  return v !== undefined && /^(1|true)$/i.test(v.trim())
}

/** 读取注入 Key（仅环境变量；空白视为未提供） */
export function injectedKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = env[KEY_ENV]
  return v !== undefined && v.trim() !== '' ? v.trim() : undefined
}

export function realApiModel(env: NodeJS.ProcessEnv = process.env): string {
  return env[MODEL_ENV] ?? DEFAULT_MODEL
}

export function badKey(env: NodeJS.ProcessEnv = process.env): string {
  return env[BAD_KEY_ENV] ?? DEFAULT_BAD_KEY
}

// ---------------------------------------------------------------------------
// 断言层（核心）
// ---------------------------------------------------------------------------

/** turn/end 的 reason 形状（dsh-session `TurnEndReasonMap`；此处只取断言所需字段） */
export interface TurnEndReasonLike {
  kind: string
  error?: { code?: string; status?: number }
}

/** 断言层可观察的最小运行形态（RunResult 结构性兼容；也允许用手工 fixture 构造） */
export interface RunObservation {
  finalResponse: string
  events: readonly { type: string; data?: unknown }[]
}

export interface RunVerdict {
  ok: boolean
  turnEndKind?: string
  errorCode?: string
  errorStatus?: number
  assistantMessageCount: number
  finalResponseLength: number
  eventTypeHistogram: Record<string, number>
  /** 未通过的具体条款（人可读；ok 时为空） */
  failures: string[]
}

/**
 * 施加判据（判据原文见文件头注释 2，勿回退）。
 * @param run - 一次运行的观察结果（SDK RunResult 或等价 fixture）
 * @returns 判定结果；失败时含可读条款列表与 error.code
 */
export function evaluateRun(run: RunObservation): RunVerdict {
  const hist: Record<string, number> = {}
  let turnEndReason: TurnEndReasonLike | undefined
  for (const ev of run.events) {
    hist[ev.type] = (hist[ev.type] ?? 0) + 1
    if (ev.type === 'turn/end') {
      turnEndReason = (ev.data as { reason?: TurnEndReasonLike } | undefined)?.reason
    }
  }
  const assistantMessageCount = hist['assistant/message'] ?? 0
  const failures: string[] = []

  // 条款 1：assistant/message 事件存在（exit 0 / session / 事件流存在都不算数）
  if (assistantMessageCount === 0) {
    failures.push('缺 assistant/message 事件（§6：三种失败场景均无此事件）')
  }
  // 条款 2：finalResponse 非空
  if (run.finalResponse.length === 0) {
    failures.push('finalResponse 为空')
  }
  // 条款 3：无 error 类 turn/end.reason；正常完成必须带 completed
  if (turnEndReason === undefined) {
    failures.push('无 turn/end 事件（实测正常完成回合必带 reason.kind=completed；形态异常一律判红）')
  } else if (turnEndReason.kind !== 'completed') {
    const code = turnEndReason.error?.code ?? '(无 code)'
    const status = turnEndReason.error?.status ?? '(无 status)'
    failures.push(`turn/end.reason.kind=${turnEndReason.kind}（非 completed）code=${code} status=${status}`)
  }

  return {
    ok: failures.length === 0,
    turnEndKind: turnEndReason?.kind,
    errorCode: turnEndReason?.error?.code,
    errorStatus: turnEndReason?.error?.status,
    assistantMessageCount,
    finalResponseLength: run.finalResponse.length,
    eventTypeHistogram: hist,
    failures,
  }
}

/** 人可读单行判定（供测试输出；**只打印长度不打印正文**，避免把会话内容/日志整段泼进测试输出） */
export function formatVerdict(v: RunVerdict): string {
  const parts = [
    `verdict=${v.ok ? 'OK' : 'FAIL'}`,
    `assistant/message=${v.assistantMessageCount}`,
    `finalResponse.len=${v.finalResponseLength}`,
    `turn/end.kind=${v.turnEndKind ?? '(无事件)'}`,
  ]
  if (v.errorCode !== undefined) parts.push(`error.code=${v.errorCode}`)
  if (v.errorStatus !== undefined) parts.push(`error.status=${v.errorStatus}`)
  parts.push(`events=${JSON.stringify(v.eventTypeHistogram)}`)
  if (!v.ok) parts.push(`failures=[${v.failures.join(' | ')}]`)
  return parts.join(' ')
}

/** 断言成功：失败时抛错并带完整判定（含 error.code），便于人查因 */
export function expectRealApiSuccess(run: RunObservation): RunVerdict {
  const v = evaluateRun(run)
  if (!v.ok) {
    throw new Error(`真实调用判据未通过：\n  ${formatVerdict(v)}`)
  }
  return v
}

// ---------------------------------------------------------------------------
// 环境前置：孤儿锁
// ---------------------------------------------------------------------------

export interface LockAction {
  action: 'none' | 'renamed' | 'live' | 'error'
  lockPath: string
  detail?: string
}

/**
 * 清理 profile 孤儿锁（见 docs/dsh/dsh-local-env.md §1）。
 * 只处理**死 PID**的锁：重命名备份（`node_modules.lock.bak.<ms>`），不删除——
 * 与 dsh 自身惯例一致，且孤儿锁永不自动回收是设计选择，不是 bug。
 * @param profilesDir - profile 目录（含 node_modules.lock 的那一层）
 * @returns 动作记录；`live` 表示持有者仍存活，调用方应停手
 */
export function releaseOrphanProfileLock(profilesDir: string): LockAction {
  const lockPath = join(profilesDir, 'node_modules.lock')
  if (!existsSync(lockPath)) return { action: 'none', lockPath }

  let raw = ''
  try {
    raw = readFileSync(lockPath, 'utf-8').trim()
  } catch (e) {
    return { action: 'error', lockPath, detail: `读锁失败: ${e}` }
  }
  const pid = Number.parseInt(raw, 10)
  if (!Number.isInteger(pid) || pid <= 0) {
    // 内容不是 PID → 不认识的状态，按"活跃"保守处理，不擅动
    return { action: 'live', lockPath, detail: `锁内容非 PID（${JSON.stringify(raw.slice(0, 16))}），保守处理` }
  }
  let alive = true
  try {
    process.kill(pid, 0)
  } catch (e) {
    // ESRCH = 进程不存在；EPERM 等 = 存在但无权限 → 视为存活
    alive = (e as NodeJS.ErrnoException).code !== 'ESRCH'
  }
  if (alive) return { action: 'live', lockPath, detail: `持有者 PID ${pid} 仍存活` }

  const backup = `${lockPath}.bak.${Date.now()}`
  renameSync(lockPath, backup)
  return { action: 'renamed', lockPath, detail: backup }
}

/** 全局 profile 目录（§1 观测到的孤儿锁所在） */
export function globalProfilesDir(): string {
  return join(homedir(), '.dsh', 'profiles')
}

/** sdk profile 源目录（默认仓库根 .dsh-home/profiles） */
export function realApiProfileSource(): string {
  return process.env[PROFILE_HOME_ENV] ?? resolve(import.meta.dirname, '../../.dsh-home/profiles')
}

// ---------------------------------------------------------------------------
// 临时 DSH_HOME（sessions/storages 落临时目录；sdk profile 走 junction）
// ---------------------------------------------------------------------------

export interface RealApiHome {
  /** 临时 DSH_HOME（`larry-test-` 前缀 → 被主进程 teardown 扫描 + 清理） */
  home: string
  profilesDir: string
  sdkProfileLink: string
  sourceProfiles: string
}

export function createRealApiHome(): RealApiHome {
  const sourceProfiles = realApiProfileSource()
  const sourceSdk = join(sourceProfiles, 'sdk')
  if (!existsSync(join(sourceSdk, 'package.json'))) {
    throw new Error(
      `缺少 sdk profile：${sourceSdk} 不存在（先按 docs/dsh/dsh-23-vue-tauri-connect-trae.md §4.1 建 profile，` +
        `或用 ${PROFILE_HOME_ENV} 指定源目录）`
    )
  }
  const home = mkdtempSync(join(tmpdir(), 'larry-test-realapi-'))
  const profilesDir = join(home, 'profiles')
  mkdirSync(profilesDir, { recursive: true })
  const sdkProfileLink = join(profilesDir, 'sdk')
  // junction 复用真实 profile（177MB 拷贝不可行）；实测 rmSync 递归删除不穿透 junction
  symlinkSync(sourceSdk, sdkProfileLink, 'junction')
  return { home, profilesDir, sdkProfileLink, sourceProfiles }
}

// ---------------------------------------------------------------------------
// 运行器
// ---------------------------------------------------------------------------

/** 子进程 env：显式构造（SDK 语义：传 env 即整体替换父 env），最后一笔覆写注入 Key */
function buildChildEnv(key: string): NodeJS.ProcessEnv {
  return { ...process.env, [KEY_ENV]: key }
}

export interface RealPromptRun {
  result: RunResult
  verdict: RunVerdict
  durationMs: number
  home: RealApiHome
  /** `harness.close()` 的异常文本（资源生命周期自检；正常应为 undefined） */
  closeError?: string
}

/**
 * 跑一次真实 prompt。
 * 前置：开关必须已开（关闭状态下调用 = 结构性错误，直接抛，防"无 Key 假跑"）。
 * Key 只经环境变量注入；临时 home 留给 teardown 统一扫描清理（不在本函数内删）。
 * @param opts - 消息、注入 Key、可选模型与请求超时
 * @returns 运行结果 + 判定 + 耗时 + 临时 home + close 异常
 */
export async function runRealPrompt(opts: {
  message: string
  key: string
  model?: string
  timeoutMs?: number
}): Promise<RealPromptRun> {
  if (!realApiEnabled()) {
    throw new Error(`真实调用被调用但开关未开（${SWITCH_ENV}≠1）——关闭状态下禁止发起真实调用`)
  }

  // 环境前置①：跑前清孤儿锁（全局 + 临时 home；见文件头注释 6）
  const pre = releaseOrphanProfileLock(globalProfilesDir())
  if (pre.action === 'live') {
    throw new Error(`全局 profile 锁被活跃进程持有，停手：${pre.detail}（${pre.lockPath}）`)
  }
  if (pre.action === 'renamed') console.log(`[real-api] 跑前清孤儿锁（重命名备份）: ${pre.detail}`)

  const home = createRealApiHome()
  const lockInHome = releaseOrphanProfileLock(home.profilesDir)
  if (lockInHome.action === 'live') {
    throw new Error(`临时 home 的 profile 锁异常存活，停手：${lockInHome.detail}`)
  }

  const harness = new DeepSeekHarness({
    profile: 'sdk',
    provider: 'deepseek-official',
    model: opts.model ?? realApiModel(),
    dshHome: home.home,
    env: buildChildEnv(opts.key),
    initializeTimeoutMs: INITIALIZE_TIMEOUT_MS,
    requestTimeoutMs: opts.timeoutMs ?? REQUEST_TIMEOUT_MS,
  })

  const started = Date.now()
  let result: RunResult | undefined
  let closeError: string | undefined
  try {
    result = await harness.run(opts.message)
  } finally {
    try {
      await harness.close()
    } catch (e) {
      closeError = e instanceof Error ? e.message : String(e)
      console.warn(`[real-api] harness.close() 失败（资源生命周期问题，须排查）: ${closeError}`)
    }
    // 环境前置②：本次运行遗留的孤儿锁（清不掉的锁下次运行会伪装成握手故障）
    const post = releaseOrphanProfileLock(globalProfilesDir())
    if (post.action === 'renamed') console.log(`[real-api] 跑后清孤儿锁（重命名备份）: ${post.detail}`)
  }
  const durationMs = Date.now() - started
  if (result === undefined) {
    throw new Error('run 未返回结果（异常已在 finally 中收尾）')
  }
  return { result, verdict: evaluateRun(result), durationMs, home, closeError }
}

// ---------------------------------------------------------------------------
// 残留自查（与 teardown 扫描同源）
// ---------------------------------------------------------------------------

/**
 * 自查临时目录无 Key 残留：既查 sk- 形态（与主进程 teardown 同判据），
 * 也查**注入 Key 原文**（key 可能不是 sk- 形态）。
 * @param dir - 临时 home
 * @param key - 本次注入的 Key（原文比对；不必落盘）
 */
export function assertNoKeyOnDisk(dir: string, key?: string): void {
  const skHits = scanForKeys(dir)
  const literalHits = key !== undefined && key.length >= 8 ? scanForText(dir, (c) => c.includes(key)) : []
  if (skHits.length > 0 || literalHits.length > 0) {
    throw new Error(
      `[real-api] Key 残留：临时目录出现疑似 key 明文（sk 形态 ${skHits.length} 处 / 原文 ${literalHits.length} 处）：` +
        `${[...skHits, ...literalHits].join(', ')} —— 主进程 teardown 亦会告警，须人工排查`
    )
  }
}
