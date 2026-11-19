---
title: Go 语言基础：指针
author: yizhiyang
date: 2026-11-07
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖指针地址、指针类型与指针取值，`&` 和 `*` 的用法，指针作为函数参数，以及 `new` 与 `make` 的区别。

<!-- more -->

## 关于指针

变量本质上是给内存地址起的一个别名。指针也是一种变量，但它保存的是**另一个变量的内存地址**。

掌握指针需要理解三个概念和两个符号：

- 概念：指针地址、指针类型、指针取值
- 符号：`&` 取地址，`*` 根据地址取值

## 取地址与取值

```go
package main

import "fmt"

func main() {
	a := 10
	b := &a // b 是指针变量，保存 a 的地址

	fmt.Printf("a:%d ptr:%p b type:%T\n", a, &a, b)
	fmt.Println("b:", b)  // b 的值是 a 的地址
	fmt.Println("*b:", *b) // 对指针取值，得到 a 的值 10

	*b = 20 // 通过指针修改 a
	fmt.Println("a:", a) // 20
}
```

如果 `v` 的类型是 `T`，那么 `ptr := &v` 的类型就是 `*T`。`&` 和 `*` 是一对互补操作：对变量取地址得到指针，对指针取值得到原变量。

值类型（int、float、bool、string、array、struct）都有对应的指针类型，如 `*int`、`*int64`、`*string`。

## 指针传值

```go
package main

import "fmt"

func modify1(x int)  { x = 100 }  // 传值，改的是副本
func modify2(x *int) { *x = 100 } // 传地址，可以修改原变量

func main() {
	a := 10
	modify1(a)
	fmt.Println(a) // 10

	modify2(&a)
	fmt.Println(a) // 100
}
```

这正是前面讲数组时提到的问题：数组是值类型，传参时会复制整个数组，想要修改原数组就要传数组指针。

## new 与 make

引用类型变量仅声明而不分配内存，直接赋值会 panic；值类型声明时就已分配了内存。

### new

`new(Type)` 返回指向该类型零值的指针：

```go
p := new(int)  // *int，指向 0
*p = 10
fmt.Println(*p) // 10
```

开发中 `new` 使用较少，通常直接用 `&变量`。

### make

`make(t Type, size ...IntegerType) Type` 只用于 slice、map、channel，返回这三个引用类型本身：

```go
s := make([]int, 3, 10)
m := make(map[string]string)
m["username"] = "张三"
ch := make(chan int, 10)
```

### 两者的区别

| 对比 | new | make |
| --- | --- | --- |
| 参数 | 类型 | 类型 + 可选长度/容量 |
| 返回值 | 指向类型零值的指针 `*T` | 引用类型本身 `T` |
| 适用类型 | 任意类型 | 仅 slice、map、channel |
| 用途 | 分配内存，内存值为零值 | 初始化引用类型的数据结构 |

## 小结

- `&变量` 取地址，`*指针` 取值，两者互补。
- 函数参数传指针可以在函数内修改外部变量。
- `new` 返回指针，`make` 返回初始化后的引用类型，二者用途不同。

