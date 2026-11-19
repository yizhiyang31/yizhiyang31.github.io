---
title: Go 语言基础：goroutine 与 channel 并发
author: yizhiyang
date: 2026-11-14
category:
  - 后端
tag:
  - Go
  - 并发
  - 学习笔记
---

本文涵盖进程、线程与并发、并行，`goroutine` 和 `sync.WaitGroup`，`channel` 的用法与阻塞规则，单向管道、`select` 多路复用、并发安全与锁，以及协程中的 panic 恢复。

<!-- more -->

## 并发与并行

- **进程**：资源分配和调度的基本单位。
- **线程**：进程的一个执行实例，是程序执行的最小单元。
- **并发**：多个线程在单核上竞争执行，宏观上同时运行。
- **并行**：多核 CPU 同时执行多个线程。

线程数大于 CPU 核数时，系统中同时存在并行和并发。

## goroutine

协程是用户级线程，对内核透明，由程序自行调度。Go 中使用 `go 函数()` 创建 goroutine。

OS 线程栈约 2MB，而 goroutine 栈约 2KB，切换开销也小得多，因此可以轻松创建大量 goroutine。

```go
package main

import (
	"fmt"
	"time"
)

func hello() {
	fmt.Println("hello goroutine")
}

func main() {
	go hello()
	time.Sleep(time.Second) // 等待协程执行
}
```

**主线程退出时，即使 goroutine 还没执行完，程序也会直接退出**，所以需要用 `sync.WaitGroup` 等待：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var wg sync.WaitGroup

func test() {
	defer wg.Done() // 计数器减 1
	for i := 1; i <= 10; i++ {
		fmt.Println("test() 你好golang", i)
		time.Sleep(50 * time.Millisecond)
	}
}

func main() {
	wg.Add(1)  // 计数器加 1
	go test()

	for i := 1; i <= 2; i++ {
		fmt.Println("main() 你好golang", i)
		time.Sleep(50 * time.Millisecond)
	}

	wg.Wait() // 阻塞等待计数器归零
}
```

多个 goroutine 的调度顺序是随机的，打印顺序不固定。

### GOMAXPROCS

`GOMAXPROCS` 决定同时执行 Go 代码的 OS 线程数量，默认等于 CPU 核心数。Go 1.5 之前默认是单核，之后默认使用全部逻辑核心。

## channel 管道

Go 的并发哲学来自 CSP：**通过通信共享内存，而不是通过共享内存实现通信**。channel 就是 goroutine 之间通信的管道，FIFO，带具体元素类型，是引用类型。

```go
ch := make(chan int)    // 无缓冲
ch2 := make(chan int, 10) // 有缓冲，容量 10

ch <- 100  // 发送
v := <-ch  // 接收
close(ch)  // 关闭
```

 channel 操作规则：

- 关闭 channel 只应在数据发送完毕时进行；向已关闭的 channel 发送会 panic。
- 关闭后仍可取完剩余数据；empty 且已关闭的 channel 接收会得到零值。
- 重复关闭会 panic。
- 无缓冲 channel 没有接收者时发送会阻塞（deadlock）；有缓冲 channel 容量满时才阻塞。

### for range 遍历 channel

`for range` 遍历 channel 没有 key，channel 关闭时循环自动结束；不关闭且无数据时会 deadlock。

```go
package main

import (
	"fmt"
	"sync"
)

var wg sync.WaitGroup

func write(ch chan<- int) {
	defer wg.Done()
	for i := 1; i <= 10; i++ {
		ch <- i
	}
	close(ch) // 发送完毕再关闭
}

func read(ch <-chan int) {
	defer wg.Done()
	for v := range ch {
		fmt.Println("读到", v)
	}
}

func main() {
	ch := make(chan int, 10)
	wg.Add(2)
	go write(ch)
	go read(ch)
	wg.Wait()
}
```

## 单向管道

`chan<- T` 表示只写通道，`<-chan T` 表示只读通道。把双向 channel 传给函数时，可以用单向类型约束函数行为，提高安全性。上面的 `write` / `read` 示例已经使用了单向管道。

## select 多路复用

`select` 类似 switch，但每个 case 必须是一次 channel 通信操作，可以同时响应多个 channel，`default` 表示都不就绪时执行的分支：

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	a := make(chan int, 1)
	b := make(chan string, 1)
	a <- 1
	b <- "go"

	for i := 0; i < 2; i++ {
		select {
		case v := <-a:
			fmt.Println("from a:", v)
		case v := <-b:
			fmt.Println("from b:", v)
		default:
			time.Sleep(10 * time.Millisecond)
		}
	}
}
```

## 并发安全与锁

多个 goroutine 同时操作共享资源会产生竞态条件，可以使用 `sync.Mutex`：

```go
package main

import (
	"fmt"
	"sync"
)

var (
	count int
	lock  sync.Mutex
)

func add(wg *sync.WaitGroup) {
	defer wg.Done()
	for i := 0; i < 1000; i++ {
		lock.Lock()
		count++
		lock.Unlock()
	}
}

func main() {
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go add(&wg)
	}
	wg.Wait()
	fmt.Println(count) // 10000
}
```

用 `go build -race main.go` 可以检测竞态。`sync.RWMutex` 是读写锁：允许多个读并发，写操作完全互斥。

## goroutine 中恢复 panic

goroutine 内的 panic 无法被外层的 `recover` 捕获，必须在协程内部 `defer + recover`：

```go
package main

import (
	"fmt"
	"sync"
)

var wg sync.WaitGroup

func test() {
	defer wg.Done()
	defer func() {
		if err := recover(); err != nil {
			fmt.Println("test() 发生错误:", err)
		}
	}()

	var m map[int]string
	m[0] = "golang" // 向 nil map 写入会 panic
}

func main() {
	wg.Add(1)
	go test()
	wg.Wait()
}
```

注意这里两个 `defer` 的执行顺序：`recover` 的 `defer` 后注册、先执行，才能捕获 panic 后再由 `wg.Done()` 结束等待。外层 goroutine 的 `recover` 无法捕获这里面的 panic。

## 小结

- `go 函数()` 启动协程，`WaitGroup` 等待协程结束。
- channel 通过通信共享数据，关闭后不能再发送；`for range` 可遍历直到 channel 关闭。
- 用单向 channel 约束读写权限，用 `select` 处理多路通信。
- 共享资源用 `Mutex` / `RWMutex` 保护，用 `-race` 检测竞态，协程内 panic 用 `defer + recover` 捕获。

