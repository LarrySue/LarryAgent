/**
 * S4 记忆插件 · 本地 embedding（P0② 第一期）
 *
 * 预处理四项与 `harness/scripts/embed-probe/ts-embed.mjs` 逐项对齐，⛔ 一项都不许改：
 *   - model: Xenova/bge-small-zh-v1.5（与 Python 侧同一模型）
 *   - pooling: CLS（last_hidden_state 的 position 0）
 *   - post: L2 normalize
 *   - max_length: 512 ＋ lowercase（Python sentence-transformers 的 do_lower_case: true）
 * 任一项不对齐会产生 `0.77` 级假漂移（docs/dsh/dsh-migration.md:1424）。
 *
 * 依赖可达性：调用方保证 `@huggingface/transformers` 能从插件实体目录解析（P1）。
 * 模型缓存目录：配置项 `modelCacheDir`（支持 `${DSH_HOME}` 占位与相对路径）；
 * 留空时 transformers.js 落回它自己的默认 `.cache`（P2 的另一条读数）。
 */
import { createRequire } from 'node:module'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'

/** 就绪检查所需的非 onnx 文件（onnx 目录另有任意 .onnx 检查） */
const REQUIRED_MODEL_FILES = ['config.json', 'tokenizer.json', 'tokenizer_config.json']

export interface EmbedderOptions {
  /** HF model id，例如 Xenova/bge-small-zh-v1.5 */
  modelId: string
  /** 解析后的绝对路径；null = 未配置，沿用 transformers.js 默认 */
  cacheDir: string | null
}

export interface Embedder {
  /** 纯同步文件检查：模型文件齐不齐（⛔ 不看加载 Promise） */
  ready(): boolean
  /** 后台预取模型（不改变 ready() 语义） */
  prewarm(): Promise<void>
  /** 单条文本 → 512 维 Float32 向量 */
  encode(text: string): Promise<number[]>
}

/**
 * 配置项 modelCacheDir → 绝对路径（空/空白 ⇒ null）。
 * 与 dbPath 同口径：`${DSH_HOME}` 占位替换；相对路径按当前 home 解析。
 */
export function resolveModelCacheDir(raw: string | undefined, home: string): string | null {
  const value = (raw ?? '').trim()
  if (!value) return null
  const substituted = value.split('${DSH_HOME}').join(home)
  return isAbsolute(substituted) ? resolve(substituted) : resolve(home, substituted)
}

/** transformers.js 未配 cacheDir 时的默认落点（实测 = 包根目录/.cache） */
export function defaultModelCacheDir(): string | null {
  try {
    const req = createRequire(import.meta.url)
    // ⚠️ 解析 `package.json` 子路径会被 exports 挡（ERR_PACKAGE_PATH_NOT_EXPORTED）；
    // 改从入口文件向上找 package.json，兼容 dist/ 布局。
    const entry = req.resolve('@huggingface/transformers')
    for (const root of [dirname(entry), dirname(dirname(entry))]) {
      try {
        const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name?: string }
        if (pkg.name === '@huggingface/transformers') return join(root, '.cache')
      } catch { /* 试下一个候选 */ }
    }
  } catch { /* 解析失败 */ }
  return null
}

/** 模型文件是否已在缓存目录（同步、廉价；每次召回前可调用） */
export function isModelReady(cacheDir: string | null, modelId: string): boolean {
  const base = cacheDir ?? defaultModelCacheDir()
  if (!base) return false
  const root = join(base, ...modelId.split('/'))
  try {
    if (!REQUIRED_MODEL_FILES.every((file) => existsSync(join(root, file)))) return false
    const onnxDir = join(root, 'onnx')
    if (!existsSync(onnxDir)) return false
    return readdirSync(onnxDir).some((file) => file.endsWith('.onnx'))
  } catch {
    return false
  }
}

/** transformers.js 动态产物只在两处调用；用宽类型，避免把上游类型面钉进插件 */
type AnyCall = (...args: any[]) => any

interface LoadedEmbedder {
  tokenizer: AnyCall
  model: AnyCall
}

export function createEmbedder(options: EmbedderOptions): Embedder {
  let loaded: Promise<LoadedEmbedder> | null = null

  const load = async (): Promise<LoadedEmbedder> => {
    const tf = await import('@huggingface/transformers')
    if (options.cacheDir) tf.env.cacheDir = options.cacheDir
    // 与参考探针同口径：本地优先；国内默认走 hf-mirror（HF_ENDPOINT 可覆写）
    tf.env.allowLocalModels = true
    tf.env.useBrowserCache = false
    tf.env.remoteHost = process.env.HF_ENDPOINT ?? 'https://hf-mirror.com'
    const tokenizer = await tf.AutoTokenizer.from_pretrained(options.modelId)
    const model = await tf.AutoModel.from_pretrained(options.modelId, { dtype: 'fp32' })
    return {
      tokenizer: tokenizer as unknown as AnyCall,
      model: model as unknown as AnyCall,
    }
  }

  const ensureLoaded = (): Promise<LoadedEmbedder> => {
    if (!loaded) {
      loaded = load().catch((err: unknown) => {
        loaded = null // 失败不粘死：下次调用重试（P5 的 import／cacheDir 故障臂也要能继续降级）
        throw err
      })
    }
    return loaded
  }

  return {
    ready: () => isModelReady(options.cacheDir, options.modelId),
    prewarm: async () => { await ensureLoaded() },
    encode: async (text: string): Promise<number[]> => {
      const { tokenizer, model } = await ensureLoaded()
      // lowercase 与 max_length 512 是对齐 Python 侧的硬前提，⛔ 不许改
      const inputs = await tokenizer([text.toLowerCase()], {
        padding: true,
        truncation: true,
        max_length: 512,
      })
      const output = await model(inputs)
      const hidden = output.last_hidden_state as { dims: number[]; data: Float32Array }
      const dim = hidden.dims[hidden.dims.length - 1]
      const vector = new Float32Array(dim)
      for (let i = 0; i < dim; i++) vector[i] = hidden.data[i] // CLS pooling：batch 0 / position 0
      let normSq = 0
      for (let i = 0; i < dim; i++) normSq += vector[i] * vector[i]
      const norm = Math.sqrt(normSq) || 1
      const out = new Array<number>(dim)
      for (let i = 0; i < dim; i++) out[i] = vector[i] / norm // L2 normalize
      return out
    },
  }
}
