<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import { useAppStore, type Role } from "@/stores/app";
import { renameConversation, listConversations } from "@/api";
import RoleSelector from "@/components/RoleSelector.vue";
import ConnectionToast from "@/components/ConnectionToast.vue";
import BrandText from "@/components/BrandText.vue";
import logoUrl from "@/assets/logo.svg";

const appStore = useAppStore();
const sidebarOpen = ref(false);

// 会话操作（三点菜单 / 重命名）
const menuOpenId = ref<number | null>(null);
const editingId = ref<number | null>(null);
const editText = ref("");
const renameInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  document.addEventListener("click", () => {
    menuOpenId.value = null;
  });
});

function toggleMenu(id: number) {
  menuOpenId.value = menuOpenId.value === id ? null : id;
}

function startRename(conv: { id: number; title: string }) {
  menuOpenId.value = null;
  editingId.value = conv.id;
  editText.value = conv.title || "";
  nextTick(() => {
    renameInput.value?.focus();
    renameInput.value?.select();
  });
}

function cancelRename() {
  editingId.value = null;
  editText.value = "";
}

async function confirmRename(id: number) {
  const title = editText.value.trim();
  editingId.value = null;
  if (!title) return; // 空输入视为取消
  try {
    await renameConversation(id, title);
    const list = await listConversations();
    appStore.setConversations(list); // 重命名后 updated_at 刷新，重新拉列表保持排序
  } catch {
    // 重命名失败暂静默，后续可加提示
  }
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function onRoleChange(role: Role) {
  appStore.setRole(role);
}

function startNewChat() {
  appStore.selectConversation(null); // 清空选中 → ChatView watch 到 null 显示欢迎页
  sidebarOpen.value = false; // 移动端收起侧栏
}
</script>

<template>
  <div class="app-layout">
    <!-- 移动端顶部栏 -->
    <header class="mobile-header">
      <button class="menu-btn" @click="toggleSidebar">☰</button>
      <span class="mobile-title"><BrandText /></span>
      <span class="role-dot" :style="{ background: `var(--role-${appStore.currentRole})` }"></span>
    </header>

    <!-- 侧栏遮罩（移动端） -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- 左侧栏 -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <div class="brand">
          <img class="sidebar-logo" :src="logoUrl" alt="LarryAgent logo" />
          <h1 class="logo"><BrandText /></h1>
        </div>
        <button class="new-chat-btn" title="新建会话" @click="startNewChat">
          <span class="new-chat-icon">＋</span>
        </button>
      </div>

      <!-- 会话列表 -->
      <div class="conversation-list">
        <div v-if="appStore.conversations.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-text">暂无会话</div>
        </div>
        <div v-else class="conversation-items">
          <div
            v-for="conv in appStore.conversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: conv.id === appStore.currentConversationId, editing: editingId === conv.id }"
            @click="appStore.selectConversation(conv.id)"
          >
            <template v-if="editingId === conv.id">
              <input
                :ref="(el) => (renameInput = el as HTMLInputElement | null)"
                v-model="editText"
                class="rename-input"
                @click.stop
                @keydown.enter="confirmRename(conv.id)"
                @keydown.esc="cancelRename"
                @blur="confirmRename(conv.id)"
              />
            </template>
            <template v-else>
              <span class="conv-title">{{ conv.title || "新会话" }}</span>
              <button
                class="conv-menu-btn"
                :class="{ 'is-open': menuOpenId === conv.id }"
                title="会话操作"
                @click.stop="toggleMenu(conv.id)"
              >⋮</button>
            </template>

            <div v-if="menuOpenId === conv.id" class="conv-menu" @click.stop>
              <button class="conv-menu-item" @click="startRename(conv)">重命名</button>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="main-area">
      <!-- TopBar -->
      <header class="topbar">
        <div class="topbar-center">
          <span v-if="appStore.currentConversationId" class="conversation-title">
            {{ appStore.conversations.find(c => c.id === appStore.currentConversationId)?.title || "新会话" }}
          </span>
          <span v-else class="app-title">新会话</span>
        </div>
        <div class="topbar-right">
          <RoleSelector :model-value="appStore.currentRole" @update:model-value="onRoleChange" />
        </div>
      </header>

      <!-- 主内容 -->
      <main class="main-content">
        <slot></slot>
      </main>
    </div>

    <!-- 连接状态 toast -->
    <ConnectionToast />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--color-bg-base);
}

/* === 桌面端 === */
.mobile-header {
  display: none;
}

.sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--sidebar-bg);
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border-default);
  transition: width var(--duration-normal) var(--ease-standard);
}

.sidebar-overlay {
  display: none;
}

/* === 移动端 === */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    height: 48px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 20;
  }

  .menu-btn {
    background: none;
    border: none;
    color: var(--color-text-primary);
    font-size: var(--text-xl);
    cursor: pointer;
    padding: var(--space-1) var(--space-2);
  }

  .mobile-title {
    font-weight: var(--weight-semibold);
    flex: 1;
  }

  .app-layout {
    flex-direction: column;
    padding-top: 48px;
  }

  .sidebar {
    position: fixed;
    top: 48px;
    left: 0;
    bottom: 0;
    z-index: 15;
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-standard);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-bg-overlay);
    z-index: 14;
  }
}

/* === 侧栏内容 === */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-default);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.sidebar-logo {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.logo {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.new-chat-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--duration-fast);
  flex-shrink: 0;
}

.new-chat-btn:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.new-chat-icon {
  line-height: 1;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) var(--space-3);
}

.empty-state {
  padding: var(--space-6) var(--space-3);
  text-align: center;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-2);
}

.empty-text {
  font-size: var(--text-sm);
}

.conversation-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.conversation-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.conversation-item:hover {
  background: var(--sidebar-item-hover);
}

.conversation-item.active {
  background: var(--sidebar-item-active);
  border-left: 2px solid var(--color-accent);
  padding-left: var(--space-2);
}

.conv-title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 三点菜单按钮：默认隐藏，悬停显示 */
.conv-menu-btn {
  opacity: 0;
  visibility: hidden;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  line-height: 1;
  flex-shrink: 0;
  transition: all var(--duration-fast);
}

.conversation-item:hover .conv-menu-btn,
.conv-menu-btn:focus-visible,
.conv-menu-btn.is-open {
  opacity: 1;
  visibility: visible;
}

.conv-menu-btn:hover {
  background: var(--color-border-hover);
  color: var(--color-text-primary);
}

.conv-menu {
  position: absolute;
  right: 8px;
  top: calc(100% - 6px);
  z-index: 30;
  min-width: 100px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  padding: 4px;
}

.conv-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-sans);
}

.conv-menu-item:hover {
  background: var(--color-border-hover);
}

.rename-input {
  flex: 1;
  min-width: 0;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  padding: 4px 6px;
  outline: none;
}

/* === 主区域 === */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-bg-base);
}

.topbar {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-default);
  gap: var(--space-3);
}

.topbar-center {
  flex: 1;
  text-align: center;
  min-width: 0;
}

.conversation-title {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-title {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
