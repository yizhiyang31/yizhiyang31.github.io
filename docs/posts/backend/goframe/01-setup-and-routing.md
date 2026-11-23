---
title: GoFrame 入门：环境搭建与路由
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - GoFrame
  - 学习笔记
---

GoFrame 是一款 Go 语言的通用开发框架，内置 Web 服务、ORM、模板引擎、数据校验等常用组件。本文是 GoFrame 系列的第一篇，从环境准备、项目初始化与目录结构讲起，再详细介绍函数注册、对象注册、分组注册与规范路由的用法。

<!-- more -->

## 关于本系列

本系列开始记录于 2023 年 9 月，内容以官方文档为主。如果官方文档后续更新，导致文中的链接失效，或与官方文档存在差异、错漏，请以官方文档为准。

- GoFrame 文档：<https://goframe.org/>
- 本阶段只介绍 Web 开发部分，微服务部分后续另开系列。

## 前置条件

- 已安装 Go 语言开发环境，并配置好 `GOROOT`、`GOPATH` 环境变量。
- 熟悉 Go 语言基本语法与使用。

## 安装框架工具

在 [gf releases](https://github.com/gogf/gf/releases) 页面下载对应平台的安装包进行安装，推荐安装到 `GOROOT` 的 `bin` 目录中。

安装完成后执行以下命令，确认是否安装成功：

```shell
gf -v
```

## 项目初始化

```shell
go env -w GO111MODULE=on
go env -w GOPROXY=https://goproxy.cn
# 如果已经设置过，可以跳过上面这两行

gf init gf_demo -u # 如果之前已经创建过项目，并且不需要使用最新版本则省略 -u
```

常用代理地址：

- `https://goproxy.cn`
- `https://goproxy.io`
- `https://mirrors.aliyun.com/goproxy/`

## 项目启动

进入 `main.go` 文件所在目录，运行：

```shell
gf run main.go
```

启动成功后，在浏览器中访问 `http://127.0.0.1:8000/hello` 查看结果。

## 框架设计

框架设计部分的内容偏向抽象理论，初学阶段不必深究，可以先了解 `MVC` 与 `3-Tier Architecture` 的基本概念，详见官方文档[代码分层设计](https://goframe.org/pages/viewpage.action?pageId=3672442)。

### 项目目录结构

```text
/
├── api                 请求接口输入/输出数据结构定义
├── hack                项目开发工具、脚本
├── internal            业务逻辑存放目录，核心代码
│   ├── cmd             入口指令与其他命令工具目录
│   ├── consts          常量定义目录
│   ├── controller      控制器目录，接收/解析用户请求
│   ├── dao             数据访问对象目录，用于和底层数据库交互
│   ├── logic           核心业务逻辑代码目录
│   ├── model           数据结构管理模块，管理数据实体对象，以及输入与输出数据结构定义
│   │   ├── do          数据操作中业务模型与实例模型转换，由工具维护，不能手动修改
│   │   └── entity      数据模型是模型与数据集合的一对一关系，由工具维护，不用手动修改
│   └── service         业务接口定义层。具体的接口实现在 logic 中进行注入
├── manifest            包含程序编译、部署、运行、配置的文件
├── resource            静态资源文件
├── utility
├── go.mod
└── main.go             程序入口文件
```

有关项目目录的更多介绍，以及请求在各层之间的流转过程，见官方文档[工程目录设计](https://goframe.org/pages/viewpage.action?pageId=30740166)。

## 路由注册

### 函数注册

相关方法：

```go
func (s *Server) BindHandler(pattern string, handler interface{})
```

其中 `handler` 的定义方式有如下两种：

```go
func(request *ghttp.Request)
func(ctx context.Context, BizRequest) (BizResponse, error)
```

**匿名函数与普通函数注册**

`internal/cmd/cmd.go`

```go
package cmd

import (
    "context"

    "github.com/gogf/gf/v2/frame/g"
    "github.com/gogf/gf/v2/net/ghttp"
    "github.com/gogf/gf/v2/os/gcmd"
)

func handler(req *ghttp.Request) {
    req.Response.Writeln("<h1>Hello World From handler</h1>")
}

var (
    Main = gcmd.Command{
        Name:  "main",
        Usage: "main",
        Brief: "start http server",
        Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
            s := g.Server()

            // 直接用匿名函数进行路由注册
            s.BindHandler("/hello", func(req *ghttp.Request) {
                req.Response.Writeln("<h1>Hello World!</h1>")
            })

            // 或者使用提前定义好的函数来进行注册
            s.BindHandler("/world", handler)

            s.Run()
            return nil
        },
    }
)
```

注册成功后在浏览器中输入 `http://127.0.0.1:8000/hello` 或 `http://127.0.0.1:8000/world`，即可访问对应的路由。

**指定 HTTP 请求方法**

上述方法注册的路由默认支持所有 HTTP 请求方法。如果需要指定请求方法，可以这样写：

```go
// 该路由只支持 GET 请求
s.BindHandler("GET:/hello", func(req *ghttp.Request) {
    req.Response.Writeln("<h1>Hello World! GET</h1>")
})

// 该路由只支持 POST 请求
s.BindHandler("POST:/hello", func(req *ghttp.Request) {
    req.Response.Writeln("<h1>Hello World! POST</h1>")
})
```

同一个路径可以针对不同的请求方法实现不同功能。

> 几个最常用的 HTTP 方法：
>
> | 方法     | 描述                             |
> |:------:|:------------------------------:|
> | GET    | 用于获取数据，不会修改服务端资源数据             |
> | POST   | 将资源数据提交到服务端，常用于在服务端创建新数据       |
> | PUT    | 将资源数据提交到服务端，常用于修改已存在的资源数据      |
> | DELETE | 用于删除服务端资源数据                    |

**对象方法注册**

还可以用对象中的方法注册路由。先定义一个名为 `user` 的控制器：

`internal/controller/user/user.go`

```go
package user

import "github.com/gogf/gf/v2/net/ghttp"

type Controller struct{}

func New() *Controller {
    return &Controller{}
}

func (c *Controller) AddUser(r *ghttp.Request) {
    r.Response.Writeln("添加用户")
}

func (c *Controller) UpdateUser(r *ghttp.Request) {
    r.Response.Writeln("更新用户")
}

func (c *Controller) DeleteUser(r *ghttp.Request) {
    r.Response.Writeln("删除用户")
}

func (c *Controller) ListUser(r *ghttp.Request) {
    r.Response.Writeln("用户列表")
}

func (c *Controller) GetUser(r *ghttp.Request) {
    r.Response.Writeln("查询一个用户")
}

func (c *Controller) Post(r *ghttp.Request) {
    r.Response.Writeln("添加用户")
}

func (c *Controller) Put(r *ghttp.Request) {
    r.Response.Writeln("更新用户")
}

func (c *Controller) Delete(r *ghttp.Request) {
    r.Response.Writeln("删除用户")
}

func (c *Controller) Get(r *ghttp.Request) {
    r.Response.Writeln("查询一个用户")
}
```

`internal/cmd/cmd.go`

```go
package cmd

import (
    "context"

    // 引入控制器 user 包
    "gf_demo/internal/controller/user"

    "github.com/gogf/gf/v2/frame/g"
    "github.com/gogf/gf/v2/os/gcmd"
)

var (
    Main = gcmd.Command{
        Name:  "main",
        Usage: "main",
        Brief: "start http server",
        Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
            s := g.Server()

            // 定义对象
            usercontroller := user.New()
            // 将对象方法绑定到路由
            s.BindHandler("/adduser", usercontroller.AddUser)

            s.Run()
            return nil
        },
    }
)
```

### 对象注册

对象里的方法可以批量注册。相关方法：

```go
func (s *Server) BindObject(pattern string, object interface{}, method ...string)

func (s *Server) BindObjectMethod(pattern string, object interface{}, method string)

func (s *Server) BindObjectRest(pattern string, object interface{})
```

**绑定全部公共方法**

`internal/cmd/cmd.go`

```go
package cmd

import (
    "context"
    "starting/internal/controller/user"

    "github.com/gogf/gf/v2/frame/g"
    "github.com/gogf/gf/v2/os/gcmd"
)

var (
    Main = gcmd.Command{
        Name:  "main",
        Usage: "main",
        Brief: "start http server",
        Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
            s := g.Server()

            usercontroller := user.New()
            // 绑定 user 控制器中所有公共方法
            s.BindObject("/user", usercontroller)

            s.Run()
            return nil
        },
    }
)
```

**绑定指定方法**

```go
usercontroller := user.New()
// 绑定 user 控制器中多个方法
s.BindObject("/user", usercontroller, "AddUser,UpdateUser")
// 绑定单个方法
s.BindObjectMethod("/deluser", usercontroller, "DeleteUser")
```

**以 RESTful 方式绑定对象方法**

```go
usercontroller := user.New()
s.BindObjectRest("/user", usercontroller)
```

### 分组注册

可以为不同路由设置相同的前缀，即分组路由。分组路由有以下两种写法：

```go
s := g.Server()

usercontroller := user.New()
s.Group("/user", func(group *ghttp.RouterGroup) {
    group.Middleware(ghttp.MiddlewareHandlerResponse)
    group.Bind(
        usercontroller, // 绑定到控制器对象
    )

    // 可以用 GET、POST、PUT 等定义路由
    group.GET("/get", func(r *ghttp.Request) {
        r.Response.Writeln("/user/get")
    })
})

s.Run()
```

```go
s := g.Server()

usercontroller := user.New()
group := s.Group("/user")
group.Middleware(ghttp.MiddlewareHandlerResponse)
group.Bind(
    usercontroller, // 绑定到控制器对象
)

// 可以用 GET、POST、PUT 等定义路由
group.GET("/get", func(r *ghttp.Request) {
    r.Response.Writeln("/user/get")
})

s.Run()
```

## 规范路由

GoFrame 提供了规范化的路由注册方式，处理函数的签名如下：

```go
func Handler(ctx context.Context, req *Request) (res *Response, err error)
```

其中 `Request` 与 `Response` 为自定义结构体。通过 `g.Meta` 指定请求方法与路径：

```go
type HelloReq struct {
    g.Meta `path:"/hello" method:"get"`
}
```

规范化路由把「请求参数定义」「响应结构定义」「校验规则」都集中到了 `api` 目录，配合后续要介绍的接口文档与自动校验，可以显著减少样板代码。
