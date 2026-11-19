---
title: Go 语言基础：函数详解
author: yizhiyang
date: 2026-11-08
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖函数定义与调用、参数与多返回值、变量作用域、函数类型与高阶函数、匿名函数与闭包、`defer`，以及 `panic` / `recover`。

<!-- more -->

## 函数定义与调用

格式：`func 函数名(参数) (返回值) { 函数体 }`

函数名由字母、数字、下划线组成，首字符不能是数字，同一个包内不能重名。参数和返回值都可以省略。

```go
package main

import "fmt"

func greeting(name string) string {
	return "hello " + name
}

func main() {
	fmt.Println(greeting("golang"))
}
```

有返回值的函数调用时也可以不接收返回值。

## 函数参数

相邻的同类型参数可以省略类型：

```go
func add(x, y int) int { return x + y }
```

### 可变参数

用 `...` 标识，本质是一个切片，通常放在参数列表最后；固定参数必须写在可变参数之前：

```go
package main

import "fmt"

func intSum3(x int, y ...int) int {
	sum := x
	for _, v := range y {
		sum += v
	}
	return sum
}

func main() {
	fmt.Println(intSum3(100))          // 100
	fmt.Println(intSum3(100, 10, 20))  // 130
}
```

## 返回值

多个返回值必须用 `()` 包裹，可以给返回值命名并使用裸 `return`：

```go
package main

import "fmt"

func calc(a, b int) (sum int, diff int) {
	sum = a + b
	diff = a - b
	return // 裸 return，返回命名返回值
}

func main() {
	s, d := calc(10, 3)
	fmt.Println(s, d) // 13 7
}
```

## 变量作用域

- **全局变量**：函数外定义，整个包内有效。
- **局部变量**：函数内定义，仅在函数内有效；与全局变量重名时优先使用局部变量。
- **语句块变量**：`if`、`for` 等语句块内定义的变量，只在块内有效。

## 函数类型与高阶函数

用 `type` 定义函数类型，签名相同的函数可以赋值给该类型的变量：

```go
type calculation func(int, int) int

var c calculation = add
```

高阶函数指函数可以作为参数，也可以作为返回值：

```go
package main

import "fmt"

type calculation func(int, int) int

func add(x, y int) int { return x + y }
func sub(x, y int) int { return x - y }

func calc(x, y int, op func(int, int) int) int {
	return op(x, y)
}

func do(op calculation) calculation {
	return op
}

func main() {
	var c calculation = add
	fmt.Println(c(1, 2))            // 3
	fmt.Println(calc(10, 3, sub))   // 7
	fmt.Println(do(add)(4, 5))      // 9
}
```

## 匿名函数与闭包

匿名函数没有名字，需要保存到变量或立即执行：

```go
func main() {
	f := func(x, y int) int { return x + y }
	fmt.Println(f(1, 2))

	func() {
		fmt.Println("立即执行")
	}()
}
```

**闭包 = 函数 + 引用环境**，匿名函数可以访问并记住外部变量：

```go
package main

import "fmt"

func adder() func(int) int {
	x := 0
	return func(y int) int {
		x += y
		return x
	}
}

func main() {
	f := adder()
	fmt.Println(f(10)) // 10
	fmt.Println(f(20)) // 30
}
```

## defer 语句

`defer` 会把函数调用延迟到外层函数结束前执行，常用于资源释放。多个 `defer` 按**后进先出**的顺序执行：

```go
package main

import "fmt"

func main() {
	defer fmt.Println(1)
	defer fmt.Println(2)
	fmt.Println("end")
}
// 输出: end 2 1
```

`defer` 注册时参数值就已经被确定；`return` 并不是原子操作，底层是先给返回值赋值，再执行 `defer`，最后 RET。

## panic 与 recover

Go 内置函数包括 `close`、`len`、`new`、`make`、`append`、`panic`、`recover` 等。

- `panic` 可以在任何地方引发异常
- `recover` 必须配合 `defer` 使用，且 `defer` 要定义在可能 panic 的语句**之前**

```go
package main

import "fmt"

func recoverDemo() {
	defer func() {
		if e := recover(); e != nil {
			fmt.Println("recover:", e)
		}
	}()
	panic("发生错误")
}

func main() {
	recoverDemo()
	fmt.Println("程序继续运行")
}
```

goroutine 内部的 panic 无法被外层的 `recover` 捕获，必须在该 goroutine 内部 `defer + recover`。

## 小结

- 参数、返回值都支持简写；可变参数本质是切片。
- 函数可以作为值传递，由此衍生出高阶函数和闭包。
- `defer` 逆序执行，适合释放资源；`recover` 必须放在 `defer` 中才能捕获 panic。

