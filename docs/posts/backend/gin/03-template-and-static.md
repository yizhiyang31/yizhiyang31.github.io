---
title: Gin 框架：HTML 模板渲染与静态文件
author: yizhiyang
date: 2026-11-17
category:
  - 后端
tag:
  - Gin
  - 学习笔记
---

本文讲解 Gin 的 HTML 模板渲染，包括单目录与多目录的模板加载方式、常用模板语法与函数，以及静态文件服务的配置方法。

<!-- more -->

## 模板目录配置

Gin 中使用 `c.HTML` 渲染模板，渲染前需要用 `LoadHTMLGlob()` 或 `LoadHTMLFiles()` 加载模板。

### 全部模板放在一个目录

在项目根目录新建 `templates` 文件夹，并创建 `index.html`：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <h1>这是一个 html 模板</h1>
    <h3>{{.title}}</h3>
</body>
</html>
```

加载模板并渲染：

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	router.LoadHTMLGlob("templates/*")
	// 也可以用 LoadHTMLFiles 指定具体文件
	// router.LoadHTMLFiles("templates/template1.html", "templates/template2.html")

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "Main website",
		})
	})

	router.Run(":8080")
}
```

### 模板放在不同目录

当不同目录下存在同名模板时，需要用 `define` 为模板定义名称，`define` 与 `end` 成对出现。

`templates/admin/index.html`：

```html
<!-- 相当于给模板定义一个名字，define、end 成对出现 -->
{{ define "admin/index.html" }}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <h1>后台模板</h1>
    <h3>{{.title}}</h3>
</body>
</html>
{{ end }}
```

`templates/default/index.html`：

```html
{{ define "default/index.html" }}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <h1>前台模板</h1>
    <h3>{{.title}}</h3>
</body>
</html>
{{ end }}
```

加载时用 `**` 匹配多级目录，渲染时指定 `define` 定义的名称：

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	router.LoadHTMLGlob("templates/**/*")

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "default/index.html", gin.H{
			"title": "前台首页",
		})
	})

	router.GET("/admin", func(c *gin.Context) {
		c.HTML(http.StatusOK, "admin/index.html", gin.H{
			"title": "后台首页",
		})
	})

	router.Run(":8080")
}
```

如果模板位于多级目录，需要配置 `r.LoadHTMLGlob("templates/**/**/*")`，其中 `**` 表示目录层级。

## 模板基本语法

### 输出数据

模板语法都包含在 `{{` 和 `}}` 之间，其中 `{{.}}` 中的点表示当前对象。传入结构体对象时，可以用 `.` 访问对应字段：

```go
type UserInfo struct {
	Name   string
	Gender string
	Age    int
}

func main() {
	router := gin.Default()
	router.LoadHTMLGlob("templates/**/*")
	user := UserInfo{
		Name:   "张三",
		Gender: "男",
		Age:    18,
	}

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "default/index.html", map[string]interface{}{
			"title": "前台首页",
			"user":  user,
		})
	})

	router.Run(":8080")
}
```

模板中访问字段：

```html
<h3>{{.title}}</h3>
<h4>{{.user.Name}}</h4>
<h4>{{.user.Age}}</h4>
```

### 注释

注释执行时会被忽略，可以多行，但不能嵌套，且必须紧贴分界符始止：

```html
{{/* a comment */}}
```

### 变量

可以在模板中声明变量，保存传入模板的数据或其他语句生成的结果：

```html
<h4>{{$obj := .title}}</h4>
<h4>{{$obj}}</h4>
```

### 移除空格

使用 `{{-` 去除模板内容左侧的所有空白符号，使用 `-}}` 去除右侧的所有空白符号。注意 `-` 要紧挨 `{{` 和 `}}`，且与模板值之间用空格分隔：

```html
{{- .Name -}}
```

### 比较函数

布尔函数将任何类型的零值视为假，其余视为真。二元比较函数包括：

| 函数 | 说明 |
| --- | --- |
| `eq` | arg1 == arg2 时返回真 |
| `ne` | arg1 != arg2 时返回真 |
| `lt` | arg1 < arg2 时返回真 |
| `le` | arg1 <= arg2 时返回真 |
| `gt` | arg1 > arg2 时返回真 |
| `ge` | arg1 >= arg2 时返回真 |

### 条件判断

条件判断有以下几种形式：

```html
{{if pipeline}} T1 {{end}}
{{if pipeline}} T1 {{else}} T0 {{end}}
{{if pipeline}} T1 {{else if pipeline}} T0 {{end}}
```

结合比较函数的示例：

```html
{{if gt .score 90}}优秀{{else if gt .score 60}}及格{{else}}不及格{{end}}
```

### range

用 `range` 遍历数组、切片、字典或通道。`pipeline` 长度为 0 时不会有输出；配合 `else` 可在长度为 0 时输出 `T0`。

```html
{{range $key, $value := .obj}}
    {{$value}}
{{end}}

{{range $key, $value := .obj}}
    {{$value}}
{{else}}
    pipeline 的值其长度为 0
{{end}}
```

对应的业务逻辑：

```go
router.GET("/", func(c *gin.Context) {
	c.HTML(http.StatusOK, "default/index.html", map[string]interface{}{
		"hobby": []string{"吃饭", "睡觉", "写代码"},
	})
})
```

模板：

```html
{{range $key, $value := .hobby}}
<p>{{$value}}</p>
{{end}}
```

### with

`with` 可以简化嵌套取值，简单理解为 `var . = .user`。

以前输出数据：

```html
<h4>{{.user.Name}}</h4>
<h4>{{.user.Gender}}</h4>
<h4>{{.user.Age}}</h4>
```

现在输出数据：

```html
{{with .user}}
<h4>姓名：{{.Name}}</h4>
<h4>性别：{{.Gender}}</h4>
<h4>年龄：{{.Age}}</h4>
{{end}}
```

### 预定义函数

执行模板时，函数从模板函数字典和全局函数字典中查找。一般不在模板内定义函数，而是用 `Funcs` 方法添加。

预定义的全局函数包括：

| 函数 | 说明 |
| --- | --- |
| `and` | 返回第一个 empty 参数或最后一个参数 |
| `or` | 返回第一个非 empty 参数或最后一个参数 |
| `not` | 返回单个参数的布尔值取反 |
| `len` | 返回参数的长度 |
| `index` | 返回以剩余参数为索引指向的值，如 `index x 1 2 3` 返回 `x[1][2][3]` |
| `print` | 即 `fmt.Sprint` |
| `printf` | 即 `fmt.Sprintf` |
| `println` | 即 `fmt.Sprintln` |
| `html` | 返回转义后的 HTML，`html/template` 中不可用 |
| `urlquery` | 返回适合嵌入网址查询的转义值，`html/template` 中不可用 |
| `js` | 返回转义后的 JavaScript |
| `call` | 调用第一个参数（必须是函数类型），其余参数作为调用实参 |

使用示例：

```html
{{len .title}}
{{index .hobby 2}}
```

### 自定义模板函数

通过 `SetFuncMap` 注册全局模板函数，注意注册模板函数必须在加载模板之前：

```go
package main

import (
	"fmt"
	"html/template"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func formatAsDate(t time.Time) string {
	year, month, day := t.Date()
	return fmt.Sprintf("%d/%02d/%02d", year, month, day)
}

func main() {
	router := gin.Default()

	// 注册全局模板函数，注意顺序：注册模板函数需要在加载模板上面
	router.SetFuncMap(template.FuncMap{
		"formatDate": formatAsDate,
	})

	// 加载模板
	router.LoadHTMLGlob("templates/**/*")

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "default/index.html", map[string]interface{}{
			"title": "前台首页",
			"now":   time.Now(),
		})
	})

	router.Run(":8080")
}
```

模板中的用法：

```html
{{.now | formatDate}}
<!-- 或者 -->
{{formatDate .now}}
```

### 嵌套 template

先新建 `templates/default/page_header.html`，用 `define` 定义名称：

```html
{{ define "default/page_header.html" }}
<h1>这是一个头部</h1>
{{ end }}
```

然后在其他模板中引入。注意引入的名字是 `page_header.html` 中定义的名字，且引入时不要遗漏最后的点（`.`）：

```html
{{ define "default/index.html" }}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    {{template "default/page_header.html" .}}
</body>
</html>
{{ end }}
```

## 静态文件服务

当渲染的 HTML 文件中引用了静态文件时，需要配置静态 Web 服务：

```go
r.Static("/static", "./static")
```

前面的 `/static` 表示路由，后面的 `./static` 表示本地路径。例如在模板中引用样式：

```html
<link rel="stylesheet" href="/static/css/base.css" />
```

## 小结

- 用 `LoadHTMLGlob` 或 `LoadHTMLFiles` 加载模板；多目录同名模板需用 `define` 定义名称，并用 `**` 匹配多级目录。
- 常用语法：`{{.}}` 输出、`{{/* */}}` 注释、`$` 变量、`{{- -}}` 去空格、`if`/`range`/`with`、比较函数与预定义函数。
- 自定义模板函数用 `SetFuncMap`，且必须在加载模板前注册。
- 用 `{{template "名称" .}}` 嵌套模板，用 `r.Static("/static", "./static")` 提供静态文件服务。
