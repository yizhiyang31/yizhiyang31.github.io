---
title: go-zero 入门：集成 MySQL（sqlx）
author: yizhiyang
date: 2026-11-22
category:
  - 后端
tag:
  - go-zero
  - 学习笔记
---

本文使用 go-zero 内置的 sqlx 集成 MySQL：从建表 SQL 生成 model，配置数据库连接与服务上下文，并在 logic 层完成查询一条、查询多条以及增、改、删操作。

<!-- more -->

参考文档：<https://go-zero.dev/docs/tutorials/mysql/curd>、<https://go-zero.dev/docs/tasks/cli/mysql>

## 新建项目

先定义 `shop.api`，包含统一响应结构、焦点图与文章的数据结构，以及按业务分组的路由：

```api
syntax = "v1"

// 返回值
type CommonResponse {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"` // omitempty 表示 Data 可以返回也可以不返回
    Success bool        `json:"success"`
}

type (
    OneFocusReq {
        Id int64 `path:"id"` // 使用 path tag 表示路径参数
    }
    OneFocusResp {
        Result Focus `json:"result"`
    }
    FocusResp {
        Result []*Focus `json:"result"`
    }
    Focus {
        Id       int64  `json:"id"`
        Name     string `json:"name"`
        Pic      string `json:"pic"`
        Url      string `json:"url"`
        Position int64  `json:"position"`
    }
)

type (
    OneArticleReq {
        Id int64 `form:"id"` // Get 传值只保留 form tag
    }
    OneArticleResp {
        Result Article `json:"result"`
    }
    ArticleResp {
        Result []*Article `json:"result"`
    }
    Article {
        Id          int64  `json:"id"`
        Title       string `json:"title"`
        Description string `json:"description"`
        Pic         string `json:"pic"`
        Content     string `json:"content"`
    }
)

@server (
    group: focus
    prefix: /api/focus
)
service shop-api {
    @handler GetOneFocus
    get /details/:id (OneFocusReq) returns (OneFocusResp)

    @handler GetFocusList
    get /list returns (FocusResp)
}

@server (
    group: article
    prefix: /api/article
)
service shop-api {
    @handler GetOneArticle
    get /details (OneArticleReq) returns (OneArticleResp)

    @handler GetArticleList
    get /list returns (ArticleResp)
}
```

生成项目：

```bash
goctl api go --api shop.api --dir .
```

## 集成 MySQL

### 新建数据库文件

在项目根目录中新建 `model/mysql`，在 `mysql` 目录下新建 `focus.sql`：

```sql
CREATE TABLE `focus` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '名称',
  `pic` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图片地址',
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '链接地址',
  `position` bigint(20) NULL DEFAULT 0 COMMENT '排序位置',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_position`(`position`) USING BTREE,
  INDEX `idx_created_at`(`created_at`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '焦点图表' ROW_FORMAT = Compact;
```

最终的目录结构如下：

```text
apidemo02/
├── etc/
│   └── shop-api.yaml
├── go.mod
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── handler/
│   │   ├── article/
│   │   ├── focus/
│   │   └── routes.go
│   ├── logic/
│   │   ├── article/
│   │   └── focus/
│   ├── svc/
│   │   └── servicecontext.go
│   └── types/
│       └── types.go
├── model/
│   └── mysql/
│       ├── focus.sql
│       ├── focusmodel.go
│       ├── focusmodel_gen.go
│       └── vars.go
├── shop.api
└── shop.go
```

### 生成 model 代码

根据建表 SQL 生成 model：

```bash
cd model/mysql
goctl model mysql ddl --src focus.sql --dir .
```

下载依赖：

```bash
go mod tidy
```

## 配置数据库连接

在 `etc/shop-api.yaml` 中增加 MySQL 配置：

```yaml
Name: user-api
Host: 0.0.0.0
Port: 8888

MySQL:
  DataSource: root:123456@tcp(192.168.1.10:3306)/gozero?charset=utf8mb4&parseTime=true&loc=Local
```

其中 `DataSource` 的通用格式为 `root:password@tcp(127.0.0.1:3306)/database?charset=utf8mb4&parseTime=true&loc=Local`。

在 `internal/config/config.go` 中增加对应的配置结构：

```go
package config

import "github.com/zeromicro/go-zero/rest"

type Config struct {
	rest.RestConf
	// Mysql struct
	Mysql struct {
		DataSource string
	}
}
```

## 创建服务上下文

在 `internal/svc/servicecontext.go` 中注入 MySQL 连接和 `FocusModel`：

```go
package svc

import (
	"apidemo02/internal/config"
	"apidemo02/model/mysql"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config     config.Config
	FocusModel mysql.FocusModel
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.Mysql.DataSource)
	return &ServiceContext{
		Config:     c,
		FocusModel: mysql.NewFocusModel(conn),
	}
}
```

## 在逻辑层使用 FocusModel 查询数据库

### 查询一条数据

在 `internal/logic/focus/getonefocuslogic.go` 中使用 `FindOne`：

```go
func (l *GetOneFocusLogic) GetOneFocus(req *types.OneFocusReq) (resp *types.OneFocusResp, err error) {
	// 查询数据
	focus, err := l.svcCtx.FocusModel.FindOne(l.ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &types.OneFocusResp{
		Result: types.Focus{
			Id:       focus.Id,
			Name:     focus.Title.String,
			Pic:      focus.Pic.String,
			Position: focus.Position,
			Url:      focus.Url.String,
		},
	}, nil
}
```

### 查询多条数据

goctl 生成的 model 默认只有 `FindOne`，需要手动在 `model/mysql/focusmodel_gen.go` 中新增 `FindAll`。

先在接口中增加声明：

```go
type focusModel interface {
	Insert(ctx context.Context, data *Focus) (sql.Result, error)
	FindOne(ctx context.Context, id int64) (*Focus, error)
	FindAll(ctx context.Context) ([]*Focus, error) // 新增
	Update(ctx context.Context, data *Focus) error
	Delete(ctx context.Context, id int64) error
}
```

再增加实现：

```go
func (m *defaultFocusModel) FindAll(ctx context.Context) ([]*Focus, error) {
	// 查询全部数据
	query := fmt.Sprintf("select %s from %s", focusRows, m.table)
	var resp []*Focus
	err := m.conn.QueryRowsCtx(ctx, &resp, query)
	return resp, err
}
```

在 `internal/logic/focus/getfocuslistlogic.go` 中调用：

```go
func (l *GetFocusListLogic) GetFocusList() (resp *types.FocusResp, err error) {
	// 查询多条数据
	list, err := l.svcCtx.FocusModel.FindAll(l.ctx)
	if err != nil {
		return nil, err
	}
	// 将 mysql.Focus 转换为 types.Focus
	var focusList []*types.Focus
	for _, focus := range list {
		focusList = append(focusList, &types.Focus{
			Id:       focus.Id,
			Name:     focus.Title.String,
			Pic:      focus.Pic.String,
			Url:      focus.Url.String,
			Position: focus.Position,
		})
	}
	return &types.FocusResp{Result: focusList}, nil
}
```

## 增加数据

### 修改 shop.api

增加 `AddFocusReq`、`UpdateFocusReq` 及对应的增、改、删路由：

```api
type CommonResponse {
    Message string `json:"message"`
    Code    int    `json:"code"`
    Success bool   `json:"success"`
}

type (
    OneFocusReq {
        Id int64 `path:"id"` // 使用 path tag 表示路径参数
    }
    OneFocusResp {
        Result Focus `json:"result"`
    }
    FocusResp {
        Result []*Focus `json:"result"`
    }
    AddFocusReq {
        Name     string `form:"name"`
        Pic      string `form:"pic"`
        Url      string `form:"url"`
        Position int64  `form:"position"`
    }
    UpdateFocusReq {
        Id       int64  `form:"id"`
        Name     string `form:"name"`
        Pic      string `form:"pic"`
        Url      string `form:"url"`
        Position int64  `form:"position"`
    }
    Focus {
        Id       int64  `json:"id"`
        Name     string `json:"name"`
        Pic      string `json:"pic"`
        Url      string `json:"url"`
        Position int64  `json:"position"`
    }
)

@server (
    group: focus
    prefix: /api/focus
)
service shop-api {
    @handler GetOneFocus
    get /details/:id (OneFocusReq) returns (OneFocusResp)

    @handler GetFocusList
    get /list returns (FocusResp)

    @handler AddFocus
    post /add (AddFocusReq) returns (CommonResponse)

    @handler UpdateFocus
    put /update (UpdateFocusReq) returns (CommonResponse)

    @handler DeleteFocus
    delete /delete/:id (OneFocusReq) returns (CommonResponse)
}
```

注意：获取表单数据需要配置请求体 tag（`form`）。

### 生成项目

```bash
goctl api go --api shop.api --dir .
```

### 修改 focus/addfocuslogic.go

```go
func (l *AddFocusLogic) AddFocus(req *types.AddFocusReq) (resp *types.CommonResponse, err error) {
	focus := mysql.Focus{
		Title:    sql.NullString{String: req.Name, Valid: req.Name != ""},
		Pic:      sql.NullString{String: req.Pic, Valid: req.Pic != ""},
		Url:      sql.NullString{String: req.Url, Valid: req.Url != ""},
		Position: req.Position,
	}
	// 执行增加
	_, err = l.svcCtx.FocusModel.Insert(l.ctx, &focus)
	if err != nil {
		return nil, err
	}
	return &types.CommonResponse{Code: 0, Message: "添加成功"}, nil
}
```

这里需要注意类型转换：如果用户传入了空字符串，数据库会存储为 `NULL`；如果传入非空字符串，数据库会存储该字符串值。

## 修改数据

`shop.api` 与「增加数据」中一致，重新生成后修改 `focus/updatefocuslogic.go`：

```go
func (l *UpdateFocusLogic) UpdateFocus(req *types.UpdateFocusReq) (resp *types.CommonResponse, err error) {
	// 获取数据
	focus := mysql.Focus{
		Id:       req.Id,
		Title:    sql.NullString{String: req.Name, Valid: req.Name != ""},
		Pic:      sql.NullString{String: req.Pic, Valid: req.Pic != ""},
		Url:      sql.NullString{String: req.Url, Valid: req.Url != ""},
		Position: req.Position,
	}
	// 执行修改（注意 = 号）
	err = l.svcCtx.FocusModel.Update(l.ctx, &focus)
	if err != nil {
		return nil, err
	}
	return &types.CommonResponse{Code: 0, Message: "修改成功"}, nil
}
```

同样需要注意 `sql.NullString` 的类型转换：空字符串存为 `NULL`，非空字符串存原值。

## 删除数据

修改 `focus/deletefocuslogic.go`：

```go
func (l *DeleteFocusLogic) DeleteFocus(req *types.OneFocusReq) (resp *types.CommonResponse, err error) {
	// 删除数据
	err = l.svcCtx.FocusModel.Delete(l.ctx, req.Id)
	if err != nil {
		return &types.CommonResponse{Code: 500, Message: "删除失败", Success: false}, nil
	}
	return &types.CommonResponse{Code: 200, Message: "删除成功", Success: true}, nil
}
```

## 小结

- 用 `goctl model mysql ddl --src focus.sql --dir .` 根据建表语句生成 model。
- 在配置文件中增加 `MySQL.DataSource`，并在 `config.go` 中声明对应结构。
- 在 `servicecontext.go` 中用 `sqlx.NewMysql` 创建连接并注入 `FocusModel`。
- `FindOne` 查询单条；多条查询需要手动在生成的 model 中补充 `FindAll`。
- 增、改时用 `sql.NullString` 做类型转换，空字符串会写入 `NULL`；删、改分别调用 `Update`、`Delete`。
