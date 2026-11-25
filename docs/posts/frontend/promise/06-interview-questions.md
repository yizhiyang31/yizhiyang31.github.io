---
title: 第 6 章 Promise 相关面试题
excerpt: Promise 相关的典型面试题与解析。
author: yizhiyang
date: 2026-11-25
category:
  - 前端
tag:
  - JavaScript
  - Promise
  - 异步编程
  - 学习笔记
---

# 第 6 章 Promise 相关面试题

Promise 相关的典型面试题与解析。

<!-- more -->

# 第6 章：promise 相关面试题

## 6.1. 面试题1

```html
<script type="text/javascript">
  setTimeout(()=>{
    console.log(1)
  },0)
  Promise.resolve().then(()=>{
    console.log(2)
  })
  Promise.resolve().then(()=>{
    console.log(4)
  })
  console.log(3)
</script>
```

## 6.2. 面试题2

```html
<script type="text/javascript">
  setTimeout(() => {
    console.log(1)
  }, 0)
  new Promise((resolve) => {
    console.log(2)
    resolve()
  }).then(() => {
    console.log(3)
  }).then(() => {
    console.log(4)
  })
  console.log(5)
```


<!-- PDF 第 29 页 -->

```javascript
</script>
```

## 6.3. 面试题3

```html
<script type="text/javascript">
  const first = () => (new Promise((resolve, reject) => {
    console.log(3)
    let p = new Promise((resolve, reject) => {
console.log(7)
setTimeout(() => {
console.log(5)
resolve(6)
}, 0)
resolve(1)
    })
    resolve(2)
    p.then((arg) => {
console.log(arg)
    })
  }))
  first().then((arg) => {
    console.log(arg)
  })
  console.log(4)
</script>
```

## 6.4. 面试题4

```html
<script type="text/javascript">
```


<!-- PDF 第 30 页 -->

```javascript
  setTimeout(() => {
    console.log("0")
  }, 0)
  new Promise((resolve,reject)=>{
    console.log("1")
    resolve()
  }).then(()=>{
    console.log("2")
    new Promise((resolve,reject)=>{
console.log("3")
resolve()
    }).then(()=>{
console.log("4")
    }).then(()=>{
console.log("5")
    })
  }).then(()=>{
    console.log("6")
  })
  new Promise((resolve,reject)=>{
    console.log("7")
    resolve()
  }).then(()=>{
    console.log("8")
  })
</script>
```

## 6.5. 面试题5

手写/自定义promise  
