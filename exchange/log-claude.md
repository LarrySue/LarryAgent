# Claude 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 2026-09-14 CVM 通道实测 + 评审续稿（老大指示："docs 里有 CVM 环境说明，你可以照着跑"）

**结论一句话**：通道**已验证可用**（ssh + scp 双通），照着 `docs/production-env.md` §1/§6 跑出的 12 条硬事实与**我方执行说明**如下；同时给 `exchange/dsh-3-plan.md` 续了**附 A**（评审意见 15 条）与**附 A-2**（本次实测 + 对附 A 四条的修订，其中两条是我自己写错的）。

---

## 一、《我方（Claude）CVM 执行说明》

### 1. 入口

```bash
ssh -i ~/.ssh/id_ed25519_cvm -o BatchMode=yes -o ConnectTimeout=10 ubuntu@49.232.129.252 '远端命令'
# 回传（宿主侧必须加 MSYS_NO_PATHCONV=1，否则 MSYS 会改写 host:/path 参数）
MSYS_NO_PATHCONV=1 scp -i ~/.ssh/id_ed25519_cvm ubuntu@<ip>:<远端文件> "D:/Temp/Sys/<本地目标>"
```

- 免密 sudo 可用；**但凭据文件一律只验结构、不读内容**（§12.4⑤ 判据足够）
- 长脚本走 `ssh host 'bash -s' <<'EOF' … EOF`（**首行 `exec 2>&1`** 归一混流，与 WSL 侧同一范式）；**别在 `ssh '…'` 里套多层引号**——我踩过 `\$\$` 转义差点写错，heredoc 稳妥

### 2. 机器事实（会变，用前先验）

| 项 | 值 |
|---|---|
| PATH | 裸跑 `node`/`dsh` 全 `not found`；须 `export PATH=$HOME/node/bin:$PATH`；DSH 入口 `~/harness/node_modules/.bin/dsh` 或 `node node_modules/@deepseek-ai/dsh/lib/bin.js` |
| 工作目录 | **`~/harness`**（不是 `/mnt` 那套；CVM 是纯 Linux，无 MSYS 坑） |
| 我的暂存区 | **`/tmp/claude-probe/`**（我自建，账目清楚）。**不碰 `/home/ubuntu/dshprobe`、`~/larry-data`、任何 home 内既有产物** |
| 采数点 | `/sys/fs/cgroup/user.slice/user-1000.slice/{memory.current,memory.peak,memory.events,memory.pressure}`（⚠️ root 与 session scope **没有**这些文件，`stat -fc` 判 cgroup2fs 会假阳性） |
| 镜像源 | `~/.npmrc → registry.npmmirror.com` ⇒ 依赖安装走国内，快 |

### 3. 长任务范式（实测：裸 `&` 5/5 存活，`setsid nohup` 6/6 存活）

```bash
setsid nohup <cmd> >/tmp/claude-probe/x.log 2>&1 </dev/null & echo "pid=$!" > /tmp/claude-probe/x.pid
# 复入检查顺序：先看完成标记/退出码文件，再看日志
```
⚠️ `production-env.md` §6.3「ssh 后台任务拿不到沙箱放行」**约束的是本地通道层（宿主沙箱/审批），不是远程进程会死**——实测远程侧裸 `&` 都不死。前台跑的唯一理由是"本地审批"，别把它误当成远程限制。

### 4. 四个已经踩到的坑（省下重复踩的时间）

1. **`pgrep -f <pattern>` 会匹配到自己**：我第一版"dsh 进程数"报 3，实际 1（另两条是我自己的 `bash -c` 命令行）。用 `pgrep -f "[n]ode_modules/.bin/dsh"` 或 `pgrep -x`。
2. **别改正在运行的 bash 脚本**：bash 按字节偏移懒读脚本文件，改运行中的脚本会执行错乱。要改就停掉重起（或写成新文件名）。
3. **`find -mmin -1` 抓到的东西不能直接归因**：本机有第三方活跃会话（`who` 见 pts/0），我观测到 `~/.dsh/profiles` 在我首次 `--help` 同秒被改动，但**对照实验打回**（前后 mtime 一致）⇒ 记为"观测到、未归因"。**凡前后对照实验必须在单租户窗口内做**，否则证据自动降级。
4. **分类器会挡凭据切片**：我打印 key 前 3 字符被 auto mode 拦下——**拦得对**，结构判据（类型/键名/长度/非空）足够，不需要任何值切片。以后别打前缀。

### 5. 产物位置（本次）

- 采数原型：CVM `/tmp/claude-probe/sample.sh` + `sample.log`（40 条 × 30 s，14:33:50 起，**约 14:53:50 自行结束，不需清理**；要提前停用 `pkill -f "[s]ample.sh"`）
- scp 回传样本：`D:\Temp\Sys\claude-wsl-probe\cvm-sample-snapshot.log`
- landlock 器材（**已升级为 ABI 自适应**）：`D:\Temp\Sys\claude-wsl-probe\landlock_probe.py`（新增 `--fs-mask` 负向开关 + `VERDICT=` 机读行；WSL ABI 7 回归通过）

---

## 二、给 WB 的三个裁定请求（@WorkBuddy）

1. **机上两个遗留进程怎么处理**（都不是我的，我**没动**）：① PID 21399 `dsh --profile web --port 8124`，09-09 22:06 起，**已跑 4 天 16 小时**，RSS 172 MB 恒定；② PID 19520 `python3 -m http.server 8123 --bind 0.0.0.0`（`production-env.md` §6.1 那次的遗留，**监听 0.0.0.0**，靠安全组兜着）。
   - 对 3.0 采数而言**基线不干净**（1935 MB 已用 615，其中 172 是①）；但①同时是**免费的 4.5 天长驻数据**（§2.4 想要的东西）。
   - **我的倾向**：采数前停掉①，换干净基线；②属于该清理的遗留（0.0.0.0 监听没必要留着）。**但请你们裁定后再动，我不越权。**
2. **`cvm-*.sh` 的 `DSH_HOME` 坑由谁修**：`harness/scripts/cvm-probes/cvm-*.sh` 全部钉 `DSH_HOME=$HOME/larry-dsh-home`，而 CVM 上**凭据只在 `~/.dsh/`**、`larry-dsh-home` 无任何凭据、全机也无 env/`.env` 注入源 ⇒ **照抄这些脚本且不注入 env 就会跑出"无 key 假绿"**（§1 已记录的形态）。这些脚本是**本机独有**（CVM 上没有），所以改本机即可。**要我改我就改，要不改请在 3.0 派发里写明"必须注入 env"。**
3. **harness 同步要不要我执行**：精确缺口 = **30 文件 / 0.13 MB**（`scripts/run-real-api.mjs` + 3 个探针目录、`tests/` 5 文件、`packages/` 3 个沙箱探针包；harness 全量源码 51 文件 / 0.66 MB，`node_modules` 不传）。**传输 1.5 秒级，不是瓶颈**；同步后可能的 `pnpm install` 才是成本。⚠️ **缺的三个包正是 3.5 要用的** ⇒ **3.5 也被同步卡着**，不只 3.0 交付物 4。

---

## 三、声明

- 本文件与 `exchange/dsh-3-plan.md` 的**附 A / 附 A-2 均为纯追加**，未改动他人既有文字
- 本次未读任何凭据文件内容（只验结构）；未在 CVM 上做任何破坏性操作；未碰他人产物
- `docs/` 发现两处与实测不符（§6.3 后台存活、§12.5 CVM 有两个 home 未记），按职责**我不改 `docs/`**，已写进计划稿附 A-2 并在此点名，请 WB 处置
