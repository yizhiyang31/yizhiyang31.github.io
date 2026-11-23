---
title: GoFrame 入门：模板引擎与静态资源
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - GoFrame
  - 学习笔记
---

本文介绍 GoFrame 模板引擎的基本用法，包括模板渲染方法、模板配置与静态资源服务，并演示模板中的条件判断、关系运算与循环语法。

<!-- more -->

## 模板渲染方法

前面提到可以用下面几个方法返回模板内容：

```go
func (r *Response) WriteTpl(tpl string, params ...gview.Params) error
func (r *Response) WriteTplDefault(params ...gview.Params) error
func (r *Response) WriteTplContent(content string, params ...gview.Params) error
```

默认情况下模板文件目录是 `resource/template`：

- `WriteTpl` 解析并返回模板文件内容，文件为相对于 `resource/template` 的路径
- `WriteTplDefault` 解析并返回默认模板，即 `resource/template/index.html`
- `WriteTplContent` 解析并返回模板字符串

常用的为 `WriteTpl`，其他两个方法简单了解即可：

```go
func (c *Controller) Tpl(req *ghttp.Request) {
    req.Response.WriteTplDefault() // 解析并返回默认模板文件内容
    // 解析并返回模板字符串
    req.Response.WriteTplContent("<h1>你好, {{.name}} 欢迎学习{{.lang}}</h1>", g.Map{"name": "王道长", "lang": "GoFrame"})
}
```

## 简单使用示例

`resource/template/hello/index.html`

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

    <div>
        <h1>你好， {{.name}}</h1>
        <h2>欢迎来到{{.lesson}}的学习课程</h2>
        <p>本课程共{{.num}}小节，现在学习的是{{.what}}</p>
    </div>

</body>
</html>
```

`controller`

```go
func (c *Controller) Tpl(req *ghttp.Request) {
    data := g.Map{
        "name":   "王也道长",
        "lesson": "GoFrame入门课程",
        "num":    5,
        "what":   "模板引擎使用示例",
    }

    req.Response.WriteTpl("hello/index.html", data)
}
```

## 模板配置

模板使用中一般情况使用默认配置即可。如果需要修改配置，则在 `manifest/config/config.yaml` 中进行修改：

```yaml
viewer: # 模板配置
  paths: ["resource/template", "/www/template"] # 模板路径配置，可以配置多个路径
  defaultFile: "index.html" # WriteTplDefault 解析的文件
  delimiters: ["${", "}"] # 模板引擎变量分隔符，默认为 ["{{", "}}"]
```

## 静态资源

静态资源不属于模板引擎的内容，但在模板文件中也有需要用到静态资源的地方，因此进行一下补充。

静态资源一般指的是 js / css / image 文件或者静态 HTML 文件。在 GoFrame 的项目目录中，这些文件放在 `resource/public` 下，之后还需要开启静态资源服务，才能在模板文件中对这些资源进行引用。开启方式有两种。

**配置文件**

`manifest/config/config.yaml`

```yaml
server:
  serverRoot: "resource/public"
  indexFolder: true # 这个可以不用配置，放在这里了解一下
```

**用代码开启**

`internal/cmd/cmd.go`

```go
s := g.Server()
s.SetServerRoot("resource/public")
s.SetIndexFolder(true)
```

`serverRoot` 配置了静态资源根目录 `resource/public`，对静态资源的引用 URL 以 `resource/public` 为根目录。

例如，在 `resource/public/resource/css` 中放置了一个 `bootstrap.css` 文件，引用时写为：

```html
<link rel="stylesheet" href="/resource/css/bootstrap.css">
```

## 条件判断

在模板中可以进行条件判断，根据条件是否满足来显示不同内容，语法如下：

```html
{{if .condition}}
条件满足时显示内容
{{else}}
条件不满足时显示内容
{{end}}
```

可以嵌套写，也可以写多个 `{{else if .condition}}`。

当 `.condition` 为空值，即 `0`、`""`、`nil` 这类值时，条件判断为假，其他值均为真（条件满足）。

用法示例：

`resource/template/hello/index.html`

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/resource/css/bootstrap.css">
    <title>Document</title>
</head>
<body>

   {{if .name}}
   <h1>name的值: {{.name}}</h1>
   {{else}}
   <h1>name的值为false/""/0/nil等</h1>
   {{end}}

</body>
</html>
```

`controller`

```go
func (c *Controller) Tpl(req *ghttp.Request) {
    data := g.Map{
        "name":   "王也道长",
        "lesson": "GoFrame入门课程",
        "num":    5,
        "what":   "模板引擎使用示例",
    }

    req.Response.WriteTpl("hello/index.html", data)
}
```

**大于小于等于判断**

在模板中无法直接使用 `>`、`<`、`==` 等符号进行关系判断，因此需要使用条件函数：

| 函数  | 对应符号 |
|:---:|:----:|
| eq  | ==   |
| ne  | !=   |
| lt  | <    |
| le  | <=   |
| gt  | >    |
| ge  | >=   |

使用示例：

```html
{{if eq 5 .num}}
<h1>num == 5</h1>
{{else if lt 5 .num}}
<h1>num > 5</h1>
{{else}}
<h1>num < 5</h1>
{{end}}
```

上述函数还有一些拓展用法，这里只简单介绍基础用法。

**逻辑判断**

模板语言中可以用 `and`、`or`、`not` 进行逻辑运算：

```html
{{if and (gt .num 0) (lt .num 5)}}    if num > 0 && num < 5
{{if or (eq .num 0) (eq .num 5)}}     if num == 0 || num == 5
{{if not (eq .num 0)}}                if num != 0
```

## 循环

GoFrame 模板使用 `range ... end` 进行循环。

**循环切片**

`controller/hello.go`

```go
data := g.Map{
    "slice": g.Array{1, 2, 3, "张楚岚", "诸葛青"},
}

req.Response.WriteTpl("hello/index.html", data)
```

`index.html`

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/resource/css/bootstrap.css">
    <title>Document</title>
</head>
<body>

   {{range .slice}}
   <span>{{.}}</span>
   {{end}}

   {{range $index, $value := .slice}}
   <p>index = {{$index}}, value = {{$value}}</p>
   {{end}}

</body>
</html>
```

**map 数据**

`controller/hello.go`

```go
func (c *Controller) Tpl(req *ghttp.Request) {
    data := g.Map{
        "mp": g.Map{
            "name":   "冯宝宝",
            "gender": "女",
            "age":    100,
            "hobby":  "埋人",
        },
    }

    req.Response.WriteTpl("hello/index.html", data)
}
```

`index.html`

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/resource/css/bootstrap.css">
    <title>Document</title>
</head>
<body>

   <div class="container">
    <p>姓名：{{.mp.name}}</p>
    <p>性别：{{.mp.gender}}</p>
    <p>年龄：{{.mp.age}}</p>
    <p>爱好：{{.mp.hobby}}</p>

    {{range .mp}}
    <p>{{.}}</p>
    {{end}}

    {{range $key, $value := .mp}}
    <p>{{$key}}: {{$value}}</p>
    {{end}}

    </div>

</body>
</html>
```
