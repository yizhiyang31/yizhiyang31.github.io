---
title: 用 GitHub Actions 自动部署静态站点
author: yizhiyang
date: 2026-11-08
category:
  - 后端
tag:
  - 部署
  - 工程化
  - GitHub
---

记录将静态站点推送到仓库后自动构建并发布到 GitHub Pages 的最小工作流配置。

<!-- more -->

## 工作流文件

将下面的内容保存为 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Site

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vuepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 仓库设置

进入仓库的 **Settings → Pages**，将 Build and deployment 的 Source 设置为 **GitHub Actions**。此后推送到 `master` 分支即可自动发布。

## 排错清单

- 构建命令是否与本地一致。
- `npm ci` 是否存在对应的 `package-lock.json`。
- Pages 权限是否为 `read` / `write` 组合正确。
- 输出目录是否指向 VuePress 的 `dist` 目录。
- 根路径站点是否需要保留 `.nojekyll` 文件。
