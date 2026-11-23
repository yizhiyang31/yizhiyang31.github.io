---
title: Python（V3.0）基础 · 迭代器 vs 生成器
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - Python
  - 迭代器
  - 学习笔记
---

# 迭代器 vs 生成器

理解可迭代对象与迭代器的工作原理，学习生成器函数及 yield 的惰性求值特性。

<!-- more -->


## 1. 迭代器

先区分两个概念：可迭代对象（iterable）、迭代器（iterator）

### 1 可迭代对象（iterable）

概念：能被 for 循环遍历的对象，就是可迭代对象（iterable）
如下这些都是可迭代对象（iterable）：

```python
names = ['张三', '李四', '王五']
citys = ('北京', '上海', '深圳')
msg = 'hello'
for item in names:
 print(item)
```

如下这些不是可迭代对象（iterable）：

```python
for item in test:
 print(item)
endregion
```

可迭代对象都拥有__iter__方法。

```python
names = ['张三', '李四', '王五']
citys = ('北京', '上海', '深圳')
msg = 'hello'
age = 10
def test():
 pass
names.__iter__()
citys.__iter__()
msg.__iter__()
print(hasattr(names, '__iter__'))
print(hasattr(citys, '__iter__'))
print(hasattr(msg, '__iter__'))
print(hasattr(age, '__iter__'))
print(hasattr(test, '__iter__'))
```


### 2 迭代器（iterator）

调用__iter__方法会得到：迭代器(iterator)
备注 1：__iter__是一个魔法方法，当调用 iter 函数时，__iter__会自动调用。
备注 2：可迭代对象.__iter__() 等价于： iter(可迭代对象)。
备注 3：如果 iter(obj)能得到一个迭代器(iterator)，那 obj 就是可迭代对象。


```python
msg = 'hello'
print(names.__iter__())
print(citys.__iter__())
print(msg.__iter__())
print(iter(names))
print(iter(citys))
print(iter(msg))
```

迭代器（iterator）拥有__next__方法，每次调用都会根据当前的状态，返回下一个元素。
备注 1：迭代器.__next__() 等价于 next(迭代器)。

备注 2：当所有元素全都取出后，若继续调用__next__，Python 会抛出 StopIteration 异
常。

```python
names = ['张三', '李四', '王五']
it = iter(names)
print(it.__next__())
print(it.__next__())
print(it.__next__())
print(it.__next__())
print(next(it))
print(next(it))
print(next(it))
print(next(it))
```

编写 for 循环遍历 names 列表
for 循环背后的逻辑

```python
names = ['张三', '李四', '王五']
# 1 调用【可迭代对象的__iter__方法】获取到一个迭代器(iterator)
it = iter(names)
# 2 开启一个无限循环
while True:
 try:
  # 3 调用__next__方法，获取下一个元素
  item = next(it)
  print(item)
 except StopIteration:
  # 4 捕获 StopIteration 异常，随后结束循环
  break
```

迭代器（iterator）也拥有__iter__方法，并且其返回值是迭代器自身。
这么设计的原因：让 for 循环也能遍历迭代器（即：为了让 iter(迭代器) 不出错）。

```python
names = ['张三', '李四', '王五']
it = iter(names)
print(it)
result = iter(it)
print(result)
x = iter(result)
print(x)
it = iter(names)
for item in it:
 print(item)
```

迭代器协议：一个对象如果同时满足如下规范，那该对象就是一个迭代器：
能被 iter()接受。
1.
能被 next()一步一步取值。
2.
迭代器是一次性的，状态只会向前推进，且不会自动重置（迭代器在遍历的过程中会被消
“
耗”）。

```python
names = ['张三', '李四', '王五']
it1 = iter(names)
it2 = iter(names)
print(it1)
print(it2)
print(next(it1))
print(next(it1))
print(next(it1))
print(next(it1)) # 此行代码会抛出异常，因为此时迭代器已经被耗尽了
# 如想重新依次获取元素，需要使用新的迭代器 it2
print(next(it2))
print(next(it2))
print(next(it2))
```


### 3 迭代器的应用

需求：让 for 循环可以遍历 Person 的实例对象。
实现方式 1 ：

```python
 print(item)
```

实现方式 2

```python
 print(item)
for item in p1:
 print(item)
```

进阶：迭代器玩的就是__next__

```python
  # 更新迭代器状态（指针位置）
  self.__index += 1
  # 返回value
  return value
# 目标：
# 下面的p1既是可迭代对象，又是迭代器
p1 = Person('zhangsan', 18, '男', '北京昌平')
for item in p1:
 print(item)
```


### 4 迭代器的优势

1. 迭代器是惰性计算，不会一次性生成所有结果，所以能显著降低内存占用。
当数据量很大，不确定要用多少结果时，推荐使用迭代器。
2.
使用迭代器实现【斐波那契数列】：

```python
  if self.index >= self.total:
   raise StopIteration
  # 前两项都是1
  if self.index < 2:
   value = 1
  else:
   # 新的结果等于前两项的和
   value = self.pre + self.cur
   # 更新一下pre和cur
   self.pre = self.cur
   self.cur = value
  # 计数器+1
  self.index += 1
  # 返回value
  return value
```

不使用迭代器实现【斐波那契数列】：

```python
def fibo(total):
 if total <= 0:
  return []
 if total == 1:
  return [1]
 nums = [1, 1]
 for i in range(2, total):
  nums.append(nums[-1] + nums[-2])
 return nums
```

分析内存占用情况：
分别运行如下两段代码后，会发现迭代器实现明显节约内存。

```python
print(f'内存占用是：{m / 1024 / 1024}MB')
tracemalloc.start()
f1 = fibo(0)
m = tracemalloc.get_traced_memory()[1]
print(f'内存占用是：{m / 1024 / 1024}MB')
```


## 2. 生成器


### 1 两个概念

生成器函数：函数体中如果出现了 yield 关键字，那该函数是『生成器函数』。
1.
2. 生成器对象：调用『生成器函数』时，其函数体不会立刻执行，而是返回一个『生成器对
象』。
备注：不管能否执行到 yield 所在的位置，只要函数中有 yield，那该函数就是『生成器函
数』。

```python
def demo():
 print('demo函数开始执行了')
 print(100)
 yield
 a = 200
 print(a)
d = demo()
print(d)
```


### 2 几个细节

写在『生成器函数』中的代码，需要通过『生成器对象』来执行：
调用『生成器对象』的__next__方法，会让『生成器函数』中的代码开始执行。
1.
当『生成器函数』中的代码开始执行后，遇到 yield 会暂停，并会记录暂停的位置。
2. “”“”
后续调用__next__方法时，都会从上一次暂停的位置，继续运行，直到再次遇到
3. “”
yield。
遇到 return 会抛出 StopIteration 异常，并将 return 后面的表达式，作为异常信息。
4.
yield 后面所写的表达式，会作为本次__next__方法的返回值。
5.

```python
def demo():
 print('demo函数开始执行了')
 print(100)
 yield '我是第1个yield所返回的数据'
 a = 200
 print(a)
 yield '我是第2个yield所返回的数据'
 b = 300
 print(b)
 return '尚硅谷'
d = demo()
r1 = next(d)
print(r1)
r2 = next(d)
print(r2)
try:
 next(d)
except StopIteration as e:
 print(e)
```

生成器对象是一种特殊的迭代器（本质是通过 yield 自动实现了迭代器协议）

```python
 print(100)
 yield '我是第1个yield所返回的数据'
 a = 200
 print(a)
 yield '我是第2个yield所返回的数据'
 b = 300
 print(b)
 return '尚硅谷'
d = demo()
# 验证：生成器对象 d，和迭代器一样，也拥有：__iter__ 和 __next__ 方法
print(hasattr(d, '__iter__'))
print(hasattr(d, '__next__'))
# 验证：生成器对象的__iter__方法，和迭代器一样，返回的也是自身
result = iter(d)
print(result == d)
# for循环遍历生成器
for item in d:
 print(item)
# for循环背后的逻辑
gen = iter(d)
while True:
 try:
  value = next(gen)
  print(value)
 except StopIteration:
  break
```

yield 也能写在循环里

```python
 for index in range(1, total + 1):
  yield f'我是第{index}台车'
# cars是生成器对象
cars = create_car(5)
# 调用一次cars的__next__方法，就会得到一台车
c1 = next(cars)
print(c1)
c2 = next(cars)
print(c2)
c3 = next(cars)
print(c3)
c4 = next(cars)
print(c4)
c5 = next(cars)
print(c5)
for car in cars:
 print(car)
endregion
```

yield from 能把一个『可迭代对象』里的东西依次 yield 出去。(替代：for + yield)

```python
r4 = next(d)
print(r4)
for item in d:
 print(item)
```

使用：生成器.send(值) 可以让生成器继续执行的同时，给上一次 yield 传值。
备注 1：next 只能取值，send 既能取值，也能送值。
备注 2：第一次启动生成器，不能传值！（或者说只能传 None 值）

```python
def demo():
 print('demo函数开始执行了')
 print(100)
 a = yield '我是第1个yield所返回的数据'
 print(a)
 b = yield '我是第2个yield所返回的数据'
 print(b)
 return '尚硅谷'
d = demo()
r1 = next(d) # 此处等价于 d.send(None)
print(r1)
r2 = d.send(666)
print(r2)
try:
 d.send(888)
except StopIteration as e:
 print(e)
```


### 3 生成器的应用

用生成器实现遍历 Person 类的实例对象：

```python
class Person:
 def __init__(self, name, age, gender, address):
  self.name = name
  self.age = age
  self.gender = gender
  self.address = address
  self.__attr = [name, age, gender, address]
 def __iter__(self):
  # yield self.name
  # yield self.age
  # yield self.gender
  # yield self.address
  yield from self.__attr
p1 = Person('张三', 18, '男', '北京昌平')
# 目标：
for attr in p1:
 print(attr)
```

用生成器实现斐波那契数列：

```python
f1 = fibo(10)
for item in f1:
 print(item)
```

无论是迭代器，还是生成器对象，都可以用 list、tuple、set 等直接拿到其里面的所有内容
（注意：如果数据量很大，可能会挤爆内存）

```python
def fibo(total):
 pre = 1
 cur = 1
 for index in range(total):
  if index < 2:
   yield 1
  else:
   value = pre + cur
   pre = cur
   cur = value
   yield value
f1 = fibo(10)
result = set(f1)
print(result)
```


### 4 生成器表达式

生成器表达式：一种用类似列表推导式的语法，快速创建生成器对象的方式。
语法格式：(表达式 for 变量 in 可迭代对象)。
什么时候适合用生成器表达式？当每个结果，只依赖当前这一个元素时。
————“”
