---
title: Go 语言基础：反射
author: yizhiyang
date: 2026-11-15
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖反射的基本概念、`reflect.TypeOf` 与 `reflect.ValueOf`、Type 与 Kind 的区别、结构体反射、通过反射修改值和调用方法，以及反射的使用建议。

<!-- more -->

## 为什么需要反射

空接口可以保存任意类型的值。要知道它具体是什么类型、值是多少，可以用类型断言，也可以用反射。

实际应用场景包括：JSON 结构体 Tag 的序列化、ORM 框架等。

反射是程序在运行期访问和修改自身的能力。Go 在编译期会把字段名、类型、结构体信息等反射信息写入可执行文件。

## TypeOf 与 ValueOf

空接口值由**具体类型**和**具体值**两部分组成，反射中对应 `reflect.Type` 和 `reflect.Value`。

- `reflect.TypeOf(x)` 接受任意值，返回它的类型对象
- `reflect.ValueOf(x)` 返回值的 `reflect.Value`

```go
package main

import (
	"fmt"
	"reflect"
)

type myInt int64

type Person struct {
	Name string
	Age  int
}

func show(x any) {
	t := reflect.TypeOf(x)
	v := reflect.ValueOf(x)
	fmt.Printf("Type: %v | Value: %v | Name: %v | Kind: %v\n",
		t, v, t.Name(), t.Kind())
}

func main() {
	var p *float32
	show(p)         // Name 为空，Kind 为 ptr
	show(myInt(1))  // Name 为 main.myInt，Kind 为 int64
	show(Person{})  // Name 为 main.Person，Kind 为 struct
	show([]int{1})  // Name 为空，Kind 为 slice
}
```

**Type 是类型，Kind 是底层类别**。数组、切片、map、指针等类型的 `Name()` 返回空字符串，但 `Kind()` 有值。

`reflect.Value` 可以用 `Interface()`、`Int()`、`Uint()`、`Float()`、`Bool()`、`String()`、`Bytes()` 等方法取出原始值。

## 通过反射修改值

通过反射修改变量**必须传地址**，并用 `Elem()` 获取指针对应的值。直接对值的副本调用 `SetInt` 会 panic：

```go
package main

import (
	"fmt"
	"reflect"
)

func setInt(arg any) {
	v := reflect.ValueOf(arg)
	if v.Kind() == reflect.Ptr && v.Elem().Kind() == reflect.Int64 {
		v.Elem().SetInt(200)
	}
}

func main() {
	n := int64(100)
	setInt(&n)
	fmt.Println(n) // 200
}
```

## 结构体反射

常用方法：

| 分类 | 方法 |
| --- | --- |
| Type | `NumField()`、`Field(i)`、`FieldByName(name)`、`FieldByIndex()`、`FieldByNameFunc()` |
| Type | `NumMethod()`、`Method(i)`、`MethodByName(name)` |
| Value | `Field(i)`、`FieldByName(name)`、`SetString()`、`SetInt()` |
| Value | `Method(i).Call([]reflect.Value{})`、`CallSlice()` |

`StructField` 类型包含 `Name`、`PkgPath`、`Type`、`Tag`、`Offset`、`Index`、`Anonymous` 等信息。

```go
package main

import (
	"fmt"
	"reflect"
)

type Student struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func (s Student) GetInfo() string {
	return fmt.Sprintf("%s %d", s.Name, s.Age)
}

func (s *Student) SetInfo(name string, age int) {
	s.Name = name
	s.Age = age
}

func main() {
	s := Student{Name: "小明", Age: 15}
	t := reflect.TypeOf(s)
	v := reflect.ValueOf(&s).Elem()

	// 读取字段信息
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		fmt.Println(field.Name, field.Type, field.Tag.Get("json"))
	}

	// 读取并修改字段值
	fmt.Println("name:", v.FieldByName("Name").String())
	v.FieldByName("Name").SetString("李四")
	fmt.Println("after:", v.FieldByName("Name").String())

	// 调用方法：参数与返回值都是 []reflect.Value
	ret := v.MethodByName("GetInfo").Call(nil)
	fmt.Println(ret[0].String())
}
```

调用方法时要用值变量；如果方法是指针接收者，需要用 `reflect.ValueOf(&s)` 而不是 `reflect.ValueOf(s)`。

## 不要乱用反射

需要特别强调：不要滥用反射。

1. 反射相关的错误很多是运行期才会 panic，编译器帮不上忙。
2. 反射代码可读性差，逻辑不直观。
3. 能用普通代码解决的问题，不要动用反射。

## 小结

- 反射把接口值的类型与值分别用 `reflect.Type` 和 `reflect.Value` 表示。
- `Type` 是具体类型，`Kind` 是底层类别；数组、切片等类型的 `Name()` 为空。
- 修改值必须传地址并用 `Elem()`；结构体反射可读取字段、Tag 并调用方法。
- 反射灵活但危险，仅在框架等必要场景使用。

