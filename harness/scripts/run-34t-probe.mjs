#!/usr/bin/env node
/**
 * DSH-3.4-T · **独立测试件装置**（Claude ／ 本机 Windows ／ MSYS bash 通道）
 *
 * 靶子（派发稿 §0）：不是"主块的结论对不对"，而是**3.4 的判据本身有没有判别力** ——
 * 用「破坏 ＋ 对照」逼每条判据变红；恒真判据在一次成功跑里看不出来。
 *
 * 姿势自证（本脚本模拟的真实链路）
 *   - 执行器：`harness/node_modules/@deepseek-ai/dsh/lib/bin.js`（`dsh 0.1.5-rc.2`）
 *   - 链路：**dsh SDK 通道**（`dsh --profile sdk`，stdio 行分帧 JSON-RPC）
 *   - home：**临时 home 副本**（`cp -r .dsh-home/profiles/sdk` 到 `mkdtemp`；⛔ 不就地改源 profile；
 *     跑完**默认回收**（落 `homeRemoved`／失败落 `homeRemoveError`），要事后翻查就 `S34_KEEP_HOME=1` ⇒ 落 `homeKeptBecause`）
 *   - 凭据层：**启动环境**（从 `~/.dsh/.credentials.yaml` 读入内存 ⇒ 注入子进程 env；
 *     ⛔ 本脚本不打印值、不落盘值、不写进任何受版本控制的文件）
 *   - 进程内探针：`@larryagent/plugin-34t-probe`（**本件自写**，实体复制进 profile 自身层
 *     node_modules）—— T4 要求同一份数据在 (a) 事件侧 与 (b) `deriveMessages()` 两个视图上断言，
 *     而两个视图客户端都拿不到 ⇒ 必须进程内取
 *
 * 用法
 *   node harness/scripts/run-34t-probe.mjs t3                 # T3 官方谓词／完整判据执行者（0 token）
 *   node harness/scripts/run-34t-probe.mjs below              # 状态 (i)：不触发（对照臂）
 *   node harness/scripts/run-34t-probe.mjs l2                 # T1（J4/J5/J6-iii）＋ T4 断言位置对照
 *   node harness/scripts/run-34t-probe.mjs t2                 # T2 retainRatio 0.02 ／ 0.5 单调性（双锚）
 *   node harness/scripts/run-34t-probe.mjs t5                 # T5 A 落地反向对照（未禁用 profile 发 /compact）
 *
 * 退出码：`0` 判据全成立 ／ `1` 有判据不成立 ／ `2` 前置缺失 ／ `124` 看门狗超时
 */
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DshDriver } from '../packages/dsh-driver/lib/index.js'

const HARNESS = resolve(import.meta.dirname, '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const DSH_BIN = join(HARNESS, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const PROBE_SRC = join(HARNESS, 'packages', 'plugin-34t-probe')
const DISABLE_PATCH = join(HARNESS, 'scripts', 'compaction', 'disable-compact-entry.mount.patch.yml')
const EVIDENCE = process.env.S34T_EVIDENCE_DIR ?? join(resolve(REPO, '..'), '_claude-evidence', '34t')
/** 官方谓词所在包（用于装置侧解析绝对路径；进程内解析失败时作兜底）。 */
const OFFICIAL_CHECKPOINT_MODULE = join(
  HARNESS, 'node_modules', '.pnpm',
  '@deepseek-ai+dsh-compaction_55f94729c10a8681922e33113cceed9e',
  'node_modules', '@deepseek-ai', 'dsh-compaction', 'lib', 'types', 'checkpoint.js',
)

// ── 夹具常量（l2 与 t2 **必须同一夹具**，否则 retainRatio 对比不成立）───────
// 设计（第三版，读官方源码后定参，见 `dsh-compaction-basic/lib/index.js`）：
//   ① 压力：`totalTokens = 常数(6481) + Σ(节点 heuristic tokens)`（本机实测三点共线，误差 <1）
//   ② 触发：`totalTokens >= floor(window×0.8)` 才开始压；`selectCompactableRange` 从尾部
//      逐个节点累加，**凑够 `retainTokens = floor(window×ratio)` 就停** ⇒ 保留量按**节点粒度**吸附
//   ③ 若凑不够（连系统头都要算进保留）⇒ 返回 null（= 不压，静默）
//   ④ ⚠️ 压完仍 ≥ 阈值会**重试**（`compactionRetries`），重试再选中不到区间就**抛错**
//      ⇒ 夹具必须保证"只在此刻跨过阈值、且压完就回落"，否则第二次压缩会把读数搅浑（第一版 8×2200 撞上）
// 取值：5 头 × 4800 ⇒ 触发点落在**最后一头**（P(4)=27069 < 29600 ≤ P(5)=31890，两侧余量 ≈2.4k）
//       压后：0.16 → 保留 2 头（≈9642）；0.5 → 保留 4 头（≈19417，仍 < 29600 不重试）
const FIXTURE = { turns: 5, fillTokens: 4800, window: 37_000, fillInstruction: '只回一句 ok，不要调用工具。', tail: '只回一句 ok。' }
const NONCE = 'NONCE-34TBETA9'
/** 标记正则（与探针内同源；装置侧按标记做**无容差**对照时用）。 */
const MARKER_RE = /\b(FILL-\d{4}|NONCE-[A-Za-z0-9]{6,})\b/g
const THRESHOLD_RATIO = 0.8
const RETAIN_RATIO_DEFAULT = 0.16

const findings = []
const judge = (id, ok, detail, status = ok ? 'PASS' : 'FAIL') => {
  findings.push({ judge: id, ok, status, detail })
  console.log(`${status.padEnd(5)} ${id}  ${detail}`)
}
const obs = (id, detail) => judge(id, true, detail, 'OBS')
const save = (dir, name, text) => writeFileSync(join(dir, name), text ?? '', 'utf8')
const saveJson = (dir, name, v) => save(dir, name, `${JSON.stringify(v, null, 2)}\n`)
const readJsonl = (f) => (existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)] } catch { return [] } }) : [])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const argOf = (name, dflt) => { const i = process.argv.indexOf(name); return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : dflt }
const has = (name) => process.argv.includes(name)
const sum = (xs) => xs.reduce((a, b) => a + b, 0)
const approxTokens = (chars) => Math.round(chars / 4)

/** ⚠️ 只判**存在性**：从 `~/.dsh/.credentials.yaml` 把 secret 读进内存 ⇒ 子进程 env。
 *  ⛔ 值不进日志、不进证据、不进报告、不写任何文件。 */
function loadKey() {
  // ⚠️ 启动环境里**已有** key 时一律不覆盖（主人授权的临时测试 Key 走 env 前缀传入；⛔ 本模块不改它）
  if ((process.env.DEEPSEEK_API_KEY ?? '').length > 0) return { loaded: true, source: '(inherited env)', reason: null, inherited: true }
  const p = join(homedir(), '.dsh', '.credentials.yaml')
  if (!existsSync(p)) return { loaded: false, source: p, reason: 'file absent' }
  const text = readFileSync(p, 'utf8')
  const hits = [...text.matchAll(/^\s*secret:\s*['"]?([^\s'"#]+)['"]?\s*$/gm)]
  if (hits.length === 0) return { loaded: false, source: p, reason: 'no secret field' }
  process.env.DEEPSEEK_API_KEY = hits[hits.length - 1][1]
  return { loaded: true, source: p, reason: null, records: hits.length }
}

// ── 前置 ────────────────────────────────────────────────────────────────────
const keyInfo = loadKey()
const preflight = {
  when: new Date().toISOString(),
  /** 通道四元组（同机不同工具树会给出不同 node 版本与不同文件系统视图 ⇒ 结论不可跨通道互推） */
  channel: {
    shell: process.env.MSYSTEM ?? process.env.SHELL ?? '(unknown)',
    term: process.env.TERM ?? null,
    node: process.version,
    execPath: process.execPath,
    platform: process.platform,
    /** 代理：只记**存在性**，不记值 */
    proxyEnvPresent: ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY'].filter((k) => (process.env[k] ?? '').length > 0),
  },
  dshBin: DSH_BIN,
  dshBinExists: existsSync(DSH_BIN),
  dshVersion: existsSync(DSH_BIN) ? JSON.parse(readFileSync(join(HARNESS, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'), 'utf8')).version : null,
  srcProfile: SRC_SDK,
  srcProfileExists: existsSync(SRC_SDK),
  probeSrcExists: existsSync(join(PROBE_SRC, 'lib', 'index.js')),
  disablePatchExists: existsSync(DISABLE_PATCH),
  officialCheckpointModule: OFFICIAL_CHECKPOINT_MODULE,
  officialCheckpointModuleExists: existsSync(OFFICIAL_CHECKPOINT_MODULE),
  /** ⚠️ 凭据只记「来源路径 ＋ 是否载入」，**永不记值** */
  key: { loaded: keyInfo.loaded, source: keyInfo.source, reason: keyInfo.reason },
  keyPresent: (process.env.DEEPSEEK_API_KEY ?? '').length > 0,
  fixture: FIXTURE,
}
mkdirSync(EVIDENCE, { recursive: true })

const ARM = process.argv[2] ?? 'help'
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

/** 看门狗：任何臂超过 --watchdogMs（缺省 900s）即 124。 */
const watchdogMs = Number(argOf('--watchdogMs', '900000'))
const wd = setTimeout(() => { console.error(`[34t] WATCHDOG ${watchdogMs}ms ⇒ exit 124`); process.exit(124) }, watchdogMs)
wd.unref?.()

// ── 工具：临时 home（副本 ＋ 可选 A 落地 ＋ 探针实体复制）───────────────────
function makeHome({ disableCompact = false, probeCfg = [], t3 = false, execCompact = false }) {
  const home = mkdtempSync(join(tmpdir(), 'larry-34t-'))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
  // 副本不得沿用源 profile 的 pnpm 元数据（绝对路径 ⇒ ERR_PNPM_UNEXPECTED_*，3.7.4 教训）
  rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
  const patchFile = join(home, 'profiles', 'sdk', 'cordis.patch.yml')
  const before = existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : ''
  let appended = ''
  // 探针实体复制（⛔ 不 link、不放共享层 —— 3.7.2 实测教训）
  const dst = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent', 'plugin-34t-probe')
  mkdirSync(dst, { recursive: true })
  for (const f of ['package.json', 'cordis.patch.yml']) cpSync(join(PROBE_SRC, f), join(dst, f))
  cpSync(join(PROBE_SRC, 'lib'), join(dst, 'lib'), { recursive: true })
  appended += `\n# DSH-3.4-T 装置：独立探针（两个视图 ＋ T3/T5 取证）\n- insert:\n    - id: probe-34t\n      name: '@larryagent/plugin-34t-probe'\n`
  if (disableCompact) {
    appended += `\n# DSH-3.4 · A 裁定落地（受控源 = harness/scripts/compaction/disable-compact-entry.mount.patch.yml）\n${readFileSync(DISABLE_PATCH, 'utf8').split('\n').filter((l) => l.startsWith('- id:') || l.trimStart().startsWith('disabled:')).join('\n')}\n`
  }
  writeFileSync(patchFile, `${before}${appended}`, 'utf8')
  return { home, patchFile, patchAfter: readFileSync(patchFile, 'utf8'), t3, execCompact, probeCfg }
}

function makeOverlay(dir, name, lines) {
  const p = join(dir, name)
  writeFileSync(p, `${lines.join('\n')}\n`, 'utf8')
  return p
}

// ── 夹具：ASCII 填充（`FILL-####` 独占标记 ＋ 定长正文；字符数精确 = tokens*4）──
function makeFill(tokens, startIdx = 1) {
  const targetChars = tokens * 4
  const parts = []
  let chars = 0
  let i = startIdx
  while (chars < targetChars) {
    const head = `FILL-${String(i).padStart(4, '0')} `
    const body = 'x'.repeat(Math.max(1, Math.min(80, targetChars - chars - head.length - 1)))
    parts.push(head + body)
    chars += head.length + body.length + 1
    i += 1
  }
  let text = parts.join('\n')
  if (text.length > targetChars) text = text.slice(0, targetChars)
  else if (text.length < targetChars) text += '\n' + 'y'.repeat(targetChars - text.length - 1)
  return { text, startIdx, endIdx: i - 1, chars: text.length }
}

/** 构造统一夹具：`FIXTURE.turns` 个「一头」（多头）＋ 每头 `FIXTURE.fillTokens` token。 */
function buildFixture() {
  const prompts = []
  let nextIdx = 1
  for (let t = 1; t <= FIXTURE.turns; t += 1) {
    const f = makeFill(FIXTURE.fillTokens, nextIdx)
    nextIdx = f.endIdx + 1
    const prefix = t === 1 ? `${NONCE}\n` : ''
    prompts.push(`${prefix}${f.text}\n${FIXTURE.fillInstruction}`)
  }
  prompts.push(FIXTURE.tail)
  return { prompts, markerRange: [1, nextIdx - 1] }
}

// ── 一次会话跑（写自己的装置；只借共享 driver 的传输层）────────────────────
async function runSession({ dir, label, prompts, disableCompact, probeCfg = [], overlays = [], window = null, maxTokens = null, retainRatio = null, t3 = false, execCompact = false, turnWaitMs = 180_000 }) {
  const { home, patchAfter } = makeHome({ disableCompact, t3, execCompact })
  const marker = join(dir, `${label}.probe.jsonl`)
  const driverMarker = join(dir, `${label}.driver.jsonl`)
  save(dir, `${label}.cordis.patch.yml`, patchAfter)

  const cfg = [
    '- id: probe-34t',
    '  config:',
    `    marker: ${marker.replace(/\\/g, '/')}`,
    ...(t3 ? ['    t3: true'] : []),
    ...(execCompact ? ['    execCompact: true'] : []),
    `    predicateModule: ${OFFICIAL_CHECKPOINT_MODULE.replace(/\\/g, '/')}`,
    ...probeCfg,
  ]
  if (window !== null) {
    // ⚠️ 夹具必须 **per-model 覆盖**：`llm-deepseek` 取值式 = `configured?.contextWindow ?? connection.defaultContextWindow`，
    //    而 `deepseek-flash` 在 DEFAULT_MODELS 里自带 contextWindow=1e6 ⇒ defaultContextWindow 对它不生效。
    cfg.unshift(
      '# 夹具：改小**路由模型**的容量（per-model）',
      '- id: llm-deepseek',
      '  config:',
      '    models:',
      '      - id: deepseek-flash',
      `        contextWindow: ${window}`,
    )
  }
  if (maxTokens !== null) cfg.push('- id: compaction-basic', '  config:', `    maxTokens: ${maxTokens}`)
  if (retainRatio !== null) cfg.push('- id: compaction-basic', '  config:', `    retainRatio: ${retainRatio}`)
  const overlayFiles = [makeOverlay(dir, `${label}.overlay.yml`, cfg), ...overlays]

  const compactionEvents = []
  const turnEnds = []
  const driver = new DshDriver({
    profile: 'sdk',
    patches: overlayFiles,
    dshHome: home,
    cwd: REPO,
    marker: driverMarker,
    reverseIdleWarnMs: 2_000,
    shutdownTimeoutMs: 15_000,
    forceAfterMs: 0,
    hooks: {
      onNotification(method, params) {
        if (method !== 'session.event') return
        const t = params?.event?.type
        if (typeof t === 'string' && t.startsWith('compaction/')) compactionEvents.push({ type: t, params })
        else if (t === 'turn/end') turnEnds.push(params?.event)
      },
    },
  })
  const report = { label, home, marker, driverMarker, overlays: overlayFiles, window, maxTokens, retainRatio, disableCompact, t3, execCompact, prompts: [], stop: null }
  try {
    report.started = driver.start()
    const init = await driver.initialize()
    report.initialize = { ok: true, elapsedMs: init.elapsedMs }
    const sessionId = `session-34t-${label}`
    for (let i = 0; i < prompts.length; i += 1) {
      const beforeT = turnEnds.length
      const beforeC = compactionEvents.length
      try {
        const r = await driver.prompt(sessionId, prompts[i], 240_000)
        report.prompts.push({ i, ok: true, messageId: r.messageId })
      } catch (e) { report.prompts.push({ i, ok: false, error: `${e?.name}: ${e?.message}` }) }
      // ⚠️ 必须等**回合真的收束**：`compaction/*` 出现**不等于**这一回合结束 —— 摘要是一次
      //    LLM 调用（数十秒）。第一版等到"有动静就停"，结果在 `compaction/start` 之后
      //    1.2s 就把 driver 关了 ⇒ 摘要被杀，读成"只 start 没 end"（会把装置时序误判成产品 fail-closed）。
      const pendingCompactions = () => compactionEvents.filter((x) => x.type === 'compaction/start').length - compactionEvents.filter((x) => x.type === 'compaction/end').length
      const t0 = Date.now()
      while (Date.now() - t0 < turnWaitMs) {
        if (turnEnds.length > beforeT && pendingCompactions() <= 0) break
        await sleep(400)
      }
      const last = report.prompts[report.prompts.length - 1]
      last.turnEnds = turnEnds.length - beforeT
      last.compactionEvents = compactionEvents.length - beforeC
      last.waitedMs = Date.now() - t0
    }
    await sleep(1_200)
  } catch (e) {
    report.error = `${e?.name}: ${e?.message}`
  } finally {
    try { report.stop = await driver.stop() } catch (e) { report.stopError = `${e?.name}: ${e?.message}` }
    report.childExit = driver.childExit ?? null
  }
  report.compactionTypes = compactionEvents.map((x) => x.type)
  // `start` 多于 `end` ⇒ 摘要仍在飞（装置关得太早）或产品 fail-closed 留了未配对 start —— 读证据时必须能区分
  report.compactionPending = report.compactionTypes.filter((x) => x === 'compaction/start').length - report.compactionTypes.filter((x) => x === 'compaction/end').length
  report.turnEndCount = turnEnds.length
  // ⚠️ 实测线上形状（wire 原文核对）：`event.data.reason.{kind,error.{code,status,message}}`
  report.turnEndSummary = turnEnds.map((e) => {
    const d = e?.data ?? {}
    const r = d.reason ?? e?.reason ?? {}
    return { reasonKind: r.kind ?? null, errorCode: r.error?.code ?? null, errorStatus: r.error?.status ?? null, errorMessage: r.error?.message ?? null, turn: d.turn ?? null, usage: d.usage ?? null }
  })
  report.compactionIds = compactionEvents.map((x) => ({ type: x.type, compactionId: x.params?.event?.data?.compactionId ?? null, sourceCommandId: x.params?.event?.data?.sourceCommandId ?? null, shadowedRange: x.params?.event?.data?.shadowedRange ?? null, shadowedSeqs: x.params?.event?.data?.shadowedSeqs ?? null, shadowedTokenCount: x.params?.event?.data?.shadowedTokenCount ?? null, error: x.params?.event?.data?.error ?? null }))
  report.home = home // 与主块同形；本装置 `:246` 建 report 时已记过一次（同值），此处照抄正解，便于两装置逐行对照
  // ⚠️ 临时 home 必须清：一次 `cpSync` 源 profile = **≈341 MB ／ ≈4.35 万文件**（实测），
  //    跑几十臂就会堆出 GB 级垃圾（2026-09-30 实测累积 21 份 ≈7.2 GB，老大手工清过）。
  //    `home` 由本函数 `makeHome()` 造出、**只在本作用域可达** ⇒ 必须在这里删；
  //    证据已全部落 `dir`，home 本身只是可再生的拷贝 ⇒ 默认删；要事后翻查就 `S34_KEEP_HOME=1`。
  //    回收失败**不得**把整轮判红 ⇒ 只落布尔与原因（与主块 run-34-compaction.mjs 同形）。
  const keepHome = (process.env.S34_KEEP_HOME ?? '0') === '1'
  if (!keepHome) {
    try { rmSync(home, { recursive: true, force: true }); report.homeRemoved = true } catch (e) { report.homeRemoved = false; report.homeRemoveError = String(e?.message ?? e) }
  } else {
    report.homeRemoved = false
    report.homeKeptBecause = 'S34_KEEP_HOME=1'
  }
  saveJson(dir, `${label}.report.json`, report)
  return { report, probeRows: readJsonl(marker), driverRows: readJsonl(driverMarker), home }
}

/** 视图工具：按 phase 过滤（⛔ 投毒试验期数据不与真实链路混算）。 */
const live = (rows) => rows.filter((r) => r.phase !== 't3')
const snaps = (rows) => rows.filter((r) => r.event === 'snapshot')
const lastSnap = (rows, why = null) => { const s = snaps(rows).filter((r) => why === null || r.why === why); return s[s.length - 1] ?? null }
const compactEvent = (report, type) => report.compactionIds.find((x) => x.type === type) ?? null
const fillsOf = (markers) => (markers ?? []).filter((m) => m.startsWith('FILL-'))
/** ⚠️ 实测形状：`compaction/summary.data.summary` 是**内容块数组**（`[{type:'text',text}]`），不是字符串。 */
const summaryTextOf = (row) => {
  const s = row?.data?.summary
  if (Array.isArray(s)) return s.filter((b) => b?.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n')
  return typeof s === 'string' ? s : ''
}
const retainedChars = (msgRows) => sum((msgRows ?? []).filter((m) => m.srcPlugin !== 'compact').flatMap((m) => m.markers.length > 0 ? [m.chars] : []))

// ══ T3：官方谓词 vs 完整判据（未挂载 ／ 挂载两臂）══════════════════════════
/** 该次投递是否是**针对投毒来源**的拒绝（官方 checkpoint 判据的措辞）。 */
const isCheckpointRejection = (rec) => rec?.threw === true && /compaction checkpoint/.test(rec?.error ?? '')

async function armT3(dir, { mount = false } = {}) {
  const prompts = [`${NONCE}\n只回一句 ok，不要调用工具。`]
  const overlays = []
  if (mount) {
    // 让「完整判据」真的有执行者：官方伴生件 `@deepseek-ai/dsh-compaction/invariant`
    // （它 `apply()` 时把 `install` 注册进 invariants 服务，`register` 内部以 `throw new InvariantError` 作 fail）
    overlays.push(makeOverlay(dir, 't3-mount-invariant.overlay.yml', [
      '# DSH-3.4-T · T3：只为让官方 checkpoint 判据有执行者而挂载的伴生件（⛔ 非产品改动，只在本臂）',
      '- insert:',
      '    - id: invariants',
      "      name: '@deepseek-ai/dsh-invariants'",
      '    - id: compaction-invariant',
      "      name: '@deepseek-ai/dsh-compaction/invariant'",
    ]))
  }
  const label = mount ? 't3m' : 't3'
  const { report, probeRows } = await runSession({ dir, label, prompts, disableCompact: true, t3: true, overlays })
  const ev = probeRows.find((r) => r.event === 't3-evidence') ?? null
  if (ev === null) { judge(`${label.toUpperCase()}-0 取证块落地`, false, `探针未产出 t3-evidence 行（probeRows=${probeRows.length}）；report.error=${report.error ?? 'none'}`); return }
  const p = ev.predicate ?? {}
  obs(`${label.toUpperCase()}-1 官方谓词代码来源（进程内解析 ＋ sha256）`,
    `via=${ev.via}；path=${ev.resolve?.path ?? ev.resolve?.inProcess ?? null}；sha256=${(ev.resolve?.sha256 ?? '').slice(0, 16)}…；exports=${JSON.stringify(ev.exports ?? null)}；` +
    `inProcessError=${JSON.stringify(ev.resolve?.inProcessError ?? null)}；候选件=${JSON.stringify(ev.resolve?.fallback ?? null)}`)
  judge(`${label.toUpperCase()}-2 ⭐ 半判据：\`isCompactCheckpointSource()\` 对**只有标记、无 compactionId** 的来源判 true（必要不充分）`,
    p['marker-only(no compactionId)'] === true && p['marker+bogus compactionId'] === true,
    `marker-only=${String(p['marker-only(no compactionId)'])}；marker+bogus=${String(p['marker+bogus compactionId'])}`)
  judge(`${label.toUpperCase()}-3 双锚（反向对照）：换个 plugin 名 ⇒ 谓词判 false（说明它不是恒真）`,
    p['control(other plugin name)'] === false, `other-plugin=${String(p['control(other plugin name)'])}`)
  obs(`${label.toUpperCase()}-4 运行期执行者（\`ctx.get('invariants')\`）与不可达性`,
    `invariantsService=${ev.invariantsService === null ? 'null（未挂载 ⇒ 完整判据无执行者）' : JSON.stringify(ev.invariantsService)}；` +
    `两件可解析性=${JSON.stringify(ev.invariantsResolvable ?? null)}`)
  obs(`${label.toUpperCase()}-5 投毒投递（seq=${ev.forgedSeq} span=${ev.forgedSpan}；forged 与 control **同形**，只差 source）`,
    `forged(bogus)=${JSON.stringify(ev.forgedEmit ?? null)}；forged(no-id)=${JSON.stringify(ev.forgedEmitNoId ?? null)}；control=${JSON.stringify(ev.controlEmit ?? null)}；fatal=${JSON.stringify(ev.fatal ?? null)}`)
  if (!mount) {
    judge(`${label.toUpperCase()}-6 ⭐ **未挂载**臂：投毒 checkpoint 不产生任何**针对它**的运行期拒绝（⇒ 本 profile 产品侧零防护；装置侧若只用谓词即假阳性）`,
      !isCheckpointRejection(ev.forgedEmit) && (ev.forgedEmit?.threw ?? false) === (ev.controlEmit?.threw ?? false),
      `forged.threw=${String(ev.forgedEmit?.threw)}（是否 checkpoint 拒绝=${String(isCheckpointRejection(ev.forgedEmit))}）；control.threw=${String(ev.controlEmit?.threw)}；两臂同形=${String((ev.forgedEmit?.threw ?? false) === (ev.controlEmit?.threw ?? false))}`)
  } else {
    judge(`${label.toUpperCase()}-6 ⭐ **挂载**臂：完整判据**拒绝**投毒 checkpoint（官方 InvariantError 原文），而同一投递换成非 compact 来源 ⇒ 不拒绝`,
      isCheckpointRejection(ev.forgedEmit) && !isCheckpointRejection(ev.controlEmit),
      `forged=${JSON.stringify(ev.forgedEmit ?? null)}；control=${JSON.stringify(ev.controlEmit ?? null)}`)
  }
}

// ══ below：状态 (i) 不触发 ═════════════════════════════════════════════════
async function armBelow(dir) {
  const { prompts } = buildFixture()
  const { report, probeRows } = await runSession({ dir, label: 'below', prompts, disableCompact: true, window: 100_000 })
  const pre = live(probeRows).filter((r) => r.event === 'pre-step').map((r) => r.totalTokens)
  const threshold = Math.floor(100_000 * THRESHOLD_RATIO)
  const s = lastSnap(live(probeRows), 'idle')
  judge('B-1 状态 (i) 不触发：`compaction/*` 事件一条都没有',
    report.compactionTypes.length === 0, `compactionTypes=${JSON.stringify(report.compactionTypes)}；pre-step totalTokens=${JSON.stringify(pre)}（阈值 ${threshold}）`)
  judge('B-2 双锚：压力确实到过（读数序列非空且单调增）＋ 模型输入里**全部** FILL 标记都在（⇒ 没压是真的没压，不是跑挂了）',
    pre.length >= 6 && pre.every((v, i, a) => i === 0 || v >= a[i - 1]) && s !== null && fillsOf(s.allMarkersB).length === fillsOf(s.allMarkersA).length && fillsOf(s.allMarkersB).length > 0,
    `pre-step 步数=${pre.length}；viewB 标记数=${fillsOf(s?.allMarkersB).length}／viewA=${fillsOf(s?.allMarkersA).length}；turnEnd=${JSON.stringify(report.turnEndSummary.map((x) => x.reasonKind))}`)
  judge('B-3 通道健康（双锚之二）：所有回合 `turn/end.reason.kind === completed` 且无错误码',
    report.turnEndSummary.length > 0 && report.turnEndSummary.every((x) => x.reasonKind === 'completed' && x.errorCode === null),
    `turnEndSummary=${JSON.stringify(report.turnEndSummary.map((x) => ({ k: x.reasonKind, e: x.errorCode })))}`)
}

// ══ l2：T1（J4/J5/J6-iii）＋ T4（断言位置对照）═════════════════════════════
async function armL2(dir) {
  const { prompts } = buildFixture()
  const { report, probeRows } = await runSession({ dir, label: 'l2', prompts, disableCompact: true, window: FIXTURE.window })
  const rows = live(probeRows)
  const pre = rows.filter((r) => r.event === 'pre-step').map((r) => r.totalTokens)
  const threshold = Math.floor(FIXTURE.window * THRESHOLD_RATIO)
  const finalSnap = lastSnap(rows, 'idle')
  const start = compactEvent(report, 'compaction/start')
  const summary = compactEvent(report, 'compaction/end') === null && report.compactionIds.some((x) => x.type === 'compaction/summary') ? report.compactionIds.find((x) => x.type === 'compaction/summary') : report.compactionIds.find((x) => x.type === 'compaction/summary')
  const end = compactEvent(report, 'compaction/end')

  // ── 夹具自证 ──
  const modelInfo = rows.find((r) => r.event === 'model-info') ?? null
  judge('L2-1 夹具生效自证：路由模型 contextWindow = 20000（per-model 覆盖真的到了 `modelInfoFor`）',
    modelInfo?.contextWindow === FIXTURE.window, `model-info=${JSON.stringify(modelInfo)}`)
  judge('L2-2 夹具生效自证：pre-step 读数**跨过**阈值 16000（可指认判定当刻）',
    pre.some((v) => v !== null && v >= threshold) && pre.some((v) => v !== null && v < threshold),
    `pre-step=${JSON.stringify(pre)}；阈值=${threshold}；跨步对=${JSON.stringify(pre.map((v, i) => [i, v]).filter(([, v]) => v >= threshold).slice(0, 2))}`)
  // 非判据：夹具模型自证 —— `totalTokens − Σ节点 tokens` 应为常数（本轮实测值，供 t2 比对同夹具）
  const firstIdle = snaps(rows)[0] ?? null
  const impliedConst = firstIdle === null ? null : (firstIdle.meter?.totalTokens ?? 0) - sum(firstIdle.meter?.nodeTokens ?? [])
  obs('L2-4 夹具模型自证（⛔ 非判据）：`totalTokens − Σ节点tokens` 常数值 ＋ 触发点落在第几头',
    `常数=${impliedConst}；总头数=${FIXTURE.turns}；跨阈步索引=${JSON.stringify(pre.map((v, i) => (v !== null && v >= threshold ? i : null)).filter((x) => x !== null))}（触发点越靠尾越好，末头触发 ⇒ 压完即收工，不会第二次压）`)
  judge('L2-3 双锚：**只压一次**（三件套恰好各一，⛔ 不是"≥1"）＋ 全部 8 个回合 `turn/end` 无错',
    report.compactionTypes.join(',') === 'compaction/start,compaction/summary,compaction/end' && report.turnEndSummary.length === FIXTURE.turns + 1 && report.turnEndSummary.every((x) => x.reasonKind === 'completed'),
    `compactionTypes=${JSON.stringify(report.compactionTypes)}；turnEnd 条数=${report.turnEndSummary.length}／期望 ${FIXTURE.turns + 1}；理由码=${JSON.stringify(report.turnEndSummary.map((x) => x.reasonKind))}`)

  // ── T1 · J4（摘要注入 ＋ nonce 逐字 ＋ id 三处一致）──
  const ck = (finalSnap?.viewB_messages ?? []).filter((m) => m.srcPlugin === 'compact')
  judge('T1-J4a ⭐ 摘要注入：`deriveMessages()` 里存在 `source.kind=plugin ∧ source.plugin=compact` 的消息（chars>0）',
    ck.length === 1 && ck[0].chars > 0,
    `checkpoint 行=${JSON.stringify(ck.map((m) => ({ i: m.i, role: m.role, srcKind: m.srcKind, chars: m.chars })))}；viewB 条数=${finalSnap?.messageCount ?? null}`)
  judge('T1-J4b ⭐ nonce 逐字：摘要正文里出现 `NONCE-34TBETA9`（取**事件侧 summary 原文** ＋ 模型输入侧标记集合两处）',
    (summary !== null) && summaryTextOf(probeRows.find((r) => r.event === 'compaction-event' && r.type === 'compaction/summary')).includes(NONCE) && (ck[0]?.markers ?? []).includes(NONCE),
    `事件侧 summary 含 nonce=${summaryTextOf(probeRows.find((r) => r.event === 'compaction-event' && r.type === 'compaction/summary')).includes(NONCE)}（summary 形状=${Array.isArray(probeRows.find((r) => r.event === 'compaction-event' && r.type === 'compaction/summary')?.data?.summary) ? '内容块数组' : typeof probeRows.find((r) => r.event === 'compaction-event' && r.type === 'compaction/summary')?.data?.summary}）；viewB checkpoint markers=${JSON.stringify(ck[0]?.markers ?? null)}`)
  const ids = [start?.compactionId, summary?.compactionId, end?.compactionId, ck[0]?.srcCompactionId]
  judge('T1-J4c ⭐ id 一致性（**逐字**且**非空**，⛔ 挡住 undefined===undefined 的假绿）：start/summary/end 的 `data.compactionId` 与 checkpoint 的 `source.compactionId` 四值相同',
    ids.every((v) => typeof v === 'string' && v.length > 0) && new Set(ids).size === 1,
    `ids=${JSON.stringify(ids)}`)

  // ── T1 · J5（被压区间 ＋ 近文保留量）──
  const summaryRow = probeRows.find((r) => r.event === 'compaction-event' && r.type === 'compaction/summary') ?? null
  const snapAtSummary = lastSnap(rows, 'compaction/summary')
  const seqs = summaryRow?.data?.shadowedSeqs ?? []
  const rng = summaryRow?.data?.shadowedRange ?? null
  const surfaceAt = snapAtSummary?.surfaceNodes ?? []
  judge('T1-J5a ⭐ 被压区间自洽：`shadowedSeqs` 非空、首尾 = `shadowedRange` 两端、且**每一个** seq 都在当刻 surface 上（⛔ 不是"看起来像"）',
    seqs.length > 0 && rng !== null && seqs[0] === rng.start && seqs[seqs.length - 1] === rng.end && seqs.every((q) => surfaceAt.includes(q)),
    `shadowedRange=${JSON.stringify(rng)}；shadowedSeqs=${JSON.stringify(seqs)}；当刻 surface=${JSON.stringify(surfaceAt)}；shadowedTokenCount=${summaryRow?.data?.shadowedTokenCount ?? null}`)
  const keptChars = retainedChars(finalSnap?.viewB_messages ?? [])
  const keptTokens = approxTokens(keptChars)
  const expectKept = Math.floor(FIXTURE.window * RETAIN_RATIO_DEFAULT)
  judge('T1-J5b ⭐ 近文保留量的**尺**：保留量 ≥ `floor(window×0.16)`=3200（**下界**；节点粒度粗时向上吸附）且 < `0.8×window`（否则本轮不可能被放行）——⛔ 断言形式写成"≈3200"是错的（把下界当靶心）',
    keptTokens >= expectKept && keptTokens < Math.floor(FIXTURE.window * THRESHOLD_RATIO),
    `保留 chars=${keptChars} ⇒ ≈${keptTokens} token vs 下界 ${expectKept}（吸附 +${keptTokens - expectKept}，${(((keptTokens - expectKept) / expectKept) * 100).toFixed(1)}%）；保留 FILL 标记数=${fillsOf(finalSnap?.allMarkersB ?? []).length}／总计 ${fillsOf(finalSnap?.allMarkersA ?? []).length}；保留节点数=${(finalSnap?.viewB_messages ?? []).filter((m) => m.srcPlugin !== 'compact' && m.markers.length > 0).length}`)

  // ── T4 · 断言位置对照（同一份数据两处断言）──
  const aFills = fillsOf(finalSnap?.allMarkersA ?? [])
  const bFills = fillsOf(finalSnap?.allMarkersB ?? [])
  judge('T4-1 ⭐ (a) 事件侧（`snapshotEvents()`/kernel 投影）在压后**仍含全部原文** FILL 标记 ⇒ 在 (a) 上断言"原文都在"是**恒真**的',
    aFills.length > 0 && bFills.length < aFills.length,
    `viewA FILL 标记数=${aFills.length}；viewB FILL 标记数=${bFills.length}；被压标记数=${aFills.length - bFills.length}`)
  const aMsgChars = sum((finalSnap?.viewA_events ?? []).filter((e) => e.type === 'user/message' && e.srcPlugin !== 'compact').map((e) => e.chars))
  const bMsgChars = sum((finalSnap?.viewB_messages ?? []).map((m) => m.chars))
  judge('T4-2 ⭐ (a) 与 (b) **同刻读数不同**：模型实际输入字符数 < 日志侧 append 原文合计（⇒ (a) 证明不了"发给模型的内容"）',
    bMsgChars < aMsgChars,
    `(a) append 侧 user/message 字符合计=${aMsgChars}；(b) deriveMessages 字符合计=${bMsgChars}`)
  // ⭐ **无容差**写法：以**标记**为单位（不是以 seq 为单位）——
  //    被压 seqs 里夹着空内容 assistant 消息（只承载 usage，`chars===0` 合法），
  //    上一版按 seq 断言"每条都有原文"因此误 FAIL。标记口径天然绕开这个噪声：
  //    `被压标记 − 摘要引用的那几个` 这一集合必须 **(a) 侧一个不少 ∧ (b) 侧一个没有**。
  const shadowedFills = [...new Set((finalSnap?.viewA_events ?? [])
    .filter((e) => seqs.includes(e.seq))
    .flatMap((e) => e.markers))].filter((m) => m.startsWith('FILL-')).sort()
  const summaryText = summaryTextOf(summaryRow)
  const summaryFills = new Set(fillsOf([...summaryText.matchAll(MARKER_RE)].map((h) => h[1])))
  const mustVanish = shadowedFills.filter((m) => !summaryFills.has(m))
  const aStillHas = mustVanish.filter((m) => aFills.includes(m))
  const bStillHas = mustVanish.filter((m) => bFills.includes(m))
  judge('T4-3 ⭐ **无容差**定向对照：`被压标记 − 摘要引用` 这一集合在 (a) 侧**一个不少**（日志从不删原文 ⇒ 在 (a) 上断言"原文不见了"恒假）、在 (b) 侧**一个没有**',
    mustVanish.length > 0 && aStillHas.length === mustVanish.length && bStillHas.length === 0,
    `被压 seqs 携带 FILL=${shadowedFills.length} 个；摘要引用=${summaryFills.size} 个（${JSON.stringify([...summaryFills].sort())}）；应消失=${mustVanish.length} 个；其中 **仍在 (a) 侧**=${aStillHas.length}、**仍在 (b) 侧**=${bStillHas.length}${bStillHas.length > 0 ? `（仍在 (b) 侧者：${JSON.stringify(bStillHas.slice(0, 8))}）` : ''}`)

  // ── T1 · J6 状态 (iii) 完好（只从事件侧判）──
  // ⭐ "surface 缩小过"取 **start 当刻**（语义上的"压前"）与 **idle**（压后）两处节点数比。
  //    ⚠️ 实测：本轮 summary 当刻读数与 start 当刻**相同**（都 12）⇒ 两种取法在本轮等价；
  //    取 start 是因为"压前"在语义上只能是 start，与替换发生在哪个快照无关（⛔ 未观测到 summary 落在替换之后）。
  const snapAtStart = lastSnap(rows, 'compaction/start')
  const nStart = snapAtStart?.surfaceNodeCount ?? null
  const nEnd = finalSnap?.surfaceNodeCount ?? null
  judge('T1-J6 ⭐ 状态 (iii) 完好判据**只依赖事件侧**：三件套齐 ＋ end 无 error ＋ surface 节点数在 start→idle 之间**缩小**（读数取自 start 当刻 vs 压后）',
    report.compactionTypes.join(',') === 'compaction/start,compaction/summary,compaction/end' && (end?.error ?? null) === null && nStart !== null && nEnd !== null && nEnd < nStart,
    `end.error=${JSON.stringify(end?.error ?? null)}；start 当刻 surface 节点数=${nStart}；压后=${nEnd}（变化 ${nStart !== null && nEnd !== null ? nEnd - nStart : 'n/a'}）；pre-step 读数=${JSON.stringify(pre)} ⇒ 压后总 token=${finalSnap?.meter?.totalTokens ?? null}（阈值 ${threshold}）`)
  return { keptTokens, report }
}

// ══ t6（选做）：状态 (ii) 触发但摘要被截 ⇒ fail-closed ══════════════════════
async function armT6(dir) {
  const { prompts } = buildFixture()
  // 逼摘要被截：把 `compaction-basic.config.maxTokens` 压到 16（摘要是 LLM 生成 ⇒ 必截）
  const { report, probeRows } = await runSession({ dir, label: 't6', prompts, disableCompact: true, window: FIXTURE.window, maxTokens: 16 })
  const rows = live(probeRows)
  const s = lastSnap(rows, 'idle')
  const types = report.compactionTypes
  const end = compactEvent(report, 'compaction/end')
  const ck = (s?.viewB_messages ?? []).filter((m) => m.srcPlugin === 'compact')
  judge('T6-1 ⭐ 状态 (ii) fail-closed：有 `compaction/start`，其 `compaction/end` **带 error**（⛔ 不是静默成功、也不是只剩 start）',
    types.includes('compaction/start') && end !== null && (end.error ?? null) !== null && !types.includes('compaction/summary'),
    `compactionTypes=${JSON.stringify(types)}；compactionPending=${report.compactionPending}；end.error=${JSON.stringify(end?.error ?? null)}`)
  judge('T6-2 ⭐ 半成品**不进模型输入**：`deriveMessages()` 里没有任何 `source.plugin=compact` 的消息',
    ck.length === 0,
    `viewB checkpoint 行=${JSON.stringify(ck.map((m) => ({ i: m.i, chars: m.chars })))}；viewB 条数=${s?.messageCount ?? null}`)
  judge('T6-3 ⭐ 只从**事件侧**即可把 (i) 与 (ii) 分开：(i) 零条 `compaction/*`；(ii) 有 start 且 end 带 error —— ⛔ 判据不是"看有没有摘要"',
    types.includes('compaction/start') && (end?.error ?? null) !== null,
    `本臂（ii）事件序列=${JSON.stringify(types)}；对照臂（i）＝ below 臂实测零条 compaction/*；end.error 文本=${JSON.stringify(String(end?.error ?? '').slice(0, 200))}`)
  obs('T6-4 状态 (ii) 的**代价**（⛔ 非判据）：回合是否被这条错误打断 —— `turn/end.reason` 读数',
    `理由序列=${JSON.stringify(report.turnEndSummary.map((x) => ({ k: x.reasonKind, code: x.errorCode, msg: String(x.errorMessage ?? '').slice(0, 120) })))}`)
}

// ══ T2：retainRatio 单调性（破坏对照 ＋ 双锚）══════════════════════════════
async function armT2(dir, baseline) {
  const { prompts } = buildFixture()
  const out = {}
  for (const ratio of [0.02, 0.5]) {
    const label = `t2-r${String(ratio).replace('.', '')}`
    const sub = join(dir, label)
    mkdirSync(sub, { recursive: true })
    const { report, probeRows } = await runSession({ dir: sub, label, prompts, disableCompact: true, window: FIXTURE.window, retainRatio: ratio })
    const rows = live(probeRows)
    const s = lastSnap(rows, 'idle')
    const ck = (s?.viewB_messages ?? []).filter((m) => m.srcPlugin === 'compact')
    const keptChars = retainedChars(s?.viewB_messages ?? [])
    out[label] = {
      ratio,
      keptChars,
      keptTokens: approxTokens(keptChars),
      expect: Math.floor(FIXTURE.window * ratio),
      compactTypes: report.compactionTypes,
      checkpointPresent: ck.length === 1 && ck[0].chars > 0,
      idsEqual: new Set([compactEvent(report, 'compaction/start')?.compactionId, compactEvent(report, 'compaction/summary')?.compactionId, compactEvent(report, 'compaction/end')?.compactionId, ck[0]?.srcCompactionId]).size === 1,
      preStep: rows.filter((r) => r.event === 'pre-step').map((r) => r.totalTokens),
      turnEnds: report.turnEndSummary.map((x) => x.reasonKind),
      dir: sub,
    }
    // ⛔ 这里曾写 `rmSync(join(sub,'home'))` —— `sub` 是**证据子目录**，其下没有 `home`，
    //    该调用恒 no-op（`force:true` 连报错都没有）⇒ 真正的回收已移入 `runSession()`（home 的唯一持有者）。
  }
  const lo = out['t2-r002']
  const hi = out['t2-r05']
  saveJson(dir, 'T2-verdict.json', { baseline, out })
  judge('T2-1 ⭐ 尺是有判别力的：`retainRatio` 0.02 → 0.16 → 0.5，**近文保留量单调增**（若不变 ⇒ J5 的"尺"口径作废）',
    baseline !== null && lo.keptTokens < baseline && baseline < hi.keptTokens,
    `保留 token：r=0.02 → ${lo.keptTokens}（${lo.keptChars} chars） ／ r=0.16（l2 基线）→ ${baseline} ／ r=0.5 → ${hi.keptTokens}（${hi.keptChars} chars）`)
  judge('T2-2 尺的**量级**对得上：0.5 仍 < 0.8 被放行，且每档保留量 ≥ `floor(window×ratio)`（吸附只会更多，不会更少）',
    lo.keptTokens >= lo.expect && hi.keptTokens >= hi.expect && hi.keptTokens < Math.floor(FIXTURE.window * 0.8),
    `r=0.02：${lo.keptTokens} ≥ ${lo.expect}；r=0.5：${hi.keptTokens} ≥ ${hi.expect} 且 < ${Math.floor(FIXTURE.window * 0.8)}`)
  judge('T2-3 ⭐ 双锚（**破坏对照期其余判据仍活**）：两档都仍满足"摘要仍注入 ＋ start/end 仍成对 ＋ id 仍一致 ＋ 回合无错"',
    [lo, hi].every((x) => x.checkpointPresent && x.compactTypes.join(',') === 'compaction/start,compaction/summary,compaction/end' && x.idsEqual && x.turnEnds.every((k) => k === 'completed')),
    `r=0.02=${JSON.stringify({ ck: lo.checkpointPresent, types: lo.compactTypes, idsEqual: lo.idsEqual, turns: lo.turnEnds })}；r=0.5=${JSON.stringify({ ck: hi.checkpointPresent, types: hi.compactTypes, idsEqual: hi.idsEqual, turns: hi.turnEnds })}`)
}

// ══ T5：A 落地反向对照（未禁用 profile 发 /compact）════════════════════════
async function armT5(dir) {
  // ⚠️ 必须给**足量素材**：手动路径用 `retainTokens=0` 选区间，若会话只有一条小消息，
  //    官方会因「summary 不比被压内容小」而 fail-closed（实测原文：
  //    `Compaction could not produce a useful summary…`，start/end 成对但无 summary）
  //    ⇒ 正例根本到不了 `Compacted N history items`。第一版只有 1 条 prompt 就撞上了。
  const prompts = []
  {
    let next = 1
    for (let t = 1; t <= 3; t += 1) {
      const f = makeFill(2000, next)
      next = f.endIdx + 1
      prompts.push(`${t === 1 ? `${NONCE}\n` : ''}${f.text}\n只回一句 ok，不要调用工具。`)
    }
    prompts.push('只回一句 ok。')
  }
  const off = await runSession({ dir, label: 't5-disabled', prompts, disableCompact: true, execCompact: true })
  const on = await runSession({ dir, label: 't5-enabled', prompts, disableCompact: false, execCompact: true })
  const rowOf = (res, ev) => live(res.probeRows).find((r) => r.event === ev) ?? null
  const typesOf = (res) => res.report.compactionTypes
  const cmdOff = rowOf(off, 'commands')
  const cmdOn = rowOf(on, 'commands')
  const execOff = rowOf(off, 'exec-compact')
  const execOn = rowOf(on, 'exec-compact')
  judge('T5-1 ⭐ A 落地（禁用 profile）：运行期命令表**无 compact** ＋ 执行 `/compact` **不产生** `compaction/start`',
    cmdOff?.hasCompact === false && !typesOf(off).includes('compaction/start'),
    `commands.hasCompact=${String(cmdOff?.hasCompact)}；names=${JSON.stringify(cmdOff?.names ?? null)}；compaction/*=${JSON.stringify(typesOf(off))}；exec=${JSON.stringify(execOff ?? null)}`)
  const text = JSON.stringify(execOn?.result ?? null)
  const startOn = on.report.compactionIds.find((x) => x.type === 'compaction/start') ?? null
  judge('T5-2 ⭐ 反向对照（未禁用 profile）：命令表**有 compact** ＋ 执行后出现 `compaction/start` ＋ 反馈文本 `Compacted N history items`',
    cmdOn?.hasCompact === true && typesOf(on).includes('compaction/start') && /Compacted \d+ history items/.test(text),
    `commands.hasCompact=${String(cmdOn?.hasCompact)}；compaction/*=${JSON.stringify(typesOf(on))}；exec.result=${text.slice(0, 300)}`)
  judge('T5-3 ⭐ 新判据（主块未用的）：手动路径可**与自动路径区分** —— `compaction/start.data.sourceCommandId` 非空字符串（自动路径实测 = undefined）',
    typeof startOn?.sourceCommandId === 'string' && startOn.sourceCommandId.length > 0,
    `manual start.sourceCommandId=${JSON.stringify(startOn?.sourceCommandId ?? null)}`)
  obs('T5-4 手动路径的**结果文案**（⛔ 非判据）：成功态 = `Compacted N history items (~M tokens).`；素材不足时会走官方 fail-closed（`Compaction could not produce a useful summary…`，见 08-06-51 那次）',
    `compaction/*=${JSON.stringify(typesOf(on))}；exec.result=${text.slice(0, 240)}；end.error=${JSON.stringify(on.report.compactionIds.find((x) => x.type === 'compaction/end')?.error ?? null)}`)
}

// ══ 入口 ═══════════════════════════════════════════════════════════════════
async function main() {
  if (ARM === 'help' || ARM === '--help') { console.log('usage: node run-34t-probe.mjs t3|below|l2|t2|t5'); process.exit(2) }
  const dir = join(EVIDENCE, `${ARM}-${stamp}`)
  mkdirSync(dir, { recursive: true })
  saveJson(dir, 'preflight.json', preflight)
  if (!preflight.dshBinExists || !preflight.srcProfileExists || !preflight.probeSrcExists) {
    console.error('[34t] 前置缺失：dsh bin ／ 源 profile ／ 探针源 不在'); process.exit(2)
  }
  let baseline = null
  if (ARM === 't3') {
    await armT3(dir, { mount: false })
  } else if (ARM === 't3m') {
    await armT3(dir, { mount: true })
  } else {
    if (!['below', 't3m'].includes(ARM) && !preflight.keyPresent) { console.error('[34t] 前置缺失：本臂需要真 key'); process.exit(2) }
    if (ARM === 'below') await armBelow(dir)
    else if (ARM === 'l2') { const r = await armL2(dir); baseline = r.keptTokens }
    else if (ARM === 't2') {
      const bl = Number(argOf('--baseline', 'NaN'))
      await armT2(dir, Number.isFinite(bl) ? bl : null)
    } else if (ARM === 't5') await armT5(dir)
    else if (ARM === 't6') await armT6(dir)
    else { console.error(`[34t] 未知 arm：${ARM}`); process.exit(2) }
  }
  const failed = findings.filter((f) => f.status === 'FAIL').length
  saveJson(dir, `findings-${ARM}.json`, { when: stamp, arm: ARM, preflight, findings, counts: { pass: findings.filter((f) => f.status === 'PASS').length, fail: failed, obs: findings.filter((f) => f.status === 'OBS').length } })
  console.log(`\n[34t] arm=${ARM} dir=${dir}`)
  console.log(`[34t] 结论：${failed === 0 ? '判据全部成立（含破坏对照）' : `有 ${failed} 条判据不成立`}（PASS ${findings.filter((f) => f.status === 'PASS').length} ／ FAIL ${failed} ／ OBS ${findings.filter((f) => f.status === 'OBS').length}）`)
  process.exit(failed === 0 ? 0 : 1)
}

await main()
