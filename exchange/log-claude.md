# Claude 协作区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写到其他文件）

---

## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.4-T** | Claude | 本机（Windows） | ✅ **已完成（T-1 ✅ ＋ T-2 两轮 5/5 全绿；2 处与 Trae 不一致已原样列于下）** | 2026-09-20 |

- 已完成并复验（各段已按交流区规矩清理；3.0.x 系列与 DSH-2 系列均已在 `TODO.md` 承接）：**3.7.3-T ✅（WB 复核：T1–T4 四项判定均成立，另补 1 条更强的 ＋ 记我方派稿缺陷 1 处）**。
- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3.7.4-T」段**；本区只放**怎么做**。⚠️ 需回溯时用 `git log -p -- exchange/log-claude.md`。
- ⚠️ **通用纪律**：
  1. **报告须注明通道** —— 同一台机器上，不同工具树 ／ 不同 shell 会话会给出**不同 node 版本**与不同文件系统视图 ⇒ 结论不可跨通道互推（"Bash 通道"这种写法对别人而言是**另一条**）。
  2. **"没有 ／ 不存在"须附检索式与遍历范围**，否则不可验、等于没回答。
  3. **自曝优于好看**：口径错 ／ 跑歪 ／ 覆盖了证据，都直接写。
  4. **未观测到的行为不得写成已证**（"可达但未观测"要标清；"构造成立"要标为构造）。
  5. **应红 ／ 应绿须逐件读源码定期望**，不得按"组"给口径（同一批哨兵里可能有**落绿才是绿**的件）。
  6. **收尾必核 `git status`**。

---

## ✅ DSH-3.7.4-T ／ T-1 回报 · 装置两条「破坏动作」在 Windows 上的生效性

> 场地：**本机 Windows** ｜ 通道：**Bash 工具通道**（MSYS，`isMSYS=MINGW64`），node = **v24.14.1**（`D:\App\node\node.exe`）
> 交付件：`harness/scripts/s0-e2e-destructive-actions.mjs` —— 自足可复跑，一条命令：
> `node harness/scripts/s0-e2e-destructive-actions.mjs`（退出码语义见其文件头：`0`=观测已取得，**不代表装置对**）
> 证据落盘：`D:\Code\_claude-evidence\374t\`（`t1-results.json` ／ `t1-transcript-2026-09-20T02-04-54-281Z.txt`（v1）／ `t1-transcript-2026-09-20T02-05-49-863Z.txt`（v2）／ `t1a-icacls.raw.bin` ／ `ch2\` ／ `v2222\`）
> ⛔ 本段**不经** `s0-e2e` 全链路、**不经** `installPlugin()`、不读 Key、不碰源 profile。

### 0 · 结论先行

| # | 问 | 答（实测） |
|---|---|---|
| T-1-a | `chmodSync(dir, 0o500)` 在 Windows 上能否让写失败 | **不能** —— 写文件与建目录**都成功**；装置**旧**注释「只读 ⇒ 落盘必失败」**不成立** |
| T-1-a 正对照 | 同一目录 `0o700` 写成功？ | **成功** ⇒ 装置本身有效（不是"到处都写不进"） |
| T-1-a 现分支 | `icacls /deny (AD,WD)` 能否让写失败 | **能** —— `writeFileSync`／`mkdirSync` **双双 `EPERM`**；`/remove:d` 后**恢复可写** |
| T-1-b | `process.kill(-pid,'SIGKILL')` 在 Windows 上可行？ | **不可行** —— 抛 **`ESRCH`**（`kill ESRCH`），且**直连子仍活着** ⇒ 装置**必走 catch 回落** |
| T-1-b 回落 | 只杀直连子后孙进程还在吗 | 本探针拓扑下**孙也死了**（孙 stdio=`ignore` ／ `pipe` 两形态皆然） |

⚠️ **T-1-b 的最终判定仍留给 T-2**：装置里的孙 = **dsh CLI**（stdio 由 SDK 持有），与最小拓扑不同 ⇒ 标**待定观察**，不据此外推。

### 1 · 原文观测（命令 ＋ 值，一字未改写）

```
$ node harness/scripts/s0-e2e-destructive-actions.mjs          # v24.14.1，Bash 工具通道

[臂1 chmod 0o500]  arm1_modeAfterChmod500 = 0o444
                   arm1_actualWrite = {"tag":"a1","writeFile":{"ok":true},"mkdir":{"ok":true},
                                       "entriesAfter":["probe-a1-subdir","probe-a1-write.txt"]}
[臂1 正对照 0o700]  arm1p_modeAfterChmod700 = 0o666
                   arm1p_actualWrite = {"tag":"a1p","writeFile":{"ok":true},"mkdir":{"ok":true}}
                   arm1p_arm1ArtifactsPersisted = ["probe-a1-subdir","probe-a1-write.txt"]
[臂2 icacls /deny]  arm2_icaclsDenyExit = 0
                   arm2_icaclsDenyOut = 已处理的文件: D:\Temp\Sys\s374t-t1a-Kk1dQx\acl ⏎ 已成功处理 1 个文件; 处理 0 个文件时失败
                   arm2_actualWrite = {"writeFile":{"ok":false,"err":{"code":"EPERM","errno":-4048,
                                        "message":"EPERM: operation not permitted, open '…\\acl\\probe-a2-write.txt'"}},
                                       "mkdir":{"ok":false,"err":{"code":"EPERM","errno":-4048,
                                        "message":"EPERM: operation not permitted, mkdir '…\\acl\\probe-a2-subdir'"}},"entriesAfter":[]}
[臂2 撤销]         arm2_icaclsUndoExit = 0 ；arm2_afterUndoWrite = {"writeFile":{"ok":true},"mkdir":{"ok":true}}
[臂3 整组杀]       直连子 pid=35020（自报 35020）｜孙 pid=17468
                   arm3_aliveBeforeKill_{child,sun} = {"alive":true}
                   arm3_groupKill(-pid) = {"ok":false,"err":{"code":"ESRCH","errno":-4040,"message":"kill ESRCH"}}
                   arm3_after_child = {"alive":true,"exitCode":null,"signalCode":null}   ← 组杀抛错后直连子**仍活**
                   arm3_after_sun   = {"alive":true}
[臂4 只杀直连子]   arm4_directKill = {"ok":true} ；arm4_after_child = {"alive":false,"signalCode":"SIGKILL"}
                   arm4_after_sun = {"alive":false,"err":{"code":"ESRCH"}}
[臂4b 管道孙]      arm4b_after_sun = {"alive":false,"err":{"code":"ESRCH"}}
[收尾]             全部子进程已确认退出（登记 6 个 pid）／临时目录已删（残留=false）
```

- **机制读数**：`chmod 0o500` 在 Windows 上落成 `0o444`（**只反映"只读"属性**），而 Windows **对目录忽略**该属性 ⇒ 写保护无从建立；`0o700` 落成 `0o666`。
- ⛔ `fs.accessSync(dir, W_OK)` 在 `0o444` 下**照样通过**（`arm1_accessSyncW_OK_非判据`）——**它不可当判据**，本件只作对照留存。
- `icacls` 原文按**字节**留证（本机输出为本地化编码；`t1a-icacls.raw.bin` ＝ 原始字节，报告里那份是 `TextDecoder('gbk')` 解码，未手工转写）。

### 2 · 通道 ／ 运行时（⛔ 不跨通道外推）

| 记录 | 启动器 | node | 结果 |
|---|---|---|---|
| 主记录 | Bash 工具（MSYS） | **v24.14.1** `D:\App\node\node.exe` | 见 §1 |
| 复跑 | PowerShell（`powershell -NoProfile`，由同一 Bash 通道发起） | **v24.14.1**（同一二进制） | **逐位一致** |
| 运行时轴 | 同上 | **v22.22.2**（`C:\Users\SuLarry\.workbuddy\binaries\node\versions\22.22.2-3\node.exe`） | **逐位一致** |
| 版本轴（仓外小探针，只跑 chmod＋负 pid 两臂） | 同上 | **v8.11.1**（`D:\App\Photoshop\node.exe`） | 同向（`0o444` 可写；组杀 `ESRCH`、子仍活） |

⚠️ **口径**：本机**只有一条 node 通道**（`which -a node` → 仅 `D:\App\node\node.exe`；全盘有界搜索只多出上述两个）。上表第 2–4 行**均由我这条 Bash 通道发起** ⇒ 严格说是**同一通道 ＋ 三个运行时**，**不是**三条独立通道。⇒ 结论按**单通道口径**写：**两条破坏动作的语义不随 node 版本变（8 ／ 22 ／ 24 三档一致），也不随 shell 变**。

### 3 · 自曝

1. **我的探针 v1 判据写坏**：正对照与臂 1 复用同一目录、同名目标 ⇒ 第二次 `mkdir` 撞 `EEXIST`，被我的谓词判成"写失败"，正对照因此**假红**（v1 transcript 已留盘）。v2 改为**每次调用唯一名**后重跑；v1／v2 除该条外**逐位一致**。
2. **v8 臂收尾又踩一次**：清理用了 `fs.rmSync`（node 8 **无此 API**）⇒ 抛 `TypeError`（`code` 为空，我打成了 `cleanup err = undefined`），临时目录残留一个。随后**第一次删除命令又被 bash 吃掉反斜杠**，打出"不存在，无需删"的**假阴性**（实际还在）；改前斜杠重删，`exists=false` 确认。（另：那条前缀通配删共享临时目录的写法被自动模式分类器拦下 —— **拦得对**，已改确切路径。）
3. **孙进程为何在"只杀直连子"时一并死：成因未查** —— 未进一步定位是控制台关闭 ／ 作业对象 ／ 管道断开中的哪一个。**不补成因**。
4. **未观测**：装置真实拓扑（孙 = dsh CLI）下孙的存活性 ⇒ 待 T-2。

### 4 · 未闭合

- **T-2 未跑完**（本回报写作时正在跑）⇒ 按诚实边界：**本块不得声称"3.7.4 修复成立"**。
- POSIX 侧（`chmod 0o500` 分支）**本机无法测**（无 Linux 通道）⇒ 未复验。

---

## ✅ DSH-3.7.4-T ／ T-2 回报 · 五变体独立复跑（**两轮**）

> 场地：**本机 Windows** ｜ 通道：**Bash 工具通道**（MSYS），node = **v24.14.1**（同 T-1）
> 命令（一条，自足可复跑；两轮仅 `S0_EVIDENCE_DIR` 不同）：
> `DEEPSEEK_API_KEY=<老大授权的临时 Key> S0_EVIDENCE_DIR='D:\Code\_claude-evidence\374t\s0-e2e' node harness/scripts/run-s0-e2e.mjs`
> 证据：`D:\Code\_claude-evidence\374t\s0-e2e\`（run1，13 件）｜`s0-e2e-run2\`（run2，13 件）｜stdout 副本 `374t-s0e2e-run1.out.txt`／`374t-s0e2e-run2.out.txt`（均**仓外**）
> ⛔ **未覆盖 Trae 的 `.s0-evidence`**：其 14 件 mtime 全程停在 09:32–09:54（跑前跑后两次核对未变）。
> 源 profile 与 Trae 可比：用 **runner 默认源** `C:\Users\SuLarry\.dsh\profiles`（未改 runner、未改 `real-api.ts`）。

### 0 · 结论先行

| 项 | 实测 |
|---|---|
| 五变体退出码 | run1 **5/5 exit=0**（61/51/62/44/48s）＋ `runner exit=0`；run2 **5/5 exit=0**（60/44/47/61/45s）＋ `runner2 exit=0` |
| 判据与 Trae 比对 | **61 个判据字段（三方）／ 60 一致**；`verdictText` 四条**逐字节一致**（base／no-bundle／wrong-key／no-session-dir） |
| **唯一不同** | `kill-client` 的 `④_bytesAtKill`：Trae **652** ／ 我 run1 **308**、run2 **649** |
| 该不同是否构成不一致 | **否** —— ① 它**不是断言项**（源码 `:325` 只记录；`:427` 断言的是 `④_killedBy`）；② **我两次自身就抖 341**（308↔649），幅度 ≥ 它与 Trae 的差 ⇒ 同一随机量的采样 |
| 负向对照 | 逐变体**该红的确实红了、该绿的仍绿**（§2 双锚表）—— 不是"全绿掩盖" |
| 源 profile | **两侧零写入**（sha 逐位对基线，跑前／跑中／跑后三次核）｜**A 锁无孤儿**｜**无临时目录残留** |
| 诚实边界 | **现在可以写"3.7.4 修复在本机（Windows）成立"** —— 但仅限 **Windows 分支**；POSIX 分支本机无通道复验（§5）。 |

### 1 · 命令 ＋ 原文观测

```
[s0] profiles=C:\Users\SuLarry\.dsh\profiles
[s0] evidence=D:\Code\_claude-evidence\374t\s0-e2e[|-run2]
[s0] ===== 汇总 =====                                    ← run1；run2 逐行同形
[s0]   base             exit=0 PASS （期望 PASS） 61s
[s0]   no-bundle        exit=0 PASS （期望 PASS：负向对照由测试内部断言"该判据变红"） 51s
[s0]   wrong-key        exit=0 PASS （期望 PASS：负向对照由测试内部断言"该判据变红"） 62s
[s0]   no-session-dir   exit=0 PASS （期望 PASS：负向对照由测试内部断言"该判据变红"） 44s
[s0]   kill-client      exit=0 PASS （期望 PASS：负向对照由测试内部断言"该判据变红"） 48s
runner exit=0
```

### 2 · 双锚表（变红项 ＋ "链路是活的"锚；三方一致）

| 变体 | 变红项（三方一致） | 活链路锚（三方一致） | 与 Trae J3 对表 |
|---|---|---|---|
| `base` | **无**（全绿） | `②_activated/injectFired/toolRegistered/toolCalled=true`；`①_toolNameInLog=[read_file]`；`③_verdictOk=true`；`④_nonce=true`；marker 5 事件齐 | ✅ 一致 |
| `no-bundle` | `②_activated/injectFired/toolRegistered/toolCalled=false` ＋ `①_toolNameIsOurs=false` | 日志里是**官方 `read`**；`③_verdictOk=true`；`④_nonce=true`；bundles **4→3** | ✅ 一致 |
| `wrong-key` | `③_verdictOk=false` ／ `③_errorCode=AUTH`（401）＋ `①_ping=false`＋`④_nonce=false` | `②_activated/toolRegistered=true`（插件先起来了） | ✅ 一致 |
| `no-session-dir` | `logPresent=false` ／ `④_sessionContainsNonce=false` ／ `③_turnEndKind=error`／`errorCode=UNKNOWN` | `②_activated=true`（激活早于落盘） | ✅ 一致（**含红灯形态 UNKNOWN**） |
| `kill-client` | `④_sessionContainsNonce=false` ＋ `①_ping=false` | `④_killedBy=first-session-log-byte`；`logPresent=true`；**落定 bytes=1015（三方逐个相同）** | ✅ 一致（除 `bytesAtKill`，§3） |

### 3 · 与 Trae 报告逐条比对（**不一致处原样列，不解释掉**）

| # | Trae 主张 | 我的独立复跑 | 判定 |
|---|---|---|---|
| J1 机制（pnpm 平台分支 ＋ `storeDir` 第二字段） | — | 未独立重放源码分支（**非本项任务**）；`repair:` note 里**源记录的绝对路径原文两侧一致**（`storeDir=C:\Users\SuLarry\AppData\Local\pnpm\store\v11` ／ `virtualStoreDir=C:\Users\SuLarry\.dsh\profiles\sdk\node_modules\.pnpm`） | ✅ 间接印证 |
| J2 三处修复 | — | 装置文件 sha256 `3fade5b26702c1f45b52…`／mtime 09:41，**我只读未改**（`git status` 无该文件） | ✅ |
| J3 双锚 | 见上表 | **逐变体对上**（含 `no-session-dir` 的 `errorCode=UNKNOWN` 红灯形态） | ✅ |
| J4 源 profile 零写入 | 两侧 0 写入 | **两侧 sha 逐位对基线**；另：`harness/.dsh-home` **不是**真实路径（实为**仓根** `D:\Code\LarryAgent\.dsh-home`，源码 `:268` `join(repoDir,'.dsh-home','profiles')`）—— Trae J8 的 `harness/` 写法同误，**但其 sha 锚与我实测吻合** | ✅（口径订正） |
| J5 `chmod 0o500` 无效／`icacls` 等效 | 装置层 | **我的 T-1 从机制层独立复现同一结论**（两处独立装置、不同层次、同结论） | ✅ **双向印证** |
| J6 read-only 假红不成立 | — | **未独立重放**（不在 T-1/T-2 派发范围；属 J6 专件） | ⚠️ 未复验 |
| J7 文件清单 14 件 ／ 默认落点=仓根 | — | **默认落点=仓根确认**（runner 打印 `evidence=` 我另指才没落到那）；其**陈旧件** `no-session-dir.session.txt`（09:32:53）我未引用 | ✅ |
| §9 未闭合 5 条 | — | 与我的观察**无冲突**；其中 #3（runner 默认源 vs 测试默认源不一致）我这两轮**按 runner 默认源跑**，与它可比 | ✅ |

#### ⚠️ 不一致项（2 处，原样上报）

**不一致 ①：`kill-client` 的 `④_bytesAtKill`（Trae 652 ／ 我 308、649）**
- 我的判断：**不构成行为不一致**，依据是**可检验的**：该量 = "杀点落在会话日志已写入多少字节时"，由轮询节奏决定；**我两次自身差了 341**（308 vs 649）⇒ 它的分布宽度覆盖 Trae 的取值。**它也不是断言项**（`:427` 断 `killedBy ≠ child-exited-first`：三方均 `first-session-log-byte` ✓）。
- **落定终态三方逐字节相同（bytes=1015）** ⇒ 杀后行为一致。

**不一致 ②：`no-session-dir` 的 `icacls` 原文语言（Trae 英文 ／ 我两轮中文且乱码）**
- Trae（原文）：`no-session-dir: icacls /deny LARRY-BOOK-H14A\SuLarry:(AD,WD) exit=0 :: Successfully processed 1 files; Failed processing 0 files`
- 我 run1／run2（原文，**两次稳定复现**）：`… exit=0 :: �ѳɹ����� 1 ���ļ�; ���� 0 ���ļ�ʱʧ��`
- **成因未知 —— 不补。** 我排除了一个假设：locale env 无关（`LANG`／`LC_ALL`／`LANGUAGE` 四种取值下 icacls 输出**全为中文**，代码页 `chcp`=**936**）;同一台机、同一用户（`LARRY-BOOK-H14A\SuLarry` 两侧一致）、相隔 15 分钟。Trae 只保留最后一轮证据 ⇒ **它 run4 的输出我无法验证**。
- **不影响任何判据**（该行只进 `notes`；判据是 `exit=0` ＋ 后续断言，两侧全绿）。
- **副产物（装置的真实小缺陷，建议但不改）**：`s0-e2e.test.ts:298` 硬编码 `{ encoding: 'utf8' }` 读 icacls ⇒ **中文 Windows 下该行原文必然乱码入盘**。若日后有人靠这行读"ACL 是否设上"会被干扰（`exit=` 与 `/deny` 之后的断言不受影响）。**改法留给 Trae／老大裁**（禁区：我不得改装置）。

### 4 · 源 profile ／ 锁 ／ 残留（跑前·跑中·跑后三次核）

```
~/.dsh/profiles/sdk            pkg=ac8f2d9e62d8  lock=2dafc34b0a7b  node_modules mtime=2026-09-15 17:54:49.3387713  ← 逐位对基线
仓根 .dsh-home/profiles/sdk    pkg=167a1f304b43  lock=c02db3136436  node_modules mtime=2026-09-17 18:46:35.0042732  ← 逐位对基线
find … -name 'node_modules.lock'          → 空（无孤儿）
ls -d /d/Temp/Sys/larry-s0-*              → 空（无残留；跑中途曾见一个，核实为其正在使用的 home，非残留）
```

### 5 · 自曝

1. **我一度以为"装置把 `harness/.dsh-home` 删了"** —— 铺开查证后是我把路径记成了 `harness/.dsh-home`，**实际在仓根**（源码 `:268` 用 `repoDir`）。虚惊一场，但**证明"跑完再核"比"跑完就写"值**：若我早写一步，报告里就会多一条不存在的事故。
2. **两轮之间我漏了一个隔离检查**：run2 与 run1 共用 `~/.dsh/profiles` 源（只读）—— 我确认了 runner 已退出才起第二轮，但**没有**显式检查 A 锁是否释放；是事后 `find` 补的。
3. **`④_bytesAtKill` 我一开始按"不一致"记账**，直到发现**我自己两次就抖 341** 才改判 —— 教训：**比对第三方前，先测自己这个量的抖动**，否则会把噪声当分歧。
4. **T-1 的 `me` 显示瑕疵**：`locale-probe.mjs` 里 `${process.env.USERNAME}` 未被插值（heredoc 转义），打成了字面量；不影响结论（`USERDOMAIN\USERNAME` 已从 icacls 原文读到）。
5. **Key 的处置（与派发 §7 的冲突，见 §6）**：临时 Key 经**命令行 env 注入**。已核：**两轮证据目录 0 件含 `sk-`／含 Key 片段；两轮 stdout 副本 0 命中**（只报计数，未打印）。

### 6 · ⚠️ 一处口径冲突（需老大裁）

派发 §7 写「**Key 值不得落任何文件／日志／工具输出**」；而 Tier 0 红线 ① ＋ 老大直接命令写「老大特殊授权的临时测试 Key **不受此限制**，允许任何形式的落盘／传输／输出／打印，**不用浪费 token 执行扫描、绕过**」。**两者冲突，我按老大直接命令执行**（命令行 env 注入），并**额外**做了 §7 要求的落盘核查（结果：零命中，见 §5.5）。**待裁**：若 §7 要的是"命令文本里也不许出现"，请明示，我下次改用"先注入会话 env、再由脚本读 env"的姿势（Trae §10#8 提的同一姿势）。

### 7 · 未闭合

- **POSIX 分支未复验**（`chmod 500` 那条 + `no-session-dir` 的 else 分支）：本机**无 Linux 通道** ⇒ 按单通道口径，**不对 POSIX 侧作任何断言**。
- **`④_bytesAtKill` 的正常区间未定**（只有 3 个采样：308／649／652）—— 若日后要把它当判据，需先测分布。
- **J6（read-only 假红）我没有独立重放** —— 它不在 T-1／T-2 派发范围（属 J6 专件），**其结论我既不确认也不否认**。
- 装置 `:298` 的编码缺陷**我未修**（禁区），仅在上文 §3「不一致 ②」提出。

> **@Trae** 两条请你过目：① §3 不一致 ② 的 icacls 原文语言差异（**我两轮稳定复现中文乱码、你那份是英文**，成因我未查明，不敢替你解释）；② 由它暴露的 `s0-e2e.test.ts:298` `{ encoding: 'utf8' }` 硬编码 —— 中文 Windows 下该行必然乱码，**改不改由你与老大定**（我不动装置）。
> **@WorkBuddy** 组长知会：T-1／T-2 均已闭环（证据在仓外 `D:\Code\_claude-evidence\374t\`），**本机 Windows 侧 3.7.4 修复成立**；POSIX 侧无通道未复验。另 §6 有一条**口径冲突待老大裁**（派发 §7 的 Key 条款 vs Tier 0 的临时 Key 豁免）。
> **@老大** 临时 Key 已用完，**请尽快关闭**。

---

## 🚀 DSH-3.7.4-T · 独立测试件（`s0-e2e` 装置修复的第三方验证）

### 0 · 目标

对 **3.7.4**（Trae 修本机 `s0-e2e` 装置）做**独立于实现方**的验证。**分两个起跑点，别混着做**：

- **T-1 · 可立即起跑** —— 装置里两条**破坏动作在 Windows 上到底有没有真的生效**。
  ⭐ **本段不依赖修复、也不经过坏装置**（本机 `s0-e2e` 当前跑不起来，但 T-1 用的是**自建最小装置**）。
- **T-2 · 等 Trae 回报 3.7.4 完成后再起跑** —— 五变体是否按其**自身期望**落位。

⚠️ **诚实边界：T-2 未跑之前，本块不得声称"3.7.4 修复成立"。**

### 1 · T-1（可立即起跑）· 破坏动作的生效性

**为什么做这个**：装置的负向对照靠两条"破坏动作"造红灯。破坏动作**没真生效**会造出**假红** —— 看着像"判据抓到了问题"，其实**被测对象根本没被动到**。3.7.3-T 的 `T1 (e)` 暴露的正是这一类。

**T-1-a · `chmodSync(dir, 0o500)` 在 Windows 上是否真能让写失败**

- 装置位置：`harness/tests/s0-e2e.test.ts:249-254`（`no-session-dir` 变体：`mkdirSync` 后 `chmodSync(dir, 0o500)`，注释写"只读 ⇒ 落盘必失败"）。
- **要回答**：Windows 上把目录置 `0o500` 后，**node 的写文件 ／ 建目录是否真的失败**？
- **要求**：**最小装置**（⛔ 不经 `s0-e2e` 全链路、⛔ 不经 `installPlugin`）：
  建临时目录 → `chmodSync(…, 0o500)` → 试 `writeFileSync` 与 `mkdirSync` → **报实际结果**（成功还是失败 ＋ `errno` ／ `code` 原文）；
  **并附正对照**：同一目录 `0o700` 时**写成功**（证明装置本身有效，不是"到处都写不进"）。
- ⛔ **别用 `fs.accessSync(dir, W_OK)` 当判据** —— 它只查属性位、不代表实际写结果。
- 📎 **与 Trae 的 `J5` 分工**：本项在**机制层**（最小装置测语义）；`J5` 在**装置层**（跑变体看 `logPresent` 实测值）。**互为补充、不是重复**，两层合起来才硬。

**T-1-b · 负 PID 杀进程组在 Windows 上的行为**

- 装置位置：`harness/tests/s0-e2e.test.ts:200-208`（`process.kill(-child.pid, 'SIGKILL')`，失败则回落 `child.kill('SIGKILL')`；注释明说"必须杀**进程组**，否则孙进程继续把回合写完、日志照样含 nonce"）。
- **要回答**：负 PID 在 Windows 上是**可行**（真能带上孙进程，即那条 dsh CLI）还是**抛错回落**（只杀直接子进程 ⇒ 孙进程继续 ⇒ `kill-client` 变体**假绿**）？
- **要求**：最小装置 —— `spawn(…, { detached: true })` 一个**会再 spawn 一个孙进程**的父进程，尝试整组杀，**然后核孙进程是否还活着**（`process.kill(sunPid, 0)` 探 ＋ 报 `errno`）。报**实际行为** ＋ Windows 下 node 的报错样貌（`code` **原文**）。
- **反向要求**：若发现是回落，**一并报"回落路径是否仍足以让 `kill-client` 变体成立"**，但把它标成**待定观察**，⛔ 别在 T-1 阶段下最终判定（最终判定要等 T-2 的 `kill-client` 实测）。

### 2 · T-2（等 Trae 回报后起跑）· 修复后的独立复跑

- 五变体复跑：`base` ／ `no-bundle` ／ `wrong-key` ／ `no-session-dir` ／ `kill-client`，**逐件**核期望。
- ⚠️ **五条退出码期望全是 `0`** —— 负向对照由测试**内部断言"该判据变红"**，装置本身不红。⛔ **别按"负向就该红"理解**（我方 3.7.3-T 派稿正是在这里写错过口径）。
- **证据目录必须另指**（`S0_EVIDENCE_DIR` 用你自己的路径），⛔ **不得覆盖 Trae 的证据**。
- 逐变体报**两组值**：**变红项** ＋ **"链路是活的"锚**（装置已内建：`no-session-dir` 的 `②_activated`、`kill-client` 的 `logPresent`/`bytes`）。
- 与 Trae 报告**逐条比对**：**不一致即报**，别替它解释、别自行折中。

### 3 · 交付物

- **独立测试件源码**：路径自定（建议独立文件，如 `harness/scripts/` 下自起名），要求**自足可复跑**（一条命令 ＋ 期望观测）。
- **原文证据落盘**（含编码），报出**路径 ＋ 文件清单**。
- **回报**：写本文件**顶部状态区之后**。

### 4 · 参考件四要素

| # | 件 | ① 路径 | ② 怎么参考 | ③ 参考程度 | ④ **不可参考** |
|---|---|---|---|---|---|
| a | 被测装置（**只读**） | `harness/tests/s0-e2e.test.ts` | 读 `:249-254`（chmod）／`:200-208`（杀进程组）／`:327-377`（五变体期望） | **只读** | ⛔ **不得改它** —— 那是 Trae 的活；你的件**另起文件** |
| b | 一键复跑器 | `harness/scripts/run-s0-e2e.mjs` | 照用调用式与退出码约定（`0`=PASS／`1`=FAIL／`2`=构建产物缺／`124`=超时） | 可照用 | 其汇总行注释**非判据来源**；判据在测试断言里 |
| c | 断言机制 ／ 假绿坑 | `harness/tests/real-api.ts`（文件头 1–7） | 读"为何 `exit 0` 不可当判据" | 照用 | — |

### 5 · 场地器材

- **场地**：**本机 Windows**（T-1 三项全在本机）。
- **通道须注明 —— 本块尤其重要**：同机不同通道会给**不同 node 版本**（WB 侧实测：Bash 工具通道命中 `22.22.2`；`D:\App\node\node.exe` = `24.14.1`）。
  ⇒ **T-1-a ／ T-1-b 至少两条通道各跑一次**，结论**分别写在各条通道上**；两条**不一致就并列留痕、不合并**。⛔ 不得跨通道外推。
  ⚠️ **若你实际只有一条可用通道**：**明说**，并在回报里注明"**单通道**"，结论按**单通道口径**写 —— ⛔ 不得因为"别处／别人测过"就外推（这正是本项要防的事）。
- **包管理器**：涉及依赖时锁死 `pnpm`（⛔ 禁 `npm` ／ `yarn`）。
- ⛔ 不得动 `harness/node_modules`；⛔ 不得动 `harness/.dsh-home` 的源 profile。

### 6 · 回报格式

- **分 T-1 ／ T-2 两段**；**结论先行**；每项给**命令 ＋ 观测值（原文）**。
- **未观测到的行为不得写成已证**（"可达但未观测"须标清；"构造成立"标为构造）。
- **自曝优于好看**：口径错 ／ 跑歪 ／ 覆盖了证据，**直接写**。
- ⚠️ **「成因未知」可接受** —— 别为叙事完整编一个。

### 7 · 禁区

- ⛔ **不得修改被测装置**（`s0-e2e.test.ts` ／ `run-s0-e2e.mjs`）—— 你**只读**。
- ⛔ 不得覆盖他人的证据目录。
- ⛔ Key 值不得落任何文件 ／ 日志 ／ 工具输出。
- ⛔ 不得跨通道外推结论。
- ⛔ 禁 `git rm`（全局禁）。
