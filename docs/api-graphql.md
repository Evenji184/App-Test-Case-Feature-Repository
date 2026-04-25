# GraphQL API 说明

## 1. 接口概览

GraphQL 入口由 [`GraphQLRouter`](../backend/app/main.py:124) 挂载，访问路径为 `/graphql`。

Schema 定义位于 [`backend/app/graphql/schema.py`](../backend/app/graphql/schema.py)。

## 2. 通用类型

### 2.1 错误类型

见 [`ErrorType`](../backend/app/graphql/types/common.py:8)。

| 字段 | 说明 |
| --- | --- |
| `code` | 错误码 |
| `message` | 错误信息 |

### 2.2 分页输入

见 [`PaginationInput`](../backend/app/graphql/types/common.py:24)。

| 字段 | 默认值 |
| --- | --- |
| `page` | `1` |
| `pageSize` | `20` |

### 2.3 通用 Mutation 返回

见 [`MutationResult`](../backend/app/graphql/types/common.py:30)。

| 字段 | 说明 |
| --- | --- |
| `success` | 是否成功 |
| `message` | 提示信息 |
| `error` | 错误对象 |

## 3. Query 列表

### 3.1 `currentUser`

定义：[`current_user`](../backend/app/graphql/schema.py:84)

说明：获取当前登录用户。

返回类型：[`AuthUserType`](../backend/app/graphql/types/auth.py:10)

前端调用：[`CURRENT_USER_QUERY`](../frontend/src/api/queries/auth.ts:4)

### 3.2 `userList`

定义：[`user_list`](../backend/app/graphql/schema.py:57)

参数：

- `pagination: PaginationInput!`
- `keyword: String`

返回：[`UserListType`](../backend/app/graphql/types/user.py:27)

前端调用：[`USER_LIST_QUERY`](../frontend/src/api/queries/user.ts:4)

### 3.3 `userDetail`

定义：[`user_detail`](../backend/app/graphql/schema.py:75)

参数：

- `userId: String!`

返回：[`UserType`](../backend/app/graphql/types/user.py:10)

### 3.4 `roleList`

定义：[`role_list`](../backend/app/graphql/schema.py:93)

参数：

- `pagination: PaginationInput!`

返回：[`RoleListType`](../backend/app/graphql/types/role.py:22)

前端调用：[`ROLE_LIST_QUERY`](../frontend/src/api/queries/role.ts:4)

### 3.5 `permissionTree`

定义：[`permission_tree`](../backend/app/graphql/schema.py:111)

说明：按 `module -> resource -> permissions` 分组返回权限树。

返回：`[PermissionModuleGroup!]!`

类型见：

- [`PermissionModuleGroup`](../backend/app/graphql/types/permission.py:23)
- [`PermissionResourceGroup`](../backend/app/graphql/types/permission.py:17)
- [`PermissionType`](../backend/app/graphql/types/permission.py:6)

前端调用：[`PERMISSION_TREE_QUERY`](../frontend/src/api/queries/role.ts:23)

### 3.6 `nodeTree`

定义：[`node_tree`](../backend/app/graphql/schema.py:102)

返回：`[NodeTreeType!]!`

前端调用：[`NODE_TREE_QUERY`](../frontend/src/api/queries/node.ts:4)

### 3.7 `nodeList`

定义：[`node_list`](../backend/app/graphql/schema.py:174)

参数：

- `pagination: PaginationInput!`

返回：[`NodeListType`](../backend/app/graphql/types/node.py:41)

前端调用：[`NODE_LIST_QUERY`](../frontend/src/api/queries/node.ts:53)

### 3.8 `nodeDetail`

定义：[`node_detail`](../backend/app/graphql/schema.py:183)

参数：

- `nodeId: String!`

返回：[`NodeType`](../backend/app/graphql/types/node.py:10)

前端调用：[`NODE_DETAIL_QUERY`](../frontend/src/api/queries/node.ts:72)

### 3.9 `searchNodes`

定义：[`search_nodes`](../backend/app/graphql/schema.py:192)

参数：

- `keyword: String!`
- `pagination: PaginationInput!`

返回：[`NodeListType`](../backend/app/graphql/types/node.py:41)

前端调用：[`SEARCH_NODES_QUERY`](../frontend/src/api/queries/node.ts:81)

### 3.10 `featureList`

定义：[`feature_list`](../backend/app/graphql/schema.py:120)

参数：

- `pagination: PaginationInput!`
- `nodeId: String`

返回：[`FeatureListType`](../backend/app/graphql/types/feature.py:30)

前端调用：[`FEATURE_LIST_QUERY`](../frontend/src/api/queries/feature.ts:4)

### 3.11 `featureDetail`

定义：[`feature_detail`](../backend/app/graphql/schema.py:129)

参数：

- `featureId: String!`

返回：[`FeatureType`](../backend/app/graphql/types/feature.py:10)

前端调用：[`FEATURE_DETAIL_QUERY`](../frontend/src/api/queries/feature.ts:23)

### 3.12 `searchFeatures`

定义：[`search_features`](../backend/app/graphql/schema.py:138)

参数：

- `keyword: String!`
- `pagination: PaginationInput!`

返回：[`FeatureListType`](../backend/app/graphql/types/feature.py:30)

前端调用：[`SEARCH_FEATURES_QUERY`](../frontend/src/api/queries/feature.ts:32)

### 3.13 `auditLogList`

定义：[`audit_log_list`](../backend/app/graphql/schema.py:147)

参数：

- `pagination: PaginationInput!`

返回：[`AuditLogListType`](../backend/app/graphql/types/audit.py:25)

### 3.14 `requestLogList`

定义：[`request_log_list`](../backend/app/graphql/schema.py:158)

参数：

- `pagination: PaginationInput!`

返回：[`RequestLogListType`](../backend/app/graphql/types/audit.py:48)

## 4. Mutation 列表

### 4.1 认证

#### `login`

定义：[`login`](../backend/app/graphql/schema.py:170)

参数：

- `username: String!`
- `password: String!`

返回：[`LoginResult`](../backend/app/graphql/types/auth.py:28)

前端调用：[`LOGIN_MUTATION`](../frontend/src/api/mutations/auth.ts:4)

返回数据结构：

- `accessToken`
- `tokenType`
- `permissions`
- `user`

#### `logout`

定义：[`logout`](../backend/app/graphql/schema.py:184)

返回：通用 [`MutationResult`](../backend/app/graphql/types/common.py:30)

前端调用：[`LOGOUT_MUTATION`](../frontend/src/api/mutations/auth.ts:26)

### 4.2 用户管理

#### `createUser`

定义：[`create_user`](../backend/app/graphql/schema.py:194)

输入：[`CreateUserInput`](../backend/app/graphql/types/user.py:38)

前端调用：[`CREATE_USER_MUTATION`](../frontend/src/api/mutations/user.ts:4)

#### `updateUser`

定义：[`update_user`](../backend/app/graphql/schema.py:206)

输入：[`UpdateUserInput`](../backend/app/graphql/types/user.py:50)

前端调用：[`UPDATE_USER_MUTATION`](../frontend/src/api/mutations/user.ts:21)

#### `enableUser`

定义：[`enable_user`](../backend/app/graphql/schema.py:218)

前端调用：[`ENABLE_USER_MUTATION`](../frontend/src/api/mutations/user.ts:38)

#### `disableUser`

定义：[`disable_user`](../backend/app/graphql/schema.py:229)

前端调用：[`DISABLE_USER_MUTATION`](../frontend/src/api/mutations/user.ts:51)

#### `assignRolesToUser`

定义：[`assign_roles_to_user`](../backend/app/graphql/schema.py:240)

参数：

- `userId: String!`
- `roleIds: [String!]!`

前端调用：[`ASSIGN_ROLES_TO_USER_MUTATION`](../frontend/src/api/mutations/user.ts:64)

#### `resetPassword`

定义：[`reset_password`](../backend/app/graphql/schema.py:252)

参数：

- `userId: String!`
- `newPassword: String!`

前端调用：[`RESET_PASSWORD_MUTATION`](../frontend/src/api/mutations/user.ts:77)

### 4.3 角色与权限

#### `createRole`

定义：[`create_role`](../backend/app/graphql/schema.py:275)

输入：[`CreateRoleInput`](../backend/app/graphql/types/role.py:33)

前端调用：[`CREATE_ROLE_MUTATION`](../frontend/src/api/mutations/role.ts:4)

#### `updateRole`

定义：[`update_role`](../backend/app/graphql/schema.py:286)

输入：[`UpdateRoleInput`](../backend/app/graphql/types/role.py:41)

前端调用：[`UPDATE_ROLE_MUTATION`](../frontend/src/api/mutations/role.ts:21)

#### `assignPermissionsToRole`

定义：[`assign_permissions_to_role`](../backend/app/graphql/schema.py:297)

参数：

- `roleId: String!`
- `permissionIds: [String!]!`

前端调用：[`ASSIGN_PERMISSIONS_TO_ROLE_MUTATION`](../frontend/src/api/mutations/role.ts:38)

### 4.4 节点管理

#### `createNode`

定义：[`create_node`](../backend/app/graphql/schema.py:320)

输入：[`CreateNodeInput`](../backend/app/graphql/types/node.py:52)

前端调用：[`CREATE_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:4)

#### `updateNode`

定义：[`update_node`](../backend/app/graphql/schema.py:331)

输入：[`UpdateNodeInput`](../backend/app/graphql/types/node.py:62)

前端调用：[`UPDATE_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:21)

#### `deleteNode`

定义：[`delete_node`](../backend/app/graphql/schema.py:342)

前端调用：[`DELETE_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:38)

#### `hideNode`

定义：[`hide_node`](../backend/app/graphql/schema.py:353)

前端调用：[`HIDE_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:51)

#### `showNode`

定义：[`show_node`](../backend/app/graphql/schema.py:364)

前端调用：[`SHOW_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:64)

#### `copyNode`

定义：[`copy_node`](../backend/app/graphql/schema.py:375)

参数：

- `nodeId: String!`
- `targetParentId: String`
- `newName: String`

前端调用：[`COPY_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:77)

#### `moveNode`

定义：[`move_node`](../backend/app/graphql/schema.py:386)

参数：

- `nodeId: String!`
- `targetParentId: String`

前端调用：[`MOVE_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:94)

### 4.5 特征管理

#### `createFeature`

定义：[`create_feature`](../backend/app/graphql/schema.py:397)

输入：[`CreateFeatureInput`](../backend/app/graphql/types/feature.py:41)

前端调用：[`CREATE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:4)

#### `updateFeature`

定义：[`update_feature`](../backend/app/graphql/schema.py:408)

输入：[`UpdateFeatureInput`](../backend/app/graphql/types/feature.py:56)

前端调用：[`UPDATE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:21)

#### `deleteFeature`

定义：[`delete_feature`](../backend/app/graphql/schema.py:419)

前端调用：[`DELETE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:38)

#### `hideFeature`

定义：[`hide_feature`](../backend/app/graphql/schema.py:430)

前端调用：[`HIDE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:51)

#### `showFeature`

定义：[`show_feature`](../backend/app/graphql/schema.py:441)

前端调用：[`SHOW_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:64)

#### `copyFeature`

定义：[`copy_feature`](../backend/app/graphql/schema.py:452)

参数：

- `featureId: String!`
- `targetNodeId: String!`

前端调用：[`COPY_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:77)

#### `moveFeature`

定义：[`move_feature`](../backend/app/graphql/schema.py:463)

参数：

- `featureId: String!`
- `targetNodeId: String!`

前端调用：[`MOVE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:94)

## 5. 认证与权限

### 5.1 认证方式

- Header：`Authorization: Bearer <token>`
- 解析逻辑：[`get_current_user()`](../backend/app/modules/auth/dependencies.py:12)

### 5.2 权限校验方式

Resolver 内部调用 [`require_permission()`](../backend/app/modules/auth/dependencies.py:35)。

超级管理员直接放行，普通用户需命中权限码。

## 6. 前端调用约定

### 6.1 Apollo Client

见 [`frontend/src/api/client.ts`](../frontend/src/api/client.ts)。

特性：

- 自动注入 token
- 认证失败自动清理本地登录态并跳转 `/login`
- 对部分 Query 配置缓存 key

### 6.2 错误处理

前端在 [`errorLink`](../frontend/src/api/client.ts:22) 中识别：

- GraphQL 错误消息包含“认证”或 `Unauthorized`
- 网络状态码 `401`

## 7. 示例请求

### 7.1 登录

```graphql
mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    success
    message
    data {
      accessToken
      tokenType
      permissions
      user {
        id
        username
        displayName
      }
    }
  }
}
```

### 7.2 查询节点树

```graphql
query NodeTree {
  nodeTree {
    id
    name
    code
    children {
      id
      name
      code
    }
  }
}
```

### 7.3 新建特征

```graphql
mutation CreateFeature($input: CreateFeatureInput!) {
  createFeature(input: $input) {
    success
    message
    data {
      id
      title
      code
      nodeId
    }
  }
}
```

## 8. 已知限制

1. 登录日志无 GraphQL Query
2. 前端未消费全部后端 Mutation，尤其复制/移动能力
3. 前端路由守卫权限码与后端权限码不一致，可能导致页面拦截与后端校验不一致
