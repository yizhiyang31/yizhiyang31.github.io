---
title: Go 语言基础：结构体详解
author: yizhiyang
date: 2026-11-10
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖自定义类型与类型别名、结构体的定义与初始化、方法和接收者、匿名字段、嵌套结构体，以及用嵌套实现「继承」。

<!-- more -->

## 关于结构体

Go 没有 class，但可以用 struct 把多个基本数据类型封装成一个整体，扩展性和灵活性更高。

### 自定义类型与类型别名

```go
type newInt int   // 自定义类型，是新类型
type myInt = int  // 类型别名，本质上同一个类型
```

`rune` 是 `int32` 的别名，`byte` 是 `uint8` 的别名。

```go
package main

import "fmt"

type newInt int
type myInt = int

func main() {
	var a newInt
	var b myInt
	fmt.Printf("%T %T\n", a, b) // main.newInt int
}
```

## 定义与初始化

```go
type Person struct {
	name string
	age  int8
}
```

只有实例化时才真正分配内存。首字母大写表示公有、跨包可用，小写表示私有。

常见的实例化方式：

```go
package main

import "fmt"

type Person struct {
	Name string
	Age  int8
}

func main() {
	var p1 Person                    // var 实例化，零值
	p2 := new(Person)                // new 实例化，返回指针
	p3 := &Person{}                  // 取地址
	p4 := Person{Name: "张三", Age: 20} // 键值对初始化
	p5 := &Person{Name: "李四", Age: 21} // 结构体指针初始化
	p6 := Person{"王五", 22}          // 值的列表初始化，必须写全部字段

	fmt.Println(p1, p2, p3, p4, p5, p6)
}
```

注意事项：

- 值列表初始化必须初始化全部字段，且顺序与声明一致，不能与键值对初始化混用。
- 键值对初始化时最后一个属性后面也要写逗号（多行写法）。
- 结构体指针可以直接用 `.` 访问成员，底层其实是 `(*p).Name`。

## 方法与接收者

方法是带接收者的函数。接收者变量名通常用类型名的首字母小写，类似其他语言中的 `this` / `self`。

```go
package main

import "fmt"

type Person struct {
	Name string
	Age  int8
}

// 值类型接收者：操作的是副本，不能修改原变量
func (p Person) printInfo() {
	fmt.Printf("%s %d\n", p.Name, p.Age)
}

// 指针类型接收者：可以修改原变量
func (p *Person) setInfo(name string, age int8) {
	p.Name = name
	p.Age = age
}

func main() {
	p := &Person{}
	p.setInfo("小王子", 25)
	p.printInfo() // 小王子 25
}
```

可以给任意类型添加方法，但**别的包里的类型不能定义方法**（只能给本包定义的类型添加）。

## 匿名字段

匿名字段是指只写类型不写字段名，默认以类型名作为字段名，同类型的匿名字段只能有一个。

```go
package main

import "fmt"

type Address struct {
	Province string
	City     string
}

type User struct {
	Name string
	Address // 匿名字段
}

func main() {
	u := User{Name: "张三", Address: Address{"广东", "深圳"}}
	fmt.Println(u.City)           // 深圳，可以直接访问匿名结构体的字段
	fmt.Println(u.Address.Province) // 广东
}
```

访问成员时先在本结构体查找，找不到再到匿名结构体里查找。若字段名冲突，用 `u.Address.CreateTime` 这样的完整路径指定。

## 嵌套与「继承」

通过嵌套匿名字段（可以是指针）可以模拟继承效果，外层结构体可以直接调用内层结构体的方法：

```go
package main

import "fmt"

type Animal struct {
	name string
}

func (a *Animal) run() {
	fmt.Println(a.name, "会运动")
}

type Dog struct {
	Age int8
	*Animal // 嵌套匿名指针
}

func main() {
	d := &Dog{4, &Animal{"阿奇"}}
	d.run() // 阿奇 会运动
	fmt.Println(d.Age, d.name)
}
```

## 小结

- `type T int` 是新类型，`type T = int` 是别名。
- 结构体实例化有 `var`、`new`、`&T{}`、键值对、值列表等多种方式。
- 值接收者操作副本，指针接收者才能修改原对象。
- 匿名字段与嵌套可以实现字段提升和类似继承的效果。

