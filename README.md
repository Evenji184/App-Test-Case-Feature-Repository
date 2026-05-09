# APP 特征库管理系统

APP 特征库管理系统用于维护移动端 APP 的功能节点、特征条目、用户、角色、权限、AI 供应商以及请求/审计日志。

## 1. 项目架构

### 1.1 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | React 18 + TypeScript + Vite 5 | 移动优先管理界面 |
| UI 库 | antd-mobile 5 / antd 5 | 移动端 + 桌面端组件 |
| 状态 | Zustand | 轻量状态管理 |
| 数据层 | Apollo Client 3 + GraphQL | 与后端统一通信 |
| 后端 | FastAPI + Strawberry GraphQL | 统一 GraphQL 接口 |
| ORM | Prisma Client Python | 数据库访问与类型安全 |
| 认证 | JWT (python-jose) + bcrypt | 登录鉴权与密码哈希 |
| AI 调用 | httpx + cryptography (Fernet) | 多供应商 AI 调用，API Key 加密存储 |
| 数据库 | MySQL 8.0 (utf8mb4) | InnoDB, DYNAMIC row format |
| 部署 | Docker Compose + Nginx | 开发/生产两套编排 |

### 1.2 目录结构

```text
.
├─ backend/                 # FastAPI + GraphQL + Prisma 后端
│  ├─ app/
│  │  ├─ core/              # config, security, context, logging
│  │  ├─ db/                # Prisma 客户端管理 (PrismaManager)
│  │  ├─ graphql/           # schema, types, directives (IsAuthenticated)
│  │  ├─ middleware/        # 请求日志中间件
│  │  ├─ modules/           # auth / rbac / user / audit / feature_library / ai
│  │  └─ utils/             # exceptions, pagination, tree
│  ├─ prisma/               # schema.prisma + seed.py
│  ├─ scripts/              # init-db.sh / init-db.bat
│  └─ tests/
├─ frontend/                # React + Vite 前端
│  └─ src/
│     ├─ api/               # GraphQL queries / mutations / client / fragments
│     ├─ components/        # FormDrawer, FeatureList, NodeList, PermissionSelector 等
│     ├─ hooks/             # useAuth, usePermission
│     ├─ layouts/           # 登录布局、主布局 (5 TabBar)
│     ├─ pages/             # Login / FeatureManage / UserManage / PermissionManage / AiProvider
│     ├─ routes/            # 路由定义 + 权限守卫
│     ├─ stores/            # auth / app / permission / aiProvider (Zustand)
│     ├─ types/             # graphql 类型, models 类型, common 类型
│     └─ utils/             # storage, permission, tree
├─ docker/                  # backend.Dockerfile, frontend.Dockerfile, nginx.conf
├─ docs/                    # 项目文档 + init-tables.sql
├─ docker-compose.yml       # 开发环境编排
├─ docker-compose.prod.yml  # 生产环境编排覆盖
└─ .env.example             # 环境变量示例
```

### 1.3 特征库关联操作模型

特征库的核心是「节点树 + 特征条目」两层结构，节点（FeatureNode）按树形组织，特征（Feature）挂载在节点下。节点之间、特征之间通过复制、移动、衍生三种操作建立关联，所有关联均通过追踪字段持久化，可溯源。

#### 1.3.1 节点关联操作

```text
                    复制 (copyNode)
     ┌──────────┐ ──────────────────▶ ┌──────────┐
     │ 源节点 A  │                     │ 新节点 B  │
     └──────────┘                     └──────────┘
          │                                │
          │ copied_from_node_id = A.id     │ source_node_id = A.id
          │ copy_operation_id = UUID       │
          │                                │
                    移动 (moveNode)
     ┌──────────┐ ──────────────────▶ 改挂到新父节点
     │ 节点 C   │   parent_id 变更     moved_from_node_id = 旧 parent_id
     └──────────┘   path / level 重算   move_operation_id = UUID
```

| 操作 | Mutation | 行为 | 追踪字段 |
|------|----------|------|----------|
| 复制节点 | `copyNode(nodeId, targetParentId?, newName?)` | 创建新节点，继承源节点的 name/code/node_type/is_visible/remark，code 自动加 `_copy_{hex}` 后缀避免冲突，name 默认加"副本"后缀 | `source_node_id` → 指向原始源节点（若源本身也是复制则向上追溯）；`copied_from_node_id` → 直接来源节点；`copy_operation_id` → 本次操作唯一标识 |
| 移动节点 | `moveNode(nodeId, targetParentId?)` | 变更 parent_id，重新计算 path 和 level，节点本身 ID 不变 | `moved_from_node_id` → 移动前的 parent_id；`move_operation_id` → 本次操作唯一标识 |

#### 1.3.2 特征关联操作

```text
                    复制 (copyFeature)
     ┌──────────┐ ──────────────────▶ ┌──────────┐
     │ 源特征 X  │                     │ 新特征 Y  │
     └──────────┘                     └──────────┘
          │                                │
          │ copied_from_id = X.id          │ source_feature_id = X.id
          │ copy_operation_id = UUID       │ last_copied_at = now()
          │                                │

                    移动 (moveFeature)
     ┌──────────┐ ──────────────────▶ 挂载到目标节点
     │ 特征 Z   │   node_id 变更       moved_from_node_id = 旧 node_id
     └──────────┘                       move_operation_id = UUID
                                         last_moved_at = now()
```

| 操作 | Mutation | 行为 | 追踪字段 |
|------|----------|------|----------|
| 复制特征 | `copyFeature(featureId, targetNodeId)` | 在目标节点下创建新特征，继承源特征的 title/summary/description/platform/status/priority/version/tags/is_visible/remark，code 自动加后缀，title 默认加"副本"后缀 | `source_feature_id` → 指向原始源特征（向上追溯）；`copied_from_id` → 直接来源特征；`copy_operation_id` → 本次操作唯一标识；`last_copied_at` → 复制时间 |
| 移动特征 | `moveFeature(featureId, targetNodeId)` | 变更 node_id（将特征从当前节点移到目标节点），特征本身 ID 不变 | `moved_from_node_id` → 移动前所在节点 ID；`move_operation_id` → 本次操作唯一标识；`last_moved_at` → 移动时间 |

#### 1.3.3 衍生关系（source 链）

`source_node_id` / `source_feature_id` 形成溯源链：无论经过多少次复制，始终指向最原始的节点/特征。复制时的逻辑为：

```python
# 若源本身有 source_node_id，则沿用；否则指向源自身
source_node_id = node.source_node_id or node.id
source_feature_id = feature.source_feature_id or feature.id
```

```text
原始节点 A ──复制──▶ 副本 B ──复制──▶ 副本 C
                     source_node_id=A  source_node_id=A
                     copied_from=A      copied_from=B
```

由此可实现：通过 `source_node_id` 查询某原始节点的所有衍生节点；通过 `copied_from_node_id` 查询某节点的直接副本；通过 `move_operation_id` / `copy_operation_id` 关联同一次操作的多个变更。

#### 1.3.4 Prisma Schema 关联关系

```text
FeatureNode                          Feature
├─ parent_id ──────▶ FeatureNode     ├─ node_id ──────▶ FeatureNode (所属节点)
├─ source_node_id ─▶ FeatureNode     ├─ source_feature_id ─▶ Feature (溯源链)
├─ copied_from_─────▶ FeatureNode     ├─ copied_from_id ────▶ Feature (直接来源)
│    node_id        (1:N copied_nodes)│
├─ moved_from_──────▶ FeatureNode     ├─ moved_from_node_id─▶ FeatureNode (移动来源)
│    node_id        (1:N moved_nodes) │
│                                    │
│  features[] ◀──── node_id          │  node ──────▶ FeatureNode
│  features_moved_                   │  source_feature ──▶ Feature
│    from[] ◀──── moved_from_        │  copied_from ─────▶ Feature
│                   node_id          │  moved_from_node─▶ FeatureNode
```

### 1.4 核心模块关系

```text
                         ┌──────────────┐
                         │   FastAPI    │
                         │  (main.py)   │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                   │
     ┌────────▼──────┐  ┌──────▼───────┐  ┌───────▼──────┐
     │  Middleware    │  │   GraphQL    │  │   REST API   │
     │ request_logging│  │   Router     │  │   /health    │
     └────────────────┘  └──────┬───────┘  └──────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                   │
     ┌────────▼──────┐  ┌──────▼───────┐  ┌───────▼──────┐
     │   Query       │  │   Mutation   │  │  Directives  │
     │ (读操作)       │  │ (写操作)      │  │ IsAuthenticated│
     └────────────────┘  └──────┬───────┘  └──────────────┘
                                │
     ┌──────────┬───────────────┼────────────────┬──────────────┐
     │          │               │                │              │
┌────▼───┐ ┌───▼────┐  ┌───────▼──────┐  ┌──────▼──────┐ ┌───▼──────┐
│Auth    │ │Node    │  │Feature       │  │AI Provider  │ │User/RBAC │
│Service │ │Service │  │Service       │  │Service      │ │/Audit    │
└────────┘ └────────┘  └──────────────┘  └──────┬──────┘ └──────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │encryption.py    │
                                          │provider_client  │
                                          │prompt_builder   │
                                          └─────────────────┘
                                │
                         ┌──────▼───────┐
                         │    Prisma    │
                         │   Client     │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │   MySQL 8.0  │
                         └──────────────┘
```

### 1.5 AI 供应商集成

系统支持可配置的多 AI 供应商调用，用于根据特征数据自动生成场景化测试用例。

**供应商管理**

- 支持两种接口格式：OpenAI 兼容格式（DeepSeek、Qwen、Moonshot 等）和 Anthropic 格式
- API Key 使用 Fernet 对称加密存储（密钥从 `SECRET_KEY` 派生），前端仅展示脱敏提示（如 `sk-****cdef`）
- 支持"设为默认供应商"、测试连接、启用/禁用

**测试用例生成**

- 在特征管理页多选特征后，选择供应商和自定义指令，调用 AI 生成测试用例
- 提示词自动包含：节点层级结构 + 特征详情（标题/摘要/描述/平台/优先级/标签）+ 补充要求
- 后端根据 `provider_format` 自动选择 OpenAI 或 Anthropic 请求格式

**GraphQL 接口**

| 操作 | 类型 | 说明 |
|------|------|------|
| `aiProviderList(pagination)` | Query | 分页查询供应商列表 |
| `createAiProvider(input)` | Mutation | 创建供应商（API Key 输入时为明文，存储时自动加密） |
| `updateAiProvider(providerId, input)` | Mutation | 更新供应商（API Key 留空则不修改） |
| `deleteAiProvider(providerId)` | Mutation | 软删除供应商 |
| `testAiConnection(providerId)` | Mutation | 测试供应商连接是否可用 |
| `generateTestCases(input)` | Mutation | 根据选中的节点/特征 ID 调用 AI 生成测试用例 |

## 2. 依赖清单

### 2.1 后端 Python 依赖

| 包 | 版本 | 用途 |
|---|------|------|
| fastapi | 0.115.12 | Web 框架 |
| uvicorn[standard] | 0.34.2 | ASGI 服务器 |
| strawberry-graphql[fastapi] | 0.275.5 | GraphQL Schema 与 Resolver |
| prisma | 0.15.0 | 数据库 ORM |
| pydantic | 2.11.3 | 数据验证 |
| pydantic-settings | 2.9.1 | 环境变量配置 |
| bcrypt | >=4.0.0 | 密码哈希 |
| python-jose[cryptography] | 3.4.0 | JWT 编解码 |
| python-dotenv | 1.1.0 | .env 文件加载 |
| httpx | >=0.27.0 | 异步 HTTP 客户端（AI 供应商调用） |
| cryptography | >=43.0.0 | API Key Fernet 加密存储 |

> Python 版本要求：>=3.10（代码使用 `from __future__ import annotations` 兼容 3.10+）

### 2.2 前端依赖

| 包 | 版本 | 用途 |
|---|------|------|
| react | ^18.3.1 | UI 框架 |
| react-dom | ^18.3.1 | React DOM 渲染 |
| react-router-dom | ^6.30.0 | 路由 |
| @apollo/client | ^3.11.8 | GraphQL 客户端 |
| graphql | ^16.9.0 | GraphQL 核心 |
| zustand | ^4.5.5 | 状态管理 |
| antd-mobile | ^5.38.1 | 移动端 UI 组件 |
| antd | ^5.24.8 | 桌面端 UI 组件 |
| @ant-design/icons | ^5.3.7 | 图标 |

开发依赖：typescript ^5.6.3 / vite ^5.4.10 / @vitejs/plugin-react ^4.3.4

## 3. 数据库建表 SQL

> 由于 `prisma db push` 在 MySQL 8.0 + utf8mb4 环境下存在 index key 长度超限问题（`Specified key was too long; max key length is 3072 bytes`），当前需要手动执行以下 SQL 完成建表。
>
> 完整 SQL 脚本见 [docs/init-tables.sql](docs/init-tables.sql)

### 3.1 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS app_feature_repository
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3.2 用户与权限相关表

```sql
CREATE TABLE users (
  id              CHAR(36)     NOT NULL,
  username        VARCHAR(64)  NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(128) DEFAULT NULL,
  phone           VARCHAR(32)  DEFAULT NULL,
  avatar_url      VARCHAR(500) DEFAULT NULL,
  status          VARCHAR(32)  NOT NULL DEFAULT 'active',
  is_super_admin  TINYINT(1)   NOT NULL DEFAULT 0,
  last_login_at   DATETIME(3)  DEFAULT NULL,
  last_login_ip   VARCHAR(45)  DEFAULT NULL,
  remark          TEXT         DEFAULT NULL,
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_username_deleted_at_key (username, deleted_at),
  UNIQUE KEY users_email_deleted_at_key (email, deleted_at),
  KEY users_status_deleted_at_idx (status, deleted_at),
  KEY users_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
  id              CHAR(36)     NOT NULL,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(64)  NOT NULL,
  description     TEXT         DEFAULT NULL,
  is_system       TINYINT(1)   NOT NULL DEFAULT 0,
  status          VARCHAR(32)  NOT NULL DEFAULT 'active',
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY roles_code_deleted_at_key (code, deleted_at),
  UNIQUE KEY roles_name_deleted_at_key (name, deleted_at),
  KEY roles_status_deleted_at_idx (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id              CHAR(36)     NOT NULL,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(128) NOT NULL,
  module          VARCHAR(64)  NOT NULL,
  resource        VARCHAR(64)  NOT NULL,
  action          VARCHAR(64)  NOT NULL,
  description     TEXT         DEFAULT NULL,
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY permissions_code_deleted_at_key (code, deleted_at),
  UNIQUE KEY permissions_module_resource_action_deleted_at_key (module, resource, action, deleted_at),
  KEY permissions_module_deleted_at_idx (module, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  id              CHAR(36)     NOT NULL,
  user_id         CHAR(36)     NOT NULL,
  role_id         CHAR(36)     NOT NULL,
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY user_roles_user_id_role_id_deleted_at_key (user_id, role_id, deleted_at),
  KEY user_roles_role_id_deleted_at_idx (role_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  id              CHAR(36)     NOT NULL,
  role_id         CHAR(36)     NOT NULL,
  permission_id   CHAR(36)     NOT NULL,
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY role_permissions_role_id_permission_id_deleted_at_key (role_id, permission_id, deleted_at),
  KEY role_permissions_permission_id_deleted_at_idx (permission_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 特征库相关表

```sql
CREATE TABLE feature_nodes (
  id                    CHAR(36)     NOT NULL,
  parent_id             CHAR(36)     DEFAULT NULL,
  name                  VARCHAR(200) NOT NULL,
  code                  VARCHAR(128) NOT NULL,
  node_type             VARCHAR(32)  NOT NULL DEFAULT 'folder',
  path                  VARCHAR(1024) NOT NULL,
  level                 INT          NOT NULL DEFAULT 1,
  sort_order            INT          NOT NULL DEFAULT 0,
  is_visible            TINYINT(1)   NOT NULL DEFAULT 1,
  is_locked             TINYINT(1)   NOT NULL DEFAULT 0,
  source_node_id        CHAR(36)     DEFAULT NULL,
  copied_from_node_id   CHAR(36)     DEFAULT NULL,
  moved_from_node_id    CHAR(36)     DEFAULT NULL,
  move_operation_id     CHAR(36)     DEFAULT NULL,
  copy_operation_id     CHAR(36)     DEFAULT NULL,
  remark                TEXT         DEFAULT NULL,
  deleted_at            DATETIME(3)  DEFAULT NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3)  NOT NULL,
  created_by            CHAR(36)     DEFAULT NULL,
  updated_by            CHAR(36)     DEFAULT NULL,
  deleted_by            CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY feature_nodes_parent_id_code_deleted_at_key (parent_id, code, deleted_at),
  KEY feature_nodes_path_idx (path(255)),
  KEY feature_nodes_is_visible_deleted_at_idx (is_visible, deleted_at),
  KEY feature_nodes_source_node_id_idx (source_node_id),
  KEY feature_nodes_copied_from_node_id_idx (copied_from_node_id),
  KEY feature_nodes_moved_from_node_id_idx (moved_from_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE features (
  id                    CHAR(36)     NOT NULL,
  node_id               CHAR(36)     NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  code                  VARCHAR(128) NOT NULL,
  summary               VARCHAR(500) DEFAULT NULL,
  description           TEXT         DEFAULT NULL,
  platform              VARCHAR(64)  DEFAULT NULL,
  status                VARCHAR(32)  NOT NULL DEFAULT 'draft',
  priority              VARCHAR(32)  NOT NULL DEFAULT 'medium',
  version               VARCHAR(64)  DEFAULT NULL,
  tags                  TEXT         DEFAULT NULL,
  is_visible            TINYINT(1)   NOT NULL DEFAULT 1,
  is_archived           TINYINT(1)   NOT NULL DEFAULT 0,
  source_feature_id     CHAR(36)     DEFAULT NULL,
  copied_from_id        CHAR(36)     DEFAULT NULL,
  moved_from_node_id    CHAR(36)     DEFAULT NULL,
  move_operation_id     CHAR(36)     DEFAULT NULL,
  copy_operation_id     CHAR(36)     DEFAULT NULL,
  last_copied_at        DATETIME(3)  DEFAULT NULL,
  last_moved_at         DATETIME(3)  DEFAULT NULL,
  remark                TEXT         DEFAULT NULL,
  deleted_at            DATETIME(3)  DEFAULT NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3)  NOT NULL,
  created_by            CHAR(36)     DEFAULT NULL,
  updated_by            CHAR(36)     DEFAULT NULL,
  deleted_by            CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY features_node_id_code_deleted_at_key (node_id, code, deleted_at),
  KEY features_status_deleted_at_idx (status, deleted_at),
  KEY features_is_visible_deleted_at_idx (is_visible, deleted_at),
  KEY features_source_feature_id_idx (source_feature_id),
  KEY features_copied_from_id_idx (copied_from_id),
  KEY features_moved_from_node_id_idx (moved_from_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 日志相关表

```sql
CREATE TABLE request_logs (
  id              CHAR(36)     NOT NULL,
  request_id      CHAR(36)     NOT NULL,
  user_id         CHAR(36)     DEFAULT NULL,
  method          VARCHAR(16)  NOT NULL,
  path            VARCHAR(500) NOT NULL,
  query_string    TEXT         DEFAULT NULL,
  request_body    LONGTEXT     DEFAULT NULL,
  response_status INT          NOT NULL,
  response_body   LONGTEXT     DEFAULT NULL,
  duration_ms     INT          NOT NULL,
  ip_address      VARCHAR(45)  DEFAULT NULL,
  user_agent      TEXT         DEFAULT NULL,
  trace_id        VARCHAR(128) DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY request_logs_request_id_key (request_id),
  KEY request_logs_user_id_created_at_idx (user_id, created_at),
  KEY request_logs_path_created_at_idx (path, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id               CHAR(36)     NOT NULL,
  user_id          CHAR(36)     DEFAULT NULL,
  request_id       CHAR(36)     DEFAULT NULL,
  action           VARCHAR(64)  NOT NULL,
  target_type      VARCHAR(64)  NOT NULL,
  target_id        CHAR(36)     DEFAULT NULL,
  target_name      VARCHAR(255) DEFAULT NULL,
  change_summary   VARCHAR(500) DEFAULT NULL,
  before_data      LONGTEXT     DEFAULT NULL,
  after_data       LONGTEXT     DEFAULT NULL,
  ip_address       VARCHAR(45)  DEFAULT NULL,
  user_agent       TEXT         DEFAULT NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY audit_logs_user_id_created_at_idx (user_id, created_at),
  KEY audit_logs_target_type_target_id_idx (target_type, target_id),
  KEY audit_logs_request_id_idx (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_logs (
  id               CHAR(36)     NOT NULL,
  user_id          CHAR(36)     DEFAULT NULL,
  username         VARCHAR(64)  NOT NULL,
  login_type       VARCHAR(32)  NOT NULL DEFAULT 'password',
  login_status     VARCHAR(32)  NOT NULL,
  failure_reason   VARCHAR(255) DEFAULT NULL,
  ip_address       VARCHAR(45)  DEFAULT NULL,
  user_agent       TEXT         DEFAULT NULL,
  occurred_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY login_logs_user_id_occurred_at_idx (user_id, occurred_at),
  KEY login_logs_username_occurred_at_idx (username, occurred_at),
  KEY login_logs_login_status_occurred_at_idx (login_status, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.5 AI 供应商相关表

```sql
CREATE TABLE ai_providers (
  id                CHAR(36)     NOT NULL,
  name              VARCHAR(128) NOT NULL,
  website_url       VARCHAR(500) DEFAULT NULL,
  api_key_encrypted TEXT         NOT NULL,
  api_key_hint      VARCHAR(32)  NOT NULL,
  request_url       VARCHAR(500) NOT NULL,
  model_name        VARCHAR(128) NOT NULL,
  provider_format   VARCHAR(32)  NOT NULL DEFAULT 'openai_compatible',
  is_default        TINYINT(1)   NOT NULL DEFAULT 0,
  status            VARCHAR(32)  NOT NULL DEFAULT 'active',
  remark            TEXT         DEFAULT NULL,
  deleted_at        DATETIME(3)  DEFAULT NULL,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL,
  created_by        CHAR(36)     DEFAULT NULL,
  updated_by        CHAR(36)     DEFAULT NULL,
  deleted_by        CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ai_providers_name_deleted_at_key (name, deleted_at),
  KEY ai_providers_status_deleted_at_idx (status, deleted_at),
  KEY ai_providers_provider_format_idx (provider_format, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> `api_key_encrypted` 存储 Fernet 加密后的密文，`api_key_hint` 存储脱敏提示（如 `sk-****cdef`），前端仅展示 hint。`provider_format` 取值 `openai_compatible` 或 `anthropic`。

## 4. 本地开发启动指南

### 4.1 环境要求

- Python >= 3.10
- Node.js >= 20
- MySQL 8.0（utf8mb4, InnoDB）
- 本机需安装 `mysql` 客户端命令行工具

### 4.2 配置环境变量

```bash
# 项目根目录（docker-compose 使用）
cp .env.example .env

# 后端（Prisma Client 和 FastAPI 读此文件）
cp backend/.env.example backend/.env

# 前端（Vite 读此文件）
cp frontend/.env.example frontend/.env.local
```

关键配置项：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `mysql://evenji:evenji@localhost:3306/app_feature_repository` | 后端数据库连接（本地开发用 localhost，Docker 内用 mysql） |
| `SECRET_KEY` | `change-this-secret-in-production` | JWT 签名密钥，同时用于 API Key 加密密钥派生 |
| `PORT` | `8001` | 后端服务端口 |
| `VITE_GRAPHQL_ENDPOINT` | `http://localhost:8001/graphql` | 前端 GraphQL 请求地址 |
| `CORS_ORIGINS` | `["http://localhost:3000","http://localhost:5173"]` | 跨域白名单 |

> **重要**：更换 `SECRET_KEY` 后，已加密的 AI 供应商 API Key 将无法解密，需重新配置。

### 4.3 初始化数据库

方式一：手动建表 + 种子数据（推荐，绕过 prisma db push 的 index 长度问题）

```bash
# 1. 创建数据库
mysql -u evenji -pevenji -e "CREATE DATABASE IF NOT EXISTS app_feature_repository CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 建表（10 张表，包含 ai_providers）
mysql -u evenji -pevenji app_feature_repository < docs/init-tables.sql

# 3. 安装后端依赖
cd backend
pip install -r requirements.txt

# 4. 生成 Prisma Client
python -m prisma generate

# 5. 写入种子数据（权限、管理员、示例特征树）
python prisma/seed.py
```

方式二：Windows 初始化脚本

```cmd
cd backend\scripts
init-db.bat
```

> 注意：`init-db.bat` 内部调用 `prisma db push`，在 MySQL 8.0 + utf8mb4 环境下可能因 index key 长度超限而失败。如遇此问题，请使用方式一手动建表。

### 4.4 启动后端

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

验证：

```bash
curl http://localhost:8001/health
# 期望返回: {"status":"ok","database_connected":true}
```

### 4.5 启动前端

```bash
cd frontend
npm install
npm run dev
```

验证：浏览器打开 `http://localhost:5173`，应显示登录页面。

### 4.6 Docker Compose 启动（可选）

```bash
docker compose up --build
```

启动后默认端口：Nginx 80 / 后端 8001 / 前端 3000 / MySQL 3306

## 5. 默认账号与种子数据

| 项目 | 值 |
|------|----|
| 用户名 | `admin` |
| 密码 | `admin123456` |
| 邮箱 | `admin@app-feature.local` |
| 显示名 | `系统管理员` |
| 角色 | `admin`（系统管理员，is_super_admin=true） |

种子脚本创建 19 项权限，覆盖用户/角色/权限/节点/特征/审计/登录日志/AI 的查看与管理操作：

| 权限 code | 模块 | 说明 |
|-----------|------|------|
| `user:list` | system | 用户列表页访问 |
| `system:user:view` | system | 用户查看 |
| `system:user:manage` | system | 用户管理 |
| `role:list` | system | 角色列表页访问 |
| `system:role:manage` | system | 角色管理 |
| `permission:list` | system | 权限列表页访问 |
| `system:permission:view` | system | 权限查看 |
| `node:list` | feature | 节点列表页访问 |
| `feature:node:view` | feature | 节点查看 |
| `feature:node:manage` | feature | 节点管理 |
| `feature:list` | feature | 特征列表页访问 |
| `feature:item:view` | feature | 特征查看 |
| `feature:item:manage` | feature | 特征管理 |
| `audit:log:view` | audit | 审计日志查看 |
| `audit:login:view` | audit | 登录日志查看 |
| `audit:request:view` | audit | 请求日志查看 |
| `ai:provider:list` | ai | AI 供应商列表页访问 |
| `ai:provider:manage` | ai | AI 供应商管理（增删改 + 测试连接） |
| `ai:generate` | ai | AI 生成测试用例 |

特征树示例：`移动端 APP` → `认证中心` → `密码登录`；`个人中心`

特征示例：`账号密码登录成功`、`账号密码错误提示`、`头像编辑与同步`

## 6. 核心能力

### 6.1 认证登录

- JWT 签发 + bcrypt 密码哈希
- 登录成功更新最近登录时间/IP，写入登录日志
- 登录失败记录原因与 IP

### 6.2 特征库管理

**节点（FeatureNode）**

| 操作 | GraphQL Mutation | 说明 |
|------|------------------|------|
| 创建 | `createNode(input)` | 指定 parent_id、name、code、node_type、sort_order，自动计算 path 和 level |
| 更新 | `updateNode(nodeId, input)` | 修改 name/code/parent_id 等，变更 parent_id 或 code 时自动重算 path/level |
| 删除 | `deleteNode(nodeId)` | 软删除（设置 deleted_at） |
| 显示/隐藏 | `showNode` / `hideNode` | 切换 is_visible |
| 复制 | `copyNode(nodeId, targetParentId?, newName?)` | 在目标父节点下创建副本，自动生成不冲突的 code，记录 copied_from_node_id / source_node_id / copy_operation_id |
| 移动 | `moveNode(nodeId, targetParentId?)` | 变更 parent_id，重算 path/level，记录 moved_from_node_id / move_operation_id |
| 树查询 | `nodeTree` | 返回完整节点树（含 children 嵌套） |
| 搜索 | `searchNodes(keyword)` | 按 name/code/path 模糊匹配 |

**特征（Feature）**

| 操作 | GraphQL Mutation | 说明 |
|------|------------------|------|
| 创建 | `createFeature(input)` | 指定 node_id、title、code、summary、description、platform、status、priority、version、tags |
| 更新 | `updateFeature(featureId, input)` | 修改任意字段 |
| 删除 | `deleteFeature(featureId)` | 软删除 |
| 显示/隐藏 | `showFeature` / `hideFeature` | 切换 is_visible |
| 复制 | `copyFeature(featureId, targetNodeId)` | 在目标节点下创建副本，继承全部业务字段，记录 copied_from_id / source_feature_id / copy_operation_id / last_copied_at |
| 移动 | `moveFeature(featureId, targetNodeId)` | 变更 node_id，记录 moved_from_node_id / move_operation_id / last_moved_at |
| 列表 | `featureList(nodeId?)` | 按节点筛选，分页 |
| 搜索 | `searchFeatures(keyword)` | 按 title/code/summary 模糊匹配 |

**关联追踪字段汇总**

| 字段 | 节点 | 特征 | 含义 |
|------|:----:|:----:|------|
| `source_node_id` / `source_feature_id` | Y | Y | 溯源链：指向最原始的节点/特征，多级复制不丢失 |
| `copied_from_node_id` / `copied_from_id` | Y | Y | 直接来源：本次复制操作的源 |
| `moved_from_node_id` | Y | Y | 移动前位置：节点为旧 parent_id，特征为旧 node_id |
| `copy_operation_id` | Y | Y | 复制操作标识：同一批复制共享同一 UUID |
| `move_operation_id` | Y | Y | 移动操作标识：同一次移动共享同一 UUID |
| `last_copied_at` | - | Y | 最近一次被复制的时间 |
| `last_moved_at` | - | Y | 最近一次被移动的时间 |

### 6.3 用户管理

- 列表/创建/编辑/启用禁用/密码重置/角色分配
- 软删除，用户名和邮箱在 deleted_at 维度下唯一

### 6.4 角色权限

- RBAC 模型：用户 → 角色 → 权限 三层授权
- 角色分配权限（`assignPermissionsToRole`），用户分配角色（`assignRolesToUser`）
- 权限树按 module → resource → action 三级组织
- is_super_admin 用户绕过权限检查

### 6.5 AI 供应商管理

- 供应商 CRUD：配置名称、官网、API Key、请求地址、模型名称、接口格式
- API Key 安全：Fernet 加密存储，前端仅展示脱敏提示
- 支持两种接口格式：OpenAI 兼容（DeepSeek/Qwen/Moonshot 等）和 Anthropic
- 测试连接：验证供应商配置是否可用
- 默认供应商：可设置一个默认供应商，生成测试用例时自动选中

### 6.6 AI 生成测试用例

- 在特征管理页多选特征（支持全选/取消），点击"AI 生成"
- 选择供应商，可选填补充要求（如"重点覆盖边界值和异常场景"）
- 后端自动构建提示词：节点层级结构 + 特征详情 + 补充要求
- 返回 Markdown 格式的测试用例（用例标题/前置条件/测试步骤/预期结果/优先级）

### 6.7 日志审计

- 请求日志：中间件自动记录每个 HTTP 请求的 method/path/body/status/duration/ip/user_agent
- 审计日志：业务操作手动触发，记录 action/target_type/target_id/change_summary/before_data/after_data
- 登录日志：登录成功/失败自动写入，记录 login_status/failure_reason/ip/user_agent
- 服务端操作日志：所有 21 个 Mutation 均有 logger.info/warning 记录，时间戳精度到毫秒

## 7. 已知限制

1. `prisma db push` 在 MySQL 8.0 + utf8mb4 环境下因 index key 长度超限（3072 bytes）无法直接建表，需手动执行 SQL（见第 3 节）
2. 当前数据库结构初始化基于手动建表 + `prisma generate`，适合开发环境，不等同于正式迁移方案
3. 生产部署仍需补充 HTTPS、备份、监控与 CI/CD
4. `passlib` 与 `bcrypt >= 4.0` 不兼容，项目已切换为直接使用 `bcrypt` 库
5. 更换 `SECRET_KEY` 后，已加密的 AI 供应商 API Key 将无法解密，需重新配置所有供应商
6. AI 生成测试用例当前为同步等待模式（最长 120 秒），大批量特征建议分批生成

## 8. 文档索引

1. [docs/architecture.md](docs/architecture.md)
2. [docs/database-design.md](docs/database-design.md)
3. [docs/database-initialization.md](docs/database-initialization.md)
4. [docs/init-tables.sql](docs/init-tables.sql)
5. [docs/api-graphql.md](docs/api-graphql.md)
6. [docs/rbac-design.md](docs/rbac-design.md)
7. [docs/logging-audit.md](docs/logging-audit.md)
8. [docs/frontend-pages.md](docs/frontend-pages.md)
9. [docs/deployment.md](docs/deployment.md)
