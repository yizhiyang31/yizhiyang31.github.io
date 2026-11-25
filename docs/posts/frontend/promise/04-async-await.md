---
title: 第 4 章 async 与 await
excerpt: async 函数、await 表达式及使用注意事项。
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

# 第 4 章 async 与 await

async 函数、await 表达式及使用注意事项。

<!-- more -->

# 第4 章：async 与await

## 4.1. mdn 文档

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function  
https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/await  
## 4.2. async 函数

1. 函数的返回值为promise 对象  
2. promise 对象的结果由async 函数执行的返回值决定  
## 4.3. await 表达式

1. await 右侧的表达式一般为promise 对象, 但也可以是其它的值  
2. 如果表达式是promise 对象, await 返回的是promise 成功的值  

<!-- PDF 第 25 页 -->

3. 如果表达式是其它值, 直接将此值作为await 的返回值  
## 4.4. 注意

1. await 必须写在async 函数中, 但async 函数中可以没有await  
2. 如果await 的promise 失败了, 就会抛出异常, 需要通过try...catch 捕获处理  
```html
<script>
  function fn1() {
    return Promise.resolve(1)
  }
  function fn2() {
    return 2
  }
  function fn3() {
    return Promise.reject(3)
    // return fn3.test() // 程序运行会抛出异常
  }
  function fn4() {
    return fn3.test() // 程序运行会抛出异常
  }
  // 没有使用await 的async 函数
  async function fn5() {
    return 4
  }
  async function fn() {
    // await 右侧是一个成功的promise
```


<!-- PDF 第 26 页 -->

```javascript
    const result = await fn1()
    // await 右侧是一个非promise 的数据
    // const result = await fn2()
    // await 右侧是一个失败的promise
    // const result = await fn3()
    // await 右侧抛出异常
    // const result = await fn4()
    console.log('result: ', result)
    return result+10
  }
  async function test() {
    try {
const result2 = await fn()
console.log('result2', result2)
    } catch (error) {
console.log('error', error)
    }
    const result3 = await fn4()
    console.log('result4', result3)
  }
  // test()
</script>
```


<!-- PDF 第 27 页 -->
