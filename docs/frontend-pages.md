# 前端页面说明

## 1. 前端概览

前端工程位于 [`frontend/src`](../frontend/src)，采用 React + TypeScript + Apollo Client + Zustand + Ant Design Mobile。

路由入口见 [`AppRoutes`](../frontend/src/routes/index.tsx:13)。

## 2. 页面与路由映射

| 路由 | 页面组件 | 说明 |
| --- | --- | --- |
| `/login` | [`LoginPage`](../frontend/src/pages/Login/index.tsx:6) | 登录页 |
| `/features` | [`FeatureLibraryPage`](../frontend/src/pages/FeatureLibrary/index.tsx:21) | 特征库展示页 |
| `/manage/features` | [`FeatureManagePage`](../frontend/src/pages/FeatureManage/index.tsx:39) | 节点与特征管理页 |
| `/manage/permissions` | [`PermissionManagePage`](../frontend/src/pages/PermissionManage/index.tsx:10) | 角色与权限管理页 |
| `/manage/users` | [`UserManagePage`](../frontend/src/pages/UserManage/index.tsx:20) | 用户管理页 |

## 3. 布局设计

### 3.1 登录布局

组件：[`AuthLayout`](../frontend/src/layouts/AuthLayout.tsx:3)

特点：

- 居中卡片布局
- 渐变背景
- 适合登录等单页场景

### 3.2 主布局

组件：[`MainLayout`](../frontend/src/layouts/MainLayout.tsx:13)

特点：

- 顶部 `NavBar`
- 中间内容区 `Outlet`
- 底部 `TabBar`
- 展示当前用户与权限数量

底部标签页：

- `/features`
- `/manage/features`
- `/manage/permissions`
- `/manage/users`

## 4. 路由守卫

### 4.1 登录守卫

组件：[`RequireAuth`](../frontend/src/routes/guards.tsx:5)

逻辑：

- 未初始化时显示加载中
- 未登录跳转 `/login`
- 已登录放行

### 4.2 权限守卫

组件：[`RequirePermission`](../frontend/src/routes/guards.tsx:24)

逻辑：

- 无权限时跳转 `/features`

## 5. 页面说明

### 5.1 登录页

组件：[`LoginPage`](../frontend/src/pages/Login/index.tsx:6)

功能：

- 输入用户名与密码
- 调用登录接口
- 登录成功后跳转来源页或 `/features`
- 使用 Toast 展示结果

依赖：

- [`useAuth()`](../frontend/src/hooks/useAuth.ts:4)
- [`LOGIN_MUTATION`](../frontend/src/api/mutations/auth.ts:4)

### 5.2 特征库展示页

组件：[`FeatureLibraryPage`](../frontend/src/pages/FeatureLibrary/index.tsx:21)

功能：

- 查询节点树
- 查询当前节点下特征列表
- 支持关键字搜索特征
- 通过浮动按钮打开节点筛选抽屉
- 点击特征后仅弹出提示，不进入详情页

使用的 Query：

- [`NODE_TREE_QUERY`](../frontend/src/api/queries/node.ts:4)
- [`FEATURE_LIST_QUERY`](../frontend/src/api/queries/feature.ts:4)
- [`SEARCH_FEATURES_QUERY`](../frontend/src/api/queries/feature.ts:32)

依赖状态：

- [`useAppStore`](../frontend/src/stores/app.ts:12)

### 5.3 特征管理页

组件：[`FeatureManagePage`](../frontend/src/pages/FeatureManage/index.tsx:39)

页面分为左右两块：

1. 节点管理区
2. 特征管理区

#### 节点管理区

功能：

- 展示节点树
- 选择当前节点
- 新建节点
- 编辑当前节点
- 删除当前节点

当前前端已接入的节点 Mutation：

- [`CREATE_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:4)
- [`UPDATE_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:21)
- [`DELETE_NODE_MUTATION`](../frontend/src/api/mutations/node.ts:38)

#### 特征管理区

功能：

- 查询当前节点下特征
- 本地关键字筛选
- 新建特征
- 编辑特征
- 隐藏/显示特征
- 删除特征

当前前端已接入的特征 Mutation：

- [`CREATE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:4)
- [`UPDATE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:21)
- [`DELETE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:38)
- [`HIDE_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:51)
- [`SHOW_FEATURE_MUTATION`](../frontend/src/api/mutations/feature.ts:64)

#### 表单字段

特征表单覆盖：

- `nodeId`
- `title`
- `code`
- `summary`
- `description`
- `platform`
- `status`
- `priority`
- `version`
- `tags`
- `remark`

节点表单覆盖：

- `parentId`
- `name`
- `code`
- `nodeType`
- `sortOrder`
- `remark`

### 5.4 权限管理页

组件：[`PermissionManagePage`](../frontend/src/pages/PermissionManage/index.tsx:10)

功能：

- 拉取权限树
- 拉取角色列表
- 新建角色
- 编辑角色
- 为角色分配权限

依赖状态：[`usePermissionStore`](../frontend/src/stores/permission.ts:15)

使用的 Mutation：

- [`CREATE_ROLE_MUTATION`](../frontend/src/api/mutations/role.ts:4)
- [`UPDATE_ROLE_MUTATION`](../frontend/src/api/mutations/role.ts:21)
- [`ASSIGN_PERMISSIONS_TO_ROLE_MUTATION`](../frontend/src/api/mutations/role.ts:38)

### 5.5 用户管理页

组件：[`UserManagePage`](../frontend/src/pages/UserManage/index.tsx:20)

功能：

- 查询用户列表
- 按用户名/邮箱搜索
- 新建用户
- 编辑用户
- 启用/禁用用户
- 分配角色
- 重置密码

使用的 Mutation：

- [`CREATE_USER_MUTATION`](../frontend/src/api/mutations/user.ts:4)
- [`UPDATE_USER_MUTATION`](../frontend/src/api/mutations/user.ts:21)
- [`ENABLE_USER_MUTATION`](../frontend/src/api/mutations/user.ts:38)
- [`DISABLE_USER_MUTATION`](../frontend/src/api/mutations/user.ts:51)
- [`ASSIGN_ROLES_TO_USER_MUTATION`](../frontend/src/api/mutations/user.ts:64)
- [`RESET_PASSWORD_MUTATION`](../frontend/src/api/mutations/user.ts:77)

页面行为说明：

- 新建用户时默认密码可为空，前端会回退为 `12345678`
- 重置密码操作固定重置为 `12345678`

## 6. 状态管理

### 6.1 应用状态

[`useAppStore`](../frontend/src/stores/app.ts:12) 管理：

- `selectedNodeId`
- `keyword`
- `mobileMenuVisible`

### 6.2 权限状态

[`usePermissionStore`](../frontend/src/stores/permission.ts:15) 管理：

- `permissionTree`
- `roles`
- `loading`

### 6.3 认证状态

认证相关状态位于 [`frontend/src/stores/auth.ts`](../frontend/src/stores/auth.ts)，并通过 [`useAuth()`](../frontend/src/hooks/useAuth.ts:4) 暴露给页面。

## 7. 组件协作

关键通用组件：

- [`FeatureList`](../frontend/src/components/FeatureList/index.tsx)
- [`TreeView`](../frontend/src/components/TreeView/index.tsx)
- [`SearchBar`](../frontend/src/components/SearchBar/index.tsx)
- [`FormDrawer`](../frontend/src/components/FormDrawer/index.tsx)
- [`BottomActions`](../frontend/src/components/BottomActions/index.tsx)
- [`PermissionSelector`](../frontend/src/components/PermissionSelector/index.tsx)

## 8. 前端与后端接口对应关系

| 页面 | 主要 Query/Mutation |
| --- | --- |
| 登录页 | `login`, `currentUser`, `logout` |
| 特征库展示页 | `nodeTree`, `featureList`, `searchFeatures` |
| 特征管理页 | `nodeTree`, `featureList`, `createNode`, `updateNode`, `deleteNode`, `createFeature`, `updateFeature`, `deleteFeature`, `hideFeature`, `showFeature` |
| 权限管理页 | `roleList`, `permissionTree`, `createRole`, `updateRole`, `assignPermissionsToRole` |
| 用户管理页 | `userList`, `createUser`, `updateUser`, `enableUser`, `disableUser`, `assignRolesToUser`, `resetPassword` |

## 9. 已知限制

1. 前端未实现特征详情页与节点详情页独立页面
2. 前端未接入节点/特征复制与移动操作，尽管后端已支持
3. 路由守卫权限码与后端权限码不一致
4. Docker 前端容器未使用真实 React 构建产物
5. 审计日志、请求日志、登录日志暂无前端页面
