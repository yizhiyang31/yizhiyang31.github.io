---
title: Go 语言基础：time 包与日期函数
author: yizhiyang
date: 2026-11-09
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖`time.Now()` 获取当前时间、`Format` 格式化、时间戳互转、时间间隔与 `Add` / `Sub` 等时间操作，以及定时器 `Ticker`。

<!-- more -->

## 获取当前时间

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()
	fmt.Printf("%d-%02d-%02d %02d:%02d:%02d\n",
		now.Year(), now.Month(), now.Day(),
		now.Hour(), now.Minute(), now.Second())
}
```

`%02d` 中的 `2` 表示宽度，不足两位时前面补 `0`。

## Format 格式化

Go 的格式化模板很特别：用它的「出生时间」作为模板——`2006年1月2号15点04分 Mon Jan`。

- `2006` 年、`01` 月、`02` 日
- `15` 是 24 小时制，`03` 是 12 小时制
- `04` 分、`05` 秒

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()
	fmt.Println(now.Format("2006-01-02 15:04:05"))
	fmt.Println(now.Format("2006/01/02 03:04:05 PM"))
}
```

## 时间戳

时间戳是从 1970-01-01 00:00:00 UTC（东八区为 08:00:00）到当前的秒数或纳秒数。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()
	fmt.Println(now.Unix())      // 秒级时间戳
	fmt.Println(now.UnixNano())  // 纳秒级时间戳

	t := time.Unix(1587880013, 0) // 时间戳转时间对象
	fmt.Println(t.Format("2006/01/02 15:04:05"))

	// 日期字符串转时间戳
	stamp, err := time.ParseInLocation("2006-01-02 15:04:05", "2019-01-08 13:50:30", time.Local)
	if err == nil {
		fmt.Println(stamp.Unix())
	}
}
```

注意用 `ParseInLocation` 而不是 `Parse`，明确指定时区（`time.Local`）。

## 时间间隔与时间操作

`time.Duration` 以纳秒为单位，能表示的最大间隔约 290 年。常用常量：

```go
time.Nanosecond // 1 纳秒
time.Microsecond
time.Millisecond
time.Second
time.Minute
time.Hour
```

时间操作方法：

| 方法 | 说明 |
| --- | --- |
| `Add(d Duration)` | 返回加上时间间隔后的时间 |
| `Sub(t Time)` | 返回两个时间的差，即 `t - u` |
| `Equal(u Time)` | 判断两个时刻是否相等，会考虑时区 |
| `Before(u Time)` | 是否在 u 之前 |
| `After(u Time)` | 是否在 u 之后 |

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()
	t := time.Unix(1587880013, 0)

	fmt.Println(now.Add(time.Hour))   // 一小时后
	fmt.Println(now.Sub(t))           // 时间差
	fmt.Println(now.Before(t))
	fmt.Println(now.After(t))
	fmt.Println(now.Equal(t))         // 注意：不同于 ==，== 还会比较地点和时区
}
```

## 定时器

`time.NewTicker` 创建一个按固定间隔发送时间的 channel，用完要调用 `Stop()`：

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	n := 0
	for t := range ticker.C {
		fmt.Println(t)
		n++
		if n >= 5 {
			return
		}
	}
}
```

只延时一次的场景直接用 `time.Sleep(time.Second)`。

## 小结

- `Format` 模板必须写成 `2006-01-02 15:04:05` 这一组固定数字。
- 时间戳互转用 `Unix()` / `UnixNano()` 和 `time.Unix()`；字符串转时间戳用 `ParseInLocation`。
- 时间间隔类型是 `time.Duration`，配合 `Add` / `Sub` / `Before` / `After` 使用。
- 周期性任务用 `Ticker`，一次性延时的用 `Sleep`。

