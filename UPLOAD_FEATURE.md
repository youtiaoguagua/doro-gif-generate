# 🖼️ 图片上传功能说明

## 功能概述

现在支持用户上传自定义图片，而不仅限于使用预设的 doro 图片！

## 🎯 新增功能

### 1. 图片上传
- **支持格式**: GIF、PNG、JPG 等常见图片格式
- **上传方式**: 点击上传按钮或拖拽到指定区域
- **默认图片**: `/preset/kick.gif`（如果存在）
- **降级机制**: 如果默认图片不存在，自动使用原有的 doro 图片

### 2. 图片处理
- **真正的 GIF 解析**: 使用 gifuct-js 库解析 GIF 的每一帧，保持原始动画效果
- **帧延迟保持**: 自动读取每帧的延迟时间，保持原始播放速度
- **降级处理**: 如果 GIF 解析失败，自动回退到简化处理模式
- **单图处理**: 将静态图片复制为多帧
- **尺寸适配**: 自动调整画布尺寸匹配图片尺寸
- **数据存储**: 保存完整的帧数据和 GIF 信息用于云端分享

### 3. 云端分享升级
- **完整分享**: 包含自定义图片的完整预设
- **数据限制**: 单个预设最大 25MB（Cloudflare KV 限制）
- **智能标识**: 云端预设列表显示是否包含自定义图片
- **数据大小**: 显示预设文件大小

## 📂 文件结构

```
public/
  preset/
    kick.gif          # 默认图片（已添加）
  doro2/              # 原有的 doro 图片（作为降级选项）
    frame_*.png
src/
  assets/
    preset/           # 备份位置
    bg.png, bg2.png   # 背景图片
```

## 🚀 使用方法

### 1. 上传自定义图片
1. 点击编辑区域的"🖼️ 上传图片"按钮
2. 选择或拖拽图片文件
3. 等待处理完成
4. 开始在自定义图片上添加文字

### 2. 分享包含图片的预设
1. 创建包含自定义图片的项目
2. 点击"☁️ 分享预设"
3. 填写描述和标签
4. 上传（包含图片数据，可能较大）

### 3. 下载他人分享的图片预设
1. 浏览云端预设（显示"🖼️ 自定义图片"标签的）
2. 点击下载
3. 自动加载图片和文字内容

## ⚠️ 注意事项

### 数据大小限制
- **Cloudflare KV**: 单个值最大 25MB
- **建议**: 使用压缩过的图片以减小文件大小
- **提示**: 系统会显示预设文件大小

### 图片处理说明
- **GIF 帧解析**: 使用 gifuct-js 库完整解析 GIF 动画的所有帧
- **帧数灵活**: 支持任意帧数的 GIF，不再限制为 19 帧
- **延迟保持**: 自动读取原始 GIF 的帧延迟时间
- **降级机制**: 解析失败时自动回退到简化处理
- **尺寸建议**: 推荐 400x400 像素的正方形图片

### 兼容性
- **向下兼容**: 旧的项目和预设仍可正常使用
- **自动降级**: 如果图片加载失败，自动使用默认图片
- **智能检测**: 自动识别预设是否包含自定义图片

## 📝 TODO

1. ✅ **添加默认图片**: `kick.gif` 已放置到 `src/assets/preset/` 目录
2. **图片压缩**: 添加客户端图片压缩功能减小文件大小
3. **批量处理**: 支持一次上传多张图片自动生成帧序列
4. **GIF 优化**: 优化大尺寸 GIF 的处理性能

## 🎉 优势

- **普遍适用性**: 不再限制于特定的图片素材
- **创意自由**: 用户可以使用任何图片创建 GIF
- **完整分享**: 云端预设包含完整的图片和文字信息
- **无缝体验**: 保持与原有功能的完全兼容

现在你的 GIF 编辑器更加灵活和强大了！🎨 