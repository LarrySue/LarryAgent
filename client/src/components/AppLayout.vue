<script setup lang="ts">
import { ref } from "vue";
import { useAppStore, type Role } from "@/stores/app";
import RoleSelector from "@/components/RoleSelector.vue";
import ConnectionToast from "@/components/ConnectionToast.vue";

const appStore = useAppStore();
const sidebarOpen = ref(false);

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
      <span class="mobile-title">LarryAgent</span>
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
        <h1 class="logo">LarryAgent</h1>
      </div>

      <!-- 会话列表 -->
      <div class="conversation-list">
        <div class="section-header">
          <div class="section-title">会话列表</div>
          <button class="new-chat-btn" title="新建会话" @click="startNewChat">
            <span class="new-chat-icon">＋</span>
            <span class="new-chat-text">新建会话</span>
          </button>
        </div>
        <div v-if="appStore.conversations.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-text">暂无会话</div>
        </div>
        <div v-else class="conversation-items">
          <div
            v-for="conv in appStore.conversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: conv.id === appStore.currentConversationId }"
            @click="appStore.selectConversation(conv.id)"
          >
            <span class="conv-dot" :style="{ background: `var(--role-${appStore.currentRole})` }"></span>
            <span class="conv-title">{{ conv.title || "新会话" }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="main-area">
      <!-- TopBar -->
      <header class="topbar">
        <button class="collapse-btn" @click="toggleSidebar" title="切换侧栏">◀</button>
        <div class="topbar-center">
          <span v-if="appStore.currentConversationId" class="conversation-title">
            {{ appStore.conversations.find(c => c.id === appStore.currentConversationId)?.title || "新会话" }}
          </span>
          <span v-else class="app-title">LarryAgent</span>
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
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-default);
}

.logo {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) var(--space-3);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.section-title {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0;
}

.new-chat-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.new-chat-btn:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.new-chat-icon {
  font-size: var(--text-sm);
  line-height: 1;
}

.new-chat-text {
  white-space: nowrap;
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

.conv-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.conv-title {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.collapse-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--text-base);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}

.collapse-btn:hover {
  background: var(--color-border-hover);
  color: var(--color-text-primary);
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
  font-weight: var(--weight-semibold);
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
