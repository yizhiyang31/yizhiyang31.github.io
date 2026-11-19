import { viteBundler } from "@vuepress/bundler-vite";
import { defineUserConfig } from "vuepress";
import { hopeTheme } from "vuepress-theme-hope";

const slugMap: Record<string, string> = {
  前端: "frontend",
  后端: "backend",
  VuePress: "vuepress",
  工程化: "engineering",
  部署: "deploy",
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
  "学习笔记": "notes",
};

const slugify = (name: string): string =>
  slugMap[name] ?? name.replace(/\s+/g, "-").replace(/[:?*|\\/<>]/g, "").toLowerCase();

const displayNames: Record<string, string> = {};
Object.entries(slugMap).forEach(([name, slug]) => {
  displayNames[name] = name;
  displayNames[slug] = name;
});

export default defineUserConfig({
  base: "/",
  lang: "zh-CN",
  title: "易只烊",
  description: "记录前端、后端开发中的技术学习、实践总结与问题复盘。",
  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#2563eb" }],
  ],
  bundler: viteBundler({
    viteOptions: {
      ssr: {
        noExternal: ["@vuepress/search-helper"],
      },
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
    editLink: true,
    sidebar: false,
    navbar: [
      { text: "首页", link: "/" },
      { text: "文章", link: "/article/" },
      {
        text: "分类",
        children: [
          { text: "前端", link: "/category/frontend/" },
          { text: "后端", link: "/category/backend/" },
          { text: "全部标签", link: "/tag/" },
        ],
      },
      { text: "归档", link: "/timeline/" },
      { text: "关于", link: "/about/" },
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
  }),
});
