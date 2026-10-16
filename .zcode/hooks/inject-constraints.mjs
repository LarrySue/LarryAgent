// SessionStart 钩子：把 .zcode/ZCODE.md（审计员约束正本）作为 additionalContext 注入会话。
// 输出必须是严格 JSON（多余键会被校验拒绝）。若 ZCode 侧 additionalContext 键形态与预期不符
// （校验失败会在 ZCode 日志留痕），依日志订正本脚本再测——兜底路径（平台记忆索引指示手动读本文件）不受影响。
import { readFileSync } from 'node:fs';

const text = readFileSync(new URL('../ZCODE.md', import.meta.url), 'utf8');
process.stdout.write(JSON.stringify({ additionalContext: text }));
