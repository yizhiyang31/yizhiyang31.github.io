---
title: 使用 VuePress Theme Hope 搭建技术博客
author: yizhiyang
date: 2026-11-18
category:
  - 前端
tag:
  - VuePress
  - 工程化
  - 部署
sticky: 5
star: true
---

记录如何用 VuePress 2 与 vuepress-theme-hope 搭建一个适合长期更新的中文技术博客，包括文章组织、标签分类、全文搜索和 GitHub Pages 部署。

<!-- more -->

## 为什么选择 VuePress

VuePress 以 Markdown 为中心，适合把零散的学习笔记沉淀为结构化内容。配合 `vuepress-theme-hope` 后，不需要自己实现博客列表、标签、时间线和搜索页面。

## 环境要求

本项目基于 VuePress 2 与 `vuepress-theme-hope`，需要 Node.js 22.18.0 或更高版本：

```bash
node --version   # 应 >= v22.18.0
npm --version
```

## 安装依赖

在仓库根目录执行：

```bash
npm install
```

依赖会安装到项目根目录的 `node_modules/`，该目录已写入 `.gitignore`，无需提交到仓库。

## 本地运行

开发模式下启动本地预览服务：

```bash
npm run dev
```

默认访问 `http://localhost:8080`。修改 Markdown 或配置后页面会自动热更新，适合边写边看。

## 构建站点

```bash
npm run build
```

构建产物输出到 `docs/.vuepress/dist/`，这个目录就是 GitHub Pages 需要发布的静态文件。

## 目录结构

```bash
docs/
├── README.md              # 首页
├── about.md               # 关于页
├── 404.md                 # 404 页
├── posts/
│   ├── frontend/          # 前端文章
│   └── backend/           # 后端文章
└── .vuepress/
    ├── config.ts          # 站点与主题配置
    └── styles/index.scss  # 自定义样式
```

## 启用博客能力

主题的博客功能默认关闭，需要在主题选项中开启：

```ts
export default hopeTheme({
  plugins: {
    blog: {
      excerptLength: 220,
    },
    slimsearch: {
      indexContent: true,
    },
  },
});
```

开启后，主题会自动生成以下页面：

| 页面 | 路径 |
| --- | --- |
| 文章列表 | `/article/` |
| 分类索引 | `/category/` |
| 标签索引 | `/tag/` |
| 时间归档 | `/timeline/` |

## 文章 Frontmatter

```yaml
---
title: 文章标题
author: yizhiyang
date: 2026-11-18
category:
  - 前端
tag:
  - VuePress
  - 工程化
---
```

使用 `<!-- more -->` 可以控制文章列表中显示的摘要，避免列表页过长。

## 部署到 GitHub Pages

在仓库中添加 GitHub Actions 工作流，推送到 `main` 分支后自动构建并发布。站点默认访问地址为 `https://yizhiyang31.github.io/`。完整的 Workflow 配置与部署注意事项见《用 GitHub Actions 自动部署静态站点》。
