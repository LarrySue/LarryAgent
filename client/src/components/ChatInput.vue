<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAppStore } from "@/stores/app";

const props = defineProps<{
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: "send", message: string): void;
}>();

const appStore = useAppStore();
const textarea = ref<HTMLTextAreaElement | null>(null);
const text = ref("");
const model = computed(() => appStore.currentModel);
const models = computed(() => appStore.availableModels);

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

function send() {
  const msg = text.value.trim();
  if (!msg || props.disabled) return;
  emit("send", msg);
  text.value = "";
  if (textarea.value) {
    textarea.value.style.height = "auto";
  }
}

function onInput() {
  if (textarea.value) {
    textarea.value.style.height = "auto";
    textarea.value.style.height = Math.min(textarea.value.scrollHeight, 120) + "px";
  }
}

function selectModel(e: Event) {
  const target = e.target as HTMLSelectElement;
  appStore.setModel(target.value);
}

watch(
  () => props.disabled,
  (val) => {
    if (val && textarea.value) {
      textarea.value.blur();
    }
  }
);
</script>

<template>
  <div class="chat-input">
    <div v-if="models.length > 0" class="model-selector">
      <select :value="model" @change="selectModel" class="model-select">
        <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
      </select>
    </div>
    <div class="input-wrapper" :class="{ disabled }">
      <textarea
        ref="textarea"
        v-model="text"
        class="input-area"
        placeholder="输入消息..."
        :disabled="disabled"
        rows="1"
        @keydown="onKeyDown"
        @input="onInput"
      ></textarea>
      <button
        class="send-btn"
        :disabled="disabled || !text.trim()"
        @click="send"
      >
        发送
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-input {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.model-selector {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.model-select {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  outline: none;
  transition: border-color var(--duration-fast);
}

.model-select:hover {
  border-color: var(--color-accent);
}

.model-select:focus {
  border-color: var(--color-accent);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  transition: all var(--duration-fast);
}

.input-wrapper:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-muted);
}

.input-wrapper.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-area {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  min-height: 24px;
  max-height: 120px;
  padding: var(--space-1) 0;
}

.input-area::placeholder {
  color: var(--color-text-muted);
}

.input-area:disabled {
  cursor: not-allowed;
}

.send-btn {
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
