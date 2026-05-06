# 数据库初始化指南

## 1. 适用范围

本文档适用于当前项目的 MySQL 数据库初始化、重建与种子数据写入流程。数据库模型定义见 [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)，建表 SQL 脜见 [`docs/init-tables.sql`](./init-tables.sql)。

## 2. 数据库要求

- MySQL 8.0 或更高版本
- 字符集：`utf8mb4`
- 排序规则：`utf8mb4_unicode_ci`
- 存储引擎：InnoDB（DYNAMIC row format）
- 默认数据库名：`app_feature_repository`
- 默认数据库账号：`evenji`
- 默认数据库密码：`evenji`

## 3. 初始化方式

### 3.1 方式一：手动建表（推荐）

> 由于 `prisma db push` 在 MySQL 8.0 + utf8mb4 环境下存在 index key 长度超限问题（`Specified key was too long; max key length is 3072 bytes`），推荐使用手动建表。

```bash
# 1. 一键建表（含建库）
mysql -uevenji -pevenji < docs/init-tables.sql

# 2. 生成 Prisma Client
cd backend
DATABASE_URL="mysql://evenji:evenji@localhost:3306/app_feature_repository" python -m prisma generate

# 3. 写入种子数据
DATABASE_URL="mysql://evenji:evenji@localhost:3306/app_feature_repository" python prisma/seed.py
```

### 3.2 方式二：prisma db push（可能失败）

```bash
cd backend
DATABASE_URL="mysql://evenji:evenji@localhost:3306/app_feature_repository" python -m prisma generate
DATABASE_URL="mysql://evenji:evenji@localhost:3306/app_feature_repository" python -m prisma db push
DATABASE_URL="mysql://evenji:evenji@localhost:3306/app_feature_repository" python prisma/seed.py
```

> 若遇到 `Specified key was too long; max key length is 3072 bytes` 错误，请改用方式一。

### 3.3 方式三：初始化脚本

Linux/macOS：

```bash
cd backend
./scripts/init-db.sh
```

Windows：

```bat
cd backend
scripts\init-db.bat
```

> 注意：脚本内部调用 `prisma db push`，同样可能遇到上述 index key 长度问题。

### 3.4 方式四：Docker 自动初始化

```bash
docker compose up --build
```

Docker 编排会在 backend 容器启动时自动执行 `prisma generate`、`prisma db push` 和 `python prisma/seed.py`。

## 4. 数据库重建

### 4.1 本地 MySQL 重建（推荐方式）

```bash
mysql -uevenji -pevenji < docs/init-tables.sql
cd backend
DATABASE_URL="mysql://evenji:evenji@localhost:3306/app_feature_repository" python -m prisma generate
DATABASE_URL="mysql://evenji:evenji@localhost:3306/app_feature_repository" python prisma/seed.py
```

### 4.2 Docker 环境重建

```bash
docker compose down -v
docker compose up --build
```

## 5. 初始化结果验证

### 5.1 检查表结构

```bash
mysql -uevenji -pevenji app_feature_repository -e "SHOW TABLES;"
```

期望返回 10 张表：users, roles, permissions, user_roles, role_permissions, feature_nodes, features, request_logs, audit_logs, login_logs

### 5.2 检查管理员种子数据

```bash
mysql -uevenji -pevenji app_feature_repository -e "SELECT username, email, is_super_admin FROM users;"
```

### 5.3 检查后端健康状态

```bash
curl http://localhost:8000/health
# 期望返回: {"status":"ok","database_connected":true}
```

## 6. 说明

- 手动建表 SQL（[`docs/init-tables.sql`](./init-tables.sql)）与 Prisma schema 保持一致，但规避了 `prisma db push` 的 index 长度问题
- 若用于正式生产环境，建议补充版本化迁移、备份恢复与回滚方案
- 本地执行初始化脚本前，需确保系统已安装 `mysql` 客户端
- Docker 首次启动时，数据库创建由 `MYSQL_DATABASE` 环境变量自动完成