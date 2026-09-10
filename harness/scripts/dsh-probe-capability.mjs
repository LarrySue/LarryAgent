/**
 * DSH SDK 通道能力边界探针（DSH-2.3 交付块 5 数据源）。
 *
 * 跑一次完整 prompt，统计事件流（events）与通知流（notifications）的
 * 类型/方法分布——回答选型问题"该通信面的能力边界（能做/明显做不了什么）"。
 *
 * Usage:
 *   node scripts/dsh-probe-capability.mjs "<message>"
 */
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

const message = process.argv[2] ?? 'Reply with exactly: probe ok'

const harness = new DeepSeekHarness({
  profile: 'sdk',
  provider: 'deepseek-official',
  // 2026-09-10 由 'deepseek-v4-flash' 更名（DeepSeek API 文档变更，老大指示统一）
  model: 'deepseek-flash',
  initializeTimeoutMs: 20_000,
})

try {
  const result = await harness.run(message)
  const eventTypes = new Map()
  for (const ev of result.events) {
    const key = ev.type ?? '(none)'
    eventTypes.set(key, (eventTypes.get(key) ?? 0) + 1)
  }
  const notifMethods = new Map()
  for (const n of result.notifications) {
    notifMethods.set(n.method, (notifMethods.get(n.method) ?? 0) + 1)
  }
  const out = {
    finalResponse: result.finalResponse,
    sessionId: result.sessionId,
    eventCount: result.events.length,
    eventTypeDistribution: Object.fromEntries(eventTypes),
    notificationCount: result.notifications.length,
    notificationMethodDistribution: Object.fromEntries(notifMethods),
  }
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`)
} finally {
  await harness.close()
}
