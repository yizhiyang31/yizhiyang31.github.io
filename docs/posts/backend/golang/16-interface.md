---
title: Go 语言基础：接口详解
author: yizhiyang
date: 2026-11-13
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖接口的定义与隐式实现、空接口、类型断言、值接收者与指针接收者实现接口的区别，以及多接口与接口嵌套。

<!-- more -->

## 接口是什么

接口是一种抽象数据类型，定义对象的行为规范：只定义规范，不负责实现，由具体对象去实现。它体现了多态，也能实现高内聚、低耦合。

Go 的接口是一组 method 的集合，不能包含任何变量，方法也没有方法体。接口名一般在单词后加 `er`（如 `Writer`、`Stringer`）。

## 定义与实现

**Go 中接口是隐式实现的**：一个变量只要包含接口中的全部方法，就实现了该接口，不需要写 `implements` 之类的声明。

```go
package main

import "fmt"

type Usber interface {
	Start()
	Stop()
}

type Phone struct {
	Name string
}

func (p Phone) Start() { fmt.Println(p.Name, "开始工作") }
func (p Phone) Stop()  { fmt.Println("phone 停止") }

type Camera struct{}

func (c Camera) Start() { fmt.Println("相机开始工作") }
func (c Camera) Stop()  { fmt.Println("相机停止") }

type Computer struct{}

func (c Computer) Work(u Usber) {
	u.Start()
	u.Stop()
}

func main() {
	Computer{}.Work(Phone{"小米手机"})
	Computer{}.Work(Camera{})
}
```

方法名与接口名首字母大写时才能被包外访问；接口方法的参数和返回值变量名可以省略。

## 空接口

空接口不定义任何方法，因此**任何类型都实现了空接口**，可以表示任意类型：

```go
package main

import "fmt"

func print(x interface{}) {
	fmt.Println(x)
}

func main() {
	print(100)
	print("hello")
	print([]int{1, 2})
}
```

空接口可以作为 map 的值，也可以作为切片元素：

```go
m := make(map[string]interface{})
m["name"] = "张三"
m["age"] = 20

s := []interface{}{"go", 100, true}
```

> Go 1.18 之后 `interface{}` 可以用 `any` 代替，两者等价。

## 类型断言

因为空接口可以存任意类型，取出时需要判断具体类型。语法：`x.(T)`，返回转换后的变量和一个布尔值：

```go
package main

import "fmt"

func main() {
	var x interface{} = "你好 golang"

	v, ok := x.(string)
	if ok {
		fmt.Println("字符串:", v)
	} else {
		fmt.Println("不是字符串")
	}
}
```

需要判断多种类型时用 `type switch`，注意 `x.(type)` **只能结合 switch 使用**：

```go
package main

import "fmt"

func judge(x interface{}) {
	switch v := x.(type) {
	case string:
		fmt.Println("string:", v)
	case int:
		fmt.Println("int:", v)
	default:
		fmt.Println("unsupported type")
	}
}

func main() {
	judge("hello")
	judge(123)
	judge(true)
}
```

## 值接收者与指针接收者的区别

这一点很容易踩坑：

- 用**值接收者**实现接口时，结构体的值类型和指针类型**都可以**赋值给接口变量。
- 用**指针接收者**实现接口时，**只有指针类型**可以赋值给接口变量，值类型不行。

```go
package main

import "fmt"

type Speaker interface {
	Speak()
}

type Dog struct{ Name string }

// 值接收者实现
func (d Dog) Speak() { fmt.Println(d.Name, "汪汪") }

type Cat struct{ Name string }

// 指针接收者实现
func (c *Cat) Speak() { fmt.Println(c.Name, "喵喵") }

func main() {
	var s Speaker

	s = Dog{"小黑"}
	s.Speak() // OK
	s = &Dog{"小白"}
	s.Speak() // OK

	s = &Cat{"咪咪"}
	s.Speak() // OK
	// s = Cat{"花花"} // 编译错误：Cat 值类型没有实现 Speaker
}
```

## 多个接口与接口嵌套

一个结构体可以同时实现多个接口；接口之间也可以嵌套组合出新接口：

```go
package main

import "fmt"

type StartStopper interface {
	Start()
	Stop()
}

type Getter interface {
	Get() string
}

// 接口嵌套
type Device interface {
	StartStopper
	Getter
}

type Phone struct{ Name string }

func (p Phone) Start()        { fmt.Println(p.Name, "开始") }
func (p Phone) Stop()         { fmt.Println(p.Name, "停止") }
func (p Phone) Get() string   { return p.Name }

func main() {
	var d Device = Phone{"小米"}
	d.Start()
	d.Stop()
	fmt.Println(d.Get())
}
```

## 使用建议

需要特别提醒的是：**只有当两个或两个以上具体类型必须以相同方式处理时才定义接口**。不要为了接口而接口，否则只会增加不必要的抽象和运行时损耗。

## 小结

- Go 接口隐式实现：方法集包含接口全部方法即实现。
- 空接口 `interface{}` / `any` 可表示任意类型，取用时用类型断言或 type switch。
- 指针接收者实现接口时，只有指针类型满足条件。
- 接口可嵌套组合，但不要过度抽象。

