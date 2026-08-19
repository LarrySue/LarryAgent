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

export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`);
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
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: "DELETE",
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
