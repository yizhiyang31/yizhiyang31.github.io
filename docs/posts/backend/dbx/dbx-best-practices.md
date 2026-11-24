---
title: DBX 最佳实践：免费开源的数据库客户端
excerpt: "从 DBX 是什么、怎么安装连库，到接入 AI 与 Cursor，再到内部架构与查询链路，一份可以直接照着用的实践笔记。"
author: yizhiyang
date: 2026-11-24
category:
  - 后端
tag:
  - 数据库
  - 学习笔记
---

官网：https://dbxio.com  
仓库：https://github.com/t8y2/dbx  

本资料按这个顺序读：

1. DBX 是什么，值不值得用  
2. 怎么安装、连库、日常操作  
3. 怎么接 AI 和 Cursor  
4. 实现原理：架构、驱动、查询链路、安全与 AI

<!-- more -->

---

## 1. DBX 是什么

DBX 是一款**免费开源**的数据库客户端。你可以用它：

- 连接 MySQL、PostgreSQL、SQLite、Redis、MongoDB 等常见库  
- 写 SQL、看结果、改数据  
- 看表结构、ER 图  
- 连接 Redis、Kafka、Nacos 等「不是 SQL」的系统  
- 把已经配好的连接交给 Cursor、Claude Code 等 AI 工具使用  

官方口号是：**大约 25MB，管理 100 多种数据库。**

![DBX 主界面](./images/readme-hero.png)

### 1.1 为什么值得学

多数人不是缺一个 SQL 窗口，而是被这些事拖慢：

| 常见麻烦 | DBX 的做法 |
| --- | --- |
| Navicat 授权贵 | 免费，Apache-2.0 |
| DBeaver 要装 Java，启动慢 | 标准安装包大约二三十 MB，启动快 |
| MySQL、Redis、Mongo 各开一个软件 | 一个软件里切换 |
| 给 Cursor 看表结构，只能复制粘贴 | 官方支持 MCP，AI 可直接读你已配置的连接 |
| 公司有达梦、OceanBase 等国产库 | 支持把它们和常见库放在一起管理 |

一句话：

**日常查库、改数据、多库切换，DBX 够用；还想让 Cursor 直接查测试库，DBX 更合适。**

它**不适合**替代这些场景：

- Navicat 的建模、定时同步、团队协作  
- DataGrip 级别的复杂 SQL 重构  
- 专业 DBA 的深度运维面板  

### 1.2 和常见工具对比

| | DBX | DBeaver | Navicat | DataGrip |
| --- | --- | --- | --- | --- |
| 费用 | 免费 | 社区版免费 | 收费 | 订阅收费 |
| 体积 / 启动 | 小、快 | 较大、偏慢 | 功能全、偏重 | 像 IDE，偏重 |
| 多库一体 | 强（含 Redis、MQ 等） | 强 | 主流库强 | 强 |
| 国产库 | 支持较好 | 一般 | 有 | 一般 |
| AI / MCP | 内置 + 官方 MCP | 多靠插件 | 不是重点 | 有 AI，无同级 MCP |
| 适合谁 | 开发日常、多库、接 AI | 要成熟开源 GUI | DBA / 建模同步 | 重度写 SQL |

怎么选：

- 每天切多种库、不想付费、想接 Cursor → **用 DBX**  
- 只要最成熟的开源 GUI，能接受 Java → **DBeaver**  
- 公司已绑定建模和同步流程 → **继续 Navicat**  
- 天天写超复杂 SQL、靠 IDE 重构 → **继续 DataGrip**  

### 1.3 四种用法

```mermaid
flowchart LR
  Desktop[桌面版] --> Core[同一套连接和权限]
  Web[浏览器版 Docker] --> Core
  CLI[命令行] --> Core
  MCP[给 Cursor 用] --> Core
  Core --> DB[(数据库)]
```

| 用法 | 什么时候用 |
| --- | --- |
| 桌面版 | 自己每天查库（最常用） |
| Docker 网页版 | 装在服务器上，用浏览器访问 |
| 命令行 CLI | 脚本、终端里查库 |
| MCP | 让 Cursor / Claude Code 使用 DBX 里的连接 |

### 1.4 界面长什么样

亮色 / 暗色主界面：

![亮色主题](./images/screenshot-light.png)

![暗色主题](./images/screenshot-dark.png)

数据表格：

![数据表格](./images/screenshot-grid.png)

ER 图：

![ER 图](./images/screenshot-er.png)

---

## 2. 怎么用

建议练习顺序：

```mermaid
flowchart TD
  A[安装桌面版] --> B[新建连接]
  B --> C[写 SQL 看结果]
  C --> D[改一行数据]
  D --> E[看 ER 图]
  E --> F[可选：接 Cursor MCP]
```

也可以直接跑演示脚本（macOS）：

```bash
bash ~/Desktop/DBX资料/demo/install-and-demo.sh
```

脚本会：

1. 安装 DBX，并配置 Cursor 的 MCP  
2. **先检测本机 MySQL**；能连上就在本机创建演示库 `shop`  
3. 本机没有可用 MySQL 时，**自动安装并启动 Docker Desktop**，再起演示库（端口 `13306`）  
4. 拉 MySQL 镜像时**优先用国内源**（DaoCloud 等），避免大陆直连 Docker Hub 超时  

首次装 Docker 时，系统可能弹出许可协议或要本机密码，在窗口里点确认即可，脚本会继续等待 Docker 就绪。

本机 root 有密码时：

```bash
DBX_MYSQL_ADMIN_PASSWORD=你的密码 bash ~/Desktop/DBX资料/demo/install-and-demo.sh
```

强制走 Docker：

```bash
bash ~/Desktop/DBX资料/demo/install-and-demo.sh --force-docker
```

### 2.1 安装

**macOS（推荐）：**

```bash
brew install --cask dbx
```

**Windows：**

```bash
winget install t8y2.dbx
```

也可以去 [Releases](https://github.com/t8y2/dbx/releases) 下载安装包。

装好后打开 DBX。MySQL、PostgreSQL、SQLite、Redis 等常见库一般不用额外装驱动。

### 2.2 新建连接

1. 点「新建连接」  
2. 选数据库类型（练习建议先选 MySQL）  
3. 填主机、端口、账号、密码  
4. 也可以粘贴连接 URL，让它自动拆字段  
5. 点「测试」，通过后再保存  

演示库账号固定为用户 `dbx` / 密码 `dbx_demo` / 库名 `shop`。端口取决于模式：

| 模式 | 主机 | 端口 | URL |
| --- | --- | --- | --- |
| 本机 MySQL | `127.0.0.1` | `3306`（常见） | `mysql://dbx:dbx_demo@127.0.0.1:3306/shop` |
| Docker | `127.0.0.1` | `13306` | `mysql://dbx:dbx_demo@127.0.0.1:13306/shop` |

建议连接名：`dbx-demo-mysql`。以脚本结束时打印的 URL 为准。

其他类型也可连，例如：

| 类型 | 示例 |
| --- | --- |
| PostgreSQL | `postgres://用户:密码@127.0.0.1:5432/库名` |
| Redis | 主机 + 端口 |
| SQLite | 选择本地 `.db` 文件 |

测不通时先看这几项：

| 现象 | 先查什么 |
| --- | --- |
| 超时 | 主机、端口、防火墙、Docker 是否映射到本机 |
| 认证失败 | 用户名、密码、是否允许远程登录 |
| 连上了没表 | 默认库、账号权限、侧边栏过滤 |
| 打不开文件库 | 文件路径是否正确、有没有读权限 |

以前用过 DBeaver / Navicat，可以直接导入连接，不用一条条重填。

### 2.3 写 SQL、看结果

连接打开后：

- 左边：库、表、字段（对象树）  
- 右边：SQL 编辑器  

常用操作：

- 输入时自动补全表名、字段名  
- `Cmd+Enter`（Windows 用 `Ctrl+Enter`）执行；只选中一段就只执行这一段  
- 结果在下方表格里显示  
- 可以格式化 SQL、查看历史  

练习 SQL 示例：

```sql
SELECT c.city,
       SUM(oi.qty * oi.price_cents) / 100.0 AS sales
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY c.city
ORDER BY sales DESC;
```

### 2.4 改数据

1. 打开一张表，或执行查询得到结果  
2. 双击单元格修改  
3. **保存前先看生成的 SQL**  
4. 确认无误再提交  

结果还可以导出为 CSV、JSON、Excel 等。

改数据时养成习惯：先看预览 SQL，确认目标库和 WHERE 条件。

### 2.5 看结构和搬数据

常用能力：

- **ER 图**：看表之间关系  
- **Schema 对比**：比较两个库的结构差异  
- **执行计划**：看 SQL 怎么执行  
- **导入**：CSV / Excel  
- **导出**：整库或查询结果  
- **跨库传输**：把数据从一个连接迁到另一个  

存储过程、触发器多数库能看，编辑体验通常不如 DataGrip。日常开发够用即可。

### 2.6 Redis、Mongo 等非 SQL 系统

选 Redis，不会出现「硬套 SQL 编辑器」，而是键值浏览界面。常见系统：

| 系统 | 主要能做什么 |
| --- | --- |
| Redis | 搜 key、看各种类型、改 TTL、跑命令 |
| MongoDB | 浏览和修改文档 |
| Kafka / RocketMQ 等 | 看 Topic、消息、消费组 |
| Nacos / etcd / ZooKeeper | 看配置和服务 |

不同库功能深度不一样。连上之后以实际界面为准，完整列表见：https://dbxio.com/en/databases

### 2.7 第一次连库提示下载驱动

不是所有库都打进安装包。常见情况：

| 库 | 额外要什么 |
| --- | --- |
| MySQL、PostgreSQL、SQLite、Redis、MongoDB、ClickHouse | 一般不用下 |
| Oracle、人大金仓、虚谷 | 下载原生 Agent（不用 Java） |
| 达梦、openGauss、Trino、Hive 等 | 下载 JDBC Agent，还需要 JRE |

按提示下载即可。内网环境可在「驱动管理」里导入离线包。

### 2.8 安全习惯（必看）

练习库随便玩；连真实环境时记住：

1. 生产库起明显名字，并标颜色  
2. 查询账号尽量只读；DBX 里也勾「只读连接」  
3. 必须可写时，打开「生产保护」  
4. 改数据、导数据前先看 SQL  
5. 给 Cursor 用的 MCP，默认只放行测试库，权限选**只读**  
6. 截图、导出配置里可能有密码，不要发到公开群  

---

## 3. 接 AI 和 Cursor

DBX 里和 AI 相关的有两条路，别混：

| | DBX 内置 AI | MCP（给 Cursor 用） |
| --- | --- | --- |
| 在哪用 | DBX 窗口里的聊天 | Cursor / Claude Code |
| 做什么 | 生成、解释、改 SQL；Agent 可只读查库 | 让编程 AI 读结构、跑查询 |
| 要不要另装 | 配好模型即可 | 要单独装 MCP 程序 |

### 3.1 DBX 内置 AI

在设置里配置模型（OpenAI、Claude、DeepSeek、通义、Ollama 等）。

两种模式：

| 模式 | 作用 |
| --- | --- |
| Ask | 只给建议，不自己查库 |
| Agent | 可以只读查库；写入必须先给你看完整 SQL，确认后才执行一次 |

提问时用 `@表名` 把表结构带给模型，例如：

```text
根据 @orders 和 @customers 生成最近 30 天销售额 Top 10，只返回 SQL，不执行。
```

生产库上，Agent 不会自动执行写入和 DDL。

### 3.2 让 Cursor 使用 DBX

流程：

```mermaid
sequenceDiagram
  participant 你
  participant Cursor
  participant MCP as DBX MCP
  participant DBX as DBX 连接配置
  participant DB as 数据库

  你->>Cursor: 提问
  Cursor->>MCP: 调用工具
  MCP->>DBX: 检查是否允许该连接
  MCP->>DB: 查询
  DB-->>Cursor: 结果
```

**步骤：**

1. 安装 MCP：

```bash
curl -fsSL https://dbxio.com/install-mcp | sh
```

2. 配置 Cursor（全局文件一般是 `~/.cursor/mcp.json`）。`command` 必须写**绝对路径**，不要写裸命令：

```json
{
  "mcpServers": {
    "dbx": {
      "command": "/Users/你的用户名/.dbx/bin/dbx-mcp",
      "args": []
    }
  }
}
```

绝对路径可用下面命令查看：

```bash
ls -l ~/.dbx/bin/dbx-mcp
# 或
echo "$(brew --prefix)/bin/dbx-mcp"
```

若你用了 `demo/install-and-demo.sh`，脚本会自动写好这份配置，并尝试授权钥匙串。

3. 打开 DBX → **设置 → MCP**  
   - 把演示连接加入允许列表  
   - 权限选 **只读**  
   - 保存  

4. **macOS 必须授权钥匙串**（否则会出现 `KEY_PROVIDER_UNAVAILABLE`，光重启 Cursor 解决不了）：

```bash
~/.dbx/bin/dbx-mcp --authorize-keychain
```

若弹出钥匙串对话框，选「始终允许」。这是一次性命令，不要写进 `mcp.json` 的 `args`。

5. **完全退出并重启 Cursor**（菜单栏 Cursor → Quit，只关窗口不够）

6. 在 Cursor 里问：

- 列出 DBX 里的数据库连接  
- 查看某个连接有哪些表  
- 描述 `orders` 表结构  
- 查询每个城市的销售额  

判断是否真正成功：能直接列出连接，且**不要**再出现「密钥提供者不可用 / KEY_PROVIDER_UNAVAILABLE」。若 Agent 改去读本地 `dbx.db` 兜底，说明 MCP 仍未打通。

### 3.3 Docker 网页版（选学）

想把 DBX 装在服务器上、浏览器访问时：

```bash
docker run -d --pull=always --name dbx -p 4224:4224 \
  -e DBX_PASSWORD='换成你的密码' \
  -v dbx-data:/app/data \
  t8y2/dbx:latest
```

浏览器打开：`http://服务器IP:4224`

国内可改用镜像：`docker.cnb.cool/dbxio.com/dbx:latest`

---

## 4. 实现原理

这一节说明 DBX 为什么「又小又能连很多库」，以及一次查询、一次 AI 调用在系统里怎么走。不要求你会改源码，但读完应能画出整体图。

下面先把官网相关说明收成几条，后文再展开。

**驱动管理（要点）**

- 混合驱动：内置 Rust、原生 Agent（Go/Rust 独立进程）、JDBC Agent（Java 子进程）。  
- 内置驱动装完就能用；Agent 需下载平台文件；JDBC 还要 JRE（可用系统 Java，也可让 DBX 下载托管 JRE）。  
- 驱动管理里能看已安装版本、一键安装/升级，以及运行中 Agent 的 PID、内存、CPU，并可停止/重启。  
- 内网可用「导入离线包」：Java Agent 包一般跨平台但不带 JRE；原生 Agent 包按操作系统和 CPU 区分。  
- 通用 JDBC（自定义 URL + 厂商 JAR）走单独的 JDBC 插件，不打进某个数据库的 Agent ZIP。  

**生产与写入安全（要点）**

- 保护分层：数据库账号 → 连接只读 → 生产环境保护 → 危险操作确认 → MCP 策略；上层不能放宽下层。  
- 只读不只是藏按钮，核心执行路径会拦截可识别写入；工作台可临时解锁 1/5 分钟，MCP/CLI 没有这个窗口。  
- 生产保护下，每次写入都要重新确认，确认状态不会长期保存。  
- AI Ask 不执行 SQL；Agent 在生产库上不会自动写，只把 SQL 放回编辑器。  
- MCP 用 allowlist +「只读 / 数据读写 / 完全访问」，客户端环境变量不能放宽已保存策略。  

**源码与模块划分（要点）**

- 桌面：Tauri + Vue + Rust。  
- `apps/desktop/src` 界面，`src-tauri` 桌面命令与打包，`crates/dbx-core` 连接/查询/元数据/安全，`crates/dbx-web` 网页后端，`packages/cli` 与 `packages/mcp-server` 分别是命令行和 MCP，`agents/drivers` 是各库 Agent。  

**Agent（要点）**

- 每个 Agent 是独立进程，和主进程用 stdin/stdout 做 JSON-RPC 2.0 通信。  
- 有成熟原生驱动时优先 Go/Rust，避免 JVM 空闲开销；没有可靠原生驱动再用 JDBC。  
- 安装在用户目录，例如 `~/.dbx/agents/drivers/<类型>/`，Java 为 `agent.jar`，原生为 `agent` 可执行文件。  

### 4.1 一句话架构

DBX = **Vue 界面** + **Tauri / Web 入口** + **Rust 核心** + **三种驱动运行时**。  
桌面版、Docker 网页版、CLI、MCP 尽量共用同一套 Rust 能力；差别主要在「怎么把请求送进核心」，以及本地文件、系统集成是否可用。

连接管理界面（官方截图）：

![连接管理](./images/screenshot-connections.jpg)

内置 AI 助手界面（官方截图）：

![AI 助手](./images/screenshot-ai.jpg)

### 4.2 整体分层

```mermaid
flowchart TB
  subgraph clients [使用入口]
    Desk[桌面版<br/>Tauri 2 + 系统 WebView]
    Web[Docker / Web<br/>浏览器 + HTTP]
    CLI[CLI<br/>@dbx-app/cli]
    MCP[MCP Server<br/>给 Cursor / Claude Code]
  end

  subgraph front [界面层]
    Vue[Vue 3 + TypeScript<br/>CodeMirror 6 编辑器<br/>虚拟滚动表格]
  end

  subgraph core [核心层 Rust]
    Conn[连接管理]
    Query[查询执行]
    Meta[元数据 / Schema]
    Safety[只读 / 生产保护 / SQL 预览]
    Store[(本地 dbx.db<br/>敏感字段加密)]
  end

  subgraph drivers [驱动层]
    Native[内置 Rust 驱动]
    NatAgent[原生 Agent<br/>Go / Rust 可执行文件]
    JdbcAgent[JDBC Agent<br/>Java 子进程 + JRE]
    JdbcPlugin[可选 JDBC 插件<br/>自定义 JAR]
  end

  DB[(目标数据库 / MQ / 配置中心)]

  Desk --> Vue
  Web --> Vue
  Vue -->|桌面: Tauri invoke<br/>网页: HTTP| core
  CLI --> core
  MCP --> core
  Conn --> Store
  Query --> Safety
  Safety --> Native
  Safety --> NatAgent
  Safety --> JdbcAgent
  Safety --> JdbcPlugin
  Native --> DB
  NatAgent --> DB
  JdbcAgent --> DB
  JdbcPlugin --> DB
```

技术选型（来自仓库 README）：

| 层 | 技术 | 作用 |
| --- | --- | --- |
| 桌面壳 | Tauri 2 | 用系统 WebView 显示界面，不打包 Chromium |
| 前端 | Vue 3、TypeScript、Tailwind、shadcn-vue | 连接树、编辑器、表格、设置 |
| SQL 编辑器 | CodeMirror 6 | 高亮、补全、多结果、主题 |
| 核心 | Rust（`crates/dbx-core`） | 连接、查询、元数据、权限、导入导出 |
| 网页后端 | Rust（`crates/dbx-web`） | Docker / 浏览器访问时的 HTTP 服务 |
| 常见协议 | sqlx、tiberius、redis-rs、MongoDB Rust 驱动等 | 编译进主程序 |
| 长尾数据库 | `agents/drivers/*` | 独立进程按需下载 |

仓库里和原理对应的主要目录：

```mermaid
flowchart LR
  A[apps/desktop/src] -->|界面| B[src-tauri]
  B -->|Tauri 命令| C[crates/dbx-core]
  D[crates/dbx-web] --> C
  E[packages/cli] --> C
  F[packages/mcp-server] --> C
  C --> G[agents/drivers]
  H[docs/] -.->|官网文档| User[你读的文档站]
```

| 路径 | 放什么 |
| --- | --- |
| `apps/desktop/src/` | Vue 页面、状态、交互、多语言 |
| `src-tauri/` | 桌面命令、系统集成、打包 |
| `crates/dbx-core/` | 连接、查询、元数据、安全策略 |
| `crates/dbx-web/` | Docker / Web 后端 |
| `packages/cli/` | 命令行 |
| `packages/mcp-server/` | MCP 服务 |
| `agents/drivers/` | 各数据库 Agent |

### 4.3 为什么安装包可以很小

对比常见客户端：

```mermaid
flowchart LR
  subgraph heavy [传统重客户端]
    E1[自带 Chromium<br/>Electron]
    E2[自带 / 依赖 JVM<br/>DBeaver]
    E3[把很多 JDBC 打进安装包]
  end

  subgraph dbx [DBX]
    D1[系统 WebView]
    D2[Rust 主程序]
    D3[常用驱动内置]
    D4[长尾驱动首次连接再下]
  end

  heavy -->|体积大、启动慢| User[用户]
  dbx -->|标准安装包约 25–40MB| User
```

三点设计选择：

1. **不内置 Chromium**  
   Tauri 调用 Windows WebView2 / macOS·Linux WebKit，安装包只带前端资源和 Rust 程序。

2. **常用库用 Rust 原生驱动**  
   MySQL、PostgreSQL、SQLite、SQL Server、Redis、MongoDB、ClickHouse 等编译进主程序，运行时不必再起 Java。

3. **长尾库按需安装**  
   Oracle、达梦、Hive、Trino 等放到用户目录的 Agent；第一次连接时下载。  
   所以「25MB」和「100+ 数据库」可以同时成立。

代价：

- 第一次连某些库要多等一次下载  
- JDBC 路线仍会启动 Java 进程，内存比内置驱动高  
- Linux AppImage、Windows 离线包会变大，因为把 WebView 运行时打进去了  

### 4.4 混合驱动架构（核心）

官网明确写了三种驱动（另有可选 JDBC 插件）：

| 类型 | 怎么工作 | 典型数据库 | 是否要 JRE |
| --- | --- | --- | --- |
| 内置原生 | Rust 驱动编进 DBX | MySQL、PG、SQLite、SQL Server、Redis、Mongo、ClickHouse… | 否 |
| 原生 Agent | 独立 Go/Rust 进程或 sidecar | Oracle、人大金仓、虚谷、DuckDB、RabbitMQ… | 否 |
| JDBC Agent | Java 子进程 + 厂商 JDBC | 达梦、openGauss、GaussDB、Trino、Hive、DB2、Neo4j… | 是（JRE 21） |
| JDBC 插件 | 可选扩展，自定义 URL + JAR | 官方暂未覆盖的库 | 是 |

整体关系（与官方 Agent README 一致）：

```mermaid
flowchart TB
  Main[DBX 主进程<br/>Rust / Tauri]

  Main -->|进程内函数调用| Native[内置 Rust 驱动]
  Main -->|stdin / stdout<br/>JSON-RPC 2.0| AgentProc[Agent 子进程]

  AgentProc --> NatExe[原生 agent 可执行文件]
  AgentProc --> Jar[java -jar agent.jar]

  Native --> DB[(数据库)]
  NatExe --> DB
  Jar --> JDBC[厂商 JDBC / 原生库] --> DB
```

官方 Agent 仓库里的结构示意就是：

```text
DBX 主进程 (Rust/Tauri)
    │ stdin/stdout (JSON-RPC 2.0)
    ▼
agent / java -jar dbx-agent-{type}.jar
    │
    ▼
原生驱动 / JDBC → 数据库
```

为什么要拆成 Agent，而不是全塞进主程序：

1. **体积**：不必把每个厂商客户端链进主二进制  
2. **隔离**：某个 Java 驱动崩溃或泄漏时，只影响子进程；驱动管理里可看 PID、内存、CPU、最后错误，并可停止/重启  
3. **统一协议**：原生 Agent 和 JDBC Agent 对主进程暴露同一套 JSON-RPC，上面换 Oracle 的 Go 实现，界面层不用改  
4. **优先原生**：官方明确——有成熟且许可证兼容的 Go/Rust 驱动时优先原生，避免 JVM 空闲基线开销  

Agent 安装位置（本机）：

- 目录大致在 `~/.dbx/agents/drivers/<数据库类型>/`  
- Java：`agent.jar`  
- 原生：`agent` / `agent.exe`  
- JDBC 还可能用到托管 JRE（DBX 可下载管理，也可使用系统 Java）  

能力不是「连上就等于功能齐全」。官网按能力层划分：

| 能力层 | 含义 |
| --- | --- |
| Connect | 能连上，做基础查询 |
| Browse | 能浏览库 / Schema / 表或专用对象 |
| Understand | 对象源码、搜索、关系理解等只读能力 |
| Operate | 表数据编辑等受控写入 |

某个库没有 ER 图或执行计划时，界面会隐藏或降级，而不是放一个必报错的按钮。

### 4.5 一条查询在程序里怎么走

以桌面版执行 `SELECT` 为例：

```mermaid
sequenceDiagram
  participant UI as Vue 界面
  participant T as Tauri
  participant Core as Rust 核心
  participant Safety as 安全检查
  participant Drv as 内置驱动或 Agent
  participant DB as 数据库

  UI->>T: invoke execute_query
  T->>Core: 连接 ID + 库 + SQL
  Core->>Safety: 只读？生产保护？危险 SQL？
  alt 不允许
    Safety-->>UI: 拒绝或弹出确认
  else 允许
    alt 内置驱动
      Core->>Drv: Rust 协议直连
    else Agent
      Core->>Drv: stdin 写入 JSON-RPC 请求
    end
    Drv->>DB: 真正查询
    DB-->>Drv: 行数据
    Drv-->>Core: 结果（列类型、分页等）
    Core-->>UI: 返回给表格
    UI->>UI: 虚拟滚动只画可见行
  end
```

要点：

1. **前端不直连数据库**。UI 只负责编辑器和展示；执行一律进 Rust 核心。  
2. **安全检查在驱动之前**。只读、生产保护、危险语句确认发生在核心路径，不只是藏按钮。  
3. **大结果集分页 + 虚拟滚动**。后端按需取数，前端不创建百万 DOM 节点。  
4. **改数据先出 SQL 预览**。表格改单元格会生成语句给人看，确认后再走同一条执行路径。  
5. **Web 版差别在入口**：浏览器走 `crates/dbx-web` 的 HTTP，核心逻辑仍是 Rust；本地文件路径在 Docker 里指的是服务器文件系统。

桌面与 Web 的边界：

```mermaid
flowchart LR
  subgraph same [共用]
    R[Rust 核心<br/>查询 / 元数据 / 安全]
  end

  subgraph desktop [仅桌面]
    F1[本地文件选择]
    F2[SQL 文件树]
    F3[Deep Link]
    F4[本机 CLI Agent]
  end

  subgraph web [Docker / Web]
    W1[浏览器访问]
    W2[数据在服务器卷]
    W3[可设登录密码]
  end

  desktop --> R
  web --> R
```

### 4.6 连接、密码与本地存储

```mermaid
flowchart TB
  Form[连接表单] --> Plain[普通字段<br/>主机 / 端口 / 名称 / 颜色]
  Form --> Secret[敏感字段<br/>密码 / SSH / 连接串]

  Plain --> DBFile[(本地 dbx.db)]
  Secret --> Enc[加密后写入]
  Enc --> DBFile

  Key[本机密钥] --> Enc
  Key --> OS{运行方式}
  OS -->|macOS| KC[钥匙串]
  OS -->|Windows| CM[凭据管理器]
  OS -->|Linux| SS[Secret Service]
  OS -->|Docker / Web| SK[数据目录<br/>.dbx/secret.key]
```

含义：

- 普通字段和密码分开存，密码加密后再进 `dbx.db`  
- 密钥在系统凭据库里；Docker 默认在数据卷的 `secret.key`  
- **不能**把一台电脑的 `dbx.db` 直接拷到另一台指望密码还能用  
- 换机器请用带口令的加密导出 / 导入  
- Docker 要把数据卷权限管好：卷被整份拷走时，密钥往往也在里面  

### 4.7 写入安全：多层闸门

官网把保护拆成互相独立的层（上层不能放宽下层）：

```mermaid
flowchart TB
  L6[AI Ask 不执行<br/>AI Agent 单次确认]
  L5[MCP allowlist<br/>只读 / 数据读写 / 完全访问]
  L4[危险 SQL / Redis 高风险命令确认]
  L3[生产环境保护<br/>每次写入重新确认]
  L2[连接只读<br/>核心路径拦截写入]
  L1[数据库账号权限<br/>最终边界]

  L6 --> L5 --> L4 --> L3 --> L2 --> L1
```

| 层级 | 作用 | 能否被 AI / MCP 绕过 |
| --- | --- | --- |
| 数据库账号 | 服务器最终决定能不能写 | 不能 |
| 连接只读 | 核心路径拒绝可识别写入 | 不能；工作台可临时解锁 1/5 分钟，MCP/CLI 无此窗口 |
| 生产保护 | 生产库每次写入都要确认 | 不能永久跳过 |
| 危险操作确认 | DDL、无 WHERE 更新、危险 Redis 命令等 | 不放宽只读/生产保护 |
| MCP 策略 | allowlist + 三档权限 | 客户端环境变量不能放宽已保存策略 |

不同入口行为简述：

| 入口 | 只读连接时 | 生产保护时 |
| --- | --- | --- |
| SQL 编辑器 | 拒绝可识别写入（除非临时解锁） | 每次写入弹确认 |
| 数据表格 | 保存/删除前受只读约束 | 保存行进入生产确认 |
| AI Ask | 不执行 SQL | 不执行 SQL |
| AI Agent | 不能绕过只读 | 生产写入/DDL 只回编辑器，人自己执行 |
| MCP | 只读是上限 | 生产保护仍是上限 |

### 4.8 内置 AI 与 MCP：两条线

两者都碰数据库，但调用者不同：

```mermaid
flowchart TB
  subgraph inApp [应用内 AI]
    Ask[Ask：生成/解释/优化<br/>不主动查库]
    Agent[Agent：可只读取证<br/>写入需精确确认一次]
    Model[云端或本地模型<br/>OpenAI / Claude / Ollama…]
    Ask --> Model
    Agent --> Model
  end

  subgraph mcpSide [MCP]
    Cursor[Cursor / Claude Code]
    Srv[独立 MCP 进程]
    Policy[DBX 设置 → MCP<br/>allowlist + 权限档]
    Cursor --> Srv --> Policy
  end

  Guard[共同上限<br/>账号权限 · 连接只读 · 生产保护]
  Core[Rust 核心]
  DB[(数据库)]

  Model --> Guard
  Policy --> Guard
  Guard --> Core --> DB
```

**应用内 AI**

- 上下文来自：当前连接、库、Schema、编辑器 SQL、报错、`@表名`、结果预览  
- Ask：只给建议  
- Agent：可调用只读工具；写入必须展示完整 SQL，确认只绑定「同一连接 + 同一库 + 完全相同 SQL」，且只生效一次  
- 生产库上 Agent 不会自动执行写入/DDL  

**MCP**

- 独立进程，安装桌面版不会自动装上  
- 读本机 DBX 数据目录，或指向 Docker Web  
- 权限集中在 DBX「设置 → MCP」，不在每个 AI 客户端里各自放开  
- 「打开某张表」需要桌面版正在运行；纯查询可以不打开窗口  

### 4.9 插件扩展（了解）

除了数据库 Agent，还有插件体系（S3、Kubernetes、LDAP 等）：

- 插件包需签名校验后安装  
- UI 在沙箱中，可带 sidecar 进程  
- JDBC 插件是另一条可选路径：先装 `dbx-jdbc-plugin`，再导入厂商 JAR  
- 生态仍早，不要当成已经和 DBeaver 插件市场同级  

### 4.10 把整条链路串起来

从「你在 Cursor 里问一句」到「数据库返回结果」：

```mermaid
sequenceDiagram
  participant U as 你
  participant C as Cursor
  participant M as DBX MCP
  participant P as MCP 策略
  participant Core as Rust 核心
  participant A as 驱动 / Agent
  participant DB as MySQL

  U->>C: 查看 orders 表结构
  C->>M: 调用 MCP 工具
  M->>P: 连接在 allowlist？权限够吗？
  alt 未放行
    P-->>C: 拒绝
  else 允许
    M->>Core: 读元数据
    Core->>A: 内置驱动或 Agent
    A->>DB: 查询 information_schema 等
    DB-->>C: 字段信息
  end
```

记住这四句就够：

1. **界面薄、核心厚**：Vue 负责展示，Rust 负责连库和安全。  
2. **驱动分三路**：常用内置，其余 Agent，JDBC 要 JRE。  
3. **安全多层**：账号 → 只读 → 生产保护 → MCP/AI，不能反向放宽。  
4. **AI 有两条线**：窗口内助手 vs Cursor 用的 MCP，策略都在 DBX 里收口。  
