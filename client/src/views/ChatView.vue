<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import AppLayout from "@/components/AppLayout.vue";
import MessageList from "@/components/MessageList.vue";
import type { ChatMessage } from "@/components/MessageList.vue";
import ChatInput from "@/components/ChatInput.vue";
import { useAppStore } from "@/stores/app";
import { useChatStream } from "@/composables/useChatStream";
import {
  listConversations,
  getConversationMessages,
  listModels,
  type ConversationMessage,
} from "@/api";

const appStore = useAppStore();
const { isStreaming, sendMessage, stop } = useChatStream();

const messages = ref<ChatMessage[]>([]);

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toChatMessages(apiMsgs: ConversationMessage[]): ChatMessage[] {
  return apiMsgs
    .filter((m) => m.role !== "tool")
    .map((m) => ({
      id: genId(),
      role: m.role === "assistant" ? "agent" : (m.role as "user" | "agent" | "error"),
      content: m.content || "",
    }));
}

async function loadConversations() {
  try {
    const list = await listConversations({ archived: false });
    appStore.setConversations(list);
  } catch {
    // Backend might not be ready yet
  }
}

async function loadModels() {
  try {
    const models = await listModels();
    appStore.setModels(models);
  } catch {
    // Backend might not be ready yet
  }
}

async function loadConversationMessages(id: number) {
  try {
    const apiMsgs = await getConversationMessages(id);
    messages.value = toChatMessages(apiMsgs);
  } catch {
    messages.value = [];
  }
}

async function handleSend(message: string) {
  if (isStreaming.value) return;

  const userMsg: ChatMessage = {
    id: genId(),
    role: "user",
    content: message,
  };
  messages.value.push(userMsg);

  const agentMsgId = genId();
  messages.value.push({
    id: agentMsgId,
    role: "agent",
    content: "",
  });

  let agentText = "";

  try {
    await sendMessage(
      {
        message,
        conversation_id: appStore.currentConversationId || undefined,
        role: appStore.currentRole,
        model: appStore.currentModel || undefined,
      },
      (event) => {
        switch (event.type) {
          case "delta": {
            agentText += (event.content as string) || "";
            const idx = messages.value.findIndex((m) => m.id === agentMsgId);
            if (idx >= 0) {
              messages.value[idx] = {
                ...messages.value[idx],
                content: agentText,
              };
            }
            break;
          }
          case "tool_call": {
            messages.value.push({
              id: genId(),
              role: "tool",
              content: "",
              tool_name: event.name as string,
              tool_round: event.round as number,
              tool_status: "pending",
              tool_args: event.arguments as string,
            });
            break;
          }
          case "tool_result": {
            const toolName = event.name as string;
            const round = event.round as number;
            const status = event.success ? "success" : "error";
            const result = event.content as string;

            const idx = messages.value.findIndex(
              (m) =>
                m.role === "tool" &&
                m.tool_name === toolName &&
                m.tool_round === round
            );
            if (idx >= 0) {
              messages.value[idx] = {
                ...messages.value[idx],
                tool_status: status,
                tool_result: result,
              };
            }
            break;
          }
          case "done": {
            const convId = event.conversation_id as number;
            if (convId) {
              appStore.selectConversation(convId);
              loadConversations();
            }
            break;
          }
          case "error": {
            const errMsg = (event.message as string) || "Unknown error";
            messages.value.push({
              id: genId(),
              role: "error",
              content: errMsg,
            });
            break;
          }
          case "aborted": {
            messages.value.push({
              id: genId(),
              role: "error",
              content: "Generation stopped by user",
            });
            break;
          }
          default:
            break;
        }
      }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    messages.value.push({
      id: genId(),
      role: "error",
      content: errMsg,
    });
  }
}

watch(
  () => appStore.currentConversationId,
  async (id) => {
    if (id !== null) {
      await loadConversationMessages(id);
    } else {
      messages.value = [];
    }
  }
);

onMounted(async () => {
  await Promise.all([loadConversations(), loadModels()]);

  // If a conversation is already selected, load its messages
  if (appStore.currentConversationId !== null) {
    await loadConversationMessages(appStore.currentConversationId);
  }
});
</script>

<template>
  <AppLayout>
    <div class="chat-view">
      <MessageList :messages="messages" />
      <div v-if="isStreaming" class="stop-bar">
        <button class="stop-btn" @click="stop">■ 停止生成</button>
      </div>
      <ChatInput :disabled="isStreaming" @send="handleSend" />
    </div>
  </AppLayout>
</template>

<style scoped>
.chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.stop-bar {
  display: flex;
  justify-content: center;
  padding: var(--space-2);
}

.stop-btn {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  padding: var(--space-1) var(--space-4);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.stop-btn:hover {
  background: var(--color-error-bg);
  border-color: var(--color-error);
  color: var(--color-error);
}
</style>
