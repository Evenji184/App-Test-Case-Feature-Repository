# APP 特征库管理系统

APP 特征库管理系统用于维护移动端 APP 的功能节点、特征条目、用户、角色、权限以及请求/审计日志。当前仓库已经包含前端、后端、Prisma、Docker Compose 与初始化种子数据，可作为完整项目交付的基础骨架。

## 1. 项目概览

### 1.1 当前实现范围

- 后端：基于 FastAPI + Strawberry GraphQL 提供统一接口，入口见 [`app.main`](backend/app/main.py:36)
- 前端：基于 React + Vite + Apollo Client 的移动优先管理界面，路由入口见 [`AppRoutes`](frontend/src/routes/index.tsx:13)
- 数据层：使用 Prisma Client Python 访问数据库，客户端管理见 [`PrismaManager`](backend/app/db/prisma.py:10)
- 权限：基于 RBAC 的角色-权限-用户授权模型，核心逻辑见 [`RBACService`](backend/app/modules/rbac/service.py:7)
- 日志：包含请求日志、操作审计日志、登录日志，分别落表到 [`RequestLog`](backend/prisma/schema.prisma:249)、[`AuditLog`](backend/prisma/schema.prisma:272)、[`LoginLog`](backend/prisma/schema.prisma:294)
- 部署：提供开发/生产两套 Compose 配置，见 [`docker-compose.yml`](docker-compose.yml) 与 [`docker-compose.prod.yml`](docker-compose.prod.yml)

### 1.2 适用场景

- APP 功能树与测试特征库管理
- 账号、角色、权限维护
- 登录行为与操作行为留痕
- Docker 化本地联调与基础部署

## 2. 技术选型

### 2.1 后端

- FastAPI：Web 框架，见 [`FastAPI(...)`](backend/app/main.py:36)
- Strawberry GraphQL：GraphQL Schema 与 Resolver，见 [`schema = strawberry.Schema(...)`](backend/app/graphql/schema.py:409)
- Prisma Client Python：数据库访问，见 [`Prisma(auto_register=True)`](backend/app/db/prisma.py:14)
- Pydantic Settings：环境变量配置，见 [`Settings`](backend/app/core/config.py:10)
- python-jose：JWT 编解码，见 [`create_access_token()`](backend/app/core/security.py:26)
- passlib[bcrypt]：密码哈希，见 [`hash_password()`](backend/app/core/security.py:14)

### 2.2 前端

- React 18 + TypeScript
- Vite 5
- Apollo Client 3，见 [`apolloClient`](frontend/src/api/client.ts:31)
- React Router 6，见 [`Routes`](frontend/src/routes/index.tsx:21)
- Zustand，见 [`useAppStore`](frontend/src/stores/app.ts:12)、[`usePermissionStore`](frontend/src/stores/permission.ts:15)
- Ant Design Mobile 5，页面组件广泛使用于 [`LoginPage`](frontend/src/pages/Login/index.tsx:6)、[`FeatureManagePage`](frontend/src/pages/FeatureManage/index.tsx:39) 等

### 2.3 数据与部署

- Docker Compose 编排
- Nginx 反向代理，见 [`docker/nginx.conf`](docker/nginx.conf)
- 数据库容器实际使用 `postgres:16-alpine`，见 [`docker-compose.yml`](docker-compose.yml:3)

## 3. 目录结构

```text
.
├─ backend/                 # FastAPI + GraphQL + Prisma 后端
│  ├─ app/
│  │  ├─ core/              # 配置、安全、日志、上下文
│  │  ├─ db/                # Prisma 客户端管理
│  │  ├─ graphql/           # Schema、类型、指令
│  │  ├─ middleware/        # 请求日志中间件
│  │  ├─ modules/           # auth/rbac/user/audit/feature_library
│  │  └─ utils/             # 异常、分页、树工具
│  ├─ prisma/               # schema 与 seed
│  └─ scripts/              # 初始化脚本
├─ frontend/                # React + Vite 前端
│  └─ src/
│     ├─ api/               # GraphQL 查询与变更
│     ├─ components/        # 通用组件
│     ├─ hooks/             # useAuth/usePermission
│     ├─ layouts/           # 登录布局、主布局
│     ├─ pages/             # 登录/特征库/权限/用户页面
│     ├─ routes/            # 路由与守卫
│     ├─ stores/            # Zustand 状态
│     └─ utils/             # 权限、存储、树工具
├─ docker/                  # Dockerfile 与 Nginx 配置
├─ docs/                    # 项目文档
├─ docker-compose.yml       # 开发编排
├─ docker-compose.prod.yml  # 生产编排覆盖
└─ .env.example             # 环境变量示例
```

## 4. 核心能力

### 4.1 认证与登录

- 登录 Mutation：[`login`](backend/app/graphql/schema.py:170)
- 当前用户查询：[`current_user`](backend/app/graphql/schema.py:84)
- JWT 生成：[`create_access_token()`](backend/app/core/security.py:26)
- 登录成功后更新最近登录时间/IP：[`AuthService.authenticate()`](backend/app/modules/auth/service.py:14)
- 登录日志写入：[`AuditService.log_login()`](backend/app/modules/audit/service.py:40)

### 4.2 特征库管理

- 节点树查询：[`node_tree`](backend/app/graphql/schema.py:102)
- 节点增删改、显示/隐藏、复制、移动：见 [`Mutation`](backend/app/graphql/schema.py:214)
- 特征列表/详情/搜索：见 [`feature_list`](backend/app/graphql/schema.py:120)、[`feature_detail`](backend/app/graphql/schema.py:129)、[`search_features`](backend/app/graphql/schema.py:138)
- 特征增删改、显示/隐藏、复制、移动：见 [`Mutation`](backend/app/graphql/schema.py:320)

### 4.3 用户与权限管理

- 用户列表与详情：[`user_list`](backend/app/graphql/schema.py:57)、[`user_detail`](backend/app/graphql/schema.py:75)
- 角色列表：[`role_list`](backend/app/graphql/schema.py:93)
- 权限树：[`permission_tree`](backend/app/graphql/schema.py:111)
- 用户分配角色：[`assign_roles_to_user`](backend/app/graphql/schema.py:264)
- 角色分配权限：[`assign_permissions_to_role`](backend/app/graphql/schema.py:307)

### 4.4 日志与审计

- 请求日志中间件：[`request_logging_middleware`](backend/app/middleware/request_logging.py:26)
- 审计日志查询：[`audit_log_list`](backend/app/graphql/schema.py:147)
- 请求日志查询：[`request_log_list`](backend/app/graphql/schema.py:158)
- 登录日志当前仅写库，未暴露 GraphQL 查询

## 5. 快速开始

### 5.1 环境准备

- Docker / Docker Compose
- Node.js 20+
- Python 3.11+

### 5.2 配置环境变量

复制 [`.env.example`](.env.example) 为 [`.env`](.env)，至少确认以下配置：

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL`
- `SECRET_KEY`
- `CORS_ORIGINS`

### 5.3 Docker 启动

开发环境：

```bash
docker compose up --build
```

启动后默认端口：

- Nginx：`80`
- 后端：`8000`
- 前端占位容器：`3000`
- PostgreSQL：`5432`

### 5.4 初始化数据库

如果未通过容器自动完成初始化，可在后端目录执行：

- Linux/macOS：[`backend/scripts/init-db.sh`](backend/scripts/init-db.sh)
- Windows：[`backend/scripts/init-db.bat`](backend/scripts/init-db.bat)

脚本会依次执行：

1. `prisma generate`
2. `prisma db push`
3. `python prisma/seed.py`

## 6. 默认账号与种子数据

种子脚本见 [`backend/prisma/seed.py`](backend/prisma/seed.py)。

### 6.1 默认管理员

- 用户名：`admin`
- 密码：`admin123456`
- 邮箱：`admin@app-feature.local`
- 显示名：`系统管理员`

来源见 [`upsert_admin_user()`](backend/prisma/seed.py:169)。

### 6.2 初始化角色

- 角色编码：`admin`
- 角色名称：`系统管理员`

来源见 [`upsert_role()`](backend/prisma/seed.py:126)。

### 6.3 初始化权限

种子脚本会创建 11 个权限，覆盖：

- 用户查看/管理
- 角色管理
- 权限查看
- 节点查看/管理
- 特征查看/管理
- 审计/登录/请求日志查看

来源见 [`build_permissions()`](backend/prisma/seed.py:19)。

### 6.4 初始化特征树

示例节点：

- `mobile-app`
- `auth-center`
- `password-login`
- `profile-center`

示例特征：

- `login-basic-success`
- `login-password-error`
- `profile-avatar-edit`

来源见 [`seed_feature_tree()`](backend/prisma/seed.py:238)。

## 7. 开发说明

### 7.1 后端本地运行

```bash
cd backend
pip install -r requirements.txt
python -m prisma generate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7.2 前端本地运行

```bash
cd frontend
npm install
npm run dev
```

前端 GraphQL 地址由 [`VITE_GRAPHQL_ENDPOINT`](frontend/src/api/client.ts:6) 指定。

## 8. 文档索引

建议按以下顺序阅读：

1. [`README.md`](README.md)
2. [`docs/architecture.md`](docs/architecture.md)
3. [`docs/database-design.md`](docs/database-design.md)
4. [`docs/api-graphql.md`](docs/api-graphql.md)
5. [`docs/rbac-design.md`](docs/rbac-design.md)
6. [`docs/logging-audit.md`](docs/logging-audit.md)
7. [`docs/frontend-pages.md`](docs/frontend-pages.md)
8. [`docs/deployment.md`](docs/deployment.md)

## 9. 已知限制

以下内容是当前代码实现中的真实限制，文档已按现状记录，不做虚构补齐：

1. [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:6) 的 `provider = "mysql"` 与 [`.env.example`](.env.example:22)、[`docker-compose.yml`](docker-compose.yml:3) 的 PostgreSQL 实际部署不一致。
2. [`docker-compose.yml`](docker-compose.yml:2) 中服务名仍命名为 `mysql`，但镜像实际是 PostgreSQL，仅为兼容父任务命名。
3. [`docker/frontend.Dockerfile`](docker/frontend.Dockerfile:1) 仍是前端占位容器，而非正式构建产物镜像。
4. 前端路由守卫使用的权限码 [`feature:list`](frontend/src/routes/index.tsx:33)、[`permission:list`](frontend/src/routes/index.tsx:36)、[`user:list`](frontend/src/routes/index.tsx:39) 与后端种子权限码并不一致，当前会影响页面级权限拦截效果。
5. 登录日志已写入 [`LoginLog`](backend/prisma/schema.prisma:294)，但 GraphQL 暂未提供登录日志查询接口。
6. 节点/特征复制与移动能力后端已实现，但前端管理页当前未暴露对应操作入口，前端仅覆盖基础增删改与显示/隐藏。

## 10. 许可证与交付说明

当前仓库更适合作为项目交付骨架与功能样例库，不应直接视为零改造即可上线的生产成品。上线前应优先修正数据库 provider、前端镜像构建流程、权限码对齐与安全配置。
