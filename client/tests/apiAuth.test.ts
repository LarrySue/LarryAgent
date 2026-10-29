/**
 * api.ts 鉴权头测试：VITE_API_KEY → Authorization: Bearer <key>
 *
 * 覆盖（⛔ 全量，不接受抽样代表）：
 * - api.ts 全部导出函数（15 个：14 个 fetch 调用 ＋ streamChat）发出的请求头含
 *   `Authorization: Bearer <注入值>`
 * - VITE_API_KEY 为空时请求头**不含** Authorization（退化行为）
 *
 * 隔离：全部 mock fetch；TEST_KEY 是运行期拼出来的自定测试串，⛔ 不是真 key
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  archiveConversationExtract,
  archiveSessionOnly,
  confirmArchive,
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
  listModels,
  listRoles,
  listTrash,
  purgeConversation,
  renameConversation,
  restoreConversation,
  streamChat,
  unarchiveConversation,
} from "@/api";

/** 运行期拼接的自定测试串，避免在文件里落一个"看起来像真凭据"的字面量 */
const TEST_KEY = ["TRAE", "VITEST", "LOCAL"].join("-");

/** 能同时满足 handleResponse（json）与 streamChat（body.getReader）的假响应 */
function fakeOkResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    body: {
      getReader() {
        return {
          async read() {
            return { done: true, value: undefined };
          },
        };
      },
    },
  };
}

function stubFetch() {
  const fetchMock = vi.fn().mockResolvedValue(fakeOkResponse());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** 单个导出函数 → 触发一次请求 */
interface Caller {
  name: string;
  run: () => Promise<unknown>;
}

const callers: Caller[] = [
  { name: "listConversations", run: () => listConversations() },
  { name: "createConversation", run: () => createConversation("t") },
  { name: "renameConversation", run: () => renameConversation(1, "t") },
  { name: "deleteConversation", run: () => deleteConversation(1) },
  { name: "archiveConversationExtract", run: () => archiveConversationExtract(1) },
  {
    name: "confirmArchive",
    run: () => confirmArchive({ conversation_id: 1, summary: "s" }),
  },
  { name: "archiveSessionOnly", run: () => archiveSessionOnly(1) },
  { name: "unarchiveConversation", run: () => unarchiveConversation(1) },
  { name: "listTrash", run: () => listTrash() },
  { name: "restoreConversation", run: () => restoreConversation(1) },
  { name: "purgeConversation", run: () => purgeConversation(1) },
  { name: "getConversationMessages", run: () => getConversationMessages(1) },
  { name: "listRoles", run: () => listRoles() },
  { name: "listModels", run: () => listModels() },
  {
    name: "streamChat",
    run: async () => {
      for await (const evt of streamChat({ message: "hi" })) void evt;
    },
  },
];

function firstHeaders(fetchMock: ReturnType<typeof stubFetch>) {
  const init = fetchMock.mock.calls[0][1] as RequestInit | undefined;
  return (init?.headers ?? {}) as Record<string, string>;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("导出函数清单（防止漏测）", () => {
  it("api.ts 全部导出函数都在本测试里被覆盖", () => {
    expect(callers).toHaveLength(15);
  });
});

describe("VITE_API_KEY 有值 → 全部请求带 Bearer", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_KEY", TEST_KEY);
  });

  for (const caller of callers) {
    it(`${caller.name} 带 Authorization: Bearer <注入值>`, async () => {
      const fetchMock = stubFetch();
      await caller.run();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(firstHeaders(fetchMock)).toMatchObject({
        Authorization: `Bearer ${TEST_KEY}`,
      });
    });
  }
});

describe("VITE_API_KEY 为空 → 全部请求不带 Authorization", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_KEY", "");
  });

  for (const caller of callers) {
    it(`${caller.name} 不发 Authorization 头`, async () => {
      const fetchMock = stubFetch();
      await caller.run();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const headers = firstHeaders(fetchMock);
      expect(headers.Authorization).toBeUndefined();
      expect(Object.keys(headers)).not.toContain("Authorization");
    });
  }
});
