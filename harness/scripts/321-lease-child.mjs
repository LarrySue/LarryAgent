#!/usr/bin/env node
/**
 * DSH-3.2.1 · 子进程：**直接驱动** `@deepseek-ai/dsh-session-persistence-jsonl` 的写租约。
 *
 * 为什么不经 SDK：SDK/CLI 通道第二个进程撞的是「会话已存在」（`SessionAlreadyExistsError`
 * / JSON-RPC `-32603 already exists`，DSH-3.2 已定性），**到不了租约层**。本项要取的
 * 判据是 `SessionAlreadyOwnedError`（所有权），只能把驱动面下沉到持久化后端本身。
 *
 * 两把锁（报告里凡"锁"必须标 A/B）：
 *   A = `$DSH_HOME/profiles/node_modules.lock`（`dsh-atomic-write`，**持有者死亡后永不回收**）—— 本装置**不碰**。
 *   B = 本项靶子 = session 写租约（Windows = `Local\dsh-session-lock-<sha256(lower(resolve(<dir>/session.lock)))>`）。
 *
 * 用法（由 `run-321-semaphore-release.mjs` 调用，勿手跑）：
 *   hold       <root> <id> <cwd> <readyFile>   创建 + flush（物化 ⇒ 取到租约），写完 readyFile 后**常驻**
 *   hold-open  <root> <id> <readyFile>         open(id,'write') 后常驻（"首写者死后第二个真拿到"用）
 *   open-try   <root> <id> <resultFile>        open(id,'write') 一次，记录成功/拒绝原文后退出
 *   raw        <lockPath> <resultFile>         独立 koffi 探针：零超时等 Local\ 与 Global\ 两个名字
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const HARNESS = resolve(import.meta.dirname, '..')

/**
 * 定位 jsonl 持久化后端：`.pnpm` 目录名是**截断名**（实测 `@deepseek-ai+dsh-session-pe_<hash>`），
 * 不能按包名 glob（DSH-3.7.1 / 3.7.3 教训）⇒ 逐目录读 `package.json` 的 `name` 比对。
 */
function resolveJsonlDir() {
  const TARGET = '@deepseek-ai/dsh-session-persistence-jsonl'
  const pnpm = join(HARNESS, 'node_modules', '.pnpm')
  const candidates = readdirSync(pnpm).filter((d) => d.startsWith('@deepseek-ai+dsh-session-pe'))
  for (const dir of candidates) {
    const scopeDir = join(pnpm, dir, 'node_modules', '@deepseek-ai')
    if (!existsSync(scopeDir)) continue
    for (const entry of readdirSync(scopeDir)) {
      const manifest = join(scopeDir, entry, 'package.json')
      if (!existsSync(manifest)) continue
      try {
        if (JSON.parse(readFileSync(manifest, 'utf8')).name === TARGET) return join(scopeDir, entry)
      } catch {
        /* 读不动就跳过：定位失败会有明确报错，不静默 */
      }
    }
  }
  throw new Error(`cannot locate ${TARGET} under ${pnpm} (scanned ${candidates.length} candidate dirs)`)
}

const jsonlDir = resolveJsonlDir()
/** 以**该包自身位置**为锚建 require ⇒ 它怎么解析 peer，我们就怎么解析，避免双实例。 */
const req = createRequire(join(jsonlDir, '_ds321_resolver.cjs'))

async function loadEsm(specFromJsonl) {
  const p = req.resolve(specFromJsonl)
  const m = await import(pathToFileURL(p).href)
  return { path: p, mod: m }
}

const cordisLoad = await loadEsm('@deepseek-ai/cordis')
const Context = cordisLoad.mod.Context ?? cordisLoad.mod.default?.Context
if (Context === undefined) throw new Error(`cordis Context not found in ${cordisLoad.path}`)

const jsonlLoad = await loadEsm('@deepseek-ai/dsh-session-persistence-jsonl')
const JsonlSessionPersistence = jsonlLoad.mod.default
const persistLoad = await loadEsm('@deepseek-ai/dsh-session-persistence')
const SessionAlreadyOwnedError = persistLoad.mod.SessionAlreadyOwnedError
const sessionLoad = await loadEsm('@deepseek-ai/dsh-session')
const { SESSION_FORMAT_VERSION } = sessionLoad.mod

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function makeStorage(root) {
  mkdirSync(root, { recursive: true })
  const ctx = new Context()
  const storage = new JsonlSessionPersistence(ctx, { root })
  return { ctx, storage }
}

/** 与实现同式的名字派生（`lib/index.js:557`）—— 探针据此独立复核内核对象。 */
function semaphoreNames(lockPath) {
  const hash = createHash('sha256').update(resolve(lockPath).toLowerCase()).digest('hex')
  return { local: `Local\\dsh-session-lock-${hash}`, global: `Global\\dsh-session-lock-${hash}`, hash }
}

function describeError(e) {
  return {
    name: e?.name ?? null,
    message: e?.message ?? String(e),
    code: e?.code ?? null,
    errno: e?.errno ?? null,
    syscall: e?.syscall ?? null,
    path: e?.path ?? null,
    dest: e?.dest ?? null,
    win32Code: e?.win32Code ?? null,
    sessionId: e?.sessionId ?? null,
    isSessionAlreadyOwned: e instanceof SessionAlreadyOwnedError,
    stackTop: typeof e?.stack === 'string' ? e.stack.split('\n').slice(0, 4) : null,
  }
}

const [mode, a1, a2, a3, a4] = process.argv.slice(2)
const base = {
  mode,
  pid: process.pid,
  node: process.version,
  execPath: process.execPath,
  jsonlModulePath: jsonlLoad.path,
  persistenceModulePath: persistLoad.path,
  cordisModulePath: cordisLoad.path,
}

if (mode === 'hold' || mode === 'hold-open') {
  const root = resolve(a1)
  const id = a2
  const cwd = mode === 'hold' ? resolve(a3) : undefined
  const readyFile = resolve(mode === 'hold' ? a4 : a3)

  const { storage } = makeStorage(root)
  const handle = mode === 'hold'
    ? await (async () => {
        const h = await storage.create({ id, version: SESSION_FORMAT_VERSION, createdAt: Date.now(), cwd, isSeeded: false })
        await h.flush() // 物化 ⇒ ensureLease() ⇒ acquireWriteLease（lib/index.js:128-137 / :247-249）
        return h
      })()
    : await storage.open(id, 'write')

  const loc = storage.locate(handle.header)
  const logPath = loc.path
  const sessionDir = dirname(logPath)
  const lockPath = join(sessionDir, 'session.lock')
  globalThis.__ds321_keep = handle // 钉住 handle ⇒ 钉住租约
  writeJson(readyFile, {
    ...base,
    ready: true,
    root,
    id,
    headerCwd: handle.header?.cwd ?? null,
    sessionDir,
    logPath,
    logExists: existsSync(logPath),
    logBytes: existsSync(logPath) ? statSync(logPath).size : 0,
    lockPath,
    lockFileExists: existsSync(lockPath),
    /** 会话目录全量列举 —— 用于"Windows 侧无锁文件"这条断言的**遍历范围**可验 */
    sessionDirEntries: existsSync(sessionDir) ? readdirSync(sessionDir).sort() : null,
    names: semaphoreNames(lockPath),
  })
  // 常驻：保持 handle（⇒ 租约）不释放，直到被 taskkill /F 或父进程 EOF。
  setInterval(() => {}, 60_000)
  process.stdin.resume()
} else if (mode === 'open-try') {
  const root = resolve(a1)
  const id = a2
  const resultFile = resolve(a3)
  const { storage } = makeStorage(root)
  const t0 = Date.now()
  try {
    const handle = await storage.open(id, 'write')
    await handle.close()
    writeJson(resultFile, { ...base, id, ok: true, durationMs: Date.now() - t0, closed: true })
  } catch (e) {
    writeJson(resultFile, { ...base, id, ok: false, durationMs: Date.now() - t0, error: describeError(e) })
  }
  process.exit(0)
} else if (mode === 'raw') {
  const lockPath = resolve(a1)
  const resultFile = resolve(a2)
  const names = semaphoreNames(lockPath)
  const koffiMod = await loadEsm('koffi')
  const koffi = koffiMod.mod.default ?? koffiMod.mod
  const kernel32 = koffi.load('kernel32.dll')
  const createSemaphoreW = kernel32.func('__stdcall', 'CreateSemaphoreW', 'intptr', ['void*', 'int', 'int', 'str16'])
  const waitForSingleObject = kernel32.func('__stdcall', 'WaitForSingleObject', 'uint', ['intptr', 'uint'])
  const closeHandle = kernel32.func('__stdcall', 'CloseHandle', 'int', ['intptr'])

  const out = {
    ...base,
    koffiModulePath: koffiMod.path,
    lockPath,
    lockFileExists: existsSync(lockPath),
    sessionDir: dirname(lockPath),
    sessionDirEntries: existsSync(dirname(lockPath)) ? readdirSync(dirname(lockPath)).sort() : null,
    names,
    prefixes: {},
  }
  for (const [prefix, name] of [['Local', names.local], ['Global', names.global]]) {
    const handle = createSemaphoreW(null, 1, 1, name)
    if (handle === 0) {
      out.prefixes[prefix] = { handle: 0, verdict: 'CreateSemaphoreW failed (handle=0)' }
      continue
    }
    const wait = waitForSingleObject(handle, 0)
    out.prefixes[prefix] = {
      handle: String(handle),
      wait,
      // WAIT_OBJECT_0=0 ⇒ 拿到（空闲）；WAIT_TIMEOUT=258 ⇒ 已被持有；其余为异常
      verdict: wait === 0 ? 'ACQUIRED(free)' : wait === 258 ? 'WAIT_TIMEOUT(held by someone)' : `unexpected wait=${wait}`,
    }
    closeHandle(handle)
  }
  writeJson(resultFile, out)
  process.exit(0)
} else {
  throw new Error(`unknown mode "${mode}"`)
}
