<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    ok: "后端已连接",
    down: "后端未连接",
    restarting: "后端重启中...",
    failed: "后端启动失败",
  };
  return map[appStore.connectionStatus] || "";
});

const statusClass = computed(() => ({
  ok: appStore.connectionStatus === "ok",
  warning: appStore.connectionStatus === "restarting" || appStore.connectionStatus === "failed",
  error: appStore.connectionStatus === "down",
}));

const visible = computed(() => appStore.connectionStatus !== "ok");
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="connection-toast" :class="statusClass">
      <span class="status-icon">
        <span v-if="statusClass.ok" class="dot ok"></span>
        <span v-else-if="statusClass.warning" class="dot warning"></span>
        <span v-else class="dot error"></span>
      </span>
      <span class="status-text">{{ statusLabel }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.connection-toast {
  position: fixed;
  top: var(--space-3);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.connection-toast.warning {
  border-color: var(--color-warning);
}

.connection-toast.error {
  border-color: var(--color-error);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
}

.dot.ok {
  background: var(--color-success);
}

.dot.warning {
  background: var(--color-warning);
  animation: pulse 1.5s ease-in-out infinite;
}

.dot.error {
  background: var(--color-error);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}
</style>
