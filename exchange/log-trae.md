# Trae 协作区

> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## Trae 的 WSL 能力边界实测（2026-09-12）

> **来源**：老大派发 —— WSL 将长期担任核心测试环境，先在 WSL 上实测 **Trae 这条通道自己**的能力边界。
> **作用域**：本报告**只描述 Trae 通道**（PowerShell 工具 + base64 载体）。Claude 用的是另一套工具形态，两个方向的结论**不可互相外推**。
> 分层：🟢 实测 / ⚠️ 必须规避的坑 / ⬛ 未测。

### 结论先行

- **能做**：非交互进入、`-u root` 免密直达、**双向读写**、apt 装包、loop 挂载、非特权 userns、起服务并被 Windows 侧访问、后台长任务、并发调用、**WSL 可写 Windows 侧被沙箱拦的路径**。
- **受限/不能**：**无 TTY**；默认用户 `sudo` 要密码（但 `-u root` 可绕）；`bwrap` 未装；`wsl --terminate` 会清掉后台进程；**`wsl.exe` 自身的中文提示在我通道下乱码**。
- ⚠️ **我这条通道独有的最大坑**：**内联命令里的 `$(...)` / `$VAR` 会在 Windows 侧被提前展开一次** → 含变量/命令替换的脚本**必须走 base64 载体**（对照见 §3）。
- ⚠️ **一条安全口子，需老大知晓**（见 §8）：**WSL 是本工具沙箱之外的写入路径**（实证可写 `~/.dsh`，而 Windows 侧写同一路径被拦）。

### 1. 通道、启动与管理

| 项 | 实测 |
|---|---|
| 发行版 | `Ubuntu-24.04`，VERSION **2**；WSL **2.7.13.0**，内核 **6.18.33.2-microsoft-standard-WSL2** |
| 进入 | `wsl.exe -d Ubuntu-24.04 -- bash -c '…'` ✔ ／ `-e /bin/echo` 直 exec ✔ ／ `--cd <dir>` 指定 cwd ✔ |
| 退出码 | 透传：`exit 42` → 42 ✔；命令不存在 → exit 1 |
| TTY | `tty0=NO`、`tty1=NO`（无 TTY，交互式程序不可用） |
| 身份 | `uid=1000(sularry)`，组含 `sudo`；`-u root` → **uid 0，免密**；默认用户 `sudo -n` = **要密码** |
| 耗时 | 首调（冷）**4.55 s**；热调 **0.13–0.14 s**（3 次稳定）；`--terminate` 后重进 **3.46 s** |
| 并发 | 3 路并发各 `sleep 3` → **总 3.9 s**（并行生效，非串行 9 s） |
| 宿主规格（镜像） | Ubuntu 24.04.4 LTS；`nproc=24`；Mem **15543 MB**；`/` 1007 G（可用 954 G） |

### 2. 我的稳定范式（推荐给以后的我）

```powershell
$s = @' …bash 脚本… '@            # 脚本首行写 exec 2>&1
$s = $s -replace "`r",""           # 去 CR
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($s))
wsl.exe -d Ubuntu-24.04 --cd <显式目录> -- bash -c "echo $b64 | base64 -d > /tmp/x.sh; bash /tmp/x.sh"
```
**四件套**：base64 传脚本 ／ `--cd` 显式定 cwd ／ `exec 2>&1` 归一 ／ 大结果落文件后用 `\\wsl.localhost\…` 读回。

### 3. ⚠️ 三个坑（都实测复现，且**都是我这套壳造成的**）

1. **内联 `$(...)`/`$VAR` 被提前展开**（最坑，会静默产生错值）：

   | 组 | 命令（内联） | 结果 |
   |---|---|---|
   | A | `date +%s; sleep 5; date +%s` | 1789202127 → **1789202132**（差 5 s ✔ 顺序正常） |
   | B | `echo $(date +%s); sleep 5; echo $(date +%s)` | **两次都是 1789202132**（同一次求值 → 被提前展开） |
   | C | `X=AAA; echo "X=$X"` | 输出 **`X=`**（`$X` 在 Windows 侧被展开成空） |
   | D | **base64 载体**内同样的 `$(date +%s)` ×2 + sleep 5 | 1789202163 → **1789202168**（差 5 s ✔ 正常） |

   → 规则：**含 `$`、`$()`、反引号的逻辑一律别内联**。
2. **stdin 管道会注入 CRLF**：`"echo …; whoami" | wsl.exe … bash -s` → `bash: $'whoami\r': command not found`（exit 127）。
3. **stderr 混流被 PowerShell 包成 CLIXML**；**`wsl.exe` 自身的中文文案乱码**（`wsl -l --running`、`--terminate` 的「操作成功完成」都乱码）。但 **`--` 之后的 Linux 输出完全正常**——中文、全角、`①②③` 均正确往返。
   （附：`Measure-Command { … }` 会**吞掉块内输出**，我因此丢过一次结果——这是我用错工具，不是通道缺陷。）

### 4. 文件系统：ext4 vs 9p（决定了"别在 /mnt/d 上跑测试"）

| 项 | ext4（`~/trae-probe`） | 9p（`/mnt/d`） |
|---|---|---|
| 64 MB 顺序写 | **49 ms** | **466 ms**（≈9.5×） |
| 200 个小文件创建 | **31 ms** | **883 ms**（≈28×） |
| inotify 事件 | **event_ok** | **no_event_within_2s**（`add_watch` 成功但事件不到） |
| 大小写 | 敏感 | **不敏感** |
| symlink / hardlink | OK / OK | — / OK |

- 挂载类型：`/` = ext4；`/mnt/d` = **9p(v9fs)**，权限 `rwxrwxrwx`。
- **cwd 继承坑（我实测踩中，已修）**：不指定 cwd 时 WSL 落在 Windows 当前目录。root 批次里 `cd ~/trae-probe` 失败（`-u root` 下 `~` = `/root`），后续 `dd` 就把 8 MB 镜像写进了**仓库根**（`?? img.bin`）→ 已删除并复查。

### 5. 运行时与网络

- **裸跑 `node` → `command not found`**：Windows 侧注入的 PATH（`/mnt/d/App/node`、`/mnt/c/.../npm`）只带来 `npm`/`pnpm` shim，**没有 node**。
- Linux 侧 node 在 nvm：`~/.nvm/versions/node/v22.23.2/bin/node` → **node v22.23.2（linux）+ pnpm 11.7.0**（与 `harness/package.json` 的 `packageManager: pnpm@11.7.0` 精确一致）。
- 其它：python3 **3.12.3** / pip 24.0 / git **2.43.0** / gcc **13.3.0** / sqlite3 CLI **3.45.1** / make 4.3。
- 网络：npmmirror **200 / 0.22 s**；github **200 / 70.9 s**（很慢）；**无 proxy 环境变量**（Windows 侧梯子未继承）。
- 网络形态 = **宿主网卡镜像**（WSL 拿到 `192.168.1.4/24`，网关 `192.168.1.1`），**不是 NAT**。⚠️ 因此 **WSL 内绑 `0.0.0.0` = 直接暴露在局域网**。

### 6. 内核/沙箱相关（DSH-3 若在 WSL 测 Linux sandbox，可直接用）

- **landlock ABI = 7**（非特权用户实测；`landlock_create_ruleset` 返回 7）
- **非特权 userns 可用**：`unshare -U --map-user=0 id` → `uid=0(root)` ✔（`apparmor_restrict_unprivileged_userns` 该内核无此项）
- **`bwrap` = absent** → 要测 DSH 的 bwrap rung 需先 `apt install bubblewrap`
- **loop 挂载全通**：自建 8 MB ext4 镜像 → `mkfs.ext4` → `mount -o loop` → 写读 → `umount` ✔（含 root 写 `/etc` ✔）

### 7. 服务 / 后台 / 并发

- `python3 -m http.server 18799 --bind 0.0.0.0`：WSL 内 `127.0.0.1` 与 LAN IP **均 200**。
- **Windows → WSL localhost 转发可用**：`curl.exe --noproxy "*" http://localhost:18799/` → **200**。
- **后台进程跨 `wsl.exe` 退出存活**（`setsid nohup … &`，复入 pid 713/725 不变）。
- **`wsl --terminate` 后全部消失** → 长任务的存活边界 = 别 terminate。
- **UNC 双向**：`\\wsl.localhost\Ubuntu-24.04\home\sularry\trae-probe\zh.txt` 读回中文完整 ✔；从 Windows 侧写入也被 WSL 看到 ✔。
- **我的工具非阻塞模式 + 轮询可用**：30 s 任务后台跑完并取回输出 ✔。

### 8. ⚠️ 安全口子（发现即上报，**我没有据此绕过**）

**实证**：WSL 内 `echo probe > /mnt/c/Users/SuLarry/.dsh/trae-wsl-probe.txt` **成功**；而**同一路径在 Windows 侧写入被 Trae 工具沙箱拒绝**（本会话 `dsh --dump-config` 正是因此报 `EPERM`）。

**含义**：**WSL 是本工具沙箱之外的一条写入路径**（9p 默认 `rwxrwxrwx`，uid 映射到 `sularry`）。边界仍在：系统 ACL 照样生效（`C:\Windows\System32\…` 写入 `Permission denied`）。

**我的立场**：把它当**能力事实**上报，**不当逃逸手段用**；是否收口（给 WSL 加约束 / 保持现状）由老大定。这也符合 HUMAN.md 原则 4「明确安全边界，而非控制安全边界」。

### 9. 给未来 WSL 测试的建议

1. 工作区一律放 **ext4**（`~/…`），**不要 `/mnt/d`** —— 10–30× 性能差 + 大小写不敏感 + inotify 不到，三条都会让测试结论不可信。
2. 一律 **`--cd` + base64 载体**（否则踩 §3 的坑）。
3. 长输出/长结果**落文件再读**，别指望 stdout。
4. 长任务用**非阻塞 + 轮询**；**不要 `--terminate`**，否则后台全清。
5. 若测 DSH Linux sandbox：`apt install bubblewrap` 后才可测 bwrap rung；landlock 与非特权 userns **现成可用**。

### 附：本次留下的东西 / 我清掉的

- **留**：`~/trae-probe/`（`README-trae-probe.txt` 说明牌 + `zh.txt`、`中文文件名.txt` 两个 UTF-8 样本）—— 非 Trae 资产勿依赖此目录。
- **清**（均已复查不存在）：`/mnt/d/Code/_wsl-probe/`（我建）、仓库根 `img.bin`、`/root/img.bin`、`/mnt/trae-loop/`、探测进程（`http.server`/`sleep 600` 已随 terminate 消失，`ss` 无 18799 监听）。
- **未动**：`/etc/wsl.conf`、WSL 全局配置、既有 `sqlite-check`/`wsl-check.sh` 等他人文件；apt 装的 `tree` 已 **purge 复原**。仓库零残留（`git status` 里的 `docs/*`、`TODO.md` 改动**不是我的**，是老大/WB 在处理）。
- ⬛ **未测**：`wsl --shutdown`（避免影响他人，只做了 `--terminate`）、WSLg/图形、IPv6 出站、GPU/CUDA。

---

