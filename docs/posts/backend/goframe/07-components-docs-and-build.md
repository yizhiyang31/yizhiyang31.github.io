---
title: GoFrame 入门：常用组件、接口文档与构建打包
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - GoFrame
  - 学习笔记
---

本文整理 GoFrame 常用组件的用法，包括数据结构、时间与随机数；随后介绍规范路由自动生成的接口文档及 Swagger UI 的接入方式，最后说明如何用 `gf build` 将静态资源一起打包进可执行文件。

<!-- more -->

## 常用组件

### 数据结构

GoFrame 提供了一些常用的数据结构，如列表、队列、集合、Map 等，详细内容见官方文档。

### 时间

**当前时间**

```go
t := gtime.Now()
```

```go
t := gtime.Date()
```

```go
t := gtime.Datetime()
```

**创建时间对象**

```go
t := gtime.New("2023-11-03 21:45:22")
```

参数可以是字符串、时间戳、时间对象等数据：

```go
t := gtime.NewFromStr("2023-11-03 21:50:25")
```

```go
t, err := gtime.StrToTime("2023-11-03 21:50:25")
```

将字符串转为时间对象，具体支持的时间格式见官方文档「时间管理 / 工具方法」章节。

**设置时区**

```go
gtime.SetTimeZone("Asia/Tokyo")
t := gtime.Now()
```

**时间戳**

```go
t1 := gtime.Timestamp()
t2 := gtime.TimestampMilli()
t3 := gtime.TimestampMicro()
t4 := gtime.TimestampNano()
```

返回为 `int64` 类型，也可以返回字符串类型：

```go
t1 := gtime.TimestampStr()
t2 := gtime.TimestampMilliStr()
t3 := gtime.TimestampMicroStr()
t4 := gtime.TimestampNanoStr()
```

**格式化日期数据**

可以将日期格式化为指定的格式，具体格式化用到的符号见官方文档「时间管理 / 时间格式」章节。

```go
t := gtime.Now()
req.Response.Writeln(t.Format("Y-m-d H:i:s"))
req.Response.Writeln(t.Format("YmdHis"))
```

**获取年月日时分秒**

```go
t := gtime.Now()
req.Response.Writeln(t.Year())
req.Response.Writeln(t.Month())
req.Response.Writeln(t.Day())
req.Response.Writeln(t.Hour())
req.Response.Writeln(t.Minute())
req.Response.Writeln(t.Second())
```

更多操作方法见官方文档「时间管理 / 方法介绍」章节。

### 随机数

**随机整数**

```go
n := grand.Intn(100)
```

返回 `0 <= n < 100` 的随机数。

```go
n := grand.N(100, 999)
```

返回 `100 <= n <= 999` 的随机数。

**随机字符串**

```go
s := grand.S(10)
s := grand.S(10, true)
```

返回指定长度的随机字母/数字组合的字符串，第二个参数为 `true` 表示包括特殊符号。

```go
s := grand.Digits(10)
```

返回指定长度的随机数字字符串。

```go
s := grand.Letters(10)
```

返回指定长度的随机字母字符串。

```go
s := grand.Symbols(10)
```

返回指定长度的随机特殊符号字符串。

```go
s := grand.Str("日照香炉生紫烟，遥看瀑布挂前川。Oh Yeah", 5)
```

从给定的字符串中随机返回指定数量的字符，可以是汉字。

**全局唯一数**

```go
s := guid.S()
```

## 接口文档

使用规范路由的写法，GoFrame 会自动生成接口文档。所有接口信息会自动生成在 `/api.json` 中，遵循 `OpenAPIv3` 标准。框架默认使用 `redoc` 生成文档前端页面，只能查看接口信息，不能进行请求测试。因此可以改为其他 UI 页面，例如 `swaggerUI`，或者自行实现 UI 页面。

- **注释掉 `manifest/config/config.yaml` 中的 `swaggerPath: "/swagger"`**
- **实现 UI 页面，引入 `swaggerUI` 组件**

`swagger.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/swagger-ui.css">
    <script src="/swagger-ui-bundle.js"></script>
    <title>API Doc</title>
</head>
<body>
    <div id="swagger-ui"></div>
</body>
</html>

<script type="text/javascript">
    window.ui = SwaggerUIBundle({
        url: '/api.json',
        dom_id: '#swagger-ui'
    })
</script>
```

引入的 CSS 与 JS 文件如果下载到项目中，则用上述方式引入；也可以通过 CDN 引入：

```html
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css" />
```

- **添加路由**

```go
group.GET("/swagger", func(req *ghttp.Request) {
    req.Response.WriteTpl("/swagger.html")
})
```

## 构建打包

GoFrame 中静态资源也可以直接打包进可执行文件当中，发布时只需提供一个可执行文件即可。

- **配置**

`hack/config.yaml`

```yaml
gfcli:
  build:
    name: "hellogf"
    arch: "amd64"
    system: "linux"
    mode: "none"
    cgo: 0
    packSrc: "manifest/config,resource/public,resource/template"
    version: "1.0.0"
    output: "./bin"
    extra: ""
```

> - `name`：打包后的可执行文件名
> - `arch`：系统架构，可以有多个，用 `,` 分隔，用 `all` 表示编译所有支持的架构
> - `system`：编译平台，可以有多个，用 `,` 分隔，用 `all` 表示编译所有支持的系统
> - `packSrc`：需要打包的静态资源目录
> - `version`：版本号

- **打包**

```shell
gf build
```

以上操作会把指定的目录一起打包进可执行文件。通常情况例如配置文件等一些需要改动的文件，不用打包进可执行文件。
