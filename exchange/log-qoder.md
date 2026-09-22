# Qoder 交流区

> 本区为**活日志**：已闭环、已升格的段**直接删除**——不留指针、不留底、不进引用关系。
> 此文件派发的任务的执行结果均写于此文件（除非有明确要求新建文件或写于其他文件）
---


## 📮 在飞任务（状态区）

| 块 | 执行人 | 场地 | 状态 | 派发日 |
|---|---|---|---|---|
| **DSH-3.7.5 · `(b)`** | Qoder | CVM（Linux ／ `49.232.129.252`） | ✅ **已回报 ＋ 两条待裁已裁并执行完毕（2026-09-22）**：`(b)` 闭合 ／ acp 一并删 ／ explicit 分支退役改脚本（`ba3e42e`）｜ ⏳ **待 WB 复验**（复验结论未出前，以上均为执行方自述） | 2026-09-22 |

- **判据、边界与遗留的权威落点 = `TODO.md`「DSH-3.7.5」段**（**一处两面**）；本区只放**怎么做**。⚠️ 活日志会被随时清理 ⇒ **不要把本区当承接目标**（引用必成断链）；需回溯用 `git log -p -- exchange/log-qoder.md`。
- ⭐ **派发前已重测前提（老大点名）** ⇒ 见文末《附 · WB 2026-09-22 重测前提实录》—— **其中 2 条旧登记被推翻 ／ 暴露新缺口**（§2-P2 待裁①②）。
- ⚠️ **通用纪律（沿用 3.7.2 ／ 3.7.3 ／ 3.3 教训）**：
  1. **前提会随时间失效 ⇒ 动手前重新实测，不照抄旧前提**。
  2. **下失败判定前先验证执行通道本身**（工具层故障会伪装成被测对象故障）。
  3. **说"没有 ／ 不存在"必须附检索式与遍历范围**。
  4. **收尾必核现场**（复核 ／ 取证动作自身也会改现场）。
  5. **工具输出的"原文"不得手工改写 ／ 意译**；但**工具链自身的语言 ／ 编码差异须原样保留**，并**注明该段取自哪条通道**。

---

## DSH-3.7.5 · `(b)` CVM 012 代参照 profile 真删

### 0 · 目标（一句话）

**把 CVM 上 `~/larry-dsh-home/profiles/sdk` 这个 012 代参照 profile 从磁盘上真删掉**（先备份 → 核验 → 再删）。

**⛔ 三个结论必须显式拆开，不得混报：**

| # | 结论 | 谁负责 |
|---|---|---|
| ① | **引用者**已清（本机依赖声明 ＋ lock） | ✅ 3.7.3 已做 ⇒ **本块不重复** |
| ② | **被引用者本体**（CVM 该 profile 目录）真删 | **← 本块唯一对象** |
| ③ | **同族其它旧代载体**（同 home 的 `profiles/acp` ／ `profiles/node_modules` 共享层里的 012 分片链接）**是否一并处置** | ⏸ **待老大裁（§2-P2 待裁①）** ⇒ 本块**暂不覆盖** |

⇒ **诚实边界**：本块完成后**不得**声称「CVM 上 012 代残留已清干净」—— ③ 未裁即未做。

### 1 · 判据（逐条编号；缺任一条即未闭合）

| # | 判据 | 取什么证据（命令 ＋ 期望观测） |
|---|---|---|
| **J1** | **删除动作真发生** | `test -e /home/ubuntu/larry-dsh-home/profiles/sdk` ⇒ 返回**假**（并附 `ls -d` 的报错原文） |
| **J2** | **备份存在且内容可核** | 备份路径存在；**在备份内**读三件 `package.json` 的 `version` ⇒ 仍为 `0.1.2-rc.1`（证明删掉的确是该 012 代那棵） |
| **J3** | **边界未被越界** | ① `~/larry-dsh-home` 本身仍在；② 其 `sessions/` ／ `storages/` ／ `.anonymous-user-id` **未被改动** ⇒ 给**删前 ／ 删后**的 `stat -c '%n %s %Y'` 对照；③ **活 home `~/.dsh` 完全未被触碰** ⇒ `find ~/.dsh -newermt <动手时刻>` 应为**空** |
| **J4** | **副作用面已实核** | 删前 ／ 删后各跑**同一遍历**：`find ~/.dsh ~/harness ~/.dsh-015 ~/.dsh-015-cli -type l` 逐条 `[ -e ]` 判悬空 ⇒ 给**两次计数对照**，证明**无新增悬空** |
| **J5** | **跨代隐患解除（且如实记另一笔）** | ① 该 profile 内 `@larryagent/plugin-storage-probe` 的 `link:` 已随目录消失（附 `ls -la` 报错原文）；② ⚠️ **同时如实记录**：`~/larry-dsh-home/profiles/node_modules` 里指向 `@deepseek-ai+dsh@0.1.2-rc.1` 分片的悬空链接**是否仍在**（WB 09-22 实测 **486 条链接 ／ 97 条悬空**）—— 若未获授权处理，**照实写"仍在"**，⛔ 不得含糊成"隐患已解除" |
| **J6** | **删除方式合规** | 全程**无 `rm -rf`** ⇒ 附实际使用命令原文 |
| **J7** | **机器到期日已识** | 回报中写明到期登记 `2026-10-09` 是否仍成立；你通道读不到就写"读不到，按登记" |

**⛔ 不是判据的**：删除"省了多少空间"。WB 09-22 实测该机 `50G` ／ 用 `8.8G` ／ 余 `39G` ⇒ **删除价值不在省空间**，而在**消除旧代载体的误用风险** ⇒ 别把体积当成果。

### 2 · 判据前置

**P1 · 通道**（不通过 ⇒ 按住不动，先在交流区报告）

- 目标 `ubuntu@49.232.129.252:22`，公钥认证。
- 凭据载体 = **本机** `C:/Users/SuLarry/.ssh/id_ed25519_cvm`（私钥；**值不入稿、不入任何受版本控制的文件 ／ 日志 ／ 工具输出**）。
- ⚠️ **若你的运行环境不能直连该机 ⇒ 停下报告**，⛔ 不要自造等价通道（如绕道他机中转）。
- ⚠️ 先跑一条**必成功的对照**（`echo CONNECT_OK; hostname; date`）确认通道本身可用；**"无输出"先怀疑通道，再怀疑被测对象**。
- 你的 ssh 与 WB 的通道**可能不同** ⇒ 若路径引用出错，**先报差异**。WB 实测可用叫法：`ssh -i C:/Users/SuLarry/.ssh/id_ed25519_cvm -o BatchMode=yes ubuntu@49.232.129.252 '<cmd>'`。
  ⚠️ 经典坑：**Windows 原生 OpenSSH 不认 MSYS 风格路径**（`/c/...` ／ `~`），会报 `not accessible` ＋ `Permission denied`，**伪装成"权限拒绝"** ⇒ 改 `C:/Users/...` 即通。

**P2 · ⛔ 两条待老大裁**（**不阻塞你先跑 J1–J7**，但⛔ **不得顺手扩大范围**）

**待裁① 范围是否扩到 `profiles/acp`？**

- ⚠️ **WB 09-22 实测新发现**：`~/larry-dsh-home/profiles/acp` **同样是 012 代**（`dsh-base` ／ `dsh-acp-app` 均 `0.1.2-rc.1`，**159 MB**），而 `TODO.md` 只登记了 `profiles/sdk` 为处置对象。
- 选项 **(A)** 一并删（同性质 ／ 同 home ／ 一次清干净）／ **(B)** 严格按 09-18 裁决只删 `sdk`，`acp` 另立项。
- **WB 倾向 (A)**，但**须老大裁** ⇒ **本块先按 (B) 跑**；若执行期间老大改裁 **(A)**，以更新为准。

**待裁② `cvm-step0.sh` 的 `explicit` 分支怎么办？**

- ⚠️ **WB 09-22 实测**：`harness/scripts/cvm-probes/` 下 **6 处**出现 `larry-dsh-home` —— **5 处是注释**（4 处写明「不再作运行 home」）、**1 处是活赋值** ⇒ `cvm-step0.sh:13`：`export DSH_HOME="$HOME/larry-dsh-home"`（**仅当 `$1=explicit`**；脚本头自述该模式定位 =「**仅作负向对照器材**」）。
- ⚠️ **且该分支实测当前已失效**：该 home 的 CLI 入口 `profiles/node_modules/@deepseek-ai/dsh` 链接**已悬空**（指向已消失的 012 分片）⇒ 即「负向对照器材」这一定位**在删除之前就已不成立**（**不是删除造成的**）。
  - ⚠️ 这条 WB 只做了**链接层**判定（`[ -e ]` 为假），**没有**实跑 `bash cvm-step0.sh explicit`（需 `DEEPSEEK_API_KEY`）。⇒ 若你能**无害地**实跑一次（不落 key、只看它能否起飞），**把结果附在回报里**；跑不了就如实写"未跑"。
- 选项 **(A)** 删 profile ＋ **改脚本** ／ **(B)** 删 profile、脚本不动（接受该分支彻底失效）／ **(C)** 保留 profile 不删。
- ⇒ **本块默认 (B)**（脚本属 `harness/` 树，改动需同步回本机仓 ⇒ **超出本块范围**）⇒ ⛔ **你不得自行改 `cvm-step0.sh`**；若老大裁 (A)，另出更新。

**P3 · 备份策略**（先备份 → 核验 → 再删，照 3.7.3 同类先例）

- ⛔ **禁 `rm -rf`**。
- 推荐：**同设备内 `mv`** 到备份名（同分区重命名 = 原子 ／ 零拷贝）。
- 备份命名与落点**由你在回报中写明**（建议 `~/larry-dsh-home/profiles/sdk.bak.<YYYYMMDD-HHMM>`；亦可另选，只要**同分区**且**路径写全**）。⚠️ 若老大要求最终不留备份，那是**另一步**，不在本块。

### 3 · 交付物

| # | 物 | 落点 |
|---|---|---|
| 1 | 删除动作本身 | CVM |
| 2 | **证据包**：J1–J7 逐条的**命令 ＋ 原始输出** | CVM 上一目录（路径由你定，回报中写明）**＋** 回报正文内联关键行 |
| 3 | 回报 | **本文件（`exchange/log-qoder.md`），追加在下** |

⚠️ **证据原文不得"顺手润色"**；工具链自身的中英 ／ 编码差异**原样保留**，并**注明该段取自哪条通道**。

### 4 · 参考件四要素

| # | 件 | ① 路径 | ② 怎么参考 | ③ 参考程度 | ④ ⛔ 不可参考处 |
|---|---|---|---|---|---|
| a | **本块正文（权威）** | `TODO.md`「DSH-3.7.5」段（文件末 `##### DSH-3.7.5` 区，**09-22 时在 `:569` 起**） | 读全文 | 判据 ／ 边界 ／ 裁决依据 | 该段**体积 ／ 引用面数字系旧登记** ⇒ **以本稿 §1 与文末附录的实测为准** |
| b | **环境登记（"负向对照器材"的出处）** | `docs/production-env.md`：`:461`（该 home 无凭据）／`:514`（降级为负向对照器材、非运行 home）／`:516`（改前形态留痕：5 脚本硬钉该 home、`cvm-step0.sh` 默认 `explicit`）／`:529`（该 profile 的 deps 四件）／`:540`（⚠️ 扫代际**须按 `@deepseek-ai/dsh-*` 前缀**筛，`node-addon-system@0.1.2` 是**假命中**） | 读这几行 | 事实来源 | 该文件是**本机**视角 ⇒ **CVM 侧实况以你的实测为准** |
| c | **同类处置先例** | `TODO.md`「DSH-3.7.3」段的 CVM 副本清理记录（含 `SYNC-ANCHOR.txt` 体例） | 读 | **借流程形状**（先锚后动、留件清单） | ⛔ 别照抄其结论 —— 那是**本机 lock ／ 声明**层，与"删远端目录"不是同一动作 |
| d | **官方 ／ 社区件** | **无** | — | — | — |

⚠️ 上述行号系 09-22 WB 核过，**但你动手时先 `grep -n` 复核**（文件会变）。

### 5 · 场地器材

| 项 | 值 | 备注 |
|---|---|---|
| 机 | `ubuntu@49.232.129.252` | 公网 IP；**到期登记 `2026-10-09`** |
| 系统 | Linux `6.8.0-124-generic` x86_64（Ubuntu），`HOME=/home/ubuntu` | WB 09-22 实读 |
| node | `~/node/bin/node` = **v22.22.2** | ⚠️ 须 `export PATH="$HOME/node/bin:$PATH"`（该机**无系统 node**、无 `sqlite3` CLI）。**版本取自 WB 的 ssh(Bash) 通道** ⇒ **以你通道实测为准，对不上先报差异再动手** |
| pnpm | `11.7.0`（`SYNC-ANCHOR.txt` 自报，09-17） | 本块**不需要**跑 install ⇒ 仅供辨识 |
| **验靶通道** | ⚠️ **本块是"删目录"，没有零副作用的预览手段** ⇒ **只能实动**（先备份再删即是安全垫） | — |
| ⛔ **假绿坑 1** | `dsh --dump-config` 会**幂等重写** `profiles/<name>/cordis.yml` ⇒ **任何"看 mtime 判有无被动过"的判据会被它污染**（该目录里正有一个 `cordis.yml`）⇒ **本块别用 dump** | — |
| ⛔ **假绿坑 2** | `du` **跨参数调用会去重 hardlink** ⇒ 同一目录在不同命令里**读数不同**（WB 实测同一路径先后读到 `189M` ／ `84M` ／ `153M`）⇒ **体积一律单路径单命令测**：`du -sb --count-links <一个路径>` | 若报体积**必须用这条口径** |
| ⛔ **假绿坑 3** | `ls -la` 里目录的 `size` **恒为 `4096`** ⇒ 不代表内容大小；判"有没有留下东西"用 `test -e <path>` 或 `find <path>` 的**行数** | — |
| **别搞混** | 本机 `~/.dsh/profiles/sdk` 是 **015 代**（`0.1.5-rc.2`）、**158 MB** ⇒ ⛔ **两个同名 `profiles/sdk` 别混淆；别碰 `~/.dsh` 下那个** | WB 09-22 实读 |

### 6 · 回报格式

1. **结论先行**：一句话 —— `(b)` 是否闭合。
2. **逐条**：J1–J7，每条 = **命令 ＋ 原始输出 ＋ 判定**。
3. **未闭合项单列**（含 §2-P2 两条待裁的当前处置状态）。
4. **自曝（必填）**：跑歪的 ／ 判据要订正的 ／ 发现的矛盾，**直接写**。
   ⚠️ 并写明：**「成因未知」是可接受的结论，别为叙事完整编一个**。

### 7 · 禁区

1. ⛔ 禁 `rm -rf`（及任何递归强删）；禁**跨设备**移动（会退化成拷贝）。
2. ⛔ 禁碰 `~/.dsh` ／ `~/.dsh-015` ／ `~/.dsh-015-cli` ／ `~/harness` ／ `~/larry-data/larry.db`。
   ⚠️ `~/larry-data/larry.db` 是**该库唯一副本**（57,344 B）—— 另案待办（到期前回传），**本块不动它**。
3. ⛔ 禁改 `harness/` 树下任何文件（含 `cvm-step0.sh`）。
4. ⛔ 禁扩大处置范围（`profiles/acp` ／ `profiles/node_modules` ⇒ **等裁**）。
5. ⛔ 禁把**凭据值**（ssh 私钥内容、API Key）落任何文件 ／ 日志 ／ 工具输出。
6. ⛔ 禁在 `~/larry-dsh-home` 内新建任何目录 ／ 文件（**备份本身除外**）。

---

### 附 · WB 2026-09-22 重测前提实录（派发前实测，供你对账）

> ⭐ 老大点名「派发说明须含重测前提」。以下为 WB 在 `2026-09-22 09:09–09:2x (+08:00)` 经 **ssh(Bash) 通道**实测。**旧登记 ≠ 现状**，逐条对账如下。

| # | 项 | `TODO.md` 旧登记 | WB 09-22 实测 | 判定 |
|---|---|---|---|---|
| 1 | `~/larry-dsh-home/profiles/sdk` 存在 | 存在 | ✅ 存在（`ls -la` 可读） | 成立 |
| 2 | 该 profile 仍整体 012 代 | 三件全 `0.1.2-rc.1` | ✅ `dsh-base` ／ `dsh-sdk-app` ／ `dsh-storage-sqlite` **三件全 `0.1.2-rc.1`** | 成立 |
| 3 | CVM `~/harness` 已升 015 | `SYNC-ANCHOR` source-commit `917f45d…` | ✅ `harness/node_modules/@deepseek-ai/dsh` = **`0.1.5-rc.2`**；`.pnpm` 内 **012 分片已不存在**（只剩 `@deepseek-ai+dsh@0.1.5-rc.2_0351730…`） | 成立 |
| 4 | 跨代 `link:` 隐患 | deps 含 `link:/home/ubuntu/harness/packages/plugin-storage-probe` | ✅ 实为**相对**链接 `@larryagent/plugin-storage-probe -> ../../../../../harness/packages/plugin-storage-probe`（解析后同位） | 成立 |
| 5 | "无脚本仍把它当运行 home" | **待实测** | ⚠️ **部分不成立**：6 处命中 = 5 注释 ＋ **1 活赋值**（`cvm-step0.sh:13`，`explicit` 模式）；该模式**实测已失效** | ⚠️ **§2-P2 待裁②** |
| 6 | 处置边界 | 只删该 profile；`~/larry-dsh-home` 本身不动 | ⚠️ **新增事实**：同 home 的 `profiles/acp` **也是 012 代**（159 MB）；`profiles/node_modules` 共享层 **486 链接 ／ 97 悬空**（其中 **71 条**指向已消失的 `@deepseek-ai+dsh@0.1.2-rc.1` 分片） | ⚠️ **§2-P2 待裁①** |
| 7 | 机器到期 | `2026-10-09` | `df -h` 可读（`50G` ／ 用 `8.8G` ／ 余 `39G`）；到期日**读不到** ⇒ 按登记 | 沿用登记 |
| 8 | 体积 | 未登记 | `du -sb --count-links`：**`~/larry-dsh-home` 总 313 MB**（`profiles/sdk` **153** ／ `profiles/acp` **159** ／ `profiles/node_modules` **40 KB**） | 新增 |
| 9 | `larry.db` | 唯一副本，待回传 | ✅ `/home/ubuntu/larry-data/larry.db`，**57,344 B**，mtime `09-16 18:47` | 成立 |
| 10 | `harness` 树近期改动 | — | 09-20 后仅 **3 件**：`scripts/s0-e2e-destructive-actions{,-posix}.mjs`（Claude 3.7.4-T·P 交付）＋ `SYNC-ANCHOR.txt` | 无我方残渣 |

⭐ **一处时序线索（结论要收着写）**：`profiles/sdk/cordis.yml` 与 `larry-data/larry.db` 的 **mtime 完全相同**（`09-16 18:47`）⇒ 与「09-16 那天用该 profile 跑过一次」**吻合**（`--dump-config` 会重写 `cordis.yml`）。
⚠️ 但这是**时序吻合**、**不是行为实证** ⇒ ⛔ **别把它写成"该 profile 09-16 仍在被运行"的结论**。

---

## ✅ 回报 · 2026-09-22 · DSH-3.7.5 `(b)` CVM 012 代参照 profile 真删

**状态**：已回报 ｜ **执行**：Qoder
**通道**：`ssh -i C:/Users/SuLarry/.ssh/id_ed25519_cvm -o BatchMode=yes ubuntu@49.232.129.252`（**Git Bash 侧**；本块全部命令走此通道，所有原始输出均为英文 Linux locale，**无中英混排故无编码差异需保留**）
**素材**：CVM `~/qoder-evidence/375/`（**13 件**，含 `README.txt` 逐条命令清单）＋ 本机 `D:\Temp\375\`

### 0 · 结论先行

**`(b)` 闭合。** `~/larry-dsh-home/profiles/sdk`（012 代参照 profile）已从磁盘上真删 —— 手法 = **同分区 `mv`** 到 `~/larry-dsh-home/profiles/sdk.bak.20260922-0948`（`mv` 返回码 **0**，全程无 `rm -rf`）；**J1–J7 逐条成立**。

⛔ **按 §0 的诚实边界**：本块只处置了**该 profile 本体** ⇒ **不得**声称「CVM 上 012 代残留已清干净」—— ③（`profiles/acp` ＋ `profiles/node_modules` 共享层的 012 分片链接）**未裁即未做**；J5② 实测这两处**仍在**。

### 1 · 逐条判据（命令 ＋ 原始输出 ＋ 判定）

**J1 删除动作真发生** —— ✅
```
$ test -e ~/larry-dsh-home/profiles/sdk        # mv 后即时核
不存在 ✓(test -e 为假)
$ ls -d ~/larry-dsh-home/profiles/sdk
ls: cannot access '/home/ubuntu/larry-dsh-home/profiles/sdk': No such file or directory
$ test -e ~/larry-dsh-home/profiles/sdk        # 收尾再核（收尾必核现场）
不存在 ✓
```

**J2 备份存在且内容可核** —— ✅
```
$ ls -d /home/ubuntu/larry-dsh-home/profiles/sdk.bak.20260922-0948
/home/ubuntu/larry-dsh-home/profiles/sdk.bak.20260922-0948
$ grep -m1 "version" <BAK>/node_modules/@deepseek-ai/<p>/package.json
  dsh-base               version:0.1.2-rc.1
  dsh-sdk-app            version:0.1.2-rc.1
  dsh-storage-sqlite     version:0.1.2-rc.1
```
⇒ 删掉的确是该 **012 代**那棵。备份体积 `du -sb --count-links` = **161469045** B，与删前对同路径的读数**逐字节相同**（纯重命名，无拷贝损耗）。

**J3 边界未被越界** —— ✅
```
(1) $ ls -d ~/larry-dsh-home
    /home/ubuntu/larry-dsh-home
(2) $ stat -c "%n | size=%s | mtime_epoch=%Y" ~/larry-dsh-home/{sessions,storages,.anonymous-user-id}
    删前：sessions 4096/1789011189 ｜ storages 4096/1789010814 ｜ .anonymous-user-id 37/1789010814
    删后：sessions 4096/1789011189 ｜ storages 4096/1789010814 ｜ .anonymous-user-id 37/1789010814
    ⇒ size 与 mtime_epoch 逐项相同（未改动）
(3) $ find ~/.dsh -newermt "2026-09-22T09:48:03+08:00" | wc -l
    0        （期望 0 ⇒ 活 home 完全未被触碰）
```
（删前原值见证据包 `pre.txt`，删后见 `post-all.txt`。）

**J4 副作用面已实核**（四根链接遍历，逐条 `[ -e ]` 判悬空）—— ✅
```
$ find ~/.dsh ~/harness ~/.dsh-015 ~/.dsh-015-cli -type l    # 逐条 [ -e ]
  四根均 EXISTS
  删前：链接总数=3582  悬空数=26
  删后：链接总数=3582  悬空数=26
```
⇒ **无新增悬空**（计数完全一致）。

**J5 跨代隐患解除（且如实记另一笔）** —— ✅ ／ ⚠️
```
(1) $ ls -la ~/larry-dsh-home/profiles/sdk/node_modules/@larryagent/
    ls: cannot access '/home/ubuntu/larry-dsh-home/profiles/sdk/node_modules/@larryagent/': No such file or directory
    同物证：该 link 现随目录在备份内 ——
    lrwxrwxrwx 1 ubuntu ubuntu 52 Sep 10 11:29 plugin-storage-probe -> ../../../../../harness/packages/plugin-storage-probe
(2) ⚠️ 共享层如实记录（未获授权处理）：
    $ find ~/larry-dsh-home/profiles/node_modules -type l   # 逐条 [ -e ]
    删前：总=486  悬空=97        删后：总=486  悬空=97        ⇒ 【仍在】
    其中 readlink 命中 "@deepseek-ai+dsh@0.1.2-rc.1" 的链接数 = 71   （WB 记 71，一致）
```
⇒ ① 该 profile 内的 cross-代 `link:` **确已随目录消失**；② 但共享层的旧代分片链接**仍在**，**不写成"隐患已解除"**。

**J6 删除方式合规（无 `rm -rf`）** —— ✅
```
$ mv "/home/ubuntu/larry-dsh-home/profiles/sdk" "/home/ubuntu/larry-dsh-home/profiles/sdk.bak.20260922-0948"
  mv 返回码 = 0
```
本块全部动作 = 读命令（`ls`/`stat`/`find`/`test`/`readlink`/`du`/`cat`/`grep`）＋ 一次 `mv` ＋ 证据目录 `mkdir`。**无任何 `rm`，无递归删除，无跨设备移动。**

**J7 机器到期日已识** —— ⚠️ 读不到
```
$ grep -iE "expire|到期|renew" /etc/motd /etc/update-motd.d/*
（无命中）
```
⇒ **读不到，按登记 `2026-10-09`**。

### 2 · 未闭合项 ／ 两条待裁的当前处置

| 项 | 本块处置 | 实测事实（供裁） |
|---|---|---|
| **待裁① 是否扩到 `profiles/acp`** | 按 **(B)**：**只删 `sdk`，`acp` 未动** | acp 亦为 012 代：`dsh-base` = `0.1.2-rc.1` ／ `dsh-acp-app` = `0.1.2-rc.1`（与 WB 09-22 一致） |
| **待裁② `cvm-step0.sh` 的 `explicit` 分支** | 按 **(B)**：**脚本未动**；**试跑 = 未跑**（理由见 §3-3） | 链接层证据（我复核成立）：CLI 入口 `profiles/node_modules/@deepseek-ai/dsh` → `…/@deepseek-ai+dsh@0.1.2-rc.1_2129bc335fc0e569d40e1ba8cd8bc3c3/…`，**该分片已不存在 ⇒ `[ -e ]` 为假（悬空）** |
| ③ 同族其它旧代载体 | **等裁，未覆盖** | 见 J5②：共享层 486 链接 ／ 97 悬空（其中 71 条命中 012 分片） |

### 3 · 自曝（必填）

1. **我把自己的证据文件先写坏过一次（假阴性）**：写入 `bakpath.txt` 时误加了 `  DST=` 前缀 ⇒ 变量 `BAK` 取值带前缀 ⇒ 首轮 J2 打出「备份不存在(异常)」。**对象本身没事，是我的产物坏了**。已改正变量重跑；**两次输出都留在证据包里**（`post-j2j5.txt` 为无效读数、`post-j2j5b.txt` 为有效读数），不删证。
2. **我的一处计数写法不精确（会误导）**：`pre.txt` 里"其中指向已消失 `@deepseek-ai+dsh@0.1.2-rc.1` 分片的"那一行，我用 `find -L … -type l | wc -l` 计 —— **它等价于重复计了一遍悬空数（97）**，不是该分片的真实命中数。正确写法（`readlink` 逐条匹配目标）见 `post-all.txt`：**71 条**（与 WB 记的 71 一致）。
3. **P2② 的"无害试跑"我判定为不可做 ⇒ 未跑**（不是懒得跑，是有依据不做）：`dsh-prompt.mjs` 经官方 SDK 启动，SDK 会**从 `~/harness/node_modules` 解析 dsh（015）**，而 `DSH_HOME` 指向 012 的 home ⇒ 造出**跨代组合**；本项目 3.0.3 已实证该组合会触发 profile 层 heal／装载失败，而 **heal 可能写盘到 `~/larry-dsh-home/profiles/sdk`** —— 那正是本块要备份的物证（J2 要证明"删掉的确是该 012 代那棵"）⇒ **风险是污染物证**。另：不带 key 跑**无法隔离**"链接层失效"与"缺凭据"（要走完 boot 才看得到凭据判定），带 key 跑则违反禁区 5。⇒ 改用**链接层证据**（已复核成立）支撑「该分支在删除之前就已失效」，**不依赖实跑**。
4. **一处时序线索我不当结论**：复核确认 `profiles/sdk/cordis.yml` 与 `larry-data/larry.db` 的 mtime **均为 `09-16 18:47`**。但这是**时序吻合**、**不是行为实证** ⇒ 不写成"该 profile 09-16 仍在被运行"。（该文件现已随目录进入备份。）
5. **成因未知项**：本块**未见成因未知的异常**（J3③ 命中 0、J4 无新增悬空、J5② 前后一致）。唯一"读不到"的是 J7 到期日 —— **读不到，按登记**（不编成因）。

### 4 · 现场（收尾必核）

- 原路径：`test -e ~/larry-dsh-home/profiles/sdk` → **假**；`ls -d` → `No such file or directory`
- `~/larry-dsh-home/profiles/` = `acp` ／ `node_modules` ／ **`sdk.bak.20260922-0948`**
- `~/larry-dsh-home` 顶层四项**均在**；`sessions` ／ `storages` ／ `.anonymous-user-id` 的 size 与 mtime_epoch 删前删后**逐项相同**
- 证据包：CVM `~/qoder-evidence/375/`（13 件：`README.txt`（命令清单）／`p1-channel.txt`／`p2-premises.txt`／`p3-step0-read.txt`／`p3b-promptmjs.txt`／`pre.txt`／`mv.txt`／`post-j2j5.txt`／`post-j2j5b.txt`／`post-all.txt`／`anchor.txt`／`anchor_iso.txt`／`bakpath.txt`）

### 5 · 前提对账（对 WB 09-22 附录 10 条）

| # | WB 记 | 我实测 | 对账 |
|---|---|---|---|
| 1 | sdk 存在 | ✅ 存在 | 成立 |
| 2 | 三件全 012 | ✅ 三件全 `0.1.2-rc.1` | 成立 |
| 3 | acp 亦 012 | ✅ `dsh-base`／`dsh-acp-app` 均 `0.1.2-rc.1` | 成立 |
| 4 | 共享层 486／97（71 条命中 012 分片） | ✅ 486／97；**71** | 成立（**注：WB 的 486/97 与我重算一致；但我首轮的"命中数"写法不精确，见 §3-2**） |
| 5 | node v22.22.2 | ✅ `v22.22.2` | 成立 |
| 6 | df 50G/8.8G/39G | ✅ `/dev/vda2 50G 8.8G 39G 19% /` | 成立 |
| 7 | `larry.db` 57,344 B | 未动、未核（禁区 2） | 按登记 |
| 8 | sdk 体积 153 MB | ✅ **161469045 B**（`du -sb --count-links` 单路径单命令口径） | 成立（读数口径不同） |
| 9 | CLI 入口链接悬空 | ✅ 复核成立（readlink 指向已消失分片） | 成立 |
| 10 | 到期日 2026-10-09 | 读不到 | 按登记 |

**⚠️ 一处与你对账方式不同、我如实标出**：W-4 的"71 条"你在**链路层**给出，我首轮用 `find -L` 复算得到 97（**方法错**），改用 `readlink` 逐条匹配后才得到 71。**结论一致，但我的第一版方法是错的** —— 记此以免后人照抄那个写法。

### 6 · 老大裁决执行（2026-09-22 追加 · 两条待裁已裁并执行完毕）

**裁决① ＝ (A)｜`profiles/acp` 一并删 —— ✅ 已执行**

```
$ mv "/home/ubuntu/larry-dsh-home/profiles/acp" \
     "/home/ubuntu/larry-dsh-home/profiles/acp.bak.20260922-1007"      # rc=0，无 rm -rf
$ test -e ~/larry-dsh-home/profiles/acp
不存在 ✓
$ ls -d ~/larry-dsh-home/profiles/acp
ls: cannot access '/home/ubuntu/larry-dsh-home/profiles/acp': No such file or directory
$ grep -m1 "version" <BAK>/node_modules/@deepseek-ai/{dsh-base,dsh-acp-app}/package.json
  dsh-base           version:0.1.2-rc.1
  dsh-acp-app        version:0.1.2-rc.1
$ du -sb --count-links <BAK>
167075668        （与删前对同路径读数逐字节相同）
```
⚠️ 一处与 sdk 的差异（如实记）：**`acp` 内没有 `@larryagent/` 目录** ⇒ 它不存在跨代 `link:` 那一笔，处置面比 sdk 干净。

**裁决② ＝ (A)｜explicit 分支「删 profile ＋ 改脚本」—— ✅ 已执行**

- **改动文件**（本机，受版本控制）：`harness/scripts/cvm-probes/cvm-step0.sh` ⇒ **已提交 `ba3e42e`**
- **改法**：`explicit` 分支由「`export DSH_HOME="$HOME/larry-dsh-home"`」改为**显式拒绝 ＋ `exit 3`**（stderr 三行退役说明），`usage` 注释同步更新并把参数位保留。
- ⛔ **我改的时候必须防的一个坑（写进脚本注释了）**：**不得**图省事把这个分支删掉 —— 删掉后 `explicit` 会 fallthrough 到 `else → unset DSH_HOME`，**静默改在真实库 `~/.dsh` 上跑探针**，把「隔离复跑」变成「打真实库」。所以是**显式拒绝**，不是移除分支。
- **双侧同步与核验**：`scp` 到 CVM ⇒ **本机与 CVM `sha256` 逐字节一致**（`f2e15f355e6a3b32079d2e230841c5460c7f9e314f0e1f7dc198ca4afb0085ac`）；双侧 `bash -n` **RC=0**；双侧**行尾纯 LF**（CR 字节数 **0**）。
- **实测拒绝分支（不传 key，天然无害）**：
```
$ bash ~/harness/scripts/cvm-probes/cvm-step0.sh explicit
!! explicit 模式已退役（2026-09-22）：~/larry-dsh-home 的 sdk / acp profile 已删除。
!! 该 home 已不是可用运行面；负向对照器材定位随之终结。
!! 如仍需隔离复跑，请另立新的独立 home 并更新本脚本，勿复用本分支。
  EXIT=3
$ stat -c "%n %y" /tmp/step0.out /tmp/step0.err
stat: cannot statx '/tmp/step0.out': No such file or directory
stat: cannot statx '/tmp/step0.err': No such file or directory
```
⇒ **`/tmp/step0.*` 仍不存在** = 拒绝发生在**任何探针动作之前**（这条也顺带把 §2-P2 待裁② 原本要求的"能否起飞"从"不可做"变成"已有可验的确定性结论"）。

**本轮（acp ＋ 脚本）判据对照**

| 项 | 删前（本轮锚 `2026-09-22T10:07:28+08:00`） | 删后 | 判定 |
|---|---|---|---|
| J3① `~/larry-dsh-home` | 在 | **在** | ✅ |
| J3② `sessions`／`storages`／`.anonymous-user-id` | 4096/1789011189 ｜ 4096/1789010814 ｜ 37/1789010814 | **逐项相同** | ✅ |
| J3③ `find ~/.dsh -newermt 锚` | — | **0** | ✅ |
| J4 四根链接遍历 | 3582 ／ 悬空 26 | **3582 ／ 26** | ✅ 无新增 |
| J5② 共享层 | 486 ／ 悬空 97（命中 012 分片 71） | **486 ／ 97 ／ 71** | ⚠️ **仍在（未授权处理）** |
| 现场 `profiles/` | — | `acp.bak.20260922-1007` ／ `node_modules` ／ `sdk.bak.20260922-0948` | ✅ |

**未被授权的仍在项（不当作已清）**：`profiles/node_modules` 共享层的 **486 链接 ／ 97 悬空**（其中 **71 条**命中已消失的 `@deepseek-ai+dsh@0.1.2-rc.1` 分片）—— 老大本次只裁了 `acp`，故**未动**，如实登记在案。

**新增自曝（本轮）**：我那条**行尾检查写错过一次** —— 用了 `$"\r"`（gettext 引用，不是 CR），结果 `grep -c` 计到 31 个"匹配"，是**假读数**。改用 ANSI-C 引用 `$'\r'` ＋ 逐字节 `tr -cd '\r' | wc -c` 复核后：**双侧均为纯 LF、CR 字节数 0**（结论未变，但第一版方法是错的，记此以免后人照抄）。

**证据包已更新**：CVM `~/qoder-evidence/375/` 现 **22 件**（新增 `pre2-acp.txt`／`post-acp.txt`／`p10-script-sync.txt`／`post2-acp.txt`／`bakpath-acp.txt`／`anchor2_iso.txt`，`README.txt` 末尾追加〈追加（2026-09-22 老大裁决执行）〉段）。

@WorkBuddy @老大

---

## 2026-09-22 · 主职责巡检：文档一致性（全量过一遍 · 老大指令「过一遍你的主职责」）

**方法**：① 三区 + 根级 + 4 份 AI 约束文件的清单与体量 ② 三区 README 索引 vs 实际 ③ **脚本扫全仓本地路径引用**（40 个 md / 524 条引用；脚本 `D:\Temp\docscan\deadlink.py`，输出 `D:\Temp\docscan\out.txt`）④ 逐处看上下文定性 ⑤ 今日变更（`larry-dsh-home` 删除 ／ `cvm-step0.sh` 退役 ／ `acp` 扩围）的文档承接核查。

### 0. 一句话结论

**体系仍健康，且有一处「意外地好」**：全仓 **524 条本地路径引用**里，**真正的待修死链为 0** —— 逐处看上下文后，绝大多数"未解析"是**带声明的历史溯源**（原文写明了"文件随之删除"/"**当时**路径…已移入"）或**上游/参考件内部路径**。**要报的是另一类：写法的歧义与今日变更的承接滞后。**

### 1. 🔴 最新最硬：今日变更在 **docs 区**尚未承接（5 处）

今日（09-22）发生了三件事：`~/larry-dsh-home/profiles/{sdk,acp}` 真删、`cvm-step0.sh` 的 `explicit` 分支退役（`ba3e42e`）。**`TODO.md` 已由 WB 同步**（`:568` 已写「3.7.5 · 已回报 · 待 WB 复验」＋ `:575` 已写「含 `acp` 扩围」）✓，**但 docs 区没有跟上**：

| # | 位置 | 现文（节选） | 为何已过期 | 建议 |
|---|---|---|---|---|
| 1 | `docs/dsh/dsh-migration.md:740` | 「⚠️ **已定位的陷阱**：`harness/scripts/cvm-probes/*.sh` **全部钉** `DSH_HOME=$HOME/larry-dsh-home`… ⇒ **照抄这些脚本 = 无 key 假绿**」 | **双重失效**：① 脚本自 09-14 起改为 `${DSH_HOME:-$HOME/.dsh}`；② 今日 `explicit` 已退役为 `exit 3` ⇒ **该陷阱已不存在**，但此句用**现在时**陈述 | 加批注：〔2026-09-14 已改 `${DSH_HOME:-…}`；**2026-09-22 `explicit` 已退役（`exit 3`）⇒ 本陷阱不再成立**〕 |
| 2 | `docs/production-env.md:512` | 表行「本机 `cvm-probes/*.sh` … ✅ **2026-09-14 已改**：`export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"`（…`cvm-step0.sh` 的 `MODE` 默认值由 `explicit` 翻为 `de…」 | 只反映 **09-14** 那次改动；今日**又改了一次**（explicit → 显式拒绝） | 补 `2026-09-22` 变更 |
| 3 | `docs/production-env.md:516` | 「（改前形态留痕：…`cvm-step0.sh` 默认 `explicit` ⇒ **照抄 = 无 key 假绿**…）」 | 已自标"改前"，**框架正确**；但今日起该分支**连存在都已不是**那个形态（是 `exit 3`） | 一句批注即可：〔2026-09-22 起 `explicit` 已退役⇒照抄不再产生假绿〕 |
| 4 | `docs/production-env.md:531` | 「⇒ **凭据落在 `~/.dsh`、可运行的 profile 落在 `~/larry-dsh-home`** —— 两者被劈开。」 | **事实基础已消失**：`~/larry-dsh-home` 的 `sdk`＋`acp` 两个 profile **今日全删** ⇒ "可运行的 profile 落在该 home"**已不成立** | 加批注并指明"劈开"形态已随退役终结 |
| 5 | `docs/production-env.md:529` | 表行「`~/larry-dsh-home/profiles/sdk` \| base, sdk-app, storage-sqlite, plugin-storage-probe \| 101」 | 该 profile **今日已删** | 该表若已有"退役明细表"跟随，则**在此行加退役指向**即可（否则读者会去 `ls`） |

⚠️ 说明：**这不是"谁漏了"的追责** —— 今日变更由我执行，而**派发稿 §3 的交付物里没有"docs 承接"这一项**（只要求回报入交流区）。**我作为一致性维护者在此报出**：按项目既有形制（如 `81a47cd`「全量文档承接」），这类结构性变更应有 docs 承接。

### 2. 🟡 系统性：**上游路径与本仓库路径同名，写法无区分**（40+ 处）

`docs/dsh/` 下多份稿直接写上游仓库的路径，且**与本仓库的 `docs/` 同名**：

- `dsh-agents-md.md` **43 处**（`docs/architecture.md`、`docs/testing.md`、`packages/AGENTS.md`、`.agents/notes/…`、`snapshots/AGENTS.md`、`vendor/README.md`）
- `dsh-015-capability-mapping.md` **6 处**（`docs/subsystems/approval.md` 等 —— ⚠️ **`docs/subsystems/` 在我们仓库里不存在**，只有上游有）
- `dsh-015-notes-scan.md` 2 处；`dsh-015-upstream-inventory.md:138`；`dsh-38-a-protocol-design.md:76`；`exchange/log-trae.md:126`
- `dsh-migration.md:157/168/1069` 的 `docs/implementation-spec.md` —— 实为**社区件内部路径**（`ref/community/EvilIrving__dsh-repro/…`）

⇒ **风险**：读者（尤其 AI）会把 `docs/subsystems/approval.md` 当作本仓库文件去找，找不到；或更糟 —— 误以为"我们仓库里有子系统规格"。
⇒ **建议**（低侵入）：给上游引用加**显式前缀**，如「上游 `docs/subsystems/approval.md`（`ref/dsh-bare @ dsh-v0.1.5-rc.2`）」或统一写成 `ref/dsh-bare:docs/…`。这与既有纪律「**上游引用必须带版本号**」是同一条的延伸。

### 3. 🟢 真死链：**逐处核后为 0 条待修**

A 类扫描出 66 处"未解析"，**逐处看上下文后全部可解释**，且**没有一处是"该修而没修"**：

| 类型 | 例 | 为何不算问题 |
|---|---|---|
| **带声明的历史溯源** | `local-env.md:335/451`（"原文为 Trae 实测报告 `docs/dsh/dsh-b1-…`。2026-09-11 吸收至本节，**独立报告文件随之删除（内容等价）**"）；`TODO.md:47`（"该稿已于 `677523d` 处置（删除）"）；`dsh-migration.md:724` | **原文自己声明了文件已删** ⇒ 读者不会被误导；这正是"借会消失的地址"的**正确写法**（就地声明失效） |
| **范本写法** | `dsh-38-a-protocol-design.md:4`（"含三份评审附录的存档版本 = git `074a894`（**当时**路径 `exchange/dsh-38-a-protocol-design.md`，**已随定稿移入本区**）"） | 明确标注"**当时**路径"＋去向 ⇒ **值得当作模板推广** |
| **上游 / 参考件内部路径** | `dsh-agents-md.md` 43 处、`dsh-015-capability-mapping.md:137…`、`dsh-migration.md:157/168/1069` | 指向上游或 `ref/community/**` 内部，**不是本仓库路径**（见 §2，问题是写法歧义，不是死链） |
| **计划描述（非引用）** | `product-positioning.md:444`／`HUMAN_NOTE.md:33` 的 `mobile/index.html`；`exchange/log-trae.md:98` 的 `run-381-driver.mjs` | 说的是"**计划**：响应式 UI 或独立 `mobile/index.html`" ⇒ 描述未来产物，**不是在指现有文件** |

**但有两处值得单独点**（**已列为"已知暂缓"，故不重复上报**）：
- `docs/product-positioning.md:444` 的 `../exchange/deployment-architecture.md` —— **docs→exchange 正面引用**，属老大 2026-09-17 明示"知情但暂缓"的四条之一 ⇒ **本单不再当问题提**（记此以免后人重复计数）。位置已从 `:344` 漂到 `:444`（文件因能力树改版变长）。

### 4. ✅ 索引面：三区 README **全部与实际一致**

| 区 | 索引 vs 实际 |
|---|---|
| `docs/README.md` | 顶层 6 件 + `dsh/` 子目录**全列**，且**明示"完整索引见 `dsh/README.md`"** ⇒ 无漂移 |
| `docs/dsh/README.md` | `docs/dsh/` 实际 **10 个 md**，索引**逐条列出**（含新定稿的 `dsh-38-a-protocol-design.md`，并注明"三方评审已融合"+ 存档版 `074a894`）⇒ **本轮刚移入即已入索引**，无漂移 |
| `archive/README.md` | 3 件实际文件**全列** ⇒ 无漂移 |
| `exchange/README.md` | 7 个 log ＋ 3 个讨论稿 **全列**，与实际 11 件一致 ⇒ 无漂移 |

⚠️ 一处**口径小差**（低）：`docs/README.md:20` 定义稳定落点为「`docs/` / `archive/` / `TODO.md`」三处；`exchange/README.md:31` 写「以 `docs/` 和 `archive/` 为主」**未含 `TODO.md`**。两处说的是同一条规则，建议统一。

### 5. 📈 复报（非新问题）：`TODO.md` 体量再涨

`TODO.md` 现 **610 行 / 173,502 字符**（我 09-17 报时为 481 行 / 110,743 字符 ⇒ **字符涨 57%**）。我 09-17 的分级建议（归档已闭环块 → 散文迁出 → 并台账 → 跨块事实收单点 → 长行拆段）**未动**。**本单只复报数字，不重复论证**；是否处理仍待老大裁。

### 6. 本轮**不算问题**的（避免后人重复劳动）

- **反引号路径按"仓库根相对"书写**是全项目惯例（如 `archive/roadmap-history.md` 里写 `docs/local-env.md`、`docs/production-env.md` 里写 `backend/config.yaml`）—— **不是缺陷**：markdown 链接才按文件相对解析，反引号路径只是**散文里的路径写法**。⚠️ 但**这条惯例没有任何文档写过** ⇒ 建议在 `docs/README.md` 加一句，免得新 AI 混用两种语义。
- `.dsh-home/` ／ `~/.dsh` ／ `~/larry-dsh-home` 等**运行期 home 路径**：一律不按仓库文件解析（扫描已排除）。

### 7. 本轮方法的两处**局限**（如实声明，别过度采信）

1. **扫描脚本我调了三版**：第一版把 `package.json` 这类**泛指裸文件名**与 `~/`、`$DSH_HOME/`、盘符路径全算成"未解析"（假阳性海量）；第二版又把"只在按仓库根解析时才成立"的写法**回退掩盖**了。最终版分 A（真死链）／B（可疑写法）两类，**但判据仍是我定的启发式**，不是规范。凡结论我都**逐处看过上下文**才定级，未采信的原始输出在 `D:\Temp\docscan\out.txt`。
2. **我未做**：锚点（`#section`）级校验、`docs/` 与 `TODO.md` 的**内容级**对账（只做了抽样：今日变更承接）、`archive/` 的逐条时效核对（该区本就是锁定历史）。这些若要做，需另立一轮。

**我未改动任何文档**（职责边界；巡检结论供老大裁）。
