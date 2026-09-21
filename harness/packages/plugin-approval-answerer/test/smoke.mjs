/**
 * plugin-approval-answerer 冒烟测试（**假 ctx 单测范式**，照 3.1 `test/smoke.mjs` 的做法）：
 * 逻辑层不真起 DSH —— 只实现本插件用到的 ctx 成员（`get` / `inject` / `on`），
 * 把"必须真跑"的部分（真 boot、真 waterfall、真审计事件）压到 e2e。
 * 运行：node test/smoke.mjs（先 `pnpm build`）
 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, inject, name, createLocalPolicyAnswerer, caseOfRequest } from '../lib/index.js'

const work = mkdtempSync(join(tmpdir(), 'plugin-approval-answerer-smoke-'))
const marker = join(work, 'answerer.log')
const events = (file) =>
  existsSync(file)
    ? readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
    : []

/**
 * 只实现本插件用到的成员：get / inject / on。
 * `on` 记录监听器（含 agent.ctx 上的），供断言"注册接线"。
 */
function fakeCtx({ withSeam = true, answererService } = {}) {
  const rootListeners = new Map()
  const agentCtxListeners = new Map()
  const injectCalls = []
  const approval = withSeam ? { request: async () => 'unavailable' } : undefined
  const services = { approval, ...(answererService !== undefined ? { approvalAnswerer: answererService } : {}) }
  const agentCtx = {
    on(event, listener) {
      agentCtxListeners.set(event, [...(agentCtxListeners.get(event) ?? []), listener])
      return () => {}
    },
  }
  const ctx = {
    get: (service) => services[service],
    inject(names, callback) {
      injectCalls.push(names)
      const sub = {}
      for (const n of names) if (services[n] !== undefined) sub[n] = services[n]
      callback(sub)
      return () => {}
    },
    on(event, listener) {
      rootListeners.set(event, [...(rootListeners.get(event) ?? []), listener])
      return () => {}
    },
  }
  return { ctx, rootListeners, agentCtxListeners, injectCalls, agentCtx, emitAgentCreated: (id) => {
    for (const l of rootListeners.get('agent/created') ?? []) l({ agent: { id, ctx: agentCtx } })
  } }
}

// ① 声明面：零硬依赖
assert.equal(name, 'plugin-approval-answerer')
assert.deepEqual(inject, [], 'inject 必须是空数组（零硬依赖，缺失即降级）')

// ② 容忍 config === undefined ＋ 注册接线（J1）
{
  const savedDshHome = process.env.DSH_HOME
  process.env.DSH_HOME = work
  const h = fakeCtx()
  try {
    apply(h.ctx) // ⛔ 不传 config —— 关键用例（patch 无 config 块时 cordis 传 undefined）
    assert.ok(existsSync(join(work, 'plugin-approval-answerer.log')), '缺省打点必须落在 <DSH_HOME> 下')
  } finally {
    if (savedDshHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = savedDshHome
  }
  // 注册走 inject（不是用探测结果当前置）
  assert.deepEqual(h.injectCalls, [['approval']], '必须且只能请求注入 approval')
  const defaultMarker = events(join(work, 'plugin-approval-answerer.log')).map((r) => r.event)
  assert.ok(defaultMarker.includes('activate'), 'config=undefined 时也必须 activate')
  assert.ok(defaultMarker.includes('inject-requested'), '必须请求注入 approval')
  assert.ok(defaultMarker.includes('inject-fired'), '注入回调必须触发')
  assert.equal(readFileSync(join(work, 'plugin-approval-answerer.log'), 'utf8').length > 0, true)
}

// ③ scope=first：等 agent 创建，在 **agent.ctx** 上注册（这就是 scope filter 的实现处）
{
  const h = fakeCtx()
  apply(h.ctx, { activateMarker: marker })
  const seen = events(marker).map((r) => r.event)
  assert.ok(seen.includes('agent-watch-armed'), 'scope=first 必须先挂 agent/created 观察')
  assert.ok(!h.agentCtxListeners.has('approval/request'), 'agent 出现前不得注册答者')

  h.emitAgentCreated('agent-A')
  assert.equal((h.agentCtxListeners.get('approval/request') ?? []).length, 1, '答者必须注册在 agent.ctx 上')
  const reg = events(marker).filter((r) => r.event === 'answerer-registered').at(-1)
  assert.equal(reg.scope, 'agent')
  assert.equal(reg.via, 'agent.ctx')
  assert.equal(reg.agentId, 'agent-A')

  // 第二个 agent 出现：答者**不**再注册（限定到首个 ⇒ 只收它的请求）
  h.emitAgentCreated('agent-B')
  assert.equal((h.agentCtxListeners.get('approval/request') ?? []).length, 1, '不得为第二个 agent 再注册答者')
}

// ④ 答者行为逐条（五条用例的判定源）
{
  const h = fakeCtx()
  apply(h.ctx, { activateMarker: marker, policy: 'from-request' })
  h.emitAgentCreated('agent-A')
  const answerer = h.agentCtxListeners.get('approval/request')[0]
  const next = () => Promise.resolve('unavailable')
  const ask = (c) => answerer({ toolName: 'approval_probe', reason: `case=${c}` }, next)

  assert.equal(await ask('approve'), 'allowed-once', '批准 ⇒ allowed-once（唯一授权）')
  assert.equal(await ask('reject'), 'rejected', '拒绝 ⇒ rejected')
  await assert.rejects(() => ask('throw'), /答者故障/, '答者抛错必须真抛（由服务归一化为 unavailable）')
  assert.equal(await ask('malformed'), 'maybe', '不合词汇的返回值必须原样返回给服务（由它归一化）')
  assert.equal(await ask('delegate'), 'unavailable', '不认领时必须走 next() 委托（此处 next 返回 unavailable）')
  // 超时用例：答者永不兑现 ⇒ 断言"pending"打点存在且未 settle
  const pending = ask('timeout')
  const raced = await Promise.race([pending.then(() => 'settled'), Promise.resolve('pending')])
  assert.equal(raced, 'pending', 'timeout 策略下答者不得自行兑现（撤回交给请求方 signal）')
  assert.ok(events(marker).some((r) => r.event === 'answerer-pending'), '必须留 answerer-pending 打点（不许静默）')

  // 每条都留了可观测日志（防"静默 fail-closed"造假绿）
  const rows = events(marker)
  assert.ok(rows.filter((r) => r.event === 'answerer-request').length >= 6, '每次请求都要留 answerer-request')
  assert.ok(rows.some((r) => r.event === 'answerer-threw'), '抛错必须留痕')
  assert.ok(rows.some((r) => r.event === 'answerer-delegated'), '委托必须留痕')
}

// ⑤ scope=all：退化为**全局答者**（负向对照用；注册在根 ctx）
{
  const h = fakeCtx()
  apply(h.ctx, { activateMarker: marker, scope: 'all' })
  assert.equal((h.rootListeners.get('approval/request') ?? []).length, 1, 'scope=all 时必须注册在根 ctx')
  const reg = events(marker).filter((r) => r.event === 'answerer-registered').at(-1)
  assert.equal(reg.scope, 'global')
  assert.equal(reg.via, 'root-ctx')
}

// ⑥ J5：`approvalAnswerer` 是**可替换接口** —— 外部注入后答者本体不改
{
  const calls = []
  const external = {
    source: 'fake-remote-answerer',
    decide: (req) => {
      calls.push(req.toolName)
      return 'rejected'
    },
  }
  const h = fakeCtx({ answererService: external })
  apply(h.ctx, { activateMarker: marker, scope: 'all' })
  const act = events(marker).filter((r) => r.event === 'activate').at(-1)
  assert.equal(act.injectedAnswerer, true, '必须探测到外部注入的 approvalAnswerer')
  assert.equal(act.source, 'fake-remote-answerer', '答者来源必须变成注入实现')
  const answerer = h.rootListeners.get('approval/request')[0]
  assert.equal(await answerer({ toolName: 'T' }, () => Promise.resolve('unavailable')), 'rejected')
  assert.deepEqual(calls, ['T'], '判定必须走注入实现（本体未被写死）')
}

// ⑦ 单测层面核对策略→行为映射（不依赖 ctx）
{
  assert.equal(caseOfRequest({ reason: 'case=reject' }), 'reject')
  assert.equal(caseOfRequest({ reason: 'x case=approve y' }), 'approve')
  assert.equal(caseOfRequest({ reason: 'no marker' }), '')
  assert.equal(caseOfRequest({}), '')
  assert.equal(createLocalPolicyAnswerer({ policy: 'reject' }).decide({}), 'rejected')
  assert.equal(createLocalPolicyAnswerer({ policy: 'delegate' }).decide({}), 'delegate')
}

// ⑧ 降级：没有 approval 服务时**不抛**，只记 degraded（插件仍处已激活态）
{
  const h = fakeCtx({ withSeam: false })
  const degradedMarker = join(work, 'marker-degraded.log')
  assert.doesNotThrow(() => apply(h.ctx, { activateMarker: degradedMarker }), '缺 approval 服务不得抛错')
  const rows = events(degradedMarker)
  assert.ok(rows.some((r) => r.event === 'activate'), '必须有 activate 打点')
  assert.ok(rows.some((r) => r.event === 'inject-requested'), '必须请求注入 approval（而非拿探测结果当前置）')
  assert.equal(rows.filter((r) => r.event === 'inject-fired')[0].hasApproval, false)
  assert.ok(!rows.some((r) => r.event === 'answerer-registered'), '缺服务时不得注册答者')
}

rmSync(work, { recursive: true, force: true })
console.log('smoke ok')
