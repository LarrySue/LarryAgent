import { createRouter, createWebHistory } from "vue-router";

// 路由结构
// - / → 聊天主界面（P4.4 填充聊天组件）
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "chat",
      component: () => import("@/views/ChatView.vue"),
    },
  ],
});

export default router;
