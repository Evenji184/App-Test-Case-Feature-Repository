@echo off
setlocal

cd /d "%~dp0.."

echo [1/3] 生成 Prisma Client
python -m prisma generate
if errorlevel 1 goto :error

echo [2/3] 初始化数据库结构
python -m prisma db push
if errorlevel 1 goto :error

echo [3/3] 写入种子数据
python prisma\seed.py
if errorlevel 1 goto :error

echo 数据库初始化完成
exit /b 0

:error
echo 数据库初始化失败
exit /b 1
