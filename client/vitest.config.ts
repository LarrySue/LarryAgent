import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// Vitest 配置（P4.4 前端测试基建）
// - jsdom 环境：组件挂载需要 DOM
// - alias @ → src：与 vite.config.ts / tsconfig.json 一致
// - 测试文件放在 tests/ 目录，避免与 src 混放
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
