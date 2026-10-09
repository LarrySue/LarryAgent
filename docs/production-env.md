# 生产环境（CVM / 轻量 Lighthouse）— 实测数据与判定结论

> **定位**：本项目 **生产环境（server 侧 / CVM，也是当前唯一判定环境）** 的**单一真相源** —— 环境资产、实测数据、部署约束、成本与选型判定。与 `test-env.md`（测试 / WSL）、`local-env.md`（本机 Windows：开发 + C 侧测试 + **PC 侧生产使用**）三者对仗；⚠️ 三者中"生产"的角色**按侧分**：**server 侧生产 = 本文档**，**PC / client 侧生产使用 = `local-env.md` §11**。
> **为何独立成文（且置于 `docs/` 顶层而非 `docs/dsh/`）**：环境是**跨阶段的长期基础设施**，不属于"DSH 迁移"这一阶段专题 —— 该专题完结后 `docs/dsh/` 会归档，环境事实必须留在**唯一能跨 AI、跨清理周期的位置**。
> **来源**：2026-09-09 WB 在 CVM 上**实跑**取得（标注 🟢），估算项标 🔴，未测项标 ⬛；2026-09-10 / 09-11 陆续补测。
> **效力**：`TODO.md`、交流区、AI 记忆**只保留指向本文档的指针**，不复制内容。
> **边界**：其中属 **DSH 迁移专题**的部分（通信面定型、B 段 Gateway 路线判定）以 `dsh/dsh-migration.md` 为准，本文档只记由此得出的**部署侧后果**。

---

## 1. 环境资产（连接信息）

| 项 | 值 |
|---|---|
| 公网 IP | `49.232.129.252` |
| 用户名 | `ubuntu` |
| 登录方式 | SSH 密钥 `~/.ssh/id_ed25519_cvm`（**私钥在本机，不入任何文档/仓库**；公钥 `larryagent-wb-cvm` 已绑定） |
| SSH 出站 | 🟢 **WB 可直连**（`ssh` / `scp` 均通），无需老大代跑 |
| 机型 | **轻量应用服务器**（Lighthouse，非 CVM）—— 与 §9 生产选型建议一致 |
| OS / 内核 | Ubuntu 24.04.4 LTS / `6.8.0` / x86_64 |
| CPU / 内存 | 2 核 / **1935 MB**（`free -g` 显示 1 是取整，勿读成 1G） |
| swap | 1.9 G |
| 系统盘 | `vda` 50 G **ext4**，🟢 `lsblk ROTA=1`（云盘报成旋转盘 → 坐实**非本地 NVMe**） |
| sudo | 🟢 免密 |
| 预装 | 无 node / 无 sqlite3 CLI；已手动装 node `v22.22.2` 到 `~/node`（走 npmmirror） |
| 网络 | 🟢 ping 16ms / 0 丢失 |
| **有效期** | ⏳ **至 2027-10-09 21:08:53**（⭐ 老大 **2026-10-08 已续费一年 · 200 元**；首月为赠送期：2026-09-09 → 2026-10-09） |
| **可续费性** | 🟢 **可手动续费**（`InstanceChargeType=PREPAID` / `RenewFlag=NOTIFY_AND_MANUAL_RENEW`，2026-09-12 API 查得）。续费按**标准价 48 元/月**（本套餐为 4M 带宽版），**无活动折扣**（`UserDiscount`/`ActivityDiscount` 均 100，仅时长折扣：6–11 月 88 折 = 253.44 元、12 月+ 85 折 = **489.6 元/年**）⇒ 若按年付，成本量级高于 §9.1 记录的"99–188 元/年"（后者为第三方优惠站价，原标 🔴 不作依据）。⭐ **实际续费（2026-10-08）= 200 元/年** |
| **套餐** | `bundle_starter_mc_med2_02`（入门型 2C2G）/ 系统盘 50G CLOUD_SSD / 带宽 **4M** / ap-beijing-7 |

⚠️ **到期前须把数据搬回本地，机器上的任何产出都不得是唯一副本**。⭐ **2026-10-08 更新：已续费一年（200 元）⇒ 新到期 = 2027-10-09 21:08:53**（纪律不变；回传由 3.9 核对表收口）。全部结论已同步落本文档。

---

## 2. 规格判定：4C8G 不是硬需求

### 2.1 先回溯出处（防止它变成"既定结论"）

「4C8G」最早出现于原 `log-other.md` §8（该节已清理），原文是**给验证机**提的余量，理由仅一条（⑤ embedding 比对是 CPU 密集）。**从未做过生产部署规格的论证**——无进程清单、无内存分项、无峰值估计。故它不扛"硬需求"三个字。

### 2.2 实测内存账（同一台 2C2G 上取得）

| 项 | 实测 | 等级 |
|---|---|---|
| OS idle（含云厂商 agent ~113MB） | 391 MB | 🟢 |
| ChromaDB（`import` + `PersistentClient` + 建集合，**不含模型**） | **91 MB** | 🟢 |
| **DSH web profile 全量常驻**（gateway + 官方 browser UI） | **173 MB** → 跑 6 分钟后 175.6 MB（**+2 MB，无泄漏迹象**） | 🟢 |
| `dsh` CLI 空跑 | 57 MB | 🟢 |
| ⭐ **自做服务(driver) + DSH `sdk` profile 进程树·联合 RSS 峰值**（Trae 2026-09-10，CVM 冷启动 PoC，进程树求和；显式 `DSH_HOME` 15 次采样 / 默认 11 次采样） | **192 MB**（`197032 KB`）/ 189 MB | 🟢 |
| 同上，**冷启动耗时**（spawn → `finalResponse` 落定，**含一次真实 LLM 往返**，非纯 boot） | 3190 ms / 2359 ms | 🟢 |
| embedding 模型加载 | ~150–250 MB | 🔴 **估算，未测到**（见 §6 坑 2） |
| SQLite（内嵌） | 忽略 | — |

> ⚠️ **口径警告（勿重复计数）**：「DSH web profile 全量常驻 173MB」测的是 **web profile（含官方 browser UI）**，**与生产形态不并存** —— 生产跑的是 **`sdk` profile** + 自做服务，对应「联合 RSS 192MB」这一项。**二者择一，不得相加。**
>
> 〔2026-09-17 订正：原写"headless `larry` profile"，与**同表上一行自相矛盾** —— 该项实测标注即"DSH `sdk` profile 进程树"；且 `larry` 面（本机工程 ＋ 本机全局 ＋ CVM 共三处）已于同日全部退役。**数值口径不受影响**，仅 profile 名订正。〕

**生产内存账（合成）**：OS idle 391 + **联合 192** + ChromaDB 91 + embedding 模型 150–250 ≈ **0.82–0.92 GB**（单人低频、单会话峰值口径）。

**修正一条已作废的判断**：曾口头称「ChromaDB 是内存大头、是最大省内存杠杆」——**实测 91MB，此说收回**。换掉它省不出一个量级。

### 2.3 结论（三档口径）

| 档 | 判定 |
|---|---|
| **2C2G（约 1.9G 可用）** | **够，且有余量** —— 实测合成占用 **0.82–0.92 GB**，约占可用内存 **45%**（详见 §2.4，多会话不额外线性增长） |
| **2C4G** | **舒适**，可容纳未来模块叠加与 GC 峰值 |
| **4C8G** | **过度配置** |

> ⚠️ **上述合成值含一项 🔴 估算**（embedding 模型 150–250MB）。若将来实测落在该区间上位，2C2G 余量会收窄到 ~35%，仍需实际投产后再校一次。

### 2.4 ⭐ 多会话内存模型（2026-09-10 WB 实测，推翻此前假设）

**此前假设（已证伪）**：sdk 路线「多会话 = 多子进程」，内存随会话数**线性上涨** → 曾据此判断"3+ 并发应按 4G 规划"。

**实测证据**：

1. **官方契约**（`dsh-sdk-client` `lib/index.js` L608–609 与 `session()` 注释，原文）：
   > `DeepSeekHarness` owns **one** runtime subprocess **across many sessions**
   > Open a session handle (**no wire traffic**; the runtime creates the session on its first prompt)

2. **CVM 实测**（`~/harness/multi-session-probe.mjs`，20 会话句柄）：

   | 阶段 | runtime 进程数 | 联合 RSS |
   |---|---|---|
   | handshake 后 | 1 | 134.4 MB |
   | **再开 20 个 session 句柄** | **1（未新增）** | **134.4 MB（增量 0.00 MB）** |
   | close 后 | 0（已回收） | — |

   client 侧 `heapUsed` 仅 5.4 MB。

**→ 结论**：**多会话 ≠ 多进程。** 侧栏长期挂十几二十个会话**不构成内存压力**；内存不随会话数线性增长。

**边界（不外推）**：本组只证明「**开句柄**」零成本（官方注明句柄不发网络流量）。**每个会话都跑过 prompt 之后** runtime 内的累积未测——那需要真实 LLM 调用，卡在测试 Key。故尚未闭合的是"进程内堆增长"，**而非**"进程数倍增"；两者量级完全不同，后者已被推翻。

**2.4.1 追加：真实 prompt 下的多会话累积（🟢 2026-09-10 WB，临时测试 Key 实测）**

`~/harness/mspp.mjs`，6 个会话各跑 1 条真实 prompt（`hi`）：

| 阶段 | 进程数 | RSS |
|---|---|---|
| handshake | 1 | 128.0 MB |
| 会话 1（首次 prompt，含初始化） | 1 | 139.5 MB（+11.5） |
| 会话 2 | 1 | 144.7 MB（+5.2） |
| 会话 3 / 4 / 5 / 6 | 1 | 146.7 / 148.8 / 150.1 / **150.7 MB**（边际 +2.07 / +2.04 / +1.34 / +0.56） |

- **边际增量递减**，拟合 **2.24 MB/session** → **外推 20 会话 ≈ 182 MB**（远低于此前假设的 20 × 192 MB = 3.8 GB）
- `close` 后残留进程 **0**

**2.4.2 单会话长对话（🟢 同时实测，18 轮）**

`~/harness/lcp.mjs`，同一 session 连跑 18 轮：

- RSS 131.4 → 154.0 MB（turn 1–15 缓升，含 6/10/11 轮小幅回落）
- **turn 16 突降 -16.97 MB**（154.0 → 137.0）→ **内存有界，存在回收**，未出现随轮次无界膨胀
- 261 条事件，`close` 后残留 **0**

**回收归因（如实标注，不猜）**：解出该 session 的 `session.jsonl.zstd` 逐类统计，**`compaction` 类事件计数 = 0**，故 turn 16 的下降**无 compaction 事件佐证，最可能归因 V8 GC**。**不能据此声称"DSH 自带 compaction"**。

**同批取到的硬数据**：`request/context` 事件 → **`contextWindow = 1,000,000` token**（`deepseek-v4-flash`）。→ 18 轮短对话远未触顶，**"未观测到 compaction"应解释为"未到阈值"，而非"无此机制"**。

> **对"用十年"的直接含义**：会话句柄近乎零成本；真实跑过的会话边际约 2 MB/个；单会话长对话内存有界且有回收。**内存维度不构成随使用年限线性膨胀的风险。**

- **CPU**：4C 不是硬需求。单人低频，CPU 只在批量入库/插件并发时吃紧，那是"慢一点"不是"能不能跑"。
- **内存**：才是真约束（常驻进程多，是"能不能起来"的开关）。
- **别现在锁死**：唯一悬空项是 **embedding 模型加载**（🔴）与 **生产是否保留 ChromaDB**（架构变量）。这两项定了，档位自然浮出。

---

## 3. 架构级发现：DSH 官方拒绝绑定 0.0.0.0 🟢

```
error: --host 0.0.0.0 is intentionally not supported yet for safety:
it would expose remote code execution to the network; use 127.0.0.1 instead
```

**官方自述理由是"会向网络暴露 RCE"**。这是**官方立场级**证据，等级高于任何我方推演。对选型的直接含义：

1. **「前端直连 DSH」在云部署下不成立** —— 它只听回环，外部够不着。
2. 要对外暴露必须**反代 + `--trusted-host`**（官方留了口子，未实测其安全性）。
3. **中转不只是业务需要，它同时是安全边界** —— 与通信面定型已有的四条非对称论证并列，但此条等级最高。

---

## 4. sandbox（landlock）实测 🟢

DSH 自带 `node-addon-landlock-run`。**「内核支持」≠「sandbox 真在拦」**，故做正反 + root 反向对照：

| 用例 | ubuntu | root |
|---|---|---|
| 写**已授权**目录 | ✅ | ✅ |
| 写**未授权**目录 | ❌ denied | ❌ denied |
| 读**未授权**路径 | ❌ denied | ❌ denied（连 `/root/.bashrc` 自己都读不了） |
| 读**已授权**路径 | ✅ | ✅ |
| **网络外联** | **`net=200` 通** | — |

**判定**：

- **root 未绕过**（推翻"root 可能绕过"的猜测）→ 生产不必为此刻意降权。
- **失败即 exit 125 且不执行命令 = fail-closed**（README 明述）。
- **`probe=partial` 的精确含义**（读包内 C 源码确认，未猜）：`partial = abi < MAX_ABI`，`MAX_ABI=5`、本机 `ABI=4`。逐项看 `LL_FS_REFER`(≥2)、`LL_FS_TRUNCATE`(≥3) **都有**，**只缺 ABI v5 的设备 ioctl** → **文件读写/改名/截断全管住，缺口实际影响很小**。
- 源码里 `syscall(__NR_landlock_create_ruleset)` 即 **444**（此前误用 316 得 EINVAL 的教训，现由官方源码背书）。
- **userns 与 landlock 解耦**：本机**非 root 的 user namespace 被 apparmor 禁**（`unshare -U` → `uid_map` 写入 Operation not permitted，root 下正常），但 **landlock 普通用户即可用** → DSH sandbox 不依赖 userns，**Ubuntu 24.04 上照常可用**。将来若走 bwrap/容器式隔离，则**必须 root 或改 sysctl**。

**⚠️ 一条必须纠正的认知**：源码**完全没有 `LANDLOCK_ACCESS_NET`**，实测沙箱内照样联网。
→ **"上了 sandbox 就不怕数据外泄"是错的**。它只管文件系统，**防外联必须另做**（网络策略 / 无外网路由）。这是设计选择，不是 bug。

> **与 Windows 侧的关系（避免误移植）**：本机 Windows 的**拒绝方言缺口修复件**（`plugin-sandbox-dialect`）**只对 win32 生效** —— 其 `confine()` 在非 win32 直接返回原值。⇒ **CVM(Linux/landlock) 上不需要挂它、挂了也无副作用**；landlock 方言 `permission denied` 本就命中。方言缺口/修复件/挂载范式见 `local-env.md` §4／§4.3。

---

## 5. 运行时与 2.5 ① 判据 🟢

### 5.1 判据必须取自真实运行时

探明 **DSH 依赖中无独立 sqlite 包**，实际用 **Node 内嵌 `node:sqlite` = 3.51.2**；而此前的并发数据取自 **python 3.45.1** —— **两者不是一回事**。已在真实运行时上重测：

| 运行时 | 8a 反向 `busy_timeout=0` | 8b 正向 `busy_timeout=10s` |
|---|---|---|
| **node:sqlite 3.51.2（真实）** | locked **150/200** | locked **0**，**COUNT=200**（0.86s）✅ |
| python 3.45.1（对照） | locked 190/200 | locked 0，COUNT=200 ✅ |

**判据在真实运行时上同样成立**（反向证明锁在拦；正向 COUNT=200 证明无写丢失）。150 vs 190 的差异来自进程启动节奏（node 启动慢、错峰多），**不影响判定**。

### 5.2 实现坑（写代码时必须遵守）

**node:sqlite 在高并发 + `busy_timeout=0` 时，`prepare()` 阶段就会抛错**（python 只在 `run()` 阶段失败）。首次实测因此直接崩进程。
→ **我们的代码必须在 `prepare` 层也做错误处理，不能只包 `run()`。**

### 5.3 其他环境层数据

| 项 | 实测 |
|---|---|
| `flock` 二次加锁 | 🟢 被拦 |
| fsync 延迟（100 次，云盘） | 🟢 **avg 1.544 ms** / p95 2.105 / max 2.558 |

---

## 6. 部署坑清单（行事规则，别重复踩）

1. **安全组默认只放行 22** 🟢：起在 8123 的服务公网超时，但 CVM 本机 curl 200（**已做对照，是安全组不是服务**）。需其他端口须控制台开（建议 8000–9000 段）。
2. **境外资源下载极慢** 🟢：Chroma 默认 embedding 模型 79MB 从境外源下 → **15 KB/s，8 分钟 9%，全量约 1.5 小时**；换 `HF_ENDPOINT` 镜像**无效**（Chroma 走自己的 S3，不经 HuggingFace）。**对生产的直接含义：首次部署必须预置模型或找可用国内镜像/代理，否则卡死在初始化**。这是**源的归属问题**而非网络慢——同机 npmmirror 下 node 31MB **仅 3 秒**，差三个数量级。⇒ **解法已有实测（见 §11.3）**：预置模型文件（国内镜像 ~10 MB/s，95 MB 约 10 s），**不必让 Chroma 自己下**。
3. **ssh/scp 后台任务拿不到沙箱放行** 🟢：一律**前台跑**；长任务用远程 `nohup ... &` 挂起再轮询日志。
   - ⚠️ **补层界（2026-09-14 两条通道各自实测）**：这条约束的是**本地发起侧**（沙箱 / 审批），**不是远程进程生命周期**。Claude（MSYS 通道）实测裸 `&` 5/5 存活、`setsid nohup` 6/6 存活；Trae（PowerShell + Windows OpenSSH 通道）实测 `setsid nohup` **跨 ssh 退出仍存活**。⇒ **前台跑的唯一理由是本地审批，别把它误读成"远程长任务跑不了"**。
   - 相关：远端长任务范式 = `setsid nohup <cmd> >log 2>&1 </dev/null &` + **完成标记 / `echo $? > rc` 落文件**；复入时**先看标记与退出码，再看日志**。
4. **`pip install chromadb` 撞 PyYAML RECORD 缺失** 🟢：加 `--ignore-installed PyYAML` 绕过。
5. **`pkill -f "import chromadb"` 会杀掉自己** 🟢：该 pattern 匹配到自身命令行。用更精确 pattern 或直接不 pkill。
6. **Chroma collection 名 ≥ 3 字符**（SDK 校验，非环境问题）。
7. **公网机器上调试避免回显 token** 🟢：实测中 DSH boot token 出现在日志回显里。本次实例只听 127.0.0.1、为临时免费机、重启即变，不构成实际风险，**但纪律上应暴露并规避**。
8. **组装自定义 DSH profile 的三道坎（2026-09-10 实测）** 🟢：① **`dsh plugin add` 依赖 `pnpm`**（镜像机默认没有，须先 `npm i -g pnpm`）；② **必须显式锁版本**与主包同版（`0.1.2-rc.1`）——**默认 `latest` 指向旧版 `0.0.1-rc.1`，其依赖树引用 registry 上不存在的 `@deepseek-ai/dsh-type-meta`，安装必然 404 失败**；③ **`plugin add` 只写 `dependencies`、不写 `dsh.profile.bundles`，装了不生效**，且多数相关包（含 `dsh-api-gateway` / `dsh-host-webserver`）**未声明 `dsh.bundle`，手工补进 bundles 会直接报错**。详见 `dsh/dsh-migration.md`「B 段 Gateway 路线实测判定」。
9. **`/dev/shm` 上的产物是否跨 ssh 会话存活 —— ⚠️ 两通道分歧未收敛（勿轻信"会被自动清掉"）** 🟢 机器事实 ＋ ⬛ 归因未复现：一份外部报告（Claude 通道，2026-09-21）称 `/dev/shm` 下所建目录"在会话外消失"，归因 **systemd-logind `RemoveIPC`**。**WB 复验既未复现该现象，机器配置亦与该归因不符**：
   - 🟢 **机器事实（与通道无关）**：`systemctl show systemd-logind -p RemoveIPC` ⇒ **`RemoveIPC=no`**；`/etc/systemd/logind.conf:48` 为**注释态** `#RemoveIPC=yes`，且 `/etc`、`/run` 下**无 `logind.conf.d` drop-in 覆盖**（仅 `/usr/lib/.../unattended-upgrades-logind-maxdelay.conf`，与 IPC 无关）。`loginctl show-user ubuntu` ⇒ `Linger=no`、`State=active`；systemd 255。
   - 🟢 **WB 通道实测**：`mkdir /dev/shm/wb-removeipc-probe` ＋ 写文件 → **在随后的新 ssh 会话里仍存在**（`ls -l` 逐项可见）。⇒ **未复现"跨会话被清"**。
   - 🟢 **Claude 通道自述（2026-09-29 交流区清理时补录 · 原文已随清理归档）**：称在 CVM 上**跨会话探针两次独立得到同一结论** —— 登出后 `/dev/shm` 内其所建文件消失；证据在 `D:\Code\_claude-evidence\374t-p\` 分组内。⚠️ 该通道**同时自曝未做的关键一步**：**未再次上 CVM 复跑探针，也未读 WB 的复核记录原文**（3.4-R 边界要求提交前不读他人交流区）⇒ 其**不知道** WB 的"未复现"是**同条件复跑失败**，还是**换条件 ／ 换通道 ／ 换探针形态**下的结果。⇒ **两观测不构成正面对照**，⛔ 不可据此判定孰对孰错。
   - 🟢 **Claude 通道给出的倾向（供参考，未采纳为结论）**：最可能的解释**不是"谁测错了"，而是触发条件不同** —— `RemoveIPC` 是 **logind 会话级**行为，触发依赖**登录会话如何结束**（正常登出 ／ ssh 断开 ／ 会话未真正销毁）；其建议**不要二选一归档**，而是逐字段比对双方做法（命令 ＋ 会话结束方式 ＋ 通道四元组），**差异项即真结论**。⚠️ 该建议**截至 2026-09-30 未执行**（无人补测）⇒ 上面的"成因未知"**仍成立**，本节结论不变。
   - ⇒ **两通道分歧，并列留痕、不合并**（同 §6.2 的处理；⚠️ 通道不同则结论不可互推）。⛔ **不得据此写"`/dev/shm` 会被自动清"** —— 该归因**未受支持**。若确有产物消失的事件，**成因未知**（"成因未知"是可接受的结论）。
   - 行动纪律（两通道一致、无争议）：**测试产物别放 `/dev/shm`**，用 `$HOME` 下目录；跨会话的产物一律落在仓库树或 `$HOME`。
   - ✅ **已结案（老大 2026-09-30 裁 A：就此结案）** —— **接受"成因未知"**，⛔ **不补做对照实验**（即 Claude 建议的"WB 补记未复现做法 → 双方逐字段比对"，裁定不执行）。**裁定理由**：① 该分歧的**产品影响面已被行动纪律完全覆盖** —— 无论成因是什么，结论都是"别放 `/dev/shm`"⇒ 补测的**边际价值仅在"真发生产物消失事故时"兑现**，届时再查不迟；② 与本节「成因未知是可接受的结论」及复验方法论（skill `verify-ai-delivery`）同源；③ Claude 侧最关键的一步（**未再上 CVM 复跑**）**其本人已自曝**，且其建议的比对**需重上 CVM 跑探针**，成本与收益不匹配。⇒ **交流区 `exchange/log-claude.md` 的同名待裁段据此结案并清理**（2026-09-30）。⚠️ **日后若真出现"产物跨会话消失"事故，本节即为该事故的起点**（两通道观测俱在，可直接从本节的"差异项"思路重启调查）。

---

## 7. gateway 端点：一个负结果（不粉饰、不外推）

`typert-gateway`（即 `dsh-api-gateway`）经 `--dump-config` 确认**在 web profile 中已启用**，翻包找到的唯一 RPC 路径 `/api/remote.mux`，**带 cookie 请求仍 404**（不带 token 为 401）。

- ✅ **能确认**：鉴权体系有效 —— token → 303 → 设 cookie `dsh-auth-<rand>` → 后续请求过鉴权（401 未鉴权 / 404 路径不存在，区分清晰）。
- ❌ **不能确认**：web profile 上**没有可用的 gateway 端点**。
- **不外推**：只能说"web profile 未挂出路由"，**不能说"gateway 不可用"**——可能需 typert 实例注册后才挂载。

**此结果仍是有用的判定依据**：它支持 **B 段（服务↔DSH，同机）走 SDK（stdio）而非 HTTP gateway**，因为后者**开箱不可用已被实测坐实**。

### 7.1 ⭐ 由此推出的部署拓扑约束（2026-09-10 串出）

> **B 段若采用 SDK（stdio 进程通道），则「自做云端服务」与「DSH runtime」必须部署在同一台主机、同一文件系统内，不可拆分到两台。**

- **原因**：stdio 是进程间管道，不是网络协议。它不跨主机，也不跨容器边界（除非共享 PID/IPC namespace）。
- **三条连带后果**（尚未论证充分，先记为推论）：
  1. **垂直扩容而非水平拆分** —— 将来算力不足时只能整机升级（换套餐），不能把 DSH 单独挪到更强的机器。
  2. **A/B/C 三段的资源合并在一台** —— 前端流式转发、会话管理、DSH runtime、工具执行全部共享同一份 CPU/内存配额。
  3. **故障域合一** —— 任一部分 OOM / 崩溃可能拖垮整机组。§2 观测到 DSH 常驻仅 173MB，短期不是问题，但缺小时级数据（见 §8）。
- **唯一能拆开的出路**是让 B 段回到 HTTP（Gateway），而这恰好被 §7 的负结果挡住 —— **除非后续查明 gateway 路由需 typert 实例注册后才挂载**（此为待验项，非已证否）。

**⭐ T2 触发线实测：官方 web surface 经反向代理对外可行（🟢 2026-09-11 WB 实跑，dsh `0.1.2-rc.1`）**

`/api` 上有一道 **browser-trust fence**（`dsh web --help`：`--trusted-host <authority>` = fence **额外放行**的 authority，host 或 host:port，可重复）。原记「`--trusted-host` 白名单为唯一已知障碍」——**实测是个可绕过的 Host 校验，非真阻断**。两条路都通：

| 场景 | 状态码 | 读法 |
|---|---|---|
| root 无 token | 401 | token 门 |
| 直连 `Host=127.0.0.1:8799` | 404 | fence 放行（路由无此端点）|
| 直连 `Host=evil.example.com` | **403** | **fence 拦** |
| 反代·Host 重写为回环 | 401（≠403）| **放行 → 反代有效** |
| 反代·Host 原样透传 | 403 | 仅透传无用（对照）|
| 服务加 `--trusted-host evil.example.com`，直连 / 反代透传 | 401（≠403）| **官方口子生效** |

- ⚠️ **命中 ≠ 推翻定型**：因 Gateway 不能独立起 HTTP（§7），T2 现只剩「反代**整个** `dsh-web-app`」一条路（= 承载官方 shell，与「自做前端」取向有张力）→ **仅触发「回头评估直连」，通信面定型不变**。
- ⚠️ **本轮未覆盖（勿外推）**：WS 升级经反代 / 完整 token→cookie 登录流 / `--trusted-host` 的**安全性**（只测「通不通」，未测「安不安全」）。

---

## 8. 尚未闭合

| 项 | 状态 | 卡点 |
|---|---|---|
| embedding 模型加载内存 | 🟡 估 150–250MB，**卡点已解除** | ~~模型源 15KB/s，未在时限内下完~~ ⇒ **§11.3 实测国内镜像 ~10 MB/s（95 MB 约 10 s）⇒ 现在可真机下载并实测加载内存**。仍不阻塞选型——即便取区间上位，2C2G 仍余 ~35% |
| 生产是否保留 ChromaDB | ⬛ 架构变量（**⑤ 结论后已被重新打开**） | 与「全面 TS 化」存在张力（既有决策 TODO 183 保留 SQLite+ChromaDB 双写，不主张推翻）。🟢 **新证据**：TS embedding 与 Python 侧等价（漂移 `2.2e-7`）→ 若向量存储改 `sqlite-vec`，可**去掉 Python 运行时**（省 91MB 进程 + 模型层 + 一个 runtime），且避开机上装境外模型的部署坑（§6 坑 2）。**需老大择期拍一次** |
| ~~**embedding 是否需全量重嵌**~~ | ✅ **无需**（2026-09-10） | DSH-2.5 ⑤ 实测：TS `bge-small-zh` 与 Python 侧向量漂移 `2.2e-7`、cosine ≥ 0.9999999999、top-1/3/5 全对 → **不重嵌**，省 DSH-4 一大块。⚠️ **硬前提：预处理严格对齐**（`do_lower_case` / lowercase、CLS pooling、L2 normalize、max_length 512），任一项不对齐会产生 0.77 级假漂移（详见 `dsh/dsh-migration.md` DSH-4 承载表）|
| ~~**多会话并发的内存线性增长**~~ | ✅ **已推翻**（2026-09-10） | 原假设"多会话 = 多子进程、线性上涨"**不成立**：官方契约明载 `DeepSeekHarness` **单进程跨多会话**，实测 20 句柄增量 **0.00 MB**、6 会话真实 prompt 边际 **2.24 MB/个**、外推 20 会话 ≈ **182 MB**。详见 §2.4 / §2.4.1。**2G / 4G 之争由此收口：2C2G 够** |
| **接近 contextWindow 上限时的 compaction 行为** | ⬛ 未测 | 实测仅 18 轮短对话，`contextWindow = 1,000,000` token 远未触顶；**未观测到 compaction 事件（计数 0），但不可据此断言无此机制**。若将来出现百万 token 级会话，须重测内存与压缩行为 |
| gateway 真实端点 | ⬛ | 见 §7 |
| 长时间挂机内存/句柄增长 | ⬛ | 仅观测 6 分钟（+2MB），未做小时级 |

---

## 9. 成本与机型选型（2026-09-09 补）

### 9.1 老大在控制台看到的报价 vs 轻量官方定价

先看的一组数字（**CVM 标准型包月原价**）：2C2G ~100+ 元/月、2C4G ~200+ 元/月、4C8G ~500 元/月。
**这不是"配置贵"，是"机型选错了"** —— 同为腾讯云，轻量应用服务器（Lighthouse）中国内地官方定价：

| 配置 | 入门型（月付） | 锐驰型（月付，200M 峰值 + 无限流量） | CVM 包月原价（对照） |
|---|---|---|---|
| 2C2G | **35–55 元** | **45 元** | ~100+ 元 |
| 2C4G | **65–90 元** | **65–72 元** | ~200+ 元 |
| 4C8G | **210–230 元** | **230 元** | ~500 元 |

- 来源：腾讯云官方《轻量应用服务器 价格总览》🟢（入门型 2C2G/3M 起 35 元；锐驰型 2C2G 45 元、2C4G 65 元、4C8G 230 元）
- **时长折扣** 🟢：6–11 个月 88 折，**12 个月及以上 85 折**
- 第三方优惠站年付价（2C2G **99 元/年**、2C4G **188 元/年**、4C8G **~400 元/年**）🔴 **须以控制台当日活动为准，不作结论依据**

### 9.2 结论

1. **同配置轻量 ≈ CVM 的 1/3 – 1/5**。结合 §2 实测（2C2G 能跑、2C4G 舒适），**年付 99–188 元即覆盖生产需求**，而非 1200–2400 元/年。
2. **这钱现在不用花**：2.5 是**验证阶段**，需要的是"偶尔跑一次的 Linux 环境"，不是 24×7 服务。现有免费轻量机已够用。
3. **现免费机恰为轻量** → 若生产也选轻量，则**当前验证数据天然与生产同构**，反而消除了"机型差异"这个变量。

### 9.3 待老大确认（影响计费方式，影响钱）

- **生产是否 24×7 常驻？** 若移动版需随时访问 → 必须常驻 → **包月（年付更省）**；若仅 PC 版 + 用时开机 → **按量付费**，成本再降一个量级。
- **轻量的适用边界需复核**：套餐制（CPU/内存/盘绑定，升级走"升级套餐"而非单独加内存）、流量包制（锐驰型为无限流量）、云盘挂载与 VPC 高级能力弱于 CVM。**对"单人低频 + node 服务 + SQLite + ChromaDB"这套需求，判断是够用的，但未实测，不作定论。**

### 9.4 域名与备案：真正的锁定项（🟢 三家云官方文档一致，2026-09-09 查）

> ⚠️ **本项目不采用境外路径** —— 老大 2026-09-09 明确否决：「没必要放到境外，我没有合规性风险，不用出境」。
> 故本节**仅作规则记录**，用于理解约束边界，**不构成选型建议**。后续 AI 请勿据此提议境外部署。

这条比价格更硬，因为它是**法规**，不是报价。

| 规则 | 内容 | 来源 |
|---|---|---|
| 何时必须备案 | **域名解析指向中国内地服务器并开通 Web 服务时**需 ICP 备案 | 🟢 阿里云/天翼云/华为云备案文档 |
| 何时**免备案** | **① 不用域名**（纯 IP 访问）；**② 域名解析指向境外服务器（含中国香港）** | 🟢 同上 |
| 备案对服务器的要求 | **包年包月 + 购买时长 ≥ 3 个月**（含续费累计）；**按量付费机不满足**（须先转包月）；**免费试用机不满足** | 🟢 阿里云 ECS/轻量、华为云 ECS/Flexus L 实例条款一致 |
| 域名自身要求 | 后缀与注册商须获工信部批复；**域名实名信息须与备案主体一致**；有效期距到期 > 45 天 | 🟢 |

**关键推论（纠正一个容易混淆的前提）**：

> **「域名」和「备案」不是绑定的，「备案」和「长期持有大陆服务器」也不是一回事。**
> 常见误解链：「要用域名 → 必须备案 → 必须长期持有大陆服务器 → 被锁定」。
> 实际上这条链有**两处可断**：① 不用域名则完全不涉及备案；② 域名解析到境外（如中国香港）**同样免备案**，因而**不受"包月 ≥3 个月"约束，可按需开机、可随时换厂商**。

**代价须一并记录**：境外免备案路径的代价是**跨境访问质量**（腾讯云官方明载"中国香港入门型套餐无法保障中国内地与中国香港之间的跨境公网质量，可能出现较大延迟和丢包"），以及合规上的灰色判断（个人自用场景）。

### 9.5 ⭐ 三条部署路径的成本后果（2026-09-10 汇总，决定"钱"的那张表）

前面分散各处的事实，收敛成一张决策表：

| 路径 | 备案 | 计费方式 | 年成本量级 | 代价 |
|---|---|---|---|---|
| **① 纯 IP 访问**（无域名） | **免备案** | **可按量 / 可随时关机** | **最低**（按需开关，可能仅几十元） | 移动端需记 IP+端口；IP 变更要改配置；HTTPS 证书需自签或不用 TLS |
| **② 域名 → 内地服务器** | **必须备案** | **强制包月 ≥3 个月**（按量与免费机不满足） | 年付 **99–188 元**（轻量活动价）起，另加域名 ~30–60 元/年 | **灵活度最低**：锁包月、受 §9.3 套餐制约束 |
| **③ 域名 → 境外（含中国香港）** | 免备案 | 灵活 | 与 ① 相近 + 域名费 | **老大已否决**（2026-09-09），不议 |

**关键结论**：**路径选择不是"要不要域名"的偏好问题，它直接决定计费方式能否按需开关。**

- 走 ② → "用时开机、按量付费"这条路**自动关闭**，因为备案要求服务器为「包年包月且 ≥3 个月」。
- 走 ① → 免备案，保住最大灵活度，代价仅是可用性/记忆负担。

**⚠️ 一处待老大澄清的前提（勿默认成立）**：老大曾表述「域名不能缺（法律要求）」。而 §9.4 查证的规则是 —— **触发备案的是「域名 + 解析至内地服务器 + 开通 Web 服务」三者齐备**；三家云文档均明确**纯 IP 访问不涉及备案**。若该前提源于误解，则路径 ① 成立，成本可再降一档；若确需域名（移动端可用性），则须接受路径 ② 的包月约束。

---

## 10. 复现资产

- 并发探针（node，真实运行时 `node:sqlite`）：`harness/scripts/cvm-probes/cvm-sqlite-probe.cjs`（参数：db 路径、busy_timeout ms）
- 并发探针（python 对照）：`harness/scripts/cvm-probes/cvm-sqlite-probe.py`
- landlock 正反对照：`harness/scripts/cvm-probes/cvm-landlock-verify.mjs`（用例 A–E，含网络用例；⚠️ **须在 harness 树内运行** —— 它 import 官方 `@deepseek-ai/node-addon-landlock-run`，由落点树提供）
- 启动命令（**必须 127.0.0.1，见 §3**）：`dsh --profile web --host 127.0.0.1 --port <p> --no-open`

> ⚠️ **2026-09-16 更新（已回传入仓）**：上列三个探针原置于 CVM `~/dshprobe/` 与 `~`，**已回传进仓库 `harness/scripts/cvm-probes/`**（加 `cvm-` 前缀以与同目录既有命名一致），**CVM 侧原件已删** ⇒ 本项不再依赖 CVM 存活（正合下方「该机有期限」一条的要求）。原记「DSH 安装：`~/dshprobe`（303MB，`0.1.2-rc.1`）」**已不存在**（该目录随清理删除）；CVM 现只有**落点树 `~/harness`**（= CLI 落点，代际 `0.1.5-rc.2`）与各 home，结构见 `docs/dsh/dsh-migration.md` §3.6。

> ⚠️ **本项已闭合（2026-09-16）**：上述三个探针**已回传入仓**（见上条），不再依赖 CVM 存活。**仍只在 CVM 上**的产出（会话库 / session 落盘 / 采数曲线 / `~/larry-data/larry.db` 等）由 **3.9「CVM 产出回传核对表」**统一收口 —— 该机**已续费（2026-10-08 · 一年 · 200 元）⇒ 到期日 = 2027-10-09 21:08:53**。

---

## 11. 出网能力实测（2026-09-12 🟢 WB 在该机上实跑）

> **动机**：老大问「要不要给 CVM 搭梯子 / 要不要换一家云」。此前只有 §6 坑 2 的**单点观察**（Chroma 模型源 15 KB/s），不足以支撑决策 ⇒ 做一轮全目标实测。
> **方法**：`curl -w` 取状态码 / `time_connect` / `time_starttransfer`；大文件取 `size_download ÷ time_total` 为实速（**小响应的 `speed_download` 无参考价值**，勿混用）；每目标限时 8–20 s。

### 11.1 实测数据

| 目标 | 结果 | 连接 / 首字节 / 实速 |
|---|---|---|
| **① 完全不通** | | |
| `www.google.com` | **000** | —（复测稳定，非偶发） |
| `api.openai.com` | **000** | — |
| `huggingface.co` | **000** | — |
| **② 通但慢** | | |
| `registry.npmjs.org` | 200 | conn 178 ms / ttfb **948 ms** |
| `github.com` | 200 | conn 130 ms / ttfb 524 ms / ~29 KB/s |
| `pypi.org` | 200 | conn 223 ms / ttfb 672 ms / ~30 KB/s |
| **③ 通且快（境外）** | | |
| `nodejs.org` | 200 | **31.0 MB / 8.24 s = 3.77 MB/s** |
| **④ 通且快（国内 / 镜像）** | | |
| `api.deepseek.com` | **401**（无 key 的正常响应） | conn 16 ms / ttfb **105 ms** |
| `mirrors.tencent.com` | 200 | conn 4 ms / ttfb **34 ms** |
| `registry.npmmirror.com` | 200 | conn 6 ms / ttfb 130 ms |
| `mirrors.ustc.edu.cn` | 200 | conn 60 ms / ttfb 118 ms |
| `www.modelscope.cn` | 302 | conn 20 ms / ttfb 76 ms |
| `hf-mirror.com` | 200 | conn 185 ms / ttfb 386 ms |
| **⑤ 模型文件实测下载（唯一真痛点）** | | |
| `hf-mirror` → `bge-small-zh-v1.5/pytorch_model.bin` | 200 | **95.8 MB / 9.45 s = 10.1 MB/s** |
| `modelscope` → 同上 | 200 | **95.8 MB / 10.45 s = 9.17 MB/s** |
| **⑥ 网络层** | | |
| `8.8.8.8:53` / `1.1.1.1:53` TCP | **OK** | 境外 IP 层**可达**（⇒ 不是全网封锁） |
| proxy 环境变量 | 无 | 仅预置 `GOPROXY=https://mirrors.tencent.com/go,direct` |

### 11.2 判定

1. **这台机器"不天然翻墙"** —— Google / OpenAI / HuggingFace 直连**稳定失败**。
2. **但"出境"本身不慢** —— `nodejs.org` 跑出 **3.77 MB/s**。⇒ **问题不在"境内 vs 境外"，在"具体目标"**：同为境外，`nodejs.org` 快、`npmjs` 慢、`google` 不通。⚠️ **§6 坑 2 的"15 KB/s"是特定源（Chroma 自带 S3 下载器）的问题，不得外推成"境外源都慢"。**
3. ⭐ **生产依赖逐项有解（限定于当前依赖清单）**：
   - **LLM API**（`api.deepseek.com`）→ 国内，ttfb 105 ms，**完全不涉及出境**
   - npm → npmmirror｜apt → USTC｜Go → 腾讯镜像（34 ms）
   - **embedding 模型（唯一真痛点）→ 国内两条路都 ~10 MB/s**（95 MB / 10 s）
4. ⇒ **不需要给 CVM 搭梯子**；**不需要为此换云厂商** —— 换厂商解决不了"特定目标被墙"（那是政策层，不是厂商路由差异），且本机出境路由质量意外地好。

> **边界**：第 4 条只对**当前依赖清单**成立。若将来要接入 OpenAI / Claude 等境外 LLM 或 `huggingface.co` 直连，结论不适用（但本项目已明确放弃海外配置，2026-09-06）。

### 11.3 由此产生的两条订正

- **§6 坑 2 订正**：原文"换 `HF_ENDPOINT` 镜像**无效**…首次部署必须预置模型或找可用国内镜像/代理，否则卡死在初始化"。**前半句仍成立**（Chroma 走自己的 S3、不经 `HF_ENDPOINT`）；**后半句已有实测解** ⇒ **解法不是"让 Chroma 自己下"，而是「预置模型文件」**：用 `hf-mirror` / `modelscope` 拉文件（各 ~10 MB/s）放进 Chroma 模型缓存目录。
- **§8 未闭合表解锁**：`embedding 模型加载内存（150–250 MB 🔴 估算）` 的**卡点（模型源 15 KB/s 下不完）已解除** ⇒ 现在可以真机下载后测实际加载内存。
- ⚠️ **一条不解释的现象（留痕，不猜成因）**：`hf-mirror.com` 302 后的 final URL 落在 **`cas-bridge.xethub.hf.co`**（HF 自己的 CDN 域）却**可达且 10 MB/s**，而 `huggingface.co` 直连 000。**成因未查、不给猜测**；就可用性而言"能拿到文件"已构成结论。

---

## 12. 凭据落位（DSH 侧 LLM Key）

> **动机**：3.0 前置需在该机配起可用 Key ⇒ 先钉死"填哪里"（指错文件等于白干一轮）。
> **权威来源**：`@deepseek-ai/dsh-credentials-local@0.1.2-rc.1` 包内 `README.zh.md`（「密钥从哪里来」「凭据文件本身」「谁能读取该文件」三节）+ `@deepseek-ai/dsh-llm-deepseek` 的配置表。**源码文档级确认，非推测。**

### 12.1 载体 · 结构 · 优先级

- **载体** = `<harness home>/.credentials.yaml`，即 **`$DSH_HOME/.credentials.yaml`**（`$DSH_HOME` 未设时回落 `~/.dsh`）
- **结构** = 带版本的 YAML，**两个分节**：`refs:`（按环境变量名存密钥值）／ `records:`（按 `<owner>/<id>` 存插件凭据）。**LLM Key 走 `refs:`**
- **四层优先级**（先有值者胜）：**启动环境 > 存储文件 > 项目 `.env`（`<invocation cwd>/.env`）> 主目录 `.env`（`$DSH_HOME/.env`）**

### 12.2 键名（由消费方定，非自由命名）🟢

`dsh-llm-deepseek` 配置项：`apiKeyEnv` 默认 **`DEEPSEEK_API_KEY`**（先经凭据 seam，再到环境变量）；`baseURL` 默认 `https://api.deepseek.com`（设了 `$DEEPSEEK_BASE_URL` 则优先）。
⇒ **默认值即所需 ⇒ profile 不用改** —— 只要 `refs:` 里出现 `DEEPSEEK_API_KEY` 即生效。

### 12.3 文件形态

```yaml
version: 1

refs:
  DEEPSEEK_API_KEY: <值>

records:
  client-connection/browser-session:   # DSH 客户端会话凭据（非 LLM Key），勿删
    kind: grant
    payload:
      version: 1
      secret: <值>
```

### 12.4 五条实操事实 🟢

1. **可直接手工编辑** —— `watch: true` ⇒ **改完自动热重载，不需要重启 DSH**（包文档明写"你可以直接编辑该文件"）
2. **并发编辑会合并** —— 产品写入时保留注释与未触及条目的排版 ⇒ 手工编辑与产品写入不互斥，不会被覆盖
3. ⚠️ **Windows 侧不检查文件权限**（原话"Windows 没有可检查的 mode，因此在那里跳过该检查而不是伪造它"）⇒ **"必须 600 否则启动失败"是 POSIX 专属**（CVM / WSL 成立，本机不成立）
4. **空值 ≠ 有值** —— 空字符串被拒；**删密钥 = 删条目**，不是置空。未知顶层键 / 类型错误 / 格式错误 YAML 会在**启动时失败**（不静默忽略）
5. ⚠️ **`key:` 冒号后必须留一个空格**（2026-09-14 实战踩坑，**静默降级**）
   - 写成 `DEEPSEEK_API_KEY:sk-xxx`（冒号后无空格）时：**YAML 不报错、`yaml.safe_load` 不报错、`grep 'DEEPSEEK_API_KEY'` 照样命中** —— 但该行**不被解析为子键**，而是降级成父键的**多行标量续行** ⇒ **`refs` 整个变成字符串**（实测 52 字符 = 键名 `DEEPSEEK_API_KEY: ` 18 + 值 33 + 换行 1），DSH 按 `refs.DEEPSEEK_API_KEY` 取值取不到。
   - ⇒ 与第 4 条对照：第 4 条是**响的**（启动时失败），**本条是哑的**（零报错、语义已变）—— 同类陷阱里更危险的一种。
   - **唯一可靠判据 = 看类型，不是看键在不在**：
     ```bash
     python3 -c "import yaml;d=yaml.safe_load(open('$HOME/.dsh/.credentials.yaml'));print(type(d.get('refs')).__name__, sorted((d.get('refs') or {}).keys()))"
     ```
     必须打印 `dict ['DEEPSEEK_API_KEY']`；打印 `str` 即中招。
   - **修复**：补一个空格 —— `sed -i 's|^  DEEPSEEK_API_KEY:|  DEEPSEEK_API_KEY: |' <file>`。⚠️ `sed -i` 会**重建文件**，改完必须 `chmod 600` + 复核（本次实测权限未掉，但不可依赖）。
   - **附带一般化**：凡"填了但没生效"的排查，**先验结构再疑逻辑** —— 本案里 `grep` 命中、字节数也变了（161→222），一路都是"看起来填上了"。

### 12.5 落点与现状（2026-09-14 🟢 实测）

| 环境 | 路径 | 现状 | 要填吗 |
|---|---|---|---|
| **CVM · 裸跑（默认 home）** | `/home/ubuntu/.dsh/.credentials.yaml` | ✅ **已填**（600 / 223 B，2026-09-14）：`refs.DEEPSEEK_API_KEY` 就位（`sk-` 起 / 35 字符），`records:` 原段完好 | ✅ 落位完成；✅ **真生效已验成（2026-09-16）** —— `dsh-prompt.mjs` 裸跑、**不注入** env key，得 `turn/end.kind=completed` ＋ 非空回复（D1 证成；3.0.5 独立复现）｜ ⚠️ 但**不能用 real-api 验**（见下条订正），须用 `dsh-prompt.mjs` 裸跑 |
| **CVM · 显式 `DSH_HOME=~/larry-dsh-home`** | `/home/ubuntu/larry-dsh-home/.credentials.yaml` | ⚠️ **不存在**（09-10 建的该 home，profiles / sessions / storages 齐全，**独无凭据**） | ⚠️ **本机 `harness/scripts/cvm-probes/*.sh` 钉死此路径** ⇒ 照抄 = "无 key 假绿" |
| 本机 · client 启动的 DSH | `D:\Code\LarryAgent\.dsh-home\.credentials.yaml` | **不存在** ⇒ 现走"启动环境"层（client 注入 env） | 可选 |
| 本机 · 手工跑 `dsh` | `C:\Users\SuLarry\.dsh\.credentials.yaml` | 存在，**仅 `records:`** | 可选 |
| WSL | `~/.dsh/.credentials.yaml` | **DSH-3 不参与**（老大 2026-09-14 拍定；见 §12.7 附三） | 暂不填 |

> ⚠️ **订正一处旧假设**：此前记"CVM 上那份是 09-10 PoC 留下的、Key 早已关闭"—— **实测该文件从来没有 `refs:` 段**（只有 browser-session 记录）⇒ 该机**从未配过 LLM Key**，09-10 的连通来自启动环境注入。⇒ 给 CVM 填 = **新增一段**，不是"替换旧 Key"。

> ⚠️ **再订正一处（同日）**：WB 上一轮口头结论称"**CVM 落点唯一**，没有本机那种两个 home 的歧义"—— **错，已实测推翻**。CVM 的成因与本机**完全相同**：**显式 `DSH_HOME` → 落到指定目录；未设 → 回落 `~/.dsh`**。CVM 上两处并存（见表）⇒ **"填哪个"同样取决于"谁启动 DSH"**，不是无歧义。该口头结论当时指导了 09-14 的落盘动作（选择本身未错——裸跑确实读 `~/.dsh`），但**"无歧义"这半句是错的**。

> 🔴 **订正第三处：验证路径错了（WB 2026-09-14 查实，推翻一条既有预期）**。§12.5 表里 CVM 行原写"**真生效**待 3.0 real-api 复跑" —— **该路径不成立**。
>
> - `harness/scripts/run-real-api.mjs` → vitest → `harness/vitest.config.ts` 的 `setupFiles: ['tests/isolated-setup.ts']`，而该文件 `:31-33` 把 `process.env.DSH_HOME` **强制覆盖为 `mkdtempSync` 出的临时目录**，`:44-52` 还有正向白名单断言（指向真实路径会判 FAIL）。
> - ⇒ **real-api 链路读不到 `~/.dsh/.credentials.yaml`**；它的 Key **只能来自环境变量** `DEEPSEEK_API_KEY`（`tests/real-api.ts:28` 自述"注入值"、`:31` 临时 home 隔离）。
> - ⇒ 推论：`cvm-probes/*.mjs`、`dsh-prompt.mjs` 的注释也都写"Key 由 caller 注入" ⇒ **CVM 上至今没有任何一条路径消费过那份 `.credentials.yaml`**（与 `:458` 那条"09-10 的连通来自启动环境注入"互为佐证）。
> - ⇒ **正确验法**：`harness/scripts/dsh-prompt.mjs`（**不覆盖 `DSH_HOME`** ⇒ 裸跑落 `~/.dsh`），且**不注入** `DEEPSEEK_API_KEY` 环境变量 —— 若此时仍成功，即证明**文件层被读**。**规格与三态造法见 `archive/roadmap-history.md`「DSH-3.0」段**。

### 12.6 与 Tier0 红线 ① 的关系

- 该文件**只存凭据**，且**产品绝不把文件路径交给 agent**；但**同 UID 的工具进程照样可读**（官方原话"这是审慎，不是边界"）
- ⇒ **值不得写进任何受版本控制的文件（测试用Key不受此限制）**；两处 dsh home 与 CVM 的 `~/.dsh` 均在 git 跟踪范围之外

### 12.7 两条轨并存期：本机 Key 落在两处（2026-09-14 补）

> **动机**：§12.1–12.6 只讲 **DSH 侧** ⇒ 易被读成"Key 只有 `.credentials.yaml` 一处"。实际迁移期**两条轨各读各的载体**，漏填任一处都有整条轨起不来。（本节的触发问题：老大问"`backend/config.yaml` 是不是废了"。）

| 轨 | 谁在跑 | 凭据载体 | 键名 | 现状 |
|---|---|---|---|---|
| **backend**（现役，Python 自研 agent） | `backend/` 全模块（models / tools / services / memory / rag / api / db / middleware） | **`backend/config.yaml`** | `models.deepseek.api_key` | ✅ 已填，正常服务 |
| **DSH**（迁移目标，agent runtime） | `harness/` | `$DSH_HOME/.credentials.yaml` | `refs.DEEPSEEK_API_KEY` | ❌ 未填（现靠启动环境注入） |

- **并存是设计、不是重复**：`dsh/dsh-migration.md` 回退条款明写"旧 Python 后端在 **DSH-6 验收通过前保持可用、可回退**" ⇒ **`config.yaml` 里的 Key 在此之前不得移除**（移除 = 现役后端直接起不来）。
- **终态收敛为一处**：DSH-6 通过、backend 退役后，只剩 `.credentials.yaml`。
- **取值口径**：两条轨**填同一把 Key** —— Key 按"**环境**"分（dev／wsl／cvm），不按"轨"分 ⇒ 本机两处都用 `larry-dev`。见 §12.5 与 `TODO.md` DSH-3 段（三环境三把专用 Key）。

⚠️ **`backend/config.yaml` 不止 LLM Key**：另有 `embedding.api_key` / `search.brave_api_key` / `server.api_key`。它们在终态的归属属**迁移映射**范畴（DSH-3/4 处理），本节只钉 LLM Key 一条。

#### 附一：两个环境各有两个 DSH home —— 决定 `.credentials.yaml` 究竟写哪

`DSH_HOME` 解析优先级（`@deepseek-ai/dsh-home-paths` 包文档）：**显式配置 > `$DSH_HOME` > `~/.dsh`**

**本机（Windows）**

| 谁启动 DSH | `DSH_HOME` 来源 | 凭据实际落点 |
|---|---|---|
| **client（PC 版 / Tauri）** | ⭐ 显式设成 `<项目根>/.dsh-home`（`client/src-tauri/src/main.rs` 的 `dsh_prompt`） | `D:\Code\LarryAgent\.dsh-home\.credentials.yaml`（当前**不存在**） |
| **手工跑 `dsh`** | 未设 ⇒ 回落默认 `~/.dsh` | `C:\Users\SuLarry\.dsh\.credentials.yaml`（当前存在，仅 `records:`） |

**CVM（Linux）—— 同一机制，只是"显式"的那一方换了人**

| 谁启动 DSH | `DSH_HOME` 来源 | 凭据实际落点 |
|---|---|---|
| **本机 `harness/scripts/cvm-probes/*.sh`**（探针脚本） | ✅ **2026-09-14 已改**：`export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"`（5 个硬钉；`cvm-step0.sh` 的 `MODE` 默认值由 `explicit` 翻为 `default`） | `/home/ubuntu/.dsh/.credentials.yaml`（✅ 已填 223 B / 600） |
| **裸跑 `dsh`（默认）** | 未设 ⇒ 回落 `~/.dsh` | 同上（**两条路已合一**） |
| **`~/larry-dsh-home`（旧）** | 仅当显式传 `DSH_HOME=` | **无凭据** ⇒ 降级为**负向对照器材**，**不是**运行 home |

（改前形态留痕：5 个脚本硬钉 `$HOME/larry-dsh-home`、`cvm-step0.sh` 默认 `explicit` ⇒ **照抄 = 无 key 假绿**。⚠️ 写 `${DSH_HOME:-…}` 而非字面 `unset` 是**必须的**：脚本内 `$DSH_HOME/profiles/…` 参与路径拼接且带 `set -u`，真 unset 会硬报错。）

⇒ 两处**互不相通**（非软链、非同一份）：填哪个取决于"**谁启动 DSH**"。
⇒ ⚠️ **CVM 特有风险**（改脚本前）：本机脚本钉的 home 与 CVM 已填凭据的 home **不是同一个** ⇒ **照抄 `cvm-probes` 脚本 = 无 key 假绿**（§1 已记录该形态）。**已按"改脚本指向 `~/.dsh`"处置。**

#### 附一之补：CVM 的 `~/.dsh/profiles/*` **曾是**空壳（2026-09-14 实测订正 ／ ✅ 2026-09-16 已装齐）

原记「`~/.dsh/profiles/` 四个全在」是**数目录、没验依赖**得出的。实测：

| home / profile | `dependencies` | `node_modules/@deepseek-ai` |
|---|---|---|
| `~/.dsh/profiles/sdk` | **`{}`** | **0** ⇒ **空壳**（bundles 已声明、依赖从没装过） |
| `~/.dsh/profiles/larry` | api-gateway, host-webserver | 7 |
| `~/larry-dsh-home/profiles/sdk` | base, sdk-app, storage-sqlite, plugin-storage-probe | 101 |

⇒ **凭据落在 `~/.dsh`、可运行的 profile 落在 `~/larry-dsh-home`** —— 两者被劈开。DSH-3.0 的 D 组（凭据层验真）因此崩在**启动期**（`-32603 cannot create effect on inactive context`），**与凭据无关**。

⇒ 纪律「CVM 以 `~/.dsh` 为准」**结论不变**（其理由本就含"裸跑默认"一条，与依赖无关），但**必须先把 `sdk` profile 装进 `~/.dsh`** 才真正可用（装法见 `archive/roadmap-history.md`「DSH-3.0」段；⚠️ 按**基线 015** 装，且须 **CLI 与 profile 同代** —— 2026-09-15 本机实测的跨版本混合污点即由此而来）。

⭐ **同一形态在本机也存在**（`.dsh-home/profiles/sdk` 99 包 / `~/.dsh/profiles/*` 空壳）⇒ **"凭据落一个 home、profile 落另一个 home"是系统性问题**，不是 CVM 独有。

**✅ 现状（2026-09-16，WB 上机独立复核）**：`~/.dsh/profiles/sdk` = **deps 5 项**（`dsh-base` ＋ `dsh-sdk-app` ＋ 3 个可选 peer：`session-persistence` ／ `session-query` ／ `http-proxy`，**全 `0.1.5-rc.2`**）、`node_modules/@deepseek-ai` **109 包**；CLI 亦 `0.1.5-rc.2` ⇒ **不再是空壳，且三方同代**。「凭据与可运行 profile 被劈开」这一形态**在 CVM 侧已消除**（⚠️ 本机 `.dsh-home` 一侧**未动**）。

- 📐 **015 完整 composition 口径 = `dsh-base` ＋ `dsh-sdk-app` ＋ 3 个可选 peer**：它们在锁文件里是 `peerDependenciesMeta.optional: true`，而 profile 配 `autoInstallPeers: false` ⇒ pnpm 把 32 条列进 `transitivePeerDependencies` **却不安装** ⇒ 运行时回落 fallback 层（**这正是 DSH-3.0.3 崩的机制**；若回退层与 profile **同代**则可省）。
- ⚠️ **别把 `node-addon-system@0.1.2` 当"旧代际残留"**：它是**独立包**（无 `dsh-` 前缀、与 DSH 代际体系无关），按 `grep 0.1.2` 扫代际时会假命中 ⇒ **判定残留须按 `@deepseek-ai/dsh-*` 前缀筛**。

**CVM 侧 `larry` profile 退役（2026-09-17，WB 上机执行）**：

| 维度 | 实测 |
|---|---|
| 代际 | deps 全钉 **`0.1.2-rc.1`**（`dsh-api-gateway` ／ `dsh-host-webserver`）＋ 传递到 `dsh-typert-protocol@0.1.2-rc.1` ⇒ **012 代**（而该机 CLI ／ 共享层 ／ `sdk` 面均已 015）|
| 引用面 | 全机 3 处 "larry" 命中**皆同名不同物**（`@larryagent/` 命名空间 ／ `larry_probe` 存储域名 ／ `larry-test-realapi-` 前缀）⇒ **无任何脚本把它当 profile 用** |
| 活跃度 | mtime 停 **2026-09-10 10:43**，此后 11 天未动 |
| 规模 | 自身 17 包（`@deepseek-ai` 7 个）／ **1.9 MB** —— 与「真删慢」的工程侧 99 包不同，**删除成本低** |

⇒ **判定：退役。** 原记「`larry` 本次不动（有主）」系**照抄旧登记未核实** —— 其名义"主"（本节 §2 口径警告原写"生产跑 headless `larry`"）已被同表实测（该项测的是 `sdk` 进程树）与 09-16 定型（生产落点 = `sdk`）双重推翻；且 composition 是 api-gateway ＋ host-webserver，与"headless"本就不符 ⇒ **实为 09-10 验证 HTTP/gateway 面（`/api/remote.mux` 带 cookie 仍 404 那次）的实验器材残留**，012 代在 015 环境里**留也跑不起来**。

**处置**：退役 —— 先重命名备份 `~/.dsh/profiles/larry.RETIRED-20260917-1818`，**随后同日真删**（原路径与备份名**磁盘上均已不存在**，此名仅供追溯；`sdk` 面未受影响）。⚠️ **`acp` ／ `web` 两个空壳（deps `{}`）勿动** —— 出厂模板，且 `web` 是多条结论的基准面。

⭐ **同批实测（跨机同形，详见 `docs/local-env.md` §4.3）**：该机共享层 `profiles/node_modules` **同样含 `dsh-sandbox-local@0.0.1-rc.1`**，从 `sdk/` 起点解析则得 `0.1.5-rc.2` ✓ ⇒ 旧代**来自依赖解析本身**（peer `*` → npm latest），**非本机人为复刻所致**。

#### 附二：手工复验 / 脚本驱动时的 `DSH_HOME` 注入（2026-09-14 实测）

**触发问题**：老大问"我怎么给你显式注入 `DSH_HOME=<项目根>/.dsh-home`"。查实的结论是——**这件事不需要老大做**：Bash 命令的 env 前缀由执行方自己在命令里带；WorkBuddy 全局 `settings.json` 无 `env` 字段、公开文档亦无配置章节 ⇒ **平台层没有这个位**。但**写法本身有一个静默坑**，故立此节。

**Windows 侧只有两种写法可用**，而 Git Bash 里最自然的两种恰恰是错的：

| 写法（Git Bash） | 结果 | 说明 |
|---|---|---|
| `DSH_HOME=/d/Code/LarryAgent/.dsh-home` | ❌ | MSYS 风格。**env 值不经 Git Bash 路径转换**（转换只作用于 argv） |
| `DSH_HOME="$(pwd)/.dsh-home"` | ❌ | `pwd` 输出 `/d/…`，同上 |
| `DSH_HOME="D:/Code/LarryAgent/.dsh-home"` | ✅ | 盘符形式（正/反斜杠均可） |
| ⭐ `DSH_HOME="$(pwd -W)/.dsh-home"` | ✅ | **推荐**：自动推导且给盘符形式（`pwd -W` 是 Git Bash 内建；`cygpath` 在 PortableGit 1.2.0 下**不可用**） |

⚠️ **错写不报错，而是静默另起一个空 home**：`path.resolve('/d/Code/LarryAgent/.dsh-home')` = **`D:\d\Code\LarryAgent\.dsh-home`**（当前盘根下多一层 `d\`）。DSH 找不到会**自己创建**（profiles / 凭据全无）⇒ 静默走"无 key"路径、**判据全绿**。与 `cvm-probes` 钉错 home（§12.5）**同一形态**。

⛔ **分场景纪律（防"一刀切注入"踩测试守卫）**：

| 场景 | 注入？ | 为什么 |
|---|---|---|
| 手工跑 `harness/scripts/*.mjs`（非测试） | **必须**：`DSH_HOME="$(pwd -W)/.dsh-home"` | 脚本本身不推导；未设即回落全局 `~/.dsh`（**无 `refs:` 段**） |
| 跑 harness 测试（vitest / `run-real-api.mjs`） | **禁止** | `tests/isolated-setup.ts` 逐 worker 强制覆盖为临时 home + 正向白名单守卫；注入真实路径会触发 `sentinel-failfast` 判 FAIL |
| client（Tauri）启动 | 无需人工介入 | `main.rs:291` 硬编码 `.env("DSH_HOME", <项目根>/.dsh-home)` |
| CVM | 不注入（裸跑落 `~/.dsh`，凭据在此） | ⚠️ 但 `cvm-probes/*.sh` 脚本内**钉死了错 home**，须先改脚本 |

#### 附三：WSL 在 DSH-3 期间不参与（老大 2026-09-14 拍定）

⇒ §12.5 表内 WSL 行"暂不填"的**依据**：**DSH-3 的判定链只在 CVM 上跑**（S0 已拍"CVM 单跑"），WSL 不承担 DSH-3 的任何一个判定环节 ⇒ 无需为其准备凭据。

- **不采纳 Claude「WSL 当演练场、CVM 当判定场」的建议**，三条理由（沙箱探针 ABI 自适应 ⇒ 无需在 ABI 7 的 WSL 预演；WSL 与 CVM 差异不止 ABI ⇒ 预演结论不可外推、反造假安全感；一次性风险用 CVM 上 dry-run + 采数化解更便宜）见 `TODO.md` DSH-3 段。
- ⚠️ 是"**DSH-3 期间不参与**"，**不是**"WSL 定位降级" —— `test-env.md` §1「WSL 长期担任核心测试环境」的定位**不变**；该文档 §10「WSL 具体承载哪类测试」在 DSH-3 期间**挂起**（状态仍是待定，勿读成已解决）。
