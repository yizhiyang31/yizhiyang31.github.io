---
title: go-zero 入门：gRPC 微服务快速上手
author: yizhiyang
date: 2026-11-22
category:
  - 后端
tag:
  - go-zero
  - 学习笔记
---

本文用一个完整的 Greet 示例演示 go-zero 微服务的开发流程：从 proto 文件生成 gRPC 服务端，编写 Ping 逻辑，改用直连模式启动服务，最后创建客户端完成远程调用。

<!-- more -->

## 微服务 Server 端

### 生成 proto 文件

用 `goctl` 快速生成一个 proto 模板：

```bash
goctl rpc -o greet.proto
```

按业务修改生成的文件：

```protobuf
// 语法版本
syntax = "proto3";

// 包定义，对 Go 无效
package greet;

// 生成 Go 文件的包名
option go_package = "./greet";

// 消息体：需要传输的数据结构
message Request {
  string ping = 1;
}

// 消息体：需要传输的数据结构
message Response {
  string pong = 1;
}

// 服务名称以及服务定义
service Greet {
  rpc Ping(Request) returns (Response);
}
```

### 生成 gRPC 服务端

通过下面的命令生成服务端代码：

```bash
goctl rpc protoc greet.proto --go_out=./grpc-server --go-grpc_out=./grpc-server --zrpc_out=./grpc-server
```

各输出目录参数的含义：

- `go_out`：proto 生成的 Go 代码所在的目录，是 proto 本身的命令参数。
- `go-grpc_out`：proto 生成的 gRPC 代码所在的目录，是 proto 本身的命令参数，和 `go_out` 必须是同一个目录。
- `zrpc_out`：`goctl rpc` 自带的命令参数，go-zero 生成的代码所在的目录。

### 拉取依赖

```bash
cd grpc-server
go mod tidy
```

### 编写代码逻辑

在 `internal/logic/pinglogic.go` 中编写业务逻辑：

```go
func (l *PingLogic) Ping(in *greet.Request) (*greet.Response, error) {
	return &greet.Response{
		Pong: "pong",
	}, nil
}
```

### 修改配置文件，去掉 etcd 配置，采用直连模式

打开 `etc/greet.yaml`，把 etcd 相关配置注释掉，客户端即可通过 `ListenOn` 地址直连：

```yaml
Name: greet.rpc
ListenOn: 0.0.0.0:8080
#Etcd:
#  Hosts:
#  - 127.0.0.1:2379
#  Key: greet.rpc
```

### 启动服务

在 `grpc-server` 目录下运行：

```bash
go run .
```

服务监听在 `0.0.0.0:8080`。

## 微服务客户端

### 新建项目 grpc-client

新建项目目录并创建文件 `client.go`：

```go
package main

import (
	"context"
	"grpc-client/greet"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	conn, err := grpc.NewClient("127.0.0.1:8080", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal(err)
	}

	client := greet.NewGreetClient(conn)
	resp, err := client.Ping(context.Background(), &greet.Request{Ping: "ping"})
	if err != nil {
		log.Fatal(err)
		return
	}
	log.Println(resp)
}
```

### 初始化项目

```bash
go mod init grpc-client
go mod tidy
```

### 运行项目调用微服务服务端

```bash
go run client.go
```

输出服务端返回的响应：

```text
pong:"this is server pong"
```

## 小结

- `goctl rpc -o greet.proto` 生成 proto 模板；`goctl rpc protoc ... --go_out --go-grpc_out --zrpc_out` 生成 gRPC 服务端代码。
- 服务端的业务逻辑写在 `internal/logic/pinglogic.go`。
- 去掉 `etc/greet.yaml` 中的 etcd 配置即可改为直连模式，客户端通过 `NewGreetClient` + `Ping` 发起调用。
- `go-grpc_out` 与 `go_out` 必须指向同一个目录。
