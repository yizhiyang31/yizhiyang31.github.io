---
title: Go 语言基础：map 详解
author: yizhiyang
date: 2026-11-06
category:
  - 后端
tag:
  - Go
  - 数据类型
  - 学习笔记
---

本文涵盖map 的声明与初始化、增删查改、判断键是否存在、遍历顺序问题，以及 map 与切片相互嵌套的用法。

<!-- more -->

## map 介绍

map 是一种无序的 key-value 数据结构，类似其他语言中的字典。它是**引用类型**，必须初始化后才能使用。

声明语法：`map[KeyType]ValueType`

```go
var m map[string]int // 零值为 nil，不能直接使用
m = make(map[string]int, 8) // 分配内存，8 是预估容量

m["张三"] = 90
m["小明"] = 100
fmt.Println(m)
```

`make` 用于分配 slice、map、channel 的内存。声明时也可以直接填充元素：

```go
m := map[string]int{"张三": 90, "小明": 100}
```

注意：获取 map 的元素数量用 `len(m)`；`cap(m)` 返回的是底层空间相关信息，不要用 `cap` 获取 map 容量。

## 基本操作

```go
package main

import "fmt"

func main() {
	m := make(map[string]int, 8)

	// 增 / 改
	m["张三"] = 90
	m["小明"] = 100

	// 查：直接取值，不存在的键返回零值
	fmt.Println(m["张三"], m["李四"])

	// 判断键是否存在
	if v, ok := m["张三"]; ok {
		fmt.Println("存在，值为", v)
	}

	// 删
	delete(m, "小明")
	fmt.Println(m)
}
```

`value, ok := m[key]` 是 map 特有的写法：`ok` 为 `true` 表示键存在，否则 `value` 是零值。

## 遍历

用 `for range` 遍历，可以只取 key：

```go
package main

import "fmt"

func main() {
	m := map[string]int{"张三": 90, "小明": 100, "李四": 88}

	for k, v := range m {
		fmt.Println(k, v)
	}

	for k := range m {
		fmt.Println("key:", k)
	}
}
```

**map 的遍历顺序和插入顺序无关**，每次遍历的顺序都可能不同。需要按顺序输出时，先把 key 放进切片再排序：

```go
package main

import (
	"fmt"
	"sort"
)

func main() {
	m := map[string]int{"张三": 90, "小明": 100, "李四": 88}

	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	for _, k := range keys {
		fmt.Println(k, m[k])
	}
}
```

## 嵌套结构

### 元素是 map 的切片

```go
package main

import "fmt"

func main() {
	s := make([]map[string]string, 3)
	s[0] = make(map[string]string, 10)
	s[0]["name"] = "小王子"
	s[0]["age"] = "18"

	fmt.Println(s)
}
```

map 作为切片元素时，每个元素都需要单独 `make` 初始化，否则是 nil。

### 值是切片的 map

```go
package main

import "fmt"

func main() {
	m := make(map[string][]string, 3)
	m["中国"] = append(m["中国"], "北京", "上海")
	m["日本"] = append(m["日本"], "东京", "大阪")

	fmt.Println(m)
}
```

用 `value, ok := m[key]` 判断某个键是否已经初始化，再决定是否 `append`。

## 小结

- map 是无序的引用类型，必须 `make` 初始化后使用。
- 查询用 `v, ok := m[key]` 判断键是否存在，删除用 `delete(m, key)`。
- 遍历顺序不确定，需要有序输出就先排序 key。
- map 与切片可以互相嵌套，注意内层容器也要初始化。

