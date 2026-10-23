# -*- coding: utf-8 -*-
"""扫 Claude Code 会话转录，找「报了动作完成」的句子，并列出该轮里有没有对应工具调用。

判据（可复算）：
  候选句 = assistant 文本按句切分后，命中「完成类断言」正则的句子。
  每句记录：所在会话、时间、该句之前（本轮 assistant 消息链）最近一次 tool_use 的名字。
  人工复核：句子声称的动作，能否在同一会话前文找到对应的工具调用（Write/Edit/Bash/git commit...）。

只输出摘要，不打印全文，控制上下文成本。
"""
import json, os, re, sys

ROOT = r"C:/Users/SuLarry/.claude/projects/d--Code-LarryAgent"

# 完成类断言（尽量窄）：中文完成标记 + 动作动词
CLAIM = re.compile(
    r"(已经|我已|我刚刚|刚才|已)?(把)?[^。！？\n]{0,30}?"
    r"(提交|补写|补上|补了|写入|写了|写好|写完|落到|落盘|落在|改了|改好|改完|跑了|跑完|"
    r"核过|核了|核完|验过|验了|验证过|查过|查了|建好|建了|删了|删掉|发出|发了|更新了|同步了|备份了|修复了|修好)"
    r"[^。！？\n]{0,20}?(了|好|完|过)?"
)
# 排除明显在引用文档/他人状态的词
EXCLUDE = re.compile(r"已拍|已定|已答|已收|已落定|已闭环|已登记|已归并|已回填|已被|已核（|已核清|已判|已裁")

def texts_of(msg):
    c = msg.get("content")
    out = []
    if isinstance(c, str):
        out.append(c)
    elif isinstance(c, list):
        for b in c:
            if isinstance(b, dict) and b.get("type") == "text":
                out.append(b.get("text", ""))
    return out

def tools_of(msg):
    c = msg.get("content")
    out = []
    if isinstance(c, list):
        for b in c:
            if isinstance(b, dict) and b.get("type") == "tool_use":
                inp = b.get("input") or {}
                brief = inp.get("file_path") or inp.get("command") or inp.get("pattern") or ""
                out.append((b.get("name", "?"), str(brief)[:90]))
    return out

def is_real_user_input(msg):
    """真正的用户输入：字符串，或含 text 块；tool_result 不算新一轮。"""
    c = msg.get("content")
    if isinstance(c, str):
        return True
    if isinstance(c, list):
        return any(isinstance(b, dict) and b.get("type") == "text" for b in c)
    return False

def main():
    files = sorted(
        [f for f in os.listdir(ROOT) if f.endswith(".jsonl")],
        key=lambda f: os.path.getmtime(os.path.join(ROOT, f)),
    )
    total = 0
    for fn in files:
        path = os.path.join(ROOT, fn)
        hits = []
        turn_tools = []          # 自上一条「真人输入」以来的 tool_use
        with open(path, encoding="utf-8", errors="replace") as f:
            for i, line in enumerate(f):
                try:
                    d = json.loads(line)
                except Exception:
                    continue
                t = d.get("type")
                if t == "user":
                    if is_real_user_input(d.get("message") or {}):
                        turn_tools = []
                    continue
                if t != "assistant":
                    continue
                msg = d.get("message") or {}
                tl = tools_of(msg)
                if tl:
                    turn_tools.extend(tl)
                for txt in texts_of(msg):
                    for sent in re.split(r"[。！？\n]", txt):
                        s = sent.strip()
                        if len(s) < 6 or len(s) > 160:
                            continue
                        if EXCLUDE.search(s):
                            continue
                        if CLAIM.search(s):
                            hits.append((i, d.get("timestamp", ""), s, len(turn_tools), list(turn_tools)[-3:]))
        if not hits:
            continue
        total += len(hits)
        no_tool = [h for h in hits if h[3] == 0]
        print(f"\n=== {fn}  hits={len(hits)}  其中本轮无工具={len(no_tool)} ===")
        for i, ts, s, n, tl in hits:
            tstr = (ts or "")[:19].replace("T", " ")
            tdesc = "<无>" if n == 0 else " ; ".join(f"{a}:{b}" for a, b in tl)
            print(f"[{i}] {tstr} n={n} | {s}")
            print(f"     {tdesc}")
    print(f"\nTOTAL HITS = {total}")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
