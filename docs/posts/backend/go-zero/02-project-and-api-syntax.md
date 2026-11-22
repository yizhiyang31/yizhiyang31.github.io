---
title: go-zero 入门：项目创建与 API 语法
author: yizhiyang
date: 2026-11-21
category:
  - 后端
tag:
  - go-zero
  - 学习笔记
---

本文用 `goctl` 从零创建一个 go-zero 项目，梳理生成的目录结构，详解 `goctl api` 常用命令与生成风格，并系统讲解 api 描述语言的请求参数规则与各种 HTTP 方法的写法。

<!-- more -->

## 创建并初始化项目

使用 `goctl api new` 创建一个最小化的 HTTP 服务：

```bash
goctl api new firstdemo
cd firstdemo
go mod tidy
```

## 目录介绍

生成的项目结构如下：

```text
firstdemo/
├── etc/
│   └── firstdemo-api.yaml      # API 服务配置文件
├── firstdemo.api               # API 接口定义文件
├── firstdemo.go                # 程序主入口文件
├── go.mod                      # Go 模块依赖定义
├── go.sum                      # Go 模块依赖校验
└── internal/                   # 项目的核心代码
    ├── config/
    │   └── config.go           # 配置结构体和加载逻辑
    ├── handler/
    │   ├── firstdemohandler.go # 具体接口处理实现
    │   └── routes.go           # 路由注册配置
    ├── logic/
    │   └── firstdemologic.go   # 核心业务逻辑实现
    ├── svc/
    │   └── servicecontext.go   # 依赖注入和服务上下文
    └── types/
        └── types.go            # 请求响应结构体定义
```

各部分的职责：

- `etc/`：存放配置文件。
- `firstdemo.api`：API 定义文件。
- `firstdemo.go`：主程序入口。
- `go.mod` / `go.sum`：Go 模块依赖管理文件。
- `internal/config/`：配置相关；`internal/handler/`：HTTP 处理器；`internal/logic/`：业务逻辑；`internal/svc/`：服务上下文；`internal/types/`：数据类型定义。

## 修改参数并运行项目

在 `internal/logic/firstdemologic.go` 中编写业务逻辑：

```go
func (l *FirstdemoLogic) Firstdemo(req *types.Request) (resp *types.Response, err error) {
	resp = &types.Response{
		Message: "hello " + req.Name,
	}
	return resp, nil
}
```

运行项目：

```bash
go run .\firstdemo.go
```

按文档访问 <http://localhost:8888/from/you>，返回：

```json
{"message":"hello you"}
```

### 修改传参

`goctl api new` 生成的 `firstdemo.api` 默认为路径参数加了 `options` 约束：

```api
syntax = "v1"

type Request {
    Name string `path:"name,options=you|me"`
}

type Response {
    Message string `json:"message"`
}

service firstdemo-api {
    @handler FirstdemoHandler
    get /from/:name (Request) returns (Response)
}
```

`options=you|me` 表示路径参数 `name` 只能接受 `you` 或 `me` 两个值。访问 <http://localhost:8888/from/zhangsan> 会报错：

```text
value "zhangsan" for field "name" is not defined in options "[you me]"
```

如果希望 `name` 可以任意输入，去掉 `options`：

```api
type Request {
    Name string `path:"name"`
}
```

重新生成并运行：

```bash
goctl api go --api firstdemo.api --dir .
```

`--api` 指定 api 文件，`--dir` 指定 Go 文件生成的目录。再次访问 <http://localhost:8888/from/zhangsan>，返回：

```json
{"message":"hello zhangsan"}
```

## goctl api 常用命令详解

查看所有 api 相关命令：

```bash
goctl api --help
```

```text
Generate api related files

Usage:
  goctl api [flags]
  goctl api [command]

Available Commands:
  dart      Generate dart files for provided api in api file
  doc       Generate doc files
  format    Format api files
  go        Generate go files for provided api in api file
  kt        Generate kotlin code for provided api file
  new       Fast create api service
  plugin    Custom file generator
  swagger   Generate swagger file from api
  ts        Generate ts files for provided api in api file
  validate  Validate api file
```

常用命令：

```bash
# 快速创建 API 服务（必须记住）
goctl api new firstdemo

# 格式化 api 文件
goctl api format --dir .

# 为 api 文件生成 Go 代码（必须记住）
goctl api go --api shop.api --dir .

# 生成 doc 文档
goctl api doc --dir . --o ./doc

# 生成 Dart 客户端调用代码
goctl api dart --api shop.api --dir ./dart

# 生成 TypeScript 客户端调用代码
goctl api ts --api shop.api --dir ./ts

# 生成 Swagger 文档
goctl api swagger --api shop.api --dir ./docs --filename shop
```

其中 `goctl api dart` 和 `goctl api ts` 用于根据 api 文件自动生成客户端请求代码，能显著提升前端（如 Flutter 应用）或客户端与 go-zero 后端服务联调的效率。

`goctl api swagger` 为 api 定义文件生成 Swagger 格式的文档。要让 Swagger 加载生成的 `shop.json` 文件，常见方案如下：

| 方法 | 适用场景 | 核心步骤 |
| --- | --- | --- |
| Docker 容器 | 快速启动、环境隔离 | 1. 运行特定 Docker 命令；2. 将 JSON 文件挂载到容器内 |
| Node.js 本地服务 | 本地开发、已有 Node 环境 | 1. 下载 Swagger UI；2. 用 http-server 启动 |
| 集成到现有项目 | 项目已使用特定 Web 框架 | 1. 引入 Swagger UI 库；2. 配置静态文件路由 |

### 生成项目的风格

go-zero 生成项目时默认把所有单词连在一起，可以通过 `--style` 改变命名风格：

| 样式选项 | 命名风格 | 示例文件名 |
| --- | --- | --- |
| `gozero` | 默认风格，全小写并连写 | `getarticlecatehandler.go` |
| `go_zero` | 蛇形命名，使用下划线分隔（推荐） | `get_article_cate_handler.go` |
| `goZero` | 驼峰命名 | `getArticleCateHandler.go` |

```bash
# 默认
goctl api go --api shop.api --dir .

# 生成蛇形命名（推荐，更清晰）
goctl api go --api shop.api --dir . --style=go_zero

# 或者生成驼峰命名
goctl api go --api shop.api --dir . --style=goZero
```

## golang 程序的热加载

所谓热加载，就是当我们修改代码时，程序能够自动重新加载并执行。这在开发中非常便利，可以快速进行代码测试，省去每次手动重新编译的麻烦。

常用工具：

- fresh：<https://github.com/gravityblast/fresh>
- air：<https://github.com/air-verse/air>

```bash
# 使用 fresh
go install github.com/pilu/fresh@latest
fresh

# 使用 air
go install github.com/air-verse/air@latest
air
```

## api 语法概述

api 是 go-zero 自研的领域特性语言（api 描述语言），旨在实现人性化的基础描述语言，作为生成 HTTP 服务最基本的描述语言。

api 语言包含语法版本、info 块、结构体声明、服务描述等几大块语法，其中结构体与 Go 结构体语法几乎一样，只是去掉了 `struct` 关键字。

参考文档：<https://go-zero.dev/docs/tutorials>、<https://go-zero.dev/docs/tasks/dsl/api>

### 请求参数介绍

在 api 描述语言中，可以通过 tag 声明参数接收规则。目前 go-zero 支持的参数接收规则如下：

| 接收规则 | 说明 | 生效范围 | 接收 tag 示例 | 请求示例 |
| --- | --- | --- | --- | --- |
| `json` | json 序列化 | 请求体 & 响应体 | `json:"foo"` | `{"key":"value"}` |
| `path` | 路由参数 | 请求体 | `path:"id"` | `/foo/:id` |
| `form` | post 请求的表单（支持 content-type 为 form-data 和 x-www-form-urlencoded）参数接收标识；也是 get 请求的 query 参数接收标识 | 请求体 | `form:"name"` | `GET /search?key=value` |
| `header` | http 请求头接收标识 | 请求体 | `header:"Content-Length"` | `origin: https://go-zero.dev` |

### 可空参数

- `omitempty`：表示可空参数，返回的字段可以不设置，如 `json:"articles,omitempty"`。
- `optional`：表示接收数据时可以为空。

```go
type CommonResponse {
    Message string      `json:"message"`
    Code    int         `json:"code"`
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
}

type UpdateFocusRequest {
    Id       int    `form:"id"`
    Title    string `form:"title,optional"`
    Pic      string `form:"pic,optional"`
    Link     string `form:"link,optional"`
    Position int    `form:"position,optional"`
}
```

### GET 请求（form 参数）

GET 请求用 `form` tag 接收 query 参数：

```api
syntax = "v1"

type CommonResponse {
    Message string      `json:"message"`
    Code    int         `json:"code"`
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
}

type (
    FocusRequest {
        Id int64 `form:"id"` // Get 传值
    }

    Focus {
        Id   int64  `json:"id"`
        Name string `json:"name"`
        Pic  string `json:"pic"`
        Url  string `json:"url"`
    }
)

service shop-api {
    @handler GetFocusList
    get /api/focus (FocusRequest) returns (CommonResponse)
}
```

生成代码并请求：

```bash
goctl api go --api shop.api --dir .
```

```text
http://localhost:8888/api/focus?id=20
```

### POST 请求

在 GET 的基础上增加 `AddFocusRequest`，声明 `post` 路由：

```api
type (
    FocusRequest {
        Id int64 `form:"id"` // Get 传值
    }

    AddFocusRequest {
        Name string `form:"name"` // 接收 post 请求
        Pic  string `form:"pic"`
        Url  string `form:"url"`
    }

    Focus {
        Id   int64  `json:"id"`
        Name string `json:"name"`
        Pic  string `json:"pic"`
        Url  string `json:"url"`
    }
)

service shop-api {
    @handler GetFocusList
    get /api/focus (FocusRequest) returns (CommonResponse)

    @handler AddFocus
    post /api/focus/add (AddFocusRequest) returns (CommonResponse)
}
```

### PUT 请求

增加 `EditFocusRequest`，声明 `put` 路由：

```api
type EditFocusRequest {
    Id   int64  `form:"id"`
    Name string `form:"name"`
    Pic  string `form:"pic"`
    Url  string `form:"url"`
}

service shop-api {
    @handler GetFocusList
    get /api/focus (FocusRequest) returns (CommonResponse)

    @handler AddFocus
    post /api/focus/add (AddFocusRequest) returns (CommonResponse)

    @handler EditFocus
    put /api/focus/edit (EditFocusRequest) returns (CommonResponse)
}
```

### DELETE 请求

声明 `delete` 路由，复用 `FocusRequest`：

```api
service shop-api {
    @handler GetFocusList
    get /api/focus (FocusRequest) returns (CommonResponse)

    @handler AddFocus
    post /api/focus/add (AddFocusRequest) returns (CommonResponse)

    @handler EditFocus
    put /api/focus/edit (EditFocusRequest) returns (CommonResponse)

    @handler DeleteFocus
    delete /api/focus/delete (FocusRequest) returns (CommonResponse)
}
```

每次修改后都重新生成：

```bash
goctl api go --api shop.api --dir .
```

### path 参数 / 动态路由

对于文章详情这类路由，用 `path` tag 接收动态路由参数：

```api
type (
    ArticleRequest {
        Id int64 `path:"id"` // 动态路由
    }

    Article {
        Id       int64  `json:"id"`
        Title    string `json:"title"`
        Content  string `json:"content"`
        CreateAt int64  `json:"create_at"`
    }
)

service shop-api {
    @handler GetOneArticle
    get /api/article/:id (ArticleRequest) returns (CommonResponse)
}
```

访问 <http://localhost:8888/api/article/212> 即可获取 id 为 212 的文章。

### 参数默认值与参数枚举值

- `default=18`：参数默认值。
- `options=1|2`：参数枚举值，参数只能取列举的值。

```api
type (
    AddUserRequest {
        Id   int64  `form:"id"`
        Name string `form:"name"`
        Age  int64  `form:"age,default=18"`  // 参数默认值
        Sex  int64  `form:"sex,options=1|2"` // 参数枚举值
    }

    User {
        Id   int64  `json:"id"`
        Name string `json:"name"`
        Age  int64  `json:"age"`
        Sex  int64  `json:"sex"`
    }
)

service shop-api {
    @handler AddUser
    post /api/user/add (AddUserRequest) returns (CommonResponse)
}
```

对应的业务逻辑：

```go
func (l *AddUserLogic) AddUser(req *types.AddUserRequest) (resp *types.CommonResponse, err error) {
	// 获取参数
	logx.Info("添加用户：", req.Name)
	return &types.CommonResponse{
		Code:    200,
		Message: "添加用户成功",
		Data: types.User{
			Id:   req.Id,
			Name: req.Name,
			Age:  req.Age,
			Sex:  req.Sex,
		},
	}, nil
}
```

## 小结

- `goctl api new` 创建最小工程，`goctl api go --api xxx.api --dir .` 生成代码；`--style` 控制命名风格。
- `goctl api` 还支持 format、doc、dart、ts、swagger 等子命令，覆盖文档生成与客户端联调。
- api 语法中，`json`/`path`/`form`/`header` 四类 tag 决定参数来源；`omitempty` 控制返回字段可空，`optional` 控制接收数据可空。
- `default` 设置默认值，`options` 限制枚举取值；`get /xxx/:id` 配合 `path` tag 实现动态路由。
- 开发阶段可用 fresh 或 air 实现代码热加载。
