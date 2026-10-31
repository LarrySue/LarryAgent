#!/usr/bin/env node
/**
 * ⑪.1 live 路径烟测：真实 dsh 临时 home 跑两轮（无 key ⇒ turn/end 以 error 收尾，
 * 但事件链与 manifest 刷真实发生）→ 验证 turn/end 钩子把清单写进临时 home。
 *
 * 运行：cd harness && node scripts/archive-manifest/live-smoke.mjs
 * 退出码：0 全绿 ／ 1 判据红 ／ 2 前置缺失
 */

import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

const HERE = import.meta.dirname
const HARNESS = resolve(HERE, '..', '..')
const REPO = resolve(HARNESS, '..')
const SRC_SDK = join(REPO, '.dsh-home', 'profiles', 'sdk')
const PLUGIN = join(HARNESS, 'packages', 'plugin-s4-memory')
const EVIDENCE = join(REPO, '_trae-evidence', 'archive-manifest')
const NL = String.fromCharCode(10)

const findings = []
const judge = (id, ok, detail) => {
  findings.push({ judge: id, ok, detail })
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(5)} ${id}  ${detail}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function makeHome() {
  const home = mkdtempSync(join(tmpdir(), 'am-live-'))
  mkdirSync(join(home, 'profiles'), { recursive: true })
  cpSync(SRC_SDK, join(home, 'profiles', 'sdk'), { recursive: true })
  rmSync(join(home, 'profiles', 'sdk', 'node_modules', '.modules.yaml'), { force: true })
  return home
}

function linkPlugin(home) {
  const dir = join(home, 'profiles', 'sdk', 'node_modules', '@larryagent')
  mkdirSync(dir, { recursive: true })
  // 已是实体目录也不怕：删除后 junction（测试 home 独立）
  rmSync(join(dir, 'plugin-s4-memory'), { recursive: true, force: true })
  symlinkSync(PLUGIN, join(dir, 'plugin-s4-memory'), 'junction')
}

function patch(home, dbPath) {
  const path = join(home, 'am-live.patch.yml')
  writeFileSync(path, `- id: larry-s4-memory${NL}  config:${NL}    dbPath: '${dbPath.replaceAll('\\', '/')}'${NL}`, 'utf8')
  return path
}

async function main() {
  if (!existsSync(join(PLUGIN, 'lib', 'manifest.js'))) {
    console.error('前置缺失：插件未编译（先跑 pnpm --filter @larryagent/plugin-s4-memory run build）')
    process.exit(2)
  }
  if (!existsSync(SRC_SDK)) {
    console.error('前置缺失：.dsh-home/profiles/sdk 不存在')
    process.exit(2)
  }
  mkdirSync(EVIDENCE, { recursive: true })

  const home = makeHome()
  linkPlugin(home)
  const dbPath = join(home, 'larry-memory.db')
  const patchPath = patch(home, dbPath)
  const env = { ...process.env, DSH_HOME: home }
  delete env.DEEPSEEK_API_KEY
  env.CI = '1'

  const harness = new DeepSeekHarness({
    profile: 'sdk',
    dshHome: home,
    env,
    patches: [patchPath],
    provider: 'deepseek-official',
    model: 'deepseek-flash',
    initializeTimeoutMs: 60_000,
    requestTimeoutMs: 120_000,
  })

  const manifestPath = join(home, 'sessions', 'archive-manifest.jsonl')
  const session = harness.session('session-manifest-live')

  try {
    try { await session.run('第一轮：manifest live 烟测') } catch (err) { console.log('turn1 error:', String(err?.message ?? err).slice(0, 200)) }
    await sleep(1500)
    const text1 = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : ''
    const entry1 = text1.split(NL).filter(Boolean).map((l) => JSON.parse(l))[0]
    judge('live-turn1-manifest', entry1?.archive_state === 'present' && entry1?.stats?.source === 'live-events',
      `exists=${existsSync(manifestPath)} entries=${entry1 ? 1 : 0} state=${entry1?.archive_state} source=${entry1?.stats?.source}`)
    if (entry1) {
      judge('live-turn1-fields', typeof entry1.checksum?.value === 'string' && entry1.checksum.covered_bytes > 0 && entry1.format?.read_with?.length >= 3,
        `sha=${entry1.checksum?.value?.slice(0, 12)}… bytes=${entry1.checksum?.covered_bytes} frames=${entry1.stats?.frames}`)
    }

    try { await session.run('第二轮：manifest 应更新同一行') } catch (err) { console.log('turn2 error:', String(err?.message ?? err).slice(0, 200)) }
    await sleep(1500)
    const text2 = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : ''
    const entry2 = text2.split(NL).filter(Boolean).map((l) => JSON.parse(l))[0]
    const lines2 = text2.split(NL).filter(Boolean).length
    judge('live-turn2-same-line', lines2 === 1 && entry2?.stats?.events > entry1?.stats?.events,
      `lines=${lines2} events ${entry1?.stats?.events} → ${entry2?.stats?.events}`)
    judge('live-turn2-hash-time', entry2?.checksum?.value !== entry1?.checksum?.value && entry2?.checksum?.computed_at !== entry1?.checksum?.computed_at,
      `hash ${entry1?.checksum?.value?.slice(0, 12)}… → ${entry2?.checksum?.value?.slice(0, 12)}…；time ${entry1?.checksum?.computed_at} → ${entry2?.checksum?.computed_at}`)

    // 存档实体必须与清单行指向的一致
    const archive = entry2?.archive
    const archiveAbs = archive ? resolve(home, archive) : ''
    judge('live-archive-match', archiveAbs.length > 0 && existsSync(archiveAbs),
      `清单 archive=${archive}；磁盘存在=${archiveAbs ? existsSync(archiveAbs) : false}`)
    writeFileSync(join(EVIDENCE, 'live-manifest-sample.jsonl'), text2, 'utf8')
    writeFileSync(join(EVIDENCE, 'live-findings.json'), `${JSON.stringify(findings, null, 2)}${NL}`, 'utf8')
  } finally {
    try { await harness.close() } catch { /* ignore */ }
    rmSync(home, { recursive: true, force: true })
  }
}

await main()
const failed = findings.filter((item) => !item.ok)
console.log(`${NL}summary: ${findings.length - failed.length}/${findings.length} PASS`)
process.exit(failed.length === 0 ? 0 : 1)
