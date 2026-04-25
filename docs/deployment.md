# 开发与生产部署说明

## 1. 部署概览

项目提供两套 Docker Compose 配置：

- 开发环境：[`docker-compose.yml`](../docker-compose.yml)
- 生产环境覆盖：[`docker-compose.prod.yml`](../docker-compose.prod.yml)

容器角色：

- `mysql`：实际为 PostgreSQL 数据库容器
- `backend`：FastAPI + GraphQL 服务
- `frontend`：前端占位容器
- `nginx`：统一入口与反向代理

## 2. 环境变量

示例文件：[`/.env.example`](../.env.example)

关键变量如下：

| 变量 | 说明 |
| --- | --- |
| `POSTGRES_USER` | 数据库用户名 |
| `POSTGRES_PASSWORD` | 数据库密码 |
| `POSTGRES_DB` | 数据库名 |
| `POSTGRES_PORT` | 数据库端口 |
| `APP_NAME` | 后端服务名 |
| `APP_VERSION` | 版本号 |
| `ENVIRONMENT` | 环境标识 |
| `DEBUG` | 是否调试 |
| `HOST` | 后端监听地址 |
| `PORT` | 后端端口 |
| `SECRET_KEY` | JWT 密钥 |
| `JWT_ALGORITHM` | JWT 算法 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间 |
| `DATABASE_URL` | 数据库连接串 |
| `LOG_LEVEL` | 日志级别 |
| `LOG_JSON` | 是否 JSON 日志 |
| `FRONTEND_PORT` | 前端容器端口 |
| `NGINX_PORT` | Nginx 暴露端口 |
| `CORS_ORIGINS` | 允许跨域来源 |

## 3. 开发环境启动

### 3.1 准备配置

```bash
cp .env.example .env
```

Windows 可手动复制文件。

### 3.2 启动命令

```bash
docker compose up --build
```

### 3.3 开发环境服务说明

#### 数据库容器

定义见 [`docker-compose.yml`](../docker-compose.yml:2)。

特点：

- 镜像：`postgres:16-alpine`
- 端口映射：`${POSTGRES_PORT:-5432}:5432`
- 数据卷：`postgres_data`
- 健康检查：`pg_isready`

#### 后端容器

定义见 [`docker-compose.yml`](../docker-compose.yml:26)。

特点：

- 构建文件：[`docker/backend.Dockerfile`](../docker/backend.Dockerfile)
- 端口映射：`${PORT:-8000}:8000`
- 挂载源码目录 `./backend:/app`
- 启动命令：
  - `prisma generate`
  - `prisma db push`
  - `uvicorn app.main:app --reload`

#### 前端容器

定义见 [`docker-compose.yml`](../docker-compose.yml:57)。

特点：

- 构建文件：[`docker/frontend.Dockerfile`](../docker/frontend.Dockerfile)
- 当前仅提供占位静态页
- 健康检查访问 `http://127.0.0.1:3000`

#### Nginx 容器

定义见 [`docker-compose.yml`](../docker-compose.yml:74)。

特点：

- 镜像：`nginx:1.27-alpine`
- 端口映射：`${NGINX_PORT:-80}:80`
- 配置文件：[`docker/nginx.conf`](../docker/nginx.conf)

## 4. 生产环境启动

### 4.1 启动命令

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### 4.2 生产覆盖项

见 [`docker-compose.prod.yml`](../docker-compose.prod.yml)：

- `restart: always`
- 数据库不暴露端口
- 后端 `DEBUG=false`
- 后端 `ENVIRONMENT=production`
- 后端使用 `uvicorn --workers 2`
- 前端不暴露端口
- 仅 Nginx 对外暴露

## 5. Dockerfile 说明

### 5.1 后端镜像

文件：[`docker/backend.Dockerfile`](../docker/backend.Dockerfile)

流程：

1. 基于 `python:3.11-slim`
2. 安装构建依赖
3. 安装 [`requirements.txt`](../backend/requirements.txt)
4. 复制后端代码
5. 创建 `appuser`
6. 启动时执行 `prisma generate && uvicorn`

### 5.2 前端镜像

文件：[`docker/frontend.Dockerfile`](../docker/frontend.Dockerfile)

当前实现：

- 基于 `node:20-alpine`
- 安装 `serve`
- 直接生成一个占位 `index.html`
- 通过 `serve -s /app/public -l 3000` 启动

这意味着当前 Docker 前端并未打包 [`frontend`](../frontend) 目录中的真实 React 工程。

## 6. 本地非 Docker 启动

### 6.1 后端

```bash
cd backend
pip install -r requirements.txt
python -m prisma generate
python -m prisma db push
python prisma/seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6.2 前端

```bash
cd frontend
npm install
npm run dev
```

## 7. 数据库初始化

### 7.1 脚本方式

- Linux/macOS：[`init-db.sh`](../backend/scripts/init-db.sh)
- Windows：[`init-db.bat`](../backend/scripts/init-db.bat)

### 7.2 初始化内容

1. 生成 Prisma Client
2. 推送数据库结构
3. 写入种子数据

## 8. 健康检查

后端健康检查接口：[`/health`](../backend/app/main.py:114)

返回：

- `status`
- `service`
- `version`
- `database_connected`

Nginx 与后端容器健康检查均依赖该接口或本地 HTTP 探测。

## 9. 默认账号与访问入口

### 9.1 默认账号

- 用户名：`admin`
- 密码：`admin123456`

来源：[`upsert_admin_user()`](../backend/prisma/seed.py:169)

### 9.2 访问入口

- Nginx：`http://localhost:${NGINX_PORT}`
- 后端健康检查：`http://localhost:${PORT}/health`
- GraphQL：`http://localhost:${PORT}/graphql` 或经 Nginx 转发的 `/graphql`

## 10. 生产部署建议

基于当前代码，生产前至少应完成：

1. 修正 [`schema.prisma`](../backend/prisma/schema.prisma:6) 的 provider 与实际数据库一致
2. 将 [`docker/frontend.Dockerfile`](../docker/frontend.Dockerfile:1) 替换为真实前端构建镜像
3. 更换强随机 `SECRET_KEY`
4. 收紧 `CORS_ORIGINS`
5. 增加 HTTPS、证书与反向代理安全头
6. 增加数据库备份与日志轮转

## 11. 已知限制

1. 前端容器是占位页，不是正式前端产物
2. Compose 服务名 `mysql` 与实际 PostgreSQL 不一致
3. `prisma db push` 适合开发/演示，不等同于正式迁移方案
4. 未提供 CI/CD、镜像仓库、灰度发布等生产能力
