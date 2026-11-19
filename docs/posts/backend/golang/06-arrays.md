---
title: Go 语言基础：数组
author: yizhiyang
date: 2026-11-03
category:
  - 后端
tag:
  - Go
  - 数据类型
  - 学习笔记
---

本文涵盖数组的定义与初始化、遍历方式、值类型特性、多维数组和几个常见练习。

<!-- more -->

## 数组介绍

数组是同一类型数据的集合，元素可以是任意基本类型或自定义类型。它的特点是**长度固定**，并且长度是数组类型的一部分：`[5]int` 和 `[10]int` 是两种不同的类型，不能互相赋值。

数组在内存中连续存放，因此按索引访问非常快；如果需要可增长的序列，应使用切片。

## 定义与初始化

语法：`var 数组变量名 [元素数量]T`，长度必须是常量，下标范围是 `0` 到 `len-1`，越界会触发 panic。

```go
package main

import "fmt"

func main() {
	var a [3]int              // 零值数组 [0 0 0]
	b := [3]int{1, 2}         // [1 2 0]，未赋值元素为零值
	c := [...]string{"北京", "上海"} // 由编译器推断长度
	d := [...]int{1: 1, 3: 5} // 按索引初始化：[0 1 0 5]

	fmt.Println(a, b, c, d)
}
```

`[...]` 让编译器根据元素个数推断长度；`{索引: 值}` 形式可以为指定位置赋值。

## 遍历

```go
package main

import "fmt"

func main() {
	c := [...]string{"北京", "上海", "广州"}

	for i := 0; i < len(c); i++ {
		fmt.Println(i, c[i])
	}

	for i, v := range c {
		fmt.Println(i, v)
	}
}
```

## 数组是值类型

数组赋值和作为函数参数传递时，会**复制整个数组**，修改副本不会影响原数组：

```go
package main

import "fmt"

func modify(a [3]int) {
	a[0] = 100
}

func main() {
	a := [3]int{1, 2, 3}
	modify(a)
	fmt.Println(a) // [1 2 3]，原数组没有被改变
}
```

因此，需要在函数内修改数组时应传入数组指针：`func modify(p *[3]int)`。

数组支持 `==` 和 `!=` 比较，因为内存总是被初始化过。

区分两个容易混淆的写法：

- `[n]*T`：指针数组，元素是指针
- `*[n]T`：数组指针，指向数组的指针

## 多维数组

多维数组只有第一层可以用 `...` 让编译器推断长度：

```go
package main

import "fmt"

func main() {
	m := [...][2]string{
		{"北京", "上海"},
		{"广州", "深圳"},
	}
	fmt.Println(m[1][1]) // 深圳

	for _, row := range m {
		for _, v := range row {
			fmt.Print(v, " ")
		}
		fmt.Println()
	}
}
```

## 练习：求和、平均值与最大值

```go
package main

import "fmt"

func main() {
	arr := [...]int{1, -1, 112, 65, 11}
	sum := 0
	maxValue, maxIndex := arr[0], 0

	for i, v := range arr {
		sum += v
		if maxValue < v {
			maxValue, maxIndex = v, i
		}
	}

	fmt.Println("总和:", sum)
	fmt.Println("平均值:", float64(sum)/float64(len(arr)))
	fmt.Println("最大值:", maxValue, "下标:", maxIndex)
}
```

注意平均值计算时要把操作数都转成 `float64`，否则会得到整数结果。

## 小结

- 数组长度固定且是类型的一部分，越界访问会 panic。
- 三种初始化方式：列表、`[...]` 推断、指定索引。
- 数组是值类型，赋值和传参都会复制；需要修改原数组时传指针。
- 多维数组只有第一层能用 `...` 推断。

