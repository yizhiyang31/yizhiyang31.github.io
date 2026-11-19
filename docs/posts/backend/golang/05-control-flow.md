---
title: Go 语言基础：流程控制
author: yizhiyang
date: 2026-11-02
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖条件分支 `if else`、循环 `for`、键值循环 `for range`、`switch case`，以及 `break`、`continue`、`goto` 三种跳转。

<!-- more -->

## if else

`if` 后面可以把初始化语句写在一起，变量只在当前 if 语句块内有效。Go 没有三目运算符。

**左花括号必须和 `if` / `else` 在同一行**，这是语法强制要求。

```go
package main

import "fmt"

func main() {
	score := 65
	if score >= 90 {
		fmt.Println("A")
	} else if score > 75 {
		fmt.Println("B")
	} else {
		fmt.Println("C")
	}

	if s := 56; s > 75 {
		fmt.Println("B")
	} else {
		fmt.Println("C")
	}
	// s 在这里不可见
}
```

## for 循环

Go 只有 `for` 关键字，但通过省略不同部分可以写出各种循环形式：

```go
package main

import "fmt"

func main() {
	// 标准形式
	sum := 0
	for i := 1; i <= 100; i++ {
		sum += i
	}
	fmt.Println(sum) // 5050

	// 省略初始语句，类似 while
	i := 1
	for i <= 5 {
		fmt.Println(i)
		i++
	}

	// 无限循环，靠 break / return / goto / panic 退出
	for {
		break
	}

	// 嵌套循环：打印三角形
	for a := 1; a <= 5; a++ {
		for b := 0; b < a; b++ {
			fmt.Print("*")
		}
		fmt.Println()
	}
}
```

## for range

`for range` 可以遍历数组、切片、字符串、map 和 channel：

- 数组、切片、字符串：返回索引和值
- map：返回键和值
- channel：只返回值

```go
package main

import "fmt"

func main() {
	for i, v := range "abc上海" {
		fmt.Printf("%d=%c ", i, v) // 索引按字节计算
	}
	fmt.Println()

	for i, v := range []string{"go", "python"} {
		fmt.Printf("%d=%s ", i, v)
	}
}
```

只想取其中一个值时，用 `_` 忽略另一个：

```go
for _, v := range []int{1, 2, 3} {
	fmt.Println(v)
}
```

## switch case

Go 的 `switch` 不需要在每个 `case` 末尾写 `break`，默认不会穿透。一个 switch 只能有一个 `default`。`case` 后面可以跟多个值，用逗号分隔。

```go
package main

import "fmt"

func main() {
	switch n := 2; n {
	case 1, 3, 5, 7, 9:
		fmt.Println("奇数")
	case 2, 4, 6, 8:
		fmt.Println("偶数")
	default:
		fmt.Println(n)
	}

	// fallthrough 强制穿透一层
	switch 1 {
	case 1:
		fmt.Println("case 1")
		fallthrough
	case 2:
		fmt.Println("case 2")
	}
}
```

## break、continue 与 goto

`break` 默认跳出一层循环，可以配合标签跳出指定层；`continue` 只能用于 `for` 循环，同样支持标签；`goto` 配合标签无条件跳转。

```go
package main

import "fmt"

func main() {
label2:
	for i := 0; i < 2; i++ {
		for j := 0; j < 4; j++ {
			if j == 2 {
				break label2 // 直接跳出外层循环
			}
			fmt.Println(i, j)
		}
	}

here:
	for i := 0; i < 2; i++ {
		for j := 0; j < 4; j++ {
			if j == 2 {
				continue here // 继续外层循环的下一次
			}
			fmt.Print(j)
		}
		fmt.Println()
	}

	for i := 0; i < 10; i++ {
		if i == 2 {
			goto end
		}
	}
end:
	fmt.Println("结束 for 循环")
}
```

实际开发中应谨慎使用标签和 `goto`，优先通过函数拆分来表达复杂跳转。

## 小结

- `if` 和 `for` 是最常用的流程控制，注意花括号必须同行。
- `for` 可以模拟 `while` 和无限循环，`for range` 适合遍历集合。
- `switch` 默认不穿透，需要穿透时用 `fallthrough`。
- `break`、`continue`、`goto` 都可以通过标签控制跳转层级。

