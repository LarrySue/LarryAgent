#!/usr/bin/env node
/**
 * DSH-3.7.4-T ／ T-1 · `s0-e2e` 装置**两条破坏动作**的生效性 —— 独立最小装置
 *   ＋ DSH-3.7.4-T·P ／ T-1-a-POSIX · 同一件的 **Linux（POSIX）侧**分支
 *
 * 为什么存在：装置的负向对照靠两条"破坏动作"造红灯。**破坏动作没真生效 ⇒ 假红**
 * （看着像"判据抓到了问题"，其实被测对象根本没被动到）。本件在**机制层**独立测语义，
 * 与实现方 `J5`（装置层：跑变体看 `logPresent` 实测值）**互补、不重复**。
 *
 * ⛔ 本件**不经** `s0-e2e` 全链路、⛔ **不经** `installPlugin()`、⛔ 不读 Key、⛔ 不碰源 profile。
 *    它只回答机制问题；**它不对装置整体是否修好下任何结论**（那是 T-2 ／ T·P-Q3 的活）。
 *
 * 一条命令（仓根或 harness/ 下皆可）：
 *   node harness/scripts/s0-e2e-destructive-actions.mjs
 * 期望观测：见 stdout 尾部的 `[VERDICT]` 表（逐条给「装置/注释的声称」vs「实测」）。
 *
 * ⚠️ **退出码语义（与 run-s0-e2e 的 0=PASS 不同，故明写）**：本件是**观测器**不是判据 ——
 *    `0` = 全部观测已取得（**不代表装置对**）｜`1` = 探针自身故障／无法判定｜`2` = 前提缺失。
 *    把"破坏动作无效"判成退出码 1 会诱导读者以为"跑挂了"，而它恰恰是本件要报的**事实**。
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 平台纪律（**本件最重要的一条**）：
 *    `chmod` ／ ACL 两臂的**语义在两平台不同**，⛔ **不得跨平台外推任何一条结论**。
 *    · Windows 侧（T-1 实测）：`chmodSync(dir,0o500)` 落成 `0o444`，**Windows 对目录忽略只读属性**
 *      ⇒ 写照常成功 ⇒ **不构成写保护**；等价物是 `icacls /deny`。
 *    · POSIX 侧（T·P 要测）：`0o500` 是**真权限位**，非 root 应当 `EACCES`；**root 会绕过 DAC**
 *      ⇒ 所以本件**必报运行身份**（`uid`／`isRoot`），否则结论对生产无解释力。
 *    ⇒ 同一份脚本两平台都能跑、证据结构一致，**唯一目的就是让这条"不能外推"可被当场看见**。
 *
 * 🔴 临时根可换（**POSIX 侧的第二条通道**）：`S374T_SCRATCH_ROOT=<dir>` 指定临时根，
 *    以便在**不同文件系统**（`/tmp` tmpfs ／ `$HOME` overlayfs ／ `/dev/shm`）各跑一次 ——
 *    挂载类型与 overlayfs 的权限语义可能不同 ⇒ 结论须**并列**、不得合并。文件系统类型会打进证据。
 *
 * 证据：默认落 Windows `D:\Code\_claude-evidence\374t\` ／ POSIX `~/claude-tp-evidence/`
 *    （可 `S374T_EVIDENCE_DIR` 覆盖）：
 *   `t1-results.json`（结构化）｜`t1-transcript.txt`（人读原文）｜`t1a-icacls.raw.bin`（icacls 原文**字节**，仅 Windows）。
 *
 * 🔴 清理纪律：临时目录只在本进程 `mkdtempSync` 出的 path 下，用 `fs.rmSync(…,{recursive:true})` 删；
 *    ⛔ 无 `rm -rf`。子进程一律登记 pid，收尾杀并**复核确实死了**，没死就如实报 LITTER。
 */
import { spawn, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, accessSync, constants as FS } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

const IS_WIN = process.platform === 'win32'
const IS_POSIX = !IS_WIN
const DEFAULT_EVIDENCE = IS_WIN ? 'D:\\Code\\_claude-evidence\\374t' : join(homedir(), 'claude-tp-evidence')
const EVIDENCE_DIR = process.env.S374T_EVIDENCE_DIR ?? DEFAULT_EVIDENCE
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = { channel: {}, t1a: {}, t1b: {}, raw: [] }
const log = (s) => {
  console.log(s)
  results.raw.push(s)
}

/** 记录一条观测（禁止手工改写原文：这里存的就是工具/系统给的字符串） */
function rec(bucket, key, value) {
  bucket[key] = value
  log(`    ${key} = ${typeof value === 'string' ? value : JSON.stringify(value)}`)
}

/** 捕获 err 的原文样貌（code / errno / message 一字不改） */
const errShape = (e) => (e === undefined || e === null ? '(no error)' : { code: e.code ?? '(none)', errno: e.errno ?? '(none)', message: String(e.message) })

/**
 * 路径所在文件系统（⛔ 只读，不挂载任何东西）。
 * POSIX：从 `/proc/mounts` 取**最长前缀匹配**的挂载点与类型（tmpfs ／ overlay ／ ext4 语义可能不同）。
 * Windows：无 `/proc/mounts` ⇒ 标 `(win32)`（本件的 Windows 侧不区分文件系统）。
 */
function fsTypeOf(path) {
  if (IS_WIN) return { mount: '(win32)', type: '(win32)', dev: '(win32)' }
  try {
    const cands = readFileSync('/proc/mounts', 'utf8')
      .trim()
      .split('\n')
      .map((l) => l.split(' '))
      .filter((f) => f.length >= 3)
      .map(([dev, mp, type]) => ({ dev, mp, type: type.replace(/,.*$/, '') }))
      .filter((x) => path === x.mp || path.startsWith(x.mp.endsWith('/') ? x.mp : `${x.mp}/`))
      .sort((a, b) => b.mp.length - a.mp.length)
    return cands[0] ?? { mount: '(未匹配)', type: '(unknown)', dev: '(unknown)' }
  } catch (e) {
    return { mount: '(读 /proc/mounts 失败)', type: errShape(e).code, dev: '(unknown)' }
  }
}

/**
 * 试写：新建文件 + 建子目录（= 装置落盘真正要做的事），报实际结果。
 * ⚠️ `tag` 必传且各次调用不同 —— 同一目录复用同名目标会撞 `EEXIST`，把"本来就存在"
 *    误判成"写失败"（本件 v1 实测踩到：正对照被自己的谓词判红）。名字唯一 ⇒ 每次结果都自证。
 */
function tryWrite(dir, tag) {
  const out = { tag }
  try {
    writeFileSync(join(dir, `probe-${tag}-write.txt`), 'x')
    out.writeFile = { ok: true }
  } catch (e) {
    out.writeFile = { ok: false, err: errShape(e) }
  }
  try {
    mkdirSync(join(dir, `probe-${tag}-subdir`))
    out.mkdir = { ok: true }
  } catch (e) {
    out.mkdir = { ok: false, err: errShape(e) }
  }
  try {
    out.entriesAfter = readdirSync(dir)
  } catch (e) {
    out.entriesAfter = `readdir 失败：${errShape(e).code}`
  }
  return out
}

// ───────────────────────── 通道自报（结论必须写在通道上：四元组 = 通道 ＋ 运行时 ＋ 身份 ＋ 文件系统） ─────────────────────────
log('=== 通道自报 ===')
results.channel = {
  platform: process.platform,
  release: process.env.OS ?? '(unknown)',
  node: process.version,
  execPath: process.execPath,
  pid: process.pid,
  isMSYS: process.env.MSYSTEM ?? '(none)',
  isPwsh: process.env.PSModulePath !== undefined ? 'yes' : 'no',
  // POSIX 身份（T·P 的核心变量）：root 会绕过 DAC ⇒ 必须自报
  uid: typeof process.getuid === 'function' ? process.getuid() : '(n/a)',
  gid: typeof process.getgid === 'function' ? process.getgid() : '(n/a)',
  isRoot: typeof process.getuid === 'function' ? process.getuid() === 0 : '(n/a)',
  umask: `0o${process.umask().toString(8)}`,
  USER: process.env.USER ?? '(none)',
  USERDOMAIN: process.env.USERDOMAIN ?? '(none)',
  USERNAME: process.env.USERNAME ?? '(none)',
  tmpdir: tmpdir(),
  scratchRootOverride: process.env.S374T_SCRATCH_ROOT ?? '(未设，用 tmpdir)',
  cwd: process.cwd(),
}
for (const [k, v] of Object.entries(results.channel)) log(`  ${k} = ${String(v)}`)
const scratchRoot = process.env.S374T_SCRATCH_ROOT ?? tmpdir()
results.channel.scratchRoot = scratchRoot
results.channel.fs = fsTypeOf(scratchRoot)
log(`  scratchRoot 文件系统 = ${JSON.stringify(results.channel.fs)}`)
log(`  启动器 = ${process.argv[1]}`)

const me = IS_WIN ? (results.channel.USERDOMAIN === '(none)' ? results.channel.USERNAME : `${results.channel.USERDOMAIN}\\${results.channel.USERNAME}`) : results.channel.USER

// ───────────────────────── T-1-a · chmod 0o500 能否让写失败 ─────────────────────────
log(`\n=== T-1-a · \`chmodSync(dir, 0o500)\` 在 **${IS_WIN ? 'Windows' : 'POSIX'}** 上是否真能让写失败 ===`)
if (IS_POSIX && results.channel.isRoot === true) {
  log('  ⚠️⚠️ 本进程 **uid=0（root）** —— POSIX 权限位对 root **不构成**约束，本臂结果**不代表非 root 用户**。')
  log('      ⇒ 按 T·P 派发 §1.2：必须另在**非 root** 身份下补测，否则结论对生产不成立。')
}
const scratch = mkdtempSync(join(scratchRoot, 's374t-t1a-'))
log(`  临时根 = ${scratch}`)

// 臂 1：装置**旧**做法（POSIX 语义）—— chmod 0o500
{
  const dir = join(scratch, 'chmod500')
  mkdirSync(dir)
  chmodSync(dir, 0o500)
  const mode = statSync(dir).mode & 0o777
  log('\n  【臂 1 · chmod 0o500】（装置原注释的声称：只读 ⇒ 落盘必失败）')
  rec(results.t1a, 'arm1_modeAfterChmod500', `0o${mode.toString(8)}`)
  // ⛔ accessSync 只查属性位、不代表实际写结果 ⇒ 仅作对照留存，**不作判据**
  let accessVerdict
  try {
    accessSync(dir, FS.W_OK)
    accessVerdict = 'W_OK 通过（accessSync 认为可写）'
  } catch (e) {
    accessVerdict = `W_OK 抛错（${errShape(e).code}）`
  }
  rec(results.t1a, 'arm1_accessSyncW_OK_非判据', `${accessVerdict} —— 此值只作对照，判据是下面的实际写结果`)
  rec(results.t1a, 'arm1_actualWrite', tryWrite(dir, 'a1'))

  // 正对照：同一目录回到 0o700，写必须成功（证明装置本身有效，不是"到处都写不进"）
  log('\n  【臂 1 正对照 · 同一目录 0o700】（期望：写成功）')
  chmodSync(dir, 0o700)
  rec(results.t1a, 'arm1p_modeAfterChmod700', `0o${(statSync(dir).mode & 0o777).toString(8)}`)
  rec(results.t1a, 'arm1p_actualWrite', tryWrite(dir, 'a1p'))
  // 臂 1 的产物是否**真落了盘**（不是"报成功其实没写"）
  rec(results.t1a, 'arm1p_arm1ArtifactsPersisted', readdirSync(dir).filter((x) => x.startsWith('probe-a1-')))
}

// 臂 2：装置**现**做法（**Windows 分支**）—— ACL 拒绝。⛔ POSIX 上无此手段，跳过并列明
if (IS_WIN) {
  const dir = join(scratch, 'acl')
  mkdirSync(dir)
  log('\n  【臂 2 · icacls /deny (AD,WD)】（装置修复后 Windows 分支的声称：子项创建/写入 EPERM）')
  // 原文按**字节**留证（本机 icacls 输出为本地化编码，手工转写会让证据链失去可采信性）
  const deny = spawnSync('icacls', [dir, '/deny', `${me}:(AD,WD)`], { encoding: 'buffer' })
  const rawBytes = Buffer.concat([deny.stdout ?? Buffer.alloc(0), deny.stderr ?? Buffer.alloc(0)])
  results.t1a.arm2_icaclsRawBytes = rawBytes.toString('base64')
  let decoded
  try {
    decoded = new TextDecoder('gbk').decode(rawBytes)
  } catch {
    decoded = rawBytes.toString('utf8')
  }
  rec(results.t1a, 'arm2_icaclsDenyExit', deny.status)
  rec(results.t1a, 'arm2_icaclsDenyOut', decoded.replace(/\r?\n/g, ' ⏎ ').trim())
  rec(results.t1a, 'arm2_actualWrite', tryWrite(dir, 'a2'))

  // 撤销：证明"能恢复"且证明前面失败/成功的成因是 ACL 本身（而非路径错、盘只读）
  log('\n  【臂 2 撤销 · icacls /remove:d】（期望：恢复可写）')
  const undo = spawnSync('icacls', [dir, '/remove:d', me], { encoding: 'buffer' })
  const undoRaw = Buffer.concat([undo.stdout ?? Buffer.alloc(0), undo.stderr ?? Buffer.alloc(0)])
  results.t1a.arm2_icaclsUndoRawBytes = undoRaw.toString('base64')
  let undoDecoded
  try {
    undoDecoded = new TextDecoder('gbk').decode(undoRaw)
  } catch {
    undoDecoded = undoRaw.toString('utf8')
  }
  rec(results.t1a, 'arm2_icaclsUndoExit', undo.status)
  rec(results.t1a, 'arm2_icaclsUndoOut', undoDecoded.replace(/\r?\n/g, ' ⏎ ').trim())
  rec(results.t1a, 'arm2_afterUndoWrite', tryWrite(dir, 'a2u'))
} else {
  log('\n  【臂 2 · icacls】跳过 —— `icacls` 是 **Windows 专用**手段（POSIX 上无对应物；')
  log('     POSIX 侧的正确手段就是臂 1 的 `chmod`，这正是本块要验的）。')
  rec(results.t1a, 'arm2_skipped', `skipped：icacls 为 Windows 专用（platform=${process.platform}）`)
}

// ───────────────────────── T-1-b · 负 PID 杀进程组的行为 ─────────────────────────
log(`\n=== T-1-b · \`process.kill(-pid, "SIGKILL")\` 在 **${IS_WIN ? 'Windows' : 'POSIX'}** 上能否带走孙进程 ===`)
const spawned = new Set()

/**
 * 造一对父子：直连子（detached ⇒ 自成一"组"）自己再 spawn 一个孙（长活）。
 * 拓扑对齐装置：测试 → `s0-kill-child.mjs`（直连子）→ dsh CLI（孙）。
 * `sunStdio`：`'ignore'` = 孙完全无句柄依赖；`'pipe'` = 孙的 stdio 是管道（更贴近装置 —— SDK 用管道跟 dsh CLI 讲 JSON-RPC）。
 */
async function makePair(tag, sunStdio = 'ignore') {
  const childCode = `
    const { spawn } = require('node:child_process');
    const sun = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: ${JSON.stringify(sunStdio)} });
    console.log(JSON.stringify({ sunPid: sun.pid, childPid: process.pid }));
    setInterval(()=>{},1000);
  `
  const child = spawn(process.execPath, ['-e', childCode], { detached: true, stdio: ['ignore', 'pipe', 'ignore'] })
  spawned.add(child.pid)
  let out = ''
  child.stdout.on('data', (d) => (out += d))
  const t0 = Date.now()
  while (!out.includes('sunPid') && Date.now() - t0 < 5000) await sleep(50)
  let ids
  try {
    ids = JSON.parse(out.trim().split('\n').filter(Boolean).pop())
  } catch {
    ids = { sunPid: NaN, childPid: child.pid }
  }
  spawned.add(ids.sunPid)
  await sleep(300)
  log(`  [${tag}] 直连子 pid=${child.pid}（自报 ${ids.childPid}）｜孙 pid=${ids.sunPid}`)
  return { child, sunPid: ids.sunPid, tag }
}

/** 探活：`process.kill(pid, 0)` —— 活着返回 true，死了抛 ESRCH */
function alive(pid) {
  try {
    process.kill(pid, 0)
    return { alive: true }
  } catch (e) {
    return { alive: false, err: errShape(e) }
  }
}

// 臂 3：整组杀（装置的主路径）
{
  const { child, sunPid } = await makePair('臂3 整组杀')
  rec(results.t1b, 'arm3_aliveBeforeKill_child', alive(child.pid))
  rec(results.t1b, 'arm3_aliveBeforeKill_sun', alive(sunPid))
  let groupKill
  try {
    process.kill(-child.pid, 'SIGKILL')
    groupKill = { ok: true }
  } catch (e) {
    groupKill = { ok: false, err: errShape(e) }
  }
  rec(results.t1b, 'arm3_groupKill(-pid)', groupKill)
  await sleep(1500)
  rec(results.t1b, 'arm3_after_child', { ...alive(child.pid), exitCode: child.exitCode, signalCode: child.signalCode })
  rec(results.t1b, 'arm3_after_sun', alive(sunPid))
}

// 臂 4：装置里的**回落路径**（只杀直连子）—— 回答"回落是否仍足以让 kill-client 变体成立"
{
  const { child, sunPid } = await makePair('臂4 只杀直连子')
  let directKill
  try {
    child.kill('SIGKILL')
    directKill = { ok: true }
  } catch (e) {
    directKill = { ok: false, err: errShape(e) }
  }
  rec(results.t1b, 'arm4_directKill', directKill)
  await sleep(1500)
  rec(results.t1b, 'arm4_after_child', { ...alive(child.pid), exitCode: child.exitCode, signalCode: child.signalCode })
  rec(results.t1b, 'arm4_after_sun', alive(sunPid))
  results.t1b.arm4_note = '本臂只证明**本探针拓扑**（node→node，孙 stdio=ignore）下孙是否存活；装置里孙是 dsh CLI（stdio 由 SDK 持有）⇒ 其存活性**待装置层实测**，不得据此外推。'
}

// 臂 4b：只杀直连子，但**孙的 stdio 是管道**（更贴近装置：SDK 与 dsh CLI 之间是管道 JSON-RPC）
{
  const { child, sunPid } = await makePair('臂4b 管道孙', 'pipe')
  try {
    child.kill('SIGKILL')
  } catch {
    /* 已退出 */
  }
  await sleep(1500)
  rec(results.t1b, 'arm4b_after_child', { ...alive(child.pid), exitCode: child.exitCode, signalCode: child.signalCode })
  rec(results.t1b, 'arm4b_after_sun', alive(sunPid))
  results.t1b.arm4b_note = '与臂 4 的唯一变量 = 孙的 stdio 形态（pipe vs ignore）；两臂都只杀直连子，看孙是否因此退出。'
}

// ───────────────────────── 收尾清理（并复核确实死透） ─────────────────────────
log('\n=== 收尾清理 ===')
const litter = []
// POSIX：连**进程组**一起收（负 pid 在 POSIX 有语义，能带走漏网的孙）；Windows：taskkill /T
for (const pid of spawned) {
  if (Number.isNaN(pid)) continue
  if (!alive(pid).alive) continue
  if (IS_WIN) {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'buffer' })
  } else {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* 已退出 */
    }
  }
}
await sleep(800)
for (const pid of spawned) {
  if (Number.isNaN(pid)) continue
  if (alive(pid).alive) litter.push(pid)
}
results.litter = litter
log(litter.length === 0 ? `  全部子进程已确认退出（登记 ${spawned.size} 个 pid）` : `  ⛔ 仍有存活进程（LITTER）：${litter.join(', ')}`)
try {
  rmSync(scratch, { recursive: true, force: true })
  log(`  临时目录已删：${scratch}（残留=${existsSync(scratch)}）`)
} catch (e) {
  log(`  ⛔ 临时目录删除失败：${errShape(e).code} —— 路径 ${scratch}`)
}

// ───────────────────────── 逐条判定（声称 vs 实测） ─────────────────────────
const w1 = results.t1a.arm1_actualWrite
const w1p = results.t1a.arm1p_actualWrite
const w2 = results.t1a.arm2_actualWrite
const w2u = results.t1a.arm2_afterUndoWrite
const b1 = (x) => x?.writeFile?.ok === true && x?.mkdir?.ok === true
const b0 = (x) => x?.writeFile?.ok === false && x?.mkdir?.ok === false
// ⚠️ 臂 1 的判定**必须带身份**：POSIX + root 时"写成功"不证明 chmod 无效，只证明 root 绕过 DAC
const arm1Verdict = () => {
  const isRoot = IS_POSIX && results.channel.isRoot === true
  if (b0(w1)) return '成立（写失败）'
  if (b1(w1)) return isRoot ? '⚠️ 不成立 —— 但本进程是 **root**（root 绕过 DAC），此结果**不代表非 root**' : IS_WIN ? '❌ 不成立（写与建目录都成功）' : '❌ 不成立（POSIX 非 root 下竟也写成功 ⇒ 意外，须查挂载/ACL）'
  return '部分成立（逐项见上）'
}
const verdicts = [
  ['T-1-a 臂1', '「chmod 0o500 ⇒ 写必失败」', arm1Verdict()],
  ['T-1-a 正对照', '「同一目录 0o700 ⇒ 写成功」', b1(w1p) ? '成立' : '❌ 不成立 ⇒ 装置有效性存疑'],
  ...(IS_WIN
    ? [
        ['T-1-a 臂2', '「icacls /deny (AD,WD) ⇒ 子项写入失败」', b0(w2) ? '成立' : b1(w2) ? '❌ 不成立' : '部分成立（逐项见上）'],
        ['T-1-a 臂2撤销', '「/remove:d ⇒ 恢复可写」', b1(w2u) ? '成立' : '❌ 不成立'],
      ]
    : [['T-1-a 臂2', '（icacls）', 'skipped —— Windows 专用手段，POSIX 无对应物']]),
  ['T-1-b 臂3', '「负 pid 整组杀 ⇒ 孙一并死」', results.t1b['arm3_groupKill(-pid)']?.ok === false ? '❌ 不成立（负 pid 直接抛错）' : results.t1b.arm3_after_sun?.alive === false ? '成立（孙已死）' : '❌ 不成立（孙仍活）'],
  ['T-1-b 臂4', '「只杀直连子 ⇒ 孙继续（回落不足）」', results.t1b.arm4_after_sun?.alive === true ? '成立（本拓扑下孙存活）' : '不成立（孙也死了）'],
  ['T-1-b 臂4b', '同上，但孙的 stdio 是管道', results.t1b.arm4b_after_sun?.alive === true ? '成立（管道孙存活）' : '不成立（管道孙也死了）'],
]
log('\n=== [VERDICT] 声称 vs 实测 ===')
for (const [id, claim, got] of verdicts) log(`  ${id.padEnd(14)} 声称：${claim.padEnd(34)} 实测：${got}`)
results.verdicts = verdicts
log(`\n  ⚠️ 本表只覆盖**机制层**；装置是否真修好 ⇒ 看装置层实测（T-2 ／ T·P-Q3）。`)
log(`  ⚠️ 平台纪律：本表结论**只对 ${IS_WIN ? 'Windows' : 'POSIX'} 成立**，⛔ 不得跨平台外推。`)

// ───────────────────────── 落盘 ─────────────────────────
mkdirSync(EVIDENCE_DIR, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
writeFileSync(join(EVIDENCE_DIR, 't1-results.json'), JSON.stringify({ at: new Date().toISOString(), ...results }, null, 2))
writeFileSync(join(EVIDENCE_DIR, `t1-transcript-${stamp}.txt`), results.raw.join('\n'))
if (IS_WIN) writeFileSync(join(EVIDENCE_DIR, 't1a-icacls.raw.bin'), Buffer.from(results.t1a.arm2_icaclsRawBytes ?? '', 'base64'))
log(`\n证据已落盘 ${EVIDENCE_DIR}：t1-results.json ／ t1-transcript-${stamp}.txt${IS_WIN ? ' ／ t1a-icacls.raw.bin' : ''}`)
log(`[SUMMARY] ${JSON.stringify({ platform: process.platform, uid: results.channel.uid, litter: litter.length, verdicts: verdicts.map((v) => `${v[0]}:${v[2].slice(0, 12)}`) })}`)

process.exit(litter.length > 0 ? 1 : 0)
