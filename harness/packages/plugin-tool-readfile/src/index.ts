/**
 * plugin-tool-readfile —— LarryAgent 首个**产品**插件（DSH-3.1 · S0 基础链路）
 *
 * **姿态自证**（docs/dsh/dsh-migration.md §3.6〈执行范式与边界〉要求）：
 *   本插件跑在 **sdk profile 的真实 boot 链路** 上 —— 经 `dsh plugin --profile sdk add <本包>` 挂进
 *   profile 的 bundle 层（与 DSH-2.5 探针同一通道 B1），由 cordis 在启动期 `apply()`；
 *   它注册的工具经 **真实 `ToolRuntime`（agent loop 的工具面）** 暴露给模型。
 *   判据姿势：`activate` 打点 = boot 期 apply 真执行；`tool-call` 打点 = 模型真调了本工具。
 *   ⛔ 不得用 `--dump-config` 判"已激活"（它只组配置树、不执行插件）。
 *
 * **设计纪律**（照 §3.6 事实 3 / 事实 8）：
 *   - `inject: []` 零硬依赖 —— 能力用 `ctx.get(...)` 探测，**缺失即降级**（不阻止 boot，不抛）；
 *   - `apply(ctx, config)` **必须容忍 `config === undefined`** —— patch 无 `config:` 块时 cordis 传 undefined，
 *     裸 `dsh plugin add` 会崩（社区件实证，该件 v0.4.0 才修）；
 *   - **零外部 import**（只用 `node:`）—— 插件以 link 方式挂载时，模块从**仓库目录**解析，
 *     取不到 profile 里的 `@deepseek-ai/*`；不 import 就没有这个坑；
 *   - 一切注册都走 `ctx.inject([...], …)` / `ctx.register` ⇒ 随插件卸载自动回收。
 *
 * 降级矩阵（能力 / 依赖服务 / 缺失时行为 / 卸载行为）：
 *   | 能力 | 依赖服务 | 缺失时行为 | 卸载行为 |
 *   |---|---|---|---|
 *   | 工具 `read_file` 注册 | `tools` | 记 `degraded` 打点后**静默返回**，插件仍处于已激活态 | `ctx.inject` 的 disposer 自动注销工具 |
 *   | 读文件内容 | 无（直接用 `node:fs`） | — | — |
 *   | `activate`/`tool-call` 打点 | 无（直接写文件） | 写失败则**只吞掉**（打点是诊断，不是业务） | — |
 *   @module plugin-tool-readfile
 */
import { appendFileSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve, sep } from 'node:path'

/** 诊断用显示名。 */
export const name = 'plugin-tool-readfile'

/** 零硬依赖：任何 profile 组合下都可加载（缺失即降级）。 */
export const inject: string[] = []

/** 本工具对模型暴露的名字。 */
export const TOOL_NAME = 'read_file'

/** 插件配置（全部可选 —— `apply` 必须容忍 `config === undefined`）。 */
export interface Config {
  /** 单次返回的最大字节数（默认 64 KiB）。 */
  maxBytes?: number
  /** 允许读取的根目录；设了就拒绝越界路径（默认不限制）。 */
  rootDir?: string
  /** 打点文件路径；`false` = 关闭打点；缺省 = `<DSH_HOME>/plugin-tool-readfile.activate.log`。 */
  activateMarker?: string | false
}

const DEFAULT_MAX_BYTES = 64 * 1024

/** 结构化最小 ctx —— 不 import 外部类型，避免 link 挂载下的解析失败。 */
interface ToolRegistry {
  register(definition: unknown): unknown
}
interface Ctx {
  get?(name: string): unknown
  inject?(names: string[], callback: (ctx: { tools?: ToolRegistry }) => void): unknown
}

/** 探测式取服务：缺失返回 undefined，**绝不抛**。 */
function probe<T>(ctx: Ctx, service: string): T | undefined {
  try {
    return typeof ctx.get === 'function' ? (ctx.get(service) as T | undefined) : undefined
  } catch {
    return undefined
  }
}

/** 打点落盘（失败只吞 —— 打点是诊断，不是业务）。 */
function trace(marker: string | null, record: Record<string, unknown>): void {
  if (marker === null) return
  try {
    mkdirSync(dirname(marker), { recursive: true })
    appendFileSync(marker, `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`)
  } catch {
    /* 探针/诊断失败不得影响 boot 与工具执行 */
  }
}

/** 打点文件路径：`false` 关闭；字符串用之；缺省落 DSH_HOME。 */
function markerPath(config: Config): string | null {
  if (config.activateMarker === false) return null
  if (typeof config.activateMarker === 'string' && config.activateMarker !== '') return config.activateMarker
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'plugin-tool-readfile.activate.log')
}

/**
 * 手搓 tool definition —— **不用 `defineTool`**。
 * 依据（015 源码 `dsh-tools/lib/index.js:2773`）：`tools.register()` 只校验
 * `output.{schema,render}`（＋ `name !== 'run_code'`、`timeoutMs` 形状），
 * **不要求** 定义由 `defineTool` 产出 ⇒ 零依赖即可注册。
 * @param config - 已归一化的配置
 * @param marker - 打点文件路径（null = 关闭）
 * @returns 可直接交给 `ctx.tools.register()` 的定义
 */
function buildTool(config: Config, marker: string | null): Record<string, unknown> {
  const maxBytes = typeof config.maxBytes === 'number' && config.maxBytes > 0 ? config.maxBytes : DEFAULT_MAX_BYTES
  return {
    name: TOOL_NAME,
    description:
      'Read a UTF-8 text file from local disk and return its content. Use this when you need the exact text of a file.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        path: { type: 'string', description: 'Path of the file to read (absolute, or relative to the process cwd).' },
        maxBytes: { type: 'integer', description: `Maximum bytes to return. Defaults to ${maxBytes}.` },
      },
      required: ['path'],
    },
    output: {
      schema: {
        // ⚠️ 这里必须是**标准 JSON Schema**（顶层 required 数组 + 属性内不带 required）！
        //    实测（dsh-tools:2777 `assertSupportedJsonSchema`）：
        //    `schema.properties.<k>.required is not supported on type "string"` ⇒ 注册直接抛。
        //    `defineTool` 的**输入 spec** 才用「属性内 required: true」，那是转换前的形态 —— 别照抄。
        type: 'object',
        additionalProperties: false,
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
          bytes: { type: 'integer' },
          truncated: { type: 'boolean' },
        },
        required: ['path', 'content', 'bytes', 'truncated'],
      },
      render: (_args: unknown, value: { path: string; content: string; bytes: number; truncated: boolean }) => [
        {
          type: 'text',
          text: `<path>${value.path}</path>\n<bytes>${value.bytes}</bytes>\n<truncated>${value.truncated}</truncated>\n<content>\n${value.content}\n</content>`,
        },
      ],
    },
    isConcurrencySafe: () => true,
    async execute(args: { path?: unknown; maxBytes?: unknown }): Promise<Record<string, unknown>> {
      const raw = String(args?.path ?? '')
      if (raw === '') throw new Error(`${TOOL_NAME}: \`path\` is required`)
      const absolute = isAbsolute(raw) ? raw : resolve(raw)

      if (typeof config.rootDir === 'string' && config.rootDir !== '') {
        const root = resolve(config.rootDir)
        if (absolute !== root && !absolute.startsWith(root + sep)) {
          trace(marker, { event: 'tool-deny', tool: TOOL_NAME, path: absolute, reason: 'outside rootDir' })
          throw new Error(`${TOOL_NAME}: path outside rootDir (${root})`)
        }
      }

      const asked = typeof args?.maxBytes === 'number' && args.maxBytes > 0 ? Math.floor(args.maxBytes) : maxBytes
      const limit = Math.min(asked, maxBytes)
      const bytes = statSync(absolute).size
      const buffer = readFileSync(absolute)
      const truncated = buffer.byteLength > limit
      const content = buffer.subarray(0, limit).toString('utf8')
      trace(marker, { event: 'tool-call', tool: TOOL_NAME, path: absolute, bytes, truncated })
      return { path: absolute, content, bytes, truncated }
    },
  }
}

/**
 * 插件入口：cordis 在依赖就绪后调用；`config` 可能是 undefined（必须容忍）。
 * @param ctx - cordis 上下文
 * @param config - 来自 `cordis.patch.yml` 的配置块；**允许 undefined**
 */
export function apply(ctx: Ctx, config?: Config | undefined): void {
  const normalized: Config = { ...(config ?? {}) } // ⭐ 容忍 undefined（§3.6 事实 8）
  const marker = markerPath(normalized)
  const toolsSeam = probe<ToolRegistry>(ctx, 'tools')
  const fsSeam = probe<{ readText?: unknown }>(ctx, 'fs')

  // ② 的 boot 期打点：stderr（人可读）＋ 落盘（可断言）
  process.stderr.write(
    `[plugin-tool-readfile] activate pid=${process.pid} tools=${typeof toolsSeam?.register === 'function'} config=${config === undefined ? 'undefined' : 'given'}\n`,
  )
  trace(marker, {
    event: 'activate',
    plugin: name,
    pid: process.pid,
    dshHome: process.env.DSH_HOME ?? null,
    configWasUndefined: config === undefined,
    caps: {
      toolsSeam: typeof toolsSeam?.register === 'function',
      fsSeam: typeof fsSeam?.readText === 'function',
    },
  })

  // ⚠️ 关键：**不能用探测结果当注册的前置**。
  //    `inject: []` ⇒ 本插件在 boot 很早就会被 apply，此刻 `tools` 往往**还没就绪**
  //    （实测：探测到 undefined，若据此 return 就永远不注册 ⇒ 只留 degraded。
  //      这正是"能力探测"与"依赖注入就绪"两回事的坑。）
  //    正确做法：注册一律走 `ctx.inject(['tools'], …)`（就绪后回调），探测结果只写进打点快照。
  const register = (tools: ToolRegistry | undefined): void => {
    if (typeof tools?.register !== 'function') {
      trace(marker, { event: 'degraded', plugin: name, reason: 'tools service missing at inject time: tool not registered' })
      return
    }
    try {
      tools.register(buildTool(normalized, marker))
      trace(marker, { event: 'tool-registered', plugin: name, tool: TOOL_NAME })
    } catch (e) {
      // ⚠️ 不能静默：注册失败必须留痕（否则表现为"插件激活了但工具没出现"，最难查）
      const detail = String((e as Error)?.message ?? e).slice(0, 600)
      trace(marker, { event: 'register-failed', plugin: name, tool: TOOL_NAME, error: detail })
      process.stderr.write(`[plugin-tool-readfile] register failed: ${detail}\n`)
    }
  }

  if (typeof ctx.inject === 'function') {
    trace(marker, { event: 'inject-requested', plugin: name, deps: ['tools'] })
    ctx.inject(['tools'], (tctx: { tools?: ToolRegistry }) => {
      trace(marker, { event: 'inject-fired', plugin: name, hasTools: typeof tctx?.tools?.register === 'function' })
      register(tctx?.tools ?? toolsSeam)
    })
  } else {
    // 极简/假 ctx（如单测）没有 inject ⇒ 退回探测到的服务
    register(toolsSeam)
  }
}
