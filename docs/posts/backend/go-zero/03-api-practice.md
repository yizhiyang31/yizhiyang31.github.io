---
title: go-zero 入门：API 实战
author: yizhiyang
date: 2026-11-21
category:
  - 后端
tag:
  - go-zero
  - 学习笔记
---

本文通过轮播图、文章列表等真实接口串起 go-zero 的 API 开发流程，并讲解 `@server` 前缀与分组、中间件、超时配置、`@doc` 文档注解和 `import` 多文件组织等进阶用法。

<!-- more -->

## 编写一个获取轮播图列表的 Api 服务

`service` 语句是对 HTTP 服务的直观描述，包含请求 handler、请求方法、请求路由、请求体、响应体、jwt 开关、中间件声明等定义。

### 新建 shop.api

```api
syntax = "v1"

// 定义接口
type (
    // 焦点图列表响应
    FocusResp {
        Result []*Focus `json:"result"`
    }

    Focus {
        Id       int64  `json:"id"`
        Name     string `json:"name"`
        Pic      string `json:"pic"`
        Url      string `json:"url"`
        Position int64  `json:"position"`
    }
)

// 定义 HTTP 服务
service shop {
    @handler GetFocusList
    get /focus returns (FocusResp)
}
```

### 生成项目

```bash
goctl api go --api shop.api --dir .
```

各参数的含义：

- `goctl`：go-zero 框架的命令行工具。
- `api go`：表示要生成 Go 语言的 API 服务代码。
- `--api shop.api`：指定 API 定义文件为 `shop.api`。
- `--dir .`：指定生成代码的输出目录为当前目录。

运行该命令会根据 `shop.api` 自动生成：API 路由配置、Handler 处理函数、Logic 业务逻辑层、Main 入口文件、配置文件、中间件等基础设施。

下载依赖：

```bash
go mod tidy
```

### 修改项目

在生成的 `internal/logic/getfocuslistlogic.go` 中返回一组模拟数据：

```go
func (l *GetFocusListLogic) GetFocusList() (resp *types.FocusResp, err error) {
	// 返回一个模拟的轮播图列表数据
	focusList := []*types.Focus{
		{
			Id:       1,
			Name:     "轮播图1",
			Pic:      "https://picsum.photos/200/300",
			Position: 1,
			Url:      "https://www.baidu.com",
		},
		{
			Id:       2,
			Name:     "轮播图2",
			Pic:      "https://picsum.photos/200/300",
			Position: 2,
			Url:      "https://www.baidu.com",
		},
	}
	return &types.FocusResp{Result: focusList}, nil
}
```

### 访问项目

访问 <http://localhost:8888/focus>，返回：

```json
{
  "result": [
    {"id": 1, "name": "轮播图1", "pic": "https://picsum.photos/200/300", "url": "https://www.baidu.com", "position": 1},
    {"id": 2, "name": "轮播图2", "pic": "https://picsum.photos/200/300", "url": "https://www.baidu.com", "position": 2}
  ]
}
```

## 加入获取文章列表的 Api（GET 传值、动态路由）

### 修改 shop.api

新增焦点图详情、文章详情、文章列表相关的结构与路由。注意 `OneFocusReq.Id` 用 `path` tag（动态路由），`OneArticleReq.Id` 用 `form` tag（GET 传值）：

```api
syntax = "v1"

type (
    OneFocusReq {
        Id int64 `path:"id"` // 使用 path tag 表示路径参数
    }
    OneFocusResp {
        Result Focus `json:"result"`
    }
    FocusResp {
        Result []*Focus `json:"result"`
    }
    Focus {
        Id       int64  `json:"id"`
        Name     string `json:"name"`
        Pic      string `json:"pic"`
        Url      string `json:"url"`
        Position int64  `json:"position"`
    }
)

type (
    OneArticleReq {
        Id int64 `form:"id"` // Get 传值只保留 form tag
    }
    OneArticleResp {
        Result Article `json:"result"`
    }
    ArticleResp {
        Result []*Article `json:"result"`
    }
    Article {
        Id          int64  `json:"id"`
        Title       string `json:"title"`
        Description string `json:"description"`
        Pic         string `json:"pic"`
        Content     string `json:"content"`
    }
)

service shop-api {
    @handler GetOneFocus
    get /api/focus/details/:id (OneFocusReq) returns (OneFocusResp)

    @handler GetFocusList
    get /api/focus returns (FocusResp)

    @handler GetOneArticle
    get /api/article/details (OneArticleReq) returns (OneArticleResp)

    @handler GetArticleList
    get /api/article returns (ArticleResp)
}
```

### 生成项目

```bash
goctl api go --api shop.api --dir .
```

### 修改项目

分别完善四个 logic 文件。

`getonefocuslogic.go`：

```go
func (l *GetOneFocusLogic) GetOneFocus(req *types.OneFocusReq) (resp *types.OneFocusResp, err error) {
	// 获取轮播图 id
	id := req.Id
	// 模拟返回这个 id 的轮播图数据
	return &types.OneFocusResp{
		Result: types.Focus{
			Id:       id,
			Name:     "轮播图1",
			Pic:      "https://picsum.photos/200/300",
			Url:      "https://www.baidu.com",
			Position: 1,
		},
	}, nil
}
```

`getfocuslistlogic.go`：

```go
func (l *GetFocusListLogic) GetFocusList() (resp *types.FocusResp, err error) {
	focusList := []*types.Focus{
		{Id: 1, Name: "轮播图1", Pic: "https://picsum.photos/200/300", Position: 1, Url: "https://www.baidu.com"},
		{Id: 2, Name: "轮播图2", Pic: "https://picsum.photos/200/300", Position: 2, Url: "https://www.baidu.com"},
	}
	return &types.FocusResp{Result: focusList}, nil
}
```

`getonearticlelogic.go`：

```go
func (l *GetOneArticleLogic) GetOneArticle(req *types.OneArticleReq) (resp *types.OneArticleResp, err error) {
	// 获取文章 id
	id := req.Id
	// 模拟返回这个 id 的文章数据
	return &types.OneArticleResp{
		Result: types.Article{
			Id:          id,
			Title:       "文章标题1",
			Description: "文章描述1",
			Pic:         "https://pic.downk.cc/item/5f5c0c5c5b7f9c7f9c5c5c5c.jpg",
			Content:     "文章内容",
		},
	}, nil
}
```

`getarticlelistlogic.go`：

```go
func (l *GetArticleListLogic) GetArticleList() (resp *types.ArticleResp, err error) {
	return &types.ArticleResp{
		Result: []*types.Article{
			{Id: 1, Title: "文章1", Description: "文章1的描述", Pic: "https://picsum.photos/200/300", Content: "文章1的内容"},
			{Id: 2, Title: "文章2", Description: "文章2的描述", Pic: "https://picsum.photos/200/300"},
		},
	}, nil
}
```

### 访问项目

- 焦点图列表：<http://localhost:8888/api/focus>
- 焦点图详情（动态路由）：<http://localhost:8888/api/focus/details/124>
- 文章列表：<http://localhost:8888/api/article>
- 文章详情（GET 传值）：<http://localhost:8888/api/article/details?id=12>

动态路由访问的返回结果示例：

```json
{"result": {"id": 124, "name": "轮播图1", "pic": "https://picsum.photos/200/300", "url": "https://www.baidu.com", "position": 1}}
```

## @server 配置前缀与项目分组

`@server` 语句是对一个服务语句的 meta 信息描述，其特性包含但不限于：jwt 开关、中间件、路由分组、路由前缀。

修改 `shop.api`，为每个服务块配置 `group` 和 `prefix`，路由路径就可以省略公共前缀：

```api
@server (
    group: focus   // 该 service 下的路由生成代码会被放到 focus 目录下
    prefix: /api/focus
)
service shop-api {
    @handler GetOneFocus
    get /details/:id (OneFocusReq) returns (OneFocusResp)

    @handler GetFocusList
    get /list returns (FocusResp)
}

@server (
    group: article // 该 service 下的路由生成代码会被放到 article 目录下
    prefix: /api/article
)
service shop-api {
    @handler GetOneArticle
    get /details (OneArticleReq) returns (OneArticleResp)

    @handler GetArticleList
    get /list returns (ArticleResp)
}
```

重新生成：

```bash
goctl api go --api shop.api --dir .
```

提示：新生成项目后，以前的代码会保留，需要手动删除；如果以前代码中有业务逻辑，需要手动替换到新生成的代码中。

访问路径随之变为：

- <http://localhost:8888/api/focus/list>
- <http://localhost:8888/api/focus/details/124>（动态路由）
- <http://localhost:8888/api/article/list>
- <http://localhost:8888/api/article/details?id=12>

## 编写带有中间件的 api 服务

官方文档：<https://go-zero.dev/docs/tutorials/api/middleware>

### 修改 shop.api

新增用户服务，并通过 `middleware` 声明鉴权中间件。`@server` 中多个中间件以英文逗号分割，如 `Middleware1,Middleware2`，按声明顺序执行：

```api
type (
    GetUserInfoReq {
        Id int64 `form:"id"` // 使用 form tag 表示 x-www-form-urlencoded 数据
    }
    GetUserInfoResp {
        Id   int64  `json:"id"`
        Name string `json:"name"`
        Desc string `json:"desc"`
    }
)

@server (
    group: user
    prefix: /api/user
    middleware: AuthInterceptor
)
service shop-api {
    @handler GetUserInfo
    post /info (GetUserInfoReq) returns (GetUserInfoResp)
}
```

### 生成项目

```bash
goctl api go --api shop.api --dir .
```

### 完善中间件代码

在 `internal/middleware/authinterceptormiddleware.go` 中实现中间件逻辑：

```go
func (m *AuthInterceptorMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			// 认证失败，返回 401 而不是 panic
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("未授权访问"))
			return
		}
		log.Println("认证通过，继续执行...")
		next(w, r)
	}
}
```

### 修改 servicecontext.go

在 `internal/svc/servicecontext.go` 中注册中间件：

```go
package svc

import (
	"apidemo01/internal/config"
	"apidemo01/internal/middleware"

	"github.com/zeromicro/go-zero/rest"
)

type ServiceContext struct {
	Config              config.Config
	UserAgentMiddleware rest.Middleware // 自定义中间件属性
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config:              c,
		UserAgentMiddleware: middleware.NewAuthInterceptorMiddleware().Handle, // 注册中间件
	}
}
```

### 路由中注册中间件

修改 `internal/handler/routes.go`，用 `rest.WithMiddlewares` 把中间件挂到路由上：

```go
func RegisterHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	// ...
	server.AddRoutes(
		rest.WithMiddlewares(
			[]rest.Middleware{serverCtx.UserAgentMiddleware}, // 注册中间件
			[]rest.Route{
				{
					Method:  http.MethodPost,
					Path:    "/info",
					Handler: user.GetUserInfoHandler(serverCtx),
				},
			}...,
		),
		rest.WithPrefix("/api/user"),
	)
}
```

### 修改 getuserinfologic.go

模拟返回数据：

```go
func (l *GetUserInfoLogic) GetUserInfo(req *types.GetUserInfoReq) (resp *types.GetUserInfoResp, err error) {
	return &types.GetUserInfoResp{
		Desc: "用户信息",
		Id:   req.Id,
		Name: "张三",
	}, nil
}
```

### 访问

请求 `POST /api/user/info`，不带 `Authorization` 头时返回 401「未授权访问」；带上该请求头后返回用户信息。

## 编写带有超时配置的 api 服务

在 `@server` 中配置 `timeout: 3s`，表示整个 HTTP 请求处理的超时时间为 3 秒：从请求开始到响应完成的总时间超过 3 秒，服务端会自动断开连接，这包括业务逻辑处理、数据库查询、网络延迟等所有环节。

```api
@server (
    group: focus
    prefix: /api/focus
    timeout: 3s // 配置超时时间 3 秒
)
service shop-api {
    @handler GetOneFocus
    get /details/:id (OneFocusReq) returns (OneFocusResp)

    @handler GetFocusList
    get /list returns (FocusResp)
}
```

生成代码后，可以在 `routes.go` 中看到对应的超时配置：

```go
server.AddRoutes(
    []rest.Route{
        {
            Method:  http.MethodGet,
            Path:    "/details/:id",
            Handler: focus.GetOneFocusHandler(serverCtx),
        },
        {
            Method:  http.MethodGet,
            Path:    "/list",
            Handler: focus.GetFocusListHandler(serverCtx),
        },
    },
    rest.WithPrefix("/api/focus"),
    rest.WithTimeout(3000*time.Millisecond),
)
```

### 测试

在 logic 中人为延时 4 秒，验证 3 秒超时是否生效：

```go
func (l *GetFocusListLogic) GetFocusList() (resp *types.FocusResp, err error) {
	time.Sleep(4 * time.Second) // 延时 4 秒钟
	focusList := []*types.Focus{
		{Id: 1, Name: "轮播图1", Pic: "https://picsum.photos/200/300", Position: 1, Url: "https://www.baidu.com"},
		{Id: 2, Name: "轮播图2", Pic: "https://picsum.photos/200/300", Position: 2, Url: "https://www.baidu.com"},
	}
	return &types.FocusResp{Result: focusList}, nil
}
```

访问 <http://localhost:8888/api/focus/list>，请求会在 3 秒后因超时被断开。

## @doc 语句

`@doc` 语句是对单个路由的 meta 信息描述，一般为 key-value 值，可以传递给 `goctl` 及其插件进行扩展生成。

基本语法：

```api
// 单行 @doc
@doc "foo"

// 有内容的 @doc 组
@doc (
    foo: "bar"
    bar: "baz"
)
```

在路由中使用：

```api
@server (
    group: focus
    prefix: /api/focus
    timeout: 3s
)
service shop-api {
    @doc "获取一个轮播图"
    @handler GetOneFocus
    get /details/:id (OneFocusReq) returns (OneFocusResp)

    @doc "获取轮播图列表"
    @handler GetFocusList
    get /list returns (FocusResp)
}
```

## import 语句

`import` 语句是在 api 中引入其他 api 文件的语法块，支持相对路径和绝对路径。

### 基本语法

```api
// 单行 import
import "foo"
import "/path/to/file"

// import 组
import ()
import (
    "bar"
    "relative/to/file"
)
```

### 使用

先拆分文件：把焦点图相关定义放入 `api/focus.api`，把用户相关定义放入 `api/user.api`。

`api/focus.api`：

```api
syntax = "v1"

type (
    OneFocusReq {
        Id int64 `path:"id"` // 使用 path tag 表示路径参数
    }
    OneFocusResp {
        Result Focus `json:"result"`
    }
    FocusResp {
        Result []*Focus `json:"result"`
    }
    Focus {
        Id       int64  `json:"id"`
        Name     string `json:"name"`
        Pic      string `json:"pic"`
        Url      string `json:"url"`
        Position int64  `json:"position"`
    }
)

@server (
    group: focus
    prefix: /api/focus
    timeout: 3s
)
service shop-api {
    @doc "获取一个轮播图"
    @handler GetOneFocus
    get /details/:id (OneFocusReq) returns (OneFocusResp)

    @doc "获取轮播图列表"
    @handler GetFocusList
    get /list returns (FocusResp)
}
```

`api/user.api`：

```api
syntax = "v1"

type (
    GetUserInfoReq {
        Id int64 `form:"id"` // 使用 form tag 表示 x-www-form-urlencoded 数据
    }
    GetUserInfoResp {
        Id   int64  `json:"id"`
        Name string `json:"name"`
        Desc string `json:"desc"`
    }
)

@server (
    group: user
    prefix: /api/user
    middleware: AuthInterceptor
)
service shop-api {
    @handler GetUserInfo
    post /info (GetUserInfoReq) returns (GetUserInfoResp)
}
```

主文件 `shop.api` 中通过 `import` 引入它们，自身只保留通用响应结构和文章相关路由：

```api
syntax = "v1"

type CommonResponse {
    Message string      `json:"message"`
    Code    int         `json:"code"`
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
}

import "api/focus.api"
import "api/user.api"

type (
    OneArticleReq {
        Id int64 `form:"id"` // Get 传值只保留 form tag
    }
    OneArticleResp {
        Result Article `json:"result"`
    }
    ArticleResp {
        Result []*Article `json:"result"`
    }
    Article {
        Id          int64  `json:"id"`
        Title       string `json:"title"`
        Description string `json:"description"`
        Pic         string `json:"pic"`
        Content     string `json:"content"`
    }
)

@server (
    group: article
    prefix: /api/article
)
service shop-api {
    @handler GetOneArticle
    get /details (OneArticleReq) returns (OneArticleResp)

    @handler GetArticleList
    get /list returns (ArticleResp)
}
```

## 小结

- `service` 描述路由与处理器；`@handler` 指定生成的 Handler 方法名。
- `path` tag 实现动态路由（`/details/:id`），`form` tag 接收 GET query 与表单参数。
- `@server` 统一配置 `group`（代码分组目录）、`prefix`（路由前缀）、`middleware`、`timeout`。
- 中间件需要在 `servicecontext.go` 注册，并在 `routes.go` 用 `rest.WithMiddlewares` 挂载。
- `@doc` 为单个路由附加 meta 信息；`import` 支持把大型 api 文件按业务拆分后组合。
