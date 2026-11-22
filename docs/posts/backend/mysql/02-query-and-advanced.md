---
title: MySQL 常用命令：查询、连接与事务
author: yizhiyang
date: 2026-11-20
category:
  - 后端
tag:
  - MySQL
  - 学习笔记
---

本文在前篇基础上继续深入，涵盖条件查询与运算符、分组函数与别名、表与表之间的三种关系、笛卡尔积与各类连接查询，以及索引、事务和锁的使用。

<!-- more -->

## 查询语句详解

### 建库建表并插入数据

创建一个 `school` 数据库，其中包含一张班级表 `class`，字段为编号（id）、姓名（name）、邮件（email）和成绩（score）：

```sql
create database school;
```

```sql
CREATE TABLE class (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255),
  `email` varchar(255),
  `score` tinyint(4),
  PRIMARY KEY (`id`)
);
```

`PRIMARY KEY (id)` 表示 id 为主键，使 id 值唯一、不得重复。

给班级表 `class` 新增若干学员记录：

```sql
INSERT INTO `class` VALUES (1, '张三', 'itying@qq.com', 89);
INSERT INTO `class` VALUES (2, '李四', '441@qq.com', 87);
INSERT INTO `class` VALUES (3, '王五', 'nodejs@qq.com', 98);
INSERT INTO `class` VALUES (4, '赵四', 'java@qq.com', 59);
INSERT INTO `class` VALUES (5, '小马', '888@qq.com', 66);
INSERT INTO `class` VALUES (6, '小李', '999@hotmail.com', 88);
INSERT INTO `class` VALUES (7, '小张', 'golang@163.com', 55);
```

查看班级所有字段的记录，以及仅查看 id、name 字段：

```sql
select * from class;
```

```sql
select id, name from class;
```

### WHERE 表达式的常用运算符

| 运算符 | 含义 |
| --- | --- |
| `=` | 等于 |
| `<` | 小于 |
| `>` | 大于 |
| `<=` | 小于或等于 |
| `>=` | 大于或等于 |
| `!=` | 不等于 |
| `IS NOT NULL` | 具有一个值 |
| `IS NULL` | 没有值 |
| `BETWEEN` | 在范围内 |
| `NOT BETWEEN` | 不在范围内 |
| `IN` | 指定的范围 |
| `OR` | 两个条件语句之一为真 |
| `AND` | 两个条件语句都为真 |
| `NOT` | 条件语句不为真 |
| `LIKE` | 搜索列中的指定模式 |

查找 email 不为空的数据：

```sql
select * from class where email is not null;
```

查找 email 为空的数据：

```sql
select * from class where email is null;
```

查找成绩在 70 到 99 之间的数据：

```sql
select * from class where score >= 70 AND score <= 99;
```

```sql
select * from class where score between 70 and 99;
```

```sql
select * from class where score not between 70 and 99;
```

查找 score 为 89 或 98 的数据：

```sql
select * from class where score in (89, 98);
```

查找 score 不是 89 或 98 的数据：

```sql
select * from class where score not in (89, 98);
```

`OR` 与 `AND`：

```sql
select * from class where score = 87 or score = 88;
```

```sql
select * from class where score >= 70 AND score <= 99;
```

模糊查询：

```sql
select * from class where email like "%qq%";
```

```sql
select * from class where email like "ja%"; -- ja 开头的
```

```sql
select * from class where email like "%163.com"; -- 163 结尾的
```

```sql
select * from class where email not like "%163.com"; -- 不是 163 结尾的
```

## 分组函数

| 函数 | 用法 | 描述 |
| --- | --- | --- |
| AVG() | `AVG(column)` | 返回列的平均值 |
| COUNT() | `COUNT(column)` | 统计行数 |
| MAX() | `MAX(column)` | 求列中的最大值 |
| MIN() | `MIN(column)` | 求列中的最小值 |
| SUM() | `SUM(column)` | 求列中的和 |

统计班级的平均分：

```sql
select avg(score) from class;
```

统计班级一共多少人：

```sql
select count(1) from class;
```

找出这个班成绩最高的学生：

```sql
select max(score) from class;
```

```sql
select * from class where score in (select max(score) from class);
```

找出这个班成绩最低的学生：

```sql
select min(score) from class;
```

```sql
select * from class where score in (select min(score) from class);
```

统计这个班的总分：

```sql
select sum(score) from class;
```

## 别名

使用 `as` 为列或聚合结果起别名：

```sql
select name as a from class;
```

```sql
select min(score) as minscore from class;
```

## 表与表之间的三种关系

表与表之间一般存在三种关系：一对一、一对多和多对多。

### 一对一

查找文章并显示每篇文章的分类：

```sql
select article.id as id, article.title as title, article_cate.title as cate
from article, article_cate
where article.cate_id = article_cate.id;
```

```sql
select article.id as id, article.title as title, article_cate.title as cate
from article INNER JOIN article_cate ON article_cate.id = article.cate_id;
```

### 一对多

查看「国内新闻」分类下面的所有文章：

```sql
select * from article where cate_id = 2;
```

### 多对多

一个学生可以选修多门课程，一门课程也可以被多个学生选修。

查询张三（id 为 1）选修了哪些课程，普通查询：

```sql
SELECT * FROM lesson
where id in (select lesson_id from lesson_student WHERE student_id = 1);
```

笛卡尔积关联查询：

```sql
SELECT * FROM lesson, lesson_student
where lesson.id = lesson_student.lesson_id AND lesson_student.student_id = 1;
```

内连接：

```sql
SELECT * FROM lesson INNER JOIN lesson_student
ON lesson.id = lesson_student.lesson_id AND lesson_student.student_id = 1;
```

查询「Java 程序设计」（id 为 2）被哪些学生选修：

```sql
SELECT * FROM student
where id in (select student_id from lesson_student WHERE lesson_id = 2);
```

```sql
SELECT * FROM student, lesson_student
where student.id = lesson_student.student_id AND lesson_student.lesson_id = 2;
```

```sql
SELECT * FROM student INNER JOIN lesson_student
ON student.id = lesson_student.student_id AND lesson_student.lesson_id = 2;
```

## 笛卡尔积连接、内连接、左外连接、右外连接

查询数据时能不用连接语句就尽量不要使用：笛卡尔积连接查询速度最慢，项目中使用较多的是内连接。

笛卡尔积连接：

```sql
SELECT * FROM student, lesson_student
where student.id = lesson_student.student_id AND lesson_student.lesson_id = 2;
```

内连接：

```sql
SELECT * FROM student INNER JOIN lesson_student
ON student.id = lesson_student.student_id AND lesson_student.lesson_id = 2;
```

左外连接：

```sql
SELECT * FROM student LEFT JOIN lesson_student
ON student.id = lesson_student.student_id AND lesson_student.lesson_id = 2;
```

右外连接：

```sql
SELECT * FROM student RIGHT JOIN lesson_student
ON student.id = lesson_student.student_id AND lesson_student.lesson_id = 2;
```

## 索引

MySQL 索引的建立对高效运行很重要，可以大大提高检索速度。如果没有索引，查询时必须从第一条记录开始扫描整张表，直到找到符合要求的记录；有了索引后，MySQL 无须扫描任何记录即可顺序找到目标记录的位置。简单来说，索引就是提高查找数据的速度，数据量越多效果越明显。

MySQL 中常见的索引类型有普通索引、唯一索引、全文索引和空间索引（Spatial）。

可以用 50 万条数据来演示（通过自插入快速扩充数据）：

```sql
INSERT INTO users (`username`) SELECT username from users;
```

### 创建普通索引

基本语法：

```sql
CREATE INDEX indexName ON mytable(username);
```

示例：

```sql
create index index_name on class(name);
```

### 查看索引

```sql
show index from table_name;
```

```sql
show index from class;
```

```sql
show index from class\G;
```

### 删除索引

```sql
drop index index_name on class;
```

### 创建唯一索引

主键是一种唯一索引。创建唯一索引：

```sql
create unique index index_name on class(name);
```

### 通过 alter table 创建和删除索引

```sql
alter table class add index index_name(name);
```

```sql
alter table class add unique index_name(name);
```

```sql
alter table class drop index index_name;
```

也可以使用可视化工具创建索引。

## 事务

事务处理用来维护数据库的完整性，保证成批的 SQL 语句要么全部执行，要么全部不执行。

准备一张 `user` 账户表：

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `balance` decimal(10, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;
```

```sql
INSERT INTO `user` VALUES (1, '张三', 100.00);
INSERT INTO `user` VALUES (2, '李四', 100.00);

SET FOREIGN_KEY_CHECKS = 1;
```

例如张三账户转出 100 元到李四的账户，需要两步：

1. 张三账户减去 100 元；
2. 李四账户增加 100 元。

```sql
UPDATE user set balance = balance - 100 WHERE id = 1;
UPDATE user set balance = balance + 100 WHERE id = 2;
```

如果更新完张三的账户后，准备更新李四账户时出现了错误（如程序错误、数据库无法连接、异常断电等），就会导致数据不一致。为了保证数据的一致性，可以使用事务。

MySQL 中用 `BEGIN`、`ROLLBACK`、`COMMIT` 来实现事务：

- `BEGIN`：开始一个事务
- `ROLLBACK`：事务回滚
- `COMMIT`：事务确认

回滚示例：

```sql
begin;
update user set balance = balance - 100 where id = 1;
rollback;
```

提交示例：

```sql
begin;
update user set balance = balance - 100 where id = 1;
update user set balance = balance + 100 where id = 2;
commit;
```

## 锁

MySQL 中的锁有表级锁和行级锁，这里主要介绍最常用的表级锁。

### 读锁

可以并发读，但不能并发写：读锁期间，释放锁之前不能进行写操作。

使用场景：读取结果集的最新版本，同时防止其他事务更新该结果集；主要用于需要数据依存关系时确认某行记录是否存在，并确保没有人对此记录进行 UPDATE 或 DELETE 操作。

```sql
lock table user read;
```

```sql
unlock tables;
```

### 写锁

只有加锁的用户可以进行读写操作，其他用户不行，适用于并发下对商品库存的操作。

```sql
lock table user write;
```

```sql
unlock tables;
```

## 小结

- 条件查询通过 `WHERE` 配合比较、`BETWEEN`、`IN`、`LIKE`、`AND`/`OR` 等运算符实现。
- 分组函数 `AVG`、`COUNT`、`MAX`、`MIN`、`SUM` 用于统计，可用 `as` 为结果起别名。
- 表关系分为一对一、一对多、多对多；关联查询可用笛卡尔积、`INNER JOIN`、`LEFT JOIN`、`RIGHT JOIN`，项目中优先使用内连接。
- 索引能大幅提升检索速度，分为普通索引、唯一索引、全文索引和空间索引，可用 `CREATE INDEX` / `DROP INDEX` 或 `ALTER TABLE` 管理。
- 事务用 `BEGIN`、`ROLLBACK`、`COMMIT` 保证成批 SQL 要么全执行、要么全不执行。
- 表级锁分为读锁和写锁：读锁期间不能写，写锁只允许加锁用户读写，用完需 `unlock tables` 释放。
