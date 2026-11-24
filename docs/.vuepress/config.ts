import { fileURLToPath } from "node:url";
import { viteBundler } from "@vuepress/bundler-vite";
import { defineUserConfig } from "vuepress";
import { hopeTheme } from "vuepress-theme-hope";
import { booksStaticPlugin } from "./plugins/booksStatic";

const catalogTitles: Record<string, string> = {
  "/books/": "书籍",
  "/posts/": "文章",
  "/posts/backend/": "后端",
  "/posts/backend/golang/": "Golang基础",
  "/posts/backend/gin/": "Gin 框架",
  "/posts/backend/mysql/": "MySQL",
  "/posts/backend/go-zero/": "go-zero",
  "/posts/backend/goframe/": "GoFrame",
  "/posts/backend/dbx/": "DBX",
  "/posts/python/": "Python 基础",
  "/posts/frontend/": "前端",
  "/posts/frontend/vue3/": "Vue3 学习笔记",
  "/posts/engineering/": "工程化",
  "/tools/": "工具",
};

const slugMap: Record<string, string> = {
  前端: "frontend",
  后端: "backend",
  VuePress: "vuepress",
  "Theme Hope": "theme-hope",
  工程化: "engineering",
  部署: "deploy",
  博客: "blog",
  JavaScript: "javascript",
  异步编程: "async",
  CSS: "css",
  响应式: "responsive",
  "Node.js": "nodejs",
  API: "api",
  MySQL: "mysql",
  数据库: "database",
  性能优化: "performance",
  HTTP: "http",
  GitHub: "github",
  "GitHub Actions": "github-actions",
  "GitHub Pages": "github-pages",
  "CI/CD": "ci-cd",
  "学习笔记": "notes",
  Go: "go",
  Gin: "gin",
  "go-zero": "go-zero",
  GoFrame: "goframe",
  "数据类型": "datatype",
  "并发": "concurrency",
  "泛型": "generics",
};

const slugify = (name: string): string =>
  slugMap[name] ?? name.replace(/\s+/g, "-").replace(/[:?*|\\/<>]/g, "").toLowerCase();

const displayNames: Record<string, string> = {};
Object.entries(slugMap).forEach(([name, slug]) => {
  displayNames[name] = name;
  displayNames[slug] = name;
});

const golangArticles = [
  { text: "Go 语言介绍与环境搭建", link: "/posts/backend/golang/01-go-intro-and-setup.html" },
  { text: "变量、常量与命名规范", link: "/posts/backend/golang/02-variables-and-constants.html" },
  { text: "基本数据类型", link: "/posts/backend/golang/03-basic-data-types.html" },
  { text: "类型转换与运算符", link: "/posts/backend/golang/04-type-conversion-and-operators.html" },
  { text: "流程控制", link: "/posts/backend/golang/05-control-flow.html" },
  { text: "数组", link: "/posts/backend/golang/06-arrays.html" },
  { text: "切片", link: "/posts/backend/golang/07-slices.html" },
  { text: "排序与 sort 包", link: "/posts/backend/golang/08-sort.html" },
  { text: "map 详解", link: "/posts/backend/golang/09-map.html" },
  { text: "指针", link: "/posts/backend/golang/10-pointer.html" },
  { text: "函数详解", link: "/posts/backend/golang/11-functions.html" },
  { text: "time 包与日期函数", link: "/posts/backend/golang/12-time.html" },
  { text: "结构体详解", link: "/posts/backend/golang/13-struct.html" },
  { text: "结构体与 JSON 相互转换", link: "/posts/backend/golang/14-json.html" },
  { text: "包管理与 go mod", link: "/posts/backend/golang/15-gomod-and-packages.html" },
  { text: "接口详解", link: "/posts/backend/golang/16-interface.html" },
  { text: "goroutine 与 channel 并发", link: "/posts/backend/golang/17-concurrency.html" },
  { text: "反射", link: "/posts/backend/golang/18-reflect.html" },
  { text: "文件与目录操作", link: "/posts/backend/golang/19-file-operations.html" },
  { text: "泛型", link: "/posts/backend/golang/20-generics.html" },
];

const ginArticles = [
  { text: "介绍与环境搭建", link: "/posts/backend/gin/01-intro-and-setup.html" },
  { text: "路由详解", link: "/posts/backend/gin/02-routing.html" },
  { text: "HTML 模板渲染与静态文件", link: "/posts/backend/gin/03-template-and-static.html" },
  { text: "控制器与中间件", link: "/posts/backend/gin/04-controller-and-middleware.html" },
  { text: "文件上传与 Cookie/Session", link: "/posts/backend/gin/05-file-upload-and-cookie-session.html" },
  { text: "GORM 操作 MySQL", link: "/posts/backend/gin/06-gorm.html" },
  { text: "GORM 关联查询、事务与配置", link: "/posts/backend/gin/07-gorm-relations-and-config.html" },
];

const mysqlArticles = [
  { text: "数据库概述", link: "/posts/backend/mysql/01-database-overview.html" },
  { text: "MySQL 环境搭建", link: "/posts/backend/mysql/02-mysql-setup.html" },
  { text: "基本的 SELECT 语句", link: "/posts/backend/mysql/03-basic-select.html" },
  { text: "运算符", link: "/posts/backend/mysql/04-operators.html" },
  { text: "排序与分页", link: "/posts/backend/mysql/05-sorting-and-paging.html" },
  { text: "多表查询", link: "/posts/backend/mysql/06-joins.html" },
  { text: "单行函数", link: "/posts/backend/mysql/07-single-row-functions.html" },
  { text: "聚合函数", link: "/posts/backend/mysql/08-aggregate-functions.html" },
  { text: "子查询", link: "/posts/backend/mysql/09-subqueries.html" },
  { text: "创建和管理表", link: "/posts/backend/mysql/10-create-and-manage-tables.html" },
  { text: "数据处理之增删改", link: "/posts/backend/mysql/11-dml.html" },
  { text: "MySQL 数据类型精讲", link: "/posts/backend/mysql/12-data-types.html" },
  { text: "约束", link: "/posts/backend/mysql/13-constraints.html" },
  { text: "视图", link: "/posts/backend/mysql/14-views.html" },
  { text: "存储过程与函数", link: "/posts/backend/mysql/15-stored-procedures-and-functions.html" },
  { text: "变量、流程控制与游标", link: "/posts/backend/mysql/16-variables-control-flow-cursors.html" },
  { text: "触发器", link: "/posts/backend/mysql/17-triggers.html" },
  { text: "MySQL 8 其它新特性", link: "/posts/backend/mysql/18-mysql8-new-features.html" },
];

const goZeroArticles = [
  { text: "框架介绍与环境安装", link: "/posts/backend/go-zero/01-intro-and-setup.html" },
  { text: "项目创建与 API 语法", link: "/posts/backend/go-zero/02-project-and-api-syntax.html" },
  { text: "API 实战", link: "/posts/backend/go-zero/03-api-practice.html" },
  { text: "gRPC 微服务快速上手", link: "/posts/backend/go-zero/04-microservice.html" },
  { text: "集成 MySQL（sqlx）", link: "/posts/backend/go-zero/05-sqlx.html" },
  { text: "集成 GORM", link: "/posts/backend/go-zero/06-gorm.html" },
  { text: "关联查询、统一响应与 JWT", link: "/posts/backend/go-zero/07-relations-response-and-jwt.html" },
];

const goFrameArticles = [
  { text: "环境搭建与路由", link: "/posts/backend/goframe/01-setup-and-routing.html" },
  { text: "请求输入与响应输出", link: "/posts/backend/goframe/02-request-and-response.html" },
  { text: "数据库与 ORM", link: "/posts/backend/goframe/03-database.html" },
  { text: "模板引擎与静态资源", link: "/posts/backend/goframe/04-template-engine.html" },
  { text: "文件上传下载与数据校验", link: "/posts/backend/goframe/05-upload-and-validation.html" },
  { text: "Cookie、Session、JWT 与中间件", link: "/posts/backend/goframe/06-cookie-session-jwt-and-middleware.html" },
  { text: "常用组件、接口文档与构建打包", link: "/posts/backend/goframe/07-components-docs-and-build.html" },
  { text: "实战：图书管理 API", link: "/posts/backend/goframe/08-book-api-practice.html" },
];

const dbxArticles = [
  {
    text: "DBX 最佳实践：免费开源的数据库客户端",
    link: "/posts/backend/dbx/dbx-best-practices.html",
  },
];

const backendSeriesSidebar = [
  { text: "Golang基础", prefix: "/posts/backend/golang/", collapsible: true, children: golangArticles },
  { text: "Gin 框架", prefix: "/posts/backend/gin/", collapsible: true, children: ginArticles },
  { text: "GoFrame", prefix: "/posts/backend/goframe/", collapsible: true, children: goFrameArticles },
  { text: "MySQL", prefix: "/posts/backend/mysql/", collapsible: true, children: mysqlArticles },
  { text: "go-zero", prefix: "/posts/backend/go-zero/", collapsible: true, children: goZeroArticles },
  { text: "DBX", prefix: "/posts/backend/dbx/", collapsible: true, children: dbxArticles },
];

const pythonArticles = [
  { text: "第 1 章 必备基础知识", link: "/posts/python/01-fundamentals.html" },
  { text: "第 2 章 初识 Python", link: "/posts/python/02-first-python.html" },
  { text: "第 3 章 Python 核心基础", link: "/posts/python/03-core-basics.html" },
  { text: "第 4 章 流程控制语句", link: "/posts/python/04-control-flow.html" },
  { text: "第 5 章 函数入门", link: "/posts/python/05-functions.html" },
  { text: "第 6 章 数据容器", link: "/posts/python/06-data-containers.html" },
  { text: "第 7 章 面向对象", link: "/posts/python/07-oop.html" },
  { text: "第 8 章 函数进阶", link: "/posts/python/08-advanced-functions.html" },
  { text: "第 9 章 错误与异常", link: "/posts/python/09-errors.html" },
  { text: "第 10 章 模块与包", link: "/posts/python/10-modules.html" },
  { text: "第 11 章 迭代器 vs 生成器", link: "/posts/python/11-iterators-generators.html" },
  { text: "第 12 章 文件操作", link: "/posts/python/12-file-io.html" },
  { text: "第 13 章 进程与线程", link: "/posts/python/13-process-thread.html" },
  { text: "第 14 章 协程", link: "/posts/python/14-coroutine.html" },
];

const pythonSidebar = [{ text: "Python 基础", prefix: "/posts/python/", children: pythonArticles }];

const vue3Articles = [
  { text: "1. Vue3 简介", link: "/posts/frontend/vue3/01-vue3-intro.html" },
  { text: "2. 创建 Vue3 工程", link: "/posts/frontend/vue3/02-create-vue3-project.html" },
  { text: "3. Vue3 核心语法", link: "/posts/frontend/vue3/03-core-syntax.html" },
  { text: "4. 路由", link: "/posts/frontend/vue3/04-router.html" },
  { text: "5. Pinia", link: "/posts/frontend/vue3/05-pinia.html" },
  { text: "6. 组件通信", link: "/posts/frontend/vue3/06-component-communication.html" },
  { text: "7. 其它 API", link: "/posts/frontend/vue3/07-other-apis.html" },
  { text: "8. Vue3 新组件", link: "/posts/frontend/vue3/08-new-components.html" },
];

const frontendSidebar = [
  { text: "Vue3 学习笔记", prefix: "/posts/frontend/vue3/", collapsible: true, children: vue3Articles },
  { text: "一小时快速上手 Electron", link: "/posts/frontend/electron-quick-start.html" },
  { text: "TypeScript 极速梳理", link: "/posts/frontend/typescript-quick-review.html" },
];

const backendCategorySidebar = [
  { text: "Python 基础", prefix: "/posts/python/", children: pythonArticles },
  ...backendSeriesSidebar,
];

const vuepressArticles = [
  {
    text: "使用 VuePress Theme Hope 搭建技术博客",
    link: "/posts/engineering/vuepress-theme-hope-blog.html",
  },
];

const deployArticles = [
  {
    text: "用 GitHub Actions 自动部署静态站点",
    link: "/posts/engineering/github-pages-deploy.html",
  },
];

const engineeringSidebar = [
  {
    text: "VuePress",
    collapsible: true,
    children: vuepressArticles,
  },
  {
    text: "部署",
    collapsible: true,
    children: deployArticles,
  },
];

const engineeringCategorySidebar = [
  {
    text: "VuePress",
    children: vuepressArticles,
  },
  {
    text: "部署",
    children: deployArticles,
  },
];

export default defineUserConfig({
  base: "/",
  lang: "zh-CN",
  title: "易只烊",
  description: "记录前端、后端开发中的技术学习、实践总结与问题复盘。",
  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#2a69ed" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Serif+SC:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
    ],
  ],
  bundler: viteBundler({
    viteOptions: {
      resolve: {
        alias: [
          {
            find: /^@theme-hope\/components\/blog\/InfoList(?:\.js)?$/,
            replacement: fileURLToPath(
              new URL("./components/SideInfoList.ts", import.meta.url),
            ),
          },
        ],
      },
      ssr: {
        noExternal: ["@vuepress/search-helper"],
      },
      plugins: [booksStaticPlugin()],
    },
  }),
  theme: hopeTheme({
    hostname: "https://yizhiyang31.github.io",
    author: {
      name: "yizhiyang",
      url: "https://github.com/yizhiyang31",
    },
    logo: "/logo.svg",
    favicon: "/favicon.svg",
    license: "MIT",
    repo: "yizhiyang31/yizhiyang31.github.io",
    docsBranch: "main",
    docsDir: "docs",
    editLink: false,
    sidebar: {
      "/books/": false,
      "/tools/": false,
      "/category/backend/": backendCategorySidebar,
      "/category/frontend/": frontendSidebar,
      "/category/engineering/": engineeringCategorySidebar,
      "/category/vuepress/": [
        {
          text: "VuePress",
          children: vuepressArticles,
        },
      ],
      "/category/deploy/": [
        {
          text: "部署",
          children: deployArticles,
        },
      ],
      "/category/": false,
      "/tag/": false,
      "/article/": false,
      "/star/": false,
      "/timeline/": false,
      "/posts/backend/": backendSeriesSidebar,
      "/posts/python/": pythonSidebar,
      "/posts/frontend/": frontendSidebar,
      "/posts/engineering/github-pages-deploy.html": engineeringSidebar,
      "/posts/engineering/vuepress-theme-hope-blog.html": engineeringSidebar,
      "/posts/": [
        {
          text: "前端",
          link: "/category/frontend/",
          children: frontendSidebar,
        },
        {
          text: "工程化",
          link: "/category/engineering/",
          children: engineeringSidebar,
        },
        {
          text: "后端",
          link: "/category/backend/",
          children: backendSeriesSidebar,
        },
        {
          text: "Python 基础",
          link: "/posts/python/01-fundamentals.html",
          children: pythonArticles,
        },
      ],
    },
    navbar: [
      { text: "首页", link: "/" },
      {
        text: "前端",
        link: "/posts/frontend/vue3/01-vue3-intro.html",
        activeMatch: "^/(category/frontend/|posts/frontend/)",
      },
      {
        text: "后端",
        link: "/category/backend/",
        activeMatch: "^/(category/backend/|posts/backend/(golang|gin|mysql|go-zero|goframe|dbx)/)",
      },
      {
        text: "Python",
        link: "/posts/python/01-fundamentals.html",
        activeMatch: "^/posts/python/",
      },
      {
        text: "工程化",
        link: "/category/engineering/",
        activeMatch: "^/(category/(engineering|vuepress|deploy)/|posts/engineering/)",
      },
      { text: "书籍", link: "/books/" },
      { text: "工具", link: "/tools/" },
      { text: "归档", link: "/timeline/" },
    ],
    blog: {
      avatar: "/avatar.jpg",
      articleInfo: ["Author", "Date", "Category", "Tag", "ReadingTime", "Word"],
    },
    locales: {
      "/": {
        blogLocales: {
          article: "文章",
          articleList: "文章列表",
          category: "分类",
          tag: "标签",
          timeline: "归档",
          timelineTitle: "文章归档",
          all: "全部",
          intro: "简介",
          star: "精选",
          ...displayNames,
        },
        footer: "© 2026 yizhiyang · 用 Markdown 记录技术成长",
        metaLocales: {
          author: "作者",
          date: "写作日期",
          tag: "标签",
          category: "分类",
          readingTime: "预计阅读",
          words: "字数",
          toc: "本页目录",
          prev: "上一篇",
          next: "下一篇",
          editLink: "编辑此页",
        },
      },
    },
    markdown: {
      highlighter: {
        type: "shiki",
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
        langs: [
          "go",
          "ts",
          "js",
          "vue",
          "html",
          "css",
          "bash",
          "json",
          "sql",
          "http",
          "diff",
        ],
        lineNumbers: true,
      },
      codeTabs: true,
    },
    plugins: {
      catalog: {
        frontmatter: (path) => ({
          article: false,
          feed: false,
          sitemap: false,
          ...(catalogTitles[path]
            ? { title: catalogTitles[path], shortTitle: catalogTitles[path] }
            : {}),
          ...(path === "/posts/" ? { breadcrumbExclude: true } : {}),
        }),
      },
      blog: {
        slugify,
        excerptLength: 220,
      },
      git: {
        createdTime: false,
        updatedTime: false,
        contributors: false,
        changelog: false,
      },
      slimsearch: {
        indexContent: true,
        filter: (page) => page.frontmatter.article !== false,
        customFields: [
          {
            getter: (page) => (page.frontmatter.category as string[] | undefined) ?? [],
            formatter: "分类：$content",
          },
          {
            getter: (page) => (page.frontmatter.tag as string[] | undefined) ?? [],
            formatter: "标签：$content",
          },
        ],
        locales: {
          "/": {
            placeholder: "搜索文章（Ctrl/Cmd + K）",
            search: "搜索",
            clear: "清空",
            remove: "移除",
            searching: "搜索中...",
            cancel: "取消",
            defaultTitle: "搜索",
            select: "选择",
            navigate: "导航",
            autocomplete: "自动补全",
            exit: "关闭",
            loading: "加载中",
            queryHistory: "搜索历史",
            resultHistory: "访问历史",
            emptyHistory: "暂无历史记录",
            emptyResult: "没有找到相关内容",
          },
        },
      },
    },
  }, { custom: true }),
});
