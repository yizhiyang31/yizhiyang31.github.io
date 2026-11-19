---
title: Go 语言基础：文件与目录操作
author: yizhiyang
date: 2026-11-16
category:
  - 后端
tag:
  - Go
  - 学习笔记
---

本文涵盖用 `os` 包打开、读取、写入文件，`bufio` 缓冲读写，`io/ioutil` 整体读写，以及文件复制、重命名和目录的创建与删除。

<!-- more -->

## 打开与关闭文件

`os.Open()` 返回 `*File` 和错误，操作完成后必须关闭，通常用 `defer` 保证执行：

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	file, err := os.Open("./main.go")
	if err != nil {
		fmt.Println("open file failed, err:", err)
		return
	}
	defer file.Close()

	fmt.Println("打开文件成功")
}
```

## 读取文件

### file.Read 循环读取

`Read(b []byte)` 返回读取的字节数 `n` 和错误，读到文件末尾时返回 `0` 和 `io.EOF`：

```go
package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	f, err := os.Open("./main.go")
	if err != nil {
		fmt.Println("open file failed, err:", err)
		return
	}
	defer f.Close()

	var content []byte
	buf := make([]byte, 128)
	for {
		n, err := f.Read(buf)
		if n > 0 {
			content = append(content, buf[:n]...)
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Println("read file failed, err:", err)
			return
		}
	}
	fmt.Println(string(content))
}
```

### bufio 按行读取

`bufio` 在 file 上封装了更方便的 API。`ReadString('\n')` 的参数是字符；到达文件末尾时，如果 `len(line) != 0`，仍然要处理最后一行：

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
)

func main() {
	f, err := os.Open("./main.go")
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fmt.Println(scanner.Text())
	}

	// 或者用 ReadString
	f.Seek(0, 0)
	reader := bufio.NewReader(f)
	for {
		line, err := reader.ReadString('\n')
		if len(line) > 0 {
			fmt.Print(line)
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Println(err)
			break
		}
	}
}
```

### 读取整个文件

`os.ReadFile`（旧版是 `ioutil.ReadFile`）一次性读取完整文件：

```go
content, err := os.ReadFile("./main.go")
if err != nil {
	fmt.Println(err)
	return
}
fmt.Println(string(content))
```

## 写入文件

`os.OpenFile(name, flag, perm)` 的标志位可以组合使用：

| 标志 | 说明 |
| --- | --- |
| `os.O_WRONLY` | 只写 |
| `os.O_RDONLY` | 只读 |
| `os.O_RDWR` | 读写 |
| `os.O_CREATE` | 不存在则创建 |
| `os.O_TRUNC` | 打开时清空文件 |
| `os.O_APPEND` | 追加到末尾 |

权限用八进制表示：`r=04`、`w=02`、`x=01`，例如 `0644`、`0666`。

```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	f, err := os.OpenFile("C:/test.txt", os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0666)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer f.Close()

	// 直接写字节或字符串
	f.Write([]byte("hello golang\n"))
	f.WriteString("第二行\n")

	// bufio 缓冲写入，必须 Flush 才会真正写入文件
	w := bufio.NewWriter(f)
	w.WriteString("你好 golang\r\n")
	w.Flush()
}
```

也可以直接用 `os.WriteFile` 写整个文件（旧版是 `ioutil.WriteFile`）：

```go
err := os.WriteFile("C:/test2.txt", []byte("hello golang"), 0666)
```

## 文件复制与重命名

```go
package main

import (
	"io"
	"os"
)

func copyFile(srcName, dstName string) error {
	src, err := os.Open(srcName)
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.OpenFile(dstName, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer dst.Close()

	_, err = io.Copy(dst, src) // 流式复制，适合大文件
	return err
}

func main() {
	copyFile("./a.txt", "./b.txt")

	// 简单场景也可以用整体读写
	data, _ := os.ReadFile("./b.txt")
	os.WriteFile("./c.txt", data, 0644)

	// 重命名，只能在同一磁盘分区内操作
	os.Rename("./c.txt", "./d.txt")
}
```

## 目录操作

```go
package main

import "fmt"

func main() {
	// 创建单层目录；目录已存在会报错
	if err := os.Mkdir("./abc", 0755); err != nil {
		fmt.Println(err)
	}

	// 创建多级目录，已存在也不报错
	os.MkdirAll("dir1/dir2/dir3", 0755)

	// 删除单个文件或空目录
	os.Remove("t.txt")

	// 递归删除目录及其中所有内容，使用时务必谨慎
	os.RemoveAll("aaa")
}
```

## 小结

- `os.Open` 打开文件后必须用 `defer Close()` 关闭。
- 读取：`Read` 循环配合 `io.EOF`、`bufio` 按行、`os.ReadFile` 整体读取。
- 写入：`OpenFile` 组合标志位、`bufio.Writer` 需 `Flush`、`os.WriteFile` 整体写入。
- 复制大文件用 `io.Copy`；`os.Rename` 只能同盘操作；`RemoveAll` 要谨慎使用。

> `io/ioutil` 在 Go 1.16 起已废弃，新代码请使用 `os.ReadFile` / `os.WriteFile`。

