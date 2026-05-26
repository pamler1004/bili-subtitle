# 更新记录

## v1.0 (2026-05-26)

### 初始发布

- 获取 B 站视频字幕（自动识别 BVID，优先中文）
- 字幕段落合并：按 12 条分组，组内空格连接，避免逐秒碎行
- 导出到 Obsidian：标准 URI + `overwrite=true` 跳过确认弹窗
- 复制 Markdown 格式字幕到剪贴板
- 下载 SRT / TXT 格式文件
- 设置面板：Vault 名称、文件夹路径、时间戳开关
- 设置持久化（chrome.storage.sync）
- 自动检测当前页面是否为 B 站视频页
- 背景 Service Worker 代理 API 请求（携带 Cookie）
- 图标重设计：B站蓝渐变 + 白色字幕条
- 文档：README、架构说明、API 参考、开发指南
