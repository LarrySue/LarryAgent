<script setup lang="ts">
import { ref } from "vue";

export type Role = "default" | "health" | "finance";

interface RoleOption {
  key: Role;
  label: string;
  colorVar: string;
}

defineProps<{
  modelValue: Role;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: Role): void;
}>();

const roles: RoleOption[] = [
  { key: "default", label: "通用", colorVar: "var(--role-default)" },
  { key: "health", label: "健康", colorVar: "var(--role-health)" },
  { key: "finance", label: "金融", colorVar: "var(--role-finance)" },
];

const open = ref(false);

function select(role: Role) {
  emit("update:modelValue", role);
  open.value = false;
}
</script>

<template>
  <div class="role-selector" :class="{ open }">
    <button class="selector-trigger" @click="open = !open">
      <span class="role-dot" :style="{ background: roles.find(r => r.key === modelValue)?.colorVar }"></span>
      <span class="role-label">{{ roles.find(r => r.key === modelValue)?.label }}</span>
      <span class="chevron">▼</span>
    </button>
    <div v-if="open" class="dropdown" @click.stop>
      <button
        v-for="role in roles"
        :key="role.key"
        class="dropdown-item"
        :class="{ active: role.key === modelValue }"
        @click="select(role.key)"
      >
        <span class="role-dot" :style="{ background: role.colorVar }"></span>
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
