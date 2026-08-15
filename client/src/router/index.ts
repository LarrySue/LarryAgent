import { createRouter, createWebHistory } from "vue-router";

// 路由结构
// - / → 聊天主界面（P4.4 填充聊天组件）
// - /settings → 设置页（P4.5 填充配置入口）
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "chat",
      component: () => import("@/views/ChatView.vue"),
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/views/SettingsView.vue"),
    },
  ],
});

export default router;
