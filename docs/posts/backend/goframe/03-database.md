---
title: GoFrame 入门：数据库与 ORM
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - GoFrame
  - MySQL
  - 学习笔记
---

本文以 MySQL 为例，介绍 GoFrame ORM 的配置与使用：从测试库准备、连接配置、驱动导入，到增删改查、时间维护与软删除、事务、原生 SQL、DAO 代码生成、字段过滤与关联查询。

<!-- more -->

## 数据库准备

需要先安装 MySQL 数据库（也可以使用其他数据库，本教程以 MySQL 为例）。安装过程如果不了解，可以在 B 站搜索 MySQL 相关教程。

先创建一个名为 `goframe` 的数据库，字符集为 `utf8`，再执行下列 SQL 创建测试数据表：

```sql
USE `goframe`;

/* Table structure for table `book` */

DROP TABLE IF EXISTS `book`;

CREATE TABLE `book` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` VARCHAR(50) NOT NULL COMMENT '书名',
  `author` VARCHAR(30) NOT NULL COMMENT '作者',
  `price` DOUBLE NOT NULL COMMENT '价格',
  `publish_time` DATE COMMENT '出版时间',
  PRIMARY KEY (`id`)
) ENGINE=INNODB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

/* Data for the table `book` */

INSERT INTO `book`(`id`,`name`,`author`,`price`) VALUES
(1,'MySQL数据库从入门到精通','王飞飞',59.8),
(2,'设计模式','刘伟',45),
(3,'数据库原理及应用','刘亮',33),
(4,'Linux驱动开发入门与实践','郑强',69),
(5,'Linux驱动开发入门与实践','郑强',69),
(6,'Linux驱动开发入门与实践','郑强',69);

/* Table structure for table `dept` */

DROP TABLE IF EXISTS `dept`;

CREATE TABLE `dept` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `pid` INT(10) UNSIGNED DEFAULT NULL COMMENT '上级部门ID',
  `name` VARCHAR(30) DEFAULT NULL COMMENT '部门名称',
  `leader` VARCHAR(20) DEFAULT NULL COMMENT '部门领导',
  `phone` VARCHAR(11) DEFAULT NULL COMMENT '联系电话',
  PRIMARY KEY (`id`)
) ENGINE=INNODB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8;

/* Data for the table `dept` */

INSERT INTO `dept`(`id`,`pid`,`name`,`leader`,`phone`) VALUES
(100,0,'哪都通','赵方旭','10000000000'),
(101,100,'华北大区','徐四','10000000001'),
(102,100,'东北大区','高廉','10000000002'),
(103,100,'华东大区','窦乐','10000000003'),
(104,100,'华中大区','任菲','10000000004'),
(105,100,'华南大区',NULL,NULL),
(106,100,'西北大区','华风','10000000005'),
(107,100,'西南大区','郝意','10000000006');

/* Table structure for table `emp` */

DROP TABLE IF EXISTS `emp`;

CREATE TABLE `emp` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `dept_id` INT(10) UNSIGNED NOT NULL COMMENT '所属部门',
  `name` VARCHAR(30) NOT NULL COMMENT '姓名',
  `gender` TINYINT(1) DEFAULT NULL COMMENT '性别: 0=男 1=女',
  `phone` VARCHAR(11) DEFAULT NULL COMMENT '联系电话',
  `email` VARCHAR(50) DEFAULT NULL COMMENT '邮箱',
  `avatar` VARCHAR(100) DEFAULT NULL COMMENT '照片',
  PRIMARY KEY (`id`)
) ENGINE=INNODB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;

/* Data for the table `emp` */

INSERT INTO `emp`(`id`,`dept_id`,`name`,`gender`,`phone`,`email`) VALUES
(1,100,'赵方旭',0,'10000000000','zhaofx@nadoutong.com'),
(2,100,'毕游龙',0,'10000000007','biyoulong@nadoutong.com'),
(3,100,'黄伯仁',0,'10000000008','huangboren@nadoutong.com'),
(4,101,'徐四',0,'10000000001','xusi@nadoutong.com'),
(5,101,'徐三',0,'10000000009','xusan@nadoutong.com'),
(6,101,'冯宝宝',1,'10000000010','fengbaobao@nadoutong.com'),
(7,101,'张楚岚',0,'10000000011','zhangchulan@nadoutong.com'),
(8,102,'高廉',0,'10000000002','gaolian@nadoutong.com'),
(9,102,'高二壮',1,'10000000012','gaoerzhuang@nadoutong.com'),
(10,103,'窦乐',0,'10000000003','doule@nadoutong.com'),
(11,103,'肖自在',0,'10000000013','xiaozizai@nadoutong.com'),
(12,104,'任菲',0,'10000000004','renfei@nadoutong.com'),
(13,106,'华风',0,'10000000005','huafeng@nadoutong.com'),
(14,107,'郝意',0,'10000000006','huafeng@nadoutong.com');

DROP TABLE IF EXISTS `hobby`;

CREATE TABLE `hobby` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `emp_id` INT UNSIGNED NOT NULL COMMENT 'EmpID',
  `hobby` VARCHAR(50) COMMENT '爱好',
  PRIMARY KEY (`id`)
) ENGINE=INNODB CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `hobby` (`id`, `emp_id`, `hobby`) VALUES
(1, 6, '埋人'),
(2, 4, '看美女'),
(3, 7, '月下遛鸟');

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `username` VARCHAR(20) NOT NULL COMMENT '用户名',
  `nickname` VARCHAR(30) COMMENT '昵称',
  `password` VARCHAR(32) COMMENT '密码',
  `avatar` VARCHAR(100) COMMENT '头像',
  `created_at` DATETIME COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=INNODB CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO
`user` (`id`, `username`, `nickname`, `password`, `avatar`, `created_at`) VALUES
(1, 'libai', '李白', '123456', '', '2023-10-08 16:57:24'),
(2, 'dufu', '杜甫', '123456', '', '2023-10-08 16:57:24'),
(3, 'baijuyi', '白居易', '123456', '', '2023-10-08 16:57:24');
```

## 数据库配置

数据库准备完毕后，在配置文件中添加数据库配置即可：

`manifest/config/config.yaml`

```yaml
database:
  type: "mysql"
  host: "127.0.0.1"
  port: "3306"
  user: "root"
  pass: "root"
  name: "goframe"
  timezone: "Asia/Shanghai"
  debug: true
```

> - `type`：数据库类型，mysql / sqlite / pgsql / oracle 等
> - `host`：数据库主机
> - `port`：数据库端口
> - `user`：数据库连接用户名
> - `pass`：数据库连接密码
> - `name`：需要连接的数据库名
> - `timezone`：数据库时区，设置为 `Asia/Shanghai` 或 `Local`，不设置会出现时间转换混乱
> - `debug`：是否开启调试，学习及开发阶段可开启，便于查看数据库操作的相关输出

以上为连接数据库最简单的配置。如果需要更复杂的配置，可查阅官方文档中的 ORM 使用配置章节。

上述配置可以简化为一个 `link`，格式为 `type:user:password@tcp(host:port)/dbname?param1=value1&..`：

```yaml
database:
  debug: true
  link: "mysql:root:root@tcp(127.0.0.1:3306)/goframe?loc=Local&parseTime=true"
```

或者也可以保留上述配置，写为：

```yaml
database:
  type: "mysql"
  host: "127.0.0.1"
  port: "3306"
  user: "root"
  pass: "root"
  name: "goframe"
  timezone: "Local"
  debug: true
  link: "mysql:root:root@tcp(127.0.0.1:3306)/goframe?loc=Local&parseTime=true"
```

这样写法使用的是 `link`，其他的单项配置不会生效。

## 驱动添加与导入

在 `main.go` 中进行 MySQL 驱动初始化导入：

```go
import (
    _ "github.com/gogf/gf/contrib/drivers/mysql/v2"
)
```

在 `go.mod` 中添加驱动库与版本：

```go
require (
    github.com/gogf/gf/contrib/drivers/mysql/v2 v2.5.3
    github.com/gogf/gf/v2 v2.5.3
)
```

在命令行中更新依赖：

```shell
go mod tidy
```

等待下载更新完成即可。

## 数据库基本操作

`github.com/gogf/gf/v2/frame/g` 包里的 `Model` 函数返回一个 `gdb.Model` 对象，提供了一系列对数据库的操作。`Model` 函数接收一个参数，为数据表名：

```go
md := g.Model("book")
```

上述代码返回一个与表 `book` 关联的 `Model`。

### 查询数据

**查询一条数据**

```go
md := g.Model("book")
bk, err := md.One()
if err == nil {
    req.Response.WriteJson(bk)
}
```

返回数据库中第一条数据。查询成功返回的数据为 `map[string]*gvar.Var` 类型，可以直接访问其中的每一个字段：

```go
req.Response.WriteJson(bk["name"]) // 返回结果中 "name" 字段
```

可以用 `gvar.Var` 的方法对字符进行类型转换，转为需要的类型：

```go
bk["name"].String()   // 转为 string 类型
bk["price"].Float32() // 转为 float32 类型
```

**指定查询字段**

```go
bk, err := md.Fields("name, price").One() // 只查询 name、price 两个字段
// 也可以写为
bk, err := md.Fields("name", "price").One()
```

**查询多条数据**

```go
md := g.Model("book")
bk, err := md.All()
```

该方法以切片返回数据表中所有数据，可以进行循环操作：

```go
for _, v := range bk {
    req.Response.Writeln(v)
}
```

**查询数据数量**

```go
md := g.Model("book")
count, err := md.Count()
```

**查询一条数据的指定字段**

```go
md := g.Model("book")
name, err := md.Value("name")
```

**查询指定列数据**

```go
md := g.Model("book")
name, err := md.Array("name")
```

**Max / Min / Sum / Avg**

```go
md := g.Model("book")

max, err := md.Max("price")
min, err := md.Min("price")
sum, err := md.Sum("price")
avg, err := md.Avg("price")
```

### Where 系列方法

查询数据时可以通过 `Where` 方法指定条件，如果有多个 `Where`，则多个条件之间会用 `AND` 连接。

**等于**：默认情况下条件会用 `=` 连接。

```go
md := g.Model("book")
books, err := md.Where("id", 1).All()
```

**不等**：需要在字段后面加上不等符号。

```go
md := g.Model("book")
books, err := md.Where("id>", 1).All()
```

**多个条件叠加**：有多个条件时可以进行链式调用，条件之间用 `AND` 连接。

```go
md := g.Model("book")
books, err := md.Where("id>=?", 2).Where("id<?", 4).All()
```

**Where 系列方法**

| 方法                                   | 生成的 SQL 条件表达式                                        |
|:------------------------------------:|:---------------------------------------------------:|
| WhereLT(column, value)               | column < value                                      |
| WhereLTE(column, value)              | column <= value                                     |
| WhereGT(column, value)               | column > value                                      |
| WhereGTE(column, value)              | column >= value                                     |
| WhereBetween(column, min, max)       | column BETWEEN min AND max                          |
| WhereNotBetween(column, min, max)    | column NOT BETWEEN min AND max                      |
| WhereLike(column, like)              | column LIKE like                                    |
| WhereIn(column, in)                  | column IN (in)                                      |
| WhereNotIn(column, in)               | column NOT IN (in)                                  |
| WhereNot(column, value)              | column != value                                     |
| WhereNull(columns1, columns2...)     | columns1 IS NULL AND columns2 IS NULL...            |
| WhereNotNull(columns1, columns2...)  | columns1 IS NOT NULL AND columns2 IS NOT NULL...    |

使用示例：

```go
md := g.Model("book")
books, err := md.WhereIn("id", g.Array{1, 2, 3}).WhereLike("name", "%数据%").All()

// 生成如下 SQL
// SELECT * FROM `book` WHERE (`id` IN (1,2,3)) AND (`name` LIKE '%数据%')
```

以上方法如果链式调用会生成以 `AND` 连接的条件，如果需要生成以 `OR` 连接的条件，则需要用到下列方法。

**WhereOr 系列方法**

| 方法                                     | 生成的 SQL 条件表达式                                          |
|:--------------------------------------:|:----------------------------------------------------:|
| WhereOrLT(column, value)               | OR (column < value)                                  |
| WhereOrLTE(column, value)              | OR (column <= value)                                 |
| WhereOrGT(column, value)               | OR (column > value)                                  |
| WhereOrGTE(column, value)              | OR (column >= value)                                 |
| WhereOrBetween(column, min, max)       | OR (column BETWEEN min AND max)                      |
| WhereOrNotBetween(column, min, max)    | OR (column NOT BETWEEN min AND max)                  |
| WhereOrLike(column, like)              | OR (column LIKE like)                                |
| WhereOrIn(column, in)                  | OR (column IN (in))                                  |
| WhereOrNotIn(column, in)               | OR (column NOT IN (in))                              |
| WhereOrNot(column, value)              | OR (column != value)                                 |
| WhereOrNull(columns1, columns2...)     | OR (columns1 IS NULL AND columns2 IS NULL...)        |
| WhereOrNotNull(columns1, columns2...)  | OR (columns1 IS NOT NULL AND columns2 IS NOT NULL...) |
| WhereOr(column, value)                 | OR (column = value)                                  |

示例：

```go
md := g.Model("book")
books, err := md.WhereIn("id", g.Array{1, 2, 3}).WhereOrLike("name", "%数据%").All()
// 生成如下 SQL
// SELECT * FROM `book` WHERE (`id` IN (1,2,3)) OR (`name` LIKE '%数据%')
```

### Group 与 Order

**按字段分组**

```go
md := g.Model("book")
books, err := md.Group("name").All()
```

**按字段排序**

```go
md := g.Model("book")
books, err := md.Order("price", "DESC").All()
// 多字段排序
books, err := md.Order("price", "DESC").Order("id", "ASC").All()
// 排序封装方法
books, err := md.OrderDesc("price").OrderAsc("id").All()
```

### Scan

`One` 和 `All` 返回的数据为 Map 或 Map 切片，实际使用中查询到的数据可能需要转换为特定的数据结构方便使用。

`Scan` 方法可以将查询到的数据转为自定义结构体或结构体数组，使用方式非常灵活，下面只演示推荐写法。

**查询数据转为自定义结构体**

```go
type Book struct {
    Id          uint
    Name        string
    Author      string
    Price       float64
    PublishTime *gtime.Time
}

var book *Book

md := g.Model("book")
err := md.Scan(&book)
```

`Scan` 会将数据库字段的下划线命名对应到结构体中相应的驼峰命名上，如果对应不上，则该成员为 `nil` 或者零值。如果结构体成员名称与数据表字段不对应，可以用 `orm:` 标签来指定对应字段：

```go
type Book struct {
    BookId     uint        `orm:"id"`
    BookName   string      `orm:"name"`
    BookAuthor string      `orm:"author"`
    BookPrice  float64     `orm:"price"`
    PubTime    *gtime.Time `orm:"publish_time"`
}

var book *Book

md := g.Model("book")
err := md.Scan(&book)
```

**结构体数组**

`Scan` 方法可以查询单独结构体，也可以查询一个结构体数组，只需要将结构体指针改为结构体切片传入即可：

```go
type Book struct {
    Id          uint
    Name        string
    Author      string
    Price       float64
    PublishTime *gtime.Time
}

var book []Book

md := g.Model("book")
err := md.Scan(&book)
```

查询结果为一个由 `Book` 组成的结构体数组，存放多条数据。

查询部分暂时先了解这些，只要熟悉 SQL，每种查询基本上都能找到对应的方法来实现。更复杂的查询见官方文档的 ORM 查询章节。

### 查询结果为空判断

**All**

```go
md := g.Model("book")
books, _ := md.All()
if len(books) == 0 {
    g.RequestFromCtx(ctx).Response.Writeln("结果为空")
}
// 或者
if books.IsEmpty() {
    g.RequestFromCtx(ctx).Response.Writeln("结果为空")
}
```

**One**

```go
md := g.Model("book")
book, _ := md.Where("id", 100).One()
if len(book) == 0 {
    g.RequestFromCtx(ctx).Response.Writeln("结果为空")
}
// 或者
if book.IsEmpty() {
    g.RequestFromCtx(ctx).Response.Writeln("结果为空")
}
```

**Value**

```go
md := g.Model("book")
name, _ := md.Where("id", 10).Value("name")
if name.IsEmpty() {
    g.RequestFromCtx(ctx).Response.Writeln("结果为空")
}
```

**Array**

```go
md := g.Model("book")
names, _ := md.WhereLT("id", 10).Array("name")
if len(names) == 0 {
    g.RequestFromCtx(ctx).Response.Writeln("结果为空")
}
```

**Scan 结构体对象**

```go
var book *Book
md := g.Model("book")
md.Scan(&book)
if book == nil {
    g.RequestFromCtx(ctx).Response.Writeln("结果为空")
}
```

**Scan 结构体数组**

```go
var books []Book
md := g.Model("book")
md.Scan(&books)
if len(books) == 0 {
    g.RequestFromCtx(ctx).Response.Writeln("结果为空")
}
```

### 分页

GoFrame 提供了 `Page` 方法，可以很方便地实现分页查询，只需提供页数和每页数据数量：

```go
md := g.Model("book")
books, err := md.Page(1, 5).All()
```

也有 `Limit` 方法可以用来限制查询条数，以及自定义起始位置与数据限制：

```go
md := g.Model("book")
// 限制条数
books, err := md.Limit(5).All()
// 指定起始位置与限制条数
books, err := md.Limit(3, 5).All()
```

### 插入数据

`Insert`、`Replace`、`Save` 三个方法都可以向数据库中写入一条或者多条数据，区别在于当数据中主键字段在数据库中已经存在时，处理方式不同：

| 方法      | 主键在数据库中已存在时            |
|:-------:|:----------------------:|
| Insert  | 报错，主键冲突                |
| Replace | 用提供的数据替换已存在同主键的数据      |
| Save    | 用提供的数据更新已存在的同主键数据      |

**写入单条数据**

```go
md := g.Model("book")
data := g.Map{
    "id":           8,
    "name":         "Linux驱动开发入门与实践",
    "author":       "郑强",
    "price":        69,
    "publish_time": "2023-10-10",
}
// Insert
result, err := md.Insert(data)
// Replace
result, err := md.Replace(data)
// Save
result, err := md.Save(data)
```

以上方法也可配合 `Data` 使用：

```go
// Insert
result, err := md.Data(data).Insert()
// Replace
result, err := md.Data(data).Replace()
// Save
result, err := md.Data(data).Save()
```

除了使用 Map 类型之外，还可以使用结构体。结构体成员名称与数据表字段名称不对应时，用 `orm` 标签指定：

```go
type Book struct {
    Id      uint
    Name    string
    Author  string
    Price   float64
    PubTime *gtime.Time `orm:"publish_time"`
}

md := g.Model("book")
data := Book{
    Id:      8,
    Name:    "Linux驱动开发入门与实践",
    Author:  "郑强",
    Price:   69.3,
    PubTime: gtime.New("2023-10-10"),
}
result, err := md.Data(data).Save()
```

**批量写入数据**

上述方法也可以批量写入数据：

```go
data := g.List{
    g.Map{
        "name":         "Linux驱动开发入门与实践",
        "author":       "郑强",
        "price":        69.3,
        "publish_time": gtime.New("2023-10-10"),
    },
    g.Map{
        "name":         "Linux驱动开发入门与实践",
        "author":       "郑强",
        "price":        69.3,
        "publish_time": gtime.New("2023-10-10"),
    },
    g.Map{
        "name":         "Linux驱动开发入门与实践",
        "author":       "郑强",
        "price":        69.3,
        "publish_time": gtime.New("2023-10-10"),
    },
}

result, err := md.Data(data).Save()
```

如果使用的是结构体，将 `g.List` 改为 `g.Array` 或者 `g.Slice`。

**InsertAndGetId**

写入数据并返回自增 ID：

```go
data := g.Map{
    "name":         "Linux驱动开发入门与实践",
    "author":       "郑强",
    "price":        69.3,
    "publish_time": gtime.New("2023-10-10"),
}

result, err := md.Data(data).InsertAndGetId()
```

**gdb.Raw**

有的字段可能需要调用 SQL 中的操作来获得结果，例如 `publish_time` 字段可以用 SQL 中的 `CURRENT_DATE()` 来获取当前日期，这时就需要用到 `Raw`：

```go
data := g.Map{
    "name":         "Linux驱动开发入门与实践",
    "author":       "郑强",
    "price":        69.3,
    "publish_time": gdb.Raw("CURRENT_DATE()"),
}

result, err := md.Data(data).InsertAndGetId()
```

### 更新数据

```go
data := g.Map{
    "author": "郑强强",
    "price":  69.333,
}

result, err := md.Where("author", "郑强").Update(data)
```

也可以配合 `Data` 使用：

```go
data := g.Map{
    "author": "郑强强",
    "price":  69.333,
}

result, err := md.Where("author", "郑强").Data(data).Update()
```

**Increment / Decrement**

用于给指定字段增加或减少指定值：

```go
result, err := md.WhereBetween("id", 7, 10).Increment("price", 2.5)
result, err := md.WhereBetween("id", 7, 10).Decrement("price", 1.5)
```

### 删除数据

```go
result, err := md.WhereGT("id", 10).Delete()
```

## 时间维护与软删除

实际应用中，数据表通常会有三个时间字段：创建时间、更新时间、删除时间。GoFrame 支持这三个时间字段的自动填充，支持的类型为 `DATE`、`DATETIME`、`TIMESTAMP`。

- 创建时间：默认为 `created_at`
- 更新时间：默认为 `updated_at`
- 删除时间：默认为 `deleted_at`，数据软删除时使用

如果不想使用默认名称，可以在配置文件里修改数据库配置：

```yaml
database:
  # ...
  createdAt: "create_time"
  updatedAt: "update_time"
  deletedAt: "delete_time"
```

**软删除**

> 软删除并不是真正从数据库中把记录删除，而是通过特定的标记在查询时过滤掉这些数据，使这些数据在页面上看不到，但实际上在数据库中仍然存在。通常用于一些需要历史追踪而不能真正删除的数据。

当数据表中有 `deleted_at` 字段时，使用 `Delete` 方法不会物理删除数据，只会更新 `deleted_at` 字段的值。查询数据时会自动加上 `WHERE deleted_at IS NULL` 这一条件，过滤掉已被「删除」的数据。

如果需要查询所有数据，需要使用 `Unscoped` 方法：

```go
ls, _ := md.Unscoped().All()
```

## 事务处理

**常规写法**

```go
tx, err := g.DB().Begin(ctx)

if err == nil {
    _, err := tx.Model("book").Data(data).Save()
    if err == nil {
        tx.Commit()
    } else {
        tx.Rollback()
    }
}
```

**闭包写法**（框架建议写法）

```go
g.DB().Transaction(context.TODO(), func(ctx context.Context, tx gdb.TX) error {
    _, err := tx.Model("book").Ctx(ctx).Save(data)
    return err
})
```

## 原生 SQL 的使用

由 `Model` 提供的方法能组合出绝大多数使用场景所需要的数据操作，但如果需要的操作过于复杂，可能就无法通过已有方法组合出来，这时就需要手写 SQL 来实现。

**查询**

```go
db := g.DB()
books, err := db.Query(ctx, "SELECT * FROM `book` WHERE `id` > ? AND `id` < ?", g.Array{3, 7})
```

**新增数据**

```go
db := g.DB()
sql := "INSERT INTO `book` (`name`, `author`, `price`) VALUES (?, ?, ?)"
data := g.Array{"Go语言从入门到精通", "Go语言研讨组", 99.98}
result, err := db.Exec(ctx, sql, data)
```

更多操作见官方文档的 ORM 原生方法章节。

## DAO 自动生成与使用

数据库相关的操作与数据结构放在 `dao` 与 `model` 中，在 GoFrame 中，`dao` 与 `model` 的内容可以自动生成。生成步骤如下。

1. 配置 `dao`

`hack/config.yaml`

```yaml
gfcli:
  gen:
    dao:
      link: "mysql:root:root@tcp(127.0.0.1:3306)/goframe"
      tables: "book, user, dept, emp, hobby"
      jsonCase: "Snake"
```

> - `link`：数据库连接 url
> - `tables`：需要生成 dao 及 model 的数据表，多个表用逗号隔开
> - `jsonCase`：entity 成员转为 json 时的转换方式，`Snake` 表示把驼峰转为下划线

以上为最简单配置，更多配置见官方文档的「代码生成 / 数据规范 gen dao」章节。

2. 在命令行中执行如下命令：

```shell
gf gen dao
```

该命令会生成 `dao` 以及 `model` 下各个表对应的结构与代码。

接下来使用各个表对应的 Model 对象时，不再用 `g.Model` 获取，而是用下面的方式：

```go
md := dao.Book.Ctx(ctx)
books, err := md.All()
```

该 Model 对象可以多次叠加查询条件：

```go
md := dao.Book.Ctx(ctx)
md = md.WhereGT("id", 3)
md = md.WhereLT("id", 6)
books, err := md.All()

// 以上代码相当于
books, err := dao.Book.Ctx(ctx).WhereGT("id", 3).WhereLT("id", 6).All()
```

## 字段过滤

使用结构体数据进行创建或更新数据时，尤其是在更新数据的时候，有些字段可能不需要更新，因此对应的字段就不进行赋值。例如以下代码：

```go
type Book struct {
    Id      uint
    Name    string
    Author  string
    Price   float64
    PubTime *gtime.Time `orm:"publish_time"`
}

data := Book{
    Name:    "Linux驱动开发入门与实践",
    PubTime: gtime.New("2023-10-11"),
}

_, err = dao.Book.Ctx(ctx).Where("id", 13).Data(data).Update()
```

直接这样更新，`id`、`author`、`price` 也会被对应类型的零值更新，分别被更新为 0、`""`、0。要解决这样的问题，有以下几种方案。

**用 Fields 指定需要更新的字段**

```go
dao.Book.Ctx(ctx).Fields("name", "publish_time").Where("id", 13).Data(data).Update()
```

**用 FieldsEx 排除不需要更新的字段**

```go
dao.Book.Ctx(ctx).FieldsEx("id,author,price").Where("id", 13).Data(data).Update()
```

**用 OmitEmpty 过滤空值**

```go
data := Book{
    Name:    "Linux驱动开发入门与实践",
    Price:   0,
    PubTime: nil,
}
dao.Book.Ctx(ctx).Where("id", 13).OmitEmpty().Data(data).Update()
```

用这种方法，如上数据中的 0 和 `nil` 也会被忽略，无法更新对应字段的值。

**使用 do 对象进行字段过滤**

使用 `gf gen dao` 时，每个表会生成一个对应的 `do` 对象。使用 `do` 对象作为参数传递，会自动过滤空值：

```go
data := do.Book{
    Name:        "Linux驱动开发入门与实践",
    Price:       0,
    PublishTime: nil,
}

dao.Book.Ctx(ctx).Where("id", 13).Data(data).Update()
```

使用这种方法，非 `nil` 的零值都可以更新。

`do` 对象也可以用于传递查询条件，同样会自动过滤空值：

```go
where := do.Book{
    Author:      "郑强",
    Id:          13,
    PublishTime: nil,
}

books, err := dao.Book.Ctx(ctx).Where(where).All()
// 相当于
books, err := dao.Book.Ctx(ctx).Where("id", 13).Where("author", "郑强").All()
```

## 关联查询

多表数据联查时可以使用连接，但数据量大时连接效率不高，GoFrame 中提供了模型关联查询，可以简化一些多表联查操作。

以 `dept`、`emp`、`hobby` 三个表为例：每个部门可以有多个员工，每个员工只有一个部门，每个员工对应一条爱好。

**查询所有员工，并关联查询出其所在部门**

先修改 `entity.Emp`，加入关联信息：

`internal/model/entity/emp.go`

```go
type Emp struct {
    Id     uint   `json:"id"      ` // ID
    DeptId uint   `json:"dept_id" ` // 所属部门
    Name   string `json:"name"    ` // 姓名
    Gender int    `json:"gender"  ` // 性别: 0=男 1=女
    Phone  string `json:"phone"   ` // 联系电话
    Email  string `json:"email"   ` // 邮箱
    Avatar string `json:"avatar"  ` // 照片

    Dept *Dept `orm:"with:id=dept_id" json:"dept"`
}
```

再使用 `With` 指定关联模型查询：

```go
var emps []*entity.Emp
err = dao.Emp.Ctx(ctx).With(entity.Dept{}).Scan(&emps)
```

不用 `With` 指定关联的话，查询出的结果中 `Dept` 为 `nil`。

**查询所有员工，并关联查询出部门与爱好**

修改 `entity.Emp`，加入关联信息：

`internal/model/entity/emp.go`

```go
type Emp struct {
    Id     uint   `json:"id"      ` // ID
    DeptId uint   `json:"dept_id" ` // 所属部门
    Name   string `json:"name"    ` // 姓名
    Gender int    `json:"gender"  ` // 性别: 0=男 1=女
    Phone  string `json:"phone"   ` // 联系电话
    Email  string `json:"email"   ` // 邮箱
    Avatar string `json:"avatar"  ` // 照片

    Dept  *Dept  `orm:"with:id=dept_id" json:"dept"`
    Hobby *Hobby `orm:"with:emp_id=id" json:"hobby"`
}
```

使用 `With` 指定需要关联的内容：

```go
var emps []*entity.Emp
err = dao.Emp.Ctx(ctx).With(entity.Dept{}, entity.Hobby{}).Where("dept_id", 101).Scan(&emps)
```

也可以用 `WithAll` 关联所有：

```go
var emps []*entity.Emp
err = dao.Emp.Ctx(ctx).WithAll().Where("dept_id", 101).Scan(&emps)
```

**查询部门，关联查询出每个部门的员工**

修改 `entity.Dept`，加入关联信息：

`internal/model/entity/dept.go`

```go
// Dept is the golang structure for table dept.
type Dept struct {
    Id     uint   `json:"id"     ` // ID
    Pid    uint   `json:"pid"    ` // 上级部门ID
    Name   string `json:"name"   ` // 部门名称
    Leader string `json:"leader" ` // 部门领导
    Phone  string `json:"phone"  ` // 联系电话

    Emps []*Emp `orm:"with:dept_id=id" json:"emps"`
}
```

查询：

```go
var depts []*entity.Dept
err = dao.Dept.Ctx(ctx).With(entity.Emp{}).Scan(&depts)
```

上述关联查询直接在实体类里面修改，但实体类里的内容是用工具自动生成的，一般情况下不要修改。所以在进行关联查询时，需要重新自定义结构体，只需要保留需要查询的字段即可（用于关联的字段必须存在）：

```go
type MyDept struct {
    g.Meta `orm:"table:dept"`
    Id     uint   `json:"id"     ` // ID
    Name   string `json:"name"   ` // 部门名称
    Leader string `json:"leader" ` // 部门领导
    Phone  string `json:"phone"  ` // 联系电话
}

type MyEmp struct {
    g.Meta `orm:"table:emp"`
    Id     uint   `json:"id"      ` // ID
    DeptId uint   `json:"dept_id" ` // 所属部门
    Name   string `json:"name"    ` // 姓名
    Phone  string `json:"phone"   ` // 联系电话

    Dept *MyDept `orm:"with:id=dept_id" json:"dept"`
}

var emps []*MyEmp
err = dao.Emp.Ctx(ctx).With(MyDept{}).Scan(&emps)
```

自定义结构体时，需要用 `g.Meta` 及 `orm` 标签指定对应的数据表。
