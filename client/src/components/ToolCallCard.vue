<script setup lang="ts">
import { ref, computed } from "vue";
import { useAppStore } from "@/stores/app";

const props = defineProps<{
  name: string;
  round: number;
  status: "pending" | "success" | "error";
  args?: string;
  result?: string;
}>();

const appStore = useAppStore();
const expanded = ref(true);

const roleColor = computed(() => appStore.currentRoleInfo.color);

const statusColor = computed(() => {
  if (props.status === "success") return "var(--color-success)";
  if (props.status === "error") return "var(--color-error)";
  return roleColor.value;
});

const statusIcon = computed(() => {
  if (props.status === "success") return "✅";
  if (props.status === "error") return "❌";
  return "";
});

const statusLabel = computed(() => {
  if (props.status === "pending") return "执行中...";
  if (props.status === "success") return "执行成功";
  return "执行失败";
});

const parsedArgs = computed(() => {
  if (!props.args) return null;
  try {
    return JSON.parse(props.args);
  } catch {
    return props.args;
  }
});

function toggleExpand() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div class="tool-card" :class="{ collapsed: !expanded }" :style="{ '--status-color': statusColor }">
    <!-- Header -->
    <div class="tool-header" @click="toggleExpand">
      <span class="status-indicator">
        <span v-if="status === 'pending'" class="spinner"></span>
        <span v-else class="status-icon">{{ statusIcon }}</span>
      </span>
      <span class="tool-name">{{ name }}</span>
      <span class="tool-round">(轮次 {{ round }})</span>
      <span class="tool-status-label">{{ statusLabel }}</span>
      <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
    </div>

    <!-- Body -->
    <div v-if="expanded" class="tool-body">
      <!-- Args -->
      <div v-if="parsedArgs" class="tool-section">
        <div class="section-label">参数</div>
        <pre class="args-content">{{ typeof parsedArgs === 'object' ? JSON.stringify(parsedArgs, null, 2) : parsedArgs }}</pre>
      </div>

      <!-- Result -->
      <div v-if="status !== 'pending'" class="tool-section">
        <div class="section-label">结果摘要</div>
        <div class="result-content">{{ result || "(无输出)" }}</div>
      </div>

      <div v-if="status === 'pending'" class="tool-section pending">
        <div class="section-label">等待结果...</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  max-width: 85%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 3px solid var(--status-color);
  transition: border-left-color var(--duration-fast);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.status-indicator {
  display: flex;
  align-items: center;
  width: 20px;
  justify-content: center;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border-hover);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-icon {
  font-size: var(--text-sm);
}

.tool-name {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.tool-round {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.tool-status-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-left: auto;
}

.expand-icon {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.tool-body {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.tool-section.pending {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.section-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.args-content {
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 120px;
  overflow-y: auto;
}

.result-content {
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-primary);
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
