<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();

const models = computed(() => appStore.availableModels);
const currentModel = computed(() => appStore.currentModel);

function selectModel(e: Event) {
  const target = e.target as HTMLSelectElement;
  appStore.setModel(target.value);
}
</script>

<template>
  <div class="model-selector">
    <select
      v-if="models.length > 0"
      :value="currentModel"
      @change="selectModel"
      class="model-select"
    >
      <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
    </select>
  </div>
</template>

<style scoped>
.model-selector {
  display: flex;
  align-items: center;
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
  max-width: 200px;
}

.model-select:hover {
  border-color: var(--color-accent);
}

.model-select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-muted);
}
</style>
