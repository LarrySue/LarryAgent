/**
 * plugin-tool-readfile 冒烟测试（**假 ctx 单测范式**，照社区模板 `test/smoke.mjs` 的做法）：
 * 逻辑层不真起 DSH —— 只实现本插件用到的 ctx 成员，把"必须真跑"的部分压到 e2e。
 * 运行：node test/smoke.mjs（先 `pnpm build`）
 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, inject, name, TOOL_NAME } from '../lib/index.js'

const work = mkdtempSync(join(tmpdir(), 'plugin-tool-readfile-smoke-'))
const nonce = `PING-SMOKE-${Math.random().toString(36).slice(2, 10)}`
const sample = join(work, 'sample.txt')
writeFileSync(sample, `hello\n${nonce}\nbye\n`)
const marker = join(work, 'marker.log')

/** 只实现本插件用到的成员：get / inject。 */
function fakeCtx({ withTools = true } = {}) {
  const registered = []
  const tools = withTools ? { register: (definition) => registered.push(definition) } : undefined
  return {
    registered,
    ctx: {
      get: (service) => (service === 'tools' ? tools : undefined),
      inject: (names, callback) => {
        assert.deepEqual(names, ['tools'])
        const sub = {}
        if (tools !== undefined) sub.tools = tools
        callback(sub)
        return () => {}
      },
    },
  }
}

// ① 声明面：零硬依赖
assert.equal(name, 'plugin-tool-readfile')
assert.deepEqual(inject, [], 'inject 必须是空数组（零硬依赖，缺失即降级）')

// ② 容忍 config === undefined（§3.6 事实 8：patch 无 config 块时 cordis 传 undefined）
{
  const { ctx, registered } = fakeCtx()
  // ⭐ 测试隔离（2026-09-17）：本用例**故意不传 config**，而缺省打点路径是
  //   `<DSH_HOME>/plugin-tool-readfile.activate.log` ⇒ 不设 DSH_HOME 就会写**真实** `~/.dsh`
  //   （`apply` 里还会 `mkdirSync` 它）。故临时把 DSH_HOME 指到临时目录、跑完还原，
  //   顺带把「缺省落点跟随 DSH_HOME」这条契约钉成断言。
  const savedDshHome = process.env.DSH_HOME
  process.env.DSH_HOME = work
  try {
    apply(ctx) // ⛔ 不传 config —— 关键用例
    assert.ok(
      existsSync(join(work, 'plugin-tool-readfile.activate.log')),
      '缺省打点必须落在 <DSH_HOME> 下（不得写真实 ~/.dsh）',
    )
  } finally {
    if (savedDshHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = savedDshHome
  }
  const tool = registered.find((d) => d.name === TOOL_NAME)
  assert.ok(tool, 'config 为 undefined 时也必须注册工具')
  assert.equal(typeof tool.output.render, 'function', 'output.render 必须是函数（register 的硬校验）')
  assert.equal(typeof tool.execute, 'function')
  assert.equal(tool.name, TOOL_NAME)
  assert.ok(Array.isArray(tool.parameters?.required), 'parameters 用标准 JSON Schema 的 required 数组')
  // ⭐ 结构防线（照 dsh-tools `assertSupportedJsonSchema` 的真实约束）：
  //    output.schema 是**标准 JSON Schema** —— 属性节点里**不许**出现 `required`。
  //    实测踩过：照抄 defineTool 的"输入 spec 形态"（属性内 required:true）⇒ 注册时抛 JsonSchemaError。
  const schemaText = JSON.stringify(tool.output.schema)
  assert.ok(!/"required":true/.test(schemaText), 'output.schema 属性内不得带 required:true（会注册失败）')
  assert.ok(Array.isArray(tool.output.schema.required), 'output.schema 用顶层 required 数组')

  // 执行：读真文件、内容含 nonce、字节数正确、未截断
  const out = await tool.execute({ path: sample })
  assert.equal(out.path, sample)
  assert.ok(out.content.includes(nonce), '返回内容必须含写入的 nonce')
  assert.equal(out.bytes, readFileSync(sample).byteLength)
  assert.equal(out.truncated, false)

  // maxBytes 截断边界
  const cut = await tool.execute({ path: sample, maxBytes: 4 })
  assert.equal(cut.truncated, true)
  assert.equal(cut.content.length, 4)
  assert.equal(cut.bytes, readFileSync(sample).byteLength, 'bytes 是文件真大小，不因截断而变')

  // 渲染：render 必须产出 text 块
  const blocks = tool.output.render({ path: sample }, out)
  assert.ok(Array.isArray(blocks) && blocks[0]?.type === 'text')
  assert.ok(String(blocks[0].text).includes(nonce), 'render 的 text 块必须带上内容（判据 ① 靠它传回模型）')
}

// ③ 打点：activate / tool-registered / tool-call（② 的 boot 期打点）
{
  const { ctx } = fakeCtx()
  apply(ctx, { activateMarker: marker })
  const lines = readFileSync(marker, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  assert.equal(lines[0].event, 'activate')
  assert.equal(lines[0].configWasUndefined, false)
  assert.equal(lines[0].caps.toolsSeam, true)
  assert.ok(
    lines.some((r) => r.event === 'tool-registered'),
    '注册成功必须留 tool-registered 打点',
  )
}

// ④ 降级：没有 tools 服务时**不抛**，只记 degraded（插件仍处于已激活态）
{
  const { ctx } = fakeCtx({ withTools: false })
  const degradedMarker = join(work, 'marker-degraded.log')
  assert.doesNotThrow(() => apply(ctx, { activateMarker: degradedMarker }), '缺 tools 服务不得抛错')
  const events = readFileSync(degradedMarker, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
    .map((r) => r.event)
  assert.ok(events.includes('activate'), '必须有 activate 打点')
  assert.ok(events.includes('inject-requested'), '必须请求注入 tools（而不是用探测结果当前置）')
  assert.ok(events.includes('degraded'), '缺 tools 时必须留 degraded 打点（不静默）')
}

// ⑤ rootDir 越界拒绝
{
  const { ctx, registered } = fakeCtx()
  apply(ctx, { rootDir: work, activateMarker: marker })
  const tool = registered.find((d) => d.name === TOOL_NAME)
  await assert.rejects(() => tool.execute({ path: join(work, '..', 'outside.txt') }), /outside rootDir/)
  const inside = await tool.execute({ path: sample })
  assert.equal(inside.path, sample, 'rootDir 内的路径必须放行')
}

rmSync(work, { recursive: true, force: true })
console.log('smoke ok')
