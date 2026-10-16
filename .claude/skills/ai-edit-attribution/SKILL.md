---
name: ai-edit-attribution
description: 多 AI 共用工作副本里判「某文件改动/某次写回是谁做的」—— 排除法六路查痕（会话转录空闲证明/工具目录窗口扫描/文件历史快照/rollout 工具调用/工作区残留/编辑器本地历史），含各家痕迹路径、时间基换算与结论强度边界
---

# 多 AI 工作副本 · 改动归因（排除法）

## 触发条件

- 工作树出现来源不明的改动（mtime 成批连写、内容无归属）
- 要回答「某分钟谁在写这个文件」「这笔提交/这次"外部写回"是谁做的」
- 事件复盘：核实某家 AI 在某时间窗内的**全部**动作

## 核心方法：逐家排除

口径：**默认无人可信，逐家拿可复算痕迹排除**；指认结论必须限定在"可查痕迹内"——**人类手动（编辑器手存/命令行）通常零痕迹**，此路排除完只能到「最可能」。

1. **会话转录空闲证明（最强）**
   - Claude：`~/.claude/projects/<项目>/*.jsonl`，每条消息带 `"timestamp":"…Z"`。扫时间窗内条目＝0 ⇒ 该会话全程空闲。⚠️ 时间戳是 **UTC**（本地 +8h）。
   - ZCode：`~/.zcode/cli/rollout/model-io-sess_*.jsonl`，每行一次模型调用（几十 MB 也逐行解析）。`startedAt` 定回合（UTC）→ `response.toolCalls[].{name,input}` 定该回合**实际工具调用与落点文件**（这就是"它有没有碰过该文件"的铁证）。⚠️ 参数键名是 **`input`**，不是 `args`（写错会静默扫出零条）；⚠️ `request.body` 里没有 messages，别去那里找上下文。
   - Qoder：聊天会话转录＝`~/.qoder/logs/sessions/<projectKey>/<sessionId>/segments/<ts>-*.jsonl`（每段＝一次运行；`projectKey` 形如 `D--Code-LarryAgent`；含 `tool.requested`（工具参数键是 **`args`**，与 ZCode 的 `input` 相反）与 PostToolUse 钩子载荷）。⚠️ `~/.qoder/projects/<proj>/<sessionId>.jsonl` **未必存在**（headless/插件会话的转录还会自清）；可恢复态在 `projects/<proj>/<sid>/state.json` 与 `compression-v2/state.json`，**没有这两个＝该会话无自动续载入口**。Qoder 记忆注入形态（判"某文件会不会传给新会话"）：项目记忆＝`~/.qoder/projects/<proj>/memory/`，**索引 `MEMORY.md` 自动进会话、正文按需取** ⇒ 新写的 md **不进索引就不进新会话**（索引文件 mtime＋新会话上下文双证）。
2. **工具目录窗口扫描**：对各家痕迹目录跑 `find <dir> -type f -newermt 'T1' ! -newermt 'T2'`。窗口内有其自身文件写入＝当时在活动；零写入＝该分钟没跑命令（只证「AI 没做」，不证「人类没做」）。
   - ⚠️ **别直接 find 大目录**（`~/AppData/Roaming/<IDE>`、含 `.git`/`node_modules` 的仓）——慢到超时。先 `-maxdepth`，或分目录扫。
   - ⚠️ `-not -path '*/node_modules/*'` **不剪枝**，仍会遍历；要剪枝用 `-prune`。
3. **Claude 文件历史快照（外部改动的物证）**：`~/.claude/file-history/<sessionId>/<fileId>@vN` 是该会话**跟踪过的**文件的各版本快照；**外部写入也会触发新版**（快照≠该会话编辑）。用法：相邻版本 diff ⇒ 某次外部改动的**逐字原文**；版本 mtime＝改动时刻；配合转录空闲证明 ⇒ 反证「非该会话所为」。⚠️ 反向亦成立：某文件在此目录出现新版本 ≠ Claude 改过它。
4. **git 佐证（只能框窗口，不能定罪）**：`git log --format='%h %ad %s' --date=format:'%H:%M' <范围>` 全表 + `--stat` 逐笔落点；单文件史 `git log … -- <path>`。⚠️ **未提交后被 checkout 回退的动作不留任何提交痕迹**；本仓 author 字段全是同一人，**不能凭 author 分辨 AI**。
5. **仓库外残留物**：改稿脚本、`~/.qoder/logs/runs/<ts>/`、`%TEMP%` 脚本——窗口扫一遍，作"某家当时在跑脚本"的独立迹象。
6. **编辑器本地历史（VS Code，人类手改的强痕迹）**：`~/AppData/Roaming/Code/User/History/` 下每个资源一个哈希目录，`entries.json` 的 `resource` 是原文件 URI（URL 编码）、`entries[].{id,timestamp(ms)}` 是**编辑器保存**快照，内容在同目录 `<id>.<ext>`。用法：`grep -rl '<文件名>' <History>` 定位 → 相邻快照逐个 diff ⇒ 把一批改动**拆成逐步编辑序列**（小步微调＋秒级自我修正＝人手形态）。⚠️ 该记录由 VS Code 保存通道产生——各家代码 AI 都是直接写盘、**不走这条路** ⇒ 有记录≈人类在编辑器里改（比"零痕迹"强得多）。Windows VS Code 与 Trae 各有自己的 History 目录，别混。

## 结论强度与纪律

- 排除完可写：「**在可查的四家工具痕迹中无候选 ⇒ 最可能为人类手动**」；⛔ 不可写「确定是某人」。若编辑器本地历史（第 6 路）命中保存快照 ⇒ 可升级为「**编辑器手改**」。
- ⛔ 归因过程中不清理任何可疑残留（脚本/副本/快照）——**先落结论，再谈清理**。
- 「没有」类判断照 `evidence-discipline`：检索式不得截断；窗口边界要写进结论（`20:35–20:45` ≠ `20:41`）。
- 物证优先序：转录/rollout 原文（🟢）＞ 工具目录扫描（🟢，有边界）＞ 文件历史快照（🟢）＞ git 提交史（🟡，未提交动作无痕）＞ 相关方自述（🔴 需旁证）。

## 已知坑

- **时间基混用**：git 时间与文件 mtime＝本地；Claude 转录、ZCode rollout、Qoder host-actions `createdAt/startedAt`＝UTC。换算错会错出整整 8 小时。
- **中文输出**：Windows 终端默认 GBK，python 打印中文/符号会 `UnicodeEncodeError` 或乱码 ⇒ `PYTHONIOENCODING=utf-8` + heredoc（别在 `python -c` 里嵌转义引号，会被 bash 吃掉）。
- **Windows 路径别喂 glob**：`glob.glob(r'C:\Users\…\*.jsonl')` 里 `\r` `\c` 被当转义字符吃掉 ⇒ 静默零命中（看起来像"扫不到"）。一律用正斜杠 `C:/Users/…`。
- **整文件 diff≠真差异**：CRLF/LF 混用会让 `diff` 显示整文件替换。先 `tr -d '\r'`／python 归一化再 `difflib`，否则会把噪声当改动列清单。
- **多 AI 共副本**：始终只 `git add <显式路径>`；`git status` 只作状态截面。
