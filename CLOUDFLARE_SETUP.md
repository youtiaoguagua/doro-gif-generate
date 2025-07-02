# Cloudflare Workers + KV 云端预设部署指南

## 📋 概述

使用 Cloudflare Workers 和 KV 存储来实现云端预设分享功能，让用户能够上传、下载和分享 GIF 编辑预设。

## 🔧 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 KV 命名空间

```bash
# 创建 KV 命名空间
wrangler kv:namespace create "PRESET_STORE"
```

记录返回的命名空间 ID，更新 `wrangler.toml` 文件中的对应 ID。

### 4. 创建配置文件

复制模板文件并替换 KV 命名空间 ID：

```bash
# 复制模板文件
cp wrangler.toml.example wrangler.toml
```

然后编辑 `wrangler.toml`，替换实际的 KV 命名空间 ID：

```toml
[[kv_namespaces]]
binding = "PRESET_STORE"
id = "你的KV命名空间ID"        # 替换为实际 ID
```

### 5. 部署 Worker

```bash
# 部署到生产环境
wrangler deploy

# 或部署到开发环境
wrangler deploy --env development
```

### 6. 配置自定义域名（可选）

在 Cloudflare Dashboard 中：
1. 进入 Workers & Pages
2. 选择你的 Worker
3. 设置自定义域名
4. 更新前端代码中的 API 端点

## 🌐 API 端点

部署完成后，你的 API 端点将是：

- **获取预设列表**: `GET https://doro-api.20491504.xyz/api/presets`
- **上传预设**: `POST https://doro-api.20491504.xyz/api/presets`
- **获取预设详情**: `GET https://doro-api.20491504.xyz/api/presets/{id}`
- **增加下载计数**: `POST https://doro-api.20491504.xyz/api/presets/{id}/download`
- **删除预设**: `DELETE https://doro-api.20491504.xyz/api/presets/{id}`

## 🔧 前端配置

如果你使用自定义域名，需要更新前端代码中的 API 基础 URL：

```javascript
// 在 App.vue 中，将所有 '/api/presets' 替换为你的完整 API URL
const API_BASE = 'https://your-custom-domain.com'
// 或者
const API_BASE = 'https://your-worker.your-subdomain.workers.dev'

// 然后更新 fetch 调用
fetch(`${API_BASE}/api/presets`)
```

## 📊 数据结构

### 预设元数据（存储在索引中）
```json
{
  "id": "unique-preset-id",
  "name": "预设名称",
  "description": "预设描述",
  "author": "作者名",
  "tags": ["标签1", "标签2"],
  "downloads": 0,
  "createdAt": "2024-01-01T00:00:00Z",
  "frames": 19
}
```

### 完整预设数据
```json
{
  "name": "预设名称",
  "description": "预设描述", 
  "tags": ["标签1", "标签2"],
  "author": "作者名",
  "frames": [
    {
      "src": "/doro/frame_00_delay-0.08s.png",
      "texts": [
        {
          "text": "文字内容",
          "left": 100,
          "top": 50,
          "fontSize": 24,
          "fill": "#000000",
          // ... 其他样式属性
        }
      ]
    }
    // ... 更多帧
  ],
  "settings": {
    "gifDelay": 80,
    "defaultTextStyle": { /* ... */ },
    "canvasSize": { "width": 500, "height": 400 }
  }
}
```

## 💰 成本估算

Cloudflare Workers 免费计划：
- **请求数**: 100,000 次/天
- **KV 读取**: 100,000 次/天  
- **KV 写入**: 1,000 次/天
- **KV 存储**: 1GB

对于大多数使用场景，免费计划就足够了。

## 🔒 安全考虑

### 配置文件安全
- `wrangler.toml` 包含 KV namespace ID，**不应提交到 Git**
- 使用 `wrangler.toml.example` 作为模板分享
- 将 `wrangler.toml` 添加到 `.gitignore`

### API 安全
1. **CORS 配置**: Worker 已配置允许所有来源，生产环境建议限制特定域名
2. **速率限制**: 可以添加基于 IP 的速率限制
3. **内容审核**: 可以添加内容过滤和审核机制
4. **用户认证**: 可以集成用户系统限制上传权限

## 🛠️ 本地开发

```bash
# 启动本地开发服务器
wrangler dev

# 测试 API
curl http://localhost:8787/api/presets
```

## 📝 维护

### 查看 KV 数据
```bash
# 列出所有键
wrangler kv:key list --binding=PRESET_STORE

# 获取特定键的值
wrangler kv:key get "preset-index" --binding=PRESET_STORE
```

### 删除数据

通过 API（推荐）：
```bash
# 删除特定预设
curl -X DELETE https://doro-api.20491504.xyz/api/presets/{id}
```

通过 Wrangler CLI：
```bash
# 删除特定预设
wrangler kv:key delete "preset-{id}" --binding=PRESET_STORE

# 清空所有数据（谨慎操作）
wrangler kv:key delete "preset-index" --binding=PRESET_STORE
```

## 🚀 扩展功能

可以考虑添加的功能：
- 用户认证和个人预设管理
- 预设评分和评论系统
- 搜索和分类功能
- 预设预览图生成
- 下载统计和热门推荐

## 📞 问题排查

1. **CORS 错误**: 检查 Worker 中的 CORS 头设置
2. **KV 读写失败**: 确认命名空间 ID 配置正确
3. **部署失败**: 检查 wrangler.toml 语法和权限设置

需要帮助？查看 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/) 或联系开发者。 