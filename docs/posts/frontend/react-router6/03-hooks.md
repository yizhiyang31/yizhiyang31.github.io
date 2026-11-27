---
title: React Router 6 快速上手：Hooks
excerpt: useRoutes、useNavigate、useParams、useSearchParams、useLocation、useMatch 等 10 个路由钩子的作用与示例。
author: yizhiyang
date: 2026-11-27
category:
  - 前端
tag:
  - React
  - React Router
  - Hooks
  - 学习笔记
---

# React Router 6 快速上手：Hooks

useRoutes、useNavigate、useParams、useSearchParams、useLocation、useMatch 等 10 个路由钩子的作用与示例。

<!-- more -->

<!-- PDF 第 5 页 -->

# 3.Hooks

## 1. useRoutes()

1. 作用：根据路由表，动态创建`<Routes>` 和`<Route>` 。
2. 示例代码：

```jsx
//路由表配置：src/routes/index.js
import About from '../pages/About'
import Home from '../pages/Home'
import {Navigate} from 'react-router-dom'

export default [
    {
        path:'/about',
        element:<About/>
    },
    {
        path:'/home',
        element:<Home/>
    },
    {
        path:'/',
        element:<Navigate to="/about"/>
    }
]

//App.jsx
import React from 'react'
import {NavLink,useRoutes} from 'react-router-dom'
import routes from './routes'

export default function App() {
//根据路由表生成对应的路由规则
    const element = useRoutes(routes)

    return (
        <div>
            ......
        {/* 注册路由 */}
        {element}
            ......
        </div>
    )
}
```

## 2. useNavigate()

1. 作用：返回一个函数用来实现编程式导航。
2. 示例代码：

```jsx
import React from 'react'
import {useNavigate} from 'react-router-dom'

export default function Demo() {
  const navigate = useNavigate()

  const handle = () => {
  //第一种使用方式：指定具体的路径
    navigate('/login', {
      replace: false,
      state: {a:1, b:2}
    })
 //第二种使用方式：传入数值进行前进或后退，类似于5.x中的 history.go()方法
    navigate(-1)
  }

  return (
    <div>
      <button onClick={handle}>按钮</button>
    </div>
  )
}
```

<!-- PDF 第 6 页 -->

## 3. useParams()

1. 作用：回当前匹配路由的params 参数，类似于5.x中的match.params 。
2. 示例代码：

```jsx
import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import User from './pages/User.jsx'

function ProfilePage() {
  // 获取URL中携带过来的params参数
  let { id } = useParams();
}

function App() {
  return (
    <Routes>
      <Route path="users/:id" element={<User />}/>
    </Routes>
  );
}
```

## 4. useSearchParams()

1. 作用：用于读取和修改当前位置的 URL 中的查询字符串。
2. 返回一个包含两个值的数组，内容分别为：当前的seaech参数、更新search的函数。
<!-- PDF 第 7 页 -->

3. 示例代码：

```jsx
import React from 'react'
import {useSearchParams} from 'react-router-dom'

export default function Detail() {
    const [search,setSearch] = useSearchParams()
    const id = search.get('id')
    const title = search.get('title')
    const content = search.get('content')

    return (
        <ul>
            <li>
                <button onClick={()=>setSearch('id=008&title=哈哈&content=嘻嘻')}>点我更新一下收到的search参数</button>
            </li>
         <li>消息编号：{id}</li>
          <li>消息标题：{title}</li>
          <li>消息内容：{content}</li>
        </ul>
    )
}
```

## 5. useLocation()

1. 作用：获取当前 location 信息，对标5.x中的路由组件的location 属性。
2. 示例代码：

```jsx
import React from 'react'
import {useLocation} from 'react-router-dom'

export default function Detail() {
    const x = useLocation()
    console.log('@',x)

  // x就是location对象:
    /*

        {
      hash: "",
      key: "ah9nv6sz",
      pathname: "/login",
      search: "?name=zs&age=18",
      state: {a: 1, b: 2}
    }

    */

    return (
        <ul>
         <li>消息编号：{id}</li>
          <li>消息标题：{title}</li>
          <li>消息内容：{content}</li>
        </ul>
    )
}
```

<!-- PDF 第 8 页 -->

## 6. useMatch()

1. 作用：返回当前匹配信息，对标5.x中的路由组件的match 属性。
2. 示例代码：

```jsx
<Route path="/login/:page/:pageSize" element={<Login />}/>
<NavLink to="/login/1/10">登录</NavLink>

export default function Login() {
  const match = useMatch('/login/:x/:y')
  console.log(match) //输出match对象

//match对象内容如下：
  /*
    {
      params: {x: '1', y: '10'}
      pathname: "/LoGin/1/10"
      pathnameBase: "/LoGin/1/10"
      pattern: {
        path: '/login/:x/:y',
        caseSensitive: false,
        end: false
      }
    }
  */

  return (
    <div>
      <h1>Login</h1>
    </div>
  )
}
```

## 7. useInRouterContext()

作用：如果组件在 `<Router>` 的上下文中呈现，则 useInRouterContext 钩子返回true，否则返回 false。

## 8. useNavigationType()

1. 作用：返回当前的导航类型（用户是如何来到当前页面的）。
2. 返回值：POP 、PUSH 、REPLACE 。
3. 备注：POP 是指在浏览器中直接打开了这个路由组件（刷新页面）。

## 9. useOutlet()

1. 作用：用来呈现当前组件中渲染的嵌套路由。
2. 示例代码：

```jsx
const result = useOutlet()
console.log(result)

// 如果嵌套路由没有挂载,则result为null
// 如果嵌套路由已经挂载,则展示嵌套的路由对象
```

<!-- PDF 第 9 页 -->

## 10.useResolvedPath()

1. 作用：给定一个 URL值，解析其中的：path、search、hash值。
