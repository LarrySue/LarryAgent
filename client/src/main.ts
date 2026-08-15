import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import "./styles/main.css";

// 应用入口
// - Pinia：全局状态（当前会话 ID / 会话列表 / 连接状态）
// - Router：路由（/ 聊天、/settings 设置）
createApp(App).use(createPinia()).use(router).mount("#app");
