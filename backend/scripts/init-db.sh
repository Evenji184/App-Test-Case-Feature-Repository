#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BACKEND_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
DEFAULT_DATABASE_URL="mysql://evenji:evenji@localhost:3306/app_feature_repository"

cd "$BACKEND_DIR"

if ! command -v mysql >/dev/null 2>&1; then
  echo "未找到 mysql 客户端，请先安装 MySQL 客户端后再执行初始化脚本。" >&2
  exit 1
fi

DATABASE_URL_VALUE="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"

DB_HOST="$(python -c 'import os; from urllib.parse import urlparse; parsed = urlparse(os.environ["DATABASE_URL_VALUE"]); print(parsed.hostname or "localhost")')"
DB_PORT="$(python -c 'import os; from urllib.parse import urlparse; parsed = urlparse(os.environ["DATABASE_URL_VALUE"]); print(parsed.port or 3306)')"
DB_USER="$(python -c 'import os; from urllib.parse import unquote, urlparse; parsed = urlparse(os.environ["DATABASE_URL_VALUE"]); print(unquote(parsed.username or "evenji"))')"
DB_PASSWORD="$(python -c 'import os; from urllib.parse import unquote, urlparse; parsed = urlparse(os.environ["DATABASE_URL_VALUE"]); print(unquote(parsed.password or "evenji"))')"
DB_NAME="$(python -c 'import os; from urllib.parse import urlparse; parsed = urlparse(os.environ["DATABASE_URL_VALUE"]); print((parsed.path or "/app_feature_repository").lstrip("/") or "app_feature_repository")')"

echo "[1/4] 检查并创建数据库"
MYSQL_PWD="$DB_PASSWORD" mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --execute="CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "[2/4] 生成 Prisma Client"
python -m prisma generate

echo "[3/4] 初始化数据库结构"
python -m prisma db push

echo "[4/4] 写入种子数据"
python prisma/seed.py

echo "数据库初始化完成"
