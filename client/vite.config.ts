import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// Vite 配置
// - dev server 端口 5173（与 tauri.conf.json devUrl 一致）
// - proxy /api → 后端 127.0.0.1:8000（避免前端跨域 + 走 AuthMiddleware）
// - alias @ → src（与 tsconfig.json paths 一致）
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // 端口被占用时报错而非换端口（Tauri devUrl 写死 5173）
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      // /health 不在 /api 下，也需要 proxy（Tauri 前端可能调健康检查）
      "/health": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist", // 输出到 client/dist，tauri.conf.json frontendDist 指向 ../dist
    emptyOutDir: true,
  },
});

