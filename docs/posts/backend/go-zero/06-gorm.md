---
title: go-zero 入门：集成 GORM
author: yizhiyang
date: 2026-11-22
category:
  - 后端
tag:
  - go-zero
  - 学习笔记
---

本文讲解在 go-zero 中集成 GORM：创建模型与数据库连接、在服务上下文中注入 `*gorm.DB`，完成基础 CURD，并系统整理 Where、Or、排序分页、Count、Distinct、Scan、Join 及原生 SQL 的用法。

<!-- more -->

## 介绍

GORM 是 Go 语言的一个对象关系映射库，全称 Go Object Relational Mapping。它可以让你用操作 Go 结构体和对象的方式与关系型数据库（如 MySQL、PostgreSQL、SQLite 等）交互，而无需编写复杂的 SQL 语句。

核心思想：将数据库中的"表"映射为 Go 程序中的"结构体"，将表中"行"映射为结构体的"实例"，将表中"列"映射为结构体的"字段"。ORM 就是通过实例对象的语法完成关系型数据库操作的技术，是"对象-关系映射"（Object/Relational Mapping）的缩写。

官方文档：<https://gorm.io/zh_CN/docs/index.html>

GORM 官方支持的数据库类型有：MySQL、PostgreSQL、SQLite、SQL Server。

GORM 特性：

- 全功能 ORM。
- 关联（Has One、Has Many、Belongs To、Many To Many、多态、单表继承）。
- Create、Save、Update、Delete、Find 中的钩子方法。
- 支持 Preload、Joins 的预加载。
- 事务、嵌套事务、Save Point、Rollback To Saved Point。
- Context、预编译模式、DryRun 模式。
- 批量插入、FindInBatches、Find/Create with Map，使用 SQL 表达式、Context Valuer 进行 CRUD。
- SQL 构建器、Upsert、数据库锁、Optimizer/Index/Comment Hint、命名参数、子查询。
- 复合主键、索引、约束。
- Auto Migration。
- 自定义 Logger。
- 灵活的可扩展插件 API：Database Resolver（多数据库、读写分离）、Prometheus 等。

## 新建项目

沿用前面章节的 `shop.api`（统一响应结构 + 焦点图/文章数据结构 + `@server` 分组路由），生成项目：

```bash
goctl api go --api shop.api --dir .
```

## 集成 GORM

### 安装依赖

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
go mod tidy
```

### 创建数据库模型

`model/gorm/focus.go`：

```go
package gorm

import "time"

type Focus struct {
	ID        int64
	Title     string
	Pic       string
	Url       string
	Position  int64
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (Focus) TableName() string {
	return "focus"
}
```

`model/gorm/article.go`：

```go
package gorm

import "time"

type Article struct {
	ID          int64
	Title       string
	Description string
	Pic         string
	Content     string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (Article) TableName() string {
	return "article"
}
```

### 配置数据库连接

`etc/zerogorm-api.yaml`：

```yaml
MySQL:
  DataSource: root:123456@tcp(192.168.1.10:3306)/gozerogorm?charset=utf8mb4&parseTime=true&loc=Local
```

`internal/config/config.go`：

```go
package config

import "github.com/zeromicro/go-zero/rest"

type Config struct {
	rest.RestConf
	// MySQL 配置
	MySQL struct {
		DataSource string
	}
}
```

### 创建服务上下文

`internal/svc/servicecontext.go`：

```go
package svc

import (
	"apigorm/internal/config"
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type ServiceContext struct {
	Config config.Config
	DB     *gorm.DB
}

func NewServiceContext(c config.Config) *ServiceContext {
	// 创建数据库连接
	dbClient, err := gorm.Open(mysql.Open(c.MySQL.DataSource), &gorm.Config{})
	if err != nil {
		fmt.Errorf("数据库连接失败: %w", err)
	}
	return &ServiceContext{
		Config: c,
		DB:     dbClient,
	}
}
```

## CURD

参考文档：<https://gorm.io/zh_CN/docs/query.html>

### 查询一条数据

```go
func (l *GetOneFocusLogic) GetOneFocus(req *types.OneFocusReq) (resp *types.OneFocusResp, err error) {
	focus := gorm.Focus{}
	l.svcCtx.DB.Where("id=?", req.Id).Find(&focus)
	// 返回数据
	return &types.OneFocusResp{
		Result: types.Focus{
			Id:       focus.ID,
			Name:     focus.Title,
			Pic:      focus.Pic,
			Url:      focus.Url,
			Position: focus.Position,
		},
	}, nil
}
```

访问 <http://localhost:8888/api/focus/details/1>，返回示例：

```json
{"result": {"id": 2, "name": "产品推广", "pic": "/images/banner2.jpg", "url": "/product/1", "position": 2}}
```

### 查询多条数据

```go
func (l *GetFocusListLogic) GetFocusList() (resp *types.FocusResp, err error) {
	focus := []gorm.Focus{}
	l.svcCtx.DB.Find(&focus)
	// for 循环把 gorm.Focus 数组转换成 *types.Focus 数组
	var focusList []*types.Focus
	for _, v := range focus {
		focusList = append(focusList, &types.Focus{
			Id:       v.ID,
			Name:     v.Title,
			Pic:      v.Pic,
			Position: v.Position,
			Url:      v.Url,
		})
	}
	// 返回数据
	return &types.FocusResp{Result: focusList}, nil
}
```

访问 <http://localhost:8888/api/focus/list> 即可获取全部焦点图。

### 增加数据

参考文档：<https://gorm.io/zh_CN/docs/create.html>

```go
func (l *AddFocusLogic) AddFocus(req *types.AddFocusReq) (resp *types.CommonResponse, err error) {
	focus := gorm.Focus{
		Title:     req.Name,
		Pic:       req.Pic,
		Url:       req.Url,
		Position:  req.Position,
		CreatedAt: time.Now(),
	}
	result := l.svcCtx.DB.Create(&focus)
	if result.Error != nil {
		logx.Errorf("添加焦点图失败: %v", result.Error)
		return &types.CommonResponse{Code: 500, Message: "系统错误，添加失败", Success: false}, result.Error
	}
	// 记录成功日志
	logx.Infof("焦点图添加成功，ID: %d", focus.ID)
	return &types.CommonResponse{Code: 0, Message: "添加成功", Success: true}, nil
}
```

### 修改数据

参考文档：<https://gorm.io/zh_CN/docs/update.html>

```go
func (l *UpdateFocusLogic) UpdateFocus(req *types.UpdateFocusReq) (resp *types.CommonResponse, err error) {
	focus := gorm.Focus{
		ID:        req.Id,
		Title:     req.Name,
		Pic:       req.Pic,
		Url:       req.Url,
		Position:  req.Position,
		CreatedAt: time.Now(),
	}
	result := l.svcCtx.DB.Save(&focus)
	if result.Error != nil {
		logx.Errorf("修改焦点图失败: %v", result.Error)
		return &types.CommonResponse{Code: 500, Message: "系统错误，添加失败", Success: false}, result.Error
	}
	// 记录成功日志
	logx.Infof("焦点修改加成功，ID: %d", focus.ID)
	return &types.CommonResponse{Code: 0, Message: "修改成功", Success: true}, nil
}
```

### 删除数据

更多删除方法参考：<https://gorm.io/zh_CN/docs/delete.html>

```go
func (l *DeleteFocusLogic) DeleteFocus(req *types.OneFocusReq) (resp *types.CommonResponse, err error) {
	focus := gorm.Focus{
		ID: req.Id,
	}
	result := l.svcCtx.DB.Delete(&focus)
	if result.Error != nil {
		logx.Errorf("删除失败: %v", result.Error)
		return &types.CommonResponse{Message: "删除失败", Code: 500, Success: false}, nil
	}
	logx.Infof("删除成功: %v", focus)
	return &types.CommonResponse{Message: "删除成功", Code: 200, Success: true}, nil
}
```

## GORM 查询语句

参考文档：<https://gorm.io/zh_CN/docs/query.html>

### Where 条件查询

Where 支持的条件运算符包括：`=`、`<`、`>`、`<=`、`>=`、`!=`、`IS NOT NULL`、`IS NULL`、`BETWEEN AND`、`NOT BETWEEN AND`、`IN`、`OR`、`AND`、`NOT`、`LIKE`。

```go
// 基本比较
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id < 3").Find(&focus)

// 带参数查询
var n = 5
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id > ?", n).Find(&focus)

// 多条件查询
var n1 = 3
var n2 = 9
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id > ? AND id < ?", n1, n2).Find(&focus)

// IN 查询
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id in (?)", []int{3, 5, 6}).Find(&focus)

// LIKE 查询
focus := []gorm.Focus{}
l.svcCtx.DB.Where("title like ?", "%轮播%").Find(&focus)

// BETWEEN 查询
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id between ? and ?", 3, 6).Find(&focus)
```

### Or 条件

```go
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id = ? OR id = ?", 2, 3).Find(&focus)

// 或者使用 Or 方法
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id = ?", 2).Or("id = ?", 3).Or("id = 4").Find(&focus)
```

### 选择字段查询

```go
focus := []gorm.Focus{}
l.svcCtx.DB.Select("id, title, url").Find(&focus)
```

### 排序、Limit、Offset

```go
// 排序
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id > 2").Order("id Asc").Find(&focus)

// 多重排序
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id > 2").Order("sort Desc").Order("id Asc").Find(&focus)

// Limit 限制
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id > 1").Limit(2).Find(&focus)

// Offset 和 Limit
focus := []gorm.Focus{}
l.svcCtx.DB.Where("id > 1").Offset(2).Limit(2).Find(&focus)
```

### 获取总数

```go
focus := []gorm.Focus{}
var num int64
l.svcCtx.DB.Where("id > ?", 2).Find(&focus).Count(&num)
```

### Distinct 去重

```go
focus := []gorm.Focus{}
l.svcCtx.DB.Distinct("title").Order("id desc").Find(&focus)
```

### Scan 扫描结果

```go
var focus []gorm.Focus
l.svcCtx.DB.Raw("SELECT * FROM focus").Scan(&focus)
fmt.Println(focus)
```

### Join 连接查询

```go
type result struct {
	Name  string
	Email string
}
db.Model(&User{}).
	Select("users.name, emails.email").
	Joins("left join emails on emails.user_id = users.id").
	Scan(&result{})

// SELECT users.name, emails.email FROM `users` left join emails on emails.user_id = users.id
```

## 原生 SQL 和 SQL 生成器

参考文档：<https://gorm.io/zh_CN/docs/sql_builder.html>

- `Raw`：用于查询，期望数据库返回一些数据行（例如 SELECT 语句）。
- `Exec`：用于执行，期望数据库执行一个操作但不返回数据行，只返回影响的信息（例如 INSERT、UPDATE、DELETE 语句）。

### 使用原生 sql Exec 删除 focus 表中的一条数据

```go
result := l.svcCtx.DB.Exec("delete from focus where id=?", 4)
fmt.Println(result.RowsAffected)
```

### 使用原生 sql Exec 修改 focus 表中的一条数据

```go
result := l.svcCtx.DB.Exec("update focus set title=? where id=2", "golang教程推广")
fmt.Println(result.RowsAffected)
```

### Raw 查询指定 id 的数据

```go
var focus []gorm.Focus
l.svcCtx.DB.Raw("SELECT * FROM focus WHERE id = ?", 1).Scan(&focus)
```

### Raw 查询 focus 表中所有的数据

```go
var focus []gorm.Focus
l.svcCtx.DB.Raw("SELECT * FROM focus").Scan(&focus)
```

### 统计 focus 表的数量

```go
var count int
row := l.svcCtx.DB.Raw("SELECT count(1) FROM focus").Row()
row.Scan(&count)
```

## 小结

- GORM 把表映射为结构体、行映射为实例、列映射为字段；用 `gorm.Open` 创建连接并注入 `ServiceContext.DB`。
- CURD 分别用 `Find`、`Create`、`Save`、`Delete`，并通过 `result.Error` 判断结果。
- 查询构造：`Where`/`Or`、`Select`、`Order`、`Limit`/`Offset`、`Count`、`Distinct`、`Scan`、`Joins`。
- 原生 SQL 中，`Raw` 配合 `Scan` 做查询，`Exec` 执行增删改并通过 `RowsAffected` 获取影响行数。
