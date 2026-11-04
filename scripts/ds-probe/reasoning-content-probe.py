#!/usr/bin/env python3
"""DS `reasoning_content` 回传规则实测探针（WB 派发 D-1～D-7）

目的：验「带 tools 的请求、后续不回传 reasoning_content ⇒ API 报不报错」，
以及旧名 `deepseek-reasoner` / 新名 `deepseek-flash` 两代的实际表现。

凭据纪律：只经 backend/config.py:get_config() 读取，⛔ 不打印、不落盘 key。
调用形态：裸 HTTP（urllib）直调 /chat/completions，保留原始错误体（⛔ 不经高层封装）。
成本：prompt 极小、max_tokens=64，单次 tool_call 用 mock 结果。

运行：python scripts/ds-probe/reasoning-content-probe.py
证据：_trae-evidence/ds-reasoning/<UTC后代>.json
"""

import json
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "backend"))

from config import get_config  # noqa: E402

CFG = get_config().models.get("deepseek")
if CFG is None or not CFG.api_key:
    raise SystemExit("deepseek provider 未配置（config.models.deepseek.api_key 为空）")

URL = f"{CFG.base_url.rstrip('/')}/chat/completions"
HEADERS = {"Content-Type": "application/json", "Authorization": f"Bearer {CFG.api_key}"}
EVID = REPO / "_trae-evidence" / "ds-reasoning"
EVID.mkdir(parents=True, exist_ok=True)
STAMP = datetime.now().strftime("%Y%m%dT%H%M%S")

TOOLS = [{
    "type": "function",
    "function": {
        "name": "ping",
        "description": "回显 x 参数；无副作用",
        "parameters": {
            "type": "object",
            "properties": {"x": {"type": "string", "description": "任意字符串"}},
            "required": ["x"],
        },
    },
}]

obs = []


def record(tag, detail):
    obs.append({"case": tag, "detail": detail})
    print(f"--- {tag}")
    print(json.dumps(detail, ensure_ascii=False, indent=2))


def post(payload):
    req = urllib.request.Request(
        URL, data=json.dumps(payload).encode("utf-8"), headers=HEADERS, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return {"http": resp.status, "body": json.loads(resp.read().decode("utf-8"))}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            body = json.loads(raw)
        except Exception:
            body = {"_raw": raw}
        return {"http": exc.code, "body": body}


def err_fields(resp):
    """从错误体取 error.code / error.message（有的兼容层用 code/message 平铺）"""
    body = resp.get("body") or {}
    err = body.get("error") if isinstance(body.get("error"), dict) else body
    first_line = str(err.get("message", ""))[:120] if isinstance(err, dict) else ""
    return {
        "http": resp.get("http"),
        "error_code": err.get("code") if isinstance(err, dict) else None,
        "error_message_first_line": first_line,
    }


def assistant_from(choice):
    msg = {"role": "assistant", "content": choice.get("content") or ""}
    if choice.get("tool_calls"):
        msg["tool_calls"] = choice["tool_calls"]
    return msg


def run_tool_flow(model, echo_reasoning, extra=None, prompt=None):
    """两轮：第 1 轮带 tools（auto，thinking 模式不支持强制 tool_choice）；
    第 2 轮按 echo 决定是否回传 reasoning_content。"""
    extra = extra or {}
    prompt = prompt or '必须调用 ping 工具，参数 x="1"。这是唯一允许的动作，不要直接回答。'
    msgs = [{"role": "user", "content": prompt}]
    first = post({
        "model": model,
        "messages": msgs,
        "tools": TOOLS,
        "max_tokens": 512,
        **extra,
    })
    choice = ((first.get("body") or {}).get("choices") or [{}])[0].get("message") or {}
    asst = assistant_from(choice)
    rc = choice.get("reasoning_content")
    echo_field_present = False
    if echo_reasoning and isinstance(rc, str) and rc:
        asst["reasoning_content"] = rc
        echo_field_present = True
    msgs.append(asst)
    if not asst.get("tool_calls"):
        return {
            "first": {
                "http": first.get("http"),
                "finish_reason": ((first.get("body") or {}).get("choices") or [{}])[0].get("finish_reason"),
                "has_tool_calls": False,
                "reasoning_content_present": isinstance(rc, str) and len(rc) > 0,
                "first_content": choice.get("content"),
                "error": err_fields(first) if first.get("http", 0) >= 400 else None,
            },
            "second": {"skipped": "第 1 轮未产生 tool_call，无法构造第 2 轮"},
        }
    msgs.append({
        "role": "tool",
        "tool_call_id": asst["tool_calls"][0]["id"],
        "content": '{"ok":true}',
    })
    second = post({"model": model, "messages": msgs, "max_tokens": 512, **extra})
    second_choice = ((second.get("body") or {}).get("choices") or [{}])[0]
    return {
        "first": {
            "http": first.get("http"),
            "finish_reason": ((first.get("body") or {}).get("choices") or [{}])[0].get("finish_reason"),
            "has_tool_calls": bool(choice.get("tool_calls")),
            "reasoning_content_len": len(rc) if isinstance(rc, str) else 0,
            "reasoning_content_present": isinstance(rc, str) and len(rc) > 0,
            "error": err_fields(first) if first.get("http", 0) >= 400 else None,
        },
        "echo_reasoning": echo_field_present,
        "second_request_messages": msgs,
        "second": {
            "http": second.get("http"),
            "finish_reason": second_choice.get("finish_reason"),
            "content": (second_choice.get("message") or {}).get("content"),
            "error": err_fields(second) if second.get("http", 0) >= 400 else None,
        },
    }


def run_plain_flow(model, echo_reasoning, extra=None):
    """两轮无 tools；第 2 轮按 echo 决定是否带上上一轮 reasoning_content。"""
    extra = extra or {}
    msgs = [{"role": "user", "content": "回复一个词：OK"}]
    first = post({"model": model, "messages": msgs, "max_tokens": 256, **extra})
    choice = ((first.get("body") or {}).get("choices") or [{}])[0].get("message") or {}
    asst = assistant_from(choice)
    rc = choice.get("reasoning_content")
    if echo_reasoning and isinstance(rc, str) and rc:
        asst["reasoning_content"] = rc
    msgs.append(asst)
    msgs.append({"role": "user", "content": "再回复一个词：好"})
    second = post({"model": model, "messages": msgs, "max_tokens": 256, **extra})
    second_choice = ((second.get("body") or {}).get("choices") or [{}])[0]
    return {
        "first": {
            "http": first.get("http"),
            "finish_reason": ((first.get("body") or {}).get("choices") or [{}])[0].get("finish_reason"),
            "reasoning_content_present": isinstance(rc, str) and len(rc) > 0,
            "reasoning_content_len": len(rc) if isinstance(rc, str) else 0,
            "content": choice.get("content"),
            "error": err_fields(first) if first.get("http", 0) >= 400 else None,
        },
        "second": {
            "http": second.get("http"),
            "finish_reason": second_choice.get("finish_reason"),
            "content": (second_choice.get("message") or {}).get("content"),
            "error": err_fields(second) if second.get("http", 0) >= 400 else None,
        },
    }


def main():
    # D-1 旧名是否还可用（无 tools、最小请求）
    record("D-1 deepseek-reasoner 最小请求", run_plain_flow("deepseek-reasoner", echo_reasoning=False))

    # D-2 带 tools ＋ 剥离 reasoning_content
    record("D-2 旧名 tools ＋ 不回传 reasoning", run_tool_flow("deepseek-reasoner", echo_reasoning=False))

    # D-3 带 tools ＋ 回传原值
    record("D-3 旧名 tools ＋ 回传 reasoning", run_tool_flow("deepseek-reasoner", echo_reasoning=True))

    # D-4 无 tools ＋ 传 reasoning（应被忽略、不报错）
    record("D-4 旧名 无 tools ＋ 传 reasoning", run_plain_flow("deepseek-reasoner", echo_reasoning=True))

    # D-5 新模型：thinking enabled ＋ reasoning_effort
    new_extra = {"thinking": {"type": "enabled"}, "reasoning_effort": "medium"}
    record("D-5a deepseek-flash 最小请求", run_plain_flow("deepseek-flash", echo_reasoning=False, extra=new_extra))
    record("D-5b deepseek-flash tools ＋ 不回传", run_tool_flow("deepseek-flash", echo_reasoning=False, extra=new_extra))
    record("D-5c deepseek-flash tools ＋ 回传", run_tool_flow("deepseek-flash", echo_reasoning=True, extra=new_extra))
    # D-5 补测（超出原 flash 口径）：文档允许值里的 v4-pro 也跑一遍，两代结论不合并
    record("D-5d 补测 deepseek-v4-pro tools ＋ 不回传",
           run_tool_flow("deepseek-v4-pro", echo_reasoning=False, extra=new_extra))
    record("D-5e 补测 deepseek-v4-pro tools ＋ 回传",
           run_tool_flow("deepseek-v4-pro", echo_reasoning=True, extra=new_extra))

    # D-6 错误码归一表
    table = []
    for item in obs:
        for phase in ("first", "second"):
            part = item["detail"].get(phase)
            if isinstance(part, dict) and part.get("error"):
                table.append({
                    "case": item["case"],
                    "phase": phase,
                    "http": part["error"]["http"],
                    "error_code": part["error"]["error_code"],
                    "error_message_first_line": part["error"]["error_message_first_line"],
                })
    record("D-6 错误码归一表", table)

    out = EVID / f"{STAMP}.json"
    out.write_text(json.dumps(obs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n证据：{out}")


if __name__ == "__main__":
    main()
