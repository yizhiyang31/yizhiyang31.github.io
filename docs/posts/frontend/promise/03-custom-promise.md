---
title: 第 3 章 自定义 Promise
excerpt: 从整体结构到 resolve、then/catch、all/race 的自定义实现。
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

# 第 3 章 自定义 Promise

从整体结构到 resolve、then/catch、all/race 的自定义实现。

<!-- more -->

# 第3 章：自定义(手写)Promise

## 3.1. 定义整体结构

```javascript
/*
自定义Promise
*/
(function (window) {
  /*
  Promise 构造函数
  excutor: 内部同步执行的函数
(resolve, reject) => {}
   */
  function Promise(excutor) {
  }
```


<!-- PDF 第 15 页 -->

```javascript
  /*
  为promise 指定成功/失败的回调函数
  函数的返回值是一个新的promise 对象
   */
  Promise.prototype.then = function (onResolved, onRejected) {
  }
  /*
  为promise 指定失败的回调函数
  是then(null, onRejected)的语法糖
   */
  Promise.prototype.catch = function (onRejected) {
  }
  /*
  返回一个指定了成功value 的promise 对象
   */
  Promise.resolve = function (value) {
  }
  /*
  返回一个指定了失败reason 的promise 对象
   */
  Promise.reject = function (reason) {
  }
  /*
  返回一个promise, 只有promises 中所有promise 都成功时, 才最终成功, 只要有一个失败就直接
```

失败  
```javascript
   */
  Promise.all = function (promises) {
  }
```


<!-- PDF 第 16 页 -->

```javascript
  /*
  返回一个promise，一旦某个promise 解决或拒绝，返回的promise 就会解决或拒绝。
  */
  Promise.race = function (promises) {
  }
  // 暴露构造函数
  window.Promise = Promise
})(window)
```

## 3.2. Promise 构造函数的实现

```javascript
/*
Promise 构造函数
excutor: 内部同步执行的函数
(resolve, reject) => {}
  */
function Promise(excutor) {
  const self = this
  self.status = 'pending' // 状态值, 初始状态为pending, 成功了变为
resolved, 失败了变为rejected
  self.data = undefined // 用来保存成功value 或失败reason 的属性
  self.callbacks = [] // 用来保存所有待调用的包含onResolved 和onRejected 回
```

调函数的对象的数组  
```javascript
  /*
```

异步处理成功后应该调用的函数  
```javascript
  value: 将交给onResolve()的成功数据
    */
  function resolve(value) {
    if(self.status!=='pending') { // 如果当前不是pending, 直接结束
```


<!-- PDF 第 17 页 -->

```javascript
return
    }
    // 立即更新状态, 保存数据
    self.status = 'resolved'
    self.data = value
    // 异步调用所有待处理的onResolved 成功回调函数
    if (self.callbacks.length>0) {
setTimeout(() => {
self.callbacks.forEach(obj => {
obj.onResolved(value)
})
})
    }
  }
  /*
```

异步处理失败后应该调用的函数  
```javascript
  reason: 将交给onRejected()的失败数据
    */
  function reject(reason) {
    if(self.status!=='pending') { // 如果当前不是pending, 直接结束
return
}
    // 立即更新状态, 保存数据
    self.status = 'rejected'
    self.data = reason
    // 异步调用所有待处理的onRejected 回调函数
    setTimeout(() => {
self.callbacks.forEach(obj => {
obj.onRejected(reason)
```


<!-- PDF 第 18 页 -->

```javascript
})
    })
  }
  try {
    // 立即同步调用excutor()处理
    excutor(resolve, reject)
  } catch (error) { // 如果出了异常, 直接失败
    reject(error)
  }
}
```

## 3.3. promise.then()/catch()的实现

```javascript
/*
为promise 指定成功/失败的回调函数
函数的返回值是一个新的promise 对象
*/
Promise.prototype.then = function (onResolved, onRejected) {
  const self = this
  // 如果onResolved/onRejected 不是函数, 可它指定一个默认的函数
  onResolved = typeof onResolved==='function' ? onResolved : value => v
alue
// 指定返回的promise 为一个成功状态, 结果值为value
  onRejected = typeof onRejected === 'function' ? onRejected : reason =
> {throw reason} // 指定返回的promise 为一个失败状态, 结果值为reason
  // 返回一个新的promise 对象
  return new Promise((resolve, reject) => {
    /*
    专门抽取的用来处理promise 成功/失败结果的函数
    callback: 成功/失败的回调函数
    */
```


<!-- PDF 第 19 页 -->

```javascript
    function handle(callback) {
// 1. 抛出异常
===> 返回的promise 变为rejected
try {
const x = callback(self.data)
// 2. 返回一个新的promise ===> 得到新的promise 的结果值作为返回的
promise 的结果值
if (x instanceof Promise) {
x.then(resolve, reject) // 一旦x 成功了, resolve(value), 一旦x
失败了: reject(reason)
} else {
// 3. 返回一个一般值(undefined) ===> 将这个值作为返回的promise 的
```

成功值  
```javascript
resolve(x)
}
} catch (error) {
reject(error)
}
    }
    if (self.status === 'resolved') { // 当前promise 已经成功了
setTimeout(() => {
handle(onResolved)
})
    } else if (self.status === 'rejected') { // 当前promise 已经失败了
setTimeout(() => {
handle(onRejected)
})
    } else { // 当前promise 还未确定pending
// 将onResolved 和onRejected 保存起来
self.callbacks.push({
onResolved(value) {
handle(onResolved)
},
```


<!-- PDF 第 20 页 -->

```javascript
onRejected(reason) {
handle(onRejected)
}
})
    }
  })
}
/*
为promise 指定失败的回调函数
是then(null, onRejected)的语法糖
  */
Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}
```

## 3.4. Promise.resolve()/reject()的实现

```javascript
/*
返回一个指定了成功value 的promise 对象
value: 一般数据或promise
  */
Promise.resolve = function (value) {
  return new Promise((resolve, reject) => {
    if (value instanceof Promise) {
value.then(resolve, reject)
    } else {
resolve(value)
    }
  })
}
/*
```


<!-- PDF 第 21 页 -->

```javascript
返回一个指定了失败reason 的promise 对象
reason: 一般数据/error
  */
Promise.reject = function (reason) {
  return new Promise((resolve, reject) => {
    reject(reason)
  })
}
```

## 3.5. Promise.all/race()的实现

```javascript
/*
返回一个新的promise 对象, 只有promises 中所有promise 都产生成功value 时, 才最
终成功, 只要有一个失败就直接失败
*/
Promise.all = function (promises) {
  // 返回一个新的promise
  return new Promise((resolve, reject) => {
    // 已成功的数量
    let resolvedCount = 0
    // 待处理的promises 数组的长度
    const promisesLength = promises.length
    // 准备一个保存成功值的数组
    const values = new Array(promisesLength)
    // 遍历每个待处理的promise
    for (let i = 0; i < promisesLength; i++) {
// promises 中元素可能不是一个数组, 需要用resolve 包装一下
Promise.resolve(promises[i]).then(
value => {
// 成功当前promise 成功的值到对应的下标
values[i] = value
// 成功的数量加1
```


<!-- PDF 第 22 页 -->

```javascript
resolvedCount++
// 一旦全部成功
if(resolvedCount===promisesLength) {
// 将所有成功值的数组作为返回promise 对象的成功结果值
resolve(values)
}
},
reason => {
// 一旦有一个promise 产生了失败结果值, 将其作为返回promise 对象的失
```

败结果值  
```javascript
reject(reason)
}
)
    }
  })
}
/*
返回一个promise，一旦某个promise 解决或拒绝，返回的promise 就会解决或拒绝。
*/
Promise.race = function (promises) {
  // 返回新的promise 对象
  return new Promise((resolve, reject) => {
    // 遍历所有promise
    for (var i = 0; i < promises.length; i++) {
Promise.resolve(promises[i]).then(
(value) => { // 只要有一个成功了, 返回的promise 就成功了
resolve(value)
},
(reason) => { // 只要有一个失败了, 返回的结果就失败了
reject(reason)
}
```


<!-- PDF 第 23 页 -->

```javascript
)
    }
  })
}
```

## 3.6. Promise.resolveDelay()/rejectDelay()的实现

```javascript
/*
  返回一个延迟指定时间才确定结果的promise 对象
*/
Promise.resolveDelay = function (value, time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
if (value instanceof Promise) { // 如果value 是一个promise, 取这个
promise 的结果值作为返回的promise 的结果值
value.then(resolve, reject) // 如果value 成功, 调用
resolve(val), 如果value 失败了, 调用reject(reason)
} else {
resolve(value)
}
    }, time);
  })
}
/*
返回一个延迟指定时间才失败的Promise 对象。
*/
Promise.rejectDelay = function (reason, time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
reject(reason)
    }, time)
```


<!-- PDF 第 24 页 -->

```javascript
  })
}
```

## 3.7. ES5 function 完整版本

Promise.js  
## 3.8. ES6 class 完整版

Promise_class.js  