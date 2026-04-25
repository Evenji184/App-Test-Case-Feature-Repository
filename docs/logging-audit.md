# 请求日志与审计说明

## 1. 设计目标

系统日志分为三类：

1. 请求日志：记录每次 HTTP/GraphQL 请求
2. 审计日志：记录关键业务操作
3. 登录日志：记录登录成功/失败行为

对应数据表：

- [`RequestLog`](../backend/prisma/schema.prisma:249)
- [`AuditLog`](../backend/prisma/schema.prisma:272)
- [`LoginLog`](../backend/prisma/schema.prisma:294)

## 2. 请求日志

### 2.1 中间件入口

请求日志中间件实现于 [`request_logging_middleware`](../backend/app/middleware/request_logging.py:26)，并在 [`access_log_middleware`](../backend/app/main.py:52) 中挂载。

### 2.2 记录内容

中间件会记录：

- `trace_id`
- `request_id`
- `method`
- `path`
- GraphQL `operation_name`
- GraphQL `query_summary`
- GraphQL `variables_summary`
- `duration_ms`
- `user_id`
- `username`
- `status_code`

同时会将请求元数据写入 [`request_logs`](../backend/prisma/schema.prisma:249)。

### 2.3 GraphQL 请求特殊处理

当路径以 `/graphql` 结尾时，中间件会：

1. 读取请求体
2. 解析 JSON
3. 提取 `operationName`
4. 截断 `query` 到 500 字符
5. 截断 `variables` 到 1000 字符

实现见 [`request_logging_middleware`](../backend/app/middleware/request_logging.py:35)。

### 2.4 响应头

中间件会在响应头中写入：

- `X-Trace-ID`

请求上下文中间件会写入：

- `X-Request-ID`

见 [`request_context_middleware`](../backend/app/main.py:57) 与 [`request_logging_middleware`](../backend/app/middleware/request_logging.py:102)。

### 2.5 持久化条件

只有当 Prisma 已连接时才会写库，见 [`if prisma.is_connected()`](../backend/app/middleware/request_logging.py:72)。

如果写库失败，仅记录 warning，不阻断主流程。

## 3. 审计日志

### 3.1 服务入口

实现：[`AuditService.log_operation()`](../backend/app/modules/audit/service.py:9)

### 3.2 记录字段

| 字段 | 说明 |
| --- | --- |
| `request_id` | 请求标识 |
| `user_id` | 操作人 |
| `action` | 操作动作 |
| `target_type` | 目标类型 |
| `target_id` | 目标 ID |
| `target_name` | 目标名称 |
| `change_summary` | 变更摘要 |
| `before_data` | 变更前 JSON |
| `after_data` | 变更后 JSON |
| `ip_address` | IP |
| `user_agent` | UA |

### 3.3 触发时机

GraphQL 中关键 Mutation 成功后会调用内部审计记录逻辑，例如：

- 用户创建/更新/启停用/分配角色/重置密码
- 角色创建/更新/分配权限
- 节点创建/更新/删除/显示隐藏/复制/移动
- 特征创建/更新/删除/显示隐藏/复制/移动

示例可见 [`move_feature`](../backend/app/graphql/schema.py:400) 中的 `_audit_log(...)` 调用。

### 3.4 数据格式

`before_data` 与 `after_data` 会被序列化为 JSON 字符串，见 [`json.dumps(...)`](../backend/app/modules/audit/service.py:33)。

## 4. 登录日志

### 4.1 服务入口

实现：[`AuditService.log_login()`](../backend/app/modules/audit/service.py:40)

### 4.2 触发时机

登录逻辑位于 [`AuthService.authenticate()`](../backend/app/modules/auth/service.py:14)。

两种情况都会写日志：

- 用户名或密码错误：写入 `failed`
- 登录成功：写入 `success`

### 4.3 记录字段

- `username`
- `user_id`
- `login_status`
- `failure_reason`
- `ip_address`
- `user_agent`

## 5. 应用日志输出

### 5.1 日志初始化

应用启动时调用 [`setup_logging(settings)`](../backend/app/main.py:20)。

### 5.2 日志格式

日志配置位于 [`backend/app/core/logging.py`](../backend/app/core/logging.py)。

支持：

- 普通文本日志
- JSON 日志格式

由环境变量 `LOG_JSON` 控制，见 [`.env.example`](../.env.example:25)。

## 6. 查询能力

### 6.1 已提供 GraphQL 查询

- [`auditLogList`](../backend/app/graphql/schema.py:147)
- [`requestLogList`](../backend/app/graphql/schema.py:158)

### 6.2 尚未提供的查询

- `loginLogList` 当前未实现 GraphQL Query

因此登录日志虽然会写库，但前端和 API 文档层面尚不能直接查询。

## 7. 安全与截断策略

### 7.1 截断策略

中间件使用 [`_safe_json_dumps()`](../backend/app/middleware/request_logging.py:16) 对日志内容做长度限制：

- 默认 1000 字符
- 某些场景 4000 字符

### 7.2 当前风险

当前实现并未对敏感字段做专门脱敏，例如：

- 登录 Mutation 的密码理论上可能出现在原始请求体中
- 虽然 GraphQL 请求体被摘要化，但仍应视为存在敏感信息暴露风险

## 8. 典型链路

### 8.1 登录失败

1. 请求进入中间件，生成 `trace_id`
2. GraphQL 执行 `login`
3. [`AuthService.authenticate()`](../backend/app/modules/auth/service.py:14) 校验失败
4. 写入 [`LoginLog`](../backend/prisma/schema.prisma:294)
5. 请求中间件写入 [`RequestLog`](../backend/prisma/schema.prisma:249)

### 8.2 新建特征

1. 请求进入中间件
2. Resolver 调用 [`require_permission()`](../backend/app/modules/auth/dependencies.py:35)
3. 执行 [`FeatureService.create_feature()`](../backend/app/modules/feature_library/feature_service.py:33)
4. 成功后写入 [`AuditLog`](../backend/prisma/schema.prisma:272)
5. 请求结束后写入 [`RequestLog`](../backend/prisma/schema.prisma:249)

## 9. 已知限制

1. `RequestLog.response_body` 当前未实际记录响应体
2. 登录日志无 GraphQL 查询接口
3. 敏感字段脱敏策略尚未实现
4. 日志清理、归档、保留周期尚未实现
