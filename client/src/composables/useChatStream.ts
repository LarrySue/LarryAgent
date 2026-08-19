import { ref } from "vue";
import { streamChat, type StreamEvent, type ChatRequest } from "@/api";

export function useChatStream() {
  const isStreaming = ref(false);
  const abortController = ref<AbortController | null>(null);

  function stop() {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
  }

  async function sendMessage(
    req: ChatRequest,
    onEvent: (event: StreamEvent) => void
  ): Promise<void> {
    if (isStreaming.value) {
      throw new Error("Already streaming");
    }

    const controller = new AbortController();
    abortController.value = controller;
    isStreaming.value = true;

    try {
      for await (const event of streamChat(req, controller.signal)) {
        onEvent(event);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        onEvent({ type: "aborted" });
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        onEvent({ type: "error", message: msg });
      }
    } finally {
      isStreaming.value = false;
      abortController.value = null;
    }
  }

  return {
    isStreaming,
    sendMessage,
    stop,
  };
}
