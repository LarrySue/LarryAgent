#!/usr/bin/env node
/**
 * DSH-3.7.2 · Windows 沙箱「拒绝方言」修复件 —— **真 e2e 一键复跑装置**
 *
 * 干什么：在**工程 `.dsh-home`**（不是临时 home、不是全局 `~/.dsh`）上，用 **client 同源 SDK 通道**
 * （`harness/scripts/dsh-prompt.mjs`，脚本头自述 "the Tauri client runs exactly this script under the hood"）
 * 让**真模型**去执行一条**确实会被 Windows 沙箱拒**的命令（往工作区外写文件），
 * 看它是否被识别为沙箱拒绝 —— 即模型侧是否看到 `[sandbox: file access denied under <mode> mode]`。
 *
 * ⭐ **双锚**（缺任一条则"环境没起来"与"修复生效"不可分）：
 *   - `unpatched`：`sdk/cordis.patch.yml` = `[]`（摘掉修复件）⇒ 期望 marker **不出现**，
 *     但**必须**能看到「普通失败」的原文（`operation not permitted` / `EPERM` / 拒绝访问 / Access is denied）
 *     —— 这条同时证明"命令真跑了、真被拒了"，否则"没跑"会伪装成"没被识别"。
 *   - `patched`：写回两段（disable 官方 sandbox 行 ＋ insert 我们的 provider）⇒ 期望 marker **出现**。
 * 两态都另断言：**目标文件始终没被创建**（正对照：这条命令确实写不出去）。
 *
 * 用法（在 `harness/` 下；**DSH_HOME 由脚本内部按仓库绝对路径算，不依赖 `pwd -W`**）：
 *   DEEPSEEK_API_KEY=<key> node scripts/run-372-dialect-e2e.mjs            # 跑两态
 *   node scripts/run-372-dialect-e2e.mjs unpatched                          # 只跑一态
 *   S0_CREDS=<凭据文件> node scripts/run-372-dialect-e2e.mjs                # 指定 key 来源（只打长度）
 *   ⚠️ 不带 `S0_CREDS` 时，依次试 `~/.dsh/.credentials.yaml` → `backend/config.yaml`
 *      （本机实测：**前者只有 `secret`、没有 DeepSeek key**，真正可用的是后者首条 `api_key`=35 字符）
 *
 * 退出码：`0` 通过 ／ `1` 判据失败 ／ `2` 前置缺失 ／ `124` 看门狗超时
 * 🔴 本脚本**不打印 Key 值**（只打长度）；Key 只进子进程 env，不落任何文件。
 *
 * 姿态自证：
 *   - 执行器 = `harness/node_modules/@deepseek-ai/dsh`（`0.1.5-rc.2`）的 `--profile sdk`
 *   - 前导 = **无**（脚本直接起 SDK，不经 CLI 子命令）
 *   - home = `<repo>/.dsh-home`（**工程 home**，落盘生效面）；profile = `sdk`
 *   - 凭据层 = **启动环境变量**（工程 home 无 `.credentials.yaml`；见 DSH-3.7.1 ③）
 *   - 工作区 = `<S372_ROOT>/ws`（= 子进程 cwd ⇒ session cwd ⇒ 沙箱 `workspaceRoot`）
 *   - 越界目标 = `<S372_ROOT>/outside/denied.txt`（工作区**外**）
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const harnessDir = resolve(import.meta.dirname, '..')
const repoRoot = resolve(harnessDir, '..')
const HOME_DIR = resolve(repoRoot, '.dsh-home')
const PROFILE = 'sdk'
const PATCH_FILE = join(HOME_DIR, 'profiles', PROFILE, 'cordis.patch.yml')
const DSH_BIN = join(harnessDir, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const PROMPT_SCRIPT = join(harnessDir, 'scripts', 'dsh-prompt.mjs')
const INSTALLED_PLUGIN = join(HOME_DIR, 'profiles', PROFILE, 'node_modules', '@larryagent', 'plugin-sandbox-dialect', 'index.js')

const SBOX_ROOT = process.env.S372_ROOT ?? join('D:\\Code', 'larry-sbox-372')
const WS = join(SBOX_ROOT, 'ws')
const OUTSIDE_DIR = join(SBOX_ROOT, 'outside')
const OUTSIDE_FILE = join(OUTSIDE_DIR, 'denied.txt')

const EVIDENCE_DIR = process.env.S372_EVIDENCE_DIR ?? resolve(repoRoot, '.s372-evidence')
const MARKER = '[sandbox: file access denied'
/** 「普通失败」的证据词：任一出现即证"命令真跑了、真被拒了"（不是没跑） */
const PLAIN_DENIAL_WORDS = ['operation not permitted', 'EPERM', '拒绝访问', '访问被拒绝', 'Access is denied', 'access is denied']

const PATCH_TEMPLATE_HEADER = [
  '# Your patch layer for this dsh profile, applied after every bundle layer:',
  '# a top-level YAML array of loader patch entries (id-targeted config',
  '# overrides, disables, and insert lists; `!!js` expressions allowed).',
  '',
].join('\n')

/** 落盘态（= 生产要的样子）：disable 官方 sandbox 行 ＋ insert 我们的 provider（form B） */
const PATCH_PATCHED = `${PATCH_TEMPLATE_HEADER}# DSH-3.7.2 · Windows 沙箱「拒绝方言」修复件挂载
# 内容源 = harness/scripts/sandbox-probe/sandbox-dialect.mount.patch.yml（生产用）
# ⚠️ form A（\`- id: sandbox\` + \`name:\` 覆盖同名行）实测不生效：loader 的 id 定位只做 config 覆盖，不改该行的插件来源
# ⚠️ 插件须实体复制进 profile 自身层（本文件所在 profile 的 node_modules），不要 link、不要放共享层
- id: sandbox
  disabled: true

- insert:
    - id: sandbox-dialect
      name: '@larryagent/plugin-sandbox-dialect'
`
/** 负向对照①态：摘掉修复件（模板空态） */
const PATCH_UNPATCHED = `${PATCH_TEMPLATE_HEADER}[]\n`

const VARIANTS = ['unpatched', 'patched']
const picked = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const variants = picked.length > 0 ? picked : VARIANTS
const unknown = variants.filter((v) => !VARIANTS.includes(v))
if (unknown.length > 0) {
  console.error(`[372] 未知变体：${unknown.join(', ')}（可选：${VARIANTS.join(' / ')}）`)
  process.exit(2)
}

// ---------------------------------------------------------------------------
// 前置检查（缺一即 `2`，不要把"环境没起来"当判据）
// ---------------------------------------------------------------------------
const problems = []
if (!existsSync(DSH_BIN)) problems.push(`缺 dsh CLI：${DSH_BIN}`)
if (!existsSync(PROMPT_SCRIPT)) problems.push(`缺通道脚本：${PROMPT_SCRIPT}`)
if (!existsSync(join(HOME_DIR, 'profiles', PROFILE, 'package.json'))) problems.push(`缺工程 home 的 ${PROFILE} profile：${HOME_DIR}`)
if (!existsSync(PATCH_FILE)) problems.push(`缺 patch：${PATCH_FILE}`)
if (!existsSync(INSTALLED_PLUGIN)) problems.push(`缺落盘插件（先做 J2 实体复制）：${INSTALLED_PLUGIN}`)
if (problems.length > 0) {
  console.error('[372] ⛔ 前置未就位：')
  for (const p of problems) console.error(`[372]   - ${p}`)
  process.exit(2)
}

/** Key：先看 env；再按顺序试「凭据文件」。**只回值、不打印**。 */
function loadKey() {
  const fromEnv = process.env.DEEPSEEK_API_KEY
  if (fromEnv !== undefined && fromEnv.trim() !== '') return { key: fromEnv.trim(), source: 'env' }
  // ⚠️ 实测（本机 2026-09-17）：`~/.dsh/.credentials.yaml` **只有 `secret`、没有 DeepSeek key**；
  //    本机可用的 key 源是 `backend/config.yaml` 的首条 `api_key`（35 字符）。故两种字段名都认。
  const candidates = process.env.S0_CREDS !== undefined
    ? [process.env.S0_CREDS]
    : [join(homedir(), '.dsh', '.credentials.yaml'), join(repoRoot, 'backend', 'config.yaml')]
  for (const file of candidates) {
    if (!existsSync(file)) continue
    const text = readFileSync(file, 'utf8')
    const m =
      text.match(/DEEPSEEK_API_KEY\s*:\s*["']?([^"'\s]+)["']?/) ??
      text.match(/^\s*api_key\s*:\s*["']?([A-Za-z0-9_-]{20,})["']?\s*$/m)
    if (m !== null && m[1] !== undefined && m[1] !== '') return { key: m[1], source: file }
  }
  return undefined
}

const loaded = loadKey()
if (loaded === undefined) {
  console.error('[372] ⛔ 没拿到 Key（env 无 DEEPSEEK_API_KEY，凭据文件也没读到）——真 e2e 必须有凭据')
  process.exit(2)
}
console.log(`[372] Key 来源=${loaded.source}（长度 ${loaded.key.length}，值不打印）`)
console.log(`[372] 工程 home=${HOME_DIR}`)
console.log(`[372] 工作区=${WS}  越界目标=${OUTSIDE_FILE}`)
console.log(`[372] 证据目录=${EVIDENCE_DIR}\n`)

mkdirSync(EVIDENCE_DIR, { recursive: true })
mkdirSync(WS, { recursive: true })
mkdirSync(OUTSIDE_DIR, { recursive: true })

const childEnv = { ...process.env, DSH_HOME: HOME_DIR, DEEPSEEK_API_KEY: loaded.key }

/** 让模型执行的命令（**走 node** ⇒ 命中跨语言的「② 错误码类别层」，与终端 UI 语言无关）。 */
const COMMAND = `node -e "require('fs').writeFileSync('${OUTSIDE_FILE.replace(/\\/g, '/')}','x')"`
const PROMPT = [
  '只做这一件事，不要做任何探索、不要读别的文件。',
  `用 pwsh 工具运行下面这条命令（原样照抄，不要改写、不要换成别的写法）：`,
  COMMAND,
  '然后把该命令的 stdout 与 stderr **原样**贴回来（不要总结、不要解释、不要省略）。',
  '⛔ 不要传 sandbox_permissions 或任何升权参数；不要换别的方式重试。',
].join('\n')

/** 取某一行条目的完整区块（`- id: <id>` 到下一个 `- id: ` 之前）。 */
function rowBlock(text, id) {
  const idx = text.indexOf(`- id: ${id}\n`)
  if (idx < 0) return null
  const rest = text.slice(idx)
  const next = rest.indexOf('\n- id: ', 1)
  return next < 0 ? rest : rest.slice(0, next)
}

/** dump-config 取「官方 sandbox 行是否仍活」的证据（`--dump-config` 只组配置树、不激活插件，故此处只用它看行）。 */
function dumpConfig(label) {
  const out = join(EVIDENCE_DIR, `${label}.dump-config.out.txt`)
  const err = join(EVIDENCE_DIR, `${label}.dump-config.err.txt`)
  const r = spawnSync(process.execPath, [DSH_BIN, '--profile', PROFILE, '--dump-config'], {
    cwd: harnessDir,
    env: childEnv,
    encoding: 'utf8',
    timeout: 180_000,
  })
  writeFileSync(out, r.stdout ?? '')
  writeFileSync(err, r.stderr ?? '')
  const text = r.stdout ?? ''
  // ⚠️ 行内属性顺序是 id → name → disabled ⇒ **不能**用「id 行紧跟 disabled 行」的紧邻正则
  const sandboxBlock = rowBlock(text, 'sandbox')
  return {
    exitCode: r.status,
    stdoutBytes: Buffer.byteLength(text, 'utf8'),
    stderrBytes: Buffer.byteLength(r.stderr ?? '', 'utf8'),
    sandboxRowPresent: sandboxBlock !== null,
    sandboxRowDisabled: sandboxBlock !== null && /\n\s+disabled: true/.test(sandboxBlock),
    sandboxRowName: sandboxBlock === null ? null : (sandboxBlock.match(/\n\s+name: '([^']+)'/) ?? [])[1] ?? null,
    dialectRowPresent: text.includes('sandbox-dialect'),
    out,
    err,
  }
}

/** 真跑一次 prompt（**输出先落盘再读**，不依赖管道回显 —— 长任务管道会吞输出）。 */
function runPrompt(label) {
  const outFile = join(EVIDENCE_DIR, `${label}.prompt.stdout.txt`)
  const errFile = join(EVIDENCE_DIR, `${label}.prompt.stderr.txt`)
  const child = spawn(process.execPath, [PROMPT_SCRIPT, PROMPT], {
    cwd: WS, // ⇒ session cwd ⇒ 沙箱 workspaceRoot
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (d) => (stdout += d))
  child.stderr.on('data', (d) => (stderr += d))
  const watchdog = setTimeout(() => {
    console.error(`[372] ⏱ ${label} 超时（8 分钟），杀进程`)
    child.kill('SIGKILL')
    process.exitCode = 124
  }, 8 * 60 * 1000)
  return new Promise((done) => {
    child.on('exit', (code, signal) => {
      clearTimeout(watchdog)
      writeFileSync(outFile, stdout)
      writeFileSync(errFile, stderr)
      done({ code, signal, stdout, stderr, outFile, errFile })
    })
  })
}

const results = []

for (const variant of variants) {
  console.log(`===== [372] variant=${variant} =====`)
  // 1) 写 patch（决定挂不挂修复件）
  writeFileSync(PATCH_FILE, variant === 'patched' ? PATCH_PATCHED : PATCH_UNPATCHED)
  const patchBytes = readFileSync(PATCH_FILE).length
  // 2) 目标先清空（正对照：跑完必须仍不存在）
  rmSync(OUTSIDE_FILE, { force: true })
  // 3) 配置面证据
  const dump = dumpConfig(`372-${variant}`)
  // 4) 真 e2e
  const run = await runPrompt(`372-${variant}`)
  const fileLeaked = existsSync(OUTSIDE_FILE)
  const markerPresent = run.stdout.includes(MARKER) || run.stderr.includes(MARKER)
  const plainWords = PLAIN_DENIAL_WORDS.filter((w) => `${run.stdout}\n${run.stderr}`.includes(w))
  const rec = {
    variant,
    patchBytes,
    promptExitCode: run.code,
    promptSignal: run.signal,
    promptStdoutBytes: Buffer.byteLength(run.stdout, 'utf8'),
    promptStderrBytes: Buffer.byteLength(run.stderr, 'utf8'),
    markerPresent,
    plainDenialWords: plainWords,
    outsideFileLeaked: fileLeaked,
    dumpConfig: dump,
    promptStdoutFile: run.outFile,
    promptStderrFile: run.errFile,
  }
  results.push(rec)
  console.log(
    `[372]   patch=${patchBytes}B  prompt exit=${rec.promptExitCode}  ctx out=${rec.promptStdoutBytes}B\n` +
      `[372]   marker=${markerPresent}  普通失败词=${JSON.stringify(plainWords)}  越界文件泄漏=${fileLeaked}\n` +
      `[372]   dump: sandbox 行在=${dump.sandboxRowPresent} disabled=${dump.sandboxRowDisabled} dialect 行在=${dump.dialectRowPresent}\n`,
  )
  rmSync(OUTSIDE_FILE, { force: true })
}

/** 无论成败，**把落盘态留成 patched**（生产态），否则一次负向对照就把落盘改坏了。 */
try {
  writeFileSync(PATCH_FILE, PATCH_PATCHED)
  console.log(`[372] 已把 ${PATCH_FILE} 复位为 patched 态`)
} catch (e) {
  console.error(`[372] ⚠️ patch 复位失败：${e}`)
}

// ---------------------------------------------------------------------------
// 判据（双锚）
// ---------------------------------------------------------------------------
const failures = []
const get = (v) => results.find((r) => r.variant === v)

for (const rec of results) {
  if (rec.outsideFileLeaked) failures.push(`${rec.variant}: 越界文件竟然写成了（正对照不成立：这条命令本该被拒）`)
  if (rec.promptStdoutBytes === 0 && rec.promptStderrBytes === 0) {
    failures.push(`${rec.variant}: prompt 双流全空（"没跑"与"没被识别"不可分 ⇒ 本态作废）`)
  }
}
const u = get('unpatched')
const p = get('patched')
if (u !== undefined) {
  if (u.markerPresent) failures.push('unpatched: 摘掉修复件后仍出现 marker（负向对照①失败）')
  if (u.plainDenialWords.length === 0) failures.push('unpatched: 既无 marker 也看不到"普通失败"原文 ⇒ 无法证明命令真跑了（可能没跑）')
  if (!u.dumpConfig.sandboxRowPresent) failures.push('unpatched: dump-config 里官方 sandbox 行不见了（"其余仍活"不成立）')
  if (u.dumpConfig.sandboxRowDisabled) failures.push('unpatched: 官方 sandbox 行仍是被 disabled 的（摘掉不彻底）')
  if (u.dumpConfig.dialectRowPresent) failures.push('unpatched: dump-config 里仍有 sandbox-dialect 行（摘掉不彻底）')
}
if (p !== undefined) {
  if (!p.markerPresent) failures.push('patched: 挂上修复件后没有出现 marker（修复未生效）')
  if (!p.dumpConfig.sandboxRowPresent) failures.push('patched: 官方 sandbox 行消失（判据写错：应是"保留 + disabled"）')
  if (!p.dumpConfig.sandboxRowDisabled) failures.push('patched: 官方 sandbox 行没被 disabled（form B 没生效）')
  if (!p.dumpConfig.dialectRowPresent) failures.push('patched: dump-config 里没有 sandbox-dialect 行')
}
if (variants.length === VARIANTS.length && u !== undefined && p !== undefined) {
  if (!(u.markerPresent === false && p.markerPresent === true)) {
    failures.push('双锚不成立：两态 marker 必须「unpatched=false / patched=true」')
  }
}

const evidencePath = join(EVIDENCE_DIR, '372-e2e.summary.json')
writeFileSync(evidencePath, JSON.stringify({ at: new Date().toISOString(), variants, results, failures }, null, 2))
console.log(`\n[372] 证据：${evidencePath}`)
if (failures.length > 0) {
  console.log('[372] ===== 判据失败 =====')
  for (const f of failures) console.log(`[372]   ✗ ${f}`)
  process.exit(process.exitCode === 124 ? 124 : 1)
}
console.log('[372] ===== 判据全过（双锚成立）=====')
process.exit(process.exitCode === 124 ? 124 : 0)
