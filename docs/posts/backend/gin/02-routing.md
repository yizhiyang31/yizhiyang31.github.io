---
title: Gin 框架：路由详解
author: yizhiyang
date: 2026-11-16
category:
  - 后端
tag:
  - Gin
  - 学习笔记
---

本文详解 Gin 的路由机制，包括 RESTful 设计思想、基本路由配置、各类响应方式、GET/POST/动态路由传值与结构体绑定，以及路由组和路由文件分组的实践。

<!-- more -->

## 路由概述

路由（Routing）由一个 URI（路径）和一个特定的 HTTP 方法（GET、POST 等）组成，决定应用如何响应客户端对某个网站节点的访问。

RESTful API 是目前较为成熟的互联网应用程序 API 设计理论，设计路由时建议参考 RESTful 指南。在 RESTful 架构中，每个网址代表一种资源，不同的请求方式表示不同的操作：

| 请求方式 | 操作 | 说明 |
| --- | --- | --- |
| GET | SELECT | 从服务器取出资源（一项或多项） |
| POST | CREATE | 在服务器新建一个资源 |
| PUT | UPDATE | 在服务器更新资源（客户端提供改变后的完整资源） |
| DELETE | DELETE | 从服务器删除资源 |

## 基本路由配置

可以通过 Postman 测试各类请求：

```go
r.GET("网址", func(c *gin.Context) { c.String(200, "Get") })
r.POST("网址", func(c *gin.Context) { c.String(200, "POST") })
r.PUT("网址", func(c *gin.Context) { c.String(200, "PUT") })
r.DELETE("网址", func(c *gin.Context) { c.String(200, "DELETE") })
```

## 响应方式

### 返回字符串

```go
r.GET("/news", func(c *gin.Context) {
	aid := c.Query("aid")
	c.String(200, "aid=%s", aid)
})
```

### 返回 JSON

`gin.H` 是 `map[string]interface{}` 的缩写，可以用它直接拼接 JSON，也可以使用结构体：

```go
func main() {
	r := gin.Default()

	// 方式一：自己拼接 JSON
	r.GET("/someJSON", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello world!"})
	})

	// 方法二：使用结构体
	r.GET("/moreJSON", func(c *gin.Context) {
		var msg struct {
			Name    string `json:"user"`
			Message string
			Age     int
		}
		msg.Name = "IT 营学院"
		msg.Message = "Hello world!"
		msg.Age = 18
		c.JSON(http.StatusOK, msg)
	})

	r.Run(":8080")
}
```

### 返回 JSONP

访问 `/JSONP?callback=x` 将输出 `x({"foo":"bar"})`：

```go
func main() {
	r := gin.Default()

	r.GET("/JSONP", func(c *gin.Context) {
		data := map[string]interface{}{
			"foo": "bar",
		}
		c.JSONP(http.StatusOK, data)
	})

	// 监听并在 0.0.0.0:8080 上启动服务
	r.Run(":8080")
}
```

### 返回 XML

```go
func main() {
	r := gin.Default()

	// 方式一：自己拼接
	r.GET("/someXML", func(c *gin.Context) {
		c.XML(http.StatusOK, gin.H{"message": "Hello world!"})
	})

	// 方法二：使用结构体
	r.GET("/moreXML", func(c *gin.Context) {
		type MessageRecord struct {
			Name    string
			Message string
			Age     int
		}
		var msg MessageRecord
		msg.Name = "IT 营学院"
		msg.Message = "Hello world!"
		msg.Age = 18
		c.XML(http.StatusOK, msg)
	})

	r.Run(":8080")
}
```

### 渲染模板

```go
router.GET("/", func(c *gin.Context) {
	c.HTML(http.StatusOK, "default/index.html", map[string]interface{}{
		"title": "前台首页",
	})
})
```

## 路由传值

### GET 传值

访问 `GET /user?uid=20&page=1`，用 `c.Query` 获取参数，`c.DefaultQuery` 可在参数缺失时指定默认值：

```go
router.GET("/user", func(c *gin.Context) {
	uid := c.Query("uid")
	page := c.DefaultQuery("page", "0")
	c.String(200, "uid=%v page=%v", uid, page)
})
```

### POST 传值

定义表单页面 `add_user.html`：

```html
{{ define "default/add_user.html" }}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <form action="/doAddUser" method="post">
        用户名：<input type="text" name="username" />
        密码: <input type="password" name="password" />
        <input type="submit" value="提交">
    </form>
</body>
</html>
{{ end }}
```

用 `c.PostForm` 接收表单数据，用 `c.DefaultPostForm` 指定默认值：

```go
router.GET("/addUser", func(c *gin.Context) {
	c.HTML(200, "default/add_user.html", gin.H{})
})

router.POST("/doAddUser", func(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")
	age := c.DefaultPostForm("age", "20")
	c.JSON(200, gin.H{
		"username": username,
		"password": password,
		"age":      age,
	})
})
```

### 动态路由传值

访问 `/user/20`，用 `c.Param` 获取路径参数：

```go
r.GET("/user/:uid", func(c *gin.Context) {
	uid := c.Param("uid")
	c.String(200, "userID=%s", uid)
})
```

### 绑定到结构体

为了更方便地获取请求参数，Gin 可以基于请求的 `Content-Type` 识别数据类型，利用反射自动把 QueryString、form 表单、JSON、XML 等数据提取到结构体中。`ShouldBind()` 能根据请求自动提取数据并绑定到指定结构体：

```go
// 注意首字母大写
type Userinfo struct {
	Username string `form:"username" json:"user"`
	Password string `form:"password" json:"password"`
}

router.GET("/", func(c *gin.Context) {
	var userinfo Userinfo
	if err := c.ShouldBind(&userinfo); err == nil {
		c.JSON(http.StatusOK, userinfo)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
})

router.POST("/doLogin", func(c *gin.Context) {
	var userinfo Userinfo
	if err := c.ShouldBind(&userinfo); err == nil {
		c.JSON(http.StatusOK, userinfo)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
})
```

返回数据示例：

```json
{"user":"zhangsan","password":"123456"}
```

### 获取 POST XML 数据

API 开发中常用 JSON 或 XML 作为数据交互格式，此时可以用 `c.GetRawData()` 从 `c.Request.Body` 读取数据。

XML 请求内容：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<article>
    <content type="string">我是张三</content>
    <title type="string">张三</title>
</article>
```

对应的结构体与处理逻辑：

```go
type Article struct {
	Title   string `xml:"title"`
	Content string `xml:"content"`
}

router.POST("/xml", func(c *gin.Context) {
	b, _ := c.GetRawData() // 从 c.Request.Body 读取请求数据
	article := &Article{}
	if err := xml.Unmarshal(b, &article); err == nil {
		c.JSON(http.StatusOK, article)
	} else {
		c.JSON(http.StatusBadRequest, err.Error())
	}
})
```

## 路由组

路由组可以把具有相同前缀的路由归到一起，便于统一管理。参考文档：<https://gin-gonic.com/zh-cn/docs/examples/grouping-routes/>

```go
func main() {
	router := gin.Default()

	// 简单的路由组: v1
	v1 := router.Group("/v1")
	{
		v1.POST("/login", loginEndpoint)
		v1.POST("/submit", submitEndpoint)
		v1.POST("/read", readEndpoint)
	}

	// 简单的路由组: v2
	v2 := router.Group("/v2")
	{
		v2.POST("/login", loginEndpoint)
		v2.POST("/submit", submitEndpoint)
		v2.POST("/read", readEndpoint)
	}

	router.Run(":8080")
}
```

## 路由文件分组

项目较大时，可以把路由拆分到独立文件中。新建 `routes` 文件夹，在其中新建 `adminRoutes.go`、`apiRoutes.go` 和 `defaultRoutes.go`。

`routes/adminRoutes.go`：

```go
package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminRoutesInit(router *gin.Engine) {
	adminRouter := router.Group("/admin")
	{
		adminRouter.GET("/user", func(c *gin.Context) {
			c.String(http.StatusOK, "用户")
		})
		adminRouter.GET("/news", func(c *gin.Context) {
			c.String(http.StatusOK, "news")
		})
	}
}
```

`routes/apiRoutes.go`：

```go
package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ApiRoutesInit(router *gin.Engine) {
	apiRoute := router.Group("/api")
	{
		apiRoute.GET("/user", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"username": "张三",
				"age":      20,
			})
		})
		apiRoute.GET("/news", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"title": "这是新闻",
			})
		})
	}
}
```

`routes/defaultRoutes.go`：

```go
package routes

import (
	"github.com/gin-gonic/gin"
)

func DefaultRoutesInit(router *gin.Engine) {
	defaultRoute := router.Group("/")
	{
		defaultRoute.GET("/", func(c *gin.Context) {
			c.String(200, "首页")
		})
	}
}
```

在 `main.go` 中初始化各分组路由：

```go
package main

import (
	"gin_demo/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	routes.AdminRoutesInit(r)
	routes.ApiRoutesInit(r)
	routes.DefaultRoutesInit(r)
	r.Run(":8080")
}
```

启动后访问 `/api/user`、`/admin/user` 即可测试。

## 小结

- 路由由 URI 和 HTTP 方法组成，设计时应参考 RESTful 规范。
- 响应方式：`c.String`、`c.JSON`、`c.JSONP`、`c.XML`、`c.HTML`。
- 传值方式：`c.Query` / `c.DefaultQuery`（GET）、`c.PostForm` / `c.DefaultPostForm`（POST）、`c.Param`（动态路由）、`c.ShouldBind`（绑定到结构体）、`c.GetRawData`（原始请求体）。
- 用 `router.Group()` 组织路由前缀，用独立的 `routes` 文件分组管理大型项目的路由。
