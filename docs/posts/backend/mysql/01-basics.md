---
title: MySQL 常用命令：数据库基础与操作
author: yizhiyang
date: 2026-11-19
category:
  - 后端
tag:
  - MySQL
  - 学习笔记
---

本文整理 MySQL 中最常用的基础命令，涵盖数据库的组成与连接方式、建库建表、增删改查、排序统计与分页等 17 条命令，并介绍整数、浮点、字符串、备注和日期等字段数据类型。

<!-- more -->

## 数据库的组成

MySQL 中的数据按层级组织：一个 MySQL 服务可以管理多个数据库（database），每个数据库包含多张数据表（table），而每张表由字段（列）和记录（行）构成。后面介绍的建库、建表、插入数据等命令，正是围绕这一层级展开。

## 数据库的连接

使用 MySQL 客户端连接到数据库服务器后，才能执行后续的库表操作。连接成功后，通过 `use` 命令选择要操作的数据库。

## MySQL 基础命令

注意：mysql 命令忽略大小写。

### 1. 显示当前存在的数据库

```sql
show databases;
```

### 2. 选择需要操作的数据库

```sql
use beegodb;
```

### 3. 查看当前数据库有哪些表

```sql
show tables;
```

### 4. 查看一张表的所有内容

```sql
select * from user;
```

### 5. 设置数据库中文编码

```sql
set names utf8;
```

### 6. 创建一个数据库

```sql
create database book;
```

### 7. 在数据库里创建一张表

```sql
create table users(username varchar(20), sex int(1), status int(1));
```

### 8. 显示表的结构

```sql
describe users;
```

### 9. 给表插入一条数据

```sql
insert into users(username, sex, status) values ("itying", 1, 1);
```

### 10. 根据条件筛选指定的数据

```sql
SELECT * FROM users WHERE username = 'itying';
```

### 11. 修改指定的数据

```sql
UPDATE users SET status = 10 WHERE username = 'itying';
```

### 12. 删除指定的数据

```sql
DELETE FROM users WHERE username = 'php';
```

### 13. 按指定的字段排序

```sql
SELECT * FROM users ORDER BY status DESC; -- 按照 status 倒序排序
```

### 14. 统计数量

```sql
select count(1) from nav;
```

### 15. 限制查询条数（Limit）

```sql
select id, name from nav limit 2;
```

```sql
select id, name from nav limit 2, 2;
```

`limit 2` 表示取前 2 条记录；`limit 2, 2` 表示从第 3 条记录开始，取 2 条记录。

### 16. 删除指定的表

```sql
DROP TABLE test;
```

### 17. 删除指定的数据库

```sql
DROP DATABASE book;
```

## MySQL 字段的常用数据类型

MySQL 字段的常见类型包括：

- 整数型：TINYINT、SMALLINT、MEDIUMINT、INT、BIGINT
- 浮点型：FLOAT、DOUBLE、DECIMAL(M,D)
- 字符型：CHAR、VARCHAR
- 备注型：TINYTEXT、TEXT、MEDIUMTEXT、LONGTEXT
- 日期型：DATETIME、DATE、TIMESTAMP、TIME、YEAR

### 整数型

| 类型 | 字节 | 最小值（带符号） | 最大值（带符号） | 最小值（无符号） | 最大值（无符号） |
| --- | --- | --- | --- | --- | --- |
| TINYINT | 1 | -128 | 127 | 0 | 255 |
| SMALLINT | 2 | -32768 | 32767 | 0 | 65535 |
| MEDIUMINT | 3 | -8388608 | 8388607 | 0 | 16777215 |
| INT | 4 | -2147483648 | 2147483647 | 0 | 4294967295 |
| BIGINT | 8 | -9223372036854775808 | 9223372036854775807 | 0 | 18446744073709551615 |

各类型的默认显示长度：TINYINT 最大长度 4，SMALLINT 最大长度 6，MEDIUMINT 最大长度 8，INT 最大长度 11，BIGINT 最大长度 20。

建表时如果不指定 int 类型的长度，系统默认生成长度为 11 的字段，其中第一位表示符号（`+` 或 `-`），后面十位表示数字。

`int(M)` 中的 M 表示最大显示宽度，与所占存储空间、数字位数都无关：`int(3)`、`int(4)`、`int(8)` 在磁盘上都占用 4 个字节。`int(11)`、`tinyint(4)`、`bigint(20)` 后面的数字不代表占用空间容量，而是最小显示位数，除非对字段指定了 `zerofill`，否则基本没有意义。因此设计表时直接使用系统自动分配的默认显示长度即可，无须自行填写。

### 浮点型

| 类型 | 字节 | 最小值 | 最大值 |
| --- | --- | --- | --- |
| FLOAT | 4 | ±1.175494351E-38 | ±3.402823466E+38 |
| DOUBLE | 8 | ±2.2250738585072014E-308 | ±1.7976931348623157E+308 |
| DECIMAL | 可变 | 取值范围可变 | 取值范围可变 |

FLOAT 和 DOUBLE 在不指定精度时，默认按照实际的精度（由计算机硬件和操作系统决定）；DECIMAL 如果不指定精度，默认为 `(10, 0)`。

浮点数相对于定点数的优点是在长度一定的情况下能表示更大的范围，缺点是可以引起精度问题。

### 字符串型

CHAR 与 VARCHAR 的存储需求对比：

| 值 | CHAR(4) | CHAR(4) 存储需求 | VARCHAR(4) | VARCHAR(4) 存储需求 |
| --- | --- | --- | --- | --- |
| `''` | `' '` | 4 字节 | `''` | 1 字节 |
| `'ab'` | `'ab '` | 4 字节 | `'ab'` | 3 字节 |
| `'abcd'` | `'abcd'` | 4 字节 | `'abcd'` | 5 字节 |
| `'abcdefgh'` | `'abcd'` | 4 字节 | `'abcd'` | 5 字节 |

CHAR 是定长类型，忘记赋值时会用空格补足；VARCHAR 是可变长类型，使用额外的 1～2 字节存储值长度：列长度小于等于 255 时使用 1 字节，其他情况使用 2 字节。例如 `varchar(10)` 会占用 11 字节，`varchar(500)` 会占用 502 字节。

VARCHAR 的最大长度取决于字符集：若为 GBK，每个汉字占用 2 字节，最大长度不能超过 `65535 / 2 = 32766`；若为 UTF8，每个汉字最多占用 3 字节，最大长度不能超过 `65535 / 3 = 21845`。超过限制时，MySQL 会自动将 varchar 类型转换为 MEDIUMTEXT 或 LONGTEXT。

### 备注型

| 类型 | 描述 |
| --- | --- |
| TINYTEXT | 字符串，最大长度 255 个字符 |
| TEXT | 字符串，最大长度 65535 个字符 |
| MEDIUMTEXT | 字符串，最大长度 16777215 个字符 |
| LONGTEXT | 字符串，最大长度 4294967295 个字符 |

### 日期型

| 列类型 | 零值 |
| --- | --- |
| DATETIME | `0000-00-00 00:00:00` |
| DATE | `0000-00-00` |
| TIMESTAMP | `00000000000000` |
| TIME | `00:00:00` |
| YEAR | `0000` |

实际项目中很少直接使用这些日期类型，存储日期通常使用 int 类型的时间戳。

## 小结

- MySQL 数据按「数据库 → 数据表 → 字段与记录」的层级组织，连接后需先 `use` 选择数据库。
- 基础命令覆盖建库建表、增删改查、排序统计、分页以及删除库表，命令本身忽略大小写。
- `limit n` 取前 n 条，`limit m, n` 从第 m 条开始取 n 条。
- 字段类型分为整数、浮点、字符串、备注和日期等，整数后面的显示宽度与存储空间无关。
- VARCHAR 为变长存储，额外占用 1～2 字节记录长度；项目中日期通常用 int 时间戳保存。
