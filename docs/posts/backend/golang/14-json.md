---
title: Go 语言基础：结构体与 JSON 相互转换
author: yizhiyang
date: 2026-11-11
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖用 `encoding/json` 包实现结构体与 JSON 字符串的序列化、反序列化，以及结构体标签 Tag 的用法。

<!-- more -->

## 关于 JSON

JSON 是一种轻量级的数据交换格式，RESTful API 返回的数据大多是 JSON。

- **序列化**：结构体对象 → JSON 字符串，用 `json.Marshal()`
- **反序列化**：JSON 字符串 → 结构体对象，用 `json.Unmarshal()`

## 基本用法

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Student struct {
	ID     int
	Gender string
	Name   string
	Sno    string
	name   string // 小写私有属性，json 包无法访问
}

func main() {
	s1 := Student{ID: 1, Gender: "男", Name: "李四", Sno: "s0001", name: "私有"}

	// 序列化
	b, err := json.Marshal(s1)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(b))
	// {"ID":1,"Gender":"男","Name":"李四","Sno":"s0001"}

	// 反序列化
	var s2 Student
	err = json.Unmarshal([]byte(`{"ID":1,"Gender":"男","Name":"李四","Sno":"s0001"}`), &s2)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Printf("%#v\n", s2)
}
```

反序列化时 `Unmarshal` 的第二个参数必须传指针 `&s2`。私有字段不会出现在序列化结果中。

## 结构体标签 Tag

Tag 是结构体的元信息，可以在运行时通过反射读取。写法是写在字段后面的反引号中：

```go
`key1:"value1" key2:"value2"`
```

- 键和值用冒号分隔，值用双引号包裹
- 多组标签之间用空格分隔
- `json:"id"` 可以指定序列化后在 JSON 中的 key

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Student struct {
	ID     int    `json:"id"`
	Gender string `json:"gender"`
	Name   string `json:"name"`
	Sno    string `json:"sno"`
}

func main() {
	s := Student{ID: 1, Gender: "男", Name: "李四", Sno: "s0001"}
	b, _ := json.Marshal(s)
	fmt.Println(string(b))
	// {"id":1,"gender":"男","name":"李四","sno":"s0001"}
}
```

Tag 解析的容错能力很差：格式写错时编译和运行都不会报错，只是 tag 不生效。注意不要在 key 和 value 之间加空格。

常用标签选项：

```go
type User struct {
	Name   string `json:"name"`
	Age    int    `json:"age,omitempty"` // 零值时省略该字段
	Secret string `json:"-"`             // 忽略该字段
}
```

## 嵌套结构体

嵌套结构体可以直接序列化与反序列化：

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Student struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Class struct {
	ID       int       `json:"id"`
	Name     string    `json:"name"`
	Students []Student `json:"students"`
}

func main() {
	c := Class{
		ID:   1,
		Name: "一年级一班",
		Students: []Student{
			{ID: 1, Name: "张三"},
			{ID: 2, Name: "李四"},
		},
	}

	b, _ := json.Marshal(c)
	fmt.Println(string(b))

	var c2 Class
	json.Unmarshal(b, &c2)
	fmt.Printf("%#v\n", c2)
}
```

map 和切片同样可以被序列化与反序列化：

```go
b, _ := json.Marshal(map[string]interface{}{
	"name": "张三",
	"age":  20,
})
fmt.Println(string(b))
```

## 小结

- 序列化用 `json.Marshal`，反序列化用 `json.Unmarshal(数据, &变量)`。
- 只有首字母大写的导出字段才会被 json 包处理。
- 用 Tag 修改 JSON 字段名、`omitempty` 忽略零值、`-` 忽略字段。
- 嵌套结构体、map、切片都可以直接序列化。

