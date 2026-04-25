#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BACKEND_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"

cd "$BACKEND_DIR"

echo "[1/3] 生成 Prisma Client"
python -m prisma generate

echo "[2/3] 初始化数据库结构"
python -m prisma db push

echo "[3/3] 写入种子数据"
python prisma/seed.py

echo "数据库初始化完成"
