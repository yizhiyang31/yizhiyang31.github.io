---
title: Gin 框架：控制器与中间件
author: yizhiyang
date: 2026-11-17
category:
  - 后端
tag:
  - Gin
  - 学习笔记
---

本文讲解 Gin 中自定义控制器的分组与继承，以及中间件的各种用法，包括路由中间件、`ctx.Next()`、全局与分组中间件、数据共享和中间件注意事项。

<!-- more -->

## 自定义控制器

### 控制器分组

项目较大时，有必要对控制器进行分组。例如新建 `controller/admin/NewsController.go`：

```go
package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type NewsController struct{}

func (c NewsController) Index(ctx *gin.Context) {
	ctx.String(http.StatusOK, "新闻首页")
}
```

新建 `controller/admin/UserController.go`：

```go
package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserController struct{}

func (c UserController) Index(ctx *gin.Context) {
	ctx.String(http.StatusOK, "这是用户首页")
}

func (c UserController) Add(ctx *gin.Context) {
	ctx.String(http.StatusOK, "增加用户")
}
```

在路由文件 `adminRoutes.go` 中配置对应的路由：

```go
package routes

import (
	"net/http"

	"gin_demo/controller/admin"
	"github.com/gin-gonic/gin"
)

func AdminRoutesInit(router *gin.Engine) {
	adminRouter := router.Group("/admin")
	{
		adminRouter.GET("/user", admin.UserController{}.Index)
		adminRouter.GET("/user/add", admin.UserController{}.Add)
		adminRouter.GET("/news", admin.NewsController{}.Index)
	}
}
```

其他路由分组的配置方法类似，在 `main.go` 中分别初始化：

```go
func main() {
	r := gin.Default()
	routes.AdminRoutesInit(r)
	routes.ApiRoutesInit(r)
	routes.DefaultRoutesInit(r)
	r.Run(":8080")
}
```

### 控制器的继承

可以定义基础控制器 `controller/admin/BaseController.go`，封装公共方法：

```go
package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type BaseController struct{}

func (c BaseController) Success(ctx *gin.Context) {
	ctx.String(http.StatusOK, "成功")
}

func (c BaseController) Error(ctx *gin.Context) {
	ctx.String(http.StatusOK, "失败")
}
```

通过匿名嵌入即可让 `NewsController` 继承 `BaseController`，继承后就能调用控制器里的公共方法：

```go
package admin

import "github.com/gin-gonic/gin"

type NewsController struct {
	BaseController
}

func (c NewsController) Index(ctx *gin.Context) {
	c.Success(ctx)
}
```

## 中间件

Gin 允许开发者在处理请求的过程中加入自己的钩子（Hook）函数，这个钩子函数就叫中间件。中间件适合处理一些公共业务逻辑，例如登录认证、权限校验、数据分页、记录日志、耗时统计等。

通俗地说，中间件就是匹配路由前和匹配路由完成后执行的一系列操作。

### 路由中间件

Gin 中的中间件必须是 `gin.HandlerFunc` 类型。配置路由时可以传递多个回调函数，最后一个回调函数之前触发的方法都可以称为中间件。

```go
package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

func initMiddleware(ctx *gin.Context) {
	fmt.Println("我是一个中间件")
}

func main() {
	r := gin.Default()
	r.GET("/", initMiddleware, func(ctx *gin.Context) {
		ctx.String(200, "首页--中间件演示")
	})
	r.GET("/news", initMiddleware, func(ctx *gin.Context) {
		ctx.String(200, "新闻页面--中间件演示")
	})
	r.Run(":8080")
}
```

### ctx.Next()

在中间件里加上 `ctx.Next()`，可以让路由匹配完成后再执行一些操作。例如统计一个请求的执行时间：

```go
package main

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

func initMiddleware(ctx *gin.Context) {
	fmt.Println("1-执行中中间件")

	start := time.Now().UnixNano()

	// 调用该请求的剩余处理程序
	ctx.Next()
	fmt.Println("3-程序执行完成 计算时间")

	end := time.Now().UnixNano()
	fmt.Println(end - start)
}

func main() {
	r := gin.Default()
	r.GET("/", initMiddleware, func(ctx *gin.Context) {
		fmt.Println("2-执行首页返回数据")
		ctx.String(200, "首页--中间件演示")
	})
	r.Run(":8080")
}
```

### 多个中间件的执行顺序

一个路由可以配置多个中间件：

```go
func initMiddlewareOne(ctx *gin.Context) {
	fmt.Println("initMiddlewareOne--1-执行中中间件")
	// 调用该请求的剩余处理程序
	ctx.Next()
	fmt.Println("initMiddlewareOne--2-执行中中间件")
}

func initMiddlewareTwo(ctx *gin.Context) {
	fmt.Println("initMiddlewareTwo--1-执行中中间件")
	// 调用该请求的剩余处理程序
	ctx.Next()
	fmt.Println("initMiddlewareTwo--2-执行中中间件")
}

func main() {
	r := gin.Default()
	r.GET("/", initMiddlewareOne, initMiddlewareTwo, func(ctx *gin.Context) {
		fmt.Println("执行路由里面的程序")
		ctx.String(200, "首页--中间件演示")
	})
	r.Run(":8080")
}
```

控制台输出：

```text
initMiddlewareOne--1-执行中中间件
initMiddlewareTwo--1-执行中中间件
执行路由里面的程序
initMiddlewareTwo--2-执行中中间件
initMiddlewareOne--2-执行中中间件
```

可见中间件以"洋葱模型"执行：`Next()` 之前的代码按注册顺序执行，`Next()` 之后的代码按相反顺序执行。

### c.Abort()

`c.Abort()` 表示终止调用该请求的剩余处理程序（了解即可）：

```go
func initMiddlewareTwo(ctx *gin.Context) {
	fmt.Println("initMiddlewareTwo--1-执行中中间件")
	// 终止调用该请求的剩余处理程序
	ctx.Abort()
	fmt.Println("initMiddlewareTwo--2-执行中中间件")
}
```

此时输出为：

```text
initMiddlewareOne--1-执行中间件
initMiddlewareTwo--1-执行中间件
initMiddlewareTwo--2-执行中间件
initMiddlewareOne--2-执行中间件
```

### 全局中间件

用 `r.Use()` 注册全局中间件，对所有路由生效：

```go
package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

func initMiddleware(ctx *gin.Context) {
	fmt.Println("全局中间件 通过 r.Use 配置")
	// 调用该请求的剩余处理程序
	ctx.Next()
}

func main() {
	r := gin.Default()
	r.Use(initMiddleware)
	r.GET("/", func(ctx *gin.Context) {
		ctx.String(200, "首页--中间件演示")
	})
	r.GET("/news", func(ctx *gin.Context) {
		ctx.String(200, "新闻页面--中间件演示")
	})
	r.Run(":8080")
}
```

### 路由分组中间件

为路由组注册中间件有两种写法。

写法一：在 `Group` 时直接传入中间件：

```go
shopGroup := r.Group("/shop", StatCost())
{
	shopGroup.GET("/index", func(c *gin.Context) { /* ... */ })
	// ...
}
```

写法二：用 `Use` 注册：

```go
shopGroup := r.Group("/shop")
shopGroup.Use(StatCost())
{
	shopGroup.GET("/index", func(c *gin.Context) { /* ... */ })
	// ...
}
```

在分组路由文件 `AdminRoutes.go` 中配置中间件：

```go
package routes

import (
	"fmt"
	"net/http"

	"gin_demo/controller/admin"
	"github.com/gin-gonic/gin"
)

func initMiddleware(ctx *gin.Context) {
	fmt.Println("路由分组中间件")
	// 调用该请求的剩余处理程序
	ctx.Next()
}

func AdminRoutesInit(router *gin.Engine) {
	adminRouter := router.Group("/admin", initMiddleware)
	{
		adminRouter.GET("/user", admin.UserController{}.Index)
		adminRouter.GET("/user/add", admin.UserController{}.Add)
		adminRouter.GET("/news", func(c *gin.Context) {
			c.String(http.StatusOK, "news")
		})
	}
}
```

### 中间件与控制器共享数据

通过 `ctx.Set` 设置值，后续处理函数用 `ctx.Get` 取到该值。

设置值：

```go
ctx.Set("username", "张三")
```

获取值：

```go
username, _ := ctx.Get("username")
```

中间件中设置值：

```go
func InitAdminMiddleware(ctx *gin.Context) {
	fmt.Println("路由分组中间件")

	// 可以通过 ctx.Set 在请求上下文中设置值，后续的处理函数能够取到该值
	ctx.Set("username", "张三")

	// 调用该请求的剩余处理程序
	ctx.Next()
}
```

控制器中获取值：

```go
func (c UserController) Index(ctx *gin.Context) {
	username, _ := ctx.Get("username")
	fmt.Println(username)
	ctx.String(http.StatusOK, "这是用户首页 111")
}
```

### 中间件注意事项

**gin 默认中间件**

`gin.Default()` 默认使用了 `Logger` 和 `Recovery` 中间件：

- `Logger` 中间件将日志写入 `gin.DefaultWriter`，即使配置了 `GIN_MODE=release`。
- `Recovery` 中间件会 recover 任何 panic，如果有 panic，会写入 500 响应码。

如果不想使用这两个默认中间件，可以用 `gin.New()` 新建一个没有任何默认中间件的路由。

**中间件中使用 goroutine**

在中间件或 handler 中启动新的 goroutine 时，不能使用原始的上下文（`c *gin.Context`），必须使用其只读副本 `c.Copy()`：

```go
r.GET("/", func(c *gin.Context) {
	cCp := c.Copy()
	go func() {
		// 模拟耗时任务
		time.Sleep(5 * time.Second)
		// 这里使用创建的副本
		fmt.Println("Done! in path " + cCp.Request.URL.Path)
	}()
	c.String(200, "首页")
})
```

## 小结

- 控制器按目录分组，通过匿名嵌入基础控制器实现方法复用。
- 中间件必须是 `gin.HandlerFunc`，适合处理认证、日志、耗时统计等公共逻辑。
- `ctx.Next()` 调用剩余处理程序，形成"洋葱模型"执行顺序；`c.Abort()` 终止后续处理。
- 中间件注册方式：路由参数、`r.Use()`（全局）、`Group()` 参数或 `group.Use()`（分组）。
- 用 `ctx.Set` / `ctx.Get` 在中间件和控制器之间共享数据；goroutine 中必须使用 `c.Copy()`。
- `gin.Default()` 自带 Logger 和 Recovery，不需要时用 `gin.New()`。
