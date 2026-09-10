# DSH 本机（Windows）环境约束与已知坑

> **定位**：本机 Windows 侧跑 DSH 的**环境事实与坑**的唯一真相源（与 `dsh-cloud-deployment.md` 对仗：那个管云，这个管本机）。
> 跨 AI 共享的本地环境事实一律放此，交流区 / TODO / AI 记忆只留指针。
> 全部为 🟢 实测或源码级确认，基线 `dsh-v0.1.2-rc.1`。

---

## 1. profile 启动锁（会卡死所有 dsh 命令）

**现象**：任何 dsh 命令启动即失败，报

```
Error: atomic-write: timed out waiting for the writer lock at C:\Users\SuLarry\.dsh\profiles\node_modules.lock
    at withFileLock (...dsh-atomic-write/lib/index.js:136)
    at async healProfilesModuleFallback (...dsh-app-boot/lib/index.js:662)
```

**机制**（🟢 源码 `dsh-atomic-write/lib/index.js`）：
- 锁是 `wx` 排他创建的兄弟文件 `<filename>.lock`，内容 = 持有者 PID
- 默认 `DEFAULT_LOCK_WAIT_MS = 2e3` → **只等 2 秒**就抛超时
- 源码注释明写：**「The contender never removes an existing lock because file age cannot prove that its owner stopped; orphan recovery is an operator action.」** → **孤儿锁永远不会自动回收**

**判定与处理**（照做，别靠猜）：
1. `cat <lock>` 取 PID → 与 `tasklist | grep node.exe` 比对
2. PID 不在活进程里 = **死 PID 残留锁** → 可安全清理
3. 清理方式：**重命名备份，不删除**（dsh 自己就是这么做的，目录下已存在 `node_modules.lock.bak.<ts>` 先例）：
   ```
   mv node_modules.lock node_modules.lock.bak.$(date +%s)
   ```

⚠️ **不要**据此写"dsh 有 bug"——这是设计选择（宁可失败也不误删别人的锁）。**运维动作**才是正确归属。

---

## 2. `--patch` 引本地路径包会触发 heal → 撞上面那把锁

**现象**：`dsh --profile larry --patch ./packages/<pkg>/cordis.patch.yml` 启动即锁超时。

**原因**：本地路径包不在 profile 的 `node_modules` 里 → boot 时 `healProfilesModuleFallback` 试图 pnpm install → 争锁（见 §1）。

**正确处理**：本地包须**先装进 profile node_modules**，再 boot：
```
dsh plugin --profile <name> add <本地包路径>
... 跑 ...
dsh plugin --profile <name> remove <包名>
```
（`dsh plugin` 是转发给 pnpm，在 profile 目录执行；`--patch` **只适合**覆盖已装包的 patch 层。）

**替代（复验推荐，零侵入）**：不 boot profile，直接 spawn 被测二进制（见 §3）。

---

## 3. windows-acl runner 直调格式（绕开 profile 的独立验证路径）

想验证沙箱而**不想动 profile / 不想撞锁**，可直接 spawn runner：

```
node <...>/dsh-sandbox-windows-acl/lib/runner.js \
  --workspace <已存在目录> --temp <目录> \
  --mode <read-only|workspace-write> \
  -- <可执行文件绝对路径> <args...>
```

⚠️ `--` 后**第一个必须是可执行文件**（如 node.exe 绝对路径）。传 `-e ...` 之类会报：

```
windows-acl-run: CreateProcessAsUserW failed (Win32 2): command: -e
```

（Win32 error 2 = 文件不存在。这不是沙箱缺陷，是调用姿势错。）

---

## 4. Windows 沙箱：**拒绝方言缺口**（🟢 源码 + 实测，影响模型可见性）

**契约**（🟢 `packages/sandbox/sandbox-local/src/index.ts:205-213`，tag `dsh-v0.1.2-rc.1`）：

```js
const DENIAL_SIGNATURES = {
  bwrap:    ['read-only file system'],
  landlock: ['permission denied'],
  seatbelt: ['operation not permitted'],
  // pwsh/.NET: "Access to the path '...' is denied."; cmd: "Access is denied.";
  // node EACCES: "permission denied".
  'windows-acl': ['access is denied', 'access to the path', 'permission denied'],
  runnerCommand: ['read-only file system', 'permission denied'],
}
```

> 注：`denialSignatures` 由 **provider（sandbox-local）** 组装，**不是**后端（sandbox-windows-acl）声明的——后者 `lib/` 里一个相关字符串都没有。改方言要改 provider。

**实测缺口分两层**（两层都独立复现，务必分开记）：

| 层 | 现象 | 是否跨语言成立 |
|---|---|---|
| **① 本地化层** | 中文 Windows 下 cmd/powershell 输出中文，英文签名命中不了 | ❌ 仅非英文系统 |
| **② 错误码类别层** | **node 写失败报 `EPERM: operation not permitted`，而签名备的是 `permission denied`（那是 EACCES 的文案）** | ✅ **英文 Windows 同样不命中** |

实测三条（🟢 2026-09-10 WB 独立复现，`locale=zh-CN` `oemcp=936` `IsInRole(Administrator)=False`）：

| 子进程 | 实际 stderr | 命中三条签名 |
|---|---|---|
| node | `Error: EPERM: operation not permitted, open '…'` | ❌ |
| Windows PowerShell | `对路径"…"的访问被拒绝。` | ❌ |
| cmd（无引号重定向写法） | `拒绝访问。` | ❌ |

**影响面**：`denied=false` → 模型侧**只当普通命令失败**，既看不到 `[sandbox: file access denied]` 标记，也拿不到升权提示 → **沙箱拦住了，但拦住的信号传不出去**。

⚠️ **② 比 ① 更硬**：不要把它整体归因为"中文 Windows 的问题"，那是把跨语言的缺陷降级成了本地化问题。

---

## 5. 环境噪声：WorkBuddy 的批量删除保护会污染沙箱探针输出

node 侧 `rmSync` 递归删除 **>50 个文件**时，会抛：

```
Error: [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":57,"threshold":50,"scope":"turn",...}
```

沙箱探针的 cleanup 阶段可能踩到（**exit 仍为 0，但 stderr 有这条**）。
→ **判读时不要把它误判成沙箱缺陷**。临时目录建议用带时间戳的新目录名、不递归删旧目录。

---

## 6. ⭐ 连通性 / 凭据状态判据矩阵（🟢 四组对照实跑，2026-09-10 WB）

场景：同一脚本 `scripts/dsh-prompt.mjs`（sdk profile + stdio JSON-RPC），只改 Key 状态。

| 场景 | exit | `finalResponse` | `assistant/message` 事件 | `turn/end.reason.kind` | `error.code` | status | 耗时 |
|---|---|---|---|---|---|---|---|
| **有效 Key** | 0 | `PROBE-OK-2026` | ✅ **有** | （无 = 正常完成） | — | — | **106.2s** |
| **无 Key** | 0 | 空 | ❌ 无 | error | `MISSING_CREDENTIAL` | — | 2.9s |
| **错误 Key** | 0 | 空 | ❌ 无 | error | `AUTH` | 401 | 3.0s |
| **已关闭的有效 Key** | 0 | 空 | ❌ 无 | error | `AUTH` | 401 | 2.6s |

### 由此定出的判据（可直接写进 DSH-6 断言）

- **成功 ⇔ `assistant/message` 事件存在 且 `finalResponse` 非空 且 `turn/end.reason` 不存在。**
- **`exit 0` / session 建立 / 有事件流 —— 三项全部无效**：三种失败场景在这三项上都与成功一致。
- **要区分失败原因，读 `turn/end.reason.error.code`**：`MISSING_CREDENTIAL` = 没配；`AUTH`+401 = 配了但无效/已关。
- ⚠️ **错误 Key 与已关闭 Key 不可区分**（同为 `AUTH`/401）→ 用户报"AI 不回话"时，从输出**无法**判断是配错还是被关，只能凭 Key 后 4 位回查平台。

### 两个附带事实

- DSH **自带 Key 脱敏**：日志里呈现为 `****3c36`（**保留后 4 位**）→ 不会明文泄漏，但**后 4 位会进 session 日志**，涉及凭据时须知悉。
- **环境变量方式不落盘**：跑完再无 Key 复现同一脚本，仍得 `MISSING_CREDENTIAL`（未从环境变量偷偷持久化）。credentials service（web Models 页面）那条落盘路径**未测** ⬛。

### ⚠️ 实跑前置（漏了会伪装成别的故障）

1. **先清 profile 锁**（见 §1）——任何一次 dsh 运行（含 `--dump-config`）都会留下孤儿锁。
   不清的表现是 `initialize timed out after 20000ms` 或 `JSON-RPC input closed`，**极易误判为"profile 启动慢 / SDK 握手有问题"**。
2. **真实模型调用耗时长**：本轮成功那次 **106 秒**。`dsh-prompt.mjs` 内置 `initializeTimeoutMs: 20_000`，冷跑容易超时 → **超时 ≠ 失败**，复跑前先确认锁。

---

## 7. 其他已确认事实

- `sandbox` provider 在 `dsh-base/cordis.patch.yml` 挂载 `@deepseek-ai/dsh-sandbox-local`，**未 disabled**；`bash-sandbox` 在 win32 被禁用、`pwsh-sandbox` 在非 win32 被禁用。
- `enforcement` 在 Windows 上静态声明为 **`partial`**（受限令牌须保留 Everyone 才能初始化 → 显式给 Everyone 写权限的对象仍可写；NTFS 硬链接是文件对象别名 → 工作区外硬链接仍可写）。**2.10.2「Windows 端侧执行器」按 partial 规划，不要按 full 宣传。**
- 旁路开关：无静默降级；显式配置 `DSH_PERMISSION_MODE=danger-full-access`（该档 `approval: never`）。
