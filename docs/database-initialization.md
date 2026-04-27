# 数据库初始化指南

## 1. 适用范围

本文档适用于当前项目的 MySQL 数据库初始化、重建与种子数据写入流程。数据库模型定义见 [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)，初始化脚本见 [`backend/scripts/init-db.sh`](../backend/scripts/init-db.sh) 与 [`backend/scripts/init-db.bat`](../backend/scripts/init-db.bat)。

## 2. 数据库要求

- MySQL 8.0 或更高版本
- 推荐字符集：`utf8mb4`
- 推荐排序规则：`utf8mb4_unicode_ci`
- 默认数据库名：`app_feature_repository`

## 3. 创建数据库命令

### 3.1 本地 MySQL 手动创建数据库

```sql
CREATE DATABASE IF NOT EXISTS app_feature_repository
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Windows 或 Linux/macOS 命令行可直接执行：

```bash
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS app_feature_repository CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3.2 Docker 启动时自动创建数据库

[`docker-compose.yml`](../docker-compose.yml) 中的 [`MYSQL_DATABASE`](../docker-compose.yml:13) 会在容器首次启动时自动创建数据库，因此通常只需执行：

```bash
docker compose up -d mysql
```

## 4. 初始化数据库结构命令

### 4.1 本地开发环境

```bash
cd backend
python -m prisma generate
python -m prisma db push
python prisma/seed.py
```

### 4.2 Docker 环境

```bash
docker compose up -d mysql
docker compose run --rm backend sh -c "prisma generate && prisma db push && python prisma/seed.py"
```

### 4.3 使用项目脚本

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

## 5. 数据库重建命令

### 5.1 本地 MySQL 重建

```bash
mysql -uroot -proot -e "DROP DATABASE IF EXISTS app_feature_repository; CREATE DATABASE app_feature_repository CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cd backend
python -m prisma db push
python prisma/seed.py
```

### 5.2 Docker 环境重建

```bash
docker compose down -v
docker compose up -d mysql
docker compose run --rm backend sh -c "prisma generate && prisma db push && python prisma/seed.py"
```

## 6. 初始化结果验证

### 6.1 检查表结构

```bash
mysql -uroot -proot app_feature_repository -e "SHOW TABLES;"
```

### 6.2 检查管理员种子数据

```bash
mysql -uroot -proot app_feature_repository -e "SELECT username, email, is_super_admin FROM User;"
```

### 6.3 检查后端健康状态

```bash
curl http://localhost:8000/health
```

## 7. 说明

- [`prisma db push`](../backend/scripts/init-db.sh:13) 适合开发、联调与演示环境。
- 若用于正式生产环境，建议补充版本化迁移、备份恢复与回滚方案。
- 若通过 Docker 首次启动，数据库创建通常由 [`MYSQL_DATABASE`](../docker-compose.yml:13) 自动完成，表结构仍需通过 Prisma 初始化。
