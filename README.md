# B站字幕助手

获取 B 站视频字幕，一键导出到 Obsidian、复制、下载 SRT/TXT。

## 功能

- **获取字幕** — 自动识别当前 B 站视频，一键拉取字幕（优先中文）
- **导出格式** —
  - **Obsidian** — 直接创建笔记，支持指定 Vault 和文件夹路径
  - **Markdown** — 带时间戳的格式化字幕，可复制到剪贴板
  - **SRT** — 标准字幕格式，适配播放器
  - **TXT** — 纯文本格式
- **段落合并** — 按时间戳分组，组内条目用空格连接，避免逐秒碎行
- **设置持久化** — Vault 名称、文件夹路径、时间戳开关通过 Chrome Storage 保存

## 安装

1. 在 Chrome 地址栏打开 `chrome://extensions`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择本项目根目录

## 使用

1. 打开任意 B 站视频页面（URL 包含 `BV` 号）
2. 点击扩展图标 → 弹出面板自动识别视频标题和 BVID
3. 点击 **获取字幕**
4. 获取成功后选择导出方式：
   - **存入 Obsidian** — 跳转到 Obsidian 创建笔记（首次使用需允许打开 Obsidian.app）
   - **复制** — 复制格式化 Markdown 到剪贴板
   - **SRT / TXT** — 下载对应格式文件

## 设置

| 选项 | 说明 |
|------|------|
| Obsidian Vault 名称 | 留空则使用当前打开的 Vault |
| 存放文件夹 | Obsidian 内笔记存储路径（留空为根目录） |
| 包含时间戳 | 每条字幕段落前是否显示时间标记 |

## 项目结构

```
├── manifest.json      # 扩展配置（Manifest V3）
├── background.js      # 后台 Service Worker（API 代理 + 协议跳转）
├── popup.html         # 弹出面板 UI
├── popup.js           # 主要业务逻辑
├── icons/             # 图标源文件及 PNG
└── docs/              # 文档
```

## 技术栈

- Chrome Extension Manifest V3
- 原生 JavaScript（零依赖）
- Bilibili Web API（`/x/web-interface/view` + `/x/player/wbi/v2`）
- Obsidian URI Scheme（`obsidian://new`）
