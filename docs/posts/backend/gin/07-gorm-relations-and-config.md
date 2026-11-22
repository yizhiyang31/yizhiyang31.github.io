---
title: Gin 框架：GORM 关联查询、事务与配置
author: yizhiyang
date: 2026-11-18
category:
  - 后端
tag:
  - Gin
  - 学习笔记
---

本文是 Gin 框架系列的收官篇，讲解自定义 Model 与 MD5 加密，GORM 的一对一、一对多、多对多关联查询与预加载，事务的自动与手动控制，以及用 go-ini 加载配置文件并读取 MySQL 配置。

<!-- more -->

## 自定义 Model

### 关于 Model

如果应用非常简单，可以在 Controller 中处理常见的业务逻辑。但如果某个功能需要在多个控制器或多个模板中复用，就可以把公共功能单独抽取出来作为一个模块（Model）。

Model 是逐步抽象的过程：一般在 Model 中封装一些公共方法供不同 Controller 使用，也可以在 Model 中实现与数据库打交道。

### 封装公共方法

新建 `models/tools.go`：

```go
package models

import (
	"crypto/md5"
	"fmt"
	"time"
)

// UnixToDate 时间戳转换成日期
func UnixToDate(timestamp int64) string {
	t := time.Unix(timestamp, 0)
	return t.Format("2006-01-02 15:04:05")
}

// DateToUnix 日期转换成时间戳 2020-05-02 15:04:05
func DateToUnix(str string) int64 {
	template := "2006-01-02 15:04:05"
	t, err := time.ParseInLocation(template, str, time.Local)
	if err != nil {
		return 0
	}
	return t.Unix()
}

func GetUnix() int64 {
	return time.Now().Unix()
}

func GetDate() string {
	template := "2006-01-02 15:04:05"
	return time.Now().Format(template)
}

func GetDay() string {
	template := "20060102"
	return time.Now().Format(template)
}

func Md5(str string) string {
	data := []byte(str)
	return fmt.Sprintf("%x\n", md5.Sum(data))
}
```

### 控制器中调用 Model

在控制器中引入 `models` 模块即可调用公共方法：

```go
package controllers

import "gin_demo/models"

// ...
day := models.GetDay()
```

### 注册全局模板函数

可以在 `main.go` 中把 Model 的方法注册为全局模板函数。注意注册模板函数必须在加载模板之前：

```go
r := gin.Default()
r.SetFuncMap(template.FuncMap{
	"unixToDate": models.UnixToDate,
})
```

控制器传入时间戳：

```go
func (c UserController) Add(ctx *gin.Context) {
	ctx.HTML(http.StatusOK, "admin/user/add.html", gin.H{
		"now": models.GetUnix(),
	})
}
```

模板中使用管道调用：

```html
<h2>{{.now | unixToDate}}</h2>
```

### MD5 加密

打开 Go 包文档网站 <https://pkg.go.dev/> 搜索 `md5`，常用两种加密方法。

方法一：

```go
data := []byte("123456")
has := md5.Sum(data)
md5str := fmt.Sprintf("%x", has)
fmt.Println(md5str)
```

方法二：

```go
h := md5.New()
io.WriteString(h, "123456")
fmt.Printf("%x\n", h.Sum(nil))
```

## GORM 关联查询

参考文档：<https://gorm.io/zh_CN/docs/has_many.html>

### 一对一

一个文章只有一个分类，`article` 和 `article_cate` 之间是一对一关系，文章表中的 `cate_id` 保存分类的 id。查询文章时同时获取分类，就涉及一对一的关联查询。

`foreignKey` 指定当前表的外键，`references` 指定关联表中与外键关联的字段。

`Article` 模型：

```go
package models

type Article struct {
	Id          int         `json:"id"`
	Title       string      `json:"title"`
	Description int         `json:"description"`
	CateId      string      `json:"cate_id"`
	State       int         `json:"state"`
	ArticleCate ArticleCate `gorm:"foreignKey:CateId;references:Id"`
}

func (Article) TableName() string {
	return "article"
}
```

`ArticleCate` 模型：

```go
package models

// ArticleCate 的结构体
type ArticleCate struct {
	Id    int    `json:"id"`
	Title string `json:"title"`
	State int    `json:"state"`
}

func (ArticleCate) TableName() string {
	return "article_cate"
}
```

查询所有文章以及文章对应的分类信息，用 `Preload` 预加载关联字段。注意 `Preload("ArticleCate")` 中的 `ArticleCate` 是 `Article` 结构体中定义的属性名：

```go
func (con ArticleController) Index(c *gin.Context) {
	var articleList []models.Article
	models.DB.Preload("ArticleCate").Limit(2).Find(&articleList)
	c.JSON(200, gin.H{
		"result": articleList,
	})
}
```

返回 JSON 数据（示例）：

```json
[
  {
    "id": 1,
    "title": "8 月份 CPI 同比上涨 2.8%",
    "description": 0,
    "cate_id": "1",
    "state": 1,
    "ArticleCate": {
      "id": 1,
      "title": "国内",
      "state": 1
    }
  }
]
```

带指定条件的查询：

```go
func (con ArticleController) Index(c *gin.Context) {
	var articleList []models.Article
	models.DB.Preload("ArticleCate").Where("id>=?", 4).Find(&articleList)
	c.JSON(200, gin.H{
		"result": articleList,
	})
}
```

### 一对多

一对多在实际项目中使用非常多。例如点餐系统中菜品分类与菜品、订单表与订单商品表，都是一对多关系。一个分类下面有很多文章，`article_cate` 和 `article` 之间就是一对多关系。

此时在 `ArticleCate` 中定义文章切片，用 `foreignKey` 指定外键：

```go
package models

// ArticleCate 的结构体
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

`Article` 模型：

```go
package models

type Article struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	Description int    `json:"description"`
	CateId      string `json:"cate_id"`
	State       int    `json:"state"`
}

func (Article) TableName() string {
	return "article"
}
```

查找所有分类以及分类下面的文章信息：

```go
func (con ArticleController) Index(c *gin.Context) {
	var articleCateList []models.ArticleCate
	models.DB.Preload("Article").Find(&articleCateList)
	c.JSON(200, gin.H{
		"result": articleCateList,
	})
}
```

带指定条件的查询：

```go
func (con ArticleController) Index(c *gin.Context) {
	var articleCateList []models.ArticleCate
	models.DB.Preload("Article").Where("id>0").Offset(1).Limit(1).Find(&articleCateList)
	c.JSON(200, gin.H{
		"result": articleCateList,
	})
}
```

更多一对多查询方法参考：<https://github.com/jouyouyun/examples/tree/master/gorm/related>

如果程序中同时有两个需求——查询文章时获取分类信息、查询分类时获取文章信息，可以在两个模型中同时定义关联字段：

```go
type Article struct {
	Id          int         `json:"id"`
	Title       string      `json:"title"`
	Description int         `json:"description"`
	CateId      string      `json:"cate_id"`
	State       int         `json:"state"`
	ArticleCate ArticleCate `gorm:"foreignKey:CateId;references:Id"`
}

type ArticleCate struct {
	Id      int       `json:"id"`
	Title   string    `json:"title"`
	State   int       `json:"state"`
	Article []Article `gorm:"foreignKey:CateId"`
}
```

### 多对多

以学生选课为例，学生与课程是多对多关系，需要一张中间表 `lesson_student`。如果想根据课程获取选学该门课程的学生，就在 `Lesson` 中关联 `Student`。

`Lesson` 模型：

```go
package models

type Lesson struct {
	Id      int        `json:"id"`
	Name    string     `json:"name"`
	Student []*Student `gorm:"many2many:lesson_student"`
}

func (Lesson) TableName() string {
	return "lesson"
}
```

`Student` 模型：

```go
package models

type Student struct {
	Id       int
	Number   string
	Password string
	ClassId  int
	Name     string
	Lesson   []*Lesson `gorm:"many2many:lesson_student"`
}

func (Student) TableName() string {
	return "student"
}
```

中间表模型：

```go
package models

type LessonStudent struct {
	LessonId  int
	StudentId int
}

func (LessonStudent) TableName() string {
	return "lesson_student"
}
```

获取学生信息和课程信息：

```go
studentList := []models.Student{}
models.DB.Find(&studentList)
c.JSON(http.StatusOK, studentList)

lessonList := []models.Lesson{}
models.DB.Find(&lessonList)
c.JSON(http.StatusOK, lessonList)
```

查询学生信息时获取选课信息、查询指定学生选修的课程：

```go
studentList := []models.Student{}
models.DB.Preload("Lesson").Find(&studentList)
c.JSON(http.StatusOK, studentList)

studentList = []models.Student{}
models.DB.Preload("Lesson").Where("id=1").Find(&studentList)
c.JSON(http.StatusOK, studentList)
```

查询课程被哪些学生选修、指定课程的选修学生：

```go
lessonList := []models.Lesson{}
models.DB.Preload("Student").Find(&lessonList)
c.JSON(http.StatusOK, lessonList)

lessonList = []models.Lesson{}
models.DB.Preload("Student").Where("id=1").Find(&lessonList)
c.JSON(http.StatusOK, lessonList)
```

查询数据指定条件、预加载分页：

```go
lessonList := []models.Lesson{}
models.DB.Preload("Student").Offset(1).Limit(2).Find(&lessonList)
c.JSON(http.StatusOK, lessonList)
```

关联查询指定子集的筛选条件（参考 <https://gorm.io/zh_CN/docs/preload.html>）：

```go
// status=1 的关联项，并按 sort 倒序
access := []models.Access{}
models.DB.Preload("AccessItem", "status=1").Order("sort desc").Where("module_id=?", 0).Find(&access)

// 排除指定 id 的学生
lessonList := []models.Lesson{}
models.DB.Preload("Student", "id!=1").Find(&lessonList)
c.JSON(http.StatusOK, lessonList)

lessonList = []models.Lesson{}
models.DB.Preload("Student", "id not in (1,2)").Find(&lessonList)
c.JSON(http.StatusOK, lessonList)
```

自定义预加载 SQL，例如让选修学生按 id 倒序输出。需要引入 `gorm.io/gorm` 包：

```go
lessonList := []models.Lesson{}
models.DB.Preload("Student", func(db *gorm.DB) *gorm.DB {
	return models.DB.Order("id DESC")
}).Find(&lessonList)
c.JSON(http.StatusOK, lessonList)

// 带条件的自定义预加载
lessonList = []models.Lesson{}
models.DB.Preload("Student", func(db *gorm.DB) *gorm.DB {
	return models.DB.Where("id>3").Order("id DESC")
}).Find(&lessonList)
c.JSON(http.StatusOK, lessonList)
```

## GORM 事务

事务处理用于维护数据库完整性，保证成批的 SQL 语句要么全部执行，要么全部不执行。参考文档：<https://gorm.io/zh_CN/docs/transactions.html>

### 禁用默认事务

为确保数据一致性，GORM 会在事务里执行写入操作（创建、更新、删除）。如果没有这方面要求，可以在初始化时禁用，从而获得约 30%+ 的性能提升。

GORM 默认将单个 create、update、delete 操作封装在事务内处理。若要把多个写操作作为一个原子操作，就要使用 `Transaction`。

```go
var DB *gorm.DB
var err error

func init() {
	dsn := "root:123456@tcp(192.168.0.6:3306)/gin?charset=utf8mb4&parseTime=True&loc=Local"
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		SkipDefaultTransaction: true,
	})
	DB.Debug()
	if err != nil {
		fmt.Println(err)
	}
}
```

### 自动事务

要在事务中执行一系列操作，可以使用 `db.Transaction`。在事务中应使用 `tx` 而不是 `db`，返回任何错误都会回滚事务，返回 `nil` 则提交事务：

```go
db.Transaction(func(tx *gorm.DB) error {
	// 在事务中执行一些 db 操作（从这里开始，应该使用 'tx' 而不是 'db'）
	if err := tx.Create(&Animal{Name: "Giraffe"}).Error; err != nil {
		// 返回任何错误都会回滚事务
		return err
	}

	if err := tx.Create(&Animal{Name: "Lion"}).Error; err != nil {
		return err
	}

	// 返回 nil 提交事务
	return nil
})
```

### 手动控制事务

也可以手动开启、回滚和提交事务：

```go
// 开启事务
tx := db.Begin()

// 在事务中做一些数据库操作（这里应该使用 'tx'，而不是 'db'）
tx.Create(...)

// 有错误时，手动调用事务的 Rollback()
tx.Rollback()

// 无错误时，手动调用事务的 Commit()
tx.Commit()
```

### 转账示例

以下是张三给李四转账的示例，用 `defer` + `recover` 保证异常时回滚：

```go
package admin

import (
	"fmt"

	"gindemo13/models"
	"github.com/gin-gonic/gin"
)

type TransitionController struct {
	BaseController
}

func (con TransitionController) Index(c *gin.Context) {
	tx := models.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			con.error(c)
		}
	}()

	if err := tx.Error; err != nil {
		fmt.Println(err)
		con.error(c)
	}

	// 张三账户减去 100
	u1 := models.Bank{Id: 1}
	tx.Find(&u1)
	u1.Balance = u1.Balance - 100
	if err := tx.Save(&u1).Error; err != nil {
		tx.Rollback()
		con.error(c)
	}

	// 李四账户增加 100
	u2 := models.Bank{Id: 2}
	tx.Find(&u2)
	u2.Balance = u2.Balance + 100
	if err := tx.Save(&u2).Error; err != nil {
		tx.Rollback()
		con.error(c)
	}

	tx.Commit()
	con.success(c)
}
```

## go-ini 加载配置

### go-ini 介绍

go-ini 官方介绍：go-ini 是地表最强大、最方便和最流行的 Go 语言 INI 文件操作库。

- GitHub 地址：<https://github.com/go-ini/ini>
- 官方文档：<https://ini.unknwon.io/>

### go-ini 使用

新建 `conf/app.ini`：

```ini
app_name = itying gin

# possible values: DEBUG, INFO, WARNING, ERROR, FATAL
log_level = DEBUG

[mysql]
ip = 192.168.0.6
port = 3306
user = root
password = 123456
database = gin

[redis]
ip = 127.0.0.1
port = 6379
```

编写 `main.go` 操作配置文件：

```go
package main

import (
	"fmt"
	"os"

	"gopkg.in/ini.v1"
)

func main() {
	cfg, err := ini.Load("./conf/app.ini")
	if err != nil {
		fmt.Printf("Fail to read file: %v", err)
		os.Exit(1)
	}

	// 典型读取操作，默认分区可以使用空字符串表示
	fmt.Println("App Mode:", cfg.Section("").Key("app_name").String())
	fmt.Println("Data Path:", cfg.Section("mysql").Key("ip").String())

	// 修改某个值然后进行保存
	cfg.Section("").Key("app_name").SetValue("itying gin")
	cfg.SaveTo("./conf/app.ini")
}
```

### 读取 MySQL 配置

在 `models/core.go` 中读取 ini 配置并构造数据库连接串（参考 <https://gorm.io/zh_CN/docs/connecting_to_the_database.html>）：

```go
package models

import (
	"fmt"
	"os"

	"gopkg.in/ini.v1"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB
var err error

func init() {
	cfg, err := ini.Load("./conf/app.ini")
	if err != nil {
		fmt.Printf("Fail to read file: %v", err)
		os.Exit(1)
	}

	ip := cfg.Section("mysql").Key("ip").String()
	port := cfg.Section("mysql").Key("port").String()
	user := cfg.Section("mysql").Key("user").String()
	password := cfg.Section("mysql").Key("password").String()
	database := cfg.Section("mysql").Key("database").String()

	dsn := fmt.Sprintf("%v:%v@tcp(%v:%v)/%v?charset=utf8mb4&parseTime=True&loc=Local",
		user, password, ip, port, database)
	fmt.Println(dsn)

	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		QueryFields: true, // 打印 sql
		// SkipDefaultTransaction: true, // 禁用事务
	})
	if err != nil {
		fmt.Println(err)
	}
}
```

## 小结

- Model 用于抽取公共逻辑，可封装工具方法并注册为全局模板函数；MD5 加密可用 `md5.Sum` 或 `md5.New()`。
- 关联查询：`foreignKey` 指定外键、`references` 指定关联字段，用 `Preload` 预加载；一对一、一对多、多对多分别通过结构体字段和 `many2many` 标签实现。
- `Preload` 支持条件筛选、分页和自定义 SQL（需引入 `gorm.io/gorm`）。
- 事务：`db.Transaction` 自动提交/回滚，`db.Begin()` / `Rollback()` / `Commit()` 手动控制；可用 `SkipDefaultTransaction` 禁用默认事务提升性能。
- go-ini 用 `ini.Load` 加载 `.ini` 文件，通过 `Section().Key().String()` 读取配置，可用于构造 MySQL 的 DSN。
