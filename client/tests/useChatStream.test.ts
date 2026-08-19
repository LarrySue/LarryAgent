/**
 * useChatStream 组合式函数测试（P4.4 前端测试基建）
 *
 * 覆盖：
 * - isStreaming 生命周期（开始 → 结束）
 * - 并发防护：流式进行中再次 sendMessage 抛 "Already streaming"
 * - stop()/abort → 产出 aborted 事件
 * - 流异常 → 产出 error 事件（含消息）
 * - stop() 幂等
 * 全部 mock streamChat 模块，不依赖真实后端。
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { useChatStream } from "@/composables/useChatStream";
import * as api from "@/api";
import type { StreamEvent } from "@/api";

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * mock streamChat：先 yield 一个 delta，然后挂起直到 signal abort →
 * 抛 AbortError（模拟真实 SSE 长连接被 abort 打断的行为）。
 * 用轮询检查 signal.aborted，避免 abort 事件与监听注册的竞态。
 */
function mockHangingStream() {
  vi.spyOn(api, "streamChat").mockImplementation(async function* (_req, signal) {
    yield { type: "delta", content: "a" };
    await new Promise<void>((_resolve, reject) => {
      const timer = setInterval(() => {
        if (signal?.aborted) {
          clearInterval(timer);
          reject(new DOMException("Aborted", "AbortError"));
        }
      }, 5);
    });
  });
}

describe("useChatStream", () => {
  it("流式进行中 isStreaming=true，结束后恢复 false", async () => {
    vi.spyOn(api, "streamChat").mockImplementation(async function* () {
      yield { type: "delta", content: "a" };
      yield { type: "done", conversation_id: 1 };
    });

    const stream = useChatStream();
    const events: StreamEvent[] = [];
    const p = stream.sendMessage({ message: "hi" }, (e) => events.push(e));
    expect(stream.isStreaming.value).toBe(true);
    await p;
    expect(stream.isStreaming.value).toBe(false);
    expect(events.map((e) => e.type)).toEqual(["delta", "done"]);
  });

  it("流式进行中再次发送 → 抛 Already streaming", async () => {
    mockHangingStream();

    const stream = useChatStream();
    const p = stream.sendMessage({ message: "hi" }, () => {});
    await vi.waitFor(() => expect(stream.isStreaming.value).toBe(true));

    await expect(
      stream.sendMessage({ message: "again" }, () => {})
    ).rejects.toThrow("Already streaming");

    stream.stop(); // 收尾：触发 abort 让挂起的流结束
    await p;
    expect(stream.isStreaming.value).toBe(false);
  });

  it("stop() → 产出 aborted 事件且状态复位", async () => {
    mockHangingStream();

    const stream = useChatStream();
    const events: StreamEvent[] = [];
    const p = stream.sendMessage({ message: "hi" }, (e) => events.push(e));
    await vi.waitFor(() => expect(stream.isStreaming.value).toBe(true));

    stream.stop();
    await p;

    expect(events.map((e) => e.type)).toEqual(["delta", "aborted"]);
    expect(stream.isStreaming.value).toBe(false);
  });

  it("流异常 → 产出 error 事件（含消息）", async () => {
    vi.spyOn(api, "streamChat").mockImplementation(async function* () {
      yield { type: "delta", content: "a" };
      throw new Error("network down");
    });

    const stream = useChatStream();
    const events: StreamEvent[] = [];
    await stream.sendMessage({ message: "hi" }, (e) => events.push(e));
    expect(events.at(-1)).toEqual({ type: "error", message: "network down" });
    expect(stream.isStreaming.value).toBe(false);
  });

  it("stop() 在未流式时调用不抛错（幂等）", () => {
    const stream = useChatStream();
    expect(() => stream.stop()).not.toThrow();
  });
});
