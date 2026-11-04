/**
 * ③.2b 人审闸验收 · 编辑答者（装置，⛔ 产品部署不要装）
 *
 * 审批接口只回四态、不带内容 ⇒「编辑后确认」必须走**独立暂存通道**。
 * 本答者在审批等待期间把 staging 行（reason = `memory-write:<id>`）改成 editedContent，
 * 再返回 allowed-once ⇒ 验「入库的是编辑后的版本」。
 */
import { appendFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const OUT = process.env.P32B_PROBE_OUT
const emit = (frame) => {
  if (OUT) appendFileSync(OUT, `${JSON.stringify({ t: new Date().toISOString(), ...frame })}\n`)
}

export default {
  name: '@larryagent/plugin-32b-edit-answerer',
  apply(ctx, config = {}) {
    const dbPath = config?.dbPath
    const editedContent = config?.editedContent ?? ''
    ctx.inject(['approval'], () => {
      ctx.on('approval/request', async (req, next) => {
        const reason = String(req?.reason ?? '')
        const matched = /^memory-write:(\d+)$/.exec(reason)
        if (matched === null) return next()
        const stageId = Number(matched[1])
        let changes = 0
        try {
          const db = new DatabaseSync(dbPath)
          try {
            const info = db
              .prepare("UPDATE memory_write_staging SET content = ? WHERE id = ? AND status = 'pending'")
              .run(editedContent, stageId)
            changes = Number(info.changes)
          } finally {
            db.close()
          }
        } catch (error) {
          emit({ judge: 'edit-answerer-error', stageId, message: String(error?.message ?? error).slice(0, 200) })
          throw error // 交给服务归一化（⇒ unavailable，fail closed）
        }
        emit({ judge: 'edit-answerer', stageId, changes, editedContent })
        return 'allowed-once'
      })
    })
  },
}
