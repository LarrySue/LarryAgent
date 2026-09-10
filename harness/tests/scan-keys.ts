/**
 * key 明文扫描（DSH-2.4 建立，DSH-3 前置件 1 抽取为共享模块）
 *
 * 为什么抽出来：真实调用模式的自查（tests/real-api.ts）与 global-setup 主进程
 * teardown 必须用**同一套**判定——否则会出现"自查说干净、teardown 说脏"的口径
 * 分裂，而这类分裂正是护栏类验收最容易自欺的地方。
 *
 * 遍历规则：**不跟随符号链接/junction**。真实调用模式的临时 DSH_HOME 里有
 * 指向 177MB 真实 sdk profile 的 junction（见 real-api.ts），跟随会走出临时根、
 * 既慢又扫错对象（真实 profile 不是测试残留）。
 */
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** 疑似 key 明文的文本形态：sk- 前缀 + 16 位以上字母数字（DSH-2.4 原判据，勿放宽） */
export const KEY_PLAINTEXT_PATTERN = /sk-[A-Za-z0-9]{16,}/

/**
 * 递归扫描目录内满足 `matches` 的文件。
 * @param dir - 扫描根目录
 * @param matches - 以文件文本内容为输入的判定函数
 * @returns 命中文件的绝对路径列表（无命中 = 空数组）
 */
export function scanForText(dir: string, matches: (content: string) => boolean): string[] {
  const hits: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      const s = lstatSync(p)
      // 不跟随符号链接/junction（理由见文件头）
      if (s.isSymbolicLink()) continue
      if (s.isDirectory()) walk(p)
      else if (s.size < 1_000_000) {
        try {
          if (matches(readFileSync(p, 'utf-8'))) hits.push(p)
        } catch {
          /* 跳过二进制 */
        }
      }
    }
  }
  walk(dir)
  return hits
}

/** 扫描目录内疑似 key 明文（sk- 前缀 + 16 位以上字母数字） */
export function scanForKeys(dir: string): string[] {
  return scanForText(dir, (content) => KEY_PLAINTEXT_PATTERN.test(content))
}
