/**
 * LarryAgent storage probe (DSH-2.5 task 1).
 *
 * Declares a custom storage-domain (`larry_probe`) with one table and writes a
 * record through `ctx.storageDomain`, which routes to whatever backend the
 * profile pinned (here: the external SQLite file /home/ubuntu/larry-data/larry.db).
 * The record's appearance in that file — plus a stderr breadcrumb — is the
 * proof that OUR data (not just DSH's own session_projcache) lands in OUR db.
 *
 * Deliberately dependency-free: this package is linked into the profile from
 * outside it, so any bare import ('zod', '@deepseek-ai/dsh-storage-domain')
 * would resolve against the harness tree and fail. The domain spec uses only
 * the runtime fields `descriptorOf` reads (name/version/tables) and an
 * identity `valueSchema`, so no zod instance is needed. Structured like the
 * shipping `dsh-storage-domain` plugin: a functional `ctx.inject(deps, cb)`
 * yields a live child fiber whose `effect` is valid.
 * @module @larryagent/plugin-storage-probe
 */

/** Cordis loader diagnostic name. */
export const name = 'larry-storage-probe'

/** Identity record schema — this probe asserts routing, not schema validation. */
const identitySchema = { parse: (value) => value }

/** Our domain declaration: name, format version, and one table. */
const probeDomain = {
  name: 'larry_probe',
  version: 1,
  tables: {
    items: { valueSchema: identitySchema },
  },
}

/**
 * Wait for the storage-domain facility, then open our domain over the routed
 * backend and write one durable record.
 * @param ctx - Cordis context (root of the plugin fiber).
 */
export function apply(ctx) {
  const fiber = ctx.inject(['storageDomain'], (probeCtx) => {
    probeCtx.effect(async () => {
      process.stderr.write('[STORAGE-PROBE] activating; opening domain larry_probe\n')
      const domain = await probeCtx.storageDomain.open(probeDomain)
      await domain.table('items').put('mem-1', {
        text: 'hello from larry storage probe',
        at: Date.now(),
      })
      const back = domain.table('items').get('mem-1')
      process.stderr.write(
        `[STORAGE-PROBE] wrote domain=larry_probe table=items key=mem-1 readback=${JSON.stringify(back)}\n`,
      )
    })
  })
  return Promise.resolve(fiber).then(() => {})
}
