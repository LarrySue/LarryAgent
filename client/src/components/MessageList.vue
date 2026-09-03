<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { useAppStore } from "@/stores/app";
import ToolCallCard from "@/components/ToolCallCard.vue";
import BrandText from "@/components/BrandText.vue";
import logoUrl from "@/assets/logo.svg";

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "error" | "tool";
  content: string;
  tool_name?: string;
  tool_round?: number;
  tool_status?: "pending" | "success" | "error";
  tool_args?: string;
  tool_result?: string;
}

const props = defineProps<{
  messages: ChatMessage[];
}>();

const appStore = useAppStore();
const containerRef = ref<HTMLElement | null>(null);
const autoScroll = ref(true);

const roleClass = computed(() => appStore.currentRoleInfo.color);

function scrollToBottom() {
  if (autoScroll.value && containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight;
  }
}

watch(
  () => props.messages.length,
  () => {
    nextTick(scrollToBottom);
  },
  { flush: "post" }
);

function onScroll() {
  if (!containerRef.value) return;
  const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
  autoScroll.value = scrollHeight - scrollTop - clientHeight < 80;
}
</script>

<template>
  <div ref="containerRef" class="message-list" @scroll="onScroll">
    <div v-if="messages.length === 0" class="welcome">
      <img class="welcome-logo" :src="logoUrl" alt="LarryAgent logo" />
      <h2 class="welcome-title"><BrandText /></h2>
    </div>

    <template v-else>
      <template v-for="msg in messages" :key="msg.id">
        <!-- Tool call card -->
        <ToolCallCard
          v-if="msg.role === 'tool'"
          :name="msg.tool_name || 'unknown'"
          :round="msg.tool_round || 1"
          :status="msg.tool_status || 'pending'"
          :args="msg.tool_args"
          :result="msg.tool_result"
        />

        <!-- User message -->
        <div v-else-if="msg.role === 'user'" class="message-row user-row">
          <div class="message-bubble user-bubble">
            <span class="bubble-content">{{ msg.content }}</span>
          </div>
        </div>

        <!-- Agent message -->
        <div v-else-if="msg.role === 'agent'" class="message-row agent-row">
          <div class="message-bubble agent-bubble" :style="{ '--role-color': roleClass }">
            <span class="bubble-content">{{ msg.content }}</span>
          </div>
        </div>

        <!-- Error message -->
        <div v-else-if="msg.role === 'error'" class="message-row error-row">
          <div class="message-bubble error-bubble">
            <span class="bubble-content">{{ msg.content }}</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* === Welcome state === */
.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-text-secondary);
  gap: var(--space-3);
}

.welcome-logo {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-full);
  margin-bottom: var(--space-3);
}

.welcome-title {
  font-size: 40px;
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

/* === Message rows === */
.message-row {
  display: flex;
  width: 100%;
}

.user-row {
  justify-content: flex-end;
}

.agent-row {
  justify-content: flex-start;
}

.error-row {
  justify-content: flex-start;
}

/* === Message bubbles === */
.message-bubble {
  max-width: 72%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  line-height: var(--leading-relaxed);
  word-break: break-word;
  position: relative;
}

.user-bubble {
  background: var(--bubble-user-bg);
  border: 1px solid var(--bubble-user-border);
  color: var(--color-text-primary);
}

.agent-bubble {
  background: var(--bubble-agent-bg);
  border: 1px solid transparent;
  color: var(--color-text-primary);
  border-left: 3px solid var(--role-color);
}

.error-bubble {
  background: var(--bubble-error-bg);
  border: 1px solid var(--bubble-error-border);
  color: var(--color-error);
}

.bubble-content {
  font-size: var(--text-base);
  white-space: pre-wrap;
}
</style>

<style>
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: var(--color-border-hover);
  border-radius: var(--radius-full);
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
</style>
