---
title: Gin 框架：文件上传与 Cookie/Session
author: yizhiyang
date: 2026-11-17
category:
  - 后端
tag:
  - Gin
  - 学习笔记
---

本文讲解 Gin 中的文件上传，涵盖单文件、多文件及按日期存储的实践，并介绍 Cookie 的设置与获取、二级域名共享，以及基于 Cookie 和 Redis 存储 Session 的方法。

<!-- more -->

## 文件上传

注意：上传文件的 form 表单必须加入 `enctype="multipart/form-data"`。

### 单文件上传

官方示例（<https://gin-gonic.com/zh-cn/docs/examples/upload-file/single-file/>）：

```go
func main() {
	router := gin.Default()
	// 为 multipart forms 设置较低的内存限制（默认是 32 MiB）
	router.MaxMultipartMemory = 8 << 20 // 8 MiB
	router.POST("/upload", func(c *gin.Context) {
		// 单文件
		file, _ := c.FormFile("file")
		log.Println(file.Filename)

		// 上传文件至指定目录
		c.SaveUploadedFile(file, dst)

		c.String(http.StatusOK, fmt.Sprintf("'%s' uploaded!", file.Filename))
	})
	router.Run(":8080")
}
```

项目中的实现。先定义模板 `admin/user/add.html`：

```html
{{ define "admin/user/add.html" }}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <form action="/admin/user/doAdd" method="post" enctype="multipart/form-data">
        用户名：<input type="text" name="username" placeholder="用户名"> <br> <br>
        头像：<input type="file" name="face"><br> <br>
        <input type="submit" value="提交">
    </form>
</body>
</html>
{{ end }}
```

业务逻辑：

```go
func (c UserController) DoAdd(ctx *gin.Context) {
	username := ctx.PostForm("username")
	file, err := ctx.FormFile("face")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": err.Error(),
		})
		return
	}
	// 上传文件到指定的目录
	dst := path.Join("./static/upload", file.Filename)
	fmt.Println(dst)
	ctx.SaveUploadedFile(file, dst)
	ctx.JSON(http.StatusOK, gin.H{
		"message":  fmt.Sprintf("'%s' uploaded!", file.Filename),
		"username": username,
	})
}
```

### 多文件上传：不同名字的多个文件

模板中为不同文件设置不同的 `name`：

```html
{{ define "admin/user/add.html" }}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <form action="/admin/user/doAdd" method="post" enctype="multipart/form-data">
        用户名：<input type="text" name="username" placeholder="用户名"> <br> <br>
        头像 1：<input type="file" name="face1"><br> <br>
        头像 2：<input type="file" name="face2"><br> <br>
        <input type="submit" value="提交">
    </form>
</body>
</html>
{{ end }}
```

业务逻辑：

```go
func (c UserController) DoAdd(ctx *gin.Context) {
	username := ctx.PostForm("username")
	face1, err1 := ctx.FormFile("face1")
	face2, err2 := ctx.FormFile("face2")

	// 上传文件到指定的目录
	if err1 == nil {
		dst1 := path.Join("./static/upload", face1.Filename)
		ctx.SaveUploadedFile(face1, dst1)
	}
	if err2 == nil {
		dst2 := path.Join("./static/upload", face2.Filename)
		ctx.SaveUploadedFile(face2, dst2)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "文件上传成功",
		"username": username,
	})
}
```

### 多文件上传：相同名字的多个文件

参考官方文档：<https://gin-gonic.com/zh-cn/docs/examples/upload-file/multiple-file/>

模板中多个文件使用相同的 `name`，并加上 `[]`：

```html
{{ define "admin/user/add.html" }}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <form action="/admin/user/doAdd" method="post" enctype="multipart/form-data">
        用户名：<input type="text" name="username" placeholder="用户名"> <br> <br>
        头像 1：<input type="file" name="face[]"><br> <br>
        头像 2：<input type="file" name="face[]"><br> <br>
        <input type="submit" value="提交">
    </form>
</body>
</html>
{{ end }}
```

业务逻辑通过 `ctx.MultipartForm()` 获取文件列表：

```go
func (c UserController) DoAdd(ctx *gin.Context) {
	username := ctx.PostForm("username")

	// Multipart form
	form, _ := ctx.MultipartForm()
	files := form.File["face[]"]

	for _, file := range files {
		// 上传文件至指定目录
		dst := path.Join("./static/upload", file.Filename)
		ctx.SaveUploadedFile(file, dst)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "文件上传成功",
		"username": username,
	})
}
```

### 按日期存储

实际项目中通常按日期分目录存储，并对文件类型做校验、对文件名做重命名。

模板：

```html
{{ define "admin/user/add.html" }}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <form action="/admin/user/doAdd" method="post" enctype="multipart/form-data">
        用户名：<input type="text" name="username" placeholder="用户名"> <br> <br>
        头像：<input type="file" name="face"><br> <br>
        <input type="submit" value="提交">
    </form>
</body>
</html>
{{ end }}
```

业务逻辑：

```go
func (c UserController) DoAdd(ctx *gin.Context) {
	username := ctx.PostForm("username")

	// 1、获取上传的文件
	file, err1 := ctx.FormFile("face")
	if err1 == nil {
		// 2、获取后缀名，判断类型是否正确 .jpg .png .gif .jpeg
		extName := path.Ext(file.Filename)
		allowExtMap := map[string]bool{
			".jpg":  true,
			".png":  true,
			".gif":  true,
			".jpeg": true,
		}
		if _, ok := allowExtMap[extName]; !ok {
			ctx.String(200, "文件类型不合法")
			return
		}

		// 3、创建图片保存目录 static/upload/20200623
		day := models.GetDay()
		dir := "./static/upload/" + day
		if err := os.MkdirAll(dir, 0666); err != nil {
			log.Error(err)
		}

		// 4、生成文件名称 144325235235.png
		fileUnixName := strconv.FormatInt(models.GetUnix(), 10)
		// static/upload/20200623/144325235235.png
		saveDir := path.Join(dir, fileUnixName+extName)
		ctx.SaveUploadedFile(file, saveDir)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "文件上传成功",
		"username": username,
	})
}
```

其中 `models/tools.go` 提供日期与时间戳工具方法：

```go
package models

import (
	"crypto/md5"
	"fmt"
	"time"
)

// UnixToDate 时间戳转换成日期
func UnixToDate(timestamp int64) string {
	t := time.Unix(timestamp, 0)
	return t.Format("2006-01-02 15:04:05")
}

// DateToUnix 日期转换成时间戳 2020-05-02 15:04:05
func DateToUnix(str string) int64 {
	template := "2006-01-02 15:04:05"
	t, err := time.ParseInLocation(template, str, time.Local)
	if err != nil {
		return 0
	}
	return t.Unix()
}

func GetUnix() int64 {
	return time.Now().Unix()
}

func GetDate() string {
	template := "2006-01-02 15:04:05"
	return time.Now().Format(template)
}

func GetDay() string {
	template := "20060102"
	return time.Now().Format(template)
}

func Md5(str string) string {
	data := []byte(str)
	return fmt.Sprintf("%x\n", md5.Sum(data))
}
```

## Cookie

### Cookie 介绍

HTTP 是无状态协议：浏览一个页面后转到同一网站的另一个页面，服务器无法识别这是同一个浏览器在访问，每一次访问都是独立的。如果要在多个页面之间共享数据，可以使用 Cookie 或 Session 实现。

Cookie 存储在访问者的浏览器中，可以让同一个浏览器访问同一个域名时共享数据。

### Cookie 能实现的功能

1. 保持用户登录状态
2. 保存用户浏览的历史记录
3. 猜你喜欢、智能推荐
4. 电商网站的加入购物车

### 设置和获取 Cookie

参考文档：<https://gin-gonic.com/zh-cn/docs/examples/cookie/>

设置 Cookie：

```go
c.SetCookie(name, value string, maxAge int, path, domain string, secure, httpOnly bool)
```

参数说明：

| 参数 | 说明 |
| --- | --- |
| name | Cookie 的 key |
| value | Cookie 的 value |
| maxAge | 过期时间；若只想设置保存路径而不设置存活时间，可传 nil |
| path | Cookie 的路径 |
| domain | Cookie 的作用域，本地调试配置为 localhost，正式上线配置为域名 |
| secure | 为 true 时 Cookie 在 HTTP 中无效，仅在 HTTPS 中有效 |
| httpOnly | 设置后 JS 脚本、applet 等程序将无法读取 Cookie，可防止 XSS 攻击 |

获取 Cookie：

```go
cookie, err := c.Cookie("name")
```

完整示例：

```go
package main

import (
	"html/template"

	"gin_demo/models"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.SetFuncMap(template.FuncMap{
		"unixToDate": models.UnixToDate,
	})

	r.GET("/", func(c *gin.Context) {
		c.SetCookie("username", "张三", 3600, "/", "localhost", false, true)
		c.String(200, "首页")
	})

	r.GET("/user", func(c *gin.Context) {
		username, _ := c.Cookie("username")
		c.String(200, "用户-"+username)
	})

	r.Run(":8080")
}
```

### 多个二级域名共享 Cookie

若要把 `a.itying.com` 和 `b.itying.com` 解析到服务器，并实现在 `a.itying.com` 设置 Cookie 后于 `b.itying.com` 获取，只需把 `domain` 设置为主域名（前面加点）：

```go
c.SetCookie("username", "张三", 3600, "/", ".itying.com", false, true)
```

## Session

### Session 介绍与工作流程

Session 是另一种记录客户状态的机制。不同的是，Cookie 保存在客户端浏览器中，而 Session 保存在服务器上。

工作流程：

1. 客户端浏览器第一次访问服务器并发送请求时，服务器创建一个 session 对象，生成类似 key/value 的键值对；
2. 服务器将 value 保存到服务器，把 key（cookie）返回到浏览器客户端；
3. 浏览器下次访问时携带 key（cookie），据此找到对应的 session（value）。

### Gin 中使用 Session

Gin 官方没有提供 Session 文档，可以使用第三方 Session 中间件：<https://github.com/gin-contrib/sessions>

该中间件支持的存储引擎包括：cookie、memstore、redis、memcached、mongodb。

### 基于 Cookie 存储 Session

先安装 session 包：

```bash
go get github.com/gin-contrib/sessions
```

基本用法：

```go
package main

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 创建基于 cookie 的存储引擎，secret11111 是用于加密的密钥
	store := cookie.NewStore([]byte("secret11111"))

	// 设置 session 中间件，mysession 是 session 的名字，也是 cookie 的名字
	r.Use(sessions.Sessions("mysession", store))

	r.GET("/", func(c *gin.Context) {
		// 初始化 session 对象
		session := sessions.Default(c)
		// 设置过期时间
		session.Options(sessions.Options{
			MaxAge: 3600 * 6, // 6hrs
		})
		// 设置 Session
		session.Set("username", "张三")
		session.Save()
		c.JSON(200, gin.H{"msg": session.Get("username")})
	})

	r.GET("/user", func(c *gin.Context) {
		// 初始化 session 对象
		session := sessions.Default(c)
		// 通过 session.Get 读取 session 值
		username := session.Get("username")
		c.JSON(200, gin.H{"username": username})
	})

	r.Run(":8000")
}
```

### 基于 Redis 存储 Session

如果想把 session 数据保存到 Redis，只需把存储引擎改成 Redis。先安装 Redis 存储引擎的包：

```bash
go get github.com/gin-contrib/sessions/redis
```

使用示例：

```go
package main

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/redis"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 初始化基于 redis 的存储引擎
	// 参数说明：
	// 第 1 个参数：redis 最大的空闲连接数
	// 第 2 个参数：通信协议 tcp 或 udp
	// 第 3 个参数：redis 地址，格式 host:port
	// 第 4 个参数：redis 密码
	// 第 5 个参数：session 加密密钥
	store, _ := redis.NewStore(10, "tcp", "localhost:6379", "", []byte("secret"))

	r.Use(sessions.Sessions("mysession", store))

	r.GET("/", func(c *gin.Context) {
		session := sessions.Default(c)
		session.Set("username", "李四")
		session.Save()
		c.JSON(200, gin.H{"username": session.Get("username")})
	})

	r.GET("/user", func(c *gin.Context) {
		session := sessions.Default(c)
		username := session.Get("username")
		c.JSON(200, gin.H{"username": username})
	})

	r.Run(":8000")
}
```

## 小结

- 上传表单必须设置 `enctype="multipart/form-data"`；用 `c.FormFile` 获取单文件，`ctx.MultipartForm()` 获取同名字段的多文件，`c.SaveUploadedFile` 保存文件。
- 实际项目可按日期分目录存储，并校验扩展名、用时间戳重命名文件。
- Cookie 存储在浏览器，用于页面间共享数据；`c.SetCookie` 设置，`c.Cookie` 获取，`domain` 设为 `.itying.com` 可实现二级域名共享。
- Session 存储在服务器，通过 cookie 中的 key 关联；用 `gin-contrib/sessions` 实现，支持 cookie、redis 等多种存储引擎。
