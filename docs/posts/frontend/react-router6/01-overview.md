---
title: React Router 6 快速上手：概述
excerpt: React Router 6 的 npm 包组成，以及与 5.x 版本相比的主要变化。
author: yizhiyang
date: 2026-11-27
category:
  - 前端
tag:
  - React
  - React Router
  - 路由
  - 学习笔记
---

# React Router 6 快速上手：概述

React Router 6 的 npm 包组成，以及与 5.x 版本相比的主要变化。

<!-- more -->

<!-- PDF 第 1 页 -->

# React Router 6 快速上手

![React Router](./images/react-router6_p1_1.png)

## 1.概述

1. React Router 以三个不同的包发布到 npm 上，它们分别为：
   1. react-router: 路由的核心库，提供了很多的：组件、钩子。
   2. react-router-dom: 包含react-router所有内容，并添加一些专门用于 DOM 的组件，例如 `<BrowserRouter>` 等 。
   3. react-router-native: 包括react-router所有内容，并添加一些专门用于ReactNative的API，例如: `<NativeRouter>` 等。
2. 与React Router 5.x 版本相比，改变了什么？
   1. 内置组件的变化：移除`<Switch/>` ，新增 `<Routes/>` 等。
   2. 语法的变化：component={About} 变为 `element={<About/>}` 等。
   3. 新增多个hook：useParams 、useNavigate 、useMatch 等。
   4. 官方明确推荐函数式组件了！！！

      ......
