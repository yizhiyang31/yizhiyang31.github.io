---
title: 第 5 章 React 路由
excerpt: SPA 与路由的理解、react-router-dom 常用 API，以及基本路由、嵌套路由、参数传递与跳转方式。
author: yizhiyang
date: 2026-11-27
category:
  - 前端
tag:
  - React
  - react-router-dom
  - 路由
  - 学习笔记
---

# 第 5 章 React 路由

SPA 与路由的理解、react-router-dom 常用 API，以及基本路由、嵌套路由、参数传递与跳转方式。

<!-- more -->

<!-- PDF 第 21 页 -->

# 第5 章：React 路由

## 5.1. 相关理解

### 5.1.1. SPA 的理解

1. 单页Web 应用（single page web application，SPA）。
2. 整个应用只有一个完整的页面。
3. 点击页面中的链接不会刷新页面，只会做页面的局部更新。
4. 数据都需要通过ajax 请求获取, 并在前端异步展现。

### 5.1.2. 路由的理解

1. 什么是路由?
   1. 一个路由就是一个映射关系(key:value)
   2. key 为路径, value 可能是function 或component
2. 路由分类
   1. 后端路由：
      1) 理解：value 是function, 用来处理客户端提交的请求。
      2) 注册路由：`router.get(path, function(req, res))`
      3) 工作过程：当node 接收到一个请求时, 根据请求路径找到匹配的路由, 调用路由中的函数来处理请求, 返回响应数据
   2. 前端路由：
      1) 浏览器端路由，value 是component，用于展示页面内容。
      2) 注册路由: `<Route path="/test" component={Test}>`
      3) 工作过程：当浏览器的path 变为/test 时, 当前路由组件就会变为Test 组件

<!-- PDF 第 22 页 -->

### 5.1.3. react-router-dom 的理解

1. react 的一个插件库。
2. 专门用来实现一个SPA 应用。
3. 基于react 的项目基本都会用到此库。

## 5.2. react-router-dom 相关API

### 5.2.1. 内置组件

1. `<BrowserRouter>`
2. `<HashRouter>`
3. `<Route>`
4. `<Redirect>`
5. `<Link>`
6. `<NavLink>`
7. `<Switch>`

### 5.2.2. 其它

1. history 对象
2. match 对象
3. withRouter 函数

## 5.3. 基本路由使用

### 5.3.1. 效果

<!-- PDF 第 23 页 -->

![GIF 图标](./images/react_p23_1_gif.jpeg) react-router demo1.gif

### 5.3.2. 准备

1. 下载react-router-dom: `npm install --save react-router-dom`
2. 引入bootstrap.css: `<link rel="stylesheet" href="/css/bootstrap.css">`

## 5.4. 嵌套路由使用

效果

![GIF 图标](./images/react_p23_2_gif.jpeg) react-router demo2.gif

## 5.5. 向路由组件传递参数数据

效果

![GIF 图标](./images/react_p23_3_gif.jpeg) react-router demo3.gif

## 5.6. 多种路由跳转方式

效果

![GIF 图标](./images/react_p23_4_gif.jpeg) react-router demo4.gif
