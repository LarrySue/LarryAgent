---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 44c052101e5e236a5489b447016cb8fe_e288af8d90db11f1a102525400826444
    ReservedCode1: ao80QBk8xWRiSPh2yIuWUg2P3aWKozexFcPSR29l370tvNb1bfIpQwi23ujKB0Lu7C+QKrdh+17VUg8yU49vemwF4B6LvNQZp6/mopz69HQrwBrhmc2kgg9MdpL3IR3pFI5oQNZ0VS4a0BsQI7eZNqxEya0jTdywwIzB02WPtJYz5P8pU8vd6jn3SCM=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 44c052101e5e236a5489b447016cb8fe_e288af8d90db11f1a102525400826444
    ReservedCode2: ao80QBk8xWRiSPh2yIuWUg2P3aWKozexFcPSR29l370tvNb1bfIpQwi23ujKB0Lu7C+QKrdh+17VUg8yU49vemwF4B6LvNQZp6/mopz69HQrwBrhmc2kgg9MdpL3IR3pFI5oQNZ0VS4a0BsQI7eZNqxEya0jTdywwIzB02WPtJYz5P8pU8vd6jn3SCM=
---

﻿---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 44c052101e5e236a5489b447016cb8fe_545c4f6390db11f1bafa525400287e28
    ReservedCode1: DcQh9YtuMpwPg3s9zzf0+21HUKEH54G/GtNMKbItC+pMpIVkoAdQeUAvSQfvpPfzYPXcf4REgQt55SzqVPuW4vBJDfUZuK7VhqwNwtUcvEYqDxUsqdbrFeh9xfZU383Y7Ixo+bRCQgB0ewSvwf0a3RnzvjfZLc1u+XVVEYj6/7HFvTcAY7Dn1MgrjX4=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 44c052101e5e236a5489b447016cb8fe_545c4f6390db11f1bafa525400287e28
    ReservedCode2: DcQh9YtuMpwPg3s9zzf0+21HUKEH54G/GtNMKbItC+pMpIVkoAdQeUAvSQfvpPfzYPXcf4REgQt55SzqVPuW4vBJDfUZuK7VhqwNwtUcvEYqDxUsqdbrFeh9xfZU383Y7Ixo+bRCQgB0ewSvwf0a3RnzvjfZLc1u+XVVEYj6/7HFvTcAY7Dn1MgrjX4=
---

# LarryAgent 手机端

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
