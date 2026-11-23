---
title: Python（V3.0）基础 · 文件操作
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - Python
  - 文件操作
  - 学习笔记
---

# 文件操作

掌握文件分类与路径概念，学习读写流程、with 上下文、flush 机制、目录操作及组合模式。

<!-- more -->


```python
nums = [10, 20, 30, 40]
# 列表推导式
result1 = [n * 2 for n in nums]
print(result1)
# 生成器表达式（和列表推导式很像，不要搞混）
result2 = (n * 2 for n in nums)
for item in result2:
 print(item)
```


## 1. 文件的分类


### 1 纯文本文件

读取和存储时，要遵循某种『字符编码』规范（如：UTF-8 等）进行编码和解码，最终以
1.
『二进制』的形式存储。
『纯文本文件』最终会呈现为：可以直接阅读的文本信息。
2.
常见的『纯文本文件』有：.txt .py .md .html 等。
3.

### 2 二进制文件

1. 读取和存储时，不涉及字符编码，会按照某种『文件格式规范』把内容转为『二进制』进
行存储。
二进制文件需要由『能够识别其格式的软件』进行解析，最终的呈现形式多种多样（音
2.
频、视频、图像、幻灯片等）。
常见的二进制文件有：.mp3 .mp4 .doc .ppt .jpg .png 等。
3.

## 2. 绝对路径 vs 相对路径


### 1 绝对路径：

从文件系统的『根目录』开始，完整描述文件或目录所在的位置。
举例：D:/demo/test/a.txt

### 2 相对路径：

以当前『工作目录』为参照，描述目标文件或目录相对于它的位置。
举例：../../a.txt（其中..表示上一级目录）

## 3. Python 中操作文件的标准流程

标准流程成如下：
创建『文件对象』
1.
操作文件（读取、写入等）
2.
关闭文件
3.
文件操作的核心—— open 函数
open 函数最常用的三个参数如下：
file：要操作的文件路径
1.
2. mode：文件的打开模式
r ：读取（默认值）
w ：写入，并先截断文件
x ：排它性创建，如果文件已存在，则创建失败
a ：打开文件用于写入，如果文件存在，则在文件末尾追加内容
b ：二进制模式
t ：文本模式（默认值）
+ ：打开用于更新（读取与写入）
encoding：字符编码
3.

## 4. 读取文件


### 1 read 方法

概述：使用『文件对象』的 read 方法，读取文件中的内容。
方法说明：

read(size)中的 size 是可选参数。
1.
若不传递 size 参数，表示：读取文件中所有的内容（注意内存占用！）。
若传递了 size 参数，表示：读取文件中指定个数的字符，或指定大小的字节。
read 会从上一次 read 的位置继续读取，若到达文件末尾后继续读取，将返回空字符串。
2.
示例代码：

```python
# file = open('D:/test/atguigu.txt', 'rt', encoding='utf-8')
# 读取二进制文件
# file = open('D:/test/girl.jpg', 'rb')
# 第二步：操作文件（读取）
# 多次调用read去逐步读取文件
r1 = file.read(2)
r2 = file.read(3)
r3 = file.read(4)
r4 = file.read()
print(r1, end='')
print(r2, end='')
print(r3, end='')
print(r4, end='')
# 用循环配合多次read（对内存友好）
while True:
 result = file.read(10)
 if result == '':
  break
 print(result, end='')
# 第三步：关闭文件
file.close()
```


### 2 readline 方法

概述：使用文件对象的 readline 方法，读取文件中的一行。
方法说明：

readline(size) 中的 size 是可选参数。
1.
若不传递 size 参数，表示：读取当前这一行所有的内容。
若传递了 size 参数，表示：表示读取当前行时，最多能读取的字符数，或字节数
注意：size 不是行数。
readline 方法，也是从上一次位置继续读取，若到达文件末尾后继续读取，返回空字符
2.
串。
示例代码：

```text
file.close()
```


### 3 for 循环遍历文件对象

概述：可以使用 for 循环直接遍历文件对象（逐行遍历）。
示例代码：


```python
# 第一步：创建『文件对象』
file = open('a.txt', 'rt', encoding='utf-8')
# 第二步：操作文件（读取）
for line in file:
 print(line, end='')
# 第三步：关闭文件
file.close()
```


### 4 readlines 方法

概述：使用文件对象的 readlines 方法，一次性按行读完，返回一个列表。
“”
方法说明：
readlines(hint) 中的 hint 是可选参数。
1.
若不传递 hint 参数，表示：读取当前文件的所有行。
若传递了 hint 参数，表示：期望读取的【字符个数或字节数】（hint 不是行数）。
注意：由于 readlines 是一次性读取文件的所有内容，所以不适合读取体积较大的文件。
2.
示例代码：

```python
# 第一步：创建『文件对象』
file = open('a.txt', 'rt', encoding='utf-8')
# 第二步：操作文件（读取）
result = file.readlines()
print(result)
# 第三步：关闭文件
file.close()
```


### 最佳实践


### ⭐

概述：更推荐使用 with 上下文管理器，结合 for 循环遍历，逐行读取文件。


```python
with open('a.txt', 'rt', encoding='utf-8') as file:
 for line in file:
  print(line, end='')
```


## 5. 关于 with

概述：Python 中的 with 主要用于管理程序中需要成对出现的操作，例如：
“”
上锁 / 解锁
打开 / 关闭
借用 / 归还
使用 with 的目标：编码者只管做具体的事，进入和离开的事，让 Python 自动处理。
“”“”
语法格式：

```text
with 能得到一个上下文管理器的表达式 as 变量:
 具体的事1
 具体的事2
 具体的事3
```

上下文管理器协议：
__enter__ 方法：with 中的代码执行【之前】调用，其返回值会赋值给 as 后的变量。
1.
__exit__ 方法：with 中的代码执行【结束后】调用（无论是 with 中否出现异常都会调
2.
用）。
测试代码：

```python
 # 返回假：表示异常【没有】被处理，异常【会】被继续抛出。
    “”
 def __exit__(self, exc_type, exc_val, exc_tb):
  print('-----我是离开的逻辑-----')
  # exc_type : 异常类型
  # exc_val : 异常对象
  # exc_tb : 异常追踪信息
  if exc_type:
   print(f'异常类型：{exc_type}')
   print(f'异常对象：{exc_val}')
   print(f'异常追踪信息：{exc_tb}')
  return True
# 1.计算 with 后面的表达式，得到一个『上下文管理器』。
# 2.调用『上下文管理器』的 __enter__() 方法，并将其返回值赋给 as 后面的变量。
# 3.执行 with 所管理的代码。
# 4.无论代 with 中的代码，是正常结束，还是发生异常，都会自动调用『上下文管理器』的
__exit__ 方法。
with Person('张三', 18) as p1:
 p1.speak()
 # p1.study()
 print(666)
```


## 6. 写入文件


### 1 w 模式

概述：w 模式是写入模式，写入前会先截断文件（清空文件）。

代码：

```text
with open('b.txt', 'wt', encoding='utf-8') as file:
 file.write('你好')
```


### 2 x 模式

概述：x 模式是排它性创建，如果文件已存在，则创建失败。

代码：

```text
with open('demo.txt', 'xt', encoding='utf-8') as file:
 file.write('你好')
```


### 3 a 模式

概述：打开文件用于写入，如果文件存在，则在文件末尾追加内容。
代码：

```text
with open('a.txt', 'at', encoding='utf-8') as file:
 file.write('你好')
```


## 7. flush 方法

概述：Python 写入文件时，并不是每写一次就立刻落盘，而是：先写到缓冲区里。
“”
 flush 方法：把缓冲区中的数据，立刻写入到文件中。
测试代码：


```python
import time
with open('demo.txt', 'at', encoding='utf-8') as file:
 file.write('你好1')
 file.write('你好2')
 file.flush()
 time.sleep(10000)
 file.write('你好3')
 file.write('你好4')
```


## 8. 组合模式


### 1 rt+模式

概述：r 模式可以读取，+模式可以更新（读取或写入），所以 rt+模式可读可写。
注意：r 模式打开文件后，文件指针在起始位置。
备注：由于 t 是默认值，所以 rt+中的 t 可以省略。

代码：

### 2 wt+模式

概述：w 模式可以写入，+模式可以用于更新（读取或写入），所以 wt+模式可读可写。

注意：w 模式打开文件后，文件指针在起始位置，但 write 方法执行完后，指针在文件结
束位置。
备注：由于 t 是默认值，所以 wt+中的 t 可以省略。
代码：

```python
with open('a.txt', 'wt+', encoding='utf-8') as file:
 file.write('你好')
 file.seek(0, 0)
 result = file.read()
 print(result)
```


### 3 xt+模式

概述：x 模式可以写入，+模式可以用于更新（读取或写入），所以 xt+模式可读可写。
注意：x 模式打开文件后，文件指针在起始位置。

备注：由于 t 是默认值，所以 xt+中的 t 可以省略。
代码：

### 3 at+模式

概述：a 模式可以追加内容，+模式可以用于更新（读取或写入），所以 at+模式可读可

写。
注意：a 模式打开文件后，文件指针在结束位置。

备注：由于 t 是默认值，所以 at+中的 t 可以省略。
代码：

```python
with open('a.txt', 'at+', encoding='utf-8') as file:
 file.write('你好')
 file.seek(0, 0)
 result = file.read()
 print(result)
```


## 9. 目录操作

Python 中常见的目录操作如下：

## 10. 两个小练习

练习 1：将一个二进制文件复制到指定位置。

```python
import os
# 源文件
source = 'music.mp3'
# 目标目录
target = 'D:/media'
# 如果目标目录不存在，那就去创建
if not os.path.isdir(target):
 os.makedirs(target)
with open(source, 'rb') as f1, open(target + '/' + 'my_music.mp3', 'wb') as f2:
 while True:
  # 每次只读取1KB
  data = f1.read(1024)
  # 如果文件读取完毕了，就跳出循环
  if not data:
   break
  # 向目标文件中写入数据
  f2.write(data)
 print('复制完毕')
```

练习 2：日志记录，需求如下：
用户输入用户名和密码后，程序进行校验：
1.
用户名不存在，提示用户名未注册，并记录日志。
2. “”
用户名存在，但密码错误，提示密码错误，并记录日志。
3. “”
4. 用户名和密码均正确，提示“登录成功”，并记录日志。
