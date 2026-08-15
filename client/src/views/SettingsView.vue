<script setup lang="ts">
// 设置视图 — P4.5 填充配置入口（打开配置文件按钮 / API key 引导等）
// 当前为空壳
import AppLayout from "@/components/AppLayout.vue";
</script>

<template>
  <AppLayout>
    <div class="settings-view">
      <div class="settings-placeholder">
        <h2>设置</h2>
        <p>配置入口将在 P4.5 实现（打开配置文件 / API key 引导）</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.settings-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #181825;
  color: #cdd6f4;
}

.settings-placeholder {
  text-align: center;
  color: #6c7086;
}

.settings-placeholder h2 {
  margin: 0 0 12px 0;
  color: #cdd6f4;
}

.settings-placeholder p {
  margin: 0;
}
</style>
