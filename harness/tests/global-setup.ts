/**
 * globalSetup + teardown（主进程可靠清理，R1 返工版 + 启动期过期清扫）
 *
 * 职责：
 * 1. **key 残留自检（必须在 rmSync 之前）**——扫所有 larry-test-* 目录，
 *    命中 sk-{16,} 即高警。顺序写死：先扫后删。若先删后扫则必然 ENOENT
 *    静默跳过——R1 返工根因，勿调回。
 * 2. **清理**——删除全部 larry-test-* 前缀临时目录（Vitest 5 无
 *    globalTeardown 配置；setupFiles 的 process.on('exit') 在 worker 下
 *    不触发（实测残留），此处是唯一可靠清理位）。
 * 3. 清理失败告警不静默（P7）。
 * 4. **启动期过期清扫**——teardown 只在跑完时执行；进程被强杀（taskkill /
 *    timeout）时 teardown 根本不会跑，目录就攒下来了（WB 2026-09-10 复验时
 *    见到 3 个历史残留：teardown 只清当次）。故启动时先扫一遍**过期**目录。
 *
 * 为什么在这：globalSetup 跑在主进程、所有 worker 结束后执行其返回值
 * （teardown）——主进程上下文才有文件系统可靠访问与稳定执行时序。
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, rmSync, statSync, writeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// 扫描判据与 real-api.ts 的自查**必须同源**（DSH-3 前置件 1 抽取为共享模块；
// 原实现逐字保留在 scan-keys.ts，勿在此处内联回副本）
import { scanForKeys } from './scan-keys'

/**
 * 启动期清扫的过期阈值。
 * 为什么是 2 小时：一次真实调用是分钟级（§6 实测含冷启动 ~106s），2 小时
 * 远超任何正常跑一次的时长 → 只可能是被杀进程的残留。用年龄而不是"全删"
 * 是为了**不误伤并发跑的另一次会话**（对方刚建的目录是"年轻"的）。
 */
const STALE_MS = 2 * 60 * 60 * 1000

/** 当前 tmp 下所有 larry-test-* 目录 */
function larryTempDirs(): string[] {
  const base = tmpdir()
  const targets: string[] = []
  for (const name of readdirSync(base)) {
    if (name.startsWith('larry-test-')) targets.push(join(base, name))
  }
  return targets
}

/** ⚠️ 先扫后删（顺序勿调——先删后扫必然 ENOENT 静默跳过，R1 返工根因） */
function scanResidue(dirs: readonly string[]): void {
  for (const dir of dirs) {
    try {
      const keyHits = scanForKeys(dir)
      if (keyHits.length > 0) {
        console.error(
          `[test-isolation] ⚠️ KEY RESIDUE: 临时目录残留疑似 key 明文（${keyHits.length} 处）——` +
            `可能 --real-api 模式泄漏，须人工检查: ${dir}`
        )
        for (const hit of keyHits) console.error(`[test-isolation]   at ${hit}`)
      }
    } catch (e) {
      console.error(`[test-isolation] key 扫描失败（目录异常）: ${dir} (${e})`)
    }
  }
}

/** 后删（含扫描失败/告警的目录，仍须清理）；失败告警不静默 */
function removeDirs(dirs: readonly string[], reason: string): void {
  for (const dir of dirs) {
    try {
      rmSync(dir, { recursive: true, force: true })
      console.log(`[test-isolation] ${reason} 清理: ${dir}`)
    } catch (e) {
      console.error(`[test-isolation] ${reason} 清理失败: ${dir} (${e})`)
    }
  }
}

/**
 * 退出安全网（2026-09-10 老大裁决：**方案 A**；两方案详情与裁决记录见
 * exchange/log-claude.md「防挂死安全网」节，勿凭记忆改语义）。
 *
 * 为什么需要：WB 复验时遇到「测试跑完但进程不退出」（挂到被 timeout 杀掉，
 * CI 拿不到退出码）；本地按同一入口多次复跑未复现，根因未定位 → 先把**症状**
 * 变成可诊断、有退出码，而不是无限挂起。
 *
 * 机制：**unref'd 定时器**——正常时零成本、不改变任何行为（loop 排空即自然退出，
 * 定时器不触发）；只有当进程被句柄/子进程拖住时才会触发 → 打印诊断后强制退出。
 *
 * 退出码口径（方案 A 的关键，勿改成 B）：**用 vitest 的真实结果**
 * （`process.exitCode`；测试全绿=0），并打醒目告警。理由：根因在 SDK 侧时把
 * 绿跑判红是**假红**——"假红比没护栏更糟"（WB 文档已立此原则）。
 * ⚠️ 触发即代表"进程没能自退"，告警行必须保留其刺眼程度，不得降级为普通日志。
 *
 * ⏱️ 为什么是 8s 而不是更长：**vite 自己有一条 10s 的 close 超时**，超时后它会打印
 * `close timed out after 10000ms` 然后退出——但那条消息**不点名谁在拖**。实测
 * （2026-09-10，反向哨兵）：设成 15s 时本网**根本轮不到触发**，进程被 vite 提前带走。
 * 故必须早于它：8s 触发 → 先打出**点名到句柄/进程**的诊断，再按真实退出码退出。
 * 健康跑里 teardown→退出是毫秒级（实测整套 0.83s），不会误触发。
 * ⚠️ 本网只覆盖「主进程在 teardown 之后被拖住」；**worker/进程池层面的挂起
 * （teardown 都到不了）不在其覆盖内**——那种要靠入口脚本的墙钟看门狗，见报告。
 */
const EXIT_NET_MS = 8_000

/** 触发时打印的诊断：活跃句柄 + 进程树（都是"谁拖着不退"的直接线索） */
function exitNetDiagnostics(): string {
  const lines: string[] = []
  try {
    lines.push(`活跃资源: ${JSON.stringify(process.getActiveResourcesInfo())}`)
  } catch (e) {
    lines.push(`活跃资源读取失败: ${e}`)
  }
  try {
    const ps =
      "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -or $_.Name -eq 'dsh.exe' } | " +
      'ForEach-Object { $c = $_.CommandLine; if ($c.Length -gt 100) { $c = $c.Substring(0, 100) }; ' +
      '"{0}|parent={1}|{2}" -f $_.ProcessId, $_.ParentProcessId, $c }'
    lines.push(`node/dsh 进程:\n${execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf-8', timeout: 20_000 }).trim()}`)
  } catch (e) {
    lines.push(`进程树读取失败: ${e}`)
  }
  return lines.join('\n')
}

function armExitNet(): void {
  const net = setTimeout(() => {
    // 走到这里 = 清理已结束但进程没退；console.* 可能被 process.exit 截断 → 同步写 fd 2
    writeSync(
      2,
      `[test-isolation] ⚠️ EXIT-NET FIRED: 进程跑完后 ${EXIT_NET_MS / 1000}s 仍未退出（句柄/子进程残留），已按真实退出码强制退出。\n` +
        `[test-isolation]   退出码=${process.exitCode ?? 0}（方案 A：不因残留本身判红，见 exchange/log-claude.md 裁决记录）\n` +
        `[test-isolation] ${exitNetDiagnostics().replace(/\n/g, '\n[test-isolation] ')}\n`
    )
    process.exit(process.exitCode ?? 0)
  }, EXIT_NET_MS)
  net.unref()
}

export default function setup(): () => void {
  // 反向哨兵（取证用，勿常开）：故意在主进程留一个 ref'd 句柄，使 loop 无法排空，
  // 验证「退出安全网」真的会触发（否则安全网只是"写了没验证过"）。
  // 用法（bash，harness/ 下）：LARRY_TEST_EXIT_NET_SELFTEST=1 node node_modules/vitest/vitest.mjs run tests/real-api.test.ts
  // 预期：跑完约 15s 后 stderr 出现 `⚠️ EXIT-NET FIRED` + 诊断，退出码=本次测试真实结果。
  if (process.env.LARRY_TEST_EXIT_NET_SELFTEST === '1') {
    setInterval(() => {}, 1000)
  }

  // 启动期：清**过期**残留（强杀不执行 teardown 的历史垃圾）。判据同 teardown：先扫后删。
  const stale: string[] = []
  for (const dir of larryTempDirs()) {
    try {
      if (Date.now() - statSync(dir).mtimeMs > STALE_MS) stale.push(dir)
    } catch {
      // 读不到状态（并发删除等）→ 不擅动，留给下次
    }
  }
  if (stale.length > 0) {
    scanResidue(stale)
    removeDirs(stale, '过期残留')
  }

  return () => {
    const targets = larryTempDirs()
    scanResidue(targets)
    removeDirs(targets, 'global teardown')
    // 清理收尾后布防：正常时（loop 排空）进程先退，定时器不触发 → 零成本
    armExitNet()
  }
}
