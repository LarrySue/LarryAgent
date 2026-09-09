/**
 * DSH prompt driver (SDK 通道复跑路径).
 *
 * Uses the official TS SDK (@deepseek-ai/dsh-sdk-client) to spawn the dsh
 * runtime (`--profile sdk`, stdio JSON-RPC), run one prompt, print the final
 * response, and shut down. This is the GUI-free reproducible path for
 * DSH-2.3: the Tauri client runs exactly this script under the hood.
 *
 * Env:
 *   DSH_HOME          Harness home (inherited by the spawned runtime)
 *   DEEPSEEK_API_KEY  model credential (passed through to the runtime)
 *
 * Usage:
 *   node scripts/dsh-prompt.mjs "your message"
 */
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

const message = process.argv[2]
if (!message) {
  console.error('usage: node scripts/dsh-prompt.mjs "<message>"')
  process.exit(2)
}

const harness = new DeepSeekHarness({
  profile: 'sdk',
  provider: 'deepseek-official',
  model: 'deepseek-v4-flash',
  initializeTimeoutMs: 20_000,
})

try {
  const result = await harness.run(message)
  process.stdout.write(`${result.finalResponse}\n`)
  process.stderr.write(`[dsh-prompt] session=${result.sessionId} events=${result.events.length} notifications=${result.notifications.length}\n`)
} finally {
  await harness.close()
}
