---
title: Go 语言基础：类型转换与运算符
author: yizhiyang
date: 2026-11-01
category:
  - 后端
tag:
  - Go
  - 数据类型
  - 学习笔记
---

本文涵盖Go 的强制类型转换、`fmt.Sprintf` 与 `strconv` 包的字符串互转，以及算术、关系、逻辑、赋值和位运算符。

<!-- more -->

## 类型转换

Go 中**只有强制类型转换，没有隐式转换**，且必须先转成相同类型才能运算。

语法：`类型(变量)`

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	var a int8 = 20
	var b int16 = 40
	fmt.Println(int16(a) + b) // 必须转成同类型

	var f float32 = 3.2
	fmt.Println(f + float32(b))

	var x int16 = 129
	fmt.Println(int8(x)) // -127，高精度转低精度会溢出

	i, j := 3, 4
	fmt.Println(int(math.Sqrt(float64(i*i + j*j)))) // math.Sqrt 接收 float64
}
```

建议低精度转高精度；高精度转低精度可能出现溢出。

## 其他类型转字符串

### fmt.Sprintf

用格式化占位符转换：整型 `%d`、浮点 `%f`、布尔 `%t`、byte `%c`。

```go
package main

import "fmt"

func main() {
	s := fmt.Sprintf("%d-%f-%t-%c", 20, 12.456, true, 'a')
	fmt.Println(s) // 20-12.456000-true-a
}
```

### strconv 包

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	fmt.Println(strconv.Itoa(20))                            // "20"
	fmt.Println(strconv.FormatFloat(20.113123, 'f', 2, 64))  // "20.11"
	fmt.Println(strconv.FormatBool(true))                    // "true"
	fmt.Println(strconv.FormatInt(int64(20), 10))            // "20"
}
```

## 字符串转其他类型

用 `ParseInt`、`ParseFloat`、`ParseBool`，它们返回两个值（结果和错误）：

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	n, _ := strconv.ParseInt("1234", 10, 64)
	v, _ := strconv.ParseFloat("3.1415926535", 64)
	bo, _ := strconv.ParseBool("true")

	fmt.Printf("%v %T\n", n, n)   // 1234 int64
	fmt.Printf("%v %T\n", v, v)   // 3.1415926535 float64
	fmt.Printf("%v %T\n", bo, bo) // true bool
}
```

注意：**数值类型和 bool 类型之间不能互相转换**。

## 运算符

Go 内置运算符分为算术、关系、逻辑、位、赋值五类。

### 算术运算符

```go
package main

import "fmt"

func main() {
	fmt.Println(10/3)   // 3，整数相除去掉小数
	fmt.Println(10.0/3) // 3.3333333333333335
	fmt.Println(-10%3)  // -1，余数 = 被除数 - (被除数/除数)×除数
	fmt.Println(10%-3)  // 1

	i := 1
	i++    // ++/-- 是独立语句，不能用于赋值，也没有 ++i 这种前置写法
	fmt.Println(i)
}
```

### 关系运算符

`==`、`!=`、`>`、`<`、`>=`、`<=`，结果为布尔值。

### 逻辑运算符

`&&`、`||`、`!`，其中 `&&` 和 `||` 具有短路特性：

```go
package main

import "fmt"

func test() bool {
	fmt.Println("test...")
	return true
}

func main() {
	fmt.Println(9 > 30 && test()) // false && 后面不执行，不打印 test
	fmt.Println(9 > 9 || test())  // false || 后面执行，打印 test
}
```

### 赋值运算符

`=`、`+=`、`-=`、`*=`、`/=`、`%=` 等，赋值方向从右向左。

```go
a, b := 9, 2
a, b = b, a // 交换两个变量
fmt.Println(a, b) // 2 9
```

### 位运算符(了解)

`&`（都为 1 才为 1）、`|`（有 1 则为 1）、`^`（不同为 1）、`<<`（左移 n 位相当于乘 2ⁿ）、`>>`（右移 n 位相当于除 2ⁿ）。

```go
m, n := 5, 2 // 0101 和 0010
fmt.Println(m&n, m|n, m^n, m<<n, m>>n) // 0 7 7 20 1
```

### 练习

```go
package main

import "fmt"

func main() {
	days := 100
	fmt.Printf("%d个星期零%d天\n", days/7, days%7) // 14个星期零2天

	var huashi float32 = 134.2
	fmt.Println(5.0 / 9 * (huashi - 100)) // 注意要写 5.0，否则整数除法得 0
}
```

