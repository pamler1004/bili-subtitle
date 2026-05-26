# 开发指南

## 环境要求

- Chrome 浏览器（88+，支持 Manifest V3）
- 无需 Node.js / npm（纯原生 JS）

## 本地开发

### 加载扩展

1. 打开 `chrome://extensions`
2. 开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择项目根目录

### 调试方法

| 调试目标 | 方法 |
|---------|------|
| Popup 页面 | 在扩展图标上右键 → **审查弹出内容** |
| Background | `chrome://extensions` → 找到扩展 → **Service Worker** 链接 |
| B 站 API | 在 Popup 的 Console 中查看网络请求 |

### 每次修改后

- 修改 `popup.js` / `popup.html` / `popup.css` → 只需重新打开 Popup
- 修改 `background.js` → 在 `chrome://extensions` 点击扩展的 **刷新** 按钮
- 修改 `manifest.json` → 同样需要刷新按钮

## 构建

无需构建步骤。项目为纯原生 JavaScript，零依赖。

如需打包发布：

```
chrome://extensions → 打包扩展程序 → 选择项目目录 → 生成 .crx
```

## 代码风格

- 原生 ES2020+，使用 `async/await`
- 不可变数据风格：展开运算符创建新对象
- 错误处理：所有异步操作包裹 `try-catch`，用户侧中文友好提示
- DOM 操作：通过 `id` 获取元素（`const $ = id => document.getElementById(id)`）

## 项目扩展思路

### 添加新的导出格式

在 `popup.js` 中添加格式化函数（如 `toCSV`），然后在 `popup.html` 添加对应按钮并绑定事件：

```javascript
function toCSV(data) {
  return data.body.map(item =>
    `${item.from},${item.to},"${item.content}"`
  ).join('\n');
}
```

### 支持其他平台

当前架构是为 B 站定制。如需支持 YouTube 等平台，需：
1. 修改 URL 检测逻辑（判断不同域名）
2. 为每个平台实现独立的 `fetchSubtitle` 函数
3. 统一返回 `{ title, subtitleData }` 格式

### WBI 签名

如果 B 站接口未来需要 WBI 签名，参考以下逻辑：

```javascript
function getWbiKeys() {
  // 从 https://api.bilibili.com/x/web-interface/nav 获取 img_key 和 sub_key
  // 拼接后调用 md5，计算 w_rid 参数
}
```
