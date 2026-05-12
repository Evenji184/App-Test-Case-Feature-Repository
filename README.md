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
│     ├─ pages/             # Login / FeatureManage / UserManage / PermissionManage / AiProvider / PromptManage
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
                                          ┌────────▼────────┐
                                          │Prompt Service   │
                                          │(list / delete)  │
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

系统支持可配置的多 AI 供应商调用，用于根据特征数据自动生成测试要点提示词（仅描述"要测什么"，不展开为具体步骤）。

**供应商管理**

- 支持两种接口格式：OpenAI 兼容格式（DeepSeek、Qwen、Moonshot 等）和 Anthropic 格式
- 请求地址（request_url）策略：Anthropic 格式填基础地址（如 `https://api.anthropic.com` 或 `https://api.deepseek.com/anthropic`），后端自动拼接 `/v1/messages`；OpenAI 格式填完整端点（如 `https://api.openai.com/v1/chat/completions`），不做自动拼接
- API Key 使用 Fernet 对称加密存储（密钥从 `SECRET_KEY` 派生），前端仅展示脱敏提示（如 `sk-****cdef`）
- 支持"设为默认供应商"、测试连接、启用/禁用

**提示词生成与管理**

- 在特征管理页多选特征后（需至少选择一个节点或特征），选择供应商和自定义指令，调用 AI 生成测试要点提示词
- 提示词自动包含：节点层级结构 + 特征详情（标题/摘要/描述/平台/优先级/标签）+ 补充要求
- 后端根据 `provider_format` 自动选择 OpenAI 或 Anthropic 请求格式
- OpenAI 格式响应：安全链式取值提取 content 字段，content 为 None 时 fallback 到空字符串
- Anthropic 格式响应：遍历所有 content block，只拼接 `type=text` 的 block，忽略 tool_use 等非文本 block
- AI 返回内容为空时后端抛出 ValidationError，前端提示"AI 供应商返回内容为空"，不会显示"生成成功"
- 生成的提示词自动保存到数据库，可在提示词管理页面查看和管理
- httpx 请求使用 stream 模式 + `decode_content=False` 禁用自动解压，避免代理服务器错误 Content-Encoding 导致解压失败
- `_send_request` 方法增加空响应体、JSON 解析失败、非 dict 响应格式的错误检查，避免静默失败

**提示词管理页面**

- 展示所有通过 AI 生成的提示词记录：提示词内容、发起人、AI 供应商、模型名称
- 支持查看完整提示词详情
- 删除按钮仅超级管理员可见，后端删除也仅允许超级管理员操作

**GraphQL 接口**

| 操作 | 类型 | 说明 |
|------|------|------|
| `aiProviderList(pagination)` | Query | 分页查询供应商列表 |
| `promptList(pagination)` | Query | 分页查询提示词列表 |
| `createAiProvider(input)` | Mutation | 创建供应商（API Key 输入时为明文，存储时自动加密） |
| `updateAiProvider(providerId, input)` | Mutation | 更新供应商（API Key 留空则不修改） |
| `deleteAiProvider(providerId)` | Mutation | 软删除供应商 |
| `testAiConnection(providerId)` | Mutation | 测试供应商连接是否可用 |
| `generatePrompt(input)` | Mutation | 根据选中的节点/特征 ID 调用 AI 生成测试要点提示词，自动保存到数据库 |
| `deletePrompt(promptId)` | Mutation | 软删除提示词记录（超级管理员或拥有 ai:provider:manage 权限） |

## 2. 依赖清单

### 2.1 后端 Python 依赖

> 来源：`backend/requirements.txt`

| 包 | 版本 | 用途 |
|---|------|------|
| fastapi | 0.115.12 | Web 框架 |
| uvicorn[standard] | 0.34.2 | ASGI 服务器 |
| strawberry-graphql[fastapi] | 0.275.5 | GraphQL Schema 与 Resolver |
| prisma | 0.15.0 | 数据库 ORM |
| pydantic | 2.11.3 | 数据验证 |
| pydantic-settings | 2.9.1 | 环境变量配置（读取 `.env`） |
| bcrypt | >=4.0.0 | 密码哈希 |
| python-jose[cryptography] | 3.4.0 | JWT 编解码 |
| python-dotenv | 1.1.0 | .env 文件加载 |
| httpx | >=0.27.0 | 异步 HTTP 客户端（AI 供应商调用） |
| cryptography | >=43.0.0 | API Key Fernet 加密存储 |

> Python 版本要求：>=3.10（代码使用 `from __future__ import annotations`）

### 2.2 前端依赖

> 来源：`frontend/package.json`

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

开发依赖：typescript ^5.6.3 / vite ^5.4.10 / @vitejs/plugin-react ^4.3.4 / @types/react ^18.3.12 / @types/react-dom ^18.3.1 / @types/node ^22.10.2

> Node.js 版本要求：>=20

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

### 3.5 AI 供应商与提示词相关表

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

CREATE TABLE prompts (
  id                CHAR(36)     NOT NULL,
  content           LONGTEXT     NOT NULL,
  provider_id       CHAR(36)     DEFAULT NULL,
  model             VARCHAR(128) DEFAULT NULL,
  usage_info        TEXT         DEFAULT NULL,
  node_ids          TEXT         DEFAULT NULL,
  feature_ids       TEXT         DEFAULT NULL,
  custom_instruction TEXT         DEFAULT NULL,
  deleted_at        DATETIME(3)  DEFAULT NULL,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL,
  created_by        CHAR(36)     DEFAULT NULL,
  updated_by        CHAR(36)     DEFAULT NULL,
  deleted_by        CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY prompts_provider_id_deleted_at_idx (provider_id, deleted_at),
  KEY prompts_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> `api_key_encrypted` 存储 Fernet 加密后的密文，`api_key_hint` 存储脱敏提示（如 `sk-****cdef`），前端仅展示 hint。`provider_format` 取值 `openai_compatible` 或 `anthropic`。

> `prompts` 表存储 AI 生成的测试要点提示词，`provider_id` 可选（供应商删除后置 NULL），`content` 为 AI 返回的完整 Markdown 提示词，`usage_info` 为 JSON 格式的令牌用量统计。

## 4. 本地开发启动指南

### 4.1 环境要求

- Python >= 3.10
- Node.js >= 20
- MySQL 8.0（utf8mb4, InnoDB）
- 本机需安装 `mysql` 客户端命令行工具

### 4.2 配置环境变量

需要配置三份 `.env` 文件：

```bash
# 1. 项目根目录（Docker Compose 读取）
cp .env.example .env

# 2. 后端目录（Prisma Client 和 FastAPI 读取）
cp backend/.env.example backend/.env

# 3. 前端目录（Vite 开发服务器读取）
cp frontend/.env.example frontend/.env.local
```

**后端环境变量**（`backend/.env`，来源：`backend/.env.example` + `app/core/config.py`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `mysql://evenji:evenji@localhost:3306/app_feature_repository` | 数据库连接（本地用 localhost，Docker 内用 mysql 服务名） |
| `SECRET_KEY` | `change-this-secret-in-production` | JWT 签名密钥 + API Key 加密密钥派生 |
| `JWT_ALGORITHM` | `HS256` | JWT 签名算法 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT 有效期（分钟） |
| `HOST` | `0.0.0.0` | 后端监听地址 |
| `PORT` | `8001` | 后端服务端口 |
| `FRONTEND_HOST` | `localhost` | 前端地址（CORS 自动生成依据） |
| `FRONTEND_PORT` | `5173` | 前端端口（CORS 自动生成依据） |
| `FRONTEND_SCHEME` | `http` | 前端协议（http/https） |
| `CORS_ORIGINS` | （空，自动生成） | 跨域白名单，逗号分隔；留空则根据 FRONTEND_* 自动生成 |
| `IP_WHITELIST` | （空，允许所有） | IP 访问白名单，逗号分隔；留空则允许所有 IP |
| `LOG_LEVEL` | `INFO` | 日志级别 |
| `LOG_JSON` | `false` | 是否输出 JSON 格式日志 |

> **重要**：更换 `SECRET_KEY` 后，已加密的 AI 供应商 API Key 将无法解密，需重新配置。

**前端环境变量**（`frontend/.env.local`，来源：`frontend/.env.example`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_SCHEME` | `http` | 前端请求后端协议 |
| `VITE_API_HOST` | `localhost` | 前端请求后端地址 |
| `VITE_API_PORT` | `8001` | 前端请求后端端口 |
| `VITE_APP_TITLE` | `APP 特征库管理系统` | 应用标题 |

> `.env` 文件路径使用绝对路径计算（`Path(__file__).resolve().parent.parent.parent / ".env"`），不依赖进程工作目录。

### 4.3 初始化数据库

方式一：手动建表 + 种子数据（推荐，绕过 `prisma db push` 的 index 长度超限问题）

```bash
# 1. 创建数据库
mysql -u evenji -pevenji -e "CREATE DATABASE IF NOT EXISTS app_feature_repository CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 建表（12 张表，包含 ai_providers 和 prompts）
mysql -u evenji -pevenji app_feature_repository < docs/init-tables.sql

# 3. 安装后端依赖
cd backend
pip install -r requirements.txt

# 4. 生成 Prisma Client
python -m prisma generate

# 5. 写入种子数据（23 项权限、admin 用户、示例特征树）
python prisma/seed.py
```

方式二：初始化脚本（Linux/macOS）

```bash
cd backend/scripts
bash init-db.sh
```

方式三：初始化脚本（Windows）

```cmd
cd backend\scripts
init-db.bat
```

> 注意：`init-db.sh` 和 `init-db.bat` 内部调用 `prisma db push`，在 MySQL 8.0 + utf8mb4 环境下可能因 index key 长度超限（3072 bytes）而失败。如遇此问题，请使用方式一手动建表。脚本会自动从 `DATABASE_URL` 环境变量解析数据库连接信息。

### 4.4 启动后端

```bash
cd backend
pip install -r requirements.txt   # 首次需安装依赖
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
npm install    # 首次需安装依赖
npm run dev
```

验证：浏览器打开 `http://localhost:5173`，应显示登录页面。

### 4.6 Docker Compose 启动（可选）

```bash
cp .env.example .env    # 首次需配置
docker compose up --build
```

启动后默认端口：Nginx 80 / 后端 8001 / 前端 3000 / MySQL 3306

Docker Compose 会自动执行 `prisma generate` → `prisma db push` → `seed.py` → `uvicorn`。

## 5. 默认账号与种子数据

| 项目 | 值 |
|------|----|
| 用户名 | `admin` |
| 密码 | `admin123456` |
| 邮箱 | `admin@app-feature.local` |
| 显示名 | `系统管理员` |
| 角色 | `admin`（系统管理员，is_super_admin=true） |

种子脚本创建 23 项权限，覆盖用户/角色/权限/节点/特征/审计/登录日志/AI 的查看与管理操作。其中 `user:delete` 和 `role:delete` 为超级管理员专属权限，不分配给系统管理员角色（super_admin 用户通过标志位绕过权限检查，不受此限制）。提示词删除（`deletePrompt`）仅超级管理员可操作，不走 RBAC 权限码：

| 权限 code | 模块 | 说明 | admin 角色 |
|-----------|------|------|:----------:|
| `user:list` | system | 用户列表页访问 | Y |
| `system:user:view` | system | 用户查看 | Y |
| `system:user:manage` | system | 用户管理 | Y |
| `user:delete` | system | 用户删除（软删除） | — |
| `role:list` | system | 角色列表页访问 | Y |
| `system:role:manage` | system | 角色管理 | Y |
| `role:delete` | system | 角色删除 | — |
| `permission:list` | system | 权限列表页访问 | Y |
| `system:permission:view` | system | 权限查看 | Y |
| `node:list` | feature | 节点列表页访问 | Y |
| `feature:node:view` | feature | 节点查看 | Y |
| `feature:node:manage` | feature | 节点管理 | Y |
| `feature:list` | feature | 特征列表页访问 | Y |
| `feature:item:view` | feature | 特征查看 | Y |
| `feature:item:manage` | feature | 特征管理 | Y |
| `audit:log:view` | audit | 审计日志查看 | Y |
| `audit:login:view` | audit | 登录日志查看 | Y |
| `audit:request:view` | audit | 请求日志查看 | Y |
| `ai:provider:list` | ai | AI 供应商列表页访问 | Y |
| `ai:provider:manage` | ai | AI 供应商管理（增删改 + 测试连接） | Y |
| `ai:generate` | ai | AI 生成提示词 | Y |
| `ai:prompt:list` | ai | 提示词列表页访问 | Y |

特征树示例：`移动端 APP` → `认证中心` → `密码登录`；`个人中心`

特征示例：`账号密码登录成功`、`账号密码错误提示`、`头像编辑与同步`

## 6. 核心能力

### 6.1 认证登录

- JWT 签发 + bcrypt 密码哈希
- 登录成功更新最近登录时间/IP，写入登录日志
- 登录失败记录原因与 IP
- 退出登录：主布局提供"退出登录"按钮，清除前端 token/用户数据并调用后端 logout mutation
- 修改密码：登录用户可在主布局点击"修改密码"，输入旧密码和新密码（至少 6 位）

### 6.2 特征库管理

**节点（FeatureNode）**

| 操作 | GraphQL Mutation | 说明 |
|------|------------------|------|
| 创建 | `createNode(input)` | 指定 parent_id、name、code、node_type、sort_order，自动计算 path 和 level |
| 更新 | `updateNode(nodeId, input)` | 修改 name/code/parent_id 等，变更 parent_id 或 code 时自动重算 path/level |
| 删除 | `deleteNode(nodeId)` | 软删除（设置 deleted_at） |
| 显示/隐藏 | `showNode` / `hideNode` | 切换 is_visible |
| 复制 | `copyNode(nodeId, targetParentId?, newName?)` | 在目标父节点下创建副本（可选择有子节点的父节点作为目标），自动生成不冲突的 code |
| 移动 | `moveNode(nodeId, targetParentId?)` | 变更 parent_id，重算 path/level，可选择有子节点的父节点作为目标 |
| 树查询 | `nodeTree` | 返回完整节点树（含 children 嵌套） |
| 搜索 | `searchNodes(keyword)` | 按 name/code/path 模糊匹配 |

**节点多选筛选**

- 节点树支持 checkbox 多选（跨层级），勾选后合并展示所选节点下的特征
- 选择父节点时自动包含所有子节点（后代）的特征
- 选择子节点时仅展示该子节点下的特征
- 未勾选任何节点时展示全部特征
- 仅勾选 1 个节点时可编辑/删除/复制/移动该节点
- 新建特征按钮在未选中节点时禁用，避免 nodeId 为空

**按钮权限守卫**

各页面操作按钮根据用户权限动态显示/隐藏，无权限的按钮不渲染：

| 页面 | 按钮 | 所需权限 |
|------|------|----------|
| 特征库 | 新建/编辑/删除/复制/移动节点 | `feature:node:manage` |
| 特征库 | 新建特征 | `feature:item:manage`（未选中节点时禁用） |
| 特征库 | 新建/编辑/隐藏/删除/复制/移动特征 | `feature:item:manage` |
| 特征库 | AI 生成提示词 | `ai:generate` |
| AI 供应商 | 新建/编辑/删除/测试连接 | `ai:provider:manage` |
| 提示词管理 | 删除提示词 | `isSuperAdmin` 或 `ai:provider:manage` |
| 权限管理 | 新建角色/编辑/分配权限 | `system:role:manage` |
| 权限管理 | 删除角色 | `isSuperAdmin` |
| 人员管理 | 新建人员 | `system:user:manage` |
| 人员管理 | 禁用/启用用户 | `system:user:manage` |
| 人员管理 | 删除用户 | `isSuperAdmin` |
| 人员管理 | 超级管理员开关 | `isSuperAdmin` |

**特征（Feature）**

| 操作 | GraphQL Mutation | 说明 |
|------|------------------|------|
| 创建 | `createFeature(input)` | 指定 node_id、title、code、summary、description、platform、status、priority、version、tags |
| 更新 | `updateFeature(featureId, input, expectedUpdatedAt?)` | 修改任意字段，支持乐观锁：传入 updatedAt 做冲突检测，不匹配返回 CONFLICT 错误 |
| 删除 | `deleteFeature(featureId)` | 软删除 |
| 显示/隐藏 | `showFeature` / `hideFeature` | 切换 is_visible；隐藏特征默认不在列表中显示，管理页面传 `includeHidden=true` 可查看并恢复 |
| 复制 | `copyFeature(featureId, targetNodeId)` | 在目标节点下创建副本，继承全部业务字段，记录 copied_from_id / source_feature_id / copy_operation_id / last_copied_at |
| 移动 | `moveFeature(featureId, targetNodeId)` | 变更 node_id，记录 moved_from_node_id / move_operation_id / last_moved_at |
| 列表 | `featureList(nodeIds?)` | 按多个节点筛选（含后代），不传则返回全部，分页 |

**并发编辑冲突检测**

- 特征更新支持乐观锁：前端保存时带 `expectedUpdatedAt`（打开编辑时的 updatedAt 值）
- 后端比对数据库当前 `updated_at`，不匹配则返回 `CONFLICT` 错误（code: "CONFLICT"）
- 前端冲突时弹出 Dialog：选择"强制保存"（不带 expectedUpdatedAt 重发）或"刷新重编"（重新拉取最新数据）
- 不传 `expectedUpdatedAt` 时跳过检查，兼容强制覆盖场景
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

- 列表/创建/编辑/启用禁用/密码重置/角色分配/删除
- 修改密码：登录用户可在主布局点击"修改密码"按钮，输入旧密码和新密码修改自身密码（新密码至少 6 位，需确认密码一致）
- 未分配角色的用户无法启用
- 分配角色时默认勾选已有角色，分配权限时默认勾选已有权限
- 软删除，用户名和邮箱在 deleted_at 维度下唯一
- 权限可见性控制：
  - 超级管理员（is_super_admin）用户：页面隐藏编辑/禁用/删除等操作按钮，后端禁用时自动回写为启用，禁止删除
  - 删除用户按钮：仅超级管理员可见
  - 禁用/启用用户按钮：仅拥有 `system:user:manage` 权限或超级管理员可见
  - 超级管理员开关（编辑表单中的 Switch）：仅超级管理员可见和操作
- 并发编辑冲突检测：更新特征时带 updatedAt 乐观锁，后端比对不匹配返回 CONFLICT 错误，前端弹 Dialog 选择"强制保存"或"刷新重编"

### 6.4 角色权限

- RBAC 模型：用户 → 角色 → 权限 三层授权
- 系统管理员角色（admin）拥有除超级管理员专属权限外的全部 20 个权限（`user:delete` 和 `role:delete` 不分配给角色，仅 super_admin 用户通过标志位绕过）
- 角色分配权限（`assignPermissionsToRole`），用户分配角色（`assignRolesToUser`）
- 删除角色（`deleteRole`）：软删除，同时软删除关联的 role_permissions 和 user_roles
- 分配时默认勾选已有角色/权限，支持增量调整
- 权限树按 module → resource → action 三级组织
- is_super_admin 用户绕过权限检查
- 系统角色（is_system=true）：页面隐藏编辑、权限分配和删除按钮，后端禁止修改、权限变更和删除
- 删除角色按钮：仅超级管理员可见，且系统角色不显示删除按钮
- 前端导航 TabBar 根据权限动态过滤：特征库 Tab 对所有登录用户可见（管理按钮按权限隐藏），其他 Tab 需对应 `xxx:list` 权限

### 6.5 AI 供应商管理

- 供应商 CRUD：配置名称、官网、API Key、请求地址、模型名称、接口格式
- API Key 安全：Fernet 加密存储，前端仅展示脱敏提示
- 支持两种接口格式：OpenAI 兼容（DeepSeek/Qwen/Moonshot 等）和 Anthropic
- 请求地址策略：Anthropic 格式填基础地址（后端自动拼接 `/v1/messages`），OpenAI 格式填完整端点
- 测试连接：验证供应商配置是否可用
- 默认供应商：可设置一个默认供应商，生成提示词时自动选中

### 6.6 AI 生成提示词

- 在特征管理页多选特征（支持全选/取消），点击"AI 生成"
- 生成前校验：至少需选择一个节点或特征，否则提示用户
- 选择供应商，可选填补充要求（如"重点覆盖边界值和异常场景"）
- 后端自动构建提示词：节点层级结构 + 特征详情 + 补充要求
- 返回 Markdown 格式的测试要点提示词（仅描述"要测什么"，不展开为具体步骤和预期结果）
- 生成的提示词自动保存到数据库，可在提示词管理页面查看详情
- 提示词管理页面展示：提示词内容、发起人、AI 供应商、模型名称、创建时间
- 删除提示词：超级管理员或拥有 `ai:provider:manage` 权限的用户可见删除按钮，后端同样允许这两种身份操作

### 6.7 日志审计

- 请求日志：中间件自动记录每个 HTTP 请求的 method/path/body/status/duration/ip/user_agent
- 审计日志：业务操作手动触发，记录 action/target_type/target_id/change_summary/before_data/after_data
- 登录日志：登录成功/失败自动写入，记录 login_status/failure_reason/ip/user_agent
- 服务端操作日志：所有 22 个 Mutation 均有 logger.info/warning 记录，时间戳精度到毫秒

## 7. 已知限制

1. `prisma db push` 在 MySQL 8.0 + utf8mb4 环境下因 index key 长度超限（3072 bytes）无法直接建表，需手动执行 SQL（见第 3 节）
2. 当前数据库结构初始化基于手动建表 + `prisma generate`，适合开发环境，不等同于正式迁移方案
3. 生产部署仍需补充 HTTPS、备份、监控与 CI/CD
4. `passlib` 与 `bcrypt >= 4.0` 不兼容，项目已切换为直接使用 `bcrypt` 库
5. 更换 `SECRET_KEY` 后，已加密的 AI 供应商 API Key 将无法解密，需重新配置所有供应商
6. AI 生成提示词当前为同步等待模式（最长 120 秒），大批量特征建议分批生成
7. GraphQL mutation 仅捕获 `AppError` 时，非 AppError 异常（如网络错误、解析失败）会变成 GraphQL 内部错误；关键 mutation（`create_user`、`generate_prompt`、`test_ai_connection`）已增加 `except Exception` 兜底

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
