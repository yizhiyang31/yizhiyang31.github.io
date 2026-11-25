---
title: 第 1 章 准备
excerpt: 实例对象与函数对象、回调函数类型，以及 JS 错误处理。
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

# 第 1 章 准备

实例对象与函数对象、回调函数类型，以及 JS 错误处理。

<!-- more -->

# 第1 章：准备

## 1.1. 区别实例对象与函数对象

1. 实例对象: new 函数产生的对象, 称为实例对象, 简称为对象  
2. 函数对象: 将函数作为对象使用时, 简称为函数对  
```javascript
function Fn() {
}
const fn = new Fn()
console.log(Fn.prototype)
Fn.bind({})
$('#test')
$.get('/test')
```

## 1.2. 二种类型的回调函数

### 1.2.1. 同步回调

1. 理解: 立即执行, 完全执行完了才结束, 不会放入回调队列中  
2. 例子: 数组遍历相关的回调函数/ Promise 的excutor 函数  
### 1.2.2. 异步回调

1. 理解: 不会立即执行, 会放入回调队列中将来执行  

<!-- PDF 第 2 页 -->

2. 例子: 定时器回调/ ajax 回调/ Promise 的成功|失败的回调  
```javascript
const arr = [1, 2, 3]
arr.forEach(item => console.log(item)) // 同步回调, 不会放入回调队列, 而是
```

立即执行  
```javascript
console.log('forEatch()之后')
setTimeout(() => { // 异步回调, 会放入回调队列, 所有同步执行完后才可能执行
  console.log('timout 回调')
}, 0)
console.log('setTimeout 之后')
```

## 1.3. JS 的error 处理

### 1.3.1. 错误的类型

1. Error: 所有错误的父类型  
2. ReferenceError: 引用的变量不存在  
3. TypeError: 数据类型不正确的错误  
4. RangeError: 数据值不在其所允许的范围内  
5. SyntaxError: 语法错误  
### 1.3.2. 错误处理

1. 捕获错误: try ... catch  
2. 抛出错误: throw error  
### 1.3.3. error 对象的结构

1. message 属性: 错误相关信息  

<!-- PDF 第 3 页 -->

2. stack 属性: 函数调用栈记录信息  
```html
<script>
  /*
  1. 常见的异常错误
  */
  // 1). ReferenceError: 引用的变量不存在
  // console.log(a) // ReferenceError: a is not defined
  // 2). TypeError: 数据类型不正确的错误
  // let b = null
  // console.log(b.xxx) // TypeError: Cannot read property 'xxx' of nul
l
  // 3). RangeError: 数据值不在其所允许的范围内
  // function fn() {
  //
fn()
  // }
  // fn() // RangeError: Maximum call stack size exceeded
  // SyntaxError: 语法错误
  // let c = """" // SyntaxError: Unexpected string
  /*
  2. 错误处理
  */
  // 1). 捕获错误: try ... catch
  /*
  try {
    let b = null
    b.xxx()
  } catch (error) {
```


<!-- PDF 第 4 页 -->

```javascript
    console.log('出错了: ', error.message)
    console.log('出错了: ', error.stack)
  }
  console.log('捕获错误后还可以继续向下执行') */
  // 2). 抛出错误: throw error
  /*
  function handle() {
    if (Date.now()%2===0) {
throw new Error('时间为偶数, 不能处理逻辑')
    } else {
console.log('时间为奇数, 可以处理逻辑')
    }
  }
  try {
    handle()
  } catch(error) { // 捕获错误, 做相应的提示
    alert('执行出错: ' + error.message)
  } */
</script>
```
