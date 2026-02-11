# Yuhao的个人主页

这是一个基于GitHub Pages的个人主页项目，包含个人介绍和常用链接库。

## 📋 项目概述

这个仓库包含：
- **主页 (index.html)**: 个人介绍和联系方式
- **链接库 (link.html)**: 常用网站快速访问页面
- **链接数据 (links.json)**: 存储所有链接的JSON文件
- **图标管理**: Python脚本用于自动下载和管理网站图标

## 🚀 功能特点

- ✨ 简洁现代的UI设计
- 🌗 深色/浅色主题切换
- 📱 响应式设计，支持移动端
- 🔍 智能搜索引擎（根据地区自动选择）
- 🎨 动画效果和平滑滚动
- 💾 Service Worker支持离线访问
- 🖼️ 自动获取网站图标

## 🛠️ 我能帮你做什么？

作为AI助手，我可以帮助你：

### 📝 内容管理
- ✅ 添加、修改或删除链接库中的网站
- ✅ 更新个人信息和联系方式
- ✅ 修改页面标题和描述文字

### 🎨 样式调整
- ✅ 修改配色方案和主题
- ✅ 调整布局和样式
- ✅ 添加新的动画效果
- ✅ 优化移动端显示

### ⚡ 功能增强
- ✅ 添加新的功能模块
- ✅ 优化页面加载速度
- ✅ 改进搜索功能
- ✅ 增强交互体验

### 🔧 技术维护
- ✅ 修复bug和兼容性问题
- ✅ 更新依赖和脚本
- ✅ 优化代码结构
- ✅ 添加新的工具脚本

### 📊 数据管理
- ✅ 批量处理链接数据
- ✅ 自动化图标下载
- ✅ 数据格式转换

## 📂 文件结构

```
.
├── index.html              # 主页
├── link.html              # 链接库页面
├── links.json             # 链接数据
├── links.version.json     # 版本信息
├── touxiang.png          # 头像图片
├── RefuseToResponse.html  # 设备限制提示页面（仅Apple设备）
├── sw.js                  # Service Worker
├── download_favicon.py    # 图标下载脚本
├── fetch_icons.py         # 图标获取脚本
├── icon/                  # 图标目录
└── styles/                # 样式文件
    ├── variables.css      # CSS变量
    ├── base.css          # 基础样式
    ├── components.css    # 组件样式
    ├── layout.css        # 布局样式
    ├── animations.css    # 动画样式
    ├── index.css         # 主页样式
    ├── link.css          # 链接页样式
    ├── loading.css       # 加载样式
    └── safe-area.css     # 安全区域样式
```

## 🔗 如何添加新链接

1. 编辑 `links.json` 文件
2. 按以下格式添加新条目：
```json
{
  "name": "网站名称",
  "url": "https://example.com"
}
```
3. 运行 `python fetch_icons.py` 自动获取图标（可选）
4. 提交更改并推送到GitHub

## 💡 快速开始

### 本地预览
只需在浏览器中打开 `index.html` 或 `link.html` 即可预览。

### 部署到GitHub Pages
1. 推送代码到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择主分支作为发布源
4. 访问 `https://xstime.github.io` 查看网站

## 🎯 使用Python脚本

### 下载网站图标
```bash
python download_favicon.py
```

### 批量获取图标
```bash
python fetch_icons.py
```

## 📞 联系方式

- 📧 Email: yoaholyn@icloud.com
- 🐱 GitHub: [@Xstime](https://github.com/Xstime)

## 📄 许可证

此项目为个人项目，可自由使用和修改。

---

**有任何问题或需要帮助？** 随时联系我或在Issues中提问！
