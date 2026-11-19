---
title: Go 语言基础：泛型
author: yizhiyang
date: 2026-11-17
category:
  - 后端
tag:
  - Go
  - 泛型
  - 学习笔记
---

本文涵盖泛型的引入背景、类型参数与接口约束、泛型结构体和泛型方法、`~` 约束与 `Ordered`，以及泛型接口。

<!-- more -->

## 为什么需要泛型

Go 1.18（2022 年 3 月）引入泛型，解决函数、方法、结构体、接口的复用性问题，并在编译期对不特定的数据类型提供类型安全。

没有泛型时，同样的逻辑要为不同类型重复定义：

```go
func getStringData(v string) string { return v }
func getIntData(v int) int          { return v }
func getBoolData(v bool) bool       { return v }
```

用 `interface{}` 可以消除重复，但会丢失类型安全，调用方还需要类型断言：

```go
func getData(v interface{}) interface{} { return v }
```

泛型兼顾了复用与类型安全。

## 类型参数

方括号中声明类型参数，`any` 表示任意类型：

```go
package main

import "fmt"

func getData[T any](v T) T {
	return v
}

func main() {
	fmt.Println(getData("hello")) // string
	fmt.Println(getData(123))     // int
}
```

类型约束也可以用接口定义，只允许列出的类型：

```go
package main

import "fmt"

type Number interface {
	int | int64 | float64
}

func Add[T Number](a, b T) T {
	return a + b
}

func main() {
	fmt.Println(Add(1, 2))     // 3
	fmt.Println(Add(1.1, 2.2)) // 3.3000000000000003
}
```

## 泛型结构体与方法

泛型结构体的类型参数写在结构体名后面，方法的接收者也要带上类型参数：

```go
package main

import "fmt"

type Container[T any] struct {
	value T
}

func (c *Container[T]) Set(v T) { c.value = v }
func (c *Container[T]) Get() T  { return c.value }

func main() {
	c := Container[int]{}
	c.Set(42)
	fmt.Println(c.Get()) // 42
}
```

`~int` 表示底层类型是 `int` 的所有类型，包括 `int` 本身、类型别名和自定义类型：

```go
type Ordered interface {
	~int | ~int64 | ~float64 | ~string
}

type MinClass[T Ordered] struct {
	list []T
}

func (m *MinClass[T]) Add(list []T) { m.list = list }

func (m *MinClass[T]) Min() T {
	var zero T
	if len(m.list) == 0 {
		return zero
	}
	min := m.list[0]
	for _, v := range m.list[1:] {
		if v < min {
			min = v
		}
	}
	return min
}
```

`Ordered` 约束涵盖了整数、浮点和字符串等支持 `<` 比较的类型。

## 泛型接口

接口也可以带类型参数，让不同的具体实现返回各自的类型：

```go
package main

import "fmt"

type Usber[T any] interface {
	Start()
	Stop()
	GetDevice() T
}

type Phone struct{ Name string }

func (p Phone) Start()           { fmt.Println(p.Name, "开始工作") }
func (p Phone) Stop()            { fmt.Println(p.Name, "停止") }
func (p Phone) GetDevice() Phone { return p }

type Computer[T any] struct{ Name string }

func (c Computer[T]) Work(u Usber[T]) {
	u.Start()
	u.Stop()
	fmt.Printf("设备信息: %+v\n", u.GetDevice())
}

func main() {
	computer := Computer[Phone]{Name: "我的电脑"}
	computer.Work(Phone{Name: "小米手机"})
}
```

不同类型的设备需要创建对应的泛型实例（如 `Computer[Phone]`、`Computer[Camera]`）。

## 小结

- Go 1.18 引入泛型，用 `[T any]` 声明类型参数，兼顾复用与类型安全。
- 接口类型约束用 `|` 列出允许的类型；`~T` 匹配所有底层类型为 T 的类型。
- 泛型结构体和方法的接收者都要写 `[T]`。
- 泛型接口适合让不同实现返回各自的具体类型。

至此「Go 语言基础」系列 20 篇完结。

