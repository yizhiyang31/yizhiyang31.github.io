---
title: Gin 框架：GORM 操作 MySQL
author: yizhiyang
date: 2026-11-18
category:
  - 后端
tag:
  - Gin
  - 学习笔记
---

本文讲解在 Gin 中使用 GORM 操作 MySQL，包括 GORM 介绍与安装、连接数据库、模型定义、CURD、查询语句详解、查看执行 SQL，以及原生 SQL 与 SQL 生成器的用法。

<!-- more -->

## GORM 介绍

GORM 是 Go 语言的一个 ORM 框架。ORM 即"对象-关系映射"（Object/Relational Mapping），指通过实例对象的语法完成关系型数据库操作的技術，使用 ORM 框架可以更方便地操作数据库。

GORM 官方支持的数据库类型有：MySQL、PostgreSQL、SQLite、SQL Server。

GORM 的主要特性包括：

- 全功能 ORM
- 关联（Has One、Has Many、Belongs To、Many To Many、多态、单表继承）
- Create、Save、Update、Delete、Find 中的钩子方法
- 支持 Preload、Joins 的预加载
- 事务、嵌套事务、Save Point、Rollback To Saved Point
- Context、预编译模式、DryRun 模式
- 批量插入、FindInBatches、Find/Create with Map、使用 SQL 表达式与 Context Valuer 进行 CRUD
- SQL 构建器、Upsert、数据库锁、Optimizer/Index/Comment Hint、命名参数、子查询
- 复合主键、索引、约束
- Auto Migration
- 自定义 Logger
- 灵活可扩展的插件 API：Database Resolver（多数据库、读写分离）、Prometheus 等
- 开发者友好

官方文档：<https://gorm.io/zh_CN/docs/index.html>

## 安装与连接数据库

如果使用 go mod 管理项目，可以跳过 `go get` 步骤：

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
```

在 `models` 下新建 `core.go` 建立数据库连接：

```go
package models

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB
var err error

func init() {
	dsn := "root:123456@tcp(192.168.0.6:3306)/gin?charset=utf8mb4&parseTime=True&loc=Local"
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println(err)
	}
}
```

## 定义模型

虽然 GORM 可以指定字段类型并自动生成数据表，但实际项目开发中通常是先设计数据库表，再去实现编码。定义模型时注意：

1. 结构体名称首字母必须大写，并与数据库表名对应。例如表 `user` 对应结构体 `User`，表 `article_cate` 对应结构体 `ArticleCate`。
2. 结构体字段首字母必须大写，并与表中字段一一对应。例如 `Id` 对应 `id`、`Username` 对应 `username`、`AddTime` 对应 `add_time`。
3. 默认表名是结构体名称的复数形式，例如 `User` 默认操作 `users` 表。
4. 可以用 `TableName` 方法改变默认表名。

定义 user 模型：

```go
package models

type User struct {
	// 默认表名是 `users`
	Id       int
	Username string
	Age      int
	Email    string
	AddTime  int
}

func (User) TableName() string {
	return "user"
}
```

更多模型定义方法参考：<https://gorm.io/zh_CN/docs/conventions.html>

GORM 还定义了 `gorm.Model` 结构体，包含 `ID`、`CreatedAt`、`UpdatedAt`、`DeletedAt` 字段：

```go
type Model struct {
	ID        uint           `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
```

## CURD

找到要操作数据库表的控制器，引入 `models` 模块后即可进行增删改查。

### 增加

增加成功后会返回刚才增加的记录：

```go
func (con UserController) Add(c *gin.Context) {
	user := models.User{
		Username: "itying.com",
		Age:      18,
		Email:    "itying@qq.com",
		AddTime:  int(time.Now().Unix()),
	}
	// 通过数据的指针来创建
	result := models.DB.Create(&user)
	if result.RowsAffected > 1 {
		fmt.Print(user.Id)
	}
	fmt.Println(result.RowsAffected)
	fmt.Println(user.Id)
	c.String(http.StatusOK, "add 成功")
}
```

更多增加语句：<https://gorm.io/zh_CN/docs/create.html>

### 查找

查找全部：

```go
func (con UserController) Index(c *gin.Context) {
	user := []models.User{}
	models.DB.Find(&user)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"result":  user,
	})
}
```

指定条件查找：

```go
func (con UserController) Index(c *gin.Context) {
	user := []models.User{}
	models.DB.Where("username=?", "王五").Find(&user)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"result":  user,
	})
}
```

更多查询语句：<https://gorm.io/zh_CN/docs/query.html>

### 修改

```go
func (con UserController) Edit(c *gin.Context) {
	user := models.User{Id: 7}
	models.DB.Find(&user)
	user.Username = "gin gorm"
	user.Age = 1
	models.DB.Save(&user)
	c.String(http.StatusOK, "Edit")
}
```

更多修改方法：<https://gorm.io/zh_CN/docs/update.html>

### 删除

```go
func (con UserController) Delete(c *gin.Context) {
	user := models.User{Id: 8}
	models.DB.Delete(&user)
	c.String(http.StatusOK, "Delete")
}
```

### 批量删除

```go
db.Where("email LIKE ?", "%jinzhu%").Delete(Email{})
// DELETE from emails where email LIKE "%jinzhu%";

db.Delete(Email{}, "email LIKE ?", "%jinzhu%")
// DELETE from emails where email LIKE "%jinzhu%";
```

在控制器中的应用：

```go
func (con UserController) DeleteAll(c *gin.Context) {
	user := models.User{}
	models.DB.Where("id>9").Delete(&user)
	c.String(http.StatusOK, "DeleteAll")
}
```

更多删除方法：<https://gorm.io/zh_CN/docs/delete.html>

## 查询语句详解

参考文档：<https://gorm.io/zh_CN/docs/query.html>

### Where 条件

Where 支持 `=`、`>`、`<`、`>=`、`<=`、`!=`、`IS NOT NULL`、`IS NULL`、`BETWEEN AND`、`NOT BETWEEN AND`、`IN`、`OR`、`AND`、`NOT`、`LIKE` 等条件。

```go
nav := []models.Nav{}
models.DB.Where("id<3").Find(&nav)
c.JSON(http.StatusOK, gin.H{"success": true, "result": nav})
```

传入参数：

```go
var n = 5
nav := []models.Nav{}
models.DB.Where("id>?", n).Find(&nav)
c.JSON(http.StatusOK, gin.H{"success": true, "result": nav})
```

区间查询：

```go
var n1 = 3
var n2 = 9
nav := []models.Nav{}
models.DB.Where("id > ? AND id < ?", n1, n2).Find(&nav)
c.JSON(http.StatusOK, gin.H{"success": true, "result": nav})
```

IN 查询与 LIKE 查询：

```go
nav := []models.Nav{}
models.DB.Where("id in (?)", []int{3, 5, 6}).Find(&nav)
c.JSON(http.StatusOK, gin.H{"success": true, "result": nav})

nav = []models.Nav{}
models.DB.Where("title like ?", "%会%").Find(&nav)
c.JSON(http.StatusOK, gin.H{"success": true, "result": nav})
```

### Or 条件

```go
nav := []models.Nav{}
models.DB.Where("id=? OR id=?", 2, 3).Find(&nav)

nav = []models.Nav{}
models.DB.Where("id=?", 2).Or("id=?", 3).Or("id=4").Find(&nav)
```

### 选择字段查询

```go
nav := []models.Nav{}
models.DB.Select("id, title, url").Find(&nav)
```

### 排序、Limit 与 Offset

```go
nav := []models.Nav{}
models.DB.Where("id>2").Order("id Asc").Find(&nav)

// 多条件排序
nav = []models.Nav{}
models.DB.Where("id>2").Order("sort Desc").Order("id Asc").Find(&nav)

// 查询 2 条
nav = []models.Nav{}
models.DB.Where("id>1").Limit(2).Find(&nav)

// 跳过 2 条查询 2 条
nav = []models.Nav{}
models.DB.Where("id>1").Offset(2).Limit(2).Find(&nav)
```

### 获取总数

```go
nav := []models.Nav{}
var num int
models.DB.Where("id > ?", 2).Find(&nav).Count(&num)
```

### Distinct

从模型中选择不相同的值：

```go
nav := []models.Nav{}
models.DB.Distinct("title").Order("id desc").Find(&nav)
c.JSON(200, gin.H{"nav": nav})
```

生成的 SQL：

```sql
SELECT DISTINCT `title` FROM `nav` ORDER BY id desc
```

### Scan

把查询结果扫描到自定义结构体：

```go
type Result struct {
	Name string
	Age  int
}

var result Result
db.Table("users").Select("name", "age").Where("name = ?", "Antonio").Scan(&result)

// 原生 SQL
db.Raw("SELECT name, age FROM users WHERE name = ?", "Antonio").Scan(&result)
```

扫描到模型切片：

```go
var result []models.User
models.DB.Raw("SELECT * FROM user").Scan(&result)
fmt.Println(result)
```

### Join

先了解即可，后续章节会讲关联查询：

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

## 查看执行的 SQL

在初始化 GORM 时配置 `QueryFields: true` 即可打印 SQL：

```go
func init() {
	dsn := "root:123456@tcp(192.168.0.6:3306)/gin?charset=utf8mb4&parseTime=True&loc=Local"
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		QueryFields: true,
	})
	// 也可以使用 DB.Debug()
	if err != nil {
		fmt.Println(err)
	}
}
```

## 原生 SQL 与 SQL 生成器

参考文档：<https://gorm.io/zh_CN/docs/sql_builder.html>

使用原生 SQL 删除、修改数据：

```go
// 删除 user 表中的一条数据
result := models.DB.Exec("delete from user where id=?", 3)
fmt.Println(result.RowsAffected)

// 修改 user 表中的一条数据
result = models.DB.Exec("update user set username=? where id=2", "哈哈")
fmt.Println(result.RowsAffected)
```

查询 `uid=2` 的数据及所有数据：

```go
var result models.User
models.DB.Raw("SELECT * FROM user WHERE id = ?", 2).Scan(&result)
fmt.Println(result)

var resultList []models.User
models.DB.Raw("SELECT * FROM user").Scan(&resultList)
fmt.Println(resultList)
```

统计 user 表的数量：

```go
var count int
row := models.DB.Raw("SELECT count(1) FROM user").Row()
row.Scan(&count)
```

## 小结

- GORM 是 Go 的 ORM 框架，支持 MySQL、PostgreSQL、SQLite、SQL Server，功能涵盖关联、事务、预加载、SQL 构建器等。
- 连接数据库用 `gorm.Open(mysql.Open(dsn), &gorm.Config{})`；模型首字母大写，可用 `TableName()` 指定表名。
- CURD：`Create`、`Find`/`Where`、`Save`、`Delete`，`RowsAffected` 可判断影响行数。
- 查询支持 `Where`、`Or`、`Select`、`Order`、`Limit`、`Offset`、`Count`、`Distinct`、`Scan`、`Joins`。
- 配置 `QueryFields: true` 或使用 `DB.Debug()` 可查看执行的 SQL。
- 原生 SQL 用 `Exec`（写操作）和 `Raw`（查询），配合 `Scan` 或 `Row` 获取结果。
