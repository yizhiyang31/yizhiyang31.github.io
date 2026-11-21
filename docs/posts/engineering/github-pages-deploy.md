---
title: 用 GitHub Actions 自动部署静态站点
redirectFrom: /posts/backend/github-pages-deploy.html
author: yizhiyang
date: 2026-11-08
category:
  - 工程化
tag:
  - 部署
  - 工程化
  - GitHub
---

记录将 VuePress 站点推送到仓库后自动构建并发布到 GitHub Pages 的完整配置，以及实际部署时踩过的坑。

<!-- more -->

## 前置条件

1. 仓库需要是 **Public**。免费账户无法用私有仓库发布公开的 Pages 站点，否则访问地址会显示 `Site not found`。
2. 进入 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**。这一步必须手动完成，工作流本身无法替你启用 Pages。
3. 用户站点仓库名需与用户名一致（如 `yizhiyang31/yizhiyang31.github.io`），这样访问地址才是根路径 `https://yizhiyang31.github.io/`。

## 工作流文件

将下面的内容保存为 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22.18.0"

      - name: Install dependencies
        run: npm install --no-audit --no-fund

      - name: Build site
        run: npm run build

      - name: Ensure .nojekyll
        run: touch docs/.vuepress/dist/.nojekyll

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload site artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vuepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 注意事项

### 1. 分支名必须一致

`on.push.branches` 要与本地推送的分支一致。如果本地是 `main` 而工作流监听 `master`，推送不会触发部署。站点配置里的 `docsBranch`（「编辑此页」链接指向的分支）也要同步修改。

### 2. Node 版本要满足 engines

`package.json` 中若声明了 `"engines": { "node": ">=22.18.0" }`，CI 的 Node 版本应显式锁定到满足要求的值，例如 `"22.18.0"`。只写 `22` 可能解析到不满足条件的版本。

### 3. 锁文件里不要出现国内镜像地址

这是最容易踩的坑。如果 `package-lock.json` 中的 `resolved` 字段指向 `registry.npmmirror.com`，GitHub Actions 在境外访问会失败，`npm ci` 会在几秒内报错退出。检查并统一为 npm 官方源：

```bash
grep "resolved" package-lock.json | head
```

若发现镜像地址，应重新生成锁文件，或批量替换 `https://registry.npmmirror.com/` 为 `https://registry.npmjs.org/`。 integrity 校验值基于包内容，与下载源无关，替换后仍然有效。

### 4. npm ci 与 npm install 的选择

`npm ci` 要求 `package-lock.json` 与 `package.json` 严格一致，且会清理 `node_modules` 后重装，速度更快但容错性差。若 CI 环境差异导致 `npm ci` 失败，可临时改用 `npm install --no-audit --no-fund` 排查，但长期仍建议修复锁文件并回归 `npm ci`。

### 5. 保留 .nojekyll

GitHub Pages 默认会用 Jekyll 处理文件，可能忽略以下划线开头的目录。VuePress 产物中如果包含这类文件，需要在输出目录放置 `.nojekyll` 空文件禁用 Jekyll。工作流里的 `touch docs/.vuepress/dist/.nojekyll` 就是做这件事。

### 6. 关注输出目录

`upload-pages-artifact` 的 `path` 必须指向真实的构建产物目录。VuePress 默认是 `docs/.vuepress/dist`，如果自定义了 `--dest`，这里也要同步修改。目录写错会导致上传空产物或部署旧内容。

### 7. 首次部署失败是正常排查过程

在 **Actions** 页面点进失败的 run，展开红色步骤即可看到日志。常见失败步骤对应关系：

| 失败步骤 | 常见原因 |
| --- | --- |
| Checkout repository | 分支名错误、仓库权限不足 |
| Setup Node.js | 版本号不存在或不满足 engines |
| Install dependencies | 锁文件镜像地址、与 package.json 不一致 |
| Build site | 本地构建也能复现的配置或代码错误 |
| Configure / Deploy | Pages 未在 Settings 中启用、权限字段缺失 |

### 8. 手动重新触发

推送新提交会自动触发部署。如果需要不改代码重新发布，进入 **Actions → Deploy to GitHub Pages**，点击 **Run workflow** 手动运行。

## 排错清单

- 仓库是否为 Public，Pages 的 Source 是否已设为 GitHub Actions。
- 工作流监听的分支名与实际推送分支是否一致。
- `package-lock.json` 中是否残留国内镜像地址。
- Node 版本是否满足 `engines.node` 声明。
- 构建命令与输出目录是否与本地一致。
- `.nojekyll` 是否存在于最终产物中。
