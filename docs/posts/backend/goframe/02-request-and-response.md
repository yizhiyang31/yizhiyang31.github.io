---
title: GoFrame 入门：请求输入与响应输出
author: yizhiyang
date: 2026-11-23
category:
  - 后端
tag:
  - GoFrame
  - 学习笔记
---

本文梳理 GoFrame 中获取请求参数的几组 API：Query、表单、动态路由与全部参数，并介绍如何把参数绑定到结构体；随后介绍文本、JSON、模板与统一 API 结构等响应输出方式。

<!-- more -->

## 普通请求输入

先准备一个基础控制器方法，后面的代码都在此基础上修改：

```go
func (c *Controller) Params(request *ghttp.Request) {
    m := request.GetQueryMap()
    request.Response.WriteJson(m)
}
```

### query 参数获取

query 参数是指以 `?a=1&b=2` 形式写在 URL 中的参数，通常由 GET 方法传递。

**单个参数值**

```go
m := request.GetQuery("name")
```

`GetQuery` 可以指定参数名称并获取对应的参数值，如果值不存在则返回 `nil`。也可以指定默认值：

```go
m := request.GetQuery("name", "孙行者")
```

返回的是一个 `gvar.Var` 类型，可以根据需要进行类型转换。常用类型转换方法如下：

```go
func (v *Var) Bytes() []byte
func (v *Var) String() string
func (v *Var) Bool() bool
func (v *Var) Int() int
func (v *Var) Int8() int8
func (v *Var) Int16() int16
func (v *Var) Int32() int32
func (v *Var) Int64() int64
func (v *Var) Uint() uint
func (v *Var) Uint8() uint8
func (v *Var) Uint16() uint16
func (v *Var) Uint32() uint32
func (v *Var) Uint64() uint64
func (v *Var) Float32() float32
func (v *Var) Float64() float64
func (v *Var) Time(format ...string) time.Time
func (v *Var) Duration() time.Duration
func (v *Var) GTime(format ...string)
```

**批量获取 Query 参数**

GoFrame 提供了 `GetQueryMap`、`GetQueryMapStrStr`、`GetQueryMapStrVar` 三个方法用于批量获取 Query 参数，三者使用方式一致，只是返回类型不同。

获取全部 Query 参数：

```go
m := request.GetQueryMap()
```

指定需要获取的参数名称与默认值：

```go
m := request.GetQueryMap(map[string]interface{}{"name": "者行孙", "age": 600})
```

**将 Query 参数转化为自定义结构体**

可以自定义结构体，将请求参数直接转化为对应的结构体：

```go
type user struct {
    Name string
    Age  int
}

var u *user
err := request.ParseQuery(&u)
if err != nil {
    request.Response.WritelnExit("转换出错")
}
```

如上，结构体成员为 `Name`、`Age`，参数为 `name` 和 `age` 时可以成功转换；如果成员变量名与参数名不一致则无法转换，此时需要为成员变量指定对应的参数，可以用 `json:` / `param:` / `p:` 这些方式来指定：

```go
type user struct {
    UserName string `json:"name"`
    UserAge  int    `p:"age"`
}
```

### 表单参数获取（POST 参数获取）

表单参数获取是指获取 `application/x-www-form-urlencoded`、`application/form-data`、`multipart/form-data` 等数据，也可以用来获取以 JSON 格式提交的数据，简单理解即为可以获取 POST 方法提交的数据。

**单个参数**

```go
m := request.GetForm("name")
```

`GetForm` 用于指定参数名称并获取对应的参数值，如果对应参数不存在则返回 `nil`。也可以指定默认值：

```go
m := request.GetForm("name", "烧包谷")
```

返回值同样是一个 `gvar.Var` 类型，可以根据需要进行类型转换。

**批量获取请求数据**

可以用 `GetFormMap`、`GetFormMapStrStr`、`GetFormMapStrVar` 批量获取请求数据，三个方法使用方式一样，只是返回的 Map 类型不同。

```go
m := request.GetFormMap()
```

也可以指定需要获取的参数以及默认值：

```go
m := request.GetFormMap(map[string]interface{}{"name": "大洋芋"})
```

**将请求数据转化为自定义结构体**

和 Query 参数一样，也可以将请求参数直接转为自定义结构体。如果结构体成员名称与参数名称不一致，同样可以用 `json:`、`param:`、`p:` 这些 tag 来指定对应的参数名称：

```go
type user struct {
    UserName string `json:"name"`
    UserAge  int    `p:"age"`
}

var u *user
err := request.ParseForm(&u)
if err != nil {
    request.Response.WritelnExit("转换出错")
}
```

### 动态路由参数获取

动态路由需要对现有代码做一点改动：先在 `api` 包中定义请求与返回的数据格式，再对指定的路由进行动态注册。

`api`

```go
package api

import (
    "github.com/gogf/gf/v2/frame/g"
)

type Res struct {
    g.Meta `mime:"text/html"`
}

type ParamReq struct {
    g.Meta `path:"/params/:name" method:"all"`
}
```

再将控制器的方法改为使用 `api` 中的数据结构：

`Controller`

```go
func (c *Controller) Params(ctx context.Context, req *api.ParamReq) (res *api.Res, err error) {
    request := g.RequestFromCtx(ctx)
    u := request.GetRouter("name")
    request.Response.WriteJson(g.Map{"data": u})
    return
}
```

**获取单个参数**

```go
u := request.GetRouter("name")
```

返回 `gvar.Var` 类型，可以按需要进行类型转换，也可以指定默认值。

**批量获取参数**

```go
u := request.GetRouterMap()
```

返回值为 `map[string]string`。如果没有设置动态路由，则返回 `nil`。

### 所有请求参数获取

GoFrame 还提供了一些方法获取所有请求参数，用法与上面两种类似，只是不区分请求方法。如果 GET 和 POST 提供了相同名称的参数，则 POST 参数优先。

**获取单个参数**

```go
data := request.GetRequest("name")
// 简写
data := request.Get("name")
```

返回 `gvar.Var` 类型，可以提供默认值。

**批量获取请求参数**

```go
data := request.GetRequestMap()
// 可以指定需要获取的参数名及默认值
data := request.GetRequestMap(g.Map{"name": ""})
// 还有以下几种
data := request.GetRequestMapStrStr()
data := request.GetRequestMapStrVar()
```

**将请求参数转为自定义结构体**

```go
request.Parse(&u) // u 为自定义结构体指针
```

## API 请求输入

在 `api` 中定义请求与响应数据结构后，可以直接将需要接收的参数定义为请求结构体的成员，请求时会自动转为对应结构体。

例如，将前面的 `api` 请求部分改为：

```go
type ParamReq struct {
    g.Meta   `path:"/params" method:"post"`
    UserName string `p:"name" d:"林冲"`
    UserAge  int    `p:"age" d:"110"`
}
```

其中 `p:` 或 `param:` 用于指定该成员对应的请求参数名，`d:` 或 `default:` 用于指定默认值。如果 Query 与 Body 中有相同名称的参数，则以 Body 中的参数优先。

## 响应输出

在控制器中新建如下方法，用来测试响应输出，后面的代码都在此基础上修改：

```go
func (c *Controller) Resp(req *ghttp.Request) {
    // 以下代码写在这里
}
```

### 文本数据返回

GoFrame 中通过以下方法返回文本数据到客户端：

```go
func (r *Response) Write(content ...interface{})
func (r *Response) WriteExit(content ...interface{})
func (r *Response) Writef(format string, params ...interface{})
func (r *Response) WritefExit(format string, params ...interface{})
func (r *Response) Writeln(content ...interface{})
func (r *Response) WritelnExit(content ...interface{})
func (r *Response) Writefln(format string, params ...interface{})
func (r *Response) WriteflnExit(format string, params ...interface{})
```

以上方法中，带有 `Exit` 的表示执行完响应之后就退出本次请求，不再执行后面的内容；带有 `ln` 的表示会在响应内容末尾追加换行符。

这些方法用于向客户端响应文本内容，内容格式为 `text/html` 或 `text/plain`，参数可以是任意数据类型，非字符串类型通常会将内容进行 JSON 转换后返回。如果参数为文本，可以是普通文本也可以是 HTML 文本。

**响应简单文本**

```go
req.Response.Write("锦瑟无端五十弦")
```

**响应简单 HTML**

```go
req.Response.Write("<h1>春蚕到死丝方尽</h1>")
```

**响应复杂 HTML**

```go
html := `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Clock</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
            *
            {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Poppins', sans-serif;
            }
            body
            {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #acbaca;
            }
            .clock
            {
                position: relative;
                width: 300px;
                height: 300px;
                background: #c9d5e0;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 50px;
                box-shadow: 30px 30px 30px -10px rgba(0,0,0,0.15),
                inset 15px 15px 10px rgba(255,255,255,0.75),
                -15px -15px 35px rgba(255,255,255,0.55),
                inset -1px -1px 10px rgba(0,0,0,0.2);
            }
            .clock::before
            {
                content: '';
                position: absolute;
                width: 4px;
                height: 4px;
                background: #e91e63;
                border-radius: 50%;
                z-index: 1000;
                box-shadow: 0 0 0 1px #e91e63,
                0 0 0 3px #fff,
                0 0 5px 5px rgba(0,0,0,0.15);
            }
            .clock .numbers
            {
                position: absolute;
                inset: 35px;
                background: #152b4a;
                border-radius: 50%;
                box-shadow: 5px 5px 15px #152b4a66,
                inset 5px 5px 5px rgba(255,255,255,0.55),
                -6px -6px 10px rgba(255,255,255,1);
            }
            .clock .numbers span
            {
                position: absolute;
                inset: 5px;
                text-align: center;
                color: #fff;
                font-size: 1.25em;
                transform: rotate(calc(90deg * var(--i)));
            }
            .clock .numbers span b
            {
                font-weight: 600;
                display: inline-block;
                transform: rotate(calc(-90deg * var(--i)));
            }
            .clock .numbers::before
            {
                content: '';
                position: absolute;
                inset: 35px;
                background: linear-gradient(#2196f3,#e91e63);
                border-radius: 50%;
                animation: animate 2s linear infinite;
            }
            @keyframes animate
            {
                0%
                {
                    transform: rotate(360deg);
                }
                100%
                {
                    transform: rotate(0deg);
                }
            }
            .clock .numbers::after
            {
                content: '';
                position: absolute;
                inset: 38px;
                background: #152b4a;
                border-radius: 50%;
            }
            .clock .numbers .circle
            {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                z-index: 10;
            }
            .clock .numbers .circle i
            {
                position: absolute;
                width: 3px;
                height: 50%;
                background: #fff;
                transform-origin: bottom;
            }
            .clock .numbers .circle#hr i
            {
                transform: scaleY(0.3);
                width: 4px;
            }
            .clock .numbers .circle#mn i
            {
                transform: scaleY(0.45);
            }
            .clock .numbers .circle#sc i
            {
                width: 2px;
                transform: scaleY(0.55);
                background: #e91e63;
                box-shadow: 0 30px 0 #e91e63;
            }
        </style>
    </head>
    <body>
        <div class="clock">
            <div class="numbers">
                <span style="--i:0;"><b>12</b></span>
                <span style="--i:1;"><b>3</b></span>
                <span style="--i:2;"><b>6</b></span>
                <span style="--i:3;"><b>9</b></span>
                <div class="circle" id="hr"><i></i></div>
                <div class="circle" id="mn"><i></i></div>
                <div class="circle" id="sc"><i></i></div>
            </div>
        </div>
        <script>
            let hr = document.querySelector('#hr');
            let mn = document.querySelector('#mn');
            let sc = document.querySelector('#sc');

            setInterval(()=>{
                let day = new Date();
                let hh = day.getHours() * 30;
                let mm = day.getMinutes() * 6;
                let ss = day.getSeconds() * 6;

                hr.style.transform = 'rotateZ(' + hh+(mm/12) + 'deg)';
                mn.style.transform = 'rotateZ(' + mm + 'deg)';
                sc.style.transform = 'rotateZ(' + ss + 'deg)';
            })
        </script>
    </body>
    </html>
    `
req.Response.Write(html)
```

**格式化数据填充**

```go
html := `
    <div>姓名：%s</div>
    <div>年龄：%d</div>
    `
req.Response.Writef(html, "林黛玉", 16)
```

### JSON 数据返回

GoFrame 中可以通过以下方法返回 JSON 数据：

```go
func (r *Response) WriteJson(content interface{})
func (r *Response) WriteJsonExit(content interface{})
```

通过以上方法，会直接将参数内容进行 JSON 转换之后返回到客户端，并将响应头中的 `Content-Type` 设置为 `application/json`。

### 模板内容返回

前面可以用 `Writef` 将数据格式化到 HTML 内容中，但数据与 HTML 文件较多时这样做过于麻烦，因此 Web 框架一般会采用模板引擎，使用模板语言进行数据渲染，简化 HTML 页面与后端数据的交互。

GoFrame 中用以下方法进行模板解析和返回：

```go
func (r *Response) WriteTpl(tpl string, params ...gview.Params) error
func (r *Response) WriteTplDefault(params ...gview.Params) error
func (r *Response) WriteTplContent(content string, params ...gview.Params) error
```

其中最常用的是 `WriteTpl`，可以理解为该方法会读取一个 HTML 文件并返回给客户端。默认模板文件存放在 `resource/template` 下面，因此 `WriteTpl` 的第一个参数为对应的模板 HTML 文件相对于 `template` 的路径。

示例：

```go
req.Response.WriteTpl("index.html")
req.Response.WriteTpl("user/index.html")
```

模板引擎的详细用法见本系列后续文章。

### API 数据返回

现在 Web 应用多是前后端分离，返回数据为 JSON 格式。前面所说的 `WriteJson` 只是单纯将数据 JSON 转换后返回，而实际开发中，返回的 JSON 数据通常是如下结构（具体项目会有差异，但基本都是类似结构）：

```json
{
    "code": 0, // 自定义编码，用来表示请求成功与失败
    "msg": "请求成功", // 提示信息，如果请求出错则为错误信息
    "data": {} // 请求返回数据，请求出错一般为 null
}
```

GoFrame 为前后端分离的 API 开发提供了很好的支持，只需要借助 `api` 模块就可以方便地完成类似的返回结构，不需要自行定义。操作步骤如下。

在 `api` 中定义请求与响应数据结构：

```go
type ApiReq struct {
    g.Meta `path:"/api" method:"all"`
}

type ApiRes struct {
    UserName string    `json:"name"`
    UserAge  int       `json:"age"`
    List     g.Array   `json:"list"`
}
```

在控制器中定义对应的方法：

```go
func (c *Controller) Api(ctx context.Context, req *api.ApiReq) (res *api.ApiRes, err error) {
    return
}
```

**实例化返回数据并返回**

```go
res = &api.ApiRes{
    UserName: "张三",
    UserAge:  120,
    List:     g.Array{1, 2, 3, 4},
}
return
```

**如果有错误，定义错误信息并直接返回**

```go
err = gerror.Newf("服务器开小差了")
return
```

用上述方法返回数据，会自动返回如下格式的 JSON 数据：

```json
{
    "code": 0,
    "message": "",
    "data": {
        "name": "张三",
        "age": 120,
        "list": [1, 2, 3, 4]
    }
}
```

以上数据格式是通过中间件 `ghttp.MiddlewareHandlerResponse` 实现的。实际应用中可以仿照这一中间件自行定义中间件，来确定需要的数据返回格式。
