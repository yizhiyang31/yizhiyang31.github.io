---
title: Go 语言基础：变量、常量与命名规范
author: yizhiyang
date: 2026-10-30
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖变量的声明与初始化、`fmt` 包的打印方法、常量的 `iota` 计数器，以及 Go 的命名规则和代码风格。

<!-- more -->

## 变量

程序运行中的数据保存在内存里。直接通过内存地址操作数据可读性差且易出错，于是用变量保存数据的内存地址，之后通过变量就能找到对应的数据。

Go 中每个变量都有自己的类型，**必须先声明才能使用**，同一作用域内不能重复声明，且声明后必须使用。

### 声明与初始化

标准格式是 `var 变量名 类型 = 表达式`：

```go
package main

import "fmt"

func main() {
	var username string = "张三"
	var age int = 20
	fmt.Println(username, age)
}
```

类型可以省略，编译器会根据右侧的值推导：

```go
var name = "Q1mi"
var age = 18
```

一次声明多个变量、批量声明：

```go
var username, sex string
username, sex = "张三", "男"

var (
	a string = "张三"
	b int    = 20
	c bool   = true
)

var x, y, z, ok = 1, 2, 3, false
```

变量声明后会自动初始化为对应类型的零值：整型和浮点型为 `0`，字符串为空串，布尔型为 `false`，切片、函数、指针为 `nil`。

### 短变量声明

函数内部可以用 `:=` 声明并初始化变量，**但函数外不能用**：

```go
package main

import "fmt"

var m = 100 // 全局变量必须用 var

func main() {
	n := 10
	m := 200 // 这里声明的是局部变量 m，遮蔽了全局 m
	fmt.Println(m, n) // 200 10

	m1, m2, m3 := 10, 20, 30
	fmt.Println(m1, m2, m3)
}
```

### 匿名变量

多重赋值时，用 `_` 忽略不需要的值。匿名变量不占用命名空间，也不分配内存：

```go
package main

import "fmt"

func getInfo() (int, string) {
	return 10, "张三"
}

func main() {
	_, username := getInfo()
	fmt.Println(username)
}
```

## fmt 包：Print、Println、Printf

Go 中打印值需要引入 `fmt` 包。

```go
package main

import "fmt"

func main() {
	a, b, c := 10, 20, 30

	fmt.Println("go", "python", "php") // 多个值之间自动加空格，并换行
	fmt.Print("go", "python", "php")   // 不加空格，也不换行

	fmt.Println("a=", a, ",b=", b, ",c=", c)       // a= 10 ,b= 20 ,c= 30
	fmt.Printf("a=%d,b=%d,c=%d\n", a, b, c)        // a=10,b=20,c=30
}
```

`Printf` 是格式化输出，`%d` 表示十进制整数占位符，与后面的变量一一对应。更多占位符可参考 [fmt 文档](https://pkg.go.dev/fmt)。

### 注释

```go
// 单行注释：Windows 下 Ctrl+/，Mac 下 Command+/

/*
多行注释
可以写多行
*/
```

## 常量

常量是运行期间不会改变的值，用 `const` 定义，**定义时必须赋值**：

```go
package main

import (
	"fmt"
	"math"
)

const pi = 3.1415
const e = 2.7182

const (
	n1 = 100
	n2 // 省略值时与上一行相同，n2 = 100
	n3 // n3 = 100
)

func main() {
	fmt.Println(pi, e, math.Pi, n1, n2, n3)
}
```

### iota 常量计数器

`iota` 只能在常量表达式中使用，每次 `const` 出现时重置为 0，const 块中每新增一行常量声明就计数一次：

```go
package main

import "fmt"

const (
	n1 = iota // 0
	n2       // 1
	_        // 2，跳过
	n4       // 3
)

const (
	m1 = iota  // 0
	m2 = 100   // 100，插队
	m3 = iota  // 2
	m4         // 3
)

const (
	a, b = iota + 1, iota + 2 // 1, 2
	c, d                      // 2, 3
	e, f                      // 3, 4
)

const n5 = iota // 0，新的 const 重新从 0 开始

func main() {
	fmt.Println(n1, n2, n4, m1, m2, m3, m4, a, b, c, d, e, f, n5)
}
```

在 `fmt.Println(iota)` 这样的非常量表达式中使用会编译报错：`undefined: iota`。

## 命名规则与代码风格

命名规则：

1. 名称由数字、字母、下划线组成，首字符不能是数字。
2. 不能与关键字、保留字冲突。
3. 区分大小写：`age` 和 `Age` 是两个变量，不建议仅靠大小写区分。
4. 见名知意：变量名建议用名词，函数名建议用动词。
5. 推荐驼峰式命名；遇到特有名词（如 DNS）按是否导出统一大小写。

代码风格：

- 每行结束**不写分号**。
- 运算符左右各加一个空格。
- 多个单词组成的名字用大小写分隔。
- **左括号必须紧接语句，不能换行**——这是 Go 强制的风格。
- 用 `gofmt` 格式化代码，让所有人的风格保持一致：

  ```bash
  gofmt main.go
  ```

