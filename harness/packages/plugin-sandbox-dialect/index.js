/**
 * Windows sandbox denial-dialect fix (DSH-2.5 ③).
 *
 * PROBLEM: `dsh-sandbox-local` assembles the denial dialect from a hard-coded
 * module constant (`DENIAL_SIGNATURES`, packages/sandbox/sandbox-local/src/index.ts),
 * and its plugin Config exposes only `runnerCommand` / `runnerFailureSignatures`
 * / `probeTimeoutMs` — there is NO config injection point for the signature list.
 * On Windows the `windows-acl` dialect is
 *   ['access is denied', 'access to the path', 'permission denied']
 * which misses two real denial families:
 *   ② EPERM text — `node` reports `EPERM: operation not permitted` (the shipped
 *      entry `permission denied` is the EACCES wording); this one is
 *      LANGUAGE-INDEPENDENT, so plain English Windows misses it too.
 *   ① zh-CN localization — cmd `拒绝访问。` / powershell `对路径"…"的访问被拒绝。`
 *      (not reproduced on this host under the runner path, kept defensively).
 *
 * FIX (ours, not the third-party package): subclass the shipping provider and
 * append the missing dialect entries to the `ConfinedArgv` it returns. Mounted
 * by pointing the profile's `sandbox` row at this plugin, so the upstream
 * package stays untouched and survives upgrades.
 *
 * Why `enforcement === 'partial'` gates the patch: on win32 the only platform
 * candidate is the windows-acl runner, whose static enforcement is `partial`
 * (packages/sandbox/sandbox-local/src/index.ts STATIC_ENFORCEMENT). A caller
 * that configured a custom `runnerCommand` instead gets `enforcement: 'full'`
 * and its own dialect — we leave that path alone.
 *
 * @module @larryagent/plugin-sandbox-dialect
 */
import LocalSandboxProvider from '@deepseek-ai/dsh-sandbox-local'

/** Extra denial dialect entries for the Windows ACL restricted-token runner. */
export const WINDOWS_ACL_EXTRA_DENIALS = Object.freeze([
  'operation not permitted', // ② node EPERM (cross-language; the shipped entry is the EACCES wording)
  '拒绝访问', // ① cmd zh-CN: `拒绝访问。`
  '访问被拒绝', // ① powershell zh-CN: `对路径"…"的访问被拒绝。`
])

/**
 * The shipping local sandbox provider with the Windows denial dialect widened.
 * Registered as the same cordis service (`sandbox`) as its base class.
 */
export default class SandboxDialectProvider extends LocalSandboxProvider {
  /**
   * Wrap argv for confinement and widen the denial dialect on the windows-acl rung.
   * @param argv - the exact argv the caller is about to spawn.
   * @param policy - the file-effect policy for this execution.
   * @returns the base class's ConfinedArgv with the extra denial signatures appended.
   */
  confine(argv, policy) {
    const confined = super.confine(argv, policy)
    if (process.platform !== 'win32' || confined.enforcement !== 'partial') return confined
    return {
      ...confined,
      denialSignatures: [...confined.denialSignatures, ...WINDOWS_ACL_EXTRA_DENIALS],
    }
  }
}
