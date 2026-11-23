---
title: GoFrame 入门：Cookie、Session、JWT 与中间件
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - GoFrame
  - 学习笔记
---

本文介绍 GoFrame 中 Cookie 与 Session 的读写方式，演示如何使用 golang-jwt 生成与校验 Token，并说明中间件的执行模型、前置/后置中间件以及请求上下文变量的传递。

<!-- more -->

## Cookie

Cookie 是保存在浏览器中的一些数据，请求时会放在请求头当中一同发送，通常用来保存 sessionid、token 等数据。

```go
func (c *Controller) Cookie(req *ghttp.Request) {
    req.Cookie.Set("id", "kslfjojklcjkldjfsie")
    req.Cookie.Set("user_name", "诸葛青")

    name := req.Cookie.Get("user_name")
    req.Response.Writeln("name from cookie: " + name.String())

    req.Cookie.Remove("id")
}
```

## Session

Session 机制用于判断请求由哪一用户发起，Session 数据保存在服务器。

以前常用于保存登录数据、进行登录验证，不过现在只有一些比较小的、前后端不分离的项目还在使用。

```go
func (c *Controller) Session(req *ghttp.Request) {
    op := req.GetQuery("op").String()
    if op == "set" {
        req.Session.Set("user", g.Map{"name": "张三", "id": 18})
    } else if op == "get" {
        req.Response.Writeln(req.Session.Get("user"))
    } else if op == "rm" {
        req.Session.Remove("user")
    }
}
```

## golang-jwt

前后端分离的项目更常用的登录验证方式是 `JWT（JSON Web Token）`。GoFrame 中没有提供相关的生成与验证，需要添加第三方库，例如 `golang-jwt`。

简单使用方式如下。

**添加依赖**

```shell
go get -u github.com/golang-jwt/jwt/v5
```

**导入**

```go
import "github.com/golang-jwt/jwt/v5"
```

**生成 token**

```go
func (c *Controller) Jwt(req *ghttp.Request) {
    type UserClaims struct {
        UserID   uint
        UserName string
        jwt.RegisteredClaims
    }

    const key = "arandomstring"

    claim := UserClaims{
        UserID:   1011,
        UserName: "张之维",
        RegisteredClaims: jwt.RegisteredClaims{
            Subject:   "张之维",
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute * 10)),
        },
    }
    token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claim).SignedString([]byte(key))
    if err == nil {
        req.Response.Writeln(token)
    } else {
        req.Response.Writeln(err)
    }
}
```

**token 验证**

```go
func (c *Controller) Jwt(req *ghttp.Request) {
    type UserClaims struct {
        UserID   uint
        UserName string
        jwt.RegisteredClaims
    }

    const key = "arandomstring"

    token := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOjEwMTEsIlVzZXJOYW1lIjoi5byg5LmL57u0Iiwic3ViIjoi5byg5LmL57u0IiwiZXhwIjoxNjk4NjcxMjA3fQ.r11R1_WcDueBU52BoUjDS94jqemgrhU-V4WW7YSvXWE"
    result, err := jwt.ParseWithClaims(token, &UserClaims{}, func(t *jwt.Token) (interface{}, error) {
        return []byte(key), nil
    })

    if err == nil && result.Valid {
        claim, ok := result.Claims.(*UserClaims)
        if ok {
            req.Response.Writeln("token验证成功")
            req.Response.Writeln(claim)
        }
        req.Response.Writeln(result.Claims)
    } else {
        req.Response.Writeln(err)
    }
}
```

**jwt.RegisteredClaims**

```go
type RegisteredClaims struct {
    // 发布者
    Issuer string `json:"iss,omitempty"`

    // token使用主体
    Subject string `json:"sub,omitempty"`

    // 接收方
    Audience ClaimStrings `json:"aud,omitempty"`

    // 失效时间
    ExpiresAt *NumericDate `json:"exp,omitempty"`

    // 生效时间
    NotBefore *NumericDate `json:"nbf,omitempty"`

    // 发布时间
    IssuedAt *NumericDate `json:"iat,omitempty"`

    // 可以唯一标识这一jwt的字符串，用来防止数据相似的jwt哈希碰撞
    ID string `json:"jti,omitempty"`
}
```

## 中间件

中间件（拦截器）是在请求与响应的过程中，拦截下请求与响应并做一些操作，常见的用途是在请求前进行鉴权，在请求后对响应数据进行包装等。

中间件的定义与普通路由函数一样，只是其中需要用 `Next()` 进行路由放行：

```go
func MiddleWare(r *ghttp.Request) {
    r.Middleware.Next()
}
```

**前置中间件**

在执行具体的路由函数之前进行操作的中间件称为前置中间件，例如进行登录验证的中间件：

```go
func (s *sMiddleware) Auth(r *ghttp.Request) {
    user := service.Session().GetUser(r.Context())
    if user.Id == 0 {
        _ = service.Session().SetNotice(r.Context(), &model.SessionNotice{
            Type:    consts.SessionNoticeTypeWarn,
            Content: "未登录或会话已过期，请您登录后再继续",
        })
        // 只有 GET 请求才支持保存当前URL，以便后续登录后再跳转回来。
        if r.Method == "GET" {
            _ = service.Session().SetLoginReferer(r.Context(), r.GetUrl())
        }
        // 根据当前请求方式执行不同的返回数据结构
        if r.IsAjaxRequest() {
            response.JsonRedirectExit(r, 1, "", s.LoginUrl)
        } else {
            r.Response.RedirectTo(s.LoginUrl)
        }
    }
    r.Middleware.Next()
}
```

**后置中间件**

在路由函数执行完成之后再进行操作的中间件称为后置中间件，例如对返回的数据格式进行统一封装的中间件：

```go
// 返回处理中间件
func (s *sMiddleware) ResponseHandler(r *ghttp.Request) {
    r.Middleware.Next()

    // 如果已经有返回内容，那么该中间件什么也不做
    if r.Response.BufferLength() > 0 {
        return
    }

    var (
        err             = r.GetError()
        res             = r.GetHandlerResponse()
        code gcode.Code = gcode.CodeOK
    )
    if err != nil {
        code = gerror.Code(err)
        if code == gcode.CodeNil {
            code = gcode.CodeInternalError
        }
        if r.IsAjaxRequest() {
            response.JsonExit(r, code.Code(), err.Error())
        } else {
            service.View().Render500(r.Context(), model.View{
                Error: err.Error(),
            })
        }
    } else {
        if r.IsAjaxRequest() {
            response.JsonExit(r, code.Code(), "", res)
        } else {
            // 什么都不做，业务API自行处理模板渲染的成功逻辑。
        }
    }
}
```

中间件的定义实际上就是如下结构：

```go
func MiddleWare(r *ghttp.Request) {
    // 前置中间件
    r.Middleware.Next()
    // 后置中间件
}
```

**SetCtxVar / GetCtxVar**

如果需要在请求流程中进行参数传递，可以用 `SetCtxVar` / `GetCtxVar` 进行存取。例如：

```go
func MiddleWare(r *ghttp.Request) {
    r.SetCtxVar("UserName", "陆玲珑")
    r.Middleware.Next()
}
```

在具体的路由函数中取用：

```go
UserName := r.GetCtxVar("UserName")
```
