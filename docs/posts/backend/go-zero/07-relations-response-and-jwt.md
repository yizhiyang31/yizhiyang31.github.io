---
title: go-zero 入门：关联查询、统一响应与 JWT
author: yizhiyang
date: 2026-11-22
category:
  - 后端
tag:
  - go-zero
  - 学习笔记
---

本文是 go-zero 系列的收官篇：先用 GORM 实现一对一、一对多、多对多关联查询，再介绍统一响应处理的两种方案，最后完成基于 JWT 的登录鉴权示例。

<!-- more -->

## Go-Zero 中使用 GORM 实现表关联查询

参考文档：<https://gorm.io/zh_CN/docs/has_many.html>

### 新建项目配置数据库模型

#### 新建 api

`api/article.api`：

```api
syntax = "v1"

type (
    // 文章详情请求
    OneArticleReq {
        Id int64 `path:"id"` // 使用 path 参数获取文章 ID
    }
    // 分类详情请求
    OneCateReq {
        Id int64 `path:"id"` // 使用 path 参数获取分类 ID
    }
    // 文章结构体 - 包含关联的 ArticleCate
    Article {
        Id          int64       `json:"id"`
        Title       string      `json:"title"`
        CateId      int64       `json:"cate_id"`
        State       int         `json:"state"`
        ArticleCate ArticleCate `json:"article_cate"` // 关联的分类信息
    }
    // 文章分类结构体 - 包含关联的文章列表
    ArticleCate {
        Id       int       `json:"id"`
        Title    string    `json:"title"`
        State    int       `json:"state"`
        Articles []Article `json:"articles,omitempty"` // 关联的文章列表（可选）
    }
)

@server (
    group: article
    prefix: /api/article
)
service zerogorm-api {
    @handler GetOneArticle
    get /details/:id (OneArticleReq) returns (CommonResponse)

    @handler GetArticleList
    get /list returns (CommonResponse)

    @handler GetArticlesByCate
    get /cate/:id/articles (OneCateReq) returns (CommonResponse)
}

@server (
    group: cate
    prefix: /api/cate
)
service zerogorm-api {
    @handler GetOneCate
    get /details/:id (OneCateReq) returns (CommonResponse)

    @handler GetCateList
    get /list returns (CommonResponse)

    @handler GetCateWithArticles
    get /:id/with-articles (OneCateReq) returns (CommonResponse)
}
```

`api/lesson_student.api`：

```api
syntax = "v1"

type (
    StudentIdReq {
        StudentId int64 `path:"studentId"`
    }
    LessonIdReq {
        LessonId int64 `path:"lessonId"`
    }
    Lesson {
        Id       int64      `json:"id"`
        Name     string     `json:"name"`
        Students []*Student `json:"students,omitempty"` // 关联的学生列表
    }
    Student {
        Id       int64     `json:"id"`
        Number   string    `json:"number"`
        Password string    `json:"password,omitempty"` // 密码可选返回
        ClassId  int       `json:"class_id"`
        Name     string    `json:"name"`
        Lessons  []*Lesson `json:"lessons,omitempty"` // 关联的课程列表
    }
)

@server (
    group: lesson
    prefix: /api/lesson
)
service zerogorm-api {
    @handler GetOneLesson
    get /details/:id (LessonIdReq) returns (CommonResponse)

    @handler GetLessonList
    get /list returns (CommonResponse)

    @handler GetLessonStudents
    get /students/:id (LessonIdReq) returns (CommonResponse)
}

@server (
    group: student
    prefix: /api/student
)
service zerogorm-api {
    @handler GetOneStudent
    get /details/:id (StudentIdReq) returns (CommonResponse)

    @handler GetStudentList
    get /list returns (CommonResponse)

    @handler GetStudentLessons
    get /lessons/:id (StudentIdReq) returns (CommonResponse)
}
```

`zerogorm.api` 作为主文件引入它们：

```api
syntax = "v1"

type CommonResponse {
    Message string      `json:"message"`
    Code    int         `json:"code"`
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
}

import "api/article.api"
import "api/lesson_student.api"
```

生成项目：

```bash
goctl api go --api zerogorm.api --dir .
go mod tidy
```

#### 集成 GORM

安装依赖：

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
go mod tidy
```

创建数据库模型。`model/gorm/article.go`：

```go
package gorm

type Article struct {
	Id          int         `json:"id"`
	Title       string      `json:"title"`
	CateId      int         `json:"cateId"` // 外键
	State       int         `json:"state"`
	ArticleCate ArticleCate `json:"articleCate" gorm:"foreignKey:CateId;references:Id"`
}

func (Article) TableName() string {
	return "article"
}
```

`model/gorm/articlecate.go`：

```go
package gorm

// foreignKey 外键：如果字段名是表名加 Id，默认可以不配置；否则需要通过 foreignKey 配置
// references 表示主键，默认是 Id，可以不配置
type ArticleCate struct {
	Id      int       `json:"id"`
	Title   string    `json:"title"`
	State   int       `json:"state"`
	Article []Article `json:"article" gorm:"foreignKey:CateId;references:Id"`
}

func (ArticleCate) TableName() string {
	return "article_cate"
}
```

`model/gorm/lesson.go`：

```go
package gorm

type Lesson struct {
	Id      int       `json:"id"`
	Name    string    `json:"name"`
	Student []Student `json:"student" gorm:"many2many:lesson_student;"`
}

func (Lesson) TableName() string {
	return "lesson"
}
```

`model/gorm/student.go`：

```go
package gorm

type Student struct {
	Id       int      `json:"id"`
	Number   string   `json:"number"`
	Password string   `json:"password"`
	ClassId  int      `json:"class_id"`
	Name     string   `json:"name"`
	Lesson   []Lesson `json:"lesson" gorm:"many2many:lesson_student;"`
}

func (Student) TableName() string {
	return "student"
}
```

`model/gorm/lessonstudent.go`：

```go
package gorm

type LessonStudent struct {
	LessonId  int `json:"lesson_id"`
	StudentId int `json:"student_id"`
}

func (LessonStudent) TableName() string {
	return "lesson_student"
}
```

配置数据库连接、加载配置与创建服务上下文的方式与上一篇相同：`etc/shop-api.yaml` 中配置 `MySQL.DataSource`，`config.go` 中声明 `MySQL` 结构，`internal/svc/servicecontext.go` 中用 `gorm.Open` 创建 `DB *gorm.DB` 并注入。

### 一对一

一个文章只有一个分类，`article` 和 `article_cate` 之间是一对一关系：文章表中的 `cate_id` 保存分类的 id。查询文章时同时获取分类，就涉及一对一关联查询。

`foreignKey` 指定当前表的外键，`references` 指定关联表中与外键关联的字段。

查询所有文章以及文章对应的分类信息：

```go
func (l *GetArticleListLogic) GetArticleList() (resp *types.CommonResponse, err error) {
	// 获取文章以及文章对应的分类信息
	article := []gorm.Article{}
	l.svcCtx.DB.Preload("ArticleCate").Find(&article)
	// 返回数据
	return &types.CommonResponse{Code: 200, Message: "获取数据成功", Success: true, Data: article}, nil
}
```

注意：`Preload("ArticleCate")` 中的 `ArticleCate` 是 `Article` 结构体中定义的属性名。访问 <http://localhost:8888/api/article/list>，返回结果中每篇文章都带有 `articleCate` 字段。

指定条件查询：

```go
func (l *GetArticleListLogic) GetArticleList() (resp *types.CommonResponse, err error) {
	article := []gorm.Article{}
	l.svcCtx.DB.Preload("ArticleCate").Where("id>=?", 4).Find(&article)
	return &types.CommonResponse{Code: 200, Message: "获取数据成功", Success: true, Data: article}, nil
}
```

### 一对多

一对多在实际项目中用得非常多，例如菜品分类与菜品、订单表与订单商品表。一个分类下面有很多文章，`article_cate` 和 `article` 之间是一对多关系。查询分类时获取分类下的文章，就涉及一对多关联查询。

对应的模型：`ArticleCate` 中声明 `Article []Article`，`Article` 中去掉反向的 `ArticleCate` 属性。

查询所有分类以及分类下面的文章信息：

```go
func (l *GetCateListLogic) GetCateList() (resp *types.CommonResponse, err error) {
	// 获取分类下面所有的文章
	articleCate := []gorm.ArticleCate{}
	l.svcCtx.DB.Preload("Article").Find(&articleCate)
	fmt.Println(articleCate)
	return &types.CommonResponse{Code: 200, Message: "获取数据成功", Success: true, Data: articleCate}, nil
}
```

访问 <http://localhost:8888/api/cate/list>。

指定条件、分页查询：

```go
func (l *GetCateListLogic) GetCateList() (resp *types.CommonResponse, err error) {
	articleCate := []gorm.ArticleCate{}
	l.svcCtx.DB.Preload("Article").Where("id>0").Offset(1).Limit(1).Find(&articleCate)
	fmt.Println(articleCate)
	return &types.CommonResponse{Code: 200, Message: "获取数据成功", Success: true, Data: articleCate}, nil
}
```

更多一对多查询方法可参考：<https://github.com/jouyouyun/examples/tree/master/gorm/related>

如果程序中同时有「查询文章获取分类信息」和「查询分类获取文章信息」两种需求，可以这样定义模型，让 `Article` 与 `ArticleCate` 互相声明关联字段：

```go
package gorm

type Article struct {
	Id          int         `json:"id"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	CateId      string      `json:"cate_id"`
	State       int         `json:"state"`
	ArticleCate ArticleCate `gorm:"foreignKey:CateId;references:Id"`
}

func (Article) TableName() string {
	return "article"
}

type ArticleCate struct {
	Id      int       `json:"id"`
	Title   string    `json:"title"`
	State   int       `json:"state"`
	Article []Article `gorm:"foreignKey:CateId"`
}

func (ArticleCate) TableName() string {
	return "article_cate"
}
```

### 多对多

学生与课程是多对多关系：一个学生可以选多门课，一门课可以被多个学生选修。通过 `many2many:lesson_student` 指定中间表，Lesson、Student、LessonStudent 的模型见上文。如果想根据课程获取选学该课程的学生，就在 `Lesson` 里关联 `Student`。

获取学生信息以及课程信息：

```go
func (l *GetLessonListLogic) GetLessonList() (resp *types.CommonResponse, err error) {
	lessonList := []gorm.Lesson{}
	l.svcCtx.DB.Find(&lessonList)
	return &types.CommonResponse{Message: "success", Code: 200, Success: true, Data: lessonList}, nil
}

func (l *GetStudentListLogic) GetStudentList() (resp *types.CommonResponse, err error) {
	studentList := []gorm.Student{}
	l.svcCtx.DB.Find(&studentList)
	return &types.CommonResponse{Message: "success", Code: 200, Success: true, Data: studentList}, nil
}
```

查询学生信息时一并获取选课信息（`Preload("Lesson")`）：

```go
func (l *GetStudentListLogic) GetStudentList() (resp *types.CommonResponse, err error) {
	studentList := []gorm.Student{}
	l.svcCtx.DB.Preload("Lesson").Find(&studentList)
	return &types.CommonResponse{Message: "success", Code: 200, Success: true, Data: studentList}, nil
}
```

查询张三（id=1）选修了哪些课程：

```go
l.svcCtx.DB.Preload("Lesson").Where("id=1").Find(&studentList)
```

查询课程被哪些学生选修了：

```go
func (l *GetLessonListLogic) GetLessonList() (resp *types.CommonResponse, err error) {
	lessonList := []gorm.Lesson{}
	l.svcCtx.DB.Preload("Student").Find(&lessonList)
	return &types.CommonResponse{Message: "success", Code: 200, Success: true, Data: lessonList}, nil
}
```

查询「计算机网络」（id=1）被哪些学生选修：

```go
l.svcCtx.DB.Preload("Student").Where("id=1").Find(&lessonList)
```

查询数据指定条件（Offset + Limit）：

```go
l.svcCtx.DB.Preload("Student").Offset(1).Limit(2).Find(&lessonList)
```

关联查询指定子集的筛选条件。例如「张三被开除了」，查询课程被哪些学生选修时要去掉张三：

```go
l.svcCtx.DB.Preload("Student", "id!=1").Where("id=1").Find(&lessonList)
l.svcCtx.DB.Preload("Student", "id not in (1,2)").Where("id=1").Find(&lessonList)
```

用法参考：<https://gorm.io/zh_CN/docs/preload.html>

```go
access := []gorm.Access{}
models.DB.Preload("AccessItem", "status=1").Order("sort desc").Where("module_id=?", 0).Find(&access)
```

自定义预加载 SQL：查询课程被哪些学生选修，要求学生 id 倒序输出。注意需要引入 `gorm.io/gorm` 包：

```go
package lesson

import (
	"context"

	"gormassociationqueries/internal/svc"
	"gormassociationqueries/internal/types"
	"gormassociationqueries/model/gorm"

	ORM "gorm.io/gorm" // 使用 ORM 作为别名

	"github.com/zeromicro/go-zero/core/logx"
)

type GetLessonListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetLessonListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetLessonListLogic {
	return &GetLessonListLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetLessonListLogic) GetLessonList() (resp *types.CommonResponse, err error) {
	lessonList := []gorm.Lesson{}
	l.svcCtx.DB.Preload("Student", func(db *ORM.DB) *ORM.DB {
		return l.svcCtx.DB.Order("id DESC")
	}).Find(&lessonList)
	return &types.CommonResponse{Message: "success", Code: 200, Success: true, Data: lessonList}, nil
}
```

在自定义预加载中叠加筛选条件：

```go
l.svcCtx.DB.Preload("Student", func(db *ORM.DB) *ORM.DB {
	return l.svcCtx.DB.Where("id>3").Order("id DESC")
}).Find(&lessonList)
```

## 统一响应处理

### 方法 1：未封装

先在 api 中提供统一的结构体：

```api
syntax = "v1"

type CommonResponse {
    Message string      `json:"message"`
    Code    int         `json:"code"`
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
}
```

业务层逻辑处理时手动构造成功与失败的响应：

```go
func (l *GetOneCateLogic) GetOneCate(req *types.OneCateReq) (resp *types.CommonResponse, err error) {
	articleCate := gorm.ArticleCate{}
	l.svcCtx.DB.Where("id=?", req.Id).Find(&articleCate)
	fmt.Println(articleCate)
	// 成功返回数据，失败返回失败
	if articleCate.Id > 0 {
		return &types.CommonResponse{Code: 200, Message: "获取数据成功", Success: true, Data: articleCate}, nil
	} else {
		return &types.CommonResponse{Message: "没有找到该分类", Code: -1, Success: false}, nil
	}
}
```

处理统一的错误，在 `main.go` 中通过 `httpx.SetErrorHandler` 拦截：

```go
package main

import (
	"flag"
	"fmt"
	"net/http"

	"gormassociationqueries/internal/config"
	"gormassociationqueries/internal/handler"
	"gormassociationqueries/internal/svc"
	"gormassociationqueries/internal/types"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
)

var configFile = flag.String("f", "etc/zerogorm-api.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	server := rest.MustNewServer(c.RestConf)
	defer server.Stop()

	ctx := svc.NewServiceContext(c)
	handler.RegisterHandlers(server, ctx)

	// 统一的错误处理
	httpx.SetErrorHandler(func(err error) (int, any) {
		return http.StatusOK, &types.CommonResponse{
			Message: err.Error(),
			Code:    400,
			Success: false,
		}
	})

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
```

### 方法 2：封装统一处理方法（推荐）

新建 `internal/biz/` 目录，包含三个文件：

- `code.go`：定义业务状态码，包含成功码 `Ok = 200` 及多个业务错误码常量。
- `error.go`：定义 `ErrorUtil` 结构体（含错误码与错误信息），实现 `error` 接口，提供 `NewError` 函数。
- `response.go`：提供统一响应格式，包含生成成功响应的 `Success` 和生成失败响应的 `Error`。

`internal/biz/error.go`：

```go
package biz

// 错误
type ErrorUtil struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
}

// 实现 error 接口
func (e *ErrorUtil) Error() string {
	return e.Msg
}

// NewError 创建一个错误
func NewError(code int, msg string) *ErrorUtil {
	return &ErrorUtil{
		Code: code,
		Msg:  msg,
	}
}
```

`internal/biz/code.go`：

```go
package biz

const Ok = 200

var (
	DBError                     = NewError(10000, "数据库错误")
	ParamError                  = NewError(10001, "参数错误")
	DataNotExist                = NewError(10002, "数据不存在")
	ServerError                 = NewError(10003, "服务器错误")
	UserNotExist                = NewError(10004, "用户不存在")
	UserNotLogin                = NewError(10005, "用户未登录")
	UserNotExistOrPasswordError = NewError(10006, "用户不存在或密码错误")
)
```

`internal/biz/response.go`（其中 `types.CommonResponse` 定义在 api 中，由 goctl 生成到 `types.go`）：

```go
package biz

import "gormassociationqueries/internal/types"

// 成功
func Success(data any) *types.CommonResponse {
	return &types.CommonResponse{
		Code:    Ok,
		Message: "success",
		Success: true,
		Data:    data,
	}
}

// 失败
func Error(err *ErrorUtil) *types.CommonResponse {
	return &types.CommonResponse{
		Code:    err.Code,
		Message: err.Msg,
		Success: false,
	}
}
```

修改业务层处理逻辑：

```go
func (l *GetOneCateLogic) GetOneCate(req *types.OneCateReq) (resp *types.CommonResponse, err error) {
	articleCate := gorm.ArticleCate{}
	l.svcCtx.DB.Where("id=?", req.Id).Find(&articleCate)
	if articleCate.Id > 0 {
		return biz.Success(articleCate), nil
	}
	return biz.Error(biz.NewError(biz.DataNotExist.Code, biz.DataNotExist.Msg)), nil
}
```

在 `main.go` 中处理统一的错误：

```go
httpx.SetErrorHandler(func(err error) (int, any) {
	return http.StatusOK, biz.Error(biz.NewError(400, err.Error()))
})
```

## go-zero JWT

参考文档：<https://go-zero.dev/docs/tutorials/http/server/jwt>

JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在网络应用间传递声明式信息，是一种基于 JSON 的轻量级身份验证和授权机制，用于在客户端和服务器之间安全地传输信息。

JWT 由三部分组成：头部（header）、载荷（payload）和签名（signature）。头部通常包含令牌类型和所使用的加密算法；载荷是存储信息的主要部分，包含用户 ID、用户名、过期时间等声明（claim）；签名是将头部和载荷组合后使用密钥生成的哈希值，用于验证令牌的真实性。

### 新建项目

#### api/user.api

```api
syntax = "v1"

type (
    LoginReq {
        Username string `json:"username"`
        Password string `json:"password"`
    }
    LoginResp {
        Token string `json:"token"`
    }
)

@server (
    group: account // 路由前缀
    prefix: "/api" // 影响配置文件名称和主文件名称
)
service user-api {
    @handler login
    post /user/login (LoginReq) returns (CommonResponse)
}
```

#### api/address.api

```api
syntax = "v1"

type (
    Address {
        Id      int64  `json:"id"`
        Address string `json:"address"`
        Phone   string `json:"phone"`
        Name    string `json:"name"`
    }
)

@server (
    group: address // 路由前缀
    prefix: "/api" // 影响配置文件名称和主文件名称
)
service user-api {
    @handler address
    get /address/list () returns (CommonResponse)
}
```

#### jwt.api

```api
syntax = "v1"

type CommonResponse {
    Message string      `json:"message"`
    Code    int         `json:"code"`
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
}

import "api/user.api"
import "api/address.api"
```

#### 执行命令

```bash
goctl api go --api jwt.api --dir .
go mod tidy
```

### 封装统一处理方法（推荐）

JWT 示例同样复用上一节的 `internal/biz/code.go`、`internal/biz/error.go`、`internal/biz/response.go` 三个文件，并在 `main.go` 中通过 `httpx.SetErrorHandler` 统一返回 `biz.Error(...)`。

### 集成 JWT

#### 配置 secret key

`etc/user-api.yaml`：

```yaml
Name: user-api
Host: 0.0.0.0
Port: 8888
Auth:
  JwtSecret: "this is jwt secret"
  Expire: 86400
```

#### config/config.go 加载配置

```go
package config

import "github.com/zeromicro/go-zero/rest"

type Config struct {
	rest.RestConf
	Auth struct {
		JwtSecret string
		Expire    int64
	}
}
```

#### routes.go 中配置 jwt

给需要鉴权的路由组加上 `rest.WithJwt`：

```go
server.AddRoutes(
	[]rest.Route{
		{
			Method:  http.MethodGet,
			Path:    "/address/list",
			Handler: address.AddressHandler(serverCtx),
		},
	},
	rest.WithPrefix("/api"),
	rest.WithJwt(serverCtx.Config.Auth.JwtSecret),
)
```

#### 创建生成 JWT Token 的方法

新建 `biz/jwt.go`：

```go
package biz

import "github.com/golang-jwt/jwt/v4"

// @secretKey: JWT 加解密密钥
// @iat: 时间戳
// @seconds: 过期时间，单位秒
// @payload: 数据载体
func GetJwtToken(secretKey string, iat, seconds int64, payload string) (string, error) {
	claims := make(jwt.MapClaims)
	claims["exp"] = iat + seconds
	claims["iat"] = iat
	claims["payload"] = payload

	token := jwt.New(jwt.SigningMethodHS256)
	token.Claims = claims

	return token.SignedString([]byte(secretKey))
}
```

#### 执行登录下发 token

```go
func (l *LoginLogic) Login(req *types.LoginReq) (resp *types.CommonResponse, err error) {
	// 生成 token
	token, err := biz.GetJwtToken(
		l.svcCtx.Config.Auth.JwtSecret,
		time.Now().Unix(),
		l.svcCtx.Config.Auth.Expire,
		req.Username,
	)
	if err != nil {
		return biz.Error(biz.ServerError), nil
	}
	return biz.Success(types.LoginResp{Token: token}), nil
}
```

#### 请求 address 验证 token

调用 `/api/address/list` 时带上登录下发的 token，通过 JWT 校验后才能返回数据：

```go
func (l *AddressLogic) Address() (resp *types.CommonResponse, err error) {
	// 返回地址信息
	return biz.Success(types.Address{
		Id:      1,
		Name:    "张三",
		Phone:   "12345678901",
		Address: "中国",
	}), nil
}
```

## go-zero 跨域请求

### 什么是跨域

跨域是浏览器基于**同源策略**的一种安全手段。同源要求以下三项全部相同：

- 协议相同（protocol）
- 主机相同（host）
- 端口相同（port）

当前端访问的不是同源服务地址时，就会发生跨域问题。go-zero 在 `rest.MustNewServer` 中通过一系列选项配置 CORS。

### 允许所有跨域请求

传入 `rest.WithCors()` 且不指定参数，即允许所有来源：

```go
server := rest.MustNewServer(c.RestConf, rest.WithCors())
```

### 允许指定域名跨域

在参数中列出允许的来源（多个域名可分别传入）：

```go
server := rest.MustNewServer(c.RestConf, rest.WithCors("http://localhost:5173"))
```

### 自定义允许的请求头

有时客户端需要传递自定义 header（如 `Authorization`），否则仍会出现跨域问题，此时用 `rest.WithCorsHeaders` 指定允许的请求头：

```go
server := rest.MustNewServer(
	c.RestConf,
	// 指定允许的请求头
	rest.WithCorsHeaders("Content-Type", "Authorization"),
)
```

### 指定域名并自定义请求头

既限制域名又允许自定义 header 时，两个选项的顺序不能颠倒：

```go
server := rest.MustNewServer(
	c.RestConf,
	rest.WithCors("http://localhost:5173"),
	rest.WithCorsHeaders("xxxx"),
)
```

### 完全自定义 CORS 策略

需要更细粒度的控制（例如允许携带 Cookie 凭证）时，用 `rest.WithCustomCors` 直接设置响应头：

```go
server := rest.MustNewServer(
	c.RestConf,
	rest.WithCustomCors(func(header http.Header) {
		// 替换为具体的可信域名，多个用逗号隔开
		header.Set("Access-Control-Allow-Origin", "https://www.example.com")
		header.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		header.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Custom-Header")
		// 如需携带 Cookie 等凭证，不能使用通配符 Origin，并设置为 true
		header.Set("Access-Control-Allow-Credentials", "true")
	}, nil),
)
```

## 小结

- 一对一用 `foreignKey` + `references` 声明外键，通过 `Preload("ArticleCate")` 预加载关联对象。
- 一对多在「一」的一端声明切片字段，用 `Preload("Article")` 加载子集；多对多通过 `many2many:lesson_student` 指定中间表。
- 统一响应有两种方案：直接在 logic 中构造 `CommonResponse`，或封装 `internal/biz` 的 `Success`/`Error` 方法（推荐）。
- JWT 流程：配置 `JwtSecret` → `config.go` 加载 → `routes.go` 用 `rest.WithJwt` 挂载 → 登录时 `GetJwtToken` 下发 → 受保护路由自动校验 token。
- 跨域用 `rest.WithCors` 系列选项：允许所有来源、限制指定域名、放行自定义请求头；携带 Cookie 时须指定具体 Origin 并开启 `Access-Control-Allow-Credentials`。
