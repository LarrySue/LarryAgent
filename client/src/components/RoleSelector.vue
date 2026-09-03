<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore, FALLBACK_ROLES } from "@/stores/app";
import type { RoleInfo } from "@/api";

const appStore = useAppStore();

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

// 选项来源：后端下发的角色清单（动态）；store 尚未拉取 / 兜底前用本地兜底，保证非空
const options = computed<RoleInfo[]>(() =>
  appStore.roles.length > 0 ? appStore.roles : FALLBACK_ROLES
);

// 当前选中角色的元数据；modelValue 不在清单时回退到第一项
const current = computed<RoleInfo>(() => {
  return (
    options.value.find((r) => r.key === props.modelValue) ?? options.value[0]
  );
});

const open = ref(false);

function select(role: RoleInfo) {
  emit("update:modelValue", role.key);
  open.value = false;
}
</script>

<template>
  <div class="role-selector" :class="{ open }">
    <button class="selector-trigger" @click="open = !open">
      <span class="role-dot" :style="{ background: current.color }"></span>
      <span class="role-label">{{ current.label }}</span>
      <span class="chevron">▼</span>
    </button>
    <div v-if="open" class="dropdown" @click.stop>
      <button
        v-for="role in options"
        :key="role.key"
        class="dropdown-item"
        :class="{ active: role.key === modelValue }"
        @click="select(role)"
      >
        <span class="role-dot" :style="{ background: role.color }"></span>
        <span class="role-name">{{ role.label }}</span>
        <span v-if="role.key === modelValue" class="check">✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.role-selector {
  position: relative;
}

.selector-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.selector-trigger:hover {
  background: var(--color-border-hover);
  border-color: var(--color-border-default);
}

.role-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.role-label {
  font-weight: var(--weight-medium);
}

.chevron {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  transition: transform var(--duration-fast);
}

.role-selector.open .chevron {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 140px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--space-1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--duration-fast);
}

.dropdown-item:hover {
  background: var(--sidebar-item-hover);
}

.dropdown-item.active {
  background: var(--color-accent-muted);
}

.role-name {
  flex: 1;
  text-align: left;
}

.check {
  color: var(--color-accent);
  font-weight: var(--weight-bold);
}
</style>
