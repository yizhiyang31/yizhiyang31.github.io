---
title: React Router 6 快速上手：Component
excerpt: BrowserRouter、HashRouter、Routes、Route、Link、NavLink、Navigate 与 Outlet 等内置组件的说明与示例。
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

# React Router 6 快速上手：Component

BrowserRouter、HashRouter、Routes、Route、Link、NavLink、Navigate 与 Outlet 等内置组件的说明与示例。

<!-- more -->

<!-- PDF 第 1 页 -->

# 2.Component

## 1. `<BrowserRouter>`

1. 说明：`<BrowserRouter>` 用于包裹整个应用。
2. 示例代码：

```jsx
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    {/* 整体结构（通常为App组件） */}
  </BrowserRouter>,root
);
```

## 2. `<HashRouter>`

1. 说明：作用与`<BrowserRouter>` 一样，但`<HashRouter>` 修改的是地址栏的hash值。
2. 备注：6.x版本中`<HashRouter>` 、`<BrowserRouter>` 的用法与 5.x 相同。

<!-- PDF 第 2 页 -->

## 3. `<Routes/>` 与 `<Route/>`

1. v6版本中移出了先前的`<Switch>` ，引入了新的替代者：`<Routes>` 。
2. `<Routes>` 和 `<Route>` 要配合使用，且必须要用`<Routes>` 包裹`<Route>` 。
3. `<Route>` 相当于一个 if 语句，如果其路径与当前 URL 匹配，则呈现其对应的组件。
4. `<Route caseSensitive>` 属性用于指定：匹配时是否区分大小写（默认为 false）。
5. 当URL发生变化时，`<Routes>` 都会查看其所有子`<Route>` 元素以找到最佳匹配并呈现组件 。
6. `<Route>` 也可以嵌套使用，且可配合useRoutes() 配置 “路由表” ，但需要通过 `<Outlet>` 组件来渲染其子路由。
7. 示例代码：

```jsx
<Routes>
 /*path属性用于定义路径，element属性用于定义当前路径所对应的组件*/
    <Route path="/login" element={<Login />}></Route>

    /*用于定义嵌套路由，home是一级路由，对应的路径/home*/
    <Route path="home" element={<Home />}>
       /*test1 和 test2 是二级路由,对应的路径是/home/test1 或 /home/test2*/
      <Route path="test1" element={<Test/>}></Route>
      <Route path="test2" element={<Test2/>}></Route>
    </Route>

  //Route也可以不写element属性, 这时就是用于展示嵌套的路由 .所对应的路径是/users/xxx
    <Route path="users">
       <Route path="xxx" element={<Demo />} />
    </Route>
</Routes>
```

## 4. `<Link>`

1. 作用: 修改URL，且不发送网络请求（路由链接）。
2. 注意: 外侧需要用`<BrowserRouter>` 或`<HashRouter>` 包裹。
3. 示例代码：

```jsx
import { Link } from "react-router-dom";

function Test() {
  return (
    <div>
        <Link to="/路径">按钮</Link>
    </div>
  );
}
```

<!-- PDF 第 3 页 -->

## 5. `<NavLink>`

1. 作用: 与`<Link>` 组件类似，且可实现导航的“高亮”效果。
2. 示例代码：

```jsx
// 注意: NavLink默认类名是active，下面是指定自定义的class

//自定义样式
  <NavLink
      to="login"
      className={({ isActive }) => {
          console.log('home', isActive)
          return isActive ? 'base one' : 'base'
      }}
  >login</NavLink>

  /*
   默认情况下，当Home的子组件匹配成功，Home的导航也会高亮，
   当NavLink上添加了end属性后，若Home的子组件匹配成功，则Home的导航没有高亮效果。
  */

  <NavLink to="home" end >home</NavLink>
```

## 6. `<Navigate>`

1. 作用：只要`<Navigate>` 组件被渲染，就会修改路径，切换视图。
2. replace 属性用于控制跳转模式（push 或 replace，默认是push）。
3. 示例代码：

```jsx
import React,{useState} from 'react'
import {Navigate} from 'react-router-dom'

export default function Home() {
    const [sum,setSum] = useState(1)

    return (
        <div>
         <h3>我是Home的内容</h3>
            {/* 根据sum的值决定是否切换视图 */}
            {sum === 1 ? <h4>sum的值为{sum}</h4> : <Navigate to="/about" replace={true}/>}
            <button onClick={()=>setSum(2)}>点我将sum变为2</button>
        </div>
    )
}
```

## 7. `<Outlet>`

1. 当`<Route>` 产生嵌套时，渲染其对应的后续子路由。
2. 示例代码：

```jsx
//根据路由表生成对应的路由规则
const element = useRoutes([
  {
    path:'/about',
    element:<About/>
  },
  {
    path:'/home',
    element:<Home/>,
    children:[
      {
        path:'news',
        element:<News/>
      },
      {
        path:'message',
        element:<Message/>,
      }
    ]
  }
])

//Home.js
import React from 'react'
import {NavLink,Outlet} from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <h2>Home组件内容</h2>
      <div>
        <ul className="nav nav-tabs">
          <li>
            <NavLink className="list-group-item" to="news">News</NavLink>
          </li>
          <li>
            <NavLink className="list-group-item" to="message">Message</NavLink>
          </li>
        </ul>
        {/* 指定路由组件呈现的位置 */}
        <Outlet />
      </div>
    </div>
  )
}
```

<!-- PDF 第 4 页 -->
