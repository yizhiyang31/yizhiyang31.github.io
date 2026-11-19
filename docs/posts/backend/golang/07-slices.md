---
title: Go 语言基础：切片
author: yizhiyang
date: 2026-11-04
category:
  - 后端
tag:
  - Go
  - 数据类型
  - 学习笔记
---

本文涵盖切片的定义、长度与容量、`make`、`append` 与扩容策略、`copy`，以及切片的删除操作和引用类型特性。

<!-- more -->

## 为什么需要切片

数组长度固定，使用场景有限。切片（slice）是对数组的一层封装，是一个拥有相同类型元素的**可变长度序列**。

切片是**引用类型**，内部结构包含三个部分：指向底层数组的指针、长度 `len`、容量 `cap`。

## 定义方式

语法：`var name []T`

```go
package main

import "fmt"

func main() {
	var s1 []int // nil 切片
	s2 := []int{1, 2, 3}
	s3 := make([]int, 3, 10) // 长度 3，容量 10

	// 基于数组定义切片
	arr := [5]int{55, 56, 57, 58, 59}
	s4 := arr[1:4] // [56 57 58]

	// 切片再切片
	s5 := s2[1:3] // [2 3]

	fmt.Println(s1, s2, s3, s4, s5)
	fmt.Println(len(s3), cap(s3)) // 3 10
}
```

`arr[low:high]` 遵循左闭右开规则。`s4` 的容量是从起始位置到底层数组末尾的元素个数，所以 `cap(s4) == 4`。

### nil 与空切片

```go
var a []int     // nil 切片
b := []int{}    // 空切片，非 nil
c := make([]int, 0)

fmt.Println(a == nil, b == nil, c == nil) // true false false
```

判断切片是否为空应统一用 `len(s) == 0`，不要只判断 `s == nil`。

各类型的零值：bool 为 `false`，数值为 `0`，string 为 `""`，而指针、切片、map、channel、函数、接口都是 `nil`。

## 引用类型与拷贝

切片赋值共享同一个底层数组，修改一个会影响另一个：

```go
s1 := make([]int, 3)
s2 := s1
s2[0] = 100
fmt.Println(s1) // [100 0 0]
```

需要独立副本时使用 `copy`：

```go
cp := make([]int, len(s1))
copy(cp, s1)
cp[0] = 9
fmt.Println(s1, cp) // [100 0 0] [9 0 0]
```

切片**不能比较**，只能和 `nil` 比较。

## append 与扩容

`append` 必须用原变量接收返回值，因为扩容后底层数组可能已经改变：

```go
package main

import "fmt"

func main() {
	s := []int{1, 2, 3}
	s = append(s, 4, 5)          // 追加多个元素
	other := []int{6, 7}
	s = append(s, other...)      // 追加另一个切片，必须用 ...
	fmt.Println(s)               // [1 2 3 4 5 6 7]

	// 删除索引 2 的元素
	s = append(s[:2], s[3:]...)
	fmt.Println(s)               // [1 2 4 5 6 7]
}
```

扩容策略：

1. 如果新容量大于原容量的 2 倍，就采用新容量；
2. 否则当原长度小于 1024 时，容量翻倍；
3. 原长度大于等于 1024 时，每次增加约 1/4，直到满足需要；
4. 计算溢出时直接采用新容量。

不同元素类型的扩容处理也略有差异，实际开发中不必依赖精确容量，用 `cap()` 查看即可。

## 遍历

```go
for i, v := range s {
	fmt.Println(i, v)
}
```

## 小结

- 切片 = 底层数组指针 + `len` + `cap`，是引用类型。
- 定义方式：字面量、数组切取、`make()`。
- 判空用 `len(s) == 0`；切片只能与 `nil` 比较。
- `append` 要接收返回值；追加切片用 `s...`。
- 删除元素用 `append(s[:i], s[i+1:]...)`；要独立副本用 `copy`。

