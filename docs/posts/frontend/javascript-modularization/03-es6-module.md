---
title: ES6 模块化规范
excerpt: ES6 模块的初步体验、Node 运行方式、导出导入语法和数据引用问题。
author: yizhiyang
date: 2026-11-25
category:
  - 前端
tag:
  - JavaScript
  - 模块化
  - 学习笔记
---

# ES6 模块化规范

ES6 模块的初步体验、Node 运行方式、导出导入语法和数据引用问题。

<!-- more -->

<!-- PDF 第 6 页 -->

一个 JS 模块在执行时，是被包裹在一个内置函数中执行的，所以每个模块都有自己的作用域，我  
们可以通过如下方式验证这一说法：  
```text
console.log(arguments)
console.log(arguments.callee.toString())
```

内置函数的大致形式如下：  
```javascript
function (exports, require, module, __filename, __dirname){
  /*********************/
}
```

### 4.5. 浏览器端运行

Node.js 默认是支持 CommonJS 规范的，但浏览器端不支持，所以需要经过编译，步骤如下：  
第一步：全局安装 browserify ：`npm i browserify -g`  
第二步：编译  
```text
browserify index.js -o build.js
```

备注：`index.js` 是源文件，`build.js` 是输出的目标文件  
第三步：页面中引入使用  
```html
<script type="text/javascript" src="./build.js"></script>
```

## 5. ES6 模块化规范

ES6 模块化规范是一个官方标准的规范，它是在语言标准的层面上实现了模块化功能，是目前最  
流行的模块化规范，且浏览器与服务端均支持该规范。  
### 5.1. 初步体验

> 页码：6


<!-- PDF 第 7 页 -->

1.「创建 school.js」  
```javascript
// 导出name
export let name = {str:''}
// 导出slogan
export const slogan = '让天下没有难学的技术！'
// 导出name
export function getTel (){
  return '010-56253825'
}
function getCities(){
  return ['北京','上海','深圳','成都','武汉','西安']
}
```

2.「创建 student.js」  
```javascript
// 导出name
export const name = '张三'
// 导出motto
export const motto = '相信明天会更好！'
// 导出getTel
export function getTel (){
  return '13877889900'
}
function getHobby(){
  return ['抽烟','喝酒','烫头']
}
```

3.「创建 index.js」  
```javascript
// 引入school模块暴露的所有内容
import * as school from './school.js'
// 引入student模块暴露的所有内容
import * as student from './student.js'
```

4.「页面中引入 index.js」  
```html
<script type="module" src="./index.js"></script>
```

> 页码：7


<!-- PDF 第 8 页 -->

### 5.2. Node 中运行 ES6 模块

`Node.js`中运行`ES6`模块代码有两种方式：  
方式一：将`JavaScript`文件后缀从`.js` 改为`.mjs`，Node 则会自动识别 ES6 模块。  
方式二：在`package.json`中设置`type`属性值为`module`。  
### 5.3. 导出数据

ES6 模块化提供 3 种导出方式：①分别导出、②统一导出、③默认导出  
1.「分别导出」  
备注：在上方【初步体验中】环节，我们使用的导出方式就是【分别导出】  
```javascript
// 导出name
export let name = {str:''}
// 导出slogan
export const slogan = '让天下没有难学的技术！'
// 导出getTel
export function getTel (){
  return '010-56253825'
}
```

2.「统一导出」  
```javascript
const name = {str:''}
const slogan = '让天下没有难学的技术！'
function getTel (){
  return '010-56253825'
}
function getCities(){
  return ['北京','上海','深圳','成都','武汉','西安']
}
// 统一导出了：name,slogan,getTel
export {name,slogan,getTel}
```

> 页码：8


<!-- PDF 第 9 页 -->

3.「默认导出」  
```javascript
const name = '张三'
const motto = '走自己的路，让别人五路可走！'
function getTel (){
  return '13877889900'
}
function getHobby(){
  return ['抽烟','喝酒','烫头']
}
//默认导出：name,motto,getTel
export default {name,motto,getTel}
```

备注 :「上述多种导出方式，可以同时使用」  
```javascript
// 导出name ———— 分别导出
export const name = {str:''}
const slogan = '让天下没有难学的技术！'
function getTel (){
  return '010-56253825'
}
function getCities(){
  return ['北京','上海','深圳','成都','武汉','西安']
}
// 导出slogan ———— 统一导出
export {slogan}
// 导出getTel ———— 默认导出
export default getTel
```

### 5.4. 导入数据

对于 ES6 模块化来说，使用何种导入方式，要根据导出方式决定。  
> 页码：9


<!-- PDF 第 10 页 -->

1.「导入全部」(通用)  
可以将模块中的所有导出内容整合到一个对象中。  
```javascript
import * as school from './school.js'
```

2.「命名导入」(对应导出方式：分别导出、统一导出)  
导出数据的模块  
```javascript
//分别导出
export const name = {str:''}
//分别导出
export const slogan = '让天下没有难学的技术！'
function getTel (){
  return '010-56253825'
}
function getCities(){
  return ['北京','上海','深圳','成都','武汉','西安']
}
//统一导出
export { getTel }
```

命名导入：  
```javascript
import { name,slogan,getTel } from './school.js'
```

通过`as`重命名:  
```javascript
import { name as myName,slogan,getTel } from './school.js'
```

> 页码：10


<!-- PDF 第 11 页 -->

3.「默认导入」(对应导出方式：默认导出)  
导出数据的模块  
```javascript
const name = '张三'
const motto = '走自己的路，让别人五路可走！'
function getTel (){
  return '13877889900'
}
function getHobby(){
  return ['抽烟','喝酒','烫头']
}
//使用默认导出的方式，导出一个对象，对象中包含着数据
export default { name,motto,getTel }
```

默认导入：  
```javascript
import student from './student.js' //默认导出的名字可以修改，不是必须为student
```

4.「命名导入 与 默认导入可以混合使用」  
导出数据的模块  
```javascript
//分别导出
export const name = {str:''}
//分别导出
export const slogan = '让天下没有难学的技术！'
function getTel (){
  return '010-56253825'
}
function getCities(){
  return ['北京','上海','深圳','成都','武汉','西安']
}
//统一导出
export default getTel
```

「命名导入」与「默认导入」混合使用，且默认导入的内容必须放在前方：  
```javascript
import getTel,{name,slogan} from './school.js'
```

> 页码：11


<!-- PDF 第 12 页 -->

5.「动态导入」(通用)  
允许在运行时按需加载模块，返回值是一个 Promise。  
```javascript
const school = await import('./school.js');
console.log(school)
```

6. import 可以不接收任何数据  
例如只是让 mock.js 参与运行  
```javascript
import './mock.js'
```

此时，我们感受到模块化确实解决了：①全局污染问题、②依赖混乱问题、③数据安全问题。  
### 5.5. 数据引用问题

思考1： 如下代码的输出结果是什么？（不要想太多，不涉及模块化相关知识）  
```javascript
function count (){
  let sum = 1
  function increment(){
    sum += 1
  }
  return {sum,increment}
}
const {sum,increment} = count()
console.log(sum)
increment()
increment()
console.log(sum)
```

> 页码：12


<!-- PDF 第 13 页 -->

思考2：使用 CommonJS 规范，编写如下代码，输出结果是什么？  
count.js  
JavaScript  
```javascript
let sum = 1
function increment (){
  sum += 1
}
module.exports = {sum,increment}
```

index.js  
JavaScript  
```javascript
const {sum,increment} = require('./count.js')
console.log(sum)
increment()
increment()
console.log(sum)
```

思考3：使用 ES6 模块化规范，编写如下代码，输出结果是什么？  
count.js  
JavaScript  
```javascript
let sum = 1
function increment(){
  sum += 1
}
export {sum,increment}
```

index.js  
JavaScript  
```javascript
import {sum,increment} from './count.js'
console.log(sum) //1
increment()
increment()
console.log(sum) //3
```

使用原则：导出的常量，务必用`const`定义  
> 页码：13

