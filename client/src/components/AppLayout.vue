<script setup lang="ts">
// 应用布局组件
// - 桌面端：左侧栏（会话列表 / 导航）+ 右侧主区域
// - 移动端（< 768px）：左侧栏隐藏，通过汉堡菜单切换
// - 响应式设计：P5 移动端可直接复用，CSS media query 成本低
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();
const sidebarOpen = ref(false); // 移动端侧栏开关

const connectionLabel: Record<string, string> = {
  ok: "已连接",
  down: "已断开",
  restarting: "重启中",
  failed: "启动失败",
};

const connectionColor: Record<string, string> = {
  ok: "#4ade80",
  down: "#f87171",
  restarting: "#fbbf24",
  failed: "#f87171",
};

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}
</script>

<template>
  <div class="app-layout">
    <!-- 移动端顶部栏（含汉堡菜单） -->
    <header class="mobile-header">
      <button class="menu-btn" @click="toggleSidebar">☰</button>
      <span class="mobile-title">LarryAgent</span>
    </header>

    <!-- 侧栏遮罩（移动端） -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

    <!-- 左侧栏 -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h1 class="logo">LarryAgent</h1>
      </div>

      <nav class="nav">
        <RouterLink to="/" class="nav-item" @click="sidebarOpen = false">
          💬 聊天
        </RouterLink>
        <RouterLink to="/settings" class="nav-item" @click="sidebarOpen = false">
          ⚙️ 设置
        </RouterLink>
      </nav>

      <!-- 会话列表（P4.4 填充） -->
      <div class="conversation-list">
        <div class="section-title">会话</div>
        <!-- P4.4 会在这里渲染 ConversationSidebar 组件 -->
        <div class="conversation-placeholder">
          会话列表将在 P4.4 实现
        </div>
      </div>

      <!-- 底部状态栏 -->
      <div class="status-bar">
        <span
          class="status-dot"
          :style="{ background: connectionColor[appStore.connectionStatus] }"
        ></span>
        <span class="status-text">{{ connectionLabel[appStore.connectionStatus] }}</span>
      </div>
    </aside>

    <!-- 主区域 -->
    <main class="main-content">
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* === 桌面端（>= 768px）=== */
.mobile-header {
  display: none;
}

.sidebar {
  width: 240px;
  min-width: 240px;
  background: #1e1e2e;
  color: #cdd6f4;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #313244;
}

.sidebar-overlay {
  display: none;
}

/* === 移动端（< 768px）=== */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: #1e1e2e;
    color: #cdd6f4;
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
    color: #cdd6f4;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
  }

  .mobile-title {
    font-weight: 600;
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
    transition: transform 0.25s ease;
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
    background: rgba(0, 0, 0, 0.5);
    z-index: 14;
  }
}

/* === 侧栏内部样式 === */
.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid #313244;
}

.logo {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.nav {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  color: #cdd6f4;
  text-decoration: none;
  transition: background 0.15s;
}

.nav-item:hover {
  background: #313244;
}

.nav-item.router-link-active {
  background: #45475a;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.section-title {
  font-size: 12px;
  color: #6c7086;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.conversation-placeholder {
  color: #6c7086;
  font-size: 13px;
  padding: 12px 8px;
}

.status-bar {
  padding: 12px 20px;
  border-top: 1px solid #313244;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-text {
  color: #a6adc8;
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
