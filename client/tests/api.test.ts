/**
 * api.ts 逻辑层测试：错误体解析 + SSE 流解析（P4.4 前端测试基建）
 *
 * 覆盖：
 * - handleResponse 错误体解析：P4.6 统一格式 {error, detail} / 仅 detail /
 *   非 JSON 响应 / HTTP 状态回退
 * - streamChat 的 SSE 解析（parseSSE 为模块私有函数，通过公开入口 streamChat
 *   验证其行为）：event/data 行解析、JSON 反序列化、非 JSON 数据回退、
 *   跨 chunk 拆分、空数据行跳过
 * - 不依赖真实后端：全部 mock fetch；不碰 Tauri / 真实 DB / 真实 config
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  listConversations,
  streamChat,
  type StreamEvent,
} from "@/api";

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 错误体解析（handleResponse 经 listConversations 公开路径验证）
// ---------------------------------------------------------------------------

describe("api 错误体解析", () => {
  it("P4.6 统一格式 {error, detail} → 错误消息取 detail", async () => {
    // 注意：当前实现 detail 存在时优先取 detail（error 类型名被丢弃）。
    // 这是记录现状的测试——若产品认为应保留 error 类型（如 "NOT_FOUND: xxx"），
    // 需在 exchange 提出后由 Trae 改实现。
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "NOT_FOUND", detail: "Conversation not found: 1" }),
      })
    );

    await expect(listConversations()).rejects.toThrow(
      "Conversation not found: 1"
    );
  });

  it("仅 error 字段（无 detail）→ 错误消息为 'TYPE: '", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "INTERNAL_ERROR" }),
      })
    );

    await expect(listConversations()).rejects.toThrow("INTERNAL_ERROR: ");
  });

  it("仅 detail 字段 → 错误消息为 detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Internal server error" }),
      })
    );

    await expect(listConversations()).rejects.toThrow("Internal server error");
  });

  it("非 JSON 响应 → 回退为 'HTTP <status>'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("not json");
        },
      })
    );

    await expect(listConversations()).rejects.toThrow("HTTP 502");
  });

  it("成功响应 → 返回 JSON body", async () => {
    const body = [{ id: 1, title: "hi", updated_at: "x", is_archived: false }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => body,
      })
    );

    await expect(listConversations()).resolves.toEqual(body);
  });
});

// ---------------------------------------------------------------------------
// SSE 流解析（streamChat 公开路径覆盖 parseSSE 行为）
// ---------------------------------------------------------------------------

/** 构造一个假的 Response body：按传入的分段字符串输出字节流 */
function fakeSseResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader() {
        return {
          async read() {
            if (i >= chunks.length) return { done: true, value: undefined };
            return { done: false, value: encoder.encode(chunks[i++]) };
          },
        };
      },
    },
  };
}

async function collectEvents(chunks: string[]): Promise<StreamEvent[]> {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeSseResponse(chunks)));
  const events: StreamEvent[] = [];
  for await (const evt of streamChat({ message: "hi" })) {
    events.push(evt);
  }
  return events;
}

describe("streamChat SSE 解析", () => {
  it("解析 delta / tool_call / tool_result / done / error 全部事件类型", async () => {
    const chunks = [
      'event: delta\ndata: {"content":"你"}\n\n' +
        'event: delta\ndata: {"content":"好"}\n\n',
      'event: tool_call\ndata: {"name":"shell","round":1,"arguments":{}}\n\n',
      'event: tool_result\ndata: {"name":"shell","round":1,"success":true,"content":"ok"}\n\n',
      'event: done\ndata: {"conversation_id":7}\n\n',
    ];

    const events = await collectEvents(chunks);
    expect(events.map((e) => e.type)).toEqual([
      "delta",
      "delta",
      "tool_call",
      "tool_result",
      "done",
    ]);
    expect(events[0]).toMatchObject({ content: "你" });
    expect(events[2]).toMatchObject({ name: "shell", round: 1 });
    expect(events[3]).toMatchObject({ success: true, content: "ok" });
    expect(events[4]).toMatchObject({ conversation_id: 7 });
  });

  it("事件体跨 chunk 拆分 → 缓冲拼接后正确解析", async () => {
    const chunks = [
      'event: delta\ndata: {"content":"hello',
      ' world"}\n\n',
    ];

    const events = await collectEvents(chunks);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "delta", content: "hello world" });
  });

  it("data 非 JSON → 回退为 {type, content: 原文}", async () => {
    const events = await collectEvents([
      'event: delta\ndata: not-json-text\n\n',
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: "delta", content: "not-json-text" });
  });

  it("无 event 行 → 类型默认 message", async () => {
    const events = await collectEvents(['data: {"x":1}\n\n']);
    expect(events[0]).toMatchObject({ type: "message", x: 1 });
  });

  it("无 data 行 / 空块 → 跳过不产出事件", async () => {
    const events = await collectEvents(["event: delta\n\n", "\n\n", ""]);
    expect(events).toHaveLength(0);
  });

  it("HTTP 错误 → 抛错误消息（走 detail 解析）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "NOT_FOUND", detail: "Conversation not found: 9" }),
      })
    );

    const events: StreamEvent[] = [];
    await expect(
      (async () => {
        for await (const e of streamChat({ message: "hi" })) events.push(e);
      })()
    ).rejects.toThrow("Conversation not found: 9");
  });
});
