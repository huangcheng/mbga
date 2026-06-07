# Make Bilibili Great Again (MBGA)

**让你的B站体验更纯粹。**

MBGA 是一款浏览器扩展，帮你过滤B站上不想看的内容：直播、课堂、广告、特定UP主、关键词……你说了算。

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/YOUR_EXTENSION_ID?style=flat-square&color=4285F4&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/mbga/YOUR_EXTENSION_ID)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/huangcheng/mbga?style=flat-square&color=yellow)](https://github.com/huangcheng/mbga/stargazers)

---

## 功能特性

### 内容过滤

| 功能 | 说明 |
|------|------|
| **类型过滤** | 屏蔽直播、课堂、番剧、专栏、动态、广告、赛事、综艺等 |
| **关键词过滤** | 按标题、作者匹配关键词，支持大小写敏感 |
| **UP主黑名单** | 屏蔽指定UP主的所有内容 |
| **视频黑名单** | 屏蔽指定BV号的视频 |
| **徽章检测** | 自动识别赛事、综艺、番剧等徽章标签 |
| **广告检测** | 自动识别并屏蔽推广内容 |

### 用户体验

| 功能 | 说明 |
|------|------|
| **快速屏蔽** | 右键菜单一键屏蔽UP主或视频 |
| **导入导出** | JSON格式备份和恢复配置 |
| **导入B站黑名单** | 一键导入你在B站拉黑的UP主 |
| **主题切换** | 支持系统/浅色/深色三种主题 |
| **暂停过滤** | 临时暂停30分钟、1小时或2小时 |

### 社区功能

| 功能 | 说明 |
|------|------|
| **社区举报** | 举报垃圾内容，帮助维护社区环境 |
| **公开黑名单** | 社区维护的公开屏蔽名单 |
| **管理后台** | 审核举报、管理黑名单的管理界面 |

---

## 安装

### 从 Chrome 商店安装（推荐）

> 即将上架

### 手动安装（开发者模式）

1. 从 [GitHub Releases](https://github.com/huangcheng/mbga/releases/latest) 下载最新版本
2. 解压到任意目录
3. 打开 Chrome，访问 `chrome://extensions/`
4. 开启右上角「开发者模式」
5. 点击「加载已解压的扩展程序」
6. 选择解压后的目录

---

## 使用方法

### 基本使用

1. 安装扩展后，访问 [bilibili.com](https://www.bilibili.com)
2. 点击浏览器工具栏中的 MBGA 图标打开控制面板
3. 点击「打开设置」配置过滤规则

### 添加过滤规则

**屏蔽内容类型：**
1. 打开设置页面
2. 在「屏蔽内容类型」区域，点击要屏蔽的类型（如直播、课堂）
3. 已屏蔽的类型会高亮显示

**添加关键词：**
1. 在「关键词屏蔽」区域输入关键词
2. 点击「添加」按钮
3. 匹配的视频会被自动隐藏

**添加UP主/视频：**
1. 在「UP主黑名单」或「视频黑名单」区域输入ID
2. 点击「添加」按钮

### 快速屏蔽

1. 在B站页面右键点击任意视频
2. 选择「屏蔽UP主」或「屏蔽此视频」
3. 视频会被立即隐藏

### 导入导出

1. 打开设置页面，切换到「导入导出」标签
2. 点击「导出配置」下载备份文件
3. 点击「选择文件导入」恢复配置

---

## 开发

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/huangcheng/mbga.git
cd mbga

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test:run

# 构建生产版本
npm run build
```

### 项目结构

```
mbga/
├── src/
│   ├── background/          # Service Worker
│   ├── contents/            # 内容脚本
│   │   ├── bilibili.ts      # 主内容脚本
│   │   ├── filters/         # 过滤器实现
│   │   └── ui/              # UI 组件
│   ├── popup/               # 弹出窗口
│   ├── options/             # 设置页面
│   ├── lib/                 # 共享库
│   └── assets/              # 图标、图片
├── services/
│   └── edge/                # Cloudflare Worker 后端
├── data/                    # 公开数据快照
├── tests/                   # 测试文件
└── docs/                    # 文档
```

### 测试

```bash
# 运行所有单元测试
npm run test:run

# 运行 E2E 测试
npm run test:e2e

# 监听模式
npm run test
```

### 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Plasmo (跨浏览器扩展框架) |
| UI | React + Tailwind CSS |
| 状态管理 | Zustand |
| 存储 | chrome.storage.local |
| 测试 | Vitest + Playwright |
| 后端 | Cloudflare Worker + D1 |
| API | Hono |

---

## 架构设计

### 内容过滤流程

```
页面加载
  ↓
内容脚本注入 (document_start)
  ↓
隐藏 Feed (防止闪烁)
  ↓
检测视频卡片
  ↓
按优先级执行过滤:
  1. 类型过滤 (最快)
  2. ID 过滤
  3. 关键词过滤
  4. 广告检测
  ↓
屏蔽匹配的内容
  ↓
显示 Feed
```

### 数据存储

```
chrome.storage.local
├── profile          # 用户配置（过滤规则）
├── settings         # 设置（启用/暂停等）
├── stats            # 统计数据
└── theme            # 主题偏好
```

---

## 社区功能

### 后端部署

```bash
# 进入后端目录
cd services/edge

# 安装依赖
npm install

# 初始化数据库
npm run db:init

# 部署到 Cloudflare
npm run deploy
```

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/v1/blacklist` | GET | 获取公开黑名单 |
| `/v1/whitelist` | GET | 获取公开白名单 |
| `/v1/check?ids=...` | GET | 批量检查 ID |
| `/v1/report` | POST | 提交举报 |
| `/v1/stats` | GET | 获取统计信息 |
| `/list` | GET | 公开列表页面 |

### 管理后台

访问 `/admin` 管理举报和黑名单（需要 ADMIN_TOKEN）。

---

## 路线图

### v1.0 ✅
- [x] 基础过滤（类型、关键词、ID）
- [x] 快速屏蔽菜单
- [x] 导入导出
- [x] 主题系统
- [x] 导入B站黑名单

### v1.1 (计划中)
- [ ] 社区功能上线
- [ ] 公开黑名单同步
- [ ] 举报系统

### v2.0 (未来)
- [ ] AI 封面分析
- [ ] 弹幕过滤
- [ ] 多配置文件

---

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

---

## 许可证

[MIT License](LICENSE)

---

## 致谢

- [Plasmo](https://www.plasmo.com/) - 跨浏览器扩展框架
- [Bilibili](https://www.bilibili.com/) - 让我们有东西可过滤
- 所有贡献者和用户

---

**MBGA** - 让B站更美好 ✨
