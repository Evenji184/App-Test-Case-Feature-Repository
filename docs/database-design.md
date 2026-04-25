# 数据库设计说明

## 1. 设计概览

数据库模型定义位于 [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)。当前共包含 10 个核心模型：

1. [`User`](../backend/prisma/schema.prisma:10)
2. [`Role`](../backend/prisma/schema.prisma:65)
3. [`Permission`](../backend/prisma/schema.prisma:90)
4. [`UserRole`](../backend/prisma/schema.prisma:115)
5. [`RolePermission`](../backend/prisma/schema.prisma:136)
6. [`FeatureNode`](../backend/prisma/schema.prisma:157)
7. [`Feature`](../backend/prisma/schema.prisma:202)
8. [`RequestLog`](../backend/prisma/schema.prisma:249)
9. [`AuditLog`](../backend/prisma/schema.prisma:272)
10. [`LoginLog`](../backend/prisma/schema.prisma:294)

整体设计特点：

- 统一使用 UUID 字符串主键
- 大部分业务表支持软删除 `deleted_at`
- 统一保留 `created_by/updated_by/deleted_by`
- RBAC 采用用户-角色、角色-权限双关联表
- 特征库支持树结构、复制来源、移动来源追踪
- 日志表与业务表分离

## 2. 数据库兼容性说明

当前存在一个必须知晓的实现现状：

- [`schema.prisma`](../backend/prisma/schema.prisma:6) 中 `datasource db.provider = "mysql"`
- 但 [`.env.example`](../.env.example:22) 与 [`docker-compose.yml`](../docker-compose.yml:3) 实际使用 PostgreSQL

因此，当前文档按“代码现状”记录：模型定义来自 Prisma Schema，运行部署来自 PostgreSQL 容器。上线前应先统一 provider 与实际数据库。

## 3. ER 关系概览

```text
User ──< UserRole >── Role ──< RolePermission >── Permission
  │
  ├──< RequestLog
  ├──< AuditLog
  └──< LoginLog

FeatureNode ──< Feature
FeatureNode ── self tree(parent/children)
FeatureNode ── source/copied_from/moved_from 追踪
Feature ── source/copied_from/moved_from 追踪
```

## 4. 表设计

### 4.1 users

模型：[`User`](../backend/prisma/schema.prisma:10)

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `String(36)` | 主键 UUID |
| `username` | `String(64)` | 用户名 |
| `email` | `String(255)` | 邮箱 |
| `password_hash` | `String(255)` | 密码哈希 |
| `display_name` | `String(128)?` | 显示名 |
| `phone` | `String(32)?` | 手机号 |
| `avatar_url` | `String(500)?` | 头像地址 |
| `status` | `String(32)` | 状态，默认 `active` |
| `is_super_admin` | `Boolean` | 是否超级管理员 |
| `last_login_at` | `DateTime?` | 最近登录时间 |
| `last_login_ip` | `String(45)?` | 最近登录 IP |
| `remark` | `Text?` | 备注 |
| `deleted_at` | `DateTime?` | 软删除时间 |
| `created_at` | `DateTime` | 创建时间 |
| `updated_at` | `DateTime` | 更新时间 |
| `created_by/updated_by/deleted_by` | `String(36)?` | 操作人 |

索引与约束：

- 唯一：`[username, deleted_at]`
- 唯一：`[email, deleted_at]`
- 索引：`[status, deleted_at]`
- 索引：`[created_at]`

业务用途：

- 登录认证
- 用户管理
- 审计关联操作人

### 4.2 roles

模型：[`Role`](../backend/prisma/schema.prisma:65)

| 字段 | 说明 |
| --- | --- |
| `name` | 角色名称 |
| `code` | 角色编码 |
| `description` | 角色描述 |
| `is_system` | 是否系统角色 |
| `status` | 角色状态 |

约束：

- 唯一：`[code, deleted_at]`
- 唯一：`[name, deleted_at]`

### 4.3 permissions

模型：[`Permission`](../backend/prisma/schema.prisma:90)

| 字段 | 说明 |
| --- | --- |
| `name` | 权限名称 |
| `code` | 权限编码 |
| `module` | 模块，如 `system/feature/audit` |
| `resource` | 资源 |
| `action` | 动作 |
| `description` | 描述 |

约束：

- 唯一：`[code, deleted_at]`
- 唯一：`[module, resource, action, deleted_at]`

初始化权限见 [`build_permissions()`](../backend/prisma/seed.py:19)。

### 4.4 user_roles

模型：[`UserRole`](../backend/prisma/schema.prisma:115)

作用：用户与角色多对多关联。

关键字段：

- `user_id`
- `role_id`
- `deleted_at`

约束：

- 唯一：`[user_id, role_id, deleted_at]`

### 4.5 role_permissions

模型：[`RolePermission`](../backend/prisma/schema.prisma:136)

作用：角色与权限多对多关联。

关键字段：

- `role_id`
- `permission_id`
- `deleted_at`

约束：

- 唯一：`[role_id, permission_id, deleted_at]`

### 4.6 feature_nodes

模型：[`FeatureNode`](../backend/prisma/schema.prisma:157)

该表用于维护特征树结构。

| 字段 | 说明 |
| --- | --- |
| `parent_id` | 父节点 ID |
| `name` | 节点名称 |
| `code` | 节点编码，同级唯一 |
| `node_type` | 节点类型，默认 `folder` |
| `path` | 树路径，如 `/mobile-app/auth-center` |
| `level` | 层级 |
| `sort_order` | 排序值 |
| `is_visible` | 是否可见 |
| `is_locked` | 是否锁定 |
| `source_node_id` | 来源节点 |
| `copied_from_node_id` | 复制来源节点 |
| `moved_from_node_id` | 移动来源节点 |
| `move_operation_id` | 移动操作批次 |
| `copy_operation_id` | 复制操作批次 |
| `remark` | 备注 |

约束与索引：

- 唯一：`[parent_id, code, deleted_at]`
- 索引：`[path(255)]`
- 索引：`[is_visible, deleted_at]`
- 索引：`[source_node_id]`
- 索引：`[copied_from_node_id]`
- 索引：`[moved_from_node_id]`

树结构维护逻辑见 [`NodeService.create_node()`](../backend/app/modules/feature_library/node_service.py:34) 与 [`NodeService.update_node()`](../backend/app/modules/feature_library/node_service.py:43)。

### 4.7 features

模型：[`Feature`](../backend/prisma/schema.prisma:202)

该表用于维护具体特征条目。

| 字段 | 说明 |
| --- | --- |
| `node_id` | 所属节点 |
| `title` | 特征标题 |
| `code` | 特征编码，同节点唯一 |
| `summary` | 摘要 |
| `description` | 详细描述 |
| `platform` | 平台，如 `ios,android` |
| `status` | 状态，默认 `draft` |
| `priority` | 优先级，默认 `medium` |
| `version` | 版本 |
| `tags` | 标签文本 |
| `is_visible` | 是否可见 |
| `is_archived` | 是否归档 |
| `source_feature_id` | 来源特征 |
| `copied_from_id` | 复制来源 |
| `moved_from_node_id` | 移动来源节点 |
| `move_operation_id` | 移动批次 |
| `copy_operation_id` | 复制批次 |
| `last_copied_at` | 最近复制时间 |
| `last_moved_at` | 最近移动时间 |
| `remark` | 备注 |

约束与索引：

- 唯一：`[node_id, code, deleted_at]`
- 索引：`[status, deleted_at]`
- 索引：`[is_visible, deleted_at]`
- 索引：`[source_feature_id]`
- 索引：`[copied_from_id]`
- 索引：`[moved_from_node_id]`

业务逻辑见 [`FeatureService`](../backend/app/modules/feature_library/feature_service.py:12)。

### 4.8 request_logs

模型：[`RequestLog`](../backend/prisma/schema.prisma:249)

作用：记录 HTTP/GraphQL 请求元数据。

关键字段：

- `request_id`
- `user_id`
- `method`
- `path`
- `query_string`
- `request_body`
- `response_status`
- `response_body`
- `duration_ms`
- `ip_address`
- `user_agent`
- `trace_id`

写入逻辑见 [`request_logging_middleware`](../backend/app/middleware/request_logging.py:26)。

### 4.9 audit_logs

模型：[`AuditLog`](../backend/prisma/schema.prisma:272)

作用：记录关键业务操作审计。

关键字段：

- `user_id`
- `request_id`
- `action`
- `target_type`
- `target_id`
- `target_name`
- `change_summary`
- `before_data`
- `after_data`

写入逻辑见 [`AuditService.log_operation()`](../backend/app/modules/audit/service.py:9)。

### 4.10 login_logs

模型：[`LoginLog`](../backend/prisma/schema.prisma:294)

作用：记录登录成功/失败行为。

关键字段：

- `username`
- `user_id`
- `login_type`
- `login_status`
- `failure_reason`
- `ip_address`
- `user_agent`
- `occurred_at`

写入逻辑见 [`AuditService.log_login()`](../backend/app/modules/audit/service.py:40)。

## 5. 软删除策略

以下业务表采用软删除：

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `feature_nodes`
- `features`

服务层查询时统一带 `deleted_at: None`，例如：

- [`UserService.list_users()`](../backend/app/modules/user/service.py:13)
- [`NodeService._get_node()`](../backend/app/modules/feature_library/node_service.py:13)
- [`FeatureService._get_feature()`](../backend/app/modules/feature_library/feature_service.py:14)

## 6. 审计字段设计

大部分业务表保留：

- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `deleted_at`
- `deleted_by`

这使得系统可以：

- 追踪谁创建/修改/删除了数据
- 与 [`AuditLog`](../backend/prisma/schema.prisma:272) 形成互补

## 7. 种子数据设计

种子脚本位于 [`backend/prisma/seed.py`](../backend/prisma/seed.py)。

初始化内容包括：

- 默认管理员用户
- 默认管理员角色
- 11 个初始化权限
- 管理员角色授权
- 管理员用户绑定角色
- 示例特征树与特征条目

## 8. 典型查询路径

### 8.1 获取用户权限

`users -> user_roles -> roles -> role_permissions -> permissions`

实现见 [`RBACService.get_user_permissions()`](../backend/app/modules/rbac/service.py:9)。

### 8.2 获取节点树

`feature_nodes` 自关联，通过 `parent_id` 组织树。

数据查询见 [`NodeService.get_node_tree()`](../backend/app/modules/feature_library/node_service.py:30)。

### 8.3 获取节点下特征

`feature_nodes -> features`

实现见 [`FeatureService.list_features()`](../backend/app/modules/feature_library/feature_service.py:21)。

## 9. 已知限制

1. Prisma provider 与实际数据库不一致
2. `RequestLog.response_body` 字段已建模，但当前中间件写入固定为 `None`，见 [`request_logging_middleware`](../backend/app/middleware/request_logging.py:92)
3. `is_locked` 字段已建模，但当前服务层未实现锁定校验逻辑
4. `is_archived` 字段已建模，但前端管理页未提供独立归档操作
