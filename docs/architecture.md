# 架构说明

## 整体架构

```
┌─────────────────────────────────────────────┐
│                 Popup (popup.html/js)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 获取字幕  │  │ 导出格式  │  │ 设置面板  │  │
│  └────┬─────┘  └──────────┘  └──────────┘  │
└───────┼─────────────────────────────────────┘
        │
        │ chrome.runtime.sendMessage
        ▼
┌─────────────────────────────────────────────┐
│          Background Service Worker          │
│  ┌──────────────────────────────────────┐   │
│  │ fetch_json → fetch() 代理跨域请求    │   │
│  │ open_obsidian → chrome.tabs 跳转     │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
        │
        │ HTTPS
        ▼
┌─────────────────────────────────────────────┐
│          Bilibili API                       │
│  /x/web-interface/view?bvid={bvid}          │
│  /x/player/wbi/v2?aid={aid}&cid={cid}      │
│  {subtitle_url} (字幕 JSON 文件)            │
└─────────────────────────────────────────────┘
```

## 模块职责

### Popup（popup.js）
- 检测当前标签页是否为 B 站视频页
- 通过 `sendMessage` 调用 background 代理 API
- 格式化字幕数据（Markdown / SRT / TXT）
- 提供用户交互（按钮点击、设置保存）

### Background（background.js）
- Service Worker，常驻后台
- `fetch_json` — 携带 Cookie 代理跨域请求到 B 站 API
- `open_obsidian` — 打开 `obsidian://` 协议链接

## 数据流

1. 用户点击「获取字幕」
2. Popup 从当前标签 URL 提取 `bvid`
3. Popup → Background `fetch_json` → B站 `/x/web-interface/view` → 获取 `aid`、`cid`、`title`
4. Popup → Background `fetch_json` → B站 `/x/player/wbi/v2` → 获取字幕列表
5. Popup → Background `fetch_json` → 字幕 JSON 文件 → 获取逐条字幕数据
6. Popup 格式化并缓存结果，供导出使用

## 关键设计决策

### 为什么不用 Content Script？
B 站是 SPA（单页应用），页面路由变化不刷新页面，Content Script 注入时机不稳定。Popup 方案更可靠，且无需额外权限。

### 为什么用 Background 代理 API 请求？
B 站字幕 API 需要携带登录 Cookie。直接从 Popup 请求会因跨域限制失败。Background Service Worker 的 `fetch()` 不受跨域限制，且能自动携带扩展 host_permissions 域名下的 Cookie。

### 为什么不用 WBI 签名？
B 站的 `/x/player/wbi/v2` 接口当前不需要签名即可访问，且返回数据中包含完整的字幕 URL。如需签名，可通过 `img_key` 和 `sub_key` 拼接后计算。
