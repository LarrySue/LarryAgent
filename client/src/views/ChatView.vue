<script setup lang="ts">
// 聊天视图 — P4.4 填充聊天组件（MessageList / ToolCallCard / ChatInput 等）
// 当前为空壳，使用 AppLayout 布局
import AppLayout from "@/components/AppLayout.vue";
</script>

<template>
  <AppLayout>
    <div class="chat-view">
      <div class="chat-placeholder">
        <h2>聊天界面</h2>
        <p>聊天组件将在 P4.4 实现（MessageList / ToolCallCard / ChatInput）</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.chat-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #181825;
  color: #cdd6f4;
}

.chat-placeholder {
  text-align: center;
  color: #6c7086;
}

.chat-placeholder h2 {
  margin: 0 0 12px 0;
  color: #cdd6f4;
}

.chat-placeholder p {
  margin: 0;
}
</style>
