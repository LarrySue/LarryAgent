/**
 * DSH-3 · 待实测 ① · workspace 运行时行为实测 —— 探针插件（被测件的消费面）
 *
 * 形态（先例：@larryagent/plugin-sandbox-dialect——实体复制进 profile 自身层 ＋ patch insert 行）：
 *   - 零 npm 依赖（node: 内建 only）⇒ 无共享层混代风险
 *   - 零静态 inject ⇒ 探针自身 fiber 立即 ACTIVE，apply 必跑（心跳帧）
 *   - `ctx.inject(['workspaceRegistry', 'sessions'], cb)` 运行时动态注入（SessionStore 构造器先例形态）：
 *       正轮：deps 满足 ⇒ cb 跑 J1–J5 ⇒ 落帧后 process.exit(0)
 *       负轮（peer 被 disable）：workspaceRegistry 永不 ACTIVE ⇒ cb 永不跑 ⇒ 15s 看门狗落 j6-pending 帧
 *       （动态 get 分层观测：workspaceRegistry=undefined vs sessions=visible）
 *
 * 输入（环境变量，由驱动注入）：WKSP_PROBE_OUT（结果 JSONL 路径，已建空文件）、WKSP_PROBE_DATA（数据根目录）
 * 输出：每判据一帧 JSONL（judge: heartbeat|J1..J5|j6-pending|probe-error|done），证据原文原样落盘
 *
 * 判据口径（权威：docs/dsh/dsh-migration.md §3.6）：
 *   J1 membership 过滤（集合恰等，⛔ 条数/无报错不算）／ J2 realpathNormalize 唯一性（同目录异写法 ⇒ 同实体）／
 *   J3 attachSession 正路（cwd 取自 workspace.path ⇒ SessionHeader.cwd 且 attach 通过）／
 *   J4 🔴 负向对照（cwd≠path ⇒ 拒绝 fail-loud；双锚 = 破坏面变红 ＋ 正常会话仍能 attach）／
 *   J5 Workspace 接口 11 成员逐条实调 ／ J6 强制启动依赖（负轮看门狗观测，判据在驱动侧对照正负两轮读数）
 */
import { appendFileSync } from 'node:fs'
import { mkdir, realpath } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = process.env.WKSP_PROBE_OUT
const DATA = process.env.WKSP_PROBE_DATA
const iso = () => new Date().toISOString()
const emit = (frame) => { appendFileSync(OUT, `${JSON.stringify(frame)}\n`) }
const setEq = (a, b) => a.size === b.size && [...a].every((v) => b.has(v))

let settled = false
let finished = false
const finish = (code, note) => {
  if (finished) return
  finished = true
  emit({ judge: 'done', t: iso(), code, note, settled })
  process.exit(code)
}

async function runJudgments(reg, sessions) {
  // ── 数据目录（真实目录，realpathNormalize 的前提）──
  const PA = join(DATA, 'ws-a')
  const PB = join(DATA, 'ws-b')
  await mkdir(PA, { recursive: true })
  await mkdir(PB, { recursive: true })
  const PA_CANON = await realpath(PA)

  // ── J1 · membership 过滤：wsA={s1,s2} 恰等、不含 s3；wsB={s3} ──
  const wsA = await reg.create(PA)
  const wsB = await reg.create(PB)
  const S1 = 'wksp-s1'
  const S2 = 'wksp-s2'
  const S3 = 'wksp-s3'
  await sessions.create(S1, { meta: { cwd: wsA.path } })
  await sessions.create(S2, { meta: { cwd: wsA.path } })
  await sessions.create(S3, { meta: { cwd: wsB.path } })
  await wsA.attachSession(S1)
  await wsA.attachSession(S2)
  await wsB.attachSession(S3)
  const setA = new Set(wsA.sessionIds)
  const setB = new Set(wsB.sessionIds)
  const j1 = {
    judge: 'J1',
    t: iso(),
    wsAPath: wsA.path,
    wsBPath: wsB.path,
    setA: [...setA],
    setB: [...setB],
    setAEqualsS1S2: setEq(setA, new Set([S1, S2])),
    setANotS3: !setA.has(S3),
    setBEqualsS3: setEq(setB, new Set([S3])),
  }
  j1.pass = j1.setAEqualsS1S2 && j1.setANotS3 && j1.setBEqualsS3
  emit(j1)

  // ── J2 · cwd 规范化唯一性：同一目录两种写法 ⇒ 同一实体（id/path/title）──
  // 字面拼接（不经 path.join 规范化）：尾分隔符写法 + '..' 段写法
  const inputA = `${PA}\\`
  const inputB = `${PA}\\..\\ws-a`
  const w2a = await reg.create(inputA)
  const w2b = await reg.create(inputB)
  const j2 = {
    judge: 'J2',
    t: iso(),
    inputA,
    inputB,
    idOrig: wsA.id,
    idA: w2a.id,
    idB: w2b.id,
    sameEntityA: w2a.id === wsA.id,
    sameEntityB: w2b.id === wsA.id,
    pathA: w2a.path,
    pathB: w2b.path,
    titleA: w2a.title,
    titleB: w2b.title,
    pathCanonicalEq: w2a.path === wsA.path && w2b.path === wsA.path,
    titleEq: w2a.title === wsA.title && w2b.title === wsA.title,
  }
  j2.pass = j2.sameEntityA && j2.sameEntityB && j2.pathCanonicalEq && j2.titleEq
  emit(j2)

  // ── J3 · attachSession 正路：新建会话 cwd 取自选定 workspace 的 path ⇒ 落进 SessionHeader.cwd 且 attach 通过 ──
  const S4 = 'wksp-s4'
  const s4 = await sessions.create(S4, { meta: { cwd: wsA.path } })
  const header = s4?.header
  await wsA.attachSession(S4)
  const j3 = {
    judge: 'J3',
    t: iso(),
    cwdSource: 'wsA.path',
    cwdValue: wsA.path,
    headerCwd: header?.cwd,
    headerVersion: header?.version,
    headerId: header?.id,
    headerFrozen: Object.isFrozen(header),
    cwdEqualsPath: header?.cwd === wsA.path,
    attachOk: new Set(wsA.sessionIds).has(S4),
  }
  j3.pass = j3.cwdEqualsPath && j3.attachOk
  emit(j3)

  // ── J4 · 🔴 负向对照（判别力所在）：cwd ≠ workspace.path ⇒ attach 拒绝 fail-loud ──
  // 双锚：s6（cwd=wsA.path）正常 attach 成功 ＋ s5（cwd=wsB.path）attach 到 wsA 必须抛错
  const S5 = 'wksp-s5'
  const S6 = 'wksp-s6'
  await sessions.create(S5, { meta: { cwd: wsB.path } })
  await sessions.create(S6, { meta: { cwd: wsA.path } })
  let anchorOk = false
  let anchorErr = null
  try {
    await wsA.attachSession(S6)
    anchorOk = true
  } catch (e) {
    anchorErr = `${e?.name}: ${e?.message}`
  }
  let breachError = null
  try {
    await wsA.attachSession(S5)
  } catch (e) {
    breachError = {
      name: e?.name,
      message: e?.message,
      cause: e?.cause === undefined ? null : String(e.cause),
      stackHead: (e?.stack ?? '').split('\n').slice(0, 8).join('\n'),
    }
  }
  const j4 = {
    judge: 'J4',
    t: iso(),
    trigger: `wsA.attachSession('${S5}') where s5.header.cwd=${wsB.path} != wsA.path=${wsA.path}`,
    anchorOk,
    anchorErr,
    breachThrew: breachError !== null,
    breachError,
    s5NotInWsA: !new Set(wsA.sessionIds).has(S5),
    s6InWsA: new Set(wsA.sessionIds).has(S6),
  }
  j4.pass = j4.anchorOk && j4.breachThrew && j4.s5NotInWsA && j4.s6InWsA
  emit(j4)

  // ── J5 · Workspace 接口 11 成员逐条实调（types.d.ts 官方清单）──
  const members = []
  const m = (member, ok, extra) => members.push({ member, ok, ...extra })
  m('id', typeof wsA.id === 'string' && wsA.id.length > 0, { kind: 'readonly', value: String(wsA.id) })
  m('path', wsA.path === PA_CANON, { kind: 'readonly', value: wsA.path, expect: PA_CANON })
  m('title', typeof wsA.title === 'string' && wsA.title.length > 0, { kind: 'readonly', value: wsA.title })
  m('createdAt', !Number.isNaN(Date.parse(wsA.createdAt)), { kind: 'readonly', value: wsA.createdAt })
  m('updatedAt', !Number.isNaN(Date.parse(wsA.updatedAt)), { kind: 'readonly', value: wsA.updatedAt })
  m('sessionIds', Array.isArray(wsA.sessionIds), { kind: 'readonly getter', value: [...wsA.sessionIds] })
  const titleBefore = wsA.title
  await wsA.setTitle('wksp-probe-renamed')
  m('setTitle(title)', wsA.title === 'wksp-probe-renamed' && titleBefore !== 'wksp-probe-renamed', { kind: 'method', before: titleBefore, after: wsA.title })
  m('attachSession(sessionId)', j1.pass && j3.pass && j4.pass, { kind: 'method', note: '实调见 J1/J3/J4 帧：正路 attach 成功 + 复校验拒绝越权' })
  const orderBefore = [...wsA.sessionIds]
  const first = orderBefore[0]
  const second = orderBefore[1]
  await wsA.insertSessionBefore(second, first)
  const orderMid = [...wsA.sessionIds]
  await wsA.insertSessionBefore(first)
  const orderAfter = [...wsA.sessionIds]
  m('insertSessionBefore(sessionId, beforeSessionId?)', orderMid[0] === second && orderAfter[orderAfter.length - 1] === first,
    { kind: 'method', orderBefore, orderMid, orderAfter, note: 'second 移到 first 前 + first 无锚 append 末尾' })
  await wsA.detachSession(S6)
  m('detachSession(sessionId)', !new Set(wsA.sessionIds).has(S6), { kind: 'method', sessionIdsAfter: [...wsA.sessionIds] })
  const st = await wsA.status()
  m('status()', st === 'ok', { kind: 'method', value: st })
  const j5 = { judge: 'J5', t: iso(), memberCount: members.length, members }
  j5.pass = members.length === 11 && members.every((x) => x.ok)
  emit(j5)
}

export default {
  name: '@larryagent/plugin-workspace-probe',
  apply(ctx) {
    emit({ judge: 'heartbeat', t: iso(), pid: process.pid, probe: '@larryagent/plugin-workspace-probe' })
    ctx.inject(['workspaceRegistry', 'sessions'], async (sub) => {
      settled = true
      try {
        await runJudgments(sub.workspaceRegistry, sub.sessions)
        finish(0, 'J1–J5 跑完，全部落帧')
      } catch (e) {
        emit({ judge: 'probe-error', t: iso(), name: e?.name, message: e?.message, stackHead: (e?.stack ?? '').split('\n').slice(0, 10).join('\n') })
        finish(1, '判据执行抛错')
      }
    })
    // J6 看门狗：inject 15s 未满足 ⇒ pending 观测落帧（负轮预期形态；正轮 settled 后不触发）
    setTimeout(() => {
      if (settled || finished) return
      const reg = ctx.get('workspaceRegistry')
      const ses = ctx.get('sessions')
      emit({
        judge: 'j6-pending',
        t: iso(),
        note: "ctx.inject(['workspaceRegistry','sessions']) 15s 未满足 ⇒ 动态 get 分层观测（J6 负轮预期形态）",
        dynamicGetWorkspaceRegistry: reg === undefined ? 'undefined' : String(reg),
        dynamicGetSessions: ses === undefined ? 'undefined' : 'visible',
        heartbeatAlive: true,
      })
      finish(0, 'J6 pending 观测落帧')
    }, 15_000)
  },
}
