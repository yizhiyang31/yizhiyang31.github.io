---
title: Go 语言基础：基本数据类型
author: yizhiyang
date: 2026-10-31
category:
  - 后端
tag:
  - Go
  - 数据类型
  - 学习笔记
---

本文涵盖Go 的整型、浮点型、布尔型、字符串，`unsafe.Sizeof`、数字字面量语法，以及 `byte` 与 `rune` 的区别。

<!-- more -->

## 数据类型总览

Go 的数据类型分为两类：

- **基本数据类型**：整型、浮点型、布尔型、字符串
- **复合数据类型**：数组、切片、结构体、函数、map、通道（channel）、接口等

## 整型

有符号整型按长度分为 `int8`、`int16`、`int32`、`int64`，对应的无符号整型为 `uint8`、`uint16`、`uint32`、`uint64`。

| 类型 | 范围 | 占用空间 |
| --- | --- | --- |
| int8 | -128 ~ 127 | 1 字节 |
| int16 | -32768 ~ 32767 | 2 字节 |
| int32 | -2147483648 ~ 2147483647 | 4 字节 |
| int64 | -9223372036854775808 ~ 9223372036854775807 | 8 字节 |
| uint8 | 0 ~ 255 | 1 字节 |
| uint16 | 0 ~ 65535 | 2 字节 |
| uint32 | 0 ~ 4294967295 | 4 字节 |
| uint64 | 0 ~ 18446744073709551615 | 8 字节 |

关于字节：`8 bit = 1 Byte`，`1024 Byte = 1 KB`，依此类推。

特殊整型：

| 类型 | 描述 |
| --- | --- |
| uint | 32 位系统上是 uint32，64 位系统上是 uint64 |
| int | 32 位系统上是 int32，64 位系统上是 int64 |
| uintptr | 无符号整型，用于存放指针 |

使用 `int` 和 `uint` 时不能假定它是 32 位还是 64 位。实际项目中整数、切片与 map 的元素数量一般可以用 `int`；涉及二进制传输、需要保持文件结构不受平台字节长度影响时，不要用 `int` 和 `uint`。

### unsafe.Sizeof 与数字字面量

`unsafe.Sizeof(n1)` 返回变量占用的字节数。Go 1.13 起支持二进制 `0b`、八进制 `0o`、十六进制浮点 `0x1p-2`，以及用 `_` 分隔数字。

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	var num int64 = 123
	fmt.Printf("值:%v 类型:%T\n", num, num)

	var a int8 = 120
	fmt.Printf("%T %v\n", a, unsafe.Sizeof(a)) // int8 1

	fmt.Println(123_456) // 123456，0b00101101 = 45，0o377 = 255

	var n int = 10
	fmt.Printf("%d %b %o %x %X\n", n, n, 077, 0xff, 0xff) // 10 1010 77 ff FF
}
```

## 浮点型

Go 支持 `float32` 和 `float64`，遵循 IEEE 754 标准：

- `float32` 最大范围约 `3.4e38`，常量 `math.MaxFloat32`
- `float64` 最大范围约 `1.8e308`，常量 `math.MaxFloat64`

默认浮点类型是 `float64`。打印时用 `%f`，`%.2f` 保留两位小数。

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	fmt.Printf("%f %.2f\n", math.Pi, math.Pi)
	fmt.Println(8.2 - 3.8) // 4.399999999999999，精度丢失
}
```

浮点数存在精度问题，涉及金额等对精度要求高的场景，建议使用第三方库 `github.com/shopspring/decimal`。

## 布尔型

布尔型只有 `true` 和 `false`，默认值为 `false`。

-  bool 类型不能和整型相互转换
-  bool 不能参与数值运算

## 字符串

字符串是 UTF-8 编码的，底层是 byte 数组且**不可直接修改**。

- 双引号中的转义字符生效
- 反引号（raw string）中的换行会原样输出，转义无效

```go
package main

import "fmt"

func main() {
	s := `第一行
第二行`
	fmt.Println(s)
	fmt.Println(len("你好")) // 6，UTF-8 下一个汉字占 3 字节
}
```

常用的 `strings` 包方法：

```go
package main

import (
	"fmt"
	"strings"
)

func main() {
	fmt.Println(strings.Join(strings.Split("123-456-789", "-"), "*"))
	fmt.Println(strings.Contains("this is golang", "golang")) // true
	fmt.Println(strings.HasPrefix("this is golang", "this"))  // true
	fmt.Println(strings.Index("this is golang", "is"))        // 2
}
```

## byte 与 rune

- `byte` 是 `uint8` 的别名，代表 ASCII 字符的一个字节
- `rune` 是 `int32` 的别名，代表一个 UTF-8 字符

直接按下标遍历含中文的字符串会看到乱码，按 `rune` 遍历才正确：

```go
package main

import "fmt"

func main() {
	s := "hello 张三"

	for i := 0; i < len(s); i++ {
		fmt.Printf("%v(%c) ", s[i], s[i]) // 按字节遍历，中文乱码
	}
	fmt.Println()

	for _, r := range s {
		fmt.Printf("%v(%c) ", r, r) // 按 rune 遍历，中文正常
	}
	fmt.Println()
}
```

要修改字符串，需要先转换成 `[]byte` 或 `[]rune`，修改后再转回字符串：

```go
package main

import "fmt"

func main() {
	b := []byte("big")
	b[0] = 'p'
	fmt.Println(string(b)) // pig

	r := []rune("白萝卜")
	r[0] = '红'
	fmt.Println(string(r)) // 红萝卜
}
```

处理 ASCII 内容用 `[]byte` 即可，包含中文等多字节字符时必须用 `[]rune`。

