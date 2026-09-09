/**
 * LarryAgent Cordis bundle probe.
 *
 * Declares a `dsh.bundle.patch` so `dsh plugin --profile <name> add` mounts
 * this package as an external profile layer (the B1 channel), and `apply`
 * writes a config-tagged stderr breadcrumb so we can see cordis actually load
 * our package — and, after a config/patch change, reload it through the
 * profile's module-level HMR without a process restart. No business logic.
 * @module @larryagent/plugin-probe
 */

import type { Context } from '@deepseek-ai/cordis'

/** Cordis loader diagnostic name. */
export const name = 'larry-probe'

/** No services required — the bundle must load even before any plugin is ready. */
export const inject: string[] = []

/**
 * Breadcrumb emitted each time cordis activates this bundle. The tag changes
 * only when the profile patch (cordis.patch.yml) or this code is edited, so
 * seeing the new tag while the process stays alive proves the module (or its
 * config) was hot-reloaded rather than the process restarted.
 */
export function apply(_ctx: Context, config: { tag?: string }): void {
  const tag = config.tag ?? 'untagged'
  process.stderr.write(`[B1-PROBE] external bundle loaded by cordis (tag=${tag})\n`)
}
