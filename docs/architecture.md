# 系统架构说明

## 1. 架构目标

本项目面向“APP 特征库管理系统”场景，目标是提供一套可维护的功能树、特征条目、用户权限与日志审计平台。当前实现采用前后端分离架构，后端统一通过 GraphQL 暴露业务能力，前端通过 Apollo Client 消费接口。

## 2. 总体架构

```text
浏览器 / H5
   │
   ▼
React + Vite + Apollo Client
   │  HTTP / GraphQL
   ▼
Nginx
   ├─ /graphql -> FastAPI + Strawberry GraphQL
   └─ /      -> Frontend 容器（当前为占位页）
   │
   ▼
FastAPI 应用
   ├─ 中间件：请求 ID、Trace ID、请求日志
   ├─ GraphQL Schema：Query / Mutation
   ├─ 业务模块：auth / rbac / user / feature_library / audit
   └─ Prisma Client Python
   │
   ▼
数据库
   ├─ users / roles / permissions
   ├─ feature_nodes / features
   ├─ request_logs / audit_logs / login_logs
   └─ 关联表 user_roles / role_permissions
```

## 3. 分层设计

### 3.1 前端层

前端位于 [`frontend/src`](frontend/src)，主要职责：

- 页面渲染与交互
- GraphQL 查询/变更发起
- 登录态与权限态缓存
- 页面级路由守卫

关键组成：

- 路由：[`AppRoutes`](../frontend/src/routes/index.tsx:13)
- 认证守卫：[`RequireAuth`](../frontend/src/routes/guards.tsx:5)
- 权限守卫：[`RequirePermission`](../frontend/src/routes/guards.tsx:24)
- GraphQL 客户端：[`apolloClient`](../frontend/src/api/client.ts:31)
- 认证状态：[`useAuthStore`](../frontend/src/stores/auth.ts)

### 3.2 接入层

Nginx 配置位于 [`docker/nginx.conf`](../docker/nginx.conf)，负责：

- 统一入口
- 反向代理后端 `/graphql`
- 转发健康检查 `/health`
- 承载前端静态内容

### 3.3 应用层

FastAPI 应用入口位于 [`backend/app/main.py`](../backend/app/main.py:36)。

应用层职责：

- 生命周期管理：[`lifespan`](../backend/app/main.py:24)
- CORS：[`CORSMiddleware`](../backend/app/main.py:43)
- 请求上下文：[`request_context_middleware`](../backend/app/main.py:57)
- 请求日志：[`access_log_middleware`](../backend/app/main.py:52)
- 异常处理：[`app_error_handler`](../backend/app/main.py:66)、[`unhandled_exception_handler`](../backend/app/main.py:91)
- 健康检查：[`healthcheck`](../backend/app/main.py:114)
- GraphQL 路由挂载：[`GraphQLRouter`](../backend/app/main.py:124)

### 3.4 GraphQL 层

Schema 位于 [`backend/app/graphql/schema.py`](../backend/app/graphql/schema.py)。

职责：

- 定义 Query / Mutation
- 调用业务 Service
- 统一返回 `success/message/error/data` 结构
- 在关键 Mutation 后写入审计日志

GraphQL 上下文由 [`get_graphql_context()`](../backend/app/core/context.py:26) 构建，注入：

- `request`
- `prisma`
- `request_id`
- `user`
- `permissions`
- `trace_id`

### 3.5 业务服务层

业务逻辑按模块拆分在 [`backend/app/modules`](../backend/app/modules) 下：

- 认证：[`AuthService`](../backend/app/modules/auth/service.py:12)
- 权限：[`RBACService`](../backend/app/modules/rbac/service.py:7)
- 用户：[`UserService`](../backend/app/modules/user/service.py:11)
- 节点：[`NodeService`](../backend/app/modules/feature_library/node_service.py:11)
- 特征：[`FeatureService`](../backend/app/modules/feature_library/feature_service.py:12)
- 审计：[`AuditService`](../backend/app/modules/audit/service.py:7)

### 3.6 数据访问层

Prisma 客户端由 [`PrismaManager`](../backend/app/db/prisma.py:10) 管理，负责：

- 连接建立
- 连接关闭
- 健康检查

业务服务直接通过 `prisma.<model>` 访问数据表。

## 4. 核心业务流

### 4.1 登录流

1. 前端调用 [`LOGIN_MUTATION`](../frontend/src/api/mutations/auth.ts:4)
2. 后端执行 [`login`](../backend/app/graphql/schema.py:170)
3. 进入 [`AuthService.authenticate()`](../backend/app/modules/auth/service.py:14)
4. 校验密码 [`verify_password()`](../backend/app/core/security.py:20)
5. 查询权限 [`RBACService.get_user_permissions()`](../backend/app/modules/rbac/service.py:9)
6. 生成 JWT [`create_access_token()`](../backend/app/core/security.py:26)
7. 写入 [`LoginLog`](../backend/prisma/schema.prisma:294)
8. 前端保存 token 与权限并跳转

### 4.2 GraphQL 鉴权流

1. 前端在 [`authLink`](../frontend/src/api/client.ts:9) 中注入 `Authorization`
2. Resolver 调用 [`require_permission()`](../backend/app/modules/auth/dependencies.py:35)
3. 解析 JWT [`decode_access_token()`](../backend/app/core/security.py:38)
4. 查询用户并缓存到 `info.context.user`
5. 加载权限集到 `info.context.permissions`
6. 校验权限码，不通过则抛出 [`AuthorizationError`](../backend/app/modules/auth/dependencies.py:41)

### 4.3 请求日志流

1. 请求进入 [`request_logging_middleware`](../backend/app/middleware/request_logging.py:26)
2. 生成 `trace_id`
3. 对 GraphQL 请求提取 `operationName/query/variables`
4. 执行业务
5. 记录耗时、状态码、用户信息
6. 写入 [`request_logs`](../backend/prisma/schema.prisma:249)
7. 返回响应头 `X-Trace-ID`

### 4.4 审计日志流

1. 关键 Mutation 成功后调用内部 `_audit_log(...)`
2. 进入 [`AuditService.log_operation()`](../backend/app/modules/audit/service.py:9)
3. 写入操作人、目标对象、摘要、前后数据、请求标识
4. 落表到 [`audit_logs`](../backend/prisma/schema.prisma:272)

## 5. 模块职责划分

### 5.1 auth

- 登录
- 当前用户识别
- JWT 认证
- 密码重置

### 5.2 rbac

- 用户权限聚合
- 权限树分组
- 权限校验

### 5.3 user

- 用户列表/详情
- 创建/更新用户
- 启停用
- 分配角色

### 5.4 feature_library

- 节点树维护
- 特征条目维护
- 复制/移动追踪
- 显示/隐藏

### 5.5 audit

- 操作审计
- 登录日志

## 6. 目录与职责映射

| 目录 | 作用 |
| --- | --- |
| [`backend/app/core`](../backend/app/core) | 配置、安全、日志、上下文 |
| [`backend/app/graphql`](../backend/app/graphql) | GraphQL Schema、类型、指令 |
| [`backend/app/modules`](../backend/app/modules) | 业务服务 |
| [`backend/app/middleware`](../backend/app/middleware) | 请求日志中间件 |
| [`backend/prisma`](../backend/prisma) | 数据模型与种子数据 |
| [`frontend/src/pages`](../frontend/src/pages) | 页面实现 |
| [`frontend/src/api`](../frontend/src/api) | GraphQL 文档与客户端 |
| [`docker`](../docker) | 容器镜像与代理配置 |

## 7. 技术选型原因

### 7.1 FastAPI + Strawberry

- Python 生态成熟
- 异步支持良好
- GraphQL 类型定义清晰
- 适合中小型管理系统快速交付

### 7.2 Prisma Client Python

- 数据模型集中在 [`schema.prisma`](../backend/prisma/schema.prisma)
- 便于统一维护表结构与种子数据
- 与 GraphQL 服务层配合简单直接

### 7.3 React + Apollo Client

- GraphQL 查询/缓存能力成熟
- 适合多页面管理台
- 与 TypeScript 类型约束配合较好

## 8. 当前架构限制

1. 前端容器仍为占位页，生产静态构建链路未接入，见 [`docker/frontend.Dockerfile`](../docker/frontend.Dockerfile:1)
2. 前端页面权限码与后端权限种子未完全对齐，见 [`frontend/src/routes/index.tsx`](../frontend/src/routes/index.tsx:33) 与 [`backend/prisma/seed.py`](../backend/prisma/seed.py:19)
3. 数据库 provider 与实际部署数据库不一致，见 [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:6)
4. GraphQL 已覆盖主要业务，但登录日志未提供查询接口

## 9. 建议阅读顺序

1. [`README.md`](../README.md)
2. [`database-design.md`](database-design.md)
3. [`api-graphql.md`](api-graphql.md)
4. [`rbac-design.md`](rbac-design.md)
5. [`logging-audit.md`](logging-audit.md)
6. [`frontend-pages.md`](frontend-pages.md)
7. [`deployment.md`](deployment.md)
