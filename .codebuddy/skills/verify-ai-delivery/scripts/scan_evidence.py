#!/usr/bin/env python3
"""复核 AI 交付证据的取证脚本（不含第三方依赖）。

子命令：
  list <dir>              列目录树：文件数 / 大小 / 行尾统计
  scan <dir>              Tier0 安全扫描：命中凭据形态串时**只报 sha/长度/字符类**，绝不回显值
  sha <串>...             算候选串的 sha256（用于与已知占位符比对）
  same <file>...          同形性判定：逐文件 sha256，全同即「同形」

设计约束（重要）：
  - scan 的输出不得包含命中串本身。任何"打印一下看看"的改动都会造成凭据泄露。
  - 判真伪的方法固定为：长度 + 字符类 + sha256 与已知占位符比对。
"""
import hashlib
import os
import re
import sys

# 常见凭据形态（可按需扩充）
PATTERNS = [
    ("sk", re.compile(rb"sk-[A-Za-z0-9_\-]{6,}")),
    ("bearer", re.compile(rb"Bearer\s+[A-Za-z0-9._\-]{10,}", re.I)),
    ("kv-secret", re.compile(rb"(?:password|passwd|secret|api[_-]?key)\s*[:=]\s*[\"']?([A-Za-z0-9._\-]{8,})", re.I)),
]
# 已知无害占位符：命中者可判安全（自行追加你项目里的）
KNOWN_PLACEHOLDERS = [
    b"sk-REDACTED",
    b"sk-probe-invalid",
]
# 每轮派发的伪造标签形如 sk-invalid-probe-<轮次>（003 / 304 …）
# ⇒ 用模式匹配，免得每轮都要手动追加一条（漏加会把 SAFE 误报成 likely fake）
KNOWN_PLACEHOLDER_PATTERNS = [
    re.compile(rb"^sk-invalid-probe-\d+$"),
]
HEXSET = set(b"0123456789abcdefABCDEF")


def _classes(body: bytes) -> list:
    cls = set()
    for ch in body:
        if 48 <= ch <= 57:
            cls.add("digit")
        elif 97 <= ch <= 122:
            cls.add("lower")
        elif 65 <= ch <= 90:
            cls.add("upper")
        elif ch == 45:
            cls.add("dash")
        elif ch == 95:
            cls.add("under")
        else:
            cls.add("OTHER:%r" % chr(ch))
    return sorted(cls)


def _verdict(tok: bytes) -> str:
    """只凭形态与哈希给判定，不泄露值。"""
    for kp in KNOWN_PLACEHOLDERS:
        if tok == kp or hashlib.sha256(tok).hexdigest() == hashlib.sha256(kp).hexdigest():
            return "SAFE(known placeholder)"
    for rx in KNOWN_PLACEHOLDER_PATTERNS:
        if rx.match(tok):
            return "SAFE(fake label pattern)"
    body = tok.split(b"-", 1)[-1] if b"-" in tok else tok
    if set(body) <= HEXSET and len(body) in (32, 40, 48, 64):
        return "!! SUSPECT(real-key shape)"
    if any(c > "f" for c in body.decode("latin-1")):
        return "likely fake (non-hex beyond a-f)"
    return "unclassified"


def cmd_list(target: str) -> None:
    total = 0
    for root, dirs, files in os.walk(target):
        rel = os.path.relpath(root, target)
        print("DIR %s | files: %d" % (rel, len(files)))
        for f in sorted(files):
            p = os.path.join(root, f)
            b = open(p, "rb").read()
            crlf = b.count(b"\r\n")
            lone = b.count(b"\n") - crlf
            print("   %-46s %9d B  CRLF=%d loneLF=%d" % (f, len(b), crlf, lone))
            total += 1
    print("TOTAL FILES: %d" % total)


def cmd_scan(target: str) -> None:
    hits = 0
    for root, dirs, files in os.walk(target):
        for f in sorted(files):
            p = os.path.join(root, f)
            try:
                b = open(p, "rb").read()
            except OSError:
                continue
            rel = os.path.relpath(p, target)
            for name, rx in PATTERNS:
                for m in rx.finditer(b):
                    tok = m.group(0)
                    body = tok.split(b"-", 1)[-1] if b"-" in tok else tok
                    print("  [%s] %-40s len=%-3d sha=%s classes=%s => %s" % (
                        name, rel, len(tok), hashlib.sha256(tok).hexdigest()[:8],
                        ",".join(_classes(body)), _verdict(tok),
                    ))
                    hits += 1
    print("HITS: %d  (若出现 SUSPECT，立即按红线流程处置；未命中则无真凭据落盘)" % hits)


def cmd_sha(args: list) -> None:
    for a in args:
        b = a.encode()
        print("  %-28s len=%-3d sha=%s" % (a[:24], len(b), hashlib.sha256(b).hexdigest()[:12]))


def cmd_same(paths: list) -> None:
    seen = {}
    for p in paths:
        b = open(p, "rb").read()
        h = hashlib.sha256(b).hexdigest()
        seen.setdefault(h, []).append((p, len(b)))
        print("  %-46s %8d B  sha=%s" % (os.path.basename(p), len(b), h[:12]))
    print("DISTINCT: %d" % len(seen))
    for h, items in seen.items():
        if len(items) > 1:
            print("  SAME GROUP (%d files) sha=%s" % (len(items), h[:12]))


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cmd, rest = sys.argv[1], sys.argv[2:]
    if cmd == "list":
        cmd_list(rest[0])
    elif cmd == "scan":
        cmd_scan(rest[0])
    elif cmd == "sha":
        cmd_sha(rest)
    elif cmd == "same":
        cmd_same(rest)
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
