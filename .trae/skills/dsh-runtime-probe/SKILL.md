---
name: dsh-runtime-probe
description: DSH 真运行时探针装置——SDK 客户端起真 dsh ＋ patch 挂探针插件 ＋ 临时 home ＋ probe-guard；含插件包形态、provide、重复装配、事件重入、关闭顺序五坑
---

# DSH 真运行时探针

## 触发条件

- 要验的是「插件在**真 dsh 运行时**里的行为」（装配层 `dsh --dump-config` 已不够，必须运行时读数）
- 判据涉及真服务：`approval`／`agents.currentInitiator()`／`subagents`／真 turn 边界
- ⛔ 不适用：纯函数/纯字符串判据（用 fake ctx 直接 apply 插件即可，见 `embed-probe/*.mjs`）

## 怎么做（可复跑）

### ① 若被测插件是 TS：先编译再同步部署件

```
cd harness/packages/<pkg>
npm run build
Copy-Item lib\* -Destination <repo>\.dsh-home\profiles\sdk\node_modules\@larryagent\<pkg>\lib -Force
```

- 哈希核对：`Get-FileHash` 两侧 `lib\*.js`，确认一致
- ⚠️ 部署件是**复制**、不是 symlink：不同步 = 验的是旧代码（假绿）

### ② 确认装配漂移：先查既有行，再决定 insert 还是复用

```
dsh --profile sdk --dump-config | Select-String -Pattern '<plugin-name>' -Context 0,3
```

- 已有行 ⇒ **不要重复 insert**（两行会让 `apply` 执行两次）
- 用 patch 的 id 覆写既有行 config；没有才 `- insert:`

### ③ 探针插件（实体复制进临时 home）

- 目录必须有 `package.json`（`type: module` ＋ `main: index.js`），否则运行时请求扩展准备直接失败
- 零外部 import；服务用 `ctx.inject(['<service>'], cb)` 等就绪，⛔ 不用 `ctx.get` 结果决定是否注册
- 自产服务用**自己 ctx** `ctx.provide(name, value)`；⛔ 不往 `ctx.root` provide（cordis 会拒）

### ④ 驱动骨架（照抄 `harness/scripts/probe-32a/run-probe.mjs` 或 `probe-32b/run-probe.mjs`）

1. `mkdtempSync(tmpdir(), ...)` ＋ `cpSync(.dsh-home/profiles/sdk, home/profiles/sdk)` ＋ `rmSync(.../node_modules/.modules.yaml)`
2. 插件实体 `cpSync` 到 `home/profiles/sdk/node_modules/@larryagent/<name>`
3. patch 落在证据目录，`patches:[patchPath]`
4. 真实 home 守卫：`createHomeGuard({ root: join(homedir(), '.dsh') })`（根目录必须在改 env 之前算好）
5. `new DeepSeekHarness({ profile:'sdk', patches:[patch], provider:'deepseek-official', model:'deepseek-flash' })`
6. `await harness.run(prompt)`；**等探针落 done 帧**（或判据帧）后再 `harness.close()`
7. 判据一律**读库/读帧**，⛔ 不以返回值推断副作用

### ⑤ 跑

```
$env:DEEPSEEK_API_KEY = (python -c "import sys;sys.path.insert(0,'D:/Code/LarryAgent/backend');from config import get_config;print(get_config().models['deepseek'].api_key)")
node harness/scripts/<probe>/run-probe.mjs
```

- 凭据只经环境变量注入，脚本不读/不打/不落盘
- 成本控制：prompt 写死极小（如「只回复一个词：OK」）

## 已知坑

1. **探针插件缺 `package.json`** ⇒ 根轮次 `turn/end` 报 `REQUEST_EXTENSION`（"DeepSeek request extension preparation failed"），空响应；与插件代码无关，是包形态问题。
2. **服务 provide 位置**：`ctx.root.provide(...)` ⇒ `service "<name>" has been registered at <root>`、插件树加载失败；在自己 ctx provide 即可。
3. **同一插件装两行** ⇒ `apply` 执行两次 ⇒ `provide` 冲突（`has been registered at <plugin>`）；先 `--dump-config` 查既有行。
4. **`session/event` 回调里不能同步做会写日志的操作**（审批 `request`／起 subagent）：会撞 `session append cannot reenter while another append is being published`；用 `setTimeout(0)` 跳出发布栈（turn 仍 open）。
5. **关闭顺序**：根轮次 idle ≠ 子 agent／审批链跑完；先等判据帧再 `harness.close()`，否则子 run 被掐成 `aborted`。
6. **PowerShell 直传 `node -e` 会吞模块说明符引号**：ESM 报 `SyntaxError: Unexpected identifier 'file'`（通道伪失败）⇒ 改用临时 `.mjs` 载体，跑完即删。
