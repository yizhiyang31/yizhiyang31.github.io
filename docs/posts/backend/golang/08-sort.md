---
title: Go 语言基础：排序与 sort 包
author: yizhiyang
date: 2026-11-05
category:
  - 后端
tag:
  - Go
  - 数据类型
  - 学习笔记
---

本文涵盖手写选择排序和冒泡排序，以及 Go 标准库 `sort` 包的升序、降序用法。

<!-- more -->

## 选择排序

思路：每一轮从未排序部分选出最小的元素，放到已排序部分的末尾。

```go
package main

import "fmt"

func main() {
	n := []int{9, 8, 7, 6, 5, 4}

	for i := 0; i < len(n); i++ {
		for j := i + 1; j < len(n); j++ {
			if n[i] > n[j] {
				n[i], n[j] = n[j], n[i]
			}
		}
	}

	fmt.Println(n) // [4 5 6 7 8 9]
}
```

Go 支持 `a, b = b, a` 一行交换两个变量，不需要临时变量。

## 冒泡排序

思路：从头到尾比较相邻的两个元素，顺序不对就交换，每一轮把一个最大值放到正确位置。

冒泡写法与上面的选择排序写法相同（都是双重循环比较交换）；实际写冒泡时，内层循环比较的是相邻元素：

```go
func bubbleSort(a []int) {
	for i := 0; i < len(a)-1; i++ {
		for j := 0; j < len(a)-1-i; j++ {
			if a[j] > a[j+1] {
				a[j], a[j+1] = a[j+1], a[j]
			}
		}
	}
}
```

## sort 包

文档：<https://pkg.go.dev/sort>

### 升序排序

`sort.Ints()`、`sort.Float64s()`、`sort.Strings()` 都是从小到大排序：

```go
package main

import (
	"fmt"
	"sort"
)

func main() {
	ints := []int{2, 4, 3, 1}
	floats := []float64{4.2, 3.14, 2.71}
	strs := []string{"c", "a", "b"}

	sort.Ints(ints)
	sort.Float64s(floats)
	sort.Strings(strs)

	fmt.Println(ints, floats, strs)
}
```

### 降序排序

用 `sort.Reverse` 把 `Less` 逻辑反过来：

```go
package main

import (
	"fmt"
	"sort"
)

func main() {
	nums := []int{2, 4, 3, 1}
	sort.Sort(sort.Reverse(sort.IntSlice(nums)))
	fmt.Println(nums) // [4 3 2 1]
}
```

对结构体切片排序，需要实现 `sort.Interface` 的三个方法：`Len()`、`Less(i, j)`、`Swap(i, j)`。例如按年龄升序：

```go
package main

import (
	"fmt"
	"sort"
)

type Student struct {
	Name string
	Age  int
}

type ByAge []Student

func (a ByAge) Len() int           { return len(a) }
func (a ByAge) Less(i, j int) bool { return a[i].Age < a[j].Age }
func (a ByAge) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

func main() {
	students := []Student{{"张三", 20}, {"李四", 18}, {"王五", 22}}
	sort.Sort(ByAge(students))
	fmt.Println(students)
}
```

Go 1.21 起也可以使用泛型版本的 `slices.Sort` / `slices.SortFunc`，写法更简洁。

## 小结

- 学习排序的原理可以通过手写选择排序、冒泡排序来理解。
- 实际项目优先用 `sort` 包：`sort.Ints` / `Float64s` / `Strings` 升序，`sort.Reverse` 降序。
- 自定义类型排序只需实现 `sort.Interface`。

