---
title: GoFrame 入门：文件上传下载与数据校验
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - GoFrame
  - 学习笔记
---

本文介绍 GoFrame 中单文件与多文件上传、文件下载与上传大小限制的处理方式，并整理内置数据校验规则的常见用法，以及在规范路由中通过 `v` 标签自动校验请求参数的写法。

<!-- more -->

## 文件上传

文件上传可以通过表单上传，也可以通过 Ajax 上传，GoFrame 框架后端的处理方式都是一样的，因此这里只演示表单上传。

**单文件上传**

`html/upload.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>上传文件</title>
</head>
<body>

    <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="ufile"> <br>
        <input type="file" name="ufiles" multiple> <br>
        <input type="submit" value="上传">
    </form>

</body>
</html>
```

`controller/hello.go`

```go
func (c *Controller) Upload(req *ghttp.Request) {
    file := req.GetUploadFile("ufile")
    if file != nil {
        file.Filename = "20231001.png" // 可以根据需要给文件重命名
        name, err := file.Save("./upload")
        if err == nil {
            req.Response.Writeln(name)
        }
    }
}
```

**多文件上传**

```go
func (c *Controller) Upload(req *ghttp.Request) {
    files := req.GetUploadFiles("ufiles")
    if files != nil {
        names, err := files.Save("./upload")
        if err == nil {
            req.Response.Writeln(names)
        }
    }
}
```

除了从请求中获取上传文件以外，如果使用 API 规范路由，还可以用如下方式获取上传文件：

```go
type UploadReq struct {
    g.Meta `path:"/upload" method:"post"`

    Ufile  ghttp.UploadFile  `json:"ufile"`
    UFiles ghttp.UploadFiles `json:"ufiles"`
}
```

使用这种方式，如果文件允许为空，则可能会发生转换错误。

**文件上传应用实例**

需求如下：

- 在静态资源目录新建 `upload` 文件夹用于存放上传文件，示例中为 `resource/public/upload`。绑定的静态目录为 `resource/public`，因此可以用 `/upload/<filename>` 的形式访问指定文件。
- 将上传文件名称修改为对应文件的哈希值，以防上传同名文件覆盖。
- 返回文件的 URL。

```go
func (c *Controller) Upload(ctx context.Context, r *api.UploadReq) (res *api.UploadRes, err error) {
    req := g.RequestFromCtx(ctx)
    file := req.GetUploadFile("ufile")
    if file != nil {
        var md5str string
        md5str, err = gmd5.Encrypt(file)
        if err != nil {
            return
        }
        file.Filename = md5str + path.Ext(file.Filename)
        name, err := file.Save("resource/public/upload")
        if err == nil {
            res = &api.UploadRes{
                Data: "/upload/" + name,
            }
        }
    }
    return
}
```

## 文件下载

**ServeFile**

`ServeFile` 向客户端返回一个文件内容，如果是文本或者图片，将会直接展示；不能直接在浏览器中展示的将进行下载。

```go
func (c *Controller) Download(req *ghttp.Request) {
    req.Response.ServeFile("upload/1.png")
}
```

**ServeFileDownload**

该方法直接引导客户端进行下载，并且可以给下载文件重命名：

```go
func (c *Controller) Download(req *ghttp.Request) {
    req.Response.ServeFileDownload("upload/1.png", "download.png")
}
```

## 上传限制

如果需要限制单次上传文件大小，可以用 `clientMaxBodySize` 配置。如果完全不需要限制，直接设为 0 即可。

`config.yaml`

```yaml
server:
  clientMaxBodySize: "0"
```

## 数据校验

实际开发中经常需要验证前端提交过来的数据是否符合规则，比如非空、长度限制、是否为数字等。在 GoFrame 中，基本上不用手动写验证规则，框架已经内置了很多验证规则可以用来验证数据。验证规则的详细内容见官方文档「数据校验 / 校验规则」章节。

**单个规则与错误提示信息**

```go
func (c *Controller) Valid(ctx context.Context, rq *api.ValidReq) (rs *api.ValidRes, err error) {
    type Data struct {
        Name  g.Map  `v:"required#name不能为空"`
        Age   int    `v:"required"`
        Phone string `v:"required"`
    }

    data := Data{}
    err = g.Validator().Bail().Data(data).Run(ctx)

    rs = &api.ValidRes{Data: data}
    return
}
```

**多个规则**

```go
func (c *Controller) Valid(ctx context.Context, rq *api.ValidReq) (rs *api.ValidRes, err error) {
    type Data struct {
        Name  string
        Age   string `v:"required|integer|min:1#age不能为空|age必须为整数|age不能小于1"`
        Phone string
    }

    data := Data{Age: "1.1"}
    err = g.Validator().Bail().Data(data).Run(ctx)

    rs = &api.ValidRes{Data: data}
    return
}
```

**使用 Map 指定校验规则**

```go
func (c *Controller) Valid(ctx context.Context, rq *api.ValidReq) (rs *api.ValidRes, err error) {
    type Data struct {
        Name  string
        Age   int
        Phone string
    }

    rules := map[string]string{
        "Name":  "required|length:6,16",
        "Age":   "between:18,30",
        "Phone": "phone",
    }
    message := map[string]interface{}{
        "Name": map[string]string{
            "required": "Name不能为空",
            "length":   "长度只能为{min}到{max}个字符",
        },
        "Age": "年龄只能为18到30岁",
    }
    data := Data{Phone: "123"}
    err = g.Validator().Rules(rules).Messages(message).Data(data).Run(ctx)

    rs = &api.ValidRes{Data: data}
    return
}
```

**规范路由 API 数据校验**

如果输入数据直接在 API 里定义了结构，可以直接将校验规则写上，在请求时会自动校验，不需要再手动调用校验函数。

`api/hello.go`

```go
type ValidReq struct {
    g.Meta `path:"/valid" method:"all"`

    Name  string `v:"required|length:6,16"`
    Age   int    `v:"required"`
    Phone string `v:"phone"`
}

type ValidRes struct {
    Data interface{} `json:"data"`
}
```

`controller/hello.go`

```go
func (c *Controller) Valid(ctx context.Context, rq *api.ValidReq) (rs *api.ValidRes, err error) {
    return
}
```
