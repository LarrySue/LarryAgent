/**
 * J4 回归：streamChat 必须逐块 yield，不得被整包缓冲
 *
 * 判据来源：dev 上锁派发稿 J4（`exchange/log-trae.md`）——SSE 流式行为在加鉴权头后不变。
 * 做法：fetch 的假 body 第一块就给出一个完整事件、后续再给 done；断言「只读过一块」
 * 时首个事件已经产出（若实现改成先读完整个 body 再解析，本用例必挂）。
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { streamChat, type StreamEvent } from "@/api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("streamChat 流式行为（J4）", () => {
  it("首个事件在读完整个响应体之前产出", async () => {
    const encoder = new TextEncoder();
    let reads = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader() {
            return {
              async read() {
                reads += 1;
                if (reads === 1) {
                  return {
                    done: false,
                    value: encoder.encode(
                      'event: delta\ndata: {"content":"第一块"}\n\n'
                    ),
                  };
                }
                return { done: true, value: undefined };
              },
            };
          },
        },
      })
    );

    const gen = streamChat({ message: "hi" });

    const first: IteratorResult<StreamEvent> = await gen.next();
    expect(first.done).toBe(false);
    expect(first.value).toMatchObject({ type: "delta", content: "第一块" });
    // 关键断言：此时只读过 1 块 ⇒ 没有等流结束才解析
    expect(reads).toBe(1);

    const rest: IteratorResult<StreamEvent> = await gen.next();
    expect(rest.done).toBe(true);
  });
});
