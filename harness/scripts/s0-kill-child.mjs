#!/usr/bin/env node
/**
 * 被 `tests/s0-e2e.test.ts` 的 **kill-client 负向对照**拉起的子进程：跑一次真实 prompt（与主链路同姿态：
 * sdk stdio 通道 ＋ 真模型），**唯一差别是会被父进程中途 SIGKILL** —— 用来验"已写入部分的完整性"。
 *
 * 姿态自证：执行器 = harness 的 dsh CLI；前导 = 无；home = 参数传入的临时 home；凭据层 = 环境变量。
 *
 * 用法：node scripts/s0-kill-child.mjs <home> <nonceFilePath> <model>
 */
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

const [home, noncePath, model] = process.argv.slice(2)
if (!home || !noncePath) {
  console.error('usage: node scripts/s0-kill-child.mjs <home> <nonceFilePath> <model>')
  process.exit(2)
}

const harness = new DeepSeekHarness({
  profile: 'sdk',
  provider: 'deepseek-official',
  model: model ?? 'deepseek-flash',
  dshHome: home,
  env: { ...process.env }, // Key 原样透传（父进程已注入）；本脚本不读不打印
  initializeTimeoutMs: 120_000,
  requestTimeoutMs: 240_000,
})

try {
  const result = await harness.run(
    `Use the read_file tool to read the file at ${noncePath}. Then reply with exactly the PING token inside it.`,
  )
  console.log(JSON.stringify({ sessionId: result.sessionId, finalResponse: result.finalResponse }))
} finally {
  await harness.close().catch(() => undefined)
}
