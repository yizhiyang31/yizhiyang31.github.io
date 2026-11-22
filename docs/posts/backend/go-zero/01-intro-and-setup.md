---
title: go-zero 入门：框架介绍与环境安装
author: yizhiyang
date: 2026-11-21
category:
  - 后端
tag:
  - go-zero
  - 学习笔记
---

本文是 go-zero 系列的第一篇，介绍 go-zero 的定位与特点，并将其与 Gin 框架做对比，最后完成 Go、goctl、protoc 及编辑器插件的安装配置。

<!-- more -->

## go-zero 介绍

官网：<https://go-zero.dev/>

go-zero 是一个集成了各种工程实践的 web 和 rpc 框架。通俗地讲，go-zero 既是一个 web 框架，又是一个微服务框架。

go-zero 提供了极简的 API 定义和强大的代码生成工具 `goctl`，可以大幅提升开发效率。定义好 API 后，通过 `goctl` 就可以快速生成工程代码。

go-zero 中还内置了丰富的微服务治理能力，如限流、熔断、降载、服务发现、负载均衡、链路追踪等，无需额外配置和代码即可使用。

## go-zero 和 Gin 对比

| 对比维度 | go-zero | Gin |
| --- | --- | --- |
| 核心定位 | 面向微服务的全栈式框架 | 轻量级 Web 框架、高性能、简洁易用 |
| 核心用途 | 构建高性能 API 接口与微服务 | 构建高性能 Web 应用（API 和传统页面） |
| 设计哲学 | "工具大于约定"、工程化、标准化 | 灵活简洁、高性能路由 |
| 治理能力 | 内置（限流、熔断、服务发现等） | 依赖中间件（需集成第三方） |
| 开发效率 | 高（提供 goctl 工具链生成代码） | 中（灵活但需手动完成更多工作） |
| 协议支持 | 同时支持 HTTP 和 RPC（gRPC） | 主要支持 HTTP/HTTPS |
| 适用场景 | 构建 API 和大型复杂的微服务项目 | 快速构建 API 或构建需要模板渲染的 Web 应用 |
| 发布日期 | 2020 年 8 月 | 2014 年 |

## go-zero 特点

1. 轻松获得支撑千万日活服务的稳定性：内建级联超时控制、限流、自适应熔断、自适应降载等微服务治理能力，无需配置和额外代码；微服务治理中间件可无缝集成到其它现有框架使用；极简的 API 描述，一键生成各端代码，自动校验客户端请求参数合法性，并提供大量微服务治理和并发工具包。

2. 强大的工具支持：尽可能少的代码编写，极简的接口，完全兼容 `net/http`，支持中间件，方便扩展，高性能，面向故障编程，弹性设计。内建服务发现、负载均衡、限流、熔断、降载，且自动触发、自动恢复；支持 API 参数自动校验、超时级联控制、自动缓存控制、链路跟踪、统计报警等，稳定保障了疫情期间每天的流量洪峰。

简单概括：**go-zero 以工具链驱动开发，用极简的 API 描述一键生成代码；同时内建完整的微服务治理能力，无需额外配置即可获得高并发下的稳定性。**

## 快速构建演示概览

go-zero 的开发流程可以概括为：先用 api（或 proto）文件描述服务，再用 `goctl` 一键生成工程代码，最后在生成的 logic 文件中编写业务逻辑。

### Web API 应用演示

先定义 `shop.api`，声明焦点图和文章的数据结构与服务路由：

```api
syntax = "v1"

type (
    // 焦点图列表响应
    FocusResp {
        Result []*Focus `json:"result"`
    }

    // 焦点图数据结构
    Focus {
        Id       int64  `json:"id"`
        Name     string `json:"name"`
        Pic      string `json:"pic"`
        Url      string `json:"url"`
        Position int64  `json:"position"`
    }
)

type (
    // 文章列表响应
    ArticleResp {
        Result []*Article `json:"result"`
    }

    // 文章数据结构
    Article {
        Id          int64  `json:"id"`
        Title       string `json:"title"`
        Description string `json:"description"`
        Pic         string `json:"pic"`
        Content     string `json:"content"`
    }
)

@server (
    group: focus
    prefix: /api/focus
)
service shop-api {
    @handler GetFocusList
    get /list returns (FocusResp)
}

@server (
    group: article
    prefix: /api/article
)
service shop-api {
    @handler GetArticleList
    get /list returns (ArticleResp)
}
```

然后一行命令生成整个工程：

```bash
goctl api go --api shop.api --dir .
```

`goctl` 会自动生成路由配置、Handler 处理函数、Logic 业务逻辑层、main 入口文件、配置文件和中间件等基础设施。后续只需在生成的 logic 文件中补充业务逻辑即可。这套流程会在后面的「项目创建与 API 语法」「API 实战」两篇中详细展开。

### 微服务演示概览

微服务侧则先定义 `greet.proto`，再用 `goctl rpc protoc` 生成 gRPC 服务端代码，编写 Ping 逻辑后改直连配置即可启动；客户端通过生成的 `NewGreetClient` 发起调用。这一部分的完整步骤将在「gRPC 微服务快速上手」一篇中详细讲解。

## 安装

### 安装 Go

go-zero 基于 Go 开发，使用前需要先安装 Go，下载地址：<https://go.dev/dl/>，建议安装最新版本。

安装完成后查看版本验证：

```bash
go version
```

### 配置 Go 的代理 Proxy

默认的 Go 代理 `proxy.golang.org` 在国内访问较慢或不稳定，使用国内镜像可以大幅提升下载速度：

```bash
go env -w GOPROXY=https://goproxy.cn,direct
```

查看配置是否生效：

```bash
go env GOPROXY
# https://goproxy.cn,direct
```

### 安装 goctl

`goctl` 是 go-zero 的内置脚手架，是提升开发效率的一大利器，可以一键生成代码、文档、部署 k8s yaml、Dockerfile 等。

安装：

```bash
go install github.com/zeromicro/go-zero/tools/goctl@latest
```

验证：

```bash
goctl --version
```

### 安装 protoc

`protoc` 是一个用于生成代码的工具，它可以根据 proto 文件生成 C++、Java、Python、Go、PHP 等多种语言的代码。而 gRPC 的代码生成还依赖 `protoc-gen-go`、`protoc-gen-go-grpc` 插件来配合生成 Go 语言的 gRPC 代码。

通过 `goctl` 可以一键安装 `protoc`、`protoc-gen-go`、`protoc-gen-go-grpc` 相关组件：

```bash
goctl env check --install --verbose --force
```

验证：

```bash
goctl env
```

可能遇到的错误：安装过程中如果因为网络问题无法访问 GitHub 而失败，需要保证本地可以访问 GitHub（科学上网，或联系客服解决）。成功后即可正常执行 `goctl env`。

### 配置 IDE 插件

#### VS Code

`goctl` VS Code 编辑器插件具有 api 文件语法高亮、跳转到定义/引用、代码格式化、代码块提示等功能，可在扩展市场搜索 `goctl` 安装。

#### IntelliJ

`goctl-intellij` 是 go-zero api 描述语言的 IntelliJ 编辑器插件，支持 api 描述语言高亮、语法检测、快速提示、创建模板等特性。

## 小结

- go-zero 是集 web 框架与微服务框架于一体的全栈式框架，主打「工具大于约定」。
- 相比 Gin，go-zero 内建限流、熔断、服务发现等治理能力，并通过 `goctl` 大幅提升开发效率。
- 开发流程：定义 api/proto 文件 → `goctl` 生成代码 → 编写业务逻辑。
- 环境安装：Go + 国内代理 + `goctl` + `protoc`（可用 `goctl env check --install` 一键安装）+ 编辑器插件。
