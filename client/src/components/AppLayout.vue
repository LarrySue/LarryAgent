<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import { useAppStore, type Role } from "@/stores/app";
import {
  renameConversation,
  listConversations,
  deleteConversation,
  archiveConversationExtract,
  confirmArchive,
  archiveSessionOnly,
} from "@/api";
import RoleSelector from "@/components/RoleSelector.vue";
import ConnectionToast from "@/components/ConnectionToast.vue";
import BrandText from "@/components/BrandText.vue";
import logoUrl from "@/assets/logo.svg";
import { version as appVersion } from "../../package.json";

const appStore = useAppStore();
const sidebarOpen = ref(false);

// 会话操作（三点菜单 / 重命名 / 归档）
const menuOpenId = ref<number | null>(null);
const editingId = ref<number | null>(null);
const editText = ref("");
const renameInput = ref<HTMLInputElement | null>(null);

// 归档流程：确认弹窗 → 摘要编辑面板
const archiveTarget = ref<{ id: number; title: string } | null>(null);
const archiveLoading = ref(false);
const archiveError = ref("");
const summaryPanel = ref<{ convId: number } | null>(null);
const summaryText = ref("");
const confirmLoading = ref(false);

onMounted(() => {
  document.addEventListener("click", () => {
    menuOpenId.value = null;
    footerMenuOpen.value = false;
  });
});

// 拉取活跃列表（is_archived=0 且不在回收站）
async function refreshConversations() {
  const list = await listConversations({ archived: false });
  appStore.setConversations(list);
}

function toggleMenu(id: number) {
  menuOpenId.value = menuOpenId.value === id ? null : id;
}

// 侧栏底部设置菜单
const footerMenuOpen = ref(false);
function toggleFooterMenu() {
  footerMenuOpen.value = !footerMenuOpen.value;
}

// 设置菜单项
function showArchived() {}
function showTrash() {}

// 关于弹窗
const aboutOpen = ref(false);
function showAbout() {
  aboutOpen.value = true;
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
    await refreshConversations(); // 重命名后 updated_at 刷新，重新拉列表保持排序
  } catch {
    // 重命名失败暂静默，后续可加提示
  }
}

// === 归档流程 ===

function openArchiveDialog(conv: { id: number; title: string }) {
  menuOpenId.value = null;
  archiveTarget.value = conv;
  archiveError.value = "";
}

function closeArchiveDialog() {
  if (!archiveLoading.value) archiveTarget.value = null;
}

async function confirmDelete() {
  const target = archiveTarget.value;
  if (!target) return;
  try {
    await deleteConversation(target.id); // 软删除进回收站
    if (appStore.currentConversationId === target.id) appStore.selectConversation(null);
    await refreshConversations();
  } catch (e) {
    archiveError.value = (e as Error).message || "删除失败";
  }
  archiveTarget.value = null;
}

async function startArchive() {
  const target = archiveTarget.value;
  if (!target) return;
  archiveLoading.value = true;
  archiveError.value = "";
  try {
    const res = await archiveConversationExtract(target.id); // 生成摘要（调 LLM）
    summaryText.value = res.summary;
    summaryPanel.value = { convId: res.conversation_id };
    archiveTarget.value = null;
  } catch (e) {
    archiveError.value = (e as Error).message || "摘要生成失败";
  }
  archiveLoading.value = false;
}

async function confirmStore() {
  const panel = summaryPanel.value;
  if (!panel) return;
  confirmLoading.value = true;
  try {
    await confirmArchive({
      conversation_id: panel.convId,
      summary: summaryText.value.trim(),
    });
    if (appStore.currentConversationId === panel.convId) appStore.selectConversation(null);
    await refreshConversations();
    summaryPanel.value = null;
  } catch (e) {
    archiveError.value = (e as Error).message || "存入失败";
  }
  confirmLoading.value = false;
}

async function archiveOnly() {
  const panel = summaryPanel.value;
  if (!panel) return;
  confirmLoading.value = true;
  try {
    await archiveSessionOnly(panel.convId); // 仅归档，不写记忆
    if (appStore.currentConversationId === panel.convId) appStore.selectConversation(null);
    await refreshConversations();
    summaryPanel.value = null;
  } catch (e) {
    archiveError.value = (e as Error).message || "归档失败";
  }
  confirmLoading.value = false;
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
              <button class="conv-menu-item" @click="openArchiveDialog(conv)">归档</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏底部区域 -->
      <footer class="sidebar-footer">
        <button class="footer-btn" title="设置" @click.stop="toggleFooterMenu">
          <svg
            class="gear-icon"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <circle cx="8" cy="8" r="2.4" />
            <path
              d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4"
            />
          </svg>
        </button>
        <div v-if="footerMenuOpen" class="footer-menu" @click.stop>
          <button class="footer-menu-item" @click="showArchived">已归档</button>
          <button class="footer-menu-item" @click="showTrash">回收站</button>
          <button class="footer-menu-item" @click="showAbout">关于</button>
        </div>
      </footer>
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

    <!-- 归档确认弹窗（取消 / 删除 / 归档） -->
    <div v-if="archiveTarget" class="modal-overlay" @click.self="closeArchiveDialog">
      <div class="modal">
        <h3 class="modal-title">会话操作</h3>
        <p class="modal-desc">「{{ archiveTarget.title || "新会话" }}」如何处理？</p>
        <p v-if="archiveError" class="modal-error">{{ archiveError }}</p>
        <div class="modal-actions">
          <button class="modal-btn" :disabled="archiveLoading" @click="closeArchiveDialog">取消</button>
          <button class="modal-btn danger" :disabled="archiveLoading" @click="confirmDelete">删除</button>
          <button class="modal-btn primary" :disabled="archiveLoading" @click="startArchive">
            {{ archiveLoading ? "生成摘要中…" : "归档" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 归档摘要编辑面板（确认存入 / 仅归档 / 取消） -->
    <div v-if="summaryPanel" class="modal-overlay">
      <div class="modal">
        <h3 class="modal-title">归档摘要（可编辑）</h3>
        <textarea
          v-model="summaryText"
          class="summary-input"
          rows="10"
          spellcheck="false"
          placeholder="摘要将作为长期记忆存入，可手动修改"
        ></textarea>
        <p v-if="archiveError" class="modal-error">{{ archiveError }}</p>
        <div class="modal-actions">
          <button class="modal-btn" :disabled="confirmLoading" @click="summaryPanel = null">取消</button>
          <button class="modal-btn" :disabled="confirmLoading" @click="archiveOnly">仅归档</button>
          <button class="modal-btn primary" :disabled="confirmLoading" @click="confirmStore">
            {{ confirmLoading ? "存入中…" : "确认存入" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 关于弹窗 -->
    <div v-if="aboutOpen" class="modal-overlay" @click.self="aboutOpen = false">
      <div class="modal about-modal">
        <div class="about-header">
          <img class="about-logo" :src="logoUrl" alt="LarryAgent logo" />
          <h3 class="about-title"><BrandText /></h3>
          <p class="about-version">Version {{ appVersion }}</p>
        </div>
        <div class="about-info">
          <p class="about-line"><span class="about-label">Creator &amp; Designer：</span><span class="about-value">SuLarry</span></p>
          <p class="about-line"><span class="about-label">Crafted with：</span><span class="about-value">WorkBuddy · Trae · Claude · Marvis · Qoder</span></p>
          <p class="about-line"><span class="about-label">AI Copilot：</span><span class="about-value">DeepSeek · GLM · Hunyuan · Qwen</span></p>
          <p class="about-note">All AI-generated code has been reviewed, integrated, and warranted by SuLarry.</p>
        </div>
      </div>
    </div>
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
  height: 50px;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-default);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

/* === 侧栏底部区域 === */
.sidebar-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  height: 48px;
  flex-shrink: 0;
  padding: 0 var(--space-4);
  border-top: 1px solid var(--color-border-default);
}

.footer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: auto;
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.footer-btn:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.footer-menu {
  position: absolute;
  right: 8px;
  bottom: calc(100% + 4px);
  z-index: 30;
  min-width: 120px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  padding: 4px;
}

.footer-menu-item {
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
}

.footer-menu-item:hover {
  background: var(--color-border-hover);
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

/* === 归档弹窗 === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 440px;
  max-width: calc(100vw - 48px);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.modal-desc {
  margin: 0 0 var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  word-break: break-all;
}

.modal-error {
  margin: 0 0 var(--space-3);
  color: var(--color-error, #EF4444);
  font-size: var(--text-sm);
}

/* === 关于弹窗 === */
.about-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  width: 528px;
}

.about-header {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
}

.about-logo {
  width: 90px;
  height: 90px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.about-title {
  flex: 1;
  margin: 0;
  font-size: 48px;
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
  white-space: nowrap;
}

.about-version {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.about-info {
  display: grid;
  grid-template-columns: auto 1fr;
  justify-items: start;
  align-items: baseline;
  column-gap: var(--space-2);
  row-gap: var(--space-1);
  margin-top: var(--space-5);
}

.about-line {
  display: contents;
}

.about-label,
.about-value {
  font-size: 14px;
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.about-label {
  justify-self: end; /* 标签右对齐 → 冒号列对齐 */
  white-space: nowrap;
}

.about-note {
  grid-column: 1 / -1;
  justify-self: center;
  margin: var(--space-5) 0 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.modal-btn {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: all var(--duration-fast);
}

.modal-btn:hover:not(:disabled) {
  border-color: var(--color-border-hover);
}

.modal-btn.primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.modal-btn.danger {
  color: var(--color-error, #EF4444);
  border-color: var(--color-error, #EF4444);
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summary-input {
  width: 100%;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: 1.6;
  resize: vertical;
  margin-bottom: var(--space-4);
  outline: none;
}

.summary-input:focus {
  border-color: var(--color-accent);
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
  height: 50px;
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
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
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
