---
title: 第 4 章 React ajax
excerpt: React 中的 ajax 请求、axios 与 Fetch 的常用 API、github 用户搜索案例及消息订阅发布机制。
author: yizhiyang
date: 2026-11-27
category:
  - 前端
tag:
  - React
  - Axios
  - Fetch
  - 学习笔记
---

# 第 4 章 React ajax

React 中的 ajax 请求、axios 与 Fetch 的常用 API、github 用户搜索案例及消息订阅发布机制。

<!-- more -->

<!-- PDF 第 17 页 -->

# 第4 章：React ajax

## 4.1. 理解

### 4.1.1. 前置说明

1. React 本身只关注于界面, 并不包含发送ajax 请求的代码
2. 前端应用需要通过ajax 请求与后台进行交互(json 数据)
3. react 应用中需要集成第三方ajax 库(或自己封装)

### 4.1.2. 常用的ajax 请求库

1. jQuery: 比较重, 如果需要另外引入不建议使用

<!-- PDF 第 18 页 -->

2. axios: 轻量级, 建议使用
   1) 封装XmlHttpRequest 对象的ajax
   2) promise 风格
   3) 可以用在浏览器端和node 服务器端

## 4.2. axios

### 4.2.1. 文档

https://github.com/axios/axios

### 4.2.2. 相关API

1) GET 请求

```javascript
axios.get('/user?ID=12345')
 .then(function (response) {
  console.log(response.data);
  })
 .catch(function (error) {
   console.log(error);
  });
```

```javascript
axios.get('/user', {
  params: {
    ID: 12345
    }
  })
 .then(function (response) {
  console.log(response);
  })
 .catch(function (error) {
   console.log(error);
  });
```

<!-- PDF 第 19 页 -->

2) POST 请求

```javascript
axios.post('/user', {
  firstName: 'Fred',
  lastName: 'Flintstone'
})
.then(function (response) {
console.log(response);
})
.catch(function (error) {
console.log(error);
});
```

## 4.3. 案例—github 用户搜索

### 4.3.1. 效果

![GIF 图标](./images/react_p19_gif.jpeg) demo_users.gif

请求地址: https://api.github.com/search/users?q=xxxxxx

## 4.4. 消息订阅-发布机制

1. 工具库: PubSubJS
2. 下载: `npm install pubsub-js --save`
3. 使用:
   1) `import PubSub from 'pubsub-js' //引入`
   2) `PubSub.subscribe('delete', function(data){ }); //订阅`
   3) `PubSub.publish('delete', data) //发布消息`

## 4.5. 扩展：Fetch

<!-- PDF 第 20 页 -->

### 4.5.1. 文档

1. https://github.github.io/fetch/
2. https://segmentfault.com/a/1190000003810652

### 4.5.2. 特点

1. fetch: 原生函数，不再使用XmlHttpRequest 对象提交ajax 请求
2. 老版本浏览器可能不支持

### 4.5.3. 相关API

1) GET 请求

```javascript
fetch(url).then(function(response) {
    return response.json()
  }).then(function(data) {
    console.log(data)
  }).catch(function(e) {
    console.log(e)
  });
```

2) POST 请求

```javascript
fetch(url, {
  method: "POST",
  body: JSON.stringify(data),
}).then(function(data) {
  console.log(data)
}).catch(function(e) {
  console.log(e)
})
```
