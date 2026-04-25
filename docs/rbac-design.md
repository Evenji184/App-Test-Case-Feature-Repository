# RBAC 设计说明

## 1. 设计目标

本项目采用基于角色的访问控制（RBAC）模型，实现：

- 用户登录后获取权限集合
- 页面与接口按权限码控制访问
- 超级管理员具备全量放行能力
- 角色与权限可在系统内维护

核心实现位于：

- [`RBACService`](../backend/app/modules/rbac/service.py:7)
- [`require_permission()`](../backend/app/modules/auth/dependencies.py:35)
- [`usePermission()`](../frontend/src/hooks/usePermission.ts:3)
- [`hasPermission()`](../frontend/src/utils/permission.ts:1)

## 2. 权限模型

### 2.1 数据模型

RBAC 相关表：

- [`users`](../backend/prisma/schema.prisma:10)
- [`roles`](../backend/prisma/schema.prisma:65)
- [`permissions`](../backend/prisma/schema.prisma:90)
- [`user_roles`](../backend/prisma/schema.prisma:115)
- [`role_permissions`](../backend/prisma/schema.prisma:136)

关系：

```text
User -> UserRole -> Role -> RolePermission -> Permission
```

### 2.2 权限编码规则

当前种子权限采用三段式编码：

```text
<module>:<resource>:<action>
```

示例见 [`build_permissions()`](../backend/prisma/seed.py:19)：

- `system:user:view`
- `system:user:manage`
- `system:role:manage`
- `system:permission:view`
- `feature:node:view`
- `feature:node:manage`
- `feature:item:view`
- `feature:item:manage`
- `audit:log:view`
- `audit:login:view`
- `audit:request:view`

## 3. 后端权限聚合

### 3.1 获取用户权限

实现：[`RBACService.get_user_permissions()`](../backend/app/modules/rbac/service.py:9)

逻辑：

1. 查询用户有效角色
2. 过滤已删除或非激活角色
3. 遍历角色下有效权限
4. 聚合为 `set[str]`

特点：

- 自动去重
- 只返回未软删除权限
- 只认 `status == active` 的角色

### 3.2 超级管理员

实现：[`RBACService.user_has_permission()`](../backend/app/modules/rbac/service.py:35) 与 [`require_permission()`](../backend/app/modules/auth/dependencies.py:35)

规则：

- `is_super_admin = true` 时直接放行
- 无需依赖角色权限表

默认管理员种子数据见 [`upsert_admin_user()`](../backend/prisma/seed.py:169)。

## 4. 后端权限校验

### 4.1 当前用户识别

实现：[`get_current_user()`](../backend/app/modules/auth/dependencies.py:12)

流程：

1. 从 `Authorization` 头读取 Bearer Token
2. 调用 [`decode_access_token()`](../backend/app/core/security.py:38)
3. 根据 `sub` 查询用户
4. 校验用户状态为 `active`
5. 将用户与权限缓存到 GraphQL Context

### 4.2 接口权限校验

实现：[`require_permission()`](../backend/app/modules/auth/dependencies.py:35)

规则：

- 未登录：抛出认证异常
- 超级管理员：直接通过
- 普通用户：权限码必须存在于权限集合中
- 不满足时抛出 `缺少权限: <permission_code>`

### 4.3 GraphQL 中的使用方式

Resolver 中直接调用：

```python
operator = await require_permission(info, "feature:item:manage")
```

当前项目中，用户、角色、节点、特征等 Mutation 均采用此方式。

## 5. 权限树设计

### 5.1 后端分组逻辑

实现：[`RBACService.get_permission_tree()`](../backend/app/modules/rbac/service.py:44)

分组结构：

```text
module
  └─ resource
      └─ permissions[]
```

返回类型：

- [`PermissionModuleGroup`](../backend/app/graphql/types/permission.py:23)
- [`PermissionResourceGroup`](../backend/app/graphql/types/permission.py:17)

### 5.2 前端使用

前端通过 [`fetchPermissionTree()`](../frontend/src/stores/permission.ts:19) 拉取权限树，并在 [`PermissionSelector`](../frontend/src/components/PermissionSelector/index.tsx) 中展示。

## 6. 角色授权

### 6.1 角色创建与编辑

前端页面：[`PermissionManagePage`](../frontend/src/pages/PermissionManage/index.tsx:10)

后端接口：

- [`create_role`](../backend/app/graphql/schema.py:275)
- [`update_role`](../backend/app/graphql/schema.py:286)

### 6.2 分配权限到角色

前端 Mutation：[`ASSIGN_PERMISSIONS_TO_ROLE_MUTATION`](../frontend/src/api/mutations/role.ts:38)

后端接口：[`assign_permissions_to_role`](../backend/app/graphql/schema.py:297)

数据落点：[`role_permissions`](../backend/prisma/schema.prisma:136)

## 7. 用户授权

### 7.1 分配角色到用户

前端 Mutation：[`ASSIGN_ROLES_TO_USER_MUTATION`](../frontend/src/api/mutations/user.ts:64)

后端接口：[`assign_roles_to_user`](../backend/app/graphql/schema.py:240)

服务逻辑：[`UserService.assign_roles()`](../backend/app/modules/user/service.py:68)

实现方式：

1. 先将旧的 `user_roles` 软删除
2. 再创建新的用户角色关联

## 8. 前端权限校验

### 8.1 登录态中的权限集合

登录成功后，后端返回 `permissions` 数组，见 [`LoginPayload`](../backend/app/graphql/types/auth.py:20)。

前端会将其保存到认证状态中，供页面与组件判断使用。

### 8.2 工具函数

实现：[`hasPermission()`](../frontend/src/utils/permission.ts:1)

规则：

- 未传权限码时默认返回 `true`
- 命中具体权限码返回 `true`
- 命中通配符 `*:*` 也返回 `true`

### 8.3 Hook

实现：[`usePermission()`](../frontend/src/hooks/usePermission.ts:3)

### 8.4 路由守卫

实现：[`RequirePermission`](../frontend/src/routes/guards.tsx:24)

当前路由配置：

- `/manage/features` 需要 `feature:list`
- `/manage/permissions` 需要 `permission:list`
- `/manage/users` 需要 `user:list`

见 [`frontend/src/routes/index.tsx`](../frontend/src/routes/index.tsx:33)。

## 9. 当前权限不一致问题

这是当前实现中最重要的限制之一。

### 9.1 后端真实权限码

后端种子权限码来自 [`build_permissions()`](../backend/prisma/seed.py:19)，例如：

- `feature:item:view`
- `feature:item:manage`
- `system:user:view`
- `system:user:manage`

### 9.2 前端路由使用的权限码

前端路由守卫使用：

- `feature:list`
- `permission:list`
- `user:list`

见 [`frontend/src/routes/index.tsx`](../frontend/src/routes/index.tsx:33)。

### 9.3 影响

- 页面级拦截可能与后端真实授权不一致
- 即使后端允许，前端也可能错误跳转回 `/features`
- 文档与交付时必须明确该问题尚未修复

## 10. 建议的权限治理方向

基于当前代码，后续应优先：

1. 统一前后端权限码命名规范
2. 将页面权限与接口权限映射集中管理
3. 为登录日志、审计日志页面补充前端入口
4. 为超级管理员增加显式 UI 标识

## 11. 默认账号与授权结果

种子数据执行后：

- `admin` 用户为 `is_super_admin = true`
- 同时绑定 `admin` 角色
- `admin` 角色拥有全部初始化权限

因此默认管理员在当前系统中具备完整访问能力。
