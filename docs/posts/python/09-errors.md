---
title: Python（V3.0）基础 · 错误与异常
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - Python
  - 异常处理
  - 学习笔记
---

# 错误与异常

认识错误与异常的区别，掌握异常捕获、手动抛出、传递机制与自定义异常类的写法。

<!-- more -->


```python
print(add.__annotations__)
```


## 1. 错误与异常

错误：代码本身有语法错误，解释器无法执行代码。无法通过异常处理机制解决。
————

```python
age = 18
if age >= 18
 print('成年人')
```

异常：代码在语法上没问题，但执行过程中出现了问题。可以通过异常处理机制解
————
决。

```python
result = '10' + 5
# 3.AttributeError: 当对象没有指定的属性或方法时触发。
# 演示 1
class Person:
 def __init__(self, name, age):
  self.name = name
  self.age = age
p1 = Person('张三', 18)
print(p1.name)
print(p1.age)
print(p1.gender)
# 演示 2
nums = [10, 20, 30]
nums.add(40)
# 4.IndexError：当索引超出范围（索引越界）时触发。
nums = [10, 20, 30, 40]
print(nums[4])
# 5.NameError：当使用了不存在的变量时触发。
print(school)
# 6.KeyError：当访问字典中不存在的 key 时触发。
person = {'name':'张三', 'age':18}
print(person['gender'])
# 7.ValueError：当值不合法，但类型正确时触发。
int('hello')
```

Python 中异常类的继承关系（层级关系）如下（了解即可）：
官方地址：https://docs.python.org/zh-cn/3.13/library/exceptions.html#exception-
hierarchy
其中：BaseException 是所有异常类的父类，Exception 中包含的是开发中常见的业务异常。

```text
 UserWarning
└──
```


## 2. 异常处理


### 1 为什么要进行异常处理

程序运行过程中出现的异常，如果得不到处理，那程序就会立即崩溃，导致后续代码无法

执行。
异常处理不是让异常消失，而是将异常捕获到，随后根据异常的具体情况，来执行指定的

逻辑。

```python
print('欢迎使用本程序')
a = int(input('请输入第一个数：'))
b = int(input('请输入第二个数：'))
result = a / b
print(f'{a}除以{b}的结果是：{result}')
print('*******我是后续的其它逻辑1*******')
print('*******我是后续的其它逻辑2*******')
```


### 2 异常处理（初级）

核心规则如下：
将可能出现异常的代码放在 try 中，出现异常后的处理代码写在 except 中。
1.
如果 try 中的代码出现异常，那 try 中的后续代码不会执行，并自动跳转到 except 中。
2.
如果 try 中的代码没有异常，那 except 中的代码就不会执行。
3.
无论是否发生异常，try-except 后面的代码都会继续执行。
4.
5. 直接写 except 捕获到 Python 中所有的异常————实际开发中不推荐这样做。

```python
print('欢迎使用本程序')
try:
 a = int(input('请输入第一个数：'))
 b = int(input('请输入第二个数：'))
 result = a / b
 print(f'{a}除以{b}的结果是：{result}')
except:
 print('抱歉，程序出现了异常！')
print('*******我是后续的其它逻辑1*******')
print('*******我是后续的其它逻辑2*******')
```


### 3 捕获指定的类型的异常


```python
print('欢迎使用本程序')
try:
 a = int(input('请输入第一个数：'))
 b = int(input('请输入第二个数：'))
 result = a / b
 print(f'{a}除以{b}的结果是：{result}')
except ZeroDivisionError:
 print('程序异常：0不能作为除数！')
except ValueError:
 print('程序异常：您输入的必须是数字！')
print('*******我是后续的其它逻辑1*******')
print('*******我是后续的其它逻辑2*******')
```


### 4 验证异常类之间的继承关系


```python
print(issubclass(KeyboardInterrupt, BaseException))
```


### 多个 except


### ️5

多个 except 从上往下匹配，匹配成功后不再向下匹配。

```python
print('欢迎使用本程序')
try:
 a = int(input('请输入第一个数：'))
 b = int(input('请输入第二个数：'))
 print(x)
 result = a / b
 print(f'{a}除以{b}的结果是：{result}')
except ZeroDivisionError:
 print('程序异常：0不能作为除数！')
except ValueError:
 print('程序异常：您输入的必须是数字！')
except Exception:
 print('程序异常!')
print('*******我是后续的其它逻辑1*******')
print('*******我是后续的其它逻辑2*******')
```


### 6 获取异常的具体信息

备注：通过 e 变量，可以获取异常相关的信息，也可以借助 traceback 去格式化异常信息。

```python
 print('程序异常：0不能作为除数！')
except ValueError:
 print('程序异常：您输入的必须是数字！')
except Exception as e:
 print(f' 程序异常，异常信息：{e}')
   ⚠
 print(f' 程序异常，异常类型：{type(e)}')
   ⚠
 print(f' 程序异常，异常参数：{e.args}')
   ⚠
 print(f' 程序异常，异常的文件：{e.__traceback__.tb_frame.f_code.co_filename}')
   ⚠
 print(f' 程序异常，异常的具体行数：{e.__traceback__.tb_lineno}')
   ⚠
 # 通过 traceback 来回溯异常
 # import traceback
 # print(traceback.format_exc())
print('*******我是后续的其它逻辑1*******')
print('*******我是后续的其它逻辑2*******')
```


### 7 一个 except 捕获不同的异常


### 8 完整写法

try：尝试去做可能会出现异常的事情。
1.
except：出现异常时的处理（出现异常时怎么补救）。
2.
else：如果一切顺利（没有异常出现）要做的事。
3.
4. finall：无论有没有异常，都要做的事。

```python
print('欢迎使用本程序')
try:
 a = int(input('请输入第一个数：'))
 b = int(input('请输入第二个数：'))
 result = a / b
 print(f'{a}除以{b}的结果是：{result}')
except (ZeroDivisionError, ValueError, Exception) as e:
 if isinstance(e, ZeroDivisionError):
  print('程序异常：0不能作为除数！')
 elif isinstance(e, ValueError):
  print('程序异常：您输入的必须是数字！')
 else:
  print(f'程序异常：{e}')
else:
 print('挺好的，try中的代码没有任何异常！')
finally:
 print('无论有没有异常，我的计算都结束了！')
print('*******我是后续的其它逻辑1*******')
print('*******我是后续的其它逻辑2*******')
```


## 3. 手动抛出异常

当程序遇到不符合预期情况时，可以使用 raise 语句手动触发（抛出）异常。

```python
print('欢迎使用年龄判断系统')
try:
 age = int(input('请输入你的年龄：'))
 if 18 <= age <= 120:
  print('成年')
 elif 0 <= age < 18:
  print('未成年')
 else:
  # print('输入的年龄有误！（年龄应该为 0~120的整数）')
  raise ValueError('年龄应该为 0~120的整数')
except Exception as e:
 print(f'程序异常：{e}')
```


## 4. 异常的传递机制

如果异常没有被当前代码块所捕获处理，那该异常就会沿着调用链，逐层传递给其调用
1.
者。
如果所有调用者，都没有捕获该异常，那最终程序将因【未处理异常】而意外终止。
2.

```python
 test2()
 print('******test3结束******')
test3()
```

执行以上代码，控制最终会输出

```text
******test3开始******
******test2开始******
******test1开始******
程序异常：can only concatenate str (not "int") to str
******test2结束******
******test3结束******
```


## 5. 自定义异常类

1. 由开发人员自己定义一个异常类，用来表示代码中“更具体、更有业务含义”的异常。
具体规则：定义一个类（类名通常以 Error 结尾），继承 Exception 类或它的子类。
2.
