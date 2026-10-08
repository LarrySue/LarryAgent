#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
landlock_probe.py —— landlock **独立通道**探针（**重建件 v2**，2026-10-08）

## provenance（判据 P7）
- v1 原件 `D:\\Temp\\Sys\\claude-wsl-probe\\landlock_probe.py` **已丢失**：WB 2026-10-08 五处核查
  全空（Windows Temp ／ WSL `~/claude-probe/` ／ 回收站 ／ git 全历史 ／ CVM 侧）；**正文从未入过库**，
  历史里只剩一行**描述**（旧 `log-claude.md:55`）⇒ 本件是**重写**、不是恢复。
- ⛔ v1 的历史读数（「已升级为 ABI 自适应／新增 `--fs-mask` 负向开关 + `VERDICT=` 机读行／
  WSL ABI 7 回归通过」）**不用于逐字比对** —— 本件的一切读数只以本件自己的实跑输出为准。
- 本件**不依赖 DSH 的任何 addon／包／模块**（纯 python3 stdlib ＋ ctypes 直调 syscall）。
  「独立通道」是本件唯一的存在理由；照搬 DSH 自家 addon（`@deepseek-ai/node-addon-landlock-run`）
  即毁掉它。臂的**形状**参照 `harness/scripts/cvm-probes/cvm-landlock-verify.mjs`（只抄形状）。

## 它做什么
在 Linux 上直调 landlock 三个 syscall（444/445/446）：
1. **P1** ABI 探测：`landlock_create_ruleset(NULL, 0, LANDLOCK_CREATE_RULESET_VERSION)`；
2. **P5** 打印「据此 ABI 声明的 FS 掩码位」，并**逐位让内核验收**（单位掩码喂 `create_ruleset`，
   收/拒由内核回答）⇒ 「ABI 号 → 掩码位」这一步不靠本件断言，而是读数；
3. **P2** 正证：建「只授权 scratch 目录」的规则 → `restrict_self` → 读被掩码路径观测 **EACCES**；
4. **P3** `--fs-mask` 负向开关：能喂人工掩码（**显式掩码不裁剪**，喂什么测什么）；
   每次运行还会自动做一次「无效高位 ⇒ `EINVAL`」对照。

## 掩码从哪来（**自适应 ≠ 只信 ABI 号**）
默认路径：**声明掩码**（按 ABI 查表）→ **逐位验收**（内核认不认）→ **实际用的掩码** = 二者交集。
若内核拒了表里为某 ABI 声明的位 ⇒ 打印 `FS_MASK_CLAMPED=true DROPPED_BITS=…` 后按交集跑
（**响亮裁剪**：差异本身是读数，⛔ 不得静默吞掉，也⛔ 不得当成"跑绿了就没事"）。
本件初稿就栽在这：把 `IOCTL_DEV` 记成 ABI 4 ⇒ 在 CVM（ABI=4）上 `0xffff` 被 `EINVAL` 直接判 FAIL。
**表错比内核怪更常见；逐位验收就是为这类错准备的**。

## 臂（A/B 与 C/D 是「拒／许」对照；**D 臂的存在是为证明「不是全都拒」**）
A 写已授权 ／ B 写未授权 ／ C 读未授权 ／ D 读已授权 ／ E 网络外联

## ⚠️ 诚实边界（**必须与读数一起读**）
本探针**自设掩码**（只授权 scratch ⇒ 其余路径的读/写全被拒）**≠** DSH 的 profile 掩码。
DSH 的 landlock grants = `readOnly:['/']` ＋ 写白名单（`sandbox-local/src/profiles.ts:32-38`）
⇒ **读权限全开、白名单只约束写**。⇒ 本件正证**只证「内核确实在强制」**，
⛔ **不得读成「DSH 会挡住读敏感文件」**。

另：landlock 的 FS 掩码里**没有网络位**（网络是另一个字段 `handled_access_net`，ABI ≥ 5 才有）
⇒ 本件 E 臂只作**观测**（OBS），**不参与判 PASS/FAIL**。

## 退出码 ↔ `VERDICT=`（两者表达同一件事，⛔ 不得互相矛盾）
| 退出码 | `VERDICT=` | 含义 |
|---|---|---|
| 0 | `PASS` | 各臂实测**全部命中**「按掩码推出的期望」＋ 负向对照复现 `EINVAL` |
| 1 | `FAIL` | 有臂未命中期望（或负向对照没复现 `EINVAL` ⇒ 本件掩码表需复核） |
| 3 | `MASK_REJECTED` | `--fs-mask` 喂的掩码被内核拒（`EINVAL`）—— **这正是 P3 要的对照读数**，不是缺陷 |
| 4 | `ERROR` | 探针自身跑不起来（非 Linux ／ 内核无 landlock ／ syscall 号不符 ／ 子进程异常） |

## 用法
    python3 landlock_probe.py                                  # ABI 自适应 + 全臂 + 负向对照
    python3 landlock_probe.py --fs-mask 0x40000000             # 人工喂无效高位 ⇒ 期望 MASK_REJECTED
    python3 landlock_probe.py --deny-read /etc/passwd --net-target 1.1.1.1:443
    python3 landlock_probe.py --scratch-root ~/ll-scratch      # 非独占场地：scratch 放自己目录下

## 两处工程注意（都写在这儿，免得后读者以为是多余代码）
- **回收放在未受限的父进程**：landlock 的 `REMOVE_*` 是**按父目录**判的 —— 子进程受限后删不掉
  scratch 目录本身（其父目录 `/tmp` 未授权）⇒ 必须 `fork` ＋ 父进程回收，否则每跑一次留一个空目录。
- **scratch 拒绝时：只在 Linux 跑**（Windows 内核无此 LSM）：WSL ／ CVM。
"""

import argparse
import ctypes
import errno
import os
import shutil
import socket
import sys
import tempfile

PROBE_VERSION = 'rebuild-v2-2026-10-08'

# ── landlock 常量（本件自带，⛔ 不从任何 DSH 模块取） ────────────────────────────
# syscall 号：landlock 三个调用取自通用 syscall 表，x86_64 / aarch64 / riscv64 同为 444/445/446。
# 若某架构不符 ⇒ syscall 返回 ENOSYS ⇒ 走 VERDICT=ERROR 路径（可观测，不会静默走错）。
NR_CREATE_RULESET = 444
NR_ADD_RULE = 445
NR_RESTRICT_SELF = 446
LANDLOCK_CREATE_RULESET_VERSION = 1 << 0
LANDLOCK_RULE_PATH_BENEATH = 1
PR_SET_NO_NEW_PRIVS = 38
O_PATH = getattr(os, 'O_PATH', 0o10000000)  # Linux 专有；本件只在 Linux 跑
UNDEFINED_PROBE_BIT = 1 << 30               # 负向对照用：任何现存 ABI 都未定义的位

# FS 掩码位表：(名字, 位, 引入该位的 ABI)。
# ⚠️ 只写「位 ↔ ABI」的对应，⛔ 不写内核版本号（版本号本件未逐条实测，写了就是无据叙事）。
#    ABI 2/3 两格有 CVM 内核 UAPI 头注释佐证（"ABI 2"/"third version of the Landlock ABI"）；
#    ABI 4/5 两格见下方注释 —— **本表初稿把 IOCTL_DEV 记成 ABI 4，是错的**，2026-10-08 被本件的
#    逐位探针在 CVM 上抓出（喂 bit15 给 ABI=4 的内核 ⇒ EINVAL），三处证据一致：
#      ① CVM `/usr/include/linux/landlock.h`：`#define` 只到 `1ULL << 14`，且注「网络位 since ABI 4」；
#      ② 仓内 `docs/dsh/dsh-migration.md:1053`：「ABI 4 与 5 的实际差距 = LL_FS_IOCTL_DEV 一位」；
#      ③ 本件实测（`_claude-evidence/35probe/cvm/`）。
FS_BITS = (
    ('EXECUTE', 0, 1), ('WRITE_FILE', 1, 1), ('READ_FILE', 2, 1), ('READ_DIR', 3, 1),
    ('REMOVE_DIR', 4, 1), ('REMOVE_FILE', 5, 1), ('MAKE_CHAR', 6, 1), ('MAKE_DIR', 7, 1),
    ('MAKE_REG', 8, 1), ('MAKE_SOCK', 9, 1), ('MAKE_FIFO', 10, 1), ('MAKE_BLOCK', 11, 1),
    ('MAKE_SYM', 12, 1),
    ('REFER', 13, 2),
    ('TRUNCATE', 14, 3),
    ('IOCTL_DEV', 15, 5),   # ⚠️ ABI 5，不是 4（ABI 4 加的是**网络位**，在另一个字段里）
)
BIT_WRITE_FILE = 1 << 1
BIT_READ_FILE = 1 << 2

# 本表覆盖范围声明（照实写进输出，别让读数被过度解读）：
FS_MASK_TABLE_NOTE = (
    '本表覆盖 FS 位 bit 0..15（到 ABI 5）。ABI 4 的新增是**网络位**（handled_access_net，另一字段）、'
    'ABI 6 的新增是 **scope**（scoped，另一字段）⇒ 两者都**不在 FS 掩码字段内**，本件不声明、不处理；'
    'ABI >= 6 是否另有新增 FS 位，本件未观测 ⇒ 不声明、不臆测（逐位验收会照实打印内核接受与否）'
)


def declared_fs_mask(abi):
    """「据此 ABI 声明的掩码位」= 所有引入 ABI <= 该 ABI 的位之和（P5 的读数来源）。"""
    mask = 0
    for _name, bit, min_abi in FS_BITS:
        if abi >= min_abi:
            mask |= 1 << bit
    return mask


def mask_bits(abi, mask):
    """把掩码拆成可读位名（含「已声明但此 ABI 不该有」的异常位，异常位单独标出）。"""
    got, extra = [], []
    for name, bit, min_abi in FS_BITS:
        if mask & (1 << bit):
            (got if abi >= min_abi else extra).append(name if abi >= min_abi else f'{name}(ABI>={min_abi})')
    unknown = mask & ~sum(1 << b for _n, b, _a in FS_BITS)
    if unknown:
        extra.append(f'UNKNOWN_BITS={unknown:#x}')
    return ','.join(got) or '(none)', ','.join(extra)


def err_name(e):
    return errno.errorcode.get(e, str(e))


def emit(line):
    """机读行统一走这里：每行立即 flush（子进程受限后靠已开 fd 打印，不重新打开文件）。"""
    print(line, flush=True)


# ── ctypes：直调 syscall（stdlib 之外零依赖） ───────────────────────────────────
_libc = ctypes.CDLL(None, use_errno=True)
_libc.syscall.restype = ctypes.c_long
_libc.prctl.restype = ctypes.c_int


class LandlockRulesetAttr(ctypes.Structure):
    """内核 6.8+ 的完整形状（24 B）；老内核只认前 8 B ⇒ 见 _create_ruleset 的 size 回退。"""
    _fields_ = [
        ('handled_access_fs', ctypes.c_uint64),
        ('handled_access_net', ctypes.c_uint64),
        ('scoped', ctypes.c_uint64),
    ]


class LandlockPathBeneathAttr(ctypes.Structure):
    """`__attribute__((packed))` ⇒ 12 B（含 4 B 尾部填充的 16 B 会被内核拒，故 _pack_=1）。"""
    _pack_ = 1
    _fields_ = [('allowed_access', ctypes.c_uint64), ('parent_fd', ctypes.c_int32)]


def _syscall(nr, *args):
    ctypes.set_errno(0)
    rc = _libc.syscall(ctypes.c_long(nr), *args)
    return rc, ctypes.get_errno()


def create_ruleset_abi():
    """P1：返回 (abi, errno)。成功时 abi 即内核协商出的 ABI 版本号。"""
    return _syscall(NR_CREATE_RULESET, ctypes.c_void_p(0), ctypes.c_size_t(0),
                    ctypes.c_uint(LANDLOCK_CREATE_RULESET_VERSION))


def create_ruleset(mask, size=None):
    """建规则集（**不调用 restrict_self 就无副作用** ⇒ 可用来「让内核验收掩码」）。"""
    attr = LandlockRulesetAttr()
    attr.handled_access_fs = mask
    attr_size = 8 if size is None else size
    return _syscall(NR_CREATE_RULESET, ctypes.byref(attr), ctypes.c_size_t(attr_size),
                    ctypes.c_uint(0))


def add_path_beneath_rule(fd, path, allowed_access):
    parent_fd = os.open(path, O_PATH | os.O_CLOEXEC)
    try:
        attr = LandlockPathBeneathAttr()
        attr.allowed_access = allowed_access
        attr.parent_fd = parent_fd
        return _syscall(NR_ADD_RULE, ctypes.c_int(fd),
                        ctypes.c_uint(LANDLOCK_RULE_PATH_BENEATH), ctypes.byref(attr),
                        ctypes.c_uint(0))
    finally:
        os.close(parent_fd)


def restrict_self(fd):
    return _syscall(NR_RESTRICT_SELF, ctypes.c_int(fd), ctypes.c_uint(0))


def set_no_new_privs():
    return _libc.prctl(ctypes.c_int(PR_SET_NO_NEW_PRIVS), ctypes.c_int(1), ctypes.c_int(0),
                       ctypes.c_int(0), ctypes.c_int(0))


def read_nnp():
    """读 `/proc/self/status` 的 NoNewPrivs（**必须在 restrict_self 之前读**：之后 /proc 未授权）。"""
    try:
        with open('/proc/self/status', 'r') as f:
            for line in f:
                if line.startswith('NoNewPrivs:'):
                    return line.split(':', 1)[1].strip()
    except OSError as e:
        return f'unreadable({err_name(e)})'
    return 'absent'


def read_lsm_list():
    try:
        with open('/sys/kernel/security/lsm', 'r') as f:
            return f.read().strip()
    except OSError as e:
        return f'unreadable({err_name(e)})'


def try_write(path):
    try:
        with open(path, 'w') as f:
            f.write('llprobe\n')
        return 0, 0
    except OSError as e:
        return -1, e.errno


def try_read(path):
    try:
        with open(path, 'rb') as f:
            f.read(64)
        return 0, 0
    except OSError as e:
        return -1, e.errno


def net_connect(ip, port, timeout=5.0):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        return s.connect_ex((ip, port))
    finally:
        s.close()


# ── 子进程：受限沙箱内跑臂 ──────────────────────────────────────────────────────
def child_arms(scratch, deny_paths, mask_used, pre, net_ip, net_port):
    """在受限进程内跑 A–E 臂，打印机读行，返回退出码（0 全命中／1 有未命中／2 沙箱建不起来）。"""
    handled_write = bool(mask_used & BIT_WRITE_FILE)
    handled_read = bool(mask_used & BIT_READ_FILE)

    # 建规则集：size 先试 8（老内核形状）再退到完整形状 —— 两条都打印，让「哪种形状可用」成为读数
    fd, err, size_used = None, 0, None
    for size in (8, ctypes.sizeof(LandlockRulesetAttr())):
        rc, err = create_ruleset(mask_used, size)
        emit(f'RULESET_ATTR_SIZE_TRIED={size} rc={rc} errno={err}({err_name(err)})')
        if rc >= 0:
            fd, size_used = rc, size
            break
    if fd is None:
        emit(f'SANDBOX_BUILD=fail stage=create_ruleset errno={err}({err_name(err)})')
        return 2
    emit(f'RULESET_ATTR_SIZE_USED={size_used}')

    rc, err = add_path_beneath_rule(fd, scratch, mask_used)
    if rc < 0:
        os.close(fd)
        emit(f'SANDBOX_BUILD=fail stage=add_rule errno={err}({err_name(err)})')
        return 2
    emit(f'GRANT[scratch]={scratch} allowed_access={mask_used:#x}')

    rc = set_no_new_privs()
    nnp = read_nnp()
    emit(f'PR_SET_NO_NEW_PRIVS rc={rc} NoNewPrivs={nnp}')

    rc, err = restrict_self(fd)
    os.close(fd)
    if rc < 0:
        emit(f'SANDBOX_BUILD=fail stage=restrict_self errno={err}({err_name(err)})')
        return 2
    emit('SANDBOX_BUILD=ok (restrict_self 已生效；以下臂均在受限进程内)')

    matches = []

    def arm(tag, name, path, expect, actual_rc, actual_errno, counted=True):
        ok = (actual_rc == 0) if expect == 'ok' else (actual_rc < 0 and actual_errno == errno.EACCES)
        if not counted:
            ok = None
        matches.append(ok)
        emit(f'ARM={tag} name={name} path={path} expect={expect} '
             f'rc={actual_rc} errno={actual_errno}({err_name(actual_errno)}) '
             f'MATCH={"skip" if ok is None else ("yes" if ok else "no")}')

    # A 写已授权（scratch 已按 mask 授权）⇒ 期望成功
    rc, err = try_write(os.path.join(scratch, 'a_after_restrict.txt'))
    arm('A', 'write_granted', os.path.join(scratch, 'a_after_restrict.txt'), 'ok', rc, err)

    # B 写未授权（scratch 的兄弟路径，不在任何授权目录下）⇒ 期望被拒（若掩码未含 WRITE_FILE 则本就不受管）
    b_path = pre['deny_write_path']
    rc, err = try_write(b_path)
    arm('B', 'write_not_granted', b_path, 'deny' if handled_write else 'ok(unhandled)', rc, err,
        counted=handled_write)

    # C 读未授权（默认 /etc/hostname、/etc/os-release）⇒ 期望 EACCES
    for p in deny_paths:
        rc, err = try_read(p)
        counted = handled_read and pre['deny_read_ok'].get(p, False)
        arm('C', 'read_not_granted', p, 'deny' if handled_read else 'ok(unhandled)', rc, err,
            counted=counted)

    # D 读已授权 ⇒ 期望成功（证明「不是全都拒」）
    d_path = os.path.join(scratch, 'd_allowed.txt')
    rc, err = try_read(d_path)
    arm('D', 'read_granted', d_path, 'ok', rc, err)

    # E 网络外联 ⇒ 只观测（landlock FS 掩码不含网络位；且 IP 已预解析，避开「读 /etc 被拒 ⇒ DNS 失败」的假象）
    if net_ip is None:
        emit(f'ARM=E name=net_connect target={net_port} expect=OBS actual=skipped(无可用 IP) MATCH=skip')
    else:
        rc = net_connect(net_ip, net_port)
        emit(f'ARM=E name=net_connect target={net_ip}:{net_port} expect=OBS '
             f'connect_ex={rc} errno={err_name(rc) if rc else "0"} '
             f'PRE_RESTRICT_connect_ex={pre["net_pre"]} MATCH=skip')

    counted = [m for m in matches if m is not None]
    emit(f'CHILD_ARMS_MATCH={sum(1 for m in counted if m)}/{len(counted)}'
         f' (跳过 {len(matches) - len(counted)} 条不适用臂)')
    return 0 if all(counted) else 1


# ── 主流程（父进程：不受限，负责一切读写与回收） ─────────────────────────────────
def finish(verdict, reason, code):
    emit(f'VERDICT={verdict}')
    emit(f'VERDICT_REASON={reason}')
    return code


def main(argv=None):
    ap = argparse.ArgumentParser(
        description='landlock 独立通道探针（重建件 v2）—— 纯 python3 + ctypes，不依赖 DSH 任何包')
    ap.add_argument('--fs-mask', default=None,
                    help='覆盖 ABI 自适应掩码（接受 0x… / 十进制）；喂无效高位可复现 EINVAL')
    ap.add_argument('--deny-read', action='append', default=None, metavar='PATH',
                    help='C 臂的「读未授权」目标（可重复；默认 /etc/hostname 与 /etc/os-release）')
    ap.add_argument('--scratch-root', default=None,
                    help='scratch 的父目录（默认系统临时目录）；非独占场地建议放自己目录下')
    ap.add_argument('--net-target', default='223.5.5.5:443',
                    help='E 臂目标 host:port（默认阿里 DNS 的 443，数字 IP 免 DNS 读取）')
    args = ap.parse_args(argv)

    emit(f'PROBE=landlock_probe.py PROBE_VERSION={PROBE_VERSION}')
    if sys.platform != 'linux':
        return finish('ERROR', f'非 Linux 平台（sys.platform={sys.platform}）：本机内核无 landlock LSM', 4)

    deny_paths = args.deny_read or ['/etc/hostname', '/etc/os-release']
    emit(f'PLATFORM=linux HOST_KERNEL={os.uname().release} HOST_ARCH={os.uname().machine} '
         f'PYTHON={sys.version.split()[0]} UID={os.getuid()} LSM_LIST={read_lsm_list()}')

    # P1：ABI 探测
    abi, err = create_ruleset_abi()
    emit(f'ABI_PROBE_CALL=landlock_create_ruleset(NULL, 0, LANDLOCK_CREATE_RULESET_VERSION) '
         f'rc={abi} errno={err}({err_name(err)})')
    if abi < 0:
        verdict = 'ERROR' if err in (errno.ENOSYS, errno.EOPNOTSUPP, errno.EINVAL) else 'FAIL'
        return finish(verdict, f'ABI 探测失败 errno={err}({err_name(err)})：内核无 landlock 或 syscall 号不符', 4 if verdict == 'ERROR' else 1)
    emit(f'ABI={abi}')

    # P5：据此 ABI 声明的掩码位 —— 且**逐位让内核验收**（把「声明」变成「读数」：
    # 「ABI 号 → 掩码位」这一步不再靠本件断言，而是由内核逐位回答 yes/no）
    adaptive = declared_fs_mask(abi)
    requested = adaptive if args.fs_mask is None else int(args.fs_mask, 0)
    got, extra = mask_bits(abi, requested)
    emit(f'FS_MASK_DECLARED={adaptive:#x} (按 ABI={abi} 自适应)')
    emit(f'FS_MASK_BITS={got}')
    emit(f'FS_MASK_EXTRA_BITS={extra or "(none)"}')
    emit(f'FS_MASK_SOURCE={"abi-adaptive" if args.fs_mask is None else "explicit(--fs-mask)"} '
         f'FS_MASK_REQUESTED={requested:#x}')
    emit(f'FS_MASK_TABLE_NOTE={FS_MASK_TABLE_NOTE}')

    # 逐位验收：单位掩码喂 create_ruleset（**不限制自己是无副作用的**）；内核认得该位才收
    accepted_bits = 0
    for name, bit, _min_abi in FS_BITS:
        rc, err = create_ruleset(1 << bit, 8)
        ok = rc >= 0
        if ok:
            os.close(rc)
            accepted_bits |= 1 << bit
        emit(f'FS_BIT_ACCEPT[bit={bit:2d} {name}]={"yes" if ok else f"no(errno={err}({err_name(err)}))"}')
    emit(f'FS_MASK_KERNEL_ACCEPTED={accepted_bits:#x} (逐位实测：该内核认得的 FS 位)')

    # 最终掩码：显式掩码**不裁剪**（喂什么测什么）；自适应掩码按内核实际接受情况裁剪，且**必须响亮**
    clamp_dropped = 0 if args.fs_mask is not None else (requested & ~accepted_bits)
    mask_used = requested if args.fs_mask is not None else (requested & accepted_bits)
    if args.fs_mask is not None:
        emit('FS_MASK_CLAMPED=false (显式 --fs-mask：不裁剪，喂什么测什么)')
    elif clamp_dropped:
        dropped = ','.join(f'{n}(0x{1 << b:x})' for n, b, _a in FS_BITS if clamp_dropped & (1 << b))
        emit(f'FS_MASK_CLAMPED=true DROPPED_BITS={dropped} —— 内核拒了本表为 ABI={abi} 声明的位 ⇒ '
             f'本次改用**内核实际接受的位**跑；此差异本身是读数（掩码表 ／ 该内核二者需复核），⛔ 不得静默吞掉')
    else:
        emit('FS_MASK_CLAMPED=false (声明的位内核全收)')
    emit(f'FS_MASK_USED={mask_used:#x}')

    # 定稿掩码再验一次（裁剪结果理应被收，但不假设）
    rc, err = create_ruleset(mask_used, 8)
    if rc >= 0:
        os.close(rc)
        emit('FS_MASK_USED_ACCEPTED_BY_KERNEL=true (create_ruleset 未 restrict_self ⇒ 无副作用)')
    else:
        emit(f'FS_MASK_USED_ACCEPTED_BY_KERNEL=false errno={err}({err_name(err)})')
        if args.fs_mask is not None and err == errno.EINVAL:
            return finish('MASK_REJECTED',
                          f'显式掩码 {mask_used:#x} 被内核拒（EINVAL）—— P3 的对照读数', 3)
        return finish('FAIL', f'掩码 {mask_used:#x} 被内核拒 errno={err}({err_name(err)})', 1)
    if mask_used == 0:
        emit('NOTE=有效掩码为 0 ⇒ 本跑**不构成**「内核强制」正证（臂会全绿，但那是因为没什么被管）')

    # P3 负向对照：无效高位 ⇒ 期望 EINVAL
    rc, err = create_ruleset(UNDEFINED_PROBE_BIT, 8)
    if rc >= 0:
        os.close(rc)
    emit(f'NEGCONTROL_MASK={UNDEFINED_PROBE_BIT:#x} rc={rc} errno={err}({err_name(err)}) '
         f'EXPECT={err_name(errno.EINVAL)}')
    neg_ok = (rc < 0 and err == errno.EINVAL)

    # 前置对照（沙箱**之前**：同一路径本来可用 ⇒ 否则「被拒」证明不了任何事）
    pre = {'deny_read_ok': {}, 'net_pre': None}
    for p in deny_paths:
        rc, err = try_read(p)
        pre['deny_read_ok'][p] = (rc == 0)
        emit(f'PRE_READ[{p}]={"ok" if rc == 0 else f"fail({err_name(err)})"}')
    pre['deny_write_path'] = os.path.join(args.scratch_root or tempfile.gettempdir(),
                                          f'llprobe-denied-{os.getpid()}.txt')
    rc, err = try_write(pre['deny_write_path'])
    emit(f'PRE_WRITE[{pre["deny_write_path"]}]={"ok" if rc == 0 else f"fail({err_name(err)})"}')
    pre_write_ok = (rc == 0)

    net_ip = None
    host, _, port_s = args.net_target.rpartition(':')
    try:
        net_port = int(port_s)
        net_ip = socket.gethostbyname(host) if host else host
    except (OSError, ValueError) as e:
        net_port = port_s
        emit(f'NET_TARGET[{args.net_target}] resolve=fail({e})')
    if net_ip:
        pre['net_pre'] = net_connect(net_ip, net_port)
        emit(f'NET_TARGET={args.net_target} ip={net_ip} port={net_port} '
             f'PRE_RESTRICT_connect_ex={pre["net_pre"]}')

    # scratch：父进程造就，父进程回收（受限子进程删不掉 scratch 目录本身 —— REMOVE_* 按父目录判）
    scratch = os.path.realpath(tempfile.mkdtemp(prefix='llprobe-', dir=args.scratch_root))
    with open(os.path.join(scratch, 'd_allowed.txt'), 'w') as f:
        f.write('llprobe d-arm fixture\n')
    emit(f'SCRATCH={scratch}')

    sys.stdout.flush()
    pid = os.fork()
    if pid == 0:                                  # 子：受限沙箱内跑臂
        try:
            code = child_arms(scratch, deny_paths, mask_used, pre, net_ip, net_port)
        except Exception as e:                    # 子进程异常也要留痕，别静默
            emit(f'CHILD_EXCEPTION={type(e).__name__}: {e}')
            code = 2
        sys.stdout.flush()
        os._exit(code)                            # ⛔ 不走解释器关闭：关闭期可能再碰文件（受限后会报错）

    _, status = os.waitpid(pid, 0)
    child_code = os.waitstatus_to_exitcode(status)
    emit(f'CHILD_PID={pid} CHILD_EXIT={child_code}')

    removed = True
    try:                                          # 父进程未受限 ⇒ 能删干净（含 scratch 目录本身）
        shutil.rmtree(scratch)
        if os.path.exists(pre['deny_write_path']):   # B 臂本就不该写出这个文件：不在就别删
            os.unlink(pre['deny_write_path'])
    except OSError as e:
        removed = False
        emit(f'CLEANUP_ERRNO={err_name(e)}')
    emit(f'CLEANUP_REMOVED={str(removed).lower()} (scratch + 前置对照文件)')

    if child_code == 2:
        return finish('FAIL', '沙箱建不起来（见 SANDBOX_BUILD 行）—— 探针没跑到臂', 1)
    if child_code < 0:
        return finish('ERROR', f'子进程被信号终止 signal={-child_code}', 4)
    if child_code not in (0, 1):
        return finish('ERROR', f'子进程异常退出 CHILD_EXIT={child_code}', 4)
    if child_code == 1:
        return finish('FAIL', '有臂未命中期望（见 MATCH=no 行）', 1)
    if not neg_ok:
        return finish('FAIL', f'负向对照未复现 EINVAL（{UNDEFINED_PROBE_BIT:#x} 被内核接受）'
                              f'⇒ 本件掩码表需复核', 1)
    if not pre_write_ok:
        emit('NOTE=PRE_WRITE 未成功 ⇒ B 臂的「被拒」不可作为正证（该路径本就写不进）')
    return finish('PASS', '各臂实测命中「按掩码推出的期望」＋ 负向对照复现 EINVAL', 0)


if __name__ == '__main__':
    sys.exit(main())
