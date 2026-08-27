const API_BASE = "/api";

async function handleResponse(res: Response) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) detail = err.detail;
      else if (err.error) detail = `${err.error}: ${err.detail || ""}`;
    } catch {
      // response is not JSON
    }
    throw new Error(detail);
  }
  return res.json();
}

// === Conversation API ===

export interface Conversation {
  id: number;
  title: string;
  updated_at: string;
  is_archived: boolean;
}

export interface ConversationMessage {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name?: string;
  tool_round?: number;
  tool_args?: string;
  tool_result?: string;
  tool_call_id?: string;
  created_at: string;
}

export interface ListConversationsOptions {
  /** true=仅归档；false=仅活跃（is_archived=0）；缺省=不过滤 */
  archived?: boolean;
  /** true=仅回收站（deleted_at 非空） */
  trash?: boolean;
}

export async function listConversations(
  opts?: ListConversationsOptions
): Promise<Conversation[]> {
  const params = new URLSearchParams();
  if (opts?.archived !== undefined) params.set("archived", String(opts.archived));
  if (opts?.trash) params.set("trash", "true");
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/conversations${qs ? `?${qs}` : ""}`);
  return handleResponse(res);
}

export async function createConversation(title?: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title || "" }),
  });
  return handleResponse(res);
}

export async function renameConversation(
  id: number,
  title: string
): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return handleResponse(res);
}

export async function deleteConversation(id: number): Promise<void> {
  // 软删除：进回收站（deleted_at 置当前时间），消息保留
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// === 归档 / 回收站 API ===

export interface ArchiveExtractResult {
  conversation_id: number;
  summary: string;
  status: string;
}

/** 提取摘要：POST /api/memory/archive（生成摘要，不存储，供用户确认） */
export async function archiveConversationExtract(
  id: number
): Promise<ArchiveExtractResult> {
  const res = await fetch(`${API_BASE}/memory/archive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: id }),
  });
  return handleResponse(res);
}

export interface ConfirmArchiveRequest {
  conversation_id: number;
  summary: string;
  source_role?: string;
}

/** 确认摘要并存库：POST /api/memory/archive/confirm（写 SQLite + ChromaDB + mark_archived） */
export async function confirmArchive(
  req: ConfirmArchiveRequest
): Promise<{ memory_id: number; conversation_id: number; status: string }> {
  const res = await fetch(`${API_BASE}/memory/archive/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: req.conversation_id,
      summary: req.summary,
      source_role: req.source_role || "default",
    }),
  });
  return handleResponse(res);
}

/** 仅归档：POST /api/conversations/{id}/archive（mark_archived=1，不写记忆） */
export async function archiveSessionOnly(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}/archive`, {
    method: "POST",
  });
  return handleResponse(res);
}

/** 取消归档：POST /api/conversations/{id}/unarchive */
export async function unarchiveConversation(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}/unarchive`, {
    method: "POST",
  });
  return handleResponse(res);
}

/** 回收站列表：GET /api/conversations/trash（备用，页面延后） */
export async function listTrash(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations/trash`);
  return handleResponse(res);
}

/** 从回收站恢复：POST /api/conversations/{id}/restore（备用，页面延后） */
export async function restoreConversation(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}/restore`, {
    method: "POST",
  });
  return handleResponse(res);
}

/** 硬删除：POST /api/conversations/{id}/purge（备用，页面延后） */
export async function purgeConversation(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}/purge`, {
    method: "POST",
  });
  return handleResponse(res);
}

export async function getConversationMessages(
  id: number
): Promise<ConversationMessage[]> {
  const res = await fetch(`${API_BASE}/conversations/${id}/messages`);
  return handleResponse(res);
}

// === Models API ===

export async function listModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/models`);
  return handleResponse(res);
}

// === Chat API (SSE streaming) ===

export interface ChatRequest {
  message: string;
  conversation_id?: number;
  role?: string;
  model?: string;
}

export interface StreamEvent {
  type: string;
  [key: string]: unknown;
}

export async function* streamChat(
  req: ChatRequest,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const body: Record<string, unknown> = { message: req.message };
  if (req.conversation_id) body.conversation_id = req.conversation_id;
  if (req.role) body.role = req.role;
  if (req.model) body.model = req.model;

  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) detail = err.detail;
    } catch {
      // not JSON
    }
    throw new Error(detail);
  }

  if (!res.body) {
    throw new Error("No response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const raw of events) {
      if (!raw.trim()) continue;
      const event = parseSSE(raw);
      if (event) {
        yield event;
      }
    }
  }
}

function parseSSE(raw: string): StreamEvent | null {
  const lines = raw.split("\n");
  let eventType = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      eventType = line.slice(7).trim();
    } else if (line.startsWith("data: ")) {
      data = line.slice(6);
    }
  }

  if (!data) return null;

  try {
    const obj = JSON.parse(data);
    obj.type = eventType;
    return obj as StreamEvent;
  } catch {
    return { type: eventType, content: data } as StreamEvent;
  }
}
