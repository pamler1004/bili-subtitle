# Bilibili API 参考

## 接口清单

### 1. 获取视频信息

```
GET https://api.bilibili.com/x/web-interface/view?bvid={bvid}
```

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| bvid | string | 视频 BV 号，如 `BV1V55z6TEzS` |

**响应示例**

```json
{
  "code": 0,
  "data": {
    "bvid": "BV1V55z6TEzS",
    "aid": 123456789,
    "title": "视频标题",
    "cid": 987654321
  }
}
```

**提取字段**

- `data.aid` — 视频 AV 号（数字）
- `data.cid` — 视频分 P ID
- `data.title` — 视频标题

### 2. 获取播放器信息（含字幕列表）

```
GET https://api.bilibili.com/x/player/wbi/v2?aid={aid}&cid={cid}
```

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| aid | number | 视频 AV 号 |
| cid | number | 视频分 P ID |

**响应示例**

```json
{
  "code": 0,
  "data": {
    "subtitle": {
      "subtitles": [
        {
          "id": 12345,
          "lan": "zh-CN",
          "lan_doc": "中文（自动生成）",
          "subtitle_url": "//aisubtitle.hdslb.com/.../abc.json"
        }
      ]
    }
  }
}
```

**字幕选择优先级**

1. `zh-CN` — 中文字幕
2. `ai-zh` — AI 自动生成中文字幕
3. `zh-*` — 其他中文变体
4. 第一个可用字幕

### 3. 获取字幕内容

```
GET {subtitle_url}   // 完整 URL（需补 https: 前缀）
```

**响应示例**

```json
{
  "body": [
    {
      "from": 0,
      "to": 2.5,
      "content": "大家好 欢迎收看"
    },
    {
      "from": 2.5,
      "to": 5.0,
      "content": "今天的视频内容"
    }
  ],
  "bvid": "BV1V55z6TEzS"
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| body[].from | number | 开始时间（秒） |
| body[].to | number | 结束时间（秒） |
| body[].content | string | 字幕文本 |

## 注意事项

- **Cookie 要求**：接口需要 B 站登录态 Cookie（`SESSDATA`），background.js 的 `credentials: 'include'` 自动携带
- **跨域**：`api.bilibili.com` 和 `*.hdslb.com` 已在 `host_permissions` 中声明
- **字幕可用性**：并非所有视频都有字幕。AI 字幕仅对部分视频可用，UP 主手动上传的字幕通常质量更高
- **WBI 签名**：当前接口无需 WBI 签名即可访问。如果未来 B 站收紧策略，需要在请求中添加 wbi 签名参数（`w_rid` + `wts`）
