import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
// Inter 字体本地打包（latin 子集，字重 400/500/600/700 对应 tokens.css）
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "./styles/main.css";

// 应用入口
// - Pinia：全局状态（当前会话 ID / 会话列表 / 连接状态）
// - Router：路由（/ 聊天）
createApp(App).use(createPinia()).use(router).mount("#app");
