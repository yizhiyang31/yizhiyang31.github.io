---
title: Gin 框架：介绍与环境搭建
author: yizhiyang
date: 2026-11-16
category:
  - 后端
tag:
  - Gin
  - 学习笔记
---

本文是 Gin 框架系列的开篇，介绍 Gin 的特点与适用场景、开发环境的搭建步骤，以及如何借助第三方工具实现 Go 程序的热加载。

<!-- more -->

## Gin 介绍

Gin 是一个用 Go（Golang）编写的轻量级 HTTP Web 框架，运行速度非常快，适合对性能和效率有追求的场景。

Gin 最擅长的是 API 接口的高并发处理。当项目规模不大、业务相对简单时，推荐使用 Gin；当某个接口的性能遭遇较大挑战时，也可以考虑用 Gin 重写接口。

Gin 也是一个流行的 Go Web 框架，GitHub Star 数已超过 50k。

- 官网：<https://gin-gonic.com/zh-cn/>
- GitHub 地址：<https://github.com/gin-gonic/gin>

## 环境搭建

安装 Gin 之前，需要先安装 Go 并设置 Go 工作区。

### 安装与引入

下载并安装 Gin：

```bash
go get -u github.com/gin-gonic/gin
```

在代码中引入 Gin：

```go
import "github.com/gin-gonic/gin"
```

如果需要使用 `http.StatusOK` 之类的常量，还需引入 `net/http` 包：

```go
import "net/http"
```

### 第一个 Gin 程序

新建 `main.go`，配置路由并启动服务：

```go
package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	// 创建一个默认的路由引擎
	r := gin.Default()

	// 配置路由
	r.GET("/", func(c *gin.Context) {
		// c.JSON：返回 JSON 格式的数据
		c.JSON(200, gin.H{
			"message": "Hello world!",
		})
	})

	// 启动 HTTP 服务，默认在 0.0.0.0:8080 启动
	r.Run()
}
```

运行项目：

```bash
go run main.go
```

### 修改默认端口

`Run()` 方法传入地址即可改变默认启动端口：

```go
r.Run(":9000")
```

若 `go get` 失败，可参考相关社区讨论：<http://bbs.itying.com/topic/5ed08edee7c0790f8475e276>

## 热加载

所谓热加载，是指修改代码后程序能够自动重新加载并执行。这在开发中非常便利，可以快速测试代码，省去每次手动重新编译的步骤。

beego 可以使用官方提供的 bee 工具实现热加载，但 Gin 并没有官方的热加载工具，需要借助第三方工具。

### 工具一：fresh（推荐）

项目地址：<https://github.com/gravityblast/fresh>

```bash
go get github.com/pilu/fresh
```

在项目目录下运行：

```bash
fresh
```

### 工具二：gin

项目地址：<https://github.com/codegangsta/gin>

```bash
go get -u github.com/codegangsta/gin
```

运行项目：

```bash
gin run main.go
```

## 小结

- Gin 是轻量级高性能的 Go Web 框架，尤其适合 API 接口与中小型项目。
- 环境搭建：`go get -u github.com/gin-gonic/gin`，代码中引入 `github.com/gin-gonic/gin`。
- `gin.Default()` 创建默认路由引擎，`c.JSON()` 返回 JSON 数据，`r.Run()` 启动服务并可通过参数指定端口。
- Gin 无官方热加载工具，可借助第三方工具 `fresh` 或 `gin` 实现。
