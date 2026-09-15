

# LarryAgent 手机端

> 此文档已严重过时，不具有参考价值，不过目前也并无法修改，暂时搁置，AI不用读取（老大，2026-09-15）

## 架构说明

手机端采用纯 **HTML5 Web App** 方案，无需原生开发。

```
┌─────────────────────────────────────────┐
│         手机浏览器 / PWA                  │
│  ┌───────────────────────────────────┐  │
│  │     HTML + CSS + JavaScript       │  │
│  │  通过 fetch 调用云端 API           │  │
│  └───────────────────────────────────┘  │
│                │ HTTPS                   │
│  ┌─────────────▼─────────────────────┐  │
│  │   VPS 上的 Nginx + FastAPI 后端    │  │
│  │   - 静态文件服务（mobile/ 目录）    │  │
│  │   - API 反向代理到 Agent 进程      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 部署方式

### 方案 A：VPS + Nginx 静态文件

1. 将 `mobile/` 目录下的文件上传到 VPS
2. 配置 Nginx 同时服务静态文件和反向代理 API：

```nginx
server {
    listen 80;
    server_name agent.example.com;

    # 静态文件
    root /var/www/larry-agent/mobile;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 方案 B：PWA（渐进式 Web 应用）

- 添加 `manifest.json` 和 Service Worker
- 支持添加到主屏幕
- 支持离线缓存（聊天历史）

## 开发计划

- [ ] 聊天界面 (index.html)
- [ ] 多会话切换
- [ ] Markdown 渲染
- [ ] PWA manifest + Service Worker
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
