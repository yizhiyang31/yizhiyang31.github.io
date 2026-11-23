---
title: GoFrame 实战：图书管理 API
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - GoFrame
  - 学习笔记
---

本文用一个图书管理 API 串起前面介绍的知识点：API 数据结构定义、控制器与路由绑定、Service / Logic 分层、JWT 登录与鉴权中间件，最后接入 Swagger UI 作为接口文档页面。

<!-- more -->

## 功能说明

本示例简单实现下列功能的 API：

1. 书本数据获取（分页）
2. 书本数据添加、编辑、删除
3. 用户名与密码登录
4. 书本数据展示与添加、编辑、删除需要登录才能访问

本示例用 API 实现，即只用 JSON 格式数据返回。如果需要用模板实现，核心部分都相同，只是需要将返回的数据自行组织到模板页面上。

## 创建项目与安装依赖

```shell
gf init gfbook
```

删除 `api`、`controller` 中自动生成的文件，删除 `cmd.go` 中的路由绑定。

添加依赖的库，即 `mysql` 驱动和 `jwt`。

方法一（需要联网）：

```shell
go get github.com/gogf/gf/contrib/drivers/mysql/v2
go get github.com/golang-jwt/jwt/v5
```

`mysql` 驱动初始化导入：

`main.go`

```go
import (
    _ "github.com/gogf/gf/contrib/drivers/mysql/v2"
)
```

方法二（需要之前已经下载过对应版本的库，此次不需要联网）：

需要先进行初始化导入，否则没法添加。

`main.go`

```go
import (
    _ "github.com/gogf/gf/contrib/drivers/mysql/v2"
    _ "github.com/golang-jwt/jwt/v5" // 这行在 go mod tidy 运行之后删除
)
```

`go.mod`

```go
require (
    github.com/gogf/gf/contrib/drivers/mysql/v2 v2.5.3
    github.com/gogf/gf/v2 v2.5.3
    github.com/golang-jwt/jwt/v5 v5.0.0
)
```

执行以下指令更新：

```shell
go mod tidy
```

## 配置

`manifest/config/config.yaml`

配置数据库连接：

```yaml
server:
  address:     ":8000"
  openapiPath: "/api.json"
  swaggerPath: "/swagger"
  serverRoot:  "resource/public/resource"

database:
  link: "mysql:root:root@tcp(127.0.0.1:3306)/goframe?loc=Local&parseTime=true"

logger:
  level:  "all"
  stdout: true
```

准备需要用到的资源文件。

`hack/config.yaml`

配置 DAO 生成相关信息：

```yaml
gfcli:
  gen:
    dao:
      link: "mysql:root:root@tcp(127.0.0.1:3306)/goframe"
      tables: "user,book"
      jsonCase: "Snake"
```

配置完成之后运行命令生成 DAO 相关文件：

```shell
gf gen dao
```

## API 数据结构

`api/user/user.go`

```go
package user

import "github.com/gogf/gf/v2/frame/g"

type LoginReq struct {
    g.Meta   `path:"/login" method:"post"`
    Username string `p:"username" v:"required#请输入用户名" dc:"用户名"`
    Password string `p:"password" v:"required#请输入密码" dc:"密码"`
}

type UserInfo struct {
    Id       uint   `json:"id"         dc:"用户ID"`
    Username string `json:"username"   dc:"用户名"`
    Nickname string `json:"nickname"   dc:"昵称"`
    Avatar   string `json:"avatar"     dc:"用户头像"`
}

type LoginRes struct {
    Token    string    `json:"token" dc:"验证token"`
    UserInfo *UserInfo `json:"user_info"`
}
```

`api/book/book.go`

```go
package book

import (
    "gfbook/internal/model/entity"

    "github.com/gogf/gf/v2/frame/g"
    "github.com/gogf/gf/v2/os/gtime"
)

type IndexReq struct {
    g.Meta   `path:"/book" method:"get"`
    Page     uint `p:"page" v:"required|integer|min:1#数据页不能为空|数据页只能是整数|数据页不能小于1" dc:"页数"`
    PageSize uint `p:"page_size" v:"integer|min:1#数据大小只能为整数|数据大小不能小于1" d:"10" dc:"每页数据量"`
}

type IndexRes struct {
    Page     uint          `json:"page" dc:"页数"`
    PageSize uint          `json:"page_size" dc:"每页数据量"`
    Rows     []entity.Book `json:"rows" dc:"查询数据"`
}

type AddReq struct {
    g.Meta      `path:"/book" method:"post"`
    Name        string      `p:"name" v:"required#书名不能为空" dc:"书名"`
    Author      string      `p:"author" v:"required#作者不能为空" dc:"作者"`
    Price       float64     `p:"price" v:"required|float|min:0#价格不能为空|价格格式不正确|价格不能小于0" dc:"价格"`
    PublishTime *gtime.Time `p:"publish_time" v:"date#出版时间格式不正确" dc:"出版日期"`
}

type AddRes struct {
}

type EditReq struct {
    g.Meta      `path:"/book" method:"put"`
    Id          uint        `p:"id" v:"required" dc:"书本ID"`
    Name        string      `p:"name" dc:"书名"`
    Author      string      `p:"author" dc:"作者"`
    Price       float64     `p:"price" v:"float|min:0#价格格式不正确|价格不能小于0" dc:"价格"`
    PublishTime *gtime.Time `p:"publish_time" v:"date#出版时间格式不正确" dc:"出版日期"`
}

type EditRes struct{}

type DelReq struct {
    g.Meta `path:"/book" method:"delete"`
    Id     uint `p:"id" v:"required" dc:"书本ID"`
}

type DelRes struct{}
```

## 控制器与路由绑定

`internal/controller/user/user.go`

```go
package user

import (
    "context"

    "gfbook/api/user"
)

var UserController = &cUser{}

type cUser struct {
}

func (c *cUser) Login(ctx context.Context, req *user.LoginReq) (res *user.LoginRes, err error) {
    return
}
```

`internal/controller/book/book.go`

```go
package book

import (
    "context"

    "gfbook/api/book"
)

var BookController = &cBook{}

type cBook struct{}

func (c *cBook) Index(ctx context.Context, req *book.IndexReq) (res *book.IndexRes, err error) {
    return
}

func (c *cBook) Add(ctx context.Context, req *book.AddReq) (res *book.AddRes, err error) {
    return
}

func (c *cBook) Edit(ctx context.Context, req *book.EditReq) (res *book.EditRes, err error) {
    return
}

func (c *cBook) Del(ctx context.Context, req *book.DelReq) (res *book.DelRes, err error) {
    return
}
```

`internal/cmd/cmd.go`

```go
s := g.Server()
s.Group("/", func(group *ghttp.RouterGroup) {
    group.Middleware(ghttp.MiddlewareHandlerResponse)
    group.Group("/user", func(group *ghttp.RouterGroup) {
        group.Bind(user.UserController)
    })
    group.Group("/", func(group *ghttp.RouterGroup) {
        group.Bind(book.BookController)
    })
})
```

## Book 的 Service 层

`internal/service/book.go`

```go
package service

import (
    "context"

    "gfbook/internal/model/do"
    "gfbook/internal/model/entity"
)

type IBook interface {
    // 查询书本列表
    GetList(ctx context.Context, page uint, pageSize uint) (books []entity.Book, err error)
    // 添加书本信息
    Add(ctx context.Context, book do.Book) (err error)
    // 修改书本信息
    Edit(ctx context.Context, book do.Book) (err error)
    // 删除书本信息
    Del(ctx context.Context, id uint) (err error)
}

var localBook IBook

func Book() IBook {
    if localBook == nil {
        panic("IBook接口未实现或未注册")
    }
    return localBook
}

func RegisterBook(i IBook) {
    localBook = i
}
```

`internal/controller/book/book.go`

```go
package book

import (
    "context"

    "gfbook/api/book"
    "gfbook/internal/model/do"
    "gfbook/internal/service"
)

var BookController = &cBook{
    service: service.Book(),
}

type cBook struct {
    service service.IBook
}

func (c *cBook) Index(ctx context.Context, req *book.IndexReq) (res *book.IndexRes, err error) {
    books, err := c.service.GetList(ctx, req.Page, req.PageSize)
    if err == nil {
        res = &book.IndexRes{
            Page:     req.Page,
            PageSize: req.PageSize,
            Rows:     books,
        }
    }
    return
}

func (c *cBook) Add(ctx context.Context, req *book.AddReq) (res *book.AddRes, err error) {
    err = c.service.Add(ctx, do.Book{
        Name:        req.Name,
        Author:      req.Author,
        Price:       req.Price,
        PublishTime: req.PublishTime,
    })
    return
}

func (c *cBook) Edit(ctx context.Context, req *book.EditReq) (res *book.EditRes, err error) {
    err = c.service.Edit(ctx, do.Book{
        Id:          req.Id,
        Name:        req.Name,
        Author:      req.Author,
        Price:       req.Price,
        PublishTime: req.PublishTime,
    })
    return
}

func (c *cBook) Del(ctx context.Context, req *book.DelReq) (res *book.DelRes, err error) {
    err = c.service.Del(ctx, req.Id)
    return
}
```

## Book 的 Logic 层实现

新建 `internal/logic/book/book.go` 文件，实现上面的 `IBook` 接口：

```go
package book

import (
    "context"

    "gfbook/internal/dao"
    "gfbook/internal/model/do"
    "gfbook/internal/model/entity"
    "gfbook/internal/service"
)

func init() {
    service.RegisterBook(New())
}

func New() *iBook {
    return &iBook{}
}

type iBook struct{}

// Add implements service.IBook.
func (*iBook) Add(ctx context.Context, book do.Book) (err error) {
    _, err = dao.Book.Ctx(ctx).Data(book).Insert()
    return
}

// Del implements service.IBook.
func (*iBook) Del(ctx context.Context, id uint) (err error) {
    _, err = dao.Book.Ctx(ctx).Where(dao.Book.Columns().Id, id).Delete()
    return
}

// Edit implements service.IBook.
func (*iBook) Edit(ctx context.Context, book do.Book) (err error) {
    _, err = dao.Book.Ctx(ctx).Where(dao.Book.Columns().Id, book.Id).Data(book).Update()
    return
}

// GetList implements service.IBook.
func (*iBook) GetList(ctx context.Context, page uint, pageSize uint) (books []entity.Book, err error) {
    err = dao.Book.Ctx(ctx).Page(int(page), int(pageSize)).Scan(&books)
    return
}
```

新建 `internal/logic/logic.go` 文件，对上述实现进行初始化导入：

```go
import (
    _ "gfbook/internal/logic/book"
)
```

在 `main.go` 中对 logic 进行初始化导入：

`main.go`

```go
import (
    _ "gfbook/internal/logic"
)
```

## User 的 Service 与登录

`internal/service/user.go`

```go
package service

import (
    "context"

    "gfbook/internal/model/entity"
)

type IUser interface {
    Login(ctx context.Context, username string, password string) (user *entity.User, err error)
}

var localUser IUser

func User() IUser {
    if localUser == nil {
        panic("IUser接口未实现或未注册")
    }
    return localUser
}

func RegisterUser(i IUser) {
    localUser = i
}
```

`internal/controller/user/user.go`

```go
package user

import (
    "context"
    "time"

    api_user "gfbook/api/user"
    "gfbook/internal/model/entity"
    "gfbook/internal/service"

    "github.com/golang-jwt/jwt/v5"
)

var UserController = &cUser{}

type cUser struct {
}

func (c *cUser) Login(ctx context.Context, req *api_user.LoginReq) (res *api_user.LoginRes, err error) {
    user, err := service.User().Login(ctx, req.Username, req.Password)
    if err == nil {
        res = &api_user.LoginRes{
            Token: jwtToken(user),
            UserInfo: &api_user.UserInfo{
                Id:       user.Id,
                Username: user.Username,
                Nickname: user.Nickname,
                Avatar:   user.Avatar,
            },
        }
    }
    return
}

func jwtToken(user *entity.User) string {
    const JwtTokenKey = "zbvxMPp12fibPNnOaYmc0rviniaJCOVJ"
    // 实际使用中可将 Key 存于文件中或放在常量中 consts.JwtTokenKey

    claim := jwt.RegisteredClaims{
        Subject:   user.Username,
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
    }

    token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claim).SignedString([]byte(JwtTokenKey))

    if err != nil {
        panic("token生成出错")
    }

    return token
}
```

## User 的 Logic 层实现

`internal/logic/user/user.go`

```go
package user

import (
    "context"

    "gfbook/internal/dao"
    "gfbook/internal/model/do"
    "gfbook/internal/model/entity"
    "gfbook/internal/service"

    "github.com/gogf/gf/v2/errors/gerror"
)

type iUser struct{}

func New() *iUser {
    return &iUser{}
}

func init() {
    service.RegisterUser(New())
}

// Login implements service.IUser.
func (*iUser) Login(ctx context.Context, username string, password string) (user *entity.User, err error) {
    err = dao.User.Ctx(ctx).Where(do.User{
        Username: username,
        Password: password,
    }).Scan(&user)

    if user == nil {
        err = gerror.New("用户名或密码有误")
    }

    return
}
```

`internal/logic/logic.go`

```go
import (
    _ "gfbook/internal/logic/book"
    _ "gfbook/internal/logic/user"
)
```

## 登录验证中间件

`internal/service/middleware.go`

```go
package service

import "github.com/gogf/gf/v2/net/ghttp"

type IMiddleware interface {
    Auth(r *ghttp.Request)
}

var localMiddleware IMiddleware

func Middleware() IMiddleware {
    if localMiddleware == nil {
        panic("IMiddleware接口未实现或未注册")
    }
    return localMiddleware
}

func RegisterMiddleware(i IMiddleware) {
    localMiddleware = i
}
```

`internal/logic/middleware/middleware.go`

```go
package middleware

import (
    "gfbook/internal/consts"
    "gfbook/internal/service"

    "github.com/gogf/gf/v2/net/ghttp"
    "github.com/golang-jwt/jwt/v5"
)

func init() {
    service.RegisterMiddleware(New())
}

func New() *iMiddleware {
    return &iMiddleware{}
}

type iMiddleware struct {
}

// Auth implements service.IMiddleware.
func (*iMiddleware) Auth(r *ghttp.Request) {
    var res *ghttp.DefaultHandlerResponse
    tokenStr := r.Header.Get("Authorization")
    if tokenStr == "" {
        res = &ghttp.DefaultHandlerResponse{
            Code:    403,
            Message: "请登录后携带token访问",
        }
    } else {
        token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
            return []byte(consts.JwtTokenKey), nil
        })

        if err != nil || !token.Valid {
            res = &ghttp.DefaultHandlerResponse{
                Code:    403,
                Message: "token已失效，请重新登录",
            }
        }
    }
    if res != nil {
        r.Response.WriteJsonExit(res)
    }
    r.Middleware.Next()
}
```

`internal/logic/logic.go`

```go
package logic

import (
    _ "gfbook/internal/logic/book"
    _ "gfbook/internal/logic/middleware"
    _ "gfbook/internal/logic/user"
)
```

`internal/cmd/cmd.go`

```go
group.Group("/", func(group *ghttp.RouterGroup) {
    group.Middleware(service.Middleware().Auth)
    group.Bind(book.BookController)
})
```

## 接口文档

准备对应的 JS 与 CSS 文件放入静态资源对应的目录，或者使用在线的 CDN 链接。

`template/api.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/resource/css/swagger-ui.css">
    <script src="/resource/js/swagger-ui-bundle.js"></script>
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

`internal/cmd/cmd.go`

```go
group.GET("/api", func(req *ghttp.Request) {
    req.Response.WriteTpl("/api.html")
})
```

## 后续学习

- <https://github.com/gogf/gf-demo-user>
- <https://github.com/gogf/focus-single>
