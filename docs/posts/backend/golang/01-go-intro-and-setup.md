---
title: Go 语言基础：Go 语言介绍与环境搭建
author: yizhiyang
date: 2026-10-29
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

Go（又称 Golang）是 Google 于 2009 年 11 月正式对外公开的编程语言。本文涵盖语言特点、典型项目，以及 Windows / Mac 下的环境搭建与 VSCode 配置。

<!-- more -->

## Go 语言是什么

一个直观的概括是：`Go = C + Python`，既有 C 语言级别的运行速度，又具备 Python 般的开发效率。它同时拥有静态编译语言的安全与高性能，以及动态语言的开发速度和易维护性。

典型应用场景包括 Web 开发、区块链、大型游戏服务端、分布式与云计算。著名的项目有：

- **nsq**：bitly 开源的高性能消息队列，每天处理数十亿条消息
- **docker**：基于 LXC 的虚拟打包工具
- **packer**：跨平台镜像生成工具
- **skynet**：分布式调度框架
- **groupcache**：memcached 作者编写的分布式缓存系统
- **Kubernetes**：Google 开源的容器编排系统

国内 B 站以及阿里、京东、百度、腾讯、小米、360 等公司的很多项目也在使用 Go。

## 安装 Go

无论 Windows 还是 Mac，安装步骤基本一致：

1. 下载安装包：
   - 官网：<https://go.dev/dl/>
   - 国内镜像（推荐）：<https://golang.google.cn/dl/>
2. 双击安装包，一路下一步。
3. 验证安装：

```bash
go version    # 查看 Go 版本
go env        # 查看 Go 环境配置
```

关于 `GOPATH`：Go 1.11 之后无需手动配置环境变量，使用 `go mod` 管理项目，也不必把项目放在 `GOPATH` 指定目录下，可以在磁盘任意位置新建项目；Go 1.13 之后可以彻底不依赖 `GOPATH`。

## 配置 VSCode

1. 下载安装 VSCode：<https://code.visualstudio.com/>
2. 安装中文语言包完成汉化。
3. 在扩展市场搜索并安装 **Go** 插件。

### 插件安装失败的常见处理

常见的处理办法有三个：

- 配置代理后重试：

  ```bash
  go env -w GOPROXY=https://goproxy.io/
  ```

- 用手机开热点，电脑连接后重新打开 VSCode 下载插件。
- 多试几次（网络波动导致失败很常见）。

> 现在更常用的代理是 `https://goproxy.cn`，同样通过 `go env -w GOPROXY=https://goproxy.cn,direct` 设置。

## 小结

Go 的设计目标是用简洁的语法换取高效的开发体验，同时保持编译型语言的性能。环境搭建的重点只有两步：安装 Go 并用 `go version` 验证，安装 VSCode 的 Go 插件并配好模块代理。下一步就可以开始写第一个变量声明了。

