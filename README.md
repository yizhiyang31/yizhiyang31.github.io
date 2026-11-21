# 易只烊技术博客

基于 VuePress 2 与 `vuepress-theme-hope` 搭建的中文技术博客，主要用于记录前端、后端学习与工程化实践。站点部署在 GitHub Pages。

## 环境要求

- Node.js：`>= 22.18.0`
- pnpm：`10.x`
- 包管理器：推荐 pnpm，CI 使用 npm

如果本机使用 nvm-windows，可以先执行：

```powershell
nvm install 22.22.2
nvm use 22.22.2
node -v
```

若 `pnpm` 命令不存在，可用 Node 自带的 Corepack 启用：

```powershell
corepack prepare pnpm@10.32.1 --activate
corepack enable pnpm
pnpm -v
```

## 安装依赖

在项目根目录执行：

```powershell
pnpm install
```

如果之前用低版本 Node 安装过依赖，出现 rolldown 原生绑定相关错误，可切换到 Node 22 后重新安装：

```powershell
pnpm install --force
```

## 本地运行

启动开发服务器：

```powershell
pnpm dev
```

默认访问 `http://localhost:8080/`。如果 8080 被占用，VuePress 会自动尝试下一个端口，请以终端输出为准。

构建静态站点：

```powershell
pnpm build
```

构建产物目录：

```text
docs/.vuepress/dist
```

本地预览构建结果：

```powershell
pnpm preview
```

也可以使用 npm：

```powershell
npm install
npm run dev
npm run build
```

## 项目结构

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 自动部署配置
├── docs/
│   ├── .vuepress/
│   │   ├── config.ts           # 站点、主题、导航、侧边栏、插件配置
│   │   ├── client.ts           # 客户端布局逻辑：标签首页、分类页默认跳首篇
│   │   ├── styles/
│   │   │   └── index.scss      # 全局样式、主色、导航与侧边栏视觉
│   │   ├── public/             # 静态资源：favicon、logo、头像、背景图、.nojekyll
│   │   └── dist/               # 构建产物，本地构建后生成
│   ├── posts/
│   │   ├── backend/
│   │   │   └── golang/         # Go 语言系列文章
│   │   └── engineering/        # 工程化文章
│   ├── public/                 # 旧静态资源目录，当前站点实际使用 .vuepress/public
│   ├── README.md               # 博客首页
│   └── 404.md                  # 404 页面
├── package.json                # 依赖与脚本
├── pnpm-lock.yaml              # pnpm 依赖锁定文件
└── package-lock.json           # npm 依赖锁定文件，CI 使用
```

## 常用配置位置

### 站点信息与主题配置

`docs/.vuepress/config.ts`：

- 站点标题、描述、语言
- 顶部导航与 `activeMatch` 高亮规则
- 侧边栏结构与文章分组
- Blog、Sitemap、SEO、SlimSearch 等插件配置
- 自动目录页的中文标题映射
- 主色对应的浏览器 `theme-color`

### 客户端布局逻辑

`docs/.vuepress/client.ts`：

- `/tag/` 标签首页默认展示文章数最多的标签内容
- `/category/backend/`、`/category/engineering/` 默认跳转到侧边栏第一篇文章
- 分类页复用自定义 Blog 布局

### 全局样式

`docs/.vuepress/styles/index.scss`：

- 项目主色：`--vp-c-brand-1`，当前为 `#2a69ed`
- 顶部导航胶囊样式
- 侧边栏卡片化样式与间距
- 面包屑、时间线、代码块等细节样式
- 隐藏文章底部“上一篇 / 下一篇”

## 新增文章

文章放在 `docs/posts/` 下，建议使用以下 frontmatter：

```md
---
title: 文章标题
author: yizhiyang
date: 2026-11-21
category:
  - 后端
tag:
  - Go
  - 学习笔记
---
```

约定：

- `category` 决定文章归类到哪个 `/category/.../` 页面
- 目录结构会影响面包屑，目录名建议与分类保持一致
- 工程化文章放到 `docs/posts/engineering/`
- Go 系列文章放到 `docs/posts/backend/golang/`
- 如果修改或迁移文章路径，可在 frontmatter 中使用 `redirectFrom` 保留旧链接

## 部署

推送到 `main` 分支后，`.github/workflows/deploy.yml` 会自动执行：

1. 使用 Node.js `22.18.0`
2. 执行 `npm install`
3. 执行 `npm run build`
4. 确保 `docs/.vuepress/dist/.nojekyll` 存在
5. 上传并部署 `docs/.vuepress/dist`

部署脚本中 Node 版本与项目 `package.json` 的 `engines.node` 保持一致。

## 常见问题

### Node 版本过低

如果出现 `Unsupported engine` 或 rolldown 原生绑定错误，请确认当前 Node 版本：

```powershell
node -v
```

需要显示 `v22.x`。切换后删除旧依赖并重新安装：

```powershell
pnpm install --force
```

### pnpm 命令不存在

执行：

```powershell
corepack enable pnpm
```

然后重新打开终端。

### 修改主色

主色统一在 `docs/.vuepress/styles/index.scss` 中维护，同时记得同步 `docs/.vuepress/config.ts` 里的 `theme-color`。
