---
title: Go 语言基础：包管理与 go mod
author: yizhiyang
date: 2026-11-12
category:
  - 后端
tag:
  - Go
  - 工程化
  - 学习笔记
---

本文涵盖包的概念与定义、`go mod` 初始化项目和常用命令、自定义包的导入、`init()` 初始化函数，以及第三方包的使用。

<!-- more -->

## 包

包（package）是多个 Go 源码文件的集合，是高级别的代码复用方案。Go 中的包分为：

- **系统内置包**：如 `fmt`、`math`、`os`
- **自定义包**：自己组织在项目中的包
- **第三方包**：如 `github.com/shopspring/decimal`，用于解决 float 精度丢失

一个文件夹下的文件只能归属同一个 package，同一个 package 的文件也不能分散在多个文件夹。包名可以和文件夹名不同，但不能包含 `-`。`main` 包是程序入口，编译后得到可执行文件。

## go mod

Go 1.11 之前自定义包必须放在 `GOPATH` 下；之后用 `go mod` 可以在磁盘任意位置建项目；Go 1.13 之后可以彻底不要 GOPATH。

初始化项目：

```bash
go mod init itying
```

会生成 `go.mod` 文件管理依赖。其他常用命令：

| 命令 | 说明 |
| --- | --- |
| `go mod download` | 下载依赖 |
| `go mod edit` | 编辑 go.mod |
| `go mod graph` | 打印模块依赖图 |
| `go mod tidy` | 增加丢失的 module，去掉未使用的 module |
| `go mod vendor` | 将依赖复制到 vendor 目录 |
| `go mod verify` | 校验依赖是否被本地修改 |
| `go mod why` | 解释为什么需要某个依赖 |

## 自定义包

创建 `calc/calc.go`：

```go
package calc

var a = 100 // 私有，包外不可访问
var Age = 20 // 首字母大写，公有

func Add(x, y int) int {
	return x + y
}
```

在 `main.go` 中导入使用：

```go
package main

import (
	"fmt"
	c "itying/calc" // 别名导入
)

func main() {
	fmt.Println(c.Add(10, 20)) // 30
	fmt.Println(c.Age)         // 20
}
```

标识符首字母大写才对外可见，访问形式是 `包名.标识符`。

导入的几种形式：

```go
import "fmt"                    // 单行导入
import (
	"fmt"
	"os"
)                               // 多行导入
import _ "github.com/x/y"       // 匿名导入，只执行包内 init，不使用标识符
import c "itying/calc"          // 别名导入
```

## init() 初始化函数

`init()` 没有参数也没有返回值，程序运行时自动调用，不能主动调用：

```go
package main

import "fmt"

func init() {
	fmt.Println("init")
}

func main() {
	fmt.Println("main")
}
```

初始化顺序：被最后导入的包最先初始化并执行它的 `init()`。同一个包内多个 `init()` 按代码顺序执行。

## 第三方包

第三方包可以在 <https://pkg.go.dev/> 查询文档。使用流程：

```bash
# 安装
go get github.com/shopspring/decimal

# 整理依赖（自动补全缺失、移除未使用）
go mod tidy
```

```go
package main

import (
	"fmt"

	"github.com/shopspring/decimal"
)

func main() {
	price := decimal.NewFromFloat(8.2)
	tax := decimal.NewFromFloat(3.8)
	fmt.Println(price.Sub(tax)) // 4.4，不会有精度丢失
}
```

## 小结

- 一个目录对应一个 package，首字母大写的标识符才对外可见。
- `go mod init` 让项目摆脱 GOPATH 限制，`go mod tidy` 维护依赖。
- 导入支持别名、匿名导入；`init()` 自动执行且按依赖顺序调用。
- 第三方包用 `go get` 安装，文档在 pkg.go.dev 查询。

